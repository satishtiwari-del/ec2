import { chromium, Browser, Page, Frame } from 'playwright';
import fs from 'fs';
import path from 'path';

type Result = { userId: string; ok: boolean; error?: string };

function envNumber(name: string, def: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : def;
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function fetchJson<T = any>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

async function postJson<T = any>(url: string): Promise<T> {
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

function ensureScreenshotsDir() {
  try { fs.mkdirSync(path.join(process.cwd(), 'screenshots'), { recursive: true }); } catch {}
}

function uniqueFilename(userId: string, seq: number) {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `New Microsoft Excel Worksheet-${userId}-file-${seq}-${ts}-${rand}.xlsx`;
}

async function openCollabora(page: Page, filename: string, userId: string) {
  const userName = `User ${userId}`;
  const url = `http://65.0.4.145:3000/api/wopi/iframe-url?filename=${encodeURIComponent(filename)}&mode=edit&userId=${encodeURIComponent(userId)}&userName=${encodeURIComponent(userName)}&ttlSec=86400`;
  // retry fetch a couple of times in case LB/backends are starting up
  let data: any;
  let lastErr: any;
  for (let i = 0; i < 3; i++) {
    try { data = await fetchJson(url); break; } catch (e) { lastErr = e; await sleep(500 + 500 * i); }
  }
  if (!data) throw lastErr || new Error('failed to fetch iframe-url');
  await page.goto('http://65.0.4.145:3000/iframe-host');
  await page.evaluate((u) => { const i = document.getElementById('c') as HTMLIFrameElement; i.src = u; }, data.url);
  const frameHandle = await page.waitForSelector('#c');
  const frame = await frameHandle.contentFrame();
  if (!frame) throw new Error('iframe not available');
  // Close welcome/license prompts if present (multiple strategies)
  try { const btn = await frame.waitForSelector('#cool-accept-button', { timeout: 6000 }); await btn.click(); } catch {}
  try { const closeX = await frame.waitForSelector('button[aria-label="Close"],button[title="Close"]', { timeout: 2000 }); await closeX.click(); } catch {}
  try { await frame.locator('button:has-text("Got it"), button:has-text("Accept"), button:has-text("OK"), button:has-text("Close")').first().click({ timeout: 2000 }); } catch {}
  for (let i = 0; i < 3; i++) { try { await frame.page().keyboard.press('Escape'); } catch {} }
  // wait for editor to attach (LOLeaflet or COOL)
  try {
    await frame.waitForSelector('#map canvas', { timeout: 60000, state: 'attached' });
  } catch {
    await frame.waitForSelector('canvas', { timeout: 60000, state: 'attached' });
  }
  // ensure canvas has size
  try {
    await frame.waitForFunction(() => {
      const cvs = Array.from(document.querySelectorAll('canvas')) as HTMLCanvasElement[];
      return cvs.length > 0 && cvs.some(c => c.width > 0 && c.height > 0);
    }, { timeout: 60000 });
  } catch {}
  return frame;
}

async function typeSequence(frame: Frame) {
  // Prefer formula bar; fallback to direct grid typing
  const bar = frame.locator('#inputbar');
  const barVisible = await bar.isVisible().catch(() => false);
  if (barVisible) {
    await bar.click({ timeout: 2000 }).catch(async () => { await frame.page().keyboard.press('Escape'); await bar.click().catch(() => {}); });
    await bar.fill('1'); await frame.page().keyboard.press('Enter');
    await bar.fill('2'); await frame.page().keyboard.press('Enter');
    await bar.fill('3'); await frame.page().keyboard.press('Enter');
    await bar.fill('=SUM(A1:A3)'); await frame.page().keyboard.press('Enter');
    return;
  }
  // Fallback: click A1 and type
  for (let i = 0; i < 3; i++) {
    try { await frame.click('#map canvas', { position: { x: 40, y: 40 } }); break; } catch { try { await frame.click('canvas', { position: { x: 40, y: 40 } }); break; } catch {} await sleep(400); }
  }
  await frame.page().keyboard.type('1');
  await frame.page().keyboard.press('Enter');
  await frame.page().keyboard.type('2');
  await frame.page().keyboard.press('Enter');
  await frame.page().keyboard.type('3');
  await frame.page().keyboard.press('Enter');
  await frame.page().keyboard.type('=SUM(A1:A3)');
  await frame.page().keyboard.press('Enter');
}

export async function runWopiLoadTest(): Promise<Result[]> {
  const total = envNumber('WOPI_TOTAL_USERS', 10);
  const pool = envNumber('WOPI_BROWSER_POOL_SIZE', 2);
  const ramp = envNumber('WOPI_RAMP_PER_USER_MS', 200);
  ensureScreenshotsDir();

  const browsers: Browser[] = [];
  for (let i = 0; i < pool; i++) browsers.push(await chromium.launch());

  const results: Result[] = [];
  const tasks: Promise<void>[] = [];

  for (let i = 0; i < total; i++) {
    const idx = i;
    const b = browsers[idx % pool];
    tasks.push((async () => {
      const userId = `u-${(process.env['WOPI_WORKER_ID'] || '1')}-${idx + 1}`;
      try {
        const ctx = await b.newContext({ deviceScaleFactor: 2 });
        const page = await ctx.newPage();
        // create a unique file per user and open it
        const filename = uniqueFilename(userId, idx + 1);
        try { await postJson(`http://43.204.32.60:3000/api/documents/upload?filename=${encodeURIComponent(filename)}`); } catch {}
        const frame = await openCollabora(page, filename, userId);
        // Close welcome when present
        try { const btn = await frame.waitForSelector('#cool-accept-button', { timeout: 3000 }); await btn.click(); } catch {}
        await typeSequence(frame);
        // verify formula bar shows SUM
        let ok = true;
        try {
          const formula = await frame.locator('#inputbar').inputValue({ timeout: 3000 }).catch(async () => {
            return (await frame.locator('#inputbar').textContent({ timeout: 3000 })) || '';
          });
          ok = /SUM\(A1:A3\)/i.test(String(formula || ''));
        } catch {}
        // screenshot per user (prioritize map/grid, also capture formula bar)
        const ts = Date.now();
        const shotName = `user-${userId}-${ts}.png`;
        const shotPath = path.join(process.cwd(), 'screenshots', shotName);
        const barPath = path.join(process.cwd(), 'screenshots', `user-${userId}-${ts}-bar.png`);
        try {
          await sleep(800);
          const map = frame.locator('#map');
          await map.screenshot({ path: shotPath });
        } catch {
          try { const iframeEl = await page.waitForSelector('#c'); await iframeEl.screenshot({ path: shotPath }); }
          catch { try { const canvas = frame.locator('canvas').first(); await canvas.screenshot({ path: shotPath }); } catch {} }
        }
        // capture formula bar as secondary evidence
        try { await frame.locator('#inputbar').screenshot({ path: barPath }); } catch {}
        await ctx.close();
        results.push({ userId, ok });
      } catch (e: any) {
        results.push({ userId, ok: false, error: String(e && e.message || e) });
      }
    })());
    await sleep(ramp);
  }

  await Promise.all(tasks);
  await Promise.all(browsers.map((b) => b.close()));
  return results;
}


