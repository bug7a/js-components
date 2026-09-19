#!/usr/bin/env python3
"""HISTORY: this script produced basic.js v26.09.18 from v26.09.17 (now basic/basic-bugra.js).
basic/basic.js is maintained by hand since then; the script is kept to document the changes.
usage: python3 experimental/_make_basic_ai.py <repo-root> [output]   (default output: basic/basic-regenerated.js)

Every edit is anchored to an exact piece of the original text and must match exactly
`count` times, so a silent mismatch cannot slip in.
"""
import re, sys, pathlib

ROOT = pathlib.Path(sys.argv[1])
RAW = (ROOT / "basic" / "basic-bugra.js").read_bytes()
CRLF = b"\r\n" in RAW
SRC = RAW.decode("utf-8").replace("\r\n", "\n")
OUT = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else (ROOT / "basic" / "basic-regenerated.js")

src = SRC

def rep(old, new, count=1):
    """Anchored replace. Trailing whitespace of every anchor line is ignored (blank lines in
    basic.js often carry indentation spaces)."""
    global src
    lines = old.split("\n")
    parts = []
    for i, line in enumerate(lines):
        last = (i == len(lines) - 1)
        if last and line == "":
            parts.append("")          # anchor ends with a newline: do not eat the next line's indent
        else:
            parts.append(re.escape(line.rstrip()) + r"[ \t]*")
    pat = r"\n".join(parts)
    ms = list(re.finditer(pat, src))
    assert len(ms) == count, f"anchor matched {len(ms)} times (expected {count}):\n{old[:160]}"
    for m in reversed(ms):
        src = src[:m.start()] + new + src[m.end():]

def rep_re(pattern, new, flags=re.S):
    global src
    m = list(re.finditer(pattern, src, flags))
    assert len(m) == 1, f"regex matched {len(m)} times: {pattern[:80]}"
    src = src[:m[0].start()] + new + src[m[0].end():]

# ---------------------------------------------------------------- HEADER
rep('''basic.js (v26.09.17) A lightweight JavaScript library for building web-based applications with simple code. No need to write HTML or CSS — just use basic JavaScript.
- Project Site: https://bug7a.github.io/basic.js/
''', '''basic-ai.js (v26.09.18) A lightweight JavaScript library for building web-based applications with simple code. No need to write HTML or CSS — just use basic JavaScript.
- Project Site: https://bug7a.github.io/basic.js/

basic-ai.js is basic.js v26.09.17 plus the improvements below. It is a drop-in replacement:
every basic.js page and component works unchanged (same globals, same defaults, same DOM).
Load it instead of basic.js: <script src="basic/basic-ai.js"></script> (basic.css stays the same).

WHAT IS NEW (see basic/basic-ai.md for examples):
- Fixes:      "100" and "50%" work for left/top/right/bottom/width/height. Children created in a hidden
              HGroup/VGroup are real flex items (visible: 0 at create time). Objects created before the
              page is ready throw a clear error. Timers of a removed object can not run anymore.
              A page variable named like a library helper (const createButton) can not break the library.
- Props:      css, cursor, zIndex, boxShadow, fontFamily, bold, italic, lineHeight, ellipsis, selectable,
              grow, shrink, plainText, isRemoved, children
- Methods:    show(), hide(), toggle(), once(), setSize(), setPosition(), bringToFront(), contains(), animate()
- Input:      value, placeholder, inputType, maxLength, readOnly, focus(), blur(), select(), onEnter()
- Icon:       alt, imageFit
- Groups:     wrap, justify (HGroup / VGroup / AutoLayout)
- page:       on(), off(), onKeyDown(), title
- basic:      version, isReady, sleep(), nextFrame(), clamp(), lerp(), objectOf(), escapeHtml(), storage.loadOr()
''')

rep('''Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com>
- https://github.com/bug7a

Licensed under the Apache License, Version 2.0

*/

(function() {
"use strict";
const basic = {};
''', '''Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com>
- https://github.com/bug7a

Licensed under the Apache License, Version 2.0

*/

(function() {
"use strict";
const basic = {};

basic.version = "26.09.18";
basic.library = "basic-ai.js";
basic.isReady = 0; // 1 after the page object is created (before start() runs).
''')

# ---------------------------------------------------------------- basic.start
rep('''    window.page = new MainBox();
    page.containerBox = null;
    setDefaultContainerBox(page);
''', '''    window.page = new MainBox();
    page.containerBox = null;
    setDefaultContainerBox(page);
    basic.isReady = 1;
''')

