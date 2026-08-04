import { Employee } from '../types/employee';
import { MonthSchedule } from '../types/schedule';
import { Day } from '../types/day';
import { DayOverride, runScheduler } from '../algorithm/scheduler';
import { DailySchedule } from '../types/daily-schedule';
import { buildDailySchedule } from '../algorithm/daily-scheduler';
import { showDailyModal } from './daily-modal';
import { getDemoEmployees, getDemoProgrammingDays } from '../data/demo';
import { parseShiftsCSV, SHIFTS_CSV_TEMPLATE } from '../parsers/csv-shifts';
import { parseEmployeesCSV, EMPLOYEES_CSV_TEMPLATE } from '../parsers/csv-employees';
import { renderCalendar, renderSummary, renderLegend, WeeklySummaryRow, SummaryContext } from './calendar';
import { getCalendarWeekIndex } from '../types/day';
import { showRosterEditor } from './roster-editor';
import { showShiftEditor } from './shift-editor';
import { showSettingsModal } from './settings-modal';
import { loadStateFromStorage, saveStateToStorage } from '../storage';

// ---------------------------------------------------------------------------
// App state
// ---------------------------------------------------------------------------

interface AppState {
  year:              number;
  month:             number;
  seed:              number;
  showCsvSection:    boolean;
  employees:         Employee[];
  overrides:         Map<string, DayOverride>;
  schedule:          MonthSchedule | null;
  weeklyHoursMap:    Map<string, number[]>;
  /** Per-day daily schedules, keyed by 'YYYY-MM-DD'. Persisted across modal open/close. */
  dailySchedules:    Map<string, DailySchedule>;
}

// ---------------------------------------------------------------------------
// Controls wiring
// ---------------------------------------------------------------------------

