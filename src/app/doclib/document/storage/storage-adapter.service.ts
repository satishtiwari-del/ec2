import { Injectable } from '@angular/core';
import { Observable, map, of, firstValueFrom } from 'rxjs';
import { LocalStorageService } from './local-storage.service';
import { Folder, FolderHierarchy } from '../../folder/folder.service';
import { LocalStorageFolder } from './storage.model';

@Injectable({
  providedIn: 'root'
})
export class StorageAdapterService {
  constructor(private localStorage: LocalStorageService) {}

  private adaptFolder(localFolder: LocalStorageFolder): Folder {
    return {
      id: localFolder.id,
      name: localFolder.name,
      path: localFolder.path,
      parentId: localFolder.parentId,
      createdBy: localFolder.createdBy,
      createdAt: new Date(localFolder.createdAt),
      updatedAt: new Date(localFolder.updatedAt),
      permissions: [] // Add permissions if needed
    };
  }

  private buildHierarchy(folderId: string): FolderHierarchy {
    const folder = this.localStorage.getFolder(folderId);
    if (!folder) throw new Error('Folder not found');

    const contents = this.localStorage.getFolderContents(folderId);
    const children = contents.folders.map(f => this.buildHierarchy(f.id));

    return {
      folder: this.adaptFolder(folder),
      children,
      expanded: false
    };
  }

  async getFolderHierarchy(rootId?: string): Promise<FolderHierarchy> {
    const hierarchy = await firstValueFrom(this.localStorage.getHierarchy());
    const targetId = rootId || hierarchy.rootFolderId;
    return this.buildHierarchy(targetId);
  }

  createSubfolder(parentId: string, name: string): Observable<Folder> {
    const newFolder = this.localStorage.createFolder(name, parentId);
    return of(this.adaptFolder(newFolder));
  }

  async validateFolderName(name: string, parentId?: string): Promise<boolean> {
    if (!name || name.trim().length === 0) return false;
    
    const hierarchy = await firstValueFrom(this.localStorage.getHierarchy());
    const contents = this.localStorage.getFolderContents(parentId || hierarchy.rootFolderId);
    const exists = contents.folders.some(f => f.name === name);
    
    return !exists;
  }
}