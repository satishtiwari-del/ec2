# Folder Navigation - Technical Use Cases

## Technical Overview
This document outlines the technical implementation details for the Folder Navigation feature in the DocLib application. The implementation follows Angular best practices and uses Angular Material for UI components.

## Component Architecture

### Module Structure
```typescript
@NgModule({
  declarations: [
    FolderNavigationComponent,
    FolderTreeComponent,
    BreadcrumbComponent,
    FolderSearchComponent,
    RecentFoldersComponent,
    FavoriteFoldersComponent,
    FolderFilterComponent,
    EmptyStateComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTreeModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatBadgeModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ScrollingModule
  ],
  providers: [
    FolderNavigationService,
    FolderSearchService,
    RecentFoldersService,
    FavoriteFoldersService,
    NavigationStateService
  ]
})
export class FolderNavigationModule { }
```

### Service Layer

#### IFolderNavigationService Interface
```typescript
interface IFolderNavigationService {
  getFolderHierarchy(rootId?: string): Observable<FolderNode[]>;
  getFolderContents(folderId: string): Observable<FolderContent>;
  searchFolders(query: string, filters: FolderFilter): Observable<SearchResult>;
  getRecentFolders(): Observable<FolderInfo[]>;
  getFavoriteFolders(): Observable<FolderInfo[]>;
  addToFavorites(folderId: string): Observable<boolean>;
  removeFromFavorites(folderId: string): Observable<boolean>;
  validateAccess(folderId: string): Observable<AccessResult>;
}

interface FolderNode {
  id: string;
  name: string;
  level: number;
  expandable: boolean;
  children?: FolderNode[];
  parent?: string;
  isAccessible: boolean;
}

interface FolderContent {
  id: string;
  name: string;
  path: string[];
  subfolders: FolderInfo[];
  documents: DocumentInfo[];
  permissions: FolderPermissions;
}

interface FolderFilter {
  createdAfter?: Date;
  createdBefore?: Date;
  modifiedAfter?: Date;
  modifiedBefore?: Date;
  owner?: string;
  tags?: string[];
}

interface SearchResult {
  items: FolderInfo[];
  total: number;
  page: number;
  pageSize: number;
}
```

#### NavigationStateService Implementation
```typescript
@Injectable({
  providedIn: 'root'
})
export class NavigationStateService {
  private currentPath = new BehaviorSubject<string[]>([]);
  private recentFolders = new BehaviorSubject<FolderInfo[]>([]);
  private searchState = new BehaviorSubject<SearchState | null>(null);

  constructor(
    private storageService: StorageService,
    private errorHandler: GlobalErrorHandler
  ) {
    this.loadRecentFolders();
  }

  updateCurrentPath(path: string[]): void {
    this.currentPath.next(path);
    this.updateRecentFolders(path[path.length - 1]);
  }

  private updateRecentFolders(folderId: string): void {
    const recent = this.recentFolders.value;
    const updated = [
      { id: folderId },
      ...recent.filter(f => f.id !== folderId)
    ].slice(0, 20);
    
    this.recentFolders.next(updated);
    this.storageService.set('recentFolders', updated);
  }

  private loadRecentFolders(): void {
    const stored = this.storageService.get('recentFolders') || [];
    this.recentFolders.next(stored);
  }
}
```

### Component Implementation

#### FolderTreeComponent
```typescript
@Component({
  selector: 'app-folder-tree',
  template: `
    <mat-tree [dataSource]="dataSource" [treeControl]="treeControl">
      <mat-tree-node *matTreeNodeDef="let node" matTreeNodePadding>
        <button mat-icon-button disabled></button>
        <mat-icon class="folder-icon">folder</mat-icon>
        <span (click)="selectFolder(node)">{{node.name}}</span>
      </mat-tree-node>
      
      <mat-tree-node *matTreeNodeDef="let node; when: hasChild" matTreeNodePadding>
        <button mat-icon-button [attr.aria-label]="'Toggle ' + node.name"
                (click)="loadChildren(node)">
          <mat-icon class="mat-icon-rtl-mirror">
            {{treeControl.isExpanded(node) ? 'expand_more' : 'chevron_right'}}
          </mat-icon>
        </button>
        <mat-icon class="folder-icon">folder</mat-icon>
        <span (click)="selectFolder(node)">{{node.name}}</span>
      </mat-tree-node>
    </mat-tree>
  `,
  styles: [`
    .folder-icon {
      margin-right: 8px;
      color: #FFA000;
    }
  `]
})
export class FolderTreeComponent implements OnInit {
  private _transformer = (node: FolderNode, level: number) => {
    return {
      ...node,
      level: level,
      expandable: node.expandable
    };
  };

  treeControl = new FlatTreeControl<FolderNode>(
    node => node.level,
    node => node.expandable
  );

  treeFlattener = new MatTreeFlattener(
    this._transformer,
    node => node.level,
    node => node.expandable,
    node => node.children
  );

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  constructor(
    private navigationService: FolderNavigationService,
    private navigationState: NavigationStateService,
    private errorHandler: GlobalErrorHandler
  ) {}

  ngOnInit(): void {
    this.loadRootFolders();
  }

  private loadRootFolders(): void {
    this.navigationService.getFolderHierarchy().pipe(
      catchError(error => this.errorHandler.handleError(error))
    ).subscribe(
      hierarchy => this.dataSource.data = hierarchy
    );
  }

  loadChildren(node: FolderNode): void {
    if (node.children) {
      this.treeControl.toggle(node);
      return;
    }

    this.navigationService.getFolderHierarchy(node.id).pipe(
      catchError(error => this.errorHandler.handleError(error))
    ).subscribe(children => {
      node.children = children;
      this.dataSource.data = [...this.dataSource.data];
      this.treeControl.expand(node);
    });
  }

  selectFolder(node: FolderNode): void {
    if (!node.isAccessible) {
      return;
    }
    
    this.navigationService.getFolderContents(node.id).pipe(
      catchError(error => this.errorHandler.handleError(error))
    ).subscribe(contents => {
      this.navigationState.updateCurrentPath(contents.path);
      // Additional folder content handling
    });
  }

  hasChild = (_: number, node: FolderNode) => node.expandable;
}
```

