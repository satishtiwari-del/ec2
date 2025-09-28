const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const { spawn, fork } = require('child_process');
const ExcelJS = require('exceljs');
const jwt = require("jsonwebtoken");

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const DOCS_DIR = path.join(__dirname, 'Documents');
const PUBLIC_DIR = path.join(__dirname, 'public');
// const COLLABORA_PUBLIC_BASE = process.env.COLLABORA_URL || 'http://43.204.32.60:9980';
const COLLABORA_PUBLIC_BASE = process.env.COLLABORA_URL || 'http://localhost:9980';
const WOPI_HOST_PUBLIC = process.env.WOPI_PUBLIC || 'http://host.docker.internal:3000';
// const COLLABORA_PUBLIC_BASE = process.env.COLLABORA_URL || 'http://localhost:9980';
// const WOPI_HOST_PUBLIC = process.env.WOPI_PUBLIC || 'http://43.204.32.60:3000';
const DOCUMENTS_DIR = path.join(__dirname, 'Documents');
const app = express();
app.use(cors());
app.use(express.json());
app.use('/public', express.static(PUBLIC_DIR));

// Simple CORS sanity log
app.use((req, _res, next) => {
  if (req.path.startsWith('/api/wopi/refresh-token')) {
    console.log('[WOPI] incoming refresh-token request from', req.headers.origin || 'no-origin');
  }
  next();
});

// ------------------------
// In-memory log buffer for diagnostics
// ------------------------
const LOG_BUFFER = [];
const MAX_LOG_LINES = 2000;
const originalConsoleLog = console.log;
console.log = (...args) => {
  try {
    const line = args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
    LOG_BUFFER.push(`${new Date().toISOString()} ${line}`);
    if (LOG_BUFFER.length > MAX_LOG_LINES) LOG_BUFFER.splice(0, LOG_BUFFER.length - MAX_LOG_LINES);
  } catch {}
  originalConsoleLog.apply(console, args);
};

