(function () {
  "use strict";
  var esc = window.ShakaiUtil.esc;
  var fields = { geography: "地理", history: "歴史", civics: "公民" };
  function bridgeFor(id) {
    var bridges = window.MIDDLE_BRIDGES || {};
    var bridge = Object.prototype.hasOwnProperty.call(bridges, id) && bridges[id];
    var node = bridge && window.NODES_DATA[bridge.nodeId];
    return node && node.challengeStyle !== "kikitori" ? bridge : null;
  }
  function bridgesForNode(nodeId) {
    return Object.keys(window.MIDDLE_COURSES).reduce(function (matches, id) {
      var b = bridgeFor(id), course = window.MIDDLE_COURSES[id];
      if (b && b.nodeId === nodeId) matches.push({ courseId: id, title: course.title, field: course.field, nodeId: nodeId });
      return matches;
    }, []);
  }
  function stationLabel(b) {
    return '小' + b.nodeId.charAt(1) + '・' + window.NODES_DATA[b.nodeId].stationName;
  }
  function canOpenStation(nodeId) {
    return window.SaveManager.hasQuestionBank(nodeId) && window.SaveManager.isNodeUnlocked(nodeId);
  }
  function stationLink(b, save) {
    var id = b.nodeId, node = window.NODES_DATA[id], enabled = canOpenStation(id), note = '';
    if (!enabled) {
      var prev = Object.values(window.NODES_DATA).find(function (n) { return n.lineId === node.lineId && n.order === node.order - 1; });
      note = window.SaveManager.hasQuestionBank(id) && prev ? '「' + prev.stationName + '」の基本をクリアすると開きます。' : 'この駅の教材は準備中です。';
    } else if (node.branch) {
      var chosen = node.branch.options.find(function (option) { return option.branchId === save.progress[id].branchChosen; });
      note = chosen ? '選択中のルート：' + chosen.label : '駅で学びたいルートを選べます。';
    }
    return '<div class="bridge-station"><button type="button" class="ghost-button" data-bridge-station="' + esc(id) + '"' +
      (enabled ? '' : ' disabled') + '>' + esc(stationLabel(b)) + (enabled ? 'を開く' : '（未開放）') + '</button>' +
      (note ? '<small>' + esc(note) + '</small>' : '') + '</div>';
  }
  function bridgeLesson(course, save) {
    var b = bridgeFor(course.id);
    if (!b) return '';
    return '<section class="middle-bridge" aria-labelledby="bridge-heading"><p class="eyebrow">小学校から中学' + fields[course.field] +
      'へ</p><h3 id="bridge-heading">' + esc(b.title) + '</h3><dl class="bridge-steps"><div><dt>小学校の手がかり</dt><dd>' +
      esc(b.prior) + '</dd></div><div><dt>中学で考えること</dt><dd>' + esc(b.shift) + '</dd></div></dl>' +
      '<p class="bridge-evidence"><strong>練習用の架空の事例</strong>' + esc(b.caseText) +
      '</p><fieldset class="bridge-task"><legend>' + esc(b.question) + '</legend><div class="bridge-choices">' +
      b.choices.map(function (label, i) {
        return '<button class="ghost-button" type="button" data-bridge-choice="' + i + '" aria-pressed="false">' + esc(label) + '</button>';
      }).join('') + '</div></fieldset><p class="bridge-feedback" role="status"></p>' + stationLink(b, save) + '</section>';
  }
  function bindBridge(root, course) {
    var b = bridgeFor(course.id);
    if (!b) return;
    var choices = root.querySelectorAll('[data-bridge-choice]');
    choices.forEach(function (button) {
      button.addEventListener('click', function () {
        var correct = Number(button.dataset.bridgeChoice) === b.answer;
        choices.forEach(function (choice) { choice.setAttribute('aria-pressed', String(choice === button)); });
        root.querySelector('.bridge-feedback').textContent = correct ? 'その通り。' + b.reason : 'もう一度考えてみよう。' + b.hint;
      });
    });
    root.querySelector('[data-bridge-station]').addEventListener('click', function () {
      if (canOpenStation(b.nodeId)) window.ShakaiApp.openNode(b.nodeId);
    });
  }
  function writtenCount(id, save) {
    return window.MiddleCourses.writtenFor(id).filter(function (q) { var r = save.writtenRecords[q.id]; return r && r.contentVersion === q.contentVersion; }).length;
  }
  function progress(id, save) {
    return Object.keys(window.MiddleCourses.difficulties).map(function (difficulty) {
      var p = window.MiddleCourses.progressFor(id, difficulty, save), bank = window.MiddleCourses.bank(id, difficulty);
      return '<span>' + esc(window.MiddleCourses.difficulties[difficulty]) + '<strong>' + p.masteredQuestionIds.length + '/' + bank.length + '</strong>' + (p.perfect ? '全問正解' : p.completed ? '完了' : '') + '</span>';
    }).join("");
  }
  function practice(root, save) {
    var reasons = window.MiddleCourses.reviewReasons(save), candidates = Object.keys(reasons).sort(function (a, b) { return reasons[b] - reasons[a]; });
    return '<section class="middle-practice"><h3>つまずき別の復習</h3>' + (candidates.length ? '<p>おすすめ：' + esc(window.MiddleCourses.mistakeLabels[candidates[0]]) + ' / ' + reasons[candidates[0]] + '問の着目点</p><button class="primary-button" data-transfer="' + candidates[0] + '">おすすめの別問題に挑戦</button>' : '') +
      '<label class="notebook-filter">着目点<select data-transfer-reason>' + Object.keys(window.MiddleCourses.mistakeLabels).map(function (key) { return '<option value="' + key + '">' + esc(window.MiddleCourses.mistakeLabels[key]) + '</option>'; }).join("") + '</select></label><button class="ghost-button" data-transfer-select>選んだ着目点の別問題に挑戦</button></section>';
  }
  function launchPractice(reason) {
    var id = window.MiddleCourses.practiceCourse(reason), entry = window.MiddleCourses.entryFor(id);
    if (entry) window.ShakaiApp.startQuiz(entry.nodeId, "extra", null, { mode: "learn", review: true, middlePortal: true, middleCourse: id, middlePractice: reason });
  }
  function render(root, courseId) {
    var save = window.SaveManager.data(), course = Object.prototype.hasOwnProperty.call(window.MIDDLE_COURSES, courseId) && window.MIDDLE_COURSES[courseId];
    var resume = save.activeSession && !save.activeSession.finished ? '<button class="resume-button primary-button" data-middle-resume>途中の学習を再開</button>' : '';
    if (course) {
      var written = window.MiddleCourses.writtenFor(course.id);
      root.innerHTML = '<div class="section-head"><div><p class="eyebrow">中学発展・' + fields[course.field] + '</p><h2>' + esc(course.title) + '</h2></div><button class="ghost-button" data-middle-back>中学の地図へ</button></div>' + resume +
        '<div class="middle-course-progress">' + progress(course.id, save) + '</div>' + bridgeLesson(course, save) + '<h3>資料と知識のチャレンジ</h3><div class="middle-levels">' + Object.keys(window.MiddleCourses.difficulties).map(function (difficulty) {
          var bank = window.MiddleCourses.bank(course.id, difficulty);
          return '<button class="tier-button middle-tier" data-portal-course="' + course.id + '" data-portal-difficulty="' + difficulty + '"><strong>' + window.MiddleCourses.difficulties[difficulty] + '</strong><span>' + bank.length + '問</span></button>';
        }).join("") + '</div><section class="middle-written-list"><h3>記述・資料探究 <small>' + writtenCount(course.id, save) + '/' + written.length + '</small></h3>' + written.map(function (q) {
          var record = save.writtenRecords[q.id], status = record ? record.contentVersion === q.contentVersion ? '自己評価済み' : '課題更新・再挑戦' : '未記録';
          return '<article><h4>' + window.SocialQuestions.ruby(q.stem) + '</h4><span>' + status + '</span><button class="ghost-button" data-written-id="' + q.id + '">記述に挑戦</button></article>';
        }).join("") + '</section>';
      root.querySelector("[data-middle-back]").addEventListener("click", function () { window.ShakaiApp.openMiddle(); });
      bindBridge(root, course);
    } else {
      root.innerHTML = '<div class="section-head"><h2>中学発展の地図</h2></div>' + resume + Object.keys(fields).map(function (field) {
        var ids = Object.keys(window.MIDDLE_COURSES).filter(function (id) { return window.MIDDLE_COURSES[id].field === field; });
        return '<section class="middle-field" data-middle-field="' + field + '"><h3>' + fields[field] + '</h3><div class="middle-course-grid">' + ids.map(function (id) {
          var c = window.MIDDLE_COURSES[id], b = bridgeFor(id);
          return '<article class="middle-course-card">' + window.ShakaiIcons.stationBackground(b ? b.nodeId : c.entryNodeId) + '<h4>' + esc(c.title) + '</h4>' +
            (b ? '<p class="bridge-preview"><small>' + esc(stationLabel(b)) + 'から</small>' + esc(b.title) + '</p>' : '') +
            '<div class="middle-course-progress">' + progress(id, save) + '</div><p>記述 ' + writtenCount(id, save) + '/' + window.MiddleCourses.writtenFor(id).length + '</p><button class="primary-button" data-open-middle="' + id + '">コースを開く</button></article>';
        }).join("") + '</div></section>';
      }).join("") + practice(root, save);
    }
    root.querySelectorAll("[data-open-middle]").forEach(function (button) { button.addEventListener("click", function () { window.ShakaiApp.openMiddle(button.dataset.openMiddle); }); });
    root.querySelectorAll("[data-portal-course]").forEach(function (button) { button.addEventListener("click", function () {
      var id = button.dataset.portalCourse, entry = window.MiddleCourses.entryFor(id);
      window.ShakaiApp.startQuiz(entry.nodeId, "extra", null, { mode: "learn", middlePortal: true, middleCourse: id, middleDifficulty: button.dataset.portalDifficulty });
    }); });
    root.querySelectorAll("[data-written-id]").forEach(function (button) { button.addEventListener("click", function () { window.ShakaiApp.startWritten(button.dataset.writtenId); }); });
    var resumeButton = root.querySelector("[data-middle-resume]"); if (resumeButton) resumeButton.addEventListener("click", window.ShakaiApp.resumeQuiz);
    root.querySelectorAll("[data-transfer]").forEach(function (button) { button.addEventListener("click", function () { launchPractice(button.dataset.transfer); }); });
    var selector = root.querySelector("[data-transfer-select]"); if (selector) selector.addEventListener("click", function () { launchPractice(root.querySelector("[data-transfer-reason]").value); });
  }
  function writtenNotebook(save) {
    var records = Object.keys(save.writtenRecords);
    if (!records.length) return "";
    return '<section class="written-notebook"><h3>記述の記録・自己評価</h3>' + records.map(function (id) {
      var q = window.MIDDLE_WRITTEN[id], r = save.writtenRecords[id]; if (!q) return "";
      if (r.contentVersion !== q.contentVersion) return '<article class="written-entry"><h4>' + window.SocialQuestions.ruby(q.stem) + '</h4><p>課題更新・再挑戦 / 旧版の回答を保持しています</p><p class="written-response">' + esc(r.response) + '</p><button class="ghost-button" data-written-id="' + esc(id) + '">もう一度書く</button></article>';
      return '<article class="written-entry"><h4>' + window.SocialQuestions.ruby(q.stem) + '</h4><p class="written-response">' + esc(r.response) + '</p><p>自己評価 ' + r.ratings.reduce(function (n, v) { return n + v; }, 0) + '/6 / 記録 ' + r.attempts + '回</p><details><summary>資料・採点観点・模範解答</summary>' + window.QuizEngine.diagram(q) + '<ol>' + q.rubric.map(function (criterion, i) { return '<li>' + window.SocialQuestions.ruby(criterion) + '：' + r.ratings[i] + '/2</li>'; }).join("") + '</ol><p>' + window.SocialQuestions.ruby(q.modelAnswer) + '</p></details><button class="ghost-button" data-written-id="' + esc(id) + '">もう一度書く</button></article>';
    }).join("") + '</section>';
  }
  window.MiddleRenderer = { render: render, bridgesForNode: bridgesForNode, launchPractice: launchPractice, writtenCount: writtenCount, writtenNotebook: writtenNotebook };
}());
