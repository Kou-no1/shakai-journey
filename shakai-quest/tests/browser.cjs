const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const out = process.env.SOCIAL_SCREENSHOT_DIR || path.join(os.tmpdir(), 'social-quest-qa');
fs.mkdirSync(out, { recursive: true });

async function run() {
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const file = path.resolve(root, '.' + decodeURIComponent(pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
    fs.readFile(file, (error, body) => {
      if (error) { res.writeHead(404); res.end(); return; }
      res.setHeader('Content-Type', ({ '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' }[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8');
      res.end(body);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  const errors = [], external = [];
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined) });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    function watch(p) {
      p.on('pageerror', e => errors.push(e.message));
      p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      p.on('request', r => { if (/^https?:/.test(r.url()) && !r.url().startsWith('http://127.0.0.1:')) external.push(r.url()); });
      p.on('dialog', d => d.accept());
    }
    watch(page);
    await page.goto('http://127.0.0.1:' + server.address().port + '/');
    await page.locator('[data-grade="5"]').waitFor();
    assert.equal(await page.title(), '時空社会御朱印帳');
    const mapCounts = { 3: 7, 4: 9, 5: 19, 6: 17 };
    for (const grade of [3, 4, 5, 6]) {
      await page.locator('[data-grade="' + grade + '"]').click();
      assert.equal(await page.locator('.station-button').count(), mapCounts[grade]);
      assert.equal(await page.locator('.coming-soon').count(), 0);
      await page.screenshot({ path: path.join(out, 'map' + grade + '-desktop.png'), fullPage: true });
    }
    for (const id of ['s6_sei01', 's6_rek01', 's6_kok01']) assert.equal(await page.locator('[data-node-id="' + id + '"]').isEnabled(), true);
    const assetCheck = await page.evaluate(async () => {
      const sources = Object.keys(MONSTER_DATA).map(id => [id, SocialRPG.art(id), 1000]);
      Object.keys(NODES_DATA).forEach(id => sources.push([id, ShakaiIcons.stationBackground(id), 300]));
      [MEIBUTSU_DATA, IJIN_DATA, CHARA_DATA, ITEM_DATA].forEach(data => Object.keys(data).forEach(id => sources.push([id, ShakaiIcons.render(data[id].svgKey || id, data[id].name), 500])));
      const style = getComputedStyle(document.documentElement), failed = [];
      for (const [id, raw, minimum] of sources) {
        const holder = document.createElement('div'); holder.innerHTML = raw.replace(/var\((--[\w-]+)\)/g, (_, key) => style.getPropertyValue(key).trim());
        const svg = holder.querySelector('svg'); svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg)); await img.decode();
        const c = document.createElement('canvas'); c.width = 180; c.height = 180;
        const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, 180, 180);
        const bytes = ctx.getImageData(0, 0, 180, 180).data; let count = 0;
        for (let i = 3; i < bytes.length; i += 4) if (bytes[i] > 20) count++;
        if (count < minimum || raw.includes('undefined')) failed.push([id, count]);
      }
      return { failed, count: sources.length };
    });
    assert.deepEqual(assetCheck.failed, []); assert.equal(assetCheck.count, 394);
    await page.locator('[data-grade="3"]').click();
    await page.locator('[data-grade="3"]').focus(); await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('[data-grade="4"]').getAttribute('aria-selected'), 'true');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.grade), '4');
    await page.locator('[data-grade="3"]').click();
    await page.locator('[data-node-id="s3_machi01"]').click();
    assert.equal(await page.locator('#course-limit').inputValue(), 'all');
    await page.locator('#course-mode').selectOption('challenge');
    await page.locator('[data-tier="basic"]').click();
    const initial = await page.evaluate(() => JSON.parse(JSON.stringify(QuizEngine.getState())));
    assert.equal(initial.initialCount, 10);
    const wrong = (initial.questions[0].answer + 1) % 4;
    await page.locator('[data-value="' + wrong + '"]').focus(); await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.action), 'next');
    assert.match(await page.locator('.feedback').innerText(), /✗/);
    assert.match(await page.locator('.life-count').innerText(), /3 \/ 4/);
    assert.equal(await page.locator('.choice-button:disabled').count(), 4);
    const saved = await page.evaluate(() => JSON.stringify(QuizEngine.getState()));
    await page.reload(); await page.locator('[data-resume]').click();
    assert.equal(await page.evaluate(() => JSON.stringify(QuizEngine.getState())), saved);
    assert.match(await page.locator('.feedback').innerText(), /✗/);
    await page.locator('[data-action="next"]').click();
    const second = await page.evaluate(() => QuizEngine.getState().questions[1].answer);
    await page.locator('[data-value="' + second + '"]').click();
    assert.ok(Number(await page.locator('.enemy-hp progress').getAttribute('value')) <= 3);
    assert.equal(await page.evaluate(() => SaveManager.data().owned.kakeraCount), 2);
    await page.evaluate(() => ShakaiApp.showTab('settings'));
    await page.locator('#setting-sound').check();
    await page.locator('#setting-reduce-motion').check();
    assert.equal(await page.locator('body').evaluate(e => e.classList.contains('reduce-motion')), true);
    await page.locator('#setting-ruby').uncheck();
    await page.evaluate(() => ShakaiApp.resumeQuiz());
    assert.equal(await page.locator('.question-card ruby').count(), 0);
    await page.evaluate(() => { SaveManager.data().settings.ruby = true; SaveManager.save(); ShakaiApp.startQuiz('s3_machi01', 'basic', null, { replace: true, mode: 'learn' }); });
    assert.ok(await page.locator('.question-card ruby').count() > 0);
    const firstWrong = await page.evaluate(() => (QuizEngine.getState().questions[0].answer + 1) % 4);
    await page.locator('[data-value="' + firstWrong + '"]').click(); await page.locator('[data-action="next"]').click();
    let answered = 1;
    while (!await page.evaluate(() => QuizEngine.getState().finished)) {
      assert.ok(++answered < 30);
      const correct = await page.evaluate(() => { const s = QuizEngine.getState(); return s.questions[s.index].answer; });
      await page.locator('[data-value="' + correct + '"]').click(); await page.locator('[data-action="next"]').click();
    }
    assert.equal(await page.evaluate(() => SaveManager.data().progress.s3_machi01.basicClear), true);
    assert.equal(await page.evaluate(() => QuizEngine.getState().result.perfect), false);
    assert.equal(await page.evaluate(() => QuizEngine.getState().questions.length), 11);
    for (const tier of ['advanced', 'extra']) {
      await page.evaluate(t => ShakaiApp.startQuiz('s3_machi01', t, null, { replace: true, mode: 'challenge' }), tier);
      while (!await page.evaluate(() => QuizEngine.getState().finished)) {
        const a = await page.evaluate(() => { const s = QuizEngine.getState(); return s.questions[s.index].answer; });
        await page.locator('[data-value="' + a + '"]').click(); await page.locator('[data-action="next"]').click();
      }
      if (tier === 'advanced') assert.match(await page.locator('.result-guide').innerText(), /地図の案内人/);
    }
    assert.equal(await page.evaluate(() => SaveManager.data().owned.equipment.includes('rare_s3_machi01')), true);
    assert.equal(await page.locator('.hanko-stamp-anim').evaluate(e => getComputedStyle(e).opacity), '1');
    await page.evaluate(() => document.querySelector('#toast-root').replaceChildren());
    await page.screenshot({ path: path.join(out, 'rare-result.png'), fullPage: true });
    await page.evaluate(() => { const s = SaveManager.data(); s.owned.chara = Object.keys(CHARA_DATA).slice(0, 3); s.owned.equipment.push('gear_s3_machi_shield'); SaveManager.save(); ShakaiApp.showTab('inventory'); });
    await page.locator('[data-equip="gear_s3_machi_shield"]').click();
    assert.equal(await page.evaluate(() => SaveManager.data().player.equipped.shield), 'gear_s3_machi_shield');
    const companionButtons = page.locator('[data-companion]');
    await companionButtons.nth(0).click(); await companionButtons.nth(1).click();
    assert.equal(await companionButtons.nth(2).isEnabled(), false);
    assert.equal(await page.evaluate(() => SaveManager.data().activeCompanions.length), 2);
    await page.locator('#encounter-grade').selectOption('4');
    assert.equal(await page.locator('[data-explore]').count(), 27);
    await page.locator('#encounter-owned').check();
    assert.equal(await page.locator('[data-explore]').count(), 0);
    await page.locator('#encounter-owned').uncheck(); await page.locator('#encounter-grade').selectOption('3');
    const target = await page.locator('[data-explore]').first().getAttribute('data-explore');
    await page.locator('[data-explore]').first().click();
    assert.equal(await page.evaluate(() => QuizEngine.getState().monsterId), target);
    await page.evaluate(() => ShakaiApp.showTab('notebook'));
    assert.ok(await page.locator('.notebook-entry').count() > 0);
    await page.evaluate(() => ShakaiApp.openReport());
    assert.equal(await page.locator('.line-report-row').count(), 17);
    assert.match(await page.locator('.overall-report').innerText(), /52駅/);
    await page.emulateMedia({ media: 'print' });
    for (const selector of ['.tabbar', '.app-header', '.report-actions']) assert.equal(await page.locator(selector).isVisible(), false, selector);
    assert.equal(await page.locator('#report-root').isVisible(), true);
    await page.pdf({ path: path.join(out, 'report.pdf'), format: 'A4' });
    await page.emulateMedia({ media: 'screen' });
    await page.evaluate(() => ShakaiApp.showTab('settings'));
    const downloadEvent = page.waitForEvent('download'); await page.locator('#export-save-btn').click();
    const download = await downloadEvent, exportedFile = path.join(out, 'exported-save.json'); await download.saveAs(exportedFile);
    const exported = JSON.parse(fs.readFileSync(exportedFile, 'utf8')); assert.equal(exported.schema, 2);
    const beforeImport = await page.evaluate(() => localStorage.getItem(SaveManager.key));
    await page.locator('#import-save-file').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
    await page.waitForFunction(() => document.querySelector('#import-save-file').value === '');
    assert.equal(await page.evaluate(() => localStorage.getItem(SaveManager.key)), beforeImport);
    exported.player.name = '確認用の旅人';
    await page.locator('#import-save-file').setInputFiles({ name: 'valid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported)) });
    await page.waitForFunction(() => SaveManager.data().player.name === '確認用の旅人');
    await page.evaluate(() => {
      const s = SaveManager.data(); Object.keys(s.progress).forEach(id => { s.progress[id].basicClear = true; });
      s.owned.achievements = Object.keys(ACHIEVEMENT_DATA);
      SaveManager.save(); ShakaiApp.openNode('s3_work01');
    });
    await page.locator('[data-branch-id="farm"]').click();
    await page.locator('[data-tier="basic"]').click();
    assert.equal(await page.evaluate(() => QuizEngine.getState().branchId), 'farm');
    await page.reload(); await page.locator('[data-resume]').click();
    assert.equal(await page.evaluate(() => QuizEngine.getState().branchId), 'farm');
    await page.evaluate(() => ShakaiApp.openNode('s3_work01'));
    await page.locator('[data-switch-branch]').click(); await page.locator('[data-branch-id="factory"]').click();
    assert.equal(await page.evaluate(() => SaveManager.data().progress.s3_work01.branchChosen), 'factory');

    const elementaryBeforeMiddle = await page.evaluate(() => JSON.stringify(SaveManager.data().progress));
    const gearBeforeMiddle = await page.evaluate(() => JSON.stringify(SaveManager.data().owned.equipment));
    for (const [i, course] of ['s5_koku', 's5_shoku', 's5_kogyo', 's5_joho', 's5_kankyo', 's6_sei', 's6_rek', 's6_kok'].entries()) {
      const nodeId = await page.evaluate(id => Object.keys(NODES_DATA).find(n => NODES_DATA[n].lineId === id && NODES_DATA[n].order === 1), course);
      await page.evaluate(id => ShakaiApp.openNode(id), nodeId);
      await page.locator('#course-mode').selectOption('learn');
      await page.locator('[data-middle-course="' + course + '"]').click();
      assert.equal(await page.evaluate(() => QuizEngine.getState().initialCount), 15);
      assert.match(await page.locator('.stage-label').innerText(), /中学発展・(地理|歴史|公民)/);
      const answer = await page.evaluate(() => QuizEngine.getState().questions[0].answer);
      await page.locator('[data-value="' + (i === 0 ? (answer + 1) % 4 : answer) + '"]').click();
      if (i === 0) {
        const saved = await page.evaluate(() => JSON.stringify(QuizEngine.getState()));
        await page.reload(); await page.locator('[data-resume]').click();
        assert.equal(await page.evaluate(() => JSON.stringify(QuizEngine.getState())), saved);
        assert.match(await page.locator('.feedback').innerText(), /✗/);
      }
      await page.locator('[data-action="next"]').click();
      let count = 1;
      while (!await page.evaluate(() => QuizEngine.getState().finished)) {
        assert.ok(count++ < 20);
        const correct = await page.evaluate(() => { const s = QuizEngine.getState(); return s.questions[s.index].answer; });
        await page.locator('[data-value="' + correct + '"]').click(); await page.locator('[data-action="next"]').click();
      }
      assert.match(await page.locator('#quiz-title').innerText(), /中学発展コース完了/);
      const record = await page.evaluate(id => SaveManager.data().middleProgress[id], course);
      assert.equal(record.stats.total, 15); assert.equal(record.perfect, i !== 0); assert.equal(record.masteredQuestionIds.length, 15);
      await page.screenshot({ path: path.join(out, 'middle-' + course + '-result.png'), fullPage: true });
    }
    assert.equal(await page.evaluate(() => JSON.stringify(SaveManager.data().progress)), elementaryBeforeMiddle);
    assert.equal(await page.evaluate(() => JSON.stringify(SaveManager.data().owned.equipment)), gearBeforeMiddle);
    await page.evaluate(() => ShakaiApp.showTab('notebook'));
    assert.equal(await page.locator('.notebook-entry:has(.stage-label)').count(), 120);
    await page.evaluate(() => ShakaiApp.openReport());
    assert.equal(await page.locator('.middle-report tbody tr').count(), 36);
    assert.match(await page.locator('.middle-report').innerText(), /14\/15/);
    await page.emulateMedia({ media: 'print' });
    assert.equal(await page.locator('.tabbar').isVisible(), false);
    assert.equal(await page.locator('.middle-report').isVisible(), true);
    await page.pdf({ path: path.join(out, 'middle-report.pdf'), format: 'A4' });
    await page.emulateMedia({ media: 'screen' });

    for (const course of ['s5_koku', 's5_shoku', 's5_kogyo', 's5_joho', 's5_kankyo', 's6_sei', 's6_rek', 's6_kok']) {
      const nodeId = await page.evaluate(id => Object.keys(NODES_DATA).find(n => NODES_DATA[n].lineId === id && NODES_DATA[n].order === 1), course);
      for (const difficulty of ['applied', 'hard']) {
        await page.evaluate(id => ShakaiApp.openNode(id), nodeId);
        await page.locator('[data-difficulty="' + difficulty + '"]').focus(); await page.keyboard.press('Enter');
        assert.equal(await page.locator('[data-difficulty="' + difficulty + '"]').getAttribute('aria-pressed'), 'true');
        await page.locator('#course-mode').selectOption('learn');
        await page.locator('[data-middle-course="' + course + '"]').click();
        assert.equal(await page.evaluate(() => QuizEngine.getState().initialCount), 6);
        assert.ok(await page.locator('#quiz-root .source-materials .question-data').count() >= 2);
        let count = 0;
        while (!await page.evaluate(() => QuizEngine.getState().finished)) {
          const a = await page.evaluate(() => { const s = QuizEngine.getState(); return s.questions[s.index].answer; });
          const isWrong = course === 's5_koku' && difficulty === 'applied' && count === 0;
          await page.locator('[data-value="' + (isWrong ? (a + 1) % 4 : a) + '"]').click();
          assert.ok(await page.locator('#quiz-root .evidence-details li').count() >= 2);
          if (isWrong) {
            assert.match(await page.locator('#quiz-root .mistake-cue').innerText(), /着目点/);
            const saved = await page.evaluate(() => JSON.stringify(QuizEngine.getState()));
            await page.reload(); await page.locator('[data-resume]').click();
            assert.equal(await page.evaluate(() => JSON.stringify(QuizEngine.getState())), saved);
            assert.match(await page.locator('.feedback').innerText(), /根拠を照合/);
          }
          await page.locator('[data-action="next"]').click(); assert.ok(count++ < 9);
        }
        const record = await page.evaluate(({ course, difficulty }) => SaveManager.getMiddleProgress(course, difficulty), { course, difficulty });
        assert.equal(record.stats.total, 6); assert.equal(record.masteredQuestionIds.length, 6);
        assert.equal(record.perfect, !(course === 's5_koku' && difficulty === 'applied'));
      }
    }
    assert.equal(await page.evaluate(() => JSON.stringify(SaveManager.data().progress)), elementaryBeforeMiddle);
    assert.equal(await page.evaluate(() => JSON.stringify(SaveManager.data().owned.equipment)), gearBeforeMiddle);
    await page.evaluate(() => ShakaiApp.showTab('notebook'));
    assert.equal(await page.locator('.notebook-entry:has(.stage-label)').count(), 216);

    await page.evaluate(() => ShakaiApp.openNode('s5_joho01'));
    await page.locator('[data-difficulty="hard"]').click(); await page.locator('[data-middle-course="s5_joho"]').click();
    const mistake = await page.evaluate(() => { const q = QuizEngine.getState().questions[0], wrong = (q.answer + 1) % 4; return { wrong, reason: q.choiceReasons[wrong], id: q.id }; });
    await page.locator('[data-value="' + mistake.wrong + '"]').click();
    const firstStats = await page.evaluate(() => JSON.stringify(SaveManager.getMiddleProgress('s5_joho', 'hard').stats));
    const expBeforeReview = await page.evaluate(() => SaveManager.data().player.exp);
    await page.evaluate(() => ShakaiApp.showTab('notebook'));
    await page.locator('[data-mistake-filter]').selectOption(mistake.reason);
    assert.equal(await page.locator('.notebook-entry').count(), 1);
    await page.locator('[data-review-node]').click();
    assert.equal(await page.evaluate(() => QuizEngine.getState().initialCount), 1);
    assert.equal(await page.evaluate(() => QuizEngine.getState().options.middleDifficulty), 'hard');
    assert.equal(await page.evaluate(() => QuizEngine.getState().questions[0].id), mistake.id);
    const reviewAnswer = await page.evaluate(() => QuizEngine.getState().questions[0].answer);
    await page.locator('[data-value="' + reviewAnswer + '"]').click(); await page.locator('[data-action="next"]').click();
    assert.equal(await page.evaluate(() => JSON.stringify(SaveManager.getMiddleProgress('s5_joho', 'hard').stats)), firstStats);
    assert.equal(await page.evaluate(() => SaveManager.data().player.exp), expBeforeReview);
    await page.evaluate(() => ShakaiApp.showTab('notebook')); await page.locator('[data-mistake-filter]').selectOption('');
    await page.evaluate(() => ShakaiApp.openReport());
    assert.equal(await page.locator('.middle-report tbody tr').count(), 36);
    await page.emulateMedia({ media: 'print' });
    assert.equal(await page.locator('.tabbar').isVisible(), false);
    assert.equal(await page.locator('.report-actions').isVisible(), false);
    await page.pdf({ path: path.join(out, 'middle-challenges-report.pdf'), format: 'A4' });
    await page.emulateMedia({ media: 'screen' });

    for (const viewport of [{ width: 1280, height: 900 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      for (const [id, course] of [['s5_koku01', 's5_koku'], ['s6_sei01', 's6_sei'], ['s6_rek01', 's6_rek']]) for (const difficulty of ['applied', 'hard']) {
        await page.evaluate(id => ShakaiApp.openNode(id), id);
        await page.locator('[data-difficulty="' + difficulty + '"]').click();
        await page.locator('[data-middle-course="' + course + '"]').click();
        assert.ok(await page.locator('#quiz-root .source-materials .question-data').count() >= 2);
        for (const text of await page.locator('#quiz-root .source-materials figcaption').allTextContents()) assert.match(text, /資料[ABC].*学習用の架空データ/);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), difficulty + '/' + course + '/' + viewport.width);
        assert.ok(await page.locator('#quiz-root .source-materials').evaluate(e => e.getBoundingClientRect().width > 250));
        assert.ok(await page.locator('.choice-button').evaluateAll(els => els.every(e => e.scrollWidth <= e.clientWidth + 1 && e.getBoundingClientRect().height >= 44)));
        assert.equal(await page.locator('.mote:visible').count(), 0);
        await page.evaluate(() => document.querySelector('#toast-root').replaceChildren());
        await page.screenshot({ path: path.join(out, 'multi-' + course + '-' + difficulty + '-' + viewport.width + '.png'), fullPage: true });
        const a = await page.evaluate(() => QuizEngine.getState().questions[0].answer);
        await page.locator('[data-value="' + ((a + 1) % 4) + '"]').click();
        assert.ok(await page.locator('#quiz-root .evidence-details li').count() >= 2);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'feedback overflow');
        await page.evaluate(() => document.querySelector('#toast-root').replaceChildren());
        await page.screenshot({ path: path.join(out, 'multi-feedback-' + course + '-' + difficulty + '-' + viewport.width + '.png'), fullPage: true });
      }
      for (const [id, course] of [['s5_koku01', 's5_koku'], ['s6_sei01', 's6_sei'], ['s6_rek01', 's6_rek']]) {
        await page.evaluate(id => ShakaiApp.openNode(id), id);
        assert.ok(await page.locator('[data-middle-course]').evaluate(e => e.scrollWidth <= e.clientWidth + 1 && e.getBoundingClientRect().height >= 44));
        await page.locator('[data-middle-course="' + course + '"]').click();
        // Advance to a table through real answers; the bank and saved question order stay untouched.
        while (!await page.locator('#quiz-root .question-data').count()) {
          const a = await page.evaluate(() => { const s = QuizEngine.getState(); return s.questions[s.index].answer; });
          await page.locator('[data-value="' + a + '"]').click(); await page.locator('[data-action="next"]').click();
        }
        assert.match(await page.locator('#quiz-root .question-data').innerText(), /学習用の架空データ/);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), course + ' overflow/' + viewport.width);
        assert.ok(await page.locator('.choice-button').evaluateAll(els => els.every(e => e.scrollWidth <= e.clientWidth + 1 && e.getBoundingClientRect().height >= 44)));
        assert.equal(await page.locator('.mote:visible').count(), 0);
        await page.screenshot({ path: path.join(out, 'middle-' + course + '-' + viewport.width + '.png'), fullPage: true });
      }
      for (const id of ['s3_machi01', 's3_safe01', 's4_life01', 's4_area01', 's5_shoku01', 's6_rek01', 's6_rek11']) {
        await page.evaluate(id => ShakaiApp.startQuiz(id, 'basic', null, { replace: true, mode: 'challenge' }), id);
        const geometry = await page.locator('[data-enemy-art] svg').evaluate(e => {
          const a = e.getBoundingClientRect(), b = document.querySelector('[data-battle-stage]').getBoundingClientRect();
          return { width: a.width, height: a.height, inside: a.x >= b.x && a.right <= b.right && a.y >= b.y && a.bottom <= b.bottom };
        });
        assert.ok(geometry.width >= 100 && geometry.height >= 100 && geometry.inside, id + '/' + viewport.width);
        const pixels = await page.evaluate(async () => {
          const original = document.querySelector('[data-enemy-art] svg'), svg = original.cloneNode(true);
          [...svg.querySelectorAll('*'), svg].forEach(e => {
            for (const attr of ['fill', 'stroke']) if ((e.getAttribute(attr) || '').includes('var(') || e.getAttribute(attr) === 'currentColor') {
              const index = [...svg.querySelectorAll('*')].indexOf(e), live = index < 0 ? original : original.querySelectorAll('*')[index];
              e.setAttribute(attr, getComputedStyle(live)[attr]);
            }
          });
          const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg)); await img.decode();
          const c = document.createElement('canvas'); c.width = 200; c.height = 200;
          const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, 200, 200);
          const bytes = ctx.getImageData(0, 0, 200, 200).data; let count = 0;
          for (let i = 3; i < bytes.length; i += 4) if (bytes[i] > 20) count++;
          return count;
        });
        assert.ok(pixels > 1000, 'nonblank ' + id);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), id + ' overflow');
        assert.ok(await page.locator('.choice-button').evaluateAll(els => els.every(e => e.scrollWidth <= e.clientWidth + 1 && e.getBoundingClientRect().height >= 44)), 'choice fit');
        if (id === 's6_rek11') { assert.equal(await page.locator('.enemy-hp,.life-count,.mote:visible').count(), 0); assert.equal(await page.evaluate(() => QuizEngine.getState().monsterId), null); }
        await page.screenshot({ path: path.join(out, id + '-' + viewport.width + '.png'), fullPage: true });
      }
      for (const tab of ['map', 'collection', 'inventory', 'notebook', 'settings']) {
        await page.evaluate(t => ShakaiApp.showTab(t), tab);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tab + ' overflow/' + viewport.width);
        await page.screenshot({ path: path.join(out, tab + '-' + viewport.width + '.png'), fullPage: tab !== 'inventory' });
      }
      await page.evaluate(() => ShakaiApp.openReport());
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'report overflow');
      await page.screenshot({ path: path.join(out, 'report-' + viewport.width + '.png'), fullPage: true });
    }
    await page.evaluate(() => { SaveManager.data().progress.s5_shoku02.basicClear = true; SaveManager.save(); ShakaiApp.startQuiz('s5_shoku02', 'advanced', null, { replace: true, mode: 'learn' }); });
    await page.evaluate(() => { while (!QuizEngine.getState().finished) { const s = QuizEngine.getState(); QuizEngine.answer(document.querySelector('#quiz-root'), s.questions[s.index].answer); QuizEngine.advance(); } });
    assert.match(await page.locator('.result-guide').innerText(), /お米名人/);
    assert.ok(await page.locator('.toast').count() <= 2);
    await page.evaluate(() => document.querySelector('#toast-root').replaceChildren());
    await page.screenshot({ path: path.join(out, 'rice-certification-mobile.png'), fullPage: true });
    await page.evaluate(() => dispatchEvent(new CustomEvent('shakai:achievement', { detail: [ACHIEVEMENT_DATA.ach_grade3_complete, ACHIEVEMENT_DATA.ach_grade4_complete] })));
    assert.equal(await page.locator('#achievement-modal-title').innerText(), 'まちの探検家');
    assert.equal(await page.locator('.achievement-modal').evaluate(e => getComputedStyle(e).opacity), '1');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.querySelector('#achievement-overlay').classList.contains('show') && document.querySelector('#achievement-modal-title').textContent === '地域の探究者');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#achievement-overlay.show').count(), 0);
    await page.evaluate(() => { SaveManager.data().settings.motion = false; SaveManager.save(); ShakaiApp.showTab('settings'); });
    assert.equal(await page.locator('body').evaluate(e => e.classList.contains('reduce-motion')), true);
    const filePage = await browser.newPage(); watch(filePage);
    await filePage.goto(pathToFileURL(path.join(root, 'index.html')).href);
    await filePage.locator('[data-grade="5"]').waitFor();
    await filePage.locator('[data-node-id="s5_koku01"]').click(); await filePage.locator('[data-tier="basic"]').click();
    assert.ok(await filePage.locator('.choice-button').count() > 0);
    await filePage.close();
    const protectedPage = await browser.newPage(); watch(protectedPage);
    await protectedPage.addInitScript(() => localStorage.setItem('shakai_quest_save_v1', '{broken'));
    await protectedPage.goto('http://127.0.0.1:' + server.address().port + '/'); await protectedPage.locator('[data-grade="5"]').waitFor();
    assert.equal(await protectedPage.evaluate(() => SaveManager.status().protected), true);
    await protectedPage.locator('[data-node-id="s5_koku01"]').click(); await protectedPage.locator('[data-tier="basic"]').click();
    assert.equal(await protectedPage.evaluate(() => localStorage.getItem(SaveManager.key)), '{broken');
    await protectedPage.close();
    assert.deepEqual(errors, []); assert.deepEqual(external, []);
    console.log('PASS browser: 3/4/5/6 maps, middle 120 standard + 96 multi-source questions, difficulty-specific progress, misconception review, resume, keyboard, HP/lives, retries, rare rewards, equipment, companions, 36-row middle report print, responsive SVG pixels, ruby, reduced motion, war restraint, file://, no external requests');
    console.log('Screenshots: ' + out);
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