# ---------------------------------------------------------------- println / random -> local consts
# WHY: The library calls these helpers itself. If a page defines a global with the same name
#      (const println, const createButton...), the library must keep using its own functions.
rep('''window.println = function ($message, $type = "log") {
    // type: "error", "warn", "info", "table", "dir", ""
    const _console = console;
    _console[$type]($message);
};
//window.println = basic.println;''', '''const println = function ($message, $type = "log") {
    // type: "error", "warn", "info", "table", "dir", ""
    const _console = console;
    _console[$type]($message);
};
window.println = println;''')

# ---------------------------------------------------------------- basic namespace helpers
rep('''//window.date = basic.date;
''', '''//window.date = basic.date;

// *** basic-ai.js: small helpers under the basic namespace (no new globals).

// await basic.sleep(300);
basic.sleep = function ($ms = 0) {
    return new Promise(function (resolve) { setTimeout(resolve, $ms); });
};

// await basic.nextFrame(); -> the browser painted once.
basic.nextFrame = function () {
    return new Promise(function (resolve) { requestAnimationFrame(resolve); });
};

basic.clamp = function ($value, $min, $max) {
    return Math.min(Math.max($value, $min), $max);
};

// 0 -> $a, 1 -> $b
basic.lerp = function ($a, $b, $t) {
    return $a + ($b - $a) * $t;
};

// The basic.js object of a DOM element (or of its nearest parent that has one).
basic.objectOf = function ($elem) {
    let elem = $elem;
    while (elem) {
        if (elem._basicObject) return elem._basicObject;
        elem = elem.parentElement;
    }
    return null;
};

// For user data in .text / .html: basic.escapeHtml(userName)
basic.escapeHtml = function ($str) {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return String(($str === null || $str === undefined) ? "" : $str).replace(/[&<>"']/g, function (c) { return map[c]; });
};

// basic.storage.loadOr("settings", { theme: "light" })
basic.storage.loadOr = function ($key, $fallback) {
    const value = basic.storage.load($key);
    return (value === null) ? $fallback : value;
};

// Position and size values: 100 -> "100px", "100" -> "100px", "50%" / "calc(100% - 10px)" / "auto" -> as is.
const toCssLength = function ($value) {
    if (typeof $value == "string") {
        const s = $value.trim();
        if (s !== "" && !isNaN(Number(s))) return Number(s) + "px";
        return s;
    }
    return parseFloat($value) + "px"; // WHY: Same as basic.js for numbers. (NaN is ignored by the browser.)
};

// Adds a new object's element to the current default container.
const attachToContainer = function ($obj, $element) {
    if (!defaultContainerBox) {
        throw new Error("basic-ai.js: The library is not ready yet. Create objects in start() or window.onload.");
    }
    $obj._containerBox = defaultContainerBox;
    defaultContainerBox.elem.appendChild($element);
};

// Is the container an HGroup / VGroup / AutoLayout?
// WHY: basic.js checked elem.style.display == "flex". A hidden group (visible: 0) has display "none",
//      so the children created in it were absolutely positioned instead of flex items.
const isFlexContainer = function ($box) {
    return !!($box && ($box._isFlex || ($box.elem && $box.elem.style.display == "flex")));
};
''')

# ---------------------------------------------------------------- position / size setters
rep('''    set left($value) {
        this.elem.style.right = "";
        this.elem.style.left = parseFloat($value) + "px";
    }''', '''    set left($value) {
        this.elem.style.right = "";
        this.elem.style.left = toCssLength($value);
    }''')
rep('''    set top($value) {
        this.elem.style.bottom = "";
        this.elem.style.top = parseFloat($value) + "px";
    }''', '''    set top($value) {
        this.elem.style.bottom = "";
        this.elem.style.top = toCssLength($value);
    }''')
rep('''    set right($value) {
        this.elem.style.left = "";
        this.elem.style.right = parseFloat($value) + "px";
    }''', '''    set right($value) {
        this.elem.style.left = "";
        this.elem.style.right = toCssLength($value);
    }''')
rep('''    set bottom($value) {
        this.elem.style.top = "";
        this.elem.style.bottom = parseFloat($value) + "px";
    }''', '''    set bottom($value) {
        this.elem.style.top = "";
        this.elem.style.bottom = toCssLength($value);
    }''')

