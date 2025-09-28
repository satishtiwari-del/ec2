# File Edit - Technical Use Cases

## Document Metadata
**AIGEN-Cycle UUID**: K9MX-2R
**Document Version**: 1.0
**Angular Version**: 20.0.0
**UI Framework**: Angular Material
**API Status**: Mock API (Development)

## Functional Use Case Reference
- Source Document: `ai/test/doclib/functional-use-cases/document/file-edit/file-edit-func-use-cases.md`
- Use Cases Referenced: UC-FE-01 through UC-FE-05

## Technical Architecture

### Component Structure
```typescript
// File Edit Module
@NgModule({
  declarations: [
    FileEditComponent,
    InlineEditorComponent,
    ExternalEditorComponent,
    CollaborativeEditorComponent,
    MetadataEditorComponent,
    VersionHistoryComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatProgressBarModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTabsModule,
    MonacoEditorModule,
    QuillEditorModule
  ],
  providers: [
    FileEditService,
    LockService,
    CollaborationService,
    ConflictResolutionService
  ]
})
export class FileEditModule { }
```

### Service Layer
```typescript
// File Edit Service Interface
interface IFileEditService {
  getEditableContent(fileId: string): Observable<EditableContent>;
  saveContent(fileId: string, content: string, options: SaveOptions): Observable<SaveResult>;
  checkoutFile(fileId: string): Observable<CheckoutResult>;
  checkinFile(fileId: string, options: CheckinOptions): Observable<void>;
  discardChanges(fileId: string): Observable<void>;
  getEditHistory(fileId: string): Observable<EditHistory[]>;
}

// Data Models
interface EditableContent {
  content: string;
  metadata: FileMetadata;
  version: string;
  lockInfo?: LockInfo;
  collaborators?: CollaboratorInfo[];
}

interface SaveOptions {
  createVersion?: boolean;
  versionNotes?: string;
  updateMetadata?: boolean;
  notifyCollaborators?: boolean;
}

interface CheckoutOptions {
  duration?: number; // milliseconds
  exclusive?: boolean;
  notifyOwner?: boolean;
}

interface LockInfo {
  userId: string;
  acquired: Date;
  expires: Date;
  exclusive: boolean;
}

interface CollaboratorInfo {
  userId: string;
  cursor?: CursorPosition;
  selection?: SelectionRange;
  lastActive: Date;
}
```

### Lock Management
```typescript
@Injectable()
export class LockService {
  private readonly locks = new Map<string, LockInfo>();
  private readonly LOCK_DURATION = 30 * 60 * 1000; // 30 minutes

  async acquireLock(fileId: string, userId: string, exclusive = false): Promise<LockInfo> {
    const existingLock = this.locks.get(fileId);
    if (existingLock && !this.isLockExpired(existingLock)) {
      if (existingLock.exclusive || exclusive) {
        throw new Error('File is locked');
      }
    }

    const lock: LockInfo = {
      userId,
      acquired: new Date(),
      expires: new Date(Date.now() + this.LOCK_DURATION),
      exclusive
    };
    this.locks.set(fileId, lock);
    return lock;
  }

  async releaseLock(fileId: string, userId: string): Promise<void> {
    const lock = this.locks.get(fileId);
    if (lock && lock.userId === userId) {
      this.locks.delete(fileId);
    }
  }

  private isLockExpired(lock: LockInfo): boolean {
    return lock.expires.getTime() < Date.now();
  }
}
```

## Technical Implementation Details

