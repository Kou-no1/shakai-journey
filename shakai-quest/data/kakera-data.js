// kakera-data.js
// 「1問につき1つ」の毎問報酬レイヤー。正解のたびに必ずかけら+1、
// 一定確率でラインごとの「ありふれた収蔵品」を1つ追加で入手する。
// 名産品/偉人などの"固有収蔵品"とは別枠（重複取得OK・数を数えるだけ）。
window.KAKERA_COMMON_POOL = {
  s5_koku:   [ {id:"kk_koku_01", name:"小石のお守り"}, {id:"kk_koku_02", name:"地図のかけら"}, {id:"kk_koku_03", name:"旅の押し花"} ],
  s5_shoku:  [ {id:"kk_shoku_01", name:"落ち穂"}, {id:"kk_shoku_02", name:"小さな漁網の切れ端"}, {id:"kk_shoku_03", name:"種もみ"} ],
  s5_kogyo:  [ {id:"kk_kogyo_01", name:"ネジのかけら"}, {id:"kk_kogyo_02", name:"歯車パーツ"}, {id:"kk_kogyo_03", name:"設計図の切れ端"} ],
  s5_joho:   [ {id:"kk_joho_01", name:"電波アイコン"}, {id:"kk_joho_02", name:"取材メモ"}, {id:"kk_joho_03", name:"QRコードの欠片"} ],
  s5_kankyo: [ {id:"kk_kankyo_01", name:"どんぐり"}, {id:"kk_kankyo_02", name:"落ち葉のしおり"}, {id:"kk_kankyo_03", name:"リサイクルの木片"} ],
  s6_sei:    [ {id:"kk_sei_01", name:"投票済み証のミニチュア"}, {id:"kk_sei_02", name:"議事録の切れ端"}, {id:"kk_sei_03", name:"憲法条文カード"} ],
  s6_rek:    [ {id:"kk_rek_01", name:"古銭のかけら"}, {id:"kk_rek_02", name:"破れた古文書"}, {id:"kk_rek_03", name:"陶片"}, {id:"kk_rek_04", name:"錆びた刀の欠片"} ],
  s6_kok:    [ {id:"kk_kok_01", name:"小さな地球儀"}, {id:"kk_kok_02", name:"外国のコイン"}, {id:"kk_kok_03", name:"パスポートのスタンプ"} ]
};
