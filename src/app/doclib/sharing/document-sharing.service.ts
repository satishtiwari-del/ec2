import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of, forkJoin } from 'rxjs';
import { map, catchError, tap, switchMap, mergeMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ShareSettings {
  recipientIds: string[];
  permissionLevel: 'view' | 'edit';
  expirationDate?: Date;
  message?: string;
}

export interface ShareLink {
  id: string;
  url: string;
  expirationDate?: Date;
  password?: string;
  usageLimit?: number;
  usageCount: number;
  createdAt: Date;
}

export interface ShareActivity {
  id: string;
  documentId: string;
  userId: string;
  action: 'view' | 'download' | 'edit';
  timestamp: Date;
  details?: any;
}

export interface SharePermission {
  userId: string;
  documentId: string;
  level: 'view' | 'edit';
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
}

export interface NotificationSettings {
  recipientIds: string[];
  message?: string;
  documentIds: string[];
  type: 'share' | 'update' | 'revoke';
}

@Injectable({
  providedIn: 'root'
})
export class DocumentSharingService {
  private readonly apiUrl = `${environment.apiUrl}/sharing`;

  constructor(private http: HttpClient) {}

  // UC-DS-01: Share Single Document
  shareDocument(documentId: string, settings: ShareSettings): Observable<void> {
    return this.validateRecipientPermissions(settings.recipientIds).pipe(
      switchMap(isValid => {
        if (!isValid) {
          return throwError(() => new Error('Invalid recipients or insufficient permissions'));
        }

        const shareRequest = {
          documentId,
          ...settings,
          grantedAt: new Date()
        };

        return this.http.post<void>(`${this.apiUrl}/documents/${documentId}/share`, shareRequest).pipe(
          switchMap(() => {
            if (settings.message) {
              return this.notifyRecipients(documentId, settings.recipientIds, settings.message);
            }
            return of(void 0);
          }),
          catchError(error => {
            if (error instanceof HttpErrorResponse) {
              return throwError(() => error);
            }
            return throwError(() => new Error('Failed to share document'));
          })
        );
      })
    );
  }

  validateRecipientPermissions(recipientIds: string[]): Observable<boolean> {
    if (!recipientIds.length) {
      return of(false);
    }

    return this.http.post<{ valid: boolean }>(`${this.apiUrl}/validate-recipients`, { recipientIds }).pipe(
      map(response => response.valid),
      catchError(() => of(false))
    );
  }

  setShareExpiration(documentId: string, expirationDate: Date): Observable<void> {
    if (!expirationDate || expirationDate.getTime() <= Date.now()) {
      return throwError(() => new Error('Invalid expiration date'));
    }

    return this.http.put<void>(`${this.apiUrl}/documents/${documentId}/expiration`, { expirationDate }).pipe(
      catchError(() => throwError(() => new Error('Failed to set expiration date')))
    );
  }

  notifyRecipients(documentId: string, recipientIds: string[], message?: string): Observable<void> {
    const notification: NotificationSettings = {
      recipientIds,
      documentIds: [documentId],
      message,
      type: 'share'
    };

    return this.http.post<void>(`${this.apiUrl}/notify`, notification).pipe(
      catchError(() => throwError(() => new Error('Failed to notify recipients')))
    );
  }

  // UC-DS-02: Share Multiple Documents
  shareMultipleDocuments(documentIds: string[], settings: ShareSettings): Observable<void> {
    return this.validateRecipientPermissions(settings.recipientIds).pipe(
      switchMap(isValid => {
        if (!isValid) {
          return throwError(() => new Error('Invalid recipients or insufficient permissions'));
        }

        const shareRequests = documentIds.map(documentId => {
          const shareRequest = {
            documentId,
            ...settings,
            grantedAt: new Date()
          };
          return this.http.post<void>(`${this.apiUrl}/documents/${documentId}/share`, shareRequest);
        });

        return shareRequests[0].pipe(
          mergeMap(() => shareRequests.slice(1).length > 0 ? shareRequests.slice(1)[0] : of(void 0)),
          switchMap(() => {
            if (settings.message) {
              return this.batchNotifyRecipients(documentIds, settings.recipientIds, settings.message);
            }
            return of(void 0);
          }),
          catchError(error => {
            const results = new Map(documentIds.map(id => [id, false]));
            return this.handlePartialSharingFailures(results);
          })
        );
      })
    );
  }

  handlePartialSharingFailures(results: Map<string, boolean>): Observable<void> {
    const failedDocuments = Array.from(results.entries())
      .filter(([, success]) => !success)
      .map(([docId]) => docId);

    if (failedDocuments.length) {
      return this.http.post<void>(`${this.apiUrl}/handle-failures`, { failedDocuments }).pipe(
        catchError(() => throwError(() => new Error('Failed to handle sharing failures')))
      );
    }

    return of(void 0);
  }

  applyCommonPermissions(documentIds: string[], permissions: SharePermission[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/apply-permissions`, { documentIds, permissions }).pipe(
      catchError(() => throwError(() => new Error('Failed to apply common permissions')))
    );
  }

  batchNotifyRecipients(documentIds: string[], recipientIds: string[], message?: string): Observable<void> {
    const notification: NotificationSettings = {
      recipientIds,
      documentIds,
      message,
      type: 'share'
    };

    return this.http.post<void>(`${this.apiUrl}/batch-notify`, notification).pipe(
      catchError(() => throwError(() => new Error('Failed to notify recipients')))
    );
  }

  // UC-DS-03: Generate Share Link
  generateShareLink(documentId: string, options?: Partial<ShareLink>): Observable<ShareLink> {
    const request = {
      documentId,
      ...options,
      createdAt: new Date()
    };

    return this.http.post<ShareLink>(`${this.apiUrl}/links/generate`, request).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse) {
          return throwError(() => error);
        }
        return throwError(() => new Error('Failed to generate share link'));
      })
    );
  }

  setLinkExpiration(linkId: string, expirationDate: Date): Observable<void> {
    if (!expirationDate || expirationDate.getTime() <= Date.now()) {
      return throwError(() => new Error('Invalid expiration date'));
    }

    return this.http.put<void>(`${this.apiUrl}/links/${linkId}/expiration`, { expirationDate }).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse) {
          return throwError(() => error);
        }
        return throwError(() => new Error('Failed to set link expiration'));
      })
    );
  }

  configurePasswordProtection(linkId: string, password: string): Observable<void> {
    if (!password || password.length < 8) {
      return throwError(() => new Error('Invalid password - must be at least 8 characters'));
    }

    return this.http.put<void>(`${this.apiUrl}/links/${linkId}/password`, { password }).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse) {
          return throwError(() => error);
        }
        return throwError(() => new Error('Failed to set password protection'));
      })
    );
  }

  trackLinkUsage(linkId: string): Observable<number> {
    return this.http.get<{ usageCount: number }>(`${this.apiUrl}/links/${linkId}/usage`).pipe(
      map(response => response.usageCount),
      catchError(error => {
        if (error instanceof HttpErrorResponse) {
          return throwError(() => error);
        }
        return throwError(() => new Error('Failed to track link usage'));
      })
    );
  }

  // UC-DS-04: Manage Shared Access
  modifySharePermissions(documentId: string, changes: Partial<SharePermission>[]): Observable<void> {
    return this.handlePermissionDependencies(documentId, changes).pipe(
      switchMap(() => {
        return this.http.put<void>(`${this.apiUrl}/documents/${documentId}/permissions`, { changes }).pipe(
          tap(() => {
            const affectedUserIds = changes
              .map(change => change.userId)
              .filter((userId): userId is string => userId !== undefined); // Type guard to ensure non-undefined
            this.notifyPermissionChanges(documentId, affectedUserIds).subscribe();
          }),
          catchError(error => {
            if (error instanceof HttpErrorResponse) {
              return throwError(() => error);
            }
            return throwError(() => new Error('Failed to modify permissions'));
          })
        );
      })
    );
  }

  revokeAccess(documentId: string, userIds: string[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/documents/${documentId}/revoke`, { userIds }).pipe(
      switchMap(() => {
        const notification: NotificationSettings = {
          recipientIds: userIds,
          documentIds: [documentId],
          type: 'revoke'
        };
        return this.http.post<void>(`${this.apiUrl}/notify`, notification);
      }),
      catchError(error => {
        if (error instanceof HttpErrorResponse) {
          return throwError(() => error);
        }
        return throwError(() => new Error('Failed to revoke access'));
      })
    );
  }

  handlePermissionDependencies(documentId: string, changes: Partial<SharePermission>[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/documents/${documentId}/validate-dependencies`, { changes }).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 409) {
          return throwError(() => new Error('Permission changes conflict with existing dependencies'));
        }
        return throwError(() => new Error('Failed to validate permission dependencies'));
      })
    );
  }

  notifyPermissionChanges(documentId: string, affectedUserIds: string[]): Observable<void> {
    const notification: NotificationSettings = {
      recipientIds: affectedUserIds,
      documentIds: [documentId],
      type: 'update'
    };

    return this.http.post<void>(`${this.apiUrl}/notify`, notification).pipe(
      catchError(() => throwError(() => new Error('Failed to notify permission changes')))
    );
  }

  // UC-DS-05: Share Activity Monitoring
  trackDocumentAccess(documentId: string): Observable<ShareActivity[]> {
    return this.http.get<ShareActivity[]>(`${this.apiUrl}/documents/${documentId}/activity`).pipe(
      catchError(() => throwError(() => new Error('Failed to track document access')))
    );
  }

  generateActivityReports(documentIds: string[], dateRange: { start: Date; end: Date }): Observable<ShareActivity[]> {
    if (dateRange.start > dateRange.end) {
      return throwError(() => new Error('Invalid date range'));
    }

    return this.http.post<ShareActivity[]>(`${this.apiUrl}/reports/activity`, { documentIds, dateRange }).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse) {
          return throwError(() => new Error('Failed to generate activity reports'));
        }
        return throwError(() => error);
      })
    );
  }

  monitorLinkUsage(linkId: string): Observable<ShareActivity[]> {
    return this.http.get<ShareActivity[]>(`${this.apiUrl}/links/${linkId}/activity`).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse) {
          return throwError(() => error);
        }
        return throwError(() => new Error('Failed to monitor link usage'));
      })
    );
  }

  exportActivityData(documentIds: string[], format: 'csv' | 'pdf'): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/reports/export`, { documentIds, format }, {
      responseType: 'blob'
    }).pipe(
      catchError(() => throwError(() => new Error('Failed to export activity data')))
    );
  }
} 