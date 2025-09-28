import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { FolderOperationsService } from './folder-operations.service';
import { FolderService } from './folder.service';
import { FolderCreationDialogComponent } from './folder-creation-dialog/folder-creation-dialog.component';
import { LocalStorageService } from '../document/storage/local-storage.service';
import { LocalStorageFile } from '../document/storage/storage.model';

describe('FolderOperationsService', () => {
  let service: FolderOperationsService;
  let folderService: jasmine.SpyObj<FolderService>;
  let dialog: jasmine.SpyObj<MatDialog>;

  beforeEach(() => {
    const folderServiceSpy = jasmine.createSpyObj('FolderService', [
      'createRootFolder',
      'createSubfolder',
      'getFolderPermissions'
    ]);

    const mockPermissions = [{ userId: 'user1', accessLevel: 'admin' as const }];
    folderServiceSpy.getFolderPermissions.and.returnValue(of(mockPermissions));

    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    const localStorageServiceSpy = jasmine.createSpyObj('LocalStorageService', [
      'saveFile',
      'getFolder',
      'getFolderContents',
      'deleteFolder',
      'moveFolder',
      'moveFile',
      'createFolder'
    ]);
    localStorageServiceSpy.saveFile.and.returnValue(Promise.resolve({ id: 'file-123', name: 'test.txt' }));
    localStorageServiceSpy.getFolder.and.returnValue({ id: 'folder-123', name: 'Test Folder', path: '/Test Folder', parentId: 'parent-123' });
    localStorageServiceSpy.getFolderContents.and.returnValue({ folders: [], files: [] });
    localStorageServiceSpy.createFolder.and.returnValue({ id: 'new-folder', name: 'Test Folder', path: '/Test Folder' });

    TestBed.configureTestingModule({
      providers: [
        FolderOperationsService,
        { provide: FolderService, useValue: folderServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: LocalStorageService, useValue: localStorageServiceSpy }
      ]
    });

    service = TestBed.inject(FolderOperationsService);
    folderService = TestBed.inject(FolderService) as jasmine.SpyObj<FolderService>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('executeOperation', () => {
    it('should handle new folder operation', fakeAsync(() => {
      const mockFolder = { id: 'new-folder', name: 'New Folder' };
      const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(mockFolder) });
      dialog.open.and.returnValue(dialogRefSpyObj);

      let result: any;
      service.executeOperation({ type: 'new', folderId: 'parent-123' }).subscribe(
        res => result = res
      );

      tick();

      expect(dialog.open).toHaveBeenCalledWith(FolderCreationDialogComponent, {
        data: { parentFolderId: 'parent-123' }
      });
      expect(result).toEqual({ success: true, folder: mockFolder });
    }));

    it('should handle upload file operation', fakeAsync(() => {
      const mockResult = { success: true };
      const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(mockResult) });
      dialog.open.and.returnValue(dialogRefSpyObj);

      let result: any;
      service.executeOperation({ type: 'upload', folderId: 'folder-123' }).subscribe(
        res => result = res
      );

      tick();

      expect(dialog.open).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    }));

    it('should handle edit operation', fakeAsync(() => {
      const mockFolder = { id: 'folder-123', name: 'Updated Folder' };
      const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(mockFolder) });
      dialog.open.and.returnValue(dialogRefSpyObj);

      let result: any;
      service.executeOperation({ type: 'edit', folderId: 'folder-123' }).subscribe(
        res => result = res
      );

      tick();

      expect(dialog.open).toHaveBeenCalled();
      expect(result).toEqual({ success: true, folder: mockFolder });
    }));

    it('should handle delete operation', fakeAsync(() => {
      let result: any;
      service.executeOperation({ type: 'delete', folderId: 'folder-123' }).subscribe(
        res => result = res
      );

      tick();

      expect(result).toEqual({ success: true, cancelled: false });
    }));

    it('should handle move operation', fakeAsync(() => {
      let result: any;
      service.executeOperation({ 
        type: 'move', 
        folderId: 'folder-123',
        data: { targetFolderId: 'target-folder' }
      }).subscribe(
        res => result = res
      );

      tick();

      expect(result).toEqual({ success: true, newPath: '/Test Folder' });
    }));

    it('should handle copy operation', fakeAsync(() => {
      let result: any;
      service.executeOperation({ 
        type: 'copy', 
        folderId: 'folder-123',
        data: { targetFolderId: 'target-folder' }
      }).subscribe(
        res => result = res
      );

      tick();

      expect(result).toEqual({ success: true, newPath: '/Test Folder' });
    }));

    it('should handle rename operation', fakeAsync(() => {
      let result: any;
      service.executeOperation({ 
        type: 'rename', 
        folderId: 'folder-123',
        data: { newName: 'Renamed Folder' }
      }).subscribe(
        res => result = res
      );

      tick();

      expect(result).toEqual({ success: true, newName: 'Renamed Folder' });
    }));

    it('should handle dialog cancellation', fakeAsync(() => {
      const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(null) });
      dialog.open.and.returnValue(dialogRefSpyObj);

      let result: any;
      service.executeOperation({ type: 'new', folderId: 'parent-123' }).subscribe(
        res => result = res
      );

      tick();

      expect(result).toEqual({ success: false, cancelled: true });
    }));

    it('should handle operation errors', fakeAsync(() => {
      let error: any;
      service.executeOperation({ type: 'invalid' as any, folderId: 'folder-123' }).subscribe({
        error: err => error = err
      });

      tick();

      expect(error.message).toBe('Unsupported operation');
    }));
  });

  describe('checkPermission', () => {
    it('should check operation permission', fakeAsync(() => {
      const mockPermissions = [{ userId: 'user1', accessLevel: 'admin' as const }];
      folderService.getFolderPermissions.and.returnValue(of(mockPermissions));

      let result: boolean | undefined;
      service.checkPermission('delete', 'folder-123').subscribe(
        res => result = res
      );

      tick();

      expect(folderService.getFolderPermissions).toHaveBeenCalledWith('folder-123');
      expect(result).toBe(true);
    }));

    it('should handle permission check errors', fakeAsync(() => {
      folderService.getFolderPermissions.and.returnValue(throwError(() => ({ message: 'Permission check failed' })));

      let result: boolean | undefined;
      service.checkPermission('delete', 'folder-123').subscribe(
        res => result = res
      );

      tick();

      expect(result).toBeFalsy();
    }));

    it('should deny permission for invalid operation type', fakeAsync(() => {
      let result: boolean | undefined;
      service.checkPermission('invalid' as any, 'folder-123').subscribe(
        res => result = res
      );

      tick();

      expect(result).toBe(false);
    }));

    it('should handle missing permissions', fakeAsync(() => {
      folderService.getFolderPermissions.and.returnValue(of([]));

      let result: boolean | undefined;
      service.checkPermission('delete', 'folder-123').subscribe(
        res => result = res
      );

      tick();

      expect(result).toBe(false);
    }));
  });
});