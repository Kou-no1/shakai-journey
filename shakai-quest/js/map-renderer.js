(function () {
  "use strict";

  var esc = window.ShakaiUtil.esc;

  function nodesForLine(lineId) {
    return Object.keys(window.NODES_DATA || {})
      .map(function (id) { return Object.assign({ nodeId: id }, window.NODES_DATA[id]); })
      .filter(function (node) { return node.lineId === lineId; })
      .sort(function (a, b) { return a.order - b.order; });
  }

  function lineStyle(line) {
    return line.mapStyle === "world" ? "world" : line.mapStyle === "sugoroku" ? "sugoroku" : "route";
  }

  function bankFor(nodeId, branchId) {
    var bank = window.QUESTION_BANK && window.QUESTION_BANK[nodeId];
    if (!bank) return null;
    return branchId ? bank[branchId] || null : bank;
  }

  function hasTierQuestions(nodeId, tier, branchId) {
    var bank = bankFor(nodeId, branchId);
    return !!(bank && Array.isArray(bank[tier]) && bank[tier].length);
  }

  function getBranchOption(node, branchId) {
    if (!node || !node.branch || !node.branch.options) return null;
    return node.branch.options.find(function (option) { return option.branchId === branchId; }) || null;
  }

  function stampRow(progress) {
    return '<div class="stamp-row" aria-label="クリア状況">' +
      '<span class="mini-stamp ' + (progress.basicClear ? 'clear' : '') + '">探</span>' +
      '<span class="mini-stamp ' + (progress.advancedClear ? 'clear' : '') + '">認</span>' +
      '<span class="mini-stamp ' + (progress.extraClear ? 'clear' : '') + '">知</span>' +
      '</div>';
  }

  function stationStatus(nodeId, progress) {
    if (!window.SaveManager.hasQuestionBank(nodeId)) return "近日公開";
    if (!progress.unlocked) return "未開放";
    if (progress.extraClear) return "全踏破";
    if (progress.advancedClear) return "認定済み";
    if (progress.basicClear) return "探検済み";
    return "探検へ";
  }

  function renderStation(node, line) {
    var progress = window.SaveManager.getNodeProgress(node.nodeId);
    var hasBank = window.SaveManager.hasQuestionBank(node.nodeId);
    var playable = hasBank && progress.unlocked;
    var stateClass = !hasBank ? "coming-soon" : playable ? "playable" : "locked";
    var branchText = "";
    if (node.branch && progress.branchChosen) {
      var opt = getBranchOption(node, progress.branchChosen);
      branchText = opt ? " / " + opt.label : "";
    } else if (node.branch) {
      branchText = " / 分岐";
    }
    return [
      '<button class="station-button ', stateClass, '" type="button" data-node-id="', esc(node.nodeId), '" ',
      playable ? '' : 'disabled ',
      'style="--line-color:', esc(line.color), '">',
      '<span class="station-top"><span class="station-number">', node.order, '</span><span class="station-status">', stationStatus(node.nodeId, progress), '</span></span>',
      '<strong class="station-name">', esc(node.stationName), '</strong>',
      '<span class="station-sub">', esc(node.subunitName + branchText), '</span>',
      stampRow(progress),
      '</button>'
    ].join("");
  }

  function renderLine(line) {
    var nodes = nodesForLine(line.lineId);
    var style = lineStyle(line);
    var worldArt = style === "world" ? '<div class="world-map" aria-hidden="true">' + window.ShakaiIcons.world() + '</div>' : '';
    return [
      '<section class="line-panel" style="--line-color:', esc(line.color), '">',
      '<div class="line-title-row"><div class="line-title"><span class="line-dot"></span><h3>', esc(line.name), '</h3></div>',
      '<span class="line-meta">', line.grade, '年 / ', nodes.length, '駅</span></div>',
      '<div class="station-list ', style, '">', worldArt,
      '<div class="station-group ', style === "world" ? "world-station-group" : "", '">',
      nodes.map(function (node) { return renderStation(node, line); }).join(""),
      '</div></div></section>'
    ].join("");
  }

  function renderMap(root, onNodeSelect) {
    var lines = (window.LINES_DATA || []).slice().sort(function (a, b) { return a.order - b.order; });
    root.innerHTML = '<div class="map-stack">' + lines.map(renderLine).join("") + '</div>';
    root.querySelectorAll(".station-button.playable").forEach(function (button) {
      button.addEventListener("click", function () { onNodeSelect(button.dataset.nodeId); });
    });
  }

  function rewardName(type, id) {
    return id ? window.CollectionRenderer.getInfo(type, id).name : "なし";
  }

  function rewardPreview(node, progress) {
    var basicIds = node.meibutsuIds || [];
    var branchOption = getBranchOption(node, progress.branchChosen);
    if (branchOption) basicIds = branchOption.meibutsuIds || [];
    var basicReward = basicIds.length ? rewardName("meibutsu", basicIds[0]) : "ルート選択後に決定";
    var advancedReward = "認定カード";
    if (node.challengeStyle === "kikitori") advancedReward = "聞き取り記録";
    else if (node.ijinId) advancedReward = rewardName("ijin", node.ijinId);
    else if (branchOption && branchOption.charaId) advancedReward = rewardName("chara", branchOption.charaId);
    else if (node.charaId) advancedReward = rewardName("chara", node.charaId);
    return [
      '<aside class="node-panel reward-preview">',
      '<div class="reward-line"><div class="reward-icon">', window.ShakaiIcons.render("globe_badge", "名産品"), '</div><div><strong>探検クリア</strong><br><span>', esc(basicReward), '</span></div></div>',
      '<div class="reward-line"><div class="reward-icon">', node.challengeStyle === "kikitori" ? window.ShakaiIcons.render("ration_ticket", "資料") : window.ShakaiIcons.render("ijin", "カード"), '</div><div><strong>', node.challengeStyle === "kikitori" ? '聞き取り完了' : '認定クリア', '</strong><br><span>', esc(advancedReward), '</span></div></div>',
      '<div class="reward-line"><div class="reward-icon">', window.ShakaiIcons.render("item", "実用アイテム"), '</div><div><strong>もっと知りたい！</strong><br><span>全問正解でレアアイテム抽選</span></div></div>',
      '</aside>'
    ].join("");
  }

  function tierButton(node, progress, tier, label, note, enabled) {
    var clearKey = tier + "Clear";
    var isKikitori = tier === "advanced" && node.challengeStyle === "kikitori";
    return [
      '<button class="tier-button ', progress[clearKey] ? 'clear ' : '', isKikitori ? 'kikitori' : '', '" type="button" data-tier="', tier, '" ',
      enabled ? '' : 'disabled',
      '><strong>', esc(label), '</strong><span>', esc(note), '</span>',
      progress[clearKey] ? '<span> / クリア済み</span>' : '',
      '</button>'
    ].join("");
  }

  function renderBranchPicker(node, root, onBack, onStart) {
    var buttons = (node.branch.options || []).map(function (option) {
      var reward = (option.meibutsuIds || []).map(function (id) { return rewardName("meibutsu", id); }).join("、");
      return '<button class="branch-button" type="button" data-branch-id="' + esc(option.branchId) + '"><strong>' + esc(option.label) + '</strong><span>このルートの問題と収蔵品で探検します。名産品: ' + esc(reward || "未設定") + '</span></button>';
    }).join("");
    root.innerHTML = [
      '<div class="back-row"><button class="ghost-button" type="button" data-action="back">地図へ戻る</button></div>',
      '<div class="node-panel"><p class="eyebrow">分岐ルート</p><h2 id="node-title">どちらを探検する？</h2>',
      '<p class="node-meta">', esc(node.stationName), 'では、最初に探検ルートを選びます。選んだルートはセーブされ、再訪時も保持されます。</p>',
      '<div class="branch-grid">', buttons, '</div></div>'
    ].join("");
    root.querySelector('[data-action="back"]').addEventListener("click", onBack);
    root.querySelectorAll(".branch-button").forEach(function (button) {
      button.addEventListener("click", function () {
        window.SaveManager.chooseBranch(node.nodeId, button.dataset.branchId);
        renderNode(root, node.nodeId, onBack, onStart);
      });
    });
  }

  function renderNode(root, nodeId, onBack, onStart) {
    var node = Object.assign({ nodeId: nodeId }, window.NODES_DATA[nodeId]);
    var progress = window.SaveManager.getNodeProgress(nodeId);
    if (node.branch && !progress.branchChosen) {
      renderBranchPicker(node, root, onBack, onStart);
      return;
    }
    var branchOption = getBranchOption(node, progress.branchChosen);
    var branchId = branchOption ? branchOption.branchId : null;
    var advancedLabel = node.challengeStyle === "kikitori" ? "聞き取りチャレンジ" : "認定チャレンジ";
    var advancedNote = node.challengeStyle === "kikitori" ? "証言・資料を淡々と読み解きます。偉人カードは出ません。" : "案内人または偉人から朱色のはんこをもらいます。";
    var tierHtml = [
      tierButton(node, progress, "basic", "探検", "小単元の基本を確認します。", hasTierQuestions(nodeId, "basic", branchId)),
      tierButton(node, progress, "advanced", advancedLabel, advancedNote, progress.basicClear && hasTierQuestions(nodeId, "advanced", branchId)),
      tierButton(node, progress, "extra", "もっと知りたい！", "全問正解でレアアイテム抽選。発展内容を含みます。", progress.advancedClear && hasTierQuestions(nodeId, "extra", branchId))
    ].join("");
    root.innerHTML = [
      '<div class="back-row"><button class="ghost-button" type="button" data-action="back">地図へ戻る</button></div>',
      '<div class="node-layout"><section class="node-panel"><p class="eyebrow">', esc(node.unitName), '</p>',
      '<h2 id="node-title">', esc(node.stationName), '</h2><p class="node-meta">', esc(node.subunitName), '</p>',
      branchOption ? '<p class="node-meta">選択中ルート: <strong>' + esc(branchOption.label) + '</strong></p>' : '',
      '<div class="tier-grid">', tierHtml, '</div></section>', rewardPreview(node, progress), '</div>'
    ].join("");
    root.querySelector('[data-action="back"]').addEventListener("click", onBack);
    root.querySelectorAll(".tier-button:not(:disabled)").forEach(function (button) {
      button.addEventListener("click", function () { onStart({ nodeId: nodeId, tier: button.dataset.tier, branchId: branchId }); });
    });
  }

  window.MapRenderer = { renderMap: renderMap, renderNode: renderNode, bankFor: bankFor, hasTierQuestions: hasTierQuestions, getBranchOption: getBranchOption, nodesForLine: nodesForLine };
}());
