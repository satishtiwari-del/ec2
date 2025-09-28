# Document Sharing - Technical Use Cases

## Technical Overview
This document outlines the technical implementation details for the Document Sharing feature in the DocLib application. The implementation follows Angular best practices and uses Angular Material for UI components.

## Component Architecture

### Module Structure
```typescript
@NgModule({
  declarations: [
    DocumentSharingComponent,
    ShareDialogComponent,
    BulkShareDialogComponent,
    ShareLinkComponent,
    ShareManagementComponent,
    ActivityMonitorComponent,
    RecipientSelectorComponent,
    ShareSettingsComponent,
    ShareLinkGeneratorComponent,
    ShareActivityChartComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatTableModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatDatepickerModule,
    MatSlideToggleModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatTabsModule,
    NgxChartsModule
  ],
  providers: [
    DocumentSharingService,
    ShareValidationService,
    ShareLinkService,
    ShareActivityService,
    NotificationService,
    ShareGuard
  ]
})
export class DocumentSharingModule { }
```

### Service Layer

#### IDocumentSharingService Interface
```typescript
interface IDocumentSharingService {
  shareDocument(documentId: string, options: ShareOptions): Observable<ShareResult>;
  shareBulk(options: BulkShareOptions): Observable<BulkShareResult>;
  generateShareLink(documentId: string, options: LinkOptions): Observable<ShareLink>;
  getSharedAccess(documentId: string): Observable<SharedAccess>;
  updateSharing(documentId: string, updates: ShareUpdate): Observable<ShareResult>;
  revokeAccess(documentId: string, targetIds: string[]): Observable<void>;
  getActivity(filters: ActivityFilter): Observable<ShareActivity[]>;
}

interface ShareOptions {
  documentId: string;
  recipients: Recipient[];
  permissionLevel: 'VIEW' | 'EDIT';
  expiration?: Date;
  message?: string;
  notifyRecipients: boolean;
}

interface BulkShareOptions {
  documentIds: string[];
  recipients: Recipient[];
  permissionLevel: 'VIEW' | 'EDIT';
  expiration?: Date;
  message?: string;
  notifyRecipients: boolean;
}

interface LinkOptions {
  accessLevel: 'VIEW' | 'EDIT';
  expiration?: Date;
  password?: string;
  usageLimit?: number;
  allowEmbed: boolean;
}

interface ShareLink {
  id: string;
  url: string;
  embedCode?: string;
  accessLevel: 'VIEW' | 'EDIT';
  expiration?: Date;
  usageCount: number;
  usageLimit?: number;
  isPasswordProtected: boolean;
}

interface SharedAccess {
  documentId: string;
  directShares: Share[];
  linkShares: ShareLink[];
  totalAccesses: number;
  lastAccessed?: Date;
}

interface ShareActivity {
  id: string;
  documentId: string;
  type: 'ACCESS' | 'SHARE' | 'REVOKE';
  userId: string;
  timestamp: Date;
  details: any;
}
```