// ------------------------
// Helpers
// ------------------------
function base64UrlEncode(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

// ===== Excalidraw helpers & in-memory lock state =====
const inMemoryLocks = new Map(); // key: fullPath, value: { token, expiresAtMs }

function getFullPathFromFileId(fileId) {
  const name = fileNameFromId(fileId);
  return path.join(DOCUMENTS_DIR, path.basename(name));
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64');
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

// Stateless HMAC-signed tokens (survive server restarts)
// token format: base64url(payload).base64url(hmac)
// payload: { fid, uid, un, exp, rnd }
const WOPI_SECRET = process.env.WOPI_SECRET || 'dev-secret-change-me';

function hmacSign(data) {
  return base64UrlEncode(crypto.createHmac('sha256', WOPI_SECRET).update(data).digest());
}

// function createToken({ fileId, userId, userName, ttlSec }) {
//   // const exp = Date.now() + Math.max(60, Number(ttlSec || 3600)) * 1000;
//   const exp = Math.floor(Date.now() / 1000) + (12 * 60 * 60); 
//   const payload = { fid: fileId, uid: userId, un: userName, exp, rnd: base64UrlEncode(crypto.randomBytes(8)) };
//   // const payloadB64 = base64UrlEncode(Buffer.from(JSON.stringify(payload), 'utf8'));
//   const token = jwt.sign(
//     payload,
//     "satish"
//   );
//   const sig = hmacSign(payloadB64);
//   return { token: `${token}`, expiresAt: exp };
// }


function createToken({ fileId, userId, userName, ttlSec }) {
  const exp = Math.floor(Date.now() / 1000) + ttlSec; 
  const sid = base64UrlEncode(crypto.randomBytes(6));

  const payload = {
    fid: fileId,
    uid: userId,
    un: userName,
    exp,
    sid
  };

  const token = jwt.sign(payload, WOPI_SECRET); // use secret from env
  console.log('[WOPI] issued token', { fid: fileId, uid: userId, un: userName, exp, sid });
  return { token, expiresAt: exp };
}

const CLOCK_SKEW_SEC = 30; // allow small skew

function verifyTokenAndMatchFile(token, fileId) {
  try {
    const payload = jwt.verify(token, WOPI_SECRET, { clockTolerance: CLOCK_SKEW_SEC });
    if (!payload || typeof payload !== 'object') {
      return { ok: false, code: 'invalid_payload' };
    }
    if (String(payload.fid || '').trim() !== String(fileId || '').trim()) {
      return { ok: false, code: 'file_mismatch', payload };
    }
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === 'number' && now > payload.exp + CLOCK_SKEW_SEC) {
      return { ok: false, code: 'expired', payload };
    }
    return { ok: true, payload };
  } catch (e) {
    return { ok: false, code: 'bad_signature', error: e && e.message };
  }
}




// function validateToken(token, fileId) {
//   try {
//     const parts = String(token || '').split('.');
//     if (parts.length !== 2) return false;
//     const [payloadB64, sig] = parts;
//     const expected = hmacSign(payloadB64);
//     if (sig !== expected) return false;
//     const json = JSON.parse(base64UrlDecode(payloadB64).toString('utf8'));
//     if (!json || typeof json !== 'object') return false;
//     if (String(json.fid) !== String(fileId)) return false;
//     // small grace window to reduce race right at expiry boundary
//     if (Date.now() > Number(json.exp || 0) + 5000) return false;
//     return true;
//   } catch {
//     return false;
//   }
// }

function idFromFilename(filename) {
  return base64UrlEncode(Buffer.from(filename, 'utf8'));
}

function filenameFromId(id) {
  return base64UrlDecode(id).toString('utf8');
}

function buildLoolUrl({ fileId, filename, accessToken, ttlSec, mode }) {
  const wopiSrc = `${WOPI_HOST_PUBLIC}/api/wopi/files/${encodeURIComponent(fileId)}`;
  
  const qs = new URLSearchParams();
  qs.set('WOPISrc', wopiSrc);
  qs.set('title', filename);
  qs.set('lang', 'en');
  console.log("mode================", mode);
  if (mode === 'view') qs.set('permission', 'view'); else qs.set('permission', 'edit');
  qs.set('access_token', accessToken);
  qs.set('access_token_ttl', String(ttlSec));
  // Newer CODE uses COOL UI at /browser/dist/cool.html
  return `${COLLABORA_PUBLIC_BASE}/browser/dist/cool.html?${qs.toString()}`;
}

// ------------------------
// Minimal WOPI Host endpoints
// ------------------------
app.get('/api/documents', (_req, res) => {
  fs.readdir(DOCUMENTS_DIR, { withFileTypes: true }, (err, entries) => {
    if (err) return res.status(500).json({ error: 'Failed to read Documents' });
    const files = entries.filter(e => e.isFile()).map(e => e.name);
    res.json({ files });
  });
});

app.post('/api/documents/upload', async (req, res) => {
  try {
    const filename = String(req.query.filename || 'New Microsoft Excel Worksheet.xlsx');
    ensureDir(DOCS_DIR);
    const filePath = path.join(DOCS_DIR, filename);
    const wb = new ExcelJS.Workbook();
    wb.addWorksheet('Sheet1');
    await wb.xlsx.writeFile(filePath);
    const fileId = idFromFilename(filename);
    res.json({ id: fileId, name: filename, path: filePath });
  } catch (e) {
    res.status(500).json({ error: String(e && e.message || e) });
  }
});

app.get('/api/wopi/iframe-url', (req, res) => {
  try {
    const filename = String(req.query.filename || 'spreadsheet.xlsx');
    const mode = String(req.query.mode || 'edit');
    const userId = String(req.query.userId || 'user');
    const userName = String(req.query.userName || 'User');
    ensureDir(DOCS_DIR);
    const filePath = path.join(DOCS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      // lazily create an empty xlsx file
      const wb = new ExcelJS.Workbook();
      wb.addWorksheet('Sheet1');
      wb.xlsx.writeFile(filePath).catch(() => {});
    }
    const fileId = idFromFilename(filename);
    const ttlSec = Math.max(60, Number(req.query.ttlSec || 86400)); // min 60s, default 24h
    const { token, expiresAt } = createToken({ fileId, userId, userName, ttlSec });
    const nowSec = Math.floor(Date.now() / 1000);
    const effectiveTtl = Math.max(1, (expiresAt || (nowSec + ttlSec)) - nowSec);
    
    const url = buildLoolUrl({ fileId, filename, accessToken: token, ttlSec: effectiveTtl, mode });
    res.json({ url, access_token: token, accessTokenTtl: effectiveTtl, fileId, filename,  access_token_ttl: effectiveTtl });
  } catch (e) {
    res.status(500).json({ error: String(e && e.message || e) });
  }
});

app.get('/api/wopi/refresh-token', (req, res) => {
  try {
    console.log('[WOPI] /api/wopi/refresh-token', {
      filename: req.query.filename,
      mode: req.query.mode,
      userId: req.query.userId,
      userName: req.query.userName
    });
    const filename = String(req.query.filename || 'spreadsheet.xlsx');
    const mode = String(req.query.mode || 'edit');
    const userId = String(req.query.userId || 'user');
    const userName = String(req.query.userName || 'User');
    const fileId = idFromFilename(filename);
    const ttlSec = Math.max(60, Number(req.query.ttlSec || 86400));
    const { token, expiresAt } = createToken({ fileId, userId, userName, ttlSec });
    const nowSec = Math.floor(Date.now() / 1000);
    const effectiveTtl = Math.max(1, (expiresAt || (nowSec + ttlSec)) - nowSec);
    const url = buildLoolUrl({ fileId, filename, accessToken: token, ttlSec: effectiveTtl, mode });
    console.log('[WOPI] refresh-token issued', { fid: fileId, uid: userId, ttlSec: effectiveTtl });
    res.json({ url, access_token: token, accessTokenTtl: effectiveTtl, fileId, filename ,  access_token_ttl: effectiveTtl});
  } catch (e) {
    res.status(500).json({ error: String(e && e.message || e) });
  }
});

// WOPI security: validate access_token on all WOPI file endpoints
function wopiAuth(req, res, next) {
  const token = req.query.access_token;
  const fileId = req.params.id;
  if (!token) {
    console.warn('[WOPI] 401 missing token for fileId=%s %s %s', fileId, req.method, req.originalUrl);
    return res.status(401).json({ error: 'invalid_token', reason: 'missing' });
  }
  const result = verifyTokenAndMatchFile(String(token), String(fileId));
  if (!result.ok) {
    console.warn('[WOPI] 401 token rejected for fileId=%s code=%s %s %s', fileId, result.code, req.method, req.originalUrl);
    return res.status(401).json({ error: 'invalid_token', reason: result.code });
  }
  // attach token payload for downstream
  req.wopi = { payload: result.payload };
  try {
    const override = req.get('X-WOPI-Override');
    const sid = result.payload && result.payload.sid ? String(result.payload.sid) : '';
    const uid = result.payload && result.payload.uid ? String(result.payload.uid) : '';
    if (override) {
      console.log('[WOPI] %s %s override=%s lock=%s fid=%s uid=%s sid=%s', req.method, req.path, override, req.get('X-WOPI-Lock') || '', fileId, uid, sid);
    } else {
      console.log('[WOPI] %s %s fid=%s uid=%s sid=%s', req.method, req.path, fileId, uid, sid);
    }
  } catch {}
  next();
}

// In-memory WOPI lock store (per fileId)
// Structure: fileId -> { lock: string, expiresAtMs: number }
const wopiLocks = new Map();

function getLockRecord(fileId) {
  const now = Date.now();
  const rec = wopiLocks.get(fileId);
  if (rec && rec.expiresAtMs > now) return rec;
  if (rec) wopiLocks.delete(fileId);
  return null;
}

function setLockRecord(fileId, lock, ttlMs) {
  const ttl = Math.max(5 * 60 * 1000, ttlMs || 30 * 60 * 1000); // default 30m, min 5m
  wopiLocks.set(fileId, { lock, expiresAtMs: Date.now() + ttl });
}

// CheckFileInfo
app.get('/api/wopi/files/:id', wopiAuth, (req, res) => {
  try {
    console.log("called checkfileinfo------------------")
    const id = String(req.params.id);
    const filename = filenameFromId(id);
    const filePath = path.join(DOCS_DIR, filename);
    const stat = fs.existsSync(filePath) ? fs.statSync(filePath) : { size: 0 };
    // Derive user identity from the validated token so Collabora sees a stable user/session
    let userId = 'user';
    let userName = 'User';
    try {
      const payload = req.wopi && req.wopi.payload;
      if (payload && typeof payload === 'object') {
        if (payload.uid) userId = String(payload.uid);
        if (payload.un) userName = String(payload.un);
      }
    } catch {}
    const info = {
      BaseFileName: filename,
      OwnerId: 'owner',
      Size: stat.size,
      Version: String(stat.mtimeMs || 1),
      SupportsUpdate: true,
      SupportsLocks: true,
      UserId: userId,
      UserFriendlyName: userName,
      UserCanWrite: true,
      IsAnonymousUser: false,
    };
    res.json(info);
  } catch (e) {
    res.status(500).json({ error: String(e && e.message || e) });
  }
});

// GetFile / contents
app.get('/api/wopi/files/:id/contents', wopiAuth, (req, res) => {
  try {
    const id = String(req.params.id);
    const filename = filenameFromId(id);
    const filePath = path.join(DOCS_DIR, filename);
    if (!fs.existsSync(filePath)) return res.status(404).end();
    res.setHeader('Content-Type', 'application/octet-stream');
    fs.createReadStream(filePath).pipe(res);
  } catch (e) {
    res.status(500).json({ error: String(e && e.message || e) });
  }
});

// PutFile / contents (save)
// Accept raw bytes for compatibility with Collabora/CODE
const rawBody = express.raw({ type: '*/*', limit: '200mb' });

function handlePutFile(req, res) {
  try {
    const id = String(req.params.id);
    const filename = filenameFromId(id);
    const filePath = path.join(DOCS_DIR, filename);

    // Respect WOPI lock if present
    const incomingLock = String(req.get('X-WOPI-Lock') || '');
    const existing = getLockRecord(id);
    if (existing && existing.lock && incomingLock && existing.lock !== incomingLock) {
      res.setHeader('X-WOPI-Lock', existing.lock);
      return res.status(409).end();
    }

    ensureDir(DOCS_DIR);
    const buf = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '');
    fs.writeFileSync(filePath, buf);
    return res.status(200).end();
  } catch (e) {
    return res.status(500).json({ error: String(e && e.message || e) });
  }
}

