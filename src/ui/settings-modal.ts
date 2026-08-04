import { Employee } from '../types/employee';
import { DayOverride } from '../algorithm/scheduler';
import { clearStateStorage } from '../storage';

interface SettingsState {
  year: number;
  month: number;
  seed: number;
  showCsvSection: boolean;
  employees: Employee[];
  overrides: Map<string, DayOverride>;
}

export type OnSettingsSave = (newState: SettingsState) => void;

export function showSettingsModal(currentState: SettingsState, onSave: OnSettingsSave): void {
  const overlay = document.createElement('div');
  overlay.className = 'daily-modal-overlay';
  overlay.id = 'settings-modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'daily-modal';
  modal.style.width = '400px';
  modal.style.maxWidth = '90vw';

  const header = document.createElement('div');
  header.className = 'daily-modal-header';

  const titleBlock = document.createElement('div');
  titleBlock.className = 'daily-title-block';
  const title = document.createElement('h2');
  title.className = 'daily-modal-title';
  title.textContent = 'Settings';
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

  // Content
  const content = document.createElement('div');
  content.style.padding = 'var(--sp-6)';
  content.style.display = 'flex';
  content.style.flexDirection = 'column';
  content.style.gap = 'var(--sp-4)';

  // 1. Show CSV Checkbox
  const csvLabel = document.createElement('label');
  csvLabel.style.display = 'flex';
  csvLabel.style.alignItems = 'center';
  csvLabel.style.gap = 'var(--sp-2)';
  csvLabel.style.cursor = 'pointer';

  const csvCheck = document.createElement('input');
  csvCheck.type = 'checkbox';
  csvCheck.checked = currentState.showCsvSection;
  csvCheck.addEventListener('change', () => {
    currentState.showCsvSection = csvCheck.checked;
    onSave(currentState);
  });
  
  csvLabel.appendChild(csvCheck);
  csvLabel.appendChild(document.createTextNode('Show CSV Upload Section'));
  content.appendChild(csvLabel);

  const divider1 = document.createElement('hr');
  divider1.style.border = 'none';
  divider1.style.borderTop = '1px solid var(--col-border)';
  content.appendChild(divider1);

  // 2. Download Memory
  const dlBtn = document.createElement('button');
  dlBtn.className = 'btn btn--secondary';
  dlBtn.textContent = '↓ Download Memory Backup';
  dlBtn.addEventListener('click', () => {
    const backupStr = localStorage.getItem('library_scheduler_state');
    if (!backupStr) {
      alert('No saved state found in memory.');
      return;
    }
    const blob = new Blob([backupStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'library-scheduler-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  });
  content.appendChild(dlBtn);

  // 3. Upload Memory
  const ulLabel = document.createElement('label');
  ulLabel.className = 'btn btn--secondary';
  ulLabel.style.textAlign = 'center';
  ulLabel.textContent = '↑ Upload / Restore Backup';
  const ulInput = document.createElement('input');
  ulInput.type = 'file';
  ulInput.accept = '.json,application/json';
  ulInput.style.display = 'none';
  ulInput.addEventListener('change', async () => {
    const file = ulInput.files?.[0];
    if (!file) return;
    try {
      const txt = await file.text();
      // Basic validation
      const data = JSON.parse(txt);
      if (typeof data === 'object' && data !== null) {
        localStorage.setItem('library_scheduler_state', txt);
        alert('Backup restored! The page will now reload.');
        location.reload();
      } else {
        alert('Invalid backup file format.');
      }
    } catch (e) {
      alert('Failed to read or parse backup file.');
    }
  });
  ulLabel.appendChild(ulInput);
  content.appendChild(ulLabel);

  const divider2 = document.createElement('hr');
  divider2.style.border = 'none';
  divider2.style.borderTop = '1px solid var(--col-border)';
  content.appendChild(divider2);

  // 4. Reset Memory
  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn btn--primary';
  resetBtn.style.background = 'var(--col-danger)';
  resetBtn.style.borderColor = 'var(--col-danger)';
  resetBtn.textContent = '⚠ Reset Memory to Defaults';
  resetBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to completely wipe your browser storage? This will delete all rosters and shift edits, reverting to the default demo.')) {
      clearStateStorage();
      location.reload();
    }
  });
  content.appendChild(resetBtn);

  modal.appendChild(content);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}
