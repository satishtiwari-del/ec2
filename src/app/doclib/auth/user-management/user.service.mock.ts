import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { User, UserRole, UserStatus, UserRegistration } from './user.service';

export interface UserCredentials {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class MockUserService {
  private readonly STORAGE_KEY = 'mock_users';
  private readonly USER_CREDENTIALS_KEY = 'user_credentials';

  private users: User[] = [];
  // Known seeded mock emails to purge from older localStorage
  private readonly SEEDED_EMAILS: readonly string[] = [
    'admin@optimastride.com',
    'john.doe@optimastride.com',
    'jane.smith@optimastride.com',
    'bob.wilson@optimastride.com',
    'alice.johnson@optimastride.com'
  ];

  
  registerUser(registration: UserRegistration & { password: string }): Observable<User> {
    if (this.users.some(u => u.email === registration.email)) {
      return throwError(() => new Error('Email already exists'));
    }

    const { password, ...userData } = registration;
    const newUser: User = {
      id: crypto.randomUUID ? crypto.randomUUID() : `user${Date.now()}`,
      ...userData,
      status: UserStatus.ACTIVE
    };

    this.users.push(newUser);
    this.userCredentials[registration.email] = password;
    
    // Save to localStorage
    this.saveUsers();
    this.saveCredentials();
    
    return of(newUser);
  }

  updateUserProfile(userId: string, updates: Partial<User>): Observable<User> {
    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return throwError(() => new Error('User not found'));
    }

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates
    };

    // Persist changes to localStorage so other components/tabs see updates
    this.saveUsers();

    return of(this.users[userIndex]);
  }

  deactivateAccount(userId: string): Observable<void> {
    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return throwError(() => new Error('User not found'));
    }

    this.users[userIndex].status = UserStatus.DEACTIVATED;
    // Persist to localStorage
    this.saveUsers();
    return of(void 0);
  }

  deleteAccount(userId: string): Observable<void> {
    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return throwError(() => new Error('User not found'));
    }

    this.users.splice(userIndex, 1);
    // Persist to localStorage
    this.saveUsers();
    return of(void 0);
  }

  checkAccessStatus(userId: string): Observable<UserStatus> {
    const user = this.users.find(u => u.id === userId);
    if (!user) {
      return throwError(() => new Error('User not found'));
    }

    return of(user.status);
  }

  private userCredentials: { [email: string]: string } = {
    'admin@optimastride.com': 'Admin@123'
  };

  constructor() {
    // Load saved users from localStorage
    const savedUsers = localStorage.getItem(this.STORAGE_KEY);
    if (savedUsers) {
      try {
        const parsed: User[] = JSON.parse(savedUsers) || [];
        // Purge any previously seeded mock users (including admin) from the user list
        const cleaned = parsed.filter(u => !this.SEEDED_EMAILS.includes(u.email));
        this.users = cleaned;
        if (cleaned.length !== parsed.length) {
          this.saveUsers();
        }
      } catch {
        this.users = [];
        this.saveUsers();
      }
    } else {
      // Start with an empty list; don't seed mock defaults into localStorage
      this.users = [];
      this.saveUsers();
    }

    // Load saved credentials from localStorage
    const savedCredentials = localStorage.getItem(this.USER_CREDENTIALS_KEY);
    if (savedCredentials) {
      try {
        const parsed = JSON.parse(savedCredentials) || {};
        this.userCredentials = parsed;
      } catch {
        this.saveCredentials();
      }
    } else {
      // Save initial credentials to localStorage
      this.saveCredentials();
    }
  }

  getUsers(): Observable<User[]> {
    // Always read latest from localStorage to ensure re-render reflects persisted data
    const savedUsers = localStorage.getItem(this.STORAGE_KEY);
    if (savedUsers) {
      try {
        this.users = JSON.parse(savedUsers);
      } catch {
        // keep current in-memory users on parse error
      }
    }
    // Return a new array instance to trigger change detection
    return of([...this.users]);
  }

  validateCredentials(email: string, password: string): boolean {
    // Reload latest credentials from localStorage to avoid stale in-memory state
    const savedCredentials = localStorage.getItem(this.USER_CREDENTIALS_KEY);
    if (savedCredentials) {
      try {
        this.userCredentials = JSON.parse(savedCredentials);
      } catch {
        // ignore parse error; use existing in-memory map
      }
    }
    const normalizedEmail = (email || '').trim().toLowerCase();
    // Try exact match and case-insensitive match
    return (
      this.userCredentials[email] === password ||
      this.userCredentials[normalizedEmail] === password
    );
  }

  updateUserCredentials(email: string, newPassword: string): Observable<void> {
    if (!this.userCredentials[email]) {
      return throwError(() => new Error('User not found'));
    }

    this.userCredentials[email] = newPassword;
    this.saveCredentials();
    return of(void 0);
  }

  private saveUsers(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.users));
  }

  private saveCredentials(): void {
    localStorage.setItem(this.USER_CREDENTIALS_KEY, JSON.stringify(this.userCredentials));
  }
} 