(function () {
  "use strict";
  function give(s, category, id, result) {
    if (!id || s.owned[category].includes(id)) return;
    s.owned[category].push(id);
    var datasets = { meibutsu: window.MEIBUTSU_DATA, ijin: window.IJIN_DATA, chara: window.CHARA_DATA, companions: window.COMPANION_DATA, items: window.ITEM_DATA, equipment: window.EQUIPMENT_DATA };
    result.push((datasets[category][id] || {}).name || id);
  }
  function complete(session) {
    return window.SaveManager.transaction(function (s) {
      if (s.rewardedSessions.includes(session.id)) return session.result || { rewards: [], success: false };
      var node = window.NODES_DATA[session.nodeId], p = window.SaveManager.routeProgress(session.nodeId, session.branchId);
      var bank = window.SocialQuestions.bank(session.nodeId, session.branchId, "basic");
      var mastery = bank.filter(function (q) { return p.masteredQuestionIds.includes(q.id); }).length;
      var mastered = bank.every(function (q) { return p.seenQuestionIds.includes(q.id); }) && mastery >= (session.mode === "challenge" ? Math.ceil(bank.length * .8) : bank.length);
      var accuracy = session.firstCorrect / session.initialCount;
      var success = session.mode === "learn" ? session.pending.length === 0 : session.lives > 0 && accuracy >= .8;
      var perfect = success && session.firstCorrect === session.initialCount && !session.usedHint;
      var result = { success: success, perfect: perfect, mastery: mastery, bankSize: bank.length, firstCorrect: session.firstCorrect, total: session.initialCount, rewards: [], completed: false };
      // Middle-school enrichment never clears an elementary tier or grants its completion reward.
      if (session.options.middleCourse && !session.options.review) {
        var middle = window.SaveManager.getMiddleProgress(session.options.middleCourse);
        middle.bestCorrect = Math.max(middle.bestCorrect, session.firstCorrect);
        if (success) {
          var alreadyComplete = middle.completed;
          middle.completed = true; if (perfect) middle.perfect = true; result.completed = true;
          var middleExp = alreadyComplete ? 20 : 80;
          s.player.exp += middleExp; result.rewards.push(middleExp + " EXP");
        }
      } else if (!session.options.middleCourse && !session.options.review && success) {
        var wasCleared = p[session.tier + "Clear"], patch = {};
        if (session.tier !== "basic" || mastered) { patch[session.tier + "Clear"] = true; result.completed = true; }
        if (session.tier === "extra" && perfect && session.initialCount === 15) patch.extraPerfectClear = true;
        Object.assign(p, patch);
        if (session.branchId) ["basicClear", "advancedClear", "extraClear", "extraPerfectClear"].forEach(function (key) {
          s.progress[session.nodeId][key] = Object.values(s.progress[session.nodeId].branches).some(function (b) { return b[key]; });
        });
        var branch = node.branch && node.branch.options.find(function (b) { return b.branchId === session.branchId; });
        var meibutsu = branch ? branch.meibutsuIds : node.meibutsuIds;
        if (session.tier === "basic" && mastered) give(s, "meibutsu", (meibutsu || []).find(function (id) { return !s.owned.meibutsu.includes(id); }), result.rewards);
        if (session.tier === "advanced") {
          if (node.challengeStyle === "kikitori" || session.nodeId === "s6_rek12") {
            give(s, "meibutsu", (node.meibutsuIds || []).find(function (id) { return !s.owned.meibutsu.includes(id); }), result.rewards);
          }
          if (node.ijinId) give(s, "ijin", node.ijinId, result.rewards);
          var charaId = branch ? branch.charaId : node.charaId || (session.nodeId === "s6_rek12" ? "c_kenpoukun" : null);
          give(s, "chara", charaId, result.rewards);
          if (node.challengeStyle !== "kikitori") give(s, "companions", session.nodeId + "_advanced", result.rewards);
          if (perfect) {
            var normal = Object.keys(window.EQUIPMENT_DATA).find(function (id) { var e = window.EQUIPMENT_DATA[id]; return e.lineId === node.lineId && e.rarity === "normal" && !s.owned.equipment.includes(id); });
            give(s, "equipment", normal, result.rewards);
          }
        }
        if (session.tier === "extra" && perfect && session.initialCount === 15) {
          give(s, "equipment", "rare_" + session.nodeId, result.rewards);
          Object.keys(window.ITEM_DATA).filter(function (id) { return window.ITEM_DATA[id].nodeId === session.nodeId; }).forEach(function (id) {
            give(s, "items", id, result.rewards);
            if (!s.owned.equipment.includes(id)) s.owned.equipment.push(id);
          });
        }
        var exp = Math.round((wasCleared ? 20 : session.tier === "advanced" ? 100 : 50) * (1 + (session.effects.expBoostBig || 0) + (session.effects.expRate || 0)));
        s.player.exp += exp; result.rewards.push(exp + " EXP");
      }
      s.rewardedSessions.push(session.id); session.result = result; session.finished = true; s.activeSession = session;
      return result;
    });
  }
  window.SocialRewards = { complete: complete };
}());
