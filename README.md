# Animated SVG Robot Character

A responsive animated HTML character assembled from separate SVG parts and animated with GSAP.

## Project files

```text
.
├── index.html
├── style.css
├── script.js
└── assets/
    ├── head.svg
    ├── body.svg
    ├── lhand.svg
    ├── rhand.svg
    ├── leftleg.svg
    └── rightleg.svg
```

Keep the SVG files in the `assets/` folder with the exact filenames above. The `<img>` elements in `index.html` reference those paths directly.

## Animation quality guide

A Hebrew summary of the animation principles, fixes, and lessons learned for keeping the character balanced, natural, structurally logical, and free from body-part distortion is available in [`docs/animation-guidelines-he.md`](docs/animation-guidelines-he.md).

## Reusing the character in another project

The self-contained [`portable-robot/`](portable-robot/) package includes the six SVG assets, scoped character-only CSS, a reusable animation runtime, and a complete English integration guide. It can be copied without the demo page, background, controls, debug tools, or animation editor.

## Local preview

Run a local static server from the repository root:

```bash
python3 -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173/index.html
```

## GitHub Pages link

This repository includes a GitHub Actions workflow that deploys the static site to GitHub Pages on every push to the `main` branch.

After the workflow finishes successfully, your public GitHub Pages link will be:

```text
https://<your-github-username>.github.io/<repository-name>/
```

For this repository name, the URL will usually look like:

```text
https://<your-github-username>.github.io/animation/
```

If the repository is owned by an organization, replace `<your-github-username>` with the organization name.

### Enable GitHub Pages

1. Push this branch to GitHub and merge it into `main`.
2. Open the repository on GitHub.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, choose **GitHub Actions** as the source.
5. Open the **Actions** tab and wait for **Deploy static site to GitHub Pages** to complete.
6. Copy the live link from **Settings → Pages** or from the workflow summary.

## Popa 2D game clips

For a standalone browser-game integration, download
[`downloads/popa-browser.zip`](downloads/popa-browser.zip). The package includes
all assets, a scoped stylesheet, an instance-based `createPopa()` API and a working
`example.html`, without the editors or GSAP. See the
[browser package guide](docs/popa-browser-package.md) for setup and usage.

The current cat demo includes the nine requested game clips, a fixed floor shadow,
an interaction event and a held-item anchor. See [Popa game animation integration](docs/popa-game-animations.md)
for clip names, timings, the `window.popa` API and validation commands.

## Popa's World prototype

Open [`game.html`](game.html) for the furnished room and fruit-catching garden game.
The prototype includes keyboard/touch controls, combos, hazards, a timed round,
local rewards and a room decoration purchase. See [the world guide](docs/popa-world.md).

## Popa salon

Open [`salon.html`](salon.html) for the care-and-haircut minigame using the uploaded
PNG artwork. Hair length changes preserve aligned roots, scissors rotate around
a shared bolt, and completed requests reward the same local world wallet.
See [the salon guide](docs/popa-salon.md).

The salon now includes area-based care, a visual hairstyle request, creative
scoring, before/after reveals and a persistent hairstyle album with unlocks.
Haircut sections continue to be chosen using the section buttons.

## איורים וקבצי הרכבה

ראו [מפת התיקיות והוספת איורים](docs/asset-organization.md). קטלוג האביזרים נמצא ב־`assets/catalog.json`.

## עורך אביזרים

פתחו `studio.html` לעריכת הרכבת המספריים ותנועת הגזירה. [מדריך עריכה, ייצוא והעלאה](docs/prop-studio.md).

## פינת הציפורניים

מיני־משחק משולב ב־`manicure.html`: ניקוי, תיקון, ציור חופשי, ייבוש וקישוט. [הפעלה, ארגון האיורים ובדיקות](docs/popa-manicure.md).

## Popa outfit fitting

Open `index.html?outfits=1` in the character studio to position the six uploaded looks on Popa, preview walking/waving, and export or import placement JSON. Each look saves a separate local draft. Artwork lives in `assets/characters/popa/outfits/<look>/parts/`; source sheets and the original manifest live in `source-art/characters/popa/outfits/`. See `assets/characters/popa/outfits/README.md` for coordinates and the integration workflow. Fitting drafts are not applied automatically to the game.

## Character animation and furniture motion

Use `index.html?edit=1` for Popa's existing animation editor. The optional **רהיט לדוגמה** panel can show a sofa, cabinet, lamp or window behind her. Reference position/size saves separately and never enters character animation JSON. Add sitting-down, sitting and getting-up clips to the normal character timeline, or copy the old furniture-studio draft without deleting it. Old `?furniture=sofa` links redirect here.

Use `studio.html?category=furniture` for independent layered furniture motion: cabinet doors, lamp shade, curtains and sofa cushions. Each furniture folder keeps its own `assembly.json` and `animations/` files; the artwork remains in `images/`. These motions do not contain Popa or her body poses. The original salon props editor remains available at `studio.html`.

A new authored sitting study is available at `index.html?edit=1&reference=sofa&motion=sit-demo`. Its native character clips are stored in `assets/characters/popa/animations/sitting-demo.json`: sitting down, a relaxed seated loop, and standing up. They add new animation IDs and preserve existing edited clips. The relaxed loop starts playing automatically unless reduced motion is requested. This is a studio study; it does not replace the published game interaction.

## Momo animations

Open `character-studio.html?character=momo&mode=animation` to review seven draft
motions on the existing character timeline. Momo has separate animation and
placement storage. Dragging a part at a chosen time records a keyframe; export
`momo-animation-drafts.json` for review. These drafts are **not loaded by the game**.
The approved snapshot in `assets/characters/momo/animations/approved.json` now drives idle, greeting, dialogue, curiosity, happiness and rest in the game. Future studio edits stay separate. See `assets/characters/momo/animations/README.md` for the approval workflow.

## First story crop

After accepting Momo’s invitation, the garden opens three strawberry plots. Plant, water, wait 20 seconds, then harvest each plot once. Crop timestamps survive reloads. The third harvest saves the strawberries and advances the story to baking with Bonnie in one transaction. The fruit-catching game remains available separately; Bonnie and baking are the next implementation step. See `docs/strawberry-garden.md`.
