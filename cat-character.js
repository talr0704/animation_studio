import { createCatExpressions } from './cat-expressions.js';
import { createCatAnimations } from './cat-animations.js';
import { mountLayoutEditor } from './cat-layout-editor.js';
import { mountCatEditor } from './cat-editor.js';
const character = document.querySelector('.cat-character');
const wrapper = document.querySelector('.cat-wrapper');
const status = document.querySelector('.character-status');
const controls = document.querySelector('.controls');
const groups = new Map();
let editor;
let motion;
const headFollowers = [];
const bodyMotions = [];
function stop() { motion?.stop({ immediate: true }); }
function play(name) { motion?.play(name); }

async function initialize() {
  controls.querySelectorAll('button').forEach(button => { button.disabled = true; });
  const response = await fetch(new URL('./assembly_layout.json', import.meta.url));
  if (!response.ok) throw new Error('Assembly layout could not be loaded');
  const layout = await response.json();
  const sprites = new Map(layout.sprites.map(sprite => [sprite.file, sprite]));
  const loads = [];
  layout.layersBackToFront.forEach((layer, index) => {
    const file = layer.file.split('/').pop();
    const name = file.replace('.png', '');
    const sprite = sprites.get(layer.file);
    const [width, height] = sprite.displaySize ?? sprite.artworkSize.map(value => value + layout.transparentPadding * 2);
    const group = document.createElement('div');
    group.className = 'cat-group';
    group.style.zIndex = index;
    group.style.transformOrigin = `${layer.pivotX ?? layer.centerX}px ${layer.pivotY ?? layer.centerY - height * .3}px`;
    const layerElement = document.createElement('div');
    layerElement.className = 'cat-group cat-layer';
    layerElement.style.zIndex = layer.zIndex ?? index;
    layerElement.style.transformOrigin = '211px 285px';
    const bodyMotion = document.createElement('div');
    bodyMotion.className = 'cat-group cat-body-motion';
    bodyMotion.style.transformOrigin = '230px 415px';
    const headMotion = document.createElement('div');
    headMotion.className = 'cat-group cat-head-motion';
    headMotion.style.transformOrigin = '211px 285px';
    headMotion.append(group);
    bodyMotion.append(headMotion);
    layerElement.append(bodyMotion);
    if (!name.startsWith('foot_')) bodyMotions.push(bodyMotion);
    character.append(layerElement);
    if (/^(Head|Face|Accessories)\//.test(layer.file) && name !== 'head') headFollowers.push(headMotion);
    if (name === 'head') group.style.transformOrigin = '211px 285px';
    const image = document.createElement('img');
    image.className = 'cat-part';
    image.alt = '';
    image.draggable = false;
    image.dataset.sprite = name;
    Object.assign(image.style, { left: `${layer.centerX - width / 2}px`, top: `${layer.centerY - height / 2}px`, width: `${width}px`, height: `${height}px`, transform: `rotate(${layer.clockwiseDegrees}deg) scaleX(${layer.flipX ? -1 : 1})` });
    if (layer.clipPath) image.style.clipPath = layer.clipPath;
    image.src = new URL(`./images/${file}`, import.meta.url).href;
    loads.push(image.decode());
    group.append(image);
    groups.set(name, group);
  });
  await Promise.all(loads);
  const expressions = await createCatExpressions({ character, controls });
  controls.querySelectorAll('button').forEach(button => { button.disabled = false; });
  controls.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (button) play(button.dataset.action);
  });
  const shadow = document.createElement('div');
  shadow.className = 'cat-floor-shadow';
  shadow.setAttribute('aria-hidden', 'true');
  character.closest('.cat-frame').prepend(shadow);
  const itemAnchor = document.createElement('div');
  itemAnchor.className = 'cat-item-anchor';
  itemAnchor.setAttribute('aria-label', 'Held item');
  character.append(itemAnchor);
  bodyMotions.push(itemAnchor);
  motion = createCatAnimations({ character, wrapper, groups, headFollowers, bodyMotions, controls, expressions, shadow, itemAnchor, editor: () => editor });
  editor = mountCatEditor({ character, groups, stop, headFollowers });
  window.popa = {
    play: name => motion.play(name), stop: () => motion.stop(),
    setExpression: name => expressions.setExpression(name),
    element: character, itemAnchor, clips: motion.clips,
    attachItem(element) {
      if (!(element instanceof Element)) throw new TypeError('attachItem requires a DOM element');
      itemAnchor.replaceChildren(element);
    },
    clearItem() { itemAnchor.replaceChildren(); },
  };
  mountLayoutEditor({ layout, character, setPivot: (name, x, y) => editor.setPivot(name, x, y), pause: () => { editor.pause(); editor.reset(); stop(); } });
  character.dataset.ready = 'true';
  character.dispatchEvent(new CustomEvent('popa:ready', { bubbles: true }));
}

initialize().catch(error => {
  status.textContent = 'לא ניתן לטעון את חלקי הדמות. יש לרענן את העמוד ולנסות שוב.';
  status.hidden = false;
  console.error(error);
});
