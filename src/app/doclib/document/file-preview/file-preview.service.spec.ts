import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FilePreviewService, PreviewOptions, PreviewResult, Annotation, SearchResult, Position } from './file-preview.service';
import { environment } from '../../../../environments/environment';
import { HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { fakeAsync, tick } from '@angular/core/testing';

describe('FilePreviewService', () => {
  let service: FilePreviewService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/preview`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FilePreviewService]
    });
    service = TestBed.inject(FilePreviewService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getPreview', () => {
    it('should get preview with default options', (done) => {
      const fileId = '123';
      const options: PreviewOptions = {};
      const mockBlob = new Blob(['test content'], { type: 'application/pdf' });
      const mockHeaders = new HttpHeaders({
        'x-preview-version': '1.0',
        'content-type': 'application/pdf',
        'content-length': '100',
        'last-modified': new Date().toISOString(),
        'x-preview-type': 'pdf',
        'x-preview-pages': '5',
        'x-preview-searchable': 'true',
        'x-preview-annotatable': 'true'
      });

      service.getPreview(fileId, options).subscribe({
        next: (result) => {
          expect(result.content).toEqual(mockBlob);
          expect(result.metadata.fileId).toBe(fileId);
          expect(result.metadata.version).toBe('1.0');
          expect(result.metadata.mimeType).toBe('application/pdf');
          expect(result.metadata.size).toBe(100);
          expect(result.metadata.previewType).toBe('pdf');
          expect(result.pages).toBe(5);
          expect(result.searchable).toBe(true);
          expect(result.annotatable).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${fileId}?`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBlob, { headers: mockHeaders });
    });

    it('should get preview with all options', (done) => {
      const fileId = '123';
      const options: PreviewOptions = {
        quality: 'high',
        page: 2,
        zoom: 1.5,
        annotations: true,
        cacheKey: 'cache123',
        watermark: {
          text: 'CONFIDENTIAL',
          position: 'center',
          opacity: 0.5,
          fontSize: 24,
          color: '#FF0000'
        }
      };

      service.getPreview(fileId, options).subscribe({
        next: () => done()
      });

      const req = httpMock.expectOne(request => {
        const params = new URLSearchParams(request.url.split('?')[1]);
        return request.url.startsWith(`${apiUrl}/${fileId}`) &&
          params.get('quality') === 'high' &&
          params.get('page') === '2' &&
          params.get('zoom') === '1.5' &&
          params.get('annotations') === 'true' &&
          params.get('cacheKey') === 'cache123' &&
          params.has('watermark');
      });
      expect(req.request.method).toBe('GET');
      req.flush(new Blob(), { headers: new HttpHeaders() });
    });

    it('should handle empty file ID', (done) => {
      service.getPreview('', {}).subscribe({
        error: (error) => {
          expect(error.message).toBe('File ID is required');
          done();
        }
      });
    });

    it('should handle file too large error', (done) => {
      const fileId = '123';
      service.getPreview(fileId, {}).subscribe({
        error: (error) => {
          expect(error.message).toBe('File too large for preview');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${fileId}?`);
      expect(req.request.method).toBe('GET');
      req.error(new ErrorEvent('File too large'), { status: 413, statusText: 'Request Entity Too Large' });
    });

    it('should handle unsupported file type error', (done) => {
      const fileId = '123';
      service.getPreview(fileId, {}).subscribe({
        error: (error) => {
          expect(error.message).toBe('File type not supported for preview');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${fileId}?`);
      expect(req.request.method).toBe('GET');
      req.error(new ErrorEvent('Unsupported Media Type'), { status: 415, statusText: 'Unsupported Media Type' });
    });

    it('should handle corrupted preview data error', (done) => {
      const fileId = '123';
      service.getPreview(fileId, {}).subscribe({
        error: (error) => {
          expect(error.message).toBe('Preview data corrupted');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${fileId}?`);
      expect(req.request.method).toBe('GET');
      req.error(new ErrorEvent('Unprocessable Entity'), { status: 422, statusText: 'Unprocessable Entity' });
    });

    it('should handle non-specific HTTP error', (done) => {
      const fileId = '123';
      service.getPreview(fileId, {}).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBeTrue();
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${fileId}?`);
      expect(req.request.method).toBe('GET');
      req.error(new ErrorEvent('Server Error'), { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network error with generic message', (done) => {
      const fileId = '123';
      service.getPreview(fileId, {}).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to generate preview');
          expect(error instanceof Error).toBeTrue();
          expect(error instanceof HttpErrorResponse).toBeFalse();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${fileId}?`);
      expect(req.request.method).toBe('GET');
      req.error(new ProgressEvent('Network error'));
    });
  });

  describe('Preview Rendering Options', () => {
    const fileId = '123';
    const mockPreview = new Blob(['preview content'], { type: 'application/pdf' });
    const mockResponse = {
      body: mockPreview,
      headers: new HttpHeaders({
        'x-preview-version': '1.0',
        'content-type': 'application/pdf',
        'content-length': '100',
        'last-modified': new Date().toISOString(),
        'x-preview-type': 'pdf',
        'x-preview-pages': '1',
        'x-preview-searchable': 'true',
        'x-preview-annotatable': 'true'
      })
    };

    it('should handle custom rendering options', fakeAsync(() => {
      const options: PreviewOptions = {
        quality: 'high',
        page: 1,
        zoom: 1.0
      };

      service.getPreview(fileId, options).subscribe(result => {
        expect(result.content).toBeTruthy();
        expect(result.metadata.mimeType).toBe('application/pdf');
      });

      const previewReq = httpMock.expectOne(
        `${apiUrl}/${fileId}?quality=high&page=1&zoom=1`
      );
      expect(previewReq.request.method).toBe('GET');
      previewReq.flush(mockPreview, { headers: mockResponse.headers });

      tick();
    }));

    it('should handle watermark options', fakeAsync(() => {
      const options: PreviewOptions = {
        watermark: {
          text: 'CONFIDENTIAL',
          position: 'center',
          opacity: 0.5,
          fontSize: 24,
          color: '#000000'
        }
      };

      service.getPreview(fileId, options).subscribe(result => {
        expect(result.content).toBeTruthy();
      });

      const previewReq = httpMock.expectOne((req) => {
        const params = new URLSearchParams(req.url.split('?')[1]);
        const watermark = JSON.parse(params.get('watermark') || '{}');
        return watermark.text === 'CONFIDENTIAL' && watermark.position === 'center';
      });
      expect(previewReq.request.method).toBe('GET');
      previewReq.flush(mockPreview, { headers: mockResponse.headers });

      tick();
    }));

    it('should handle page and zoom options', fakeAsync(() => {
      const options: PreviewOptions = {
        page: 2,
        zoom: 1.5
      };

      service.getPreview(fileId, options).subscribe(result => {
        expect(result.content).toBeTruthy();
      });

      const previewReq = httpMock.expectOne(
        `${apiUrl}/${fileId}?page=2&zoom=1.5`
      );
      expect(previewReq.request.method).toBe('GET');
      previewReq.flush(mockPreview, { headers: mockResponse.headers });

      tick();
    }));

    it('should handle preview generation error', fakeAsync(() => {
      const options: PreviewOptions = {
        quality: 'high'
      };

      service.getPreview(fileId, options).subscribe({
        error: (error) => {
          expect(error.message).toBe('Preview generation timed out');
        }
      });

      const previewReq = httpMock.expectOne(
        `${apiUrl}/${fileId}?quality=high`
      );
      previewReq.error(new ErrorEvent('Timeout'), {
        status: 408,
        statusText: 'Request Timeout'
      });

      tick();
    }));

    it('should handle unsupported file type', fakeAsync(() => {
      const options: PreviewOptions = {};
      service.getPreview(fileId, options).subscribe({
        error: (error) => {
          expect(error.message).toBe('File type not supported for preview');
        }
      });

      const previewReq = httpMock.expectOne(`${apiUrl}/${fileId}?`);
      previewReq.error(new ErrorEvent('Unsupported Media Type'), {
        status: 415,
        statusText: 'Unsupported Media Type'
      });

      tick();
    }));
  });

  describe('getAnnotations', () => {
    it('should get annotations', (done) => {
      const fileId = '123';
      const mockAnnotations: Annotation[] = [{
        id: 'ann1',
        fileId,
        page: 1,
        type: 'note',
        content: 'Test note',
        position: { x: 100, y: 100 },
        author: 'user1',
        timestamp: new Date()
      }];

      service.getAnnotations(fileId).subscribe({
        next: (annotations) => {
          expect(annotations).toEqual(mockAnnotations);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${fileId}/annotations`);
      expect(req.request.method).toBe('GET');
      req.flush(mockAnnotations);
    });

    it('should handle page not found error', (done) => {
      const fileId = '123';
      service.getAnnotations(fileId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Page not found');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${fileId}/annotations`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle invalid annotation position error', (done) => {
      const fileId = '123';
      service.getAnnotations(fileId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid annotation position');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${fileId}/annotations`);
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });

    it('should handle non-specific HTTP error', (done) => {
      const fileId = '123';
      service.getAnnotations(fileId).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBeTrue();
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${fileId}/annotations`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network error with generic message', (done) => {
      const fileId = '123';
      service.getAnnotations(fileId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to get annotations');
          expect(error instanceof Error).toBeTrue();
          expect(error instanceof HttpErrorResponse).toBeFalse();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${fileId}/annotations`);
      req.error(new ProgressEvent('Network error'));
    });
  });

  describe('addAnnotation', () => {
    it('should add annotation', (done) => {
      const fileId = '123';
      const annotation: Annotation = {
        id: 'ann1',
        fileId,
        page: 1,
        type: 'note',
        content: 'Test note',
        position: { x: 100, y: 100 },
        author: 'user1',
        timestamp: new Date()
      };

      service.addAnnotation(fileId, annotation).subscribe({
        next: (result) => {
          expect(result).toEqual(annotation);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${fileId}/annotations`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(annotation);
      req.flush(annotation);
    });

    it('should handle annotation limit exceeded', (done) => {
      const fileId = '123';
      const annotation: Annotation = {
        id: 'ann1',
        fileId,
        page: 1,
        type: 'note',
        content: 'Test note',
        position: { x: 100, y: 100 },
        author: 'user1',
        timestamp: new Date()
      };

      service.addAnnotation(fileId, annotation).subscribe({
        error: (error) => {
          expect(error.message).toBe('Annotation limit exceeded');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${fileId}/annotations`);
      req.flush('Conflict', { status: 409, statusText: 'Conflict' });
    });

    it('should handle invalid annotation position error', (done) => {
      const fileId = '123';
      const annotation: Annotation = {
        id: 'ann1',
        fileId,
        page: 1,
        type: 'note',
        content: 'Test note',
        position: { x: -1, y: -1 }, // Invalid position
        author: 'user1',
        timestamp: new Date()
      };

      service.addAnnotation(fileId, annotation).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid annotation position');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${fileId}/annotations`);
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });

    it('should handle page not found error', (done) => {
      const fileId = '123';
      const annotation: Annotation = {
        id: 'ann1',
        fileId,
        page: 999, // Non-existent page
        type: 'note',
        content: 'Test note',
        position: { x: 100, y: 100 },
        author: 'user1',
        timestamp: new Date()
      };

      service.addAnnotation(fileId, annotation).subscribe({
        error: (error) => {
          expect(error.message).toBe('Page not found');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${fileId}/annotations`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle non-specific HTTP error', (done) => {
      const fileId = '123';
      const annotation: Annotation = {
        id: 'ann1',
        fileId,
        page: 1,
        type: 'note',
        content: 'Test note',
        position: { x: 100, y: 100 },
        author: 'user1',
        timestamp: new Date()
      };

      service.addAnnotation(fileId, annotation).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBeTrue();
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${fileId}/annotations`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network error with generic message', (done) => {
      const fileId = '123';
      const annotation: Annotation = {
        id: 'ann1',
        fileId,
        page: 1,
        type: 'note',
        content: 'Test note',
        position: { x: 100, y: 100 },
        author: 'user1',
        timestamp: new Date()
      };

      service.addAnnotation(fileId, annotation).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to add annotation');
          expect(error instanceof Error).toBeTrue();
          expect(error instanceof HttpErrorResponse).toBeFalse();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${fileId}/annotations`);
      req.error(new ProgressEvent('Network error'));
    });
  });

  describe('searchContent', () => {
    it('should search content', (done) => {
      const fileId = '123';
      const query = 'test';
      const mockResults: SearchResult[] = [{
        page: 1,
        position: { x: 100, y: 100 },
        context: 'test content'
      }];

      service.searchContent(fileId, query).subscribe({
        next: (results) => {
          expect(results).toEqual(mockResults);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${fileId}/search?query=test`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResults);
    });

    it('should handle empty query', (done) => {
      const fileId = '123';
      service.searchContent(fileId, '').subscribe({
        next: (results) => {
          expect(results).toEqual([]);
          done();
        }
      });
    });

    it('should handle non-searchable document', (done) => {
      const fileId = '123';
      service.searchContent(fileId, 'test').subscribe({
        error: (error) => {
          expect(error.message).toBe('Document is not searchable');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${fileId}/search?query=test`);
      req.flush('Not Implemented', { status: 501, statusText: 'Not Implemented' });
    });

    it('should handle invalid search query error', (done) => {
      const fileId = '123';
      const invalidQuery = '*'; // Invalid search syntax
      
      service.searchContent(fileId, invalidQuery).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid search query');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${fileId}/search?query=*`);
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });

    it('should handle non-specific HTTP error', (done) => {
      const fileId = '123';
      const query = 'test';
      
      service.searchContent(fileId, query).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBeTrue();
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${fileId}/search?query=test`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network error with generic message', (done) => {
      const fileId = '123';
      const query = 'test';
      
      service.searchContent(fileId, query).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to search content');
          expect(error instanceof Error).toBeTrue();
          expect(error instanceof HttpErrorResponse).toBeFalse();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${fileId}/search?query=test`);
      req.error(new ProgressEvent('Network error'));
    });

    it('should limit results to 100 matches', (done) => {
      const fileId = '123';
      const query = 'test';
      const mockResults: SearchResult[] = Array(150).fill(null).map((_, index) => ({
        page: Math.floor(index / 10) + 1,
        position: { x: 100, y: 100 },
        context: `test content ${index + 1}`
      }));

      service.searchContent(fileId, query).subscribe({
        next: (results) => {
          expect(results.length).toBe(100);
          expect(results).toEqual(mockResults.slice(0, 100));
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${fileId}/search?query=test`);
      req.flush(mockResults);
    });
  });

  describe('generateThumbnail', () => {
    it('should generate thumbnail', (done) => {
      const fileId = '123';
      const size = { width: 200, height: 150 };
      const mockBlob = new Blob(['thumbnail data'], { type: 'image/jpeg' });

      service.generateThumbnail(fileId, size).subscribe({
        next: (blob) => {
          expect(blob).toEqual(mockBlob);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${fileId}/thumbnail?width=200&height=150`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBlob);
    });

    it('should handle invalid dimensions', (done) => {
      const fileId = '123';
      const size = { width: -1, height: 150 };

      service.generateThumbnail(fileId, size).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid thumbnail dimensions');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${fileId}/thumbnail?width=-1&height=150`);
      expect(req.request.method).toBe('GET');
      req.error(new ErrorEvent('Bad Request'), { status: 400, statusText: 'Bad Request' });
    });

    it('should handle unsupported thumbnail format error', (done) => {
      const fileId = '123';
      const size = { width: 200, height: 150 };

      service.generateThumbnail(fileId, size).subscribe({
        error: (error) => {
          expect(error.message).toBe('Unsupported thumbnail format');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${fileId}/thumbnail?width=200&height=150`);
      expect(req.request.method).toBe('GET');
      req.error(new ErrorEvent('Not Implemented'), { status: 501, statusText: 'Not Implemented' });
    });

    it('should handle non-specific HTTP error', (done) => {
      const fileId = '123';
      const size = { width: 200, height: 150 };

      service.generateThumbnail(fileId, size).subscribe({
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBeTrue();
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${fileId}/thumbnail?width=200&height=150`);
      expect(req.request.method).toBe('GET');
      req.error(new ErrorEvent('Server Error'), { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network error with generic message', (done) => {
      const fileId = '123';
      const size = { width: 200, height: 150 };

      service.generateThumbnail(fileId, size).subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to generate thumbnail');
          expect(error instanceof Error).toBeTrue();
          expect(error instanceof HttpErrorResponse).toBeFalse();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${fileId}/thumbnail?width=200&height=150`);
      expect(req.request.method).toBe('GET');
      req.error(new ProgressEvent('Network error'));
    });
  });

  describe('navigateToPage', () => {
    it('should dispatch navigation event', () => {
      const page = 5;
      const dispatchSpy = spyOn(window, 'dispatchEvent');

      service.navigateToPage(page);

      expect(dispatchSpy).toHaveBeenCalledWith(
        new CustomEvent('preview-navigate', { detail: { page } })
      );
    });

    it('should handle invalid page number', () => {
      const page = -1;
      const dispatchSpy = spyOn(window, 'dispatchEvent');
      const consoleSpy = spyOn(console, 'warn');

      service.navigateToPage(page);

      expect(dispatchSpy).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Invalid page number:', page);
    });
  });

  describe('highlightText', () => {
    it('should dispatch highlight event', () => {
      const position: Position = { x: 100, y: 100, width: 50, height: 20 };
      const dispatchSpy = spyOn(window, 'dispatchEvent');

      service.highlightText(position);

      expect(dispatchSpy).toHaveBeenCalledWith(
        new CustomEvent('preview-highlight', { detail: { position } })
      );
    });

    it('should handle invalid position', () => {
      const position: Position = { x: -1, y: 100 };
      const dispatchSpy = spyOn(window, 'dispatchEvent');
      const consoleSpy = spyOn(console, 'warn');

      service.highlightText(position);

      expect(dispatchSpy).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Invalid highlight position:', position);
    });
  });
}); 