/* Custom runner physics. Position is expressed as forward distance, lane offset,
   height above the current tunnel surface, and a gravity surface index around a
   six-sided tunnel. No physics engine is used. */
import { clamp, damp, mod } from "./utilities.js";

export class PhysicsBody {
  constructor() {
    this.forward = 0;
    this.lane = 0;
    this.targetLane = 0;
    this.height = 0;
    this.velocityLane = 0;
    this.velocityHeight = 0;
    this.surface = 0;
    this.targetSurface = 0;
    this.rotation = 0;
    this.grounded = true;
    this.doubleJumpReady = false;
    this.recovery = 0;
    this.lastLandingSpeed = 0;
  }
}

export class PhysicsSystem {
  constructor() {
    this.laneLimit = 1.85;
    this.gravity = 34;
    this.jumpSpeed = 17.6;
    this.sprintBoost = 1;
  }

  update(body, input, powers, world, dt) {
    const acceleration = body.grounded ? 22 : 11;
    const friction = body.grounded ? 12 : 2.6;
    const desired = input.move * this.laneLimit;
    body.targetLane = clamp(desired, -this.laneLimit, this.laneLimit);
    body.velocityLane += (body.targetLane - body.lane) * acceleration * dt;
    body.velocityLane = damp(body.velocityLane, 0, Math.pow(0.001, friction), dt);
    body.lane += body.velocityLane * dt;
    body.lane = clamp(body.lane, -this.laneLimit, this.laneLimit);

    const lowGravity = powers.lowGravity > 0 ? 0.48 : 1;
    body.velocityHeight -= this.gravity * lowGravity * dt;
    body.height += body.velocityHeight * dt;
    body.recovery = Math.max(0, body.recovery - dt);

    if (input.jumpPressed) this.tryJump(body, powers);
    if (input.rotateLeftPressed) this.rotateSurface(body, -1);
    if (input.rotateRightPressed) this.rotateSurface(body, 1);

    const floor = world.floorAt(body.forward, body.surface, body.lane);
    if (body.height <= floor.height && body.velocityHeight <= 0) {
      const wasAir = !body.grounded;
      body.lastLandingSpeed = Math.abs(body.velocityHeight);
      body.height = floor.height;
      body.velocityHeight = 0;
      body.grounded = floor.exists;
      if (floor.exists && wasAir) body.recovery = 0.16;
      if (!floor.exists) body.grounded = false;
      if (floor.exists) body.doubleJumpReady = powers.doubleJump > 0;
    } else {
      body.grounded = false;
    }

    if (!floor.exists && body.height < -7) return { fell: true };
    body.rotation = damp(body.rotation, body.targetSurface, 0.00008, dt);
    return { landed: body.lastLandingSpeed > 20 && body.recovery > 0.12 };
  }

  tryJump(body, powers) {
    if (body.grounded) {
      body.velocityHeight = this.jumpSpeed;
      body.grounded = false;
      return true;
    }
    if (powers.doubleJump > 0 && body.doubleJumpReady) {
      body.velocityHeight = this.jumpSpeed * 0.9;
      body.doubleJumpReady = false;
      return true;
    }
    return false;
  }

  rotateSurface(body, direction) {
    if (!body.grounded && Math.abs(body.velocityHeight) > 10) return;
    body.surface = mod(body.surface + direction, 6);
    body.targetSurface = body.surface;
    body.height = Math.max(0, body.height);
    body.velocityHeight *= 0.35;
  }
}