#### BreadcrumbComponent
```typescript
@Component({
  selector: 'app-breadcrumb',
  template: `
    <div class="breadcrumb-container">
      <a mat-button
         *ngFor="let segment of path$ | async; let last = last"
         [class.active]="last"
         (click)="navigate(segment)">
        {{segment.name}}
        <mat-icon *ngIf="!last">chevron_right</mat-icon>
      </a>
    </div>
  `,
  styles: [`
    .breadcrumb-container {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
    }
    .active {
      color: primary;
      pointer-events: none;
    }
  `]
})
export class BreadcrumbComponent {
  path$ = this.navigationState.currentPath$;

  constructor(
    private navigationState: NavigationStateService,
    private navigationService: FolderNavigationService
  ) {}

  navigate(segment: PathSegment): void {
    this.navigationService.validateAccess(segment.id).pipe(
      switchMap(access => {
        if (!access.granted) {
          throw new Error('Access denied');
        }
        return this.navigationService.getFolderContents(segment.id);
      })
    ).subscribe({
      next: (contents) => {
        this.navigationState.updateCurrentPath(contents.path);
      },
      error: (error) => {
        // Handle navigation error
      }
    });
  }
}
```

## Security Implementation

### Access Control
```typescript
@Injectable({
  providedIn: 'root'
})
export class NavigationAccessGuard {
  constructor(private navigationService: FolderNavigationService) {}

  canActivate(folderId: string): Observable<boolean> {
    return this.navigationService.validateAccess(folderId).pipe(
      map(result => result.granted),
      catchError(() => of(false))
    );
  }
}
```

### Input Validation
```typescript
@Injectable({
  providedIn: 'root'
})
export class NavigationValidationService {
  validateSearchQuery(query: string): boolean {
    const maxLength = 100;
    const validPattern = /^[a-zA-Z0-9\s-_]*$/;
    
    return query.length <= maxLength && validPattern.test(query);
  }

  validatePath(path: string[]): boolean {
    return path.every(segment => {
      return segment.length > 0 && segment.length <= 255;
    });
  }
}
```

## Error Handling

### NavigationErrorHandler
```typescript
@Injectable()
export class NavigationErrorHandler extends GlobalErrorHandler {
  handleNavigationError(error: any): Observable<never> {
    if (error.code === 'ACCESS_DENIED') {
      return throwError(() => new Error('You do not have access to this folder'));
    }
    if (error.code === 'FOLDER_NOT_FOUND') {
      return throwError(() => new Error('The requested folder no longer exists'));
    }
    return super.handleError(error);
  }
}
```

## Performance Considerations

