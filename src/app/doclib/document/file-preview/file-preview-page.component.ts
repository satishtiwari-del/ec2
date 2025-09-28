import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { LocalStorageService } from '../storage/local-storage.service';
import { LocalStorageFile } from '../storage/storage.model';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/services/auth.service';
import { UserRole } from '../../auth/user-management/user.service';

@Component({
  selector: 'app-file-preview-page',
  standalone: true,
  imports: [CommonModule],
  template: `
      <div class="preview-page" *ngIf="loaded">
        <div class="header">
          <button type="button" (click)="goBack()">← Back</button>
          <h2>{{ file?.name }}</h2>
        </div>

        <div *ngIf="!file" class="not-found">
          File not found
        </div>

        <div *ngIf="file" class="content" [ngSwitch]="viewMode">
          <div *ngIf="showRefreshBanner" class="refresh-banner">{{ refreshBannerText }}</div>
          <iframe #collaboraFrame *ngSwitchCase="'collabora'" [src]="collaboraUrl" style="border:0; width:100%; height:80vh" (load)="onIframeLoad($event)"></iframe>

          <iframe *ngSwitchCase="'excalidraw'" [src]="excalidrawUrl" style="border:0; width:100%; height:80vh"></iframe>

          <img *ngSwitchCase="'image'" [src]="safeImageUrl" alt="Image preview" />

          <div *ngSwitchCase="'markdown'" class="markdown" [innerHTML]="renderedMarkdown"></div>

          <pre *ngSwitchCase="'text'" class="text">{{ getTextContent() }}</pre>

          <iframe *ngSwitchCase="'pdf'" [src]="safeResourceUrl" style="border:0; width:100%; height:80vh"></iframe>

          <audio *ngSwitchCase="'audio'" controls [src]="safeMediaUrl"></audio>
          <video *ngSwitchCase="'video'" controls [src]="safeMediaUrl" style="max-width:100%; max-height:80vh"></video>

          <div *ngSwitchDefault class="unsupported">
            Preview not available for this file type ({{ file.mimeType }})
          </div>
        </div>
      </div>
    `,
  styles: [`
      .preview-page { padding: 16px; display: flex; flex-direction: column; gap: 16px; }
      .header { display: flex; align-items: center; gap: 12px; }
      .header h2 { margin: 0; }
      .content { border: 1px solid #eee; border-radius: 4px; padding: 12px; }
      .refresh-banner { background: #fffbe6; color: #6b5d00; border: 1px solid #ffe58f; padding: 6px 10px; border-radius: 4px; margin-bottom: 8px; font-size: 13px; }
      .markdown { width: 100%; overflow: auto; }
      .text { white-space: pre-wrap; font-family: monospace; }
      .not-found, .unsupported { color: #666; }
    `]
})
export class FilePreviewPageComponent implements OnInit {
  file: LocalStorageFile | null = null;
  loaded = false;

  viewMode: 'collabora' | 'excalidraw' | 'image' | 'markdown' | 'text' | 'pdf' | 'audio' | 'video' | 'unsupported' = 'unsupported';
  collaboraUrl: SafeResourceUrl | null = null;
  excalidrawUrl: SafeResourceUrl | null = null;
  private syncTimer: any = null;
  private lastServerVersion: string | null = null;
  renderedMarkdown: SafeHtml = '' as unknown as SafeHtml;
  safeImageUrl: SafeUrl | null = null;
  safeMediaUrl: SafeUrl | null = null;
  safeResourceUrl: SafeResourceUrl | null = null;
  @ViewChild('collaboraFrame') collaboraFrame?: ElementRef<HTMLIFrameElement>;

  // Subtle UX for session refresh lifecycle
  showRefreshBanner = false;
  refreshBannerText = '';
  private refreshBannerTimer: any = null;
  private wopiRefreshHandler?: (ev: any) => void;
  private storageListener?: (e: StorageEvent) => void;

  private keepaliveIntervalId: any = null;

