/* Bismillah */

/*

Tooltip - v26.10

- A hint over an object: it follows the mouse while the mouse is on its target (Tooltip({ target, hintText })).
- THE BUBBLE (2026-10-30, the user): an optional arrow (lbl_arrow, px) that points at the mouse / the target; the
  edge of the bubble (lbl_border) goes around the arrow too, as one line. The bubble never goes out of the screen:
  it slides inside, or goes to the other side when there is no room (top <-> bottom, left <-> right); the arrow
  still points at its place.
- Tooltip.show(target, text, look, side, content): a bubble at an object, not under the mouse (Ex: the "Click
  again" of a SmartButton ask); it returns the bubble, bubble.remove() takes it away. look: Tooltip.BUBBLE_LOOK keys.
- CONTENT (2026-10-30): content: function (bubble) { ... } builds its own objects in the bubble in place of the text
  (a title and a text, a shortcut, a user card...); they are made one under the other (look.contentGap).
- POPOVER (2026-10-30): trigger: "click" (or Tooltip.openPopover()): a click on the target opens the bubble and it
  stays; its content can be clicked (buttons, fields). A click outside, Escape or a second click on the target closes
  it. One popover at a time (Tooltip.closePopover()).

USAGE:
btn.tooltip = Tooltip({ target: btn, hintText: "Save the file", hintPosition: "top", lbl_arrow: 10 });
avatar.tooltip = Tooltip({ target: avatar, content: function (bubble) { Label({ text: "Ayşe Kaya", bold: 1 }); } });
btnShare.tooltip = Tooltip({ target: btnShare, trigger: "click", lbl_arrow: 12, content: function (bubble) {
    Label({ text: "Share the link" });
    SmartButton({ labelText: "Copy", onClick: function () { Tooltip.closePopover(); } });
} });
const bubble = Tooltip.show(button, "Click again to delete.", { color: "#E8796D", textColor: "white", arrow: 12 });
bubble.remove();

Started Date: June 2024
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";
const Tooltip = function(params = {}) {

    // Default values
    const defaults = {
        target: null,
        hintText: "",
        hintPosition: "top", // "top", "left", "bottom", "right"
        lbl_fontSize: 12,
        lbl_spaceX: 8,
        lbl_spaceY: 3,
        lbl_color: "rgba(255, 255, 255, 0.90)",
        lbl_textColor: "rgba(0, 0, 0, 0.85)",
        lbl_round: 3,
        lbl_border: 1,
        lbl_borderColor: "rgba(0, 0, 0, 0.9)",
        lbl_arrow: 0, // px: the side of the arrow (0: no arrow)
        content: null, // function (bubble): its own objects in the bubble, in place of hintText
        trigger: "hover", // "hover": it follows the mouse; "click": a popover (it stays, its content can be clicked)
        look: null, // Tooltip.BUBBLE_LOOK keys over the lbl_ ones (Ex: { shadow, padding: [16, 14], contentGap })
        visible: 0,
    };

    // BOX: Component container
    const box = startObject();

    // Values ready to use
    box.props(defaults, params);

    // *** Private variables:
    let removeMouseOver = null;
    let removeMouseMove = null;
    let removeMouseOut = null;
    let removeClick = null;
    // The room between the mouse and the bubble, for each side (under the mouse: the cursor is there)
    const MOUSE_GAPS = { top: 12, bottom: 20, left: 25, right: 25 };

    // *** Private functions:

    // WHY: One hint (window.lblHint) is shared by every Tooltip: only the one under the mouse is open.
    const removeHintLabel = function() {
        if (!window.lblHint) return;
        window.lblHint.remove();
        window.lblHint = null;
    };

    const getLook = function() {
        return Object.assign({
            fontSize: box.lbl_fontSize,
            padding: [box.lbl_spaceX, box.lbl_spaceY],
            color: box.lbl_color,
            textColor: box.lbl_textColor,
            round: box.lbl_round,
            border: box.lbl_border,
            borderColor: box.lbl_borderColor,
            arrow: box.lbl_arrow,
            gap: MOUSE_GAPS[box.hintPosition] || MOUSE_GAPS.top,
        }, box.look || {});
    };

    // The color of the bubble: the one of look wins over lbl_color (getLook)
    const getColor = function() {
        return (box.look && box.look.color) || box.lbl_color;
    };

    const refreshPosition = function(event) {
        const point = Tooltip.toPagePoint(event.clientX, event.clientY);
        box.mouseX = point.x;
        box.mouseY = point.y;
        Tooltip.place(window.lblHint, { left: point.x, top: point.y, width: 0, height: 0 }, box.hintPosition);
    };

    // *** Public functions:

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function() {

        if (box._isRemoved) return; // WHY: remove() can be called twice (also by the parent's remove()).

        // WHY: The mouse events are on the target object, box.remove() does not clean them.
        removeMouseOver();
        removeMouseMove();
        removeMouseOut();
        removeClick();

        removeHintLabel();
        if (Tooltip.isPopoverOf(box.target)) Tooltip.closePopover();

        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.

    }

    box.setHintText = function(text) {
        box.hintText = text;
        if (window.lblHint && window.lblHint.label) {
            window.lblHint.label.text = text;
        }
    }

    box.setLbl_color = function(color) {
        box.lbl_color = color;
        if (box.look && box.look.color) box.look = Object.assign({}, box.look, { color: color });
        if (window.lblHint) {
            Tooltip.paintBubble(window.lblHint, color);
        }
    }

    // *** OBJECT TEMPLATE:

    const isClick = function() {
        return box.trigger == "click";
    };

    removeMouseOver = box.target.on("mouseover", function() {
        if (isClick() || window.lblHint) return;
        window.lblHint = Tooltip.createBubble(box.hintText, getLook(), box.content);
    });

    removeMouseMove = box.target.on("mousemove", function(self, event) {
        if (isClick() || !window.lblHint) return;

        // WHY: Eğer mouse tooltip tetikleyen bir object üzerinde bırakılırsa ve
        // başka bir olay, tooltip in text ve rengini değiştirirse; objeye giriş yapmadan hareket ettirilen mouse,
        // diğer olayın metnini gösterebilir. O yüzden, metin kontrol ediliyor.
        if (window.lblHint.label && window.lblHint.label.text != box.hintText) {
            window.lblHint.label.text = box.hintText;
        }
        // WHY getColor(): a color of look must stay (lbl_color painted a dark bubble of a content white)
        if (window.lblHint.look.color != getColor()) {
            Tooltip.paintBubble(window.lblHint, getColor());
        }

        refreshPosition(event);
    });

    removeMouseOut = box.target.on("mouseout", function() {
        if (isClick()) return;
        removeHintLabel();
    });

    // POPOVER: a click opens it, a second click closes it
    removeClick = box.target.on("click", function() {
        if (!isClick()) return;
        if (Tooltip.isPopoverOf(box.target)) {
            Tooltip.closePopover();
            return;
        }
        Tooltip.openPopover(box.target, box.content, Object.assign(getLook(), { gap: (box.look && box.look.gap) || 6 }), box.hintPosition, box.hintText);
    });

    // *** OBJECT INIT CODE:
    box.target.clickable = 1;

    return endObject(box);

};

// *** THE BUBBLE (static: the hint of Tooltip and Tooltip.show() use it)

// The keys of a look (Tooltip.show(target, text, look) fills the missing ones from here)
Tooltip.BUBBLE_LOOK = {
    fontSize: 13,
    bold: 0,
    padding: [10, 6], // [left / right, top / bottom]
    color: "rgba(255, 255, 255, 0.95)",
    textColor: "rgba(0, 0, 0, 0.85)",
    round: 6,
    border: 0, // px: the edge goes around the arrow too
    borderColor: "rgba(0, 0, 0, 0.2)",
    shadow: "", // Ex: "0 6px 16px rgba(0, 0, 0, 0.18)"
    arrow: 10, // px: the side of the arrow (0: no arrow)
    contentGap: 8, // px: between the objects of a content
    gap: 6, // px: from the target to the point of the arrow
    edge: 8, // px: the bubble stays this far inside the screen
    grow: 0, // 1: it grows out of the point of the arrow (not with reduced motion)
    zIndex: 100000, // WHY: on page, over the popups (Dialog cover 4000, Modal...)
};

// GROUP: A bubble on the page: a text (or the objects of content(bubble)), and an arrow whose edge goes on from
// the edge of the bubble
Tooltip.createBubble = function(text, look, content) {
    const _l = Object.assign({}, Tooltip.BUBBLE_LOOK, look || {});
    const hasContent = (typeof content === "function");
    const bubble = createIn(page, function() {
        const group = AutoLayout({
            flow: hasContent ? "vertical" : "horizontal",
            hug: 1,
            align: hasContent ? "left top" : "center center",
            gap: hasContent ? _l.contentGap : 0,
            padding: _l.padding,
            color: _l.color,
            round: _l.round,
            border: _l.border,
            borderColor: _l.borderColor,
            clipContent: 0,
            zIndex: _l.zIndex,
            role: "status",
        });
        group.css = { position: "absolute", boxShadow: _l.shadow || "none" };
            group.label = null;
            if (hasContent) {
                content(group);
            } else {
                group.label = Label({ plainText: text, fontSize: _l.fontSize, bold: _l.bold ? 1 : 0, textColor: _l.textColor });
                // WHY: as wide as its text (a width measured before the font came cut the end of the text)
                group.label.css = { whiteSpace: "nowrap", width: "max-content", flexShrink: "0" };
            }
            // BOX: Arrow (a turned square over the edge of the bubble; two of its sides have the edge)
            group.arrow = Box({ width: _l.arrow, height: _l.arrow, color: _l.color, visible: _l.arrow ? 1 : 0 });
            group.arrow.css = { position: "absolute", boxSizing: "border-box" };
        endAutoLayout();
        return group;
    });
    bubble.look = _l;
    return bubble;
};

Tooltip.paintBubble = function(bubble, color) {
    bubble.look.color = color;
    bubble.color = color;
    bubble.arrow.color = color;
};

// A point of the screen (clientX / clientY) in the pixels of the page (page.fit() zooms it with a transform)
Tooltip.toPagePoint = function(clientX, clientY) {
    const pageRect = page.elem.getBoundingClientRect();
    const scale = (pageRect.width / page.elem.offsetWidth) || 1;
    return { x: (clientX - pageRect.left) / scale, y: (clientY - pageRect.top) / scale };
};

// The place of an object in the pixels of the page
Tooltip.toPageRect = function(obj) {
    const rect = obj.elem.getBoundingClientRect();
    const topLeft = Tooltip.toPagePoint(rect.left, rect.top);
    const bottomRight = Tooltip.toPagePoint(rect.right, rect.bottom);
    return { left: topLeft.x, top: topLeft.y, width: bottomRight.x - topLeft.x, height: bottomRight.y - topLeft.y };
};

// The screen in the pixels of the page
Tooltip.getScreenRect = function() {
    const topLeft = Tooltip.toPagePoint(0, 0);
    const bottomRight = Tooltip.toPagePoint(window.innerWidth, window.innerHeight);
    return { left: topLeft.x, top: topLeft.y, right: bottomRight.x, bottom: bottomRight.y };
};

// The bubble at a place (target: a rect in the pixels of the page; a point is a rect of 0 x 0), on its side
// ("top", "bottom", "left", "right"); the other side when there is no room; inside the screen.
// Returns the side it got.
Tooltip.place = function(bubble, target, side = "top") {

    const _l = bubble.look;
    const screen = Tooltip.getScreenRect();
    const width = bubble.elem.offsetWidth;
    const height = bubble.elem.offsetHeight;
    // WHY 0.71: the point of a turned square is its half diagonal (side / √2) away from its middle
    const reach = _l.gap + (_l.arrow ? _l.arrow * 0.71 : 0);
    const centerX = target.left + target.width / 2;
    const centerY = target.top + target.height / 2;

    side = Tooltip.chooseSide(side, target, width, height, reach, screen, _l.edge);

    let left = 0;
    let top = 0;
    if (side == "top") top = target.top - reach - height;
    if (side == "bottom") top = target.top + target.height + reach;
    if (side == "left") left = target.left - reach - width;
    if (side == "right") left = target.left + target.width + reach;
    if (side == "top" || side == "bottom") left = centerX - width / 2;
    if (side == "left" || side == "right") top = centerY - height / 2;

    // (rounded: the arrow is placed from the place the bubble really gets)
    left = Math.round(Tooltip.clamp(left, screen.left + _l.edge, screen.right - _l.edge - width));
    top = Math.round(Tooltip.clamp(top, screen.top + _l.edge, screen.bottom - _l.edge - height));
    bubble.left = left;
    bubble.top = top;

    Tooltip.placeArrow(bubble, side, centerX - left, centerY - top);
    return side;

};

// The other side when the bubble does not fit on its side and fits there
Tooltip.chooseSide = function(side, target, width, height, reach, screen, edge) {
    const room = {
        top: target.top - screen.top - edge,
        bottom: screen.bottom - edge - target.top - target.height,
        left: target.left - screen.left - edge,
        right: screen.right - edge - target.left - target.width,
    };
    const other = { top: "bottom", bottom: "top", left: "right", right: "left" }[side] || "bottom";
    const need = (side == "top" || side == "bottom") ? height + reach : width + reach;
    if (room[side] >= need || room[other] < need) return side;
    return other;
};

Tooltip.clamp = function(value, min, max) {
    return Math.max(min, Math.min(max, value));
};

// The arrow on the edge of the side that looks at the target; x / y: the target in the bubble (it stays off the
// round corners). WHY the middle on the edge line: the arrow covers that part of the edge, and its two sides
// with the edge go on from it.
Tooltip.placeArrow = function(bubble, side, x, y) {
    const _l = bubble.look;
    const arrow = bubble.arrow;
    if (!_l.arrow) return;
    const size = _l.arrow;
    const line = _l.border;
    // (the place of an absolute object starts inside the edge of the bubble)
    const innerWidth = bubble.elem.clientWidth;
    const innerHeight = bubble.elem.clientHeight;
    const margin = _l.round + size * 0.71;
    const edgeLine = line + "px solid " + _l.borderColor;
    let left = 0;
    let top = 0;
    let sides = [];
    if (side == "top" || side == "bottom") {
        left = Tooltip.clamp(x - line, margin, innerWidth - margin) - size / 2;
        top = (side == "top") ? innerHeight + line / 2 - size / 2 : -line / 2 - size / 2;
        sides = (side == "top") ? ["Right", "Bottom"] : ["Left", "Top"];
    } else {
        top = Tooltip.clamp(y - line, margin, innerHeight - margin) - size / 2;
        left = (side == "left") ? innerWidth + line / 2 - size / 2 : -line / 2 - size / 2;
        sides = (side == "left") ? ["Top", "Right"] : ["Bottom", "Left"];
    }
    arrow.left = left;
    arrow.top = top;
    const css = { transform: "rotate(45deg)", borderTop: "none", borderRight: "none", borderBottom: "none", borderLeft: "none" };
    if (line) sides.forEach(function(name) { css["border" + name] = edgeLine; });
    arrow.css = css;
    // (the bubble grows out of the point of the arrow)
    bubble.css = { transformOrigin: (left + size / 2 + line) + "px " + (top + size / 2 + line) + "px" };
};

// A bubble at an object (Ex: the "Click again" of an ask). Returns the bubble: bubble.remove() takes it away.
Tooltip.show = function(target, text, look, side = "top", content = null) {
    const bubble = Tooltip.createBubble(text, look, content);
    Tooltip.place(bubble, Tooltip.toPageRect(target), side);
    // WHY: a text measured before its font came is narrower; the bubble is placed again when the fonts are ready
    if (document.fonts && document.fonts.status != "loaded") {
        document.fonts.ready.then(function() {
            if (!bubble._isRemoved && !target._isRemoved) Tooltip.place(bubble, Tooltip.toPageRect(target), side);
        });
    }
    if (bubble.look.grow) Tooltip.grow(bubble);
    return bubble;
};
// USAGE: const bubble = Tooltip.show(button, "Click again to delete.", { color: "#E8796D", textColor: "white", arrow: 12, grow: 1 });
// USAGE: Tooltip.show(avatar, "", look, "bottom", function (bubble) { Label({ text: "Ayşe Kaya", bold: 1 }); });

// *** THE POPOVER: a bubble that stays and can be clicked; a click outside, Escape or closePopover() closes it.
Tooltip.openedPopover = null; // { bubble, target, close }

// options: { onClose: function () {} }. Returns the bubble.
Tooltip.openPopover = function(target, content, look, side = "bottom", text = "", options = {}) {
    Tooltip.closePopover();
    const bubble = Tooltip.show(target, text, look, side, content);
    bubble.clickable = 1;
    bubble.role = "dialog";
    // WHY on window and in the capture phase: the popover is the top layer; its Escape must not reach a Dialog under it
    const onPointerDown = function(event) {
        if (bubble.elem.contains(event.target) || target.elem.contains(event.target)) return;
        Tooltip.closePopover();
    };
    const onKeyDown = function(event) {
        if (event.key != "Escape") return;
        event.stopImmediatePropagation();
        Tooltip.closePopover();
        if (target.elem.tabIndex >= 0) target.elem.focus();
    };
    // WHY placed again, not closed: a phone keyboard (a field in the popover) changes the size of the screen
    const onResize = function() {
        if (!target._isRemoved) Tooltip.place(bubble, Tooltip.toPageRect(target), side);
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("resize", onResize);
    Tooltip.openedPopover = {
        bubble: bubble,
        target: target,
        close: function() {
            window.removeEventListener("pointerdown", onPointerDown, true);
            window.removeEventListener("keydown", onKeyDown, true);
            window.removeEventListener("resize", onResize);
            bubble.remove();
            if (typeof options.onClose === "function") options.onClose();
        },
    };
    return bubble;
};
// USAGE: Tooltip.openPopover(btnShare, function (bubble) { Label({ text: "Share" }); SmartButton({ labelText: "Copy" }); }, look, "bottom");

Tooltip.closePopover = function() {
    const opened = Tooltip.openedPopover;
    if (!opened) return;
    Tooltip.openedPopover = null; // WHY first: onClose may open another one
    opened.close();
};

Tooltip.isPopoverOf = function(target) {
    return !!Tooltip.openedPopover && Tooltip.openedPopover.target === target;
};

Tooltip.grow = function(bubble) {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    bubble.opacity = 0;
    bubble.css = { transform: "scale(0.6)" };
    // WHY: the start look must be drawn before the motion is turned on, or it is seen at once
    void bubble.elem.offsetHeight;
    bubble.setMotionNow("transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s"); // a little spring at the end
    bubble.opacity = 1;
    bubble.css = { transform: "none" };
};
