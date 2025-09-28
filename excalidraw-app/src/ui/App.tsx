import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Excalidraw, MainMenu } from '@excalidraw/excalidraw';

type SceneContent = any;

function getQueryParam(name: string): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function toBase64Url(input: string): string {
  const enc = new TextEncoder().encode(input);
  let b64 = btoa(String.fromCharCode(...enc));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export default function App() {
  const [initialData, setInitialData] = useState<SceneContent | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [version, setVersion] = useState<number | null>(null);
  const excalidrawRef = useRef<any>(null);
  const savingRef = useRef(false);
  const returnUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const id = getQueryParam('fileId');
    const filename = getQueryParam('filename');
    const returnUrl = getQueryParam('returnUrl');
    if (id) setFileId(id);
    else if (filename) setFileId(toBase64Url(filename));
    if (returnUrl) returnUrlRef.current = returnUrl;
  }, []);

  useEffect(() => {
    if (!fileId) return;
    (async () => {
      try {
        const resp = await fetch(`/wopi/files/${encodeURIComponent(fileId)}/excalidraw`, { credentials: 'include' });
        if (!resp.ok) throw new Error(await resp.text());
        const data = await resp.json();
        setInitialData(data.content || { type: 'excalidraw', elements: [], appState: {}, libraryItems: [] });
        setVersion(data.version ?? null);
      } catch (e) {
        console.error('Load failed', e);
        setInitialData({ type: 'excalidraw', elements: [], appState: {}, libraryItems: [] });
      }
    })();
  }, [fileId]);

  const buildContent = useCallback(() => {
    const api = (excalidrawRef.current as any)?.getExcalidrawAPI?.() || excalidrawRef.current;
    if (!api) return null as any;
    const elements = api.getSceneElements();
    const appState = api.getAppState();
    const files = api.getFiles ? api.getFiles() : [];
    return { type: 'excalidraw', elements, appState, libraryItems: files };
  }, []);

  const save = useCallback(async () => {
    if (!fileId || !excalidrawRef.current || savingRef.current) return;
    savingRef.current = true;
    try {
      const content = buildContent();

      const resp = await fetch(`/wopi/files/${encodeURIComponent(fileId)}/excalidraw`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content, clientVersion: version })
      });
      if (resp.status === 409) {
        const body = await resp.json();
        alert('Version conflict. Latest content loaded.');
        setInitialData(body.content);
        setVersion(body.serverVersion ?? null);
        return;
      }
      if (!resp.ok) throw new Error(await resp.text());
      const data = await resp.json();
      setVersion(data.version ?? null);
    } catch (e) {
      console.error('Save failed', e);
      alert('Save failed');
    } finally {
      savingRef.current = false;
    }
  }, [fileId, version]);

  // Save best-effort on unload/navigation using keepalive; avoid alerts/UI.
  const saveOnUnload = useCallback(() => {
    try {
      if (!fileId) return;
      const content = buildContent();
      if (!content) return;
      const body = JSON.stringify({ content, clientVersion: version });
      // Best-effort; keepalive allows request to outlive page for small payloads.
      fetch(`/wopi/files/${encodeURIComponent(fileId)}/excalidraw`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body,
        keepalive: true,
      }).catch(() => {});
    } catch {
      // ignore
    }
  }, [fileId, version, buildContent]);

  const debouncedSave = useMemo(() => {
    let t: any;
    return () => {
      clearTimeout(t);
      t = setTimeout(() => save(), 2000);
    };
  }, [save]);

  // Auto-save when page becomes hidden or is being unloaded/back navigated.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        saveOnUnload();
      }
    };
    const onPageHide = () => saveOnUnload();
    const onBeforeUnload = () => saveOnUnload();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [saveOnUnload]);

  if (!initialData) return <div style={{ padding: 12 }}>Loading…</div>;

  const insertCustomShape = () => {
    const api = (excalidrawRef.current as any).getExcalidrawAPI?.();
    if (!api) return;
    const elem = {
      id: 'custom-' + Date.now(),
      type: 'rectangle',
      x: 100, y: 100, width: 220, height: 120,
      angle: 0,
      strokeColor: '#096dd9',
      backgroundColor: 'transparent',
      fillStyle: 'hachure',
      strokeWidth: 2,
      roughness: 1,
      roundness: { type: 3 },
      seed: Math.floor(Math.random() * 100000),
      version: 1, versionNonce: 1,
      isDeleted: false,
      groupIds: [],
      customData: { linkTargetId: null }
    } as any;
    api.updateScene({ elements: [...api.getSceneElements(), elem] });
  };

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <div style={{ padding: 8, borderBottom: '1px solid #eee', display: 'flex', gap: 8 }}>
        <button
          onClick={async () => {
            await save();
            const url = returnUrlRef.current;
            if (url) window.location.assign(url);
            else window.history.back();
          }}
        >
          Back
        </button>
        <button onClick={save}>Save</button>
        <button onClick={insertCustomShape}>Add custom shape</button>
      </div>
      <Excalidraw ref={excalidrawRef} initialData={initialData} onChange={debouncedSave}>
        <MainMenu>
          <MainMenu.DefaultItems.Export />
          <MainMenu.DefaultItems.SaveAsImage />
          <MainMenu.DefaultItems.ClearCanvas />
        </MainMenu>
      </Excalidraw>
    </div>
  );
}


