import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface PreviewOptions {
  quality?: 'low' | 'medium' | 'high';
  page?: number;
  zoom?: number;
  watermark?: WatermarkOptions;
  annotations?: boolean;
  cacheKey?: string;
}

export interface PreviewResult {
  content: Blob;
  metadata: PreviewMetadata;
  pages?: number;
  searchable?: boolean;
  annotatable?: boolean;
}

export interface PreviewMetadata {
  fileId: string;
  version: string;
  mimeType: string;
  size: number;
  lastModified: Date;
  previewType: PreviewType;
}

export interface Annotation {
  id: string;
  fileId: string;
  page: number;
  type: AnnotationType;
  content: string;
  position: Position;
  author: string;
  timestamp: Date;
  replies?: Annotation[];
}

export interface WatermarkOptions {
  text: string;
  position: 'center' | 'diagonal' | 'tile';
  opacity: number;
  fontSize: number;
  color: string;
}

export interface SearchResult {
  page: number;
  position: Position;
  context: string;
}

export interface Position {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export type PreviewType = 'pdf' | 'markdown' | 'csv' | 'none';
export type AnnotationType = 'note' | 'highlight' | 'drawing';

@Injectable({
  providedIn: 'root'
})
export class FilePreviewService {
  private readonly apiUrl = `${environment.apiUrl}/preview`;
  private readonly maxPreviewSize = 100 * 1024 * 1024; // 100MB
  private readonly previewTimeout = 30000; // 30 seconds

  constructor(private http: HttpClient) {}

  getPreview(fileId: string, options: PreviewOptions): Observable<PreviewResult> {
    if (!fileId) {
      return throwError(() => new Error('File ID is required'));
    }

    const params = new URLSearchParams();
    if (options.quality) params.set('quality', options.quality);
    if (options.page) params.set('page', options.page.toString());
    if (options.zoom) params.set('zoom', options.zoom.toString());
    if (options.annotations !== undefined) params.set('annotations', options.annotations.toString());
    if (options.cacheKey) params.set('cacheKey', options.cacheKey);

    if (options.watermark) {
      params.set('watermark', JSON.stringify(options.watermark));
    }

    return this.http.get(`${this.apiUrl}/${fileId}?${params.toString()}`, {
      observe: 'response',
      responseType: 'blob'
    }).pipe(
      map(response => {
        const metadata = {
          fileId: fileId,
          version: response.headers.get('x-preview-version') || '1.0',
          mimeType: response.headers.get('content-type') || 'application/pdf',
          size: parseInt(response.headers.get('content-length') || '0', 10),
          lastModified: new Date(response.headers.get('last-modified') || new Date().toISOString()),
          previewType: (response.headers.get('x-preview-type') || 'pdf') as PreviewType
        };

        return {
          content: response.body as Blob,
          metadata: metadata,
          pages: parseInt(response.headers.get('x-preview-pages') || '1', 10),
          searchable: response.headers.get('x-preview-searchable') === 'true',
          annotatable: response.headers.get('x-preview-annotatable') === 'true'
        };
      }),
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status > 0) {
          switch (error.status) {
            case 413:
              return throwError(() => new Error('File too large for preview'));
            case 415:
              return throwError(() => new Error('File type not supported for preview'));
            case 408:
              return throwError(() => new Error('Preview generation timed out'));
            case 422:
              return throwError(() => new Error('Preview data corrupted'));
            default:
              return throwError(() => error);
          }
        }
        return throwError(() => new Error('Failed to generate preview'));
      })
    );
  }

  getAnnotations(fileId: string): Observable<Annotation[]> {
    return this.http.get<Annotation[]>(`${this.apiUrl}/${fileId}/annotations`).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status > 0) {
          switch (error.status) {
            case 404:
              return throwError(() => new Error('Page not found'));
            case 400:
              return throwError(() => new Error('Invalid annotation position'));
            default:
              return throwError(() => error);
          }
        }
        return throwError(() => new Error('Failed to get annotations'));
      })
    );
  }

  addAnnotation(fileId: string, annotation: Annotation): Observable<Annotation> {
    return this.http.post<Annotation>(`${this.apiUrl}/${fileId}/annotations`, annotation).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status > 0) {
          switch (error.status) {
            case 409:
              return throwError(() => new Error('Annotation limit exceeded'));
            case 400:
              return throwError(() => new Error('Invalid annotation position'));
            case 404:
              return throwError(() => new Error('Page not found'));
            default:
              return throwError(() => error);
          }
        }
        return throwError(() => new Error('Failed to add annotation'));
      })
    );
  }

  searchContent(fileId: string, query: string): Observable<SearchResult[]> {
    if (!query) {
      return of([]);
    }

    return this.http.get<SearchResult[]>(`${this.apiUrl}/${fileId}/search`, {
      params: { query }
    }).pipe(
      map(results => results.slice(0, 100)), // Limit to 100 matches
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status > 0) {
          switch (error.status) {
            case 400:
              return throwError(() => new Error('Invalid search query'));
            case 501:
              return throwError(() => new Error('Document is not searchable'));
            default:
              return throwError(() => error);
          }
        }
        return throwError(() => new Error('Failed to search content'));
      })
    );
  }

  generateThumbnail(fileId: string, size: { width: number; height: number }): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${fileId}/thumbnail`, {
      params: {
        width: size.width.toString(),
        height: size.height.toString()
      },
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      map(response => response.body as Blob),
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status > 0) {
          switch (error.status) {
            case 400:
              return throwError(() => new Error('Invalid thumbnail dimensions'));
            case 501:
              return throwError(() => new Error('Unsupported thumbnail format'));
            default:
              return throwError(() => error);
          }
        }
        return throwError(() => new Error('Failed to generate thumbnail'));
      })
    );
  }

  navigateToPage(page: number): void {
    if (page < 0) {
      console.warn('Invalid page number:', page);
      return;
    }
    window.dispatchEvent(new CustomEvent('preview-navigate', { detail: { page } }));
  }

  highlightText(position: Position): void {
    if (position.x < 0 || position.y < 0 || (position.width && position.width < 0) || (position.height && position.height < 0)) {
      console.warn('Invalid highlight position:', position);
      return;
    }
    window.dispatchEvent(new CustomEvent('preview-highlight', { detail: { position } }));
  }
} 