export function initApp(): void {
  const saved = loadStateFromStorage();
  
  const state: AppState = {
    year:           saved ? saved.year : 2026,
    month:          saved ? saved.month : 8, // September = index 8
    seed:           saved ? saved.seed : 12345,
    showCsvSection: saved ? saved.showCsvSection : false,
    employees:      saved ? saved.employees : getDemoEmployees(),
    overrides:      saved ? saved.overrides : buildDemoOverrides(),
    schedule:       null,
    weeklyHoursMap: new Map(),
    dailySchedules: new Map(),
  };
  
  const save = () => {
    saveStateToStorage(state.year, state.month, state.seed, state.showCsvSection, state.employees, state.overrides);
  };

  // --- DOM refs ---
  const yearInput       = getEl<HTMLInputElement>('year-input');
  const monthSelect     = getEl<HTMLSelectElement>('month-select');
  const seedInput       = getEl<HTMLInputElement>('seed-input');
  const generateBtn     = getEl<HTMLButtonElement>('generate-btn');
  const editShiftsBtn   = getEl<HTMLButtonElement>('edit-shifts-btn');
  const settingsBtn     = getEl<HTMLButtonElement>('settings-btn');
  const shiftsFileInput = getEl<HTMLInputElement>('shifts-file');
  const empFileInput    = getEl<HTMLInputElement>('employees-file');
  const csvSection      = getEl<HTMLElement>('csv-section');
  const calContainer    = getEl<HTMLElement>('calendar-container');
  const summaryEl       = getEl<HTMLElement>('summary-container');
  const legendEl        = getEl<HTMLElement>('legend-container');
  const shiftsFilename  = getEl<HTMLElement>('shifts-filename');
  const empFilename     = getEl<HTMLElement>('emp-filename');
  const statusEl        = getEl<HTMLElement>('status-bar');
  const dlShiftsTpl     = getEl<HTMLButtonElement>('dl-shifts-template');
  const dlEmpTpl        = getEl<HTMLButtonElement>('dl-employees-template');

  // Populate month selector
  for (let m = 0; m < 12; m++) {
    const opt = document.createElement('option');
    opt.value = String(m);
    opt.textContent = new Date(2000, m, 1).toLocaleString('default', { month: 'long' });
    if (m === state.month) opt.selected = true;
    monthSelect.appendChild(opt);
  }

  // Set initial input values
  yearInput.value = String(state.year);
  seedInput.value = String(state.seed);
  
  // Set initial CSV section visibility
  csvSection.style.display = state.showCsvSection ? 'block' : 'none';

  // --- Event listeners ---

  yearInput.addEventListener('change', () => {
    state.year = parseInt(yearInput.value, 10) || 2026;
    state.dailySchedules.clear();
    save();
  });

  monthSelect.addEventListener('change', () => {
    state.month = parseInt(monthSelect.value, 10);
    state.dailySchedules.clear();
    save();
  });

  seedInput.addEventListener('change', () => {
    state.seed = parseInt(seedInput.value, 10) || 12345;
    state.dailySchedules.clear();
    save();
  });

  shiftsFileInput.addEventListener('change', async () => {
    const file = shiftsFileInput.files?.[0];
    if (!file) return;
    shiftsFilename.textContent = file.name;
    try {
      const raw = await file.text();
      const parsed = parseShiftsCSV(raw);
      state.overrides = parsed; // No longer merging with demo if they upload real
      save();
      setStatus(`✓ Shifts file loaded: ${file.name}`, 'success');
    } catch (e) {
      setStatus(`⚠ Could not parse shifts file: ${(e as Error).message}`, 'error');
    }
  });

  empFileInput.addEventListener('change', async () => {
    const file = empFileInput.files?.[0];
    if (!file) return;
    empFilename.textContent = file.name;
    try {
      const raw = await file.text();
      const parsed = parseEmployeesCSV(raw);
      if (parsed.length > 0) {
        state.employees = parsed;
        state.dailySchedules.clear();
        save();
        setStatus(`✓ Employees file loaded: ${file.name} (${parsed.length} employees)`, 'success');
      } else {
        setStatus('⚠ No employees found in CSV.', 'error');
      }
    } catch (e) {
      setStatus(`⚠ Could not parse employees file: ${(e as Error).message}`, 'error');
    }
  });

  dlShiftsTpl.addEventListener('click', () => {
    downloadText(SHIFTS_CSV_TEMPLATE, 'shifts-template.csv', 'text/csv');
  });

  dlEmpTpl.addEventListener('click', () => {
    downloadText(EMPLOYEES_CSV_TEMPLATE, 'employees-template.csv', 'text/csv');
  });

  generateBtn.addEventListener('click', () => {
    state.dailySchedules.clear();
    runAndRender(state, calContainer, summaryEl, statusEl);
  });

  editShiftsBtn.addEventListener('click', () => {
    showShiftEditor(state, (newOverrides) => {
      state.overrides = newOverrides;
      state.dailySchedules.clear();
      save();
      runAndRender(state, calContainer, summaryEl, statusEl);
    });
  });

  settingsBtn.addEventListener('click', () => {
    showSettingsModal(state, (newState) => {
      // Re-apply state changes
      state.showCsvSection = newState.showCsvSection;
      csvSection.style.display = state.showCsvSection ? 'block' : 'none';
      save();
    });
  });

  // --- Render legend (static, doesn't depend on schedule) ---
  renderLegend(legendEl);

  // --- Auto-generate demo on load ---
  runAndRender(state, calContainer, summaryEl, statusEl);

  function setStatus(msg: string, type: 'info' | 'success' | 'error'): void {
    statusEl.textContent = msg;
    statusEl.className   = `status-bar status-${type}`;
  }
}

// ---------------------------------------------------------------------------
// Run scheduler and render output
// ---------------------------------------------------------------------------