### 1. Direct File Edit (UC-FE-01)
```typescript
@Component({
  selector: 'app-inline-editor',
  template: `
    <div class="editor-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{fileName}}</mat-card-title>
          <mat-card-subtitle>
            <span *ngIf="lockInfo">
              Locked by {{lockInfo.userId}} 
              (expires in {{timeUntilExpiry}} minutes)
            </span>
          </mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <ngx-monaco-editor
            [options]="editorOptions"
            [(ngModel)]="content"
            (ngModelChange)="onContentChange()">
          </ngx-monaco-editor>
        </mat-card-content>
        
        <mat-card-actions>
          <button mat-raised-button color="primary" 
                  (click)="saveChanges()"
                  [disabled]="!hasChanges || saving">
            Save Changes
          </button>
          <button mat-button (click)="discardChanges()"
                  [disabled]="!hasChanges">
            Discard
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `
})
export class InlineEditorComponent implements OnInit, OnDestroy {
  @Input() fileId!: string;
  @Input() fileName!: string;
  
  content = '';
  originalContent = '';
  hasChanges = false;
  saving = false;
  lockInfo?: LockInfo;
  
  private autoSaveSubscription?: Subscription;
  
  constructor(
    private editService: FileEditService,
    private lockService: LockService,
    private snackBar: MatSnackBar
  ) {}
  
  async ngOnInit() {
    try {
      this.lockInfo = await this.lockService.acquireLock(this.fileId, this.userId);
      const content = await this.editService.getEditableContent(this.fileId).toPromise();
      this.content = this.originalContent = content.content;
      this.setupAutoSave();
    } catch (error) {
      this.snackBar.open('Failed to acquire lock', 'Close', { duration: 3000 });
    }
  }
  
  ngOnDestroy() {
    this.autoSaveSubscription?.unsubscribe();
    if (this.lockInfo) {
      this.lockService.releaseLock(this.fileId, this.userId);
    }
  }
  
  private setupAutoSave() {
    this.autoSaveSubscription = interval(30000) // 30 seconds
      .pipe(
        filter(() => this.hasChanges && !this.saving)
      )
      .subscribe(() => this.saveChanges(true));
  }
  
  async saveChanges(isAutoSave = false) {
    this.saving = true;
    try {
      await this.editService.saveContent(this.fileId, this.content, {
        createVersion: !isAutoSave
      }).toPromise();
      
      this.originalContent = this.content;
      this.hasChanges = false;
      
      if (!isAutoSave) {
        this.snackBar.open('Changes saved', 'Close', { duration: 3000 });
      }
    } catch (error) {
      this.snackBar.open('Failed to save changes', 'Close', { duration: 3000 });
    } finally {
      this.saving = false;
    }
  }
}
```

### 2. External Editor Integration (UC-FE-02)
```typescript
@Injectable()
export class ExternalEditorService {
  private readonly SUPPORTED_APPS = new Map<string, ExternalAppConfig>([
    ['pdf', { protocol: 'acrobat:', args: ['action=edit'] }],
    ['docx', { protocol: 'ms-word:', args: ['edit=true'] }],
    ['xlsx', { protocol: 'ms-excel:', args: ['edit=true'] }]
  ]);

  async openInExternalEditor(file: FileInfo): Promise<void> {
    const appConfig = this.SUPPORTED_APPS.get(file.extension);
    if (!appConfig) {
      throw new Error('No external editor configured for this file type');
    }

    const checkoutResult = await this.editService.checkoutFile(file.id).toPromise();
    const tempPath = await this.downloadToTemp(file.id);
    
    try {
      await this.launchExternalApp(appConfig, tempPath);
      this.watchForChanges(tempPath, file.id);
    } catch (error) {
      await this.editService.discardChanges(file.id);
      throw error;
    }
  }

  private watchForChanges(path: string, fileId: string) {
    const watcher = fs.watch(path, async (eventType) => {
      if (eventType === 'change') {
        const content = await fs.readFile(path);
        await this.editService.saveContent(fileId, content, {
          createVersion: false
        }).toPromise();
      }
    });

    // Stop watching after timeout or manual check-in
    setTimeout(() => watcher.close(), 4 * 60 * 60 * 1000); // 4 hours
  }
}
```

