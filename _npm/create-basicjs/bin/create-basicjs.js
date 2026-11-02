#!/usr/bin/env node
"use strict";

// npm create basicjs@latest my-app
// npm create basicjs@latest my-app -- --template shop
// npx create-basicjs@latest update      (in a project: replaces only _basic/)

const fs = require("fs");
const path = require("path");

const PACKAGE = path.resolve(__dirname, "..");
const STARTER = path.join(PACKAGE, "payload", "starter");
const TEMPLATES = path.join(PACKAGE, "payload", "templates");
const VERSION = JSON.parse(fs.readFileSync(path.join(PACKAGE, "package.json"), "utf8")).version;
const DEFAULT_FOLDER = "my-app";

const HELP = `create-basicjs ${VERSION}

  npm create basicjs@latest my-app                   a new project
  npm create basicjs@latest my-app -- --template shop  a project from a template
  npm create basicjs@latest -- --list                the templates
  npx create-basicjs@latest update                   in a project: replaces only _basic/
`;

const stop = function (text) {
    console.error(text);
    process.exit(1);
};

const templateNames = function () {
    return fs.readdirSync(TEMPLATES, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
};

const readArguments = function () {
    const args = process.argv.slice(2);
    const options = { command: "create", folder: "", template: "" };
    for (let index = 0; index < args.length; index++) {
        const arg = args[index];
        if (arg === "--help" || arg === "-h") options.command = "help";
        else if (arg === "--list") options.command = "list";
        else if (arg === "--template" || arg === "-t") options.template = args[++index] || "";
        else if (arg === "update" && !options.folder) options.command = "update";
        else if (arg.startsWith("-")) stop("Unknown option: " + arg + "\n\n" + HELP);
        else options.folder = arg;
    }
    return options;
};

const useProjectName = function (target, name) {
    ["README.md", "index.htm"].forEach(function (fileName) {
        const file = path.join(target, fileName);
        if (!fs.existsSync(file)) return;
        fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace(/My App/g, name));
    });
};

const addTemplate = function (target, name) {
    const from = path.join(TEMPLATES, name);
    if (!fs.existsSync(from)) stop('There is no template "' + name + '". The templates: ' + templateNames().join(", "));
    // WHY: Only what the template brings is replaced: the forms have no app/ of their own files to lose.
    if (fs.existsSync(path.join(from, "app"))) fs.rmSync(path.join(target, "app"), { recursive: true, force: true });
    fs.cpSync(from, target, { recursive: true, force: true });
};

const create = function (options) {
    const folder = options.folder || DEFAULT_FOLDER;
    const target = path.resolve(folder);
    if (fs.existsSync(target) && fs.readdirSync(target).length) stop(folder + " is not empty: choose another folder.");

    fs.cpSync(STARTER, target, { recursive: true });
    fs.renameSync(path.join(target, "gitignore"), path.join(target, ".gitignore")); // WHY: npm leaves a .gitignore out of a package
    fs.mkdirSync(path.join(target, "assets"), { recursive: true });
    if (options.template) addTemplate(target, options.template);
    useProjectName(target, path.basename(target));

    console.log("Ready: " + folder + (options.template ? " (template: " + options.template + ")" : ""));
    console.log("\n  cd " + folder + "\n  npx serve\n");
    console.log("Open the folder in an AI coding tool and describe your app. To publish: node _basic/tools/build.js");
};

const update = function () {
    const basicFolder = path.resolve("_basic");
    if (!fs.existsSync(basicFolder)) stop("There is no _basic folder here: run this in a project.");
    const versionFile = path.join(basicFolder, "VERSION");
    const oldVersion = fs.existsSync(versionFile) ? fs.readFileSync(versionFile, "utf8").trim() : "unknown";
    if (oldVersion === VERSION) {
        console.log("_basic/ is already " + VERSION + ".");
        return;
    }
    const newFolder = basicFolder + "-new";
    fs.rmSync(newFolder, { recursive: true, force: true });
    fs.cpSync(path.join(STARTER, "_basic"), newFolder, { recursive: true });
    fs.rmSync(basicFolder, { recursive: true, force: true });
    fs.renameSync(newFolder, basicFolder);
    console.log("_basic/ updated: " + oldVersion + " -> " + VERSION);
    const agentsFile = path.resolve("AGENTS.md");
    if (fs.existsSync(agentsFile) && fs.readFileSync(agentsFile, "utf8") !== fs.readFileSync(path.join(STARTER, "AGENTS.md"), "utf8")) {
        console.log("AGENTS.md was not changed: yours is different from the one in this version.");
    }
    console.log("Check your app after an update: node _basic/tools/check.js");
};

const options = readArguments();
if (options.command === "help") console.log(HELP);
else if (options.command === "list") console.log(templateNames().join("\n"));
else if (options.command === "update") update();
else create(options);
