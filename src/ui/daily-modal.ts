import { DailySchedule, DailyRow, DailyCell, DAILY_ROLES } from '../types/daily-schedule';
import { Employee } from '../types/employee';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Called whenever any cell or employee override changes */
export type OnScheduleChange = (schedule: DailySchedule) => void;

/**
 * Render and open the daily schedule modal.
 *
 * @param schedule         The (possibly pre-existing) daily schedule to display
 * @param allEmployees     Full employee roster (used for sick-coverage dropdown)
 * @param scheduledEmpIds  IDs of employees already in this day's schedule
 * @param onChange         Callback fired on every user edit
 */
export function showDailyModal(
  schedule:        DailySchedule,
  allEmployees:    Employee[],
  scheduledEmpIds: Set<string>,
  onChange:        OnScheduleChange,
): void {
  // Remove any stale modal first
  document.getElementById('daily-modal-overlay')?.remove();
  document.removeEventListener('keydown', handleEscKey);

  const overlay = document.createElement('div');
  overlay.id        = 'daily-modal-overlay';
  overlay.className = 'daily-modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'daily-modal-title');

  // Click on backdrop to close
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeDailyModal();
  });

  const modal = document.createElement('div');
  modal.className = 'daily-modal';

  // Header
  modal.appendChild(buildHeader(schedule));

  // Grid wrapper (scrollable)
  const gridWrap = document.createElement('div');
  gridWrap.className = 'daily-grid-wrapper';

  const unscheduled = allEmployees.filter(e => !scheduledEmpIds.has(e.id));
  gridWrap.appendChild(buildGrid(schedule, unscheduled, onChange));

  modal.appendChild(gridWrap);
  overlay.appendChild(modal);
  document.getElementById('app')!.appendChild(overlay);

  // Keyboard: Esc to close
  document.addEventListener('keydown', handleEscKey);
}

export function closeDailyModal(): void {
  const overlay = document.getElementById('daily-modal-overlay');
  if (overlay) {
    overlay.classList.add('daily-modal--closing');
    setTimeout(() => overlay.remove(), 200);
  }
  document.getElementById('emp-override-menu')?.remove();
  document.removeEventListener('keydown', handleEscKey);
}

// ---------------------------------------------------------------------------
// Keyboard handler (module-level so it can be removed)
// ---------------------------------------------------------------------------

function handleEscKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') closeDailyModal();
}

// ---------------------------------------------------------------------------
// Modal header
// ---------------------------------------------------------------------------

function buildHeader(schedule: DailySchedule): HTMLElement {
  const header = document.createElement('div');
  header.className = 'daily-modal-header';

  // Title block
  const titleBlock = document.createElement('div');
  titleBlock.className = 'daily-title-block';

  const title = document.createElement('h2');
  title.id          = 'daily-modal-title';
  title.className   = 'daily-modal-title';
  title.textContent = `${schedule.dayOfWeek} Daily Shift Schedule`;

  const dateLine = document.createElement('p');
  dateLine.className   = 'daily-modal-date';
  dateLine.textContent = schedule.dateLabel;

  titleBlock.appendChild(title);
  titleBlock.appendChild(dateLine);

  // Action buttons
  const actions = document.createElement('div');
  actions.className = 'daily-modal-actions';

  const printBtn = document.createElement('button');
  printBtn.id        = 'daily-print-btn';
  printBtn.className = 'btn btn--ghost btn--sm';
  printBtn.setAttribute('aria-label', 'Print daily schedule');
  printBtn.innerHTML = '🖨&thinsp;Print';
  printBtn.addEventListener('click', () => printDailySchedule(schedule));

  const closeBtn = document.createElement('button');
  closeBtn.id        = 'daily-close-btn';
  closeBtn.className = 'btn btn--ghost btn--sm daily-close-btn';
  closeBtn.setAttribute('aria-label', 'Close daily schedule');
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', closeDailyModal);

  actions.appendChild(printBtn);
  actions.appendChild(closeBtn);

  header.appendChild(titleBlock);
  header.appendChild(actions);
  return header;
}

// ---------------------------------------------------------------------------
// Grid table
// ---------------------------------------------------------------------------