### 3. Collaborative Editing (UC-FE-03)
```typescript
@Injectable()
export class CollaborationService {
  private readonly collaborators = new Map<string, CollaboratorInfo[]>();
  private readonly webSocket: WebSocket;

  constructor() {
    this.webSocket = new WebSocket('wss://api.doclib.com/collaboration');
    this.webSocket.onmessage = this.handleMessage.bind(this);
  }

  joinSession(fileId: string, userId: string): Observable<void> {
    return new Observable(subscriber => {
      this.webSocket.send(JSON.stringify({
        type: 'join',
        fileId,
        userId
      }));

      const cleanup = () => {
        this.webSocket.send(JSON.stringify({
          type: 'leave',
          fileId,
          userId
        }));
      };

      return cleanup;
    });
  }

  updateCursor(fileId: string, position: CursorPosition) {
    this.webSocket.send(JSON.stringify({
      type: 'cursor',
      fileId,
      position
    }));
  }

  private handleMessage(event: MessageEvent) {
    const message = JSON.parse(event.data);
    switch (message.type) {
      case 'change':
        this.handleChange(message);
        break;
      case 'cursor':
        this.handleCursorUpdate(message);
        break;
      case 'join':
      case 'leave':
        this.handlePresenceUpdate(message);
        break;
    }
  }
}

@Component({
  selector: 'app-collaborative-editor',
  template: `
    <div class="collaborative-editor">
      <div class="collaborators">
        <mat-chip-list>
          <mat-chip *ngFor="let user of activeUsers$ | async"
                   [style.background-color]="user.color">
            {{user.name}}
          </mat-chip>
        </mat-chip-list>
      </div>
      
      <quill-editor
        [(ngModel)]="content"
        [modules]="editorModules"
        (onContentChanged)="onContentChange($event)"
        (onSelectionChanged)="onSelectionChange($event)">
      </quill-editor>
    </div>
  `
})
export class CollaborativeEditorComponent {
  editorModules = {
    cursors: true,
    history: {
      userOnly: true
    },
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['clean']
    ]
  };

  onContentChange(event: any) {
    const delta = event.delta;
    this.collaborationService.broadcastChange(this.fileId, delta);
  }

  onSelectionChange(event: any) {
    const range = event.range;
    this.collaborationService.updateCursor(this.fileId, range);
  }
}
```

