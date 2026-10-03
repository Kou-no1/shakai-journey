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
test('120 original middle questions have explicit scope, sources, balanced answers and multiple skills', () => {
  const { w } = create(); const courses = Object.values(w.MIDDLE_COURSES).filter(c => !c.id.startsWith('middle_')), ids = new Set(), stems = new Set();
  assert.equal(courses.length, 8);
  for (const c of courses) {
    assert.equal(c.questions.length, 15); assert.ok(new Set(c.questions.map(q => q.skill)).size >= 4);
    assert.ok(c.questions.filter(q => q.diagramData).length >= 2);
    assert.equal(new Set(c.questions.map(q => q.answer)).size, 4);
    for (const q of c.questions) {
      assert.ok(!ids.has(q.id)); ids.add(q.id); assert.ok(!stems.has(q.stem)); stems.add(q.stem);
      assert.equal(q.tier, 'extra'); assert.equal(q.targetStage, 'middle_' + c.field); assert.ok(q.curriculumRef && q.factSources.length);
      assert.equal(new Set(q.choices).size, 4); assert.ok(q.choices[q.answer]);
      if (q.diagramData) { assert.equal(q.diagramData.fictional, true); assert.match(w.QuizEngine.diagram(q), /学習用の架空データ/); }
    }
  }
  assert.equal(ids.size, 120); assert.equal(w.MiddleCourses.forNode('s6_rek11'), null);
});
test('all eight middle courses save independent completion without elementary unlocks or rare rewards', () => {
  const env = create(), { w } = env, bankBefore = JSON.stringify(w.QUESTION_BANK);
  for (const id of Object.keys(w.MIDDLE_COURSES).filter(id => !id.startsWith('middle_'))) {
    const nodeId = Object.keys(w.NODES_DATA).find(n => w.NODES_DATA[n].lineId === id && w.NODES_DATA[n].order === 1);
    w.SaveManager.setNodeProgress(nodeId, { basicClear: true });
    const before = JSON.stringify(w.SaveManager.data().progress);
    const result = runCourse(env, nodeId, 'extra', null, { mode: 'learn', middleCourse: id });
    const p = w.SaveManager.getMiddleProgress(id);
    assert.ok(p.completed && p.perfect); assert.equal(p.bestCorrect, 15); assert.equal(p.stats.total, 15);
    assert.equal(p.seenQuestionIds.length, 15); assert.equal(p.masteredQuestionIds.length, 15);
    assert.equal(JSON.stringify(w.SaveManager.data().progress), before, id);
    assert.equal(w.SaveManager.data().owned.equipment.length, 0);
    const exp = w.SaveManager.data().player.exp; w.SocialRewards.complete(result); assert.equal(w.SaveManager.data().player.exp, exp);
  }
  assert.equal(JSON.stringify(w.QUESTION_BANK), bankBefore);
  const reloaded = create(w.SaveManager.exportJSON());
  assert.ok(Object.entries(reloaded.w.SaveManager.data().middleProgress).filter(([id]) => !id.startsWith('middle_')).every(([, p]) => p.perfect && p.bestCorrect === 15));
});
test('middle retries, hints and review cannot inflate first correct counts, statistics or perfect records', () => {
  const env = create(), { w } = env; w.SaveManager.setNodeProgress('s5_koku01', { basicClear: true });
  const result = runCourse(env, 's5_koku01', 'extra', null, { mode: 'learn', middleCourse: 's5_koku' }, true);
  assert.equal(result.questions.length, 16); assert.equal(result.result.perfect, false);
  const p = w.SaveManager.getMiddleProgress('s5_koku'); assert.equal(p.stats.total, 15); assert.equal(p.stats.correct, 14);
  assert.equal(p.bestCorrect, 14); assert.equal(p.masteredQuestionIds.length, 15); assert.equal(p.perfect, false);
  assert.equal(w.SaveManager.data().owned.kakeraCount, 15);
  const questionId = result.questions[0].id; w.SaveManager.data().questionStats[questionId].lastCorrect = false;
  const statsBefore = JSON.stringify(p.stats), exp = w.SaveManager.data().player.exp, fragments = w.SaveManager.data().owned.kakeraCount;
  const review = runCourse(env, 's5_koku01', 'extra', null, { mode: 'learn', review: true, middleCourse: 's5_koku' });
  assert.equal(review.initialCount, 1); assert.equal(JSON.stringify(p.stats), statsBefore); assert.equal(p.perfect, false);
  assert.match(env.root.innerHTML, /中学発展の復習完了/); assert.doesNotMatch(env.root.innerHTML, /初回全問正解・ヒントなし/);
  assert.equal(w.SaveManager.data().player.exp, exp); assert.equal(w.SaveManager.data().owned.kakeraCount, fragments);
  w.QuizEngine.start(env.root, 's5_koku01', 'extra', null, { replace: true, mode: 'learn', middleCourse: 's5_koku' });
  w.QuizEngine.useItem('hint');
  while (!w.QuizEngine.getState().finished) {
    const s = w.QuizEngine.getState(); w.QuizEngine.answer(env.root, s.questions[s.index].answer); w.QuizEngine.advance();
  }
  assert.equal(w.QuizEngine.getState().result.perfect, false); assert.equal(p.perfect, false);
});
test('middle challenge accuracy is separate from damage and early defeat cannot complete a course', () => {
  const env = create(), { w } = env; w.SaveManager.setNodeProgress('s6_sei01', { basicClear: true });
  w.QuizEngine.start(env.root, 's6_sei01', 'extra', null, { replace: true, mode: 'challenge', middleCourse: 's6_sei' });
  let i = 0;
  while (!w.QuizEngine.getState().finished) {
    const s = w.QuizEngine.getState(), q = s.questions[s.index];
    w.QuizEngine.answer(env.root, i++ < 4 ? (q.answer + 1) % 4 : q.answer); w.QuizEngine.advance();
  }
  assert.equal(w.QuizEngine.getState().firstCorrect, 11); assert.equal(w.QuizEngine.getState().result.success, false);
  assert.equal(w.SaveManager.getMiddleProgress('s6_sei').completed, false);
  assert.equal(w.SaveManager.data().progress.s6_sei01.extraClear, false);
});
test('middle sessions shuffle copied banks and resume across branch routes; invalid course context is archived', () => {
  let env = create(), w = env.w;
  w.SaveManager.setNodeProgress('s5_koku01', { basicClear: true }); w.SaveManager.setNodeProgress('s5_koku02', { basicClear: true });
  w.SaveManager.setNodeProgress('s5_koku03', { basicClear: true }, 'wajyu');
  const original = JSON.stringify(w.MIDDLE_COURSES), orders = new Set(), positions = new Set();
  let seed = 31; w.Math.random = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  for (let i = 0; i < 8; i++) {
    assert.ok(w.QuizEngine.start(env.root, 's5_koku03', 'extra', 'wajyu', { replace: true, middleCourse: 's5_koku', mode: 'learn' }));
    const s = w.QuizEngine.getState(); orders.add(s.questions.map(q => q.id).join(','));
    for (const q of s.questions) { positions.add(q.answer); const source = w.MiddleCourses.bank('s5_koku').find(x => x.id === q.id); assert.equal(q.choices[q.answer], source.choices[source.answer]); }
  }
  assert.ok(orders.size > 1); assert.equal(positions.size, 4); assert.equal(JSON.stringify(w.MIDDLE_COURSES), original);
  w.QuizEngine.answer(env.root, w.QuizEngine.getState().questions[0].answer);
  const savedSession = JSON.stringify(w.QuizEngine.getState()); env = create(w.SaveManager.exportJSON()); w = env.w;
  assert.ok(w.QuizEngine.resume(env.root)); assert.equal(JSON.stringify(w.QuizEngine.getState()), savedSession);
  w.SaveManager.data().activeSession.options.middleCourse = 's6_rek';
  assert.equal(w.QuizEngine.resume(env.root), false); assert.ok(w.SaveManager.data().meta.archivedSession);
  w.SaveManager.data().progress.s6_rek11.unlocked = true; w.SaveManager.setNodeProgress('s6_rek10', { basicClear: true }); w.SaveManager.setNodeProgress('s6_rek11', { basicClear: true });
  assert.equal(w.QuizEngine.start(env.root, 's6_rek11', 'extra', null, { replace: true, middleCourse: 's6_rek' }), false);
  assert.equal(w.QuizEngine.start(env.root, 's5_koku03', 'basic', 'wajyu', { replace: true, middleCourse: 's5_koku' }), false);
});
test('legacy saves initialize middle progress and new records appear once in notebook and parent report', () => {
  const env = create(), { w } = env, legacy = JSON.parse(w.SaveManager.exportJSON()); delete legacy.middleProgress;
  assert.equal(Object.keys(create(JSON.stringify(legacy)).w.SaveManager.data().middleProgress).length, 12);
  w.SaveManager.setNodeProgress('s5_koku01', { basicClear: true });
  w.QuizEngine.start(env.root, 's5_koku01', 'extra', null, { replace: true, middleCourse: 's5_koku', mode: 'learn' });
  const q = w.QuizEngine.getState().questions[0]; w.QuizEngine.answer(env.root, (q.answer + 1) % 4);
  w.InventoryRenderer.notebook(env.root); assert.equal((env.root.innerHTML.match(/class="notebook-entry"/g) || []).length, 1);
  assert.match(env.root.innerHTML, /中学発展・地理/);
  w.ReportRenderer.render(env.root, () => {}); assert.match(env.root.innerHTML, /中学発展の記録/);
  assert.equal((env.root.innerHTML.match(/<th scope="row">/g) || []).length, 55);
  assert.match(w.SocialQuestions.ruby('年較差と立憲主義'), /ねんかくさ/);
});
test('96 multi-source challenges have unique content, consistent rationale mappings and no elementary leakage', () => {
  const { w } = create(), ids = new Set(), stems = new Set();
  for (const c of Object.values(w.MIDDLE_COURSES).filter(c => !c.id.startsWith('middle_'))) {
    assert.equal(w.MiddleCourses.allQuestions(c.id).length, 27);
    for (const difficulty of ['applied', 'hard']) {
      const bank = w.MiddleCourses.bank(c.id, difficulty); assert.equal(bank.length, 6);
      assert.equal(new Set(bank.map(q => q.answer)).size, 4);
      for (const q of bank) {
        assert.ok(!ids.has(q.id)); ids.add(q.id); assert.ok(!stems.has(q.stem)); stems.add(q.stem);
        assert.equal(q.targetStage, 'middle_' + c.field); assert.equal(q.difficulty, difficulty);
        assert.ok(q.sourceMaterials.length >= 2 && q.evidence.length >= 2);
        assert.equal(q.choiceReasons[q.answer], null);
        q.choiceReasons.forEach((reason, i) => { if (i !== q.answer) assert.ok(w.MiddleCourses.mistakeLabels[reason]); });
        const markup = w.QuizEngine.diagram(q);
        assert.equal((markup.match(/<figure/g) || []).length, q.sourceMaterials.length);
        assert.equal((markup.match(/学習用の架空データ/g) || []).length, q.sourceMaterials.length);
        assert.doesNotMatch(markup, /undefined/);
      }
    }
  }
  assert.equal(ids.size, 96);
  assert.equal(w.MiddleCourses.bank('s5_koku', '__proto__').length, 0);
  assert.equal(w.MiddleCourses.bank('__proto__', 'hard').length, 0);
});

