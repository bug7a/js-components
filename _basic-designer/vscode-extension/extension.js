/* Bismillah */

/*

basic designer - VS Code extension - v0.0.1 (prototype)

- Explorer > right click an .htm / .html file > "Open in basic designer": the page opens in basic designer
  (_basic-designer) in a webview. A small server (lib/server.js) gives the repository from 127.0.0.1,
  because the designer and the page must come from one origin.
- "Send to AI" in the designer: a quick pick asks for the AI (Claude Code / Codex) and the model, the prompt
  is written into a file and its CLI starts with it in a terminal at the root of the repository.
- A place of the code in the designer (dosya:satır) opens in the editor at its line.
- Every prompt sent is kept in promptsFolder (one .md file, its name: time, page, AI, model).
- After a Send, the files of the page are watched: when the AI changed them (and stopped for a moment), the
  designer loads the page again (reloadAfterSend).
- Terminals: zsh / bash get the whole prompt, PowerShell and cmd (Windows) an instruction to read its file.

Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

const vscode = require("vscode");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { startServer } = require("./lib/server");
const { AGENTS, buildCommand, findCommand, shellKindOf } = require("./lib/agents");
const { watchFiles } = require("./lib/watcher");
const { webviewHtml } = require("./lib/webview");

const LAST_CHOICE_KEY = "basicDesigner.lastChoice"; // { agentKey, model }
const servers = {}; // root -> promise of { origin, close }
const designers = {}; // root -> webview panel
const watchers = {}; // root -> the watcher of the files of the page sent last
let extensionContext = null;

const settings = function () {
    return vscode.workspace.getConfiguration("basicDesigner");
};

// The root of the repository: the first folder above the file that has the designer.
const findRoot = function (filePath) {
    const designerPath = settings().get("designerPath");
    let folder = path.dirname(filePath);
    while (true) {
        if (fs.existsSync(path.join(folder, designerPath))) return folder;
        const parent = path.dirname(folder);
        if (parent === folder) return "";
        folder = parent;
    }
};

const serverOf = function (root) {
    if (!servers[root]) servers[root] = startServer(root);
    return servers[root];
};

const titleOf = function (page) {
    return "Design: " + path.basename(page);
};

const sendToDesigner = function (panel, message) {
    panel.webview.postMessage(Object.assign({ source: "basic-designer-host" }, message));
};

const showStatus = function (panel, text, kind = "info") {
    sendToDesigner(panel, { type: "status", text: text, kind: kind });
};

// *** DESIGN: open a page in the designer (one designer for each repository: a new page goes into it).

const design = async function (uri) {
    const editor = vscode.window.activeTextEditor;
    const fileUri = uri || (editor && editor.document.uri);
    if (!fileUri || fileUri.scheme !== "file") {
        vscode.window.showErrorMessage("basic designer: right click an .htm file of the repository.");
        return;
    }
    const root = findRoot(fileUri.fsPath);
    if (!root) {
        vscode.window.showErrorMessage("basic designer: " + settings().get("designerPath") + " was not found in a folder above " + path.basename(fileUri.fsPath) + ".");
        return;
    }
    const page = path.relative(root, fileUri.fsPath).split(path.sep).join("/");

    const opened = designers[root];
    if (opened) {
        opened.title = titleOf(page);
        opened.reveal(); // WHY: it stays in its own window or group, where it is now
        sendToDesigner(opened, { type: "load", page: page });
        return;
    }

    const server = await serverOf(root);
    // WHY: asExternalUri: the same address also works when VS Code runs on another machine (Remote).
    const external = await vscode.env.asExternalUri(vscode.Uri.parse(server.origin));
    const origin = new URL(external.toString(true)).origin;

    // WHY: retainContextWhenHidden: the designer keeps its page and its changes in a hidden tab.
    const panel = vscode.window.createWebviewPanel("basicDesigner", titleOf(page), vscode.ViewColumn.Active, {
        enableScripts: true,
        retainContextWhenHidden: true,
    });
    panel.webview.html = webviewHtml({ origin: origin, designerPath: settings().get("designerPath"), page: page });
    designers[root] = panel;
    panel.onDidDispose(function () {
        delete designers[root];
        stopWatching(root);
    });
    panel.webview.onDidReceiveMessage(function (message) { onDesignerMessage(message, root, panel); });
    await placeDesigner();
};

// WHERE THE DESIGNER OPENS (a tab among the code files was not handy).
// "newWindow": its own window (VS Code 1.85+), "maximized": the editor area without the side bars, "tab": a tab.
const placeDesigner = async function () {
    const openIn = settings().get("openIn");
    try {
        if (openIn === "newWindow") await vscode.commands.executeCommand("workbench.action.moveEditorToNewWindow");
        if (openIn === "maximized") await vscode.commands.executeCommand("workbench.action.maximizeEditorHideSidebar");
    } catch (error) {
        vscode.window.showWarningMessage("basic designer: could not open it as \"" + openIn + "\": " + error.message);
    }
};

const onDesignerMessage = function (message, root, panel) {
    if (!message || message.source !== "basic-designer") return;
    if (message.type === "sendPrompt") sendPrompt(message, root, panel);
    if (message.type === "openFile") openFile(root, message);
    if (message.type === "request") answerRequest(message, root, panel);
};

// *** REQUESTS: the designer asks, the extension answers with { type: "reply", id, ok, result | error }.
// listFolder { folder, kind } -> { folders, files }: the folders and the .htm files right in it (kind "images": the
// pictures: png, jpg, jpeg, gif, svg, webp, avif, ico).
// createFile { folder, name, content } -> { page }: a new file (never over an old one).
// saveImage { name, dataUrl } -> { path }: a picture for the AI (Design from image), in promptsFolder/images.

const PAGE_FILES = /\.html?$/i;
const PICTURE_FILES = /\.(png|jpe?g|gif|svg|webp|avif|ico)$/i;

const fileKindOf = function (kind) {
    return (kind === "images") ? PICTURE_FILES : PAGE_FILES;
};

const REQUESTS = {
    listFolder: function (message, root) {
        const folderPath = insideRoot(root, message.folder);
        const entries = fs.readdirSync(folderPath, { withFileTypes: true });
        const visible = entries.filter(function (entry) { return entry.name.charAt(0) !== "."; });
        return {
            folders: visible.filter(function (entry) { return entry.isDirectory(); }).map(function (entry) { return entry.name; }),
            files: visible.filter(function (entry) { return entry.isFile() && fileKindOf(message.kind).test(entry.name); }).map(function (entry) { return entry.name; }),
        };
    },
    createFile: function (message, root) {
        const name = String(message.name || "");
        if (!/^[a-z0-9][a-z0-9\-_]*\.html?$/i.test(name)) throw new Error("Letters, digits, - and _ only.");
        const filePath = path.join(insideRoot(root, message.folder), name);
        // WHY: flag "wx": the write fails when the file is there, so a design is never written over.
        try {
            fs.writeFileSync(filePath, String(message.content || ""), { encoding: "utf8", flag: "wx" });
        } catch (error) {
            if (error.code === "EEXIST") throw new Error(name + " is already in this folder.");
            throw error;
        }
        return { page: path.relative(root, filePath).split(path.sep).join("/") };
    },
    saveImage: function (message, root) {
        const match = /^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/i.exec(String(message.dataUrl || ""));
        if (!match) throw new Error("Not a PNG, JPEG, WebP or GIF picture.");
        const bytes = Buffer.from(match[2], "base64");
        if (bytes.length > IMAGE_MAX_BYTES) throw new Error("The picture is larger than " + Math.round(IMAGE_MAX_BYTES / 1048576) + " MB.");
        const folderSetting = String(settings().get("promptsFolder") || "").trim();
        const folder = path.join((folderSetting) ? path.resolve(root, folderSetting) : os.tmpdir(), "images");
        fs.mkdirSync(folder, { recursive: true });
        const extension = (match[1].toLowerCase() === "jpeg") ? "jpg" : match[1].toLowerCase();
        const baseName = safeName(path.basename(String(message.name || "image"), path.extname(String(message.name || "")))) || "image";
        const filePath = path.join(folder, timeStamp() + "_" + baseName + "." + extension);
        fs.writeFileSync(filePath, bytes);
        const isInRoot = filePath.startsWith(root + path.sep);
        return { path: (isInRoot) ? path.relative(root, filePath).split(path.sep).join("/") : filePath };
    },
};

const IMAGE_MAX_BYTES = 15 * 1024 * 1024;

// A folder from the root that must stay in the root.
const insideRoot = function (root, relativePath) {
    const fullPath = path.resolve(root, String(relativePath || ""));
    if (fullPath !== root && !fullPath.startsWith(root + path.sep)) throw new Error("Outside the repository.");
    return fullPath;
};

const answerRequest = function (message, root, panel) {
    const handle = REQUESTS[message.action];
    const reply = { type: "reply", id: message.id };
    try {
        if (!handle) throw new Error("Unknown request: " + message.action);
        reply.ok = true;
        reply.result = handle(message, root);
    } catch (error) {
        reply.ok = false;
        reply.error = error.message;
    }
    sendToDesigner(panel, reply);
};

// *** OPEN THE CODE: a place of the designer (path from the root, line, col), beside the designer.

const openFile = async function (root, place) {
    const filePath = path.resolve(root, String(place.path || ""));
    if (!filePath.startsWith(root + path.sep)) return;
    const line = Math.max(0, (Number(place.line) || 1) - 1);
    const col = Math.max(0, (Number(place.col) || 1) - 1);
    const position = new vscode.Position(line, col);
    try {
        // WHY: with the designer in its own window, the code opens in the main window (its first group).
        const isOwnWindow = (settings().get("openIn") === "newWindow");
        await vscode.window.showTextDocument(vscode.Uri.file(filePath), {
            viewColumn: (isOwnWindow) ? vscode.ViewColumn.One : vscode.ViewColumn.Beside,
            selection: new vscode.Range(position, position),
        });
    } catch (error) {
        vscode.window.showErrorMessage("basic designer: could not open " + place.path + ": " + error.message);
    }
};

// *** SEND TO AI: the AI and the model (quick picks), then its CLI in a terminal with the prompt.

const agentItems = async function () {
    const keys = Object.keys(AGENTS);
    const paths = await Promise.all(keys.map(function (key) { return findCommand(settings().get(key + ".command")); }));
    return keys.map(function (key, index) {
        return {
            label: AGENTS[key].name,
            description: (paths[index]) ? paths[index] : "not found on the PATH",
            agentKey: key,
            isFound: !!paths[index],
        };
    });
};

const choiceText = function (choice) {
    const agent = AGENTS[choice.agentKey];
    return agent.name + " · " + (choice.model || "default model");
};

// Returns { agentKey, model } or null (closed).
const chooseAgentAndModel = async function () {
    const last = extensionContext.globalState.get(LAST_CHOICE_KEY);
    const items = [];
    if (last && AGENTS[last.agentKey]) {
        items.push({ label: "$(history) " + choiceText(last), description: "the last choice", choice: last });
        items.push({ label: "", kind: vscode.QuickPickItemKind.Separator });
    }
    (await agentItems()).forEach(function (item) { items.push(item); });

    const picked = await vscode.window.showQuickPick(items, { title: "Send the prompt to", placeHolder: "Which AI edits the code?" });
    if (!picked) return null;
    if (picked.choice) return picked.choice;
    if (!picked.isFound) {
        vscode.window.showErrorMessage("basic designer: " + picked.label + " (" + settings().get(picked.agentKey + ".command") + ") was not found. Install its CLI, or set basicDesigner." + picked.agentKey + ".command.");
        return null;
    }

    const model = await chooseModel(picked.agentKey);
    if (model === null) return null;
    const choice = { agentKey: picked.agentKey, model: model };
    await extensionContext.globalState.update(LAST_CHOICE_KEY, choice);
    return choice;
};

// Returns the model ("" = the default of the CLI) or null (closed).
const chooseModel = async function (agentKey) {
    const models = settings().get(agentKey + ".models") || [];
    const items = [{ label: "Default", description: "the model of the CLI settings", model: "" }];
    models.forEach(function (model) { items.push({ label: model, model: model }); });
    items.push({ label: "$(edit) Other model…", isOther: true });

    const picked = await vscode.window.showQuickPick(items, { title: AGENTS[agentKey].name + ": model", placeHolder: "The model that works on the prompt" });
    if (!picked) return null;
    if (!picked.isOther) return picked.model;
    const typed = await vscode.window.showInputBox({ title: AGENTS[agentKey].name + ": model", prompt: "The name of the model (as the CLI takes it)" });
    return (typed === undefined) ? null : typed.trim();
};

// "2026-10-26_0850-12"
const timeStamp = function (date = new Date()) {
    const two = function (n) { return String(n).padStart(2, "0"); };
    return date.getFullYear() + "-" + two(date.getMonth() + 1) + "-" + two(date.getDate()) + "_" + two(date.getHours()) + two(date.getMinutes()) + "-" + two(date.getSeconds());
};

const safeName = function (text) {
    return String(text).replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "");
};

// The prompt into promptsFolder (from the root; "" = the temp folder of the system). Returns its path.
const savePrompt = function (root, page, choice, prompt) {
    const folderSetting = String(settings().get("promptsFolder") || "").trim();
    const folder = (folderSetting) ? path.resolve(root, folderSetting) : os.tmpdir();
    fs.mkdirSync(folder, { recursive: true });
    const pageName = path.basename(String(page || "page"), path.extname(String(page || "")));
    const name = [timeStamp(), safeName(pageName), choice.agentKey + ((choice.model) ? "-" + safeName(choice.model) : "")].join("_") + ".md";
    const file = path.join(folder, name);
    fs.writeFileSync(file, prompt, "utf8");
    return file;
};

const sendPrompt = async function (message, root, panel) {
    const prompt = String(message.prompt || "");
    if (!prompt.trim()) return;
    const choice = await chooseAgentAndModel();
    if (!choice) {
        showStatus(panel, "Not sent.");
        return;
    }
    const agent = AGENTS[choice.agentKey];
    const promptFile = savePrompt(root, message.page, choice, prompt);
    const isInRoot = promptFile.startsWith(root + path.sep);
    // WHY: An instruction names the file from the terminal folder (the root): short, and no quotes in it.
    const promptPath = (isInRoot) ? path.relative(root, promptFile) : promptFile;

    const terminalName = "basic designer → " + agent.name;
    const terminal = vscode.window.createTerminal({ name: terminalName, cwd: root });
    const command = settings().get(choice.agentKey + ".command");
    terminal.show();
    terminal.sendText(buildCommand(agent, command, choice.model, promptFile, shellKindOf(vscode.env.shell), promptPath));

    const willReload = settings().get("reloadAfterSend") && Array.isArray(message.files) && message.files.length;
    if (willReload) startWatching(root, message.page, message.files, panel);
    const after = (willReload) ? "the page loads again when it changes the code." : "reload the page in the designer when it is done.";
    showStatus(panel, "Sent to " + choiceText(choice) + " (terminal \"" + terminalName + "\"): " + after);
};

// *** RELOAD AFTER SEND: the files of the page, watched until the next Send or the designer is closed.

const startWatching = function (root, page, files, panel) {
    stopWatching(root);
    watchers[root] = watchFiles(root, files.map(String), function (changedFiles) {
        sendToDesigner(panel, { type: "codeChanged", page: page, files: changedFiles });
    });
};

const stopWatching = function (root) {
    if (!watchers[root]) return;
    watchers[root].close();
    delete watchers[root];
};

// *** LIFE:

const stopServers = function () {
    Object.keys(watchers).forEach(stopWatching);
    Object.keys(servers).forEach(function (root) {
        servers[root].then(function (server) { server.close(); }).catch(function () { });
        delete servers[root];
    });
};

const activate = function (context) {
    extensionContext = context;
    context.subscriptions.push(vscode.commands.registerCommand("basicDesigner.design", design));
    context.subscriptions.push(vscode.commands.registerCommand("basicDesigner.stopServer", function () {
        Object.keys(designers).forEach(function (root) { designers[root].dispose(); });
        stopServers();
        vscode.window.showInformationMessage("basic designer: the page server is stopped.");
    }));
};

const deactivate = function () {
    stopServers();
};

module.exports = { activate, deactivate };
