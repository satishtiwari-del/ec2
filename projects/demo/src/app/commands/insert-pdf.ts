import { EditorState } from 'prosemirror-state';
import * as pdfjsLib from 'pdfjs-dist';

interface Command {
  execute: (state: EditorState, dispatch?: (tr: any) => void) => boolean;
  isEnabled?: (state: EditorState) => boolean;
}

export const insertPdf: Command = {
  execute: (state, dispatch) => {
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const pdfData = e.target.result;
          
          // Extract text from PDF
          pdfjsLib.getDocument(pdfData).promise.then((pdf: any) => {
            let textContent = '';
            const numPages = pdf.numPages;
            const promises = [];
            
            for (let i = 1; i <= numPages; i++) {
              promises.push(
                pdf.getPage(i).then((page: any) => {
                  return page.getTextContent().then((content: any) => {
                    content.items.forEach((item: any) => {
                      textContent += item.str + ' ';
                    });
                    textContent += '\\n\\n';
                  });
                })
              );
            }

            Promise.all(promises).then(() => {
              if (dispatch) {
                const tr = state.tr;
                
                // Delete all existing content
                tr.delete(0, state.doc.content.size);
                
                // Split text into paragraphs
                const paragraphs = textContent.split('\\n\\n').filter(p => p.trim());
                
                // Add title
                const titleNode = state.schema.nodes['heading'].create(
                  { level: 1, align: null },
                  [state.schema.text('PDF Content')]
                );
                tr.insert(0, titleNode);
                
                // Add paragraphs
                let pos = tr.doc.content.size;
                paragraphs.forEach(text => {
                  if (text.trim()) {
                    const paraNode = state.schema.nodes['paragraph'].create(
                      { align: null },
                      [state.schema.text(text.trim())]
                    );
                    tr.insert(pos, paraNode);
                    pos = tr.doc.content.size;
                  }
                });
                
                dispatch(tr);
              }
            });
          });
        };
        reader.readAsDataURL(file);
      }
    };
    
    // Trigger file selection
    input.click();
    return true;
  },
  
  isEnabled: (state) => {
    return true;
  },
};