test('all 16 upper-level courses keep independent mastery, first accuracy and idempotent rewards', () => {
  const env = create(), { w } = env;
  for (const course of Object.keys(w.MIDDLE_COURSES).filter(id => !id.startsWith('middle_'))) {
    const nodeId = Object.keys(w.NODES_DATA).find(n => w.NODES_DATA[n].lineId === course && w.NODES_DATA[n].order === 1);
    w.SaveManager.setNodeProgress(nodeId, { basicClear: true });
    const elementary = JSON.stringify(w.SaveManager.data().progress);
    const standard = JSON.stringify(w.SaveManager.getMiddleProgress(course));
    for (const difficulty of ['applied', 'hard']) {
      const s = runCourse(env, nodeId, 'extra', null, { mode: 'learn', middleCourse: course, middleDifficulty: difficulty });
      const p = w.SaveManager.getMiddleProgress(course, difficulty);
      assert.ok(p.completed && p.perfect); assert.equal(p.stats.total, 6); assert.equal(p.stats.correct, 6);
      assert.equal(p.bestCorrect, 6); assert.equal(p.seenQuestionIds.length, 6); assert.equal(p.masteredQuestionIds.length, 6);
      const exp = w.SaveManager.data().player.exp; w.SocialRewards.complete(s); assert.equal(w.SaveManager.data().player.exp, exp);
      assert.equal(JSON.stringify(w.SaveManager.data().progress), elementary);
      assert.equal(w.SaveManager.getMiddleProgress(course).stats.total, 0);
    }
    const before = JSON.parse(standard); delete before.levels;
    const after = JSON.parse(JSON.stringify(w.SaveManager.getMiddleProgress(course))); delete after.levels;
    assert.deepEqual(after, before);
  }
  assert.equal(w.SaveManager.data().owned.equipment.length, 0);
  const loaded = create(w.SaveManager.exportJSON());
  for (const id of Object.keys(w.MIDDLE_COURSES).filter(id => !id.startsWith('middle_'))) for (const difficulty of ['applied', 'hard']) {
    assert.equal(loaded.w.SaveManager.getMiddleProgress(id, difficulty).bestCorrect, 6);
  }
});

