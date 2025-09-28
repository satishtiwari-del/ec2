import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FilePreviewDialogComponent } from './file-preview-dialog.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { LocalStorageFile } from '../storage.model';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { marked } from 'marked';

describe('FilePreviewDialogComponent', () => {
  let component: FilePreviewDialogComponent;
  let fixture: ComponentFixture<FilePreviewDialogComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<FilePreviewDialogComponent>>;
  let sanitizer: jasmine.SpyObj<DomSanitizer>;

  const mockFile: LocalStorageFile = {
    id: '123',
    name: 'test.txt',
    content: 'data:text/plain;base64,SGVsbG8gV29ybGQ=', // "Hello World" in base64
    size: 1024,
    mimeType: 'text/plain',
    type: 'file',
    path: '/test/test.txt',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'test-user',
    folderId: 'root',
    metadata: {
      description: 'Test file',
      tags: ['test', 'sample']
    }
  };

  beforeEach(async () => {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    sanitizer = jasmine.createSpyObj('DomSanitizer', [
      'bypassSecurityTrustUrl',
      'bypassSecurityTrustResourceUrl',
      'bypassSecurityTrustHtml'
    ]);

    sanitizer.bypassSecurityTrustUrl.and.returnValue('safe-url' as any);
    sanitizer.bypassSecurityTrustResourceUrl.and.returnValue('safe-resource-url' as any);
    sanitizer.bypassSecurityTrustHtml.and.returnValue('safe-html' as any);

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        BrowserAnimationsModule,
        FilePreviewDialogComponent
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockFile },
        { provide: DomSanitizer, useValue: sanitizer }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FilePreviewDialogComponent);
    component = fixture.componentInstance;
  });

  beforeEach(() => {
    // Reset spies
    sanitizer.bypassSecurityTrustUrl.calls.reset();
    sanitizer.bypassSecurityTrustResourceUrl.calls.reset();
    sanitizer.bypassSecurityTrustHtml.calls.reset();
    
    // Reset component data
    component.data = { ...mockFile };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('File Type Detection', () => {
    it('should detect image files', () => {
      component.data.mimeType = 'image/png';
      expect(component.getFileType()).toBe('image');
    });

    it('should detect markdown files by mime type', () => {
      component.data.mimeType = 'text/markdown';
      expect(component.getFileType()).toBe('markdown');
    });

    it('should detect markdown files by extension', () => {
      component.data.mimeType = 'text/plain';
      component.data.name = 'test.md';
      expect(component.getFileType()).toBe('markdown');
    });

    it('should detect text files', () => {
      component.data = { ...mockFile, mimeType: 'text/plain', name: 'test.txt' };
      expect(component.getFileType()).toBe('text');
    });

    it('should detect PDF files', () => {
      component.data = { ...mockFile, mimeType: 'application/pdf', name: 'test.pdf' };
      expect(component.getFileType()).toBe('pdf');
    });

    it('should detect audio files', () => {
      component.data = { ...mockFile, mimeType: 'audio/mp3', name: 'test.mp3' };
      expect(component.getFileType()).toBe('audio');
    });

    it('should detect video files', () => {
      component.data = { ...mockFile, mimeType: 'video/mp4', name: 'test.mp4' };
      expect(component.getFileType()).toBe('video');
    });

    it('should return unsupported for unknown file types', () => {
      component.data = { ...mockFile, mimeType: 'application/unknown', name: 'unknown.bin' };
      expect(component.getFileType()).toBe('unsupported');
    });
  });

  describe('Content Handling', () => {
    it('should decode text content correctly', () => {
      const textFile = { 
        ...mockFile, 
        content: 'data:text/plain;base64,SGVsbG8gV29ybGQ=',  // "Hello World" in base64
        mimeType: 'text/plain' 
      };
      component.data = textFile;
      const result = component.getTextContent();
      expect(result).toBe('Hello World');
    });

    it('should handle invalid base64 content gracefully', () => {
      component.data = { ...mockFile, content: 'invalid-base64' };
      const result = component.getTextContent();
      expect(result).toBe('Unable to decode text content');
    });

    it('should sanitize URLs on initialization', () => {
      const fileUrl = 'data:image/png;base64,abc123';
      const imageFile = { ...mockFile, content: fileUrl, mimeType: 'image/png' };
      
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [CommonModule, BrowserAnimationsModule, FilePreviewDialogComponent],
        providers: [
          { provide: MatDialogRef, useValue: dialogRef },
          { provide: MAT_DIALOG_DATA, useValue: imageFile },
          { provide: DomSanitizer, useValue: sanitizer }
        ]
      });
      
      fixture = TestBed.createComponent(FilePreviewDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      
      expect(sanitizer.bypassSecurityTrustUrl).toHaveBeenCalledWith(fileUrl);
      expect(sanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith(fileUrl);
    });
  });

  describe('Markdown Rendering', () => {
    beforeEach(() => {
      const markdownFile = {
        ...mockFile,
        mimeType: 'text/markdown',
        name: 'test.md',
        content: 'data:text/markdown;base64,IyBIZWxsbyBXb3JsZA==', // "# Hello World" in base64
      };
      component.data = markdownFile;
    });

    it('should render markdown content', fakeAsync(async () => {
      const parsedHtml = '<h1>Hello World</h1>';
      spyOn(marked, 'parse').and.returnValue(Promise.resolve(parsedHtml));
      
      await component.ngOnInit();
      tick();
      
      expect(sanitizer.bypassSecurityTrustHtml).toHaveBeenCalledWith(parsedHtml);
      expect(component.renderedMarkdown).toBeTruthy();
    }));

    it('should handle markdown rendering errors gracefully', fakeAsync(async () => {
      spyOn(marked, 'parse').and.rejectWith(new Error('Markdown error'));
      
      await component.ngOnInit();
      tick();
      
      expect(sanitizer.bypassSecurityTrustHtml).toHaveBeenCalledWith(
        '<div class="error">Error rendering markdown content</div>'
      );
    }));
  });

  describe('Utility Functions', () => {
    it('should format file size correctly', () => {
      expect(component.formatFileSize(0)).toBe('0 Bytes');
      expect(component.formatFileSize(1024)).toBe('1 KB');
      expect(component.formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(component.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should format dates correctly', () => {
      const date = new Date('2024-01-01T00:00:00Z');
      const result = component.formatDate(date.toISOString());
      expect(result).toBe(date.toLocaleString());
    });
  });

  describe('Dialog Actions', () => {
    it('should close dialog', () => {
      component.close();
      expect(dialogRef.close).toHaveBeenCalled();
    });

    it('should trigger file download', () => {
      const mockLink = {
        href: '',
        download: '',
        click: jasmine.createSpy('click')
      };
      spyOn(document, 'createElement').and.returnValue(mockLink as any);
      
      component.download();
      
      expect(mockLink.href).toBe(mockFile.content as string);
      expect(mockLink.download).toBe(mockFile.name);
      expect(mockLink.click).toHaveBeenCalled();
    });
  });
});