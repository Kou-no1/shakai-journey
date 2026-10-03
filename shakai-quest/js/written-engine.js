(function () {
  "use strict";
  var state = null, root = null;
  function question(id) { return Object.prototype.hasOwnProperty.call(window.MIDDLE_WRITTEN, id) ? window.MIDDLE_WRITTEN[id] : null; }
  function persist() { window.SaveManager.data().activeSession = JSON.parse(JSON.stringify(state)); window.SaveManager.save(); }
  function start(targetRoot, id) {
    var q = question(id), save = window.SaveManager.data(); root = targetRoot;
    if (!q || window.SaveManager.status().protected) return false;
    if (save.activeSession && !save.activeSession.finished && !window.confirm("途中の学習を終了して、新しく始めますか？")) { window.ShakaiApp.resumeQuiz(); return true; }
    var previous = save.writtenRecords[id];
    state = { kind: "written", id: "written-session-" + Date.now().toString(36) + Math.random().toString(36).slice(2), questionId: id,
      courseId: q.courseId, content: JSON.parse(JSON.stringify(q)), response: previous ? previous.response : "",
      ratings: q.rubric.map(function () { return null; }), stage: "compose", finished: false };
    save.meta.lastPlayedAt = new Date().toISOString(); persist(); render(); return true;
  }
  function resume(targetRoot) {
    root = targetRoot;
    var save = window.SaveManager.data(), s = save.activeSession, q = s && question(s.questionId);
    var valid = s && s.kind === "written" && typeof s.id === "string" && q && s.courseId === q.courseId &&
      JSON.stringify(s.content) === JSON.stringify(q) && typeof s.response === "string" && s.response.length <= 2000 &&
      ["compose", "evaluate", "done"].includes(s.stage) && s.finished === (s.stage === "done") && Array.isArray(s.ratings) &&
      s.ratings.length === q.rubric.length && s.ratings.every(function (r) { return r === null || [0, 1, 2].includes(r); }) &&
      (s.stage === "compose" || !!s.response.trim()) && (s.stage !== "done" || s.ratings.every(function (r) { return r !== null; }));
    if (valid && s.stage === "done") valid = save.writtenRecords[s.questionId] && save.writtenRecords[s.questionId].sessionId === s.id;
    if (!valid) {
      if (s) save.meta.archivedSession = { archivedAt: new Date().toISOString(), session: s };
      save.activeSession = null; window.SaveManager.save();
      window.ShakaiApp.toast("記述課題が更新されたため、途中の課題を終了しました。保存済みの記録は残っています。"); return false;
    }
    state = s; render(); return true;
  }
  function draft(value) {
    if (!state || state.finished || state.stage !== "compose" || typeof value !== "string") return false;
    state.response = value.slice(0, 2000); persist(); return true;
  }
  function submit(value) {
    if (!state || state.finished || state.stage !== "compose") return false;
    if (typeof value === "string") draft(value);
    if (!state.response.trim()) { window.ShakaiApp.toast("考えたことを記入してください。"); return false; }
    state.stage = "evaluate"; persist(); render(); return true;
  }
  function rate(index, value) {
    if (!state || state.finished || state.stage !== "evaluate" || !Number.isInteger(index) || index < 0 || index >= state.ratings.length || ![0, 1, 2].includes(value)) return false;
    state.ratings[index] = value; persist(); return true;
  }
  function record() {
    if (!state || state.finished || state.stage !== "evaluate" || state.ratings.some(function (r) { return r === null; })) return false;
    var save = window.SaveManager.data(), previous = save.writtenRecords[state.questionId];
    if (previous && previous.sessionId === state.id) return false;
    save.writtenRecords[state.questionId] = { response: state.response, ratings: state.ratings.slice(), assessedAt: new Date().toISOString(),
      attempts: previous ? previous.attempts + 1 : 1, contentVersion: state.content.contentVersion, sessionId: state.id };
    state.stage = "done"; state.finished = true; persist(); render(); return true;
  }
  function revise() {
    if (!state || state.finished || state.stage !== "evaluate") return false;
    state.stage = "compose"; state.ratings = state.ratings.map(function () { return null; }); persist(); render(); return true;
  }
  function render() {
    var q = state.content, esc = window.ShakaiUtil.esc, ruby = window.SocialQuestions.ruby;
    root.innerHTML = '<section class="written-work"><div class="quiz-progress"><strong>記述・資料探究 / ' + esc(window.MIDDLE_COURSES[q.courseId].title) + '</strong><span>自己評価</span></div>' +
      '<div class="question-card"><h2 id="quiz-title" class="question-text">' + ruby(q.stem) + '</h2>' + window.QuizEngine.diagram(q) +
      (state.stage === "compose" ? '<label class="written-label" for="written-response">回答</label><textarea id="written-response" rows="8" maxlength="2000">' + esc(state.response) + '</textarea><div class="quiz-actions"><button class="primary-button" data-written-submit>回答を確かめる</button>' :
        '<h3>自分の回答</h3><p class="written-response">' + esc(state.response) + '</p><details class="model-answer" open><summary>模範解答例</summary><p>' + ruby(q.modelAnswer) + '</p></details><h3>採点観点・自己評価</h3>' +
        q.rubric.map(function (criterion, i) {
          return '<fieldset class="written-criterion"><legend>' + ruby(criterion) + '</legend>' + ["まだ書けていない", "一部書けた", "根拠とともに書けた"].map(function (label, v) {
            return '<label><input type="radio" name="criterion-' + i + '" value="' + v + '" data-criterion="' + i + '" ' + (state.ratings[i] === v ? 'checked ' : '') + (state.finished ? 'disabled' : '') + '>' + label + '</label>';
          }).join("") + '</fieldset>';
        }).join("") + (state.finished ? '<p class="written-saved" role="status">自己評価を保存しました：' + state.ratings.reduce(function (n, r) { return n + r; }, 0) + ' / 6</p><div class="quiz-actions">' : '<div class="quiz-actions"><button class="primary-button" data-written-record ' + (state.ratings.some(function (r) { return r === null; }) ? 'disabled' : '') + '>自己評価を保存</button><button class="ghost-button" data-written-revise>書き直す</button>')) +
      '<button class="ghost-button" data-written-back>' + (state.finished ? '中学の地図へ' : '中断して中学の地図へ') + '</button></div></div></section>';
    var input = root.querySelector("#written-response");
    if (state.stage === "compose") {
      input.addEventListener("input", function () { draft(input.value); });
      root.querySelector("[data-written-submit]").addEventListener("click", function () { submit(input.value); });
      input.focus({ preventScroll: true });
    } else if (!state.finished) {
      root.querySelectorAll("[data-criterion]").forEach(function (control) { control.addEventListener("change", function () {
        rate(Number(control.dataset.criterion), Number(control.value));
        root.querySelector("[data-written-record]").disabled = state.ratings.some(function (r) { return r === null; });
      }); });
      root.querySelector("[data-written-record]").addEventListener("click", record);
      root.querySelector("[data-written-revise]").addEventListener("click", revise);
      root.querySelector("[data-criterion]").focus({ preventScroll: true });
    } else root.querySelector("[data-written-back]").focus({ preventScroll: true });
    root.querySelector("[data-written-back]").addEventListener("click", function () {
      if (state.finished) { window.SaveManager.data().activeSession = null; window.SaveManager.save(); }
      else persist();
      window.ShakaiApp.openMiddle(q.courseId);
    });
  }
  window.WrittenEngine = { start: start, resume: resume, draft: draft, submit: submit, rate: rate, record: record, revise: revise, getState: function () { return state; } };
}());
