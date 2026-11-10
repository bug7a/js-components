/* Bismillah */

/*
SEND FORMS: every form of 04-templates/web-forms is filled, sent to its mail service, and the mail is read.

A copy of service/send-form-mail.php runs with "php -S" in a temporary folder: test settings, no rate limit, and
it writes the mail into a file instead of sending it (nothing leaves the computer). Each form is opened with its
SERVICE_URL pointed at that copy (the page is changed in memory; no file of the repository is written). Then
every question gets a valid answer: a date, the first choice of each radio group, every check box, a file in
each file field, a text by the kind of each field (the promo and coupon codes stay empty), and the own controls
of some forms (a ticket, two products, a rating). Then the send button is pressed.

    node test/send-forms.js                        every form
    node test/send-forms.js order-form feedback    the forms whose names have these words

The results, one line a form:
    SENT     the form passed its own check, the service answered, and the mail has the e-mail of the visitor
             (Reply-To), every file and the number the page showed (ORD-..., EVT-..., TCK-...)
    FAIL     what was wrong: a question the form still asks for, no mail, an error of the page, a lost file or
             another number in the mail. The exit code is 1.
    empty:   the answers the mail shows as empty (a note, not a failure: an optional question left out)

contact-form-to-supabase.htm sends to Supabase by default: here it sends with sendFormToMailService(json), the
way its comment shows. It needs PHP (php -S), Chrome and puppeteer-core (as the other tools).

Started Date: November 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0
*/

"use strict";

const fs = require("fs");
const os = require("os");
const net = require("net");
const path = require("path");
const { spawn, execFileSync } = require("child_process");
const chrome = require("./_chrome.js");

const FORMS_FOLDER = "04-templates/web-forms";
const SERVICE_FILE = "service/send-form-mail.php";
const VISITOR_EMAIL = "test@example.com";
const LOAD_TIMEOUT = 20000; // ms
const MAIL_TIMEOUT = 10000; // ms: the longest wait for the mail after the send button
const MESSAGE_WAIT = 800; // ms: the message of the page after the mail

// *** THE SERVICE:

// The settings of the copy and its send function, which writes the mail into a file. Each text must be found once.
const SERVICE_CHANGES = [
    ['define("TO_EMAIL", "you@your-site.com");', 'define("TO_EMAIL", "owner@example.com");'],
    ['define("SMTP_HOST", "mail.your-site.com");', 'define("SMTP_HOST", "mail.example.com");'],
    ['define("SMTP_USER", "no-reply@your-site.com");', 'define("SMTP_USER", "no-reply@example.com");'],
    ['define("SMTP_PASSWORD", "");', 'define("SMTP_PASSWORD", "test");'],
    ['define("RATE_LIMIT_SECONDS", 15);', 'define("RATE_LIMIT_SECONDS", 0);'],
    [
        'function sendMailWithSmtp($to, $subject, $htmlBody, $textBody, $fromEmail, $fromName, $replyTo, $attachments) {',
        'function sendMailWithSmtp($to, $subject, $htmlBody, $textBody, $fromEmail, $fromName, $replyTo, $attachments) {\n'
        + '    $files = array_map(function ($a) { return $a["field"] . ": " . $a["name"]; }, $attachments);\n'
        + '    $name = preg_replace("/[^a-z0-9-]/", "", isset($_GET["form"]) ? $_GET["form"] : "form");\n'
        + '    $mail = ["subject" => $subject, "replyTo" => $replyTo, "files" => $files, "text" => $textBody];\n'
        + '    file_put_contents(__DIR__ . "/mail-" . $name . ".json", json_encode($mail));\n'
        + '    return "";',
    ],
];

const findFreePort = function () {
    return new Promise(function (resolve) {
        const server = net.createServer();
        server.listen(0, "127.0.0.1", function () {
            const port = server.address().port;
            server.close(function () { resolve(port); });
        });
    });
};

