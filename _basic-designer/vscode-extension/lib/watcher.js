/* Bismillah */

// Watches some files of the repository (the page and its scripts) and calls onChange(changedFiles) once the
// changes stop for a while (an AI writes a file in a few steps, and some files one after the other).
// WHY: The folders are watched, not the files: an editor (or an AI) may save a file by writing a new one and
//      renaming it, and a watcher of the old file would stop then.

"use strict";

const fs = require("fs");
const path = require("path");

const QUIET_TIME = 1500;

// files: paths from the root ("comp/tabs.js"). Returns { close() }.
const watchFiles = function (root, files, onChange, quietTime = QUIET_TIME) {
    const filesByFolder = {};
    files.forEach(function (file) {
        const fullPath = path.resolve(root, file);
        if (!fullPath.startsWith(root + path.sep)) return;
        const folder = path.dirname(fullPath);
        if (!filesByFolder[folder]) filesByFolder[folder] = {};
        filesByFolder[folder][path.basename(fullPath)] = file;
    });

    let changed = new Set();
    let timer = null;
    const flush = function () {
        const list = Array.from(changed);
        changed = new Set();
        onChange(list);
    };

    const watchers = Object.keys(filesByFolder).map(function (folder) {
        try {
            return fs.watch(folder, function (eventType, fileName) {
                const file = fileName && filesByFolder[folder][String(fileName)];
                if (!file) return;
                changed.add(file);
                clearTimeout(timer);
                timer = setTimeout(flush, quietTime);
            });
        } catch (error) {
            return null; // A folder that is not there any more
        }
    }).filter(Boolean);

    return {
        close: function () {
            clearTimeout(timer);
            watchers.forEach(function (watcher) { watcher.close(); });
        },
    };
};

module.exports = { watchFiles };
