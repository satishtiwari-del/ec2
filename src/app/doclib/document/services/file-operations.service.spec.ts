import { TestBed } from '@angular/core/testing';
import { FileOperationsService } from './file-operations.service';
import { LocalStorageService } from '../storage/local-storage.service';
import { FilePreviewService } from './file-preview.service';
import { FileContextMetadata } from '../storage/storage.model';
import { Observable, of } from 'rxjs';

describe('FileOperationsService', () => {
  let service: FileOperationsService;
  let mockLocalStorageService: jasmine.SpyObj<LocalStorageService>;
  let mockFilePreviewService: jasmine.SpyObj<FilePreviewService>;

  const mockFile: FileContextMetadata = {
    id: 'test-file-1',
    name: 'test.txt',
    type: 'text/plain',
    size: 1024,
    path: '/test/test.txt'
  };

  beforeEach(() => {
    mockLocalStorageService = jasmine.createSpyObj('LocalStorageService', ['downloadFile', 'deleteFile']);
    mockFilePreviewService = jasmine.createSpyObj('FilePreviewService', ['openPreview']);

    TestBed.configureTestingModule({
      providers: [
        FileOperationsService,
        { provide: LocalStorageService, useValue: mockLocalStorageService },
        { provide: FilePreviewService, useValue: mockFilePreviewService }
      ]
    });

    service = TestBed.inject(FileOperationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('preview', () => {
    beforeEach(() => {
      mockFilePreviewService.openPreview.and.returnValue(of(void 0));
    });

    it('should call filePreview.openPreview with the provided file', (done) => {
      service.preview(mockFile).subscribe(() => {
        expect(mockFilePreviewService.openPreview).toHaveBeenCalledWith(mockFile);
        done();
      });
    });
  });

  describe('download', () => {
    beforeEach(() => {
      mockLocalStorageService.downloadFile.and.returnValue(Promise.resolve());
    });

    it('should call localStorage.downloadFile with the file id', (done) => {
      service.download(mockFile).subscribe(() => {
        expect(mockLocalStorageService.downloadFile).toHaveBeenCalledWith(mockFile.id);
        done();
      });
    });
  });

  describe('edit', () => {
    beforeEach(() => {
      mockFilePreviewService.openPreview.and.returnValue(of(void 0));
    });

    it('should call preview method with the provided file', (done) => {
      // We spy on the service's own preview method
      spyOn(service, 'preview').and.callThrough();

      service.edit(mockFile).subscribe(() => {
        expect(service.preview).toHaveBeenCalledWith(mockFile);
        expect(mockFilePreviewService.openPreview).toHaveBeenCalledWith(mockFile);
        done();
      });
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      mockLocalStorageService.deleteFile.and.returnValue(void 0);
    });

    it('should call localStorage.deleteFile with the file id', (done) => {
      service.delete(mockFile).subscribe(() => {
        expect(mockLocalStorageService.deleteFile).toHaveBeenCalledWith(mockFile.id);
        done();
      });
    });
  });
});