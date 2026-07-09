// item-data.js
// 実用アイテム（装備相当）。「もっと知りたい！チャレンジ」全問正解などの
// 節目でまれに入手できるボーナス枠。effectはquiz-engine.jsが参照する。
window.ITEM_DATA = {
  eq_hint_free: {
    name: "先生の虫めがね", effect: "hintFree", rarity: "rare",
    nodeId: "s5_koku02", desc: "1問だけ選択肢を1つ減らしてくれる。"
  },
  eq_exp_boost: {
    name: "旅なれた靴", effect: "expBoostBig", rarity: "rare",
    nodeId: "s6_rek06", desc: "このノードクリア時のEXPが増える。"
  },
  eq_combo_keep: {
    name: "御朱印帳のしおり", effect: "comboKeep", rarity: "rare",
    nodeId: "s6_sei02", desc: "1回だけ不正解でも連続正解ボーナスが途切れない。"
  },
  eq_double_crit: {
    name: "案内人の指さし棒", effect: "doubleCrit", rarity: "rare",
    nodeId: "s6_kok01", desc: "認定チャレンジで、かけら獲得確率が上がる。"
  }
};
