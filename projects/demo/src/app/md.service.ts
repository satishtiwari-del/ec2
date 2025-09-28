import { Injectable } from '@angular/core';
import { marked } from 'marked';
import TurndownService from 'turndown';

@Injectable({ providedIn: 'root' })
export class MdService {
  private turndownService = new TurndownService();

  /**
   * Converts Markdown to HTML using marked.
   * @param markdown Markdown string
   * @returns HTML string
   */
  markdownToHtml(markdown: string): string {
    return marked.parse(markdown) as string;
  }

  /**
   * Converts HTML to Markdown using Turndown.
   * @param html HTML string
   * @returns Markdown string
   */
  htmlToMarkdown(html: string): string {
    return this.turndownService.turndown(html);
  }
}