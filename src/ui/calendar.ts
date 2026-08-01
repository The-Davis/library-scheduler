import { MonthSchedule, monthName } from '../types/schedule';
import { Day } from '../types/day';
import { ShiftSlot, SHIFT_DEFINITIONS, ShiftCategory } from '../types/shift';
import { Employee } from '../types/employee';

// ---------------------------------------------------------------------------
// Calendar renderer
// Builds the full calendar DOM from a MonthSchedule and injects into #calendar
// ---------------------------------------------------------------------------

const DAY_ABBRS      = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function renderCalendar(
  schedule:    MonthSchedule,
  container:   HTMLElement,
  employeeMap: Map<string, Employee>,
  onDayClick?: (day: Day) => void,
): void {
  container.innerHTML = '';

  // --- Heading row (title + print button) ---
  const headingRow = document.createElement('div');
  headingRow.className = 'calendar-heading-row';

  const heading = document.createElement('h2');
  heading.className   = 'calendar-heading';
  heading.textContent = `${monthName(schedule.month)} ${schedule.year}`;

  const printBtn = document.createElement('button');
  printBtn.id        = 'calendar-print-btn';
  printBtn.className = 'btn btn--ghost btn--sm';
  printBtn.innerHTML = '🖨&thinsp;Print';
  printBtn.setAttribute('aria-label', 'Print monthly schedule');
  printBtn.addEventListener('click', () => printCalendar(schedule, employeeMap));

  headingRow.appendChild(heading);
  headingRow.appendChild(printBtn);
  container.appendChild(headingRow);

  // --- Day-of-week column headers ---
  const header = document.createElement('div');
  header.className = 'calendar-header';
  for (const abbr of DAY_ABBRS) {
    const cell = document.createElement('div');
    cell.className = 'cal-day-header';
    cell.textContent = abbr;
    header.appendChild(cell);
  }
  container.appendChild(header);

  // --- Weeks ---
  const grid = document.createElement('div');
  grid.className = 'calendar-grid';

  for (const week of schedule.weeks) {
    const row = document.createElement('div');
    row.className = 'calendar-row';

    for (const day of week) {
      const cell = buildDayCell(day, employeeMap, onDayClick);
      row.appendChild(cell);
    }

    grid.appendChild(row);
  }

  container.appendChild(grid);
}

// ---------------------------------------------------------------------------
// Build a single day cell
// ---------------------------------------------------------------------------

function buildDayCell(
  day:         Day | null,
  employeeMap: Map<string, Employee>,
  onDayClick?: (day: Day) => void,
): HTMLElement {
  const cell = document.createElement('div');

  if (!day) {
    cell.className = 'cal-cell cal-cell--empty';
    return cell;
  }

  if (day.isClosed) {
    cell.className = 'cal-cell cal-cell--closed';
    const dateNum = document.createElement('span');
    dateNum.className = 'cal-date';
    dateNum.textContent = String(day.date.getDate());
    cell.appendChild(dateNum);

    if (day.isHoliday) {
      const badge = document.createElement('span');
      badge.className = 'cal-holiday-badge';
      badge.textContent = '🏖 Holiday';
      cell.appendChild(badge);
    }

    return cell;
  }

  cell.className = 'cal-cell cal-cell--open';

  // If a click handler is provided, make the whole cell clickable
  if (onDayClick) {
    cell.classList.add('cal-cell--clickable');
    cell.setAttribute('role', 'button');
    cell.setAttribute('tabindex', '0');
    cell.title = 'Click to open daily shift schedule';
    cell.addEventListener('click', () => onDayClick(day));
    cell.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onDayClick(day);
      }
    });
  }

  // Date number
  const dateNum = document.createElement('span');
  dateNum.className = 'cal-date';
  dateNum.textContent = String(day.date.getDate());
  cell.appendChild(dateNum);

  // "View daily schedule" hint (only when clickable)
  if (onDayClick) {
    const hint = document.createElement('span');
    hint.className   = 'cal-daily-hint';
    hint.textContent = '↗ daily';
    hint.setAttribute('aria-hidden', 'true');
    cell.appendChild(hint);
  }

  // Hours badge
  const hoursBadge = document.createElement('span');
  hoursBadge.className = 'cal-hours';
  hoursBadge.textContent = `${day.openHour}:00–${day.closeHour}:00`;
  cell.appendChild(hoursBadge);

  // Shift assignments grouped by category
  const grouped = groupByCategory(day.assignments);
  const catOrder: ShiftCategory[] = [
    ShiftCategory.PIC, ShiftCategory.Accounts, ShiftCategory.Info,
    ShiftCategory.Welcome, ShiftCategory.Float, ShiftCategory.Support,
    ShiftCategory.Programming,
  ];

  for (const cat of catOrder) {
    const slots = grouped.get(cat);
    if (!slots || slots.length === 0) continue;

    const section = document.createElement('div');
    section.className = 'cal-role-section';

    const def = SHIFT_DEFINITIONS[cat];
    const roleLabel = document.createElement('div');
    roleLabel.className = 'cal-role-label';
    roleLabel.textContent = def.label;
    roleLabel.style.borderLeftColor = def.color;
    section.appendChild(roleLabel);

    for (const slot of slots) {
      const chip = buildShiftChip(slot, employeeMap, def.color);
      section.appendChild(chip);
    }

    cell.appendChild(section);
  }

  return cell;
}

