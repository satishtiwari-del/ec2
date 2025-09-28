import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { DomSanitizer, SafeUrl, SafeResourceUrl, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { LocalStorageFile } from '../storage.model';

// Configure marked options globally
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert line breaks to <br>
});

@Component({
  selector: 'app-file-preview-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="preview-dialog">
      <h2 mat-dialog-title>{{ data.name }}</h2>
      <mat-dialog-content>
        <div class="preview-content" [ngSwitch]="getFileType()">
          <!-- Images -->
          <img *ngSwitchCase="'image'" [src]="safeImageUrl" alt="Image preview">
          
          <!-- Markdown -->
          <div *ngSwitchCase="'markdown'" class="markdown-content" [innerHTML]="renderedMarkdown"></div>
          
          <!-- Text content -->
          <pre *ngSwitchCase="'text'" class="text-content">{{ getTextContent() }}</pre>
          
          <!-- PDF -->
          <iframe *ngSwitchCase="'pdf'" [src]="safeResourceUrl" frameborder="0"></iframe>
          
          <!-- Audio -->
          <audio *ngSwitchCase="'audio'" controls [src]="safeMediaUrl"></audio>
          
          <!-- Video -->
          <video *ngSwitchCase="'video'" controls [src]="safeMediaUrl"></video>
          
          <!-- Unsupported -->
          <div *ngSwitchDefault class="unsupported">
            <p>Preview not available for this file type</p>
            <p class="mime-type">Type: {{ data.mimeType }}</p>
          </div>
        </div>

        <div class="metadata" *ngIf="data.metadata">
          <h3>File Information</h3>
          <p *ngIf="data.metadata.description">{{ data.metadata.description }}</p>
          <div class="tags" *ngIf="data.metadata.tags?.length">
            <span class="tag" *ngFor="let tag of data.metadata.tags">{{ tag }}</span>
          </div>
          <div class="file-details">
            <p>Size: {{ formatFileSize(data.size) }}</p>
            <p>Type: {{ data.mimeType }}</p>
            <p>Created: {{ formatDate(data.createdAt) }}</p>
            <p>Modified: {{ formatDate(data.updatedAt) }}</p>
          </div>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="close()">Close</button>
        <button mat-raised-button color="primary" (click)="download()">Download</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .preview-dialog {
      min-width: 500px;
      max-width: 800px;
    }

    .preview-content {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 200px;
      max-height: 500px;
      overflow: auto;
      margin-bottom: 20px;
      border: 1px solid #eee;
      border-radius: 4px;
      padding: 10px;
    }

    .markdown-content {
      width: 100%;
      padding: 20px;
      overflow: auto;
    }

    .markdown-content :first-child {
      margin-top: 0;
    }

    .markdown-content :last-child {
      margin-bottom: 0;
    }

    .markdown-content h1,
    .markdown-content h2,
    .markdown-content h3,
    .markdown-content h4,
    .markdown-content h5,
    .markdown-content h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }

    .markdown-content h1 {
      font-size: 2em;
      border-bottom: 1px solid #eaecef;
      padding-bottom: 0.3em;
    }

    .markdown-content h2 {
      font-size: 1.5em;
      border-bottom: 1px solid #eaecef;
      padding-bottom: 0.3em;
    }

    .markdown-content p {
      margin-top: 0;
      margin-bottom: 16px;
    }

    .markdown-content code {
      padding: 0.2em 0.4em;
      margin: 0;
      font-size: 85%;
      background-color: rgba(27,31,35,0.05);
      border-radius: 3px;
      font-family: monospace;
    }

    .markdown-content pre {
      padding: 16px;
      overflow: auto;
      font-size: 85%;
      line-height: 1.45;
      background-color: #f6f8fa;
      border-radius: 3px;
    }

    .markdown-content pre code {
      display: inline;
      padding: 0;
      margin: 0;
      overflow: visible;
      line-height: inherit;
      word-wrap: normal;
      background-color: transparent;
      border: 0;
    }

    img, video {
      max-width: 100%;
      max-height: 400px;
    }

    iframe {
      width: 100%;
      height: 400px;
    }

    .text-content {
      width: 100%;
      white-space: pre-wrap;
      font-family: monospace;
      padding: 10px;
      margin: 0;
      background: #f5f5f5;
      border-radius: 4px;
    }

    .unsupported {
      text-align: center;
      color: #666;
    }

    .mime-type {
      font-family: monospace;
      color: #999;
    }

    .metadata {
      padding: 15px;
      background: #f5f5f5;
      border-radius: 4px;
      margin-top: 20px;
    }

    .metadata h3 {
      margin: 0 0 10px 0;
      color: #333;
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 10px 0;
    }

    .tag {
      background: #e0e0e0;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.9em;
      color: #666;
    }

    .file-details {
      margin-top: 15px;
      font-size: 0.9em;
      color: #666;
    }

    .file-details p {
      margin: 5px 0;
    }
  `]
})
export class FilePreviewDialogComponent implements OnInit {
  safeImageUrl: SafeUrl;
  safeMediaUrl: SafeUrl;
  safeResourceUrl: SafeResourceUrl;
  renderedMarkdown: SafeHtml = '' as unknown as SafeHtml;

  constructor(
    public dialogRef: MatDialogRef<FilePreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LocalStorageFile,
    private sanitizer: DomSanitizer
  ) {
    // Sanitize URLs based on content type
    const contentUrl = data.content as string;
    this.safeImageUrl = this.sanitizer.bypassSecurityTrustUrl(contentUrl);
    this.safeMediaUrl = this.sanitizer.bypassSecurityTrustUrl(contentUrl);
    this.safeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(contentUrl);
  }

  async ngOnInit() {
    // Render markdown if needed
    if (this.getFileType() === 'markdown') {
      await this.renderMarkdown();
    }
  }

  private async renderMarkdown() {
    try {
      const markdownContent = this.getTextContent();
      const htmlContent = await marked.parse(markdownContent);
      this.renderedMarkdown = this.sanitizer.bypassSecurityTrustHtml(htmlContent);
    } catch (error) {
      console.error('Error rendering markdown:', error);
      this.renderedMarkdown = this.sanitizer.bypassSecurityTrustHtml(
        '<div class="error">Error rendering markdown content</div>'
      );
    }
  }

  getFileType(): string {
    if (this.data.mimeType.startsWith('image/')) return 'image';
    if (this.data.mimeType === 'text/markdown' || this.data.name.endsWith('.md')) return 'markdown';
    if (this.data.mimeType.startsWith('text/')) return 'text';
    if (this.data.mimeType === 'application/pdf') return 'pdf';
    if (this.data.mimeType.startsWith('audio/')) return 'audio';
    if (this.data.mimeType.startsWith('video/')) return 'video';
    return 'unsupported';
  }

  getTextContent(): string {
    try {
      const base64Content = (this.data.content as string).split(',')[1];
      return atob(base64Content);
    } catch {
      return 'Unable to decode text content';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  close(): void {
    this.dialogRef.close();
  }

  download(): void {
    const link = document.createElement('a');
    link.href = this.data.content as string;
    link.download = this.data.name;
    link.click();
  }
}