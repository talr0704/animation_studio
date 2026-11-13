// Animate rig wrappers only: the accepted artwork geometry remains untouched.
export function createCatAnimations({ character, wrapper, groups, headFollowers, bodyMotions, controls, expressions, editor }) {
  let running = [];
  let cleanup = [];
  let generation = 0;
  const head = [groups.get('head'), ...headFollowers];
  const left = groups.get('left_arm');
  const right = groups.get('right_arm');
  const tail = groups.get('tail');

  function stop() {
    generation++;
    running.forEach(animation => animation.cancel());
    running = [];
    cleanup.forEach(restore => restore());
    cleanup = [];
    controls.querySelectorAll('button').forEach(button => button.classList.remove('is-active'));
    character.dataset.action = 'stop';
  }
  function track(targets, frames, duration, loop = false, phaseLocked = false) {
    const list = Array.isArray(targets) ? targets : [targets];
    for (const target of list) {
      const animation = target.animate(phaseLocked ? frames.map(frame => ({ ...frame, easing: 'ease-in-out' })) : frames, { duration, iterations: loop ? Infinity : 1, easing: phaseLocked ? 'linear' : 'ease-in-out', fill: 'both' });
      running.push(animation);
    }
  }
  function rotate(targets, angles, duration, loop = false, phaseLocked = false) {
    track(targets, angles.map(angle => ({ transform: `rotate(${angle}deg)` })), duration, loop, phaseLocked);
  }
  function pose(targets, points, duration, loop = false, phaseLocked = false) {
    track(targets, points.map(([x, y, angle = 0, offset]) => ({ transform: `translate(${x}px, ${y}px) rotate(${angle}deg)`, ...(offset !== undefined ? { offset } : {}) })), duration, loop, phaseLocked);
  }
  function foreground(group) {
    const layer = group.closest('.cat-layer');
    const original = layer.style.zIndex;
    const max = Math.max(...[...character.querySelectorAll('.cat-layer')].map(element => Number(element.style.zIndex)));
    layer.style.zIndex = max + 1;
    cleanup.push(() => { layer.style.zIndex = original; });
  }
  function speaking() {
    cleanup.push(expressions.startTalking());
  }
  function play(name) {
    editor()?.pause();
    editor()?.reset();
    stop();
    character.dataset.action = name;
    controls.querySelector(`[data-action="${name}"]`)?.classList.add('is-active');
    if (name === 'stop' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const version = generation;
    switch (name) {
      case 'idle':
        // Feet stay on the floor; costume, arms and head breathe as one rig.
        pose(bodyMotions, [[0, 0], [0, -1.8], [0, 0]], 3400, true);
        rotate(tail, [0, 3, 0, -2, 0], 5200, true);
        break;
      case 'inspired':
        pose(bodyMotions, [[0, 0, 0], [0, -3, -1.2], [0, 0, 0], [0, -2, 1.2], [0, 0, 0]], 2800, true);
        rotate(tail, [0, 6, 0, -4, 0], 2800, true);
        rotate(right, [0, -6, 0, -3, 0], 2800, true);
        break;
      case 'wave':
      case 'floatWaveAndSway': {
        const duration = name === 'wave' ? 2500 : 3200;
        foreground(left);
        // Positive rotation lifts the left-on-screen hand away from the torso.
        track(left, [
          { transform: 'rotate(0deg)', offset: 0 },
          { transform: 'rotate(-6deg)', offset: .1 },
          { transform: 'rotate(112deg)', offset: .32 },
          { transform: 'rotate(91deg)', offset: .44 },
          { transform: 'rotate(114deg)', offset: .56 },
          { transform: 'rotate(92deg)', offset: .68 },
          { transform: 'rotate(107deg)', offset: .78 },
          { transform: 'rotate(0deg)', offset: 1 },
        ], duration);
        rotate(head, [0, -2, -2, 0], duration);
        if (name === 'floatWaveAndSway') {
          pose(wrapper, [[0, 0, 0, 0], [0, 3, 0, .12], [-5, -15, -2, .35], [5, -17, 2, .62], [0, -10, 0, .8], [0, 0, 0, 1]], duration);
          rotate(tail, [0, 5, -4, 0], duration);
        }
        break;
      }
      case 'lookAround':
        pose(head, [[0, 0, 0, 0], [-4, 0, -4, .23], [-4, 0, -4, .4], [4, -1, 3, .67], [4, -1, 3, .82], [0, 0, 0, 1]], 3000);
        break;
      case 'nod':
        pose(head, [[0, 0, 0, 0], [0, 2, 4, .22], [0, -.5, -1, .42], [0, 1.5, 3, .63], [0, 0, 0, 1]], 1700);
        break;
      case 'ponder':
        foreground(left);
        rotate(left, [0, 140, 140, 135, 140, 0], 3400);
        rotate(head, [0, 5, 5, 4, 5, 0], 3400);
        rotate(tail, [0, -5, -5, 0], 3400);
        break;
      case 'bounce':
        pose(bodyMotions, [[0, 0, 0, 0], [0, 3, 0, .18], [0, 0, 0, .36], [0, 0, 0, .65], [0, 3, 0, .83], [0, 0, 0, 1]], 1200);
        pose(wrapper, [[0, 0, 0, 0], [0, 0, 0, .2], [0, -27, -1, .43], [0, -27, 1, .52], [0, 0, 0, .77], [0, 0, 0, 1]], 1200);
        rotate(left, [0, -5, 12, 5, 0], 1200);
        rotate(right, [0, 5, -12, -5, 0], 1200);
        break;
      case 'dance':
        pose(bodyMotions, [[0, 0, 0], [-3, -1, -3], [0, 0, 0], [3, -1, 3], [0, 0, 0], [-3, -1, -3], [3, -1, 3], [0, 0, 0]], 3600);
        rotate(left, [0, 20, 4, 30, 4, 20, 8, 0], 3600);
        rotate(right, [0, -28, -4, -15, -4, -28, -8, 0], 3600);
        rotate(tail, [0, 7, -5, 7, -5, 7, -4, 0], 3600);
        break;
      case 'walk': {
        // In-place chibi gait: each foot supports the body while the other swings.
        // Small steps keep the feet tucked beneath the dress with no stretching.
        const cycle = 1100;
        pose(groups.get('foot_left'), [
          [0, 0, 0, 0], [3, -3, 3, .12], [4, -5, 5, .25],
          [1, -1, 1, .42], [0, 0, 0, .5], [-4, 0, -3, .75], [0, 0, 0, 1],
        ], cycle, true, true);
        pose(groups.get('foot_right'), [
          [0, 0, 0, 0], [-4, 0, -3, .25], [0, 0, 0, .5],
          [3, -3, 3, .62], [4, -5, 5, .75], [1, -1, 1, .92], [0, 0, 0, 1],
        ], cycle, true, true);
        pose(bodyMotions, [[0, 0, 0], [-1.5, -1.5, -.6], [0, 0, 0], [1.5, -1.5, .6], [0, 0, 0]], cycle, true, true);
        rotate(left, [0, -10, 0, 10, 0], cycle, true, true);
        rotate(right, [0, 10, 0, -10, 0], cycle, true, true);
        rotate(head, [0, .4, 0, -.4, 0], cycle, true, true);
        rotate(tail, [0, 3, 0, -3, 0], cycle, true, true);
        break;
      }
      case 'talk':
        pose(bodyMotions, [[0, 0], [0, -1], [0, 0]], 2000, true);
        rotate(head, [0, -.7, .8, 0], 1600, true);
        rotate(right, [0, -9, -4, -12, 0], 2200, true);
        speaking();
        break;
      case 'roamAndDisappear':
        // A short series of hops, then fade out and return while invisible.
        track(wrapper, [
          { transform: 'translate(0, 0)', opacity: 1, offset: 0 },
          { transform: 'translate(0, 3px)', opacity: 1, offset: .1 },
          { transform: 'translate(28px, -12px) rotate(2deg)', opacity: 1, offset: .23 },
          { transform: 'translate(48px, 0)', opacity: 1, offset: .34 },
          { transform: 'translate(76px, -12px) rotate(2deg)', opacity: 1, offset: .47 },
          { transform: 'translate(96px, 0)', opacity: 1, offset: .58 },
          { transform: 'translate(110px, 0)', opacity: 0, offset: .72 },
          { transform: 'translate(0, 0)', opacity: 0, offset: .8 },
          { transform: 'translate(0, 0)', opacity: 0, offset: .87 },
          { transform: 'translate(0, 0)', opacity: 1, offset: 1 },
        ], 3600);
        rotate(tail, [0, -5, 5, -5, 0], 3600);
        break;
    }
    if (!['idle', 'inspired', 'talk', 'walk'].includes(name)) {
      Promise.all(running.map(animation => animation.finished)).then(() => {
        if (version === generation) stop();
      }).catch(() => {});
    }
  }
  return { play, stop };
}
