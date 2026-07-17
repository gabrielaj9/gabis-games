/* Squish Run main loop and renderer. This file coordinates input, physics,
   procedural world streaming, UI state, drawing, achievements, and saves. */
import { Camera } from "./camera.js";
import { SquishAudio } from "./audio.js";
import { PhysicsSystem } from "./physics.js";
import { Player } from "./player.js";
import { World } from "./world.js";
import { UI, attachTouchControls } from "./ui.js";
import { submitRun } from "./leaderboard.js";
import { ACHIEVEMENTS, addXp, loadSave, recordAchievement, saveGame, updateStats } from "./save.js";
import { clamp, easeOutCubic, formatTime, mod, polygon, roundRect, starPath, todaySeed, rgba } from "./utilities.js";
import { surfaceColor } from "./platform.js";
import { obstacleLane } from "./obstacles.js";
import { powerLabel } from "./powerups.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = 960;
const H = 640;

const input = {
  left: false,
  right: false,
  jump: false,
  sprint: false,
  rotateLeft: false,
  rotateRight: false,
  jumpQueued: false,
  pauseQueued: false,
  touchMove: 0,
  jumpHeldLastFrame: false,
  move: 0,
  jumpPressed: false,
  rotateLeftPressed: false,
  rotateRightPressed: false,
};

const save = loadSave();
const ui = new UI(save);
const audio = new SquishAudio(save);
const physics = new PhysicsSystem();
const camera = new Camera();
const player = new Player(save);
const world = new World("squish-run");

let state = "home";
let mode = "endless";
let run = makeRun();
let last = performance.now();
let speed = 22;
let baseSeed = "squish-run";
let ghost = [];
let tutorialTimer = 0;

function fitCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, save.settings.performance === "quality" ? 2 : 1.5);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function makeRun() {
  return {
    name: "Dumpling",
    mode: "endless",
    seed: "squish-run",
    score: 0,
    distance: 0,
    crystals: 0,
    survivalMs: 0,
    startedAt: performance.now(),
    reason: "",
    finishedTimeTrial: false,
  };
}

function seedForMode(nextMode) {
  if (nextMode === "daily") return todaySeed();
  if (nextMode === "seeded") return ui.seedValue() || "gabi-seed";
  if (nextMode === "timeTrial") return `time-trial-${Date.now()}`;
  return `endless-${Date.now()}`;
}

function start(nextMode = "endless") {
  mode = nextMode;
  baseSeed = seedForMode(mode);
  run = makeRun();
  run.mode = mode;
  run.seed = baseSeed;
  run.name = ui.playerName();
  player.reset();
  world.reset(baseSeed);
  camera.shake = 0;
  camera.photoMode = false;
  speed = mode === "timeTrial" ? 25 : 22;
  tutorialTimer = 8;
  ghost = [...(save.ghostReplay || [])];
  state = "playing";
  ui.hideAll();
  audio.unlock();
  audio.applySettings();
  unlockAchievement("first_run");
  if (mode === "daily") unlockAchievement("daily");
}

function update(dt) {
  readInput();
  if (input.pauseQueued) {
    input.pauseQueued = false;
    togglePause();
  }
  if (state !== "playing") return;

  tutorialTimer = Math.max(0, tutorialTimer - dt);
  const slow = world.powers.slowMotion > 0 ? 0.62 : 1;
  const sprint = input.sprint ? 1.22 : 1;
  const boost = world.powers.speedBoost > 0 || player.boostPulse > 0 ? 1.28 : 1;
  const difficulty = clamp(player.body.forward / 2600, 0, 1);
  speed = Math.min(58, speed + dt * (0.28 + difficulty * 0.5));
  const actualSpeed = speed * sprint * boost * slow;

  const result = player.update(dt, actualSpeed, physics, input, world);
  run.distance = player.body.forward;
  run.survivalMs = performance.now() - run.startedAt;
  run.score += dt * actualSpeed * (world.powers.multiplier > 0 ? 3.5 : 1.7);

  const event = world.update(dt, player, audio, run, save, toast);
  if (event?.blocked) {
    audio.power();
    toast(event.reason);
    unlockAchievement("shield");
  }
  if (event?.fatal) return endRun(event.reason);
  if (result?.fell) return recoverOrEnd("Fell into soft starlight");
  if (result?.landed) {
    camera.land(clamp(player.body.lastLandingSpeed / 30, 0.08, 0.55), save.settings);
    audio.land();
  }

  if (mode === "timeTrial" && run.distance >= 1000) {
    run.finishedTimeTrial = true;
    unlockAchievement("time_trial");
    return endRun("Time trial complete");
  }

  checkAchievements();
  camera.update(player, input, save.settings, dt);
  audio.tickMusic(actualSpeed);
  ui.updateHud(run, world.powers);
}

