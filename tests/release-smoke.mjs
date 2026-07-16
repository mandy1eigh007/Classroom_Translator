import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = (process.env.BASE_URL || 'http://127.0.0.1:8788').replace(/\/$/, '');
const requireBackendConfig = process.env.REQUIRE_BACKEND_CONFIG === '1';
const results = [];

async function request(path, options = {}) {
  const response = await fetch(baseUrl + path, { redirect: 'follow', ...options });
  const body = await response.text();
  return { response, body };
}

function record(name, detail = 'ok') {
  results.push({ name, detail });
}

async function expectPage(path, marker, minimumBytes = 1_000) {
  const { response, body } = await request(path);
  assert.equal(response.status, 200, `${path} returned ${response.status}`);
  assert.match(response.headers.get('content-type') || '', /text\/html/i, `${path} is not HTML`);
  assert.ok(body.length > minimumBytes, `${path} returned an unexpectedly small document`);
  assert.ok(body.includes(marker), `${path} is missing ${marker}`);
  record(`page ${path}`, `${body.length} bytes`);
}

async function expectAsset(path, contentType, minimumBytes) {
  const { response, body } = await request(path);
  assert.equal(response.status, 200, `${path} returned ${response.status}`);
  assert.match(response.headers.get('content-type') || '', contentType, `${path} has the wrong content type`);
  assert.ok(body.length >= minimumBytes, `${path} is unexpectedly small`);
  record(`asset ${path}`, `${body.length} bytes`);
}

async function expectJson(path, check) {
  const { response, body } = await request(path);
  assert.equal(response.status, 200, `${path} returned ${response.status}: ${body.slice(0, 200)}`);
  assert.match(response.headers.get('content-type') || '', /application\/json/i, `${path} is not JSON`);
  const value = JSON.parse(body);
  check(value);
  record(`api ${path}`);
  return value;
}

async function expectStatus(name, path, expected, options = {}) {
  const { response, body } = await request(path, options);
  const allowed = Array.isArray(expected) ? expected : [expected];
  assert.ok(allowed.includes(response.status), `${path} should return ${allowed.join(' or ')}, got ${response.status}: ${body.slice(0, 160)}`);
  record(name, String(response.status));
}

