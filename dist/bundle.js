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
  var ShiftCategory = /* @__PURE__ */ ((ShiftCategory2) => {
    ShiftCategory2["PIC"] = "PIC";
    ShiftCategory2["Accounts"] = "Accounts";
    ShiftCategory2["Info"] = "Info";
    ShiftCategory2["Welcome"] = "Welcome";
    ShiftCategory2["Float"] = "Float";
    ShiftCategory2["Support"] = "Support";
    ShiftCategory2["Programming"] = "Programming";
    return ShiftCategory2;
  })(ShiftCategory || {});
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
      this.mustWorkDays = init.mustWorkDays ?? [];
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
  var BONUS_MUST_WORK_DAY = 1e3;
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
    if (emp.mustWorkDays.length > 0 && emp.mustWorkDays.some((spec) => daySpecMatchesDate(spec, date))) {
      score += BONUS_MUST_WORK_DAY;
    }
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

  // src/ui/utils.ts
  function formatTime(hour24) {
    const h = hour24 % 12 || 12;
    const ampm = hour24 >= 12 ? "PM" : "AM";
    return `${h}:00 ${ampm}`;
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
      th.textContent = formatTime(h);
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
      `${row.employeeName} duty at ${formatTime(schedule.hours[colIdx])}`
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
      ...schedule.hours.map((h) => `<th class="hc">${formatTime(h)}</th>`)
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
  var EMPLOYEES_CSV_TEMPLATE = `name,status,shift_sizes,min_hours,max_hours,not_available_days,preferred_days,preferred_coworkers,avoid_coworkers,close_then_open,must_work_days
Jordan Hayes,FT,,40,40,,,,,avoid,
Alice Smith,PT,4|6,12,24,Saturday,Monday|Tuesday,Jordan Hayes,,avoid,
Bob Jones,PT,8,16,32,,Wednesday|Friday,,Alice Smith,neutral,
Dana Lee,PT,,12,20,15|Monday3,Tuesday|Friday,,,neutral,
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
      const mustWork = parseDayList(cols[10] ?? "");
      rows.push({
        name,
        status,
        ...shiftSizes.length > 0 ? { shiftSizes } : {},
        minHoursPerWeek: minHours,
        maxHoursPerWeek: maxHours,
        notAvailableDays: notAvail,
        preferredDays: preferred,
        mustWorkDays: mustWork,
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
        ...r.mustWorkDays.length > 0 ? { mustWorkDays: r.mustWorkDays } : {},
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
    hoursBadge.textContent = `${formatTime(day.openHour)} \u2013 ${formatTime(day.closeHour)}`;
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
    time.textContent = `${formatTime(slot.startHour)} \u2013 ${formatTime(slot.endHour)} (${dur}h)`;
    chip.appendChild(name);
    chip.appendChild(time);
    chip.title = emp ? `${emp.name} | ${slot.definition.label} | ${formatTime(slot.startHour)} \u2013 ${formatTime(slot.endHour)} (${dur}h) | ${emp.status}` : `Unassigned | ${slot.definition.label} | ${formatTime(slot.startHour)} \u2013 ${formatTime(slot.endHour)}`;
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
    const editBtn = document.createElement("button");
    editBtn.id = "summary-edit-roster-btn";
    editBtn.className = "btn btn--ghost btn--sm";
    editBtn.innerHTML = "\u270F\uFE0F&thinsp;Edit Roster";
    editBtn.setAttribute("aria-label", "Edit the employee roster");
    editBtn.addEventListener("click", () => ctx.onEditRoster());
    actions.appendChild(editBtn);
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
          return `<div class="entry">${name} <span class="hrs">${formatTime(slot.startHour)} \u2013 ${formatTime(slot.endHour)}</span></div>`;
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

  // src/ui/roster-editor.ts
  function validateDaySpecs(raw) {
    if (!raw.trim()) return true;
    const tokens = raw.split("|");
    for (const t of tokens) {
      if (parseDaySpec(t.trim()) === null) return false;
    }
    return true;
  }
  function validateCoworkers(raw, allNames) {
    if (!raw.trim()) return true;
    const tokens = raw.split("|").map((n) => n.trim().toLowerCase()).filter(Boolean);
    for (const t of tokens) {
      if (!allNames.has(t)) return false;
    }
    return true;
  }
  function validateShiftSizes(raw) {
    if (!raw.trim()) return true;
    const tokens = raw.split("|").map((s) => parseInt(s.trim(), 10));
    for (const n of tokens) {
      if (isNaN(n) || n !== 4 && n !== 6 && n !== 8) return false;
    }
    return true;
  }
  function showRosterEditor(currentEmployees, onSave) {
    const overlay = document.createElement("div");
    overlay.className = "daily-modal-overlay";
    overlay.id = "roster-modal-overlay";
    const modal = document.createElement("div");
    modal.className = "daily-modal roster-modal-content";
    const header = document.createElement("div");
    header.className = "daily-modal-header";
    const titleBlock = document.createElement("div");
    titleBlock.className = "daily-title-block";
    const title = document.createElement("h2");
    title.className = "daily-modal-title";
    title.textContent = "Edit Roster";
    titleBlock.appendChild(title);
    header.appendChild(titleBlock);
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "daily-modal-actions";
    const closeBtn = document.createElement("button");
    closeBtn.className = "btn btn--ghost daily-close-btn";
    closeBtn.innerHTML = "&times;";
    closeBtn.addEventListener("click", () => overlay.remove());
    actionsDiv.appendChild(closeBtn);
    header.appendChild(actionsDiv);
    modal.appendChild(header);
    const table = document.createElement("table");
    table.className = "roster-table";
    const thead = document.createElement("thead");
    const headTr = document.createElement("tr");
    const headers = [
      "Name",
      "Status",
      "Shift Sizes (4|6|8)",
      "Min Hrs",
      "Max Hrs",
      "Not Available",
      "Preferred Days",
      "Must Work Days",
      "Preferred Coworkers",
      "Avoid Coworkers",
      "Close\u2192Open",
      ""
      // Action column
    ];
    headers.forEach((h) => {
      const th = document.createElement("th");
      th.textContent = h;
      headTr.appendChild(th);
    });
    thead.appendChild(headTr);
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    table.appendChild(tbody);
    const rowControllers = [];
    const getKnownNames = () => {
      const names = /* @__PURE__ */ new Set();
      for (const ctrl of rowControllers) {
        const init = ctrl();
        if (init && init.name.trim()) names.add(init.name.trim().toLowerCase());
      }
      return names;
    };
    const validateAllRows = () => {
      const inputs = tbody.querySelectorAll('input[data-coworker="true"]');
      inputs.forEach((el) => el.dispatchEvent(new Event("input")));
    };
    function addRow(init) {
      const tr = document.createElement("tr");
      const createInput = (val, placeholder, validator) => {
        const td = document.createElement("td");
        const input = document.createElement("input");
        input.type = "text";
        input.value = val;
        input.placeholder = placeholder;
        input.className = "roster-input";
        if (validator) {
          input.addEventListener("input", () => {
            if (!validator(input.value)) {
              input.classList.add("roster-input--invalid");
            } else {
              input.classList.remove("roster-input--invalid");
            }
          });
        }
        td.appendChild(input);
        tr.appendChild(td);
        return input;
      };
      const createNum = (val, placeholder) => {
        const td = document.createElement("td");
        const input = document.createElement("input");
        input.type = "number";
        input.value = String(val);
        input.placeholder = placeholder;
        input.className = "roster-input roster-input--num";
        td.appendChild(input);
        tr.appendChild(td);
        return input;
      };
      const createSelect = (opts, val) => {
        const td = document.createElement("td");
        const select = document.createElement("select");
        select.className = "roster-select";
        for (const o of opts) {
          const opt = document.createElement("option");
          opt.value = o;
          opt.textContent = o;
          if (o === val) opt.selected = true;
          select.appendChild(opt);
        }
        td.appendChild(select);
        tr.appendChild(td);
        return select;
      };
      const inpName = createInput(init?.name ?? "", "Name");
      inpName.addEventListener("input", validateAllRows);
      const selStatus = createSelect(["FT", "PT", "Programming"], init?.status ?? "PT");
      const inpShiftSizes = createInput(init?.shiftSizes?.join("|") ?? "", "e.g. 4|8", validateShiftSizes);
      const inpMinHours = createNum(init?.minHoursPerWeek ?? 12, "Min");
      const inpMaxHours = createNum(init?.maxHoursPerWeek ?? 32, "Max");
      const toDS = (specs) => {
        if (!specs) return "";
        return specs.map((s) => {
          if (s.type === "date") return String(s.date);
          if (s.type === "weekday") return s.name;
          if (s.type === "nth-weekday") return `${s.name}${s.nth}`;
          return "";
        }).join("|");
      };
      const inpNotAvail = createInput(toDS(init?.notAvailableDays), "e.g. 15|Monday", validateDaySpecs);
      const inpPrefDays = createInput(toDS(init?.preferredDays), "e.g. Friday", validateDaySpecs);
      const inpMustWork = createInput(toDS(init?.mustWorkDays), "e.g. Monday|Saturday", validateDaySpecs);
      const coValidator = (val) => validateCoworkers(val, getKnownNames());
      const idToName = new Map(currentEmployees.map((e) => [e.id, e.name]));
      const toNames = (ids) => ids ? ids.map((id) => idToName.get(id) || id).join("|") : "";
      const inpPrefCo = createInput(toNames(init?.preferredCoworkers), "e.g. Alice", coValidator);
      inpPrefCo.dataset.coworker = "true";
      const inpAvoidCo = createInput(toNames(init?.avoidCoworkers), "e.g. Bob", coValidator);
      inpAvoidCo.dataset.coworker = "true";
      const selCloseOpen = createSelect(["prefer", "avoid", "neutral"], init?.closeThenOpenPref ?? "neutral");
      const tdAction = document.createElement("td");
      const btnRemove = document.createElement("button");
      btnRemove.className = "roster-remove-btn";
      btnRemove.innerHTML = "&minus;";
      btnRemove.title = "Remove employee";
      btnRemove.addEventListener("click", () => {
        tr.remove();
        const idx = rowControllers.indexOf(serialize);
        if (idx !== -1) rowControllers.splice(idx, 1);
        validateAllRows();
      });
      tdAction.appendChild(btnRemove);
      tr.appendChild(tdAction);
      tbody.appendChild(tr);
      setTimeout(() => {
        inpShiftSizes.dispatchEvent(new Event("input"));
        inpNotAvail.dispatchEvent(new Event("input"));
        inpPrefDays.dispatchEvent(new Event("input"));
        inpMustWork.dispatchEvent(new Event("input"));
        inpPrefCo.dispatchEvent(new Event("input"));
        inpAvoidCo.dispatchEvent(new Event("input"));
      }, 0);
      const serialize = () => {
        const name = inpName.value.trim();
        if (!name) return null;
        const status = selStatus.value;
        const shiftSizes = inpShiftSizes.value.split("|").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
        const minHours = parseInt(inpMinHours.value, 10) || 12;
        const maxHours = parseInt(inpMaxHours.value, 10) || 32;
        const parseDayList2 = (raw) => raw.split("|").map((t) => parseDaySpec(t.trim())).filter((s) => s !== null);
        const notAvail = parseDayList2(inpNotAvail.value);
        const prefDays = parseDayList2(inpPrefDays.value);
        const mustWork = parseDayList2(inpMustWork.value);
        const prefCo = inpPrefCo.value.split("|").map((s) => s.trim()).filter(Boolean);
        const avoidCo = inpAvoidCo.value.split("|").map((s) => s.trim()).filter(Boolean);
        return {
          id: init?.id || `new-${Math.random().toString(36).substr(2, 9)}`,
          // Temp ID
          name,
          status,
          ...shiftSizes.length > 0 ? { shiftSizes } : {},
          minHoursPerWeek: minHours,
          maxHoursPerWeek: maxHours,
          notAvailableDays: notAvail,
          preferredDays: prefDays,
          ...mustWork.length > 0 ? { mustWorkDays: mustWork } : {},
          preferredCoworkers: prefCo,
          avoidCoworkers: avoidCo,
          closeThenOpenPref: selCloseOpen.value
        };
      };
      rowControllers.push(serialize);
    }
    currentEmployees.forEach((e) => addRow(e));
    const tableContainer = document.createElement("div");
    tableContainer.className = "roster-table-container";
    tableContainer.appendChild(table);
    modal.appendChild(tableContainer);
    const footer = document.createElement("div");
    footer.className = "modal-footer roster-footer";
    const addBtn = document.createElement("button");
    addBtn.className = "btn btn--secondary";
    addBtn.innerHTML = "+ Add Employee";
    addBtn.addEventListener("click", () => {
      addRow();
      setTimeout(() => tableContainer.scrollTop = tableContainer.scrollHeight, 0);
    });
    footer.appendChild(addBtn);
    const rightActions = document.createElement("div");
    rightActions.className = "roster-footer-right";
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn btn--ghost";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => overlay.remove());
    const saveBtn = document.createElement("button");
    saveBtn.className = "btn btn--primary";
    saveBtn.textContent = "Save & Apply";
    saveBtn.addEventListener("click", () => {
      const inits = [];
      for (const ctrl of rowControllers) {
        const init = ctrl();
        if (init) inits.push(init);
      }
      const nameToId = /* @__PURE__ */ new Map();
      inits.forEach((init, i) => {
        init.id = `emp-${String(i + 1).padStart(3, "0")}`;
        nameToId.set(init.name.toLowerCase(), init.id);
      });
      for (const init of inits) {
        init.preferredCoworkers = init.preferredCoworkers.map((n) => nameToId.get(n.toLowerCase())).filter(Boolean);
        init.avoidCoworkers = init.avoidCoworkers.map((n) => nameToId.get(n.toLowerCase())).filter(Boolean);
      }
      const newEmployees = inits.map((init) => new Employee(init));
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

  // src/ui/shift-editor.ts
  function toDateStr3(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  function showShiftEditor(state, onSave) {
    const numDays = daysInMonth(state.year, state.month);
    const drafts = [];
    for (let d = 1; d <= numDays; d++) {
      const date = new Date(state.year, state.month, d);
      const dateStr = toDateStr3(date);
      const ov = state.overrides.get(dateStr);
      const isClosed = ov?.holiday === true;
      const day = createDay(date, isClosed);
      let reqs = [];
      if (!isClosed) {
        if (ov?.requirements !== void 0) {
          reqs = ov.requirements.map((r) => ({ ...r }));
        } else {
          reqs = getDefaultRequirements(day.dayOfWeek).map((r) => ({ ...r }));
        }
        if ((ov?.addProgramming ?? 0) > 0) {
          for (let i = 0; i < ov.addProgramming; i++) {
            reqs.push({
              category: "Programming" /* Programming */,
              coverageStart: day.openHour,
              coverageEnd: day.closeHour
            });
          }
        }
      }
      drafts.push({ dateStr, day, isClosed, requirements: reqs });
    }
    const overlay = document.createElement("div");
    overlay.className = "daily-modal-overlay";
    overlay.id = "shift-modal-overlay";
    const modal = document.createElement("div");
    modal.className = "daily-modal shift-modal-content";
    modal.style.width = "95vw";
    modal.style.maxWidth = "1600px";
    const header = document.createElement("div");
    header.className = "daily-modal-header";
    const titleBlock = document.createElement("div");
    titleBlock.className = "daily-title-block";
    const title = document.createElement("h2");
    title.className = "daily-modal-title";
    title.textContent = "Edit Shift Requirements";
    titleBlock.appendChild(title);
    const subTitle = document.createElement("p");
    subTitle.className = "daily-modal-date";
    subTitle.textContent = `${new Date(state.year, state.month).toLocaleString("default", { month: "long" })} ${state.year}`;
    titleBlock.appendChild(subTitle);
    header.appendChild(titleBlock);
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "daily-modal-actions";
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn btn--ghost";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => overlay.remove());
    actionsDiv.appendChild(cancelBtn);
    const saveBtn = document.createElement("button");
    saveBtn.className = "btn btn--primary";
    saveBtn.textContent = "Save & Apply";
    saveBtn.addEventListener("click", () => {
      const newOverrides = /* @__PURE__ */ new Map();
      for (const draft of drafts) {
        const defaultReqs = getDefaultRequirements(draft.day.dayOfWeek);
        if (draft.isClosed) {
          if (draft.day.dayOfWeek !== 0) {
            newOverrides.set(draft.dateStr, { holiday: true });
          }
        } else {
          let differs = false;
          if (defaultReqs.length !== draft.requirements.length) {
            differs = true;
          } else {
            for (let i = 0; i < defaultReqs.length; i++) {
              const dr = defaultReqs[i];
              const my = draft.requirements[i];
              if (dr.category !== my.category || dr.coverageStart !== my.coverageStart || dr.coverageEnd !== my.coverageEnd) {
                differs = true;
                break;
              }
            }
          }
          if (differs || draft.day.dayOfWeek === 0) {
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
    const gridContainer = document.createElement("div");
    gridContainer.className = "shift-grid-container";
    gridContainer.style.flex = "1";
    gridContainer.style.overflowY = "auto";
    gridContainer.style.padding = "16px";
    gridContainer.style.display = "grid";
    gridContainer.style.gridTemplateColumns = "repeat(7, 1fr)";
    gridContainer.style.gap = "8px";
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (const wd of weekdays) {
      const th = document.createElement("div");
      th.style.fontWeight = "bold";
      th.style.textAlign = "center";
      th.style.paddingBottom = "8px";
      th.textContent = wd;
      gridContainer.appendChild(th);
    }
    const firstDay = new Date(state.year, state.month, 1).getDay();
    for (let i = 0; i < firstDay; i++) {
      gridContainer.appendChild(document.createElement("div"));
    }
    for (const draft of drafts) {
      const cell = document.createElement("div");
      cell.style.border = "1px solid var(--col-border)";
      cell.style.borderRadius = "var(--radius-md)";
      cell.style.padding = "8px";
      cell.style.display = "flex";
      cell.style.flexDirection = "column";
      cell.style.minHeight = "150px";
      cell.style.background = "var(--col-bg-card)";
      const cellHeader = document.createElement("div");
      cellHeader.style.display = "flex";
      cellHeader.style.justifyContent = "space-between";
      cellHeader.style.alignItems = "center";
      cellHeader.style.marginBottom = "8px";
      const dateSpan = document.createElement("span");
      dateSpan.style.fontWeight = "bold";
      dateSpan.textContent = String(draft.day.date.getDate());
      cellHeader.appendChild(dateSpan);
      const closedLabel = document.createElement("label");
      closedLabel.style.fontSize = "12px";
      closedLabel.style.display = "flex";
      closedLabel.style.alignItems = "center";
      closedLabel.style.gap = "4px";
      closedLabel.style.cursor = "pointer";
      const closedCheckbox = document.createElement("input");
      closedCheckbox.type = "checkbox";
      closedCheckbox.checked = draft.isClosed;
      closedLabel.appendChild(closedCheckbox);
      closedLabel.appendChild(document.createTextNode("Closed"));
      cellHeader.appendChild(closedLabel);
      cell.appendChild(cellHeader);
      const reqsList = document.createElement("div");
      reqsList.style.flex = "1";
      reqsList.style.display = "flex";
      reqsList.style.flexDirection = "column";
      reqsList.style.gap = "4px";
      cell.appendChild(reqsList);
      const addBtn = document.createElement("button");
      addBtn.className = "btn btn--ghost btn--sm";
      addBtn.style.marginTop = "8px";
      addBtn.textContent = "+ Add Shift";
      const renderReqs = () => {
        reqsList.innerHTML = "";
        if (draft.isClosed) {
          cell.style.opacity = "0.5";
          addBtn.style.display = "none";
          return;
        }
        cell.style.opacity = "1";
        addBtn.style.display = "block";
        for (let i = 0; i < draft.requirements.length; i++) {
          const req = draft.requirements[i];
          const row = document.createElement("div");
          row.style.display = "flex";
          row.style.justifyContent = "space-between";
          row.style.alignItems = "center";
          row.style.background = "var(--col-bg-app)";
          row.style.padding = "4px";
          row.style.borderRadius = "4px";
          row.style.fontSize = "11px";
          const info = document.createElement("span");
          info.textContent = `${req.category} (${formatTime(req.coverageStart)} - ${formatTime(req.coverageEnd)})`;
          row.appendChild(info);
          const rmBtn = document.createElement("button");
          rmBtn.innerHTML = "&minus;";
          rmBtn.style.background = "none";
          rmBtn.style.border = "none";
          rmBtn.style.color = "var(--col-danger)";
          rmBtn.style.cursor = "pointer";
          rmBtn.addEventListener("click", () => {
            draft.requirements.splice(i, 1);
            renderReqs();
          });
          row.appendChild(rmBtn);
          reqsList.appendChild(row);
        }
      };
      closedCheckbox.addEventListener("change", () => {
        draft.isClosed = closedCheckbox.checked;
        renderReqs();
      });
      addBtn.addEventListener("click", () => {
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
  function showAddShiftPopover(anchor, draft, onAdd) {
    const popover = document.createElement("div");
    popover.className = "emp-override-menu";
    popover.style.padding = "12px";
    popover.style.width = "240px";
    popover.style.zIndex = "3000";
    const title = document.createElement("div");
    title.className = "emp-override-title";
    title.textContent = "Add Shift";
    popover.appendChild(title);
    const catLabel = document.createElement("label");
    catLabel.textContent = "Role:";
    catLabel.style.display = "block";
    catLabel.style.fontSize = "12px";
    catLabel.style.marginTop = "8px";
    const catSelect = document.createElement("select");
    catSelect.className = "roster-select";
    Object.values(ShiftCategory).forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      catSelect.appendChild(opt);
    });
    catLabel.appendChild(catSelect);
    popover.appendChild(catLabel);
    const baseOpen = draft.day.openHour || 9;
    const baseClose = draft.day.closeHour || 21;
    const startLabel = document.createElement("label");
    startLabel.textContent = "Start:";
    startLabel.style.display = "block";
    startLabel.style.fontSize = "12px";
    startLabel.style.marginTop = "8px";
    const startSelect = document.createElement("select");
    startSelect.className = "roster-select";
    for (let h = baseOpen; h < baseClose; h++) {
      const opt = document.createElement("option");
      opt.value = String(h);
      opt.textContent = formatTime(h);
      startSelect.appendChild(opt);
    }
    startLabel.appendChild(startSelect);
    popover.appendChild(startLabel);
    const endLabel = document.createElement("label");
    endLabel.textContent = "End:";
    endLabel.style.display = "block";
    endLabel.style.fontSize = "12px";
    endLabel.style.marginTop = "8px";
    const endSelect = document.createElement("select");
    endSelect.className = "roster-select";
    for (let h = baseOpen + 1; h <= baseClose; h++) {
      const opt = document.createElement("option");
      opt.value = String(h);
      opt.textContent = formatTime(h);
      if (h === baseClose) opt.selected = true;
      endSelect.appendChild(opt);
    }
    endLabel.appendChild(endSelect);
    popover.appendChild(endLabel);
    const confirmBtn = document.createElement("button");
    confirmBtn.className = "btn btn--primary btn--sm";
    confirmBtn.style.marginTop = "12px";
    confirmBtn.style.width = "100%";
    confirmBtn.textContent = "Add";
    confirmBtn.addEventListener("click", () => {
      const startH = parseInt(startSelect.value, 10);
      let endH = parseInt(endSelect.value, 10);
      if (endH <= startH) endH = startH + 1;
      draft.requirements.push({
        category: catSelect.value,
        coverageStart: startH,
        coverageEnd: endH
      });
      onAdd();
      popover.remove();
    });
    popover.appendChild(confirmBtn);
    const rect = anchor.getBoundingClientRect();
    popover.style.top = `${rect.bottom + 4}px`;
    popover.style.left = `${rect.left}px`;
    document.body.appendChild(popover);
    const closeMenu = (e) => {
      if (!popover.contains(e.target) && e.target !== anchor) {
        popover.remove();
        document.removeEventListener("mousedown", closeMenu);
      }
    };
    setTimeout(() => document.addEventListener("mousedown", closeMenu), 0);
  }

  // src/storage.ts
  var STORAGE_KEY = "library_scheduler_state";
  function saveStateToStorage(year, month, seed, showCsvSection, employees, overrides) {
    try {
      const stateObj = {
        year,
        month,
        seed,
        showCsvSection,
        // The Employee class properties are mostly primitive, we can serialize the instance directly,
        // but to reconstruct it properly we can just pass the deserialized objects back into the Employee constructor.
        // However, we should be careful to only save the init properties if possible, or just stringify the whole thing.
        // JSON.stringify will serialize all public properties. 
        employees: employees.map((e) => ({ ...e })),
        overrides: Array.from(overrides.entries())
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateObj));
      console.log("State saved to storage.");
    } catch (err) {
      console.error("Failed to save state to storage:", err);
    }
  }
  function loadStateFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      const employees = (data.employees || []).map((empData) => new Employee(empData));
      const overrides = new Map(data.overrides || []);
      return {
        year: data.year ?? 2026,
        month: data.month ?? 8,
        seed: data.seed ?? 12345,
        showCsvSection: data.showCsvSection ?? false,
        employees,
        overrides
      };
    } catch (err) {
      console.error("Failed to load state from storage:", err);
      return null;
    }
  }
  function clearStateStorage() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // src/ui/settings-modal.ts
  function showSettingsModal(currentState, onSave) {
    const overlay = document.createElement("div");
    overlay.className = "daily-modal-overlay";
    overlay.id = "settings-modal-overlay";
    const modal = document.createElement("div");
    modal.className = "daily-modal";
    modal.style.width = "400px";
    modal.style.maxWidth = "90vw";
    const header = document.createElement("div");
    header.className = "daily-modal-header";
    const titleBlock = document.createElement("div");
    titleBlock.className = "daily-title-block";
    const title = document.createElement("h2");
    title.className = "daily-modal-title";
    title.textContent = "Settings";
    titleBlock.appendChild(title);
    header.appendChild(titleBlock);
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "daily-modal-actions";
    const closeBtn = document.createElement("button");
    closeBtn.className = "btn btn--ghost daily-close-btn";
    closeBtn.innerHTML = "&times;";
    closeBtn.addEventListener("click", () => overlay.remove());
    actionsDiv.appendChild(closeBtn);
    header.appendChild(actionsDiv);
    modal.appendChild(header);
    const content = document.createElement("div");
    content.style.padding = "var(--sp-6)";
    content.style.display = "flex";
    content.style.flexDirection = "column";
    content.style.gap = "var(--sp-4)";
    const csvLabel = document.createElement("label");
    csvLabel.style.display = "flex";
    csvLabel.style.alignItems = "center";
    csvLabel.style.gap = "var(--sp-2)";
    csvLabel.style.cursor = "pointer";
    const csvCheck = document.createElement("input");
    csvCheck.type = "checkbox";
    csvCheck.checked = currentState.showCsvSection;
    csvCheck.addEventListener("change", () => {
      currentState.showCsvSection = csvCheck.checked;
      onSave(currentState);
    });
    csvLabel.appendChild(csvCheck);
    csvLabel.appendChild(document.createTextNode("Show CSV Upload Section"));
    content.appendChild(csvLabel);
    const divider1 = document.createElement("hr");
    divider1.style.border = "none";
    divider1.style.borderTop = "1px solid var(--col-border)";
    content.appendChild(divider1);
    const dlBtn = document.createElement("button");
    dlBtn.className = "btn btn--secondary";
    dlBtn.textContent = "\u2193 Download Memory Backup";
    dlBtn.addEventListener("click", () => {
      const backupStr = localStorage.getItem("library_scheduler_state");
      if (!backupStr) {
        alert("No saved state found in memory.");
        return;
      }
      const blob = new Blob([backupStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "library-scheduler-backup.json";
      a.click();
      URL.revokeObjectURL(url);
    });
    content.appendChild(dlBtn);
    const ulLabel = document.createElement("label");
    ulLabel.className = "btn btn--secondary";
    ulLabel.style.textAlign = "center";
    ulLabel.textContent = "\u2191 Upload / Restore Backup";
    const ulInput = document.createElement("input");
    ulInput.type = "file";
    ulInput.accept = ".json,application/json";
    ulInput.style.display = "none";
    ulInput.addEventListener("change", async () => {
      const file = ulInput.files?.[0];
      if (!file) return;
      try {
        const txt = await file.text();
        const data = JSON.parse(txt);
        if (typeof data === "object" && data !== null) {
          localStorage.setItem("library_scheduler_state", txt);
          alert("Backup restored! The page will now reload.");
          location.reload();
        } else {
          alert("Invalid backup file format.");
        }
      } catch (e) {
        alert("Failed to read or parse backup file.");
      }
    });
    ulLabel.appendChild(ulInput);
    content.appendChild(ulLabel);
    const divider2 = document.createElement("hr");
    divider2.style.border = "none";
    divider2.style.borderTop = "1px solid var(--col-border)";
    content.appendChild(divider2);
    const resetBtn = document.createElement("button");
    resetBtn.className = "btn btn--primary";
    resetBtn.style.background = "var(--col-danger)";
    resetBtn.style.borderColor = "var(--col-danger)";
    resetBtn.textContent = "\u26A0 Reset Memory to Defaults";
    resetBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to completely wipe your browser storage? This will delete all rosters and shift edits, reverting to the default demo.")) {
        clearStateStorage();
        location.reload();
      }
    });
    content.appendChild(resetBtn);
    modal.appendChild(content);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  // src/ui/app.ts
  function initApp() {
    const saved = loadStateFromStorage();
    const state = {
      year: saved ? saved.year : 2026,
      month: saved ? saved.month : 8,
      // September = index 8
      seed: saved ? saved.seed : 12345,
      showCsvSection: saved ? saved.showCsvSection : false,
      employees: saved ? saved.employees : getDemoEmployees(),
      overrides: saved ? saved.overrides : buildDemoOverrides(),
      schedule: null,
      weeklyHoursMap: /* @__PURE__ */ new Map(),
      dailySchedules: /* @__PURE__ */ new Map()
    };
    const save = () => {
      saveStateToStorage(state.year, state.month, state.seed, state.showCsvSection, state.employees, state.overrides);
    };
    const yearInput = getEl("year-input");
    const monthSelect = getEl("month-select");
    const seedInput = getEl("seed-input");
    const generateBtn = getEl("generate-btn");
    const editShiftsBtn = getEl("edit-shifts-btn");
    const settingsBtn = getEl("settings-btn");
    const shiftsFileInput = getEl("shifts-file");
    const empFileInput = getEl("employees-file");
    const csvSection = getEl("csv-section");
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
      if (m === state.month) opt.selected = true;
      monthSelect.appendChild(opt);
    }
    yearInput.value = String(state.year);
    seedInput.value = String(state.seed);
    csvSection.style.display = state.showCsvSection ? "block" : "none";
    yearInput.addEventListener("change", () => {
      state.year = parseInt(yearInput.value, 10) || 2026;
      state.dailySchedules.clear();
      save();
    });
    monthSelect.addEventListener("change", () => {
      state.month = parseInt(monthSelect.value, 10);
      state.dailySchedules.clear();
      save();
    });
    seedInput.addEventListener("change", () => {
      state.seed = parseInt(seedInput.value, 10) || 12345;
      state.dailySchedules.clear();
      save();
    });
    shiftsFileInput.addEventListener("change", async () => {
      const file = shiftsFileInput.files?.[0];
      if (!file) return;
      shiftsFilename.textContent = file.name;
      try {
        const raw = await file.text();
        const parsed = parseShiftsCSV(raw);
        state.overrides = parsed;
        save();
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
          save();
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
    editShiftsBtn.addEventListener("click", () => {
      showShiftEditor(state, (newOverrides) => {
        state.overrides = newOverrides;
        state.dailySchedules.clear();
        save();
        runAndRender(state, calContainer, summaryEl, statusEl);
      });
    });
    settingsBtn.addEventListener("click", () => {
      showSettingsModal(state, (newState) => {
        state.showCsvSection = newState.showCsvSection;
        csvSection.style.display = state.showCsvSection ? "block" : "none";
        save();
      });
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
        const dateStr = toDateStr4(day.date);
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
      const ctx = {
        year: state.year,
        month: state.month,
        onEditRoster: () => {
          showRosterEditor(state.employees, (emps) => {
            state.employees = emps;
            state.dailySchedules.clear();
            saveStateToStorage(state.year, state.month, state.seed, state.showCsvSection, state.employees, state.overrides);
            runAndRender(state, calEl, summaryEl, statusEl);
          });
        }
      };
      renderSummary(summaryRows, summaryEl, totalWeeks, ctx);
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
  function toDateStr4(date) {
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
