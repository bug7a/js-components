/* Bismillah */

/*

Screen recorder for the component videos - v26.09

Plays a video page (tabs-short.htm) in a headless Chrome and writes a 1080 x 1920 mp4.
Nothing is installed on the system: Chrome is the one already on the machine, and ffmpeg
comes from the ffmpeg-static package.

SETUP (once, in this folder):
    npm install puppeteer-core ffmpeg-static

USAGE:
    node record.js tabs-short.htm tabs-short.mp4

Developer: Bugra Ozden

*/

"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

// *** SETTINGS:

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;

// The Chrome to drive. The first one that exists is used.
const CHROME_PATHS = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
];

// *** MAIN:

const pageFile = path.resolve(process.argv[2] || "tabs-short.htm");
const outFile = path.resolve(process.argv[3] || "tabs-short.mp4");
const framesDir = path.join(path.dirname(outFile), "_frames");

(async () => {

    const puppeteer = await import("puppeteer-core");
    const ffmpegPath = require("ffmpeg-static");
    const chromePath = CHROME_PATHS.find(function (p) { return fs.existsSync(p); });

    if (!chromePath) { console.error("Chrome not found. Add its path to CHROME_PATHS."); process.exit(1); }

    fs.rmSync(framesDir, { recursive: true, force: true });
    fs.mkdirSync(framesDir, { recursive: true });

    const browser = await (puppeteer.default || puppeteer).launch({
        executablePath: chromePath,
        headless: "new",
        args: ["--force-device-scale-factor=1", "--hide-scrollbars", "--window-size=" + WIDTH + "," + HEIGHT],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });

    const problems = [];
    page.on("pageerror", function (e) { problems.push(String(e.message)); });

    await page.goto("file://" + pageFile, { waitUntil: "load" });
    await new Promise(function (r) { setTimeout(r, 1500); });          // fonts
    await page.evaluate(function () { lblScale.visible = 0; });        // the scale text is a helper

    // FRAMES: Chrome sends a frame only when something changed, with its own timestamp.
    const client = await page.createCDPSession();
    const frames = [];

    client.on("Page.screencastFrame", function (frame) {
        // WHY: the handler has to stay cheap, the frames flood the event loop.
        client.send("Page.screencastFrameAck", { sessionId: frame.sessionId }).catch(function () { });
        const file = path.join(framesDir, "f" + String(frames.length).padStart(5, "0") + ".jpg");
        frames.push({ file: file, t: frame.metadata.timestamp });
        fs.writeFile(file, Buffer.from(frame.data, "base64"), function () { });
    });

    await client.send("Page.startScreencast", { format: "jpeg", quality: 85, maxWidth: WIDTH, maxHeight: HEIGHT, everyNthFrame: 2 });

    // WHY: play() is async and evaluate() waits for it, so this returns when the video is over.
    //      The capture slows the page down; the page clock and the frame timestamps stay right.
    await page.evaluate(function () { return play(); });
    await new Promise(function (r) { setTimeout(r, 2500); });           // hold the last frame

    await client.send("Page.stopScreencast");
    await new Promise(function (r) { setTimeout(r, 1200); });           // let the writes finish
    await browser.close();

    if (!frames.length) { console.error("No frames were captured."); process.exit(1); }

    // LIST: every frame lasts until the next one arrives, so the still parts keep their length.
    let list = "";
    for (let i = 0; i < frames.length; i++) {
        const next = (i + 1 < frames.length) ? frames[i + 1].t : frames[i].t + 0.3;
        const duration = Math.min(12, Math.max(0.016, next - frames[i].t));
        list += "file '" + frames[i].file + "'\nduration " + duration.toFixed(4) + "\n";
    }
    list += "file '" + frames[frames.length - 1].file + "'\n";

    const listFile = path.join(framesDir, "frames.txt");
    fs.writeFileSync(listFile, list);

    execFileSync(ffmpegPath, [
        "-y", "-f", "concat", "-safe", "0", "-i", listFile,
        "-fps_mode", "cfr", "-r", String(FPS),
        "-c:v", "libx264", "-preset", "slow", "-crf", "19",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        outFile,
    ], { stdio: "ignore" });

    fs.rmSync(framesDir, { recursive: true, force: true });

    const seconds = frames[frames.length - 1].t - frames[0].t;
    console.log("Frames  : " + frames.length);
    console.log("Length  : " + seconds.toFixed(1) + " s");
    console.log("Written : " + outFile + "  (" + Math.round(fs.statSync(outFile).size / 1024) + " KB)");
    if (problems.length) console.log("Page errors: " + problems.join(" | "));

})();