#### DocumentSharingService Implementation
```typescript
@Injectable({
  providedIn: 'root'
})
export class DocumentSharingService implements IDocumentSharingService {
  constructor(
    private http: HttpClient,
    private validationService: ShareValidationService,
    private rateLimitService: ShareRateLimitService,
    private notificationService: NotificationService,
    private activityService: ShareActivityService,
    private errorHandler: GlobalErrorHandler
  ) {}

  shareDocument(documentId: string, options: ShareOptions): Observable<ShareResult> {
    const userId = 'current_user'; // Replace with actual user ID
    
    return this.rateLimitService.checkRateLimit('singleShare', userId).pipe(
      switchMap(() => this.validationService.validateSharing(documentId, options)),
      switchMap(() => this.http.post<ShareResult>(`/api/documents/${documentId}/share`, options)),
      tap(result => {
        if (options.notifyRecipients) {
          this.notificationService.notifySharing(result);
        }
        this.activityService.logShareActivity(documentId, 'SHARE', result);
      }),
      catchError(error => {
        if (error instanceof ShareRateLimitError) {
          return throwError(() => error);
        }
        return this.errorHandler.handleError(error);
      })
    );
  }

  shareBulk(options: BulkShareOptions): Observable<BulkShareResult> {
    const userId = 'current_user'; // Replace with actual user ID
    
    return this.rateLimitService.checkRateLimit('bulkShare', userId).pipe(
      switchMap(() => this.validationService.validateBulkSharing(options)),
      switchMap(() => this.http.post<BulkShareResult>('/api/documents/share/bulk', options)),
      tap(result => {
        if (options.notifyRecipients) {
          this.notificationService.notifyBulkSharing(result);
        }
        this.activityService.logBulkShareActivity(options.documentIds, result);
      }),
      catchError(error => {
        if (error instanceof ShareRateLimitError) {
          return throwError(() => error);
        }
        return this.errorHandler.handleError(error);
      })
    );
  }

  generateShareLink(documentId: string, options: LinkOptions): Observable<ShareLink> {
    const userId = 'current_user'; // Replace with actual user ID
    
    return this.rateLimitService.checkRateLimit('linkGeneration', userId).pipe(
      switchMap(() => this.validationService.validateLinkOptions(options)),
      switchMap(() => this.http.post<ShareLink>(`/api/documents/${documentId}/link`, options)),
      tap(link => this.activityService.logLinkGeneration(documentId, link)),
      catchError(error => {
        if (error instanceof ShareRateLimitError) {
          return throwError(() => error);
        }
        return this.errorHandler.handleError(error);
      })
    );
  }

  updateSharing(documentId: string, updates: ShareUpdate): Observable<ShareResult> {
    return this.validationService.validateShareUpdate(documentId, updates).pipe(
      switchMap(() => this.http.put<ShareResult>(`/api/documents/${documentId}/share`, updates)),
      tap(result => {
        this.notificationService.notifyShareUpdate(result);
        this.activityService.logShareUpdate(documentId, updates, result);
      }),
      catchError(error => this.errorHandler.handleError(error))
    );
  }

  getSharedAccess(documentId: string): Observable<SharedAccess> {
    const userId = 'current_user'; // Replace with actual user ID
    
    return this.rateLimitService.checkRateLimit('accessCheck', userId).pipe(
      switchMap(() => this.http.get<SharedAccess>(`/api/documents/${documentId}/access`)),
      catchError(error => {
        if (error instanceof ShareRateLimitError) {
          return throwError(() => error);
        }
        return this.errorHandler.handleError(error);
      })
    );
  }
}
```

### Component Implementation

#### ShareDialogComponent
```typescript
@Component({
  selector: 'app-share-dialog',
  template: `
    <h2 mat-dialog-title>Share Document</h2>
    
    <mat-dialog-content>
      <form [formGroup]="shareForm">
        <app-recipient-selector
          formControlName="recipients"
          [multiple]="true">
        </app-recipient-selector>

        <mat-form-field>
          <mat-label>Permission Level</mat-label>
          <mat-select formControlName="permissionLevel">
            <mat-option value="VIEW">View Only</mat-option>
            <mat-option value="EDIT">Can Edit</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Expires</mat-label>
          <input matInput
                 [matDatepicker]="picker"
                 formControlName="expiration">
          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Message (Optional)</mat-label>
          <textarea matInput
                    formControlName="message"
                    rows="3">
          </textarea>
        </mat-form-field>

        <mat-slide-toggle formControlName="notifyRecipients">
          Notify recipients
        </mat-slide-toggle>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button
              color="primary"
              [disabled]="!shareForm.valid || isSharing"
              (click)="onShare()">
        Share
      </button>
    </mat-dialog-actions>
  `
})
export class ShareDialogComponent {
  @Input() documentId!: string;
  
  shareForm = this.fb.group({
    recipients: [[], [Validators.required, Validators.minLength(1)]],
    permissionLevel: ['VIEW', Validators.required],
    expiration: [null],
    message: [''],
    notifyRecipients: [true]
  });

  isSharing = false;

  constructor(
    private fb: FormBuilder,
    private sharingService: DocumentSharingService,
    private dialogRef: MatDialogRef<ShareDialogComponent>,
    private snackBar: MatSnackBar
  ) {}

  onShare(): void {
    if (this.shareForm.invalid) {
      return;
    }

    this.isSharing = true;
    const options: ShareOptions = {
      documentId: this.documentId,
      ...this.shareForm.value
    };

    this.sharingService.shareDocument(this.documentId, options).subscribe({
      next: (result) => {
        this.snackBar.open('Document shared successfully', 'Close', { duration: 3000 });
        this.dialogRef.close(result);
      },
      error: (error) => {
        this.snackBar.open('Failed to share document', 'Close', { duration: 3000 });
        this.isSharing = false;
      }
    });
  }
}
```

