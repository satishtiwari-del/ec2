import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of, interval, Subject, BehaviorSubject, Subscription, concat, timer } from 'rxjs';
import { map, catchError, tap, switchMap, takeUntil, filter, finalize, take, startWith, retry, timeout } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface DocumentLock {
  userId: string;
  timestamp: Date;
  expiresAt: Date;
  type: 'exclusive' | 'shared';
}

export interface DocumentVersion {
  version: string;
  timestamp: Date;
  author: string;
  changes: string;
  size: number;
}

export interface DocumentMetadata {
  title: string;
  description?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface CollaborationSession {
  documentId: string;
  activeUsers: Array<{
    userId: string;
    cursor: { line: number; column: number };
    selection?: { start: number; end: number };
  }>;
}

export interface DocumentContent {
  content: string;
  metadata: DocumentMetadata;
  version: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileEditService implements OnDestroy {
  private readonly apiUrl = `${environment.apiUrl}/documents`;
  private readonly autoSaveInterval = 30000; // 30 seconds
  private readonly collaborationSubjects = new Map<string, Subject<any>>();
  private readonly activeUsers = new Map<string, BehaviorSubject<Array<{ userId: string; active: boolean }>>>();
  private readonly userPollingSubscriptions = new Map<string, Subscription>();
  private readonly destroy$ = new Subject<void>();

  constructor(private http: HttpClient) {
    this.setupDestroySubscription();
  }

  ngOnDestroy() {
    // Complete the destroy$ subject first
    this.destroy$.next();
    this.destroy$.complete();

    // Clean up all subscriptions
    this.userPollingSubscriptions.forEach(sub => {
      if (sub && !sub.closed) {
        sub.unsubscribe();
      }
    });
    this.userPollingSubscriptions.clear();

    // Clean up all collaboration subjects
    this.collaborationSubjects.forEach(subject => {
      if (subject && !subject.closed && !subject.isStopped) {
        subject.complete();
      }
    });
    this.collaborationSubjects.clear();

    // Clean up all active users subjects
    this.activeUsers.forEach(subject => {
      if (subject && !subject.closed && !subject.isStopped) {
        subject.complete();
      }
    });
    this.activeUsers.clear();
  }

  // Add a method to handle cleanup when destroy$ is completed
  private setupDestroySubscription() {
    this.destroy$.subscribe({
      complete: () => {
        // Clean up all subscriptions
        this.userPollingSubscriptions.forEach(sub => {
          if (sub && !sub.closed) {
            sub.unsubscribe();
          }
        });
        this.userPollingSubscriptions.clear();

        // Clean up all collaboration subjects
        this.collaborationSubjects.forEach(subject => {
          if (subject && !subject.closed && !subject.isStopped) {
            subject.complete();
          }
        });
        this.collaborationSubjects.clear();

        // Clean up all active users subjects
        this.activeUsers.forEach(subject => {
          if (subject && !subject.closed && !subject.isStopped) {
            subject.complete();
          }
        });
        this.activeUsers.clear();
      }
    });
  }

  // UC-FE-01: Direct File Edit
  openDocumentInEditor(documentId: string): Observable<DocumentContent> {
    return this.validateLockStatus(documentId).pipe(
      switchMap(lock => {
        if (lock && lock.type === 'exclusive' && lock.userId !== 'currentUser') {
          return throwError(() => new Error('Document is locked by another user'));
        }

        return this.http.get<DocumentContent>(`${this.apiUrl}/${documentId}/content`).pipe(
          catchError(error => {
            if (error instanceof HttpErrorResponse && error.status !== 0) {
              return throwError(() => error);
            }
            return throwError(() => new Error('Failed to open document'));
          })
        );
      })
    );
  }

  validateLockStatus(documentId: string): Observable<DocumentLock | null> {
    return this.http.get<DocumentLock | null>(`${this.apiUrl}/${documentId}/lock`).pipe(
      catchError(() => of(null))
    );
  }

  autoSave(documentId: string, content: any, testMode = false): Observable<void> {
    const intervalTime = testMode ? 1 : this.autoSaveInterval;
    return interval(intervalTime).pipe(
      takeUntil(this.destroy$),
      take(testMode ? 2 : Infinity),
      switchMap(() => this.http.post<void>(`${this.apiUrl}/${documentId}/autosave`, { content })),
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status !== 0) {
          return throwError(() => error);
        }
        return throwError(() => new Error('Auto-save failed'));
      })
    );
  }

  createNewVersion(documentId: string, changes: string): Observable<DocumentVersion> {
    if (!changes) {
      return throwError(() => new Error('Changes cannot be empty'));
    }

    const versionData = {
      changes,
      timestamp: new Date(),
      author: 'currentUser'
    };

    return this.http.post<DocumentVersion>(`${this.apiUrl}/${documentId}/versions`, versionData).pipe(
      map(response => {
        if (!response.version || !response.timestamp || !response.author || !response.changes) {
          throw new Error('Invalid version response');
        }
        return response;
      }),
      catchError(error => {
        if (error.message === 'Invalid version response') {
          return throwError(() => error);
        }
        if (error instanceof HttpErrorResponse && error.status !== 0) {
          return throwError(() => error);
        }
        return throwError(() => new Error('Failed to create version'));
      })
    );
  }

  // UC-FE-02: Check-out for External Edit
  checkoutDocument(documentId: string, testMode = false): Observable<void> {
    return this.lockDocument(documentId, 'currentUser').pipe(
      switchMap(() => this.http.post<void>(`${this.apiUrl}/${documentId}/checkout`, {}).pipe(
        tap(() => {
          if (!testMode) {
            this.trackCheckoutStatus(documentId).subscribe();
          }
        }),
        catchError(error => {
          if (error instanceof HttpErrorResponse && error.status !== 0) {
            return throwError(() => error);
          }
          return throwError(() => new Error('Failed to check out document'));
        })
      ))
    );
  }

  lockDocument(documentId: string, userId: string): Observable<DocumentLock> {
    const lock: Partial<DocumentLock> = {
      userId,
      type: 'exclusive',
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 3600000) // 1 hour
    };

    return this.http.post<DocumentLock>(`${this.apiUrl}/${documentId}/lock`, lock).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status !== 0) {
          return throwError(() => error);
        }
        return throwError(() => new Error('Failed to lock document'));
      })
    );
  }

  trackCheckoutStatus(documentId: string, testMode = false): Observable<string> {
    const intervalTime = testMode ? 1 : 5000;
    const checkStatus = () => this.http.get<{ status: string }>(`${this.apiUrl}/${documentId}/checkout-status`).pipe(
      map(response => {
        if (!response || !response.status) {
          return 'unknown';
        }
        return response.status;
      }),
      catchError(() => of('unknown'))
    );

    // In test mode, we want to make two requests
    // In non-test mode, we want to make requests every 5 seconds
    return timer(0, intervalTime).pipe(
      takeUntil(this.destroy$),
      take(testMode ? 2 : Infinity),
      switchMap(() => checkStatus())
    );
  }

  handleCheckinConflicts(documentId: string, content: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${documentId}/checkin`, { content }).pipe(
      switchMap(response => {
        if (response.hasConflicts) {
          return this.resolveConflicts(documentId, content, response.conflicts);
        }
        return of(response);
      }),
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status !== 0) {
          return throwError(() => error);
        }
        return throwError(() => new Error('Failed to handle check-in conflicts'));
      })
    );
  }

  private resolveConflicts(documentId: string, content: any, conflicts: any[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${documentId}/resolve-conflicts`, {
      content,
      conflicts
    }).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status !== 0) {
          return throwError(() => error);
        }
        return throwError(() => new Error('Failed to resolve conflicts'));
      })
    );
  }

  // UC-FE-03: Collaborative Editing
  startCollaboration(documentId: string, testMode = false): Observable<CollaborationSession> {
    if (!this.collaborationSubjects.has(documentId)) {
      this.collaborationSubjects.set(documentId, new Subject<any>());
    }

    // Initialize active users subject if not already done
    if (!this.activeUsers.has(documentId)) {
      this.activeUsers.set(documentId, new BehaviorSubject<Array<{ userId: string; active: boolean }>>([]));
    }

    return this.http.post<CollaborationSession>(`${this.apiUrl}/${documentId}/collaboration/start`, {}).pipe(
      tap(session => {
        // Update active users
        this.activeUsers.get(documentId)?.next(session.activeUsers.map(user => ({ userId: user.userId, active: true })));

        // Start tracking active users
        if (!testMode) {
          const trackingSubscription = this.trackActiveUsers(documentId, testMode)
            .pipe(
              retry(3), // Add retry for robustness
              takeUntil(this.destroy$),
              finalize(() => {
                if (this.userPollingSubscriptions.has(documentId)) {
                  this.userPollingSubscriptions.get(documentId)?.unsubscribe();
                  this.userPollingSubscriptions.delete(documentId);
                }
              })
            )
            .subscribe();

          this.userPollingSubscriptions.set(documentId, trackingSubscription);
        }
      }),
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status !== 0) {
          return throwError(() => error);
        }
        return throwError(() => new Error('Failed to start collaboration'));
      })
    );
  }

  endCollaboration(documentId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${documentId}/collaboration/end`, {}).pipe(
      finalize(() => {
        // Clean up tracking subscription first
        if (this.userPollingSubscriptions.has(documentId)) {
          this.userPollingSubscriptions.get(documentId)?.unsubscribe();
          this.userPollingSubscriptions.delete(documentId);
        }
        
        // Clean up collaboration subject
        if (this.collaborationSubjects.has(documentId)) {
          this.collaborationSubjects.get(documentId)?.complete();
          this.collaborationSubjects.delete(documentId);
        }

        // Clean up active users subject
        if (this.activeUsers.has(documentId)) {
          this.activeUsers.get(documentId)?.complete();
          this.activeUsers.delete(documentId);
        }
      }),
      catchError(error => {
        // Clean up resources even on error
        if (this.userPollingSubscriptions.has(documentId)) {
          this.userPollingSubscriptions.get(documentId)?.unsubscribe();
          this.userPollingSubscriptions.delete(documentId);
        }
        
        if (this.collaborationSubjects.has(documentId)) {
          this.collaborationSubjects.get(documentId)?.complete();
          this.collaborationSubjects.delete(documentId);
        }

        if (this.activeUsers.has(documentId)) {
          this.activeUsers.get(documentId)?.complete();
          this.activeUsers.delete(documentId);
        }

        if (error instanceof HttpErrorResponse && error.status !== 0) {
          return throwError(() => error);
        }
        return throwError(() => new Error('Failed to end collaboration'));
      })
    );
  }

  trackActiveUsers(documentId: string, testMode = false): Observable<Array<{ userId: string; active: boolean }>> {
    if (!this.activeUsers.has(documentId)) {
      this.activeUsers.set(documentId, new BehaviorSubject<Array<{ userId: string; active: boolean }>>([]));
    }

    const intervalTime = testMode ? 1 : 5000;
    return timer(0, intervalTime).pipe(
      take(testMode ? 1 : Infinity),
      switchMap(() => this.http.get<Array<{ userId: string; active: boolean }>>(`${this.apiUrl}/${documentId}/collaboration/users`).pipe(
        timeout(5000), // Add 5 second timeout
        tap(users => this.activeUsers.get(documentId)?.next(users)),
        catchError(error => {
          // Clean up tracking subscription on error
          if (this.userPollingSubscriptions.has(documentId)) {
            this.userPollingSubscriptions.get(documentId)?.unsubscribe();
            this.userPollingSubscriptions.delete(documentId);
          }
          
          if (error.name === 'TimeoutError') {
            return throwError(() => new Error('Failed to track active users'));
          }
          if (error instanceof HttpErrorResponse) {
            return throwError(() => new Error('Failed to track active users'));
          }
          return throwError(() => new Error('Failed to track active users'));
        })
      ))
    );
  }

  handleConcurrentEdits(documentId: string, changes: any[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${documentId}/collaboration/changes`, { changes }).pipe(
      timeout(5000), // Add 5 second timeout
      tap(response => {
        const subject = this.collaborationSubjects.get(documentId);
        if (subject && !subject.closed && !subject.isStopped) {
          subject.next({ type: 'changes', data: changes });
        }
      }),
      catchError(error => {
        if (error instanceof HttpErrorResponse) {
          // Check if it's a conflict error
          if (error.status === 409) {
            return this.resolveConflicts(documentId, changes, error.error.conflicts);
          }
          if (error.status === 0) {
            return throwError(() => new Error('Failed to handle concurrent edits'));
          }
          return throwError(() => error);
        }
        if (error.name === 'TimeoutError') {
          return throwError(() => new Error('Failed to handle concurrent edits'));
        }
        return throwError(() => new Error('Failed to handle concurrent edits'));
      })
    );
  }

  syncChanges(documentId: string, changes: any): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${documentId}/collaboration/sync`, { changes }).pipe(
      timeout(5000), // Add 5 second timeout
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status !== 0) {
          return throwError(() => error);
        }
        if (error.name === 'TimeoutError') {
          return throwError(() => new Error('Failed to sync changes'));
        }
        return throwError(() => new Error('Failed to sync changes'));
      })
    );
  }

  // UC-FE-04: Metadata Edit
  modifyMetadata(documentId: string, metadata: Partial<DocumentMetadata>): Observable<DocumentMetadata> {
    return this.validateMetadata({ metadata }).pipe(
      switchMap(isValid => {
        if (!isValid) {
          return throwError(() => new Error('Invalid metadata'));
        }

        return this.http.patch<DocumentMetadata>(`${this.apiUrl}/${documentId}/metadata`, metadata).pipe(
          tap(() => {
            // Don't fail if these operations fail
            this.updateSearchIndex(documentId).subscribe({
              error: () => console.warn('Failed to update search index')
            });
            this.logMetadataChanges(documentId, metadata).subscribe({
              error: () => console.warn('Failed to log metadata changes')
            });
          }),
          catchError(error => {
            if (error instanceof HttpErrorResponse && error.status !== 0) {
              return throwError(() => error);
            }
            return throwError(() => new Error('Failed to modify metadata'));
          })
        );
      })
    );
  }

  validateMetadata(data: { metadata: Partial<DocumentMetadata> }): Observable<boolean> {
    return this.http.post<{ valid: boolean }>(`${this.apiUrl}/validate-metadata`, data).pipe(
      map(response => response.valid),
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status !== 0) {
          return throwError(() => error);
        }
        return of(false);
      })
    );
  }

  updateSearchIndex(documentId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${documentId}/reindex`, {}).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status !== 0) {
          return throwError(() => error);
        }
        return throwError(() => new Error('Failed to update search index'));
      })
    );
  }

  logMetadataChanges(documentId: string, changes: Partial<DocumentMetadata>): Observable<void> {
    const logEntry = {
      timestamp: new Date(),
      userId: 'currentUser',
      changes
    };

    return this.http.post<void>(`${this.apiUrl}/${documentId}/metadata/log`, logEntry).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status !== 0) {
          return throwError(() => error);
        }
        return throwError(() => new Error('Failed to log metadata changes'));
      })
    );
  }

  // UC-FE-05: Version Management
  getVersionHistory(documentId: string): Observable<DocumentVersion[]> {
    return this.http.get<DocumentVersion[]>(`${this.apiUrl}/${documentId}/versions`).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status !== 0) {
          return throwError(() => error);
        }
        return throwError(() => new Error('Failed to get version history'));
      })
    );
  }

  promoteVersion(documentId: string, version: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${documentId}/versions/${version}/promote`, {}).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status !== 0) {
          return throwError(() => error);
        }
        return throwError(() => new Error('Failed to promote version'));
      })
    );
  }

  restoreVersion(documentId: string, version: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${documentId}/versions/${version}/restore`, {}).pipe(
      tap(() => {
        this.createNewVersion(documentId, `Restored from version ${version}`).subscribe({
          error: () => console.warn('Failed to create restore version')
        });
      }),
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status !== 0) {
          return throwError(() => error);
        }
        return throwError(() => new Error('Failed to restore version'));
      })
    );
  }

  deleteVersion(documentId: string, version: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${documentId}/versions/${version}`).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status !== 0) {
          return throwError(() => error);
        }
        return throwError(() => new Error('Failed to delete version'));
      })
    );
  }
} 