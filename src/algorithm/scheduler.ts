import { Day, createDay, getCalendarWeekIndex } from '../types/day';
import { Employee } from '../types/employee';
import { EmployeeStatus, ShiftCategory, ShiftDefinition, ShiftSlot,
         CoverageRequirement, SHIFT_DEFINITIONS, VALID_PT_HOURS } from '../types/shift';
import { MonthSchedule, buildMonthSchedule, daysInMonth } from '../types/schedule';
import { getDefaultRequirements } from '../data/defaults';
import { SeededRandom } from './seeded-random';
import {
  pickBestEmployee, addHours, getWeeklyHours,
  isFullTimeSlot, isProgrammingSlot,
} from './scorer';

// ---------------------------------------------------------------------------
// Slot generation — decompose CoverageRequirements into concrete ShiftSlots
// ---------------------------------------------------------------------------

let slotIdCounter = 0;
function nextSlotId(): string {
  return `slot-${++slotIdCounter}`;
}

/**
 * Decompose a CoverageRequirement into one or more ShiftSlots.
 *
 * Full Time (PIC):
 *   - Window ≤ 9h  → one 8h shift starting at coverageStart
 *   - Window = 12h → two overlapping 8h shifts (open+8, close-8)
 *
 * Part Time (all others):
 *   - Greedy, longest-first: fill [coverageStart, coverageEnd] with
 *     valid durations [8, 6, 4] without exceeding coverageEnd.
 *
 * Programming:
 *   - Treated like Part Time for slot sizing.
 */
function decomposeRequirement(
  req: CoverageRequirement,
): ShiftSlot[] {
  const def   = SHIFT_DEFINITIONS[req.category];
  const start = req.coverageStart;
  const end   = req.coverageEnd;
  const window = end - start;

  if (def.requiredStatus === EmployeeStatus.FullTime) {
    // PIC: exactly 8h FT shifts
    if (window <= 9) {
      return [makeSlot(def, start, start + 8)];
    }
    // 12h day: two overlapping 8h shifts
    return [
      makeSlot(def, start,   start + 8),
      makeSlot(def, end - 8, end),
    ];
  }

  // PT / Programming: greedy [8, 6, 4]
  const slots: ShiftSlot[] = [];
  let cursor = start;

  while (cursor < end) {
    let placed = false;
    for (const dur of VALID_PT_HOURS) {
      if (cursor + dur <= end) {
        slots.push(makeSlot(def, cursor, cursor + dur));
        cursor += dur;
        placed = true;
        break;
      }
    }
    if (!placed) break; // remaining window too small for smallest PT shift
  }

  return slots;
}

function makeSlot(def: ShiftDefinition, start: number, end: number): ShiftSlot {
  return {
    id:                 nextSlotId(),
    definition:         def,
    startHour:          start,
    endHour:            end,
    assignedEmployeeId: null,
  };
}

// ---------------------------------------------------------------------------
// Programming-slot injection from CSV-style overrides
// ---------------------------------------------------------------------------

/**
 * Adds Programming CoverageRequirements to a Day based on a count.
 * Programming shifts are standard 4h slots starting at open time.
 */
export function injectProgrammingSlots(day: Day, count: number): void {
  for (let i = 0; i < count; i++) {
    day.requirements.push({
      category:      ShiftCategory.Programming,
      coverageStart: day.openHour,
      coverageEnd:   day.openHour + 4,
    });
  }
}

// ---------------------------------------------------------------------------
// Main scheduler
// ---------------------------------------------------------------------------

export interface SchedulerOptions {
  year:      number;
  month:     number; // 0-indexed
  seed:      number;
  employees: Employee[];
  /**
   * Optional per-date overrides. Key = 'YYYY-MM-DD'.
   * { holiday: true } → mark day closed.
   * { requirements: [...] } → replace default requirements entirely.
   * { addProgramming: N }   → append N programming slots.
   */
  overrides?: Map<string, DayOverride>;
}

export interface DayOverride {
  holiday?:       boolean;
  requirements?:  CoverageRequirement[];
  addProgramming?: number;
}

