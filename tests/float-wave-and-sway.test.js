const { readFileSync } = require('node:fs');
const test = require('node:test');
const assert = require('node:assert/strict');

const script = readFileSync(`${__dirname}/../script.js`, 'utf8');
const markup = readFileSync(`${__dirname}/../index.html`, 'utf8');
const animation = script.match(/function floatWaveAndSway\(\) \{[\s\S]*?\n\}/)?.[0] ?? '';

test('registers a matching control and action', () => {
  assert.match(markup, /data-action="floatWaveAndSway"[^>]*>ריחוף ונפנוף<\/button>/);
  assert.match(script, /window\.floatWaveAndSway = floatWaveAndSway/);
  assert.match(script, /const actions = \{[\s\S]*?wave,[\s\S]*?floatWaveAndSway,/);
});

test('activates the matching button and clears it on completion', () => {
  assert.match(animation, /onComplete:[\s\S]*?setActiveButton\(null\)/);
  assert.match(animation, /setActiveButton\('floatWaveAndSway'\)/);
});

test('completion restores wrapper, hand, head, and shadow', () => {
  assert.match(animation, /resetPartToBase\('rightHand'\)/);
  assert.match(animation, /resetPartToBase\('head'\)/);
  assert.match(animation, /gsap\.set\(robotWrapper, \{ x: 0, y: 0, rotate: 0/);
  assert.match(animation, /gsap\.set\(shadow, \{ scaleX: 1, scaleY: 1, opacity: 1, filter: 'blur\(10px\)' \}\)/);
});

test('Stop interrupts the sequence and resets its targets', () => {
  const stopAll = script.match(/function stopAllAnimations[\s\S]*?\n\}/)?.[0] ?? '';
  assert.match(stopAll, /floatWaveAndSwayTimeline\?\.kill\(\)/);
  assert.match(stopAll, /floatWaveAndSwayTimeline = null/);
  assert.match(stopAll, /gsap\.set\(robotWrapper, \{ x: 0, y: 0, rotate: 0/);
  assert.match(stopAll, /robot-ground-shadow/);
});

test('repeated invocation starts cleanly and uses configured relative transforms', () => {
  assert.match(animation, /^function floatWaveAndSway\(\) \{\n  stopAllAnimations\(\{ reset: true \}\)/);
  assert.match(animation, /const handBase = base\('rightHand'\)/);
  assert.match(animation, /const headBase = base\('head'\)/);
  assert.match(animation, /x: handBase\.x \+ 2, y: handBase\.y - 4, rotate: handBase\.rotate - 10/);
  assert.doesNotMatch(animation, /(?:width|left|top):/);
  assert.doesNotMatch(animation, /\.to\((?:hand|head), \{[^}]*scale[XY]?:/);
});
