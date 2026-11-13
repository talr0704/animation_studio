import { mountLayoutEditor } from './cat-layout-editor.js';
import { mountCatEditor } from './cat-editor.js';
const character = document.querySelector('.cat-character');
const wrapper = document.querySelector('.cat-wrapper');
const status = document.querySelector('.character-status');
const controls = document.querySelector('.controls');
let animations = [];
let actionVersion = 0;
const groups = new Map();
let editor;

function stop() {
  actionVersion++;
  animations.forEach(animation => animation.cancel());
  animations = [];
  controls.querySelectorAll('button').forEach(button => button.classList.remove('is-active'));
  character.dataset.action = 'stop';
}

function animate(target, frames, options) {
  const animation = target.animate(frames, { easing: 'ease-in-out', ...options });
  animations.push(animation);
  return animation;
}

function play(name) {
  editor?.pause();
  editor?.reset();
  stop();
  character.dataset.action = name;
  controls.querySelector(`[data-action="${name}"]`)?.classList.add('is-active');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (name === 'stop' || reduced) return;
  const head = groups.get('head');
  const hand = groups.get('left_arm');
  const version = actionVersion;
  let main;
  switch (name) {
    case 'idle':
    case 'inspired':
      main = animate(wrapper, [{ transform: 'translateY(0)' }, { transform: `translateY(-${name === 'idle' ? 5 : 12}px)` }, { transform: 'translateY(0)' }], { duration: 2400, iterations: Infinity });
      break;
    case 'wave':
    case 'floatWaveAndSway':
      main = animate(hand, [0, -24, 8, -24, 8, 0].map(angle => ({ transform: `rotate(${angle}deg)` })), { duration: 1800 });
      if (name === 'floatWaveAndSway') animate(wrapper, [{ transform: 'translateY(0) rotate(0)' }, { transform: 'translateY(-16px) rotate(-3deg)' }, { transform: 'translateY(-8px) rotate(3deg)' }, { transform: 'translateY(0) rotate(0)' }], { duration: 1800 });
      break;
    case 'lookAround':
    case 'nod':
    case 'ponder':
      main = animate(head, name === 'nod' ? [{ transform: 'translateY(0)' }, { transform: 'translateY(7px) rotate(3deg)' }, { transform: 'translateY(0)' }] : [{ transform: 'rotate(0)' }, { transform: 'rotate(-6deg)' }, { transform: 'rotate(6deg)' }, { transform: 'rotate(0)' }], { duration: 1600 });
      break;
    case 'bounce':
      main = animate(wrapper, [{ transform: 'translateY(0)' }, { transform: 'translateY(-35px)' }, { transform: 'translateY(0)' }], { duration: 700 });
      break;
    case 'dance':
      main = animate(wrapper, [0, -5, 5, -5, 5, 0].map(angle => ({ transform: `rotate(${angle}deg)` })), { duration: 2200 });
      break;
    case 'talk':
      main = animate(head, [{ transform: 'translateY(0) rotate(0)' }, { transform: 'translateY(-2px) rotate(1deg)' }, { transform: 'translateY(0) rotate(0)' }], { duration: 450, iterations: Infinity });
      animate(groups.get('mouth_happy'), [{ transform: 'scaleY(1)' }, { transform: 'scaleY(.65)' }, { transform: 'scaleY(1)' }], { duration: 300, iterations: Infinity });
      break;
    case 'roamAndDisappear':
      main = animate(wrapper, [{ transform: 'translateX(0)', opacity: 1 }, { transform: 'translateX(90px) rotate(4deg)', opacity: 1, offset: .65 }, { transform: 'translateX(170px)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }], { duration: 3000 });
      break;
  }
  if (main && !['idle', 'inspired', 'talk'].includes(name)) main.finished.then(() => {
    if (version === actionVersion) stop();
  }).catch(() => {});
}

async function initialize() {
  controls.querySelectorAll('button').forEach(button => { button.disabled = true; });
  const response = await fetch(new URL('./assembly_layout.json', import.meta.url));
  if (!response.ok) throw new Error('Assembly layout could not be loaded');
  const layout = await response.json();
  const sprites = new Map(layout.sprites.map(sprite => [sprite.file, sprite]));
  const headGroup = document.createElement('div');
  headGroup.className = 'cat-group';
  headGroup.style.transformOrigin = '211px 285px';
  headGroup.style.zIndex = 10;
  groups.set('head', headGroup);
  character.append(headGroup);
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
    (/^(Head|Face|Accessories)\//.test(layer.file) ? headGroup : character).append(group);
    if (name !== 'head') groups.set(name, group);
  });
  await Promise.all(loads);
  character.dataset.ready = 'true';
  controls.querySelectorAll('button').forEach(button => { button.disabled = false; });
  controls.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (button) play(button.dataset.action);
  });
  editor = mountCatEditor({ character, groups, stop });
  mountLayoutEditor({ layout, character, pause: () => { editor.pause(); editor.reset(); stop(); } });
}

initialize().catch(error => {
  status.textContent = 'לא ניתן לטעון את חלקי הדמות. יש לרענן את העמוד ולנסות שוב.';
  status.hidden = false;
  console.error(error);
});
