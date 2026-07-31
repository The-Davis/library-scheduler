// =============================================================================
// Shift Type System
// =============================================================================
// To add a new shift type:
//   1. Add an entry to ShiftCategory
//   2. Create a new class extending ShiftDefinition
//   3. Register it in SHIFT_DEFINITIONS
// =============================================================================

export enum ShiftCategory {
  PIC         = 'PIC',
  Accounts    = 'Accounts',
  Info        = 'Info',
  Welcome     = 'Welcome',
  Float       = 'Float',
  Support     = 'Support',
  Programming = 'Programming',
}

export enum EmployeeStatus {
  FullTime    = 'FT',
  PartTime    = 'PT',
  Programming = 'Programming',
}

/** Valid part-time shift durations in hours */
export const VALID_PT_HOURS = [8, 6, 4] as const;
export type ValidPTHours = (typeof VALID_PT_HOURS)[number];

// ---------------------------------------------------------------------------
// Abstract base — extend this class to define a new shift type
// ---------------------------------------------------------------------------
export abstract class ShiftDefinition {
  abstract readonly category:        ShiftCategory;
  abstract readonly requiredStatus:  EmployeeStatus;
  abstract readonly minHours:        number;
  abstract readonly maxHours:        number;
  abstract readonly label:           string;
  /** Hex colour used to render this shift in the calendar UI */
  abstract readonly color:           string;
}

// ---------------------------------------------------------------------------
// Concrete shift definitions — one class per shift type
// ---------------------------------------------------------------------------

export class PICShiftDef extends ShiftDefinition {
  readonly category       = ShiftCategory.PIC;
  readonly requiredStatus = EmployeeStatus.FullTime;
  readonly minHours       = 8;
  readonly maxHours       = 8;
  readonly label          = 'Person in Charge';
  readonly color          = '#6366f1'; // indigo
}

export class AccountsShiftDef extends ShiftDefinition {
  readonly category       = ShiftCategory.Accounts;
  readonly requiredStatus = EmployeeStatus.PartTime;
  readonly minHours       = 4;
  readonly maxHours       = 8;
  readonly label          = 'Accounts';
  readonly color          = '#0ea5e9'; // sky
}

export class InfoShiftDef extends ShiftDefinition {
  readonly category       = ShiftCategory.Info;
  readonly requiredStatus = EmployeeStatus.PartTime;
  readonly minHours       = 4;
  readonly maxHours       = 8;
  readonly label          = 'Info';
  readonly color          = '#10b981'; // emerald
}

export class WelcomeShiftDef extends ShiftDefinition {
  readonly category       = ShiftCategory.Welcome;
  readonly requiredStatus = EmployeeStatus.PartTime;
  readonly minHours       = 4;
  readonly maxHours       = 8;
  readonly label          = 'Welcome';
  readonly color          = '#f59e0b'; // amber
}

export class FloatShiftDef extends ShiftDefinition {
  readonly category       = ShiftCategory.Float;
  readonly requiredStatus = EmployeeStatus.PartTime;
  readonly minHours       = 4;
  readonly maxHours       = 8;
  readonly label          = 'Float';
  readonly color          = '#ef4444'; // red
}

export class SupportShiftDef extends ShiftDefinition {
  readonly category       = ShiftCategory.Support;
  readonly requiredStatus = EmployeeStatus.PartTime;
  readonly minHours       = 4;
  readonly maxHours       = 8;
  readonly label          = 'Support';
  readonly color          = '#a855f7'; // purple
}

export class ProgrammingShiftDef extends ShiftDefinition {
  readonly category       = ShiftCategory.Programming;
  readonly requiredStatus = EmployeeStatus.Programming;
  readonly minHours       = 4;
  readonly maxHours       = 8;
  readonly label          = 'Programming';
  readonly color          = '#ec4899'; // pink
}

// ---------------------------------------------------------------------------
// Registry — add new ShiftDefinition instances here
// ---------------------------------------------------------------------------
export const SHIFT_DEFINITIONS: Readonly<Record<ShiftCategory, ShiftDefinition>> = {
  [ShiftCategory.PIC]:         new PICShiftDef(),
  [ShiftCategory.Accounts]:    new AccountsShiftDef(),
  [ShiftCategory.Info]:        new InfoShiftDef(),
  [ShiftCategory.Welcome]:     new WelcomeShiftDef(),
  [ShiftCategory.Float]:       new FloatShiftDef(),
  [ShiftCategory.Support]:     new SupportShiftDef(),
  [ShiftCategory.Programming]: new ProgrammingShiftDef(),
};

// ---------------------------------------------------------------------------
// Runtime data shapes
// ---------------------------------------------------------------------------

/**
 * Describes what role coverage is needed for a given day.
 * The scheduler decomposes this into one or more concrete ShiftSlots.
 */
export interface CoverageRequirement {
  category:      ShiftCategory;
  /** Earliest hour this role should start (usually day openHour) */
  coverageStart: number;
  /** Latest hour this role's coverage should end (≤ day closeHour) */
  coverageEnd:   number;
}

/** A concrete shift slot to be filled by an employee */
export interface ShiftSlot {
  id:                 string;
  definition:         ShiftDefinition;
  startHour:          number;
  endHour:            number;
  assignedEmployeeId: string | null;
}
