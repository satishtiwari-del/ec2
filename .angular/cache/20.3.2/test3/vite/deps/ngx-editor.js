import {
  Decoration,
  DecorationSet,
  EditorView
} from "./chunk-DKMP3LPG.js";
import {
  NgxEditorError,
  clamp,
  isNil,
  liftListItem,
  marks,
  nodes,
  schema,
  sinkListItem,
  splitListItem,
  uniq,
  wrapInList
} from "./chunk-SHP7R4LE.js";
import {
  AllSelection,
  DOMParser,
  DOMSerializer,
  EditorState,
  Fragment,
  Mapping,
  NodeSelection,
  Plugin,
  PluginKey,
  ReplaceAroundStep,
  Selection,
  SelectionRange,
  Slice,
  TextSelection,
  canJoin,
  canSplit,
  findWrapping,
  liftTarget,
  replaceStep
} from "./chunk-3FOTMRUO.js";
import {
  DomSanitizer
} from "./chunk-5AXZPPWM.js";
import "./chunk-YU5PUYJT.js";
import {
  CheckboxControlValueAccessor,
  DefaultValueAccessor,
  FormControl,
  FormControlName,
  FormGroup,
  FormGroupDirective,
  NG_VALUE_ACCESSOR,
  NgControlStatus,
  NgControlStatusGroup,
  ReactiveFormsModule,
  Validators,
  ɵNgNoValidate
} from "./chunk-JHOZZ4DP.js";
import "./chunk-6OZ6UGMT.js";
import {
  AsyncPipe,
  CommonModule,
  KeyValuePipe,
  NgClass,
  NgForOf,
  NgIf,
  NgStyle,
  NgTemplateOutlet
} from "./chunk-KZ44QYVE.js";
import "./chunk-ZJ25XCV3.js";
import {
  ApplicationRef,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Injectable,
  InjectionToken,
  Injector,
  Input,
  NgModule,
  Optional,
  Output,
  Pipe,
  Renderer2,
  ViewChild,
  ViewEncapsulation,
  createComponent,
  forwardRef,
  setClassMetadata,
  ɵɵNgOnChangesFeature,
  ɵɵProvidersFeature,
  ɵɵadvance,
  ɵɵariaProperty,
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵclassProp,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdefinePipe,
  ɵɵdirectiveInject,
  ɵɵdomElementEnd,
  ɵɵdomElementStart,
  ɵɵdomListener,
  ɵɵdomProperty,
  ɵɵelement,
  ɵɵelementContainer,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵinject,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵprojection,
  ɵɵprojectionDef,
  ɵɵproperty,
  ɵɵpureFunction1,
  ɵɵpureFunction2,
  ɵɵqueryRefresh,
  ɵɵreference,
  ɵɵresetView,
  ɵɵresolveDocument,
  ɵɵrestoreView,
  ɵɵsanitizeHtml,
  ɵɵsanitizeUrl,
  ɵɵstyleMap,
  ɵɵstyleProp,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵviewQuery
} from "./chunk-GUR423XC.js";
import "./chunk-JRFR6BLO.js";
import {
  fromEvent,
  isObservable
} from "./chunk-HWYXSU2G.js";
import {
  Subject,
  asyncScheduler,
  of,
  takeUntil,
  throttleTime
} from "./chunk-MARUHEWW.js";
import {
  __async,
  __objRest,
  __spreadProps,
  __spreadValues
} from "./chunk-WDMUDEB6.js";

// node_modules/prosemirror-commands/dist/index.js
var deleteSelection = (state, dispatch) => {
  if (state.selection.empty)
    return false;
  if (dispatch)
    dispatch(state.tr.deleteSelection().scrollIntoView());
  return true;
};
function atBlockStart(state, view) {
  let { $cursor } = state.selection;
  if (!$cursor || (view ? !view.endOfTextblock("backward", state) : $cursor.parentOffset > 0))
    return null;
  return $cursor;
}
var joinBackward = (state, dispatch, view) => {
  let $cursor = atBlockStart(state, view);
  if (!$cursor)
    return false;
  let $cut = findCutBefore($cursor);
  if (!$cut) {
    let range = $cursor.blockRange(), target = range && liftTarget(range);
    if (target == null)
      return false;
    if (dispatch)
      dispatch(state.tr.lift(range, target).scrollIntoView());
    return true;
  }
  let before = $cut.nodeBefore;
  if (deleteBarrier(state, $cut, dispatch, -1))
    return true;
  if ($cursor.parent.content.size == 0 && (textblockAt(before, "end") || NodeSelection.isSelectable(before))) {
    for (let depth = $cursor.depth; ; depth--) {
      let delStep = replaceStep(state.doc, $cursor.before(depth), $cursor.after(depth), Slice.empty);
      if (delStep && delStep.slice.size < delStep.to - delStep.from) {
        if (dispatch) {
          let tr = state.tr.step(delStep);
          tr.setSelection(textblockAt(before, "end") ? Selection.findFrom(tr.doc.resolve(tr.mapping.map($cut.pos, -1)), -1) : NodeSelection.create(tr.doc, $cut.pos - before.nodeSize));
          dispatch(tr.scrollIntoView());
        }
        return true;
      }
      if (depth == 1 || $cursor.node(depth - 1).childCount > 1)
        break;
    }
  }
  if (before.isAtom && $cut.depth == $cursor.depth - 1) {
    if (dispatch)
      dispatch(state.tr.delete($cut.pos - before.nodeSize, $cut.pos).scrollIntoView());
    return true;
  }
  return false;
};
function textblockAt(node, side, only = false) {
  for (let scan = node; scan; scan = side == "start" ? scan.firstChild : scan.lastChild) {
    if (scan.isTextblock)
      return true;
    if (only && scan.childCount != 1)
      return false;
  }
  return false;
}
var selectNodeBackward = (state, dispatch, view) => {
  let { $head, empty } = state.selection, $cut = $head;
  if (!empty)
    return false;
  if ($head.parent.isTextblock) {
    if (view ? !view.endOfTextblock("backward", state) : $head.parentOffset > 0)
      return false;
    $cut = findCutBefore($head);
  }
  let node = $cut && $cut.nodeBefore;
  if (!node || !NodeSelection.isSelectable(node))
    return false;
  if (dispatch)
    dispatch(state.tr.setSelection(NodeSelection.create(state.doc, $cut.pos - node.nodeSize)).scrollIntoView());
  return true;
};
function findCutBefore($pos) {
  if (!$pos.parent.type.spec.isolating)
    for (let i = $pos.depth - 1; i >= 0; i--) {
      if ($pos.index(i) > 0)
        return $pos.doc.resolve($pos.before(i + 1));
      if ($pos.node(i).type.spec.isolating)
        break;
    }
  return null;
}
function atBlockEnd(state, view) {
  let { $cursor } = state.selection;
  if (!$cursor || (view ? !view.endOfTextblock("forward", state) : $cursor.parentOffset < $cursor.parent.content.size))
    return null;
  return $cursor;
}
var joinForward = (state, dispatch, view) => {
  let $cursor = atBlockEnd(state, view);
  if (!$cursor)
    return false;
  let $cut = findCutAfter($cursor);
  if (!$cut)
    return false;
  let after = $cut.nodeAfter;
  if (deleteBarrier(state, $cut, dispatch, 1))
    return true;
  if ($cursor.parent.content.size == 0 && (textblockAt(after, "start") || NodeSelection.isSelectable(after))) {
    let delStep = replaceStep(state.doc, $cursor.before(), $cursor.after(), Slice.empty);
    if (delStep && delStep.slice.size < delStep.to - delStep.from) {
      if (dispatch) {
        let tr = state.tr.step(delStep);
        tr.setSelection(textblockAt(after, "start") ? Selection.findFrom(tr.doc.resolve(tr.mapping.map($cut.pos)), 1) : NodeSelection.create(tr.doc, tr.mapping.map($cut.pos)));
        dispatch(tr.scrollIntoView());
      }
      return true;
    }
  }
  if (after.isAtom && $cut.depth == $cursor.depth - 1) {
    if (dispatch)
      dispatch(state.tr.delete($cut.pos, $cut.pos + after.nodeSize).scrollIntoView());
    return true;
  }
  return false;
};
var selectNodeForward = (state, dispatch, view) => {
  let { $head, empty } = state.selection, $cut = $head;
  if (!empty)
    return false;
  if ($head.parent.isTextblock) {
    if (view ? !view.endOfTextblock("forward", state) : $head.parentOffset < $head.parent.content.size)
      return false;
    $cut = findCutAfter($head);
  }
  let node = $cut && $cut.nodeAfter;
  if (!node || !NodeSelection.isSelectable(node))
    return false;
  if (dispatch)
    dispatch(state.tr.setSelection(NodeSelection.create(state.doc, $cut.pos)).scrollIntoView());
  return true;
};
function findCutAfter($pos) {
  if (!$pos.parent.type.spec.isolating)
    for (let i = $pos.depth - 1; i >= 0; i--) {
      let parent = $pos.node(i);
      if ($pos.index(i) + 1 < parent.childCount)
        return $pos.doc.resolve($pos.after(i + 1));
      if (parent.type.spec.isolating)
        break;
    }
  return null;
}
var lift = (state, dispatch) => {
  let { $from, $to } = state.selection;
  let range = $from.blockRange($to), target = range && liftTarget(range);
  if (target == null)
    return false;
  if (dispatch)
    dispatch(state.tr.lift(range, target).scrollIntoView());
  return true;
};
var newlineInCode = (state, dispatch) => {
  let { $head, $anchor } = state.selection;
  if (!$head.parent.type.spec.code || !$head.sameParent($anchor))
    return false;
  if (dispatch)
    dispatch(state.tr.insertText("\n").scrollIntoView());
  return true;
};
function defaultBlockAt(match) {
  for (let i = 0; i < match.edgeCount; i++) {
    let { type } = match.edge(i);
    if (type.isTextblock && !type.hasRequiredAttrs())
      return type;
  }
  return null;
}
var exitCode = (state, dispatch) => {
  let { $head, $anchor } = state.selection;
  if (!$head.parent.type.spec.code || !$head.sameParent($anchor))
    return false;
  let above = $head.node(-1), after = $head.indexAfter(-1), type = defaultBlockAt(above.contentMatchAt(after));
  if (!type || !above.canReplaceWith(after, after, type))
    return false;
  if (dispatch) {
    let pos = $head.after(), tr = state.tr.replaceWith(pos, pos, type.createAndFill());
    tr.setSelection(Selection.near(tr.doc.resolve(pos), 1));
    dispatch(tr.scrollIntoView());
  }
  return true;
};
var createParagraphNear = (state, dispatch) => {
  let sel = state.selection, { $from, $to } = sel;
  if (sel instanceof AllSelection || $from.parent.inlineContent || $to.parent.inlineContent)
    return false;
  let type = defaultBlockAt($to.parent.contentMatchAt($to.indexAfter()));
  if (!type || !type.isTextblock)
    return false;
  if (dispatch) {
    let side = (!$from.parentOffset && $to.index() < $to.parent.childCount ? $from : $to).pos;
    let tr = state.tr.insert(side, type.createAndFill());
    tr.setSelection(TextSelection.create(tr.doc, side + 1));
    dispatch(tr.scrollIntoView());
  }
  return true;
};
var liftEmptyBlock = (state, dispatch) => {
  let { $cursor } = state.selection;
  if (!$cursor || $cursor.parent.content.size)
    return false;
  if ($cursor.depth > 1 && $cursor.after() != $cursor.end(-1)) {
    let before = $cursor.before();
    if (canSplit(state.doc, before)) {
      if (dispatch)
        dispatch(state.tr.split(before).scrollIntoView());
      return true;
    }
  }
  let range = $cursor.blockRange(), target = range && liftTarget(range);
  if (target == null)
    return false;
  if (dispatch)
    dispatch(state.tr.lift(range, target).scrollIntoView());
  return true;
};
function splitBlockAs(splitNode) {
  return (state, dispatch) => {
    let { $from, $to } = state.selection;
    if (state.selection instanceof NodeSelection && state.selection.node.isBlock) {
      if (!$from.parentOffset || !canSplit(state.doc, $from.pos))
        return false;
      if (dispatch)
        dispatch(state.tr.split($from.pos).scrollIntoView());
      return true;
    }
    if (!$from.depth)
      return false;
    let types = [];
    let splitDepth, deflt, atEnd = false, atStart = false;
    for (let d = $from.depth; ; d--) {
      let node = $from.node(d);
      if (node.isBlock) {
        atEnd = $from.end(d) == $from.pos + ($from.depth - d);
        atStart = $from.start(d) == $from.pos - ($from.depth - d);
        deflt = defaultBlockAt($from.node(d - 1).contentMatchAt($from.indexAfter(d - 1)));
        let splitType = splitNode && splitNode($to.parent, atEnd, $from);
        types.unshift(splitType || (atEnd && deflt ? { type: deflt } : null));
        splitDepth = d;
        break;
      } else {
        if (d == 1)
          return false;
        types.unshift(null);
      }
    }
    let tr = state.tr;
    if (state.selection instanceof TextSelection || state.selection instanceof AllSelection)
      tr.deleteSelection();
    let splitPos = tr.mapping.map($from.pos);
    let can = canSplit(tr.doc, splitPos, types.length, types);
    if (!can) {
      types[0] = deflt ? { type: deflt } : null;
      can = canSplit(tr.doc, splitPos, types.length, types);
    }
    if (!can)
      return false;
    tr.split(splitPos, types.length, types);
    if (!atEnd && atStart && $from.node(splitDepth).type != deflt) {
      let first = tr.mapping.map($from.before(splitDepth)), $first = tr.doc.resolve(first);
      if (deflt && $from.node(splitDepth - 1).canReplaceWith($first.index(), $first.index() + 1, deflt))
        tr.setNodeMarkup(tr.mapping.map($from.before(splitDepth)), deflt);
    }
    if (dispatch)
      dispatch(tr.scrollIntoView());
    return true;
  };
}
var splitBlock = splitBlockAs();
var selectAll = (state, dispatch) => {
  if (dispatch)
    dispatch(state.tr.setSelection(new AllSelection(state.doc)));
  return true;
};
function joinMaybeClear(state, $pos, dispatch) {
  let before = $pos.nodeBefore, after = $pos.nodeAfter, index = $pos.index();
  if (!before || !after || !before.type.compatibleContent(after.type))
    return false;
  if (!before.content.size && $pos.parent.canReplace(index - 1, index)) {
    if (dispatch)
      dispatch(state.tr.delete($pos.pos - before.nodeSize, $pos.pos).scrollIntoView());
    return true;
  }
  if (!$pos.parent.canReplace(index, index + 1) || !(after.isTextblock || canJoin(state.doc, $pos.pos)))
    return false;
  if (dispatch)
    dispatch(state.tr.join($pos.pos).scrollIntoView());
  return true;
}
function deleteBarrier(state, $cut, dispatch, dir) {
  let before = $cut.nodeBefore, after = $cut.nodeAfter, conn, match;
  let isolated = before.type.spec.isolating || after.type.spec.isolating;
  if (!isolated && joinMaybeClear(state, $cut, dispatch))
    return true;
  let canDelAfter = !isolated && $cut.parent.canReplace($cut.index(), $cut.index() + 1);
  if (canDelAfter && (conn = (match = before.contentMatchAt(before.childCount)).findWrapping(after.type)) && match.matchType(conn[0] || after.type).validEnd) {
    if (dispatch) {
      let end = $cut.pos + after.nodeSize, wrap = Fragment.empty;
      for (let i = conn.length - 1; i >= 0; i--)
        wrap = Fragment.from(conn[i].create(null, wrap));
      wrap = Fragment.from(before.copy(wrap));
      let tr = state.tr.step(new ReplaceAroundStep($cut.pos - 1, end, $cut.pos, end, new Slice(wrap, 1, 0), conn.length, true));
      let $joinAt = tr.doc.resolve(end + 2 * conn.length);
      if ($joinAt.nodeAfter && $joinAt.nodeAfter.type == before.type && canJoin(tr.doc, $joinAt.pos))
        tr.join($joinAt.pos);
      dispatch(tr.scrollIntoView());
    }
    return true;
  }
  let selAfter = after.type.spec.isolating || dir > 0 && isolated ? null : Selection.findFrom($cut, 1);
  let range = selAfter && selAfter.$from.blockRange(selAfter.$to), target = range && liftTarget(range);
  if (target != null && target >= $cut.depth) {
    if (dispatch)
      dispatch(state.tr.lift(range, target).scrollIntoView());
    return true;
  }
  if (canDelAfter && textblockAt(after, "start", true) && textblockAt(before, "end")) {
    let at = before, wrap = [];
    for (; ; ) {
      wrap.push(at);
      if (at.isTextblock)
        break;
      at = at.lastChild;
    }
    let afterText = after, afterDepth = 1;
    for (; !afterText.isTextblock; afterText = afterText.firstChild)
      afterDepth++;
    if (at.canReplace(at.childCount, at.childCount, afterText.content)) {
      if (dispatch) {
        let end = Fragment.empty;
        for (let i = wrap.length - 1; i >= 0; i--)
          end = Fragment.from(wrap[i].copy(end));
        let tr = state.tr.step(new ReplaceAroundStep($cut.pos - wrap.length, $cut.pos + after.nodeSize, $cut.pos + afterDepth, $cut.pos + after.nodeSize - afterDepth, new Slice(end, wrap.length, 0), 0, true));
        dispatch(tr.scrollIntoView());
      }
      return true;
    }
  }
  return false;
}
function selectTextblockSide(side) {
  return function(state, dispatch) {
    let sel = state.selection, $pos = side < 0 ? sel.$from : sel.$to;
    let depth = $pos.depth;
    while ($pos.node(depth).isInline) {
      if (!depth)
        return false;
      depth--;
    }
    if (!$pos.node(depth).isTextblock)
      return false;
    if (dispatch)
      dispatch(state.tr.setSelection(TextSelection.create(state.doc, side < 0 ? $pos.start(depth) : $pos.end(depth))));
    return true;
  };
}
var selectTextblockStart = selectTextblockSide(-1);
var selectTextblockEnd = selectTextblockSide(1);
function wrapIn(nodeType, attrs = null) {
  return function(state, dispatch) {
    let { $from, $to } = state.selection;
    let range = $from.blockRange($to), wrapping = range && findWrapping(range, nodeType, attrs);
    if (!wrapping)
      return false;
    if (dispatch)
      dispatch(state.tr.wrap(range, wrapping).scrollIntoView());
    return true;
  };
}
function setBlockType(nodeType, attrs = null) {
  return function(state, dispatch) {
    let applicable = false;
    for (let i = 0; i < state.selection.ranges.length && !applicable; i++) {
      let { $from: { pos: from2 }, $to: { pos: to } } = state.selection.ranges[i];
      state.doc.nodesBetween(from2, to, (node, pos) => {
        if (applicable)
          return false;
        if (!node.isTextblock || node.hasMarkup(nodeType, attrs))
          return;
        if (node.type == nodeType) {
          applicable = true;
        } else {
          let $pos = state.doc.resolve(pos), index = $pos.index();
          applicable = $pos.parent.canReplaceWith(index, index + 1, nodeType);
        }
      });
    }
    if (!applicable)
      return false;
    if (dispatch) {
      let tr = state.tr;
      for (let i = 0; i < state.selection.ranges.length; i++) {
        let { $from: { pos: from2 }, $to: { pos: to } } = state.selection.ranges[i];
        tr.setBlockType(from2, to, nodeType, attrs);
      }
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
}
function markApplies(doc, ranges, type, enterAtoms) {
  for (let i = 0; i < ranges.length; i++) {
    let { $from, $to } = ranges[i];
    let can = $from.depth == 0 ? doc.inlineContent && doc.type.allowsMarkType(type) : false;
    doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
      if (can || !enterAtoms && node.isAtom && node.isInline && pos >= $from.pos && pos + node.nodeSize <= $to.pos)
        return false;
      can = node.inlineContent && node.type.allowsMarkType(type);
    });
    if (can)
      return true;
  }
  return false;
}
function removeInlineAtoms(ranges) {
  let result = [];
  for (let i = 0; i < ranges.length; i++) {
    let { $from, $to } = ranges[i];
    $from.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
      if (node.isAtom && node.content.size && node.isInline && pos >= $from.pos && pos + node.nodeSize <= $to.pos) {
        if (pos + 1 > $from.pos)
          result.push(new SelectionRange($from, $from.doc.resolve(pos + 1)));
        $from = $from.doc.resolve(pos + 1 + node.content.size);
        return false;
      }
    });
    if ($from.pos < $to.pos)
      result.push(new SelectionRange($from, $to));
  }
  return result;
}
function toggleMark(markType, attrs = null, options) {
  let removeWhenPresent = (options && options.removeWhenPresent) !== false;
  let enterAtoms = (options && options.enterInlineAtoms) !== false;
  let dropSpace = !(options && options.includeWhitespace);
  return function(state, dispatch) {
    let { empty, $cursor, ranges } = state.selection;
    if (empty && !$cursor || !markApplies(state.doc, ranges, markType, enterAtoms))
      return false;
    if (dispatch) {
      if ($cursor) {
        if (markType.isInSet(state.storedMarks || $cursor.marks()))
          dispatch(state.tr.removeStoredMark(markType));
        else
          dispatch(state.tr.addStoredMark(markType.create(attrs)));
      } else {
        let add, tr = state.tr;
        if (!enterAtoms)
          ranges = removeInlineAtoms(ranges);
        if (removeWhenPresent) {
          add = !ranges.some((r) => state.doc.rangeHasMark(r.$from.pos, r.$to.pos, markType));
        } else {
          add = !ranges.every((r) => {
            let missing = false;
            tr.doc.nodesBetween(r.$from.pos, r.$to.pos, (node, pos, parent) => {
              if (missing)
                return false;
              missing = !markType.isInSet(node.marks) && !!parent && parent.type.allowsMarkType(markType) && !(node.isText && /^\s*$/.test(node.textBetween(Math.max(0, r.$from.pos - pos), Math.min(node.nodeSize, r.$to.pos - pos))));
            });
            return !missing;
          });
        }
        for (let i = 0; i < ranges.length; i++) {
          let { $from, $to } = ranges[i];
          if (!add) {
            tr.removeMark($from.pos, $to.pos, markType);
          } else {
            let from2 = $from.pos, to = $to.pos, start = $from.nodeAfter, end = $to.nodeBefore;
            let spaceStart = dropSpace && start && start.isText ? /^\s*/.exec(start.text)[0].length : 0;
            let spaceEnd = dropSpace && end && end.isText ? /\s*$/.exec(end.text)[0].length : 0;
            if (from2 + spaceStart < to) {
              from2 += spaceStart;
              to -= spaceEnd;
            }
            tr.addMark(from2, to, markType.create(attrs));
          }
        }
        dispatch(tr.scrollIntoView());
      }
    }
    return true;
  };
}
function chainCommands(...commands) {
  return function(state, dispatch, view) {
    for (let i = 0; i < commands.length; i++)
      if (commands[i](state, dispatch, view))
        return true;
    return false;
  };
}
var backspace = chainCommands(deleteSelection, joinBackward, selectNodeBackward);
var del = chainCommands(deleteSelection, joinForward, selectNodeForward);
var pcBaseKeymap = {
  "Enter": chainCommands(newlineInCode, createParagraphNear, liftEmptyBlock, splitBlock),
  "Mod-Enter": exitCode,
  "Backspace": backspace,
  "Mod-Backspace": backspace,
  "Shift-Backspace": backspace,
  "Delete": del,
  "Mod-Delete": del,
  "Mod-a": selectAll
};
var macBaseKeymap = {
  "Ctrl-h": pcBaseKeymap["Backspace"],
  "Alt-Backspace": pcBaseKeymap["Mod-Backspace"],
  "Ctrl-d": pcBaseKeymap["Delete"],
  "Ctrl-Alt-Backspace": pcBaseKeymap["Mod-Delete"],
  "Alt-Delete": pcBaseKeymap["Mod-Delete"],
  "Alt-d": pcBaseKeymap["Mod-Delete"],
  "Ctrl-a": selectTextblockStart,
  "Ctrl-e": selectTextblockEnd
};
for (let key in pcBaseKeymap)
  macBaseKeymap[key] = pcBaseKeymap[key];
var mac = typeof navigator != "undefined" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : typeof os != "undefined" && os.platform ? os.platform() == "darwin" : false;
var baseKeymap = mac ? macBaseKeymap : pcBaseKeymap;

