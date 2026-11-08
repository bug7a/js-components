/* Bismillah */

/*

Tap Effect - v26.11

A soft circle where the screen is tapped. A black circle
(80 px, opacity 0.05) comes in the middle of the tap, fades to 0 in 0.2 s (it starts 50 ms after the tap) and goes
(removed at 250 ms). It is over everything and never catches a tap: the tap goes to the object under it.
- TapEffect.start(options): the taps of the page make circles. TapEffect.stop(): no more circles (its window
  listener is removed; a circle that is seen goes by itself). TapEffect.isOn: 1 while it is started.
- options (TapEffect.DEFAULT_OPTIONS): { color: "#000000", opacity: 0.05, size: 80, duration: 0.2, oneAtATime: 1 }
  -- size: page px (on a page fitted with page.fit() the circle is zoomed with the page)
  -- duration: s, the fade
  -- oneAtATime: 1: a tap while a circle is seen makes no new one. 0: every tap gets its own circle.
- TapEffect.show(x, y): a circle at a place of the page (page px) with the options of start(). It returns the
  circle, or null when there is none (one at a time, reduced motion). It works without start() too.
- Only real taps: a click of the keyboard or of the code (event.detail 0) has no place on the screen.
- A tap does not change "that" of the page. (TapEffect.show() called by your code makes the circle "that".)
- A page fitted with page.fit(): the place of the tap is read in page px (withPageZoom of clientX / clientY).
- Nothing when the system asks for reduced motion.
- TapEffect(params): one circle in the current container (x, y: its middle; size, color, opacity, duration).
  TapEffect.show() makes it on page.

USAGE:
TapEffect.start();
TapEffect.start({ color: "#FFFFFF", opacity: 0.12 }); // on a dark page
TapEffect.stop();
TapEffect.show(200, 300); // a circle at x 200, y 300 of the page
if (TapEffect.isOn) TapEffect.stop();

Started Date: November 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values: (one circle)
const TapEffectDefaults = {
    x: 0, // px: the middle of the circle (the place of the tap)
    y: 0,
    size: 80, // px: the width of the circle
    color: "#000000",
    opacity: 0.05, // at the start; it fades to 0
    duration: 0.2, // s: the fade
    zIndex: 100001, // WHY: over everything: Tooltip (100000), Notice (50000), Dialog (4000 and up)
};

const TapEffect = function (params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, TapEffectDefaults);

    // WHY: the circle is placed by its middle (the place of the tap), not by its corner.
    params.left = params.x - params.size / 2;
    params.top = params.y - params.size / 2;
    params.width = params.size;
    params.height = params.size;

    // BOX: Component container (the circle)
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const FADE_START_TIME = 50; // ms: the circle is seen whole for a moment, then it fades
    const REMOVE_TIME = FADE_START_TIME + box.duration * 1000; // ms: the end of the fade

    // *** PUBLIC FUNCTIONS:

    // REMOVE: the static TapEffect.current must not keep a removed circle.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {
        if (!box) return;
        if (TapEffect.current == box) TapEffect.current = null;
        superRemove.call(box);
        box = null;
    };
    // USAGE: circle.remove()

    // *** OBJECT VIEW:

    box.round = box.size / 2;
    box.clickable = 0; // WHY: it never catches a tap
    // WHY setMotionNow: a new object has no look before, so nothing moves at its first view.
    box.setMotionNow("opacity " + box.duration + "s");

    // *** OBJECT INIT CODE:

    box.after(FADE_START_TIME, function (self) { self.opacity = 0; });
    box.after(REMOVE_TIME, function (self) { self.remove(); });

    return endObject(box);

};

// *** STATIC VARIABLES AND FUNCTIONS:

// The options of TapEffect.start(): the look of the circle (TapEffectDefaults) and oneAtATime.
TapEffect.DEFAULT_OPTIONS = {
    color: TapEffectDefaults.color,
    opacity: TapEffectDefaults.opacity,
    size: TapEffectDefaults.size, // page px
    duration: TapEffectDefaults.duration, // s
    oneAtATime: 1, // 1: a tap while a circle is seen makes no new one. 0: every tap gets its own circle.
};

TapEffect.options = Object.assign({}, TapEffect.DEFAULT_OPTIONS); // The options in use (start() sets them)
TapEffect.isOn = 0; // 1: the taps of the page make circles (start / stop)
TapEffect.current = null; // The circle that is seen (the last one)

TapEffect.isReducedMotion = function () {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

// The taps of the page make circles. The options not given are the defaults (also when it is called again: then
// only the options change, the window listener is added once).
TapEffect.start = function (options = {}) {
    TapEffect.options = Object.assign({}, TapEffect.DEFAULT_OPTIONS, options);
    if (TapEffect.isOn) return;
    TapEffect.isOn = 1;
    // WHY capture: the circle comes also where the code of the page stops the click (Ex: a menu, a popover).
    window.addEventListener("click", TapEffect.onWindowClick, true);
};
// USAGE: TapEffect.start() / TapEffect.start({ color: "#FFFFFF", opacity: 0.12 })

// No more circles. (A circle that is seen goes by itself.)
TapEffect.stop = function () {
    window.removeEventListener("click", TapEffect.onWindowClick, true);
    TapEffect.isOn = 0;
};
// USAGE: TapEffect.stop()

// A circle at a place of the page (page px) with TapEffect.options. Returns it, or null when there is none.
TapEffect.show = function (x, y) {
    const options = TapEffect.options;
    if (!basic.isReady) return null; // WHY: a tap while the page loads has no page to draw on (start() at load time)
    if (TapEffect.isReducedMotion()) return null;
    if (basic.isOn(options.oneAtATime) && TapEffect.current) return null;
    const params = {
        x: x,
        y: y,
        size: options.size,
        color: options.color,
        opacity: options.opacity,
        duration: options.duration,
    };
    TapEffect.current = createIn(page, function () { return TapEffect(params); });
    return TapEffect.current;
};
// USAGE: TapEffect.show(200, 300)

// A click of the page (TapEffect.start): a real tap makes a circle at its place.
TapEffect.onWindowClick = function (event) {
    // WHY: a click of the keyboard or of the code (event.detail 0) has no place on the screen.
    const isRealTap = (event.detail > 0);
    if (!isRealTap) return;
    // WHY: a tap must not change "that" of the page (its code may use it after an await).
    saveCurrentThat();
    try {
        // WHY withPageZoom: clientX / clientY are screen px, and a page fitted with page.fit() is zoomed.
        TapEffect.show(withPageZoom(event.clientX), withPageZoom(event.clientY));
    } finally {
        restoreThatFromSaved();
    }
};
