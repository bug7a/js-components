/* Bismillah */

/*

Tag Input - v26.09

UI COMPONENT TEMPLATE
- A field that holds a list of small "chips" (tags, keywords, e-mail addresses, categories...).
- Type a text and press Enter (or a separator like ",") to add a tag. The tags are shown as chips with a remove (x) button.
- Suggestions: a list of known tags is shown under the field while typing. (ArrowUp / ArrowDown, Enter, mouse)
  allowCustom: 0 -> Only the suggestions can be added (Ex: fixed categories).
- Rules: unique (case-insensitive), maxTags, minLength / maxLength, lowercase, and a custom validate() function.
  A rejected tag shakes the field, shows the reason under it and calls onReject.
- Paste: "audio, guide; sale" is split into tags with the separators.
- Keyboard: Enter / separator adds. Backspace on an empty input selects the last chip, Backspace again removes it.
  ArrowLeft / ArrowRight move between the chips, Delete removes the selected chip. Escape closes the suggestions.
- Counter: "3 / 5" when there is a maxTags limit.
- Accessibility: The chips have role="listitem" and aria-labels, the suggestion list is a listbox.
- Style packages: "classic" (default), "modern", "dark". Select with styleName. (TagInput.styles)
- Everything is drawn with code (no image files needed).

USAGE:
const tags = TagInput({
    width: 320,
    tags: ["audio", "guide"],
    suggestions: ["audio", "fitness", "guide", "sale", "home", "news"],
    maxTags: 5,
    onChange: (self) => println(self.getTags().join(", ")),
});
tags.addTag("sale");            // Returns 1 when added, 0 when rejected. onChange is called.
tags.setTags(["a", "b"], 1);    // silent: onChange is not called
tags.removeTag("a");
TagInput({ allowCustom: 0, suggestions: ["Red", "Green", "Blue"], placeholder: "Pick a color" });
TagInput({ validate: (tag) => (/^\S+@\S+\.\S+$/.test(tag)) ? "" : "Not an e-mail address", placeholder: "Add an e-mail" });
TagInput({ styleName: "dark" });

Started Date: September 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const TagInputDefaults = {
    key: "0",
    width: 320,
    height: "auto",
    tags: [], // ["audio", "guide"]
    suggestions: [], // ["audio", "fitness", ...] Shown while typing. (Tags that are already added are hidden.)
    allowCustom: 1, // 0: Only the suggestions can be added.
    showSuggestionsOnFocus: 0, // 1: The suggestion list opens also when the input is empty.
    maxSuggestions: 8,
    maxTags: 0, // 0: No limit
    minLength: 1,
    maxLength: 32,
    lowercase: 0, // 1: "Audio" -> "audio"
    separators: ",", // Characters that end a tag while typing and when a text is pasted. (Enter always works.)
    placeholder: "Add a tag...",
    emptyText: "No suggestions", // Suggestion list, when the typed text does not match. (allowCustom: 0)
    enabled: 1,
    ariaLabel: "Tags",
    validate: function (tag, self) { return ""; }, // Returns an error text, or "" when the tag is ok.
    onChange: function (self) { }, // self.getTags()
    onAdd: function (self, tag) { },
    onRemove: function (self, tag) { },
    onReject: function (self, tag, reason) { }, // reason: "duplicate", "max", "short", "long", "notAllowed", "invalid" (or the validate() text)
    messages: {
        duplicate: "\"{tag}\" is already added.",
        max: "You can add up to {max} tags.",
        short: "A tag needs at least {min} characters.",
        long: "A tag can have up to {max} characters.",
        notAllowed: "Choose a tag from the list.",
    },
    styleName: "classic", // "classic", "modern", "dark" or a name added to TagInput.styles
    style: { // Classic style package (default)
        field: {
            color: White(1),
            border: 1,
            borderColor: Black(0.2),
            round: 6,
            padding: [8, 6], // [x, y]
            gap: 6,
            minHeight: 44,
        },
        fieldHover: {
            borderColor: Black(0.5),
        },
        fieldFocus: {
            borderColor: "#141414",
        },
        fieldError: {
            borderColor: "#D64545",
        },
        input: {
            fontSize: 15,
            textColor: Black(0.85),
            minWidth: 90,
            height: 28,
        },
        placeholder: {
            textColor: Black(0.4),
        },
        tag: {
            color: Black(0.07),
            border: 0,
            borderColor: "transparent",
            round: 5,
            padding: [8, 0],
            height: 28,
            gap: 4,
        },
        tagHover: {
            color: Black(0.12),
        },
        tagSelected: { // Selected with the keyboard (Backspace, arrows)
            color: "#141414",
            textColor: White(1),
            removeColor: White(0.8),
        },
        tagText: {
            fontSize: 13,
            textColor: Black(0.85),
        },
        tagRemove: {
            color: Black(0.45),
            hoverColor: "#D64545",
        },
        panel: { // Suggestion list
            color: White(1),
            border: 1,
            borderColor: Black(0.12),
            round: 8,
            padding: 4,
            shadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
            maxHeight: 240,
        },
        option: {
            fontSize: 14,
            textColor: Black(0.85),
            round: 5,
            padding: [10, 7],
        },
        optionActive: {
            color: Black(0.06),
        },
        highlight: {
            color: "rgba(255, 196, 0, 0.35)",
        },
        empty: {
            fontSize: 13,
            textColor: Black(0.45),
        },
        message: { // Error text under the field
            fontSize: 12,
            textColor: "#D64545",
        },
        counter: {
            fontSize: 12,
            textColor: Black(0.45),
        },
        disabled: {
            opacity: 0.5,
        },
    }
};

const TagInput = function (params = {}) {

    // Merge style package: params.style > TagInput.styles[styleName] > TagInputDefaults.style (classic)
    const _styleName = params.styleName || TagInputDefaults.styleName;
    const _stylePackage = TagInput.styles[_styleName];
    if (!_stylePackage) console.warn("TagInput: Style package not found: " + _styleName);
    params.style = params.style || {};
    mergeIntoIfMissing(params.style, _stylePackage || {});

    // Merge params:
    mergeIntoIfMissing(params, TagInputDefaults);

    // Edit params, if needed:
    params.color = "transparent";
    const startTags = params.tags;
    params.tags = []; // Filled in the init code with the rules.

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    const id = "tag-input-" + (TagInput._counter++);
    let chips = []; // [{ tag, chip }]
    let selectedIndex = -1; // Chip selected with the keyboard
    let isOpen = 0; // Suggestion list
    let isFocused = 0;
    let filtered = []; // Suggestions in the list
    let rows = []; // Rows in the list
    let activeIndex = -1; // Active suggestion
    let messageTimer = null;
    let errorTimer = null;
    let isRendering = 0;

    // *** PUBLIC VARIABLES:
    // NOTE: Default values are also public variables. (box.tags, box.suggestions, box.maxTags)

    // *** PRIVATE FUNCTIONS:

    const normalize = function (tag) {
        tag = String(tag ?? "").trim().replace(/\s+/g, " ");
        if (box.lowercase == 1) tag = tag.toLocaleLowerCase();
        return tag;
    };

    const isSame = function (a, b) {
        return a.toLocaleLowerCase() === b.toLocaleLowerCase();
    };

    const hasTag = function (tag) {
        return box.tags.some(function (t) { return isSame(t, tag); });
    };

    const format = function (text, values) {
        return String(text).replace(/\{(\w+)\}/g, function (match, key) { return (values[key] !== undefined) ? values[key] : match; });
    };

    // Splits a text with the separators. "a, b;c" -> ["a", "b", "c"]
    const split = function (text) {
        const chars = String(box.separators || "");
        const parts = (chars) ? text.split(new RegExp("[" + chars.replace(/[\]\\^-]/g, "\\$&") + "\\n\\r]")) : [text];
        return parts.map(normalize).filter(Boolean);
    };

    // Returns "" when the tag can be added, or the reject reason.
    const check = function (tag) {
        if (box.maxTags > 0 && box.tags.length >= box.maxTags) return "max";
        if (tag.length < box.minLength) return "short";
        if (box.maxLength > 0 && tag.length > box.maxLength) return "long";
        if (hasTag(tag)) return "duplicate";
        if (box.allowCustom != 1 && !box.suggestions.some(function (s) { return isSame(s, tag); })) return "notAllowed";
        const custom = box.validate(tag, box);
        if (custom) return String(custom);
        return "";
    };

    const getMessage = function (reason, tag) {
        const text = box.messages[reason] || reason; // A custom validate() text is shown as it is.
        return format(text, { tag: tag, max: (reason == "long") ? box.maxLength : box.maxTags, min: box.minLength });
    };

    // Creates objects in a container again. (One group is started and ended in it.)
    // WHY: setDefaultContainerBox() is not in the start/end list of basic.js. With one top-level group, all objects stay in the container.
    const renderInto = function (container, buildContent) {
        if (container.wrapper) container.wrapper.remove();
        const previous = getDefaultContainerBox();
        setDefaultContainerBox(container);
            container.wrapper = VGroup({ width: "100%", height: "auto", align: "left top", gap: 0, position: "relative" });
            container.wrapper.elem.style.alignItems = "stretch";
                buildContent();
            endGroup();
        setDefaultContainerBox(previous);
    };

    const updateFieldBorder = function () {
        if (box.messageLabel.visible == 1) {
            box.field.borderColor = _s.fieldError.borderColor;
        } else if (isFocused) {
            box.field.borderColor = _s.fieldFocus.borderColor;
        } else {
            box.field.borderColor = _s.field.borderColor;
        }
    };

    const updateCounter = function () {
        if (box.maxTags > 0) {
            box.counterLabel.text = box.tags.length + " / " + box.maxTags;
            box.counterLabel.visible = 1;
        } else {
            box.counterLabel.visible = 0;
        }
        box.bottomRow.visible = (box.counterLabel.visible == 1 || box.messageLabel.visible == 1) ? 1 : 0;
    };

    const showMessage = function (text) {
        clearTimeout(messageTimer);
        clearTimeout(errorTimer);
        box.messageLabel.text = TagInput.escapeHtml(text);
        box.messageLabel.visible = 1;
        updateCounter();
        updateFieldBorder();
        // Shake
        box.field.elem.style.animation = "none";
        box.field.elem.offsetWidth; // WHY: Restart the animation.
        box.field.elem.style.animation = "tagInputShake 0.3s";
        errorTimer = setTimeout(function () { if (box) box.field.elem.style.animation = "none"; }, 350);
        messageTimer = setTimeout(hideMessage, 2500);
    };

    const hideMessage = function () {
        clearTimeout(messageTimer);
        if (!box) return;
        box.messageLabel.visible = 0;
        updateCounter();
        updateFieldBorder();
    };

    const updateInputPlaceholder = function () {
        const full = (box.maxTags > 0 && box.tags.length >= box.maxTags);
        box.input.inputElement.placeholder = (full) ? "" : ((box.tags.length) ? "" : box.placeholder);
        box.input.inputElement.setAttribute("aria-label", box.placeholder || box.ariaLabel);
        // WHY: A hidden input can not be focused. It is only small when the field is full.
        box.input.elem.style.flex = (full) ? "0 0 10px" : "1 1 " + _s.input.minWidth + "px";
        box.input.elem.style.minWidth = (full) ? "10px" : _s.input.minWidth + "px";
    };

    const paintChip = function (item, index) {
        const selected = (index === selectedIndex);
        item.chip.color = (selected) ? _s.tagSelected.color : _s.tag.color;
        item.chip.borderColor = (selected) ? _s.tagSelected.color : _s.tag.borderColor;
        item.label.textColor = (selected) ? _s.tagSelected.textColor : _s.tagText.textColor;
        item.remove.text = TagInput.getCloseSvg((selected) ? _s.tagSelected.removeColor : _s.tagRemove.color);
        item.chip.elem.setAttribute("aria-selected", (selected) ? "true" : "false");
    };

    const paintChips = function () {
        chips.forEach(paintChip);
    };

    // Draws the chips in the field. (The input stays at the end.)
    const renderChips = function () {

        if (isRendering) return;
        isRendering = 1;

        chips.forEach(function (item) { item.chip.remove(); });
        chips = [];

        const previous = getDefaultContainerBox();

        box.tags.forEach(function (tag, index) {

            // WHY: setDefaultContainerBox() is not in the start/end list of basic.js. After endGroup() of a chip, the
            //      default container is not the field any more. So it is set again for every chip.
            setDefaultContainerBox(box.field);

            // GROUP: Chip
            const chip = HGroup({
                width: "auto",
                height: _s.tag.height,
                align: "left center",
                gap: _s.tag.gap,
                padding: _s.tag.padding,
                color: _s.tag.color,
                border: _s.tag.border,
                borderColor: _s.tag.borderColor,
                round: _s.tag.round,
                clickable: 1,
            });
            chip.elem.style.flexShrink = "0";
            chip.elem.style.maxWidth = "100%";
            chip.elem.style.transition = "background-color 0.15s";
            chip.elem.setAttribute("role", "listitem");
            chip.elem.setAttribute("aria-label", tag);
            chip.elem.title = tag;

                // LABEL: Tag text
                const label = Label({ text: TagInput.escapeHtml(tag), fontSize: _s.tagText.fontSize, textColor: _s.tagText.textColor });
                label.elem.style.whiteSpace = "nowrap";
                label.elem.style.overflow = "hidden";
                label.elem.style.textOverflow = "ellipsis";
                label.elem.style.minWidth = "0";

                // LABEL: Remove (x)
                const remove = Label({ text: TagInput.getCloseSvg(_s.tagRemove.color), width: 14, height: 14, clickable: 1 });
                remove.elem.style.lineHeight = "0";
                remove.elem.style.flexShrink = "0";
                remove.elem.style.cursor = "pointer";
                remove.elem.style.borderRadius = "3px";
                remove.elem.setAttribute("role", "button");
                remove.elem.setAttribute("aria-label", "Remove " + tag);

            endGroup();

            const item = { tag: tag, chip: chip, label: label, remove: remove };
            chips.push(item);

            // WHY: The order of the chips is fixed, but the input must stay as the last child of the field.
            box.field.elem.insertBefore(chip.elem, box.input.elem);

            chip.on("mouseenter", function () { if (index !== selectedIndex) chip.color = _s.tagHover.color; });
            chip.on("mouseleave", function () { paintChip(item, index); });
            chip.on("click", function (self, event) {
                event.stopPropagation();
                selectedIndex = index;
                paintChips();
                box.input.inputElement.focus({ preventScroll: true });
            });
            remove.on("mouseenter", function () { remove.text = TagInput.getCloseSvg(_s.tagRemove.hoverColor); });
            remove.on("mouseleave", function () { paintChip(item, index); });
            remove.on("click", function (self, event) {
                event.stopPropagation();
                if (box.enabled != 1) return;
                box.removeTag(tag);
                box.input.inputElement.focus({ preventScroll: true });
            });

        });

        setDefaultContainerBox(previous);
        isRendering = 0;

        paintChips();
        updateInputPlaceholder();
        updateCounter();

    };

    const getFilteredSuggestions = function () {
        const text = box.input.text.trim().toLocaleLowerCase();
        const list = box.suggestions.filter(function (s) {
            if (hasTag(s)) return false;
            return (!text) || s.toLocaleLowerCase().includes(text);
        });
        // Suggestions that start with the text come first.
        if (text) list.sort(function (a, b) { return Number(b.toLocaleLowerCase().startsWith(text)) - Number(a.toLocaleLowerCase().startsWith(text)); });
        return list.slice(0, box.maxSuggestions);
    };

    // Label with the typed text highlighted (safe HTML)
    const highlight = function (label) {
        const text = box.input.text.trim();
        const escaped = TagInput.escapeHtml(label);
        if (!text) return escaped;
        const index = label.toLocaleLowerCase().indexOf(text.toLocaleLowerCase());
        if (index < 0) return escaped;
        return TagInput.escapeHtml(label.slice(0, index)) +
            "<mark style='background:" + _s.highlight.color + "; color: inherit; border-radius: 3px'>" + TagInput.escapeHtml(label.slice(index, index + text.length)) + "</mark>" +
            TagInput.escapeHtml(label.slice(index + text.length));
    };

    const paintRows = function () {
        rows.forEach(function (row, index) {
            row.color = (index === activeIndex) ? _s.optionActive.color : "transparent";
            row.elem.setAttribute("aria-selected", (index === activeIndex) ? "true" : "false");
        });
        const active = rows[activeIndex];
        if (active) {
            box.input.inputElement.setAttribute("aria-activedescendant", active.elem.id);
            active.elem.scrollIntoView({ block: "nearest" });
        } else {
            box.input.inputElement.removeAttribute("aria-activedescendant");
        }
    };

    const renderList = function () {

        filtered = getFilteredSuggestions();
        rows = [];
        // WHY: With allowCustom: 0 the first suggestion is active, so Enter adds it. With custom tags, Enter adds the typed text.
        activeIndex = (filtered.length && box.allowCustom != 1) ? 0 : -1;

        renderInto(box.list, function () {

            if (!filtered.length) {
                Label({ text: TagInput.escapeHtml(box.emptyText), fontSize: _s.empty.fontSize, textColor: _s.empty.textColor, padding: [10, 8] });
                return;
            }

            filtered.forEach(function (suggestion, index) {
                const row = HGroup({ width: "100%", height: "auto", align: "left center", padding: _s.option.padding, round: _s.option.round, clickable: 1 });
                row.elem.id = id + "-option-" + index;
                row.elem.setAttribute("role", "option");
                row.elem.style.cursor = "pointer";
                row.elem.style.flexShrink = "0";
                    Label({ text: highlight(suggestion), fontSize: _s.option.fontSize, textColor: _s.option.textColor });
                    that.elem.style.whiteSpace = "nowrap";
                    that.elem.style.overflow = "hidden";
                    that.elem.style.textOverflow = "ellipsis";
                    that.elem.style.maxWidth = "100%";
                endGroup();
                rows.push(row);
                row.on("mouseenter", function () { activeIndex = index; paintRows(); });
                row.on("click", function () {
                    addFromInput(suggestion);
                    box.input.inputElement.focus({ preventScroll: true });
                });
            });

        });

        paintRows();

    };

    const positionPanel = function () {

        const rect = box.field.elem.getBoundingClientRect();
        const space = 4;
        const width = Math.max(withPageZoom(rect.width), 160);

        box.panel.width = width;
        box.list.elem.style.maxHeight = _s.panel.maxHeight + "px";

        const panelHeight = box.panel.elem.offsetHeight;
        const below = page.height - withPageZoom(rect.bottom) - space - 8;
        const above = withPageZoom(rect.top) - space - 8;

        let top = withPageZoom(rect.bottom) + space;
        if (panelHeight > below && above > below) {
            const extra = panelHeight - above;
            if (extra > 0) box.list.elem.style.maxHeight = Math.max(60, _s.panel.maxHeight - extra) + "px";
            top = withPageZoom(rect.top) - box.panel.elem.offsetHeight - space;
        } else if (panelHeight > below) {
            const extra = panelHeight - below;
            box.list.elem.style.maxHeight = Math.max(60, _s.panel.maxHeight - extra) + "px";
        }

        let left = withPageZoom(rect.left);
        left = Math.max(8, Math.min(left, page.width - width - 8));

        box.panel.left = left;
        box.panel.top = Math.max(8, top);

    };

    const openPanel = function () {
        if (box.enabled != 1) return;
        const text = box.input.text.trim();
        // No list when there is nothing to show.
        if (!box.suggestions.length) return closePanel();
        if (!text && box.showSuggestionsOnFocus != 1 && box.allowCustom == 1) return closePanel();
        renderList();
        if (!filtered.length && box.allowCustom == 1) return closePanel(); // Custom tags: an empty list is not useful.
        if (!isOpen) {
            isOpen = 1;
            box.panel.visible = 1;
            box.input.inputElement.setAttribute("aria-expanded", "true");
        }
        positionPanel();
    };

    const closePanel = function () {
        if (!isOpen) return;
        isOpen = 0;
        box.panel.visible = 0;
        activeIndex = -1;
        box.input.inputElement.setAttribute("aria-expanded", "false");
        box.input.inputElement.removeAttribute("aria-activedescendant");
    };

    // Adds the typed text (or a suggestion) and clears the input.
    const addFromInput = function (text) {
        const value = (text !== undefined) ? text : box.input.text;
        const parts = split(value);
        if (!parts.length) {
            box.input.text = "";
            closePanel();
            return;
        }
        let added = 0;
        parts.forEach(function (part) { if (addOne(part, 0, 1)) added++; });
        box.input.text = "";
        if (added) box.onChange(box);
        closePanel();
        if (box.showSuggestionsOnFocus == 1 || box.allowCustom != 1) openPanel();
    };

    // Adds one tag. Returns 1 when added.
    // silent: 1 -> onChange is not called. skipChange: 1 -> The caller calls onChange (for many tags at once).
    const addOne = function (tag, silent, skipChange) {
        tag = normalize(tag);
        const reason = check(tag);
        if (reason) {
            if (!silent) {
                showMessage(getMessage(reason, tag));
                box.onReject(box, tag, reason);
            }
            return 0;
        }
        box.tags.push(tag);
        selectedIndex = -1;
        renderChips();
        hideMessage();
        if (!silent) {
            box.onAdd(box, tag);
            if (!skipChange) box.onChange(box);
        }
        return 1;
    };

    const onKeyDown = function (self, event) {

        if (box.enabled != 1) return;
        const key = event.key;
        const text = box.input.text;
        const cursorAtStart = (box.input.inputElement.selectionStart === 0 && box.input.inputElement.selectionEnd === 0);

        // Separator characters add the tag. (Ex: ",")
        if (key.length === 1 && String(box.separators || "").includes(key)) {
            event.preventDefault();
            addFromInput();
            return;
        }

        switch (key) {
            case "Enter":
                event.preventDefault();
                if (isOpen && activeIndex >= 0 && filtered[activeIndex] !== undefined) {
                    addFromInput(filtered[activeIndex]);
                } else if (text.trim()) {
                    addFromInput();
                } else {
                    closePanel();
                }
                break;
            case "ArrowDown":
                if (!isOpen) { openPanel(); if (isOpen && activeIndex < 0 && rows.length) { activeIndex = 0; paintRows(); } event.preventDefault(); break; }
                event.preventDefault();
                activeIndex = (rows.length) ? (activeIndex + 1) % rows.length : -1;
                paintRows();
                break;
            case "ArrowUp":
                if (!isOpen) break;
                event.preventDefault();
                activeIndex = (rows.length) ? (activeIndex - 1 + rows.length) % rows.length : -1;
                paintRows();
                break;
            case "Escape":
                if (isOpen) { event.preventDefault(); closePanel(); }
                else if (selectedIndex >= 0) { selectedIndex = -1; paintChips(); }
                break;
            case "Backspace":
                if (text) break;
                event.preventDefault();
                if (selectedIndex >= 0) {
                    box.removeTag(box.tags[selectedIndex]);
                } else if (box.tags.length) {
                    selectedIndex = box.tags.length - 1; // First press: select the last chip
                    paintChips();
                }
                break;
            case "Delete":
                if (text || selectedIndex < 0) break;
                event.preventDefault();
                box.removeTag(box.tags[selectedIndex]);
                break;
            case "ArrowLeft":
                if (!cursorAtStart || !box.tags.length) break;
                event.preventDefault();
                selectedIndex = (selectedIndex < 0) ? box.tags.length - 1 : Math.max(0, selectedIndex - 1);
                paintChips();
                break;
            case "ArrowRight":
                if (selectedIndex < 0) break;
                event.preventDefault();
                selectedIndex = (selectedIndex >= box.tags.length - 1) ? -1 : selectedIndex + 1;
                paintChips();
                break;
            case "Tab":
                // Typed text becomes a tag when the focus leaves with Tab. (allowCustom: 1)
                if (text.trim() && box.allowCustom == 1) addFromInput();
                closePanel();
                break;
            default:
                if (selectedIndex >= 0 && key.length === 1) { selectedIndex = -1; paintChips(); }
        }

    };

    const onPaste = function (event) {
        if (box.enabled != 1) return;
        const text = (event.clipboardData || window.clipboardData).getData("text");
        if (split(text).length <= 1) return; // One tag: Normal paste into the input.
        event.preventDefault();
        addFromInput(box.input.text + text);
    };

    const onPageResize = function () {
        if (isOpen) positionPanel();
    };

    // WHY: The panel is on the page, not in the scrolled container. It must follow the field.
    const onAnyScroll = function (event) {
        if (!isOpen || event.target === box.list.elem) return;
        positionPanel();
    };

    const onDocumentPointerDown = function (event) {
        if (!box) return;
        if (box.elem.contains(event.target) || box.panel.elem.contains(event.target)) return;
        closePanel();
    };

    // *** PUBLIC FUNCTIONS:

    box.getTags = function () {
        return box.tags.slice();
    };
    // USAGE: tagInput.getTags() // ["audio", "guide"]

    box.addTag = function (tag, silent = 0) {
        return addOne(tag, silent, 0);
    };
    // USAGE: tagInput.addTag("sale") // 1: added, 0: rejected (the reason is shown under the field)

    box.removeTag = function (tag, silent = 0) {
        const index = box.tags.findIndex(function (t) { return isSame(t, String(tag)); });
        if (index < 0) return 0;
        const removed = box.tags.splice(index, 1)[0];
        selectedIndex = -1;
        renderChips();
        if (isOpen) renderList(); // The removed tag can be a suggestion again.
        if (!silent) {
            box.onRemove(box, removed);
            box.onChange(box);
        }
        return 1;
    };
    // USAGE: tagInput.removeTag("sale")

    // Replaces all tags. The rules (unique, maxTags, validate...) are applied without messages.
    box.setTags = function (tags, silent = 0) {
        box.tags = [];
        (tags || []).forEach(function (tag) { addOne(tag, 1, 1); });
        selectedIndex = -1;
        renderChips();
        hideMessage();
        if (isOpen) renderList();
        if (!silent) box.onChange(box);
    };
    // USAGE: tagInput.setTags(["audio", "guide"]) // setTags([...], 1): onChange is not called

    box.clear = function (silent = 0) {
        box.setTags([], silent);
    };

    box.setSuggestions = function (suggestions) {
        box.suggestions = (suggestions || []).map(normalize).filter(Boolean);
        if (isOpen) openPanel();
    };
    // USAGE: tagInput.setSuggestions(["a", "b"])

    box.setEnabled = function (enabled) {
        box.enabled = (enabled == 1 || enabled === true) ? 1 : 0;
        box.input.inputElement.disabled = (box.enabled != 1);
        box.elem.style.opacity = (box.enabled == 1) ? "1" : String(_s.disabled.opacity);
        box.elem.style.pointerEvents = (box.enabled == 1) ? "" : "none";
        if (box.enabled != 1) closePanel();
    };
    // USAGE: get: tagInput.enabled, set: tagInput.setEnabled(0)

    box.setPlaceholder = function (text) {
        box.placeholder = text;
        updateInputPlaceholder();
    };

    box.setMaxTags = function (max) {
        box.maxTags = Math.max(0, Number(max) || 0);
        updateInputPlaceholder();
        updateCounter();
    };

    box.focus = function () {
        box.input.inputElement.focus({ preventScroll: true });
    };

    box.blur = function () {
        box.input.inputElement.blur();
    };

    box.destroy = function () {
        clearTimeout(messageTimer);
        clearTimeout(errorTimer);
        page.remove_onResize(onPageResize);
        document.removeEventListener("pointerdown", onDocumentPointerDown, true);
        document.removeEventListener("scroll", onAnyScroll, true);
        box.input.inputElement.removeEventListener("paste", onPaste);
        box.panel.remove(); // Created on the page
        box.remove(); // NOTE: It will clean all events like box.on("click"
        box = null;
    };

    // *** OBJECT VIEW:
    TagInput.injectCss();
    box.elem.style.setProperty("--tag-input-placeholder", _s.placeholder.textColor);

    // GROUP: Field and bottom row
    box.contentBox = VGroup({
        width: "100%",
        height: "auto",
        align: "left top",
        gap: 4,
        position: "relative",
    });

        // GROUP: Field (chips + input). Wraps to new lines.
        box.field = HGroup({
            width: "100%",
            height: "auto",
            align: "left center",
            gap: _s.field.gap,
            padding: _s.field.padding,
            color: _s.field.color,
            border: _s.field.border,
            borderColor: _s.field.borderColor,
            round: _s.field.round,
            clickable: 1,
        });
        box.field.elem.style.flexWrap = "wrap";
        box.field.elem.style.minHeight = _s.field.minHeight + "px";
        box.field.elem.style.cursor = "text";
        box.field.elem.style.transition = "border-color 0.15s";
        box.field.elem.setAttribute("role", "list");
        box.field.elem.setAttribute("aria-label", box.ariaLabel);

            // INPUT: Typing area. (The chips are inserted before it.)
            box.input = Input({ width: "auto", height: _s.input.height, minimal: 1, color: "transparent", fontSize: _s.input.fontSize, textColor: _s.input.textColor });
            box.input.elem.classList.add("tag-input-input");
            box.input.inputElement.style.padding = "0px";
            box.input.inputElement.style.height = "100%";
            box.input.inputElement.style.width = "100%";
            box.input.inputElement.setAttribute("autocomplete", "off");
            box.input.inputElement.setAttribute("role", "combobox");
            box.input.inputElement.setAttribute("aria-autocomplete", "list");
            box.input.inputElement.setAttribute("aria-expanded", "false");
            box.input.inputElement.setAttribute("aria-controls", id + "-list");
            box.input.inputElement.maxLength = (box.maxLength > 0) ? box.maxLength + 8 : 524288; // WHY: A little longer, so the "long" message can be shown.

        endGroup();

        // GROUP: Bottom row (message, counter)
        box.bottomRow = HGroup({ width: "100%", height: "auto", align: "left center", gap: 10 });

            // LABEL: Message (reject reason)
            box.messageLabel = Label({ text: "", fontSize: _s.message.fontSize, textColor: _s.message.textColor, visible: 0 });
            box.messageLabel.elem.style.flex = "1 1 auto";
            box.messageLabel.elem.style.minWidth = "0";
            box.messageLabel.elem.setAttribute("role", "alert");

            // LABEL: Counter "3 / 5"
            box.counterLabel = Label({ text: "", fontSize: _s.counter.fontSize, textColor: _s.counter.textColor, visible: 0 });
            box.counterLabel.elem.style.marginLeft = "auto";
            box.counterLabel.elem.style.whiteSpace = "nowrap";

        endGroup();

    endGroup();

    // POPUP: Suggestion list, on the page over everything.
    setDefaultContainerBox(page);
    // NOTE: endGroup() of the panel below returns the default container to the component box.

    // GROUP: Panel
    box.panel = VGroup({
        width: 200,
        height: "auto",
        align: "left top",
        gap: 0,
        color: _s.panel.color,
        border: _s.panel.border,
        borderColor: _s.panel.borderColor,
        round: _s.panel.round,
        padding: _s.panel.padding,
        clickable: 1,
    });
    // WHY: visible: 0 at create time makes the children absolute (not flex items). Hide it after the children are added.
    box.panel.elem.style.alignItems = "stretch";
    box.panel.elem.style.boxShadow = _s.panel.shadow;
    box.panel.elem.style.zIndex = "1001";

        // BOX: List (scrolls)
        box.list = Box({ width: "100%", height: "auto", color: "transparent", scrollY: 1, position: "relative" });
        box.list.elem.id = id + "-list";
        box.list.elem.setAttribute("role", "listbox");
        box.list.elem.style.overscrollBehavior = "contain";

    endGroup();
    box.panel.visible = 0;

    // *** OBJECT INIT CODE:

    box.field.on("click", function () {
        if (box.enabled != 1) return;
        selectedIndex = -1;
        paintChips();
        box.input.inputElement.focus({ preventScroll: true });
    });
    box.field.on("mouseenter", function () { if (!isFocused && box.messageLabel.visible != 1) box.field.borderColor = _s.fieldHover.borderColor; });
    box.field.on("mouseleave", function () { updateFieldBorder(); });

    box.input.inputElement.addEventListener("focus", function () {
        isFocused = 1;
        updateFieldBorder();
        if (box.showSuggestionsOnFocus == 1 || box.allowCustom != 1) openPanel();
    });
    box.input.inputElement.addEventListener("blur", function () {
        isFocused = 0;
        selectedIndex = -1;
        paintChips();
        updateFieldBorder();
    });
    box.input.inputElement.addEventListener("input", function () {
        if (selectedIndex >= 0) { selectedIndex = -1; paintChips(); }
        openPanel();
    });
    box.input.inputElement.addEventListener("keydown", function (event) { onKeyDown(box, event); });
    box.input.inputElement.addEventListener("paste", onPaste);

    // WHY: Keep the keyboard focus in the input when a suggestion is pressed.
    box.panel.on("mousedown", function (self, event) { event.preventDefault(); });

    document.addEventListener("pointerdown", onDocumentPointerDown, true);
    document.addEventListener("scroll", onAnyScroll, true);
    page.onResize(onPageResize);

    box.suggestions = (box.suggestions || []).map(normalize).filter(Boolean);
    box.maxTags = Math.max(0, Number(box.maxTags) || 0);
    (startTags || []).forEach(function (tag) { addOne(tag, 1, 1); });
    renderChips();
    box.setEnabled(box.enabled);

    return endObject(box);

};

// *** STATIC VARIABLES AND FUNCTIONS:

TagInput._counter = 1;

// WHY: Label.text uses innerHTML. Texts must not be read as HTML.
TagInput.escapeHtml = function (text) {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
};

TagInput.getCloseSvg = function (color) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
};

// Placeholder color and the shake animation can not be set with inline styles.
TagInput.injectCss = function () {
    if (document.getElementById("tag-input-css")) return;
    const style = document.createElement("style");
    style.id = "tag-input-css";
    style.textContent =
        ".tag-input-input input::placeholder { color: var(--tag-input-placeholder, rgba(0,0,0,0.4)); opacity: 1; }" +
        ".tag-input-input input { pointer-events: auto; user-select: text; -webkit-user-select: text; }" +
        "@keyframes tagInputShake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }";
    document.head.appendChild(style);
};

// *** STYLE PACKAGES:
// USAGE: TagInput({ styleName: "modern" })
// USAGE: TagInput({ styleName: "dark", style: { tag: { color: "#3D7A6B" } } }) // Change only some keys.
// NOTE: A new package needs only the keys that differ from the default (classic) style.
// USAGE: TagInput.styles.myStyle = { tag: { color: "gold" } };
TagInput.styles = {

    // Gray chips in a white field.
    classic: TagInputDefaults.style,

    // Round cadetblue chips, same colors as the modern CheckBox, RadioButton and ProgressBar.
    modern: {
        field: { color: White(1), border: 1, borderColor: "#D9DADB", round: 10, padding: [8, 6], gap: 6, minHeight: 46 },
        fieldHover: { borderColor: "#A9B8B9" },
        fieldFocus: { borderColor: "cadetblue" },
        fieldError: { borderColor: "tomato" },
        input: { fontSize: 15, textColor: Black(0.85), minWidth: 90, height: 30 },
        placeholder: { textColor: Black(0.4) },
        tag: { color: "#DFECEC", border: 0, borderColor: "transparent", round: 100, padding: [10, 0], height: 30, gap: 5 },
        tagHover: { color: "#CFE2E2" },
        tagSelected: { color: "cadetblue", textColor: White(1), removeColor: White(0.85) },
        tagText: { fontSize: 13, textColor: "#2F5F61" },
        tagRemove: { color: "#5F9EA0", hoverColor: "tomato" },
        panel: { color: White(1), border: 1, borderColor: "#D9DADB", round: 10, padding: 4, shadow: "0 8px 24px rgba(0, 0, 0, 0.10)", maxHeight: 240 },
        option: { fontSize: 14, textColor: Black(0.85), round: 6, padding: [10, 7] },
        optionActive: { color: "#EEF5F5" },
        highlight: { color: "#DFECEC" },
        empty: { fontSize: 13, textColor: Black(0.45) },
        message: { fontSize: 12, textColor: "tomato" },
        counter: { fontSize: 12, textColor: "cadetblue" },
        disabled: { opacity: 0.5 },
    },

    // Dark theme, same colors as SelectBox.DARK_STYLE.
    dark: {
        field: { color: "#232322", border: 1, borderColor: "rgba(255, 255, 255, 0.10)", round: 8, padding: [8, 6], gap: 6, minHeight: 44 },
        fieldHover: { borderColor: "rgba(255, 255, 255, 0.30)" },
        fieldFocus: { borderColor: "#65A293" },
        fieldError: { borderColor: "#E66767" },
        input: { fontSize: 15, textColor: "rgba(255, 255, 255, 0.90)", minWidth: 90, height: 28 },
        placeholder: { textColor: "rgba(255, 255, 255, 0.40)" },
        tag: { color: "rgba(255, 255, 255, 0.10)", border: 0, borderColor: "transparent", round: 5, padding: [8, 0], height: 28, gap: 4 },
        tagHover: { color: "rgba(255, 255, 255, 0.16)" },
        tagSelected: { color: "#3D7A6B", textColor: "#FFFFFF", removeColor: "rgba(255, 255, 255, 0.8)" },
        tagText: { fontSize: 13, textColor: "rgba(255, 255, 255, 0.90)" },
        tagRemove: { color: "rgba(255, 255, 255, 0.50)", hoverColor: "#E66767" },
        panel: { color: "#232322", border: 1, borderColor: "rgba(255, 255, 255, 0.12)", round: 10, padding: 4, shadow: "0 8px 24px rgba(0, 0, 0, 0.5)", maxHeight: 240 },
        option: { fontSize: 14, textColor: "rgba(255, 255, 255, 0.85)", round: 6, padding: [10, 7] },
        optionActive: { color: "rgba(255, 255, 255, 0.08)" },
        highlight: { color: "rgba(101, 162, 147, 0.45)" },
        empty: { fontSize: 13, textColor: "rgba(255, 255, 255, 0.45)" },
        message: { fontSize: 12, textColor: "#E66767" },
        counter: { fontSize: 12, textColor: "rgba(255, 255, 255, 0.45)" },
        disabled: { opacity: 0.4 },
    },

};
