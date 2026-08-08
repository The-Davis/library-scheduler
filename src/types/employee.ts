import { EmployeeStatus } from './shift';

// ---------------------------------------------------------------------------
// Day-of-week helpers
// ---------------------------------------------------------------------------
export type DayOfWeek =
  | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday'
  | 'Thursday' | 'Friday' | 'Saturday';

export const DAY_OF_WEEK_NAMES: DayOfWeek[] = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

export const DAY_OF_WEEK_INDEX: Readonly<Record<DayOfWeek, number>> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
  Thursday: 4, Friday: 5, Saturday: 6,
};

// ---------------------------------------------------------------------------
// DaySpec — flexible day-matching rule
// ---------------------------------------------------------------------------
// Represents one of three forms, all parsed from plain strings in CSV cells:
//
//   { type: 'date',        date: 15 }               ← "15"      (15th of month)
//   { type: 'weekday',     name: 'Monday' }          ← "Monday"  (every Monday)
//   { type: 'nth-weekday', name: 'Monday', nth: 3 }  ← "Monday3" (3rd Monday)
//
// Multiple specs in a CSV column are pipe-separated, e.g.:
//   "Saturday|15|Monday3"
// ---------------------------------------------------------------------------

export type DaySpec =
  | { type: 'date';        date: number }
  | { type: 'weekday';     name: DayOfWeek }
  | { type: 'nth-weekday'; name: DayOfWeek; nth: number };

/**
 * Parse a single DaySpec token from its CSV string form.
 *
 * Accepts (case-insensitive):
 *   "15"      → specific calendar date (must be 1–31)
 *   "Monday"  → every instance of that weekday in the month
 *   "Monday3" → the 3rd Monday of the month (nth may be 1–5)
 *
 * Returns null for unrecognised strings (they are silently dropped).
 */
export function parseDaySpec(raw: string): DaySpec | null {
  const s = raw.trim();
  if (!s) return null;

  // ── integer → specific calendar date ─────────────────────────────────────
  if (/^\d+$/.test(s)) {
    const n = parseInt(s, 10);
    if (n >= 1 && n <= 31) return { type: 'date', date: n };
    return null;
  }

  // ── DayName + digit → nth-weekday, e.g. "Monday3" ────────────────────────
  const nthMatch = s.match(
    /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)([1-5])$/i,
  );
  if (nthMatch) {
    const name = DAY_OF_WEEK_NAMES.find(
      d => d.toLowerCase() === nthMatch[1].toLowerCase(),
    )!;
    return { type: 'nth-weekday', name, nth: parseInt(nthMatch[2], 10) };
  }

  // ── plain weekday name ────────────────────────────────────────────────────
  const canonical = DAY_OF_WEEK_NAMES.find(
    d => d.toLowerCase() === s.toLowerCase(),
  );
  if (canonical) return { type: 'weekday', name: canonical };

  return null;
}

/**
 * Returns true when the DaySpec matches the given calendar date.
 *
 * nth-weekday uses Math.ceil(date / 7) to identify ordinal position —
 * this is correct regardless of what weekday the month starts on, because
 * any given weekday always falls in exactly one 7-day week-band per month.
 *
 * Examples for September 2026 (starts Tuesday):
 *   "Monday3" → Sept 21  (Math.ceil(21/7) = 3) ✓
 *   "15"      → Sept 15 only ✓
 *   "Friday"  → Sept 4, 11, 18, 25 ✓
 */
export function daySpecMatchesDate(spec: DaySpec, date: Date): boolean {
  switch (spec.type) {
    case 'date':
      return date.getDate() === spec.date;
    case 'weekday':
      return date.getDay() === DAY_OF_WEEK_INDEX[spec.name];
    case 'nth-weekday':
      return (
        date.getDay() === DAY_OF_WEEK_INDEX[spec.name] &&
        Math.ceil(date.getDate() / 7) === spec.nth
      );
  }
}

