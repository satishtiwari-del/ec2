import { Component, EventEmitter, Output, Input } from '@angular/core';
import { MdService } from '../../md.service';
import { AiService } from '../../ai.service';

@Component({
  selector: 'app-editor-md-upload',
  templateUrl: './editor-md-upload.component.html',
  styleUrls: ['./editor-md-upload.component.css'],
  standalone: true,
  providers: [MdService, AiService],
})
export class EditorMdUploadComponent {
  @Input() getEditorContent!: () => string;
  @Input() setEditorContent!: (html: string) => void;
  @Input() getEditorSelection!: () => string;
  @Input() replaceEditorSelection!: (text: string) => void;

  constructor(private mdService: MdService, private aiService: AiService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (!file.name.endsWith('.md')) {
      alert('Only .md (Markdown) files are allowed.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const markdown = reader.result as string;
      const html = this.mdService.markdownToHtml(markdown);
      this.setEditorContent(html);
    };
    reader.readAsText(file);
  }

  exportAsMarkdown(): void {
    const html = this.getEditorContent();
    const markdown = this.mdService.htmlToMarkdown(html);
    this.downloadFile(markdown, 'editor-content.md', 'text/markdown');
  }

  exportAsHtml(): void {
    const html = this.getEditorContent();
    this.downloadFile(html, 'editor-content.html', 'text/html');
  }

  private downloadFile(content: string, filename: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async aiRewriteSelection(): Promise<void> {
    const selection = this.getEditorSelection();
    if (!selection) {
      alert('Please select some text in the editor to rewrite.');
      return;
    }
    const rewritten = await this.aiService.rewrite(selection);
    this.replaceEditorSelection(rewritten);
  }
}