const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

async function finishQuestions(page) {
  while (await page.locator('#screen-quiz.active .choice-button').count()) {
    const answer = await page.evaluate(() => {
      const quiz = QuizEngine.getState();
      return quiz.questions[quiz.index].answer;
    });
    await page.locator('[data-value="' + answer + '"]').click();
    await page.locator('[data-action="next"]').click();
  }
}

async function run() {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
      (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined)
  });
  const out = process.env.SOCIAL_SCREENSHOT_DIR || path.join(os.tmpdir(), 'social-quest-qa');
  fs.mkdirSync(out, { recursive: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('request', request => { if (/^https?:/.test(request.url())) errors.push(request.url()); });
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);

    // Put an unfinished collection goal on the map, then follow its first reachable station.
    await page.locator('[data-tab="collection"]').click();
    await page.locator('[data-goal-picker]').selectOption('m_chisui');
    await page.locator('[data-goal-map]').click();
    await page.reload();
    assert.match(await page.locator('#map-goal').innerText(), /輪中/);
    await page.locator('[data-goal-travel]').click();
    assert.match(await page.locator('#node-title').innerText(), /にっぽん/);
    await page.locator('[data-tab="map"]').click();

    // Play, retry and reload an everyday case using only normal screen controls.
    await page.locator('#open-life-btn').click();
    const cases = await page.locator('[data-life-case]').evaluateAll(buttons => buttons.map(button => button.dataset.lifeCase));
    assert.ok(cases.length >= 8);
    for (const id of cases) {
      await page.locator('[data-life-case="' + id + '"]').click();
      assert.ok(await page.locator('#life-root table tbody tr').count() >= 1);
      await page.locator('[data-life-choice="0"]').click();
      assert.ok(await page.locator('[data-life-feedback]').isVisible());
      await page.locator('[data-life-retry]').click();
      await page.locator('[data-life-choice="1"]').click();
      await page.locator('[data-life-list]').click();
    }
    await page.reload();
    assert.deepEqual(await page.evaluate(() => Object.values(SaveManager.data().lifeRecords).map(record => record.choice)), cases.map(() => 0));
    assert.equal(await page.evaluate(() => SaveManager.data().player.exp), 0);

    // Take both classroom links from the water station and return to the correct grade.
    await page.locator('#map-root [data-grade="4"]').click();
    await page.locator('[data-node-id="s4_life01"]').click();
    await page.locator('#node-connections button').filter({ hasText: 'くらしの探究' }).click();
    assert.ok(await page.locator('[data-life-feedback]').isVisible());
    await page.locator('[data-life-map]').click();
    await page.locator('[data-node-id="s4_life01"]').click();
    await page.locator('#node-connections button').filter({ hasText: '中学へ' }).click();
    await page.locator('[data-bridge-choice="0"]').click();
    assert.ok((await page.locator('.bridge-feedback').innerText()).length > 5);
    await page.locator('[data-bridge-station="s4_life01"]').click();
    await page.locator('#node-root [data-action="back"]').click();
    assert.equal(await page.locator('#map-root [aria-selected="true"]').getAttribute('data-grade'), '4');

    // A five-question batch leads to the rest of the bank, then to the next unlocked station.
    await page.locator('#map-root [data-grade="3"]').click();
    await page.locator('[data-node-id="s3_machi01"]').click();
    await page.locator('#course-limit').selectOption('5');
    await page.locator('[data-tier="basic"]').click();
    await finishQuestions(page);
    await page.locator('[data-result-goal="mastery"]').click();
    await finishQuestions(page);
    const exp = await page.evaluate(() => SaveManager.data().player.exp);
    await page.locator('[data-result-goal="station"]').click();
    assert.match(await page.locator('#node-title').innerText(), /見晴らし/);
    assert.equal(await page.evaluate(() => SaveManager.data().player.exp), exp);
    // Complete an actual museum goal; its map link should focus the exact card.
    const firstPrize = 'm_chikyugi';
    await page.locator('[data-tab="collection"]').click();
    await page.locator('[data-goal-picker]').selectOption(firstPrize);
    await page.locator('[data-goal-map]').click();
    await page.locator('[data-goal-travel]').click();
    await page.locator('[data-tier="basic"]').click();
    await finishQuestions(page);
    await page.locator('[data-tab="map"]').click();
    await page.getByRole('button', { name: '資料館で見る' }).click();
    assert.equal(await page.evaluate(() => document.activeElement.dataset.id), firstPrize);
    assert.equal(await page.locator('.quiz-reward').count(), 0);

    for (const width of [390, 768, 1280]) {
      await page.setViewportSize({ width, height: 860 });
      await page.locator('[data-tab="map"]').click();
      await page.locator('#open-life-btn').click();
      await page.screenshot({ path: path.join(out, 'life-list-' + width + '.png'), fullPage: true });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.locator('[data-life-case="life_apple_shop"]').click();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    }
    assert.deepEqual(errors, []);
    console.log('PASS collection goal, locked route, eight everyday decisions and retries, saved first choices, dual station links, short-course continuation, three widths and offline file loading');
  } finally {
    await browser.close();
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
