const DEBUG_ROBOT = false;
const ANIMATION_EDITOR_ENABLED = false;

const ROBOT_CONFIG = {
  robot: {
    x: 0,
    y: 0,
    rotate: -7,
    scale: 0.41,
    scaleX: 1,
    scaleY: 1,
    transformOrigin: '50% 56%',
    zIndex: 0,
    width: 390,
    top: 0,
    left: 0,
  },
  head: {
    left: 95,
    top: 20,
    width: 260,
    height: 246,
    x: -15,
    y: -107,
    rotate: 1,
    scale: 1.15,
    scaleX: 1,
    scaleY: 1,
    transformOrigin: '50% 75.03%',
    zIndex: 6,
  },
  body: {
    left: 120,
    top: 150,
    width: 220,
    height: 218.6,
    x: -8,
    y: -25,
    rotate: 5,
    scale: 0.81,
    scaleX: 1,
    scaleY: 1,
    transformOrigin: '50% 50%',
    zIndex: 3,
  },
  leftHand: {
    left: 45,
    top: 205,
    width: 120,
    height: 168.8,
    x: 8,
    y: -68,
    rotate: -3,
    scale: 1.11,
    scaleX: 1,
    scaleY: 1,
    transformOrigin: '80% 15%',
    zIndex: 4,
  },
  rightHand: {
    left: 300,
    top: 130,
    width: 120,
    height: 117.9,
    x: -38,
    y: -53,
    rotate: -6,
    scale: 1.95,
    scaleX: 1,
    scaleY: 1,
    transformOrigin: '18% 30%',
    zIndex: 2,
  },
  leftLeg: {
    left: 95,
    top: 330,
    width: 120,
    height: 211.9,
    x: -12,
    y: -67,
    rotate: 19,
    scale: 1.02,
    scaleX: 1,
    scaleY: 1,
    transformOrigin: '60% 10%',
    zIndex: 4,
  },
  rightLeg: {
    left: 240,
    top: 330,
    width: 120,
    height: 156.1,
    x: -32,
    y: -74,
    rotate: -10,
    scale: 1.28,
    scaleX: 1,
    scaleY: 1,
    transformOrigin: '45% 10%',
    zIndex: 1,
  },
};

const CONFIG_FIELDS = [
  'x',
  'y',
  'rotate',
  'scale',
  'scaleX',
  'scaleY',
  'transformOriginX',
  'transformOriginY',
  'zIndex',
  'width',
  'height',
  'top',
  'left',
];

const PART_NAMES = ['robot', 'head', 'body', 'leftHand', 'rightHand', 'leftLeg', 'rightLeg'];

const robotWrapper = document.querySelector('[data-part="robotWrapper"]');
const robot = document.querySelector('[data-part="robot"]');
const controls = document.querySelector('.controls');
const partElements = {
  robot,
  head: document.querySelector('[data-part="head"]'),
  body: document.querySelector('[data-part="body"]'),
  leftHand: document.querySelector('[data-part="leftHand"]'),
  rightHand: document.querySelector('[data-part="rightHand"]'),
  leftLeg: document.querySelector('[data-part="leftLeg"]'),
  rightLeg: document.querySelector('[data-part="rightLeg"]'),
};
const ROBOT_PART_SOURCES = {
  right: {
    head: 'images/head.svg',
    body: 'images/body.svg',
    leftHand: 'images/lhand.svg',
    rightHand: 'images/rhand.svg',
    leftLeg: 'images/leftleg.svg',
    rightLeg: 'images/rightleg.svg',
  },
  left: {
    head: 'images/head_turn_left.svg',
    body: 'images/body_turn_left.svg',
    leftHand: 'images/lhand_turn_left.svg',
    rightHand: 'images/rhand_turn_left.svg',
    leftLeg: 'images/leftleg_turn_left.svg',
    rightLeg: 'images/rightleg_turn_left.svg',
  },
};
const ANIMATED_PARTS = PART_NAMES.map((partName) => partElements[partName]);
const FLOAT_TARGETS = [robotWrapper, '.robot-ground-shadow'];
const initialConfig = structuredClone(ROBOT_CONFIG);
const ROBOT_LEFT_CONFIG = {
  robot: {
    x: 0, y: 0, rotate: -7, scale: 0.41, scaleX: 1, scaleY: 1,
    transformOrigin: '50% 56%', zIndex: 0, width: 390, top: 0, left: 0,
  },
  head: {
    left: 129, top: 26, width: 260, height: 246, x: -15, y: -107,
    rotate: 4, scale: 1.2, scaleX: 1, scaleY: 1,
    transformOrigin: '46.42% 96.88%', zIndex: 6,
  },
  body: {
    left: 120, top: 150, width: 220, height: 218.6, x: -8, y: -25,
    rotate: 5, scale: 0.83, scaleX: 1, scaleY: 1,
    transformOrigin: '50% 50%', zIndex: 3,
  },
  leftHand: {
    left: 260, top: 210, width: 120, height: 168.8, x: 8, y: -68,
    rotate: -3, scale: 1.11, scaleX: 1, scaleY: 1,
    transformOrigin: '18.04% 18.75%', zIndex: 3,
  },
  rightHand: {
    left: 119, top: 146, width: 120, height: 138, x: -38, y: -53,
    rotate: -6, scale: 1.95, scaleX: 1, scaleY: 1,
    transformOrigin: '86.98% 54.79%', zIndex: 2,
  },
  leftLeg: {
    left: 250, top: 330, width: 120, height: 211.9, x: -12, y: -67,
    rotate: 19, scale: 1.1, scaleX: 1, scaleY: 1,
    transformOrigin: '18.53% 14.12%', zIndex: 4,
  },
  rightLeg: {
    left: 122, top: 315, width: 120, height: 156.1, x: -32, y: -74,
    rotate: -10, scale: 1.37, scaleX: 1, scaleY: 1,
    transformOrigin: '71.62% 29.85%', zIndex: 1,
  },
};
const ROBOT_FACING_CONFIGS = {
  right: ROBOT_CONFIG,
  left: ROBOT_LEFT_CONFIG,
};
const initialFacingConfigs = structuredClone(ROBOT_FACING_CONFIGS);
const debugInputs = new Map();
const originDots = new Map();

let selectedPart = 'head';
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
let roamAndDisappearTimeline;
let debugPanel;
let robotFacing = null;

// Warm both poses up so changing direction in the middle of an animation is instant.
Object.values(ROBOT_PART_SOURCES).forEach((pose) => {
  Object.values(pose).forEach((source) => {
    const image = new Image();
    image.src = source;
  });
});

function setRobotFacing(direction) {
  if (!ROBOT_PART_SOURCES[direction] || robotFacing === direction) return;

  Object.entries(ROBOT_PART_SOURCES[direction]).forEach(([partName, source]) => {
    partElements[partName].src = source;
  });

  robotFacing = direction;
  robot.dataset.facing = direction;

  // Directional placement is applied with the artwork, so the debug editor can
  // calibrate a genuinely independent pose for each set of SVGs.
  applyRobotConfig();
}

function activeRobotConfig() {
  return ROBOT_FACING_CONFIGS[robotFacing || 'right'];
}

function splitTransformOrigin(transformOrigin) {
  const [x = '50%', y = '50%'] = transformOrigin.split(' ');
  return { x: parseFloat(x), y: parseFloat(y) };
}

function joinTransformOrigin(x, y) {
  return `${x}% ${y}%`;
}

function getDebugValue(partName, field) {
  const config = activeRobotConfig()[partName];

  if (field === 'transformOriginX') return splitTransformOrigin(config.transformOrigin).x;
  if (field === 'transformOriginY') return splitTransformOrigin(config.transformOrigin).y;

  return config[field] ?? 0;
}

function setDebugValue(partName, field, value) {
  const config = activeRobotConfig()[partName];
  const numericValue = Number(value);

  if (field === 'transformOriginX' || field === 'transformOriginY') {
    const origin = splitTransformOrigin(config.transformOrigin);

    if (field === 'transformOriginX') origin.x = numericValue;
    if (field === 'transformOriginY') origin.y = numericValue;

    config.transformOrigin = joinTransformOrigin(origin.x, origin.y);
    return;
  }

  config[field] = numericValue;
}

function applyConfigToPart(partName) {
  const element = partElements[partName];
  const config = activeRobotConfig()[partName];
  const styles = {
    x: config.x,
    y: config.y,
    rotate: config.rotate,
    scale: config.scale,
    scaleX: config.scaleX,
    scaleY: config.scaleY,
    transformOrigin: config.transformOrigin,
    zIndex: config.zIndex,
    width: config.width,
  };

  if (partName !== 'robot') {
    styles.position = 'absolute';
    styles.left = config.left;
    styles.top = config.top;
    styles.width = config.width;
    styles.height = config.height;
  }

  gsap.set(element, styles);
}

function applyRobotConfig() {
  PART_NAMES.forEach(applyConfigToPart);
  updateOriginDots();
  updateSelectedHighlight();
}

function base(partName) {
  return initialConfig[partName];
}

function baseTransform(partName, overrides = {}) {
  const partBase = base(partName);

  return {
    x: partBase.x ?? 0,
    y: partBase.y ?? 0,
    rotate: partBase.rotate ?? 0,
    scale: partBase.scale ?? 1,
    scaleX: partBase.scaleX ?? 1,
    scaleY: partBase.scaleY ?? 1,
    transformOrigin: partBase.transformOrigin,
    ...overrides,
  };
}

function resetPartToBase(partName, options = {}) {
  const element = partElements[partName];
  const partBase = base(partName);

  gsap.set(element, {
    ...baseTransform(partName, {
      transformOrigin: options.transformOrigin ?? partBase.transformOrigin,
    }),
    zIndex: options.zIndex ?? partBase.zIndex,
  });
}

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
    .to('.robot-ground-shadow', { scaleX: 0.86, scaleY: 0.8, opacity: 0.55, filter: 'blur(13px)', duration: 0.42 }, 0)
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
    .to('.robot-ground-shadow', { scaleX: 1, scaleY: 1, opacity: 1, filter: 'blur(10px)', duration: 0.52 }, 0.88)
    .to(partElements.head, { y: base('head').y, rotate: base('head').rotate, duration: 0.52 }, 0.88)
    .to(partElements.leftHand, { rotate: base('leftHand').rotate, y: base('leftHand').y, duration: 0.52 }, 0.88)
    .to(partElements.rightHand, { x: base('rightHand').x, y: base('rightHand').y, rotate: base('rightHand').rotate, duration: 0.52 }, 0.88)
    .to(partElements.leftLeg, { rotate: base('leftLeg').rotate, x: base('leftLeg').x, duration: 0.52 }, 0.88)
    .to(partElements.rightLeg, { rotate: base('rightLeg').rotate, x: base('rightLeg').x, duration: 0.52 }, 0.88);

  return timeline;
}

function pauseAnimations() {
  idleTimeline?.pause();
  inspiredTimeline?.pause();
  talkTimeline?.pause();
  waveTimeline?.pause();
  lookAroundTimeline?.pause();
  nodTimeline?.pause();
  bounceTimeline?.pause();
  gestureTimeline?.pause();
  floatWaveAndSwayTimeline?.pause();
  roamAndDisappearTimeline?.pause();
  floatTimeline?.pause();
  gsap.getTweensOf([...ANIMATED_PARTS, ...FLOAT_TARGETS]).forEach((tween) => tween.pause());
}

function resumeAnimations() {
  idleTimeline?.resume();
  inspiredTimeline?.resume();
  talkTimeline?.resume();
  waveTimeline?.resume();
  lookAroundTimeline?.resume();
  nodTimeline?.resume();
  bounceTimeline?.resume();
  gestureTimeline?.resume();
  floatWaveAndSwayTimeline?.resume();
  roamAndDisappearTimeline?.resume();
  floatTimeline?.resume();
  gsap.getTweensOf([...ANIMATED_PARTS, ...FLOAT_TARGETS]).forEach((tween) => tween.resume());
}

