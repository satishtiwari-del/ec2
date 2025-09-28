import { chromium, firefox, webkit, Browser } from 'playwright';
import fs from 'fs';

type UserSpec = { id: string; browser: Browser };

async function fetchJson<T = any>(url: string, init?: any): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

async function openAndEdit(userId: string, filename: string, browser: Browser, screenshotPath: string) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const urlData: any = await fetchJson(`http://65.0.4.145:3000/api/wopi/iframe-url?filename=${encodeURIComponent(filename)}&mode=edit&userId=${encodeURIComponent(userId)}&userName=${encodeURIComponent('User ' + userId)}&ttlSec=86400`);
  await page.goto('http://65.0.4.145:3000/iframe-host');
  await page.evaluate((u) => { const i = document.getElementById('c') as HTMLIFrameElement; i.src = u; }, urlData.url);
  const frame = await (await page.waitForSelector('#c')).contentFrame();
  if (!frame) throw new Error('iframe not available');
  try { const btn = await frame.waitForSelector('#cool-accept-button', { timeout: 5000 }); await btn.click(); } catch {}
  try { const closeX = await frame.waitForSelector('button[aria-label="Close"],button[title="Close"]', { timeout: 1500 }); await closeX.click(); } catch {}
  try { await frame.page().keyboard.press('Escape'); } catch {}
  await frame.waitForSelector('canvas', { timeout: 120000 });
  try {
    await frame.waitForFunction(() => {
      const cvs = Array.from(document.querySelectorAll('canvas')) as HTMLCanvasElement[];
      return cvs.length > 0 && cvs.some(c => c.width > 0 && c.height > 0);
    }, { timeout: 60000 });
  } catch {}
  // Click and type values 1,2,3 then SUM in next cell
  const bar = frame.locator('#inputbar');
  const barVisible = await bar.isVisible().catch(() => false);
  if (barVisible) {
    await bar.click({ timeout: 2000 }).catch(async () => { await frame.page().keyboard.press('Escape'); await bar.click().catch(() => {}); });
    await bar.fill('1'); await frame.page().keyboard.press('Enter');
    await bar.fill('2'); await frame.page().keyboard.press('Enter');
    await bar.fill('3'); await frame.page().keyboard.press('Enter');
    await bar.fill('=SUM(A1:A3)'); await frame.page().keyboard.press('Enter');
  } else {
    await frame.click('canvas', { position: { x: 40, y: 40 } });
    await frame.page().keyboard.type('1'); await frame.page().keyboard.press('Enter');
    await frame.page().keyboard.type('2'); await frame.page().keyboard.press('Enter');
    await frame.page().keyboard.type('3'); await frame.page().keyboard.press('Enter');
    await frame.page().keyboard.type('=SUM(A1:A3)'); await frame.page().keyboard.press('Enter');
  }
  // wait and capture grid plus formula bar
  await page.waitForTimeout(1200);
  try {
    const map = frame.locator('#map');
    await map.screenshot({ path: screenshotPath });
  } catch {
    try { const iframeEl = await page.waitForSelector('#c'); await iframeEl.screenshot({ path: screenshotPath }); }
    catch { const canvas = frame.locator('canvas').first(); await canvas.screenshot({ path: screenshotPath }); }
  }
  await context.close();
}

export async function runThreeUsersHeadful(filename: string): Promise<{ screenshots: string[] }> {
  const b1 = await chromium.launch({ headless: false });
  const b2 = await firefox.launch({ headless: false });
  const b3 = await webkit.launch({ headless: false });
  // ensure screenshots directory exists
  try { fs.mkdirSync('screenshots', { recursive: true }); } catch {}
  const shots: string[] = [];
  try {
    await openAndEdit('u1', filename, b1, 'screenshots/screenshot-u1.png'); shots.push('screenshots/screenshot-u1.png');
    await openAndEdit('u2', filename, b2, 'screenshots/screenshot-u2.png'); shots.push('screenshots/screenshot-u2.png');
    await openAndEdit('u3', filename, b3, 'screenshots/screenshot-u3.png'); shots.push('screenshots/screenshot-u3.png');
  } finally {
    await Promise.all([b1.close(), b2.close(), b3.close()]);
  }
  return { screenshots: shots };
}


