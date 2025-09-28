# Folder Permissions - Technical Use Cases

## Technical Overview
This document outlines the technical implementation details for the Folder Permissions feature in the DocLib application. The implementation follows Angular best practices and uses Angular Material for UI components.

## Component Architecture

### Module Structure
```typescript
@NgModule({
  declarations: [
    FolderPermissionsComponent,
    PermissionViewComponent,
    PermissionEditComponent,
    InheritanceManagerComponent,
    BulkPermissionComponent,
    AuditLogComponent,
    PermissionDialogComponent,
    UserGroupSelectorComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatTableModule,
    MatTreeModule,
    MatCheckboxModule,
    MatRadioModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatDatepickerModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatExpansionModule,
    MatBadgeModule
  ],
  providers: [
    FolderPermissionService,
    PermissionValidationService,
    InheritanceService,
    AuditService,
    PermissionGuard
  ]
})
export class FolderPermissionsModule { }
```

### Service Layer

#### IFolderPermissionService Interface
```typescript
interface IFolderPermissionService {
  getPermissions(folderId: string): Observable<FolderPermissions>;
  updatePermissions(folderId: string, permissions: PermissionUpdate): Observable<FolderPermissions>;
  getInheritance(folderId: string): Observable<InheritanceInfo>;
  updateInheritance(folderId: string, options: InheritanceOptions): Observable<InheritanceResult>;
  bulkUpdate(options: BulkPermissionOptions): Observable<BulkUpdateResult>;
  getAuditLog(filters: AuditFilter): Observable<AuditLogEntry[]>;
  validatePermissions(permissions: PermissionUpdate): Observable<ValidationResult>;
}

interface FolderPermissions {
  folderId: string;
  direct: Permission[];
  inherited: Permission[];
  effectivePermissions: EffectivePermission[];
  inheritanceEnabled: boolean;
}

interface Permission {
  id: string;
  type: 'USER' | 'GROUP';
  targetId: string;
  level: PermissionLevel;
  grantedBy: string;
  grantedAt: Date;
}

interface PermissionLevel {
  read: boolean;
  write: boolean;
  delete: boolean;
  share: boolean;
  managePermissions: boolean;
}

interface InheritanceOptions {
  action: 'BREAK' | 'RESTORE' | 'COPY';
  copyTarget?: string;
  applyToChildren: boolean;
}

interface BulkPermissionOptions {
  folderIds: string[];
  permissions: PermissionUpdate;
  inheritance?: InheritanceOptions;
}

interface AuditFilter {
  startDate?: Date;
  endDate?: Date;
  users?: string[];
  groups?: string[];
  permissionTypes?: string[];
  folderIds?: string[];
}
```

#### FolderPermissionService Implementation
```typescript
@Injectable({
  providedIn: 'root'
})
export class FolderPermissionService implements IFolderPermissionService {
  constructor(
    private http: HttpClient,
    private validationService: PermissionValidationService,
    private auditService: AuditService,
    private errorHandler: GlobalErrorHandler
  ) {}

  getPermissions(folderId: string): Observable<FolderPermissions> {
    return this.http.get<FolderPermissions>(`/api/folders/${folderId}/permissions`).pipe(
      catchError(error => this.errorHandler.handleError(error))
    );
  }

  updatePermissions(folderId: string, permissions: PermissionUpdate): Observable<FolderPermissions> {
    return this.validationService.validatePermissions(permissions).pipe(
      switchMap(() => this.http.put<FolderPermissions>(
        `/api/folders/${folderId}/permissions`,
        permissions
      )),
      tap(() => this.auditService.logPermissionChange(folderId, permissions)),
      catchError(error => this.errorHandler.handleError(error))
    );
  }

  updateInheritance(folderId: string, options: InheritanceOptions): Observable<InheritanceResult> {
    return this.validationService.validateInheritanceChange(folderId, options).pipe(
      switchMap(() => this.http.post<InheritanceResult>(
        `/api/folders/${folderId}/inheritance`,
        options
      )),
      tap(() => this.auditService.logInheritanceChange(folderId, options)),
      catchError(error => this.errorHandler.handleError(error))
    );
  }

  bulkUpdate(options: BulkPermissionOptions): Observable<BulkUpdateResult> {
    return this.validationService.validateBulkUpdate(options).pipe(
      switchMap(() => this.http.post<BulkUpdateResult>('/api/folders/permissions/bulk', options)),
      tap(result => this.auditService.logBulkUpdate(options, result)),
      catchError(error => this.errorHandler.handleError(error))
    );
  }
}
```

