/* Bismillah */

/*

File Picker - v26.11

UI COMPONENT TEMPLATE
- A drop zone: drag and drop files, or click (Enter/Space) to open the file dialog.
- Shows the selected files as a list (image preview, name, size, remove button).
- Supports: multiple, accept (type filter), maxSize, maxFiles, directory selection, enabled.
- A low zone (zoneHeight): what does not fit is hidden: first the icon, then the hint, then the description. The title stays.
- Everything is drawn with code (no image files needed). iconSvg: an svg icon of your own (it takes the colors of the
  style); iconFile: a picture (a png, jpg or svg file, a data: address) in its place (it keeps its own colors).
- animated: 1 (off by default): the icon lifts a little under the mouse, and lifts and grows while a file is dragged
  over the zone. Only transform changes. Off when the system asks for reduced motion.
- Style packages: "light" (default; the old name "classic" works too), "dark", "minimal", "minimalDark". Select with styleName. (FilePicker.styles)

IMPORTANT: About the file path
- Browsers do NOT give the real disk path of a file (security rule).
  You get: name, size, type, lastModified and the File object (to read or upload the file).
- In folder selection (directory: 1), "path" is the relative path in the folder. (Ex: "photos/2026/a.jpg")
- In desktop environments (Electron), "path" is the real disk path when the environment provides it. The row shows the
  name; its bubble shows the path.
- A program that has the file dialog of its system and real paths (the Python library):
  onOpenDialog: function (self) {} opens its dialog in the place of the dialog of the page, and it gives what was chosen to
  addFiles([{ name, path, size, type, lastModified, previewAddress }]): plain objects, not File objects.
  previewAddress: a picture for the list (a plain object has no blob to make one from).
  getFileDetails(): the files without their File objects, for a program that keeps them as text.

Started Date: September 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const FilePickerDefaults = {
    key: "0",
    width: 360,
    height: "auto",
    zoneHeight: 170,
    multiple: 0, // 1: Select more than one file. New files are added to the list.
    directory: 0, // 1: Select a folder (all files in it). Click only, not drag.
    accept: "", // Ex: "image/*", ".pdf,.docx", "image/png,image/jpeg"
    maxSize: 0, // Bytes. 0: No limit. Ex: 5 * 1024 * 1024 (5 MB)
    maxFiles: 0, // 0: No limit (only for multiple: 1)
    enabled: 1,
    showIcon: 1, // 0: Hide the upload icon. (A zone too low for it hides it by itself.)
    iconSvg: "", // An "<svg" text of your own, drawn with currentColor. Empty: the icon of the style (box.setIconSvg())
    iconFile: "", // A picture of your own (a path or a data: address) in the place of the icon, with its own colors (box.setIcon())
    animated: 0, // 1: the icon lifts under the mouse, and more while a file is dragged over. (box.setAnimated(0/1))
    showList: 1,
    showPreview: 1, // Image thumbnails in the list.
    preventPageDrop: 1, // 1: A file dropped outside the zone does not open in the browser tab.
    titleText: "Drag and drop a file here",
    descriptionText: "or click to select",
    hintText: "", // Empty: created from accept and maxSize
    dropText: "Drop to add",
    allowHtml: 0, // 1: titleText, descriptionText and dropText are HTML (only for your own texts)
    onChange: function (self) { }, // self.files: [{ file, name, displayName, path, size, sizeText, type, extension, lastModified }]
    onError: function (self, errors) { }, // errors: [{ type: "accept" | "maxSize" | "maxFiles", name, message }]
    onOpenDialog: null, // function (self): the dialog of a program, in the place of the dialog of the page (see above)
    styleName: "light", // "light" ("classic": its old name), "dark", "minimal", "minimalDark" or a name added to FilePicker.styles
    style: {
        zone: {
            color: White(1),
            border: 2,
            borderColor: Black(0.2),
            round: 10,
        },
        zoneHover: {
            color: "#FAFAFA",
            borderColor: Black(0.4),
        },
        zoneDragOver: {
            color: "#EEF4FF",
            borderColor: "#3871E0",
        },
        icon: {
            size: 40,
            space: 6, // px under the icon, more than the gap of the zone
            svg: "", // the upload icon of the look, drawn with currentColor. "": FilePicker.UPLOAD_ICON
            color: Black(0.45),
            dragOverColor: "#3871E0",
        },
        title: {
            fontSize: 16,
            textColor: Black(0.8),
            fontFamily: "opensans-bold",
        },
        desc: {
            fontSize: 14,
            textColor: Black(0.5),
        },
        hint: {
            fontSize: 12,
            textColor: Black(0.4),
        },
        item: {
            height: 52,
            color: White(1),
            border: 1,
            borderColor: Black(0.1),
            round: 8,
        },
        itemName: {
            fontSize: 14,
            textColor: Black(0.85),
        },
        itemSize: {
            fontSize: 12,
            textColor: Black(0.45),
        },
        badge: {
            color: Black(0.06),
            textColor: Black(0.6),
            round: 6,
        },
        removeButton: {
            textColor: Black(0.45),
            hoverColor: "#FE5D49",
        },
        disabled: {
            opacity: 0.4,
        },
    }
};

const FilePicker = function (params = {}) {

    // Merge style package: params.style > FilePicker.styles[styleName] > FilePickerDefaults.style (light)
    basic.applyStylePackage(params, FilePicker.styles, FilePickerDefaults);

    // Merge params:
    mergeIntoIfMissing(params, FilePickerDefaults);

    // Edit params, if needed:
    params.color = "transparent";
    params.height = "auto";

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    let dragCounter = 0; // WHY: dragenter/dragleave also fire for inner elements.
    let isMouseOver = 0;
    let rows = [];
    let previewUrls = [];
    const ZONE_MOTION = "background-color 0.15s, border-color 0.15s";
    const MOTION_TIME = "0.25s";
    const MOTION_EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";
    const HOVER_ICON_LIFT = 2; // px
    const HOVER_ICON_GROW = 1.04;
    const DROP_ICON_LIFT = 5; // px
    const DROP_ICON_GROW = 1.08;
    let wasAnimated = 0;
    const ZONE_GAP = 4; // Between the parts of the zone
    const ZONE_MIN_SPACE = 4; // At least this much over and under the parts of the zone
    const HINT_SPACE = 4; // More space over the hint
    const ROW_GAP = 10; // Space between the thumbnail, the texts and the remove button
    const THUMB_INSET = 16; // The thumbnail is this much smaller than the row height
    const BADGE_MAX_LETTERS = 4; // "JPEG", "DOCX"

    // *** PUBLIC VARIABLES:
    // [var] Selected files: [{ file, name, displayName, path, size, sizeText, type, extension, lastModified }]
    box.files = [];
    // [var] "normal", "hover", "dragover"
    box.state = "normal";

    // *** PRIVATE FUNCTIONS:

    const setText = function (label, text) {
        const value = (text === undefined || text === null) ? "" : String(text);
        if (box.allowHtml == 1) label.text = value;
        else label.plainText = value;
    };

    // The parts the zone can lose, first the one it needs least. (The title always stays.)
    const getOptionalParts = function () {
        const parts = [];
        if (box.showIcon == 1) parts.push({ object: box.icon, extra: _s.icon.space });
        if (box.hint.text) parts.push({ object: box.hint, extra: HINT_SPACE });
        if (box.descriptionText) parts.push({ object: box.desc, extra: 0 });
        return parts;
    };

    // WHY measured: the height of a text depends on its lines, and those on the width of the zone.
    const fitZoneContent = function () {
        const parts = getOptionalParts();
        parts.forEach((part) => { part.object.visible = 1; });
        const room = box.zone.elem.clientHeight - (ZONE_MIN_SPACE * 2);
        if (room <= 0) return; // Not drawn yet: box.zone.onResize comes back.
        let used = box.title.elem.offsetHeight;
        parts.forEach((part) => { used += part.object.elem.offsetHeight + part.extra + ZONE_GAP; });
        parts.forEach(function (part) {
            if (used <= room) return;
            used -= part.object.elem.offsetHeight + part.extra + ZONE_GAP;
            part.object.visible = 0;
        });
    };

    const getExtension = function (name) {
        const index = name.lastIndexOf(".");
        return (index > 0) ? name.slice(index + 1).toLowerCase() : "";
    };

    const createFileInfo = function (file) {
        return {
            file: file,
            name: file.name,
            // WHY not the path: a real disk path does not fit in a row; the relative path of a folder says where it is.
            displayName: file.webkitRelativePath || file.name,
            // WHY: Browsers do not give the real path. Electron may give it with file.path.
            path: file.path || file.webkitRelativePath || file.name,
            size: file.size,
            sizeText: FilePicker.formatSize(file.size),
            type: file.type || "",
            extension: getExtension(file.name),
            lastModified: file.lastModified,
        };
    };

    const isSameFile = function (a, b) {
        return a.name == b.name && a.size == b.size && a.lastModified == b.lastModified && a.path == b.path;
    };

    // Checks a file with the accept list. Ex: "image/*,.pdf"
    const isAccepted = function (file) {

        if (!box.accept) return true;

        const name = file.name.toLowerCase();
        const type = (file.type || "").toLowerCase();

        return box.accept.split(",").some(function (rule) {
            rule = rule.trim().toLowerCase();
            if (!rule) return false;
            if (rule.charAt(0) == ".") return name.endsWith(rule);
            if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));
            return type == rule;
        });

    };

    const createHintText = function () {
        if (box.hintText) return box.hintText;
        const parts = [];
        if (box.accept) {
            const rules = box.accept.split(",").map(function (rule) { return rule.trim(); });
            parts.push(rules.join(", "));
        }
        if (box.maxSize) parts.push("max " + FilePicker.formatSize(box.maxSize));
        if (box.multiple == 1 && box.maxFiles) parts.push(box.maxFiles + " files");
        return parts.join(" • ");
    };

    // WHY: A user who asked the system for less motion gets the still icon.
    const isMotionOn = function () {
        if (box.animated != 1) return false;
        const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        return !reduceMotion;
    };

    const getIconTransform = function () {
        if (box.state == "dragover") return "translateY(-" + DROP_ICON_LIFT + "px) scale(" + DROP_ICON_GROW + ")";
        if (box.state == "hover") return "translateY(-" + HOVER_ICON_LIFT + "px) scale(" + HOVER_ICON_GROW + ")";
        return "none";
    };

    // The look of the state. (Nothing when animated is off.)
    const paintMotion = function () {
        if (!isMotionOn()) return;
        box.icon.css.transform = getIconTransform();
    };

    // The transition, or the still look of animated: 0.
    const applyAnimated = function () {
        if (!isMotionOn()) {
            if (wasAnimated) {
                wasAnimated = 0;
                box.icon.setMotion("");
                box.icon.css.transform = "";
            }
            return;
        }
        wasAnimated = 1;
        box.icon.setMotion("transform " + MOTION_TIME + " " + MOTION_EASE);
        paintMotion();
    };

    const setState = function (state) {

        box.state = state;

        let zoneStyle = _s.zone;
        if (state == "hover") zoneStyle = _s.zoneHover;
        if (state == "dragover") zoneStyle = _s.zoneDragOver;

        box.zone.color = zoneStyle.color;
        box.zone.borderColor = zoneStyle.borderColor;

        const iconColor = (state == "dragover") ? _s.icon.dragOverColor : _s.icon.color;
        box.icon.textColor = iconColor;
        paintMotion();

        setText(box.title, (state == "dragover") ? box.dropText : box.titleText);

    };

    // The upload icon: a picture of the page (iconFile), or an "<svg" text drawn with currentColor.
    const applyIcon = function () {
        if (!box.iconFile) {
            box.icon.elem.innerHTML = box.iconSvg || _s.icon.svg || FilePicker.UPLOAD_ICON;
            return;
        }
        // WHY an element, not an <img> text: a path or a data: address may hold quotes
        const picture = document.createElement("img");
        picture.src = box.iconFile;
        picture.alt = "";
        box.icon.elem.replaceChildren(picture);
    };

    const paintEnabled = function () {
        const isEnabled = (box.enabled == 1);
        box.opacity = (isEnabled) ? 1 : _s.disabled.opacity;
        box.zone.cursor = (isEnabled) ? "pointer" : "default";
        box.zone.tabIndex = (isEnabled) ? 0 : -1;
        box.zone.aria = { disabled: (isEnabled) ? "false" : "true" };
        box.input.disabled = !isEnabled;
    };

    const revokePreviews = function () {
        previewUrls.forEach(function (url) { URL.revokeObjectURL(url); });
        previewUrls = [];
    };

    const removeRows = function () {
        rows.forEach(function (row) { row.remove(); });
        rows = [];
        revokePreviews();
    };

    // The address of a picture for the list. "": none (a plain object of a program without a previewAddress).
    const getPreviewAddress = function (info) {
        if (info.file.previewAddress) return info.file.previewAddress;
        if (!(info.file instanceof Blob)) return "";
        const url = URL.createObjectURL(info.file);
        previewUrls.push(url);
        return url;
    };

    // ICON: Image preview, or LABEL: extension badge
    const createThumbnail = function (info) {

        const thumbSize = _s.item.height - THUMB_INSET;
        const isImage = (box.showPreview == 1 && info.type.startsWith("image/"));
        const previewAddress = (isImage) ? getPreviewAddress(info) : "";

        if (previewAddress) {
            const icoPreview = Icon({ width: thumbSize, height: thumbSize, round: _s.badge.round });
            icoPreview.css.objectFit = "cover";
            icoPreview.shrink = 0;
            icoPreview.load(previewAddress);
            return;
        }

        const lblBadge = Label({
            width: thumbSize,
            height: thumbSize,
            text: (info.extension || "file").slice(0, BADGE_MAX_LETTERS).toUpperCase(),
            textAlign: "center",
            fontSize: 10,
            fontFamily: "opensans-bold",
            color: _s.badge.color,
            textColor: _s.badge.textColor,
            round: _s.badge.round,
        });
        lblBadge.lineHeight = thumbSize; // WHY: The text in the middle (a number is px).
        lblBadge.shrink = 0;

    };

    const createRemoveButton = function (index) {

        const btnRemove = Label({
            width: 28,
            height: 28,
            text: "×",
            textAlign: "center",
            fontSize: 20,
            round: 100,
            textColor: _s.removeButton.textColor,
        });
        btnRemove.lineHeight = "26px";
        btnRemove.cursor = "pointer";
        btnRemove.shrink = 0;
        btnRemove.elem.title = "Remove";

        btnRemove.on("mouseover", function () {
            btnRemove.textColor = _s.removeButton.hoverColor;
        });
        btnRemove.on("mouseout", function () {
            btnRemove.textColor = _s.removeButton.textColor;
        });
        btnRemove.on("click", function () {
            if (box.enabled != 1) return;
            box.removeFile(index);
        });

    };

    const createRow = function (info, index) {

        // GROUP: Row
        const row = HGroup({
            width: "100%",
            height: _s.item.height,
            align: "left center",
            gap: ROW_GAP,
            padding: [ROW_GAP, 0],
            color: _s.item.color,
            border: _s.item.border,
            borderColor: _s.item.borderColor,
            round: _s.item.round,
        });
        row.clickable = 1;
        row.elem.title = info.path; // Full name on mouse over

            createThumbnail(info);

            // GROUP: Name, size
            const grpTexts = VGroup({
                width: "auto",
                height: "auto",
                align: "left center",
            });
            grpTexts.css = { flex: "1 1 0", minWidth: "0" };

                // LABEL: Name
                const lblName = Label({
                    width: "100%",
                    plainText: info.displayName,
                    ..._s.itemName,
                });
                lblName.css = { whiteSpace: "nowrap", textOverflow: "ellipsis" };

                // LABEL: Size and type
                const typeText = (info.type) ? " • " + info.type : "";
                const lblSize = Label({
                    plainText: info.sizeText + typeText,
                    ..._s.itemSize,
                });
                lblSize.css.whiteSpace = "nowrap";

            endGroup();

            createRemoveButton(index);

        endGroup();

        return row;

    };

    const renderList = function () {

        removeRows();

        box.list.visible = (box.showList == 1 && box.files.length > 0) ? 1 : 0;
        if (box.showList != 1) return;

        createIn(box.list, function () {
            box.files.forEach(function (info, index) {
                rows.push(createRow(info, index));
            });
        });

    };

    const createError = function (type, name, message) {
        return { type: type, name: name, message: message };
    };

    // The files that pass accept and maxSize. The others go to errors.
    const readValidFiles = function (fileList, errors) {

        const validFiles = [];

        Array.from(fileList).forEach(function (file) {

            if (!isAccepted(file)) {
                errors.push(createError("accept", file.name, file.name + ": file type is not allowed."));
                return;
            }
            if (box.maxSize && file.size > box.maxSize) {
                const message = file.name + ": larger than " + FilePicker.formatSize(box.maxSize) + ".";
                errors.push(createError("maxSize", file.name, message));
                return;
            }
            validFiles.push(createFileInfo(file));

        });

        return validFiles;

    };

    // Returns how many files were added.
    const addToList = function (newFiles, errors) {

        let addedCount = 0;
        newFiles.forEach(function (info) {

            const isInList = box.files.some(function (listed) { return isSameFile(listed, info); });
            if (isInList) return;

            if (box.maxFiles && box.files.length >= box.maxFiles) {
                errors.push(createError("maxFiles", info.name, info.name + ": maximum " + box.maxFiles + " files."));
                return;
            }
            box.files.push(info);
            addedCount++;

        });
        return addedCount;

    };

    // Add files from the dialog or drop.
    const addFiles = function (fileList) {

        if (box.enabled != 1) return;

        const errors = [];
        let newFiles = readValidFiles(fileList, errors);

        let addedCount = 0;
        // WHY directory too: a folder is many files; directory: 1 without multiple: 1 kept only the first file of the
        //     folder and said "Only one file can be selected." (sample 3 of file-picker.htm)
        const isMultiple = (box.multiple == 1 || box.directory == 1);
        if (!isMultiple) {
            if (newFiles.length > 1) {
                errors.push(createError("maxFiles", "", "Only one file can be selected."));
            }
            newFiles = newFiles.slice(0, 1);
            if (newFiles.length) box.files = newFiles;
            addedCount = newFiles.length;
        } else {
            // WHY the count: a file that was already in the list (or over maxFiles) called onChange with the same list
            addedCount = addToList(newFiles, errors);
        }

        if (addedCount) {
            renderList();
            box.onChange(box);
        }

        if (errors.length) box.onError(box, errors);

    };

    const onPageDragOver = function (self, event) {
        event.preventDefault();
    };

    // *** PUBLIC FUNCTIONS:

    // Open the file dialog.
    box.open = function () {
        if (box.enabled != 1) return;
        if (typeof box.onOpenDialog === "function") {
            box.onOpenDialog(box);
            return;
        }
        box.input.value = ""; // WHY: The same file can be selected again.
        box.input.click();
    };
    // NOTE: Browsers open the dialog only after a user action (click, key).

    box.getFiles = function () {
        return box.files.slice();
    };

    box.getFileDetails = function () {
        return box.files.map(function (info) {
            const details = Object.assign({}, info);
            delete details.file;
            return details;
        });
    };

    // silent: 1 -> onChange is not called.
    box.removeFile = function (index, silent = 0) {
        if (index < 0 || index >= box.files.length) return;
        box.files.splice(index, 1);
        renderList();
        if (!silent) box.onChange(box);
    };

    box.clear = function (silent = 0) {
        if (box.files.length == 0) return;
        box.files = [];
        renderList();
        if (!silent) box.onChange(box);
    };

    // Add files with code. (Ex: from a paste event)
    box.addFiles = function (fileList) {
        addFiles(fileList);
    };

    box.setAnimated = function (value) {
        box.animated = (value == 1) ? 1 : 0;
        applyAnimated();
    };

    // An "<svg" text drawn with currentColor. Empty: the upload icon of the style. (An iconFile is shown over it.)
    box.setIconSvg = function (svgText) {
        box.iconSvg = svgText || "";
        applyIcon();
    };

    // A picture of your own (a path or a data: address) in the place of the icon. Empty: the svg icon.
    box.setIcon = function (file) {
        box.iconFile = file || "";
        applyIcon();
    };
    // USAGE: filePicker.setIcon("../assets/icons/upload.png")

    box.setEnabled = function (enabled) {
        box.enabled = basic.isOn(enabled) ? 1 : 0;
        paintEnabled();
    };
    // USAGE: get: selectFile.enabled, set: selectFile.setEnabled(0)

    box.setTitleText = function (text) {
        box.titleText = text;
        if (box.state != "dragover") setText(box.title, text);
        fitZoneContent();
    };

    box.setDescriptionText = function (text) {
        box.descriptionText = text;
        setText(box.desc, text);
        fitZoneContent();
    };

    box.refresh = function () {
        paintEnabled();
        renderList();
    };

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {

        if (!box) return; // WHY: remove() can be called twice (also by the parent's remove()).
        revokePreviews();

        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.
        box = null;

    };

    // *** OBJECT VIEW:

    // GROUP: Component content (zone, list)
    box.content = VGroup({
        width: "100%",
        height: "auto",
        align: "left top",
        gap: 10,
        position: "relative", // WHY: Component height is "auto". A relative group makes the container wrap it.
    });

        // GROUP: Drop zone
        box.zone = VGroup({
            width: "100%",
            height: box.zoneHeight,
            align: "center",
            gap: ZONE_GAP,
            padding: [16, ZONE_MIN_SPACE],
            color: _s.zone.color,
            border: _s.zone.border,
            borderColor: _s.zone.borderColor,
            round: _s.zone.round,
        });
        box.zone.css = { borderStyle: "dashed", outline: "none" };
        box.zone.role = "button";
        box.zone.setMotion(ZONE_MOTION);

            // BOX: Upload icon (a cloud and an arrow, drawn with currentColor)
            box.icon = Box({
                width: _s.icon.size,
                height: _s.icon.size,
                color: "transparent",
                textColor: _s.icon.color,
                shrink: 0,
            });
            box.icon.css.marginBottom = _s.icon.space + "px";
            box.icon.clipContent = 0;
            // WHY: an svg of the page may come without a size of its own.
            basic.addCss("file-picker-icon", ".file-picker-icon svg, .file-picker-icon img { display: block; width: 100%; height: 100%; object-fit: contain; }");
            box.icon.elem.classList.add("file-picker-icon");
            applyIcon();

            if (box.showIcon != 1) box.icon.visible = 0;

            // LABEL: Title
            box.title = Label({
                textAlign: "center",
                shrink: 0,
                ..._s.title,
            });
            setText(box.title, box.titleText);

            // LABEL: Description
            box.desc = Label({
                textAlign: "center",
                shrink: 0,
                ..._s.desc,
            });
            setText(box.desc, box.descriptionText);

            // LABEL: Hint (accept, max size)
            box.hint = Label({
                plainText: createHintText(),
                textAlign: "center",
                shrink: 0,
                ..._s.hint,
            });
            box.hint.css.marginTop = HINT_SPACE + "px";
            if (!box.hint.text) box.hint.visible = 0;

        endGroup();

        // GROUP: File list (created by renderList)
        box.list = VGroup({
            width: "100%",
            height: "auto",
            align: "left top",
            gap: 6,
        });

        endGroup();

    endGroup();

    // INPUT: Hidden file input (native file dialog)
    box.input = document.createElement("input");
    box.input.type = "file";
    box.input.style.display = "none";
    if (box.multiple == 1 || box.directory == 1) box.input.multiple = true;
    if (box.accept) box.input.accept = box.accept;
    if (box.directory == 1) box.input.webkitdirectory = true;
    box.elem.appendChild(box.input);

    // *** OBJECT INIT CODE:
    box.zone.onResize(fitZoneContent);
    fitZoneContent();

    box.input.addEventListener("change", function () {
        addFiles(box.input.files);
        box.input.value = "";
    });
    // NOTE: box.remove() removes the input element too, so its event is cleaned with it.

    box.zone.on("click", function () {
        box.open();
    });

    box.zone.on("keydown", function (self, event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        box.open();
    });

    box.zone.on("mouseover", function () {
        isMouseOver = 1;
        if (box.enabled != 1 || box.state == "dragover") return;
        setState("hover");
    });

    box.zone.on("mouseout", function () {
        isMouseOver = 0;
        if (box.state != "dragover") setState("normal");
    });

    box.zone.on("dragenter", function (self, event) {
        event.preventDefault();
        if (box.enabled != 1) return;
        dragCounter++;
        setState("dragover");
    });

    box.zone.on("dragover", function (self, event) {
        event.preventDefault(); // WHY: Required to allow drop.
        if (event.dataTransfer) event.dataTransfer.dropEffect = (box.enabled == 1) ? "copy" : "none";
    });

    box.zone.on("dragleave", function (self, event) {
        dragCounter = Math.max(0, dragCounter - 1);
        if (dragCounter == 0) setState((isMouseOver) ? "hover" : "normal");
    });

    box.zone.on("drop", function (self, event) {
        event.preventDefault();
        dragCounter = 0;
        setState("normal");
        if (box.enabled != 1 || !event.dataTransfer) return;
        // NOTE: A dropped folder can not be read as a file list. Use directory: 1 with click.
        addFiles(event.dataTransfer.files);
    });

    if (box.preventPageDrop == 1) {
        box.listenTo(window, "dragover", onPageDragOver); // (removed with the box)
        box.listenTo(window, "drop", onPageDragOver);
    }

    box.enabled = basic.isOn(box.enabled) ? 1 : 0;
    applyAnimated();
    setState("normal");
    paintEnabled();
    renderList();

    return endObject(box);

};

// *** STYLE PACKAGES:

// USAGE: FilePicker.styles.myStyle = { zone: { round: 14 } };
FilePicker.styles = {

    // White, dark text, a dashed line.
    light: FilePickerDefaults.style,

    // Dark theme, same colors as ColorPicker "dark".
    dark: {
        zone: { color: "#232322", borderColor: "rgba(255, 255, 255, 0.22)" },
        zoneHover: { color: "#2A2A29", borderColor: "rgba(255, 255, 255, 0.40)" },
        zoneDragOver: { color: "#26332F", borderColor: "#65A293" },
        icon: { color: "rgba(255, 255, 255, 0.55)", dragOverColor: "#65A293" },
        title: { textColor: "rgba(255, 255, 255, 0.90)" },
        desc: { textColor: "rgba(255, 255, 255, 0.55)" },
        hint: { textColor: "rgba(255, 255, 255, 0.40)" },
        item: { color: "#232322", borderColor: "rgba(255, 255, 255, 0.12)" },
        itemName: { textColor: "rgba(255, 255, 255, 0.90)" },
        itemSize: { textColor: "rgba(255, 255, 255, 0.50)" },
        badge: { color: "rgba(255, 255, 255, 0.10)", textColor: "rgba(255, 255, 255, 0.70)" },
        removeButton: { textColor: "rgba(255, 255, 255, 0.55)" },
    },

};
FilePicker.styles.classic = FilePicker.styles.light; // the old name of light: the pages made with it keep their look

// *** STATIC FUNCTIONS:

// The upload icon: a cloud open at the bottom, an arrow going up through it.
FilePicker.UPLOAD_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="2.5 2.5 19 19" fill="none"'
    + ' stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display:block">'
    + '<path d="M8.5 18H7a4 4 0 0 1-.5-7.97A6 6 0 0 1 17.6 9a4.6 4.6 0 0 1-.6 9h-1.5"/>'
    + '<path d="M12 20.5V12M9 15l3-3 3 3"/></svg>';

// The upload icon of the minimal theme (_designs/minimal-theme.htm), drawn as its other icons: a 24 px grid, lines 2
// wide with round ends. The head of the arrow is in the cloud.
FilePicker.MINIMAL_UPLOAD_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none"'
    + ' stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block">'
    + '<path d="M7 18a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 9.5a4 4 0 0 1-1 8.5"/>'
    + '<path d="M12 12v8M9 15l3-3 3 3"/></svg>';

// 1536 -> "1.5 KB"
FilePicker.formatSize = function (bytes) {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    const value = bytes / Math.pow(1024, index);
    if (index == 0) return value + " " + units[index];
    const decimals = (value < 10) ? 1 : 0;
    return value.toFixed(decimals) + " " + units[index];
};
// USAGE: FilePicker.formatSize(5 * 1024 * 1024) -> "5.0 MB"

// WHY: Label.text uses innerHTML. File names must not be read as HTML.
FilePicker.escapeHtml = basic.escapeHtml; // (the name is kept: other code may use it)

// The minimal theme (_designs/minimal-theme.htm): a lower zone (120 px) with no fill and a dashed line of 3:1 at least
// (it is a control: a click chooses a file), darker under the mouse and ink while a file is dragged over it; a 28 px
// line icon of its own; 13 px texts; the rows of the files with a soft line. minimalDark: the same on a dark window.
FilePicker.createMinimalStyle = function (colors) {
    return {
        zoneHeight: 120,
        style: {
            zone: { color: "transparent", border: 1, borderColor: colors.edge, round: 4 },
            zoneHover: { color: "transparent", borderColor: colors.edgeHover },
            zoneDragOver: { color: colors.hover, borderColor: colors.ink },
            icon: { size: 28, space: 0, svg: FilePicker.MINIMAL_UPLOAD_ICON, color: colors.softText, dragOverColor: colors.ink },
            title: { fontSize: 13, textColor: colors.text, fontFamily: "opensans-bold" },
            desc: { fontSize: 12, textColor: colors.softText },
            hint: { fontSize: 11, textColor: colors.softText },
            item: { height: 42, color: "transparent", border: 1, borderColor: colors.line, round: 4 }, // WHY 42: room for the two lines of texts
            itemName: { fontSize: 13, textColor: colors.text },
            itemSize: { fontSize: 11, textColor: colors.softText },
            badge: { color: "transparent", textColor: colors.softText, round: 3 },
            removeButton: { textColor: colors.softText, hoverColor: colors.danger },
            disabled: { opacity: 0.4 },
        },
    };
};
FilePicker.MINIMAL_COLORS = { text: Black(0.85), softText: Black(0.55), line: Black(0.2), edge: Black(0.45), edgeHover: Black(0.65), ink: "#1F1F1F", hover: Black(0.04), danger: "#C24A36" };
FilePicker.styles.minimal = FilePicker.createMinimalStyle(FilePicker.MINIMAL_COLORS);
FilePicker.MINIMAL_DARK_COLORS = { text: White(0.88), softText: White(0.55), line: White(0.18), edge: White(0.42), edgeHover: White(0.62), ink: "#EDEDEB", hover: White(0.06), danger: "#FF9F93" };
FilePicker.styles.minimalDark = FilePicker.createMinimalStyle(FilePicker.MINIMAL_DARK_COLORS);