function recoverOrEnd(reason) {
  if (world.checkpoint) {
    player.body.forward = world.checkpoint.forward;
    player.body.surface = world.checkpoint.surface;
    player.body.targetSurface = world.checkpoint.surface;
    player.body.lane = world.checkpoint.lane;
    player.body.height = 1;
    player.body.velocityHeight = 8;
    world.powers.checkpoint = 0;
    toast("Checkpoint beacon recovered you");
    return;
  }
  endRun(reason);
}

function endRun(reason) {
  if (state !== "playing") return;
  state = "over";
  run.reason = reason;
  run.score = Math.floor(run.score + run.distance * 0.8 + run.crystals * 75);
  updateStats(save, run);
  for (const message of addXp(save, Math.floor(run.score / 12 + run.crystals * 5))) toast(message);
  save.lastReplay = player.replay.slice(-800);
  save.ghostReplay = save.lastReplay;
  submitRun(run);
  saveGame(save);
  audio.hit();
  ui.showGameOver(run);
}

function checkAchievements() {
  if (run.distance >= 500) unlockAchievement("distance_500");
  if (run.distance >= 1500) unlockAchievement("distance_1500");
  if (run.crystals >= 25) unlockAchievement("crystals_25");
  if (player.body.surface === 3) unlockAchievement("ceiling");
}

function unlockAchievement(id) {
  const def = ACHIEVEMENTS.find(a => a.id === id);
  if (def && recordAchievement(save, id)) {
    toast(`Achievement: ${def.name}`);
    saveGame(save);
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawSky();
  drawTunnel();
  drawGhost();
  drawPlayer();
  drawForeground();
}

function drawSky() {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, save.settings.colorblind ? "#111936" : "#151738");
  bg.addColorStop(0.46, save.settings.colorblind ? "#19354d" : "#263465");
  bg.addColorStop(1, save.settings.colorblind ? "#432c5f" : "#563158");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  const shake = camera.shake * 8;
  ctx.translate(Math.sin(world.time * 34) * shake, Math.cos(world.time * 29) * shake);
  for (let i = 0; i < 90; i++) {
    const x = (i * 127.13 + world.time * (i % 5)) % W;
    const y = (i * 71.91 + Math.sin(world.time * 0.2 + i) * 10) % H;
    ctx.globalAlpha = 0.25 + (i % 7) * 0.08;
    ctx.fillStyle = i % 3 ? "#fff8fb" : "#b8f4ff";
    ctx.beginPath();
    ctx.arc(x, y, 1 + (i % 4) * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  drawPlanet(128, 132, 62, "#ffb7d5", "#fff3a8");
  drawPlanet(812, 96, 42, "#b8f4ff", "#c9b6ff");
  drawNebula(706, 410, 190, "#ff8fb7");
  drawNebula(250, 340, 170, "#8ecbff");
  ctx.restore();
}

function drawPlanet(x, y, r, a, b) {
  const g = ctx.createRadialGradient(x - r * 0.25, y - r * 0.25, r * 0.1, x, y, r);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.28, a);
  g.addColorStop(1, b);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 1.5, r * 0.38, -0.25, 0, Math.PI * 2);
  ctx.stroke();
}

function drawNebula(x, y, r, color) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, 0.26));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawTunnel() {
  const visible = world.segments
    .filter(segment => segment.z + segment.length > camera.forward - 4 && segment.z < camera.forward + 230)
    .sort((a, b) => b.z - a.z);
  for (const segment of visible) {
    for (let surface = 0; surface < 6; surface++) {
      for (const lane of [-1, 0, 1]) drawPlatformTile(segment, surface, lane);
      drawSegmentItems(segment, surface);
    }
  }
  world.drawParticles(ctx, project);
}

