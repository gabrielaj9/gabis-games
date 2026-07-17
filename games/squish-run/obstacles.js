/* Obstacle definitions and collision helpers. Every hazard has a compact shape
   that can be tested against the slime without a full physics engine. */
import { clamp } from "./utilities.js";

export const OBSTACLE_TYPES = [
  "laser",
  "barrier",
  "movingBlock",
  "slidingWall",
  "blade",
  "mine",
  "debris",
  "meteor",
  "movingTunnel",
];

export function makeObstacle(type, lane, offset, difficulty) {
  return {
    type,
    lane,
    offset,
    size: type === "blade" ? 0.85 : 0.68,
    phase: difficulty * 3 + lane,
    active: true,
  };
}

export function obstacleLane(obstacle, time) {
  if (obstacle.type === "movingBlock" || obstacle.type === "slidingWall") {
    return clamp(obstacle.lane + Math.sin(time * 2.2 + obstacle.phase) * 0.85, -1.2, 1.2);
  }
  if (obstacle.type === "movingTunnel") {
    return clamp(Math.sin(time * 1.4 + obstacle.phase) * 1.1, -1.2, 1.2);
  }
  return obstacle.lane;
}

export function obstacleHits(obstacle, player, segment, time) {
  const z = segment.z + obstacle.offset;
  const dz = Math.abs(player.body.forward - z);
  if (dz > 2.8) return false;
  const lane = obstacleLane(obstacle, time);
  const laneHit = Math.abs(player.body.lane - lane) < obstacle.size;
  const height = player.body.height;
  if (!laneHit) return false;
  if (obstacle.type === "laser") return height < 1.9;
  if (obstacle.type === "barrier") return height < 3.1;
  if (obstacle.type === "blade") return height < 2.5;
  if (obstacle.type === "meteor") return height < 4.2;
  return height < 2.2;
}

export function obstacleName(type) {
  return {
    laser: "Laser gate",
    barrier: "Energy barrier",
    movingBlock: "Moving block",
    slidingWall: "Sliding wall",
    blade: "Spinning blade",
    mine: "Space mine",
    debris: "Floating debris",
    meteor: "Meteor shower",
    movingTunnel: "Moving tunnel",
  }[type] || "Obstacle";
}