/** Convenience constructors for use in TypeScript source code */
export const ds = {
  /** Every occurrence of a weekday in the month, e.g. ds.weekday('Monday') */
  weekday: (name: DayOfWeek): DaySpec =>
    ({ type: 'weekday', name }),

  /** A specific calendar date, e.g. ds.date(15) → the 15th */
  date: (d: number): DaySpec =>
    ({ type: 'date', date: d }),

  /** The nth occurrence of a weekday, e.g. ds.nth('Monday', 3) → 3rd Monday */
  nth: (name: DayOfWeek, nth: number): DaySpec =>
    ({ type: 'nth-weekday', name, nth }),
};

// ---------------------------------------------------------------------------
// Other employee preference types
// ---------------------------------------------------------------------------

/** A range of hours within a specific day of the week (for unavailable/preferred hours) */
export interface DayHourRange {
  day:   DayOfWeek;
  /** Start hour (inclusive, 24h) */
  start: number;
  /** End hour (exclusive, 24h) */
  end:   number;
}

export type CloseThenOpenPref = 'prefer' | 'avoid' | 'neutral';

// ---------------------------------------------------------------------------
// Employee initialisation bag
// ---------------------------------------------------------------------------
export interface EmployeeInit {
  id:                  string;
  name:                string;
  status:              EmployeeStatus;
  /** Ignored for FT (always 40) */
  minHoursPerWeek?:    number;
  /** Ignored for FT (always 40) */
  maxHoursPerWeek?:    number;
  shiftSizes?:         number[];
  /** Days on which this employee cannot work. Supports all DaySpec forms. */
  notAvailableDays?:   DaySpec[];
  /** Days this employee prefers to work. Supports all DaySpec forms. */
  preferredDays?:      DaySpec[];
  /** Days this employee is required to work (mandatory unless they would exceed their hour limit). */
  mustWorkDays?:       DaySpec[];
  unavailableHours?:   DayHourRange[];
  preferredHours?:     DayHourRange[];
  /** IDs of employees this person prefers to work alongside */
  preferredCoworkers?: string[];
  /** IDs of employees this person prefers not to work alongside */
  avoidCoworkers?:     string[];
  closeThenOpenPref?:  CloseThenOpenPref;
}

// ---------------------------------------------------------------------------
// Employee class
// ---------------------------------------------------------------------------
export class Employee {
  readonly id:                  string;
  readonly name:                string;
  readonly status:              EmployeeStatus;
  readonly minHoursPerWeek:     number;
  readonly maxHoursPerWeek:     number;
  readonly shiftSizes?:         number[];
  readonly notAvailableDays:    DaySpec[];
  readonly preferredDays:       DaySpec[];
  readonly mustWorkDays:        DaySpec[];
  readonly unavailableHours:    DayHourRange[];
  readonly preferredHours:      DayHourRange[];
  readonly preferredCoworkers:  string[];
  readonly avoidCoworkers:      string[];
  readonly closeThenOpenPref:   CloseThenOpenPref;

  constructor(init: EmployeeInit) {
    this.id   = init.id;
    this.name = init.name;
    this.status = init.status;

    // FT is always exactly 40h; PT defaults to 12–32h
    if (init.status === EmployeeStatus.FullTime) {
      this.minHoursPerWeek = 40;
      this.maxHoursPerWeek = 40;
    } else {
      this.minHoursPerWeek = init.minHoursPerWeek ?? 12;
      this.maxHoursPerWeek = init.maxHoursPerWeek ?? 32;
      if (init.shiftSizes && init.shiftSizes.length > 0) {
        this.shiftSizes = init.shiftSizes;
      }
    }

    this.notAvailableDays   = init.notAvailableDays   ?? [];
    this.preferredDays      = init.preferredDays       ?? [];
    this.mustWorkDays       = init.mustWorkDays        ?? [];
    this.unavailableHours   = init.unavailableHours    ?? [];
    this.preferredHours     = init.preferredHours      ?? [];
    this.preferredCoworkers = init.preferredCoworkers  ?? [];
    this.avoidCoworkers     = init.avoidCoworkers      ?? [];
    this.closeThenOpenPref  = init.closeThenOpenPref   ?? 'avoid';
  }
}
