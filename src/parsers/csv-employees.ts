import { Employee, EmployeeInit, DaySpec, parseDaySpec, CloseThenOpenPref } from '../types/employee';
import { EmployeeStatus } from '../types/shift';

// ---------------------------------------------------------------------------
// Employees CSV parser
// ---------------------------------------------------------------------------
// Expected CSV format (header row required):
//
//   name,status,min_hours,max_hours,not_available_days,preferred_days,
//   preferred_coworkers,avoid_coworkers,close_then_open
//
// Columns:
//   name              — full name (string)
//   status            — FT | PT | Programming
//   min_hours         — minimum hours per week (ignored for FT)
//   max_hours         — maximum hours per week (ignored for FT)
//   not_available_days — pipe-separated DaySpec tokens (see below)
//   preferred_days    — pipe-separated DaySpec tokens
//   preferred_coworkers — pipe-separated names (matched by name)
//   avoid_coworkers   — pipe-separated names
//   close_then_open   — prefer | avoid | neutral
//
// DaySpec token formats (case-insensitive, pipe-separated):
//   "15"       → that calendar date (the 15th of the scheduled month)
//   "Monday"   → every Monday in the scheduled month
//   "Monday3"  → the third Monday of the scheduled month
// ---------------------------------------------------------------------------

export const EMPLOYEES_CSV_TEMPLATE = `name,status,min_hours,max_hours,not_available_days,preferred_days,preferred_coworkers,avoid_coworkers,close_then_open
Jordan Hayes,FT,40,40,,,,,avoid
Alice Smith,PT,12,24,Saturday,Monday|Tuesday,Jordan Hayes,,avoid
Bob Jones,PT,16,32,,Wednesday|Friday,,Alice Smith,neutral
Dana Lee,PT,12,20,15|Monday3,Tuesday|Friday,,,neutral
`;


export interface EmployeeCSVRow {
  name:               string;
  status:             EmployeeStatus;
  minHoursPerWeek:    number;
  maxHoursPerWeek:    number;
  notAvailableDays:   DaySpec[];
  preferredDays:      DaySpec[];
  preferredCoworkers: string[];
  avoidCoworkers:     string[];
  closeThenOpenPref:  CloseThenOpenPref;
}

/**
 * Parse a raw employees CSV string into an Employee[].
 * Coworker references are resolved by name → id after all rows are read.
 */
export function parseEmployeesCSV(raw: string): Employee[] {
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  // Detect and skip header row
  const dataLines = lines[0].toLowerCase().includes('name') ? lines.slice(1) : lines;

  const rows: EmployeeCSVRow[] = [];

  for (const line of dataLines) {
    if (line.startsWith('#')) continue;
    const cols = parseCSVLine(line);
    if (cols.length < 2) continue;

    const name   = cols[0]?.trim() ?? '';
    if (!name) continue;

    const statusRaw = (cols[1]?.trim() ?? 'PT').toUpperCase();
    const status: EmployeeStatus =
      statusRaw === 'FT'          ? EmployeeStatus.FullTime
      : statusRaw === 'PROG' || statusRaw === 'PROGRAMMING'
                                  ? EmployeeStatus.Programming
                                  : EmployeeStatus.PartTime;

    const minHours = parseInt(cols[2] ?? '', 10) || 12;
    const maxHours = parseInt(cols[3] ?? '', 10) || 32;

    const notAvail   = parseDayList(cols[4] ?? '');
    const preferred  = parseDayList(cols[5] ?? '');
    const prefCoNames = parseNameList(cols[6] ?? '');
    const avoidCoNames = parseNameList(cols[7] ?? '');
    const closePref  = parseClosePref(cols[8] ?? '');

    rows.push({
      name, status, minHoursPerWeek: minHours, maxHoursPerWeek: maxHours,
      notAvailableDays: notAvail, preferredDays: preferred,
      preferredCoworkers: prefCoNames, avoidCoworkers: avoidCoNames,
      closeThenOpenPref: closePref,
    });
  }

  // Build name → id lookup for resolving coworker references
  const nameToId = new Map<string, string>();
  rows.forEach((r, i) => {
    const id = `emp-${String(i + 1).padStart(3, '0')}`;
    nameToId.set(r.name.toLowerCase(), id);
  });

  return rows.map((r, i) => {
    const id = `emp-${String(i + 1).padStart(3, '0')}`;

    const resolveNames = (names: string[]): string[] =>
      names
        .map(n => nameToId.get(n.toLowerCase()))
        .filter((id): id is string => id !== undefined);

    const init: EmployeeInit = {
      id,
      name:               r.name,
      status:             r.status,
      minHoursPerWeek:    r.minHoursPerWeek,
      maxHoursPerWeek:    r.maxHoursPerWeek,
      notAvailableDays:   r.notAvailableDays,
      preferredDays:      r.preferredDays,
      preferredCoworkers: resolveNames(r.preferredCoworkers),
      avoidCoworkers:     resolveNames(r.avoidCoworkers),
      closeThenOpenPref:  r.closeThenOpenPref,
    };

    return new Employee(init);
  });
}

// ---------------------------------------------------------------------------
// Parse helpers
// ---------------------------------------------------------------------------

/**
 * Parse a pipe-separated list of DaySpec tokens from a CSV cell.
 * Silently drops any token that cannot be parsed.
 */
function parseDayList(raw: string): DaySpec[] {
  if (!raw.trim()) return [];
  return raw.split('|')
    .map(token => parseDaySpec(token.trim()))
    .filter((s): s is DaySpec => s !== null);
}

function parseNameList(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw.split('|').map(n => n.trim()).filter(Boolean);
}

function parseClosePref(raw: string): CloseThenOpenPref {
  const v = raw.trim().toLowerCase();
  if (v === 'prefer') return 'prefer';
  if (v === 'avoid')  return 'avoid';
  return 'neutral';
}

function parseCSVLine(line: string): string[] {
  const cols: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      cols.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cols.push(current);
  return cols;
}
