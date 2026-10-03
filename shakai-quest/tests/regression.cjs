const assert = require('node:assert/strict');
const { create, routes } = require('./harness.cjs');
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('PASS ' + name); }
function runCourse(env, nodeId, tier, branchId, options, wrongFirst = false) {
  const w = env.w;
  assert.equal(w.QuizEngine.start(env.root, nodeId, tier, branchId, { replace: true, ...options }), true, nodeId + '/' + tier);
  let count = 0;
  while (!w.QuizEngine.getState().finished) {
    const state = w.QuizEngine.getState(), q = state.questions[state.index];
    assert.ok(count < 400, 'finite course ' + nodeId);
    w.QuizEngine.answer(env.root, wrongFirst && count === 0 ? (q.answer + 1) % q.choices.length : q.answer);
    w.QuizEngine.advance(); count++;
  }
  return w.QuizEngine.getState();
}
test('all 52 nodes, 57 paths and metadata are complete', () => {
  const { w } = create();
  assert.equal(Object.keys(w.NODES_DATA).length, 52); assert.equal(routes(w).length, 57);
  const ids = new Set();
  for (const route of routes(w)) for (const tier of ['basic', 'advanced', 'extra']) {
    const bank = w.SocialQuestions.bank(route.nodeId, route.branchId, tier);
    assert.ok(bank.length); if (tier === 'extra') assert.equal(bank.length, 15);
    for (const q of bank) {
      assert.ok(!ids.has(q.id), q.id); ids.add(q.id);
      assert.ok(q.stem && q.explanation && q.subId && q.curriculumRef && q.context && q.targetStage && q.contentVersion);
      assert.equal(q.choices.length, q.type === 'mc4' ? 4 : 2);
      assert.ok(q.choices[q.answer]); assert.ok(w.SocialQuestions.skills[q.skill]);
      if (tier !== 'extra') assert.equal(q.targetStage, 'elementary' + route.nodeId[1]);
      if (q.sourceQuestionId) assert.ok(q.bonusCategory);
    }
  }
  console.log('Question records: ' + ids.size);
});
test('legacy migration, zero consumables, corruption and unknown schema are protected', () => {
  const env = create(); const legacy = JSON.parse(env.w.SaveManager.exportJSON()); delete legacy.schema;
  legacy.progress.s5_koku01.basicClear = true; legacy.owned.meibutsu = ['m_chikyugi']; legacy.owned.items = ['eq_hint_free'];
  legacy.owned.consumables = { potion: 0, hint: 0 }; legacy.player.exp = 250;
  const migrated = create(JSON.stringify(legacy));
  assert.equal(migrated.w.SaveManager.data().schema, 2); assert.equal(migrated.w.SaveManager.data().player.level, 3);
  assert.equal(migrated.w.SaveManager.data().progress.s5_koku01.basicClear, true);
  assert.equal(migrated.w.SaveManager.data().owned.consumables.potion, 0);
  assert.ok(migrated.w.SaveManager.data().owned.equipment.includes('eq_hint_free'));
  for (const raw of ['{broken', JSON.stringify({ ...legacy, schema: 99 }), 'null', '{}']) {
    const e = create(raw); e.w.SaveManager.addExp(50);
    assert.equal(e.storage.get(e.w.SaveManager.key), raw); assert.equal(e.w.SaveManager.exportJSON(), raw); assert.ok(e.w.SaveManager.status().protected);
    assert.throws(() => e.w.SaveManager.importJSON('{}')); assert.equal(e.storage.get(e.w.SaveManager.key), raw);
    e.w.SaveManager.importJSON(JSON.stringify(legacy)); assert.equal(e.w.SaveManager.status().protected, false);
  }
  const e = create(); e.failWrites(true); assert.doesNotThrow(() => e.w.SaveManager.addExp(10)); assert.match(e.w.SaveManager.status().warning, /保存/);
});
test('first nodes of every grade and grade 6 field are independent', () => {
  const { w } = create();
  for (const [id, node] of Object.entries(w.NODES_DATA)) assert.equal(w.SaveManager.isNodeUnlocked(id), node.order === 1, id);
  for (const id of ['s6_sei01', 's6_rek01', 's6_kok01']) assert.equal(w.SaveManager.isNodeUnlocked(id), true);
});
test('question and choice shuffles preserve the bank and correct answer', () => {
  const { w } = create(); const before = JSON.stringify(w.QUESTION_BANK); const positions = new Set();
  let seed = 13; w.Math.random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (const route of routes(w)) {
    for (const q of w.SocialQuestions.bank(route.nodeId, route.branchId, 'basic')) {
      for (let i = 0; i < 10; i++) { const p = w.SocialQuestions.prepare(q); assert.equal(p.choices[p.answer], q.choices[q.answer]); if (q.type === 'mc4') positions.add(p.answer); }
    }
  }
  assert.equal(JSON.stringify(w.QUESTION_BANK), before); assert.equal(positions.size, 4);
  const list = [1, 2, 3, 4]; const order = new Set();
  for (let i = 0; i < 12; i++) order.add(w.SocialQuestions.shuffle(list).join(',')); assert.ok(order.size > 1); assert.deepEqual(list, [1, 2, 3, 4]);
});
test('short courses use saved bags and cannot unlock after only five questions', () => {
  let env = create(); const seen = new Set(); const size = env.w.SocialQuestions.bank('s5_shoku01', null, 'basic').length;
  while (seen.size < size) {
    const session = runCourse(env, 's5_shoku01', 'basic', null, { mode: 'learn', limit: 5 });
    for (const q of session.questions) { assert.ok(!seen.has(q.id)); seen.add(q.id); }
    if (seen.size < size) assert.equal(env.w.SaveManager.data().progress.s5_shoku01.basicClear, false);
    env = create(env.w.SaveManager.exportJSON());
  }
  assert.equal(seen.size, size); assert.equal(env.w.SaveManager.data().progress.s5_shoku01.basicClear, true);
});