function setActiveButton(actionName) {
  document
    .querySelectorAll('.controls [data-action]')
    .forEach((button) => {
      button.classList.toggle('is-active', button.dataset.action === actionName);
    });
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
  roamAndDisappearTimeline?.kill();

  talkTimeline = null;
  waveTimeline = null;
  lookAroundTimeline = null;
  nodTimeline = null;
  bounceTimeline = null;
  gestureTimeline = null;
  floatWaveAndSwayTimeline = null;
  roamAndDisappearTimeline = null;

  gsap.killTweensOf([...ANIMATED_PARTS, robotWrapper, '.robot-ground-shadow']);

  if (reset) {
    setRobotFacing('right');
    applyRobotConfig();
    gsap.set(robotWrapper, { x: 0, y: 0, rotate: 0, scaleX: 1, scaleY: 1, opacity: 1 });
    gsap.set('.robot-ground-shadow', {
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      filter: 'blur(10px)',
    });
  }

  setActiveButton(null);
}

function roamAndDisappear() {
  stopAllAnimations({ reset: true });

  const stageBounds = document.querySelector('.stage').getBoundingClientRect();
  const robotBounds = robot.getBoundingClientRect();
  const horizontalRange = Math.max(28, (stageBounds.width - robotBounds.width) / 2 - 24);
  const verticalRange = Math.max(30, (stageBounds.height - robotBounds.height) / 2 - 48);
  const shadow = '.robot-ground-shadow';
  const leftHandBase = base('leftHand');
  const rightHandBase = base('rightHand');
  const leftLegBase = base('leftLeg');
  const rightLegBase = base('rightLeg');

  roamAndDisappearTimeline = gsap.timeline({
    defaults: { overwrite: 'auto', ease: 'sine.inOut' },
    onComplete: () => {
      ['leftHand', 'rightHand', 'leftLeg', 'rightLeg'].forEach(resetPartToBase);
      roamAndDisappearTimeline = null;
      setActiveButton(null);
    },
  });

  roamAndDisappearTimeline
    // Join the same right-side curve later so the route is shorter without increasing its speed.
    .to(robotWrapper, { x: horizontalRange * 0.68, y: verticalRange * 0.58, rotate: 7, duration: 2.2 })
    .to(shadow, { x: horizontalRange * 0.68, scaleX: 0.9, opacity: 0.54, duration: 2.2 }, 0)
    .to(robotWrapper, { x: horizontalRange * 0.82, y: verticalRange * 0.15, rotate: -7, duration: 2.1 })
    .to(shadow, { x: horizontalRange * 0.82, scaleX: 0.76, opacity: 0.43, duration: 2.1 }, '<')
    .call(() => setRobotFacing('left'))
    .to(robotWrapper, { x: horizontalRange * 0.42, y: -verticalRange * 0.08, rotate: -4, duration: 2.2 })
    .to(shadow, { x: horizontalRange * 0.42, scaleX: 0.62, opacity: 0.33, duration: 2.2 }, '<')
    .call(() => setRobotFacing('right'))
    .to(robotWrapper, { x: horizontalRange * 0.58, y: -verticalRange * 0.48, rotate: 6, duration: 2 })
    .to(shadow, { x: horizontalRange * 0.58, scaleX: 0.42, opacity: 0.22, duration: 2 }, '<')
    // Finish inside the marked upper-right disappearance area.
    .to(robotWrapper, {
      x: horizontalRange * 0.92,
      y: -verticalRange * 0.7,
      rotate: 8,
      scaleX: 0.72,
      scaleY: 0.72,
      opacity: 0,
      duration: 1.7,
      ease: 'power2.in',
    })
    .to(shadow, { x: horizontalRange * 0.92, scaleX: 0.15, scaleY: 0.3, opacity: 0, duration: 1.4 }, '<0.3')
    // Let the limbs trail the body with small alternating motions throughout the flight.
    .to(partElements.leftHand, { rotate: leftHandBase.rotate - 8, y: leftHandBase.y - 2, duration: 0.85, repeat: 11, yoyo: true }, 0)
    .to(partElements.rightHand, { rotate: rightHandBase.rotate + 6, y: rightHandBase.y + 2, duration: 1.02, repeat: 9, yoyo: true }, 0)
    .to(partElements.leftLeg, { rotate: leftLegBase.rotate - 7, x: leftLegBase.x - 2, duration: 0.85, repeat: 11, yoyo: true }, 0)
    .to(partElements.rightLeg, { rotate: rightLegBase.rotate + 7, x: rightLegBase.x + 2, duration: 1.02, repeat: 9, yoyo: true }, 0);

  setActiveButton('roamAndDisappear');
  return roamAndDisappearTimeline;
}

function floatWaveAndSway() {
  stopAllAnimations({ reset: true });

  const handBase = base('rightHand');
  const headBase = base('head');
  const hand = partElements.rightHand;
  const head = partElements.head;
  const shadow = '.robot-ground-shadow';

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
      setActiveButton(null);
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

  setActiveButton('floatWaveAndSway');
  return floatWaveAndSwayTimeline;
}

function startIdle() {
  stopAllAnimations({ reset: true });
  ensureFloatTimeline();

  if (!idleTimeline) {
    idleTimeline = buildIdleTimeline();
  }

  idleTimeline.restart();
  setActiveButton('idle');
}

function startInspiredIdle() {
  stopAllAnimations({ reset: true });
  ensureFloatTimeline();

  if (!inspiredTimeline) {
    inspiredTimeline = buildInspiredTimeline();
  }

  inspiredTimeline.restart();
  setActiveButton('inspired');
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
  gsap.killTweensOf(ANIMATED_PARTS);
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
        setActiveButton('idle');
      } else if (idleWasRunning && activeIdle === 'inspired') {
        inspiredTimeline?.resume();
        setActiveButton('inspired');
      } else {
        setActiveButton(null);
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

  setActiveButton('wave');

  return waveTimeline;
}

function lookAround() {
  lookAroundTimeline?.kill();
  lookAroundTimeline = null;

  stopAllAnimations({ reset: true });
  ensureFloatTimeline();

  const head = partElements.head;
  const body = partElements.body;
  const headBase = base('head');
  const bodyBase = base('body');

  lookAroundTimeline = gsap.timeline({
    defaults: {
      overwrite: 'auto',
      ease: 'sine.inOut',
    },
    onComplete: () => {
      setRobotFacing('right');
      resetPartToBase('head');
      resetPartToBase('body');
      lookAroundTimeline = null;
      setActiveButton(null);
    },
  });

  lookAroundTimeline
    .call(() => setRobotFacing('left'))
    .to(head, {
      x: headBase.x - 3,
      y: headBase.y,
      rotate: headBase.rotate - 5,
      duration: 0.28,
    })
    .to(
      body,
      {
        x: bodyBase.x,
        y: bodyBase.y,
        rotate: bodyBase.rotate - 0.8,
        duration: 0.3,
      },
      0.08
    )
    .to({}, { duration: 0.18 })
    .call(() => setRobotFacing('right'))
    .to(head, {
      x: headBase.x + 3,
      y: headBase.y,
      rotate: headBase.rotate + 5,
      duration: 0.42,
    })
    .to(
      body,
      {
        x: bodyBase.x,
        y: bodyBase.y,
        rotate: bodyBase.rotate + 0.8,
        duration: 0.4,
      },
      '<0.06'
    )
    .to({}, { duration: 0.18 })
    .to(head, {
      x: headBase.x,
      y: headBase.y,
      rotate: headBase.rotate,
      duration: 0.3,
      ease: 'power1.out',
    })
    .to(
      body,
      {
        x: bodyBase.x,
        y: bodyBase.y,
        rotate: bodyBase.rotate,
        duration: 0.3,
        ease: 'power1.out',
      },
      '<'
    );

  setActiveButton('lookAround');

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
      setActiveButton(null);
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

  setActiveButton('nod');

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
      gsap.set('.robot-ground-shadow', {
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        filter: 'blur(10px)',
      });
      bounceTimeline = null;
      setActiveButton(null);
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
      '.robot-ground-shadow',
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
      '.robot-ground-shadow',
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
      '.robot-ground-shadow',
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

  setActiveButton('bounce');

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
      setActiveButton(null);
    },
  });

  build(gestureTimeline);
  setActiveButton(actionName);

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

  setActiveButton('talk');
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

  setActiveButton(null);
}

function createDebugPanel() {
  debugPanel = document.createElement('aside');
  debugPanel.className = 'debug-panel';
  debugPanel.innerHTML = `
    <h2>Robot Debug Editor</h2>
    <label>
      Facing
      <select data-debug-facing>
        <option value="right">Right artwork</option>
        <option value="left">Left artwork</option>
      </select>
    </label>
    <label>
      Part
      <select data-debug-part>
        ${PART_NAMES.map((partName) => `<option value="${partName}">${partName}</option>`).join('')}
      </select>
    </label>
    <div class="debug-fields"></div>
    <div class="debug-actions">
      <button type="button" data-debug-action="pause">Pause animations</button>
      <button type="button" data-debug-action="resume">Resume animations</button>
      <button type="button" data-debug-action="reset">Reset selected part</button>
      <button type="button" data-debug-action="copy">Copy current facing config</button>
    </div>
    <p class="debug-help">Shortcuts: arrows move 1px, Shift+arrows move 10px, [ / ] rotate 1°, Shift+[ / Shift+] rotate 5°, Tab cycles parts.</p>
  `;
  document.body.appendChild(debugPanel);

  const select = debugPanel.querySelector('[data-debug-part]');
  select.value = selectedPart;
  select.addEventListener('change', () => selectPart(select.value));

  const facingSelect = debugPanel.querySelector('[data-debug-facing]');
  facingSelect.value = robotFacing;
  facingSelect.addEventListener('change', () => {
    setRobotFacing(facingSelect.value);
    refreshDebugInputs();
    updateOriginDots();
    updateSelectedHighlight();
  });

  debugPanel.addEventListener('input', (event) => {
    const input = event.target.closest('[data-debug-field]');
    if (!input) return;

    setDebugValue(selectedPart, input.dataset.debugField, input.value);
    applyConfigToPart(selectedPart);
    updateOriginDots();
    updateSelectedHighlight();
  });

  debugPanel.addEventListener('click', (event) => {
    const button = event.target.closest('[data-debug-action]');
    if (!button) return;

    const actions = {
      pause: pauseAnimations,
      resume: resumeAnimations,
      reset: resetSelectedPart,
      copy: copyCurrentConfig,
    };

    actions[button.dataset.debugAction]?.();
  });

  renderDebugFields();
}

function renderDebugFields() {
  const fields = debugPanel.querySelector('.debug-fields');
  fields.innerHTML = '';
  debugInputs.clear();

  CONFIG_FIELDS.forEach((field) => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'number';
    input.step = field.includes('transformOrigin') || field.includes('scale') ? '0.01' : '1';
    input.value = getDebugValue(selectedPart, field);
    input.dataset.debugField = field;
    label.textContent = field;
    label.appendChild(input);
    fields.appendChild(label);
    debugInputs.set(field, input);
  });
}

function refreshDebugInputs() {
  CONFIG_FIELDS.forEach((field) => {
    const input = debugInputs.get(field);
    if (input) input.value = getDebugValue(selectedPart, field);
  });
}

function selectPart(partName) {
  selectedPart = partName;
  debugPanel.querySelector('[data-debug-part]').value = selectedPart;
  renderDebugFields();
  updateOriginDots();
  updateSelectedHighlight();
}

function createOriginDots() {
  PART_NAMES.forEach((partName) => {
    const dot = document.createElement('span');
    dot.className = 'origin-dot';
    dot.dataset.originDot = partName;
    dot.title = `${partName} transform origin`;
    robot.appendChild(dot);
    originDots.set(partName, dot);
    installOriginDotDragging(dot, partName);
  });

  updateOriginDots();
}

