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
    --ground auto     a sheet drawn on a flat key color (Gemini draws no transparency: ask for a magenta #FF00FF
                      ground; a green #00FF00 one for a sheet with no green): that color is made transparent first,
                      also in the closed gaps, and taken out of the soft edges; "auto" reads it from the corners, or
                      a color "#FF00FF"
    --ground light    a sheet on a white or near-white ground (a model that draws no key color): the ground and the
                      closed gaps of it made transparent by how far each pixel is from it; a light part inside a
                      picture that is not a gap (a white flower) stays

The parts are found by the alpha of the sheet: a sheet with an opaque ground is not cut (draw it again with a
transparent ground, or give its color with --ground). When the parts are not as many as the names, it lists them and
stops.

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
LIGHT_NEAR = 14  # color distance: a pixel this near the light ground or nearer is the ground
LIGHT_SOLID = 200  # color distance: a pixel this far from the light ground or farther is the drawing
LIGHT_GAP_AREA = 60  # px: a closed light gap larger than this is the ground (a smaller one is a highlight)
LIGHT_EDGE = 2  # px: the soft edge of the ground next to the drawing
KEY_SOLID = 20  # of 255: a pixel with this much of the key color or less is the drawing itself
KEY_NOISE = 20  # of 255: the ground has about this much less of the key color than its own color
SAMPLE_RADIUS = 4  # px: a blend is a blend of the ground and one of the clean colors this near it
CORNER_PATCH = 16  # px: the squares in the corners the color of the ground is read from


def read_options():
    parser = argparse.ArgumentParser(description="Cut a sheet of pictures into one picture each.")
    parser.add_argument("sheet")
    parser.add_argument("out")
    parser.add_argument("names", nargs="+")
    parser.add_argument("--size", type=int, default=512)
    parser.add_argument("--fit", type=int, default=441)
    parser.add_argument("--join", type=int, default=24)
    parser.add_argument("--preview", default="")
    parser.add_argument("--ground", default="")
    return parser.parse_args()


def has_transparent_ground(alpha):
    corners = [alpha[0, 0], alpha[0, -1], alpha[-1, 0], alpha[-1, -1]]
    return max(corners) < 255


def ground_color(pixels, ground):
    """The color of the ground: the one given, or the middle color of the corners."""
    if ground != "auto":
        value = ground.lstrip("#")
        return np.array([int(value[index:index + 2], 16) for index in (0, 2, 4)], dtype=float)
    patch = CORNER_PATCH
    corners = [pixels[:patch, :patch], pixels[:patch, -patch:], pixels[-patch:, :patch], pixels[-patch:, -patch:]]
    return np.median(np.concatenate([corner[..., :3].reshape(-1, 3) for corner in corners]), axis=0)


def blend_of(colors, ground, drawing):
    """How much of drawing each color holds over the ground (0-1), and how far the color is from that blend."""
    toward = drawing - ground
    share = np.clip(((colors - ground) * toward).sum(axis=2) / np.maximum((toward ** 2).sum(axis=2), 1), 0, 1)
    miss = ((colors - ground - share[..., None] * toward) ** 2).sum(axis=2)
    return share, miss


def key_out_ground(pixels, ground):
    """The flat key color made transparent. A pixel with no key in it (and none next to it) is the drawing; any other
    pixel is a blend of the ground and the clean color near it that explains it best: it takes that color, and its
    share as the alpha."""
    # WHY the key (how much the key channels, R and B of magenta, stand above the others) and not the distance to the
    # ground: a thin gap between two leaves is never the ground color, but it still holds magenta
    # WHY a pixel next to a key is not clean: yellow with some magenta in it has no key yet (an orange rim)
    # WHY the clean color that explains it best, not the nearest one: the outline is 2-3 px, so the nearest clean
    # color is often the fill behind it (a green or light rim around the dark outline)
    colors = pixels[..., :3].astype(float)
    is_key_channel = ground > 128
    key = colors[..., is_key_channel].min(axis=2) - colors[..., ~is_key_channel].max(axis=2)
    is_clean = ndimage.binary_erosion(key <= KEY_SOLID)
    rows, columns = ndimage.distance_transform_edt(~is_clean, return_distances=False, return_indices=True)
    best_color = colors[rows, columns]
    best_share, best_miss = blend_of(colors, ground, best_color)
    for down in range(-SAMPLE_RADIUS, SAMPLE_RADIUS + 1):
        for across in range(-SAMPLE_RADIUS, SAMPLE_RADIUS + 1):
            candidate = np.roll(colors, (down, across), axis=(0, 1))
            share, miss = blend_of(colors, ground, candidate)
            is_better = np.roll(is_clean, (down, across), axis=(0, 1)) & (miss < best_miss)
            best_color[is_better] = candidate[is_better]
            best_share[is_better] = share[is_better]
            best_miss[is_better] = miss[is_better]
    ground_key = ground[is_key_channel].min() - ground[~is_key_channel].max() - KEY_NOISE
    alpha = np.where(is_clean, 1.0, best_share)
    alpha[key >= ground_key] = 0
    keyed = np.empty_like(pixels)
    keyed[..., :3] = np.where(is_clean[..., None], colors, best_color).round().astype(np.uint8)
    keyed[..., 3] = (alpha * 255).round().astype(np.uint8)
    return keyed


def light_out_ground(pixels):
    """A white or near-white ground made transparent: the ground reached from the edges of the sheet and its closed
    gaps; in the soft edge next to it, the alpha by the distance to the ground and the ground taken out of the color."""
    # WHY not key_out_ground: its key is how much some channels stand above the others; a light ground has no such
    # channel (a JPEG sheet on #F6FBFC, 2026-11-26)
    # WHY a gap counts by its size: the gap between a stem and a leaf is ground, the shine of a berry is not
    colors = pixels[..., :3].astype(float)
    is_bright = colors.min(axis=2) > 225
    if not is_bright.any():
        sys.exit("--ground light: no light ground on the sheet.")
    ground = np.median(colors[is_bright], axis=0)
    distance = np.sqrt(((colors - ground) ** 2).sum(axis=2))
    regions, count = ndimage.label(distance < LIGHT_NEAR + 8)
    edges = np.concatenate([regions[0], regions[-1], regions[:, 0], regions[:, -1]])
    areas = ndimage.sum(np.ones_like(distance), regions, index=np.arange(count + 1))
    is_ground_region = areas > LIGHT_GAP_AREA
    is_ground_region[edges] = True
    is_ground_region[0] = False
    is_ground = ndimage.binary_dilation(is_ground_region[regions], iterations=LIGHT_EDGE)
    alpha = np.where(is_ground, np.clip((distance - LIGHT_NEAR) / (LIGHT_SOLID - LIGHT_NEAR), 0, 1), 1.0)
    unblended = (colors - (1 - alpha[..., None]) * ground) / np.maximum(alpha, 1e-3)[..., None]
    lighted = np.empty_like(pixels)
    lighted[..., :3] = np.clip(unblended, 0, 255).round().astype(np.uint8)
    lighted[..., 3] = (alpha * 255).round().astype(np.uint8)
    return lighted


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
    if options.ground == "light":
        pixels = light_out_ground(pixels)
    elif options.ground:
        pixels = key_out_ground(pixels, ground_color(pixels, options.ground))
    alpha = pixels[..., 3]
    if not has_transparent_ground(alpha):
        sys.exit("The ground of the sheet is not transparent: draw it again with a transparent ground, or give its "
                 "color with --ground.")
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