#### ShareActivityChartComponent
```typescript
@Component({
  selector: 'app-share-activity-chart',
  template: `
    <ngx-charts-line-chart
      [results]="chartData"
      [xAxis]="true"
      [yAxis]="true"
      [legend]="true"
      [showXAxisLabel]="true"
      [showYAxisLabel]="true"
      xAxisLabel="Date"
      yAxisLabel="Access Count">
    </ngx-charts-line-chart>
  `
})
export class ShareActivityChartComponent implements OnInit {
  @Input() documentId!: string;
  chartData: any[] = [];

  constructor(
    private activityService: ShareActivityService
  ) {}

  ngOnInit(): void {
    this.loadActivityData();
  }

  private loadActivityData(): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    this.activityService.getActivity({
      documentId: this.documentId,
      startDate: thirtyDaysAgo,
      type: 'ACCESS'
    }).subscribe(activities => {
      this.chartData = this.processActivityData(activities);
    });
  }

  private processActivityData(activities: ShareActivity[]): any[] {
    // Transform activities into chart format
    return [];
  }
}
```

## Security Implementation

### Share Guard
```typescript
@Injectable({
  providedIn: 'root'
})
export class ShareGuard implements CanActivate {
  constructor(private sharingService: DocumentSharingService) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const documentId = route.params['id'];
    return this.sharingService.getSharedAccess(documentId).pipe(
      map(access => {
        const userPermissions = access.directShares.find(s => s.userId === 'current_user');
        return userPermissions?.permissionLevel === 'EDIT';
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
export class ShareValidationService {
  validateSharing(documentId: string, options: ShareOptions): Observable<ValidationResult> {
    return this.checkSharePermissions(documentId).pipe(
      switchMap(canShare => {
        if (!canShare) {
          return throwError(() => new Error('Insufficient sharing permissions'));
        }
        if (!this.validateRecipients(options.recipients)) {
          return throwError(() => new Error('Invalid recipients'));
        }
        return of({ valid: true });
      })
    );
  }

  validateLinkOptions(options: LinkOptions): Observable<ValidationResult> {
    if (options.password && !this.isValidPassword(options.password)) {
      return throwError(() => new Error('Invalid password format'));
    }
    if (options.usageLimit && (options.usageLimit < 1 || options.usageLimit > 1000)) {
      return throwError(() => new Error('Usage limit must be between 1 and 1000'));
    }
    return of({ valid: true });
  }

  private isValidPassword(password: string): boolean {
    return password.length >= 8 && /^(?=.*[A-Za-z])(?=.*\d)/.test(password);
  }
}
```

## Error Handling