function drawPlatformTile(segment, surface, lane) {
  const data = segment.surfaces[surface];
  if (data.missing.includes(lane)) return;
  const z1 = segment.z;
  const z2 = segment.z + segment.length * 0.92;
  const h1 = world.floorAt(z1 + 0.1, surface, lane).height;
  const h2 = world.floorAt(z2 - 0.1, surface, lane).height;
  const p1 = project(lane - 0.45, surface, h1, z1);
  const p2 = project(lane + 0.45, surface, h1, z1);
  const p3 = project(lane + 0.45, surface, h2, z2);
  const p4 = project(lane - 0.45, surface, h2, z2);
  const near = clamp(1 - (z1 - camera.forward) / 240, 0, 1);
  const isGlass = data.glass.includes(lane);
  const isBroken = data.broken.includes(lane);
  const isBoost = data.boost.includes(lane);
  ctx.globalAlpha = 0.18 + near * 0.75;
  ctx.fillStyle = isBoost ? "#fff3a8" : isGlass ? surfaceColor(segment.theme, "glass") : surfaceColor(segment.theme, "base");
  if (save.settings.colorblind) ctx.fillStyle = isBoost ? "#ffe45e" : isGlass ? "#78dcff" : "#bba7ff";
  polygon(ctx, [p1, p2, p3, p4]);
  ctx.fill();
  ctx.strokeStyle = isBroken ? "rgba(255,96,130,0.86)" : surfaceColor(segment.theme, "edge");
  ctx.lineWidth = Math.max(1, p1.scale * 3);
  ctx.stroke();
  if (isGlass || isBroken || isBoost) {
    ctx.globalAlpha *= 0.7;
    ctx.strokeStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
    ctx.lineTo((p3.x + p4.x) / 2, (p3.y + p4.y) / 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawSegmentItems(segment, surface) {
  const data = segment.surfaces[surface];
  for (const crystal of data.crystals) {
    if (crystal.taken) continue;
    const p = project(crystal.lane, surface, 1.8 + Math.sin(world.time * 3) * 0.2, segment.z + crystal.offset);
    drawCrystal(p.x, p.y, 13 * p.scale);
  }
  for (const power of data.powerups) {
    if (power.collected) continue;
    const p = project(power.lane, surface, 2.1 + Math.sin(world.time * 4) * 0.25, segment.z + power.offset);
    drawPower(p.x, p.y, 16 * p.scale, power.type);
  }
  for (const obstacle of data.obstacles) {
    if (!obstacle.active) continue;
    const lane = obstacleLane(obstacle, world.time);
    const p = project(lane, surface, 1.1, segment.z + obstacle.offset);
    drawObstacle(p.x, p.y, 28 * p.scale, obstacle.type);
  }
}

function drawCrystal(x, y, r) {
  ctx.fillStyle = "#fff3a8";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = Math.max(1, r * 0.16);
  polygon(ctx, [
    { x, y: y - r },
    { x: x + r * 0.65, y },
    { x, y: y + r },
    { x: x - r * 0.65, y },
  ]);
  ctx.fill();
  ctx.stroke();
}

function drawPower(x, y, r, type) {
  const label = powerLabel(type)[0] || "P";
  ctx.fillStyle = "#b8f4ff";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = Math.max(1, r * 0.12);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#6b4bff";
  ctx.font = `900 ${Math.max(9, r)}px Quicksand`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y + 1);
}

function drawObstacle(x, y, r, type) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(world.time * (type === "blade" ? 5 : 1));
  ctx.fillStyle = type === "laser" || type === "barrier" ? "#ff6f9d" : "#8b75ff";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = Math.max(1, r * 0.12);
  if (type === "blade") {
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      roundRect(ctx, -r * 0.15, -r * 1.2, r * 0.3, r * 1.1, r * 0.12);
      ctx.fill();
      ctx.stroke();
    }
  } else if (type === "laser") {
    roundRect(ctx, -r * 1.2, -r * 0.16, r * 2.4, r * 0.32, r * 0.16);
    ctx.fill();
    ctx.stroke();
  } else {
    roundRect(ctx, -r * 0.8, -r * 0.8, r * 1.6, r * 1.6, r * 0.25);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawGhost() {
  if (!ghost.length) return;
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = "#ffffff";
  for (const sample of ghost) {
    const dz = sample.forward - player.body.forward;
    if (dz < 5 || dz > 130) continue;
    const p = project(sample.lane, sample.surface, sample.height + 1, sample.forward);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 10 * p.scale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawPlayer() {
  for (const t of player.trail) {
    const p = project(t.lane, t.surface, t.height + 0.6, player.body.forward - t.age * speed * 0.9);
    ctx.globalAlpha = (1 - t.age / 0.55) * 0.42;
    ctx.fillStyle = save.selectedTrail === "nebula" ? "#b8f4ff" : "#ffd6e8";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 16 * p.scale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const [body, shine] = player.colorPair();
  const p = project(player.body.lane, player.body.surface, player.body.height + 1.1, player.body.forward + 8);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate((player.body.rotation - camera.surface) * 0.1);
  const sx = 1.08 + (1 - player.squish) * 0.25;
  const sy = player.squish;
  ctx.scale(sx * p.scale, sy * p.scale);
  const g = ctx.createRadialGradient(-10, -16, 6, 0, 0, 46);
  g.addColorStop(0, "#fff");
  g.addColorStop(0.32, shine);
  g.addColorStop(1, body);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, 35, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#5f4257";
  ctx.beginPath();
  ctx.arc(-12, -8, 4, 0, Math.PI * 2);
  ctx.arc(13, -8, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(-13, -10, 1.5, 0, Math.PI * 2);
  ctx.arc(12, -10, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#5f4257";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0.15, Math.PI - 0.15);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,143,179,0.68)";
  ctx.beginPath();
  ctx.ellipse(-22, 2, 6, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(22, 2, 6, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  if (world.powers.shield > 0) {
    ctx.strokeStyle = "rgba(184,244,255,0.9)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 45, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawForeground() {
  if (tutorialTimer > 0 && state === "playing") {
    ctx.globalAlpha = clamp(tutorialTimer / 1.5, 0, 1);
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    roundRect(ctx, W / 2 - 250, H - 76, 500, 44, 22);
    ctx.fill();
    ctx.fillStyle = "#735d87";
    ctx.font = "900 18px Quicksand";
    ctx.textAlign = "center";
    ctx.fillText("A/D move • Space jump • Q/E rotate onto walls • Shift sprint", W / 2, H - 48);
    ctx.globalAlpha = 1;
  }
  if (camera.photoMode) {
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 2;
    ctx.strokeRect(34, 34, W - 68, H - 68);
  }
}

function project(lane, surface, height, zAbs) {
  const depth = zAbs - camera.forward;
  const t = clamp(depth / 230, 0, 1);
  const perspective = (1 - t) ** 1.7;
  const scale = (0.25 + perspective * 1.35) * camera.fov;
  const baseY = H * 0.18 + perspective * H * 0.72;
  const angle = (surface - camera.surface) * Math.PI / 3 + Math.PI / 2;
  const radius = 92 * scale;
  const tangent = angle + Math.PI / 2;
  const shake = camera.shake * 8;
  const x = W / 2 + Math.cos(angle) * radius + Math.cos(tangent) * lane * 62 * scale + Math.sin(world.time * 31) * shake;
  const y = baseY + Math.sin(angle) * radius * 0.42 + Math.sin(tangent) * lane * 24 * scale - height * 30 * scale + Math.cos(world.time * 27) * shake;
  return { x, y, scale: Math.max(0.08, scale), depth };
}

function readInput() {
  input.move = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (Math.abs(input.touchMove) > 0.12) input.move = input.touchMove;
  input.jumpPressed = input.jumpQueued || (input.jump && !input.jumpHeldLastFrame);
  input.rotateLeftPressed = input.rotateLeft;
  input.rotateRightPressed = input.rotateRight;
  input.jumpHeldLastFrame = input.jump;
  input.jumpQueued = false;
  input.rotateLeft = false;
  input.rotateRight = false;
}

function key(event, down) {
  const k = event.key.toLowerCase();
  if (["arrowleft", "a"].includes(k)) input.left = down;
  if (["arrowright", "d"].includes(k)) input.right = down;
  if (k === "shift") input.sprint = down;
  if (k === " " && down) input.jump = true;
  if (k === " " && !down) input.jump = false;
  if (k === "q" && down) input.rotateLeft = true;
  if (k === "e" && down) input.rotateRight = true;
  if (k === "r" && down) start(mode);
  if ((k === "escape" || k === "p") && down) togglePause();
  if (["arrowleft", "arrowright", " ", "shift"].includes(k)) event.preventDefault();
}

function togglePause() {
  if (state === "playing") {
    state = "paused";
    ui.showPause();
  } else if (state === "paused") {
    state = "playing";
    ui.hidePause();
  }
}

function togglePhotoMode() {
  camera.photoMode = !camera.photoMode;
  toast(camera.photoMode ? "Photo mode on" : "Photo mode off");
}

function toggleFullscreen() {
  if (!document.fullscreenElement) document.querySelector(".game-frame").requestFullscreen?.();
  else document.exitFullscreen?.();
}

function toast(text) {
  ui.toast(text);
}

function loop(now) {
  const dt = Math.min(1 / 30, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", e => key(e, true));
window.addEventListener("keyup", e => key(e, false));
window.addEventListener("squish-settings", () => {
  audio.applySettings();
  fitCanvas();
});

canvas.addEventListener("pointerdown", () => {
  if (state === "playing") input.jumpQueued = true;
});

ui.bind({ start, togglePause, togglePhotoMode, toggleFullscreen });
attachTouchControls(input);
fitCanvas();
world.reset(baseSeed);
ui.clearLoading();
ui.showHome();
requestAnimationFrame(loop);