rep('''        this._width = $value;

        if (typeof $value != "string") {
            this.elem.style.width = parseFloat($value) + "px";
        } else {
            this.elem.style.width = $value;
        }
        ''', '''        // "100" (numeric string) is stored as the number 100.
        if (typeof $value == "string" && $value.trim() !== "" && !isNaN(Number($value))) $value = Number($value);
        this._width = $value;
        this.elem.style.width = toCssLength($value);
        ''')
rep('''        this._height = $value;

        if (typeof $value != "string") {
            this.elem.style.height = parseFloat($value) + "px";
        } else {
            this.elem.style.height = $value;
        }
''', '''        if (typeof $value == "string" && $value.trim() !== "" && !isNaN(Number($value))) $value = Number($value);
        this._height = $value;
        this.elem.style.height = toCssLength($value);
''')

# ---------------------------------------------------------------- Basic_UIComponent additions
rep('''    // -- Otomatik hizalama metodları SONU

    // Nesneyi sil.
    remove() {
''', '''    // -- Otomatik hizalama metodları SONU

    // *** basic-ai.js ADDITIONS (all objects) ***

    // The element that carries the text styles: TextBox -> its <input>, the others -> their own element.
    get _textElem() {
        return (this._type == "textbox" && this.inputElement) ? this.inputElement : this.elem;
    }

    // Raw CSS without touching .elem:
    // obj.css = { whiteSpace: "nowrap" }   obj.css.whiteSpace = "nowrap"   obj.css = "white-space: nowrap"
    get css() {
        return this.elem.style;
    }

    set css($value) {
        if (!$value) return;
        if (typeof $value == "string") {
            this.elem.style.cssText += "; " + $value;
            return;
        }
        for (let key in $value) this.elem.style[key] = $value[key];
    }

    // "pointer", "default", "text", "move", "grab", "not-allowed"...
    get cursor() {
        return this._cursor || "";
    }

    set cursor($value) {
        this._cursor = $value || "";
        this.elem.style.cursor = this._cursor;
        if (this._type == "textbox" && this.inputElement) this.inputElement.style.cursor = this._cursor;
    }

    get zIndex() {
        const z = parseInt(this.elem.style.zIndex);
        return isNaN(z) ? 0 : z;
    }

    set zIndex($value) {
        this.elem.style.zIndex = ($value === "" || $value === null || $value === undefined) ? "" : String($value);
    }

    // "0 2px 8px rgba(0, 0, 0, 0.2)" or "none"
    get boxShadow() {
        return this.elem.style.boxShadow;
    }

    set boxShadow($value) {
        this.elem.style.boxShadow = $value || "";
    }

    // "opensans" (default), "opensans-bold", or any font family name.
    get fontFamily() {
        return this._fontFamily || "";
    }

    set fontFamily($value) {
        this._fontFamily = $value || "";
        this._applyFont();
    }

    // bold: 1 -> opensans-bold (the bundled bold font). With another fontFamily -> font-weight: bold.
    get bold() {
        return this._bold ? 1 : 0;
    }

    set bold($value) {
        this._bold = ($value) ? 1 : 0;
        this._applyFont();
    }

    _applyFont() {
        const family = this._fontFamily || "";
        const el = this._textElem;
        if (family === "" || family.indexOf("opensans") === 0) {
            el.style.fontFamily = (this._bold) ? "opensans-bold" : family;
            el.style.fontWeight = "";
        } else {
            el.style.fontFamily = family;
            el.style.fontWeight = (this._bold) ? "bold" : "";
        }
    }

    get italic() {
        return this._italic ? 1 : 0;
    }

    set italic($value) {
        this._italic = ($value) ? 1 : 0;
        this._textElem.style.fontStyle = ($value) ? "italic" : "";
    }

    // Number -> px (lineHeight: 24). String -> as is (lineHeight: "1.4" = 1.4 x font size).
    get lineHeight() {
        return this._lineHeight;
    }

    set lineHeight($value) {
        this._lineHeight = $value;
        this._textElem.style.lineHeight = (typeof $value == "number") ? $value + "px" : ($value || "");
    }

    // ellipsis: 1 -> one line, "..." at the end when the text does not fit the width.
    get ellipsis() {
        return this._ellipsis ? 1 : 0;
    }

    set ellipsis($value) {
        this._ellipsis = ($value) ? 1 : 0;
        const el = this._textElem;
        el.style.whiteSpace = ($value) ? "nowrap" : "";
        el.style.textOverflow = ($value) ? "ellipsis" : "";
        if ($value) el.style.overflow = "hidden";
    }

    // selectable: 1 -> the user can select and copy the text. (basic.css turns selection off for every object.)
    get selectable() {
        return this._selectable ? 1 : 0;
    }

    set selectable($value) {
        this._selectable = ($value) ? 1 : 0;
        this.elem.style.userSelect = ($value) ? "text" : "";
        this.elem.style.webkitUserSelect = ($value) ? "text" : "";
        if ($value) this.clickable = 1; // WHY: pointer-events: none blocks the selection too.
    }

    // Flex child (inside HGroup / VGroup): grow: 1 -> takes the free space. shrink: 1 -> can get smaller.
    get grow() {
        return this._grow || 0;
    }

    set grow($value) {
        this._grow = $value;
        this.elem.style.flexGrow = String($value);
    }

    get shrink() {
        return this._shrink || 0;
    }

    set shrink($value) {
        this._shrink = $value;
        this.elem.style.flexShrink = String($value);
    }

    // Text without HTML. Safe for user data (.text is innerHTML).
    get plainText() {
        return this._textElem.textContent;
    }

    set plainText($value) {
        this._textElem.textContent = ($value === null || $value === undefined) ? "" : String($value);
    }

    // 1 after remove().
    get isRemoved() {
        return this._isRemoved ? 1 : 0;
    }

    // The basic.js objects directly inside this object (not the deeper ones).
    get children() {
        const list = [];
        const elems = this.elem.children;
        for (let i = 0; i < elems.length; i++) {
            if (elems[i]._basicObject) list.push(elems[i]._basicObject);
        }
        return list;
    }

    show() {
        this.visible = 1;
        return this;
    }

    hide() {
        this.visible = 0;
        return this;
    }

    toggle() {
        this.visible = (this.visible == 1) ? 0 : 1;
        return this;
    }

    setSize($width, $height) {
        if ($width !== undefined && $width !== null) this.width = $width;
        if ($height !== undefined && $height !== null) this.height = $height;
        return this;
    }

    setPosition($left, $top) {
        if ($left !== undefined && $left !== null) this.left = $left;
        if ($top !== undefined && $top !== null) this.top = $top;
        return this;
    }

    // Puts the object above its siblings (zIndex = highest sibling + 1). The DOM order does not change.
    bringToFront() {
        let max = 0;
        const parent = this.elem.parentElement;
        if (parent) {
            for (let i = 0; i < parent.children.length; i++) {
                const z = parseInt(parent.children[i].style.zIndex);
                if (!isNaN(z) && z > max) max = z;
            }
        }
        this.zIndex = max + 1;
        return this;
    }

    // Is $obj inside this object (at any depth)?
    contains($obj) {
        return !!($obj && $obj !== this && $obj.elem && this.elem.contains($obj.elem));
    }

    // Like on(), but the function runs only once. Returns the remover function.
    once($eventName, $func, $useCapture = false) {
        let removeEvent = null;
        removeEvent = this.on($eventName, function (self, event) {
            if (removeEvent) removeEvent();
            $func(self, event);
        }, $useCapture);
        return removeEvent;
    }

    // Animates property changes and returns a Promise:
    // await box.animate({ left: 100, opacity: 0.5 }, 300);   box.animate({ width: 200 }, 500, "ease-out").then(...)
    // The transition set by setMotion() is restored when the animation ends.
    animate($props = {}, $duration = 300, $easing = "ease") {

        const _that = this;

        return new Promise(function (resolve) {

            if (_that._isRemoved) { resolve(_that); return; }

            // The transition to restore is the one before the first animate() call (chained calls keep it).
            if (_that._animateTimeout) {
                clearTimeout(_that._animateTimeout);
            } else {
                _that._animateBaseTransition = _that.elem.style.transition;
            }

            _that.elem.style.transition = "all " + $duration + "ms " + $easing;
            void _that.elem.offsetWidth; // WHY: Forces a reflow, so the transition starts from the current values.

            for (let key in $props) _that[key] = $props[key];

            _that._animateTimeout = setTimeout(function () {
                _that._animateTimeout = null;
                if (!_that._isRemoved) _that.elem.style.transition = _that._animateBaseTransition || "";
                resolve(_that);
            }, $duration + 20);

        });

    }

    // *** basic-ai.js ADDITIONS END ***

    // Nesneyi sil.
    remove() {
''')

