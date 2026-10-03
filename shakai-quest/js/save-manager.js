(function () {
  "use strict";
  var SAVE_KEY = "shakai_quest_save_v1", SCHEMA = 2;
  var currentData = null, protectedRaw = null, warning = "";
  function ids() { return Object.keys(window.NODES_DATA || {}); }
  function stats() { return { correct: 0, total: 0, lastAttemptAt: null }; }
  function middleProgress() { return { completed: false, perfect: false, bestCorrect: 0, stats: stats(), seenQuestionIds: [], masteredQuestionIds: [] }; }
  function progress() {
    return { unlocked: false, basicClear: false, advancedClear: false, extraClear: false, extraPerfectClear: false,
      branchChosen: null, basicStats: stats(), advancedStats: stats(), extraStats: stats(), seenQuestionIds: [], masteredQuestionIds: [], branches: {} };
  }
  function getDefault() {
    var p = {}, middle = {};
    Object.keys(window.MIDDLE_COURSES || {}).forEach(function (id) {
      middle[id] = middleProgress(); middle[id].levels = { applied: middleProgress(), hard: middleProgress() };
    });
    ids().forEach(function (id) {
      p[id] = progress();
      var node = window.NODES_DATA[id];
      p[id].unlocked = node.order === 1;
      if (node.branch) node.branch.options.forEach(function (b) { p[id].branches[b.branchId] = progress(); });
    });
    return { schema: SCHEMA, player: { name: "旅人", level: 1, exp: 0, title: "見習い探検者", equipped: { sword: null, shield: null, armor: null, gauntlet: null } },
      owned: { meibutsu: [], ijin: [], chara: [], companions: [], items: [], achievements: [], equipment: [], monsters: [], clearedMonsters: [], kakeraCount: 0, commonItems: {}, consumables: { potion: 2, hint: 1 } },
      progress: p, middleProgress: middle, practiceProgress: {}, writtenRecords: {}, questionStats: {}, questionBags: {}, encounterBags: {}, activeSession: null, activeCompanions: [], rewardedSessions: [],
      settings: { ruby: true, sound: false, motion: true, lastGrade: 5 }, meta: { lastPlayedAt: null } };
  }
  function number(value, fallback) { return Number.isFinite(Number(value)) && Number(value) >= 0 ? Math.floor(Number(value)) : fallback; }
  function unique(value) { return Array.isArray(value) ? Array.from(new Set(value.filter(function (id) { return typeof id === "string"; }))) : []; }
  function object(value) { return value && typeof value === "object" && !Array.isArray(value); }
  function date(value) { return typeof value === "string" && Number.isFinite(Date.parse(value)) ? value : null; }
  function normalizeStats(value) {
    value = object(value) ? value : {};
    var total = number(value.total, 0);
    return { correct: Math.min(total, number(value.correct, 0)), total: total, lastAttemptAt: date(value.lastAttemptAt) };
  }
  function normalizeProgress(value) {
    var p = Object.assign(progress(), object(value) ? value : {});
    ["basicClear", "advancedClear", "extraClear", "extraPerfectClear"].forEach(function (k) { p[k] = p[k] === true; });
    ["basic", "advanced", "extra"].forEach(function (k) { p[k + "Stats"] = normalizeStats(p[k + "Stats"]); });
    p.seenQuestionIds = unique(p.seenQuestionIds); p.masteredQuestionIds = unique(p.masteredQuestionIds);
    p.branches = object(p.branches) ? p.branches : {};
    return p;
  }
  function normalize(src) {
    var base = getDefault();
    base.player = Object.assign(base.player, src.player || {});
    base.player.exp = number(base.player.exp, 0); base.player.level = Math.floor(base.player.exp / 100) + 1;
    base.player.name = typeof base.player.name === "string" ? base.player.name.slice(0, 30) : "旅人";
    base.player.equipped = Object.assign(getDefault().player.equipped, object(src.player && src.player.equipped) ? src.player.equipped : {});
    base.owned = Object.assign(base.owned, src.owned || {});
    ["meibutsu", "ijin", "chara", "companions", "items", "achievements", "equipment", "monsters", "clearedMonsters"].forEach(function (k) { base.owned[k] = unique(base.owned[k]); });
    base.owned.kakeraCount = number(base.owned.kakeraCount, 0);
    base.owned.commonItems = object(base.owned.commonItems) ? base.owned.commonItems : {};
    Object.keys(base.owned.commonItems).forEach(function (k) { base.owned.commonItems[k] = number(base.owned.commonItems[k], 0); });
    // A consumed item stays at zero; starter supplies only apply when an old save lacks this field.
    base.owned.consumables = object(src.owned && src.owned.consumables) ? { potion: number(src.owned.consumables.potion, 0), hint: number(src.owned.consumables.hint, 0) } : base.owned.consumables;
    base.settings = Object.assign(base.settings, src.settings || {});
    base.settings.lastGrade = [3, 4, 5, 6].includes(Number(base.settings.lastGrade)) ? Number(base.settings.lastGrade) : 5;
    base.meta = Object.assign(base.meta, src.meta || {}); base.meta.lastPlayedAt = date(base.meta.lastPlayedAt);
    Object.keys(window.MIDDLE_COURSES || {}).forEach(function (id) {
      var old = object(src.middleProgress) && object(src.middleProgress[id]) ? src.middleProgress[id] : {};
      Object.keys(window.MiddleCourses.difficulties).forEach(function (difficulty) {
        var value = difficulty === "standard" ? old : object(old.levels) && object(old.levels[difficulty]) ? old.levels[difficulty] : {};
        var knownIds = window.MiddleCourses.bank(id, difficulty).map(function (q) { return q.id; });
        var normalized = { completed: value.completed === true, perfect: value.perfect === true,
          bestCorrect: Math.min(knownIds.length, number(value.bestCorrect, 0)), stats: normalizeStats(value.stats),
          seenQuestionIds: unique(value.seenQuestionIds).filter(function (q) { return knownIds.includes(q); }),
          masteredQuestionIds: unique(value.masteredQuestionIds).filter(function (q) { return knownIds.includes(q); }) };
        if (difficulty === "standard") base.middleProgress[id] = Object.assign(normalized, { levels: base.middleProgress[id].levels });
        else base.middleProgress[id].levels[difficulty] = normalized;
      });
    });
    Object.keys(window.MIDDLE_REVIEW_BANK).forEach(function (reason) {
      var old = object(src.practiceProgress) && object(src.practiceProgress[reason]) ? src.practiceProgress[reason] : {};
      var known = window.MiddleCourses.practiceBank(reason).map(function (q) { return q.id; });
      base.practiceProgress[reason] = { stats: normalizeStats(old.stats),
        seenQuestionIds: unique(old.seenQuestionIds).filter(function (id) { return known.includes(id); }),
        masteredQuestionIds: unique(old.masteredQuestionIds).filter(function (id) { return known.includes(id); }) };
    });
    Object.keys(window.MIDDLE_WRITTEN).forEach(function (id) {
      var value = object(src.writtenRecords) && src.writtenRecords[id], q = window.MIDDLE_WRITTEN[id];
      if (!object(value) || typeof value.response !== "string" || !value.response.trim() || !date(value.assessedAt) ||
        !Array.isArray(value.ratings) || value.ratings.length !== q.rubric.length || !value.ratings.every(function (r) { return [0, 1, 2].includes(r); })) return;
      base.writtenRecords[id] = { response: value.response.slice(0, 2000), ratings: value.ratings.slice(), assessedAt: date(value.assessedAt),
        attempts: Math.max(1, number(value.attempts, 1)), contentVersion: number(value.contentVersion, 1), sessionId: typeof value.sessionId === "string" ? value.sessionId : null };
    });
    ids().forEach(function (id) {
      var p = normalizeProgress(src.progress && src.progress[id]), node = window.NODES_DATA[id];
      if (node.branch) {
        node.branch.options.forEach(function (b) {
          p.branches[b.branchId] = normalizeProgress(p.branches[b.branchId] || (p.branchChosen === b.branchId ? Object.assign({}, p, { branches: {} }) : {}));
          p.branches[b.branchId].branches = {};
        });
        if (!node.branch.options.some(function (b) { return b.branchId === p.branchChosen; })) p.branchChosen = null;
      }
      base.progress[id] = p;
    });
    base.questionStats = {};
    Object.keys(object(src.questionStats) ? src.questionStats : {}).forEach(function (id) {
      var value = object(src.questionStats[id]) ? src.questionStats[id] : {}, attempts = number(value.attempts, 0);
      base.questionStats[id] = { attempts: attempts, correct: Math.min(attempts, number(value.correct, 0)), hints: number(value.hints, 0),
        reviews: Math.min(attempts, number(value.reviews, 0)), lastCorrect: value.lastCorrect === true, lastAttemptAt: date(value.lastAttemptAt), contentVersion: number(value.contentVersion, 1),
        lastMistake: Object.prototype.hasOwnProperty.call(window.MiddleCourses.mistakeLabels, value.lastMistake) ? value.lastMistake : null };
    });
    ["questionBags", "encounterBags"].forEach(function (k) {
      base[k] = {}; Object.keys(object(src[k]) ? src[k] : {}).forEach(function (key) { base[k][key] = unique(src[k][key]); });
    });
    base.activeSession = object(src.activeSession) ? src.activeSession : null;
    base.activeCompanions = unique(src.activeCompanions).filter(function (id) { return window.COMPANION_DATA[id] && (base.owned.chara.includes(id) || base.owned.companions.includes(id)); }).slice(0, 2);
    base.rewardedSessions = unique(src.rewardedSessions);
    if (window.SocialRPG) {
      base.owned.items.forEach(function (id) { if (window.EQUIPMENT_DATA[id] && !base.owned.equipment.includes(id)) base.owned.equipment.push(id); });
      Object.keys(base.player.equipped).forEach(function (slot) {
        var id = base.player.equipped[slot], eq = window.EQUIPMENT_DATA[id];
        if (!eq || eq.slot !== slot || !base.owned.equipment.includes(id)) base.player.equipped[slot] = null;
      });
    }
    ids().forEach(function (id) { base.progress[id].unlocked = isNodeUnlocked(id, base); });
    return base;
  }
  function validate(src) {
    if (!object(src) || !object(src.player) || !object(src.owned) || !object(src.progress)) throw new Error("セーブの形式を確認できません。元データを保護しています。");
    if (src.schema !== undefined && src.schema !== 1 && src.schema !== SCHEMA) throw new Error("この版では読めないセーブです。元データを保護しています。");
    ["meibutsu", "ijin", "chara", "items"].forEach(function (key) { if (!Array.isArray(src.owned[key])) throw new Error("所持品のデータが壊れています。元データを保護しています。"); });
    if (!Number.isFinite(Number(src.player.exp)) || Number(src.player.exp) < 0) throw new Error("経験値のデータを確認できません。");
    return src;
  }
  function notify(name) { window.dispatchEvent(new CustomEvent(name || "shakai:save", { detail: name ? warning : currentData })); }
  function write() {
    if (protectedRaw !== null) return false;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(currentData)); warning = ""; return true; }
    catch (err) { warning = "保存できませんでした。設定から学習記録を書き出してください。"; notify("shakai:save-error"); return false; }
  }
  function load() {
    var raw = null;
    try {
      raw = localStorage.getItem(SAVE_KEY);
      currentData = raw === null ? getDefault() : normalize(validate(JSON.parse(raw)));
      write();
    } catch (err) { protectedRaw = raw === null ? "" : raw; warning = err.message || "セーブを読めませんでした。"; currentData = getDefault(); }
    ids().forEach(function (id) { currentData.progress[id].unlocked = isNodeUnlocked(id, currentData); });
    return currentData;
  }
  function save(next) {
    currentData = next || currentData || getDefault();
    currentData.player.exp = number(currentData.player.exp, 0); currentData.player.level = Math.floor(currentData.player.exp / 100) + 1;
    ids().forEach(function (id) { currentData.progress[id].unlocked = isNodeUnlocked(id, currentData); });
    write(); notify(); return currentData;
  }
  function data() { return currentData || load(); }
  function transaction(fn) { var result = fn(data()); save(); return result; }
  function isNodeUnlocked(id, arg) {
    var s = arg || data(), node = window.NODES_DATA[id];
    if (!node) return false;
    if (node.order === 1) return true;
    var previous = ids().find(function (k) { var n = window.NODES_DATA[k]; return n.lineId === node.lineId && n.order === node.order - 1; });
    return !!(previous && s.progress[previous] && s.progress[previous].basicClear);
  }
  function getNodeProgress(id) { return data().progress[id]; }
  function routeProgress(id, branch) { var p = getNodeProgress(id); return branch && p.branches[branch] ? p.branches[branch] : p; }
  function getMiddleProgress(id, difficulty) {
    var s = data(), p = s.middleProgress[id];
    if (!Object.prototype.hasOwnProperty.call(s.middleProgress, id) || !p || (difficulty && !Object.prototype.hasOwnProperty.call(window.MiddleCourses.difficulties, difficulty))) return null;
    return window.MiddleCourses.progressFor(id, difficulty, s);
  }
  function setNodeProgress(id, patch, branch) {
    var p = routeProgress(id, branch); Object.assign(p, patch);
    if (branch) ["basicClear", "advancedClear", "extraClear", "extraPerfectClear"].forEach(function (key) {
      getNodeProgress(id)[key] = Object.values(getNodeProgress(id).branches).some(function (b) { return b[key]; });
    });
    save(); return p;
  }
  function chooseBranch(id, branch) {
    var node = window.NODES_DATA[id];
    if (!node || !node.branch || !node.branch.options.some(function (b) { return b.branchId === branch; })) return null;
    getNodeProgress(id).branchChosen = branch; save(); return routeProgress(id, branch);
  }
  function grantCollectible(type, id) {
    var list = data().owned[type === "item" ? "items" : type];
    if (list && id && !list.includes(id)) { list.push(id); save(); }
    return data();
  }
  function recordAnswer(id, tier, correct, stamp) {
    var p = routeProgress(id, data().progress[id].branchChosen), s = p[tier + "Stats"];
    s.total++; if (correct) s.correct++; s.lastAttemptAt = stamp || new Date().toISOString();
    if (p !== data().progress[id]) { var a = data().progress[id][tier + "Stats"]; a.total++; if (correct) a.correct++; a.lastAttemptAt = s.lastAttemptAt; }
    data().meta.lastPlayedAt = s.lastAttemptAt; save(); return s;
  }
  function reset() { protectedRaw = null; warning = ""; currentData = getDefault(); return save(); }
  function importJSON(raw) { var migrated = normalize(validate(JSON.parse(raw))); protectedRaw = null; warning = ""; currentData = migrated; save(); return currentData; }
  window.SaveManager = {
    key: SAVE_KEY, schema: SCHEMA, load: load, save: save, data: data, getDefault: getDefault, transaction: transaction,
    getNodeProgress: getNodeProgress, routeProgress: routeProgress, setNodeProgress: setNodeProgress, chooseBranch: chooseBranch, isNodeUnlocked: isNodeUnlocked,
    getMiddleProgress: getMiddleProgress,
    getPracticeProgress: function (reason) {
      if (!window.MiddleCourses.practiceCourse(reason)) return null;
      var s = data();
      if (!Object.prototype.hasOwnProperty.call(s.practiceProgress, reason)) s.practiceProgress[reason] = { stats: stats(), seenQuestionIds: [], masteredQuestionIds: [] };
      return s.practiceProgress[reason];
    },
    hasQuestionBank: function (id) { return !!window.QUESTION_BANK[id]; }, grantCollectible: grantCollectible, recordAnswer: recordAnswer,
    addKakera: function (n) { data().owned.kakeraCount += number(n, 0); return save(); },
    addExp: function (n) { data().player.exp += number(n, 0); return save(); },
    addCommonItem: function (id) { var p = data().owned.commonItems; p[id] = number(p[id], 0) + 1; return save(); },
    touchLastPlayed: function (stamp) { data().meta.lastPlayedAt = stamp || new Date().toISOString(); return save(); },
    exportJSON: function () { return protectedRaw !== null ? protectedRaw : JSON.stringify(data(), null, 2); },
    importJSON: importJSON, reset: reset, status: function () { return { protected: protectedRaw !== null, warning: warning }; }
  };
}());
