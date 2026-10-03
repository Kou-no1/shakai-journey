(function () {
  "use strict";
  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function normalize(q, nodeId, tier, branch, index) {
    var node = window.NODES_DATA[nodeId], grade = Number(nodeId.charAt(1));
    return Object.assign({}, q, {
      id: q.id || nodeId + (branch ? "-" + branch : "") + "-" + tier + "-" + String(index + 1).padStart(3, "0"),
      tier: tier, stem: q.stem || q.q, explanation: q.explanation || q.explain,
      choices: q.type === "ox" ? ["○ 正しい", "× ちがう"] : q.choices.slice(),
      answer: q.type === "ox" ? (q.answer === true ? 0 : q.answer === false ? 1 : q.answer) : q.answer,
      skill: q.skill || "knowledge", subId: q.subId || nodeId + (branch ? "/" + branch : ""),
      curriculumRef: q.curriculumRef || window.SocialQuestions.curriculumRef(nodeId),
      context: q.context || "standard", targetStage: q.targetStage || (tier === "extra" ? "middle_or_trivia" : "elementary" + grade),
      contentVersion: q.contentVersion || 1, regionScope: q.regionScope || node.regionScope || "national"
    });
  }
  function curriculumRef(id) {
    var line = window.NODES_DATA[id].lineId;
    var refs = { s5_koku: "5-(1)", s5_shoku: "5-(2)", s5_kogyo: "5-(3)", s5_joho: "5-(4)", s5_kankyo: "5-(5)", s6_sei: "6-(1)", s6_rek: "6-(2)", s6_kok: "6-(3)" };
    return refs[line] || window.NODES_DATA[id].curriculumRef;
  }
  function bank(id, branch, tier) {
    var b = window.QUESTION_BANK[id];
    if (branch) b = b && b[branch];
    return (b && b[tier] || []).map(function (q, i) { return normalize(q, id, tier, branch, i); });
  }
  function prepare(q) {
    var result = Object.assign({}, q, { choices: q.choices.slice() });
    if (q.type !== "mc4") return result;
    var order = shuffle(q.choices.map(function (_, i) { return i; }));
    result.choices = order.map(function (i) { return q.choices[i]; });
    result.answer = order.indexOf(q.answer);
    return result;
  }
  var readings = {
    "立憲主義": "りっけんしゅぎ", "摂関政治": "せっかんせいじ", "廃藩置県": "はいはんちけん", "地租改正": "ちそかいせい", "領事裁判権": "りょうじさいばんけん",
    "人口密度": "じんこうみつど", "年較差": "ねんかくさ", "等高線": "とうこうせん", "促成栽培": "そくせいさいばい", "抑制栽培": "よくせいさいばい",
    "中央値": "ちゅうおうち", "相関": "そうかん", "外部不経済": "がいぶふけいざい", "付加価値": "ふかかち", "金納": "きんのう", "主権": "しゅけん",
    "縮尺": "しゅくしゃく", "経度": "けいど", "国司": "こくし", "荘園": "しょうえん", "摂政": "せっしょう", "関白": "かんぱく", "史料": "しりょう",
    "地価": "ちか", "為替": "かわせ", "賃金": "ちんぎん", "供給": "きょうきゅう", "需要": "じゅよう", "調印": "ちょういん", "発効": "はっこう",
    "排他的経済水域": "はいたてきけいざいすいいき", "日本国憲法": "にほんこくけんぽう", "三権分立": "さんけんぶんりつ", "基本的人権": "きほんてきじんけん",
    "国民主権": "こくみんしゅけん", "平和主義": "へいわしゅぎ", "地産地消": "ちさんちしょう", "二酸化炭素": "にさんかたんそ", "鎌倉幕府": "かまくらばくふ",
    "参勤交代": "さんきんこうたい", "選挙": "せんきょ", "議会": "ぎかい", "国会": "こっかい", "内閣": "ないかく", "裁判所": "さいばんしょ",
    "県庁": "けんちょう", "警察": "けいさつ", "消防": "しょうぼう", "工場": "こうじょう", "農業": "のうぎょう", "水産業": "すいさんぎょう",
    "森林": "しんりん", "貿易": "ぼうえき", "資料": "しりょう", "地域": "ちいき", "方位": "ほうい", "地図": "ちず", "地形": "ちけい",
    "観察": "かんさつ", "比較": "ひかく", "理由": "りゆう", "調査": "ちょうさ", "避難": "ひなん", "災害": "さいがい", "洪水": "こうずい",
    "伝統": "でんとう", "文化": "ぶんか", "税金": "ぜいきん", "人口": "じんこう", "消費": "しょうひ", "生産": "せいさん", "輸入": "ゆにゅう", "輸出": "ゆしゅつ",
    "学校": "がっこう", "建物": "たてもの", "交通": "こうつう", "公共": "こうきょう", "記録": "きろく", "道路": "どうろ", "交差点": "こうさてん",
    "安全": "あんぜん", "方向": "ほうこう", "場所": "ばしょ", "説明": "せつめい", "通り": "とおり"
  };
  var readingPattern = new RegExp(Object.keys(readings).sort(function (a, b) { return b.length - a.length; }).join("|"), "g");
  function rubric(text) {
    var marked = String(text).split(/(\{[^{}|]+\|[^{}|]+\})/g).map(function (part) {
      return /^\{/.test(part) ? part : part.replace(readingPattern, function (word) { return "{" + word + "|" + readings[word] + "}"; });
    }).join("");
    var escaped = window.ShakaiUtil.esc(marked);
    return escaped.replace(/\{([^{}|]+)\|([^{}|]+)\}/g, function (_, word, reading) {
      return window.SaveManager && !window.SaveManager.data().settings.ruby ? word : "<ruby>" + word + "<rt>" + reading + "</rt></ruby>";
    });
  }
  window.SocialQuestions = { shuffle: shuffle, bank: bank, prepare: prepare, normalize: normalize, curriculumRef: curriculumRef, ruby: rubric,
    skills: { knowledge: "知識", reading: "資料読み取り", inquiry: "調べ方", comparison: "比較", reasoning: "理由・つながり", application: "くらしへの活用" } };
}());