test('certification sampling balances subunit groups without mutating the source', () => {
  const { w } = create(), template = w.SocialQuestions.bank('s5_shoku01', null, 'basic')[0];
  const source = Array.from({ length: 20 }, (_, i) => ({ ...template, id: 'sample-' + i, subId: i < 10 ? 'a' : 'b' }));
  const before = JSON.stringify(source), selected = w.QuizEngine.plan(source, 's5_shoku01', 'advanced', null, {});
  assert.equal(selected.length, 10); assert.equal(selected.filter(q => q.subId === 'a').length, 5);
  assert.equal(selected.filter(q => q.subId === 'b').length, 5); assert.equal(JSON.stringify(source), before);
});
test('learning retries errors without extra rewards and review gives no rewards', () => {
  const env = create(), w = env.w;
  const session = runCourse(env, 's5_shoku01', 'basic', null, { mode: 'learn' }, true);
  assert.equal(session.questions.length, session.initialCount + 1);
  assert.equal(session.firstCorrect, session.initialCount - 1); assert.equal(session.result.perfect, false);
  assert.equal(w.SaveManager.data().owned.kakeraCount, session.initialCount); assert.equal(session.lives, session.maxLives);
  const record = w.SaveManager.data().progress.s5_shoku01.basicStats;
  assert.equal(record.total, session.initialCount); assert.equal(record.correct, session.initialCount - 1);
  const qid = session.questions[0].id; w.SaveManager.data().questionStats[qid].lastCorrect = false;
  const exp = w.SaveManager.data().player.exp, pieces = w.SaveManager.data().owned.kakeraCount;
  runCourse(env, 's5_shoku01', 'basic', null, { review: true, mode: 'learn' });
  assert.equal(w.SaveManager.data().player.exp, exp); assert.equal(w.SaveManager.data().owned.kakeraCount, pieces);
});
test('equipment damage and shield never inflate correct or perfect counts', () => {
  const env = create(), w = env.w, s = w.SaveManager.data();
  s.owned.equipment.push('gear_s5_shoku_shield', 'gear_s5_shoku_sword');
  w.SocialRPG.equip('gear_s5_shoku_shield'); w.SocialRPG.equip('gear_s5_shoku_sword'); w.Math.random = () => 0;
  const session = runCourse(env, 's5_shoku01', 'basic', null, { mode: 'challenge' }, true);
  assert.equal(session.firstCorrect, session.initialCount - 1); assert.equal(session.result.perfect, false);
  assert.equal(session.lives, session.maxLives); assert.equal(session.result.success, true);
  const fail = create(); const f = fail.w; f.QuizEngine.start(fail.root, 's5_shoku01', 'basic', null, { mode: 'challenge' });
  while (!f.QuizEngine.getState().finished) { const q = f.QuizEngine.getState().questions[f.QuizEngine.getState().index]; f.QuizEngine.answer(fail.root, (q.answer + 1) % q.choices.length); f.QuizEngine.advance(); }
  assert.equal(f.QuizEngine.getState().result.success, false); assert.equal(f.SaveManager.data().progress.s5_shoku01.basicClear, false);
});
test('all encounters are reachable, targeted exploration works, war has none', () => {
  const { w } = create();
  for (const [id, node] of Object.entries(w.NODES_DATA)) {
    if (id === 's6_rek11') { assert.equal(w.SocialRPG.choose(id, 'basic'), null); continue; }
    const selected = [];
    for (let i = 0; i < node.encounters.length; i++) { const m = w.SocialRPG.choose(id, 'basic'); selected.push(m); w.SocialRPG.remember(m); assert.ok(w.SocialRPG.art(m).includes('<svg')); }
    assert.equal(new Set(selected).size, node.encounters.length);
    assert.equal(w.SocialRPG.choose(id, 'basic', node.encounters[2]), node.encounters[2]);
  }
});
test('session restores choices, feedback and counters; stale content is rejected', () => {
  let env = create(), w = env.w;
  w.QuizEngine.start(env.root, 's5_shoku01', 'basic', null, { mode: 'learn' });
  const q = w.QuizEngine.getState().questions[0]; w.QuizEngine.answer(env.root, q.answer);
  const state = JSON.stringify(w.QuizEngine.getState()); env = create(w.SaveManager.exportJSON()); w = env.w;
  assert.equal(w.QuizEngine.resume(env.root), true); assert.equal(JSON.stringify(w.QuizEngine.getState()), state);
  const pieces = w.SaveManager.data().owned.kakeraCount; w.QuizEngine.answer(env.root, q.answer); assert.equal(w.SaveManager.data().owned.kakeraCount, pieces);
  const raw = JSON.parse(w.SaveManager.exportJSON()); raw.activeSession.questions[0].contentVersion++;
  const broken = create(JSON.stringify(raw)); assert.equal(broken.w.QuizEngine.resume(broken.root), false); assert.equal(broken.w.SaveManager.data().activeSession, null);
  assert.ok(broken.w.SaveManager.data().meta.archivedSession.session);
  const malformed = JSON.parse(w.SaveManager.exportJSON()); malformed.activeSession.questions[0].diagramData = { headers: null };
  const invalid = create(JSON.stringify(malformed)); assert.equal(invalid.w.QuizEngine.resume(invalid.root), false);
});
test('hints, potion zero and maximum two companions persist', () => {
  const env = create(), w = env.w, s = w.SaveManager.data();
  w.QuizEngine.start(env.root, 's5_shoku01', 'basic', null, { mode: 'challenge' });
  const state = w.QuizEngine.getState();
  let index = state.questions.findIndex(q => q.type === 'mc4'); state.index = index;
  w.QuizEngine.useItem('hint'); assert.equal(s.owned.consumables.hint, 0); assert.equal(state.hiddenChoices.length, 2); assert.equal(state.usedHint, true);
  state.lives = 1; s.owned.consumables.potion = 1; w.QuizEngine.useItem('potion'); assert.equal(s.owned.consumables.potion, 0);
  const loaded = create(w.SaveManager.exportJSON()); assert.equal(loaded.w.SaveManager.data().owned.consumables.potion, 0);
  s.owned.chara.push(...Object.keys(w.CHARA_DATA).slice(0, 3));
  assert.equal(w.SocialRPG.companion(s.owned.chara[0]), true); assert.equal(w.SocialRPG.companion(s.owned.chara[1]), true); assert.equal(w.SocialRPG.companion(s.owned.chara[2]), false);
});
test('all paths, normal equipment replay, dedicated rares and idempotent rewards', () => {
  const env = create(), w = env.w;
  const sorted = routes(w).sort((a,b) => w.NODES_DATA[a.nodeId].order - w.NODES_DATA[b.nodeId].order);
  for (const { nodeId, branchId } of sorted) {
    runCourse(env, nodeId, 'basic', branchId, { mode: 'learn' });
    assert.equal(w.SaveManager.routeProgress(nodeId, branchId).basicClear, true, nodeId);
    const n = w.NODES_DATA[nodeId];
    const collectibles = n.branch ? n.branch.options.find(b => b.branchId === branchId).meibutsuIds : n.meibutsuIds;
    for (let i = 1; i < (collectibles || []).length; i++) runCourse(env, nodeId, 'basic', branchId, { mode: 'learn' });
    const boss = runCourse(env, nodeId, 'advanced', branchId, { mode: 'learn' });
    assert.equal(boss.result.completed, true, nodeId);
    assert.equal(w.SaveManager.data().owned.companions.includes(nodeId + '_advanced'), nodeId !== 's6_rek11');
    const rare = runCourse(env, nodeId, 'extra', branchId, { mode: 'learn' });
    assert.equal(rare.result.perfect, true, nodeId);
    assert.ok(w.SaveManager.data().owned.equipment.includes('rare_' + nodeId));
    const exp = w.SaveManager.data().player.exp; w.SocialRewards.complete(rare); assert.equal(w.SaveManager.data().player.exp, exp);
  }
  for (const line of w.LINES_DATA) {
    const route = sorted.find(r => w.NODES_DATA[r.nodeId].lineId === line.lineId);
    const gear = Object.keys(w.EQUIPMENT_DATA).filter(id => w.EQUIPMENT_DATA[id].lineId === line.lineId && w.EQUIPMENT_DATA[id].rarity === 'normal');
    let replays = 0;
    while (gear.some(id => !w.SaveManager.data().owned.equipment.includes(id))) {
      assert.ok(replays++ < 4); runCourse(env, route.nodeId, 'advanced', route.branchId, { mode: 'learn' });
    }
  }
  for (const id of Object.keys(w.MEIBUTSU_DATA)) assert.ok(w.SaveManager.data().owned.meibutsu.includes(id), id);
  for (const id of Object.keys(w.IJIN_DATA)) assert.ok(w.SaveManager.data().owned.ijin.includes(id), id);
  for (const id of Object.keys(w.ITEM_DATA)) { assert.ok(w.SaveManager.data().owned.items.includes(id), id); assert.ok(w.SaveManager.data().owned.equipment.includes(id), id); }
  for (const id of Object.keys(w.CHARA_DATA)) assert.ok(w.SaveManager.data().owned.chara.includes(id), id);
  w.AchievementManager.checkAchievements(false);
  assert.ok(w.SaveManager.data().owned.achievements.includes('ach_all_complete'));
  assert.ok(w.SaveManager.data().owned.achievements.includes('ach_perfect_all'));
  assert.equal(w.SaveManager.data().owned.achievements.length, 18);
});
test('ruby toggles and fictional tables are labelled', () => {
  const { w } = create(); assert.match(w.SocialQuestions.ruby('{地域|ちいき}'), /<ruby>/);
  w.SaveManager.data().settings.ruby = false; assert.equal(w.SocialQuestions.ruby('{地域|ちいき}'), '地域');
  const q = w.SocialQuestions.bank('s3_machi01', null, 'basic').find(q => q.diagramData);
  assert.match(w.QuizEngine.diagram(q), /学習用の架空データ/);
});
console.log(`${passed}/${passed} checks passed`);
