/* Bismillah */

// AUDIT of basic-designer (run in the designer page, with audit/audit.htm loaded):
//   1. readAudit(): the values of the panel against the real (computed) values of every object.
//   2. runChangeAudit(): every property is changed as the panel does it; the value, the prompt line, undo,
//      redo and the saved session (Revert all + apply) are checked. Results in window.AUDIT.
// Load: const sc = document.createElement("script"); sc.src = "audit/audit-runner.js"; document.head.appendChild(sc);

"use strict";

(function () {

    const BD = window.BasicDesigner;

    const sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    const flat = function (items) { return items.flatMap(function (i) { return Array.isArray(i) ? i : [i]; }); };
    const px = function (v) { return Math.round(parseFloat(v) || 0); };

    window.collectAuditObjects = function () {
        const list = {};
        const walk = function (nodes) {
            nodes.forEach(function (n) {
                const name = BD.title(n.obj).name;
                if (name) list[name] = n.obj;
                walk(n.children || []);
            });
        };
        walk(BD.state.tree);
        window.AUD = list;
        return Object.keys(list);
    };

    const W = function () { return BD.state.win; };
    let probe = null;
    const normColor = function (c) {
        if (!probe || !probe.isConnected) {
            probe = W().document.createElement("div");
            W().document.body.appendChild(probe);
        }
        probe.style.color = "";
        probe.style.color = c;
        return W().getComputedStyle(probe).color;
    };
    const fieldOf = function (o) { return o.inputElement || o.elem; };
    const textOf = function (o) { return W().getComputedStyle(o._textElem || o.elem); };
    const alignCode = function (cs) {
        const isColumn = cs.flexDirection === "column";
        const h = isColumn ? cs.alignItems : cs.justifyContent;
        const v = isColumn ? cs.justifyContent : cs.alignItems;
        const m = function (x) { return /start|left|top/.test(x) ? "S" : /end|right|bottom/.test(x) ? "E" : /center/.test(x) ? "C" : x; };
        return m(h) + m(v);
    };
    const alignTextCode = function (t) {
        const hv = { left: "S", center: "C", right: "E", top: "S", bottom: "E" };
        const p = String(t).split(" ");
        if (p.length === 1) return (t === "center") ? "CC" : t;
        return hv[p[0]] + hv[p[1]];
    };

    // A list of the panel ("12, 0") and the four values basic.js draws for it: corners (12, 12, 0, 0: top left, top
    // right, bottom right, bottom left) or sides (left, top, right, bottom: "0, 1" -> 0, 1, 0, 1).
    const isListText = function (v) { return typeof v === "string" && v.indexOf(",") !== -1; };
    const fourValuesOf = function (v, isCorners) {
        const n = String(v).split(",").map(function (x) { return Number(x.trim()); });
        if (n.length === 4) return n;
        if (n.length === 1) return [n[0], n[0], n[0], n[0]];
        return (isCorners) ? [n[0], n[0], n[1], n[1]] : [n[0], n[1], n[0], n[1]];
    };
    const screenCorners = function (el) {
        const c = W().getComputedStyle(el);
        return [c.borderTopLeftRadius, c.borderTopRightRadius, c.borderBottomRightRadius, c.borderBottomLeftRadius].map(px);
    };
    // prefix + side + suffix: "border" + "Left" + "Width", "padding" + "Left" + ""
    const screenSides = function (el, prefix, suffix) {
        const c = W().getComputedStyle(el);
        return ["Left", "Top", "Right", "Bottom"].map(function (side) { return px(c[prefix + side + suffix]); });
    };

    // key -> function (obj, value) -> [real, expected] or null (not checked)
    window.TRUTH = {
        width: function (o, v) { return (typeof v === "number") ? [o.elem.offsetWidth, v] : null; },
        height: function (o, v) { return (typeof v === "number") ? [o.elem.offsetHeight, v] : null; },
        color: function (o, v) { return [W().getComputedStyle(fieldOf(o)).backgroundColor, normColor(v || "transparent")]; },
        opacity: function (o, v) { return [Number(W().getComputedStyle(o.elem).opacity), Number(v)]; },
        round: function (o, v) {
            if (isListText(v)) return [String(screenCorners(fieldOf(o))), String(fourValuesOf(v, true))];
            return [px(W().getComputedStyle(fieldOf(o)).borderTopLeftRadius), Number(v)];
        },
        border: function (o, v) {
            if (isListText(v)) return [String(screenSides(fieldOf(o), "border", "Width")), String(fourValuesOf(v, false))];
            return [px(W().getComputedStyle(fieldOf(o)).borderTopWidth), Number(v)];
        },
        borderColor: function (o, v) {
            const c = W().getComputedStyle(fieldOf(o));
            return px(c.borderTopWidth) ? [c.borderTopColor, normColor(v)] : null;
        },
        rotate: function (o, v) {
            const m = W().getComputedStyle(o.elem).transform;
            if (m === "none") return [0, Number(v)];
            const parts = m.slice(7, -1).split(",").map(Number);
            return [Math.round(Math.atan2(parts[1], parts[0]) * 180 / Math.PI), Number(v)];
        },
        // WHY through the probe: the browser writes a shadow in its own order ("rgba(...) 0px 2px 8px"), so the same
        //      shadow as text looked different (a failure of the audit, not of the designer).
        boxShadow: function (o, v) {
            if (!v) return null;
            normColor("black"); // makes the probe
            probe.style.boxShadow = v;
            const expected = W().getComputedStyle(probe).boxShadow;
            probe.style.boxShadow = "";
            return [W().getComputedStyle(o.elem).boxShadow, expected];
        },
        gap: function (o, v) {
            const c = W().getComputedStyle(o.elem);
            if (isListText(v)) return [px(c.columnGap) + ", " + px(c.rowGap), String(v)];
            return [px(c.rowGap), Number(v)];
        },
        padding: function (o, v) {
            if (isListText(v)) return [String(screenSides(o.elem, "padding", "")), String(fourValuesOf(v, false))];
            return (typeof v === "number") ? [px(W().getComputedStyle(o.elem).paddingTop), v] : null;
        },
        flow: function (o, v) { return [W().getComputedStyle(o.elem).flexDirection === "column" ? "vertical" : "horizontal", v]; },
        wrap: function (o, v) { return [W().getComputedStyle(o.elem).flexWrap === "wrap" ? 1 : 0, v ? 1 : 0]; },
        align: function (o, v) { return [alignCode(W().getComputedStyle(o.elem)), alignTextCode(v)]; },
        fontSize: function (o, v) { return [px(textOf(o).fontSize), Number(v)]; },
        textColor: function (o, v) { return [textOf(o).color, normColor(v)]; },
        bold: function (o, v) { const t = textOf(o); return [(/bold/i.test(t.fontFamily) || Number(t.fontWeight) >= 600) ? 1 : 0, v ? 1 : 0]; },
        italic: function (o, v) { return [textOf(o).fontStyle === "italic" ? 1 : 0, v ? 1 : 0]; },
        visible: function (o, v) { return [W().getComputedStyle(o.elem).display === "none" ? 0 : 1, Number(v)]; },
        zIndex: function (o, v) { return [parseInt(W().getComputedStyle(o.elem).zIndex, 10) || 0, Number(v)]; },
        left: function (o, v) { return (v === "") ? null : [o.elem.offsetLeft, Number(v)]; },
        top: function (o, v) { return (v === "") ? null : [o.elem.offsetTop, Number(v)]; },
        minimal: function (o, v) { const el = o.buttonElement || o.inputElement; return el ? [el.classList.contains("minimal") ? 1 : 0, Number(v)] : null; },
        placeholder: function (o, v) { return o.inputElement ? [o.inputElement.placeholder, v] : null; },
        textAlign: function (o, v) { const t = textOf(o).textAlign; return [(t === "start") ? "left" : t, v]; },
        text: function (o, v) {
            if (o.inputElement) return null; // the text of an Input is its value, not in the panel
            const el = o._textElem || o.buttonElement || o.elem;
            return [el.textContent, v];
        },
        lineHeight: function (o, v) { return (typeof v === "number" && v) ? [px(textOf(o).lineHeight), v] : null; },
        fontFamily: function (o, v) { return v ? [textOf(o).fontFamily.indexOf(v) !== -1 ? v : textOf(o).fontFamily, v] : null; },
        ellipsis: function (o, v) { return [textOf(o).textOverflow === "ellipsis" ? 1 : 0, v ? 1 : 0]; },
        cursor: function (o, v) { return v ? [W().getComputedStyle(o.elem).cursor, v] : null; },
        clipContent: function (o, v) { return [W().getComputedStyle(o.elem).overflow === "visible" ? 0 : 1, Number(v)]; },
        scrollY: function (o, v) { return [/(auto|scroll)/.test(W().getComputedStyle(o.elem).overflowY) ? 1 : 0, Number(v)]; },
        scrollX: function (o, v) { return [/(auto|scroll)/.test(W().getComputedStyle(o.elem).overflowX) ? 1 : 0, Number(v)]; },
        enabled: function (o, v) { const el = o.inputElement || o.buttonElement; return el ? [el.disabled ? 0 : 1, Number(v)] : null; },
        readOnly: function (o, v) { return o.inputElement ? [o.inputElement.readOnly ? 1 : 0, Number(v)] : null; },
        inputType: function (o, v) { return o.inputElement ? [o.inputElement.type, v] : null; },
        maxLength: function (o, v) { return (o.inputElement && v) ? [o.inputElement.maxLength, Number(v)] : null; },
    };

    window.readAudit = function () {
        const bad = [];
        Object.keys(window.AUD).forEach(function (name) {
            const o = window.AUD[name];
            const items = flat(BD.propertySections(BD.readProps(o)).flatMap(function (sec) { return sec.items; }));
            items.forEach(function (i) {
                const f = window.TRUTH[i.key];
                if (!f) return;
                const r = f(o, i.value);
                if (r && String(r[0]) !== String(r[1])) bad.push(name + "." + i.key + ": panel " + JSON.stringify(i.value) + " / real " + JSON.stringify(r[0]));
            });
        });
        return bad;
    };

    const VALUES = { width: 222, height: 77, color: "#FF8800", opacity: 0.5, round: 12, border: 3, borderColor: "#00AA00", rotate: 10, gap: 9, padding: 7, flow: "__toggle", wrap: true, align: "right bottom", justify: "space-between", fontSize: 19, textColor: "#AA0000", textAlign: "right", bold: "__toggle", italic: true, visible: 0, zIndex: 5, minimal: "__toggle", placeholder: "abc", maxLength: 5, text: "Hello there", lineHeight: 30, ellipsis: true, fontFamily: "serif", cursor: "pointer", clickable: "__toggle", clipContent: 0, scrollY: 1, scrollX: 1, enabled: 0, readOnly: 1, inputType: "password", imageFit: "cover", alt: "pic", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", selectable: 1, space: 4, autoSize: 1 };

    const promptHas = function (key) {
        return (BD.buildPrompt() || "").split("\n").some(function (l) { return l.indexOf("- " + key + ": ") !== -1; });
    };

    const valueOk = function (o, key, expected) {
        const f = window.TRUTH[key];
        if (f) {
            const r = f(o, expected);
            if (r) return (String(r[0]) === String(r[1])) ? true : "real " + JSON.stringify(r[0]);
        }
        const now = BD.readProps(o)[key];
        const same = String(now) === String(expected) || (typeof expected === "boolean" && Number(now) === Number(expected));
        return same ? true : "read " + JSON.stringify(now);
    };

    // What the screen shows of the keys the panel reads differently (lineHeight, and the lists: padding, border, round,
    // gap): undo must bring it back.
    // WHY: readProps() was the same before and after, so a Label left 0 px high passed.
    const SCREEN_KEYS = ["lineHeight", "padding", "border", "round", "gap"];
    const screenLook = function (o) {
        const box = W().getComputedStyle(o.elem);
        const field = fieldOf(o);
        return [textOf(o).lineHeight, String(screenSides(o.elem, "padding", "")), o.elem.offsetHeight,
            String(screenSides(field, "border", "Width")), String(screenCorners(field)), box.columnGap + " " + box.rowGap].join(" / ");
    };

    // only: [names] (optional)
    window.runChangeAudit = async function (only) {
        const AUDIT = window.AUDIT = { done: false, tested: 0, fails: [], at: "" };
        const names = only || Object.keys(window.AUD);
        for (const name of names) {
            const o = window.AUD[name];
            const keys = flat(BD.propertySections(BD.readProps(o)).flatMap(function (sec) { return sec.items; }))
                .map(function (i) { return i.key; })
                .filter(function (k) { return k[0] !== "_" && VALUES[k] !== undefined; });
            for (const key of keys) {
                BD.select(o);
                await sleep(30);
                const orig = BD.readProps(o)[key];
                const lookBefore = screenLook(o);
                let value = VALUES[key];
                if (value === "__toggle") value = (key === "flow") ? (orig === "vertical" ? "horizontal" : "vertical") : (Number(orig) ? 0 : 1);
                // WHY Number: true and 1 are the same value of a switch (wrap: 1 of groupLists): no change, no prompt line
                const isSameValue = (String(value) === String(orig)) || (typeof value === "boolean" && Number(value) === Number(orig));
                if (isSameValue) continue;
                AUDIT.tested++;
                AUDIT.at = name + "." + key;
                const fail = function (text) { AUDIT.fails.push(name + "." + key + " " + text); };
                try {
                    BD.onPropertyChange({ kind: "value", key: key, value: value });
                    await sleep(650); // WHY: More than HISTORY_MERGE_TIME: every change is an undo step of its own.
                    const ok1 = valueOk(o, key, value);
                    if (ok1 !== true) fail("apply " + JSON.stringify(value) + ": " + ok1);
                    if (!promptHas(key)) fail("prompt: no line");
                    // The saved session: Revert all, then apply it (the same as a reload with Apply)
                    const session = BD.buildSession();
                    BD.revertAll();
                    const back0 = BD.readProps(o)[key];
                    if (String(back0) !== String(orig)) fail("revert all: " + JSON.stringify(back0) + " (was " + JSON.stringify(orig) + ")");
                    BD.applySession(session);
                    BD.refreshChanges();
                    const ok3 = valueOk(o, key, value);
                    if (ok3 !== true) fail("session apply: " + ok3);
                    BD.undo();
                    await sleep(120);
                    const back = BD.readProps(o)[key];
                    if (String(back) !== String(orig)) fail("undo: " + JSON.stringify(back) + " (was " + JSON.stringify(orig) + ")");
                    if (promptHas(key)) fail("undo: the line is still in the prompt");
                    BD.redo();
                    await sleep(120);
                    const ok2 = valueOk(o, key, value);
                    if (ok2 !== true) fail("redo: " + ok2);
                    BD.undo();
                    await sleep(120);
                    if (SCREEN_KEYS.indexOf(key) !== -1) {
                        const lookAfter = screenLook(o);
                        if (lookAfter !== lookBefore) fail("undo, on the screen: " + lookAfter + " (was " + lookBefore + ")");
                    }
                } catch (error) {
                    fail("ERROR " + error.message);
                }
            }
        }
        AUDIT.done = true;
        return AUDIT;
    };

    // One check: run(), then isDone() (true or a text), the prompt pattern, Revert all + apply the saved session,
    // undo (isBack()), redo, undo. Fails go to R.fails, the name to R.passed when it ran.
    const checkStep = async function (R, name, run, isDone, promptPattern, isBack) {
        const prompt = function () { return BD.buildPrompt() || ""; };
        try {
            BD.discardSession();
            await sleep(50);
            await run();
            await sleep(650);
            const ok = isDone();
            if (ok !== true) R.fails.push(name + ": not done (" + ok + ")");
            if (promptPattern && !promptPattern.test(prompt())) R.fails.push(name + ": prompt has no " + promptPattern);
            const session = BD.buildSession();
            BD.revertAll();
            await sleep(100);
            const back0 = isBack();
            if (back0 !== true) R.fails.push(name + ": revert all (" + back0 + ")");
            BD.applySession(session);
            BD.refreshChanges();
            await sleep(100);
            const again = isDone();
            if (again !== true) R.fails.push(name + ": session apply (" + again + ")");
            BD.undo();
            await sleep(200);
            const back = isBack();
            if (back !== true) R.fails.push(name + ": undo (" + back + ")");
            if (promptPattern && promptPattern.test(prompt())) R.fails.push(name + ": undo left it in the prompt");
            BD.redo();
            await sleep(200);
            const redo = isDone();
            if (redo !== true) R.fails.push(name + ": redo (" + redo + ")");
            BD.undo();
            await sleep(200);
            R.passed.push(name);
        } catch (error) {
            R.fails.push(name + ": ERROR " + error.message);
        }
    };

    // The special fields: positioning, anchor, a side value, a note, "All N from this line", delete, move,
    // a component param. Each: the result, the prompt, undo, the saved session (Revert all + apply).
    window.runSpecialAudit = async function () {
        const R = window.SPECIAL = { done: false, fails: [], passed: [] };
        const prompt = function () { return BD.buildPrompt() || ""; };
        const rectOf = function (o) { const r = o.elem.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round).join(","); };
        const posOf = function (o) { return W().getComputedStyle(o.elem).position; };
        const check = function (name, run, isDone, promptPattern, isBack) { return checkStep(R, name, run, isDone, promptPattern, isBack); };
        const A = window.AUD;
        const same = function (a, b) { return (a === b) ? true : JSON.stringify(a) + " != " + JSON.stringify(b); };

        // 1. Positioning: auto -> manual (a label in a group): absolute, at the same place
        let rect1 = "";
        await check("positioning manual", async function () {
            rect1 = rectOf(A.labelGiven);
            BD.select(A.labelGiven); await sleep(30);
            BD.onPropertyChange({ kind: "value", key: "__positioning", value: "manual" });
        }, function () { return (posOf(A.labelGiven) === "absolute") ? same(rectOf(A.labelGiven), rect1) : "position " + posOf(A.labelGiven); },
        /- (position|left|top): /, function () { return same(posOf(A.labelGiven), "relative"); });

        // 2. Anchor: the right side (a manual box): right is set, left cleared, at the same place
        let rect2 = "";
        await check("anchor right", async function () {
            rect2 = rectOf(A.boxGiven);
            BD.select(A.boxGiven); await sleep(30);
            BD.onPropertyChange({ kind: "value", key: "__hAnchor", value: "right" });
        }, function () { const st = A.boxGiven.elem.style; return (st.right !== "" && st.left === "") ? same(rectOf(A.boxGiven), rect2) : "left " + st.left + " right " + st.right; },
        /- right: /, function () { const st = A.boxGiven.elem.style; return (st.left !== "" && st.right === "") ? true : "left " + st.left + " right " + st.right; });

        // 3. A side value: left 77
        await check("left 77", async function () {
            BD.select(A.boxGiven); await sleep(30);
            BD.onPropertyChange({ kind: "value", key: "left", value: 77 });
        }, function () { return same(A.boxGiven.elem.offsetLeft, 77); }, /- left: .*77/, function () { return same(A.boxGiven.elem.offsetLeft, 140); });

        // 4. A note
        await check("note", async function () {
            BD.select(A.labelPlain); await sleep(30);
            BD.onPropertyChange({ kind: "value", key: "__note", value: "Make it a title" });
        }, function () { return same(BD.state.notes.get(A.labelPlain.__bd.id), "Make it a title"); },
        /- note: Make it a title/, function () { return same(BD.state.notes.has(A.labelPlain.__bd.id), false); });

        // 5. All 3 from this line: the font size of the three loop labels
        const loopLabels = BD.childObjects(A.loopGroup);
        await check("scope line (3 labels)", async function () {
            BD.select(loopLabels[0]); await sleep(30);
            BD.onPropertyChange({ kind: "value", key: "__scope", value: "line" });
            BD.onPropertyChange({ kind: "value", key: "fontSize", value: 25 });
        }, function () { const sizes = loopLabels.map(function (l) { return BD.readProps(l).fontSize; }); return same(sizes.join(","), "25,25,25"); },
        /seen on all 3 objects/, function () { const sizes = loopLabels.map(function (l) { return BD.readProps(l).fontSize; }); return same(sizes.join(","), "16,16,16"); });
        BD.state.scope = "one";

        // 6. Delete (a label in a group): it goes, it comes back at its place
        const placeOf = function (o) { return o.elem.isConnected ? Array.prototype.indexOf.call(o.elem.parentElement.children, o.elem) + "@" + (o.elem.parentElement === A.groupPlain.elem) : "gone"; };
        const place6 = placeOf(A.labelPlain);
        await check("delete", async function () {
            BD.deleteObject(A.labelPlain);
        }, function () { return same(A.labelPlain.elem.isConnected, false); }, /- delete it/, function () { return same(placeOf(A.labelPlain), place6); });

        // 7. Move (a button into the other group)
        const place7 = placeOf(A.buttonPlain);
        await check("move", async function () {
            BD.moveObject(A.buttonPlain, { container: A.groupGiven, before: null });
        }, function () { return same(A.buttonPlain.elem.parentElement === A.groupGiven.elem, true); }, /- move it/, function () { return same(placeOf(A.buttonPlain), place7); });

        // 8. A component param: the label text of the CheckBox
        const textOfCheck = function () { const o = BD.objectOfKey(String(A.checkPlain.__bd.id)) || A.checkPlain; return o.labelText; };
        await check("component param", async function () {
            const o = BD.objectOfKey(String(A.checkPlain.__bd.id)) || A.checkPlain;
            BD.applyParam(o, ["labelText"], "Changed", "Check me");
        }, function () { return same(textOfCheck(), "Changed"); }, /labelText/, function () { return same(textOfCheck(), "Check me"); });

        R.done = true;
        return R;
    };

    // A pointer event for the handlers of the designer (they read clientX / Y, button, shiftKey).
    const pointer = function (x, y, extra) {
        return Object.assign({ clientX: x, clientY: y, button: 0, pointerId: 1, shiftKey: false, metaKey: false, ctrlKey: false,
            target: document.elementFromPoint(x, y) || document.body, preventDefault: function () { }, stopPropagation: function () { } }, extra || {});
    };
    // The center of an object of the page, in the coordinates of the designer (the canvas frame is an iframe).
    const screenCenter = function (o) {
        const frame = BD.ui.frameBox.elem.getBoundingClientRect();
        const r = o.elem.getBoundingClientRect();
        return { x: frame.left + r.left + r.width / 2, y: frame.top + r.top + r.height / 2 };
    };
    // The row of an object in the layers (its element), opened and scrolled to.
    const rowOf = function (o) {
        BD.ui.tree.setValue(String(o.__bd.id), 1);
        const rows = Array.from(BD.ui.tree.elem.querySelectorAll("*")).filter(function (el) { return el._treeRec && el.offsetParent; });
        return rows.find(function (el) { return el._treeRec.node.key === String(o.__bd.id); }) || null;
    };
    const dragTree = async function (o, toX, toY) {
        const row = rowOf(o);
        const r = row.getBoundingClientRect();
        BD.pressDrag(pointer(r.left + 40, r.top + r.height / 2), { kind: "move", obj: BD.movableOf(o) });
        BD.onDragMove(pointer(r.left + 40, r.top + r.height / 2 + 8));
        BD.onDragMove(pointer(toX, toY));
        BD.onDragEnd(pointer(toX, toY));
    };

    // The mouse: move a manual object (also with Shift, also one placed from the right), resize it, drag rows in
    // the layers (into a group, before a row, out of a group, on the Page row), Cmd+drag into another box on the
    // canvas, a new object from the toolbox. Snap is off while it runs (the numbers are exact).
    window.runMouseAudit = async function () {
        const R = window.MOUSE = { done: false, fails: [], passed: [] };
        const check = function (name, run, isDone, promptPattern, isBack) { return checkStep(R, name, run, isDone, promptPattern, isBack); };
        const A = window.AUD;
        const same = function (a, b) { return (a === b) ? true : JSON.stringify(a) + " != " + JSON.stringify(b); };
        const wasSnap = BD.settings.snap;
        BD.settings.snap = false;
        const parentOf = function (o) { return o.elem.parentElement; };
        const indexIn = function (o) { return Array.prototype.indexOf.call(o.elem.parentElement.children, o.elem); };

        // 1. Move a manual box: +60, +30
        const box = A.boxGiven;
        const L0 = box.elem.offsetLeft;
        const T0 = box.elem.offsetTop;
        await check("move a manual box", async function () {
            const c = screenCenter(box);
            BD.pressMove(pointer(c.x, c.y), box);
            BD.onMoveMove(pointer(c.x + 30, c.y + 10));
            BD.onMoveMove(pointer(c.x + 60, c.y + 30));
            BD.onMoveEnd(pointer(c.x + 60, c.y + 30));
        }, function () { return same([box.elem.offsetLeft, box.elem.offsetTop].join(","), [L0 + 60, T0 + 30].join(",")); },
        /- left: .* -> |- left: |then left/, function () { return same([box.elem.offsetLeft, box.elem.offsetTop].join(","), [L0, T0].join(",")); });

        // 2. Shift: one direction only
        await check("move with shift", async function () {
            const c = screenCenter(box);
            BD.pressMove(pointer(c.x, c.y), box);
            BD.onMoveMove(pointer(c.x + 50, c.y + 12, { shiftKey: true }));
            BD.onMoveEnd(pointer(c.x + 50, c.y + 12, { shiftKey: true }));
        }, function () { return same([box.elem.offsetLeft, box.elem.offsetTop].join(","), [L0 + 50, T0].join(",")); },
        /- left: /, function () { return same([box.elem.offsetLeft, box.elem.offsetTop].join(","), [L0, T0].join(",")); });

        // 3. A box placed from the right keeps the right side when it is moved
        await check("move from the right side", async function () {
            BD.select(box); await sleep(30);
            BD.onPropertyChange({ kind: "value", key: "__hAnchor", value: "right" });
            await sleep(650);
            const c = screenCenter(box);
            BD.pressMove(pointer(c.x, c.y), box);
            BD.onMoveMove(pointer(c.x - 40, c.y));
            BD.onMoveEnd(pointer(c.x - 40, c.y));
        }, function () { const st = box.elem.style; return (st.left === "" && st.right !== "") ? same(box.elem.offsetLeft, L0 - 40) : "left " + st.left + " right " + st.right; },
        /- right: /, function () { return same([box.elem.style.left !== "", box.elem.offsetLeft].join(","), ["true", L0].join(",")); });

        // 4. Resize from the bottom right handle: +40, +20
        const W0 = box.elem.offsetWidth;
        const H0 = box.elem.offsetHeight;
        await check("resize se", async function () {
            BD.select(box); await sleep(30);
            const r = box.elem.getBoundingClientRect();
            const frame = BD.ui.frameBox.elem.getBoundingClientRect();
            const x = frame.left + r.right;
            const y = frame.top + r.bottom;
            BD.startResize(pointer(x, y), "se");
            BD.onResizeMove(pointer(x + 40, y + 20));
            BD.onResizeEnd(pointer(x + 40, y + 20));
        }, function () { return same([box.elem.offsetWidth, box.elem.offsetHeight].join(","), [W0 + 40, H0 + 20].join(",")); },
        /- width: /, function () { return same([box.elem.offsetWidth, box.elem.offsetHeight].join(","), [W0, H0].join(",")); });

        // 5. Resize from the left handle: the width grows to the left, left changes
        await check("resize w", async function () {
            BD.select(box); await sleep(30);
            const r = box.elem.getBoundingClientRect();
            const frame = BD.ui.frameBox.elem.getBoundingClientRect();
            const x = frame.left + r.left;
            const y = frame.top + r.top + r.height / 2;
            BD.startResize(pointer(x, y), "w");
            BD.onResizeMove(pointer(x - 30, y));
            BD.onResizeEnd(pointer(x - 30, y));
        }, function () { return same([box.elem.offsetWidth, box.elem.offsetLeft].join(","), [W0 + 30, L0 - 30].join(",")); },
        /- width: /, function () { return same([box.elem.offsetWidth, box.elem.offsetLeft].join(","), [W0, L0].join(",")); });

        // 6. Layers: a label into another group (the middle of the group row)
        const label = A.labelPlain;
        const home = parentOf(label);
        const homeIndex = indexIn(label);
        await check("layers: into a group", async function () {
            const r = rowOf(A.groupGiven).getBoundingClientRect();
            await dragTree(label, r.left + 60, r.top + r.height / 2);
        }, function () { return same(parentOf(label) === A.groupGiven.elem, true); }, /- move it/, function () { return same(parentOf(label) === home && indexIn(label) === homeIndex, true); });

        // 7. Layers: before a row (the top half of the button row: the same group, before it)
        await check("layers: before a row", async function () {
            const r = rowOf(A.inputPlain).getBoundingClientRect();
            await dragTree(label, r.left + 60, r.top + 3);
        }, function () { return same(label.elem.nextElementSibling === A.inputPlain.elem, true); }, /- move it/, function () { return same(indexIn(label), homeIndex); });

        // 8. Layers: out of the group (the last row of groupPlain, the mouse at the left of its icon)
        await check("layers: out of a group", async function () {
            const r = rowOf(A.inputPlain).getBoundingClientRect();
            await dragTree(A.inputPlain, BD.ui.tree.elem.getBoundingClientRect().left + 4, r.bottom - 3);
        }, function () { return same(A.inputPlain.elem.parentElement === A.groupPlain.elem, false) === true ? same(A.inputPlain.containerBox === A.groupPlain.containerBox, true) : "still in the group"; },
        /- move it/, function () { return same(A.inputPlain.elem.parentElement === A.groupPlain.elem, true); });

        // 9. Layers: on the Page row: to the top level of the page
        await check("layers: on the Page row", async function () {
            const r = BD.ui.pageRow.elem.getBoundingClientRect();
            await dragTree(A.iconPlain, r.left + 40, r.top + r.height / 2);
        }, function () { return same(A.iconPlain.elem.parentElement === BD.state.win.page.elem, true); },
        /- move it/, function () { return same(A.iconPlain.elem.parentElement === A.rowPlain.elem, true); });

        // 10. Canvas: Cmd+drag a manual box into a group
        await check("canvas: cmd+drag into a group", async function () {
            const c = screenCenter(A.boxPlain);
            const to = screenCenter(A.groupPlain);
            BD.pressDrag(pointer(c.x, c.y, { metaKey: true }), { kind: "move", obj: A.boxPlain });
            BD.onDragMove(pointer(c.x + 10, c.y + 10, { metaKey: true }));
            BD.onDragMove(pointer(to.x, to.y, { metaKey: true }));
            BD.onDragEnd(pointer(to.x, to.y, { metaKey: true }));
        }, function () { return same(A.boxPlain.elem.parentElement === A.groupPlain.elem, true); },
        /- move it/, function () { return same(A.boxPlain.elem.parentElement === BD.state.win.page.elem, true); });

        // 11. Toolbox: a new Label dropped on the page
        let added = null;
        await check("toolbox: a new label", async function () {
            const item = BD.toolboxItems.find(function (i) { return i.type === "Label"; });
            const frame = BD.ui.frameBox.elem.getBoundingClientRect();
            const x = frame.left + 700;
            const y = frame.top + 400;
            BD.pressDrag(pointer(x - 200, y + 200), { kind: "new", item: item });
            BD.onDragMove(pointer(x - 190, y + 190));
            BD.onDragMove(pointer(x, y));
            BD.onDragEnd(pointer(x, y));
            added = BD.state.addedObjects[BD.state.addedObjects.length - 1] || null;
        }, function () { const o = BD.state.addedObjects[0]; return (o && o.elem.isConnected) ? same(o.text, "New label") : "not added"; },
        /NEW: added/, function () { return same(BD.state.addedObjects.length, 0); });

        BD.settings.snap = wasSnap;
        R.done = true;
        return R;
    };

    // The look of an object as a text: what a copy must have the same.
    const lookOf = function (o) {
        const field = o.buttonElement || o.inputElement || o.elem;
        const c = W().getComputedStyle(field);
        const t = W().getComputedStyle(o._textElem || field);
        const box = W().getComputedStyle(o.elem);
        return [o.elem.offsetWidth, o.elem.offsetHeight, c.backgroundColor, c.backgroundImage === "none" ? "flat" : "shade",
            String(screenSides(field, "border", "Width")), c.borderTopColor, String(screenCorners(field)), box.opacity, t.fontSize,
            t.color, t.textAlign, t.fontWeight, t.fontStyle, t.fontFamily, t.lineHeight, String(screenSides(o.elem, "padding", "")),
            box.columnGap + " " + box.rowGap, box.justifyContent, box.alignItems,
            (o.inputElement) ? o.inputElement.placeholder : "", (o._textElem || field).textContent].join(" | ");
    };
    const diffLook = function (a, b) {
        const x = lookOf(a).split(" | ");
        const y = lookOf(b).split(" | ");
        const names = ["width", "height", "color", "shade", "border", "borderColor", "round", "opacity", "fontSize", "textColor", "textAlign", "fontWeight", "fontStyle", "fontFamily", "lineHeight", "padding", "gap", "justify", "alignItems", "placeholder", "text"];
        const out = [];
        x.forEach(function (v, i) { if (v !== y[i]) out.push(names[i] + " " + v + " / copy " + y[i]); });
        return out.length ? out.join("; ") : true;
    };

    // More: Cmd+D copies (they must look the same), arrow keys (move / order), text in place, the eye,
    // an added object changed later, revert of one object (moved, deleted, added), a component box + param.
    window.runExtraAudit = async function () {
        const R = window.EXTRA = { done: false, fails: [], passed: [] };
        const check = function (name, run, isDone, promptPattern, isBack) { return checkStep(R, name, run, isDone, promptPattern, isBack); };
        const A = window.AUD;
        const same = function (a, b) { return (a === b) ? true : JSON.stringify(a) + " != " + JSON.stringify(b); };
        const lastAdded = function () { return BD.state.addedObjects[BD.state.addedObjects.length - 1] || null; };
        const copyCheck = async function (name, source, prepare) {
            // WHY: The first object added by the copy is the copy itself (a group adds what is in it after it).
            const copyOf = function () { return BD.state.addedObjects[0] || null; };
            await check(name, async function () {
                if (prepare) { await prepare(); await sleep(650); }
                BD.select(source); await sleep(30);
                BD.duplicateObject(source);
                await sleep(100);
            }, function () { const copy = copyOf(); return copy ? diffLook(source, copy) : "no copy"; },
            /NEW: added/, function () { return same(BD.state.addedObjects.length, 0); });
        };

        // 1-4. Copies look the same
        await copyCheck("copy a label", A.labelGiven);
        await copyCheck("copy a button", A.buttonGiven);
        await copyCheck("copy a minimal button", A.buttonPlain, async function () {
            BD.select(A.buttonPlain); await sleep(30);
            BD.onPropertyChange({ kind: "value", key: "minimal", value: 1 });
        });
        await copyCheck("copy an input", A.inputGiven);
        await copyCheck("copy a group", A.groupGiven);

        // The code of a copy leaves out the values basic.js gives anyway, and keeps the given ones (the copy looks the same)
        const copyCodeOf = function (type) {
            return (BD.buildPrompt() || "").split("\n").find(function (l) { return l.indexOf("code: " + type + "(") !== -1; }) || "";
        };
        const copyCodeCheck = async function (name, source, mustHave, mustNotHave) {
            await check(name, async function () {
                BD.select(source); await sleep(30);
                BD.duplicateObject(source);
                await sleep(100);
            }, function () {
                const copy = BD.state.addedObjects[0];
                if (!copy) return "no copy";
                const look = diffLook(source, copy);
                if (look !== true) return look;
                const code = copyCodeOf(BD.typeOf(source));
                const missing = mustHave.filter(function (part) { return code.indexOf(part) === -1; });
                const extra = mustNotHave.filter(function (part) { return code.indexOf(part) !== -1; });
                return (missing.length || extra.length) ? "missing " + JSON.stringify(missing) + ", not needed " + JSON.stringify(extra) + ": " + code : true;
            }, /NEW: added/, function () { return same(BD.state.addedObjects.length, 0); });
        };
        await copyCodeCheck("copy code: no defaults of a Box", A.boxPlain, [], ["width:", "height:", "color:", "opacity:", "round:", "border:", "borderColor:", "padding:"]);
        await copyCodeCheck("copy code: the given values of a Box", A.boxGiven,
            ["width: 160", "height: 90", "color: \"#E8EEF3\"", "opacity: 0.9", "round: 8", "border: 2", "borderColor: \"#3871E0\""], ["padding:"]);
        await copyCodeCheck("copy code: a Button keeps only what differs", A.buttonGiven,
            ["width: 100", "height: 36", "fontSize: 14", "color: \"tomato\"", "round: 18", "text: \"Given\""], ["textAlign:", "opacity:", "minimal:", "border:", "bold:"]);
        // WHY the flex styles: a group wrote them into the props the designer gave it, and they went into the code
        await copyCodeCheck("copy code: a group without its flex styles", A.groupGiven,
            ["width: 600", "height: \"auto\"", "gap: 12", "padding: 16", "color: \"white\"", "round: 10", "align: \"left top\""],
            ["flow:", "flexDirection", "alignItems", "justifyContent", "alignContent", "flexWrap", "opacity:"]);

        // 5. Arrow keys on a manual box: 3 x right, Shift+down
        const box = A.boxGiven;
        const L0 = box.elem.offsetLeft;
        const T0 = box.elem.offsetTop;
        await check("arrow keys move", async function () {
            BD.select(box); await sleep(30);
            BD.moveByKey(box, "ArrowRight", false);
            BD.moveByKey(box, "ArrowRight", false);
            BD.moveByKey(box, "ArrowRight", false);
            BD.moveByKey(box, "ArrowDown", true);
        }, function () { return same([box.elem.offsetLeft, box.elem.offsetTop].join(","), [L0 + 3, T0 + BD.NUDGE_BIG_STEP].join(",")); },
        /- left: /, function () { return same([box.elem.offsetLeft, box.elem.offsetTop].join(","), [L0, T0].join(",")); });

        // 6. Arrow up in a group: the object goes before its neighbor
        const input = A.inputPlain;
        await check("arrow keys order", async function () {
            BD.select(input); await sleep(30);
            BD.moveByKey(input, "ArrowUp", false);
        }, function () { return same(input.elem.nextElementSibling === A.buttonPlain.elem, true); },
        /- move it/, function () { return same(input.elem.previousElementSibling === A.buttonPlain.elem, true); });

        // 7. Text in place: Enter saves it
        const label = A.labelPlain;
        await check("text in place", async function () {
            BD.editTextInPlace(label);
            await sleep(50);
            const field = document.activeElement;
            field.value = "Edited text";
            field.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        }, function () { return same(label.text, "Edited text"); }, /- text: /, function () { return same(label.text, "Plain label"); });

        // 8. The eye of the layers hides only in the designer: not a change, not in the prompt
        try {
            BD.discardSession();
            BD.toggleHidden(label);
            const hidden = W().getComputedStyle(label.elem).visibility === "hidden";
            const inPrompt = /visib/.test(BD.buildPrompt() || "");
            BD.toggleHidden(label);
            const back = W().getComputedStyle(label.elem).visibility !== "hidden";
            if (!hidden || inPrompt || !back || BD.changeCount() !== 0) R.fails.push("eye: hidden " + hidden + ", in prompt " + inPrompt + ", back " + back + ", changes " + BD.changeCount());
            else R.passed.push("eye");
        } catch (error) { R.fails.push("eye: ERROR " + error.message); }

        // 9. An added box, changed later (color, width): the prompt has "then", the session makes it again
        await check("added then changed", async function () {
            const item = BD.toolboxItems.find(function (i) { return i.type === "Box"; });
            BD.addObjectAt(item, { container: BD.state.win.page, before: null, point: { x: 700, y: 300 } });
            await sleep(100);
            const added = lastAdded();
            BD.select(added); await sleep(30);
            BD.onPropertyChange({ kind: "value", key: "color", value: "#FF8800" });
            await sleep(650);
            BD.onPropertyChange({ kind: "value", key: "width", value: 222 });
        }, function () { const o = lastAdded(); return o ? same([o.elem.offsetWidth, W().getComputedStyle(o.elem).backgroundColor].join(","), "222,rgb(255, 136, 0)") : "no added box"; },
        /then width: 222/, function () { return same(BD.state.addedObjects.length, 0); });

        // 10-12. Revert one object (the ↺ of Changes): only its change goes, the other stays
        const revertOne = async function (name, makeIt, isIt, isBack) {
            try {
                BD.discardSession();
                await makeIt();
                await sleep(650);
                BD.select(A.labelGiven); await sleep(30);
                BD.onPropertyChange({ kind: "value", key: "fontSize", value: 30 }); // the other change
                await sleep(650);
                const target = isIt();
                BD.revertObject(target);
                await sleep(300);
                const back = isBack();
                const otherStays = BD.readProps(A.labelGiven).fontSize === 30;
                if (back !== true || !otherStays) R.fails.push(name + ": back " + back + ", the other change stays " + otherStays);
                else R.passed.push(name);
                BD.revertAll();
                BD.discardSession();
                await sleep(100);
            } catch (error) { R.fails.push(name + ": ERROR " + error.message); }
        };
        const home = A.labelPlain.elem.parentElement;
        await revertOne("revert a moved object", async function () { BD.moveObject(A.labelPlain, { container: A.groupGiven, before: null }); },
            function () { return A.labelPlain; }, function () { return same(A.labelPlain.elem.parentElement === home, true); });
        await revertOne("revert a deleted object", async function () { BD.deleteObject(A.iconPlain); },
            function () { return A.iconPlain; }, function () { return same(A.iconPlain.elem.isConnected, true); });
        await revertOne("revert an added object", async function () {
            const item = BD.toolboxItems.find(function (i) { return i.type === "Label"; });
            BD.addObjectAt(item, { container: A.groupGiven, before: null });
        }, function () { return lastAdded(); }, function () { return same(BD.state.addedObjects.filter(function (o) { return o.elem.isConnected; }).length, 0); });

        // 13. A component: its box color and a param, both kept and both undone
        const checkNow = function () { return BD.objectOfKey(String(A.checkPlain.__bd.id)) || A.checkPlain; };
        await check("component box + param", async function () {
            BD.select(checkNow()); await sleep(30);
            BD.onPropertyChange({ kind: "value", key: "opacity", value: 0.5 });
            await sleep(650);
            BD.applyParam(checkNow(), ["labelText"], "Changed", "Check me");
        }, function () { const o = checkNow(); return same([o.labelText, W().getComputedStyle(o.elem).opacity].join(","), "Changed,0.5"); },
        /labelText/, function () { const o = checkNow(); return same([o.labelText, W().getComputedStyle(o.elem).opacity].join(","), "Check me,1"); });

        R.done = true;
        return R;
    };

    // THE PARAMETERS OF A COMPONENT: the kinds, the texts they read, the data of a table, then real changes through the
    // same functions as the editors: the value, the prompt, undo, redo and the saved session.
    window.runParamAudit = async function () {
        const R = window.PARAMS = { done: false, fails: [], passed: [] };
        const A = window.AUD;
        const same = function (a, b) { return (JSON.stringify(a) === JSON.stringify(b)) ? true : JSON.stringify(a) + " != " + JSON.stringify(b); };
        const expect = function (name, result) {
            if (result === true) R.passed.push(name);
            else R.fails.push(name + ": " + result);
        };

        // 1. Kinds
        const kindOf = function (key, value, note) { return BD.paramKindOf(key, value, value, note || "", "").name; };
        [
            ["textColor", "#FF0000", "", "color"], ["color", "", "", "color"], ["bar_color", null, "", "color"], ["background", "rgba(0, 0, 0, 0.1)", "", "color"],
            ["textColor", "Text color", "", "text"], ["background", "linear-gradient(to right, #111, #222)", "", "gradient"],
            ["iconFile", "", "", "picture"], ["arrowIcon", "data:image/svg+xml;utf8,x", "", "picture"], ["icon", "chevron", "", "text"],
            ["enabled", 1, "", "flag"], ["animated", 0, "", "flag"], ["hoverEffect", true, "", "flag"], ["vertical", 0, "1: Tabs are stacked.", "flag"], ["border", 1, "", "number"],
            ["fontSize", 14, "", "number"], ["opacity", 0.4, "", "number"], ["width", 240, "", "size"], ["width", "100%", "", "size"], ["width", "Width", "", "text"],
            ["padding", 8, "", "padding"], ["padding", [8, 4], "", "padding"], ["listPadding", [12, 5], "", "padding"], ["rightPadding", 60, "", "number"],
            ["variant", "underline", "\"underline\", \"pill\" (Only at create time)", "list"], ["closable", 1, "1: A close button. (A tab can set its own \"closable\".)", "flag"],
            ["searchable", "auto", "1, 0, \"auto\" (more than autoSearchCount options)", "list"], ["moreText", "+{count}", "A text. Ex: \"Apple\", \"Pear\"", "text"],
            ["shadow", "", "", "shadow"], ["boxShadow", "0 1px 3px red", "", "shadow"], ["borderBottom", "1px solid red", "", "border"], ["motion", "left 0.2s", "", "motion"],
            ["motion", 0.2, "", "number"], ["transition", "slide", "", "text"], ["ease", "ease", "", "easing"], ["filter", "none", "", "filter"], ["align", "left top", "", "align"],
            ["align", "Alignment", "", "text"], ["fontFamily", "opensans", "", "font"], ["date", null, "", "date"], ["time", null, "", "time"], ["time", 0.15, "", "number"],
            ["items", [], "", "table"], ["labels", null, "[\"Jan\", \"Feb\"]", "table"], ["onClick", function () { }, "", "function"], ["format", null, "function (value) { }", "function"],
            ["value", null, "null: the first tab", "any"], ["titleText", "Hello", "", "text"],
        ].forEach(function (line) {
            expect("kind of " + line[0] + " " + JSON.stringify(line[1]), same(kindOf(line[0], line[1], line[2]), line[3]));
        });

        // 2. A comment -> options and columns
        expect("options of a comment", same(BD.optionsOfNote("1, 0, \"auto\" (more than x)"), [1, 0, "auto"]));
        expect("no options in brackets", same(BD.optionsOfNote("1: A button. (A tab can set its own \"closable\".)"), [1]));
        expect("no options after Ex:", same(BD.optionsOfNote("A text. Ex: \"Apple\", \"Pear\""), []));
        expect("columns of a comment", same(BD.keysOfShape("title, width (px), align: \"left\" | \"center\"").map(function (c) { return [c.key, c.options]; }), [["title", []], ["width", []], ["align", ["left", "center"]]]));
        const lines = ["A COLUMN:", "{", "    key: \"age\", // its name", "    type: \"number\", // \"text\" or \"number\"", "}"];
        expect("a block of a header", same(BD.keysOfHeaderBlock(lines, "A COLUMN").map(function (c) { return c.key; }), ["key", "type"]));
        const defaults = ["const XDefaults = {", "    a: 1, // the a", "    style: { // the style", "        box: { color: \"red\", size: 2 }, // the box", "        line: \"x // y\", // the line", "    },", "    b: function (self) { }, // the b", "};", "const other = 1; // not it"];
        const notes = BD.readDefaultsNotes(defaults, "X");
        expect("the comments of the defaults", same([notes.a, notes.style, notes["style.box"], notes["style.line"], notes.b, notes.other], ["the a", "the style", "the box", "the line", "the b", undefined]));

        // 3. A typed text -> a value
        const read = function (kind, text, value) { return BD.valueOfParamText(text, { kind: { name: kind }, value: value }); };
        expect("a number", same(read("number", "12", 1), 12));
        expect("a number takes a size", same(read("number", "auto", 1), "auto"));
        expect("a size", same(read("size", "%100-20", 1), "calc(100% - 20px)"));
        expect("a size of px", same(read("size", "240", "100%"), 240));
        expect("a padding as x, y", same(read("padding", "14 10", 1), [14, 10]));
        expect("a padding as it is shown", same(read("padding", "[14,10]", 1), [14, 10]));
        expect("a padding of one", same(read("padding", "8", [1, 2]), 8));
        expect("a switch keeps its type", same([read("flag", "1", 0), read("flag", "off", true), read("flag", "null", 0)], [1, false, null]));
        expect("a list", same(read("table", "[1,2]", []), [1, 2]));
        const refuses = function (kind, text) {
            try {
                read(kind, text, "");
                return "it was taken";
            } catch (error) {
                return true;
            }
        };
        expect("a wrong color is refused", refuses("color", "notacolor"));
        expect("a wrong list is refused", refuses("table", "[1,"));
        expect("three sides are refused", refuses("padding", "1 2 3"));

        // 4. The texts of CSS come back the same
        const shadow = "inset 0px -3px 0px rgba(0, 0, 0, 0.1), 0px 4px 12px 2px #111";
        expect("a shadow", same(BD.writeShadow(BD.readShadow(shadow)), shadow));
        expect("an empty shadow", same(BD.readShadow("none"), []));
        expect("a line", same(BD.writeLine(BD.readLine("2px dashed rgba(0, 0, 0, 0.1)")), "2px dashed rgba(0, 0, 0, 0.1)"));
        expect("no line", same(BD.writeLine(BD.readLine("none")), "none"));
        expect("a motion", same(BD.writeMotion(BD.readMotion("left 0.3s ease, opacity 0.2s")), "left 0.3s ease, opacity 0.2s"));
        expect("a motion of milliseconds", same(BD.readMotion("200ms")[0].seconds, 0.2));
        const gradient = "linear-gradient(to right, #111, rgba(0, 0, 0, 0.5) 40%)";
        expect("a gradient", same(BD.writeGradient(BD.readGradient(gradient)), gradient));
        expect("another gradient is a text", same(BD.readGradient("radial-gradient(#111, #222)"), null));
        expect("four sides", same(BD.writePaddingSides(BD.readPaddingSides([1, 2, 3, 4])), [1, 2, 3, 4]));
        expect("two sides", same(BD.writePaddingSides(BD.readPaddingSides([1, 2])), [1, 2]));
        expect("one side", same(BD.writePaddingSides(BD.readPaddingSides(5)), 5));

        // 5. Every shape of a list comes back from a table (JsonEditor), and a function stays
        const backFromTable = function (value) { return JsonEditor.valueOfLevel(JsonEditor.levelOf(value, [])); };
        [[], ["A", "B"], [1, 2], [[1, "a"], [2, "b"]], [{ a: 1 }, { a: 2, b: "x" }], ["A", { text: "B", on: 0 }, "-"], [{ a: null }], [{ a: [1, 2], b: { c: 1 } }]].forEach(function (list) {
            expect("a table of " + JSON.stringify(list), same(backFromTable(list), list));
        });
        expect("an object from a table", same(backFromTable({ a: 1, b: "x", c: null }), { a: 1, b: "x", c: null }));
        const onClick = function () { };
        expect("a function of a row in a table", same(backFromTable([{ text: "A", onClick: onClick }])[0].onClick === onClick, true));
        const kept = BD.keepFunctions([{ key: "b" }, { key: "a" }], [{ key: "a", onClick: onClick }, { key: "b" }]);
        expect("a function follows its row", same(kept[1].onClick === onClick && !kept[0].onClick, true));
        expect("a pasted block", same(JsonEditor.readPastedText("1\t2\n3\t4").grid, [["1", "2"], ["3", "4"]]));
        expect("a pasted list", same(JsonEditor.readPastedText("[{\"a\":1}]").list, [{ a: 1 }]));
        expect("one pasted text", same(JsonEditor.readPastedText("a word"), null));
        expect("the sort of a table", same(["b", "", 10, "a", 3].sort(JsonEditor.compareValues), [3, 10, "a", "b", ""]));

        // 6. A change keeps the rows of the panel, and goes through the prompt, undo, redo and the session
        const now = function () { return BD.objectOfKey(String(A.checkPlain.__bd.id)) || A.checkPlain; };
        const check = function (name, run, isDone, promptPattern, isBack) { return checkStep(R, name, run, isDone, promptPattern, isBack); };
        const stylePath = function (kindName) {
            BD.select(now()); // (the rows of the component)
            const rows = BD.paramRowsOf(now());
            const row = rows.find(function (item) { return item.kind && item.kind.name === kindName; });
            return (row) ? row.path : null;
        };
        const valueAt = function (path) { return BD.getAt(now().__bd.params, path); };

        BD.state.inspect = "params";
        const colorPath = stylePath("color");
        await sleep(100);
        const inputBefore = BD.ui.paramRowViews[colorPath.join(".")].input;
        const firstColor = valueAt(colorPath);
        await check("a color of a parameter", async function () {
            BD.select(now()); await sleep(30);
            BD.sendParamLive(now().__bd.id, colorPath, "#123456");
            BD.flushParamLive();
        }, function () { return same(valueAt(colorPath), "#123456"); }, new RegExp("- param " + colorPath.join("\\.") + ": "), function () { return same(valueAt(colorPath), firstColor); });
        expect("the rows stay after a change", same(BD.ui.paramRowViews[colorPath.join(".")].input === inputBefore || inputBefore.isConnected === false, true));

        // WHY this one: its type changes (a number -> a list): a text would be refused at the undo and the replay.
        const paddingPath = stylePath("padding");
        if (paddingPath) {
            const firstPadding = valueAt(paddingPath);
            await check("a padding of a parameter", async function () {
                BD.select(now()); await sleep(30);
                BD.applyParamValue(now(), paddingPath, [3, 4, 5, 6]);
            }, function () { return same(valueAt(paddingPath), [3, 4, 5, 6]); }, /\[3,4,5,6\]/, function () { return same(valueAt(paddingPath), firstPadding); });
        }

        // The search of the rows, only the changed ones, the dot that goes back to the default
        const isLeaf = function (row) { return !row.isGroup; };
        BD.state.paramFilter = "color";
        const colorRows = BD.paramRowsOf(now()).filter(isLeaf);
        expect("the search of the rows", same(colorRows.length > 0 && colorRows.every(function (row) { return /color/i.test(row.pathText); }), true));
        BD.state.paramFilter = "nothing has this name";
        expect("a search with no row", same(BD.paramRowsOf(now()).length, 0));
        BD.state.paramFilter = "";
        BD.state.paramOnlyChanged = true;
        const changedRows = BD.paramRowsOf(now()).filter(isLeaf);
        expect("only the changed rows", same(changedRows.every(function (row) { return row.isGiven; }), true));
        BD.state.paramOnlyChanged = false;
        const resetRow = BD.paramRowsOf(now()).find(function (row) { return row.pathText === colorPath.join("."); });
        const defaultColor = resetRow.def;
        BD.applyParamValue(now(), colorPath, "#654321");
        await sleep(100);
        BD.resetParamToDefault({ row: BD.paramRowsOf(now()).find(function (row) { return row.pathText === colorPath.join("."); }) });
        await sleep(100);
        expect("the dot gives the default", same(valueAt(colorPath), defaultColor));
        const removed = { a: 1, b: 2 };
        BD.setAt(removed, ["a"], undefined);
        expect("a key with no default goes", same(removed, { b: 2 }));
        BD.undo();
        await sleep(200);
        BD.undo();
        await sleep(200);

        const flagPath = stylePath("flag");
        if (flagPath) {
            const firstFlag = valueAt(flagPath);
            const nextFlag = (firstFlag === 1 || firstFlag === true) ? 0 : 1;
            await check("a switch of a parameter", async function () {
                BD.select(now()); await sleep(30);
                BD.applyParamValue(now(), flagPath, nextFlag);
            }, function () { return same(valueAt(flagPath), nextFlag); }, new RegExp("- param " + flagPath.join("\\.")), function () { return same(valueAt(flagPath), firstFlag); });
        }

        R.done = true;
        return R;
    };

    // THE LISTS (basic.js v26.11.07): padding, border, round and gap typed as a list, as the panel does it: the text of
    // parseListText, an array on the object, the screen, the panel text and its width, a prompt line of arrays, Revert
    // all + the saved session, undo, redo. Then a Cmd+D copy, the texts that are refused, an older basic.js of the page.
    window.runListAudit = async function () {
        const R = window.LISTS = { done: false, fails: [], passed: [] };
        const A = window.AUD;
        const promptLineOf = function (key) {
            return (BD.buildPrompt() || "").split("\n").find(function (l) { return l.indexOf("- " + key + ": ") !== -1; }) || "";
        };
        const fieldItemOf = function (o, key) {
            const items = flat(BD.propertySections(BD.readProps(o)).flatMap(function (sec) { return sec.items; }));
            return items.find(function (i) { return i.key === key; }) || {};
        };
        // [object, key, the typed text]: from a number to a list, and from a list (boxLists, groupLists) to another value
        const CASES = [
            ["boxGiven", "round", "12, 0"],
            ["boxGiven", "round", "1, 2, 3, 4"],
            ["boxGiven", "border", "0, 0, 0, 3"],
            ["boxGiven", "border", "0, 2"],
            ["buttonGiven", "round", "18, 4"],
            ["buttonGiven", "border", "0, 0, 2, 0"],
            ["inputGiven", "border", "0, 0, 0, 1"],
            ["groupGiven", "gap", "12, 8"],
            ["groupGiven", "padding", "4, 8, 12, 16"],
            ["boxLists", "round", "14, 14, 0, 4"],
            ["boxLists", "border", "2"],
            ["groupLists", "gap", "6"],
            ["groupLists", "round", "0, 12"],
        ];
        for (const [objectName, key, typed] of CASES) {
            const o = A[objectName];
            const name = objectName + "." + key + " " + JSON.stringify(typed);
            const failsBefore = R.fails.length;
            const fail = function (text) { R.fails.push(name + ": " + text); };
            try {
                BD.discardSession();
                BD.select(o);
                await sleep(30);
                const orig = BD.readProps(o)[key];
                const lookBefore = screenLook(o);
                const value = BD.parseListText(typed, key);
                const expected = isListText(typed) ? typed : Number(typed);
                if (value !== expected) fail("parseListText: " + JSON.stringify(value));
                BD.onPropertyChange({ kind: "value", key: key, value: value, oldValue: orig });
                await sleep(650); // WHY: More than HISTORY_MERGE_TIME: every change is an undo step of its own.
                const ok1 = valueOk(o, key, value);
                if (ok1 !== true) fail("apply: " + ok1);
                if (isListText(typed) && !Array.isArray(o[key])) fail("not an array on the object: " + JSON.stringify(o[key]));
                const panelValue = BD.readProps(o)[key];
                if (String(panelValue) !== String(value)) fail("the panel reads " + JSON.stringify(panelValue));
                const isWide = (fieldItemOf(o, key).span === 2);
                if (isWide !== BD.isFourValues(panelValue)) fail("the field is " + (isWide ? "two columns wide" : "one column wide"));
                const line = promptLineOf(key);
                if (!line || line.indexOf('"') !== -1) fail("prompt line: " + JSON.stringify(line));
                const session = BD.buildSession();
                BD.revertAll();
                if (screenLook(o) !== lookBefore) fail("revert all, on the screen: " + screenLook(o) + " (was " + lookBefore + ")");
                const back0 = BD.readProps(o)[key];
                if (String(back0) !== String(orig)) fail("revert all: " + JSON.stringify(back0) + " (was " + JSON.stringify(orig) + ")");
                BD.applySession(session);
                BD.refreshChanges();
                const ok2 = valueOk(o, key, value);
                if (ok2 !== true) fail("session apply: " + ok2);
                BD.undo();
                await sleep(120);
                if (screenLook(o) !== lookBefore) fail("undo, on the screen: " + screenLook(o) + " (was " + lookBefore + ")");
                BD.redo();
                await sleep(120);
                const ok3 = valueOk(o, key, value);
                if (ok3 !== true) fail("redo: " + ok3);
                BD.undo();
                await sleep(120);
            } catch (error) {
                fail("ERROR " + error.message);
            }
            if (R.fails.length === failsBefore) R.passed.push(name);
        }

        // A Cmd+D copy keeps the lists (the panel reads them as texts, a text the setters do not take), in the code too
        const LIST_CODE = ["gap: [12,8]", "padding: [14,10]", "round: [12,12,4,12]", "border: [0,2]"];
        await checkStep(R, "copy of a group with lists", async function () {
            BD.select(A.groupLists);
            await sleep(30);
            BD.duplicateObject(A.groupLists);
            await sleep(100);
        }, function () {
            const copy = BD.state.addedObjects[0];
            if (!copy) return "no copy";
            const look = diffLook(A.groupLists, copy);
            if (look !== true) return look;
            const code = (BD.buildPrompt() || "").split("\n").find(function (l) { return l.indexOf("code: HGroup(") !== -1; }) || "";
            const hasArrays = LIST_CODE.every(function (part) { return code.indexOf(part) !== -1; });
            return (hasArrays) ? true : "code: " + code;
        }, /NEW: added/, function () { return (BD.state.addedObjects.length === 0) ? true : "copies left: " + BD.state.addedObjects.length; });

        // A Cmd+D copy of a Box keeps its lists and its padding (only the padding of a group was copied)
        const isNoCopyLeft = function () { return (BD.state.addedObjects.length === 0) ? true : "copies left: " + BD.state.addedObjects.length; };
        await checkStep(R, "copy of a box with lists and a padding", async function () {
            BD.select(A.boxLists);
            await sleep(30);
            BD.duplicateObject(A.boxLists);
            await sleep(100);
        }, function () {
            const copy = BD.state.addedObjects[0];
            return (copy) ? diffLook(A.boxLists, copy) : "no copy";
        }, /NEW: added/, isNoCopyLeft);

        // ... and of a Label with a padding (given in the panel first). WHY no undo after it: checkStep ends at the state
        // its Revert all made (a step of the history too): the label is clean again; one more undo brought both back.
        await checkStep(R, "copy of a label with a padding", async function () {
            BD.select(A.labelGiven);
            await sleep(30);
            BD.onPropertyChange({ kind: "value", key: "padding", value: "14, 10" });
            await sleep(650); // WHY: More than HISTORY_MERGE_TIME: the copy is an undo step of its own.
            BD.duplicateObject(A.labelGiven);
            await sleep(100);
        }, function () {
            const copy = BD.state.addedObjects[0];
            return (copy) ? diffLook(A.labelGiven, copy) : "no copy";
        }, /NEW: added/, isNoCopyLeft);
        const labelPadding = W().getComputedStyle(A.labelGiven.elem).paddingLeft;
        if (labelPadding !== "0px") R.fails.push("copy of a label with a padding: its padding stayed after the check (" + labelPadding + ")");

        // The list fields read "12,0" as a list, not as the decimal 12.0 (commaIsList of PropertyPanel)
        const LIST_FIELDS = [["boxGiven", "round"], ["boxGiven", "border"], ["boxGiven", "padding"], ["groupGiven", "gap"], ["groupGiven", "padding"]];
        const withoutCommaList = LIST_FIELDS.filter(function (f) { return fieldItemOf(A[f[0]], f[1]).commaIsList !== 1; });
        if (withoutCommaList.length) R.fails.push("commaIsList: " + JSON.stringify(withoutCommaList));
        else R.passed.push("commaIsList");

        // The texts a list field refuses (the old value comes back) and the ones it reads
        const REFUSED = [["padding", "1, 2, 3"], ["round", "1, 2, 3, 4, 5"], ["gap", "1, 2, 3, 4"], ["border", "-1, 2"], ["round", "a, b"]];
        const notRefused = REFUSED.filter(function (r) { return BD.parseListText(r[1], r[0]) !== undefined; });
        if (notRefused.length) R.fails.push("refused texts: " + JSON.stringify(notRefused));
        else R.passed.push("refused texts");
        const ACCEPTED = [["round", "12 0", "12, 0"], ["border", "0px 1px", "0, 1"], ["gap", "8", 8], ["padding", "14;10", "14, 10"]];
        const misread = ACCEPTED.filter(function (a) { return BD.parseListText(a[1], a[0]) !== a[2]; });
        if (misread.length) R.fails.push("accepted texts: " + JSON.stringify(misread));
        else R.passed.push("accepted texts");

        // An older basic.js of the page reads no list of border, round and gap (it reads one value, and a padding list)
        const pageBasic = W().basic;
        const realVersion = pageBasic.version;
        try {
            pageBasic.version = "26.10.28";
            const listsRefused = ["round", "border", "gap"].every(function (key) { return BD.parseListText("12, 8", key) === undefined; });
            const othersRead = (BD.parseListText("8", "round") === 8) && (BD.parseListText("14, 10", "padding") === "14, 10");
            if (listsRefused && othersRead) R.passed.push("an older basic.js");
            else R.fails.push("an older basic.js: lists refused " + listsRefused + ", one value and a padding read " + othersRead);
        } finally {
            pageBasic.version = realVersion;
        }

        R.done = true;
        return R;
    };

    // THE WINDOWS OF THE BOX VIEW (the editors of the Parameters for a property, 2026-11-07): the button at the end of a
    // field opens the window of its key, a change in the window goes to the object, the field, the prompt, Revert all + the
    // session, undo and redo. The same button closes it, so do another object and a value written in the field; Alt+Down
    // opens it. The kinds corners and gap of a parameter. Results in window.EDITORS.
    window.runEditorAudit = async function () {
        const R = window.EDITORS = { done: false, fails: [], passed: [] };
        const A = window.AUD;
        // The input of a key in the panel: named by the label of its item (a list field: by its hint, "Padding: ...").
        const INPUT_NAMES = {
            padding: "^='Padding:'", border: "^='Border:'", round: "^='Round:'", gap: "^='Gap:'", boxShadow: "='Shadow'",
            opacity: "='Opacity'", fontSize: "='Font size'", lineHeight: "='Line height'", rotate: "='Rotate'", text: "='Text'",
        };
        const inputOf = function (key) { return BD.ui.panel.elem.querySelector("input[aria-label" + INPUT_NAMES[key] + "]"); };
        // The button at the end of the field (the field: the group of the input of basic.js)
        const fieldButtonOf = function (key) {
            const input = inputOf(key);
            const field = input && input.parentElement && input.parentElement.parentElement;
            return (field) ? field.querySelector("[role=button]") : null;
        };
        const openWindow = async function (o, key) {
            BD.select(o);
            await sleep(50);
            const button = fieldButtonOf(key);
            if (!button) throw new Error("no button at the end of its field");
            button.click();
            await sleep(50);
            const popover = BD.paramPopover;
            if (!popover || popover.pathText !== "box:" + key) throw new Error("its window did not open");
            return popover;
        };
        const typeIn = function (box, name, text) {
            const input = box.querySelector("input[aria-label='" + name + "']");
            input.value = text;
            input.dispatchEvent(new Event("input"));
        };
        const press = function (box, text) {
            const el = Array.from(box.querySelectorAll("div")).find(function (d) { return d.children.length === 0 && d.textContent === text; });
            el.click();
        };
        const toggleLinked = function (box) { box.querySelector("[role=switch]").click(); };

        // [object, key, what is done in the window (its element), the value after it (as the panel shows it)]
        const CASES = [
            ["boxGiven", "padding", function (box) {
                toggleLinked(box);
                typeIn(box, "left", "4");
                typeIn(box, "top", "8");
                typeIn(box, "right", "12");
                typeIn(box, "bottom", "16");
            }, "4, 8, 12, 16"],
            ["boxGiven", "border", function (box) { press(box, "3"); }, 3],
            ["boxLists", "round", function (box) { typeIn(box, "Top left", "20"); }, "20, 14, 0, 0"],
            ["groupLists", "gap", function (box) { typeIn(box, "x: between the items of a line", "6"); }, "6, 8"],
            ["boxGiven", "boxShadow", function (box) { press(box, "Medium"); }, "0px 4px 12px rgba(0, 0, 0, 0.18)"],
            ["boxGiven", "opacity", function (box) { press(box, "0.5"); }, 0.5],
            ["labelGiven", "fontSize", function (box) { press(box, "16"); }, 16],
            ["labelGiven", "lineHeight", function (box) { press(box, "24"); }, 24],
            ["boxGiven", "rotate", function (box) { press(box, "45"); }, 45],
            ["labelGiven", "text", function (box) {
                const area = box.querySelector("textarea");
                area.value = "A longer text";
                area.dispatchEvent(new Event("input"));
            }, "A longer text"],
        ];
        for (const [objectName, key, act, expected] of CASES) {
            const o = A[objectName];
            const name = "window: " + objectName + "." + key;
            BD.select(o);
            await sleep(30);
            const orig = String(BD.readProps(o)[key]);
            await checkStep(R, name, async function () {
                const popover = await openWindow(o, key);
                const panelRect = BD.ui.panel.elem.getBoundingClientRect();
                if (popover.box.elem.getBoundingClientRect().right > panelRect.left) R.fails.push(name + ": the window is over the panel");
                act(popover.box.elem);
                await sleep(50);
                const shown = BD.ui.panel.getValue(key);
                if (String(shown) !== String(expected)) R.fails.push(name + ": the field shows " + JSON.stringify(shown));
                BD.closeParamEditors();
            }, function () {
                return valueOk(o, key, expected);
            }, new RegExp("- " + key + ": "), function () {
                const now = String(BD.readProps(o)[key]);
                return (now === orig) ? true : "read " + JSON.stringify(now) + " (was " + orig + ")";
            });
        }

        const isClosed = function () { return !BD.paramPopover; };
        const closing = [];
        // The same button closes its window
        await openWindow(A.boxGiven, "opacity");
        fieldButtonOf("opacity").click();
        await sleep(50);
        if (!isClosed()) closing.push("its button again");
        // Another object closes it
        await openWindow(A.boxGiven, "opacity");
        BD.select(A.boxPlain);
        await sleep(50);
        if (!isClosed()) closing.push("another object");
        // A value written in the field closes it (the panel sends it as a change)
        await openWindow(A.boxGiven, "opacity");
        BD.onPropertyChange({ kind: "value", key: "opacity", value: 0.8, oldValue: 0.9 });
        await sleep(50);
        if (!isClosed()) closing.push("a value written in the field");
        BD.revertAll();
        // Alt+Down in the field opens it
        BD.select(A.boxGiven);
        await sleep(50);
        const input = inputOf("rotate");
        input.focus();
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", altKey: true, bubbles: true, cancelable: true }));
        await sleep(50);
        if (!BD.paramPopover || BD.paramPopover.pathText !== "box:rotate") closing.push("Alt+Down did not open it");
        BD.closeParamEditors();
        if (closing.length) R.fails.push("open / close: " + closing.join(", "));
        else R.passed.push("open / close");

        // An older basic.js of the page: a list from a window is refused (the object keeps its value)
        const pageBasic = W().basic;
        const realVersion = pageBasic.version;
        try {
            pageBasic.version = "26.10.28";
            const popover = await openWindow(A.boxGiven, "round");
            toggleLinked(popover.box.elem);
            typeIn(popover.box.elem, "Top left", "20");
            await sleep(50);
            const round = A.boxGiven.round;
            if (round === 8) R.passed.push("an older basic.js");
            else R.fails.push("an older basic.js: the round is " + JSON.stringify(round));
        } finally {
            pageBasic.version = realVersion;
            BD.closeParamEditors();
            BD.revertAll();
        }

        // The kinds of a parameter: a list of round / gap opens the corners / the gap (a number stays a number)
        const KINDS = [["round", [12, 0], "corners"], ["buttonRound", [12, 12, 0, 4], "corners"], ["gap", [12, 8], "gap"], ["round", 8, "number"], ["padding", [8, 4], "padding"], ["gap", [1, 2, 3], "table"]];
        const wrongKinds = KINDS.filter(function (k) { return BD.paramKindOf(k[0], k[1], undefined, "", "").name !== k[2]; });
        if (wrongKinds.length) R.fails.push("kinds: " + JSON.stringify(wrongKinds.map(function (k) { return k[0] + " " + JSON.stringify(k[1]) + " -> " + BD.paramKindOf(k[0], k[1], undefined, "", "").name; })));
        else R.passed.push("kinds");
        const READ = [["corners", "12, 0", [12, 0]], ["corners", "[12,12,0,4]", [12, 12, 0, 4]], ["gap", "12 8", [12, 8]], ["gap", "8", 8]];
        const misread = READ.filter(function (r) { return JSON.stringify(BD.PARAM_TEXT_READERS[r[0]](r[1], {})) !== JSON.stringify(r[2]); });
        let isRefused = false;
        try { BD.PARAM_TEXT_READERS.corners("1, 2, 3", {}); } catch (error) { isRefused = true; }
        if (misread.length || !isRefused) R.fails.push("texts of the kinds: " + JSON.stringify(misread) + (isRefused ? "" : ", 1, 2, 3 read as a round"));
        else R.passed.push("texts of the kinds");
        const shortest = [
            JSON.stringify(BD.writeCorners(BD.readCorners([12, 0]))), JSON.stringify(BD.writeCorners(BD.readCorners(8))),
            JSON.stringify(BD.writeCorners({ topLeft: 1, topRight: 2, bottomRight: 3, bottomLeft: 4 })), JSON.stringify(BD.writeGap(BD.readGap("8px"))),
        ].join(" ");
        if (shortest === "[12,0] 8 [1,2,3,4] 8") R.passed.push("the shortest values");
        else R.fails.push("the shortest values: " + shortest);

        R.done = true;
        return R;
    };

})();
