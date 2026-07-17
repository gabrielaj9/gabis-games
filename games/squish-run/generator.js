/* Endless procedural tunnel generator. It always keeps at least one continuous
   safe route and gradually adds gaps, moving pieces, hazards, branches, and
   shortcuts as distance increases. */
import { chance, clamp, makeRng, pick } from "./utilities.js";
import { makeSurface, Segment } from "./platform.js";
import { makeObstacle, OBSTACLE_TYPES } from "./obstacles.js";
import { createPowerup, POWERUP_TYPES } from "./powerups.js";

const THEMES = ["candy", "aurora", "nebula", "moon"];

export class Generator {
  constructor(seed) {
    this.seed = seed;
    this.rng = makeRng(seed);
    this.nextZ = 0;
    this.safeSurface = 0;
    this.safeLane = 0;
    this.index = 0;
  }

  reset(seed) {
    this.seed = seed;
    this.rng = makeRng(seed);
    this.nextZ = 0;
    this.safeSurface = 0;
    this.safeLane = 0;
    this.index = 0;
  }

  makeInitial(count = 18) {
    const segments = [];
    for (let i = 0; i < count; i++) segments.push(this.next(0));
    return segments;
  }

  next(distance) {
    const difficulty = clamp(distance / 2400, 0, 1);
    const tutorial = this.index < 8;
    const length = 13 + this.rng(0, 7) + difficulty * 5;
    const theme = THEMES[Math.floor(this.index / 10) % THEMES.length];
    const surfaces = Array.from({ length: 6 }, makeSurface);

    if (!tutorial && chance(this.rng, 0.2 + difficulty * 0.18)) {
      this.safeSurface = (this.safeSurface + pick(this.rng, [-1, 1])) % 6;
      if (this.safeSurface < 0) this.safeSurface += 6;
    }
    if (!tutorial && chance(this.rng, 0.32)) this.safeLane = clamp(this.safeLane + pick(this.rng, [-1, 0, 1]), -1, 1);

    for (let s = 0; s < 6; s++) {
      const surface = surfaces[s];
      const routeBias = s === this.safeSurface ? 0.35 : 0;
      for (const lane of [-1, 0, 1]) {
        const isSafe = s === this.safeSurface && lane === this.safeLane;
        if (!tutorial && !isSafe && chance(this.rng, 0.1 + difficulty * 0.28 - routeBias)) surface.missing.push(lane);
        if (!tutorial && !isSafe && chance(this.rng, 0.08 + difficulty * 0.12)) surface.broken.push(lane);
        if (chance(this.rng, 0.06 + difficulty * 0.1)) surface.glass.push(lane);
      }
      if (!tutorial && chance(this.rng, 0.06 + difficulty * 0.1)) surface.moving.push(pick(this.rng, [-1, 0, 1]));
      if (!tutorial && chance(this.rng, 0.05 + difficulty * 0.09)) surface.falling.push(pick(this.rng, [-1, 0, 1]));
      if (!tutorial && chance(this.rng, 0.04 + difficulty * 0.08)) surface.boost.push(pick(this.rng, [-1, 0, 1]));
      if (!tutorial && chance(this.rng, 0.07 + difficulty * 0.12)) surface.lowCeiling = true;
      if (!tutorial && chance(this.rng, 0.05 + difficulty * 0.1)) surface.rotating = true;
    }

    const safe = surfaces[this.safeSurface];
    safe.missing = safe.missing.filter(lane => lane !== this.safeLane);
    safe.broken = safe.broken.filter(lane => lane !== this.safeLane);
    if (chance(this.rng, 0.22)) safe.crystals.push({ lane: this.safeLane, offset: length * this.rng(0.3, 0.8), taken: false });

    const obstacleCount = tutorial ? 0 : Math.floor(this.rng(0, 2 + difficulty * 4));
    for (let i = 0; i < obstacleCount; i++) {
      const surfaceIndex = chance(this.rng, 0.7) ? this.safeSurface : Math.floor(this.rng(0, 6));
      const surface = surfaces[surfaceIndex];
      const safeLanes = [-1, 0, 1].filter(l => !surface.missing.includes(l));
      if (safeLanes.length < 2) continue;
      const candidates = safeLanes.filter(l => !(surfaceIndex === this.safeSurface && l === this.safeLane));
      const lane = pick(this.rng, candidates.length ? candidates : safeLanes);
      surface.obstacles.push(makeObstacle(pick(this.rng, OBSTACLE_TYPES), lane, length * this.rng(0.25, 0.86), difficulty));
    }

    if (!tutorial && chance(this.rng, 0.22 + difficulty * 0.18)) {
      const surface = surfaces[this.safeSurface];
      const lane = pick(this.rng, [-1, 0, 1].filter(l => !surface.missing.includes(l)));
      surface.powerups.push(createPowerup(pick(this.rng, POWERUP_TYPES), lane, length * this.rng(0.35, 0.78)));
    }

    if (!tutorial && chance(this.rng, 0.18 + difficulty * 0.16)) {
      const side = (this.safeSurface + pick(this.rng, [-1, 1]) + 6) % 6;
      surfaces[side].missing = surfaces[side].missing.filter(l => l !== this.safeLane);
      surfaces[side].gravitySwitch = this.safeSurface;
    }

    const segment = new Segment({
      z: this.nextZ,
      length,
      surfaces,
      theme,
      branch: chance(this.rng, 0.18 + difficulty * 0.18),
    });
    this.nextZ += length;
    this.index += 1;
    return segment;
  }
}