app.put('/api/wopi/files/:id/contents', wopiAuth, rawBody, handlePutFile);
app.post('/api/wopi/files/:id/contents', wopiAuth, rawBody, handlePutFile);

// WOPI operations endpoint (LOCK/UNLOCK/REFRESH_LOCK/GET_LOCK)
app.post('/api/wopi/files/:id', wopiAuth, (req, res) => {
  try {
    const fileId = String(req.params.id);
    const override = String(req.get('X-WOPI-Override') || '').toUpperCase();
    const lock = String(req.get('X-WOPI-Lock') || '');
    const existing = getLockRecord(fileId);

    // Helper to reply with current lock
    function replyWithLock(statusCode, currentLock) {
      if (currentLock) res.setHeader('X-WOPI-Lock', currentLock);
      return res.status(statusCode).end();
    }

    switch (override) {
      case 'LOCK': {
        if (existing && existing.lock && lock && existing.lock !== lock) {
          // conflict
          res.setHeader('X-WOPI-Lock', existing.lock);
          return res.status(409).end();
        }
        const effectiveLock = lock || (existing && existing.lock) || 'default-lock';
        setLockRecord(fileId, effectiveLock, 30 * 60 * 1000);
        res.setHeader('X-WOPI-Lock', effectiveLock);
        return res.status(200).end();
      }
      case 'REFRESH_LOCK': {
        if (existing && existing.lock === lock) {
          setLockRecord(fileId, lock, 30 * 60 * 1000);
          res.setHeader('X-WOPI-Lock', lock);
          return res.status(200).end();
        }
        res.setHeader('X-WOPI-Lock', existing ? existing.lock : '');
        return res.status(409).end();
      }
      case 'UNLOCK': {
        if (existing && existing.lock === lock) {
          wopiLocks.delete(fileId);
          res.setHeader('X-WOPI-Lock', lock);
          return res.status(200).end();
        }
        // Be permissive to avoid read-only sessions/popups: best-effort unlock
        // Accept unlock even if lock is missing or mismatched (common during doc unload)
        if (existing) wopiLocks.delete(fileId);
        if (lock) res.setHeader('X-WOPI-Lock', lock);
        return res.status(200).end();
      }
      case 'GET_LOCK': {
        return replyWithLock(200, existing ? existing.lock : '');
      }
      default: {
        // No-op for unimplemented overrides; succeed to keep session stable
        return res.status(200).end();
      }
    }
  } catch (e) {
    res.status(500).json({ error: String(e && e.message || e) });
  }
});

