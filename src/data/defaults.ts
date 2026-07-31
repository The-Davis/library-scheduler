import { ShiftCategory, CoverageRequirement } from '../types/shift';
import { DayOfWeek, DAY_OF_WEEK_NAMES } from '../types/employee';

// ---------------------------------------------------------------------------
// Library constants
// ---------------------------------------------------------------------------
const OPEN_HOUR  = 9;
const CLOSE_WEEKDAY = 21; // Mon–Thu
const CLOSE_SHORT   = 18; // Fri–Sat
const WELCOME_FLOAT_CUTOFF = 18; // both roles end by 18:00
const FLOAT_SAT_CUTOFF     = 14; // Float on Saturday ends at 14:00
const SUPPORT_CUTOFF       = 18; // Support ends by 18:00

// ---------------------------------------------------------------------------
// Default CoverageRequirements per day-of-week
// ---------------------------------------------------------------------------
// These represent what shifts the library needs by default each day.
// The CSV "shifts" input can override these on a per-date basis.
// Programming shifts are NOT included here — they only appear via CSV.
// ---------------------------------------------------------------------------

type DayRequirements = CoverageRequirement[];

/** Default shift requirements for Monday through Thursday (9:00–21:00) */
const WEEKDAY_REQUIREMENTS: DayRequirements = [
  // Two full-time PIC shifts covering the full 12-hour day
  { category: ShiftCategory.PIC,      coverageStart: OPEN_HOUR, coverageEnd: CLOSE_WEEKDAY },
  // Part-time roles covering the full day
  { category: ShiftCategory.Accounts, coverageStart: OPEN_HOUR, coverageEnd: CLOSE_WEEKDAY },
  { category: ShiftCategory.Info,     coverageStart: OPEN_HOUR, coverageEnd: CLOSE_WEEKDAY },
  // Welcome and Float only until 18:00
  { category: ShiftCategory.Welcome,  coverageStart: OPEN_HOUR, coverageEnd: WELCOME_FLOAT_CUTOFF },
  { category: ShiftCategory.Float,    coverageStart: OPEN_HOUR, coverageEnd: WELCOME_FLOAT_CUTOFF },
  // Support only until 18:00 on weekdays
  { category: ShiftCategory.Support,  coverageStart: OPEN_HOUR, coverageEnd: SUPPORT_CUTOFF },
];

/** Default shift requirements for Friday (9:00–18:00) */
const FRIDAY_REQUIREMENTS: DayRequirements = [
  { category: ShiftCategory.PIC,      coverageStart: OPEN_HOUR, coverageEnd: CLOSE_SHORT },
  { category: ShiftCategory.Accounts, coverageStart: OPEN_HOUR, coverageEnd: CLOSE_SHORT },
  { category: ShiftCategory.Info,     coverageStart: OPEN_HOUR, coverageEnd: CLOSE_SHORT },
  { category: ShiftCategory.Welcome,  coverageStart: OPEN_HOUR, coverageEnd: CLOSE_SHORT },
  { category: ShiftCategory.Float,    coverageStart: OPEN_HOUR, coverageEnd: CLOSE_SHORT },
  { category: ShiftCategory.Support,  coverageStart: OPEN_HOUR, coverageEnd: SUPPORT_CUTOFF },
];

/** Default shift requirements for Saturday (9:00–18:00) */
const SATURDAY_REQUIREMENTS: DayRequirements = [
  { category: ShiftCategory.PIC,      coverageStart: OPEN_HOUR, coverageEnd: CLOSE_SHORT },
  { category: ShiftCategory.Accounts, coverageStart: OPEN_HOUR, coverageEnd: CLOSE_SHORT },
  { category: ShiftCategory.Info,     coverageStart: OPEN_HOUR, coverageEnd: CLOSE_SHORT },
  { category: ShiftCategory.Welcome,  coverageStart: OPEN_HOUR, coverageEnd: CLOSE_SHORT },
  // Float on Saturday ends at 14:00 instead of 18:00
  { category: ShiftCategory.Float,    coverageStart: OPEN_HOUR, coverageEnd: FLOAT_SAT_CUTOFF },
  // No Support on Saturday
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the default CoverageRequirements for a given JavaScript day-of-week
 * index (0=Sun, 1=Mon, …, 6=Sat).  Returns an empty array for Sunday (closed).
 *
 * Deep-copies the arrays so callers can safely mutate them.
 */
export function getDefaultRequirements(dayOfWeek: number): CoverageRequirement[] {
  switch (dayOfWeek) {
    case 0: return [];                                  // Sunday — closed
    case 1:
    case 2:
    case 3:
    case 4: return WEEKDAY_REQUIREMENTS.map(r => ({ ...r })); // Mon–Thu
    case 5: return FRIDAY_REQUIREMENTS.map(r => ({ ...r }));  // Fri
    case 6: return SATURDAY_REQUIREMENTS.map(r => ({ ...r })); // Sat
    default: return [];
  }
}

/**
 * Human-readable label for debugging / CSV templates.
 */
export function dayLabel(dayOfWeek: number): DayOfWeek {
  return DAY_OF_WEEK_NAMES[dayOfWeek];
}
