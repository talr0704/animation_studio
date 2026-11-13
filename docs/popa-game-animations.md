# Popa game animation clips

The demo exposes nine clips through `window.popa` after the `popa:ready` DOM event.
The calibrated assembly and pivots are in `assembly_layout.json`; track data is in
`popa-clips.js`. The camera and display scale stay fixed.

| Name | Duration | Playback |
| --- | --- | --- |
| idle | 3 seconds | Loop; feet planted, one 110 ms blink per cycle |
| walk | 0.8 seconds | Loop in place; game controls world position |
| happy | 1.2 seconds | Jump with anticipation and landing |
| wave | 1.6 seconds | Two small shoulder waves |
| curious | 2 seconds | Head tilt with a held pose |
| interact | 1.1 seconds | Contact marker at 0.55 seconds |
| hold | 2.5 seconds | Loop in a dedicated holding pose |
| pet | 1.8 seconds | Lean into touch, two tail sways |
| rest | 4 seconds | Loop in a low resting pose with closed eyes |

```js
await popa.play('wave'); // Resolves on completion, or cancellation.
await popa.play('walk'); // Resolves once the loop has started.
popa.stop();            // Smooth 220 ms return to the base pose.
popa.setExpression('happy'); // happy, neutral, sleepy, surprised, playful
```

Switching clips blends the previous rig pose to the new clip's initial pose over
220 ms. Intro/outro blends are separate from each clip's stated duration. Hold and
rest enter and leave their dedicated poses smoothly. One-shot clips start and end
in the base pose; every repeating track has matching endpoints and uses the same
cycle duration. The selected mouth remains unchanged. Rest temporarily uses the
existing sleep-eye assets; leaving rest restores the selected expression. Idle
uses the same sleep-eye assets for a short blink without changing the selection.

Listen for the game interaction marker on the character or document. It fires once
per completed contact, after any entrance blend, and is canceled if the action is
interrupted before contact:

```js
popa.element.addEventListener('popa:interact', event => {
  // event.detail: { animation: 'interact', time: 0.55 }
  collectNearbyItem();
});
popa.play('interact');
```

To hold an item, attach a DOM element to the provided anchor between the paws:

```js
const item = document.createElement('img');
item.src = '/items/apple.png';
item.alt = 'Apple';
popa.attachItem(item);
popa.play('hold');
// Later:
popa.clearItem();
popa.stop();
```

`popa.itemAnchor` is a DOM anchor centered at (220, 334) in the 440 × 475 assembly.
It follows the same body rig as the costume. Held items fit inside a 44 × 44 box;
they are drawn over the dress and behind the paws during hold. The anchor and
item remain available when changing clips; the game decides when to clear them.
The tail's layer is never raised. The floor shadow is a separate element and
stays on the ground while its size responds gently to jump height.

Reduced-motion preferences skip clip playback and transition effects. Explicit
expression selection remains available.

Validation from the repository root, with a local HTTP server running:

```sh
node --test tests/popa-assembly.test.js tests/popa-clips.test.js
python3 tests/popa-animation-smoke.py http://127.0.0.1:4173/
python3 tests/popa-expression-smoke.py http://127.0.0.1:4173/
```
