import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError, of, forkJoin } from 'rxjs';
import { map, catchError, tap, mergeMap, switchMap, take } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Folder {
  id: string;
  name: string;
  path: string;
  parentId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  permissions: FolderPermission[];
  icon?: string;
}

export interface FolderPermission {
  userId: string;
  accessLevel: 'read' | 'write' | 'admin';
  inherited?: boolean;
  source?: string;
}

export interface FolderSearchCriteria {
  name?: string;
  createdBy?: string;
  dateRange?: { start: Date; end: Date };
  permissions?: string[];
}

export interface FolderHierarchy {
  folder: Folder;
  children: FolderHierarchy[];
  expanded?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FolderService {
  private readonly apiUrl = `${environment.apiUrl}/folders`;
  private readonly maxNestingLevel = 10;

  constructor(private http: HttpClient) {}

  // UC-FC-01: Create Root Folder
  createRootFolder(name: string, permissions: FolderPermission[], icon?: string): Observable<Folder> {
    return this.validateFolderName(name).pipe(
      map(isValid => {
        if (!isValid) {
          throw new Error('Invalid folder name or duplicate');
        }
        return {
          name,
          path: `/${name}`,
          createdBy: 'currentUser',
          createdAt: new Date(),
          updatedAt: new Date(),
          permissions: [],
          icon
        } as Partial<Folder>;
      }),
      map(folder => ({ ...folder, id: crypto.randomUUID() } as Folder)),
      switchMap(folder => this.setFolderPermissions(folder.id, permissions).pipe(
        map(() => folder)
      )),
      catchError(error => throwError(() => error))
    );
  }

  validateFolderName(name: string, parentId?: string): Observable<boolean> {
    const params = new HttpParams()
      .set('name', name)
      .set('parentId', parentId || '');

    return this.http.get<boolean>(`${this.apiUrl}/validate-name`, { params }).pipe(
      catchError(() => of(false))
    );
  }

  setFolderPermissions(folderId: string, permissions: FolderPermission[]): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${folderId}/permissions`, { permissions }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  // UC-FC-02: Create Subfolder
  createSubfolder(parentId: string, name: string, icon?: string): Observable<Folder> {
    return this.validateNestingLevel(parentId).pipe(
      map(isValid => {
        if (!isValid) {
          throw new Error('Maximum nesting level exceeded');
        }
        return parentId;
      }),
      map(pid => ({
        name,
        parentId: pid,
        createdBy: 'currentUser',
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: [],
        icon
      } as Partial<Folder>)),
      map(folder => ({ ...folder, id: crypto.randomUUID() } as Folder)),
      switchMap(folder => this.inheritParentPermissions(folder.id, parentId).pipe(
        map(() => folder)
      )),
      catchError(error => throwError(() => error))
    );
  }

  inheritParentPermissions(folderId: string, parentId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${folderId}/inherit-permissions`, { parentId }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  validateNestingLevel(parentId: string): Observable<boolean> {
    return this.http.get<number>(`${this.apiUrl}/${parentId}/nesting-level`).pipe(
      map(level => level < this.maxNestingLevel),
      catchError(() => of(false))
    );
  }

  // UC-FN-01: Browse Folder Structure
  getFolderHierarchy(rootId?: string): Observable<FolderHierarchy> {
    const url = rootId ? `${this.apiUrl}/${rootId}/hierarchy` : `${this.apiUrl}/hierarchy`;
    return this.http.get<FolderHierarchy>(url).pipe(
      catchError(error => throwError(() => error))
    );
  }

  toggleFolderExpansion(folderId: string, expanded: boolean): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${folderId}/expanded`, { expanded }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  updateNavigationPath(folderId: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/${folderId}/path`).pipe(
      catchError(error => throwError(() => error))
    );
  }

  // UC-FN-02: Search and Filter Folders
  searchFolders(criteria: FolderSearchCriteria): Observable<Folder[]> {
    let params = new HttpParams();
    if (criteria.name) params = params.set('name', criteria.name);
    if (criteria.createdBy) params = params.set('createdBy', criteria.createdBy);
    if (criteria.dateRange) {
      params = params.set('startDate', criteria.dateRange.start.toISOString());
      params = params.set('endDate', criteria.dateRange.end.toISOString());
    }
    if (criteria.permissions) {
      criteria.permissions.forEach(p => params = params.append('permissions', p));
    }

    return this.http.get<Folder[]>(`${this.apiUrl}/search`, { params }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  applySearchFilters(folders: Folder[], criteria: FolderSearchCriteria): Folder[] {
    return folders.filter(folder => {
      let matches = true;
      if (criteria.name) {
        matches = matches && folder.name.toLowerCase().includes(criteria.name.toLowerCase());
      }
      if (criteria.createdBy) {
        matches = matches && folder.createdBy === criteria.createdBy;
      }
      if (criteria.dateRange) {
        const folderDate = new Date(folder.createdAt);
        matches = matches && 
          folderDate >= criteria.dateRange.start && 
          folderDate <= criteria.dateRange.end;
      }
      if (criteria.permissions) {
        matches = matches && criteria.permissions.every(p => 
          folder.permissions.some(fp => fp.userId === p)
        );
      }
      return matches;
    });
  }

  paginateResults(folders: Folder[], page: number, pageSize: number): Observable<{ items: Folder[], total: number }> {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = folders.slice(start, end);
    return of({ items, total: folders.length });
  }

  // UC-FP-01: View Folder Permissions
  getFolderPermissions(folderId: string): Observable<FolderPermission[]> {
    return this.http.get<FolderPermission[]>(`${this.apiUrl}/${folderId}/permissions`).pipe(
      catchError(error => throwError(() => error))
    );
  }

  getInheritedPermissions(folderId: string): Observable<FolderPermission[]> {
    return this.http.get<FolderPermission[]>(`${this.apiUrl}/${folderId}/inherited-permissions`).pipe(
      catchError(error => throwError(() => error))
    );
  }

  modifyFolderPermissions(folderId: string, changes: Partial<FolderPermission>[]): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${folderId}/permissions`, { changes }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  // UC-FP-02: Permission Inheritance
  manageInheritanceRules(folderId: string, inherit: boolean): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${folderId}/inheritance`, { inherit }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  resolvePermissionConflicts(folderId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${folderId}/resolve-conflicts`, {}).pipe(
      catchError(error => throwError(() => error))
    );
  }

  updateSubfolderPermissions(folderId: string, recursive: boolean): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${folderId}/update-subfolders`, { recursive }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  // UC-FP-03: Bulk Permission Updates
  updateMultipleFolderPermissions(folderIds: string[], permissions: FolderPermission[]): Observable<void> {
    return this.validateBulkChanges(folderIds, permissions).pipe(
      map(isValid => {
        if (!isValid) {
          throw new Error('Invalid bulk permission changes');
        }
        return folderIds;
      }),
      mergeMap((ids: string[]) => {
        const updates = ids.map((id: string) => this.setFolderPermissions(id, permissions));
        return updates.length > 0 ? updates[0].pipe(
          mergeMap(() => updates.slice(1).length > 0 ? updates.slice(1)[0] : of(void 0)),
          take(1)
        ) : of(void 0);
      }),
      catchError(error => throwError(() => error))
    );
  }

  validateBulkChanges(folderIds: string[], permissions: FolderPermission[]): Observable<boolean> {
    return this.http.post<boolean>(`${this.apiUrl}/validate-bulk-permissions`, {
      folderIds,
      permissions
    }).pipe(
      catchError(() => of(false))
    );
  }

  handlePartialFailures(results: Map<string, boolean>): Observable<void> {
    const failures = Array.from(results.entries())
      .filter(([_, success]) => !success)
      .map(([id]) => id);

    if (failures.length > 0) {
      return this.http.post<void>(`${this.apiUrl}/handle-failures`, { failures }).pipe(
        catchError(error => throwError(() => error))
      );
    }

    return of(void 0);
  }
} 