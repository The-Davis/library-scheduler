"use strict";
(() => {
  // src/types/day.ts
  function createDay(date, forceHoliday = false) {
    const dow = date.getDay();
    const isSunday = dow === 0;
    const isClosed = isSunday || forceHoliday;
    const isLongDay = dow >= 1 && dow <= 4;
    const openHour = 9;
    const closeHour = isClosed ? 9 : isLongDay ? 21 : 18;
    return {
      date,
      dayOfWeek: dow,
      openHour,
      closeHour,
      isClosed,
      isHoliday: forceHoliday,
      requirements: [],
      assignments: []
    };
  }
  function getCalendarWeekIndex(date, year, month) {
    const firstOfMonth = new Date(year, month, 1);
    const firstSunday = new Date(firstOfMonth);
    firstSunday.setDate(firstSunday.getDate() - firstSunday.getDay());
    const msSinceFirst = date.getTime() - firstSunday.getTime();
    const daysSinceFirst = Math.floor(msSinceFirst / 864e5);
    return Math.floor(daysSinceFirst / 7);
  }
  function groupIntoCalendarWeeks(days, year, month) {
    if (days.length === 0) return [];
    const firstDow = new Date(year, month, 1).getDay();
    const totalCells = firstDow + days.length;
    const numWeeks = Math.ceil(totalCells / 7);
    const grid = new Array(numWeeks * 7).fill(null);
    for (let i = 0; i < days.length; i++) {
      grid[firstDow + i] = days[i];
    }
    const weeks = [];
    for (let w = 0; w < numWeeks; w++) {
      weeks.push(grid.slice(w * 7, (w + 1) * 7));
    }
    return weeks;
  }

  // src/types/shift.ts
  var VALID_PT_HOURS = [8, 6, 4];
  var ShiftDefinition = class {
  };
  var PICShiftDef = class extends ShiftDefinition {
    constructor() {
      super(...arguments);
      this.category = "PIC" /* PIC */;
      this.requiredStatus = "FT" /* FullTime */;
      this.minHours = 8;
      this.maxHours = 8;
      this.label = "Person in Charge";
      this.color = "#6366f1";
    }
    // indigo
  };
  var AccountsShiftDef = class extends ShiftDefinition {
    constructor() {
      super(...arguments);
      this.category = "Accounts" /* Accounts */;
      this.requiredStatus = "PT" /* PartTime */;
      this.minHours = 4;
      this.maxHours = 8;
      this.label = "Accounts";
      this.color = "#0ea5e9";
    }
    // sky
  };
  var InfoShiftDef = class extends ShiftDefinition {
    constructor() {
      super(...arguments);
      this.category = "Info" /* Info */;
      this.requiredStatus = "PT" /* PartTime */;
      this.minHours = 4;
      this.maxHours = 8;
      this.label = "Info";
      this.color = "#10b981";
    }
    // emerald
  };
  var WelcomeShiftDef = class extends ShiftDefinition {
    constructor() {
      super(...arguments);
      this.category = "Welcome" /* Welcome */;
      this.requiredStatus = "PT" /* PartTime */;
      this.minHours = 4;
      this.maxHours = 8;
      this.label = "Welcome";
      this.color = "#f59e0b";
    }
    // amber
  };
  var FloatShiftDef = class extends ShiftDefinition {
    constructor() {
      super(...arguments);
      this.category = "Float" /* Float */;
      this.requiredStatus = "PT" /* PartTime */;
      this.minHours = 4;
      this.maxHours = 8;
      this.label = "Float";
      this.color = "#ef4444";
    }
    // red
  };
  var SupportShiftDef = class extends ShiftDefinition {
    constructor() {
      super(...arguments);
      this.category = "Support" /* Support */;
      this.requiredStatus = "PT" /* PartTime */;
      this.minHours = 4;
      this.maxHours = 8;
      this.label = "Support";
      this.color = "#a855f7";
    }
    // purple
  };
  var ProgrammingShiftDef = class extends ShiftDefinition {
    constructor() {
      super(...arguments);
      this.category = "Programming" /* Programming */;
      this.requiredStatus = "Programming" /* Programming */;
      this.minHours = 4;
      this.maxHours = 8;
      this.label = "Programming";
      this.color = "#ec4899";
    }
    // pink
  };
  var SHIFT_DEFINITIONS = {
    ["PIC" /* PIC */]: new PICShiftDef(),
    ["Accounts" /* Accounts */]: new AccountsShiftDef(),
    ["Info" /* Info */]: new InfoShiftDef(),
    ["Welcome" /* Welcome */]: new WelcomeShiftDef(),
    ["Float" /* Float */]: new FloatShiftDef(),
    ["Support" /* Support */]: new SupportShiftDef(),
    ["Programming" /* Programming */]: new ProgrammingShiftDef()
  };

  // src/types/schedule.ts
  function buildMonthSchedule(year, month, seed, employees, days) {
    const weeks = groupIntoCalendarWeeks(days, year, month);
    return { year, month, seed, employees, allDays: days, weeks };
  }
  function monthName(month) {
    return new Date(2e3, month, 1).toLocaleString("default", { month: "long" });
  }
  function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  // src/types/employee.ts
  var DAY_OF_WEEK_NAMES = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];
  var DAY_OF_WEEK_INDEX = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6
  };
  function parseDaySpec(raw) {
    const s = raw.trim();
    if (!s) return null;
    if (/^\d+$/.test(s)) {
      const n = parseInt(s, 10);
      if (n >= 1 && n <= 31) return { type: "date", date: n };
      return null;
    }
    const nthMatch = s.match(
      /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)([1-5])$/i
    );
    if (nthMatch) {
      const name = DAY_OF_WEEK_NAMES.find(
        (d) => d.toLowerCase() === nthMatch[1].toLowerCase()
      );
      return { type: "nth-weekday", name, nth: parseInt(nthMatch[2], 10) };
    }
    const canonical = DAY_OF_WEEK_NAMES.find(
      (d) => d.toLowerCase() === s.toLowerCase()
    );
    if (canonical) return { type: "weekday", name: canonical };
    return null;
  }
  function daySpecMatchesDate(spec, date) {
    switch (spec.type) {
      case "date":
        return date.getDate() === spec.date;
      case "weekday":
        return date.getDay() === DAY_OF_WEEK_INDEX[spec.name];
      case "nth-weekday":
        return date.getDay() === DAY_OF_WEEK_INDEX[spec.name] && Math.ceil(date.getDate() / 7) === spec.nth;
    }
  }
  var ds = {
    /** Every occurrence of a weekday in the month, e.g. ds.weekday('Monday') */
    weekday: (name) => ({ type: "weekday", name }),
    /** A specific calendar date, e.g. ds.date(15) → the 15th */
    date: (d) => ({ type: "date", date: d }),
    /** The nth occurrence of a weekday, e.g. ds.nth('Monday', 3) → 3rd Monday */
    nth: (name, nth) => ({ type: "nth-weekday", name, nth })
  };
  var Employee = class {
    constructor(init) {
      this.id = init.id;
      this.name = init.name;
      this.status = init.status;
      if (init.status === "FT" /* FullTime */) {
        this.minHoursPerWeek = 40;
        this.maxHoursPerWeek = 40;
      } else {
        this.minHoursPerWeek = init.minHoursPerWeek ?? 12;
        this.maxHoursPerWeek = init.maxHoursPerWeek ?? 32;
        if (init.shiftSizes && init.shiftSizes.length > 0) {
          this.shiftSizes = init.shiftSizes;
        }
      }
      this.notAvailableDays = init.notAvailableDays ?? [];
      this.preferredDays = init.preferredDays ?? [];
      this.unavailableHours = init.unavailableHours ?? [];
      this.preferredHours = init.preferredHours ?? [];
      this.preferredCoworkers = init.preferredCoworkers ?? [];
      this.avoidCoworkers = init.avoidCoworkers ?? [];
      this.closeThenOpenPref = init.closeThenOpenPref ?? "avoid";
    }
  };

  // src/data/defaults.ts
  var OPEN_HOUR = 9;
  var CLOSE_WEEKDAY = 21;
  var CLOSE_SHORT = 18;
  var WELCOME_FLOAT_CUTOFF = 18;
  var FLOAT_SAT_CUTOFF = 14;
  var SUPPORT_CUTOFF = 18;
  var WEEKDAY_REQUIREMENTS = [
    // Two full-time PIC shifts covering the full 12-hour day
    { category: "PIC" /* PIC */, coverageStart: OPEN_HOUR, coverageEnd: CLOSE_WEEKDAY },
    // Part-time roles covering the full day
    { category: "Accounts" /* Accounts */, coverageStart: OPEN_HOUR, coverageEnd: CLOSE_WEEKDAY },
    { category: "Info" /* Info */, coverageStart: OPEN_HOUR, coverageEnd: CLOSE_WEEKDAY },
    // Welcome and Float only until 18:00
    { category: "Welcome" /* Welcome */, coverageStart: OPEN_HOUR, coverageEnd: WELCOME_FLOAT_CUTOFF },
    { category: "Float" /* Float */, coverageStart: OPEN_HOUR, coverageEnd: WELCOME_FLOAT_CUTOFF },
    // Support only until 18:00 on weekdays
    { category: "Support" /* Support */, coverageStart: OPEN_HOUR, coverageEnd: SUPPORT_CUTOFF }
  ];
  var FRIDAY_REQUIREMENTS = [
    { category: "PIC" /* PIC */, coverageStart: OPEN_HOUR, coverageEnd: CLOSE_SHORT },
    { category: "Accounts" /* Accounts */, coverageStart: OPEN_HOUR, coverageEnd: CLOSE_SHORT },
    { category: "Info" /* Info */, coverageStart: OPEN_HOUR, coverageEnd: CLOSE_SHORT },
    { category: "Welcome" /* Welcome */, coverageStart: OPEN_HOUR, coverageEnd: CLOSE_SHORT },
    { category: "Float" /* Float */, coverageStart: OPEN_HOUR, coverageEnd: CLOSE_SHORT },
    { category: "Support" /* Support */, coverageStart: OPEN_HOUR, coverageEnd: SUPPORT_CUTOFF }
  ];
  var SATURDAY_REQUIREMENTS = [
    { category: "PIC" /* PIC */, coverageStart: OPEN_HOUR, coverageEnd: CLOSE_SHORT },
    { category: "Accounts" /* Accounts */, coverageStart: OPEN_HOUR, coverageEnd: CLOSE_SHORT },
    { category: "Info" /* Info */, coverageStart: OPEN_HOUR, coverageEnd: CLOSE_SHORT },
    { category: "Welcome" /* Welcome */, coverageStart: OPEN_HOUR, coverageEnd: CLOSE_SHORT },
    // Float on Saturday ends at 14:00 instead of 18:00
    { category: "Float" /* Float */, coverageStart: OPEN_HOUR, coverageEnd: FLOAT_SAT_CUTOFF }
    // No Support on Saturday
  ];
  function getDefaultRequirements(dayOfWeek) {
    switch (dayOfWeek) {
      case 0:
        return [];
      case 1:
      case 2:
      case 3:
      case 4:
        return WEEKDAY_REQUIREMENTS.map((r) => ({ ...r }));
      case 5:
        return FRIDAY_REQUIREMENTS.map((r) => ({ ...r }));
      case 6:
        return SATURDAY_REQUIREMENTS.map((r) => ({ ...r }));
      default:
        return [];
    }
  }

  // src/algorithm/seeded-random.ts
  var SeededRandom = class {
    constructor(seed) {
      this.state = seed >>> 0 || 1831565813;
    }
    /** Returns a float in [0, 1) */
    next() {
      this.state = this.state + 1831565813 | 0;
      let z = Math.imul(this.state ^ this.state >>> 15, 1 | this.state);
      z = z + Math.imul(z ^ z >>> 7, 61 | z) ^ z;
      return ((z ^ z >>> 14) >>> 0) / 4294967296;
    }
    /** Returns an integer in [min, max] inclusive */
    nextInt(min, max) {
      return Math.floor(this.next() * (max - min + 1)) + min;
    }
    /** Returns a random element from a non-empty array */
    pick(arr) {
      return arr[Math.floor(this.next() * arr.length)];
    }
    /** Returns a new shuffled copy of the array (Fisher-Yates) */
    shuffle(arr) {
      const out = [...arr];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(this.next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    }
    /** Returns a small random tiebreaker value in [0, 0.0001) */
    tieBreaker() {
      return this.next() * 1e-4;
    }
  };

  // src/algorithm/scorer.ts
  var HARD_BLOCK = -Infinity;
  var BONUS_PREFERRED_DAY = 20;
  var BONUS_PREFERRED_HOURS = 15;
  var BONUS_PREFERRED_COWORKER = 10;
  var PENALTY_AVOID_COWORKER = -15;
  var PENALTY_CLOSE_OPEN = -25;
  var PENALTY_CLOSE_OPEN_PREF = -25;
  var BONUS_CLOSE_OPEN_PREF = 15;
  function isAvailableForDay(emp, date) {
    return !emp.notAvailableDays.some((spec) => daySpecMatchesDate(spec, date));
  }
  function isAvailableForHours(emp, date, slot) {
    const dowName = DAY_OF_WEEK_NAMES[date.getDay()];
    for (const range of emp.unavailableHours) {
      if (range.day !== dowName) continue;
      if (slot.startHour < range.end && slot.endHour > range.start) return false;
    }
    return true;
  }
  function wouldExceedWeeklyMax(emp, slot, weekIndex, weeklyHours, totalWeeks) {
    const hours = weeklyHours.get(emp.id) ?? new Array(totalWeeks).fill(0);
    const current = hours[weekIndex] ?? 0;
    const slotDur = slot.endHour - slot.startHour;
    return current + slotDur > emp.maxHoursPerWeek;
  }
  function hasConflictOnDay(emp, slot, dayAssignments) {
    return dayAssignments.some(
      (a) => a.assignedEmployeeId === emp.id && // Overlap check: ranges are not disjoint
      slot.startHour < a.endHour && slot.endHour > a.startHour
    );
  }
  function statusMatches(emp, def) {
    if (def.requiredStatus === "FT" /* FullTime */) {
      return emp.status === "FT" /* FullTime */;
    }
    if (def.requiredStatus === "Programming" /* Programming */) {
      return emp.status === "Programming" /* Programming */;
    }
    return emp.status === "PT" /* PartTime */ || emp.status === "FT" /* FullTime */;
  }
  function scoreEmployee(ctx) {
    const {
      employee: emp,
      slot,
      date,
      weekIndex,
      dayAssignments,
      weeklyHours,
      totalWeeks,
      prevDayLastHour,
      rng
    } = ctx;
    if (!statusMatches(emp, slot.definition)) return HARD_BLOCK;
    if (!isAvailableForDay(emp, date)) return HARD_BLOCK;
    if (!isAvailableForHours(emp, date, slot)) return HARD_BLOCK;
    if (hasConflictOnDay(emp, slot, dayAssignments)) return HARD_BLOCK;
    if (wouldExceedWeeklyMax(emp, slot, weekIndex, weeklyHours, totalWeeks)) return HARD_BLOCK;
    if (emp.status === "PT" /* PartTime */ && emp.shiftSizes) {
      if (!emp.shiftSizes.includes(slot.endHour - slot.startHour)) return HARD_BLOCK;
    }
    let score = 0;
    if (emp.preferredDays.some((spec) => daySpecMatchesDate(spec, date))) {
      score += BONUS_PREFERRED_DAY;
    }
    const dowName = DAY_OF_WEEK_NAMES[date.getDay()];
    for (const ph of emp.preferredHours) {
      if (ph.day !== dowName) continue;
      if (slot.startHour >= ph.start && slot.endHour <= ph.end) {
        score += BONUS_PREFERRED_HOURS;
        break;
      }
    }
    const assignedIds = new Set(
      dayAssignments.filter((a) => a.assignedEmployeeId !== null).map((a) => a.assignedEmployeeId)
    );
    for (const prefId of emp.preferredCoworkers) {
      if (assignedIds.has(prefId)) score += BONUS_PREFERRED_COWORKER;
    }
    for (const avoidId of emp.avoidCoworkers) {
      if (assignedIds.has(avoidId)) score += PENALTY_AVOID_COWORKER;
    }
    const prevLastHour = prevDayLastHour.get(emp.id) ?? 0;
    const isBackToBack = prevLastHour >= 18 && slot.startHour <= 10;
    if (isBackToBack) {
      score += PENALTY_CLOSE_OPEN;
      if (emp.closeThenOpenPref === "avoid") score += PENALTY_CLOSE_OPEN_PREF;
      if (emp.closeThenOpenPref === "prefer") score -= PENALTY_CLOSE_OPEN;
    } else if (emp.closeThenOpenPref === "prefer" && prevLastHour > 0) {
      score += BONUS_CLOSE_OPEN_PREF;
    }
    score += rng.tieBreaker();
    return score;
  }
  function pickBestEmployee(candidates, ctx) {
    let best = null;
    let bestScore = -Infinity;
    for (const emp of candidates) {
      const s = scoreEmployee({ ...ctx, employee: emp });
      if (s > bestScore) {
        bestScore = s;
        best = emp;
      }
    }
    return bestScore === -Infinity ? null : best;
  }
  function getWeeklyHours(weeklyHours, empId, totalWeeks) {
    if (!weeklyHours.has(empId)) {
      weeklyHours.set(empId, new Array(totalWeeks).fill(0));
    }
    return weeklyHours.get(empId);
  }
  function addHours(weeklyHours, empId, weekIndex, hours, totalWeeks) {
    const arr = getWeeklyHours(weeklyHours, empId, totalWeeks);
    arr[weekIndex] = (arr[weekIndex] ?? 0) + hours;
  }
  function isFullTimeSlot(slot) {
    return slot.definition.requiredStatus === "FT" /* FullTime */;
  }
  function isProgrammingSlot(slot) {
    return slot.definition.category === "Programming" /* Programming */;
  }

  // src/algorithm/scheduler.ts
  var slotIdCounter = 0;
  function nextSlotId() {
    return `slot-${++slotIdCounter}`;
  }
  function decomposeRequirement(req) {
    const def = SHIFT_DEFINITIONS[req.category];
    const start = req.coverageStart;
    const end = req.coverageEnd;
    const window2 = end - start;
    if (def.requiredStatus === "FT" /* FullTime */) {
      if (window2 <= 9) {
        return [makeSlot(def, start, start + 8)];
      }
      return [
        makeSlot(def, start, start + 8),
        makeSlot(def, end - 8, end)
      ];
    }
    const slots = [];
    let cursor = start;
    while (cursor < end) {
      let placed = false;
      for (const dur of VALID_PT_HOURS) {
        if (cursor + dur <= end) {
          slots.push(makeSlot(def, cursor, cursor + dur));
          cursor += dur;
          placed = true;
          break;
        }
      }
      if (!placed) break;
    }
    return slots;
  }
  function makeSlot(def, start, end) {
    return {
      id: nextSlotId(),
      definition: def,
      startHour: start,
      endHour: end,
      assignedEmployeeId: null
    };
  }
  function injectProgrammingSlots(day, count) {
    for (let i = 0; i < count; i++) {
      day.requirements.push({
        category: "Programming" /* Programming */,
        coverageStart: day.openHour,
        coverageEnd: day.openHour + 4
      });
    }
  }
  function runScheduler(options) {
    slotIdCounter = 0;
    const { year, month, seed, employees, overrides = /* @__PURE__ */ new Map() } = options;
    const rng = new SeededRandom(seed);
    const numDays = daysInMonth(year, month);
    const days = [];
    for (let d = 1; d <= numDays; d++) {
      const date = new Date(year, month, d);
      const dateStr = toDateStr(date);
      const ov = overrides.get(dateStr);
      const day = createDay(date, ov?.holiday === true);
      if (!day.isClosed) {
        if (ov?.requirements !== void 0) {
          day.requirements = ov.requirements;
        } else {
          day.requirements = getDefaultRequirements(day.dayOfWeek);
        }
        if ((ov?.addProgramming ?? 0) > 0) {
          injectProgrammingSlots(day, ov.addProgramming);
        }
      }
      days.push(day);
    }
    for (const day of days) {
      if (day.isClosed) continue;
      for (const req of day.requirements) {
        const slots = decomposeRequirement(req);
        day.assignments.push(...slots);
      }
    }
    const totalWeeks = Math.max(...days.map(
      (d) => getCalendarWeekIndex(d.date, year, month)
    )) + 1;
    const weeklyHours = /* @__PURE__ */ new Map();
    const prevDayLastHour = /* @__PURE__ */ new Map();
    const ftEmployees = employees.filter((e) => e.status === "FT" /* FullTime */);
    const ptEmployees = employees.filter((e) => e.status === "PT" /* PartTime */);
    const progEmployees = employees.filter((e) => e.status === "Programming" /* Programming */);
    for (const day of days) {
      if (day.isClosed) continue;
      const weekIndex = getCalendarWeekIndex(day.date, year, month);
      const picSlots = day.assignments.filter(
        (s) => s.definition.category === "PIC" /* PIC */ && s.assignedEmployeeId === null
      );
      for (const slot of picSlots) {
        const ctx = {
          slot,
          date: day.date,
          weekIndex,
          dayAssignments: day.assignments,
          weeklyHours,
          totalWeeks,
          prevDayLastHour,
          rng
        };
        const sorted = [...ftEmployees].sort((a, b) => {
          const ha = getWeeklyHours(weeklyHours, a.id, totalWeeks)[weekIndex] ?? 0;
          const hb = getWeeklyHours(weeklyHours, b.id, totalWeeks)[weekIndex] ?? 0;
          return ha - hb;
        });
        const best = pickBestEmployee(sorted, ctx);
        if (best) {
          slot.assignedEmployeeId = best.id;
          addHours(weeklyHours, best.id, weekIndex, slot.endHour - slot.startHour, totalWeeks);
        }
      }
      updatePrevDayLastHour(day, prevDayLastHour);
    }
    for (const day of days) {
      if (day.isClosed) continue;
      const weekIndex = getCalendarWeekIndex(day.date, year, month);
      const open8hSlots = day.assignments.filter(
        (s) => s.assignedEmployeeId === null && !isFullTimeSlot(s) && !isProgrammingSlot(s) && s.endHour - s.startHour === 8
      );
      for (const slot of open8hSlots) {
        const needyFT = ftEmployees.filter((emp) => {
          const used = getWeeklyHours(weeklyHours, emp.id, totalWeeks)[weekIndex] ?? 0;
          return used < emp.minHoursPerWeek;
        });
        if (needyFT.length === 0) break;
        const ctx = {
          slot,
          date: day.date,
          weekIndex,
          dayAssignments: day.assignments,
          weeklyHours,
          totalWeeks,
          prevDayLastHour,
          rng
        };
        const best = pickBestEmployee(needyFT, ctx);
        if (best) {
          slot.assignedEmployeeId = best.id;
          addHours(weeklyHours, best.id, weekIndex, slot.endHour - slot.startHour, totalWeeks);
        }
      }
    }
    prevDayLastHour.clear();
    for (const day of days) {
      if (day.isClosed) continue;
      const weekIndex = getCalendarWeekIndex(day.date, year, month);
      const openPTSlots = day.assignments.filter(
        (s) => s.assignedEmployeeId === null && !isFullTimeSlot(s) && !isProgrammingSlot(s)
      );
      for (const slot of openPTSlots) {
        const sorted = rng.shuffle(ptEmployees).sort((a, b) => {
          const ha = getWeeklyHours(weeklyHours, a.id, totalWeeks)[weekIndex] ?? 0;
          const hb = getWeeklyHours(weeklyHours, b.id, totalWeeks)[weekIndex] ?? 0;
          return ha - hb;
        });
        const ctx = {
          slot,
          date: day.date,
          weekIndex,
          dayAssignments: day.assignments,
          weeklyHours,
          totalWeeks,
          prevDayLastHour,
          rng
        };
        const best = pickBestEmployee(sorted, ctx);
        if (best) {
          slot.assignedEmployeeId = best.id;
          addHours(weeklyHours, best.id, weekIndex, slot.endHour - slot.startHour, totalWeeks);
        }
      }
      updatePrevDayLastHour(day, prevDayLastHour);
    }
    prevDayLastHour.clear();
    for (const day of days) {
      if (day.isClosed) continue;
      const weekIndex = getCalendarWeekIndex(day.date, year, month);
      const progSlots = day.assignments.filter(
        (s) => isProgrammingSlot(s) && s.assignedEmployeeId === null
      );
      for (const slot of progSlots) {
        const sorted = rng.shuffle(progEmployees).sort((a, b) => {
          const ha = getWeeklyHours(weeklyHours, a.id, totalWeeks)[weekIndex] ?? 0;
          const hb = getWeeklyHours(weeklyHours, b.id, totalWeeks)[weekIndex] ?? 0;
          return ha - hb;
        });
        const ctx = {
          slot,
          date: day.date,
          weekIndex,
          dayAssignments: day.assignments,
          weeklyHours,
          totalWeeks,
          prevDayLastHour,
          rng
        };
        const best = pickBestEmployee(sorted, ctx);
        if (best) {
          slot.assignedEmployeeId = best.id;
          addHours(weeklyHours, best.id, weekIndex, slot.endHour - slot.startHour, totalWeeks);
        }
      }
    }
    return buildMonthSchedule(year, month, seed, employees, days);
  }
  function toDateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  function updatePrevDayLastHour(day, map) {
    for (const slot of day.assignments) {
      if (!slot.assignedEmployeeId) continue;
      const current = map.get(slot.assignedEmployeeId) ?? 0;
      if (slot.endHour > current) {
        map.set(slot.assignedEmployeeId, slot.endHour);
      }
    }
  }

  // src/types/daily-schedule.ts
  var DAILY_ROLES = [
    "PIC",
    "PIC/L",
    "PIC/X",
    "S",
    "L/S",
    "X/S",
    "S/L",
    "P",
    "O",
    "W",
    "CALLS",
    "BRKS",
    "MAGS",
    "ABC",
    "I",
    "HOLDS",
    "PROG",
    "SEC",
    "OFFSITE",
    "PLAN",
    "TBD"
  ];
  var CATEGORY_TO_DAILY_ROLE = {
    PIC: "PIC",
    Accounts: "ABC",
    Info: "I",
    Welcome: "W",
    Float: "P",
    Support: "S",
    Programming: "PROG"
  };

  // src/algorithm/daily-scheduler.ts
  var MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];
  var DOW_NAMES = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY"
  ];
  function rotationIndex(hourOffset) {
    const fullPeriods = Math.floor(hourOffset / 3);
    const remainder = hourOffset % 3;
    return fullPeriods * 2 + (remainder >= 2 ? 1 : 0);
  }
  function toDateStr2(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  }
  function buildDailySchedule(day, employeeMap) {
    const empIntervals = /* @__PURE__ */ new Map();
    for (const slot of day.assignments) {
      if (!slot.assignedEmployeeId) continue;
      const empId = slot.assignedEmployeeId;
      if (!empIntervals.has(empId)) empIntervals.set(empId, []);
      empIntervals.get(empId).push({
        startHour: slot.startHour,
        endHour: slot.endHour,
        category: slot.definition.category
      });
    }
    const scheduledEmployees = [...empIntervals.keys()].map((id) => employeeMap.get(id)).filter((e) => e !== void 0).sort((a, b) => a.name.localeCompare(b.name));
    const hours = [];
    for (let h = day.openHour; h < day.closeHour; h++) {
      hours.push(h);
    }
    const rows = scheduledEmployees.map((emp) => {
      const intervals = empIntervals.get(emp.id);
      const cells = hours.map((h, hIdx) => {
        const activeInterval = intervals.find((iv) => h >= iv.startHour && h < iv.endHour);
        if (!activeInterval) return null;
        const onDutyThisHour = scheduledEmployees.filter((e) => {
          const ivs = empIntervals.get(e.id);
          return ivs.some((iv) => h >= iv.startHour && h < iv.endHour);
        });
        const rolePool = onDutyThisHour.map((e) => {
          const ivs = empIntervals.get(e.id);
          const iv = ivs.find((iv2) => h >= iv2.startHour && h < iv2.endHour);
          return CATEGORY_TO_DAILY_ROLE[iv.category] ?? iv.category;
        });
        const offset = rotationIndex(hIdx);
        const posInGroup = onDutyThisHour.indexOf(emp);
        const roleIdx = (posInGroup + offset) % rolePool.length;
        return { role: rolePool[roleIdx], locked: false };
      });
      return {
        employeeId: emp.id,
        employeeName: emp.name,
        cells,
        intervals
      };
    });
    return {
      dateStr: toDateStr2(day.date),
      dayOfWeek: DOW_NAMES[day.date.getDay()],
      dateLabel: `${MONTH_NAMES[day.date.getMonth()]} ${day.date.getDate()}, ${day.date.getFullYear()}`,
      openHour: day.openHour,
      closeHour: day.closeHour,
      hours,
      rows
    };
  }

  // src/ui/daily-modal.ts
  function showDailyModal(schedule, allEmployees, scheduledEmpIds, onChange) {
    document.getElementById("daily-modal-overlay")?.remove();
    document.removeEventListener("keydown", handleEscKey);
    const overlay = document.createElement("div");
    overlay.id = "daily-modal-overlay";
    overlay.className = "daily-modal-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "daily-modal-title");
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeDailyModal();
    });
    const modal = document.createElement("div");
    modal.className = "daily-modal";
    modal.appendChild(buildHeader(schedule));
    const gridWrap = document.createElement("div");
    gridWrap.className = "daily-grid-wrapper";
    const unscheduled = allEmployees.filter((e) => !scheduledEmpIds.has(e.id));
    gridWrap.appendChild(buildGrid(schedule, unscheduled, onChange));
    modal.appendChild(gridWrap);
    overlay.appendChild(modal);
    document.getElementById("app").appendChild(overlay);
    document.addEventListener("keydown", handleEscKey);
  }
  function closeDailyModal() {
    const overlay = document.getElementById("daily-modal-overlay");
    if (overlay) {
      overlay.classList.add("daily-modal--closing");
      setTimeout(() => overlay.remove(), 200);
    }
    document.getElementById("emp-override-menu")?.remove();
    document.removeEventListener("keydown", handleEscKey);
  }
  function handleEscKey(e) {
    if (e.key === "Escape") closeDailyModal();
  }
  function buildHeader(schedule) {
    const header = document.createElement("div");
    header.className = "daily-modal-header";
    const titleBlock = document.createElement("div");
    titleBlock.className = "daily-title-block";
    const title = document.createElement("h2");
    title.id = "daily-modal-title";
    title.className = "daily-modal-title";
    title.textContent = `${schedule.dayOfWeek} Daily Shift Schedule`;
    const dateLine = document.createElement("p");
    dateLine.className = "daily-modal-date";
    dateLine.textContent = schedule.dateLabel;
    titleBlock.appendChild(title);
    titleBlock.appendChild(dateLine);
    const actions = document.createElement("div");
    actions.className = "daily-modal-actions";
    const printBtn = document.createElement("button");
    printBtn.id = "daily-print-btn";
    printBtn.className = "btn btn--ghost btn--sm";
    printBtn.setAttribute("aria-label", "Print daily schedule");
    printBtn.innerHTML = "\u{1F5A8}&thinsp;Print";
    printBtn.addEventListener("click", () => printDailySchedule(schedule));
    const closeBtn = document.createElement("button");
    closeBtn.id = "daily-close-btn";
    closeBtn.className = "btn btn--ghost btn--sm daily-close-btn";
    closeBtn.setAttribute("aria-label", "Close daily schedule");
    closeBtn.textContent = "\u2715";
    closeBtn.addEventListener("click", closeDailyModal);
    actions.appendChild(printBtn);
    actions.appendChild(closeBtn);
    header.appendChild(titleBlock);
    header.appendChild(actions);
    return header;
  }
  function buildGrid(schedule, unscheduled, onChange) {
    const table = document.createElement("table");
    table.className = "daily-grid";
    table.id = "daily-grid-table";
    const datalist = document.createElement("datalist");
    datalist.id = "daily-roles-list";
    for (const role of DAILY_ROLES) {
      const opt = document.createElement("option");
      opt.value = role;
      datalist.appendChild(opt);
    }
    table.appendChild(datalist);
    const thead = document.createElement("thead");
    const headTr = document.createElement("tr");
    const empTh = document.createElement("th");
    empTh.className = "daily-th daily-col-emp";
    empTh.textContent = "Employee";
    headTr.appendChild(empTh);
    for (const h of schedule.hours) {
      const th = document.createElement("th");
      th.className = "daily-th daily-col-hour";
      th.textContent = `${h}:00`;
      headTr.appendChild(th);
    }
    thead.appendChild(headTr);
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    schedule.rows.forEach((row, rowIdx) => {
      const tr = document.createElement("tr");
      tr.className = rowIdx % 2 === 0 ? "daily-row-even" : "daily-row-odd";
      tr.dataset["rowIdx"] = String(rowIdx);
      const empTd = document.createElement("td");
      empTd.className = "daily-td daily-col-emp";
      const empBtn = document.createElement("button");
      empBtn.className = "daily-emp-btn";
      empBtn.textContent = row.employeeName;
      empBtn.title = unscheduled.length > 0 ? "Click to substitute with another employee (e.g. sick coverage)" : "No unscheduled employees available for substitution";
      if (unscheduled.length > 0) {
        empBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          showEmpOverrideMenu(empBtn, row, unscheduled, schedule, onChange);
        });
      } else {
        empBtn.classList.add("daily-emp-btn--no-sub");
      }
      empTd.appendChild(empBtn);
      tr.appendChild(empTd);
      row.cells.forEach((cell, colIdx) => {
        const td = document.createElement("td");
        td.className = "daily-td";
        if (cell === null) {
          td.classList.add("daily-cell--off");
          td.setAttribute("aria-hidden", "true");
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
  function buildCellInput(cell, row, colIdx, schedule, onChange) {
    const input = document.createElement("input");
    input.type = "text";
    input.setAttribute("list", "daily-roles-list");
    input.value = cell.role;
    input.className = "daily-cell-input" + (cell.locked ? " daily-cell-input--locked" : "");
    input.setAttribute(
      "aria-label",
      `${row.employeeName} duty at ${schedule.hours[colIdx]}:00`
    );
    const commit = () => {
      const val = input.value.trim();
      cell.role = val || "TBD";
      cell.locked = true;
      input.value = cell.role;
      input.classList.add("daily-cell-input--locked");
      onChange(schedule);
    };
    input.addEventListener("change", commit);
    input.addEventListener("blur", () => {
      if (input.value !== cell.role) commit();
    });
    return input;
  }
  function showEmpOverrideMenu(anchor, row, unscheduled, schedule, onChange) {
    document.getElementById("emp-override-menu")?.remove();
    const menu = document.createElement("div");
    menu.id = "emp-override-menu";
    menu.className = "emp-override-menu";
    menu.setAttribute("role", "listbox");
    menu.setAttribute("aria-label", "Select substitute employee");
    const menuTitle = document.createElement("div");
    menuTitle.className = "emp-override-title";
    menuTitle.textContent = "Substitute with:";
    menu.appendChild(menuTitle);
    const keepBtn = document.createElement("button");
    keepBtn.className = "emp-override-item emp-override-item--current";
    keepBtn.textContent = `\u2713 ${row.employeeName} (current)`;
    keepBtn.setAttribute("role", "option");
    keepBtn.addEventListener("click", () => menu.remove());
    menu.appendChild(keepBtn);
    for (const emp of unscheduled) {
      const btn = document.createElement("button");
      btn.className = "emp-override-item";
      btn.textContent = `${emp.name} (${emp.status})`;
      btn.setAttribute("role", "option");
      btn.addEventListener("click", () => {
        row.employeeId = emp.id;
        row.employeeName = emp.name;
        anchor.textContent = emp.name;
        onChange(schedule);
        menu.remove();
      });
      menu.appendChild(btn);
    }
    const overlay = document.getElementById("daily-modal-overlay");
    const anchorRect = anchor.getBoundingClientRect();
    const overlayRect = overlay.getBoundingClientRect();
    menu.style.top = `${anchorRect.bottom - overlayRect.top + 4}px`;
    menu.style.left = `${anchorRect.left - overlayRect.left}px`;
    overlay.appendChild(menu);
    const closeMenu = (e) => {
      if (!menu.contains(e.target) && e.target !== anchor) {
        menu.remove();
        document.removeEventListener("click", closeMenu);
      }
    };
    setTimeout(() => document.addEventListener("click", closeMenu), 0);
  }
  function printDailySchedule(schedule) {
    const win = window.open("", "_blank", "width=1400,height=800");
    if (!win) {
      alert("Print blocked \u2014 please allow pop-ups for this site.");
      return;
    }
    const headerCells = [
      `<th class="ec">Employee</th>`,
      ...schedule.hours.map((h) => `<th class="hc">${h}:00</th>`)
    ].join("");
    const bodyRows = schedule.rows.map((row) => {
      const cells = row.cells.map((cell) => {
        if (cell === null) return `<td class="off"></td>`;
        return `<td class="dc">${esc(cell.role)}</td>`;
      }).join("");
      return `<tr><td class="en">${esc(row.employeeName)}</td>${cells}</tr>`;
    }).join("\n");
    win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${esc(schedule.dayOfWeek)} Daily Shift Schedule \u2014 ${esc(schedule.dateLabel)}</title>
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
  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // src/data/demo.ts
  var DEMO_SEED = 42;
  var FIRST_NAMES = [
    "Alice",
    "Bob",
    "Carol",
    "David",
    "Emma",
    "Frank",
    "Grace",
    "Henry",
    "Isabel",
    "James",
    "Karen",
    "Leo",
    "Maya",
    "Nathan",
    "Olivia",
    "Paul",
    "Quinn",
    "Rachel",
    "Sam",
    "Tara",
    "Uma",
    "Victor",
    "Wendy",
    "Xavier",
    "Yolanda",
    "Zach"
  ];
  var LAST_NAMES = [
    "Adams",
    "Baker",
    "Carter",
    "Davis",
    "Evans",
    "Foster",
    "Green",
    "Harris",
    "Ingram",
    "Johnson",
    "King",
    "Lewis",
    "Martin",
    "Nash",
    "Owen",
    "Parker",
    "Quinn",
    "Reed",
    "Smith",
    "Taylor",
    "Underwood",
    "Vance",
    "Walker",
    "Young"
  ];
  var ALL_WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  function pickSome(rng, arr, min, max) {
    const count = rng.nextInt(min, max);
    const shuffled = rng.shuffle(arr);
    return shuffled.slice(0, count);
  }
  function pickOne(rng, arr) {
    return rng.pick(arr);
  }
  var FT_EMPLOYEES = [
    {
      id: "ft-001",
      name: "Jordan Hayes",
      status: "FT" /* FullTime */,
      preferredDays: ["Monday", "Tuesday", "Wednesday", "Thursday"].map((d) => ds.weekday(d)),
      notAvailableDays: [],
      closeThenOpenPref: "avoid"
    },
    {
      id: "ft-002",
      name: "Morgan Ellis",
      status: "FT" /* FullTime */,
      preferredDays: ["Tuesday", "Wednesday", "Thursday", "Friday"].map((d) => ds.weekday(d)),
      notAvailableDays: [],
      closeThenOpenPref: "neutral"
    },
    {
      id: "ft-003",
      name: "Avery Simmons",
      status: "FT" /* FullTime */,
      preferredDays: ["Monday", "Wednesday", "Friday", "Saturday"].map((d) => ds.weekday(d)),
      notAvailableDays: [],
      closeThenOpenPref: "avoid",
      preferredCoworkers: ["ft-001"]
    },
    {
      id: "ft-004",
      name: "Casey Thornton",
      status: "FT" /* FullTime */,
      preferredDays: ["Thursday", "Friday", "Saturday"].map((d) => ds.weekday(d)),
      notAvailableDays: [],
      closeThenOpenPref: "prefer",
      avoidCoworkers: ["ft-002"]
    }
  ];
  function generatePTEmployees(rng, count) {
    const used = /* @__PURE__ */ new Set();
    const employees = [];
    for (let i = 0; i < count; i++) {
      let name;
      let attempts = 0;
      do {
        name = `${pickOne(rng, FIRST_NAMES)} ${pickOne(rng, LAST_NAMES)}`;
        attempts++;
      } while (used.has(name) && attempts < 50);
      used.add(name);
      const id = `pt-${String(i + 1).padStart(3, "0")}`;
      const notAvailable = pickSome(rng, ALL_WEEKDAYS, 0, 1);
      const preferred = pickSome(rng, ALL_WEEKDAYS.filter((d) => !notAvailable.includes(d)), 1, 3);
      const minHours = 12;
      const maxHours = rng.pick([16, 20, 24, 28, 32]);
      const closeThenOpen = rng.pick(["prefer", "avoid", "avoid", "neutral"]);
      const priorIds = employees.map((e) => e.id);
      const preferredCo = priorIds.length > 0 && rng.next() < 0.3 ? [rng.pick(priorIds)] : [];
      const avoidCo = priorIds.length > 0 && rng.next() < 0.2 ? [rng.pick(priorIds.filter((pid) => !preferredCo.includes(pid)))] : [];
      const unavailableHours = [];
      if (rng.next() < 0.25) {
        const day = rng.pick(ALL_WEEKDAYS);
        if (rng.next() < 0.5) {
          unavailableHours.push({ day, start: 9, end: 13 });
        } else {
          unavailableHours.push({ day, start: 17, end: 21 });
        }
      }
      const notAvailSpecs = notAvailable.map((d) => ds.weekday(d));
      const preferredSpecs = preferred.map((d) => ds.weekday(d));
      let shiftSizes = [];
      if (i === 0) shiftSizes = [4, 6];
      else if (i === 1) shiftSizes = [8];
      else if (i === 2) shiftSizes = [6, 8];
      employees.push({
        id,
        name,
        status: "PT" /* PartTime */,
        shiftSizes,
        minHoursPerWeek: minHours,
        maxHoursPerWeek: maxHours,
        notAvailableDays: notAvailSpecs,
        preferredDays: preferredSpecs,
        unavailableHours,
        preferredHours: [],
        preferredCoworkers: preferredCo,
        avoidCoworkers: avoidCo.length > 0 ? avoidCo : [],
        closeThenOpenPref: closeThenOpen
      });
    }
    return employees;
  }
  function getDemoEmployees() {
    const rng = new SeededRandom(DEMO_SEED);
    const ptInits = generatePTEmployees(rng, 21);
    return [
      ...FT_EMPLOYEES.map((init) => new Employee(init)),
      ...ptInits.map((init) => new Employee(init))
    ];
  }
  function getDemoProgrammingDays() {
    const weekdays = [
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
      "2026-09-04",
      // week 1 (Tue–Fri)
      "2026-09-07",
      "2026-09-08",
      "2026-09-09",
      "2026-09-10",
      "2026-09-11",
      "2026-09-14",
      "2026-09-15",
      "2026-09-16",
      "2026-09-17",
      "2026-09-18",
      "2026-09-21",
      "2026-09-22",
      "2026-09-23",
      "2026-09-24",
      "2026-09-25",
      "2026-09-28",
      "2026-09-29",
      "2026-09-30"
    ];
    const saturdays = ["2026-09-05", "2026-09-12", "2026-09-26"];
    return [
      ...weekdays.map((d) => ({ dateStr: d, count: 2 })),
      ...saturdays.map((d) => ({ dateStr: d, count: 1 }))
    ];
  }

  // src/parsers/csv-shifts.ts
  function parseShiftsCSV(raw) {
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const result = /* @__PURE__ */ new Map();
    const dataLines = lines[0]?.toLowerCase().startsWith("date") ? lines.slice(1) : lines;
    for (const line of dataLines) {
      const cols = parseCSVLine(line);
      if (cols.length < 2) continue;
      const dateStr = cols[0].trim();
      const action = cols[1].trim().toLowerCase();
      const category = (cols[2] ?? "").trim();
      const count = parseInt(cols[3] ?? "1", 10) || 1;
      if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) continue;
      const existing = result.get(dateStr) ?? {};
      if (action === "holiday") {
        result.set(dateStr, { ...existing, holiday: true });
        continue;
      }
      if (action === "add") {
        const cat = category;
        if (cat === "Programming" /* Programming */) {
          result.set(dateStr, {
            ...existing,
            addProgramming: (existing.addProgramming ?? 0) + count
          });
        }
        continue;
      }
      if (action === "override") {
        const cats = category.split(",").map((c) => c.trim());
        const reqs = cats.filter((c) => c in SHIFT_DEFINITIONS).map((c) => {
          const def = SHIFT_DEFINITIONS[c];
          return {
            category: c,
            coverageStart: 9,
            coverageEnd: def.requiredStatus === "FT" ? 21 : 18
          };
        });
        result.set(dateStr, { ...existing, requirements: reqs });
      }
    }
    return result;
  }
  var SHIFTS_CSV_TEMPLATE = `date,action,category,count
# holiday example:
2026-09-04,holiday,,
# add Programming shifts:
2026-09-01,add,Programming,2
2026-09-05,add,Programming,1
# override all requirements for a day (comma-separated categories):
# 2026-09-15,override,"PIC,Accounts,Info",
`;
  function parseCSVLine(line) {
    const cols = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        cols.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    cols.push(current);
    return cols;
  }

  // src/parsers/csv-employees.ts
  var EMPLOYEES_CSV_TEMPLATE = `name,status,shift_sizes,min_hours,max_hours,not_available_days,preferred_days,preferred_coworkers,avoid_coworkers,close_then_open
Jordan Hayes,FT,,40,40,,,,,avoid
Alice Smith,PT,4|6,12,24,Saturday,Monday|Tuesday,Jordan Hayes,,avoid
Bob Jones,PT,8,16,32,,Wednesday|Friday,,Alice Smith,neutral
Dana Lee,PT,,12,20,15|Monday3,Tuesday|Friday,,,neutral
`;
  function parseEmployeesCSV(raw) {
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];
    const dataLines = lines[0].toLowerCase().includes("name") ? lines.slice(1) : lines;
    const rows = [];
    for (const line of dataLines) {
      if (line.startsWith("#")) continue;
      const cols = parseCSVLine2(line);
      if (cols.length < 2) continue;
      const name = cols[0]?.trim() ?? "";
      if (!name) continue;
      const statusRaw = (cols[1]?.trim() ?? "PT").toUpperCase();
      const status = statusRaw === "FT" ? "FT" /* FullTime */ : statusRaw === "PROG" || statusRaw === "PROGRAMMING" ? "Programming" /* Programming */ : "PT" /* PartTime */;
      const shiftSizes = (cols[2] ?? "").split("|").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n) && (n === 4 || n === 6 || n === 8));
      const minHours = parseInt(cols[3] ?? "", 10) || 12;
      const maxHours = parseInt(cols[4] ?? "", 10) || 32;
      const notAvail = parseDayList(cols[5] ?? "");
      const preferred = parseDayList(cols[6] ?? "");
      const prefCoNames = parseNameList(cols[7] ?? "");
      const avoidCoNames = parseNameList(cols[8] ?? "");
      const closePref = parseClosePref(cols[9] ?? "");
      rows.push({
        name,
        status,
        ...shiftSizes.length > 0 ? { shiftSizes } : {},
        minHoursPerWeek: minHours,
        maxHoursPerWeek: maxHours,
        notAvailableDays: notAvail,
        preferredDays: preferred,
        preferredCoworkers: prefCoNames,
        avoidCoworkers: avoidCoNames,
        closeThenOpenPref: closePref
      });
    }
    const nameToId = /* @__PURE__ */ new Map();
    rows.forEach((r, i) => {
      const id = `emp-${String(i + 1).padStart(3, "0")}`;
      nameToId.set(r.name.toLowerCase(), id);
    });
    return rows.map((r, i) => {
      const id = `emp-${String(i + 1).padStart(3, "0")}`;
      const resolveNames = (names) => names.map((n) => nameToId.get(n.toLowerCase())).filter((id2) => id2 !== void 0);
      const init = {
        id,
        name: r.name,
        status: r.status,
        ...r.shiftSizes ? { shiftSizes: r.shiftSizes } : {},
        minHoursPerWeek: r.minHoursPerWeek,
        maxHoursPerWeek: r.maxHoursPerWeek,
        notAvailableDays: r.notAvailableDays,
        preferredDays: r.preferredDays,
        preferredCoworkers: resolveNames(r.preferredCoworkers),
        avoidCoworkers: resolveNames(r.avoidCoworkers),
        closeThenOpenPref: r.closeThenOpenPref
      };
      return new Employee(init);
    });
  }
  function parseDayList(raw) {
    if (!raw.trim()) return [];
    return raw.split("|").map((token) => parseDaySpec(token.trim())).filter((s) => s !== null);
  }
  function parseNameList(raw) {
    if (!raw.trim()) return [];
    return raw.split("|").map((n) => n.trim()).filter(Boolean);
  }
  function parseClosePref(raw) {
    const v = raw.trim().toLowerCase();
    if (v === "prefer") return "prefer";
    if (v === "avoid") return "avoid";
    return "neutral";
  }
  function parseCSVLine2(line) {
    const cols = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        cols.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    cols.push(current);
    return cols;
  }

  // src/ui/calendar.ts
  var DAY_ABBRS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var DAY_FULL_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  function renderCalendar(schedule, container, employeeMap, onDayClick) {
    container.innerHTML = "";
    const headingRow = document.createElement("div");
    headingRow.className = "calendar-heading-row";
    const heading = document.createElement("h2");
    heading.className = "calendar-heading";
    heading.textContent = `${monthName(schedule.month)} ${schedule.year}`;
    const printBtn = document.createElement("button");
    printBtn.id = "calendar-print-btn";
    printBtn.className = "btn btn--ghost btn--sm";
    printBtn.innerHTML = "\u{1F5A8}&thinsp;Print";
    printBtn.setAttribute("aria-label", "Print monthly schedule");
    printBtn.addEventListener("click", () => printCalendar(schedule, employeeMap));
    headingRow.appendChild(heading);
    headingRow.appendChild(printBtn);
    container.appendChild(headingRow);
    const header = document.createElement("div");
    header.className = "calendar-header";
    for (const abbr of DAY_ABBRS) {
      const cell = document.createElement("div");
      cell.className = "cal-day-header";
      cell.textContent = abbr;
      header.appendChild(cell);
    }
    container.appendChild(header);
    const grid = document.createElement("div");
    grid.className = "calendar-grid";
    for (const week of schedule.weeks) {
      const row = document.createElement("div");
      row.className = "calendar-row";
      for (const day of week) {
        const cell = buildDayCell(day, employeeMap, onDayClick);
        row.appendChild(cell);
      }
      grid.appendChild(row);
    }
    container.appendChild(grid);
  }
  function buildDayCell(day, employeeMap, onDayClick) {
    const cell = document.createElement("div");
    if (!day) {
      cell.className = "cal-cell cal-cell--empty";
      return cell;
    }
    if (day.isClosed) {
      cell.className = "cal-cell cal-cell--closed";
      const dateNum2 = document.createElement("span");
      dateNum2.className = "cal-date";
      dateNum2.textContent = String(day.date.getDate());
      cell.appendChild(dateNum2);
      if (day.isHoliday) {
        const badge = document.createElement("span");
        badge.className = "cal-holiday-badge";
        badge.textContent = "\u{1F3D6} Holiday";
        cell.appendChild(badge);
      }
      return cell;
    }
    cell.className = "cal-cell cal-cell--open";
    if (onDayClick) {
      cell.classList.add("cal-cell--clickable");
      cell.setAttribute("role", "button");
      cell.setAttribute("tabindex", "0");
      cell.title = "Click to open daily shift schedule";
      cell.addEventListener("click", () => onDayClick(day));
      cell.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onDayClick(day);
        }
      });
    }
    const dateNum = document.createElement("span");
    dateNum.className = "cal-date";
    dateNum.textContent = String(day.date.getDate());
    cell.appendChild(dateNum);
    if (onDayClick) {
      const hint = document.createElement("span");
      hint.className = "cal-daily-hint";
      hint.textContent = "\u2197 daily";
      hint.setAttribute("aria-hidden", "true");
      cell.appendChild(hint);
    }
    const hoursBadge = document.createElement("span");
    hoursBadge.className = "cal-hours";
    hoursBadge.textContent = `${day.openHour}:00\u2013${day.closeHour}:00`;
    cell.appendChild(hoursBadge);
    const grouped = groupByCategory(day.assignments);
    const catOrder = [
      "PIC" /* PIC */,
      "Accounts" /* Accounts */,
      "Info" /* Info */,
      "Welcome" /* Welcome */,
      "Float" /* Float */,
      "Support" /* Support */,
      "Programming" /* Programming */
    ];
    for (const cat of catOrder) {
      const slots = grouped.get(cat);
      if (!slots || slots.length === 0) continue;
      const section = document.createElement("div");
      section.className = "cal-role-section";
      const def = SHIFT_DEFINITIONS[cat];
      const roleLabel = document.createElement("div");
      roleLabel.className = "cal-role-label";
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
  function buildShiftChip(slot, employeeMap, color) {
    const chip = document.createElement("div");
    chip.className = "cal-shift-chip";
    chip.style.borderLeftColor = color;
    chip.style.setProperty("--chip-color", color);
    const dur = slot.endHour - slot.startHour;
    const empId = slot.assignedEmployeeId;
    const emp = empId ? employeeMap.get(empId) : void 0;
    const name = document.createElement("span");
    name.className = "chip-name";
    name.textContent = emp ? emp.name : "\u26A0 Unassigned";
    if (!emp) chip.classList.add("cal-shift-chip--unassigned");
    const time = document.createElement("span");
    time.className = "chip-time";
    time.textContent = `${slot.startHour}:00\u2013${slot.endHour}:00 (${dur}h)`;
    chip.appendChild(name);
    chip.appendChild(time);
    chip.title = emp ? `${emp.name} | ${slot.definition.label} | ${slot.startHour}:00\u2013${slot.endHour}:00 (${dur}h) | ${emp.status}` : `Unassigned | ${slot.definition.label} | ${slot.startHour}:00\u2013${slot.endHour}:00`;
    return chip;
  }
  function renderSummary(rows, container, numWeeks, ctx) {
    container.innerHTML = "";
    const headingRow = document.createElement("div");
    headingRow.className = "summary-heading-row";
    const heading = document.createElement("h3");
    heading.className = "summary-heading";
    heading.textContent = "Employee Hour Summary";
    const actions = document.createElement("div");
    actions.className = "summary-actions";
    const printBtn = document.createElement("button");
    printBtn.id = "summary-print-btn";
    printBtn.className = "btn btn--ghost btn--sm";
    printBtn.innerHTML = "\u{1F5A8}&thinsp;Print";
    printBtn.setAttribute("aria-label", "Print employee hour summary");
    const dlBtn = document.createElement("button");
    dlBtn.id = "summary-download-btn";
    dlBtn.className = "btn btn--ghost btn--sm";
    dlBtn.innerHTML = "\u2B07&thinsp;CSV";
    dlBtn.setAttribute("aria-label", "Download employee hour summary as CSV");
    actions.appendChild(printBtn);
    actions.appendChild(dlBtn);
    headingRow.appendChild(heading);
    headingRow.appendChild(actions);
    container.appendChild(headingRow);
    const sorted = [...rows].sort((a, b) => {
      if (a.employee.status !== b.employee.status) {
        return a.employee.status === "FT" ? -1 : 1;
      }
      return a.employee.name.localeCompare(b.employee.name);
    });
    const weekCols = Array.from({ length: numWeeks }, (_, i) => `Wk ${i + 1}`);
    const cols = ["Employee", "Status", ...weekCols, "Total"];
    const table = document.createElement("table");
    table.id = "summary-table";
    table.className = "summary-table";
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    for (const col of cols) {
      const th = document.createElement("th");
      th.textContent = col;
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    for (const row of sorted) {
      const tr = document.createElement("tr");
      tr.className = row.employee.status === "FT" ? "row-ft" : "row-pt";
      const nameTd = document.createElement("td");
      nameTd.textContent = row.employee.name;
      tr.appendChild(nameTd);
      const statusTd = document.createElement("td");
      statusTd.textContent = row.employee.status;
      statusTd.className = `status-badge status-${row.employee.status.toLowerCase()}`;
      tr.appendChild(statusTd);
      for (let w = 0; w < numWeeks; w++) {
        const td = document.createElement("td");
        const h = row.weeklyHours[w] ?? 0;
        td.textContent = h > 0 ? String(h) : "\u2013";
        if (row.employee.status === "FT" && h !== 40 && h > 0) td.classList.add("hours-warning");
        if (h > 0) td.classList.add("has-hours");
        tr.appendChild(td);
      }
      const totalTd = document.createElement("td");
      totalTd.textContent = String(row.totalHours);
      totalTd.className = "col-total";
      tr.appendChild(totalTd);
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    container.appendChild(table);
    printBtn.addEventListener(
      "click",
      () => printSummary(sorted, cols, ctx)
    );
    dlBtn.addEventListener(
      "click",
      () => downloadSummaryCSV(sorted, numWeeks, ctx)
    );
  }
  var MONTH_NAMES_FULL = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];
  function printSummary(sorted, cols, ctx) {
    const win = window.open("", "_blank", "width=1100,height=750");
    if (!win) {
      alert("Print blocked \u2014 please allow pop-ups for this site.");
      return;
    }
    const monthLabel = MONTH_NAMES_FULL[ctx.month];
    const title = `${monthLabel} ${ctx.year} \u2014 Employee Hour Summary`;
    const headerHtml = cols.map((c) => `<th>${escSummary(c)}</th>`).join("");
    const bodyHtml = sorted.map((row) => {
      const statusCell = `<td>${escSummary(row.employee.status)}</td>`;
      const weekCells = row.weeklyHours.map((h) => `<td class="num">${h > 0 ? h : "\u2013"}</td>`).join("");
      const totalCell = `<td class="num total">${row.totalHours}</td>`;
      const ftClass = row.employee.status === "FT" ? ' class="ft"' : "";
      return `<tr${ftClass}><td>${escSummary(row.employee.name)}</td>${statusCell}${weekCells}${totalCell}</tr>`;
    }).join("\n");
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
  function downloadSummaryCSV(sorted, numWeeks, ctx) {
    const monthSlug = MONTH_NAMES_FULL[ctx.month].toLowerCase();
    const filename = `${ctx.year}_${monthSlug}_employee_hour_summary.csv`;
    const weekHeaders = Array.from({ length: numWeeks }, (_, i) => `Wk ${i + 1}`);
    const header = ["Employee", "Status", ...weekHeaders, "Total Hours"];
    const dataRows = sorted.map((row) => [
      row.employee.name,
      row.employee.status,
      ...row.weeklyHours.map((h) => String(h)),
      String(row.totalHours)
    ]);
    const csv = [header, ...dataRows].map((r) => r.map((cell) => csvCell(cell)).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  function csvCell(value) {
    if (/[,"\r\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
  function escSummary(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function renderLegend(container) {
    container.innerHTML = "";
    const catOrder = [
      "PIC" /* PIC */,
      "Accounts" /* Accounts */,
      "Info" /* Info */,
      "Welcome" /* Welcome */,
      "Float" /* Float */,
      "Support" /* Support */,
      "Programming" /* Programming */
    ];
    for (const cat of catOrder) {
      const def = SHIFT_DEFINITIONS[cat];
      const item = document.createElement("div");
      item.className = "legend-item";
      const swatch = document.createElement("span");
      swatch.className = "legend-swatch";
      swatch.style.background = def.color;
      const label = document.createElement("span");
      label.textContent = def.label;
      item.appendChild(swatch);
      item.appendChild(label);
      container.appendChild(item);
    }
  }
  var PRINT_MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];
  function printCalendar(schedule, employeeMap) {
    const win = window.open("", "_blank", "width=1400,height=900");
    if (!win) {
      alert("Print blocked \u2014 please allow pop-ups for this site.");
      return;
    }
    const monthLabel = PRINT_MONTH_NAMES[schedule.month];
    const title = `${monthLabel} ${schedule.year} \u2014 Staff Schedule`;
    const dowHeader = DAY_FULL_NAMES.map((d) => `<th>${d}</th>`).join("");
    const weekRows = schedule.weeks.map((week) => {
      const cells = week.map((day) => {
        if (!day) return '<td class="empty"></td>';
        if (day.isClosed) {
          const label = day.isHoliday ? "Holiday" : "Closed";
          return `<td class="closed"><span class="dn">${day.date.getDate()}</span><span class="cl">${label}</span></td>`;
        }
        const sorted = [...day.assignments].filter((s) => s.assignedEmployeeId).sort((a, b) => {
          if (a.startHour !== b.startHour) return a.startHour - b.startHour;
          const na = employeeMap.get(a.assignedEmployeeId)?.name ?? "";
          const nb = employeeMap.get(b.assignedEmployeeId)?.name ?? "";
          return na.localeCompare(nb);
        });
        const entries = sorted.map((slot) => {
          const emp = employeeMap.get(slot.assignedEmployeeId);
          const name = emp ? escCal(emp.name) : "<em>Unassigned</em>";
          return `<div class="entry">${name} <span class="hrs">${slot.startHour}:00\u2013${slot.endHour}:00</span></div>`;
        }).join("");
        return `<td><span class="dn">${day.date.getDate()}</span>${entries}</td>`;
      }).join("");
      return `<tr>${cells}</tr>`;
    }).join("\n");
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
  function escCal(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function groupByCategory(slots) {
    const map = /* @__PURE__ */ new Map();
    for (const slot of slots) {
      const cat = slot.definition.category;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(slot);
    }
    for (const [, group] of map) {
      group.sort((a, b) => a.startHour - b.startHour);
    }
    return map;
  }

  // src/ui/app.ts
  function initApp() {
    const state = {
      year: 2026,
      month: 8,
      // September = index 8
      seed: 12345,
      employees: getDemoEmployees(),
      overrides: buildDemoOverrides(),
      schedule: null,
      weeklyHoursMap: /* @__PURE__ */ new Map(),
      dailySchedules: /* @__PURE__ */ new Map()
    };
    const yearInput = getEl("year-input");
    const monthSelect = getEl("month-select");
    const seedInput = getEl("seed-input");
    const generateBtn = getEl("generate-btn");
    const shiftsFileInput = getEl("shifts-file");
    const empFileInput = getEl("employees-file");
    const calContainer = getEl("calendar-container");
    const summaryEl = getEl("summary-container");
    const legendEl = getEl("legend-container");
    const shiftsFilename = getEl("shifts-filename");
    const empFilename = getEl("emp-filename");
    const statusEl = getEl("status-bar");
    const dlShiftsTpl = getEl("dl-shifts-template");
    const dlEmpTpl = getEl("dl-employees-template");
    for (let m = 0; m < 12; m++) {
      const opt = document.createElement("option");
      opt.value = String(m);
      opt.textContent = new Date(2e3, m, 1).toLocaleString("default", { month: "long" });
      if (m === 8) opt.selected = true;
      monthSelect.appendChild(opt);
    }
    yearInput.value = String(state.year);
    seedInput.value = String(state.seed);
    yearInput.addEventListener("change", () => {
      state.year = parseInt(yearInput.value, 10) || 2026;
      state.dailySchedules.clear();
    });
    monthSelect.addEventListener("change", () => {
      state.month = parseInt(monthSelect.value, 10);
      state.dailySchedules.clear();
    });
    seedInput.addEventListener("change", () => {
      state.seed = parseInt(seedInput.value, 10) || 12345;
      state.dailySchedules.clear();
    });
    shiftsFileInput.addEventListener("change", async () => {
      const file = shiftsFileInput.files?.[0];
      if (!file) return;
      shiftsFilename.textContent = file.name;
      try {
        const raw = await file.text();
        const parsed = parseShiftsCSV(raw);
        state.overrides = new Map([...buildDemoOverrides(), ...parsed]);
        setStatus(`\u2713 Shifts file loaded: ${file.name}`, "success");
      } catch (e) {
        setStatus(`\u26A0 Could not parse shifts file: ${e.message}`, "error");
      }
    });
    empFileInput.addEventListener("change", async () => {
      const file = empFileInput.files?.[0];
      if (!file) return;
      empFilename.textContent = file.name;
      try {
        const raw = await file.text();
        const parsed = parseEmployeesCSV(raw);
        if (parsed.length > 0) {
          state.employees = parsed;
          state.dailySchedules.clear();
          setStatus(`\u2713 Employees file loaded: ${file.name} (${parsed.length} employees)`, "success");
        } else {
          setStatus("\u26A0 No employees found in CSV.", "error");
        }
      } catch (e) {
        setStatus(`\u26A0 Could not parse employees file: ${e.message}`, "error");
      }
    });
    dlShiftsTpl.addEventListener("click", () => {
      downloadText(SHIFTS_CSV_TEMPLATE, "shifts-template.csv", "text/csv");
    });
    dlEmpTpl.addEventListener("click", () => {
      downloadText(EMPLOYEES_CSV_TEMPLATE, "employees-template.csv", "text/csv");
    });
    generateBtn.addEventListener("click", () => {
      state.dailySchedules.clear();
      runAndRender(state, calContainer, summaryEl, statusEl);
    });
    renderLegend(legendEl);
    runAndRender(state, calContainer, summaryEl, statusEl);
    function setStatus(msg, type) {
      statusEl.textContent = msg;
      statusEl.className = `status-bar status-${type}`;
    }
  }
  function runAndRender(state, calEl, summaryEl, statusEl) {
    const t0 = performance.now();
    state.weeklyHoursMap = /* @__PURE__ */ new Map();
    try {
      const schedule = runScheduler({
        year: state.year,
        month: state.month,
        seed: state.seed,
        employees: state.employees,
        overrides: state.overrides
      });
      state.schedule = schedule;
      const empMap = /* @__PURE__ */ new Map();
      for (const emp of schedule.employees) {
        empMap.set(emp.id, emp);
      }
      const totalWeeks = schedule.weeks.length;
      for (const day of schedule.allDays) {
        if (day.isClosed) continue;
        const wi = getCalendarWeekIndex(day.date, state.year, state.month);
        for (const slot of day.assignments) {
          if (!slot.assignedEmployeeId) continue;
          const dur = slot.endHour - slot.startHour;
          const arr = state.weeklyHoursMap.get(slot.assignedEmployeeId) ?? new Array(totalWeeks).fill(0);
          arr[wi] = (arr[wi] ?? 0) + dur;
          state.weeklyHoursMap.set(slot.assignedEmployeeId, arr);
        }
      }
      const onDayClick = (day) => {
        if (day.isClosed) return;
        const dateStr = toDateStr3(day.date);
        if (!state.dailySchedules.has(dateStr)) {
          state.dailySchedules.set(dateStr, buildDailySchedule(day, empMap));
        }
        const dailySched = state.dailySchedules.get(dateStr);
        const scheduledIds = new Set(dailySched.rows.map((r) => r.employeeId));
        showDailyModal(
          dailySched,
          schedule.employees,
          scheduledIds,
          // onChange: the schedule is mutated in place by the modal;
          // we just need to ensure it stays in the map (it already does)
          (updated) => {
            state.dailySchedules.set(updated.dateStr, updated);
          }
        );
      };
      renderCalendar(schedule, calEl, empMap, onDayClick);
      const summaryRows = schedule.employees.map((emp) => {
        const wh = state.weeklyHoursMap.get(emp.id) ?? new Array(totalWeeks).fill(0);
        return { employee: emp, weeklyHours: [...wh], totalHours: wh.reduce((a, b) => a + b, 0) };
      });
      const summaryCtx = { year: state.year, month: state.month };
      renderSummary(summaryRows, summaryEl, totalWeeks, summaryCtx);
      const elapsed = (performance.now() - t0).toFixed(0);
      const unassigned = schedule.allDays.flatMap((d) => d.assignments).filter((s) => !s.assignedEmployeeId).length;
      const msg = unassigned > 0 ? `\u26A0 Schedule generated in ${elapsed}ms \u2014 ${unassigned} slot(s) unassigned` : `\u2713 Schedule generated in ${elapsed}ms \u2014 all slots filled`;
      statusEl.textContent = msg;
      statusEl.className = `status-bar status-${unassigned > 0 ? "warn" : "success"}`;
    } catch (err) {
      statusEl.textContent = `\u26A0 Error: ${err.message}`;
      statusEl.className = "status-bar status-error";
      console.error(err);
    }
  }
  function buildDemoOverrides() {
    const map = /* @__PURE__ */ new Map();
    for (const { dateStr, count } of getDemoProgrammingDays()) {
      map.set(dateStr, { addProgramming: count });
    }
    return map;
  }
  function getEl(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Element #${id} not found in DOM`);
    return el;
  }
  function downloadText(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  function toDateStr3(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  }

  // src/main.ts
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initApp());
  } else {
    initApp();
  }
})();
//# sourceMappingURL=bundle.js.map