// ---------------------------------------------------------------------------
// Build a shift chip (employee + time)
// ---------------------------------------------------------------------------

function buildShiftChip(
  slot:        ShiftSlot,
  employeeMap: Map<string, Employee>,
  color:       string,
): HTMLElement {
  const chip = document.createElement('div');
  chip.className = 'cal-shift-chip';
  chip.style.borderLeftColor = color;
  chip.style.setProperty('--chip-color', color);

  const dur   = slot.endHour - slot.startHour;
  const empId = slot.assignedEmployeeId;
  const emp   = empId ? employeeMap.get(empId) : undefined;

  const name = document.createElement('span');
  name.className = 'chip-name';
  name.textContent = emp ? emp.name : '⚠ Unassigned';
  if (!emp) chip.classList.add('cal-shift-chip--unassigned');

  const time = document.createElement('span');
  time.className = 'chip-time';
  time.textContent = `${slot.startHour}:00–${slot.endHour}:00 (${dur}h)`;

  chip.appendChild(name);
  chip.appendChild(time);

  // Tooltip with details
  chip.title = emp
    ? `${emp.name} | ${slot.definition.label} | ${slot.startHour}:00–${slot.endHour}:00 (${dur}h) | ${emp.status}`
    : `Unassigned | ${slot.definition.label} | ${slot.startHour}:00–${slot.endHour}:00`;

  return chip;
}

// ---------------------------------------------------------------------------
// Render employee summary table
// ---------------------------------------------------------------------------

export interface WeeklySummaryRow {
  employee:    Employee;
  weeklyHours: number[];
  totalHours:  number;
}

/** Context passed alongside the summary rows so the section can self-contain print/export */
export interface SummaryContext {
  year:  number;
  month: number; // 0-indexed
}

