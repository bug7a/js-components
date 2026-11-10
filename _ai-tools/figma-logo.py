# Bismillah
"""figma-logo - v26.11
A logo drawn in Figma and exported as SVG made ready for the pages: the pictures inside it (a PNG drawing) made
smaller, and with --crop its frame cut to the drawing.

WHY: Figma exports a logo on its frame (535 x 310: the cards of the personal site) with its drawing as a 512 px PNG,
about 270 KB a logo. A header draws the logo itself (40-70 px high), so the frame is cut away; the PNG is made
256 px with 256 colors (about 20-40 KB), still sharp at 3x on its largest use.

Export from Figma with "Outline text" on: a <text> is drawn in the font of the computer (Open Sans is not on every
one), so the script stops on a <text>.

Usage (from the root of the repository):
    python3 _ai-tools/figma-logo.py in.svg out.svg            the PNGs made smaller, the frame kept (the cards)
    python3 _ai-tools/figma-logo.py in.svg out.svg --crop     the frame cut to the drawing (a header, a footer)
    python3 _ai-tools/figma-logo.py in.svg favicon.svg --mark --png 96
                                                              only the drawing (its one PNG) in a square: a favicon
    --png 256         the longer side of a PNG inside (px); a smaller one keeps its size
    --colors 256      the colors of a PNG inside (0: all of them)
    --margin 0        units around the drawing with --crop
    --note "text"     a comment written after <svg ...>: where the logo comes from

The box of the drawing: the paths (their curves; a stroke as far as its corners can reach), the shapes and the
pictures (only their pixels that are seen). It is printed. A transform, a <text> or an element it does not know
stops it: the box would be wrong.

Started Date: November 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0
"""

import argparse
import base64
import io
import math
import re
import sys
import xml.etree.ElementTree as ET

import numpy as np
from PIL import Image

SVG = "{http://www.w3.org/2000/svg}"
XLINK_HREF = "{http://www.w3.org/1999/xlink}href"
ALPHA_SEEN = 8  # of 255: a fainter pixel of a picture is not seen
NOT_DRAWN = {"defs", "clipPath", "mask", "pattern", "symbol", "linearGradient", "radialGradient", "filter", "style",
             "title", "desc", "metadata"}
PNG_DATA = re.compile(r"data:image/png;base64,([A-Za-z0-9+/=\s]+)")
PATH_TOKEN = re.compile(r"[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?")
PATH_ARGS = {"M": 2, "L": 2, "H": 1, "V": 1, "C": 6, "S": 4, "Q": 4, "T": 2, "A": 7, "Z": 0}


def stop(text):
    sys.exit("figma-logo: " + text)


def local_name(elem):
    return elem.tag.split("}")[-1]


# *** THE BOX OF A PATH:
def cubic_extremes(p0, p1, p2, p3):
    """The t (0..1) where one coordinate of a cubic curve turns."""
    a = -p0 + 3 * p1 - 3 * p2 + p3
    b = 2 * (p0 - 2 * p1 + p2)
    c = p1 - p0
    if abs(a) < 1e-12:
        return [-c / b] if abs(b) > 1e-12 else []
    disc = b * b - 4 * a * c
    if disc < 0:
        return []
    root = math.sqrt(disc)
    return [(-b + root) / (2 * a), (-b - root) / (2 * a)]


def cubic_at(p0, p1, p2, p3, t):
    s = 1 - t
    return s * s * s * p0 + 3 * s * s * t * p1 + 3 * s * t * t * p2 + t * t * t * p3


