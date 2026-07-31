import { Day, groupIntoCalendarWeeks } from './day';
import { Employee } from './employee';

// ---------------------------------------------------------------------------
// Month schedule container
// ---------------------------------------------------------------------------
export interface MonthSchedule {
  year:     number;
  /** 0-indexed (0 = January, 11 = December) */
  month:    number;
  seed:     number;
  employees: Employee[];
  /** All days of the month in order (including Sundays/holidays, isClosed=true) */
  allDays:  Day[];
  /** Calendar grid — rows of 7 Day|null (null = padding cell) */
  weeks:    (Day | null)[][];
}

/**
 * Assemble a MonthSchedule from a flat list of Day objects.
 * Days must already have requirements and assignments populated.
 */
export function buildMonthSchedule(
  year:      number,
  month:     number,
  seed:      number,
  employees: Employee[],
  days:      Day[],
): MonthSchedule {
  const weeks = groupIntoCalendarWeeks(days, year, month);
  return { year, month, seed, employees, allDays: days, weeks };
}

/** Human-readable month name */
export function monthName(month: number): string {
  return new Date(2000, month, 1).toLocaleString('default', { month: 'long' });
}

/** Returns the number of days in a given month */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
