import { Injectable } from '@angular/core';
import { Observable, of, throwError, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { FolderService, FolderHierarchy, Folder, FolderPermission } from './folder.service';
import { v4 as uuidv4 } from 'uuid';
import { LocalStorageService } from '../document/storage/local-storage.service';

@Injectable()
export class MockFolderService implements Partial<FolderService> {
  constructor(private localStorage: LocalStorageService) {}

  private buildHierarchy(folderId: string): FolderHierarchy {
    const folder = this.localStorage.getFolder(folderId);
    if (!folder) return null as any;

    const contents = this.localStorage.getFolderContents(folderId);
    return {
      folder: {
        ...folder,
        permissions: [{ userId: 'currentUser', accessLevel: 'admin' }],
        createdAt: new Date(folder.createdAt),
        updatedAt: new Date(folder.updatedAt)
      },
      children: contents.folders.map(f => this.buildHierarchy(f.id)).filter(h => h !== null)
    };
  };

  getFolderHierarchy(rootId?: string): Observable<FolderHierarchy> {
    return this.localStorage.getHierarchy().pipe(
      map(hierarchy => {
        const storageRootId = rootId || hierarchy.rootFolderId;
        return this.buildHierarchy(storageRootId);
      })
    );
  }

  getFolderPermissions(folderId: string): Observable<FolderPermission[]> {
    const folder = this.localStorage.getFolder(folderId);
    return of(folder ? [{ userId: 'currentUser', accessLevel: 'admin' }] : []);
  }

  validateFolderName(name: string, parentId?: string): Observable<boolean> {
    if (!parentId) {
      // Get the root folder ID from the hierarchy
      return this.localStorage.getHierarchy().pipe(
        map(hierarchy => {
          const rootId = hierarchy.rootFolderId;
          if (!rootId) {
            return false;
          }
          return this.checkFolderNameExists(name, rootId);
        })
      );
    }
    return of(this.checkFolderNameExists(name, parentId));
  }

  private checkFolderNameExists(name: string, parentId: string): boolean {
    // Get all folders in the parent folder
    const contents = this.localStorage.getFolderContents(parentId);
    
    // Check if a folder with the same name exists in the parent
    const exists = contents.folders.some(folder => folder.name.toLowerCase() === name.toLowerCase());
    return !exists;
  }

  createRootFolder(name: string, permissions: FolderPermission[], icon?: string): Observable<Folder> {
    const rootId = this.localStorage.getFolder('root')?.id;
    if (!rootId) {
      return throwError(() => new Error('Root folder not found'));
    }

    const newFolder = this.localStorage.createFolder(name, rootId, icon);
    
    const folderWithPermissions: Folder = {
      ...newFolder,
      permissions: permissions.map(p => ({ ...p })),
      createdAt: new Date(newFolder.createdAt),
      updatedAt: new Date(newFolder.updatedAt)
    };

    return of(folderWithPermissions);
  }

  createSubfolder(parentId: string, name: string, icon?: string): Observable<Folder> {
    console.log('Creating subfolder:', { parentId, name });
    try {
      const newFolder = this.localStorage.createFolder(name, parentId, icon);
      console.log('Created folder:', newFolder);
      
      const folderWithPermissions: Folder = {
        ...newFolder,
        permissions: [{ userId: 'currentUser', accessLevel: 'admin' }],
        createdAt: new Date(newFolder.createdAt),
        updatedAt: new Date(newFolder.updatedAt)
      };

      return of(folderWithPermissions);
    } catch (error) {
      console.error('Failed to create folder:', error);
      return throwError(() => new Error('Failed to create folder: ' + (error as Error).message));
    }
  }

  setFolderPermissions(folderId: string, permissions: FolderPermission[]): Observable<void> {
    const folder = this.localStorage.getFolder(folderId);
    if (!folder) {
      return throwError(() => new Error('Folder not found'));
    }
    // In mock service, we just return success since permissions are handled separately
    return of(void 0);
  }

  validateNestingLevel(parentId: string): Observable<boolean> {
    let level = 0;
    let current = this.localStorage.getFolder(parentId);
    while (current && current.parentId) {
      level++;
      current = this.localStorage.getFolder(current.parentId);
    }
    return of(level < 10); // Using same maxNestingLevel as real service
  }

  inheritParentPermissions(folderId: string, parentId: string): Observable<void> {
    const folder = this.localStorage.getFolder(folderId);
    const parent = this.localStorage.getFolder(parentId);
    if (!folder || !parent) {
      return throwError(() => new Error('Folder not found'));
    }
    // In mock service, we just return success since permissions are handled separately
    return of(void 0);
  }

  toggleFolderExpansion(folderId: string, expanded: boolean): Observable<void> {
    const folder = this.localStorage.getFolder(folderId);
    if (!folder) {
      return throwError(() => new Error('Folder not found'));
    }
    // In mock service, we don't persist expansion state
    return of(void 0);
  }

  private getDefaultPermissions(): FolderPermission[] {
    return [{ userId: 'currentUser', accessLevel: 'admin' }];
  }
}