def path_points(d):
    """The points that bound a path: its ends and the turns of its curves."""
    tokens = PATH_TOKEN.findall(d)
    points = []
    x = y = start_x = start_y = 0.0
    last_control = None  # of a C / S (for S) or a Q / T (for T)
    index = 0
    command = None
    while index < len(tokens):
        if tokens[index].isalpha():
            command = tokens[index]
            index += 1
            if command in "Zz":
                x, y = start_x, start_y
                last_control = None
                continue
        if command is None:
            stop("a path that does not start with a command: " + d[:40])
        upper = command.upper()
        count = PATH_ARGS[upper]
        args = [float(value) for value in tokens[index:index + count]]
        if len(args) < count:
            stop("a path with missing numbers: " + d[:40])
        index += count
        relative = command.islower()
        if upper == "A":
            stop("an arc (A) in a path: not measured")
        if upper == "H":
            x = args[0] + (x if relative else 0)
            points.append((x, y))
            last_control = None
            continue
        if upper == "V":
            y = args[0] + (y if relative else 0)
            points.append((x, y))
            last_control = None
            continue
        values = [value + (x if i % 2 == 0 else y) if relative else value for i, value in enumerate(args)]
        if upper in ("M", "L", "T"):
            if upper == "T":
                control = (2 * x - last_control[0], 2 * y - last_control[1]) if last_control else (x, y)
                curve = (x, y, *control, *values)
                last_control = control
                points.extend(quadratic_points(*curve))
            else:
                last_control = None
            x, y = values
            points.append((x, y))
            if upper == "M":
                start_x, start_y = x, y
                command = "l" if relative else "L"  # more pairs after M are lines
            continue
        if upper == "S":
            first = (2 * x - last_control[0], 2 * y - last_control[1]) if last_control else (x, y)
            values = [*first, *values]
            upper = "C"
        if upper == "C":
            curve_x = (x, values[0], values[2], values[4])
            curve_y = (y, values[1], values[3], values[5])
            for t in cubic_extremes(*curve_x) + cubic_extremes(*curve_y):
                if 0 < t < 1:
                    points.append((cubic_at(*curve_x, t), cubic_at(*curve_y, t)))
            last_control = (values[2], values[3])
            x, y = values[4], values[5]
            points.append((x, y))
            continue
        if upper == "Q":
            points.extend(quadratic_points(x, y, *values))
            last_control = (values[0], values[1])
            x, y = values[2], values[3]
            points.append((x, y))
    return points


def quadratic_points(x0, y0, cx, cy, x1, y1):
    """The turns of a quadratic curve (its ends are added by the caller)."""
    points = []
    for p0, p1, p2, axis in ((x0, cx, x1, 0), (y0, cy, y1, 1)):
        bottom = p0 - 2 * p1 + p2
        if abs(bottom) < 1e-12:
            continue
        t = (p0 - p1) / bottom
        if 0 < t < 1:
            s = 1 - t
            points.append((s * s * x0 + 2 * s * t * cx + t * t * x1, s * s * y0 + 2 * s * t * cy + t * t * y1))
    return points


# *** THE BOX OF A PICTURE:
def seen_pixels_box(png_bytes):
    """The box of the pixels of a PNG that are seen, as parts of its width and height (0..1)."""
    picture = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
    alpha = np.array(picture)[:, :, 3]
    rows = np.where(alpha.max(axis=1) > ALPHA_SEEN)[0]
    columns = np.where(alpha.max(axis=0) > ALPHA_SEEN)[0]
    if len(rows) == 0:
        return None
    width, height = picture.size
    return (columns[0] / width, rows[0] / height, (columns[-1] + 1) / width, (rows[-1] + 1) / height)


def image_box(image, x, y, width, height):
    """The box of the seen pixels of an <image> drawn in x, y, width, height (stretched: preserveAspectRatio none)."""
    if image.get("preserveAspectRatio", "xMidYMid") != "none":
        stop("a picture that keeps its aspect (preserveAspectRatio): not measured")
    match = PNG_DATA.match(image.get(XLINK_HREF) or image.get("href") or "")
    if not match:
        stop("a picture that is not a PNG inside the SVG: not measured")
    part = seen_pixels_box(base64.b64decode(match.group(1)))
    if part is None:
        return []
    return [(x + part[0] * width, y + part[1] * height), (x + part[2] * width, y + part[3] * height)]


def pattern_box(root, pattern_id, x, y, width, height):
    """The box of a rect filled with a pattern of one picture (as Figma exports a picture)."""
    pattern = root.find(".//" + SVG + "pattern[@id='" + pattern_id + "']")
    if pattern is None or pattern.get("patternContentUnits") != "objectBoundingBox" or len(pattern) != 1:
        stop("a fill of pattern #" + pattern_id + " that is not one picture over the box: not measured")
    use = pattern[0]
    href = (use.get(XLINK_HREF) or use.get("href") or "").lstrip("#")
    image = root.find(".//" + SVG + "image[@id='" + href + "']")
    if local_name(use) != "use" or image is None:
        stop("pattern #" + pattern_id + " does not show an <image>: not measured")
    scale = re.fullmatch(r"\s*scale\(\s*([-+\d.eE]+)\s*(?:[ ,]\s*([-+\d.eE]+)\s*)?\)\s*", use.get("transform", ""))
    if not scale:
        stop("pattern #" + pattern_id + ": its picture moved by a transform other than scale(): not measured")
    scale_x = float(scale.group(1))
    scale_y = float(scale.group(2) or scale.group(1))
    image_width = float(image.get("width")) * scale_x  # parts of the box
    image_height = float(image.get("height")) * scale_y
    return image_box(image, x, y, image_width * width, image_height * height)