export function renderSummary(
  rows:      WeeklySummaryRow[],
  container: HTMLElement,
  numWeeks:  number,
  ctx:       SummaryContext,
): void {
  container.innerHTML = '';

  // ── Heading + action buttons ──────────────────────────────────────────────
  const headingRow = document.createElement('div');
  headingRow.className = 'summary-heading-row';

  const heading = document.createElement('h3');
  heading.className   = 'summary-heading';
  heading.textContent = 'Employee Hour Summary';

  const actions = document.createElement('div');
  actions.className = 'summary-actions';

  const printBtn = document.createElement('button');
  printBtn.id        = 'summary-print-btn';
  printBtn.className = 'btn btn--ghost btn--sm';
  printBtn.innerHTML = '🖨&thinsp;Print';
  printBtn.setAttribute('aria-label', 'Print employee hour summary');

  const dlBtn = document.createElement('button');
  dlBtn.id        = 'summary-download-btn';
  dlBtn.className = 'btn btn--ghost btn--sm';
  dlBtn.innerHTML = '⬇&thinsp;CSV';
  dlBtn.setAttribute('aria-label', 'Download employee hour summary as CSV');

  actions.appendChild(printBtn);
  actions.appendChild(dlBtn);
  headingRow.appendChild(heading);
  headingRow.appendChild(actions);
  container.appendChild(headingRow);

  // ── Build sorted rows (FT first, then alpha) ──────────────────────────────
  const sorted = [...rows].sort((a, b) => {
    if (a.employee.status !== b.employee.status) {
      return a.employee.status === 'FT' ? -1 : 1;
    }
    return a.employee.name.localeCompare(b.employee.name);
  });

  const weekCols = Array.from({ length: numWeeks }, (_, i) => `Wk ${i + 1}`);
  const cols     = ['Employee', 'Status', ...weekCols, 'Total'];

  // ── Table ─────────────────────────────────────────────────────────────────
  const table = document.createElement('table');
  table.id        = 'summary-table';
  table.className = 'summary-table';

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  for (const col of cols) {
    const th = document.createElement('th');
    th.textContent = col;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  for (const row of sorted) {
    const tr = document.createElement('tr');
    tr.className = row.employee.status === 'FT' ? 'row-ft' : 'row-pt';

    const nameTd = document.createElement('td');
    nameTd.textContent = row.employee.name;
    tr.appendChild(nameTd);

    const statusTd = document.createElement('td');
    statusTd.textContent = row.employee.status;
    statusTd.className   = `status-badge status-${row.employee.status.toLowerCase()}`;
    tr.appendChild(statusTd);

    for (let w = 0; w < numWeeks; w++) {
      const td = document.createElement('td');
      const h  = row.weeklyHours[w] ?? 0;
      td.textContent = h > 0 ? String(h) : '–';
      if (row.employee.status === 'FT' && h !== 40 && h > 0) td.classList.add('hours-warning');
      if (h > 0) td.classList.add('has-hours');
      tr.appendChild(td);
    }

    const totalTd = document.createElement('td');
    totalTd.textContent = String(row.totalHours);
    totalTd.className   = 'col-total';
    tr.appendChild(totalTd);

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  container.appendChild(table);

  // ── Wire buttons (after table is in DOM so data is available) ────────────
  printBtn.addEventListener('click', () =>
    printSummary(sorted, cols, ctx),
  );
  dlBtn.addEventListener('click', () =>
    downloadSummaryCSV(sorted, numWeeks, ctx),
  );
}

// ---------------------------------------------------------------------------
// Print — opens a clean B&W landscape window
// ---------------------------------------------------------------------------

const MONTH_NAMES_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function printSummary(
  sorted: WeeklySummaryRow[],
  cols:   string[],
  ctx:    SummaryContext,
): void {
  const win = window.open('', '_blank', 'width=1100,height=750');
  if (!win) { alert('Print blocked — please allow pop-ups for this site.'); return; }

  const monthLabel = MONTH_NAMES_FULL[ctx.month];
  const title      = `${monthLabel} ${ctx.year} — Employee Hour Summary`;

  const headerHtml = cols
    .map(c => `<th>${escSummary(c)}</th>`)
    .join('');

  const bodyHtml = sorted.map(row => {
    const statusCell = `<td>${escSummary(row.employee.status)}</td>`;
    const weekCells  = row.weeklyHours
      .map(h => `<td class="num">${h > 0 ? h : '–'}</td>`)
      .join('');
    const totalCell  = `<td class="num total">${row.totalHours}</td>`;
    const ftClass    = row.employee.status === 'FT' ? ' class="ft"' : '';
    return `<tr${ftClass}><td>${escSummary(row.employee.name)}</td>${statusCell}${weekCells}${totalCell}</tr>`;
  }).join('\n');

  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escSummary(title)}</title>
  <style>
    @page  { size: landscape; margin: 0.5in; }
    *      { box-sizing: border-box; margin: 0; padding: 0; }
    body   { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #000; background: #fff; }
    h1     { font-size: 14px; font-weight: bold; margin-bottom: 8px; }
    table  { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #000; padding: 3px 6px; }
    th     { background: #d8d8d8; font-weight: bold; text-align: left; }
    td.num { text-align: right; }
    td.total { font-weight: bold; background: #f0f0f0; }
    tr.ft td:first-child { font-weight: 700; }
    tr:nth-child(even) { background: #f8f8f8; }
  </style>
</head>
<body>
  <h1>${escSummary(title)}</h1>
  <table>
    <thead><tr>${headerHtml}</tr></thead>
    <tbody>${bodyHtml}</tbody>
  </table>
  <script>window.onload = () => window.print();<\/script>
</body>
</html>`);
  win.document.close();
}

// ---------------------------------------------------------------------------
// CSV download
// ---------------------------------------------------------------------------

function downloadSummaryCSV(
  sorted:   WeeklySummaryRow[],
  numWeeks: number,
  ctx:      SummaryContext,
): void {
  const monthSlug = MONTH_NAMES_FULL[ctx.month].toLowerCase();
  const filename  = `${ctx.year}_${monthSlug}_employee_hour_summary.csv`;

  const weekHeaders = Array.from({ length: numWeeks }, (_, i) => `Wk ${i + 1}`);
  const header = ['Employee', 'Status', ...weekHeaders, 'Total Hours'];

  const dataRows = sorted.map(row => [
    row.employee.name,
    row.employee.status,
    ...row.weeklyHours.map(h => String(h)),
    String(row.totalHours),
  ]);

  const csv = [header, ...dataRows]
    .map(r => r.map(cell => csvCell(cell)).join(','))
    .join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Wrap a cell value in quotes if it contains commas, quotes, or newlines */
function csvCell(value: string): string {
  if (/[,"\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function escSummary(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Legend
// ---------------------------------------------------------------------------

export function renderLegend(container: HTMLElement): void {
  container.innerHTML = '';

  const catOrder: ShiftCategory[] = [
    ShiftCategory.PIC, ShiftCategory.Accounts, ShiftCategory.Info,
    ShiftCategory.Welcome, ShiftCategory.Float, ShiftCategory.Support,
    ShiftCategory.Programming,
  ];

  for (const cat of catOrder) {
    const def  = SHIFT_DEFINITIONS[cat];
    const item = document.createElement('div');
    item.className = 'legend-item';

    const swatch = document.createElement('span');
    swatch.className = 'legend-swatch';
    swatch.style.background = def.color;

    const label = document.createElement('span');
    label.textContent = def.label;

    item.appendChild(swatch);
    item.appendChild(label);
    container.appendChild(item);
  }
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Print calendar — clean B&W landscape output
// ---------------------------------------------------------------------------

const PRINT_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function printCalendar(
  schedule:    MonthSchedule,
  employeeMap: Map<string, Employee>,
): void {
  const win = window.open('', '_blank', 'width=1400,height=900');
  if (!win) { alert('Print blocked — please allow pop-ups for this site.'); return; }

  const monthLabel = PRINT_MONTH_NAMES[schedule.month];
  const title      = `${monthLabel} ${schedule.year} — Staff Schedule`;

  // Build the day-of-week header row
  const dowHeader = DAY_FULL_NAMES
    .map(d => `<th>${d}</th>`)
    .join('');

  // Build week rows
  const weekRows = schedule.weeks.map(week => {
    const cells = week.map(day => {
      if (!day) return '<td class="empty"></td>';

      if (day.isClosed) {
        const label = day.isHoliday ? 'Holiday' : 'Closed';
        return `<td class="closed"><span class="dn">${day.date.getDate()}</span><span class="cl">${label}</span></td>`;
      }

      // Sort assignments by start hour, then by employee name
      const sorted = [...day.assignments]
        .filter(s => s.assignedEmployeeId)
        .sort((a, b) => {
          if (a.startHour !== b.startHour) return a.startHour - b.startHour;
          const na = employeeMap.get(a.assignedEmployeeId!)?.name ?? '';
          const nb = employeeMap.get(b.assignedEmployeeId!)?.name ?? '';
          return na.localeCompare(nb);
        });

      const entries = sorted.map(slot => {
        const emp  = employeeMap.get(slot.assignedEmployeeId!);
        const name = emp ? escCal(emp.name) : '<em>Unassigned</em>';
        return `<div class="entry">${name} <span class="hrs">${slot.startHour}:00–${slot.endHour}:00</span></div>`;
      }).join('');

      return `<td><span class="dn">${day.date.getDate()}</span>${entries}</td>`;
    }).join('');

    return `<tr>${cells}</tr>`;
  }).join('\n');

  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escCal(title)}</title>
  <style>
    @page  { size: landscape; margin: 0.4in; }
    *      { box-sizing: border-box; margin: 0; padding: 0; }
    body   { font-family: Arial, Helvetica, sans-serif; font-size: 9.5px; color: #000; background: #fff; }
    h1     { font-size: 15px; font-weight: bold; margin-bottom: 8px; text-align: center; }
    table  { border-collapse: collapse; width: 100%; table-layout: fixed; }
    th     { border: 1px solid #000; padding: 4px 3px; text-align: center;
             font-weight: bold; font-size: 10px; background: #d0d0d0; }
    td     { border: 1px solid #888; padding: 3px; vertical-align: top;
             height: 110px; width: 14.285%; }
    td.empty  { border: 1px solid #ccc; background: #f5f5f5; }
    td.closed { background: #e8e8e8; color: #555; }
    .dn    { display: block; font-size: 12px; font-weight: bold; margin-bottom: 3px;
             border-bottom: 1px solid #ccc; padding-bottom: 2px; }
    .cl    { display: block; font-size: 9px; color: #777; text-align: center;
             margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
    .entry { font-size: 8.5px; line-height: 1.35; padding: 1px 0;
             border-bottom: 1px dotted #ddd; white-space: nowrap;
             overflow: hidden; text-overflow: ellipsis; }
    .entry:last-child { border-bottom: none; }
    .hrs   { color: #444; font-size: 8px; }
    .tbd   { color: #999; font-style: italic; }
  </style>
</head>
<body>
  <h1>${escCal(title)}</h1>
  <table>
    <thead><tr>${dowHeader}</tr></thead>
    <tbody>${weekRows}</tbody>
  </table>
  <script>window.onload = () => window.print();<\/script>
</body>
</html>`);
  win.document.close();
}

function escCal(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function groupByCategory(slots: ShiftSlot[]): Map<ShiftCategory, ShiftSlot[]> {

  const map = new Map<ShiftCategory, ShiftSlot[]>();
  for (const slot of slots) {
    const cat = slot.definition.category;
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(slot);
  }
  // Sort each group by start hour
  for (const [, group] of map) {
    group.sort((a, b) => a.startHour - b.startHour);
  }
  return map;
}
