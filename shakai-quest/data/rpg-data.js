(function () {
  "use strict";
  window.MONSTER_DATA = {}; window.EQUIPMENT_DATA = {}; window.COMPANION_EFFECTS = {}; window.COMPANION_DATA = {};
  var motifs = {
    s5_koku: ["山", "雲", "地図"], s5_shoku: ["稲", "魚", "畑"], s5_kogyo: ["歯車", "車", "船"],
    s5_joho: ["電波", "記録", "情報"], s5_kankyo: ["森", "水", "資源"], s6_sei: ["約束", "議論", "くらし"],
    s6_rek: ["時", "土器", "記録"], s6_kok: ["地球", "交流", "未来"],
    s3_machi: ["地図", "道", "まち"], s3_work: ["畑", "歯車", "店"], s3_safe: ["盾", "水", "合図"], s3_time: ["時", "記録", "道具"],
    s4_ken: ["地図", "山", "道"], s4_life: ["水", "資源", "くらし"], s4_safe: ["水", "風", "盾"],
    s4_bunka: ["時", "水", "祭り"], s4_area: ["手仕事", "交流", "まち"]
  };
  var slots = ["sword", "shield", "armor", "gauntlet"];
  var names = ["探究のつるぎ", "備えの盾", "旅のよろい", "記録のこて"];
  var effects = [{ critUp: .15 }, { block: 1 }, { hpUp: 1 }, { comboUp: 1 }];
  var descriptions = ["正解時にときどき追加ダメージ。", "RPG挑戦で1回だけライフ減少を防ぐ。", "RPG挑戦のライフを1増やす。", "連続正解のEXPが少し増える。"];
  window.LINES_DATA.forEach(function (line) {
    slots.forEach(function (slot, i) {
      var id = "gear_" + line.lineId + "_" + slot;
      window.EQUIPMENT_DATA[id] = { id: id, name: line.name + "・" + names[i], lineId: line.lineId, slot: slot, rarity: "normal", effect: effects[i], desc: descriptions[i] };
    });
  });
  Object.keys(window.NODES_DATA).forEach(function (nodeId) {
    var node = window.NODES_DATA[nodeId], line = window.LINES_DATA.find(function (l) { return l.lineId === node.lineId; });
    node.encounters = [];
    if (nodeId !== "s6_rek11") {
      (motifs[node.lineId] || ["地図", "記録", "くらし"]).forEach(function (motif, i) {
        var id = nodeId + "_spirit_" + (i + 1);
        node.encounters.push(id);
        window.MONSTER_DATA[id] = { id: id, nodeId: nodeId, lineId: node.lineId, color: line.color,
          name: motif + "の精", motif: node.motif || motif, variant: i, tier: "basic", desc: node.subunitName + "をめぐる架空の精。" };
      });
      ["advanced", "extra"].forEach(function (tier, i) {
        var id = nodeId + "_" + tier;
        window.MONSTER_DATA[id] = { id: id, nodeId: nodeId, lineId: node.lineId, color: line.color,
          name: i ? "未来の番人" : "探究の番人", motif: node.motif || (motifs[node.lineId] || ["記録"])[0], variant: i + 3, tier: tier,
          desc: "学びを確かめる架空の番人。" };
      });
    }
    var rareId = "rare_" + nodeId;
    window.EQUIPMENT_DATA[rareId] = { id: rareId, name: nodeId === "s6_rek11" ? "資料読み取りのレンズ" : node.stationName + "の★探究レンズ", nodeId: nodeId, lineId: node.lineId,
      slot: "gauntlet", rarity: "rare", effect: { hintFree: 1, expBoostBig: .5 }, desc: "ヒントを1回使え、クリアEXPが増える。" };
  });
  Object.keys(window.ITEM_DATA).forEach(function (id, i) {
    var item = window.ITEM_DATA[id], e = {};
    e[item.effect] = item.effect === "expBoostBig" ? .5 : 1;
    window.EQUIPMENT_DATA[id] = Object.assign({}, item, { id: id, lineId: window.NODES_DATA[item.nodeId].lineId, slot: slots[i], effect: e });
  });
  Object.keys(window.CHARA_DATA).forEach(function (id, i) {
    window.COMPANION_EFFECTS[id] = i % 2 ? { expRate: .05 } : { hintFree: 1 };
    window.COMPANION_DATA[id] = Object.assign({ kind: "chara" }, window.CHARA_DATA[id]);
  });
  Object.keys(window.MONSTER_DATA).filter(function (id) { return window.MONSTER_DATA[id].tier === "advanced"; }).forEach(function (id, i) {
    var m = window.MONSTER_DATA[id];
    window.COMPANION_DATA[id] = { name: window.NODES_DATA[m.nodeId].stationName + "の探究の精", kind: "spirit", flavor: "認定を通じて同行する架空の精。", nodeId: m.nodeId };
    window.COMPANION_EFFECTS[id] = i % 2 ? { expRate: .05 } : { hintFree: 1 };
  });
}());
