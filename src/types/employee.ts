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
// Employee preference types
// ---------------------------------------------------------------------------

/** A range of hours within a specific day of the week */
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
  notAvailableDays?:   DayOfWeek[];
  preferredDays?:      DayOfWeek[];
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
  readonly notAvailableDays:    DayOfWeek[];
  readonly preferredDays:       DayOfWeek[];
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
    }

    this.notAvailableDays   = init.notAvailableDays   ?? [];
    this.preferredDays      = init.preferredDays       ?? [];
    this.unavailableHours   = init.unavailableHours    ?? [];
    this.preferredHours     = init.preferredHours      ?? [];
    this.preferredCoworkers = init.preferredCoworkers  ?? [];
    this.avoidCoworkers     = init.avoidCoworkers      ?? [];
    this.closeThenOpenPref  = init.closeThenOpenPref   ?? 'avoid';
  }
}
