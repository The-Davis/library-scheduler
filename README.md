# Library Scheduler

A static TypeScript web application that generates monthly staff schedules for a public library. Runs entirely in the browser — no server required after the initial build.

**Live demo**: deploy to [GitHub Pages](https://the-davis.github.io/library-scheduler/) directly from the repo root.

---

## Quick Start

```bash
npm install
npm run build   # compile TypeScript → dist/bundle.js
npm run dev     # start local server at http://localhost:3000
```

Open your browser to **http://localhost:3000**. The September 2026 demo schedule loads automatically.

---

## Sample Data Files

Ready-to-upload CSV files are in the `sample-data/` folder:

| File | Purpose |
|------|---------|
| [`sample-data/demo-employees.csv`](sample-data/demo-employees.csv) | 4 FT + 21 PT demo employees with preferences |
| [`sample-data/september-2026-shifts.csv`](sample-data/september-2026-shifts.csv) | Programming shifts for Sept 2026; includes holiday example |

### Using the sample files

1. Open the app at http://localhost:3000
2. In the sidebar under **CSV Data**:
   - Click **Upload Employees CSV** → select `sample-data/demo-employees.csv`
   - Click **Upload Shifts CSV** → select `sample-data/september-2026-shifts.csv`
3. Click **Generate Schedule**

> **Note**: If you upload only the shifts file, the app uses the hardcoded demo employee roster. If you upload only the employees file, default shifts are used (no Programming sessions unless in the CSV). Upload both to run the full demonstration.

---

## CSV Formats

### Employees CSV

```
name,status,min_hours,max_hours,not_available_days,preferred_days,preferred_coworkers,avoid_coworkers,close_then_open
Jordan Hayes,FT,40,40,,Monday|Tuesday|Wednesday|Thursday,,,avoid
Alice Smith,PT,12,24,Saturday,Monday|Tuesday,Jordan Hayes,,avoid
Bob Jones,PT,16,32,,Wednesday|Friday,,Alice Smith,neutral
Dana Lee,PT,12,20,15|Monday3,Tuesday|Friday,,,neutral
```

| Column | Values | Notes |
|--------|--------|-------|
| `name` | String | Must be unique |
| `status` | `FT` \| `PT` \| `Programming` | FT always gets 40h/week |
| `min_hours` | Integer | Ignored for FT |
| `max_hours` | Integer | Ignored for FT |
| `not_available_days` | Pipe-separated **DaySpec** tokens | Days the employee cannot work |
| `preferred_days` | Pipe-separated **DaySpec** tokens | Days the employee prefers (scores +20) |
| `preferred_coworkers` | Pipe-separated names | Scores +10 when paired |
| `avoid_coworkers` | Pipe-separated names | Scores −15 when paired |
| `close_then_open` | `prefer` \| `avoid` \| `neutral` | Back-to-back shift preference |

#### DaySpec token formats

Both `not_available_days` and `preferred_days` accept pipe-separated **DaySpec** tokens. Three formats are supported and can be freely mixed:

| Token | Example | Meaning |
|-------|---------|--------|
| Integer | `15` | That specific calendar date (the 15th of the scheduled month) |
| Weekday name | `Monday` | Every instance of that weekday in the scheduled month |
| Weekday + digit | `Monday3` | The **n**th occurrence of that weekday (n = 1–5) |

Tokens are case-insensitive. Multiple tokens are pipe-separated:

```
# Not available on the 15th OR every Saturday:
not_available_days = 15|Saturday

# Prefers Fridays AND the third Monday of the month:
preferred_days = Friday|Monday3

# Not available on the first and last Saturday (assume 4 Saturdays):
not_available_days = Saturday1|Saturday4
```

Unrecognised tokens are silently ignored, so it is safe to include comments or extra whitespace.

### Shifts CSV

```
date,action,category,count
2026-09-01,add,Programming,2
2026-09-07,holiday,,
```

| Column | Values | Notes |
|--------|--------|-------|
| `date` | `YYYY-MM-DD` | Must be within the scheduled month |
| `action` | `add` \| `holiday` \| `override` | See below |
| `category` | `ShiftCategory` name | Used with `add` and `override` |
| `count` | Integer | Number of slots to add |

**Actions:**
- `add` — Append slots on top of the day's default requirements (use for Programming)
- `holiday` — Mark the day as closed regardless of day-of-week
- `override` — Replace ALL default requirements for this date

---

## Project Structure

```
library-scheduler/
├── src/
│   ├── types/          # Data models (Shift, Employee, Day, Schedule)
│   ├── algorithm/      # Seeded PRNG, scorer, 6-phase scheduler
│   ├── data/           # Default shift config, demo roster generator
│   ├── parsers/        # CSV parsers for shifts and employees
│   └── ui/             # DOM calendar renderer, app orchestrator
├── sample-data/        # Ready-to-use demo CSV files
├── scripts/            # Utility scripts (CSV generation)
├── dist/               # Compiled bundle (committed for GitHub Pages)
├── index.html          # Single-page shell
├── styles.css          # Design system
└── server.js           # Minimal local dev server
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript → `dist/bundle.js` |
| `npm run dev` | Start local server at http://localhost:3000 |
| `npm run watch` | Rebuild bundle automatically on file changes |
| `npm run generate-samples` | Regenerate the `sample-data/` CSV files |

---

## Deploying to GitHub Pages

1. Run `npm run build` to compile the latest code
2. Commit `dist/bundle.js` along with your changes
3. Push to GitHub
4. In your repository Settings → Pages, set the source to **Deploy from branch → main → / (root)**

The app will be available at `https://<username>.github.io/<repo-name>/`.

---

## Scheduling Algorithm

The scheduler runs in six phases:

1. **Build days** — create Day objects with requirements from defaults + CSV overrides
2. **Decompose requirements** — convert coverage windows into concrete ShiftSlots (greedy, longest-first)
3. **Fill PIC slots** — assign FT employees to Person-in-Charge slots (priority)
4. **Top-up FT to 40h** — assign FT employees to open 8h PT slots when PIC alone isn't enough
5. **Fill PT slots** — assign PT employees to all remaining open slots
6. **Fill Programming slots** — assign Programming employees to Programming slots

Each assignment is scored by the preference engine. Ties are broken deterministically by the seeded PRNG.

---

## Requirements

- Node.js 16+ (for local dev server and build)
- Modern browser (Chrome, Firefox, Safari, Edge)
