(function () {
  "use strict";

  var SAVE_KEY = "shakai_quest_save_v1";
  var currentData = null;

  function nodeIds() {
    return Object.keys(window.NODES_DATA || {});
  }

  function emptyProgress(unlocked) {
    return { unlocked: !!unlocked, basicClear: false, advancedClear: false, extraClear: false, branchChosen: null };
  }

  function findNodeByLineOrder(lineId, order) {
    return nodeIds().find(function (id) {
      var node = window.NODES_DATA[id];
      return node.lineId === lineId && node.order === order;
    }) || null;
  }

  function hasQuestionBank(nodeId) {
    return !!(window.QUESTION_BANK && window.QUESTION_BANK[nodeId]);
  }

  function prerequisiteId(node) {
    if (!node) return null;
    if (node.lineId === "s6_rek" && node.order === 1) return "s6_sei03";
    if (node.lineId === "s6_kok" && node.order === 1) return "s6_rek12";
    if (node.order > 1) return findNodeByLineOrder(node.lineId, node.order - 1);
    return null;
  }

  function canDemoBypass(nodeId, data) {
    var node = window.NODES_DATA[nodeId];
    if (!hasQuestionBank(nodeId) || !node) return false;
    var prereq = prerequisiteId(node);
    if (!prereq) return true;
    var progress = (data && data.progress && data.progress[prereq]) || emptyProgress(false);
    return !progress.basicClear && !hasQuestionBank(prereq);
  }

  function getDefault() {
    var progress = {};
    nodeIds().forEach(function (id) {
      var node = window.NODES_DATA[id];
      var firstRoute = node.order === 1 && (node.lineId.indexOf("s5_") === 0 || node.lineId === "s6_sei");
      progress[id] = emptyProgress(firstRoute);
    });
    return {
      player: { name: "旅人", level: 1, exp: 0, title: "見習い探検者" },
      owned: { meibutsu: [], ijin: [], chara: [], items: [], kakeraCount: 0, commonItems: {} },
      progress: progress,
      settings: { ruby: true, sound: true }
    };
  }

  function isNodeUnlocked(nodeId, dataArg) {
    var next = dataArg || currentData || getDefault();
    var node = window.NODES_DATA[nodeId];
    if (!node) return false;
    if (node.lineId.indexOf("s5_") === 0 || node.lineId === "s6_sei") {
      if (node.order === 1) return true;
      var prev = findNodeByLineOrder(node.lineId, node.order - 1);
      var prevClear = !!(prev && next.progress && next.progress[prev] && next.progress[prev].basicClear);
      return prevClear || canDemoBypass(nodeId, next);
    }
    if (node.lineId === "s6_rek") {
      if (node.order === 1) return !!(next.progress.s6_sei03 && next.progress.s6_sei03.basicClear) || canDemoBypass(nodeId, next);
      var prevRek = findNodeByLineOrder("s6_rek", node.order - 1);
      return !!(prevRek && next.progress[prevRek] && next.progress[prevRek].basicClear) || canDemoBypass(nodeId, next);
    }
    if (node.lineId === "s6_kok") {
      if (node.order === 1) return !!(next.progress.s6_rek12 && next.progress.s6_rek12.basicClear) || canDemoBypass(nodeId, next);
      var prevKok = findNodeByLineOrder("s6_kok", node.order - 1);
      return !!(prevKok && next.progress[prevKok] && next.progress[prevKok].basicClear) || canDemoBypass(nodeId, next);
    }
    return false;
  }

  function normalize(data) {
    var base = getDefault();
    var src = data && typeof data === "object" ? data : {};
    base.player = Object.assign(base.player, src.player || {});
    base.player.exp = Number(base.player.exp) || 0;
    base.player.level = Math.floor(base.player.exp / 100) + 1;
    base.owned = Object.assign(base.owned, src.owned || {});
    ["meibutsu", "ijin", "chara", "items"].forEach(function (key) {
      base.owned[key] = Array.isArray(base.owned[key]) ? Array.from(new Set(base.owned[key])) : [];
    });
    base.owned.kakeraCount = Number(base.owned.kakeraCount) || 0;
    base.owned.commonItems = base.owned.commonItems && typeof base.owned.commonItems === "object" ? base.owned.commonItems : {};
    base.settings = Object.assign(base.settings, src.settings || {});
    nodeIds().forEach(function (id) {
      base.progress[id] = Object.assign(base.progress[id], (src.progress && src.progress[id]) || {});
      base.progress[id].unlocked = isNodeUnlocked(id, base);
      base.progress[id].branchChosen = base.progress[id].branchChosen || null;
    });
    return base;
  }

  function notify() {
    window.dispatchEvent(new CustomEvent("shakai:save", { detail: currentData }));
  }

  function load() {
    try {
      currentData = normalize(JSON.parse(localStorage.getItem(SAVE_KEY) || "null"));
    } catch (err) {
      currentData = normalize(null);
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(currentData));
    return currentData;
  }

  function save(data) {
    currentData = normalize(data || currentData || getDefault());
    localStorage.setItem(SAVE_KEY, JSON.stringify(currentData));
    notify();
    return currentData;
  }

  function data() {
    return currentData || load();
  }

  function addKakera(n) {
    var next = data();
    next.owned.kakeraCount += Math.max(0, Number(n) || 0);
    return save(next);
  }

  function addExp(n) {
    var next = data();
    next.player.exp += Math.max(0, Number(n) || 0);
    next.player.level = Math.floor(next.player.exp / 100) + 1;
    return save(next);
  }

  function addCommonItem(kakeraId) {
    if (!kakeraId) return data();
    var next = data();
    next.owned.commonItems[kakeraId] = (Number(next.owned.commonItems[kakeraId]) || 0) + 1;
    return save(next);
  }

  function grantCollectible(type, id) {
    var next = data();
    var key = type === "item" ? "items" : type;
    if (!next.owned[key] || !id) return next;
    if (next.owned[key].indexOf(id) === -1) {
      next.owned[key].push(id);
      save(next);
    }
    return next;
  }

  function getNodeProgress(nodeId) {
    var next = data();
    if (!next.progress[nodeId]) {
      next.progress[nodeId] = emptyProgress(false);
      save(next);
    }
    return next.progress[nodeId];
  }

  function setNodeProgress(nodeId, patch) {
    var next = data();
    next.progress[nodeId] = Object.assign(emptyProgress(false), next.progress[nodeId] || {}, patch || {});
    return save(next).progress[nodeId];
  }

  function chooseBranch(nodeId, branchId) {
    var node = window.NODES_DATA[nodeId];
    if (!node || !node.branch) return null;
    var exists = node.branch.options.some(function (opt) { return opt.branchId === branchId; });
    if (!exists) return null;
    return setNodeProgress(nodeId, { branchChosen: branchId });
  }

  function reset() {
    localStorage.removeItem(SAVE_KEY);
    return save(getDefault());
  }

  window.SaveManager = {
    key: SAVE_KEY,
    load: load,
    save: save,
    data: data,
    getDefault: getDefault,
    addKakera: addKakera,
    addExp: addExp,
    addCommonItem: addCommonItem,
    grantCollectible: grantCollectible,
    getNodeProgress: getNodeProgress,
    setNodeProgress: setNodeProgress,
    chooseBranch: chooseBranch,
    isNodeUnlocked: isNodeUnlocked,
    hasQuestionBank: hasQuestionBank,
    reset: reset
  };
}());
