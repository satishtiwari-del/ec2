import {
  Decoration,
  DecorationSet
} from "./chunk-DKMP3LPG.js";
import {
  AllSelection,
  Fragment,
  Node,
  NodeSelection,
  Plugin,
  PluginKey,
  Slice,
  TextSelection
} from "./chunk-3FOTMRUO.js";
import "./chunk-NQKY55TB.js";
import {
  BIT30,
  BIT8,
  ContentFormat,
  ContentString,
  ContentType,
  Doc,
  Item,
  RelativePosition,
  Snapshot,
  UndoManager,
  YText,
  YXmlElement,
  YXmlFragment,
  YXmlText,
  applyUpdateV2,
  compareRelativePositions,
  create,
  create2,
  createAbsolutePositionFromRelativePosition,
  createDeleteSet,
  createID,
  createRelativePositionFromJSON,
  createRelativePositionFromTypeIndex,
  createSnapshot,
  doc,
  encodeAny,
  every,
  findIndexSS,
  findRootTypeKey,
  isBrowser,
  isDeleted,
  isParentOf,
  iterateDeletedStructs,
  keys,
  max,
  methodUnimplemented,
  min,
  oneOf,
  setIfUndefined,
  snapshot,
  timeout,
  toBase64,
  typeListToArraySnapshot,
  unexpectedCase
} from "./chunk-3P7X54YD.js";
import "./chunk-WDMUDEB6.js";

// node_modules/lib0/mutex.js
var createMutex = () => {
  let token = true;
  return (f, g) => {
    if (token) {
      token = false;
      try {
        f();
      } finally {
        token = true;
      }
    } else if (g !== void 0) {
      g();
    }
  };
};

// node_modules/lib0/diff.js
var highSurrogateRegex = /[\uD800-\uDBFF]/;
var lowSurrogateRegex = /[\uDC00-\uDFFF]/;
var simpleDiffString = (a, b) => {
  let left = 0;
  let right = 0;
  while (left < a.length && left < b.length && a[left] === b[left]) {
    left++;
  }
  if (left > 0 && highSurrogateRegex.test(a[left - 1])) left--;
  while (right + left < a.length && right + left < b.length && a[a.length - right - 1] === b[b.length - right - 1]) {
    right++;
  }
  if (right > 0 && lowSurrogateRegex.test(a[a.length - right])) right--;
  return {
    index: left,
    remove: a.length - left - right,
    insert: b.slice(left, b.length - right)
  };
};
var simpleDiff = simpleDiffString;

// node_modules/y-prosemirror/src/plugins/keys.js
var ySyncPluginKey = new PluginKey("y-sync");
var yUndoPluginKey = new PluginKey("y-undo");
var yCursorPluginKey = new PluginKey("yjs-cursor");

