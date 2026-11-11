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
