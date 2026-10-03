(function () {
  "use strict";
  var state = null, root = null, audioContext = null;
  function sound(correct) {
    if (!window.SaveManager.data().settings.sound || window.NODES_DATA[state.nodeId].challengeStyle === "kikitori") return;
    try {
      var Audio = window.AudioContext || window.webkitAudioContext; if (!Audio) return;
      audioContext = audioContext || new Audio();
      audioContext.resume().catch(function () {});
      var tone = audioContext.createOscillator(), gain = audioContext.createGain(), now = audioContext.currentTime;
      tone.type = "sine"; tone.frequency.setValueAtTime(correct ? 660 : 220, now);
      gain.gain.setValueAtTime(.04, now); gain.gain.exponentialRampToValueAtTime(.001, now + .16);
      tone.connect(gain); gain.connect(audioContext.destination); tone.start(now); tone.stop(now + .17);
    } catch (err) { /* Audio is optional when the browser does not allow playback. */ }
  }
  function toast(text) { if (window.ShakaiApp) window.ShakaiApp.toast(text); }
  function getQuestions(id, tier, branch, options) {
    if (options && options.middleCourse) {
      var course = window.MiddleCourses.courseForSession(id, options.middleCourse, options);
      var bank = options.middlePractice ? (window.MiddleCourses.practiceCourse(options.middlePractice) === options.middleCourse && options.review ? window.MiddleCourses.practiceBank(options.middlePractice) : []) : window.MiddleCourses.bank(options.middleCourse, options.middleDifficulty);
      return tier === "extra" && course ? bank.map(function (q, i) {
        return window.SocialQuestions.normalize(q, id, tier, branch, i);
      }) : [];
    }
    return window.SocialQuestions.bank(id, branch, tier);
  }
  function plan(source, nodeId, tier, branch, options) {
    var s = window.SaveManager.data();
    if (options.review && !options.middlePractice) source = source.filter(function (q) {
      var stats = s.questionStats[q.id];
      return stats && !stats.lastCorrect && (!options.mistakeReason || stats.lastMistake === options.mistakeReason);
    });
    if (!source.length) return [];
    var limit = tier === "basic" && [5, 10].includes(Number(options.limit)) ? Number(options.limit) : source.length;
    if (tier === "advanced") limit = Math.min(10, source.length);
    if (tier === "basic" && limit < source.length && !options.review) {
      var key = nodeId + ":" + (branch || "all");
      var bag = (s.questionBags[key] || []).filter(function (id) { return source.some(function (q) { return q.id === id; }); });
      if (!bag.length) bag = window.SocialQuestions.shuffle(source).map(function (q) { return q.id; });
      var selected = bag.splice(0, limit); s.questionBags[key] = bag;
      return selected.map(function (id) { return source.find(function (q) { return q.id === id; }); }).map(window.SocialQuestions.prepare);
    }
    if (tier === "advanced") {
      var groups = {};
      window.SocialQuestions.shuffle(source).forEach(function (q) { (groups[q.subId] = groups[q.subId] || []).push(q); });
      var out = [], keys = window.SocialQuestions.shuffle(Object.keys(groups));
      while (out.length < limit) keys.forEach(function (k) { if (groups[k].length && out.length < limit) out.push(groups[k].pop()); });
      return window.SocialQuestions.shuffle(out).map(window.SocialQuestions.prepare);
    }
    return window.SocialQuestions.shuffle(source).slice(0, limit).map(window.SocialQuestions.prepare);
  }
  function persist() { window.SaveManager.data().activeSession = JSON.parse(JSON.stringify(state)); window.SaveManager.save(); }
  function start(targetRoot, nodeId, tier, branchId, options) {
    options = options || {}; root = targetRoot;
    var s = window.SaveManager.data(), node = window.NODES_DATA[nodeId];
    if (window.SaveManager.status().protected) { toast("元のセーブを保護中です。設定で書き出し・読み込みを確認してください。"); return false; }
    var portal = tier === "extra" && options.middlePortal === true && !!window.MiddleCourses.courseForSession(nodeId, options.middleCourse, options);
    if (!node || !["basic", "advanced", "extra"].includes(tier) || (!portal && !window.SaveManager.isNodeUnlocked(nodeId))) return false;
    var branch = node.branch && node.branch.options.find(function (b) { return b.branchId === branchId; });
    if (node.branch && !branch) return false;
    var p = window.SaveManager.routeProgress(nodeId, branchId);
    if (tier !== "basic" && !p.basicClear && !portal) return false;
    if (s.activeSession && !s.activeSession.finished && !options.replace) {
      if (!window.confirm("途中の冒険を終了して、新しく始めますか？")) { window.ShakaiApp.resumeQuiz(); return true; }
    }
    var questions = plan(getQuestions(nodeId, tier, branchId, options), nodeId, tier, branchId, options);
    if (!questions.length) { toast("学び直す問題はまだありません。"); return false; }
    if (branchId) window.SaveManager.chooseBranch(nodeId, branchId);
    var effects = window.SocialRPG.effects();
    var mode = options.review || node.challengeStyle === "kikitori" || options.mode === "learn" || (tier === "basic" && options.mode !== "challenge") ? "learn" : "challenge";
    var maxLives = 4 + (effects.hpUp || 0) + (tier === "basic" ? 0 : 1);
    state = { id: Date.now().toString(36) + Math.random().toString(36).slice(2), nodeId: nodeId, tier: tier, branchId: branchId || null,
      questions: questions, initialCount: questions.length, index: 0, firstCorrect: 0, pending: [], mode: mode, options: options, answered: false, selected: null,
      lives: maxLives, maxLives: maxLives, effects: effects, blockLeft: effects.block || 0, reviveLeft: effects.reviveOnce || 0,
      hintLeft: effects.hintFree || 0, comboKeepLeft: effects.comboKeep || 0, hiddenChoices: [], usedHint: false, streak: 0,
      monsterId: window.SocialRPG.choose(nodeId, tier, options.monsterId), wave: 0, enemyHp: 1, enemyMax: 1, finished: false };
    wave(); s.meta.lastPlayedAt = new Date().toISOString(); persist(); render(); return true;
  }
  function wave() {
    var count = state.tier === "basic" ? Math.min(5, state.initialCount - state.wave * 5) : state.initialCount;
    state.enemyMax = state.mode === "challenge" ? Math.ceil(count * .8) : count;
    state.enemyHp = state.enemyMax; window.SocialRPG.remember(state.monsterId, false);
  }
  function resume(targetRoot) {
    root = targetRoot;
    var stored = window.SaveManager.data().activeSession;
    if (!stored) return false;
    var source = window.NODES_DATA[stored.nodeId] && getQuestions(stored.nodeId, stored.tier, stored.branchId, stored.options);
    var valid = source && source.length && typeof stored.id === "string" && Array.isArray(stored.questions) && stored.questions.length &&
      Number.isInteger(stored.index) && stored.index >= 0 && stored.index < stored.questions.length && ["learn", "challenge"].includes(stored.mode) &&
      Array.isArray(stored.pending) && Array.isArray(stored.hiddenChoices) && stored.effects && stored.options &&
      ["initialCount", "firstCorrect", "lives", "maxLives", "enemyHp", "enemyMax", "wave", "blockLeft", "reviveLeft", "hintLeft", "comboKeepLeft", "streak"].every(function (k) { return Number.isFinite(stored[k]) && stored[k] >= 0; }) &&
      stored.initialCount > 0 && stored.initialCount <= source.length && stored.firstCorrect <= stored.initialCount && stored.lives <= stored.maxLives && stored.enemyHp <= stored.enemyMax &&
      stored.questions.length >= stored.initialCount && new Set(stored.questions.slice(0, stored.initialCount).map(function (q) { return q && q.id; })).size === stored.initialCount &&
      stored.questions.every(function (q, index) {
        var original = q && source.find(function (x) { return x.id === q.id; });
        return original && q.contentVersion === original.contentVersion && q.stem === original.stem && q.explanation === original.explanation &&
          q.type === original.type && q.skill === original.skill && q.targetStage === original.targetStage && JSON.stringify(q.diagramData) === JSON.stringify(original.diagramData) &&
          JSON.stringify(q.sourceMaterials) === JSON.stringify(original.sourceMaterials) && JSON.stringify(q.evidence) === JSON.stringify(original.evidence) && q.difficulty === original.difficulty &&
          !!q.isRetry === (index >= stored.initialCount) &&
          Array.isArray(q.choices) && q.choices.length === original.choices.length && Number.isInteger(q.answer) &&
          JSON.stringify(q.choices.slice().sort()) === JSON.stringify(original.choices.slice().sort()) && q.choices[q.answer] === original.choices[original.answer] &&
          (!original.choiceReasons ? !q.choiceReasons : Array.isArray(q.choiceReasons) && q.choiceReasons.length === original.choices.length && q.choices.every(function (c, i) { return q.choiceReasons[i] === original.choiceReasons[original.choices.indexOf(c)]; }));
      }) && stored.pending.every(function (id) { return source.some(function (q) { return q.id === id; }); });
    if (valid && stored.answered && !stored.finished) valid = Number.isInteger(stored.selected) && stored.selected >= 0 && stored.selected < stored.questions[stored.index].choices.length;
    if (valid) valid = stored.hiddenChoices.every(function (i) { return Number.isInteger(i) && i >= 0 && i < stored.questions[stored.index].choices.length && i !== stored.questions[stored.index].answer; });
    if (valid && stored.finished) valid = stored.result && Array.isArray(stored.result.rewards) && typeof stored.result.success === "boolean";
    if (!valid) {
      window.SaveManager.data().meta.archivedSession = { archivedAt: new Date().toISOString(), session: stored };
      window.SaveManager.data().activeSession = null; window.SaveManager.save();
      toast("問題が更新されたため途中の冒険を終了しました。学習記録は残っています。"); return false;
    }
    state = stored; render(); return true;
  }
  function current() { return state && state.questions[state.index]; }
  function answer(targetRoot, selected) {
    if (!state || state.answered || state.finished) return;
    var q = current(); selected = Number(selected);
    if (!Number.isInteger(selected) || selected < 0 || selected >= q.choices.length || state.hiddenChoices.includes(selected)) return;
    root = targetRoot || root;
    var ok = selected === q.answer, s = window.SaveManager.data(), p = window.SaveManager.routeProgress(state.nodeId, state.branchId);
    state.answered = true; state.selected = selected;
    var qs = s.questionStats[q.id] || { attempts: 0, correct: 0, hints: 0, reviews: 0 };
    qs.attempts++; if (ok) qs.correct++; if (q.isRetry || state.options.review) qs.reviews++;
    qs.lastCorrect = ok; qs.lastAttemptAt = new Date().toISOString(); qs.contentVersion = q.contentVersion; s.questionStats[q.id] = qs;
    qs.lastMistake = !ok && q.choiceReasons ? q.choiceReasons[selected] : null;
    if (state.tier === "basic") {
      if (!p.seenQuestionIds.includes(q.id)) p.seenQuestionIds.push(q.id);
      if (ok && !p.masteredQuestionIds.includes(q.id)) p.masteredQuestionIds.push(q.id);
    }
    if (!q.isRetry) {
      if (state.options.middleCourse) {
        var mp = state.options.middlePractice ? window.SaveManager.getPracticeProgress(state.options.middlePractice) : window.SaveManager.getMiddleProgress(state.options.middleCourse, state.options.middleDifficulty);
        if (!state.options.review || state.options.middlePractice) { mp.stats.total++; if (ok) mp.stats.correct++; mp.stats.lastAttemptAt = qs.lastAttemptAt; }
        if (!mp.seenQuestionIds.includes(q.id)) mp.seenQuestionIds.push(q.id);
      } else {
        var st = p[state.tier + "Stats"]; st.total++; if (ok) st.correct++; st.lastAttemptAt = qs.lastAttemptAt;
        if (state.branchId) { var globalStats = s.progress[state.nodeId][state.tier + "Stats"]; globalStats.total++; if (ok) globalStats.correct++; globalStats.lastAttemptAt = qs.lastAttemptAt; }
      }
      if (ok) state.firstCorrect++;
      if (!state.options.review) {
        s.owned.kakeraCount++; toast("+1 たびのかけら");
        if (ok) {
          s.player.exp += Math.round((10 + Math.min(state.streak, 5) * (state.effects.comboUp || 0)) * (1 + (state.effects.expRate || 0)));
          var pool = window.KAKERA_COMMON_POOL[window.NODES_DATA[state.nodeId].lineId] || [];
          if (pool.length && Math.random() < .3) { var drop = pool[Math.floor(Math.random() * pool.length)]; s.owned.commonItems[drop.id] = (s.owned.commonItems[drop.id] || 0) + 1; toast(drop.name + "を入手"); }
        }
      }
    }
    if (state.options.middleCourse && ok) {
      var middle = state.options.middlePractice ? window.SaveManager.getPracticeProgress(state.options.middlePractice) : window.SaveManager.getMiddleProgress(state.options.middleCourse, state.options.middleDifficulty);
      if (!middle.masteredQuestionIds.includes(q.id)) middle.masteredQuestionIds.push(q.id);
    }
    if (ok) {
      state.streak++;
      var critChance = Math.min(.75, (.1 + (state.effects.critUp || 0)) * (state.effects.doubleCrit ? 2 : 1));
      var damage = 1 + (Math.random() < critChance ? 1 : 0);
      state.enemyHp = Math.max(0, state.enemyHp - damage);
      if (state.enemyHp === 0) window.SocialRPG.remember(state.monsterId, true);
    } else {
      if (state.mode === "learn") state.pending.push(q.id);
      else if (state.blockLeft > 0) state.blockLeft--;
      else { state.lives--; if (state.lives === 0 && state.reviveLeft > 0) { state.reviveLeft--; state.lives = 1; } }
      if (state.comboKeepLeft > 0) state.comboKeepLeft--; else state.streak = 0;
    }
    persist(); render(); sound(ok);
  }
  function advance() {
    if (!state || !state.answered || state.finished) return;
    if (state.mode === "challenge" && state.lives === 0) return finish();
    state.index++;
    if (state.index >= state.questions.length) {
      if (state.mode === "learn" && state.pending.length) {
        state.pending.forEach(function (id) { var q = state.questions.find(function (x) { return x.id === id; }); state.questions.push(Object.assign({}, q, { isRetry: true })); });
        state.pending = [];
      } else { state.index--; return finish(); }
    }
    if (state.tier === "basic" && state.index < state.initialCount && state.index % 5 === 0) {
      state.wave++; state.monsterId = window.SocialRPG.choose(state.nodeId, state.tier); wave();
    }
    state.answered = false; state.selected = null; state.hiddenChoices = []; persist(); render();
    var first = root.querySelector(".choice-button:not(:disabled)"); if (first) first.focus({ preventScroll: true });
  }
  function finish() { window.SocialRewards.complete(state); persist(); render(); if (window.AchievementManager) window.AchievementManager.checkAchievements(window.NODES_DATA[state.nodeId].challengeStyle !== "kikitori"); }
  function useItem(id) {
    if (!state || state.answered || state.finished) return;
    var s = window.SaveManager.data(), q = current();
    if (id === "potion") {
      if (state.mode !== "challenge" || state.lives >= state.maxLives || s.owned.consumables.potion <= 0) return;
      s.owned.consumables.potion--; state.lives = Math.min(state.maxLives, state.lives + 2);
    } else if (id === "hint") {
      if (q.type !== "mc4" || state.hiddenChoices.length || (state.hintLeft <= 0 && s.owned.consumables.hint <= 0)) return;
      if (state.hintLeft > 0) state.hintLeft--; else s.owned.consumables.hint--;
      state.hiddenChoices = window.SocialQuestions.shuffle(q.choices.map(function (_, i) { return i; }).filter(function (i) { return i !== q.answer; })).slice(0, 2);
      state.usedHint = true; var qs = s.questionStats[q.id] || { attempts: 0, correct: 0, hints: 0, reviews: 0 }; qs.hints++; s.questionStats[q.id] = qs;
    } else return;
    persist(); render();
  }
  function label() {
    if (state.options.middlePractice) return "別問題の復習 / " + window.MiddleCourses.mistakeLabels[state.options.middlePractice];
    if (state.options.middleCourse) return "中学発展・" + window.MiddleCourses.difficulties[state.options.middleDifficulty || "standard"] + " / " + window.MIDDLE_COURSES[state.options.middleCourse].title;
    var node = window.NODES_DATA[state.nodeId];
    if (node.challengeStyle === "kikitori") return state.tier === "basic" ? "資料の探究" : state.tier === "extra" ? "関連する資料" : "聞き取りチャレンジ";
    return state.tier === "basic" ? "洞窟・基本" : state.tier === "extra" ? "おまけ・先取り" : "城・認定チャレンジ";
  }
  function diagram(q) {
    if (q.sourceMaterials) return '<div class="source-materials">' + q.sourceMaterials.map(function (d) {
      return diagram({ diagramData: d });
    }).join("") + '</div>';
    if (!q.diagramData) return "";
    var d = q.diagramData, esc = window.ShakaiUtil.esc;
    var caption = d.fictional ? (d.title ? d.title + " / " : "") + "学習用の架空データ" : (d.title || "資料") +
      (d.learningSummary ? " / 学習用の要約（原文の引用ではありません）" : "") + " / 出典: " + (d.sourceName || d.source) +
      (d.learningSummary ? " / 確認年: " : " / 基準年: ") + d.referenceYear;
    if (d.kind === "text") return '<figure class="question-data"><figcaption>' + esc(caption) + '</figcaption><p>' + esc(d.text) + '</p></figure>';
    return '<figure class="question-data"><figcaption>' + esc(caption) + '</figcaption><table><thead><tr>' + d.headers.map(function (h) { return '<th scope="col">' + esc(h) + '</th>'; }).join("") + '</tr></thead><tbody>' + d.rows.map(function (r) { return '<tr>' + r.map(function (v) { return '<td>' + esc(v) + '</td>'; }).join("") + '</tr>'; }).join("") + '</tbody></table></figure>';
  }
  function render() {
    if (state.finished) return renderResult();
    var q = current(), esc = window.ShakaiUtil.esc, ruby = window.SocialQuestions.ruby;
    var node = window.NODES_DATA[state.nodeId], somber = node.challengeStyle === "kikitori", monster = window.MONSTER_DATA[state.monsterId];
    root.innerHTML = '<section class="rpg-quiz ' + (somber ? 'somber' : '') + '"><div class="quiz-progress"><strong>' + esc(label()) + '</strong><span>' + (q.isRetry ? '学び直し' : (state.index + 1) + ' / ' + state.initialCount) + '</span></div>' +
      '<div class="battle-stage" data-battle-stage><span class="battle-mode">' + (state.mode === "learn" ? "学び直し" : "RPG挑戦") + '</span><div data-enemy-art>' + window.SocialRPG.art(state.monsterId) + '</div><strong>' + esc(monster ? monster.name : "聞き取り資料") + '</strong>' +
      (somber ? '' : '<div class="enemy-hp"><span>HP ' + state.enemyHp + ' / ' + state.enemyMax + '</span><progress value="' + state.enemyHp + '" max="' + state.enemyMax + '" aria-label="挑戦相手のHP"></progress></div>') +
      (state.mode === "challenge" ? '<div class="life-count">ライフ ' + state.lives + ' / ' + state.maxLives + '</div>' : '') + '</div>' +
      '<div class="question-card"><p class="eyebrow">' + esc(node.stationName) + ' / ' + esc(window.SocialQuestions.skills[q.skill]) + '</p><h2 id="quiz-title" class="question-text">' + ruby(q.stem) + '</h2>' +
      (state.tier === "extra" ? '<p class="stage-label">' + esc(window.MiddleCourses.stageLabel(q.targetStage) || (q.targetStage === "middle_or_trivia" ? "中学・社会トリビア" : q.targetStage.replace("elementary", "小学") + "年の先取り")) + '</p>' : '') + diagram(q) +
      '<div class="choice-grid ' + (q.type === "ox" ? 'ox' : '') + '">' + q.choices.map(function (c, i) { return '<button class="choice-button ' + (state.answered && i === q.answer ? 'correct' : state.answered && i === state.selected ? 'wrong' : '') + '" type="button" data-value="' + i + '" ' + (state.answered || state.hiddenChoices.includes(i) ? 'disabled' : '') + '>' + (state.hiddenChoices.includes(i) ? 'ヒントで除外' : ruby(c)) + '</button>'; }).join("") + '</div>' +
      (state.answered ? '<div class="feedback ' + (state.selected === q.answer ? 'good' : 'bad') + '" role="status"><strong>' + (state.selected === q.answer ? '✓ 正解' : '✗ 確かめよう') + '</strong><p>' + ruby(q.explanation) + '</p>' +
        (q.choiceReasons && state.selected !== q.answer ? '<p class="mistake-cue">着目点：' + esc(window.MiddleCourses.mistakeLabels[q.choiceReasons[state.selected]]) + '</p>' : '') +
        (q.evidence ? '<details class="evidence-details" open><summary>根拠を照合</summary><ol>' + q.evidence.map(function (text) { return '<li>' + ruby(text) + '</li>'; }).join("") + '</ol></details>' : '') + '</div>' : '') +
      '<div class="quiz-actions">' + (state.answered ? '<button class="primary-button" data-action="next">次へ</button>' : '<button class="ghost-button" data-item="hint" ' + (q.type !== "mc4" || state.hiddenChoices.length ? 'disabled' : '') + '>ヒント</button>' + (state.mode === "challenge" ? '<button class="ghost-button" data-item="potion">回復</button>' : '')) + '<button class="ghost-button" data-action="quit">中断して地図へ</button></div></div></section>';
    root.querySelectorAll(".choice-button").forEach(function (b) { b.addEventListener("click", function () { answer(root, b.dataset.value); }); });
    var next = root.querySelector('[data-action="next"]'); if (next) next.addEventListener("click", advance);
    root.querySelectorAll("[data-item]").forEach(function (b) { b.addEventListener("click", function () { useItem(b.dataset.item); }); });
    root.querySelector('[data-action="quit"]').addEventListener("click", function () { persist(); window.ShakaiApp.showTab(state.options.middlePortal ? "middle" : "map"); });
    var control = root.querySelector(state.answered ? '[data-action="next"]' : '.choice-button:not(:disabled)');
    if (control) control.focus({ preventScroll: true });
  }
  function renderResult() {
    var r = state.result, esc = window.ShakaiUtil.esc, node = window.NODES_DATA[state.nodeId];
    var branch = node.branch && node.branch.options.find(function (b) { return b.branchId === state.branchId; });
    var chara = window.CHARA_DATA[branch ? branch.charaId : node.charaId || (state.nodeId === "s6_rek12" ? "c_kenpoukun" : null)];
    var person = window.IJIN_DATA[node.ijinId];
    var guide = state.tier === "advanced" && r.success && node.challengeStyle !== "kikitori" && (person || chara);
    var guideHTML = guide ? '<div class="result-guide">' + window.ShakaiIcons.render(guide.svgKey || (person ? node.ijinId : branch ? branch.charaId : node.charaId || "c_kenpoukun"), guide.name) + '<div><strong>' + esc(guide.name) + '</strong><p>' + esc(guide.achievement || guide.flavor) + '</p></div></div>' : '';
    root.innerHTML = '<section class="result-panel"><h2 id="quiz-title">' + (r.success ? (state.options.middleCourse ? (state.options.review ? '中学発展の復習完了' : '中学発展コース完了') : node.challengeStyle === "kikitori" ? '資料学習完了' : r.completed ? 'クエスト完了' : 'コース完了') : 'もう一度確かめよう') + '</h2>' +
      (r.completed ? window.ShakaiIcons.resultStamp(node.challengeStyle === "kikitori" ? "資料" : "探究", node.challengeStyle === "kikitori") : '') +
      '<p>初回の正解 ' + r.firstCorrect + ' / ' + r.total + ' 問</p>' + (state.tier === "basic" ? '<p>基本の習得 ' + r.mastery + ' / ' + r.bankSize + ' 問</p>' : '') +
      (state.options.middleCourse ? '<p>' + esc(window.MIDDLE_COURSES[state.options.middleCourse].title) + ' / ' + esc(state.options.middlePractice ? window.MiddleCourses.mistakeLabels[state.options.middlePractice] : window.MiddleCourses.difficulties[state.options.middleDifficulty || "standard"]) + ' / ' + (state.options.review ? '復習記録を保存しました' : r.perfect ? '初回全問正解・ヒントなし' : '学習記録を保存しました') + '</p>' : '') +
      guideHTML + '<ul class="result-list">' + r.rewards.map(function (text) { return '<li>' + esc(text) + '</li>'; }).join("") + '</ul><div class="quiz-actions"><button class="primary-button" data-action="node">駅へ戻る</button><button class="ghost-button" data-action="collection">資料館へ</button></div></section>';
    if (state.options.middlePortal) root.querySelector('[data-action="node"]').textContent = "中学の地図へ";
    root.querySelector('[data-action="node"]').addEventListener("click", function () { window.SaveManager.data().activeSession = null; window.SaveManager.save(); if (state.options.middlePortal) window.ShakaiApp.openMiddle(state.options.middleCourse); else window.ShakaiApp.openNode(state.nodeId); });
    root.querySelector('[data-action="collection"]').addEventListener("click", function () { window.SaveManager.data().activeSession = null; window.SaveManager.save(); window.ShakaiApp.showTab("collection"); });
    if (node.challengeStyle !== "kikitori") root.querySelectorAll(".hanko-stamp-anim,.impact-ring").forEach(function (el) { el.classList.add("play"); });
  }
  window.QuizEngine = { start: start, resume: resume, getQuestions: getQuestions, answer: answer, advance: advance, useItem: useItem,
    getState: function () { return state; }, plan: plan, diagram: diagram };
}());
