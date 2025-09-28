import { nodes as basicNodes, marks } from 'ngx-editor';
import { Schema, NodeSpec } from 'prosemirror-model';
import { node as codeMirrorNode } from 'prosemirror-codemirror-6';
import OrderedMap from 'orderedmap';

const nodes: { [key: string]: NodeSpec } = {
  ...basicNodes,
  code_mirror: codeMirrorNode,
  pdf: {
    inline: false,
    attrs: {
      src: { default: null },
      title: { default: null },
      highlights: { default: '[]' }
    },
    group: "block",
    draggable: true,
    parseDOM: [{
      tag: "div[data-pdf]",
      getAttrs(dom) {
        return {
          src: dom.getAttribute("data-src"),
          title: dom.getAttribute("data-title"),
          highlights: dom.getAttribute("data-highlights") || '[]'
        };
      }
    }],
    toDOM(node) {
      const attrs = {
        "data-pdf": "true",
        "data-src": node.attrs["src"],
        "data-title": node.attrs["title"],
        "data-highlights": node.attrs["highlights"]
      };
      return ["div", attrs, 0];
    }
  }
};

const schema = new Schema({
  nodes: OrderedMap.from(nodes),
  marks,
});

export default schema;
