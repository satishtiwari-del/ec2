// Deprecated: server now selects container dynamically by user group; keep file for compatibility.
export function assignContainer(): string { throw new Error('assignContainer deprecated: use server-side /api/wopi/iframe-url'); }
export function releaseContainer(_url: string) { /* no-op */ }
