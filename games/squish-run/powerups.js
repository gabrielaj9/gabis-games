/* Powerups grant temporary effects while keeping the runner readable. The random
   power chooses one of the concrete effects at collection time. */
import { pick } from "./utilities.js";

export const POWERUP_TYPES = [
  "doubleJump",
  "slowMotion",
  "shield",
  "speedBoost",
  "magnet",
  "multiplier",
  "lowGravity",
  "checkpoint",
  "random",
];

export function createPowerup(type, lane, offset) {
  return { type, lane, offset, collected: false, spin: 0 };
}

export function defaultPowers() {
  return {
    doubleJump: 0,
    slowMotion: 0,
    shield: 0,
    speedBoost: 0,
    magnet: 0,
    multiplier: 0,
    lowGravity: 0,
    checkpoint: 0,
  };
}

export function updatePowers(powers, dt) {
  for (const key of Object.keys(powers)) powers[key] = Math.max(0, powers[key] - dt);
}

export function applyPowerup(type, powers, rng) {
  const concrete = type === "random" ? pick(rng, POWERUP_TYPES.filter(p => p !== "random")) : type;
  const durations = {
    doubleJump: 12,
    slowMotion: 7,
    shield: 10,
    speedBoost: 5,
    magnet: 10,
    multiplier: 12,
    lowGravity: 8,
    checkpoint: 18,
  };
  powers[concrete] = Math.max(powers[concrete] || 0, durations[concrete] || 8);
  return concrete;
}

export function powerLabel(type) {
  return {
    doubleJump: "Double Jump",
    slowMotion: "Slow Motion",
    shield: "Shield",
    speedBoost: "Speed Boost",
    magnet: "Magnet",
    multiplier: "Score x2",
    lowGravity: "Low Gravity",
    checkpoint: "Checkpoint",
    random: "Random Power",
  }[type] || type;
}
