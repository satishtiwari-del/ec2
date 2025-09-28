import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface DownloadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

export interface DownloadOptions {
  version?: string;
  targetFormat?: string;
  onProgress?: (progress: DownloadProgress) => void;
}

export interface BatchDownloadOptions extends DownloadOptions {
  compressionType?: 'zip' | 'tar';
}

export interface FolderDownloadOptions extends BatchDownloadOptions {
  recursive?: boolean;
  includeEmptyFolders?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MockFileDownloadService {
  private readonly mockDelay = 100;
  private readonly mockFiles = new Map<string, Blob>();
  private readonly mockVersions = new Map<string, Map<string, Blob>>();

  downloadFile(fileId: string, options?: DownloadOptions): Observable<Blob> {
    const file = this.mockFiles.get(fileId);
    if (!file) {
      return throwError(() => new Error('File not found'));
    }

    if (options?.version) {
      const versions = this.mockVersions.get(fileId);
      if (!versions || !versions.has(options.version)) {
        return throwError(() => new Error('Version not found'));
      }
      return of(versions.get(options.version)!).pipe(delay(this.mockDelay));
    }

    if (options?.onProgress) {
      const totalBytes = file.size;
      const steps = 4;
      for (let i = 1; i <= steps; i++) {
        setTimeout(() => {
          options.onProgress!({
            bytesTransferred: (totalBytes * i) / steps,
            totalBytes,
            percentage: (i * 100) / steps
          });
        }, this.mockDelay * i);
      }
    }

    return of(file).pipe(delay(this.mockDelay));
  }

  downloadMultipleFiles(fileIds: string[], options?: BatchDownloadOptions): Observable<Blob> {
    const files = fileIds.map(id => this.mockFiles.get(id));
    if (files.some(f => !f)) {
      return throwError(() => new Error('One or more files not found'));
    }

    // Create a zip/tar archive of the files
    const archive = new Blob(files.filter((f): f is Blob => f !== undefined), { type: 'application/zip' });
    return of(archive).pipe(delay(this.mockDelay));
  }

  downloadFolder(folderId: string, options?: FolderDownloadOptions): Observable<Blob> {
    // Mock folder content
    const folderFiles = Array.from(this.mockFiles.values());
    if (folderFiles.length === 0) {
      return throwError(() => new Error('Folder is empty'));
    }

    // Create archive with folder structure
    const archive = new Blob(folderFiles, { type: 'application/zip' });
    return of(archive).pipe(delay(this.mockDelay));
  }

  validateAccess(fileId: string): Observable<boolean> {
    return of(true).pipe(delay(this.mockDelay));
  }

  logDownloadActivity(fileId: string): Observable<void> {
    return of(void 0).pipe(delay(this.mockDelay));
  }

  // Helper methods for testing
  addMockFile(fileId: string, content: Blob): void {
    this.mockFiles.set(fileId, content);
  }

  addMockVersion(fileId: string, version: string, content: Blob): void {
    if (!this.mockVersions.has(fileId)) {
      this.mockVersions.set(fileId, new Map());
    }
    this.mockVersions.get(fileId)!.set(version, content);
  }

  clearMocks(): void {
    this.mockFiles.clear();
    this.mockVersions.clear();
  }
} 