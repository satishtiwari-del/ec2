# File Upload - Technical Use Cases

## Document Metadata
**AIGEN-Cycle UUID**: K9MX-2R
**Document Version**: 1.0
**Angular Version**: 20.0.0
**UI Framework**: Angular Material
**API Status**: Mock API (Development)

## Functional Use Case Reference
- Source Document: `ai/test/doclib/functional-use-cases/document/file-upload/file-upload-func-use-cases.md`
- Use Cases Referenced: UC-FU-01 through UC-FU-05

## Technical Architecture

### Component Structure
```typescript
// File Upload Module
@NgModule({
  declarations: [
    FileUploadComponent,
    DragDropUploadComponent,
    UploadProgressComponent,
    FileMetadataFormComponent,
    VersionUploadComponent
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
    DragDropModule
  ],
  providers: [
    FileUploadService,
    UploadQueueService,
    FileValidationService
  ]
})
export class FileUploadModule { }
```

### Service Layer
```typescript
// File Upload Service Interface
interface IFileUploadService {
  uploadFile(file: File, options: UploadOptions): Observable<UploadResult>;
  uploadMultiple(files: File[], options: UploadOptions): Observable<UploadResult[]>;
  uploadVersion(fileId: string, newVersion: File, notes: string): Observable<VersionInfo>;
  cancelUpload(uploadId: string): void;
  getUploadProgress(uploadId: string): Observable<UploadProgress>;
}

// Data Models
interface UploadOptions {
  targetFolder?: string;
  metadata?: FileMetadata;
  onProgress?: (progress: number) => void;
  autoRename?: boolean;
  createVersion?: boolean;
}

interface UploadResult {
  fileId: string;
  fileName: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  metadata: FileMetadata;
  version?: VersionInfo;
}

interface FileMetadata {
  title?: string;
  description?: string;
  tags: string[];
  category?: string;
  customFields: Record<string, any>;
}
```

### Upload Queue Management
```typescript
@Injectable()
export class UploadQueueService {
  private queue = new Map<string, QueuedUpload>();
  private activeUploads = 0;
  private readonly MAX_CONCURRENT = 5;

  queueUpload(file: File, options: UploadOptions): string {
    const uploadId = this.generateUploadId();
    this.queue.set(uploadId, { file, options, status: 'queued' });
    this.processQueue();
    return uploadId;
  }

  private processQueue() {
    if (this.activeUploads >= this.MAX_CONCURRENT) return;
    
    const nextUpload = Array.from(this.queue.entries())
      .find(([_, upload]) => upload.status === 'queued');
    
    if (nextUpload) {
      const [uploadId, queuedUpload] = nextUpload;
      this.startUpload(uploadId, queuedUpload);
    }
  }
}
```

## Technical Implementation Details

### 1. Single File Upload (UC-FU-01)
```typescript
@Component({
  selector: 'app-file-upload',
  template: `
    <div class="upload-container">
      <input type="file" #fileInput (change)="onFileSelected($event)"
             accept=".pdf,.md,.csv" style="display: none">
      
      <mat-card>
        <mat-card-content>
          <button mat-raised-button color="primary" (click)="fileInput.click()">
            <mat-icon>cloud_upload</mat-icon>
            Select File
          </button>
          
          <div *ngIf="selectedFile" class="file-info">
            <span>{{selectedFile.name}}</span>
            <span>{{selectedFile.size | fileSize}}</span>
          </div>
          
          <mat-progress-bar *ngIf="uploading"
            [mode]="uploadProgress < 100 ? 'determinate' : 'indeterminate'"
            [value]="uploadProgress">
          </mat-progress-bar>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class FileUploadComponent {
  @Input() targetFolder?: string;
  selectedFile: File | null = null;
  uploading = false;
  uploadProgress = 0;

  constructor(
    private uploadService: FileUploadService,
    private snackBar: MatSnackBar
  ) {}

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && this.validateFile(file)) {
      this.selectedFile = file;
    }
  }

  private validateFile(file: File): boolean {
    const validTypes = ['.pdf', '.md', '.csv'];
    const maxSize = 100 * 1024 * 1024; // 100MB
    
    if (!validTypes.some(type => file.name.toLowerCase().endsWith(type))) {
      this.snackBar.open('Invalid file type', 'Close', { duration: 3000 });
      return false;
    }
    
    if (file.size > maxSize) {
      this.snackBar.open('File too large', 'Close', { duration: 3000 });
      return false;
    }
    
    return true;
  }

  uploadFile() {
    if (!this.selectedFile) return;

    this.uploading = true;
    const options: UploadOptions = {
      targetFolder: this.targetFolder,
      onProgress: progress => this.uploadProgress = progress
    };

    this.uploadService.uploadFile(this.selectedFile, options).pipe(
      finalize(() => this.uploading = false)
    ).subscribe({
      next: result => {
        this.snackBar.open('Upload successful', 'Close', { duration: 3000 });
        this.reset();
      },
      error: error => {
        this.snackBar.open('Upload failed', 'Close', { duration: 3000 });
      }
    });
  }
}
```

### 2. Drag-and-Drop Upload (UC-FU-03)
```typescript
@Component({
  selector: 'app-drag-drop-upload',
  template: `
    <div class="drop-zone" 
         cdkDropZone
         (cdkDropListDropped)="onFileDropped($event)"
         [class.drag-over]="dragOver">
      <mat-icon>cloud_upload</mat-icon>
      <span>Drag files here or click to upload</span>
      
      <input type="file" #fileInput (change)="onFileSelected($event)"
             multiple accept=".pdf,.md,.csv" style="display: none">
    </div>
  `
})
export class DragDropUploadComponent {
  @Output() filesSelected = new EventEmitter<File[]>();
  dragOver = false;