test('shuffling preserves per-choice reasons and saved materials do not mutate the source bank', () => {
  const { w } = create(); const bank = w.MiddleCourses.bank('s5_koku', 'hard'), original = JSON.stringify(bank), positions = new Set();
  let seed = 42; w.Math.random = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  for (const q of bank) for (let n = 0; n < 8; n++) {
    const prepared = w.SocialQuestions.prepare(q); positions.add(prepared.answer);
    for (let i = 0; i < 4; i++) assert.equal(prepared.choiceReasons[i], q.choiceReasons[q.choices.indexOf(prepared.choices[i])]);
    assert.equal(prepared.choices[prepared.answer], q.choices[q.answer]);
    prepared.sourceMaterials[0].title = 'test change'; prepared.evidence[0] = 'test change';
  }
  assert.equal(positions.size, 4); assert.equal(JSON.stringify(bank), original);
});

test('specific misconception review persists, filters the selected difficulty and does not inflate statistics', () => {
  const env = create(), { w } = env; w.SaveManager.setNodeProgress('s5_joho01', { basicClear: true });
  w.QuizEngine.start(env.root, 's5_joho01', 'extra', null, { replace: true, mode: 'learn', middleCourse: 's5_joho', middleDifficulty: 'applied' });
  const s = w.QuizEngine.getState(), q = s.questions[0], wrong = (q.answer + 1) % 4, reason = q.choiceReasons[wrong];
  w.QuizEngine.answer(env.root, wrong);
  assert.equal(w.SaveManager.data().questionStats[q.id].lastMistake, reason);
  assert.match(env.root.innerHTML, /根拠を照合/); assert.ok(env.root.innerHTML.includes(w.MiddleCourses.mistakeLabels[reason]));
  const loaded = create(w.SaveManager.exportJSON()); assert.ok(loaded.w.QuizEngine.resume(loaded.root));
  assert.equal(loaded.w.SaveManager.data().questionStats[q.id].lastMistake, reason);
  w.InventoryRenderer.notebook(env.root); assert.ok(env.root.innerHTML.includes(w.MiddleCourses.mistakeLabels[reason]));
  const stats = JSON.stringify(w.SaveManager.getMiddleProgress('s5_joho', 'applied').stats), exp = w.SaveManager.data().player.exp;
  assert.equal(w.QuizEngine.start(env.root, 's5_joho01', 'extra', null, { replace: true, review: true, middleCourse: 's5_joho', middleDifficulty: 'hard', mistakeReason: reason }), false);
  assert.equal(w.QuizEngine.start(env.root, 's5_joho01', 'extra', null, { replace: true, review: true, middleCourse: 's5_joho', middleDifficulty: 'applied', mistakeReason: 'not-a-reason' }), false);
  const review = runCourse(env, 's5_joho01', 'extra', null, { review: true, middleCourse: 's5_joho', middleDifficulty: 'applied', mistakeReason: reason });
  assert.equal(review.initialCount, 1); assert.equal(review.questions[0].id, q.id);
  assert.equal(w.SaveManager.data().questionStats[q.id].lastMistake, null);
  assert.equal(w.MiddleCourses.reviewReasons(w.SaveManager.data())[reason], undefined);
  assert.equal(JSON.stringify(w.SaveManager.getMiddleProgress('s5_joho', 'applied').stats), stats);
  assert.equal(w.SaveManager.data().player.exp, exp);
  assert.equal(w.SaveManager.getMiddleProgress('s5_joho', 'applied').perfect, false);
});