async function run() {
  const pages = [
    ['/', 'ClassLingo'],
    ['/student', 'screen-join'],
    ['/teacher', 'id="app"'],
    ['/teach', 'id="main-ui"'],
    ['/dispatch', 'dispatch'],
    ['/admin', 'ClassLingo'],
    ['/reset-password.html', 'Secure account recovery'],
    ['/help.html', 'ClassLingo field guide'],
    ['/kids?c=RELEASE', 'Redirecting to ClassLingo learner view', 100],
  ];
  for (const [path, marker, minimumBytes] of pages) await expectPage(path, marker, minimumBytes);

  const landing = await request('/');
  assert.match(landing.body, /href="\/admin\.html"/, 'landing page is missing the admin link');
  record('landing admin link', '/admin.html');

  const adminPage = await request('/admin.html');
  assert.match(adminPage.body, /resetPasswordForEmail/, 'admin sign-in is missing password recovery');
  assert.match(adminPage.body, /\/reset-password\.html/, 'admin recovery is missing its production path');
  record('admin password recovery', '/reset-password.html');
  assert.match(adminPage.body, /data-tab="vocabulary"/, 'admin is missing vocabulary control');
  assert.match(adminPage.body, /data-tab="ai-review"/, 'admin is missing AI review control');
  assert.match(adminPage.body, /data-tab="video-mining"/, 'admin is missing video mining control');
  assert.match(adminPage.body, /id="vocab-rows"/, 'admin vocabulary table is missing');
  assert.match(adminPage.body, /id="ai-rows"/, 'admin AI review table is missing');
  assert.match(adminPage.body, /id="mine-review-rows"/, 'admin video mining review queue is missing');
  assert.match(adminPage.body, /3 independent sources and 90% confidence/, 'admin video mining guardrail is missing');
  record('admin control hub', 'vocabulary + AI review + video mining');

  await expectAsset('/site-rollout.css', /text\/css/i, 1_000);
  await expectAsset('/assets/teacher-blueprint-bg.jpg', /image\/jpeg/i, 10_000);
  await expectAsset('/supabase-config.js', /javascript|text\/plain/i, 100);

  const session = await expectJson('/api/session', value => {
    assert.match(value.code || '', /^[A-Z0-9]{6,12}$/);
    assert.equal(value.active, true);
    assert.equal(typeof value.caps?.phrasebookSync, 'boolean');
  });
  await expectJson('/api/status', value => {
    assert.equal(typeof value.students, 'number');
    assert.equal(value.code, session.code);
  });
  await expectJson('/api/document', value => assert.ok(Object.hasOwn(value, 'docId')));
  await expectJson('/api/video', value => assert.ok(Object.hasOwn(value, 'videoId')));
  await expectJson(`/api/poll?since=0&lang=English&c=${encodeURIComponent(session.code)}&sid=release-readonly`, value => {
    assert.equal(value.active, true);
    assert.ok(Array.isArray(value.messages));
  });
  await expectJson('/api/phrasebook/RELEASESMOKE', value => assert.ok(Array.isArray(value.items)));

  const invalidChecks = [
    ['/api/poll?lang=NotALanguage', 400],
    ['/api/phrasebook/ab', 400],
    ['/api/dispatch/roster', 400],
  ];
  for (const [path, expected] of invalidChecks) {
    await expectStatus(`validation ${path}`, path, expected);
  }

  const jsonPost = body => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  await expectStatus('validation /api/translate', '/api/translate', 400, jsonPost({}));
  await expectStatus('validation /api/define', '/api/define', 400, jsonPost({}));
  await expectStatus('validation /api/i18n', '/api/i18n', 410, jsonPost({}));
  await expectStatus('validation /api/studysheet', '/api/studysheet?lang=NotALanguage', 400);

  const legacyAuthStatus = requireBackendConfig ? [401] : [401, 503];
  await expectStatus('protected write /api/message', '/api/message', legacyAuthStatus, jsonPost({ text: 'release-readonly' }));
  await expectStatus('protected write /api/dispatch/send', '/api/dispatch/send', legacyAuthStatus, jsonPost({ code: 'RELEASE', text: 'release-readonly' }));

  for (const path of ['/api/teacher', '/api/teacher/classes', '/api/teacher/students', '/api/teacher/materials', '/api/teacher/sessions', '/api/teacher/vocab']) {
    const { response, body } = await request(path);
    const allowed = requireBackendConfig ? [401] : [401, 503];
    assert.ok(allowed.includes(response.status), `${path} should reject anonymous access, got ${response.status}: ${body.slice(0, 160)}`);
    record(`protected ${path}`, String(response.status));
  }
  await expectStatus('protected /api/admin/video-mining', '/api/admin/video-mining', requireBackendConfig ? [401] : [401, 503]);
  await expectStatus('protected scheduled video mining', '/api/admin/video-mining-scheduled', [401, 503], { method: 'POST' });

  await expectStatus('cors /api/teacher', '/api/teacher', 204, { method: 'OPTIONS' });

  const { response: methodResponse } = await request('/api/session', { method: 'DELETE' });
  assert.equal(methodResponse.status, 405, '/api/session should reject DELETE');
  record('method guard /api/session', '405');

  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }]) {
      for (const [path] of pages) {
      const page = await browser.newPage({ viewport });
      const errors = [];
      const loadFailures = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('response', response => {
        if (response.url().startsWith(baseUrl) && response.status() >= 400) {
          loadFailures.push(`${response.status()} ${response.url()}`);
        }
      });
      await page.goto(baseUrl + path, { waitUntil: 'domcontentloaded' });
      const audit = await page.evaluate(() => {
        const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
        const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
        const unnamedButtons = [...document.querySelectorAll('button')].filter(button => {
          if (getComputedStyle(button).display === 'none') return false;
          return !(button.innerText.trim() || button.getAttribute('aria-label') || button.getAttribute('title'));
        }).length;
        return {
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          duplicates,
          unnamedButtons,
          imagesMissingAlt: document.querySelectorAll('img:not([alt])').length,
        };
      });
      assert.equal(audit.overflow, false, `${path} has horizontal overflow at ${viewport.width}px`);
      assert.deepEqual(audit.duplicates, [], `${path} has duplicate ids: ${audit.duplicates.join(', ')}`);
      assert.equal(audit.unnamedButtons, 0, `${path} has visible unnamed buttons`);
      assert.equal(audit.imagesMissingAlt, 0, `${path} has images without alt attributes`);
      assert.deepEqual(errors, [], `${path} raised browser errors: ${errors.join('; ')}`);
      assert.deepEqual(loadFailures, [], `${path} had failed same-origin loads: ${loadFailures.join('; ')}`);
      await page.close();
      record(`responsive ${path}`, `${viewport.width}x${viewport.height} + accessibility`);
      }
    }

    const helpPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await helpPage.goto(baseUrl + '/help.html', { waitUntil: 'domcontentloaded' });
    await helpPage.fill('#guide-search', 'Import Roster');
    const filteredHelp = await helpPage.evaluate(() => ({
      status: document.querySelector('#search-status').textContent.trim(),
      visibleSections: [...document.querySelectorAll('.guide-section')].filter(section => !section.hidden).map(section => section.id),
      visibleRows: [...document.querySelectorAll('.guide-row')].filter(row => !row.hidden).map(row => row.textContent.trim()),
    }));
    assert.equal(filteredHelp.status, '1 match for "Import Roster"');
    assert.deepEqual(filteredHelp.visibleSections, ['teacher']);
    assert.equal(filteredHelp.visibleRows.length, 1);
    assert.match(filteredHelp.visibleRows[0], /Import Roster/);
    await helpPage.click('#search-clear');
    const restoredHelpRows = await helpPage.locator('.guide-row:not([hidden])').count();
    assert.equal(restoredHelpRows, 64);
    await helpPage.close();
    record('help search', 'Import Roster filter + clear');
  } finally {
    await browser.close();
  }

  console.log(`Release smoke passed against ${baseUrl}: ${results.length} checks`);
  for (const result of results) console.log(`PASS  ${result.name}  ${result.detail}`);
}

run().catch(error => {
  console.error(`Release smoke failed against ${baseUrl}`);
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
