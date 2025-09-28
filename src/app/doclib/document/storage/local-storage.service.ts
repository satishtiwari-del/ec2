import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { LocalStorageFile, LocalStorageFolder, StorageHierarchy, FileMetadata } from './storage.model';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/services/auth.service';

const STORAGE_KEY = 'doclib_storage';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private storageHierarchy: StorageHierarchy;
  private hierarchySubject: BehaviorSubject<StorageHierarchy>;

  constructor(private http: HttpClient, private authService: AuthService) {
    const loadedHierarchy = this.loadFromStorage();
    const hierarchy = loadedHierarchy || this.createInitialHierarchy();
    this.storageHierarchy = hierarchy;
    this.hierarchySubject = new BehaviorSubject<StorageHierarchy>(hierarchy);
    
    if (!loadedHierarchy) {
      this.saveToStorage(hierarchy);
    }

    // Always attempt to sync from backend Documents folder asynchronously
    this.seedFromServerDocuments().catch(() => {
      // Non-fatal if server is not running
    });
  }

  private loadFromStorage(): StorageHierarchy | null {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    try {
      const parsed = JSON.parse(stored);
      // Validate the parsed data has the required structure
      if (parsed && typeof parsed === 'object' && 'rootFolderId' in parsed && 'folders' in parsed && 'files' in parsed) {
        // Ensure the root folder exists
        if (parsed.rootFolderId && typeof parsed.folders === 'object' && parsed.folders[parsed.rootFolderId]) {
          return parsed;
        }
      }
      console.error('Invalid storage format');
      return null;
    } catch (e) {
      console.error('Failed to parse storage:', e);
      return null;
    }
  }

  private createInitialHierarchy(): StorageHierarchy {
    const rootId = crypto.randomUUID();
    const rootFolder: LocalStorageFolder = {
      id: rootId,
      name: 'Root',
      path: '/',
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      icon: 'folder_default'
    };

    // Create sample folders
    const projectsId = crypto.randomUUID();
    const projectsFolder: LocalStorageFolder = {
      id: projectsId,
      name: 'Projects',
      path: '/Projects/',
      parentId: rootId,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      icon: 'folder_project'
    };

    const documentsId = crypto.randomUUID();
    const documentsFolder: LocalStorageFolder = {
      id: documentsId,
      name: 'Important Documents',
      path: '/Important Documents/',
      parentId: rootId,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      icon: 'folder_important'
    };

    const teamId = crypto.randomUUID();
    const teamFolder: LocalStorageFolder = {
      id: teamId,
      name: 'Team Files',
      path: '/Team Files/',
      parentId: rootId,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      icon: 'folder_team'
    };

    const archiveId = crypto.randomUUID();
    const archiveFolder: LocalStorageFolder = {
      id: archiveId,
      name: 'Archive',
      path: '/Archive/',
      parentId: rootId,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      icon: 'folder_archive'
    };

    const personalId = crypto.randomUUID();
    const personalFolder: LocalStorageFolder = {
      id: personalId,
      name: 'Personal',
      path: '/Personal/',
      parentId: rootId,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      icon: 'folder_personal'
    };

    // Create a subfolder in Projects
    const projectAId = crypto.randomUUID();
    const projectAFolder: LocalStorageFolder = {
      id: projectAId,
      name: 'Project A',
      path: '/Projects/Project A/',
      parentId: projectsId,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      icon: 'folder_project'
    };

    // Create a shared folder in Team Files
    const sharedId = crypto.randomUUID();
    const sharedFolder: LocalStorageFolder = {
      id: sharedId,
      name: 'Shared Resources',
      path: '/Team Files/Shared Resources/',
      parentId: teamId,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      icon: 'folder_shared'
    };

    // Create a secure folder in Important Documents
    const secureId = crypto.randomUUID();
    const secureFolder: LocalStorageFolder = {
      id: secureId,
      name: 'Confidential',
      path: '/Important Documents/Confidential/',
      parentId: documentsId,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      icon: 'folder_secure'
    };

    return {
      folders: {
        [rootId]: rootFolder,
        [projectsId]: projectsFolder,
        [documentsId]: documentsFolder,
        [teamId]: teamFolder,
        [archiveId]: archiveFolder,
        [personalId]: personalFolder,
        [projectAId]: projectAFolder,
        [sharedId]: sharedFolder,
        [secureId]: secureFolder
      },
      files: {},
      rootFolderId: rootId
    };
  }

  private async seedFromServerDocuments(): Promise<void> {
    try {
      // 1) List files in server Documents
      const list: any = await this.http.get(`${environment.apiUrl}/documents`).toPromise();
      const files: string[] = Array.isArray(list?.files) ? list.files : [];
      if (files.length === 0) return;

      // Put server files directly under Root
      const rootId = this.storageHierarchy.rootFolderId;
      const root = this.storageHierarchy.folders[rootId];
      if (!root) return;

      for (const name of files) {
        try {
          if (typeof name !== 'string' || !name) {
            continue;
          }
          const idUrl = this.base64UrlEncode(name);

          // Mint a short-lived WOPI token for this filename (no file creation)
          const token = await this.getWopiAccessToken(name).catch(() => null);
          if (!token) {
            // Skip if token cannot be minted
            continue;
          }

          // 2) Fetch metadata (size, last modified)
          const info: any = await this.http
            .get(`${environment.apiUrl}/wopi/files/${idUrl}?access_token=${encodeURIComponent(token)}`)
            .toPromise()
            .catch(async (err) => {
              // If token expired, refresh once and retry
              if ((err as HttpErrorResponse)?.status === 401) {
                const refreshed = await this.getWopiAccessToken(name).catch(() => null);
                if (!refreshed) throw err;
                return await this.http
                  .get(`${environment.apiUrl}/wopi/files/${idUrl}?access_token=${encodeURIComponent(refreshed)}`)
                  .toPromise();
              }
              throw err;
            });

          // 3) Fetch bytes and convert to data URL
          const arrayBuffer = await this.http
            .get(
              `${environment.apiUrl}/wopi/files/${idUrl}/contents?access_token=${encodeURIComponent(token)}`,
              { responseType: 'arraybuffer' }
            )
            .toPromise()
            .catch(async (err) => {
              if ((err as HttpErrorResponse)?.status === 401) {
                const refreshed = await this.getWopiAccessToken(name).catch(() => null);
                if (!refreshed) throw err;
                return await this.http
                  .get(
                    `${environment.apiUrl}/wopi/files/${idUrl}/contents?access_token=${encodeURIComponent(refreshed)}`,
                    { responseType: 'arraybuffer' }
                  )
                  .toPromise();
              }
              throw err;
            });
          const mime = this.inferMimeType(name);
          const dataUrl = await this.blobToDataURL(new Blob([arrayBuffer as ArrayBuffer], { type: mime }));

          const existing = this.findFileByNameInFolder(rootId, name);
          const baseTimestamps = {
            createdAt: new Date(info?.LastModifiedTime || new Date()).toISOString(),
            updatedAt: new Date(info?.LastModifiedTime || new Date()).toISOString(),
          };
          if (existing) {
            existing.content = dataUrl;
            existing.mimeType = mime;
            existing.type = mime;
            existing.size = Number(info?.Size) || (arrayBuffer as ArrayBuffer).byteLength || 0;
            existing.path = `${root.path}${name}`;
            existing.createdBy = existing.createdBy || 'server';
            existing.createdAt = existing.createdAt || baseTimestamps.createdAt;
            existing.updatedAt = baseTimestamps.updatedAt;
          } else {
            const newFile: LocalStorageFile = {
              id: crypto.randomUUID(),
              name,
              content: dataUrl,
              mimeType: mime,
              type: mime,
              size: Number(info?.Size) || (arrayBuffer as ArrayBuffer).byteLength || 0,
              path: `${root.path}${name}`,
              folderId: rootId,
              createdBy: 'server',
              createdAt: baseTimestamps.createdAt,
              updatedAt: baseTimestamps.updatedAt,
            };
            this.storageHierarchy.files[newFile.id] = newFile;
          }
        } catch {
          // Skip file on error, continue others
        }
      }

      this.saveToStorage(this.storageHierarchy);
    } catch {
      // ignore seeding errors
    }
  }

  private async getWopiAccessToken(filename: string): Promise<string> {
    const authUser = this.authService.getAuthUser();
    const userId = encodeURIComponent(authUser?.id || 'currentUser');
    const userName = encodeURIComponent(authUser?.fullName || 'Current User');
    const url = `${environment.apiUrl}/wopi/refresh-token?filename=${encodeURIComponent(filename)}&mode=view&userId=${userId}&userName=${userName}`;
    const resp: any = await this.http.get(url).toPromise();
    return String(resp?.accessToken || resp?.access_token || '');
  }

  private findFileByNameInFolder(folderId: string, name: string): LocalStorageFile | null {
    const files = Object.values(this.storageHierarchy.files).filter(f => f.folderId === folderId && f.name === name);
    return files[0] || null;
  }

  private inferMimeType(filename: string): string {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.pdf')) return 'application/pdf';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.gif')) return 'image/gif';
    if (lower.endsWith('.svg')) return 'image/svg+xml';
    if (lower.endsWith('.txt') || lower.endsWith('.log')) return 'text/plain';
    if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'text/markdown';
    if (lower.endsWith('.csv')) return 'text/csv';
    if (lower.endsWith('.json')) return 'application/json';
    if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (lower.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (lower.endsWith('.pptx')) return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    if (lower.endsWith('.doc')) return 'application/msword';
    if (lower.endsWith('.xls')) return 'application/vnd.ms-excel';
    if (lower.endsWith('.ppt')) return 'application/vnd.ms-powerpoint';
    if (lower.endsWith('.excalidraw')) return 'application/json';
    return 'application/octet-stream';
  }

  private base64UrlEncode(input: string): string {
    const base64 = btoa(unescape(encodeURIComponent(input)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  private saveToStorage(hierarchy: StorageHierarchy): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(hierarchy));
      this.storageHierarchy = { ...hierarchy };
      this.hierarchySubject.next(this.storageHierarchy);
    } catch (e) {
      console.error('Failed to save to storage:', e);
      throw new Error('Failed to save to storage');
    }
  }

  getHierarchy(): Observable<StorageHierarchy> {
    return this.hierarchySubject.asObservable();
  }

  createFolder(name: string, parentId: string, icon?: string): LocalStorageFolder {
    const parent = this.storageHierarchy.folders[parentId];
    if (!parent) throw new Error('Parent folder not found');

    const newFolder: LocalStorageFolder = {
      id: crypto.randomUUID(),
      name,
      path: `${parent.path}${name}/`,
      parentId,
      createdBy: 'currentUser', // Replace with actual user ID
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      icon: icon || 'folder_default'
    };

    this.storageHierarchy.folders[newFolder.id] = newFolder;
    this.saveToStorage(this.storageHierarchy);
    return newFolder;
  }

  saveFile(file: File, folderId: string, metadata?: FileMetadata): Promise<LocalStorageFile> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const folder = this.getFolder(folderId);
        if (!folder) {
          throw new Error('Folder not found');
        }

        const newFile: LocalStorageFile = {
          id: crypto.randomUUID(),
          name: file.name,
          content: reader.result as string | ArrayBuffer,
          mimeType: file.type,
          type: file.type,
          size: file.size,
          path: `${folder.path}${file.name}`,
          folderId,
          createdBy: 'currentUser', // Replace with actual user ID
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: metadata ? {
            description: metadata.description,
            tags: [...metadata.tags]
          } : undefined
        };

        this.storageHierarchy.files[newFile.id] = newFile;
        this.saveToStorage(this.storageHierarchy);
        resolve(newFile);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file); // Store as base64 for binary files
    });
  }

  getFolder(folderId: string): LocalStorageFolder | null {
    return this.storageHierarchy.folders[folderId] || null;
  }

  getFile(fileId: string): LocalStorageFile | null {
    return this.storageHierarchy.files[fileId] || null;
  }

  getFiles(): LocalStorageFile[] | null {
    return Object.values(this.storageHierarchy.files) || null;
  }

  getFolderContents(folderId: string): { folders: LocalStorageFolder[], files: LocalStorageFile[] } {
    const folders = Object.values(this.storageHierarchy.folders)
      .filter(f => f.parentId === folderId);
    
    const files = Object.values(this.storageHierarchy.files)
      .filter(f => f.folderId === folderId);

    return { folders, files };
  }

  deleteFolder(folderId: string): void {
    // Don't allow deleting root
    if (folderId === this.storageHierarchy.rootFolderId) {
      throw new Error('Cannot delete root folder');
    }

    // Recursively delete subfolders
    Object.values(this.storageHierarchy.folders)
      .filter(f => f.parentId === folderId)
      .forEach(f => this.deleteFolder(f.id));

    // Delete contained files
    Object.values(this.storageHierarchy.files)
      .filter(f => f.folderId === folderId)
      .forEach(f => delete this.storageHierarchy.files[f.id]);

    // Delete the folder itself
    delete this.storageHierarchy.folders[folderId];
    this.saveToStorage(this.storageHierarchy);
  }

  deleteFile(fileId: string): void {
    delete this.storageHierarchy.files[fileId];
    this.saveToStorage(this.storageHierarchy);
  }

  moveFolder(folderId: string, newParentId: string): void {
    const folder = this.storageHierarchy.folders[folderId];
    const newParent = this.storageHierarchy.folders[newParentId];
    
    if (!folder || !newParent) throw new Error('Folder not found');
    if (folderId === this.storageHierarchy.rootFolderId) {
      throw new Error('Cannot move root folder');
    }

    folder.parentId = newParentId;
    folder.path = `${newParent.path}${folder.name}/`;
    folder.updatedAt = new Date().toISOString();
    
    this.saveToStorage(this.storageHierarchy);
  }

  moveFile(fileId: string, newFolderId: string): void {
    const file = this.storageHierarchy.files[fileId];
    if (!file) throw new Error('File not found');
    
    file.folderId = newFolderId;
    file.updatedAt = new Date().toISOString();
    
    this.saveToStorage(this.storageHierarchy);
  }

  async updateFileBinary(fileId: string, data: ArrayBuffer, mimeType: string, lastModifiedIso?: string): Promise<void> {
    const file = this.storageHierarchy.files[fileId];
    if (!file) throw new Error('File not found');
    // Convert ArrayBuffer to base64 data URL so we keep a consistent storage format
    const blob = new Blob([data], { type: mimeType });
    const base64 = await this.blobToDataURL(blob);
    file.content = base64;
    file.mimeType = mimeType;
    file.type = mimeType;
    file.size = blob.size;
    file.updatedAt = lastModifiedIso || new Date().toISOString();
    this.saveToStorage(this.storageHierarchy);
  }

  private blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to convert blob'));
      reader.readAsDataURL(blob);
    });
  }

  downloadFile(fileId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = this.storageHierarchy.files[fileId];
      if (!file) {
        reject(new Error('File not found'));
        return;
      }

      // Create a blob from the stored content
      let content = file.content;
      if (typeof content === 'string' && content.startsWith('data:')) {
        // Handle base64 data URLs
        const [header, base64Data] = content.split(',');
        const mimeType = header.match(/data:(.*?);/)?.[1] || 'application/octet-stream';
        content = atob(base64Data);
        const array = new Uint8Array(content.length);
        for (let i = 0; i < content.length; i++) {
          array[i] = content.charCodeAt(i);
        }
        content = array.buffer;
      }

      const blob = new Blob([content], { type: file.mimeType });
      const url = URL.createObjectURL(blob);

      // Create a temporary link and click it
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      resolve();
    });
  }
}