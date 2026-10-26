/* Bismillah */

/*

TreeView - v26.10

UI COMPONENT TEMPLATE
- A tree of nested items: a file explorer, a category tree, the menu of an admin panel, the layers of a design tool.
- One row is one Label (an arrow, an optional icon, the text, a tag and a soft note in it), so a tree of
  thousands of rows stays light.
- Only the changed branch is drawn again: the children of a closed item are created the first time it opens,
  closing only hides them. updateNode() paints one row, setChildren() draws one branch.
- Lazy children: hasChildren: 1 and no children -> onLoadChildren(self, node) is called when it opens,
  then the code gives them with self.setChildren(node.key, [...]).
- Keyboard (the tree takes the focus): ArrowUp / ArrowDown move the selection, ArrowRight opens (or goes to the
  first child), ArrowLeft closes (or goes to the parent), Home, End, PageUp, PageDown, Enter -> onActivate,
  Space opens / closes, typing a letter jumps to the next row that starts with it (typeAhead).
- Mouse: click selects, a click on the arrow opens / closes, a double click -> onActivate (and opens / closes).
- Accessibility: tree / treeitem / group roles, aria-level, aria-expanded, aria-selected, aria-activedescendant.
- onSelect is NOT called when the component is created or when the value is set with silent: 1.
- Style packages: "classic" (default), "modern", "dark". Select with styleName. (TreeView.styles)
- Everything is drawn with code (no image files needed).

NODE: { key, text, iconFile, tag, tagColor, note, textColor, children, expanded, hasChildren, disabled, data }
- text: Plain text (never read as HTML).
- tag: A short second text after the text, in the accent color (Ex: the type of a layer). tagColor: its own color.
- note: A soft text at the end (Ex: a size, a count, a preview).
- iconFile: An image (a file or a data:image/svg+xml URI).
- children: [NODE]. expanded: 1 -> open. hasChildren: 1 -> an arrow without children (lazy, see onLoadChildren).
- data: Anything of yours. It is kept by reference.
- A string is also accepted: "Docs" -> { key: "Docs", text: "Docs" }. A node without a key gets one.

USAGE:
const tree = TreeView({
    width: 260,
    height: 400,
    items: [
        { key: "src", text: "src", expanded: 1, children: [
            { key: "src/app.js", text: "app.js", note: "4 KB" },
            { key: "src/lib", text: "lib", children: ["a.js", "b.js"] },
        ] },
        { key: "readme", text: "readme.md" },
    ],
    value: "src/app.js",
    onSelect: function (self, node) { println(node.key); },
    onActivate: function (self, node) { println("open " + node.key); },
});
tree.setValue("readme");                         // onSelect is called
tree.updateNode("readme", { note: "changed" });  // paints one row
tree.setChildren("src/lib", ["c.js"]);           // draws one branch
tree.addNode("src", { key: "src/new.js", text: "new.js" });
tree.removeNode("readme");
tree.reveal("src/lib");                          // opens the parents and scrolls to it

Started Date: October 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const TreeViewDefaults = {
    key: "0",
    width: 260,
    height: 320, // "auto": no scrolling, the tree grows with its rows.
    items: [], // [NODE] (See NODE above)
    value: null, // Key of the selected node. null: nothing is selected.
    emptyText: "No items",
    typeAhead: 1, // 1: Typing a letter jumps to the next row that starts with it.
    useScrollBar: 1, // basic/scroll-bar.js (when it is loaded). 0: the scrollbar of the browser.
    enabled: 1,
    ariaLabel: "Tree",
    onSelect: function (self, node) { }, // self.value, self.previousValue
    onActivate: function (self, node) { }, // Double click or Enter
    onToggle: function (self, node) { }, // node.expanded: 1 or 0
    onHover: function (self, node) { }, // node: null when the mouse leaves the rows
    onLoadChildren: function (self, node) { }, // hasChildren: 1 and no children. Call self.setChildren(node.key, [...]).
    styleName: "classic", // "classic", "modern", "dark" or a name added to TreeView.styles
    style: { // Classic style package (default)
        box: {
            color: "transparent",
            border: 0,
            borderColor: "transparent",
            round: 0,
            padding: [4, 4], // [x, y] around the rows
        },
        row: {
            height: 28,
            fontSize: 13,
            textColor: Black(0.8),
            indent: 16, // Per level
            paddingLeft: 4,
            paddingRight: 8,
            gap: 6, // Between the arrow, the icon, the text, the tag and the note
            round: 5,
        },
        rowHover: {
            color: Black(0.05),
        },
        rowSelected: {
            color: Black(0.09),
            textColor: "#141414",
        },
        rowFocus: { // Ring of the selected row while the tree has the focus (keyboard)
            outlineColor: Black(0.25),
        },
        arrow: {
            color: Black(0.45),
            size: 12,
            motion: 0.15, // Seconds. 0: No animation
        },
        icon: {
            size: 16,
        },
        tag: {
            textColor: "#3A6EA5",
            fontSize: 12,
        },
        note: {
            textColor: Black(0.4),
            fontSize: 12,
        },
        disabled: {
            opacity: 0.4,
        },
        empty: {
            textColor: Black(0.4),
            fontSize: 13,
        },
        scrollBar: { bar_color: "#9A9A98", bar_mouseOverColor: "#6A6A68", bar_width: 4, bar_round: 3, bar_opacity: 0.4, bar_mouseOverOpacity: 0.9, bar_padding: 2 },
    }
};

const TreeView = function (params = {}) {

    // Merge style package: params.style > TreeView.styles[styleName] > TreeViewDefaults.style (classic)
    basic.applyStylePackage(params, TreeView.styles, TreeViewDefaults);

    // Merge params:
    mergeIntoIfMissing(params, TreeViewDefaults);

    // Edit params, if needed:
    params.color = params.style.box.color;
    const startItems = params.items;
    const startValue = params.value;
    params.items = [];
    params.value = null;
    const isAutoHeight = (String(params.height) === "auto"); // WHY: Read before startObject: box.height gives the measured height (0), never "auto".

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    const id = "tree-view-" + (TreeView._counter++);
    let roots = []; // [rec]
    let recs = new Map(); // key -> rec { node, parent, level, row, group, built } (only the rows that were created)
    let nodeIndex = new Map(); // key -> { node, parent } (every node, also inside closed branches)
    let hoverRec = null;
    let hasFocus = 0;
    let typeBuffer = "";
    let cancelTypeTimer = null; // (box.after: the timer is stopped by remove())
    let keyCounter = 1;
    const TYPE_AHEAD_RESET_MS = 600; // The typed letters are forgotten after this pause.
    const SCROLL_SPACE = 4; // Space above / below a row that is scrolled into view.
    const AUTO_HEIGHT_PAGE_SIZE = 10; // PageUp / PageDown step when the tree does not scroll.
    const ARROW_BOX_EXTRA = 4; // The box of the arrow is this much wider than the arrow.
    const TEXT_SPACE_WITHOUT_ICON = 2; // Space between the arrow and the text when there is no icon.
    const EMPTY_TEXT_TOP = 16;

    // *** PUBLIC VARIABLES:
    box.previousValue = null;
    // NOTE: Default values are also public variables. (box.value, box.enabled)

    // *** PRIVATE FUNCTIONS:

    const escapeText = function (text) {
        return basic.escapeHtml(String((text === undefined || text === null) ? "" : text));
    };

    const isFilled = function (value) {
        return value !== undefined && value !== null && value !== "";
    };

    // A <span> with inline styles. styles: ["flex:0 0 auto", "color:red"]
    const span = function (styles, content, attributes = "") {
        return "<span" + attributes + ' style="' + styles.join(";") + '">' + content + "</span>";
    };

    // NODE -> a copy of the node with a key (children are copied too). data is kept by reference.
    const normalize = function (node) {
        if (typeof node === "string" || typeof node === "number") {
            node = { key: String(node), text: String(node) };
        }
        const out = Object.assign({}, node);
        if (!isFilled(out.key)) out.key = "node-" + (keyCounter++);
        out.key = String(out.key);
        if (out.text === undefined) out.text = out.key;
        out.expanded = (out.expanded == 1) ? 1 : 0;
        out.children = Array.isArray(node.children) ? node.children.map(normalize) : null;
        return out;
    };

    // Has an arrow: children, or lazy children that are not loaded yet.
    const canExpand = function (rec) {
        const node = rec.node;
        if (node.children && node.children.length > 0) return true;
        return node.hasChildren == 1 && !node.children;
    };

    const isOpen = function (rec) {
        return rec.node.expanded == 1 && canExpand(rec);
    };

    const getRowId = function (rec) {
        return id + "-" + TreeView.toId(rec.node.key);
    };

    const getArrowHtml = function (rec) {
        const arrow = _s.arrow;
        const styles = [
            "display:inline-flex",
            "align-items:center",
            "justify-content:center",
            "flex:0 0 " + (arrow.size + ARROW_BOX_EXTRA) + "px",
            "height:100%",
            "transform:rotate(" + (isOpen(rec) ? 90 : 0) + "deg)",
        ];
        if (arrow.motion) styles.push("transition:transform " + arrow.motion + "s");
        const svg = (canExpand(rec)) ? TreeView.getChevronSvg(arrow.color, arrow.size) : "";
        return span(styles, svg, ' data-tv-arrow="1"');
    };

    const getIconHtml = function (node) {
        const size = _s.icon.size + "px";
        const styles = [
            "flex:0 0 " + size,
            "width:" + size,
            "height:" + size,
            "margin-left:" + (_s.row.gap - 4) + "px",
            "object-fit:contain",
        ];
        return '<img src="' + escapeText(node.iconFile) + '" alt="" style="' + styles.join(";") + '">';
    };

    const getTextHtml = function (node) {
        const styles = [
            "margin-left:" + ((node.iconFile) ? _s.row.gap : TEXT_SPACE_WITHOUT_ICON) + "px",
            "flex:0 1 auto",
            "min-width:0",
            "overflow:hidden",
            "text-overflow:ellipsis",
        ];
        if (node.textColor) styles.push("color:" + escapeText(node.textColor));
        return span(styles, escapeText(node.text));
    };

    const getTagHtml = function (node) {
        const styles = [
            "margin-left:" + _s.row.gap + "px",
            "flex:0 0 auto",
            "color:" + escapeText(node.tagColor || _s.tag.textColor),
            "font-size:" + _s.tag.fontSize + "px",
        ];
        return span(styles, escapeText(node.tag));
    };

    const getNoteHtml = function (node) {
        const styles = [
            "margin-left:" + _s.row.gap + "px",
            "flex:0 1 auto",
            "min-width:0",
            "overflow:hidden",
            "text-overflow:ellipsis",
            "color:" + _s.note.textColor,
            "font-size:" + _s.note.fontSize + "px",
        ];
        return span(styles, escapeText(node.note));
    };

    // The inside of a row: arrow, icon, text, tag, note.
    // WHY: One Label with HTML, not one object for each part: a tree of thousands of rows stays light.
    const getRowHtml = function (rec) {
        const node = rec.node;
        let html = getArrowHtml(rec);
        if (node.iconFile) html += getIconHtml(node);
        html += getTextHtml(node);
        if (isFilled(node.tag)) html += getTagHtml(node);
        if (isFilled(node.note)) html += getNoteHtml(node);
        return html;
    };

    const getRowColor = function (isSelected, isHover) {
        if (isSelected) return _s.rowSelected.color;
        if (isHover) return _s.rowHover.color;
        return "transparent";
    };

    // Colors and aria of a row. (The text is not drawn again.)
    const paintRow = function (rec) {

        if (!rec.row) return;

        const node = rec.node;
        const row = rec.row;
        const isSelected = (node.key === box.value);
        const isHover = (rec === hoverRec) && !isSelected && !node.disabled;

        row.color = getRowColor(isSelected, isHover);
        row.textColor = (isSelected) ? _s.rowSelected.textColor : _s.row.textColor;
        row.opacity = (node.disabled) ? _s.disabled.opacity : 1;
        row.boxShadow = (isSelected && hasFocus) ? "inset 0 0 0 1px " + _s.rowFocus.outlineColor : "none";

        row.aria = {
            selected: isSelected,
            disabled: (node.disabled) ? true : false,
            expanded: (canExpand(rec)) ? isOpen(rec) : null, // null: a leaf has no aria-expanded
        };

    };

    // Text, arrow and colors of a row.
    const drawRow = function (rec) {
        if (!rec.row) return;
        rec.row.text = getRowHtml(rec);
        paintRow(rec);
    };

    // Creates the row of a node in the current container (and its open children).
    const buildRec = function (node, parent, level) {

        const rec = { node: node, parent: parent, level: level, row: null, group: null, built: 0 };
        recs.set(node.key, rec);

        const rowStyle = _s.row;

        // LABEL: Row
        rec.row = Label({
            width: "100%",
            height: rowStyle.height,
            text: "",
            fontSize: rowStyle.fontSize,
            textColor: rowStyle.textColor,
            color: "transparent",
            round: rowStyle.round,
            shrink: 0,
            cursor: "default",
            css: {
                position: "relative",
                display: "flex",
                alignItems: "center",
                whiteSpace: "nowrap",
                overflow: "hidden",
                boxSizing: "border-box",
                paddingLeft: (rowStyle.paddingLeft + level * rowStyle.indent) + "px",
                paddingRight: rowStyle.paddingRight + "px",
            },
            role: "treeitem",
            aria: { level: level + 1 },
        });
        rec.row.elem.id = getRowId(rec);
        rec.row.elem._treeRec = rec; // WHY: One click listener for all the rows finds the rec of a row with it.
        rec.row.clickable = 1;
        drawRow(rec);

        if (isOpen(rec)) buildChildren(rec);

        return rec;

    };

    // Creates the group of the children right after the row (the first time the node opens).
    const buildChildren = function (rec) {

        if (rec.built || !rec.node.children) return;
        rec.built = 1;

        // GROUP: Children
        createIn(rec.row.containerBox, function () {
            rec.group = VGroup({
                width: "100%",
                height: "auto",
                align: "left top",
                gap: 0,
                color: "transparent",
                position: "relative",
                css: { alignItems: "stretch" },
                role: "group",
            });
                rec.children = rec.node.children.map(function (child) {
                    return buildRec(child, rec, rec.level + 1);
                });
            endGroup();
        });

        // WHY: createIn adds it at the end of the container; it must be right under its row.
        rec.row.elem.after(rec.group.elem);

    };

    // Removes a rec and its children from the map (their objects are removed with their group).
    const forget = function (rec) {
        if (rec === hoverRec) hoverRec = null;
        recs.delete(rec.node.key);
        (rec.children || []).forEach(forget);
    };

    const indexNodes = function (list, parentNode) {
        (list || []).forEach(function (node) {
            nodeIndex.set(node.key, { node: node, parent: parentNode });
            if (node.children) indexNodes(node.children, node);
        });
    };

    const unindexNode = function (node) {
        nodeIndex.delete(node.key);
        (node.children || []).forEach(unindexNode);
    };

    // The rec of a key: the closed parents are opened (their rows are created) first.
    const ensureRec = function (key) {
        key = String(key);
        if (recs.get(key)) return recs.get(key);
        if (!nodeIndex.get(key)) return null;
        const path = box.getPath(key);
        for (let i = 0; i < path.length - 1; i++) {
            const rec = recs.get(path[i].key);
            if (!rec) return null;
            setExpanded(rec, 1);
        }
        return recs.get(key) || null;
    };

    // The selection was removed (it is not in the tree any more).
    const dropLostValue = function () {
        if (box.value === null || nodeIndex.get(box.value)) return;
        box.previousValue = box.value;
        box.value = null;
        box.listArea.aria = { activedescendant: null };
    };

    const removeRecView = function (rec) {
        if (rec.group) rec.group.remove();
        if (rec.row) rec.row.remove();
        rec.group = null;
        rec.row = null;
    };

    // Draws the children of a rec again (only that branch).
    const rebuildChildren = function (rec) {
        (rec.children || []).forEach(forget);
        if (rec.group) rec.group.remove();
        rec.group = null;
        rec.children = [];
        rec.built = 0;
        if (isOpen(rec)) buildChildren(rec);
        drawRow(rec);
    };

    const updateEmpty = function () {
        box.lblEmpty.visible = (roots.length) ? 0 : 1;
    };

    const refreshScroll = function () {
        if (box && box.scrollBar && box.scrollBar.refreshScroll) box.scrollBar.refreshScroll();
    };

    // The rows that can be seen (the parents are open), in order.
    const getVisibleRecs = function () {
        const out = [];
        const walk = function (list) {
            list.forEach(function (rec) {
                out.push(rec);
                if (isOpen(rec) && rec.children) walk(rec.children);
            });
        };
        walk(roots);
        return out;
    };

    const getEnabledVisibleRecs = function () {
        return getVisibleRecs().filter(function (rec) { return !rec.node.disabled; });
    };

    const scrollRowIntoView = function (rec) {
        if (!rec || !rec.row || isAutoHeight) return;
        const area = box.listArea.elem;
        const areaBox = area.getBoundingClientRect();
        const rowBox = rec.row.elem.getBoundingClientRect();
        if (rowBox.top < areaBox.top) area.scrollTop -= (areaBox.top - rowBox.top) + SCROLL_SPACE;
        else if (rowBox.bottom > areaBox.bottom) area.scrollTop += (rowBox.bottom - areaBox.bottom) + SCROLL_SPACE;
    };

    const setHover = function (rec) {
        if (rec === hoverRec) return;
        const oldRec = hoverRec;
        hoverRec = rec;
        if (oldRec) paintRow(oldRec);
        if (rec) paintRow(rec);
        box.onHover(box, (rec) ? rec.node : null);
    };

    const openRec = function (rec) {
        if (rec.node.children && rec.built) {
            rec.group.visible = 1;
            return;
        }
        if (rec.node.children) {
            buildChildren(rec);
            return;
        }
        // Lazy: the code gives the children with setChildren().
        drawRow(rec);
        box.onLoadChildren(box, rec.node);
    };

    const closeRec = function (rec, fromUser) {
        if (rec.group) rec.group.visible = 0;
        // WHY: The selection must stay where it can be seen (keyboard).
        const selected = recs.get(box.value);
        if (fromUser && selected && isInside(selected, rec)) selectRec(rec, 1);
    };

    const setExpanded = function (rec, expanded, fromUser) {
        if (!rec || !canExpand(rec)) return;
        expanded = (expanded) ? 1 : 0;
        if (rec.node.expanded == expanded) return;
        rec.node.expanded = expanded;

        if (expanded) openRec(rec);
        else closeRec(rec, fromUser);
        if (!box) return; // WHY: onLoadChildren can remove the tree.

        drawRow(rec);
        refreshScroll();
        box.onToggle(box, rec.node);
    };

    const isInside = function (rec, parent) {
        for (let p = rec.parent; p; p = p.parent) {
            if (p === parent) return true;
        }
        return false;
    };

    // fromUser: onSelect is called. (Not for silent.)
    const selectRec = function (rec, fromUser) {
        if (!rec || rec.node.disabled) return;
        if (rec.node.key === box.value) return;
        const oldRec = recs.get(box.value);
        box.previousValue = box.value;
        box.value = rec.node.key;
        if (oldRec) paintRow(oldRec);
        paintRow(rec);
        box.listArea.aria = { activedescendant: getRowId(rec) };
        scrollRowIntoView(rec);
        if (fromUser) box.onSelect(box, rec.node);
    };

    const activateRec = function (rec) {
        if (!rec || rec.node.disabled) return;
        box.onActivate(box, rec.node);
    };

    // step: +1 down, -1 up; Infinity / -Infinity: the last / the first row.
    const moveSelection = function (step) {
        const list = getEnabledVisibleRecs();
        if (!list.length) return;
        let position = list.indexOf(recs.get(box.value));
        if (position === -1) position = (step > 0) ? -1 : list.length;
        position = basic.clamp(position + step, 0, list.length - 1);
        selectRec(list[position], 1);
    };

    const getPageSize = function () {
        if (isAutoHeight) return AUTO_HEIGHT_PAGE_SIZE;
        return Math.max(1, Math.floor(box.listArea.elem.clientHeight / _s.row.height) - 1);
    };

    // ArrowRight: opens a closed node, or goes to the first child of an open one.
    const goRight = function (current) {
        if (!current) {
            moveSelection(1);
            return;
        }
        if (canExpand(current) && !isOpen(current)) {
            setExpanded(current, 1, 1);
            return;
        }
        if (!isOpen(current) || !current.children) return;
        const firstChild = current.children.find(function (child) { return !child.node.disabled; });
        selectRec(firstChild, 1);
    };

    // ArrowLeft: closes an open node, or goes to the parent.
    const goLeft = function (current) {
        if (!current) return;
        if (isOpen(current)) setExpanded(current, 0, 1);
        else if (current.parent) selectRec(current.parent, 1);
    };

    const isTypeAheadKey = function (event) {
        if (box.typeAhead != 1 || event.key.length !== 1) return false;
        return !event.ctrlKey && !event.metaKey && !event.altKey;
    };

    // Returns 1 when the key was used by the tree.
    const handleKey = function (event) {

        const current = recs.get(box.value);

        switch (event.key) {
            case "ArrowDown": moveSelection(1); return 1;
            case "ArrowUp": moveSelection(-1); return 1;
            case "PageDown": moveSelection(getPageSize()); return 1;
            case "PageUp": moveSelection(-getPageSize()); return 1;
            case "Home": moveSelection(-Infinity); return 1;
            case "End": moveSelection(Infinity); return 1;
            case "ArrowRight": goRight(current); return 1;
            case "ArrowLeft": goLeft(current); return 1;
            case "Enter": activateRec(current); return 1;
            case " ":
                if (current && canExpand(current)) setExpanded(current, !isOpen(current), 1);
                return 1;
        }

        if (!isTypeAheadKey(event)) return 0;
        typeAhead(event.key);
        return 1;

    };

    const onKeyDown = function (event) {
        if (box.enabled != 1) return;
        if (!handleKey(event)) return;
        event.preventDefault();
        event.stopPropagation();
    };

    // Jumps to the next row whose text starts with the typed letters.
    const typeAhead = function (char) {

        if (cancelTypeTimer) cancelTypeTimer();
        cancelTypeTimer = box.after(TYPE_AHEAD_RESET_MS, function () {
            typeBuffer = "";
            cancelTypeTimer = null;
        });
        typeBuffer += char.toLocaleLowerCase();

        const list = getEnabledVisibleRecs();
        if (!list.length) return;

        const start = Math.max(0, list.indexOf(recs.get(box.value)));
        // WHY: One letter: the next match. More letters: the same row, while it still matches.
        const from = (typeBuffer.length === 1) ? start + 1 : start;
        for (let i = 0; i < list.length; i++) {
            const rec = list[(from + i) % list.length];
            const text = String(rec.node.text).toLocaleLowerCase();
            if (text.indexOf(typeBuffer) !== 0) continue;
            selectRec(rec, 1);
            return;
        }

    };

    const getRecOfEvent = function (event) {
        for (let element = event.target; element && element !== box.listArea.elem; element = element.parentElement) {
            if (element._treeRec) return element._treeRec;
        }
        return null;
    };

    const isArrowEvent = function (event) {
        return !!(event.target && event.target.closest && event.target.closest("[data-tv-arrow]"));
    };

    // Puts the row (and its children group) before the row of next. (No next: it stays at the end.)
    const moveRecTo = function (rec, next) {
        if (!next || !next.row) return;
        next.row.elem.before(rec.row.elem);
        if (rec.group) rec.row.elem.after(rec.group.elem);
    };

    const getInsertPosition = function (position, length) {
        return (position < 0 || position > length) ? length : position;
    };

    const addRootNode = function (node, position) {
        const at = getInsertPosition(position, roots.length);
        indexNodes([node], null);
        const rec = createIn(box.list, function () { return buildRec(node, null, 0); });
        roots.splice(at, 0, rec);
        moveRecTo(rec, roots[at + 1]);
    };

    const addChildNode = function (parentEntry, node, position) {

        const parentNode = parentEntry.node;
        parentNode.children = parentNode.children || [];
        const at = getInsertPosition(position, parentNode.children.length);
        indexNodes([node], parentNode);
        parentNode.children.splice(at, 0, node);

        // Not drawn yet (closed or not created): drawn when it opens. Only the arrow of the parent can change.
        const parent = recs.get(parentNode.key);
        if (!parent || !parent.built) {
            if (parent) drawRow(parent);
            return;
        }

        const rec = createIn(parent.group, function () { return buildRec(node, parent, parent.level + 1); });
        parent.children.splice(at, 0, rec);
        moveRecTo(rec, parent.children[at + 1]);
        drawRow(parent);

    };

    // *** PUBLIC FUNCTIONS:

    // The tree again from a NODE list. (Expanded states come from the nodes.)
    box.setItems = function (items, value = box.value) {
        roots.forEach(forget);
        roots.forEach(removeRecView);
        roots = [];
        recs = new Map();
        nodeIndex = new Map();
        hoverRec = null;
        const list = (Array.isArray(items) ? items : []).map(normalize);
        indexNodes(list, null);
        createIn(box.list, function () {
            roots = list.map(function (node) { return buildRec(node, null, 0); });
        });
        box.value = null;
        if (value !== null && value !== undefined) {
            const rec = ensureRec(value);
            if (rec) selectRec(rec, 0);
        }
        updateEmpty();
        refreshScroll();
    };

    // The nodes with their current expanded states. (A copy; data is kept by reference.)
    box.getItems = function () {
        const copy = function (node) {
            const out = Object.assign({}, node);
            if (node.children) out.children = node.children.map(copy);
            return out;
        };
        return roots.map(function (rec) { return copy(rec.node); });
    };

    box.getNode = function (key) {
        const entry = nodeIndex.get(String(key));
        return (entry) ? entry.node : null;
    };

    box.getParent = function (key) {
        const entry = nodeIndex.get(String(key));
        return (entry) ? entry.parent : null;
    };

    // [root, ..., node]
    box.getPath = function (key) {
        const out = [];
        let entry = nodeIndex.get(String(key));
        while (entry) {
            out.unshift(entry.node);
            entry = (entry.parent) ? nodeIndex.get(entry.parent.key) : null;
        }
        return out;
    };

    box.getSelectedNode = function () {
        return box.getNode(box.value);
    };

    // silent: 1 -> onSelect is not called. null: nothing is selected.
    box.setValue = function (key, silent = 0) {
        if (key === null || key === undefined) {
            const oldRec = recs.get(box.value);
            box.previousValue = box.value;
            box.value = null;
            if (oldRec) paintRow(oldRec);
            box.listArea.aria = { activedescendant: null };
            return;
        }
        const rec = ensureRec(key);
        if (!rec) return;
        selectRec(rec, !silent);
        scrollRowIntoView(rec);
    };

    // NOTE: A node in a closed branch only keeps the state: it is drawn so when its parent opens.
    const setNodeExpanded = function (key, expanded) {
        const rec = recs.get(String(key));
        if (rec) {
            setExpanded(rec, expanded);
            return;
        }
        const entry = nodeIndex.get(String(key));
        if (entry) entry.node.expanded = (expanded) ? 1 : 0;
    };

    box.expand = function (key) {
        setNodeExpanded(key, 1);
    };

    box.collapse = function (key) {
        setNodeExpanded(key, 0);
    };

    box.toggle = function (key) {
        const node = box.getNode(key);
        if (node) setNodeExpanded(key, !(node.expanded == 1));
    };

    // NOTE: Opens every node that has children (lazy ones are not loaded).
    box.expandAll = function () {
        const walk = function (list) {
            list.forEach(function (rec) {
                if (!rec.node.children || !rec.node.children.length) return;
                setExpanded(rec, 1);
                walk(rec.children || []);
            });
        };
        walk(roots);
    };

    box.collapseAll = function () {
        recs.forEach(function (rec) { setExpanded(rec, 0); });
        nodeIndex.forEach(function (entry, key) {
            if (!recs.get(key)) entry.node.expanded = 0;
        });
    };

    // Opens the parents of a node and scrolls to it.
    box.reveal = function (key) {
        scrollRowIntoView(ensureRec(key));
    };

    // Changes some fields of a node and paints only its row. ("children" -> use setChildren)
    box.updateNode = function (key, props = {}) {
        const entry = nodeIndex.get(String(key));
        if (!entry) return;
        Object.keys(props).forEach(function (name) {
            if (name === "children" || name === "key" || name === "expanded") return;
            entry.node[name] = props[name];
        });
        const rec = recs.get(String(key));
        if (rec) drawRow(rec);
        if (props.expanded !== undefined) setNodeExpanded(key, props.expanded);
    };

    // New children for a node (lazy loading, a refresh). Only that branch is drawn again.
    box.setChildren = function (key, children) {
        const entry = nodeIndex.get(String(key));
        if (!entry) return;
        (entry.node.children || []).forEach(unindexNode);
        entry.node.children = (Array.isArray(children) ? children : []).map(normalize);
        indexNodes(entry.node.children, entry.node);
        dropLostValue();
        const rec = recs.get(String(key));
        if (rec) rebuildChildren(rec); // Not created yet: drawn when its parent opens.
        refreshScroll();
    };

    // Adds a node under parentKey (null: a root) at position (-1: the end). Returns the node.
    box.addNode = function (parentKey, node, position = -1) {

        const isRoot = (parentKey === null || parentKey === undefined);
        const parentEntry = (isRoot) ? null : nodeIndex.get(String(parentKey));
        if (!isRoot && !parentEntry) return null;

        const newNode = normalize(node);
        if (nodeIndex.get(newNode.key)) {
            console.warn("TreeView: The key is used: " + newNode.key);
            return null;
        }

        if (isRoot) addRootNode(newNode, position);
        else addChildNode(parentEntry, newNode, position);

        updateEmpty();
        refreshScroll();
        return newNode;

    };

    box.removeNode = function (key) {

        const entry = nodeIndex.get(String(key));
        if (!entry) return;

        if (entry.parent) {
            const siblings = entry.parent.children;
            const position = siblings.indexOf(entry.node);
            if (position !== -1) siblings.splice(position, 1);
        }
        unindexNode(entry.node);

        const rec = recs.get(String(key));
        if (rec) {
            const list = (rec.parent) ? rec.parent.children : roots;
            const position = list.indexOf(rec);
            if (position !== -1) list.splice(position, 1);
            forget(rec);
            removeRecView(rec);
        }

        dropLostValue();
        const parentRec = (entry.parent) ? recs.get(entry.parent.key) : null;
        if (parentRec) drawRow(parentRec);
        updateEmpty();
        refreshScroll();

    };

    box.setEnabled = function (enabled) {
        const isEnabled = (enabled) ? 1 : 0;
        box.enabled = isEnabled;
        box.listArea.tabIndex = (isEnabled) ? 0 : -1;
        box.opacity = (isEnabled) ? 1 : _s.disabled.opacity;
        box.listArea.css.pointerEvents = (isEnabled) ? "" : "none";
    };

    box.focus = function () {
        box.listArea.elem.focus();
    };

    box.setEmptyText = function (text) {
        box.emptyText = text;
        box.lblEmpty.plainText = text;
    };

    // NOTE: No remove() of its own: basic.js removes the rows, the ScrollBar (a child) and their events,
    //       and stops the timer of box.after().

    // *** OBJECT VIEW:

    box.clipContent = 1;
    box.border = _s.box.border;
    box.borderColor = _s.box.borderColor;
    box.round = _s.box.round;

    // BOX: Scrolling area (it takes the focus)
    box.listArea = startBox(0, 0, "100%", (isAutoHeight) ? "auto" : "100%", {
        color: "transparent",
        scrollY: (isAutoHeight) ? 0 : 1,
        clickable: 1,
        css: { outline: "none" },
        tabIndex: 0,
        role: "tree",
        aria: { label: box.ariaLabel },
    });
    // WHY: With height "auto" the area must be in the flow, so the tree grows with its rows.
    if (isAutoHeight) box.listArea.css.position = "relative";

        // GROUP: Rows
        box.list = VGroup({
            width: "100%",
            height: "auto",
            align: "left top",
            gap: 0,
            padding: _s.box.padding,
            color: "transparent",
            position: "relative",
            css: { alignItems: "stretch" },
        });
        endGroup();

        // LABEL: Empty text
        box.lblEmpty = Label({
            plainText: box.emptyText,
            width: "100%",
            top: EMPTY_TEXT_TOP,
            fontSize: _s.empty.fontSize,
            textColor: _s.empty.textColor,
            textAlign: "center",
            visible: 0,
        });

    endBox();

    if (!isAutoHeight && box.useScrollBar == 1 && typeof ScrollBar !== "undefined") {
        const scrollBarProps = { scrollableBox: box.listArea, neverHide: 0, showDots: 0 };
        box.scrollBar = ScrollBar(Object.assign(scrollBarProps, _s.scrollBar));
    }

    // *** OBJECT INIT CODE:

    const repaintSelected = function () {
        const rec = recs.get(box.value);
        if (rec) paintRow(rec);
    };

    // EVENTS: One listener for all the rows (the rows are drawn again often).
    box.listArea.on("click", function (self, event) {
        if (box.enabled != 1) return;
        const rec = getRecOfEvent(event);
        if (!rec) return;
        if (isArrowEvent(event) && canExpand(rec)) {
            setExpanded(rec, !isOpen(rec), 1);
            return;
        }
        selectRec(rec, 1);
    });
    box.listArea.on("dblclick", function (self, event) {
        if (box.enabled != 1) return;
        const rec = getRecOfEvent(event);
        if (!rec || isArrowEvent(event) || rec.node.disabled) return;
        if (canExpand(rec)) setExpanded(rec, !isOpen(rec), 1);
        activateRec(rec);
    });
    box.listArea.on("mousemove", function (self, event) {
        if (box.enabled != 1) return;
        setHover(getRecOfEvent(event));
    });
    box.listArea.on("mouseleave", function () { setHover(null); });
    box.listArea.on("keydown", function (self, event) { onKeyDown(event); });
    box.listArea.on("focus", function () {
        hasFocus = 1;
        repaintSelected();
    });
    box.listArea.on("blur", function () {
        hasFocus = 0;
        repaintSelected();
    });

    box.setItems(startItems, startValue);
    if (box.enabled != 1) box.setEnabled(0);

    return endObject(box);

};

TreeView._counter = 1;

// A key -> a safe part of an id.
TreeView.toId = function (key) {
    return String(key).replace(/[^A-Za-z0-9_-]/g, function (c) { return "_" + c.charCodeAt(0).toString(16); });
};

// A small right arrow (rotated 90° when the node is open).
TreeView.getChevronSvg = function (color, size) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 12 12"' +
        ' fill="none" stroke="' + color + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display:block">' +
        '<path d="M4.5 2.5 8 6l-3.5 3.5"/></svg>';
};

// *** STYLE PACKAGES:
// USAGE: TreeView({ styleName: "modern" })
// USAGE: TreeView({ styleName: "dark", style: { rowSelected: { color: "#3D3D3D" } } }) // Change only some keys.
// USAGE: TreeView({ style: TreeView.styles.dark }) // The same as styleName: "dark". (The package is copied, never changed.)
// NOTE: A new package needs only the keys that differ from the default (classic) style.
// USAGE: TreeView.styles.myStyle = { tag: { textColor: "red" } };
TreeView.styles = {

    // Dark text, gray hover and selection on a light page.
    classic: TreeViewDefaults.style,

    // Cadetblue, same colors as the modern Tabs, CheckBox, RadioButton and TagInput.
    modern: {
        box: { color: "transparent", border: 0, borderColor: "transparent", round: 0, padding: [6, 6] },
        row: { height: 32, fontSize: 14, textColor: Black(0.75), indent: 18, paddingLeft: 6, paddingRight: 10, gap: 8, round: 100 },
        rowHover: { color: "#EEF5F5" },
        rowSelected: { color: "#DFECEC", textColor: "#2F5F61" },
        rowFocus: { outlineColor: "cadetblue" },
        arrow: { color: "cadetblue", size: 12, motion: 0.15 },
        icon: { size: 16 },
        tag: { textColor: "cadetblue", fontSize: 12 },
        note: { textColor: Black(0.4), fontSize: 12 },
        disabled: { opacity: 0.4 },
        empty: { textColor: Black(0.4), fontSize: 14 },
        scrollBar: { bar_color: "#9A9A98", bar_mouseOverColor: "#6A6A68", bar_width: 4, bar_round: 3, bar_opacity: 0.4, bar_mouseOverOpacity: 0.9, bar_padding: 2 },
    },

    // Dark theme, same colors as PropertyPanel (the layers of a design tool).
    dark: {
        box: { color: "#2C2C2C", border: 0, borderColor: "transparent", round: 0, padding: [4, 4] },
        row: { height: 24, fontSize: 12, textColor: "#E6E6E6", indent: 12, paddingLeft: 2, paddingRight: 8, gap: 6, round: 4 },
        rowHover: { color: "#383838" },
        rowSelected: { color: "#34435A", textColor: "#FFFFFF" },
        rowFocus: { outlineColor: "#0C8CE9" },
        arrow: { color: "#A5A5A5", size: 10, motion: 0.12 },
        icon: { size: 14 },
        tag: { textColor: "#A5A5A5", fontSize: 12 },
        note: { textColor: "#6E6E6E", fontSize: 12 },
        disabled: { opacity: 0.4 },
        empty: { textColor: "#6E6E6E", fontSize: 12 },
        scrollBar: { bar_color: "#8A8A88", bar_mouseOverColor: "#BFBFBD", bar_width: 4, bar_round: 3, bar_opacity: 0.4, bar_mouseOverOpacity: 0.9, bar_padding: 2 },
    },

};
