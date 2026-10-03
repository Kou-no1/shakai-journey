(function () {
  "use strict";
  // Fill the old demonstration extras from related social studies banks, retaining provenance.
  var supplements = {
    s5_koku01: ["s5_koku02", "s5_koku04"], s5_koku03: ["s5_koku02", "s5_koku04"],
    s6_rek06: ["s6_rek07", "s6_rek05"], s6_rek11: ["s6_rek12", "s6_rek10"]
  };
  Object.keys(supplements).forEach(function (id) {
    var node = window.NODES_DATA[id], branches = node.branch ? node.branch.options.map(function (b) { return b.branchId; }) : [null];
    branches.forEach(function (branch) {
      var bank = branch ? window.QUESTION_BANK[id][branch] : window.QUESTION_BANK[id];
      supplements[id].forEach(function (sourceId) {
        var source = window.SocialQuestions.bank(sourceId, null, "extra");
        source.forEach(function (q) {
          if (bank.extra.length >= 15 || bank.extra.some(function (x) { return (x.stem || x.q) === q.stem; })) return;
          bank.extra.push(Object.assign({}, q, { id: id + (branch ? "-" + branch : "") + "-extra-" + String(bank.extra.length + 1).padStart(3, "0"),
            type: q.type, answer: q.type === "ox" ? q.answer === 0 : q.answer, sourceQuestionId: q.id, bonusCategory: "trivia", targetStage: "middle_or_trivia" }));
        });
      });
    });
  });
  Object.keys(window.QUESTION_BANK).forEach(function (id) {
    var node = window.NODES_DATA[id], banks = node.branch ? node.branch.options.map(function (b) { return window.QUESTION_BANK[id][b.branchId]; }) : [window.QUESTION_BANK[id]];
    banks.forEach(function (bank) {
      ["basic", "advanced", "extra"].forEach(function (tier) {
        (bank[tier] || []).forEach(function (q) {
          q.curriculumSource = window.SOCIAL_CURRICULUM.sources.curriculum;
          q.curriculumYear = 2017;
          if (!q.reviewStatus) q.reviewStatus = "pending_subject_review";
          if (!q.targetStage) q.targetStage = tier === "extra" ? "middle_or_trivia" : "elementary" + id.charAt(1);
          if (!q.contentVersion) q.contentVersion = 1;
          if (tier === "extra" && !q.bonusCategory) q.bonusCategory = "trivia";
        });
      });
    });
  });
}());
