import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MockUserService } from '../user-management/user.service.mock';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDividerModule
  ],
  template: `
    <div class="settings-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>User Settings</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <!-- User Info Section -->
          <section class="info-section">
            <h2>User Information</h2>
            <div class="info-grid">
              <div class="info-item">
                <label>Full Name:</label>
                <span>{{ currentUser?.fullName }}</span>
              </div>
              <div class="info-item">
                <label>Email:</label>
                <span>{{ currentUser?.email }}</span>
              </div>
              <div class="info-item">
                <label>Role:</label>
                <span>{{ currentUser?.role }}</span>
              </div>
            </div>
          </section>

          <mat-divider></mat-divider>

          <!-- Change Password Section -->
          <section>
            <h2>Change Password</h2>
            <form [formGroup]="passwordForm" (ngSubmit)="onChangePassword()">
              <mat-form-field appearance="outline">
                <mat-label>Current Password</mat-label>
                <input matInput type="password" formControlName="currentPassword">
                <mat-error *ngIf="passwordForm.get('currentPassword')?.hasError('required')">
                  Current password is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>New Password</mat-label>
                <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="newPassword">
                <button mat-icon-button matSuffix type="button" (click)="hidePassword = !hidePassword">
                  <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                </button>
                <mat-error *ngIf="passwordForm.get('newPassword')?.hasError('required')">
                  New password is required
                </mat-error>
                <mat-error *ngIf="passwordForm.get('newPassword')?.hasError('minlength')">
                  Password must be at least 8 characters long
                </mat-error>
                <mat-error *ngIf="passwordForm.get('newPassword')?.hasError('pattern')">
                  Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Confirm New Password</mat-label>
                <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="confirmPassword">
                <mat-error *ngIf="passwordForm.get('confirmPassword')?.hasError('required')">
                  Password confirmation is required
                </mat-error>
                <mat-error *ngIf="passwordForm.get('confirmPassword')?.hasError('passwordMismatch')">
                  Passwords do not match
                </mat-error>
              </mat-form-field>

              <button mat-raised-button color="primary" type="submit" [disabled]="passwordForm.invalid">
                Change Password
              </button>
            </form>
          </section>

          <mat-divider></mat-divider>

          <!-- Account Actions Section -->
          <section class="account-actions">
            <h2>Account Actions</h2>
            <div class="action-buttons">
              <button mat-raised-button color="warn" (click)="onRecoverPassword()">
                <mat-icon>lock_reset</mat-icon>
                Recover Password
              </button>
              <button mat-raised-button color="warn" (click)="onLogout()">
                <mat-icon>logout</mat-icon>
                Logout
              </button>
            </div>
          </section>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .settings-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    section {
      margin: 24px 0;
    }

    h2 {
      color: #333;
      margin-bottom: 16px;
    }

    .info-section {
      margin-bottom: 24px;
    }

    .info-grid {
      display: grid;
      gap: 16px;
    }

    .info-item {
      display: grid;
      grid-template-columns: 120px 1fr;
      align-items: center;
    }

    .info-item label {
      font-weight: 500;
      color: #666;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-width: 400px;
    }

    .account-actions {
      margin-top: 24px;
    }

    .action-buttons {
      display: flex;
      gap: 16px;
    }

    mat-divider {
      margin: 32px 0;
    }

    button[type="submit"] {
      align-self: flex-start;
    }
  `]
})
export class SettingsComponent implements OnInit {
  currentUser: any;
  passwordForm: FormGroup;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: MockUserService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
      ]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.currentUser = this.authService.getAuthUser();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
    }
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (newPassword !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
    } else {
      form.get('confirmPassword')?.setErrors(null);
    }
  }

  onChangePassword() {
    if (this.passwordForm.valid && this.currentUser) {
      const { currentPassword, newPassword } = this.passwordForm.value;

      // Verify current password
      if (!this.userService.validateCredentials(this.currentUser.email, currentPassword)) {
        this.snackBar.open('Current password is incorrect', 'Close', {
          duration: 3000
        });
        return;
      }

      // Update password in mock service
      this.userService.updateUserCredentials(this.currentUser.email, newPassword).subscribe({
        next: () => {
          this.snackBar.open('Password changed successfully', 'Close', {
            duration: 3000
          });
          this.passwordForm.reset();
        },
        error: (error) => {
          this.snackBar.open(error.message || 'Failed to change password', 'Close', {
            duration: 3000
          });
        }
      });
    }
  }

  onRecoverPassword() {
    this.snackBar.open('Password recovery functionality coming soon', 'Close', {
      duration: 3000
    });
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}