# remove(): clear pending timers
rep('''        // 1.  Eklenmiş tüm eventleri kaldır. _addEventListener() - Otomatik temizleme
        if (this._eventFuncList && this._eventFuncList.length) {''', '''        // basic-ai: Pending timers of this object must not run after it is removed.
        if (this._setMotionTimeout) clearTimeout(this._setMotionTimeout);
        if (this._withMotionTimeout) clearTimeout(this._withMotionTimeout);
        if (this._dontMotionTimeout) clearTimeout(this._dontMotionTimeout);
        if (this._animateTimeout) clearTimeout(this._animateTimeout);

        // 1.  Eklenmiş tüm eventleri kaldır. _addEventListener() - Otomatik temizleme
        if (this._eventFuncList && this._eventFuncList.length) {''')

# props() returns the object (chaining)
rep('''    props($defaultParams, $params, $props) {
        setProparties(this, $defaultParams, $params, $props);
    }''', '''    props($defaultParams, $params, $props) {
        setProparties(this, $defaultParams, $params, $props);
        return this;
    }''')

# ---------------------------------------------------------------- MainBox (page) additions
rep('''    remove_onResize($func) {
        this._box._removeEventListener("resize", $func, window);
    }
''', '''    remove_onResize($func) {
        this._box._removeEventListener("resize", $func, window);
    }

    // *** basic-ai.js ADDITIONS (page) ***

    // Window events: page.on("keydown", function (self, event) {}). Returns the remover function.
    on($eventName, $func, $useCapture = false) {
        return this._box._addEventListener($eventName, $func, window, $useCapture);
    }

    off($eventName, $func) {
        this._box._removeEventListener($eventName, $func, window);
    }

    onKeyDown($func) {
        return this.on("keydown", $func);
    }

    remove_onKeyDown($func) {
        this.off("keydown", $func);
    }

    // The browser tab title.
    get title() {
        return document.title;
    }

    set title($value) {
        document.title = $value;
    }

    // *** basic-ai.js ADDITIONS END ***
''')

