# File Download - Technical Use Cases

## Document Metadata
**AIGEN-Cycle UUID**: K9MX-2R
**Document Version**: 1.0
**Angular Version**: 20.0.0
**UI Framework**: Angular Material
**API Status**: Mock API (Development)

## Functional Use Case Reference
- Source Document: `ai/test/doclib/functional-use-cases/document/file-download/file-download-func-use-cases.md`
- Use Cases Referenced: UC-FD-01 through UC-FD-05

## Technical Architecture

### Component Structure
```typescript
// File Download Module
@NgModule({
  declarations: [
    FileDownloadComponent,
    BatchDownloadComponent,
    DownloadProgressComponent,
    FormatConverterComponent,
    VersionSelectorComponent
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
    MatSelectModule
  ],
  providers: [
    FileDownloadService,
    DownloadQueueService,
    FormatConverterService
  ]
})
export class FileDownloadModule { }
```

### Service Layer
```typescript
// File Download Service Interface
interface IFileDownloadService {
  downloadFile(fileId: string, options: DownloadOptions): Observable<Blob>;
  downloadMultiple(fileIds: string[], options: BatchDownloadOptions): Observable<Blob>;
  downloadFolder(folderId: string, options: FolderDownloadOptions): Observable<Blob>;
  getVersion(fileId: string, version: string): Observable<VersionInfo>;
  convertFormat(fileId: string, targetFormat: string): Observable<Blob>;
}

// Data Models
interface DownloadOptions {
  version?: string;
  targetFormat?: string;
  includeMetadata?: boolean;
  onProgress?: (progress: number) => void;
}

interface BatchDownloadOptions extends DownloadOptions {
  compressionType?: 'zip' | 'tar';
  preserveFolderStructure?: boolean;
}

interface FolderDownloadOptions extends BatchDownloadOptions {
  recursive?: boolean;
  includeEmptyFolders?: boolean;
}

interface VersionInfo {
  version: string;
  timestamp: Date;
  size: number;
  author: string;
  notes?: string;
}
```

### Download Queue Management
```typescript
@Injectable()
export class DownloadQueueService {
  private queue = new Map<string, QueuedDownload>();
  private activeDownloads = 0;
  private readonly MAX_CONCURRENT = 3;

  queueDownload(fileId: string, options: DownloadOptions): string {
    const downloadId = this.generateDownloadId();
    this.queue.set(downloadId, { fileId, options, status: 'queued' });
    this.processQueue();
    return downloadId;
  }

  private processQueue() {
    if (this.activeDownloads >= this.MAX_CONCURRENT) return;
    
    const nextDownload = Array.from(this.queue.entries())
      .find(([_, download]) => download.status === 'queued');
    
    if (nextDownload) {
      const [downloadId, queuedDownload] = nextDownload;
      this.startDownload(downloadId, queuedDownload);
    }
  }
}
```

## Technical Implementation Details

### 1. Single File Download (UC-FD-01)
```typescript
@Component({
  selector: 'app-file-download',
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>{{fileName}}</mat-card-title>
        <mat-card-subtitle>{{fileSize | fileSize}}</mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <mat-progress-bar *ngIf="downloading"
          [mode]="downloadProgress < 100 ? 'determinate' : 'indeterminate'"
          [value]="downloadProgress">
        </mat-progress-bar>
      </mat-card-content>
      
      <mat-card-actions>
        <button mat-raised-button color="primary" 
                (click)="downloadFile()" 
                [disabled]="downloading">
          <mat-icon>cloud_download</mat-icon>
          Download
        </button>
      </mat-card-actions>
    </mat-card>
  `
})
export class FileDownloadComponent {
  @Input() fileId!: string;
  @Input() fileName!: string;
  @Input() fileSize!: number;
  
  downloading = false;
  downloadProgress = 0;

  constructor(
    private downloadService: FileDownloadService,
    private snackBar: MatSnackBar
  ) {}

  downloadFile() {
    this.downloading = true;
    const options: DownloadOptions = {
      onProgress: progress => this.downloadProgress = progress
    };

    this.downloadService.downloadFile(this.fileId, options).pipe(
      finalize(() => this.downloading = false)
    ).subscribe({
      next: blob => {
        this.saveFile(blob, this.fileName);
        this.snackBar.open('Download successful', 'Close', { duration: 3000 });
      },
      error: error => {
        this.snackBar.open('Download failed', 'Close', { duration: 3000 });
      }
    });
  }

