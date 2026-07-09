// meibutsu-data.js
// 名産品・アイテム図鑑（資料館に並ぶ"見るだけ"収蔵枠）。
// ここではデモ4ノード分のみ実装済み。残り32ノード分はnodes-data.jsの
// meibutsuIds/branch.options[].meibutsuIdsを見て同じ形式で追加すること。
window.MEIBUTSU_DATA = {
  m_chikyugi: {
    name: "地球儀バッジ", nodeId: "s5_koku01", rarity: "normal",
    trivia: "日本を一周する船旅にはおよそ何日かかるか知ってる？地球儀をくるくる回すと世界の広さが実感できるよ。",
    svgKey: "globe_badge"
  },
  m_nihonchizu: {
    name: "日本地図", nodeId: "s5_koku01", rarity: "normal",
    trivia: "日本は南北に長く、北と南では季節ごとの気温差が大きいんだ。",
    svgKey: "japan_map"
  },
  m_chisui: {
    name: "治水模型", nodeId: "s5_koku03", rarity: "normal", branchId: "wajyu",
    trivia: "輪中の堤防は、昔は住民みんなで協力して築いたり守ったりしてきたんだよ。",
    svgKey: "levee_model"
  },
  m_kougen_yasai: {
    name: "高原野菜セット", nodeId: "s5_koku03", rarity: "normal", branchId: "kougen",
    trivia: "涼しい高原で夏に育てたキャベツは、他の産地の出荷が少ない時期をねらって出荷されるんだ。",
    svgKey: "cabbage_set"
  },
  m_teppou: {
    name: "鉄砲レプリカ", nodeId: "s6_rek06", rarity: "normal",
    trivia: "1543年、種子島に流れ着いたポルトガル人によって鉄砲が伝わったと言われているよ。",
    svgKey: "matchlock"
  },
  m_chaki: {
    name: "茶器", nodeId: "s6_rek06", rarity: "rare",
    trivia: "戦国武将たちは茶の湯を楽しみ、名のある茶器は褒美として与えられることもあったんだ。",
    svgKey: "tea_set"
  },
  m_haikyu_kippu: {
    name: "配給切符（史料）", nodeId: "s6_rek11", rarity: "normal",
    trivia: "戦争が長引く中、米などの生活必需品は決まった量しか手に入らなくなっていったんだ。",
    svgKey: "ration_ticket"
  },
  m_bokuzukin: {
    name: "防空頭巾（史料）", nodeId: "s6_rek11", rarity: "normal",
    trivia: "空襲から身を守るため、当時の子どもたちは防空頭巾をかぶって避難していたんだ。",
    svgKey: "air_raid_hood"
  }
};
