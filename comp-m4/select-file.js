/* Bismillah */

/*

Select File - v26.09

UI COMPONENT TEMPLATE
- A drop zone: drag and drop files, or click (Enter/Space) to open the file dialog.
- Shows the selected files as a list (image preview, name, size, remove button).
- Supports: multiple, accept (type filter), maxSize, maxFiles, directory selection, enabled.
- Everything is drawn with code (no image files needed).

IMPORTANT: About the file path
- Browsers do NOT give the real disk path of a file (security rule).
  You get: name, size, type, lastModified and the File object (to read or upload the file).
- In folder selection (directory: 1), "path" is the relative path in the folder. (Ex: "photos/2026/a.jpg")
- In desktop environments (Electron), "path" is the real disk path when the environment provides it.

Started Date: September 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const SelectFileDefaults = {
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
    showIcon: 1, // 0: Hide the upload icon (for small zones)
    showList: 1,
    showPreview: 1, // Image thumbnails in the list.
    preventPageDrop: 1, // 1: A file dropped outside the zone does not open in the browser tab.
    titleText: "Drag and drop a file here",
    descText: "or click to select",
    hintText: "", // Empty: created from accept and maxSize
    dropText: "Drop to add",
    onChange: function (self) { }, // self.files: [{ file, name, path, size, sizeText, type, extension, lastModified }]
    onError: function (self, errors) { }, // errors: [{ type: "accept" | "maxSize" | "maxFiles", name, message }]
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

const SelectFile = function (params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, SelectFileDefaults);

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

    // *** PUBLIC VARIABLES:
    // [var] Selected files: [{ file, name, path, size, sizeText, type, extension, lastModified }]
    box.files = [];
    // [var] "normal", "hover", "dragover"
    box.state = "normal";

    // *** PRIVATE FUNCTIONS:

    // Create objects inside a container, after the component is created.
    const createIn = function (container, func) {
        const previous = getDefaultContainerBox();
        setDefaultContainerBox(container);
        func();
        setDefaultContainerBox(previous);
    };

    const getExtension = function (name) {
        const index = name.lastIndexOf(".");
        return (index > 0) ? name.slice(index + 1).toLowerCase() : "";
    };

    const createFileInfo = function (file) {
        return {
            file: file,
            name: file.name,
            // WHY: Browsers do not give the real path. Electron may give it with file.path.
            path: file.path || file.webkitRelativePath || file.name,
            size: file.size,
            sizeText: SelectFile.formatSize(file.size),
            type: file.type,
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
        if (box.accept) parts.push(box.accept.split(",").map(function (r) { return r.trim(); }).join(", "));
        if (box.maxSize) parts.push("max " + SelectFile.formatSize(box.maxSize));
        if (box.multiple == 1 && box.maxFiles) parts.push(box.maxFiles + " files");
        return parts.join(" • ");
    };

    const setState = function (state) {

        box.state = state;

        let zoneStyle = _s.zone;
        if (state == "hover") zoneStyle = _s.zoneHover;
        if (state == "dragover") zoneStyle = _s.zoneDragOver;

        box.zone.color = zoneStyle.color;
        box.zone.borderColor = zoneStyle.borderColor;

        const iconColor = (state == "dragover") ? _s.icon.dragOverColor : _s.icon.color;
        box.iconArrow.color = iconColor;
        box.iconHead.elem.style.borderColor = iconColor;
        box.iconTray.elem.style.borderColor = iconColor;

        box.title.text = (state == "dragover") ? box.dropText : box.titleText;

    };

    const updateView = function () {
        box.opacity = (box.enabled == 1) ? 1 : _s.disabled.opacity;
        box.zone.elem.style.cursor = (box.enabled == 1) ? "pointer" : "default";
        box.zone.elem.tabIndex = (box.enabled == 1) ? 0 : -1;
        box.zone.elem.setAttribute("aria-disabled", (box.enabled == 1) ? "false" : "true");
        box.input.disabled = (box.enabled != 1);
    };

    const revokePreviews = function () {
        previewUrls.forEach(function (url) { URL.revokeObjectURL(url); });
        previewUrls = [];
    };

    const renderList = function () {

        rows.forEach(function (row) { row.remove(); });
        rows = [];
        revokePreviews();

        box.list.visible = (box.showList == 1 && box.files.length > 0) ? 1 : 0;
        if (box.showList != 1) return;

        createIn(box.list, function () {

            box.files.forEach(function (info, index) {

                // GROUP: Row
                const row = HGroup({
                    width: "100%",
                    height: _s.item.height,
                    align: "left center",
                    gap: 10,
                    padding: [10, 0],
                    color: _s.item.color,
                    border: _s.item.border,
                    borderColor: _s.item.borderColor,
                    round: _s.item.round,
                });
                row.clickable = 1;
                row.elem.title = info.path; // Full name on mouse over

                    // ICON: Image preview or extension badge
                    const thumbSize = _s.item.height - 16;
                    if (box.showPreview == 1 && info.type.startsWith("image/")) {
                        const url = URL.createObjectURL(info.file);
                        previewUrls.push(url);
                        Icon({ width: thumbSize, height: thumbSize, round: _s.badge.round });
                        that.elem.style.objectFit = "cover";
                        that.elem.style.flexShrink = "0";
                        that.load(url);
                    } else {
                        Label({
                            width: thumbSize,
                            height: thumbSize,
                            text: (info.extension || "file").slice(0, 4).toUpperCase(),
                            textAlign: "center",
                            fontSize: 10,
                            fontFamily: "opensans-bold",
                            color: _s.badge.color,
                            textColor: _s.badge.textColor,
                            round: _s.badge.round,
                        });
                        that.elem.style.lineHeight = thumbSize + "px";
                        that.elem.style.flexShrink = "0";
                    }

                    // GROUP: Name, size
                    VGroup({
                        width: "auto",
                        height: "auto",
                        align: "left center",
                    });
                    that.elem.style.flex = "1 1 0";
                    that.elem.style.minWidth = "0";

                        Label({
                            width: "100%",
                            text: SelectFile.escapeHtml(info.path),
                            ..._s.itemName,
                        });
                        that.elem.style.whiteSpace = "nowrap";
                        that.elem.style.textOverflow = "ellipsis";

                        Label({
                            text: info.sizeText + ((info.type) ? " • " + SelectFile.escapeHtml(info.type) : ""),
                            ..._s.itemSize,
                        });
                        that.elem.style.whiteSpace = "nowrap";

                    endGroup();

                    // LABEL: Remove button
                    const btnRemove = Label({
                        width: 28,
                        height: 28,
                        text: "×",
                        textAlign: "center",
                        fontSize: 20,
                        round: 100,
                        textColor: _s.removeButton.textColor,
                    });
                    btnRemove.elem.style.lineHeight = "26px";
                    btnRemove.elem.style.cursor = "pointer";
                    btnRemove.elem.style.flexShrink = "0";
                    btnRemove.elem.title = "Remove";
                    btnRemove.on("mouseover", function () { btnRemove.textColor = _s.removeButton.hoverColor; });
                    btnRemove.on("mouseout", function () { btnRemove.textColor = _s.removeButton.textColor; });
                    btnRemove.on("click", function () {
                        if (box.enabled == 1) box.removeFile(index);
                    });

                endGroup();

                rows.push(row);

            });

        });

    };

    // Add files from the dialog or drop.
    const addFiles = function (fileList) {

        if (box.enabled != 1) return;

        const errors = [];
        let newFiles = [];

        Array.from(fileList).forEach(function (file) {

            if (!isAccepted(file)) {
                errors.push({ type: "accept", name: file.name, message: file.name + ": file type is not allowed." });
                return;
            }
            if (box.maxSize && file.size > box.maxSize) {
                errors.push({ type: "maxSize", name: file.name, message: file.name + ": larger than " + SelectFile.formatSize(box.maxSize) + "." });
                return;
            }
            newFiles.push(createFileInfo(file));

        });

        if (box.multiple != 1) {
            if (newFiles.length > 1) {
                errors.push({ type: "maxFiles", name: "", message: "Only one file can be selected." });
            }
            newFiles = newFiles.slice(0, 1);
            if (newFiles.length) box.files = newFiles;
        } else {
            newFiles.forEach(function (info) {
                if (box.files.some(function (f) { return isSameFile(f, info); })) return; // Already in the list
                if (box.maxFiles && box.files.length >= box.maxFiles) {
                    errors.push({ type: "maxFiles", name: info.name, message: info.name + ": maximum " + box.maxFiles + " files." });
                    return;
                }
                box.files.push(info);
            });
        }

        if (newFiles.length) {
            renderList();
            box.onChange(box);
        }

        if (errors.length) box.onError(box, errors);

    };

    const onPageDragOver = function (event) {
        event.preventDefault();
    };

    // *** PUBLIC FUNCTIONS:

    // Open the file dialog.
    box.open = function () {
        if (box.enabled != 1) return;
        box.input.value = ""; // WHY: The same file can be selected again.
        box.input.click();
    };
    // NOTE: Browsers open the dialog only after a user action (click, key).

    box.getFiles = function () {
        return box.files.slice();
    };

    box.removeFile = function (index) {
        if (index < 0 || index >= box.files.length) return;
        box.files.splice(index, 1);
        renderList();
        box.onChange(box);
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

    box.setEnabled = function (enabled) {
        box.enabled = (enabled == 1 || enabled === true) ? 1 : 0;
        updateView();
    };
    // USAGE: get: selectFile.enabled, set: selectFile.setEnabled(0)

    box.setTitleText = function (text) {
        box.titleText = text;
        if (box.state != "dragover") box.title.text = text;
    };

    box.setDescText = function (text) {
        box.descText = text;
        box.desc.text = text;
    };

    box.refresh = function () {
        updateView();
        renderList();
    };

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {

        if (!box) return; // WHY: remove() can be called twice (also by the parent's remove()).
        revokePreviews();

        if (box.preventPageDrop == 1) {
            window.removeEventListener("dragover", onPageDragOver);
            window.removeEventListener("drop", onPageDragOver);
        }

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
            gap: 4,
            padding: 16,
            color: _s.zone.color,
            border: _s.zone.border,
            borderColor: _s.zone.borderColor,
            round: _s.zone.round,
        });
        box.zone.elem.style.borderStyle = "dashed";
        box.zone.elem.style.outline = "none";
        box.zone.elem.setAttribute("role", "button");
        box.zone.setMotion("background-color 0.15s, border-color 0.15s");

            // BOX: Upload icon (tray + arrow, drawn)
            box.icon = startBox({
                width: 40,
                height: 40,
                color: "transparent",
            });
            box.icon.elem.style.marginBottom = "6px";
            box.icon.clipContent = 0;

                // Arrow head
                box.iconHead = Box({ left: 12, top: 4, width: 16, height: 16, color: "transparent" });
                that.elem.style.borderLeft = "3px solid";
                that.elem.style.borderTop = "3px solid";
                that.elem.style.transform = "rotate(45deg)";

                // Arrow body
                box.iconArrow = Box({ left: 18.5, top: 6, width: 3, height: 22, color: _s.icon.color, round: 2 });

                // Tray
                box.iconTray = Box({ left: 2, top: 22, width: 36, height: 14, color: "transparent" });
                that.elem.style.border = "3px solid";
                that.elem.style.borderTop = "none";
                that.elem.style.borderRadius = "0 0 6px 6px";

            endBox();
            if (box.showIcon != 1) box.icon.visible = 0;

            // LABEL: Title
            box.title = Label({
                text: box.titleText,
                textAlign: "center",
                ..._s.title,
            });

            // LABEL: Description
            box.desc = Label({
                text: box.descText,
                textAlign: "center",
                ..._s.desc,
            });

            // LABEL: Hint (accept, max size)
            box.hint = Label({
                text: SelectFile.escapeHtml(createHintText()),
                textAlign: "center",
                ..._s.hint,
            });
            box.hint.elem.style.marginTop = "4px";
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

    box.input.addEventListener("change", function () {
        addFiles(box.input.files);
        box.input.value = "";
    });
    // NOTE: box.remove() removes the input element too, so its event is cleaned with it.

    box.zone.on("click", function () {
        box.open();
    });

    box.zone.on("keydown", function (self, event) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            box.open();
        }
    });

    box.zone.on("mouseover", function () {
        isMouseOver = 1;
        if (box.enabled == 1 && box.state != "dragover") setState("hover");
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
        window.addEventListener("dragover", onPageDragOver);
        window.addEventListener("drop", onPageDragOver);
    }

    box.enabled = (box.enabled == 1 || box.enabled === true) ? 1 : 0;
    setState("normal");
    updateView();
    renderList();

    return endObject(box);

};

// *** STATIC FUNCTIONS:

// 1536 -> "1.5 KB"
SelectFile.formatSize = function (bytes) {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    const value = bytes / Math.pow(1024, index);
    return ((index == 0) ? value : value.toFixed((value < 10) ? 1 : 0)) + " " + units[index];
};
// USAGE: SelectFile.formatSize(5 * 1024 * 1024) -> "5.0 MB"

// WHY: Label.text uses innerHTML. File names must not be read as HTML.
SelectFile.escapeHtml = function (text) {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
};
