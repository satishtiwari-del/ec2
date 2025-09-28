import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { UserRole, UserStatus } from '../user-management/user.service';
import { MockUserService } from '../user-management/user.service.mock';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

@Injectable({
  providedIn: 'root',
  deps: [MockUserService]
})
export class AuthService {
  private readonly STORAGE_KEY = 'auth_user';
  private readonly MOCK_ADMIN = {
    id: 'user1',
    email: 'admin@optimastride.com',
    password: 'Admin@123',
    fullName: 'Admin User',
    role: UserRole.ADMIN,
    department: 'IT'
  } as const;

  constructor(private mockUserService: MockUserService) {}

  login(email: string, password: string): Observable<AuthUser> {
    // Try mock admin first
    if (email === this.MOCK_ADMIN.email && password === this.MOCK_ADMIN.password) {
      const user: AuthUser = {
        id: this.MOCK_ADMIN.id,
        email: this.MOCK_ADMIN.email,
        fullName: this.MOCK_ADMIN.fullName,
        role: this.MOCK_ADMIN.role
      };
      return of(user).pipe(
        tap(user => this.setAuthUser(user))
      );
    }

    // Try other users from mock service
    if (this.mockUserService.validateCredentials(email, password)) {
      return this.mockUserService.getUsers().pipe(
        map(users => {
          const user = users.find(u => u.email === email);
          if (!user) {
            throw new Error('User not found');
          }
          if (user.status !== UserStatus.ACTIVE) {
            throw new Error('Account is not active');
          }
          const authUser: AuthUser = {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role
          };
          this.setAuthUser(authUser);
          return authUser;
        })
      );
    }

    return throwError(() => new Error('Invalid credentials'));
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getAuthUser();
  }

  getAuthUser(): AuthUser | null {
    const userStr = localStorage.getItem(this.STORAGE_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  hasRole(role: UserRole): boolean {
    const user = this.getAuthUser();
    return user?.role === role;
  }

  private setAuthUser(user: AuthUser): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }
}