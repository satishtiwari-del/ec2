import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FilePreviewService } from './file-preview.service';
import { LocalStorageService } from '../storage/local-storage.service';
import { FilePreviewDialogComponent } from '../storage/file-preview-dialog/file-preview-dialog.component';
import { FileContextMetadata, LocalStorageFile } from '../storage/storage.model';
import { of } from 'rxjs';
import { first } from 'rxjs/operators';

describe('FilePreviewService', () => {
  let service: FilePreviewService;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockLocalStorageService: jasmine.SpyObj<LocalStorageService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<FilePreviewDialogComponent>>;

  const mockFile: FileContextMetadata = {
    id: 'test-file-1',
    name: 'test.txt',
    type: 'text/plain',
    size: 1024,
    path: '/test/test.txt'
  };

  const mockStoredFile: LocalStorageFile = {
    id: 'test-file-1',
    name: 'test.txt',
    content: 'test content',
    mimeType: 'text/plain',
    type: 'text/plain',
    size: 1024,
    path: '/test/test.txt',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    createdBy: 'test-user',
    folderId: 'test-folder'
  };

  beforeEach(() => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockLocalStorageService = jasmine.createSpyObj('LocalStorageService', ['getFile']);

    // Setup default mock returns
    mockDialogRef.afterClosed.and.returnValue(of(undefined));
    mockDialog.open.and.returnValue(mockDialogRef);
    mockLocalStorageService.getFile.and.returnValue(mockStoredFile);

    TestBed.configureTestingModule({
      providers: [
        FilePreviewService,
        { provide: MatDialog, useValue: mockDialog },
        { provide: LocalStorageService, useValue: mockLocalStorageService }
      ]
    });

    service = TestBed.inject(FilePreviewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('openPreview', () => {
    it('should open dialog with stored file when file exists', (done) => {
      service.openPreview(mockFile).subscribe(() => {
        expect(mockLocalStorageService.getFile).toHaveBeenCalledWith(mockFile.id);
        expect(mockDialog.open).toHaveBeenCalledWith(FilePreviewDialogComponent, {
          data: mockStoredFile,
          maxWidth: '90vw',
          maxHeight: '90vh'
        });
        expect(mockDialogRef.afterClosed).toHaveBeenCalled();
        done();
      });
    });

    it('should return error when file is not found', (done) => {
      // Setup mock to return null (file not found)
      mockLocalStorageService.getFile.and.returnValue(null);

      service.openPreview(mockFile).subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toBe('File not found');
          expect(mockDialog.open).not.toHaveBeenCalled();
          done();
        }
      });
    });

    it('should map dialog close result to void', (done) => {
      // Setup mock to return a specific value on dialog close
      mockDialogRef.afterClosed.and.returnValue(of('some result'));

      service.openPreview(mockFile).pipe(first()).subscribe(result => {
        expect(result).toBeUndefined();
        done();
      });
    });

    it('should handle dialog close with no result', (done) => {
      // Setup mock to return undefined on dialog close
      mockDialogRef.afterClosed.and.returnValue(of(undefined));

      service.openPreview(mockFile).pipe(first()).subscribe(result => {
        expect(result).toBeUndefined();
        done();
      });
    });
  });
});