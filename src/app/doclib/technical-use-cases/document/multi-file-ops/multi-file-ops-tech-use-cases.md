# Multi-file Operations - Technical Use Cases

## Document Metadata
**AIGEN-Cycle UUID**: K9MX-2R
**Document Version**: 1.0
**Angular Version**: 20.0.0
**UI Framework**: Angular Material
**API Status**: Mock API (Development)

## Functional Use Case Reference
- Source Document: `ai/test/doclib/functional-use-cases/document/multi-file-ops/multi-file-ops-func-use-cases.md`
- Use Cases Referenced: UC-MF-01 through UC-MF-05

## Technical Architecture

### Component Structure
```typescript
// Multi-file Operations Module
@NgModule({
  declarations: [
    MultiFileOperationsComponent,
    BatchMoveComponent,
    BatchCopyComponent,
    BatchDeleteComponent,
    BatchMetadataComponent,
    BatchPermissionsComponent,
    OperationProgressComponent
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
    MatTableModule,
    MatCheckboxModule,
    DragDropModule
  ],
  providers: [
    MultiFileOperationsService,
    BatchProcessingService,
    OperationQueueService,
    RollbackService
  ]
})
export class MultiFileOperationsModule { }
```

### Service Layer
```typescript
// Multi-file Operations Service Interface
interface IMultiFileOperationsService {
  moveFiles(files: FileInfo[], targetFolder: string, options: BatchOptions): Observable<BatchResult>;
  copyFiles(files: FileInfo[], targetFolder: string, options: BatchOptions): Observable<BatchResult>;
  deleteFiles(files: FileInfo[], options: BatchOptions): Observable<BatchResult>;
  updateMetadata(files: FileInfo[], metadata: Partial<FileMetadata>, options: BatchOptions): Observable<BatchResult>;
  updatePermissions(files: FileInfo[], permissions: FilePermissions, options: BatchOptions): Observable<BatchResult>;
}

// Data Models
interface BatchOptions {
  atomic?: boolean;
  skipErrors?: boolean;
  preserveStructure?: boolean;
  notifyOwners?: boolean;
  rollbackOnError?: boolean;
  progressCallback?: (progress: BatchProgress) => void;
}

interface BatchResult {
  successful: FileOperationResult[];
  failed: FileOperationError[];
  rollbackNeeded: boolean;
  operationId: string;
}

interface BatchProgress {
  operationId: string;
  processed: number;
  total: number;
  currentFile?: string;
  status: 'processing' | 'paused' | 'completed' | 'failed';
  errors?: FileOperationError[];
}

interface FileOperationResult {
  fileId: string;
  operation: OperationType;
  timestamp: Date;
  metadata?: FileMetadata;
}

interface FileOperationError {
  fileId: string;
  operation: OperationType;
  error: string;
  retryable: boolean;
}
```

### Operation Queue Management
```typescript
@Injectable()
export class OperationQueueService {
  private readonly queue = new Map<string, BatchOperation>();
  private readonly MAX_CONCURRENT = 3;
  private processing = false;

  queueOperation(operation: BatchOperation): string {
    const operationId = uuid();
    this.queue.set(operationId, {
      ...operation,
      status: 'queued',
      timestamp: new Date()
    });
    this.processQueue();
    return operationId;
  }

  private async processQueue() {
    if (this.processing) return;
    this.processing = true;

    const active = Array.from(this.queue.values())
      .filter(op => op.status === 'processing');
    
    if (active.length >= this.MAX_CONCURRENT) {
      this.processing = false;
      return;
    }

    const next = Array.from(this.queue.values())
      .find(op => op.status === 'queued');
    
    if (next) {
      await this.processOperation(next);
    }

    this.processing = false;
  }

  private async processOperation(operation: BatchOperation) {
    operation.status = 'processing';
    try {
      await this.executeOperation(operation);
      operation.status = 'completed';
    } catch (error) {
      operation.status = 'failed';
      operation.error = error;
      if (operation.options.rollbackOnError) {
        await this.rollbackService.rollback(operation.operationId);
      }
    }
  }
}
```

## Technical Implementation Details