test('upper courses preserve first accuracy through retries and hints, and reject invalid difficulty or basic gates', () => {
  const env = create(), { w } = env;
  assert.equal(w.QuizEngine.start(env.root, 's5_koku01', 'extra', null, { middleCourse: 's5_koku', middleDifficulty: 'hard' }), false);
  w.SaveManager.setNodeProgress('s5_koku01', { basicClear: true });
  for (const difficulty of ['unknown', '__proto__', 'toString']) assert.equal(w.QuizEngine.start(env.root, 's5_koku01', 'extra', null, { middleCourse: 's5_koku', middleDifficulty: difficulty }), false);
  const r = runCourse(env, 's5_koku01', 'extra', null, { mode: 'learn', middleCourse: 's5_koku', middleDifficulty: 'hard' }, true);
  const p = w.SaveManager.getMiddleProgress('s5_koku', 'hard');
  assert.equal(r.questions.length, 7); assert.equal(r.firstCorrect, 5); assert.equal(p.stats.total, 6); assert.equal(p.stats.correct, 5);
  assert.equal(p.perfect, false); assert.equal(w.SaveManager.data().owned.kakeraCount, 6);
  w.QuizEngine.start(env.root, 's5_koku01', 'extra', null, { replace: true, mode: 'learn', middleCourse: 's5_koku', middleDifficulty: 'hard' });
  w.QuizEngine.useItem('hint');
  while (!w.QuizEngine.getState().finished) {
    const s = w.QuizEngine.getState(); w.QuizEngine.answer(env.root, s.questions[s.index].answer); w.QuizEngine.advance();
  }
  assert.equal(w.QuizEngine.getState().result.perfect, false); assert.equal(p.perfect, false);
  const challenge = create(); challenge.w.SaveManager.setNodeProgress('s5_koku01', { basicClear: true });
  challenge.w.QuizEngine.start(challenge.root, 's5_koku01', 'extra', null, { mode: 'challenge', middleCourse: 's5_koku', middleDifficulty: 'hard' });
  let n = 0;
  while (!challenge.w.QuizEngine.getState().finished) {
    const s = challenge.w.QuizEngine.getState(), q = s.questions[s.index]; challenge.w.QuizEngine.answer(challenge.root, n++ < 2 ? (q.answer + 1) % 4 : q.answer); challenge.w.QuizEngine.advance();
  }
  assert.equal(challenge.w.QuizEngine.getState().result.success, false);
  assert.equal(challenge.w.SaveManager.getMiddleProgress('s5_koku', 'hard').completed, false);
});