// node_modules/prosemirror-inputrules/dist/index.js
var InputRule = class {
  /**
  Create an input rule. The rule applies when the user typed
  something and the text directly in front of the cursor matches
  `match`, which should end with `$`.
  
  The `handler` can be a string, in which case the matched text, or
  the first matched group in the regexp, is replaced by that
  string.
  
  Or a it can be a function, which will be called with the match
  array produced by
  [`RegExp.exec`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec),
  as well as the start and end of the matched range, and which can
  return a [transaction](https://prosemirror.net/docs/ref/#state.Transaction) that describes the
  rule's effect, or null to indicate the input was not handled.
  */
  constructor(match, handler, options = {}) {
    this.match = match;
    this.match = match;
    this.handler = typeof handler == "string" ? stringHandler(handler) : handler;
    this.undoable = options.undoable !== false;
    this.inCode = options.inCode || false;
    this.inCodeMark = options.inCodeMark !== false;
  }
};
function stringHandler(string) {
  return function(state, match, start, end) {
    let insert = string;
    if (match[1]) {
      let offset3 = match[0].lastIndexOf(match[1]);
      insert += match[0].slice(offset3 + match[1].length);
      start += offset3;
      let cutOff = start - end;
      if (cutOff > 0) {
        insert = match[0].slice(offset3 - cutOff, offset3) + insert;
        start = end;
      }
    }
    return state.tr.insertText(insert, start, end);
  };
}
var MAX_MATCH = 500;
function inputRules({ rules }) {
  let plugin = new Plugin({
    state: {
      init() {
        return null;
      },
      apply(tr, prev) {
        let stored = tr.getMeta(this);
        if (stored)
          return stored;
        return tr.selectionSet || tr.docChanged ? null : prev;
      }
    },
    props: {
      handleTextInput(view, from2, to, text) {
        return run(view, from2, to, text, rules, plugin);
      },
      handleDOMEvents: {
        compositionend: (view) => {
          setTimeout(() => {
            let { $cursor } = view.state.selection;
            if ($cursor)
              run(view, $cursor.pos, $cursor.pos, "", rules, plugin);
          });
        }
      }
    },
    isInputRules: true
  });
  return plugin;
}
function run(view, from2, to, text, rules, plugin) {
  if (view.composing)
    return false;
  let state = view.state, $from = state.doc.resolve(from2);
  let textBefore = $from.parent.textBetween(Math.max(0, $from.parentOffset - MAX_MATCH), $from.parentOffset, null, "￼") + text;
  for (let i = 0; i < rules.length; i++) {
    let rule = rules[i];
    if (!rule.inCodeMark && $from.marks().some((m) => m.type.spec.code))
      continue;
    if ($from.parent.type.spec.code) {
      if (!rule.inCode)
        continue;
    } else if (rule.inCode === "only") {
      continue;
    }
    let match = rule.match.exec(textBefore);
    let tr = match && match[0].length >= text.length && rule.handler(state, match, from2 - (match[0].length - text.length), to);
    if (!tr)
      continue;
    if (rule.undoable)
      tr.setMeta(plugin, { transform: tr, from: from2, to, text });
    view.dispatch(tr);
    return true;
  }
  return false;
}
var emDash = new InputRule(/--$/, "—", { inCodeMark: false });
var ellipsis = new InputRule(/\.\.\.$/, "…", { inCodeMark: false });
var openDoubleQuote = new InputRule(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(")$/, "“", { inCodeMark: false });
var closeDoubleQuote = new InputRule(/"$/, "”", { inCodeMark: false });
var openSingleQuote = new InputRule(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(')$/, "‘", { inCodeMark: false });
var closeSingleQuote = new InputRule(/'$/, "’", { inCodeMark: false });
var smartQuotes = [openDoubleQuote, closeDoubleQuote, openSingleQuote, closeSingleQuote];
function wrappingInputRule(regexp, nodeType, getAttrs = null, joinPredicate) {
  return new InputRule(regexp, (state, match, start, end) => {
    let attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs;
    let tr = state.tr.delete(start, end);
    let $start = tr.doc.resolve(start), range = $start.blockRange(), wrapping = range && findWrapping(range, nodeType, attrs);
    if (!wrapping)
      return null;
    tr.wrap(range, wrapping);
    let before = tr.doc.resolve(start - 1).nodeBefore;
    if (before && before.type == nodeType && canJoin(tr.doc, start - 1) && (!joinPredicate || joinPredicate(match, before)))
      tr.join(start - 1);
    return tr;
  });
}
function textblockTypeInputRule(regexp, nodeType, getAttrs = null) {
  return new InputRule(regexp, (state, match, start, end) => {
    let $start = state.doc.resolve(start);
    let attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs;
    if (!$start.node(-1).canReplaceWith($start.index(-1), $start.indexAfter(-1), nodeType))
      return null;
    return state.tr.delete(start, end).setBlockType(start, start, nodeType, attrs);
  });
}

// node_modules/ngx-editor/fesm2022/ngx-editor-helpers.mjs
var isMarkActive = (state, type) => {
  const { from: from2, $from, to, empty } = state.selection;
  if (empty) {
    return Boolean(type.isInSet(state.storedMarks || $from.marks()));
  }
  return state.doc.rangeHasMark(from2, to, type);
};
var findNodeType = (type, $from) => {
  for (let i = $from.depth; i > 0; i -= 1) {
    if ($from.node(i).type === type) {
      return $from.node(i).type;
    }
  }
  return null;
};
var isNodeActive = (state, type, attrs = {}) => {
  const { selection } = state;
  const { $from, to } = selection;
  const node = findNodeType(type, $from);
  if (!Object.entries(attrs).length || !node) {
    return Boolean(node);
  }
  return to <= $from.end() && $from.parent.hasMarkup(type, attrs);
};
var getSelectionMarks = (state) => {
  let marks2 = [];
  const { selection, storedMarks } = state;
  const { from: from2, to, empty, $from } = selection;
  if (empty) {
    marks2 = storedMarks || $from.marks();
  } else {
    state.doc.nodesBetween(from2, to, (node) => {
      marks2 = [...marks2, ...node.marks];
    });
  }
  return marks2;
};
var getSelectionNodes = (state) => {
  const nodes2 = [];
  const { selection: { from: from2, to } } = state;
  state.doc.nodesBetween(from2, to, (node) => {
    nodes2.push(node);
  });
  return nodes2;
};
var markApplies2 = (doc, ranges, type) => {
  for (const range of ranges) {
    const { $from, $to } = range;
    let canApply = $from.depth === 0 ? doc.type.allowsMarkType(type) : false;
    doc.nodesBetween($from.pos, $to.pos, (node) => {
      if (canApply) {
        return false;
      }
      canApply = node.inlineContent && node.type.allowsMarkType(type);
      return true;
    });
    if (canApply) {
      return true;
    }
  }
  return false;
};
var markInputRule = (regexp, markType, attrs) => {
  return new InputRule(regexp, (state, match, start, end) => {
    const { tr } = state;
    const from2 = start;
    let to = end;
    const [fullMatch, , content] = match;
    const noOfStartSpaces = fullMatch.search(/\S/);
    if (content) {
      const textStart = start + fullMatch.indexOf(content);
      const textEnd = textStart + content.length;
      if (textEnd < end) {
        tr.delete(textEnd, end);
      }
      if (textStart > start) {
        tr.delete(start + noOfStartSpaces, textStart);
      }
      to = start + content.length + noOfStartSpaces;
    }
    tr.addMark(from2, to, markType.create(attrs));
    tr.removeStoredMark(markType);
    return tr;
  });
};
var canInsert = (state, nodeType) => {
  const { $from } = state.selection;
  for (let d = $from.depth; d >= 0; d -= 1) {
    const index = $from.index(d);
    if ($from.node(d).canReplaceWith(index, index, nodeType)) {
      return true;
    }
  }
  return false;
};

// node_modules/ngx-editor/fesm2022/ngx-editor-commands.mjs
var removeLink = () => {
  return (state, dispatch) => {
    const { doc, selection, tr, schema: schema2 } = state;
    const { $head: { pos }, from: from2, to } = selection;
    const linkMark = schema2.marks["link"];
    if (from2 === to) {
      const $pos = doc.resolve(pos);
      const linkStart = pos - $pos.textOffset;
      const linkEnd = linkStart + $pos.parent.child($pos.index()).nodeSize;
      tr.removeMark(linkStart, linkEnd, linkMark);
    } else {
      tr.removeMark(from2, to, linkMark);
    }
    if (!tr.docChanged) {
      return false;
    }
    dispatch?.(tr);
    return true;
  };
};
var applyMark = (type, attrs = {}) => {
  return (state, dispatch) => {
    const { tr, selection } = state;
    const { empty, ranges, $from, $to } = selection;
    if (empty && selection instanceof TextSelection) {
      const { $cursor } = selection;
      if (!$cursor || !markApplies2(state.doc, ranges, type)) {
        return false;
      }
      tr.addStoredMark(type.create(attrs));
      if (!tr.storedMarksSet) {
        return false;
      }
      dispatch?.(tr);
    } else {
      tr.addMark($from.pos, $to.pos, type.create(attrs));
      if (!tr.docChanged) {
        return false;
      }
      dispatch?.(tr.scrollIntoView());
    }
    return true;
  };
};
var removeMark = (type) => {
  return (state, dispatch) => {
    const { tr, selection, storedMarks, doc } = state;
    const { empty, ranges } = selection;
    if (empty && selection instanceof TextSelection) {
      const { $cursor } = selection;
      if (!$cursor || !markApplies2(state.doc, ranges, type)) {
        return false;
      }
      if (type.isInSet(storedMarks || $cursor.marks())) {
        tr.removeStoredMark(type);
        dispatch?.(tr);
        return true;
      }
    } else {
      for (const range of ranges) {
        const { $from, $to } = range;
        const hasMark = doc.rangeHasMark($from.pos, $to.pos, type);
        if (hasMark) {
          tr.removeMark($from.pos, $to.pos, type);
        }
      }
      if (!tr.docChanged) {
        return false;
      }
      dispatch?.(tr.scrollIntoView());
    }
    return false;
  };
};

// node_modules/rope-sequence/dist/index.js
var GOOD_LEAF_SIZE = 200;
var RopeSequence = function RopeSequence2() {
};
RopeSequence.prototype.append = function append(other) {
  if (!other.length) {
    return this;
  }
  other = RopeSequence.from(other);
  return !this.length && other || other.length < GOOD_LEAF_SIZE && this.leafAppend(other) || this.length < GOOD_LEAF_SIZE && other.leafPrepend(this) || this.appendInner(other);
};
RopeSequence.prototype.prepend = function prepend(other) {
  if (!other.length) {
    return this;
  }
  return RopeSequence.from(other).append(this);
};
RopeSequence.prototype.appendInner = function appendInner(other) {
  return new Append(this, other);
};
RopeSequence.prototype.slice = function slice(from2, to) {
  if (from2 === void 0) from2 = 0;
  if (to === void 0) to = this.length;
  if (from2 >= to) {
    return RopeSequence.empty;
  }
  return this.sliceInner(Math.max(0, from2), Math.min(this.length, to));
};
RopeSequence.prototype.get = function get(i) {
  if (i < 0 || i >= this.length) {
    return void 0;
  }
  return this.getInner(i);
};
RopeSequence.prototype.forEach = function forEach(f, from2, to) {
  if (from2 === void 0) from2 = 0;
  if (to === void 0) to = this.length;
  if (from2 <= to) {
    this.forEachInner(f, from2, to, 0);
  } else {
    this.forEachInvertedInner(f, from2, to, 0);
  }
};
RopeSequence.prototype.map = function map(f, from2, to) {
  if (from2 === void 0) from2 = 0;
  if (to === void 0) to = this.length;
  var result = [];
  this.forEach(function(elt, i) {
    return result.push(f(elt, i));
  }, from2, to);
  return result;
};
RopeSequence.from = function from(values) {
  if (values instanceof RopeSequence) {
    return values;
  }
  return values && values.length ? new Leaf(values) : RopeSequence.empty;
};
var Leaf = (function(RopeSequence3) {
  function Leaf2(values) {
    RopeSequence3.call(this);
    this.values = values;
  }
  if (RopeSequence3) Leaf2.__proto__ = RopeSequence3;
  Leaf2.prototype = Object.create(RopeSequence3 && RopeSequence3.prototype);
  Leaf2.prototype.constructor = Leaf2;
  var prototypeAccessors = { length: { configurable: true }, depth: { configurable: true } };
  Leaf2.prototype.flatten = function flatten() {
    return this.values;
  };
  Leaf2.prototype.sliceInner = function sliceInner(from2, to) {
    if (from2 == 0 && to == this.length) {
      return this;
    }
    return new Leaf2(this.values.slice(from2, to));
  };
  Leaf2.prototype.getInner = function getInner(i) {
    return this.values[i];
  };
  Leaf2.prototype.forEachInner = function forEachInner(f, from2, to, start) {
    for (var i = from2; i < to; i++) {
      if (f(this.values[i], start + i) === false) {
        return false;
      }
    }
  };
  Leaf2.prototype.forEachInvertedInner = function forEachInvertedInner(f, from2, to, start) {
    for (var i = from2 - 1; i >= to; i--) {
      if (f(this.values[i], start + i) === false) {
        return false;
      }
    }
  };
  Leaf2.prototype.leafAppend = function leafAppend(other) {
    if (this.length + other.length <= GOOD_LEAF_SIZE) {
      return new Leaf2(this.values.concat(other.flatten()));
    }
  };
  Leaf2.prototype.leafPrepend = function leafPrepend(other) {
    if (this.length + other.length <= GOOD_LEAF_SIZE) {
      return new Leaf2(other.flatten().concat(this.values));
    }
  };
  prototypeAccessors.length.get = function() {
    return this.values.length;
  };
  prototypeAccessors.depth.get = function() {
    return 0;
  };
  Object.defineProperties(Leaf2.prototype, prototypeAccessors);
  return Leaf2;
})(RopeSequence);
RopeSequence.empty = new Leaf([]);
var Append = (function(RopeSequence3) {
  function Append2(left, right) {
    RopeSequence3.call(this);
    this.left = left;
    this.right = right;
    this.length = left.length + right.length;
    this.depth = Math.max(left.depth, right.depth) + 1;
  }
  if (RopeSequence3) Append2.__proto__ = RopeSequence3;
  Append2.prototype = Object.create(RopeSequence3 && RopeSequence3.prototype);
  Append2.prototype.constructor = Append2;
  Append2.prototype.flatten = function flatten() {
    return this.left.flatten().concat(this.right.flatten());
  };
  Append2.prototype.getInner = function getInner(i) {
    return i < this.left.length ? this.left.get(i) : this.right.get(i - this.left.length);
  };
  Append2.prototype.forEachInner = function forEachInner(f, from2, to, start) {
    var leftLen = this.left.length;
    if (from2 < leftLen && this.left.forEachInner(f, from2, Math.min(to, leftLen), start) === false) {
      return false;
    }
    if (to > leftLen && this.right.forEachInner(f, Math.max(from2 - leftLen, 0), Math.min(this.length, to) - leftLen, start + leftLen) === false) {
      return false;
    }
  };
  Append2.prototype.forEachInvertedInner = function forEachInvertedInner(f, from2, to, start) {
    var leftLen = this.left.length;
    if (from2 > leftLen && this.right.forEachInvertedInner(f, from2 - leftLen, Math.max(to, leftLen) - leftLen, start + leftLen) === false) {
      return false;
    }
    if (to < leftLen && this.left.forEachInvertedInner(f, Math.min(from2, leftLen), to, start) === false) {
      return false;
    }
  };
  Append2.prototype.sliceInner = function sliceInner(from2, to) {
    if (from2 == 0 && to == this.length) {
      return this;
    }
    var leftLen = this.left.length;
    if (to <= leftLen) {
      return this.left.slice(from2, to);
    }
    if (from2 >= leftLen) {
      return this.right.slice(from2 - leftLen, to - leftLen);
    }
    return this.left.slice(from2, leftLen).append(this.right.slice(0, to - leftLen));
  };
  Append2.prototype.leafAppend = function leafAppend(other) {
    var inner = this.right.leafAppend(other);
    if (inner) {
      return new Append2(this.left, inner);
    }
  };
  Append2.prototype.leafPrepend = function leafPrepend(other) {
    var inner = this.left.leafPrepend(other);
    if (inner) {
      return new Append2(inner, this.right);
    }
  };
  Append2.prototype.appendInner = function appendInner2(other) {
    if (this.left.depth >= Math.max(this.right.depth, other.depth) + 1) {
      return new Append2(this.left, new Append2(this.right, other));
    }
    return new Append2(this, other);
  };
  return Append2;
})(RopeSequence);
var dist_default = RopeSequence;

// node_modules/prosemirror-history/dist/index.js
var max_empty_items = 500;
var Branch = class _Branch {
  constructor(items, eventCount) {
    this.items = items;
    this.eventCount = eventCount;
  }
  // Pop the latest event off the branch's history and apply it
  // to a document transform.
  popEvent(state, preserveItems) {
    if (this.eventCount == 0)
      return null;
    let end = this.items.length;
    for (; ; end--) {
      let next = this.items.get(end - 1);
      if (next.selection) {
        --end;
        break;
      }
    }
    let remap, mapFrom;
    if (preserveItems) {
      remap = this.remapping(end, this.items.length);
      mapFrom = remap.maps.length;
    }
    let transform = state.tr;
    let selection, remaining;
    let addAfter = [], addBefore = [];
    this.items.forEach((item, i) => {
      if (!item.step) {
        if (!remap) {
          remap = this.remapping(end, i + 1);
          mapFrom = remap.maps.length;
        }
        mapFrom--;
        addBefore.push(item);
        return;
      }
      if (remap) {
        addBefore.push(new Item(item.map));
        let step = item.step.map(remap.slice(mapFrom)), map2;
        if (step && transform.maybeStep(step).doc) {
          map2 = transform.mapping.maps[transform.mapping.maps.length - 1];
          addAfter.push(new Item(map2, void 0, void 0, addAfter.length + addBefore.length));
        }
        mapFrom--;
        if (map2)
          remap.appendMap(map2, mapFrom);
      } else {
        transform.maybeStep(item.step);
      }
      if (item.selection) {
        selection = remap ? item.selection.map(remap.slice(mapFrom)) : item.selection;
        remaining = new _Branch(this.items.slice(0, end).append(addBefore.reverse().concat(addAfter)), this.eventCount - 1);
        return false;
      }
    }, this.items.length, 0);
    return { remaining, transform, selection };
  }
  // Create a new branch with the given transform added.
  addTransform(transform, selection, histOptions, preserveItems) {
    let newItems = [], eventCount = this.eventCount;
    let oldItems = this.items, lastItem = !preserveItems && oldItems.length ? oldItems.get(oldItems.length - 1) : null;
    for (let i = 0; i < transform.steps.length; i++) {
      let step = transform.steps[i].invert(transform.docs[i]);
      let item = new Item(transform.mapping.maps[i], step, selection), merged;
      if (merged = lastItem && lastItem.merge(item)) {
        item = merged;
        if (i)
          newItems.pop();
        else
          oldItems = oldItems.slice(0, oldItems.length - 1);
      }
      newItems.push(item);
      if (selection) {
        eventCount++;
        selection = void 0;
      }
      if (!preserveItems)
        lastItem = item;
    }
    let overflow = eventCount - histOptions.depth;
    if (overflow > DEPTH_OVERFLOW) {
      oldItems = cutOffEvents(oldItems, overflow);
      eventCount -= overflow;
    }
    return new _Branch(oldItems.append(newItems), eventCount);
  }
  remapping(from2, to) {
    let maps = new Mapping();
    this.items.forEach((item, i) => {
      let mirrorPos = item.mirrorOffset != null && i - item.mirrorOffset >= from2 ? maps.maps.length - item.mirrorOffset : void 0;
      maps.appendMap(item.map, mirrorPos);
    }, from2, to);
    return maps;
  }
  addMaps(array) {
    if (this.eventCount == 0)
      return this;
    return new _Branch(this.items.append(array.map((map2) => new Item(map2))), this.eventCount);
  }
  // When the collab module receives remote changes, the history has
  // to know about those, so that it can adjust the steps that were
  // rebased on top of the remote changes, and include the position
  // maps for the remote changes in its array of items.
  rebased(rebasedTransform, rebasedCount) {
    if (!this.eventCount)
      return this;
    let rebasedItems = [], start = Math.max(0, this.items.length - rebasedCount);
    let mapping = rebasedTransform.mapping;
    let newUntil = rebasedTransform.steps.length;
    let eventCount = this.eventCount;
    this.items.forEach((item) => {
      if (item.selection)
        eventCount--;
    }, start);
    let iRebased = rebasedCount;
    this.items.forEach((item) => {
      let pos = mapping.getMirror(--iRebased);
      if (pos == null)
        return;
      newUntil = Math.min(newUntil, pos);
      let map2 = mapping.maps[pos];
      if (item.step) {
        let step = rebasedTransform.steps[pos].invert(rebasedTransform.docs[pos]);
        let selection = item.selection && item.selection.map(mapping.slice(iRebased + 1, pos));
        if (selection)
          eventCount++;
        rebasedItems.push(new Item(map2, step, selection));
      } else {
        rebasedItems.push(new Item(map2));
      }
    }, start);
    let newMaps = [];
    for (let i = rebasedCount; i < newUntil; i++)
      newMaps.push(new Item(mapping.maps[i]));
    let items = this.items.slice(0, start).append(newMaps).append(rebasedItems);
    let branch = new _Branch(items, eventCount);
    if (branch.emptyItemCount() > max_empty_items)
      branch = branch.compress(this.items.length - rebasedItems.length);
    return branch;
  }
  emptyItemCount() {
    let count = 0;
    this.items.forEach((item) => {
      if (!item.step)
        count++;
    });
    return count;
  }
  // Compressing a branch means rewriting it to push the air (map-only
  // items) out. During collaboration, these naturally accumulate
  // because each remote change adds one. The `upto` argument is used
  // to ensure that only the items below a given level are compressed,
  // because `rebased` relies on a clean, untouched set of items in
  // order to associate old items with rebased steps.
  compress(upto = this.items.length) {
    let remap = this.remapping(0, upto), mapFrom = remap.maps.length;
    let items = [], events = 0;
    this.items.forEach((item, i) => {
      if (i >= upto) {
        items.push(item);
        if (item.selection)
          events++;
      } else if (item.step) {
        let step = item.step.map(remap.slice(mapFrom)), map2 = step && step.getMap();
        mapFrom--;
        if (map2)
          remap.appendMap(map2, mapFrom);
        if (step) {
          let selection = item.selection && item.selection.map(remap.slice(mapFrom));
          if (selection)
            events++;
          let newItem = new Item(map2.invert(), step, selection), merged, last = items.length - 1;
          if (merged = items.length && items[last].merge(newItem))
            items[last] = merged;
          else
            items.push(newItem);
        }
      } else if (item.map) {
        mapFrom--;
      }
    }, this.items.length, 0);
    return new _Branch(dist_default.from(items.reverse()), events);
  }
};
Branch.empty = new Branch(dist_default.empty, 0);
function cutOffEvents(items, n) {
  let cutPoint;
  items.forEach((item, i) => {
    if (item.selection && n-- == 0) {
      cutPoint = i;
      return false;
    }
  });
  return items.slice(cutPoint);
}
var Item = class _Item {
  constructor(map2, step, selection, mirrorOffset) {
    this.map = map2;
    this.step = step;
    this.selection = selection;
    this.mirrorOffset = mirrorOffset;
  }
  merge(other) {
    if (this.step && other.step && !other.selection) {
      let step = other.step.merge(this.step);
      if (step)
        return new _Item(step.getMap().invert(), step, this.selection);
    }
  }
};
var HistoryState = class {
  constructor(done, undone, prevRanges, prevTime, prevComposition) {
    this.done = done;
    this.undone = undone;
    this.prevRanges = prevRanges;
    this.prevTime = prevTime;
    this.prevComposition = prevComposition;
  }
};
var DEPTH_OVERFLOW = 20;
function applyTransaction(history2, state, tr, options) {
  let historyTr = tr.getMeta(historyKey), rebased;
  if (historyTr)
    return historyTr.historyState;
  if (tr.getMeta(closeHistoryKey))
    history2 = new HistoryState(history2.done, history2.undone, null, 0, -1);
  let appended = tr.getMeta("appendedTransaction");
  if (tr.steps.length == 0) {
    return history2;
  } else if (appended && appended.getMeta(historyKey)) {
    if (appended.getMeta(historyKey).redo)
      return new HistoryState(history2.done.addTransform(tr, void 0, options, mustPreserveItems(state)), history2.undone, rangesFor(tr.mapping.maps), history2.prevTime, history2.prevComposition);
    else
      return new HistoryState(history2.done, history2.undone.addTransform(tr, void 0, options, mustPreserveItems(state)), null, history2.prevTime, history2.prevComposition);
  } else if (tr.getMeta("addToHistory") !== false && !(appended && appended.getMeta("addToHistory") === false)) {
    let composition = tr.getMeta("composition");
    let newGroup = history2.prevTime == 0 || !appended && history2.prevComposition != composition && (history2.prevTime < (tr.time || 0) - options.newGroupDelay || !isAdjacentTo(tr, history2.prevRanges));
    let prevRanges = appended ? mapRanges(history2.prevRanges, tr.mapping) : rangesFor(tr.mapping.maps);
    return new HistoryState(history2.done.addTransform(tr, newGroup ? state.selection.getBookmark() : void 0, options, mustPreserveItems(state)), Branch.empty, prevRanges, tr.time, composition == null ? history2.prevComposition : composition);
  } else if (rebased = tr.getMeta("rebased")) {
    return new HistoryState(history2.done.rebased(tr, rebased), history2.undone.rebased(tr, rebased), mapRanges(history2.prevRanges, tr.mapping), history2.prevTime, history2.prevComposition);
  } else {
    return new HistoryState(history2.done.addMaps(tr.mapping.maps), history2.undone.addMaps(tr.mapping.maps), mapRanges(history2.prevRanges, tr.mapping), history2.prevTime, history2.prevComposition);
  }
}
function isAdjacentTo(transform, prevRanges) {
  if (!prevRanges)
    return false;
  if (!transform.docChanged)
    return true;
  let adjacent = false;
  transform.mapping.maps[0].forEach((start, end) => {
    for (let i = 0; i < prevRanges.length; i += 2)
      if (start <= prevRanges[i + 1] && end >= prevRanges[i])
        adjacent = true;
  });
  return adjacent;
}
function rangesFor(maps) {
  let result = [];
  for (let i = maps.length - 1; i >= 0 && result.length == 0; i--)
    maps[i].forEach((_from, _to, from2, to) => result.push(from2, to));
  return result;
}
function mapRanges(ranges, mapping) {
  if (!ranges)
    return null;
  let result = [];
  for (let i = 0; i < ranges.length; i += 2) {
    let from2 = mapping.map(ranges[i], 1), to = mapping.map(ranges[i + 1], -1);
    if (from2 <= to)
      result.push(from2, to);
  }
  return result;
}
function histTransaction(history2, state, redo3) {
  let preserveItems = mustPreserveItems(state);
  let histOptions = historyKey.get(state).spec.config;
  let pop = (redo3 ? history2.undone : history2.done).popEvent(state, preserveItems);
  if (!pop)
    return null;
  let selection = pop.selection.resolve(pop.transform.doc);
  let added = (redo3 ? history2.done : history2.undone).addTransform(pop.transform, state.selection.getBookmark(), histOptions, preserveItems);
  let newHist = new HistoryState(redo3 ? added : pop.remaining, redo3 ? pop.remaining : added, null, 0, -1);
  return pop.transform.setSelection(selection).setMeta(historyKey, { redo: redo3, historyState: newHist });
}
var cachedPreserveItems = false;
var cachedPreserveItemsPlugins = null;
function mustPreserveItems(state) {
  let plugins = state.plugins;
  if (cachedPreserveItemsPlugins != plugins) {
    cachedPreserveItems = false;
    cachedPreserveItemsPlugins = plugins;
    for (let i = 0; i < plugins.length; i++)
      if (plugins[i].spec.historyPreserveItems) {
        cachedPreserveItems = true;
        break;
      }
  }
  return cachedPreserveItems;
}
var historyKey = new PluginKey("history");
var closeHistoryKey = new PluginKey("closeHistory");
function history(config = {}) {
  config = {
    depth: config.depth || 100,
    newGroupDelay: config.newGroupDelay || 500
  };
  return new Plugin({
    key: historyKey,
    state: {
      init() {
        return new HistoryState(Branch.empty, Branch.empty, null, 0, -1);
      },
      apply(tr, hist, state) {
        return applyTransaction(hist, state, tr, config);
      }
    },
    config,
    props: {
      handleDOMEvents: {
        beforeinput(view, e) {
          let inputType = e.inputType;
          let command = inputType == "historyUndo" ? undo : inputType == "historyRedo" ? redo : null;
          if (!command)
            return false;
          e.preventDefault();
          return command(view.state, view.dispatch);
        }
      }
    }
  });
}
function buildCommand(redo3, scroll) {
  return (state, dispatch) => {
    let hist = historyKey.getState(state);
    if (!hist || (redo3 ? hist.undone : hist.done).eventCount == 0)
      return false;
    if (dispatch) {
      let tr = histTransaction(hist, state, redo3);
      if (tr)
        dispatch(scroll ? tr.scrollIntoView() : tr);
    }
    return true;
  };
}
var undo = buildCommand(false, true);
var redo = buildCommand(true, true);
var undoNoScroll = buildCommand(false, false);
var redoNoScroll = buildCommand(true, false);

// node_modules/@floating-ui/utils/dist/floating-ui.utils.mjs
var sides = ["top", "right", "bottom", "left"];
var alignments = ["start", "end"];
var placements = sides.reduce((acc, side) => acc.concat(side, side + "-" + alignments[0], side + "-" + alignments[1]), []);
var min = Math.min;
var max = Math.max;
var round = Math.round;
var createCoords = (v) => ({
  x: v,
  y: v
});
var oppositeSideMap = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom"
};
var oppositeAlignmentMap = {
  start: "end",
  end: "start"
};
function evaluate(value, param) {
  return typeof value === "function" ? value(param) : value;
}
function getSide(placement) {
  return placement.split("-")[0];
}
function getAlignment(placement) {
  return placement.split("-")[1];
}
function getOppositeAxis(axis) {
  return axis === "x" ? "y" : "x";
}
function getAxisLength(axis) {
  return axis === "y" ? "height" : "width";
}
var yAxisSides = /* @__PURE__ */ new Set(["top", "bottom"]);
function getSideAxis(placement) {
  return yAxisSides.has(getSide(placement)) ? "y" : "x";
}
function getAlignmentAxis(placement) {
  return getOppositeAxis(getSideAxis(placement));
}
function getAlignmentSides(placement, rects, rtl) {
  if (rtl === void 0) {
    rtl = false;
  }
  const alignment = getAlignment(placement);
  const alignmentAxis = getAlignmentAxis(placement);
  const length = getAxisLength(alignmentAxis);
  let mainAlignmentSide = alignmentAxis === "x" ? alignment === (rtl ? "end" : "start") ? "right" : "left" : alignment === "start" ? "bottom" : "top";
  if (rects.reference[length] > rects.floating[length]) {
    mainAlignmentSide = getOppositePlacement(mainAlignmentSide);
  }
  return [mainAlignmentSide, getOppositePlacement(mainAlignmentSide)];
}
function getOppositeAlignmentPlacement(placement) {
  return placement.replace(/start|end/g, (alignment) => oppositeAlignmentMap[alignment]);
}
function getOppositePlacement(placement) {
  return placement.replace(/left|right|bottom|top/g, (side) => oppositeSideMap[side]);
}
function expandPaddingObject(padding) {
  return __spreadValues({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  }, padding);
}
function getPaddingObject(padding) {
  return typeof padding !== "number" ? expandPaddingObject(padding) : {
    top: padding,
    right: padding,
    bottom: padding,
    left: padding
  };
}
function rectToClientRect(rect) {
  const {
    x,
    y,
    width,
    height
  } = rect;
  return {
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
    x,
    y
  };
}

// node_modules/@floating-ui/core/dist/floating-ui.core.mjs
function computeCoordsFromPlacement(_ref, placement, rtl) {
  let {
    reference,
    floating
  } = _ref;
  const sideAxis = getSideAxis(placement);
  const alignmentAxis = getAlignmentAxis(placement);
  const alignLength = getAxisLength(alignmentAxis);
  const side = getSide(placement);
  const isVertical = sideAxis === "y";
  const commonX = reference.x + reference.width / 2 - floating.width / 2;
  const commonY = reference.y + reference.height / 2 - floating.height / 2;
  const commonAlign = reference[alignLength] / 2 - floating[alignLength] / 2;
  let coords;
  switch (side) {
    case "top":
      coords = {
        x: commonX,
        y: reference.y - floating.height
      };
      break;
    case "bottom":
      coords = {
        x: commonX,
        y: reference.y + reference.height
      };
      break;
    case "right":
      coords = {
        x: reference.x + reference.width,
        y: commonY
      };
      break;
    case "left":
      coords = {
        x: reference.x - floating.width,
        y: commonY
      };
      break;
    default:
      coords = {
        x: reference.x,
        y: reference.y
      };
  }
  switch (getAlignment(placement)) {
    case "start":
      coords[alignmentAxis] -= commonAlign * (rtl && isVertical ? -1 : 1);
      break;
    case "end":
      coords[alignmentAxis] += commonAlign * (rtl && isVertical ? -1 : 1);
      break;
  }
  return coords;
}
var computePosition = (reference, floating, config) => __async(null, null, function* () {
  const {
    placement = "bottom",
    strategy = "absolute",
    middleware = [],
    platform: platform2
  } = config;
  const validMiddleware = middleware.filter(Boolean);
  const rtl = yield platform2.isRTL == null ? void 0 : platform2.isRTL(floating);
  let rects = yield platform2.getElementRects({
    reference,
    floating,
    strategy
  });
  let {
    x,
    y
  } = computeCoordsFromPlacement(rects, placement, rtl);
  let statefulPlacement = placement;
  let middlewareData = {};
  let resetCount = 0;
  for (let i = 0; i < validMiddleware.length; i++) {
    const {
      name,
      fn
    } = validMiddleware[i];
    const {
      x: nextX,
      y: nextY,
      data,
      reset
    } = yield fn({
      x,
      y,
      initialPlacement: placement,
      placement: statefulPlacement,
      strategy,
      middlewareData,
      rects,
      platform: platform2,
      elements: {
        reference,
        floating
      }
    });
    x = nextX != null ? nextX : x;
    y = nextY != null ? nextY : y;
    middlewareData = __spreadProps(__spreadValues({}, middlewareData), {
      [name]: __spreadValues(__spreadValues({}, middlewareData[name]), data)
    });
    if (reset && resetCount <= 50) {
      resetCount++;
      if (typeof reset === "object") {
        if (reset.placement) {
          statefulPlacement = reset.placement;
        }
        if (reset.rects) {
          rects = reset.rects === true ? yield platform2.getElementRects({
            reference,
            floating,
            strategy
          }) : reset.rects;
        }
        ({
          x,
          y
        } = computeCoordsFromPlacement(rects, statefulPlacement, rtl));
      }
      i = -1;
    }
  }
  return {
    x,
    y,
    placement: statefulPlacement,
    strategy,
    middlewareData
  };
});
function detectOverflow(state, options) {
  return __async(this, null, function* () {
    var _await$platform$isEle;
    if (options === void 0) {
      options = {};
    }
    const {
      x,
      y,
      platform: platform2,
      rects,
      elements,
      strategy
    } = state;
    const {
      boundary = "clippingAncestors",
      rootBoundary = "viewport",
      elementContext = "floating",
      altBoundary = false,
      padding = 0
    } = evaluate(options, state);
    const paddingObject = getPaddingObject(padding);
    const altContext = elementContext === "floating" ? "reference" : "floating";
    const element = elements[altBoundary ? altContext : elementContext];
    const clippingClientRect = rectToClientRect(yield platform2.getClippingRect({
      element: ((_await$platform$isEle = yield platform2.isElement == null ? void 0 : platform2.isElement(element)) != null ? _await$platform$isEle : true) ? element : element.contextElement || (yield platform2.getDocumentElement == null ? void 0 : platform2.getDocumentElement(elements.floating)),
      boundary,
      rootBoundary,
      strategy
    }));
    const rect = elementContext === "floating" ? {
      x,
      y,
      width: rects.floating.width,
      height: rects.floating.height
    } : rects.reference;
    const offsetParent = yield platform2.getOffsetParent == null ? void 0 : platform2.getOffsetParent(elements.floating);
    const offsetScale = (yield platform2.isElement == null ? void 0 : platform2.isElement(offsetParent)) ? (yield platform2.getScale == null ? void 0 : platform2.getScale(offsetParent)) || {
      x: 1,
      y: 1
    } : {
      x: 1,
      y: 1
    };
    const elementClientRect = rectToClientRect(platform2.convertOffsetParentRelativeRectToViewportRelativeRect ? yield platform2.convertOffsetParentRelativeRectToViewportRelativeRect({
      elements,
      rect,
      offsetParent,
      strategy
    }) : rect);
    return {
      top: (clippingClientRect.top - elementClientRect.top + paddingObject.top) / offsetScale.y,
      bottom: (elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom) / offsetScale.y,
      left: (clippingClientRect.left - elementClientRect.left + paddingObject.left) / offsetScale.x,
      right: (elementClientRect.right - clippingClientRect.right + paddingObject.right) / offsetScale.x
    };
  });
}
function getPlacementList(alignment, autoAlignment, allowedPlacements) {
  const allowedPlacementsSortedByAlignment = alignment ? [...allowedPlacements.filter((placement) => getAlignment(placement) === alignment), ...allowedPlacements.filter((placement) => getAlignment(placement) !== alignment)] : allowedPlacements.filter((placement) => getSide(placement) === placement);
  return allowedPlacementsSortedByAlignment.filter((placement) => {
    if (alignment) {
      return getAlignment(placement) === alignment || (autoAlignment ? getOppositeAlignmentPlacement(placement) !== placement : false);
    }
    return true;
  });
}
var autoPlacement = function(options) {
  if (options === void 0) {
    options = {};
  }
  return {
    name: "autoPlacement",
    options,
    fn(state) {
      return __async(this, null, function* () {
        var _middlewareData$autoP, _middlewareData$autoP2, _placementsThatFitOnE;
        const {
          rects,
          middlewareData,
          placement,
          platform: platform2,
          elements
        } = state;
        const _a2 = evaluate(options, state), {
          crossAxis = false,
          alignment,
          allowedPlacements = placements,
          autoAlignment = true
        } = _a2, detectOverflowOptions = __objRest(_a2, [
          "crossAxis",
          "alignment",
          "allowedPlacements",
          "autoAlignment"
        ]);
        const placements$1 = alignment !== void 0 || allowedPlacements === placements ? getPlacementList(alignment || null, autoAlignment, allowedPlacements) : allowedPlacements;
        const overflow = yield detectOverflow(state, detectOverflowOptions);
        const currentIndex = ((_middlewareData$autoP = middlewareData.autoPlacement) == null ? void 0 : _middlewareData$autoP.index) || 0;
        const currentPlacement = placements$1[currentIndex];
        if (currentPlacement == null) {
          return {};
        }
        const alignmentSides = getAlignmentSides(currentPlacement, rects, yield platform2.isRTL == null ? void 0 : platform2.isRTL(elements.floating));
        if (placement !== currentPlacement) {
          return {
            reset: {
              placement: placements$1[0]
            }
          };
        }
        const currentOverflows = [overflow[getSide(currentPlacement)], overflow[alignmentSides[0]], overflow[alignmentSides[1]]];
        const allOverflows = [...((_middlewareData$autoP2 = middlewareData.autoPlacement) == null ? void 0 : _middlewareData$autoP2.overflows) || [], {
          placement: currentPlacement,
          overflows: currentOverflows
        }];
        const nextPlacement = placements$1[currentIndex + 1];
        if (nextPlacement) {
          return {
            data: {
              index: currentIndex + 1,
              overflows: allOverflows
            },
            reset: {
              placement: nextPlacement
            }
          };
        }
        const placementsSortedByMostSpace = allOverflows.map((d) => {
          const alignment2 = getAlignment(d.placement);
          return [d.placement, alignment2 && crossAxis ? (
            // Check along the mainAxis and main crossAxis side.
            d.overflows.slice(0, 2).reduce((acc, v) => acc + v, 0)
          ) : (
            // Check only the mainAxis.
            d.overflows[0]
          ), d.overflows];
        }).sort((a, b) => a[1] - b[1]);
        const placementsThatFitOnEachSide = placementsSortedByMostSpace.filter((d) => d[2].slice(
          0,
          // Aligned placements should not check their opposite crossAxis
          // side.
          getAlignment(d[0]) ? 2 : 3
        ).every((v) => v <= 0));
        const resetPlacement = ((_placementsThatFitOnE = placementsThatFitOnEachSide[0]) == null ? void 0 : _placementsThatFitOnE[0]) || placementsSortedByMostSpace[0][0];
        if (resetPlacement !== placement) {
          return {
            data: {
              index: currentIndex + 1,
              overflows: allOverflows
            },
            reset: {
              placement: resetPlacement
            }
          };
        }
        return {};
      });
    }
  };
};
var originSides = /* @__PURE__ */ new Set(["left", "top"]);
function convertValueToCoords(state, options) {
  return __async(this, null, function* () {
    const {
      placement,
      platform: platform2,
      elements
    } = state;
    const rtl = yield platform2.isRTL == null ? void 0 : platform2.isRTL(elements.floating);
    const side = getSide(placement);
    const alignment = getAlignment(placement);
    const isVertical = getSideAxis(placement) === "y";
    const mainAxisMulti = originSides.has(side) ? -1 : 1;
    const crossAxisMulti = rtl && isVertical ? -1 : 1;
    const rawValue = evaluate(options, state);
    let {
      mainAxis,
      crossAxis,
      alignmentAxis
    } = typeof rawValue === "number" ? {
      mainAxis: rawValue,
      crossAxis: 0,
      alignmentAxis: null
    } : {
      mainAxis: rawValue.mainAxis || 0,
      crossAxis: rawValue.crossAxis || 0,
      alignmentAxis: rawValue.alignmentAxis
    };
    if (alignment && typeof alignmentAxis === "number") {
      crossAxis = alignment === "end" ? alignmentAxis * -1 : alignmentAxis;
    }
    return isVertical ? {
      x: crossAxis * crossAxisMulti,
      y: mainAxis * mainAxisMulti
    } : {
      x: mainAxis * mainAxisMulti,
      y: crossAxis * crossAxisMulti
    };
  });
}
var offset = function(options) {
  if (options === void 0) {
    options = 0;
  }
  return {
    name: "offset",
    options,
    fn(state) {
      return __async(this, null, function* () {
        var _middlewareData$offse, _middlewareData$arrow;
        const {
          x,
          y,
          placement,
          middlewareData
        } = state;
        const diffCoords = yield convertValueToCoords(state, options);
        if (placement === ((_middlewareData$offse = middlewareData.offset) == null ? void 0 : _middlewareData$offse.placement) && (_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) {
          return {};
        }
        return {
          x: x + diffCoords.x,
          y: y + diffCoords.y,
          data: __spreadProps(__spreadValues({}, diffCoords), {
            placement
          })
        };
      });
    }
  };
};

// node_modules/@floating-ui/utils/dist/floating-ui.utils.dom.mjs
function hasWindow() {
  return typeof window !== "undefined";
}
function getNodeName(node) {
  if (isNode(node)) {
    return (node.nodeName || "").toLowerCase();
  }
  return "#document";
}
function getWindow(node) {
  var _node$ownerDocument;
  return (node == null || (_node$ownerDocument = node.ownerDocument) == null ? void 0 : _node$ownerDocument.defaultView) || window;
}
function getDocumentElement(node) {
  var _ref;
  return (_ref = (isNode(node) ? node.ownerDocument : node.document) || window.document) == null ? void 0 : _ref.documentElement;
}
function isNode(value) {
  if (!hasWindow()) {
    return false;
  }
  return value instanceof Node || value instanceof getWindow(value).Node;
}
function isElement(value) {
  if (!hasWindow()) {
    return false;
  }
  return value instanceof Element || value instanceof getWindow(value).Element;
}
function isHTMLElement(value) {
  if (!hasWindow()) {
    return false;
  }
  return value instanceof HTMLElement || value instanceof getWindow(value).HTMLElement;
}
function isShadowRoot(value) {
  if (!hasWindow() || typeof ShadowRoot === "undefined") {
    return false;
  }
  return value instanceof ShadowRoot || value instanceof getWindow(value).ShadowRoot;
}
var invalidOverflowDisplayValues = /* @__PURE__ */ new Set(["inline", "contents"]);
function isOverflowElement(element) {
  const {
    overflow,
    overflowX,
    overflowY,
    display
  } = getComputedStyle(element);
  return /auto|scroll|overlay|hidden|clip/.test(overflow + overflowY + overflowX) && !invalidOverflowDisplayValues.has(display);
}
var tableElements = /* @__PURE__ */ new Set(["table", "td", "th"]);
function isTableElement(element) {
  return tableElements.has(getNodeName(element));
}
var topLayerSelectors = [":popover-open", ":modal"];
function isTopLayer(element) {
  return topLayerSelectors.some((selector) => {
    try {
      return element.matches(selector);
    } catch (_e) {
      return false;
    }
  });
}
var transformProperties = ["transform", "translate", "scale", "rotate", "perspective"];
var willChangeValues = ["transform", "translate", "scale", "rotate", "perspective", "filter"];
var containValues = ["paint", "layout", "strict", "content"];
function isContainingBlock(elementOrCss) {
  const webkit = isWebKit();
  const css = isElement(elementOrCss) ? getComputedStyle(elementOrCss) : elementOrCss;
  return transformProperties.some((value) => css[value] ? css[value] !== "none" : false) || (css.containerType ? css.containerType !== "normal" : false) || !webkit && (css.backdropFilter ? css.backdropFilter !== "none" : false) || !webkit && (css.filter ? css.filter !== "none" : false) || willChangeValues.some((value) => (css.willChange || "").includes(value)) || containValues.some((value) => (css.contain || "").includes(value));
}
function getContainingBlock(element) {
  let currentNode = getParentNode(element);
  while (isHTMLElement(currentNode) && !isLastTraversableNode(currentNode)) {
    if (isContainingBlock(currentNode)) {
      return currentNode;
    } else if (isTopLayer(currentNode)) {
      return null;
    }
    currentNode = getParentNode(currentNode);
  }
  return null;
}
function isWebKit() {
  if (typeof CSS === "undefined" || !CSS.supports) return false;
  return CSS.supports("-webkit-backdrop-filter", "none");
}
var lastTraversableNodeNames = /* @__PURE__ */ new Set(["html", "body", "#document"]);
function isLastTraversableNode(node) {
  return lastTraversableNodeNames.has(getNodeName(node));
}
function getComputedStyle(element) {
  return getWindow(element).getComputedStyle(element);
}
function getNodeScroll(element) {
  if (isElement(element)) {
    return {
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop
    };
  }
  return {
    scrollLeft: element.scrollX,
    scrollTop: element.scrollY
  };
}
function getParentNode(node) {
  if (getNodeName(node) === "html") {
    return node;
  }
  const result = (
    // Step into the shadow DOM of the parent of a slotted node.
    node.assignedSlot || // DOM Element detected.
    node.parentNode || // ShadowRoot detected.
    isShadowRoot(node) && node.host || // Fallback.
    getDocumentElement(node)
  );
  return isShadowRoot(result) ? result.host : result;
}
function getNearestOverflowAncestor(node) {
  const parentNode = getParentNode(node);
  if (isLastTraversableNode(parentNode)) {
    return node.ownerDocument ? node.ownerDocument.body : node.body;
  }
  if (isHTMLElement(parentNode) && isOverflowElement(parentNode)) {
    return parentNode;
  }
  return getNearestOverflowAncestor(parentNode);
}
function getOverflowAncestors(node, list, traverseIframes) {
  var _node$ownerDocument2;
  if (list === void 0) {
    list = [];
  }
  if (traverseIframes === void 0) {
    traverseIframes = true;
  }
  const scrollableAncestor = getNearestOverflowAncestor(node);
  const isBody = scrollableAncestor === ((_node$ownerDocument2 = node.ownerDocument) == null ? void 0 : _node$ownerDocument2.body);
  const win = getWindow(scrollableAncestor);
  if (isBody) {
    const frameElement = getFrameElement(win);
    return list.concat(win, win.visualViewport || [], isOverflowElement(scrollableAncestor) ? scrollableAncestor : [], frameElement && traverseIframes ? getOverflowAncestors(frameElement) : []);
  }
  return list.concat(scrollableAncestor, getOverflowAncestors(scrollableAncestor, [], traverseIframes));
}
function getFrameElement(win) {
  return win.parent && Object.getPrototypeOf(win.parent) ? win.frameElement : null;
}

// node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs
function getCssDimensions(element) {
  const css = getComputedStyle(element);
  let width = parseFloat(css.width) || 0;
  let height = parseFloat(css.height) || 0;
  const hasOffset = isHTMLElement(element);
  const offsetWidth = hasOffset ? element.offsetWidth : width;
  const offsetHeight = hasOffset ? element.offsetHeight : height;
  const shouldFallback = round(width) !== offsetWidth || round(height) !== offsetHeight;
  if (shouldFallback) {
    width = offsetWidth;
    height = offsetHeight;
  }
  return {
    width,
    height,
    $: shouldFallback
  };
}
function unwrapElement(element) {
  return !isElement(element) ? element.contextElement : element;
}
function getScale(element) {
  const domElement = unwrapElement(element);
  if (!isHTMLElement(domElement)) {
    return createCoords(1);
  }
  const rect = domElement.getBoundingClientRect();
  const {
    width,
    height,
    $
  } = getCssDimensions(domElement);
  let x = ($ ? round(rect.width) : rect.width) / width;
  let y = ($ ? round(rect.height) : rect.height) / height;
  if (!x || !Number.isFinite(x)) {
    x = 1;
  }
  if (!y || !Number.isFinite(y)) {
    y = 1;
  }
  return {
    x,
    y
  };
}
var noOffsets = createCoords(0);
function getVisualOffsets(element) {
  const win = getWindow(element);
  if (!isWebKit() || !win.visualViewport) {
    return noOffsets;
  }
  return {
    x: win.visualViewport.offsetLeft,
    y: win.visualViewport.offsetTop
  };
}
function shouldAddVisualOffsets(element, isFixed, floatingOffsetParent) {
  if (isFixed === void 0) {
    isFixed = false;
  }
  if (!floatingOffsetParent || isFixed && floatingOffsetParent !== getWindow(element)) {
    return false;
  }
  return isFixed;
}
function getBoundingClientRect(element, includeScale, isFixedStrategy, offsetParent) {
  if (includeScale === void 0) {
    includeScale = false;
  }
  if (isFixedStrategy === void 0) {
    isFixedStrategy = false;
  }
  const clientRect = element.getBoundingClientRect();
  const domElement = unwrapElement(element);
  let scale = createCoords(1);
  if (includeScale) {
    if (offsetParent) {
      if (isElement(offsetParent)) {
        scale = getScale(offsetParent);
      }
    } else {
      scale = getScale(element);
    }
  }
  const visualOffsets = shouldAddVisualOffsets(domElement, isFixedStrategy, offsetParent) ? getVisualOffsets(domElement) : createCoords(0);
  let x = (clientRect.left + visualOffsets.x) / scale.x;
  let y = (clientRect.top + visualOffsets.y) / scale.y;
  let width = clientRect.width / scale.x;
  let height = clientRect.height / scale.y;
  if (domElement) {
    const win = getWindow(domElement);
    const offsetWin = offsetParent && isElement(offsetParent) ? getWindow(offsetParent) : offsetParent;
    let currentWin = win;
    let currentIFrame = getFrameElement(currentWin);
    while (currentIFrame && offsetParent && offsetWin !== currentWin) {
      const iframeScale = getScale(currentIFrame);
      const iframeRect = currentIFrame.getBoundingClientRect();
      const css = getComputedStyle(currentIFrame);
      const left = iframeRect.left + (currentIFrame.clientLeft + parseFloat(css.paddingLeft)) * iframeScale.x;
      const top = iframeRect.top + (currentIFrame.clientTop + parseFloat(css.paddingTop)) * iframeScale.y;
      x *= iframeScale.x;
      y *= iframeScale.y;
      width *= iframeScale.x;
      height *= iframeScale.y;
      x += left;
      y += top;
      currentWin = getWindow(currentIFrame);
      currentIFrame = getFrameElement(currentWin);
    }
  }
  return rectToClientRect({
    width,
    height,
    x,
    y
  });
}
function getWindowScrollBarX(element, rect) {
  const leftScroll = getNodeScroll(element).scrollLeft;
  if (!rect) {
    return getBoundingClientRect(getDocumentElement(element)).left + leftScroll;
  }
  return rect.left + leftScroll;
}
function getHTMLOffset(documentElement, scroll, ignoreScrollbarX) {
  if (ignoreScrollbarX === void 0) {
    ignoreScrollbarX = false;
  }
  const htmlRect = documentElement.getBoundingClientRect();
  const x = htmlRect.left + scroll.scrollLeft - (ignoreScrollbarX ? 0 : (
    // RTL <body> scrollbar.
    getWindowScrollBarX(documentElement, htmlRect)
  ));
  const y = htmlRect.top + scroll.scrollTop;
  return {
    x,
    y
  };
}
function convertOffsetParentRelativeRectToViewportRelativeRect(_ref) {
  let {
    elements,
    rect,
    offsetParent,
    strategy
  } = _ref;
  const isFixed = strategy === "fixed";
  const documentElement = getDocumentElement(offsetParent);
  const topLayer = elements ? isTopLayer(elements.floating) : false;
  if (offsetParent === documentElement || topLayer && isFixed) {
    return rect;
  }
  let scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  let scale = createCoords(1);
  const offsets = createCoords(0);
  const isOffsetParentAnElement = isHTMLElement(offsetParent);
  if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
    if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }
    if (isHTMLElement(offsetParent)) {
      const offsetRect = getBoundingClientRect(offsetParent);
      scale = getScale(offsetParent);
      offsets.x = offsetRect.x + offsetParent.clientLeft;
      offsets.y = offsetRect.y + offsetParent.clientTop;
    }
  }
  const htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll, true) : createCoords(0);
  return {
    width: rect.width * scale.x,
    height: rect.height * scale.y,
    x: rect.x * scale.x - scroll.scrollLeft * scale.x + offsets.x + htmlOffset.x,
    y: rect.y * scale.y - scroll.scrollTop * scale.y + offsets.y + htmlOffset.y
  };
}
function getClientRects(element) {
  return Array.from(element.getClientRects());
}
function getDocumentRect(element) {
  const html = getDocumentElement(element);
  const scroll = getNodeScroll(element);
  const body = element.ownerDocument.body;
  const width = max(html.scrollWidth, html.clientWidth, body.scrollWidth, body.clientWidth);
  const height = max(html.scrollHeight, html.clientHeight, body.scrollHeight, body.clientHeight);
  let x = -scroll.scrollLeft + getWindowScrollBarX(element);
  const y = -scroll.scrollTop;
  if (getComputedStyle(body).direction === "rtl") {
    x += max(html.clientWidth, body.clientWidth) - width;
  }
  return {
    width,
    height,
    x,
    y
  };
}
function getViewportRect(element, strategy) {
  const win = getWindow(element);
  const html = getDocumentElement(element);
  const visualViewport = win.visualViewport;
  let width = html.clientWidth;
  let height = html.clientHeight;
  let x = 0;
  let y = 0;
  if (visualViewport) {
    width = visualViewport.width;
    height = visualViewport.height;
    const visualViewportBased = isWebKit();
    if (!visualViewportBased || visualViewportBased && strategy === "fixed") {
      x = visualViewport.offsetLeft;
      y = visualViewport.offsetTop;
    }
  }
  return {
    width,
    height,
    x,
    y
  };
}
var absoluteOrFixed = /* @__PURE__ */ new Set(["absolute", "fixed"]);
function getInnerBoundingClientRect(element, strategy) {
  const clientRect = getBoundingClientRect(element, true, strategy === "fixed");
  const top = clientRect.top + element.clientTop;
  const left = clientRect.left + element.clientLeft;
  const scale = isHTMLElement(element) ? getScale(element) : createCoords(1);
  const width = element.clientWidth * scale.x;
  const height = element.clientHeight * scale.y;
  const x = left * scale.x;
  const y = top * scale.y;
  return {
    width,
    height,
    x,
    y
  };
}
function getClientRectFromClippingAncestor(element, clippingAncestor, strategy) {
  let rect;
  if (clippingAncestor === "viewport") {
    rect = getViewportRect(element, strategy);
  } else if (clippingAncestor === "document") {
    rect = getDocumentRect(getDocumentElement(element));
  } else if (isElement(clippingAncestor)) {
    rect = getInnerBoundingClientRect(clippingAncestor, strategy);
  } else {
    const visualOffsets = getVisualOffsets(element);
    rect = {
      x: clippingAncestor.x - visualOffsets.x,
      y: clippingAncestor.y - visualOffsets.y,
      width: clippingAncestor.width,
      height: clippingAncestor.height
    };
  }
  return rectToClientRect(rect);
}
function hasFixedPositionAncestor(element, stopNode) {
  const parentNode = getParentNode(element);
  if (parentNode === stopNode || !isElement(parentNode) || isLastTraversableNode(parentNode)) {
    return false;
  }
  return getComputedStyle(parentNode).position === "fixed" || hasFixedPositionAncestor(parentNode, stopNode);
}
function getClippingElementAncestors(element, cache) {
  const cachedResult = cache.get(element);
  if (cachedResult) {
    return cachedResult;
  }
  let result = getOverflowAncestors(element, [], false).filter((el) => isElement(el) && getNodeName(el) !== "body");
  let currentContainingBlockComputedStyle = null;
  const elementIsFixed = getComputedStyle(element).position === "fixed";
  let currentNode = elementIsFixed ? getParentNode(element) : element;
  while (isElement(currentNode) && !isLastTraversableNode(currentNode)) {
    const computedStyle = getComputedStyle(currentNode);
    const currentNodeIsContaining = isContainingBlock(currentNode);
    if (!currentNodeIsContaining && computedStyle.position === "fixed") {
      currentContainingBlockComputedStyle = null;
    }
    const shouldDropCurrentNode = elementIsFixed ? !currentNodeIsContaining && !currentContainingBlockComputedStyle : !currentNodeIsContaining && computedStyle.position === "static" && !!currentContainingBlockComputedStyle && absoluteOrFixed.has(currentContainingBlockComputedStyle.position) || isOverflowElement(currentNode) && !currentNodeIsContaining && hasFixedPositionAncestor(element, currentNode);
    if (shouldDropCurrentNode) {
      result = result.filter((ancestor) => ancestor !== currentNode);
    } else {
      currentContainingBlockComputedStyle = computedStyle;
    }
    currentNode = getParentNode(currentNode);
  }
  cache.set(element, result);
  return result;
}
function getClippingRect(_ref) {
  let {
    element,
    boundary,
    rootBoundary,
    strategy
  } = _ref;
  const elementClippingAncestors = boundary === "clippingAncestors" ? isTopLayer(element) ? [] : getClippingElementAncestors(element, this._c) : [].concat(boundary);
  const clippingAncestors = [...elementClippingAncestors, rootBoundary];
  const firstClippingAncestor = clippingAncestors[0];
  const clippingRect = clippingAncestors.reduce((accRect, clippingAncestor) => {
    const rect = getClientRectFromClippingAncestor(element, clippingAncestor, strategy);
    accRect.top = max(rect.top, accRect.top);
    accRect.right = min(rect.right, accRect.right);
    accRect.bottom = min(rect.bottom, accRect.bottom);
    accRect.left = max(rect.left, accRect.left);
    return accRect;
  }, getClientRectFromClippingAncestor(element, firstClippingAncestor, strategy));
  return {
    width: clippingRect.right - clippingRect.left,
    height: clippingRect.bottom - clippingRect.top,
    x: clippingRect.left,
    y: clippingRect.top
  };
}
function getDimensions(element) {
  const {
    width,
    height
  } = getCssDimensions(element);
  return {
    width,
    height
  };
}
function getRectRelativeToOffsetParent(element, offsetParent, strategy) {
  const isOffsetParentAnElement = isHTMLElement(offsetParent);
  const documentElement = getDocumentElement(offsetParent);
  const isFixed = strategy === "fixed";
  const rect = getBoundingClientRect(element, true, isFixed, offsetParent);
  let scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const offsets = createCoords(0);
  function setLeftRTLScrollbarOffset() {
    offsets.x = getWindowScrollBarX(documentElement);
  }
  if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
    if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }
    if (isOffsetParentAnElement) {
      const offsetRect = getBoundingClientRect(offsetParent, true, isFixed, offsetParent);
      offsets.x = offsetRect.x + offsetParent.clientLeft;
      offsets.y = offsetRect.y + offsetParent.clientTop;
    } else if (documentElement) {
      setLeftRTLScrollbarOffset();
    }
  }
  if (isFixed && !isOffsetParentAnElement && documentElement) {
    setLeftRTLScrollbarOffset();
  }
  const htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll) : createCoords(0);
  const x = rect.left + scroll.scrollLeft - offsets.x - htmlOffset.x;
  const y = rect.top + scroll.scrollTop - offsets.y - htmlOffset.y;
  return {
    x,
    y,
    width: rect.width,
    height: rect.height
  };
}
function isStaticPositioned(element) {
  return getComputedStyle(element).position === "static";
}
function getTrueOffsetParent(element, polyfill) {
  if (!isHTMLElement(element) || getComputedStyle(element).position === "fixed") {
    return null;
  }
  if (polyfill) {
    return polyfill(element);
  }
  let rawOffsetParent = element.offsetParent;
  if (getDocumentElement(element) === rawOffsetParent) {
    rawOffsetParent = rawOffsetParent.ownerDocument.body;
  }
  return rawOffsetParent;
}
function getOffsetParent(element, polyfill) {
  const win = getWindow(element);
  if (isTopLayer(element)) {
    return win;
  }
  if (!isHTMLElement(element)) {
    let svgOffsetParent = getParentNode(element);
    while (svgOffsetParent && !isLastTraversableNode(svgOffsetParent)) {
      if (isElement(svgOffsetParent) && !isStaticPositioned(svgOffsetParent)) {
        return svgOffsetParent;
      }
      svgOffsetParent = getParentNode(svgOffsetParent);
    }
    return win;
  }
  let offsetParent = getTrueOffsetParent(element, polyfill);
  while (offsetParent && isTableElement(offsetParent) && isStaticPositioned(offsetParent)) {
    offsetParent = getTrueOffsetParent(offsetParent, polyfill);
  }
  if (offsetParent && isLastTraversableNode(offsetParent) && isStaticPositioned(offsetParent) && !isContainingBlock(offsetParent)) {
    return win;
  }
  return offsetParent || getContainingBlock(element) || win;
}
var getElementRects = function(data) {
  return __async(this, null, function* () {
    const getOffsetParentFn = this.getOffsetParent || getOffsetParent;
    const getDimensionsFn = this.getDimensions;
    const floatingDimensions = yield getDimensionsFn(data.floating);
    return {
      reference: getRectRelativeToOffsetParent(data.reference, yield getOffsetParentFn(data.floating), data.strategy),
      floating: {
        x: 0,
        y: 0,
        width: floatingDimensions.width,
        height: floatingDimensions.height
      }
    };
  });
};
function isRTL(element) {
  return getComputedStyle(element).direction === "rtl";
}
var platform = {
  convertOffsetParentRelativeRectToViewportRelativeRect,
  getDocumentElement,
  getClippingRect,
  getOffsetParent,
  getElementRects,
  getClientRects,
  getDimensions,
  getScale,
  isElement,
  isRTL
};
var detectOverflow2 = detectOverflow;
var offset2 = offset;
var autoPlacement2 = autoPlacement;
var computePosition2 = (reference, floating, options) => {
  const cache = /* @__PURE__ */ new Map();
  const mergedOptions = __spreadValues({
    platform
  }, options);
  const platformWithCache = __spreadProps(__spreadValues({}, mergedOptions.platform), {
    _c: cache
  });
  return computePosition(reference, floating, __spreadProps(__spreadValues({}, mergedOptions), {
    platform: platformWithCache
  }));
};

