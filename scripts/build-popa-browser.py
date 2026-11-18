"""Build the self-contained browser package and deterministic downloadable ZIP."""
from pathlib import Path
import json
import shutil
import zipfile
ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'portable-popa'
if DEST.exists():
    shutil.rmtree(DEST)
DEST.mkdir()
files = ['popa-browser.js', 'popa-browser.css', 'cat-animations.js', 'cat-expressions.js',
         'popa-clips.js', 'assets/characters/popa/assembly.json']
layout = json.loads((ROOT / 'assets/characters/popa/assembly.json').read_text())
assets = {layer['file'].split('/')[-1] for layer in layout['layersBackToFront']}
assets.update(f'eye_{pose}_{side}.png' for pose in ['happy','open','sleep'] for side in ['left','right'])
assets.update(f'mouth_{pose}.png' for pose in ['happy','closed','surprised','tongue'])
files += [f'assets/characters/popa/parts/{name}' for name in sorted(assets)]
for file in files:
    target = DEST / file
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(ROOT / file, target)
for source, target in [('docs/popa-browser-package.md','README.md'), ('examples/popa-browser.html','example.html')]:
    shutil.copyfile(ROOT / source, DEST / target)
    files.append(target)
archive = ROOT / 'downloads' / 'popa-browser.zip'
archive.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as out:
    for file in sorted(files):
        entry = zipfile.ZipInfo(f'popa-browser/{file}', date_time=(2026,1,1,0,0,0))
        entry.compress_type = zipfile.ZIP_DEFLATED
        entry.external_attr = 0o100644 << 16
        out.writestr(entry, (DEST / file).read_bytes())
print(f'Built {archive.relative_to(ROOT)}: {len(files)} files, {archive.stat().st_size:,} bytes')
