import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FileContextMenuComponent } from './file-context-menu.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FilePermissionService } from '../../auth/services/file-permission.service';
import { FileOperationsService } from '../services/file-operations.service';
import { FilePreviewService } from '../services/file-preview.service';
import { of, throwError } from 'rxjs';
import { FileContextMetadata } from '../storage/storage.model';

describe('FileContextMenuComponent', () => {
  let component: FileContextMenuComponent;
  let fixture: ComponentFixture<FileContextMenuComponent>;
  let filePermissionService: jasmine.SpyObj<FilePermissionService>;
  let fileOperationsService: jasmine.SpyObj<FileOperationsService>;
  let filePreviewService: jasmine.SpyObj<FilePreviewService>;

  const mockFile: FileContextMetadata = {
    id: 'test-file-1',
    name: 'test.pdf',
    type: 'application/pdf',
    size: 1024,
    path: '/test/test.pdf'
  };

  beforeEach(async () => {
    const permissionSpy = jasmine.createSpyObj('FilePermissionService', ['hasPermission']);
    const operationsSpy = jasmine.createSpyObj('FileOperationsService', ['preview', 'download', 'edit', 'delete']);
    const previewSpy = jasmine.createSpyObj('FilePreviewService', ['openPreview']);

    // Set up default permission behavior
    permissionSpy.hasPermission.and.callFake((permission: string) => {
      return permission === 'edit' || permission === 'delete';
    });
    operationsSpy.preview.and.returnValue(of(void 0));
    operationsSpy.download.and.returnValue(of(void 0));
    operationsSpy.edit.and.returnValue(of(void 0));
    operationsSpy.delete.and.returnValue(of(void 0));
    previewSpy.openPreview.and.returnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [
        MatMenuModule,
        MatIconModule,
        NoopAnimationsModule,
        FileContextMenuComponent
      ],
      providers: [
        { provide: FilePermissionService, useValue: permissionSpy },
        { provide: FileOperationsService, useValue: operationsSpy },
        { provide: FilePreviewService, useValue: previewSpy }
      ]
    }).compileComponents();

    filePermissionService = TestBed.inject(FilePermissionService) as jasmine.SpyObj<FilePermissionService>;
    fileOperationsService = TestBed.inject(FileOperationsService) as jasmine.SpyObj<FileOperationsService>;
    filePreviewService = TestBed.inject(FilePreviewService) as jasmine.SpyObj<FilePreviewService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FileContextMenuComponent);
    component = fixture.componentInstance;
    component.file = mockFile;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Context Menu Display', () => {
    it('should show context menu on right click', fakeAsync(() => {
      // Arrange
      const event = new MouseEvent('contextmenu', {
        clientX: 100,
        clientY: 100,
        bubbles: true
      });
      spyOn(component.menuTrigger, 'openMenu');

      // Act
      component.onContextMenu(event);
      tick();
      fixture.detectChanges();

      // Assert
      expect(component.menuTrigger.openMenu).toHaveBeenCalled();
      expect(component.menuPosition).toEqual({ x: 100, y: 100 });
    }));

    it('should position menu within viewport bounds', fakeAsync(() => {
      // Arrange
      const event = new MouseEvent('contextmenu', {
        clientX: window.innerWidth - 10,
        clientY: window.innerHeight - 10,
        bubbles: true
      });
      spyOn(component.menuTrigger, 'openMenu');

      // Act
      component.onContextMenu(event);
      tick();
      fixture.detectChanges();

      // Assert
      expect(component.menuTrigger.openMenu).toHaveBeenCalled();
      expect(component.menuPosition.x).toBeLessThan(window.innerWidth);
      expect(component.menuPosition.y).toBeLessThan(window.innerHeight);
    }));
  });

  describe('Double-Click Preview', () => {
    it('should open preview on double click', fakeAsync(() => {
      // Arrange
      component.file = mockFile;
      filePreviewService.openPreview.and.returnValue(of(void 0));

      // Act
      component.onDoubleClick();
      tick();

      // Assert
      expect(filePreviewService.openPreview).toHaveBeenCalledWith(mockFile);
    }));

    it('should handle preview errors gracefully', fakeAsync(() => {
      // Arrange
      component.file = mockFile;
      filePreviewService.openPreview.and.returnValue(throwError(() => new Error('Preview failed')));
      spyOn(console, 'error');

      // Act
      component.onDoubleClick();
      tick();
      fixture.detectChanges();

      // Assert
      expect(console.error).toHaveBeenCalled();
      expect(component.errorMessage).toBeTruthy();
    }));
  });

  describe('Menu Actions', () => {
    beforeEach(() => {
      filePermissionService.hasPermission.and.callFake((permission: string) => {
        return permission === 'edit' || permission === 'delete';
      });
      // Trigger the context menu to show the menu items
      const event = new MouseEvent('contextmenu', {
        clientX: 100,
        clientY: 100,
        bubbles: true
      });
      component.onContextMenu(event);
      fixture.detectChanges();
    });

    it('should show preview option for all users', () => {
      // Assert
      const previewButton = fixture.debugElement.query(By.css('[data-test="preview-button"]'));
      expect(previewButton).toBeTruthy();
    });

    it('should show download option for all users', () => {
      // Assert
      const downloadButton = fixture.debugElement.query(By.css('[data-test="download-button"]'));
      expect(downloadButton).toBeTruthy();
    });

    it('should show edit option only for users with edit permission', () => {
      // Arrange
      filePermissionService.hasPermission.and.callFake((permission: string) => {
        return permission !== 'edit';
      });

      // Act
      fixture.detectChanges();

      // Assert
      const editButton = fixture.debugElement.query(By.css('[data-test="edit-button"]'));
      expect(editButton).toBeFalsy();
    });

    it('should show delete option only for users with delete permission', () => {
      // Arrange
      filePermissionService.hasPermission.and.callFake((permission: string) => {
        return permission !== 'delete';
      });

      // Act
      fixture.detectChanges();

      // Assert
      const deleteButton = fixture.debugElement.query(By.css('[data-test="delete-button"]'));
      expect(deleteButton).toBeFalsy();
    });
  });

  describe('Action Execution', () => {
    beforeEach(() => {
      fileOperationsService.preview.and.returnValue(of(void 0));
      fileOperationsService.download.and.returnValue(of(void 0));
      fileOperationsService.edit.and.returnValue(of(void 0));
      fileOperationsService.delete.and.returnValue(of(void 0));
      filePreviewService.openPreview.and.returnValue(of(void 0));
    });

    it('should execute preview action', fakeAsync(() => {
      // Act
      component.onPreview();
      tick();

      // Assert
      expect(filePreviewService.openPreview).toHaveBeenCalledWith(mockFile);
    }));

    it('should execute download action', fakeAsync(() => {
      // Act
      component.onDownload();
      tick();

      // Assert
      expect(fileOperationsService.download).toHaveBeenCalledWith(mockFile);
    }));

    it('should execute edit action when user has permission', fakeAsync(() => {
      // Arrange
      filePermissionService.hasPermission.and.returnValue(true);

      // Act
      component.onEdit();
      tick();

      // Assert
      expect(fileOperationsService.edit).toHaveBeenCalledWith(mockFile);
      expect(component.errorMessage).toBe('');
    }));

    it('should show error when user lacks edit permission', fakeAsync(() => {
      // Arrange
      filePermissionService.hasPermission.and.returnValue(false);
      spyOn(console, 'error');

      // Act
      component.onEdit();
      tick();
      fixture.detectChanges();

      // Assert
      expect(fileOperationsService.edit).not.toHaveBeenCalled();
      expect(component.errorMessage).toBe('Permission denied');
      expect(console.error).toHaveBeenCalledWith(
        'Permission denied',
        'You do not have edit permission'
      );
    }));

    it('should execute delete action with confirmation when user has permission', fakeAsync(() => {
      // Arrange
      filePermissionService.hasPermission.and.returnValue(true);
      spyOn(window, 'confirm').and.returnValue(true);

      // Act
      component.onDelete();
      tick();

      // Assert
      expect(window.confirm).toHaveBeenCalled();
      expect(fileOperationsService.delete).toHaveBeenCalledWith(mockFile);
      expect(component.errorMessage).toBe('');
    }));

    it('should show error when user lacks delete permission', fakeAsync(() => {
      // Arrange
      filePermissionService.hasPermission.and.returnValue(false);
      spyOn(window, 'confirm');
      spyOn(console, 'error');

      // Act
      component.onDelete();
      tick();
      fixture.detectChanges();

      // Assert
      expect(window.confirm).not.toHaveBeenCalled();
      expect(fileOperationsService.delete).not.toHaveBeenCalled();
      expect(component.errorMessage).toBe('Permission denied');
      expect(console.error).toHaveBeenCalledWith(
        'Permission denied',
        'You do not have delete permission'
      );
    }));

    it('should not execute delete action when confirmation is cancelled', fakeAsync(() => {
      // Arrange
      spyOn(window, 'confirm').and.returnValue(false);

      // Act
      component.onDelete();
      tick();

      // Assert
      expect(window.confirm).toHaveBeenCalled();
      expect(fileOperationsService.delete).not.toHaveBeenCalled();
    }));
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      spyOn(console, 'error');
    });

    it('should handle preview errors', fakeAsync(() => {
      // Arrange
      filePreviewService.openPreview.and.returnValue(throwError(() => new Error('Preview failed')));

      // Act
      component.onPreview();
      tick();
      fixture.detectChanges();

      // Assert
      expect(console.error).toHaveBeenCalled();
      expect(component.errorMessage).toBeTruthy();
    }));

    it('should handle download errors', fakeAsync(() => {
      // Arrange
      fileOperationsService.download.and.returnValue(throwError(() => new Error('Download failed')));

      // Act
      component.onDownload();
      tick();
      fixture.detectChanges();

      // Assert
      expect(console.error).toHaveBeenCalled();
      expect(component.errorMessage).toBeTruthy();
    }));

    it('should handle edit errors', fakeAsync(() => {
      // Arrange
      fileOperationsService.edit.and.returnValue(throwError(() => new Error('Edit failed')));

      // Act
      component.onEdit();
      tick();
      fixture.detectChanges();

      // Assert
      expect(console.error).toHaveBeenCalled();
      expect(component.errorMessage).toBeTruthy();
    }));

    it('should handle delete errors', fakeAsync(() => {
      // Arrange
      spyOn(window, 'confirm').and.returnValue(true);
      fileOperationsService.delete.and.returnValue(throwError(() => new Error('Delete failed')));

      // Act
      component.onDelete();
      tick();
      fixture.detectChanges();

      // Assert
      expect(console.error).toHaveBeenCalled();
      expect(component.errorMessage).toBeTruthy();
    }));
  });
});