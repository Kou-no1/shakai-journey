(function () {
  "use strict";
  var esc = window.ShakaiUtil.esc;
  var encounterGrade = null, encounteredOnly = false;
  var notebookReason = "";
  function gearArt(slot) {
    var marks = { sword: '<path d="m25 58 29-38 7 6-30 36m-11-9 17 12m-7-3-9 14"/>', shield: '<path d="m20 23 20-9 20 9v24q-3 15-20 22-17-7-20-22Z"/>', armor: '<path d="m24 17 16 10 16-10 13 21-12 8v23H23V46l-12-8Z"/>', gauntlet: '<path d="M22 25h31v25l11 9-13 10H25V50l-8-9Z"/>' };
    return '<svg class="sq-icon" viewBox="0 0 80 80" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">' + marks[slot] + '</g></svg>';
  }
  function render(root) {
    var s = window.SaveManager.data();
    if (encounterGrade === null) encounterGrade = s.settings.lastGrade;
    var monsterIds = Object.keys(window.MONSTER_DATA).filter(function (id) {
      var m = window.MONSTER_DATA[id];
      return (!encounterGrade || Number(m.nodeId.charAt(1)) === encounterGrade) && (!encounteredOnly || s.owned.monsters.includes(id));
    });
    root.innerHTML = '<h2>装備・仲間</h2><div class="equipment-slots">' + window.SocialRPG.slots.map(function (slot) {
      var item = window.EQUIPMENT_DATA[s.player.equipped[slot]];
      return '<div class="equipment-slot">' + gearArt(slot) + '<strong>' + window.SocialRPG.slotLabels[slot] + '</strong><span>' + esc(item ? item.name : "未装備") + '</span><button class="ghost-button" data-unequip="' + slot + '" ' + (!item ? 'disabled' : '') + '>外す</button></div>';
    }).join("") + '</div><h3>手持ちの道具</h3><p>回復薬 ' + s.owned.consumables.potion + ' / ヒントの巻物 ' + s.owned.consumables.hint + '</p>' +
      '<h3>装備</h3><div class="collection-grid">' + s.owned.equipment.map(function (id) {
        var e = window.EQUIPMENT_DATA[id]; if (!e) return "";
        return '<article class="collection-card gear-card ' + (e.rarity === "rare" ? 'rare' : '') + (e.nodeId === "s6_rek11" ? ' somber' : '') + '">' + gearArt(e.slot) + '<h4>' + esc(e.name) + '</h4><p>' + esc(e.desc) + '</p><button class="primary-button" data-equip="' + esc(id) + '">' + (s.player.equipped[e.slot] === id ? '装備中' : '装備する') + '</button></article>';
      }).join("") + '</div><h3>同行する仲間 ' + s.activeCompanions.length + ' / 2</h3><div class="collection-grid">' + Array.from(new Set(s.owned.chara.concat(s.owned.companions))).map(function (id) {
        var c = window.COMPANION_DATA[id]; if (!c) return "";
        return '<article class="collection-card">' + (c.kind === "spirit" ? window.SocialRPG.art(id) : window.ShakaiIcons.render(c.svgKey || id, c.name)) + '<h4>' + esc(c.name) + '</h4><p>' + esc(c.flavor) + '</p><p>' + (window.COMPANION_EFFECTS[id].hintFree ? 'ヒントを1回使える' : '獲得EXP +5%') + '</p><button class="ghost-button" data-companion="' + esc(id) + '" ' + (s.activeCompanions.length >= 2 && !s.activeCompanions.includes(id) ? 'disabled' : '') + '>' + (s.activeCompanions.includes(id) ? '同行中・外す' : '同行する') + '</button></article>';
      }).join("") + '</div><h3>精の図鑑 ' + s.owned.monsters.length + ' / ' + Object.keys(window.MONSTER_DATA).length + '</h3>' +
      '<div class="encounter-controls"><label>学年<select id="encounter-grade">' + [0, 3, 4, 5, 6].map(function (g) { return '<option value="' + g + '" ' + (g === encounterGrade ? 'selected' : '') + '>' + (g ? g + '年' : 'すべて') + '</option>'; }).join("") + '</select></label><label><input type="checkbox" id="encounter-owned" ' + (encounteredOnly ? 'checked' : '') + '>出会った精</label></div><div class="collection-grid">' + monsterIds.map(function (id) {
        var m = window.MONSTER_DATA[id], got = s.owned.monsters.includes(id), available = window.SaveManager.isNodeUnlocked(m.nodeId);
        return '<article class="collection-card ' + (got ? '' : 'locked') + '">' + (got ? window.SocialRPG.art(id) : window.ShakaiIcons.silhouette("未遭遇")) + '<h4>' + esc(got ? m.name : "未遭遇") + '</h4><p>' + esc(window.NODES_DATA[m.nodeId].stationName) + '</p>' +
          (m.tier === "basic" ? '<button class="ghost-button" data-explore="' + esc(id) + '" ' + (!available ? 'disabled' : '') + '>この精を探す</button>' : '') + '</article>';
      }).join("") + '</div>';
    root.querySelector("#encounter-grade").addEventListener("change", function (e) { encounterGrade = Number(e.target.value); render(root); root.querySelector("#encounter-grade").focus(); });
    root.querySelector("#encounter-owned").addEventListener("change", function (e) { encounteredOnly = e.target.checked; render(root); root.querySelector("#encounter-owned").focus(); });
    root.querySelectorAll("[data-equip]").forEach(function (b) { b.addEventListener("click", function () { window.SocialRPG.equip(b.dataset.equip); render(root); }); });
    root.querySelectorAll("[data-unequip]").forEach(function (b) { b.addEventListener("click", function () { s.player.equipped[b.dataset.unequip] = null; window.SaveManager.save(); render(root); }); });
    root.querySelectorAll("[data-companion]").forEach(function (b) { b.addEventListener("click", function () { window.SocialRPG.companion(b.dataset.companion); render(root); }); });
    root.querySelectorAll("[data-explore]").forEach(function (b) { b.addEventListener("click", function () {
      var m = window.MONSTER_DATA[b.dataset.explore], p = window.SaveManager.getNodeProgress(m.nodeId);
      if (window.NODES_DATA[m.nodeId].branch && !p.branchChosen) return window.ShakaiApp.openNode(m.nodeId);
      window.ShakaiApp.startQuiz(m.nodeId, "basic", p.branchChosen, { mode: "learn", limit: 5, monsterId: m.id });
    }); });
  }
  function notebook(root) {
    var s = window.SaveManager.data(), rows = [], skills = {};
    Object.keys(window.NODES_DATA).forEach(function (id) {
      var node = window.NODES_DATA[id], branches = node.branch ? node.branch.options.map(function (b) { return b.branchId; }) : [null];
      branches.forEach(function (branch) { ["basic", "advanced", "extra"].forEach(function (tier) {
        window.SocialQuestions.bank(id, branch, tier).forEach(function (q) {
          var st = s.questionStats[q.id]; if (!st || !st.attempts) return;
          var skill = skills[q.skill] || { total: 0, correct: 0 }; skill.total += st.attempts; skill.correct += st.correct; skills[q.skill] = skill;
          rows.push({ q: q, st: st, nodeId: id, branchId: branch, tier: tier });
        });
      }); });
    });
    Object.keys(window.MIDDLE_COURSES).forEach(function (id) {
      var entry = window.MiddleCourses.entryFor(id, s);
      window.MiddleCourses.allQuestions(id).forEach(function (q) {
        var st = s.questionStats[q.id]; if (!st || !st.attempts) return;
        var skill = skills[q.skill] || { total: 0, correct: 0 }; skill.total += st.attempts; skill.correct += st.correct; skills[q.skill] = skill;
        rows.push({ q: q, st: st, nodeId: entry && entry.nodeId, branchId: entry && entry.branchId, tier: "extra", middleCourse: id, middleDifficulty: q.difficulty || "standard" });
      });
    });
    Object.values(window.MIDDLE_REVIEW_BANK).flat().forEach(function (q) {
      var st = s.questionStats[q.id]; if (!st || !st.attempts) return;
      var entry = window.MiddleCourses.entryFor(q.courseId), skill = skills[q.skill] || { total: 0, correct: 0 };
      skill.total += st.attempts; skill.correct += st.correct; skills[q.skill] = skill;
      rows.push({ q: q, st: st, nodeId: entry.nodeId, branchId: null, tier: "extra", middleCourse: q.courseId, middlePractice: q.practiceReason });
    });
    if (notebookReason) rows = rows.filter(function (row) { return !row.st.lastCorrect && row.st.lastMistake === notebookReason; });
    var reasons = window.MiddleCourses.reviewReasons(s);
    root.innerHTML = '<h2>学習ノート</h2><div class="skill-summary">' + Object.keys(window.SocialQuestions.skills).map(function (skill) {
      var st = skills[skill] || { total: 0, correct: 0 };
      return '<span>' + window.SocialQuestions.skills[skill] + ' <strong>' + (st.total ? Math.round(st.correct / st.total * 100) + '%' : '未記録') + '</strong></span>';
    }).join("") + '</div><label class="notebook-filter">復習の着目点<select data-mistake-filter><option value="">すべての記録</option>' + Object.keys(window.MiddleCourses.mistakeLabels).map(function (key) {
      return '<option value="' + key + '" ' + (notebookReason === key ? 'selected' : '') + '>' + esc(window.MiddleCourses.mistakeLabels[key]) + ' / ' + (reasons[key] || 0) + '問</option>';
    }).join("") + '</select></label>' + (rows.length ? '' : '<p>' + (notebookReason ? 'この着目点の復習候補はありません。' : 'まだ回答の記録がありません。') + '</p>') + '<div class="notebook-list">' + rows.sort(function (a, b) { return Number(a.st.lastCorrect) - Number(b.st.lastCorrect); }).map(function (row, i) {
      return '<article class="notebook-entry">' + (row.middleCourse ? '<p class="stage-label">' + esc(window.MiddleCourses.stageLabel(row.q.targetStage) + ' / ' + (row.middlePractice ? '別問題の復習' : window.MiddleCourses.difficulties[row.middleDifficulty])) + '</p>' : '') + '<strong>' + (row.st.lastCorrect ? '✓' : '✗') + ' ' + window.SocialQuestions.ruby(row.q.stem) + '</strong><p>回答 ' + row.st.attempts + ' / 正解 ' + row.st.correct + ' / ヒント ' + row.st.hints + '</p>' +
        (row.st.lastMistake ? '<p class="mistake-cue">着目点：' + esc(window.MiddleCourses.mistakeLabels[row.st.lastMistake]) + '</p>' : '') +
        '<details><summary>資料と解説</summary>' + window.QuizEngine.diagram(row.q) + '<p>' + window.SocialQuestions.ruby(row.q.explanation) + '</p>' + (row.q.evidence ? '<ol>' + row.q.evidence.map(function (text) { return '<li>' + window.SocialQuestions.ruby(text) + '</li>'; }).join("") + '</ol>' : '') + '</details><button class="ghost-button" data-review-node="' + i + '" ' + (row.nodeId ? '' : 'disabled') + '>' + (row.middleCourse ? 'この中学コースの誤答を学び直す' : 'この駅の誤答を学び直す') + '</button></article>';
    }).join("") + '</div>' + (!notebookReason ? window.MiddleRenderer.writtenNotebook(s) : '');
    root.querySelector("[data-mistake-filter]").addEventListener("change", function (e) { notebookReason = e.target.value; notebook(root); root.querySelector("[data-mistake-filter]").focus(); });
    root.querySelectorAll("[data-review-node]").forEach(function (b) { b.addEventListener("click", function () { var row = rows[Number(b.dataset.reviewNode)]; window.ShakaiApp.startQuiz(row.nodeId, row.tier, row.branchId, { review: true, mode: "learn", middlePortal: !!row.middleCourse, middleCourse: row.middleCourse || null, middleDifficulty: row.middleDifficulty, middlePractice: row.middlePractice, mistakeReason: notebookReason || null }); }); });
    root.querySelectorAll("[data-written-id]").forEach(function (b) { b.addEventListener("click", function () { window.ShakaiApp.startWritten(b.dataset.writtenId); }); });
    if (notebookReason) {
      var transfer = document.createElement("button"); transfer.className = "primary-button"; transfer.textContent = "同じ着目点の別問題に挑戦";
      transfer.addEventListener("click", function () { window.MiddleRenderer.launchPractice(notebookReason); }); root.appendChild(transfer);
    }
  }
  window.InventoryRenderer = { render: render, notebook: notebook, gearArt: gearArt };
}());
