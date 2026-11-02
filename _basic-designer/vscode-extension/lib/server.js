/* Bismillah */

// A small static file server for the repository: the designer and the page it opens must come from one origin
// (the designer reads the page in its iframe). Only 127.0.0.1, a free port, GET / HEAD, files under the root.

"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const CONTENT_TYPES = {
    ".htm": "text/html; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".md": "text/markdown; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".otf": "font/otf",
    ".mp3": "audio/mpeg",
    ".mp4": "video/mp4",
    ".webmanifest": "application/manifest+json",
};

const INDEX_FILES = ["index.htm", "index.html"];

// The file of a request path, or null when it is out of the root.
const fileOfRequest = function (rootDir, requestUrl) {
    let pathname = "";
    try {
        pathname = decodeURIComponent(new URL(requestUrl, "http://127.0.0.1").pathname);
    } catch (error) {
        return null;
    }
    const filePath = path.resolve(rootDir, "." + pathname);
    const isInRoot = (filePath === rootDir || filePath.startsWith(rootDir + path.sep));
    return (isInRoot) ? filePath : null;
};

const sendText = function (response, status, text) {
    response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
    response.end(text);
};

const sendFile = function (request, response, filePath) {
    fs.stat(filePath, function (error, stats) {
        if (error) return sendText(response, 404, "Not found");
        if (stats.isDirectory()) {
            const index = INDEX_FILES.map(function (name) { return path.join(filePath, name); }).find(fs.existsSync);
            if (!index) return sendText(response, 404, "Not found");
            return sendFile(request, response, index);
        }
        const type = CONTENT_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
        // WHY: no-store: a file changed by the AI is read again when the designer loads the page.
        response.writeHead(200, { "Content-Type": type, "Content-Length": stats.size, "Cache-Control": "no-store" });
        if (request.method === "HEAD") return response.end();
        fs.createReadStream(filePath).pipe(response);
    });
};

// Starts the server. Returns a promise of { port, origin, close() }.
const startServer = function (rootDir) {
    const root = path.resolve(rootDir);
    const server = http.createServer(function (request, response) {
        if (request.method !== "GET" && request.method !== "HEAD") return sendText(response, 405, "Only GET");
        const filePath = fileOfRequest(root, request.url);
        if (!filePath) return sendText(response, 403, "Out of the root");
        sendFile(request, response, filePath);
    });
    return new Promise(function (resolve, reject) {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", function () {
            const port = server.address().port;
            resolve({
                port: port,
                origin: "http://127.0.0.1:" + port,
                close: function () { server.close(); },
            });
        });
    });
};

module.exports = { startServer, fileOfRequest };
