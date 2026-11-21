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

  function tierMarks(node, progress) {
    var labels = node.challengeStyle === "kikitori" ? ["資料", "聞き取り", "関連資料"] : ["基本", "認定", "おまけ"];
    return ["basic", "advanced", "extra"].map(function (tier, i) {
      var done = progress[tier + "Clear"];
      return '<span class="mini-stamp' + (done ? ' clear' : '') + '">' + (done ? '✓ ' : '') + labels[i] +
        '<span class="map-sr-only">' + (done ? '・完了' : '・未完了') + '</span></span>';
    }).join("");
  }

  function basicCount(nodes) {
    return nodes.filter(function (node) { return window.SaveManager.getNodeProgress(node.nodeId).basicClear; }).length;
  }

  function renderStation(node, line, previous) {
    var progress = window.SaveManager.getNodeProgress(node.nodeId);
    var hasBank = window.SaveManager.hasQuestionBank(node.nodeId);
    var playable = hasBank && progress.unlocked;
    var stateClass = !hasBank ? "coming-soon" : playable ? "playable" : "locked";
    var route = window.SaveManager.routeProgress(node.nodeId, progress.branchChosen);
    var branch = getBranchOption(node, progress.branchChosen);
    var quiet = node.challengeStyle === "kikitori";
    var status = !hasBank ? "近日公開" : !playable ? "未開放" : route.basicClear ? "もう一度学ぶ" :
      node.branch && !branch ? "ルートを選ぶ" : quiet ? "資料を読む" : route.seenQuestionIds.length ? "学習を続ける" : "ここから学ぶ";
    return [
      '<button class="station-button ', stateClass, quiet ? ' quiet-station' : '', '" type="button" data-node-id="', esc(node.nodeId), '" ',
      playable ? '' : 'disabled ',
      'style="--line-color:', esc(line.color), '">',
      '<span class="station-art" aria-hidden="true">', window.ShakaiIcons.stationBackground(node.nodeId), '</span>',
      '<span class="station-top"><span class="station-number">', node.order, '<span class="map-sr-only">番駅</span></span><span class="station-status">', status, '</span></span>',
      '<strong class="station-name">', esc(node.stationName), '</strong><span class="station-sub">', esc(node.subunitName), '</span>',
      node.branch ? '<span class="station-branch">' + (branch ? '選択中：' + esc(branch.label) : '分かれ道：' + node.branch.options.length + 'ルート') + '</span>' : '',
      quiet ? '<span class="station-branch">証言と資料の学習</span>' : '',
      playable ? '<span class="stamp-row">' + tierMarks(node, route) + '</span>' :
        hasBank && previous ? '<span class="station-condition">' + previous.order + '番駅の基本を終えると開く</span>' : '',
      '</button>'
    ].join("");
  }

  function renderLine(line, nodes) {
    var style = lineStyle(line);
    var worldArt = style === "world" ? '<div class="world-map" aria-hidden="true">' + window.ShakaiIcons.world() + '</div>' : '';
    return [
      '<section class="line-panel" style="--line-color:', esc(line.color), '">',
      '<div class="line-title-row"><div class="line-title"><span class="line-dot"></span><h3>', esc(line.name), '</h3></div>',
      '<span class="line-meta">基本完了 ', basicCount(nodes), ' / ', nodes.length, ' 駅</span></div>',
      '<div class="station-list ', style, '">', worldArt,
      '<div class="station-group ', style === "world" ? "world-station-group" : "", '">',
      nodes.map(function (node, index) { return renderStation(node, line, nodes[index - 1]); }).join(""),
      '</div></div></section>'
    ].join("");
  }

  function renderMap(root, onNodeSelect) {
    var save = window.SaveManager.data(), grade = save.settings.lastGrade;
    window.TravelAtlas.render(grade, onNodeSelect);
    var lines = (window.LINES_DATA || []).filter(function (l) { return l.grade === grade; }).sort(function (a, b) { return a.order - b.order; });
    var groups = lines.map(function (line) { return nodesForLine(line.lineId); });
    var nodes = [].concat.apply([], groups), completed = basicCount(nodes);
    var available = nodes.filter(function (node) {
      return save.progress[node.nodeId].unlocked && window.SaveManager.hasQuestionBank(node.nodeId);
    });
    var next = available.find(function (node) { return !save.progress[node.nodeId].basicClear; });
    root.innerHTML = '<div class="grade-tabs" role="tablist" aria-label="学年">' + [3, 4, 5, 6].map(function (g) {
      return '<button type="button" role="tab" id="map-grade-' + g + '" aria-controls="grade-map-panel" data-grade="' + g + '" aria-selected="' + (g === grade) + '" tabindex="' + (g === grade ? 0 : -1) + '">' + g + '年</button>';
    }).join("") + '</div><div id="grade-map-panel" role="tabpanel" aria-labelledby="map-grade-' + grade + '">' +
      '<header class="grade-overview"><div><h2>' + grade + '年の路線図</h2>' +
      (grade < 5 ? '<p class="region-scope">全国共通編 / 対象地域：未設定</p>' : '') +
      '</div><div class="grade-progress"><strong>基本を終えた駅　' + completed + ' / ' + nodes.length + '</strong>' +
      '<progress aria-label="基本を終えた駅" value="' + completed + '" max="' + nodes.length + '"></progress>' +
      '<span>今行ける駅：' + available.length + '駅</span></div></header>' +
      '<div class="map-actions">' + (save.activeSession ? '<button type="button" class="resume-button primary-button" data-resume>途中の学習を再開</button>' : '') +
      (next ? '<button type="button" class="ghost-button" data-next-station><strong>次に学ぶ</strong>　' + esc(next.stationName) + 'へ</button>' : '') + '</div>' +
      '<div class="map-stack">' + lines.map(function (line, i) { return renderLine(line, groups[i]); }).join("") + '</div></div>';
    root.querySelectorAll("[data-grade]").forEach(function (b) {
      b.addEventListener("click", function () {
        var selected = Number(b.dataset.grade); save.settings.lastGrade = selected; window.SaveManager.save(); renderMap(root, onNodeSelect);
        root.querySelector('[data-grade="' + selected + '"]').focus({ preventScroll: true });
      });
      b.addEventListener("keydown", function (e) {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
        e.preventDefault(); var g = e.key === "Home" ? 3 : e.key === "End" ? 6 : 3 + ((grade - 3 + (e.key === "ArrowRight" ? 1 : 3)) % 4);
        save.settings.lastGrade = g; window.SaveManager.save(); renderMap(root, onNodeSelect); root.querySelector('[data-grade="' + g + '"]').focus();
      });
    });
    var resume = root.querySelector("[data-resume]"); if (resume) resume.addEventListener("click", window.ShakaiApp.resumeQuiz);
    if (next) root.querySelector("[data-next-station]").addEventListener("click", function () { onNodeSelect(next.nodeId); });
    root.querySelectorAll(".station-button.playable").forEach(function (button) {
      button.addEventListener("click", function () { onNodeSelect(button.dataset.nodeId); });
    });
  }

  function rewardName(type, id) {
    return id ? window.CollectionRenderer.getInfo(type, id).name : "なし";
  }

  function rewardPreview(node, progress) {
    if (node.challengeStyle === "kikitori") {
      return '<aside class="node-panel map-source-note"><h3>資料を読むときに</h3><p>だれが、いつ残した資料でしょう。人々のくらしがどう変わったのか、記録の中の言葉を手がかりに考えましょう。</p></aside>';
    }
    var basicIds = node.meibutsuIds || [];
    var branchOption = getBranchOption(node, progress.branchChosen);
    if (branchOption) basicIds = branchOption.meibutsuIds || [];
    var basicReward = basicIds.length ? rewardName("meibutsu", basicIds[0]) : "学習記録・EXP・たびのかけら";
    var advancedReward = "認定カード";
    if (node.ijinId) advancedReward = rewardName("ijin", node.ijinId);
    else if (branchOption && branchOption.charaId) advancedReward = rewardName("chara", branchOption.charaId);
    else if (node.charaId) advancedReward = rewardName("chara", node.charaId);
    return [
      '<aside class="node-panel reward-preview">',
      '<div class="reward-line"><div class="reward-icon">', window.ShakaiIcons.render("globe_badge", "名産品"), '</div><div><strong>探検クリア</strong><br><span>', esc(basicReward), '</span></div></div>',
      '<div class="reward-line"><div class="reward-icon">', window.ShakaiIcons.render("ijin", "カード"), '</div><div><strong>認定クリア</strong><br><span>', esc(advancedReward), '</span></div></div>',
      '<div class="reward-line"><div class="reward-icon">', window.ShakaiIcons.render("item", "実用アイテム"), '</div><div><strong>おまけ</strong><br><span>ヒントを使わず、15問すべてに一度で正解すると、この単元のレア装備</span></div></div>',
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
      progress[clearKey] ? '<span class="tier-state">完了・もう一度学ぶ</span>' : '',
      '</button>'
    ].join("");
  }

  function wireNodeNavigation(root, onBack, nodeId) {
    root.querySelector('[data-action="back"]').addEventListener("click", function () {
      onBack();
      var station = document.querySelector('#map-root [data-node-id="' + nodeId + '"]:enabled') ||
        document.querySelector('#map-root [data-grade][aria-selected="true"]');
      if (station) station.focus();
    });
    root.querySelector("#node-title").focus();
  }

  function renderBranchPicker(node, root, onBack, onStart) {
    var selected = window.SaveManager.getNodeProgress(node.nodeId).branchChosen;
    var buttons = (node.branch.options || []).map(function (option) {
      var reward = (option.meibutsuIds || []).map(function (id) { return rewardName("meibutsu", id); }).join("、");
      var p = window.SaveManager.routeProgress(node.nodeId, option.branchId);
      return '<button class="branch-button" type="button" data-branch-id="' + esc(option.branchId) + '"><strong>' + esc(option.label) + '</strong><span>' +
        (selected === option.branchId ? '選択中 / ' : '') + (p.basicClear ? '基本を完了' : p.seenQuestionIds.length ? '学習中' : 'これから') +
        '</span>' + (reward ? '<span class="branch-reward">名産品：' + esc(reward) + '</span>' : '') + '</button>';
    }).join("");
    root.innerHTML = [
      '<div class="back-row"><button class="ghost-button" type="button" data-action="back">地図へ戻る</button></div>',
      window.TravelAtlas.arrival(node),
      '<div class="node-panel"><p class="eyebrow">', esc(node.stationName), 'の分かれ道</p><h2 id="node-title" tabindex="-1">どちらを探検する？</h2>',
      '<p class="node-meta">あとでもう一方のルートを選べます。学習の記録はルートごとに残ります。</p>',
      '<div class="branch-grid">', buttons, '</div></div>'
    ].join("");
    wireNodeNavigation(root, onBack, node.nodeId);
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
    progress = window.SaveManager.routeProgress(nodeId, branchId);
    var quiet = node.challengeStyle === "kikitori";
    var basicBank = window.SocialQuestions.bank(nodeId, branchId, "basic");
    var questionStats = window.SaveManager.data().questionStats;
    var reviewCount = basicBank.filter(function (q) { return questionStats[q.id] && !questionStats[q.id].lastCorrect; }).length;
    var gate = quiet ? "基本の資料を読み終えると開く" : "このルートの基本を終えると開く";
    function tierNote(tier, note) {
      if (!hasTierQuestions(nodeId, tier, branchId)) return "準備中";
      return tier !== "basic" && !progress.basicClear ? gate : note;
    }
    var tierHtml = [
      tierButton(node, progress, "basic", quiet ? "資料の探究（基本）" : "洞窟・基本", tierNote("basic", quiet ? "記録から当時のくらしを知る" : "この駅の学習を始める"), hasTierQuestions(nodeId, "basic", branchId)),
      tierButton(node, progress, "advanced", quiet ? "聞き取り学習" : "認定チャレンジ", tierNote("advanced", quiet ? "証言と資料を読み解く" : "学んだことを確かめる"), progress.basicClear && hasTierQuestions(nodeId, "advanced", branchId)),
      tierButton(node, progress, "extra", quiet ? "関連する資料" : "おまけ・先取り", tierNote("extra", quiet ? "別の資料にも目を向ける" : "学んだことから、さらに先へ"), progress.basicClear && hasTierQuestions(nodeId, "extra", branchId))
    ].join("");
    var middleCourse = window.MiddleCourses.forNode(nodeId);
    root.innerHTML = [
      '<div class="back-row"><button class="ghost-button" type="button" data-action="back">地図へ戻る</button></div>',
      window.TravelAtlas.arrival(node),
      '<div class="node-layout', quiet ? ' quiet-node' : '', '"><section class="node-panel"><p class="eyebrow">', esc(node.unitName), ' / ', node.order, '番駅</p>',
      '<h2 id="node-title" tabindex="-1">', esc(node.stationName), '</h2><p class="node-meta">', esc(node.subunitName), '</p>',
      branchOption ? '<p class="node-meta">選択中ルート: <strong>' + esc(branchOption.label) + '</strong></p>' : '',
      '<p class="mastery-line">基本で正解した問題　', basicBank.filter(function (q) { return progress.masteredQuestionIds.includes(q.id); }).length, ' / ', basicBank.length, ' 問</p>',
      '<fieldset class="course-controls"><legend>学び方</legend><label>モード<select id="course-mode"', quiet ? ' disabled' : '', '><option value="learn">', quiet ? '資料を読む' : '学び直し', '</option>', quiet ? '' : '<option value="challenge">RPG挑戦</option>', '</select></label><label>基本の問題数<select id="course-limit"><option value="all">全問</option><option value="5">5問</option><option value="10">10問</option></select></label></fieldset>',
      '<div class="tier-grid">', tierHtml, '</div>',
      middleCourse ? '<section class="middle-controls" aria-label="中学発展"></section>' : '',
      '<div class="node-actions"><button type="button" class="ghost-button" data-review ', reviewCount ? '' : 'disabled', '>', reviewCount ? '基本のまちがいを復習（' + reviewCount + '問）' : '基本の復習：今は問題なし', '</button>',
      node.branch ? '<button class="ghost-button" data-switch-branch>もう一つのルートへ</button>' : '',
      '</div></section>', rewardPreview(node, window.SaveManager.getNodeProgress(nodeId)), '</div>'
    ].join("");
    wireNodeNavigation(root, onBack, nodeId);
    root.querySelectorAll(".tier-button:not(:disabled)").forEach(function (button) {
      button.addEventListener("click", function () { onStart({ nodeId: nodeId, tier: button.dataset.tier, branchId: branchId,
        options: { mode: root.querySelector("#course-mode").value, limit: root.querySelector("#course-limit").value, middleCourse: button.dataset.middleCourse || null } }); });
    });
    if (middleCourse) {
      var middleRoot = root.querySelector(".middle-controls");
      function renderMiddle(difficulty, focus) {
        var middle = window.SaveManager.getMiddleProgress(middleCourse.id, difficulty), count = window.MiddleCourses.bank(middleCourse.id, difficulty).length;
        middleRoot.innerHTML = '<h3>中学発展</h3><div class="difficulty-tabs" role="group" aria-label="中学発展の難度">' + Object.keys(window.MiddleCourses.difficulties).map(function (key) {
          return '<button type="button" data-difficulty="' + key + '" aria-pressed="' + (key === difficulty) + '">' + esc(window.MiddleCourses.difficulties[key]) + '</button>';
        }).join("") + '</div><button class="tier-button middle-tier ' + (middle.completed ? 'clear' : '') + '" type="button" data-middle-course="' + middleCourse.id + '" data-middle-difficulty="' + difficulty + '" ' + (progress.basicClear ? '' : 'disabled') + '><strong>' + esc(middleCourse.title) + '</strong><span>' + esc(window.MiddleCourses.difficulties[difficulty]) + ' ' + count + '問 / 習得 ' + middle.masteredQuestionIds.length + '/' + count + (middle.perfect ? ' / 全問正解済み' : middle.completed ? ' / 完了済み' : '') + '</span></button>';
        middleRoot.querySelectorAll("[data-difficulty]").forEach(function (b) { b.addEventListener("click", function () { renderMiddle(b.dataset.difficulty, true); }); });
        middleRoot.querySelector("[data-middle-course]").addEventListener("click", function () {
          onStart({ nodeId: nodeId, tier: "extra", branchId: branchId, options: { mode: root.querySelector("#course-mode").value, middleCourse: middleCourse.id, middleDifficulty: difficulty } });
        });
        if (focus) middleRoot.querySelector('[data-difficulty="' + difficulty + '"]').focus({ preventScroll: true });
      }
      renderMiddle("standard", false);
    }
    root.querySelector("[data-review]").addEventListener("click", function () { onStart({ nodeId: nodeId, tier: "basic", branchId: branchId, options: { review: true, mode: "learn" } }); });
    var switchBranch = root.querySelector("[data-switch-branch]");
    if (switchBranch) switchBranch.addEventListener("click", function () { renderBranchPicker(node, root, onBack, onStart); });
  }

  window.MapRenderer = { renderMap: renderMap, renderNode: renderNode, bankFor: bankFor, hasTierQuestions: hasTierQuestions, getBranchOption: getBranchOption, nodesForLine: nodesForLine };
}());