// ------------------------
// Load test orchestration
// ------------------------
async function createExcelFileOnDisk(filename) {
  ensureDir(DOCS_DIR);
  const filePath = path.join(DOCS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    const wb = new ExcelJS.Workbook();
    wb.addWorksheet('Sheet1');
    await wb.xlsx.writeFile(filePath);
  }
  return filePath;
}

function runRunnerMp(totalUsers) {
  return new Promise((resolve) => {
    // Ensure Playwright browsers are installed
    const install = spawn('npx', ['--yes', 'playwright', 'install', 'chromium'], { stdio: ['ignore', 'ignore', 'inherit'] });
    install.on('exit', () => {
      const workers = Math.max(1, Math.min(os.cpus().length, Math.ceil(totalUsers / 50)));
      const perWorker = Math.ceil(totalUsers / workers);
      const args = [
        path.join(__dirname, 'scripts', 'runner-mp.js'),
        '--total', String(totalUsers),
        '--workers', String(workers),
        '--perWorker', String(perWorker),
        '--pool', String(Math.min(6, workers)),
        '--contexts', '2',
        '--pages', '1',
        '--ramp', '200',
        '--ready', '240000',
        '--direct', '1'
      ];
      const child = fork(path.join(__dirname, 'scripts', 'runner-mp.js'), args.slice(1), { env: { ...process.env }, stdio: ['ignore', 'pipe', 'inherit', 'ipc'] });
      let buf = '';
      let acc = [];
      child.on('message', (msg) => {
        try { if (msg && Array.isArray(msg.results)) acc.push(...msg.results); } catch {}
      });
      child.stdout.on('data', (d) => { buf += d.toString('utf8'); });
      child.on('exit', () => {
        try {
          const lastJsonStart = buf.lastIndexOf('{');
          const json = lastJsonStart >= 0 ? JSON.parse(buf.slice(lastJsonStart)) : { results: [] };
          if (Array.isArray(json.results) && json.results.length) resolve(json); else resolve({ results: acc });
        } catch {
          resolve({ results: acc });
        }
      });
    });
  });
}

