# File Preview - Technical Use Cases

## Document Metadata
**AIGEN-Cycle UUID**: K9MX-2R
**Document Version**: 1.0
**Angular Version**: 20.0.0
**UI Framework**: Angular Material
**API Status**: Mock API (Development)

## Functional Use Case Reference
- Source Document: `ai/test/doclib/functional-use-cases/document/file-preview/file-preview-func-use-cases.md`
- Use Cases Referenced: UC-FP-01 through UC-FP-05

## Technical Architecture

### Component Structure
```typescript
// File Preview Module
@NgModule({
  declarations: [
    FilePreviewComponent,
    QuickPreviewComponent,
    FullScreenPreviewComponent,
    PreviewToolbarComponent,
    PreviewNavigationComponent,
    PreviewSearchComponent,
    AnnotationComponent,
    WatermarkComponent
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
    MatToolbarModule,
    MatSidenavModule,
    PdfViewerModule,
    MarkdownModule,
    CsvViewerModule
  ],
  providers: [
    FilePreviewService,
    PreviewCacheService,
    AnnotationService,
    WatermarkService
  ]
})
export class FilePreviewModule { }
```

### Service Layer
```typescript
// File Preview Service Interface
interface IFilePreviewService {
  getPreview(fileId: string, options: PreviewOptions): Observable<PreviewResult>;
  getAnnotations(fileId: string): Observable<Annotation[]>;
  addAnnotation(fileId: string, annotation: Annotation): Observable<Annotation>;
  searchContent(fileId: string, query: string): Observable<SearchResult[]>;
  generateThumbnail(fileId: string, size: ThumbnailSize): Observable<Blob>;
}

// Data Models
interface PreviewOptions {
  quality?: 'low' | 'medium' | 'high';
  page?: number;
  zoom?: number;
  watermark?: WatermarkOptions;
  annotations?: boolean;
  cacheKey?: string;
}

interface PreviewResult {
  content: Blob;
  metadata: PreviewMetadata;
  pages?: number;
  searchable?: boolean;
  annotatable?: boolean;
}

interface PreviewMetadata {
  fileId: string;
  version: string;
  mimeType: string;
  size: number;
  lastModified: Date;
  previewType: PreviewType;
}

interface Annotation {
  id: string;
  fileId: string;
  page: number;
  type: AnnotationType;
  content: string;
  position: Position;
  author: string;
  timestamp: Date;
  replies?: Annotation[];
}

interface WatermarkOptions {
  text: string;
  position: 'center' | 'diagonal' | 'tile';
  opacity: number;
  fontSize: number;
  color: string;
}
```

### Preview Type Management
```typescript
@Injectable()
export class PreviewTypeService {
  private readonly PREVIEW_HANDLERS = new Map<string, PreviewHandler>([
    ['application/pdf', {
      component: PdfPreviewComponent,
      options: { searchable: true, annotatable: true }
    }],
    ['text/markdown', {
      component: MarkdownPreviewComponent,
      options: { searchable: true, annotatable: true }
    }],
    ['text/csv', {
      component: CsvPreviewComponent,
      options: { searchable: true, annotatable: false }
    }]
  ]);

  getPreviewHandler(mimeType: string): PreviewHandler | null {
    return this.PREVIEW_HANDLERS.get(mimeType) || null;
  }

  isPreviewSupported(mimeType: string): boolean {
    return this.PREVIEW_HANDLERS.has(mimeType);
  }
}
```

## Technical Implementation Details

