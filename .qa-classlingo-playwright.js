const { chromium } = require('playwright');

const base = process.env.QA_BASE || 'http://127.0.0.1:8790';
const passcode = 'qa-test';

async function route(page, path, name, size) {
  await page.setViewportSize(size);
  const errors = [];
  page.on('console', msg => {
    if (['error', 'warning'].includes(msg.type())) errors.push(`${msg.type()}: ${msg.text()}`);
  });
  await page.goto(base + path, { waitUntil: 'domcontentloaded' });
  await page.screenshot({ path: `.qa/${name}-${size.width}.png`, fullPage: true });
  return await page.evaluate(() => ({
    title: document.title,
    url: location.href,
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    h1: document.querySelector('h1')?.innerText || '',
    text: document.body.innerText.slice(0, 500),
    staleHits: [...document.body.innerText.matchAll(/kindergarten|any classroom|any subject|nothing stored|teacher@school|kids view/gi)].map(m => m[0]),
    perf: performance.getEntriesByType('navigation')[0] ? {
      domContentLoaded: Math.round(performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd),
      load: Math.round(performance.getEntriesByType('navigation')[0].loadEventEnd),
      transfer: Math.round(performance.getEntriesByType('navigation')[0].transferSize || 0),
    } : null,
  })).then(data => ({ name, path, size, errors, ...data }));
}

async function apiJson(method, path, body, auth = false) {
  const headers = { 'content-type': 'application/json' };
  if (auth) headers.authorization = `Bearer ${passcode}`;
  const res = await fetch(base + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (_) {}
  return { status: res.status, json, text };
}

async function getMaybeJson(path) {
  const res = await fetch(base + path);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (_) {}
  return { status: res.status, json, text: json ? undefined : text.slice(0, 300) };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const report = { routes: [], workflow: {}, api: {}, notes: [] };

  const desktop = { width: 1440, height: 1000 };
  const mobile = { width: 390, height: 844 };
  for (const path of ['/', '/teacher', '/teach', '/student', '/dispatch', '/admin', '/kids?c=QA123']) {
    const name = path === '/' ? 'home' : path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
    for (const size of [desktop, mobile]) {
      const page = await browser.newPage();
      report.routes.push(await route(page, path, name, size));
      await page.close();
    }
  }

  report.api.goodPass = await apiJson('POST', '/api/session', { action: 'check', passcode });
  const newClass = await apiJson('POST', '/api/session', { action: 'new' }, true);
  const code = newClass.json && newClass.json.code;
  report.api.newClass = newClass;
  report.api.mode = await apiJson('POST', '/api/session', { action: 'mode', mode: 'trades', terms: ['stud', 'guardrail'] }, true);
  report.api.message = await apiJson('POST', '/api/message', { text: 'Install guardrails before working near the open edge.', c: code }, true);
  report.api.poll = await getMaybeJson(`/api/poll?since=0&lang=English&c=${encodeURIComponent(code)}&sid=qa-headless&n=QA&hb=1`);
  report.api.status = await getMaybeJson('/api/status');
  report.api.dispatchRegister = await apiJson('POST', '/api/dispatch/register', { code: 'QA01', workerId: 'qa-worker', name: 'QA Worker', lang: 'English' });
  report.api.dispatchRoster = await getMaybeJson('/api/dispatch/roster?code=QA01');
  report.api.dispatchSend = await apiJson('POST', '/api/dispatch/send', { code: 'QA01', text: 'Meet at the south gate.', target: 'all', passcode }, false);
  report.api.dispatchWorkerPoll = await getMaybeJson('/api/dispatch/poll?code=QA01&workerId=qa-worker&lang=English&since=0');
  report.api.dispatchRespond = await apiJson('POST', '/api/dispatch/respond', { code: 'QA01', workerId: 'qa-worker', name: 'QA Worker', response: 'Got it' });
  report.api.dispatchDispatcherPoll = await getMaybeJson('/api/dispatch/poll?code=QA01&since=0');

  const teach = await browser.newPage();
  await teach.goto(base + '/teach', { waitUntil: 'domcontentloaded' });
  await teach.fill('#passcode-input', passcode);
  await teach.click('#passcode-submit');
  await teach.waitForTimeout(500);
  report.workflow.teacherUnlocked = await teach.evaluate(() => ({
    visibleText: document.body.innerText.slice(0, 1200),
    manualVisible: !!document.querySelector('#manual-text') && getComputedStyle(document.querySelector('#manual-text')).display !== 'none',
    code: (() => { try { return new URL(document.querySelector('#student-url')?.innerText || '', location.href).searchParams.get('c') || ''; } catch (_) { return ''; } })(),
    share: document.querySelector('#student-url')?.innerText || '',
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }));
  await teach.screenshot({ path: '.qa/workflow-teacher.png', fullPage: true });
  await teach.setViewportSize(mobile);
  await teach.waitForTimeout(250);
  report.workflow.teacherMobile = await teach.evaluate(() => ({
    visibleText: document.body.innerText.slice(0, 1200),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  await teach.screenshot({ path: '.qa/workflow-teacher-390.png', fullPage: true });
  await teach.close();

  const studentContext = await browser.newContext();
  const student = await studentContext.newPage();
  const studentErrors = [];
  student.on('console', msg => {
    if (['error', 'warning'].includes(msg.type())) studentErrors.push(`${msg.type()}: ${msg.text()}`);
  });
  await student.goto(`${base}/student?c=${encodeURIComponent(code)}`, { waitUntil: 'domcontentloaded' });
  await student.evaluate(() => {
    const english = [...document.querySelectorAll('button.lang-tile')].find(btn => btn.innerText.includes('English'));
    english?.click();
  });
  await student.waitForFunction(() => !document.querySelector('#join-btn')?.disabled, null, { timeout: 5000 });
  await student.evaluate(() => document.querySelector('#join-btn')?.click());
  try {
    await student.waitForFunction(() => (document.querySelector('#feed')?.innerText || '').includes('guardrails'), null, { timeout: 7000 });
  } catch (_) {}
  report.workflow.studentJoined = await student.evaluate(() => ({
    visibleText: document.body.innerText.slice(0, 1600),
    liveVisible: !document.querySelector('#screen-live')?.classList.contains('hidden'),
    feedText: document.querySelector('#feed')?.innerText || '',
    feedHtml: document.querySelector('#feed')?.innerHTML.slice(0, 800) || '',
    joinHidden: document.querySelector('#screen-join')?.classList.contains('hidden'),
    status: document.querySelector('#live-status')?.innerText || document.querySelector('#status-label')?.innerText || '',
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  })).then(data => ({ ...data, errors: studentErrors }));
  await student.screenshot({ path: '.qa/workflow-student.png', fullPage: true });
  await student.setViewportSize(mobile);
  await student.waitForTimeout(250);
  report.workflow.studentMobile = await student.evaluate(() => ({
    feedText: document.querySelector('#feed')?.innerText || '',
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  await student.screenshot({ path: '.qa/workflow-student-390.png', fullPage: true });
  await student.click('#open-study');
  report.workflow.studentStudy = await student.evaluate(() => ({
    visible: !document.querySelector('#screen-study')?.classList.contains('hidden'),
    heading: document.querySelector('#screen-study .display')?.innerText || '',
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    cards: document.querySelectorAll('#screen-study .retro-card').length,
  }));
  await student.screenshot({ path: '.qa/workflow-student-study-390.png' });
  await studentContext.close();

  await browser.close();
  console.log(JSON.stringify(report, null, 2));
})().catch(err => {
  console.error(err);
  process.exit(1);
});
