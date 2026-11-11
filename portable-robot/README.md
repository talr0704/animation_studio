# Portable Animated Robot

This directory contains the character assets, assembly configuration, styles, and runtime animations needed to embed the robot in another HTML page or project. It deliberately does not include the original demo page, page background, controls, debug panel, or animation editor.

## Contents

```text
portable-robot/
├── README.md
├── robot-character.css
├── robot-character.js
└── assets/
    ├── body.svg / body_turn_left.svg
    ├── head.svg / head_turn_left.svg
    ├── leftleg.svg / leftleg_turn_left.svg
    ├── lhand.svg / lhand_turn_left.svg
    ├── rhand.svg / rhand_turn_left.svg
    └── rightleg.svg / rightleg_turn_left.svg
```

Keep all twelve SVG files together. Each direction has its own calibrated positions, layer order, sizes, scales, rotations, and transform origins.

## Requirements

- A modern browser with ES module support.
- GSAP 3.13 or later.
- An HTTP server. Do not open the consuming page with a `file://` URL, because browser module security rules may block the import.

## Basic installation

1. Copy the entire `portable-robot` directory into the destination project.
2. Load `robot-character.css` in the page `<head>`.
3. Add an empty mount element where the character should appear.
4. Load GSAP.
5. Import `createRobot`, await it, and keep the returned controller.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="./portable-robot/robot-character.css">
  </head>
  <body>
    <div id="my-robot"></div>

    <script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
    <script type="module">
      import { createRobot } from './portable-robot/robot-character.js';

      const robot = await createRobot(document.querySelector('#my-robot'), {
        assetBaseUrl: './portable-robot/assets/',
        autoplay: 'idle',
      });

      // Save the controller wherever the rest of the application can use it.
      window.myRobot = robot;
    </script>
  </body>
</html>
```

`createRobot` is asynchronous because it waits for all six SVG images to load before applying the calibrated pose and starting an animation. Always `await` it.

## Initialization options

```js
const robot = await createRobot(mountElement, {
  assetBaseUrl: './portable-robot/assets/',
  autoplay: 'idle',
  scale: 1,
  gsap: window.gsap,
});
```

| Option | Default | Description |
| --- | --- | --- |
| `assetBaseUrl` | `./assets` | Directory containing the twelve right- and left-facing SVG files. It is resolved relative to the HTML document, not relative to the module. |
| `autoplay` | `'idle'` | Animation started after assets load. Use `false` or `null` to leave the robot in its static base pose. |
| `scale` | `1` | Initial visual scale. Use a positive number. |
| `gsap` | `globalThis.gsap` | A GSAP instance. Pass this explicitly when GSAP is imported through a bundler. |

## Animation API

Run an animation with `play(name)`:

```js
robot.play('wave');
```

Supported names are:

| Name | Behavior |
| --- | --- |
| `idle` | Continuous subtle character motion and floating. |
| `inspired` | Continuous, more energetic idle motion. |
| `wave` | One wave, followed by the previously active idle mode when applicable. |
| `floatWaveAndSway` | One combined lift, wave, and side-to-side sway, followed by the base pose. |
| `lookAround` | One left/right head gesture, followed by the base pose. |
| `nod` | One nod sequence, followed by the base pose. |
| `bounce` | One full-character bounce, followed by the base pose. |
| `ponder` | One thinking gesture, followed by the base pose. |
| `dance` | One short dance sequence, followed by the base pose. |
| `talk` | Continuous talking motion until stopped. |

Additional controller methods and properties:

```js
robot.startTalk();       // Same behavior as robot.play('talk').
robot.stopTalk();        // Stops talking and restores the head and body.
robot.stop();            // Stops everything and restores the exact base pose.
robot.setFacing('left'); // Applies the calibrated left artwork, placement, and anchors.
robot.setFacing('right');// Restores the calibrated right-facing pose.
robot.setScale(0.75);    // Changes the component scale without changing part geometry.
console.log(robot.action);
console.log(robot.facing);
console.log(robot.element);
robot.destroy();         // Kills timelines and removes generated markup.
```

Do not animate the generated body-part elements from application code while a built-in animation is running. Two timelines changing the same transforms will fight each other.

`setFacing()` accepts only `'left'` or `'right'`. It swaps all six SVGs as one pose and applies that direction's positions and transform origins. The mount dispatches `robot:facingchange` with `{ facing }` whenever this method or a built-in directional animation changes the pose. `stop()` always restores the right-facing pose.

## Connecting application controls

Controls are intentionally not included. Connect any buttons or application events you want:

```html
<button id="wave">Wave</button>
<button id="talk">Start talking</button>
<button id="silence">Stop talking</button>
<button id="stop">Stop all motion</button>

