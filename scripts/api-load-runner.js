#!/usr/bin/env node
/**
 * API load runner for http://localhost:3000/run-loadtest
 * - Simulates N requests with optional concurrency and stagger
 * - Retries failed requests up to 2 times
 * - Logs per-request telemetry and prints a summary
 */

const http = require('http');
const https = require('https');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : '1';
      out[k] = v;
    }
  }
  return out;
}

function request(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        resolve({ status: res.statusCode, body });
      });
    });
    req.on('error', reject);
    req.setTimeout(60000, () => {
      req.destroy(new Error('timeout'));
    });
  });
}

async function withRetry(fn, retries = 2) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (attempt < retries) await new Promise((r) => setTimeout(r, 200 + 400 * attempt));
    }
  }
  throw lastErr;
}

async function run() {
  const argv = parseArgs();
  const TOTAL = Number(argv.total || 100);
  const CONC = Number(argv.concurrency || 10);
  const STAGGER = Number(argv.stagger || 50);
  const URL = argv.url || 'http://localhost:3000/run-loadtest';

  const telemetry = [];
  let inFlight = 0;
  let cursor = 0;

  function spawnNext(resolveAll) {
    if (cursor >= TOTAL) {
      if (inFlight === 0) resolveAll();
      return;
    }
    if (inFlight >= CONC) return;

    const id = ++cursor;
    inFlight++;
    const startedAt = Date.now();
    console.log(`[req ${id}] start ${new Date(startedAt).toISOString()}`);

    withRetry(async () => request(URL))
      .then((res) => {
        const finishedAt = Date.now();
        const ms = finishedAt - startedAt;
        const ok = res.status >= 200 && res.status < 300;
        console.log(`[req ${id}] done ${res.status} in ${ms} ms`);
        telemetry.push({ id, startedAt, finishedAt, ms, status: res.status, ok });
      })
      .catch((err) => {
        const finishedAt = Date.now();
        const ms = finishedAt - startedAt;
        console.error(`[req ${id}] error after ${ms} ms: ${err && err.message}`);
        telemetry.push({ id, startedAt, finishedAt, ms, status: 0, ok: false, error: String(err && err.message || err) });
      })
      .finally(() => {
        inFlight--;
        setTimeout(() => spawnNext(resolveAll), STAGGER);
      });
  }

  await new Promise((resolve) => {
    // Kick off up to CONC initially
    for (let i = 0; i < CONC; i++) spawnNext(resolve);
  });

  // Summary
  const total = telemetry.length;
  const success = telemetry.filter((t) => t.ok).length;
  const failed = total - success;
  const avgMs = total ? Math.round(telemetry.reduce((a, t) => a + t.ms, 0) / total) : 0;
  console.log(`\n=== API Load Summary ===`);
  console.log(`URL: ${URL}`);
  console.log(`Total: ${total}, Success: ${success}, Failed: ${failed}, Avg ms: ${avgMs}`);
}

run().catch((e) => {
  console.error('runner error:', e);
  process.exit(1);
});





