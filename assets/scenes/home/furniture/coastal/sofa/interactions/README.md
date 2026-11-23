# Character actions for the sofa

Animate Popa in her existing editor at `index.html?edit=1`. The optional furniture reference panel shows the sofa as a static fitting example. Its position is stored separately from character animation JSON. **הוספת אנימציות ישיבה לפופה** creates ordinary `sit-enter`, `sit-hold` and `sit-exit` timeline clips. **ייבוא העבודה מהמסך הקודם** copies the old draft into separate character clips without deleting the original browser data. Old `index.html?furniture=sofa` links redirect to this editor. The retired dedicated furniture-character screen has been removed.

Furniture's own layered motion belongs at `studio.html?category=furniture`, separate from character poses. Sofa cushion motion is in `../animations/cushion-bounce.json`; cabinet, lamp and window each have their own analogous animation folders.

The following describes the existing published gameplay interaction data, which remains in use until newly edited character motion is integrated:

`sit.json` uses a 420×320 sofa canvas. Each key stores an anchor for Popa's feet in sofa coordinates, scale relative to her 440×475 character canvas, facing, and local transforms for selected body parts. Phases are `enter` (sit down), `hold` (seamless loop), and `exit` (get up). The approach point is where the room navigation sends Popa before sitting. Room collision constraints can project that point onto reachable floor.

Edit character clips and export them with the existing character editor. Furniture examples save in `popa.character.reference.v1`, separate from `popaAnimationEditorDataV2`. The optional legacy import reads `popa.furniture.sofa.sit.v1` and copies its poses into new native timeline clips. It leaves that old key intact.

`game.html?interactionPreview=sofa` remains available for backwards compatibility with old object-relative drafts. The regular game continues using committed `sit.json`; new character exports require integration before they change the shared game.

The game animates entry, holds until another action, then plays the exit before walking. The actual dressed character is attached to the sofa rig while sitting, so furniture movement/resizing preserves placement and clothing follows the animated bones. Keyboard input, floor clicks and approaching another item trigger getting up. Going to the garden also gets up first. Reduced-motion mode skips entry/exit movement and holds a static sitting pose.

For future furniture, add an interaction file in that furniture's `interactions/` folder and register the rig/action in the studio and game. Keep original PNG parts in the existing `images/` directory; do not duplicate artwork into interaction folders.

Rig revision 2 fits the cushion with an independent vertical scale and keeps the seated feet below the hem. Old local drafts upgrade only the original hidden-foot defaults and foreground setting, retaining user-edited placement and custom bone values.