### Component Implementation

#### PermissionViewComponent
```typescript
@Component({
  selector: 'app-permission-view',
  template: `
    <mat-expansion-panel>
      <mat-expansion-panel-header>
        <mat-panel-title>Direct Permissions</mat-panel-title>
      </mat-expansion-panel-header>
      
      <mat-table [dataSource]="directPermissions">
        <ng-container matColumnDef="type">
          <mat-header-cell *matHeaderCellDef>Type</mat-header-cell>
          <mat-cell *matCellDef="let permission">
            {{permission.type}}
          </mat-cell>
        </ng-container>
        
        <ng-container matColumnDef="target">
          <mat-header-cell *matHeaderCellDef>User/Group</mat-header-cell>
          <mat-cell *matCellDef="let permission">
            {{permission.targetId}}
          </mat-cell>
        </ng-container>
        
        <ng-container matColumnDef="level">
          <mat-header-cell *matHeaderCellDef>Access Level</mat-header-cell>
          <mat-cell *matCellDef="let permission">
            <mat-chip-list>
              <mat-chip *ngIf="permission.level.read">Read</mat-chip>
              <mat-chip *ngIf="permission.level.write">Write</mat-chip>
              <mat-chip *ngIf="permission.level.delete">Delete</mat-chip>
              <mat-chip *ngIf="permission.level.share">Share</mat-chip>
              <mat-chip *ngIf="permission.level.managePermissions">Manage</mat-chip>
            </mat-chip-list>
          </mat-cell>
        </ng-container>

        <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
        <mat-row *matRowDef="let row; columns: displayedColumns;"></mat-row>
      </mat-table>
    </mat-expansion-panel>

    <mat-expansion-panel>
      <mat-expansion-panel-header>
        <mat-panel-title>Inherited Permissions</mat-panel-title>
      </mat-expansion-panel-header>
      
      <mat-table [dataSource]="inheritedPermissions">
        <!-- Similar structure to direct permissions table -->
      </mat-table>
    </mat-expansion-panel>
  `
})
export class PermissionViewComponent implements OnInit {
  @Input() folderId!: string;
  
  displayedColumns = ['type', 'target', 'level'];
  directPermissions = new MatTableDataSource<Permission>();
  inheritedPermissions = new MatTableDataSource<Permission>();

  constructor(
    private permissionService: FolderPermissionService,
    private errorHandler: GlobalErrorHandler
  ) {}

  ngOnInit(): void {
    this.loadPermissions();
  }

  private loadPermissions(): void {
    this.permissionService.getPermissions(this.folderId).pipe(
      catchError(error => this.errorHandler.handleError(error))
    ).subscribe(permissions => {
      this.directPermissions.data = permissions.direct;
      this.inheritedPermissions.data = permissions.inherited;
    });
  }
}
```