### Enhanced Cache Management
```typescript
@Injectable({
  providedIn: 'root'
})
export class NavigationCacheService {
  private hierarchyCache = new Map<string, CachedHierarchy>();
  private contentCache = new Map<string, CachedContent>();
  private searchCache = new Map<string, CachedSearch>();
  private recentCache = new Map<string, CachedRecent>();

  // Cache timeouts
  private readonly HIERARCHY_TIMEOUT = 15 * 60 * 1000;  // 15 minutes
  private readonly CONTENT_TIMEOUT = 5 * 60 * 1000;     // 5 minutes
  private readonly SEARCH_TIMEOUT = 2 * 60 * 1000;      // 2 minutes
  private readonly RECENT_TIMEOUT = 30 * 60 * 1000;     // 30 minutes

  // Cache size limits
  private readonly MAX_HIERARCHY_SIZE = 100;
  private readonly MAX_CONTENT_SIZE = 500;
  private readonly MAX_SEARCH_SIZE = 50;
  private readonly MAX_RECENT_SIZE = 20;

  constructor(
    private storageService: StorageService,
    private errorHandler: GlobalErrorHandler
  ) {
    this.initializeCache();
    this.setupCacheCleanup();
  }

  cacheHierarchy(parentId: string, nodes: FolderNode[]): void {
    this.enforceHierarchyLimit();
    this.hierarchyCache.set(parentId, {
      data: nodes,
      timestamp: Date.now(),
      accessCount: 0,
      dependencies: this.extractDependencies(nodes)
    });
  }

  getCachedHierarchy(parentId: string): FolderNode[] | undefined {
    const cached = this.hierarchyCache.get(parentId);
    if (cached && this.isHierarchyValid(cached)) {
      cached.accessCount++;
      return cached.data;
    }
    return undefined;
  }

  cacheContent(folderId: string, content: FolderContent): void {
    this.enforceContentLimit();
    this.contentCache.set(folderId, {
      data: content,
      timestamp: Date.now(),
      accessCount: 0,
      dependencies: this.extractContentDependencies(content)
    });
  }

  getCachedContent(folderId: string): FolderContent | undefined {
    const cached = this.contentCache.get(folderId);
    if (cached && this.isContentValid(cached)) {
      cached.accessCount++;
      return cached.data;
    }
    return undefined;
  }

  cacheSearch(query: string, filters: FolderFilter, results: SearchResult): void {
    const key = this.generateSearchKey(query, filters);
    this.enforceSearchLimit();
    this.searchCache.set(key, {
      data: results,
      timestamp: Date.now(),
      accessCount: 0,
      query,
      filters
    });
  }

  getCachedSearch(query: string, filters: FolderFilter): SearchResult | undefined {
    const key = this.generateSearchKey(query, filters);
    const cached = this.searchCache.get(key);
    if (cached && this.isSearchValid(cached)) {
      cached.accessCount++;
      return cached.data;
    }
    return undefined;
  }

  private generateSearchKey(query: string, filters: FolderFilter): string {
    return `${query}:${JSON.stringify(filters)}`;
  }

  private isHierarchyValid(cached: CachedHierarchy): boolean {
    return (
      Date.now() - cached.timestamp <= this.HIERARCHY_TIMEOUT &&
      !this.areDependenciesModified(cached.dependencies)
    );
  }

  private isContentValid(cached: CachedContent): boolean {
    return (
      Date.now() - cached.timestamp <= this.CONTENT_TIMEOUT &&
      !this.areDependenciesModified(cached.dependencies)
    );
  }

  private isSearchValid(cached: CachedSearch): boolean {
    return Date.now() - cached.timestamp <= this.SEARCH_TIMEOUT;
  }

  private extractDependencies(nodes: FolderNode[]): CacheDependency[] {
    return nodes.map(node => ({
      id: node.id,
      timestamp: node.modifiedAt
    }));
  }

  private extractContentDependencies(content: FolderContent): CacheDependency[] {
    return [
      { id: content.id, timestamp: content.modifiedAt },
      ...content.subfolders.map(folder => ({
        id: folder.id,
        timestamp: folder.modifiedAt
      }))
    ];
  }

  private areDependenciesModified(dependencies: CacheDependency[]): boolean {
    // Check if any dependency has been modified since caching
    return dependencies.some(dep => {
      const currentTimestamp = this.getCurrentTimestamp(dep.id);
      return currentTimestamp > dep.timestamp;
    });
  }

  private getCurrentTimestamp(folderId: string): number {
    // This would typically check a central modification tracking service
    // For now, we'll return 0 to indicate no modification
    return 0;
  }

  private enforceHierarchyLimit(): void {
    if (this.hierarchyCache.size >= this.MAX_HIERARCHY_SIZE) {
      this.removeOldestEntries(this.hierarchyCache, Math.floor(this.MAX_HIERARCHY_SIZE * 0.2));
    }
  }

  private enforceContentLimit(): void {
    if (this.contentCache.size >= this.MAX_CONTENT_SIZE) {
      this.removeOldestEntries(this.contentCache, Math.floor(this.MAX_CONTENT_SIZE * 0.2));
    }
  }

  private enforceSearchLimit(): void {
    if (this.searchCache.size >= this.MAX_SEARCH_SIZE) {
      this.removeOldestEntries(this.searchCache, Math.floor(this.MAX_SEARCH_SIZE * 0.2));
    }
  }

  private removeOldestEntries<T extends { accessCount: number }>(
    cache: Map<string, T>,
    count: number
  ): void {
    const entries = Array.from(cache.entries())
      .sort((a, b) => a[1].accessCount - b[1].accessCount)
      .slice(0, count);
    
    entries.forEach(([key]) => cache.delete(key));
  }

  private setupCacheCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 5 * 60 * 1000); // Run cleanup every 5 minutes
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();

    // Cleanup hierarchy cache
    for (const [key, value] of this.hierarchyCache.entries()) {
      if (!this.isHierarchyValid(value)) {
        this.hierarchyCache.delete(key);
      }
    }

    // Cleanup content cache
    for (const [key, value] of this.contentCache.entries()) {
      if (!this.isContentValid(value)) {
        this.contentCache.delete(key);
      }
    }

    // Cleanup search cache
    for (const [key, value] of this.searchCache.entries()) {
      if (!this.isSearchValid(value)) {
        this.searchCache.delete(key);
      }
    }
  }

  invalidateCache(folderId?: string): void {
    if (folderId) {
      // Invalidate specific folder
      this.hierarchyCache.delete(folderId);
      this.contentCache.delete(folderId);
      
      // Invalidate parent hierarchies that contain this folder
      for (const [key, value] of this.hierarchyCache.entries()) {
        if (value.dependencies.some(dep => dep.id === folderId)) {
          this.hierarchyCache.delete(key);
        }
      }
      
      // Invalidate content caches that contain this folder
      for (const [key, value] of this.contentCache.entries()) {
        if (value.dependencies.some(dep => dep.id === folderId)) {
          this.contentCache.delete(key);
        }
      }
      
      // Invalidate affected search results
      this.searchCache.clear();
    } else {
      // Clear all caches
      this.hierarchyCache.clear();
      this.contentCache.clear();
      this.searchCache.clear();
    }
  }
}

interface CachedHierarchy {
  data: FolderNode[];
  timestamp: number;
  accessCount: number;
  dependencies: CacheDependency[];
}

interface CachedContent {
  data: FolderContent;
  timestamp: number;
  accessCount: number;
  dependencies: CacheDependency[];
}

interface CachedSearch {
  data: SearchResult;
  timestamp: number;
  accessCount: number;
  query: string;
  filters: FolderFilter;
}

interface CacheDependency {
  id: string;
  timestamp: number;
}
```

