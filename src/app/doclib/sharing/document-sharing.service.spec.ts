import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DocumentSharingService, ShareSettings, ShareLink, ShareActivity, SharePermission, NotificationSettings } from './document-sharing.service';
import { environment } from '../../../environments/environment';
import { fakeAsync, tick } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';

describe('DocumentSharingService', () => {
  let service: DocumentSharingService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/sharing`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DocumentSharingService]
    });
    service = TestBed.inject(DocumentSharingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // Test for shareDocument HttpErrorResponse
  it('should handle HttpErrorResponse in shareDocument', (done) => {
    const documentId = 'doc123';
    const settings = {
      recipientIds: ['user1'],
      permissionLevel: 'view' as const
    };

    service.shareDocument(documentId, settings).subscribe({
      error: (error) => {
        expect(error).toBeInstanceOf(HttpErrorResponse);
        done();
      }
    });

    // Mock validateRecipientPermissions to return true
    const validateReq = httpMock.expectOne(`${apiUrl}/validate-recipients`);
    validateReq.flush({ valid: true });

    // Mock share request to return HttpErrorResponse
    const shareReq = httpMock.expectOne(`${apiUrl}/documents/${documentId}/share`);
    shareReq.error(new ErrorEvent('Network error'));
  });

  // Test for shareMultipleDocuments invalid recipients
  it('should handle invalid recipients in shareMultipleDocuments', (done) => {
    const documentIds = ['doc1', 'doc2'];
    const settings = {
      recipientIds: ['user1'],
      permissionLevel: 'view' as const
    };

    service.shareMultipleDocuments(documentIds, settings).subscribe({
      error: (error) => {
        expect(error.message).toBe('Invalid recipients or insufficient permissions');
        done();
      }
    });

    const validateReq = httpMock.expectOne(`${apiUrl}/validate-recipients`);
    validateReq.flush({ valid: false });
  });

  // Test for generateShareLink HttpErrorResponse
  it('should handle HttpErrorResponse in generateShareLink', (done) => {
    const documentId = 'doc123';

    service.generateShareLink(documentId).subscribe({
      error: (error) => {
        expect(error).toBeInstanceOf(HttpErrorResponse);
        done();
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/links/generate`);
    req.error(new ErrorEvent('Network error'));
  });

  // Test for setLinkExpiration HttpErrorResponse
  it('should handle HttpErrorResponse in setLinkExpiration', (done) => {
    const linkId = 'link123';
    const expirationDate = new Date(Date.now() + 86400000); // Tomorrow

    service.setLinkExpiration(linkId, expirationDate).subscribe({
      error: (error) => {
        expect(error).toBeInstanceOf(HttpErrorResponse);
        done();
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/links/${linkId}/expiration`);
    req.error(new ErrorEvent('Network error'));
  });

  // Test for configurePasswordProtection HttpErrorResponse
  it('should handle HttpErrorResponse in configurePasswordProtection', (done) => {
    const linkId = 'link123';
    const password = 'securePassword123';

    service.configurePasswordProtection(linkId, password).subscribe({
      error: (error) => {
        expect(error).toBeInstanceOf(HttpErrorResponse);
        done();
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/links/${linkId}/password`);
    req.error(new ErrorEvent('Network error'));
  });

  // Test for trackLinkUsage HttpErrorResponse
  it('should handle HttpErrorResponse in trackLinkUsage', (done) => {
    const linkId = 'link123';

    service.trackLinkUsage(linkId).subscribe({
      error: (error) => {
        expect(error).toBeInstanceOf(HttpErrorResponse);
        done();
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/links/${linkId}/usage`);
    req.error(new ErrorEvent('Network error'));
  });

  // UC-DS-01: Share Single Document
  describe('Share Single Document', () => {
    it('should share document with valid settings', fakeAsync(() => {
      const documentId = 'doc-123';
      const settings: ShareSettings = {
        recipientIds: ['user1', 'user2'],
        permissionLevel: 'view',
        message: 'Please review'
      };

      service.shareDocument(documentId, settings).subscribe({
        next: () => {},
        error: fail
      });

      // Validate recipients
      const validateReq = httpMock.expectOne(`${apiUrl}/validate-recipients`);
      expect(validateReq.request.method).toBe('POST');
      validateReq.flush({ valid: true });

      tick();

      // Share document
      const shareReq = httpMock.expectOne(`${apiUrl}/documents/${documentId}/share`);
      expect(shareReq.request.method).toBe('POST');
      shareReq.flush(null);

      tick();

      // Notify recipients
      const notifyReq = httpMock.expectOne(`${apiUrl}/notify`);
      expect(notifyReq.request.method).toBe('POST');
      notifyReq.flush(null);

      tick();
    }));

    it('should handle invalid recipients', fakeAsync(() => {
      const documentId = 'doc-123';
      const settings: ShareSettings = {
        recipientIds: ['user1'],
        permissionLevel: 'view'
      };

      service.shareDocument(documentId, settings).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid recipients or insufficient permissions');
        }
      });

      const validateReq = httpMock.expectOne(`${apiUrl}/validate-recipients`);
      validateReq.flush({ valid: false });

      tick();
    }));

    it('should handle sharing error', fakeAsync(() => {
      const documentId = 'doc-123';
      const settings: ShareSettings = {
        recipientIds: ['user1'],
        permissionLevel: 'view'
      };

      service.shareDocument(documentId, settings).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
          expect(error.status).toBe(500);
        }
      });

      const validateReq = httpMock.expectOne(`${apiUrl}/validate-recipients`);
      validateReq.flush({ valid: true });

      tick();

      const shareReq = httpMock.expectOne(`${apiUrl}/documents/${documentId}/share`);
      shareReq.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });

      tick();
    }));

    it('should validate recipient permissions with empty list', fakeAsync(() => {
      service.validateRecipientPermissions([]).subscribe({
        next: (isValid) => expect(isValid).toBe(false),
        error: fail
      });

      tick();
    }));

    it('should validate recipient permissions with valid list', fakeAsync(() => {
      const recipientIds = ['user1', 'user2'];

      service.validateRecipientPermissions(recipientIds).subscribe({
        next: (isValid) => expect(isValid).toBe(true),
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/validate-recipients`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ recipientIds });
      req.flush({ valid: true });

      tick();
    }));

    it('should handle validation error', fakeAsync(() => {
      const recipientIds = ['user1'];

      service.validateRecipientPermissions(recipientIds).subscribe({
        next: (isValid) => expect(isValid).toBe(false),
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/validate-recipients`);
      req.error(new ErrorEvent('Network error'));

      tick();
    }));

    it('should set share expiration', fakeAsync(() => {
      const documentId = 'doc-123';
      const expirationDate = new Date('2024-12-31');
      const now = new Date('2024-01-01').getTime();
      spyOn(Date, 'now').and.returnValue(now);

      service.setShareExpiration(documentId, expirationDate).subscribe({
        next: () => {},
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/documents/${documentId}/expiration`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ expirationDate });
      req.flush(null);

      tick();
    }));

    it('should reject invalid expiration date', fakeAsync(() => {
      const documentId = 'doc-123';
      const pastDate = new Date('2020-01-01');
      const now = new Date('2024-01-01').getTime();
      spyOn(Date, 'now').and.returnValue(now);

      service.setShareExpiration(documentId, pastDate).subscribe({
        error: (error) => {
          expect(error instanceof Error).toBe(true);
          expect(error.message).toBe('Invalid expiration date');
        }
      });

      tick();
    }));

    it('should handle expiration setting error', fakeAsync(() => {
      const documentId = 'doc-123';
      const expirationDate = new Date('2024-12-31');
      const now = new Date('2024-01-01').getTime();
      spyOn(Date, 'now').and.returnValue(now);

      service.setShareExpiration(documentId, expirationDate).subscribe({
        error: (error) => {
          expect(error instanceof Error).toBe(true);
          expect(error.message).toBe('Failed to set expiration date');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/documents/${documentId}/expiration`);
      req.error(new ErrorEvent('Network error'));

      tick();
    }));

    it('should notify recipients', fakeAsync(() => {
      const documentId = 'doc-123';
      const recipientIds = ['user1', 'user2'];
      const message = 'Please review';

      service.notifyRecipients(documentId, recipientIds, message).subscribe({
        next: () => {},
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/notify`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        recipientIds,
        documentIds: [documentId],
        message,
        type: 'share'
      });
      req.flush(null);

      tick();
    }));

    it('should handle notification error', fakeAsync(() => {
      const documentId = 'doc-123';
      const recipientIds = ['user1'];

      service.notifyRecipients(documentId, recipientIds).subscribe({
        error: (error) => {
          expect(error instanceof Error).toBe(true);
          expect(error.message).toBe('Failed to notify recipients');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/notify`);
      req.error(new ErrorEvent('Network error'));

      tick();
    }));

    it('should handle empty recipient list', fakeAsync(() => {
      const documentId = 'doc-123';
      const settings: ShareSettings = {
        recipientIds: [],
        permissionLevel: 'view'
      };

      service.shareDocument(documentId, settings).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid recipients or insufficient permissions');
        }
      });

      tick();
    }));

    it('should handle invalid expiration date', fakeAsync(() => {
      const documentId = 'doc-123';
      const pastDate = new Date(Date.now() - 86400000); // Yesterday

      service.setShareExpiration(documentId, pastDate).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid expiration date');
        }
      });

      tick();
    }));

    it('should handle invalid password for link protection', fakeAsync(() => {
      const linkId = 'link-123';
      const shortPassword = '123';

      service.configurePasswordProtection(linkId, shortPassword).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid password - must be at least 8 characters');
        }
      });

      tick();
    }));
  });

  // UC-DS-02: Share Multiple Documents
  describe('Share Multiple Documents', () => {
    it('should share multiple documents', fakeAsync(() => {
      const documentIds = ['doc-1', 'doc-2'];
      const settings: ShareSettings = {
        recipientIds: ['user1'],
        permissionLevel: 'view'
      };

      service.shareMultipleDocuments(documentIds, settings).subscribe({
        next: () => {},
        error: fail
      });

      const validateReq = httpMock.expectOne(`${apiUrl}/validate-recipients`);
      validateReq.flush({ valid: true });

      tick();

      documentIds.forEach(id => {
        const shareReq = httpMock.expectOne(`${apiUrl}/documents/${id}/share`);
        expect(shareReq.request.method).toBe('POST');
        shareReq.flush(null);
      });

      tick();
    }));

    it('should handle partial failures', fakeAsync(() => {
      const documentIds = ['doc-1', 'doc-2'];
      const settings: ShareSettings = {
        recipientIds: ['user1'],
        permissionLevel: 'view'
      };

      service.shareMultipleDocuments(documentIds, settings).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to handle sharing failures');
        }
      });

      const validateReq = httpMock.expectOne(`${apiUrl}/validate-recipients`);
      validateReq.flush({ valid: true });

      tick();

      const shareReq1 = httpMock.expectOne(`${apiUrl}/documents/doc-1/share`);
      shareReq1.error(new ErrorEvent('Network error'));

      tick();

      const failuresReq = httpMock.expectOne(`${apiUrl}/handle-failures`);
      failuresReq.error(new ErrorEvent('Network error'));

      tick();
    }));

    it('should handle partial sharing failures with recovery', fakeAsync(() => {
      const results = new Map([
        ['doc-1', false],
        ['doc-2', true]
      ]);

      service.handlePartialSharingFailures(results).subscribe({
        next: () => {},
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/handle-failures`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ failedDocuments: ['doc-1'] });
      req.flush(null);

      tick();
    }));

    it('should handle no failures case', fakeAsync(() => {
      const results = new Map([
        ['doc-1', true],
        ['doc-2', true]
      ]);

      let completed = false;
      service.handlePartialSharingFailures(results).subscribe({
        next: () => {},
        complete: () => completed = true,
        error: fail
      });

      tick();
      httpMock.expectNone(`${apiUrl}/handle-failures`);
      expect(completed).toBe(true);
    }));

    it('should apply common permissions', fakeAsync(() => {
      const documentIds = ['doc-1', 'doc-2'];
      const permissions: SharePermission[] = [{
        userId: 'user1',
        documentId: 'doc-1',
        level: 'edit',
        grantedBy: 'admin',
        grantedAt: new Date()
      }];

      service.applyCommonPermissions(documentIds, permissions).subscribe({
        next: () => {},
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/apply-permissions`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ documentIds, permissions });
      req.flush(null);

      tick();
    }));

    it('should handle common permissions error', fakeAsync(() => {
      const documentIds = ['doc-1'];
      const permissions: SharePermission[] = [];

      service.applyCommonPermissions(documentIds, permissions).subscribe({
        error: (error) => {
          expect(error instanceof Error).toBe(true);
          expect(error.message).toBe('Failed to apply common permissions');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/apply-permissions`);
      req.error(new ErrorEvent('Network error'));

      tick();
    }));

    it('should batch notify recipients', fakeAsync(() => {
      const documentIds = ['doc-1', 'doc-2'];
      const recipientIds = ['user1', 'user2'];
      const message = 'Please review';

      service.batchNotifyRecipients(documentIds, recipientIds, message).subscribe({
        next: () => {},
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/batch-notify`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        recipientIds,
        documentIds,
        message,
        type: 'share'
      });
      req.flush(null);

      tick();
    }));

    it('should handle batch notification error', fakeAsync(() => {
      const documentIds = ['doc-1', 'doc-2'];
      const recipientIds = ['user1', 'user2'];
      const message = 'Test message';

      service.batchNotifyRecipients(documentIds, recipientIds, message).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to notify recipients');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/batch-notify`);
      req.error(new ErrorEvent('Network error'));

      tick();
    }));

    it('should handle multiple document sharing with no remaining documents', fakeAsync(() => {
      const documentIds = ['doc-1'];
      const settings: ShareSettings = {
        recipientIds: ['user1'],
        permissionLevel: 'view'
      };

      service.shareMultipleDocuments(documentIds, settings).subscribe({
        next: () => expect().nothing(),
        error: fail
      });

      const validateReq = httpMock.expectOne(`${apiUrl}/validate-recipients`);
      validateReq.flush({ valid: true });

      tick();

      const shareReq = httpMock.expectOne(`${apiUrl}/documents/doc-1/share`);
      shareReq.flush(null);

      tick();
    }));

    it('should handle multiple document sharing with notification error', fakeAsync(() => {
      const documentIds = ['doc-1', 'doc-2'];
      const settings: ShareSettings = {
        recipientIds: ['user1'],
        permissionLevel: 'view',
        message: 'Test message'
      };

      service.shareMultipleDocuments(documentIds, settings).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to handle sharing failures');
        }
      });

      const validateReq = httpMock.expectOne(`${apiUrl}/validate-recipients`);
      validateReq.flush({ valid: true });

      tick();

      const shareReq = httpMock.expectOne(`${apiUrl}/documents/doc-1/share`);
      shareReq.flush(null);

      tick();

      const shareReq2 = httpMock.expectOne(`${apiUrl}/documents/doc-2/share`);
      shareReq2.flush(null);

      tick();

      const notifyReq = httpMock.expectOne(`${apiUrl}/batch-notify`);
      notifyReq.error(new ErrorEvent('Network error'));

      tick();

      const failuresReq = httpMock.expectOne(`${apiUrl}/handle-failures`);
      failuresReq.error(new ErrorEvent('Network error'));

      tick();
    }));

    it('should handle access revocation with HTTP error', fakeAsync(() => {
      const linkId = 'link-123';
      const expirationDate = new Date(Date.now() + 86400000); // Tomorrow

      service.setLinkExpiration(linkId, expirationDate).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/links/${linkId}/expiration`);
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });

      tick();
    }));

    it('should handle link expiration with network error', fakeAsync(() => {
      const linkId = 'link-123';
      const expirationDate = new Date(Date.now() + 86400000); // Tomorrow

      service.setLinkExpiration(linkId, expirationDate).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
          expect(error.status).toBe(0);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/links/${linkId}/expiration`);
      req.error(new ErrorEvent('Network error'));

      tick();
    }));

    it('should handle password protection with HTTP error', fakeAsync(() => {
      const linkId = 'link-123';
      const password = 'validPassword123';

      service.configurePasswordProtection(linkId, password).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/links/${linkId}/password`);
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });

      tick();
    }));

    it('should handle password protection with network error', fakeAsync(() => {
      const linkId = 'link-123';
      const password = 'validPassword123';

      service.configurePasswordProtection(linkId, password).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
          expect(error.status).toBe(0);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/links/${linkId}/password`);
      req.error(new ErrorEvent('Network error'));

      tick();
    }));

    it('should handle link usage tracking with HTTP error', fakeAsync(() => {
      const linkId = 'link-123';

      service.trackLinkUsage(linkId).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/links/${linkId}/usage`);
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });

      tick();
    }));

    it('should handle link usage tracking with network error', fakeAsync(() => {
      const linkId = 'link-123';

      service.trackLinkUsage(linkId).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
          expect(error.status).toBe(0);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/links/${linkId}/usage`);
      req.error(new ErrorEvent('Network error'));

      tick();
    }));

    it('should handle access revocation with HTTP error', fakeAsync(() => {
      const documentId = 'doc-123';
      const userIds = ['user1', 'user2'];

      service.revokeAccess(documentId, userIds).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/documents/${documentId}/revoke`);
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });

      tick();
    }));

    it('should handle access revocation with network error', fakeAsync(() => {
      const documentId = 'doc-123';
      const userIds = ['user1', 'user2'];

      service.revokeAccess(documentId, userIds).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
          expect(error.status).toBe(0);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/documents/${documentId}/revoke`);
      req.error(new ErrorEvent('Network error'));

      tick();
    }));

    it('should handle access revocation with notification error', fakeAsync(() => {
      const documentId = 'doc-123';
      const userIds = ['user1', 'user2'];

      service.revokeAccess(documentId, userIds).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
          expect(error.status).toBe(0);
        }
      });

      const revokeReq = httpMock.expectOne(`${apiUrl}/documents/${documentId}/revoke`);
      revokeReq.flush(null);

      tick();

      const notifyReq = httpMock.expectOne(`${apiUrl}/notify`);
      notifyReq.error(new ErrorEvent('Network error'));

      tick();
    }));
  });

  // UC-DS-03: Generate Share Link
  describe('Share Link Generation', () => {
    it('should generate share link', fakeAsync(() => {
      const documentId = 'doc-123';
      const options: Partial<ShareLink> = {
        expirationDate: new Date('2024-12-31'),
        password: 'password123',
        usageLimit: 10
      };

      const mockLink: ShareLink = {
        id: 'link-123',
        url: 'http://example.com/share/link-123',
        expirationDate: options.expirationDate,
        password: options.password,
        usageLimit: options.usageLimit,
        usageCount: 0,
        createdAt: new Date()
      };

      service.generateShareLink(documentId, options).subscribe({
        next: (link) => expect(link).toEqual(mockLink),
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/links/generate`);
      expect(req.request.method).toBe('POST');
      req.flush(mockLink);

      tick();
    }));

    it('should handle link generation error', fakeAsync(() => {
      const documentId = 'doc-123';

      service.generateShareLink(documentId).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/links/generate`);
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });

      tick();
    }));

    it('should set link expiration', fakeAsync(() => {
      const linkId = 'link-123';
      const expirationDate = new Date('2024-12-31');
      const now = new Date('2024-01-01').getTime();
      spyOn(Date, 'now').and.returnValue(now);

      service.setLinkExpiration(linkId, expirationDate).subscribe({
        next: () => {},
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/links/${linkId}/expiration`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ expirationDate });
      req.flush(null);

      tick();
    }));

    it('should reject invalid expiration date', fakeAsync(() => {
      const linkId = 'link-123';
      const pastDate = new Date('2020-01-01');
      const now = new Date('2024-01-01').getTime();
      spyOn(Date, 'now').and.returnValue(now);

      service.setLinkExpiration(linkId, pastDate).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid expiration date');
        }
      });

      tick();
    }));
  });

  // UC-DS-04: Manage Shared Access
  describe('Shared Access Management', () => {
    it('should modify share permissions', fakeAsync(() => {
      const documentId = 'doc-123';
      const changes: Partial<SharePermission>[] = [{
        userId: 'user1',
        level: 'edit'
      }];

      let completed = false;
      service.modifySharePermissions(documentId, changes).subscribe({
        next: () => {},
        complete: () => completed = true,
        error: fail
      });

      const validateReq = httpMock.expectOne(`${apiUrl}/documents/${documentId}/validate-dependencies`);
      expect(validateReq.request.method).toBe('POST');
      expect(validateReq.request.body).toEqual({ changes });
      validateReq.flush(null);

      tick();

      const permissionsReq = httpMock.expectOne(`${apiUrl}/documents/${documentId}/permissions`);
      expect(permissionsReq.request.method).toBe('PUT');
      expect(permissionsReq.request.body).toEqual({ changes });
      permissionsReq.flush(null);

      tick();

      const notifyReq = httpMock.expectOne(`${apiUrl}/notify`);
      expect(notifyReq.request.method).toBe('POST');
      expect(notifyReq.request.body).toEqual({
        recipientIds: ['user1'],
        documentIds: [documentId],
        type: 'update'
      });
      notifyReq.flush(null);

      tick();
      expect(completed).toBe(true);
    }));

    it('should handle permission dependency conflicts', fakeAsync(() => {
      const documentId = 'doc-123';
      const changes: Partial<SharePermission>[] = [{
        userId: 'user1',
        level: 'edit'
      }];

      service.modifySharePermissions(documentId, changes).subscribe({
        error: (error) => {
          expect(error.message).toBe('Permission changes conflict with existing dependencies');
        }
      });

      const validateReq = httpMock.expectOne(`${apiUrl}/documents/${documentId}/validate-dependencies`);
      validateReq.flush('Conflict', { status: 409, statusText: 'Conflict' });

      tick();
    }));

    it('should revoke access', fakeAsync(() => {
      const documentId = 'doc-123';
      const userIds = ['user1', 'user2'];

      service.revokeAccess(documentId, userIds).subscribe({
        next: () => {},
        error: fail
      });

      const revokeReq = httpMock.expectOne(`${apiUrl}/documents/${documentId}/revoke`);
      expect(revokeReq.request.method).toBe('POST');
      revokeReq.flush(null);

      tick();

      const notifyReq = httpMock.expectOne(`${apiUrl}/notify`);
      notifyReq.flush(null);

      tick();
    }));

    it('should handle permission dependencies', fakeAsync(() => {
      const documentId = 'doc-123';
      const changes: Partial<SharePermission>[] = [{
        userId: 'user1',
        level: 'edit'
      }];

      service.handlePermissionDependencies(documentId, changes).subscribe({
        next: () => {},
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/documents/${documentId}/validate-dependencies`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ changes });
      req.flush(null);

      tick();
    }));

    it('should handle dependency validation error', fakeAsync(() => {
      const documentId = 'doc-123';
      const changes: Partial<SharePermission>[] = [{
        userId: 'user1',
        level: 'edit'
      }];

      service.handlePermissionDependencies(documentId, changes).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to validate permission dependencies');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/documents/${documentId}/validate-dependencies`);
      req.error(new ErrorEvent('Network error'));

      tick();
    }));

    it('should handle dependency conflict', fakeAsync(() => {
      const documentId = 'doc-123';
      const changes: Partial<SharePermission>[] = [{
        userId: 'user1',
        level: 'edit'
      }];

      service.handlePermissionDependencies(documentId, changes).subscribe({
        error: (error) => {
          expect(error.message).toBe('Permission changes conflict with existing dependencies');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/documents/${documentId}/validate-dependencies`);
      req.flush('Conflict', { status: 409, statusText: 'Conflict' });

      tick();
    }));

    it('should notify permission changes', fakeAsync(() => {
      const documentId = 'doc-123';
      const affectedUserIds = ['user1', 'user2'];

      service.notifyPermissionChanges(documentId, affectedUserIds).subscribe({
        next: () => {},
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/notify`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        recipientIds: affectedUserIds,
        documentIds: [documentId],
        type: 'update'
      });
      req.flush(null);

      tick();
    }));

    it('should handle permission notification error', fakeAsync(() => {
      const documentId = 'doc-123';
      const affectedUserIds = ['user1'];

      service.notifyPermissionChanges(documentId, affectedUserIds).subscribe({
        error: (error) => {
          expect(error instanceof Error).toBe(true);
          expect(error.message).toBe('Failed to notify permission changes');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/notify`);
      req.error(new ErrorEvent('Network error'));

      tick();
    }));
  });

  // UC-DS-05: Share Activity Monitoring
  describe('Activity Monitoring', () => {
    it('should track document access', fakeAsync(() => {
      const documentId = 'doc-123';
      const mockActivity: ShareActivity[] = [{
        id: 'activity-1',
        documentId: 'doc-1',
        userId: 'user1',
        action: 'view',
        timestamp: new Date()
      }];

      service.trackDocumentAccess(documentId).subscribe({
        next: (activity) => expect(activity).toEqual(mockActivity),
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/documents/${documentId}/activity`);
      expect(req.request.method).toBe('GET');
      req.flush(mockActivity);

      tick();
    }));

    it('should generate activity reports', fakeAsync(() => {
      const documentIds = ['doc-1', 'doc-2'];
      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31')
      };
      const mockReports: ShareActivity[] = [
        {
          id: 'activity-1',
          documentId: 'doc-1',
          userId: 'user1',
          action: 'view',
          timestamp: new Date(),
          details: {
            source: 'web',
            ipAddress: '127.0.0.1'
          }
        }
      ];

      service.generateActivityReports(documentIds, dateRange).subscribe({
        next: (reports) => expect(reports).toEqual(mockReports),
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/reports/activity`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ documentIds, dateRange });
      req.flush(mockReports);

      tick();
    }));

    it('should handle activity report generation error', fakeAsync(() => {
      const documentIds = ['doc-1', 'doc-2'];
      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31')
      };

      service.generateActivityReports(documentIds, dateRange).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to generate activity reports');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/reports/activity`);
      req.error(new ErrorEvent('Network error'));

      tick();
    }));

    it('should handle invalid date range for activity reports', fakeAsync(() => {
      const documentIds = ['doc-1'];
      const dateRange = {
        start: new Date('2024-12-31'),
        end: new Date('2024-01-01')
      };

      service.generateActivityReports(documentIds, dateRange).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid date range');
        }
      });

      tick();
    }));

    it('should monitor link usage', fakeAsync(() => {
      const linkId = 'link-123';
      const mockActivity: ShareActivity[] = [{
        id: 'activity-1',
        documentId: 'doc-1',
        userId: 'user1',
        action: 'view',
        timestamp: new Date()
      }];

      service.monitorLinkUsage(linkId).subscribe({
        next: (activity) => expect(activity).toEqual(mockActivity),
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/links/${linkId}/activity`);
      expect(req.request.method).toBe('GET');
      req.flush(mockActivity);

      tick();
    }));

    it('should export activity data', fakeAsync(() => {
      const documentIds = ['doc-1', 'doc-2'];
      const format = 'csv';
      const mockBlob = new Blob(['test'], { type: 'text/csv' });

      service.exportActivityData(documentIds, format).subscribe({
        next: (blob) => expect(blob).toEqual(mockBlob),
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/reports/export`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ documentIds, format });
      req.flush(mockBlob);

      tick();
    }));

    it('should handle document access tracking error', fakeAsync(() => {
      const documentId = 'doc-123';

      service.trackDocumentAccess(documentId).subscribe({
        error: (error) => {
          expect(error instanceof Error).toBe(true);
          expect(error.message).toBe('Failed to track document access');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/documents/${documentId}/activity`);
      req.error(new ErrorEvent('Network error'));

      tick();
    }));

    it('should handle activity report generation error', fakeAsync(() => {
      const documentIds = ['doc-1', 'doc-2'];
      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31')
      };

      service.generateActivityReports(documentIds, dateRange).subscribe({
        error: (error) => {
          expect(error instanceof Error).toBe(true);
          expect(error.message).toBe('Failed to generate activity reports');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/reports/activity`);
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });

      tick();
    }));

    it('should handle link usage monitoring error', fakeAsync(() => {
      const linkId = 'link-123';

      service.monitorLinkUsage(linkId).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/links/${linkId}/activity`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      tick();
    }));

    it('should handle activity data export error', fakeAsync(() => {
      const documentIds = ['doc-1', 'doc-2'];
      const format = 'pdf';

      service.exportActivityData(documentIds, format).subscribe({
        error: (error) => {
          expect(error instanceof Error).toBe(true);
          expect(error.message).toBe('Failed to export activity data');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/reports/export`);
      req.error(new ErrorEvent('Network error'));

      tick();
    }));

    it('should export activity data with different formats', fakeAsync(() => {
      const documentIds = ['doc-1'];
      const formats: ('csv' | 'pdf')[] = ['csv', 'pdf'];
      const mimeTypes = {
        csv: 'text/csv',
        pdf: 'application/pdf'
      };

      formats.forEach(format => {
        const mockBlob = new Blob(['test'], { type: mimeTypes[format] });

        service.exportActivityData(documentIds, format).subscribe({
          next: (blob) => {
            expect(blob instanceof Blob).toBe(true);
            expect(blob.type).toBe(mimeTypes[format]);
          },
          error: fail
        });

        const req = httpMock.expectOne(`${apiUrl}/reports/export`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ documentIds, format });
        req.flush(mockBlob);

        tick();
      });
    }));
  });
}); 