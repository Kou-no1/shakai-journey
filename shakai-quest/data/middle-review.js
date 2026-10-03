(function () {
  "use strict";
  var bank = {}, assigned = { denominator: "s5_joho", conditions: "s6_sei", causality: "s5_shoku", chronology: "s6_rek", source_scope: "s5_joho", tradeoff: "s6_kok", scale: "s5_koku" };
  function T(headers, rows) { return { title: "資料A", kind: "table", headers: headers, rows: rows, fictional: true }; }
  function X(text) { return { title: "資料B", kind: "text", text: text, fictional: true }; }
  function add(reason, stem, choices, explanation, materials, evidence) {
    var list = bank[reason] = bank[reason] || [], course = window.MIDDLE_COURSES[assigned[reason]], index = list.length;
    var answer = (Object.keys(bank).indexOf(reason) + index) % 4;
    choices = choices.map(function (_, i, a) { return a[(i - answer + 4) % 4]; });
    list.push({ id: "transfer-" + reason + "-" + (index + 1), type: "mc4", tier: "extra", skill: "reasoning", subId: "transfer:" + reason,
      stem: stem, choices: choices, answer: answer, explanation: explanation, sourceMaterials: materials, evidence: evidence,
      choiceReasons: choices.map(function (_, i) { return i === answer ? null : reason; }), practiceReason: reason, courseId: course.id,
      targetStage: "middle_" + course.field, curriculumRef: course.curriculumRefs, context: "fictional_data", contentVersion: 1,
      reviewStatus: "pending_subject_review", referenceYear: 2026, factSources: ["https://www.mext.go.jp/content/20240919-mxt_kyoiku01-100002608.pdf"] });
  }
  add("denominator", "回収率が高い地区は？", ["P・75%", "Q・90%", "P・50%", "Q・75%"], "回収数ではなく配った数を分母にする。", [T(["地区", "配布", "回収"], [["P", 80, 60], ["Q", 150, 90]]), X("回収率は回収÷配布。単位は枚で、同じ調査を行った。")], ["Pは60÷80＝75%。", "Qは90÷150＝60%。"]);
  add("denominator", "二つのクラスを合わせた参加割合は？", ["70%", "75%", "60%", "90%"], "各割合の単純平均ではなく合計人数を分母にする。", [T(["クラス", "人数", "参加"], [["P", 20, 18], ["Q", 40, 24]]), X("全参加者÷全人数で計算する。人数は人。")], ["参加は18＋24＝42人。", "全人数60人で42÷60＝70%。"]);
  add("conditions", "両方の条件を満たす施設案は？", ["Q", "P", "R", "PとR"], "費用と人数の制限を同時に確認する。", [T(["案", "費用", "定員"], [["P", 24, 80], ["Q", 20, 100], ["R", 30, 120]]), X("費用25以下、定員90人以上。一案だけを実施する。費用は同じ単位。")], ["Qは20、100人で両条件内。", "Pは人数不足、Rは費用超過。"]);
  add("conditions", "運行の全条件を満たす便は？", ["R", "P", "Q", "PとQ"], "時刻だけ、料金だけでは判断できない。", [T(["便", "到着", "料金"], [["P", "9:30", 800], ["Q", "10:30", 500], ["R", "9:50", 600]]), X("10時までに到着し、料金は700円以下。一便だけを選ぶ。")], ["Rは9:50到着、600円。", "Pは料金超過、Qは時間超過。"]);
  add("causality", "肥料の効果だけを確かめる追加調査は？", ["品種と水量をそろえ、肥料の有無で比較する", "収穫が増えたことだけで肥料の効果とする", "品種の変更だけで肥料の効果を決める", "水量が増えたことだけで肥料の効果を決める"], "同時に変えた条件の影響を分ける。", [T(["時期", "収穫"], [["前", 40], ["後", 60]]), X("後に肥料、品種、水量を同時に変えた。収穫はkg。")], ["収穫は20kg増加。", "三条件が同時に変わり肥料だけの効果は未確定。"]);
  add("causality", "広告だけが売上を増やしたと言える？", ["値引きの影響も分ける比較が必要", "売上増だけで広告の効果と断定できる", "広告の掲載日だけで値引きの影響を除ける", "価格の低下だけで広告の効果をゼロと断定できる"], "変化の確認と要因の特定は異なる。", [T(["期間", "販売数", "価格"], [["前", 100, 500], ["後", 160, 400]]), X("後に広告を始めると同時に値下げした。他店の記録はない。")], ["販売数と価格が同時に変化。", "広告と値引きの単独効果は分からない。"]);
  add("chronology", "規則が実施される年は？", ["1874年", "1872年", "1873年", "1876年"], "公布から実施までの期間を確認する。", [T(["出来事", "年"], [["公布", 1872]]), X("これは架空の規則。公布の2年後から実施すると定められている。")], ["公布は1872年。", "1872＋2＝1874年が実施。"]);
  add("chronology", "二つの改革の間隔は？", ["24年", "14年", "34年", "44年"], "二つの年を同じ年表上で引き算する。", [T(["改革", "年"], [["P", 1836], ["Q", 1860]]), X("架空の年表演習であり実在の改革名ではない。間隔を年数で求める。")], ["QはPより後。", "1860－1836＝24年。"]);
  add("source_scope", "この調査で言える範囲は？", ["回答した部員のうち70%が賛成した", "学校の全生徒の70%が賛成した", "町の全住民の70%が賛成した", "部員以外の全生徒の70%が賛成した"], "調べた範囲以外へ一般化しない。", [T(["対象", "回答", "賛成"], [["ある部の部員", 20, 14]]), X("他の部や部員以外には質問していない。全生徒数は不明。")], ["14÷20＝70%。", "質問したのはこの部の回答者のみ。"]);
  add("source_scope", "この表だけで判断できない主張は？", ["全世帯の医療へのアクセスが改善した", "地域の施設数が増えた", "地域の予算額が増えた", "後期の施設数は5だった"], "投入量から全員の利用結果は分からない。", [T(["時期", "施設数", "予算"], [["前", 3, 100], ["後", 5, 150]]), X("利用者数、距離、利用できない人の記録はない。予算は同じ単位。")], ["施設と予算の増加は読める。", "世帯ごとの利用の変化は記録されていない。"]);
  add("tradeoff", "二案の利点と負担の比較は？", ["Pは供給が多いが排出も多く、Qは供給が少ないが排出も少ない", "Pは供給も排出もQより少ない", "Qは供給も排出もPより多い", "供給が多いPは排出が必ず少ない"], "利点と負担を別の指標で比べる。", [T(["案", "供給", "排出"], [["P", 100, 40], ["Q", 70, 10]]), X("供給はkWh、排出はkg。今回は費用の情報はない。")], ["P供給100はQ70より多い。", "排出40はQ10より多い。"]);
  add("tradeoff", "全員の利用と予算の両条件を満たす代案は？", ["PとQを合わせて実施する", "Pだけを実施する", "Qだけを実施する", "Pを二回実施する"], "異なる人に届く案を組み合わせ、予算も確認する。", [T(["案", "費用", "利用できる層"], [["P", 6, "昼間に来られる層"], ["Q", 4, "夜だけ来られる層"]]), X("予算10以内で、両方の層に機会を設ける。二層は重ならない。費用は足し算できる。")], ["P＋Qは費用10。", "両方の層に利用機会ができる。"]);
  add("scale", "地図上3cmの経路の実際の距離は？", ["1.5km", "15km", "0.15km", "150km"], "cmを実際のcmにし、その後kmへ換算する。", [X("地図の縮尺は1:50,000。"), { title: "資料A", kind: "text", fictional: true, text: "学習用の地図上で経路は3cm。1kmは100,000cm。" }], ["3×50,000＝150,000cm。", "150,000÷100,000＝1.5km。"]);
  add("scale", "2時間で18km進んだとき、1時間当たりの速さは？", ["9km/h", "18km/h", "36km/h", "0.11km/h"], "距離を時間で割る。", [T(["移動距離", "時間"], [["18km", "120分"]]), X("途中の停止も含む平均。60分を1時間として換算する。")], ["120分＝2時間。", "18÷2＝9km/h。"]);
  window.MIDDLE_REVIEW_BANK = bank;
  window.MiddleCourses.practiceCourse = function (reason) { return Object.prototype.hasOwnProperty.call(assigned, reason) ? assigned[reason] : null; };
  window.MiddleCourses.practiceBank = function (reason) { return Object.prototype.hasOwnProperty.call(bank, reason) ? bank[reason] : []; };
  var originalReasons = window.MiddleCourses.reviewReasons;
  window.MiddleCourses.reviewReasons = function (save) {
    var result = originalReasons(save);
    Object.values(bank).flat().forEach(function (q) {
      var st = save.questionStats[q.id];
      if (st && !st.lastCorrect && st.lastMistake) result[st.lastMistake] = (result[st.lastMistake] || 0) + 1;
    });
    return result;
  };
}());
