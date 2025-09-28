import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService, UserRole, UserStatus, User, ContactInfo, UserRegistration, AuditCriteria, AuditLog } from './user.service';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
class TestUserService extends UserService {
  constructor(http: HttpClient) {
    super(http);
  }

  public testCheckDuplicateEmail(email: string) {
    return this.checkDuplicateEmail(email);
  }
}

describe('UserService', () => {
  let service: TestUserService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/users`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TestUserService,
        { provide: UserService, useExisting: TestUserService }
      ]
    });
    service = TestBed.inject(TestUserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // UC-UM-01: User Registration
  describe('User Registration', () => {
    const validRegistration: UserRegistration = {
      email: 'test@example.com',
      fullName: 'Test User',
      role: UserRole.CREATOR,
      department: 'Engineering',
      contactInfo: {
        phone: '1234567890',
        location: 'Office A'
      }
    };

    it('should register new user with valid data', fakeAsync(() => {
      const expectedUser = {
        ...validRegistration,
        id: '12345',
        status: UserStatus.ACTIVE
      };

      service.registerUser(validRegistration).subscribe(user => {
        expect(user.email).toBe(validRegistration.email);
        expect(user.fullName).toBe(validRegistration.fullName);
        expect(user.role).toBe(validRegistration.role);
        expect(user.status).toBe(UserStatus.ACTIVE);
      });

      // Check duplicate email
      const emailCheck = httpMock.expectOne(`${apiUrl}?email=${validRegistration.email}`);
      expect(emailCheck.request.method).toBe('GET');
      emailCheck.flush([]);

      // Verify registration request
      const regRequest = httpMock.expectOne(apiUrl);
      expect(regRequest.request.method).toBe('POST');
      expect(regRequest.request.body).toEqual(validRegistration);
      regRequest.flush(expectedUser);

      tick();
    }));

    it('should reject registration with duplicate email', fakeAsync(() => {
      service.registerUser(validRegistration).subscribe({
        error: (error) => {
          expect(error.message).toBe('Email already exists');
        }
      });

      const emailCheck = httpMock.expectOne(`${apiUrl}?email=${validRegistration.email}`);
      emailCheck.flush([{ email: validRegistration.email }]);

      tick();
    }));

    it('should handle registration with missing required fields', fakeAsync(() => {
      const invalidReg = {
        email: 'test@example.com'
      } as UserRegistration;
      
      service.registerUser(invalidReg).subscribe({
        error: (error) => {
          expect(error.message).toBe('Missing required fields');
        }
      });

      tick();
    }));

    it('should handle registration with invalid role', fakeAsync(() => {
      const invalidReg = {
        ...validRegistration,
        role: 'INVALID_ROLE' as UserRole
      };
      
      service.registerUser(invalidReg).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid user role');
        }
      });

      tick();
    }));

    it('should handle registration with invalid contact info', fakeAsync(() => {
      const invalidReg = {
        ...validRegistration,
        contactInfo: {
          phone: 'invalid-phone',
          location: ''
        }
      };
      
      service.registerUser(invalidReg).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid contact information');
        }
      });

      tick();
    }));

    it('should handle email check error gracefully', fakeAsync(() => {
      let errorOccurred = false;
      service.testCheckDuplicateEmail(validRegistration.email).subscribe({
        next: fail,
        error: (error) => {
          expect(error).toBeTruthy();
          errorOccurred = true;
        }
      });

      const emailCheck = httpMock.expectOne(`${apiUrl}?email=${validRegistration.email}`);
      emailCheck.error(new ErrorEvent('Network error'));

      tick();
      expect(errorOccurred).toBe(true);
    }));

    it('should handle email check with network error status 0', fakeAsync(() => {
      service.testCheckDuplicateEmail(validRegistration.email).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to check email');
        }
      });

      const emailCheck = httpMock.expectOne(`${apiUrl}?email=${validRegistration.email}`);
      emailCheck.error(new ErrorEvent('Network error'), { status: 0 });

      tick();
    }));

    it('should complete full registration flow successfully', fakeAsync(() => {
      const expectedUser: User = {
        ...validRegistration,
        id: '12345',
        status: UserStatus.ACTIVE
      };

      service.registerUser(validRegistration).subscribe(user => {
        expect(user.id).toBe(expectedUser.id);
        expect(user.email).toBe(expectedUser.email);
        expect(user.fullName).toBe(expectedUser.fullName);
        expect(user.role).toBe(expectedUser.role);
        expect(user.status).toBe(expectedUser.status);
        expect(user.department).toBe(expectedUser.department);
        expect(user.contactInfo).toEqual(expectedUser.contactInfo);
      });

      // Verify email check request
      const emailCheck = httpMock.expectOne(`${apiUrl}?email=${validRegistration.email}`);
      expect(emailCheck.request.method).toBe('GET');
      emailCheck.flush([]);

      // Verify registration request
      const regRequest = httpMock.expectOne(apiUrl);
      expect(regRequest.request.method).toBe('POST');
      expect(regRequest.request.body).toEqual(validRegistration);
      regRequest.flush(expectedUser);

      tick();
    }));

    it('should handle registration when user was previously suspended', fakeAsync(() => {
      const suspendedUser: User = {
        id: '12345',
        email: validRegistration.email,
        fullName: 'Old Name',
        role: UserRole.VIEWER,
        status: UserStatus.SUSPENDED
      };

      service.registerUser(validRegistration).subscribe({
        error: (error) => {
          expect(error.message).toBe('Account is suspended. Please contact support.');
        }
      });

      // Check for existing email
      const emailCheck = httpMock.expectOne(`${apiUrl}?email=${validRegistration.email}`);
      expect(emailCheck.request.method).toBe('GET');
      emailCheck.flush([suspendedUser]);

      tick();

      // Verify no registration request was made
      httpMock.expectNone(apiUrl);
    }));

    it('should handle registration with invalid email format', fakeAsync(() => {
      const invalidReg = {
        ...validRegistration,
        email: 'invalid-email'
      };
      
      service.registerUser(invalidReg).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid email format');
        }
      });

      tick();
    }));

    it('should handle registration with empty contact info fields', fakeAsync(() => {
      const invalidReg = {
        ...validRegistration,
        contactInfo: {
          phone: '',
          location: ''
        }
      };
      
      service.registerUser(invalidReg).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid contact information');
        }
      });

      tick();
    }));

    it('should handle HTTP error during registration', fakeAsync(() => {
      service.registerUser(validRegistration).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to register user');
        }
      });

      // Check duplicate email
      const emailCheck = httpMock.expectOne(`${apiUrl}?email=${validRegistration.email}`);
      expect(emailCheck.request.method).toBe('GET');
      emailCheck.flush([]);

      // Verify registration request
      const regRequest = httpMock.expectOne(apiUrl);
      expect(regRequest.request.method).toBe('POST');
      regRequest.error(new ErrorEvent('Network error'));

      tick();
    }));
  });

  // UC-UM-02: User Profile Management
  describe('User Profile Management', () => {
    const userId = '123';
    const validUpdates: Partial<User> = {
      fullName: 'Updated Name',
      department: 'New Department',
      contactInfo: {
        phone: '0987654321',
        location: 'New Office'
      }
    };

    it('should update user profile with valid data', fakeAsync(() => {
      service.updateUserProfile(userId, validUpdates).subscribe(user => {
        expect(user.fullName).toBe('Updated Name');
        expect(user.department).toBe('New Department');
      });

      const updateReq = httpMock.expectOne(`${apiUrl}/${userId}`);
      expect(updateReq.request.method).toBe('PATCH');
      updateReq.flush({ ...validUpdates, id: userId });

      tick();
    }));

    it('should handle profile update with invalid contact info format', fakeAsync(() => {
      const invalidUpdates = {
        contactInfo: {
          phone: '123', // Too short
          location: '' // Empty
        }
      };

      service.updateUserProfile(userId, invalidUpdates).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid contact information format');
        }
      });

      tick();
    }));

    it('should handle profile update with invalid department length', fakeAsync(() => {
      const invalidUpdates = {
        department: 'a'.repeat(101) // Exceeds max length
      };

      service.updateUserProfile(userId, invalidUpdates).subscribe({
        error: (error) => {
          expect(error.message).toBe('Department name too long');
        }
      });

      tick();
    }));

    it('should validate role change in profile update', fakeAsync(() => {
      const currentUser: User = {
        id: userId,
        email: 'test@example.com',
        fullName: 'Test User',
        role: UserRole.VIEWER,
        status: UserStatus.ACTIVE
      };

      // Try to update from VIEWER to ADMIN (not allowed)
      const roleUpdates: Partial<User> = {
        role: UserRole.ADMIN
      };

      service.updateUserProfile(userId, roleUpdates).subscribe({
        error: (error) => {
          expect(error.message).toBe('Role change not allowed');
        }
      });

      // Verify current user fetch
      const getUserReq = httpMock.expectOne(`${apiUrl}/${userId}`);
      expect(getUserReq.request.method).toBe('GET');
      getUserReq.flush(currentUser);

      tick();

      // Try to update from CREATOR to VIEWER (allowed)
      const creatorUser: User = {
        ...currentUser,
        role: UserRole.CREATOR
      };

      const validRoleUpdate: Partial<User> = {
        role: UserRole.VIEWER
      };

      service.updateUserProfile(userId, validRoleUpdate).subscribe(user => {
        expect(user.role).toBe(UserRole.VIEWER);
      });

      // Verify current user fetch
      const getCreatorReq = httpMock.expectOne(`${apiUrl}/${userId}`);
      expect(getCreatorReq.request.method).toBe('GET');
      getCreatorReq.flush(creatorUser);

      // Verify update request
      const updateReq = httpMock.expectOne(`${apiUrl}/${userId}`);
      expect(updateReq.request.method).toBe('PATCH');
      expect(updateReq.request.body).toEqual(validRoleUpdate);
      updateReq.flush({ ...creatorUser, role: UserRole.VIEWER });

      tick();
    }));

    it('should handle concurrent profile updates', fakeAsync(() => {
      service.updateUserProfile(userId, validUpdates).subscribe({
        error: (error) => {
          expect(error.message).toBe('Profile was updated by another user');
        }
      });

      const updateReq = httpMock.expectOne(`${apiUrl}/${userId}`);
      updateReq.flush('Conflict', { 
        status: 409,
        statusText: 'Profile was updated by another user'
      });

      tick();
    }));

    it('should handle profile update error', fakeAsync(() => {
      service.updateUserProfile(userId, validUpdates).subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
        }
      });

      const updateReq = httpMock.expectOne(`${apiUrl}/${userId}`);
      updateReq.error(new ErrorEvent('Network error'));

      tick();
    }));

    it('should handle profile update with empty contact info', fakeAsync(() => {
      const invalidUpdates = {
        contactInfo: {
          phone: '',
          location: ''
        }
      };

      service.updateUserProfile(userId, invalidUpdates).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid contact information format');
        }
      });

      tick();
    }));

    it('should handle HTTP error during role validation', fakeAsync(() => {
      const roleUpdates: Partial<User> = {
        role: UserRole.VIEWER
      };

      service.updateUserProfile(userId, roleUpdates).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to update profile');
        }
      });

      const getUserReq = httpMock.expectOne(`${apiUrl}/${userId}`);
      getUserReq.error(new ErrorEvent('Network error'));

      tick();
    }));
  });

  // UC-UM-03: User Account Deactivation
  describe('User Account Deactivation', () => {
    const userId = '123';

    it('should deactivate user account', fakeAsync(() => {
      service.deactivateAccount(userId).subscribe(() => {
        expect().nothing();
      });

      const req = httpMock.expectOne(`${apiUrl}/${userId}/handle-shared-docs`);
      expect(req.request.method).toBe('POST');
      req.flush({});

      tick();
    }));

    it('should handle deactivation of already deactivated account', fakeAsync(() => {
      service.deactivateAccount(userId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Account already deactivated');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${userId}/handle-shared-docs`);
      req.flush('Account already deactivated', {
        status: 400,
        statusText: 'Bad Request'
      });

      tick();
    }));

    it('should handle deactivation with pending operations', fakeAsync(() => {
      service.deactivateAccount(userId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Account has pending operations');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${userId}/handle-shared-docs`);
      req.flush('Account has pending operations', {
        status: 409,
        statusText: 'Conflict'
      });

      tick();
    }));

    it('should handle network error during deactivation', fakeAsync(() => {
      service.deactivateAccount(userId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to deactivate account');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${userId}/handle-shared-docs`);
      req.error(new ErrorEvent('Network error'));

      tick();
    }));
  });

  // UC-UM-04: User Account Deletion
  describe('User Account Deletion', () => {
    const userId = '123';

    it('should delete user account when no blockers exist', fakeAsync(() => {
      service.deleteAccount(userId).subscribe(() => {
        expect().nothing();
      });

      // Impact analysis request
      const impactReq = httpMock.expectOne(`${apiUrl}/${userId}/deletion-impact`);
      expect(impactReq.request.method).toBe('GET');
      impactReq.flush({ blockers: [] });

      tick();
    }));

    it('should not delete account when blockers exist', fakeAsync(() => {
      service.deleteAccount(userId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Cannot delete account due to dependencies');
        }
      });

      const impactReq = httpMock.expectOne(`${apiUrl}/${userId}/deletion-impact`);
      impactReq.flush({ blockers: ['Document ownership'] });

      tick();
    }));

    it('should handle deletion of account with active sessions', fakeAsync(() => {
      service.deleteAccount(userId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Cannot delete account with active sessions');
        }
      });

      const impactReq = httpMock.expectOne(`${apiUrl}/${userId}/deletion-impact`);
      impactReq.flush({ 
        blockers: ['Active sessions'],
        details: {
          sessionCount: 2,
          lastActivity: new Date().toISOString()
        }
      });

      tick();
    }));

    it('should handle network error during deletion impact check', fakeAsync(() => {
      service.deleteAccount(userId).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
        }
      });

      const impactReq = httpMock.expectOne(`${apiUrl}/${userId}/deletion-impact`);
      impactReq.error(new ErrorEvent('Network error'));

      tick();
    }));
  });

  describe('Document Handling', () => {
    const userId = '123';

    it('should successfully transfer documents during deletion', fakeAsync(() => {
      const transferResponse = {
        documentsTransferred: 10,
        totalSize: '25MB',
        status: 'completed'
      };

      service.handleDocumentsDuringDeletion(userId).subscribe(response => {
        expect(response).toEqual(transferResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/${userId}/handle-documents`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ action: 'archive' });
      req.flush(transferResponse);

      tick();
    }));

    it('should handle document transfer with insufficient permissions', fakeAsync(() => {
      service.handleDocumentsDuringDeletion(userId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Insufficient permissions for document transfer');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${userId}/handle-documents`);
      req.flush('Insufficient permissions', {
        status: 403,
        statusText: 'Forbidden'
      });

      tick();
    }));

    it('should handle document transfer with storage quota exceeded', fakeAsync(() => {
      service.handleDocumentsDuringDeletion(userId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Storage quota exceeded');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${userId}/handle-documents`);
      req.flush('Storage quota exceeded', {
        status: 413,
        statusText: 'Payload Too Large'
      });

      tick();
    }));

    it('should handle network error during document transfer', fakeAsync(() => {
      service.handleDocumentsDuringDeletion(userId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to transfer user documents');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${userId}/handle-documents`);
      req.error(new ErrorEvent('Network error'));

      tick();
    }));
  });

  describe('Access Status', () => {
    const userId = '123';

    it('should check access status successfully', fakeAsync(() => {
      service.checkAccessStatus(userId).subscribe(status => {
        expect(status).toBe(UserStatus.ACTIVE);
      });

      const req = httpMock.expectOne(`${apiUrl}/${userId}`);
      expect(req.request.method).toBe('GET');
      req.flush({ status: UserStatus.ACTIVE });

      tick();
    }));

    it('should handle user not found', fakeAsync(() => {
      service.checkAccessStatus(userId).subscribe({
        error: (error) => {
          expect(error.message).toBe('User not found');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${userId}`);
      req.error(new ErrorEvent('Not Found'), { status: 404 });

      tick();
    }));

    it('should handle temporary service outage', fakeAsync(() => {
      service.checkAccessStatus(userId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Service temporarily unavailable');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${userId}`);
      req.flush('Service unavailable', {
        status: 503,
        statusText: 'Service Unavailable'
      });

      tick();
    }));

    it('should handle rate limiting', fakeAsync(() => {
      service.checkAccessStatus(userId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Too many requests');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${userId}`);
      req.flush('Too many requests', {
        status: 429,
        statusText: 'Too Many Requests'
      });

      tick();
    }));

    it('should handle network error during access check', fakeAsync(() => {
      service.checkAccessStatus(userId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to check access status');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${userId}`);
      req.error(new ErrorEvent('Network error'));

      tick();
    }));
  });

  describe('Audit Logs', () => {
    const userId = '123';
    const now = new Date();
    const validCriteria: AuditCriteria = {
      userId,
      dateRange: {
        start: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
        end: now
      },
      activityTypes: ['login', 'document_access']
    };

    it('should filter audit logs with valid criteria', fakeAsync(() => {
      const mockLogs: AuditLog[] = [
        {
          id: '1',
          userId,
          action: 'login',
          timestamp: new Date(),
          details: { ip: '127.0.0.1' }
        }
      ];

      service.filterAuditLogs(validCriteria).subscribe(logs => {
        expect(logs).toEqual(mockLogs);
      });

      const req = httpMock.expectOne(request => request.url === `${apiUrl}/audit-logs`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('userId')).toBe(userId);
      expect(req.request.params.get('startDate')).toBeTruthy();
      expect(req.request.params.get('endDate')).toBeTruthy();
      req.flush(mockLogs);

      tick();
    }));

    it('should filter audit logs by specific activity types', fakeAsync(() => {
      const activityTypes = ['document_access', 'document_edit'];
      const criteria: AuditCriteria = {
        ...validCriteria,
        activityTypes
      };

      const mockLogs: AuditLog[] = [
        {
          id: '1',
          userId,
          action: 'document_access',
          timestamp: new Date(),
          details: { documentId: 'doc1' }
        },
        {
          id: '2',
          userId,
          action: 'document_edit',
          timestamp: new Date(),
          details: { documentId: 'doc2', changes: ['title'] }
        }
      ];

      service.filterAuditLogs(criteria).subscribe(logs => {
        expect(logs).toEqual(mockLogs);
        expect(logs.every(log => activityTypes.includes(log.action))).toBe(true);
      });

      const req = httpMock.expectOne(request => request.url === `${apiUrl}/audit-logs`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('userId')).toBe(userId);
      expect(req.request.params.getAll('activityType')).toEqual(activityTypes);
      req.flush(mockLogs);

      tick();
    }));

    it('should reject invalid activity types', fakeAsync(() => {
      const criteria: AuditCriteria = {
        ...validCriteria,
        activityTypes: ['invalid_action', 'unknown_type']
      };

      service.filterAuditLogs(criteria).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid activity types specified');
        }
      });

      tick();
    }));

    it('should reject invalid date range', fakeAsync(() => {
      const invalidCriteria: AuditCriteria = {
        ...validCriteria,
        dateRange: {
          start: now,
          end: new Date(now.getTime() - 24 * 60 * 60 * 1000) // End before start
        }
      };

      service.filterAuditLogs(invalidCriteria).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid date range');
        }
      });

      tick();
    }));

    it('should reject future end date', fakeAsync(() => {
      const invalidCriteria: AuditCriteria = {
        ...validCriteria,
        dateRange: {
          start: now,
          end: new Date(now.getTime() + 24 * 60 * 60 * 1000) // End in future
        }
      };

      service.filterAuditLogs(invalidCriteria).subscribe({
        error: (error) => {
          expect(error.message).toBe('Future dates not allowed');
        }
      });

      tick();
    }));

    it('should handle date range too large error', fakeAsync(() => {
      service.filterAuditLogs(validCriteria).subscribe({
        error: (error) => {
          expect(error.message).toBe('Date range too large');
        }
      });

      const req = httpMock.expectOne(request => request.url === `${apiUrl}/audit-logs`);
      req.flush('Date range too large', {
        status: 413,
        statusText: 'Request Entity Too Large'
      });

      tick();
    }));

    it('should handle network error during audit log filtering', fakeAsync(() => {
      service.filterAuditLogs(validCriteria).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to filter audit logs');
        }
      });

      const req = httpMock.expectOne(request => request.url === `${apiUrl}/audit-logs`);
      req.error(new ErrorEvent('Network error'));

      tick();
    }));
  });
});