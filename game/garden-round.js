export class GardenRound {
  constructor({ random = Math.random, duration = 45 } = {}) {
    this.random = random; this.remaining = duration; this.elapsed = 0;
    this.score = 0; this.combo = 0; this.bestCombo = 0; this.lives = 3;
    this.player = .5; this.objects = []; this.spawnIn = .4; this.nextId = 0;
    this.finished = false; this.catches = 0; this.level = 1;
  }
  step(dt, target, width) {
    if (this.finished) return [];
    dt = Math.max(0, Math.min(dt, .05));
    this.elapsed += dt; this.remaining = Math.max(0, this.remaining - dt);
    this.level = Math.min(4, 1 + Math.floor(this.elapsed / 12));
    const distance = Math.max(.07, Math.min(.93, target)) - this.player;
    this.player += Math.sign(distance) * Math.min(Math.abs(distance), 600 / width * dt);
    const events = [];
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      const roll = this.random();
      const type = roll < .15 ? 'rain' : roll < .23 ? 'gold' : roll < .5 ? 'apple' : roll < .75 ? 'orange' : 'berries';
      this.objects.push({ id: this.nextId++, type, x: .08 + this.random() * .84,
        y: -.08, speed: .19 + this.level * .014 + this.random() * .025, spin: this.random() * Math.PI });
      this.spawnIn += Math.max(.4, .83 - this.level * .085);
    }
    for (const object of this.objects) {
      if (object.gone) continue;
      const before = object.y; object.y += object.speed * dt;
      if (before < .84 && object.y >= .84 && Math.abs(object.x - this.player) <= 47 / width) {
        object.gone = true;
        if (object.type === 'rain') {
          this.lives = Math.max(0, this.lives - 1); this.combo = 0; events.push({ type: 'hurt', x: object.x, text: 'אופס! טיפה שובבה' });
        } else {
          this.combo++; this.catches++; this.bestCombo = Math.max(this.bestCombo, this.combo);
          const multiplier = Math.min(3, 1 + Math.floor(this.combo / 5));
          const points = (object.type === 'gold' ? 30 : 10) * multiplier;
          this.score += points; events.push({ type: 'catch', x: object.x, points, multiplier });
        }
      }
      if (object.y > 1.07) { object.gone = true; if (object.type !== 'rain') { this.combo = 0; events.push({ type: 'miss' }); } }
    }
    this.objects = this.objects.filter(object => !object.gone);
    if (this.remaining === 0 || this.lives <= 0) {
      this.finished = true; events.push({ type: 'finish' });
    }
    return events;
  }
  get reward() { return Math.floor(this.score / 15) + (this.bestCombo >= 5 ? 3 : 0); }
}
