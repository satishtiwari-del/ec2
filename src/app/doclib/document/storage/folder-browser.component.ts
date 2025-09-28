import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClientModule } from '@angular/common/http';
import { LocalStorageService } from './local-storage.service';
import { StorageAdapterService } from './storage-adapter.service';
import { FolderHierarchy } from '../../folder/folder.service';
import { LocalStorageFile, LocalStorageFolder, FileContextMetadata } from './storage.model';
import { FileUploadDialogComponent } from './file-upload-dialog/file-upload-dialog.component';
import { FilePreviewDialogComponent } from './file-preview-dialog/file-preview-dialog.component';
import { FolderCreationDialogComponent } from '../../folder/folder-creation-dialog/folder-creation-dialog.component';
import { FolderMenuComponent } from '../../folder/folder-menu/folder-menu.component';
import { FolderHierarchyService } from '../../folder/folder-hierarchy.service';
import { FileMenuComponent } from '../file-menu/file-menu.component';
import { FileOperationsService } from '../services/file-operations.service';
import { FilePreviewService } from '../services/file-preview.service';
import { FolderOperationsService } from '../../folder/folder-operations.service';

interface ExpandedState {
  [folderId: string]: boolean;
}

@Component({
  selector: 'app-folder-browser',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSnackBarModule,
    FolderMenuComponent,
    FileMenuComponent,
    HttpClientModule
  ],
  template: `
    <div class="folder-browser">
      <div class="toolbar">
        <button mat-raised-button color="primary" (click)="createNewFolder()">New Folder</button>
        <input 
          type="file" 
          multiple 
          #fileInput
          (change)="handleFileSelection($event)" 
          style="display: none">
        <button mat-raised-button color="primary" (click)="fileInput.click()">Upload Files</button>
      </div>

      <div class="content">
        <div class="folder-tree">
          <ng-container *ngIf="hierarchy">
            <div class="folder-node" [class.active]="currentFolderId === hierarchy.folder.id">
              <app-folder-menu 
                [isActive]="currentFolderId === hierarchy.folder.id"
                (actionTriggered)="handleFolderAction($event, hierarchy.folder)">
                <span (click)="selectFolder(hierarchy.folder.id)" (dblclick)="toggleExpand(hierarchy.folder.id)">
                  <mat-icon [style.color]="getFolderColor(hierarchy.folder.icon)">
                    {{ isExpanded(hierarchy.folder.id) ? 'folder_open' : 'folder' }}
                  </mat-icon>
                  {{ hierarchy.folder.name }}
                </span>
              </app-folder-menu>
              <div class="children" *ngIf="hierarchy.children && hierarchy.children.length > 0 && isExpanded(hierarchy.folder.id)">
                <ng-container *ngTemplateOutlet="folderTree; context: { $implicit: hierarchy.children }">
                </ng-container>
              </div>
            </div>
          </ng-container>
        </div>

        <div class="folder-contents" *ngIf="currentContents">
          <div class="breadcrumb">
            <div class="breadcrumb-items">
              <ng-container *ngFor="let item of currentPath; let last = last">
                <span class="breadcrumb-item" [class.active]="last">
                  <button mat-button *ngIf="!last" (click)="selectFolder(item.id)">
                    {{ item.name }}
                  </button>
                  <span *ngIf="last">{{ item.name }}</span>
                </span>
                <mat-icon *ngIf="!last" class="breadcrumb-separator">chevron_right</mat-icon>
              </ng-container>
            </div>
          </div>

          <ng-container *ngIf="currentContents.folders.length === 0 && currentContents.files.length === 0">
            <div class="empty-folder">
              <mat-icon>folder_open</mat-icon>
              <p>The folder is empty</p>
            </div>
          </ng-container>

          <ng-container *ngIf="currentContents.folders.length > 0 || currentContents.files.length > 0">
            <div class="folders">
              <div *ngFor="let folder of currentContents.folders" 
                   class="item folder"
                   [class.selected]="currentFolderId === folder.id"
                   (click)="highlightFolder(folder.id)"
                   (dblclick)="openFolder(folder.id)">
                <app-folder-menu 
                  [isActive]="currentFolderId === folder.id"
                  (actionTriggered)="handleFolderAction($event, folder)">
                  <span>
                    <mat-icon [style.color]="getFolderColor(folder.icon)">folder</mat-icon>
                    {{ folder.name }}
                  </span>
                </app-folder-menu>
              </div>
            </div>
            <div class="files">
              <div *ngFor="let file of currentContents.files" class="item file">
                <app-file-menu 
                  [isActive]="false"
                  [canEdit]="true"
                  [canShare]="true"
                  [canDelete]="true"
                  (actionTriggered)="handleFileAction($event, file)">
                  <div class="file-item-content">
                    <div class="file-info">
                      <span>📄 {{ file.name }}</span>
                      <div class="metadata" *ngIf="file.metadata">
                        <small *ngIf="file.metadata.description" class="description">{{ file.metadata.description }}</small>
                        <div class="tags" *ngIf="file.metadata.tags?.length">
                          <small class="tag" *ngFor="let tag of file.metadata.tags">{{ tag }}</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </app-file-menu>
              </div>
            </div>
          </ng-container>
        </div>
      </div>
    </div>

    <ng-template #folderTree let-nodes>
      <div *ngFor="let node of nodes" class="folder-node" [class.active]="currentFolderId === node.folder.id">
        <app-folder-menu 
          [isActive]="currentFolderId === node.folder.id"
          (actionTriggered)="handleFolderAction($event, node.folder)">
          <span (click)="selectFolder(node.folder.id)" (dblclick)="toggleExpand(node.folder.id)">
            <mat-icon [style.color]="getFolderColor(node.folder.icon)">
              {{ isExpanded(node.folder.id) ? 'folder_open' : 'folder' }}
            </mat-icon>
            {{ node.folder.name }}
          </span>
        </app-folder-menu>
        <div class="children" *ngIf="node.children && node.children.length > 0 && isExpanded(node.folder.id)">
          <ng-container *ngTemplateOutlet="folderTree; context: { $implicit: node.children }">
          </ng-container>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    .folder-browser {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .toolbar {
      padding: 10px;
      border-bottom: 1px solid #ccc;
      display: flex;
      gap: 10px;
    }

    .content {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .folder-tree {
      width: 250px;
      padding: 10px;
      border-right: 1px solid #ccc;
      overflow: auto;
    }

    .folder-contents {
      flex: 1;
      padding: 10px;
      overflow: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .breadcrumb {
      background-color: #f5f5f5;
      border-radius: 4px;
      padding: 8px 16px;
    }

    .breadcrumb-items {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px;
    }

    .breadcrumb-item {
      display: flex;
      align-items: center;
    }

    .breadcrumb-item button {
      min-width: 0;
      padding: 0 8px;
      line-height: 28px;
      color: #1976d2;
    }

    .breadcrumb-item.active {
      color: rgba(0, 0, 0, 0.87);
      font-weight: 500;
      padding: 0 8px;
    }

    .breadcrumb-separator {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: rgba(0, 0, 0, 0.54);
    }

    .folder-node {
      padding: 2px 0;
      cursor: pointer;
    }

    .folder-node.active ::ng-deep .folder-item {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .children {
      padding-left: 24px;
    }

    .item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 10px;
      margin: 2px 0;
      border-radius: 4px;
      background-color: white;
      cursor: pointer;
      user-select: none;
      transition: background-color 0.2s;
    }

    .item:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .item.folder {
      padding: 8px;
    }

    .item.folder:active {
      background-color: rgba(0, 0, 0, 0.08);
    }

    .item.folder.selected {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .file-item-content {
      display: flex;
      align-items: flex-start;
      width: 100%;
    }

    .file-info {
      flex: 1;
      margin-right: 10px;
    }

    .menu-button {
      opacity: 0;
      transition: opacity 0.2s;
    }

    .item:hover .menu-button {
      opacity: 1;
    }

    .metadata {
      margin-top: 5px;
      font-size: 0.9em;
    }

    .description {
      display: block;
      color: #666;
      margin-bottom: 5px;
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }

    .tag {
      background-color: #e0e0e0;
      padding: 2px 8px;
      border-radius: 12px;
      color: #666;
    }

    .folder-node span {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 4px;
      border-radius: 4px;
      user-select: none;
      cursor: pointer;
    }

    .material-icons {
      font-size: 18px;
      width: 18px;
      height: 18px;
      line-height: 18px;
      color: rgba(0, 0, 0, 0.54);
    }

    .material-icons {
      font-size: 20px;
      color: #666;
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .mat-icon-button {
      width: 30px;
      height: 30px;
      line-height: 30px;
    }

    .mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      line-height: 20px;
    }

    .empty-folder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: rgba(0, 0, 0, 0.54);
    }

    .empty-folder .mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }

    .empty-folder p {
      font-size: 16px;
      margin: 0;
    }
  `]
})
export class FolderBrowserComponent implements OnInit {
  hierarchy: FolderHierarchy | null = null;
  currentFolderId: string | null = null;
  currentContents: { folders: LocalStorageFolder[], files: LocalStorageFile[] } | null = null;
  private expandedFolders: ExpandedState = {};
  currentPath: { id: string; name: string; }[] = [];
  private pendingUploadFolderId: string | null = null;

