const { readFileSync } = require('node:fs');
const test = require('node:test');
const assert = require('node:assert/strict');

const script = readFileSync(`${__dirname}/../script.js`, 'utf8');
const markup = readFileSync(`${__dirname}/../index.html`, 'utf8');
const animation = script.match(/function roamAndDisappear\(\) \{[\s\S]*?\n\}/)?.[0] ?? '';

test('registers the roam and disappear control and public action', () => {
  assert.match(markup, /data-action="roamAndDisappear"[^>]*>Roam &amp; Disappear<\/button>/);
  assert.match(script, /window\.roamAndDisappear = roamAndDisappear/);
  assert.match(script, /const actions = \{[\s\S]*?roamAndDisappear,/);
});

test('uses responsive stage bounds for a multi-point journey', () => {
  assert.match(animation, /getBoundingClientRect\(\)/);
  assert.match(animation, /robot\.getBoundingClientRect\(\)/);
  assert.match(animation, /horizontalRange/);
  assert.match(animation, /verticalRange/);
  assert.equal((animation.match(/\.to\(robotWrapper/g) ?? []).length, 5);
});

test('keeps the previous speed while shortening the route', () => {
  const wrapperDurations = [...animation.matchAll(/\.to\(robotWrapper, \{[\s\S]*?duration: ([\d.]+)/g)].map((match) => Number(match[1]));
  assert.deepEqual(wrapperDurations, [2.2, 2.1, 2.2, 2, 1.7]);
  assert.equal(wrapperDurations.reduce((total, duration) => total + duration, 0), 10.2);
});

test('follows a shorter right-side curve and disappears in the upper-right', () => {
  assert.match(animation, /x: horizontalRange \* 0\.68, y: verticalRange \* 0\.58/);
  assert.match(animation, /x: horizontalRange \* 0\.82, y: verticalRange \* 0\.15/);
  assert.match(animation, /x: horizontalRange \* 0\.42, y: -verticalRange \* 0\.08/);
  assert.match(animation, /x: horizontalRange \* 0\.92,[\s\S]*?y: -verticalRange \* 0\.7,[\s\S]*?opacity: 0/);
});

test('adds subtle alternating arm and leg motion during the flight', () => {
  ['leftHand', 'rightHand', 'leftLeg', 'rightLeg'].forEach((part) => {
    assert.match(animation, new RegExp(`partElements\\.${part}[^}]*repeat: \\d+[^}]*yoyo: true`));
  });
  assert.match(animation, /\['leftHand', 'rightHand', 'leftLeg', 'rightLeg'\]\.forEach\(resetPartToBase\)/);
});

test('fades the robot and its shadow at the end', () => {
  assert.match(animation, /opacity: 0,[\s\S]*?ease: 'power2\.in'/);
  assert.match(animation, /\.to\(shadow, \{[^}]*opacity: 0/);
});

test('Stop interrupts the journey and restores visibility', () => {
  const stopAll = script.match(/function stopAllAnimations[\s\S]*?\n\}/)?.[0] ?? '';
  assert.match(stopAll, /roamAndDisappearTimeline\?\.kill\(\)/);
  assert.match(stopAll, /roamAndDisappearTimeline = null/);
  assert.match(stopAll, /x: 0/);
  assert.match(stopAll, /opacity: 1/);
});