  onFileDropped(event: CdkDragDrop<File[]>) {
    event.preventDefault();
    this.dragOver = false;
    
    const files = Array.from(event.item.data);
    const validFiles = files.filter(file => this.validateFile(file));
    
    if (validFiles.length) {
      this.filesSelected.emit(validFiles);
    }
  }
}
```

### 3. Upload with Metadata (UC-FU-04)
```typescript
@Component({
  selector: 'app-file-metadata-form',
  template: `
    <form [formGroup]="metadataForm">
      <mat-form-field>
        <input matInput placeholder="Title" formControlName="title">
      </mat-form-field>
      
      <mat-form-field>
        <mat-chip-list #chipList>
          <mat-chip *ngFor="let tag of tags" [removable]="true"
                   (removed)="removeTag(tag)">
            {{tag}}
          </mat-chip>
          <input placeholder="Tags" [matChipInputFor]="chipList"
                 (matChipInputTokenEnd)="addTag($event)">
        </mat-chip-list>
      </mat-form-field>
      
      <mat-form-field>
        <textarea matInput placeholder="Description" 
                  formControlName="description">
        </textarea>
      </mat-form-field>
    </form>
  `
})
export class FileMetadataFormComponent {
  metadataForm = this.fb.group({
    title: [''],
    description: [''],
    tags: [[] as string[]],
    category: [''],
    customFields: this.fb.group({})
  });

  constructor(private fb: FormBuilder) {}

  addTag(event: MatChipInputEvent) {
    const value = (event.value || '').trim();
    if (value) {
      const currentTags = this.metadataForm.get('tags')?.value || [];
      this.metadataForm.patchValue({
        tags: [...currentTags, value]
      });
    }
    event.chipInput!.clear();
  }
}
```

### 4. Version Upload (UC-FU-05)
```typescript
@Component({
  selector: 'app-version-upload',
  template: `
    <mat-dialog-content>
      <h2>Upload New Version</h2>
      
      <div class="version-info">
        <p>Current Version: {{currentVersion}}</p>
        <p>File: {{fileName}}</p>
      </div>
      
      <form [formGroup]="versionForm">
        <mat-form-field>
          <textarea matInput placeholder="Version Notes" 
                    formControlName="notes" required>
          </textarea>
        </mat-form-field>
        
        <input type="file" #fileInput (change)="onFileSelected($event)"
               [accept]="acceptedTypes" style="display: none">
        
        <button mat-raised-button color="primary" (click)="fileInput.click()">
          Select File
        </button>
      </form>
    </mat-dialog-content>
  `
})
export class VersionUploadComponent {
  @Input() fileId!: string;
  @Input() currentVersion!: string;
  @Input() fileName!: string;
  @Input() acceptedTypes!: string;

  versionForm = this.fb.group({
    notes: ['', Validators.required]
  });

  uploadVersion() {
    if (!this.selectedFile || !this.versionForm.valid) return;

    this.uploadService.uploadVersion(
      this.fileId,
      this.selectedFile,
      this.versionForm.get('notes')?.value
    ).subscribe({
      next: version => {
        this.dialogRef.close(version);
      },
      error: error => {
        this.snackBar.open('Version upload failed', 'Close', { duration: 3000 });
      }
    });
  }
}
```

## Security Implementation

### File Validation
```typescript
@Injectable()
export class FileValidationService {
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly ALLOWED_TYPES = [
    'application/pdf',
    'text/markdown',
    'text/csv'
  ];

