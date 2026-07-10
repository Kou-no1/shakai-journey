(function () {
  "use strict";

  var roots = {};

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
    roots = { map: $("#map-root"), node: $("#node-root"), quiz: $("#quiz-root"), collection: $("#collection-root") };
    window.SaveManager.load();
    updateHud();
    wireTabs();
    wireSettings();
    renderMap();
    syncSettings();
    window.addEventListener("shakai:save", function () {
      updateHud();
      if ($("#screen-collection").classList.contains("active")) window.CollectionRenderer.render(roots.collection);
    });
  }

  window.ShakaiApp = { toast: toast, showTab: showTab, openNode: openNode, startQuiz: startQuiz };
  document.addEventListener("DOMContentLoaded", init);
}());