#### PermissionEditComponent
```typescript
@Component({
  selector: 'app-permission-edit',
  template: `
    <form [formGroup]="permissionForm" (ngSubmit)="onSubmit()">
      <app-user-group-selector
        formControlName="target"
        [type]="permissionForm.get('type').value">
      </app-user-group-selector>

      <mat-radio-group formControlName="type">
        <mat-radio-button value="USER">User</mat-radio-button>
        <mat-radio-button value="GROUP">Group</mat-radio-button>
      </mat-radio-group>

      <div formGroupName="level">
        <mat-checkbox formControlName="read">Read</mat-checkbox>
        <mat-checkbox formControlName="write">Write</mat-checkbox>
        <mat-checkbox formControlName="delete">Delete</mat-checkbox>
        <mat-checkbox formControlName="share">Share</mat-checkbox>
        <mat-checkbox formControlName="managePermissions">Manage Permissions</mat-checkbox>
      </div>

      <div class="inheritance-options" *ngIf="showInheritanceOptions">
        <mat-checkbox formControlName="applyToChildren">
          Apply to subfolders
        </mat-checkbox>
      </div>

      <div class="actions">
        <button mat-button type="button" (click)="onCancel()">Cancel</button>
        <button mat-raised-button color="primary" type="submit"
                [disabled]="!permissionForm.valid || isSubmitting">
          Save Changes
        </button>
      </div>
    </form>
  `
})
export class PermissionEditComponent {
  @Input() folderId!: string;
  @Output() completed = new EventEmitter<void>();

  permissionForm = this.fb.group({
    type: ['USER', Validators.required],
    target: ['', Validators.required],
    level: this.fb.group({
      read: [false],
      write: [false],
      delete: [false],
      share: [false],
      managePermissions: [false]
    }),
    applyToChildren: [false]
  });

  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private permissionService: FolderPermissionService,
    private snackBar: MatSnackBar
  ) {}

  onSubmit(): void {
    if (this.permissionForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    const update: PermissionUpdate = this.permissionForm.value;

    this.permissionService.updatePermissions(this.folderId, update).subscribe({
      next: () => {
        this.snackBar.open('Permissions updated successfully', 'Close', { duration: 3000 });
        this.completed.emit();
      },
      error: (error) => {
        this.snackBar.open('Failed to update permissions', 'Close', { duration: 3000 });
        this.isSubmitting = false;
      }
    });
  }
}
```

## Security Implementation

### Permission Guard
```typescript
@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {
  constructor(private permissionService: FolderPermissionService) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const folderId = route.params['id'];
    return this.permissionService.getPermissions(folderId).pipe(
      map(permissions => {
        const effectivePermissions = permissions.effectivePermissions;
        return effectivePermissions.some(p => p.level.managePermissions);
      }),
      catchError(() => of(false))
    );
  }
}
```

### Validation Service
```typescript
@Injectable({
  providedIn: 'root'
})
export class PermissionValidationService {
  validatePermissions(permissions: PermissionUpdate): Observable<ValidationResult> {
    // Ensure admin access is preserved
    if (this.wouldRemoveAdminAccess(permissions)) {
      return throwError(() => new Error('Cannot remove administrator access'));
    }

    // Validate permission combinations
    if (this.hasInvalidCombination(permissions.level)) {
      return throwError(() => new Error('Invalid permission combination'));
    }

    return of({ valid: true });
  }

  validateInheritanceChange(folderId: string, options: InheritanceOptions): Observable<ValidationResult> {
    return this.checkCriticalFolders(folderId).pipe(
      map(isCritical => {
        if (isCritical && options.action === 'BREAK') {
          throw new Error('Cannot break inheritance on critical folders');
        }
        return { valid: true };
      })
    );
  }

  private wouldRemoveAdminAccess(permissions: PermissionUpdate): boolean {
    // Implementation
    return false;
  }

  private hasInvalidCombination(level: PermissionLevel): boolean {
    // Implementation
    return false;
  }
}
```

## Error Handling

### PermissionErrorHandler
```typescript
@Injectable()
export class PermissionErrorHandler extends GlobalErrorHandler {
  handlePermissionError(error: any): Observable<never> {
    if (error.code === 'ADMIN_ACCESS_REQUIRED') {
      return throwError(() => new Error('Administrator access must be preserved'));
    }
    if (error.code === 'INHERITANCE_CONFLICT') {
      return throwError(() => new Error('Inheritance conflict detected'));
    }
    if (error.code === 'CRITICAL_FOLDER') {
      return throwError(() => new Error('Operation not allowed on critical folders'));
    }
    return super.handleError(error);
  }
}
```

