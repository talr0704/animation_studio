const STORAGE_KEY = 'popaAssemblyPositionsV1';
const labels = { shirt: 'חולצה', tail: 'זנב', pinafore: 'סרפן', torso: 'גוף', left_arm: 'יד בצד שמאל', right_arm: 'יד בצד ימין', head: 'ראש', ear_left: 'אוזן שמאל', ear_right: 'אוזן ימין', foot_left: 'כף רגל שמאל', foot_right: 'כף רגל ימין', flower: 'פרח' };

export function mountLayoutEditor({ layout, character, pause }) {
  const frame = character.closest('.cat-frame');
  const images = new Map([...character.querySelectorAll('.cat-part')].map(image => [image.dataset.sprite, image]));
  const originals = new Map(layout.layersBackToFront.map(layer => [layer.file.split('/').pop().replace('.png', ''), layer]));
  let positions = {};
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    for (const [name, value] of Object.entries(saved)) {
      if (originals.has(name) && ['x', 'y', 'rotate'].every(key => Number.isFinite(value[key]))) positions[name] = value;
    }
  } catch { /* A fresh layout remains usable when browser storage is unavailable. */ }
  let selected = 'shirt';
  let enabled = false;
  const panel = document.createElement('section');
  panel.className = 'layout-editor';
  panel.dir = 'rtl';
  panel.setAttribute('aria-label', 'סידור חלקי הדמות');
  panel.innerHTML = `
    <button type="button" data-layout="toggle" aria-expanded="false">סידור מיקום החלקים</button>
    <div data-layout="body" hidden>
      <p>בחר חלק וגרור על הדמות, או הזן מיקום מדויק. המיקומים נשמרים בדפדפן הזה בלחיצה על שמירה.</p>
      <label>חלק <select data-layout="part"></select></label>
      <div class="layout-editor__fields">
        <label>מיקום X <input type="number" step="1" data-layout="x"></label>
        <label>מיקום Y <input type="number" step="1" data-layout="y"></label>
        <label>סיבוב ° <input type="number" step="1" data-layout="rotate"></label>
      </div>
      <div class="layout-editor__buttons">
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
    return positions[name] ?? { x: original.centerX, y: original.centerY, rotate: original.clockwiseDegrees };
  }
  function apply(name) {
    const image = images.get(name);
    const original = originals.get(name);
    const current = value(name);
    image.style.left = `${current.x - parseFloat(image.style.width) / 2}px`;
    image.style.top = `${current.y - parseFloat(image.style.height) / 2}px`;
    image.style.transform = `rotate(${current.rotate}deg) scaleX(${original.flipX ? -1 : 1})`;
    if (name !== 'head') {
      const pivotX = original.pivotX ?? original.centerX;
      const pivotY = original.pivotY ?? original.centerY - parseFloat(image.style.height) * .3;
      image.parentElement.style.transformOrigin = `${pivotX + current.x - original.centerX}px ${pivotY + current.y - original.centerY}px`;
    }
  }
  function refresh() {
    const current = value(selected);
    for (const field of ['x', 'y', 'rotate']) find(field).value = Math.round(current[field] * 100) / 100;
    images.forEach((image, name) => image.classList.toggle('layout-selected', enabled && name === selected));
  }
  function change(next) {
    positions[selected] = { ...value(selected), ...next };
    apply(selected);
    refresh();
    find('status').textContent = 'יש שינויים שטרם נשמרו';
  }
  panel.addEventListener('input', event => {
    const field = event.target.dataset.layout;
    if (['x', 'y', 'rotate'].includes(field) && event.target.value !== '' && Number.isFinite(event.target.valueAsNumber)) change({ [field]: event.target.valueAsNumber });
  });
  select.addEventListener('change', () => { selected = select.value; refresh(); });
  find('toggle').addEventListener('click', () => {
    enabled = !enabled;
    if (enabled) pause();
    frame.classList.toggle('layout-editing', enabled);
    find('body').hidden = !enabled;
    find('toggle').setAttribute('aria-expanded', String(enabled));
    refresh();
  });
  find('save').addEventListener('click', () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
      find('status').textContent = 'המיקומים נשמרו בדפדפן הזה';
    } catch { find('status').textContent = 'השמירה בדפדפן לא זמינה. אפשר להוריד קובץ הרכבה.'; }
  });
  find('reset').addEventListener('click', () => {
    delete positions[selected]; apply(selected); refresh();
    find('status').textContent = 'החלק אופס. לחץ על שמירה כדי לשמור את האיפוס.';
  });
  find('download').addEventListener('click', () => {
    const output = structuredClone(layout);
    output.layersBackToFront.forEach(layer => {
      const name = layer.file.split('/').pop().replace('.png', '');
      const current = value(name);
      if (layer.pivotX !== undefined) layer.pivotX += current.x - layer.centerX;
      if (layer.pivotY !== undefined) layer.pivotY += current.y - layer.centerY;
      Object.assign(layer, { centerX: current.x, centerY: current.y, clockwiseDegrees: current.rotate });
    });
    const url = URL.createObjectURL(new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'assembly_layout.json'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  frame.addEventListener('pointerdown', event => {
    if (!enabled || event.button !== 0) return;
    event.preventDefault();
    pause();
    const start = { ...value(selected) };
    const startX = event.clientX, startY = event.clientY;
    const rect = character.getBoundingClientRect();
    frame.setPointerCapture(event.pointerId);
    function move(next) {
      if (next.pointerId !== event.pointerId) return;
      change({ x: start.x + (next.clientX - startX) * layout.canvas.width / rect.width, y: start.y + (next.clientY - startY) * layout.canvas.height / rect.height });
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