const createServiceCopy = function (folder) {
    const formsPath = path.join(chrome.ROOT, FORMS_FOLDER);
    let code = fs.readFileSync(path.join(formsPath, SERVICE_FILE), "utf8");
    SERVICE_CHANGES.forEach(function ([oldText, newText]) {
        if (code.split(oldText).length !== 2) throw new Error("The service changed, this text is not in it once: " + oldText);
        code = code.replace(oldText, newText);
    });
    const serviceFolder = path.join(folder, "service");
    fs.mkdirSync(serviceFolder, { recursive: true });
    fs.cpSync(path.join(formsPath, "service/PHPMailer"), path.join(serviceFolder, "PHPMailer"), { recursive: true });
    fs.writeFileSync(path.join(serviceFolder, "send-form-mail.php"), code);
    return serviceFolder;
};

const startService = async function (folder) {
    const port = await findFreePort();
    const php = spawn("php", ["-S", "127.0.0.1:" + port, "-t", folder], { stdio: "ignore" });
    const url = "http://127.0.0.1:" + port + "/service/send-form-mail.php";
    for (let i = 0; i < 50; i++) {
        try {
            const answer = await fetch(url);
            if (answer.ok) return { php, url };
        } catch (error) {
            // not listening yet
        }
        await chrome.sleep(100);
    }
    php.kill();
    throw new Error("php -S did not start");
};

// *** THE FORMS:

const listForms = function (words) {
    const formsPath = path.join(chrome.ROOT, FORMS_FOLDER);
    return fs.readdirSync(formsPath).filter(function (file) {
        if (!file.endsWith(".htm")) return false;
        if (!/const SERVICE_URL = /.test(fs.readFileSync(path.join(formsPath, file), "utf8"))) return false;
        return words.length === 0 || words.some(function (word) { return file.includes(word); });
    }).sort();
};

// The page in memory: SERVICE_URL is the copy of the service, and window.__formOf() gives the form of the page
// (a page keeps it in a variable of its script: a module or a classic script).
const preparePage = function (file, serviceUrl) {
    const name = file.replace(".htm", "");
    let html = fs.readFileSync(path.join(chrome.ROOT, FORMS_FOLDER, file), "utf8");
    html = html.replace(/const SERVICE_URL = [^;]*;/, 'const SERVICE_URL = "' + serviceUrl + "?form=" + name + '";');
    // WHY: the Supabase form sends the mail only when this line of its comment is used.
    html = html.replace("sendFormToSupabase();\n", "// sendFormToSupabase();\n").replace("//sendFormToMailService(json);", "sendFormToMailService(json);");
    const scriptStart = html.search(/<script( type="module")?>/);
    const scriptEnd = html.indexOf("</script>", scriptStart);
    return html.slice(0, scriptEnd) + "\nwindow.__formOf = function () { return form; };\n" + html.slice(scriptEnd);
};

