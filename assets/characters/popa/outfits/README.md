# Popa outfit fitting

`catalog.json` lists six looks and 54 original transparent PNG parts. Each look has its own `parts/` directory. The starting positions are **unfitted drafts**, not approved game placements.

Open `index.html?outfits=1` to fit clothing on the character rig. X/Y are image centre coordinates on the 440 × 475 character canvas; width/height include the PNG's transparent padding. Rotation is clockwise degrees around the image centre. Layer uses the same stacking scale as `../assembly.json`; larger numbers appear in front. Attachment follows the existing body, head, arm or foot animation, including its pivot. Left/right names match rig names rather than the viewer's side.

Drafts save locally under `popa.outfit-placements.v1`, separately for each look. Download `popa-look-<look>.json` or `popa-all-look-placements.json` and send the file for integration. These JSON files contain placement data and asset references, never image copies. Import restores the same format. Download before clearing browser data or moving devices.

Reviewed placement files belong in `<look>/placements.json` after integration; keep images in `parts/`. No draft is automatically applied to the game. Original source sheets, source manifest and contact sheet live in `source-art/characters/popa/outfits/`.
