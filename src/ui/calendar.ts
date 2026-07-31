import { MonthSchedule, monthName } from '../types/schedule';
import { Day } from '../types/day';
import { ShiftSlot, SHIFT_DEFINITIONS, ShiftCategory } from '../types/shift';
import { Employee } from '../types/employee';

// ---------------------------------------------------------------------------
// Calendar renderer
// Builds the full calendar DOM from a MonthSchedule and injects into #calendar
// ---------------------------------------------------------------------------

const DAY_ABBRS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function renderCalendar(
  schedule:    MonthSchedule,
  container:   HTMLElement,
  employeeMap: Map<string, Employee>,
): void {
  container.innerHTML = '';

  // --- Month header ---
  const heading = document.createElement('h2');
  heading.className = 'calendar-heading';
  heading.textContent = `${monthName(schedule.month)} ${schedule.year}`;
  container.appendChild(heading);

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
      const cell = buildDayCell(day, employeeMap);
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

  // Date number
  const dateNum = document.createElement('span');
  dateNum.className = 'cal-date';
  dateNum.textContent = String(day.date.getDate());
  cell.appendChild(dateNum);

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

export function renderSummary(
  rows:      WeeklySummaryRow[],
  container: HTMLElement,
  numWeeks:  number,
): void {
  container.innerHTML = '';

  const heading = document.createElement('h3');
  heading.className = 'summary-heading';
  heading.textContent = 'Employee Hour Summary';
  container.appendChild(heading);

  const table = document.createElement('table');
  table.className = 'summary-table';

  // Header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const cols = ['Employee', 'Status', ...Array.from({ length: numWeeks }, (_, i) => `Wk ${i + 1}`), 'Total'];
  for (const col of cols) {
    const th = document.createElement('th');
    th.textContent = col;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Body
  const tbody = document.createElement('tbody');

  // Sort: FT first, then PT
  const sorted = [...rows].sort((a, b) => {
    if (a.employee.status !== b.employee.status) {
      return a.employee.status === 'FT' ? -1 : 1;
    }
    return a.employee.name.localeCompare(b.employee.name);
  });

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
