# Bismillah
"""cut-sheet - v26.11
A sheet of pictures drawn by Codex (plants, icons... side by side on one transparent image) cut into one picture each:
every picture fitted into the same square (512 x 512, the drawing 441 px at most, centered: as the pictures of
assets/), on a transparent ground.

WHY: one Codex call draws one image, and the calls are few (about 2 a day): a sheet of 6-7 pictures in one call. The
pictures of assets/ were cut from sheets on 2026-11-09 and 2026-11-10.

Usage (from the root of the repository):
    python3 _ai-tools/cut-sheet.py sheet.png out-folder lavender pomegranate lemon physalis borage fig
        the names in reading order (row by row, left to right): out-folder/<name>.png; "-" skips one
    --size 512        the square of a picture (px)
    --fit 441         the longer side of the drawing in it (px)
    --join 24         parts closer than this (px) are one picture (a loose petal, the steam of a cup)
    --preview p.png   the pictures on a light and on a dark ground, to check them

The parts are found by the alpha of the sheet: a sheet with an opaque ground is not cut (draw it again with a
transparent ground). When the parts are not as many as the names, it lists them and stops.

Started Date: November 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0
"""

import argparse
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

ALPHA_SEEN = 16  # of 255: a fainter pixel is only the soft edge of a part
SPECK_AREA = 150  # px: a group smaller than this is a speck of the sheet, not a picture
EDGE = 2  # px around a part: its soft edge
LIGHT_GROUND = (255, 255, 255)
DARK_GROUND = (30, 30, 30)
SKIP = "-"


def read_options():
    parser = argparse.ArgumentParser(description="Cut a sheet of pictures into one picture each.")
    parser.add_argument("sheet")
    parser.add_argument("out")
    parser.add_argument("names", nargs="+")
    parser.add_argument("--size", type=int, default=512)
    parser.add_argument("--fit", type=int, default=441)
    parser.add_argument("--join", type=int, default=24)
    parser.add_argument("--preview", default="")
    return parser.parse_args()


def has_transparent_ground(alpha):
    corners = [alpha[0, 0], alpha[0, -1], alpha[-1, 0], alpha[-1, -1]]
    return max(corners) < 255


def find_groups(alpha, join):
    """The pictures of the sheet: the parts that are closer than join px are one group."""
    seen = alpha > ALPHA_SEEN
    joined = ndimage.binary_dilation(seen, iterations=max(1, join // 2))
    regions, count = ndimage.label(joined, structure=np.ones((3, 3)))
    seen_regions = np.where(seen, regions, 0)
    groups = []
    specks = []
    for index, box in enumerate(ndimage.find_objects(seen_regions), start=1):
        if box is None:
            continue
        area = int((seen_regions[box] == index).sum())
        group = {"label": index, "box": box, "area": area}
        (groups if area >= SPECK_AREA else specks).append(group)
    return regions, groups, specks


def center_of(group):
    rows, columns = group["box"]
    return (rows.start + rows.stop) / 2, (columns.start + columns.stop) / 2


def in_reading_order(groups):
    """Row by row (a group whose center is inside the band of a row is in that row), left to right in a row."""
    rows = []
    for group in sorted(groups, key=lambda g: center_of(g)[0]):
        middle = center_of(group)[0]
        row = rows[-1] if rows else None
        if row and row["top"] <= middle <= row["bottom"]:
            row["groups"].append(group)
            row["bottom"] = max(row["bottom"], group["box"][0].stop)
            continue
        rows.append({"top": group["box"][0].start, "bottom": group["box"][0].stop, "groups": [group]})
    return [group for row in rows for group in sorted(row["groups"], key=lambda g: center_of(g)[1])]


def describe(group):
    rows, columns = group["box"]
    return f"x {columns.start}-{columns.stop}, y {rows.start}-{rows.stop}, {group['area']} px"


def cut(pixels, regions, group, size, fit):
    """The group alone (the parts of a neighbor in its box taken out), fitted into the square: (picture, scale)."""
    rows, columns = group["box"]
    height, width = regions.shape
    top, bottom = max(0, rows.start - EDGE), min(height, rows.stop + EDGE)
    left, right = max(0, columns.start - EDGE), min(width, columns.stop + EDGE)
    part = pixels[top:bottom, left:right].copy()
    is_own = (regions[top:bottom, left:right] == group["label"])
    part[..., 3] = np.where(is_own, part[..., 3], 0)
    drawing = Image.fromarray(part)
    # WHY the box, not the part: the part has the soft edge around it, the drawing is fitted
    scale = fit / max(rows.stop - rows.start, columns.stop - columns.start)
    fitted_size = (max(1, round(drawing.width * scale)), max(1, round(drawing.height * scale)))
    drawing = drawing.resize(fitted_size, Image.LANCZOS)
    picture = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    picture.paste(drawing, ((size - fitted_size[0]) // 2, (size - fitted_size[1]) // 2))
    return picture, scale


def write_preview(pictures, file, size):
    """The pictures side by side: on a light ground above, on a dark ground below."""
    thumb = size // 2
    sheet = Image.new("RGB", (thumb * len(pictures), thumb * 2), LIGHT_GROUND)
    sheet.paste(DARK_GROUND, (0, thumb, sheet.width, sheet.height))
    for index, picture in enumerate(pictures):
        small = picture.resize((thumb, thumb), Image.LANCZOS)
        sheet.paste(small, (index * thumb, 0), small)
        sheet.paste(small, (index * thumb, thumb), small)
    sheet.save(file)
    print("preview:", file)


def main():
    options = read_options()
    pixels = np.array(Image.open(options.sheet).convert("RGBA"))
    alpha = pixels[..., 3]
    if not has_transparent_ground(alpha):
        sys.exit("The ground of the sheet is not transparent: draw it again with a transparent ground.")
    regions, groups, specks = find_groups(alpha, options.join)
    groups = in_reading_order(groups)
    for speck in specks:
        print("a speck, left out:", describe(speck))
    if len(groups) != len(options.names):
        for index, group in enumerate(groups, start=1):
            print(f"{index}. {describe(group)}")
        sys.exit(f"{len(groups)} pictures on the sheet, {len(options.names)} names (--join: a larger value joins parts).")
    os.makedirs(options.out, exist_ok=True)
    pictures = []
    for name, group in zip(options.names, groups):
        if name == SKIP:
            continue
        picture, scale = cut(pixels, regions, group, options.size, options.fit)
        file = os.path.join(options.out, name + ".png")
        picture.save(file, optimize=True)
        pictures.append(picture)
        note = "  (drawn smaller than it is shown: softer)" if scale > 1 else ""
        print(f"{file}: {describe(group)}, scale {scale:.2f}{note}")
    if options.preview:
        write_preview(pictures, options.preview, options.size)


if __name__ == "__main__":
    main()
