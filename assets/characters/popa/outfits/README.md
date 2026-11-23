# Popa outfit fitting

`catalog.json` lists 19 looks and 87 active transparent PNG parts. Each look has its own `parts/` directory. The starting positions are **unfitted drafts**, not approved game placements.

Open `index.html?outfits=1` to fit clothing on the character rig. X/Y are image centre coordinates on the 440 × 475 character canvas; width/height include the PNG's transparent padding. Rotation is clockwise degrees around the image centre. Layer uses the same stacking scale as `../assembly.json`; larger numbers appear in front. Attachment follows the existing body, head, arm or foot animation, including its pivot. Left/right names match rig names rather than the viewer's side.

Drafts save locally under `popa.outfit-placements.v1`, separately for each look. Download `popa-look-<look>.json` or `popa-all-look-placements.json` and send the file for integration. These JSON files contain placement data and asset references, never image copies. Import restores the same format. Download before clearing browser data or moving devices.

Reviewed placement files belong in `<look>/placements.json` after integration; keep images in `parts/`. No draft is automatically applied to the game. Original source sheets, source manifest and contact sheet live in `source-art/characters/popa/outfits/`.

Artwork revision 2 restores pixels outside the original sprite-sheet grid cells. `naturalSize` remains the original logical placement canvas so saved positions and rotations remain stable. `artworkSize` is the full restored PNG size and `artworkOffset` is its origin relative to that logical canvas. The renderer applies that offset and rotates around the original logical centre. The extraction source manifest stays unchanged. `edge-audit.json` records all active source regions; `scripts/restore-popa-outfit-edges.py` rebuilds the PNGs directly from original source pixels.

Cloud pajamas revision 2 uses five separate garments from `source-art/characters/popa/outfits/Sources/cloud-pajamas-v2.png`: `pajama_body` (shirt including its illustrated collar), `sleeve_left`, `sleeve_right`, `pants_left`, `pants_right`. The existing hat and star remain available. Superseded separate collars are archived under `source-art/characters/popa/outfits/archive/cloud-v1/`. A dedicated manifest records exact source crops. Old cloud drafts retain matching garment transforms; obsolete slippers/collars are replaced with default new pants, which need manual fitting.

## Published cloud look

`cloud/placements.json` preserves the user-provided fitting file. The cloud catalogue entry references it via `placements`. Fresh studio drafts start from this published fit; existing local drafts still take priority. In the room, click the cabinet and choose the cloud pajamas or the original outfit. `game/wardrobe.js` uses the same artwork offsets, decimal layer ordering and rig attachments as the studio. Outfit selection persists in `popaWorldV1.outfit` and follows Popa into the garden. Returning to the original outfit restores the shirt, pinafore and flower. Only looks with a published placement file are available in the game.

## Replacement pastel collection

The uploaded sheet is preserved once at `source-art/characters/popa/outfits/Sources/pastel-collection-v2.png`. `pastel-collection-v2-manifest.json` records each complete garment region. Runtime parts are organised by look:

| Look | Parts |
| --- | --- |
| `moon-post` | cape, hair bow, star bag |
| `peach` | dress, hair clip, basket bag |
| `caramel` | shirt, skirt, chest bow |
| `lotus` | shirt, two sleeves, skirt, hair clip |
| `storybook` | dress, hair bow, book bag |
| `moon-sleep` | coat, two shorts pieces, hair clip |

The 21 new parts are unfitted studio drafts. Decorations already drawn into a garment remain part of that image. Extraction follows full connected outlines instead of grid-cell boundaries, retaining original antialiased pixels and excluding disconnected neighbouring fragments. The approved cloud look and `cloud/placements.json` remain unchanged. Superseded look images are archived under `source-art/characters/popa/outfits/archive/six-looks-v1/`; they are no longer loaded in the studio. Old saved drafts discard retired look IDs while retaining cloud placements.

## Additional collectible collections

Two original RGBA sheets are stored under `source-art/characters/popa/outfits/Sources/collectible-world-v3.png` and `collectible-concepts-v3.png`. `collectible-collections-v3-manifest.json` records the 59 extracted parts and source rectangles. Each part is isolated from neighbouring garments while retaining its original outline and transparent padding.

| Look | Parts |
| --- | --- |
| `mosaic` | shirt, two sleeves, skirt, handbag |
| `marigold` | shirt, two sleeves, skirt, hair bow, handbag |
| `winter-berry` | sweater, two sleeves, two pants pieces, scarf, handbag |
| `mediterranean` | shirt, skirt, hair clip, basket bag |
| `celestial` | cape, dress, hair clip, handbag |
| `mint-messenger` | coat, two sleeves, skirt, hair bow, wing bag |
| `candy-pop` | jacket, skirt, hair bow, candy bag |
| `sakura` | coat, two sleeves, skirt, lantern bag |
| `arcade-school` | vest, skirt, hair clip, heart bag |
| `lemon-picnic` | shirt, two sleeves, skirt, basket bag |
| `lotus-fairy` | dress, hair clip, wings, lantern bag |
| `pixel-play` | jacket, two sleeves, skirt, console bag |

All twelve additions are studio fitting drafts. Existing looks and published cloud placements remain unchanged. The manifest-driven extraction tool discovers each collection manifest so it can rebuild the complete active catalogue without relying on fixed grid boundaries.
