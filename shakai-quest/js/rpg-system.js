(function () {
  "use strict";
  function equip(id) {
    var s = window.SaveManager.data(), item = window.EQUIPMENT_DATA[id];
    if (!item || !s.owned.equipment.includes(id)) return false;
    s.player.equipped[item.slot] = id; window.SaveManager.save(); return true;
  }
  function effects() {
    var s = window.SaveManager.data(), out = {};
    var list = Object.values(s.player.equipped).map(function (id) { return (window.EQUIPMENT_DATA[id] || {}).effect; });
    s.activeCompanions.slice(0, 2).forEach(function (id) { list.push(window.COMPANION_EFFECTS[id]); });
    list.filter(Boolean).forEach(function (e) { Object.keys(e).forEach(function (k) { out[k] = (out[k] || 0) + e[k]; }); });
    return out;
  }
  function companion(id) {
    var s = window.SaveManager.data();
    if (!window.COMPANION_DATA[id] || (!s.owned.chara.includes(id) && !s.owned.companions.includes(id))) return false;
    if (s.activeCompanions.includes(id)) s.activeCompanions = s.activeCompanions.filter(function (x) { return x !== id; });
    else if (s.activeCompanions.length < 2) s.activeCompanions.push(id);
    else return false;
    window.SaveManager.save(); return true;
  }
  function choose(nodeId, tier, target) {
    var s = window.SaveManager.data(), node = window.NODES_DATA[nodeId];
    if (node.challengeStyle === "kikitori") return null;
    if (tier !== "basic") return nodeId + "_" + tier;
    if (node.encounters.includes(target)) return target;
    var bag = (s.encounterBags[nodeId] || []).filter(function (id) { return node.encounters.includes(id); });
    if (!bag.length) {
      var fresh = node.encounters.filter(function (id) { return !s.owned.monsters.includes(id); });
      bag = window.SocialQuestions.shuffle(fresh.length ? fresh : node.encounters);
    }
    var id = bag.shift(); s.encounterBags[nodeId] = bag; return id;
  }
  function remember(id, cleared) {
    var s = window.SaveManager.data(); if (!id) return;
    if (!s.owned.monsters.includes(id)) s.owned.monsters.push(id);
    if (cleared && !s.owned.clearedMonsters.includes(id)) s.owned.clearedMonsters.push(id);
  }
  function art(id) {
    var m = window.MONSTER_DATA[id];
    if (!m) return window.ShakaiIcons.render("ration_ticket", "資料");
    var eyes = m.variant % 2 ? '<path d="M64 65q7-8 14 0m24 0q7-8 14 0"/>' : '<circle cx="72" cy="64" r="3"/><circle cx="108" cy="64" r="3"/>';
    var shapes = [
      '<path d="M30 124q-5-35 23-51V44q0-31 37-31t37 31v29q28 16 23 51-5 31-60 31t-60-31Z"/>',
      '<path d="M29 120q0-30 29-44L90 10l32 66q29 14 29 44 0 37-61 37t-61-37Z"/>',
      '<path d="M35 57q0-42 55-42t55 42l-10 19q20 17 20 44 0 36-65 36t-65-36q0-27 20-44Z"/>',
      '<path d="M21 112 38 40l25 13L90 12l27 41 25-13 17 72q0 45-69 45t-69-45Z"/>',
      '<path d="M28 105q-20-45 23-57l-8-25 35 13L90 9l12 27 35-13-8 25q43 12 23 57l-7 26q-7 30-55 30t-55-30Z"/>'
    ];
    var props = { map: '<path d="m67 104 15-5 16 5 15-5v29l-15 5-16-5-15 5Z"/>', water: '<path d="M90 96q-30 31 0 40 30-9 0-40Z"/>', fire: '<path d="M90 98q-5 14-16 17l2 17h28l3-17q-12-3-17-17Z"/>', shield: '<path d="m70 107 20-9 20 9v14q-3 14-20 19-17-5-20-19Z"/>', clock: '<circle cx="90" cy="120" r="19"/><path d="M90 106v14l10 6"/>', shop: '<path d="M68 111h44v25H68Zm-3-12h50v12H65Z"/>', factory: '<path d="M64 136v-27l16 8v-8l17 8V98h15v38Z"/>', town: '<path d="m66 114 24-18 24 18v23H66Z"/>', recycle: '<path d="m80 105 11-6 10 15m-5-6 12 12-2 14m0-6-17 9-17-7m5 1-8-17 8-13"/>', globe: '<circle cx="90" cy="119" r="20"/><path d="M70 119h40m-20-20q17 20 0 40-17-20 0-40Z"/>', craft: '<path d="m73 100 28 29m-31 8 35-34m-8-5 14 13"/>', festival: '<path d="M66 105h48M75 105v28m30-28v28m-32 0h34"/>' };
    Object.assign(props, {
      mountain: '<path d="m64 135 18-31 10 17 9-13 17 27H64Z"/>',
      cloud: '<path d="M70 114q-2-15 12-13 8-14 20-1 18-1 16 15v14H68q-8-10 2-15Z"/>',
      rice: '<path d="M90 137v-38m0 11-12-9m12 20-13-9m13 18 13-10m-13-10 13-8"/>',
      fish: '<path d="M67 119q21-21 40 0-19 21-40 0Zm40 0 12-11v22l-12-11Z"/><circle cx="80" cy="118" r="2"/>',
      field: '<path d="M64 131q26-19 52 0m-52 8q26-19 52 0m-26-19V97m0 12q-15 0-15-10 15 0 15 10Zm0 3q15 0 15-10-15 0-15 10Z"/>',
      gear: '<circle cx="90" cy="120" r="15"/><circle cx="90" cy="120" r="5"/><path d="M90 100v-7m0 47v7m20-27h7m-47 0h-7m41-14 5-5m-33 33-5 5m33-5 5 5m-33-33-5-5"/>',
      car: '<path d="m65 128 5-18h8l8-12h18l8 12h6v18H65Z"/><circle cx="77" cy="131" r="5"/><circle cx="106" cy="131" r="5"/>',
      ship: '<path d="M64 126h53l-10 13H76l-12-13Zm26-5V96l22 25H90Zm-5 0V99l-16 22h16Z"/>',
      antenna: '<path d="M79 105q11-11 22 0m-31-9q20-20 40 0m-20 20v23"/><circle cx="90" cy="113" r="3"/>',
      record: '<path d="M71 98h38v43H71Zm8 12h22m-22 9h22m-22 9h16"/>',
      forest: '<path d="m72 99-12 23h24l-12-23Zm0 23v18m26-36-12 23h24l-12-23Zm0 23v13"/>',
      book: '<path d="M90 140V104q-14-10-25-4v36q12-6 25 4Zm0 0v-36q14-10 25-4v36q-12-6-25 4Z"/>',
      speech: '<path d="M65 102h49v27H84l-14 10v-10h-5v-27Zm9 10h31m-31 8h20"/>',
      pottery: '<path d="M74 98h32l-5 12q16 12 7 25-5 8-18 8t-18-8q-9-13 7-25l-5-12Zm4 29h24"/>',
      star: '<path d="m90 96 8 14 16 3-12 12 3 16-15-8-15 8 3-16-12-12 16-3 8-14Z"/>',
      flag: '<path d="M72 141V98h34l-8 11 8 12H72"/>'
    });
    var motifKeys = { "山": "mountain", "雲": "cloud", "地図": "map", "稲": "rice", "魚": "fish", "畑": "field", "歯車": "gear", "車": "car", "船": "ship", "電波": "antenna", "記録": "record", "情報": "record", "森": "forest", "水": "water", "資源": "recycle", "約束": "book", "議論": "speech", "くらし": "town", "時": "clock", "土器": "pottery", "地球": "globe", "交流": "speech", "未来": "star", "道": "map", "店": "shop", "盾": "shield", "合図": "flag", "道具": "gear", "風": "cloud", "祭り": "festival", "手仕事": "craft" };
    var prop = props[m.motif] || props[motifKeys[m.motif]];
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" role="img" aria-label="' + window.ShakaiUtil.esc(m.name) + '"><ellipse cx="90" cy="164" rx="56" ry="7" fill="#060b24" opacity=".25"/><g fill="' + m.color + '" stroke="#263653" stroke-width="3" stroke-linejoin="round">' + shapes[m.variant] + '</g><g fill="#162442" stroke="#162442" stroke-width="2.5" stroke-linecap="round">' + eyes + '<path d="M81 78q9 8 18 0" fill="none"/></g><g fill="none" stroke="#f9fcff" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">' + prop + '</g></svg>';
  }
  window.SocialRPG = { slots: ["sword", "shield", "armor", "gauntlet"], slotLabels: { sword: "剣", shield: "盾", armor: "鎧", gauntlet: "こて" }, equip: equip, effects: effects, companion: companion, choose: choose, remember: remember, art: art };
}());