// node_modules/w3c-keyname/index.js
var base = {
  8: "Backspace",
  9: "Tab",
  10: "Enter",
  12: "NumLock",
  13: "Enter",
  16: "Shift",
  17: "Control",
  18: "Alt",
  20: "CapsLock",
  27: "Escape",
  32: " ",
  33: "PageUp",
  34: "PageDown",
  35: "End",
  36: "Home",
  37: "ArrowLeft",
  38: "ArrowUp",
  39: "ArrowRight",
  40: "ArrowDown",
  44: "PrintScreen",
  45: "Insert",
  46: "Delete",
  59: ";",
  61: "=",
  91: "Meta",
  92: "Meta",
  106: "*",
  107: "+",
  108: ",",
  109: "-",
  110: ".",
  111: "/",
  144: "NumLock",
  145: "ScrollLock",
  160: "Shift",
  161: "Shift",
  162: "Control",
  163: "Control",
  164: "Alt",
  165: "Alt",
  173: "-",
  186: ";",
  187: "=",
  188: ",",
  189: "-",
  190: ".",
  191: "/",
  192: "`",
  219: "[",
  220: "\\",
  221: "]",
  222: "'"
};
var shift2 = {
  48: ")",
  49: "!",
  50: "@",
  51: "#",
  52: "$",
  53: "%",
  54: "^",
  55: "&",
  56: "*",
  57: "(",
  59: ":",
  61: "+",
  173: "_",
  186: ":",
  187: "+",
  188: "<",
  189: "_",
  190: ">",
  191: "?",
  192: "~",
  219: "{",
  220: "|",
  221: "}",
  222: '"'
};
var mac2 = typeof navigator != "undefined" && /Mac/.test(navigator.platform);
var ie = typeof navigator != "undefined" && /MSIE \d|Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(navigator.userAgent);
for (i = 0; i < 10; i++) base[48 + i] = base[96 + i] = String(i);
var i;
for (i = 1; i <= 24; i++) base[i + 111] = "F" + i;
var i;
for (i = 65; i <= 90; i++) {
  base[i] = String.fromCharCode(i + 32);
  shift2[i] = String.fromCharCode(i);
}
var i;
for (code2 in base) if (!shift2.hasOwnProperty(code2)) shift2[code2] = base[code2];
var code2;
function keyName(event) {
  var ignoreKey = mac2 && event.metaKey && event.shiftKey && !event.ctrlKey && !event.altKey || ie && event.shiftKey && event.key && event.key.length == 1 || event.key == "Unidentified";
  var name = !ignoreKey && event.key || (event.shiftKey ? shift2 : base)[event.keyCode] || event.key || "Unidentified";
  if (name == "Esc") name = "Escape";
  if (name == "Del") name = "Delete";
  if (name == "Left") name = "ArrowLeft";
  if (name == "Up") name = "ArrowUp";
  if (name == "Right") name = "ArrowRight";
  if (name == "Down") name = "ArrowDown";
  return name;
}

// node_modules/prosemirror-keymap/dist/index.js
var mac3 = typeof navigator != "undefined" && /Mac|iP(hone|[oa]d)/.test(navigator.platform);
var windows = typeof navigator != "undefined" && /Win/.test(navigator.platform);
function normalizeKeyName(name) {
  let parts = name.split(/-(?!$)/), result = parts[parts.length - 1];
  if (result == "Space")
    result = " ";
  let alt, ctrl, shift3, meta;
  for (let i = 0; i < parts.length - 1; i++) {
    let mod = parts[i];
    if (/^(cmd|meta|m)$/i.test(mod))
      meta = true;
    else if (/^a(lt)?$/i.test(mod))
      alt = true;
    else if (/^(c|ctrl|control)$/i.test(mod))
      ctrl = true;
    else if (/^s(hift)?$/i.test(mod))
      shift3 = true;
    else if (/^mod$/i.test(mod)) {
      if (mac3)
        meta = true;
      else
        ctrl = true;
    } else
      throw new Error("Unrecognized modifier name: " + mod);
  }
  if (alt)
    result = "Alt-" + result;
  if (ctrl)
    result = "Ctrl-" + result;
  if (meta)
    result = "Meta-" + result;
  if (shift3)
    result = "Shift-" + result;
  return result;
}
function normalize(map2) {
  let copy = /* @__PURE__ */ Object.create(null);
  for (let prop in map2)
    copy[normalizeKeyName(prop)] = map2[prop];
  return copy;
}
function modifiers(name, event, shift3 = true) {
  if (event.altKey)
    name = "Alt-" + name;
  if (event.ctrlKey)
    name = "Ctrl-" + name;
  if (event.metaKey)
    name = "Meta-" + name;
  if (shift3 && event.shiftKey)
    name = "Shift-" + name;
  return name;
}
function keymap(bindings) {
  return new Plugin({ props: { handleKeyDown: keydownHandler(bindings) } });
}
function keydownHandler(bindings) {
  let map2 = normalize(bindings);
  return function(view, event) {
    let name = keyName(event), baseName, direct = map2[modifiers(name, event)];
    if (direct && direct(view.state, view.dispatch, view))
      return true;
    if (name.length == 1 && name != " ") {
      if (event.shiftKey) {
        let noShift = map2[modifiers(name, event, false)];
        if (noShift && noShift(view.state, view.dispatch, view))
          return true;
      }
      if ((event.altKey || event.metaKey || event.ctrlKey) && // Ctrl-Alt may be used for AltGr on Windows
      !(windows && event.ctrlKey && event.altKey) && (baseName = base[event.keyCode]) && baseName != name) {
        let fromCode = map2[modifiers(baseName, event)];
        if (fromCode && fromCode(view.state, view.dispatch, view))
          return true;
      }
    }
    return false;
  };
}

