# Form Mail Service

`send-form-mail.php` sends the data of a js-form page to your e-mail address, with the same style as the
forms. One file, no dependencies, no database: it only needs PHP 7.4+ and a working `mail()` function
(almost every shared hosting has one).

## Setup (3 steps)

1. Open `send-form-mail.php` and write your address to the top of the file:

   ```php
   define("TO_EMAIL", "you@your-site.com");
   ```

2. Upload the file to your server. Ex: `https://your-site.com/service/send-form-mail.php`

3. Open the form page (`contact-form.htm`, `order-form.htm`, ...) and write that address to `SERVICE_URL`:

   ```js
   const SERVICE_URL = "https://your-site.com/service/send-form-mail.php";
   ```

That is all. Nothing else in the form page has to change.

**Check the service:** open the address in a browser. A running service answers with JSON:

```json
{ "ok": true, "service": "js-form mail service", "php": "8.2.0", "mailFunction": true, "toEmailSet": true }
```

`toEmailSet: false` means step 1 was not done.

## Settings

All of them are at the top of the file, above the `SETTINGS END` line.

| Setting | What it does |
|---|---|
| `TO_EMAIL` | Where the mails are sent. More than one: `"a@site.com, b@site.com"` |
| `FROM_EMAIL` / `FROM_NAME` | The sender. Empty: `no-reply@<your host>`. Most servers only send from their own domain, so do not write the visitor's address here. The visitor's address is put into **Reply-To**, so "Reply" works in your mail program. |
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
- Open the service address in the browser: `mailFunction: false` means `mail()` is closed on your hosting.
  Ask your hosting company, or use an SMTP library (PHPMailer) inside `sendMail()`.
- `{"ok":false,"error":"The mail could not be sent by the server."}`: `mail()` returned false. Usually the
  `From` address does not belong to the domain of the server.
- The browser console shows a CORS error: the form page and the service are on different domains. Write the
  address of the form page to `$ALLOWED_ORIGINS`.
- Big uploads stop with HTTP 413: also check `upload_max_filesize` and `post_max_size` in your `php.ini`.

## Security notes

- The service is open to the internet: keep `RATE_LIMIT_SECONDS` on, and write your own domain to
  `$ALLOWED_ORIGINS` and the form names to `$ALLOWED_FORM_NAMES` when you are ready.
- Add a hidden `website` field (the honeypot) to your own forms to stop simple bots.
- The values are escaped before they are written to the mail, and new lines are removed from the mail
  headers, so a form answer can not add a new header.
- A mail service can not check prices, dates or stock. For an order or a booking, check them on your own
  server too.
