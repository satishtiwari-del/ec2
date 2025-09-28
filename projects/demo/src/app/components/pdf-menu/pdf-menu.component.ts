import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Editor } from 'ngx-editor';
import { insertPdf } from '../../commands/insert-pdf';

@Component({
  selector: 'app-pdf-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="menu-item">
      <button (click)="onClick()" title="Upload PDF">
        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
          <path d="M0 0h24v24H0z" fill="none"/>
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
          <path d="M16 11h-3V8h-2v3H8v2h3v3h2v-3h3z"/>
        </svg>
        <span>PDF</span>
      </button>
    </div>
  `,
  styles: [`
    .menu-item {
      display: inline-block;
      margin: 0 5px;
    }
    button {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 5px 10px;
      background: none;
      border: none;
      cursor: pointer;
      color: inherit;
      font-size: inherit;
      
      &:hover {
        background-color: #f0f0f0;
      }
      
      svg {
        width: 20px;
        height: 20px;
      }
    }
  `]
})
export class PdfMenuComponent {
  @Input() editor: Editor;

  onClick() {
    const { state, dispatch } = this.editor.view;
    insertPdf.execute(state, dispatch);
  }
}