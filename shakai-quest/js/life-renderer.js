(function () {
  "use strict";

  var esc = window.ShakaiUtil.esc;
  var ruby = window.SocialQuestions.ruby;
  var title = "くらしの探究";
  var letters = ["ア", "イ", "ウ"];

  function firstChoice(item) {
    var records = window.SaveManager.data().lifeRecords || {};
    var record = Object.prototype.hasOwnProperty.call(records, item.id) && records[item.id];
    return record && Number.isInteger(record.choice) && item.choices[record.choice] ? record.choice : null;
  }

  function heading(item) {
    return '<header class="life-header"><div>' +
      (item ? '<p class="life-kicker">' + title + ' ／ 小学' + item.grade + '年・' + esc(item.theme) + '</p>' : '') +
      '<h2 tabindex="-1">' + (item ? esc(item.title) : title) + '</h2></div><div class="life-nav">' +
      (item ? '<button type="button" class="ghost-button" data-life-list>一覧へ戻る</button>' : '') +
      '<button type="button" class="ghost-button" data-life-map>地図へ戻る</button></div></header>';
  }

  function bindNav(root, item) {
    root.querySelector("[data-life-map]").addEventListener("click", function () {
      window.ShakaiApp.showTab("map");
      var opener = document.getElementById("open-life-btn");
      if (opener) opener.focus();
    });
    if (item) root.querySelector("[data-life-list]").addEventListener("click", function () {
      list(root);
      var opener = root.querySelector('[data-life-case="' + item.id + '"]');
      if (opener) opener.focus();
    });
  }

  function list(root) {
    var cases = Object.values(window.LIFE_CASES);
    var completed = cases.filter(function (item) { return firstChoice(item) !== null; }).length;
    root.innerHTML = '<div class="life-inquiry">' + heading(null) +
      '<p class="life-total">記録した場面 <strong>' + completed + ' / ' + cases.length + '</strong></p>' +
      [3, 4, 5, 6].map(function (grade) {
        return '<section class="life-grade"><h3 data-life-grade="' + grade + '">小学' + grade + '年</h3><div class="life-grid">' +
          cases.filter(function (item) { return item.grade === grade; }).map(function (item) {
            var done = firstChoice(item) !== null;
            return '<button type="button" class="life-entry" data-life-case="' + esc(item.id) + '">' +
              '<span class="life-scene" aria-hidden="true">' + window.ShakaiIcons.stationBackground(item.nodeId) + '</span>' +
              '<span class="life-entry-text"><span class="life-theme">' + esc(item.theme) + '</span><strong>' +
              esc(item.title) + '</strong><span class="life-status' + (done ? ' is-recorded' : '') + '">' +
              (done ? '記録あり' : '未記録') + '</span></span></button>';
          }).join("") + '</div></section>';
      }).join("") + '</div>';
    bindNav(root, null);
    root.querySelectorAll("[data-life-case]").forEach(function (button) {
      button.addEventListener("click", function () { render(root, button.dataset.lifeCase); });
    });
  }

  function evidenceMarkup(evidence) {
    return '<section class="life-evidence"><h3>判断の手がかり</h3><p class="life-source-type">学習用の架空の資料</p>' +
      '<table><caption>' + ruby(evidence.caption) + '</caption><thead><tr>' +
      evidence.columns.map(function (label) { return '<th scope="col">' + ruby(label) + '</th>'; }).join("") +
      '</tr></thead><tbody>' + evidence.rows.map(function (row) {
        return '<tr><th scope="row">' + ruby(row[0]) + '</th>' +
          row.slice(1).map(function (cell) { return '<td>' + ruby(cell) + '</td>'; }).join("") + '</tr>';
      }).join("") + '</tbody></table><aside class="life-note"><h4>' + ruby(evidence.source) + '</h4><p>' +
      ruby(evidence.note) + '</p></aside></section>';
  }

  function responseMarkup(item, index, first, retry) {
    var choice = item.choices[index];
    var preferred = item.choices.find(function (entry) { return entry.recommended; });
    var status = window.SaveManager.status();
    var note = first === null ? '最初の記録は保存されていません。' :
      retry ? '最初の記録は「' + letters[first] + '」のままです。' : '最初に選んだ案の記録です。';
    if (status.warning) note += ' ' + status.warning;
    return '<section class="life-response" data-life-feedback><h3 tabindex="-1">' + (retry ? '今回試した案' : '選んだ案') + '：' +
      letters[index] + '</h3><p class="life-chosen">' + ruby(choice.text) + '</p><h4>資料から考えると</h4><p>' +
      ruby(choice.feedback) + '</p>' + (choice.recommended ? '' :
        '<details><summary>資料に合う案を見る</summary><p><strong>' + ruby(preferred.text) + '</strong></p><p>' + ruby(preferred.feedback) + '</p></details>') +
      '<h4>くらしで試そう</h4><p>' + ruby(item.activity) + '</p><div class="life-actions"><button type="button" class="ghost-button" data-life-retry>もう一度考える</button>' +
      '<span>' + esc(note) + '</span></div></section>';
  }

  function detail(root, item, index, retry, focusTarget) {
    var first = firstChoice(item);
    var question = '<section class="life-question"><h3 tabindex="-1">' + ruby(item.question) + '</h3>' +
      (index !== null ? '</section>' : '<p class="life-instruction">' +
        (first === null ? '最初に選んだ案が記録に残ります。' : '別の案も試せます。最初の記録は変わりません。') +
        '</p><div class="life-options">' + item.choices.map(function (choice, i) {
          return '<button type="button" data-life-choice="' + i + '"><span class="life-letter">' + letters[i] +
            '</span><span>' + ruby(choice.text) + '</span></button>';
        }).join("") + '</div></section>');
    root.innerHTML = '<article class="life-inquiry">' + heading(item) +
      '<p class="life-situation">' + ruby(item.situation) + '</p>' + evidenceMarkup(item.evidence) + question +
      (index !== null ? responseMarkup(item, index, first, retry) : '') + '</article>';
    bindNav(root, item);
    root.querySelectorAll("[data-life-choice]").forEach(function (button) {
      button.addEventListener("click", function () {
        var selected = Number(button.dataset.lifeChoice);
        if (firstChoice(item) === null) window.SaveManager.recordLifeChoice(item.id, selected);
        detail(root, item, selected, retry, ".life-response h3");
      });
    });
    var again = root.querySelector("[data-life-retry]");
    if (again) again.addEventListener("click", function () { detail(root, item, null, true, ".life-question h3"); });
    root.querySelector(focusTarget).focus();
  }

  function render(root, caseId) {
    var cases = window.LIFE_CASES;
    if (!Object.prototype.hasOwnProperty.call(cases, caseId)) {
      list(root);
      root.querySelector("h2").focus();
      return;
    }
    var item = cases[caseId];
    detail(root, item, firstChoice(item), false, "h2");
  }
  window.LifeRenderer = { render: render };
}());
