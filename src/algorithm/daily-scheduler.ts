import { Day } from '../types/day';
import { Employee } from '../types/employee';
import {
  DailySchedule, DailyRow, DailyCell,
  CATEGORY_TO_DAILY_ROLE,
} from '../types/daily-schedule';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DOW_NAMES = [
  'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY',
  'THURSDAY', 'FRIDAY', 'SATURDAY',
];

// ---------------------------------------------------------------------------
// Rotation helpers
// ---------------------------------------------------------------------------

/**
 * Given the hour offset from the start of the open day (0 = first hour),
 * returns the rotation index — i.e. how many role-swaps have happened.
 *
 * Block pattern: 2h, 1h, 2h, 1h, …
 * Produces the sequence: [0, 0, 1, 2, 2, 3, 4, 4, 5, …]
 *
 * Each "rotation period" is 3 hours (a 2h block + a 1h block),
 * and advances the rotation index by 2 per period.
 */
function rotationIndex(hourOffset: number): number {
  const fullPeriods = Math.floor(hourOffset / 3);
  const remainder   = hourOffset % 3;
  return fullPeriods * 2 + (remainder >= 2 ? 1 : 0);
}

// ---------------------------------------------------------------------------
// Date string helper
// ---------------------------------------------------------------------------

function toDateStr(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

// ---------------------------------------------------------------------------
// buildDailySchedule
// ---------------------------------------------------------------------------

/**
 * Generates the initial DailySchedule for a given Day.
 *
 * Algorithm (Phase 1 — default rotation):
 *  1. Collect every employee on duty from day.assignments.
 *  2. Sort employees alphabetically.
 *  3. For each hour H in [openHour, closeHour):
 *     a. Determine which employees are on duty.
 *     b. Build the role pool for that hour (one role per on-duty employee,
 *        derived from their active shift's category).
 *     c. Compute rotation offset = rotationIndex(H - openHour).
 *     d. Each employee at position i in the on-duty list gets:
 *           role = rolePool[(i + offset) % poolSize]
 *  4. Return DailySchedule with cells defaulting to locked=false.
 *
 * Rotation produces the alternating 2h/1h block pattern described in
 * rotationIndex().  All cells can be manually overridden by the user.
 */
export function buildDailySchedule(
  day:         Day,
  employeeMap: Map<string, Employee>,
): DailySchedule {
  // --- 1. Collect shifts per employee ---
  type Interval = { startHour: number; endHour: number; category: string };
  const empIntervals = new Map<string, Interval[]>();

  for (const slot of day.assignments) {
    if (!slot.assignedEmployeeId) continue;
    const empId = slot.assignedEmployeeId;
    if (!empIntervals.has(empId)) empIntervals.set(empId, []);
    empIntervals.get(empId)!.push({
      startHour: slot.startHour,
      endHour:   slot.endHour,
      category:  slot.definition.category as string,
    });
  }

  // --- 2. Sort employees alphabetically ---
  const scheduledEmployees: Employee[] = [...empIntervals.keys()]
    .map(id => employeeMap.get(id))
    .filter((e): e is Employee => e !== undefined)
    .sort((a, b) => a.name.localeCompare(b.name));

  // --- 3. Build hour array ---
  const hours: number[] = [];
  for (let h = day.openHour; h < day.closeHour; h++) {
    hours.push(h);
  }

  // --- 4. Build rows ---
  const rows: DailyRow[] = scheduledEmployees.map(emp => {
    const intervals = empIntervals.get(emp.id)!;

    const cells: (DailyCell | null)[] = hours.map((h, hIdx) => {
      // Determine if this employee is on duty this hour
      const activeInterval = intervals.find(iv => h >= iv.startHour && h < iv.endHour);
      if (!activeInterval) return null;

      // Who else is on duty this hour? (in sorted order)
      const onDutyThisHour = scheduledEmployees.filter(e => {
        const ivs = empIntervals.get(e.id)!;
        return ivs.some(iv => h >= iv.startHour && h < iv.endHour);
      });

      // Role pool: one entry per on-duty employee, derived from their active shift
      const rolePool: string[] = onDutyThisHour.map(e => {
        const ivs = empIntervals.get(e.id)!;
        const iv  = ivs.find(iv => h >= iv.startHour && h < iv.endHour)!;
        return CATEGORY_TO_DAILY_ROLE[iv.category] ?? iv.category;
      });

      // Rotation
      const offset    = rotationIndex(hIdx);
      const posInGroup = onDutyThisHour.indexOf(emp);
      const roleIdx   = (posInGroup + offset) % rolePool.length;

      return { role: rolePool[roleIdx], locked: false };
    });

    return {
      employeeId:   emp.id,
      employeeName: emp.name,
      cells,
      intervals,
    };
  });

  // --- 5. Build labels ---
  return {
    dateStr:   toDateStr(day.date),
    dayOfWeek: DOW_NAMES[day.date.getDay()],
    dateLabel: `${MONTH_NAMES[day.date.getMonth()]} ${day.date.getDate()}, ${day.date.getFullYear()}`,
    openHour:  day.openHour,
    closeHour: day.closeHour,
    hours,
    rows,
  };
}
