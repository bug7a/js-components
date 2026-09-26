# Form Mail Service

`send-form-mail.php` sends the data of a js-form page to your e-mail address, with the same style as the
forms. No database: it needs PHP 7.4+ and a mail account on your hosting. It logs in to that account over
**SMTP** with [PHPMailer](https://github.com/PHPMailer/PHPMailer) (the `PHPMailer` folder, v7.1.1, LGPL), so
the PHP `mail()` function of the server does not have to be open.

## Setup (3 steps)

1. Create a mail account in your hosting panel for the form (ex: `no-reply@your-site.com`). Open
   `send-form-mail.php` and write your address and that account to the top of the file:

   ```php
   define("TO_EMAIL", "you@your-site.com");

   define("SMTP_HOST", "mail.your-site.com");    // "Mail client settings" of the account
   define("SMTP_USER", "no-reply@your-site.com");
   define("SMTP_PASSWORD", "the password of the account");
   define("SMTP_SECURE", "ssl");                 // "ssl" + 465 or "tls" + 587
   define("SMTP_PORT", 465);
   ```

2. Upload the file **and the `PHPMailer` folder** next to it. Ex: `https://your-site.com/service/send-form-mail.php`
   (`service/PHPMailer/PHPMailer.php`, `SMTP.php`, `Exception.php`)

3. Open the form page (`contact-form.htm`, `order-form.htm`, ...) and write that address to `SERVICE_URL`:

   ```js
   const SERVICE_URL = "https://your-site.com/service/send-form-mail.php";
   ```

That is all. Nothing else in the form page has to change.

**Check the service:** open the address in a browser. A running service answers with JSON:

```json
{ "ok": true, "service": "js-form mail service", "php": "8.2.0", "mailMethod": "smtp",
  "phpMailerFound": true, "mailFunction": false, "toEmailSet": true, "setupError": "", "setupWarning": "" }
```

`setupError` tells what is still missing (the address, the SMTP account, the PHPMailer folder).
`setupWarning` does not stop the service, but tells a setting that can lose the mails: a `FROM_EMAIL` on
another domain than `SMTP_USER` (the form says "sent", but Gmail and others drop or spam the mail).

**Check the SMTP login:** set `DEBUG_MODE` to `true`, then open `send-form-mail.php?check=smtp`. It logs in to
the account and sends nothing: `{"ok":true,"smtp":"The login works: ..."}` or the SMTP error. In
`DEBUG_MODE` a failed form post also answers with the SMTP error. Set it back to `false` when it works.

## Settings

All of them are at the top of the file, above the `SETTINGS END` line.

| Setting | What it does |
|---|---|
| `TO_EMAIL` | Where the mails are sent. More than one: `"a@site.com, b@site.com"` |
| `MAIL_METHOD` | `"smtp"` (default): logs in to `SMTP_USER` with PHPMailer. `"mail"`: the PHP `mail()` function of the server (the `PHPMailer` folder is then not needed). |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SECURE`, `SMTP_PORT` | The mail account the mails are sent from. |
| `SMTP_VERIFY_CERTIFICATE` | `false` skips the certificate check, when `mail.your-site.com` has the certificate of the server's own name (a usual case on shared hosting). |
| `DEBUG_MODE` | Shows the SMTP error in the answer and opens `?check=smtp`. Keep it `false` on a live site. |
| `FROM_EMAIL` / `FROM_NAME` | The sender. Empty: `SMTP_USER` (smtp) or `no-reply@<your host>` (mail). Most servers only send from the account that logs in / their own domain, so do not write the visitor's address here. The visitor's address is put into **Reply-To**, so "Reply" works in your mail program. |
| `SUBJECT_PREFIX` | Written before the subject. Ex: `"[My Site] "` |
| `$ALLOWED_ORIGINS` | Which sites can post to the service (CORS). `["*"]`: all. Write your own domain to close it. |
| `$ALLOWED_FORM_NAMES` | Which forms can use it (the `formName` they send). Empty: all. |
| `MAX_FILE_SIZE`, `MAX_FILE_COUNT`, `MAX_TOTAL_FILE_SIZE`, `$ALLOWED_FILE_TYPES` | Limits of the uploaded files. |
| `HONEYPOT_FIELD` | A field that must stay empty. If a bot fills it the mail is not sent, but the answer is still "ok". |
| `RATE_LIMIT_SECONDS` | One mail in this many seconds from the same IP. `0`: off. |
| `ACCENT_COLOR`, `TEXT_COLOR`, `LOGO_URL`... | The style of the mail. The defaults are the colors of the js-form pages. |
| `SHOW_TECHNICAL_INFO` | Writes date, reference, page address, IP and browser to the end of the mail. |

## What the mail looks like

A white card with the accent color on top: the form title, the reference number and the date, then every
field as `TITLE` + value. Lists (checkboxes) become bullets, objects (basket, totals) become small lists,
`true`/`false` become `Yes`/`No` and empty answers become `—`. Uploaded files are listed and are also
attached to the mail. Every mail also has a plain text version.

## Which forms already use it

| Form | What it sends |
|---|---|
| `basic-form.htm`, `contact-form.htm` | JSON |
| `dark-contact-form.htm` | JSON (the contact form on a dark page, with a topic question) |
| `appointment-form.htm`, `order-form.htm` | JSON |
| `feedback-form.htm` | JSON + screenshots |
| `recruitment-form.htm` | JSON + CV |
| `support-ticket-form.htm` | JSON + attachments, and shows the ticket number from the answer |
| `event-registration-form.htm` | JSON + student ID files |

`contact-form.htm` posts to Supabase by default. To send the mail instead, write the address to
`SERVICE_URL` and use `sendFormToMailService(json)` in `onSendClick`.

## Using it in your own form

```js
const response = await fetch(SERVICE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ formName: "contact", formTitle: "Contact Form", fields: json }),
});
const isSent = response.ok;
```

`json` is the list the Form component gives to `onSendClick`:
`[ { key, type, titleText, inputValue }, ... ]`

With files, post `FormData` instead:

```js
const formData = new FormData();
formData.append("formName", "support-ticket");
formData.append("formTitle", "Support Ticket");
formData.append("referencePrefix", "TCK");      // The answer becomes TCK-482913
formData.append("fields", JSON.stringify(json));
files.forEach(function (info) { formData.append("attachments[]", info.file, info.name); });
await fetch(SERVICE_URL, { method: "POST", body: formData });
```

**The file field name must end with `[]`.** PHP only keeps the last file of a repeated name without it.

A flat object (`{ first_name: "...", email: "..." }`) and a normal HTML form post also work; the titles are
then created from the field names (`first_name` → `First Name`).

## The answer

| | |
|---|---|
| Success | `{ "ok": true, "reference": "MSG-482913" }` with HTTP 200 |
| Error | `{ "ok": false, "error": "..." }` with HTTP 400 / 403 / 405 / 413 / 415 / 429 / 500 |

`reference` is the number written in the mail. Send `referencePrefix` to change the `MSG` part.
(`ticketNumber` is the same value, for the older form pages.)

## If the mail does not arrive

- **Check the spam folder first.** A mail sent from `no-reply@your-site.com` with the visitor's address in
  Reply-To is the safest setup; do not put the visitor's address into `FROM_EMAIL`.
- `{"ok":false,"error":"The mail could not be sent by the server."}`: turn `DEBUG_MODE` on and open
  `?check=smtp` (the error is also written to the PHP error log):
  - `Could not authenticate`: the user or password is wrong. `SMTP_USER` is the full address.
  - `Could not connect to SMTP host` / a timeout: the host or the port is wrong, or the hosting closes that
    port. Try `"tls"` + `587`, or `SMTP_HOST` `"localhost"` with `""` + `25`.
  - A certificate error (`certificate verify failed`, `peer name`): set `SMTP_VERIFY_CERTIFICATE` to `false`,
    or write the server's own host name (from the hosting panel) to `SMTP_HOST`.
  - The mail is rejected (`Sender address rejected`): `FROM_EMAIL` must be the account itself; leave it empty.
- **The service answers HTTP 500 with an empty body.** PHP stopped with a fatal error (usually the old
  version of the file, which calls `mail()` on a server without it). Upload this version and the `PHPMailer`
  folder.
- The browser console shows a CORS error: the form page and the service are on different domains. Write the
  address of the form page to `$ALLOWED_ORIGINS`.
- Big uploads stop with HTTP 413: also check `upload_max_filesize` and `post_max_size` in your `php.ini`.

## Security notes

- The service is open to the internet: keep `RATE_LIMIT_SECONDS` on, and write your own domain to
  `$ALLOWED_ORIGINS` and the form names to `$ALLOWED_FORM_NAMES` when you are ready.
- Add a hidden `website` field (the honeypot) to your own forms to stop simple bots.
- The SMTP password is in the PHP file. The server runs the file and never shows its text, but do not put
  your real password into a public repository.
- The values are escaped before they are written to the mail, and new lines are removed from the mail
  headers, so a form answer can not add a new header.
- A mail service can not check prices, dates or stock. For an order or a booking, check them on your own
  server too.
