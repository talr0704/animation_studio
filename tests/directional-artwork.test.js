const { existsSync, readFileSync } = require('node:fs');
const test = require('node:test');
const assert = require('node:assert/strict');

const script = readFileSync(`${__dirname}/../script.js`, 'utf8');

const directionalParts = ['body', 'head', 'leftleg', 'lhand', 'rhand', 'rightleg'];

test('contains a left-facing illustration for every robot part', () => {
  directionalParts.forEach((partName) => {
    assert.equal(existsSync(`${__dirname}/../images/${partName}_turn_left.svg`), true, partName);
    assert.match(script, new RegExp(`images/${partName}_turn_left\\.svg`));
  });
});

test('changes every part source through one direction helper', () => {
  const facingHelper = script.match(/function setRobotFacing\(direction\) \{[\s\S]*?\n\}/)?.[0] ?? '';

  assert.match(facingHelper, /ROBOT_PART_SOURCES\[direction\]/);
  assert.match(facingHelper, /partElements\[partName\]\.src = source/);
  assert.match(facingHelper, /robot\.dataset\.facing = direction/);
  assert.match(script, /window\.setRobotFacing = setRobotFacing/);
});

test('keeps calibrated part boxes stable when differently sized SVGs are swapped', () => {
  const css = readFileSync(`${__dirname}/../style.css`, 'utf8');
  const applyConfig = script.match(/function applyConfigToPart\(partName\) \{[\s\S]*?\n\}/)?.[0] ?? '';

  assert.match(script, /head: \{[\s\S]*?width: 260,\s*height: 246,/);
  assert.match(script, /leftLeg: \{[\s\S]*?width: 120,\s*height: 211\.9,/);
  assert.match(script, /rightLeg: \{[\s\S]*?width: 120,\s*height: 156\.1,/);
  assert.match(applyConfig, /styles\.height = config\.height/);
  assert.match(css, /\.robot-part \{[\s\S]*?object-fit: contain/);
});

test('uses matching artwork while looking and while changing travel direction', () => {
  const lookAround = script.match(/function lookAround\(\) \{[\s\S]*?\n\}/)?.[0] ?? '';
  const roam = script.match(/function roamAndDisappear\(\) \{[\s\S]*?\n\}/)?.[0] ?? '';

  assert.match(lookAround, /setRobotFacing\('left'\)[\s\S]*?setRobotFacing\('right'\)/);
  assert.match(roam, /setRobotFacing\('left'\)[\s\S]*?setRobotFacing\('right'\)/);
});

test('reset restores the normal right-facing artwork', () => {
  const stopAll = script.match(/function stopAllAnimations[\s\S]*?\n\}/)?.[0] ?? '';
  assert.match(stopAll, /if \(reset\) \{\s*setRobotFacing\('right'\)/);
});

test('debug editor calibrates and copies left and right placement independently', () => {
  const debugPanel = script.match(/function createDebugPanel\(\) \{[\s\S]*?\n\}/)?.[0] ?? '';

  assert.match(script, /const ROBOT_FACING_CONFIGS = \{\s*right: ROBOT_CONFIG,\s*left: ROBOT_LEFT_CONFIG/);
  assert.match(debugPanel, /select data-debug-facing/);
  assert.match(debugPanel, /setRobotFacing\(facingSelect\.value\)/);
  assert.match(script, /function activeRobotConfig\(\)/);
  assert.match(script, /ROBOT_LEFT_CONFIG/);
  assert.match(script, /ROBOT_RIGHT_CONFIG/);
});

test('saved left placement includes the calibrated anchor point for every part', () => {
  const leftConfig = script.match(/const ROBOT_LEFT_CONFIG = \{[\s\S]*?\n\};/)?.[0] ?? '';

  assert.match(leftConfig, /head: \{[\s\S]*?transformOrigin: '46\.42% 96\.88%'/);
  assert.match(leftConfig, /leftHand: \{[\s\S]*?transformOrigin: '18\.04% 18\.75%'/);
  assert.match(leftConfig, /rightHand: \{[\s\S]*?transformOrigin: '86\.98% 54\.79%'/);
  assert.match(leftConfig, /leftLeg: \{[\s\S]*?transformOrigin: '18\.53% 14\.12%'/);
  assert.match(leftConfig, /rightLeg: \{[\s\S]*?transformOrigin: '71\.62% 29\.85%'/);
});

test('selected anchor point can be dragged and updates transform-origin fields', () => {
  const dragHelper = script.match(/function installOriginDotDragging\(dot, partName\) \{[\s\S]*?\n\}/)?.[0] ?? '';
  const css = readFileSync(`${__dirname}/../style.css`, 'utf8');

  assert.match(script, /installOriginDotDragging\(dot, partName\)/);
  assert.match(dragHelper, /addEventListener\('pointerdown'/);
  assert.match(dragHelper, /config\.transformOrigin = joinTransformOrigin/);
  assert.match(dragHelper, /refreshDebugInputs\(\)/);
  assert.match(dragHelper, /Math\.max\(0, Math\.min\(100/);
  assert.match(css, /\.origin-dot\.is-selected \{[\s\S]*?cursor: grab;[\s\S]*?pointer-events: auto/);
});
