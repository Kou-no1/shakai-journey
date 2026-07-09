// nodes-data.js
// 36ノード全件のメタデータ。QUESTION_BANK[nodeId]が存在するノードだけ実際に遊べる。
// (存在しないノードはmap-renderer.jsが「近日公開」として表示する)
window.NODES_DATA = {

  // ==================== 5年・国土ライン ====================
  s5_koku01: {
    lineId: "s5_koku", order: 1, stationName: "にっぽんスタート駅",
    unitName: "わたしたちの国土", subunitName: "世界の中の国土", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_chikyugi", "m_nihonchizu"], charaId: "c_chizu_annainin",
    ijinId: null, challengeStyle: "nintei"
  },
  s5_koku02: {
    lineId: "s5_koku", order: 2, stationName: "地形の秘境駅",
    unitName: "わたしたちの国土", subunitName: "国土の地形の特色", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_alps_badge"], charaId: "c_yamakawa_annainin",
    ijinId: null, challengeStyle: "nintei"
  },
  s5_koku03: {
    lineId: "s5_koku", order: 3, stationName: "輪中の里／高原の里",
    unitName: "わたしたちの国土", subunitName: "低い土地のくらし／高い土地のくらし", curriculumRef: "TODO",
    branch: {
      options: [
        { branchId: "wajyu",  label: "輪中の里",  meibutsuIds: ["m_chisui"],      charaId: "c_chisui_meijin" },
        { branchId: "kougen", label: "高原の里",  meibutsuIds: ["m_kougen_yasai"], charaId: "c_kougen_meijin" }
      ]
    },
    meibutsuIds: [], charaId: null, ijinId: null, challengeStyle: "nintei"
  },
  s5_koku04: {
    lineId: "s5_koku", order: 4, stationName: "気候めぐり駅",
    unitName: "わたしたちの国土", subunitName: "国土の気候の特色", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_uonzu_card"], charaId: "c_kisho_meijin",
    ijinId: null, challengeStyle: "nintei"
  },
  s5_koku05: {
    lineId: "s5_koku", order: 5, stationName: "南国の里／雪国の里",
    unitName: "わたしたちの国土", subunitName: "あたたかい土地のくらし／寒い土地のくらし", curriculumRef: "TODO",
    branch: {
      options: [
        { branchId: "nangoku", label: "南国の里", meibutsuIds: ["m_shiisaa"],     charaId: "c_nangoku_meijin" },
        { branchId: "yukiguni", label: "雪国の里", meibutsuIds: ["m_ryuhyou_goods"], charaId: "c_yukiguni_meijin" }
      ]
    },
    meibutsuIds: [], charaId: null, ijinId: null, challengeStyle: "nintei"
  },

  // ==================== 5年・食料生産ライン ====================
  s5_shoku01: {
    lineId: "s5_shoku", order: 1, stationName: "食卓のふるさと駅",
    unitName: "わたしたちの生活と食料生産", subunitName: "くらしを支える食料生産", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_oshinagaki"], charaId: "c_shokutaku_annainin",
    ijinId: null, challengeStyle: "nintei"
  },
  s5_shoku02: {
    lineId: "s5_shoku", order: 2, stationName: "お米の里",
    unitName: "わたしたちの生活と食料生産", subunitName: "米づくりのさかんな地域", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_shinmai_badge", "m_taue_model"], charaId: "c_okome_meijin",
    ijinId: null, challengeStyle: "nintei"
  },
  s5_shoku03: {
    lineId: "s5_shoku", order: 3, stationName: "漁港の里",
    unitName: "わたしたちの生活と食料生産", subunitName: "水産業のさかんな地域", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_sengyo_set", "m_teichiami_model"], charaId: "c_ryou_meijin",
    ijinId: null, challengeStyle: "nintei"
  },
  s5_shoku04: {
    lineId: "s5_shoku", order: 4, stationName: "食の未来駅",
    unitName: "わたしたちの生活と食料生産", subunitName: "これからの食料生産とわたしたち", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_chisan_badge"], charaId: "c_mirai_nouka",
    ijinId: null, challengeStyle: "nintei"
  },

  // ==================== 5年・工業生産ライン ====================
  s5_kogyo01: {
    lineId: "s5_kogyo", order: 1, stationName: "ものづくり入口駅",
    unitName: "わたしたちの生活と工業生産", subunitName: "くらしを支える工業生産", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_kengaku_pass"], charaId: "c_monozukuri_annainin",
    ijinId: null, challengeStyle: "nintei"
  },
  s5_kogyo02: {
    lineId: "s5_kogyo", order: 2, stationName: "自動車の里",
    unitName: "わたしたちの生活と工業生産", subunitName: "自動車をつくる工業", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_minicar", "m_line_diorama"], charaId: "c_jidosha_meijin",
    ijinId: null, challengeStyle: "nintei"
  },
  s5_kogyo03: {
    lineId: "s5_kogyo", order: 3, stationName: "貿易港駅",
    unitName: "わたしたちの生活と工業生産", subunitName: "工業生産を支える運輸と貿易", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_container_model"], charaId: "c_boueki_meijin",
    ijinId: null, challengeStyle: "nintei"
  },
  s5_kogyo04: {
    lineId: "s5_kogyo", order: 4, stationName: "工業の未来駅",
    unitName: "わたしたちの生活と工業生産", subunitName: "これからの工業生産とわたしたち", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_robot_arm"], charaId: "c_mirai_gijutsusha",
    ijinId: null, challengeStyle: "nintei"
  },

  // ==================== 5年・情報ライン ====================
  s5_joho01: {
    lineId: "s5_joho", order: 1, stationName: "放送局駅",
    unitName: "情報化した社会と産業の発展", subunitName: "情報産業とわたしたちのくらし", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_news_script", "m_camera_model"], charaId: "c_housou_annainin",
    ijinId: null, challengeStyle: "nintei"
  },
  s5_joho02: {
    lineId: "s5_joho", order: 2, stationName: "データ活用の里",
    unitName: "情報化した社会と産業の発展", subunitName: "情報を生かす産業", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_pos_model"], charaId: "c_data_meijin",
    ijinId: null, challengeStyle: "nintei"
  },
  s5_joho03: {
    lineId: "s5_joho", order: 3, stationName: "情報モラル駅",
    unitName: "情報化した社会と産業の発展", subunitName: "情報を生かすわたしたち", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_moral_badge"], charaId: "c_moral_annainin",
    ijinId: null, challengeStyle: "nintei"
  },

  // ==================== 5年・環境ライン ====================
  s5_kankyo01: {
    lineId: "s5_kankyo", order: 1, stationName: "防災の里",
    unitName: "わたしたちの生活と環境", subunitName: "自然災害を防ぐ", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_bousai_set"], charaId: "c_bousai_meijin",
    ijinId: null, challengeStyle: "nintei"
  },
  s5_kankyo02: {
    lineId: "s5_kankyo", order: 2, stationName: "森の恵み駅",
    unitName: "わたしたちの生活と環境", subunitName: "わたしたちの生活と森林", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_mokkouhin", "m_donguri_badge"], charaId: "c_mori_meijin",
    ijinId: null, challengeStyle: "nintei"
  },
  s5_kankyo03: {
    lineId: "s5_kankyo", order: 3, stationName: "エコの里",
    unitName: "わたしたちの生活と環境", subunitName: "環境を守るわたしたち", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_recycle_badge"], charaId: "c_eco_meijin",
    ijinId: null, challengeStyle: "nintei"
  },

  // ==================== 6年・政治ライン ====================
  s6_sei01: {
    lineId: "s6_sei", order: 1, stationName: "げんだい日本駅",
    unitName: "わたしたちの生活と政治", subunitName: "わたしたちのくらしと日本国憲法", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_kenpou_badge"], charaId: "c_kenpoukun",
    ijinId: null, challengeStyle: "nintei"
  },
  s6_sei02: {
    lineId: "s6_sei", order: 2, stationName: "国会議事堂駅",
    unitName: "わたしたちの生活と政治", subunitName: "国の政治のしくみと選挙", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_touhyou_model", "m_sanken_card"], charaId: "c_kenpoukun",
    ijinId: null, challengeStyle: "nintei"
  },
  s6_sei03: {
    lineId: "s6_sei", order: 3, stationName: "子育て支援の窓口／復興のまち",
    unitName: "わたしたちの生活と政治", subunitName: "子育て支援の願いを実現する政治／震災復興の願いを実現する政治", curriculumRef: "TODO",
    branch: {
      options: [
        { branchId: "kosodate", label: "子育て支援の窓口", meibutsuIds: ["m_kosodate_badge"], charaId: "c_kenpoukun" },
        { branchId: "fukkou",   label: "復興のまち",       meibutsuIds: ["m_fukkou_card"],     charaId: "c_kenpoukun" }
      ]
    },
    meibutsuIds: [], charaId: null, ijinId: null, challengeStyle: "nintei"
  },

  // ==================== 6年・歴史すごろく ====================
  s6_rek01: {
    lineId: "s6_rek", order: 1, stationName: "縄文・古墳の里",
    unitName: "日本の歴史", subunitName: "縄文のむらから古墳のくにへ", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_jomon_doki", "m_haniwa"], charaId: null,
    ijinId: "i_himiko", challengeStyle: "nintei"
  },
  s6_rek02: {
    lineId: "s6_rek", order: 2, stationName: "飛鳥・奈良の都",
    unitName: "日本の歴史", subunitName: "天皇中心の国づくり", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_daibutsu"], charaId: null,
    ijinId: "i_shotoku", challengeStyle: "nintei"
  },
  s6_rek03: {
    lineId: "s6_rek", order: 3, stationName: "平安貴族の都",
    unitName: "日本の歴史", subunitName: "貴族のくらし", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_junihitoe", "m_ougi"], charaId: null,
    ijinId: "i_michinaga", challengeStyle: "nintei"
  },
  s6_rek04: {
    lineId: "s6_rek", order: 4, stationName: "鎌倉武家の里",
    unitName: "日本の歴史", subunitName: "武士の世の中へ", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_katchu"], charaId: null,
    ijinId: "i_yoritomo", challengeStyle: "nintei"
  },
  s6_rek05: {
    lineId: "s6_rek", order: 5, stationName: "室町文化の里",
    unitName: "日本の歴史", subunitName: "今に伝わる室町文化", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_kinkaku_ginkaku"], charaId: null,
    ijinId: "i_yoshimasa", challengeStyle: "nintei"
  },
  s6_rek06: {
    lineId: "s6_rek", order: 6, stationName: "戦国の城下町",
    unitName: "日本の歴史", subunitName: "戦国の世から天下統一へ", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_teppou", "m_chaki"], charaId: null,
    ijinId: "i_nobunaga", challengeStyle: "nintei"
  },
  s6_rek07: {
    lineId: "s6_rek", order: 7, stationName: "江戸城下町",
    unitName: "日本の歴史", subunitName: "江戸幕府と政治の安定", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_sankinkoutai_kago"], charaId: null,
    ijinId: "i_ieyasu", challengeStyle: "nintei"
  },
  s6_rek08: {
    lineId: "s6_rek", order: 8, stationName: "町人文化の里",
    unitName: "日本の歴史", subunitName: "町人の文化と新しい学問", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_ukiyoe"], charaId: null,
    ijinId: "i_sugita", challengeStyle: "nintei"
  },
  s6_rek09: {
    lineId: "s6_rek", order: 9, stationName: "明治維新の都",
    unitName: "日本の歴史", subunitName: "明治の国づくりを進めた人々", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_tetsudou_model"], charaId: null,
    ijinId: "i_saigou", challengeStyle: "nintei"
  },
  s6_rek10: {
    lineId: "s6_rek", order: 10, stationName: "近代日本の港",
    unitName: "日本の歴史", subunitName: "世界に歩み出した日本", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_jouyaku_medal"], charaId: null,
    ijinId: "i_mutsu", challengeStyle: "nintei"
  },
  s6_rek11: {
    lineId: "s6_rek", order: 11, stationName: "戦争と人々のくらしの里",
    unitName: "日本の歴史", subunitName: "長く続いた戦争と人々のくらし", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_haikyu_kippu", "m_bokuzukin"], charaId: null,
    ijinId: null, challengeStyle: "kikitori"
  },
  s6_rek12: {
    lineId: "s6_rek", order: 12, stationName: "戦後復興の都",
    unitName: "日本の歴史", subunitName: "新しい日本、平和な日本へ", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_tokyo_tower"], charaId: null,
    ijinId: null, challengeStyle: "nintei"
  },

  // ==================== 6年・世界路線 ====================
  s6_kok01: {
    lineId: "s6_kok", order: 1, stationName: "世界の隣人駅",
    unitName: "世界の中の日本", subunitName: "日本とつながりの深い国々", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_kokki_collection"], charaId: "c_kenpoukun",
    ijinId: null, challengeStyle: "nintei"
  },
  s6_kok02: {
    lineId: "s6_kok", order: 2, stationName: "世界会議の間",
    unitName: "世界の中の日本", subunitName: "世界の未来と日本の役割", curriculumRef: "TODO",
    branch: null, meibutsuIds: ["m_kokuren_badge", "m_sdgs_pin"], charaId: "c_kenpoukun",
    ijinId: null, challengeStyle: "nintei"
  }
};
