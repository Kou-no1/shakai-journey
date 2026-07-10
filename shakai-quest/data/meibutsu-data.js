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
  },
  m_alps_badge: {
    name: "日本アルプスバッジ",
    nodeId: "s5_koku02",
    rarity: "normal",
    trivia: "日本アルプスは本州中央部に連なる山々の呼び名。高い山地は川や交通、くらしの工夫と深く関わる。",
    svgKey: "mountain"
  },
  m_uonzu_card: {
    name: "雨温図カード",
    nodeId: "s5_koku04",
    rarity: "normal",
    trivia: "雨温図は一年の気温と降水量を比べるカード。地域ごとの気候の違いを見つける手がかりになる。",
    svgKey: "chart"
  },
  m_shiisaa: {
    name: "シーサー",
    nodeId: "s5_koku05",
    rarity: "normal",
    branchId: "nangoku",
    trivia: "沖縄などで親しまれる守り神の像。あたたかい土地の住まいや文化を調べる入口になる。",
    svgKey: "shiisaa"
  },
  m_ryuhyou_goods: {
    name: "流氷グッズ",
    nodeId: "s5_koku05",
    rarity: "normal",
    branchId: "yukiguni",
    trivia: "流氷は寒い海でできた氷が流れてくる自然現象。観光や漁業、海の環境とも関係する。",
    svgKey: "ice"
  },
  m_oshinagaki: {
    name: "お品書きカード",
    nodeId: "s5_shoku01",
    rarity: "normal",
    trivia: "食卓の品には、農業・水産業・畜産業など多くの仕事が関わる。産地をたどると社会のつながりが見える。",
    svgKey: "menu"
  },
  m_shinmai_badge: {
    name: "新米バッジ",
    nodeId: "s5_shoku02",
    rarity: "normal",
    trivia: "米は苗づくりから収穫、乾燥、出荷まで多くの作業を経て届く。水の管理が大切な作物だ。",
    svgKey: "rice"
  },
  m_taue_model: {
    name: "田植え機模型",
    nodeId: "s5_shoku02",
    rarity: "normal",
    trivia: "田植え機は広い田んぼの作業を助ける機械。農業では人の知恵と機械の力が組み合わされている。",
    svgKey: "tractor"
  },
  m_sengyo_set: {
    name: "鮮魚セット",
    nodeId: "s5_shoku03",
    rarity: "normal",
    trivia: "魚は水揚げ後の温度管理とすばやい輸送で鮮度が守られる。漁港から食卓まで多くの仕事が続く。",
    svgKey: "fish"
  },
  m_teichiami_model: {
    name: "定置網模型",
    nodeId: "s5_shoku03",
    rarity: "normal",
    trivia: "定置網は魚の通り道を利用する漁法。海の自然条件を読み取る漁業者の工夫がつまっている。",
    svgKey: "net"
  },
  m_chisan_badge: {
    name: "地産地消バッジ",
    nodeId: "s5_shoku04",
    rarity: "normal",
    trivia: "地元でとれた食料を地域で食べる考え方。生産者とのつながりや輸送の負担を考えるきっかけになる。",
    svgKey: "local_food"
  },
  m_kengaku_pass: {
    name: "工場見学パス",
    nodeId: "s5_kogyo01",
    rarity: "normal",
    trivia: "工場見学では、人と機械が役割を分けて働く様子を見られる。安全と品質を守る工夫に注目したい。",
    svgKey: "factory"
  },
  m_minicar: {
    name: "ミニカー",
    nodeId: "s5_kogyo02",
    rarity: "normal",
    trivia: "自動車は多くの部品と会社の協力で作られる。小さな模型にも、ものづくりのつながりを想像できる。",
    svgKey: "car"
  },
  m_line_diorama: {
    name: "組立ラインジオラマ",
    nodeId: "s5_kogyo02",
    rarity: "normal",
    trivia: "組立ラインでは工程ごとに作業が進む。効率だけでなく安全と品質を守る仕組みも大切だ。",
    svgKey: "line"
  },
  m_container_model: {
    name: "コンテナ船模型",
    nodeId: "s5_kogyo03",
    rarity: "normal",
    trivia: "コンテナは荷物をまとめて運ぶ箱。船・鉄道・トラックをつなぎ、貿易と物流を支えている。",
    svgKey: "container"
  },
  m_robot_arm: {
    name: "ロボットアーム模型",
    nodeId: "s5_kogyo04",
    rarity: "normal",
    trivia: "ロボットアームは正確さや安全が必要な作業を助ける。これからの工業では人と技術の協力が広がる。",
    svgKey: "robot"
  },
  m_news_script: {
    name: "ニュース原稿",
    nodeId: "s5_joho01",
    rarity: "normal",
    trivia: "ニュース原稿は限られた時間で正確に伝えるための道しるべ。取材と確認が土台になる。",
    svgKey: "news"
  },
  m_camera_model: {
    name: "カメラ模型",
    nodeId: "s5_joho01",
    rarity: "normal",
    trivia: "カメラは現場の様子を伝える道具。映像にも撮影する人の意図や選び方が表れる。",
    svgKey: "camera"
  },
  m_pos_model: {
    name: "POSレジ模型",
    nodeId: "s5_joho02",
    rarity: "normal",
    trivia: "POSレジは売れた商品や時間を記録する。データは仕入れや品ぞろえの判断に生かされる。",
    svgKey: "register"
  },
  m_moral_badge: {
    name: "情報モラルバッジ",
    nodeId: "s5_joho03",
    rarity: "normal",
    trivia: "情報モラルは自分と相手を守るための考え方。便利さと責任を一緒に考えることが大切だ。",
    svgKey: "shield"
  },
  m_bousai_set: {
    name: "防災グッズセット",
    nodeId: "s5_kankyo01",
    rarity: "normal",
    trivia: "水、食料、ライト、情報を得る道具は家庭の備えの基本。地域の避難先と合わせて確認したい。",
    svgKey: "bousai"
  },
  m_mokkouhin: {
    name: "木工品",
    nodeId: "s5_kankyo02",
    rarity: "normal",
    trivia: "木材は建物や家具、紙などに使われる。森を育てながら使う視点が欠かせない。",
    svgKey: "wood"
  },
  m_donguri_badge: {
    name: "どんぐりバッジ",
    nodeId: "s5_kankyo02",
    rarity: "normal",
    trivia: "どんぐりは森の生き物の食べ物にもなる。小さな実から森林の生態系を考えられる。",
    svgKey: "acorn"
  },
  m_recycle_badge: {
    name: "リサイクルバッジ",
    nodeId: "s5_kankyo03",
    rarity: "normal",
    trivia: "リサイクルは資源を作り直して使う取り組み。まずごみを減らすリデュースも大切だ。",
    svgKey: "recycle"
  },
  m_kenpou_badge: {
    name: "憲法三原則バッジ",
    nodeId: "s6_sei01",
    rarity: "normal",
    trivia: "国民主権、基本的人権の尊重、平和主義は日本国憲法の大切な原則。くらしの権利ともつながる。",
    svgKey: "constitution"
  },
  m_touhyou_model: {
    name: "投票箱模型",
    nodeId: "s6_sei02",
    rarity: "normal",
    trivia: "投票箱は主権者の意思を集める象徴。選挙は国民が代表を選ぶ大切なしくみだ。",
    svgKey: "ballot"
  },
  m_sanken_card: {
    name: "三権分立カード",
    nodeId: "s6_sei02",
    rarity: "normal",
    trivia: "立法・行政・司法を分けることで、権力が一つに集中しないようにする考え方。",
    svgKey: "three_powers"
  },
  m_kosodate_badge: {
    name: "支援バッジ",
    nodeId: "s6_sei03",
    rarity: "normal",
    branchId: "kosodate",
    trivia: "子育て支援は住民の願いを政策にする例。予算、人、施設、地域の声が組み合わさって進む。",
    svgKey: "support"
  },
  m_fukkou_card: {
    name: "まちづくりカード",
    nodeId: "s6_sei03",
    rarity: "normal",
    branchId: "fukkou",
    trivia: "復興のまちづくりでは、元に戻すだけでなく次の災害に備える視点も大切になる。",
    svgKey: "rebuild"
  },
  m_jomon_doki: {
    name: "縄文土器",
    nodeId: "s6_rek01",
    rarity: "normal",
    trivia: "縄文土器は煮炊きや保存に使われたと考えられている。文字の少ない時代のくらしを知る資料だ。",
    svgKey: "pottery"
  },
  m_haniwa: {
    name: "埴輪レプリカ",
    nodeId: "s6_rek01",
    rarity: "normal",
    trivia: "埴輪は古墳に並べられた素焼きの焼き物。服装や道具、儀式を考える手がかりになる。",
    svgKey: "haniwa"
  },
  m_daibutsu: {
    name: "大仏ミニチュア",
    nodeId: "s6_rek02",
    rarity: "normal",
    trivia: "奈良の大仏は仏教の力で国を守ろうとした時代の象徴。多くの人々の力で造られた。",
    svgKey: "daibutsu"
  },
  m_junihitoe: {
    name: "十二単ミニチュア",
    nodeId: "s6_rek03",
    rarity: "normal",
    trivia: "十二単は平安貴族の装束として知られる。色の重ね方にも季節感や美意識が表れた。",
    svgKey: "kimono"
  },
  m_ougi: {
    name: "扇",
    nodeId: "s6_rek03",
    rarity: "normal",
    trivia: "扇は実用品であると同時に、和歌や絵を添える文化の道具にもなった。",
    svgKey: "fan"
  },
  m_katchu: {
    name: "甲冑ミニチュア",
    nodeId: "s6_rek04",
    rarity: "normal",
    trivia: "甲冑は武士の戦いを支えた防具。武士が政治の中心へ進む時代を象徴している。",
    svgKey: "armor"
  },
  m_kinkaku_ginkaku: {
    name: "金閣・銀閣ミニチュア",
    nodeId: "s6_rek05",
    rarity: "normal",
    trivia: "金閣と銀閣は室町文化の違いを比べる手がかり。華やかさと落ち着いた美しさが見えてくる。",
    svgKey: "temple"
  },
  m_sankinkoutai_kago: {
    name: "参勤交代の駕籠模型",
    nodeId: "s6_rek07",
    rarity: "normal",
    trivia: "参勤交代は大名を統制する制度。大名行列は街道や宿場町の発展にも関わった。",
    svgKey: "kago"
  },
  m_ukiyoe: {
    name: "浮世絵レプリカ",
    nodeId: "s6_rek08",
    rarity: "normal",
    trivia: "浮世絵は江戸の流行や風景を伝える資料。版画として多くの人に広がった。",
    svgKey: "ukiyoe"
  },
  m_tetsudou_model: {
    name: "鉄道模型",
    nodeId: "s6_rek09",
    rarity: "normal",
    trivia: "新橋・横浜間の鉄道は明治の近代化を象徴する出来事。人と物の移動を大きく変えた。",
    svgKey: "train"
  },
  m_jouyaku_medal: {
    name: "条約改正記念メダル",
    nodeId: "s6_rek10",
    rarity: "normal",
    trivia: "条約改正は外国と対等な関係をめざす外交の課題だった。国内制度の近代化とも結びつく。",
    svgKey: "medal"
  },
  m_tokyo_tower: {
    name: "東京タワー模型",
    nodeId: "s6_rek12",
    rarity: "normal",
    trivia: "東京タワーは戦後復興と高度成長の時代を象徴する建物として親しまれている。",
    svgKey: "tower"
  },
  m_kokki_collection: {
    name: "国旗コレクション",
    nodeId: "s6_kok01",
    rarity: "normal",
    trivia: "国旗は国を表すしるしの一つ。国を理解するには、旗だけでなく人々のくらしや歴史も調べたい。",
    svgKey: "flag"
  },
  m_kokuren_badge: {
    name: "国連バッジ",
    nodeId: "s6_kok02",
    rarity: "normal",
    trivia: "国際連合は平和と安全、国際協力をめざす機関。世界の課題には国をこえた協力が必要だ。",
    svgKey: "un"
  },
  m_sdgs_pin: {
    name: "SDGsピンズ",
    nodeId: "s6_kok02",
    rarity: "normal",
    trivia: "SDGsは持続可能な開発目標。環境、貧困、教育、平和など多くの課題がつながっている。",
    svgKey: "sdgs"
  }
};