function buildGrid(
  schedule:     DailySchedule,
  unscheduled:  Employee[],
  onChange:     OnScheduleChange,
): HTMLTableElement {
  const table = document.createElement('table');
  table.className = 'daily-grid';
  table.id        = 'daily-grid-table';

  // Shared datalist for role autocomplete
  const datalist = document.createElement('datalist');
  datalist.id = 'daily-roles-list';
  for (const role of DAILY_ROLES) {
    const opt = document.createElement('option');
    opt.value = role;
    datalist.appendChild(opt);
  }
  table.appendChild(datalist);

  // ── Header row ───────────────────────────────────────────────────────────
  const thead = document.createElement('thead');
  const headTr = document.createElement('tr');

  const empTh = document.createElement('th');
  empTh.className   = 'daily-th daily-col-emp';
  empTh.textContent = 'Employee';
  headTr.appendChild(empTh);

  for (const h of schedule.hours) {
    const th = document.createElement('th');
    th.className   = 'daily-th daily-col-hour';
    th.textContent = `${h}:00`;
    headTr.appendChild(th);
  }

  thead.appendChild(headTr);
  table.appendChild(thead);

  // ── Body rows ─────────────────────────────────────────────────────────────
  const tbody = document.createElement('tbody');

  schedule.rows.forEach((row, rowIdx) => {
    const tr = document.createElement('tr');
    tr.className = rowIdx % 2 === 0 ? 'daily-row-even' : 'daily-row-odd';
    tr.dataset['rowIdx'] = String(rowIdx);

    // First column — employee name / sick-coverage override
    const empTd = document.createElement('td');
    empTd.className = 'daily-td daily-col-emp';

    const empBtn = document.createElement('button');
    empBtn.className   = 'daily-emp-btn';
    empBtn.textContent = row.employeeName;
    empBtn.title       = unscheduled.length > 0
      ? 'Click to substitute with another employee (e.g. sick coverage)'
      : 'No unscheduled employees available for substitution';

    if (unscheduled.length > 0) {
      empBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showEmpOverrideMenu(empBtn, row, unscheduled, schedule, onChange);
      });
    } else {
      empBtn.classList.add('daily-emp-btn--no-sub');
    }

    empTd.appendChild(empBtn);
    tr.appendChild(empTd);

    // Hour cells
    row.cells.forEach((cell, colIdx) => {
      const td = document.createElement('td');
      td.className = 'daily-td';

      if (cell === null) {
        // Not on duty this hour
        td.classList.add('daily-cell--off');
        td.setAttribute('aria-hidden', 'true');
      } else {
        td.appendChild(buildCellInput(cell, row, colIdx, schedule, onChange));
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  return table;
}

// ---------------------------------------------------------------------------
// Individual cell input (text + datalist dropdown)
// ---------------------------------------------------------------------------

function buildCellInput(
  cell:     DailyCell,
  row:      DailyRow,
  colIdx:   number,
  schedule: DailySchedule,
  onChange: OnScheduleChange,
): HTMLInputElement {
  const input = document.createElement('input');
  input.type  = 'text';
  input.setAttribute('list', 'daily-roles-list');
  input.value = cell.role;
  input.className = 'daily-cell-input' + (cell.locked ? ' daily-cell-input--locked' : '');
  input.setAttribute(
    'aria-label',
    `${row.employeeName} duty at ${schedule.hours[colIdx]}:00`,
  );

  // Commit on change (dropdown select or blur after typing)
  const commit = (): void => {
    const val = input.value.trim();
    cell.role   = val || 'TBD';
    cell.locked = true;
    input.value = cell.role;
    input.classList.add('daily-cell-input--locked');
    onChange(schedule);
  };

  input.addEventListener('change', commit);
  input.addEventListener('blur', () => {
    if (input.value !== cell.role) commit();
  });

  return input;
}

// ---------------------------------------------------------------------------
// Employee override (sick coverage) popup menu
// ---------------------------------------------------------------------------

function showEmpOverrideMenu(
  anchor:      HTMLButtonElement,
  row:         DailyRow,
  unscheduled: Employee[],
  schedule:    DailySchedule,
  onChange:    OnScheduleChange,
): void {
  // Close any open menu first
  document.getElementById('emp-override-menu')?.remove();

  const menu = document.createElement('div');
  menu.id        = 'emp-override-menu';
  menu.className = 'emp-override-menu';
  menu.setAttribute('role', 'listbox');
  menu.setAttribute('aria-label', 'Select substitute employee');

  // Section title
  const menuTitle = document.createElement('div');
  menuTitle.className   = 'emp-override-title';
  menuTitle.textContent = 'Substitute with:';
  menu.appendChild(menuTitle);

  // "Keep current" option
  const keepBtn = document.createElement('button');
  keepBtn.className   = 'emp-override-item emp-override-item--current';
  keepBtn.textContent = `✓ ${row.employeeName} (current)`;
  keepBtn.setAttribute('role', 'option');
  keepBtn.addEventListener('click', () => menu.remove());
  menu.appendChild(keepBtn);

  // Unscheduled employees
  for (const emp of unscheduled) {
    const btn = document.createElement('button');
    btn.className   = 'emp-override-item';
    btn.textContent = `${emp.name} (${emp.status})`;
    btn.setAttribute('role', 'option');
    btn.addEventListener('click', () => {
      row.employeeId   = emp.id;
      row.employeeName = emp.name;
      anchor.textContent = emp.name;
      onChange(schedule);
      menu.remove();
    });
    menu.appendChild(btn);
  }

  // Position below the anchor button, inside the modal overlay
  const overlay   = document.getElementById('daily-modal-overlay')!;
  const anchorRect = anchor.getBoundingClientRect();
  const overlayRect = overlay.getBoundingClientRect();

  menu.style.top  = `${anchorRect.bottom - overlayRect.top + 4}px`;
  menu.style.left = `${anchorRect.left   - overlayRect.left}px`;
  overlay.appendChild(menu);

  // Close on outside click
  const closeMenu = (e: Event): void => {
    if (!menu.contains(e.target as Node) && e.target !== anchor) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    }
  };
  setTimeout(() => document.addEventListener('click', closeMenu), 0);
}

// ---------------------------------------------------------------------------
// Print
// ---------------------------------------------------------------------------

function printDailySchedule(schedule: DailySchedule): void {
  const win = window.open('', '_blank', 'width=1400,height=800');
  if (!win) {
    alert('Print blocked — please allow pop-ups for this site.');
    return;
  }

  const headerCells = [
    `<th class="ec">Employee</th>`,
    ...schedule.hours.map(h => `<th class="hc">${h}:00</th>`),
  ].join('');

  const bodyRows = schedule.rows.map(row => {
    const cells = row.cells.map(cell => {
      if (cell === null) return `<td class="off"></td>`;
      return `<td class="dc">${esc(cell.role)}</td>`;
    }).join('');
    return `<tr><td class="en">${esc(row.employeeName)}</td>${cells}</tr>`;
  }).join('\n');

  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${esc(schedule.dayOfWeek)} Daily Shift Schedule — ${esc(schedule.dateLabel)}</title>
  <style>
    @page  { size: landscape; margin: 0.45in; }
    *      { box-sizing: border-box; margin: 0; padding: 0; }
    body   { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #000; background: #fff; }
    h1     { font-size: 15px; font-weight: bold; margin-bottom: 2px; }
    p.sub  { font-size: 10px; color: #555; margin-bottom: 8px; }
    table  { border-collapse: collapse; width: 100%; table-layout: auto; }
    th, td { border: 1px solid #000; padding: 2px 4px; vertical-align: middle; }
    th     { background: #e0e0e0; font-weight: bold; white-space: nowrap; }
    th.ec  { min-width: 120px; text-align: left; }
    th.hc  { min-width: 52px; text-align: center; font-size: 10px; }
    td.en  { font-weight: 600; white-space: nowrap; text-align: left; }
    td.dc  { text-align: center; font-size: 10px; }
    td.off { background: #f0f0f0; }
    @media print { body { font-size: 10px; } }
  </style>
</head>
<body>
  <h1>${esc(schedule.dayOfWeek)} Daily Shift Schedule</h1>
  <p class="sub">${esc(schedule.dateLabel)}</p>
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
  <script>window.onload = () => window.print();<\/script>
</body>
</html>`);
  win.document.close();
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
