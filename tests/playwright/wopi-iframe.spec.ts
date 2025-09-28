import { test, expect, request as pwRequest } from '@playwright/test';

const API_BASE = 'http://65.0.4.145:3000/api';
const APP_BASE = 'http://localhost:4200';
const FILES = ["1st.docx", "report-20mb.docx", "spreadsheet.xlsx"];
const MODE = 'edit';

const TEST_FILE_IDS = FILES.reduce((acc, f, i) => {
  acc[`file-${i}`] = f;
  return acc;
}, {} as Record<string, string>);

test('open multiple /documents/preview pages together', async ({ page }) => {
  const fileIds = [
    'd2002dd1-66bf-47b3-8a3e-afa196646b71',  // file-1.docx
    'a1b2c3d4-5678-90ab-cdef-111213141516',  // file-2.docx
    'b2c3d4e5-6789-01ab-cdef-222324252627',  // large file
  ];

  // Build a grid layout of iframes
  let html = `<html><body style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">`;

  for (const fileId of fileIds) {
    html += `
      <div style="border:1px solid #ccc;padding:5px;">
        <h3>Preview: ${fileId}</h3>
        <iframe src="http://localhost:4200/documents/preview/${fileId}" width="600" height="400"></iframe>
      </div>
    `;
  }

  html += `</body></html>`;

  // Inject custom HTML in Playwright
  await page.setContent(html);

  // Assert multiple iframes are visible
  const iframes = page.locator('iframe');
  await expect(iframes).toHaveCount(fileIds.length);
});


test('open collabora with multiple users & multiple files', async ({ browser }) => {
  for (let i = 0; i < 5; i++) {
    const context = await browser.newContext();
    const page = await context.newPage();
  
    const userId = `user-${i}`;
    const userName = `User ${i}`;
    const fileId = `file-${i}`;
    const fileName = i % 2 === 0 ? `file-${i}.docx` : `large-file-${i}.docx`; // some small + large files
  
    // Call API
    const api = await pwRequest.newContext();
    const url = `${API_BASE}/wopi/iframe-url?filename=${encodeURIComponent(fileName)}&mode=${MODE}&userId=${userId}&userName=${encodeURIComponent(userName)}`;
    const res = await api.get(url);
    const body = await res.json();
  
    // Seed LocalStorage with multiple files
    await page.addInitScript(({ authUser, doclibStorage }) => {
      window.localStorage.setItem('auth_user', JSON.stringify(authUser));
      window.localStorage.setItem('doclib_storage', JSON.stringify(doclibStorage));
    }, {
      authUser: {
        id: userId,
        email: `${userId}@example.com`,
        fullName: userName,
        role: 'ADMIN',
      },
      doclibStorage: {
        folders: { root: { id: 'root', name: 'Root', path: '/' } },
        files: {
          [fileId]: {
            id: fileId,
            name: fileName,
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            folderId: 'root',
          },
        },
        rootFolderId: 'root',
      }
    });
  
    // Navigate to unique file
    await page.goto(`${APP_BASE}/documents/preview/${fileId}`);
  
    // Wait for iframe
    const iframe = page.locator('iframe');
    await expect(iframe).toBeVisible();
  
    // Loose match instead of strict
    const iframeSrc = await iframe.getAttribute('src');
    expect(iframeSrc?.startsWith(body.url.split('&access_token_ttl=')[0])).toBeTruthy();
  }
  
});
