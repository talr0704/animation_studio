// Poses: [time fraction, x, y, rotation, scaleX, scaleY].
const p = (t, x = 0, y = 0, r = 0, sx = 1, sy = 1) => [t, x, y, r, sx, sy];
const rotations = angles => angles.map((r, i) => p(i / (angles.length - 1), 0, 0, r));
export const POPA_CLIPS = {
  idle: { duration: 3000, loop: true, blink: true, tracks: {
    body: [p(0), p(.45, 0, -2.375), p(1)],
    head: [p(0), p(.15), p(.6, 0, -.45), p(1)],
    left: rotations([0, 2.5, 0, -2, 0]), right: rotations([0, -2.5, 0, 2, 0]), tail: rotations([0, 5, 0, -5, 0]),
  } },
  walk: { duration: 800, loop: true, tracks: {
    leftFoot: [p(0), p(.12, 2, -2, 2), p(.25, 3, -4, 4), p(.42, 1, -1, 1), p(.5), p(.75, -3, 0, -2), p(1)],
    rightFoot: [p(0), p(.25, -3, 0, -2), p(.5), p(.62, 2, -2, 2), p(.75, 3, -4, 4), p(.92, 1, -1, 1), p(1)],
    body: [p(0), p(.25, -1, -1.5, -.5), p(.5), p(.75, 1, -1.5, .5), p(1)],
    head: rotations([0, .5, 0, -.5, 0]), left: rotations([0, -8, 0, 8, 0]), right: rotations([0, 8, 0, -8, 0]), tail: rotations([0, 4, 0, -4, 0]),
  } },
  happy: { duration: 1200, tracks: {
    body: [p(0), p(1/6, 0, 3, 0, 1.01, .97), p(.35), p(.6), p(.78, 0, 2, 0, 1.005, .98), p(1)],
    wrapper: [p(0), p(1/6), p(.38, 0, -28.5), p(.5, 0, -28.5), p(.72), p(1)],
    head: rotations([0, 1, -1.5, 1, -.5, 0]), left: rotations([0, -3, 26, 24, 6, 0]), right: rotations([0, 3, -26, -24, -6, 0]), tail: rotations([0, -3, 6, -4, 2, 0]),
    shadow: [p(0), p(1/6), p(.38, 0, 0, 0, .85, .85), p(.5, 0, 0, 0, .85, .85), p(.72), p(1)],
  } },
  wave: { duration: 1600, tracks: {
    left: [p(0), p(.22, 0, 0, 38), p(.36, 0, 0, 48), p(.5, 0, 0, 38), p(.64, 0, 0, 48), p(.76, 0, 0, 38), p(1)],
    head: [p(0), p(.25, 0, 0, -2), p(.75, 0, 0, -2), p(1)],
    body: [p(0), p(.25, 0, 0, 1), p(.75, 0, 0, 1), p(1)],
  } },
  curious: { duration: 2000, tracks: {
    head: [p(0), p(.3, 2, 0, 7), p(.55, 2, 0, 7), p(1)],
    body: [p(0), p(.3, 0, 0, 2), p(.55, 0, 0, 2), p(1)],
    left: rotations([0, 3, 3, 0]), right: rotations([0, 3, 3, 0]), tail: rotations([0, -5, -5, 0]),
  } },
  interact: { duration: 1100, eventTime: 550, tracks: {
    right: [p(0), p(.4, 0, 0, -24), p(.6, 0, 0, -24), p(1)],
    head: [p(0), p(.4, 1, 0, 2), p(.6, 1, 0, 2), p(1)],
    body: [p(0), p(.4, 1, 0, 1), p(.6, 1, 0, 1), p(1)],
  } },
  hold: { duration: 2500, loop: true, posed: true, tracks: {
    body: [p(0), p(.5, 0, -1.2), p(1)], head: rotations([-1, -.5, -1]),
    left: rotations([-82, -83, -82]), right: rotations([82, 83, 82]), tail: rotations([0, 3, 0, -3, 0]),
  } },
  pet: { duration: 1800, tracks: {
    head: [p(0), p(.3, 2, -1.5, 6), p(.58, 2, -1.5, 6), p(1)],
    body: [p(0), p(.3, .5, 0, 1), p(.58, .5, 0, 1), p(1)],
    left: rotations([0, 3, -2, 2, 0]), right: rotations([0, -3, 2, -2, 0]), tail: rotations([0, 5, -4, 5, -4, 0]),
  } },
  rest: { duration: 4000, loop: true, posed: true, closedEyes: true, tracks: {
    body: [p(0, 0, 2), p(.5, 0, .8), p(1, 0, 2)],
    head: [p(0, 0, 0, -4), p(.5, 0, -.3, -4), p(1, 0, 0, -4)],
    left: rotations([3, 4, 3]), right: rotations([-3, -4, -3]), tail: rotations([0, 1.5, 0, -1.5, 0]),
  } },
};
export function poseTransform([, x, y, r, sx, sy]) {
  return `translate(${x}px, ${y}px) rotate(${r}deg) scale(${sx}, ${sy})`;
}
export function clipFrames(poses) {
  return poses.map(pose => ({ offset: pose[0], transform: poseTransform(pose), easing: 'ease-in-out' }));
}
