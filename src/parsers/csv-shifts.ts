import { CoverageRequirement, ShiftCategory, SHIFT_DEFINITIONS } from '../types/shift';
import { DayOverride } from '../algorithm/scheduler';

// ---------------------------------------------------------------------------
// Shifts CSV parser
// ---------------------------------------------------------------------------
// Expected CSV format:
//   date,action,category,count
//
// Actions:
//   holiday  — mark day as closed (columns category/count ignored)
//   add      — add category slots on top of defaults (used for Programming)
//   override — replace ALL default requirements for this date
//              (category = comma-joined list of ShiftCategory names;
//               this row then drives what requirements are set)
//
// Examples:
//   2026-09-01,add,Programming,2
//   2026-09-04,holiday,,
//   2026-09-07,override,"PIC,Accounts,Info",
// ---------------------------------------------------------------------------

export interface ShiftCSVRow {
  date:     string;
  action:   'holiday' | 'add' | 'override';
  category: string;
  count:    number;
}

/** Parse raw CSV text into a Map<dateStr, DayOverride> */
export function parseShiftsCSV(raw: string): Map<string, DayOverride> {
  const lines  = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const result = new Map<string, DayOverride>();

  // Skip header row
  const dataLines = lines[0]?.toLowerCase().startsWith('date') ? lines.slice(1) : lines;

  for (const line of dataLines) {
    const cols   = parseCSVLine(line);
    if (cols.length < 2) continue;

    const dateStr = cols[0].trim();
    const action  = cols[1].trim().toLowerCase() as ShiftCSVRow['action'];
    const category = (cols[2] ?? '').trim();
    const count   = parseInt(cols[3] ?? '1', 10) || 1;

    if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) continue;

    const existing = result.get(dateStr) ?? {};

    if (action === 'holiday') {
      result.set(dateStr, { ...existing, holiday: true });
      continue;
    }

    if (action === 'add') {
      const cat = category as ShiftCategory;
      if (cat === ShiftCategory.Programming) {
        result.set(dateStr, {
          ...existing,
          addProgramming: (existing.addProgramming ?? 0) + count,
        });
      }
      continue;
    }

    if (action === 'override') {
      const cats = category.split(',').map(c => c.trim()) as ShiftCategory[];
      const reqs: CoverageRequirement[] = cats
        .filter(c => c in SHIFT_DEFINITIONS)
        .map(c => {
          const def = SHIFT_DEFINITIONS[c as ShiftCategory];
          return {
            category:      c as ShiftCategory,
            coverageStart: 9,
            coverageEnd:   def.requiredStatus === 'FT' ? 21 : 18,
          };
        });
      result.set(dateStr, { ...existing, requirements: reqs });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// CSV template download
// ---------------------------------------------------------------------------
export const SHIFTS_CSV_TEMPLATE = `date,action,category,count
# holiday example:
2026-09-04,holiday,,
# add Programming shifts:
2026-09-01,add,Programming,2
2026-09-05,add,Programming,1
# override all requirements for a day (comma-separated categories):
# 2026-09-15,override,"PIC,Accounts,Info",
`;

// ---------------------------------------------------------------------------
// Utility: parse a single CSV line respecting quoted fields
// ---------------------------------------------------------------------------
function parseCSVLine(line: string): string[] {
  const cols: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      cols.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cols.push(current);
  return cols;
}
