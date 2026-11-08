/* Bismillah */

/*

Notice - v26.10

A short message in the middle of the screen over a soft dark cover: "Process completed", "No internet connection".
It comes in, stays a moment (displayTime) and goes. The look:
a round box with a thin line and a soft shadow, a big text, a color by its type, an icon at the left.
- Notice.show({ messageText, descriptionText, type, iconFile, displayTime }) makes it on page. Only one at a time: a new
  notice takes the place of the one that is seen.
- type: "info" (white), "warning" (yellow), "error" (red), "note" (blue), "success" (green). Notice.COLORS
- descriptionText: a smaller second line. The texts are plain text (allowHtml: 1: HTML, only for your own texts).
- A click (on the cover or the message) or Escape closes it before its time. displayTime 0: it stays until then.
- Motion: it grows in from a little smaller with a fade in 0.2 s and goes at once; none with reduced motion.
- Accessibility: role "status" (an error: "alert"), so a screen reader reads it.

USAGE:
Notice.show({ messageText: "Process completed" });
Notice.show({ messageText: "No internet connection.", descriptionText: "Please, try again later.", type: "warning" });
Notice.show({ messageText: "Failed to copy", type: "error", iconFile: "../assets/icons/alert.png" });
const notice = Notice.show({ messageText: "Saving...", displayTime: 0 }); notice.close();
Notice.close(); // the notice that is seen

Started Date: October 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const NoticeDefaults = {
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    messageText: "No message",
    descriptionText: "", // "": no second line
    type: "info", // "info", "warning", "error", "note", "success"
    iconFile: "", // "": no icon
    allowHtml: 0, // 1: the texts are HTML (only for your own texts)
    displayTime: 2000, // ms; 0: it stays until a click or Escape
    closeOnClick: 1,
    onClose: function (self) {},
    styleName: "classic", // "classic" or a name added to Notice.styles
    style: { // Classic style package
        cover: { color: "rgba(0, 0, 0, 0.2)", zIndex: 50000 }, // WHY: over the dialogs (Dialog, Modal: 4000 and up), under Tooltip (100000)
        message: { round: 8, border: 2, borderColor: "rgba(0, 0, 0, 0.2)", padding: [24, 18], gap: 20, maxWidth: 480, boxShadow: "0px 0px 12px rgba(0, 0, 0, 0.1)" },
        text: { fontSize: 20, textColor: "rgba(0, 0, 0, 0.8)", fontFamily: "opensans" },
        desc: { fontSize: 17, opacity: 0.8 },
        icon: { size: 28, opacity: 0.95 },
        motion: { startScale: 0.9 }, // it grows in from this size
    },
};

const Notice = function (params = {}) {

    // Merge style package: params.style > Notice.styles[styleName] > NoticeDefaults.style
    basic.applyStylePackage(params, Notice.styles, NoticeDefaults);

    // Merge params:
    mergeIntoIfMissing(params, NoticeDefaults);

    // BOX: Component container (the cover of the page)
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    const SHOW_MOTION = "transform 0.2s, opacity 0.2s";
    let isClosed = 0;

    // *** PRIVATE FUNCTIONS:

    const isReducedMotion = function () {
        return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    };

    const setText = function (label, text) {
        if (box.allowHtml == 1) label.text = text;
        else label.plainText = text;
    };

    // It grows in from a little smaller with a fade (at once: no timer of basic.js).
    const showWithMotion = function () {
        if (isReducedMotion()) return;
        const message = box.message;
        message.opacity = 0;
        message.css = { transform: "scale(" + _s.motion.startScale + ")" };
        box.opacity = 0;
        // WHY: the start look must be drawn before the motion is turned on, or it is seen at once
        void message.elem.offsetHeight;
        message.setMotionNow(SHOW_MOTION);
        box.setMotionNow("opacity 0.2s");
        message.opacity = 1;
        message.css = { transform: "none" };
        box.opacity = 1;
    };

    // *** PUBLIC FUNCTIONS:

    // It goes at once.
    box.close = function () {
        if (!box || isClosed) return;
        isClosed = 1;
        if (Notice.current == box) Notice.current = null;
        box.onClose(box);
        box.remove();
    };
    // USAGE: notice.close()

    // REMOVE: the static Notice.current must not keep a removed notice.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {
        if (!box) return;
        if (Notice.current == box) Notice.current = null;
        superRemove.call(box);
        box = null;
    };

    // *** OBJECT VIEW:

    const look = Notice.COLORS[box.type] || Notice.COLORS.info;

    box.color = _s.cover.color;
    box.zIndex = _s.cover.zIndex;
    box.clickable = 1; // WHY: a click on the page under it must not happen while it is seen
    box.role = (box.type == "error") ? "alert" : "status";
    box.aria = { live: (box.type == "error") ? "assertive" : "polite" };

    // GROUP: Page (the message in the middle)
    HGroup({ align: "center", clipContent: 0 });

        // GROUP: Message (an icon, the texts)
        box.message = HGroup({
            hug: 1,
            align: "left center",
            gap: _s.message.gap,
            padding: _s.message.padding,
            color: look.color,
            round: _s.message.round,
            border: _s.message.border,
            borderColor: _s.message.borderColor,
            boxShadow: _s.message.boxShadow,
            css: { maxWidth: "min(" + _s.message.maxWidth + "px, calc(100% - 40px))" },
        });

            if (box.iconFile) {
                // ICON
                box.icon = Icon({ width: _s.icon.size, height: _s.icon.size, opacity: _s.icon.opacity });
                box.icon.load(box.iconFile);
                box.icon.shrink = 0;
            }

            // GROUP: Texts
            VGroup({ hug: 1, align: (box.iconFile ? "left" : "center") + " center", gap: 2 });
            that.css = { minWidth: "0px" };

                // LABEL: Message
                box.lblMessage = Label({ ..._s.text, textColor: look.textColor || _s.text.textColor, textAlign: box.iconFile ? "left" : "center" });
                box.lblMessage.css = { whiteSpace: "normal" };
                setText(box.lblMessage, box.messageText);

                // LABEL: Second line
                box.lblDesc = Label({ ..._s.text, fontSize: _s.desc.fontSize, opacity: _s.desc.opacity, textColor: look.textColor || _s.text.textColor, textAlign: box.iconFile ? "left" : "center" });
                box.lblDesc.css = { whiteSpace: "normal" };
                setText(box.lblDesc, box.descriptionText);
                box.lblDesc.visible = (box.descriptionText !== "" && box.descriptionText !== null && box.descriptionText !== undefined) ? 1 : 0; // (0 is a text too)

            endGroup();

        endGroup();

    endGroup();

    // *** OBJECT INIT CODE:

    if (box.closeOnClick == 1) box.on("click", function () { box.close(); });
    // WHY capture on window: it runs before the Escape of a Dialog (document) under the notice; only the notice closes
    box.listenTo(window, "keydown", function (self, event) {
        if (event.key != "Escape") return;
        event.preventDefault();
        event.stopImmediatePropagation();
        box.close();
    }, true);
    if (box.displayTime > 0) box.after(box.displayTime, function () { box.close(); });

    showWithMotion();

    return endObject(box);

};

// *** STATIC VARIABLES AND FUNCTIONS:

// The colors of the types. textColor: "" -> style.text.textColor
Notice.COLORS = {
    info: { color: "white", textColor: "" },
    warning: { color: "#FFD541", textColor: "#141414" },
    error: { color: "#EE7553", textColor: "#141414" },
    note: { color: "#689BD2", textColor: "white" },
    success: { color: "seagreen", textColor: "white" },
};

Notice.current = null; // The notice that is seen

// Makes a notice on page (the one that is seen goes). Returns it.
Notice.show = function (params = {}) {
    // WHY a loop: the onClose of the old notice may show another one
    while (Notice.current) Notice.close();
    Notice.current = createIn(page, function () { return Notice(params); });
    return Notice.current;
};

// Closes the notice that is seen.
Notice.close = function () {
    if (Notice.current) Notice.current.close();
};

// *** STYLE PACKAGES:
// USAGE: Notice.show({ messageText: "Hi", style: { message: { round: 20, border: 0 } } }) // Change only some keys.
Notice.styles = {
    classic: NoticeDefaults.style,
};
