import { Node as ProseMirrorNode } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import { CodeMirrorView } from 'prosemirror-codemirror-6';
import { minimalSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { createCustomElement } from '@angular/elements';
import { ApplicationRef, Injector, Type } from '@angular/core';
import { PdfViewComponent } from './pdf-view.component';

let injector: Injector;
let applicationRef: ApplicationRef;

export function initNodeViews(i: Injector, a: ApplicationRef) {
  injector = i;
  applicationRef = a;
  
  // Register custom element
  const PdfElement = createCustomElement(PdfViewComponent, { injector });
  customElements.define('pdf-view-element', PdfElement);
}

const nodeViews = {
  code_mirror: (node: ProseMirrorNode, view: EditorView, getPos: () => number): CodeMirrorView => {
    return new CodeMirrorView({
      node,
      view,
      getPos,
      cmOptions: {
        extensions: [
          minimalSetup,
          javascript(),
        ],
      },
    });
  },
  pdf: (node: ProseMirrorNode, view: EditorView, getPos: () => number) => {
    const element = document.createElement('pdf-view-element');
    element.setAttribute('node', JSON.stringify(node));
    element.setAttribute('view', JSON.stringify(view));
    element.setAttribute('get-pos', getPos.toString());
    
    return {
      dom: element,
      update: (node: ProseMirrorNode) => {
        element.setAttribute('node', JSON.stringify(node));
        return true;
      },
      destroy: () => {
        // Cleanup if needed
      }
    };
  }
};

export default nodeViews;