// Worker launcher for a single process slice of users
// Requires ts-node/register to import TypeScript test module directly

try { require('ts-node/register'); } catch {}

(async () => {
  try {
    const mode = process.env.WORK_MODE || 'load';
    const mod = mode === 'three'
      ? require('../tests/playwright/wopi-3users.spec.ts')
      : require('../tests/playwright/wopi-load.spec.ts');
    let results;
    if (mod.runWopiLoadTest) {
      results = await mod.runWopiLoadTest();
    } else if (mod.runThreeUsersHeadful) {
      const filename = process.env.WOPI_TEST_FILENAME || 'New Microsoft Excel Worksheet.xlsx';
      const { screenshots } = await mod.runThreeUsersHeadful(filename);
      results = screenshots.map((s) => ({ userId: s, ok: true }));
    } else {
      throw new Error('No runnable function exported');
    }
    if (typeof process.send === 'function') {
      try { process.send({ results }); } catch {}
    }
    console.log(JSON.stringify({ results }));
    process.exit(0);
  } catch (e) {
    console.error('worker error:', e);
    const payload = { results: [], error: String(e && e.message || e) };
    if (typeof process.send === 'function') {
      try { process.send(payload); } catch {}
    }
    console.log(JSON.stringify(payload));
    process.exit(1);
  }
})();