### 1. Batch Move Operation (UC-MF-01)
```typescript
@Component({
  selector: 'app-batch-move',
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Move {{selectedFiles.length}} Files</mat-card-title>
      </mat-card-header>
      
      <mat-card-content>
        <div class="folder-tree">
          <mat-tree [dataSource]="folderDataSource" [treeControl]="treeControl">
            <mat-tree-node *matTreeNodeDef="let node" matTreeNodePadding>
              <button mat-icon-button (click)="selectFolder(node)">
                <mat-icon>folder</mat-icon>
              </button>
              {{node.name}}
            </mat-tree-node>
          </mat-tree>
        </div>
        
        <mat-checkbox [(ngModel)]="preserveStructure">
          Preserve folder structure
        </mat-checkbox>
        
        <mat-checkbox [(ngModel)]="notifyOwners">
          Notify file owners
        </mat-checkbox>
      </mat-card-content>
      
      <mat-card-actions>
        <button mat-raised-button color="primary"
                [disabled]="!selectedFolder || moving"
                (click)="moveFiles()">
          Move Files
        </button>
      </mat-card-actions>
      
      <mat-card-footer>
        <mat-progress-bar *ngIf="moving"
          [mode]="progress.status === 'processing' ? 'determinate' : 'indeterminate'"
          [value]="(progress.processed / progress.total) * 100">
        </mat-progress-bar>
      </mat-card-footer>
    </mat-card>
  `
})
export class BatchMoveComponent {
  @Input() selectedFiles: FileInfo[] = [];
  selectedFolder: string | null = null;
  preserveStructure = true;
  notifyOwners = true;
  moving = false;
  progress: BatchProgress = {
    operationId: '',
    processed: 0,
    total: 0,
    status: 'processing'
  };