// Runs in the page: answers every question, presses the send button, gives what it did.
const fillAndSend = async function (visitorEmail) {
    const form = window.__formOf();
    const sleep = function (ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); };
    const isShown = function (o) { return !!(o && o.elem && o.elem.isConnected && o.elem.getClientRects().length > 0); };
    const allObjects = function () {
        const found = new Set();
        document.querySelectorAll("*").forEach(function (e) { if (e._basicObject) found.add(e._basicObject); });
        return [...found];
    };
    const PNG = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="), function (c) { return c.charCodeAt(0); });
    const testFile = function (picker) {
        const accept = String(picker.accept || "");
        if (accept.includes("image")) return new File([PNG], "test-picture.png", { type: "image/png" });
        if (accept.includes(".pdf")) return new File(["%PDF-1.4\n% test\n"], "test-document.pdf", { type: "application/pdf" });
        return new File(["test"], "test.txt", { type: "text/plain" });
    };
    const nextWeekday = function (days) {
        const date = new Date();
        date.setHours(12, 0, 0, 0);
        date.setDate(date.getDate() + days);
        while (date.getDay() === 0 || date.getDay() === 6) date.setDate(date.getDate() + 1);
        return date;
    };
    const textFor = function (item) {
        const name = (item.key + " " + item.titleText + " " + item.type).toLowerCase();
        if (/promo|coupon|discount/.test(name)) return null;
        if (/mail/.test(name)) return visitorEmail;
        if (/phone/.test(name)) return "5321234567";
        if (/url|portfolio|link|website/.test(name)) return "https://example.com";
        if (/postal|zip/.test(name)) return "35000";
        if (/tax|vat/.test(name)) return "1234567890";
        if (item.type === "textarea" || /message|description|letter|notes|steps|comment/.test(name)) {
            return "A test answer of send-forms.js: every question of the form goes to the mail service.";
        }
        if (/order/.test(name)) return "ORD-123456";
        return "Test " + String(item.titleText || item.key).toLowerCase();
    };

    // The own controls of some forms: a ticket, two products, the last mark of each rating.
    document.querySelectorAll('[aria-label^="Add one"]').forEach(function (e) { e.click(); });
    const plusButtons = [...document.querySelectorAll("*")].filter(function (e) { return e.childElementCount === 0 && e.textContent.trim() === "+"; });
    plusButtons.slice(0, 2).forEach(function (e) { e.click(); });
    document.querySelectorAll('[role="radiogroup"]').forEach(function (group) {
        const marks = group.querySelectorAll('[role="radio"]');
        if (marks.length) marks[marks.length - 1].click();
    });
    await sleep(300);

    // WHY three rounds: an answer shows more questions (delivery: the address; an invoice: the company).
    const radioGroups = (typeof RadioButton !== "undefined") ? RadioButton.groups : {};
    let fileCount = 0;
    for (let round = 0; round < 3; round++) {
        allObjects().forEach(function (o) {
            if (typeof o.setDate !== "function" || !isShown(o) || o.__answered) return;
            o.setDate(nextWeekday(10));
            o.__answered = 1;
        });
        await sleep(200);
        Object.keys(radioGroups).forEach(function (group) {
            if (RadioButton.getValue(group) !== "") return;
            const radio = RadioButton.getGroup(group).find(function (r) { return r.enabled !== 0 && isShown(r); });
            if (radio) radio.select();
        });
        await sleep(200);
        allObjects().forEach(function (o) {
            if (!isShown(o) || o.__answered) return;
            if (typeof o.setChecked === "function" && o.group === undefined && !o.checked) {
                o.setChecked(1);
                o.__answered = 1;
            }
            if (typeof o.addFiles === "function") {
                o.addFiles([testFile(o)]);
                o.__answered = 1;
                fileCount++;
            }
        });
        await sleep(200);
        form.inputList.forEach(function (item) {
            if (typeof item.setValue !== "function" || !isShown(item) || /radio|check|date|file/.test(String(item.type))) return;
            let value;
            try { value = String(item.getValue()); } catch (error) { return; } // a field of the page with its own content
            if (value !== "") return;
            const text = textFor(item);
            if (text === null) return;
            try { item.setValue(text); } catch (error) { /* a field of the page that takes no text */ }
        });
        await sleep(200);
    }
    form.refresh();
    await sleep(300);

    const missing = (form.lblWarningDetail) ? form.lblWarningDetail.text.replace(/<[^>]+>/g, "").replace(/can't be empty/g, "").split("\n").join(" ") : "";
    const isReady = (form.btnSend.clickable === 1);
    if (isReady) form.btnSend.elem.click();
    return { isReady, missing: missing.trim(), fileCount };
};

// *** THE CHECK OF ONE FORM:

const readMail = async function (file) {
    for (let waited = 0; waited < MAIL_TIMEOUT; waited += 100) {
        if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"));
        await chrome.sleep(100);
    }
    return null;
};

// The answers shown as empty: a title line ("NAME:") with "-" under it.
const findEmptyAnswers = function (text) {
    const lines = text.split("\n");
    return lines.filter(function (line, i) { return line.endsWith(":") && lines[i + 1] === "-"; }).map(function (line) { return line.slice(0, -1); });
};

