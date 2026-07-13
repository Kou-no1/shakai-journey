// achievement-data.js
// 実績と称号の定義。conditionはachievement-manager.jsが判定する。
window.ACHIEVEMENT_DATA = {
  ach_koku_master: {
    title: "国土探検家", desc: "国土ライン5駅をすべて探検した", priority: 10,
    condition: { type: "line_basic_clear", lineId: "s5_koku" }
  },
  ach_shoku_master: {
    title: "食料生産マイスター", desc: "食料生産ライン4駅をすべて探検した", priority: 10,
    condition: { type: "line_basic_clear", lineId: "s5_shoku" }
  },
  ach_kogyo_master: {
    title: "ものづくり職人", desc: "工業生産ライン4駅をすべて探検した", priority: 10,
    condition: { type: "line_basic_clear", lineId: "s5_kogyo" }
  },
  ach_joho_master: {
    title: "情報通", desc: "情報ライン3駅をすべて探検した", priority: 10,
    condition: { type: "line_basic_clear", lineId: "s5_joho" }
  },
  ach_kankyo_master: {
    title: "エコマイスター", desc: "環境ライン3駅をすべて探検した", priority: 10,
    condition: { type: "line_basic_clear", lineId: "s5_kankyo" }
  },
  ach_sei_master: {
    title: "政治通", desc: "政治ライン3駅をすべて探検した", priority: 10,
    condition: { type: "line_basic_clear", lineId: "s6_sei" }
  },
  ach_rek_master: {
    title: "歴史博士", desc: "歴史すごろく12駅をすべて探検した", priority: 20,
    condition: { type: "line_basic_clear", lineId: "s6_rek" }
  },
  ach_kok_master: {
    title: "世界市民", desc: "世界路線2駅をすべて探検した", priority: 20,
    condition: { type: "line_basic_clear", lineId: "s6_kok" }
  },
  ach_grade5_complete: {
    title: "5年生修了", desc: "5年の5ラインをすべて制覇した", priority: 30,
    condition: { type: "lines_basic_clear", lineIds: ["s5_koku", "s5_shoku", "s5_kogyo", "s5_joho", "s5_kankyo"] }
  },
  ach_grade6_complete: {
    title: "6年生修了", desc: "6年の3ラインをすべて制覇した", priority: 30,
    condition: { type: "lines_basic_clear", lineIds: ["s6_sei", "s6_rek", "s6_kok"] }
  },
  ach_all_complete: {
    title: "時空社会御朱印帳マスター", desc: "36駅すべてを探検した", priority: 100,
    condition: { type: "all_basic_clear" }
  },
  ach_meibutsu_complete: {
    title: "名産品コレクター", desc: "名産品を51件すべて集めた", priority: 40,
    condition: { type: "collection_complete", category: "meibutsu" }
  },
  ach_ijin_complete: {
    title: "偉人博士", desc: "偉人カードを10件すべて集めた", priority: 40,
    condition: { type: "collection_complete", category: "ijin" }
  },
  ach_perfect_5: {
    title: "努力の達人", desc: "「もっと知りたい！チャレンジ」を5駅で全問正解した", priority: 25,
    condition: { type: "extra_perfect_count", count: 5 }
  },
  ach_perfect_all: {
    title: "パーフェクト旅人", desc: "「もっと知りたい！チャレンジ」を全36駅で全問正解した", priority: 80,
    condition: { type: "extra_perfect_count", count: 36 }
  },
  ach_kakera_500: {
    title: "", desc: "たびのかけらを500個集めた", priority: 0,
    condition: { type: "kakera_count", count: 500 }
  }
};
