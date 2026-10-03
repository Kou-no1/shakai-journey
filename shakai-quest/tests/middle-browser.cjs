const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..'), out = path.join(os.tmpdir(), 'social-quest-qa');
fs.mkdirSync(out, { recursive: true });
async function run() {
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const file = path.resolve(root, '.' + decodeURIComponent(pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
    fs.readFile(file, (err, body) => {
      if (err) { res.writeHead(404); res.end(); return; }
      res.setHeader('Content-Type', ({ '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' }[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8'); res.end(body);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser; const errors = [], external = [];
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined) });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    function watch(p) {
      p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      p.on('request', r => { if (/^https?:/.test(r.url()) && !r.url().startsWith('http://127.0.0.1:')) external.push(r.url()); });
      p.on('dialog', d => d.accept());
    }
    watch(page); await page.goto('http://127.0.0.1:' + server.address().port + '/');
    await page.locator('[data-tab="middle"]').click(); assert.equal(await page.locator('.middle-course-card').count(), 12);
    assert.equal(await page.locator('[data-middle-field]').count(), 3);
    const oldProgress = await page.evaluate(() => JSON.stringify(SaveManager.data().progress));
    assert.equal(await page.evaluate(() => Object.values(SaveManager.data().progress).some(p => p.basicClear)), false);
    await page.screenshot({ path: path.join(out, 'middle-portal-desktop.png'), fullPage: true });
    const ids = ['middle_geo_world', 'middle_history_connections', 'middle_civics_finance', 'middle_civics_welfare'];
    let answers = 0;
    for (const id of ids) for (const difficulty of ['standard', 'applied', 'hard']) {
      await page.evaluate(c => ShakaiApp.openMiddle(c), id);
      await page.locator('[data-portal-difficulty="' + difficulty + '"]').click();
      assert.equal(await page.evaluate(() => QuizEngine.getState().options.middlePortal), true);
      let count = 0;
      while (!await page.evaluate(() => QuizEngine.getState().finished)) {
        assert.ok(count++ < 17); const correct = await page.evaluate(() => { const s = QuizEngine.getState(); return s.questions[s.index].answer; });
        if (difficulty !== 'standard') assert.ok(await page.locator('#quiz-root .question-data').count() >= 2);
        await page.locator('#quiz-root [data-value="' + correct + '"]').click(); answers++;
        assert.match(await page.locator('#quiz-root .feedback').innerText(), /正解/);
        await page.locator('#quiz-root [data-action="next"]').click();
      }
      await page.locator('#quiz-root [data-action="node"]').click(); assert.equal(await page.locator('#screen-middle.active').count(), 1);
      const p = await page.evaluate(({ id, difficulty }) => SaveManager.getMiddleProgress(id, difficulty), { id, difficulty });
      assert.equal(p.stats.total, difficulty === 'standard' ? 15 : 6); assert.equal(p.perfect, true);
    }
    assert.equal(answers, 108); assert.equal(await page.evaluate(() => JSON.stringify(SaveManager.data().progress)), oldProgress);
    let written = 0;
    for (const id of await page.evaluate(() => Object.keys(MIDDLE_WRITTEN))) {
      await page.evaluate(q => ShakaiApp.startWritten(q), id);
      await page.locator('#written-response').fill('二つの資料の条件を比較して、根拠と限界を説明する。');
      if (written === 0) {
        const draft = await page.evaluate(() => JSON.stringify(WrittenEngine.getState()));
        await page.reload(); await page.locator('[data-tab="middle"]').click(); await page.locator('[data-middle-resume]').click();
        assert.equal(await page.evaluate(() => JSON.stringify(WrittenEngine.getState())), draft);
        assert.equal(await page.locator('#written-response').inputValue(), '二つの資料の条件を比較して、根拠と限界を説明する。');
      }
      await page.locator('[data-written-submit]').click(); assert.equal(await page.locator('[data-written-record]').isDisabled(), true);
      assert.ok(await page.locator('.model-answer').innerText());
      for (let i = 0; i < 3; i++) await page.locator('[data-criterion="' + i + '"][value="2"]').check();
      if (written === 0) {
        await page.reload(); await page.locator('[data-tab="middle"]').click(); await page.locator('[data-middle-resume]').click();
        assert.equal(await page.locator('[data-criterion]:checked').count(), 3);
      }
      await page.locator('[data-written-record]').click(); assert.match(await page.locator('.written-saved').innerText(), /6 \/ 6/);
      written++; await page.locator('[data-written-back]').click();
    }
    assert.equal(written, 32);
    assert.equal(await page.evaluate(() => Object.values(SaveManager.data().questionStats).reduce((n, p) => n + p.attempts, 0)), 108);
    const beforeTransfer = await page.evaluate(() => ({ exp: SaveManager.data().player.exp, kakera: SaveManager.data().owned.kakeraCount, courses: JSON.stringify(SaveManager.data().middleProgress) }));
    for (const reason of await page.evaluate(() => Object.keys(MIDDLE_REVIEW_BANK))) {
      await page.evaluate(() => ShakaiApp.openMiddle()); await page.locator('[data-transfer-reason]').selectOption(reason);
      await page.locator('[data-transfer-select]').click();
      assert.equal(await page.evaluate(() => QuizEngine.getState().initialCount), 2);
      while (!await page.evaluate(() => QuizEngine.getState().finished)) {
        const answer = await page.evaluate(() => { const s = QuizEngine.getState(); return s.questions[s.index].answer; });
        await page.locator('[data-value="' + answer + '"]').click(); await page.locator('[data-action="next"]').click();
      }
    }
    assert.deepEqual(await page.evaluate(() => ({ exp: SaveManager.data().player.exp, kakera: SaveManager.data().owned.kakeraCount, courses: JSON.stringify(SaveManager.data().middleProgress) })), beforeTransfer);
    await page.evaluate(() => { const q = MiddleCourses.bank('s5_joho', 'hard')[0]; SaveManager.data().questionStats[q.id] = { attempts: 1, correct: 0, lastCorrect: false, lastMistake: 'denominator' }; SaveManager.save(); ShakaiApp.openMiddle(); });
    assert.equal(await page.locator('[data-transfer="denominator"]').count(), 1); await page.locator('[data-transfer="denominator"]').click();
    assert.ok(await page.evaluate(() => QuizEngine.getState().questions.every(q => q.id.startsWith('transfer-denominator'))));
    await page.evaluate(() => ShakaiApp.showTab('notebook')); assert.equal(await page.locator('.written-entry').count(), 32);
    assert.ok(await page.locator('.written-entry').first().innerText());
    await page.evaluate(() => ShakaiApp.openReport());
    assert.equal(await page.locator('.middle-report tbody tr').count(), 36); assert.equal(await page.locator('.written-report tbody tr').count(), 12); assert.equal(await page.locator('.practice-report tbody tr').count(), 7);
    assert.match(await page.locator('.written-report').innerText(), /6\/6/);
    await page.emulateMedia({ media: 'print' }); assert.equal(await page.locator('.tabbar').isVisible(), false); assert.equal(await page.locator('.app-header').isVisible(), false);
    assert.equal(await page.locator('#screen-report').isVisible(), true); assert.equal(await page.locator('#screen-middle').isVisible(), false);
    await page.pdf({ path: path.join(out, 'middle-expanded-report.pdf'), format: 'A4' }); await page.emulateMedia({ media: 'screen' });
    for (const viewport of [{ width: 1280, height: 900 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport); await page.evaluate(() => ShakaiApp.openMiddle());
      assert.ok(await page.locator('.tabbar .tab').evaluateAll(els => els.every(e => e.scrollWidth <= e.clientWidth + 1 && e.getBoundingClientRect().height >= 44)));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      assert.ok(await page.locator('.middle-course-card > svg').evaluateAll(els => els.every(e => e.getBoundingClientRect().height === 90 && getComputedStyle(e).position === 'static')));
      await page.screenshot({ path: path.join(out, 'middle-portal-' + viewport.width + '.png'), fullPage: true });
      await page.evaluate(() => ShakaiApp.openMiddle('middle_civics_finance')); await page.screenshot({ path: path.join(out, 'middle-course-' + viewport.width + '.png'), fullPage: true });
      await page.evaluate(() => ShakaiApp.startWritten('written-middle_civics_finance-3'));
      await page.locator('#written-response').fill('Pは72,000円、Qは77,000円。Qは月額が低いが、総額と元本を超える負担は大きい。');
      await page.locator('[data-written-submit]').click();
      assert.equal(await page.locator('#screen-quiz .mote').count(), 0);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      assert.ok(await page.locator('.written-criterion label').evaluateAll(els => els.every(e => e.getBoundingClientRect().height >= 44 && e.scrollWidth <= e.clientWidth + 1)));
      await page.screenshot({ path: path.join(out, 'middle-written-' + viewport.width + '.png'), fullPage: true });
      await page.evaluate(() => ShakaiApp.openReport()); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.screenshot({ path: path.join(out, 'middle-expanded-report-' + viewport.width + '.png'), fullPage: true });
    }
    const local = await browser.newPage(); watch(local); await local.goto(pathToFileURL(path.join(root, 'index.html')).href);
    await local.locator('[data-tab="middle"]').click(); await local.locator('[data-open-middle="middle_civics_welfare"]').click();
    await local.locator('[data-portal-difficulty="hard"]').click(); assert.equal(await local.locator('#quiz-root .choice-button').count(), 4);
    await local.evaluate(() => ShakaiApp.startWritten('written-middle_geo_world-1')); assert.equal(await local.locator('#written-response').count(), 1); await local.close();
    assert.deepEqual(errors, []); assert.deepEqual(external, []);
    console.log('PASS middle browser: 12-course independent map, 108 new answers, 32 self-assessed written tasks, 14 transfer questions, draft/evaluation reload, 36+12+7 report rows, print, PC/tablet/phone, file://, no errors or external requests');
    console.log('Screenshots: ' + out);
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
run().catch(err => { console.error(err); process.exitCode = 1; });
