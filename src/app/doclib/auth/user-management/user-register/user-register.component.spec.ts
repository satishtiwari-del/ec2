import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserRegisterComponent } from './user-register.component';
import { UserService, UserRole } from '../user.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { of, throwError } from 'rxjs';

describe('UserRegisterComponent', () => {
  let component: UserRegisterComponent;
  let fixture: ComponentFixture<UserRegisterComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj('UserService', ['registerUser']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      declarations: [ UserRegisterComponent ],
      imports: [
        ReactiveFormsModule,
        BrowserAnimationsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatProgressSpinnerModule
      ],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.registrationForm.get('email')?.value).toBe('');
    expect(component.registrationForm.get('fullName')?.value).toBe('');
    expect(component.registrationForm.get('role')?.value).toBe('');
    expect(component.registrationForm.get('department')?.value).toBe('');
    expect(component.registrationForm.get('contactInfo.phone')?.value).toBe('');
    expect(component.registrationForm.get('contactInfo.location')?.value).toBe('');
  });

  it('should validate required fields', () => {
    const form = component.registrationForm;
    expect(form.valid).toBeFalsy();

    form.controls['email'].setValue('test@example.com');
    form.controls['fullName'].setValue('Test User');
    form.controls['role'].setValue(UserRole.VIEWER);

    expect(form.valid).toBeTruthy();
  });

  it('should validate email format', () => {
    const emailControl = component.registrationForm.controls['email'];
    
    emailControl.setValue('invalid-email');
    expect(emailControl.valid).toBeFalsy();
    expect(emailControl.errors?.['email']).toBeTruthy();

    emailControl.setValue('test@example.com');
    expect(emailControl.valid).toBeTruthy();
  });

  it('should validate phone number format', () => {
    const phoneControl = component.registrationForm.get('contactInfo.phone');
    
    phoneControl?.setValue('123');
    expect(phoneControl?.valid).toBeFalsy();
    expect(phoneControl?.errors?.['minlength']).toBeTruthy();

    phoneControl?.setValue('123456');
    expect(phoneControl?.valid).toBeTruthy();
  });

  it('should handle successful registration', fakeAsync(() => {
    const mockUser = {
      email: 'test@example.com',
      fullName: 'Test User',
      role: UserRole.VIEWER
    };

    userService.registerUser.and.returnValue(of(mockUser));

    component.registrationForm.patchValue({
      email: mockUser.email,
      fullName: mockUser.fullName,
      role: mockUser.role
    });

    component.onSubmit();
    tick();

    expect(userService.registerUser).toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith(
      'User registered successfully',
      'Close',
      jasmine.any(Object)
    );
    expect(component.registrationForm.pristine).toBeTrue();
  }));

  it('should handle registration error', fakeAsync(() => {
    const errorMessage = 'Registration failed';
    userService.registerUser.and.returnValue(throwError(() => new Error(errorMessage)));

    component.registrationForm.patchValue({
      email: 'test@example.com',
      fullName: 'Test User',
      role: UserRole.VIEWER
    });

    component.onSubmit();
    tick();

    expect(snackBar.open).toHaveBeenCalledWith(
      errorMessage,
      'Close',
      jasmine.any(Object)
    );
    expect(component.isSubmitting).toBeFalse();
  }));

  it('should not submit if form is invalid', () => {
    component.onSubmit();
    expect(userService.registerUser).not.toHaveBeenCalled();
  });

  it('should mark all fields as touched on invalid submit', () => {
    component.onSubmit();
    
    Object.keys(component.registrationForm.controls).forEach(key => {
      expect(component.registrationForm.get(key)?.touched).toBeTrue();
    });
  });
});