  constructor(
    private localStorage: LocalStorageService,
    private storageAdapter: StorageAdapterService,
    private dialog: MatDialog,
    private folderHierarchy: FolderHierarchyService,
    private fileOperations: FileOperationsService,
    private folderOperations: FolderOperationsService,
    private filePreview: FilePreviewService,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit() {
    await this.loadHierarchy();
  }

  private async loadHierarchy() {
    this.localStorage.getHierarchy().subscribe(storageHierarchy => {
      // Convert storage hierarchy to folder hierarchy
      const rootFolder = this.localStorage.getFolder(storageHierarchy.rootFolderId);
      if (!rootFolder) return;

      const buildHierarchy = (folderId: string): FolderHierarchy => {
        const folder = this.localStorage.getFolder(folderId);
        if (!folder) return null as any;

        const contents = this.localStorage.getFolderContents(folderId);
        return {
          folder: {
            ...folder,
            permissions: [], // Add default permissions if needed
            createdAt: new Date(folder.createdAt),
            updatedAt: new Date(folder.updatedAt)
          },
          children: contents.folders.map(f => buildHierarchy(f.id)).filter(h => h !== null)
        };
      };

      this.hierarchy = buildHierarchy(storageHierarchy.rootFolderId);
      // Retain current selection if set; otherwise default to root
      const targetId = this.currentFolderId || storageHierarchy.rootFolderId;
      this.selectFolder(targetId);
    });
  }

  selectFolder(folderId: string) {
    this.currentFolderId = folderId;
    this.currentContents = this.localStorage.getFolderContents(folderId);
    this.updateCurrentPath(folderId);
  }

  private updateCurrentPath(folderId: string) {
    const path: { id: string; name: string; }[] = [];
    let currentFolder = this.localStorage.getFolder(folderId);
    
    while (currentFolder) {
      path.unshift({ id: currentFolder.id, name: currentFolder.name });
      if (currentFolder.parentId) {
        currentFolder = this.localStorage.getFolder(currentFolder.parentId);
      } else {
        break;
      }
    }
    
    this.currentPath = path;
  }

  highlightFolder(folderId: string) {
    this.currentFolderId = folderId;
  }

  createNewFolder() {
    if (!this.currentFolderId) return;

    const dialogRef = this.dialog.open(FolderCreationDialogComponent, {
      data: { parentFolderId: this.currentFolderId }
    });

    dialogRef.afterClosed().subscribe(async (result: any) => {
      if (result) {
        console.log('Folder created:', result);
        this.folderHierarchy.getFolderHierarchy().subscribe(hierarchy => {
          this.hierarchy = hierarchy;
          // Expand the parent folder
          if (this.currentFolderId) {
            this.expandedFolders[this.currentFolderId] = true;
          }
          // Navigate to the new folder
          this.selectFolder(result.id);
        });
      }
    });
  }

  async onFolderOperationComplete(event: any) {
    if (event.success) {
      await this.loadHierarchy();
      
      if (event.operation === 'delete' && event.folderId === this.currentFolderId) {
        // If current folder was deleted, go to parent
        const parent = this.findParentFolder(event.folderId);
        this.selectFolder(parent?.id || this.hierarchy!.folder.id);
        this.snackBar.open('Folder deleted successfully', 'Close', { duration: 3000 });
      } else if (event.operation === 'upload') {
        // For file uploads, stay in current folder but refresh and show notification
        this.selectFolder(event.folderId);
        this.expandedFolders[event.folderId] = true;
        this.snackBar.open('Files uploaded successfully', 'Close', { duration: 3000 });
      } else if (event.operation === 'new') {
        // For new folders, navigate into the new folder
        this.selectFolder(event.folderId);
        this.expandedFolders[this.currentFolderId!] = true;
        this.snackBar.open('Folder created successfully', 'Close', { duration: 3000 });
      } else {
        this.selectFolder(this.currentFolderId!);
      }
    }
  }

  private findParentFolder(folderId: string): { id: string } | null {
    if (!this.hierarchy) return null;

    const findInChildren = (children: FolderHierarchy[]): { id: string } | null => {
      for (const child of children) {
        if (child.folder.id === folderId) {
          return { id: this.currentFolderId! };
        }
        if (child.children) {
          const found = findInChildren(child.children);
          if (found) return found;
        }
      }
      return null;
    };

    return findInChildren(this.hierarchy.children || []);
  }

  async handleFileSelection(event: Event) {
    const targetFolderId = this.pendingUploadFolderId || this.currentFolderId;
    if (!targetFolderId) return;

    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const files = Array.from(input.files);
    
    for (const file of files) {
      const dialogRef = this.dialog.open(FileUploadDialogComponent, {
        data: {
          fileName: file.name,
          metadata: {
            description: '',
            tags: []
          }
        }
      });

          try {
        const metadata = await dialogRef.afterClosed().toPromise();
        if (metadata) {
          await this.localStorage.saveFile(file, targetFolderId, metadata);
          // Mirror upload to backend Documents directory for Collabora
          this.fileOperations.uploadToServer(file).subscribe({
            next: () => {},
            error: (err: Error) => console.warn('Server upload failed (local copy saved):', err.message)
          });
        }
      } catch (error) {
        console.error('Failed to handle file:', file.name, error);
      }
    }

    // Clear the input
    input.value = '';
    
    // Refresh the view
    this.selectFolder(targetFolderId);
    this.pendingUploadFolderId = null;
  }

  // Folder operations are now handled by the context menu component

  mapToFileMetadata(file: LocalStorageFile): FileContextMetadata {
    return {
      id: file.id,
      name: file.name,
      type: file.type,
      size: file.size,
      path: file.path
    };
  }

  onFileOperationComplete(event: any) {
    if (event.success) {
      // Refresh the current folder contents
      if (this.currentFolderId) {
        this.selectFolder(this.currentFolderId);
      }
    }
  }

  isExpanded(folderId: string): boolean {
    return this.expandedFolders[folderId] ?? true; // Default to expanded
  }

  toggleExpand(folderId: string): void {
    const isExpanding = !this.isExpanded(folderId);
    this.expandedFolders[folderId] = isExpanding;

    // If collapsing, also collapse all children
    if (!isExpanding) {
      const folder = this.findFolderInHierarchy(folderId);
      if (folder) {
        this.collapseAllChildren(folder);
      }
    }
  }

  private collapseAllChildren(node: FolderHierarchy): void {
    if (!node.children) return;
    
    for (const child of node.children) {
      this.expandedFolders[child.folder.id] = false;
      this.collapseAllChildren(child);
    }
  }

  previewFile(file: LocalStorageFile): void {
    this.dialog.open(FilePreviewDialogComponent, {
      data: file,
      maxWidth: '90vw',
      maxHeight: '90vh'
    });
  }

  openFolder(folderId: string): void {
    // Find the folder in the hierarchy
    const folder = this.findFolderInHierarchy(folderId);
    if (folder) {
      // Expand the parent folder if it exists
      if (folder.folder.parentId) {
        this.expandedFolders[folder.folder.parentId] = true;
      }
      // Navigate to the folder
      this.selectFolder(folderId);
    }
  }

  getFolderColor(iconType: string | undefined): string {
    const colorMap: { [key: string]: string } = {
      'folder_default': '#FFA000',    // Orange
      'folder_important': '#F44336',  // Red
      'folder_shared': '#4CAF50',     // Green
      'folder_project': '#2196F3',    // Blue
      'folder_archive': '#9E9E9E',    // Grey
      'folder_personal': '#9C27B0',   // Purple
      'folder_secure': '#FF5722',     // Deep Orange
      'folder_team': '#00BCD4'        // Cyan
    };
    
    return colorMap[iconType || 'folder_default'] || '#FFA000';
  }

  private findFolderInHierarchy(folderId: string): FolderHierarchy | null {
    if (!this.hierarchy) return null;

    const search = (node: FolderHierarchy): FolderHierarchy | null => {
      if (node.folder.id === folderId) return node;
      if (!node.children) return null;

      for (const child of node.children) {
        const found = search(child);
        if (found) return found;
      }
      return null;
    };

    return search(this.hierarchy);
  }

  handleFolderAction(action: string, folder: any) {
    switch (action) {
      case 'new':
        const dialogRef = this.dialog.open(FolderCreationDialogComponent, {
          data: { parentFolderId: folder.id }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.folderHierarchy.getFolderHierarchy().subscribe(hierarchy => {
              this.hierarchy = hierarchy;
              this.expandedFolders[folder.id] = true;
              this.selectFolder(result.id);
              this.snackBar.open('Folder created successfully', 'Close', { duration: 3000 });
            });
          }
        });
        break;

      case 'upload':
        // Trigger file input click
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true;
        this.pendingUploadFolderId = folder.id;
        fileInput.onchange = (e) => this.handleFileSelection(e);
        fileInput.click();
        break;

      case 'edit':
      case 'rename':
      case 'move':
      case 'copy':
      case 'delete':
        // Handle these operations through the folder service
        const operation = { type: action, folderId: folder.id };
        this.folderOperations.executeOperation(operation).subscribe({
          next: (result: { success: boolean }) => {
            if (result?.success) {
              this.loadHierarchy();
              if (action === 'delete' && folder.id === this.currentFolderId) {
                const parent = this.findParentFolder(folder.id);
                this.selectFolder(parent?.id || this.hierarchy!.folder.id);
              }
              this.snackBar.open(`Folder ${action}d successfully`, 'Close', { duration: 3000 });
            }
          },
          error: (error: Error) => {
            this.snackBar.open(`Failed to ${action} folder: ${error.message}`, 'Close', { duration: 3000 });
          }
        });
        break;
    }
  }

