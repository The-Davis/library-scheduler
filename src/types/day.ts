import { CoverageRequirement, ShiftSlot } from './shift';

// ---------------------------------------------------------------------------
// Day
// ---------------------------------------------------------------------------
export interface Day {
  date:         Date;
  /** JS getDay() value — 0=Sun, 1=Mon, …, 6=Sat */
  dayOfWeek:    number;
  openHour:     number;
  closeHour:    number;
  /** True when the library is not open (Sunday or holiday) */
  isClosed:     boolean;
  /** True when explicitly closed via CSV input (not just a Sunday) */
  isHoliday:    boolean;
  requirements: CoverageRequirement[];
  assignments:  ShiftSlot[];
}

/**
 * Create a Day object for the given date.
 * Hours and closure status are determined by day-of-week:
 *   Mon–Thu → 09:00–21:00
 *   Fri–Sat → 09:00–18:00
 *   Sunday  → closed
 */
export function createDay(date: Date, forceHoliday = false): Day {
  const dow      = date.getDay();           // 0=Sun … 6=Sat
  const isSunday = dow === 0;
  const isClosed = isSunday || forceHoliday;

  const isLongDay = dow >= 1 && dow <= 4;   // Mon–Thu → 12-hour day
  const openHour  = 9;
  const closeHour = isClosed ? 9 : (isLongDay ? 21 : 18);

  return {
    date,
    dayOfWeek:    dow,
    openHour,
    closeHour,
    isClosed,
    isHoliday:    forceHoliday,
    requirements: [],
    assignments:  [],
  };
}

// ---------------------------------------------------------------------------
// Week-indexing helpers
// ---------------------------------------------------------------------------

/**
 * Returns a 0-based calendar-week index for a date relative to the month.
 * Week 0 begins on the Sunday on or before the 1st of the month.
 */
export function getCalendarWeekIndex(
  date:  Date,
  year:  number,
  month: number, // 0-indexed
): number {
  const firstOfMonth  = new Date(year, month, 1);
  // The Sunday that starts the first display row of the calendar
  const firstSunday   = new Date(firstOfMonth);
  firstSunday.setDate(firstSunday.getDate() - firstSunday.getDay());

  const msSinceFirst  = date.getTime() - firstSunday.getTime();
  const daysSinceFirst = Math.floor(msSinceFirst / 86_400_000);
  return Math.floor(daysSinceFirst / 7);
}

/**
 * Groups a flat array of Days into calendar weeks (arrays of 7 Day|null,
 * Sunday-first). Pads the first and last rows with nulls as needed.
 */
export function groupIntoCalendarWeeks(
  days:  Day[],
  year:  number,
  month: number, // 0-indexed
): (Day | null)[][] {
  if (days.length === 0) return [];

  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const totalCells = firstDow + days.length;
  const numWeeks   = Math.ceil(totalCells / 7);

  const grid: (Day | null)[] = new Array(numWeeks * 7).fill(null);

  for (let i = 0; i < days.length; i++) {
    grid[firstDow + i] = days[i];
  }

  const weeks: (Day | null)[][] = [];
  for (let w = 0; w < numWeeks; w++) {
    weeks.push(grid.slice(w * 7, (w + 1) * 7));
  }
  return weeks;
}
