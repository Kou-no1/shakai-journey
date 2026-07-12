import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, "..");
const context = { window: {} };
context.window.window = context.window;
vm.createContext(context);

function run(relativePath) {
  const filePath = path.join(appRoot, relativePath);
  vm.runInContext(fs.readFileSync(filePath, "utf8"), context, { filename: relativePath });
}

function uniqPush(list, id) {
  if (id && list.indexOf(id) === -1) list.push(id);
}

[
  "data/lines-data.js",
  "data/nodes-data.js",
  "data/kakera-data.js",
  "data/meibutsu-data.js",
  "data/ijin-data.js",
  "data/chara-data.js",
  "data/item-data.js",
  "data/achievement-data.js"
].forEach(run);

run("js/svg-icons.js");

fs.readdirSync(path.join(appRoot, "data", "questions"))
  .filter((file) => file.endsWith(".js"))
  .sort()
  .forEach((file) => run(path.join("data", "questions", file)));

const {
  NODES_DATA,
  QUESTION_BANK,
  MEIBUTSU_DATA,
  IJIN_DATA,
  CHARA_DATA,
  ITEM_DATA,
  ACHIEVEMENT_DATA,
  ShakaiIcons
} = context.window;

const errors = [];
const nodeIds = Object.keys(NODES_DATA || {});
const questionIds = Object.keys(QUESTION_BANK || {});
const charaIds = [];
const iconKeys = [];
const achievementIds = Object.keys(ACHIEVEMENT_DATA || {});

if (nodeIds.length !== 36) errors.push(`expected 36 nodes, got ${nodeIds.length}`);
if (questionIds.length !== 36) errors.push(`expected 36 question banks, got ${questionIds.length}`);
if (achievementIds.length !== 16) errors.push(`expected 16 achievements, got ${achievementIds.length}`);

nodeIds.forEach((nodeId) => {
  const node = NODES_DATA[nodeId];
  const bank = QUESTION_BANK && QUESTION_BANK[nodeId];

  if (!bank) {
    errors.push(`missing QUESTION_BANK: ${nodeId}`);
  }

  if (node.branch && node.branch.options) {
    node.branch.options.forEach((option) => {
      uniqPush(charaIds, option.charaId);
      if (!bank || !bank[option.branchId]) {
        errors.push(`missing branch question bank: ${nodeId}/${option.branchId}`);
      } else {
        ["basic", "advanced", "extra"].forEach((tier) => {
          if (!Array.isArray(bank[option.branchId][tier]) || bank[option.branchId][tier].length === 0) {
            errors.push(`missing tier: ${nodeId}/${option.branchId}/${tier}`);
          }
        });
      }
      (option.meibutsuIds || []).forEach((id) => {
        if (!MEIBUTSU_DATA[id]) errors.push(`missing meibutsu: ${id}`);
      });
    });
  } else if (bank) {
    ["basic", "advanced", "extra"].forEach((tier) => {
      if (!Array.isArray(bank[tier]) || bank[tier].length === 0) {
        errors.push(`missing tier: ${nodeId}/${tier}`);
      }
    });
  }

  (node.meibutsuIds || []).forEach((id) => {
    if (!MEIBUTSU_DATA[id]) errors.push(`missing meibutsu: ${id}`);
  });
  if (node.ijinId && !IJIN_DATA[node.ijinId]) errors.push(`missing ijin: ${node.ijinId}`);
  uniqPush(charaIds, node.charaId);
  if (!ShakaiIcons.hasStationBackground(nodeId)) errors.push(`missing station background: ${nodeId}`);
});

Object.keys(MEIBUTSU_DATA || {}).forEach((id) => uniqPush(iconKeys, MEIBUTSU_DATA[id].svgKey || id));
Object.keys(IJIN_DATA || {}).forEach((id) => uniqPush(iconKeys, IJIN_DATA[id].svgKey || id));
Object.keys(CHARA_DATA || {}).forEach((id) => uniqPush(iconKeys, CHARA_DATA[id].svgKey || id));
Object.keys(ITEM_DATA || {}).forEach((id) => uniqPush(iconKeys, ITEM_DATA[id].svgKey || id));

iconKeys.forEach((key) => {
  if (!ShakaiIcons.hasCustomIcon(key)) errors.push(`missing custom svg icon: ${key}`);
});

charaIds.sort();
const dataCharaIds = Object.keys(CHARA_DATA || {}).sort();
const missingChara = charaIds.filter((id) => !CHARA_DATA[id]);
const extraChara = dataCharaIds.filter((id) => charaIds.indexOf(id) === -1);

if (charaIds.length !== 22) errors.push(`expected 22 unique charaId refs, got ${charaIds.length}`);
if (dataCharaIds.length !== 22) errors.push(`expected 22 CHARA_DATA keys, got ${dataCharaIds.length}`);
if (charaIds.length !== dataCharaIds.length) {
  errors.push(`chara count mismatch: refs=${charaIds.length}, data=${dataCharaIds.length}`);
}
missingChara.forEach((id) => errors.push(`missing chara: ${id}`));
extraChara.forEach((id) => errors.push(`unused chara data: ${id}`));

function validLineId(lineId) {
  return (context.window.LINES_DATA || []).some((line) => line.lineId === lineId);
}

achievementIds.forEach((id) => {
  const achievement = ACHIEVEMENT_DATA[id];
  const condition = achievement && achievement.condition;
  const allowedConditionTypes = ["line_basic_clear", "lines_basic_clear", "all_basic_clear", "collection_complete", "extra_perfect_count", "kakera_count"];
  if (!condition || !condition.type) {
    errors.push(`missing achievement condition: ${id}`);
    return;
  }
  if (!allowedConditionTypes.includes(condition.type)) {
    errors.push(`invalid achievement condition type: ${id}/${condition.type}`);
  }
  if (condition.type === "line_basic_clear" && !validLineId(condition.lineId)) {
    errors.push(`invalid achievement lineId: ${id}/${condition.lineId}`);
  }
  if (condition.type === "lines_basic_clear") {
    if (!Array.isArray(condition.lineIds) || condition.lineIds.length === 0) {
      errors.push(`missing achievement lineIds: ${id}`);
    } else {
      condition.lineIds.forEach((lineId) => {
        if (!validLineId(lineId)) errors.push(`invalid achievement lineId: ${id}/${lineId}`);
      });
    }
  }
  if (condition.type === "collection_complete" && !["meibutsu", "ijin", "chara", "items", "item"].includes(condition.category)) {
    errors.push(`invalid achievement collection category: ${id}/${condition.category}`);
  }
  if (condition.type === "extra_perfect_count" && (!Number.isFinite(Number(condition.count)) || Number(condition.count) <= 0)) {
    errors.push(`invalid achievement perfect count: ${id}/${condition.count}`);
  }
  if (condition.type === "kakera_count" && (!Number.isFinite(Number(condition.count)) || Number(condition.count) <= 0)) {
    errors.push(`invalid achievement kakera count: ${id}/${condition.count}`);
  }
});

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(JSON.stringify({
  nodes: nodeIds.length,
  questionBanks: questionIds.length,
  meibutsu: Object.keys(MEIBUTSU_DATA || {}).length,
  ijin: Object.keys(IJIN_DATA || {}).length,
  charaRefs: charaIds.length,
  charaData: dataCharaIds.length,
  achievements: achievementIds.length,
  svgIcons: iconKeys.length,
  stationBackgrounds: nodeIds.length
}, null, 2));
