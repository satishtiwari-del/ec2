import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FileDownloadService, BatchDownloadOptions, DownloadProgress, FolderDownloadOptions } from './file-download.service';
import { environment } from '../../../../environments/environment';
import { HttpEventType, HttpResponse, HttpEvent, HttpProgressEvent, HttpErrorResponse } from '@angular/common/http';

describe('FileDownloadService', () => {
  let service: FileDownloadService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/files`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FileDownloadService]
    });
    service = TestBed.inject(FileDownloadService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('downloadFile', () => {
    it('should handle access denied error', (done) => {
      const fileId = '123';
      
      service.downloadFile(fileId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Access denied');
          done();
        }
      });

      const accessReq = httpMock.expectOne(`${apiUrl}/${fileId}/access-check`);
      accessReq.flush(false);
    });

    it('should handle network error in performDownload', (done) => {
      const fileId = '123';
      
      service.downloadFile(fileId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Network error');
          done();
        }
      });

      const accessReq = httpMock.expectOne(`${apiUrl}/${fileId}/access-check`);
      accessReq.flush(true);

      const downloadReq = httpMock.expectOne(`${apiUrl}/${fileId}/download`);
      downloadReq.error(new ErrorEvent('Network Error'));
    });

    it('should handle download with preserveFolderStructure option', (done) => {
      const fileId = '123';
      const options: BatchDownloadOptions = {
        preserveFolderStructure: true
      };
      
      service.downloadFile(fileId, options).subscribe({
        next: (blob) => {
          expect(blob).toBeTruthy();
          done();
        }
      });

      const accessReq = httpMock.expectOne(`${apiUrl}/${fileId}/access-check`);
      accessReq.flush(true);

      const downloadReq = httpMock.expectOne(`${apiUrl}/${fileId}/download?preserveStructure=true`);
      const mockBlob = new Blob(['test'], { type: 'application/octet-stream' });
      const response = new HttpResponse({
        body: mockBlob,
        status: 200,
        statusText: 'OK'
      });
      downloadReq.event(response);

      const activityReq = httpMock.expectOne(`${apiUrl}/${fileId}/activity`);
      activityReq.flush({});
    });

    it('should handle download progress with undefined total', (done) => {
      const fileId = '123';
      const progressUpdates: DownloadProgress[] = [];
      const options: BatchDownloadOptions = {
        onProgress: (progress) => {
          progressUpdates.push(progress);
        }
      };

      service.downloadFile(fileId, options).subscribe({
        next: (blob) => {
          expect(blob).toBeTruthy();
          expect(progressUpdates.length).toBeGreaterThan(0);
          expect(progressUpdates[0]).toEqual({
            loaded: 50,
            total: 0,
            percentage: 0
          });
          done();
        }
      });

      // Mock access check
      const accessReq = httpMock.expectOne(`${apiUrl}/${fileId}/access-check`);
      accessReq.flush(true);

      // Mock download with progress event (undefined total)
      const downloadReq = httpMock.expectOne(`${apiUrl}/${fileId}/download`);
      const progressEvent: HttpProgressEvent = {
        type: HttpEventType.DownloadProgress,
        loaded: 50,
        total: undefined
      };
      downloadReq.event(progressEvent);

      // Complete the download
      const mockBlob = new Blob(['test'], { type: 'application/octet-stream' });
      const response = new HttpResponse({
        body: mockBlob,
        status: 200,
        statusText: 'OK'
      });
      downloadReq.event(response);

      // Handle activity logging
      const activityReq = httpMock.expectOne(`${apiUrl}/${fileId}/activity`);
      activityReq.flush({});
    });

    it('should handle download progress with zero total', (done) => {
      const fileId = '123';
      const progressUpdates: DownloadProgress[] = [];
      const options: BatchDownloadOptions = {
        onProgress: (progress) => {
          progressUpdates.push(progress);
        }
      };

      service.downloadFile(fileId, options).subscribe({
        next: (blob) => {
          expect(blob).toBeTruthy();
          expect(progressUpdates.length).toBeGreaterThan(0);
          expect(progressUpdates[0]).toEqual({
            loaded: 50,
            total: 0,
            percentage: 0
          });
          done();
        }
      });

      // Mock access check
      const accessReq = httpMock.expectOne(`${apiUrl}/${fileId}/access-check`);
      accessReq.flush(true);

      // Mock download with progress event (zero total)
      const downloadReq = httpMock.expectOne(`${apiUrl}/${fileId}/download`);
      const progressEvent: HttpProgressEvent = {
        type: HttpEventType.DownloadProgress,
        loaded: 50,
        total: 0
      };
      downloadReq.event(progressEvent);

      // Complete the download
      const mockBlob = new Blob(['test'], { type: 'application/octet-stream' });
      const response = new HttpResponse({
        body: mockBlob,
        status: 200,
        statusText: 'OK'
      });
      downloadReq.event(response);

      // Handle activity logging
      const activityReq = httpMock.expectOne(`${apiUrl}/${fileId}/activity`);
      activityReq.flush({});
    });

    it('should handle normal download progress with valid total', (done) => {
      const fileId = '123';
      const progressUpdates: DownloadProgress[] = [];
      const options: BatchDownloadOptions = {
        onProgress: (progress) => {
          progressUpdates.push(progress);
        }
      };

      service.downloadFile(fileId, options).subscribe({
        next: (blob) => {
          expect(blob).toBeTruthy();
          expect(progressUpdates.length).toBeGreaterThan(0);
          expect(progressUpdates[0]).toEqual({
            loaded: 50,
            total: 100,
            percentage: 50
          });
          done();
        }
      });

      // Mock access check
      const accessReq = httpMock.expectOne(`${apiUrl}/${fileId}/access-check`);
      accessReq.flush(true);

      // Mock download with progress event (valid total)
      const downloadReq = httpMock.expectOne(`${apiUrl}/${fileId}/download`);
      const progressEvent: HttpProgressEvent = {
        type: HttpEventType.DownloadProgress,
        loaded: 50,
        total: 100
      };
      downloadReq.event(progressEvent);

      // Complete the download
      const mockBlob = new Blob(['test'], { type: 'application/octet-stream' });
      const response = new HttpResponse({
        body: mockBlob,
        status: 200,
        statusText: 'OK'
      });
      downloadReq.event(response);

      // Handle activity logging
      const activityReq = httpMock.expectOne(`${apiUrl}/${fileId}/activity`);
      activityReq.flush({});
    });

    it('should handle missing response body', (done) => {
      const fileId = '123';
      
      service.downloadFile(fileId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Download failed');
          done();
        }
      });

      // Mock access check
      const accessReq = httpMock.expectOne(`${apiUrl}/${fileId}/access-check`);
      accessReq.flush(true);

      // Mock download with null body
      const downloadReq = httpMock.expectOne(`${apiUrl}/${fileId}/download`);
      expect(downloadReq.request.method).toBe('GET');
      
      const response = new HttpResponse({
        body: null,
        status: 200,
        statusText: 'OK'
      });
      downloadReq.event(response);
    });

    it('should handle download timeout error', (done) => {
      const fileId = '123';
      
      service.downloadFile(fileId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Download timeout');
          expect((error as any).status).toBe(408);
          done();
        }
      });

      // Mock access check
      const accessReq = httpMock.expectOne(`${apiUrl}/${fileId}/access-check`);
      accessReq.flush(true);

      // Mock download timeout
      const downloadReq = httpMock.expectOne(`${apiUrl}/${fileId}/download`);
      expect(downloadReq.request.method).toBe('GET');
      downloadReq.error(new ErrorEvent('Timeout'), { status: 408, statusText: 'Request Timeout' });
    });

    it('should handle internal server error', (done) => {
      const fileId = '123';
      
      service.downloadFile(fileId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Internal server error');
          expect((error as any).status).toBe(500);
          done();
        }
      });

      // Mock access check
      const accessReq = httpMock.expectOne(`${apiUrl}/${fileId}/access-check`);
      accessReq.flush(true);

      // Mock server error
      const downloadReq = httpMock.expectOne(`${apiUrl}/${fileId}/download`);
      expect(downloadReq.request.method).toBe('GET');
      downloadReq.error(new ErrorEvent('Server Error'), { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle version not found error', (done) => {
      const fileId = '123';
      const options: BatchDownloadOptions = {
        version: '1.0'
      };
      
      service.downloadFile(fileId, options).subscribe({
        error: (error) => {
          expect(error.message).toBe('Version not found');
          expect((error as any).status).toBe(404);
          done();
        }
      });

      // Mock access check
      const accessReq = httpMock.expectOne(`${apiUrl}/${fileId}/access-check`);
      accessReq.flush(true);

      // Mock version not found
      const downloadReq = httpMock.expectOne(`${apiUrl}/${fileId}/download?version=1.0`);
      expect(downloadReq.request.method).toBe('GET');
      downloadReq.error(new ErrorEvent('Not Found'), { status: 404, statusText: 'Not Found' });
    });


  });

  describe('downloadFolder', () => {
    it('should handle network error with no message', (done) => {
      const folderId = '123';
      
      service.downloadFolder(folderId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Network error');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/folders/${folderId}/download?recursive=false&includeEmpty=false&compressionType=zip`);
      const networkError = new Error();
      networkError.message = '';
      req.error(new ErrorEvent('Error', { error: networkError }));
    });

    it('should handle network error with ErrorEvent', (done) => {
      const folderId = '123';
      
      service.downloadFolder(folderId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Network error');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/folders/${folderId}/download?recursive=false&includeEmpty=false&compressionType=zip`);
      req.error(new ErrorEvent('Network Error'));
    });

    it('should use default parameters when no options provided', (done) => {
      const folderId = '123';
      
      service.downloadFolder(folderId).subscribe({
        next: (blob) => {
          expect(blob).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/folders/${folderId}/download?recursive=false&includeEmpty=false&compressionType=zip`);
      expect(req.request.method).toBe('GET');
      
      const mockBlob = new Blob(['test'], { type: 'application/zip' });
      const response = new HttpResponse({
        body: mockBlob,
        status: 200,
        statusText: 'OK'
      });
      req.event(response);
    });

    it('should handle all options when provided', (done) => {
      const folderId = '123';
      const options: FolderDownloadOptions = {
        recursive: true,
        includeEmptyFolders: true,
        compressionType: 'tar'
      };
      
      service.downloadFolder(folderId, options).subscribe({
        next: (blob) => {
          expect(blob).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/folders/${folderId}/download?recursive=true&includeEmpty=true&compressionType=tar`);
      expect(req.request.method).toBe('GET');
      
      const mockBlob = new Blob(['test'], { type: 'application/x-tar' });
      const response = new HttpResponse({
        body: mockBlob,
        status: 200,
        statusText: 'OK'
      });
      req.event(response);
    });

    it('should handle partial options', (done) => {
      const folderId = '123';
      const options: FolderDownloadOptions = {
        recursive: true,
        // includeEmptyFolders not provided
        compressionType: 'zip'
      };
      
      service.downloadFolder(folderId, options).subscribe({
        next: (blob) => {
          expect(blob).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/folders/${folderId}/download?recursive=true&includeEmpty=false&compressionType=zip`);
      expect(req.request.method).toBe('GET');
      
      const mockBlob = new Blob(['test'], { type: 'application/zip' });
      const response = new HttpResponse({
        body: mockBlob,
        status: 200,
        statusText: 'OK'
      });
      req.event(response);
    });

    it('should handle download progress with undefined total', (done) => {
      const folderId = '123';
      const progressUpdates: DownloadProgress[] = [];
      const options: FolderDownloadOptions = {
        onProgress: (progress) => {
          progressUpdates.push(progress);
        }
      };

      service.downloadFolder(folderId, options).subscribe({
        next: (blob) => {
          expect(blob).toBeTruthy();
          expect(progressUpdates.length).toBeGreaterThan(0);
          expect(progressUpdates[0]).toEqual({
            loaded: 50,
            total: 0,
            percentage: 0
          });
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/folders/${folderId}/download?recursive=false&includeEmpty=false&compressionType=zip`);
      expect(req.request.method).toBe('GET');

      // Send progress event with undefined total
      const progressEvent: HttpProgressEvent = {
        type: HttpEventType.DownloadProgress,
        loaded: 50,
        total: undefined
      };
      req.event(progressEvent);

      // Complete the download
      const mockBlob = new Blob(['test'], { type: 'application/zip' });
      const response = new HttpResponse({
        body: mockBlob,
        status: 200,
        statusText: 'OK'
      });
      req.event(response);
    });

    it('should handle download progress with zero total', (done) => {
      const folderId = '123';
      const progressUpdates: DownloadProgress[] = [];
      const options: FolderDownloadOptions = {
        onProgress: (progress) => {
          progressUpdates.push(progress);
        }
      };

      service.downloadFolder(folderId, options).subscribe({
        next: (blob) => {
          expect(blob).toBeTruthy();
          expect(progressUpdates.length).toBeGreaterThan(0);
          expect(progressUpdates[0]).toEqual({
            loaded: 50,
            total: 0,
            percentage: 0
          });
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/folders/${folderId}/download?recursive=false&includeEmpty=false&compressionType=zip`);
      expect(req.request.method).toBe('GET');

      // Send progress event with zero total
      const progressEvent: HttpProgressEvent = {
        type: HttpEventType.DownloadProgress,
        loaded: 50,
        total: 0
      };
      req.event(progressEvent);

      // Complete the download
      const mockBlob = new Blob(['test'], { type: 'application/zip' });
      const response = new HttpResponse({
        body: mockBlob,
        status: 200,
        statusText: 'OK'
      });
      req.event(response);
    });

    it('should handle missing response body', (done) => {
      const folderId = '123';
      
      service.downloadFolder(folderId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Download failed');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/folders/${folderId}/download?recursive=false&includeEmpty=false&compressionType=zip`);
      expect(req.request.method).toBe('GET');
      
      const response = new HttpResponse({
        body: null,
        status: 200,
        statusText: 'OK'
      });
      req.event(response);
    });

    it('should handle permission denied error', (done) => {
      const folderId = '123';
      
      service.downloadFolder(folderId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Permission denied');
          expect((error as any).status).toBe(403);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/folders/${folderId}/download?recursive=false&includeEmpty=false&compressionType=zip`);
      expect(req.request.method).toBe('GET');
      req.error(new ErrorEvent('Forbidden'), { status: 403, statusText: 'Forbidden' });
    });

    it('should handle folder structure changed error', (done) => {
      const folderId = '123';
      
      service.downloadFolder(folderId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Folder structure changed');
          expect((error as any).status).toBe(409);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/folders/${folderId}/download?recursive=false&includeEmpty=false&compressionType=zip`);
      expect(req.request.method).toBe('GET');
      req.error(new ErrorEvent('Conflict'), { status: 409, statusText: 'Conflict' });
    });



    it('should use default error message when error has no message', (done) => {
      const folderId = '123';
      const customError = new Error();
      customError.message = ''; // Empty message
      
      service.downloadFolder(folderId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Download failed');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/folders/${folderId}/download?recursive=false&includeEmpty=false&compressionType=zip`);
      expect(req.request.method).toBe('GET');
      req.error(new ErrorEvent('Error', { error: customError }));
    });

    it('should handle non-HTTP error with undefined message', (done) => {
      const folderId = '123';
      const customError = new Error();
      // Set message to empty string to simulate an error without a message
      customError.message = '';
      
      service.downloadFolder(folderId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Download failed');
          expect(error instanceof Error).toBeTrue();
          expect(error instanceof HttpErrorResponse).toBeFalse();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/folders/${folderId}/download?recursive=false&includeEmpty=false&compressionType=zip`);
      expect(req.request.method).toBe('GET');
      // Simulate a non-HTTP error without a message property
      req.error(new ErrorEvent('Error', { error: customError }));
    });

    it('should handle HTTP error with ErrorEvent that has no message', (done) => {
      const folderId = '123';
      
      service.downloadFolder(folderId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Download failed');
          expect(error instanceof Error).toBeTrue();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/folders/${folderId}/download?recursive=false&includeEmpty=false&compressionType=zip`);
      expect(req.request.method).toBe('GET');
      
      // Create an HttpErrorResponse with an ErrorEvent that has no message
      const errorEvent = new ErrorEvent('Error');
      const httpError = new HttpErrorResponse({
        error: errorEvent,
        status: 400,
        statusText: 'Bad Request'
      });
      req.error(errorEvent, httpError);
    });

    it('should calculate percentage correctly for non-zero total', (done) => {
      const folderId = '123';
      const progressUpdates: DownloadProgress[] = [];
      const options: FolderDownloadOptions = {
        onProgress: (progress) => {
          progressUpdates.push(progress);
        }
      };

      service.downloadFolder(folderId, options).subscribe({
        next: (blob) => {
          expect(blob).toBeTruthy();
          expect(progressUpdates.length).toBe(2);
          // First update: 33.33% (rounded to 33)
          expect(progressUpdates[0]).toEqual({
            loaded: 100,
            total: 300,
            percentage: 33
          });
          // Second update: 66.67% (rounded to 67)
          expect(progressUpdates[1]).toEqual({
            loaded: 200,
            total: 300,
            percentage: 67
          });
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/folders/${folderId}/download?recursive=false&includeEmpty=false&compressionType=zip`);
      expect(req.request.method).toBe('GET');

      // Send first progress event (33.33%)
      const progressEvent1: HttpProgressEvent = {
        type: HttpEventType.DownloadProgress,
        loaded: 100,
        total: 300
      };
      req.event(progressEvent1);

      // Send second progress event (66.67%)
      const progressEvent2: HttpProgressEvent = {
        type: HttpEventType.DownloadProgress,
        loaded: 200,
        total: 300
      };
      req.event(progressEvent2);

      // Complete the download
      const mockBlob = new Blob(['test'], { type: 'application/zip' });
      const response = new HttpResponse({
        body: mockBlob,
        status: 200,
        statusText: 'OK'
      });
      req.event(response);
    });
  });

  describe('downloadMultipleFiles', () => {
    it('should handle network error', (done) => {
      const fileIds = ['123', '456'];
      
      service.downloadMultipleFiles(fileIds).subscribe({
        error: (error) => {
          expect(error instanceof Error).toBeTrue();
          expect(error.message).toBe('Network error');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/batch-download`);
      const networkError = new Error('Network error');
      req.error(new ErrorEvent('Error', { error: networkError }));
    });

    it('should reject empty file list', (done) => {
      service.downloadMultipleFiles([]).subscribe({
        error: (error) => {
          expect(error.message).toBe('No files selected for download');
          done();
        }
      });
    });

    it('should reject undefined file list', (done) => {
      service.downloadMultipleFiles(undefined as any).subscribe({
        error: (error) => {
          expect(error.message).toBe('No files selected for download');
          done();
        }
      });
    });

    it('should download multiple files with default options', (done) => {
      const fileIds = ['123', '456'];
      
      service.downloadMultipleFiles(fileIds).subscribe({
        next: (blob) => {
          expect(blob).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/batch-download`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        fileIds,
        compressionType: undefined,
        version: undefined,
        targetFormat: undefined
      });
      
      const mockBlob = new Blob(['test'], { type: 'application/zip' });
      const response = new HttpResponse({
        body: mockBlob,
        status: 200,
        statusText: 'OK'
      });
      req.event(response);
    });

    it('should download multiple files with all options', (done) => {
      const fileIds = ['123', '456'];
      const options: BatchDownloadOptions = {
        compressionType: 'zip',
        version: '1.0',
        targetFormat: 'pdf'
      };
      
      service.downloadMultipleFiles(fileIds, options).subscribe({
        next: (blob) => {
          expect(blob).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/batch-download`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        fileIds,
        compressionType: 'zip',
        version: '1.0',
        targetFormat: 'pdf'
      });
      
      const mockBlob = new Blob(['test'], { type: 'application/zip' });
      const response = new HttpResponse({
        body: mockBlob,
        status: 200,
        statusText: 'OK'
      });
      req.event(response);
    });

    it('should handle download progress with undefined total', (done) => {
      const fileIds = ['123', '456'];
      const progressUpdates: DownloadProgress[] = [];
      const options: BatchDownloadOptions = {
        onProgress: (progress) => {
          progressUpdates.push(progress);
        }
      };

      service.downloadMultipleFiles(fileIds, options).subscribe({
        next: (blob) => {
          expect(blob).toBeTruthy();
          expect(progressUpdates.length).toBeGreaterThan(0);
          expect(progressUpdates[0]).toEqual({
            loaded: 50,
            total: 0,
            percentage: 0
          });
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/batch-download`);
      expect(req.request.method).toBe('POST');

      // Send progress event with undefined total
      const progressEvent: HttpProgressEvent = {
        type: HttpEventType.DownloadProgress,
        loaded: 50,
        total: undefined
      };
      req.event(progressEvent);

      // Complete the download
      const mockBlob = new Blob(['test'], { type: 'application/zip' });
      const response = new HttpResponse({
        body: mockBlob,
        status: 200,
        statusText: 'OK'
      });
      req.event(response);
    });

    it('should handle download progress with zero total', (done) => {
      const fileIds = ['123', '456'];
      const progressUpdates: DownloadProgress[] = [];
      const options: BatchDownloadOptions = {
        onProgress: (progress) => {
          progressUpdates.push(progress);
        }
      };

      service.downloadMultipleFiles(fileIds, options).subscribe({
        next: (blob) => {
          expect(blob).toBeTruthy();
          expect(progressUpdates.length).toBeGreaterThan(0);
          expect(progressUpdates[0]).toEqual({
            loaded: 50,
            total: 0,
            percentage: 0
          });
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/batch-download`);
      expect(req.request.method).toBe('POST');

      // Send progress event with zero total
      const progressEvent: HttpProgressEvent = {
        type: HttpEventType.DownloadProgress,
        loaded: 50,
        total: 0
      };
      req.event(progressEvent);

      // Complete the download
      const mockBlob = new Blob(['test'], { type: 'application/zip' });
      const response = new HttpResponse({
        body: mockBlob,
        status: 200,
        statusText: 'OK'
      });
      req.event(response);
    });

    it('should handle too many concurrent downloads error', (done) => {
      const fileIds = ['123', '456'];
      
      service.downloadMultipleFiles(fileIds).subscribe({
        error: (error) => {
          expect(error.message).toBe('Too many concurrent downloads');
          expect((error as any).status).toBe(429);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/batch-download`);
      req.error(new ErrorEvent('Too Many Requests'), { status: 429, statusText: 'Too Many Requests' });
    });

    it('should handle package size limit error', (done) => {
      const fileIds = ['123', '456'];
      
      service.downloadMultipleFiles(fileIds).subscribe({
        error: (error) => {
          expect(error.message).toBe('Package size exceeds limit');
          expect((error as any).status).toBe(413);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/batch-download`);
      req.error(new ErrorEvent('Payload Too Large'), { status: 413, statusText: 'Request Entity Too Large' });
    });

    it('should handle non-specific HTTP error', (done) => {
      const fileIds = ['123', '456'];
      
      service.downloadMultipleFiles(fileIds).subscribe({
        error: (error) => {
          expect(error instanceof ErrorEvent).toBeTrue();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/batch-download`);
      req.error(new ErrorEvent('Server Error'), { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle missing response body', (done) => {
      const fileIds = ['123', '456'];
      
      service.downloadMultipleFiles(fileIds).subscribe({
        error: (error) => {
          expect(error.message).toBe('Download failed');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/batch-download`);
      const response = new HttpResponse({
        body: null,
        status: 200,
        statusText: 'OK'
      });
      req.event(response);
    });
  });
}); 