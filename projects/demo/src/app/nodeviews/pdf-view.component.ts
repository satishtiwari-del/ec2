import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { PdfViewerModule, PDFDocumentProxy } from 'ng2-pdf-viewer';
import * as pdfjsLib from 'pdfjs-dist';

@Component({
  selector: 'app-pdf-view',
  standalone: true,
  imports: [CommonModule, NgxDropzoneModule, PdfViewerModule],
  template: `
    <div class="pdf-container">
      <div *ngIf="!pdfSrc" class="pdf-upload">
        <ngx-dropzone (change)="onSelect($event)" [accept]="'application/pdf'" class="custom-dropzone">
          <ngx-dropzone-label>Drop PDF here or click to upload</ngx-dropzone-label>
        </ngx-dropzone>
      </div>
      <div *ngIf="pdfSrc" class="pdf-viewer">
        <div class="loading" *ngIf="isExtracting">Extracting text from PDF...</div>
        <div class="toolbar">
          <button class="toolbar-btn" (click)="toggleHighlightMode()" [class.active]="isHighlightMode">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M10.53 5.47L5.47 10.53c-.59.59-.59 1.54 0 2.12l4.95 4.95c.59.59 1.54.59 2.12 0l5.06-5.06c.59-.59.59-1.54 0-2.12l-4.95-4.95c-.59-.59-1.54-.59-2.12 0zM9.47 7.47l4.95 4.95-5.06 5.06-4.95-4.95 5.06-5.06z"/>
            </svg>
            Highlight
          </button>
          <button class="remove-btn" (click)="removePdf()">Remove PDF</button>
        </div>
        <pdf-viewer #pdfViewer
                   [src]="pdfSrc"
                   [render-text]="true"
                   [original-size]="false"
                   (page-rendered)="onPageRendered()"
                   (text-layer-rendered)="onTextLayerRendered()"
                   style="width: 100%; height: 400px;">
        </pdf-viewer>
      </div>
    </div>
  `,
  styles: [`
    .pdf-container {
      margin: 10px 0;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
    }
    .custom-dropzone {
      height: 150px;
      background: #f5f5f5;
      border: 2px dashed #ccc;
      border-radius: 4px;
      
      &:hover {
        border-color: #666;
      }
    }
    .pdf-viewer {
      position: relative;
    }
    .loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 255, 255, 0.9);
      padding: 10px 20px;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      z-index: 1000;
    }
    .toolbar {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
    }
    .toolbar-btn {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 5px 10px;
      background: #f0f0f0;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      
      &:hover {
        background: #e0e0e0;
      }
      
      &.active {
        background: #e8f0fe;
        border-color: #1a73e8;
        color: #1a73e8;
      }
      
      svg {
        width: 18px;
        height: 18px;
      }
    }
    .remove-btn {
      padding: 5px 10px;
      background: #ff4444;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      
      &:hover {
        background: #cc0000;
      }
    }
    :host ::ng-deep {
      .highlight {
        background-color: yellow;
        opacity: 0.5;
      }
    }
  `]
})
export class PdfViewComponent implements OnInit {
  @Input() node: any;
  @Input() view: any;
  @Input() getPos: () => number;
  @ViewChild('pdfViewer') pdfViewer: any;

  pdfSrc: string | null = null;
  isExtracting: boolean = false;
  isHighlightMode: boolean = false;
  pdfDocument: PDFDocumentProxy | null = null;
  currentSelection: { start: number; end: number; text: string } | null = null;

  constructor(private el: ElementRef) {}

  ngOnInit() {
    if (this.node.attrs.src) {
      this.pdfSrc = this.node.attrs.src;
    }

    // Add click event listener for text selection
    this.el.nativeElement.addEventListener('mouseup', () => {
      if (!this.isHighlightMode) return;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const text = range.toString().trim();
      
      if (text) {
        const container = range.commonAncestorContainer;
        if (container.nodeType === Node.TEXT_NODE && container.parentElement) {
          container.parentElement.classList.add('highlight');
          
          // Store the selection
          this.currentSelection = {
            start: range.startOffset,
            end: range.endOffset,
            text: text
          };

          // Update the node attributes with highlight information
          this.updateNodeAttrs();
        }
      }
    });
  }

  async onSelect(event: { addedFiles: File[] }) {
    if (event.addedFiles.length > 0) {
      const file = event.addedFiles[0];
      const reader = new FileReader();
      
      reader.onload = async (e: any) => {
        this.pdfSrc = e.target.result;
        this.isExtracting = true;
        
        try {
          // Extract text from PDF
          const pdf = await pdfjsLib.getDocument(this.pdfSrc).promise;
          let textContent = '';
          const numPages = pdf.numPages;
          const promises = [];
          
          for (let i = 1; i <= numPages; i++) {
            promises.push(
              pdf.getPage(i).then(async (page: any) => {
                const content = await page.getTextContent();
                content.items.forEach((item: any) => {
                  textContent += item.str + ' ';
                });
                textContent += '\\n\\n';
              })
            );
          }

          await Promise.all(promises);
          
          // Split text into paragraphs
          const paragraphs = textContent.split('\\n\\n').filter(p => p.trim());
          
          // Create document structure
          const { state, dispatch } = this.view;
          const tr = state.tr;
          
          // Clear existing content
          tr.delete(0, state.doc.content.size);
          
          // Add title
          const titleNode = state.schema.nodes.heading.create(
            { level: 1, align: null },
            [state.schema.text('Extracted PDF Content')]
          );
          tr.insert(0, titleNode);
          
          // Add paragraphs
          let pos = tr.doc.content.size;
          paragraphs.forEach(text => {
            const paraNode = state.schema.nodes.paragraph.create(
              { align: null },
              [state.schema.text(text.trim())]
            );
            tr.insert(pos, paraNode);
            pos = tr.doc.content.size;
          });
          
          dispatch(tr);
          
          // Update PDF node attributes
          this.updateNodeAttrs();
        } catch (error) {
          console.error('Error extracting text from PDF:', error);
        } finally {
          this.isExtracting = false;
        }
      };
      
      reader.readAsDataURL(file);
    }
  }

  removePdf() {
    this.pdfSrc = null;
    this.updateNodeAttrs();
  }

  onPageRendered() {
    // Handle page render completion if needed
  }

  onTextLayerRendered() {
    // Reapply highlights if needed
    if (this.node.attrs.highlights) {
      const highlights = JSON.parse(this.node.attrs.highlights);
      highlights.forEach((highlight: any) => {
        // Find and highlight the text
        const textElements = this.el.nativeElement.querySelectorAll('.textLayer > span');
        textElements.forEach((element: HTMLElement) => {
          if (element.textContent?.includes(highlight.text)) {
            element.classList.add('highlight');
          }
        });
      });
    }
  }

  toggleHighlightMode() {
    this.isHighlightMode = !this.isHighlightMode;
  }

  private updateNodeAttrs() {
    const highlights = this.node.attrs.highlights ? JSON.parse(this.node.attrs.highlights) : [];
    
    if (this.currentSelection) {
      highlights.push({
        text: this.currentSelection.text,
        start: this.currentSelection.start,
        end: this.currentSelection.end
      });
    }

    const transaction = this.view.state.tr.setNodeMarkup(
      this.getPos(),
      null,
      {
        src: this.pdfSrc,
        title: 'PDF Document',
        highlights: JSON.stringify(highlights)
      }
    );
    this.view.dispatch(transaction);
  }
}