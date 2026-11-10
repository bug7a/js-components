# Mobile App Templates

Ready-made mobile apps built with [basic.js](../../basic/) and OzdenUI. Pick the template closest to your
app, copy it, and change its settings, data and pages. There is no build step: the app is plain HTML and JavaScript, and
Capacitor or Cordova wraps it into an Android or iOS app.

| Template | What it is | Design width | Language |
|---|---|---|---|
| [`starter`](starter/) | The plain frame: tabs, pages, side menu, sheets. Start here for your own app. | 390 px | English |
| [`classic`](classic/) | The look of the old javascript-mobile-app-template, with many component examples. | 600 px | English |
| [`shop`](shop/) | A full store: catalog, product page, cart, checkout, orders, favorites. | 390 px | English, Turkish |
| [`booking`](booking/) | Appointments: services, people, free times, changing and cancelling. | 390 px | English, Turkish |
| [`coffee-shop`](coffee-shop/) | A small ordering app with a loyalty card. | 390 px | Turkish |

Each template has its own `readme.md` with its pages and the files to change.

> **Status:** the templates are tested in Chrome, with phone emulation. They have not been built into a native app or
> run on a real device yet, so test your app on real phones before you release it. The steps below follow the official
> Capacitor and Cordova guides.

## Try a template

The templates load the library and the components from the root of this repository, so they need a web server and the
whole repository:

1. Open the repository root with a web server (the VS Code Live Server extension, port 5505).
2. Go to `http://127.0.0.1:5505/04-templates/mobile-app-template/shop/index.htm`.
3. To see it as a phone, turn on the device toolbar of your browser's developer tools.

The saved data of an app is in the browser (`localStorage`). `shop`, `booking` and `coffee-shop` work without a server.

## How a template is organized

| File | What it holds |
|---|---|
| `index.htm` | Loads the library, the components, the app and the pages. |
| `app/settings.js` | **Change this first:** the name, the colors, the tabs, `storageKey`. |
| `app/app.js` | The frame: tabs, pages, the back button, sheets, safe areas. You rarely need to change it. |
| `pages/*.js` | The pages. A page is one `App.addPage({ id, title, create })`. |
| `assets/` | Icons and pictures. |

`starter/readme.md` explains how to add a page and lists what `App` gives you.

## Screen sizes

An app is drawn at a fixed design width and scaled to the screen with `page.fit()`:

- Write every size in px of the design. A smaller phone shows the same layout a little smaller, with the same line breaks.
- The 390 px templates use `page.fit(390, 480)`: above 480 px the app stops growing and stays in the middle of the screen.
- `classic` uses `page.fit(600, 800)`, and sets `basic.uiScale` so that dialogs and toasts keep their size on the screen.

Small text scales too: 12 px in the design is about 10 px on a 320 px phone. Check your smallest texts on a small phone.

## Make a standalone copy

A native app needs all its files in one folder. `_make-standalone.sh` makes that copy without changing the template. It
copies the template and the parts of `basic/` and `comp/` it uses, and puts the components into one `comp/components.min.js`.

Run it from the repository root. It needs Node.js (`npx` downloads terser):

```sh
./_make-standalone.sh 04-templates/mobile-app-template/shop --out ~/my-app/www
```

Without `--out`, the copy goes to `_dist/shop/`. `--list` shows what it would do and writes nothing. Run it again after
every change: the output folder is made from scratch each time, so **do not edit files in the copy**. It refuses to clear
a non-empty folder it did not make, so remove any `www` folder that a tool created before you run it.

**Two changes are needed in the copy, every time:**

```sh
cd ~/my-app

# 1. The components are now in comp/, next to the page.
sed -i.bak 's#"../../../comp/"#"comp/"#' www/app/settings.js && rm www/app/settings.js.bak

# 2. Capacitor needs an index.html, and index.htm is the name in the templates.
mv www/index.htm www/index.html
```

If you skip the first step, the icons of the search box do not load. You can also delete files the app does not need
from the copy, such as `www/readme.md`.

Before you release, change `appName` and `storageKey` in `app/settings.js`.

## Android and iOS with Capacitor (recommended)

You need Node.js, Android Studio for Android, and a Mac with Xcode for iOS.

```sh
mkdir my-app && cd my-app
npm init -y
npm install @capacitor/core
npm install -D @capacitor/cli
npx cap init "My App" com.example.myapp --web-dir www
```

