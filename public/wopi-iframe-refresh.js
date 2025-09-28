// Lightweight helper to auto-refresh Collabora WOPI iframe before token expiry
// Usage:
// <script src="/public/wopi-iframe-refresh.js"></script>
// window.WopiIframeRefresher.start({
//   iframe: document.getElementById('collaboraFrame'),
//   filename: '1st.docx',
//   userId: 'user1',
//   userName: 'Admin User',
//   mode: 'edit', // or 'view'
//   apiBase: '/api',
//   refreshLeadMs: 10 * 60 * 1000, // refresh 10 minutes before expiry
// });

(function () {
  console.log('[WOPI] wopi-iframe-refresh.js loaded');
  function emit(name, detail) {
    try { window.dispatchEvent(new CustomEvent('wopi-refresh', { detail: { name: name, ...(detail || {}) } })); } catch {}
  }
  function computeLeadMs(ttlSec, defaultLeadMs) {
    console.log('[WOPI] computeLeadMs ttlSec=%s defaultLeadMs=%s', ttlSec, defaultLeadMs);
    var ttlMs = (ttlSec || 3600) * 1000;
    var lead = typeof defaultLeadMs === 'number' ? defaultLeadMs : Math.min(10 * 60 * 1000, Math.max(2 * 60 * 1000, Math.floor(ttlMs * 0.2)));
    // ensure at least 2 minutes, at most half of TTL
    if (lead > Math.floor(ttlMs / 2)) lead = Math.floor(ttlMs / 2);
    if (lead < 2 * 60 * 1000) lead = 2 * 60 * 1000;
    return lead;
  }

  function fetchJson(url, opts) {
    return fetch(url, opts).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function buildRefreshUrl(apiBase, params) {
    var qs = new URLSearchParams();
    qs.set('filename', params.filename);
    if (params.mode) qs.set('mode', params.mode);
    if (params.userId) qs.set('userId', params.userId);
    if (params.userName) qs.set('userName', params.userName);
    var base = String(apiBase || '/api');
    if (base.endsWith('/')) base = base.slice(0, -1);
    return base + '/wopi/refresh-token?' + qs.toString();
  }

  var activeTimer = null;
  var keepaliveTimer = null;
  var hardReloadTimer = null;
  var watchdogTimer = null;
  var forcedReloadTimer = null;
  var isRefreshing = false;
  var destroyed = false;

  function schedule(nextInMs, fn) {
    if (activeTimer) clearTimeout(activeTimer);
    var delay = Math.max(1000, nextInMs);
    emit('scheduled', { nextInMs: delay });
    activeTimer = setTimeout(function(){ if (!destroyed) fn(); }, delay);
  }

  function parseTtlFromSrc(src) {
    try {
      if (!src) return null;
      var u = new URL(src, window.location.origin);
      var ttl = u.searchParams.get('access_token_ttl');
      return ttl ? Number(ttl) : null;
    } catch {
      return null;
    }
  }

  function start(options) {
    var iframe = options.iframe;
    if (!iframe) throw new Error('WopiIframeRefresher: iframe is required');
    var apiBase = options.apiBase || '/api';
    var filename = options.filename;
    var userId = options.userId || 'currentUser';
    var userName = options.userName || 'Current User';
    var mode = options.mode || 'edit';
    var refreshLeadMs = options.refreshLeadMs;
    var maxConsecErrors = typeof options.maxConsecErrors === 'number' ? Math.max(1, options.maxConsecErrors) : 5;
    var consecErrors = 0;
    var rescueOnLoadMs = typeof options.rescueOnLoadMs === 'number' ? options.rescueOnLoadMs : 0;
    var keepaliveMs = typeof options.keepaliveMs === 'number' ? Math.max(60 * 1000, options.keepaliveMs) : 2 * 60 * 1000; // Default to 2 min keepalive
    var hardReloadMs = typeof options.hardReloadMs === 'number' ? Math.max(5 * 60 * 1000, options.hardReloadMs) : 10 * 60 * 1000; // Default hard reload at 10m
    var hasDoneRescue = false;
    var lastRefreshAtMs = 0;
    var collaboraHardSessionSec = Number(options.collaboraHardSessionSec || 7200);
    console.log('[WOPI] Refresher.start apiBase=%s filename=%s mode=%s', apiBase, filename, mode);

    function postKeepalive() {
      try {
        if (iframe && iframe.contentWindow) iframe.contentWindow.postMessage('loolkeepalive', '*');
        console.log('[WOPI] keepalive postMessage sent');
      } catch {}
    }

    function scheduleForcedReload() {
      try { if (forcedReloadTimer) clearTimeout(forcedReloadTimer); } catch {}
      if (!(collaboraHardSessionSec > 0)) return;
      var safetyMs = 10 * 60 * 1000; // 10m before hard expiry
      var whenMs = Math.max(60 * 1000, collaboraHardSessionSec * 1000 - safetyMs);
      forcedReloadTimer = setTimeout(function(){ if (!destroyed) refresh(); }, whenMs);
    }

    function refresh() {
      console.log("====================================rr===r=====")
      if (isRefreshing) { try { console.log('[WOPI] refresh already in progress, skipping'); } catch {} return; }
      isRefreshing = true;
      emit('start', { filename: filename });
      try { console.log('[WOPI] Refresher.refresh invoked'); } catch {}
      // Clear any pending keepalive before refresh
      if (keepaliveTimer) clearTimeout(keepaliveTimer);
      var url = buildRefreshUrl(apiBase, { filename: filename, mode: mode, userId: userId, userName: userName });
      try { console.log('[WOPI] GET %s', url); } catch {}
      fetchJson(url).then(function (data) {
        if (!data || !data.url || !data.accessTokenTtl) { console.warn('[WOPI] invalid refresh response', data); return; }
        // Swap iframe src to the refreshed URL; avoid about:blank interstitial
        var prev = iframe.getAttribute('src') || '';
        var finalUrl = (function(u){ try { return String(u) + (String(u).indexOf('?')>=0?'&':'?') + '_ts=' + Date.now(); } catch { return String(u); } })(data.url);
        try { if (prev !== finalUrl) iframe.src = finalUrl; } catch {}
        try { console.log('[WOPI] iframe src updated', { prevSrcLen: prev.length, newSrcLen: String(finalUrl||'').length, ttl: data.accessTokenTtl }); } catch {}
        var lead = computeLeadMs(data.accessTokenTtl, refreshLeadMs);
        var nextIn = Math.max(1000, data.accessTokenTtl * 1000 - lead);
        try { console.log('[WOPI] scheduling next refresh in %sms (lead=%s)', nextIn, lead); } catch {}
        schedule(nextIn, refresh);
        if (keepaliveMs > 0) {
          if (keepaliveTimer) clearInterval(keepaliveTimer);
          keepaliveTimer = setInterval(postKeepalive, keepaliveMs);
        }
        // ensure we reload before Collabora hard session expiry (independent of token TTL)
        scheduleForcedReload();
        emit('done', { filename: filename, nextInMs: nextIn, ttlSec: data.accessTokenTtl });
        consecErrors = 0;
        lastRefreshAtMs = Date.now();
      }).catch(function (err) {
        // backoff and retry in 30s
        console.error('[WOPI] refresh failed', err);
        emit('error', { message: String(err && (err.message || err)) });
        consecErrors++;
        if (consecErrors >= maxConsecErrors) {
          try {
            emit('auth-required', {
              reason: 'consecutive-refresh-failures',
              attempts: consecErrors,
              lastError: String(err && (err.message || err))
            });
          } catch {}
        }
        var isAuthErr = false;
        try { isAuthErr = String(err && (err.message || '')).indexOf('HTTP 401') >= 0 || String(err && (err.message || '')).indexOf('HTTP 403') >= 0; } catch {}
        var backoff = isAuthErr ? 10 * 1000 : Math.min(120 * 1000, 30 * 1000 * Math.max(1, consecErrors));
        schedule(backoff, refresh);
      }).finally(function(){
        isRefreshing = false;
      });
    }

    // First schedule based on current iframe URL's TTL if available to avoid immediate reload.
    var currentSrc = iframe.getAttribute('src') || '';
    var currentTtl = parseTtlFromSrc(currentSrc);
    if (currentTtl && currentTtl > 0) {
      var lead0 = computeLeadMs(currentTtl, refreshLeadMs);
      var next0 = Math.max(1000, currentTtl * 1000 - lead0);
      try { console.log('[WOPI] Using existing iframe TTL=%s, scheduling first refresh in %sms', currentTtl, next0); } catch {}
      schedule(next0, refresh);
      scheduleForcedReload();
    } else {
      // Fall back to fetching a fresh token once to establish schedule
      refresh();
    }

    // Optional rescue: after the iframe loads the first time, force a one-time refresh
    // to recover from any transient session-init race conditions (e.g., WS hiccup).
    if (rescueOnLoadMs > 0) {
      try {
        iframe.addEventListener('load', function () {
          if (hasDoneRescue) return;
          var delay = Math.max(500, rescueOnLoadMs);
          try { console.log('[WOPI] scheduling one-time rescue refresh in %sms', delay); } catch {}
          setTimeout(function(){
            if (hasDoneRescue || destroyed) return;
            hasDoneRescue = true;
            refresh();
          }, delay);
        }, { once: true });
      } catch {}
    }

    // Network & visibility heuristics to improve stability and reconnection
    try {
      window.addEventListener('online', function(){
        try { console.log('[WOPI] browser online - scheduling immediate refresh'); } catch {}
        // Clear any pending timers and refresh immediately
        if (activeTimer) clearTimeout(activeTimer);
        if (keepaliveTimer) clearTimeout(keepaliveTimer);
        schedule(1000, refresh);
      });
    } catch {}
    try {
      document.addEventListener('visibilitychange', function(){
        if (document.visibilityState === 'visible') {
          try { console.log('[WOPI] tab visible - nudging refresher'); } catch {}
          // Clear any pending timers and refresh soon
          if (activeTimer) clearTimeout(activeTimer);
          if (keepaliveTimer) clearTimeout(keepaliveTimer);
          schedule(2000, refresh);
        }
      });
    } catch {}

    // Hard reload safeguard: periodically force a refresh even if timers failed
    try {
      if (hardReloadMs > 0) {
        if (hardReloadTimer) clearInterval(hardReloadTimer);
        hardReloadTimer = setInterval(function(){
          if (destroyed) return;
          var since = Date.now() - lastRefreshAtMs;
          if (!lastRefreshAtMs || since >= hardReloadMs) {
            try { console.log('[WOPI] hardReloadMs passed (%sms). Forcing refresh.', hardReloadMs); } catch {}
            refresh();
          }
        }, Math.max(5 * 60 * 1000, Math.floor(hardReloadMs / 2)));
      }
    } catch {}

    // Watchdog: recover from timer throttling by ensuring a refresh within keepalive+30s
    try {
      if (watchdogTimer) clearInterval(watchdogTimer);
      watchdogTimer = setInterval(function(){
        if (destroyed) return;
        var since = Date.now() - lastRefreshAtMs;
        var threshold = keepaliveMs + 30 * 1000;
        if (!lastRefreshAtMs || since >= threshold) {
          try { console.log('[WOPI] watchdog triggered refresh (since=%s, threshold=%s)', since, threshold); } catch {}
          refresh();
        }
      }, 60 * 1000);
    } catch {}

    try {
      window.addEventListener('beforeunload', function(){ destroyed = true; if (activeTimer) clearTimeout(activeTimer); if (keepaliveTimer) clearTimeout(keepaliveTimer); if (hardReloadTimer) clearInterval(hardReloadTimer); if (watchdogTimer) clearInterval(watchdogTimer); });
      window.addEventListener('unload', function(){ destroyed = true; if (activeTimer) clearTimeout(activeTimer); if (keepaliveTimer) clearTimeout(keepaliveTimer); if (hardReloadTimer) clearInterval(hardReloadTimer); if (watchdogTimer) clearInterval(watchdogTimer); });
    } catch {}
  }

  window.WopiIframeRefresher = {
    start: start
  };
})();