function installOriginDotDragging(dot, partName) {
  dot.addEventListener('pointerdown', (event) => {
    if (partName !== selectedPart) return;

    event.preventDefault();
    dot.setPointerCapture(event.pointerId);

    const config = activeRobotConfig()[partName];
    const startOrigin = splitTransformOrigin(config.transformOrigin);
    const startX = event.clientX;
    const startY = event.clientY;
    const element = partElements[partName];
    const bounds = element.getBoundingClientRect();
    const renderedWidth = Math.max(1, bounds.width);
    const renderedHeight = Math.max(1, bounds.height);

    const move = (moveEvent) => {
      const originX = Math.max(0, Math.min(100, startOrigin.x + ((moveEvent.clientX - startX) / renderedWidth) * 100));
      const originY = Math.max(0, Math.min(100, startOrigin.y + ((moveEvent.clientY - startY) / renderedHeight) * 100));

      config.transformOrigin = joinTransformOrigin(Number(originX.toFixed(2)), Number(originY.toFixed(2)));
      applyConfigToPart(partName);
      refreshDebugInputs();
      updateOriginDots();
    };

    const up = () => {
      dot.removeEventListener('pointermove', move);
      dot.removeEventListener('pointerup', up);
      dot.removeEventListener('pointercancel', up);
    };

    dot.addEventListener('pointermove', move);
    dot.addEventListener('pointerup', up);
    dot.addEventListener('pointercancel', up);
  });
}

function getOriginDotPosition(partName) {
  const config = activeRobotConfig()[partName];
  const { x, y } = splitTransformOrigin(config.transformOrigin);

  if (partName === 'robot') {
    return {
      left: (config.width || robot.offsetWidth) * (x / 100),
      top: robot.offsetHeight * (y / 100),
    };
  }

  const element = partElements[partName];
  return {
    left: config.left + config.x + config.width * (x / 100),
    top: config.top + config.y + element.offsetHeight * (y / 100),
  };
}

function updateOriginDots() {
  if (!DEBUG_ROBOT || originDots.size === 0) return;

  PART_NAMES.forEach((partName) => {
    const dot = originDots.get(partName);
    const position = getOriginDotPosition(partName);
    dot.style.left = `${position.left}px`;
    dot.style.top = `${position.top}px`;
    dot.classList.toggle('is-selected', partName === selectedPart);
  });
}

function updateSelectedHighlight() {
  if (!DEBUG_ROBOT) return;

  PART_NAMES.forEach((partName) => {
    partElements[partName].classList.toggle('debug-selected', partName === selectedPart);
  });
}

function resetSelectedPart() {
  activeRobotConfig()[selectedPart] = structuredClone(initialFacingConfigs[robotFacing][selectedPart]);
  applyConfigToPart(selectedPart);
  refreshDebugInputs();
  updateOriginDots();
  updateSelectedHighlight();
}

function formatConfigForCopy() {
  const configName = robotFacing === 'left' ? 'ROBOT_LEFT_CONFIG' : 'ROBOT_RIGHT_CONFIG';
  return `const ${configName} = ${JSON.stringify(activeRobotConfig(), null, 2).replace(/"([^"\\]+)":/g, '$1:')};`;
}

async function copyCurrentConfig() {
  const output = formatConfigForCopy();
  console.log(output);

  try {
    await navigator.clipboard.writeText(output);
  } catch (error) {
    console.warn('Clipboard copy failed. Config was logged to the console instead.', error);
  }
}

function moveSelectedPart(deltaX, deltaY) {
  ROBOT_CONFIG[selectedPart].x += deltaX;
  ROBOT_CONFIG[selectedPart].y += deltaY;
  applyConfigToPart(selectedPart);
  refreshDebugInputs();
}

function rotateSelectedPart(delta) {
  ROBOT_CONFIG[selectedPart].rotate += delta;
  applyConfigToPart(selectedPart);
  refreshDebugInputs();
}

function handleDebugKeyboard(event) {
  if (!DEBUG_ROBOT || ANIMATION_EDITOR_ENABLED) return;

  const isTyping = ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName);
  if (isTyping && event.key !== 'Tab') return;

  const moveAmount = event.shiftKey ? 10 : 1;
  const rotateAmount = event.shiftKey ? 5 : 1;
  const actions = {
    ArrowUp: () => moveSelectedPart(0, -moveAmount),
    ArrowDown: () => moveSelectedPart(0, moveAmount),
    ArrowLeft: () => moveSelectedPart(-moveAmount, 0),
    ArrowRight: () => moveSelectedPart(moveAmount, 0),
    '[': () => rotateSelectedPart(-rotateAmount),
    ']': () => rotateSelectedPart(rotateAmount),
    Tab: () => selectPart(PART_NAMES[(PART_NAMES.indexOf(selectedPart) + 1) % PART_NAMES.length]),
  };
  const action = actions[event.key];

  if (!action) return;

  event.preventDefault();
  action();
}

setRobotFacing('right');
applyRobotConfig();
ensureFloatTimeline();
startIdle();

if (DEBUG_ROBOT) {
  pauseAnimations();
  createDebugPanel();
  window.addEventListener('load', updateOriginDots);
  window.addEventListener('keydown', handleDebugKeyboard);
  createOriginDots();
}

window.ROBOT_CONFIG = ROBOT_CONFIG;
window.ROBOT_FACING_CONFIGS = ROBOT_FACING_CONFIGS;
window.setRobotFacing = setRobotFacing;
window.startIdle = startIdle;
window.stopIdle = stopIdle;
window.stopAllAnimations = stopAllAnimations;
window.wave = wave;
window.floatWaveAndSway = floatWaveAndSway;
window.roamAndDisappear = roamAndDisappear;
window.lookAround = lookAround;
window.nod = nod;
window.bounce = bounce;
window.ponder = ponder;
window.dance = dance;
window.startInspiredIdle = startInspiredIdle;
window.talkStart = talkStart;
window.talkStop = talkStop;

controls.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const actions = {
    idle: startIdle,
    inspired: startInspiredIdle,
    wave,
    floatWaveAndSway,
    roamAndDisappear,
    lookAround,
    nod,
    bounce,
    ponder,
    dance,
    talk: talkStart,
    'talk-stop': talkStop,
    stop: stopAllAnimations,
  };

  actions[button.dataset.action]?.();
});

// ==================================================
// Animation data
// ==================================================
const ANIMATION_STORAGE_KEY = 'robotAnimationEditorData';
const EDITOR_FIELDS = ['x', 'y', 'rotate', 'scale', 'scaleX', 'scaleY', 'opacity', 'transformOriginX', 'transformOriginY'];
const EASE_OPTIONS = [
  'none',
  'linear',
  'sine.in',
  'sine.out',
  'sine.inOut',
  'power1.in',
  'power1.out',
  'power1.inOut',
  'power2.in',
  'power2.out',
  'power2.inOut',
  'back.out',
  'elastic.out',
];
const DEFAULT_ANIMATION_DATA = {
  idle: {
    name: 'Idle',
    duration: 1.5,
    loop: true,
    keyframes: [
      {
        id: 'kf-1783854376719-2f1892c6d9228',
        time: 0,
        part: 'head',
        values: { x: -15, y: -107, rotate: 1, scale: 1.15, scaleX: 1, scaleY: 1, opacity: 1, transformOriginX: 50, transformOriginY: 75.03 },
        ease: 'none',
      },
      {
        id: 'kf-1783854570870-d44ee7d024aaa8',
        time: 0,
        part: 'leftHand',
        values: { x: 8, y: -68, rotate: 13, scale: 1.11, scaleX: 1, scaleY: 1, opacity: 1, transformOriginX: 80, transformOriginY: 15 },
        ease: 'none',
      },
      {
        id: 'kf-1783854594638-a7201f20c6ba',
        time: 0,
        part: 'leftLeg',
        values: { x: -12, y: -67, rotate: 17, scale: 1.02, scaleX: 1, scaleY: 1, opacity: 1, transformOriginX: 60, transformOriginY: 10 },
        ease: 'none',
      },
      {
        id: 'kf-1784032997085-7ab2259c67747',
        time: 0,
        part: 'rightHand',
        values: { x: -38, y: -53, rotate: -6, scale: 1.95, scaleX: 1, scaleY: 1, opacity: 1, transformOriginX: 15, transformOriginY: 30 },
        ease: 'none',
      },
      {
        id: 'kf-1783854600301-22bd2b0da896',
        time: 0,
        part: 'rightLeg',
        values: { x: -32, y: -74, rotate: 9, scale: 1.28, scaleX: 1, scaleY: 1, opacity: 1, transformOriginX: 45, transformOriginY: 10 },
        ease: 'none',
      },
      {
        id: 'kf-1783854437914-64afca06b02c08',
        time: 0.496,
        part: 'leftHand',
        values: { x: 8, y: -68, rotate: 2, scale: 1.11, scaleX: 1, scaleY: 1, opacity: 1, transformOriginX: 80, transformOriginY: 15 },
        ease: 'sine.in',
      },
      {
        id: 'kf-1783854497902-d2fcac3fdd037',
        time: 0.497,
        part: 'rightLeg',
        values: { x: -32, y: -74, rotate: 18, scale: 1.28, scaleX: 1, scaleY: 1, opacity: 1, transformOriginX: 45, transformOriginY: 10 },
        ease: 'sine.in',
      },
      {
        id: 'kf-1783855180457-b5cd55d0474b28',
        time: 0.499,
        part: 'head',
        values: { x: -15, y: -107, rotate: 13, scale: 1.15, scaleX: 1, scaleY: 1, opacity: 1, transformOriginX: 50, transformOriginY: 75.03 },
        ease: 'sine.in',
      },
      {
        id: 'kf-1783854398087-905ff75f6fce',
        time: 0.502,
        part: 'leftLeg',
        values: { x: -12, y: -67, rotate: 13, scale: 1.02, scaleX: 1, scaleY: 1, opacity: 1, transformOriginX: 60, transformOriginY: 10 },
        ease: 'sine.in',
      },
      {
        id: 'kf-1784033011647-0a74c054c7313',
        time: 0.503,
        part: 'rightHand',
        values: { x: -17, y: -53, rotate: 26, scale: 1.95, scaleX: 1, scaleY: 1, opacity: 1, transformOriginX: 15, transformOriginY: 30 },
        ease: 'sine.in',
      },
      {
        id: 'kf-1784667363117-6d2ee3c22de82',
        time: 1.346,
        part: 'head',
        values: { x: -15, y: -107, rotate: -2, scale: 1.15, scaleX: 1, scaleY: 1, opacity: 1, transformOriginX: 50, transformOriginY: 75.03 },
        ease: 'sine.in',
      },
      {
        id: 'kf-1784667410218-61903269721e7',
        time: 1.346,
        part: 'leftHand',
        values: { x: 8, y: -68, rotate: -7, scale: 1.11, scaleX: 1, scaleY: 1, opacity: 1, transformOriginX: 80, transformOriginY: 15 },
        ease: 'sine.in',
      },
      {
        id: 'kf-1784667467835-d56a02d6580268',
        time: 1.346,
        part: 'rightHand',
        values: { x: 8, y: -41, rotate: 48, scale: 1.95, scaleX: 1, scaleY: 1, opacity: 1, transformOriginX: 15, transformOriginY: 30 },
        ease: 'sine.in',
      },
      {
        id: 'kf-1784667517485-9842dab169f52',
        time: 1.346,
        part: 'rightLeg',
        values: { x: -32, y: -74, rotate: 23, scale: 1.28, scaleX: 1, scaleY: 1, opacity: 1, transformOriginX: 45, transformOriginY: 10 },
        ease: 'sine.in',
      },
      {
        id: 'kf-1784667492023-19209b0b1d6b8',
        time: 1.349,
        part: 'leftLeg',
        values: { x: -12, y: -67, rotate: 6, scale: 1.02, scaleX: 1, scaleY: 1, opacity: 1, transformOriginX: 60, transformOriginY: 10 },
        ease: 'sine.in',
      },
    ],
  },
  wave: { name: 'Wave', duration: 2.4, loop: false, keyframes: [] },
  talk: { name: 'Talk', duration: 1.2, loop: true, keyframes: [] },
  happy: { name: 'Happy', duration: 2.8, loop: false, keyframes: [] },
};
const ANIMATION_DATA = loadAnimationData();

