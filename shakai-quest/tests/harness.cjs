const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const scripts = [...fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
function element() {
  return { innerHTML: '', textContent: '', dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener() {}, querySelector() { return element(); }, querySelectorAll() { return []; }, children: [], focus() {}, appendChild() {}, remove() {}, style: {}, getBoundingClientRect() { return {}; } };
}
function create(raw) {
  const storage = new Map(raw === undefined ? [] : [['shakai_quest_save_v1', raw]]);
  let failWrites = false;
  const context = { console, Date, Math: Object.create(Math), Set, Map, JSON, Number, String, Object, Array, Boolean,
    CustomEvent: function(type, options) { this.type = type; this.detail = options && options.detail; },
    localStorage: { getItem: key => storage.has(key) ? storage.get(key) : null, setItem(key, value) { if (failWrites) throw new Error('quota'); storage.set(key, value); }, removeItem: key => storage.delete(key) },
    document: { addEventListener() {}, querySelector: element, querySelectorAll() { return []; }, createElement: element, body: element() },
    navigator: {}, setTimeout() {}, confirm() { return true; } };
  context.window = context; context.addEventListener = () => {}; context.dispatchEvent = () => {}; context.setTimeout = () => {};
  vm.createContext(context);
  for (const file of scripts) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  context.ShakaiApp.toast = () => {};
  context.SaveManager.load();
  return { w: context, storage, root: element(), failWrites(value) { failWrites = value; } };
}
function routes(w) {
  return Object.keys(w.NODES_DATA).flatMap(nodeId => {
    const node = w.NODES_DATA[nodeId];
    return (node.branch ? node.branch.options.map(b => b.branchId) : [null]).map(branchId => ({ nodeId, branchId }));
  });
}
module.exports = { create, routes, root, scripts };