function runAndRender(
  state:     AppState,
  calEl:     HTMLElement,
  summaryEl: HTMLElement,
  statusEl:  HTMLElement,
): void {
  const t0 = performance.now();

  // Rebuild weeklyHoursMap on every run
  state.weeklyHoursMap = new Map();

  try {
    const schedule = runScheduler({
      year:      state.year,
      month:     state.month,
      seed:      state.seed,
      employees: state.employees,
      overrides: state.overrides,
    });

    state.schedule = schedule;

    // Build employee lookup map
    const empMap = new Map<string, Employee>();
    for (const emp of schedule.employees) {
      empMap.set(emp.id, emp);
    }

    // Reconstruct weeklyHoursMap from assignments
    const totalWeeks = schedule.weeks.length;
    for (const day of schedule.allDays) {
      if (day.isClosed) continue;
      const wi = getCalendarWeekIndex(day.date, state.year, state.month);
      for (const slot of day.assignments) {
        if (!slot.assignedEmployeeId) continue;
        const dur = slot.endHour - slot.startHour;
        const arr = state.weeklyHoursMap.get(slot.assignedEmployeeId) ??
                    new Array(totalWeeks).fill(0);
        arr[wi] = (arr[wi] ?? 0) + dur;
        state.weeklyHoursMap.set(slot.assignedEmployeeId, arr);
      }
    }

    // Day-click handler: open (or restore) daily schedule modal
    const onDayClick = (day: Day) => {
      if (day.isClosed) return;

      const dateStr = toDateStr(day.date);

      // Retrieve cached schedule or build a new one
      if (!state.dailySchedules.has(dateStr)) {
        state.dailySchedules.set(dateStr, buildDailySchedule(day, empMap));
      }

      const dailySched = state.dailySchedules.get(dateStr)!;

      // Build the set of employee IDs currently in this daily schedule
      const scheduledIds = new Set(dailySched.rows.map(r => r.employeeId));

      showDailyModal(
        dailySched,
        schedule.employees,
        scheduledIds,
        // onChange: the schedule is mutated in place by the modal;
        // we just need to ensure it stays in the map (it already does)
        (updated) => { state.dailySchedules.set(updated.dateStr, updated); },
      );
    };

    // Render calendar with click handler
    renderCalendar(schedule, calEl, empMap, onDayClick);

    // Compute and render summary
    const summaryRows: WeeklySummaryRow[] = schedule.employees.map(emp => {
      const wh = state.weeklyHoursMap.get(emp.id) ?? new Array(totalWeeks).fill(0);
      return { employee: emp, weeklyHours: [...wh], totalHours: wh.reduce((a, b) => a + b, 0) };
    });
    const ctx: SummaryContext = {
      year: state.year,
      month: state.month,
      onEditRoster: () => {
        showRosterEditor(state.employees, (emps) => {
          state.employees = emps;
          state.dailySchedules.clear();
          saveStateToStorage(state.year, state.month, state.seed, state.showCsvSection, state.employees, state.overrides);
          runAndRender(state, calEl, summaryEl, statusEl);
        });
      },
    };
    renderSummary(summaryRows, summaryEl, totalWeeks, ctx);

    const elapsed    = (performance.now() - t0).toFixed(0);
    const unassigned = schedule.allDays
      .flatMap(d => d.assignments)
      .filter(s => !s.assignedEmployeeId).length;

    const msg = unassigned > 0
      ? `⚠ Schedule generated in ${elapsed}ms — ${unassigned} slot(s) unassigned`
      : `✓ Schedule generated in ${elapsed}ms — all slots filled`;

    statusEl.textContent = msg;
    statusEl.className   = `status-bar status-${unassigned > 0 ? 'warn' : 'success'}`;

  } catch (err) {
    statusEl.textContent = `⚠ Error: ${(err as Error).message}`;
    statusEl.className   = 'status-bar status-error';
    console.error(err);
  }
}

// ---------------------------------------------------------------------------
// Demo overrides (Programming shifts for Sept 2026 PoC)
// ---------------------------------------------------------------------------

function buildDemoOverrides(): Map<string, DayOverride> {
  const map = new Map<string, DayOverride>();
  for (const { dateStr, count } of getDemoProgrammingDays()) {
    map.set(dateStr, { addProgramming: count });
  }
  return map;
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function getEl<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id) as T | null;
  if (!el) throw new Error(`Element #${id} not found in DOM`);
  return el;
}

function downloadText(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function toDateStr(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}
