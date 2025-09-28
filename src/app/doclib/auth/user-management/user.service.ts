import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError, tap, mergeMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export enum UserRole {
  ADMIN = 'admin',
  CREATOR = 'creator',
  VIEWER = 'viewer'
}

export enum UserStatus {
  ACTIVE = 'active',
  DEACTIVATED = 'deactivated',
  SUSPENDED = 'suspended'
}

export interface ContactInfo {
  phone: string;
  location: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  department?: string;
  status: UserStatus;
  contactInfo?: ContactInfo;
}

export interface UserRegistration {
  email: string;
  fullName: string;
  role: UserRole;
  department?: string;
  contactInfo?: ContactInfo;
}

export interface AuditCriteria {
  userId: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  activityTypes?: string[];
}

const VALID_ACTIVITY_TYPES = [
  'login',
  'logout',
  'document_access',
  'document_edit',
  'document_share',
  'document_delete',
  'profile_update'
];

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  timestamp: Date;
  details: any;
}

export interface DocumentTransferResponse {
  documentsTransferred: number;
  totalSize: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  registerUser(registration: UserRegistration): Observable<User> {
    // Validate required fields
    if (!registration.email || !registration.fullName || !registration.role) {
      return throwError(() => new Error('Missing required fields'));
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registration.email)) {
      return throwError(() => new Error('Invalid email format'));
    }

    // Validate role
    if (!Object.values(UserRole).includes(registration.role)) {
      return throwError(() => new Error('Invalid user role'));
    }

    // Validate contact info
    if (registration.contactInfo) {
      if (!registration.contactInfo.phone || !registration.contactInfo.location || 
          registration.contactInfo.phone.length < 5 || registration.contactInfo.location.trim().length === 0) {
        return throwError(() => new Error('Invalid contact information'));
      }
    }

