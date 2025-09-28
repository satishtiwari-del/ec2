import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { FolderContextMenuComponent } from './folder-context-menu.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FolderOperationsService, OperationResult, FolderOperation } from '../folder-operations.service';
import { FileUploadDialogComponent } from '../../document/storage/file-upload-dialog/file-upload-dialog.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';

describe('FolderContextMenuComponent', () => {
  let component: FolderContextMenuComponent;
  let fixture: ComponentFixture<FolderContextMenuComponent>;
  let folderOperationsService: jasmine.SpyObj<FolderOperationsService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<FileUploadDialogComponent>>;
  let loader: HarnessLoader;

  const mockFolder = {
    id: 'folder-123',
    name: 'Test Folder'
  };

  beforeEach(async () => {
    // Setup spies
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
    dialog = jasmine.createSpyObj('MatDialog', 
      ['open', 'closeAll', 'getDialogById', '_getAfterAllClosed'], 
      {
        openDialogs: [],
        afterAllClosed: new Subject(),
        afterOpened: new Subject()
      }
    );
    (dialog as any)._getAfterAllClosed.and.returnValue(new Subject());
    folderOperationsService = jasmine.createSpyObj('FolderOperationsService', [
      'uploadFile',
      'checkPermission',
      'executeOperation'
    ]);

    // Default spy implementations
    dialog.open.and.returnValue(dialogRef);
    dialogRef.afterClosed.and.returnValue(of(null));
    folderOperationsService.checkPermission.and.returnValue(of(true));
    folderOperationsService.executeOperation.and.returnValue(of({ success: true }));
    folderOperationsService.uploadFile.and.returnValue(of({ success: true }));

    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        FolderContextMenuComponent
      ],
      providers: [
        { provide: MatDialog, useValue: dialog },
        { provide: FolderOperationsService, useValue: folderOperationsService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FolderContextMenuComponent);
    component = fixture.componentInstance;
    component.folder = mockFolder;
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.isTreeView).toBeFalse();
      expect(component.error).toBe('');
      expect(component.menuItems.length).toBeGreaterThan(0);
    });

    it('should check permissions for all menu items on init', () => {
      expect(folderOperationsService.checkPermission).toHaveBeenCalledTimes(component.menuItems.length);
      component.menuItems.forEach(item => {
        expect(folderOperationsService.checkPermission)
          .toHaveBeenCalledWith(item.id as FolderOperation['type'], mockFolder.id);
      });
    });
  });

  describe('Menu Operations', () => {
    describe('Menu Item Actions', () => {
      it('should handle new folder operation', () => {
        component.onMenuItemClick('new');
        expect(folderOperationsService.executeOperation)
          .toHaveBeenCalledWith({ type: 'new', folderId: mockFolder.id });
      });

      it('should handle upload file action', () => {
        spyOn(component, 'handleFileUpload');
        component.onMenuItemClick('upload');
        expect(component.handleFileUpload).toHaveBeenCalled();
      });

      it('should handle edit operation', () => {
        component.onMenuItemClick('edit');
        expect(folderOperationsService.executeOperation)
          .toHaveBeenCalledWith({ type: 'edit', folderId: mockFolder.id });
      });

      it('should handle delete operation', () => {
        component.onMenuItemClick('delete');
        expect(folderOperationsService.executeOperation)
          .toHaveBeenCalledWith({ type: 'delete', folderId: mockFolder.id });
      });

      it('should handle move operation', () => {
        component.onMenuItemClick('move');
        expect(folderOperationsService.executeOperation)
          .toHaveBeenCalledWith({ type: 'move', folderId: mockFolder.id });
      });

      it('should handle copy operation', () => {
        component.onMenuItemClick('copy');
        expect(folderOperationsService.executeOperation)
          .toHaveBeenCalledWith({ type: 'copy', folderId: mockFolder.id });
      });

      it('should handle rename operation', () => {
        component.onMenuItemClick('rename');
        expect(folderOperationsService.executeOperation)
          .toHaveBeenCalledWith({ type: 'rename', folderId: mockFolder.id });
      });

      it('should handle operation success', fakeAsync(() => {
        spyOn(component.menuTrigger, 'closeMenu');
        component.onMenuItemClick('edit');
        tick();
        
        expect(component.error).toBe('');
        expect(component.menuTrigger.closeMenu).toHaveBeenCalled();
      }));

      it('should handle operation failure', fakeAsync(() => {
        const errorMessage = 'Operation failed';
        folderOperationsService.executeOperation.and.returnValue(of({ success: false, error: errorMessage }));
        
        component.onMenuItemClick('edit');
        tick();
        
        expect(component.error).toBe(errorMessage);
      }));

      it('should handle operation error', fakeAsync(() => {
        const errorMessage = 'An error occurred';
        folderOperationsService.executeOperation.and.returnValue(throwError(() => new Error(errorMessage)));
        
        component.onMenuItemClick('edit');
        tick();
        
        expect(component.error).toBe(errorMessage);
      }));

      it('should do nothing when operation is cancelled', fakeAsync(() => {
        // Setup spies
        spyOn(component.menuTrigger, 'closeMenu');
        folderOperationsService.executeOperation.and.returnValue(of({ success: false, cancelled: true }));
        
        // Initial state
        component.error = 'previous error';
        
        // Execute operation
        component.onMenuItemClick('edit');
        tick();
        
        // Verify no changes were made
        expect(component.error).toBe('previous error');
        expect(component.menuTrigger.closeMenu).not.toHaveBeenCalled();
      }));

      it('should set default error message when result error is undefined', fakeAsync(() => {
        folderOperationsService.executeOperation.and.returnValue(of({ success: false }));
        
        component.onMenuItemClick('edit');
        tick();
        
        expect(component.error).toBe('Operation failed');
      }));

      it('should set default error message when error has no message', fakeAsync(() => {
        folderOperationsService.executeOperation.and.returnValue(throwError(() => new Error()));
        
        component.onMenuItemClick('edit');
        tick();
        
        expect(component.error).toBe('An error occurred');
      }));
    });

    it('should disable menu items when permission check fails', fakeAsync(() => {
      folderOperationsService.checkPermission.and.returnValue(of(false));
      
      component.ngOnInit();
      tick();
      
      component.menuItems.forEach(item => {
        expect(item.disabled).toBeTrue();
      });
    }));

    it('should handle permission check errors', fakeAsync(() => {
      folderOperationsService.checkPermission.and.returnValue(throwError(() => new Error()));
      
      component.ngOnInit();
      tick();
      
      component.menuItems.forEach(item => {
        expect(item.disabled).toBeTrue();
      });
    }));
  });

  describe('File Upload Handling', () => {
    let mockFileList: FileList;
    let mockFile1: File;
    let mockFile2: File;
    let mockEvent: any;

    beforeEach(() => {
      // Create mock files
      mockFile1 = new File(['test content'], 'test1.txt', { type: 'text/plain' });
      mockFile2 = new File(['test content 2'], 'test2.txt', { type: 'text/plain' });
      
      // Create mock FileList
      const fileArray = [mockFile1, mockFile2];
      mockFileList = {
        0: mockFile1,
        1: mockFile2,
        length: 2,
        item: (index: number) => fileArray[index]
      } as unknown as FileList;

      // Create mock event
      mockEvent = {
        target: {
          files: mockFileList,
          value: 'test'
        }
      } as unknown as Event;
    });

    it('should handle empty file selection', fakeAsync(() => {
      const emptyEvent = { target: { files: { length: 0 } as FileList } };
      spyOn(component.operationComplete, 'emit');
      
      component.onFileSelected(emptyEvent as any);
      tick();

      expect(dialog.open).not.toHaveBeenCalled();
      expect(component.operationComplete.emit).not.toHaveBeenCalled();
    }));

    it('should handle dialog cancellation', fakeAsync(() => {
      dialogRef.afterClosed.and.returnValue(of(null));
      spyOn(component.operationComplete, 'emit');
      
      component.onFileSelected(mockEvent);
      tick(); // Wait for dialog to open
      tick(); // Wait for afterClosed

      expect(folderOperationsService.uploadFile).not.toHaveBeenCalled();
      expect(component.operationComplete.emit).not.toHaveBeenCalled();
    }));

    it('should clear input value after processing', fakeAsync(() => {
      dialogRef.afterClosed.and.returnValue(of(null));
      
      component.onFileSelected(mockEvent);
      tick();

      expect(mockEvent.target.value).toBe('');
    }));

    it('should not upload file when metadata is not provided', fakeAsync(() => {
      dialogRef.afterClosed.and.returnValue(of(null));
      spyOn(folderOperationsService, 'uploadFile');
      
      component.onFileSelected(mockEvent);
      tick();

      expect(folderOperationsService.uploadFile).not.toHaveBeenCalled();
    }));

    it('should set default error message when upload fails without error message', fakeAsync(() => {
      const metadata = { description: 'test', tags: [] };
      dialogRef.afterClosed.and.returnValue(of(metadata));
      folderOperationsService.uploadFile.and.returnValue(of({ success: false }));
      
      component.onFileSelected(mockEvent);
      tick();

      expect(component.error).toBe('Upload failed');
    }));

    it('should set error message from upload error', fakeAsync(() => {
      const metadata = { description: 'test', tags: [] };
      const errorMessage = 'Custom upload error';
      dialogRef.afterClosed.and.returnValue(of(metadata));
      folderOperationsService.uploadFile.and.returnValue(of({ success: false, error: errorMessage }));
      
      component.onFileSelected(mockEvent);
      tick();

      expect(component.error).toBe(errorMessage);
    }));

    it('should handle upload failure with custom error message', fakeAsync(() => {
      const metadata = { description: 'test', tags: [] };
      const customError = 'Custom upload error message';
      dialogRef.afterClosed.and.returnValue(of(metadata));
      folderOperationsService.uploadFile.and.returnValue(of({ 
        success: false, 
        error: customError 
      }));
      
      component.onFileSelected(mockEvent);
      tick();

      expect(component.error).toBe(customError);
    }));

    it('should handle upload failure with default error message', fakeAsync(() => {
      const metadata = { description: 'test', tags: [] };
      dialogRef.afterClosed.and.returnValue(of(metadata));
      folderOperationsService.uploadFile.and.returnValue(of({ 
        success: false,
        error: undefined 
      }));
      
      component.onFileSelected(mockEvent);
      tick();

      expect(component.error).toBe('Upload failed');
    }));

    it('should emit operation complete only when all files are uploaded successfully', fakeAsync(() => {
      const metadata = { description: 'test', tags: [] };
      dialogRef.afterClosed.and.returnValues(of(metadata), of(metadata));
      spyOn(component.operationComplete, 'emit');
      
      // Create a mock event with exactly 2 files
      const twoFiles = [
        new File(['content1'], 'file1.txt', { type: 'text/plain' }),
        new File(['content2'], 'file2.txt', { type: 'text/plain' })
      ];
      const twoFileEvent = {
        target: {
          files: {
            0: twoFiles[0],
            1: twoFiles[1],
            length: 2,
            item: (index: number) => twoFiles[index]
          } as unknown as FileList,
          value: ''
        }
      };

      // First file upload succeeds
      folderOperationsService.uploadFile.and.returnValues(
        of({ success: true }),
        of({ success: true })
      );

      component.onFileSelected(twoFileEvent as any);
      tick();

      expect(component.operationComplete.emit).toHaveBeenCalledWith({
        success: true,
        operation: 'upload',
        folderId: mockFolder.id
      });
      expect(component.operationComplete.emit).toHaveBeenCalledTimes(1);
    }));

    it('should not emit operation complete when not all files are uploaded successfully', fakeAsync(() => {
      const metadata = { description: 'test', tags: [] };
      dialogRef.afterClosed.and.returnValues(of(metadata), of(metadata));
      spyOn(component.operationComplete, 'emit');
      
      // Create a mock event with exactly 2 files
      const twoFiles = [
        new File(['content1'], 'file1.txt', { type: 'text/plain' }),
        new File(['content2'], 'file2.txt', { type: 'text/plain' })
      ];
      const twoFileEvent = {
        target: {
          files: {
            0: twoFiles[0],
            1: twoFiles[1],
            length: 2,
            item: (index: number) => twoFiles[index]
          } as unknown as FileList,
          value: ''
        }
      };

      // First file succeeds, second fails
      folderOperationsService.uploadFile.and.returnValues(
        of({ success: true }),
        of({ success: false, error: 'Second file failed' })
      );

      component.onFileSelected(twoFileEvent as any);
      tick();

      expect(component.operationComplete.emit).not.toHaveBeenCalled();
      expect(component.error).toBe('Second file failed');
    }));

    describe('handleFileUpload', () => {
      it('should trigger file input click and close menu', () => {
        // Setup spies
        const fileInputClickSpy = spyOn(component.fileInput.nativeElement, 'click');
        const menuCloseSpy = spyOn(component.menuTrigger, 'closeMenu');

        // Call the method
        component.handleFileUpload();

        // Verify the file input was clicked
        expect(fileInputClickSpy).toHaveBeenCalled();
        
        // Verify the menu was closed
        expect(menuCloseSpy).toHaveBeenCalled();
      });
    });
  });
});