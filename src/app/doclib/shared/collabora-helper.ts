// Collabora helper usable from both browser (Angular) and tests (Playwright via eval)
// All functions are written to be resilient if certain selectors are missing

export type SpreadsheetRandoms = {
  randA: number;
  randB: number;
  randC: number;
  randD: number;
  sum: number;
};

function isHTMLElementVisible(el: Element | null): boolean {
  if (!el || !(el as HTMLElement).getBoundingClientRect) return false;
  const rect = (el as HTMLElement).getBoundingClientRect();
  return !!(rect.width || rect.height);
}

export async function tryCloseWelcomeOverlay(win: Window): Promise<void> {
  try {
    const doc = win.document;
    const overlay = doc.querySelector(
      'div.iframe-welcome-wrap, div.iframe-welcome-content, [class*="iframe-welcome"]'
    ) as HTMLElement | null;
    if (!overlay || !isHTMLElementVisible(overlay)) return;

    const closeBtn = overlay.querySelector('button[title="Close"]') as HTMLElement | null;
    if (closeBtn) {
      closeBtn.click();
    } else {
      const closeTextEl = Array.from(overlay.querySelectorAll('*')).find((n) =>
        (n.textContent || '').trim().toLowerCase() === 'close'
      ) as HTMLElement | null;
      if (closeTextEl) {
        closeTextEl.click();
      } else {
        // Fallback to Escape
        const ev = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
        overlay.dispatchEvent(ev);
      }
    }

    // Wait until overlay is detached
    const start = Date.now();
    while (Date.now() - start < 5000) {
      const still = doc.querySelector(
        'div.iframe-welcome-wrap, div.iframe-welcome-content, [class*="iframe-welcome"]'
      );
      if (!still || !isHTMLElementVisible(still)) break;
      await new Promise((r) => setTimeout(r, 100));
    }
    await new Promise((r) => setTimeout(r, 500));
  } catch {
    // ignore
  }
}

export async function waitSpreadsheetReadyAndFocusA1(win: Window): Promise<void> {
  const doc = win.document;
  // Prefer #map, else canvas
  const start = Date.now();
  while (Date.now() - start < 60000) {
    const map = doc.querySelector('#map') as HTMLElement | null;
    const canv = doc.querySelector('canvas') as HTMLElement | null;
    if ((map && isHTMLElementVisible(map)) || (canv && isHTMLElementVisible(canv))) {
      const target = (map || canv) as HTMLElement;
      const rect = target.getBoundingClientRect();
      const clickX = Math.max(5, Math.min(rect.width - 5, 50));
      const clickY = Math.max(5, Math.min(rect.height - 5, 50));
      const evt = new MouseEvent('mousedown', {
        bubbles: true,
        clientX: rect.left + clickX,
        clientY: rect.top + clickY,
      });
      target.dispatchEvent(evt);
      const up = new MouseEvent('mouseup', {
        bubbles: true,
        clientX: rect.left + clickX,
        clientY: rect.top + clickY,
      });
      target.dispatchEvent(up);
      const click = new MouseEvent('click', {
        bubbles: true,
        clientX: rect.left + clickX,
        clientY: rect.top + clickY,
      });
      target.dispatchEvent(click);
      return;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
}

export function generateRandoms(): SpreadsheetRandoms {
  const randA = Math.floor(Math.random() * 91) + 10;
  const randB = Math.floor(Math.random() * 91) + 10;
  const randC = Math.floor(Math.random() * 91) + 10;
  const randD = Math.floor(Math.random() * 91) + 10;
  const sum = randA + randB + randC + randD;
  return { randA, randB, randC, randD, sum };
}

export async function typeValuesAndSum(win: Window, values: SpreadsheetRandoms): Promise<void> {
  // We cannot synthesize real key presses easily from Angular; this function
  // is mainly to be executed inside the iframe context where keyboard events are handled.
  // It attempts to dispatch key events; in Playwright tests we will prefer frame.keyboard.
  const sendKeys = async (seq: string[]) => {
    for (const s of seq) {
      for (const ch of s.split('')) {
        const ev = new KeyboardEvent('keydown', { key: ch, bubbles: true });
        win.document.dispatchEvent(ev);
        await new Promise((r) => setTimeout(r, 10));
      }
    }
  };

  await sendKeys([String(values.randA)]);
  win.document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await new Promise((r) => setTimeout(r, 50));
  await sendKeys([String(values.randB)]);
  win.document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await new Promise((r) => setTimeout(r, 50));
  await sendKeys([String(values.randC)]);
  win.document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await new Promise((r) => setTimeout(r, 50));
  await sendKeys([String(values.randD)]);
  win.document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await new Promise((r) => setTimeout(r, 50));
  await sendKeys(['=SUM(A1:A4)']);
  win.document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
}

export function readA5DisplayedValue(win: Window): string | null {
  // Best-effort: try formula bar first, then status bar; fallback null
  const doc = win.document;
  const formula = doc.querySelector('#inputbar' ) as HTMLInputElement | null;
  if (formula && typeof (formula as any).value === 'string') {
    return (formula as any).value as string;
  }
  const twoLine = doc.querySelector('#twolines' ) as HTMLInputElement | null;
  if (twoLine && typeof (twoLine as any).value === 'string') {
    return (twoLine as any).value as string;
  }
  const status = doc.querySelector('[role="status"], .statusbar') as HTMLElement | null;
  if (status && status.textContent) {
    return status.textContent.trim();
  }
  return null;
}

export function parseNumeric(value: string | null): number | null {
  if (!value) return null;
  const match = value.replace(/[,\s]/g, '').match(/[-+]?[0-9]*\.?[0-9]+/);
  if (!match) return null;
  return Number(match[0]);
}