test('pre-expansion middle saves and active standard sessions migrate without changing records or order', () => {
  const env = create(), { w } = env; w.SaveManager.setNodeProgress('s5_koku01', { basicClear: true });
  runCourse(env, 's5_koku01', 'extra', null, { mode: 'learn', middleCourse: 's5_koku' });
  w.QuizEngine.start(env.root, 's5_koku01', 'extra', null, { replace: true, mode: 'learn', middleCourse: 's5_koku' });
  w.QuizEngine.answer(env.root, w.QuizEngine.getState().questions[0].answer);
  const legacy = JSON.parse(w.SaveManager.exportJSON()); Object.values(legacy.middleProgress).forEach(p => delete p.levels);
  const order = JSON.stringify(legacy.activeSession), standard = JSON.stringify(legacy.middleProgress.s5_koku);
  const loaded = create(JSON.stringify(legacy)); assert.ok(loaded.w.QuizEngine.resume(loaded.root));
  assert.equal(JSON.stringify(loaded.w.QuizEngine.getState()), order);
  const p = JSON.parse(JSON.stringify(loaded.w.SaveManager.getMiddleProgress('s5_koku'))); delete p.levels;
  assert.equal(JSON.stringify(p), standard);
  assert.equal(loaded.w.SaveManager.getMiddleProgress('s5_koku', 'hard').stats.total, 0);
});

test('upper sessions resume on branch routes and archive altered source materials, evidence or rationale', () => {
  const env = create(), { w } = env;
  w.SaveManager.setNodeProgress('s5_koku01', { basicClear: true }); w.SaveManager.setNodeProgress('s5_koku02', { basicClear: true });
  w.SaveManager.setNodeProgress('s5_koku03', { basicClear: true }, 'wajyu');
  w.QuizEngine.start(env.root, 's5_koku03', 'extra', 'wajyu', { mode: 'learn', middleCourse: 's5_koku', middleDifficulty: 'hard' });
  w.QuizEngine.answer(env.root, (w.QuizEngine.getState().questions[0].answer + 1) % 4);
  const raw = w.SaveManager.exportJSON(), loaded = create(raw);
  assert.ok(loaded.w.QuizEngine.resume(loaded.root)); assert.equal(JSON.stringify(loaded.w.QuizEngine.getState()), JSON.stringify(w.QuizEngine.getState()));
  for (const mutate of [s => s.questions[0].sourceMaterials[0].title = 'changed', s => s.questions[0].evidence[0] = 'changed', s => s.questions[0].choiceReasons[0] = 'changed', s => s.options.middleDifficulty = 'unknown']) {
    const saved = JSON.parse(raw); mutate(saved.activeSession); const bad = create(JSON.stringify(saved));
    assert.equal(bad.w.QuizEngine.resume(bad.root), false); assert.ok(bad.w.SaveManager.data().meta.archivedSession);
  }
  w.ReportRenderer.render(env.root, () => {}); assert.equal((env.root.innerHTML.match(/<th scope="row">/g) || []).length, 55);
  assert.match(env.root.innerHTML, /次に確かめたい考え方/);
});

