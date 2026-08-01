// =============================================================================
// Daily Schedule Types
// =============================================================================

/**
 * The complete set of duty codes available in the daily assignment dropdown.
 * Users may also type any free-text value.
 */
export const DAILY_ROLES: readonly string[] = [
  'PIC', 'PIC/L', 'PIC/X',
  'S', 'L/S', 'X/S', 'S/L',
  'P', 'O', 'W',
  'CALLS', 'BRKS', 'MAGS',
  'ABC', 'I', 'HOLDS',
  'PROG', 'SEC', 'OFFSITE', 'PLAN',
  'TBD',
];

/**
 * Mapping from the monthly-schedule ShiftCategory enum string
 * to the short duty code used in the daily schedule grid.
 */
export const CATEGORY_TO_DAILY_ROLE: Readonly<Record<string, string>> = {
  PIC:         'PIC',
  Accounts:    'ABC',
  Info:        'I',
  Welcome:     'W',
  Float:       'P',
  Support:     'S',
  Programming: 'PROG',
};

// ---------------------------------------------------------------------------
// Cell — one hour for one employee
// ---------------------------------------------------------------------------
export interface DailyCell {
  /** The duty code shown in this cell */
  role: string;
  /**
   * True when the user has manually overridden this cell.
   * Locked cells are styled distinctly and are never re-generated.
   */
  locked: boolean;
}

// ---------------------------------------------------------------------------
// Row — one employee's full day
// ---------------------------------------------------------------------------
export interface DailyRow {
  employeeId:   string;
  employeeName: string;
  /**
   * One entry per hour in DailySchedule.hours.
   * null  → employee is NOT on duty during this hour (cell rendered as inactive).
   * DailyCell → employee is on duty; shows the duty code.
   */
  cells:        (DailyCell | null)[];
  /** The shift intervals assigned to this employee on this day */
  intervals:    ReadonlyArray<{ startHour: number; endHour: number; category: string }>;
}

// ---------------------------------------------------------------------------
// DailySchedule — the full day grid, persisted in app state
// ---------------------------------------------------------------------------
export interface DailySchedule {
  /** YYYY-MM-DD */
  dateStr:   string;
  /** Upper-case day name: 'MONDAY', 'TUESDAY', … */
  dayOfWeek: string;
  /** Human-readable date: 'September 7, 2026' */
  dateLabel: string;
  openHour:  number;
  closeHour: number;
  /** Ordered list of hours the library is open: [9, 10, 11, …] */
  hours:     number[];
  rows:      DailyRow[];
}
