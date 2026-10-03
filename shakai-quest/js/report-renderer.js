(function () {
  "use strict";

  var esc = window.ShakaiUtil.esc;

  function nodesForLine(lineId) {
    return Object.keys(window.NODES_DATA || {}).filter(function (nodeId) {
      return window.NODES_DATA[nodeId].lineId === lineId;
    }).sort(function (a, b) {
      return window.NODES_DATA[a].order - window.NODES_DATA[b].order;
    });
  }

  function basicClearCount(save, ids) {
    return ids.filter(function (nodeId) {
      return !!(save.progress[nodeId] && save.progress[nodeId].basicClear);
    }).length;
  }

  function rate(stats) {
    var total = Number(stats && stats.total) || 0;
    if (!total) return null;
    return Math.round(((Number(stats.correct) || 0) / total) * 100);
  }

  function formatDate(value) {
    if (!value) return "まだ記録がありません";
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return "まだ記録がありません";
    return date.toLocaleString("ja-JP", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function lineRows(save) {
    return (window.LINES_DATA || []).slice().sort(function (a, b) { return a.grade - b.grade || a.order - b.order; }).map(function (line) {
      var ids = nodesForLine(line.lineId);
      var clear = basicClearCount(save, ids);
      var percent = ids.length ? Math.round((clear / ids.length) * 100) : 0;
      return [
        '<div class="line-report-row">',
        '<span class="line-report-name">', esc(line.name), '</span>',
        '<div class="line-report-track"><div class="line-report-fill" style="width:', percent, '%;background:', esc(line.color), '"></div></div>',
        '<strong>', clear, '/', ids.length, '</strong>',
        '</div>'
      ].join("");
    }).join("");
  }

  function weakNodes(save) {
    return Object.keys(window.NODES_DATA || {}).map(function (nodeId) {
      var progress = save.progress[nodeId] || {};
      var percent = rate(progress.basicStats);
      if (percent == null || percent >= 70) return null;
      return { nodeId: nodeId, percent: percent, node: window.NODES_DATA[nodeId], total: progress.basicStats.total };
    }).filter(Boolean).sort(function (a, b) {
      return a.percent - b.percent || b.total - a.total;
    }).slice(0, 5);
  }

  function weakList(save) {
    var nodes = weakNodes(save);
    if (!nodes.length) return '<p class="report-note">今のところ、基礎の復習候補はありません。</p>';
    return '<ul class="report-weak-list">' + nodes.map(function (item) {
      return '<li><strong>' + esc(item.node.stationName) + '</strong><span>正答率 ' + item.percent + '%</span></li>';
    }).join("") + '</ul>';
  }

  function skillRows(save) {
    var grouped = {};
    Object.keys(window.SocialQuestions.skills).forEach(function (key) { grouped[key] = { correct: 0, total: 0 }; });
    Object.keys(window.NODES_DATA).forEach(function (id) {
      var node = window.NODES_DATA[id], branches = node.branch ? node.branch.options.map(function (b) { return b.branchId; }) : [null];
      branches.forEach(function (branch) {
        ["basic", "advanced", "extra"].forEach(function (tier) {
          window.SocialQuestions.bank(id, branch, tier).forEach(function (q) {
            var stats = save.questionStats[q.id]; if (!stats) return;
            grouped[q.skill].correct += stats.correct || 0; grouped[q.skill].total += stats.attempts || 0;
          });
        });
      });
    });
    Object.keys(window.MIDDLE_COURSES).forEach(function (id) {
      window.MiddleCourses.allQuestions(id).forEach(function (q) {
        var stats = save.questionStats[q.id]; if (!stats) return;
        grouped[q.skill].correct += stats.correct || 0; grouped[q.skill].total += stats.attempts || 0;
      });
    });
    return '<div class="skill-summary">' + Object.keys(grouped).map(function (key) {
      var s = grouped[key];
      return '<span>' + esc(window.SocialQuestions.skills[key]) + '<strong>' + (s.total ? Math.round(100 * s.correct / s.total) + '% / ' + s.total + '回答' : '記録なし') + '</strong></span>';
    }).join("") + '</div>';
  }

  function middleRows(save) {
    return '<table class="middle-report"><thead><tr><th scope="col">中学コース</th><th scope="col">習得</th><th scope="col">最高正解</th><th scope="col">完了</th></tr></thead><tbody>' + Object.keys(window.MIDDLE_COURSES).map(function (id) {
      var course = window.MIDDLE_COURSES[id];
      return Object.keys(window.MiddleCourses.difficulties).map(function (difficulty) {
        var p = window.MiddleCourses.progressFor(id, difficulty, save), count = window.MiddleCourses.bank(id, difficulty).length;
        return '<tr><th scope="row">' + esc(course.title) + '<small>' + esc(window.MiddleCourses.difficulties[difficulty]) + '</small></th><td>' + p.masteredQuestionIds.length + '/' + count + '</td><td>' + p.bestCorrect + '/' + count + '</td><td>' + (p.perfect ? '全問正解' : p.completed ? '完了' : '未完了') + '</td></tr>';
      }).join("");
    }).join("") + '</tbody></table>';
  }

  function render(root, onBack) {
    var save = window.SaveManager.data();
    var allIds = Object.keys(window.NODES_DATA || {});
    var clear = basicClearCount(save, allIds);
    var overall = allIds.length ? Math.round((clear / allIds.length) * 100) : 0;
    root.innerHTML = [
      '<section class="report-panel">',
      '<div class="report-top">',
      '<div><span>称号</span><strong>', esc(save.player.title || "見習い探検者"), '</strong></div>',
      '<div><span>レベル</span><strong>Lv.', save.player.level, '</strong></div>',
      '</div>',
      '<div class="overall-report">',
      '<div><span>全体の進み具合</span><strong>', clear, ' / ', allIds.length, '駅</strong></div>',
      '<div class="overall-report-track"><div class="overall-report-fill" style="width:', overall, '%"></div></div>',
      '</div>',
      '<section class="report-block"><h3>ライン別の進み具合</h3><div class="line-report-list">', lineRows(save), '</div></section>',
      '<section class="report-block"><h3>技能別の記録（学び直しを含む）</h3>', skillRows(save), '</section>',
      '<section class="report-block"><h3>中学発展の記録</h3>', middleRows(save), '</section>',
      '<section class="report-block"><h3>次に確かめたい考え方</h3>', Object.keys(window.MiddleCourses.reviewReasons(save)).map(function (key) {
        return '<p class="report-note">' + esc(window.MiddleCourses.mistakeLabels[key]) + ' / ' + window.MiddleCourses.reviewReasons(save)[key] + '問</p>';
      }).join("") || '<p class="report-note">今のところ、資料照合の復習候補はありません。</p>', '</section>',
      '<p class="report-note">3・4年は全国共通編です。地域の具体的な教材は対象地域の設定後に追加します。</p>',
      '<section class="report-block report-weak"><h3>もう一度挑戦してみるとよさそうな駅</h3>', weakList(save), '</section>',
      '<div class="report-footer"><span>最終プレイ</span><strong>', esc(formatDate(save.meta && save.meta.lastPlayedAt)), '</strong></div>',
      '<div class="report-actions no-print">',
      '<button class="ghost-button" type="button" data-action="back">設定へ戻る</button>',
      '<button class="primary-button" type="button" data-action="print">印刷する</button>',
      '</div>',
      '</section>'
    ].join("");
    root.querySelector('[data-action="print"]').addEventListener("click", function () { window.print(); });
    root.querySelector('[data-action="back"]').addEventListener("click", onBack);
  }

  window.ReportRenderer = { render: render, weakNodes: weakNodes };
}());