# ---------------------------------------------------------------- constructors: attach + flex check
rep('''        this._element = divElement;
        this._containerBox = defaultContainerBox;
        if (defaultContainerBox != null) {
            defaultContainerBox.elem.appendChild(this._element);
        } else {
            println("basic.js: The library is not yet ready for use. Put your code in window.onload", "error");
        }
''', '''        this._element = divElement;
        attachToContainer(this, this._element);
''')
rep('''        this._element = buttonElement;
        this._containerBox = defaultContainerBox;
        defaultContainerBox.elem.appendChild(this._element);
''', '''        this._element = buttonElement;
        attachToContainer(this, this._element);
''')
rep('''        this._containerBox = defaultContainerBox;
        defaultContainerBox.elem.appendChild(this._mainElement);
''', '''        attachToContainer(this, this._mainElement);
''')
rep('''        this._element = divElement;
        this._containerBox = defaultContainerBox;
        defaultContainerBox.elem.appendChild(this._element);
''', '''        this._element = divElement;
        attachToContainer(this, this._element);
''')
rep('''        this._element = imageElement;
        this._containerBox = defaultContainerBox;
        defaultContainerBox.elem.appendChild(this._element);
''', '''        this._element = imageElement;
        attachToContainer(this, this._element);
''')
rep('''        if (defaultContainerBox.elem.style.display == "flex") {
            this.position = "relative";
        }
''', '''        if (isFlexContainer(defaultContainerBox)) {
            this.position = "relative";
        }
''', count=5)