// node_modules/lib0/hash/sha256.js
var rotr = (w, shift) => w >>> shift | w << 32 - shift;
var sum0to256 = (x) => rotr(x, 2) ^ rotr(x, 13) ^ rotr(x, 22);
var sum1to256 = (x) => rotr(x, 6) ^ rotr(x, 11) ^ rotr(x, 25);
var sigma0to256 = (x) => rotr(x, 7) ^ rotr(x, 18) ^ x >>> 3;
var sigma1to256 = (x) => rotr(x, 17) ^ rotr(x, 19) ^ x >>> 10;
var K = new Uint32Array([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
var HINIT = new Uint32Array([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]);
var Hasher = class {
  constructor() {
    const buf = new ArrayBuffer(64 + 64 * 4);
    this._H = new Uint32Array(buf, 0, 8);
    this._H.set(HINIT);
    this._W = new Uint32Array(buf, 64, 64);
  }
  _updateHash() {
    const H = this._H;
    const W = this._W;
    for (let t = 16; t < 64; t++) {
      W[t] = sigma1to256(W[t - 2]) + W[t - 7] + sigma0to256(W[t - 15]) + W[t - 16];
    }
    let a = H[0];
    let b = H[1];
    let c = H[2];
    let d = H[3];
    let e = H[4];
    let f = H[5];
    let g = H[6];
    let h = H[7];
    for (let tt = 0, T1, T2; tt < 64; tt++) {
      T1 = h + sum1to256(e) + (e & f ^ ~e & g) + K[tt] + W[tt] >>> 0;
      T2 = sum0to256(a) + (a & b ^ a & c ^ b & c) >>> 0;
      h = g;
      g = f;
      f = e;
      e = d + T1 >>> 0;
      d = c;
      c = b;
      b = a;
      a = T1 + T2 >>> 0;
    }
    H[0] += a;
    H[1] += b;
    H[2] += c;
    H[3] += d;
    H[4] += e;
    H[5] += f;
    H[6] += g;
    H[7] += h;
  }
  /**
   * Returns a 32-byte hash.
   *
   * @param {Uint8Array} data
   */
  digest(data) {
    let i = 0;
    for (; i + 56 <= data.length; ) {
      let j2 = 0;
      for (; j2 < 16 && i + 3 < data.length; j2++) {
        this._W[j2] = data[i++] << 24 | data[i++] << 16 | data[i++] << 8 | data[i++];
      }
      if (i % 64 !== 0) {
        this._W.fill(0, j2, 16);
        while (i < data.length) {
          this._W[j2] |= data[i] << (3 - i % 4) * 8;
          i++;
        }
        this._W[j2] |= BIT8 << (3 - i % 4) * 8;
      }
      this._updateHash();
    }
    const isPaddedWith1 = i % 64 !== 0;
    this._W.fill(0, 0, 16);
    let j = 0;
    for (; i < data.length; j++) {
      for (let ci = 3; ci >= 0 && i < data.length; ci--) {
        this._W[j] |= data[i++] << ci * 8;
      }
    }
    if (!isPaddedWith1) {
      this._W[j - (i % 4 === 0 ? 0 : 1)] |= BIT8 << (3 - i % 4) * 8;
    }
    this._W[14] = data.byteLength / BIT30;
    this._W[15] = data.byteLength * 8;
    this._updateHash();
    const dv = new Uint8Array(32);
    for (let i2 = 0; i2 < this._H.length; i2++) {
      for (let ci = 0; ci < 4; ci++) {
        dv[i2 * 4 + ci] = this._H[i2] >>> (3 - ci) * 8;
      }
    }
    return dv;
  }
};
var digest = (data) => new Hasher().digest(data);

// node_modules/y-prosemirror/src/utils.js
var _convolute = (digest2) => {
  const N = 6;
  for (let i = N; i < digest2.length; i++) {
    digest2[i % N] = digest2[i % N] ^ digest2[i];
  }
  return digest2.slice(0, N);
};
var hashOfJSON = (json) => toBase64(_convolute(digest(encodeAny(json))));

// node_modules/y-prosemirror/src/plugins/sync-plugin.js
var createEmptyMeta = () => ({
  mapping: /* @__PURE__ */ new Map(),
  isOMark: /* @__PURE__ */ new Map()
});
var isVisible = (item, snapshot2) => snapshot2 === void 0 ? !item.deleted : snapshot2.sv.has(item.id.client) && /** @type {number} */
snapshot2.sv.get(item.id.client) > item.id.clock && !isDeleted(snapshot2.ds, item.id);
var defaultColors = [{ light: "#ecd44433", dark: "#ecd444" }];
var getUserColor = (colorMapping, colors, user) => {
  if (!colorMapping.has(user)) {
    if (colorMapping.size < colors.length) {
      const usedColors = create2();
      colorMapping.forEach((color) => usedColors.add(color));
      colors = colors.filter((color) => !usedColors.has(color));
    }
    colorMapping.set(user, oneOf(colors));
  }
  return (
    /** @type {ColorDef} */
    colorMapping.get(user)
  );
};
var ySyncPlugin = (yXmlFragment, {
  colors = defaultColors,
  colorMapping = /* @__PURE__ */ new Map(),
  permanentUserData = null,
  onFirstRender = () => {
  },
  mapping
} = {}) => {
  let initialContentChanged = false;
  const binding = new ProsemirrorBinding(yXmlFragment, mapping);
  const plugin = new Plugin({
    props: {
      editable: (state) => {
        const syncState = ySyncPluginKey.getState(state);
        return syncState.snapshot == null && syncState.prevSnapshot == null;
      }
    },
    key: ySyncPluginKey,
    state: {
      /**
       * @returns {any}
       */
      init: (_initargs, _state) => {
        return {
          type: yXmlFragment,
          doc: yXmlFragment.doc,
          binding,
          snapshot: null,
          prevSnapshot: null,
          isChangeOrigin: false,
          isUndoRedoOperation: false,
          addToHistory: true,
          colors,
          colorMapping,
          permanentUserData
        };
      },
      apply: (tr, pluginState) => {
        const change = tr.getMeta(ySyncPluginKey);
        if (change !== void 0) {
          pluginState = Object.assign({}, pluginState);
          for (const key in change) {
            pluginState[key] = change[key];
          }
        }
        pluginState.addToHistory = tr.getMeta("addToHistory") !== false;
        pluginState.isChangeOrigin = change !== void 0 && !!change.isChangeOrigin;
        pluginState.isUndoRedoOperation = change !== void 0 && !!change.isChangeOrigin && !!change.isUndoRedoOperation;
        if (binding.prosemirrorView !== null) {
          if (change !== void 0 && (change.snapshot != null || change.prevSnapshot != null)) {
            timeout(0, () => {
              if (binding.prosemirrorView == null) {
                return;
              }
              if (change.restore == null) {
                binding._renderSnapshot(
                  change.snapshot,
                  change.prevSnapshot,
                  pluginState
                );
              } else {
                binding._renderSnapshot(
                  change.snapshot,
                  change.snapshot,
                  pluginState
                );
                delete pluginState.restore;
                delete pluginState.snapshot;
                delete pluginState.prevSnapshot;
                binding.mux(() => {
                  binding._prosemirrorChanged(
                    binding.prosemirrorView.state.doc
                  );
                });
              }
            });
          }
        }
        return pluginState;
      }
    },
    view: (view) => {
      binding.initView(view);
      if (mapping == null) {
        binding._forceRerender();
      }
      onFirstRender();
      return {
        update: () => {
          const pluginState = plugin.getState(view.state);
          if (pluginState.snapshot == null && pluginState.prevSnapshot == null) {
            if (
              // If the content doesn't change initially, we don't render anything to Yjs
              // If the content was cleared by a user action, we want to catch the change and
              // represent it in Yjs
              initialContentChanged || view.state.doc.content.findDiffStart(
                view.state.doc.type.createAndFill().content
              ) !== null
            ) {
              initialContentChanged = true;
              if (pluginState.addToHistory === false && !pluginState.isChangeOrigin) {
                const yUndoPluginState = yUndoPluginKey.getState(view.state);
                const um = yUndoPluginState && yUndoPluginState.undoManager;
                if (um) {
                  um.stopCapturing();
                }
              }
              binding.mux(() => {
                pluginState.doc.transact((tr) => {
                  tr.meta.set("addToHistory", pluginState.addToHistory);
                  binding._prosemirrorChanged(view.state.doc);
                }, ySyncPluginKey);
              });
            }
          }
        },
        destroy: () => {
          binding.destroy();
        }
      };
    }
  });
  return plugin;
};
var restoreRelativeSelection = (tr, relSel, binding) => {
  if (relSel !== null && relSel.anchor !== null && relSel.head !== null) {
    if (relSel.type === "all") {
      tr.setSelection(new AllSelection(tr.doc));
    } else if (relSel.type === "node") {
      const anchor = relativePositionToAbsolutePosition(
        binding.doc,
        binding.type,
        relSel.anchor,
        binding.mapping
      );
      tr.setSelection(NodeSelection.create(tr.doc, anchor));
    } else {
      const anchor = relativePositionToAbsolutePosition(
        binding.doc,
        binding.type,
        relSel.anchor,
        binding.mapping
      );
      const head = relativePositionToAbsolutePosition(
        binding.doc,
        binding.type,
        relSel.head,
        binding.mapping
      );
      if (anchor !== null && head !== null) {
        const sel = TextSelection.between(tr.doc.resolve(anchor), tr.doc.resolve(head));
        tr.setSelection(sel);
      }
    }
  }
};
var getRelativeSelection = (pmbinding, state) => ({
  type: (
    /** @type {any} */
    state.selection.jsonID
  ),
  anchor: absolutePositionToRelativePosition(
    state.selection.anchor,
    pmbinding.type,
    pmbinding.mapping
  ),
  head: absolutePositionToRelativePosition(
    state.selection.head,
    pmbinding.type,
    pmbinding.mapping
  )
});
var ProsemirrorBinding = class {
  /**
   * @param {Y.XmlFragment} yXmlFragment The bind source
   * @param {ProsemirrorMapping} mapping
   */
  constructor(yXmlFragment, mapping = /* @__PURE__ */ new Map()) {
    this.type = yXmlFragment;
    this.prosemirrorView = null;
    this.mux = createMutex();
    this.mapping = mapping;
    this.isOMark = /* @__PURE__ */ new Map();
    this._observeFunction = this._typeChanged.bind(this);
    this.doc = yXmlFragment.doc;
    this.beforeTransactionSelection = null;
    this.beforeAllTransactions = () => {
      if (this.beforeTransactionSelection === null && this.prosemirrorView != null) {
        this.beforeTransactionSelection = getRelativeSelection(
          this,
          this.prosemirrorView.state
        );
      }
    };
    this.afterAllTransactions = () => {
      this.beforeTransactionSelection = null;
    };
    this._domSelectionInView = null;
  }
  /**
   * Create a transaction for changing the prosemirror state.
   *
   * @returns
   */
  get _tr() {
    return this.prosemirrorView.state.tr.setMeta("addToHistory", false);
  }
  _isLocalCursorInView() {
    if (!this.prosemirrorView.hasFocus()) return false;
    if (isBrowser && this._domSelectionInView === null) {
      timeout(0, () => {
        this._domSelectionInView = null;
      });
      this._domSelectionInView = this._isDomSelectionInView();
    }
    return this._domSelectionInView;
  }
  _isDomSelectionInView() {
    const selection = this.prosemirrorView._root.getSelection();
    if (selection == null || selection.anchorNode == null) return false;
    const range = this.prosemirrorView._root.createRange();
    range.setStart(selection.anchorNode, selection.anchorOffset);
    range.setEnd(selection.focusNode, selection.focusOffset);
    const rects = range.getClientRects();
    if (rects.length === 0) {
      if (range.startContainer && range.collapsed) {
        range.selectNodeContents(range.startContainer);
      }
    }
    const bounding = range.getBoundingClientRect();
    const documentElement = doc.documentElement;
    return bounding.bottom >= 0 && bounding.right >= 0 && bounding.left <= (window.innerWidth || documentElement.clientWidth || 0) && bounding.top <= (window.innerHeight || documentElement.clientHeight || 0);
  }
  /**
   * @param {Y.Snapshot} snapshot
   * @param {Y.Snapshot} prevSnapshot
   */
  renderSnapshot(snapshot2, prevSnapshot) {
    if (!prevSnapshot) {
      prevSnapshot = createSnapshot(createDeleteSet(), /* @__PURE__ */ new Map());
    }
    this.prosemirrorView.dispatch(
      this._tr.setMeta(ySyncPluginKey, { snapshot: snapshot2, prevSnapshot })
    );
  }
  unrenderSnapshot() {
    this.mapping.clear();
    this.mux(() => {
      const fragmentContent = this.type.toArray().map(
        (t) => createNodeFromYElement(
          /** @type {Y.XmlElement} */
          t,
          this.prosemirrorView.state.schema,
          this
        )
      ).filter((n) => n !== null);
      const tr = this._tr.replace(
        0,
        this.prosemirrorView.state.doc.content.size,
        new Slice(Fragment.from(fragmentContent), 0, 0)
      );
      tr.setMeta(ySyncPluginKey, { snapshot: null, prevSnapshot: null });
      this.prosemirrorView.dispatch(tr);
    });
  }
  _forceRerender() {
    this.mapping.clear();
    this.mux(() => {
      const sel = this.beforeTransactionSelection !== null ? null : this.prosemirrorView.state.selection;
      const fragmentContent = this.type.toArray().map(
        (t) => createNodeFromYElement(
          /** @type {Y.XmlElement} */
          t,
          this.prosemirrorView.state.schema,
          this
        )
      ).filter((n) => n !== null);
      const tr = this._tr.replace(
        0,
        this.prosemirrorView.state.doc.content.size,
        new Slice(Fragment.from(fragmentContent), 0, 0)
      );
      if (sel) {
        const clampedAnchor = min(max(sel.anchor, 0), tr.doc.content.size);
        const clampedHead = min(max(sel.head, 0), tr.doc.content.size);
        tr.setSelection(TextSelection.create(tr.doc, clampedAnchor, clampedHead));
      }
      this.prosemirrorView.dispatch(
        tr.setMeta(ySyncPluginKey, { isChangeOrigin: true, binding: this })
      );
    });
  }
  /**
   * @param {Y.Snapshot|Uint8Array} snapshot
   * @param {Y.Snapshot|Uint8Array} prevSnapshot
   * @param {Object} pluginState
   */
  _renderSnapshot(snapshot2, prevSnapshot, pluginState) {
    let historyDoc = this.doc;
    let historyType = this.type;
    if (!snapshot2) {
      snapshot2 = snapshot(this.doc);
    }
    if (snapshot2 instanceof Uint8Array || prevSnapshot instanceof Uint8Array) {
      if (!(snapshot2 instanceof Uint8Array) || !(prevSnapshot instanceof Uint8Array)) {
        unexpectedCase();
      }
      historyDoc = new Doc({ gc: false });
      applyUpdateV2(historyDoc, prevSnapshot);
      prevSnapshot = snapshot(historyDoc);
      applyUpdateV2(historyDoc, snapshot2);
      snapshot2 = snapshot(historyDoc);
      if (historyType._item === null) {
        const rootKey = Array.from(this.doc.share.keys()).find(
          (key) => this.doc.share.get(key) === this.type
        );
        historyType = historyDoc.getXmlFragment(rootKey);
      } else {
        const historyStructs = historyDoc.store.clients.get(historyType._item.id.client) ?? [];
        const itemIndex = findIndexSS(
          historyStructs,
          historyType._item.id.clock
        );
        const item = (
          /** @type {Y.Item} */
          historyStructs[itemIndex]
        );
        const content = (
          /** @type {Y.ContentType} */
          item.content
        );
        historyType = /** @type {Y.XmlFragment} */
        content.type;
      }
    }
    this.mapping.clear();
    this.mux(() => {
      historyDoc.transact((transaction) => {
        const pud = pluginState.permanentUserData;
        if (pud) {
          pud.dss.forEach((ds) => {
            iterateDeletedStructs(transaction, ds, (_item) => {
            });
          });
        }
        const computeYChange = (type, id) => {
          const user = type === "added" ? pud.getUserByClientId(id.client) : pud.getUserByDeletedId(id);
          return {
            user,
            type,
            color: getUserColor(
              pluginState.colorMapping,
              pluginState.colors,
              user
            )
          };
        };
        const fragmentContent = typeListToArraySnapshot(
          historyType,
          new Snapshot(prevSnapshot.ds, snapshot2.sv)
        ).map((t) => {
          if (!t._item.deleted || isVisible(t._item, snapshot2) || isVisible(t._item, prevSnapshot)) {
            return createNodeFromYElement(
              t,
              this.prosemirrorView.state.schema,
              { mapping: /* @__PURE__ */ new Map(), isOMark: /* @__PURE__ */ new Map() },
              snapshot2,
              prevSnapshot,
              computeYChange
            );
          } else {
            return null;
          }
        }).filter((n) => n !== null);
        const tr = this._tr.replace(
          0,
          this.prosemirrorView.state.doc.content.size,
          new Slice(Fragment.from(fragmentContent), 0, 0)
        );
        this.prosemirrorView.dispatch(
          tr.setMeta(ySyncPluginKey, { isChangeOrigin: true })
        );
      }, ySyncPluginKey);
    });
  }
  /**
   * @param {Array<Y.YEvent<any>>} events
   * @param {Y.Transaction} transaction
   */
  _typeChanged(events, transaction) {
    if (this.prosemirrorView == null) return;
    const syncState = ySyncPluginKey.getState(this.prosemirrorView.state);
    if (events.length === 0 || syncState.snapshot != null || syncState.prevSnapshot != null) {
      this.renderSnapshot(syncState.snapshot, syncState.prevSnapshot);
      return;
    }
    this.mux(() => {
      const delType = (_, type) => this.mapping.delete(type);
      iterateDeletedStructs(
        transaction,
        transaction.deleteSet,
        (struct) => {
          if (struct.constructor === Item) {
            const type = (
              /** @type {Y.ContentType} */
              /** @type {Y.Item} */
              struct.content.type
            );
            type && this.mapping.delete(type);
          }
        }
      );
      transaction.changed.forEach(delType);
      transaction.changedParentTypes.forEach(delType);
      const fragmentContent = this.type.toArray().map(
        (t) => createNodeIfNotExists(
          /** @type {Y.XmlElement | Y.XmlHook} */
          t,
          this.prosemirrorView.state.schema,
          this
        )
      ).filter((n) => n !== null);
      let tr = this._tr.replace(
        0,
        this.prosemirrorView.state.doc.content.size,
        new Slice(Fragment.from(fragmentContent), 0, 0)
      );
      restoreRelativeSelection(tr, this.beforeTransactionSelection, this);
      tr = tr.setMeta(ySyncPluginKey, { isChangeOrigin: true, isUndoRedoOperation: transaction.origin instanceof UndoManager });
      if (this.beforeTransactionSelection !== null && this._isLocalCursorInView()) {
        tr.scrollIntoView();
      }
      this.prosemirrorView.dispatch(tr);
    });
  }
  /**
   * @param {import('prosemirror-model').Node} doc
   */
  _prosemirrorChanged(doc2) {
    this.doc.transact(() => {
      updateYFragment(this.doc, this.type, doc2, this);
      this.beforeTransactionSelection = getRelativeSelection(
        this,
        this.prosemirrorView.state
      );
    }, ySyncPluginKey);
  }
  /**
   * View is ready to listen to changes. Register observers.
   * @param {any} prosemirrorView
   */
  initView(prosemirrorView) {
    if (this.prosemirrorView != null) this.destroy();
    this.prosemirrorView = prosemirrorView;
    this.doc.on("beforeAllTransactions", this.beforeAllTransactions);
    this.doc.on("afterAllTransactions", this.afterAllTransactions);
    this.type.observeDeep(this._observeFunction);
  }
  destroy() {
    if (this.prosemirrorView == null) return;
    this.prosemirrorView = null;
    this.type.unobserveDeep(this._observeFunction);
    this.doc.off("beforeAllTransactions", this.beforeAllTransactions);
    this.doc.off("afterAllTransactions", this.afterAllTransactions);
  }
};
var createNodeIfNotExists = (el, schema, meta, snapshot2, prevSnapshot, computeYChange) => {
  const node = (
    /** @type {PModel.Node} */
    meta.mapping.get(el)
  );
  if (node === void 0) {
    if (el instanceof YXmlElement) {
      return createNodeFromYElement(
        el,
        schema,
        meta,
        snapshot2,
        prevSnapshot,
        computeYChange
      );
    } else {
      throw methodUnimplemented();
    }
  }
  return node;
};
var createNodeFromYElement = (el, schema, meta, snapshot2, prevSnapshot, computeYChange) => {
  const children = [];
  const createChildren = (type) => {
    if (type instanceof YXmlElement) {
      const n = createNodeIfNotExists(
        type,
        schema,
        meta,
        snapshot2,
        prevSnapshot,
        computeYChange
      );
      if (n !== null) {
        children.push(n);
      }
    } else {
      const nextytext = (
        /** @type {Y.ContentType} */
        type._item.right?.content?.type
      );
      if (nextytext instanceof YText && !nextytext._item.deleted && nextytext._item.id.client === nextytext.doc.clientID) {
        type.applyDelta([
          { retain: type.length },
          ...nextytext.toDelta()
        ]);
        nextytext.doc.transact((tr) => {
          nextytext._item.delete(tr);
        });
      }
      const ns = createTextNodesFromYText(
        type,
        schema,
        meta,
        snapshot2,
        prevSnapshot,
        computeYChange
      );
      if (ns !== null) {
        ns.forEach((textchild) => {
          if (textchild !== null) {
            children.push(textchild);
          }
        });
      }
    }
  };
  if (snapshot2 === void 0 || prevSnapshot === void 0) {
    el.toArray().forEach(createChildren);
  } else {
    typeListToArraySnapshot(el, new Snapshot(prevSnapshot.ds, snapshot2.sv)).forEach(createChildren);
  }
  try {
    const attrs = el.getAttributes(snapshot2);
    if (snapshot2 !== void 0) {
      if (!isVisible(
        /** @type {Y.Item} */
        el._item,
        snapshot2
      )) {
        attrs.ychange = computeYChange ? computeYChange(
          "removed",
          /** @type {Y.Item} */
          el._item.id
        ) : { type: "removed" };
      } else if (!isVisible(
        /** @type {Y.Item} */
        el._item,
        prevSnapshot
      )) {
        attrs.ychange = computeYChange ? computeYChange(
          "added",
          /** @type {Y.Item} */
          el._item.id
        ) : { type: "added" };
      }
    }
    const node = schema.node(el.nodeName, attrs, children);
    meta.mapping.set(el, node);
    return node;
  } catch (e) {
    el.doc.transact((transaction) => {
      el._item.delete(transaction);
    }, ySyncPluginKey);
    meta.mapping.delete(el);
    return null;
  }
};
var createTextNodesFromYText = (text, schema, _meta, snapshot2, prevSnapshot, computeYChange) => {
  const nodes = [];
  const deltas = text.toDelta(snapshot2, prevSnapshot, computeYChange);
  try {
    for (let i = 0; i < deltas.length; i++) {
      const delta = deltas[i];
      nodes.push(schema.text(delta.insert, attributesToMarks(delta.attributes, schema)));
    }
  } catch (e) {
    text.doc.transact((transaction) => {
      text._item.delete(transaction);
    }, ySyncPluginKey);
    return null;
  }
  return nodes;
};
var createTypeFromTextNodes = (nodes, meta) => {
  const type = new YXmlText();
  const delta = nodes.map((node) => ({
    // @ts-ignore
    insert: node.text,
    attributes: marksToAttributes(node.marks, meta)
  }));
  type.applyDelta(delta);
  meta.mapping.set(type, nodes);
  return type;
};
var createTypeFromElementNode = (node, meta) => {
  const type = new YXmlElement(node.type.name);
  for (const key in node.attrs) {
    const val = node.attrs[key];
    if (val !== null && key !== "ychange") {
      type.setAttribute(key, val);
    }
  }
  type.insert(
    0,
    normalizePNodeContent(node).map(
      (n) => createTypeFromTextOrElementNode(n, meta)
    )
  );
  meta.mapping.set(type, node);
  return type;
};
var createTypeFromTextOrElementNode = (node, meta) => node instanceof Array ? createTypeFromTextNodes(node, meta) : createTypeFromElementNode(node, meta);
var isObject = (val) => typeof val === "object" && val !== null;
var equalAttrs = (pattrs, yattrs) => {
  const keys2 = Object.keys(pattrs).filter((key) => pattrs[key] !== null);
  let eq = keys2.length === (yattrs == null ? 0 : Object.keys(yattrs).filter((key) => yattrs[key] !== null).length);
  for (let i = 0; i < keys2.length && eq; i++) {
    const key = keys2[i];
    const l = pattrs[key];
    const r = yattrs[key];
    eq = key === "ychange" || l === r || isObject(l) && isObject(r) && equalAttrs(l, r);
  }
  return eq;
};
var normalizePNodeContent = (pnode) => {
  const c = pnode.content.content;
  const res = [];
  for (let i = 0; i < c.length; i++) {
    const n = c[i];
    if (n.isText) {
      const textNodes = [];
      for (let tnode = c[i]; i < c.length && tnode.isText; tnode = c[++i]) {
        textNodes.push(tnode);
      }
      i--;
      res.push(textNodes);
    } else {
      res.push(n);
    }
  }
  return res;
};
var equalYTextPText = (ytext, ptexts) => {
  const delta = ytext.toDelta();
  return delta.length === ptexts.length && delta.every(
    /** @type {(d:any,i:number) => boolean} */
    (d, i) => d.insert === /** @type {any} */
    ptexts[i].text && keys(d.attributes || {}).length === ptexts[i].marks.length && every(d.attributes, (attr, yattrname) => {
      const markname = yattr2markname(yattrname);
      const pmarks = ptexts[i].marks;
      return equalAttrs(attr, pmarks.find(
        /** @param {any} mark */
        (mark) => mark.type.name === markname
      )?.attrs);
    })
  );
};
var equalYTypePNode = (ytype, pnode) => {
  if (ytype instanceof YXmlElement && !(pnode instanceof Array) && matchNodeName(ytype, pnode)) {
    const normalizedContent = normalizePNodeContent(pnode);
    return ytype._length === normalizedContent.length && equalAttrs(ytype.getAttributes(), pnode.attrs) && ytype.toArray().every(
      (ychild, i) => equalYTypePNode(ychild, normalizedContent[i])
    );
  }
  return ytype instanceof YXmlText && pnode instanceof Array && equalYTextPText(ytype, pnode);
};
var mappedIdentity = (mapped, pcontent) => mapped === pcontent || mapped instanceof Array && pcontent instanceof Array && mapped.length === pcontent.length && mapped.every(
  (a, i) => pcontent[i] === a
);
var computeChildEqualityFactor = (ytype, pnode, meta) => {
  const yChildren = ytype.toArray();
  const pChildren = normalizePNodeContent(pnode);
  const pChildCnt = pChildren.length;
  const yChildCnt = yChildren.length;
  const minCnt = min(yChildCnt, pChildCnt);
  let left = 0;
  let right = 0;
  let foundMappedChild = false;
  for (; left < minCnt; left++) {
    const leftY = yChildren[left];
    const leftP = pChildren[left];
    if (mappedIdentity(meta.mapping.get(leftY), leftP)) {
      foundMappedChild = true;
    } else if (!equalYTypePNode(leftY, leftP)) {
      break;
    }
  }
  for (; left + right < minCnt; right++) {
    const rightY = yChildren[yChildCnt - right - 1];
    const rightP = pChildren[pChildCnt - right - 1];
    if (mappedIdentity(meta.mapping.get(rightY), rightP)) {
      foundMappedChild = true;
    } else if (!equalYTypePNode(rightY, rightP)) {
      break;
    }
  }
  return {
    equalityFactor: left + right,
    foundMappedChild
  };
};
var ytextTrans = (ytext) => {
  let str = "";
  let n = ytext._start;
  const nAttrs = {};
  while (n !== null) {
    if (!n.deleted) {
      if (n.countable && n.content instanceof ContentString) {
        str += n.content.str;
      } else if (n.content instanceof ContentFormat) {
        nAttrs[n.content.key] = null;
      }
    }
    n = n.right;
  }
  return {
    str,
    nAttrs
  };
};
var updateYText = (ytext, ptexts, meta) => {
  meta.mapping.set(ytext, ptexts);
  const { nAttrs, str } = ytextTrans(ytext);
  const content = ptexts.map((p) => ({
    insert: (
      /** @type {any} */
      p.text
    ),
    attributes: Object.assign({}, nAttrs, marksToAttributes(p.marks, meta))
  }));
  const { insert, remove, index } = simpleDiff(
    str,
    content.map((c) => c.insert).join("")
  );
  ytext.delete(index, remove);
  ytext.insert(index, insert);
  ytext.applyDelta(
    content.map((c) => ({ retain: c.insert.length, attributes: c.attributes }))
  );
};
var hashedMarkNameRegex = /(.*)(--[a-zA-Z0-9+/=]{8})$/;
var yattr2markname = (attrName) => hashedMarkNameRegex.exec(attrName)?.[1] ?? attrName;
var attributesToMarks = (attrs, schema) => {
  const marks = [];
  for (const markName in attrs) {
    marks.push(schema.mark(yattr2markname(markName), attrs[markName]));
  }
  return marks;
};
var marksToAttributes = (marks, meta) => {
  const pattrs = {};
  marks.forEach((mark) => {
    if (mark.type.name !== "ychange") {
      const isOverlapping = setIfUndefined(meta.isOMark, mark.type, () => !mark.type.excludes(mark.type));
      pattrs[isOverlapping ? `${mark.type.name}--${hashOfJSON(mark.toJSON())}` : mark.type.name] = mark.attrs;
    }
  });
  return pattrs;
};
var updateYFragment = (y, yDomFragment, pNode, meta) => {
  if (yDomFragment instanceof YXmlElement && yDomFragment.nodeName !== pNode.type.name) {
    throw new Error("node name mismatch!");
  }
  meta.mapping.set(yDomFragment, pNode);
  if (yDomFragment instanceof YXmlElement) {
    const yDomAttrs = yDomFragment.getAttributes();
    const pAttrs = pNode.attrs;
    for (const key in pAttrs) {
      if (pAttrs[key] !== null) {
        if (yDomAttrs[key] !== pAttrs[key] && key !== "ychange") {
          yDomFragment.setAttribute(key, pAttrs[key]);
        }
      } else {
        yDomFragment.removeAttribute(key);
      }
    }
    for (const key in yDomAttrs) {
      if (pAttrs[key] === void 0) {
        yDomFragment.removeAttribute(key);
      }
    }
  }
  const pChildren = normalizePNodeContent(pNode);
  const pChildCnt = pChildren.length;
  const yChildren = yDomFragment.toArray();
  const yChildCnt = yChildren.length;
  const minCnt = min(pChildCnt, yChildCnt);
  let left = 0;
  let right = 0;
  for (; left < minCnt; left++) {
    const leftY = yChildren[left];
    const leftP = pChildren[left];
    if (!mappedIdentity(meta.mapping.get(leftY), leftP)) {
      if (equalYTypePNode(leftY, leftP)) {
        meta.mapping.set(leftY, leftP);
      } else {
        break;
      }
    }
  }
  for (; right + left < minCnt; right++) {
    const rightY = yChildren[yChildCnt - right - 1];
    const rightP = pChildren[pChildCnt - right - 1];
    if (!mappedIdentity(meta.mapping.get(rightY), rightP)) {
      if (equalYTypePNode(rightY, rightP)) {
        meta.mapping.set(rightY, rightP);
      } else {
        break;
      }
    }
  }
  y.transact(() => {
    while (yChildCnt - left - right > 0 && pChildCnt - left - right > 0) {
      const leftY = yChildren[left];
      const leftP = pChildren[left];
      const rightY = yChildren[yChildCnt - right - 1];
      const rightP = pChildren[pChildCnt - right - 1];
      if (leftY instanceof YXmlText && leftP instanceof Array) {
        if (!equalYTextPText(leftY, leftP)) {
          updateYText(leftY, leftP, meta);
        }
        left += 1;
      } else {
        let updateLeft = leftY instanceof YXmlElement && matchNodeName(leftY, leftP);
        let updateRight = rightY instanceof YXmlElement && matchNodeName(rightY, rightP);
        if (updateLeft && updateRight) {
          const equalityLeft = computeChildEqualityFactor(
            /** @type {Y.XmlElement} */
            leftY,
            /** @type {PModel.Node} */
            leftP,
            meta
          );
          const equalityRight = computeChildEqualityFactor(
            /** @type {Y.XmlElement} */
            rightY,
            /** @type {PModel.Node} */
            rightP,
            meta
          );
          if (equalityLeft.foundMappedChild && !equalityRight.foundMappedChild) {
            updateRight = false;
          } else if (!equalityLeft.foundMappedChild && equalityRight.foundMappedChild) {
            updateLeft = false;
          } else if (equalityLeft.equalityFactor < equalityRight.equalityFactor) {
            updateLeft = false;
          } else {
            updateRight = false;
          }
        }
        if (updateLeft) {
          updateYFragment(
            y,
            /** @type {Y.XmlFragment} */
            leftY,
            /** @type {PModel.Node} */
            leftP,
            meta
          );
          left += 1;
        } else if (updateRight) {
          updateYFragment(
            y,
            /** @type {Y.XmlFragment} */
            rightY,
            /** @type {PModel.Node} */
            rightP,
            meta
          );
          right += 1;
        } else {
          meta.mapping.delete(yDomFragment.get(left));
          yDomFragment.delete(left, 1);
          yDomFragment.insert(left, [
            createTypeFromTextOrElementNode(leftP, meta)
          ]);
          left += 1;
        }
      }
    }
    const yDelLen = yChildCnt - left - right;
    if (yChildCnt === 1 && pChildCnt === 0 && yChildren[0] instanceof YXmlText) {
      meta.mapping.delete(yChildren[0]);
      yChildren[0].delete(0, yChildren[0].length);
    } else if (yDelLen > 0) {
      yDomFragment.slice(left, left + yDelLen).forEach((type) => meta.mapping.delete(type));
      yDomFragment.delete(left, yDelLen);
    }
    if (left + right < pChildCnt) {
      const ins = [];
      for (let i = left; i < pChildCnt - right; i++) {
        ins.push(createTypeFromTextOrElementNode(pChildren[i], meta));
      }
      yDomFragment.insert(left, ins);
    }
  }, ySyncPluginKey);
};
var matchNodeName = (yElement, pNode) => !(pNode instanceof Array) && yElement.nodeName === pNode.type.name;

// node_modules/y-prosemirror/src/lib.js
var viewsToUpdate = null;
var updateMetas = () => {
  const ups = (
    /** @type {Map<EditorView, Map<any, any>>} */
    viewsToUpdate
  );
  viewsToUpdate = null;
  ups.forEach((metas, view) => {
    const tr = view.state.tr;
    const syncState = ySyncPluginKey.getState(view.state);
    if (syncState && syncState.binding && !syncState.binding.isDestroyed) {
      metas.forEach((val, key) => {
        tr.setMeta(key, val);
      });
      view.dispatch(tr);
    }
  });
};
var setMeta = (view, key, value) => {
  if (!viewsToUpdate) {
    viewsToUpdate = /* @__PURE__ */ new Map();
    timeout(0, updateMetas);
  }
  setIfUndefined(viewsToUpdate, view, create).set(key, value);
};
var absolutePositionToRelativePosition = (pos, type, mapping) => {
  if (pos === 0) {
    return createRelativePositionFromTypeIndex(type, 0, type.length === 0 ? -1 : 0);
  }
  let n = type._first === null ? null : (
    /** @type {Y.ContentType} */
    type._first.content.type
  );
  while (n !== null && type !== n) {
    if (n instanceof YXmlText) {
      if (n._length >= pos) {
        return createRelativePositionFromTypeIndex(n, pos, type.length === 0 ? -1 : 0);
      } else {
        pos -= n._length;
      }
      if (n._item !== null && n._item.next !== null) {
        n = /** @type {Y.ContentType} */
        n._item.next.content.type;
      } else {
        do {
          n = n._item === null ? null : n._item.parent;
          pos--;
        } while (n !== type && n !== null && n._item !== null && n._item.next === null);
        if (n !== null && n !== type) {
          n = n._item === null ? null : (
            /** @type {Y.ContentType} */
            /** @type Y.Item */
            n._item.next.content.type
          );
        }
      }
    } else {
      const pNodeSize = (
        /** @type {any} */
        (mapping.get(n) || { nodeSize: 0 }).nodeSize
      );
      if (n._first !== null && pos < pNodeSize) {
        n = /** @type {Y.ContentType} */
        n._first.content.type;
        pos--;
      } else {
        if (pos === 1 && n._length === 0 && pNodeSize > 1) {
          return new RelativePosition(n._item === null ? null : n._item.id, n._item === null ? findRootTypeKey(n) : null, null);
        }
        pos -= pNodeSize;
        if (n._item !== null && n._item.next !== null) {
          n = /** @type {Y.ContentType} */
          n._item.next.content.type;
        } else {
          if (pos === 0) {
            n = n._item === null ? n : n._item.parent;
            return new RelativePosition(n._item === null ? null : n._item.id, n._item === null ? findRootTypeKey(n) : null, null);
          }
          do {
            n = /** @type {Y.Item} */
            n._item.parent;
            pos--;
          } while (n !== type && /** @type {Y.Item} */
          n._item.next === null);
          if (n !== type) {
            n = /** @type {Y.ContentType} */
            /** @type {Y.Item} */
            /** @type {Y.Item} */
            n._item.next.content.type;
          }
        }
      }
    }
    if (n === null) {
      throw unexpectedCase();
    }
    if (pos === 0 && n.constructor !== YXmlText && n !== type) {
      return createRelativePosition(n._item.parent, n._item);
    }
  }
  return createRelativePositionFromTypeIndex(type, type._length, type.length === 0 ? -1 : 0);
};
var createRelativePosition = (type, item) => {
  let typeid = null;
  let tname = null;
  if (type._item === null) {
    tname = findRootTypeKey(type);
  } else {
    typeid = createID(type._item.id.client, type._item.id.clock);
  }
  return new RelativePosition(typeid, tname, item.id);
};
var relativePositionToAbsolutePosition = (y, documentType, relPos, mapping) => {
  const decodedPos = createAbsolutePositionFromRelativePosition(relPos, y);
  if (decodedPos === null || decodedPos.type !== documentType && !isParentOf(documentType, decodedPos.type._item)) {
    return null;
  }
  let type = decodedPos.type;
  let pos = 0;
  if (type.constructor === YXmlText) {
    pos = decodedPos.index;
  } else if (type._item === null || !type._item.deleted) {
    let n = type._first;
    let i = 0;
    while (i < type._length && i < decodedPos.index && n !== null) {
      if (!n.deleted) {
        const t = (
          /** @type {Y.ContentType} */
          n.content.type
        );
        i++;
        if (t instanceof YXmlText) {
          pos += t._length;
        } else {
          pos += /** @type {any} */
          mapping.get(t).nodeSize;
        }
      }
      n = /** @type {Y.Item} */
      n.right;
    }
    pos += 1;
  }
  while (type !== documentType && type._item !== null) {
    const parent = type._item.parent;
    if (parent._item === null || !parent._item.deleted) {
      pos += 1;
      let n = (
        /** @type {Y.AbstractType} */
        parent._first
      );
      while (n !== null) {
        const contentType = (
          /** @type {Y.ContentType} */
          n.content.type
        );
        if (contentType === type) {
          break;
        }
        if (!n.deleted) {
          if (contentType instanceof YXmlText) {
            pos += contentType._length;
          } else {
            pos += /** @type {any} */
            mapping.get(contentType).nodeSize;
          }
        }
        n = n.right;
      }
    }
    type = /** @type {Y.AbstractType} */
    parent;
  }
  return pos - 1;
};
var yXmlFragmentToProseMirrorFragment = (yXmlFragment, schema) => {
  const fragmentContent = yXmlFragment.toArray().map(
    (t) => createNodeFromYElement(
      /** @type {Y.XmlElement} */
      t,
      schema,
      createEmptyMeta()
    )
  ).filter((n) => n !== null);
  return Fragment.fromArray(fragmentContent);
};
var yXmlFragmentToProseMirrorRootNode = (yXmlFragment, schema) => schema.topNodeType.create(null, yXmlFragmentToProseMirrorFragment(yXmlFragment, schema));
var initProseMirrorDoc = (yXmlFragment, schema) => {
  const meta = createEmptyMeta();
  const fragmentContent = yXmlFragment.toArray().map(
    (t) => createNodeFromYElement(
      /** @type {Y.XmlElement} */
      t,
      schema,
      meta
    )
  ).filter((n) => n !== null);
  const doc2 = schema.topNodeType.create(null, Fragment.fromArray(fragmentContent));
  return { doc: doc2, meta, mapping: meta.mapping };
};
function prosemirrorToYDoc(doc2, xmlFragment = "prosemirror") {
  const ydoc = new Doc();
  const type = (
    /** @type {Y.XmlFragment} */
    ydoc.get(xmlFragment, YXmlFragment)
  );
  if (!type.doc) {
    return ydoc;
  }
  prosemirrorToYXmlFragment(doc2, type);
  return type.doc;
}
function prosemirrorToYXmlFragment(doc2, xmlFragment) {
  const type = xmlFragment || new YXmlFragment();
  const ydoc = type.doc ? type.doc : { transact: (transaction) => transaction(void 0) };
  updateYFragment(ydoc, type, doc2, { mapping: /* @__PURE__ */ new Map(), isOMark: /* @__PURE__ */ new Map() });
  return type;
}
function prosemirrorJSONToYDoc(schema, state, xmlFragment = "prosemirror") {
  const doc2 = Node.fromJSON(schema, state);
  return prosemirrorToYDoc(doc2, xmlFragment);
}
function prosemirrorJSONToYXmlFragment(schema, state, xmlFragment) {
  const doc2 = Node.fromJSON(schema, state);
  return prosemirrorToYXmlFragment(doc2, xmlFragment);
}
function yDocToProsemirror(schema, ydoc) {
  const state = yDocToProsemirrorJSON(ydoc);
  return Node.fromJSON(schema, state);
}
function yXmlFragmentToProsemirror(schema, xmlFragment) {
  const state = yXmlFragmentToProsemirrorJSON(xmlFragment);
  return Node.fromJSON(schema, state);
}
function yDocToProsemirrorJSON(ydoc, xmlFragment = "prosemirror") {
  return yXmlFragmentToProsemirrorJSON(ydoc.getXmlFragment(xmlFragment));
}
function yXmlFragmentToProsemirrorJSON(xmlFragment) {
  const items = xmlFragment.toArray();
  const serialize = (item) => {
    let response;
    if (item instanceof YXmlText) {
      const delta = item.toDelta();
      response = delta.map(
        /** @param {any} d */
        (d) => {
          const text = {
            type: "text",
            text: d.insert
          };
          if (d.attributes) {
            text.marks = Object.keys(d.attributes).map((type_) => {
              const attrs = d.attributes[type_];
              const type = yattr2markname(type_);
              const mark = {
                type
              };
              if (Object.keys(attrs)) {
                mark.attrs = attrs;
              }
              return mark;
            });
          }
          return text;
        }
      );
    } else if (item instanceof YXmlElement) {
      response = {
        type: item.nodeName
      };
      const attrs = item.getAttributes();
      if (Object.keys(attrs).length) {
        response.attrs = attrs;
      }
      const children = item.toArray();
      if (children.length) {
        response.content = children.map(serialize).flat();
      }
    } else {
      unexpectedCase();
    }
    return response;
  };
  return {
    type: "doc",
    content: items.map(serialize)
  };
}

// node_modules/y-prosemirror/src/plugins/cursor-plugin.js
var defaultAwarenessStateFilter = (currentClientId, userClientId, _user) => currentClientId !== userClientId;
var defaultCursorBuilder = (user) => {
  const cursor = document.createElement("span");
  cursor.classList.add("ProseMirror-yjs-cursor");
  cursor.setAttribute("style", `border-color: ${user.color}`);
  const userDiv = document.createElement("div");
  userDiv.setAttribute("style", `background-color: ${user.color}`);
  userDiv.insertBefore(document.createTextNode(user.name), null);
  const nonbreakingSpace1 = document.createTextNode("⁠");
  const nonbreakingSpace2 = document.createTextNode("⁠");
  cursor.insertBefore(nonbreakingSpace1, null);
  cursor.insertBefore(userDiv, null);
  cursor.insertBefore(nonbreakingSpace2, null);
  return cursor;
};
var defaultSelectionBuilder = (user) => {
  return {
    style: `background-color: ${user.color}70`,
    class: "ProseMirror-yjs-selection"
  };
};
var rxValidColor = /^#[0-9a-fA-F]{6}$/;
var createDecorations = (state, awareness, awarenessFilter, createCursor, createSelection) => {
  const ystate = ySyncPluginKey.getState(state);
  const y = ystate.doc;
  const decorations = [];
  if (ystate.snapshot != null || ystate.prevSnapshot != null || ystate.binding.mapping.size === 0) {
    return DecorationSet.create(state.doc, []);
  }
  awareness.getStates().forEach((aw, clientId) => {
    if (!awarenessFilter(y.clientID, clientId, aw)) {
      return;
    }
    if (aw.cursor != null) {
      const user = aw.user || {};
      if (user.color == null) {
        user.color = "#ffa500";
      } else if (!rxValidColor.test(user.color)) {
        console.warn("A user uses an unsupported color format", user);
      }
      if (user.name == null) {
        user.name = `User: ${clientId}`;
      }
      let anchor = relativePositionToAbsolutePosition(
        y,
        ystate.type,
        createRelativePositionFromJSON(aw.cursor.anchor),
        ystate.binding.mapping
      );
      let head = relativePositionToAbsolutePosition(
        y,
        ystate.type,
        createRelativePositionFromJSON(aw.cursor.head),
        ystate.binding.mapping
      );
      if (anchor !== null && head !== null) {
        const maxsize = max(state.doc.content.size - 1, 0);
        anchor = min(anchor, maxsize);
        head = min(head, maxsize);
        decorations.push(
          Decoration.widget(head, () => createCursor(user, clientId), {
            key: clientId + "",
            side: 10
          })
        );
        const from = min(anchor, head);
        const to = max(anchor, head);
        decorations.push(
          Decoration.inline(from, to, createSelection(user, clientId), {
            inclusiveEnd: true,
            inclusiveStart: false
          })
        );
      }
    }
  });
  return DecorationSet.create(state.doc, decorations);
};
var yCursorPlugin = (awareness, {
  awarenessStateFilter = defaultAwarenessStateFilter,
  cursorBuilder = defaultCursorBuilder,
  selectionBuilder = defaultSelectionBuilder,
  getSelection = (state) => state.selection
} = {}, cursorStateField = "cursor") => new Plugin({
  key: yCursorPluginKey,
  state: {
    init(_, state) {
      return createDecorations(
        state,
        awareness,
        awarenessStateFilter,
        cursorBuilder,
        selectionBuilder
      );
    },
    apply(tr, prevState, _oldState, newState) {
      const ystate = ySyncPluginKey.getState(newState);
      const yCursorState = tr.getMeta(yCursorPluginKey);
      if (ystate && ystate.isChangeOrigin || yCursorState && yCursorState.awarenessUpdated) {
        return createDecorations(
          newState,
          awareness,
          awarenessStateFilter,
          cursorBuilder,
          selectionBuilder
        );
      }
      return prevState.map(tr.mapping, tr.doc);
    }
  },
  props: {
    decorations: (state) => {
      return yCursorPluginKey.getState(state);
    }
  },
  view: (view) => {
    const awarenessListener = () => {
      if (view.docView) {
        setMeta(view, yCursorPluginKey, { awarenessUpdated: true });
      }
    };
    const updateCursorInfo = () => {
      const ystate = ySyncPluginKey.getState(view.state);
      const current = awareness.getLocalState() || {};
      if (view.hasFocus()) {
        const selection = getSelection(view.state);
        const anchor = absolutePositionToRelativePosition(
          selection.anchor,
          ystate.type,
          ystate.binding.mapping
        );
        const head = absolutePositionToRelativePosition(
          selection.head,
          ystate.type,
          ystate.binding.mapping
        );
        if (current.cursor == null || !compareRelativePositions(
          createRelativePositionFromJSON(current.cursor.anchor),
          anchor
        ) || !compareRelativePositions(
          createRelativePositionFromJSON(current.cursor.head),
          head
        )) {
          awareness.setLocalStateField(cursorStateField, {
            anchor,
            head
          });
        }
      } else if (current.cursor != null && relativePositionToAbsolutePosition(
        ystate.doc,
        ystate.type,
        createRelativePositionFromJSON(current.cursor.anchor),
        ystate.binding.mapping
      ) !== null) {
        awareness.setLocalStateField(cursorStateField, null);
      }
    };
    awareness.on("change", awarenessListener);
    view.dom.addEventListener("focusin", updateCursorInfo);
    view.dom.addEventListener("focusout", updateCursorInfo);
    return {
      update: updateCursorInfo,
      destroy: () => {
        view.dom.removeEventListener("focusin", updateCursorInfo);
        view.dom.removeEventListener("focusout", updateCursorInfo);
        awareness.off("change", awarenessListener);
        awareness.setLocalStateField(cursorStateField, null);
      }
    };
  }
});

// node_modules/y-prosemirror/src/plugins/undo-plugin.js
var undo = (state) => yUndoPluginKey.getState(state)?.undoManager?.undo() != null;
var redo = (state) => yUndoPluginKey.getState(state)?.undoManager?.redo() != null;
var undoCommand = (state, dispatch) => dispatch == null ? yUndoPluginKey.getState(state)?.undoManager?.canUndo() : undo(state);
var redoCommand = (state, dispatch) => dispatch == null ? yUndoPluginKey.getState(state)?.undoManager?.canRedo() : redo(state);
var defaultProtectedNodes = /* @__PURE__ */ new Set(["paragraph"]);
var defaultDeleteFilter = (item, protectedNodes) => !(item instanceof Item) || !(item.content instanceof ContentType) || !(item.content.type instanceof YText || item.content.type instanceof YXmlElement && protectedNodes.has(item.content.type.nodeName)) || item.content.type._length === 0;
var yUndoPlugin = ({ protectedNodes = defaultProtectedNodes, trackedOrigins = [], undoManager = null } = {}) => new Plugin({
  key: yUndoPluginKey,
  state: {
    init: (initargs, state) => {
      const ystate = ySyncPluginKey.getState(state);
      const _undoManager = undoManager || new UndoManager(ystate.type, {
        trackedOrigins: new Set([ySyncPluginKey].concat(trackedOrigins)),
        deleteFilter: (item) => defaultDeleteFilter(item, protectedNodes),
        captureTransaction: (tr) => tr.meta.get("addToHistory") !== false
      });
      return {
        undoManager: _undoManager,
        prevSel: null,
        hasUndoOps: _undoManager.undoStack.length > 0,
        hasRedoOps: _undoManager.redoStack.length > 0
      };
    },
    apply: (tr, val, oldState, state) => {
      const binding = ySyncPluginKey.getState(state).binding;
      const undoManager2 = val.undoManager;
      const hasUndoOps = undoManager2.undoStack.length > 0;
      const hasRedoOps = undoManager2.redoStack.length > 0;
      if (binding) {
        return {
          undoManager: undoManager2,
          prevSel: getRelativeSelection(binding, oldState),
          hasUndoOps,
          hasRedoOps
        };
      } else {
        if (hasUndoOps !== val.hasUndoOps || hasRedoOps !== val.hasRedoOps) {
          return Object.assign({}, val, {
            hasUndoOps: undoManager2.undoStack.length > 0,
            hasRedoOps: undoManager2.redoStack.length > 0
          });
        } else {
          return val;
        }
      }
    }
  },
  view: (view) => {
    const ystate = ySyncPluginKey.getState(view.state);
    const undoManager2 = yUndoPluginKey.getState(view.state).undoManager;
    undoManager2.on("stack-item-added", ({ stackItem }) => {
      const binding = ystate.binding;
      if (binding) {
        stackItem.meta.set(binding, yUndoPluginKey.getState(view.state).prevSel);
      }
    });
    undoManager2.on("stack-item-popped", ({ stackItem }) => {
      const binding = ystate.binding;
      if (binding) {
        binding.beforeTransactionSelection = stackItem.meta.get(binding) || binding.beforeTransactionSelection;
      }
    });
    return {
      destroy: () => {
        undoManager2.destroy();
      }
    };
  }
});
export {
  ProsemirrorBinding,
  absolutePositionToRelativePosition,
  createDecorations,
  defaultAwarenessStateFilter,
  defaultCursorBuilder,
  defaultDeleteFilter,
  defaultProtectedNodes,
  defaultSelectionBuilder,
  getRelativeSelection,
  initProseMirrorDoc,
  isVisible,
  prosemirrorJSONToYDoc,
  prosemirrorJSONToYXmlFragment,
  prosemirrorToYDoc,
  prosemirrorToYXmlFragment,
  redo,
  redoCommand,
  relativePositionToAbsolutePosition,
  setMeta,
  undo,
  undoCommand,
  updateYFragment,
  yCursorPlugin,
  yCursorPluginKey,
  yDocToProsemirror,
  yDocToProsemirrorJSON,
  ySyncPlugin,
  ySyncPluginKey,
  yUndoPlugin,
  yUndoPluginKey,
  yXmlFragmentToProseMirrorFragment,
  yXmlFragmentToProseMirrorRootNode,
  yXmlFragmentToProsemirror,
  yXmlFragmentToProsemirrorJSON
};
//# sourceMappingURL=y-prosemirror.js.map