  handleFileAction(action: string, file: any) {
    switch (action) {
      case 'preview':
        this.fileOperations.preview(this.mapToFileMetadata(file)).subscribe({
          next: () => {},
          error: (error: Error) => {
            this.snackBar.open(`Failed to preview file: ${error.message}`, 'Close', { duration: 3000 });
          }
        });
        break;

      case 'download':
        this.fileOperations.download(this.mapToFileMetadata(file)).subscribe({
          next: () => {
            this.snackBar.open('File download started', 'Close', { duration: 3000 });
          },
          error: (error: Error) => {
            this.snackBar.open(`Failed to download file: ${error.message}`, 'Close', { duration: 3000 });
          }
        });
        break;

      case 'edit':
        this.fileOperations.edit(this.mapToFileMetadata(file)).subscribe({
          next: () => {
            const name = (file?.name || '').toLowerCase();
            const isMarkdown = name.endsWith('.md') || name.endsWith('.markdown');
            this.snackBar.open(isMarkdown ? 'Opening in ProseMirror editor…' : 'Opening in Collabora editor…', 'Close', { duration: 3000 });
          },
          error: (error: Error) => {
            this.snackBar.open(`Failed to edit file: ${error.message}`, 'Close', { duration: 3000 });
          }
        });
        break;

      case 'delete':
        if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
          this.fileOperations.delete(this.mapToFileMetadata(file)).subscribe({
            next: () => {
              this.selectFolder(this.currentFolderId!);
              this.snackBar.open('File deleted successfully', 'Close', { duration: 3000 });
            },
            error: (error: Error) => {
              this.snackBar.open(`Failed to delete file: ${error.message}`, 'Close', { duration: 3000 });
            }
          });
        }
        break;
    }
  }
}