### 1. Quick Preview (UC-FP-01)
```typescript
@Component({
  selector: 'app-quick-preview',
  template: `
    <mat-card class="preview-card">
      <mat-card-header>
        <mat-card-title>{{fileName}}</mat-card-title>
        <mat-card-subtitle>{{fileSize | fileSize}}</mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <div class="preview-container" [ngSwitch]="previewType">
          <pdf-viewer *ngSwitchCase="'pdf'"
            [src]="previewUrl"
            [zoom]="1"
            [original-size]="false"
            [show-all]="false"
            [page]="1">
          </pdf-viewer>
          
          <markdown-viewer *ngSwitchCase="'markdown'"
            [content]="content">
          </markdown-viewer>
          
          <csv-viewer *ngSwitchCase="'csv'"
            [data]="content"
            [pageSize]="10">
          </csv-viewer>
          
          <div *ngSwitchDefault class="unsupported">
            Preview not available
          </div>
        </div>
        
        <mat-progress-bar *ngIf="loading"
          mode="indeterminate">
        </mat-progress-bar>
      </mat-card-content>
      
      <mat-card-actions>
        <button mat-button (click)="openFullScreen()">
          <mat-icon>fullscreen</mat-icon>
          Full Screen
        </button>
        <button mat-button (click)="downloadFile()">
          <mat-icon>download</mat-icon>
          Download
        </button>
      </mat-card-actions>
    </mat-card>
  `
})
export class QuickPreviewComponent implements OnInit {
  @Input() fileId!: string;
  @Input() fileName!: string;
  @Input() fileSize!: number;
  
  previewType: PreviewType = 'none';
  previewUrl: string | null = null;
  content: any = null;
  loading = false;

  constructor(
    private previewService: FilePreviewService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit() {
    this.loading = true;
    try {
      const preview = await this.previewService.getPreview(this.fileId, {
        quality: 'medium',
        page: 1
      }).toPromise();

      this.previewType = preview.metadata.previewType;
      if (preview.content instanceof Blob) {
        this.previewUrl = URL.createObjectURL(preview.content);
      } else {
        this.content = preview.content;
      }
    } catch (error) {
      this.snackBar.open('Failed to load preview', 'Close', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  openFullScreen() {
    this.dialog.open(FullScreenPreviewComponent, {
      data: { fileId: this.fileId },
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh'
    });
  }
}
```

