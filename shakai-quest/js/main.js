(function () {
  "use strict";

  var roots = {};
  var achievementQueue = [];
  var achievementShowing = false;
  var achievementReturnFocus = null;

  function $(selector) {
    return document.querySelector(selector);
  }

  function showScreen(name) {
    if (name !== "quiz") document.querySelectorAll("#toast-root .quiz-reward").forEach(function (el) { el.remove(); });
    document.querySelectorAll(".screen").forEach(function (screen) {
      screen.classList.toggle("active", screen.id === "screen-" + name);
    });
  }

  function setActiveTab(tabName) {
    document.querySelectorAll(".tab").forEach(function (tab) {
      tab.classList.toggle("active", tab.dataset.tab === tabName);
      if (tab.dataset.tab === tabName) tab.setAttribute("aria-current", "page");
      else tab.removeAttribute("aria-current");
    });
  }

  function updateHud() {
    var save = window.SaveManager.data();
    $("#player-title").textContent = save.player.title || "見習い探検者";
    $("#player-level").textContent = save.player.level;
    $("#player-exp").textContent = save.player.exp;
    $("#kakera-count").textContent = save.owned.kakeraCount;
  }

  function toast(message, kind) {
    var root = $("#toast-root");
    var el = document.createElement("div");
    el.className = kind === "reward" ? "toast quiz-reward" : "toast";
    el.textContent = message;
    root.appendChild(el);
    while (root.children.length > 2) root.firstElementChild.remove();
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
      if (!achievementQueue.length && achievementReturnFocus && achievementReturnFocus.isConnected) achievementReturnFocus.focus();
      window.setTimeout(showNextAchievement, 170);
    });
    overlay.addEventListener("keydown", function (e) {
      if (e.key === "Escape") overlay.querySelector('[data-action="close-achievement"]').click();
      if (e.key === "Tab") { e.preventDefault(); overlay.querySelector('[data-action="close-achievement"]').focus(); }
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
    overlay.querySelector('[data-action="close-achievement"]').focus();
  }

  function enqueueAchievements(list) {
    if (!achievementShowing) achievementReturnFocus = document.activeElement;
    achievementQueue = achievementQueue.concat(list || []);
    showNextAchievement();
  }

  function renderMap() {
    window.CollectionRenderer.renderMapGoal($("#map-goal"));
    window.MapRenderer.renderMap(roots.map, openNode);
  }

  function openNode(nodeId) {
    var grade = Number(nodeId.charAt(1));
    var save = window.SaveManager.data();
    if (window.NODES_DATA[nodeId] && grade !== save.settings.lastGrade) {
      save.settings.lastGrade = grade;
      window.SaveManager.save();
    }
    showScreen("node");
    setActiveTab("");
    window.MapRenderer.renderNode(roots.node, nodeId, function () {
      showTab("map");
    }, function (payload) {
      startQuiz(payload.nodeId, payload.tier, payload.branchId, payload.options);
    });
    renderNodeConnections(nodeId);
  }

  function renderNodeConnections(nodeId) {
    var nav = $("#node-connections");
    nav.replaceChildren();
    nav.hidden = true;
    if (window.NODES_DATA[nodeId].challengeStyle === "kikitori") return;

    function addLink(label, destination) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "ghost-button";
      button.textContent = label;
      button.addEventListener("click", destination);
      nav.appendChild(button);
      nav.hidden = false;
    }
    Object.entries(window.LIFE_CASES).forEach(function (entry) {
      var id = entry[0], activity = entry[1];
      if (activity.nodeId === nodeId) addLink("くらしの探究「" + activity.title + "」", function () { openLife(id); });
    });
    window.MiddleRenderer.bridgesForNode(nodeId).forEach(function (bridge) {
      var course = window.MIDDLE_COURSES[bridge.courseId];
      addLink("中学へ「" + course.title + "」", function () { openMiddle(course.id); });
    });
  }

  function openLife(caseId) {
    setActiveTab("map");
    showScreen("life");
    window.LifeRenderer.render(roots.life, caseId);
  }

  function startQuiz(nodeId, tier, branchId, options) {
    showScreen("quiz");
    setActiveTab("");
    var ok = window.QuizEngine.start(roots.quiz, nodeId, tier, branchId, options);
    if (!ok) { if (options && options.middlePortal) openMiddle(options.middleCourse); else openNode(nodeId); }
  }

  function showTab(tabName) {
    setActiveTab(tabName);
    if (tabName === "map") {
      renderMap();
      showScreen("map");
    }
    if (tabName === "middle") openMiddle();
    if (tabName === "collection") {
      window.CollectionRenderer.render(roots.collection);
      showScreen("collection");
    }
    if (tabName === "settings") {
      syncSettings();
      showScreen("settings");
    }
    if (tabName === "inventory" || tabName === "notebook") {
      window.InventoryRenderer[tabName === "inventory" ? "render" : "notebook"](roots[tabName]);
      showScreen(tabName);
    }
  }

  function resumeQuiz() {
    showScreen("quiz");
    var session = window.SaveManager.data().activeSession;
    var engine = session && session.kind === "written" ? window.WrittenEngine : window.QuizEngine;
    if (engine.resume(roots.quiz)) { setActiveTab(""); }
    else showTab("map");
  }

  function openMiddle(courseId) {
    setActiveTab("middle"); showScreen("middle");
    window.MiddleRenderer.render(roots.middle, courseId);
  }
  function startWritten(id) {
    showScreen("quiz"); setActiveTab("");
    if (!window.WrittenEngine.start(roots.quiz, id)) openMiddle(window.MIDDLE_WRITTEN[id] && window.MIDDLE_WRITTEN[id].courseId);
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
    $("#setting-reduce-motion").checked = !save.settings.motion;
    document.body.classList.toggle("reduce-motion", !save.settings.motion);
    $("#save-status").textContent = window.SaveManager.status().warning;
  }

  function wireTabs() {
    document.querySelectorAll(".tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        showTab(tab.dataset.tab);
      });
    });
    $("#open-life-btn").addEventListener("click", function () { openLife(); });
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
    $("#setting-reduce-motion").addEventListener("change", function (e) { window.SaveManager.data().settings.motion = !e.target.checked; window.SaveManager.save(); syncSettings(); });
    $("#export-save-btn").addEventListener("click", function () {
      var url = URL.createObjectURL(new Blob([window.SaveManager.exportJSON()], { type: "application/json" }));
      var a = document.createElement("a"); a.href = url; a.download = "social-learning-save.json"; a.click(); window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    });
    $("#import-save-file").addEventListener("change", async function (e) {
      var file = e.target.files[0]; if (!file) return;
      try {
        if (file.size > 5000000) throw new Error("セーブのファイルが大きすぎます。");
        var raw = await file.text();
        if (!confirm("現在の学習記録を、選んだファイルで置き換えますか？")) return;
        window.SaveManager.importJSON(raw); syncSettings(); showTab("map"); toast("学習記録を読み込みました");
      } catch (err) { toast(err.message); }
      finally { e.target.value = ""; }
    });
    $("#reset-save-btn").addEventListener("click", function () {
      if (!confirm("セーブデータを初期化しますか？")) return;
      window.SaveManager.reset();
      syncSettings();
      renderMap();
      window.CollectionRenderer.render(roots.collection);
      toast("セーブを初期化しました");
      showTab("map");
    });
  }

  function init() {
    roots = { map: $("#map-root"), middle: $("#middle-root"), node: $("#node-root"), quiz: $("#quiz-root"), collection: $("#collection-root"), report: $("#report-root"), inventory: $("#inventory-root"), notebook: $("#notebook-root") };
    roots.life = $("#life-root");
    window.SaveManager.load();
    if (window.AchievementManager) window.AchievementManager.checkAchievements(false);
    updateHud();
    wireTabs();
    wireSettings();
    renderMap();
    syncSettings();
    if (window.SaveManager.status().warning) toast(window.SaveManager.status().warning);
    window.addEventListener("shakai:save-error", function (e) { $("#save-status").textContent = e.detail; });
    window.addEventListener("shakai:save", function () {
      updateHud();
      if ($("#screen-collection").classList.contains("active")) window.CollectionRenderer.render(roots.collection);
      if ($("#screen-report").classList.contains("active")) window.ReportRenderer.render(roots.report, function () { showTab("settings"); });
    });
    window.addEventListener("shakai:achievement", function (event) {
      enqueueAchievements(event.detail || []);
    });
  }

  window.ShakaiApp = { toast: toast, showTab: showTab, openNode: openNode, startQuiz: startQuiz, resumeQuiz: resumeQuiz, openReport: openReport, openMiddle: openMiddle, openLife: openLife, startWritten: startWritten };
  document.addEventListener("DOMContentLoaded", init);
}());
