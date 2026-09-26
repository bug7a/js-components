# Component videos (YouTube Shorts)

`tabs-short.htm` is a self-playing 9:16 demo of `comp-m4/tabs.js`, made to be screen recorded.
(`ui-effects-short.htm` is another one, see "UIEffects video" below.)
The code of every sample is written on the top half and the live component runs on the bottom
half, where a fake cursor clicks it. The code on the screen is the code that really builds the
component below it.

Open the page with Live Server (port 5505) or as a file, and record it. It plays once and stops.

| Key | What it does |
|---|---|
| `SPACE` | Pause / play |
| `R` | Play again from the start |
| `S` | Hide the small scale text at the bottom right |

## Recording it automatically (no screen recorder)

`record.js` plays the page in a headless Chrome and writes a real 1080 x 1920 mp4, so the
result does not depend on the screen, the window size or a mouse passing by. It uses the
Chrome that is already installed and gets ffmpeg from a package; nothing is installed on
the system.

```
cd __video
npm install puppeteer-core ffmpeg-static
node record.js tabs-short.htm tabs-short.mp4
```

The video of this page was made this way: 1080 x 1920, 30 fps, H.264, about 50 seconds and
under 1 MB. It can be uploaded to YouTube as it is.

The videos are **not kept in the repo**. `__video/*.mp4`, `__video/_frames/` and the
`node_modules` of the two packages above are all in `.gitignore`, so write the mp4 to
wherever you collect the videos:

```
node record.js tabs-short.htm ~/somewhere/outside/tabs-short.mp4
```

Two things the capture does to the page, both handled in `tabs-short.htm`:

- `requestAnimationFrame` is throttled hard while Chrome is being captured. The page waits
  on timers instead, or a scene would spend its whole time writing its code lines.
- Chrome sends a frame only when something changes, so the still parts of a scene produce no
  frames. `record.js` gives every frame the length up to the next one, which keeps the pacing.

## Recording it by hand

The stage is always 1080 x 1920 and is scaled to fit the window, so the layout is the same on
every screen. The percentage at the bottom right is that scale; anything under 100% means the
recording is smaller than 1080 x 1920.

The simplest way to record at full size in Chrome:

1. Open the page, then DevTools (`Cmd + Alt + I`) and the device toolbar (`Cmd + Shift + M`).
2. Choose **Responsive** and type **1080 x 1920**, zoom **100%** (the window has to be large
   enough, or set the zoom to 50% and accept a 50% recording).
3. Close DevTools, press `S` to hide the scale text, then `R` to play from the start.
4. Record the stage area (`Cmd + Shift + 5` on macOS, "Record Selected Portion").

YouTube accepts anything from 1080 x 1920 down to 540 x 960; 1080 x 1920 is the sharp one.

## The scenes

The video is about 51 seconds. Every scene holds for the `seconds` value written in its own
object in the page, so the timing below changes only if that value is changed.

| Time | Scene | What it shows |
|---|---|---|
| 0:00 - 0:01 | Intro | Title, "A tab bar in a few lines of JavaScript." |
| 0:01 - 0:08 | 1. Tabs with one call | `Tabs({ tabs: [...] })`, the cursor clicks two tabs |
| 0:08 - 0:17 | 2. Icons, counts, badges | Tab objects, `setCount()`, the badge is cleared when the tab is seen |
| 0:17 - 0:24 | 3. `variant: "pill"` | The segmented control, the filled shape moves |
| 0:24 - 0:33 | 4. Document tabs | `closable: 1` and `addButton: 1`: a tab is closed, a new one is added |
| 0:33 - 0:42 | 5. `panels: 1` | `startPanel(key)` content, the panels change with the tabs |
| 0:42 - 0:50 | 6. Style packages | `styleName: "modern"` and `"dark"` together |
| 0:50 - 0:51 | Outro | `comp-m4/tabs.js`, "One file. No dependencies." |

## Text for the upload

**Title:** Tabs in plain JavaScript - no HTML, no CSS (basic.js)

**Description:**

```
A tab bar built with basic.js: underline and pill variants, icons, counts, badges,
closable tabs, panels and style packages. No HTML markup, no CSS file, no build step.

Component: comp-m4/tabs.js
Source: https://github.com/bug7a/js-components
Samples: https://bug7a.github.io/js-components/

#javascript #webdev #frontend #ui #nocss
```

**Pinned comment idea:** the full sample page is `02-comp-m4-samples/tabs.htm`.

## UIEffects video

`ui-effects-short.htm` is the same kind of page for `comp-m4/ui-effects.js` (made from `tabs-short.htm`,
about 51 seconds). The effects listen to pointer events, so its fake cursor sends real `PointerEvent`s to
the objects (`enter()`, `click()`, `glide()`, `leave()` in the page): the effect code that runs is the
real one.

```
node record.js ui-effects-short.htm ui-effects-short.mp4
```

| Scene | What it shows |
|---|---|
| 1. `press()` | `UIEffects.press(btn, "ripple")`, two clicks at two points |
| 2. Pick a type | `lift`, `push`, `glow` on three buttons |
| 3. `fill` | An outline button fills with a color |
| 4. tilt + spotlight | A card follows the cursor |
| 5. `focusGroup()` | The other cards step back |
| 6. `play()` and `loop()` | `shake` on an input, `pulse` on a bell |

**Title:** Hover and press effects in plain JavaScript - no CSS (basic.js)

**Description:**

```
UIEffects: ripple, lift, push, glow, fill, tilt, spotlight, focus groups and attention
animations for any basic.js object, in one line of JavaScript. No CSS file, no build step.

Component: comp-m4/ui-effects.js
Source: https://github.com/bug7a/js-components
Samples: https://bug7a.github.io/js-components/

#javascript #webdev #frontend #ui #nocss
```

**Tags (besides the channel defaults):** ui effects, hover effects, button animation, ripple effect, css animation alternative

## Making one for another component

Copy `tabs-short.htm`, change the `SCENES` array and the component script in the `<head>`.
A scene is:

```js
{
    title: "What is on the screen",
    caption: "One line under the component.",
    seconds: 8,                       // How long the scene is held.
    code: ['Tabs({', '});'],          // The lines written in the code panel.
    build: function () { ... },       // Must return the component. It is removed on the next scene.
    run: async function (token) { },  // The fake cursor: await clickTab(1, token);
}
```

Keep a code line under about 50 characters: longer lines are shrunk to fit, which makes the
text smaller on a phone.
