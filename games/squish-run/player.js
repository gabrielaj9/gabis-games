/* The playable slime explorer. It wraps the custom physics body with animation,
   power state reactions, replay samples, and unlockable cosmetics. */
import { clamp, damp, mod } from "./utilities.js";
import { PhysicsBody } from "./physics.js";

export const SLIME_COLORS = {
  bubblegum: ["#ff8fbd", "#ffd6e8"],
  mint: ["#75dfba", "#d9fff1"],
  moon: ["#cbb7ff", "#f3edff"],
  cosmic: ["#8aa8ff", "#ffe0f3"],
};

export class Player {
  constructor(save) {
    this.save = save;
    this.body = new PhysicsBody();
    this.squish = 1;
    this.blink = 1;
    this.boostPulse = 0;
    this.trail = [];
    this.replay = [];
  }

  reset() {
    this.body = new PhysicsBody();
    this.squish = 1;
    this.blink = 1.2;
    this.boostPulse = 0;
    this.trail = [];
    this.replay = [];
  }

  update(dt, speed, physics, input, world) {
    this.body.forward += speed * dt;
    const result = physics.update(this.body, input, world.powers, world, dt);
    this.squish = damp(this.squish, this.body.grounded ? 1 : 1.08, 0.0009, dt);
    if (this.body.recovery > 0) this.squish = 0.82 + this.body.recovery * 0.7;
    this.blink -= dt;
    if (this.blink < 0) this.blink = 2 + Math.random() * 2;
    this.boostPulse = Math.max(0, this.boostPulse - dt);
    this.trail.push({ lane: this.body.lane, surface: this.body.surface, height: this.body.height, age: 0 });
    for (const t of this.trail) t.age += dt;
    this.trail = this.trail.filter(t => t.age < 0.55);
    if (this.replay.length === 0 || this.body.forward - this.replay[this.replay.length - 1].forward > 4) {
      this.replay.push({ forward: this.body.forward, lane: this.body.lane, surface: this.body.surface, height: this.body.height });
    }
    return result;
  }

  rotateTo(surface) {
    this.body.surface = mod(surface, 6);
    this.body.targetSurface = this.body.surface;
  }

  laneStep(direction) {
    this.body.targetLane = clamp(this.body.targetLane + direction, -1.85, 1.85);
  }

  colorPair() {
    return SLIME_COLORS[this.save.selectedColor] || SLIME_COLORS.bubblegum;
  }
}