/**
 * Build and fill a complete month schedule.
 *
 * Phase 1  – Generate Days with requirements from defaults + overrides.
 * Phase 2  – Decompose requirements into ShiftSlots.
 * Phase 3  – Assign Full-Time employees to PIC slots first.
 * Phase 4  – Top-up FT employees to 40h/week using any open 8h PT slots.
 * Phase 5  – Fill remaining PT slots with PT employees.
 * Phase 6  – Fill Programming slots.
 */
export function runScheduler(options: SchedulerOptions): MonthSchedule {
  slotIdCounter = 0; // reset so IDs are deterministic per run
  const { year, month, seed, employees, overrides = new Map() } = options;
  const rng = new SeededRandom(seed);

  // --- Phase 1: Build Day objects ---
  const numDays = daysInMonth(year, month);
  const days: Day[] = [];

  for (let d = 1; d <= numDays; d++) {
    const date    = new Date(year, month, d);
    const dateStr = toDateStr(date);
    const ov      = overrides.get(dateStr);

    const day = createDay(date, ov?.holiday === true);

    if (!day.isClosed) {
      if (ov?.requirements !== undefined) {
        day.requirements = ov.requirements;
      } else {
        day.requirements = getDefaultRequirements(day.dayOfWeek);
      }
      if ((ov?.addProgramming ?? 0) > 0) {
        injectProgrammingSlots(day, ov!.addProgramming!);
      }
    }

    days.push(day);
  }

  // --- Phase 2: Decompose requirements into ShiftSlots ---
  for (const day of days) {
    if (day.isClosed) continue;
    for (const req of day.requirements) {
      const slots = decomposeRequirement(req);
      day.assignments.push(...slots);
    }
  }

  // --- Setup tracking ---
  const totalWeeks = Math.max(...days.map(d =>
    getCalendarWeekIndex(d.date, year, month)
  )) + 1;

  const weeklyHours = new Map<string, number[]>();
  const prevDayLastHour = new Map<string, number>(); // end hour of previous day's last shift

  const ftEmployees   = employees.filter(e => e.status === EmployeeStatus.FullTime);
  const ptEmployees   = employees.filter(e => e.status === EmployeeStatus.PartTime);
  const progEmployees = employees.filter(e => e.status === EmployeeStatus.Programming);

  // --- Phase 3: Fill PIC slots with FT employees ---
  for (const day of days) {
    if (day.isClosed) continue;
    const weekIndex = getCalendarWeekIndex(day.date, year, month);

    const picSlots = day.assignments.filter(
      s => s.definition.category === ShiftCategory.PIC && s.assignedEmployeeId === null
    );

    for (const slot of picSlots) {
      const ctx = {
        slot, date: day.date, weekIndex,
        dayAssignments: day.assignments,
        weeklyHours, totalWeeks, prevDayLastHour, rng,
      };

      // Prefer FT employees who are short on hours this week
      const sorted = [...ftEmployees].sort((a, b) => {
        const ha = (getWeeklyHours(weeklyHours, a.id, totalWeeks)[weekIndex] ?? 0);
        const hb = (getWeeklyHours(weeklyHours, b.id, totalWeeks)[weekIndex] ?? 0);
        return ha - hb; // fewest hours first
      });

      const best = pickBestEmployee(sorted, ctx);
      if (best) {
        slot.assignedEmployeeId = best.id;
        addHours(weeklyHours, best.id, weekIndex, slot.endHour - slot.startHour, totalWeeks);
      }
    }

    // Update prevDayLastHour for FT employees
    updatePrevDayLastHour(day, prevDayLastHour);
  }

  // --- Phase 4: Top-up FT employees to 40h/week using open 8h PT slots ---
  for (const day of days) {
    if (day.isClosed) continue;
    const weekIndex = getCalendarWeekIndex(day.date, year, month);

    // Find open 8h PT slots (not PIC, not Programming, not yet assigned)
    const open8hSlots = day.assignments.filter(s =>
      s.assignedEmployeeId === null &&
      !isFullTimeSlot(s) &&
      !isProgrammingSlot(s) &&
      (s.endHour - s.startHour) === 8
    );

    for (const slot of open8hSlots) {
      // Find FT employees who still need hours this week
      const needyFT = ftEmployees.filter(emp => {
        const used = (getWeeklyHours(weeklyHours, emp.id, totalWeeks)[weekIndex] ?? 0);
        return used < emp.minHoursPerWeek;
      });
      if (needyFT.length === 0) break;

      const ctx = {
        slot, date: day.date, weekIndex,
        dayAssignments: day.assignments,
        weeklyHours, totalWeeks, prevDayLastHour, rng,
      };

      const best = pickBestEmployee(needyFT, ctx);
      if (best) {
        slot.assignedEmployeeId = best.id;
        addHours(weeklyHours, best.id, weekIndex, slot.endHour - slot.startHour, totalWeeks);
      }
    }
  }

  // Reset prevDayLastHour for PT phase
  prevDayLastHour.clear();

  // --- Phase 5: Fill remaining PT slots with PT employees ---
  for (const day of days) {
    if (day.isClosed) continue;
    const weekIndex = getCalendarWeekIndex(day.date, year, month);

    const openPTSlots = day.assignments.filter(s =>
      s.assignedEmployeeId === null &&
      !isFullTimeSlot(s) &&
      !isProgrammingSlot(s)
    );

    for (const slot of openPTSlots) {
      // Sort PT employees: fewest hours first (so distribution is even)
      const sorted = rng.shuffle(ptEmployees).sort((a, b) => {
        const ha = (getWeeklyHours(weeklyHours, a.id, totalWeeks)[weekIndex] ?? 0);
        const hb = (getWeeklyHours(weeklyHours, b.id, totalWeeks)[weekIndex] ?? 0);
        return ha - hb;
      });

      const ctx = {
        slot, date: day.date, weekIndex,
        dayAssignments: day.assignments,
        weeklyHours, totalWeeks, prevDayLastHour, rng,
      };

      const best = pickBestEmployee(sorted, ctx);
      if (best) {
        slot.assignedEmployeeId = best.id;
        addHours(weeklyHours, best.id, weekIndex, slot.endHour - slot.startHour, totalWeeks);
      }
    }

    updatePrevDayLastHour(day, prevDayLastHour);
  }

  // --- Phase 6: Fill Programming slots ---
  prevDayLastHour.clear();

  for (const day of days) {
    if (day.isClosed) continue;
    const weekIndex = getCalendarWeekIndex(day.date, year, month);

    const progSlots = day.assignments.filter(
      s => isProgrammingSlot(s) && s.assignedEmployeeId === null
    );

    for (const slot of progSlots) {
      const sorted = rng.shuffle(progEmployees).sort((a, b) => {
        const ha = (getWeeklyHours(weeklyHours, a.id, totalWeeks)[weekIndex] ?? 0);
        const hb = (getWeeklyHours(weeklyHours, b.id, totalWeeks)[weekIndex] ?? 0);
        return ha - hb;
      });

      const ctx = {
        slot, date: day.date, weekIndex,
        dayAssignments: day.assignments,
        weeklyHours, totalWeeks, prevDayLastHour, rng,
      };

      const best = pickBestEmployee(sorted, ctx);
      if (best) {
        slot.assignedEmployeeId = best.id;
        addHours(weeklyHours, best.id, weekIndex, slot.endHour - slot.startHour, totalWeeks);
      }
    }
  }

  return buildMonthSchedule(year, month, seed, employees, days);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDateStr(date: Date): string {
  const y  = date.getFullYear();
  const m  = String(date.getMonth() + 1).padStart(2, '0');
  const d  = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function updatePrevDayLastHour(day: Day, map: Map<string, number>): void {
  for (const slot of day.assignments) {
    if (!slot.assignedEmployeeId) continue;
    const current = map.get(slot.assignedEmployeeId) ?? 0;
    if (slot.endHour > current) {
      map.set(slot.assignedEmployeeId, slot.endHour);
    }
  }
}

/** Compute summary statistics for display in the UI */
export interface EmployeeSummary {
  employee:    Employee;
  weeklyHours: number[];
  totalHours:  number;
}

export function computeSummaries(
  schedule:    MonthSchedule,
  weeklyHoursMap: Map<string, number[]>,
  totalWeeks:  number,
): EmployeeSummary[] {
  return schedule.employees.map(emp => {
    const wh = getWeeklyHours(weeklyHoursMap, emp.id, totalWeeks);
    return {
      employee:    emp,
      weeklyHours: [...wh],
      totalHours:  wh.reduce((a, b) => a + b, 0),
    };
  });
}
