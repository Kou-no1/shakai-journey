const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
    (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined) });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
    const errors = [];
    page.on('request', r => { if (/^https?:/.test(r.url())) errors.push(r.url()); });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    const out = path.join(os.tmpdir(), 'social-quest-qa');
    fs.mkdirSync(out, { recursive: true });
    const snapshots = new Set();
    const before = await page.evaluate(() => localStorage.getItem(SaveManager.key));
    for (const [epoch, name] of [['now','にっぽん'],['early','縄文'],['castle','戦国']]) {
      await page.locator('[data-epoch="' + epoch + '"]').click();
      assert.match(await page.locator('#atlas-target').innerText(), new RegExp(name));
      snapshots.add(await page.locator('#atlas-picture').innerHTML());
      assert.equal(await page.locator('.atlas-hand').evaluate(el => getComputedStyle(el).animationName), 'atlas-set');
    }
    assert.equal(snapshots.size, 3);
    assert.equal(await page.evaluate(() => localStorage.getItem(SaveManager.key)), before);
    assert.match(await page.locator('#atlas-target').innerText(), /未開放/);
    await page.locator('#atlas-go').click();
    assert.match(await page.locator('#node-title').innerText(), /縄文/);
    assert.match(await page.locator('.arrival-ticket').innerText(), /到着/);
    assert.equal(await page.evaluate(() => SaveManager.isNodeUnlocked('s6_rek06')), false);
    await page.evaluate(() => { SaveManager.setNodeProgress('s6_rek05',{basicClear:true}); ShakaiApp.showTab('map'); });
    await page.locator('[data-epoch="castle"]').click();
    await page.locator('#atlas-go').click();
    assert.match(await page.locator('#node-title').innerText(), /戦国/);
    await page.evaluate(() => ShakaiApp.openNode('s6_rek11'));
    assert.equal(await page.locator('.archive-ticket .arrival-stamp').evaluate(el => getComputedStyle(el).animationName), 'none');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('[data-tab="map"]').click();
    assert.equal(await page.locator('.atlas-hand').evaluate(el => getComputedStyle(el).animationName), 'none');
    for (const width of [1280,768,390,320]) {
      await page.setViewportSize({ width, height: 860 });
      await page.locator('#map-root [data-grade="5"]').click();
      await page.locator('[data-epoch="' + (width < 500 ? 'castle' : 'now') + '"]').click();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.evaluate(() => scrollTo(0,0));
      await page.screenshot({ path: path.join(out, 'atlas-' + width + '.png') });
      const clipped = await page.locator('.atlas-map button').evaluateAll(bs => bs.filter(b =>
        b.scrollWidth > b.clientWidth + 1 || b.offsetHeight < 44).map(b => [b.textContent,b.scrollWidth,b.clientWidth,b.offsetHeight]));
      assert.deepEqual(clipped, [], 'button geometry at ' + width + ': ' + JSON.stringify(clipped));
    }
    await page.evaluate(() => {
      SaveManager.setNodeProgress('s5_koku01',{basicClear:true});
      ShakaiApp.startQuiz('s5_koku01','advanced',null,{replace:true,mode:'learn'});
      while (!QuizEngine.getState().finished) {
        const s = QuizEngine.getState(); QuizEngine.answer(document.querySelector('#quiz-root'),s.questions[s.index].answer); QuizEngine.advance();
      }
    });
    assert.ok(await page.locator('#quiz-root .station-seal.inked').isVisible());
    await page.getByRole('button',{name:'御朱印帳を開く'}).click();
    assert.equal(await page.locator('[data-book-grade]').inputValue(), '5');
    await page.locator('[data-book-grade]').selectOption('5');
    assert.equal(await page.locator('.stamp-spread .inked').count(), 1);
    await page.getByRole('button',{name:'次の見開き'}).click();
    await page.getByRole('button',{name:'前の見開き'}).click();
    assert.match(await page.locator('.stamp-spread').innerText(), /にっぽん/);
    await page.screenshot({ path: path.join(out,'atlas-book.png') });
    await page.locator('[data-book-grade]').selectOption('6');
    for (let i = 0; i < 6; i++) await page.getByRole('button',{name:'次の見開き'}).click();
    assert.ok(await page.locator('.archive-record').isVisible());
    // A station without a bank cannot be entered through the illustrated shortcut.
    await page.evaluate(() => { delete QUESTION_BANK.s6_rek01; ShakaiApp.showTab('map'); });
    await page.locator('[data-epoch="early"]').click();
    assert.equal(await page.locator('#atlas-go').isDisabled(), true);
    assert.match(await page.locator('#atlas-target').innerText(), /近日公開/);
    assert.deepEqual(errors, []);
    console.log('PASS offline atlas: 3 eras, real station locks, no save changes from previewing, arrival, quiet archive, 4 viewports, reduced motion, earned seals and book paging');
  } finally { await browser.close(); }
}
run().catch(e => { console.error(e); process.exitCode = 1; });
