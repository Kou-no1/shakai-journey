(function () {
  "use strict";
  var esc = window.ShakaiUtil.esc;
  var eras = ["縄文・弥生・古墳", "飛鳥・奈良", "平安", "鎌倉", "室町", "戦国・安土桃山", "江戸", "江戸", "明治", "明治", "戦時下の記録", "戦後"];
  var modern = { 3: "s3_machi01", 4: "s4_ken01", 5: "s5_koku01", 6: "s6_sei01" };
  var epochs = ["now", "early", "castle"], chosen = "now";

  // Original paper-cut scenery, drawn on one continuous sky chart.
  var definitions = '<defs>' +
    '<pattern id="atlas-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0v32" fill="none" stroke="#88ceca" stroke-opacity=".12" stroke-width=".7"/></pattern>' +
    '<pattern id="atlas-strata" width="12" height="9" patternUnits="userSpaceOnUse"><path d="m0 8 7-4m1-2 4-2" stroke="#d8b27a" opacity=".36" fill="none"/></pattern>' +
    '<g id="atlas-pine"><path d="M0 0v-33" stroke="#534737" stroke-width="3"/><path d="m0-38-9 15 6-1-11 13 10-2-11 9h30l-12-10 10 2L3-25l6 2z" fill="#255b57"/><path d="m0-38-9 15 6-1-11 13 14-6z" fill="#79a989"/></g>' +
    '<g id="atlas-roof"><path d="m-15 0 17-11L23 0z" fill="#394f55"/><path d="m-10 0 27 0v12h-27z" fill="#e2bb85"/><path d="M0 3h6v9H0z" fill="#625044"/></g>' +
    '<g id="atlas-hut"><path d="M-21 4q0-12 21-33Q22-6 22 4l-22 5z" fill="#ce9b62"/><path d="m-1-28-15 28 12-5 6-23zm5 3 13 25-6 1z" fill="#a37549"/><path d="M-5 6q0-14 5-15 6 2 6 15z" fill="#503e39"/><path d="m-5-35 10 10m1-11-10 12" stroke="#775940" stroke-width="2"/></g>' +
    '<g id="atlas-wave" fill="none" stroke="#b7d6c6" opacity=".52"><path d="M0 0q8-4 17 0t18 0m7 0h12m-47 4h17"/></g>' +
    '</defs>';
  function use(id, x, y, scale) {
    return '<use href="#atlas-' + id + '" transform="translate(' + x + ' ' + y + ') scale(' + (scale || 1) + ')"/>';
  }
  function pines(points) { return points.map(function (p) { return use("pine", p[0], p[1], p[2]); }).join(""); }
  var clock = '<g transform="translate(488 108)" fill="none" stroke="#e7c58a"><circle r="101" stroke-width=".8"/><circle r="97" stroke-width="1.8"/><circle r="87" stroke-width=".7"/>' +
    Array.from({ length: 60 }, function (_, i) { return '<path d="M0-96v' + (i % 5 ? 3 : 8) + '" transform="rotate(' + i * 6 + ')" opacity="' + (i % 5 ? '.48' : '1') + '"/>'; }).join("") +
    '<g fill="#d7ca9d" stroke="none" text-anchor="middle" font-family="Georgia,serif" font-size="10"><text y="-71">XII</text><text x="75" y="4">III</text><text x="-75" y="4">IX</text></g>' +
    '<g class="atlas-hand"><path d="m0 0-42-35L-3-8 20-62 3-2z" fill="#e0b66e" stroke-width=".6"/><circle r="4" fill="#324e58"/></g></g>';
  var island = '<path d="m260 188 52 12 66 9 83 3 82 10 60-10 63-27-23 27-37 9-27 22-29-1-24 17-26-12-25 6-38-17-25 2-40-17-28 2-34-17z" fill="#715952"/>' +
    '<path d="m260 188 52 12 66 9 83 3 82 10 60-10 63-27-19 14-42 20-54 13-51-3-41 4-45-12-50-3-52-14z" fill="#c6a174"/>' +
    '<path d="m317 199 97 15-33 7-28-2zm145 12 81 11-20 36-23-12zm98 11 94-32-49 33-26 20z" fill="#4a4e50"/>' +
    '<path d="m283 197 88 13 184 14 86-27-39 26-29 17-49 17-66-22-40 3-72-25z" fill="url(#atlas-strata)"/>' +
    '<path d="m260 188 52-17 20-14 35-9 57-3 30-13 52 3 30 13 35 2 39 14 55 21-53 23-69 13-76-9-89-3-71-10z" fill="#87ab80"/>' +
    '<path d="m267 188 74-21 39 1 34-9 41 1 25-11 43 4 22 13 53-1 42 18-39 9-55 4-52 5-63-5-54 3-59-4z" fill="#b9bf8c"/>' +
    '<path d="M392 166q70-2 73 6t50 12q27 3 10 10t23 20l-18 8q-58-16-34-25t-14-12q-43-7-32-12t-58-7Z" fill="#79afac"/>' +
    '<path d="m539 221 11-3-4 25-7 11 2-18-4 8z" fill="#a8d6c6"/>';
  var mountains = '<path d="m201 166 59-30 23 2 46-60 21 18 11-10 47 49 37 9 18 14-80 17z" fill="#668883"/>' +
    '<path d="m262 155 67-77-7 30 13-8 14 18 9-4 23 28-29-14-20 3-18-13z" fill="#c1d2bc"/><path d="m329 78-25 43 15-10 7 3 9-14 14 18-9-25z" fill="#f4e4bd"/>' +
    '<path d="m216 166 70-26 22 4 25-16 20 8 21-12 40 28 57-16 57 29-51 13-133-2z" fill="#466e68"/>';
  var now = '<g stroke="#544c4c" stroke-width=".9"><path d="M408 163h16v-33h-16zm21-4h13v-47h-13zm17 1h21v-26h-21z" fill="#8cb2b1"/>' +
    '<path d="M411 135v21m5-21v20m16-39v36m4-36v33m14-11v17m6-18v16" fill="none" stroke="#e8dbb5" stroke-width="2.4"/>' +
    '<path d="m553 161 17-34 8-49 6 48 17 34-16-10-8-15-10 16z" fill="#c96b4c"/><path d="m570 126 14 0m-20 15h27m-18-33h10" stroke="#ffddab" stroke-width="3"/><path d="m578 78 0-14" stroke="#e0b675" stroke-width="2"/></g>' +
    use("roof",384,170,.7) + use("roof",600,177,.8) + pines([[350,182,.64],[370,178,.48],[620,180,.62]]) +
    '<g transform="rotate(-3 470 183)"><path d="M340 184h195v5H340z" fill="#584b4e"/><path d="M354 188v8m41-8v13m52-13v15m45-15v13m32-13v9" stroke="#8e755d" stroke-width="5"/>' +
    '<path d="M340 183v-7h196v7m-193-7 12 7 12-7 12 7 12-7 12 7 12-7 12 7 12-7 12 7 12-7 12 7 12-7 12 7 12-7 12 7" stroke="#bd654a" fill="none" stroke-width="2"/>' +
    '<path d="M365 175v-8q1-3 7-3h96q6 0 13 6l7 5z" fill="#efe6ca"/><path d="M368 171h111m-9-5 7 4h-10l-2-4z" stroke="#397d88" fill="#397d88"/><path d="M373 167h82" stroke="#365366" stroke-width="3" stroke-dasharray="5 2"/></g>';
  var early = pines([[376,173,.95],[394,167,.57],[434,160,.65],[610,172,.85],[626,182,.57],[337,186,.7]]) +
    '<path d="M473 163q1-9 24-15l28-8q34-26 70-9 20 11-8 22-13 5-31 4l-29 16z" fill="#708e64"/><path d="m480 157 39-12 14-9q28-15 49-5t-5 18q-16 4-23 1l-28 15z" fill="#9fba83"/>' +
    '<path d="M354 194q41-29 92-24t68 18m-100-16-13 17" fill="none" stroke="#e2c69b" stroke-width="5"/>' +
    use("hut",410,169,.74) + use("hut",446,181,.87) + use("hut",386,190,.9) +
    '<path d="m554 171 34-5 13 5-32 6zm18 8 33-6 11 5-34 7zm-42-2 20-4 14 6-20 4z" fill="#d3b76f"/>';
  var castle = pines([[367,181,.84],[383,175,.57],[618,176,.8],[639,184,.55]]) +
    '<g transform="translate(526 165)" stroke-linejoin="round"><path d="m-40 7 10-22h60l10 22-37 8z" fill="#7d8076"/><path d="m-30-15 28-6 32 6-30 5z" fill="#c1b497"/><path d="m-31-16 1-22h56v22L0-9z" fill="#f6e4ba"/><path d="m1-10 25-6v-21L1-31z" fill="#c2b59a"/><path d="m-40-34 11-3 13-13 27-4 23 15 9 2-40 11z" fill="#344f55"/><path d="m-40-34 43 7 40-10" fill="none" stroke="#d5ab71" stroke-width="2"/><path d="M-21-46v-16l40-3v19l-18 6z" fill="#eee0b7"/><path d="m-30-59 10-2 12-12 21-3 13 12 7 2-31 9z" fill="#38595b"/><path d="m-30-59 32 6 31-9" stroke="#d5ab71" fill="none" stroke-width="2"/><path d="m-12-72 0-12 24-2v15l-11 4z" fill="#f4e7c4"/><path d="m-21-82 8-2 10-12 6-1 12 11 8 2-21 7z" fill="#395459"/><path d="m-21-82 23 5 21-7m-24-14 4-4" stroke="#dbb575" fill="none" stroke-width="2"/><path d="M-23-28v7m8-6v7m8-5v7m-9-40v5m8-5v6m3-27v5" stroke="#4e5053" stroke-width="3.4"/></g>' +
    use("roof",415,178,.8) + use("roof",448,185,.75) + use("roof",584,176,.65) +
    '<path d="M394 190q35-19 65-7m13 2q15-14 33-9" fill="none" stroke="#e0c59a" stroke-width="4"/>';
  var ship = '<g class="atlas-ship"><g transform="translate(172 148) rotate(-8)">' +
    '<path d="m-45 2-16-7 6 13 15 3m78-6 34-8-22 17-11 2z" fill="#d4a66f"/><path d="M-46 3Q-8 16 55-1L40 18Q-4 37-38 15z" fill="#ae6b45" stroke="#f3cf8b" stroke-width="1.8"/><path d="M-37 14q34 14 80-4l-9 10q-34 12-61-1z" fill="#574a4b"/><path d="M-46 6q45 15 93-3" fill="none" stroke="#f5cf84" stroke-width="3"/>' +
    '<path d="M2 7v-79m-31 76-2-47" fill="none" stroke="#e8ba7d" stroke-width="2.5"/><path d="m3-67 51 56-52 9M2-64-36 1m6-41-23 39" fill="none" stroke="#d6b389" stroke-width="1.1"/>' +
    '<path d="M4-63q22 11 39 45-21-3-42 12 11-27 3-57Z" fill="#e18561"/><path d="M4-63q26 23 39 45l-13-2q-4-19-26-43z" fill="#bb5b50"/><path d="m4-48 15 14-14 12 5-13z" fill="#f6db9e"/><path d="M-28-40q11 6 19 26-14-1-28 8 10-18 9-34z" fill="#f3dba8"/>' +
    '<path d="m2-72 19 4-18 5z" fill="#e6b25b"/><path d="m-39 0 6-7 12 2 3 9z" fill="#477477" stroke="#d4b884"/><path d="M-18 17q15 4 35-1" stroke="#e2b477" fill="none" stroke-width="2"/></g></g>';
  function sky(epoch) {
    var stars = [[82,63],[124,43],[161,57],[195,28],[244,55],[300,27],[358,53],[638,42],[679,69],[708,41],[63,195],[111,208]];
    return '<svg class="atlas-plate" viewBox="0 0 720 268" aria-hidden="true" focusable="false">' + definitions +
      '<path d="M0 0h720v268H0z" fill="url(#atlas-grid)"/><g fill="none" stroke="#7cb9b7" opacity=".5" stroke-width=".8"><path d="m82 63 42-20 37 14 34-29m443 14 41 27 29-28M7 228Q223 36 585 55M32 239Q408 46 698 152" stroke-dasharray="3 5"/></g>' +
      stars.map(function (s,i) { return '<path d="M' + s[0] + ' ' + (s[1]-3) + 'l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="' + (i%3 ? '#a7cfca' : '#f5db9a') + '"/>'; }).join("") +
      clock + '<g fill="none" stroke="#afccba" opacity=".53" stroke-linecap="round"><path d="M220 100h51q12 0 16-7h30m-77 12h26m335 26h43q9 0 15-8h37m-72 13h29M65 170H26" /></g>' +
      mountains + island + ({now:now, early:early, castle:castle})[epoch] + use("wave",304,235,.8) + use("wave",616,216,.7) +
      '<path class="atlas-course" d="M10 201q87 16 132-28t97-30q52 12 85 39" fill="none" stroke="#edd095" stroke-width="1.5" stroke-dasharray="4 6"/>' +
      ship + '</svg>';
  }

  function render(grade, open) {
    var map = document.querySelector(".atlas-map");
    function select(epoch) {
      chosen = epoch;
      var id = epoch === "now" ? modern[grade] : epoch === "early" ? "s6_rek01" : "s6_rek06";
      var node = window.NODES_DATA[id], target = id;
      var available = window.SaveManager.hasQuestionBank(id);
      if (!available) target = null;
      else if (!window.SaveManager.isNodeUnlocked(id)) {
        var stops = window.MapRenderer.nodesForLine(node.lineId).filter(function (n) {
          return n.order < node.order && window.SaveManager.hasQuestionBank(n.nodeId) && window.SaveManager.isNodeUnlocked(n.nodeId);
        });
        target = stops.length ? stops[stops.length - 1].nodeId : null;
      }
      map.dataset.sky = epoch;
      map.querySelector("#atlas-number").textContent = "0" + (epochs.indexOf(epoch) + 1) + " / 03";
      map.querySelector("#atlas-picture").innerHTML = sky(epoch);
      map.querySelector("#atlas-target").textContent = "行き先　" + node.stationName + (!available ? "（近日公開）" : target === id ? "" : "（未開放）");
      map.querySelectorAll("[data-epoch]").forEach(function (button) { button.setAttribute("aria-pressed", String(button.dataset.epoch === epoch)); });
      var depart = map.querySelector("#atlas-go");
      depart.disabled = !target;
      depart.textContent = target === id ? "この駅へ旅立つ" : target ? window.NODES_DATA[target].stationName + "から進む" : available ? "未開放" : "近日公開";
      depart.onclick = function () {
        if (!target || !window.SaveManager.isNodeUnlocked(target)) return;
        open(target);
        var arrivalTicket = document.querySelector("#screen-node.active .arrival-ticket:not(.archive-ticket)");
        if (arrivalTicket) arrivalTicket.classList.add("time-crossing");
      };
    }
    map.querySelectorAll("[data-epoch]").forEach(function (b) { b.onclick = function () { select(b.dataset.epoch); }; });
    select(chosen);
  }

  function arrival(node) {
    var quiet = node.challengeStyle === "kikitori";
    var time = node.lineId === "s6_rek" ? eras[node.order - 1] : node.unitName;
    return '<div class="arrival-ticket' + (quiet ? ' archive-ticket' : '') + '">' +
      '<span class="arrival-stamp" aria-hidden="true">' + (quiet ? '史料' : '到着') + '</span>' +
      '<div><small>' + (quiet ? '資料目録' : '時空通行手形') + '　/　' + String(node.order).padStart(2,"0") + '</small>' +
      '<strong>' + esc(time) + '</strong></div><span class="arrival-art" aria-hidden="true">' + window.ShakaiIcons.stationBackground(node.nodeId) + '</span></div>';
  }
  var bookGrade, spread = 0;
  function bookStops(grade) {
    return window.LINES_DATA.filter(function (l) { return l.grade === grade; }).sort(function (a,b) { return a.order-b.order; })
      .flatMap(function (l) { return window.MapRenderer.nodesForLine(l.lineId); });
  }
  function bookTo(id) {
    bookGrade = window.LINES_DATA.find(function (l) { return l.lineId === window.NODES_DATA[id].lineId; }).grade;
    spread = Math.floor(bookStops(bookGrade).findIndex(function (node) { return node.nodeId === id; }) / 2);
  }
  function seal(id, acquired) {
    var node = window.NODES_DATA[id], quiet = node.challengeStyle === "kikitori";
    if (quiet) return '<span class="archive-record">' + (acquired ? "聞き取り済" : "未閲覧") + '</span>';
    return '<span aria-hidden="true" class="station-seal ' + (acquired ? 'inked' : 'empty-seal') + '">' +
      (acquired ? window.ShakaiIcons.stationBackground(id) + '<b>探訪認定</b>' : '未押印') + '</span>';
  }
  function renderBook(root, focus) {
    var save = window.SaveManager.data();
    if (!bookGrade) bookGrade = save.settings.lastGrade;
    var stops = bookStops(bookGrade);
    var pages = Math.ceil(stops.length / 2);
    root.innerHTML = '<header class="stamp-book-head"><h3>旅の御朱印</h3><label>学年 <select data-book-grade>' +
      [3,4,5,6].map(function (g) { return '<option value="' + g + '"' + (g === bookGrade ? ' selected' : '') + '>' + g + '年</option>'; }).join("") +
      '</select></label></header><div class="stamp-spread">' + stops.slice(spread*2,spread*2+2).map(function (node) {
        var got = save.progress[node.nodeId].advancedClear, quiet = node.challengeStyle === "kikitori";
        return '<article><small>' + (quiet ? '聞き取り記録' : '御朱印') + '　' + String(node.order).padStart(2,"0") + '</small>' +
          seal(node.nodeId,got) + '<strong>' + esc(node.stationName) + '</strong><small>' +
          (quiet ? '資料学習' : got ? '認定済み' : '認定を終えると押印') + '</small></article>';
      }).join("") + '</div><div class="stamp-turn"><button type="button" data-page="-1" aria-label="前の見開き"' + (spread ? '' : ' disabled') +
      '>←</button><span aria-live="polite">' + (spread+1) + ' / ' + pages + ' 見開き</span><button type="button" data-page="1" aria-label="次の見開き"' +
      (spread+1 < pages ? '' : ' disabled') + '>→</button></div>';
    root.querySelector("select").onchange = function (e) { bookGrade = Number(e.target.value); spread = 0; renderBook(root,"select"); };
    root.querySelectorAll("[data-page]").forEach(function (b) { b.onclick = function () {
      spread += Number(b.dataset.page); renderBook(root,'[data-page="' + b.dataset.page + '"]:enabled');
    }; });
    if (focus) (root.querySelector(focus) || root.querySelector("button:enabled") || root.querySelector("select")).focus({preventScroll:true});
  }
  window.TravelAtlas = { render: render, arrival: arrival, renderBook: renderBook, bookTo: bookTo, seal: seal };
}());
