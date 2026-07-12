(function () {
  "use strict";

  var DEFAULT_TITLE = "見習い探検者";

  function dataSet() {
    return window.ACHIEVEMENT_DATA || {};
  }

  function nodeIds() {
    return Object.keys(window.NODES_DATA || {});
  }

  function nodesForLine(lineId) {
    return nodeIds().filter(function (nodeId) {
      return window.NODES_DATA[nodeId].lineId === lineId;
    });
  }

  function lineBasicClear(save, lineId) {
    var ids = nodesForLine(lineId);
    return ids.length > 0 && ids.every(function (nodeId) {
      return !!(save.progress[nodeId] && save.progress[nodeId].basicClear);
    });
  }

  function collectionSource(category) {
    if (category === "meibutsu") return window.MEIBUTSU_DATA || {};
    if (category === "ijin") return window.IJIN_DATA || {};
    if (category === "chara") return window.CHARA_DATA || {};
    if (category === "items" || category === "item") return window.ITEM_DATA || {};
    return {};
  }

  function ownedKey(category) {
    return category === "item" ? "items" : category;
  }

  function collectionComplete(save, category) {
    var ids = Object.keys(collectionSource(category));
    var owned = save.owned[ownedKey(category)] || [];
    return ids.length > 0 && ids.every(function (id) { return owned.indexOf(id) !== -1; });
  }

  function extraPerfectCount(save) {
    return nodeIds().filter(function (nodeId) {
      return !!(save.progress[nodeId] && save.progress[nodeId].extraPerfectClear);
    }).length;
  }

  function conditionMet(save, condition) {
    if (!condition) return false;
    if (condition.type === "line_basic_clear") return lineBasicClear(save, condition.lineId);
    if (condition.type === "lines_basic_clear") {
      return (condition.lineIds || []).every(function (lineId) { return lineBasicClear(save, lineId); });
    }
    if (condition.type === "all_basic_clear") {
      return nodeIds().length > 0 && nodeIds().every(function (nodeId) {
        return !!(save.progress[nodeId] && save.progress[nodeId].basicClear);
      });
    }
    if (condition.type === "collection_complete") return collectionComplete(save, condition.category);
    if (condition.type === "extra_perfect_count") return extraPerfectCount(save) >= Number(condition.count || 0);
    if (condition.type === "kakera_count") return Number(save.owned.kakeraCount) >= Number(condition.count || 0);
    return false;
  }

  function sortByPriority(ids) {
    var achievements = dataSet();
    return ids.slice().sort(function (a, b) {
      return (Number(achievements[a].priority) || 0) - (Number(achievements[b].priority) || 0);
    });
  }

  function syncTitle(save) {
    var achievements = dataSet();
    var best = null;
    (save.owned.achievements || []).forEach(function (id) {
      var achievement = achievements[id];
      if (!achievement || !achievement.title) return;
      if (!best || (Number(achievement.priority) || 0) >= (Number(best.priority) || 0)) best = achievement;
    });
    save.player.title = best ? best.title : DEFAULT_TITLE;
    return save.player.title;
  }

  function checkAchievements(showNotification) {
    var save = window.SaveManager.data();
    var achievements = dataSet();
    save.owned.achievements = Array.isArray(save.owned.achievements) ? save.owned.achievements : [];
    var unlocked = Object.keys(achievements).filter(function (id) {
      return save.owned.achievements.indexOf(id) === -1 && conditionMet(save, achievements[id].condition);
    });
    if (!unlocked.length) {
      syncTitle(save);
      window.SaveManager.save(save);
      return [];
    }

    unlocked = sortByPriority(unlocked);
    unlocked.forEach(function (id) { save.owned.achievements.push(id); });
    syncTitle(save);
    window.SaveManager.save(save);

    if (showNotification) {
      window.dispatchEvent(new CustomEvent("shakai:achievement", {
        detail: unlocked.map(function (id) {
          return Object.assign({ achievementId: id }, achievements[id]);
        })
      }));
    }
    return unlocked;
  }

  function getOwnedList() {
    var save = window.SaveManager.data();
    return (save.owned.achievements || []).slice();
  }

  window.AchievementManager = {
    checkAchievements: checkAchievements,
    conditionMet: conditionMet,
    syncTitle: syncTitle,
    getOwnedList: getOwnedList,
    lineBasicClear: lineBasicClear,
    collectionComplete: collectionComplete,
    extraPerfectCount: extraPerfectCount
  };
}());