  private startKeepalivePing() {

    if (this.keepaliveIntervalId) {
      console.log('[WOPI] Keepalive ping already running.');
      return;
    }
    if (this.keepaliveIntervalId || !this.collaboraFrame) return; // prevent multiple intervals
  
    this.keepaliveIntervalId = setInterval(() => {
      const iframe = this.collaboraFrame?.nativeElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage('loolkeepalive', '*');
        console.log('[WOPI] Sent keepalive ping');
      }
    }, 2 * 60 * 1000); // every 2 minutes
  }
  


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private storage: LocalStorageService,
    private authService: AuthService
  ) { }

  async ngOnInit() {
    // Listen for refresh lifecycle events from refresher script
    try {
      this.wopiRefreshHandler = (ev: any) => {
        const name = ev && ev.detail && ev.detail.name;
        if (name === 'start') {
          this.setBanner('Refreshing session, please wait...');
        } else if (name === 'done') {
          this.setBanner('Session refreshed');
          if (this.refreshBannerTimer) clearTimeout(this.refreshBannerTimer);
          this.refreshBannerTimer = setTimeout(() => this.hideBanner(), 1500);
        } else if (name === 'error') {
          this.setBanner('Refresh failed, retrying...');
        } else if (name === 'auth-required') {
          // Seamless re-login prompt while preserving context
          this.setBanner('Session expired. Please sign in again to continue.');
          try {
            const returnUrl = this.router.url;
            sessionStorage.setItem('returnUrl', returnUrl);
          } catch { }
          console.log('[WOPI] auth-required=======================navigated on login');
          this.router.navigate(['/login']);
        }
      };
      window.addEventListener('wopi-refresh', this.wopiRefreshHandler as any);
    } catch { }
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loaded = true;
      return;
    }
    const file = this.storage.getFile(id);
    this.file = file || null;

    if (!this.file) {
      this.loaded = true;
      return;
    }

    const nameLower = (this.file.name || '').toLowerCase();
    const isOffice = /(\.docx|\.doc|\.xlsx|\.xls|\.pptx|\.ppt|\.odt|\.ods|\.odp)$/i.test(nameLower);
    const isExcalidraw = /\.excalidraw$/i.test(nameLower);

    if (isOffice) {
      this.viewMode = 'collabora';
      const isViewer = this.authService.hasRole(UserRole.VIEWER);
      const mode = isViewer ? 'view' : 'edit';
      const authUser = this.authService.getAuthUser();
      const userId = authUser?.id || 'currentUser';
      const userName = authUser?.fullName || 'Current User';
      const url = `${environment.apiUrl}/wopi/iframe-url?filename=${encodeURIComponent(this.file.name)}&mode=${mode}&userId=${userId}&userName=${userName}`;
      try {
        const resp = await this.http.get<{ url: string, accessTokenTtl?: number }>(url).toPromise();
        console.log('[WOPI] Collabora iframe URL response:', resp, 'authUser:', authUser);
        const iframeUrl = resp?.url || '';
        console.log('[WOPI] Collabora iframe URL:', iframeUrl);

        
        // this.collaboraUrl = this.sanitizer.bypassSecurityTrustResourceUrl(iframeUrl);
        this.collaboraUrl = this.sanitizer.bypassSecurityTrustResourceUrl(iframeUrl);
        this.startKeepalivePing(); // ✅ Start it immediately after iframe URL is set

        // Start token refresher
        try {
          console.log('[WOPI] Ensuring refresher script is loaded...');
          await this.ensureWopiRefresherLoaded();
          const startRefresher = () => {
            try {
              const win = window as any;
              const frame = this.collaboraFrame?.nativeElement || document.querySelector('iframe');
              if (!win || !win.WopiIframeRefresher) {
                console.warn('[WOPI] Refresher not yet available; retrying shortly');
                setTimeout(startRefresher, 1000);
                return;
              }
              if ((win as any).__wopiRefresherStarted__) {
                return; // avoid duplicate starters
              }
              if (!frame) {
                console.warn('[WOPI] No iframe element found to attach refresher; retrying');
                setTimeout(startRefresher, 500);
                return;
              }
              console.log('[WOPI] Starting WopiIframeRefresher in component------------------', frame);
              const authUser2 = this.authService.getAuthUser();
              const userId2 = authUser2?.id || 'currentUser';
              const userName2 = authUser2?.fullName || 'Current User';
              const isViewer2 = this.authService.hasRole(UserRole.VIEWER);
              win.WopiIframeRefresher.start({
                iframe: frame,
                filename: this.file!.name,
                userId: userId2,
                userName: userName2,
                mode: isViewer2 ? 'view' : 'edit',
                apiBase: environment.apiUrl,
                refreshLeadMs: 15 * 60 * 1000,
                rescueOnLoadMs: 5000,
                keepaliveMs: 2 * 60 * 1000, // 2 minutes
                hardReloadMs: 10 * 60 * 1000, // 10 minutes
                collaboraHardSessionSec: 2 * 60 * 60 // match docker session.expiration if not overridden
              });
              
              (win as any).__wopiRefresherStarted__ = true;
            } catch { }
          };
          startRefresher();
          this.startKeepalivePing();
        } catch { }
      } catch {
        this.viewMode = 'unsupported';
      }
      this.loaded = true;
      // Listen for login from another tab and immediately refresh Collabora URL
      this.setupAuthStorageListener();
      return;
    }

    if (isExcalidraw) {
      this.viewMode = 'excalidraw';
      const fileId = this.base64UrlEncode(this.file.name);
      const url = `http://65.0.4.145:3000/excalidraw?fileId=${encodeURIComponent(fileId)}`;
      this.excalidrawUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      this.loaded = true;
      return;
    }

    // Non-office: use stored content
    const contentUrl = this.file.content as string;
    this.safeImageUrl = this.sanitizer.bypassSecurityTrustUrl(contentUrl);
    this.safeMediaUrl = this.sanitizer.bypassSecurityTrustUrl(contentUrl);
    this.safeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(contentUrl);

    if (this.file.mimeType.startsWith('image/')) {
      this.viewMode = 'image';
    } else if (nameLower.endsWith('.md') || nameLower.endsWith('.markdown')) {
      this.viewMode = 'markdown';
      try {
        const { marked } = await import('marked');
        const text = this.getTextContent();
        const html = marked.parse(text);
        this.renderedMarkdown = this.sanitizer.bypassSecurityTrustHtml(html as string);
      } catch {
        this.viewMode = 'text';
      }
    } else if (this.file.mimeType.startsWith('text/') || nameLower.endsWith('.txt') || nameLower.endsWith('.csv') || nameLower.endsWith('.log')) {
      this.viewMode = 'text';
    } else if (nameLower.endsWith('.pdf') || this.file.mimeType === 'application/pdf') {
      this.viewMode = 'pdf';
    } else if (this.file.mimeType.startsWith('audio/')) {
      this.viewMode = 'audio';
    } else if (this.file.mimeType.startsWith('video/')) {
      this.viewMode = 'video';
    } else {
      this.viewMode = 'unsupported';
    }

    this.loaded = true;
  }

  getTextContent(): string {
    if (!this.file) return '';
    try {
      const content = this.file.content as string;
      if (content.startsWith('data:')) {
        const base64 = content.split(',')[1] || '';
        const decoded = atob(base64);
        return decoded;
      }
      return content;
    } catch {
      return '';
    }
  }

  async onIframeLoad(event: Event) {
    try {
      const iframe = event.target as HTMLIFrameElement;
      if (!iframe || !iframe.contentWindow) return;

      console.log('[WOPI] iframe load event fired');

      // Extra keepalive ping
      // this.startKeepalivePing(); // ← ADD THIS LINE

      // Attempt cross-origin safe operations
      const win = iframe.contentWindow as Window;
      const mod = await import('../../shared/collabora-helper');
      await mod.tryCloseWelcomeOverlay(win).catch(() => { });
      await mod.waitSpreadsheetReadyAndFocusA1(win).catch(() => { });
    } catch {
      console.log('[WOPI] iframe load event fcatch --------ired error');
      // ignore cross-origin or other errors
    }
  }


  // async onIframeLoad(event: Event) {
  //   try {
  //     const iframe = event.target as HTMLIFrameElement;
  //     if (!iframe || !iframe.contentWindow) {
  //       return;
  //     }
  //     console.log('[WOPI] iframe load event fired');
  //     // Attempt cross-origin safe operations; will no-op if blocked
  //     const win = iframe.contentWindow as Window;
  //     const mod = await import('../../shared/collabora-helper');
  //     await mod.tryCloseWelcomeOverlay(win).catch(() => {});
  //     await mod.waitSpreadsheetReadyAndFocusA1(win).catch(() => {});
  //   } catch {
  //     // ignore cross-origin or other errors
  //   }
  // }

  goBack() {
    this.router.navigate(['/documents/files']);
  }

  ngOnDestroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    if (this.keepaliveIntervalId) {
      clearInterval(this.keepaliveIntervalId);
      this.keepaliveIntervalId = null;
    }
    try {
      if (this.wopiRefreshHandler) window.removeEventListener('wopi-refresh', this.wopiRefreshHandler as any);
    } catch { }
    if (this.refreshBannerTimer) {
      clearTimeout(this.refreshBannerTimer);
      this.refreshBannerTimer = null;
    }
    try {
      if (this.storageListener) window.removeEventListener('storage', this.storageListener as any);
    } catch { }
  }

  private startWopiSync(): void {
    if (!this.file) return;
    const wopiId = this.base64UrlEncode(this.file.name);
    const checkInfoUrl = `${environment.apiUrl}/wopi/files/${wopiId}`;
    const contentsUrl = `${environment.apiUrl}/wopi/files/${wopiId}/contents`;

    const tick = async () => {
      try {
        const info: any = await this.http.get(checkInfoUrl, { responseType: 'json' as any }).toPromise();
        const currentVersion = (info && (info.Version || info.LastModifiedTime)) ? String(info.Version || info.LastModifiedTime) : null;
        if (!currentVersion) return;
        if (this.lastServerVersion && this.lastServerVersion === currentVersion) {
          return; // no change
        }
        this.lastServerVersion = currentVersion;
        // Fetch latest bytes and update local storage
        const arrayBuffer = await this.http.get(contentsUrl, { responseType: 'arraybuffer' }).toPromise();
        const mime = this.file?.mimeType || 'application/octet-stream';
        await this.storage.updateFileBinary(this.file!.id, arrayBuffer as ArrayBuffer, mime, info?.LastModifiedTime);
      } catch {
        // ignore transient errors
      }
    };

    // Initial sync immediately, then poll
    tick();
    this.syncTimer = setInterval(tick, 3000);
  }

  private base64UrlEncode(input: string): string {
    const base64 = btoa(unescape(encodeURIComponent(input)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  private getApiRoot(): string {
    try {
      const url = String(environment.apiUrl || '/api');
      return url.replace(/\/?api\/?$/, '');
    } catch {
      return '';
    }
  }

  private ensureWopiRefresherLoaded(): Promise<void> {
    return new Promise((resolve) => {
      try {
        const w: any = window as any;
        if (w && w.WopiIframeRefresher) return resolve();
        const existing = document.querySelector('script[data-wopi-refresher]') as HTMLScriptElement | null;
        if (existing) {
          existing.addEventListener('load', () => resolve());
          existing.addEventListener('error', () => resolve());
          return;
        }
        const s = document.createElement('script');
        s.setAttribute('data-wopi-refresher', '1');
        s.async = true;
        const root = this.getApiRoot();
        s.src = (root || '') + '/public/wopi-iframe-refresh.js';
        s.onload = () => resolve();
        s.onerror = () => resolve();
        document.head.appendChild(s);
      } catch {
        resolve();
      }
    });
  }

  private setBanner(text: string) {
    this.refreshBannerText = text;
    this.showRefreshBanner = true;
  }
  private hideBanner() {
    this.showRefreshBanner = false;
    this.refreshBannerText = '';
  }

  private setupAuthStorageListener() {
    try {
      this.storageListener = (e: StorageEvent) => {
        try {
          if (e.key === 'auth_user' && e.newValue) {
            this.setBanner('Signed in. Resuming editor...');
            this.refreshCollaboraUrl();
          }
        } catch { }
      };
      window.addEventListener('storage', this.storageListener as any);
    } catch { }
  }

  private async refreshCollaboraUrl() {
    try {
      if (!this.file) return;
      const isViewer = this.authService.hasRole(UserRole.VIEWER);
      const mode = isViewer ? 'view' : 'edit';
      const authUser = this.authService.getAuthUser();
      const userId = authUser?.id || 'currentUser';
      const userName = authUser?.fullName || 'Current User';
      const url = `${environment.apiUrl}/wopi/refresh-token?filename=${encodeURIComponent(this.file.name)}&mode=${mode}&userId=${userId}&userName=${userName}`;
      const resp = await this.http.get<{ url: string, accessTokenTtl?: number }>(url).toPromise();
      const newUrl0 = String(resp?.url || '');
      const newUrl = newUrl0 ? `${newUrl0}${newUrl0.includes('?') ? '&' : '?'}_ts=${Date.now()}` : '';
      if (!newUrl) return;
      const frame = this.collaboraFrame?.nativeElement;
      if (frame) {
        if (frame?.src !== newUrl) {
          frame.src = newUrl;
          console.log('[WOPI] iframe src updated');
        } else {
          console.log('[WOPI] token refreshed but url same — no reload');
        }
      }
     
      
      this.collaboraUrl = this.sanitizer.bypassSecurityTrustResourceUrl(newUrl);
      if (this.refreshBannerTimer) clearTimeout(this.refreshBannerTimer);
      this.refreshBannerTimer = setTimeout(() => this.hideBanner(), 1500);
    } catch { }
  }
}


