<?php
/* Bismillah */

/*

Form Mail Service - v26.09

- Sends the data of a js-form page as an e-mail, with the same style as the forms.
- One file, no dependencies. It only needs PHP 7.4+ and a working mail() function.

USAGE:
1. Write your e-mail address to TO_EMAIL below. (The other settings are optional.)
2. Upload this file to your server. Ex: https://your-site.com/service/send-form-mail.php
3. Write that URL to the SERVICE_URL constant of the form page. Nothing else is needed.

WHAT IT ACCEPTS:
- application/json  : [ { key, type, titleText, inputValue }, ... ]          (js-form Form JSON)
                      { formName, formTitle, fields: [ ... ] }              (the same, with a title)
                      { first_name: "...", email: "..." }                   (a flat object)
- multipart/form-data : a JSON string in a field (fields, formJSON, ticket, application...)
                        + the uploaded files + formName / formTitle / referencePrefix
  NOTE: Send more than one file with a name that ends with "[]". Ex: "attachments[]"

WHAT IT ANSWERS (always JSON):
- Success : { "ok": true,  "reference": "MSG-482913" }   HTTP 200
- Error   : { "ok": false, "error": "..." }              HTTP 4xx / 5xx

Started Date: September 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

// *** SETTINGS: ***************************************************************

// Where the form mails are sent. More than one address: "a@site.com, b@site.com"
define("TO_EMAIL", "you@your-site.com");

// The sender of the mail. Empty: "no-reply@<your server host>"
// WHY: Most servers only send mails from their own domain. Do not write the visitor's address here;
//      the visitor's address is put into Reply-To, so "Reply" in your mail program works.
define("FROM_EMAIL", "");
define("FROM_NAME", "Web Form");

// Written before the mail subject. Ex: "[My Site] "
define("SUBJECT_PREFIX", "");

// Which sites can post to this service (CORS). ["*"]: all sites.
// Ex: ["https://your-site.com", "https://www.your-site.com"]
$ALLOWED_ORIGINS = ["*"];

// Which forms can use this service (the formName they send). Empty: all forms.
// Ex: ["contact", "support-ticket"]
$ALLOWED_FORM_NAMES = [];

// Uploaded files.
define("MAX_FILE_SIZE", 5 * 1024 * 1024); // 5 MB for one file
define("MAX_FILE_COUNT", 8);
define("MAX_TOTAL_FILE_SIZE", 15 * 1024 * 1024);
$ALLOWED_FILE_TYPES = ["pdf", "doc", "docx", "odt", "rtf", "txt", "csv", "png", "jpg", "jpeg", "gif", "webp", "heic", "zip"];

// A field with this name must stay empty. (Spam bots fill every field.)
// The mail is not sent, but the answer is "ok", so the bot does not try again.
define("HONEYPOT_FIELD", "website");

// One mail in this many seconds from the same IP. 0: off.
define("RATE_LIMIT_SECONDS", 15);

// Mail style. The default colors are the colors of the js-form pages.
define("ACCENT_COLOR", "#65A293");
define("TEXT_COLOR", "#373836");
define("LABEL_COLOR", "#999999");
define("LINE_COLOR", "#EEEEEE");
define("PAGE_COLOR", "#F4F5F4");
define("LOGO_URL", ""); // Ex: "https://your-site.com/logo.png" (max 160px wide is good)

// Write the visitor's IP, browser and page address to the end of the mail.
define("SHOW_TECHNICAL_INFO", true);

// *** SETTINGS END ************************************************************

// WHY: A PHP notice or warning in the output breaks the JSON answer.
@ini_set("display_errors", "0");
error_reporting(E_ALL);

header("Vary: Origin");
header("X-Content-Type-Options: nosniff");

// *** CORS:

$origin = isset($_SERVER["HTTP_ORIGIN"]) ? $_SERVER["HTTP_ORIGIN"] : "";

if ($origin !== "") {
    if (in_array("*", $ALLOWED_ORIGINS, true)) {
        header("Access-Control-Allow-Origin: *");
    } else if (in_array($origin, $ALLOWED_ORIGINS, true)) {
        header("Access-Control-Allow-Origin: " . $origin);
    } else {
        answer(403, ["ok" => false, "error" => "This site can not use the service."]);
    }
}

// Preflight of a JSON post.
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Access-Control-Max-Age: 86400");
    answer(204, null);
}

// Open the address in a browser to see if the service is running.
if ($_SERVER["REQUEST_METHOD"] === "GET") {
    answer(200, [
        "ok" => true,
        "service" => "js-form mail service",
        "version" => "26.09",
        "php" => PHP_VERSION,
        "mailFunction" => function_exists("mail"),
        "toEmailSet" => (TO_EMAIL !== "" && TO_EMAIL !== "you@your-site.com"),
    ]);
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    answer(405, ["ok" => false, "error" => "Only POST is accepted."]);
}

if (TO_EMAIL === "" || TO_EMAIL === "you@your-site.com") {
    answer(500, ["ok" => false, "error" => "The service is not ready: write your address to TO_EMAIL."]);
}

// WHY: Many hosting companies (LiteSpeed / cPanel are the usual ones) do not give the mail()
//      function and want SMTP instead. Calling it then stops PHP with a fatal error and the
//      answer is an empty 500: the form only says "could not be sent" and nothing tells you why.
//      Open this address in a browser: "mailFunction" says whether the server has it.
if (!function_exists("mail")) {
    answer(500, ["ok" => false, "error" => "This server does not have the PHP mail() function. Ask your hosting company to turn it on, or send the mail over SMTP."]);
}

// *** READ THE POSTED DATA:

$contentType = isset($_SERVER["CONTENT_TYPE"]) ? strtolower($_SERVER["CONTENT_TYPE"]) : "";
$isJsonPost = (strpos($contentType, "application/json") !== false);

$formName = "";
$formTitle = "";
$referencePrefix = "MSG";
$fields = [];
$honeypotValue = "";

if ($isJsonPost) {

    $raw = file_get_contents("php://input");
    if ($raw === false || $raw === "") answer(400, ["ok" => false, "error" => "Empty request."]);

    $data = json_decode($raw, true);
    if (!is_array($data)) answer(400, ["ok" => false, "error" => "The data is not valid JSON."]);

    if (isJsonFieldList($data)) {

        // [ { key, type, titleText, inputValue }, ... ]
        $fields = $data;

    } else {

        // { formName, formTitle, fields: [...] } or a flat object.
        $formName = isset($data["formName"]) ? (string)$data["formName"] : "";
        $formTitle = isset($data["formTitle"]) ? (string)$data["formTitle"] : "";
        if (isset($data["referencePrefix"])) $referencePrefix = (string)$data["referencePrefix"];
        if (isset($data[HONEYPOT_FIELD])) $honeypotValue = (string)$data[HONEYPOT_FIELD];

        if (isset($data["fields"]) && isJsonFieldList($data["fields"])) {
            $fields = $data["fields"];
        } else {
            $fields = fieldsFromFlatData($data, ["formName", "formTitle", "referencePrefix", HONEYPOT_FIELD]);
        }

    }

} else {

    // multipart/form-data (or a normal form post)
    if (isset($_POST["formName"])) $formName = (string)$_POST["formName"];
    if (isset($_POST["formTitle"])) $formTitle = (string)$_POST["formTitle"];
    if (isset($_POST["referencePrefix"])) $referencePrefix = (string)$_POST["referencePrefix"];
    if (isset($_POST[HONEYPOT_FIELD])) $honeypotValue = (string)$_POST[HONEYPOT_FIELD];

    $usedKeys = ["formName", "formTitle", "referencePrefix", HONEYPOT_FIELD];

    // The form JSON is in one of the fields. (fields, formJSON, ticket, application, registration...)
    foreach ($_POST as $postKey => $postValue) {
        if (in_array($postKey, $usedKeys, true) || !is_string($postValue)) continue;
        $parsed = json_decode($postValue, true);
        if (isJsonFieldList($parsed)) {
            $fields = $parsed;
            $usedKeys[] = $postKey;
            break;
        }
    }

    // The other posted fields are added as they are. (A normal HTML form also works.)
    $rest = [];
    foreach ($_POST as $postKey => $postValue) {
        if (in_array($postKey, $usedKeys, true)) continue;
        $rest[$postKey] = $postValue;
    }
    if (count($rest) > 0) $fields = array_merge($fields, fieldsFromFlatData($rest, []));

}

// A bot filled the hidden field: do not send a mail, but do not show an error either.
if (trim($honeypotValue) !== "") {
    answer(200, ["ok" => true, "reference" => ""]);
}

if (count($fields) === 0) {
    answer(400, ["ok" => false, "error" => "There is no form data in the request."]);
}

if (count($ALLOWED_FORM_NAMES) > 0 && !in_array($formName, $ALLOWED_FORM_NAMES, true)) {
    answer(403, ["ok" => false, "error" => "This form can not use the service."]);
}

checkRateLimit();

// *** FILES:

$attachments = [];
$totalFileSize = 0;

foreach ($_FILES as $fileKey => $fileInfo) {

    // One field can hold one file or a list of files ("attachments[]").
    $names = is_array($fileInfo["name"]) ? $fileInfo["name"] : [$fileInfo["name"]];
    $tmpNames = is_array($fileInfo["tmp_name"]) ? $fileInfo["tmp_name"] : [$fileInfo["tmp_name"]];
    $sizes = is_array($fileInfo["size"]) ? $fileInfo["size"] : [$fileInfo["size"]];
    $errors = is_array($fileInfo["error"]) ? $fileInfo["error"] : [$fileInfo["error"]];

    for ($i = 0; $i < count($names); $i++) {

        if ($errors[$i] === UPLOAD_ERR_NO_FILE) continue;
        if ($errors[$i] !== UPLOAD_ERR_OK) answer(400, ["ok" => false, "error" => "A file could not be uploaded."]);

        $name = cleanFileName($names[$i]);
        $extension = strtolower(pathinfo($name, PATHINFO_EXTENSION));

        if (!in_array($extension, $ALLOWED_FILE_TYPES, true)) {
            answer(415, ["ok" => false, "error" => "This file type is not accepted: ." . $extension]);
        }
        if ($sizes[$i] > MAX_FILE_SIZE) {
            answer(413, ["ok" => false, "error" => "The file is too big: " . $name]);
        }
        if (!is_uploaded_file($tmpNames[$i])) {
            answer(400, ["ok" => false, "error" => "A file could not be read."]);
        }

        $totalFileSize += $sizes[$i];
        if (count($attachments) >= MAX_FILE_COUNT || $totalFileSize > MAX_TOTAL_FILE_SIZE) {
            answer(413, ["ok" => false, "error" => "The files are too big."]);
        }

        $content = file_get_contents($tmpNames[$i]);
        if ($content === false) answer(400, ["ok" => false, "error" => "A file could not be read."]);

        $attachments[] = [
            "name" => $name,
            "field" => (string)$fileKey,
            "size" => (int)$sizes[$i],
            "type" => mimeTypeOf($extension),
            "content" => $content,
        ];

    }

}

// *** BUILD AND SEND THE MAIL:

if ($formTitle === "") $formTitle = ($formName !== "") ? prettifyKey($formName) : "Web Form";

$reference = strtoupper(cleanHeader($referencePrefix !== "" ? $referencePrefix : "MSG"));
$reference = preg_replace("/[^A-Z0-9\-]/", "", $reference);
if ($reference === "") $reference = "MSG";
$reference .= "-" . str_pad((string)random_int(100000, 999999), 6, "0", STR_PAD_LEFT);

$replyTo = findEmail($fields);
$subject = SUBJECT_PREFIX . $formTitle . " - " . $reference;
$summary = findSummary($fields);
if ($summary !== "") $subject = SUBJECT_PREFIX . $formTitle . ": " . $summary;

$htmlBody = buildHtmlMail($formTitle, $reference, $fields, $attachments);
$textBody = buildTextMail($formTitle, $reference, $fields, $attachments);

$fromEmail = FROM_EMAIL;
if ($fromEmail === "") {
    $host = isset($_SERVER["HTTP_HOST"]) ? (string)$_SERVER["HTTP_HOST"] : "localhost";
    $host = explode(":", $host)[0]; // WHY: "site.com:8080" -> "site.com" (the port is not part of the address)
    $host = preg_replace("/[^a-zA-Z0-9\.\-]/", "", $host);
    $host = preg_replace("/^www\./", "", $host);
    if ($host === "") $host = "localhost";
    $fromEmail = "no-reply@" . $host;
}

$isSent = sendMail(TO_EMAIL, $subject, $htmlBody, $textBody, $fromEmail, FROM_NAME, $replyTo, $attachments);

if (!$isSent) {
    answer(500, ["ok" => false, "error" => "The mail could not be sent by the server."]);
}

answer(200, ["ok" => true, "reference" => $reference, "ticketNumber" => $reference]);

// *** FUNCTIONS: **************************************************************

// Answers with JSON and stops. ($data null: no body)
function answer($status, $data) {

    http_response_code($status);

    if ($data !== null) {
        header("Content-Type: application/json; charset=utf-8");
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    exit;

}

// Is it the JSON of a js-form Form? [ { key, ... }, ... ]
function isJsonFieldList($data) {

    if (!is_array($data) || count($data) === 0) return false;
    if (array_keys($data) !== range(0, count($data) - 1)) return false; // Not a list

    foreach ($data as $item) {
        if (!is_array($item) || !isset($item["key"])) return false;
    }

    return true;

}

// { first_name: "Bugra" } -> [ { key: "first_name", titleText: "First Name", inputValue: "Bugra" } ]
function fieldsFromFlatData($data, $skipKeys) {

    $fields = [];

    foreach ($data as $key => $value) {
        if (in_array($key, $skipKeys, true)) continue;
        $fields[] = [
            "key" => (string)$key,
            "type" => "text",
            "titleText" => prettifyKey((string)$key),
            "inputValue" => $value,
        ];
    }

    return $fields;

}

// "first_name" -> "First Name"
function prettifyKey($key) {

    $text = preg_replace("/([a-z0-9])([A-Z])/", "$1 $2", $key); // firstName -> first Name
    $text = str_replace(["_", "-", "."], " ", $text);
    $text = trim(preg_replace("/\s+/", " ", $text));

    if ($text === "") return $key;

    // WHY: mbstring is not installed on every server.
    return function_exists("mb_convert_case") ? mb_convert_case($text, MB_CASE_TITLE, "UTF-8") : ucwords($text);

}

// The title of a field, without HTML tags.
function fieldTitle($field) {

    $title = isset($field["titleText"]) ? (string)$field["titleText"] : "";
    $title = trim(strip_tags($title));
    if ($title === "") $title = prettifyKey(isset($field["key"]) ? (string)$field["key"] : "");

    return ($title === "") ? "-" : $title;

}

// Is the value empty? (0 and "0" are not empty.)
function isEmptyValue($value) {

    if ($value === null) return true;
    if (is_bool($value)) return false;
    if (is_array($value)) return count($value) === 0;

    return (trim((string)$value) === "");

}

// The value as plain text. (Arrays and objects are written line by line.)
function valueToText($value, $depth = 0) {

    if (is_bool($value)) return $value ? "Yes" : "No";
    if ($value === null) return "-";
    if (is_scalar($value)) return (string)$value;

    if (is_array($value)) {

        if (count($value) === 0) return "-";

        $isList = (array_keys($value) === range(0, count($value) - 1));
        $lines = [];

        foreach ($value as $key => $item) {
            $text = valueToText($item, $depth + 1);
            $lines[] = $isList ? ("- " . $text) : (prettifyKey((string)$key) . ": " . $text);
        }

        return implode(($depth > 0) ? ", " : "\n", $lines);

    }

    return "-";

}

// The value as HTML. (An object becomes a small list, so a basket or the totals stay readable.)
function valueToHtml($value, $depth = 0) {

    if (is_bool($value)) return $value ? "Yes" : "No";
    if ($value === null) return "&mdash;";

    if (is_scalar($value)) {
        $text = trim((string)$value);
        if ($text === "") return "&mdash;";
        return nl2br(htmlspecialchars($text, ENT_QUOTES, "UTF-8"));
    }

    if (is_array($value)) {

        if (count($value) === 0) return "&mdash;";

        $isList = (array_keys($value) === range(0, count($value) - 1));
        $rows = "";

        foreach ($value as $key => $item) {

            $itemHtml = valueToHtml($item, $depth + 1);

            if ($isList) {
                $rows .= '<div style="padding:2px 0;">&bull; ' . $itemHtml . '</div>';
            } else {
                $rows .= '<div style="padding:2px 0;"><span style="color:' . LABEL_COLOR . ';">' .
                    htmlspecialchars(prettifyKey((string)$key), ENT_QUOTES, "UTF-8") . ':</span> ' . $itemHtml . '</div>';
            }

        }

        return '<div style="margin:0;">' . $rows . '</div>';

    }

    return "&mdash;";

}

// The e-mail address of the visitor, for Reply-To.
function findEmail($fields) {

    foreach ($fields as $field) {

        $type = isset($field["type"]) ? strtolower((string)$field["type"]) : "";
        $key = isset($field["key"]) ? strtolower((string)$field["key"]) : "";
        $value = isset($field["inputValue"]) ? $field["inputValue"] : "";

        if (!is_string($value)) continue;
        if ($type !== "email" && strpos($key, "email") === false && strpos($key, "mail") === false) continue;

        $value = trim($value);
        if (filter_var($value, FILTER_VALIDATE_EMAIL)) return $value;

    }

    return "";

}

// A short text for the subject: name, subject or the first short answer.
function findSummary($fields) {

    $preferred = ["subject", "title", "name", "fullname", "first_name", "firstname", "company", "orderNumber"];

    foreach ($preferred as $wanted) {
        foreach ($fields as $field) {
            $key = isset($field["key"]) ? strtolower((string)$field["key"]) : "";
            if ($key !== strtolower($wanted)) continue;
            $value = isset($field["inputValue"]) ? $field["inputValue"] : "";
            if (is_string($value) && trim($value) !== "") return shorten(trim($value), 60);
        }
    }

    return "";

}

function shorten($text, $max) {

    if (!function_exists("mb_strlen")) {
        return (strlen($text) <= $max) ? $text : (substr($text, 0, $max - 1) . "...");
    }

    if (mb_strlen($text, "UTF-8") <= $max) return $text;

    return mb_substr($text, 0, $max - 1, "UTF-8") . "…";

}

// Header injection: a new line in a header can add a new header.
function cleanHeader($text) {

    return trim(str_replace(["\r", "\n", "%0a", "%0d"], "", (string)$text));

}

function cleanFileName($name) {

    $name = basename(str_replace("\\", "/", (string)$name));
    $name = preg_replace("/[\r\n\"]/", "", $name);
    $name = trim($name);

    return ($name === "") ? "file" : shorten($name, 120);

}

function mimeTypeOf($extension) {

    $types = [
        "pdf" => "application/pdf", "doc" => "application/msword",
        "docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "odt" => "application/vnd.oasis.opendocument.text", "rtf" => "application/rtf",
        "txt" => "text/plain", "csv" => "text/csv", "zip" => "application/zip",
        "png" => "image/png", "jpg" => "image/jpeg", "jpeg" => "image/jpeg",
        "gif" => "image/gif", "webp" => "image/webp", "heic" => "image/heic",
    ];

    return isset($types[$extension]) ? $types[$extension] : "application/octet-stream";

}

// One mail in RATE_LIMIT_SECONDS from the same IP.
function checkRateLimit() {

    if (RATE_LIMIT_SECONDS <= 0) return;

    $ip = isset($_SERVER["REMOTE_ADDR"]) ? $_SERVER["REMOTE_ADDR"] : "";
    if ($ip === "") return;

    $file = sys_get_temp_dir() . "/js-form-mail-" . md5($ip) . ".txt";
    $last = @file_get_contents($file);

    if ($last !== false && (time() - (int)$last) < RATE_LIMIT_SECONDS) {
        answer(429, ["ok" => false, "error" => "Please wait a little before sending again."]);
    }

    @file_put_contents($file, (string)time());

}

// *** MAIL CONTENT:

function buildHtmlMail($formTitle, $reference, $fields, $attachments) {

    $rows = "";

    foreach ($fields as $field) {

        $value = isset($field["inputValue"]) ? $field["inputValue"] : "";
        $title = htmlspecialchars(fieldTitle($field), ENT_QUOTES, "UTF-8");
        $valueHtml = isEmptyValue($value) ? '<span style="color:' . LABEL_COLOR . ';">&mdash;</span>' : valueToHtml($value);

        $rows .=
            '<tr>' .
                '<td style="padding:14px 0 4px 0;border-top:1px solid ' . LINE_COLOR . ';font-size:12px;' .
                    'letter-spacing:0.5px;text-transform:uppercase;color:' . LABEL_COLOR . ';">' . $title . '</td>' .
            '</tr>' .
            '<tr>' .
                '<td style="padding:0 0 12px 0;font-size:15px;line-height:1.5;color:' . TEXT_COLOR . ';">' . $valueHtml . '</td>' .
            '</tr>';

    }

    $fileRows = "";

    if (count($attachments) > 0) {

        $items = "";
        foreach ($attachments as $file) {
            $items .= '<div style="padding:3px 0;font-size:14px;color:' . TEXT_COLOR . ';">&bull; ' .
                htmlspecialchars($file["name"], ENT_QUOTES, "UTF-8") .
                ' <span style="color:' . LABEL_COLOR . ';">(' . formatSize($file["size"]) . ')</span></div>';
        }

        $fileRows =
            '<tr>' .
                '<td style="padding:14px 0 4px 0;border-top:1px solid ' . LINE_COLOR . ';font-size:12px;' .
                    'letter-spacing:0.5px;text-transform:uppercase;color:' . LABEL_COLOR . ';">Files</td>' .
            '</tr>' .
            '<tr><td style="padding:0 0 12px 0;">' . $items . '</td></tr>';

    }

    $logo = (LOGO_URL !== "")
        ? '<img src="' . htmlspecialchars(LOGO_URL, ENT_QUOTES, "UTF-8") . '" alt="" width="120" style="display:block;border:0;margin:0 auto 14px auto;">'
        : "";

    $technical = "";

    if (SHOW_TECHNICAL_INFO) {

        $lines = [
            "Date: " . date("d.m.Y H:i"),
            "Reference: " . $reference,
        ];
        if (isset($_SERVER["HTTP_REFERER"])) $lines[] = "Page: " . htmlspecialchars($_SERVER["HTTP_REFERER"], ENT_QUOTES, "UTF-8");
        if (isset($_SERVER["REMOTE_ADDR"])) $lines[] = "IP: " . htmlspecialchars($_SERVER["REMOTE_ADDR"], ENT_QUOTES, "UTF-8");
        if (isset($_SERVER["HTTP_USER_AGENT"])) $lines[] = "Browser: " . htmlspecialchars(shorten($_SERVER["HTTP_USER_AGENT"], 160), ENT_QUOTES, "UTF-8");

        $technical = '<div style="margin-top:18px;font-size:12px;line-height:1.7;color:' . LABEL_COLOR . ';">' .
            implode("<br>", $lines) . '</div>';

    }

    return
'<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:' . PAGE_COLOR . ';">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:' . PAGE_COLOR . ';padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:640px;background:#FFFFFF;border-radius:8px;overflow:hidden;font-family:\'Open Sans\',Helvetica,Arial,sans-serif;">

<tr><td style="height:6px;background:' . ACCENT_COLOR . ';font-size:0;line-height:0;">&nbsp;</td></tr>

<tr><td style="padding:28px 32px 8px 32px;text-align:center;">' . $logo .
'<div style="font-size:22px;font-weight:bold;color:' . TEXT_COLOR . ';">' . htmlspecialchars($formTitle, ENT_QUOTES, "UTF-8") . '</div>
<div style="margin-top:6px;font-size:13px;color:' . LABEL_COLOR . ';">' . htmlspecialchars($reference, ENT_QUOTES, "UTF-8") . ' &middot; ' . date("d.m.Y H:i") . '</div>
</td></tr>

<tr><td style="padding:12px 32px 24px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' . $rows . $fileRows . '</table>' . $technical . '
</td></tr>

<tr><td style="padding:14px 32px 22px 32px;border-top:1px solid ' . LINE_COLOR . ';text-align:center;font-size:12px;color:' . LABEL_COLOR . ';">
This mail was sent by the form on your web site.
</td></tr>

</table>
</td></tr>
</table>
</body></html>';

}

function buildTextMail($formTitle, $reference, $fields, $attachments) {

    $lines = [];
    $lines[] = strtoupper($formTitle);
    $lines[] = $reference . " - " . date("d.m.Y H:i");
    $lines[] = str_repeat("-", 48);

    foreach ($fields as $field) {
        $value = isset($field["inputValue"]) ? $field["inputValue"] : "";
        $lines[] = fieldTitle($field) . ":";
        $lines[] = isEmptyValue($value) ? "-" : valueToText($value);
        $lines[] = "";
    }

    if (count($attachments) > 0) {
        $lines[] = "FILES:";
        foreach ($attachments as $file) {
            $lines[] = "- " . $file["name"] . " (" . formatSize($file["size"]) . ")";
        }
        $lines[] = "";
    }

    if (SHOW_TECHNICAL_INFO && isset($_SERVER["REMOTE_ADDR"])) {
        $lines[] = str_repeat("-", 48);
        $lines[] = "IP: " . $_SERVER["REMOTE_ADDR"];
        if (isset($_SERVER["HTTP_REFERER"])) $lines[] = "Page: " . $_SERVER["HTTP_REFERER"];
    }

    return implode("\n", $lines);

}

function formatSize($bytes) {

    if ($bytes >= 1048576) return round($bytes / 1048576, 1) . " MB";
    if ($bytes >= 1024) return round($bytes / 1024) . " KB";

    return $bytes . " B";

}

// *** MAIL SENDING:

function sendMail($to, $subject, $htmlBody, $textBody, $fromEmail, $fromName, $replyTo, $attachments) {

    $to = cleanHeader($to);
    $fromEmail = cleanHeader($fromEmail);
    $fromName = cleanHeader($fromName);
    $replyTo = cleanHeader($replyTo);

    $boundaryMixed = "mix_" . bin2hex(random_bytes(12));
    $boundaryAlternative = "alt_" . bin2hex(random_bytes(12));

    // HEADERS:
    $headers = [];
    $headers[] = "MIME-Version: 1.0";
    $headers[] = "From: " . encodeHeaderText($fromName) . " <" . $fromEmail . ">";
    if ($replyTo !== "") $headers[] = "Reply-To: " . $replyTo;
    $headers[] = "X-Mailer: js-form mail service";
    $headers[] = "Content-Type: multipart/mixed; boundary=\"" . $boundaryMixed . "\"";

    // BODY:
    $body = "";

    // Text + HTML
    $body .= "--" . $boundaryMixed . "\r\n";
    $body .= "Content-Type: multipart/alternative; boundary=\"" . $boundaryAlternative . "\"\r\n\r\n";

    $body .= "--" . $boundaryAlternative . "\r\n";
    $body .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $body .= "Content-Transfer-Encoding: base64\r\n\r\n";
    $body .= chunk_split(base64_encode($textBody)) . "\r\n";

    $body .= "--" . $boundaryAlternative . "\r\n";
    $body .= "Content-Type: text/html; charset=UTF-8\r\n";
    $body .= "Content-Transfer-Encoding: base64\r\n\r\n";
    $body .= chunk_split(base64_encode($htmlBody)) . "\r\n";

    $body .= "--" . $boundaryAlternative . "--\r\n\r\n";

    // Files
    foreach ($attachments as $file) {
        $body .= "--" . $boundaryMixed . "\r\n";
        $body .= "Content-Type: " . $file["type"] . "; name=\"" . $file["name"] . "\"\r\n";
        $body .= "Content-Transfer-Encoding: base64\r\n";
        $body .= "Content-Disposition: attachment; filename=\"" . $file["name"] . "\"\r\n\r\n";
        $body .= chunk_split(base64_encode($file["content"])) . "\r\n";
    }

    $body .= "--" . $boundaryMixed . "--";

    $encodedSubject = encodeHeaderText($subject);

    // WHY: The 5th parameter (envelope sender) is not allowed on every server; try it, then try without it.
    $isSent = @mail($to, $encodedSubject, $body, implode("\r\n", $headers), "-f" . $fromEmail);
    if (!$isSent) $isSent = @mail($to, $encodedSubject, $body, implode("\r\n", $headers));

    return $isSent;

}

// UTF-8 subject and name for the mail headers. (RFC 2047)
function encodeHeaderText($text) {

    $text = cleanHeader($text);
    if ($text === "") return "";
    if (preg_match("/^[\x20-\x7E]*$/", $text)) return $text; // Only ASCII

    return "=?UTF-8?B?" . base64_encode($text) . "?=";

}