// node_modules/ngx-editor/fesm2022/ngx-editor.mjs
var _c0 = ["imgEl"];
var _c1 = (a0) => ({
  "NgxEditor__Resizer--Active": a0
});
function ImageViewComponent_span_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "span", 4)(1, "span", 5);
    ɵɵlistener("mousedown", function ImageViewComponent_span_1_Template_span_mousedown_1_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.startResizing($event, "left"));
    });
    ɵɵelementEnd();
    ɵɵelementStart(2, "span", 6);
    ɵɵlistener("mousedown", function ImageViewComponent_span_1_Template_span_mousedown_2_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.startResizing($event, "right"));
    });
    ɵɵelementEnd();
    ɵɵelementStart(3, "span", 7);
    ɵɵlistener("mousedown", function ImageViewComponent_span_1_Template_span_mousedown_3_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.startResizing($event, "left"));
    });
    ɵɵelementEnd();
    ɵɵelementStart(4, "span", 8);
    ɵɵlistener("mousedown", function ImageViewComponent_span_1_Template_span_mousedown_4_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.startResizing($event, "right"));
    });
    ɵɵelementEnd()();
  }
}
var _c2 = ["ngxEditor"];
var _c3 = ["*"];
var _c4 = (a0, a1) => ({
  backgroundColor: a0,
  color: a1
});
var _c5 = (a0) => ({
  "NgxEditor__Color--Active": a0
});
function ColorPickerComponent_div_4_div_1_button_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "button", 7);
    ɵɵlistener("mousedown", function ColorPickerComponent_div_4_div_1_button_1_Template_button_mousedown_0_listener($event) {
      const color_r3 = ɵɵrestoreView(_r2).$implicit;
      const ctx_r3 = ɵɵnextContext(3);
      return ɵɵresetView(ctx_r3.onColorSelectMouseClick($event, color_r3));
    })("keydown.enter", function ColorPickerComponent_div_4_div_1_button_1_Template_button_keydown_enter_0_listener() {
      const color_r3 = ɵɵrestoreView(_r2).$implicit;
      const ctx_r3 = ɵɵnextContext(3);
      return ɵɵresetView(ctx_r3.onColorSelectKeydown(color_r3));
    })("keydown.space", function ColorPickerComponent_div_4_div_1_button_1_Template_button_keydown_space_0_listener() {
      const color_r3 = ɵɵrestoreView(_r2).$implicit;
      const ctx_r3 = ɵɵnextContext(3);
      return ɵɵresetView(ctx_r3.onColorSelectKeydown(color_r3));
    });
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const color_r3 = ctx.$implicit;
    const ctx_r3 = ɵɵnextContext(3);
    ɵɵproperty("ngStyle", ɵɵpureFunction2(3, _c4, color_r3, ctx_r3.getContrastYIQ(color_r3)))("title", color_r3)("ngClass", ɵɵpureFunction1(6, _c5, ctx_r3.activeColors.includes(color_r3)));
  }
}
function ColorPickerComponent_div_4_div_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "div", 5);
    ɵɵtemplate(1, ColorPickerComponent_div_4_div_1_button_1_Template, 1, 8, "button", 6);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const colorGroup_r5 = ctx.$implicit;
    const ctx_r3 = ɵɵnextContext(2);
    ɵɵadvance();
    ɵɵproperty("ngForOf", colorGroup_r5)("ngForTrackBy", ctx_r3.trackByIndex);
  }
}
function ColorPickerComponent_div_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "div", 2);
    ɵɵtemplate(1, ColorPickerComponent_div_4_div_1_Template, 2, 2, "div", 3);
    ɵɵelementStart(2, "button", 4);
    ɵɵlistener("mousedown", function ColorPickerComponent_div_4_Template_button_mousedown_2_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r3 = ɵɵnextContext();
      return ɵɵresetView(ctx_r3.onRemoveMouseClick($event));
    })("keydown.enter", function ColorPickerComponent_div_4_Template_button_keydown_enter_2_listener() {
      ɵɵrestoreView(_r1);
      const ctx_r3 = ɵɵnextContext();
      return ɵɵresetView(ctx_r3.onRemoveKeydown());
    })("keydown.space", function ColorPickerComponent_div_4_Template_button_keydown_space_2_listener() {
      ɵɵrestoreView(_r1);
      const ctx_r3 = ɵɵnextContext();
      return ɵɵresetView(ctx_r3.onRemoveKeydown());
    });
    ɵɵtext(3);
    ɵɵpipe(4, "async");
    ɵɵelementEnd()();
  }
  if (rf & 2) {
    const ctx_r3 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵproperty("ngForOf", ctx_r3.presets)("ngForTrackBy", ctx_r3.trackByIndex);
    ɵɵadvance();
    ɵɵproperty("disabled", !ctx_r3.isActive);
    ɵɵadvance();
    ɵɵtextInterpolate1(" ", ɵɵpipeBind1(4, 4, ctx_r3.getLabel("remove")), " ");
  }
}
var _c6 = (a0, a1) => ({
  "NgxEditor__Dropdown--Active": a0,
  "NgxEditor--Disabled": a1
});
function DropdownComponent_div_4_button_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "button", 4);
    ɵɵpipe(1, "async");
    ɵɵlistener("mousedown", function DropdownComponent_div_4_button_1_Template_button_mousedown_0_listener($event) {
      const item_r2 = ɵɵrestoreView(_r1).$implicit;
      const ctx_r2 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r2.onDropdownItemMouseClick($event, item_r2));
    })("keydown.enter", function DropdownComponent_div_4_button_1_Template_button_keydown_enter_0_listener($event) {
      const item_r2 = ɵɵrestoreView(_r1).$implicit;
      const ctx_r2 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r2.onDropdownItemKeydown($event, item_r2));
    })("keydown.space", function DropdownComponent_div_4_button_1_Template_button_keydown_space_0_listener($event) {
      const item_r2 = ɵɵrestoreView(_r1).$implicit;
      const ctx_r2 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r2.onDropdownItemKeydown($event, item_r2));
    });
    ɵɵtext(2);
    ɵɵpipe(3, "async");
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const item_r2 = ctx.$implicit;
    const ctx_r2 = ɵɵnextContext(2);
    ɵɵproperty("ngClass", ɵɵpureFunction2(8, _c6, item_r2 === ctx_r2.activeItem, ctx_r2.disabledItems.includes(item_r2)));
    ɵɵariaProperty("ariaLabel", ɵɵpipeBind1(1, 4, ctx_r2.getName(item_r2)));
    ɵɵattribute("aria-selected", item_r2 === ctx_r2.activeItem);
    ɵɵadvance(2);
    ɵɵtextInterpolate1(" ", ɵɵpipeBind1(3, 6, ctx_r2.getName(item_r2)), " ");
  }
}
function DropdownComponent_div_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "div", 2);
    ɵɵtemplate(1, DropdownComponent_div_4_button_1_Template, 4, 11, "button", 3);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵproperty("ngForOf", ctx_r2.items)("ngForTrackBy", ctx_r2.trackByIndex);
  }
}
function ImageComponent_div_4_div_8_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "div", 12);
    ɵɵtext(1);
    ɵɵpipe(2, "async");
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵadvance();
    ɵɵtextInterpolate1(" ", ɵɵpipeBind1(2, 1, (ctx_r1.src.errors == null ? null : ctx_r1.src.errors["pattern"]) && ctx_r1.getLabel("enterValidUrl")), " ");
  }
}
function ImageComponent_div_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "div", 2)(1, "form", 3);
    ɵɵlistener("ngSubmit", function ImageComponent_div_4_Template_form_ngSubmit_1_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.insertLink($event));
    });
    ɵɵelementStart(2, "div", 4)(3, "div", 5)(4, "label", 6);
    ɵɵtext(5);
    ɵɵpipe(6, "async");
    ɵɵelementEnd();
    ɵɵelement(7, "input", 7);
    ɵɵtemplate(8, ImageComponent_div_4_div_8_Template, 3, 3, "div", 8);
    ɵɵelementEnd()();
    ɵɵelementStart(9, "div", 4)(10, "div", 5)(11, "label", 6);
    ɵɵtext(12);
    ɵɵpipe(13, "async");
    ɵɵelementEnd();
    ɵɵelement(14, "input", 9);
    ɵɵelementEnd()();
    ɵɵelementStart(15, "div", 4)(16, "div", 5)(17, "label", 6);
    ɵɵtext(18);
    ɵɵpipe(19, "async");
    ɵɵelementEnd();
    ɵɵelement(20, "input", 10);
    ɵɵelementEnd()();
    ɵɵelementStart(21, "button", 11);
    ɵɵtext(22);
    ɵɵpipe(23, "async");
    ɵɵelementEnd()()();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵproperty("formGroup", ctx_r1.form);
    ɵɵadvance(3);
    ɵɵproperty("htmlFor", ctx_r1.getId("image-popup-url"));
    ɵɵadvance();
    ɵɵtextInterpolate(ɵɵpipeBind1(6, 13, ctx_r1.getLabel("url")));
    ɵɵadvance(2);
    ɵɵproperty("id", ctx_r1.getId("image-popup-url"));
    ɵɵadvance();
    ɵɵproperty("ngIf", ctx_r1.src.touched && ctx_r1.src.invalid);
    ɵɵadvance(3);
    ɵɵproperty("htmlFor", ctx_r1.getId("image-popup-label"));
    ɵɵadvance();
    ɵɵtextInterpolate(ɵɵpipeBind1(13, 15, ctx_r1.getLabel("altText")));
    ɵɵadvance(2);
    ɵɵproperty("id", ctx_r1.getId("image-popup-label"));
    ɵɵadvance(3);
    ɵɵproperty("htmlFor", ctx_r1.getId("image-popup-title"));
    ɵɵadvance();
    ɵɵtextInterpolate(ɵɵpipeBind1(19, 17, ctx_r1.getLabel("title")));
    ɵɵadvance(2);
    ɵɵproperty("id", ctx_r1.getId("image-popup-title"));
    ɵɵadvance();
    ɵɵproperty("disabled", !ctx_r1.form.valid || !ctx_r1.form.dirty);
    ɵɵadvance();
    ɵɵtextInterpolate(ɵɵpipeBind1(23, 19, ctx_r1.getLabel("insert")));
  }
}
function LinkComponent_div_4_div_8_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "div", 12);
    ɵɵtext(1);
    ɵɵpipe(2, "async");
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵadvance();
    ɵɵtextInterpolate1(" ", ɵɵpipeBind1(2, 1, (ctx_r1.href.errors == null ? null : ctx_r1.href.errors["pattern"]) && ctx_r1.getLabel("enterValidUrl")), " ");
  }
}
function LinkComponent_div_4_div_15_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "div", 12);
    ɵɵtext(1);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵadvance();
    ɵɵtextInterpolate1(" ", (ctx_r1.text.errors == null ? null : ctx_r1.text.errors["required"]) && "This is required", " ");
  }
}
function LinkComponent_div_4_div_16_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "div", 4)(1, "div", 5)(2, "label");
    ɵɵelement(3, "input", 13);
    ɵɵtext(4);
    ɵɵpipe(5, "async");
    ɵɵelementEnd()()();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵadvance(4);
    ɵɵtextInterpolate1(" ", ɵɵpipeBind1(5, 1, ctx_r1.getLabel("openInNewTab")), " ");
  }
}
function LinkComponent_div_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "div", 2)(1, "form", 3);
    ɵɵlistener("ngSubmit", function LinkComponent_div_4_Template_form_ngSubmit_1_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.insertLink($event));
    });
    ɵɵelementStart(2, "div", 4)(3, "div", 5)(4, "label", 6);
    ɵɵtext(5);
    ɵɵpipe(6, "async");
    ɵɵelementEnd();
    ɵɵelement(7, "input", 7);
    ɵɵtemplate(8, LinkComponent_div_4_div_8_Template, 3, 3, "div", 8);
    ɵɵelementEnd()();
    ɵɵelementStart(9, "div", 4)(10, "div", 5)(11, "label", 6);
    ɵɵtext(12);
    ɵɵpipe(13, "async");
    ɵɵelementEnd();
    ɵɵelement(14, "input", 9);
    ɵɵtemplate(15, LinkComponent_div_4_div_15_Template, 2, 1, "div", 8);
    ɵɵelementEnd()();
    ɵɵtemplate(16, LinkComponent_div_4_div_16_Template, 6, 3, "div", 10);
    ɵɵelementStart(17, "button", 11);
    ɵɵtext(18);
    ɵɵpipe(19, "async");
    ɵɵelementEnd()()();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵproperty("formGroup", ctx_r1.form);
    ɵɵadvance(3);
    ɵɵproperty("htmlFor", ctx_r1.getId("link-popup-url"));
    ɵɵadvance();
    ɵɵtextInterpolate(ɵɵpipeBind1(6, 12, ctx_r1.getLabel("url")));
    ɵɵadvance(2);
    ɵɵproperty("id", ctx_r1.getId("link-popup-url"));
    ɵɵadvance();
    ɵɵproperty("ngIf", ctx_r1.href.touched && ctx_r1.href.invalid);
    ɵɵadvance(3);
    ɵɵproperty("htmlFor", ctx_r1.getId("link-popup-label"));
    ɵɵadvance();
    ɵɵtextInterpolate(ɵɵpipeBind1(13, 14, ctx_r1.getLabel("text")));
    ɵɵadvance(2);
    ɵɵproperty("id", ctx_r1.getId("link-popup-label"));
    ɵɵadvance();
    ɵɵproperty("ngIf", ctx_r1.text.touched && ctx_r1.text.invalid);
    ɵɵadvance();
    ɵɵproperty("ngIf", ctx_r1.options.showOpenInNewTab);
    ɵɵadvance();
    ɵɵproperty("disabled", !ctx_r1.form.valid);
    ɵɵadvance();
    ɵɵtextInterpolate(ɵɵpipeBind1(19, 16, ctx_r1.getLabel("insert")));
  }
}
var _c7 = (a0, a1) => ({
  "NgxEditor--Disabled": a0,
  "NgxEditor__MenuBar--Reverse": a1
});
function NgxEditorMenuComponent_ng_container_1_ng_container_1_ngx_toggle_command_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "ngx-toggle-command", 7);
  }
  if (rf & 2) {
    const item_r1 = ɵɵnextContext().$implicit;
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵclassMap(ctx_r1.iconContainerClass);
    ɵɵproperty("toolbarItem", item_r1);
  }
}
function NgxEditorMenuComponent_ng_container_1_ng_container_1_ngx_insert_command_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "ngx-insert-command", 7);
  }
  if (rf & 2) {
    const item_r1 = ɵɵnextContext().$implicit;
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵclassMap(ctx_r1.iconContainerClass);
    ɵɵproperty("toolbarItem", item_r1);
  }
}
function NgxEditorMenuComponent_ng_container_1_ng_container_1_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵelement(1, "ngx-link", 8);
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const item_r1 = ɵɵnextContext().$implicit;
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵadvance();
    ɵɵclassMap(ctx_r1.iconContainerClass);
    ɵɵproperty("options", ctx_r1.getLinkOptions(item_r1));
  }
}
function NgxEditorMenuComponent_ng_container_1_ng_container_1_ngx_image_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "ngx-image");
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵclassMap(ctx_r1.iconContainerClass);
  }
}
function NgxEditorMenuComponent_ng_container_1_ng_container_1_ng_container_5_ngx_dropdown_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "ngx-dropdown", 10);
  }
  if (rf & 2) {
    const dropdownItem_r3 = ctx.$implicit;
    const ctx_r1 = ɵɵnextContext(4);
    ɵɵclassMap(ctx_r1.dropdownContainerClass);
    ɵɵproperty("group", dropdownItem_r3.key)("items", dropdownItem_r3.value);
  }
}
function NgxEditorMenuComponent_ng_container_1_ng_container_1_ng_container_5_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵtemplate(1, NgxEditorMenuComponent_ng_container_1_ng_container_1_ng_container_5_ngx_dropdown_1_Template, 1, 4, "ngx-dropdown", 9);
    ɵɵpipe(2, "keyvalue");
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const item_r1 = ɵɵnextContext().$implicit;
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵadvance();
    ɵɵproperty("ngForOf", ɵɵpipeBind1(2, 2, ctx_r1.getDropdownItems(item_r1)))("ngForTrackBy", ctx_r1.trackByIndex);
  }
}
function NgxEditorMenuComponent_ng_container_1_ng_container_1_ngx_color_picker_6_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "ngx-color-picker", 11);
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵclassMap(ctx_r1.iconContainerClass);
    ɵɵproperty("presets", ctx_r1.presets);
  }
}
function NgxEditorMenuComponent_ng_container_1_ng_container_1_ngx_color_picker_7_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "ngx-color-picker", 12);
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵclassMap(ctx_r1.iconContainerClass);
    ɵɵproperty("presets", ctx_r1.presets);
  }
}
function NgxEditorMenuComponent_ng_container_1_ng_container_1_div_8_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "div");
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵclassMap(ctx_r1.seperatorClass);
  }
}
function NgxEditorMenuComponent_ng_container_1_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵtemplate(1, NgxEditorMenuComponent_ng_container_1_ng_container_1_ngx_toggle_command_1_Template, 1, 3, "ngx-toggle-command", 3)(2, NgxEditorMenuComponent_ng_container_1_ng_container_1_ngx_insert_command_2_Template, 1, 3, "ngx-insert-command", 3)(3, NgxEditorMenuComponent_ng_container_1_ng_container_1_ng_container_3_Template, 2, 3, "ng-container", 2)(4, NgxEditorMenuComponent_ng_container_1_ng_container_1_ngx_image_4_Template, 1, 2, "ngx-image", 4)(5, NgxEditorMenuComponent_ng_container_1_ng_container_1_ng_container_5_Template, 3, 4, "ng-container", 2)(6, NgxEditorMenuComponent_ng_container_1_ng_container_1_ngx_color_picker_6_Template, 1, 3, "ngx-color-picker", 5)(7, NgxEditorMenuComponent_ng_container_1_ng_container_1_ngx_color_picker_7_Template, 1, 3, "ngx-color-picker", 6)(8, NgxEditorMenuComponent_ng_container_1_ng_container_1_div_8_Template, 1, 2, "div", 4);
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const item_r1 = ctx.$implicit;
    const lastItem_r4 = ctx.last;
    const lastToolbarItem_r5 = ɵɵnextContext().last;
    const ctx_r1 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵproperty("ngIf", ctx_r1.toggleCommands.includes(item_r1));
    ɵɵadvance();
    ɵɵproperty("ngIf", ctx_r1.insertCommands.includes(item_r1));
    ɵɵadvance();
    ɵɵproperty("ngIf", ctx_r1.isLinkItem(item_r1));
    ɵɵadvance();
    ɵɵproperty("ngIf", item_r1 === "image");
    ɵɵadvance();
    ɵɵproperty("ngIf", ctx_r1.isDropDown(item_r1));
    ɵɵadvance();
    ɵɵproperty("ngIf", item_r1 === "text_color");
    ɵɵadvance();
    ɵɵproperty("ngIf", item_r1 === "background_color");
    ɵɵadvance();
    ɵɵproperty("ngIf", lastItem_r4 && !lastToolbarItem_r5);
  }
}
function NgxEditorMenuComponent_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵtemplate(1, NgxEditorMenuComponent_ng_container_1_ng_container_1_Template, 9, 8, "ng-container", 1);
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const toolbarItem_r6 = ctx.$implicit;
    const ctx_r1 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵproperty("ngForOf", toolbarItem_r6)("ngForTrackBy", ctx_r1.trackByIndex);
  }
}
function NgxEditorMenuComponent_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵelementContainer(1, 13);
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", ctx_r1.customMenuRef);
  }
}
var _c8 = (a0, a1) => ({
  "NgxBubbleMenu__Icon--Active": a0,
  "NgxEditor--Disabled": a1
});
function BubbleComponent_ng_container_0_ng_container_1_button_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "button", 3);
    ɵɵpipe(1, "async");
    ɵɵlistener("mousedown", function BubbleComponent_ng_container_0_ng_container_1_button_1_Template_button_mousedown_0_listener($event) {
      ɵɵrestoreView(_r1);
      const item_r2 = ɵɵnextContext().$implicit;
      const ctx_r2 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r2.onClick($event, item_r2));
    });
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const item_r2 = ɵɵnextContext().$implicit;
    const ctx_r2 = ɵɵnextContext(2);
    ɵɵproperty("ngClass", ɵɵpureFunction2(5, _c8, ctx_r2.activeItems.includes(item_r2), !ctx_r2.execulableItems.includes(item_r2)))("title", ɵɵpipeBind1(1, 3, ctx_r2.getTitle(item_r2)))("innerHTML", ctx_r2.getIcon(item_r2), ɵɵsanitizeHtml);
  }
}
function BubbleComponent_ng_container_0_ng_container_1_div_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "div", 4);
  }
}
function BubbleComponent_ng_container_0_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵtemplate(1, BubbleComponent_ng_container_0_ng_container_1_button_1_Template, 2, 8, "button", 1)(2, BubbleComponent_ng_container_0_ng_container_1_div_2_Template, 1, 0, "div", 2);
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const item_r2 = ctx.$implicit;
    const lastItem_r4 = ctx.last;
    const lastToolbarItem_r5 = ɵɵnextContext().last;
    const ctx_r2 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵproperty("ngIf", ctx_r2.toggleCommands.includes(item_r2));
    ɵɵadvance();
    ɵɵproperty("ngIf", lastItem_r4 && !lastToolbarItem_r5);
  }
}
function BubbleComponent_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵtemplate(1, BubbleComponent_ng_container_0_ng_container_1_Template, 3, 2, "ng-container", 0);
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const toolbarItem_r6 = ctx.$implicit;
    const ctx_r2 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵproperty("ngForOf", toolbarItem_r6)("ngForTrackBy", ctx_r2.trackByIndex);
  }
}
function NgxEditorFloatingMenuComponent_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵelement(1, "ngx-bubble", 2);
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵproperty("editor", ctx_r0.editor);
  }
}
var isString = (value) => {
  return typeof value === "string";
};
var getTrustedTypes = () => {
  if (typeof window === "undefined") {
    return void 0;
  }
  return window.trustedTypes;
};
var isTrustedHtml = (value) => {
  return getTrustedTypes()?.isHTML(value) ?? false;
};
var isHtml = (value) => {
  return isString(value) || isTrustedHtml(value);
};
var emptyDoc = {
  type: "doc",
  content: [{
    type: "paragraph"
  }]
};
var toHTML = (json, inputSchema) => {
  const schema$1 = inputSchema ?? schema;
  const contentNode = schema$1.nodeFromJSON(json);
  const html = DOMSerializer.fromSchema(schema$1).serializeFragment(contentNode.content);
  const div = document.createElement("div");
  div.appendChild(html);
  return div.innerHTML;
};
var toDoc = (html, inputSchema, options) => {
  const schema$1 = inputSchema ?? schema;
  const el = document.createElement("div");
  el.innerHTML = html;
  return DOMParser.fromSchema(schema$1).parse(el, options).toJSON();
};
var parseContent = (value, schema2, options) => {
  if (!value) {
    return schema2.nodeFromJSON(emptyDoc);
  }
  if (!isHtml(value)) {
    return schema2.nodeFromJSON(value);
  }
  const docJson = toDoc(value, schema2, options);
  return schema2.nodeFromJSON(docJson);
};
var editablePlugin = (editable = true) => {
  return new Plugin({
    key: new PluginKey("editable"),
    state: {
      init() {
        return editable;
      },
      apply(tr, previousVal) {
        return tr.getMeta("UPDATE_EDITABLE") ?? previousVal;
      }
    },
    props: {
      editable(state) {
        return this.getState(state);
      },
      attributes(state) {
        const isEnabled = this.getState(state);
        if (isEnabled) {
          return null;
        }
        return {
          class: "NgxEditor__Content--Disabled"
        };
      }
    }
  });
};
var PLACEHOLDER_CLASSNAME = "NgxEditor__Placeholder";
var placeholderPlugin = (text) => {
  return new Plugin({
    key: new PluginKey("placeholder"),
    state: {
      init() {
        return text ?? "";
      },
      apply(tr, previousVal) {
        const placeholder = tr.getMeta("UPDATE_PLACEHOLDER") ?? previousVal;
        return placeholder;
      }
    },
    props: {
      decorations(state) {
        const {
          doc
        } = state;
        const {
          textContent,
          childCount
        } = doc;
        const placeholder = this.getState(state);
        if (!placeholder || childCount > 1) {
          return DecorationSet.empty;
        }
        const decorations = [];
        const decorate = (node, pos) => {
          if (node.type.isBlock && node.childCount === 0 && textContent.length === 0) {
            const from2 = pos;
            const to = pos + node.nodeSize;
            const placeholderNode = Decoration.node(from2, to, {
              "class": PLACEHOLDER_CLASSNAME,
              "data-placeholder": placeholder,
              "data-align": node.attrs["align"] ?? null
            });
            decorations.push(placeholderNode);
          }
          return false;
        };
        doc.descendants(decorate);
        return DecorationSet.create(doc, decorations);
      }
    }
  });
};
var attributesPlugin = (attributes = {}) => {
  return new Plugin({
    key: new PluginKey("attributes"),
    props: {
      attributes
    }
  });
};
var focusPlugin = (cb) => {
  return new Plugin({
    key: new PluginKey("focus"),
    props: {
      handleDOMEvents: {
        focus: () => {
          cb();
          return false;
        }
      }
    }
  });
};
var blurPlugin = (cb) => {
  return new Plugin({
    key: new PluginKey("blur"),
    props: {
      handleDOMEvents: {
        blur: () => {
          cb();
          return false;
        }
      }
    }
  });
};
var ImageViewComponent = class _ImageViewComponent {
  src;
  alt = "";
  title = "";
  outerWidth = "";
  selected = false;
  view;
  imageResize = new EventEmitter();
  imgEl;
  startResizing(e, direction) {
    e.preventDefault();
    this.resizeImage(e, direction);
  }
  resizeImage(evt, direction) {
    const startX = evt.pageX;
    const startWidth = this.imgEl.nativeElement.clientWidth;
    const isLeftResize = direction === "left";
    const {
      width
    } = window.getComputedStyle(this.view.dom);
    const editorWidth = parseInt(width, 10);
    const onMouseMove = (e) => {
      const currentX = e.pageX;
      const diffInPx = currentX - startX;
      const computedWidth = isLeftResize ? startWidth - diffInPx : startWidth + diffInPx;
      if (computedWidth > editorWidth || computedWidth < 20) {
        return;
      }
      this.outerWidth = `${computedWidth}px`;
    };
    const onMouseUp = (e) => {
      e.preventDefault();
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      this.imageResize.emit();
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }
  static ɵfac = function ImageViewComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ImageViewComponent)();
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _ImageViewComponent,
    selectors: [["ngx-image-view"]],
    viewQuery: function ImageViewComponent_Query(rf, ctx) {
      if (rf & 1) {
        ɵɵviewQuery(_c0, 7);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.imgEl = _t.first);
      }
    },
    inputs: {
      src: "src",
      alt: "alt",
      title: "title",
      outerWidth: "outerWidth",
      selected: "selected",
      view: "view"
    },
    outputs: {
      imageResize: "imageResize"
    },
    decls: 4,
    vars: 9,
    consts: [["imgEl", ""], [1, "NgxEditor__ImageWrapper", 3, "ngClass"], ["class", "NgxEditor__ResizeHandle", 4, "ngIf"], [3, "src", "alt", "title"], [1, "NgxEditor__ResizeHandle"], [1, "NgxEditor__ResizeHandle--TL", 3, "mousedown"], [1, "NgxEditor__ResizeHandle--TR", 3, "mousedown"], [1, "NgxEditor__ResizeHandle--BL", 3, "mousedown"], [1, "NgxEditor__ResizeHandle--BR", 3, "mousedown"]],
    template: function ImageViewComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵelementStart(0, "span", 1);
        ɵɵtemplate(1, ImageViewComponent_span_1_Template, 5, 0, "span", 2);
        ɵɵelement(2, "img", 3, 0);
        ɵɵelementEnd();
      }
      if (rf & 2) {
        ɵɵstyleProp("width", ctx.outerWidth);
        ɵɵproperty("ngClass", ɵɵpureFunction1(7, _c1, ctx.selected));
        ɵɵadvance();
        ɵɵproperty("ngIf", ctx.selected);
        ɵɵadvance();
        ɵɵproperty("src", ctx.src, ɵɵsanitizeUrl)("alt", ctx.alt)("title", ctx.title);
      }
    },
    dependencies: [CommonModule, NgClass, NgIf],
    styles: ["*[_ngcontent-%COMP%], *[_ngcontent-%COMP%]:before, *[_ngcontent-%COMP%]:after{box-sizing:border-box}img[_ngcontent-%COMP%]{width:100%;height:100%}.NgxEditor__ImageWrapper[_ngcontent-%COMP%]{position:relative;display:inline-block;line-height:0;padding:2px}.NgxEditor__ImageWrapper.NgxEditor__Resizer--Active[_ngcontent-%COMP%]{padding:1px;border:1px solid #1a73e8}.NgxEditor__ImageWrapper[_ngcontent-%COMP%]   .NgxEditor__ResizeHandle[_ngcontent-%COMP%]{position:absolute;height:100%;width:100%}.NgxEditor__ImageWrapper[_ngcontent-%COMP%]   .NgxEditor__ResizeHandle[_ngcontent-%COMP%]   .NgxEditor__ResizeHandle--TL[_ngcontent-%COMP%], .NgxEditor__ImageWrapper[_ngcontent-%COMP%]   .NgxEditor__ResizeHandle[_ngcontent-%COMP%]   .NgxEditor__ResizeHandle--BL[_ngcontent-%COMP%], .NgxEditor__ImageWrapper[_ngcontent-%COMP%]   .NgxEditor__ResizeHandle[_ngcontent-%COMP%]   .NgxEditor__ResizeHandle--TR[_ngcontent-%COMP%], .NgxEditor__ImageWrapper[_ngcontent-%COMP%]   .NgxEditor__ResizeHandle[_ngcontent-%COMP%]   .NgxEditor__ResizeHandle--BR[_ngcontent-%COMP%]{position:absolute;width:7px;height:7px;background-color:#1a73e8;border:1px solid white}.NgxEditor__ImageWrapper[_ngcontent-%COMP%]   .NgxEditor__ResizeHandle[_ngcontent-%COMP%]   .NgxEditor__ResizeHandle--BR[_ngcontent-%COMP%]{bottom:-5px;right:-5px;cursor:se-resize}.NgxEditor__ImageWrapper[_ngcontent-%COMP%]   .NgxEditor__ResizeHandle[_ngcontent-%COMP%]   .NgxEditor__ResizeHandle--TR[_ngcontent-%COMP%]{top:-5px;right:-5px;cursor:ne-resize}.NgxEditor__ImageWrapper[_ngcontent-%COMP%]   .NgxEditor__ResizeHandle[_ngcontent-%COMP%]   .NgxEditor__ResizeHandle--TL[_ngcontent-%COMP%]{top:-5px;left:-5px;cursor:nw-resize}.NgxEditor__ImageWrapper[_ngcontent-%COMP%]   .NgxEditor__ResizeHandle[_ngcontent-%COMP%]   .NgxEditor__ResizeHandle--BL[_ngcontent-%COMP%]{bottom:-5px;left:-5px;cursor:sw-resize}"]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ImageViewComponent, [{
    type: Component,
    args: [{
      selector: "ngx-image-view",
      imports: [CommonModule],
      template: `<span class="NgxEditor__ImageWrapper" [ngClass]="{ 'NgxEditor__Resizer--Active': selected }" [style.width]="outerWidth">
  <span class="NgxEditor__ResizeHandle" *ngIf="selected">
    <span class="NgxEditor__ResizeHandle--TL" (mousedown)="startResizing($event, 'left')"></span>
    <span class="NgxEditor__ResizeHandle--TR" (mousedown)="startResizing($event, 'right')"></span>
    <span class="NgxEditor__ResizeHandle--BL" (mousedown)="startResizing($event, 'left')"></span>
    <span class="NgxEditor__ResizeHandle--BR" (mousedown)="startResizing($event, 'right')"></span>
  </span>
  <img [src]="src" [alt]="alt" [title]="title" #imgEl />
</span>
`,
      styles: ["*,*:before,*:after{box-sizing:border-box}img{width:100%;height:100%}.NgxEditor__ImageWrapper{position:relative;display:inline-block;line-height:0;padding:2px}.NgxEditor__ImageWrapper.NgxEditor__Resizer--Active{padding:1px;border:1px solid #1a73e8}.NgxEditor__ImageWrapper .NgxEditor__ResizeHandle{position:absolute;height:100%;width:100%}.NgxEditor__ImageWrapper .NgxEditor__ResizeHandle .NgxEditor__ResizeHandle--TL,.NgxEditor__ImageWrapper .NgxEditor__ResizeHandle .NgxEditor__ResizeHandle--BL,.NgxEditor__ImageWrapper .NgxEditor__ResizeHandle .NgxEditor__ResizeHandle--TR,.NgxEditor__ImageWrapper .NgxEditor__ResizeHandle .NgxEditor__ResizeHandle--BR{position:absolute;width:7px;height:7px;background-color:#1a73e8;border:1px solid white}.NgxEditor__ImageWrapper .NgxEditor__ResizeHandle .NgxEditor__ResizeHandle--BR{bottom:-5px;right:-5px;cursor:se-resize}.NgxEditor__ImageWrapper .NgxEditor__ResizeHandle .NgxEditor__ResizeHandle--TR{top:-5px;right:-5px;cursor:ne-resize}.NgxEditor__ImageWrapper .NgxEditor__ResizeHandle .NgxEditor__ResizeHandle--TL{top:-5px;left:-5px;cursor:nw-resize}.NgxEditor__ImageWrapper .NgxEditor__ResizeHandle .NgxEditor__ResizeHandle--BL{bottom:-5px;left:-5px;cursor:sw-resize}\n"]
    }]
  }], null, {
    src: [{
      type: Input
    }],
    alt: [{
      type: Input
    }],
    title: [{
      type: Input
    }],
    outerWidth: [{
      type: Input
    }],
    selected: [{
      type: Input
    }],
    view: [{
      type: Input
    }],
    imageResize: [{
      type: Output
    }],
    imgEl: [{
      type: ViewChild,
      args: ["imgEl", {
        static: true
      }]
    }]
  });
})();
var ImageRezieView = class {
  dom;
  view;
  getPos;
  applicationRef;
  imageComponentRef;
  resizeSubscription;
  node;
  updating = false;
  constructor(node, view, getPos, injector) {
    this.applicationRef = injector.get(ApplicationRef);
    this.imageComponentRef = createComponent(ImageViewComponent, {
      environmentInjector: this.applicationRef.injector
    });
    this.applicationRef.attachView(this.imageComponentRef.hostView);
    this.setNodeAttributes(node.attrs);
    this.imageComponentRef.instance.view = view;
    this.dom = this.imageComponentRef.location.nativeElement;
    this.view = view;
    this.node = node;
    this.getPos = getPos;
    this.resizeSubscription = this.imageComponentRef.instance.imageResize.subscribe(() => {
      this.handleResize();
    });
  }
  computeChanges(prevAttrs, newAttrs) {
    return JSON.stringify(prevAttrs) === JSON.stringify(newAttrs);
  }
  setNodeAttributes(attrs) {
    this.imageComponentRef.instance.src = attrs["src"];
    this.imageComponentRef.instance.alt = attrs["alt"];
    this.imageComponentRef.instance.title = attrs["title"];
    this.imageComponentRef.instance.outerWidth = attrs["width"];
  }
  handleResize = () => {
    if (this.updating) {
      return;
    }
    const {
      state,
      dispatch
    } = this.view;
    const {
      tr
    } = state;
    const transaction = tr.setNodeMarkup(this.getPos(), void 0, __spreadProps(__spreadValues({}, this.node.attrs), {
      width: this.imageComponentRef.instance.outerWidth
    }));
    const resolvedPos = transaction.doc.resolve(this.getPos());
    const newSelection = new NodeSelection(resolvedPos);
    transaction.setSelection(newSelection);
    dispatch(transaction);
  };
  update(node) {
    if (node.type !== this.node.type) {
      return false;
    }
    this.node = node;
    const changed = this.computeChanges(this.node.attrs, node.attrs);
    if (changed) {
      this.updating = true;
      this.setNodeAttributes(node.attrs);
      this.updating = false;
    }
    return true;
  }
  ignoreMutation() {
    return true;
  }
  selectNode() {
    this.imageComponentRef.instance.selected = true;
  }
  deselectNode() {
    this.imageComponentRef.instance.selected = false;
  }
  destroy() {
    this.resizeSubscription.unsubscribe();
    this.applicationRef.detachView(this.imageComponentRef.hostView);
  }
};
var imageResizePlugin = (injector) => {
  return new Plugin({
    key: new PluginKey("image-resize"),
    props: {
      nodeViews: {
        image: (node, view, getPos) => {
          return new ImageRezieView(node, view, getPos, injector);
        }
      }
    }
  });
};
var HTTP_LINK_REGEX = /(?:https?:\/\/)?[\w-]+(?:\.[\w-]+)+\.?(?:\d+)?(?:\/\S*)?$/;
var linkify = (fragment) => {
  const linkified = [];
  fragment.forEach((child) => {
    if (child.isText) {
      const text = child.text;
      let pos = 0;
      const match = HTTP_LINK_REGEX.exec(text);
      if (match) {
        const start = match.index;
        const end = start + match[0].length;
        const {
          link: link2
        } = child.type.schema.marks;
        if (start > 0) {
          linkified.push(child.cut(pos, start));
        }
        const urlText = text.slice(start, end);
        linkified.push(child.cut(start, end).mark(link2.create({
          href: urlText
        }).addToSet(child.marks)));
        pos = end;
      }
      if (pos < text.length) {
        linkified.push(child.cut(pos));
      }
    } else {
      linkified.push(child.copy(linkify(child.content)));
    }
  });
  return Fragment.fromArray(linkified);
};
var linkifyPlugin = () => {
  return new Plugin({
    key: new PluginKey("linkify"),
    props: {
      transformPasted: (slice2) => {
        return new Slice(linkify(slice2.content), slice2.openStart, slice2.openEnd);
      }
    }
  });
};
var NgxEditorComponent = class _NgxEditorComponent {
  renderer;
  injector;
  elementRef;
  constructor(renderer, injector, elementRef) {
    this.renderer = renderer;
    this.injector = injector;
    this.elementRef = elementRef;
  }
  ngxEditor;
  editor;
  outputFormat;
  placeholder = "Type Here...";
  focusOut = new EventEmitter();
  focusIn = new EventEmitter();
  unsubscribe = new Subject();
  onChange = () => {
  };
  onTouched = () => {
  };
  writeValue(value) {
    if (!this.outputFormat && isHtml(value)) {
      this.outputFormat = "html";
    }
    this.editor.setContent(value ?? emptyDoc);
  }
  registerOnChange(fn) {
    this.onChange = fn;
  }
  registerOnTouched(fn) {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled) {
    this.setMeta("UPDATE_EDITABLE", !isDisabled);
    this.renderer.setProperty(this.elementRef.nativeElement, "disabled", isDisabled);
  }
  handleChange(jsonDoc) {
    if (this.outputFormat === "html") {
      const html = toHTML(jsonDoc, this.editor.schema);
      this.onChange(html);
      return;
    }
    this.onChange(jsonDoc);
  }
  setMeta(key, value) {
    const {
      dispatch,
      state: {
        tr
      }
    } = this.editor.view;
    dispatch(tr.setMeta(key, value));
  }
  setPlaceholder(placeholder) {
    this.setMeta("UPDATE_PLACEHOLDER", placeholder);
  }
  registerPlugins() {
    this.editor.registerPlugin(editablePlugin());
    this.editor.registerPlugin(placeholderPlugin(this.placeholder));
    this.editor.registerPlugin(attributesPlugin({
      class: "NgxEditor__Content"
    }));
    this.editor.registerPlugin(focusPlugin(() => {
      this.focusIn.emit();
    }));
    this.editor.registerPlugin(blurPlugin(() => {
      this.focusOut.emit();
      this.onTouched();
    }));
    if (this.editor.features.resizeImage) {
      this.editor.registerPlugin(imageResizePlugin(this.injector));
    }
    if (this.editor.features.linkOnPaste) {
      this.editor.registerPlugin(linkifyPlugin());
    }
  }
  ngOnInit() {
    if (!this.editor) {
      throw new NgxEditorError("Required editor instance for initializing editor component");
    }
    this.registerPlugins();
    this.renderer.appendChild(this.ngxEditor.nativeElement, this.editor.view.dom);
    this.editor.valueChanges.pipe(takeUntil(this.unsubscribe)).subscribe((jsonDoc) => {
      this.handleChange(jsonDoc);
    });
  }
  ngOnChanges(changes) {
    if (changes["placeholder"] && !changes["placeholder"].isFirstChange()) {
      this.setPlaceholder(changes["placeholder"].currentValue);
    }
  }
  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
  static ɵfac = function NgxEditorComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NgxEditorComponent)(ɵɵdirectiveInject(Renderer2), ɵɵdirectiveInject(Injector), ɵɵdirectiveInject(ElementRef));
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _NgxEditorComponent,
    selectors: [["ngx-editor"]],
    viewQuery: function NgxEditorComponent_Query(rf, ctx) {
      if (rf & 1) {
        ɵɵviewQuery(_c2, 7);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.ngxEditor = _t.first);
      }
    },
    inputs: {
      editor: "editor",
      outputFormat: "outputFormat",
      placeholder: "placeholder"
    },
    outputs: {
      focusOut: "focusOut",
      focusIn: "focusIn"
    },
    features: [ɵɵProvidersFeature([{
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => _NgxEditorComponent),
      multi: true
    }]), ɵɵNgOnChangesFeature],
    ngContentSelectors: _c3,
    decls: 3,
    vars: 0,
    consts: [["ngxEditor", ""], [1, "NgxEditor"]],
    template: function NgxEditorComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵprojectionDef();
        ɵɵdomElementStart(0, "div", 1, 0);
        ɵɵprojection(2);
        ɵɵdomElementEnd();
      }
    },
    styles: [':root{--ngx-editor-border-radius: 4px;--ngx-editor-background-color: #fff;--ngx-editor-text-color: #000;--ngx-editor-placeholder-color: #6c757d;--ngx-editor-border-color: rgba(0, 0, 0, .2);--ngx-editor-wrapper-border-color: rgba(0, 0, 0, .2);--ngx-editor-menubar-bg-color: #fff;--ngx-editor-menubar-padding: 3px;--ngx-editor-menubar-height: 30px;--ngx-editor-blockquote-color: #ddd;--ngx-editor-blockquote-border-width: 3px;--ngx-editor-icon-size: 30px;--ngx-editor-popup-bg-color: #fff;--ngx-editor-popup-border-radius: 4px;--ngx-editor-popup-shadow: rgba(60, 64, 67, .15) 0px 2px 6px 2px;--ngx-editor-menu-item-border-radius: 2px;--ngx-editor-menu-item-active-color: #1a73e8;--ngx-editor-menu-item-hover-bg-color: #f1f1f1;--ngx-editor-menu-item-active-bg-color: #e8f0fe;--ngx-editor-seperator-color: #ccc;--ngx-editor-bubble-bg-color: #000;--ngx-editor-bubble-text-color: #fff;--ngx-editor-bubble-item-hover-color: #636262;--ngx-editor-bubble-seperator-color: #fff;--ngx-editor-focus-ring-color: #5e9ed6;--ngx-editor-error-color: red;--ngx-editor-click-pointer: default}.NgxEditor{background:var(--ngx-editor-background-color);color:var(--ngx-editor-text-color);background-clip:padding-box;border-radius:var(--ngx-editor-border-radius);border:1px solid var(--ngx-editor-border-color);position:relative}.NgxEditor--Disabled{opacity:.5!important;pointer-events:none!important}.NgxEditor__Placeholder:before{color:var(--ngx-editor-placeholder-color);opacity:1;-webkit-user-select:none;user-select:none;position:absolute;cursor:text;content:attr(data-placeholder)}.NgxEditor__Placeholder[data-align=right]:before{position:relative}.NgxEditor__Content{padding:8px;white-space:pre-wrap;outline:none;font-variant-ligatures:none;font-feature-settings:"liga" 0}.NgxEditor__Content p{margin:0 0 10px}.NgxEditor__Content blockquote{padding-left:16px;border-left:var(--ngx-editor-blockquote-border-width) solid var(--ngx-editor-blockquote-color);margin-left:0;margin-right:0}.NgxEditor__Content--Disabled{-webkit-user-select:none;user-select:none;pointer-events:none}.NgxEditor__Wrapper{border:1px solid var(--ngx-editor-wrapper-border-color);border-radius:var(--ngx-editor-border-radius)}.NgxEditor__Wrapper .NgxEditor__MenuBar{border-top-left-radius:var(--ngx-editor-border-radius);border-top-right-radius:var(--ngx-editor-border-radius);border-bottom:1px solid var(--ngx-editor-border-color)}.NgxEditor__Wrapper .NgxEditor{border-top-left-radius:0;border-top-right-radius:0;border:none}.NgxEditor__MenuBar{display:flex;flex-wrap:wrap;padding:var(--ngx-editor-menubar-padding);background-color:var(--ngx-editor-menubar-bg-color);gap:.25rem .1rem}.NgxEditor__MenuBar button:not(:disabled),.NgxEditor__MenuBar [role=button]:not(:disabled){cursor:var(--ngx-editor-click-pointer, default)}.NgxEditor__MenuItem{display:flex;align-items:center;justify-content:center;position:relative;flex-shrink:0}.NgxEditor__MenuItem.NgxEditor__MenuItem--IconContainer{display:flex;align-items:center;justify-content:center}.NgxEditor__MenuItem .NgxEditor__MenuItem--Icon{all:unset;appearance:none;height:var(--ngx-editor-icon-size);width:var(--ngx-editor-icon-size);transition:.2s ease-in-out;display:inline-flex;align-items:center;justify-content:center;border-radius:var(--ngx-editor-menu-item-border-radius)}.NgxEditor__MenuItem .NgxEditor__MenuItem--Icon+.NgxEditor__MenuItem--Icon{margin-left:2px}.NgxEditor__MenuItem .NgxEditor__MenuItem--Icon:focus-visible{outline:1px solid var(--ngx-editor-focus-ring-color)}.NgxEditor__MenuItem .NgxEditor__MenuItem--Icon:hover{background-color:var(--ngx-editor-menu-item-hover-bg-color)}.NgxEditor__MenuItem.NgxEditor__MenuItem--Text{padding:0 5px}.NgxEditor__MenuItem.NgxEditor__MenuItem--Active,.NgxEditor__MenuItem .NgxEditor__MenuItem--Active{background-color:var(--ngx-editor-menu-item-active-bg-color);color:var(--ngx-editor-menu-item-active-color)}.NgxEditor__Dropdown{min-width:64px;position:relative;display:flex;align-items:center;flex-shrink:0}.NgxEditor__Dropdown:hover{background-color:var(--ngx-editor-menu-item-hover-bg-color)}.NgxEditor__Dropdown .NgxEditor__Dropdown--Text{all:unset;appearance:none;display:flex;align-items:center;justify-content:center;padding:0 5px;height:100%;width:100%}.NgxEditor__Dropdown .NgxEditor__Dropdown--Text:focus-visible{outline:1px solid var(--ngx-editor-focus-ring-color)}.NgxEditor__Dropdown .NgxEditor__Dropdown--Text:after{display:inline-block;content:"";margin-left:24px;vertical-align:4px;border-top:4px solid;border-right:4px solid transparent;border-bottom:0;border-left:4px solid transparent}.NgxEditor__Dropdown .NgxEditor__Dropdown--DropdownMenu{position:absolute;left:0;box-shadow:var(--ngx-editor-popup-shadow);border-radius:var(--ngx-editor-popup-border-radius);background-color:var(--ngx-editor-popup-bg-color);z-index:10;width:100%;top:calc(var(--ngx-editor-menubar-height) + 2px);display:flex;flex-direction:column}.NgxEditor__Dropdown .NgxEditor__Dropdown--Item{all:unset;appearance:none;padding:8px;white-space:nowrap;color:inherit}.NgxEditor__Dropdown .NgxEditor__Dropdown--Item:focus-visible{outline:1px solid var(--ngx-editor-focus-ring-color)}.NgxEditor__Dropdown .NgxEditor__Dropdown--Item:hover{background-color:var(--ngx-editor-menu-item-hover-bg-color)}.NgxEditor__Dropdown .NgxEditor__Dropdown--Selected,.NgxEditor__Dropdown .NgxEditor__Dropdown--Open{color:var(--ngx-editor-menu-item-active-color);background-color:var(--ngx-editor-menu-item-active-bg-color)}.NgxEditor__Dropdown .NgxEditor__Dropdown--Active{background-color:var(--ngx-editor-menu-item-active-bg-color)}.NgxEditor__Dropdown .NgxEditor__Dropdown--Active:hover{background-color:var(--ngx-editor-menu-item-hover-bg-color)}.NgxEditor__MenuBar--Reverse .NgxEditor__Dropdown--DropdownMenu{top:unset;bottom:calc(var(--ngx-editor-menubar-height) + 2px)}.NgxEditor__MenuBar--Reverse .NgxEditor__Dropdown--Text:after{transform:rotate(180deg)}.NgxEditor__MenuBar--Reverse .NgxEditor__Popup{top:unset;bottom:calc(var(--ngx-editor-menubar-height) + 2px)}.NgxEditor__Popup{position:absolute;top:calc(var(--ngx-editor-menubar-height) + 2px);box-shadow:var(--ngx-editor-popup-shadow);border-radius:var(--ngx-editor-popup-border-radius);background-color:var(--ngx-editor-popup-bg-color);z-index:10;min-width:192px;padding:8px}.NgxEditor__Popup .NgxEditor__Popup--FormGroup{margin-bottom:8px}.NgxEditor__Popup .NgxEditor__Popup--FormGroup label{margin-bottom:3px}.NgxEditor__Popup .NgxEditor__Popup--FormGroup input[type=text],.NgxEditor__Popup .NgxEditor__Popup--FormGroup input[type=url]{padding:2px 4px}.NgxEditor__Popup .NgxEditor__Popup--Col{display:flex;flex-direction:column;position:relative}.NgxEditor__Popup .NgxEditor__Popup--Label{font-size:85%}.NgxEditor__Seperator{border-left:1px solid var(--ngx-editor-seperator-color);margin:0 5px}.NgxEditor__HelpText{font-size:80%}.NgxEditor__HelpText.NgxEditor__HelpText--Error{color:var(--ngx-editor-error-color)}\n'],
    encapsulation: 2
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgxEditorComponent, [{
    type: Component,
    args: [{
      selector: "ngx-editor",
      providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => NgxEditorComponent),
        multi: true
      }],
      encapsulation: ViewEncapsulation.None,
      template: '<div class="NgxEditor" #ngxEditor>\n  <ng-content></ng-content>\n</div>\n',
      styles: [':root{--ngx-editor-border-radius: 4px;--ngx-editor-background-color: #fff;--ngx-editor-text-color: #000;--ngx-editor-placeholder-color: #6c757d;--ngx-editor-border-color: rgba(0, 0, 0, .2);--ngx-editor-wrapper-border-color: rgba(0, 0, 0, .2);--ngx-editor-menubar-bg-color: #fff;--ngx-editor-menubar-padding: 3px;--ngx-editor-menubar-height: 30px;--ngx-editor-blockquote-color: #ddd;--ngx-editor-blockquote-border-width: 3px;--ngx-editor-icon-size: 30px;--ngx-editor-popup-bg-color: #fff;--ngx-editor-popup-border-radius: 4px;--ngx-editor-popup-shadow: rgba(60, 64, 67, .15) 0px 2px 6px 2px;--ngx-editor-menu-item-border-radius: 2px;--ngx-editor-menu-item-active-color: #1a73e8;--ngx-editor-menu-item-hover-bg-color: #f1f1f1;--ngx-editor-menu-item-active-bg-color: #e8f0fe;--ngx-editor-seperator-color: #ccc;--ngx-editor-bubble-bg-color: #000;--ngx-editor-bubble-text-color: #fff;--ngx-editor-bubble-item-hover-color: #636262;--ngx-editor-bubble-seperator-color: #fff;--ngx-editor-focus-ring-color: #5e9ed6;--ngx-editor-error-color: red;--ngx-editor-click-pointer: default}.NgxEditor{background:var(--ngx-editor-background-color);color:var(--ngx-editor-text-color);background-clip:padding-box;border-radius:var(--ngx-editor-border-radius);border:1px solid var(--ngx-editor-border-color);position:relative}.NgxEditor--Disabled{opacity:.5!important;pointer-events:none!important}.NgxEditor__Placeholder:before{color:var(--ngx-editor-placeholder-color);opacity:1;-webkit-user-select:none;user-select:none;position:absolute;cursor:text;content:attr(data-placeholder)}.NgxEditor__Placeholder[data-align=right]:before{position:relative}.NgxEditor__Content{padding:8px;white-space:pre-wrap;outline:none;font-variant-ligatures:none;font-feature-settings:"liga" 0}.NgxEditor__Content p{margin:0 0 10px}.NgxEditor__Content blockquote{padding-left:16px;border-left:var(--ngx-editor-blockquote-border-width) solid var(--ngx-editor-blockquote-color);margin-left:0;margin-right:0}.NgxEditor__Content--Disabled{-webkit-user-select:none;user-select:none;pointer-events:none}.NgxEditor__Wrapper{border:1px solid var(--ngx-editor-wrapper-border-color);border-radius:var(--ngx-editor-border-radius)}.NgxEditor__Wrapper .NgxEditor__MenuBar{border-top-left-radius:var(--ngx-editor-border-radius);border-top-right-radius:var(--ngx-editor-border-radius);border-bottom:1px solid var(--ngx-editor-border-color)}.NgxEditor__Wrapper .NgxEditor{border-top-left-radius:0;border-top-right-radius:0;border:none}.NgxEditor__MenuBar{display:flex;flex-wrap:wrap;padding:var(--ngx-editor-menubar-padding);background-color:var(--ngx-editor-menubar-bg-color);gap:.25rem .1rem}.NgxEditor__MenuBar button:not(:disabled),.NgxEditor__MenuBar [role=button]:not(:disabled){cursor:var(--ngx-editor-click-pointer, default)}.NgxEditor__MenuItem{display:flex;align-items:center;justify-content:center;position:relative;flex-shrink:0}.NgxEditor__MenuItem.NgxEditor__MenuItem--IconContainer{display:flex;align-items:center;justify-content:center}.NgxEditor__MenuItem .NgxEditor__MenuItem--Icon{all:unset;appearance:none;height:var(--ngx-editor-icon-size);width:var(--ngx-editor-icon-size);transition:.2s ease-in-out;display:inline-flex;align-items:center;justify-content:center;border-radius:var(--ngx-editor-menu-item-border-radius)}.NgxEditor__MenuItem .NgxEditor__MenuItem--Icon+.NgxEditor__MenuItem--Icon{margin-left:2px}.NgxEditor__MenuItem .NgxEditor__MenuItem--Icon:focus-visible{outline:1px solid var(--ngx-editor-focus-ring-color)}.NgxEditor__MenuItem .NgxEditor__MenuItem--Icon:hover{background-color:var(--ngx-editor-menu-item-hover-bg-color)}.NgxEditor__MenuItem.NgxEditor__MenuItem--Text{padding:0 5px}.NgxEditor__MenuItem.NgxEditor__MenuItem--Active,.NgxEditor__MenuItem .NgxEditor__MenuItem--Active{background-color:var(--ngx-editor-menu-item-active-bg-color);color:var(--ngx-editor-menu-item-active-color)}.NgxEditor__Dropdown{min-width:64px;position:relative;display:flex;align-items:center;flex-shrink:0}.NgxEditor__Dropdown:hover{background-color:var(--ngx-editor-menu-item-hover-bg-color)}.NgxEditor__Dropdown .NgxEditor__Dropdown--Text{all:unset;appearance:none;display:flex;align-items:center;justify-content:center;padding:0 5px;height:100%;width:100%}.NgxEditor__Dropdown .NgxEditor__Dropdown--Text:focus-visible{outline:1px solid var(--ngx-editor-focus-ring-color)}.NgxEditor__Dropdown .NgxEditor__Dropdown--Text:after{display:inline-block;content:"";margin-left:24px;vertical-align:4px;border-top:4px solid;border-right:4px solid transparent;border-bottom:0;border-left:4px solid transparent}.NgxEditor__Dropdown .NgxEditor__Dropdown--DropdownMenu{position:absolute;left:0;box-shadow:var(--ngx-editor-popup-shadow);border-radius:var(--ngx-editor-popup-border-radius);background-color:var(--ngx-editor-popup-bg-color);z-index:10;width:100%;top:calc(var(--ngx-editor-menubar-height) + 2px);display:flex;flex-direction:column}.NgxEditor__Dropdown .NgxEditor__Dropdown--Item{all:unset;appearance:none;padding:8px;white-space:nowrap;color:inherit}.NgxEditor__Dropdown .NgxEditor__Dropdown--Item:focus-visible{outline:1px solid var(--ngx-editor-focus-ring-color)}.NgxEditor__Dropdown .NgxEditor__Dropdown--Item:hover{background-color:var(--ngx-editor-menu-item-hover-bg-color)}.NgxEditor__Dropdown .NgxEditor__Dropdown--Selected,.NgxEditor__Dropdown .NgxEditor__Dropdown--Open{color:var(--ngx-editor-menu-item-active-color);background-color:var(--ngx-editor-menu-item-active-bg-color)}.NgxEditor__Dropdown .NgxEditor__Dropdown--Active{background-color:var(--ngx-editor-menu-item-active-bg-color)}.NgxEditor__Dropdown .NgxEditor__Dropdown--Active:hover{background-color:var(--ngx-editor-menu-item-hover-bg-color)}.NgxEditor__MenuBar--Reverse .NgxEditor__Dropdown--DropdownMenu{top:unset;bottom:calc(var(--ngx-editor-menubar-height) + 2px)}.NgxEditor__MenuBar--Reverse .NgxEditor__Dropdown--Text:after{transform:rotate(180deg)}.NgxEditor__MenuBar--Reverse .NgxEditor__Popup{top:unset;bottom:calc(var(--ngx-editor-menubar-height) + 2px)}.NgxEditor__Popup{position:absolute;top:calc(var(--ngx-editor-menubar-height) + 2px);box-shadow:var(--ngx-editor-popup-shadow);border-radius:var(--ngx-editor-popup-border-radius);background-color:var(--ngx-editor-popup-bg-color);z-index:10;min-width:192px;padding:8px}.NgxEditor__Popup .NgxEditor__Popup--FormGroup{margin-bottom:8px}.NgxEditor__Popup .NgxEditor__Popup--FormGroup label{margin-bottom:3px}.NgxEditor__Popup .NgxEditor__Popup--FormGroup input[type=text],.NgxEditor__Popup .NgxEditor__Popup--FormGroup input[type=url]{padding:2px 4px}.NgxEditor__Popup .NgxEditor__Popup--Col{display:flex;flex-direction:column;position:relative}.NgxEditor__Popup .NgxEditor__Popup--Label{font-size:85%}.NgxEditor__Seperator{border-left:1px solid var(--ngx-editor-seperator-color);margin:0 5px}.NgxEditor__HelpText{font-size:80%}.NgxEditor__HelpText.NgxEditor__HelpText--Error{color:var(--ngx-editor-error-color)}\n']
    }]
  }], () => [{
    type: Renderer2
  }, {
    type: Injector
  }, {
    type: ElementRef
  }], {
    ngxEditor: [{
      type: ViewChild,
      args: ["ngxEditor", {
        static: true
      }]
    }],
    editor: [{
      type: Input
    }],
    outputFormat: [{
      type: Input
    }],
    placeholder: [{
      type: Input
    }],
    focusOut: [{
      type: Output
    }],
    focusIn: [{
      type: Output
    }]
  });
})();
var SanitizeHtmlPipe = class _SanitizeHtmlPipe {
  sanitizer;
  constructor(sanitizer) {
    this.sanitizer = sanitizer;
  }
  transform(value) {
    if (isTrustedHtml(value)) {
      return value;
    }
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }
  static ɵfac = function SanitizeHtmlPipe_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _SanitizeHtmlPipe)(ɵɵdirectiveInject(DomSanitizer, 16));
  };
  static ɵpipe = ɵɵdefinePipe({
    name: "sanitizeHtml",
    type: _SanitizeHtmlPipe,
    pure: true
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(SanitizeHtmlPipe, [{
    type: Pipe,
    args: [{
      name: "sanitizeHtml"
    }]
  }], () => [{
    type: DomSanitizer
  }], null);
})();
var Mark = class {
  name;
  constructor(name) {
    this.name = name;
  }
  apply() {
    return (state, dispatch) => {
      const {
        schema: schema2
      } = state;
      const type = schema2.marks[this.name];
      if (!type) {
        return false;
      }
      return applyMark(type)(state, dispatch);
    };
  }
  toggle() {
    return (state, dispatch) => {
      const {
        schema: schema2
      } = state;
      const type = schema2.marks[this.name];
      if (!type) {
        return false;
      }
      return toggleMark(type)(state, dispatch);
    };
  }
  isActive(state) {
    const {
      schema: schema2
    } = state;
    const type = schema2.marks[this.name];
    if (!type) {
      return false;
    }
    return isMarkActive(state, type);
  }
  canExecute(state) {
    return this.toggle()(state);
  }
};
var Blockqote = class {
  toggle() {
    return (state, dispatch) => {
      const {
        schema: schema2
      } = state;
      const type = schema2.nodes["blockquote"];
      if (!type) {
        return false;
      }
      if (this.isActive(state)) {
        return lift(state, dispatch);
      }
      return wrapIn(type)(state, dispatch);
    };
  }
  isActive(state) {
    const {
      schema: schema2
    } = state;
    const type = schema2.nodes["blockquote"];
    if (!type) {
      return false;
    }
    return isNodeActive(state, type);
  }
  canExecute(state) {
    return this.toggle()(state);
  }
};
var HorizontalRule = class {
  insert() {
    return (state, dispatch) => {
      const {
        schema: schema2,
        tr
      } = state;
      const type = schema2.nodes["horizontal_rule"];
      if (!type) {
        return false;
      }
      dispatch(tr.replaceSelectionWith(type.create()).scrollIntoView());
      return true;
    };
  }
  canExecute(state) {
    return canInsert(state, state.schema.nodes["horizontal_rule"]);
  }
};
var ListItem = class {
  isBulletList = false;
  constructor(isBulletList = false) {
    this.isBulletList = isBulletList;
  }
  getType(schema2) {
    return this.isBulletList ? schema2.nodes["bullet_list"] : schema2.nodes["ordered_list"];
  }
  toggle() {
    return (state, dispatch) => {
      const {
        schema: schema2
      } = state;
      const type = this.getType(schema2);
      if (!type) {
        return false;
      }
      if (this.isActive(state)) {
        return liftListItem(schema2.nodes["list_item"])(state, dispatch);
      }
      return wrapInList(type)(state, dispatch);
    };
  }
  isActive(state) {
    const {
      schema: schema2
    } = state;
    const type = this.getType(schema2);
    if (!type) {
      return false;
    }
    return isNodeActive(state, type);
  }
  canExecute(state) {
    return this.toggle()(state);
  }
};
var Heading = class {
  level;
  constructor(level) {
    this.level = level;
  }
  apply() {
    return (state, dispatch) => {
      const {
        schema: schema2
      } = state;
      const type = schema2.nodes["heading"];
      if (!type) {
        return false;
      }
      return setBlockType(type)(state, dispatch);
    };
  }
  toggle() {
    return (state, dispatch) => {
      const {
        schema: schema2,
        selection,
        doc
      } = state;
      const type = schema2.nodes["heading"];
      if (!type) {
        return false;
      }
      const nodePos = selection.$from.before(1);
      const node = doc.nodeAt(nodePos);
      const attrs = node?.attrs ?? {};
      if (this.isActive(state)) {
        return setBlockType(schema2.nodes["paragraph"], attrs)(state, dispatch);
      }
      return setBlockType(type, __spreadProps(__spreadValues({}, attrs), {
        level: this.level
      }))(state, dispatch);
    };
  }
  isActive(state) {
    const {
      schema: schema2
    } = state;
    const nodesInSelection = getSelectionNodes(state);
    const type = schema2.nodes["heading"];
    if (!type) {
      return false;
    }
    const supportedNodes = [type, schema2.nodes["text"], schema2.nodes["blockquote"]];
    const nodes2 = nodesInSelection.filter((node) => {
      return supportedNodes.includes(node.type);
    });
    const acitveNode = nodes2.find((node) => {
      return node.attrs["level"] === this.level;
    });
    return Boolean(acitveNode);
  }
  canExecute(state) {
    return this.toggle()(state);
  }
};
var TextAlign = class {
  align;
  constructor(align) {
    this.align = align;
  }
  toggle() {
    return (state, dispatch) => {
      const {
        doc,
        selection,
        tr,
        schema: schema2
      } = state;
      const {
        from: from2,
        to
      } = selection;
      let applicable = false;
      doc.nodesBetween(from2, to, (node, pos) => {
        const nodeType = node.type;
        if ([schema2.nodes["paragraph"], schema2.nodes["heading"]].includes(nodeType)) {
          applicable = true;
          const align = node.attrs["align"] === this.align ? null : this.align;
          tr.setNodeMarkup(pos, nodeType, __spreadProps(__spreadValues({}, node.attrs), {
            align
          }));
        }
        return true;
      });
      if (!applicable) {
        return false;
      }
      if (tr.docChanged) {
        dispatch?.(tr);
      }
      return true;
    };
  }
  isActive(state) {
    const nodes2 = getSelectionNodes(state);
    const active = nodes2.find((node) => {
      return node.attrs["align"] === this.align;
    });
    return Boolean(active);
  }
  canExecute(state) {
    return this.toggle()(state);
  }
};
var defaultOptions = {
  strict: true
};
var Link$1 = class Link {
  update(attrs) {
    return (state, dispatch) => {
      const {
        schema: schema2,
        selection
      } = state;
      const type = schema2.marks["link"];
      if (!type) {
        return false;
      }
      if (selection.empty) {
        return false;
      }
      return toggleMark(type, attrs)(state, dispatch);
    };
  }
  insert(text, attrs) {
    return (state, dispatch) => {
      const {
        schema: schema2,
        tr
      } = state;
      const type = schema2.marks["link"];
      if (!type) {
        return false;
      }
      const linkAttrs = {
        href: attrs.href,
        title: attrs.title ?? text,
        target: attrs.target ?? "_blank"
      };
      const node = schema2.text(text, [schema2.marks["link"].create(linkAttrs)]);
      tr.replaceSelectionWith(node, false).scrollIntoView();
      if (tr.docChanged) {
        dispatch?.(tr);
        return true;
      }
      return false;
    };
  }
  isActive(state, options = defaultOptions) {
    if (options.strict) {
      return true;
    }
    const {
      schema: schema2
    } = state;
    const type = schema2.marks["link"];
    if (!type) {
      return false;
    }
    return isMarkActive(state, type);
  }
  remove(state, dispatch) {
    return removeLink()(state, dispatch);
  }
  canExecute(state) {
    const testAttrs = {
      href: ""
    };
    return this.insert("Exec", testAttrs)(state) || this.update(testAttrs)(state);
  }
};
var Image$1 = class Image {
  insert(src, attrs) {
    return (state, dispatch) => {
      const {
        schema: schema2,
        tr,
        selection
      } = state;
      const type = schema2.nodes["image"];
      if (!type) {
        return false;
      }
      const imageAttrs = __spreadValues({
        width: null,
        src
      }, attrs);
      if (!imageAttrs.width && selection instanceof NodeSelection && selection.node.type === type) {
        imageAttrs.width = selection.node.attrs["width"];
      }
      tr.replaceSelectionWith(type.createAndFill(imageAttrs));
      const resolvedPos = tr.doc.resolve(tr.selection.anchor - tr.selection.$anchor.nodeBefore.nodeSize);
      tr.setSelection(new NodeSelection(resolvedPos)).scrollIntoView();
      if (tr.docChanged) {
        dispatch?.(tr);
        return true;
      }
      return false;
    };
  }
  isActive(state) {
    const {
      selection
    } = state;
    if (selection instanceof NodeSelection) {
      return selection.node.type.name === "image";
    }
    return false;
  }
};
var TextColor$1 = class TextColor {
  name;
  attrName;
  constructor(name, attrName = "color") {
    this.name = name;
    this.attrName = attrName;
  }
  apply(attrs) {
    return (state, dispatch) => {
      const {
        schema: schema2,
        selection,
        doc
      } = state;
      const type = schema2.marks[this.name];
      if (!type) {
        return false;
      }
      const {
        from: from2,
        to,
        empty
      } = selection;
      if (!empty && from2 + 1 === to) {
        const node = doc.nodeAt(from2);
        if (node?.isAtom && !node.isText && node.isLeaf) {
          return false;
        }
      }
      return applyMark(type, attrs)(state, dispatch);
    };
  }
  isActive(state) {
    const {
      schema: schema2
    } = state;
    const type = schema2.marks[this.name];
    if (!type) {
      return false;
    }
    return isMarkActive(state, type);
  }
  getActiveColors(state) {
    if (!this.isActive(state)) {
      return [];
    }
    const {
      schema: schema2
    } = state;
    const marks2 = getSelectionMarks(state);
    const colors = marks2.filter((mark) => mark.type === schema2.marks[this.name]).map((mark) => {
      return mark.attrs[this.attrName];
    }).filter(Boolean);
    return colors;
  }
  remove() {
    return (state, dispatch) => {
      const {
        schema: schema2
      } = state;
      const type = schema2.marks[this.name];
      if (!type) {
        return false;
      }
      return removeMark(type)(state, dispatch);
    };
  }
  canExecute(state) {
    const attrs = this.name === "text_color" ? {
      color: ""
    } : {
      backgroundColor: ""
    };
    return this.apply(attrs)(state);
  }
};
var SAFE_MARKS = ["link"];
var FormatClear = class {
  insert() {
    return (state, dispatch) => {
      const {
        tr
      } = state;
      const {
        ranges,
        empty
      } = tr.selection;
      if (empty) {
        return true;
      }
      Object.entries(state.schema.marks).forEach(([markType, mark]) => {
        if (SAFE_MARKS.includes(markType)) {
          return;
        }
        ranges.forEach((range) => {
          tr.removeMark(range.$from.pos, range.$to.pos, mark);
        });
      });
      dispatch(tr);
      return true;
    };
  }
  canExecute() {
    return true;
  }
};
var indentNodeTypes = ["paragraph", "heading", "blockquote"];
var minIndent = 0;
var maxIndent = 10;
var udpateIndentLevel = (tr, pos, method) => {
  const node = tr.doc.nodeAt(pos);
  if (!node) {
    return false;
  }
  const nodeIndent = node.attrs["indent"] ?? 0;
  const newIndent = clamp(nodeIndent + (method === "increase" ? 1 : -1), minIndent, maxIndent);
  if (newIndent === nodeIndent || newIndent < minIndent || newIndent > maxIndent) {
    return false;
  }
  const attrs = __spreadProps(__spreadValues({}, node.attrs), {
    indent: newIndent
  });
  tr.setNodeMarkup(pos, node.type, attrs);
  return true;
};
var Indent = class {
  method = "increase";
  constructor(method) {
    this.method = method;
  }
  insert() {
    return (state, dispatch) => {
      const {
        tr,
        doc
      } = state;
      const {
        from: from2,
        to
      } = tr.selection;
      let applicable = false;
      doc.nodesBetween(from2, to, (node, pos) => {
        const nodeType = node.type;
        if (indentNodeTypes.includes(nodeType.name)) {
          applicable = udpateIndentLevel(tr, pos, this.method);
          return false;
        } else if (node.type.name.includes("list")) {
          return false;
        }
        return true;
      });
      if (!applicable) {
        return false;
      }
      if (tr.docChanged) {
        dispatch?.(tr);
      }
      return true;
    };
  }
  canExecute(state) {
    return this.insert()(state);
  }
};
var History = class {
  mode = "undo";
  constructor(mode) {
    this.mode = mode;
  }
  insert() {
    return (state, dispatch) => {
      if (this.mode === "undo") {
        return undo(state, dispatch);
      }
      return redo(state, dispatch);
    };
  }
  canExecute(state) {
    return this.insert()(state);
  }
};
var STRONG = new Mark("strong");
var EM = new Mark("em");
var CODE = new Mark("code");
var UNDERLINE = new Mark("u");
var STRIKE = new Mark("s");
var BLOCKQUOTE = new Blockqote();
var HORIZONTAL_RULE = new HorizontalRule();
var FORMAT_CLEAR = new FormatClear();
var UL = new ListItem(true);
var OL = new ListItem(false);
var H1 = new Heading(1);
var H2 = new Heading(2);
var H3 = new Heading(3);
var H4 = new Heading(4);
var H5 = new Heading(5);
var H6 = new Heading(6);
var ALIGN_LEFT = new TextAlign("left");
var ALIGN_CENTER = new TextAlign("center");
var ALIGN_RIGHT = new TextAlign("right");
var ALIGN_JUSTIFY = new TextAlign("justify");
var LINK = new Link$1();
var IMAGE = new Image$1();
var TEXT_COLOR = new TextColor$1("text_color", "color");
var TEXT_BACKGROUND_COLOR = new TextColor$1("text_background_color", "backgroundColor");
var INDENT = new Indent("increase");
var OUTDENT = new Indent("decrease");
var SUPERSCRIPT = new Mark("sup");
var SUBSCRIPT = new Mark("sub");
var UNDO = new History("undo");
var REDO = new History("redo");
var ToggleCommands = {
  bold: STRONG,
  italic: EM,
  code: CODE,
  underline: UNDERLINE,
  strike: STRIKE,
  blockquote: BLOCKQUOTE,
  bullet_list: UL,
  ordered_list: OL,
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,
  align_left: ALIGN_LEFT,
  align_center: ALIGN_CENTER,
  align_right: ALIGN_RIGHT,
  align_justify: ALIGN_JUSTIFY,
  superscript: SUPERSCRIPT,
  subscript: SUBSCRIPT
};
var InsertCommands = {
  horizontal_rule: HORIZONTAL_RULE,
  format_clear: FORMAT_CLEAR,
  indent: INDENT,
  outdent: OUTDENT,
  undo: UNDO,
  redo: REDO
};
var Link2 = LINK;
var Image2 = IMAGE;
var TextColor2 = TEXT_COLOR;
var TextBackgroundColor = TEXT_BACKGROUND_COLOR;
var MenuService = class _MenuService {
  editor;
  customMenuRefChange = new Subject();
  setCustomMenuRef(c) {
    this.customMenuRefChange.next(c);
  }
  static ɵfac = function MenuService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MenuService)();
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _MenuService,
    factory: _MenuService.ɵfac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MenuService, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], null, null);
})();
var defaults = {
  // menu
  bold: "Bold",
  italic: "Italic",
  code: "Code",
  underline: "Underline",
  strike: "Strike",
  blockquote: "Blockquote",
  bullet_list: "Bullet List",
  ordered_list: "Ordered List",
  heading: "Heading",
  h1: "Header 1",
  h2: "Header 2",
  h3: "Header 3",
  h4: "Header 4",
  h5: "Header 5",
  h6: "Header 6",
  align_left: "Left Align",
  align_center: "Center Align",
  align_right: "Right Align",
  align_justify: "Justify",
  text_color: "Text Color",
  background_color: "Background Color",
  horizontal_rule: "Horizontal rule",
  format_clear: "Clear Formatting",
  insertLink: "Insert Link",
  removeLink: "Remove Link",
  insertImage: "Insert Image",
  indent: "Increase Indent",
  outdent: "Decrease Indent",
  superscript: "Superscript",
  subscript: "Subscript",
  undo: "Undo",
  redo: "Redo",
  // pupups, forms, others...
  url: "URL",
  text: "Text",
  openInNewTab: "Open in new tab",
  insert: "Insert",
  altText: "Alt Text",
  title: "Title",
  remove: "Remove",
  enterValidUrl: "Please enter a valid URL"
};
var Locals = class {
  locals = defaults;
  constructor(newLocals = {}) {
    this.locals = __spreadValues(__spreadValues({}, defaults), newLocals);
  }
  get = (key) => {
    const value = this.locals[key];
    if (value) {
      return isObservable(value) ? value : of(value);
    }
    return of("");
  };
};
var bold = `
  <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" />
`;
var italic = `
  <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" />
`;
var code = `
<path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
`;
var underline = `
<path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/>
`;
var strike = `
<path d="M6.85,7.08C6.85,4.37,9.45,3,12.24,3c1.64,0,3,0.49,3.9,1.28c0.77,0.65,1.46,1.73,1.46,3.24h-3.01 c0-0.31-0.05-0.59-0.15-0.85c-0.29-0.86-1.2-1.28-2.25-1.28c-1.86,0-2.34,1.02-2.34,1.7c0,0.48,0.25,0.88,0.74,1.21 C10.97,8.55,11.36,8.78,12,9H7.39C7.18,8.66,6.85,8.11,6.85,7.08z M21,12v-2H3v2h9.62c1.15,0.45,1.96,0.75,1.96,1.97 c0,1-0.81,1.67-2.28,1.67c-1.54,0-2.93-0.54-2.93-2.51H6.4c0,0.55,0.08,1.13,0.24,1.58c0.81,2.29,3.29,3.3,5.67,3.3 c2.27,0,5.3-0.89,5.3-4.05c0-0.3-0.01-1.16-0.48-1.94H21V12z"/>
`;
var orderedList = `
<path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/>
`;
var bulletList = `
<path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
`;
var quote = `
<path d="M0 0h24v24H0z" fill="none"/><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
`;
var link = `
<path d="M0 0h24v24H0z" fill="none"/><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
`;
var unlink = `
<path d="M17 7h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1 0 1.43-.98 2.63-2.31 2.98l1.46 1.46C20.88 15.61 22 13.95 22 12c0-2.76-2.24-5-5-5zm-1 4h-2.19l2 2H16zM2 4.27l3.11 3.11C3.29 8.12 2 9.91 2 12c0 2.76 2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1 0-1.59 1.21-2.9 2.76-3.07L8.73 11H8v2h2.73L13 15.27V17h1.73l4.01 4L20 19.74 3.27 3 2 4.27z"/>
`;
var image = `
<path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
`;
var alignLeft = `
<path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/>
`;
var alignCenter = `
<path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/>
`;
var alignRight = `
<path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/>
`;
var alignJustify = `
<path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z"/>
`;
var textColor = `
<path d="M2,20h20v4H2V20z M5.49,17h2.42l1.27-3.58h5.65L16.09,17h2.42L13.25,3h-2.5L5.49,17z M9.91,11.39l2.03-5.79h0.12l2.03,5.79 H9.91z"/>
`;
var colorFill = `
<path d="M16.56,8.94L7.62,0L6.21,1.41l2.38,2.38L3.44,8.94c-0.59,0.59-0.59,1.54,0,2.12l5.5,5.5C9.23,16.85,9.62,17,10,17 s0.77-0.15,1.06-0.44l5.5-5.5C17.15,10.48,17.15,9.53,16.56,8.94z M5.21,10L10,5.21L14.79,10H5.21z M19,11.5c0,0-2,2.17-2,3.5 c0,1.1,0.9,2,2,2s2-0.9,2-2C21,13.67,19,11.5,19,11.5z M2,20h20v4H2V20z"/>
`;
var horizontalRule = `
  <g>
    <rect fill="none" fill-rule="evenodd" height="24" width="24"/>
    <rect fill-rule="evenodd" height="2" width="16" x="4" y="11"/>
  </g>
`;
var formatClear = `
<path d="M0 0h24v24H0z" fill="none"/><path d="M3.27 5L2 6.27l6.97 6.97L6.5 19h3l1.57-3.66L16.73 21 18 19.73 3.55 5.27 3.27 5zM6 5v.18L8.82 8h2.4l-.72 1.68 2.1 2.1L14.21 8H20V5H6z"/>
`;
var indent = '<path d="M0 0h24v24H0V0z" fill="none"/><path d="M3 21h18v-2H3v2zM3 8v8l4-4-4-4zm8 9h10v-2H11v2zM3 3v2h18V3H3zm8 6h10V7H11v2zm0 4h10v-2H11v2z"/>';
var outdent = '<path d="M0 0h24v24H0V0z" fill="none"/><path d="M11 17h10v-2H11v2zm-8-5l4 4V8l-4 4zm0 9h18v-2H3v2zM3 3v2h18V3H3zm8 6h10V7H11v2zm0 4h10v-2H11v2z"/>';
var superscript = '<g><rect fill="none" height="20" width="20"/><path d="M17,6l-1,0v1h2v1l-3,0V6c0-0.55,0.45-1,1-1l1,0l0-1h-2V3l2,0c0.55,0,1,0.45,1,1v1C18,5.55,17.55,6,17,6z M5.63,16h1.9 l2.43-3.87h0.08L12.47,16h1.9l-3.32-5.2l3.1-4.8h-1.91l-2.19,3.56H9.96L7.75,6h-1.9l3.09,4.8L5.63,16z"/></g>';
var subscript = '<g><rect fill="none" height="20" width="20"/><path d="M17,15l-1,0v1h2v1h-3v-2c0-0.55,0.45-1,1-1l1,0l0-1h-2v-1l2,0c0.55,0,1,0.45,1,1v1C18,14.55,17.55,15,17,15z M5.63,14h1.9 l2.43-3.87h0.08L12.47,14h1.9l-3.32-5.2l3.1-4.8h-1.91l-2.19,3.56H9.96L7.75,4h-1.9l3.09,4.8L5.63,14z"/></g>';
var undo2 = '<path d="M0 0h24v24H0V0z" fill="none"/><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>';
var redo2 = '<path d="M0 0h24v24H0V0z" fill="none"/><path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/>';
var DEFAULT_ICON_HEIGHT = 20;
var DEFAULT_ICON_WIDTH = 20;
var DEFAULT_ICON_FILL = "currentColor";
var icons = {
  bold,
  italic,
  code,
  underline,
  strike,
  ordered_list: orderedList,
  bullet_list: bulletList,
  blockquote: quote,
  link,
  unlink,
  image,
  align_left: alignLeft,
  align_center: alignCenter,
  align_right: alignRight,
  align_justify: alignJustify,
  text_color: textColor,
  color_fill: colorFill,
  horizontal_rule: horizontalRule,
  format_clear: formatClear,
  indent,
  outdent,
  superscript,
  subscript,
  undo: undo2,
  redo: redo2,
  path: "<path></path>"
};
var Icon = class {
  static get(name, fill = DEFAULT_ICON_FILL) {
    const fullPath = icons[name];
    if (fullPath && (fullPath.includes("<path") || fullPath.includes("<g"))) {
      return `
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill=${fill}
          height=${DEFAULT_ICON_HEIGHT}
          width=${DEFAULT_ICON_WIDTH}
        >
          ${fullPath}
        </svg>
      `;
    }
    return fullPath;
  }
};
var NgxEditorServiceConfig = class _NgxEditorServiceConfig {
  locals = {};
  icons = {};
  static ɵfac = function NgxEditorServiceConfig_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NgxEditorServiceConfig)();
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _NgxEditorServiceConfig,
    factory: _NgxEditorServiceConfig.ɵfac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgxEditorServiceConfig, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], null, null);
})();
var NgxEditorService = class _NgxEditorService {
  config;
  constructor(config) {
    this.config = config;
  }
  get locals() {
    return new Locals(this.config.locals);
  }
  getIcon(icon) {
    return this.config.icons[icon] ? this.config.icons[icon] : Icon.get(icon);
  }
  static ɵfac = function NgxEditorService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NgxEditorService)(ɵɵinject(NgxEditorServiceConfig, 8));
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _NgxEditorService,
    factory: _NgxEditorService.ɵfac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgxEditorService, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [{
    type: NgxEditorServiceConfig,
    decorators: [{
      type: Optional
    }]
  }], null);
})();
var provideMyServiceOptions = (config) => {
  return {
    locals: config.locals ?? {},
    icons: config.icons ?? {}
  };
};
var ColorPickerComponent = class _ColorPickerComponent {
  el;
  menuService;
  ngxeService;
  presets;
  type;
  constructor(el, menuService, ngxeService) {
    this.el = el;
    this.menuService = menuService;
    this.ngxeService = ngxeService;
  }
  get title() {
    return this.getLabel(this.type === "text_color" ? "text_color" : "background_color");
  }
  get icon() {
    return this.ngxeService.getIcon(this.type === "text_color" ? "text_color" : "color_fill");
  }
  get command() {
    return this.type === "text_color" ? TextColor2 : TextBackgroundColor;
  }
  updateSubscription;
  editorView;
  showPopup = false;
  isActive = false;
  activeColors = [];
  canExecute = true;
  getContrastYIQ(hexcolor) {
    const color = hexcolor.replace("#", "");
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1e3;
    return yiq >= 128 ? "black" : "white";
  }
  onDocumentClick(e) {
    if (!this.el.nativeElement.contains(e.target) && this.showPopup) {
      this.hidePopup();
    }
  }
  hidePopup() {
    this.showPopup = false;
  }
  togglePopup() {
    this.showPopup = !this.showPopup;
  }
  onTogglePopupMouseClick(e) {
    e.preventDefault();
    if (e.button !== 0) {
      return;
    }
    this.togglePopup();
  }
  onTogglePopupKeydown() {
    this.togglePopup();
  }
  remove() {
    const {
      state,
      dispatch
    } = this.editorView;
    this.command.remove()(state, dispatch);
    this.hidePopup();
  }
  onRemoveMouseClick(e) {
    e.preventDefault();
    if (e.button !== 0) {
      return;
    }
    e.preventDefault();
    this.remove();
  }
  onRemoveKeydown() {
    this.remove();
  }
  trackByIndex(index) {
    return index;
  }
  selectColor(color) {
    const {
      state,
      dispatch
    } = this.editorView;
    if (this.type === "text_color") {
      const attrs = {
        color
      };
      this.command.apply(attrs)(state, dispatch);
    } else {
      const attrs = {
        backgroundColor: color
      };
      this.command.apply(attrs)(state, dispatch);
    }
    if (!this.editorView.hasFocus()) {
      this.editorView.focus();
    }
    this.hidePopup();
  }
  onColorSelectMouseClick(e, color) {
    e.preventDefault();
    if (e.button !== 0) {
      return;
    }
    this.selectColor(color);
  }
  onColorSelectKeydown(color) {
    this.selectColor(color);
  }
  update = (view) => {
    const {
      state
    } = view;
    this.canExecute = this.command.canExecute(state);
    this.isActive = this.command.isActive(state);
    this.activeColors = [];
    if (this.isActive) {
      this.activeColors = this.command.getActiveColors(state);
    }
  };
  getLabel(key) {
    return this.ngxeService.locals.get(key);
  }
  ngOnInit() {
    this.editorView = this.menuService.editor.view;
    this.updateSubscription = this.menuService.editor.update.subscribe((view) => {
      this.update(view);
    });
  }
  ngOnDestroy() {
    this.updateSubscription.unsubscribe();
  }
  static ɵfac = function ColorPickerComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ColorPickerComponent)(ɵɵdirectiveInject(ElementRef), ɵɵdirectiveInject(MenuService), ɵɵdirectiveInject(NgxEditorService));
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _ColorPickerComponent,
    selectors: [["ngx-color-picker"]],
    hostBindings: function ColorPickerComponent_HostBindings(rf, ctx) {
      if (rf & 1) {
        ɵɵlistener("mousedown", function ColorPickerComponent_mousedown_HostBindingHandler($event) {
          return ctx.onDocumentClick($event);
        }, ɵɵresolveDocument);
      }
    },
    inputs: {
      presets: "presets",
      type: "type"
    },
    decls: 5,
    vars: 15,
    consts: [["type", "button", 1, "NgxEditor__MenuItem--Icon", 3, "mousedown", "keydown.enter", "keydown.space", "disabled", "innerHTML", "title", "ariaLabel"], ["class", "NgxEditor__Popup", 4, "ngIf"], [1, "NgxEditor__Popup"], ["class", "NgxEditor__ColorContainer", 4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "NgxEditor__MenuItem--Button", 3, "mousedown", "keydown.enter", "keydown.space", "disabled"], [1, "NgxEditor__ColorContainer"], ["class", "NgxEditor__Color", 3, "ngStyle", "title", "ngClass", "mousedown", "keydown.enter", "keydown.space", 4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "NgxEditor__Color", 3, "mousedown", "keydown.enter", "keydown.space", "ngStyle", "title", "ngClass"]],
    template: function ColorPickerComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵelementStart(0, "button", 0);
        ɵɵpipe(1, "sanitizeHtml");
        ɵɵpipe(2, "async");
        ɵɵpipe(3, "async");
        ɵɵlistener("mousedown", function ColorPickerComponent_Template_button_mousedown_0_listener($event) {
          return ctx.onTogglePopupMouseClick($event);
        })("keydown.enter", function ColorPickerComponent_Template_button_keydown_enter_0_listener() {
          return ctx.onTogglePopupKeydown();
        })("keydown.space", function ColorPickerComponent_Template_button_keydown_space_0_listener() {
          return ctx.onTogglePopupKeydown();
        });
        ɵɵelementEnd();
        ɵɵtemplate(4, ColorPickerComponent_div_4_Template, 5, 6, "div", 1);
      }
      if (rf & 2) {
        ɵɵclassProp("NgxEditor__MenuItem--Active", ctx.isActive || ctx.showPopup)("NgxEditor--Disabled", !ctx.canExecute);
        ɵɵproperty("disabled", !ctx.canExecute)("innerHTML", ɵɵpipeBind1(1, 9, ctx.icon), ɵɵsanitizeHtml)("title", ɵɵpipeBind1(2, 11, ctx.title));
        ɵɵariaProperty("ariaLabel", ɵɵpipeBind1(3, 13, ctx.title));
        ɵɵadvance(4);
        ɵɵproperty("ngIf", ctx.showPopup);
      }
    },
    dependencies: [AsyncPipe, CommonModule, NgClass, NgForOf, NgIf, NgStyle, SanitizeHtmlPipe],
    styles: ['@charset "UTF-8";.NgxEditor__Popup[_ngcontent-%COMP%]{width:230px}.NgxEditor__ColorContainer[_ngcontent-%COMP%]{display:flex;justify-content:space-between}.NgxEditor__ColorContainer[_ngcontent-%COMP%] + .NgxEditor__ColorContainer[_ngcontent-%COMP%]{margin-top:5px}.NgxEditor__Color[_ngcontent-%COMP%]{border:none;outline:none;border-radius:6px;width:24px;height:24px;flex-shrink:0}.NgxEditor__Color[_ngcontent-%COMP%]:focus-visible{outline:1px solid var(--ngx-editor-focus-ring-color);outline-offset:1px}.NgxEditor__Color--Active[_ngcontent-%COMP%]:after{content:"\\2714";font-size:90%}.NgxEditor__MenuItem--Button[_ngcontent-%COMP%]{margin-top:5px}']
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ColorPickerComponent, [{
    type: Component,
    args: [{
      selector: "ngx-color-picker",
      imports: [AsyncPipe, CommonModule, SanitizeHtmlPipe],
      template: `<button
  type="button"
  class="NgxEditor__MenuItem--Icon"
  [class.NgxEditor__MenuItem--Active]="isActive || showPopup"
  [class.NgxEditor--Disabled]="!canExecute"
  [disabled]="!canExecute"
  [innerHTML]="icon | sanitizeHtml"
  (mousedown)="onTogglePopupMouseClick($event)"
  (keydown.enter)="onTogglePopupKeydown()"
  (keydown.space)="onTogglePopupKeydown()"
  [title]="title | async"
  [ariaLabel]="title | async"
></button>

<div *ngIf="showPopup" class="NgxEditor__Popup">
  <div *ngFor="let colorGroup of presets; trackBy: trackByIndex" class="NgxEditor__ColorContainer">
    <button
      class="NgxEditor__Color"
      *ngFor="let color of colorGroup; trackBy: trackByIndex"
      [ngStyle]="{ backgroundColor: color, color: getContrastYIQ(color) }"
      [title]="color"
      (mousedown)="onColorSelectMouseClick($event, color)"
      (keydown.enter)="onColorSelectKeydown(color)"
      (keydown.space)="onColorSelectKeydown(color)"
      [ngClass]="{ 'NgxEditor__Color--Active': activeColors.includes(color) }"
    ></button>
  </div>

  <button
    class="NgxEditor__MenuItem--Button"
    (mousedown)="onRemoveMouseClick($event)"
    (keydown.enter)="onRemoveKeydown()"
    (keydown.space)="onRemoveKeydown()"
    [disabled]="!isActive"
  >
    {{ getLabel('remove') | async }}
  </button>
</div>
`,
      styles: ['@charset "UTF-8";.NgxEditor__Popup{width:230px}.NgxEditor__ColorContainer{display:flex;justify-content:space-between}.NgxEditor__ColorContainer+.NgxEditor__ColorContainer{margin-top:5px}.NgxEditor__Color{border:none;outline:none;border-radius:6px;width:24px;height:24px;flex-shrink:0}.NgxEditor__Color:focus-visible{outline:1px solid var(--ngx-editor-focus-ring-color);outline-offset:1px}.NgxEditor__Color--Active:after{content:"\\2714";font-size:90%}.NgxEditor__MenuItem--Button{margin-top:5px}\n']
    }]
  }], () => [{
    type: ElementRef
  }, {
    type: MenuService
  }, {
    type: NgxEditorService
  }], {
    presets: [{
      type: Input
    }],
    type: [{
      type: Input
    }],
    onDocumentClick: [{
      type: HostListener,
      args: ["document:mousedown", ["$event"]]
    }]
  });
})();
var DropdownComponent = class _DropdownComponent {
  ngxeService;
  menuService;
  el;
  editorView;
  updateSubscription;
  group;
  items;
  isDropdownOpen = false;
  disabledItems = [];
  activeItem;
  constructor(ngxeService, menuService, el) {
    this.ngxeService = ngxeService;
    this.menuService = menuService;
    this.el = el;
  }
  get isSelected() {
    return Boolean(this.activeItem || this.isDropdownOpen);
  }
  get isDropdownDisabled() {
    return this.disabledItems.length === this.items.length;
  }
  onDocumentClick(target) {
    if (!this.el.nativeElement.contains(target) && this.isDropdownOpen) {
      this.isDropdownOpen = false;
    }
  }
  getName(key) {
    return this.ngxeService.locals.get(key);
  }
  getIsDropdownActive(item) {
    return this.activeItem === item;
  }
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }
  onToggleDropdownMouseClick(e) {
    e.preventDefault();
    if (e.button !== 0) {
      return;
    }
    this.toggleDropdown();
  }
  onToggleDropdownKeydown() {
    this.toggleDropdown();
  }
  trackByIndex(index) {
    return index;
  }
  selectItem(item) {
    const command = ToggleCommands[item];
    const {
      state,
      dispatch
    } = this.editorView;
    command.toggle()(state, dispatch);
    this.isDropdownOpen = false;
  }
  onDropdownItemMouseClick(e, item) {
    e.preventDefault();
    if (e.button !== 0) {
      return;
    }
    this.selectItem(item);
  }
  onDropdownItemKeydown(event, item) {
    const e = event;
    e.preventDefault();
    this.selectItem(item);
  }
  update = (view) => {
    const {
      state
    } = view;
    this.disabledItems = [];
    const activeItems = [];
    this.items.forEach((item) => {
      const command = ToggleCommands[item];
      const isActive = command.isActive(state);
      if (isActive) {
        activeItems.push(item);
      }
      if (!command.canExecute(state)) {
        this.disabledItems.push(item);
      }
    });
    if (activeItems.length === 1) {
      [this.activeItem] = activeItems;
    } else {
      this.activeItem = null;
    }
  };
  ngOnInit() {
    this.editorView = this.menuService.editor.view;
    this.updateSubscription = this.menuService.editor.update.subscribe((view) => {
      this.update(view);
    });
  }
  ngOnDestroy() {
    this.updateSubscription.unsubscribe();
  }
  static ɵfac = function DropdownComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DropdownComponent)(ɵɵdirectiveInject(NgxEditorService), ɵɵdirectiveInject(MenuService), ɵɵdirectiveInject(ElementRef));
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _DropdownComponent,
    selectors: [["ngx-dropdown"]],
    hostBindings: function DropdownComponent_HostBindings(rf, ctx) {
      if (rf & 1) {
        ɵɵlistener("mousedown", function DropdownComponent_mousedown_HostBindingHandler($event) {
          return ctx.onDocumentClick($event.target);
        }, ɵɵresolveDocument);
      }
    },
    inputs: {
      group: "group",
      items: "items"
    },
    decls: 5,
    vars: 13,
    consts: [["type", "button", "aria-haspopup", "listbox", 1, "NgxEditor__Dropdown--Text", 3, "mousedown", "keydown.enter", "keydown.space", "disabled", "ariaLabel", "ariaExpanded"], ["class", "NgxEditor__Dropdown--DropdownMenu", "role", "listbox", 4, "ngIf"], ["role", "listbox", 1, "NgxEditor__Dropdown--DropdownMenu"], ["type", "button", "class", "NgxEditor__Dropdown--Item", "role", "option", 3, "ngClass", "ariaLabel", "mousedown", "keydown.enter", "keydown.space", 4, "ngFor", "ngForOf", "ngForTrackBy"], ["type", "button", "role", "option", 1, "NgxEditor__Dropdown--Item", 3, "mousedown", "keydown.enter", "keydown.space", "ngClass", "ariaLabel"]],
    template: function DropdownComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵelementStart(0, "button", 0);
        ɵɵpipe(1, "async");
        ɵɵlistener("mousedown", function DropdownComponent_Template_button_mousedown_0_listener($event) {
          return ctx.onToggleDropdownMouseClick($event);
        })("keydown.enter", function DropdownComponent_Template_button_keydown_enter_0_listener() {
          return ctx.onToggleDropdownKeydown();
        })("keydown.space", function DropdownComponent_Template_button_keydown_space_0_listener() {
          return ctx.onToggleDropdownKeydown();
        });
        ɵɵtext(2);
        ɵɵpipe(3, "async");
        ɵɵelementEnd();
        ɵɵtemplate(4, DropdownComponent_div_4_Template, 2, 2, "div", 1);
      }
      if (rf & 2) {
        ɵɵclassProp("NgxEditor__Dropdown--Selected", ctx.isSelected)("NgxEditor--Disabled", ctx.isDropdownDisabled);
        ɵɵproperty("disabled", ctx.isDropdownDisabled);
        ɵɵariaProperty("ariaLabel", ɵɵpipeBind1(1, 9, ctx.getName(ctx.activeItem || ctx.group)))("ariaExpanded", ctx.isDropdownOpen);
        ɵɵadvance(2);
        ɵɵtextInterpolate1(" ", ɵɵpipeBind1(3, 11, ctx.getName(ctx.activeItem || ctx.group)), "\n");
        ɵɵadvance(2);
        ɵɵproperty("ngIf", ctx.isDropdownOpen);
      }
    },
    dependencies: [AsyncPipe, CommonModule, NgClass, NgForOf, NgIf],
    encapsulation: 2
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DropdownComponent, [{
    type: Component,
    args: [{
      selector: "ngx-dropdown",
      imports: [AsyncPipe, CommonModule],
      template: `<button
  type="button"
  class="NgxEditor__Dropdown--Text"
  [class.NgxEditor__Dropdown--Selected]="isSelected"
  [disabled]="isDropdownDisabled"
  [class.NgxEditor--Disabled]="isDropdownDisabled"
  (mousedown)="onToggleDropdownMouseClick($event)"
  (keydown.enter)="onToggleDropdownKeydown()"
  (keydown.space)="onToggleDropdownKeydown()"
  [ariaLabel]="getName(activeItem || group) | async"
  aria-haspopup="listbox"
  [ariaExpanded]="isDropdownOpen"
>
  {{ getName(activeItem || group) | async }}
</button>

<div class="NgxEditor__Dropdown--DropdownMenu" *ngIf="isDropdownOpen" role="listbox">
  <button
    type="button"
    class="NgxEditor__Dropdown--Item"
    *ngFor="let item of items; trackBy: trackByIndex"
    (mousedown)="onDropdownItemMouseClick($event, item)"
    (keydown.enter)="onDropdownItemKeydown($event, item)"
    (keydown.space)="onDropdownItemKeydown($event, item)"
    [ngClass]="{
      'NgxEditor__Dropdown--Active': item === activeItem,
      'NgxEditor--Disabled': disabledItems.includes(item),
    }"
    [ariaLabel]="getName(item) | async"
    role="option"
    [attr.aria-selected]="item === activeItem"
  >
    {{ getName(item) | async }}
  </button>
</div>
`
    }]
  }], () => [{
    type: NgxEditorService
  }, {
    type: MenuService
  }, {
    type: ElementRef
  }], {
    group: [{
      type: Input
    }],
    items: [{
      type: Input
    }],
    onDocumentClick: [{
      type: HostListener,
      args: ["document:mousedown", ["$event.target"]]
    }]
  });
})();
var ImageComponent = class _ImageComponent {
  el;
  ngxeService;
  menuService;
  showPopup = false;
  isActive = false;
  componentId = uniq();
  updateSubscription;
  form = new FormGroup({
    src: new FormControl("", [Validators.required, Validators.pattern("(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/??([^#\n\r]*)?#?([^\n\r]*)")]),
    alt: new FormControl(""),
    title: new FormControl("")
  });
  editorView;
  constructor(el, ngxeService, menuService) {
    this.el = el;
    this.ngxeService = ngxeService;
    this.menuService = menuService;
  }
  get icon() {
    return this.ngxeService.getIcon("image");
  }
  get src() {
    return this.form.get("src");
  }
  onDocumentClick(e) {
    if (!this.el.nativeElement.contains(e.target) && this.showPopup) {
      this.hideForm();
    }
  }
  getId(name) {
    return `${name}-${this.componentId}`;
  }
  getLabel(key) {
    return this.ngxeService.locals.get(key);
  }
  hideForm() {
    this.showPopup = false;
    this.form.reset({
      src: "",
      alt: "",
      title: ""
    });
  }
  togglePopup() {
    this.showPopup = !this.showPopup;
    if (this.showPopup) {
      this.fillForm();
    }
  }
  onTogglePopupMouseClick(e) {
    if (e.button !== 0) {
      return;
    }
    this.togglePopup();
  }
  onTogglePopupKeydown() {
    this.togglePopup();
  }
  fillForm() {
    const {
      state
    } = this.editorView;
    const {
      selection
    } = state;
    if (selection instanceof NodeSelection && this.isActive) {
      const {
        src,
        alt = "",
        title = ""
      } = selection.node.attrs;
      this.form.setValue({
        src,
        alt,
        title
      });
    }
  }
  update = (view) => {
    const {
      state
    } = view;
    this.isActive = Image2.isActive(state);
  };
  insertLink(e) {
    e.preventDefault();
    const {
      src,
      alt,
      title
    } = this.form.getRawValue();
    const {
      dispatch,
      state
    } = this.editorView;
    const attrs = {
      alt,
      title
    };
    Image2.insert(src, attrs)(state, dispatch);
    this.editorView.focus();
    this.hideForm();
  }
  ngOnInit() {
    this.editorView = this.menuService.editor.view;
    this.updateSubscription = this.menuService.editor.update.subscribe((view) => {
      this.update(view);
    });
  }
  ngOnDestroy() {
    this.updateSubscription.unsubscribe();
  }
  static ɵfac = function ImageComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ImageComponent)(ɵɵdirectiveInject(ElementRef), ɵɵdirectiveInject(NgxEditorService), ɵɵdirectiveInject(MenuService));
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _ImageComponent,
    selectors: [["ngx-image"]],
    hostBindings: function ImageComponent_HostBindings(rf, ctx) {
      if (rf & 1) {
        ɵɵlistener("mousedown", function ImageComponent_mousedown_HostBindingHandler($event) {
          return ctx.onDocumentClick($event);
        }, ɵɵresolveDocument);
      }
    },
    decls: 5,
    vars: 13,
    consts: [["type", "button", "aria-haspopup", "dialog", 1, "NgxEditor__MenuItem--Icon", 3, "mousedown", "keydown.enter", "keydown.space", "innerHTML", "title", "ariaLabel", "ariaExpanded"], ["class", "NgxEditor__Popup", 4, "ngIf"], [1, "NgxEditor__Popup"], [1, "NgxEditor__Popup--Form", 3, "ngSubmit", "formGroup"], [1, "NgxEditor__Popup--FormGroup"], [1, "NgxEditor__Popup--Col"], [1, "NgxEditor__Popup--Label", 3, "htmlFor"], ["type", "url", "formControlName", "src", "autocomplete", "off", 3, "id"], ["class", "NgxEditor__HelpText NgxEditor__HelpText--Error", 4, "ngIf"], ["type", "text", "formControlName", "alt", "autocomplete", "off", 3, "id"], ["type", "text", "formControlName", "title", "autocomplete", "off", 3, "id"], ["type", "submit", 3, "disabled"], [1, "NgxEditor__HelpText", "NgxEditor__HelpText--Error"]],
    template: function ImageComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵelementStart(0, "button", 0);
        ɵɵpipe(1, "sanitizeHtml");
        ɵɵpipe(2, "async");
        ɵɵpipe(3, "async");
        ɵɵlistener("mousedown", function ImageComponent_Template_button_mousedown_0_listener($event) {
          return ctx.onTogglePopupMouseClick($event);
        })("keydown.enter", function ImageComponent_Template_button_keydown_enter_0_listener() {
          return ctx.onTogglePopupKeydown();
        })("keydown.space", function ImageComponent_Template_button_keydown_space_0_listener() {
          return ctx.onTogglePopupKeydown();
        });
        ɵɵelementEnd();
        ɵɵtemplate(4, ImageComponent_div_4_Template, 24, 21, "div", 1);
      }
      if (rf & 2) {
        ɵɵclassProp("NgxEditor__MenuItem--Active", ctx.isActive || ctx.showPopup);
        ɵɵproperty("innerHTML", ɵɵpipeBind1(1, 7, ctx.icon), ɵɵsanitizeHtml)("title", ɵɵpipeBind1(2, 9, ctx.getLabel("insertImage")));
        ɵɵariaProperty("ariaLabel", ɵɵpipeBind1(3, 11, ctx.getLabel("insertImage")))("ariaExpanded", ctx.showPopup);
        ɵɵadvance(4);
        ɵɵproperty("ngIf", ctx.showPopup);
      }
    },
    dependencies: [AsyncPipe, SanitizeHtmlPipe, ReactiveFormsModule, ɵNgNoValidate, DefaultValueAccessor, NgControlStatus, NgControlStatusGroup, FormGroupDirective, FormControlName, CommonModule, NgIf],
    encapsulation: 2
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ImageComponent, [{
    type: Component,
    args: [{
      selector: "ngx-image",
      imports: [AsyncPipe, SanitizeHtmlPipe, ReactiveFormsModule, CommonModule],
      template: `<button
  type="button"
  class="NgxEditor__MenuItem--Icon"
  [class.NgxEditor__MenuItem--Active]="isActive || showPopup"
  [innerHTML]="icon | sanitizeHtml"
  (mousedown)="onTogglePopupMouseClick($event)"
  (keydown.enter)="onTogglePopupKeydown()"
  (keydown.space)="onTogglePopupKeydown()"
  [title]="getLabel('insertImage') | async"
  [ariaLabel]="getLabel('insertImage') | async"
  aria-haspopup="dialog"
  [ariaExpanded]="showPopup"
></button>

<!-- popup -->
<div *ngIf="showPopup" class="NgxEditor__Popup">
  <form class="NgxEditor__Popup--Form" [formGroup]="form" (ngSubmit)="insertLink($event)">
    <div class="NgxEditor__Popup--FormGroup">
      <div class="NgxEditor__Popup--Col">
        <label class="NgxEditor__Popup--Label" [htmlFor]="getId('image-popup-url')">{{
          getLabel('url') | async
        }}</label>
        <input type="url" [id]="getId('image-popup-url')" formControlName="src" autocomplete="off" />
        <div *ngIf="src.touched && src.invalid" class="NgxEditor__HelpText NgxEditor__HelpText--Error">
          {{ src.errors?.['pattern'] && getLabel('enterValidUrl') | async }}
        </div>
      </div>
    </div>

    <div class="NgxEditor__Popup--FormGroup">
      <div class="NgxEditor__Popup--Col">
        <label class="NgxEditor__Popup--Label" [htmlFor]="getId('image-popup-label')">{{
          getLabel('altText') | async
        }}</label>
        <input type="text" [id]="getId('image-popup-label')" formControlName="alt" autocomplete="off" />
      </div>
    </div>

    <div class="NgxEditor__Popup--FormGroup">
      <div class="NgxEditor__Popup--Col">
        <label class="NgxEditor__Popup--Label" [htmlFor]="getId('image-popup-title')">{{
          getLabel('title') | async
        }}</label>
        <input type="text" [id]="getId('image-popup-title')" formControlName="title" autocomplete="off" />
      </div>
    </div>

    <button type="submit" [disabled]="!form.valid || !form.dirty">{{ getLabel('insert') | async }}</button>
  </form>
</div>
`
    }]
  }], () => [{
    type: ElementRef
  }, {
    type: NgxEditorService
  }, {
    type: MenuService
  }], {
    onDocumentClick: [{
      type: HostListener,
      args: ["document:mousedown", ["$event"]]
    }]
  });
})();
var InsertCommandComponent = class _InsertCommandComponent {
  ngxeService;
  menuService;
  toolbarItem;
  get name() {
    return this.toolbarItem;
  }
  html;
  editorView;
  disabled = false;
  updateSubscription;
  constructor(ngxeService, menuService) {
    this.ngxeService = ngxeService;
    this.menuService = menuService;
  }
  onMouseClick(e) {
    e.preventDefault();
    if (e.button !== 0) {
      return;
    }
    this.insert();
  }
  onKeydown() {
    this.insert();
  }
  insert() {
    const {
      state,
      dispatch
    } = this.editorView;
    const command = InsertCommands[this.name];
    command.insert()(state, dispatch);
  }
  update = (view) => {
    const {
      state
    } = view;
    const command = InsertCommands[this.name];
    this.disabled = !command.canExecute(state);
  };
  getTitle(name) {
    return this.ngxeService.locals.get(name);
  }
  ngOnInit() {
    this.html = this.ngxeService.getIcon(this.name);
    this.editorView = this.menuService.editor.view;
    this.updateSubscription = this.menuService.editor.update.subscribe((view) => {
      this.update(view);
    });
  }
  ngOnDestroy() {
    this.updateSubscription.unsubscribe();
  }
  static ɵfac = function InsertCommandComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _InsertCommandComponent)(ɵɵdirectiveInject(NgxEditorService), ɵɵdirectiveInject(MenuService));
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _InsertCommandComponent,
    selectors: [["ngx-insert-command"]],
    inputs: {
      toolbarItem: "toolbarItem"
    },
    decls: 4,
    vars: 12,
    consts: [["type", "button", 1, "NgxEditor__MenuItem--Icon", 3, "mousedown", "keydown.enter", "keydown.space", "disabled", "innerHTML", "title", "ariaLabel"]],
    template: function InsertCommandComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵdomElementStart(0, "button", 0);
        ɵɵpipe(1, "sanitizeHtml");
        ɵɵpipe(2, "async");
        ɵɵpipe(3, "async");
        ɵɵdomListener("mousedown", function InsertCommandComponent_Template_button_mousedown_0_listener($event) {
          return ctx.onMouseClick($event);
        })("keydown.enter", function InsertCommandComponent_Template_button_keydown_enter_0_listener() {
          return ctx.onKeydown();
        })("keydown.space", function InsertCommandComponent_Template_button_keydown_space_0_listener() {
          return ctx.onKeydown();
        });
        ɵɵdomElementEnd();
      }
      if (rf & 2) {
        ɵɵclassProp("NgxEditor--Disabled", ctx.disabled);
        ɵɵdomProperty("disabled", ctx.disabled)("innerHTML", ɵɵpipeBind1(1, 6, ctx.html), ɵɵsanitizeHtml)("title", ɵɵpipeBind1(2, 8, ctx.getTitle(ctx.name)));
        ɵɵattribute("aria-label", ɵɵpipeBind1(3, 10, ctx.getTitle(ctx.name)));
      }
    },
    dependencies: [AsyncPipe, SanitizeHtmlPipe],
    encapsulation: 2
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(InsertCommandComponent, [{
    type: Component,
    args: [{
      selector: "ngx-insert-command",
      imports: [AsyncPipe, SanitizeHtmlPipe],
      template: '<button\n  type="button"\n  class="NgxEditor__MenuItem--Icon"\n  [disabled]="disabled"\n  [class.NgxEditor--Disabled]="disabled"\n  [innerHTML]="html | sanitizeHtml"\n  (mousedown)="onMouseClick($event)"\n  (keydown.enter)="onKeydown()"\n  (keydown.space)="onKeydown()"\n  [title]="getTitle(name) | async"\n  [ariaLabel]="getTitle(name) | async"\n></button>\n'
    }]
  }], () => [{
    type: NgxEditorService
  }, {
    type: MenuService
  }], {
    toolbarItem: [{
      type: Input
    }]
  });
})();
var DEFAULT_LINK_OPTIONS = {
  showOpenInNewTab: true
};
var LinkComponent = class _LinkComponent {
  el;
  ngxeService;
  menuService;
  options = DEFAULT_LINK_OPTIONS;
  showPopup = false;
  isActive = false;
  canExecute = true;
  componentId = uniq();
  form;
  editorView;
  updateSubscription;
  constructor(el, ngxeService, menuService) {
    this.el = el;
    this.ngxeService = ngxeService;
    this.menuService = menuService;
  }
  get icon() {
    return this.ngxeService.getIcon(this.isActive ? "unlink" : "link");
  }
  get title() {
    return this.ngxeService.locals.get(this.isActive ? "removeLink" : "insertLink");
  }
  get href() {
    return this.form.get("href");
  }
  get text() {
    return this.form.get("text");
  }
  onDocumentClick(e) {
    if (!this.el.nativeElement.contains(e.target) && this.showPopup) {
      this.hidePopup();
    }
  }
  getId(name) {
    return `${name}-${this.componentId}`;
  }
  getLabel(key) {
    return this.ngxeService.locals.get(key);
  }
  hidePopup() {
    this.showPopup = false;
    this.form.reset({
      href: "",
      text: "",
      openInNewTab: true
    });
    this.text.enable();
  }
  togglePopup() {
    const {
      state,
      dispatch
    } = this.editorView;
    if (this.isActive) {
      Link2.remove(state, dispatch);
      return;
    }
    this.showPopup = !this.showPopup;
    if (this.showPopup) {
      this.setText();
    }
  }
  onTogglePopupMouseClick(e) {
    if (e.button !== 0) {
      return;
    }
    this.togglePopup();
  }
  onTogglePopupKeydown() {
    this.togglePopup();
  }
  setText = () => {
    const {
      state: {
        selection,
        doc
      }
    } = this.editorView;
    const {
      empty,
      from: from2,
      to
    } = selection;
    const selectedText = !empty ? doc.textBetween(from2, to) : "";
    if (selectedText) {
      this.text.patchValue(selectedText);
      this.text.disable();
    }
  };
  update = (view) => {
    const {
      state
    } = view;
    this.isActive = Link2.isActive(state, {
      strict: false
    });
    this.canExecute = Link2.canExecute(state);
  };
  insertLink(e) {
    e.preventDefault();
    const {
      text,
      href,
      openInNewTab
    } = this.form.getRawValue();
    const {
      dispatch,
      state
    } = this.editorView;
    const {
      selection
    } = state;
    let target;
    if (this.options.showOpenInNewTab) {
      target = openInNewTab ? "_blank" : "_self";
    }
    const attrs = {
      title: href,
      href,
      target
    };
    if (selection.empty) {
      Link2.insert(text, attrs)(state, dispatch);
      this.editorView.focus();
    } else {
      Link2.update(attrs)(state, dispatch);
    }
    this.hidePopup();
  }
  ngOnInit() {
    this.editorView = this.menuService.editor.view;
    this.form = new FormGroup({
      href: new FormControl("", [Validators.required, Validators.pattern(this.menuService.editor.linkValidationPattern)]),
      text: new FormControl("", [Validators.required]),
      openInNewTab: new FormControl(true)
    });
    this.updateSubscription = this.menuService.editor.update.subscribe((view) => {
      this.update(view);
    });
  }
  ngOnDestroy() {
    this.updateSubscription.unsubscribe();
  }
  static ɵfac = function LinkComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _LinkComponent)(ɵɵdirectiveInject(ElementRef), ɵɵdirectiveInject(NgxEditorService), ɵɵdirectiveInject(MenuService));
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _LinkComponent,
    selectors: [["ngx-link"]],
    hostBindings: function LinkComponent_HostBindings(rf, ctx) {
      if (rf & 1) {
        ɵɵlistener("mousedown", function LinkComponent_mousedown_HostBindingHandler($event) {
          return ctx.onDocumentClick($event);
        }, ɵɵresolveDocument);
      }
    },
    inputs: {
      options: [2, "options", "options", (value) => __spreadValues(__spreadValues({}, DEFAULT_LINK_OPTIONS), value)]
    },
    decls: 5,
    vars: 16,
    consts: [["type", "button", "aria-haspopup", "dialog", 1, "NgxEditor__MenuItem--Icon", 3, "mousedown", "keydown.enter", "keydown.space", "disabled", "innerHTML", "title", "ariaLabel", "ariaExpanded"], ["class", "NgxEditor__Popup", 4, "ngIf"], [1, "NgxEditor__Popup"], [1, "NgxEditor__Popup--Form", 3, "ngSubmit", "formGroup"], [1, "NgxEditor__Popup--FormGroup"], [1, "NgxEditor__Popup--Col"], [1, "NgxEditor__Popup--Label", 3, "htmlFor"], ["type", "url", "formControlName", "href", "autocomplete", "off", 3, "id"], ["class", "NgxEditor__HelpText NgxEditor__HelpText--Error", 4, "ngIf"], ["type", "text", "formControlName", "text", "autocomplete", "off", 3, "id"], ["class", "NgxEditor__Popup--FormGroup", 4, "ngIf"], ["type", "submit", 3, "disabled"], [1, "NgxEditor__HelpText", "NgxEditor__HelpText--Error"], ["type", "checkbox", "formControlName", "openInNewTab"]],
    template: function LinkComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵelementStart(0, "button", 0);
        ɵɵpipe(1, "sanitizeHtml");
        ɵɵpipe(2, "async");
        ɵɵpipe(3, "async");
        ɵɵlistener("mousedown", function LinkComponent_Template_button_mousedown_0_listener($event) {
          return ctx.onTogglePopupMouseClick($event);
        })("keydown.enter", function LinkComponent_Template_button_keydown_enter_0_listener() {
          return ctx.onTogglePopupKeydown();
        })("keydown.space", function LinkComponent_Template_button_keydown_space_0_listener() {
          return ctx.onTogglePopupKeydown();
        });
        ɵɵelementEnd();
        ɵɵtemplate(4, LinkComponent_div_4_Template, 20, 18, "div", 1);
      }
      if (rf & 2) {
        ɵɵclassProp("NgxEditor__MenuItem--Active", ctx.isActive || ctx.showPopup)("NgxEditor--Disabled", !ctx.canExecute);
        ɵɵproperty("disabled", !ctx.canExecute)("innerHTML", ɵɵpipeBind1(1, 10, ctx.icon), ɵɵsanitizeHtml)("title", ɵɵpipeBind1(2, 12, ctx.title));
        ɵɵariaProperty("ariaLabel", ɵɵpipeBind1(3, 14, ctx.title))("ariaExpanded", ctx.showPopup);
        ɵɵadvance(4);
        ɵɵproperty("ngIf", ctx.showPopup);
      }
    },
    dependencies: [AsyncPipe, CommonModule, NgIf, ReactiveFormsModule, ɵNgNoValidate, DefaultValueAccessor, CheckboxControlValueAccessor, NgControlStatus, NgControlStatusGroup, FormGroupDirective, FormControlName, SanitizeHtmlPipe],
    encapsulation: 2
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(LinkComponent, [{
    type: Component,
    args: [{
      selector: "ngx-link",
      imports: [AsyncPipe, CommonModule, ReactiveFormsModule, SanitizeHtmlPipe],
      template: `<button
  type="button"
  class="NgxEditor__MenuItem--Icon"
  [class.NgxEditor__MenuItem--Active]="isActive || showPopup"
  [class.NgxEditor--Disabled]="!canExecute"
  [disabled]="!canExecute"
  [innerHTML]="icon | sanitizeHtml"
  (mousedown)="onTogglePopupMouseClick($event)"
  (keydown.enter)="onTogglePopupKeydown()"
  (keydown.space)="onTogglePopupKeydown()"
  [title]="title | async"
  [ariaLabel]="title | async"
  aria-haspopup="dialog"
  [ariaExpanded]="showPopup"
></button>

<!-- popup -->
<div *ngIf="showPopup" class="NgxEditor__Popup">
  <form class="NgxEditor__Popup--Form" [formGroup]="form" (ngSubmit)="insertLink($event)">
    <div class="NgxEditor__Popup--FormGroup">
      <div class="NgxEditor__Popup--Col">
        <label class="NgxEditor__Popup--Label" [htmlFor]="getId('link-popup-url')">{{ getLabel('url') | async }}</label>
        <input type="url" [id]="getId('link-popup-url')" formControlName="href" autocomplete="off" />
        <div *ngIf="href.touched && href.invalid" class="NgxEditor__HelpText NgxEditor__HelpText--Error">
          {{ href.errors?.['pattern'] && getLabel('enterValidUrl') | async }}
        </div>
      </div>
    </div>

    <div class="NgxEditor__Popup--FormGroup">
      <div class="NgxEditor__Popup--Col">
        <label class="NgxEditor__Popup--Label" [htmlFor]="getId('link-popup-label')">{{
          getLabel('text') | async
        }}</label>
        <input type="text" [id]="getId('link-popup-label')" formControlName="text" autocomplete="off" />
        <div *ngIf="text.touched && text.invalid" class="NgxEditor__HelpText NgxEditor__HelpText--Error">
          {{ text.errors?.['required'] && 'This is required' }}
        </div>
      </div>
    </div>

    <div class="NgxEditor__Popup--FormGroup" *ngIf="this.options.showOpenInNewTab">
      <div class="NgxEditor__Popup--Col">
        <label>
          <input type="checkbox" formControlName="openInNewTab" />
          {{ getLabel('openInNewTab') | async }}
        </label>
      </div>
    </div>

    <button type="submit" [disabled]="!form.valid">{{ getLabel('insert') | async }}</button>
  </form>
</div>
`
    }]
  }], () => [{
    type: ElementRef
  }, {
    type: NgxEditorService
  }, {
    type: MenuService
  }], {
    options: [{
      type: Input,
      args: [{
        transform: (value) => __spreadValues(__spreadValues({}, DEFAULT_LINK_OPTIONS), value)
      }]
    }],
    onDocumentClick: [{
      type: HostListener,
      args: ["document:mousedown", ["$event"]]
    }]
  });
})();
var ToggleCommandComponent = class _ToggleCommandComponent {
  ngxeService;
  menuService;
  toolbarItem;
  get name() {
    return this.toolbarItem;
  }
  html;
  editorView;
  isActive = false;
  disabled = false;
  updateSubscription;
  constructor(ngxeService, menuService) {
    this.ngxeService = ngxeService;
    this.menuService = menuService;
  }
  toggle() {
    const {
      state,
      dispatch
    } = this.editorView;
    const command = ToggleCommands[this.name];
    command.toggle()(state, dispatch);
  }
  onMouseClick(e) {
    e.preventDefault();
    if (e.button !== 0) {
      return;
    }
    this.toggle();
  }
  onKeydown() {
    this.toggle();
  }
  update = (view) => {
    const {
      state
    } = view;
    const command = ToggleCommands[this.name];
    this.isActive = command.isActive(state);
    this.disabled = !command.canExecute(state);
  };
  getTitle(name) {
    return this.ngxeService.locals.get(name);
  }
  ngOnInit() {
    this.html = this.ngxeService.getIcon(this.name);
    this.editorView = this.menuService.editor.view;
    this.updateSubscription = this.menuService.editor.update.subscribe((view) => {
      this.update(view);
    });
  }
  ngOnDestroy() {
    this.updateSubscription.unsubscribe();
  }
  static ɵfac = function ToggleCommandComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ToggleCommandComponent)(ɵɵdirectiveInject(NgxEditorService), ɵɵdirectiveInject(MenuService));
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _ToggleCommandComponent,
    selectors: [["ngx-toggle-command"]],
    inputs: {
      toolbarItem: "toolbarItem"
    },
    decls: 4,
    vars: 14,
    consts: [["type", "button", 1, "NgxEditor__MenuItem--Icon", 3, "mousedown", "keydown.enter", "keydown.space", "disabled", "innerHTML", "title", "ariaLabel"]],
    template: function ToggleCommandComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵdomElementStart(0, "button", 0);
        ɵɵpipe(1, "sanitizeHtml");
        ɵɵpipe(2, "async");
        ɵɵpipe(3, "async");
        ɵɵdomListener("mousedown", function ToggleCommandComponent_Template_button_mousedown_0_listener($event) {
          return ctx.onMouseClick($event);
        })("keydown.enter", function ToggleCommandComponent_Template_button_keydown_enter_0_listener() {
          return ctx.onKeydown();
        })("keydown.space", function ToggleCommandComponent_Template_button_keydown_space_0_listener() {
          return ctx.onKeydown();
        });
        ɵɵdomElementEnd();
      }
      if (rf & 2) {
        ɵɵclassProp("NgxEditor__MenuItem--Active", ctx.isActive)("NgxEditor--Disabled", ctx.disabled);
        ɵɵdomProperty("disabled", ctx.disabled)("innerHTML", ɵɵpipeBind1(1, 8, ctx.html), ɵɵsanitizeHtml)("title", ɵɵpipeBind1(2, 10, ctx.getTitle(ctx.name)));
        ɵɵattribute("aria-label", ɵɵpipeBind1(3, 12, ctx.getTitle(ctx.name)));
      }
    },
    dependencies: [AsyncPipe, SanitizeHtmlPipe],
    encapsulation: 2
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ToggleCommandComponent, [{
    type: Component,
    args: [{
      selector: "ngx-toggle-command",
      imports: [AsyncPipe, SanitizeHtmlPipe],
      template: '<button\n  type="button"\n  class="NgxEditor__MenuItem--Icon"\n  [class.NgxEditor__MenuItem--Active]="isActive"\n  [class.NgxEditor--Disabled]="disabled"\n  [disabled]="disabled"\n  [innerHTML]="html | sanitizeHtml"\n  (mousedown)="onMouseClick($event)"\n  (keydown.enter)="onKeydown()"\n  (keydown.space)="onKeydown()"\n  [title]="getTitle(name) | async"\n  [ariaLabel]="getTitle(name) | async"\n></button>\n'
    }]
  }], () => [{
    type: NgxEditorService
  }, {
    type: MenuService
  }], {
    toolbarItem: [{
      type: Input
    }]
  });
})();
var DEFAULT_TOOLBAR = [["bold", "italic"], ["code", "blockquote"], ["underline", "strike"], ["ordered_list", "bullet_list"], [{
  heading: ["h1", "h2", "h3", "h4", "h5", "h6"]
}], ["link", "image"], ["text_color", "background_color"], ["align_left", "align_center", "align_right", "align_justify"], ["format_clear"]];
var TOOLBAR_MINIMAL = [["bold", "italic"], [{
  heading: ["h1", "h2", "h3", "h4", "h5", "h6"]
}], ["link", "image"], ["text_color", "background_color"]];
var TOOLBAR_FULL = [["bold", "italic"], ["code", "blockquote"], ["underline", "strike"], ["ordered_list", "bullet_list"], [{
  heading: ["h1", "h2", "h3", "h4", "h5", "h6"]
}], ["link", "image"], ["text_color", "background_color"], ["align_left", "align_center", "align_right", "align_justify"], ["horizontal_rule", "format_clear", "indent", "outdent"], ["superscript", "subscript"], ["undo", "redo"]];
var DEFAULT_COLOR_PRESETS = ["#b60205", "#d93f0b", "#fbca04", "#0e8a16", "#006b75", "#1d76db", "#0052cc", "#5319e7", "#e99695", "#f9d0c4", "#fef2c0", "#c2e0c6", "#bfdadc", "#c5def5", "#bfd4f2", "#d4c5f9"];
var NgxEditorMenuComponent = class _NgxEditorMenuComponent {
  menuService;
  toolbar = TOOLBAR_MINIMAL;
  colorPresets = DEFAULT_COLOR_PRESETS;
  disabled = false;
  editor;
  customMenuRef = null;
  dropdownPlacement = "bottom";
  toggleCommands = ["bold", "italic", "underline", "strike", "code", "blockquote", "ordered_list", "bullet_list", "align_left", "align_center", "align_right", "align_justify", "superscript", "subscript"];
  insertCommands = ["horizontal_rule", "format_clear", "indent", "outdent", "undo", "redo"];
  iconContainerClass = ["NgxEditor__MenuItem", "NgxEditor__MenuItem--IconContainer"];
  dropdownContainerClass = ["NgxEditor__Dropdown"];
  seperatorClass = ["NgxEditor__Seperator"];
  constructor(menuService) {
    this.menuService = menuService;
  }
  get presets() {
    const col = 8;
    const colors = [];
    this.colorPresets.forEach((color, index) => {
      const row = Math.floor(index / col);
      if (!colors[row]) {
        colors.push([]);
      }
      colors[row].push(color);
    });
    return colors;
  }
  trackByIndex(index) {
    return index;
  }
  isDropDown(item) {
    if (item?.heading) {
      return true;
    }
    return false;
  }
  getDropdownItems(item) {
    return item;
  }
  isLinkItem(item) {
    if (item === "link") {
      return true;
    }
    return typeof item === "object" && typeof item?.link === "object";
  }
  isLinkWithOptions(item) {
    return typeof item === "object" && typeof item?.link === "object";
  }
  getLinkOptions(item) {
    return item?.link;
  }
  ngOnInit() {
    if (!this.editor) {
      throw new NgxEditorError("Required editor instance to initialize menu component");
    }
    this.menuService.editor = this.editor;
  }
  static ɵfac = function NgxEditorMenuComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NgxEditorMenuComponent)(ɵɵdirectiveInject(MenuService));
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _NgxEditorMenuComponent,
    selectors: [["ngx-editor-menu"]],
    inputs: {
      toolbar: "toolbar",
      colorPresets: "colorPresets",
      disabled: "disabled",
      editor: "editor",
      customMenuRef: "customMenuRef",
      dropdownPlacement: "dropdownPlacement"
    },
    features: [ɵɵProvidersFeature([MenuService])],
    decls: 3,
    vars: 7,
    consts: [[1, "NgxEditor__MenuBar", 3, "ngClass"], [4, "ngFor", "ngForOf", "ngForTrackBy"], [4, "ngIf"], [3, "toolbarItem", "class", 4, "ngIf"], [3, "class", 4, "ngIf"], ["type", "text_color", 3, "class", "presets", 4, "ngIf"], ["type", "background_color", 3, "class", "presets", 4, "ngIf"], [3, "toolbarItem"], [3, "options"], [3, "class", "group", "items", 4, "ngFor", "ngForOf", "ngForTrackBy"], [3, "group", "items"], ["type", "text_color", 3, "presets"], ["type", "background_color", 3, "presets"], [3, "ngTemplateOutlet"]],
    template: function NgxEditorMenuComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵelementStart(0, "div", 0);
        ɵɵtemplate(1, NgxEditorMenuComponent_ng_container_1_Template, 2, 2, "ng-container", 1)(2, NgxEditorMenuComponent_ng_container_2_Template, 2, 1, "ng-container", 2);
        ɵɵelementEnd();
      }
      if (rf & 2) {
        ɵɵproperty("ngClass", ɵɵpureFunction2(4, _c7, ctx.disabled, ctx.dropdownPlacement === "top"));
        ɵɵadvance();
        ɵɵproperty("ngForOf", ctx.toolbar)("ngForTrackBy", ctx.trackByIndex);
        ɵɵadvance();
        ɵɵproperty("ngIf", ctx.customMenuRef);
      }
    },
    dependencies: [CommonModule, NgClass, NgForOf, NgIf, NgTemplateOutlet, KeyValuePipe, ColorPickerComponent, DropdownComponent, ToggleCommandComponent, InsertCommandComponent, LinkComponent, ImageComponent],
    encapsulation: 2
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgxEditorMenuComponent, [{
    type: Component,
    args: [{
      selector: "ngx-editor-menu",
      providers: [MenuService],
      imports: [CommonModule, ColorPickerComponent, DropdownComponent, ToggleCommandComponent, InsertCommandComponent, LinkComponent, ImageComponent],
      template: `<div
  class="NgxEditor__MenuBar"
  [ngClass]="{ 'NgxEditor--Disabled': disabled, 'NgxEditor__MenuBar--Reverse': dropdownPlacement === 'top' }"
>
  <ng-container *ngFor="let toolbarItem of toolbar; let lastToolbarItem = last; trackBy: trackByIndex">
    <ng-container *ngFor="let item of toolbarItem; let lastItem = last; trackBy: trackByIndex">
      <!-- toggle icons -->
      <ngx-toggle-command [toolbarItem]="item" [class]="iconContainerClass" *ngIf="toggleCommands.includes(item)">
      </ngx-toggle-command>

      <ngx-insert-command [toolbarItem]="item" [class]="iconContainerClass" *ngIf="insertCommands.includes(item)">
      </ngx-insert-command>

      <!-- link -->
      <ng-container *ngIf="isLinkItem(item)">
        <ngx-link [class]="iconContainerClass" [options]="getLinkOptions(item)"></ngx-link>
      </ng-container>

      <!-- image -->
      <ngx-image [class]="iconContainerClass" *ngIf="item === 'image'"> </ngx-image>

      <!-- dropdown -->
      <ng-container *ngIf="isDropDown(item)">
        <ngx-dropdown
          *ngFor="let dropdownItem of getDropdownItems(item) | keyvalue; trackBy: trackByIndex"
          [class]="dropdownContainerClass"
          [group]="dropdownItem.key"
          [items]="dropdownItem.value"
        >
        </ngx-dropdown>
      </ng-container>

      <!-- text color picker -->
      <ngx-color-picker
        [class]="iconContainerClass"
        *ngIf="item === 'text_color'"
        type="text_color"
        [presets]="presets"
      >
      </ngx-color-picker>
      <!-- background color picker -->
      <ngx-color-picker
        [class]="iconContainerClass"
        *ngIf="item === 'background_color'"
        type="background_color"
        [presets]="presets"
      >
      </ngx-color-picker>

      <!-- seperator -->
      <div [class]="seperatorClass" *ngIf="lastItem && !lastToolbarItem"></div>
    </ng-container>
  </ng-container>

  <!-- custom menu -->
  <ng-container *ngIf="customMenuRef">
    <ng-container [ngTemplateOutlet]="customMenuRef"></ng-container>
  </ng-container>
</div>
`
    }]
  }], () => [{
    type: MenuService
  }], {
    toolbar: [{
      type: Input
    }],
    colorPresets: [{
      type: Input
    }],
    disabled: [{
      type: Input
    }],
    editor: [{
      type: Input
    }],
    customMenuRef: [{
      type: Input
    }],
    dropdownPlacement: [{
      type: Input
    }]
  });
})();
var BubbleComponent = class _BubbleComponent {
  sanitizeHTML;
  ngxeService;
  constructor(sanitizeHTML, ngxeService) {
    this.sanitizeHTML = sanitizeHTML;
    this.ngxeService = ngxeService;
  }
  get view() {
    return this.editor.view;
  }
  editor;
  updateSubscription;
  execulableItems = [];
  activeItems = [];
  toolbar = [["bold", "italic", "underline", "strike"], ["ordered_list", "bullet_list", "blockquote", "code"], ["align_left", "align_center", "align_right", "align_justify"]];
  toggleCommands = ["bold", "italic", "underline", "strike", "ordered_list", "bullet_list", "blockquote", "code", "align_left", "align_center", "align_right", "align_justify"];
  getIcon(name) {
    return this.sanitizeHTML.transform(this.ngxeService.getIcon(name));
  }
  getTitle(name) {
    return this.ngxeService.locals.get(name);
  }
  trackByIndex(index) {
    return index;
  }
  onClick(e, commandName) {
    e.preventDefault();
    e.stopPropagation();
    if (e.button !== 0) {
      return;
    }
    const {
      state,
      dispatch
    } = this.view;
    const command = ToggleCommands[commandName];
    command.toggle()(state, dispatch);
  }
  update(view) {
    this.activeItems = [];
    this.execulableItems = [];
    const {
      state
    } = view;
    this.toggleCommands.forEach((toolbarItem) => {
      const command = ToggleCommands[toolbarItem];
      const isActive = command.isActive(state);
      if (isActive) {
        this.activeItems.push(toolbarItem);
      }
      const canExecute = command.canExecute(state);
      if (canExecute) {
        this.execulableItems.push(toolbarItem);
      }
    });
  }
  ngOnInit() {
    this.updateSubscription = this.editor.update.subscribe((view) => {
      this.update(view);
    });
  }
  ngOnDestroy() {
    this.updateSubscription.unsubscribe();
  }
  static ɵfac = function BubbleComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BubbleComponent)(ɵɵdirectiveInject(SanitizeHtmlPipe), ɵɵdirectiveInject(NgxEditorService));
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _BubbleComponent,
    selectors: [["ngx-bubble"]],
    inputs: {
      editor: "editor"
    },
    features: [ɵɵProvidersFeature([SanitizeHtmlPipe])],
    decls: 1,
    vars: 2,
    consts: [[4, "ngFor", "ngForOf", "ngForTrackBy"], ["type", "button", "class", "NgxBubbleMenu__Icon", 3, "ngClass", "title", "innerHTML", "mousedown", 4, "ngIf"], ["class", "NgxBubbleMenu__Seperator", 4, "ngIf"], ["type", "button", 1, "NgxBubbleMenu__Icon", 3, "mousedown", "ngClass", "title", "innerHTML"], [1, "NgxBubbleMenu__Seperator"]],
    template: function BubbleComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵtemplate(0, BubbleComponent_ng_container_0_Template, 2, 2, "ng-container", 0);
      }
      if (rf & 2) {
        ɵɵproperty("ngForOf", ctx.toolbar)("ngForTrackBy", ctx.trackByIndex);
      }
    },
    dependencies: [AsyncPipe, CommonModule, NgClass, NgForOf, NgIf],
    styles: ["*[_ngcontent-%COMP%], *[_ngcontent-%COMP%]:before, *[_ngcontent-%COMP%]:after{box-sizing:border-box}[_nghost-%COMP%]{display:flex;flex-wrap:wrap;background-color:var(--ngx-editor-bubble-bg-color);color:var(--ngx-editor-bubble-text-color);padding:5px;border-radius:4px}.NgxBubbleMenu__Icon[_ngcontent-%COMP%]{all:unset;appearance:none;height:var(--ngx-editor-icon-size);width:var(--ngx-editor-icon-size);transition:.2s ease-in-out;border-radius:var(--ngx-editor-menu-item-border-radius);display:flex;align-items:center;justify-content:center;color:#fff}.NgxBubbleMenu__Icon[_ngcontent-%COMP%]:hover{background-color:var(--ngx-editor-bubble-item-hover-color)}.NgxBubbleMenu__Icon[_ngcontent-%COMP%] + .NgxBubbleMenu__Icon[_ngcontent-%COMP%]{margin-left:5px}.NgxBubbleMenu__Icon.NgxBubbleMenu__Icon--Active[_ngcontent-%COMP%]{background-color:var(--ngx-editor-bubble-text-color);color:var(--ngx-editor-bubble-bg-color)}.NgxBubbleMenu__Seperator[_ngcontent-%COMP%]{border-left:1px solid var(--ngx-editor-seperator-color);margin:0 5px}"]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BubbleComponent, [{
    type: Component,
    args: [{
      selector: "ngx-bubble",
      imports: [AsyncPipe, CommonModule],
      providers: [SanitizeHtmlPipe],
      template: `<ng-container *ngFor="let toolbarItem of toolbar; let lastToolbarItem = last; trackBy: trackByIndex">
  <ng-container *ngFor="let item of toolbarItem; let lastItem = last; trackBy: trackByIndex">
    <button
      type="button"
      class="NgxBubbleMenu__Icon"
      *ngIf="toggleCommands.includes(item)"
      [ngClass]="{
        'NgxBubbleMenu__Icon--Active': this.activeItems.includes(item),
        'NgxEditor--Disabled': !this.execulableItems.includes(item)
      }"
      (mousedown)="onClick($event, item)"
      [title]="getTitle(item) | async"
      [innerHTML]="getIcon(item)"
    ></button>
    <div class="NgxBubbleMenu__Seperator" *ngIf="lastItem && !lastToolbarItem"></div>
  </ng-container>
</ng-container>
`,
      styles: ["*,*:before,*:after{box-sizing:border-box}:host{display:flex;flex-wrap:wrap;background-color:var(--ngx-editor-bubble-bg-color);color:var(--ngx-editor-bubble-text-color);padding:5px;border-radius:4px}.NgxBubbleMenu__Icon{all:unset;appearance:none;height:var(--ngx-editor-icon-size);width:var(--ngx-editor-icon-size);transition:.2s ease-in-out;border-radius:var(--ngx-editor-menu-item-border-radius);display:flex;align-items:center;justify-content:center;color:#fff}.NgxBubbleMenu__Icon:hover{background-color:var(--ngx-editor-bubble-item-hover-color)}.NgxBubbleMenu__Icon+.NgxBubbleMenu__Icon{margin-left:5px}.NgxBubbleMenu__Icon.NgxBubbleMenu__Icon--Active{background-color:var(--ngx-editor-bubble-text-color);color:var(--ngx-editor-bubble-bg-color)}.NgxBubbleMenu__Seperator{border-left:1px solid var(--ngx-editor-seperator-color);margin:0 5px}\n"]
    }]
  }], () => [{
    type: SanitizeHtmlPipe
  }, {
    type: NgxEditorService
  }], {
    editor: [{
      type: Input
    }]
  });
})();
var NgxEditorFloatingMenuComponent = class _NgxEditorFloatingMenuComponent {
  el;
  constructor(el) {
    this.el = el;
  }
  get display() {
    return {
      visibility: this.showMenu ? "visible" : "hidden",
      opacity: this.showMenu ? "1" : "0",
      top: `${this.posTop}px`,
      left: `${this.posLeft}px`
    };
  }
  get view() {
    return this.editor.view;
  }
  editor;
  autoPlace = false;
  posLeft = 0;
  posTop = 0;
  showMenu = false;
  updateSubscription;
  dragging = false;
  resizeSubscription;
  onMouseDown(e) {
    const target = e.target;
    if (this.el.nativeElement.contains(target) && target.nodeName !== "INPUT") {
      e.preventDefault();
      return;
    }
    this.dragging = true;
  }
  onKeyDown(e) {
    const target = e.target;
    if (target.nodeName === "INPUT") {
      return;
    }
    this.dragging = true;
    this.hide();
  }
  onMouseUp(e) {
    const target = e.target;
    if (this.el.nativeElement.contains(target) || target.nodeName === "INPUT") {
      e.preventDefault();
      return;
    }
    this.dragging = false;
    this.useUpdate();
  }
  onKeyUp(e) {
    const target = e.target;
    if (target.nodeName === "INPUT") {
      return;
    }
    this.dragging = false;
    this.useUpdate();
  }
  useUpdate() {
    if (!this.view) {
      return;
    }
    this.update(this.view);
  }
  hide() {
    this.showMenu = false;
  }
  show() {
    this.showMenu = true;
  }
  calculateBubblePosition(view) {
    return __async(this, null, function* () {
      const {
        state: {
          selection
        }
      } = view;
      const {
        from: from2,
        to
      } = selection;
      const start = view.coordsAtPos(from2);
      const end = view.coordsAtPos(to);
      const selectionElement = {
        getBoundingClientRect() {
          if (selection instanceof NodeSelection) {
            const node = view.nodeDOM(from2);
            return node.getBoundingClientRect();
          }
          const {
            top: top2,
            left: left2
          } = start;
          const {
            bottom,
            right
          } = end;
          return {
            x: left2,
            y: top2,
            top: top2,
            bottom,
            left: left2,
            right,
            width: right - left2,
            height: bottom - top2
          };
        }
      };
      const bubbleEl = this.el.nativeElement;
      const {
        x: left,
        y: top
      } = yield computePosition2(selectionElement, bubbleEl, {
        placement: "top",
        middleware: [offset2(5), this.autoPlace && autoPlacement2({
          boundary: view.dom,
          padding: 5,
          allowedPlacements: ["top", "bottom"]
        }), {
          // prevent overflow on right and left side
          // since only top and bottom placements are allowed
          // autoplacement can't handle overflows on the right and left
          name: "overflowMiddleware",
          fn(middlewareArgs) {
            return __async(this, null, function* () {
              const overflow = yield detectOverflow2(middlewareArgs, {
                boundary: view.dom,
                padding: 5
              });
              if (overflow.left > 0) {
                return {
                  x: middlewareArgs.x + overflow.left
                };
              }
              if (overflow.right > 0) {
                return {
                  x: middlewareArgs.x - overflow.right
                };
              }
              return {};
            });
          }
        }].filter(Boolean)
      });
      return {
        left,
        top
      };
    });
  }
  canShowMenu(view) {
    const {
      state
    } = view;
    const {
      selection
    } = state;
    const {
      empty
    } = selection;
    if (selection instanceof NodeSelection) {
      if (selection.node.type.name === "image") {
        return false;
      }
    }
    const hasFocus = this.view.hasFocus();
    if (!hasFocus || empty || this.dragging) {
      this.hide();
      return false;
    }
    return true;
  }
  update(view) {
    const canShowMenu = this.canShowMenu(view);
    if (!canShowMenu) {
      this.hide();
      return;
    }
    this.calculateBubblePosition(this.view).then(({
      top,
      left
    }) => {
      if (!this.canShowMenu) {
        this.hide();
        return;
      }
      this.posLeft = left;
      this.posTop = top;
      this.show();
    });
  }
  ngOnInit() {
    if (!this.editor) {
      throw new NgxEditorError("Required editor instance to initialize floating menu component");
    }
    this.updateSubscription = this.editor.update.subscribe((view) => {
      this.update(view);
    });
    this.resizeSubscription = fromEvent(window, "resize").pipe(throttleTime(500, asyncScheduler, {
      leading: true,
      trailing: true
    })).subscribe(() => {
      this.useUpdate();
    });
  }
  ngOnDestroy() {
    this.updateSubscription.unsubscribe();
    this.resizeSubscription.unsubscribe();
  }
  static ɵfac = function NgxEditorFloatingMenuComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NgxEditorFloatingMenuComponent)(ɵɵdirectiveInject(ElementRef));
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _NgxEditorFloatingMenuComponent,
    selectors: [["ngx-editor-floating-menu"]],
    hostVars: 2,
    hostBindings: function NgxEditorFloatingMenuComponent_HostBindings(rf, ctx) {
      if (rf & 1) {
        ɵɵlistener("mousedown", function NgxEditorFloatingMenuComponent_mousedown_HostBindingHandler($event) {
          return ctx.onMouseDown($event);
        }, ɵɵresolveDocument)("keydown", function NgxEditorFloatingMenuComponent_keydown_HostBindingHandler($event) {
          return ctx.onKeyDown($event);
        }, ɵɵresolveDocument)("mouseup", function NgxEditorFloatingMenuComponent_mouseup_HostBindingHandler($event) {
          return ctx.onMouseUp($event);
        }, ɵɵresolveDocument)("keyup", function NgxEditorFloatingMenuComponent_keyup_HostBindingHandler($event) {
          return ctx.onKeyUp($event);
        }, ɵɵresolveDocument);
      }
      if (rf & 2) {
        ɵɵstyleMap(ctx.display);
      }
    },
    inputs: {
      editor: "editor",
      autoPlace: "autoPlace"
    },
    ngContentSelectors: _c3,
    decls: 4,
    vars: 1,
    consts: [["ref", ""], [4, "ngIf"], [3, "editor"]],
    template: function NgxEditorFloatingMenuComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵprojectionDef();
        ɵɵelementStart(0, "div", null, 0);
        ɵɵprojection(2);
        ɵɵelementEnd();
        ɵɵtemplate(3, NgxEditorFloatingMenuComponent_ng_container_3_Template, 2, 1, "ng-container", 1);
      }
      if (rf & 2) {
        const ref_r2 = ɵɵreference(1);
        ɵɵadvance(3);
        ɵɵproperty("ngIf", ref_r2.children.length === 0);
      }
    },
    dependencies: [BubbleComponent, CommonModule, NgIf],
    styles: ["*[_ngcontent-%COMP%], *[_ngcontent-%COMP%]:before, *[_ngcontent-%COMP%]:after{box-sizing:border-box}[_nghost-%COMP%]{position:absolute;z-index:20;margin-bottom:5px;visibility:hidden;opacity:0}"]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgxEditorFloatingMenuComponent, [{
    type: Component,
    args: [{
      selector: "ngx-editor-floating-menu",
      imports: [BubbleComponent, CommonModule],
      template: '<div #ref>\n  <ng-content></ng-content>\n</div>\n<ng-container *ngIf="ref.children.length === 0">\n  <ngx-bubble [editor]="editor"></ngx-bubble>\n</ng-container>\n',
      styles: ["*,*:before,*:after{box-sizing:border-box}:host{position:absolute;z-index:20;margin-bottom:5px;visibility:hidden;opacity:0}\n"]
    }]
  }], () => [{
    type: ElementRef
  }], {
    display: [{
      type: HostBinding,
      args: ["style"]
    }],
    editor: [{
      type: Input
    }],
    autoPlace: [{
      type: Input
    }],
    onMouseDown: [{
      type: HostListener,
      args: ["document:mousedown", ["$event"]]
    }],
    onKeyDown: [{
      type: HostListener,
      args: ["document:keydown", ["$event"]]
    }],
    onMouseUp: [{
      type: HostListener,
      args: ["document:mouseup", ["$event"]]
    }],
    onKeyUp: [{
      type: HostListener,
      args: ["document:keyup", ["$event"]]
    }]
  });
})();
var MenuModule = class _MenuModule {
  static ɵfac = function MenuModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MenuModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _MenuModule,
    imports: [
      CommonModule,
      ReactiveFormsModule,
      // pipes
      SanitizeHtmlPipe,
      // components
      NgxEditorMenuComponent,
      ToggleCommandComponent,
      InsertCommandComponent,
      LinkComponent,
      DropdownComponent,
      ImageComponent,
      ColorPickerComponent,
      NgxEditorFloatingMenuComponent,
      BubbleComponent
    ],
    exports: [NgxEditorMenuComponent, NgxEditorFloatingMenuComponent]
  });
  static ɵinj = ɵɵdefineInjector({
    providers: [SanitizeHtmlPipe],
    imports: [
      CommonModule,
      ReactiveFormsModule,
      // components
      NgxEditorMenuComponent,
      LinkComponent,
      DropdownComponent,
      ImageComponent,
      ColorPickerComponent,
      NgxEditorFloatingMenuComponent,
      BubbleComponent
    ]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MenuModule, [{
    type: NgModule,
    args: [{
      imports: [
        CommonModule,
        ReactiveFormsModule,
        // pipes
        SanitizeHtmlPipe,
        // components
        NgxEditorMenuComponent,
        ToggleCommandComponent,
        InsertCommandComponent,
        LinkComponent,
        DropdownComponent,
        ImageComponent,
        ColorPickerComponent,
        NgxEditorFloatingMenuComponent,
        BubbleComponent
      ],
      providers: [SanitizeHtmlPipe],
      exports: [NgxEditorMenuComponent, NgxEditorFloatingMenuComponent]
    }]
  }], null, null);
})();
var NGX_EDITOR_CONFIG_TOKEN = new InjectionToken("NgxEditorConfig");
var defaultConfig = {
  locals: defaults,
  icons
};
var NgxEditorModule = class _NgxEditorModule {
  static forRoot(config = defaultConfig) {
    return {
      ngModule: _NgxEditorModule,
      providers: [{
        provide: NGX_EDITOR_CONFIG_TOKEN,
        useValue: config
      }, {
        provide: NgxEditorServiceConfig,
        useFactory: provideMyServiceOptions,
        deps: [NGX_EDITOR_CONFIG_TOKEN]
      }]
    };
  }
  static forChild(config = defaultConfig) {
    return {
      ngModule: _NgxEditorModule,
      providers: [{
        provide: NGX_EDITOR_CONFIG_TOKEN,
        useValue: config
      }, {
        provide: NgxEditorServiceConfig,
        useFactory: provideMyServiceOptions,
        deps: [NGX_EDITOR_CONFIG_TOKEN]
      }, NgxEditorService]
    };
  }
  static ɵfac = function NgxEditorModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NgxEditorModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _NgxEditorModule,
    imports: [CommonModule, MenuModule, NgxEditorComponent, ImageViewComponent],
    exports: [NgxEditorComponent, NgxEditorMenuComponent, NgxEditorFloatingMenuComponent]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [CommonModule, MenuModule, ImageViewComponent]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgxEditorModule, [{
    type: NgModule,
    args: [{
      imports: [CommonModule, MenuModule, NgxEditorComponent, ImageViewComponent],
      providers: [],
      exports: [NgxEditorComponent, NgxEditorMenuComponent, NgxEditorFloatingMenuComponent]
    }]
  }], null, null);
})();
var isEmptyInputValue = (value) => {
  return value === null || value.length === 0;
};
var hasValidLength = (value) => {
  return value !== null && typeof value.length === "number";
};
var isDocEmpty = (doc) => {
  if (!doc) {
    return true;
  }
  const {
    childCount,
    firstChild
  } = doc;
  return Boolean(childCount === 1 && firstChild?.isTextblock && firstChild.content.size === 0);
};
var Validators2 = class {
  static required(userSchema) {
    return (control) => {
      const schema$1 = userSchema || schema;
      const doc = parseContent(control.value, schema$1);
      const isEmpty = isDocEmpty(doc);
      if (!isEmpty) {
        return null;
      }
      return {
        required: true
      };
    };
  }
  static maxLength(maxLength, userSchema) {
    return (control) => {
      const schema$1 = userSchema || schema;
      const doc = parseContent(control.value, schema$1);
      const value = doc.textContent;
      if (hasValidLength(value) && value.length > maxLength) {
        return {
          maxlength: {
            requiredLength: maxLength,
            actualLength: value.length
          }
        };
      }
      return null;
    };
  }
  static minLength(minLength, userSchema) {
    return (control) => {
      const schema$1 = userSchema || schema;
      const doc = parseContent(control.value, schema$1);
      const value = doc.textContent;
      if (isEmptyInputValue(value) || !hasValidLength(value)) {
        return null;
      }
      if (value.length < minLength) {
        return {
          minlength: {
            requiredLength: minLength,
            actualLength: value.length
          }
        };
      }
      return null;
    };
  }
};
var execMark = (name, toggle = false) => {
  return (state, dispatch) => {
    const command = new Mark(name);
    if (!toggle) {
      return command.apply()(state, dispatch);
    }
    return command.toggle()(state, dispatch);
  };
};
var EditorCommands = class {
  view;
  state;
  tr;
  constructor(view) {
    if (!view) {
      throw new NgxEditorError("Required view to initialize commands.");
    }
    this.view = view;
    this.state = view.state;
    this.tr = this.view.state.tr;
  }
  applyTrx = (tr) => {
    this.state = this.state.apply(tr ?? this.tr);
    this.tr = this.state.tr;
    this.tr.setMeta("APPLIED_TRX", true);
  };
  dispatch = (tr) => {
    this.applyTrx(tr);
  };
  exec() {
    if (!this.tr.getMeta("APPLIED_TRX")) {
      return false;
    }
    const forceEmit = !this.view.state.doc.eq(this.state.doc);
    this.view.updateState(this.state);
    const tr = this.tr.setMeta("FORCE_EMIT", forceEmit);
    this.view.dispatch(tr);
    return true;
  }
  focus(position = "end") {
    const selection = position === "start" ? Selection.atStart(this.state.doc) : Selection.atEnd(this.state.doc);
    this.tr.setSelection(selection);
    this.applyTrx();
    this.view.focus();
    return this;
  }
  scrollIntoView() {
    this.tr.scrollIntoView();
    this.applyTrx();
    return this;
  }
  insertText(text) {
    this.tr.insertText(text);
    this.applyTrx();
    return this;
  }
  insertNewLine() {
    const newLineCommands = [newlineInCode, createParagraphNear, liftEmptyBlock, splitBlock];
    chainCommands(...newLineCommands)(this.state, this.dispatch);
    return this;
  }
  applyMark(name) {
    execMark(name, false)(this.state, this.dispatch);
    return this;
  }
  toggleMark(name) {
    execMark(name, true)(this.state, this.dispatch);
    return this;
  }
  bold() {
    execMark("strong")(this.state, this.dispatch);
    return this;
  }
  toggleBold() {
    execMark("strong", true)(this.state, this.dispatch);
    return this;
  }
  italics() {
    execMark("em")(this.state, this.dispatch);
    return this;
  }
  toggleItalics() {
    execMark("em", true)(this.state, this.dispatch);
    return this;
  }
  underline() {
    execMark("u")(this.state, this.dispatch);
    return this;
  }
  toggleUnderline() {
    execMark("u", true)(this.state, this.dispatch);
    return this;
  }
  strike() {
    execMark("s")(this.state, this.dispatch);
    return this;
  }
  toggleStrike() {
    execMark("s", true)(this.state, this.dispatch);
    return this;
  }
  code() {
    execMark("code")(this.state, this.dispatch);
    return this;
  }
  toggleCode() {
    execMark("code", true)(this.state, this.dispatch);
    return this;
  }
  superscript() {
    execMark("sup")(this.state, this.dispatch);
    return this;
  }
  subscript() {
    execMark("sub")(this.state, this.dispatch);
    return this;
  }
  toggleOrderedList() {
    const command = new ListItem(false);
    command.toggle()(this.state, this.dispatch);
    return this;
  }
  toggleBulletList() {
    const command = new ListItem(true);
    command.toggle()(this.state, this.dispatch);
    return this;
  }
  toggleHeading(level) {
    const command = new Heading(level);
    command.toggle()(this.state, this.dispatch);
    return this;
  }
  insertLink(text, attrs) {
    const command = new Link$1();
    command.insert(text, attrs)(this.state, this.dispatch);
    return this;
  }
  updateLink(attrs) {
    const command = new Link$1();
    command.update(attrs)(this.state, this.dispatch);
    return this;
  }
  insertImage(src, attrs = {}) {
    const command = new Image$1();
    command.insert(src, attrs)(this.state, this.dispatch);
    return this;
  }
  textColor(color) {
    const command = new TextColor$1("text_color");
    command.apply({
      color
    })(this.state, this.dispatch);
    return this;
  }
  backgroundColor(color) {
    const command = new TextColor$1("text_background_color");
    command.apply({
      backgroundColor: color
    })(this.state, this.dispatch);
    return this;
  }
  removeTextColor() {
    const command = new TextColor$1("text_color");
    command.remove()(this.state, this.dispatch);
    return this;
  }
  removeBackgroundColor() {
    const command = new TextColor$1("text_background_color");
    command.remove()(this.state, this.dispatch);
    return this;
  }
  align(p) {
    const command = new TextAlign(p);
    command.toggle()(this.state, this.dispatch);
    return this;
  }
  insertHTML(html) {
    const {
      selection,
      schema: schema2,
      tr
    } = this.state;
    const {
      from: from2,
      to
    } = selection;
    const element = document.createElement("div");
    element.innerHTML = isString(html) ? html.trim() : String(html);
    const slice2 = DOMParser.fromSchema(schema2).parseSlice(element);
    const transaction = tr.replaceRange(from2, to, slice2);
    this.applyTrx(transaction);
    return this;
  }
  indent() {
    const command = new Indent("increase");
    command.insert()(this.state, this.dispatch);
    return this;
  }
  outdent() {
    const command = new Indent("decrease");
    command.insert()(this.state, this.dispatch);
    return this;
  }
};
var isMacOs = typeof navigator !== "undefined" ? /Mac/.test(navigator.platform) : false;
var blockQuoteRule = (nodeType) => {
  return wrappingInputRule(/^\s*>\s$/, nodeType);
};
var orderedListRule = (nodeType) => {
  return wrappingInputRule(/^(?:\d+)\.\s$/, nodeType, (match) => ({
    order: Number(match[1])
  }), (match, node) => node.childCount + node.attrs["order"] === Number(match[1]));
};
var bulletListRule = (nodeType) => {
  return wrappingInputRule(/^\s*(?:[-+*])\s$/, nodeType);
};
var codeBlockRule = (nodeType) => {
  return textblockTypeInputRule(/^```$/, nodeType);
};
var headingRule = (nodeType, maxLevel) => {
  return textblockTypeInputRule(new RegExp(`^(#{1,${maxLevel}})\\s$`), nodeType, (match) => ({
    level: match[1].length
  }));
};
var boldRule = (markType) => {
  return markInputRule(/(?:^|\s)(?:(\*\*|__)(?:([^*_]+))(\*\*|__))$/, markType);
};
var emRule = (markType) => {
  return markInputRule(/(?:^|\s)(?:(\*|_)(?:([^*_]+))(\*|_))$/, markType);
};
var buildInputRules = (schema2) => {
  const rules = smartQuotes.concat(ellipsis, emDash);
  rules.push(boldRule(schema2.marks["strong"]));
  rules.push(emRule(schema2.marks["em"]));
  rules.push(blockQuoteRule(schema2.nodes["blockquote"]));
  rules.push(orderedListRule(schema2.nodes["ordered_list"]));
  rules.push(bulletListRule(schema2.nodes["bullet_list"]));
  rules.push(codeBlockRule(schema2.nodes["code_block"]));
  rules.push(headingRule(schema2.nodes["heading"], 6));
  return inputRules({
    rules
  });
};
var getKeyboardShortcuts = (schema2, options) => {
  const historyKeyMap = {};
  historyKeyMap["Mod-z"] = undo;
  if (isMacOs) {
    historyKeyMap["Shift-Mod-z"] = redo;
  } else {
    historyKeyMap["Mod-y"] = redo;
  }
  const plugins = [keymap({
    "Mod-b": toggleMark(schema2.marks["strong"]),
    "Mod-i": toggleMark(schema2.marks["em"]),
    "Mod-u": toggleMark(schema2.marks["u"]),
    "Mod-`": toggleMark(schema2.marks["code"])
  }), keymap({
    "Enter": splitListItem(schema2.nodes["list_item"]),
    "Shift-Enter": chainCommands(exitCode, (state, dispatch) => {
      const {
        tr
      } = state;
      const br = schema2.nodes["hard_break"];
      dispatch(tr.replaceSelectionWith(br.create()).scrollIntoView());
      return true;
    }),
    "Mod-[": liftListItem(schema2.nodes["list_item"]),
    "Mod-]": sinkListItem(schema2.nodes["list_item"]),
    "Tab": sinkListItem(schema2.nodes["list_item"])
  }), keymap(baseKeymap)];
  if (options.history) {
    plugins.push(keymap(historyKeyMap));
  }
  return plugins;
};
var getDefaultPlugins = (schema2, options) => {
  const plugins = [];
  if (options.keyboardShortcuts) {
    plugins.push(...getKeyboardShortcuts(schema2, {
      history: options.history
    }));
  }
  if (options.history) {
    plugins.push(history());
  }
  if (options.inputRules) {
    plugins.push(buildInputRules(schema2));
  }
  return plugins;
};
var defaultFeatures = {
  linkOnPaste: true,
  resizeImage: true
};
var DEFAULT_OPTIONS = {
  content: null,
  history: true,
  keyboardShortcuts: true,
  inputRules: true,
  schema,
  plugins: [],
  nodeViews: {},
  attributes: {},
  features: defaultFeatures,
  handleScrollToSelection: null,
  linkValidationPattern: "(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/??([^#\n\r]*)?#?([^\n\r]*)|(mailto:.*[@].*)"
};
var Editor = class {
  options;
  view;
  constructor(options = DEFAULT_OPTIONS) {
    this.options = __spreadValues(__spreadValues({}, DEFAULT_OPTIONS), options);
    this.createEditor();
  }
  valueChangesSubject = new Subject();
  updateSubject = new Subject();
  get valueChanges() {
    return this.valueChangesSubject.asObservable();
  }
  get update() {
    return this.updateSubject.asObservable();
  }
  get schema() {
    return this.options.schema || schema;
  }
  get linkValidationPattern() {
    return this.options.linkValidationPattern;
  }
  get commands() {
    return new EditorCommands(this.view);
  }
  get features() {
    return __spreadValues(__spreadValues({}, defaultFeatures), this.options.features);
  }
  handleTransactions(tr) {
    const state = this.view.state.apply(tr);
    this.view.updateState(state);
    this.updateSubject.next(this.view);
    if (!tr.docChanged && !tr.getMeta("FORCE_EMIT")) {
      return;
    }
    const json = state.doc.toJSON();
    this.valueChangesSubject.next(json);
  }
  createEditor() {
    const {
      options,
      schema: schema2
    } = this;
    const {
      content = null,
      nodeViews
    } = options;
    const {
      history: history2 = true,
      keyboardShortcuts = true,
      inputRules: inputRules2 = true
    } = options;
    const doc = parseContent(content, schema2, options.parseOptions);
    const plugins = options.plugins ?? [];
    const attributes = options.attributes ?? {};
    const defaultPlugins = getDefaultPlugins(schema2, {
      history: history2,
      keyboardShortcuts,
      inputRules: inputRules2
    });
    this.view = new EditorView(null, {
      state: EditorState.create({
        doc,
        schema: schema2,
        plugins: [...defaultPlugins, ...plugins]
      }),
      nodeViews,
      dispatchTransaction: this.handleTransactions.bind(this),
      attributes,
      handleScrollToSelection: options.handleScrollToSelection
    });
  }
  setContent(content) {
    if (isNil(content)) {
      return;
    }
    const {
      state
    } = this.view;
    const {
      tr,
      doc
    } = state;
    const newDoc = parseContent(content, this.schema, this.options.parseOptions);
    tr.replaceWith(0, state.doc.content.size, newDoc);
    if (doc.eq(tr.doc)) {
      return;
    }
    if (!tr.docChanged) {
      return;
    }
    this.view.dispatch(tr);
  }
  registerPlugin(plugin) {
    const {
      state
    } = this.view;
    const plugins = [...state.plugins, plugin];
    const newState = state.reconfigure({
      plugins
    });
    this.view.updateState(newState);
  }
  destroy() {
    this.view.destroy();
  }
};
export {
  DEFAULT_TOOLBAR,
  Editor,
  ImageViewComponent,
  NGX_EDITOR_CONFIG_TOKEN,
  NgxEditorComponent,
  NgxEditorFloatingMenuComponent,
  NgxEditorMenuComponent,
  NgxEditorModule,
  NgxEditorService,
  TOOLBAR_FULL,
  TOOLBAR_MINIMAL,
  Validators2 as Validators,
  emptyDoc,
  getKeyboardShortcuts,
  marks,
  nodes,
  parseContent,
  provideMyServiceOptions,
  schema,
  toDoc,
  toHTML
};
//# sourceMappingURL=ngx-editor.js.map
