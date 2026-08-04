import { Employee, EmployeeInit, parseDaySpec } from '../types/employee';
import { EmployeeStatus } from '../types/shift';

export type OnRosterSave = (employees: Employee[]) => void;

/**
 * Validates a pipe-separated string of DaySpecs.
 * Returns true if all tokens are valid or if the string is empty.
 */
function validateDaySpecs(raw: string): boolean {
  if (!raw.trim()) return true;
  const tokens = raw.split('|');
  for (const t of tokens) {
    if (parseDaySpec(t.trim()) === null) return false;
  }
  return true;
}

/**
 * Validates coworker names against a set of known names.
 * Returns true if all tokens are known or if the string is empty.
 */
function validateCoworkers(raw: string, allNames: Set<string>): boolean {
  if (!raw.trim()) return true;
  const tokens = raw.split('|').map(n => n.trim().toLowerCase()).filter(Boolean);
  for (const t of tokens) {
    if (!allNames.has(t)) return false;
  }
  return true;
}

/**
 * Validates shift sizes for PT employees.
 */
function validateShiftSizes(raw: string): boolean {
  if (!raw.trim()) return true;
  const tokens = raw.split('|').map(s => parseInt(s.trim(), 10));
  for (const n of tokens) {
    if (isNaN(n) || (n !== 4 && n !== 6 && n !== 8)) return false;
  }
  return true;
}

