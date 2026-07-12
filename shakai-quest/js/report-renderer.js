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
    return (window.LINES_DATA || []).map(function (line) {
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
