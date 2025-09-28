import {
  Fragment,
  NodeRange,
  ReplaceAroundStep,
  Schema,
  Selection,
  Slice,
  canJoin,
  canSplit,
  findWrapping,
  liftTarget
} from "./chunk-3FOTMRUO.js";
import {
  __spreadProps,
  __spreadValues
} from "./chunk-WDMUDEB6.js";

// node_modules/prosemirror-schema-list/dist/index.js
var olDOM = ["ol", 0];
var ulDOM = ["ul", 0];
var liDOM = ["li", 0];
var orderedList = {
  attrs: { order: { default: 1, validate: "number" } },
  parseDOM: [{ tag: "ol", getAttrs(dom) {
    return { order: dom.hasAttribute("start") ? +dom.getAttribute("start") : 1 };
  } }],
  toDOM(node) {
    return node.attrs.order == 1 ? olDOM : ["ol", { start: node.attrs.order }, 0];
  }
};
var bulletList = {
  parseDOM: [{ tag: "ul" }],
  toDOM() {
    return ulDOM;
  }
};
var listItem = {
  parseDOM: [{ tag: "li" }],
  toDOM() {
    return liDOM;
  },
  defining: true
};
function wrapInList(listType, attrs = null) {
  return function(state, dispatch) {
    let { $from, $to } = state.selection;
    let range = $from.blockRange($to);
    if (!range)
      return false;
    let tr = dispatch ? state.tr : null;
    if (!wrapRangeInList(tr, range, listType, attrs))
      return false;
    if (dispatch)
      dispatch(tr.scrollIntoView());
    return true;
  };
}
function wrapRangeInList(tr, range, listType, attrs = null) {
  let doJoin = false, outerRange = range, doc2 = range.$from.doc;
  if (range.depth >= 2 && range.$from.node(range.depth - 1).type.compatibleContent(listType) && range.startIndex == 0) {
    if (range.$from.index(range.depth - 1) == 0)
      return false;
    let $insert = doc2.resolve(range.start - 2);
    outerRange = new NodeRange($insert, $insert, range.depth);
    if (range.endIndex < range.parent.childCount)
      range = new NodeRange(range.$from, doc2.resolve(range.$to.end(range.depth)), range.depth);
    doJoin = true;
  }
  let wrap = findWrapping(outerRange, listType, attrs, range);
  if (!wrap)
    return false;
  if (tr)
    doWrapInList(tr, range, wrap, doJoin, listType);
  return true;
}
function doWrapInList(tr, range, wrappers, joinBefore, listType) {
  let content = Fragment.empty;
  for (let i = wrappers.length - 1; i >= 0; i--)
    content = Fragment.from(wrappers[i].type.create(wrappers[i].attrs, content));
  tr.step(new ReplaceAroundStep(range.start - (joinBefore ? 2 : 0), range.end, range.start, range.end, new Slice(content, 0, 0), wrappers.length, true));
  let found = 0;
  for (let i = 0; i < wrappers.length; i++)
    if (wrappers[i].type == listType)
      found = i + 1;
  let splitDepth = wrappers.length - found;
  let splitPos = range.start + wrappers.length - (joinBefore ? 2 : 0), parent = range.parent;
  for (let i = range.startIndex, e = range.endIndex, first = true; i < e; i++, first = false) {
    if (!first && canSplit(tr.doc, splitPos, splitDepth)) {
      tr.split(splitPos, splitDepth);
      splitPos += 2 * splitDepth;
    }
    splitPos += parent.child(i).nodeSize;
  }
  return tr;
}
function splitListItem(itemType, itemAttrs) {
  return function(state, dispatch) {
    let { $from, $to, node } = state.selection;
    if (node && node.isBlock || $from.depth < 2 || !$from.sameParent($to))
      return false;
    let grandParent = $from.node(-1);
    if (grandParent.type != itemType)
      return false;
    if ($from.parent.content.size == 0 && $from.node(-1).childCount == $from.indexAfter(-1)) {
      if ($from.depth == 3 || $from.node(-3).type != itemType || $from.index(-2) != $from.node(-2).childCount - 1)
        return false;
      if (dispatch) {
        let wrap = Fragment.empty;
        let depthBefore = $from.index(-1) ? 1 : $from.index(-2) ? 2 : 3;
        for (let d = $from.depth - depthBefore; d >= $from.depth - 3; d--)
          wrap = Fragment.from($from.node(d).copy(wrap));
        let depthAfter = $from.indexAfter(-1) < $from.node(-2).childCount ? 1 : $from.indexAfter(-2) < $from.node(-3).childCount ? 2 : 3;
        wrap = wrap.append(Fragment.from(itemType.createAndFill()));
        let start = $from.before($from.depth - (depthBefore - 1));
        let tr2 = state.tr.replace(start, $from.after(-depthAfter), new Slice(wrap, 4 - depthBefore, 0));
        let sel = -1;
        tr2.doc.nodesBetween(start, tr2.doc.content.size, (node2, pos) => {
          if (sel > -1)
            return false;
          if (node2.isTextblock && node2.content.size == 0)
            sel = pos + 1;
        });
        if (sel > -1)
          tr2.setSelection(Selection.near(tr2.doc.resolve(sel)));
        dispatch(tr2.scrollIntoView());
      }
      return true;
    }
    let nextType = $to.pos == $from.end() ? grandParent.contentMatchAt(0).defaultType : null;
    let tr = state.tr.delete($from.pos, $to.pos);
    let types = nextType ? [itemAttrs ? { type: itemType, attrs: itemAttrs } : null, { type: nextType }] : void 0;
    if (!canSplit(tr.doc, $from.pos, 2, types))
      return false;
    if (dispatch)
      dispatch(tr.split($from.pos, 2, types).scrollIntoView());
    return true;
  };
}
function liftListItem(itemType) {
  return function(state, dispatch) {
    let { $from, $to } = state.selection;
    let range = $from.blockRange($to, (node) => node.childCount > 0 && node.firstChild.type == itemType);
    if (!range)
      return false;
    if (!dispatch)
      return true;
    if ($from.node(range.depth - 1).type == itemType)
      return liftToOuterList(state, dispatch, itemType, range);
    else
      return liftOutOfList(state, dispatch, range);
  };
}
function liftToOuterList(state, dispatch, itemType, range) {
  let tr = state.tr, end = range.end, endOfList = range.$to.end(range.depth);
  if (end < endOfList) {
    tr.step(new ReplaceAroundStep(end - 1, endOfList, end, endOfList, new Slice(Fragment.from(itemType.create(null, range.parent.copy())), 1, 0), 1, true));
    range = new NodeRange(tr.doc.resolve(range.$from.pos), tr.doc.resolve(endOfList), range.depth);
  }
  const target = liftTarget(range);
  if (target == null)
    return false;
  tr.lift(range, target);
  let $after = tr.doc.resolve(tr.mapping.map(end, -1) - 1);
  if (canJoin(tr.doc, $after.pos) && $after.nodeBefore.type == $after.nodeAfter.type)
    tr.join($after.pos);
  dispatch(tr.scrollIntoView());
  return true;
}
function liftOutOfList(state, dispatch, range) {
  let tr = state.tr, list = range.parent;
  for (let pos = range.end, i = range.endIndex - 1, e = range.startIndex; i > e; i--) {
    pos -= list.child(i).nodeSize;
    tr.delete(pos - 1, pos + 1);
  }
  let $start = tr.doc.resolve(range.start), item = $start.nodeAfter;
  if (tr.mapping.map(range.end) != range.start + $start.nodeAfter.nodeSize)
    return false;
  let atStart = range.startIndex == 0, atEnd = range.endIndex == list.childCount;
  let parent = $start.node(-1), indexBefore = $start.index(-1);
  if (!parent.canReplace(indexBefore + (atStart ? 0 : 1), indexBefore + 1, item.content.append(atEnd ? Fragment.empty : Fragment.from(list))))
    return false;
  let start = $start.pos, end = start + item.nodeSize;
  tr.step(new ReplaceAroundStep(start - (atStart ? 1 : 0), end + (atEnd ? 1 : 0), start + 1, end - 1, new Slice((atStart ? Fragment.empty : Fragment.from(list.copy(Fragment.empty))).append(atEnd ? Fragment.empty : Fragment.from(list.copy(Fragment.empty))), atStart ? 0 : 1, atEnd ? 0 : 1), atStart ? 0 : 1));
  dispatch(tr.scrollIntoView());
  return true;
}
function sinkListItem(itemType) {
  return function(state, dispatch) {
    let { $from, $to } = state.selection;
    let range = $from.blockRange($to, (node) => node.childCount > 0 && node.firstChild.type == itemType);
    if (!range)
      return false;
    let startIndex = range.startIndex;
    if (startIndex == 0)
      return false;
    let parent = range.parent, nodeBefore = parent.child(startIndex - 1);
    if (nodeBefore.type != itemType)
      return false;
    if (dispatch) {
      let nestedBefore = nodeBefore.lastChild && nodeBefore.lastChild.type == parent.type;
      let inner = Fragment.from(nestedBefore ? itemType.create() : null);
      let slice = new Slice(Fragment.from(itemType.create(null, Fragment.from(parent.type.create(null, inner)))), nestedBefore ? 3 : 1, 0);
      let before = range.start, after = range.end;
      dispatch(state.tr.step(new ReplaceAroundStep(before - (nestedBefore ? 3 : 1), after, before, after, slice, 1, true)).scrollIntoView());
    }
    return true;
  };
}