export function showRosterEditor(currentEmployees: Employee[], onSave: OnRosterSave): void {
  // --- Create modal overlay ---
  const overlay = document.createElement('div');
  overlay.className = 'daily-modal-overlay';
  overlay.id = 'roster-modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'daily-modal roster-modal-content';

  const header = document.createElement('div');
  header.className = 'daily-modal-header';
  
  const titleBlock = document.createElement('div');
  titleBlock.className = 'daily-title-block';
  const title = document.createElement('h2');
  title.className = 'daily-modal-title';
  title.textContent = 'Edit Roster';
  titleBlock.appendChild(title);
  header.appendChild(titleBlock);

  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'daily-modal-actions';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn btn--ghost daily-close-btn';
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', () => overlay.remove());
  actionsDiv.appendChild(closeBtn);
  
  header.appendChild(actionsDiv);

  modal.appendChild(header);

  // --- Create Grid ---
  const table = document.createElement('table');
  table.className = 'roster-table';

  const thead = document.createElement('thead');
  const headTr = document.createElement('tr');
  const headers = [
    'Name', 'Status', 'Shift Sizes (4|6|8)', 'Min Hrs', 'Max Hrs',
    'Not Available', 'Preferred Days', 'Preferred Coworkers', 'Avoid Coworkers',
    'Close\u2192Open', '' // Action column
  ];
  headers.forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    headTr.appendChild(th);
  });
  thead.appendChild(headTr);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  table.appendChild(tbody);

  // We maintain an array of active row controllers to serialize later
  const rowControllers: (() => EmployeeInit | null)[] = [];

  // Recompute the set of known names for live coworker validation
  const getKnownNames = () => {
    const names = new Set<string>();
    for (const ctrl of rowControllers) {
      const init = ctrl();
      if (init && init.name.trim()) names.add(init.name.trim().toLowerCase());
    }
    return names;
  };

  const validateAllRows = () => {
    const inputs = tbody.querySelectorAll('input[type="text"]');
    inputs.forEach(el => el.dispatchEvent(new Event('input')));
  };

  function addRow(init?: EmployeeInit) {
    const tr = document.createElement('tr');

    const createInput = (val: string, placeholder: string, validator?: (val: string) => boolean) => {
      const td = document.createElement('td');
      const input = document.createElement('input');
      input.type = 'text';
      input.value = val;
      input.placeholder = placeholder;
      input.className = 'roster-input';
      
      if (validator) {
        input.addEventListener('input', () => {
          if (!validator(input.value)) {
            input.classList.add('roster-input--invalid');
          } else {
            input.classList.remove('roster-input--invalid');
          }
        });
      }
      td.appendChild(input);
      tr.appendChild(td);
      return input;
    };

    const createNum = (val: number, placeholder: string) => {
      const td = document.createElement('td');
      const input = document.createElement('input');
      input.type = 'number';
      input.value = String(val);
      input.placeholder = placeholder;
      input.className = 'roster-input roster-input--num';
      td.appendChild(input);
      tr.appendChild(td);
      return input;
    };

    const createSelect = (opts: string[], val: string) => {
      const td = document.createElement('td');
      const select = document.createElement('select');
      select.className = 'roster-select';
      for (const o of opts) {
        const opt = document.createElement('option');
        opt.value = o;
        opt.textContent = o;
        if (o === val) opt.selected = true;
        select.appendChild(opt);
      }
      td.appendChild(select);
      tr.appendChild(td);
      return select;
    };

    const inpName = createInput(init?.name ?? '', 'Name');
    inpName.addEventListener('input', validateAllRows); // Re-validate coworkers when a name changes

    const selStatus = createSelect(['FT', 'PT', 'Programming'], init?.status ?? 'PT');
    
    const inpShiftSizes = createInput(init?.shiftSizes?.join('|') ?? '', 'e.g. 4|8', validateShiftSizes);
    const inpMinHours = createNum(init?.minHoursPerWeek ?? 12, 'Min');
    const inpMaxHours = createNum(init?.maxHoursPerWeek ?? 32, 'Max');
    
    // DaySpec formatters
    const toDS = (specs?: { type: string, date?: number, name?: string, nth?: number }[]) => {
      if (!specs) return '';
      return specs.map(s => {
        if (s.type === 'date') return String(s.date);
        if (s.type === 'weekday') return s.name;
        if (s.type === 'nth-weekday') return `${s.name}${s.nth}`;
        return '';
      }).join('|');
    };

    const inpNotAvail = createInput(toDS(init?.notAvailableDays), 'e.g. 15|Monday', validateDaySpecs);
    const inpPrefDays = createInput(toDS(init?.preferredDays), 'e.g. Friday', validateDaySpecs);
    
    // Coworker validation uses the dynamic getter
    const coValidator = (val: string) => validateCoworkers(val, getKnownNames());
    // Wait, initially, we need ID -> Name translation. 
    // currentEmployees was passed in, but the user edits text.
    // Let's create a map to translate init's IDs back to names for initial render.
    const idToName = new Map(currentEmployees.map(e => [e.id, e.name]));
    const toNames = (ids?: string[]) => ids ? ids.map(id => idToName.get(id) || id).join('|') : '';

    const inpPrefCo = createInput(toNames(init?.preferredCoworkers), 'e.g. Alice', coValidator);
    const inpAvoidCo = createInput(toNames(init?.avoidCoworkers), 'e.g. Bob', coValidator);
    
    const selCloseOpen = createSelect(['prefer', 'avoid', 'neutral'], init?.closeThenOpenPref ?? 'neutral');

    // Remove button
    const tdAction = document.createElement('td');
    const btnRemove = document.createElement('button');
    btnRemove.className = 'roster-remove-btn';
    btnRemove.innerHTML = '&minus;';
    btnRemove.title = 'Remove employee';
    btnRemove.addEventListener('click', () => {
      tr.remove();
      const idx = rowControllers.indexOf(serialize);
      if (idx !== -1) rowControllers.splice(idx, 1);
      validateAllRows();
    });
    tdAction.appendChild(btnRemove);
    tr.appendChild(tdAction);

    tbody.appendChild(tr);

    // Initial validation
    setTimeout(() => {
      inpShiftSizes.dispatchEvent(new Event('input'));
      inpNotAvail.dispatchEvent(new Event('input'));
      inpPrefDays.dispatchEvent(new Event('input'));
      inpPrefCo.dispatchEvent(new Event('input'));
      inpAvoidCo.dispatchEvent(new Event('input'));
    }, 0);

    // Serialization closure
    const serialize = (): EmployeeInit | null => {
      const name = inpName.value.trim();
      if (!name) return null; // Skip empty rows

      const status = selStatus.value as EmployeeStatus;
      const shiftSizes = inpShiftSizes.value.split('|').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
      const minHours = parseInt(inpMinHours.value, 10) || 12;
      const maxHours = parseInt(inpMaxHours.value, 10) || 32;

      const parseDayList = (raw: string) => raw.split('|').map(t => parseDaySpec(t.trim())).filter(s => s !== null) as any[];
      const notAvail = parseDayList(inpNotAvail.value);
      const prefDays = parseDayList(inpPrefDays.value);

      // Coworkers will be names at this point; we resolve them to IDs later
      const prefCo = inpPrefCo.value.split('|').map(s => s.trim()).filter(Boolean);
      const avoidCo = inpAvoidCo.value.split('|').map(s => s.trim()).filter(Boolean);

      return {
        id: init?.id || `new-${Math.random().toString(36).substr(2, 9)}`, // Temp ID
        name,
        status,
        ...(shiftSizes.length > 0 ? { shiftSizes } : {}),
        minHoursPerWeek: minHours,
        maxHoursPerWeek: maxHours,
        notAvailableDays: notAvail,
        preferredDays: prefDays,
        preferredCoworkers: prefCo,
        avoidCoworkers: avoidCo,
        closeThenOpenPref: selCloseOpen.value as any
      };
    };

    rowControllers.push(serialize);
  }

  // Populate existing
  currentEmployees.forEach(e => addRow(e as unknown as EmployeeInit)); // Hacky cast since Employee properties mostly match Init

  // Scrollable container for the table
  const tableContainer = document.createElement('div');
  tableContainer.className = 'roster-table-container';
  tableContainer.appendChild(table);
  modal.appendChild(tableContainer);

  // --- Bottom Actions ---
  const footer = document.createElement('div');
  footer.className = 'modal-footer roster-footer';

  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn--secondary';
  addBtn.innerHTML = '+ Add Employee';
  addBtn.addEventListener('click', () => {
    addRow();
    // Scroll to bottom
    setTimeout(() => tableContainer.scrollTop = tableContainer.scrollHeight, 0);
  });
  footer.appendChild(addBtn);

  const rightActions = document.createElement('div');
  rightActions.className = 'roster-footer-right';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn--ghost';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => overlay.remove());

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn--primary';
  saveBtn.textContent = 'Save & Apply';
  saveBtn.addEventListener('click', () => {
    const inits: EmployeeInit[] = [];
    for (const ctrl of rowControllers) {
      const init = ctrl();
      if (init) inits.push(init);
    }

    // Resolve coworker names to IDs based on the new array
    const nameToId = new Map<string, string>();
    // Re-assign stable IDs if they are 'new-...' or just re-assign sequentially like CSV parser?
    // The CSV parser does `emp-001`, `emp-002`, etc.
    inits.forEach((init, i) => {
      init.id = `emp-${String(i + 1).padStart(3, '0')}`;
      nameToId.set(init.name.toLowerCase(), init.id);
    });

    for (const init of inits) {
      init.preferredCoworkers = init.preferredCoworkers!.map(n => nameToId.get(n.toLowerCase())!).filter(Boolean);
      init.avoidCoworkers = init.avoidCoworkers!.map(n => nameToId.get(n.toLowerCase())!).filter(Boolean);
    }

    const newEmployees = inits.map(init => new Employee(init));
    onSave(newEmployees);
    overlay.remove();
  });

  rightActions.appendChild(cancelBtn);
  rightActions.appendChild(saveBtn);
  footer.appendChild(rightActions);

  modal.appendChild(footer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}
