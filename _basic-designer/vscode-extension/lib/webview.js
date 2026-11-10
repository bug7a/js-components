/* Bismillah */

// The HTML of the webview: only an iframe of the designer (from the page server), and a bridge that passes the
// messages between the designer (postMessage of the iframe) and the extension (acquireVsCodeApi).

"use strict";

const crypto = require("crypto");

const webviewHtml = function (options) {
    const nonce = crypto.randomBytes(16).toString("hex");
    const settings = JSON.stringify({ origin: options.origin, designerPath: options.designerPath, page: options.page });
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src ${options.origin}; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #1E1E1E; }
    iframe { display: block; width: 100%; height: 100%; border: 0; }
</style>
</head>
<body>
<iframe id="designer" title="basic.js Designer" allow="clipboard-read; clipboard-write"></iframe>
<script nonce="${nonce}">
(function () {
    const SETTINGS = ${settings};
    const vscode = (typeof acquireVsCodeApi === "function") ? acquireVsCodeApi() : null;
    const frame = document.getElementById("designer");
    const query = "?page=" + encodeURIComponent(SETTINGS.page) + "&host=vscode&hostOrigin=" + encodeURIComponent(location.origin);
    frame.src = SETTINGS.origin + "/" + SETTINGS.designerPath + query;

    window.addEventListener("message", function (event) {
        const data = event.data || {};
        // From the designer -> the extension
        if (event.source === frame.contentWindow) {
            if (event.origin !== SETTINGS.origin || data.source !== "basic-designer") return;
            if (vscode) vscode.postMessage(data);
            return;
        }
        // From the extension -> the designer
        if (data.source === "basic-designer-host" && frame.contentWindow) {
            frame.contentWindow.postMessage(data, SETTINGS.origin);
        }
    });
})();
</script>
</body>
</html>`;
};

module.exports = { webviewHtml };