const checkForm = async function (browser, server, serviceFolder, file) {
    const name = file.replace(".htm", "");
    const mailFile = path.join(serviceFolder, "mail-" + name + ".json");
    const problems = [];
    const page = await browser.newPage();
    await chrome.guardPage(page);
    page.on("pageerror", function (error) { problems.push("page error: " + error.message); });
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(server.base + "/" + FORMS_FOLDER + "/__send-" + file, { waitUntil: "load", timeout: LOAD_TIMEOUT });
    await chrome.waitUntilTrue(page, "window.__formOf && window.__formOf().btnSend", LOAD_TIMEOUT);

    const filled = await page.evaluate(fillAndSend, VISITOR_EMAIL);
    if (!filled.isReady) problems.push("the form still asks for: " + filled.missing);
    const mail = (filled.isReady) ? await readMail(mailFile) : null;
    if (filled.isReady && !mail) problems.push("no mail");
    let result = { name, problems, empty: [] };
    if (!mail) {
        await page.close();
        return result;
    }

    await chrome.sleep(MESSAGE_WAIT);
    const pageText = await page.evaluate(function () { return document.body.innerText; });
    await page.close();
    const reference = (mail.text.split("\n")[1] || "").split(" - ")[0];
    const shownNumber = (pageText.match(/\b[A-Z]{3}-[0-9][0-9-]*[0-9]\b/) || [""])[0];
    if (mail.replyTo !== VISITOR_EMAIL) problems.push("Reply-To is \"" + mail.replyTo + "\"");
    if (mail.files.length !== filled.fileCount) problems.push(filled.fileCount + " files given, " + mail.files.length + " in the mail");
    if (shownNumber !== "" && shownNumber !== reference) problems.push("the page shows " + shownNumber + ", the mail " + reference);
    result.reference = reference;
    result.files = mail.files.length;
    result.empty = findEmptyAnswers(mail.text);
    return result;
};

// *** RUN:

const main = async function () {
    const words = process.argv.slice(2);
    if (words.includes("--help")) {
        console.log(chrome.helpText(__filename));
        return;
    }
    try {
        execFileSync("php", ["-v"], { stdio: "ignore" });
    } catch (error) {
        console.error("PHP is not found: send-forms.js runs the mail service with php -S.");
        process.exit(2);
    }

    const forms = listForms(words);
    if (forms.length === 0) {
        console.error("No form of " + FORMS_FOLDER + " has these words: " + words.join(", "));
        process.exit(2);
    }

    const tempFolder = fs.mkdtempSync(path.join(os.tmpdir(), "send-forms-"));
    const serviceFolder = createServiceCopy(tempFolder);
    const service = await startService(tempFolder);
    const pages = {};
    forms.forEach(function (file) { pages["/" + FORMS_FOLDER + "/__send-" + file] = preparePage(file, service.url); });
    const server = await chrome.startServer({ pages });
    server.base = "http://127.0.0.1:" + server.address().port;
    const browser = await chrome.launchChrome();
    const run = chrome.startRun("send-forms");

    let failCount = 0;
    try {
        for (const file of forms) {
            const result = await checkForm(browser, server, serviceFolder, file);
            if (result.problems.length > 0) {
                failCount++;
                console.log("FAIL  " + result.name + ": " + result.problems.join("; "));
            } else {
                console.log("SENT  " + result.name + "  " + result.reference + ", " + result.files + " files");
            }
            if (result.empty.length > 0) console.log("      empty: " + result.empty.join(", "));
            run.noteOthers();
        }
    } finally {
        await browser.close();
        server.close();
        service.php.kill();
        fs.rmSync(tempFolder, { recursive: true, force: true });
        if (run.hasOthers()) console.log(run.describeOthers());
        run.end();
    }

    console.log("\nForms: " + (forms.length - failCount) + " sent, " + failCount + " failed");
    if (failCount > 0) process.exit(1);
};

main().catch(function (error) {
    console.error(error);
    process.exit(2);
});
