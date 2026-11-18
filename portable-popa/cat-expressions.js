const EXPRESSIONS = {
  happy: { label: 'שמחה', eyes: 'happy', mouth: 'happy' },
  neutral: { label: 'רגילה', eyes: 'open', mouth: 'closed' },
  sleepy: { label: 'ישנונית', eyes: 'sleep', mouth: 'closed' },
  surprised: { label: 'מופתעת', eyes: 'open', mouth: 'surprised' },
  playful: { label: 'שובבה', eyes: 'happy', mouth: 'tongue' },
  content: { label: 'נהנית', eyes: 'sleep', mouth: 'happy' },
};
const OPEN_EYE_SIZE = { width: 100, height: 70.59 };
const CLOSED_EYE_SIZE = { width: 68, height: 48 };
const imageUrl = file => new URL(`./assets/characters/popa/parts/${file}`, import.meta.url).href;

export async function createCatExpressions({ character }) {
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
  let eyeOverride = null;
  function render() {
    const expression = EXPRESSIONS[selected];
    // Scale only the open-eye artwork around its calibrated center. The assembly
    // slots retain their original dimensions, so closed eyes and exports stay intact.
    eyes.forEach((image, index) => {
      image.src = imageUrl(`eye_${eyeOverride ?? expression.eyes}_${index === 0 ? 'left' : 'right'}.png`);
      const size = (eyeOverride ?? expression.eyes) === 'open' ? OPEN_EYE_SIZE : CLOSED_EYE_SIZE;
      const x = size.width / parseFloat(image.style.width);
      const y = size.height / parseFloat(image.style.height);
      image.style.scale = x === 1 && y === 1 ? '' : `${x} ${y}`;
      // Open-eye PNGs are square with transparent margins. Contain shrank their
      // visible artwork; cover trims only padding and keeps the eye round.
      image.style.objectFit = (eyeOverride ?? expression.eyes) === 'open' ? 'cover' : 'contain';
    });
    mouth.src = imageUrl(`mouth_${expression.mouth}.png`);
    character.dataset.expression = selected;

  }
  render();
  return {
    overrideEyes(value) { eyeOverride = value; render(); },
    setExpression(name) {
      if (!Object.hasOwn(EXPRESSIONS, name)) throw new Error(`Unknown expression: ${name}`);
      selected = name; render();
    },
  };
}
