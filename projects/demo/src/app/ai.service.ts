import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AiService {
  /**
   * Placeholder for AI rewrite. Returns a prefixed string.
   * @param text The text to rewrite
   * @returns Promise<string> rewritten text
   */
  async rewrite(text: string): Promise<string> {
    // Placeholder: Replace with real AI call
    return Promise.resolve('AI rewritten: ' + text);
  }
}