Make the standalone copy in `www` as shown above. Capacitor needs that folder to contain `index.html` before you add a
platform. Then:

```sh
npm install @capacitor/android @capacitor/ios @capacitor/app
npx cap add android
npx cap add ios
npx cap sync
npx cap open android   # or: npx cap open ios
```

Run the app from Android Studio or Xcode. After each new standalone copy, run `npx cap sync` again.

- `@capacitor/app` is what makes the Android back button work: `app/app.js` finds it by itself, no code is needed.
- Capacitor adds `window.Capacitor` to the page itself, so `index.htm` needs no script line for it. Only an old project
  with `"bundledWebRuntime": true` needs the `capacitor.js` line.
- Other plugins are used as `Capacitor.Plugins.Name`.

Guide: <https://capacitorjs.com/docs/getting-started>

## Android and iOS with Cordova

```sh
npm install -g cordova
cordova create my-app com.example.myapp "My App"
cd my-app
rm -rf www
```

Make the standalone copy in `www` as shown above, then open the `cordova.js` line in `www/index.html` (remove the comment
around it):

```html
<script src="cordova.js" type="text/javascript" charset="utf-8"></script>
```

The app waits for `deviceready` by itself when it runs in Cordova. This line is in the template as a comment, so it must
be opened again in every new copy. Add to `config.xml`:

```xml
<preference name="DisallowOverscroll" value="true" />
<preference name="Orientation" value="portrait" />
```

```sh
cordova platform add android
cordova platform add ios
cordova run android
```

Guide: <https://cordova.apache.org/docs/en/latest/guide/cli/>

## Notes for a mobile app

**The back button.** While a page, a sheet or the menu is open, the Android back button, the back of the browser and
Escape close it. With nothing open, the Android back button leaves the app.

**The notch and the home line.** `viewport-fit=cover` in `index.htm` lets the app draw under them, and `App.safeArea`
keeps the header and the tab bar out of them. It reads `env(safe-area-inset-*)`, once, when the app starts. Check this
on real Android phones: some WebView versions report wrong values for it, and apps draw edge to edge on new Android
versions.

**Orientation.** The templates are designed for portrait. Lock the app to portrait in the native project.

**The keyboard.** Check that a focused field stays visible. Android usually makes the page smaller, while iOS may move it
instead. Keep the text of a field at 16 px or more: `index.htm` also sets `maximum-scale=1.0`, because iOS zooms into
smaller fields.

**Saved data.** `App.save()` uses `localStorage`. It is fine for settings and a cart, but the system can clear it, and it
is not encrypted. Do not keep passwords or tokens there; use a secure storage plugin for those.

**A server.** The templates have no server: `shop` and `booking` only save on the device. A real shop or booking app must
check prices, stock and free times on a server. The app's code is on the phone, so it can not enforce them. Your server
must allow the origin of the app in its CORS settings (Capacitor: `https://localhost` on Android, `capacitor://localhost`
on iOS by default).

**Payments.** Do not collect card numbers in your pages. Use your payment provider's own SDK or page. The stores have
rules too: digital goods sold in an iOS or Android app usually have to use the store's in-app purchase.

**Icons and splash screen.** The native project has its own app icon and splash screen. With Capacitor,
`@capacitor/assets` makes them from one image. The launch screen in `app/app.js` shows after the native splash screen.

**Links.** Open external web pages in the system browser, not in the app's WebView: use `@capacitor/browser` or
`cordova-plugin-inappbrowser`.

**App store review.** Apple may reject an app that is only a thin wrapper around a website, so give the app real native
value. Both stores ask for a privacy policy and for a statement of the data you collect.

**Updates.** The web files are inside the app, so a change means a new store release.

## Troubleshooting

| Problem | Cause and fix |
|---|---|
| `The web directory must contain a "index.html"` | Rename `www/index.htm` to `www/index.html`. |
| The search icon is missing | Set `componentPath: "comp/"` in `www/app/settings.js`. |
| The Android back button or a plugin does nothing in Cordova | `cordova.js` is not loaded: the app then starts as a web page. Open its line in `www/index.html`. |
| The Android back button does nothing in Capacitor | Install `@capacitor/app` and run `npx cap sync`. |
| A template shows a blank page in the browser | It needs a web server and the whole repository. See "Try a template". |
| The script says it can not clear the folder | The folder has files it did not make. Remove the folder first. |
