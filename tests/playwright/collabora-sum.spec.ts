import { test, expect, request as pwRequest } from '@playwright/test';

const API_BASE = 'http://65.0.4.145:3000/api';
const APP_BASE = 'http://localhost:4200/documents/files';

async function createExcelFile(userId: number) {
//   const ctx = await pwRequest.newContext();
//   const response = await ctx.post(`${API_BASE}/documents/upload?filename=${encodeURIComponent('user-${userId}.xlsx')}`, {
//     data: {
//       filename: `user-${userId}.xlsx`,
//       type: 'spreadsheet'
//     }
//   });
  return "b6b92e9f-09b9-4ade-a662-8e6410158240";
}

async function base64UrlEncode(input: string) {
    const base64 = btoa(unescape(encodeURIComponent(input)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

async function fetchWopiIframeUrl(fileId: string) {
  const ctx = await pwRequest.newContext();
  const wopiId = await base64UrlEncode("user-${userId}.xlsx");
  const response = await ctx.get(`${API_BASE}/wopi/files/${wopiId}`);
  const body = await response.json();
  const url = `${API_BASE}/wopi/files/${wopiId}/contents`;
  return url ;
}

async function closeWelcome(frame: any) {
  try {
    const btn = await frame.waitForSelector('#cool-accept-button', { timeout: 3000 });
    await btn.click();
  } catch {}
}

async function insertValuesAndSum(frame: any, values: number[]) {
  // Focus A1
  await frame.click('#map canvas', { position: { x: 40, y: 40 } });
  await frame.waitForTimeout(500);

  // Type values in A1..A4
  for (const v of values) {
    await frame.keyboard.type(String(v));
    await frame.keyboard.press('Enter');
  }

  // Insert SUM in A5
  await frame.keyboard.type('=SUM(A1:A4)');
  await frame.keyboard.press('Enter');
}

test('Collabora spreadsheet sum check', async ({ page }) => {
  const userId = 1;

  // 1. create file
  const fileId = await createExcelFile(userId);
  // 2. get collabora iframe url
  const iframeUrl = await fetchWopiIframeUrl(fileId);

  console.log("fileId👥👥👥👥👥=============================", fileId)
  // 3. open app page with iframe
  await page.goto(`${APP_BASE}/preview/${fileId}`);

  // set iframe src dynamically
  await page.evaluate((url) => {
    const iframe = document.querySelector('iframe')!;
    iframe.setAttribute('src', url);
  }, iframeUrl);

  // get frame object from iframe
  const iframeHandle = await page.waitForSelector('iframe');
  const frame = await iframeHandle.contentFrame();
  if (!frame) throw new Error('Collabora iframe not found');

//   await page.waitForTimeout(5000);

  // 4. close welcome popup if present
//   await closeWelcome(frame);

  // 5. insert random values + sum
  const values = Array.from({ length: 4 }, () => Math.floor(Math.random() * 100));
  await insertValuesAndSum(frame, values);

  const expected = values.reduce((a, b) => a + b, 0);
  console.log('Values:', values, 'Expected sum:', expected);

  // ✅ Verification option (formula bar text)
  const formulaBar = await frame.locator('#inputbar').inputValue();
  console.log('Formula bar content:', formulaBar);

  expect(formulaBar).toContain('SUM(A1:A4)');
});