# ---------------------------------------------------------------- TextBox additions
rep('''    onChange($func) {
        this._addEventListener("input", $func, this.inputElement);
    }
''', '''    // *** basic-ai.js ADDITIONS (Input / TextBox) ***

    // .value = .text (what most developers expect from an input)
    get value() {
        return this.text;
    }

    set value($value) {
        this.text = $value;
    }

    get plainText() {
        return this.text;
    }

    set plainText($value) {
        this.text = $value;
    }

    get placeholder() {
        return this.inputElement.placeholder;
    }

    set placeholder($value) {
        this.inputElement.placeholder = ($value === null || $value === undefined) ? "" : String($value);
    }

    // "text" (default), "password", "number", "email", "tel", "search", "url"
    get inputType() {
        return this.inputElement.type;
    }

    set inputType($value) {
        this.inputElement.type = $value || "text";
    }

    // 0 -> no limit
    get maxLength() {
        return (this.inputElement.maxLength > 0) ? this.inputElement.maxLength : 0;
    }

    set maxLength($value) {
        if ($value > 0) {
            this.inputElement.maxLength = $value;
        } else {
            this.inputElement.removeAttribute("maxlength");
        }
    }

    get readOnly() {
        return (this.inputElement.readOnly) ? 1 : 0;
    }

    set readOnly($value) {
        this.inputElement.readOnly = ($value) ? true : false;
    }

    focus() {
        this.inputElement.focus();
        return this;
    }

    blur() {
        this.inputElement.blur();
        return this;
    }

    // Selects the whole text.
    select() {
        this.inputElement.select();
        return this;
    }

    // Enter key: input.onEnter(function (self, event) {}). Returns the remover function.
    onEnter($func) {
        const wrapper = function (self, event) {
            if (event.key === "Enter") $func(self, event);
        };
        wrapper._enterFunc = $func;
        return this._addEventListener("keydown", wrapper, this.inputElement);
    }

    remove_onEnter($func) {
        for (let i = this._eventFuncList.length - 1; i >= 0; i--) {
            const item = this._eventFuncList[i];
            if (item.eventName == "keydown" && item.originalFunc._enterFunc === $func) {
                item.elem.removeEventListener("keydown", item.eventFunc);
                this._eventFuncList.splice(i, 1);
            }
        }
    }

    // *** basic-ai.js ADDITIONS END ***

    onChange($func) {
        this._addEventListener("input", $func, this.inputElement);
    }
''')

# ---------------------------------------------------------------- Image additions
rep('''    // Resim yüklendikten sonra, çalışır.
    get naturalWidth() {''', '''    // *** basic-ai.js ADDITIONS (Icon / Image) ***

    // Alternative text. (Without it, load() writes the file path, as basic.js does.)
    get alt() {
        return this._alt;
    }

    set alt($value) {
        this._alt = $value;
        this.imageElement.setAttribute("alt", ($value === null || $value === undefined) ? "" : String($value));
    }

    // How the image fills its width and height: "cover", "contain", "fill", "none", "scale-down"
    get imageFit() {
        return this._imageFit || "";
    }

    set imageFit($value) {
        this._imageFit = $value || "";
        this.imageElement.style.objectFit = this._imageFit;
    }

    // *** basic-ai.js ADDITIONS END ***

    // Resim yüklendikten sonra, çalışır.
    get naturalWidth() {''')
rep('''    load($imagePath) {
        this.imageElement.setAttribute("src", $imagePath);
        this.imageElement.setAttribute("alt", $imagePath);
    }''', '''    load($imagePath) {
        this.imageElement.setAttribute("src", $imagePath);
        if (this._alt === undefined) this.imageElement.setAttribute("alt", $imagePath);
    }''')

# ---------------------------------------------------------------- createX -> local consts
for name, cls in (("createBox", "BBox"), ("createButton", "BButton"), ("createLabel", "BLabel")):
    rep(f'''window.{name} = function ($left, $top, $width, $height) {{
    return new {cls}($left, $top, $width, $height);
}}''', f'''const {name} = function ($left, $top, $width, $height) {{
    return new {cls}($left, $top, $width, $height);
}};
window.{name} = {name};''')
rep('''window.createTextBox = function ($left, $top, $width, $height) {
    return new BTextBox($left, $top, $width, $height);
}

window.createInput = function ($left, $top, $width, $height) {
    return new BTextBox($left, $top, $width, $height);
}''', '''const createTextBox = function ($left, $top, $width, $height) {
    return new BTextBox($left, $top, $width, $height);
};
window.createTextBox = createTextBox;
window.createInput = createTextBox;''')
rep('''window.createImage = function ($left, $top, $width, $height) {

    return new BImage($left, $top, $width, $height);

}

window.createIcon = function ($left, $top, $width, $height) {

    return new BImage($left, $top, $width, $height);

}''', '''const createImage = function ($left, $top, $width, $height) {
    return new BImage($left, $top, $width, $height);
};
window.createImage = createImage;
window.createIcon = createImage;''')

