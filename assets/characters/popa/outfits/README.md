# Popa outfit fitting

`catalog.json` lists six looks and 52 active transparent PNG parts. Each look has its own `parts/` directory. The starting positions are **unfitted drafts**, not approved game placements.

Open `index.html?outfits=1` to fit clothing on the character rig. X/Y are image centre coordinates on the 440 × 475 character canvas; width/height include the PNG's transparent padding. Rotation is clockwise degrees around the image centre. Layer uses the same stacking scale as `../assembly.json`; larger numbers appear in front. Attachment follows the existing body, head, arm or foot animation, including its pivot. Left/right names match rig names rather than the viewer's side.

Drafts save locally under `popa.outfit-placements.v1`, separately for each look. Download `popa-look-<look>.json` or `popa-all-look-placements.json` and send the file for integration. These JSON files contain placement data and asset references, never image copies. Import restores the same format. Download before clearing browser data or moving devices.

Reviewed placement files belong in `<look>/placements.json` after integration; keep images in `parts/`. No draft is automatically applied to the game. Original source sheets, source manifest and contact sheet live in `source-art/characters/popa/outfits/`.

Artwork revision 2 restores pixels outside the original sprite-sheet grid cells. `naturalSize` remains the original logical placement canvas so saved positions and rotations remain stable. `artworkSize` is the full restored PNG size and `artworkOffset` is its origin relative to that logical canvas. The renderer applies that offset and rotates around the original logical centre. The extraction source manifest stays unchanged. `edge-audit.json` records all active source regions; `scripts/restore-popa-outfit-edges.py` rebuilds the PNGs directly from original source pixels.

Cloud pajamas revision 2 uses five separate garments from `source-art/characters/popa/outfits/Sources/cloud-pajamas-v2.png`: `pajama_body` (shirt including its illustrated collar), `sleeve_left`, `sleeve_right`, `pants_left`, `pants_right`. The existing hat and star remain available. Superseded separate collars are archived under `source-art/characters/popa/outfits/archive/cloud-v1/`. A dedicated manifest records exact source crops. Old cloud drafts retain matching garment transforms; obsolete slippers/collars are replaced with default new pants, which need manual fitting.
