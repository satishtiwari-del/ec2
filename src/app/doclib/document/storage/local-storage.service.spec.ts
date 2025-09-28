import { TestBed } from '@angular/core/testing';
import { LocalStorageService } from './local-storage.service';
import { LocalStorageFile, LocalStorageFolder, StorageHierarchy, FileMetadata } from './storage.model';
import { firstValueFrom } from 'rxjs';

describe('LocalStorageService', () => {
  let service: LocalStorageService;
  let mockLocalStorage: { [key: string]: string };
  let mockCryptoUUID: string[];
  let uuidCounter: number;

  const STORAGE_KEY = 'doclib_storage';

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};
    uuidCounter = 0;
    mockCryptoUUID = [
      '123e4567-e89b-12d3-a456-426614174000', // root-id
      '987fcdeb-51a2-43d7-9012-345678901234', // folder-1
      'abc12345-6789-def0-1234-567890123456', // file-1
      'def67890-1234-5678-9abc-def012345678', // folder-2
      'fed98765-4321-cba0-9876-543210987654'  // file-2
    ];

    // Mock window.localStorage
    const getItemSpy = spyOn(localStorage, 'getItem');
    getItemSpy.and.callFake(key => mockLocalStorage[key]);
    
    const setItemSpy = spyOn(localStorage, 'setItem');
    setItemSpy.and.callFake((key, value) => mockLocalStorage[key] = value);
    
    // Mock crypto.randomUUID
    spyOn(crypto, 'randomUUID').and.callFake(() => mockCryptoUUID[uuidCounter++] as `${string}-${string}-${string}-${string}-${string}`);

    TestBed.configureTestingModule({
      providers: [LocalStorageService]
    });

    service = TestBed.inject(LocalStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize empty storage with root folder when storage is empty', async () => {
      const hierarchy = await firstValueFrom(service.getHierarchy());
      
      const rootId = '123e4567-e89b-12d3-a456-426614174000';
      expect(hierarchy.rootFolderId).toBe(rootId);
      expect(hierarchy.folders[rootId]).toBeTruthy();
      expect(hierarchy.folders[rootId].name).toBe('Root');
      expect(hierarchy.folders[rootId].path).toBe('/');
      expect(Object.keys(hierarchy.files)).toHaveSize(0);
    });


    describe('saveToStorage error handling', () => {
      let consoleErrorSpy: jasmine.Spy;

      beforeEach(() => {
        consoleErrorSpy = spyOn(console, 'error');
      });

      it('should handle localStorage errors', async () => {
        // Simulate localStorage error
        const testError = new Error('Storage quota exceeded');
        (localStorage.setItem as jasmine.Spy).and.throwError(testError);

        // Create a folder to trigger saveToStorage
        try {
          service.createFolder('Test', mockCryptoUUID[0]);
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.message).toBe('Failed to save to storage');
          expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save to storage:', testError);
        }
      });

      it('should handle JSON stringify errors', async () => {
        // Create circular reference to cause JSON.stringify to fail
        const circularObj: any = {};
        circularObj.self = circularObj;
        
        try {
          service['saveToStorage']({
            rootFolderId: 'test',
            folders: circularObj,
            files: {}
          });
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.message).toBe('Failed to save to storage');
          expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save to storage:', jasmine.any(Error));
        }
      });
    });

    describe('loadFromStorage validation', () => {
      let consoleErrorSpy: jasmine.Spy;

      beforeEach(() => {
        consoleErrorSpy = spyOn(console, 'error');
      });

      it('should handle invalid JSON data', async () => {
        mockLocalStorage[STORAGE_KEY] = 'invalid-json{';

        service = TestBed.inject(LocalStorageService);
        const hierarchy = await firstValueFrom(service.getHierarchy());

        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to parse storage:', jasmine.any(Error));
        expect(hierarchy.rootFolderId).toBeTruthy();
        expect(Object.keys(hierarchy.folders)).toHaveSize(1);
      });

      it('should handle non-object data', async () => {
        mockLocalStorage[STORAGE_KEY] = JSON.stringify("string data");

        service = TestBed.inject(LocalStorageService);
        const hierarchy = await firstValueFrom(service.getHierarchy());

        expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid storage format');
        expect(hierarchy.rootFolderId).toBeTruthy();
        expect(Object.keys(hierarchy.folders)).toHaveSize(1);
      });

      it('should handle missing required fields', async () => {
        // Missing files field
        mockLocalStorage[STORAGE_KEY] = JSON.stringify({
          rootFolderId: 'root-1',
          folders: {}
        });

        service = TestBed.inject(LocalStorageService);
        const hierarchy = await firstValueFrom(service.getHierarchy());

        expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid storage format');
        expect(hierarchy.rootFolderId).toBeTruthy();
        expect(Object.keys(hierarchy.folders)).toHaveSize(1);
      });

      it('should handle missing root folder', async () => {
        mockLocalStorage[STORAGE_KEY] = JSON.stringify({
          rootFolderId: 'root-1',
          folders: {
            'other-folder': {}
          },
          files: {}
        });

        service = TestBed.inject(LocalStorageService);
        const hierarchy = await firstValueFrom(service.getHierarchy());

        expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid storage format');
        expect(hierarchy.rootFolderId).toBeTruthy();
        expect(Object.keys(hierarchy.folders)).toHaveSize(1);
      });

      it('should handle invalid folders type', async () => {
        mockLocalStorage[STORAGE_KEY] = JSON.stringify({
          rootFolderId: 'root-1',
          folders: 'not-an-object',
          files: {}
        });

        service = TestBed.inject(LocalStorageService);
        const hierarchy = await firstValueFrom(service.getHierarchy());

        expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid storage format');
        expect(hierarchy.rootFolderId).toBeTruthy();
        expect(Object.keys(hierarchy.folders)).toHaveSize(1);
      });

      it('should successfully load valid storage data', async () => {
        const validRootId = mockCryptoUUID[0];
        const validData = {
          rootFolderId: validRootId,
          folders: {
            [validRootId]: {
              id: validRootId,
              name: 'Root',
              path: '/',
              createdBy: 'system',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          },
          files: {}
        };
        mockLocalStorage[STORAGE_KEY] = JSON.stringify(validData);

        service = TestBed.inject(LocalStorageService);
        const hierarchy = await firstValueFrom(service.getHierarchy());

        expect(consoleErrorSpy).not.toHaveBeenCalled();
        expect(hierarchy).toEqual(validData);
      });
    });
  });

  describe('folder operations', () => {
    let rootId: string;

    beforeEach(async () => {
      const hierarchy = await firstValueFrom(service.getHierarchy());
      rootId = hierarchy.rootFolderId;
    });

    it('should create a folder', () => {
      const folder = service.createFolder('Test Folder', rootId);

      expect(folder.id).toBe('987fcdeb-51a2-43d7-9012-345678901234');
      expect(folder.name).toBe('Test Folder');
      expect(folder.path).toBe('/Test Folder/');
      expect(folder.parentId).toBe(rootId);
    });

    it('should throw error when creating folder with invalid parent', () => {
      expect(() => service.createFolder('Test', 'invalid-id'))
        .toThrowError('Parent folder not found');
    });

    it('should get folder by id', () => {
      const folder = service.createFolder('Test', rootId);
      const retrieved = service.getFolder(folder.id);

      expect(retrieved).toEqual(folder);
    });

    it('should return null for non-existent folder', () => {
      expect(service.getFolder('non-existent')).toBeNull();
    });

    it('should get folder contents', () => {
      const folder = service.createFolder('Parent', rootId);
      service.createFolder('Child', folder.id);
      
      const contents = service.getFolderContents(folder.id);
      expect(contents.folders).toHaveSize(1);
      expect(contents.files).toHaveSize(0);
    });

    it('should delete folder and its contents', () => {
      const folder = service.createFolder('Parent', rootId);
      const subFolder = service.createFolder('Child', folder.id);
      
      service.deleteFolder(folder.id);

      expect(service.getFolder(folder.id)).toBeNull();
      expect(service.getFolder(subFolder.id)).toBeNull();
    });

    it('should not allow deleting root folder', () => {
      expect(() => service.deleteFolder(rootId))
        .toThrowError('Cannot delete root folder');
    });

    it('should move folder to new parent', () => {
      const folder1 = service.createFolder('Folder1', rootId);
      const folder2 = service.createFolder('Folder2', rootId);

      service.moveFolder(folder1.id, folder2.id);
      const moved = service.getFolder(folder1.id);

      expect(moved?.parentId).toBe(folder2.id);
      expect(moved?.path).toBe('/Folder2/Folder1/');
    });

    it('should not allow moving root folder', () => {
      const folder = service.createFolder('Test', rootId);
      expect(() => service.moveFolder(rootId, folder.id))
        .toThrowError('Cannot move root folder');
    });
  });

  describe('file operations', () => {
    let rootId: string;
    let testFile: File;
    let testMetadata: FileMetadata;

    beforeEach(async () => {
      const hierarchy = await firstValueFrom(service.getHierarchy());
      rootId = hierarchy.rootFolderId;

      // Create a test file
      const blob = new Blob(['test content'], { type: 'text/plain' });
      testFile = new File([blob], 'test.txt', { type: 'text/plain' });

      testMetadata = {
        description: 'Test file',
        tags: ['test', 'document']
      };
    });

    it('should save file with metadata', async () => {
      const savedFile = await service.saveFile(testFile, rootId, testMetadata);

      expect(savedFile.id).toBeTruthy();
      expect(savedFile.name).toBe('test.txt');
      expect(savedFile.mimeType).toBe('text/plain');
      expect(savedFile.folderId).toBe(rootId);
      expect(savedFile.metadata).toEqual(testMetadata);
    });

    it('should get file by id', async () => {
      const savedFile = await service.saveFile(testFile, rootId);
      const retrieved = service.getFile(savedFile.id);

      expect(retrieved).toEqual(savedFile);
    });

    it('should return null for non-existent file', () => {
      expect(service.getFile('non-existent')).toBeNull();
    });

    it('should delete file', async () => {
      const savedFile = await service.saveFile(testFile, rootId);
      service.deleteFile(savedFile.id);

      expect(service.getFile(savedFile.id)).toBeNull();
    });

    it('should move file to new folder', async () => {
      const folder = service.createFolder('NewFolder', rootId);
      const savedFile = await service.saveFile(testFile, rootId);

      service.moveFile(savedFile.id, folder.id);
      const moved = service.getFile(savedFile.id);

      expect(moved?.folderId).toBe(folder.id);
    });

    it('should throw error when moving non-existent file', () => {
      expect(() => service.moveFile('non-existent', rootId))
        .toThrowError('File not found');
    });

    it('should throw error when saving file to non-existent folder', async () => {
      await expectAsync(service.saveFile(testFile, 'non-existent'))
        .toBeRejectedWithError('Folder not found');
    });

    it('should throw error when moving folder to non-existent parent', () => {
      const folder = service.createFolder('Test', rootId);
      expect(() => service.moveFolder(folder.id, 'non-existent'))
        .toThrowError('Folder not found');
    });

    describe('downloadFile', () => {
      let mockLink: jasmine.SpyObj<HTMLAnchorElement>;

      beforeEach(() => {
        mockLink = jasmine.createSpyObj('HTMLAnchorElement', ['click']);
        spyOn(document, 'createElement').and.returnValue(mockLink);
        spyOn(document.body, 'appendChild');
        spyOn(document.body, 'removeChild');
        spyOn(URL, 'createObjectURL').and.returnValue('blob:test');
        spyOn(URL, 'revokeObjectURL');
      });

      it('should download file', async () => {
        const savedFile = await service.saveFile(testFile, rootId);
        await service.downloadFile(savedFile.id);

        expect(document.createElement).toHaveBeenCalledWith('a');
        expect(mockLink.click).toHaveBeenCalled();
        expect(URL.createObjectURL).toHaveBeenCalled();
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
      });

      it('should handle base64 content', async () => {
        const savedFile = await service.saveFile(testFile, rootId);
        const file = service.getFile(savedFile.id);
        if (file) {
          file.content = 'data:text/plain;base64,dGVzdCBjb250ZW50'; // "test content" in base64
        }
        await service.downloadFile(savedFile.id);

        expect(mockLink.click).toHaveBeenCalled();
      });

      it('should handle base64 content without MIME type', async () => {
        const savedFile = await service.saveFile(testFile, rootId);
        const file = service.getFile(savedFile.id);
        if (file) {
          file.content = 'data:;base64,dGVzdCBjb250ZW50'; // base64 without MIME type
        }
        await service.downloadFile(savedFile.id);

        expect(mockLink.click).toHaveBeenCalled();
      });

      it('should handle base64 content with invalid MIME type format', async () => {
        const savedFile = await service.saveFile(testFile, rootId);
        const file = service.getFile(savedFile.id);
        if (file) {
          file.content = 'data:invalid-format,dGVzdCBjb250ZW50'; // invalid MIME type format
        }
        await service.downloadFile(savedFile.id);

        expect(mockLink.click).toHaveBeenCalled();
      });

      it('should reject for non-existent file', async () => {
        await expectAsync(service.downloadFile('non-existent'))
          .toBeRejectedWithError('File not found');
      });
    });
  });
});