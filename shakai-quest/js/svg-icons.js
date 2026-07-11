(function () {
  "use strict";

  function esc(value) {
    return String(value == null ? "" : value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function iconShell(inner, label, className, viewBox) {
    return [
      '<svg class="', esc(className || "sq-icon"), '" viewBox="', esc(viewBox || "0 0 80 80"), '" role="img" aria-label="', esc(label || "アイコン"), '" focusable="false">',
      inner,
      '</svg>'
    ].join("");
  }

  function badge(color, inner, label) {
    return iconShell([
      '<g style="color:', color, '">',
      '<circle cx="40" cy="40" r="36" fill="currentColor" opacity=".14"/>',
      '<circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" stroke-width="3"/>',
      '<g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">',
      inner,
      '</g></g>'
    ].join(""), label, "sq-icon sq-icon-badge");
  }

  var LINE_COLOR = {
    s5_koku: "var(--line-koku)",
    s5_shoku: "var(--line-shoku)",
    s5_kogyo: "var(--line-kogyo)",
    s5_joho: "var(--line-joho)",
    s5_kankyo: "var(--line-kankyo)",
    s6_sei: "var(--line-sei)",
    s6_rek: "var(--line-rek)",
    s6_kok: "var(--line-kok)"
  };

  var ICON_COLOR = {
    globe_badge: LINE_COLOR.s5_koku,
    japan_map: LINE_COLOR.s5_koku,
    mountain: LINE_COLOR.s5_koku,
    levee_model: LINE_COLOR.s5_koku,
    cabbage_set: LINE_COLOR.s5_koku,
    chart: LINE_COLOR.s5_koku,
    shiisaa: LINE_COLOR.s5_koku,
    ice: LINE_COLOR.s5_koku,
    menu: LINE_COLOR.s5_shoku,
    rice: LINE_COLOR.s5_shoku,
    tractor: LINE_COLOR.s5_shoku,
    fish: LINE_COLOR.s5_shoku,
    net: LINE_COLOR.s5_shoku,
    local_food: LINE_COLOR.s5_shoku,
    factory: LINE_COLOR.s5_kogyo,
    car: LINE_COLOR.s5_kogyo,
    line: LINE_COLOR.s5_kogyo,
    container: LINE_COLOR.s5_kogyo,
    robot: LINE_COLOR.s5_kogyo,
    news: LINE_COLOR.s5_joho,
    camera: LINE_COLOR.s5_joho,
    register: LINE_COLOR.s5_joho,
    shield: LINE_COLOR.s5_joho,
    bousai: LINE_COLOR.s5_kankyo,
    wood: LINE_COLOR.s5_kankyo,
    acorn: LINE_COLOR.s5_kankyo,
    recycle: LINE_COLOR.s5_kankyo,
    constitution: LINE_COLOR.s6_sei,
    ballot: LINE_COLOR.s6_sei,
    three_powers: LINE_COLOR.s6_sei,
    support: LINE_COLOR.s6_sei,
    rebuild: LINE_COLOR.s6_sei,
    pottery: LINE_COLOR.s6_rek,
    haniwa: LINE_COLOR.s6_rek,
    daibutsu: LINE_COLOR.s6_rek,
    kimono: LINE_COLOR.s6_rek,
    fan: LINE_COLOR.s6_rek,
    armor: LINE_COLOR.s6_rek,
    temple: LINE_COLOR.s6_rek,
    matchlock: LINE_COLOR.s6_rek,
    tea_set: LINE_COLOR.s6_rek,
    kago: LINE_COLOR.s6_rek,
    ukiyoe: LINE_COLOR.s6_rek,
    train: LINE_COLOR.s6_rek,
    medal: LINE_COLOR.s6_rek,
    tower: LINE_COLOR.s6_rek,
    flag: LINE_COLOR.s6_kok,
    un: LINE_COLOR.s6_kok,
    sdgs: LINE_COLOR.s6_kok,
    eq_hint_free: LINE_COLOR.s5_koku,
    eq_exp_boost: LINE_COLOR.s6_rek,
    eq_combo_keep: LINE_COLOR.s6_sei,
    eq_double_crit: LINE_COLOR.s6_kok,
    item: "var(--stamp)"
  };

  var SOMBER_KEYS = {
    ration_ticket: true,
    air_raid_hood: true
  };

  function badgeMark(key) {
    switch (key) {
      case "globe_badge":
        return '<circle cx="40" cy="39" r="18"/><path d="M22 39h36M40 21c8 8 8 28 0 36M40 21c-8 8-8 28 0 36"/>';
      case "japan_map":
        return '<path d="M45 12c5 5 1 9 6 14 4 4 9 6 7 12-2 7-9 5-10 11-1 6 5 8 0 13-5 4-10-1-14 3-5 4-13 5-17-1-4-6 4-9 1-15-3-5-10-4-8-11 1-6 8-6 12-10 5-5 4-12 10-16 4-2 9-3 13 0Z"/><circle cx="40" cy="38" r="2.5" fill="currentColor" stroke="none"/>';
      case "mountain":
        return '<path d="M13 56 32 24l9 14 7-10 19 28H13Z"/><path d="M32 24l3 14 6 0M48 28l2 12 5-1"/>';
      case "levee_model":
        return '<path d="M12 52c8-8 16-8 28 0s20 8 28 0"/><path d="M18 44h44L51 22H29L18 44Z"/><path d="M30 44V27M40 44V25M50 44V27"/>';
      case "cabbage_set":
        return '<circle cx="31" cy="42" r="14"/><circle cx="47" cy="39" r="15"/><path d="M20 43c6-8 14-9 24-2M39 33c6-5 13-5 20 1"/>';
      case "chart":
        return '<path d="M18 58V20M18 58h44"/><path d="M23 47c9 3 12-16 20-12s9-12 17-9"/><path d="M25 27h6M34 42h6M48 28h6"/>';
      case "shiisaa":
        return '<path d="M22 50V35l9-8h19l8 8v15"/><circle cx="33" cy="38" r="2" fill="currentColor" stroke="none"/><circle cx="47" cy="38" r="2" fill="currentColor" stroke="none"/><path d="M30 50c5 4 15 4 20 0M23 30l-7-8M57 30l7-8M31 27l-5-9M49 27l5-9"/>';
      case "ice":
        return '<path d="M21 22h38l-7 34H28L21 22Z"/><path d="M29 30h22M33 40h14M24 56c10 5 22 5 32 0"/>';
      case "menu":
        return '<path d="M22 17h36v46H22Z"/><path d="M30 29h20M30 39h20M30 49h12"/><path d="M18 24h8M18 36h8M18 48h8"/>';
      case "rice":
        return '<path d="M31 58c-5-14-4-28 3-42M41 60c-3-18-1-31 5-44M51 58c4-16 2-29-5-39"/><path d="M34 19c4 4 4 8 0 12M45 18c4 5 4 9 0 13M49 29c5 3 6 7 3 12" fill="currentColor" stroke="none"/>';
      case "tractor":
        return '<circle cx="29" cy="52" r="9"/><circle cx="54" cy="54" r="6"/><path d="M20 51h42l-7-18H40V23H28v15h-8"/><path d="M15 37h15"/>';
      case "fish":
        return '<path d="M18 40c9-13 27-13 39 0-12 13-30 13-39 0Z"/><path d="M57 40l10-10v20L57 40Z"/><circle cx="30" cy="38" r="2" fill="currentColor" stroke="none"/>';
      case "net":
        return '<path d="M16 21h46v36H16Z"/><path d="M16 33h46M16 45h46M28 21v36M40 21v36M52 21v36"/>';
      case "local_food":
        return '<circle cx="40" cy="40" r="18"/><path d="M26 55h28M40 21v36M23 40h34"/><path d="M29 27c6 5 16 5 22 0"/>';
      case "factory":
        return '<path d="M16 58V34l13 8v-8l13 8v-8l13 8V21h9v37H16Z"/><path d="M23 50h6M36 50h6M49 50h6"/>';
      case "car":
        return '<path d="M17 47h46l-7-15H27l-10 15Z"/><circle cx="28" cy="51" r="5"/><circle cx="52" cy="51" r="5"/><path d="M32 32v15M48 32v15"/>';
      case "line":
        return '<path d="M14 50h52"/><circle cx="22" cy="50" r="5"/><circle cx="40" cy="50" r="5"/><circle cx="58" cy="50" r="5"/><path d="M22 30h36M28 22h24"/>';
      case "container":
        return '<path d="M12 45h44l10 11H22L12 45Z"/><path d="M18 25h35v20H18Z"/><path d="M26 25v20M35 25v20M44 25v20"/>';
      case "robot":
        return '<path d="M25 25h31v21H25Z"/><path d="M26 46 18 58M54 46l9 12M40 25V15"/><circle cx="35" cy="35" r="2" fill="currentColor" stroke="none"/><circle cx="47" cy="35" r="2" fill="currentColor" stroke="none"/>';
      case "news":
        return '<path d="M18 18h44v44H18Z"/><path d="M26 29h26M26 39h26M26 49h16"/><path d="M13 26h5v30c0 4-2 6-5 6Z"/>';
      case "camera":
        return '<path d="M18 29h12l4-7h14l4 7h10v29H18Z"/><circle cx="40" cy="43" r="10"/><path d="M53 35h2"/>';
      case "register":
        return '<path d="M22 33h34v25H22Z"/><path d="M28 22h24v11H28Z"/><path d="M29 43h4M38 43h4M47 43h4M29 51h22"/>';
      case "shield":
        return '<path d="M40 14 60 23v15c0 15-8 24-20 29-12-5-20-14-20-29V23l20-9Z"/><path d="M31 40l6 6 13-15"/>';
      case "bousai":
        return '<path d="M22 31c2-10 10-16 18-16s16 6 18 16v8H22v-8Z"/><path d="M18 39h44M26 49h28M30 58h20"/>';
      case "wood":
        return '<path d="M19 50h42"/><path d="M26 18v34M40 12v40M54 20v32"/><path d="M26 22c-7 3-10 8-9 15M26 30c8-2 12-8 11-15M40 20c-9 3-13 10-12 18M40 28c10-2 15-9 14-17M54 26c-7 3-10 8-9 15M54 34c8-2 12-8 11-15"/>';
      case "acorn":
        return '<path d="M25 34h30v10c0 11-7 19-15 19s-15-8-15-19V34Z"/><path d="M24 34c3-9 29-9 32 0M40 21v9"/>';
      case "recycle":
        return '<path d="M33 20 42 15l5 9M42 15l7 14"/><path d="M56 40l-1 10H44M55 50l-15 1"/><path d="M26 55l-8-6 6-8M18 49l8-14"/>';
      case "constitution":
        return '<path d="M22 16h36v48H22Z"/><path d="M30 28h20M30 38h20M30 48h13"/><path d="M14 22h12M14 36h12M14 50h12"/>';
      case "ballot":
        return '<path d="M19 40h42v20H19Z"/><path d="M31 21h24l-5 19H26l5-19Z"/><path d="M27 40h27"/>';
      case "three_powers":
        return '<path d="M40 18v42M20 33h40"/><circle cx="40" cy="18" r="4" fill="currentColor" stroke="none"/><path d="M20 33l-8 18h16l-8-18ZM60 33l-8 18h16l-8-18Z"/>';
      case "support":
        return '<circle cx="29" cy="32" r="8"/><circle cx="51" cy="32" r="8"/><path d="M18 58c3-11 8-16 15-16M62 58c-3-11-8-16-15-16M31 53h18"/>';
      case "rebuild":
        return '<path d="M16 58h48"/><path d="M24 58V37l16-13 16 13v21"/><path d="M30 28V18h12M35 58V45h10v13"/>';
      case "pottery":
        return '<path d="M27 18h26l-4 11c7 5 8 25-9 33-17-8-16-28-9-33l-4-11Z"/><path d="M29 31h22M28 43c8-5 16 5 24 0"/>';
      case "haniwa":
        return '<circle cx="40" cy="22" r="10"/><path d="M29 32h22v29H29Z"/><path d="M29 42H18M51 42h11M35 50h10"/><circle cx="36" cy="21" r="1.5" fill="currentColor" stroke="none"/><circle cx="44" cy="21" r="1.5" fill="currentColor" stroke="none"/>';
      case "daibutsu":
        return '<circle cx="40" cy="28" r="13"/><path d="M21 63c4-16 12-24 19-24s15 8 19 24H21Z"/><path d="M28 18c8-6 16-6 24 0M30 33c6 4 14 4 20 0"/>';
      case "kimono":
        return '<path d="M25 16h30l7 47H18l7-47Z"/><path d="M25 16l15 22 15-22M31 28l-8 12M49 28l8 12"/>';
      case "fan":
        return '<path d="M40 57 20 23c13-8 27-8 40 0L40 57Z"/><path d="M40 57V20M40 57 28 21M40 57l12-36"/>';
      case "armor":
        return '<path d="M24 30h32v30H24Z"/><path d="M21 30c3-12 12-18 19-18s16 6 19 18"/><path d="M31 30v30M49 30v30M24 44h32"/>';
      case "temple":
        return '<path d="M18 30h44M24 42h32M28 58h24"/><path d="M22 30 40 17l18 13M30 42v16M50 42v16"/>';
      case "matchlock":
        return '<path d="M13 49 56 40l5 6-42 11Z"/><path d="M50 27h8v16h-8Z"/><path d="M14 49 8 58l11-2"/>';
      case "tea_set":
        return '<path d="M22 31h31v12c0 10-7 16-16 16s-15-6-15-16V31Z"/><path d="M53 35h5c5 0 8 4 6 9-2 6-7 8-12 5M25 24h25M31 17h13"/>';
      case "kago":
        return '<path d="M16 24h48"/><path d="M24 32h32v22H24Z"/><path d="M29 54l-4 9M51 54l4 9M31 32V24M49 32V24"/>';
      case "ukiyoe":
        return '<path d="M18 18h44v44H18Z"/><path d="M24 48c8-12 16-7 24-19 4 8 8 12 14 15"/><path d="M25 26h14M25 34h10"/>';
      case "train":
        return '<path d="M20 19h40v31H20Z"/><path d="M26 26h10M44 26h10M20 40h40"/><circle cx="30" cy="56" r="5"/><circle cx="50" cy="56" r="5"/>';
      case "medal":
        return '<path d="M28 16h24l-6 17H34L28 16Z"/><circle cx="40" cy="49" r="14"/><path d="M35 49h10M40 44v10"/>';
      case "tower":
        return '<path d="M40 13 55 63H25L40 13Z"/><path d="M31 42h18M28 52h24M35 29h10"/>';
      case "flag":
        return '<path d="M23 62V18"/><path d="M23 20c10-6 19 6 32 0v25c-13 6-22-6-32 0V20Z"/>';
      case "un":
        return '<circle cx="40" cy="40" r="17"/><path d="M23 40h34M40 23c7 8 7 26 0 34M40 23c-7 8-7 26 0 34"/><path d="M20 57c8 5 32 5 40 0"/>';
      case "sdgs":
        return '<circle cx="40" cy="40" r="21"/><path d="M40 19v42M19 40h42M25 25l30 30M55 25 25 55"/>';
      case "eq_hint_free":
        return '<circle cx="34" cy="34" r="13"/><path d="M44 44l14 14M31 34h6M34 31v6"/>';
      case "eq_exp_boost":
        return '<path d="M40 13l8 18 19 2-14 13 4 19-17-10-17 10 4-19-14-13 19-2 8-18Z"/><path d="M32 43h16"/>';
      case "eq_combo_keep":
        return '<path d="M21 17h38v46H21Z"/><path d="M30 30h20M30 42h20M30 54h12"/><path d="M18 24h8"/>';
      case "eq_double_crit":
        return '<path d="M25 21h18l12 12-25 25L13 41 25 21Z"/><path d="M41 21 59 39M30 58l25-25"/>';
      case "item":
        return '<path d="M22 24h36v32H22Z"/><path d="M28 24c0-7 5-12 12-12s12 5 12 12M32 40h16M40 32v16"/>';
      default:
        return "";
    }
  }

  function somberIcon(key, label) {
    if (key === "ration_ticket") {
      return iconShell([
        '<rect x="10" y="24" width="60" height="34" rx="2" fill="#d9cfb8" stroke="#8a8060" stroke-width="1.6" stroke-dasharray="3 3"/>',
        '<path d="M18 35h42M18 44h29" stroke="#8a8060" stroke-width="1.6" stroke-linecap="round"/>',
        '<path d="M51 24v34" stroke="#8a8060" stroke-width="1.2" stroke-dasharray="4 4"/>'
      ].join(""), label, "sq-icon sq-icon-somber");
    }
    return iconShell([
      '<path d="M20 56V30c0-12 8-20 20-20s20 8 20 20v26H20Z" fill="#d9cfb8" stroke="#8a8060" stroke-width="2"/>',
      '<path d="M28 38c7 5 17 5 24 0M34 27h1M46 27h1" stroke="#8a8060" stroke-width="3" stroke-linecap="round"/>',
      '<path d="M23 56h34" stroke="#8a8060" stroke-width="2" stroke-linecap="round"/>'
    ].join(""), label, "sq-icon sq-icon-somber");
  }

  var IJIN_KEYS = {
    ijin_nobunaga: "helm",
    ijin_himiko: "mirror",
    ijin_shotoku: "cap",
    ijin_michinaga: "court",
    ijin_yoritomo: "armor",
    ijin_yoshimasa: "temple",
    ijin_ieyasu: "crest",
    ijin_sugita: "book",
    ijin_saigou: "uniform",
    ijin_mutsu: "treaty"
  };

  function ijinIcon(key, label) {
    var type = IJIN_KEYS[key] || "card";
    var prop = "";
    if (type === "helm") prop = '<path d="M40 12l16 19H24L40 12ZM33 15l-5-8M47 15l5-8"/>';
    if (type === "mirror") prop = '<circle cx="40" cy="16" r="8"/><path d="M40 24v9"/>';
    if (type === "cap") prop = '<path d="M29 18h22l-4-9H33l-4 9ZM24 25h32"/>';
    if (type === "court") prop = '<path d="M35 10h10l3 15H32l3-15ZM26 49l14-10 14 10"/>';
    if (type === "armor") prop = '<path d="M24 24c4-10 12-15 16-15s12 5 16 15M31 53h18"/>';
    if (type === "temple") prop = '<path d="M20 24h40M28 18h24M25 30h30"/>';
    if (type === "crest") prop = '<path d="M40 9l6 11h12l-9 8 4 12-13-7-13 7 4-12-9-8h12l6-11Z"/>';
    if (type === "book") prop = '<path d="M18 47c9-5 17-5 22 0 5-5 13-5 22 0V24c-9-5-17-5-22 0-5-5-13-5-22 0v23Z"/>';
    if (type === "uniform") prop = '<path d="M28 18h24M30 13h20M32 53h16"/>';
    if (type === "treaty") prop = '<path d="M52 18h14v26H52Z"/><path d="M56 27h6M56 35h6"/>';
    return iconShell([
      '<g style="color:', LINE_COLOR.s6_rek, '" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">',
      prop,
      '<circle cx="40" cy="31" r="11"/>',
      '<path d="M21 66c3-16 11-25 19-25s16 9 19 25H21Z"/>',
      '</g>'
    ].join(""), label, "sq-icon sq-icon-ijin");
  }

  var CHARA_COLOR = {
    c_chizu_annainin: LINE_COLOR.s5_koku,
    c_chisui_meijin: LINE_COLOR.s5_koku,
    c_kougen_meijin: LINE_COLOR.s5_koku,
    c_yamakawa_annainin: LINE_COLOR.s5_koku,
    c_kisho_meijin: LINE_COLOR.s5_koku,
    c_nangoku_meijin: LINE_COLOR.s5_koku,
    c_yukiguni_meijin: LINE_COLOR.s5_koku,
    c_shokutaku_annainin: LINE_COLOR.s5_shoku,
    c_okome_meijin: LINE_COLOR.s5_shoku,
    c_ryou_meijin: LINE_COLOR.s5_shoku,
    c_mirai_nouka: LINE_COLOR.s5_shoku,
    c_monozukuri_annainin: LINE_COLOR.s5_kogyo,
    c_jidosha_meijin: LINE_COLOR.s5_kogyo,
    c_boueki_meijin: LINE_COLOR.s5_kogyo,
    c_mirai_gijutsusha: LINE_COLOR.s5_kogyo,
    c_housou_annainin: LINE_COLOR.s5_joho,
    c_data_meijin: LINE_COLOR.s5_joho,
    c_moral_annainin: LINE_COLOR.s5_joho,
    c_bousai_meijin: LINE_COLOR.s5_kankyo,
    c_mori_meijin: LINE_COLOR.s5_kankyo,
    c_eco_meijin: LINE_COLOR.s5_kankyo,
    c_kenpoukun: LINE_COLOR.s6_sei
  };

  function charaProp(key) {
    switch (key) {
      case "c_chizu_annainin": return '<circle cx="61" cy="55" r="9"/><path d="M52 55h9M61 46v18"/>';
      case "c_chisui_meijin": return '<path d="M54 58c4-4 8-4 12 0M55 50h10l-3-8h-4l-3 8Z"/>';
      case "c_kougen_meijin": return '<circle cx="58" cy="53" r="8"/><path d="M51 53c5-5 10-5 15 0"/>';
      case "c_yamakawa_annainin": return '<path d="M52 58 59 44l7 14M54 58h13"/>';
      case "c_kisho_meijin": return '<path d="M52 50c1-6 12-6 13 0 5 1 5 8-1 9H53c-6-1-6-8-1-9Z"/>';
      case "c_nangoku_meijin": return '<circle cx="60" cy="48" r="6"/><path d="M60 36v5M60 55v5M48 48h5M67 48h5"/>';
      case "c_yukiguni_meijin": return '<path d="M60 42v18M52 46l16 10M68 46 52 56"/>';
      case "c_shokutaku_annainin": return '<path d="M54 47h14M57 47v14M65 47v14"/>';
      case "c_okome_meijin": return '<path d="M58 61c-4-10-3-18 2-26M64 60c2-10 1-18-3-25"/>';
      case "c_ryou_meijin": return '<path d="M53 52c6-8 14-8 20 0-6 8-14 8-20 0Z"/>';
      case "c_mirai_nouka": return '<path d="M60 61V45M52 49c5 0 8 4 8 8M68 49c-5 0-8 4-8 8"/>';
      case "c_monozukuri_annainin": return '<path d="M56 41 69 54M64 39l-8 8"/>';
      case "c_jidosha_meijin": return '<path d="M52 55h18l-3-7H56l-4 7Z"/><circle cx="57" cy="58" r="2"/><circle cx="66" cy="58" r="2"/>';
      case "c_boueki_meijin": return '<path d="M52 55h18l-4 6H56l-4-6ZM58 47h8v8h-8Z"/>';
      case "c_mirai_gijutsusha": return '<path d="M54 45h13v10H54Z"/><path d="M61 45V35M55 60h11"/>';
      case "c_housou_annainin": return '<path d="M58 42h8v16h-8Z"/><path d="M54 58h16"/>';
      case "c_data_meijin": return '<rect x="53" y="43" width="16" height="20" rx="2"/><path d="M57 49h8M57 55h8"/>';
      case "c_moral_annainin": return '<path d="M61 39 72 45v9c0 7-4 12-11 15-7-3-11-8-11-15v-9l11-6Z"/>';
      case "c_bousai_meijin": return '<path d="M52 46c1-7 6-10 10-10s9 3 10 10v5H52v-5Z"/>';
      case "c_mori_meijin": return '<path d="M61 36 72 56H50l11-20ZM61 56v9"/>';
      case "c_eco_meijin": return '<path d="M61 38l7 9h-6M68 47l-6 9M53 56h10M53 56l5-8"/>';
      case "c_kenpoukun": return '<path d="M54 43h14v20H54Z"/><path d="M58 50h6M58 56h6"/>';
      default: return '<circle cx="61" cy="52" r="8"/>';
    }
  }

  function charaIcon(key, label) {
    var color = CHARA_COLOR[key] || LINE_COLOR.s5_koku;
    return iconShell([
      '<g style="color:', color, '" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">',
      '<circle cx="40" cy="53" r="21" fill="currentColor" opacity=".92" stroke="none"/>',
      '<circle cx="40" cy="27" r="15" fill="#f0d9b5" stroke="none"/>',
      '<circle cx="34" cy="27" r="2" fill="var(--ink)" stroke="none"/>',
      '<circle cx="46" cy="27" r="2" fill="var(--ink)" stroke="none"/>',
      '<path d="M34 34c4 3 8 3 12 0" stroke="var(--ink)" stroke-width="1.8"/>',
      charaProp(key),
      '</g>'
    ].join(""), label, "sq-icon sq-icon-chara");
  }

  function renderIcon(key, label) {
    var k = String(key || "generic");
    if (SOMBER_KEYS[k]) return somberIcon(k, label);
    if (ICON_COLOR[k]) return badge(ICON_COLOR[k], badgeMark(k), label);
    if (IJIN_KEYS[k]) return ijinIcon(k, label);
    if (CHARA_COLOR[k]) return charaIcon(k, label);
    if (k === "ijin") return ijinIcon("ijin_nobunaga", label);
    if (k === "world") return badge(LINE_COLOR.s6_kok, '<circle cx="40" cy="40" r="18"/><path d="M23 40h34M40 22c8 8 8 28 0 36M40 22c-8 8-8 28 0 36"/><path d="M25 30c6-4 12-3 18 0 5 2 10 1 14-2M23 50c7-2 12 2 18 4 6 2 10-2 16-1"/>', label);
    return iconShell('<path d="M40 10l8 18 19 3-14 13 4 19-17-10-17 10 4-19-14-13 19-3 8-18Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>', label, "sq-icon sq-icon-generic");
  }

  function scene(nodeId) {
    switch (nodeId) {
      case "s5_koku01": return '<circle cx="54" cy="42" r="18"/><path d="M36 42h36M54 24c7 8 7 28 0 36M116 28h48l-8 36h-48Z"/>';
      case "s5_koku02": return '<path d="M26 72 62 25l19 28 13-18 38 37H26Z"/><path d="M75 64c28-12 43 6 69-8"/>';
      case "s5_koku03": return '<path d="M18 70c23-22 44-22 72 0M100 72c20-19 38-19 67 0"/><path d="M40 58h36M117 54c14-14 26-15 40-1"/>';
      case "s5_koku04": return '<path d="M35 39c4-19 37-18 40 1 17 2 18 24-2 26H38c-22-1-22-25-3-27Z"/><path d="M121 33v32M121 65h45M131 55c9-6 13-25 25-19"/>';
      case "s5_koku05": return '<circle cx="50" cy="34" r="15"/><path d="M32 70h48V48L56 33 32 48v22ZM118 72h50M130 45v24M145 35v34M160 51v18"/>';
      case "s5_shoku01": return '<path d="M35 37h60v28H35Z"/><path d="M50 48h30M50 57h22M121 33c11 18 11 31 0 42M141 33c-11 18-11 31 0 42"/>';
      case "s5_shoku02": return '<path d="M18 70c30-12 64-12 96 0M30 65c-5-17-3-32 8-49M54 66c-3-20 1-35 12-50M78 66c6-18 5-34-7-49"/>';
      case "s5_shoku03": return '<path d="M0 70c40-18 80 18 120 0s60-6 80 0"/><path d="M62 52c17-18 40-18 58 0-18 17-41 17-58 0Z"/>';
      case "s5_shoku04": return '<path d="M38 70V38M26 48c10 1 12 9 12 17M50 48c-10 1-12 9-12 17M104 62h54M118 48h26M131 36v34"/>';
      case "s5_kogyo01": return '<path d="M24 70V42l23 13V42l23 13V42l23 13V25h18v45H24Z"/><path d="M36 62h14M65 62h14"/>';
      case "s5_kogyo02": return '<path d="M24 60h86l-13-25H44L24 60Z"/><circle cx="45" cy="65" r="8"/><circle cx="88" cy="65" r="8"/><path d="M128 32h44M128 48h44M128 64h44"/>';
      case "s5_kogyo03": return '<path d="M16 62h96l20 12H36L16 62Z"/><path d="M38 36h72v26H38Z"/><path d="M132 42h36v20h-36Z"/>';
      case "s5_kogyo04": return '<path d="M48 38h38v23H48Z"/><path d="M67 38V20M33 70h68M108 24h22v30h-22ZM130 54l22 16"/>';
      case "s5_joho01": return '<path d="M28 31h82v44H28Z"/><path d="M43 46h32M43 58h44M123 38l35-16v51l-35-16V38Z"/>';
      case "s5_joho02": return '<path d="M32 40h62v33H32Z"/><path d="M43 27h40v13H43Z"/><path d="M115 68V32M115 32l18 18 18-28 20 18"/>';
      case "s5_joho03": return '<path d="M64 26 98 40v22c0 20-13 32-34 40-21-8-34-20-34-40V40l34-14Z"/><path d="M52 58l9 9 20-24"/>';
      case "s5_kankyo01": return '<path d="M36 46c2-19 17-30 34-30s31 11 34 30v15H36V46Z"/><path d="M27 61h88M42 72h56M130 28l35 44H122l18-24"/>';
      case "s5_kankyo02": return '<path d="M32 72V30M70 72V20M108 72V35"/><path d="M32 36c-24 8-22 28 0 30M70 29c-24 9-26 31 0 36M108 43c-20 8-19 25 0 28"/>';
      case "s5_kankyo03": return '<path d="M67 28 83 18l10 17M83 18l13 27M119 53l-2 20H94M117 73l-31 1M55 78l-18-12 14-17M37 66l18-28"/>';
      case "s6_sei01": return '<path d="M40 24h62v50H40Z"/><path d="M54 38h34M54 50h34M54 62h22M112 70h36M130 32v38"/>';
      case "s6_sei02": return '<path d="M27 44h57v28H27Z"/><path d="M44 20h35l-8 24H35l9-24Z"/><path d="M112 38h42M133 20v52M112 72h42"/>';
      case "s6_sei03": return '<path d="M26 70V46l24-18 24 18v24M39 70V56h22v14M115 70V38M96 50c14 0 19 9 19 20M134 50c-14 0-19 9-19 20"/>';
      case "s6_rek01": return '<path d="M42 72 70 38l28 34H42Z"/><path d="M118 68c0-18 8-32 18-32s18 14 18 32M128 35h16"/>';
      case "s6_rek02": return '<path d="M40 72c6-23 18-36 31-36s25 13 31 36H40Z"/><circle cx="71" cy="34" r="18"/><path d="M116 72h52M124 53h36M142 33v39"/>';
      case "s6_rek03": return '<path d="M34 72V38l36-20 36 20v34M52 72V49h36v23M124 60l33-36 22 48"/>';
      case "s6_rek04": return '<path d="M28 72V42l36-22 36 22v30M50 72V52h28v20M122 45h46M132 30h26M145 30v42"/>';
      case "s6_rek05": return '<path d="M26 72h62M34 56h46M42 40h30M56 20 82 40H30l26-20ZM120 72h52M128 58h36M136 43h20"/>';
      case "s6_rek06": return '<path d="M70 72V39h28V27l24 18v27H70Z"/><path d="M62 39l22-25 22 25M26 72 67 61M27 60l40-8"/>';
      case "s6_rek07": return '<path d="M37 72V36l34-22 34 22v36M58 72V50h26v22M120 63h42M128 48h26M141 36v27"/>';
      case "s6_rek08": return '<path d="M34 28h56v42H34Z"/><path d="M43 57c14-19 27-10 42-29M111 70c0-20 13-38 31-46 17 8 29 26 29 46"/>';
      case "s6_rek09": return '<path d="M28 35h80v36H28Z"/><path d="M42 48h18M74 48h18M28 60h80"/><circle cx="48" cy="75" r="8"/><circle cx="88" cy="75" r="8"/><path d="M125 70h48M135 30v40"/>';
      case "s6_rek10": return '<path d="M22 64h90l20 12H42L22 64Z"/><path d="M50 39h48v25H50Z"/><path d="M128 30h38v38h-38Z"/>';
      case "s6_rek11": return '<path d="M34 34h64v36H34Z"/><path d="M45 47h38M45 58h25M116 70V42c0-15 10-25 24-25s24 10 24 25v28"/>';
      case "s6_rek12": return '<path d="M64 16 95 76H33L64 16Z"/><path d="M47 48h34M41 61h46M56 34h16M118 74h42M130 52h18"/>';
      case "s6_kok01": return '<circle cx="62" cy="50" r="25"/><path d="M37 50h50M62 25c10 11 10 39 0 50M62 25c-10 11-10 39 0 50M118 73V28M118 31c19-10 31 9 53 0v30c-22 10-34-10-53 0"/>';
      case "s6_kok02": return '<circle cx="66" cy="48" r="25"/><path d="M41 48h50M66 23v50M118 34h42M118 54h42M118 74h42M139 22v60"/>';
      default: return "";
    }
  }

  function stationBackground(nodeId) {
    var node = window.NODES_DATA && window.NODES_DATA[nodeId];
    var color = node ? LINE_COLOR[node.lineId] || "var(--stamp)" : "var(--stamp)";
    var inner = scene(nodeId);
    if (!inner) return "";
    return [
      '<svg class="station-bg" viewBox="0 0 200 100" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">',
      '<g style="color:', color, '" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">',
      '<path d="M0 82c45-18 82-8 120-14 34-6 56 1 80 10v22H0V82Z" fill="currentColor" stroke="none" opacity=".12"/>',
      inner,
      '</g></svg>'
    ].join("");
  }

  function resultStamp(label, subdued) {
    var color = subdued ? "#6e6550" : "var(--stamp)";
    return [
      '<div class="stamp-stage ', subdued ? 'kikitori' : '', '" aria-hidden="true">',
      '<div class="impact-ring"></div>',
      '<svg class="hanko-stamp-anim" viewBox="0 0 100 100" style="color:', color, '" focusable="false">',
      '<g filter="url(#rough)" fill="none" stroke="currentColor" stroke-width="5"><circle cx="50" cy="50" r="40"/></g>',
      '<text x="50" y="45" text-anchor="middle" font-size="17" fill="currentColor" filter="url(#rough)" font-family="system-ui, sans-serif" font-weight="800">', esc(label || "朱印"), '</text>',
      '<text x="50" y="66" text-anchor="middle" font-size="14" fill="currentColor" filter="url(#rough)" font-family="system-ui, sans-serif" font-weight="800">済</text>',
      '</svg>',
      '</div>'
    ].join("");
  }

  function hasCustomIcon(key) {
    var k = String(key || "");
    return !!(SOMBER_KEYS[k] || ICON_COLOR[k] || IJIN_KEYS[k] || CHARA_COLOR[k] || k === "ijin" || k === "world");
  }

  function hasStationBackground(nodeId) {
    return !!scene(nodeId);
  }

  window.ShakaiUtil = { esc: esc };
  window.ShakaiIcons = {
    render: renderIcon,
    resultStamp: resultStamp,
    stationBackground: stationBackground,
    hasCustomIcon: hasCustomIcon,
    hasStationBackground: hasStationBackground,
    silhouette: function (label) {
      return iconShell('<circle cx="40" cy="30" r="12" fill="none" stroke="currentColor" stroke-width="4" opacity=".55"/><path d="M19 66c3-16 12-25 21-25s18 9 21 25H19Z" fill="none" stroke="currentColor" stroke-width="4" opacity=".55"/><path d="M22 17l36 46M58 17 22 63" stroke="currentColor" stroke-width="3" opacity=".32"/>', label || "未収集", "sq-icon sq-icon-silhouette");
    },
    world: function () {
      return renderIcon("world", "世界路線");
    }
  };
}());
