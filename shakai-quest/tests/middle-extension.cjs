const assert = require('node:assert/strict');
const fs = require('node:fs');
const cp = require('node:child_process');
const { create, root: appRoot } = require('./harness.cjs');
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('PASS ' + name); }
function run(env, id, difficulty, practice, wrong) {
  const { w } = env, entry = w.MiddleCourses.entryFor(id);
  assert.ok(w.QuizEngine.start(env.root, entry.nodeId, 'extra', null, { replace: true, middlePortal: true, middleCourse: id,
    middleDifficulty: difficulty, middlePractice: practice, review: !!practice, mode: 'learn' }));
  let count = 0;
  while (!w.QuizEngine.getState().finished) {
    assert.ok(count < 50); const s = w.QuizEngine.getState(), q = s.questions[s.index];
    w.QuizEngine.answer(env.root, wrong && count === 0 ? (q.answer + 1) % 4 : q.answer); w.QuizEngine.advance(); count++;
  }
  return w.QuizEngine.getState();
}
test('12 courses, 324 choices, 32 written tasks and 14 transfer questions have independent stable IDs', () => {
  const { w } = create(), ids = new Set(); assert.equal(Object.keys(w.MIDDLE_COURSES).length, 12);
  for (const c of Object.values(w.MIDDLE_COURSES)) {
    assert.ok(w.NODES_DATA[c.entryNodeId]); assert.ok(['geography', 'history', 'civics'].includes(c.field));
    for (const d of ['standard', 'applied', 'hard']) {
      const qs = w.MiddleCourses.bank(c.id, d); assert.equal(qs.length, d === 'standard' ? 15 : 6);
      assert.equal(new Set(qs.map(q => q.answer)).size, 4);
      for (const q of qs) { assert.ok(!ids.has(q.id)); ids.add(q.id); assert.equal(new Set(q.choices).size, 4); assert.ok(q.explanation && q.factSources.length); }
    }
  }
  assert.equal(ids.size, 324);
  for (const q of Object.values(w.MIDDLE_WRITTEN)) {
    assert.ok(!ids.has(q.id)); ids.add(q.id); assert.equal(q.rubric.length, 3); assert.equal(q.assessment, 'self');
    assert.ok(q.sourceMaterials.length >= 2 && q.modelAnswer.length > 50);
  }
  assert.equal(Object.keys(w.MIDDLE_WRITTEN).length, 32);
  for (const q of Object.values(w.MIDDLE_REVIEW_BANK).flat()) { assert.ok(!ids.has(q.id)); ids.add(q.id); assert.equal(q.choiceReasons[q.answer], null); }
  assert.equal(ids.size, 370);
  const historical = w.MiddleCourses.bank('middle_history_connections', 'applied')[2];
  assert.equal(historical.sourceMaterials[0].fictional, false);
  assert.ok(historical.sourceMaterials[0].learningSummary && historical.sourceMaterials[0].source);
  assert.match(w.QuizEngine.diagram(historical), /学習用の要約（原文の引用ではありません）/);
  assert.doesNotMatch(w.QuizEngine.diagram(historical), /架空データ/);
  assert.match(w.QuizEngine.diagram(w.MiddleCourses.bank('middle_civics_finance', 'applied')[0]), /学習用の架空データ/);
});
test('all 12 portal courses are reachable without elementary clears and retain elementary progression', () => {
  const env = create(), { w } = env, before = JSON.stringify(w.SaveManager.data().progress);
  for (const c of Object.values(w.MIDDLE_COURSES)) for (const d of ['standard', 'applied', 'hard']) {
    const s = run(env, c.id, d); assert.ok(s.result.success);
    const p = w.SaveManager.getMiddleProgress(c.id, d); assert.equal(p.stats.total, s.initialCount); assert.ok(p.completed && p.perfect);
  }
  assert.equal(JSON.stringify(w.SaveManager.data().progress), before); assert.equal(w.SaveManager.data().owned.equipment.length, 0);
  assert.ok(Object.values(w.SaveManager.data().middleProgress).every(p => p.perfect && p.levels.applied.perfect && p.levels.hard.perfect));
});
test('portal bypass is restricted to registered anchors, extra tiers and non-war contexts', () => {
  const { w, root } = create(), options = { replace: true, middlePortal: true, middleCourse: 'middle_civics_finance', mode: 'learn' };
  for (const [node, tier] of [['s5_koku01', 'extra'], ['s6_sei02', 'extra'], ['s6_sei01', 'basic'], ['s6_sei01', 'advanced'], ['s6_rek11', 'extra']]) assert.equal(w.QuizEngine.start(root, node, tier, null, options), false);
  for (const id of ['__proto__', 'constructor', 'missing']) assert.equal(w.QuizEngine.start(root, 's6_sei01', 'extra', null, { ...options, middleCourse: id }), false);
  assert.equal(w.QuizEngine.start(root, 's6_sei01', 'extra', null, { ...options, middlePortal: false }), false);
  assert.equal(w.SaveManager.getMiddleProgress('__proto__'), null); assert.equal(w.SaveManager.getPracticeProgress('__proto__'), null);
});
test('108 new question answers and sources survive shuffling, reloading and isolated difficulty statistics', () => {
  let env = create(), w = env.w; const original = JSON.stringify(w.MIDDLE_COURSES);
  for (const id of Object.keys(w.MIDDLE_COURSES).filter(id => id.startsWith('middle_'))) {
    run(env, id, 'applied', null, true); assert.equal(w.SaveManager.getMiddleProgress(id, 'applied').stats.correct, 5);
    assert.equal(w.SaveManager.getMiddleProgress(id, 'applied').perfect, false);
    assert.equal(w.SaveManager.getMiddleProgress(id, 'hard').stats.total, 0);
    const anchor = w.MiddleCourses.entryFor(id).nodeId;
    w.QuizEngine.start(env.root, anchor, 'extra', null, { replace: true, middlePortal: true, middleCourse: id, middleDifficulty: 'hard', mode: 'learn' });
    const q = w.QuizEngine.getState().questions[0]; w.QuizEngine.answer(env.root, q.answer);
    const saved = JSON.stringify(w.QuizEngine.getState()); env = create(w.SaveManager.exportJSON()); w = env.w;
    assert.ok(w.QuizEngine.resume(env.root)); assert.equal(JSON.stringify(w.QuizEngine.getState()), saved);
  }
  assert.equal(JSON.stringify(w.MIDDLE_COURSES), original);
});
test('all seven personalized transfer paths use different IDs without rewards or course completion', () => {
  const env = create(), { w } = env, original = JSON.stringify(w.SaveManager.data().middleProgress), elementary = JSON.stringify(w.SaveManager.data().progress);
  for (const reason of Object.keys(w.MIDDLE_REVIEW_BANK)) {
    const source = Object.values(w.MIDDLE_COURSES).flatMap(c => w.MiddleCourses.allQuestions(c.id)).find(q => q.choiceReasons && q.choiceReasons.includes(reason));
    w.SaveManager.data().questionStats[source.id] = { attempts: 1, correct: 0, lastCorrect: false, lastMistake: reason };
    assert.ok(w.MiddleCourses.reviewReasons(w.SaveManager.data())[reason]);
    const s = run(env, w.MiddleCourses.practiceCourse(reason), null, reason, true);
    assert.equal(s.initialCount, 2); assert.equal(s.firstCorrect, 1); assert.equal(s.questions.length, 3);
    assert.ok(s.questions.every(q => q.id !== source.id && q.id.startsWith('transfer-')));
    const p = w.SaveManager.getPracticeProgress(reason); assert.equal(p.stats.total, 2); assert.equal(p.stats.correct, 1); assert.equal(p.masteredQuestionIds.length, 2);
    assert.ok(!s.result.completed); assert.equal(s.result.rewards.length, 0);
  }
  assert.equal(JSON.stringify(w.SaveManager.data().middleProgress), original); assert.equal(JSON.stringify(w.SaveManager.data().progress), elementary);
  assert.equal(w.SaveManager.data().player.exp, 0); assert.equal(w.SaveManager.data().owned.kakeraCount, 0);
  const migrated = create(w.SaveManager.exportJSON()); assert.equal(Object.keys(migrated.w.SaveManager.data().practiceProgress).length, 7);
});
test('32 written tasks save drafts, require self-ratings and never count as automatically correct answers', () => {
  const env = create(), { w } = env, before = JSON.stringify(w.SaveManager.data().middleProgress);
  for (const q of Object.values(w.MIDDLE_WRITTEN)) {
    assert.ok(w.WrittenEngine.start(env.root, q.id)); assert.equal(w.WrittenEngine.submit(' '), false);
    w.WrittenEngine.draft(q.modelAnswer); assert.ok(w.WrittenEngine.submit());
    assert.equal(w.WrittenEngine.record(), false); assert.equal(w.WrittenEngine.rate(-1, 2), false); assert.equal(w.WrittenEngine.rate(0, 3), false);
    for (let i = 0; i < 3; i++) assert.ok(w.WrittenEngine.rate(i, i % 3));
    assert.ok(w.WrittenEngine.record()); assert.equal(w.WrittenEngine.record(), false);
    assert.equal(w.SaveManager.data().writtenRecords[q.id].attempts, 1);
  }
  assert.equal(Object.keys(w.SaveManager.data().writtenRecords).length, 32); assert.equal(Object.keys(w.SaveManager.data().questionStats).length, 0);
  assert.equal(w.SaveManager.data().player.exp, 0); assert.equal(w.SaveManager.data().owned.kakeraCount, 0);
  assert.equal(JSON.stringify(w.SaveManager.data().middleProgress), before); assert.ok(w.SaveManager.data().meta.lastPlayedAt);
});
test('written draft and partially rated answer resume exactly, revisions reset only ratings', () => {
  let env = create(), w = env.w; const id = 'written-middle_civics_finance-1';
  w.WrittenEngine.start(env.root, id); w.WrittenEngine.draft('<script>alert(1)</script>\n自分の考え');
  const original = JSON.stringify(w.WrittenEngine.getState()); env = create(w.SaveManager.exportJSON()); w = env.w;
  assert.ok(w.WrittenEngine.resume(env.root)); assert.equal(JSON.stringify(w.WrittenEngine.getState()), original);
  assert.doesNotMatch(env.root.innerHTML, /<script>alert/); assert.match(env.root.innerHTML, /&lt;script&gt;/);
  w.WrittenEngine.submit(); w.WrittenEngine.rate(0, 2);
  env = create(w.SaveManager.exportJSON()); w = env.w; assert.ok(w.WrittenEngine.resume(env.root));
  assert.equal(w.WrittenEngine.getState().ratings[0], 2); assert.equal(w.WrittenEngine.record(), false);
  assert.ok(w.WrittenEngine.revise()); assert.equal(w.WrittenEngine.getState().stage, 'compose'); assert.ok(w.WrittenEngine.getState().ratings.every(r => r === null));
  assert.match(w.WrittenEngine.getState().response, /自分の考え/); assert.equal(Object.keys(w.SaveManager.data().writtenRecords).length, 0);
});
test('written completion imports and resumes idempotently, old records remain when a prompt changes', () => {
  const env = create(), { w } = env, id = 'written-middle_geo_world-1';
  w.WrittenEngine.start(env.root, id); w.WrittenEngine.submit('根拠と比較'); [0, 1, 2].forEach(i => w.WrittenEngine.rate(i, 2)); w.WrittenEngine.record();
  let loaded = create(w.SaveManager.exportJSON()); assert.ok(loaded.w.WrittenEngine.resume(loaded.root)); assert.equal(loaded.w.WrittenEngine.record(), false);
  loaded.w.WrittenEngine.start(loaded.root, id); loaded.w.WrittenEngine.submit('書き直した回答'); [0, 1, 2].forEach(i => loaded.w.WrittenEngine.rate(i, 1)); loaded.w.WrittenEngine.record();
  assert.equal(loaded.w.SaveManager.data().writtenRecords[id].attempts, 2);
  const raw = JSON.parse(loaded.w.SaveManager.exportJSON()); raw.activeSession.content.modelAnswer += '更新';
  loaded = create(JSON.stringify(raw)); assert.equal(loaded.w.WrittenEngine.resume(loaded.root), false); assert.ok(loaded.w.SaveManager.data().meta.archivedSession);
  assert.equal(loaded.w.SaveManager.data().writtenRecords[id].attempts, 2);
  loaded.w.MIDDLE_WRITTEN[id].contentVersion++;
  assert.equal(loaded.w.MiddleRenderer.writtenCount('middle_geo_world', loaded.w.SaveManager.data()), 0);
  assert.match(loaded.w.MiddleRenderer.writtenNotebook(loaded.w.SaveManager.data()), /旧版の回答を保持/);
  assert.doesNotMatch(loaded.w.MiddleRenderer.writtenNotebook(loaded.w.SaveManager.data()), /資料・採点観点・模範解答/);
});
test('malformed written sessions archive safely, malformed self-ratings are not accepted', () => {
  const env = create(), { w } = env, id = 'written-s5_koku-1'; w.WrittenEngine.start(env.root, id);
  for (const mutate of [s => s.response = null, s => s.ratings = [99, 1, 2], s => s.stage = 'unknown', s => s.content.sourceMaterials[0].title = 'changed', s => s.courseId = 'other']) {
    const raw = JSON.parse(w.SaveManager.exportJSON()); mutate(raw.activeSession); const loaded = create(JSON.stringify(raw));
    assert.equal(loaded.w.WrittenEngine.resume(loaded.root), false); assert.ok(loaded.w.SaveManager.data().meta.archivedSession);
  }
  const raw = JSON.parse(w.SaveManager.exportJSON()); raw.writtenRecords[id] = { response: '回答', ratings: [2, 2, 99], assessedAt: new Date().toISOString() };
  assert.equal(create(JSON.stringify(raw)).w.SaveManager.data().writtenRecords[id], undefined);
  const protectedEnv = create('{broken'); assert.equal(protectedEnv.w.WrittenEngine.start(protectedEnv.root, id), false); assert.equal(protectedEnv.storage.get('shakai_quest_save_v1'), '{broken');
});
test('switching between written and choice sessions respects cancellation and selects the saved engine', () => {
  const { w, root } = create(); const id = 'written-s5_koku-1'; let resumes = 0;
  w.ShakaiApp.resumeQuiz = () => { resumes++; const s = w.SaveManager.data().activeSession; (s.kind === 'written' ? w.WrittenEngine : w.QuizEngine).resume(root); };
  w.WrittenEngine.start(root, id); w.WrittenEngine.draft('未完了'); w.confirm = () => false;
  assert.ok(w.QuizEngine.start(root, 's5_koku01', 'basic', null, {})); assert.equal(w.SaveManager.data().activeSession.kind, 'written');
  w.confirm = () => true; assert.ok(w.QuizEngine.start(root, 's5_koku01', 'basic', null, {})); const sessionId = w.SaveManager.data().activeSession.id;
  w.confirm = () => false; assert.ok(w.WrittenEngine.start(root, id)); assert.equal(w.SaveManager.data().activeSession.id, sessionId); assert.equal(resumes, 2);
});
test('middle map, notebook and parent report expose separate course, written and transfer records', () => {
  const env = create(), { w } = env; w.MiddleRenderer.render(env.root);
  assert.equal((env.root.innerHTML.match(/data-open-middle=/g) || []).length, 12); assert.equal((env.root.innerHTML.match(/data-middle-field=/g) || []).length, 3);
  const id = 'written-middle_civics_finance-1'; w.WrittenEngine.start(env.root, id); w.WrittenEngine.submit('根拠'); [0, 1, 2].forEach(i => w.WrittenEngine.rate(i, 2)); w.WrittenEngine.record();
  run(env, 's5_joho', null, 'denominator'); w.InventoryRenderer.notebook(env.root);
  assert.match(env.root.innerHTML, /記述の記録・自己評価/); assert.match(env.root.innerHTML, /別問題の復習/); assert.doesNotMatch(env.root.innerHTML, /undefined/);
  w.ReportRenderer.render(env.root, () => {}); assert.match(env.root.innerHTML, /記述・資料探究（自己評価）/);
  assert.match(env.root.innerHTML, /別問題の復習（初回回答）/); assert.equal((env.root.innerHTML.match(/<th scope="row">/g) || []).length, 55);
});
test('new numerical answers and written model anchors match independent calculations', () => {
  const { w } = create();
  const anchors = [
    ['middle_geo_world', 'applied', 2, `P${80 / 100 * 100}%、Q${40 / 200 * 100}%`],
    ['middle_geo_world', 'applied', 3, `P${40 / 100 * 100}%、Q${20 / 200 * 100}%`],
    ['middle_geo_world', 'hard', 0, '20%から30%へ、10ポイント増'],
    ['middle_geo_world', 'hard', 2, `P${400 / 100}単位、Q${600 / 200}単位`],
    ['middle_geo_world', 'hard', 4, `海の施設${80 + 10 - 40}単位、通年施設${50 + 40 - 45}単位`],
    ['middle_history_connections', 'applied', 2, `${1868 - 1789}年`],
    ['middle_history_connections', 'applied', 4, String(110 / 125 * 100)],
    ['middle_civics_finance', 'applied', 1, `${(30000 - 18000 - 5000 - 6000).toLocaleString('en-US')}円`],
    ['middle_civics_finance', 'applied', 4, `${(100000 * 1.02).toLocaleString('en-US')}円`],
    ['middle_civics_finance', 'hard', 0, `P${(6000 * 12).toLocaleString('en-US')}円、Q${(5000 * 15 + 2000).toLocaleString('en-US')}円`],
    ['middle_civics_finance', 'hard', 2, 'Iは+5%、IIは-5%'],
    ['middle_civics_welfare', 'applied', 2, `P${(10000 * .3).toLocaleString('en-US')}円、Q${(20000 * .2).toLocaleString('en-US')}円`],
    ['middle_civics_welfare', 'hard', 2, 'P10%、Q10%、R15%'],
    ['middle_civics_welfare', 'hard', 4, '件数は増えたが、割合は60%から50%へ下がった']
  ];
  for (const [id, difficulty, i, expected] of anchors) { const q = w.MiddleCourses.bank(id, difficulty)[i]; assert.equal(q.choices[q.answer], expected, q.id); }
  for (const [id, expected] of [['written-middle_geo_world-4', '通年施設は50＋40－45＝45'], ['written-middle_civics_finance-3', '77,000円'], ['written-s6_sei-1', '580']]) assert.ok(w.MIDDLE_WRITTEN[id].modelAnswer.includes(expected));
});
test('the original 216 question definitions are byte-for-byte unchanged by the expansion', () => {
  for (const file of ['data/middle-courses.js', 'data/middle-challenges.js']) {
    const previous = cp.execFileSync('git', ['show', '0ce62c1:shakai-quest/' + file], { cwd: appRoot, encoding: 'utf8' });
    assert.equal(fs.readFileSync(appRoot + '/' + file, 'utf8').replace(/\r\n/g, '\n'), previous.replace(/\r\n/g, '\n'));
  }
});
console.log(passed + '/' + passed + ' extension checks passed');