let animationEditor;
let animationPanelBody;
let selectedAnimationKey = Object.keys(ANIMATION_DATA)[0] || 'idle';
let editorSelectedPart = 'head';
let selectedKeyframeId = null;
let copiedKeyframe = null;
let editorCurrentTime = 0;
let editorZoom = 1;
let editorIsPlaying = false;
let editorRecordMode = false;
let editorOnionSkin = false;
let editorRafId = null;
let editorPlayStart = 0;
let editorPlayStartTime = 0;
const editorInputs = new Map();
const onionLayer = document.createElement('div');
const currentEditorValues = {};

function getCurrentAnimation() {
  return ANIMATION_DATA[selectedAnimationKey];
}

function makeAnimationKey(name) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'animation';
  let key = base;
  let index = 2;
  while (ANIMATION_DATA[key]) {
    key = `${base}-${index}`;
    index += 1;
  }
  return key;
}

function makeKeyframeId() {
  return `kf-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getBaseTransform(partName) {
  const config = ROBOT_CONFIG[partName];
  const origin = splitTransformOrigin(config.transformOrigin);
  return {
    x: config.x || 0,
    y: config.y || 0,
    rotate: config.rotate || 0,
    scale: config.scale ?? 1,
    scaleX: config.scaleX ?? 1,
    scaleY: config.scaleY ?? 1,
    opacity: 1,
    transformOriginX: origin.x,
    transformOriginY: origin.y,
  };
}

function getPartValues(partName) {
  return { ...getBaseTransform(partName), ...(currentEditorValues[partName] || {}) };
}

function setPartValues(partName, values) {
  currentEditorValues[partName] = { ...getPartValues(partName), ...values };
  applyEditorValues(partName, currentEditorValues[partName]);
}

function applyEditorValues(partName, values) {
  const element = partElements[partName];
  gsap.set(element, {
    x: values.x,
    y: values.y,
    rotate: values.rotate,
    scale: values.scale,
    scaleX: values.scaleX,
    scaleY: values.scaleY,
    opacity: values.opacity,
    transformOrigin: joinTransformOrigin(values.transformOriginX, values.transformOriginY),
    overwrite: 'auto',
  });
}

function syncEditorValuesFromBase() {
  PART_NAMES.forEach((partName) => {
    currentEditorValues[partName] = getBaseTransform(partName);
  });
}

// ==================================================
// localStorage
// ==================================================
function loadAnimationData() {
  try {
    const saved = localStorage.getItem(ANIMATION_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (error) {
    console.warn('Could not load animation data from localStorage.', error);
  }
  return structuredClone(DEFAULT_ANIMATION_DATA);
}

function saveAnimationData() {
  localStorage.setItem(ANIMATION_STORAGE_KEY, JSON.stringify(ANIMATION_DATA));
}

function clearSavedAnimationData() {
  if (!confirm('Clear saved animation data from this browser?')) return;
  localStorage.removeItem(ANIMATION_STORAGE_KEY);
  Object.keys(ANIMATION_DATA).forEach((key) => delete ANIMATION_DATA[key]);
  Object.assign(ANIMATION_DATA, structuredClone(DEFAULT_ANIMATION_DATA));
  selectedAnimationKey = 'idle';
  selectedKeyframeId = null;
  editorCurrentTime = 0;
  renderAnimationEditor();
  previewAtTime(editorCurrentTime);
}

// ==================================================
// timeline rendering
// ==================================================
function createAnimationEditor() {
  document.body.classList.add('animation-editor-enabled');
  animationEditor = document.createElement('aside');
  animationEditor.className = 'animation-editor';
  animationEditor.innerHTML = `
    <div class="animation-editor__header">
      <h2>Animation Editor</h2>
      <button type="button" data-editor-action="togglePanel">Hide</button>
    </div>
    <div class="animation-editor__body"></div>
  `;
  document.body.appendChild(animationEditor);
  animationPanelBody = animationEditor.querySelector('.animation-editor__body');
  animationEditor.addEventListener('click', handleAnimationEditorClick);
  animationEditor.addEventListener('input', handleAnimationEditorInput);
  animationEditor.addEventListener('change', handleAnimationEditorChange);
  window.addEventListener('keydown', handleAnimationEditorKeyboard);
  window.addEventListener('resize', renderTimelineMarkers);
  onionLayer.className = 'onion-layer';
  robot.appendChild(onionLayer);
  renderAnimationEditor();
}

function renderAnimationEditor() {
  const animation = getCurrentAnimation();
  animationPanelBody.innerHTML = `
    <section class="editor-section">
      <h3>Animation <span class="recording-indicator ${editorRecordMode ? 'is-recording' : ''}">RECORDING</span></h3>
      <label>Animation
        <select data-editor="animationSelect">
          ${Object.entries(ANIMATION_DATA).map(([key, data]) => `<option value="${key}" ${key === selectedAnimationKey ? 'selected' : ''}>${data.name || key}</option>`).join('')}
        </select>
      </label>
      <div class="editor-grid editor-grid--buttons">
        <button type="button" data-editor-action="newAnimation">New Animation</button>
        <button type="button" data-editor-action="renameAnimation">Rename Animation</button>
        <button type="button" data-editor-action="deleteAnimation">Delete Animation</button>
        <button type="button" data-editor-action="duplicateAnimation">Duplicate Animation</button>
      </div>
    </section>
    <section class="editor-section">
      <h3>Timeline</h3>
      <div class="timeline-readout"><span data-editor="timeDisplay">${editorCurrentTime.toFixed(2)}s</span> / ${animation.duration.toFixed(2)}s</div>
      <div class="timeline" data-editor="timeline">
        <div class="timeline-ruler" data-editor="ruler"></div>
        <div class="timeline-markers" data-editor="markers"></div>
        <div class="timeline-playhead" data-editor="playhead"></div>
      </div>
      <div class="editor-grid">
        <label>Duration <input type="number" step="0.1" min="0.1" value="${animation.duration}" data-editor="duration" /></label>
        <label>Zoom <input type="range" min="1" max="5" step="0.25" value="${editorZoom}" data-editor="zoom" /></label>
        <label class="editor-check"><input type="checkbox" ${animation.loop ? 'checked' : ''} data-editor="loop" /> Loop</label>
      </div>
      <div class="editor-grid editor-grid--buttons">
        <button type="button" data-editor-action="play">Play</button>
        <button type="button" data-editor-action="pause">Pause</button>
        <button type="button" data-editor-action="stop">Stop</button>
      </div>
    </section>
    <section class="editor-section">
      <h3>Part</h3>
      <label>Selected part
        <select data-editor="partSelect">
          ${PART_NAMES.map((partName) => `<option value="${partName}" ${partName === editorSelectedPart ? 'selected' : ''}>${partName}</option>`).join('')}
        </select>
      </label>
    </section>
    <section class="editor-section">
      <h3>Transform</h3>
      <label>Ease
        <select data-editor="ease">
          ${EASE_OPTIONS.map((ease) => `<option value="${ease}">${ease}</option>`).join('')}
        </select>
      </label>
      <div class="transform-fields" data-editor="transformFields"></div>
    </section>
    <section class="editor-section">
      <h3>Keyframes</h3>
      <div class="editor-grid editor-grid--buttons">
        <button type="button" data-editor-action="addKeyframe">Add Keyframe</button>
        <button type="button" data-editor-action="updateKeyframe">Update Keyframe</button>
        <button type="button" data-editor-action="deleteKeyframe">Delete Keyframe</button>
        <button type="button" data-editor-action="copyKeyframe">Copy Keyframe</button>
        <button type="button" data-editor-action="pasteKeyframe">Paste Keyframe</button>
      </div>
      <div class="keyframe-list" data-editor="keyframeList"></div>
    </section>
    <section class="editor-section">
      <h3>Preview</h3>
      <label class="editor-check"><input type="checkbox" ${editorRecordMode ? 'checked' : ''} data-editor="record" /> Record Mode</label>
      <label class="editor-check"><input type="checkbox" ${editorOnionSkin ? 'checked' : ''} data-editor="onion" /> Onion Skin</label>
      <div class="editor-grid editor-grid--buttons">
        <button type="button" data-editor-action="resetPart">Reset Current Part to Base Pose</button>
        <button type="button" data-editor-action="resetFrame">Reset Entire Frame to Base Pose</button>
        <button type="button" data-editor-action="clearAnimation">Clear Current Animation</button>
      </div>
    </section>
    <section class="editor-section">
      <h3>Import / Export</h3>
      <div class="editor-grid editor-grid--buttons">
        <button type="button" data-editor-action="copyJson">Copy Animation JSON</button>
        <button type="button" data-editor-action="copyGsap">Copy GSAP Code</button>
        <button type="button" data-editor-action="downloadJson">Download Animation JSON</button>
        <button type="button" data-editor-action="importJson">Import Animation JSON</button>
        <button type="button" data-editor-action="clearSaved">Clear Saved Animation Data</button>
      </div>
      <textarea data-editor="importText" placeholder="Paste animation JSON here to import"></textarea>
    </section>
  `;
  renderTransformControls();
  renderTimelineRuler();
  renderTimelineMarkers();
  renderKeyframeList();
  updatePlayhead();
  updateSelectedHighlightForEditor();
}

function renderTransformControls() {
  const fields = animationPanelBody.querySelector('[data-editor="transformFields"]');
  fields.innerHTML = '';
  editorInputs.clear();
  const values = getPartValues(editorSelectedPart);
  EDITOR_FIELDS.forEach((field) => {
    const label = document.createElement('label');
    label.textContent = field;
    const number = document.createElement('input');
    number.type = 'number';
    number.step = field.includes('scale') || field.includes('Origin') || field === 'opacity' ? '0.01' : '1';
    number.value = values[field];
    number.dataset.editorTransform = field;
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.step = number.step;
    slider.min = field === 'opacity' ? 0 : field.includes('scale') ? 0 : field.includes('Origin') ? 0 : -300;
    slider.max = field === 'opacity' ? 1 : field.includes('scale') ? 3 : field.includes('Origin') ? 100 : 300;
    slider.value = values[field];
    slider.dataset.editorTransform = field;
    label.append(number, slider);
    fields.appendChild(label);
    editorInputs.set(field, [number, slider]);
  });
}

function renderTimelineRuler() {
  const ruler = animationPanelBody.querySelector('[data-editor="ruler"]');
  const animation = getCurrentAnimation();
  const ticks = Math.max(2, Math.ceil(animation.duration * editorZoom));
  ruler.innerHTML = Array.from({ length: ticks + 1 }, (_, index) => {
    const time = (animation.duration / ticks) * index;
    return `<span style="left:${(index / ticks) * 100}%">${time.toFixed(1)}</span>`;
  }).join('');
}

function renderTimelineMarkers() {
  if (!animationPanelBody) return;
  const markers = animationPanelBody.querySelector('[data-editor="markers"]');
  if (!markers) return;
  const animation = getCurrentAnimation();
  markers.innerHTML = animation.keyframes.map((keyframe) => {
    const left = (keyframe.time / animation.duration) * 100;
    return `<button type="button" class="timeline-marker ${keyframe.id === selectedKeyframeId ? 'is-selected' : ''}" data-keyframe-id="${keyframe.id}" style="left:${left}%" title="${keyframe.part} ${keyframe.time.toFixed(2)}s"></button>`;
  }).join('');
}

function updatePlayhead() {
  if (!animationPanelBody) return;
  const animation = getCurrentAnimation();
  const playhead = animationPanelBody.querySelector('[data-editor="playhead"]');
  const timeDisplay = animationPanelBody.querySelector('[data-editor="timeDisplay"]');
  if (playhead) playhead.style.left = `${(editorCurrentTime / animation.duration) * 100}%`;
  if (timeDisplay) timeDisplay.textContent = `${editorCurrentTime.toFixed(2)}s`;
}

// ==================================================
// keyframe editing
// ==================================================
function getEditableValuesForSelectedPart() {
  const values = getPartValues(editorSelectedPart);
  return EDITOR_FIELDS.reduce((acc, field) => {
    acc[field] = Number(values[field]);
    return acc;
  }, {});
}

function findKeyframeAt(partName, time) {
  return getCurrentAnimation().keyframes.find((keyframe) => keyframe.part === partName && Math.abs(keyframe.time - time) < 0.001);
}

function upsertKeyframe() {
  const animation = getCurrentAnimation();
  const existing = findKeyframeAt(editorSelectedPart, editorCurrentTime);
  const ease = animationPanelBody.querySelector('[data-editor="ease"]')?.value || 'sine.inOut';
  const data = {
    id: existing?.id || makeKeyframeId(),
    time: Number(editorCurrentTime.toFixed(3)),
    part: editorSelectedPart,
    values: getEditableValuesForSelectedPart(),
    ease,
  };
  if (existing) Object.assign(existing, data);
  else animation.keyframes.push(data);
  selectedKeyframeId = data.id;
  sortKeyframes(animation);
  saveAnimationData();
  renderTimelineMarkers();
  renderKeyframeList();
}

function updateSelectedKeyframe() {
  const keyframe = getSelectedKeyframe();
  if (!keyframe) return upsertKeyframe();
  keyframe.time = Number(editorCurrentTime.toFixed(3));
  keyframe.part = editorSelectedPart;
  keyframe.values = getEditableValuesForSelectedPart();
  keyframe.ease = animationPanelBody.querySelector('[data-editor="ease"]')?.value || keyframe.ease;
  sortKeyframes(getCurrentAnimation());
  saveAnimationData();
  renderTimelineMarkers();
  renderKeyframeList();
}

function deleteSelectedKeyframe() {
  const animation = getCurrentAnimation();
  animation.keyframes = animation.keyframes.filter((keyframe) => keyframe.id !== selectedKeyframeId);
  selectedKeyframeId = null;
  saveAnimationData();
  renderTimelineMarkers();
  renderKeyframeList();
}

function copySelectedKeyframe() {
  const keyframe = getSelectedKeyframe();
  if (keyframe) copiedKeyframe = structuredClone(keyframe);
}

function pasteKeyframe() {
  if (!copiedKeyframe) return;
  const clone = structuredClone(copiedKeyframe);
  clone.id = makeKeyframeId();
  clone.time = Number(editorCurrentTime.toFixed(3));
  clone.part = editorSelectedPart;
  getCurrentAnimation().keyframes.push(clone);
  selectedKeyframeId = clone.id;
  sortKeyframes(getCurrentAnimation());
  saveAnimationData();
  renderTimelineMarkers();
  renderKeyframeList();
}

function getSelectedKeyframe() {
  return getCurrentAnimation().keyframes.find((keyframe) => keyframe.id === selectedKeyframeId);
}

function sortKeyframes(animation) {
  animation.keyframes.sort((a, b) => a.time - b.time || a.part.localeCompare(b.part));
}

function selectKeyframe(id) {
  const keyframe = getCurrentAnimation().keyframes.find((item) => item.id === id);
  if (!keyframe) return;
  selectedKeyframeId = id;
  editorCurrentTime = keyframe.time;
  editorSelectedPart = keyframe.part;
  setPartValues(editorSelectedPart, keyframe.values);
  renderAnimationEditor();
  previewAtTime(editorCurrentTime);
}

function renderKeyframeList() {
  const list = animationPanelBody.querySelector('[data-editor="keyframeList"]');
  const grouped = PART_NAMES.map((partName) => {
    const keyframes = getCurrentAnimation().keyframes.filter((keyframe) => keyframe.part === partName);
    if (!keyframes.length) return '';
    return `<div class="keyframe-group"><strong>${partName}</strong>${keyframes.map((keyframe) => `<button type="button" class="keyframe-item ${keyframe.id === selectedKeyframeId ? 'is-selected' : ''}" data-keyframe-id="${keyframe.id}">${keyframe.time.toFixed(2)}s · ${keyframe.ease}</button>`).join('')}</div>`;
  }).join('');
  list.innerHTML = grouped || '<p class="empty-state">No keyframes yet.</p>';
}

// ==================================================
// preview interpolation
// ==================================================
function easeRatio(easeName, ratio) {
  if (easeName === 'none') return ratio >= 1 ? 1 : 0;
  const ease = gsap.parseEase(easeName === 'linear' ? 'none' : easeName) || gsap.parseEase('none');
  return ease(ratio);
}

function interpolateValues(fromValues, toValues, ratio, easeName) {
  const eased = easeRatio(easeName, ratio);
  const output = {};
  EDITOR_FIELDS.forEach((field) => {
    const from = Number(fromValues[field] ?? 0);
    const to = Number(toValues[field] ?? from);
    output[field] = from + (to - from) * eased;
  });
  return output;
}

function getPoseForPartAtTime(partName, time) {
  const animation = getCurrentAnimation();
  const partKeyframes = animation.keyframes.filter((keyframe) => keyframe.part === partName).sort((a, b) => a.time - b.time);
  if (!partKeyframes.length) return getBaseTransform(partName);
  if (partKeyframes.length === 1) return partKeyframes[0].values;
  if (time <= partKeyframes[0].time) {
    if (!animation.loop) return partKeyframes[0].values;
    const previous = partKeyframes.at(-1);
    const span = animation.duration - previous.time + partKeyframes[0].time;
    const ratio = span ? (time + animation.duration - previous.time) / span : 1;
    return interpolateValues(previous.values, partKeyframes[0].values, ratio, partKeyframes[0].ease);
  }
  for (let index = 1; index < partKeyframes.length; index += 1) {
    const previous = partKeyframes[index - 1];
    const next = partKeyframes[index];
    if (time <= next.time) {
      const ratio = (time - previous.time) / (next.time - previous.time || 1);
      return interpolateValues(previous.values, next.values, ratio, next.ease);
    }
  }
  if (!animation.loop) return partKeyframes.at(-1).values;
  const previous = partKeyframes.at(-1);
  const next = partKeyframes[0];
  const span = animation.duration - previous.time + next.time;
  const ratio = span ? (time - previous.time) / span : 1;
  return interpolateValues(previous.values, next.values, ratio, next.ease);
}

function previewAtTime(time) {
  const animation = getCurrentAnimation();
  editorCurrentTime = Math.max(0, Math.min(animation.duration, time));
  PART_NAMES.forEach((partName) => {
    const values = getPoseForPartAtTime(partName, editorCurrentTime);
    currentEditorValues[partName] = { ...values };
    applyEditorValues(partName, values);
  });
  refreshEditorTransformInputs();
  updatePlayhead();
  renderOnionSkin();
}

function refreshEditorTransformInputs() {
  if (!editorInputs.size) return;
  const values = getPartValues(editorSelectedPart);
  editorInputs.forEach((inputs, field) => inputs.forEach((input) => { input.value = values[field]; }));
}

// ==================================================
// playback
// ==================================================
function playEditorAnimation() {
  pauseAnimations();
  editorIsPlaying = true;
  editorPlayStart = performance.now();
  editorPlayStartTime = editorCurrentTime;
  cancelAnimationFrame(editorRafId);
  editorRafId = requestAnimationFrame(tickEditorPlayback);
}

function tickEditorPlayback(now) {
  if (!editorIsPlaying) return;
  const animation = getCurrentAnimation();
  const elapsed = (now - editorPlayStart) / 1000;
  let nextTime = editorPlayStartTime + elapsed;
  if (animation.loop) nextTime %= animation.duration;
  if (!animation.loop && nextTime >= animation.duration) {
    nextTime = animation.duration;
    pauseEditorAnimation();
  }
  previewAtTime(nextTime);
  if (editorIsPlaying) editorRafId = requestAnimationFrame(tickEditorPlayback);
}

function pauseEditorAnimation() {
  editorIsPlaying = false;
  cancelAnimationFrame(editorRafId);
}

function stopEditorAnimation() {
  pauseEditorAnimation();
  previewAtTime(0);
}

// ==================================================
// onion skin
// ==================================================
function renderOnionSkin() {
  onionLayer.innerHTML = '';
  if (!editorOnionSkin) return;
  const animation = getCurrentAnimation();
  const keyframes = animation.keyframes.filter((keyframe) => keyframe.part === editorSelectedPart).sort((a, b) => a.time - b.time);
  const previous = [...keyframes].reverse().find((keyframe) => keyframe.time < editorCurrentTime) || (animation.loop ? keyframes.at(-1) : null);
  const next = keyframes.find((keyframe) => keyframe.time > editorCurrentTime) || (animation.loop ? keyframes[0] : null);
  [previous, next].filter(Boolean).forEach((keyframe, index) => {
    const source = partElements[keyframe.part];
    const clone = source.cloneNode(true);
    clone.className = 'onion-clone';
    clone.style.opacity = index === 0 ? '0.25' : '0.18';
    onionLayer.appendChild(clone);
    gsap.set(clone, {
      position: 'absolute',
      left: ROBOT_CONFIG[keyframe.part].left,
      top: ROBOT_CONFIG[keyframe.part].top,
      width: ROBOT_CONFIG[keyframe.part].width,
      zIndex: 50 + index,
      x: keyframe.values.x,
      y: keyframe.values.y,
      rotate: keyframe.values.rotate,
      scale: keyframe.values.scale,
      scaleX: keyframe.values.scaleX,
      scaleY: keyframe.values.scaleY,
      transformOrigin: joinTransformOrigin(keyframe.values.transformOriginX, keyframe.values.transformOriginY),
    });
  });
}

// ==================================================
// import/export
// ==================================================
function formatAnimationJson() {
  return `const ANIMATION_DATA = ${JSON.stringify(ANIMATION_DATA, null, 2).replace(/"([^"\\]+)":/g, '$1:')};`;
}