# *** THE BOX OF THE DRAWING:
def style_of(elem, inherited):
    """The stroke of an element, its own attributes and style over the ones of its group."""
    style = dict(inherited)
    for part in elem.get("style", "").split(";"):
        if ":" in part:
            key, value = part.split(":", 1)
            style[key.strip()] = value.strip()
    for key in ("stroke", "stroke-width", "stroke-linejoin", "stroke-miterlimit", "fill"):
        if elem.get(key) is not None:
            style[key] = elem.get(key)
    return style


def stroke_reach(style):
    """How far out of its path a stroke is drawn: half its line, a miter corner more (at most miterlimit times)."""
    if style.get("stroke", "none") == "none":
        return 0.0
    half = float(style.get("stroke-width", "1")) / 2
    if style.get("stroke-linejoin", "miter") == "miter":
        return half * float(style.get("stroke-miterlimit", "4"))
    return half


def number(elem, name):
    return float(elem.get(name, "0"))


def drawing_points(root, elem, inherited):
    points = []
    for child in elem:
        name = local_name(child)
        if name in NOT_DRAWN:
            continue
        if child.get("transform"):
            stop("a transform on <" + name + ">: not measured")
        style = style_of(child, inherited)
        if name == "g":
            points.extend(drawing_points(root, child, style))
            continue
        if name in ("text", "tspan"):
            stop("a <text>: export the logo from Figma with \"Outline text\" on")
        shape = shape_points(root, child, name)
        reach = stroke_reach(style)
        if style.get("fill") == "none" and reach == 0:
            continue
        points.extend(shape)
        if reach:
            points.extend((px + dx * reach, py + dy * reach) for px, py in shape for dx, dy in ((1, 1), (-1, -1)))
    return points


def shape_points(root, elem, name):
    if name == "path":
        return path_points(elem.get("d", ""))
    if name == "rect":
        x, y, width, height = (number(elem, key) for key in ("x", "y", "width", "height"))
        fill = re.fullmatch(r"url\(#([^)]+)\)", elem.get("fill", ""))
        if fill:
            return pattern_box(root, fill.group(1), x, y, width, height)
        return [(x, y), (x + width, y + height)]
    if name == "image":
        return image_box(elem, *(number(elem, key) for key in ("x", "y", "width", "height")))
    if name == "circle":
        cx, cy, r = (number(elem, key) for key in ("cx", "cy", "r"))
        return [(cx - r, cy - r), (cx + r, cy + r)]
    if name == "ellipse":
        cx, cy, rx, ry = (number(elem, key) for key in ("cx", "cy", "rx", "ry"))
        return [(cx - rx, cy - ry), (cx + rx, cy + ry)]
    if name == "line":
        return [(number(elem, "x1"), number(elem, "y1")), (number(elem, "x2"), number(elem, "y2"))]
    if name in ("polygon", "polyline"):
        values = [float(value) for value in PATH_TOKEN.findall(elem.get("points", ""))]
        return list(zip(values[0::2], values[1::2]))
    stop("a <" + name + ">: not measured")


def drawing_box(text, margin):
    root = ET.fromstring(text)
    points = drawing_points(root, root, style_of(root, {}))
    if not points:
        stop("nothing is drawn")
    left = math.floor(min(x for x, y in points) - margin)
    top = math.floor(min(y for x, y in points) - margin)
    right = math.ceil(max(x for x, y in points) + margin)
    bottom = math.ceil(max(y for x, y in points) + margin)
    return left, top, right - left, bottom - top


# *** THE CHANGES:
def smaller_png(png_bytes, longest, colors):
    picture = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
    if max(picture.size) > longest:
        ratio = longest / max(picture.size)
        size = (max(1, round(picture.width * ratio)), max(1, round(picture.height * ratio)))
        picture = picture.resize(size, Image.Resampling.LANCZOS)
    if colors:
        picture = picture.quantize(colors=colors, method=Image.Quantize.FASTOCTREE)
    out = io.BytesIO()
    picture.save(out, "PNG", optimize=True)
    return out.getvalue(), picture.size


