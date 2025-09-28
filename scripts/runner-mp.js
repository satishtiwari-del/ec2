// Multi-process Playwright runner for WOPI load tests
// Spawns N worker processes; each worker runs a slice of TOTAL_USERS
// Environment variables control browser pool and behavior.
// Usage:
//   node scripts/runner-mp.js --total 1000 --workers 10 --perWorker 100 \
//        --pool 4 --contexts 2 --pages 1 --ramp 600 --ready 240000 --direct 1
//
// The worker script imports runWopiLoadTest() from tests/playwright/wopi-load.spec.ts
// and returns JSON results via stdout.

const { fork } = require('child_process');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : '1';
      out[key] = val;
    }
  }
  return out;
}

async function main() {
  console.log('Starting runner-mp.js');
  const argv = parseArgs();
  const TOTAL = Number(argv.total || process.env.WOPI_TOTAL_USERS || 1);
  const WORKERS = Number(argv.workers || 1);
  const PER_WORKER = Number(argv.perWorker || Math.ceil(TOTAL / WORKERS));
  const POOL = Number(argv.pool || process.env.WOPI_BROWSER_POOL_SIZE || 2);
  const CONTEXTS = Number(argv.contexts || process.env.WOPI_MAX_CONTEXTS || 2);
  const PAGES = Number(argv.pages || process.env.WOPI_PAGES_PER_CONTEXT || 1);
  const RAMP = Number(argv.ramp || process.env.WOPI_RAMP_PER_USER_MS || 500);
  const READY = Number(argv.ready || process.env.WOPI_READY_TIMEOUT_MS || 240000);
  const DIRECT = String(argv.direct || process.env.WOPI_DIRECT_IFRAME || '1');

  const workerPath = path.join(__dirname, 'runner-worker.js');

  const procs = [];
  let remaining = TOTAL;
  for (let i = 0; i < WORKERS; i++) {
    console.log(`[worker-${i + 1}] starting`);
    const take = Math.min(PER_WORKER, remaining);
    remaining -= take;
    if (take <= 0) break;

    const env = {
      ...process.env,
      WOPI_TOTAL_USERS: String(take),
      WOPI_WORKER_ID: String(i + 1),
      WOPI_BROWSER_POOL_SIZE: String(POOL),
      WOPI_MAX_CONTEXTS: String(CONTEXTS),
      WOPI_PAGES_PER_CONTEXT: String(PAGES),
      WOPI_RAMP_PER_USER_MS: String(RAMP),
      WOPI_READY_TIMEOUT_MS: String(READY),
      WOPI_DIRECT_IFRAME: DIRECT,
    };

    const child = fork(workerPath, [], { env, stdio: ['inherit', 'pipe', 'inherit', 'ipc'] });
    procs.push(child);
  }

  const all = [];
  await Promise.all(
    procs.map(
      (p, idx) =>
        new Promise((resolve) => {
          let buf = '';
          p.on('message', (msg) => {
            try {
              if (msg && Array.isArray(msg.results)) all.push(...msg.results);
            } catch {}
          });
          p.stdout.on('data', (d) => {
            process.stdout.write(`[worker-${idx + 1}] ${d}`);
            buf += d.toString('utf8');
          });
          p.on('exit', () => {
            try {
              const lastJsonStart = buf.lastIndexOf('{');
              const json = lastJsonStart >= 0 ? JSON.parse(buf.slice(lastJsonStart)) : null;
              if (json && Array.isArray(json.results)) all.push(...json.results);
            } catch {}
            resolve();
          });
        })
    )
  );

  // Aggregate simple stats
  const errors = all.filter((r) => r.error);
  const ok = all.length - errors.length;
  console.log(`\n=== Aggregate ===`);
  console.log(`Total results: ${all.length}, OK: ${ok}, ERRORS: ${errors.length}`);
  const payload = { results: all };
  if (typeof process.send === 'function') {
    try { process.send(payload); } catch {}
  }
  console.log(JSON.stringify(payload, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