# ---------------------------------------------------------------- other internally used globals -> local consts
rep('''window.withPageZoom = function ($value) {
    return parseFloat($value * (1 / page.zoom));
};
//window.withPageZoom = basic.withPageZoom;''', '''const withPageZoom = function ($value) {
    return parseFloat($value * (1 / page.zoom));
};
window.withPageZoom = withPageZoom;''')
rep('''window.setLoopTimer = function ($time) {''', '''const setLoopTimer = function ($time) {''')
rep('''//window.setLoopTimer = basic.setLoopTimer;''', '''window.setLoopTimer = setLoopTimer;''')
rep('''window.setDefaultContainerBox = function ($box) {''', '''const setDefaultContainerBox = function ($box) {''')
rep('''//window.setDefaultContainerBox = basic.setDefaultContainerBox;''', '''window.setDefaultContainerBox = setDefaultContainerBox;''')
rep('''window.getDefaultContainerBox = function () {''', '''const getDefaultContainerBox = function () {''')
rep('''//window.getDefaultContainerBox = basic.getDefaultContainerBox;''', '''window.getDefaultContainerBox = getDefaultContainerBox;''')
rep('''window.makeBasicObject = function($newObject) {''', '''const makeBasicObject = function($newObject) {''')
rep('''//window.makeBasicObject = basic.makeBasicObject;''', '''window.makeBasicObject = makeBasicObject;''')
rep('''window.mergeIntoIfMissing = function (target, source, depth = 1, maxDepth = 4) {''', '''const mergeIntoIfMissing = function (target, source, depth = 1, maxDepth = 4) {''')
rep('''            window.mergeIntoIfMissing(target[key], sourceVal, depth + 1, maxDepth);''', '''            mergeIntoIfMissing(target[key], sourceVal, depth + 1, maxDepth);''')
rep('''// Sadece 1 kat derine inerek objeyi birleştirir.''', '''window.mergeIntoIfMissing = mergeIntoIfMissing;

// Sadece 1 kat derine inerek objeyi birleştirir.''')
rep('''window.startFlexBox = function(p1 = {}, p2, p3, p4, p5) {''', '''const startFlexBox = function(p1 = {}, p2, p3, p4, p5) {''')
rep('''//window.startFlexBox = basic.startFlexBox;
window.AutoLayout = window.startFlexBox;''', '''window.startFlexBox = startFlexBox;
window.AutoLayout = startFlexBox;''')
rep('''    const group = AutoLayout(...args);''', '''    const group = startFlexBox(...args);''', count=2)
rep('''window.startBox = function(...args) {''', '''const startBox = function(...args) {''')
rep('''//window.startBox = basic.startBox;''', '''window.startBox = startBox;''')
rep('''window.endBox = function() {''', '''const endBox = function() {''')
rep('''window.endFlexBox = window.endBox;
window.endAutoLayout = window.endBox;
window.endGroup = window.endBox;''', '''window.endBox = endBox;
window.endFlexBox = endBox;
window.endAutoLayout = endBox;
window.endGroup = endBox;''')
rep('''window.saveCurrentThat = function() {''', '''const saveCurrentThat = function() {''')
rep('''//window.saveCurrentThat = basic.saveCurrentThat;''', '''window.saveCurrentThat = saveCurrentThat;''')
rep('''window.restoreThatFromSaved = function() {''', '''const restoreThatFromSaved = function() {''')
rep('''//window.restoreThatFromSaved = basic.restoreThatFromSaved;''', '''window.restoreThatFromSaved = restoreThatFromSaved;''')

# Box(): local const (startBox uses it)
rep('''window.Box = function(...args) {

    let props = {};
        if (args.length && typeof args[args.length - 1] === "object") {
        props = args.pop();
    }

    const obj = createBox(...args);
    obj.props(props);

    return obj;

};''', '''const Box = function(...args) {

    let props = {};
    if (args.length && typeof args[args.length - 1] === "object") {
        props = args.pop();
    }

    const obj = createBox(...args);
    obj.props(props);

    return obj;

};
window.Box = Box;''')

# ---------------------------------------------------------------- startFlexBox: _isFlex, wrap, justify
rep('''    const getFlexDirection = function(flow) {''', '''    // JUSTIFY: "left" / "start", "center", "right" / "end", "space-between", "space-around", "space-evenly"
    const getJustifyContent = function(justify) {
        switch (justify) {
            case "left":
            case "top":
            case "start":
                return "flex-start";
            case "right":
            case "bottom":
            case "end":
                return "flex-end";
            case "center":
                return "center";
            default:
                return justify; // space-between, space-around, space-evenly
        }
    };

    const getFlexDirection = function(flow) {''')

rep('''    const checkGap = function(gap) {''', '''    // WRAP (basic-ai): wrap: 1 -> the items continue on the next line / column when there is no space.
    if (props.wrap !== undefined) {
        box._wrap = (props.wrap) ? 1 : 0;
        props.flexWrap = (props.wrap) ? "wrap" : "nowrap";
    }

    // JUSTIFY (basic-ai): the main axis placement, overrides the one from align.
    if (props.justify) {
        box._justify = props.justify;
        props.justifyContent = getJustifyContent(props.justify);
    }

    const checkGap = function(gap) {''')

