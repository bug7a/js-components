/* Bismillah */

/*
OLD NAMES: where the pages still use the old names of the components (the bridge of basic.keepOldNames).

    node test/old-names.js                          every folder but comp/, basic/ and test/
    node test/old-names.js 04-templates/web-forms   a folder or a file (more than one: each of them)
    node test/old-names.js --short                  only the count of each file

The old names come from comp/: the Comp.OLD_NAMES lists (also an entry { name: "new", wrap: ... }), the
Comp.OLD_NAMES_BY_HAND lists (an old method the component keeps by itself) and the old component names
(const InputB = TextField;).
It prints each line with an old name, the new name and the component; at the end the count of each folder.
A name with a capital letter (inputValue, getInputValue) is counted as a key (inputValue:) or after a dot
(field.inputValue); a plain word (title, message, hover) only as a key in a call of its component.
WHY: a plain word is everywhere (the title of an item of a list); only the call tells whose it is.
A key in a call of a component that has a param of that name is not counted (the placeholderText of a WebView),
nor a name after an object with a capital letter that is not a component (BasicDesigner.onDragMove).
A name another component has today (onSelect of SmartTable) is shown with "?" and counted apart, unless it is a key in
a call of the component (TinySelect({ onSelect: ... })): the object before a dot is not known.
A line it shows may still be another thing with the same name (the inputValue in the JSON of a Form): read it.
*/

"use strict";

const fs = require("fs");
const path = require("path");
const chrome = require("./_chrome.js");
const { ROOT, readGitLines } = chrome;

const SKIPPED_FOLDERS = ["comp/", "basic/", "test/"]; // WHY test/: its tests use the old names on purpose
const PAGE_ENDINGS = [".htm", ".html", ".js"];
const MAX_CALL_LENGTH = 20000; // letters: the arguments of a call are not read further

// *** THE OLD NAMES OF comp/:

// The keys and values of a list written as `Comp.LIST = { old: "new", old2: { name: "new2", wrap: ... } };`
const readList = function (text, componentName, listName) {
    const head = componentName + "." + listName + " = {";
    const start = text.indexOf(head);
    if (start === -1) return [];
    const open = start + head.length - 1;
    // WHY the matching brace: a wrap function in the list has its own "};"
    const mask = maskStrings(text);
    let depth = 0;
    let end = open;
    for (let i = open; i < text.length; i++) {
        if (mask[i]) continue;
        if (text[i] === "{") depth++;
        if (text[i] === "}") depth--;
        if (depth === 0) { end = i; break; }
    }
    const body = text.slice(open, end);
    const pairs = [];
    const pairPattern = /^\s*([A-Za-z_$][\w$]*)\s*:\s*(?:"([^"]*)"|\{\s*name:\s*"([^"]*)")/gm;
    let match;
    while ((match = pairPattern.exec(body))) {
        pairs.push({ oldName: match[1], newName: match[2] || match[3] });
    }
    return pairs;
};