  async moveFiles() {
    if (!this.selectedFolder) return;

    this.moving = true;
    try {
      const result = await this.multiFileService.moveFiles(
        this.selectedFiles,
        this.selectedFolder,
        {
          preserveStructure: this.preserveStructure,
          notifyOwners: this.notifyOwners,
          progressCallback: progress => this.progress = progress
        }
      ).toPromise();

      if (result.failed.length > 0) {
        this.showErrors(result.failed);
      } else {
        this.snackBar.open('Files moved successfully', 'Close', { duration: 3000 });
      }
    } catch (error) {
      this.snackBar.open('Failed to move files', 'Close', { duration: 3000 });
    } finally {
      this.moving = false;
    }
  }
}
```

### 2. Batch Copy Operation (UC-MF-02)
```typescript
@Component({
  selector: 'app-batch-copy',
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Copy {{selectedFiles.length}} Files</mat-card-title>
      </mat-card-header>
      
      <mat-card-content>
        <div class="folder-tree">
          <!-- Similar to BatchMoveComponent -->
        </div>
        
        <mat-checkbox [(ngModel)]="preserveStructure">
          Preserve folder structure
        </mat-checkbox>
        
        <mat-checkbox [(ngModel)]="copyPermissions">
          Copy permissions
        </mat-checkbox>
        
        <mat-checkbox [(ngModel)]="copyVersionHistory">
          Copy version history
        </mat-checkbox>
      </mat-card-content>
      
      <mat-card-actions>
        <button mat-raised-button color="primary"
                [disabled]="!selectedFolder || copying"
                (click)="copyFiles()">
          Copy Files
        </button>
      </mat-card-actions>
      
      <mat-card-footer>
        <mat-progress-bar *ngIf="copying"
          [mode]="progress.status === 'processing' ? 'determinate' : 'indeterminate'"
          [value]="(progress.processed / progress.total) * 100">
        </mat-progress-bar>
      </mat-card-footer>
    </mat-card>
  `
})
export class BatchCopyComponent {
  // Similar to BatchMoveComponent with copy-specific options
}
```

### 3. Batch Delete Operation (UC-MF-03)
```typescript
@Component({
  selector: 'app-batch-delete',
  template: `
    <mat-dialog-content>
      <h2>Delete {{files.length}} Files</h2>
      
      <p class="warning">
        This action cannot be undone. Are you sure you want to proceed?
      </p>
      
      <div class="impact-analysis" *ngIf="impactAnalysis$ | async as impact">
        <h3>Impact Analysis</h3>
        <ul>
          <li>Shared files: {{impact.sharedFiles}}</li>
          <li>Referenced files: {{impact.referencedFiles}}</li>
          <li>Total storage: {{impact.totalStorage | fileSize}}</li>
        </ul>
      </div>
      
      <mat-checkbox [(ngModel)]="notifyOwners">
        Notify file owners
      </mat-checkbox>
      
      <mat-checkbox [(ngModel)]="skipSharedFiles">
        Skip shared files
      </mat-checkbox>
    </mat-dialog-content>
    
    <mat-dialog-actions>
      <button mat-button [mat-dialog-close]="false">Cancel</button>
      <button mat-raised-button color="warn"
              [disabled]="deleting"
              (click)="confirmDelete()">
        Delete Files
      </button>
    </mat-dialog-actions>
    
    <mat-progress-bar *ngIf="deleting"
      [mode]="progress.status === 'processing' ? 'determinate' : 'indeterminate'"
      [value]="(progress.processed / progress.total) * 100">
    </mat-progress-bar>
  `
})
export class BatchDeleteComponent {
  @Input() files: FileInfo[] = [];
  impactAnalysis$: Observable<DeleteImpactAnalysis>;
  notifyOwners = true;
  skipSharedFiles = true;
  deleting = false;
  progress: BatchProgress;

  ngOnInit() {
    this.impactAnalysis$ = this.multiFileService.analyzeDeleteImpact(this.files);
  }

  async confirmDelete() {
    this.deleting = true;
    try {
      const result = await this.multiFileService.deleteFiles(
        this.files,
        {
          notifyOwners: this.notifyOwners,
          skipSharedFiles: this.skipSharedFiles,
          progressCallback: progress => this.progress = progress
        }
      ).toPromise();

      if (result.failed.length > 0) {
        this.showErrors(result.failed);
      } else {
        this.dialogRef.close(true);
      }
    } catch (error) {
      this.snackBar.open('Failed to delete files', 'Close', { duration: 3000 });
    } finally {
      this.deleting = false;
    }
  }
}
```

### 4. Batch Metadata Update (UC-MF-04)
```typescript
@Component({
  selector: 'app-batch-metadata',
  template: `
    <form [formGroup]="metadataForm" (ngSubmit)="updateMetadata()">
      <mat-form-field>
        <input matInput placeholder="Title Pattern" 
               formControlName="titlePattern">
        <mat-hint>Use {index} for numbering</mat-hint>
      </mat-form-field>
      
      <mat-form-field>
        <mat-chip-list #chipList>
          <mat-chip *ngFor="let tag of tags" [removable]="true"
                   (removed)="removeTag(tag)">
            {{tag}}
          </mat-chip>
          <input placeholder="Add Tags"
                 [matChipInputFor]="chipList"
                 (matChipInputTokenEnd)="addTag($event)">
        </mat-chip-list>
      </mat-form-field>
      
      <mat-form-field>
        <mat-select formControlName="category">
          <mat-option *ngFor="let cat of categories" [value]="cat.value">
            {{cat.label}}
          </mat-option>
        </mat-select>
      </mat-form-field>
      
      <div formGroupName="customFields">
        <!-- Custom fields -->
      </div>
      
      <mat-checkbox formControlName="applyToAll">
        Apply to all files
      </mat-checkbox>
      
      <button mat-raised-button color="primary" type="submit"
              [disabled]="updating || !metadataForm.valid">
        Update Metadata
      </button>
      
      <mat-progress-bar *ngIf="updating"
        [mode]="progress.status === 'processing' ? 'determinate' : 'indeterminate'"
        [value]="(progress.processed / progress.total) * 100">
      </mat-progress-bar>
    </form>
  `
})
export class BatchMetadataComponent {
  metadataForm = this.fb.group({
    titlePattern: [''],
    tags: [[] as string[]],
    category: [''],
    customFields: this.fb.group({}),
    applyToAll: [false]
  });

  async updateMetadata() {
    if (!this.metadataForm.valid) return;

    this.updating = true;
    try {
      const result = await this.multiFileService.updateMetadata(
        this.selectedFiles,
        this.metadataForm.value,
        {
          progressCallback: progress => this.progress = progress
        }
      ).toPromise();

      if (result.failed.length > 0) {
        this.showErrors(result.failed);
      } else {
        this.snackBar.open('Metadata updated successfully', 'Close', { duration: 3000 });
      }
    } catch (error) {
      this.snackBar.open('Failed to update metadata', 'Close', { duration: 3000 });
    } finally {
      this.updating = false;
    }
  }
}
```

### 5. Batch Permissions Update (UC-MF-05)
```typescript
@Component({
  selector: 'app-batch-permissions',
  template: `
    <form [formGroup]="permissionsForm" (ngSubmit)="updatePermissions()">
      <div class="role-permissions">
        <h3>Role Permissions</h3>
        <div *ngFor="let role of roles" [formGroupName]="role.value">
          <mat-checkbox [formControlName]="'read'">Read</mat-checkbox>
          <mat-checkbox [formControlName]="'write'">Write</mat-checkbox>
          <mat-checkbox [formControlName]="'delete'">Delete</mat-checkbox>
          <mat-checkbox [formControlName]="'share'">Share</mat-checkbox>
        </div>
      </div>
      
      <div class="user-permissions">
        <h3>User Permissions</h3>
        <mat-form-field>
          <input matInput placeholder="Add User"
                 [matAutocomplete]="auto"
                 [formControl]="userSearch">
        </mat-form-field>
        
        <mat-table [dataSource]="userPermissions">
          <ng-container matColumnDef="user">
            <mat-header-cell *matHeaderCellDef>User</mat-header-cell>
            <mat-cell *matCellDef="let perm">{{perm.user.name}}</mat-cell>
          </ng-container>
          
          <ng-container matColumnDef="permissions">
            <mat-header-cell *matHeaderCellDef>Permissions</mat-header-cell>
            <mat-cell *matCellDef="let perm">
              <mat-checkbox [(ngModel)]="perm.read">Read</mat-checkbox>
              <mat-checkbox [(ngModel)]="perm.write">Write</mat-checkbox>
              <mat-checkbox [(ngModel)]="perm.delete">Delete</mat-checkbox>
              <mat-checkbox [(ngModel)]="perm.share">Share</mat-checkbox>
            </mat-cell>
          </ng-container>
        </mat-table>
      </div>
      
      <mat-checkbox formControlName="recursive">
        Apply to subfolders
      </mat-checkbox>
      
      <mat-checkbox formControlName="notifyUsers">
        Notify affected users
      </mat-checkbox>
      
      <button mat-raised-button color="primary" type="submit"
              [disabled]="updating || !permissionsForm.valid">
        Update Permissions
      </button>
      
      <mat-progress-bar *ngIf="updating"
        [mode]="progress.status === 'processing' ? 'determinate' : 'indeterminate'"
        [value]="(progress.processed / progress.total) * 100">
      </mat-progress-bar>
    </form>
  `
})
export class BatchPermissionsComponent {
  permissionsForm = this.fb.group({
    rolePermissions: this.fb.group({}),
    userPermissions: [[] as UserPermission[]],
    recursive: [false],
    notifyUsers: [true]
  });

  async updatePermissions() {
    if (!this.permissionsForm.valid) return;

    this.updating = true;
    try {
      const result = await this.multiFileService.updatePermissions(
        this.selectedFiles,
        this.permissionsForm.value,
        {
          recursive: this.permissionsForm.get('recursive')?.value,
          notifyUsers: this.permissionsForm.get('notifyUsers')?.value,
          progressCallback: progress => this.progress = progress
        }
      ).toPromise();

      if (result.failed.length > 0) {
        this.showErrors(result.failed);
      } else {
        this.snackBar.open('Permissions updated successfully', 'Close', { duration: 3000 });
      }
    } catch (error) {
      this.snackBar.open('Failed to update permissions', 'Close', { duration: 3000 });
    } finally {
      this.updating = false;
    }
  }
}
```

## Security Implementation

### Batch Operation Authorization
```typescript
@Injectable()
export class BatchAuthorizationService {
  private readonly MAX_BATCH_SIZE = 1000;

  validateBatchOperation(files: FileInfo[], operation: OperationType, user: User): Observable<ValidationResult> {
    if (files.length > this.MAX_BATCH_SIZE) {
      return of({ valid: false, error: 'Batch size exceeds limit' });
    }

    return combineLatest([
      this.checkPermissions(files, operation, user),
      this.checkQuota(files, operation, user),
      this.checkLocks(files)
    ]).pipe(
      map(([permissions, quota, locks]) => ({
        valid: permissions.valid && quota.valid && locks.valid,
        error: permissions.error || quota.error || locks.error
      }))
    );
  }
}
```

### Rollback Management
```typescript
@Injectable()
export class RollbackService {
  private readonly rollbackQueue = new Map<string, RollbackOperation[]>();

  registerRollback(operationId: string, operation: RollbackOperation) {
    const operations = this.rollbackQueue.get(operationId) || [];
    operations.unshift(operation); // Add to start for LIFO order
    this.rollbackQueue.set(operationId, operations);
  }

  async rollback(operationId: string): Promise<void> {
    const operations = this.rollbackQueue.get(operationId);
    if (!operations) return;

    for (const operation of operations) {
      try {
        await this.executeRollback(operation);
      } catch (error) {
        console.error('Rollback failed:', error);
        // Continue with next rollback operation
      }
    }

    this.rollbackQueue.delete(operationId);
  }
}
```

## Performance Optimizations

### Batch Processing
```typescript
@Injectable()
export class BatchProcessingService {
  private readonly CHUNK_SIZE = 50; // Process 50 files at a time

  processBatch<T>(items: T[], processor: (item: T) => Promise<void>): Observable<BatchProgress> {
    return new Observable(subscriber => {
      const chunks = this.chunkArray(items, this.CHUNK_SIZE);
      let processed = 0;

      const processChunk = async (chunk: T[]) => {
        await Promise.all(chunk.map(async item => {
          try {
            await processor(item);
          } finally {
            processed++;
            subscriber.next({
              processed,
              total: items.length,
              status: 'processing'
            });
          }
        }));
      };

      const processChunks = async () => {
        for (const chunk of chunks) {
          await processChunk(chunk);
        }
        subscriber.complete();
      };

      processChunks();
    });
  }
}
```

### Operation Prioritization
```typescript
@Injectable()
export class OperationPriorityService {
  private readonly priorities = new Map<OperationType, number>([
    ['delete', 1],
    ['move', 2],
    ['copy', 3],
    ['metadata', 4],
    ['permissions', 5]
  ]);

  sortOperations(operations: BatchOperation[]): BatchOperation[] {
    return [...operations].sort((a, b) => {
      const priorityA = this.priorities.get(a.type) || 999;
      const priorityB = this.priorities.get(b.type) || 999;
      return priorityA - priorityB;
    });
  }
}
```

## Testing Strategy

### Unit Tests
```typescript
describe('BatchProcessingService', () => {
  let service: BatchProcessingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BatchProcessingService]
    });
    service = TestBed.inject(BatchProcessingService);
  });

  it('should process items in chunks', (done) => {
    const items = Array.from({ length: 100 }, (_, i) => i);
    const processed = new Set<number>();

    service.processBatch(items, async (item) => {
      processed.add(item);
      await new Promise(resolve => setTimeout(resolve, 10));
    }).subscribe({
      next: (progress) => {
        expect(progress.total).toBe(100);
        expect(progress.processed).toBeLessThanOrEqual(100);
      },
      complete: () => {
        expect(processed.size).toBe(100);
        done();
      }
    });
  });
});
```

### Integration Tests
```typescript
describe('BatchMoveComponent', () => {
  let component: BatchMoveComponent;
  let fixture: ComponentFixture<BatchMoveComponent>;
  let multiFileService: jasmine.SpyObj<MultiFileOperationsService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BatchMoveComponent],
      imports: [
        MatProgressBarModule,
        MatSnackBarModule,
        MatTreeModule
      ],
      providers: [
        {
          provide: MultiFileOperationsService,
          useValue: jasmine.createSpyObj('MultiFileOperationsService', ['moveFiles'])
        }
      ]
    }).compileComponents();
  });

  it('should handle move operation', async () => {
    component.selectedFiles = [
      { id: '1', name: 'file1.pdf' },
      { id: '2', name: 'file2.pdf' }
    ];
    component.selectedFolder = 'target';

    const result = {
      successful: [{ fileId: '1' }, { fileId: '2' }],
      failed: [],
      rollbackNeeded: false
    };

    multiFileService.moveFiles.and.returnValue(of(result));

    await component.moveFiles();
    expect(multiFileService.moveFiles).toHaveBeenCalled();
    expect(component.moving).toBeFalse();
  });
});
```

## Technical Constraints
1. Maximum batch size: 1000 files
2. Maximum concurrent operations: 3
3. Chunk size: 50 files
4. Operation timeout: 30 minutes
5. Rollback timeout: 10 minutes
6. Maximum file size in batch: 100MB per file
7. Maximum total batch size: 10GB

## Success Metrics
1. Operation Performance:
   - Small batch (<50 files): <30 seconds
   - Medium batch (50-500): <5 minutes
   - Large batch (500-1000): <15 minutes
2. Reliability:
   - Operation success rate: >99%
   - Rollback success rate: >99.9%
   - Partial success handling: >95%
3. User Experience:
   - Progress updates: Every 500ms
   - UI responsiveness: <100ms
   - Error reporting: Real-time

## Dependencies
1. @angular/material: ^20.0.0
2. @angular/cdk: ^20.0.0
3. uuid: ^9.0.0
4. rxjs: ^7.8.0
5. file-type: ^18.5.0

## Deployment Requirements
1. Node.js version: >=18.0.0
2. Storage service configuration
3. Queue management system
4. Rollback storage
5. Load balancer configuration 