rep('''    that.elem.style.display = "flex";
    box.props(defaults, defaultFlexStyles, props);''', '''    that.elem.style.display = "flex";
    box._isFlex = 1; // WHY: isFlexContainer() - the children stay flex items even when the group is hidden.
    box.props(defaults, defaultFlexStyles, props);''')

# align setter: justify (when given) wins on the main axis. WHY: VGroup() sets flow after the props,
# and the flow setter re-applies align, which wiped the justify value.
rep('''            this.elem.style.alignContent = alignList[0];
            if (box.elem.style.flexDirection == "row") {
                this.elem.style.justifyContent = alignList[1];
                this.elem.style.alignItems = alignList[2];
            } else {
                this.elem.style.justifyContent = alignList[2];
                this.elem.style.alignItems = alignList[1];
            }
''', '''            this.elem.style.alignContent = alignList[0];
            if (box.elem.style.flexDirection == "row") {
                this.elem.style.justifyContent = alignList[1];
                this.elem.style.alignItems = alignList[2];
            } else {
                this.elem.style.justifyContent = alignList[2];
                this.elem.style.alignItems = alignList[1];
            }
            if (this._justify) this.elem.style.justifyContent = getJustifyContent(this._justify); // basic-ai: justify wins
''')

rep('''    // .gap:
    Object.defineProperty(box, 'gap', {
        get: function() {
            return this._gap;
        },
        set: function(gap) {
            this._gap = checkGap(gap);
            this.elem.style.gap = this._gap;
        }
    });
''', '''    // .gap:
    Object.defineProperty(box, 'gap', {
        get: function() {
            return this._gap;
        },
        set: function(gap) {
            this._gap = checkGap(gap);
            this.elem.style.gap = this._gap;
        }
    });

    // .wrap (basic-ai)
    Object.defineProperty(box, 'wrap', {
        get: function() {
            return this._wrap || 0;
        },
        set: function(wrap) {
            this._wrap = (wrap) ? 1 : 0;
            this.elem.style.flexWrap = (wrap) ? "wrap" : "nowrap";
        }
    });

    // .justify (basic-ai)
    Object.defineProperty(box, 'justify', {
        get: function() {
            return this._justify || "";
        },
        set: function(justify) {
            this._justify = justify;
            this.elem.style.justifyContent = getJustifyContent(justify);
        }
    });
''')

# ---------------------------------------------------------------- resizeDetection: Map instead of a flat list
rep_re(r'resizeDetection\.onResize = function\(\$object, \$func\) \{.*?\n\}\);\n\nlet startedBoxList = \[\];', '''// basic-ai: one list per element (Map) instead of one flat list for all elements.
// WHY: The ResizeObserver callback looked at every registration for every resized element.
resizeDetection.map = new Map(); // elem -> [{ obj, func }]

resizeDetection.onResize = function($object, $func) {

    const list = resizeDetection.map.get($object.elem) || [];
    list.push({ obj: $object, func: $func });
    resizeDetection.map.set($object.elem, list);
    resizeDetection.whenDetected.observe($object.elem);

};

resizeDetection.remove_onResize = function($element, $func) {

    const list = resizeDetection.map.get($element);
    if (!list) return;

    // null -> every function of the element.
    const rest = ($func) ? list.filter(function (item) { return item.func != $func; }) : [];

    // Aynı nesnede başka dinleyici kalmış ise izlemeyi bırakma.
    if (rest.length) {
        resizeDetection.map.set($element, rest);
    } else {
        resizeDetection.map.delete($element);
        resizeDetection.whenDetected.unobserve($element);
    }

};

resizeDetection.whenDetected = new ResizeObserver(function(entries) {

    for (let i = 0; i < entries.length; i++) {
        const list = resizeDetection.map.get(entries[i].target);
        if (!list) continue;
        const copy = list.slice(); // WHY: A function may remove itself while we loop.
        for (let j = 0; j < copy.length; j++) {
            copy[j].func(copy[j].obj);
        }
    }

});

let startedBoxList = [];''')

# resizeDetection.objectAndFunctionList is not used anymore.
rep('''const resizeDetection = {};
resizeDetection.objectAndFunctionList = [];''', '''const resizeDetection = {};''')

out = src.replace("\n", "\r\n") if CRLF else src
OUT.write_bytes(out.encode("utf-8"))
print("written:", OUT, "lines:", src.count("\n") + 1, "crlf:", CRLF)
