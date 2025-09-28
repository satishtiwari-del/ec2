import { Component, OnInit, OnDestroy, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import {
  DEFAULT_TOOLBAR,
  Editor,
  NgxEditorComponent,
  NgxEditorFloatingMenuComponent,
  NgxEditorMenuComponent,
  Toolbar,
  Validators,
} from 'ngx-editor';
import { schema } from 'ngx-editor/schema';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { ySyncPlugin, yCursorPlugin, yUndoPlugin } from 'y-prosemirror';

@Component({
  selector: 'app-prosemirror-editor',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    NgxEditorComponent,
    NgxEditorMenuComponent,
    NgxEditorFloatingMenuComponent,
  ],
  template: `
    <div class="editor-container">
      <div class="editor-header">
        <button class="back-button" (click)="goBack()">← Back to Files</button>
        <h2>Markdown Editor</h2>
        <button class="download-button" (click)="downloadAsMarkdown()">Download as .md</button>
      </div>
      
      <div class="editor-content">
        <form [formGroup]="form">
          <div class="editor-wrapper">
            <ngx-editor-menu [editor]="editor" [toolbar]="toolbar"></ngx-editor-menu>
            <ngx-editor [editor]="editor" formControlName="editorContent">
              <ngx-editor-floating-menu [editor]="editor"></ngx-editor-floating-menu>
            </ngx-editor>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
         .editor-container {
       display: flex;
       flex-direction: column;
       height: 100vh;
       background: white;
       overflow: auto;
     }

    .editor-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
      background: #f5f5f5;
      flex-shrink: 0;
    }

    .back-button {
      padding: 8px 16px;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    .back-button:hover {
      background: #1565c0;
    }

    .editor-header h2 {
      margin: 0;
      color: #333;
    }

    .download-button {
      margin-left: auto;
      padding: 8px 16px;
      background: #2e7d32;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    .download-button:hover {
      background: #1b5e20;
    }

         .editor-content {
       flex: 1;
       padding: 16px;
       overflow: auto;
       display: flex;
       flex-direction: column;
     }

         .editor-wrapper {
       flex: 1;
       display: flex;
       flex-direction: column;
       border: 1px solid #ccc;
       border-radius: 4px;
       overflow: visible;
     }

    .editor-wrapper ::ng-deep .NgxEditor__MenuBar {
      border-bottom: 1px solid #e0e0e0;
      background: #f8f9fa;
    }

         .editor-wrapper ::ng-deep .NgxEditor__Content {
       flex: 1;
       min-height: 400px;
       padding: 16px;
       font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
       line-height: 1.6;
       overflow-y: auto;
       max-height: none;
     }

         .editor-wrapper ::ng-deep .NgxEditor__Content:focus {
       outline: none;
     }

     .editor-wrapper ::ng-deep .NgxEditor {
       height: auto;
       overflow: visible;
     }

     .editor-wrapper ::ng-deep .NgxEditor__Editor {
       height: auto;
       overflow: visible;
     }

    .editor-wrapper ::ng-deep .NgxEditor__Content h1,
    .editor-wrapper ::ng-deep .NgxEditor__Content h2,
    .editor-wrapper ::ng-deep .NgxEditor__Content h3,
    .editor-wrapper ::ng-deep .NgxEditor__Content h4,
    .editor-wrapper ::ng-deep .NgxEditor__Content h5,
    .editor-wrapper ::ng-deep .NgxEditor__Content h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }

    .editor-wrapper ::ng-deep .NgxEditor__Content h1 {
      font-size: 2em;
      border-bottom: 1px solid #eaecef;
      padding-bottom: 0.3em;
    }

    .editor-wrapper ::ng-deep .NgxEditor__Content h2 {
      font-size: 1.5em;
      border-bottom: 1px solid #eaecef;
      padding-bottom: 0.3em;
    }

    .editor-wrapper ::ng-deep .NgxEditor__Content p {
      margin-top: 0;
      margin-bottom: 16px;
    }

    .editor-wrapper ::ng-deep .NgxEditor__Content code {
      padding: 0.2em 0.4em;
      margin: 0;
      font-size: 85%;
      background-color: rgba(27,31,35,0.05);
      border-radius: 3px;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    }

    .editor-wrapper ::ng-deep .NgxEditor__Content pre {
      padding: 16px;
      overflow: auto;
      font-size: 85%;
      line-height: 1.45;
      background-color: #f6f8fa;
      border-radius: 3px;
    }

    .editor-wrapper ::ng-deep .NgxEditor__Content pre code {
      display: inline;
      padding: 0;
      margin: 0;
      overflow: visible;
      line-height: inherit;
      word-wrap: normal;
      background-color: transparent;
      border: 0;
    }

    .editor-wrapper ::ng-deep .NgxEditor__Content blockquote {
      padding: 0 1em;
      color: #6a737d;
      border-left: 0.25em solid #dfe2e5;
      margin: 0 0 16px 0;
    }

    .editor-wrapper ::ng-deep .NgxEditor__Content ul,
    .editor-wrapper ::ng-deep .NgxEditor__Content ol {
      padding-left: 2em;
      margin-bottom: 16px;
    }

    .editor-wrapper ::ng-deep .NgxEditor__Content li {
      margin-bottom: 4px;
    }

    .editor-wrapper ::ng-deep .NgxEditor__Content strong {
      font-weight: 600;
    }

    .editor-wrapper ::ng-deep .NgxEditor__Content em {
      font-style: italic;
    }

    .editor-wrapper ::ng-deep .NgxEditor__Content a {
      color: #0366d6;
      text-decoration: none;
    }

    .editor-wrapper ::ng-deep .NgxEditor__Content a:hover {
      text-decoration: underline;
    }
  `],
  encapsulation: ViewEncapsulation.None
})
export class ProseMirrorEditorComponent implements OnInit, OnDestroy {
  editor!: Editor;
  toolbar: Toolbar = DEFAULT_TOOLBAR;
  private ydoc?: Y.Doc;
  private provider?: WebsocketProvider;