  private saveFile(blob: Blob, fileName: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
```

### 2. Batch Download (UC-FD-02)
```typescript
@Component({
  selector: 'app-batch-download',
  template: `
    <div class="batch-download">
      <mat-form-field>
        <mat-select [(ngModel)]="compressionType">
          <mat-option value="zip">ZIP Archive</mat-option>
          <mat-option value="tar">TAR Archive</mat-option>
        </mat-select>
      </mat-form-field>
      
      <mat-checkbox [(ngModel)]="preserveStructure">
        Preserve folder structure
      </mat-checkbox>
      
      <div class="selected-files">
        <mat-list>
          <mat-list-item *ngFor="let file of selectedFiles">
            {{file.name}}
            <button mat-icon-button (click)="removeFile(file)">
              <mat-icon>remove</mat-icon>
            </button>
          </mat-list-item>
        </mat-list>
      </div>
      
      <button mat-raised-button color="primary"
              [disabled]="!selectedFiles.length || downloading"
              (click)="downloadSelected()">
        Download {{selectedFiles.length}} Files
      </button>
      
      <mat-progress-bar *ngIf="downloading"
        [value]="downloadProgress">
      </mat-progress-bar>
    </div>
  `
})
export class BatchDownloadComponent {
  @Input() selectedFiles: FileInfo[] = [];
  compressionType: 'zip' | 'tar' = 'zip';
  preserveStructure = true;
  downloading = false;
  downloadProgress = 0;

  downloadSelected() {
    const options: BatchDownloadOptions = {
      compressionType: this.compressionType,
      preserveFolderStructure: this.preserveStructure,
      onProgress: progress => this.downloadProgress = progress
    };

    const fileIds = this.selectedFiles.map(f => f.id);
    this.downloading = true;

    this.downloadService.downloadMultiple(fileIds, options).pipe(
      finalize(() => this.downloading = false)
    ).subscribe({
      next: blob => {
        const fileName = `download_${new Date().getTime()}.${this.compressionType}`;
        this.saveFile(blob, fileName);
      },
      error: error => {
        this.snackBar.open('Batch download failed', 'Close', { duration: 3000 });
      }
    });
  }
}
```

### 3. Format Conversion (UC-FD-03)
```typescript
@Injectable()
export class FormatConverterService {
  private readonly SUPPORTED_CONVERSIONS = new Map<string, string[]>([
    ['pdf', ['txt', 'docx']],
    ['md', ['pdf', 'html']],
    ['csv', ['xlsx', 'json']]
  ]);

  canConvert(sourceFormat: string, targetFormat: string): boolean {
    return this.SUPPORTED_CONVERSIONS.get(sourceFormat)?.includes(targetFormat) ?? false;
  }

  convertFormat(file: File, targetFormat: string): Observable<Blob> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('targetFormat', targetFormat);

    return this.http.post<Blob>('/api/convert', formData, {
      responseType: 'blob' as 'json'
    }).pipe(
      timeout(300000), // 5 minutes timeout
      catchError(error => {
        if (error instanceof TimeoutError) {
          return throwError(() => new Error('Conversion timeout'));
        }
        return throwError(() => error);
      })
    );
  }
}
```

### 4. Version Download (UC-FD-04)
```typescript
@Component({
  selector: 'app-version-selector',
  template: `
    <mat-dialog-content>
      <h2>Select Version</h2>
      
      <mat-form-field>
        <mat-select [(ngModel)]="selectedVersion">
          <mat-option *ngFor="let version of versions$ | async"
                     [value]="version.version">
            {{version.version}} - {{version.timestamp | date}}
            ({{version.size | fileSize}})
          </mat-option>
        </mat-select>
      </mat-form-field>
      
      <div *ngIf="selectedVersion" class="version-info">
        <p>Author: {{(getVersionInfo(selectedVersion) | async)?.author}}</p>
        <p>Notes: {{(getVersionInfo(selectedVersion) | async)?.notes}}</p>
      </div>
    </mat-dialog-content>
  `
})
export class VersionSelectorComponent {
  @Input() fileId!: string;
  versions$: Observable<VersionInfo[]>;
  selectedVersion: string;

  constructor(private downloadService: FileDownloadService) {
    this.versions$ = this.downloadService.getVersions(this.fileId);
  }

  getVersionInfo(version: string): Observable<VersionInfo> {
    return this.downloadService.getVersion(this.fileId, version);
  }

  downloadVersion() {
    if (!this.selectedVersion) return;

    const options: DownloadOptions = {
      version: this.selectedVersion
    };

    this.downloadService.downloadFile(this.fileId, options).subscribe({
      next: blob => {
        // Handle successful download
      },
      error: error => {
        this.snackBar.open('Version download failed', 'Close', { duration: 3000 });
      }
    });
  }
}
```

## Security Implementation

### Download Authorization
```typescript
@Injectable()
export class DownloadAuthorizationService {
  private readonly MAX_BATCH_SIZE = 1000; // Maximum files in batch download
  private readonly MAX_FOLDER_SIZE = 10 * 1024 * 1024 * 1024; // 10GB

  validateDownloadRequest(request: DownloadRequest): Observable<ValidationResult> {
    return this.authService.getCurrentUser().pipe(
      switchMap(user => {
        if (!user) {
          return throwError(() => new Error('Unauthorized'));
        }

        return this.validatePermissions(user, request);
      })
    );
  }

  private validatePermissions(user: User, request: DownloadRequest): Observable<ValidationResult> {
    // Implement permission validation logic
    return of({ valid: true });
  }
}
```

### Rate Limiting
```typescript
@Injectable()
export class DownloadRateLimiter {
  private readonly userDownloads = new Map<string, number>();
  private readonly RATE_LIMIT = 100; // downloads per minute
  private readonly WINDOW_MS = 60000; // 1 minute

