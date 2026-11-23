# Character actions for the sofa

Open `index.html?furniture=sofa` in Popa's character studio (separate from the props editor and room arrangement UI).

`sit.json` uses a 420×320 sofa canvas. Each key stores an anchor for Popa's feet in sofa coordinates, scale relative to her 440×475 character canvas, facing, and local transforms for selected body parts. Phases are `enter` (sit down), `hold` (seamless loop), and `exit` (get up). The approach point is where the room navigation sends Popa before sitting. Room collision constraints can project that point onto reachable floor.

Select a phase, scrub the timeline, choose Popa or a body part, then drag or edit the numeric fields. Editing creates a key at the current time. Start/end keys cannot be removed. Editing a sitting boundary also updates the matching phase boundaries and hold loop seam. The seat cushion can appear in front of the character; the lower original sofa frame provides foreground arm/leg edges without changing its artwork.

Drafts save under `popa.furniture.sofa.sit.v1`. **בדיקה במשחק** opens `game.html?interactionPreview=sofa`, loads that local draft and automatically approaches the sofa. Ordinary gameplay loads only the committed `sit.json`. Export `sofa-sit.json` and send it for integration into this directory. Import validates the furniture ID, timing, coordinates, bones and scale values before replacing the draft.

The game animates entry, holds until another action, then plays the exit before walking. The actual dressed character is attached to the sofa rig while sitting, so furniture movement/resizing preserves placement and clothing follows the animated bones. Keyboard input, floor clicks and approaching another item trigger getting up. Going to the garden also gets up first. Reduced-motion mode skips entry/exit movement and holds a static sitting pose.

For future furniture, add an interaction file in that furniture's `interactions/` folder and register the rig/action in the studio and game. Keep original PNG parts in the existing `images/` directory; do not duplicate artwork into interaction folders.