def mark_svg(text, longest, colors, note):
    """The drawing of a logo alone (its one PNG, cut to its seen pixels, in the middle of a square)."""
    pictures = PNG_DATA.findall(text)
    if len(pictures) != 1:
        stop("--mark: not one PNG inside the logo")
    picture = Image.open(io.BytesIO(base64.b64decode(pictures[0]))).convert("RGBA")
    drawing = picture.crop(picture.getchannel("A").point(lambda alpha: 255 if alpha > ALPHA_SEEN else 0).getbbox())
    side = max(drawing.size)
    square = Image.new("RGBA", (side, side))
    square.paste(drawing, ((side - drawing.width) // 2, (side - drawing.height) // 2))
    source = io.BytesIO()
    square.save(source, "PNG")
    png_bytes, size = smaller_png(source.getvalue(), longest, colors)
    print("  the drawing: %d x %d px, %d KB" % (size[0], size[1], len(png_bytes) // 1024))
    data = base64.b64encode(png_bytes).decode("ascii")
    comment = "<!-- " + note.replace("--", "-") + " -->\n" if note else ""
    return ('<svg width="%d" height="%d" viewBox="0 0 %d %d" xmlns="http://www.w3.org/2000/svg" '
            'xmlns:xlink="http://www.w3.org/1999/xlink">\n%s<image width="%d" height="%d" '
            'xlink:href="data:image/png;base64,%s"/>\n</svg>\n') % (side, side, side, side, comment, side, side, data)


def replace_once(text, pattern, new, what):
    result, count = re.subn(pattern, new, text, count=1)
    if count != 1:
        stop("no " + what + " in <svg ...>")
    return result


def main():
    parser = argparse.ArgumentParser(description="A logo exported from Figma made ready for the pages.")
    parser.add_argument("source")
    parser.add_argument("target")
    parser.add_argument("--crop", action="store_true", help="the frame cut to the drawing")
    parser.add_argument("--mark", action="store_true", help="only the drawing (its one PNG) in a square: a favicon")
    parser.add_argument("--png", type=int, default=256, help="the longer side of a PNG inside (px)")
    parser.add_argument("--colors", type=int, default=256, help="the colors of a PNG inside (0: all)")
    parser.add_argument("--margin", type=float, default=0, help="units around the drawing with --crop")
    parser.add_argument("--note", default="", help="a comment after <svg ...>")
    options = parser.parse_args()

    with open(options.source, encoding="utf-8") as file:
        text = file.read()
    if text.count("</svg>") != 1:
        stop("not one </svg> in " + options.source)
    head = re.search(r"<svg\b[^>]*>", text)
    if not head:
        stop("no <svg ...> in " + options.source)

    if options.mark:
        text = mark_svg(text, options.png, options.colors, options.note)
        ET.fromstring(text)
        with open(options.target, "w", encoding="utf-8") as file:
            file.write(text)
        print("%s: %d KB" % (options.target, len(text.encode("utf-8")) // 1024))
        return

    # WHY the box before the PNGs: it is measured on the pixels of the drawing as Figma gave it
    box = drawing_box(text, options.margin) if options.crop else None

    def make_smaller(match):
        png_bytes, size = smaller_png(base64.b64decode(match.group(1)), options.png, options.colors)
        print("  a picture: %d x %d px, %d KB" % (size[0], size[1], len(png_bytes) // 1024))
        return "data:image/png;base64," + base64.b64encode(png_bytes).decode("ascii")

    text = PNG_DATA.sub(make_smaller, text)

    svg_tag = head.group(0)
    if box:
        left, top, width, height = box
        svg_tag = replace_once(svg_tag, r'\bwidth="[^"]*"', 'width="%d"' % width, "width")
        svg_tag = replace_once(svg_tag, r'\bheight="[^"]*"', 'height="%d"' % height, "height")
        svg_tag = replace_once(svg_tag, r'\bviewBox="[^"]*"', 'viewBox="%d %d %d %d"' % box, "viewBox")
        print("  the box of the drawing: %d %d %d x %d" % box)
    if options.note:
        svg_tag += "\n<!-- " + options.note.replace("--", "-") + " -->"
    text = text.replace(head.group(0), svg_tag, 1)

    ET.fromstring(text)  # WHY: a file the browser can not read is never written
    with open(options.target, "w", encoding="utf-8") as file:
        file.write(text)
    print("%s: %d KB" % (options.target, len(text.encode("utf-8")) // 1024))


if __name__ == "__main__":
    main()