  canDownload(userId: string): boolean {
    const now = Date.now();
    const userRate = this.userDownloads.get(userId) || 0;
    
    if (userRate >= this.RATE_LIMIT) {
      return false;
    }

    this.userDownloads.set(userId, userRate + 1);
    setTimeout(() => {
      const current = this.userDownloads.get(userId) || 0;
      this.userDownloads.set(userId, current - 1);
    }, this.WINDOW_MS);

    return true;
  }
}
```

## Performance Optimizations

### Chunked Download
```typescript
@Injectable()
export class ChunkDownloadService {
  private readonly CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

  downloadLargeFile(fileId: string): Observable<Blob> {
    return this.getFileSize(fileId).pipe(
      switchMap(size => {
        const chunks = Math.ceil(size / this.CHUNK_SIZE);
        const chunkDownloads = Array.from({ length: chunks }, (_, i) => {
          const start = i * this.CHUNK_SIZE;
          const end = Math.min(start + this.CHUNK_SIZE, size);
          return this.downloadChunk(fileId, start, end);
        });
        return forkJoin(chunkDownloads);
      }),
      map(chunks => new Blob(chunks))
    );
  }

  private downloadChunk(fileId: string, start: number, end: number): Observable<Blob> {
    return this.http.get(`/api/download/${fileId}`, {
      headers: {
        Range: `bytes=${start}-${end}`
      },
      responseType: 'blob'
    });
  }
}
```

### Download Resume
```typescript
@Injectable()
export class DownloadResumeService {
  private readonly resumeTokens = new Map<string, ResumeToken>();

  generateResumeToken(downloadId: string, progress: number): string {
    const token = uuid();
    this.resumeTokens.set(token, {
      downloadId,
      progress,
      timestamp: Date.now()
    });
    return token;
  }

  resumeDownload(token: string): Observable<DownloadResult> {
    const resumeInfo = this.resumeTokens.get(token);
    if (!resumeInfo || this.isExpired(resumeInfo)) {
      return throwError(() => new Error('Invalid or expired resume token'));
    }

    return this.downloadService.downloadFile(resumeInfo.downloadId, {
      startByte: resumeInfo.progress
    });
  }

  private isExpired(info: ResumeToken): boolean {
    const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
    return Date.now() - info.timestamp > EXPIRY_MS;
  }
}
```

## Testing Strategy

### Unit Tests
```typescript
describe('FileDownloadService', () => {
  let service: FileDownloadService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FileDownloadService]
    });
    service = TestBed.inject(FileDownloadService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should download file successfully', (done) => {
    const mockBlob = new Blob(['test'], { type: 'text/plain' });
    
    service.downloadFile('123', {}).subscribe(blob => {
      expect(blob).toBeTruthy();
      expect(blob.size).toBe(mockBlob.size);
      done();
    });

    const req = httpMock.expectOne('/api/download/123');
    expect(req.request.method).toBe('GET');
    req.flush(mockBlob);
  });
});
```

### Integration Tests
```typescript
describe('BatchDownloadComponent', () => {
  let component: BatchDownloadComponent;
  let fixture: ComponentFixture<BatchDownloadComponent>;
  let downloadService: jasmine.SpyObj<FileDownloadService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BatchDownloadComponent],
      imports: [
        MatProgressBarModule,
        MatSnackBarModule,
        MatSelectModule
      ],
      providers: [
        {
          provide: FileDownloadService,
          useValue: jasmine.createSpyObj('FileDownloadService', ['downloadMultiple'])
        }
      ]
    }).compileComponents();
  });

  it('should handle batch download', () => {
    component.selectedFiles = [
      { id: '1', name: 'file1.pdf', size: 1024 },
      { id: '2', name: 'file2.pdf', size: 2048 }
    ];
    component.downloadSelected();
    expect(downloadService.downloadMultiple).toHaveBeenCalled();
  });
});
```

## Technical Constraints
1. Maximum file size: 2GB per file
2. Maximum batch size: 1000 files
3. Maximum folder size: 10GB
4. Chunk size: 10MB
5. Download timeout: 30 minutes
6. Resume token validity: 24 hours
7. Maximum concurrent downloads: 3

## Success Metrics
1. Download Performance:
   - Small files (<10MB): <3 seconds
   - Medium files (10-100MB): <30 seconds
   - Large files (>100MB): <2 minutes per GB
2. Reliability:
   - Download success rate: >99.5%
   - Resume success rate: >95%
   - Conversion success rate: >98%
3. User Experience:
   - Progress updates: Every 250ms
   - UI responsiveness: <100ms
   - Queue status updates: Real-time

## Dependencies
1. @angular/material: ^20.0.0
2. @angular/cdk: ^20.0.0
3. file-saver: ^2.0.5
4. jszip: ^3.10.1
5. uuid: ^9.0.0

## Deployment Requirements
1. Node.js version: >=18.0.0
2. Storage service configuration
3. CDN configuration for downloads
4. Load balancer settings for large files
5. Compression service for batch downloads 