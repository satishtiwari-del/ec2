import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, throwError, of, from } from 'rxjs';
import { catchError, switchMap, tap, map, filter, finalize } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface DownloadProgress {
  percentage: number;
  loaded: number;
  total: number;
}

export interface BatchDownloadOptions {
  version?: string;
  targetFormat?: string;
  compressionType?: 'zip' | 'tar';
  preserveFolderStructure?: boolean;
  onProgress?: (progress: DownloadProgress) => void;
}

export interface FolderDownloadOptions {
  recursive?: boolean;
  includeEmptyFolders?: boolean;
  compressionType?: 'zip' | 'tar';
  onProgress?: (progress: DownloadProgress) => void;
}

@Injectable({
  providedIn: 'root'
})
export class FileDownloadService {
  private readonly apiUrl = `${environment.apiUrl}/files`;

  constructor(private http: HttpClient) {}

  downloadFile(fileId: string, options: BatchDownloadOptions = {}): Observable<Blob> {
    return this.checkAccess(fileId).pipe(
      switchMap(hasAccess => {
        if (!hasAccess) {
          return throwError(() => new Error('Access denied'));
        }
        return this.performDownload(fileId, options).pipe(
          switchMap(blob => {
            return this.logActivity(fileId).pipe(
              map(() => blob)
            );
          })
        );
      })
    );
  }

  private checkAccess(fileId: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/${fileId}/access-check`).pipe(
      catchError(() => of(false))
    );
  }

  private performDownload(fileId: string, options: BatchDownloadOptions): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${fileId}/download${this.buildQueryParams(options)}`, {
      responseType: 'blob',
      observe: 'events',
      reportProgress: true
    }).pipe(
      tap(event => {
        if (event.type === HttpEventType.DownloadProgress && options.onProgress) {
          const total = event.total || 0;
          options.onProgress({
            loaded: event.loaded,
            total,
            percentage: total ? Math.round((event.loaded * 100) / total) : 0
          });
        }
      }),
      filter(event => event.type === HttpEventType.Response),
      map(event => {
        if (!event.body) {
          throw new Error('Download failed');
        }
        return event.body;
      }),
      catchError(error => {
        if (error instanceof HttpErrorResponse) {
          if (error.status === 408) {
            const err = new Error('Download timeout');
            (err as any).status = error.status;
            return throwError(() => err);
          }
          if (error.status === 500) {
            const err = new Error('Internal server error');
            (err as any).status = error.status;
            return throwError(() => err);
          }
          if (error.status === 404 && options.version) {
            const err = new Error('Version not found');
            (err as any).status = error.status;
            return throwError(() => err);
          }
          // For HTTP errors with ErrorEvent
          if (error.error instanceof ErrorEvent) {
            return throwError(() => new Error('Network error'));
          }
          // For other HTTP errors, preserve the original error
          return throwError(() => error);
        }
        // For non-HTTP errors with Error object
        if (error instanceof ErrorEvent && error.error instanceof Error) {
          const originalError = error.error;
          if (!originalError.message) {
            return throwError(() => new Error('Network error'));
          }
          return throwError(() => new Error(originalError.message || 'Network error'));
        }
        // For network errors
        if (error instanceof ErrorEvent) {
          return throwError(() => new Error('Network error'));
        }
        // For other types of errors, create a new Error
        return throwError(() => new Error(error.message || 'Network error'));
      })
    );
  }

  private logActivity(fileId: string): Observable<void> {
    return this.http.get<void>(`${this.apiUrl}/${fileId}/activity`).pipe(
      catchError(() => of(void 0)) // Ignore activity logging errors
    );
  }

  downloadMultipleFiles(fileIds: string[], options: BatchDownloadOptions = {}): Observable<Blob> {
    if (!fileIds || fileIds.length === 0) {
      return throwError(() => new Error('No files selected for download'));
    }

    return this.http.post(`${this.apiUrl}/batch-download`, {
      fileIds,
      compressionType: options.compressionType,
      version: options.version,
      targetFormat: options.targetFormat
    }, {
      responseType: 'blob',
      observe: 'events',
      reportProgress: true
    }).pipe(
      tap(event => {
        if (event.type === HttpEventType.DownloadProgress && options.onProgress) {
          const total = event.total || 0;
          options.onProgress({
            loaded: event.loaded,
            total,
            percentage: total ? Math.round((event.loaded * 100) / total) : 0
          });
        }
      }),
      filter(event => event.type === HttpEventType.Response),
      map(event => {
        if (!event.body) {
          throw new Error('Download failed');
        }
        return event.body;
      }),
      catchError(error => {
        if (error instanceof HttpErrorResponse) {
          if (error.status === 429) {
            const err = new Error('Too many concurrent downloads');
            (err as any).status = error.status;
            return throwError(() => err);
          }
          if (error.status === 413) {
            const err = new Error('Package size exceeds limit');
            (err as any).status = error.status;
            return throwError(() => err);
          }
          // For non-specific HTTP errors, return the original ErrorEvent
          if (error.error instanceof ErrorEvent) {
            return throwError(() => error.error);
          }
          return throwError(() => error);
        }
        return throwError(() => error);
      })
    );
  }

  downloadFolder(folderId: string, options: FolderDownloadOptions = {}): Observable<Blob> {
    const params = new URLSearchParams({
      recursive: (options.recursive || false).toString(),
      includeEmpty: (options.includeEmptyFolders || false).toString(),
      compressionType: options.compressionType || 'zip'
    });

    return this.http.get(`${this.apiUrl}/folders/${folderId}/download?${params.toString()}`, {
      responseType: 'blob',
      observe: 'events',
      reportProgress: true
    }).pipe(
      tap(event => {
        if (event.type === HttpEventType.DownloadProgress && options.onProgress) {
          const total = event.total || 0;
          options.onProgress({
            loaded: event.loaded,
            total,
            percentage: total ? Math.round((event.loaded * 100) / total) : 0
          });
        }
      }),
      filter(event => event.type === HttpEventType.Response),
      map(event => {
        if (!event.body) {
          throw new Error('Download failed');
        }
        return event.body;
      }),
      catchError(error => {
        if (error instanceof HttpErrorResponse) {
          if (error.status === 403) {
            const err = new Error('Permission denied');
            (err as any).status = error.status;
            return throwError(() => err);
          }
          if (error.status === 409) {
            const err = new Error('Folder structure changed');
            (err as any).status = error.status;
            return throwError(() => err);
          }
          // For HTTP errors with ErrorEvent
          if (error.error instanceof ErrorEvent) {
            return throwError(() => new Error('Download failed'));
          }
          // For other HTTP errors, preserve the original error
          return throwError(() => error);
        }
        // For non-HTTP errors with Error object
        if (error instanceof ErrorEvent && error.error instanceof Error) {
          const originalError = error.error;
          if (!originalError.message) {
            return throwError(() => new Error('Network error'));
          }
          return throwError(() => originalError);
        }
        // For network errors
        if (error instanceof ErrorEvent) {
          return throwError(() => new Error('Network error'));
        }
        // For other types of errors, create a new Error
        return throwError(() => new Error(error.message || 'Network error'));
      })
    );
  }

  private buildQueryParams(options: BatchDownloadOptions): string {
    const params = new URLSearchParams();
    if (options.version) params.set('version', options.version);
    if (options.targetFormat) params.set('format', options.targetFormat);
    if (options.preserveFolderStructure) params.set('preserveStructure', 'true');
    return params.toString() ? `?${params.toString()}` : '';
  }
} 