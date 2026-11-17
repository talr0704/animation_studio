import { createCatAnimations } from './cat-animations.js';
import { createCatExpressions } from './cat-expressions.js';
import { POPA_CLIPS } from './popa-clips.js';

const mounts = new WeakSet();

/** Mount an independent DOM character. Load popa-browser.css once in the page. */
export async function createPopa(mount, { scale = 1, autoplay = 'idle', label = 'פופה' } = {}) {
  if (!(mount instanceof Element)) throw new TypeError('createPopa requires a mount element');
  if (mounts.has(mount)) throw new Error('This element already contains a Popa instance');
  if (!Number.isFinite(scale) || scale <= 0) throw new RangeError('scale must be positive');
  if (autoplay && !Object.hasOwn(POPA_CLIPS, autoplay)) throw new Error(`Unknown Popa clip: ${autoplay}`);
  mounts.add(mount);
  const root = document.createElement('div');
  root.className = 'popa-browser';
  root.setAttribute('role', 'img');
  root.setAttribute('aria-label', label);
  const frame = document.createElement('div');
  frame.className = 'cat-frame';
  const shadow = document.createElement('div');
  shadow.className = 'cat-floor-shadow';
  const wrapper = document.createElement('div');
  wrapper.className = 'cat-wrapper';
  const character = document.createElement('div');
  character.className = 'cat-character';
  wrapper.append(character); frame.append(shadow, wrapper); root.append(frame); mount.append(root);
  let motion;
  let destroyed = false;
  function setScale(value) {
    if (!Number.isFinite(value) || value <= 0) throw new RangeError('scale must be positive');
    root.style.width = `${440 * value}px`;
    root.style.height = `${475 * value}px`;
    frame.style.transform = `scale(${value})`;
  }
  function requireAlive() { if (destroyed) throw new Error('This Popa instance was destroyed'); }
  try {
    setScale(scale);
    const response = await fetch(new URL('./assembly_layout.json', import.meta.url));
    if (!response.ok) throw new Error(`Cannot load Popa assembly: HTTP ${response.status}`);
    const layout = await response.json();
    const sprites = new Map(layout.sprites.map(sprite => [sprite.file, sprite]));
    const groups = new Map(), bodyMotions = [], headFollowers = [], loads = [];
    for (const [index, layer] of layout.layersBackToFront.entries()) {
      const file = layer.file.split('/').pop();
      const name = file.replace('.png', '');
      const sprite = sprites.get(layer.file);
      const [width, height] = sprite.displaySize ?? sprite.artworkSize.map(v => v + layout.transparentPadding * 2);
      const outer = document.createElement('div'); outer.className = 'cat-group cat-layer';
      outer.style.zIndex = layer.zIndex ?? index;
      const body = document.createElement('div'); body.className = 'cat-group cat-body-motion';
      body.style.transformOrigin = '230px 415px';
      const head = document.createElement('div'); head.className = 'cat-group cat-head-motion';
      const group = document.createElement('div'); group.className = 'cat-group';
      group.style.transformOrigin = `${layer.pivotX ?? layer.centerX}px ${layer.pivotY ?? layer.centerY - height * .3}px`;
      const image = document.createElement('img');
      image.className = 'cat-part'; image.dataset.sprite = name; image.alt = ''; image.draggable = false;
      Object.assign(image.style, { left: `${layer.centerX - width / 2}px`, top: `${layer.centerY - height / 2}px`,
        width: `${width}px`, height: `${height}px`, transform: `rotate(${layer.clockwiseDegrees}deg) scaleX(${layer.flipX ? -1 : 1})` });
      if (layer.clipPath) image.style.clipPath = layer.clipPath;
      image.src = new URL(`./images/${file}`, import.meta.url).href;
      loads.push(image.decode());
      group.append(image); head.append(group); body.append(head); outer.append(body); character.append(outer);
      groups.set(name, group);
      if (!name.startsWith('foot_')) bodyMotions.push(body);
      if (/^(Head|Face|Accessories)\//.test(layer.file) && name !== 'head') headFollowers.push(head);
    }
    // All face parts share the calibrated head pivot, without changing their own pivots.
    const headOrigin = groups.get('head').style.transformOrigin;
    headFollowers.forEach(element => { element.style.transformOrigin = headOrigin; });
    await Promise.all(loads);
    const expressions = await createCatExpressions({ character });
    const itemAnchor = document.createElement('div'); itemAnchor.className = 'cat-item-anchor';
    character.append(itemAnchor); bodyMotions.push(itemAnchor);
    motion = createCatAnimations({ character, wrapper, groups, headFollowers, bodyMotions,
      shadow, itemAnchor, expressions, controls: document.createElement('div'), editor: () => undefined });
    const controller = {
      element: character, root, itemAnchor,
      get action() { return character.dataset.action ?? 'stop'; },
      get clips() { return Object.keys(POPA_CLIPS); },
      play(name) { requireAlive(); return motion.play(name); },
      stop() { requireAlive(); motion.stop(); },
      setScale(value) { requireAlive(); setScale(value); },
      attachItem(element) {
        requireAlive();
        if (!(element instanceof Element)) throw new TypeError('attachItem requires a DOM element');
        itemAnchor.replaceChildren(element);
      },
      clearItem() { requireAlive(); itemAnchor.replaceChildren(); },
      destroy() {
        if (destroyed) return;
        motion.stop({ immediate: true }); destroyed = true;
        root.remove(); mounts.delete(mount);
      },
    };
    character.dataset.ready = 'true';
    if (autoplay) await controller.play(autoplay);
    character.dispatchEvent(new CustomEvent('popa:ready', { bubbles: true }));
    return controller;
  } catch (error) {
    motion?.stop({ immediate: true }); root.remove(); mounts.delete(mount); throw error;
  }
}