### Virtual Scrolling
- Implemented for large folder lists
- Lazy loading of tree nodes
- Pagination for search results

## Testing Strategy

### Unit Tests
```typescript
describe('FolderNavigationService', () => {
  let service: FolderNavigationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FolderNavigationService]
    });
    
    service = TestBed.inject(FolderNavigationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should get folder hierarchy', (done) => {
    const mockHierarchy = [
      { id: '1', name: 'Root', expandable: true }
    ];

    service.getFolderHierarchy().subscribe(result => {
      expect(result).toEqual(mockHierarchy);
      done();
    });

    const req = httpMock.expectOne('/api/folders/hierarchy');
    expect(req.request.method).toBe('GET');
    req.flush(mockHierarchy);
  });
});
```

### Integration Tests
```typescript
describe('FolderTreeComponent', () => {
  let component: FolderTreeComponent;
  let fixture: ComponentFixture<FolderTreeComponent>;
  let navigationService: jasmine.SpyObj<FolderNavigationService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('FolderNavigationService', ['getFolderHierarchy']);
    
    await TestBed.configureTestingModule({
      declarations: [FolderTreeComponent],
      providers: [
        { provide: FolderNavigationService, useValue: spy }
      ]
    }).compileComponents();

    navigationService = TestBed.inject(FolderNavigationService) as jasmine.SpyObj<FolderNavigationService>;
  });

  it('should load root folders on init', () => {
    const mockHierarchy = [
      { id: '1', name: 'Root', expandable: true }
    ];

    navigationService.getFolderHierarchy.and.returnValue(of(mockHierarchy));

    fixture.detectChanges();
    
    expect(navigationService.getFolderHierarchy).toHaveBeenCalled();
    expect(component.dataSource.data).toEqual(mockHierarchy);
  });
});
```

## Technical Constraints
1. Maximum tree depth display: 10 levels
2. Search query length: 100 characters
3. Recent folders limit: 20 entries
4. Favorites limit: 50 folders
5. Cache timeout: 2 minutes
6. Search results per page: 50 items

## Dependencies
1. @angular/core: ^20.0.0
2. @angular/material: ^20.0.0
3. @angular/cdk: ^20.0.0
4. rxjs: ^7.8.0

## Deployment Requirements
1. Node.js >= 18.x
2. Angular CLI >= 20.0.0
3. Memory: 512MB minimum
4. Storage: Based on navigation cache size
5. Network: Low latency for tree operations

## Success Metrics
1. Tree node expansion time < 200ms
2. Search response time < 300ms
3. Navigation operation < 150ms
4. Cache hit ratio > 75%
5. Client memory usage < 100MB 