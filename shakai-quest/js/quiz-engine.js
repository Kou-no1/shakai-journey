(function () {
  "use strict";

  var esc = window.ShakaiUtil.esc;
  var state = null;

  function toast(message) {
    if (window.ShakaiApp && window.ShakaiApp.toast) window.ShakaiApp.toast(message);
  }

  function playTone(ok) {
    var save = window.SaveManager.data();
    if (!save.settings.sound || (!window.AudioContext && !window.webkitAudioContext)) return;
    if (navigator.userActivation && !navigator.userActivation.isActive) return;
    try {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      var ctx = new AudioCtx();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = ok ? 660 : 220;
      gain.gain.value = .04;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + .11);
      osc.addEventListener("ended", function () { ctx.close(); });
    } catch (err) {
      return;
    }
  }

  function playStamp(root) {
    var stamp = root.querySelector(".hanko-stamp-anim");
    var ring = root.querySelector(".impact-ring");
    if (!stamp || !ring) return;
    stamp.classList.remove("play");
    ring.classList.remove("play");
    void stamp.getBoundingClientRect();
    stamp.classList.add("play");
    window.setTimeout(function () {
      ring.classList.add("play");
    }, 380);
  }

  function getQuestions(nodeId, tier, branchId) {
    var bank = window.MapRenderer.bankFor(nodeId, branchId);
    return bank && Array.isArray(bank[tier]) ? bank[tier] : [];
  }

  function getCommonDrop(lineId, questionIndex) {
    var pool = (window.KAKERA_COMMON_POOL && window.KAKERA_COMMON_POOL[lineId]) || [];
    if (!pool.length || Math.random() >= .3) return null;
    return pool[questionIndex % pool.length];
  }

  function ownedKey(type) {
    return type === "item" ? "items" : type;
  }

  function grant(type, id, rewards) {
    if (!id) return false;
    var save = window.SaveManager.data();
    var key = ownedKey(type);
    if ((save.owned[key] || []).indexOf(id) !== -1) return false;
    window.SaveManager.grantCollectible(type, id);
    rewards.push(window.CollectionRenderer.getInfo(type, id).name);
    return true;
  }

  function firstMissing(type, ids) {
    var save = window.SaveManager.data();
    var owned = save.owned[ownedKey(type)] || [];
    return (ids || []).find(function (id) { return owned.indexOf(id) === -1; }) || (ids || [])[0] || null;
  }

  function branchOption() {
    var node = window.NODES_DATA[state.nodeId];
    return state.branchId ? window.MapRenderer.getBranchOption(node, state.branchId) : null;
  }

  function completeTier(root) {
    var node = window.NODES_DATA[state.nodeId];
    var patch = {};
    patch[state.tier + "Clear"] = true;
    if (state.tier === "extra" && state.correct === state.questions.length) patch.extraPerfectClear = true;
    window.SaveManager.setNodeProgress(state.nodeId, patch);
    var rewards = [];
    var branch = branchOption();

    if (state.tier === "basic") {
      grant("meibutsu", firstMissing("meibutsu", branch ? branch.meibutsuIds : node.meibutsuIds), rewards);
    }
    if (state.tier === "advanced") {
      if (node.challengeStyle === "kikitori") {
        grant("meibutsu", firstMissing("meibutsu", node.meibutsuIds || []), rewards);
      } else if (node.ijinId) {
        grant("ijin", node.ijinId, rewards);
      } else if (branch && branch.charaId) {
        grant("chara", branch.charaId, rewards);
      } else if (node.charaId) {
        grant("chara", node.charaId, rewards);
      } else if (state.nodeId === "s6_rek12") {
        grant("meibutsu", "m_tokyo_tower", rewards);
        grant("chara", "c_kenpoukun", rewards);
      }
    }
    if (state.tier === "extra" && state.correct === state.questions.length) {
      var nodeItems = Object.keys(window.ITEM_DATA || {}).filter(function (id) { return window.ITEM_DATA[id].nodeId === state.nodeId; });
      var allItems = Object.keys(window.ITEM_DATA || {});
      grant("item", firstMissing("item", nodeItems.length ? nodeItems : allItems), rewards);
    }

    renderResult(root, rewards);
    if (window.AchievementManager) window.AchievementManager.checkAchievements(true);
  }

  function tierLabel(tier, node) {
    if (tier === "basic") return "探検";
    if (tier === "advanced") return node.challengeStyle === "kikitori" ? "聞き取りチャレンジ" : "認定チャレンジ";
    return "もっと知りたい！";
  }

  function renderResult(root, rewards) {
    var node = window.NODES_DATA[state.nodeId];
    var isKikitori = state.tier === "advanced" && node.challengeStyle === "kikitori";
    var title = state.tier === "basic" ? "探検完了" : isKikitori ? "聞き取り完了" : state.tier === "extra" ? (state.correct === state.questions.length ? "全問正解" : "チャレンジ完了") : "はんこを受け取りました";
    var rewardHtml = rewards.length
      ? rewards.map(function (name) { return '<div class="result-line">入手: <strong>' + esc(name) + '</strong></div>'; }).join("")
      : '<div class="result-line">新しい節目報酬はありません。かけらとEXPは保存済みです。</div>';
    root.innerHTML = [
      '<section class="result-panel">',
      window.ShakaiIcons.resultStamp(isKikitori ? "資料" : "朱印", isKikitori),
      '<p class="eyebrow">', esc(node.stationName), '</p>',
      '<h2>', esc(title), '</h2>',
      '<p>正解 ', state.correct, ' / ', state.questions.length, ' 問</p>',
      '<div class="result-list">', rewardHtml, '</div>',
      '<div class="quiz-actions"><button class="ghost-button" type="button" data-action="node">駅へ戻る</button>',
      '<button class="primary-button" type="button" data-action="collection">資料館を見る</button></div>',
      '</section>'
    ].join("");
    root.querySelector('[data-action="node"]').addEventListener("click", function () { window.ShakaiApp.openNode(state.nodeId); });
    root.querySelector('[data-action="collection"]').addEventListener("click", function () { window.ShakaiApp.showTab("collection"); });
    playStamp(root);
  }

  function renderFeedback(root, ok, question) {
    root.querySelector(".feedback-slot").innerHTML = '<div class="feedback ' + (ok ? 'good' : 'bad') + '"><strong>' + (ok ? '正解' : 'もう一歩') + '</strong><br>' + esc(question.explain || "") + '</div>';
    root.querySelector(".quiz-actions").innerHTML = '<button class="primary-button" type="button" data-action="next">' + (state.index + 1 >= state.questions.length ? '結果を見る' : '次の問題') + '</button>';
    root.querySelector('[data-action="next"]').addEventListener("click", function () {
      state.index += 1;
      if (state.index >= state.questions.length) completeTier(root);
      else renderQuestion(root);
    });
  }

  function answer(root, selected) {
    if (state.answered) return;
    state.answered = true;
    var question = state.questions[state.index];
    var ok = question.type === "ox" ? selected === question.answer : Number(selected) === Number(question.answer);
    window.SaveManager.addKakera(1);
    window.SaveManager.recordAnswer(state.nodeId, state.tier, ok);
    toast("+1 たびのかけら");
    if (ok) {
      state.correct += 1;
      window.SaveManager.addExp(10);
      var drop = getCommonDrop(window.NODES_DATA[state.nodeId].lineId, state.index);
      if (drop) {
        window.SaveManager.addCommonItem(drop.id);
        toast("収蔵品: " + drop.name);
      }
    }
    playTone(ok);
    root.querySelectorAll(".choice-button").forEach(function (button) {
      button.disabled = true;
      var value = button.dataset.value;
      var isAnswer = question.type === "ox" ? value === String(question.answer) : Number(value) === Number(question.answer);
      if (isAnswer) button.classList.add("correct");
      if (value === String(selected) && !ok) button.classList.add("wrong");
    });
    renderFeedback(root, ok, question);
  }

  function choiceButtons(question) {
    if (question.type === "ox") return '<button class="choice-button" type="button" data-value="true">○ 正しい</button><button class="choice-button" type="button" data-value="false">× ちがう</button>';
    return (question.choices || []).map(function (choice, index) {
      return '<button class="choice-button" type="button" data-value="' + index + '">' + esc(choice) + '</button>';
    }).join("");
  }

  function renderQuestion(root) {
    state.answered = false;
    var node = window.NODES_DATA[state.nodeId];
    var question = state.questions[state.index];
    root.innerHTML = [
      '<section class="quiz-panel">',
      '<div class="quiz-progress"><span>', esc(tierLabel(state.tier, node)), '</span><span>', state.index + 1, ' / ', state.questions.length, '</span></div>',
      '<p class="eyebrow">', esc(node.stationName), '</p><h2 id="quiz-title">問題</h2>',
      '<p class="question-text">', esc(question.q), '</p>',
      '<div class="choice-grid', question.type === "ox" ? ' ox' : '', '">', choiceButtons(question), '</div>',
      '<div class="feedback-slot"></div>',
      '<div class="quiz-actions"><button class="ghost-button" type="button" data-action="quit">駅へ戻る</button></div>',
      '</section>'
    ].join("");
    root.querySelectorAll(".choice-button").forEach(function (button) {
      button.addEventListener("click", function () {
        var raw = button.dataset.value;
        answer(root, raw === "true" ? true : raw === "false" ? false : Number(raw));
      });
    });
    root.querySelector('[data-action="quit"]').addEventListener("click", function () { window.ShakaiApp.openNode(state.nodeId); });
  }

  function start(root, nodeId, tier, branchId) {
    var questions = getQuestions(nodeId, tier, branchId);
    if (!questions.length) {
      toast("このチャレンジは近日公開です");
      return false;
    }
    window.SaveManager.touchLastPlayed();
    state = { nodeId: nodeId, tier: tier, branchId: branchId || null, questions: questions.slice(), index: 0, correct: 0, answered: false };
    renderQuestion(root);
    return true;
  }

  window.QuizEngine = { start: start, getQuestions: getQuestions };
}());
