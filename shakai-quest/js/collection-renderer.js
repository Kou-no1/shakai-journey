(function () {
  "use strict";

  var esc = window.ShakaiUtil.esc;
  var FALLBACK_NAMES = {
    m_alps_badge: "日本アルプスバッジ", m_uonzu_card: "雨温図カード", m_shiisaa: "シーサー", m_ryuhyou_goods: "流氷グッズ",
    m_oshinagaki: "お品書きカード", m_shinmai_badge: "新米バッジ", m_taue_model: "田植え機模型", m_sengyo_set: "鮮魚セット",
    m_teichiami_model: "定置網模型", m_chisan_badge: "地産地消バッジ", m_kengaku_pass: "工場見学パス", m_minicar: "ミニカー",
    m_line_diorama: "組立ラインジオラマ", m_container_model: "コンテナ船模型", m_robot_arm: "ロボットアーム模型",
    m_news_script: "ニュース原稿", m_camera_model: "カメラ模型", m_pos_model: "POSレジ模型", m_moral_badge: "情報モラルバッジ",
    m_bousai_set: "防災グッズセット", m_mokkouhin: "木工品", m_donguri_badge: "どんぐりバッジ", m_recycle_badge: "リサイクルバッジ",
    m_kenpou_badge: "憲法三原則バッジ", m_touhyou_model: "投票箱模型", m_sanken_card: "三権分立カード",
    m_kosodate_badge: "支援バッジ", m_fukkou_card: "まちづくりカード", m_jomon_doki: "縄文土器", m_haniwa: "埴輪レプリカ",
    m_daibutsu: "大仏ミニチュア", m_junihitoe: "十二単ミニチュア", m_ougi: "扇", m_katchu: "甲冑ミニチュア",
    m_kinkaku_ginkaku: "金閣・銀閣ミニチュア", m_sankinkoutai_kago: "参勤交代の駕籠模型", m_ukiyoe: "浮世絵レプリカ",
    m_tetsudou_model: "鉄道模型", m_jouyaku_medal: "条約改正記念メダル", m_tokyo_tower: "東京タワー模型",
    m_kokki_collection: "国旗コレクション", m_kokuren_badge: "国連バッジ", m_sdgs_pin: "SDGsピンズ",
    i_himiko: "卑弥呼", i_shotoku: "聖徳太子", i_michinaga: "藤原道長", i_yoritomo: "源頼朝", i_yoshimasa: "足利義政",
    i_ieyasu: "徳川家康", i_sugita: "杉田玄白", i_saigou: "西郷隆盛", i_mutsu: "陸奥宗光",
    c_yamakawa_annainin: "山と川の案内人", c_kisho_meijin: "気象名人", c_nangoku_meijin: "南国名人",
    c_yukiguni_meijin: "雪国名人", c_shokutaku_annainin: "食卓の案内人", c_okome_meijin: "お米名人",
    c_ryou_meijin: "漁の名人", c_mirai_nouka: "未来農家", c_monozukuri_annainin: "ものづくり案内人",
    c_jidosha_meijin: "自動車名人", c_boueki_meijin: "貿易名人", c_mirai_gijutsusha: "未来技術者",
    c_housou_annainin: "放送局の案内人", c_data_meijin: "データ名人", c_moral_annainin: "モラル案内人",
    c_bousai_meijin: "防災名人", c_mori_meijin: "森の名人", c_eco_meijin: "エコ名人"
  };

  function uniqPush(list, id) {
    if (id && list.indexOf(id) === -1) list.push(id);
  }

  function collectIds(type, save) {
    var ids = [];
    Object.keys(window.NODES_DATA || {}).forEach(function (nodeId) {
      var node = window.NODES_DATA[nodeId];
      var progress = save.progress[nodeId] || {};
      if (type === "meibutsu") (node.meibutsuIds || []).forEach(function (id) { uniqPush(ids, id); });
      if (type === "ijin" && node.ijinId) uniqPush(ids, node.ijinId);
      if (type === "chara" && node.charaId) uniqPush(ids, node.charaId);
      if (node.branch && node.branch.options) {
        node.branch.options.forEach(function (option) {
          if (progress.branchChosen && progress.branchChosen !== option.branchId) return;
          if (type === "meibutsu") (option.meibutsuIds || []).forEach(function (id) { uniqPush(ids, id); });
          if (type === "chara") uniqPush(ids, option.charaId);
        });
      }
    });
    if (type === "item") Object.keys(window.ITEM_DATA || {}).forEach(function (id) { uniqPush(ids, id); });
    return ids;
  }

  function dataSet(type) {
    if (type === "meibutsu") return window.MEIBUTSU_DATA || {};
    if (type === "ijin") return window.IJIN_DATA || {};
    if (type === "chara") return window.CHARA_DATA || {};
    return window.ITEM_DATA || {};
  }

  function getInfo(type, id) {
    var source = dataSet(type)[id] || {};
    return {
      id: id,
      name: source.name || FALLBACK_NAMES[id] || id,
      desc: source.trivia || source.achievement || source.flavor || source.desc || "これからの旅で見つかる収蔵品です。",
      sub: source.era || source.role || source.effect || source.rarity || "未収集",
      svgKey: source.svgKey || id,
      placeholder: !dataSet(type)[id]
    };
  }

  function renderCard(type, id, owned) {
    var info = getInfo(type, id);
    var got = owned.indexOf(id) !== -1;
    var icon = got ? window.ShakaiIcons.render(info.svgKey, info.name) : window.ShakaiIcons.silhouette(info.name);
    return [
      '<article class="collection-card ', got ? 'owned' : 'locked', '" data-id="', esc(id), '">',
      '<div class="reward-icon" aria-hidden="true">', icon, '</div>',
      '<h4>', esc(got ? info.name : "未収集"), '</h4>',
      '<p>', esc(got ? info.sub : info.name), '</p>',
      got ? '<p>' + esc(info.desc) + '</p>' : '',
      '</article>'
    ].join("");
  }

  function renderCommonItems(save) {
    var items = [];
    Object.keys(window.KAKERA_COMMON_POOL || {}).forEach(function (lineId) {
      (window.KAKERA_COMMON_POOL[lineId] || []).forEach(function (item) {
        items.push('<div class="common-item"><span>' + esc(item.name) + '</span><strong>' + (Number(save.owned.commonItems[item.id]) || 0) + '</strong></div>');
      });
    });
    return items.join("");
  }

  function renderCategory(title, type, save) {
    var ownedKey = type === "item" ? "items" : type;
    var ids = collectIds(type, save);
    var owned = save.owned[ownedKey] || [];
    return '<section class="collection-section"><h3>' + esc(title) + '</h3><div class="collection-grid">' +
      ids.map(function (id) { return renderCard(type, id, owned); }).join("") +
      '</div></section>';
  }

  function render(root) {
    var save = window.SaveManager.data();
    root.innerHTML = [
      '<div class="collection-summary">',
      '<div class="summary-tile"><span>たびのかけら</span><strong>', save.owned.kakeraCount, '</strong></div>',
      '<div class="summary-tile"><span>名産品</span><strong>', save.owned.meibutsu.length, '</strong></div>',
      '<div class="summary-tile"><span>偉人カード</span><strong>', save.owned.ijin.length, '</strong></div>',
      '<div class="summary-tile"><span>認定キャラ</span><strong>', save.owned.chara.length, '</strong></div>',
      '</div>',
      '<section class="collection-section"><h3>ありふれた収蔵品</h3><div class="common-list">', renderCommonItems(save), '</div></section>',
      '<div class="collection-sections">',
      renderCategory("名産品", "meibutsu", save),
      renderCategory("偉人カード", "ijin", save),
      renderCategory("認定キャラ", "chara", save),
      renderCategory("実用アイテム", "item", save),
      '</div>'
    ].join("");
  }

  window.CollectionRenderer = { render: render, getInfo: getInfo, collectIds: collectIds };
}());
