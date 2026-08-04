/**
 * generate-sample-csvs.js
 *
 * Standalone Node.js script (no TS compilation needed) that replicates
 * the demo.ts logic using the same mulberry32 PRNG and seed=42.
 *
 * Outputs:
 *   sample-data/september-2026-shifts.csv
 *   sample-data/demo-employees.csv
 */

const fs   = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'sample-data');
fs.mkdirSync(OUT_DIR, { recursive: true });

// ──────────────────────────────────────────────────────────────────────────
// mulberry32 PRNG — identical to src/algorithm/seeded-random.ts
// ──────────────────────────────────────────────────────────────────────────
function createRng(seed) {
  let state = (seed >>> 0) || 0x6d2b79f5;

  function next() {
    state = (state + 0x6d2b79f5) | 0;
    let z = Math.imul(state ^ (state >>> 15), 1 | state);
    z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
    return ((z ^ (z >>> 14)) >>> 0) / 0x100000000;
  }

  return {
    next,
    nextInt(min, max) { return Math.floor(next() * (max - min + 1)) + min; },
    pick(arr)         { return arr[Math.floor(next() * arr.length)]; },
    shuffle(arr) {
      const out = [...arr];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────
// 1. SHIFTS CSV — September 2026
// ──────────────────────────────────────────────────────────────────────────
//
// Default shifts (PIC, Accounts, Info, Welcome, Float, Support) are
// handled automatically by the app — no CSV rows needed for them.
//
// This file adds Programming shifts and shows how to mark a holiday.
// ──────────────────────────────────────────────────────────────────────────

const weekdayDates = [
  // Week 1 (library closed Mon 08-31 — month starts Tue Sep 1)
  '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04',
  // Week 2
  '2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11',
  // Week 3
  '2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18',
  // Week 4
  '2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25',
  // Week 5
  '2026-09-28', '2026-09-29', '2026-09-30',
];

// Three of the four Saturdays have a single Programming session
const saturdayProgDates = ['2026-09-05', '2026-09-12', '2026-09-26'];

let shiftsRows = [
  '# September 2026 — Shifts Override / Supplement File',
  '# ─────────────────────────────────────────────────────────────────────',
  '# Columns: date, action, category, count',
  '#',
  '# action = "add"     → add slots on top of daily defaults',
  '#          "holiday" → mark day closed (columns 3-4 ignored)',
  '#          "override"→ replace ALL default requirements for this date',
  '#',
  '# Default shifts generated automatically each open day:',
  '#   Mon–Thu: PIC×2(FT 8h), Accounts, Info, Welcome, Float, Support',
  '#   Fri:     PIC×1(FT 8h), Accounts, Info, Welcome, Float, Support',
  '#   Sat:     PIC×1(FT 8h), Accounts, Info, Welcome, Float(until 14)',
  '#   Sun:     closed (no rows needed)',
  '#',
  '# ─── HOLIDAY EXAMPLE ────────────────────────────────────────────────',
  '# Uncomment the next line to close the library on Labour Day:',
  '# 2026-09-07,holiday,,',
  '#',
  '# ─── PROGRAMMING SHIFTS ─────────────────────────────────────────────',
  'date,action,category,count',
];

for (const d of weekdayDates) {
  shiftsRows.push(`${d},add,Programming,2`);
}
for (const d of saturdayProgDates) {
  shiftsRows.push(`${d},add,Programming,1`);
}

const shiftsOut = path.join(OUT_DIR, 'september-2026-shifts.csv');
fs.writeFileSync(shiftsOut, shiftsRows.join('\n') + '\n', 'utf8');
console.log(`✓ Written ${shiftsRows.filter(r => !r.startsWith('#')).length - 1} shift rows → ${shiftsOut}`);

// ──────────────────────────────────────────────────────────────────────────
// 2. EMPLOYEES CSV — 4 FT + 21 PT
// ──────────────────────────────────────────────────────────────────────────

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

const ALL_WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CLOSE_PREFS  = ['prefer', 'avoid', 'avoid', 'neutral'];
const MAX_HOURS_OPTIONS = [16, 20, 24, 28, 32];

const DEMO_SEED = 42;
const rng = createRng(DEMO_SEED);

// ── Hardcoded FT employees (matches demo.ts) ──────────────────────────────
const ftEmployees = [
  {
    name:               'Jordan Hayes',
    status:             'FT',
    shiftSizes:         '',
    minHours:           40,
    maxHours:           40,
    notAvailDays:       '',
    preferredDays:      'Monday|Tuesday|Wednesday|Thursday',
    preferredCoworkers: '',
    avoidCoworkers:     '',
    closeThenOpen:      'avoid',
  },
  {
    name:               'Morgan Ellis',
    status:             'FT',
    shiftSizes:         '',
    minHours:           40,
    maxHours:           40,
    notAvailDays:       '',
    preferredDays:      'Tuesday|Wednesday|Thursday|Friday',
    preferredCoworkers: '',
    avoidCoworkers:     '',
    closeThenOpen:      'neutral',
  },
  {
    name:               'Avery Simmons',
    status:             'FT',
    shiftSizes:         '',
    minHours:           40,
    maxHours:           40,
    notAvailDays:       '',
    preferredDays:      'Monday|Wednesday|Friday|Saturday',
    preferredCoworkers: 'Jordan Hayes',
    avoidCoworkers:     '',
    closeThenOpen:      'avoid',
  },
  {
    name:               'Casey Thornton',
    status:             'FT',
    shiftSizes:         '',
    minHours:           40,
    maxHours:           40,
    notAvailDays:       '',
    preferredDays:      'Thursday|Friday|Saturday',
    preferredCoworkers: '',
    avoidCoworkers:     'Morgan Ellis',
    closeThenOpen:      'prefer',
  },
];

// ── Randomly-generated PT employees (identical logic to demo.ts) ──────────
function pickSome(arr, min, max) {
  const count   = rng.nextInt(min, max);
  const shuffled = rng.shuffle(arr);
  return shuffled.slice(0, count);
}

const ptEmployees = [];
const usedNames   = new Set();
const allNames    = [];  // track in order for coworker resolution by name

// First pass: generate FT names
for (const ft of ftEmployees) allNames.push(ft.name);

for (let i = 0; i < 21; i++) {
  // Pick unique name
  let name;
  let attempts = 0;
  do {
    name = `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
    attempts++;
  } while (usedNames.has(name) && attempts < 50);
  usedNames.add(name);
  allNames.push(name);

  const notAvail    = pickSome(ALL_WEEKDAYS, 0, 1);
  const available   = ALL_WEEKDAYS.filter(d => !notAvail.includes(d));
  const preferred   = pickSome(available, 1, 3);
  const maxHours    = rng.pick(MAX_HOURS_OPTIONS);
  const closePref   = rng.pick(CLOSE_PREFS);

  // Coworker preferences (look back at prior employees)
  const priorNames  = allNames.slice(0, allNames.length - 1); // everyone before this employee
  const prefCoName  = priorNames.length > 0 && rng.next() < 0.3
    ? [rng.pick(priorNames)]
    : [];
  const avoidFilter = priorNames.filter(n => !prefCoName.includes(n));
  const avoidCoName = avoidFilter.length > 0 && rng.next() < 0.2
    ? [rng.pick(avoidFilter)]
    : [];

  // Unavailable hours (skipped in CSV for simplicity — not a supported column yet)
  // Advance the RNG the same number of times as demo.ts does
  if (rng.next() < 0.25) {
    rng.pick(ALL_WEEKDAYS); // consume one pick for the day
    rng.next();              // consume one next for am/pm choice
  }

  // Add shiftSizes for a few PT employees as variation
  let shiftSizes = '';
  if (i === 0) shiftSizes = '4|6';
  else if (i === 1) shiftSizes = '8';
  else if (i === 2) shiftSizes = '6|8';

  ptEmployees.push({
    name,
    status:             'PT',
    shiftSizes,
    minHours:           12,
    maxHours,
    notAvailDays:       notAvail.join('|'),
    preferredDays:      preferred.join('|'),
    preferredCoworkers: prefCoName.join('|'),
    avoidCoworkers:     avoidCoName.join('|'),
    closeThenOpen:      closePref,
  });
}

// ── Build CSV ──────────────────────────────────────────────────────────────
function csvRow(obj) {
  const fields = [
    obj.name,
    obj.status,
    obj.shiftSizes,
    obj.minHours,
    obj.maxHours,
    obj.notAvailDays,
    obj.preferredDays,
    obj.preferredCoworkers,
    obj.avoidCoworkers,
    obj.closeThenOpen,
  ];
  // Quote any field containing a comma
  return fields.map(f => String(f).includes(',') ? `"${f}"` : String(f)).join(',');
}

const empHeader = [
  '# Demo Employee Roster — September 2026',
  '# ─────────────────────────────────────────────────────────────────────',
  '# 4 Full Time (FT) + 21 Part Time (PT) employees',
  '#',
  '# Columns:',
  '#   name              — full name',
  '#   status            — FT | PT | Programming',
  '#   shift_sizes       — pipe-separated numbers, e.g. 4|8 (PT only, valid: 4,6,8)',
  '#   min_hours         — minimum hours per week (ignored for FT, always 40)',
  '#   max_hours         — maximum hours per week (ignored for FT, always 40)',
  '#   not_available_days — pipe-separated DaySpec tokens (see formats below)',
  '#   preferred_days     — pipe-separated DaySpec tokens',
  '#   preferred_coworkers — pipe-separated names (must match exactly)',
  '#   avoid_coworkers    — pipe-separated names',
  '#   close_then_open    — prefer | avoid | neutral',
  '#',
  '# DaySpec token formats (case-insensitive, pipe-separate multiple):',
  '#   "15"      → the 15th calendar date of the scheduled month',
  '#   "Monday"  → every Monday in the scheduled month',
  '#   "Monday3" → the 3rd Monday of the scheduled month (nth can be 1–5)',
  '# Examples: "Saturday", "15", "Monday3", "Saturday|15", "Monday3|Friday"',
  '#',
  'name,status,shift_sizes,min_hours,max_hours,not_available_days,preferred_days,preferred_coworkers,avoid_coworkers,close_then_open',
];

const empRows = [
  ...empHeader,
  ...ftEmployees.map(csvRow),
  '',
  '# ── Part Time Employees ──────────────────────────────────────────────',
  ...ptEmployees.map(csvRow),
];

const empOut = path.join(OUT_DIR, 'demo-employees.csv');
fs.writeFileSync(empOut, empRows.join('\n') + '\n', 'utf8');
console.log(`✓ Written ${ftEmployees.length + ptEmployees.length} employees → ${empOut}`);

console.log('\n📂 Sample data files are in:', OUT_DIR);
