/* Third-person camera smoothing. The renderer uses this camera state to rotate
   with gravity, widen FOV during sprinting, and shake on hard landings. */
import { damp } from "./utilities.js";

export class Camera {
  constructor() {
    this.forward = 0;
    this.lane = 0;
    this.surface = 0;
    this.fov = 1;
    this.shake = 0;
    this.photoMode = false;
  }

  update(player, input, settings, dt) {
    this.forward = damp(this.forward, player.body.forward, 0.0002, dt);
    this.lane = damp(this.lane, player.body.lane, 0.0005, dt);
    this.surface = damp(this.surface, player.body.rotation, 0.0002, dt);
    const sprintFov = input.sprint ? 1.12 : 1;
    this.fov = damp(this.fov, sprintFov, 0.0007, dt);
    this.shake = Math.max(0, this.shake - dt * 3.8);
    if (settings.reducedMotion) this.shake = 0;
  }

  land(amount, settings) {
    if (!settings.screenShake || settings.reducedMotion) return;
    this.shake = Math.min(1, this.shake + amount);
  }
}