### 4. Metadata Edit (UC-FE-04)
```typescript
@Component({
  selector: 'app-metadata-editor',
  template: `
    <form [formGroup]="metadataForm" (ngSubmit)="saveMetadata()">
      <mat-form-field>
        <input matInput placeholder="Title" 
               formControlName="title">
      </mat-form-field>
      
      <mat-form-field>
        <mat-chip-list #chipList>
          <mat-chip *ngFor="let tag of tags" [removable]="true"
                   (removed)="removeTag(tag)">
            {{tag}}
          </mat-chip>
          <input placeholder="Tags"
                 [matChipInputFor]="chipList"
                 [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
                 (matChipInputTokenEnd)="addTag($event)">
        </mat-chip-list>
      </mat-form-field>
      
      <mat-form-field>
        <textarea matInput placeholder="Description"
                  formControlName="description">
        </textarea>
      </mat-form-field>
      
      <div formGroupName="customFields">
        <div *ngFor="let field of customFields" class="custom-field">
          <mat-form-field>
            <input matInput [placeholder]="field.label"
                   [formControlName]="field.key">
          </mat-form-field>
        </div>
      </div>
      
      <button mat-raised-button color="primary" type="submit"
              [disabled]="!metadataForm.valid || !metadataForm.dirty">
        Save Metadata
      </button>
    </form>
  `
})
export class MetadataEditorComponent {
  metadataForm = this.fb.group({
    title: ['', Validators.required],
    tags: [[] as string[]],
    description: [''],
    customFields: this.fb.group({})
  });

  saveMetadata() {
    if (this.metadataForm.valid && this.metadataForm.dirty) {
      this.editService.saveContent(this.fileId, null, {
        updateMetadata: true,
        metadata: this.metadataForm.value
      }).subscribe({
        next: () => {
          this.snackBar.open('Metadata updated', 'Close', { duration: 3000 });
          this.metadataForm.markAsPristine();
        },
        error: () => {
          this.snackBar.open('Failed to update metadata', 'Close', { duration: 3000 });
        }
      });
    }
  }
}
```

### 5. Version Management (UC-FE-05)
```typescript
@Component({
  selector: 'app-version-history',
  template: `
    <mat-table [dataSource]="versions$ | async">
      <ng-container matColumnDef="version">
        <mat-header-cell *matHeaderCellDef>Version</mat-header-cell>
        <mat-cell *matCellDef="let version">{{version.number}}</mat-cell>
      </ng-container>
      
      <ng-container matColumnDef="date">
        <mat-header-cell *matHeaderCellDef>Date</mat-header-cell>
        <mat-cell *matCellDef="let version">
          {{version.timestamp | date:'medium'}}
        </mat-cell>
      </ng-container>
      
      <ng-container matColumnDef="author">
        <mat-header-cell *matHeaderCellDef>Author</mat-header-cell>
        <mat-cell *matCellDef="let version">{{version.author}}</mat-cell>
      </ng-container>
      
      <ng-container matColumnDef="actions">
        <mat-header-cell *matHeaderCellDef>Actions</mat-header-cell>
        <mat-cell *matCellDef="let version">
          <button mat-icon-button (click)="viewVersion(version)">
            <mat-icon>visibility</mat-icon>
          </button>
          <button mat-icon-button (click)="restoreVersion(version)">
            <mat-icon>restore</mat-icon>
          </button>
          <button mat-icon-button (click)="compareVersions(version)">
            <mat-icon>compare</mat-icon>
          </button>
        </mat-cell>
      </ng-container>
    </mat-table>
  `
})
export class VersionHistoryComponent {
  versions$: Observable<VersionInfo[]>;

  constructor(
    private editService: FileEditService,
    private dialog: MatDialog
  ) {
    this.versions$ = this.editService.getVersionHistory(this.fileId);
  }

  compareVersions(version: VersionInfo) {
    this.dialog.open(VersionCompareDialog, {
      data: {
        fileId: this.fileId,
        version1: version,
        version2: 'latest'
      },
      width: '80vw',
      height: '80vh'
    });
  }

  restoreVersion(version: VersionInfo) {
    this.editService.restoreVersion(this.fileId, version.number).subscribe({
      next: () => {
        this.snackBar.open('Version restored', 'Close', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Failed to restore version', 'Close', { duration: 3000 });
      }
    });
  }
}
```

## Security Implementation

### Edit Authorization
```typescript
@Injectable()
export class EditAuthorizationService {
  canEdit(file: FileInfo, user: User): Observable<boolean> {
    return combineLatest([
      this.checkPermissions(file, user),
      this.checkQuota(user),
      this.checkLock(file)
    ]).pipe(
      map(([hasPermission, hasQuota, notLocked]) => 
        hasPermission && hasQuota && notLocked
      )
    );
  }

  private checkPermissions(file: FileInfo, user: User): Observable<boolean> {
    return this.permissionService.hasPermission(user, 'EDIT', file);
  }

  private checkQuota(user: User): Observable<boolean> {
    return this.quotaService.hasAvailableSpace(user);
  }

  private checkLock(file: FileInfo): Observable<boolean> {
    return this.lockService.isLocked(file.id).pipe(
      map(locked => !locked)
    );
  }
}
```

### Conflict Resolution
```typescript
@Injectable()
export class ConflictResolutionService {
  private readonly MERGE_THRESHOLD = 0.7; // 70% similarity

  async resolveConflict(fileId: string, localChanges: string, serverChanges: string): Promise<string> {
    const similarity = this.calculateSimilarity(localChanges, serverChanges);
    
    if (similarity >= this.MERGE_THRESHOLD) {
      return this.autoMerge(localChanges, serverChanges);
    } else {
      return this.manualMerge(localChanges, serverChanges);
    }
  }

  private async manualMerge(local: string, server: string): Promise<string> {
    const dialog = this.dialog.open(ConflictResolutionDialog, {
      data: {
        local,
        server,
        diff: this.generateDiff(local, server)
      },
      disableClose: true
    });

    return dialog.afterClosed().toPromise();
  }
}
```

## Performance Optimizations

### Change Tracking
```typescript
@Injectable()
export class ChangeTrackingService {
  private readonly changeBuffer = new Map<string, Change[]>();
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds

  constructor() {
    interval(this.FLUSH_INTERVAL).subscribe(() => this.flushChanges());
  }

  trackChange(fileId: string, change: Change) {
    const changes = this.changeBuffer.get(fileId) || [];
    changes.push(change);
    this.changeBuffer.set(fileId, changes);
  }

  private async flushChanges() {
    for (const [fileId, changes] of this.changeBuffer.entries()) {
      if (changes.length > 0) {
        await this.saveChanges(fileId, changes);
        this.changeBuffer.delete(fileId);
      }
    }
  }
}
```

### Content Caching
```typescript
@Injectable()
export class EditCacheService {
  private readonly cache = new Map<string, CacheEntry<EditableContent>>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  getCachedContent(fileId: string): EditableContent | null {
    const entry = this.cache.get(fileId);
    if (!entry) return null;
    
    if (this.isExpired(entry)) {
      this.cache.delete(fileId);
      return null;
    }
    
    return entry.data;
  }

  cacheContent(fileId: string, content: EditableContent) {
    this.cache.set(fileId, {
      data: content,
      timestamp: Date.now()
    });
  }
}
```

## Testing Strategy

### Unit Tests
```typescript
describe('FileEditService', () => {
  let service: FileEditService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FileEditService]
    });
    service = TestBed.inject(FileEditService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should save content successfully', (done) => {
    const content = 'Updated content';
    service.saveContent('123', content, {}).subscribe(result => {
      expect(result).toBeTruthy();
      done();
    });

    const req = httpMock.expectOne('/api/files/123/content');
    expect(req.request.method).toBe('PUT');
    req.flush({ success: true });
  });
});
```

### Integration Tests
```typescript
describe('CollaborativeEditorComponent', () => {
  let component: CollaborativeEditorComponent;
  let fixture: ComponentFixture<CollaborativeEditorComponent>;
  let collaborationService: jasmine.SpyObj<CollaborationService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CollaborativeEditorComponent],
      imports: [
        QuillModule.forRoot(),
        MatChipsModule
      ],
      providers: [
        {
          provide: CollaborationService,
          useValue: jasmine.createSpyObj('CollaborationService', ['joinSession', 'broadcastChange'])
        }
      ]
    }).compileComponents();
  });

  it('should broadcast changes', () => {
    const change = { ops: [{ insert: 'test' }] };
    component.onContentChange({ delta: change });
    expect(collaborationService.broadcastChange)
      .toHaveBeenCalledWith(component.fileId, change);
  });
});
```

## Technical Constraints
1. Maximum file size for online editing: 10MB
2. Auto-save interval: 30 seconds
3. Lock duration: 30 minutes
4. Maximum concurrent editors: 10
5. Version history limit: 100
6. Conflict resolution timeout: 5 minutes
7. Change tracking buffer: 5 seconds

## Success Metrics
1. Edit Performance:
   - Load time: <2 seconds
   - Save time: <1 second
   - Auto-save: <500ms
2. Collaboration:
   - Sync delay: <100ms
   - Cursor update: <50ms
   - Conflict rate: <1%
3. User Experience:
   - Editor responsiveness: <50ms
   - Version switch: <2 seconds
   - Search in content: <500ms

## Dependencies
1. @angular/material: ^20.0.0
2. @angular/cdk: ^20.0.0
3. monaco-editor: ^0.40.0
4. quill: ^1.3.7
5. diff-match-patch: ^1.0.5

## Deployment Requirements
1. Node.js version: >=18.0.0
2. WebSocket support
3. Collaboration server
4. In-memory caching
5. Load balancer sticky sessions 