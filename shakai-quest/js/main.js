(function () {
  "use strict";

  var roots = {};
  var achievementQueue = [];
  var achievementShowing = false;

  function $(selector) {
    return document.querySelector(selector);
  }

  function showScreen(name) {
    document.querySelectorAll(".screen").forEach(function (screen) {
      screen.classList.toggle("active", screen.id === "screen-" + name);
    });
  }

  function setActiveTab(tabName) {
    document.querySelectorAll(".tab").forEach(function (tab) {
      tab.classList.toggle("active", tab.dataset.tab === tabName);
    });
  }

  function updateHud() {
    var save = window.SaveManager.data();
    $("#player-title").textContent = save.player.title || "見習い探検者";
    $("#player-level").textContent = save.player.level;
    $("#player-exp").textContent = save.player.exp;
    $("#kakera-count").textContent = save.owned.kakeraCount;
  }

  function toast(message) {
    var root = $("#toast-root");
    var el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    root.appendChild(el);
    window.setTimeout(function () {
      el.style.opacity = "0";
      el.style.transform = "translateY(6px)";
    }, 2200);
    window.setTimeout(function () { el.remove(); }, 2800);
  }

  function achievementBadge() {
    return [
      '<svg class="achievement-modal-badge" viewBox="0 0 80 80" aria-hidden="true" focusable="false">',
      '<path d="M28 53 20 74l14-7 6 10 6-10 14 7-8-21H28Z" fill="var(--stamp)" opacity=".9"/>',
      '<circle cx="40" cy="34" r="24" fill="var(--gold)" stroke="var(--stamp-deep)" stroke-width="3"/>',
      '<path d="M40 18l5 11 12 2-9 8 3 12-11-6-11 6 3-12-9-8 12-2 5-11Z" fill="#fff8e6"/>',
      '</svg>'
    ].join("");
  }

  function ensureAchievementOverlay() {
    var overlay = $("#achievement-overlay");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "achievement-overlay";
    overlay.className = "achievement-overlay no-print";
    overlay.innerHTML = [
      '<div class="achievement-modal" role="dialog" aria-modal="true" aria-labelledby="achievement-modal-title">',
      achievementBadge(),
      '<p class="achievement-label">実績解除</p>',
      '<h2 id="achievement-modal-title"></h2>',
      '<p id="achievement-modal-desc"></p>',
      '<button class="primary-button" type="button" data-action="close-achievement">とじる</button>',
      '</div>'
    ].join("");
    document.body.appendChild(overlay);
    overlay.querySelector('[data-action="close-achievement"]').addEventListener("click", function () {
      overlay.classList.remove("show");
      achievementShowing = false;
      window.setTimeout(showNextAchievement, 170);
    });
    return overlay;
  }

  function showNextAchievement() {
    if (achievementShowing || !achievementQueue.length) return;
    achievementShowing = true;
    var achievement = achievementQueue.shift();
    var overlay = ensureAchievementOverlay();
    overlay.querySelector("#achievement-modal-title").textContent = achievement.title || "かけら名人";
    overlay.querySelector("#achievement-modal-desc").textContent = achievement.desc || "";
    overlay.classList.remove("show");
    void overlay.offsetWidth;
    overlay.classList.add("show");
  }

  function enqueueAchievements(list) {
    achievementQueue = achievementQueue.concat(list || []);
    showNextAchievement();
  }

  function renderMap() {
    window.MapRenderer.renderMap(roots.map, openNode);
  }

  function openNode(nodeId) {
    showScreen("node");
    setActiveTab("");
    window.MapRenderer.renderNode(roots.node, nodeId, function () {
      showTab("map");
    }, function (payload) {
      startQuiz(payload.nodeId, payload.tier, payload.branchId);
    });
  }

  function startQuiz(nodeId, tier, branchId) {
    showScreen("quiz");
    setActiveTab("");
    var ok = window.QuizEngine.start(roots.quiz, nodeId, tier, branchId);
    if (!ok) openNode(nodeId);
  }

  function showTab(tabName) {
    setActiveTab(tabName);
    if (tabName === "map") {
      renderMap();
      showScreen("map");
    }
    if (tabName === "collection") {
      window.CollectionRenderer.render(roots.collection);
      showScreen("collection");
    }
    if (tabName === "settings") {
      syncSettings();
      showScreen("settings");
    }
  }

  function openReport() {
    setActiveTab("settings");
    window.ReportRenderer.render(roots.report, function () { showTab("settings"); });
    showScreen("report");
  }

  function syncSettings() {
    var save = window.SaveManager.data();
    $("#setting-ruby").checked = !!save.settings.ruby;
    $("#setting-sound").checked = !!save.settings.sound;
  }

  function wireTabs() {
    document.querySelectorAll(".tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        showTab(tab.dataset.tab);
      });
    });
    $("#reset-view-btn").addEventListener("click", function () {
      showTab("map");
    });
  }

  function wireSettings() {
    $("#setting-ruby").addEventListener("change", function (event) {
      var save = window.SaveManager.data();
      save.settings.ruby = event.target.checked;
      window.SaveManager.save(save);
    });
    $("#setting-sound").addEventListener("change", function (event) {
      var save = window.SaveManager.data();
      save.settings.sound = event.target.checked;
      window.SaveManager.save(save);
    });
    $("#open-report-btn").addEventListener("click", openReport);
    $("#reset-save-btn").addEventListener("click", function () {
      if (!confirm("セーブデータを初期化しますか？")) return;
      window.SaveManager.reset();
      renderMap();
      window.CollectionRenderer.render(roots.collection);
      toast("セーブを初期化しました");
      showTab("map");
    });
  }

  function init() {
    roots = { map: $("#map-root"), node: $("#node-root"), quiz: $("#quiz-root"), collection: $("#collection-root"), report: $("#report-root") };
    window.SaveManager.load();
    if (window.AchievementManager) window.AchievementManager.checkAchievements(false);
    updateHud();
    wireTabs();
    wireSettings();
    renderMap();
    syncSettings();
    window.addEventListener("shakai:save", function () {
      updateHud();
      if ($("#screen-collection").classList.contains("active")) window.CollectionRenderer.render(roots.collection);
      if ($("#screen-report").classList.contains("active")) window.ReportRenderer.render(roots.report, function () { showTab("settings"); });
    });
    window.addEventListener("shakai:achievement", function (event) {
      enqueueAchievements(event.detail || []);
    });
  }

  window.ShakaiApp = { toast: toast, showTab: showTab, openNode: openNode, startQuiz: startQuiz, openReport: openReport };
  document.addEventListener("DOMContentLoaded", init);
}());
