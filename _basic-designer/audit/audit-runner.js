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

    // key -> function (obj, value) -> [real, expected] or null (not checked)
    window.TRUTH = {
        width: function (o, v) { return (typeof v === "number") ? [o.elem.offsetWidth, v] : null; },
        height: function (o, v) { return (typeof v === "number") ? [o.elem.offsetHeight, v] : null; },
        color: function (o, v) { return [W().getComputedStyle(fieldOf(o)).backgroundColor, normColor(v || "transparent")]; },
        opacity: function (o, v) { return [Number(W().getComputedStyle(o.elem).opacity), Number(v)]; },
        round: function (o, v) { return [px(W().getComputedStyle(fieldOf(o)).borderTopLeftRadius), Number(v)]; },
        border: function (o, v) { return [px(W().getComputedStyle(fieldOf(o)).borderTopWidth), Number(v)]; },
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
        gap: function (o, v) { return [px(W().getComputedStyle(o.elem).rowGap), Number(v)]; },
        padding: function (o, v) { return (typeof v === "number") ? [px(W().getComputedStyle(o.elem).paddingTop), v] : null; },
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

    // What the screen shows of the keys the panel reads differently (lineHeight, padding): undo must bring it back.
    // WHY: readProps() was the same before and after, so a Label left 0 px high passed.
    const screenLook = function (o) {
        const box = W().getComputedStyle(o.elem);
        return [textOf(o).lineHeight, box.paddingTop, box.paddingLeft, o.elem.offsetHeight].join(" / ");
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
                if (String(value) === String(orig)) continue;
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
                    if (key === "lineHeight" || key === "padding") {
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
            c.borderTopWidth, c.borderTopColor, c.borderTopLeftRadius, box.opacity, t.fontSize, t.color, t.textAlign, t.fontWeight,
            t.fontStyle, t.fontFamily, t.lineHeight, box.paddingTop, box.paddingLeft, box.rowGap, box.justifyContent, box.alignItems,
            (o.inputElement) ? o.inputElement.placeholder : "", (o._textElem || field).textContent].join(" | ");
    };
    const diffLook = function (a, b) {
        const x = lookOf(a).split(" | ");
        const y = lookOf(b).split(" | ");
        const names = ["width", "height", "color", "shade", "border", "borderColor", "round", "opacity", "fontSize", "textColor", "textAlign", "fontWeight", "fontStyle", "fontFamily", "lineHeight", "paddingTop", "paddingLeft", "gap", "justify", "alignItems", "placeholder", "text"];
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

})();
