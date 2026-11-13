const test = require('node:test');
const assert = require('node:assert/strict');

test('game clips meet requested timings and join at identical poses', async () => {
  const { POPA_CLIPS, poseTransform } = await import('../popa-clips.js');
  const durations = { idle: 3000, walk: 800, happy: 1200, wave: 1600, curious: 2000, interact: 1100, hold: 2500, pet: 1800, rest: 4000 };
  assert.deepEqual(Object.keys(POPA_CLIPS), Object.keys(durations));
  for (const [name, clip] of Object.entries(POPA_CLIPS)) {
    assert.equal(clip.duration, durations[name], name);
    for (const [track, poses] of Object.entries(clip.tracks)) {
      assert.equal(poses[0][0], 0, `${name}/${track}`);
      assert.equal(poses.at(-1)[0], 1, `${name}/${track}`);
      assert.equal(poseTransform(poses[0]), poseTransform(poses.at(-1)), `${name}/${track}`);
      if (!clip.loop) assert.deepEqual(poses[0].slice(1), [0, 0, 0, 1, 1], name);
      for (const pose of poses) {
        assert.ok(pose.every(Number.isFinite));
        assert.ok(pose[4] >= .85 && pose[4] <= 1.03 && pose[5] >= .85 && pose[5] <= 1.03);
        if (track !== 'shadow') assert.ok(pose[4] >= .97 && pose[5] >= .97);
      }
    }
  }
  assert.equal(POPA_CLIPS.interact.eventTime, 550);
  assert.ok(POPA_CLIPS.hold.posed && POPA_CLIPS.rest.posed);
});
