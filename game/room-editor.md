# Room arrangement

The room's **סידור החדר** button edits whole illustrated objects, including multipart furniture and the rug. Drag an object or select it in the panel, then adjust its position, size and stacking layer. Larger layers appear in front; Popa uses layer 4. The original internal prop assemblies remain unchanged.

Positions use the design canvases in `assets/scenes/home/furniture/layout.json` (1280×820 wide, 390×792 portrait). Desktop and phone arrangements are independent. Drafts auto-save locally under `popa.home-layout.v1`; finishing returns to normal object interactions. Download `popa-room-layout.json` to share or back up both arrangements. Import validates the schema and restores positions only, without changing artwork paths. Reviewed shared arrangements can be integrated back into `layout.json`.

The uploaded empty coastal background is stored at `assets/scenes/home/background/coastal-room.png`, referenced by `layout.json` and the asset catalogue. It stretches with the room so the floor boundary remains at the same relative height in both arrangements.