app.get('/api/loadtest/run', async (req, res) => {
  try {
    const users = Number(req.query.users || 1000);
    // Dynamic per-user files; no shared filename needed
    delete process.env.WOPI_TEST_FILENAME;
    const results = await runRunnerMp(users);
    const all = Array.isArray(results.results) ? results.results : [];
    const failed = all.filter((r) => r && r.error).length;
    const succeeded = all.length - failed;
    res.json({ ok: failed === 0, users, succeeded, failed });
  } catch (e) {
    res.status(500).json({ error: String(e && e.message || e) });
  }
});

// Back-compat with scripts/api-load-runner.js
app.get('/run-loadtest', async (req, res) => {
  try {
    const resp = await fetch(`http://localhost:${PORT}/api/loadtest/run?users=${Number(req.query.users || 100)}`);
    const json = await resp.json();
    res.json(json);
  } catch (e) {
    res.status(500).json({ error: String(e && e.message || e) });
  }
});

// Simple host page to embed Collabora iframe from same origin (frame_ancestors allowlist)
app.get('/iframe-host', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>WOPI Iframe Host</title>
    <script src="/public/wopi-iframe-refresh.js"></script>
    <style>html,body{margin:0;padding:0;height:100%} #c{width:100%;height:100%;border:0}</style>
  </head>
  <body>
    <iframe id="c"></iframe>
    <script>
      window.addEventListener('unhandledrejection', e=>console.warn('rej',e));
      (function(){
        // Auto-start refresher once iframe src is set by parent/test code
        function startWhenReady(){
          if (!window.WopiIframeRefresher) { return setTimeout(startWhenReady, 200); }
          var iframe = document.getElementById('c');
          if (!iframe) return setTimeout(startWhenReady, 200);
          // Observe src changes; start refresher when non-empty
          var started = false;
          function tryStart(){
            if (started) return;
            var src = iframe.getAttribute('src') || '';
            if (!src) return;
            try {
              var u = new URL(src, window.location.origin);
              var filename = u.searchParams.get('title') || 'spreadsheet.xlsx';
              var perm = u.searchParams.get('permission') || 'edit';
              window.WopiIframeRefresher.start({
                iframe: iframe,
                filename: filename,
                mode: perm === 'view' ? 'view' : 'edit',
                apiBase: '/api',
                refreshLeadMs: 10 * 60 * 1000,
                keepaliveMs: 2 * 60 * 1000, // 2 min keepalive to beat aggressive idle timeouts
                hardReloadMs: 10 * 60 * 1000
              });
              started = true;
            } catch {}
          }
          var mo = new MutationObserver(function(){ tryStart(); });
          mo.observe(iframe, { attributes: true, attributeFilter: ['src'] });
          // Also attempt immediately in case src is already set
          tryStart();
        }
        startWhenReady();
      })();
    </script>
  </body>
</html>`);
});

// Diagnostics: fetch last server logs
app.get('/api/logs', (req, res) => {
  const last = LOG_BUFFER.slice(-200);
  res.json({ lines: last });
});


app.get('/', async (req, res) => {
  try {
    res.json({message: "Hello World"});
  } catch (e) {
    res.status(500).json({ error: String(e && e.message || e) });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});