<script type="module">
  import { createRobot } from './portable-robot/robot-character.js';

  const robot = await createRobot(document.querySelector('#my-robot'), {
    assetBaseUrl: './portable-robot/assets/',
  });

  document.querySelector('#wave').addEventListener('click', () => robot.play('wave'));
  document.querySelector('#talk').addEventListener('click', () => robot.startTalk());
  document.querySelector('#silence').addEventListener('click', () => robot.stopTalk());
  document.querySelector('#stop').addEventListener('click', () => robot.stop());
</script>
```

The mount element dispatches `robot:actionchange` whenever the active action changes:

```js
robot.element.addEventListener('robot:actionchange', (event) => {
  console.log('Current action:', event.detail.action);
});

robot.element.addEventListener('robot:facingchange', (event) => {
  console.log('Facing:', event.detail.facing);
});
```

This is useful for highlighting controls without coupling the component to a particular UI.

## Sizing and page layout

The calibrated internal coordinate system is always `390 × 500`. Do not resize individual SVG elements or override their `left`, `top`, `width`, `transform`, or `transform-origin` values.

Use the public scale API instead:

```js
robot.setScale(0.65);
```

Place the mount element with normal application layout:

```css
.hero-character {
  position: absolute;
  right: 3rem;
  bottom: 2rem;
}
```

```html
<div id="my-robot" class="hero-character"></div>
```

The mount element retains a `390 × 500` layout box. If the page must reserve the scaled size exactly, place it inside a wrapper with the desired dimensions, or set corresponding width and height values in application CSS. Do not apply `transform` to `.robot-wrapper`, because built-in animations own that transform.

## Multiple robots

Each mount receives its own markup, state, and GSAP timelines, so multiple instances are supported:

```js
const first = await createRobot(document.querySelector('#robot-one'), {
  assetBaseUrl: './portable-robot/assets/',
  autoplay: 'idle',
});

const second = await createRobot(document.querySelector('#robot-two'), {
  assetBaseUrl: './portable-robot/assets/',
  autoplay: 'inspired',
  scale: 0.7,
});

first.play('wave');
second.play('dance');
```

Never mount two instances into the same element. The component detects that mistake and throws an error.

## Bundler usage

When GSAP is installed from npm, import it and pass the instance explicitly:

```js
import { gsap } from 'gsap';
import { createRobot } from './portable-robot/robot-character.js';
import './portable-robot/robot-character.css';

const robot = await createRobot(document.querySelector('#my-robot'), {
  gsap,
  assetBaseUrl: new URL('./portable-robot/assets/', document.baseURI).href,
});
```

Depending on the bundler, static SVG assets may be copied or fingerprinted. Ensure the final `assetBaseUrl` points to the directory actually served by the built application.

## Lifecycle in single-page applications

Always destroy the instance when its page or component unmounts:

```js
let robot;

async function mount() {
  robot = await createRobot(document.querySelector('#my-robot'), {
    assetBaseUrl: './portable-robot/assets/',
  });
}

function unmount() {
  robot?.destroy();
  robot = null;
}
```

`destroy()` kills all timelines and tweens owned by the instance, removes the generated character markup, and makes the mount reusable.

## Reduced motion

Choose autoplay based on the visitor's preference:

```js
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const robot = await createRobot(document.querySelector('#my-robot'), {
  assetBaseUrl: './portable-robot/assets/',
  autoplay: reduceMotion ? false : 'idle',
});
```

Application controls may still call `play()` when the visitor explicitly requests an animation.

## Correct integration checklist

- Serve the page over HTTP or HTTPS.
- Load the CSS before initializing the robot.
- Load or import GSAP before calling `createRobot`.
- Copy all twelve right- and left-facing SVG assets and provide the correct `assetBaseUrl`.
- Await `createRobot`.
- Resize through `scale` or `setScale`, never by editing individual parts.
- Do not apply application transforms to `.robot-wrapper`, `.robot`, or `.robot-part`.
- Do not run external GSAP tweens on the generated parts at the same time as built-in animations.
- Call `stop()` before a page-level transition when a clean static pose is needed.
- Call `destroy()` when removing the containing view.
- Test repeated animation changes and verify that Stop restores the base pose.
- Check the browser console for missing SVG files or JavaScript errors.

## Troubleshooting

### The character is invisible or incomplete

Open the browser Network panel and verify that every SVG request returns HTTP 200. The most common problem is an incorrect `assetBaseUrl`.

### `GSAP is required` is thrown

The GSAP script has not loaded yet. Move the initialization after the GSAP script, or pass an imported GSAP instance with `{ gsap }`.

### `Unknown robot animation` is thrown

Use one of the exact names listed in the Animation API table. Names are case-sensitive.

### A body part appears detached

Check for destination-project CSS targeting generic `img`, `.robot`, or `.robot-part` selectors. Do not override the component's part positions, sizes, transforms, or transform origins.

### The page position and animation conflict

Position the `.portable-robot` mount or an outer application wrapper. Do not position or transform the generated `.robot-wrapper` itself.

### An animation continues after navigation

Call `robot.destroy()` from the framework or router unmount lifecycle.
