const EXPRESSIONS = {
  happy: { label: 'שמחה', eyes: 'happy', mouth: 'happy' },
  neutral: { label: 'רגילה', eyes: 'open', mouth: 'closed' },
  sleepy: { label: 'ישנונית', eyes: 'sleep', mouth: 'closed' },
  surprised: { label: 'מופתעת', eyes: 'open', mouth: 'surprised' },
  playful: { label: 'שובבה', eyes: 'happy', mouth: 'tongue' },
};
const STORAGE_KEY = 'popaExpressionV1';
const imageUrl = file => new URL(`./images/${file}`, import.meta.url).href;

export async function createCatExpressions({ character, controls }) {
  const eyes = ['left', 'right'].map(side => character.querySelector(`[data-sprite="eye_happy_${side}"]`));
  const mouth = character.querySelector('[data-sprite="mouth_happy"]');
  const files = new Set();
  for (const expression of Object.values(EXPRESSIONS)) {
    for (const side of ['left', 'right']) files.add(`eye_${expression.eyes}_${side}.png`);
    files.add(`mouth_${expression.mouth}.png`);
  }
  await Promise.all([...files].map(async file => {
    const image = new Image();
    image.src = imageUrl(file);
    await image.decode();
  }));

  let selected = 'happy';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (Object.hasOwn(EXPRESSIONS, saved)) selected = saved;
  } catch { /* Expression controls also work without local storage. */ }
  let speechTimer;
  let speechMouth = null;
  const panel = document.createElement('section');
  panel.className = 'expression-controls';
  panel.dir = 'rtl';
  panel.setAttribute('aria-label', 'הבעות פנים');
  const heading = document.createElement('h2');
  heading.textContent = 'הבעות פנים';
  panel.append(heading);
  for (const [name, expression] of Object.entries(EXPRESSIONS)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.expression = name;
    button.textContent = expression.label;
    button.addEventListener('click', () => {
      selected = name;
      try { localStorage.setItem(STORAGE_KEY, name); } catch { /* Keep the live selection. */ }
      render();
    });
    panel.append(button);
  }
  controls.before(panel);

  function render() {
    const expression = EXPRESSIONS[selected];
    // Reuse the calibrated eye/mouth slots, preserving placement, size and pivots.
    eyes.forEach((image, index) => { image.src = imageUrl(`eye_${expression.eyes}_${index === 0 ? 'left' : 'right'}.png`); });
    mouth.src = imageUrl(`mouth_${speechMouth ?? expression.mouth}.png`);
    character.dataset.expression = selected;
    panel.querySelectorAll('button').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.expression === selected));
    });
  }
  function stopTalking() {
    clearInterval(speechTimer);
    speechTimer = undefined;
    speechMouth = null;
    render();
  }
  function startTalking() {
    stopTalking();
    const poses = ['happy', 'closed', 'happy', 'tongue', 'closed'];
    let index = 0;
    speechTimer = setInterval(() => {
      speechMouth = poses[index++ % poses.length];
      mouth.src = imageUrl(`mouth_${speechMouth}.png`);
    }, 170);
    return stopTalking;
  }
  render();
  return { startTalking, stopTalking };
}
