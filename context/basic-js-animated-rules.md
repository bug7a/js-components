# basic.js animated rules

How a component gets an `animated` param (the user, 2026-10-27). The model is `comp-m2/search-input-v2.js`
(`SearchInput`, `animated: 1`): read it before adding `animated` to another component.

## What the param is

- `animated: 0` (default) / `1`, and `box.setAnimated(0/1)`.
- `animated: 0` changes nothing: the component looks and works exactly as before (no transition, no transform,
  no box-shadow written). Only after `setAnimated(0)` on an animated object is the still look written back.
- A style package that is the user's own look (`ozden`, `ozdenDark`...) may carry `animated: 1`; `classic` stays still.
- The colors the motion needs are params next to the other look params (Ex: `hoverRingColor`, `focusRingColor`),
  with their own values in the dark packages.

## The feel

- Small, smooth, quiet: the motion answers the user, it does not ask for attention.
- **No motion at the first view.** `setMotion()` waits a moment before it starts, so the transitions are set at
  create time and the first paint does not move. No intro animation, no loop.
- One duration and one curve for the whole component: `0.25s`, `cubic-bezier(0.2, 0.8, 0.2, 1)` (a fast start,
  a soft stop). Named constants at the top (`MOTION_TIME`, `MOTION_EASE`).
- Small sizes: grow 1.05-1.08 under the mouse, about 1.06 while focused, a short pulse 1.14 for 150 ms; a tilt of
  about 10-12 deg; a turn of 90 deg for an icon like ×. Check that a grown or tilted icon does not touch its text.

## Where motion goes (the moments)

- **Hover**: a thin line (1 px) appears, the main icon grows a little and gets clearer (opacity + 0.25).
- **Focus / active**: a stronger line (2 px), the icon a little bigger, tilted, clearer (opacity + 0.5).
- **Show / hide of a small part** (a clear icon, a badge): it grows in from 0.6 and fades; it shrinks out.
- **Hover on a small action** (×): it turns.
- **A user action that changes the value** (a typed letter): one short pulse; quick repeats make one longer pulse
  (cancel the previous `after()`), not a stutter. Listen to the event that means "the value changed" (`input`,
  not `keyup`: arrows, Shift, Enter must not pulse).

## Performance

- Only `transform`, `opacity` and `box-shadow` change. Never `width`, `height`, `left`, `top`, `padding`,
  `font-size` (they move the layout).
- CSS transitions (`obj.setMotion(...)`) only: no `requestAnimationFrame` loop, no `every()` timer.
- A line around a field is an **inset** box-shadow (`inset 0 0 0 1px color`): it does not move the layout and a
  group that clips its content does not cut it. Don't change `borderColor` for it: it also overwrites a
  `border-bottom` shade.

## How the code is built

- One state (`isHovered`, `isFocused`, `isPulsing`...) and one `paintMotion()` that writes the look from it;
  small getters (`getRing()`, `getIconTransform()`...) with early returns. Every event only changes the state and
  calls `paintMotion()`.
- `isMotionOn()`: `animated == 1` and the system does not ask for less motion
  (`matchMedia("(prefers-reduced-motion: reduce)")`). `paintMotion()` does nothing when it is off.
- `applyAnimated()` sets the transitions (`setMotion`) and paints; when off it writes the still look back only if
  the object was animated before (`wasAnimated`).
- Events through basic.js so `remove()` cleans them: `onHoverChange()`, `listenTo(elem, "focus" / "blur" / "input")`,
  `after()` for a pulse.
- **`on()` and `onHoverChange()` make an object `clickable = 1`.** Add them before a line that sets
  `clickable = 0` (a hidden icon must not catch clicks).
- Check in the browser: the state values (transform, opacity, box-shadow) after hover / focus / typing / hiding,
  `animated: 0` unchanged, `setAnimated(0)` back to still, and `test/components-test.htm?only=<name>`.
