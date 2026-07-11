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
  "data/item-data.js"
].forEach(run);

fs.readdirSync(path.join(appRoot, "data", "questions"))
  .filter((file) => file.endsWith(".js"))
  .sort()
  .forEach((file) => run(path.join("data", "questions", file)));

const {
  NODES_DATA,
  QUESTION_BANK,
  MEIBUTSU_DATA,
  IJIN_DATA,
  CHARA_DATA
} = context.window;

const errors = [];
const nodeIds = Object.keys(NODES_DATA || {});
const questionIds = Object.keys(QUESTION_BANK || {});
const charaIds = [];

if (nodeIds.length !== 36) errors.push(`expected 36 nodes, got ${nodeIds.length}`);
if (questionIds.length !== 36) errors.push(`expected 36 question banks, got ${questionIds.length}`);

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
  charaData: dataCharaIds.length
}, null, 2));
