import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';

@Component({
  selector: 'app-multi-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:10px;">
      <div *ngFor="let file of files" style="border:1px solid #ccc;padding:5px;">
        <h3>{{ file.name }} ({{ file.user }})</h3>
        <iframe [src]="getPreviewUrl(file.id)" width="600" height="400"></iframe>
      </div>
    </div>
  `
})
export class MultiPreviewComponent {
  files = [
    { id: 'd2002dd1-66bf-47b3-8a3e-afa196646b71', name: 'File 1.docx', user: 'User A' },
    { id: 'a1b2c3d4-5678-90ab-cdef-111213141516', name: 'File 2.docx', user: 'User B' },
    { id: 'b2c3d4e5-6789-01ab-cdef-222324252627', name: 'Large File.docx', user: 'User C' }
  ];

  getPreviewUrl(fileId: string) {
    return `http://localhost:4200/documents/preview/${fileId}`;
  }
}
