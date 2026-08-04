import { Employee } from './types/employee';
import { DayOverride } from './algorithm/scheduler';

interface PersistedState {
  year: number;
  month: number;
  seed: number;
  showCsvSection?: boolean;
  employees: any[]; // we'll use Employee.init object form, but need to serialize/deserialize it properly
  overrides: [string, DayOverride][]; // Map serialized as array of tuples
}

const STORAGE_KEY = 'library_scheduler_state';

/**
 * Save the application state to localStorage.
 */
export function saveStateToStorage(
  year: number,
  month: number,
  seed: number,
  showCsvSection: boolean,
  employees: Employee[],
  overrides: Map<string, DayOverride>
): void {
  try {
    const stateObj: PersistedState = {
      year,
      month,
      seed,
      showCsvSection,
      // The Employee class properties are mostly primitive, we can serialize the instance directly,
      // but to reconstruct it properly we can just pass the deserialized objects back into the Employee constructor.
      // However, we should be careful to only save the init properties if possible, or just stringify the whole thing.
      // JSON.stringify will serialize all public properties. 
      employees: employees.map(e => ({ ...e })), 
      overrides: Array.from(overrides.entries())
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateObj));
    console.log('State saved to storage.');
  } catch (err) {
    console.error('Failed to save state to storage:', err);
  }
}

/**
 * Load the application state from localStorage, if it exists.
 * Returns null if no state is found or if parsing fails.
 */
export function loadStateFromStorage(): {
  year: number;
  month: number;
  seed: number;
  showCsvSection: boolean;
  employees: Employee[];
  overrides: Map<string, DayOverride>;
} | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const data: PersistedState = JSON.parse(raw);
    
    // Reconstruct Employee objects
    const employees = (data.employees || []).map(empData => new Employee(empData));
    
    // Reconstruct overrides Map
    const overrides = new Map<string, DayOverride>(data.overrides || []);

    return {
      year: data.year ?? 2026,
      month: data.month ?? 8,
      seed: data.seed ?? 12345,
      showCsvSection: data.showCsvSection ?? false,
      employees,
      overrides
    };
  } catch (err) {
    console.error('Failed to load state from storage:', err);
    return null;
  }
}

/**
 * Clear the saved state from localStorage.
 */
export function clearStateStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}