### ShareErrorHandler
```typescript
@Injectable()
export class ShareErrorHandler extends GlobalErrorHandler {
  handleShareError(error: any): Observable<never> {
    if (error instanceof ShareRateLimitError) {
      return throwError(() => error);
    }
    if (error.code === 'RECIPIENT_NOT_FOUND') {
      return throwError(() => new Error('One or more recipients not found'));
    }
    if (error.code === 'SHARE_LIMIT_EXCEEDED') {
      return throwError(() => new Error('Share limit exceeded for this document'));
    }
    if (error.code === 'INVALID_PERMISSION_LEVEL') {
      return throwError(() => new Error('Cannot grant higher permissions than you have'));
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
export class ShareCacheService {
  private cache = new Map<string, CachedShare>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  cacheSharedAccess(documentId: string, access: SharedAccess): void {
    this.cache.set(documentId, {
      access,
      timestamp: Date.now()
    });
    setTimeout(() => this.cache.delete(documentId), this.cacheTimeout);
  }

  getCachedAccess(documentId: string): SharedAccess | undefined {
    const cached = this.cache.get(documentId);
    if (cached && Date.now() - cached.timestamp <= this.cacheTimeout) {
      return cached.access;
    }
    return undefined;
  }

  invalidateCache(documentId?: string): void {
    if (documentId) {
      this.cache.delete(documentId);
    } else {
      this.cache.clear();
    }
  }
}
```

### Activity Aggregation
- Real-time activity tracking with WebSocket
- Batch processing for activity logs
- Aggregated statistics caching

## Testing Strategy

### Unit Tests
```typescript
describe('DocumentSharingService', () => {
  let service: DocumentSharingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DocumentSharingService]
    });
    
    service = TestBed.inject(DocumentSharingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should share document', (done) => {
    const options: ShareOptions = {
      documentId: '123',
      recipients: [{ id: 'user1', type: 'USER' }],
      permissionLevel: 'VIEW',
      notifyRecipients: true
    };

    service.shareDocument('123', options).subscribe(result => {
      expect(result.success).toBeTruthy();
      done();
    });

    const req = httpMock.expectOne('/api/documents/123/share');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true });
  });

  it('should validate before generating link', (done) => {
    const options: LinkOptions = {
      accessLevel: 'VIEW',
      password: 'weakpass',
      allowEmbed: true
    };

    service.generateShareLink('123', options).subscribe({
      error: (error) => {
        expect(error.message).toContain('Invalid password');
        done();
      }
    });
  });
});
```

### Integration Tests
```typescript
describe('ShareDialogComponent', () => {
  let component: ShareDialogComponent;
  let fixture: ComponentFixture<ShareDialogComponent>;
  let sharingService: jasmine.SpyObj<DocumentSharingService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('DocumentSharingService', ['shareDocument']);
    
    await TestBed.configureTestingModule({
      declarations: [ShareDialogComponent],
      providers: [
        { provide: DocumentSharingService, useValue: spy }
      ]
    }).compileComponents();

    sharingService = TestBed.inject(DocumentSharingService) as jasmine.SpyObj<DocumentSharingService>;
  });

  it('should validate form before sharing', () => {
    const invalidForm = {
      recipients: [],
      permissionLevel: 'VIEW',
      notifyRecipients: true
    };

    component.shareForm.patchValue(invalidForm);
    component.onShare();
    
    expect(sharingService.shareDocument).not.toHaveBeenCalled();
  });
});
```

## Technical Constraints
1. Maximum recipients per share: 100
2. Share link password minimum length: 8 characters
3. Maximum usage limit per link: 1000
4. Activity log retention: 90 days
5. Maximum concurrent shares: 1000 per document

## Dependencies
1. @angular/core: ^20.0.0
2. @angular/material: ^20.0.0
3. @angular/cdk: ^20.0.0
4. rxjs: ^7.8.0
5. ngx-charts: ^20.0.0

## Deployment Requirements
1. Node.js >= 18.x
2. Angular CLI >= 20.0.0
3. Memory: 512MB minimum
4. Storage: Based on activity log size
5. Network: WebSocket support required

## Success Metrics
1. Share operation response time < 200ms
2. Link generation time < 100ms
3. Activity log query time < 300ms
4. WebSocket message latency < 50ms
5. UI interaction response time < 150ms 