/**
 * Portable animated robot character.
 *
 * Requires GSAP 3.13+ and intentionally owns only the DOM below its mount node.
 */

const ROBOT_CONFIG = {
  robot: { x: 0, y: 0, rotate: -7, scale: 0.41, scaleX: 1, scaleY: 1, transformOrigin: '50% 56%', zIndex: 0, width: 390, top: 0, left: 0 },
  head: { left: 95, top: 20, width: 260, height: 246, x: -15, y: -107, rotate: 1, scale: 1.15, scaleX: 1, scaleY: 1, transformOrigin: '50% 75.03%', zIndex: 6 },
  body: { left: 120, top: 150, width: 220, height: 218.6, x: -8, y: -25, rotate: 5, scale: 0.81, scaleX: 1, scaleY: 1, transformOrigin: '50% 50%', zIndex: 3 },
  leftHand: { left: 45, top: 205, width: 120, height: 168.8, x: 8, y: -68, rotate: -3, scale: 1.11, scaleX: 1, scaleY: 1, transformOrigin: '80% 15%', zIndex: 4 },
  rightHand: { left: 300, top: 130, width: 120, height: 117.9, x: -38, y: -53, rotate: -6, scale: 1.95, scaleX: 1, scaleY: 1, transformOrigin: '18% 30%', zIndex: 2 },
  leftLeg: { left: 95, top: 330, width: 120, height: 211.9, x: -12, y: -67, rotate: 19, scale: 1.02, scaleX: 1, scaleY: 1, transformOrigin: '60% 10%', zIndex: 4 },
  rightLeg: { left: 240, top: 330, width: 120, height: 156.1, x: -32, y: -74, rotate: -10, scale: 1.28, scaleX: 1, scaleY: 1, transformOrigin: '45% 10%', zIndex: 1 },
};

const ROBOT_LEFT_CONFIG = {
  robot: { x: 0, y: 0, rotate: -7, scale: 0.41, scaleX: 1, scaleY: 1, transformOrigin: '50% 56%', zIndex: 0, width: 390, top: 0, left: 0 },
  head: { left: 129, top: 26, width: 260, height: 246, x: -15, y: -107, rotate: 4, scale: 1.2, scaleX: 1, scaleY: 1, transformOrigin: '46.42% 96.88%', zIndex: 6 },
  body: { left: 120, top: 150, width: 220, height: 218.6, x: -8, y: -25, rotate: 5, scale: 0.83, scaleX: 1, scaleY: 1, transformOrigin: '50% 50%', zIndex: 3 },
  leftHand: { left: 260, top: 210, width: 120, height: 168.8, x: 8, y: -68, rotate: -3, scale: 1.11, scaleX: 1, scaleY: 1, transformOrigin: '18.04% 18.75%', zIndex: 3 },
  rightHand: { left: 119, top: 146, width: 120, height: 138, x: -38, y: -53, rotate: -6, scale: 1.95, scaleX: 1, scaleY: 1, transformOrigin: '86.98% 54.79%', zIndex: 2 },
  leftLeg: { left: 250, top: 330, width: 120, height: 211.9, x: -12, y: -67, rotate: 19, scale: 1.1, scaleX: 1, scaleY: 1, transformOrigin: '18.53% 14.12%', zIndex: 4 },
  rightLeg: { left: 122, top: 315, width: 120, height: 156.1, x: -32, y: -74, rotate: -10, scale: 1.37, scaleX: 1, scaleY: 1, transformOrigin: '71.62% 29.85%', zIndex: 1 },
};

const ROBOT_PART_FILES = {
  right: { head: 'head.svg', body: 'body.svg', leftHand: 'lhand.svg', rightHand: 'rhand.svg', leftLeg: 'leftleg.svg', rightLeg: 'rightleg.svg' },
  left: { head: 'head_turn_left.svg', body: 'body_turn_left.svg', leftHand: 'lhand_turn_left.svg', rightHand: 'rhand_turn_left.svg', leftLeg: 'leftleg_turn_left.svg', rightLeg: 'rightleg_turn_left.svg' },
};

const PART_NAMES = ['robot', 'head', 'body', 'leftHand', 'rightHand', 'leftLeg', 'rightLeg'];

const MARKUP = `
  <div class="portable-robot__scale">
    <div class="portable-robot__shadow" data-part="shadow" aria-hidden="true"></div>
    <div class="robot-wrapper" data-part="robotWrapper">
      <div class="robot" data-part="robot" role="img" aria-label="Friendly animated robot character">
        <img class="robot-part" data-part="leftLeg" data-file="leftleg.svg" alt="" aria-hidden="true">
        <img class="robot-part" data-part="rightLeg" data-file="rightleg.svg" alt="" aria-hidden="true">
        <img class="robot-part" data-part="body" data-file="body.svg" alt="" aria-hidden="true">
        <img class="robot-part" data-part="leftHand" data-file="lhand.svg" alt="" aria-hidden="true">
        <img class="robot-part" data-part="rightHand" data-file="rhand.svg" alt="" aria-hidden="true">
        <img class="robot-part" data-part="head" data-file="head.svg" alt="" aria-hidden="true">
      </div>
    </div>
  </div>`;

