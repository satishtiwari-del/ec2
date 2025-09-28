import { TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FileEditService, DocumentLock, DocumentVersion, DocumentMetadata, CollaborationSession } from './file-edit.service';
import { environment } from '../../../../environments/environment';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription, of } from 'rxjs';

describe('FileEditService', () => {
  let service: FileEditService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/documents`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FileEditService]
    });
    service = TestBed.inject(FileEditService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // UC-FE-01: Direct File Edit
  describe('Direct File Edit', () => {
    it('should open document in editor when not locked', (done) => {
      const documentId = '123';
      const mockContent = {
        content: 'test content',
        metadata: { title: 'Test Doc' },
        version: '1.0'
      };

      service.openDocumentInEditor(documentId).subscribe({
        next: (content) => {
          expect(content).toEqual(mockContent);
          done();
        }
      });

      // Lock check request
      const lockReq = httpMock.expectOne(`${apiUrl}/${documentId}/lock`);
      expect(lockReq.request.method).toBe('GET');
      lockReq.flush(null);

      // Content request
      const contentReq = httpMock.expectOne(`${apiUrl}/${documentId}/content`);
      expect(contentReq.request.method).toBe('GET');
      contentReq.flush(mockContent);
    });

    it('should return null when validateLockStatus encounters an error', (done) => {
      const documentId = '123';

      // Test network error
      service.validateLockStatus(documentId).subscribe({
        next: (result) => {
          expect(result).toBeNull();
        }
      });

      let req = httpMock.expectOne(`${apiUrl}/${documentId}/lock`);
      expect(req.request.method).toBe('GET');
      req.error(new ErrorEvent('Network error'));

      // Test server error
      service.validateLockStatus(documentId).subscribe({
        next: (result) => {
          expect(result).toBeNull();
        }
      });

      req = httpMock.expectOne(`${apiUrl}/${documentId}/lock`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      // Test not found error
      service.validateLockStatus(documentId).subscribe({
        next: (result) => {
          expect(result).toBeNull();
          done();
        }
      });

      req = httpMock.expectOne(`${apiUrl}/${documentId}/lock`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle document locked by another user', (done) => {
      const documentId = '123';
      const mockLock: DocumentLock = {
        userId: 'otherUser',
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
        type: 'exclusive'
      };

      service.openDocumentInEditor(documentId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Document is locked by another user');
          done();
        }
      });

      const lockReq = httpMock.expectOne(`${apiUrl}/${documentId}/lock`);
      expect(lockReq.request.method).toBe('GET');
      lockReq.flush(mockLock);
    });

    it('should handle HTTP error with non-zero status in content request', (done) => {
      const documentId = '123';

      service.openDocumentInEditor(documentId).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBeTrue();
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Internal Server Error');
          done();
        }
      });

      // Lock check request
      const lockReq = httpMock.expectOne(`${apiUrl}/${documentId}/lock`);
      expect(lockReq.request.method).toBe('GET');
      lockReq.flush(null);

      // Content request with error
      const contentReq = httpMock.expectOne(`${apiUrl}/${documentId}/content`);
      contentReq.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network error in content request', (done) => {
      const documentId = '123';

      service.openDocumentInEditor(documentId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to open document');
          done();
        }
      });

      // Lock check request
      const lockReq = httpMock.expectOne(`${apiUrl}/${documentId}/lock`);
      expect(lockReq.request.method).toBe('GET');
      lockReq.flush(null);

      // Content request with network error
      const contentReq = httpMock.expectOne(`${apiUrl}/${documentId}/content`);
      contentReq.error(new ProgressEvent('Network error'));
    });

    it('should handle auto-save in test mode', fakeAsync(() => {
      const documentId = '123';
      const content = { text: 'updated content' };
      
      service.autoSave(documentId, content, true).subscribe();
      
      tick(1); // First interval (testMode = true uses 1ms)
      const firstReq = httpMock.expectOne(`${apiUrl}/${documentId}/autosave`);
      expect(firstReq.request.method).toBe('POST');
      expect(firstReq.request.body).toEqual({ content });
      firstReq.flush({});
      
      tick(1); // Second interval
      const secondReq = httpMock.expectOne(`${apiUrl}/${documentId}/autosave`);
      expect(secondReq.request.method).toBe('POST');
      secondReq.flush({});

      // No more requests should be made after 2 intervals in test mode
      tick(1);
      httpMock.expectNone(`${apiUrl}/${documentId}/autosave`);
      
      discardPeriodicTasks();
    }));

    it('should handle auto-save in non-test mode', fakeAsync(() => {
      const documentId = '123';
      const content = { text: 'updated content' };
      const autoSaveInterval = 30000; // 30 seconds
      
      service.autoSave(documentId, content, false).subscribe();
      
      // First interval using autoSaveInterval
      tick(autoSaveInterval);
      const firstReq = httpMock.expectOne(`${apiUrl}/${documentId}/autosave`);
      expect(firstReq.request.method).toBe('POST');
      expect(firstReq.request.body).toEqual({ content });
      firstReq.flush({});
      
      // Second interval
      tick(autoSaveInterval);
      const secondReq = httpMock.expectOne(`${apiUrl}/${documentId}/autosave`);
      expect(secondReq.request.method).toBe('POST');
      secondReq.flush({});
      
      // Third interval (proving Infinity works)
      tick(autoSaveInterval);
      const thirdReq = httpMock.expectOne(`${apiUrl}/${documentId}/autosave`);
      expect(thirdReq.request.method).toBe('POST');
      thirdReq.flush({});
      
      // Should continue indefinitely until destroyed
      service.ngOnDestroy();
      
      // No more requests after destroy
      tick(autoSaveInterval);
      httpMock.expectNone(`${apiUrl}/${documentId}/autosave`);
      
      discardPeriodicTasks();
    }));

    it('should handle non-HTTP error in auto-save with generic message', fakeAsync(() => {
      const documentId = '123';
      const content = { text: 'updated content' };
      let errorCaught = false;

      service.autoSave(documentId, content, true).subscribe({
        error: (error) => {
          expect(error.message).toBe('Auto-save failed');
          expect(error instanceof HttpErrorResponse).toBeFalse();
          errorCaught = true;
        }
      });

      tick(1); // First interval
      const req = httpMock.expectOne(`${apiUrl}/${documentId}/autosave`);
      // Simulate a non-HTTP error (like a timeout or parsing error)
      req.error(new ErrorEvent('Timeout'));

      tick(1); // Allow error to propagate
      expect(errorCaught).toBeTrue();
      discardPeriodicTasks();
    }));

    it('should handle HTTP error in auto-save', fakeAsync(() => {
      const documentId = '123';
      const content = { text: 'updated content' };
      let errorCaught = false;

      service.autoSave(documentId, content, true).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBeTrue();
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Internal Server Error');
          errorCaught = true;
        }
      });

      tick(1); // First interval
      const req = httpMock.expectOne(`${apiUrl}/${documentId}/autosave`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      tick(1); // Allow error to propagate
      expect(errorCaught).toBeTrue();
      discardPeriodicTasks();
    }));

    it('should handle network error in auto-save', fakeAsync(() => {
      const documentId = '123';
      const content = { text: 'updated content' };
      let errorCaught = false;

      service.autoSave(documentId, content, true).subscribe({
        error: (error) => {
          expect(error.message).toBe('Auto-save failed');
          errorCaught = true;
        }
      });

      tick(1); // First interval
      const req = httpMock.expectOne(`${apiUrl}/${documentId}/autosave`);
      req.error(new ProgressEvent('Network error'));

      tick(1); // Allow error to propagate
      expect(errorCaught).toBeTrue();
      discardPeriodicTasks();
    }));

    it('should create new version', (done) => {
      const documentId = '123';
      const changes = 'Updated content';
      const mockVersion: DocumentVersion = {
        version: '1.1',
        timestamp: new Date(),
        author: 'currentUser',
        changes,
        size: 100
      };

      service.createNewVersion(documentId, changes).subscribe({
        next: (version) => {
          expect(version).toEqual(mockVersion);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/versions`);
      expect(req.request.method).toBe('POST');
      req.flush(mockVersion);
    });
  });

  // UC-FE-02: Check-out for External Edit
  describe('Check-out for External Edit', () => {
    it('should check out document with tracking in non-test mode', fakeAsync(() => {
      const documentId = '123';
      const mockLock: DocumentLock = {
        userId: 'currentUser',
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
        type: 'exclusive'
      };

      // Spy on trackCheckoutStatus
      spyOn(service, 'trackCheckoutStatus').and.returnValue(of('checked-out'));

      service.checkoutDocument(documentId, false).subscribe();

      // Lock request
      const lockReq = httpMock.expectOne(`${apiUrl}/${documentId}/lock`);
      expect(lockReq.request.method).toBe('POST');
      lockReq.flush(mockLock);

      // Checkout request
      const checkoutReq = httpMock.expectOne(`${apiUrl}/${documentId}/checkout`);
      expect(checkoutReq.request.method).toBe('POST');
      checkoutReq.flush({});

      // Verify trackCheckoutStatus was called
      expect(service.trackCheckoutStatus).toHaveBeenCalledWith(documentId);

      tick(); // Allow subscription to complete
      discardPeriodicTasks();
    }));

    it('should check out document without tracking in test mode', fakeAsync(() => {
      const documentId = '123';
      const mockLock: DocumentLock = {
        userId: 'currentUser',
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
        type: 'exclusive'
      };

      // Spy on trackCheckoutStatus
      spyOn(service, 'trackCheckoutStatus').and.callThrough();

      service.checkoutDocument(documentId, true).subscribe();

      // Lock request
      const lockReq = httpMock.expectOne(`${apiUrl}/${documentId}/lock`);
      expect(lockReq.request.method).toBe('POST');
      lockReq.flush(mockLock);

      // Checkout request
      const checkoutReq = httpMock.expectOne(`${apiUrl}/${documentId}/checkout`);
      expect(checkoutReq.request.method).toBe('POST');
      checkoutReq.flush({});

      // Verify trackCheckoutStatus was NOT called
      expect(service.trackCheckoutStatus).not.toHaveBeenCalled();

      discardPeriodicTasks();
    }));

    it('should handle HTTP error in checkout', fakeAsync(() => {
      const documentId = '123';
      const mockLock: DocumentLock = {
        userId: 'currentUser',
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
        type: 'exclusive'
      };
      let errorCaught = false;

      service.checkoutDocument(documentId, true).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBeTrue();
          expect(error.status).toBe(500);
          errorCaught = true;
        }
      });

      // Lock request
      const lockReq = httpMock.expectOne(`${apiUrl}/${documentId}/lock`);
      expect(lockReq.request.method).toBe('POST');
      lockReq.flush(mockLock);

      // Checkout request with error
      const checkoutReq = httpMock.expectOne(`${apiUrl}/${documentId}/checkout`);
      checkoutReq.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      tick();
      expect(errorCaught).toBeTrue();
      discardPeriodicTasks();
    }));

    it('should handle network error in checkout', fakeAsync(() => {
      const documentId = '123';
      const mockLock: DocumentLock = {
        userId: 'currentUser',
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
        type: 'exclusive'
      };
      let errorCaught = false;

      service.checkoutDocument(documentId, true).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to check out document');
          errorCaught = true;
        }
      });

      // Lock request
      const lockReq = httpMock.expectOne(`${apiUrl}/${documentId}/lock`);
      expect(lockReq.request.method).toBe('POST');
      lockReq.flush(mockLock);

      // Checkout request with network error
      const checkoutReq = httpMock.expectOne(`${apiUrl}/${documentId}/checkout`);
      checkoutReq.error(new ProgressEvent('Network error'));

      tick();
      expect(errorCaught).toBeTrue();
      discardPeriodicTasks();
    }));

    it('should track checkout status', fakeAsync(() => {
      const documentId = '123';
      
      service.trackCheckoutStatus(documentId, true).subscribe();
      
      tick(0); // Initial request
      const firstReq = httpMock.expectOne(`${apiUrl}/${documentId}/checkout-status`);
      expect(firstReq.request.method).toBe('GET');
      firstReq.flush({ status: 'checked-out' });
      
      tick(1); // Second request
      const secondReq = httpMock.expectOne(`${apiUrl}/${documentId}/checkout-status`);
      expect(secondReq.request.method).toBe('GET');
      secondReq.flush({ status: 'checked-out' });
    }));

    it('should handle check-in conflicts', (done) => {
      const documentId = '123';
      const content = { text: 'updated content' };
      const conflicts = [
        { type: 'conflict', line: 1, content: 'conflicting content' }
      ];

      service.handleCheckinConflicts(documentId, content).subscribe({
        next: (response) => {
          expect(response).toEqual({ resolved: true });
          done();
        }
      });

      const checkinReq = httpMock.expectOne(`${apiUrl}/${documentId}/checkin`);
      expect(checkinReq.request.method).toBe('POST');
      expect(checkinReq.request.body).toEqual({ content });
      checkinReq.flush({ hasConflicts: true, conflicts });

      const resolveReq = httpMock.expectOne(`${apiUrl}/${documentId}/resolve-conflicts`);
      expect(resolveReq.request.method).toBe('POST');
      expect(resolveReq.request.body).toEqual({ content, conflicts });
      resolveReq.flush({ resolved: true });
    });

    it('should handle check-in without conflicts', (done) => {
      const documentId = '123';
      const content = { text: 'updated content' };

      service.handleCheckinConflicts(documentId, content).subscribe({
        next: (response) => {
          expect(response).toEqual({ hasConflicts: false, success: true });
          done();
        }
      });

      const checkinReq = httpMock.expectOne(`${apiUrl}/${documentId}/checkin`);
      expect(checkinReq.request.method).toBe('POST');
      expect(checkinReq.request.body).toEqual({ content });
      checkinReq.flush({ hasConflicts: false, success: true });
    });

    it('should handle check-in network error', (done) => {
      const documentId = '123';
      const content = { text: 'updated content' };

      service.handleCheckinConflicts(documentId, content).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to handle check-in conflicts');
          done();
        }
      });

      const checkinReq = httpMock.expectOne(`${apiUrl}/${documentId}/checkin`);
      checkinReq.error(new ProgressEvent('Network error'));
    });

    it('should handle conflict resolution error', (done) => {
      const documentId = '123';
      const content = { text: 'updated content' };
      const conflicts = [
        { type: 'conflict', line: 1, content: 'conflicting content' }
      ];

      service.handleCheckinConflicts(documentId, content).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to handle check-in conflicts');
          done();
        }
      });

      const checkinReq = httpMock.expectOne(`${apiUrl}/${documentId}/checkin`);
      checkinReq.flush({ hasConflicts: true, conflicts });

      const resolveReq = httpMock.expectOne(`${apiUrl}/${documentId}/resolve-conflicts`);
      resolveReq.error(new ProgressEvent('Network error'));
    });
  });

  // UC-FE-03: Collaborative Editing
  describe('Collaborative Editing', () => {
    it('should start collaboration session', (done) => {
      const documentId = '123';
      const mockSession: CollaborationSession = {
        documentId,
        activeUsers: [{
          userId: 'user1',
          cursor: { line: 1, column: 1 }
        }]
      };

      service.startCollaboration(documentId, true).subscribe({
        next: (session) => {
          expect(session).toEqual(mockSession);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/start`);
      expect(req.request.method).toBe('POST');
      req.flush(mockSession);
    });

    it('should start user tracking when testMode is false', fakeAsync(() => {
      const documentId = '123';
      const mockSession: CollaborationSession = {
        documentId,
        activeUsers: [{
          userId: 'user1',
          cursor: { line: 1, column: 1 }
        }]
      };

      service.startCollaboration(documentId, false).subscribe();

      const startReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/start`);
      startReq.flush(mockSession);

      tick(); // Wait for tracking to start

      // Verify tracking subscription was created and stored
      expect(service['userPollingSubscriptions'].has(documentId)).toBeTrue();
      
      // Verify tracking request was made and handle it
      const trackReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/users`);
      expect(trackReq.request.method).toBe('GET');
      trackReq.flush([{ userId: 'user1', active: true }]);

      // Clean up any remaining timers
      discardPeriodicTasks();

      // End collaboration to clean up
      service.endCollaboration(documentId).subscribe();
      const endReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/end`);
      endReq.flush({});

      tick(); // Wait for cleanup
    }));

    it('should not start user tracking when testMode is true', fakeAsync(() => {
      const documentId = '123';
      const mockSession: CollaborationSession = {
        documentId,
        activeUsers: [{
          userId: 'user1',
          cursor: { line: 1, column: 1 }
        }]
      };

      service.startCollaboration(documentId, true).subscribe();

      const startReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/start`);
      startReq.flush(mockSession);

      tick(); // Wait to ensure no tracking starts

      // Verify no tracking subscription was created
      expect(service['userPollingSubscriptions'].has(documentId)).toBeFalse();
      
      // Verify no tracking request was made
      httpMock.expectNone(`${apiUrl}/${documentId}/collaboration/users`);

      discardPeriodicTasks();
    }));

    it('should cleanup tracking subscription when tracking fails', fakeAsync(() => {
      const documentId = '123';
      const mockSession: CollaborationSession = {
        documentId,
        activeUsers: [{
          userId: 'user1',
          cursor: { line: 1, column: 1 }
        }]
      };

      service.startCollaboration(documentId, false).subscribe();

      const startReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/start`);
      startReq.flush(mockSession);

      tick(); // Wait for tracking to start

      // Verify tracking subscription was created
      expect(service['userPollingSubscriptions'].has(documentId)).toBeTrue();

      // Simulate tracking failure
      const trackReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/users`);
      trackReq.error(new ErrorEvent('Network Error'));

      tick(); // Wait for cleanup

      // Verify tracking subscription was cleaned up
      expect(service['userPollingSubscriptions'].has(documentId)).toBeFalse();

      discardPeriodicTasks();
    }));

    it('should handle network error with generic message', (done) => {
      const documentId = '123';

      service.startCollaboration(documentId, true).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to start collaboration');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/start`);
      req.error(new ProgressEvent('Network error'));
    });

    it('should track active users', fakeAsync(() => {
      const documentId = '123';
      const mockUsers = [
        { userId: 'user1', active: true },
        { userId: 'user2', active: false }
      ];
      
      service.trackActiveUsers(documentId, true).subscribe();
      
      tick(0); // Initial request
      const firstReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/users`);
      expect(firstReq.request.method).toBe('GET');
      firstReq.flush(mockUsers);
      
      // Verify active users were updated
      expect(service['activeUsers'].get(documentId)?.value).toEqual(mockUsers);

      discardPeriodicTasks(); // Clean up any remaining timers
    }));

    it('should handle timeout error in tracking active users', fakeAsync(() => {
      const documentId = '123';
      let errorCaught = false;

      // Set up polling subscription to verify cleanup
      service['userPollingSubscriptions'].set(documentId, new Subscription());
      expect(service['userPollingSubscriptions'].has(documentId)).toBeTrue();

      service.trackActiveUsers(documentId, true).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to track active users');
          expect(error instanceof Error).toBeTrue();
          errorCaught = true;
        }
      });

      tick(0); // Initial request
      const req = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/users`);
      
      // Fast-forward past the timeout period
      tick(5001);

      // Verify error was caught and subscription was cleaned up
      expect(errorCaught).toBeTrue();
      expect(service['userPollingSubscriptions'].has(documentId)).toBeFalse();

      discardPeriodicTasks();
    }));

    it('should handle other errors in tracking active users', fakeAsync(() => {
      const documentId = '123';
      let errorCaught = false;

      // Set up polling subscription to verify cleanup
      service['userPollingSubscriptions'].set(documentId, new Subscription());
      expect(service['userPollingSubscriptions'].has(documentId)).toBeTrue();

      service.trackActiveUsers(documentId, true).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to track active users');
          expect(error instanceof Error).toBeTrue();
          errorCaught = true;
        }
      });

      tick(0); // Initial request
      const req = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/users`);
      req.error(new ErrorEvent('Parse Error', { error: new TypeError('Invalid JSON') }));

      tick(); // Wait for error handling

      // Verify error was caught and subscription was cleaned up
      expect(errorCaught).toBeTrue();
      expect(service['userPollingSubscriptions'].has(documentId)).toBeFalse();

      discardPeriodicTasks();
    }));

    it('should handle concurrent edits', (done) => {
      const documentId = '123';
      const changes = [{ type: 'insert', position: 0, text: 'new' }];

      service.handleConcurrentEdits(documentId, changes).subscribe({
        next: () => done()
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/changes`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ changes });
      req.flush({});
    });

    it('should handle conflict error (409) in concurrent edits', fakeAsync(() => {
      const documentId = '123';
      const changes = [{ type: 'insert', position: 0, text: 'new' }];
      const conflicts = [{ type: 'conflict', line: 1, content: 'conflicting content' }];

      // Start collaboration to set up subjects
      service.startCollaboration(documentId, true).subscribe();
      const startReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/start`);
      startReq.flush({
        documentId,
        activeUsers: []
      });

      tick();

      let resolveCallMade = false;
      service.handleConcurrentEdits(documentId, changes).subscribe({
        next: () => {
          expect(resolveCallMade).toBeTrue();
        }
      });

      // First request results in conflict
      const editReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/changes`);
      editReq.flush({ conflicts }, { status: 409, statusText: 'Conflict' });

      // Verify resolveConflicts is called
      const resolveReq = httpMock.expectOne(`${apiUrl}/${documentId}/resolve-conflicts`);
      expect(resolveReq.request.method).toBe('POST');
      expect(resolveReq.request.body).toEqual({ content: changes, conflicts });
      resolveCallMade = true;
      resolveReq.flush({});

      tick();
      discardPeriodicTasks();
    }));

    it('should handle non-409 HTTP error in concurrent edits', fakeAsync(() => {
      const documentId = '123';
      const changes = [{ type: 'insert', position: 0, text: 'new' }];

      // Start collaboration to set up subjects
      service.startCollaboration(documentId, true).subscribe();
      const startReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/start`);
      startReq.flush({
        documentId,
        activeUsers: []
      });

      tick();

      let errorCaught = false;
      service.handleConcurrentEdits(documentId, changes).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBeTrue();
          expect(error.status).toBe(500);
          errorCaught = true;
        }
      });

      const editReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/changes`);
      editReq.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      tick();
      expect(errorCaught).toBeTrue();
      discardPeriodicTasks();
    }));

    it('should handle network error in concurrent edits', fakeAsync(() => {
      const documentId = '123';
      const changes = [{ type: 'insert', position: 0, text: 'new' }];

      // Start collaboration to set up subjects
      service.startCollaboration(documentId, true).subscribe();
      const startReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/start`);
      startReq.flush({
        documentId,
        activeUsers: []
      });

      tick();

      let errorCaught = false;
      service.handleConcurrentEdits(documentId, changes).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to handle concurrent edits');
          errorCaught = true;
        }
      });

      const editReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/changes`);
      editReq.error(new ProgressEvent('Network error'));

      tick();
      expect(errorCaught).toBeTrue();
      discardPeriodicTasks();
    }));

    it('should handle timeout error in concurrent edits', fakeAsync(() => {
      const documentId = '123';
      const changes = [{ type: 'insert', position: 0, text: 'new' }];

      // Start collaboration to set up subjects
      service.startCollaboration(documentId, true).subscribe();
      const startReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/start`);
      startReq.flush({
        documentId,
        activeUsers: []
      });

      tick();

      let errorCaught = false;
      service.handleConcurrentEdits(documentId, changes).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to handle concurrent edits');
          errorCaught = true;
        }
      });

      // Get the request but don't respond to it
      httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/changes`);

      // Fast-forward past the timeout period
      tick(5001);

      // Verify error was caught
      expect(errorCaught).toBeTrue();
      discardPeriodicTasks();
    }));

    it('should handle HTTP error with status 0 in concurrent edits', fakeAsync(() => {
      const documentId = '123';
      const changes = [{ type: 'insert', position: 0, text: 'new' }];

      // Start collaboration to set up subjects
      service.startCollaboration(documentId, true).subscribe();
      const startReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/start`);
      startReq.flush({
        documentId,
        activeUsers: []
      });

      tick();

      let errorCaught = false;
      service.handleConcurrentEdits(documentId, changes).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to handle concurrent edits');
          errorCaught = true;
        }
      });

      const editReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/changes`);
      editReq.flush('Error', { status: 0, statusText: 'Unknown Error' });

      tick();
      expect(errorCaught).toBeTrue();
      discardPeriodicTasks();
    }));

    it('should end collaboration session', fakeAsync(() => {
      const documentId = '123';

      // Start collaboration first to set up subjects and subscriptions
      service.startCollaboration(documentId, true).subscribe();
      const startReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/start`);
      startReq.flush({
        documentId,
        activeUsers: []
      });

      tick(); // Wait for collaboration to be established

      // Verify collaboration was started
      expect(service['collaborationSubjects'].has(documentId)).toBeTrue();
      expect(service['activeUsers'].has(documentId)).toBeTrue();

      // Now end collaboration
      service.endCollaboration(documentId).subscribe();

      const endReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/end`);
      expect(endReq.request.method).toBe('POST');
      endReq.flush({});

      tick(); // Wait for cleanup to complete

      // Verify cleanup
      expect(service['collaborationSubjects'].has(documentId)).toBeFalse();
      expect(service['activeUsers'].has(documentId)).toBeFalse();
      expect(service['userPollingSubscriptions'].has(documentId)).toBeFalse();

      discardPeriodicTasks(); // Clean up any remaining timers
    }));

    it('should cleanup resources on HTTP error in endCollaboration', fakeAsync(() => {
      const documentId = '123';

      // Start collaboration first to set up subjects and subscriptions
      service.startCollaboration(documentId, false).subscribe();
      const startReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/start`);
      startReq.flush({
        documentId,
        activeUsers: []
      });

      // Handle initial tracking request
      tick();
      const trackReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/users`);
      trackReq.flush([{ userId: 'user1', active: true }]);

      // Verify resources are set up
      expect(service['collaborationSubjects'].has(documentId)).toBeTrue();
      expect(service['activeUsers'].has(documentId)).toBeTrue();
      expect(service['userPollingSubscriptions'].has(documentId)).toBeTrue();

      // Now try to end collaboration with an HTTP error
      let errorCaught = false;
      service.endCollaboration(documentId).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBeTrue();
          expect(error.status).toBe(500);
          errorCaught = true;
        }
      });

      const endReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/end`);
      endReq.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      tick(); // Wait for cleanup to complete

      // Verify error was caught
      expect(errorCaught).toBeTrue();

      // Verify all resources were cleaned up despite the error
      expect(service['collaborationSubjects'].has(documentId)).toBeFalse();
      expect(service['activeUsers'].has(documentId)).toBeFalse();
      expect(service['userPollingSubscriptions'].has(documentId)).toBeFalse();

      discardPeriodicTasks();
    }));

    it('should cleanup resources on network error in endCollaboration', fakeAsync(() => {
      const documentId = '123';

      // Start collaboration first to set up subjects and subscriptions
      service.startCollaboration(documentId, false).subscribe();
      const startReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/start`);
      startReq.flush({
        documentId,
        activeUsers: []
      });

      // Handle initial tracking request
      tick();
      const trackReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/users`);
      trackReq.flush([{ userId: 'user1', active: true }]);

      // Verify resources are set up
      expect(service['collaborationSubjects'].has(documentId)).toBeTrue();
      expect(service['activeUsers'].has(documentId)).toBeTrue();
      expect(service['userPollingSubscriptions'].has(documentId)).toBeTrue();

      // Now try to end collaboration with a network error
      let errorCaught = false;
      service.endCollaboration(documentId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to end collaboration');
          errorCaught = true;
        }
      });

      const endReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/end`);
      endReq.error(new ProgressEvent('Network error'));

      tick(); // Wait for cleanup to complete

      // Verify error was caught
      expect(errorCaught).toBeTrue();

      // Verify all resources were cleaned up despite the error
      expect(service['collaborationSubjects'].has(documentId)).toBeFalse();
      expect(service['activeUsers'].has(documentId)).toBeFalse();
      expect(service['userPollingSubscriptions'].has(documentId)).toBeFalse();

      discardPeriodicTasks();
    }));

    it('should cleanup userPollingSubscriptions when they exist', fakeAsync(() => {
      const documentId = '123';

      // Start collaboration with active tracking
      service.startCollaboration(documentId, false).subscribe();
      const startReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/start`);
      startReq.flush({
        documentId,
        activeUsers: []
      });

      // Handle initial tracking request
      tick();
      const trackReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/users`);
      trackReq.flush([{ userId: 'user1', active: true }]);

      // Verify tracking subscription exists
      expect(service['userPollingSubscriptions'].has(documentId)).toBeTrue();
      const subscription = service['userPollingSubscriptions'].get(documentId);
      expect(subscription?.closed).toBeFalse();

      // End collaboration
      service.endCollaboration(documentId).subscribe();

      const endReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/end`);
      endReq.flush({});

      tick(); // Wait for cleanup to complete

      // Verify subscription was unsubscribed and removed
      expect(subscription?.closed).toBeTrue();
      expect(service['userPollingSubscriptions'].has(documentId)).toBeFalse();

      discardPeriodicTasks();
    }));

    it('should sync changes successfully', (done) => {
      const documentId = '123';
      const changes = {
        type: 'insert',
        position: { line: 1, column: 1 },
        text: 'new text'
      };

      service.syncChanges(documentId, changes).subscribe({
        next: () => done()
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/sync`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ changes });
      req.flush({});
    });

    it('should handle timeout error in sync changes', fakeAsync(() => {
      const documentId = '123';
      const changes = { type: 'insert', position: 0, text: 'new' };

      let errorCaught = false;
      service.syncChanges(documentId, changes).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to sync changes');
          errorCaught = true;
        }
      });

      // Get the request but don't respond to it
      httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/sync`);

      // Fast-forward past the timeout period
      tick(5001);

      // Verify error was caught
      expect(errorCaught).toBeTrue();
      discardPeriodicTasks();
    }));

    it('should handle sync changes network error', fakeAsync(() => {
      const documentId = '123';
      const changes = { type: 'insert', position: 0, text: 'new' };

      let errorCaught = false;
      service.syncChanges(documentId, changes).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to sync changes');
          errorCaught = true;
        }
      });

      const syncReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/sync`);
      syncReq.error(new ErrorEvent('Network error'));

      tick();
      expect(errorCaught).toBeTrue();
      discardPeriodicTasks();
    }));

    it('should handle sync changes HTTP error', fakeAsync(() => {
      const documentId = '123';
      const changes = {
        type: 'insert',
        position: { line: 1, column: 1 },
        text: 'new text'
      };

      let errorCount = 0;
      service.syncChanges(documentId, changes).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBeTrue();
          expect(error.status).toBe(500);
          errorCount++;
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/sync`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      tick();
      expect(errorCount).toBe(1);
      discardPeriodicTasks();
    }));
  });

  // UC-FE-04: Metadata Edit
  describe('Metadata Edit', () => {
    it('should modify metadata', (done) => {
      const documentId = '123';
      const metadata: DocumentMetadata = {
        title: 'Updated Title',
        tags: ['tag1', 'tag2']
      };

      service.modifyMetadata(documentId, metadata).subscribe({
        next: (response) => {
          expect(response).toEqual(metadata);
          done();
        }
      });

      // Validation request
      const validationReq = httpMock.expectOne(`${apiUrl}/validate-metadata`);
      expect(validationReq.request.method).toBe('POST');
      validationReq.flush({ valid: true });

      // Metadata update request
      const updateReq = httpMock.expectOne(`${apiUrl}/${documentId}/metadata`);
      expect(updateReq.request.method).toBe('PATCH');
      updateReq.flush(metadata);

      // Optional requests that shouldn't fail the test
      const reindexReq = httpMock.expectOne(`${apiUrl}/${documentId}/reindex`);
      expect(reindexReq.request.method).toBe('POST');
      reindexReq.flush({});

      const logReq = httpMock.expectOne(`${apiUrl}/${documentId}/metadata/log`);
      expect(logReq.request.method).toBe('POST');
      logReq.flush({});
    });

    it('should handle invalid metadata error', (done) => {
      const documentId = '123';
      const metadata: DocumentMetadata = {
        title: 'Test',
        tags: ['tag1']
      };

      service.modifyMetadata(documentId, metadata).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid metadata');
          done();
        }
      });

      const validationReq = httpMock.expectOne(`${apiUrl}/validate-metadata`);
      validationReq.flush({ valid: false });
    });

    it('should handle failed search index update silently', fakeAsync(() => {
      const documentId = '123';
      const metadata: DocumentMetadata = {
        title: 'Test',
        tags: ['tag1']
      };
      
      // Spy on console.warn
      spyOn(console, 'warn');

      service.modifyMetadata(documentId, metadata).subscribe();

      // Handle validation request
      const validationReq = httpMock.expectOne(`${apiUrl}/validate-metadata`);
      validationReq.flush({ valid: true });

      // Handle metadata update request
      const updateReq = httpMock.expectOne(`${apiUrl}/${documentId}/metadata`);
      updateReq.flush(metadata);

      // Simulate search index update failure
      const reindexReq = httpMock.expectOne(`${apiUrl}/${documentId}/reindex`);
      reindexReq.error(new ErrorEvent('Network error'));

      // Handle metadata log request
      const logReq = httpMock.expectOne(`${apiUrl}/${documentId}/metadata/log`);
      logReq.flush({});

      tick();

      // Verify warning was logged
      expect(console.warn).toHaveBeenCalledWith('Failed to update search index');
      discardPeriodicTasks();
    }));

    it('should handle failed metadata logging silently', fakeAsync(() => {
      const documentId = '123';
      const metadata: DocumentMetadata = {
        title: 'Test',
        tags: ['tag1']
      };
      
      // Spy on console.warn
      spyOn(console, 'warn');

      service.modifyMetadata(documentId, metadata).subscribe();

      // Handle validation request
      const validationReq = httpMock.expectOne(`${apiUrl}/validate-metadata`);
      validationReq.flush({ valid: true });

      // Handle metadata update request
      const updateReq = httpMock.expectOne(`${apiUrl}/${documentId}/metadata`);
      updateReq.flush(metadata);

      // Handle search index update request
      const reindexReq = httpMock.expectOne(`${apiUrl}/${documentId}/reindex`);
      reindexReq.flush({});

      // Simulate metadata log failure
      const logReq = httpMock.expectOne(`${apiUrl}/${documentId}/metadata/log`);
      logReq.error(new ErrorEvent('Network error'));

      tick();

      // Verify warning was logged
      expect(console.warn).toHaveBeenCalledWith('Failed to log metadata changes');
      discardPeriodicTasks();
    }));

    it('should handle HTTP error in metadata update', (done) => {
      const documentId = '123';
      const metadata: DocumentMetadata = {
        title: 'Test',
        tags: ['tag1']
      };

      service.modifyMetadata(documentId, metadata).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBeTrue();
          expect(error.status).toBe(500);
          done();
        }
      });

      // Handle validation request
      const validationReq = httpMock.expectOne(`${apiUrl}/validate-metadata`);
      validationReq.flush({ valid: true });

      // Simulate HTTP error in metadata update
      const updateReq = httpMock.expectOne(`${apiUrl}/${documentId}/metadata`);
      updateReq.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network error in metadata update', (done) => {
      const documentId = '123';
      const metadata: DocumentMetadata = {
        title: 'Test',
        tags: ['tag1']
      };

      service.modifyMetadata(documentId, metadata).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to modify metadata');
          done();
        }
      });

      // Handle validation request
      const validationReq = httpMock.expectOne(`${apiUrl}/validate-metadata`);
      validationReq.flush({ valid: true });

      // Simulate network error in metadata update
      const updateReq = httpMock.expectOne(`${apiUrl}/${documentId}/metadata`);
      updateReq.error(new ProgressEvent('Network error'));
    });

    it('should validate metadata successfully', (done) => {
      const metadata = {
        title: 'Test Document',
        description: 'Test Description',
        tags: ['test', 'document']
      };

      service.validateMetadata({ metadata }).subscribe({
        next: (isValid) => {
          expect(isValid).toBeTrue();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/validate-metadata`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ metadata });
      req.flush({ valid: true });
    });

    it('should handle invalid metadata response', (done) => {
      const metadata = {
        title: '', // Invalid - empty title
        tags: ['test']
      };

      service.validateMetadata({ metadata }).subscribe({
        next: (isValid) => {
          expect(isValid).toBeFalse();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/validate-metadata`);
      expect(req.request.method).toBe('POST');
      req.flush({ valid: false });
    });

    it('should handle validation network error', (done) => {
      const metadata = {
        title: 'Test Document'
      };

      service.validateMetadata({ metadata }).subscribe({
        next: (isValid) => {
          expect(isValid).toBeFalse();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/validate-metadata`);
      req.error(new ProgressEvent('Network error'));
    });

    it('should handle validation HTTP error', (done) => {
      const metadata = {
        title: 'Test Document'
      };

      service.validateMetadata({ metadata }).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBeTrue();
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/validate-metadata`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should update search index successfully', (done) => {
      const documentId = '123';

      service.updateSearchIndex(documentId).subscribe({
        next: () => done()
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/reindex`);
      expect(req.request.method).toBe('POST');
      req.flush({});
    });

    it('should handle search index update network error with generic message', (done) => {
      const documentId = '123';

      service.updateSearchIndex(documentId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to update search index');
          expect(error instanceof Error).toBeTrue();
          expect(error instanceof HttpErrorResponse).toBeFalse();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/reindex`);
      req.error(new ProgressEvent('Network error'));
    });

    it('should handle search index update timeout error with generic message', (done) => {
      const documentId = '123';

      service.updateSearchIndex(documentId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to update search index');
          expect(error instanceof Error).toBeTrue();
          expect(error instanceof HttpErrorResponse).toBeFalse();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/reindex`);
      req.error(new ErrorEvent('Timeout'));
    });

    it('should handle search index update parse error with generic message', (done) => {
      const documentId = '123';

      service.updateSearchIndex(documentId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to update search index');
          expect(error instanceof Error).toBeTrue();
          expect(error instanceof HttpErrorResponse).toBeFalse();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/reindex`);
      req.error(new ErrorEvent('Parse Error', { error: new TypeError('Invalid JSON') }));
    });

    it('should handle search index update HTTP error', (done) => {
      const documentId = '123';

      service.updateSearchIndex(documentId).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBeTrue();
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/reindex`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should log metadata changes successfully', (done) => {
      const documentId = '123';
      const changes: Partial<DocumentMetadata> = {
        title: 'Updated Title',
        tags: ['new', 'tags']
      };

      service.logMetadataChanges(documentId, changes).subscribe({
        next: () => done()
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/metadata/log`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        timestamp: jasmine.any(Date),
        userId: 'currentUser',
        changes
      });
      req.flush({});
    });

    it('should handle metadata log network error with generic message', (done) => {
      const documentId = '123';
      const changes: Partial<DocumentMetadata> = {
        title: 'Updated Title'
      };

      service.logMetadataChanges(documentId, changes).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to log metadata changes');
          expect(error instanceof Error).toBeTrue();
          expect(error instanceof HttpErrorResponse).toBeFalse();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/metadata/log`);
      req.error(new ProgressEvent('Network error'));
    });

    it('should handle metadata log timeout error with generic message', (done) => {
      const documentId = '123';
      const changes: Partial<DocumentMetadata> = {
        title: 'Updated Title'
      };

      service.logMetadataChanges(documentId, changes).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to log metadata changes');
          expect(error instanceof Error).toBeTrue();
          expect(error instanceof HttpErrorResponse).toBeFalse();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/metadata/log`);
      req.error(new ErrorEvent('Timeout'));
    });

    it('should handle metadata log HTTP error', (done) => {
      const documentId = '123';
      const changes: Partial<DocumentMetadata> = {
        title: 'Updated Title'
      };

      service.logMetadataChanges(documentId, changes).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBeTrue();
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/metadata/log`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // UC-FE-05: Version Management
  describe('Version Management', () => {
    it('should get version history', (done) => {
      const documentId = '123';
      const mockVersions: DocumentVersion[] = [
        {
          version: '1.0',
          timestamp: new Date(),
          author: 'user1',
          changes: 'Initial version',
          size: 100
        },
        {
          version: '1.1',
          timestamp: new Date(),
          author: 'user2',
          changes: 'Updated content',
          size: 150
        }
      ];

      service.getVersionHistory(documentId).subscribe({
        next: (versions) => {
          expect(versions).toEqual(mockVersions);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/versions`);
      expect(req.request.method).toBe('GET');
      req.flush(mockVersions);
    });

    it('should handle HTTP error in getVersionHistory', (done) => {
      const documentId = '123';

      service.getVersionHistory(documentId).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBeTrue();
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Internal Server Error');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/versions`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network error in getVersionHistory', (done) => {
      const documentId = '123';

      service.getVersionHistory(documentId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to get version history');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/versions`);
      req.error(new ProgressEvent('Network error'));
    });

    it('should promote version', (done) => {
      const documentId = '123';
      const version = '1.1';

      service.promoteVersion(documentId, version).subscribe({
        next: () => done()
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/versions/${version}/promote`);
      expect(req.request.method).toBe('POST');
      req.flush({});
    });

    it('should handle HTTP error in version promotion', (done) => {
      const documentId = '123';
      const version = '1.1';

      service.promoteVersion(documentId, version).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBeTrue();
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Internal Server Error');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/versions/${version}/promote`);
      expect(req.request.method).toBe('POST');
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network error in version promotion', (done) => {
      const documentId = '123';
      const version = '1.1';

      service.promoteVersion(documentId, version).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to promote version');
          expect(error instanceof HttpErrorResponse).toBeFalse();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/versions/${version}/promote`);
      expect(req.request.method).toBe('POST');
      req.error(new ProgressEvent('Network error'));
    });

    it('should handle timeout error in version promotion', (done) => {
      const documentId = '123';
      const version = '1.1';

      service.promoteVersion(documentId, version).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to promote version');
          expect(error instanceof HttpErrorResponse).toBeFalse();
          expect(error instanceof Error).toBeTrue();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/versions/${version}/promote`);
      expect(req.request.method).toBe('POST');
      req.error(new ErrorEvent('Timeout'));
    });

    it('should handle HTTP error with status 0 in version promotion', (done) => {
      const documentId = '123';
      const version = '1.1';

      service.promoteVersion(documentId, version).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to promote version');
          expect(error instanceof Error).toBeTrue();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/versions/${version}/promote`);
      expect(req.request.method).toBe('POST');
      req.flush('Error', { status: 0, statusText: 'Unknown Error' });
    });

    it('should restore version and handle failed version creation silently', fakeAsync(() => {
      const documentId = '123';
      const version = '1.0';
      
      // Spy on console.warn
      spyOn(console, 'warn');

      let completed = false;
      service.restoreVersion(documentId, version).subscribe({
        next: () => {
          completed = true;
        }
      });

      const restoreReq = httpMock.expectOne(`${apiUrl}/${documentId}/versions/${version}/restore`);
      expect(restoreReq.request.method).toBe('POST');
      restoreReq.flush({});

      const newVersionReq = httpMock.expectOne(`${apiUrl}/${documentId}/versions`);
      expect(newVersionReq.request.method).toBe('POST');
      newVersionReq.error(new ProgressEvent('Network error'));

      tick();
      expect(completed).toBeTrue();
      expect(console.warn).toHaveBeenCalledWith('Failed to create restore version');
      discardPeriodicTasks();
    }));

    it('should handle HTTP error in version restore', (done) => {
      const documentId = '123';
      const version = '1.0';

      service.restoreVersion(documentId, version).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBeTrue();
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Internal Server Error');
          done();
        }
      });

      const restoreReq = httpMock.expectOne(`${apiUrl}/${documentId}/versions/${version}/restore`);
      expect(restoreReq.request.method).toBe('POST');
      restoreReq.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network error in version restore', (done) => {
      const documentId = '123';
      const version = '1.0';

      service.restoreVersion(documentId, version).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to restore version');
          expect(error instanceof HttpErrorResponse).toBeFalse();
          done();
        }
      });

      const restoreReq = httpMock.expectOne(`${apiUrl}/${documentId}/versions/${version}/restore`);
      expect(restoreReq.request.method).toBe('POST');
      restoreReq.error(new ProgressEvent('Network error'));
    });

    it('should delete version', (done) => {
      const documentId = '123';
      const version = '1.1';

      service.deleteVersion(documentId, version).subscribe({
        next: () => done()
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/versions/${version}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    it('should handle HTTP error in version deletion', (done) => {
      const documentId = '123';
      const version = '1.1';

      service.deleteVersion(documentId, version).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBeTrue();
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Internal Server Error');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/versions/${version}`);
      expect(req.request.method).toBe('DELETE');
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network error in version deletion', (done) => {
      const documentId = '123';
      const version = '1.1';

      service.deleteVersion(documentId, version).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to delete version');
          expect(error instanceof HttpErrorResponse).toBeFalse();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/versions/${version}`);
      expect(req.request.method).toBe('DELETE');
      req.error(new ProgressEvent('Network error'));
    });
  });

  // Error handling tests
  describe('Error Handling', () => {
    const documentId = '123';

    it('should handle network errors', (done) => {
      service.openDocumentInEditor(documentId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to open document');
          done();
        }
      });

      const lockReq = httpMock.expectOne(`${apiUrl}/${documentId}/lock`);
      lockReq.flush(null);

      const contentReq = httpMock.expectOne(`${apiUrl}/${documentId}/content`);
      contentReq.error(new ProgressEvent('Network error'));
    });

    it('should handle invalid version response', (done) => {
      const documentId = '123';
      const changes = 'test changes';

      service.createNewVersion(documentId, changes).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid version response');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/versions`);
      req.flush({ invalid: 'response' });
    });

    it('should handle empty changes in version creation', (done) => {
      const documentId = '123';
      const changes = '';

      service.createNewVersion(documentId, changes).subscribe({
        error: (error) => {
          expect(error.message).toBe('Changes cannot be empty');
          done();
        }
      });
    });

    it('should handle HTTP error in version creation', (done) => {
      const documentId = '123';
      const changes = 'test changes';

      service.createNewVersion(documentId, changes).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBeTrue();
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Internal Server Error');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/versions`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network error in version creation', (done) => {
      const documentId = '123';
      const changes = 'test changes';

      service.createNewVersion(documentId, changes).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to create version');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/versions`);
      req.error(new ProgressEvent('Network error'));
    });

    it('should handle HTTP error with status 0 in version creation', (done) => {
      const documentId = '123';
      const changes = 'test changes';

      service.createNewVersion(documentId, changes).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to create version');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/versions`);
      req.flush('Error', { status: 0, statusText: 'Unknown Error' });
    });

    it('should handle collaboration start failure', fakeAsync(() => {
      service.startCollaboration(documentId, true).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBeTrue();
          expect(error.status).toBe(500);
        }
      });

      const startReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/start`);
      startReq.error(new ErrorEvent('Server Error'), {
        status: 500,
        statusText: 'Internal Server Error'
      });

      tick();
    }));

    it('should handle user tracking failure', fakeAsync(() => {
      const documentId = '123';
      let errorThrown = false;

      // Start collaboration first
      service.startCollaboration(documentId, true).subscribe();
      const startReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/start`);
      startReq.flush({
        documentId,
        activeUsers: []
      });

      tick();

      // Now try to track users
      service.trackActiveUsers(documentId, true).subscribe({
        error: (error) => {
          expect(error instanceof Error).toBeTrue();
          expect(error.message).toBe('Failed to track active users');
          errorThrown = true;
        }
      });

      tick(1); // Wait for interval
      const trackReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/users`);
      trackReq.error(new ErrorEvent('Service Unavailable'), {
        status: 503,
        statusText: 'Service Unavailable'
      });

      tick(); // Wait for error to be processed
      expect(errorThrown).toBeTrue();
      discardPeriodicTasks();
    }));

    it('should handle metadata validation failure', fakeAsync(() => {
      const documentId = '123';
      const metadata = {
        title: '',
        description: 'Invalid metadata'
      };

      service.validateMetadata({ metadata }).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBeTrue();
          expect(error.status).toBe(400);
          expect(error.statusText).toBe('Bad Request');
        }
      });

      const validateReq = httpMock.expectOne(`${apiUrl}/validate-metadata`);
      validateReq.error(new ErrorEvent('Bad Request'), {
        status: 400,
        statusText: 'Bad Request'
      });

      tick();
    }));

    it('should handle sync changes failure with retry', fakeAsync(() => {
      const documentId = '123';
      const changes = {
        type: 'insert',
        position: { line: 1, column: 1 },
        text: 'new text'
      };
      let errorThrown = false;

      service.syncChanges(documentId, changes).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBeTrue();
          expect(error.status).toBe(503);
          errorThrown = true;
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/sync`);
      req.error(new ErrorEvent('Service Unavailable'), {
        status: 503,
        statusText: 'Service Unavailable'
      });

      tick(); // Wait for error to be processed
      expect(errorThrown).toBeTrue();
      discardPeriodicTasks();
    }));

    it('should handle concurrent edit conflict', fakeAsync(() => {
      const documentId = '123';
      const changes = [
        {
          type: 'insert',
          position: { line: 1, column: 1 },
          text: 'new text'
        }
      ];

      // Start collaboration first
      service.startCollaboration(documentId, true).subscribe();
      const startReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/start`);
      startReq.flush({
        documentId,
        activeUsers: []
      });

      tick(); // Wait for collaboration to be fully established

      // Now try to handle concurrent edits
      let completed = false;
      service.handleConcurrentEdits(documentId, changes).subscribe({
        next: () => { completed = true; }
      });

      // Handle the concurrent edits request
      const editReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/changes`);
      editReq.flush({});

      tick();
      expect(completed).toBeTrue();
      discardPeriodicTasks();
    }));

    it('should handle HTTP error in lockDocument', (done) => {
      const documentId = '123';
      const userId = 'testUser';

      service.lockDocument(documentId, userId).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBeTrue();
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/lock`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network error in lockDocument', (done) => {
      const documentId = '123';
      const userId = 'testUser';

      service.lockDocument(documentId, userId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to lock document');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${documentId}/lock`);
      req.error(new ProgressEvent('Network error'));
    });
  });

  // Cleanup tests
  describe('Cleanup', () => {
    it('should clean up resources on destroy', () => {
      const documentId = '123';
      
      // Start collaboration to create subjects and subscriptions
      service.startCollaboration(documentId, true).subscribe();
      
      const startReq = httpMock.expectOne(`${apiUrl}/${documentId}/collaboration/start`);
      startReq.flush({
        documentId,
        activeUsers: []
      });

      // Destroy service
      service.ngOnDestroy();

      // Verify all subjects are completed and maps are cleared
      expect(service['collaborationSubjects'].size).toBe(0);
      expect(service['activeUsers'].size).toBe(0);
      expect(service['userPollingSubscriptions'].size).toBe(0);
    });

    it('should properly handle different subscription states in setupDestroySubscription', fakeAsync(() => {
      // Create test subscriptions with different states
      const activeSubscription = new Subscription();
      const closedSubscription = new Subscription();
      closedSubscription.unsubscribe(); // This makes closed = true
      const undefinedSubscription = undefined;

      // Add subscriptions to the service
      service['userPollingSubscriptions'].set('active', activeSubscription);
      service['userPollingSubscriptions'].set('closed', closedSubscription);
      service['userPollingSubscriptions'].set('undefined', undefinedSubscription as any);

      // Verify initial state
      expect(activeSubscription.closed).toBeFalse();
      expect(closedSubscription.closed).toBeTrue();
      expect(service['userPollingSubscriptions'].size).toBe(3);

      // Spy on unsubscribe methods
      spyOn(activeSubscription, 'unsubscribe').and.callThrough();
      spyOn(closedSubscription, 'unsubscribe').and.callThrough();

      // Trigger destroy$ completion to execute setupDestroySubscription logic
      service['destroy$'].complete();

      // Verify unsubscribe was only called on active subscription
      expect(activeSubscription.unsubscribe).toHaveBeenCalled();
      expect(closedSubscription.unsubscribe).not.toHaveBeenCalled();

      // Verify all subscriptions were cleared
      expect(service['userPollingSubscriptions'].size).toBe(0);

      discardPeriodicTasks();
    }));
  });
}); 