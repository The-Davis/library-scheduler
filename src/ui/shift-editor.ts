import { DayOverride } from '../algorithm/scheduler';
import { CoverageRequirement, ShiftCategory } from '../types/shift';
import { createDay, Day } from '../types/day';
import { daysInMonth } from '../types/schedule';
import { getDefaultRequirements } from '../data/defaults';
import { formatTime } from './utils';

// We need AppState structure but we can just duck-type it here
interface ShiftEditorState {
  year: number;
  month: number;
  overrides: Map<string, DayOverride>;
}

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export type OnShiftsSave = (newOverrides: Map<string, DayOverride>) => void;

interface DayDraft {
  dateStr: string;
  day: Day; // To get dayOfWeek, openHour, closeHour
  isClosed: boolean;
  requirements: CoverageRequirement[];
}

export function showShiftEditor(state: ShiftEditorState, onSave: OnShiftsSave): void {
  // Create deep draft copies of every day in the month
  const numDays = daysInMonth(state.year, state.month);
  const drafts: DayDraft[] = [];

  for (let d = 1; d <= numDays; d++) {
    const date = new Date(state.year, state.month, d);
    const dateStr = toDateStr(date);
    const ov = state.overrides.get(dateStr);

    const isClosed = ov?.holiday === true;
    const day = createDay(date, isClosed);
    let reqs: CoverageRequirement[] = [];

    if (!isClosed) {
      if (ov?.requirements !== undefined) {
        reqs = ov.requirements.map(r => ({ ...r }));
      } else {
        reqs = getDefaultRequirements(day.dayOfWeek).map(r => ({ ...r }));
      }
      
      // If there were addProgramming overrides in the past, convert them to raw requirements
      // so the user can edit them visually.
      if ((ov?.addProgramming ?? 0) > 0) {
        for (let i = 0; i < ov!.addProgramming!; i++) {
          reqs.push({
            category: ShiftCategory.Programming,
            coverageStart: day.openHour,
            coverageEnd: day.closeHour
          });
        }
      }
    }

    drafts.push({ dateStr, day, isClosed, requirements: reqs });
  }

  // --- UI Construction ---
  const overlay = document.createElement('div');
  overlay.className = 'daily-modal-overlay';
  overlay.id = 'shift-modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'daily-modal shift-modal-content';
  modal.style.width = '95vw';
  modal.style.maxWidth = '1600px';

  const header = document.createElement('div');
  header.className = 'daily-modal-header';

  const titleBlock = document.createElement('div');
  titleBlock.className = 'daily-title-block';
  const title = document.createElement('h2');
  title.className = 'daily-modal-title';
  title.textContent = 'Edit Shift Requirements';
  titleBlock.appendChild(title);
  
  const subTitle = document.createElement('p');
  subTitle.className = 'daily-modal-date';
  subTitle.textContent = `${new Date(state.year, state.month).toLocaleString('default', { month: 'long' })} ${state.year}`;
  titleBlock.appendChild(subTitle);
  header.appendChild(titleBlock);

  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'daily-modal-actions';
  
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn--ghost';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => overlay.remove());
  actionsDiv.appendChild(cancelBtn);

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn--primary';
  saveBtn.textContent = 'Save & Apply';
  saveBtn.addEventListener('click', () => {
    // Build new overrides map
    const newOverrides = new Map<string, DayOverride>();

    for (const draft of drafts) {
      const defaultReqs = getDefaultRequirements(draft.day.dayOfWeek);
      
      if (draft.isClosed) {
        // If it's a Sunday (which is closed by default), we only need an override if it wasn't supposed to be closed,
        // but it's simpler to just set holiday:true if it's closed and it's not Sunday. Or just set it anyway.
        if (draft.day.dayOfWeek !== 0) {
           newOverrides.set(draft.dateStr, { holiday: true });
        }
      } else {
        // Compare requirements to defaults
        let differs = false;
        if (defaultReqs.length !== draft.requirements.length) {
          differs = true;
        } else {
          // Deep compare
          for (let i = 0; i < defaultReqs.length; i++) {
            const dr = defaultReqs[i];
            const my = draft.requirements[i];
            if (dr.category !== my.category || dr.coverageStart !== my.coverageStart || dr.coverageEnd !== my.coverageEnd) {
              differs = true;
              break;
            }
          }
        }

        if (differs || draft.day.dayOfWeek === 0) { // If it's open on Sunday, it's an override
          newOverrides.set(draft.dateStr, { requirements: draft.requirements });
        }
      }
    }

    onSave(newOverrides);
    overlay.remove();
  });
  actionsDiv.appendChild(saveBtn);
  
  header.appendChild(actionsDiv);
  modal.appendChild(header);

  // --- Grid ---
  const gridContainer = document.createElement('div');
  gridContainer.className = 'shift-grid-container';
  gridContainer.style.flex = '1';
  gridContainer.style.overflowY = 'auto';
  gridContainer.style.padding = '16px';
  gridContainer.style.display = 'grid';
  gridContainer.style.gridTemplateColumns = 'repeat(7, 1fr)';
  gridContainer.style.gap = '8px';

  // Weekday headers
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (const wd of weekdays) {
    const th = document.createElement('div');
    th.style.fontWeight = 'bold';
    th.style.textAlign = 'center';
    th.style.paddingBottom = '8px';
    th.textContent = wd;
    gridContainer.appendChild(th);
  }

  // Pad first week
  const firstDay = new Date(state.year, state.month, 1).getDay();
  for (let i = 0; i < firstDay; i++) {
    gridContainer.appendChild(document.createElement('div'));
  }

  // Render day cells
  for (const draft of drafts) {
    const cell = document.createElement('div');
    cell.style.border = '1px solid var(--col-border)';
    cell.style.borderRadius = 'var(--radius-md)';
    cell.style.padding = '8px';
    cell.style.display = 'flex';
    cell.style.flexDirection = 'column';
    cell.style.minHeight = '150px';
    cell.style.background = 'var(--col-bg-card)';

    const cellHeader = document.createElement('div');
    cellHeader.style.display = 'flex';
    cellHeader.style.justifyContent = 'space-between';
    cellHeader.style.alignItems = 'center';
    cellHeader.style.marginBottom = '8px';

    const dateSpan = document.createElement('span');
    dateSpan.style.fontWeight = 'bold';
    dateSpan.textContent = String(draft.day.date.getDate());
    cellHeader.appendChild(dateSpan);

    const closedLabel = document.createElement('label');
    closedLabel.style.fontSize = '12px';
    closedLabel.style.display = 'flex';
    closedLabel.style.alignItems = 'center';
    closedLabel.style.gap = '4px';
    closedLabel.style.cursor = 'pointer';

    const closedCheckbox = document.createElement('input');
    closedCheckbox.type = 'checkbox';
    closedCheckbox.checked = draft.isClosed;
    
    closedLabel.appendChild(closedCheckbox);
    closedLabel.appendChild(document.createTextNode('Closed'));
    cellHeader.appendChild(closedLabel);
    
    cell.appendChild(cellHeader);

    const reqsList = document.createElement('div');
    reqsList.style.flex = '1';
    reqsList.style.display = 'flex';
    reqsList.style.flexDirection = 'column';
    reqsList.style.gap = '4px';
    cell.appendChild(reqsList);

    const addBtn = document.createElement('button');
    addBtn.className = 'btn btn--ghost btn--sm';
    addBtn.style.marginTop = '8px';
    addBtn.textContent = '+ Add Shift';
    
    const renderReqs = () => {
      reqsList.innerHTML = '';
      if (draft.isClosed) {
        cell.style.opacity = '0.5';
        addBtn.style.display = 'none';
        return;
      }
      
      cell.style.opacity = '1';
      addBtn.style.display = 'block';

      for (let i = 0; i < draft.requirements.length; i++) {
        const req = draft.requirements[i];
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.background = 'var(--col-bg-app)';
        row.style.padding = '4px';
        row.style.borderRadius = '4px';
        row.style.fontSize = '11px';

        const info = document.createElement('span');
        info.textContent = `${req.category} (${formatTime(req.coverageStart)} - ${formatTime(req.coverageEnd)})`;
        row.appendChild(info);

        const rmBtn = document.createElement('button');
        rmBtn.innerHTML = '&minus;';
        rmBtn.style.background = 'none';
        rmBtn.style.border = 'none';
        rmBtn.style.color = 'var(--col-danger)';
        rmBtn.style.cursor = 'pointer';
        rmBtn.addEventListener('click', () => {
          draft.requirements.splice(i, 1);
          renderReqs();
        });
        row.appendChild(rmBtn);

        reqsList.appendChild(row);
      }
    };

    closedCheckbox.addEventListener('change', () => {
      draft.isClosed = closedCheckbox.checked;
      renderReqs();
    });

    addBtn.addEventListener('click', () => {
      showAddShiftPopover(addBtn, draft, () => renderReqs());
    });

    cell.appendChild(addBtn);
    renderReqs();

    gridContainer.appendChild(cell);
  }

  modal.appendChild(gridContainer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function showAddShiftPopover(anchor: HTMLElement, draft: DayDraft, onAdd: () => void) {
  const popover = document.createElement('div');
  popover.className = 'emp-override-menu'; // Reusing some dropdown CSS
  popover.style.padding = '12px';
  popover.style.width = '240px';
  popover.style.zIndex = '3000';

  const title = document.createElement('div');
  title.className = 'emp-override-title';
  title.textContent = 'Add Shift';
  popover.appendChild(title);

  // Category
  const catLabel = document.createElement('label');
  catLabel.textContent = 'Role:';
  catLabel.style.display = 'block';
  catLabel.style.fontSize = '12px';
  catLabel.style.marginTop = '8px';
  const catSelect = document.createElement('select');
  catSelect.className = 'roster-select';
  Object.values(ShiftCategory).forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    catSelect.appendChild(opt);
  });
  catLabel.appendChild(catSelect);
  popover.appendChild(catLabel);

  // Helper for time options
  const baseOpen = draft.day.openHour || 9;
  const baseClose = draft.day.closeHour || 21;

  // Start Hour
  const startLabel = document.createElement('label');
  startLabel.textContent = 'Start:';
  startLabel.style.display = 'block';
  startLabel.style.fontSize = '12px';
  startLabel.style.marginTop = '8px';
  const startSelect = document.createElement('select');
  startSelect.className = 'roster-select';
  for (let h = baseOpen; h < baseClose; h++) {
    const opt = document.createElement('option');
    opt.value = String(h);
    opt.textContent = formatTime(h);
    startSelect.appendChild(opt);
  }
  startLabel.appendChild(startSelect);
  popover.appendChild(startLabel);

  // End Hour
  const endLabel = document.createElement('label');
  endLabel.textContent = 'End:';
  endLabel.style.display = 'block';
  endLabel.style.fontSize = '12px';
  endLabel.style.marginTop = '8px';
  const endSelect = document.createElement('select');
  endSelect.className = 'roster-select';
  for (let h = baseOpen + 1; h <= baseClose; h++) {
    const opt = document.createElement('option');
    opt.value = String(h);
    opt.textContent = formatTime(h);
    if (h === baseClose) opt.selected = true;
    endSelect.appendChild(opt);
  }
  endLabel.appendChild(endSelect);
  popover.appendChild(endLabel);

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'btn btn--primary btn--sm';
  confirmBtn.style.marginTop = '12px';
  confirmBtn.style.width = '100%';
  confirmBtn.textContent = 'Add';
  confirmBtn.addEventListener('click', () => {
    const startH = parseInt(startSelect.value, 10);
    let endH = parseInt(endSelect.value, 10);
    if (endH <= startH) endH = startH + 1;

    draft.requirements.push({
      category: catSelect.value as ShiftCategory,
      coverageStart: startH,
      coverageEnd: endH
    });
    onAdd();
    popover.remove();
  });
  popover.appendChild(confirmBtn);

  // Positioning
  const rect = anchor.getBoundingClientRect();
  popover.style.top = `${rect.bottom + 4}px`;
  popover.style.left = `${rect.left}px`;
  document.body.appendChild(popover);

  const closeMenu = (e: Event) => {
    if (!popover.contains(e.target as Node) && e.target !== anchor) {
      popover.remove();
      document.removeEventListener('mousedown', closeMenu);
    }
  };
  setTimeout(() => document.addEventListener('mousedown', closeMenu), 0);
}