### 2. Full-Screen Preview (UC-FP-02)
```typescript
@Component({
  selector: 'app-full-screen-preview',
  template: `
    <mat-toolbar class="preview-toolbar">
      <button mat-icon-button (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
      
      <span class="file-info">
        {{fileName}} (Page {{currentPage}} of {{totalPages}})
      </span>
      
      <div class="toolbar-actions">
        <button mat-icon-button (click)="zoomIn()">
          <mat-icon>zoom_in</mat-icon>
        </button>
        <button mat-icon-button (click)="zoomOut()">
          <mat-icon>zoom_out</mat-icon>
        </button>
        <button mat-icon-button (click)="toggleAnnotations()">
          <mat-icon>comment</mat-icon>
        </button>
        <button mat-icon-button (click)="print()">
          <mat-icon>print</mat-icon>
        </button>
      </div>
    </mat-toolbar>
    
    <mat-sidenav-container class="preview-container">
      <mat-sidenav #annotationPanel position="end" mode="side">
        <app-annotation-list
          [fileId]="fileId"
          [page]="currentPage"
          (annotationAdded)="refreshAnnotations()">
        </app-annotation-list>
      </mat-sidenav>
      
      <mat-sidenav-content>
        <div class="preview-content" [ngSwitch]="previewType">
          <pdf-viewer *ngSwitchCase="'pdf'"
            [src]="previewUrl"
            [zoom]="zoom"
            [original-size]="true"
            [show-all]="true"
            [(page)]="currentPage"
            (pageChange)="onPageChange($event)">
          </pdf-viewer>
          
          <!-- Similar viewers for other types -->
        </div>
        
        <div class="page-navigation" *ngIf="totalPages > 1">
          <button mat-icon-button (click)="previousPage()"
                  [disabled]="currentPage === 1">
            <mat-icon>navigate_before</mat-icon>
          </button>
          
          <mat-form-field>
            <input matInput type="number" [(ngModel)]="currentPage"
                   min="1" [max]="totalPages">
            <span matSuffix>/ {{totalPages}}</span>
          </mat-form-field>
          
          <button mat-icon-button (click)="nextPage()"
                  [disabled]="currentPage === totalPages">
            <mat-icon>navigate_next</mat-icon>
          </button>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `
})
export class FullScreenPreviewComponent {
  zoom = 1;
  currentPage = 1;
  totalPages = 1;
  
  private readonly ZOOM_STEP = 0.25;
  private readonly MAX_ZOOM = 3;
  private readonly MIN_ZOOM = 0.5;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { fileId: string },
    private previewService: FilePreviewService,
    private dialogRef: MatDialogRef<FullScreenPreviewComponent>
  ) {}

  zoomIn() {
    if (this.zoom < this.MAX_ZOOM) {
      this.zoom += this.ZOOM_STEP;
    }
  }

  zoomOut() {
    if (this.zoom > this.MIN_ZOOM) {
      this.zoom -= this.ZOOM_STEP;
    }
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadAnnotations();
  }

  async print() {
    try {
      const printPreview = await this.previewService.getPreview(
        this.data.fileId,
        { quality: 'high' }
      ).toPromise();
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Preview</title>
              <style>
                @media print {
                  body { margin: 0; }
                  img { max-width: 100%; }
                }
              </style>
            </head>
            <body>
              <img src="${URL.createObjectURL(printPreview.content)}">
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      this.snackBar.open('Failed to generate print preview', 'Close', { duration: 3000 });
    }
  }
}
```

### 3. Content Search (UC-FP-03)
```typescript
@Component({
  selector: 'app-preview-search',
  template: `
    <div class="search-container">
      <mat-form-field>
        <input matInput placeholder="Search in document"
               [formControl]="searchControl"
               (keyup.enter)="search()">
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>
      
      <div class="search-results" *ngIf="results.length > 0">
        <mat-list>
          <mat-list-item *ngFor="let result of results"
                        (click)="navigateToResult(result)">
            <span class="page-number">Page {{result.page}}</span>
            <p class="result-context" [innerHTML]="result.context"></p>
          </mat-list-item>
        </mat-list>
        
        <div class="result-navigation">
          <button mat-icon-button (click)="previousResult()"
                  [disabled]="currentResultIndex === 0">
            <mat-icon>keyboard_arrow_up</mat-icon>
          </button>
          <span>{{currentResultIndex + 1}} of {{results.length}}</span>
          <button mat-icon-button (click)="nextResult()"
                  [disabled]="currentResultIndex === results.length - 1">
            <mat-icon>keyboard_arrow_down</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `
})
export class PreviewSearchComponent {
  @Input() fileId!: string;
  searchControl = new FormControl('');
  results: SearchResult[] = [];
  currentResultIndex = -1;

  constructor(private previewService: FilePreviewService) {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(query => query && query.length >= 2)
    ).subscribe(() => this.search());
  }

  async search() {
    const query = this.searchControl.value;
    if (!query) return;

    try {
      this.results = await this.previewService.searchContent(
        this.fileId,
        query
      ).toPromise();
      
      this.currentResultIndex = this.results.length > 0 ? 0 : -1;
      if (this.currentResultIndex >= 0) {
        this.navigateToResult(this.results[0]);
      }
    } catch (error) {
      this.snackBar.open('Search failed', 'Close', { duration: 3000 });
    }
  }

  navigateToResult(result: SearchResult) {
    this.previewService.navigateToPage(result.page);
    this.previewService.highlightText(result.position);
  }
}
```

### 4. Annotation Support (UC-FP-04)
```typescript
@Component({
  selector: 'app-annotation',
  template: `
    <div class="annotation-container">
      <div class="annotation-list">
        <mat-card *ngFor="let annotation of annotations"
                  [class.selected]="selectedAnnotation?.id === annotation.id">
          <mat-card-header>
            <mat-card-title>{{annotation.author}}</mat-card-title>
            <mat-card-subtitle>
              {{annotation.timestamp | date:'medium'}}
            </mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <p>{{annotation.content}}</p>
            
            <div class="replies" *ngIf="annotation.replies?.length">
              <mat-divider></mat-divider>
              <div *ngFor="let reply of annotation.replies"
                   class="reply">
                <strong>{{reply.author}}</strong>
                <p>{{reply.content}}</p>
              </div>
            </div>
          </mat-card-content>
          
          <mat-card-actions>
            <button mat-button (click)="replyTo(annotation)">
              Reply
            </button>
            <button mat-button (click)="editAnnotation(annotation)"
                    *ngIf="canEdit(annotation)">
              Edit
            </button>
            <button mat-button (click)="deleteAnnotation(annotation)"
                    *ngIf="canDelete(annotation)">
              Delete
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
      
      <div class="annotation-form" *ngIf="showForm">
        <mat-form-field>
          <textarea matInput placeholder="Add annotation"
                    [(ngModel)]="newAnnotation.content">
          </textarea>
        </mat-form-field>
        
        <div class="form-actions">
          <button mat-button (click)="cancelAnnotation()">
            Cancel
          </button>
          <button mat-raised-button color="primary"
                  (click)="saveAnnotation()">
            Save
          </button>
        </div>
      </div>
    </div>
  `
})
export class AnnotationComponent {
  @Input() fileId!: string;
  @Input() page!: number;
  
  annotations: Annotation[] = [];
  selectedAnnotation: Annotation | null = null;
  showForm = false;
  newAnnotation: Partial<Annotation> = {};

  constructor(
    private annotationService: AnnotationService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    this.loadAnnotations();
  }

  async loadAnnotations() {
    try {
      this.annotations = await this.annotationService.getAnnotations(
        this.fileId,
        this.page
      ).toPromise();
    } catch (error) {
      this.snackBar.open('Failed to load annotations', 'Close', { duration: 3000 });
    }
  }

  async saveAnnotation() {
    if (!this.newAnnotation.content) return;

    try {
      const annotation = await this.annotationService.addAnnotation(
        this.fileId,
        {
          ...this.newAnnotation,
          page: this.page,
          timestamp: new Date()
        }
      ).toPromise();

      this.annotations.push(annotation);
      this.resetForm();
    } catch (error) {
      this.snackBar.open('Failed to save annotation', 'Close', { duration: 3000 });
    }
  }

  canEdit(annotation: Annotation): boolean {
    return this.authService.currentUser?.id === annotation.author;
  }

  canDelete(annotation: Annotation): boolean {
    const user = this.authService.currentUser;
    return user?.id === annotation.author || user?.role === 'admin';
  }
}
```

### 5. Watermark Management (UC-FP-05)
```typescript
@Injectable()
export class WatermarkService {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  applyWatermark(content: Blob, options: WatermarkOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        
        this.ctx.drawImage(img, 0, 0);
        this.ctx.globalAlpha = options.opacity;
        this.ctx.font = `${options.fontSize}px Arial`;
        this.ctx.fillStyle = options.color;
        
        switch (options.position) {
          case 'center':
            this.drawCenterWatermark(options.text);
            break;
          case 'diagonal':
            this.drawDiagonalWatermark(options.text);
            break;
          case 'tile':
            this.drawTiledWatermark(options.text);
            break;
        }
        
        this.canvas.toBlob(blob => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to generate watermarked image'));
          }
        });
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(content);
    });
  }

  private drawCenterWatermark(text: string) {
    const x = this.canvas.width / 2;
    const y = this.canvas.height / 2;
    
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, x, y);
  }

  private drawDiagonalWatermark(text: string) {
    this.ctx.save();
    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.rotate(-Math.PI / 4);
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, 0, 0);
    this.ctx.restore();
  }

  private drawTiledWatermark(text: string) {
    const metrics = this.ctx.measureText(text);
    const width = metrics.width;
    const height = parseInt(this.ctx.font);
    
    for (let x = 0; x < this.canvas.width; x += width * 2) {
      for (let y = 0; y < this.canvas.height; y += height * 2) {
        this.ctx.fillText(text, x, y);
      }
    }
  }
}
```

## Security Implementation

### Preview Authorization
```typescript
@Injectable()
export class PreviewAuthorizationService {
  validatePreviewAccess(file: FileInfo, user: User): Observable<ValidationResult> {
    return combineLatest([
      this.checkPermissions(file, user),
      this.checkWatermarkRequirements(file),
      this.checkDownloadRestrictions(file)
    ]).pipe(
      map(([permissions, watermark, download]) => ({
        valid: permissions.valid,
        watermarkRequired: watermark.required,
        downloadAllowed: download.allowed
      }))
    );
  }

  private checkWatermarkRequirements(file: FileInfo): Observable<WatermarkRequirement> {
    return this.securityService.getFilePolicy(file.id).pipe(
      map(policy => ({
        required: policy.watermarkRequired,
        text: policy.watermarkText,
        options: policy.watermarkOptions
      }))
    );
  }
}
```

### Content Protection
```typescript
@Injectable()
export class ContentProtectionService {
  private readonly protectedContent = new WeakMap<Blob, string>();

  async protectContent(content: Blob): Promise<Blob> {
    const key = await this.generateKey();
    const encryptedContent = await this.encrypt(content, key);
    this.protectedContent.set(encryptedContent, key);
    return encryptedContent;
  }

  async getDecryptionStream(content: Blob): Promise<ReadableStream> {
    const key = this.protectedContent.get(content);
    if (!key) {
      throw new Error('Content not protected');
    }

    return new ReadableStream({
      async start(controller) {
        const decrypted = await this.decrypt(content, key);
        controller.enqueue(decrypted);
        controller.close();
      }
    });
  }
}
```

## Performance Optimizations

### Preview Caching
```typescript
@Injectable()
export class PreviewCacheService {
  private readonly cache = new Map<string, CacheEntry<PreviewResult>>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getCachedPreview(fileId: string, options: PreviewOptions): Promise<PreviewResult | null> {
    const cacheKey = this.generateCacheKey(fileId, options);
    const entry = this.cache.get(cacheKey);
    
    if (!entry) return null;
    
    if (this.isExpired(entry)) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return entry.data;
  }

  cachePreview(fileId: string, options: PreviewOptions, result: PreviewResult) {
    const cacheKey = this.generateCacheKey(fileId, options);
    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
  }

  private generateCacheKey(fileId: string, options: PreviewOptions): string {
    return `${fileId}-${options.quality}-${options.page}-${options.zoom}`;
  }
}
```

### Lazy Loading
```typescript
@Injectable()
export class PreviewLoaderService {
  private readonly loadingQueue = new Map<string, Promise<void>>();
  private readonly MAX_CONCURRENT = 3;

  async loadPreview(fileId: string, options: PreviewOptions): Promise<void> {
    const queueKey = this.generateQueueKey(fileId, options);
    
    if (this.loadingQueue.size >= this.MAX_CONCURRENT) {
      await this.waitForSlot();
    }
    
    const loadPromise = this.previewService.getPreview(fileId, options)
      .pipe(
        tap(result => this.cacheService.cachePreview(fileId, options, result)),
        finalize(() => this.loadingQueue.delete(queueKey))
      )
      .toPromise();
    
    this.loadingQueue.set(queueKey, loadPromise);
    return loadPromise;
  }

  private async waitForSlot(): Promise<void> {
    const oldestKey = Array.from(this.loadingQueue.keys())[0];
    await this.loadingQueue.get(oldestKey);
  }
}
```

## Testing Strategy

### Unit Tests
```typescript
describe('PreviewService', () => {
  let service: FilePreviewService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FilePreviewService]
    });
    service = TestBed.inject(FilePreviewService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should get preview successfully', (done) => {
    const mockPreview = new Blob(['test'], { type: 'application/pdf' });
    
    service.getPreview('123', {}).subscribe(result => {
      expect(result.content).toBeTruthy();
      expect(result.metadata.previewType).toBe('pdf');
      done();
    });

    const req = httpMock.expectOne('/api/preview/123');
    expect(req.request.method).toBe('GET');
    req.flush(mockPreview);
  });
});
```

### Integration Tests
```typescript
describe('FullScreenPreviewComponent', () => {
  let component: FullScreenPreviewComponent;
  let fixture: ComponentFixture<FullScreenPreviewComponent>;
  let previewService: jasmine.SpyObj<FilePreviewService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FullScreenPreviewComponent],
      imports: [
        MatToolbarModule,
        MatSidenavModule,
        PdfViewerModule
      ],
      providers: [
        {
          provide: FilePreviewService,
          useValue: jasmine.createSpyObj('FilePreviewService', ['getPreview'])
        }
      ]
    }).compileComponents();
  });

  it('should handle zoom controls', () => {
    component.zoom = 1;
    component.zoomIn();
    expect(component.zoom).toBe(1.25);
    component.zoomOut();
    expect(component.zoom).toBe(1);
  });

  it('should navigate pages', () => {
    component.totalPages = 3;
    component.currentPage = 1;
    component.nextPage();
    expect(component.currentPage).toBe(2);
    component.previousPage();
    expect(component.currentPage).toBe(1);
  });
});
```

## Technical Constraints
1. Maximum preview file size: 100MB
2. Preview generation timeout: 30 seconds
3. Maximum concurrent previews: 3
4. Cache duration: 5 minutes
5. Maximum zoom level: 300%
6. Annotation limit: 100 per page
7. Search result limit: 100 matches

## Success Metrics
1. Preview Performance:
   - Generation time: <3 seconds
   - Page switch: <1 second
   - Search response: <500ms
2. Quality:
   - Preview accuracy: >99%
   - Watermark clarity: >95%
   - Annotation precision: >99%
3. User Experience:
   - Load time: <2 seconds
   - Zoom response: <100ms
   - Scroll smoothness: 60fps

## Dependencies
1. @angular/material: ^20.0.0
2. @angular/cdk: ^20.0.0
3. ng2-pdf-viewer: ^9.1.5
4. ngx-markdown: ^16.0.0
5. ag-grid-community: ^30.0.0

## Deployment Requirements
1. Node.js version: >=18.0.0
2. Preview generation service
3. Content delivery network
4. Image processing service
5. WebAssembly support 