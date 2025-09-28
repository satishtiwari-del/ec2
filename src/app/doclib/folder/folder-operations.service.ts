import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of, throwError, from } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { FolderService, FolderPermission } from './folder.service';
import { FolderCreationDialogComponent } from './folder-creation-dialog/folder-creation-dialog.component';
import { LocalStorageService } from '../document/storage/local-storage.service';

export interface FolderOperation {
  type: 'new' | 'upload' | 'edit' | 'delete' | 'move' | 'copy' | 'rename';
  folderId: string;
  data?: any;
}

export interface OperationResult {
  success: boolean;
  error?: string;
  cancelled?: boolean;
  folder?: any;
  newPath?: string;
  newName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FolderOperationsService {
  constructor(
    private folderService: FolderService,
    private dialog: MatDialog,
    private localStorage: LocalStorageService
  ) {}

  executeOperation(operation: FolderOperation): Observable<OperationResult> {
    switch (operation.type) {
      case 'new':
        return this.handleNewFolder(operation);
      case 'upload':
        return this.handleFileUpload(operation);
      case 'edit':
        return this.handleFolderEdit(operation);
      case 'delete':
        return this.handleFolderDelete(operation);
      case 'move':
        return this.handleFolderMove(operation);
      case 'copy':
        return this.handleFolderCopy(operation);
      case 'rename':
        return this.handleFolderRename(operation);
      default:
        return throwError(() => new Error('Unsupported operation'));
    }
  }

  checkPermission(operation: FolderOperation['type'], folderId: string): Observable<boolean> {
    const validOperations = ['new', 'upload', 'edit', 'delete', 'move', 'copy', 'rename'];
    if (!validOperations.includes(operation)) {
      return of(false);
    }

    return this.folderService.getFolderPermissions(folderId).pipe(
      map(permissions => {
        if (!permissions || permissions.length === 0) {
          return false;
        }

        // Map operations to required permission levels
        const requiredLevel = this.getRequiredPermissionLevel(operation);
        return permissions.some(p => this.hasRequiredPermission(p, requiredLevel));
      }),
      catchError(() => of(false))
    );
  }

  private handleNewFolder(operation: FolderOperation): Observable<OperationResult> {
    const dialogRef = this.dialog.open(FolderCreationDialogComponent, {
      data: { parentFolderId: operation.folderId }
    });

    return dialogRef.afterClosed().pipe(
      map(result => {
        if (!result) {
          return { success: false, cancelled: true };
        }
        return { success: true, folder: result };
      }),
      catchError(error => throwError(() => error))
    );
  }

  private handleFileUpload(operation: FolderOperation): Observable<OperationResult> {
    // Open file upload dialog
    // TODO: Implement FileUploadDialogComponent
    const dialogRef = this.dialog.open(FolderCreationDialogComponent, {
      data: { parentFolderId: operation.folderId }
    });

    return dialogRef.afterClosed().pipe(
      map(result => {
        if (!result) {
          return { success: false, cancelled: true };
        }
        return { success: true, ...result };
      }),
      catchError(error => throwError(() => error))
    );
  }

  private handleFolderEdit(operation: FolderOperation): Observable<OperationResult> {
    // Open folder edit dialog
    const dialogRef = this.dialog.open(FolderCreationDialogComponent, {
      data: { folderId: operation.folderId, mode: 'edit' }
    });

    return dialogRef.afterClosed().pipe(
      map(result => {
        if (!result) {
          return { success: false, cancelled: true };
        }
        return { success: true, folder: result };
      }),
      catchError(error => throwError(() => error))
    );
  }

  private handleFolderDelete(operation: FolderOperation): Observable<OperationResult> {
    try {
      this.localStorage.deleteFolder(operation.folderId);
      return of({ success: true, cancelled: false });
    } catch (error) {
      return of({ success: false, error: (error as Error).message });
    }
  }

  private handleFolderMove(operation: FolderOperation): Observable<OperationResult> {
    if (!operation.data?.targetFolderId) {
      return throwError(() => new Error('Target folder ID is required for move operation'));
    }

    try {
      this.localStorage.moveFolder(operation.folderId, operation.data.targetFolderId);
      const folder = this.localStorage.getFolder(operation.folderId);
      return of({ success: true, newPath: folder?.path || '' });
    } catch (error) {
      return of({ success: false, error: (error as Error).message });
    }
  }

  private handleFolderCopy(operation: FolderOperation): Observable<OperationResult> {
    if (!operation.data?.targetFolderId) {
      return throwError(() => new Error('Target folder ID is required for copy operation'));
    }

    try {
      const sourceFolder = this.localStorage.getFolder(operation.folderId);
      if (!sourceFolder) {
        return of({ success: false, error: 'Source folder not found' });
      }

      // Create a new folder with the same name in the target location
      const newFolder = this.localStorage.createFolder(sourceFolder.name, operation.data.targetFolderId);

      // Copy all contents recursively
      const contents = this.localStorage.getFolderContents(operation.folderId);
      
      // Copy subfolders recursively
      contents.folders.forEach(subfolder => {
        const newSubfolder = this.localStorage.createFolder(subfolder.name, newFolder.id);
        // TODO: Implement recursive copy of subfolder contents
      });

      // Copy files
      contents.files.forEach(async file => {
        const blob = new Blob([file.content as string], { type: file.mimeType });
        const newFile = new File([blob], file.name, { type: file.mimeType });
        await this.localStorage.saveFile(newFile, newFolder.id, file.metadata);
      });

      return of({ success: true, newPath: newFolder.path });
    } catch (error) {
      return of({ success: false, error: (error as Error).message });
    }
  }

  private handleFolderRename(operation: FolderOperation): Observable<OperationResult> {
    if (!operation.data?.newName) {
      return throwError(() => new Error('New name is required for rename operation'));
    }

    try {
      const folder = this.localStorage.getFolder(operation.folderId);
      if (!folder) {
        return of({ success: false, error: 'Folder not found' });
      }

      // Get parent folder
      const parentId = folder.parentId;
      if (!parentId) {
        return of({ success: false, error: 'Cannot rename root folder' });
      }

      // Create a new folder with the new name
      const newFolder = this.localStorage.createFolder(operation.data.newName, parentId);

      // Move all contents to the new folder
      const contents = this.localStorage.getFolderContents(operation.folderId);
      
      // Move subfolders
      contents.folders.forEach(subfolder => {
        this.localStorage.moveFolder(subfolder.id, newFolder.id);
      });

      // Move files
      contents.files.forEach(file => {
        this.localStorage.moveFile(file.id, newFolder.id);
      });

      // Delete the old folder
      this.localStorage.deleteFolder(operation.folderId);

      return of({ success: true, newName: operation.data.newName });
    } catch (error) {
      return of({ success: false, error: (error as Error).message });
    }
  }

  private getRequiredPermissionLevel(operation: FolderOperation['type']): 'read' | 'write' | 'admin' {
    switch (operation) {
      case 'new':
      case 'upload':
      case 'edit':
      case 'rename':
        return 'write';
      case 'delete':
      case 'move':
      case 'copy':
        return 'admin';
      default:
        return 'read';
    }
  }

  private hasRequiredPermission(permission: FolderPermission, required: 'read' | 'write' | 'admin'): boolean {
    const levels = { read: 1, write: 2, admin: 3 };
    return levels[permission.accessLevel] >= levels[required];
  }

  uploadFile(file: File, folderId: string, metadata: { description: string; tags: string[] }): Observable<OperationResult> {
    return new Observable(observer => {
      this.folderService.getFolderPermissions(folderId).pipe(
        switchMap(permissions => {
          if (!permissions.some(p => p.accessLevel === 'write' || p.accessLevel === 'admin')) {
            throw new Error('No write permission');
          }
          return from(this.localStorage.saveFile(file, folderId, metadata));
        })
      ).subscribe({
        next: (savedFile) => {
          observer.next({ success: true });
          observer.complete();
        },
        error: (error) => {
          observer.next({ success: false, error: error.message });
          observer.complete();
        }
      });
    });
  }
}