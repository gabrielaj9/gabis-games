/* World state and streaming. The world owns generated chunks, particles,
   collision events, collectibles, and pooled visual effects. */
import { clamp, mod, starPath } from "./utilities.js";
import { Generator } from "./generator.js";
import { laneExists } from "./platform.js";
import { obstacleHits, obstacleName } from "./obstacles.js";
import { applyPowerup, defaultPowers, powerLabel, updatePowers } from "./powerups.js";

export class World {
  constructor(seed) {
    this.generator = new Generator(seed);
    this.segments = [];
    this.particles = [];
    this.notifications = [];
    this.powers = defaultPowers();
    this.time = 0;
    this.checkpoint = null;
  }

  reset(seed) {
    this.generator.reset(seed);
    this.segments = this.generator.makeInitial(24);
    this.particles = [];
    this.notifications = [];
    this.powers = defaultPowers();
    this.time = 0;
    this.checkpoint = null;
  }

  update(dt, player, audio, run, save, toast) {
    this.time += dt;
    updatePowers(this.powers, dt);
    this.stream(player.body.forward);
    this.updateParticles(dt);
    const segment = this.segmentAt(player.body.forward);
    if (!segment) return null;
    const surface = segment.surfaces[player.body.surface];
    this.collectCrystals(segment, surface, player, run, audio);
    this.collectPowerups(segment, surface, player, audio, toast);
    const hit = this.testObstacles(segment, surface, player);
    if (hit) return hit;
    if (surface.boost.includes(Math.round(player.body.lane))) player.boostPulse = 0.4;
    if (surface.gravitySwitch && player.body.grounded) player.rotateTo(surface.gravitySwitch);
    if (this.powers.checkpoint > 0) this.checkpoint = { forward: player.body.forward, surface: player.body.surface, lane: player.body.lane };
    return null;
  }

  stream(forward) {
    this.segments = this.segments.filter(segment => segment.z + segment.length > forward - 30);
    while (this.segments.length < 28) {
      this.segments.push(this.generator.next(forward));
    }
  }

  segmentAt(forward) {
    return this.segments.find(segment => segment.contains(forward));
  }

  floorAt(forward, surfaceIndex, lane) {
    const segment = this.segmentAt(forward);
    if (!segment) return { exists: true, height: 0, kind: "safe" };
    const surface = segment.surfaces[mod(surfaceIndex, 6)];
    const nearest = Math.round(clamp(lane, -1, 1));
    const exists = laneExists(surface, nearest);
    if (!exists) return { exists: false, height: -40, kind: "gap" };
    const local = forward - segment.z;
    const moving = surface.moving.includes(nearest) ? Math.sin(this.time * 2.5 + nearest) * 0.35 : 0;
    const falling = surface.falling.includes(nearest) && local > segment.length * 0.55 ? -Math.min(2.8, (local - segment.length * 0.55) * 0.55) : 0;
    return { exists: true, height: moving + falling, kind: surface.glass.includes(nearest) ? "glass" : "safe" };
  }

  collectCrystals(segment, surface, player, run, audio) {
    const magnet = this.powers.magnet > 0 ? 1.45 : 0.58;
    for (const crystal of surface.crystals) {
      if (crystal.taken) continue;
      const z = segment.z + crystal.offset;
      const close = Math.abs(player.body.forward - z) < (this.powers.magnet > 0 ? 4.5 : 2.2);
      const laneClose = Math.abs(player.body.lane - crystal.lane) < magnet;
      if (close && laneClose) {
        crystal.taken = true;
        const mult = this.powers.multiplier > 0 ? 2 : 1;
        run.crystals += 1;
        run.score += 55 * mult;
        audio.collect();
        this.burst(player.body.lane, player.body.surface, "#fff3a8", 14);
      }
    }
  }

  collectPowerups(segment, surface, player, audio, toast) {
    for (const power of surface.powerups) {
      if (power.collected) continue;
      const z = segment.z + power.offset;
      if (Math.abs(player.body.forward - z) < 2.4 && Math.abs(player.body.lane - power.lane) < 0.65) {
        power.collected = true;
        const applied = applyPowerup(power.type, this.powers, this.generator.rng);
        audio.power();
        toast(powerLabel(applied));
        this.burst(player.body.lane, player.body.surface, "#b8f4ff", 18);
      }
    }
  }

  testObstacles(segment, surface, player) {
    for (const obstacle of surface.obstacles) {
      if (obstacle.active && obstacleHits(obstacle, player, segment, this.time)) {
        obstacle.active = false;
        if (this.powers.shield > 0) {
          this.powers.shield = 0;
          return { blocked: true, reason: "Shield shimmered through danger." };
        }
        return { fatal: true, reason: obstacleName(obstacle.type) };
      }
    }
    return null;
  }

  burst(lane, surface, color, count) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        lane,
        surface,
        color,
        x: (Math.random() - 0.5) * 1.8,
        y: Math.random() * 1.2,
        vx: (Math.random() - 0.5) * 2.4,
        vy: Math.random() * 3,
        life: 0.5 + Math.random() * 0.55,
        size: 2 + Math.random() * 4,
      });
    }
  }

  updateParticles(dt) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy -= 4 * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter(p => p.life > 0).slice(-280);
  }

  drawParticles(ctx, project) {
    for (const p of this.particles) {
      const pos = project(p.lane + p.x, p.surface, p.y, 8);
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      starPath(ctx, pos.x, pos.y, p.size * pos.scale, 5);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
