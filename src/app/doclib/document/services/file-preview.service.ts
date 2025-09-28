import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { FileContextMetadata } from '../storage/storage.model';
import { FilePreviewDialogComponent } from '../storage/file-preview-dialog/file-preview-dialog.component';
import { LocalStorageService } from '../storage/local-storage.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class FilePreviewService {
  constructor(
    private dialog: MatDialog,
    private localStorage: LocalStorageService,
    private http: HttpClient,
    private router: Router
  ) {}

  openPreview(file: FileContextMetadata): Observable<void> {
    // console.log("file👥👥👥👥👥=============================", file)
    const storedFile = this.localStorage.getFile(file.id);
    if (!storedFile) {
      return throwError(() => new Error('File not found'));
    }

    // Route to a dedicated preview page
    this.router.navigate(['/documents/preview', storedFile.id]);
    return from(Promise.resolve());
  }

  openInCollabora(file: FileContextMetadata): Observable<void> {
    // Route to preview page; that component will decide Collabora vs native and may switch to edit mode later
    const storedFile = this.localStorage.getFile(file.id);
    if (!storedFile) {
      return throwError(() => new Error('File not found'));
    }
    this.router.navigate(['/documents/preview', storedFile.id]);
    return from(Promise.resolve());
  }

  openInProseMirror(file: FileContextMetadata): Observable<void> {
    const storedFile = this.localStorage.getFile(file.id);
    if (!storedFile) {
      return throwError(() => new Error('File not found'));
    }

    try {
      const markdown = this.extractMarkdownString(storedFile.content, storedFile.mimeType || '', storedFile.name || '');
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('mdFileContent', markdown);
      }
    } catch (e) {
      return throwError(() => new Error('Failed to decode markdown content'));
    }

    this.router.navigate(['/documents/editor']);
    return from(Promise.resolve());
  }

  private extractMarkdownString(content: string | ArrayBuffer, mimeType: string, fileName: string): string {
    // If it's a Data URL, decode base64/text payload
    if (typeof content === 'string' && content.startsWith('data:')) {
      const commaIndex = content.indexOf(',');
      const header = content.substring(0, commaIndex);
      const dataPart = content.substring(commaIndex + 1);
      const isBase64 = /;base64$/i.test(header) || /;base64;/i.test(header);
      if (isBase64) {
        const binary = atob(dataPart);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return new TextDecoder('utf-8').decode(bytes);
      }
      // Not base64; it's URL-encoded text
      try {
        return decodeURIComponent(dataPart);
      } catch {
        return dataPart;
      }
    }

    if (typeof content === 'string') {
      return content;
    }

    if (content instanceof ArrayBuffer) {
      return new TextDecoder('utf-8').decode(new Uint8Array(content));
    }

    // Fallback: empty string
    return '';
  }
}

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-collabora-editor-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content style="height: calc(90vh - 120px); padding: 0;">
      <iframe [src]="safeUrl" style="border:0; width:100%; height:100%"></iframe>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `
})
export class CollaboraEditorDialogComponent {
  safeUrl: SafeResourceUrl;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { title: string; iframeUrl: string },
    private sanitizer: DomSanitizer
  ) {
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(data.iframeUrl);
  }
}