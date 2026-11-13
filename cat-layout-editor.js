const STORAGE_KEY = 'popaAssemblyPositionsV3';
const labels = { shirt: 'חולצה', tail: 'זנב', pinafore: 'סרפן', torso: 'גוף', left_arm: 'יד בצד שמאל', right_arm: 'יד בצד ימין', head: 'ראש', ear_left: 'אוזן שמאל', ear_right: 'אוזן ימין', foot_left: 'כף רגל שמאל', foot_right: 'כף רגל ימין', flower: 'פרח', eye_happy_left: 'עין שמאל', eye_happy_right: 'עין ימין', mouth_happy: 'פה', nose: 'אף', whiskers_left: 'שפם שמאל', whiskers_right: 'שפם ימין' };

export function mountLayoutEditor({ layout, character, pause, setPivot }) {
  const frame = character.closest('.cat-frame');
  const images = new Map([...character.querySelectorAll('.cat-part')].map(image => [image.dataset.sprite, image]));
  const originals = new Map(layout.layersBackToFront.map(layer => [layer.file.split('/').pop().replace('.png', ''), layer]));
  const dimensions = new Map([...images].map(([name, image]) => [name, { width: parseFloat(image.style.width), height: parseFloat(image.style.height) }]));
  const order = new Map([...originals.keys()].map((name, index) => [name, originals.get(name).zIndex ?? index]));
  let positions = {};
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    for (const [name, value] of Object.entries(saved)) {
      if (originals.has(name) && ['x', 'y', 'rotate'].every(key => Number.isFinite(value[key]))) positions[name] = { x: value.x, y: value.y, rotate: value.rotate, ...(Number.isFinite(value.width) && value.width > 0 ? { width: value.width } : {}), ...(Number.isFinite(value.height) && value.height > 0 ? { height: value.height } : {}), ...(Number.isFinite(value.pivotX) ? { pivotX: value.pivotX } : {}), ...(Number.isFinite(value.pivotY) ? { pivotY: value.pivotY } : {}), ...(Number.isInteger(value.zIndex) ? { zIndex: value.zIndex } : {}) };
    }
  } catch { /* A fresh layout remains usable when browser storage is unavailable. */ }
  let preview;
  const pivotMarker = document.createElement('button');
  pivotMarker.type = 'button';
  pivotMarker.className = 'cat-pivot';
  pivotMarker.setAttribute('aria-label', 'גרירת נקודת הציר של החלק הנבחר');
  pivotMarker.hidden = true;
  character.append(pivotMarker);
  let selected = 'shirt';
  let enabled = false;
  const panel = document.createElement('section');
  panel.className = 'layout-editor';
  panel.dir = 'rtl';
  panel.setAttribute('aria-label', 'סידור חלקי הדמות');
  panel.innerHTML = `
    <button type="button" data-layout="toggle" aria-expanded="false">סידור מיקום החלקים</button>
    <div data-layout="body" hidden>
      <p>בחר חלק וגרור על הדמות, או הזן מיקום, גודל ושכבה. מספר שכבה גבוה מוצג מלפנים. המיקומים נשמרים בדפדפן הזה בלחיצה על שמירה.</p>
      <label>חלק <select data-layout="part"></select></label>
      <div class="layout-editor__fields">
        <label>מיקום X <input type="number" step="1" data-layout="x"></label>
        <label>מיקום Y <input type="number" step="1" data-layout="y"></label>
        <label>סיבוב ° <input type="number" step="1" data-layout="rotate"></label>
        <label>רוחב <input type="number" step="1" min="1" data-layout="width"></label>
        <label>גובה <input type="number" step="1" min="1" data-layout="height"></label>
        <label>שכבה <input type="number" step="1" data-layout="zIndex"></label>
      </div>
      <div class="layout-editor__fields">
        <label>ציר X <input type="number" step="1" data-layout="pivotX"></label>
        <label>ציר Y <input type="number" step="1" data-layout="pivotY"></label>
      </div>
      <label><input type="checkbox" data-layout="pivotMode"> מיקום ציר בלחיצה על הדמות</label>
      <p>גרור את הנקודה האדומה כדי להזיז את הציר. הזזת הציר אינה מזיזה את החלק.</p>
      <label><input type="checkbox" data-layout="lockRatio" checked> שמירת יחס גובה־רוחב</label>
      <div class="layout-editor__buttons">
        <button type="button" data-layout="forward">העבר קדימה</button>
        <button type="button" data-layout="backward">העבר אחורה</button>
        <button type="button" data-layout="front">הבא לחזית</button>
        <button type="button" data-layout="back">שלח לרקע</button>
        <button type="button" data-layout="previewPivot">בדיקת סיבוב סביב הציר</button>
        <button type="button" data-layout="save">שמירת מיקומים</button>
        <button type="button" data-layout="download">הורדת קובץ הרכבה</button>
        <button type="button" data-layout="reset">איפוס החלק הנבחר</button>
      </div>
      <span role="status" data-layout="status"></span>
    </div>`;
  document.querySelector('.controls').before(panel);
  const find = name => panel.querySelector(`[data-layout="${name}"]`);
  const select = find('part');
  for (const [name] of originals) {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = labels[name] || name;
    select.append(option);
  }
  select.value = selected;
  function value(name) {
    const original = originals.get(name);
    const current = { x: original.centerX, y: original.centerY, rotate: original.clockwiseDegrees, ...dimensions.get(name), zIndex: order.get(name), ...positions[name] };
    current.pivotX ??= (original.pivotX ?? (name === 'head' ? 211 : original.centerX)) + current.x - original.centerX;
    current.pivotY ??= (original.pivotY ?? (name === 'head' ? 285 : original.centerY - dimensions.get(name).height * .3)) + current.y - original.centerY;
    return current;
  }
  function apply(name) {
    const image = images.get(name);
    const original = originals.get(name);
    const current = value(name);
    image.style.width = `${current.width}px`;
    image.style.height = `${current.height}px`;
    image.closest('.cat-layer').style.zIndex = current.zIndex;
    image.style.left = `${current.x - parseFloat(image.style.width) / 2}px`;
    image.style.top = `${current.y - parseFloat(image.style.height) / 2}px`;
    image.style.transform = `rotate(${current.rotate}deg) scaleX(${original.flipX ? -1 : 1})`;
    setPivot(name, current.pivotX, current.pivotY);
  }
  function refresh() {
    const current = value(selected);
    for (const field of ['x', 'y', 'rotate', 'width', 'height', 'zIndex', 'pivotX', 'pivotY']) find(field).value = Math.round(current[field] * 100) / 100;
    pivotMarker.hidden = !enabled;
    pivotMarker.style.left = `${current.pivotX}px`;
    pivotMarker.style.top = `${current.pivotY}px`;
    images.forEach((image, name) => image.classList.toggle('layout-selected', enabled && name === selected));
  }
  function change(next) {
    preview?.cancel();
    const previous = value(selected);
    if (next.x !== undefined && next.pivotX === undefined) next.pivotX = previous.pivotX + next.x - previous.x;
    if (next.y !== undefined && next.pivotY === undefined) next.pivotY = previous.pivotY + next.y - previous.y;
    positions[selected] = { ...previous, ...next };
    apply(selected);
    refresh();
    find('status').textContent = 'יש שינויים שטרם נשמרו';
  }
  panel.addEventListener('input', event => {
    const field = event.target.dataset.layout;
    if (!['x', 'y', 'rotate', 'width', 'height', 'zIndex', 'pivotX', 'pivotY'].includes(field) || event.target.value === '' || !Number.isFinite(event.target.valueAsNumber)) return;
    const number = event.target.valueAsNumber;
    if (['width', 'height'].includes(field) && number < 1) return;
    const next = { [field]: field === 'zIndex' ? Math.round(number) : number };
    if (['width', 'height'].includes(field) && find('lockRatio').checked) {
      const other = field === 'width' ? 'height' : 'width';
      next[other] = value(selected)[other] * number / value(selected)[field];
    }
    change(next);
  });
  select.addEventListener('change', () => { preview?.cancel(); selected = select.value; refresh(); });
  find('toggle').addEventListener('click', () => {
    preview?.cancel();
    enabled = !enabled;
    if (enabled) pause();
    frame.classList.toggle('layout-editing', enabled);
    find('body').hidden = !enabled;
    find('toggle').setAttribute('aria-expanded', String(enabled));
    refresh();
  });
  for (const [action, direction] of [['forward', 1], ['backward', -1], ['front', Infinity], ['back', -Infinity]]) {
    find(action).addEventListener('click', () => {
      const names = [...originals.keys()].sort((a, b) => value(a).zIndex - value(b).zIndex);
      const index = names.indexOf(selected);
      names.splice(index, 1);
      const target = Number.isFinite(direction) ? Math.max(0, Math.min(names.length, index + direction)) : direction > 0 ? names.length : 0;
      names.splice(target, 0, selected);
      names.forEach((name, zIndex) => { positions[name] = { ...value(name), zIndex }; apply(name); });
      refresh();
      find('status').textContent = 'יש שינויים שטרם נשמרו';
    });
  }
  find('previewPivot').addEventListener('click', () => {
    preview?.cancel(); pause(); apply(selected);
    preview = images.get(selected).parentElement.animate(
      [0, 25, -25, 0].map(angle => ({ transform: `rotate(${angle}deg)` })),
      { duration: 1600, easing: 'ease-in-out' });
  });
  find('save').addEventListener('click', () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
      find('status').textContent = 'המיקומים נשמרו בדפדפן הזה';
    } catch { find('status').textContent = 'השמירה בדפדפן לא זמינה. אפשר להוריד קובץ הרכבה.'; }
  });
  find('reset').addEventListener('click', () => {
    preview?.cancel();
    delete positions[selected]; apply(selected); refresh();
    find('status').textContent = 'החלק אופס. לחץ על שמירה כדי לשמור את האיפוס.';
  });
  find('download').addEventListener('click', () => {
    const output = structuredClone(layout);
    output.layersBackToFront.forEach(layer => {
      const name = layer.file.split('/').pop().replace('.png', '');
      const current = value(name);
      layer.pivotX = current.pivotX;
      layer.pivotY = current.pivotY;
      Object.assign(layer, { centerX: current.x, centerY: current.y, clockwiseDegrees: current.rotate, zIndex: current.zIndex });
      output.sprites.find(sprite => sprite.file === layer.file).displaySize = [current.width, current.height];
    });
    output.layersBackToFront.sort((a, b) => a.zIndex - b.zIndex);
    const url = URL.createObjectURL(new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'assembly_layout.json'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  frame.addEventListener('pointerdown', event => {
    if (!enabled || event.button !== 0) return;
    event.preventDefault();
    preview?.cancel(); pause(); apply(selected);
    const movingPivot = event.target === pivotMarker || find('pivotMode').checked;
    const start = { ...value(selected) };
    const startX = event.clientX, startY = event.clientY;
    const rect = character.getBoundingClientRect();
    if (movingPivot && event.target !== pivotMarker) {
      change({ pivotX: (event.clientX - rect.left) * layout.canvas.width / rect.width, pivotY: (event.clientY - rect.top) * layout.canvas.height / rect.height });
      Object.assign(start, value(selected));
    }
    frame.setPointerCapture(event.pointerId);
    function move(next) {
      if (next.pointerId !== event.pointerId) return;
      const dx = (next.clientX - startX) * layout.canvas.width / rect.width;
      const dy = (next.clientY - startY) * layout.canvas.height / rect.height;
      change(movingPivot ? { pivotX: start.pivotX + dx, pivotY: start.pivotY + dy } : { x: start.x + dx, y: start.y + dy });
    }
    function end(next) {
      if (next.pointerId !== event.pointerId) return;
      frame.removeEventListener('pointermove', move);
      frame.removeEventListener('pointerup', end);
      frame.removeEventListener('pointercancel', end);
      if (frame.hasPointerCapture(event.pointerId)) frame.releasePointerCapture(event.pointerId);
    }
    frame.addEventListener('pointermove', move);
    frame.addEventListener('pointerup', end);
    frame.addEventListener('pointercancel', end);
  });
  originals.forEach((_, name) => apply(name));
  refresh();
}