    return this.checkDuplicateEmail(registration.email).pipe(
      mergeMap(exists => {
        if (exists) {
          throw new Error('Email already exists');
        }
        return this.http.post<User>(this.apiUrl, registration);
      }),
      catchError(error => {
        if (error.message && error.message !== 'Http failure response for http://65.0.4.145:3000/api/users: 0 ') {
          return throwError(() => error);
        }
        return throwError(() => new Error('Failed to register user'));
      })
    );
  }

  updateUserProfile(userId: string, updates: Partial<User>): Observable<User> {
    // Validate contact info format
    if (updates.contactInfo) {
      if (!updates.contactInfo.phone || !updates.contactInfo.location || 
          updates.contactInfo.phone.length < 5 || updates.contactInfo.location.trim().length === 0) {
        return throwError(() => new Error('Invalid contact information format'));
      }
    }

    // Validate department length
    if (updates.department && updates.department.length > 100) {
      return throwError(() => new Error('Department name too long'));
    }

    // If role update is requested, validate it
    if (updates.role) {
      return this.http.get<User>(`${this.apiUrl}/${userId}`).pipe(
        map(currentUser => {
          // Only allow downgrade to VIEWER, no upgrades allowed
          if (updates.role === UserRole.ADMIN || 
              (updates.role === UserRole.CREATOR && currentUser.role === UserRole.VIEWER)) {
            throw new Error('Role change not allowed');
          }
          return updates;
        }),
        mergeMap(validatedUpdates => 
          this.http.patch<User>(`${this.apiUrl}/${userId}`, validatedUpdates)
        ),
        catchError(error => {
          if (error.message && !error.message.includes('Http failure response')) {
            return throwError(() => error);
          }
          if (error instanceof HttpErrorResponse && error.status === 409) {
            return throwError(() => new Error('Profile was updated by another user'));
          }
          return throwError(() => new Error('Failed to update profile'));
        })
      );
    }

    // If no role update, proceed with normal update
    return this.http.patch<User>(`${this.apiUrl}/${userId}`, updates).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 409) {
          return throwError(() => new Error('Profile was updated by another user'));
        }
        return throwError(() => new Error('Failed to update profile'));
      })
    );
  }

  deactivateAccount(userId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${userId}/handle-shared-docs`, {}).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status > 0) {
          switch (error.status) {
            case 400:
              return throwError(() => new Error('Account already deactivated'));
            case 409:
              return throwError(() => new Error('Account has pending operations'));
            default:
              return throwError(() => error);
          }
        }
        return throwError(() => new Error('Failed to deactivate account'));
      })
    );
  }

  deleteAccount(userId: string): Observable<void> {
    return this.http.get<any>(`${this.apiUrl}/${userId}/deletion-impact`).pipe(
      map(impact => {
        if (impact.blockers && impact.blockers.length > 0) {
          if (impact.blockers.includes('Active sessions')) {
            throw new Error('Cannot delete account with active sessions');
          } else {
            throw new Error('Cannot delete account due to dependencies');
          }
        }
        return impact;
      }),
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status > 0) {
          return throwError(() => error);
        }
        if (error.message) {
          return throwError(() => error);
        }
        return throwError(() => new Error('Failed to check deletion impact'));
      })
    );
  }

  handleDocumentsDuringDeletion(userId: string): Observable<DocumentTransferResponse> {
    return this.http.post<DocumentTransferResponse>(`${this.apiUrl}/${userId}/handle-documents`, { action: 'archive' }).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status > 0) {
          switch (error.status) {
            case 403:
              return throwError(() => new Error('Insufficient permissions for document transfer'));
            case 413:
              return throwError(() => new Error('Storage quota exceeded'));
            default:
              return throwError(() => new Error('Failed to transfer user documents'));
          }
        }
        return throwError(() => new Error('Failed to transfer user documents'));
      })
    );
  }

  checkAccessStatus(userId: string): Observable<UserStatus> {
    return this.http.get<User>(`${this.apiUrl}/${userId}`).pipe(
      map(user => user.status),
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status > 0) {
          switch (error.status) {
            case 503:
              return throwError(() => new Error('Service temporarily unavailable'));
            case 429:
              return throwError(() => new Error('Too many requests'));
            case 404:
              return throwError(() => new Error('User not found'));
            default:
              return throwError(() => new Error('User not found'));
          }
        }
        return throwError(() => new Error('Failed to check access status'));
      })
    );
  }

  filterAuditLogs(criteria: AuditCriteria): Observable<AuditLog[]> {
    // Validate date range
    if (criteria.dateRange) {
      const now = new Date();
      if (criteria.dateRange.end < criteria.dateRange.start) {
        return throwError(() => new Error('Invalid date range'));
      }
      if (criteria.dateRange.end > now) {
        return throwError(() => new Error('Future dates not allowed'));
      }
    }

    // Validate activity types
    if (criteria.activityTypes && criteria.activityTypes.length > 0) {
      const invalidTypes = criteria.activityTypes.filter(type => !VALID_ACTIVITY_TYPES.includes(type));
      if (invalidTypes.length > 0) {
        return throwError(() => new Error('Invalid activity types specified'));
      }
    }

    return this.http.get<AuditLog[]>(`${this.apiUrl}/audit-logs`, {
      params: {
        userId: criteria.userId,
        ...(criteria.dateRange && {
          startDate: criteria.dateRange.start.toISOString(),
          endDate: criteria.dateRange.end.toISOString()
        }),
        ...(criteria.activityTypes && {
          activityType: criteria.activityTypes
        })
      }
    }).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status > 0) {
          switch (error.status) {
            case 413:
              return throwError(() => new Error('Date range too large'));
            default:
              return throwError(() => error);
          }
        }
        return throwError(() => new Error('Failed to filter audit logs'));
      })
    );
  }

  protected checkDuplicateEmail(email: string): Observable<boolean> {
    return this.http.get<User[]>(`${this.apiUrl}`, { params: { email } }).pipe(
      map(users => {
        if (users.length > 0) {
          const existingUser = users[0];
          if (existingUser.status === UserStatus.SUSPENDED) {
            throw new Error('Account is suspended. Please contact support.');
          }
          return true;
        }
        return false;
      }),
      catchError(error => {
        if (error.message === 'Account is suspended. Please contact support.') {
          return throwError(() => error);
        }
        if (error instanceof HttpErrorResponse && error.status !== 0) {
          return throwError(() => error);
        }
        return throwError(() => new Error('Failed to check email'));
      })
    );
  }
} 