import { Employee, DAY_OF_WEEK_NAMES, daySpecMatchesDate } from '../types/employee';
import { ShiftSlot, ShiftDefinition, EmployeeStatus, ShiftCategory } from '../types/shift';
import { SeededRandom } from './seeded-random';

// ---------------------------------------------------------------------------
// Score modifiers
// ---------------------------------------------------------------------------
const HARD_BLOCK         = -Infinity; // cannot assign
const BONUS_PREFERRED_DAY     =  20;
const BONUS_PREFERRED_HOURS   =  15;
const BONUS_PREFERRED_COWORKER=  10;
const PENALTY_AVOID_COWORKER  = -15;
const PENALTY_CLOSE_OPEN      = -25; // general back-to-back penalty
const PENALTY_CLOSE_OPEN_PREF = -25; // extra if employee actively dislikes it
const BONUS_CLOSE_OPEN_PREF   =  15; // bonus if employee actively likes it

// ---------------------------------------------------------------------------
// Scoring context — everything the scorer needs
// ---------------------------------------------------------------------------
export interface ScoreContext {
  employee:           Employee;
  slot:               ShiftSlot;
  /** The calendar date of this slot */
  date:               Date;
  /** 0-based calendar-week index (for hour accounting) */
  weekIndex:          number;
  /** Slots already assigned on this specific date (for same-day coworker check) */
  dayAssignments:     ShiftSlot[];
  /** Hours already scheduled per employee per week: employeeId → hours[weekIndex] */
  weeklyHours:        Map<string, number[]>;
  /** Total number of calendar weeks in the schedule */
  totalWeeks:         number;
  /** The last shift end-hour for each employee on the previous working day */
  prevDayLastHour:    Map<string, number>;
  /** RNG for tiebreaking */
  rng:                SeededRandom;
}

// ---------------------------------------------------------------------------
// Hard constraint checks
// ---------------------------------------------------------------------------

function isAvailableForDay(emp: Employee, date: Date): boolean {
  return !emp.notAvailableDays.some(spec => daySpecMatchesDate(spec, date));
}

function isAvailableForHours(emp: Employee, date: Date, slot: ShiftSlot): boolean {
  const dowName = DAY_OF_WEEK_NAMES[date.getDay()];
  for (const range of emp.unavailableHours) {
    if (range.day !== dowName) continue;
    // Shift overlaps unavailable block if they are not entirely disjoint
    if (slot.startHour < range.end && slot.endHour > range.start) return false;
  }
  return true;
}

function wouldExceedWeeklyMax(
  emp:       Employee,
  slot:      ShiftSlot,
  weekIndex: number,
  weeklyHours: Map<string, number[]>,
  totalWeeks:  number,
): boolean {
  const hours  = weeklyHours.get(emp.id) ?? new Array(totalWeeks).fill(0);
  const current = hours[weekIndex] ?? 0;
  const slotDur = slot.endHour - slot.startHour;
  return current + slotDur > emp.maxHoursPerWeek;
}

function hasConflictOnDay(emp: Employee, slot: ShiftSlot, dayAssignments: ShiftSlot[]): boolean {
  return dayAssignments.some(a =>
    a.assignedEmployeeId === emp.id &&
    // Overlap check: ranges are not disjoint
    slot.startHour < a.endHour && slot.endHour > a.startHour
  );
}

function statusMatches(emp: Employee, def: ShiftDefinition): boolean {
  if (def.requiredStatus === EmployeeStatus.FullTime) {
    return emp.status === EmployeeStatus.FullTime;
  }
  if (def.requiredStatus === EmployeeStatus.Programming) {
    return emp.status === EmployeeStatus.Programming;
  }
  // PartTime slots can be filled by PT employees;
  // FT employees may also fill PT slots when topping up to 40h.
  return (
    emp.status === EmployeeStatus.PartTime ||
    emp.status === EmployeeStatus.FullTime
  );
}

// ---------------------------------------------------------------------------
// Main scoring function
// ---------------------------------------------------------------------------

/**
 * Returns a numeric score for placing `employee` in `slot`.
 * -Infinity means the assignment is impossible (hard constraint violated).
 * Higher scores are better.
 */
