// lines-data.js
// シャカイ・クエストの8ライン定義。mapStyleがmap-renderer.jsの描画方式を決める。
window.LINES_DATA = [
  { lineId: "s5_koku",   name: "国土ライン",     grade: 5, order: 1, mapStyle: "route",    color: "var(--line-koku)" },
  { lineId: "s5_shoku",  name: "食料生産ライン", grade: 5, order: 2, mapStyle: "route",    color: "var(--line-shoku)" },
  { lineId: "s5_kogyo",  name: "工業生産ライン", grade: 5, order: 3, mapStyle: "route",    color: "var(--line-kogyo)" },
  { lineId: "s5_joho",   name: "情報ライン",     grade: 5, order: 4, mapStyle: "route",    color: "var(--line-joho)" },
  { lineId: "s5_kankyo", name: "環境ライン",     grade: 5, order: 5, mapStyle: "route",    color: "var(--line-kankyo)" },
  { lineId: "s6_sei",    name: "政治ライン",     grade: 6, order: 6, mapStyle: "route",    color: "var(--line-sei)" },
  { lineId: "s6_rek",    name: "歴史すごろく",   grade: 6, order: 7, mapStyle: "sugoroku", color: "var(--line-rek)" },
  { lineId: "s6_kok",    name: "世界路線",       grade: 6, order: 8, mapStyle: "world",    color: "var(--line-kok)" }
];
