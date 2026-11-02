/* Bismillah */

// The AIs a prompt can go to: their CLI, how a model is given, and the command that starts it with a prompt.
// A zsh / bash terminal gets the whole prompt from its file: "$(cat 'file')" keeps it as one argument.
// PowerShell and cmd (Windows) get a short instruction to read the file: their quoting would break a prompt
// with quotes and lines (PowerShell 5.1 drops the inner double quotes of an argument).

"use strict";

const { execFile } = require("child_process");

const AGENTS = {
    claude: { key: "claude", name: "Claude Code", modelFlag: "--model" },
    codex: { key: "codex", name: "Codex", modelFlag: "-m" },
};

// The kind of a shell from its path: "posix" (zsh, bash, sh, Git Bash, WSL), "powershell" or "cmd".
const shellKindOf = function (shellPath, platform = process.platform) {
    const name = String(shellPath || "").toLowerCase().split(/[\\/]/).pop();
    if (/^(pwsh|powershell)(\.exe)?$/.test(name)) return "powershell";
    if (/^cmd(\.exe)?$/.test(name)) return "cmd";
    if (name) return "posix";
    return (platform === "win32") ? "powershell" : "posix";
};

// 'it''s' for a POSIX shell.
const posixQuote = function (text) {
    return "'" + String(text).replace(/'/g, "'\\''") + "'";
};

// 'it''s' for PowerShell (no $ is expanded in single quotes).
const powershellQuote = function (text) {
    return "'" + String(text).replace(/'/g, "''") + "'";
};

// "text" for cmd: a double quote can not be inside: it is removed (paths and model names never have one).
const cmdQuote = function (text) {
    return '"' + String(text).replace(/"/g, "") + '"';
};

const readFileInstruction = function (promptPath) {
    return "Read the prompt in the file " + promptPath + " and do what it says.";
};

// command: the CLI ("claude"), model: "" for the default of the CLI, promptFile: the file of the prompt
// (promptPath: how the instruction names it, Ex: relative to the terminal folder).
// Ex: claude --model 'sonnet' "$(cat '/repo/prompts/2026-10-26_0850_tabs.md')"
const buildCommand = function (agent, command, model, promptFile, shellKind = "posix", promptPath = promptFile) {
    if (shellKind === "powershell") {
        const parts = ["&", powershellQuote(command)];
        if (model) parts.push(agent.modelFlag, powershellQuote(model));
        parts.push(powershellQuote(readFileInstruction(promptPath)));
        return parts.join(" ");
    }
    if (shellKind === "cmd") {
        const parts = [cmdQuote(command)];
        if (model) parts.push(agent.modelFlag, cmdQuote(model));
        parts.push(cmdQuote(readFileInstruction(promptPath)));
        return parts.join(" ");
    }
    const parts = [command];
    if (model) parts.push(agent.modelFlag, posixQuote(model));
    parts.push('"$(cat ' + posixQuote(promptFile) + ')"');
    return parts.join(" ");
};

// The full path of a command (in a login shell: the PATH of the terminal; where.exe on Windows), or "".
const findCommand = function (command, platform = process.platform) {
    return new Promise(function (resolve) {
        const done = function (error, stdout) {
            const lines = String(stdout || "").trim().split(/\r?\n/).filter(Boolean);
            resolve((error || !lines.length) ? "" : lines[(platform === "win32") ? 0 : lines.length - 1]);
        };
        if (platform === "win32") {
            execFile("where.exe", [command], { timeout: 5000 }, done);
            return;
        }
        const shell = process.env.SHELL || "/bin/zsh";
        execFile(shell, ["-lc", "command -v " + posixQuote(command)], { timeout: 5000 }, done);
    });
};

module.exports = { AGENTS, buildCommand, findCommand, shellKindOf, posixQuote, powershellQuote, cmdQuote };