function normalizeAssetBase(assetBaseUrl) {
  return assetBaseUrl.endsWith('/') ? assetBaseUrl : `${assetBaseUrl}/`;
}

function waitForImages(root) {
  return Promise.all([...root.querySelectorAll('img')].map((image) => {
    if (image.complete && image.naturalWidth > 0) return Promise.resolve();
    return new Promise((resolve, reject) => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', () => reject(new Error(`Unable to load robot asset: ${image.src}`)), { once: true });
    });
  }));
}

function preloadImages(urls) {
  return Promise.all(urls.map((url) => new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', resolve, { once: true });
    image.addEventListener('error', () => reject(new Error(`Unable to load robot asset: ${url}`)), { once: true });
    image.src = url;
  })));
}

export async function createRobot(root, options = {}) {
  if (!(root instanceof Element)) throw new TypeError('createRobot(root): root must be a DOM Element.');
  if (root.dataset.portableRobotMounted === 'true') throw new Error('A robot is already mounted in this element.');

  const gsap = options.gsap ?? globalThis.gsap;
  if (!gsap) throw new Error('GSAP is required. Load GSAP first or pass { gsap }.');

  const assetBaseUrl = normalizeAssetBase(options.assetBaseUrl ?? './assets');
  const initialScale = Number(options.scale ?? 1);
  if (!Number.isFinite(initialScale) || initialScale <= 0) throw new RangeError('Scale must be a positive number.');
  root.dataset.portableRobotMounted = 'true';
  root.classList.add('portable-robot');
  root.innerHTML = MARKUP;
  root.querySelectorAll('[data-file]').forEach((image) => {
    image.src = `${assetBaseUrl}${image.dataset.file}`;
  });

  const scaleLayer = root.querySelector('.portable-robot__scale');
  const robotWrapper = root.querySelector('[data-part="robotWrapper"]');
  const robot = root.querySelector('[data-part="robot"]');
  const shadow = root.querySelector('[data-part="shadow"]');
  const partElements = {
    robot,
    head: root.querySelector('[data-part="head"]'),
    body: root.querySelector('[data-part="body"]'),
    leftHand: root.querySelector('[data-part="leftHand"]'),
    rightHand: root.querySelector('[data-part="rightHand"]'),
    leftLeg: root.querySelector('[data-part="leftLeg"]'),
    rightLeg: root.querySelector('[data-part="rightLeg"]'),
  };
  const animatedParts = PART_NAMES.map((partName) => partElements[partName]);
  const facingConfigs = { right: ROBOT_CONFIG, left: ROBOT_LEFT_CONFIG };
  const timelines = new Set();
  let currentAction = null;
  let facing = 'right';
  let destroyed = false;

  let idleTimeline;
  let floatTimeline;
  let inspiredTimeline;
  let talkTimeline;
  let waveTimeline;
  let lookAroundTimeline;
  let nodTimeline;
  let bounceTimeline;
  let gestureTimeline;
  let floatWaveAndSwayTimeline;

  const assertActive = () => {
    if (destroyed) throw new Error('This robot instance has been destroyed.');
  };

  const base = (partName, direction = facing) => facingConfigs[direction][partName];
  const baseTransform = (partName, overrides = {}) => {
    const value = base(partName);
    return {
      x: value.x ?? 0,
      y: value.y ?? 0,
      rotate: value.rotate ?? 0,
      scale: value.scale ?? 1,
      scaleX: value.scaleX ?? 1,
      scaleY: value.scaleY ?? 1,
      transformOrigin: value.transformOrigin,
      ...overrides,
    };
  };

  const applyConfigToPart = (partName) => {
    const element = partElements[partName];
    const config = base(partName);
    const styles = { ...baseTransform(partName), zIndex: config.zIndex, width: config.width };
    if (partName !== 'robot') Object.assign(styles, { position: 'absolute', left: config.left, top: config.top, height: config.height });
    gsap.set(element, styles);
  };

  const applyRobotConfig = () => PART_NAMES.forEach(applyConfigToPart);
  const setFacing = (direction) => {
    assertActive();
    if (!ROBOT_PART_FILES[direction]) throw new RangeError(`Unknown robot facing: ${direction}`);
    Object.entries(ROBOT_PART_FILES[direction]).forEach(([partName, fileName]) => {
      partElements[partName].src = `${assetBaseUrl}${fileName}`;
    });
    facing = direction;
    robot.dataset.facing = direction;
    applyRobotConfig();
    root.dispatchEvent(new CustomEvent('robot:facingchange', { detail: { facing: direction } }));
  };
  const resetPartToBase = (partName, overrides = {}) => {
    gsap.set(partElements[partName], {
      ...baseTransform(partName, { transformOrigin: overrides.transformOrigin ?? base(partName).transformOrigin }),
      zIndex: overrides.zIndex ?? base(partName).zIndex,
    });
  };

  const setAction = (name) => {
    currentAction = name;
    root.dataset.action = name ?? '';
    root.dispatchEvent(new CustomEvent('robot:actionchange', { detail: { action: name } }));
  };

  const remember = (timeline) => {
    timelines.add(timeline);
    return timeline;
  };

  function buildFloatTimeline() {
    const timeline = gsap.timeline({
      repeat: -1,
      defaults: { ease: 'sine.inOut', overwrite: 'auto' },
    });

    timeline
      .to(robotWrapper, { x: 8, y: -14, rotate: 1.5, duration: 1.8 })
      .to(robotWrapper, { x: -7, y: -8, rotate: -1, duration: 1.7 })
      .to(robotWrapper, { x: 0, y: 0, rotate: 0, duration: 1.8 });

    return timeline;
  }

  function ensureFloatTimeline() {
    if (!floatTimeline) {
      gsap.set(robotWrapper, { x: 0, y: 0, rotate: 0, scaleX: 1, scaleY: 1, transformOrigin: '50% 56%' });
      floatTimeline = buildFloatTimeline();
    }

    if (!floatTimeline.isActive()) {
      floatTimeline.play();
    }
  }

  function buildIdleTimeline() {
    const timeline = gsap.timeline({ repeat: -1, defaults: { ease: 'sine.inOut' } });

    timeline
      .set(partElements.head, { x: -15, y: -107, rotate: 1, scale: 1.15, transformOrigin: '50% 75.03%' }, 0)
      .set(partElements.leftHand, { x: 8, y: -68, rotate: 13, scale: 1.11, transformOrigin: '80% 15%' }, 0)
      .set(partElements.leftLeg, { x: -12, y: -67, rotate: 17, scale: 1.02, transformOrigin: '60% 10%' }, 0)
      .set(partElements.rightHand, { x: -38, y: -53, rotate: -6, scale: 1.95, transformOrigin: '18% 30%' }, 0)
      .set(partElements.rightLeg, { x: -32, y: -74, rotate: 9, scale: 1.28, transformOrigin: '45% 10%' }, 0)
      .to(partElements.leftHand, { rotate: 2, duration: 0.496, ease: 'sine.in' }, 0)
      .to(partElements.rightLeg, { rotate: 18, duration: 0.497, ease: 'sine.in' }, 0)
      .to(partElements.head, { rotate: 13, duration: 0.499, ease: 'sine.in' }, 0)
      .to(partElements.leftLeg, { rotate: 13, duration: 0.502, ease: 'sine.in' }, 0)
      .to(partElements.rightHand, { x: -17, rotate: 26, duration: 0.503, ease: 'sine.in' }, 0)
      .to(partElements.head, { rotate: -2, duration: 0.847, ease: 'sine.in' }, 0.499)
      .to(partElements.leftHand, { rotate: -7, duration: 0.85, ease: 'sine.in' }, 0.496)
      .to(partElements.rightHand, { x: 8, y: -41, rotate: 48, duration: 0.843, ease: 'sine.in' }, 0.503)
      .to(partElements.rightLeg, { rotate: 23, duration: 0.849, ease: 'sine.in' }, 0.497)
      .to(partElements.leftLeg, { rotate: 6, duration: 0.847, ease: 'sine.in' }, 0.502)
      .to(partElements.head, { rotate: 1, duration: 0.154, ease: 'sine.inOut' }, 1.346)
      .to(partElements.leftHand, { rotate: 13, duration: 0.154, ease: 'sine.inOut' }, 1.346)
      .to(partElements.rightHand, { x: -38, y: -53, rotate: -6, duration: 0.154, ease: 'sine.inOut' }, 1.346)
      .to(partElements.rightLeg, { rotate: 9, duration: 0.154, ease: 'sine.inOut' }, 1.346)
      .to(partElements.leftLeg, { rotate: 17, duration: 0.151, ease: 'sine.inOut' }, 1.349);

    return timeline;
  }

  function buildInspiredTimeline() {
    const timeline = gsap.timeline({ repeat: -1, defaults: { ease: 'sine.inOut' } });

    timeline
      .to(robot, { y: base('robot').y - 7, rotate: base('robot').rotate - 2, duration: 0.42 }, 0)
      .to(shadow, { scaleX: 0.86, scaleY: 0.8, opacity: 0.55, filter: 'blur(13px)', duration: 0.42 }, 0)
      .to(partElements.head, { y: base('head').y - 7, rotate: base('head').rotate + 9, duration: 0.42 }, 0)
      .to(partElements.leftHand, { rotate: base('leftHand').rotate - 13, y: base('leftHand').y - 3, duration: 0.42 }, 0)
      .to(partElements.rightHand, { x: base('rightHand').x + 26, y: base('rightHand').y + 11, rotate: base('rightHand').rotate + 45, duration: 0.42 }, 0)
      .to(partElements.leftLeg, { rotate: base('leftLeg').rotate - 8, x: base('leftLeg').x - 3, duration: 0.42 }, 0)
      .to(partElements.rightLeg, { rotate: base('rightLeg').rotate + 25, x: base('rightLeg').x + 3, duration: 0.42 }, 0)
      .to(robot, { y: base('robot').y + 2, rotate: base('robot').rotate + 1, duration: 0.46 }, 0.42)
      .to(partElements.head, { y: base('head').y - 2, rotate: base('head').rotate - 5, duration: 0.46 }, 0.42)
      .to(partElements.leftHand, { rotate: base('leftHand').rotate + 14, y: base('leftHand').y + 1, duration: 0.46 }, 0.42)
      .to(partElements.rightHand, { x: base('rightHand').x + 42, y: base('rightHand').y + 6, rotate: base('rightHand').rotate + 58, duration: 0.46 }, 0.42)
      .to(partElements.leftLeg, { rotate: base('leftLeg').rotate + 2, x: base('leftLeg').x + 2, duration: 0.46 }, 0.42)
      .to(partElements.rightLeg, { rotate: base('rightLeg').rotate + 31, x: base('rightLeg').x - 1, duration: 0.46 }, 0.42)
      .to(robot, { y: base('robot').y, rotate: base('robot').rotate, duration: 0.52 }, 0.88)
      .to(shadow, { scaleX: 1, scaleY: 1, opacity: 1, filter: 'blur(10px)', duration: 0.52 }, 0.88)
      .to(partElements.head, { y: base('head').y, rotate: base('head').rotate, duration: 0.52 }, 0.88)
      .to(partElements.leftHand, { rotate: base('leftHand').rotate, y: base('leftHand').y, duration: 0.52 }, 0.88)
      .to(partElements.rightHand, { x: base('rightHand').x, y: base('rightHand').y, rotate: base('rightHand').rotate, duration: 0.52 }, 0.88)
      .to(partElements.leftLeg, { rotate: base('leftLeg').rotate, x: base('leftLeg').x, duration: 0.52 }, 0.88)
      .to(partElements.rightLeg, { rotate: base('rightLeg').rotate, x: base('rightLeg').x, duration: 0.52 }, 0.88);

    return timeline;
  }

  function stopAllAnimations({ reset = true } = {}) {
    floatTimeline?.pause(0);
    idleTimeline?.pause(0);
    inspiredTimeline?.pause(0);

    talkTimeline?.kill();
    waveTimeline?.kill();
    lookAroundTimeline?.kill();
    nodTimeline?.kill();
    bounceTimeline?.kill();
    gestureTimeline?.kill();
    floatWaveAndSwayTimeline?.kill();

    talkTimeline = null;
    waveTimeline = null;
    lookAroundTimeline = null;
    nodTimeline = null;
    bounceTimeline = null;
    gestureTimeline = null;
    floatWaveAndSwayTimeline = null;

    gsap.killTweensOf([...animatedParts, robotWrapper, shadow]);

    if (reset) {
      setFacing('right');
      applyRobotConfig();
      gsap.set(robotWrapper, { x: 0, y: 0, rotate: 0, scaleX: 1, scaleY: 1 });
      gsap.set(shadow, {
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        filter: 'blur(10px)',
      });
    }

    setAction(null);
  }

  function floatWaveAndSway() {
    stopAllAnimations({ reset: true });

    const handBase = base('rightHand');
    const headBase = base('head');
    const hand = partElements.rightHand;
    const head = partElements.head;

    const restoreSequencePose = () => {
      resetPartToBase('rightHand');
      resetPartToBase('head');
      gsap.set(robotWrapper, { x: 0, y: 0, rotate: 0, scaleX: 1, scaleY: 1 });
      gsap.set(shadow, { scaleX: 1, scaleY: 1, opacity: 1, filter: 'blur(10px)' });
    };

    floatWaveAndSwayTimeline = gsap.timeline({
      defaults: { overwrite: 'auto', ease: 'sine.inOut' },
      onComplete: () => {
        restoreSequencePose();
        floatWaveAndSwayTimeline = null;
        setAction(null);
      },
    });

    floatWaveAndSwayTimeline
      // Lift the connected character as one unit and soften its shadow.
      .to(robotWrapper, { y: -6, duration: 0.55, ease: 'sine.out' })
      .to(shadow, { scaleX: 0.9, scaleY: 0.88, opacity: 0.72, filter: 'blur(12px)', duration: 0.55, ease: 'sine.out' }, 0)
      // Raise from the configured shoulder, then make three small wave beats.
      .to(hand, { x: handBase.x + 2, y: handBase.y - 4, rotate: handBase.rotate - 10, duration: 0.3 })
      .to(head, { x: headBase.x, y: headBase.y - 1, rotate: headBase.rotate + 1.5, duration: 0.28 }, '<0.04')
      .to(hand, { rotate: handBase.rotate + 9, duration: 0.2 })
      .to(hand, { rotate: handBase.rotate - 9, duration: 0.2 })
      .to(hand, { rotate: handBase.rotate + 8, duration: 0.2 })
      .to(hand, { x: handBase.x, y: handBase.y, rotate: handBase.rotate, duration: 0.34 })
      .to(head, { x: headBase.x, y: headBase.y, rotate: headBase.rotate, duration: 0.3 }, '<')
      // Sway the wrapper so every SVG part travels together.
      .to(robotWrapper, { x: 14, y: -4, rotate: 1.2, duration: 0.65 })
      .to(robotWrapper, { x: -14, y: -4, rotate: -1.2, duration: 0.85 })
      .to(robotWrapper, { x: 6, y: -3, rotate: 0.6, duration: 0.55 })
      .to(robotWrapper, { x: 0, y: 0, rotate: 0, duration: 0.65 })
      .to(shadow, { scaleX: 1, scaleY: 1, opacity: 1, filter: 'blur(10px)', duration: 0.65 }, '<');

    setAction('floatWaveAndSway');
    return floatWaveAndSwayTimeline;
  }

  function startIdle() {
    stopAllAnimations({ reset: true });
    ensureFloatTimeline();

    if (!idleTimeline) {
      idleTimeline = buildIdleTimeline();
    }

    idleTimeline.restart();
    setAction('idle');
  }

  function startInspiredIdle() {
    stopAllAnimations({ reset: true });
    ensureFloatTimeline();

    if (!inspiredTimeline) {
      inspiredTimeline = buildInspiredTimeline();
    }

    inspiredTimeline.restart();
    setAction('inspired');
  }

  function stopIdle() {
    stopAllAnimations({ reset: true });
  }

  function wave() {
    const hand = partElements.rightHand;
    const head = partElements.head;

    const handBase = base('rightHand');
    const headBase = base('head');
    const shoulderOrigin = handBase.transformOrigin;
    const WAVE_LEFT_ANGLE = handBase.rotate - 4;
    const WAVE_RIGHT_ANGLE = handBase.rotate + 6;
    const waveArmTransform = (overrides = {}) => ({
      x: handBase.x,
      y: handBase.y,
      scale: handBase.scale ?? 1,
      scaleX: handBase.scaleX ?? 1,
      scaleY: handBase.scaleY ?? 1,
      transformOrigin: shoulderOrigin,
      ...overrides,
    });

    const idleWasRunning = Boolean(idleTimeline?.isActive() || inspiredTimeline?.isActive());
    const activeIdle = inspiredTimeline?.isActive() ? 'inspired' : idleTimeline?.isActive() ? 'idle' : null;

    ensureFloatTimeline();
    idleTimeline?.pause();
    inspiredTimeline?.pause();
    talkTimeline?.kill();
    talkTimeline = null;

    waveTimeline?.kill();
    gsap.killTweensOf(animatedParts);
    PART_NAMES.forEach(resetPartToBase);

    resetPartToBase('rightHand', {
      transformOrigin: shoulderOrigin,
      zIndex: handBase.zIndex,
    });

    waveTimeline = gsap.timeline({
      defaults: { overwrite: 'auto' },
      onComplete: () => {
        resetPartToBase('rightHand');
        resetPartToBase('head');
        waveTimeline = null;

        if (idleWasRunning && activeIdle === 'idle') {
          idleTimeline?.resume();
          setAction('idle');
        } else if (idleWasRunning && activeIdle === 'inspired') {
          inspiredTimeline?.resume();
          setAction('inspired');
        } else {
          setAction(null);
        }
      },
    });

    waveTimeline
      .to(hand, waveArmTransform({ rotate: WAVE_LEFT_ANGLE, duration: 0.24, ease: 'sine.out' }))
      .to(head, { x: headBase.x + 0.5, y: headBase.y, rotate: headBase.rotate + 0.8, duration: 0.28, ease: 'sine.out' }, 0.05)
      .to(hand, waveArmTransform({ rotate: WAVE_RIGHT_ANGLE, duration: 0.24, ease: 'sine.inOut' }))
      .to(hand, waveArmTransform({ rotate: WAVE_LEFT_ANGLE, duration: 0.22, ease: 'sine.inOut' }))
      .to(hand, waveArmTransform({ rotate: WAVE_RIGHT_ANGLE, duration: 0.22, ease: 'sine.inOut' }))
      .to(hand, waveArmTransform({ rotate: handBase.rotate, duration: 0.3, ease: 'sine.inOut' }))
      .to(head, { x: headBase.x, y: headBase.y, rotate: headBase.rotate, duration: 0.26, ease: 'sine.inOut' }, '<');

    setAction('wave');

    return waveTimeline;
  }

  function lookAround() {
    lookAroundTimeline?.kill();
    lookAroundTimeline = null;

    stopAllAnimations({ reset: true });
    ensureFloatTimeline();

    const head = partElements.head;
    const body = partElements.body;
    const leftHeadBase = base('head', 'left');
    const leftBodyBase = base('body', 'left');
    const rightHeadBase = base('head', 'right');
    const rightBodyBase = base('body', 'right');

    lookAroundTimeline = gsap.timeline({
      defaults: {
        overwrite: 'auto',
        ease: 'sine.inOut',
      },
      onComplete: () => {
        setFacing('right');
        resetPartToBase('head');
        resetPartToBase('body');
        lookAroundTimeline = null;
        setAction(null);
      },
    });

    lookAroundTimeline
      .call(() => setFacing('left'))
      .to(head, {
        x: leftHeadBase.x - 3,
        y: leftHeadBase.y,
        rotate: leftHeadBase.rotate - 5,
        duration: 0.28,
      })
      .to(
        body,
        {
          x: leftBodyBase.x,
          y: leftBodyBase.y,
          rotate: leftBodyBase.rotate - 0.8,
          duration: 0.3,
        },
        0.08
      )
      .to({}, { duration: 0.18 })
      .call(() => setFacing('right'))
      .to(head, {
        x: rightHeadBase.x + 3,
        y: rightHeadBase.y,
        rotate: rightHeadBase.rotate + 5,
        duration: 0.42,
      })
      .to(
        body,
        {
          x: rightBodyBase.x,
          y: rightBodyBase.y,
          rotate: rightBodyBase.rotate + 0.8,
          duration: 0.4,
        },
        '<0.06'
      )
      .to({}, { duration: 0.18 })
      .to(head, {
        x: rightHeadBase.x,
        y: rightHeadBase.y,
        rotate: rightHeadBase.rotate,
        duration: 0.3,
        ease: 'power1.out',
      })
      .to(
        body,
        {
          x: rightBodyBase.x,
          y: rightBodyBase.y,
          rotate: rightBodyBase.rotate,
          duration: 0.3,
          ease: 'power1.out',
        },
        '<'
      );

    setAction('lookAround');

    return lookAroundTimeline;
  }

  function nod() {
    nodTimeline?.kill();
    nodTimeline = null;

    stopAllAnimations({ reset: true });
    ensureFloatTimeline();

    const headBase = base('head');
    const bodyBase = base('body');

    nodTimeline = gsap.timeline({
      defaults: { overwrite: 'auto', ease: 'sine.inOut' },
      onComplete: () => {
        resetPartToBase('head');
        resetPartToBase('body');
        nodTimeline = null;
        setAction(null);
      },
    });

    nodTimeline
      .to(partElements.head, {
        x: headBase.x,
        y: headBase.y + 3,
        rotate: headBase.rotate + 4,
        duration: 0.22,
      })
      .to(
        partElements.body,
        {
          x: bodyBase.x,
          y: bodyBase.y + 1,
          rotate: bodyBase.rotate + 0.5,
          duration: 0.24,
        },
        0.06
      )
      .to(partElements.head, {
        x: headBase.x,
        y: headBase.y - 1,
        rotate: headBase.rotate - 2,
        duration: 0.25,
      })
      .to(partElements.head, {
        x: headBase.x,
        y: headBase.y + 2,
        rotate: headBase.rotate + 3,
        duration: 0.2,
      })
      .to(partElements.head, {
        x: headBase.x,
        y: headBase.y,
        rotate: headBase.rotate,
        duration: 0.28,
        ease: 'power1.out',
      })
      .to(
        partElements.body,
        {
          x: bodyBase.x,
          y: bodyBase.y,
          rotate: bodyBase.rotate,
          duration: 0.28,
          ease: 'power1.out',
        },
        '<'
      );

    setAction('nod');

    return nodTimeline;
  }

  function bounce() {
    bounceTimeline?.kill();
    bounceTimeline = null;

    stopAllAnimations({ reset: true });
    ensureFloatTimeline();

    const robotBase = base('robot');
    const headBase = base('head');

    bounceTimeline = gsap.timeline({
      defaults: { overwrite: 'auto', ease: 'sine.inOut' },
      onComplete: () => {
        resetPartToBase('robot');
        resetPartToBase('head');
        gsap.set(shadow, {
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          filter: 'blur(10px)',
        });
        bounceTimeline = null;
        setAction(null);
      },
    });

    bounceTimeline
      .to(robot, {
        x: robotBase.x + 4,
        y: robotBase.y - 18,
        rotate: robotBase.rotate + 1,
        duration: 0.34,
        ease: 'sine.out',
      })
      .to(
        shadow,
        {
          scaleX: 0.82,
          scaleY: 0.78,
          opacity: 0.5,
          filter: 'blur(14px)',
          duration: 0.34,
          ease: 'sine.out',
        },
        0
      )
      .to(
        partElements.head,
        {
          x: headBase.x - 2,
          y: headBase.y - 4,
          rotate: headBase.rotate - 2.5,
          duration: 0.32,
        },
        0.05
      )
      .to(robot, {
        x: robotBase.x - 2,
        y: robotBase.y + 3,
        rotate: robotBase.rotate - 0.6,
        duration: 0.3,
        ease: 'sine.in',
      })
      .to(
        shadow,
        {
          scaleX: 1.08,
          scaleY: 1.04,
          opacity: 1,
          filter: 'blur(9px)',
          duration: 0.3,
          ease: 'sine.in',
        },
        '<'
      )
      .to(robot, {
        x: robotBase.x,
        y: robotBase.y,
        rotate: robotBase.rotate,
        duration: 0.24,
        ease: 'power1.out',
      })
      .to(
        partElements.head,
        {
          x: headBase.x,
          y: headBase.y,
          rotate: headBase.rotate,
          duration: 0.24,
          ease: 'power1.out',
        },
        '<'
      )
      .to(
        shadow,
        {
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          filter: 'blur(10px)',
          duration: 0.24,
          ease: 'power1.out',
        },
        '<'
      );

    setAction('bounce');

    return bounceTimeline;
  }

  function startGesture(actionName, affectedParts, build) {
    gestureTimeline?.kill();
    gestureTimeline = null;

    stopAllAnimations({ reset: true });
    ensureFloatTimeline();

    gestureTimeline = gsap.timeline({
      defaults: { overwrite: 'auto', ease: 'sine.inOut' },
      onComplete: () => {
        affectedParts.forEach(resetPartToBase);
        gestureTimeline = null;
        setAction(null);
      },
    });

    build(gestureTimeline);
    setAction(actionName);

    return gestureTimeline;
  }

  function ponder() {
    const headBase = base('head');
    const bodyBase = base('body');
    const rightHandBase = base('rightHand');

    return startGesture('ponder', ['head', 'body', 'rightHand'], (timeline) => {
      timeline
        .to(partElements.head, {
          x: headBase.x + 2,
          y: headBase.y + 1,
          rotate: headBase.rotate + 5,
          duration: 0.35,
        })
        .to(
          partElements.body,
          {
            x: bodyBase.x,
            y: bodyBase.y,
            rotate: bodyBase.rotate + 0.7,
            duration: 0.38,
          },
          0.08
        )
        .to(
          partElements.rightHand,
          {
            x: rightHandBase.x + 2,
            y: rightHandBase.y - 1,
            rotate: rightHandBase.rotate + 4,
            duration: 0.34,
          },
          0.12
        )
        .to({}, { duration: 0.45 })
        .to(partElements.head, {
          x: headBase.x - 1,
          y: headBase.y,
          rotate: headBase.rotate - 2,
          duration: 0.32,
        })
        .to({}, { duration: 0.2 })
        .to(partElements.head, {
          x: headBase.x,
          y: headBase.y,
          rotate: headBase.rotate,
          duration: 0.3,
          ease: 'power1.out',
        })
        .to(
          [partElements.body, partElements.rightHand],
          {
            x: (index) => (index === 0 ? bodyBase.x : rightHandBase.x),
            y: (index) => (index === 0 ? bodyBase.y : rightHandBase.y),
            rotate: (index) => (index === 0 ? bodyBase.rotate : rightHandBase.rotate),
            duration: 0.3,
            ease: 'power1.out',
          },
          '<'
        );
    });
  }

  function dance() {
    const robotBase = base('robot');
    const headBase = base('head');
    const leftHandBase = base('leftHand');
    const rightHandBase = base('rightHand');

    return startGesture('dance', ['robot', 'head', 'leftHand', 'rightHand'], (timeline) => {
      const sway = (direction, lift) => ({
        x: robotBase.x + 9 * direction,
        y: robotBase.y + lift,
        rotate: robotBase.rotate + 3.5 * direction,
        duration: 0.34,
      });

      timeline
        .to(robot, sway(-1, -6))
        .to(
          partElements.head,
          {
            x: headBase.x - 2,
            y: headBase.y - 2,
            rotate: headBase.rotate + 4,
            duration: 0.32,
          },
          0.04
        )
        .to(
          [partElements.leftHand, partElements.rightHand],
          {
            rotate: (index) => (index === 0 ? leftHandBase.rotate - 8 : rightHandBase.rotate + 8),
            duration: 0.32,
          },
          0.06
        )
        .to(robot, sway(1, 1))
        .to(
          partElements.head,
          {
            x: headBase.x + 2,
            y: headBase.y + 1,
            rotate: headBase.rotate - 4,
            duration: 0.34,
          },
          '<'
        )
        .to(
          [partElements.leftHand, partElements.rightHand],
          {
            rotate: (index) => (index === 0 ? leftHandBase.rotate + 8 : rightHandBase.rotate - 8),
            duration: 0.34,
          },
          '<'
        )
        .to(robot, sway(-1, -4))
        .to(partElements.head, { x: headBase.x - 2, y: headBase.y - 1, rotate: headBase.rotate + 3, duration: 0.34 }, '<')
        .to(robot, {
          x: robotBase.x,
          y: robotBase.y,
          rotate: robotBase.rotate,
          duration: 0.32,
          ease: 'power1.out',
        })
        .to(
          partElements.head,
          {
            x: headBase.x,
            y: headBase.y,
            rotate: headBase.rotate,
            duration: 0.32,
            ease: 'power1.out',
          },
          '<'
        )
        .to(
          [partElements.leftHand, partElements.rightHand],
          {
            rotate: (index) => (index === 0 ? leftHandBase.rotate : rightHandBase.rotate),
            duration: 0.32,
            ease: 'power1.out',
          },
          '<'
        );
    });
  }

  function talkStart() {
    stopAllAnimations({ reset: true });
    ensureFloatTimeline();

    const head = partElements.head;
    const body = partElements.body;
    const headBase = base('head');
    const bodyBase = base('body');

    talkTimeline = gsap.timeline({
      repeat: -1,
      repeatDelay: 0.12,
      defaults: {
        overwrite: 'auto',
      },
    });

    talkTimeline
      .to(head, {
        y: headBase.y + 2,
        rotate: headBase.rotate + 2,
        duration: 0.12,
        ease: 'power1.out',
      })
      .to(head, {
        y: headBase.y,
        rotate: headBase.rotate - 1.5,
        duration: 0.14,
        ease: 'power1.inOut',
      })
      .to(head, {
        y: headBase.y - 1,
        rotate: headBase.rotate + 1.5,
        duration: 0.11,
        ease: 'sine.out',
      })
      .to(
        body,
        {
          y: bodyBase.y + 1,
          rotate: bodyBase.rotate - 0.7,
          duration: 0.2,
          ease: 'sine.inOut',
        },
        '<'
      )
      .to(head, {
        y: headBase.y,
        rotate: headBase.rotate,
        duration: 0.2,
        ease: 'sine.inOut',
      })
      .to(
        body,
        {
          y: bodyBase.y,
          rotate: bodyBase.rotate,
          duration: 0.2,
          ease: 'sine.inOut',
        },
        '<'
      )
      .to({}, { duration: 0.18 });

    setAction('talk');
  }

  function talkStop() {
    talkTimeline?.kill();
    talkTimeline = null;

    gsap.to(partElements.head, {
      x: base('head').x,
      y: base('head').y,
      rotate: base('head').rotate,
      scaleX: base('head').scaleX ?? 1,
      scaleY: base('head').scaleY ?? 1,
      duration: 0.25,
      ease: 'power2.out',
    });

    gsap.to(partElements.body, {
      x: base('body').x,
      y: base('body').y,
      rotate: base('body').rotate,
      duration: 0.25,
      ease: 'power2.out',
    });

    setAction(null);
  }


  const actions = { idle: startIdle, inspired: startInspiredIdle, wave, floatWaveAndSway, lookAround, nod, bounce, ponder, dance, talk: talkStart };

  try {
    await Promise.all([
      waitForImages(root),
      preloadImages(Object.values(ROBOT_PART_FILES.left).map((fileName) => `${assetBaseUrl}${fileName}`)),
    ]);
  } catch (error) {
    root.replaceChildren();
    root.classList.remove('portable-robot');
    delete root.dataset.portableRobotMounted;
    throw error;
  }
  assertActive();
  robot.dataset.facing = facing;
  applyRobotConfig();
  gsap.set(scaleLayer, { scale: initialScale, transformOrigin: 'top left' });

  const api = {
    play(name) {
      assertActive();
      if (!actions[name]) throw new RangeError(`Unknown robot animation: ${name}`);
      return actions[name]();
    },
    stop() { assertActive(); stopAllAnimations({ reset: true }); },
    setFacing(direction) { setFacing(direction); },
    startTalk() { assertActive(); return talkStart(); },
    stopTalk() { assertActive(); return talkStop(); },
    setScale(value) {
      assertActive();
      const scale = Number(value);
      if (!Number.isFinite(scale) || scale <= 0) throw new RangeError('Scale must be a positive number.');
      gsap.set(scaleLayer, { scale });
    },
    get action() { return currentAction; },
    get facing() { return facing; },
    get element() { return root; },
    destroy() {
      if (destroyed) return;
      stopAllAnimations({ reset: false });
      [floatTimeline, idleTimeline, inspiredTimeline, talkTimeline, waveTimeline, lookAroundTimeline, nodTimeline, bounceTimeline, gestureTimeline, floatWaveAndSwayTimeline]
        .forEach((timeline) => timeline?.kill());
      timelines.forEach((timeline) => timeline.kill());
      timelines.clear();
      root.replaceChildren();
      root.classList.remove('portable-robot');
      delete root.dataset.portableRobotMounted;
      delete root.dataset.action;
      destroyed = true;
    },
  };

  const autoplay = options.autoplay === undefined ? 'idle' : options.autoplay;
  if (autoplay) api.play(autoplay);
  return api;
}

export { ROBOT_CONFIG, ROBOT_LEFT_CONFIG };
