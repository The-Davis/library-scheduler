import { Employee, EmployeeInit, DayOfWeek, CloseThenOpenPref } from '../types/employee';
import { EmployeeStatus } from '../types/shift';
import { SeededRandom } from '../algorithm/seeded-random';

// ---------------------------------------------------------------------------
// Deterministic demo employee roster for the September 2026 proof-of-concept.
// Uses a fixed seed (42) so names/preferences are always the same.
// ---------------------------------------------------------------------------

const DEMO_SEED = 42;

// Name pools for random generation
const FIRST_NAMES = [
  'Alice', 'Bob', 'Carol', 'David', 'Emma', 'Frank', 'Grace', 'Henry',
  'Isabel', 'James', 'Karen', 'Leo', 'Maya', 'Nathan', 'Olivia', 'Paul',
  'Quinn', 'Rachel', 'Sam', 'Tara', 'Uma', 'Victor', 'Wendy', 'Xavier',
  'Yolanda', 'Zach',
];

const LAST_NAMES = [
  'Adams', 'Baker', 'Carter', 'Davis', 'Evans', 'Foster', 'Green', 'Harris',
  'Ingram', 'Johnson', 'King', 'Lewis', 'Martin', 'Nash', 'Owen', 'Parker',
  'Quinn', 'Reed', 'Smith', 'Taylor', 'Underwood', 'Vance', 'Walker', 'Young',
];

const ALL_WEEKDAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function pickSome<T>(rng: SeededRandom, arr: T[], min: number, max: number): T[] {
  const count  = rng.nextInt(min, max);
  const shuffled = rng.shuffle(arr);
  return shuffled.slice(0, count);
}

function pickOne<T>(rng: SeededRandom, arr: T[]): T {
  return rng.pick(arr);
}

// ---------------------------------------------------------------------------
// Hard-coded Full Time employees
// ---------------------------------------------------------------------------
const FT_EMPLOYEES: EmployeeInit[] = [
  {
    id:                 'ft-001',
    name:               'Jordan Hayes',
    status:             EmployeeStatus.FullTime,
    preferredDays:      ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    notAvailableDays:   [],
    closeThenOpenPref:  'avoid',
  },
  {
    id:                 'ft-002',
    name:               'Morgan Ellis',
    status:             EmployeeStatus.FullTime,
    preferredDays:      ['Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    notAvailableDays:   [],
    closeThenOpenPref:  'neutral',
  },
  {
    id:                 'ft-003',
    name:               'Avery Simmons',
    status:             EmployeeStatus.FullTime,
    preferredDays:      ['Monday', 'Wednesday', 'Friday', 'Saturday'],
    notAvailableDays:   [],
    closeThenOpenPref:  'avoid',
    preferredCoworkers: ['ft-001'],
  },
  {
    id:                 'ft-004',
    name:               'Casey Thornton',
    status:             EmployeeStatus.FullTime,
    preferredDays:      ['Thursday', 'Friday', 'Saturday'],
    notAvailableDays:   [],
    closeThenOpenPref:  'prefer',
    avoidCoworkers:     ['ft-002'],
  },
];

// ---------------------------------------------------------------------------
// Randomly-generated Part Time employees
// ---------------------------------------------------------------------------
function generatePTEmployees(rng: SeededRandom, count: number): EmployeeInit[] {
  const used = new Set<string>();
  const employees: EmployeeInit[] = [];

  for (let i = 0; i < count; i++) {
    // Pick a unique name
    let name: string;
    let attempts = 0;
    do {
      name = `${pickOne(rng, FIRST_NAMES)} ${pickOne(rng, LAST_NAMES)}`;
      attempts++;
    } while (used.has(name) && attempts < 50);
    used.add(name);

    const id              = `pt-${String(i + 1).padStart(3, '0')}`;
    const notAvailable    = pickSome(rng, ALL_WEEKDAYS, 0, 1) as DayOfWeek[];
    const preferred       = pickSome(rng, ALL_WEEKDAYS.filter(d => !notAvailable.includes(d)), 1, 3) as DayOfWeek[];
    const minHours        = 12;
    const maxHours        = rng.pick([16, 20, 24, 28, 32]);
    const closeThenOpen   = rng.pick<CloseThenOpenPref>(['prefer', 'avoid', 'avoid', 'neutral']);

    // Occasionally add coworker preferences
    const priorIds        = employees.map(e => e.id as string);
    const preferredCo     = priorIds.length > 0 && rng.next() < 0.3
      ? [rng.pick(priorIds)]
      : [];
    const avoidCo         = priorIds.length > 0 && rng.next() < 0.2
      ? [rng.pick(priorIds.filter(pid => !preferredCo.includes(pid)))]
      : [];

    // Some employees have unavailable hours (e.g. mornings or evenings)
    type UHItem = { day: DayOfWeek; start: number; end: number };
    const unavailableHours: UHItem[] = [];
    if (rng.next() < 0.25) {
      const day = rng.pick(ALL_WEEKDAYS);
      if (rng.next() < 0.5) {
        unavailableHours.push({ day, start: 9, end: 13 }); // no mornings
      } else {
        unavailableHours.push({ day, start: 17, end: 21 }); // no evenings
      }
    }

    employees.push({
      id,
      name,
      status:             EmployeeStatus.PartTime,
      minHoursPerWeek:    minHours,
      maxHoursPerWeek:    maxHours,
      notAvailableDays:   notAvailable,
      preferredDays:      preferred,
      unavailableHours,
      preferredHours:     [],
      preferredCoworkers: preferredCo,
      avoidCoworkers:     avoidCo.length > 0 ? avoidCo : [],
      closeThenOpenPref:  closeThenOpen,
    });
  }

  return employees;
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/** Returns the demonstration employee roster (4 FT + 21 PT). Always identical. */
export function getDemoEmployees(): Employee[] {
  const rng = new SeededRandom(DEMO_SEED);
  const ptInits = generatePTEmployees(rng, 21);

  return [
    ...FT_EMPLOYEES.map(init => new Employee(init)),
    ...ptInits.map(init => new Employee(init)),
  ];
}

/**
 * Returns the Programming shifts to add for the September 2026 demo.
 * Returns an array of { dateStr, count } objects used by the scheduler.
 */
export function getDemoProgrammingDays(): { dateStr: string; count: number }[] {
  // Programming is usually 2 per weekday and 1 on some Saturdays
  // For Sep 2026 demo: every weekday gets 2, three Saturdays get 1
  const weekdays = [
    '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04',   // week 1 (Tue–Fri)
    '2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11',
    '2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18',
    '2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25',
    '2026-09-28', '2026-09-29', '2026-09-30',
  ];
  const saturdays = ['2026-09-05', '2026-09-12', '2026-09-26'];

  return [
    ...weekdays.map(d  => ({ dateStr: d, count: 2 })),
    ...saturdays.map(d => ({ dateStr: d, count: 1 })),
  ];
}
