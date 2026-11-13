import { POPA_CLIPS, clipFrames, poseTransform } from './popa-clips.js';

export function createCatAnimations({ character, wrapper, groups, headFollowers, bodyMotions, controls, expressions, editor, shadow, itemAnchor }) {
  const targets = {
    body: bodyMotions, head: [groups.get('head'), ...headFollowers],
    left: [groups.get('left_arm')], right: [groups.get('right_arm')],
    tail: [groups.get('tail')], leftFoot: [groups.get('foot_left')],
    rightFoot: [groups.get('foot_right')], wrapper: [wrapper], shadow: [shadow],
  };
  const allTargets = [...new Set(Object.values(targets).flat())];
  let running = [], timers = [], cleanups = [], generation = 0;
  const identity = 'translate(0px, 0px) rotate(0deg) scale(1, 1)';
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function later(callback, delay) {
    const token = generation;
    timers.push(setTimeout(() => { if (token === generation) callback(); }, delay));
  }
  function mark(name) {
    character.dataset.action = name;
    controls.querySelectorAll('button').forEach(button => {
      const active = button.dataset.action === name;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }
  function clear() {
    generation++;
    running.forEach(animation => animation.cancel()); running = [];
    timers.forEach(clearTimeout); timers = [];
    cleanups.forEach(cleanup => cleanup()); cleanups = [];
  }
  function snapshot() { return new Map(allTargets.map(element => [element, getComputedStyle(element).transform])); }
  function animate(element, frames, options) {
    const animation = element.animate(frames, { fill: 'both', ...options });
    running.push(animation);
    return animation;
  }
  async function transition(from, destination) {
    const effects = allTargets.map(element => animate(element, [
      { transform: from.get(element) === 'none' ? identity : from.get(element) },
      { transform: destination.get(element) ?? identity },
    ], { duration: 220, easing: 'ease-in-out' }));
    await Promise.all(effects.map(effect => effect.finished));
    effects.forEach(effect => effect.cancel());
    running = running.filter(effect => !effects.includes(effect));
  }
  function stop({ immediate = false } = {}) {
    const previous = snapshot();
    const wasRunning = running.length > 0;
    clear(); mark('stop');
    if (!immediate && wasRunning && !reduced()) transition(previous, new Map()).catch(() => {});
  }
  function holdLayers() {
    const garment = Math.max(...['torso', 'shirt', 'pinafore'].map(name => Number(groups.get(name).closest('.cat-layer').style.zIndex)));
    const originals = ['left_arm', 'right_arm'].map(name => {
      const layer = groups.get(name).closest('.cat-layer');
      const z = layer.style.zIndex;
      layer.style.zIndex = garment + 2;
      return () => { layer.style.zIndex = z; };
    });
    const old = itemAnchor.style.zIndex;
    itemAnchor.style.zIndex = garment + 1;
    cleanups.push(...originals, () => { itemAnchor.style.zIndex = old; });
  }
  function blinkLoop() {
    const blink = () => {
      expressions.overrideEyes('sleep');
      later(() => expressions.overrideEyes(null), 110);
      later(blink, 3000);
    };
    later(blink, 2050);
    cleanups.push(() => expressions.overrideEyes(null));
  }
  async function play(name) {
    if (name === 'stop') { stop(); return; }
    if (!Object.hasOwn(POPA_CLIPS, name)) throw new Error(`Unknown Popa clip: ${name}`);
    const previous = snapshot();
    const wasRunning = running.length > 0;
    clear(); editor()?.pause(); editor()?.reset();
    mark(name);
    const token = generation;
    const clip = POPA_CLIPS[name];
    if (reduced()) return;
    try {
      const first = new Map();
      for (const [track, poses] of Object.entries(clip.tracks)) {
        for (const element of targets[track]) first.set(element, poseTransform(poses[0]));
      }
      if (wasRunning || clip.posed) await transition(previous, first);
      if (generation !== token) return;
      if (clip.closedEyes) {
        expressions.overrideEyes('sleep');
        cleanups.push(() => expressions.overrideEyes(null));
      }
      if (name === 'hold') holdLayers();
      if (clip.blink) blinkLoop();
      for (const [track, poses] of Object.entries(clip.tracks)) {
        for (const element of targets[track]) animate(element, clipFrames(poses), {
          duration: clip.duration, iterations: clip.loop ? Infinity : 1, easing: 'linear',
        });
      }
      if (clip.eventTime !== undefined) later(() => character.dispatchEvent(new CustomEvent('popa:interact', {
        bubbles: true, detail: { animation: name, time: clip.eventTime / 1000 },
      })), clip.eventTime);
      if (!clip.loop) {
        await Promise.all(running.map(animation => animation.finished));
        if (generation === token) stop({ immediate: true });
      }
    } catch (error) { if (error.name !== 'AbortError') throw error; }
  }
  return { play, stop, clips: POPA_CLIPS };
}