## Performance Considerations

### Caching Strategy
```typescript
@Injectable({
  providedIn: 'root'
})
export class PermissionCacheService {
  private cache = new Map<string, CachedPermissions>();
  private cacheTimeout = 30 * 1000; // 30 seconds

  cachePermissions(folderId: string, permissions: FolderPermissions): void {
    this.cache.set(folderId, {
      permissions,
      timestamp: Date.now()
    });
    setTimeout(() => this.cache.delete(folderId), this.cacheTimeout);
  }

  getCachedPermissions(folderId: string): FolderPermissions | undefined {
    const cached = this.cache.get(folderId);
    if (cached && Date.now() - cached.timestamp <= this.cacheTimeout) {
      return cached.permissions;
    }
    return undefined;
  }

  invalidateCache(folderId?: string): void {
    if (folderId) {
      this.cache.delete(folderId);
    } else {
      this.cache.clear();
    }
  }
}
```

### Batch Processing
- Bulk permission updates processed in chunks
- Asynchronous inheritance updates
- Cached permission checks

## Testing Strategy

### Unit Tests
```typescript
describe('FolderPermissionService', () => {
  let service: FolderPermissionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FolderPermissionService]
    });
    
    service = TestBed.inject(FolderPermissionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should get folder permissions', (done) => {
    const mockPermissions: FolderPermissions = {
      folderId: '123',
      direct: [],
      inherited: [],
      effectivePermissions: [],
      inheritanceEnabled: true
    };

    service.getPermissions('123').subscribe(result => {
      expect(result).toEqual(mockPermissions);
      done();
    });

    const req = httpMock.expectOne('/api/folders/123/permissions');
    expect(req.request.method).toBe('GET');
    req.flush(mockPermissions);
  });

  it('should validate before updating permissions', (done) => {
    const update: PermissionUpdate = {
      type: 'USER',
      targetId: 'user1',
      level: {
        read: true,
        write: false,
        delete: false,
        share: false,
        managePermissions: false
      }
    };

    service.updatePermissions('123', update).subscribe(() => {
      done();
    });

    const req = httpMock.expectOne('/api/folders/123/permissions');
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });
});
```

### Integration Tests
```typescript
describe('PermissionEditComponent', () => {
  let component: PermissionEditComponent;
  let fixture: ComponentFixture<PermissionEditComponent>;
  let permissionService: jasmine.SpyObj<FolderPermissionService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('FolderPermissionService', ['updatePermissions']);
    
    await TestBed.configureTestingModule({
      declarations: [PermissionEditComponent],
      providers: [
        { provide: FolderPermissionService, useValue: spy }
      ]
    }).compileComponents();

    permissionService = TestBed.inject(FolderPermissionService) as jasmine.SpyObj<FolderPermissionService>;
  });

  it('should validate form before submission', () => {
    const invalidForm = {
      type: 'USER',
      target: '',
      level: {
        read: false,
        write: false,
        delete: false,
        share: false,
        managePermissions: false
      }
    };

    component.permissionForm.patchValue(invalidForm);
    component.onSubmit();
    
    expect(permissionService.updatePermissions).not.toHaveBeenCalled();
  });
});
```

## Technical Constraints
1. Maximum direct permissions per folder: 100
2. Permission cache timeout: 30 seconds
3. Bulk update limit: 50 folders per request
4. Audit log retention: 90 days
5. Critical folder designation immutable

## Dependencies
1. @angular/core: ^20.0.0
2. @angular/material: ^20.0.0
3. @angular/cdk: ^20.0.0
4. rxjs: ^7.8.0

## Deployment Requirements
1. Node.js >= 18.x
2. Angular CLI >= 20.0.0
3. Memory: 512MB minimum
4. Storage: Based on audit log size
5. Network: Low latency for permission checks

## Success Metrics
1. Permission check response time < 100ms
2. Bulk update throughput > 20 folders/second
3. Cache hit ratio > 70%
4. Audit log query time < 500ms
5. UI interaction response time < 150ms 