// node_modules/ngx-editor/fesm2022/ngx-editor-utils.mjs
var isNil = (val) => {
  return typeof val === "undefined" || val === null;
};
var camelToDashed = (str) => {
  return str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
};
var cleanObject = (obj) => {
  const cleanObj = {};
  Object.keys(obj).forEach((prop) => {
    if (obj[prop] && typeof obj[prop] === "string") {
      cleanObj[prop] = obj[prop];
    }
  });
  return cleanObj;
};
var toStyleString = (obj) => {
  const styles = cleanObject(obj);
  return Object.entries(styles).map(([k, v]) => `${camelToDashed(k)}:${v}`).join(";");
};
var NgxEditorError = class extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
};
var uniq = () => {
  const timeStamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `${timeStamp}${random}`;
};
var clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

// node_modules/ngx-editor/fesm2022/ngx-editor-schema.mjs
var link = {
  attrs: {
    href: {},
    title: { default: null },
    target: { default: "_blank" }
  },
  inclusive: false,
  parseDOM: [
    {
      tag: "a[href]",
      getAttrs(dom) {
        return {
          href: dom.getAttribute("href"),
          title: dom.getAttribute("title"),
          target: dom.getAttribute("target")
        };
      }
    }
  ],
  toDOM(node) {
    const { href, title, target } = node.attrs;
    return ["a", { href, title, target }, 0];
  }
};
var em = {
  parseDOM: [
    { tag: "i" },
    { tag: "em" },
    { style: "font-style=italic" }
  ],
  toDOM() {
    return ["em", 0];
  }
};
var strong = {
  parseDOM: [
    { tag: "strong" },
    // This works around a Google Docs misbehavior where
    // pasted content will be inexplicably wrapped in `<b>`
    // tags with a font-weight normal.
    {
      tag: "b",
      getAttrs: (dom) => {
        return dom.style.fontWeight !== "normal" && null;
      }
    },
    {
      style: "font-weight",
      getAttrs: (value) => {
        return /^(?:bold(?:er)?|[5-9]\d{2,})$/.test(value) && null;
      }
    }
  ],
  toDOM() {
    return ["strong", 0];
  }
};
var code = {
  parseDOM: [
    { tag: "code" }
  ],
  toDOM() {
    return ["code", 0];
  }
};
var u = {
  parseDOM: [
    { tag: "u" },
    {
      style: "text-decoration=underline",
      consuming: false
    }
  ],
  toDOM() {
    return ["u", 0];
  }
};
var s = {
  parseDOM: [
    { tag: "s" },
    { tag: "strike" },
    { style: "text-decoration=line-through" }
  ],
  toDOM() {
    return ["s", 0];
  }
};
var textColor = {
  attrs: {
    color: {
      default: null
    }
  },
  parseDOM: [
    {
      style: "color",
      getAttrs: (value) => {
        return { color: value };
      }
    }
  ],
  toDOM(mark) {
    const { color } = mark.attrs;
    return ["span", { style: `color:${color};` }, 0];
  }
};
var textBackgroundColor = {
  attrs: {
    backgroundColor: {
      default: null
    }
  },
  parseDOM: [
    {
      style: "background-color",
      getAttrs: (value) => {
        return { backgroundColor: value };
      }
    }
  ],
  toDOM(mark) {
    const { backgroundColor } = mark.attrs;
    return ["span", { style: `background-color:${backgroundColor};` }, 0];
  }
};
var sup = {
  attrs: {},
  parseDOM: [
    { tag: "sup" },
    { style: "vertical-align=super" }
  ],
  toDOM() {
    return ["sup", 0];
  }
};
var sub = {
  attrs: {},
  parseDOM: [
    { tag: "sub" },
    { style: "vertical-align=sub" }
  ],
  toDOM() {
    return ["sub", 0];
  }
};
var marks = {
  link,
  em,
  strong,
  code,
  u,
  s,
  text_color: textColor,
  text_background_color: textBackgroundColor,
  sup,
  sub
};
var doc = {
  content: "block+"
};
var text = {
  group: "inline"
};
var paragraph = {
  content: "inline*",
  group: "block",
  attrs: {
    align: {
      default: null
    },
    indent: {
      default: null
    }
  },
  parseDOM: [
    {
      tag: "p",
      getAttrs(dom) {
        const { textAlign } = dom.style;
        const align = dom.getAttribute("align") || textAlign || null;
        const indent = dom.getAttribute("data-indent") || null;
        return {
          align,
          indent: parseInt(indent, 10) || null
        };
      }
    }
  ],
  toDOM(node) {
    const { align, indent } = node.attrs;
    const styles = {
      textAlign: align !== "left" ? align : null,
      marginLeft: indent !== null ? `${indent * 40}px` : null
    };
    const style = toStyleString(styles) || null;
    const attrs = {
      style,
      "data-indent": indent ?? null
    };
    return ["p", attrs, 0];
  }
};
var blockquote = {
  content: "block+",
  group: "block",
  defining: true,
  attrs: {
    indent: {
      default: null
    }
  },
  parseDOM: [
    {
      tag: "blockquote",
      getAttrs(dom) {
        const indent = dom.getAttribute("data-indent") || null;
        return {
          indent: parseInt(indent, 10) || null
        };
      }
    }
  ],
  toDOM(node) {
    const { indent } = node.attrs;
    const styles = {
      marginLeft: indent !== null ? `${indent * 40}px` : null
    };
    const style = toStyleString(styles) || null;
    const attrs = {
      style,
      "data-indent": indent ?? null
    };
    return ["blockquote", attrs, 0];
  }
};
var horizontalRule = {
  group: "block",
  parseDOM: [{ tag: "hr" }],
  toDOM() {
    return ["hr"];
  }
};
var heading = {
  attrs: {
    level: {
      default: 1
    },
    align: {
      default: null
    },
    indent: {
      default: null
    }
  },
  content: "inline*",
  group: "block",
  defining: true,
  parseDOM: [
    {
      tag: "h1",
      getAttrs(dom) {
        const { textAlign } = dom.style;
        const align = dom.getAttribute("align") || textAlign || null;
        const indent = dom.getAttribute("data-indent") || null;
        return {
          level: 1,
          align,
          indent: parseInt(indent, 10) || null
        };
      }
    },
    {
      tag: "h2",
      getAttrs(dom) {
        const { textAlign } = dom.style;
        const align = dom.getAttribute("align") || textAlign || null;
        const indent = dom.getAttribute("data-indent") || null;
        return {
          level: 2,
          align,
          indent: parseInt(indent, 10) || null
        };
      }
    },
    {
      tag: "h3",
      getAttrs(dom) {
        const { textAlign } = dom.style;
        const align = dom.getAttribute("align") || textAlign || null;
        const indent = dom.getAttribute("data-indent") || null;
        return {
          level: 3,
          align,
          indent: parseInt(indent, 10) || null
        };
      }
    },
    {
      tag: "h4",
      getAttrs(dom) {
        const { textAlign } = dom.style;
        const align = dom.getAttribute("align") || textAlign || null;
        const indent = dom.getAttribute("data-indent") || null;
        return {
          level: 4,
          align,
          indent: parseInt(indent, 10) || null
        };
      }
    },
    {
      tag: "h5",
      getAttrs(dom) {
        const { textAlign } = dom.style;
        const align = dom.getAttribute("align") || textAlign || null;
        const indent = dom.getAttribute("data-indent") || null;
        return {
          level: 5,
          align,
          indent: parseInt(indent, 10) || null
        };
      }
    },
    {
      tag: "h6",
      getAttrs(dom) {
        const { textAlign } = dom.style;
        const align = dom.getAttribute("align") || textAlign || null;
        const indent = dom.getAttribute("data-indent") || null;
        return {
          level: 6,
          align,
          indent: parseInt(indent, 10) || null
        };
      }
    }
  ],
  toDOM(node) {
    const { level, align, indent } = node.attrs;
    const styles = {
      textAlign: align !== "left" ? align : null,
      marginLeft: indent !== null ? `${indent * 40}px` : null
    };
    const style = toStyleString(styles) || null;
    const attrs = {
      style,
      "data-indent": indent ?? null
    };
    return [`h${level}`, attrs, 0];
  }
};
var codeBlock = {
  content: "text*",
  marks: "",
  group: "block",
  code: true,
  defining: true,
  parseDOM: [
    {
      tag: "pre",
      preserveWhitespace: "full"
    }
  ],
  toDOM() {
    return ["pre", ["code", 0]];
  }
};
var hardBreak = {
  inline: true,
  group: "inline",
  selectable: false,
  parseDOM: [{ tag: "br" }],
  toDOM() {
    return ["br"];
  }
};
var image = {
  inline: true,
  attrs: {
    src: {},
    alt: { default: null },
    title: { default: null },
    width: { default: null }
  },
  group: "inline",
  draggable: true,
  parseDOM: [
    {
      tag: "img[src]",
      getAttrs(dom) {
        return {
          src: dom.getAttribute("src"),
          title: dom.getAttribute("title"),
          alt: dom.getAttribute("alt"),
          width: dom.getAttribute("width")
        };
      }
    }
  ],
  toDOM(node) {
    const { src, alt, title, width } = node.attrs;
    return ["img", { src, alt, title, width }];
  }
};
var listItem2 = __spreadProps(__spreadValues({}, listItem), {
  content: "paragraph block*"
});
var orderedList2 = __spreadProps(__spreadValues({}, orderedList), {
  content: "list_item+",
  group: "block"
});
var bulletList2 = __spreadProps(__spreadValues({}, bulletList), {
  content: "list_item+",
  group: "block"
});
var nodes = {
  doc,
  text,
  paragraph,
  blockquote,
  horizontal_rule: horizontalRule,
  heading,
  hard_break: hardBreak,
  code_block: codeBlock,
  image,
  list_item: listItem2,
  ordered_list: orderedList2,
  bullet_list: bulletList2
};
var schema = new Schema({
  marks,
  nodes
});

export {
  wrapInList,
  splitListItem,
  liftListItem,
  sinkListItem,
  isNil,
  NgxEditorError,
  uniq,
  clamp,
  marks,
  nodes,
  schema
};
//# sourceMappingURL=chunk-SHP7R4LE.js.map
