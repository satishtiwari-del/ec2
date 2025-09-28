import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation, isDevMode, Injector, ApplicationRef } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { PdfViewerModule } from 'ng2-pdf-viewer';

import {
  DEFAULT_TOOLBAR,
  Editor,
  NgxEditorComponent,
  NgxEditorFloatingMenuComponent,
  NgxEditorMenuComponent,
  Toolbar,
  Validators,
  ToolbarCustomMenuItem,
} from 'ngx-editor';

import { AppCustomMenuComponent } from './components/custom-menu/custom-menu.component';
import { PdfMenuComponent } from './components/pdf-menu/pdf-menu.component';
import { EditorMdUploadComponent } from './components/editor-md-upload/editor-md-upload.component';
import { MdService } from './md.service';
import { AiService } from './ai.service';
import jsonDoc from './doc';
import nodeViews, { initNodeViews } from './nodeviews';
import schema from './schema';
import { DOMParser as ProseMirrorDOMParser } from 'prosemirror-model';

@Component({
  selector: 'app-editor',
  templateUrl: 'editor.component.html',
  styleUrls: ['editor.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgxEditorComponent,
    NgxEditorMenuComponent,
    NgxEditorFloatingMenuComponent,
    AppCustomMenuComponent,
    PdfMenuComponent,
    NgxDropzoneModule,
    PdfViewerModule,
    EditorMdUploadComponent,
  ],
})
export class EditorComponent implements OnInit, OnDestroy {
  constructor(private injector: Injector, private applicationRef: ApplicationRef, private mdService: MdService) {}
  isDevMode = isDevMode();
  editordoc = jsonDoc;
  editor: Editor;
  toolbar: Toolbar = DEFAULT_TOOLBAR;

  private messageListener = (event: MessageEvent): void => {
    // Only accept messages from the specified origin
    if (!event || event.origin !== 'http://localhost:4200') {
      return;
    }

    const receivedData: unknown = event.data;
    let markdownContent: string | null = null;
    if (typeof receivedData === 'string') {
      markdownContent = receivedData;
    } else if (
      receivedData &&
      typeof receivedData === 'object' &&
      (receivedData as { type?: unknown; content?: unknown }).type === 'loadEditorContent' &&
      typeof (receivedData as { content?: unknown }).content === 'string'
    ) {
      markdownContent = (receivedData as { content: string }).content;
    }
    if (!markdownContent || markdownContent.trim().length === 0) {
      return;
    }

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('mdFileContent', markdownContent);
      }
    } catch {
      // Ignore storage errors
    }

    // If editor is ready, apply the content immediately
    if (this.editor) {
      const html = this.mdService.markdownToHtml(markdownContent);
      this.setEditorContentHtml(html);
    }
  };

  form = new FormGroup({
    editorContent: new FormControl({ value: jsonDoc, disabled: false }, Validators.required(schema)),
  });

  get doc(): AbstractControl {
    return this.form.get('editorContent');
  }

  ngOnInit(): void {
    initNodeViews(this.injector, this.applicationRef);
    this.editor = new Editor({
      schema,
      nodeViews,
      history: true,
      keyboardShortcuts: true,
      inputRules: true,
      attributes: { enterkeyhint: 'enter' },
      features: {
        linkOnPaste: true,
        resizeImage: true,
      },
    });

    // Load content from query param `data` if present; else fallback to localStorage
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        const raw = url.searchParams.get('data');
        if (raw && raw.trim().length > 0) {
          const decoded = this.decodeIncomingData(raw);
          this.loadMarkdownIntoEditor(decoded);
          try {
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('mdFileContent', decoded);
            }
          } catch {
            // ignore storage errors
          }
          // Remove the `data` query parameter to avoid re-inserting on refresh
          try {
            url.searchParams.delete('data');
            window.history.replaceState({}, document.title, url.toString());
          } catch {
            // ignore URL manipulation errors
          }
        } else if (typeof localStorage !== 'undefined') {
          const markdown = localStorage.getItem('mdFileContent');
          if (markdown && markdown.trim().length > 0) {
            const html = this.mdService.markdownToHtml(markdown);
            this.setEditorContentHtml(html);
          }
        }
        // Listen for incoming Markdown from trusted origin and apply immediately
        window.addEventListener('message', this.messageListener);
      }
    } catch {
      // noop: fail silently if access to localStorage / window is not available
    }
  }

  ngOnDestroy(): void {
    try {
      if (typeof window !== 'undefined') {
        window.removeEventListener('message', this.messageListener);
      }
    } catch {
      // ignore
    }
    this.editor.destroy();
  }

  /**
   * Returns the current editor content as HTML.
   */
  getEditorContentHtml = (): string => {
    return this.editor ? this.editor.view.dom.innerHTML : '';
  };

  /**
   * Converts HTML to ProseMirror JSON using the schema.
   */
  htmlToProseMirrorJSON(html: string): any {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const pmDoc = ProseMirrorDOMParser.fromSchema(schema).parse(doc.body);
    return pmDoc.toJSON();
  }

  /**
   * Sets the editor content from HTML, replacing the current document.
   */
  setEditorContentHtml = (html: string): void => {
    const json = this.htmlToProseMirrorJSON(html);
    this.form.get('editorContent')?.setValue(json);
  };

  /**
   * Gets the currently selected text in the editor.
   */
  getEditorSelection = (): string => {
    if (!this.editor) return '';
    const state = this.editor.view.state;
    const { from, to } = state.selection;
    return state.doc.textBetween(from, to, ' ');
  };

  /**
   * Replaces the currently selected text in the editor with the given text.
   */
  replaceEditorSelection = (text: string): void => {
    if (!this.editor) return;
    const { view } = this.editor;
    const { state, dispatch } = view;
    const { from, to } = state.selection;
    dispatch(state.tr.insertText(text, from, to));
  };

  private decodeIncomingData(raw: string): string {
    let output = raw;
    // Try URI decode first
    try {
      output = decodeURIComponent(output);
    } catch {
      // ignore URI decode errors
    }
    // Attempt Base64 decode only if it looks like Base64
    const base64Candidate = output.replace(/\s+/g, '');
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    if (base64Candidate.length % 4 === 0 && base64Regex.test(base64Candidate)) {
      try {
        const binary = atob(base64Candidate);
        const bytes = new Uint8Array(binary.split('').map((c) => c.charCodeAt(0)));
        output = new TextDecoder('utf-8').decode(bytes);
      } catch {
        // ignore Base64 decode errors; fall back to original
      }
    }
    return output;
  }

  private loadMarkdownIntoEditor(markdown: string): void {
    if (!markdown || markdown.trim().length === 0) return;
    const html = this.mdService.markdownToHtml(markdown);
    this.setEditorContentHtml(html);
  }
}