test('quantitative answer anchors agree with independent calculations across all numerical courses', () => {
  const { w } = create();
  const checks = [
    ['s5_koku', 'applied', 1, `${45000 / 50}人/km²`], ['s5_koku', 'applied', 2, (80000 * .3).toLocaleString('en-US')],
    ['s5_koku', 'applied', 5, `${3 * 250}m`], ['s5_koku', 'applied', 6, `${(4 - 3) * 250 / 100 * 2}分`],
    ['s5_koku', 'hard', 1, `${(10500 - 10000) - (600 - 400)}人`],
    ['s5_shoku', 'applied', 1, `${120 / 15}t/ha`], ['s5_shoku', 'applied', 2, `${(100 * 10).toLocaleString('en-US')}t`],
    ['s5_shoku', 'applied', 5, `${(600 * .9 + 300 * .2 + 100 * .6) / 1000 * 100}%`],
    ['s5_shoku', 'hard', 1, `${40 + 30}t`], ['s5_shoku', 'hard', 5, `${(7 - 5) - (6 - 4)}t/ha`],
    ['s5_kogyo', 'applied', 3, `${10 * (120 - 100)}円`], ['s5_kogyo', 'applied', 4, `${20 * 120 - 10 * 120 - 500}円`],
    ['s5_kogyo', 'hard', 1, `${20 * 120 - 15 * 120 - 500}円`], ['s5_kogyo', 'hard', 5, `${1000 - 400}円`], ['s5_kogyo', 'hard', 6, `${1000 - 500 - 300 - 100}円`],
    ['s5_joho', 'applied', 1, `${80 / 200 * 100}%`], ['s5_joho', 'hard', 1, `${((100 * .9 + 800 * .3) / 900 * 100).toFixed(1)}%`], ['s5_joho', 'hard', 3, `${(1200 - 1000) - (1100 - 900)}円`],
    ['s5_kankyo', 'applied', 1, `${18000 * .8 / 200}L`], ['s5_kankyo', 'applied', 2, `${(18000 * .2 - 12000 * .1).toLocaleString('en-US')}L`], ['s5_kankyo', 'applied', 5, `${40 * .75 + 30 * .6 + 30}kg`],
    ['s5_kankyo', 'hard', 5, `${80 + 10 * 2}kg`], ['s5_kankyo', 'hard', 6, `${(80 - 20) / (30 - 10)}年`],
    ['s6_sei', 'applied', 1, `${290 / (600 - 20) * 100}%`], ['s6_sei', 'applied', 2, `${Math.round(290 / 1000 * 100)}%`], ['s6_sei', 'applied', 6, `${(2 + 1) * 5}万円`],
    ['s6_sei', 'hard', 3, `${200 * .1 + 100 * .2}万円`], ['s6_sei', 'hard', 4, `${((200 * .1 + 100 * .2) / 300 * 100).toFixed(1)}%`],
    ['s6_rek', 'hard', 3, `${300 / 8}俵`], ['s6_rek', 'hard', 4, `${300 / 8}俵`],
    ['s6_kok', 'applied', 1, `${600 / 3}L/人`], ['s6_kok', 'applied', 2, `${((600 - 500) / 600 * 100).toFixed(1)}%`], ['s6_kok', 'hard', 6, `${60 + 10 * 5}万円`]
  ];
  for (const [course, difficulty, number, expected] of checks) {
    const q = w.MiddleCourses.bank(course, difficulty)[number - 1]; assert.ok(q.choices[q.answer].includes(expected), q.id + ': ' + expected);
  }
});
console.log(`${passed}/${passed} checks passed`);
