import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { FileContextMetadata } from '../storage/storage.model';
import { LocalStorageService } from '../storage/local-storage.service';
import { FilePreviewService } from './file-preview.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FileOperationsService {
  constructor(
    private localStorage: LocalStorageService,
    private filePreview: FilePreviewService,
    private http: HttpClient
  ) {}

  preview(file: FileContextMetadata): Observable<void> {
    return this.filePreview.openPreview(file);
  }

  download(file: FileContextMetadata): Observable<void> {
    return from(this.localStorage.downloadFile(file.id)).pipe(
      map(() => void 0)
    );
  }

  edit(file: FileContextMetadata): Observable<void> {
    // Route markdown files to ProseMirror editor; others to Collabora/preview
    const name = (file.name || '').toLowerCase();
    if (name.endsWith('.md') || name.endsWith('.markdown')) {
      return this.filePreview.openInProseMirror(file);
    }
    return this.filePreview.openInCollabora(file);
  }

  delete(file: FileContextMetadata): Observable<void> {
    return from(Promise.resolve(this.localStorage.deleteFile(file.id))).pipe(
      map(() => void 0)
    );
  }

  uploadToServer(file: File): Observable<{ success: boolean; path: string }> {
    const url = `${environment.apiUrl}/documents/upload?filename=${encodeURIComponent(file.name)}`;
    return this.http.post<{ success: boolean; path: string }>(url, file, {
      headers: { 'Content-Type': file.type || 'application/octet-stream' }
    });
  }
}