  validateFile(file: File): ValidationResult {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: 'Invalid file type' };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: 'File too large' };
    }

    return { valid: true };
  }

  sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  }
}
```

### Virus Scanning
```typescript
@Injectable()
export class VirusScanService {
  scanFile(file: File): Observable<ScanResult> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<ScanResult>('/api/virus-scan', formData).pipe(
      timeout(30000), // 30 second timeout
      catchError(error => {
        if (error instanceof TimeoutError) {
          return throwError(() => new Error('Virus scan timeout'));
        }
        return throwError(() => error);
      })
    );
  }
}
```

## Performance Optimizations

### Chunk Upload
```typescript
@Injectable()
export class ChunkUploadService {
  private readonly CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

  uploadLargeFile(file: File): Observable<UploadResult> {
    const chunks = Math.ceil(file.size / this.CHUNK_SIZE);
    const uploadId = uuid();

    return this.initializeUpload(uploadId, file).pipe(
      switchMap(() => {
        const chunkUploads = Array.from({ length: chunks }, (_, i) => {
          const start = i * this.CHUNK_SIZE;
          const end = Math.min(start + this.CHUNK_SIZE, file.size);
          const chunk = file.slice(start, end);
          return this.uploadChunk(uploadId, chunk, i, chunks);
        });
        return forkJoin(chunkUploads);
      }),
      switchMap(() => this.finalizeUpload(uploadId))
    );
  }
}
```

### Upload Queue
```typescript
@Injectable()
export class UploadQueueService {
  private readonly MAX_CONCURRENT = 3;
  private readonly queue = new BehaviorSubject<QueuedUpload[]>([]);
  private processing = false;

  enqueue(files: File[]): void {
    const current = this.queue.value;
    const newUploads = files.map(file => ({
      file,
      status: 'pending' as const,
      progress: 0
    }));
    this.queue.next([...current, ...newUploads]);
    this.processQueue();
  }

  private processQueue(): void {
    if (this.processing) return;
    this.processing = true;

    const active = this.queue.value.filter(u => u.status === 'uploading');
    const pending = this.queue.value.filter(u => u.status === 'pending');

    while (active.length < this.MAX_CONCURRENT && pending.length > 0) {
      const next = pending.shift()!;
      this.startUpload(next);
    }

    this.processing = false;
  }
}
```

## Testing Strategy

### Unit Tests
```typescript
describe('FileUploadService', () => {
  let service: FileUploadService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FileUploadService]
    });
    service = TestBed.inject(FileUploadService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should upload file successfully', (done) => {
    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const mockResult = { fileId: '123', fileName: 'test.pdf' };

    service.uploadFile(mockFile, {}).subscribe(result => {
      expect(result).toEqual(mockResult);
      done();
    });

    const req = httpMock.expectOne('/api/upload');
    expect(req.request.method).toBe('POST');
    req.flush(mockResult);
  });
});
```

### Integration Tests
```typescript
describe('FileUploadComponent', () => {
  let component: FileUploadComponent;
  let fixture: ComponentFixture<FileUploadComponent>;
  let uploadService: jasmine.SpyObj<FileUploadService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FileUploadComponent],
      imports: [
        MatProgressBarModule,
        MatSnackBarModule
      ],
      providers: [
        {
          provide: FileUploadService,
          useValue: jasmine.createSpyObj('FileUploadService', ['uploadFile'])
        }
      ]
    }).compileComponents();
  });

  it('should validate file type', () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    component.onFileSelected({ target: { files: [file] } } as any);
    expect(component.selectedFile).toBeNull();
  });
});
```

## Technical Constraints
1. Maximum file size: 100MB per file
2. Supported formats: PDF, MD, CSV
3. Maximum concurrent uploads: 3
4. Chunk size: 10MB
5. Upload timeout: 30 minutes
6. Virus scan timeout: 30 seconds
7. Maximum files in batch: 100

## Success Metrics
1. Upload Performance:
   - Small files (<10MB): <5 seconds
   - Medium files (10-50MB): <30 seconds
   - Large files (50-100MB): <2 minutes
2. Reliability:
   - Upload success rate: >99%
   - Chunk upload success: >99.9%
   - Version conflict rate: <0.1%
3. User Experience:
   - Progress updates: Every 250ms
   - UI responsiveness: <100ms
   - Queue status updates: Real-time

## Dependencies
1. @angular/material: ^20.0.0
2. @angular/cdk: ^20.0.0
3. @types/file-saver: ^2.0.5
4. uuid: ^9.0.0
5. buffer: ^6.0.3

## Deployment Requirements
1. Node.js version: >=18.0.0
2. Storage service configuration
3. Virus scanning service
4. CDN configuration for uploads
5. Load balancer settings for large files 