  form = new FormGroup({
    editorContent: new FormControl({ value: '', disabled: false }, Validators.required(schema)),
  });

  constructor(private router: Router) {}

  ngOnInit() {
    this.initializeEditor();
  }

  ngOnDestroy() {
    if (this.editor) {
      this.editor.destroy();
    }
    try {
      this.provider?.destroy?.();
      this.ydoc?.destroy();
    } catch {}
  }

  private initializeEditor() {
    // Initialize the editor
    this.editor = new Editor({
      schema,
      history: true,
      keyboardShortcuts: true,
      inputRules: true,
      attributes: { enterkeyhint: 'enter' },
      features: {
        linkOnPaste: true,
        resizeImage: true,
      },
    });

    // Load content from localStorage
    let content = '';
    try {
      const storedContent = localStorage.getItem('mdFileContent');
      if (storedContent) {
        content = storedContent;
        // Convert markdown to HTML for the editor
        const html = this.markdownToHtml(content);
        this.form.get('editorContent')?.setValue(html);
      }
    } catch (e) {
      console.warn('Failed to load content from localStorage:', e);
    }

    // Initialize Yjs and collaboration plugins AFTER initial content is set
    try {
      this.ydoc = new Y.Doc();
      this.provider = new WebsocketProvider('ws://localhost:1234', 'md-collab', this.ydoc);
      const yXmlFragment = this.ydoc.getXmlFragment('prosemirror');

      // Register Yjs plugins without removing existing ones
      this.editor.registerPlugin(ySyncPlugin(yXmlFragment));
      this.editor.registerPlugin(yCursorPlugin(this.provider.awareness));
      this.editor.registerPlugin(yUndoPlugin());
    } catch (e) {
      console.warn('Failed to initialize Yjs collaboration:', e);
    }

    // Listen for content changes and save to localStorage
    this.form.get('editorContent')?.valueChanges.subscribe((value) => {
      if (value) {
        try {
          const markdown = this.htmlToMarkdown(value);
          localStorage.setItem('mdFileContent', markdown);
        } catch (e) {
          console.warn('Failed to save content to localStorage:', e);
        }
      }
    });
  }

  private markdownToHtml(markdown: string): string {
    // Simple markdown to HTML conversion
    return markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<ul><li>$1</li></ul>')
      .replace(/\n/gim, '<br>');
  }

  private htmlToMarkdown(html: string): string {
    // Simple HTML to markdown conversion
    return html
      .replace(/<h3>(.*?)<\/h3>/gim, '### $1\n')
      .replace(/<h2>(.*?)<\/h2>/gim, '## $1\n')
      .replace(/<h1>(.*?)<\/h1>/gim, '# $1\n')
      .replace(/<strong>(.*?)<\/strong>/gim, '**$1**')
      .replace(/<em>(.*?)<\/em>/gim, '*$1*')
      .replace(/<ul><li>(.*?)<\/li><\/ul>/gim, '- $1\n')
      .replace(/<br>/gim, '\n')
      .replace(/<[^>]*>/gim, '');
  }

  goBack() {
    this.router.navigate(['/documents/files']);
  }

  downloadAsMarkdown() {
    const html = this.form.get('editorContent')?.value || '';
    const markdown = this.htmlToMarkdown(html);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