const readOldNames = function () {
    const names = [];
    const componentFiles = fs.readdirSync(path.join(ROOT, "comp")).filter(function (name) { return name.endsWith(".js"); });
    componentFiles.forEach(function (fileName) {
        const text = fs.readFileSync(path.join(ROOT, "comp", fileName), "utf8");
        const componentPattern = /^([A-Z][\w$]*)\.OLD_NAMES(?:_BY_HAND)? = \{/gm;
        const components = new Set();
        let match;
        while ((match = componentPattern.exec(text))) components.add(match[1]);
        components.forEach(function (componentName) {
            readList(text, componentName, "OLD_NAMES").forEach(function (pair) {
                names.push({ component: componentName, oldName: pair.oldName, newName: pair.newName, isComponent: false });
            });
            readList(text, componentName, "OLD_NAMES_BY_HAND").forEach(function (pair) {
                names.push({ component: componentName, oldName: pair.oldName, newName: pair.newName, isComponent: false });
            });
        });
        const aliasPattern = /^const ([A-Z][\w$]*) = ([A-Z][\w$]*);$/gm;
        while ((match = aliasPattern.exec(text))) {
            names.push({ component: match[2], oldName: match[1], newName: match[2], isComponent: true });
        }
    });
    return names;
};

// The params of each component today (the keys of its XxxDefaults)
const readOwnParams = function () {
    const paramsByComponent = new Map();
    const componentFiles = fs.readdirSync(path.join(ROOT, "comp")).filter(function (name) { return name.endsWith(".js"); });
    componentFiles.forEach(function (fileName) {
        const text = fs.readFileSync(path.join(ROOT, "comp", fileName), "utf8");
        const defaultsPattern = /^const ([A-Z][\w$]*)Defaults\s*=\s*\{/gm;
        let match;
        while ((match = defaultsPattern.exec(text))) {
            paramsByComponent.set(match[1], readTopKeys(text, match.index + match[0].length));
        }
    });
    return paramsByComponent;
};

// The keys of the first level of an object literal that starts after its "{"
const readTopKeys = function (text, start) {
    const keys = new Set();
    const mask = maskStrings(text);
    let depth = 1;
    let lineStart = true;
    for (let i = start; i < text.length && depth > 0; i++) {
        if (mask[i]) continue;
        const letter = text[i];
        if ("{[(".indexOf(letter) !== -1) depth++;
        else if ("}])".indexOf(letter) !== -1) depth--;
        if (depth === 1 && (lineStart || letter === "," || letter === "{")) {
            const key = /^[\s,{]*([A-Za-z_$][\w$]*)\s*:/.exec(text.slice(i, i + 80));
            if (key) keys.add(key[1]);
        }
        lineStart = (letter === "\n");
    }
    return keys;
};

// *** ONE FILE:

// 1 for each letter inside a string or a line comment: the brackets there do not count
const maskStrings = function (text) {
    const mask = new Uint8Array(text.length);
    let quote = "";
    for (let i = 0; i < text.length; i++) {
        const letter = text[i];
        if (quote) {
            // WHY not masked: the end of a line comment is the start of the next line (a key there is read)
            if (quote === "//" && letter === "\n") { quote = ""; continue; }
            // WHY: a quote of the HTML of a page ("don't") is no string of the code; a string of " or ' ends with its line
            if ((quote === "\"" || quote === "'") && letter === "\n") { quote = ""; continue; }
            mask[i] = 1;
            if (letter === "\\") { mask[i + 1] = 1; i++; }
            else if (letter === quote) quote = "";
            continue;
        }
        if (letter === "/" && text[i + 1] === "/" && text[i - 1] !== ":") { quote = "//"; mask[i] = 1; continue; }
        if (letter === "\"" || letter === "'" || letter === "`") { quote = letter; mask[i] = 1; }
    }
    return mask;
};

// The name before the "(" of the call that holds the place: "WebView" in WebView({ ... }), "Toast" in Toast.show({ ... })
const enclosingCallName = function (text, mask, index) {
    let depth = 0;
    for (let i = index - 1; i >= 0; i--) {
        if (mask[i]) continue;
        const letter = text[i];
        if (")}]".indexOf(letter) !== -1) depth++;
        else if ("({[".indexOf(letter) !== -1) {
            if (depth > 0) { depth--; continue; }
            if (letter !== "(") continue;
            const name = /([A-Za-z_$][\w$.]*)\s*$/.exec(text.slice(Math.max(0, i - 80), i));
            return name ? name[1].split(".")[0] : "";
        }
    }
    return "";
};

const isPlainWord = function (name) {
    return name === name.toLowerCase();
};

// The text of the arguments of the call that starts at the "(" at openIndex (strings are skipped).
const readCallArguments = function (text, openIndex) {
    let depth = 0;
    let quote = "";
    const end = Math.min(text.length, openIndex + MAX_CALL_LENGTH);
    for (let i = openIndex; i < end; i++) {
        const letter = text[i];
        if (quote) {
            if (letter === "\\") i++;
            else if (letter === quote) quote = "";
            continue;
        }
        if (letter === "\"" || letter === "'" || letter === "`") quote = letter;
        else if (letter === "(") depth++;
        else if (letter === ")") {
            depth--;
            if (depth === 0) return { start: openIndex, end: i };
        }
    }
    return { start: openIndex, end: end };
};

const lineNumberAt = function (text, index) {
    return text.slice(0, index).split("\n").length;
};

// The places of a plain word as a key inside the calls of its component: TinySelect({ title: ... }), Toast.show({ ... })
const findKeysInCalls = function (text, entry, callNames) {
    const places = [];
    const callPattern = new RegExp("(?<![\\w$.])(" + callNames.join("|") + ")(\\.[\\w$]+)?\\s*\\(", "g");
    const keyPattern = new RegExp("(?<![\\w$.])" + entry.oldName + "\\s*:", "g");
    let call;
    const mask = maskStrings(text);
    while ((call = callPattern.exec(text))) {
        const range = readCallArguments(text, call.index + call[0].length - 1);
        const argumentsText = text.slice(range.start, range.end);
        let key;
        keyPattern.lastIndex = 0;
        while ((key = keyPattern.exec(argumentsText))) {
            const index = range.start + key.index;
            if (depthInCall(text, mask, range.start, index) === 2) places.push(index);
        }
    }
    return places;
};

// The depth of a place in a call: 1 in its parentheses, 2 in an object given to it (TinySelect({ title })).
// WHY: a deeper key is another thing (the title of the style of SparkLineBox: style: { title: { fontSize } })
const depthInCall = function (text, mask, openIndex, index) {
    let depth = 0;
    for (let i = openIndex; i < index; i++) {
        if (mask[i]) continue;
        if ("({[".indexOf(text[i]) !== -1) depth++;
        else if (")}]".indexOf(text[i]) !== -1) depth--;
    }
    return depth;
};

// The places of a name with a capital letter: a key (inputValue:) or after a dot (field.inputValue)
const findNamedPlaces = function (text, entry) {
    const places = [];
    // WHY no space after the dot: the dot at the end of a comment, then the name on the next line, is no name of an object
    const pattern = new RegExp("(?:\\." + entry.oldName + "(?![\\w$])|(?<![\\w$.])" + entry.oldName + "\\s*:)", "g");
    let match;
    while ((match = pattern.exec(text))) places.push(match.index);
    return places;
};

const findComponentNames = function (text, entry) {
    const places = [];
    const pattern = new RegExp("(?<![\\w$.\"'/-])" + entry.oldName + "(?![\\w$])", "g");
    let match;
    while ((match = pattern.exec(text))) places.push(match.index);
    return places;
};

const checkFile = function (relativePath, names, ownParams) {
    const text = fs.readFileSync(path.join(ROOT, relativePath), "utf8");
    const mask = maskStrings(text);
    const found = [];
    names.forEach(function (entry) {
        let places;
        if (entry.isComponent) {
            places = findComponentNames(text, entry);
        } else if (isPlainWord(entry.oldName)) {
            const callNames = names.filter(function (other) { return other.isComponent && other.newName === entry.component; })
                .map(function (other) { return other.oldName; })
                .concat([entry.component]);
            places = findKeysInCalls(text, entry, callNames);
        } else {
            places = findNamedPlaces(text, entry).filter(function (index) {
                return !isOwnParamOfCall(text, mask, index, entry, names, ownParams);
            });
        }
        const isShared = !entry.isComponent && isParamOfAnother(entry, names, ownParams);
        places.forEach(function (index) {
            const isInOwnCall = (enclosingCallName(text, mask, index) === entry.component);
            found.push({ line: lineNumberAt(text, index), entry: entry, isMaybe: isShared && !isInOwnCall });
        });
    });
    return dropRepeats(found).sort(function (a, b) { return a.line - b.line; });
};

// Another component has a param of this name today (onSelect: SmartTable, DataTable, TreeView...)
const isParamOfAnother = function (entry, names, ownParams) {
    let isShared = false;
    ownParams.forEach(function (params, componentName) {
        if (componentName === entry.component || !params.has(entry.oldName)) return;
        const isOldThere = names.some(function (other) { return other.component === componentName && other.oldName === entry.oldName; });
        if (!isOldThere) isShared = true;
    });
    return isShared;
};

// A name after a namespace of the page, not after a component or an object of it: BasicDesigner.onDragMove
const isAfterOtherNamespace = function (text, index, names) {
    const before = /([A-Za-z_$][\w$]*)\s*$/.exec(text.slice(Math.max(0, index - 80), index));
    if (!before || !/^[A-Z]/.test(before[1])) return false;
    return !names.some(function (entry) { return entry.component === before[1] || (entry.isComponent && entry.oldName === before[1]); });
};

// A key of a call of a component that has a param of that name today (WebView({ placeholderText: "" }))
const isOwnParamOfCall = function (text, mask, index, entry, names, ownParams) {
    if (text[index] === ".") return isAfterOtherNamespace(text, index, names);
    const callName = enclosingCallName(text, mask, index);
    const params = ownParams.get(callName);
    if (!params || !params.has(entry.oldName)) return false;
    const isOldNameOfCall = names.some(function (other) { return other.component === callName && other.oldName === entry.oldName; });
    return !isOldNameOfCall;
};

// WHY: an old name of two components (placeholderText) is one place
const dropRepeats = function (found) {
    const byPlace = new Map();
    found.forEach(function (item) {
        const id = item.line + " " + item.entry.oldName;
        const known = byPlace.get(id);
        if (known) {
            if (known.components.indexOf(item.entry.component) === -1) known.components.push(item.entry.component);
            return;
        }
        byPlace.set(id, { line: item.line, oldName: item.entry.oldName, newName: item.entry.newName, components: [item.entry.component], isMaybe: item.isMaybe });
    });
    return Array.from(byPlace.values());
};

// *** THE FILES:

const isPage = function (relativePath) {
    if (relativePath.endsWith(".min.js")) return false;
    if (path.basename(relativePath).startsWith("delete-")) return false; // WHY: an obsolete file is not changed (CLAUDE.md)
    return PAGE_ENDINGS.some(function (ending) { return relativePath.endsWith(ending); });
};

const listFiles = function (targets) {
    const tracked = readGitLines(["ls-files"]).filter(isPage);
    if (!targets.length) {
        return tracked.filter(function (file) {
            return !SKIPPED_FOLDERS.some(function (folder) { return file.startsWith(folder); });
        });
    }
    return tracked.filter(function (file) {
        return targets.some(function (target) {
            const clean = target.replace(/\/$/, "");
            return file === clean || file.startsWith(clean + "/");
        });
    });
};

const folderOf = function (relativePath) {
    const parts = relativePath.split("/");
    if (parts.length <= 2) return parts.length === 1 ? "." : parts[0];
    return parts[0] + "/" + parts[1];
};

// *** START:

const main = function () {
    const args = process.argv.slice(2);
    if (args.indexOf("--help") !== -1) {
        console.log(chrome.helpText(__filename));
        return 0;
    }
    const isShort = args.indexOf("--short") !== -1;
    const targets = args.filter(function (arg) { return !arg.startsWith("--"); });
    const names = readOldNames();
    const ownParams = readOwnParams();
    const countByFolder = new Map();
    let total = 0;
    let maybeTotal = 0;

    listFiles(targets).forEach(function (file) {
        const found = checkFile(file, names, ownParams);
        if (!found.length) return;
        const maybeCount = found.filter(function (item) { return item.isMaybe; }).length;
        const count = found.length - maybeCount;
        total += count;
        maybeTotal += maybeCount;
        const folder = folderOf(file);
        countByFolder.set(folder, (countByFolder.get(folder) || 0) + count);
        const maybeText = (maybeCount) ? " (+" + maybeCount + "?)" : "";
        if (isShort) {
            console.log(count + maybeText + "\t" + file);
            return;
        }
        console.log(file);
        found.forEach(function (item) {
            const mark = (item.isMaybe) ? "?" : "";
            console.log("  " + item.line + "\t" + item.oldName + mark + " -> " + item.newName + "\t(" + item.components.join(", ") + ")");
        });
    });

    console.log("");
    countByFolder.forEach(function (count, folder) { console.log(count + "\t" + folder); });
    console.log("Old names: " + total + ", maybe: " + maybeTotal + " (" + names.length + " old names in comp/)");
    return 0;
};

process.exitCode = main();
