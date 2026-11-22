# Room arrangement

The room's **סידור החדר** button edits whole illustrated objects, including multipart furniture and the rug. Drag an object or select it in the panel, then adjust its position, size and stacking layer. Larger layers appear in front; Popa uses layer 4. The original internal prop assemblies remain unchanged.

Positions use the design canvases in `assets/scenes/home/furniture/layout.json` (1280×820 wide, 390×792 portrait). Desktop and phone arrangements are independent. Drafts auto-save locally under `popa.home-layout.v1`; finishing returns to normal object interactions. Download `popa-room-layout.json` to share or back up both arrangements. Import validates the schema and restores positions only, without changing artwork paths. Reviewed shared arrangements can be integrated back into `layout.json`.

The uploaded empty coastal background is stored at `assets/scenes/home/background/coastal-room.png`, referenced by `layout.json` and the asset catalogue. It stretches with the room so the floor boundary remains at the same relative height in both arrangements.

The coastal window is three independent room objects: `window` (frame), `window-curtain-left`, and `window-curtain-right`. Existing drafts with a single assembled window migrate on load; other saved furniture placements are preserved. The original window rig remains available as source assembly.

Drag the panel by its title handle to reach furniture behind it, or focus the handle and use arrow keys. The panel stays within room bounds. Object names appear only in the editor selector and accessible labels. The mounting rod is no longer referenced by the room, window assembly, or catalogue. Existing saved layouts with a rod ignore it while preserving frame and curtain coordinates. Downloads are optional backups; autosave persists in this browser, not on the shared site.
