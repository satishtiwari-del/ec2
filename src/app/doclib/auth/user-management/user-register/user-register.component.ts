import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserRole, UserRegistration } from '../user.service';
import { MockUserService } from '../user.service.mock';
import { Router, ActivatedRoute } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Component({
  selector: 'app-user-register',
  templateUrl: './user-register.component.html',
  styleUrls: ['./user-register.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ]
})
export class UserRegisterComponent implements OnInit {
  registrationForm!: FormGroup;
  roles = Object.values(UserRole);
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private userService: MockUserService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.initForm();
  }

  private initForm() {
    this.registrationForm = this.fb.group({
      email: ['', [
        Validators.required, 
        Validators.email,
        Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      ]],
      fullName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100)
      ]],
      role: ['', Validators.required],
      department: [''],
      password: ['', [
        Validators.required,
        Validators.minLength(6)
      ]],
      confirmPassword: ['', [
        Validators.required
      ]],
      contactInfo: this.fb.group({
        phone: ['', [
          Validators.minLength(5),
          Validators.pattern(/^[0-9+\-() ]+$/)
        ]],
        location: ['', Validators.minLength(1)]
      })
    });
  }

  onSubmit() {
    if (this.registrationForm.valid && !this.isSubmitting) {
      const password = this.registrationForm.get('password')?.value;
      const confirmPassword = this.registrationForm.get('confirmPassword')?.value;
      if (password !== confirmPassword) {
        this.snackBar.open('Passwords do not match', 'Close', { duration: 3000 });
        return;
      }
      this.isSubmitting = true;

      const registration: UserRegistration = {
        email: this.registrationForm.get('email')?.value,
        fullName: this.registrationForm.get('fullName')?.value,
        role: this.registrationForm.get('role')?.value,
        department: this.registrationForm.get('department')?.value || undefined,
        contactInfo: this.getContactInfo()
      };

      const payload = { ...registration, password } as any;

      this.userService.registerUser(payload).pipe(
        catchError(error => {
          this.handleError(error);
          return throwError(() => error);
        })
      ).subscribe({
        next: () => {
          this.handleSuccess();
          // Navigate back to list so the table reloads with the new user
          this.router.navigate(['../list'], { relativeTo: this.route });
        },
        error: () => {
          this.isSubmitting = false;
        }
      });
    } else {
      this.markFormTouched();
    }
  }

  private getContactInfo() {
    const contactInfo = this.registrationForm.get('contactInfo')?.value;
    if (contactInfo.phone || contactInfo.location) {
      return contactInfo;
    }
    return undefined;
  }

  private handleSuccess() {
    this.snackBar.open('User registered successfully', 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
    this.registrationForm.reset();
    this.isSubmitting = false;
  }

  private handleError(error: any) {
    let message = 'Registration failed';
    if (error.message) {
      message = error.message;
    }
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  private markFormTouched() {
    Object.keys(this.registrationForm.controls).forEach(key => {
      const control = this.registrationForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.registrationForm.get(controlName);
    if (!control) return '';

    if (control.hasError('required')) {
      return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} is required`;
    }
    if (controlName === 'confirmPassword') {
      const pwd = this.registrationForm.get('password')?.value;
      const cpwd = control.value;
      if (pwd && cpwd && pwd !== cpwd) {
        return 'Passwords do not match';
      }
    }
    if (control.hasError('email')) {
      return 'Invalid email format';
    }
    if (control.hasError('pattern')) {
      if (controlName === 'email') {
        return 'Invalid email format';
      }
      if (controlName === 'phone') {
        return 'Invalid phone number format';
      }
    }
    if (control.hasError('minlength')) {
      return `Minimum length is ${control.errors?.['minlength'].requiredLength} characters`;
    }
    if (control.hasError('maxlength')) {
      return `Maximum length is ${control.errors?.['maxlength'].requiredLength} characters`;
    }
    return '';
  }
}