export function scoreEmployee(ctx: ScoreContext): number {
  const { employee: emp, slot, date, weekIndex, dayAssignments,
          weeklyHours, totalWeeks, prevDayLastHour, rng } = ctx;

  // --- Hard constraints ---
  if (!statusMatches(emp, slot.definition))                              return HARD_BLOCK;
  if (!isAvailableForDay(emp, date))                                     return HARD_BLOCK;
  if (!isAvailableForHours(emp, date, slot))                             return HARD_BLOCK;
  if (hasConflictOnDay(emp, slot, dayAssignments))                       return HARD_BLOCK;
  if (wouldExceedWeeklyMax(emp, slot, weekIndex, weeklyHours, totalWeeks)) return HARD_BLOCK;

  // --- Soft preferences ---
  let score = 0;

  // Preferred day (any matching DaySpec in the employee's preferredDays list)
  if (emp.preferredDays.some(spec => daySpecMatchesDate(spec, date))) {
    score += BONUS_PREFERRED_DAY;
  }

  // Preferred hours
  const dowName = DAY_OF_WEEK_NAMES[date.getDay()];
  for (const ph of emp.preferredHours) {
    if (ph.day !== dowName) continue;
    if (slot.startHour >= ph.start && slot.endHour <= ph.end) {
      score += BONUS_PREFERRED_HOURS;
      break;
    }
  }

  // Coworker preferences — scan already-assigned employees this day
  const assignedIds = new Set(
    dayAssignments
      .filter(a => a.assignedEmployeeId !== null)
      .map(a => a.assignedEmployeeId as string)
  );

  for (const prefId of emp.preferredCoworkers) {
    if (assignedIds.has(prefId)) score += BONUS_PREFERRED_COWORKER;
  }
  for (const avoidId of emp.avoidCoworkers) {
    if (assignedIds.has(avoidId)) score += PENALTY_AVOID_COWORKER;
  }

  // Back-to-back close→open (previous day late shift, this day early start)
  const prevLastHour = prevDayLastHour.get(emp.id) ?? 0;
  const isBackToBack = prevLastHour >= 18 && slot.startHour <= 10;

  if (isBackToBack) {
    score += PENALTY_CLOSE_OPEN;
    if (emp.closeThenOpenPref === 'avoid') score += PENALTY_CLOSE_OPEN_PREF;
    if (emp.closeThenOpenPref === 'prefer') score -= PENALTY_CLOSE_OPEN; // undo base penalty, net bonus
  } else if (emp.closeThenOpenPref === 'prefer' && prevLastHour > 0) {
    // Slight bonus for employees who prefer close→open when it happens
    score += BONUS_CLOSE_OPEN_PREF;
  }

  // Small random tiebreaker so equally-scored assignments vary by seed
  score += rng.tieBreaker();

  return score;
}

/**
 * Given a list of candidate employees and a slot, returns the best-scoring
 * employee or null if none are eligible.
 */
export function pickBestEmployee(
  candidates: Employee[],
  ctx:        Omit<ScoreContext, 'employee'>,
): Employee | null {
  let best: Employee | null = null;
  let bestScore = -Infinity;

  for (const emp of candidates) {
    const s = scoreEmployee({ ...ctx, employee: emp });
    if (s > bestScore) {
      bestScore = s;
      best      = emp;
    }
  }

  return bestScore === -Infinity ? null : best;
}

// ---------------------------------------------------------------------------
// Weekly hour tracking helpers
// ---------------------------------------------------------------------------

export function getWeeklyHours(
  weeklyHours: Map<string, number[]>,
  empId:       string,
  totalWeeks:  number,
): number[] {
  if (!weeklyHours.has(empId)) {
    weeklyHours.set(empId, new Array(totalWeeks).fill(0));
  }
  return weeklyHours.get(empId)!;
}

export function addHours(
  weeklyHours: Map<string, number[]>,
  empId:       string,
  weekIndex:   number,
  hours:       number,
  totalWeeks:  number,
): void {
  const arr = getWeeklyHours(weeklyHours, empId, totalWeeks);
  arr[weekIndex] = (arr[weekIndex] ?? 0) + hours;
}

// ---------------------------------------------------------------------------
// Shift-type helpers
// ---------------------------------------------------------------------------

/** Returns true if the slot requires a Full Time employee */
export function isFullTimeSlot(slot: ShiftSlot): boolean {
  return slot.definition.requiredStatus === EmployeeStatus.FullTime;
}

/** Returns true if the slot is a Programming slot */
export function isProgrammingSlot(slot: ShiftSlot): boolean {
  return slot.definition.category === ShiftCategory.Programming;
}
