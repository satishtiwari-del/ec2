import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FolderService, Folder, FolderPermission, FolderSearchCriteria } from './folder.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { HttpErrorResponse } from '@angular/common/http';

describe('FolderService', () => {
  let service: FolderService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/folders`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FolderService]
    });
    service = TestBed.inject(FolderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // UC-FC-01: Create Root Folder
  describe('Root Folder Creation', () => {
    it('should create root level folder', fakeAsync(() => {
      const name = 'root-folder';
      const permissions: FolderPermission[] = [{
        userId: 'user1',
        accessLevel: 'admin'
      }];

      let result: Folder | undefined;

      // Call the service method
      service.createRootFolder(name, permissions).subscribe({
        next: (folder) => result = folder,
        error: fail
      });

      // Validate name check request
      const validateReq = httpMock.expectOne(`${apiUrl}/validate-name?name=${name}&parentId=`);
      expect(validateReq.request.method).toBe('GET');
      validateReq.flush(true);

      // Validate permissions request
      const permissionsReq = httpMock.expectOne(req => 
        req.url.startsWith(`${apiUrl}/`) && 
        req.url.endsWith('/permissions')
      );
      expect(permissionsReq.request.method).toBe('PUT');
      permissionsReq.flush(null);

      tick();

      expect(result).toBeDefined();
      expect(result?.name).toBe(name);
      expect(result?.path).toBe(`/${name}`);
    }));

    it('should validate folder name uniqueness', fakeAsync(() => {
      const name = 'test-folder';
      
      let result: boolean | undefined;

      service.validateFolderName(name).subscribe({
        next: (isValid) => result = isValid,
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/validate-name?name=${name}&parentId=`);
      expect(req.request.method).toBe('GET');
      req.flush(true);

      tick();
      expect(result).toBe(true);
    }));

    it('should set proper permissions', fakeAsync(() => {
      const folderId = 'folder-123';
      const permissions: FolderPermission[] = [{
        userId: 'user1',
        accessLevel: 'admin'
      }];

      service.setFolderPermissions(folderId, permissions).subscribe({
        next: () => {},
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/${folderId}/permissions`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ permissions });
      req.flush(null);

      tick();
    }));

    it('should handle invalid folder name', fakeAsync(() => {
      const name = 'invalid/folder';
      const permissions: FolderPermission[] = [{
        userId: 'user1',
        accessLevel: 'admin'
      }];

      service.createRootFolder(name, permissions).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid folder name or duplicate');
        }
      });

      const validateReq = httpMock.expectOne(`${apiUrl}/validate-name?name=${name}&parentId=`);
      validateReq.flush(false);

      tick();
    }));

    it('should handle permission setting error', fakeAsync(() => {
      const name = 'test-folder';
      const permissions: FolderPermission[] = [{
        userId: 'user1',
        accessLevel: 'admin'
      }];

      service.createRootFolder(name, permissions).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
          expect(error.status).toBe(403);
        }
      });

      const validateReq = httpMock.expectOne(`${apiUrl}/validate-name?name=${name}&parentId=`);
      validateReq.flush(true);

      // Wait for the folder ID to be generated
      tick();

      const permissionsReq = httpMock.expectOne(req => 
        req.url.includes('/permissions')
      );
      permissionsReq.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

      tick();
    }));

    it('should handle network error during validation', fakeAsync(() => {
      const name = 'test-folder';
      
      service.validateFolderName(name).subscribe({
        next: (isValid) => expect(isValid).toBe(false),
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/validate-name?name=${name}&parentId=`);
      req.error(new ErrorEvent('Network error'));

      tick();
    }));
  });

  // UC-FC-02: Create Subfolder
  describe('Subfolder Creation', () => {
    it('should create subfolder in existing folder', fakeAsync(() => {
      const parentId = 'parent-123';
      const name = 'subfolder';

      let result: Folder | undefined;

      service.createSubfolder(parentId, name).subscribe({
        next: (folder) => result = folder,
        error: fail
      });

      // Validate nesting level check
      const nestingReq = httpMock.expectOne(`${apiUrl}/${parentId}/nesting-level`);
      expect(nestingReq.request.method).toBe('GET');
      nestingReq.flush(5); // Valid nesting level

      // Wait for the folder ID to be generated
      tick();

      // Validate inheritance request
      const inheritReq = httpMock.expectOne(req => 
        req.url.includes('/inherit-permissions')
      );
      expect(inheritReq.request.method).toBe('POST');
      inheritReq.flush(null);

      tick();

      expect(result).toBeDefined();
      expect(result?.name).toBe(name);
      expect(result?.parentId).toBe(parentId);
    }));

    it('should inherit parent permissions', fakeAsync(() => {
      const folderId = 'folder-123';
      const parentId = 'parent-123';

      service.inheritParentPermissions(folderId, parentId).subscribe({
        next: () => {},
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/${folderId}/inherit-permissions`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ parentId });
      req.flush(null);

      tick();
    }));

    it('should validate nested level limits', fakeAsync(() => {
      const parentId = 'parent-123';

      let result: boolean | undefined;

      service.validateNestingLevel(parentId).subscribe({
        next: (isValid) => result = isValid,
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/${parentId}/nesting-level`);
      expect(req.request.method).toBe('GET');
      req.flush(5); // Valid nesting level

      tick();
      expect(result).toBe(true);
    }));

    it('should handle maximum nesting level', fakeAsync(() => {
      const parentId = 'parent-123';
      const name = 'subfolder';

      service.createSubfolder(parentId, name).subscribe({
        error: (error) => {
          expect(error.message).toBe('Maximum nesting level exceeded');
        }
      });

      const nestingReq = httpMock.expectOne(`${apiUrl}/${parentId}/nesting-level`);
      nestingReq.flush(10); // Max nesting level

      tick();
    }));

    it('should handle inheritance error', fakeAsync(() => {
      const parentId = 'parent-123';
      const name = 'subfolder';

      service.createSubfolder(parentId, name).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
          expect(error.status).toBe(404);
        }
      });

      const nestingReq = httpMock.expectOne(`${apiUrl}/${parentId}/nesting-level`);
      nestingReq.flush(5);

      // Wait for the folder ID to be generated
      tick();

      const inheritReq = httpMock.expectOne(req => 
        req.url.includes('/inherit-permissions')
      );
      inheritReq.flush('Not Found', { status: 404, statusText: 'Not Found' });

      tick();
    }));

    it('should handle network error during nesting validation', fakeAsync(() => {
      const parentId = 'parent-123';

      service.validateNestingLevel(parentId).subscribe({
        next: (isValid) => expect(isValid).toBe(false),
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/${parentId}/nesting-level`);
      req.error(new ErrorEvent('Network error'));

      tick();
    }));
  });

  // UC-FN-01: Browse Folder Structure
  describe('Folder Navigation', () => {
    it('should display folder hierarchy', fakeAsync(() => {
      const mockHierarchy = {
        folder: { id: 'root', name: 'root', path: '/root' } as Folder,
        children: []
      };

      service.getFolderHierarchy().subscribe({
        next: (hierarchy) => expect(hierarchy).toEqual(mockHierarchy),
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/hierarchy`);
      expect(req.request.method).toBe('GET');
      req.flush(mockHierarchy);

      tick();
    }));

    it('should handle folder expansion/collapse', fakeAsync(() => {
      const folderId = 'folder-123';
      const expanded = true;

      service.toggleFolderExpansion(folderId, expanded).subscribe({
        next: () => {},
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/${folderId}/expanded`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ expanded });
      req.flush(null);

      tick();
    }));

    it('should update navigation path', fakeAsync(() => {
      const folderId = 'folder-123';
      const mockPath = ['/root', '/root/folder-123'];

      service.updateNavigationPath(folderId).subscribe({
        next: (path) => expect(path).toEqual(mockPath),
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/${folderId}/path`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPath);

      tick();
    }));

    it('should handle navigation errors gracefully', (done) => {
      const folderId = 'invalid-folder';

      service.updateNavigationPath(folderId).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${folderId}/path`);
      req.error(new ErrorEvent('Network error'));
    });

    it('should handle empty folder hierarchy', fakeAsync(() => {
      const mockEmptyHierarchy = {
        folder: { id: 'root', name: 'root', path: '/root' } as Folder,
        children: []
      };

      service.getFolderHierarchy().subscribe({
        next: (hierarchy) => {
          expect(hierarchy.children.length).toBe(0);
          expect(hierarchy.folder.id).toBe('root');
        },
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/hierarchy`);
      req.flush(mockEmptyHierarchy);

      tick();
    }));

    it('should handle deep folder hierarchy', fakeAsync(() => {
      const mockHierarchy = {
        folder: { id: 'root', name: 'root', path: '/root' } as Folder,
        children: [{
          folder: { id: 'child1', name: 'child1', path: '/root/child1' } as Folder,
          children: [{
            folder: { id: 'child2', name: 'child2', path: '/root/child1/child2' } as Folder,
            children: []
          }]
        }]
      };

      service.getFolderHierarchy().subscribe({
        next: (hierarchy) => {
          expect(hierarchy).toEqual(mockHierarchy);
          expect(hierarchy.children[0].children[0].folder.path).toBe('/root/child1/child2');
        },
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/hierarchy`);
      req.flush(mockHierarchy);

      tick();
    }));

    it('should handle expansion toggle error', fakeAsync(() => {
      const folderId = 'folder-123';
      const expanded = true;

      service.toggleFolderExpansion(folderId, expanded).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${folderId}/expanded`);
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });

      tick();
    }));

    it('should handle non-existent folder in navigation path', fakeAsync(() => {
      const folderId = 'non-existent';

      service.updateNavigationPath(folderId).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${folderId}/path`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      tick();
    }));

    it('should get folder hierarchy with rootId', fakeAsync(() => {
      const rootId = 'root-123';
      const mockHierarchy = {
        folder: { id: rootId, name: 'root', path: '/root' } as Folder,
        children: []
      };

      service.getFolderHierarchy(rootId).subscribe({
        next: (hierarchy) => expect(hierarchy).toEqual(mockHierarchy),
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/${rootId}/hierarchy`);
      expect(req.request.method).toBe('GET');
      req.flush(mockHierarchy);

      tick();
    }));

    it('should handle folder hierarchy error', fakeAsync(() => {
      service.getFolderHierarchy().subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/hierarchy`);
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });

      tick();
    }));

    it('should handle folder expansion error', fakeAsync(() => {
      const folderId = 'folder-123';
      const expanded = true;

      service.toggleFolderExpansion(folderId, expanded).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${folderId}/expanded`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      tick();
    }));
  });

  // UC-FN-02: Search and Filter Folders
  describe('Folder Search', () => {
    it('should search folders by name', fakeAsync(() => {
      const criteria: FolderSearchCriteria = { name: 'test' };
      const mockResults = [{ id: '1', name: 'test' } as Folder];

      service.searchFolders(criteria).subscribe({
        next: (folders) => expect(folders).toEqual(mockResults),
        error: fail
      });

      const req = httpMock.expectOne(req => req.url === `${apiUrl}/search` && req.params.get('name') === 'test');
      expect(req.request.method).toBe('GET');
      req.flush(mockResults);

      tick();
    }));

    it('should filter by multiple criteria', () => {
      const folders = [
        { id: '1', name: 'test1', createdBy: 'user1', createdAt: new Date('2024-01-01') } as Folder,
        { id: '2', name: 'test2', createdBy: 'user2', createdAt: new Date('2024-01-02') } as Folder
      ];

      const criteria: FolderSearchCriteria = {
        name: 'test1',
        createdBy: 'user1'
      };

      const filtered = service.applySearchFilters(folders, criteria);
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should paginate results', fakeAsync(() => {
      const folders = Array.from({ length: 10 }, (_, i) => ({
        id: `folder-${i}`,
        name: `Folder ${i}`
      } as Folder));

      service.paginateResults(folders, 2, 3).subscribe({
        next: (result) => {
          expect(result.items.length).toBe(3);
          expect(result.total).toBe(10);
          expect(result.items[0].id).toBe('folder-3');
        },
        error: fail
      });

      tick();
    }));

    it('should handle invalid date ranges', () => {
      const folders = [
        { id: '1', name: 'test1', createdBy: 'user1', createdAt: new Date('2024-01-01') } as Folder
      ];

      const criteria: FolderSearchCriteria = {
        dateRange: {
          start: new Date('2024-02-01'),
          end: new Date('2024-01-01') // End before start
        }
      };

      const filtered = service.applySearchFilters(folders, criteria);
      expect(filtered.length).toBe(0);
    });

    it('should handle special characters in search', () => {
      const folders = [
        { id: '1', name: 'test#1', createdBy: 'user1', createdAt: new Date() } as Folder,
        { id: '2', name: 'test@2', createdBy: 'user1', createdAt: new Date() } as Folder
      ];

      const criteria: FolderSearchCriteria = {
        name: '#'
      };

      const filtered = service.applySearchFilters(folders, criteria);
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should search with all criteria', fakeAsync(() => {
      const criteria: FolderSearchCriteria = {
        name: 'test',
        createdBy: 'user1',
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        },
        permissions: ['user1', 'user2']
      };

      service.searchFolders(criteria).subscribe({
        next: () => {},
        error: fail
      });

      const req = httpMock.expectOne(req => {
        const params = req.params;
        const name = params.get('name');
        const createdBy = params.get('createdBy');
        const startDate = params.get('startDate');
        const endDate = params.get('endDate');
        const permissions = params.getAll('permissions') || [];
        return req.url === `${apiUrl}/search` &&
          name === 'test' &&
          createdBy === 'user1' &&
          startDate === '2024-01-01T00:00:00.000Z' &&
          endDate === '2024-12-31T00:00:00.000Z' &&
          permissions.join(',') === 'user1,user2';
      });
      expect(req.request.method).toBe('GET');
      req.flush([]);

      tick();
    }));

    it('should filter by permissions', () => {
      const folders = [
        {
          id: '1',
          name: 'test1',
          permissions: [
            { userId: 'user1', accessLevel: 'read' },
            { userId: 'user2', accessLevel: 'write' }
          ]
        } as Folder,
        {
          id: '2',
          name: 'test2',
          permissions: [
            { userId: 'user3', accessLevel: 'admin' }
          ]
        } as Folder
      ];

      const criteria: FolderSearchCriteria = {
        permissions: ['user1', 'user2']
      };

      const filtered = service.applySearchFilters(folders, criteria);
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('1');
    });
  });

  // UC-FP-01: View Folder Permissions
  describe('Folder Permissions', () => {
    it('should display current permissions', fakeAsync(() => {
      const folderId = 'folder-123';
      const mockPermissions: FolderPermission[] = [{
        userId: 'user1',
        accessLevel: 'admin'
      }];

      service.getFolderPermissions(folderId).subscribe({
        next: (permissions) => expect(permissions).toEqual(mockPermissions),
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/${folderId}/permissions`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPermissions);

      tick();
    }));

    it('should show inherited permissions', fakeAsync(() => {
      const folderId = 'folder-123';
      const mockPermissions: FolderPermission[] = [{
        userId: 'user1',
        accessLevel: 'admin',
        inherited: true,
        source: 'parent-123'
      }];

      service.getInheritedPermissions(folderId).subscribe({
        next: (permissions) => expect(permissions).toEqual(mockPermissions),
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/${folderId}/inherited-permissions`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPermissions);

      tick();
    }));

    it('should modify folder permissions', fakeAsync(() => {
      const folderId = 'folder-123';
      const changes: Partial<FolderPermission>[] = [{
        userId: 'user1',
        accessLevel: 'write'
      }];

      service.modifyFolderPermissions(folderId, changes).subscribe({
        next: () => {},
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/${folderId}/permissions`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ changes });
      req.flush(null);

      tick();
    }));

    it('should handle get permissions error', fakeAsync(() => {
      const folderId = 'folder-123';

      service.getFolderPermissions(folderId).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${folderId}/permissions`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      tick();
    }));

    it('should handle get inherited permissions error', fakeAsync(() => {
      const folderId = 'folder-123';

      service.getInheritedPermissions(folderId).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${folderId}/inherited-permissions`);
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });

      tick();
    }));

    it('should handle modify permissions error', fakeAsync(() => {
      const folderId = 'folder-123';
      const changes: Partial<FolderPermission>[] = [{
        userId: 'user1',
        accessLevel: 'write'
      }];

      service.modifyFolderPermissions(folderId, changes).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${folderId}/permissions`);
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });

      tick();
    }));

    it('should get folder permissions', fakeAsync(() => {
      const folderId = 'folder-123';
      const mockPermissions: FolderPermission[] = [{
        userId: 'user1',
        accessLevel: 'read'
      }];

      service.getFolderPermissions(folderId).subscribe({
        next: (permissions) => expect(permissions).toEqual(mockPermissions),
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/${folderId}/permissions`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPermissions);

      tick();
    }));

    it('should get inherited permissions', fakeAsync(() => {
      const folderId = 'folder-123';
      const mockPermissions: FolderPermission[] = [{
        userId: 'user1',
        accessLevel: 'read',
        inherited: true,
        source: 'parent-123'
      }];

      service.getInheritedPermissions(folderId).subscribe({
        next: (permissions) => expect(permissions).toEqual(mockPermissions),
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/${folderId}/inherited-permissions`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPermissions);

      tick();
    }));

    it('should modify folder permissions', fakeAsync(() => {
      const folderId = 'folder-123';
      const changes: Partial<FolderPermission>[] = [{
        userId: 'user1',
        accessLevel: 'write'
      }];

      service.modifyFolderPermissions(folderId, changes).subscribe({
        next: () => {},
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/${folderId}/permissions`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ changes });
      req.flush(null);

      tick();
    }));
  });

  // UC-FP-02: Permission Inheritance
  describe('Permission Inheritance', () => {
    it('should manage inheritance rules', fakeAsync(() => {
      const folderId = 'folder-123';
      const inherit = true;

      service.manageInheritanceRules(folderId, inherit).subscribe({
        next: () => {},
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/${folderId}/inheritance`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ inherit });
      req.flush(null);

      tick();
    }));

    it('should resolve permission conflicts', fakeAsync(() => {
      const folderId = 'folder-123';

      service.resolvePermissionConflicts(folderId).subscribe({
        next: () => {},
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/${folderId}/resolve-conflicts`);
      expect(req.request.method).toBe('POST');
      req.flush(null);

      tick();
    }));

    it('should update subfolder permissions', fakeAsync(() => {
      const folderId = 'folder-123';
      const recursive = true;

      service.updateSubfolderPermissions(folderId, recursive).subscribe({
        next: () => {},
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/${folderId}/update-subfolders`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ recursive });
      req.flush(null);

      tick();
    }));

    it('should handle circular inheritance', fakeAsync(() => {
      const folderId = 'folder-123';
      const parentId = 'parent-123';

      service.inheritParentPermissions(folderId, parentId).subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
          expect(error.error).toBe('Circular inheritance detected');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${folderId}/inherit-permissions`);
      req.flush('Circular inheritance detected', { status: 400, statusText: 'Bad Request' });

      tick();
    }));

    it('should validate permission access levels', fakeAsync(() => {
      const folderId = 'folder-123';
      const invalidPermissions: FolderPermission[] = [{
        userId: 'user1',
        accessLevel: 'invalid' as any
      }];

      service.setFolderPermissions(folderId, invalidPermissions).subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
          expect(error.error).toBe('Invalid access level');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${folderId}/permissions`);
      req.flush('Invalid access level', { status: 400, statusText: 'Bad Request' });

      tick();
    }));

    it('should handle network error during inheritance rule update', fakeAsync(() => {
      const folderId = 'folder-123';
      const inherit = true;

      service.manageInheritanceRules(folderId, inherit).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
          expect(error.status).toBe(0);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${folderId}/inheritance`);
      req.error(new ErrorEvent('Network error'));

      tick();
    }));

    it('should handle unresolvable permission conflicts', fakeAsync(() => {
      const folderId = 'folder-123';

      service.resolvePermissionConflicts(folderId).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
          expect(error.status).toBe(409);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${folderId}/resolve-conflicts`);
      req.flush('Conflict', { status: 409, statusText: 'Conflict' });

      tick();
    }));

    it('should handle recursive update failure', fakeAsync(() => {
      const folderId = 'folder-123';
      const recursive = true;

      service.updateSubfolderPermissions(folderId, recursive).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${folderId}/update-subfolders`);
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });

      tick();
    }));

    it('should handle inheritance rules error', fakeAsync(() => {
      const folderId = 'folder-123';
      const inherit = true;

      service.manageInheritanceRules(folderId, inherit).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
          expect(error.status).toBe(409);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${folderId}/inheritance`);
      req.flush('Conflict', { status: 409, statusText: 'Conflict' });

      tick();
    }));

    it('should handle permission conflicts error', fakeAsync(() => {
      const folderId = 'folder-123';

      service.resolvePermissionConflicts(folderId).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${folderId}/resolve-conflicts`);
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });

      tick();
    }));

    it('should handle subfolder permissions error', fakeAsync(() => {
      const folderId = 'folder-123';
      const recursive = true;

      service.updateSubfolderPermissions(folderId, recursive).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${folderId}/update-subfolders`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      tick();
    }));
  });

  // UC-FP-03: Bulk Permission Updates
  describe('Bulk Permission Updates', () => {
    it('should update multiple folder permissions', fakeAsync(() => {
      const folderIds = ['folder-1', 'folder-2'];
      const permissions: FolderPermission[] = [{
        userId: 'user1',
        accessLevel: 'write'
      }];

      service.updateMultipleFolderPermissions(folderIds, permissions).subscribe({
        next: () => {},
        error: fail
      });

      // Validate bulk changes request
      const validateReq = httpMock.expectOne(`${apiUrl}/validate-bulk-permissions`);
      expect(validateReq.request.method).toBe('POST');
      validateReq.flush(true);

      // Validate individual permission updates
      folderIds.forEach(id => {
        const req = httpMock.expectOne(`${apiUrl}/${id}/permissions`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({ permissions });
        req.flush(null);
      });

      tick();
    }));

    it('should validate bulk changes', fakeAsync(() => {
      const folderIds = ['folder-1', 'folder-2'];
      const permissions: FolderPermission[] = [{
        userId: 'user1',
        accessLevel: 'write'
      }];

      service.validateBulkChanges(folderIds, permissions).subscribe({
        next: (isValid) => expect(isValid).toBe(true),
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/validate-bulk-permissions`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ folderIds, permissions });
      req.flush(true);

      tick();
    }));

    it('should handle partial failures', fakeAsync(() => {
      const results = new Map<string, boolean>([
        ['folder-1', false],
        ['folder-2', true]
      ]);

      service.handlePartialFailures(results).subscribe({
        next: () => {},
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/handle-failures`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ failures: ['folder-1'] });
      req.flush(null);

      tick();
    }));

    it('should handle timeout during bulk updates', fakeAsync(() => {
      const folderIds = ['folder-1', 'folder-2', 'folder-3'];
      const permissions: FolderPermission[] = [{
        userId: 'user1',
        accessLevel: 'write'
      }];

      service.updateMultipleFolderPermissions(folderIds, permissions).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid bulk permission changes');
        }
      });

      const validateReq = httpMock.expectOne(`${apiUrl}/validate-bulk-permissions`);
      validateReq.flush(false);

      tick();
    }));

    it('should rollback failed bulk operations', fakeAsync(() => {
      const results = new Map<string, boolean>([
        ['folder-1', false],
        ['folder-2', false],
        ['folder-3', true]
      ]);

      service.handlePartialFailures(results).subscribe({
        next: () => {},
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/handle-failures`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.failures).toEqual(['folder-1', 'folder-2']);
      req.flush(null);

      tick();
    }));

    it('should handle validation error during bulk update', fakeAsync(() => {
      const folderIds = ['folder-1', 'folder-2'];
      const permissions: FolderPermission[] = [{
        userId: 'user1',
        accessLevel: 'write'
      }];

      service.validateBulkChanges(folderIds, permissions).subscribe({
        next: (isValid) => expect(isValid).toBe(false),
        error: fail
      });

      const req = httpMock.expectOne(`${apiUrl}/validate-bulk-permissions`);
      req.error(new ErrorEvent('Network error'));

      tick();
    }));

    it('should handle partial update failures with network error', fakeAsync(() => {
      const folderIds = ['folder-1', 'folder-2'];
      const permissions: FolderPermission[] = [{
        userId: 'user1',
        accessLevel: 'write'
      }];

      service.updateMultipleFolderPermissions(folderIds, permissions).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
          expect(error.status).toBe(0);
        }
      });

      const validateReq = httpMock.expectOne(`${apiUrl}/validate-bulk-permissions`);
      validateReq.flush(true);

      const updateReq1 = httpMock.expectOne(`${apiUrl}/folder-1/permissions`);
      updateReq1.error(new ErrorEvent('Network error'));

      // The second request should not be made since the first one failed
      httpMock.expectNone(`${apiUrl}/folder-2/permissions`);

      tick();
    }));

    it('should handle failure tracking error', fakeAsync(() => {
      const results = new Map<string, boolean>([
        ['folder-1', false],
        ['folder-2', true]
      ]);

      service.handlePartialFailures(results).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/handle-failures`);
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });

      tick();
    }));

    it('should handle empty results in partial failures', fakeAsync(() => {
      const results = new Map<string, boolean>([
        ['folder-1', true],
        ['folder-2', true]
      ]);

      service.handlePartialFailures(results).subscribe({
        next: () => expect().nothing(),
        error: fail
      });

      // No request should be made since there are no failures
      httpMock.expectNone(`${apiUrl}/handle-failures`);

      tick();
    }));
  });
}); 