(function () {
  "use strict";
  window.SOCIAL_CURRICULUM = {
    publisher: "東京書籍", edition: "令和6年度版", region: null,
    scope: "3・4年は全国共通の概念・調べ方。地域固有教材は対象地域の確定後に追加。",
    sources: {
      grade3: "https://ten.tokyo-shoseki.co.jp/text/shou/shakai/data/shakai_keikaku_ryakuan_3.pdf",
      grade4: "https://ten.tokyo-shoseki.co.jp/text/shou/shakai/data/shakai_keikaku_ryakuan_4.pdf",
      curriculum: "https://www.mext.go.jp/content/20230308-mxt_kyoiku02-100002607_003.pdf"
    }
  };
  var lines = [
    ["s3_machi", "まち探検", 3, "var(--line-koku)"], ["s3_work", "はたらく人", 3, "var(--line-shoku)"],
    ["s3_safe", "くらしを守る", 3, "var(--line-kogyo)"], ["s3_time", "まちの時間", 3, "var(--line-rek)"],
    ["s4_ken", "県の広がり", 4, "var(--line-koku)"], ["s4_life", "住みよいくらし", 4, "var(--line-kok)"],
    ["s4_safe", "災害への備え", 4, "var(--line-kogyo)"], ["s4_bunka", "受け継ぐくらし", 4, "var(--line-rek)"],
    ["s4_area", "特色ある地域", 4, "var(--line-kankyo)"]
  ];
  lines.forEach(function (row, i) {
    window.LINES_DATA.push({ lineId: row[0], name: row[1], grade: row[2], order: i + 1, mapStyle: "route", color: row[3] });
  });
  var rows = [
    ["s3_machi01", "s3_machi", 1, "学校のまわり", "学校のまわり", "3-(1)", "c_chizu_annainin", "map"],
    ["s3_machi02", "s3_machi", 2, "まちの見晴らし台", "市の様子", "3-(1)", "c_chizu_annainin", "town"],
    ["s3_work01", "s3_work", 1, "農家と工場", "農家の仕事／工場の仕事（選択）", "3-(2)", "c_shokutaku_annainin", "factory"],
    ["s3_work02", "s3_work", 2, "お店の通り", "店ではたらく人", "3-(2)", "c_shokutaku_annainin", "shop"],
    ["s3_safe01", "s3_safe", 1, "消防の基地", "火事からくらしを守る", "3-(3)", "c_bousai_meijin", "fire"],
    ["s3_safe02", "s3_safe", 2, "まちの交番", "事故や事件からくらしを守る", "3-(3)", "c_moral_annainin", "shield"],
    ["s3_time01", "s3_time", 1, "時間の資料室", "市の様子と人々のくらしのうつりかわり", "3-(4)", "c_housou_annainin", "clock"],
    ["s4_ken01", "s4_ken", 1, "県の地図ひろば", "日本地図を広げて／県の広がり", "4-(1)", "c_chizu_annainin", "map"],
    ["s4_life01", "s4_life", 1, "水の道", "水はどこから", "4-(2)", "c_chisui_meijin", "water"],
    ["s4_life02", "s4_life", 2, "資源の工房", "ごみのしょりと利用", "4-(2)", "c_eco_meijin", "recycle"],
    ["s4_safe01", "s4_safe", 1, "備えの丘", "風水害からくらしを守る", "4-(3)", "c_bousai_meijin", "shield"],
    ["s4_bunka01", "s4_bunka", 1, "受け継ぐ広場", "残したいもの 伝えたいもの", "4-(4)", "c_mori_meijin", "festival"],
    ["s4_bunka02", "s4_bunka", 2, "用水の道", "谷に囲まれた台地に水を引く（共通の調べ方）", "4-(4)", "c_chisui_meijin", "water"],
    ["s4_area01", "s4_area", 1, "手仕事の里", "伝統的な産業を生かす地域（共通事項）", "4-(5)", "c_monozukuri_annainin", "craft"],
    ["s4_area02", "s4_area", 2, "交流の広場", "国際交流に取り組む地域（共通事項）", "4-(5)", "c_kenpoukun", "globe"],
    ["s4_area03", "s4_area", 3, "景観の道", "自然や古いまちなみを生かす地域（選択・共通事項）", "4-(5)", "c_yamakawa_annainin", "town"]
  ];
  rows.forEach(function (row) {
    window.NODES_DATA[row[0]] = {
      lineId: row[1], order: row[2], stationName: row[3], unitName: row[3], subunitName: row[4],
      curriculumRef: row[5], charaId: row[6], motif: row[7], meibutsuIds: [], ijinId: null,
      branch: null, challengeStyle: "nintei", regionScope: "national", localContentStatus: "awaiting_region"
    };
  });
  window.NODES_DATA.s3_work01.branch = { options: [
    { branchId: "farm", label: "農家の仕事", charaId: "c_okome_meijin", meibutsuIds: [] },
    { branchId: "factory", label: "工場の仕事", charaId: "c_monozukuri_annainin", meibutsuIds: [] }
  ] };
  window.NODES_DATA.s4_area03.branch = { options: [
    { branchId: "nature", label: "自然の景観", charaId: "c_yamakawa_annainin", meibutsuIds: [] },
    { branchId: "town", label: "古いまちなみ", charaId: "c_mori_meijin", meibutsuIds: [] }
  ] };
}());
