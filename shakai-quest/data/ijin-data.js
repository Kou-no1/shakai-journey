// ijin-data.js
// 偉人カード（歴史すごろくのみ）。実在の人物を扱うため、achievementは
// 史実に基づくナレーション調のみとし、断定的な創作セリフは入れないこと。
// デモノード分のみ実装済み。残りはnodes-data.jsのijinIdを見て同形式で追加。
window.IJIN_DATA = {
  i_nobunaga: {
    name: "織田信長", nodeId: "s6_rek06", era: "戦国時代",
    achievement: "鉄砲を巧みに戦に取り入れ、楽市・楽座で商工業をさかんにするなど、天下統一への道を切り開いたと伝えられている。本能寺の変で最期をむかえた。",
    svgKey: "ijin_nobunaga"
  },
  i_himiko: {
    name: "卑弥呼",
    nodeId: "s6_rek01",
    era: "弥生時代",
    achievement: "邪馬台国をまとめ、中国の魏に使いを送ったと伝えられている。古代の日本を知る手がかりとして、中国の歴史書にも名が見える。",
    svgKey: "ijin_himiko"
  },
  i_shotoku: {
    name: "聖徳太子",
    nodeId: "s6_rek02",
    era: "飛鳥時代",
    achievement: "冠位十二階や十七条の憲法、遣隋使の派遣に関わり、天皇中心の国づくりを進めたと伝えられている。",
    svgKey: "ijin_shotoku"
  },
  i_michinaga: {
    name: "藤原道長",
    nodeId: "s6_rek03",
    era: "平安時代",
    achievement: "外戚として天皇と結びつき、摂関政治の最盛期を築いた人物として知られている。平安貴族の政治を考える代表的な人物である。",
    svgKey: "ijin_michinaga"
  },
  i_yoritomo: {
    name: "源頼朝",
    nodeId: "s6_rek04",
    era: "鎌倉時代",
    achievement: "鎌倉幕府を開き、御家人との主従関係をもとに武士の政治を始めた人物として知られている。",
    svgKey: "ijin_yoritomo"
  },
  i_yoshimasa: {
    name: "足利義政",
    nodeId: "s6_rek05",
    era: "室町時代",
    achievement: "銀閣に代表される東山文化の時代に関わった将軍として知られている。今に伝わる室町文化を考える手がかりとなる人物である。",
    svgKey: "ijin_yoshimasa"
  },
  i_ieyasu: {
    name: "徳川家康",
    nodeId: "s6_rek07",
    era: "江戸時代",
    achievement: "江戸幕府を開き、大名を統制するしくみなど政治の安定の基礎を築いた人物として知られている。",
    svgKey: "ijin_ieyasu"
  },
  i_sugita: {
    name: "杉田玄白",
    nodeId: "s6_rek08",
    era: "江戸時代",
    achievement: "西洋医学書の翻訳に取り組み、『解体新書』の刊行に関わった人物として知られている。蘭学の広がりを考える代表的な人物である。",
    svgKey: "ijin_sugita"
  },
  i_saigou: {
    name: "西郷隆盛",
    nodeId: "s6_rek09",
    era: "明治時代",
    achievement: "幕末から明治維新にかけて活動し、新しい国づくりを進めた人物の一人として知られている。",
    svgKey: "ijin_saigou"
  },
  i_mutsu: {
    name: "陸奥宗光",
    nodeId: "s6_rek10",
    era: "明治時代",
    achievement: "外務大臣として条約改正に取り組み、領事裁判権の撤廃に関わった人物として知られている。",
    svgKey: "ijin_mutsu"
  }
};