function buildGsapCode() {
  const animation = getCurrentAnimation();
  const functionName = `build${(animation.name || selectedAnimationKey).replace(/[^a-z0-9]/gi, '')}Timeline`;
  const lines = [`function ${functionName}() {`, `  const timeline = gsap.timeline({ repeat: ${animation.loop ? -1 : 0} });`, ''];
  animation.keyframes.forEach((keyframe) => {
    const values = { ...keyframe.values };
    delete values.transformOriginX;
    delete values.transformOriginY;
    values.transformOrigin = joinTransformOrigin(keyframe.values.transformOriginX, keyframe.values.transformOriginY);
    values.duration = keyframe.time;
    if (keyframe.ease !== 'none') values.ease = keyframe.ease;
    lines.push(`  timeline.to(partElements.${keyframe.part}, ${JSON.stringify(values, null, 4)}, ${keyframe.time});`);
  });
  lines.push('', '  return timeline;', '}');
  return lines.join('\n');
}

async function copyText(text) {
  console.log(text);
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.warn('Clipboard copy failed; output was logged to console.', error);
  }
}

function downloadAnimationJson() {
  const blob = new Blob([JSON.stringify(ANIMATION_DATA, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'robot-animation-data.json';
  anchor.click();
  URL.revokeObjectURL(url);
}

function importAnimationJson() {
  const text = animationPanelBody.querySelector('[data-editor="importText"]').value.trim();
  if (!text) return;
  const cleaned = text.replace(/^const\s+ANIMATION_DATA\s*=\s*/, '').replace(/;$/, '');
  const parsed = JSON.parse(cleaned);
  Object.keys(ANIMATION_DATA).forEach((key) => delete ANIMATION_DATA[key]);
  Object.assign(ANIMATION_DATA, parsed);
  selectedAnimationKey = Object.keys(ANIMATION_DATA)[0];
  saveAnimationData();
  renderAnimationEditor();
  previewAtTime(0);
}

function clearCurrentAnimation() {
  if (!confirm('Clear all keyframes in the current animation?')) return;
  getCurrentAnimation().keyframes = [];
  selectedKeyframeId = null;
  saveAnimationData();
  renderAnimationEditor();
  previewAtTime(0);
}

function resetCurrentPartToBase() {
  setPartValues(editorSelectedPart, getBaseTransform(editorSelectedPart));
  refreshEditorTransformInputs();
  if (editorRecordMode) upsertKeyframe();
}

function resetEntireFrameToBase() {
  PART_NAMES.forEach((partName) => setPartValues(partName, getBaseTransform(partName)));
  refreshEditorTransformInputs();
  renderOnionSkin();
}

function updateSelectedHighlightForEditor() {
  PART_NAMES.forEach((partName) => partElements[partName].classList.toggle('animation-selected', partName === editorSelectedPart));
}

function setTimelineTimeFromPointer(event) {
  const timeline = animationPanelBody.querySelector('[data-editor="timeline"]');
  const rect = timeline.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  previewAtTime(ratio * getCurrentAnimation().duration);
}

function handleMarkerDrag(marker, pointerDownEvent) {
  pointerDownEvent.preventDefault();
  const keyframe = getCurrentAnimation().keyframes.find((item) => item.id === marker.dataset.keyframeId);
  const move = (event) => {
    const timeline = animationPanelBody.querySelector('[data-editor="timeline"]');
    const rect = timeline.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    keyframe.time = Number((ratio * getCurrentAnimation().duration).toFixed(3));
    selectedKeyframeId = keyframe.id;
    editorCurrentTime = keyframe.time;
    sortKeyframes(getCurrentAnimation());
    renderTimelineMarkers();
    renderKeyframeList();
    updatePlayhead();
  };
  const up = () => {
    saveAnimationData();
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

function handleAnimationEditorClick(event) {
  const actionButton = event.target.closest('[data-editor-action]');
  const marker = event.target.closest('.timeline-marker');
  const keyframeButton = event.target.closest('.keyframe-item');
  if (marker) return selectKeyframe(marker.dataset.keyframeId);
  if (keyframeButton) return selectKeyframe(keyframeButton.dataset.keyframeId);
  if (!actionButton) return;
  const actions = {
    togglePanel: () => animationEditor.classList.toggle('is-collapsed'),
    newAnimation: () => {
      const name = prompt('Animation name?', 'New Animation');
      if (!name) return;
      const key = makeAnimationKey(name);
      ANIMATION_DATA[key] = { name, duration: 2, loop: false, keyframes: [] };
      selectedAnimationKey = key;
      saveAnimationData();
      renderAnimationEditor();
    },
    renameAnimation: () => {
      const name = prompt('New animation name?', getCurrentAnimation().name);
      if (!name) return;
      getCurrentAnimation().name = name;
      saveAnimationData();
      renderAnimationEditor();
    },
    deleteAnimation: () => {
      if (Object.keys(ANIMATION_DATA).length <= 1 || !confirm('Delete this animation?')) return;
      delete ANIMATION_DATA[selectedAnimationKey];
      selectedAnimationKey = Object.keys(ANIMATION_DATA)[0];
      saveAnimationData();
      renderAnimationEditor();
    },
    duplicateAnimation: () => {
      const source = structuredClone(getCurrentAnimation());
      source.name = `${source.name} Copy`;
      const key = makeAnimationKey(source.name);
      ANIMATION_DATA[key] = source;
      selectedAnimationKey = key;
      saveAnimationData();
      renderAnimationEditor();
    },
    play: playEditorAnimation,
    pause: pauseEditorAnimation,
    stop: stopEditorAnimation,
    addKeyframe: upsertKeyframe,
    updateKeyframe: updateSelectedKeyframe,
    deleteKeyframe: deleteSelectedKeyframe,
    copyKeyframe: copySelectedKeyframe,
    pasteKeyframe,
    resetPart: resetCurrentPartToBase,
    resetFrame: resetEntireFrameToBase,
    clearAnimation: clearCurrentAnimation,
    copyJson: () => copyText(formatAnimationJson()),
    copyGsap: () => copyText(buildGsapCode()),
    downloadJson: downloadAnimationJson,
    importJson: importAnimationJson,
    clearSaved: clearSavedAnimationData,
  };
  actions[actionButton.dataset.editorAction]?.();
}

function handleAnimationEditorInput(event) {
  const transformInput = event.target.closest('[data-editor-transform]');
  if (!transformInput) return;
  pauseEditorAnimation();
  const field = transformInput.dataset.editorTransform;
  setPartValues(editorSelectedPart, { [field]: Number(transformInput.value) });
  refreshEditorTransformInputs();
  renderOnionSkin();
  if (editorRecordMode) upsertKeyframe();
}

function handleAnimationEditorChange(event) {
  const target = event.target;
  if (target.matches('[data-editor="animationSelect"]')) {
    selectedAnimationKey = target.value;
    editorCurrentTime = 0;
    selectedKeyframeId = null;
    renderAnimationEditor();
    previewAtTime(0);
  }
  if (target.matches('[data-editor="partSelect"]')) {
    editorSelectedPart = target.value;
    renderTransformControls();
    updateSelectedHighlightForEditor();
    renderOnionSkin();
  }
  if (target.matches('[data-editor="duration"]')) {
    getCurrentAnimation().duration = Math.max(0.1, Number(target.value));
    saveAnimationData();
    renderTimelineRuler();
    renderTimelineMarkers();
    updatePlayhead();
  }
  if (target.matches('[data-editor="zoom"]')) {
    editorZoom = Number(target.value);
    renderTimelineRuler();
  }
  if (target.matches('[data-editor="loop"]')) {
    getCurrentAnimation().loop = target.checked;
    saveAnimationData();
  }
  if (target.matches('[data-editor="record"]')) {
    editorRecordMode = target.checked;
    renderAnimationEditor();
  }
  if (target.matches('[data-editor="onion"]')) {
    editorOnionSkin = target.checked;
    renderOnionSkin();
  }
}

function handleAnimationEditorKeyboard(event) {
  if (!ANIMATION_EDITOR_ENABLED) return;
  const isTyping = ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName);
  if (isTyping) return;
  const moveAmount = event.shiftKey ? 10 : 1;
  const timeAmount = event.shiftKey ? 0.5 : 0.05;
  const rotateAmount = event.shiftKey ? 5 : 1;
  if (event.key === 'Enter') {
    const keyframeElement = document.activeElement?.closest?.('[data-keyframe-id]');
    if (keyframeElement) {
      event.preventDefault();
      return selectKeyframe(keyframeElement.dataset.keyframeId);
    }
  }
  const actions = {
    ' ': () => (editorIsPlaying ? pauseEditorAnimation() : playEditorAnimation()),
    ArrowLeft: () => previewAtTime(editorCurrentTime - timeAmount),
    ArrowRight: () => previewAtTime(editorCurrentTime + timeAmount),
    ArrowUp: () => setPartValues(editorSelectedPart, { y: getPartValues(editorSelectedPart).y - moveAmount }),
    ArrowDown: () => setPartValues(editorSelectedPart, { y: getPartValues(editorSelectedPart).y + moveAmount }),
    a: () => setPartValues(editorSelectedPart, { x: getPartValues(editorSelectedPart).x - moveAmount }),
    d: () => setPartValues(editorSelectedPart, { x: getPartValues(editorSelectedPart).x + moveAmount }),
    '[': () => setPartValues(editorSelectedPart, { rotate: getPartValues(editorSelectedPart).rotate - rotateAmount }),
    ']': () => setPartValues(editorSelectedPart, { rotate: getPartValues(editorSelectedPart).rotate + rotateAmount }),
    k: upsertKeyframe,
    Delete: deleteSelectedKeyframe,
    Tab: () => {
      const next = PART_NAMES[(PART_NAMES.indexOf(editorSelectedPart) + 1) % PART_NAMES.length];
      editorSelectedPart = next;
      renderTransformControls();
      updateSelectedHighlightForEditor();
    },
  };
  const action = actions[event.key] || actions[event.key.toLowerCase?.()];
  if (!action) return;
  event.preventDefault();
  pauseEditorAnimation();
  action();
  refreshEditorTransformInputs();
  renderOnionSkin();
  if (editorRecordMode && ['ArrowUp', 'ArrowDown', 'a', 'd', '[', ']'].includes(event.key.toLowerCase?.() || event.key)) upsertKeyframe();
}

function bindTimelinePointer() {
  animationEditor.addEventListener('pointerdown', (event) => {
    const marker = event.target.closest('.timeline-marker');
    if (marker) return handleMarkerDrag(marker, event);
    if (!event.target.closest('[data-editor="timeline"]')) return;
    pauseEditorAnimation();
    setTimelineTimeFromPointer(event);
    const move = (moveEvent) => setTimelineTimeFromPointer(moveEvent);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
}


// ==================================================
// UX upgrade: scroll-safe editor, resizable panel, track timeline
// ==================================================
const ANIMATION_EDITOR_WIDTH_KEY = 'robotAnimationEditorWidth';
const MIN_EDITOR_WIDTH = 420;
const MAX_EDITOR_WIDTH = 720;
let editorTrackFilter = 'all';
let editorSnap = 0;
let lastEditorScrollState = null;
let cachedTimelineDrag = null;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getPixelsPerSecond() {
  return 160 * editorZoom;
}

function getVisibleParts() {
  if (editorTrackFilter === 'selected') return [editorSelectedPart];
  if (editorTrackFilter === 'nonempty') {
    const partsWithKeys = new Set(getCurrentAnimation().keyframes.map((keyframe) => keyframe.part));
    return PART_NAMES.filter((partName) => partsWithKeys.has(partName));
  }
  return PART_NAMES;
}

function snapTime(time) {
  if (!editorSnap) return Number(time.toFixed(3));
  return Number((Math.round(time / editorSnap) * editorSnap).toFixed(3));
}

function saveEditorScrollState() {
  return {
    panelScrollTop: animationEditor?.scrollTop || 0,
    keyframeListScrollTop: animationPanelBody?.querySelector('[data-editor="keyframeList"]')?.scrollTop || 0,
    timelineScrollLeft: animationPanelBody?.querySelector('[data-editor="timelineScroll"]')?.scrollLeft || 0,
  };
}

function restoreEditorScrollState(state = lastEditorScrollState) {
  if (!state) return;
  requestAnimationFrame(() => {
    if (animationEditor) animationEditor.scrollTop = state.panelScrollTop;
    const keyframeList = animationPanelBody?.querySelector('[data-editor="keyframeList"]');
    const timelineScroll = animationPanelBody?.querySelector('[data-editor="timelineScroll"]');
    if (keyframeList) keyframeList.scrollTop = state.keyframeListScrollTop;
    if (timelineScroll) timelineScroll.scrollLeft = state.timelineScrollLeft;
  });
}

function withEditorScrollPreserved(callback) {
  lastEditorScrollState = saveEditorScrollState();
  callback();
  restoreEditorScrollState(lastEditorScrollState);
}

function setEditorWidth(width) {
  const nextWidth = clamp(width, MIN_EDITOR_WIDTH, MAX_EDITOR_WIDTH);
  document.documentElement.style.setProperty('--animation-editor-width', `${nextWidth}px`);
  localStorage.setItem(ANIMATION_EDITOR_WIDTH_KEY, String(nextWidth));
}

function installEditorResizeHandle() {
  const handle = animationEditor.querySelector('[data-editor-resize]');
  if (!handle) return;
  handle.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    handle.setPointerCapture(event.pointerId);
    const move = (moveEvent) => setEditorWidth(window.innerWidth - moveEvent.clientX - 16);
    const up = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', up);
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
  });
}

function createAnimationEditor() {
  document.body.classList.add('animation-editor-enabled');
  const savedWidth = Number(localStorage.getItem(ANIMATION_EDITOR_WIDTH_KEY));
  if (savedWidth) setEditorWidth(savedWidth);
  animationEditor = document.createElement('aside');
  animationEditor.className = 'animation-editor';
  animationEditor.setAttribute('aria-label', 'Animation editor');
  animationEditor.innerHTML = `
    <div class="animation-editor__resize" data-editor-resize aria-hidden="true"></div>
    <div class="animation-editor__header">
      <h2>Animation Editor</h2>
      <button type="button" data-editor-action="togglePanel" aria-label="Hide or show animation editor body">Hide</button>
    </div>
    <div class="animation-editor__body"></div>
  `;
  document.body.appendChild(animationEditor);
  animationPanelBody = animationEditor.querySelector('.animation-editor__body');
  animationEditor.addEventListener('click', handleAnimationEditorClick);
  animationEditor.addEventListener('input', handleAnimationEditorInput);
  animationEditor.addEventListener('change', handleAnimationEditorChange);
  window.addEventListener('keydown', handleAnimationEditorKeyboard);
  window.addEventListener('resize', () => withEditorScrollPreserved(() => {
    renderTimelineRuler();
    renderTimelineMarkers();
    updatePlayhead();
  }));
  onionLayer.className = 'onion-layer';
  robot.appendChild(onionLayer);
  installEditorResizeHandle();
  renderAnimationEditor();
}

function sectionMarkup(title, id, content, open = false, extraClass = '') {
  return `<details class="editor-section ${extraClass}" data-editor-section="${id}" ${open ? 'open' : ''}>
    <summary>${title}</summary>
    <div class="editor-section__content">${content}</div>
  </details>`;
}

function renderAnimationEditor() {
  const state = saveEditorScrollState();
  const animation = getCurrentAnimation();
  animationPanelBody.innerHTML = `
    ${sectionMarkup('Animation', 'animation', `
      <span class="recording-indicator ${editorRecordMode ? 'is-recording' : ''}">RECORDING</span>
      <label>Animation
        <select data-editor="animationSelect">
          ${Object.entries(ANIMATION_DATA).map(([key, data]) => `<option value="${key}" ${key === selectedAnimationKey ? 'selected' : ''}>${data.name || key}</option>`).join('')}
        </select>
      </label>
      <div class="editor-grid editor-grid--buttons">
        <button type="button" data-editor-action="newAnimation">New Animation</button>
        <button type="button" data-editor-action="renameAnimation">Rename Animation</button>
        <button type="button" data-editor-action="deleteAnimation">Delete Animation</button>
        <button type="button" data-editor-action="duplicateAnimation">Duplicate Animation</button>
      </div>
    `, true)}
    ${sectionMarkup('Timeline', 'timeline', `
      <div class="timeline-readout"><span data-editor="timeDisplay">${editorCurrentTime.toFixed(2)}s</span> / ${animation.duration.toFixed(2)}s</div>
      <div class="editor-grid editor-grid--timeline-controls">
        <label>Duration <input type="number" step="0.1" min="0.1" value="${animation.duration}" data-editor="duration" /></label>
        <label>Zoom <input type="range" min="0.5" max="8" step="0.25" value="${editorZoom}" data-editor="zoom" /></label>
        <label>Tracks
          <select data-editor="trackFilter">
            <option value="all" ${editorTrackFilter === 'all' ? 'selected' : ''}>Show all tracks</option>
            <option value="selected" ${editorTrackFilter === 'selected' ? 'selected' : ''}>Show selected part only</option>
            <option value="nonempty" ${editorTrackFilter === 'nonempty' ? 'selected' : ''}>Hide empty tracks</option>
          </select>
        </label>
        <label>Snap
          <select data-editor="snap">
            ${[0, 0.01, 0.05, 0.1, 0.25, 0.5].map((value) => `<option value="${value}" ${Number(editorSnap) === value ? 'selected' : ''}>${value ? `${value}s` : 'Off'}</option>`).join('')}
          </select>
        </label>
        <label class="editor-check"><input type="checkbox" ${animation.loop ? 'checked' : ''} data-editor="loop" /> Loop</label>
      </div>
      <div class="editor-grid editor-grid--buttons">
        <button type="button" data-editor-action="zoomOut">Zoom out</button>
        <button type="button" data-editor-action="zoomIn">Zoom in</button>
        <button type="button" data-editor-action="fitTimeline">Fit animation</button>
        <button type="button" data-editor-action="play">Play</button>
        <button type="button" data-editor-action="pause">Pause</button>
        <button type="button" data-editor-action="stop">Stop</button>
      </div>
      <div class="timeline-board" data-editor="timeline">
        <div class="timeline-labels" data-editor="timelineLabels"></div>
        <div class="timeline-scroll" data-editor="timelineScroll">
          <div class="timeline-canvas" data-editor="timelineCanvas">
            <div class="timeline-ruler" data-editor="ruler"></div>
            <div class="timeline-tracks" data-editor="tracks"></div>
            <div class="timeline-playhead" data-editor="playhead"><span data-editor="playheadTime">0.00s</span></div>
          </div>
        </div>
      </div>
    `, true, 'editor-section--timeline')}
    ${sectionMarkup('Part', 'part', `
      <label>Selected part
        <select data-editor="partSelect">
          ${PART_NAMES.map((partName) => `<option value="${partName}" ${partName === editorSelectedPart ? 'selected' : ''}>${partName}</option>`).join('')}
        </select>
      </label>
    `, false)}
    ${sectionMarkup('Transform', 'transform', `
      <label>Ease
        <select data-editor="ease">
          ${EASE_OPTIONS.map((ease) => `<option value="${ease}">${ease}</option>`).join('')}
        </select>
      </label>
      <div class="transform-fields" data-editor="transformFields"></div>
    `, false)}
    ${sectionMarkup('Keyframes', 'keyframes', `
      <div class="editor-grid editor-grid--buttons">
        <button type="button" data-editor-action="addKeyframe">Add Keyframe</button>
        <button type="button" data-editor-action="updateKeyframe">Update Keyframe</button>
        <button type="button" data-editor-action="deleteKeyframe">Delete Keyframe</button>
        <button type="button" data-editor-action="copyKeyframe">Copy Keyframe</button>
        <button type="button" data-editor-action="pasteKeyframe">Paste Keyframe</button>
      </div>
      <div class="keyframe-list" data-editor="keyframeList"></div>
    `, false)}
    ${sectionMarkup('Preview', 'preview', `
      <label class="editor-check"><input type="checkbox" ${editorRecordMode ? 'checked' : ''} data-editor="record" /> Record Mode</label>
      <label class="editor-check"><input type="checkbox" ${editorOnionSkin ? 'checked' : ''} data-editor="onion" /> Onion Skin</label>
      <div class="editor-grid editor-grid--buttons">
        <button type="button" data-editor-action="resetPart">Reset Current Part to Base Pose</button>
        <button type="button" data-editor-action="resetFrame">Reset Entire Frame to Base Pose</button>
        <button type="button" data-editor-action="clearAnimation">Clear Current Animation</button>
      </div>
    `, false)}
    ${sectionMarkup('Import / Export', 'export', `
      <div class="editor-grid editor-grid--buttons">
        <button type="button" data-editor-action="copyJson">Copy Animation JSON</button>
        <button type="button" data-editor-action="copyGsap">Copy GSAP Code</button>
        <button type="button" data-editor-action="downloadJson">Download Animation JSON</button>
        <button type="button" data-editor-action="importJson">Import Animation JSON</button>
        <button type="button" data-editor-action="clearSaved">Clear Saved Animation Data</button>
      </div>
      <textarea data-editor="importText" placeholder="Paste animation JSON here to import"></textarea>
    `, false)}
  `;
  renderTransformControls();
  renderTimelineRuler();
  renderTimelineMarkers();
  renderKeyframeList();
  updatePlayhead();
  updateSelectedHighlightForEditor();
  restoreEditorScrollState(state);
}

function getTimelineMetrics() {
  const animation = getCurrentAnimation();
  const scroll = animationPanelBody?.querySelector('[data-editor="timelineScroll"]');
  const visibleWidth = scroll?.clientWidth || 1;
  const pixelsPerSecond = getPixelsPerSecond();
  const timelineWidth = Math.max(visibleWidth, animation.duration * pixelsPerSecond);
  return { animation, scroll, visibleWidth, pixelsPerSecond, timelineWidth };
}

function timeToPixel(time) {
  return time * getPixelsPerSecond();
}

function pixelToTime(pixel) {
  return snapTime(pixel / getPixelsPerSecond());
}

function renderTimelineRuler() {
  const labels = animationPanelBody.querySelector('[data-editor="timelineLabels"]');
  const ruler = animationPanelBody.querySelector('[data-editor="ruler"]');
  const canvas = animationPanelBody.querySelector('[data-editor="timelineCanvas"]');
  const tracks = animationPanelBody.querySelector('[data-editor="tracks"]');
  if (!ruler || !canvas || !tracks || !labels) return;
  const { animation, timelineWidth, pixelsPerSecond } = getTimelineMetrics();
  const visibleParts = getVisibleParts();
  canvas.style.width = `${timelineWidth}px`;
  labels.innerHTML = `<div class="timeline-label-spacer">Part</div>${visibleParts.map((partName) => `<div class="timeline-label-row">${partName}</div>`).join('')}`;
  const majorStep = 0.5;
  const minorStep = 0.1;
  const fragment = document.createDocumentFragment();
  for (let time = 0; time <= animation.duration + 0.0001; time += minorStep) {
    const tick = document.createElement('span');
    const isMajor = Math.abs((time / majorStep) - Math.round(time / majorStep)) < 0.001;
    tick.className = `timeline-tick ${isMajor ? 'is-major' : 'is-minor'}`;
    tick.style.left = `${time * pixelsPerSecond}px`;
    if (isMajor) tick.textContent = time.toFixed(1);
    fragment.appendChild(tick);
  }
  ruler.replaceChildren(fragment);
}

function renderTimelineMarkers() {
  if (!animationPanelBody) return;
  const tracks = animationPanelBody.querySelector('[data-editor="tracks"]');
  if (!tracks) return;
  const { animation, timelineWidth, pixelsPerSecond } = getTimelineMetrics();
  const visibleParts = getVisibleParts();
  const fragment = document.createDocumentFragment();
  tracks.style.width = `${timelineWidth}px`;
  visibleParts.forEach((partName, rowIndex) => {
    const row = document.createElement('div');
    row.className = 'timeline-track';
    row.dataset.part = partName;
    const keys = animation.keyframes.filter((keyframe) => keyframe.part === partName).sort((a, b) => a.time - b.time);
    let previousLeft = -Infinity;
    let stagger = 0;
    keys.forEach((keyframe) => {
      const left = keyframe.time * pixelsPerSecond;
      stagger = left - previousLeft < 10 ? stagger + 1 : 0;
      previousLeft = left;
      const marker = document.createElement('button');
      marker.type = 'button';
      marker.className = `timeline-keyframe ${keyframe.id === selectedKeyframeId ? 'is-selected' : ''}`;
      marker.dataset.keyframeId = keyframe.id;
      marker.style.left = `${left}px`;
      marker.style.top = `${50 + ((stagger % 3) - 1) * 11}%`;
      marker.title = `${keyframe.time.toFixed(2)}s · ${keyframe.part} · ${keyframe.ease}`;
      marker.setAttribute('aria-label', `Select ${keyframe.part} keyframe at ${keyframe.time.toFixed(2)} seconds using ${keyframe.ease}`);
      fragment.appendChild(row).appendChild(marker);
    });
    if (!keys.length) fragment.appendChild(row);
  });
  tracks.replaceChildren(fragment);
}

function updatePlayhead() {
  if (!animationPanelBody) return;
  const playhead = animationPanelBody.querySelector('[data-editor="playhead"]');
  const handleTime = animationPanelBody.querySelector('[data-editor="playheadTime"]');
  const timeDisplay = animationPanelBody.querySelector('[data-editor="timeDisplay"]');
  const x = timeToPixel(editorCurrentTime);
  if (playhead) playhead.style.transform = `translateX(${x}px)`;
  if (handleTime) handleTime.textContent = `${editorCurrentTime.toFixed(2)}s`;
  if (timeDisplay) timeDisplay.textContent = `${editorCurrentTime.toFixed(2)}s`;
}

function updateKeyframeSelectionClasses() {
  animationPanelBody?.querySelectorAll('[data-keyframe-id]').forEach((element) => {
    element.classList.toggle('is-selected', element.dataset.keyframeId === selectedKeyframeId);
    element.setAttribute('aria-pressed', String(element.dataset.keyframeId === selectedKeyframeId));
  });
}

function summarizeKeyframeValues(keyframe) {
  return Object.entries(keyframe.values)
    .filter(([field, value]) => Number(value) !== Number(getBaseTransform(keyframe.part)[field]))
    .map(([field]) => field)
    .slice(0, 5)
    .join(', ') || 'base pose';
}

function renderKeyframeList() {
  const list = animationPanelBody.querySelector('[data-editor="keyframeList"]');
  if (!list) return;
  const state = saveEditorScrollState();
  const fragment = document.createDocumentFragment();
  PART_NAMES.forEach((partName) => {
    const keyframes = getCurrentAnimation().keyframes.filter((keyframe) => keyframe.part === partName).sort((a, b) => a.time - b.time);
    if (!keyframes.length) return;
    const group = document.createElement('div');
    group.className = 'keyframe-group';
    group.innerHTML = `<div class="keyframe-group-header">${partName}</div>`;
    keyframes.forEach((keyframe) => {
      const row = document.createElement('div');
      row.className = `keyframe-row ${keyframe.id === selectedKeyframeId ? 'is-selected' : ''}`;
      row.dataset.keyframeId = keyframe.id;
      row.setAttribute('role', 'button');
      row.tabIndex = 0;
      row.innerHTML = `
        <span class="keyframe-selected-dot" aria-hidden="true"></span>
        <span>${keyframe.time.toFixed(2)}s</span>
        <span>${keyframe.part}</span>
        <span>${keyframe.ease}</span>
        <span class="keyframe-summary">${summarizeKeyframeValues(keyframe)}</span>
        <button type="button" data-keyframe-edit="${keyframe.id}" aria-label="Edit keyframe at ${keyframe.time.toFixed(2)} seconds">✎</button>
        <button type="button" data-keyframe-delete="${keyframe.id}" aria-label="Delete keyframe at ${keyframe.time.toFixed(2)} seconds">×</button>
      `;
      group.appendChild(row);
    });
    fragment.appendChild(group);
  });
  if (!fragment.childNodes.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'No keyframes yet.';
    fragment.appendChild(empty);
  }
  list.replaceChildren(fragment);
  restoreEditorScrollState(state);
}

function selectKeyframe(keyframeId, options = {}) {
  const state = saveEditorScrollState();
  const keyframe = getCurrentAnimation().keyframes.find((item) => item.id === keyframeId);
  if (!keyframe) return;
  selectedKeyframeId = keyframeId;
  editorCurrentTime = keyframe.time;
  editorSelectedPart = keyframe.part;
  setPartValues(editorSelectedPart, keyframe.values);
  const partSelect = animationPanelBody.querySelector('[data-editor="partSelect"]');
  if (partSelect) partSelect.value = editorSelectedPart;
  const easeSelect = animationPanelBody.querySelector('[data-editor="ease"]');
  if (easeSelect) easeSelect.value = keyframe.ease;
  refreshEditorTransformInputs();
  updatePlayhead();
  updateSelectedHighlightForEditor();
  updateKeyframeSelectionClasses();
  if (options.preview !== false) previewAtTime(editorCurrentTime);
  restoreEditorScrollState(state);
}

function fitTimelineToAnimation() {
  const state = saveEditorScrollState();
  const scroll = animationPanelBody.querySelector('[data-editor="timelineScroll"]');
  if (!scroll) return;
  editorZoom = clamp(scroll.clientWidth / (getCurrentAnimation().duration * 160), 0.5, 8);
  const zoomInput = animationPanelBody.querySelector('[data-editor="zoom"]');
  if (zoomInput) zoomInput.value = editorZoom;
  renderTimelineRuler();
  renderTimelineMarkers();
  updatePlayhead();
  restoreEditorScrollState(state);
}

function zoomTimeline(direction) {
  const state = saveEditorScrollState();
  const scroll = animationPanelBody.querySelector('[data-editor="timelineScroll"]');
  const oldPixels = timeToPixel(editorCurrentTime);
  editorZoom = clamp(editorZoom + direction * 0.25, 0.5, 8);
  const zoomInput = animationPanelBody.querySelector('[data-editor="zoom"]');
  if (zoomInput) zoomInput.value = editorZoom;
  renderTimelineRuler();
  renderTimelineMarkers();
  updatePlayhead();
  if (scroll) scroll.scrollLeft = Math.max(0, timeToPixel(editorCurrentTime) - (oldPixels - state.timelineScrollLeft));
}

function setTimelineTimeFromPointer(event) {
  const scroll = animationPanelBody.querySelector('[data-editor="timelineScroll"]');
  if (!scroll) return;
  const rect = cachedTimelineDrag?.rect || scroll.getBoundingClientRect();
  const left = event.clientX - rect.left + scroll.scrollLeft;
  previewAtTime(clamp(pixelToTime(left), 0, getCurrentAnimation().duration));
}

function handleMarkerDrag(marker, pointerDownEvent) {
  pointerDownEvent.preventDefault();
  pointerDownEvent.stopPropagation();
  marker.setPointerCapture?.(pointerDownEvent.pointerId);
  const keyframe = getCurrentAnimation().keyframes.find((item) => item.id === marker.dataset.keyframeId);
  const scroll = animationPanelBody.querySelector('[data-editor="timelineScroll"]');
  cachedTimelineDrag = { rect: scroll.getBoundingClientRect() };
  const move = (event) => {
    const left = event.clientX - cachedTimelineDrag.rect.left + scroll.scrollLeft;
    keyframe.time = clamp(pixelToTime(left), 0, getCurrentAnimation().duration);
    selectedKeyframeId = keyframe.id;
    editorCurrentTime = keyframe.time;
    sortKeyframes(getCurrentAnimation());
    renderTimelineMarkers();
    renderKeyframeList();
    updatePlayhead();
  };
  const up = () => {
    cachedTimelineDrag = null;
    saveAnimationData();
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

function handleAnimationEditorClick(event) {
  const keyframeDelete = event.target.closest('[data-keyframe-delete]');
  const keyframeEdit = event.target.closest('[data-keyframe-edit]');
  const marker = event.target.closest('.timeline-keyframe');
  const row = event.target.closest('.keyframe-row');
  if (keyframeDelete) {
    selectedKeyframeId = keyframeDelete.dataset.keyframeDelete;
    deleteSelectedKeyframe();
    return;
  }
  if (keyframeEdit) return selectKeyframe(keyframeEdit.dataset.keyframeEdit);
  if (marker) return selectKeyframe(marker.dataset.keyframeId);
  if (row) return selectKeyframe(row.dataset.keyframeId);

  const actionButton = event.target.closest('[data-editor-action]');
  if (!actionButton) return;
  const actions = {
    togglePanel: () => animationEditor.classList.toggle('is-collapsed'),
    newAnimation: () => {
      const name = prompt('Animation name?', 'New Animation');
      if (!name) return;
      const key = makeAnimationKey(name);
      ANIMATION_DATA[key] = { name, duration: 2, loop: false, keyframes: [] };
      selectedAnimationKey = key;
      saveAnimationData();
      renderAnimationEditor();
    },
    renameAnimation: () => {
      const name = prompt('New animation name?', getCurrentAnimation().name);
      if (!name) return;
      getCurrentAnimation().name = name;
      saveAnimationData();
      renderAnimationEditor();
    },
    deleteAnimation: () => {
      if (Object.keys(ANIMATION_DATA).length <= 1 || !confirm('Delete this animation?')) return;
      delete ANIMATION_DATA[selectedAnimationKey];
      selectedAnimationKey = Object.keys(ANIMATION_DATA)[0];
      saveAnimationData();
      renderAnimationEditor();
    },
    duplicateAnimation: () => {
      const source = structuredClone(getCurrentAnimation());
      source.name = `${source.name} Copy`;
      const key = makeAnimationKey(source.name);
      ANIMATION_DATA[key] = source;
      selectedAnimationKey = key;
      saveAnimationData();
      renderAnimationEditor();
    },
    play: playEditorAnimation,
    pause: pauseEditorAnimation,
    stop: stopEditorAnimation,
    zoomOut: () => zoomTimeline(-1),
    zoomIn: () => zoomTimeline(1),
    fitTimeline: fitTimelineToAnimation,
    addKeyframe: upsertKeyframe,
    updateKeyframe: updateSelectedKeyframe,
    deleteKeyframe: deleteSelectedKeyframe,
    copyKeyframe: copySelectedKeyframe,
    pasteKeyframe,
    resetPart: resetCurrentPartToBase,
    resetFrame: resetEntireFrameToBase,
    clearAnimation: clearCurrentAnimation,
    copyJson: () => copyText(formatAnimationJson()),
    copyGsap: () => copyText(buildGsapCode()),
    downloadJson: downloadAnimationJson,
    importJson: importAnimationJson,
    clearSaved: clearSavedAnimationData,
  };
  actions[actionButton.dataset.editorAction]?.();
}

function handleAnimationEditorChange(event) {
  const target = event.target;
  if (target.matches('[data-editor="animationSelect"]')) {
    selectedAnimationKey = target.value;
    editorCurrentTime = 0;
    selectedKeyframeId = null;
    renderAnimationEditor();
    previewAtTime(0);
  }
  if (target.matches('[data-editor="partSelect"]')) {
    editorSelectedPart = target.value;
    withEditorScrollPreserved(() => {
      renderTransformControls();
      updateSelectedHighlightForEditor();
      renderTimelineRuler();
      renderTimelineMarkers();
      renderOnionSkin();
    });
  }
  if (target.matches('[data-editor="duration"]')) {
    const state = saveEditorScrollState();
    getCurrentAnimation().duration = Math.max(0.1, Number(target.value));
    editorCurrentTime = clamp(editorCurrentTime, 0, getCurrentAnimation().duration);
    saveAnimationData();
    renderTimelineRuler();
    renderTimelineMarkers();
    updatePlayhead();
    restoreEditorScrollState(state);
  }
  if (target.matches('[data-editor="zoom"]')) {
    const state = saveEditorScrollState();
    editorZoom = Number(target.value);
    renderTimelineRuler();
    renderTimelineMarkers();
    updatePlayhead();
    restoreEditorScrollState(state);
  }
  if (target.matches('[data-editor="trackFilter"]')) {
    editorTrackFilter = target.value;
    withEditorScrollPreserved(() => {
      renderTimelineRuler();
      renderTimelineMarkers();
      updatePlayhead();
    });
  }
  if (target.matches('[data-editor="snap"]')) editorSnap = Number(target.value);
  if (target.matches('[data-editor="loop"]')) {
    getCurrentAnimation().loop = target.checked;
    saveAnimationData();
  }
  if (target.matches('[data-editor="record"]')) {
    editorRecordMode = target.checked;
    const indicator = animationPanelBody.querySelector('.recording-indicator');
    indicator?.classList.toggle('is-recording', editorRecordMode);
  }
  if (target.matches('[data-editor="onion"]')) {
    editorOnionSkin = target.checked;
    renderOnionSkin();
  }
}

function bindTimelinePointer() {
  animationEditor.addEventListener('pointerdown', (event) => {
    const marker = event.target.closest('.timeline-keyframe');
    if (marker) return handleMarkerDrag(marker, event);
    const scroll = event.target.closest('[data-editor="timelineScroll"]');
    if (!scroll) return;
    pauseEditorAnimation();
    cachedTimelineDrag = { rect: scroll.getBoundingClientRect() };
    setTimelineTimeFromPointer(event);
    const move = (moveEvent) => setTimelineTimeFromPointer(moveEvent);
    const up = () => {
      cachedTimelineDrag = null;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
}

animationEditor?.remove();
if (ANIMATION_EDITOR_ENABLED) {
  pauseAnimations();
  syncEditorValuesFromBase();
  createAnimationEditor();
  bindTimelinePointer();
  previewAtTime(0);
}
