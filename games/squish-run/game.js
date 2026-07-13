/* Squish Run: a dependency-free gravity tunnel runner built for local files and GitHub Pages. */
(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });
  let W = 960;
  let H = 600;
  const TAU = Math.PI * 2;
  const SIDES = 6;
  const APOTHEM = 5.5;
  const HALF_SIDE = APOTHEM * Math.tan(Math.PI / SIDES);
  const LANE_WIDTH = (HALF_SIDE * 2) / 3;
  const EDGE = HALF_SIDE - 0.22;
  const STORAGE_KEY = "gabi_squish_run_v3";
  const SEGMENT_LENGTH = 15;
  const DRAW_DISTANCE = 235;

  const THEMES = [
    { name: "Strawberry Station", wall: "#f6a7ca", wall2: "#ffd7e8", trim: "#fff4fa", accent: "#ff6f9d", glow: "#ffb9d4", sky1: "#161735", sky2: "#4b315f" },
    { name: "Bluebell Crossing", wall: "#8ecff2", wall2: "#d5f4ff", trim: "#f4fcff", accent: "#5d91df", glow: "#9ee8ff", sky1: "#101a3e", sky2: "#314d78" },
    { name: "Lemon Moonway", wall: "#f6df83", wall2: "#fff6c5", trim: "#fffdf1", accent: "#e8b94f", glow: "#fff0a1", sky1: "#202044", sky2: "#5d5072" },
    { name: "Mint Comet Line", wall: "#83dfc1", wall2: "#d6fff0", trim: "#f2fff9", accent: "#48b59a", glow: "#9ff4d6", sky1: "#102f3d", sky2: "#345b68" },
    { name: "Lavender Orbit", wall: "#b7a3ee", wall2: "#ece5ff", trim: "#fbf9ff", accent: "#806bd7", glow: "#cbbdff", sky1: "#19163c", sky2: "#493b70" },
    { name: "Peach Nova", wall: "#ffb59e", wall2: "#ffe1d7", trim: "#fff8f5", accent: "#f17d72", glow: "#ffcabb", sky1: "#261836", sky2: "#69405d" },
  ];

  const ui = {
    home: document.getElementById("screen-home"),
    pause: document.getElementById("screen-pause"),
    over: document.getElementById("screen-over"),
    panel: document.getElementById("screen-panel"),
    loading: document.getElementById("loading-screen"),
    name: document.getElementById("name-input"),
    seed: document.getElementById("seed-input"),
    distance: document.getElementById("hud-distance"),
    score: document.getElementById("hud-score"),
    crystals: document.getElementById("hud-crystals"),
    level: document.getElementById("hud-level"),
    toast: document.getElementById("toast-stack"),
    summary: document.getElementById("summary-grid"),
    overTitle: document.getElementById("over-title"),
    panelTitle: document.getElementById("panel-title"),
    panelBody: document.getElementById("panel-body"),
  };

  const save = loadSave();
  const state = {
    mode: "home",
    selectedMode: "explore",
    time: 0,
    lastTime: performance.now(),
    accumulator: 0,
    seed: 1,
    nextIndex: 0,
    segments: [],
    particles: [],
    cameraZ: 0,
    cameraRoll: 0,
    cameraRollTarget: 0,
    cameraBob: 0,
    shake: 0,
    fov: 1,
    speed: 22,
    distance: 0,
    score: 0,
    crystals: 0,
    level: 1,
    currentTheme: 0,
    startTime: 0,
    audio: null,
    muted: save.muted || false,
    reducedMotion: save.reducedMotion || false,
    trail: [],
    runName: "Dumpling",
  };

  const input = {
    left: false,
    right: false,
    jump: false,
    sprint: false,
    rotateLeft: false,
    rotateRight: false,
    touchMove: 0,
    jumpPressed: false,
    jumpReleased: false,
  };

  const player = {
    z: 12,
    lane: 0,
    laneVelocity: 0,
    height: 0,
    verticalVelocity: 0,
    surface: 0,
    grounded: true,
    coyote: 0,
    jumpBuffer: 0,
    jumpHold: 0,
    edgeCooldown: 0,
    landing: 0,
    squash: 1,
    blink: 2,
    step: 0,
    shield: 0,
    doubleJump: 0,
    doubleReady: false,
    slowMotion: 0,
    boost: 0,
    magnet: 0,
    multiplier: 0,
    lowGravity: 0,
    invulnerable: 0,
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, amount) {
    return a + (b - a) * amount;
  }

  function damp(a, b, smoothing, dt) {
    return lerp(a, b, 1 - Math.pow(smoothing, dt));
  }

  function mod(value, divisor) {
    return ((value % divisor) + divisor) % divisor;
  }

  function hash(text) {
    let value = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      value ^= text.charCodeAt(i);
      value = Math.imul(value, 16777619);
    }
    return value >>> 0;
  }

  function random() {
    state.seed += 0x6D2B79F5;
    let value = state.seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  function choose(values) {
    return values[Math.floor(random() * values.length)];
  }

  function loadSave() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        bestDistance: stored.bestDistance || 0,
        bestScore: stored.bestScore || 0,
        totalCrystals: stored.totalCrystals || 0,
        gamesPlayed: stored.gamesPlayed || 0,
        runs: Array.isArray(stored.runs) ? stored.runs.slice(0, 25) : [],
        name: stored.name || "",
        muted: Boolean(stored.muted),
        reducedMotion: Boolean(stored.reducedMotion),
      };
    } catch {
      return { bestDistance: 0, bestScore: 0, totalCrystals: 0, gamesPlayed: 0, runs: [], name: "", muted: false, reducedMotion: false };
    }
  }

  function persist() {
    save.muted = state.muted;
    save.reducedMotion = state.reducedMotion;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  }

  function fitCanvas() {
    const portrait = window.matchMedia("(hover: none), (max-width: 760px)").matches;
    W = portrait ? 600 : 960;
    H = portrait ? 750 : 600;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function hideScreens() {
    [ui.home, ui.pause, ui.over, ui.panel].forEach((element) => element.classList.add("hide"));
  }

  function showToast(message) {
    const node = document.createElement("div");
    node.className = "toast";
    node.textContent = message;
    ui.toast.appendChild(node);
    window.setTimeout(() => node.remove(), 1800);
  }

  function unlockAudio() {
    if (state.audio) {
      if (state.audio.state === "suspended") state.audio.resume();
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) state.audio = new AudioContext();
  }

  function sound(frequency, duration = 0.08, type = "sine", volume = 0.035, slide = 0) {
    if (!state.audio || state.muted) return;
    const now = state.audio.currentTime;
    const oscillator = state.audio.createOscillator();
    const gain = state.audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    if (slide) oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, frequency + slide), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(state.audio.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  function resetPlayer() {
    Object.assign(player, {
      z: 12,
      lane: 0,
      laneVelocity: 0,
      height: 0,
      verticalVelocity: 0,
      surface: 0,
      grounded: true,
      coyote: 0,
      jumpBuffer: 0,
      jumpHold: 0,
      edgeCooldown: 0,
      landing: 0,
      squash: 1,
      blink: 1.8,
      step: 0,
      shield: 0,
      doubleJump: 0,
      doubleReady: false,
      slowMotion: 0,
      boost: 0,
      magnet: 0,
      multiplier: 0,
      lowGravity: 0,
      invulnerable: 1,
    });
  }

  function startGame() {
    unlockAudio();
    const seedText = `${state.selectedMode}:${ui.seed.value || new Date().toISOString().slice(0, state.selectedMode === "daily" ? 10 : 19)}`;
    state.seed = hash(seedText);
    state.nextIndex = 0;
    state.segments = [];
    state.particles = [];
    state.trail = [];
    state.cameraZ = 0;
    state.cameraRoll = 0;
    state.cameraRollTarget = 0;
    state.cameraBob = 0;
    state.shake = 0;
    state.fov = 1;
    state.speed = state.selectedMode === "timeTrial" ? 24 : 22;
    state.distance = 0;
    state.score = 0;
    state.crystals = 0;
    state.level = 1;
    state.currentTheme = 0;
    state.startTime = performance.now();
    state.runName = (ui.name.value.trim() || save.name || "Dumpling").slice(0, 12);
    save.name = state.runName;
    resetPlayer();
    for (let i = 0; i < 34; i += 1) generateSegment();
    hideScreens();
    state.mode = "playing";
    sound(520, 0.1, "triangle", 0.04, 180);
    showToast(THEMES[0].name);
  }

  function generateSegment() {
    const index = state.nextIndex;
    const difficulty = clamp((index - 7) / 110, 0, 1);
    const tutorial = index < 7;
    const themeIndex = Math.floor(index / 18) % THEMES.length;
    const surfaces = [];

    for (let surfaceIndex = 0; surfaceIndex < SIDES; surfaceIndex += 1) {
      const cells = [];
      for (let lane = 0; lane < 3; lane += 1) {
        const specialRoll = random();
        cells.push({
          open: true,
          kind: !tutorial && specialRoll < 0.035 + difficulty * 0.04 ? "crumble" : !tutorial && specialRoll < 0.06 + difficulty * 0.05 ? "glass" : !tutorial && specialRoll < 0.075 + difficulty * 0.055 ? "boost" : "solid",
          collapse: 0,
          triggered: false,
        });
      }
      surfaces.push({ cells, obstacle: null, power: null });
    }

    if (!tutorial) carvePattern(surfaces, index, difficulty);

    const routeSurface = index < 10 ? 0 : Math.floor(index / 7) % SIDES;
    const routeLane = (Math.floor(index / 4) + index) % 3;
    surfaces[routeSurface].cells[routeLane].open = true;
    surfaces[routeSurface].cells[routeLane].kind = index % 13 === 0 ? "boost" : "solid";

    if (!tutorial && random() < 0.14 + difficulty * 0.16) {
      const surfaceIndex = random() < 0.7 ? routeSurface : Math.floor(random() * SIDES);
      const available = [0, 1, 2].filter((lane) => surfaces[surfaceIndex].cells[lane].open && !(surfaceIndex === routeSurface && lane === routeLane));
      if (available.length) {
        surfaces[surfaceIndex].obstacle = {
          type: choose(["laser", "block", "spinner", "mine"]),
          lane: choose(available),
          phase: random() * TAU,
        };
      }
    }

    if (!tutorial && random() < 0.05) {
      const surfaceIndex = Math.floor(random() * SIDES);
      const available = [0, 1, 2].filter((lane) => surfaces[surfaceIndex].cells[lane].open);
      surfaces[surfaceIndex].power = {
        type: choose(["shield", "double", "slow", "boost", "magnet", "multi", "low"]),
        lane: choose(available),
        taken: false,
      };
    }

    const crystalSurface = random() < 0.75 ? routeSurface : Math.floor(random() * SIDES);
    const crystalLanes = [0, 1, 2].filter((lane) => surfaces[crystalSurface].cells[lane].open);
    state.segments.push({
      index,
      z: index * SEGMENT_LENGTH,
      length: SEGMENT_LENGTH + 0.08,
      themeIndex,
      surfaces,
      crystal: random() < 0.72 ? { surface: crystalSurface, lane: choose(crystalLanes), taken: false } : null,
    });
    state.nextIndex += 1;
  }

  function carvePattern(surfaces, index, difficulty) {
    const pattern = index % 9 === 0 ? "bridge" : index % 7 === 0 ? "side" : index % 5 === 0 ? "window" : "scatter";
    if (pattern === "bridge") {
      const surface = Math.floor(random() * SIDES);
      const safeLane = Math.floor(random() * 3);
      surfaces[surface].cells.forEach((cell, lane) => { cell.open = lane === safeLane; });
      return;
    }
    if (pattern === "side") {
      const surface = Math.floor(random() * SIDES);
      const lane = random() < 0.5 ? 0 : 2;
      surfaces[surface].cells[lane].open = false;
      surfaces[mod(surface + 1, SIDES)].cells[2 - lane].open = false;
      return;
    }
    if (pattern === "window") {
      const surface = Math.floor(random() * SIDES);
      surfaces[surface].cells[Math.floor(random() * 3)].open = false;
      return;
    }
    const holes = 1 + Math.floor(random() * (1 + difficulty * 4));
    for (let i = 0; i < holes; i += 1) {
      const surface = Math.floor(random() * SIDES);
      const lane = Math.floor(random() * 3);
      surfaces[surface].cells[lane].open = false;
    }
  }

  function segmentAt(z) {
    return state.segments.find((segment) => z >= segment.z && z < segment.z + segment.length);
  }

  function laneIndex(lane) {
    return clamp(Math.floor((lane + HALF_SIDE) / LANE_WIDTH), 0, 2);
  }

  function floorAt(z, surface, lane) {
    const segment = segmentAt(z);
    if (!segment) return null;
    const cell = segment.surfaces[mod(surface, SIDES)].cells[laneIndex(lane)];
    if (!cell || !cell.open || cell.collapse > 0.44) return null;
    const fall = cell.collapse > 0.18 ? -Math.pow((cell.collapse - 0.18) * 7, 2) * 0.18 : 0;
    return { segment, cell, height: fall };
  }

  function update(dt) {
    if (state.mode !== "playing") return;
    const motionScale = player.slowMotion > 0 ? 0.62 : 1;
    const step = dt * motionScale;
    const horizontal = clamp((input.right ? 1 : 0) - (input.left ? 1 : 0) + input.touchMove, -1, 1);
    const acceleration = player.grounded ? 32 : 13;
    const maxSideSpeed = player.grounded ? 6.8 : 5.1;
    player.laneVelocity += horizontal * acceleration * step;
    player.laneVelocity *= Math.pow(player.grounded ? 0.004 : 0.11, step);
    player.laneVelocity = clamp(player.laneVelocity, -maxSideSpeed, maxSideSpeed);
    player.lane += player.laneVelocity * step;
    player.edgeCooldown = Math.max(0, player.edgeCooldown - step);
    transferAtEdge(horizontal);

    if (input.jumpPressed) player.jumpBuffer = 0.13;
    player.jumpBuffer = Math.max(0, player.jumpBuffer - step);
    player.coyote = player.grounded ? 0.12 : Math.max(0, player.coyote - step);
    if (player.jumpBuffer > 0 && (player.grounded || player.coyote > 0 || player.doubleReady)) doJump();

    if (input.jump && player.verticalVelocity > 0 && player.jumpHold > 0) {
      player.verticalVelocity += 19 * step;
      player.jumpHold -= step;
    }
    if (input.jumpReleased && player.verticalVelocity > 4) player.verticalVelocity *= 0.58;

    if (input.rotateLeft) manualRotate(1);
    if (input.rotateRight) manualRotate(-1);
    input.jumpPressed = false;
    input.jumpReleased = false;
    input.rotateLeft = false;
    input.rotateRight = false;

    const sprintFactor = input.sprint ? 1.22 : 1;
    const boostFactor = player.boost > 0 ? 1.28 : 1;
    state.speed = Math.min(48, state.speed + step * 0.19);
    const forwardSpeed = state.speed * sprintFactor * boostFactor;
    player.z += forwardSpeed * step;
    state.distance = Math.max(0, Math.floor(player.z - 12));
    state.score += forwardSpeed * step * (player.multiplier > 0 ? 3.6 : 1.8);
    player.step += forwardSpeed * step * 0.34;

    const gravity = 34 * (player.lowGravity > 0 ? 0.52 : 1);
    player.verticalVelocity -= gravity * step;
    player.height += player.verticalVelocity * step;
    const floor = floorAt(player.z, player.surface, player.lane);
    if (floor && floor.cell.kind === "crumble" && !floor.cell.triggered && player.grounded) floor.cell.triggered = true;
    if (floor && player.height <= floor.height && player.verticalVelocity <= 0) landOn(floor);
    else player.grounded = false;

    if (!floor && player.height < -9) return endRun("Lost in the starlight");

    updateCells(step);
    updatePowers(step);
    updateCollectibles();
    updateObstacles();
    updateParticles(step);
    streamWorld();

    player.landing = Math.max(0, player.landing - step);
    player.squash = damp(player.squash, player.grounded ? 1 : 1.06, 0.0015, step);
    player.blink -= step;
    if (player.blink < 0) player.blink = 2.1 + random() * 2.7;
    player.invulnerable = Math.max(0, player.invulnerable - step);

    const previousLevel = state.level;
    state.level = Math.floor(state.distance / 270) + 1;
    state.currentTheme = Math.floor((player.z / SEGMENT_LENGTH) / 18) % THEMES.length;
    if (state.level !== previousLevel) {
      showToast(`Level ${state.level}: ${THEMES[state.currentTheme].name}`);
      sound(620, 0.09, "triangle", 0.035, 220);
      if (state.selectedMode === "explore") state.speed = Math.max(23, state.speed - 2.2);
    }
    if (state.selectedMode === "timeTrial" && state.distance >= 1200) return endRun("Time trial complete!");

    state.cameraZ = damp(state.cameraZ, player.z - 11.5, 0.0005, step);
    state.cameraRoll = damp(state.cameraRoll, state.cameraRollTarget, 0.00016, step);
    state.cameraBob = damp(state.cameraBob, player.grounded ? Math.sin(player.step) * 1.7 : -2, 0.014, step);
    state.fov = damp(state.fov, input.sprint ? 1.08 : 1, 0.002, step);
    state.shake = Math.max(0, state.shake - step * 2.6);

    state.trail.push({ z: player.z - 0.5, lane: player.lane, surface: player.surface, height: player.height + 0.6, life: 0.35 });
    state.trail.forEach((trail) => { trail.life -= step; });
    state.trail = state.trail.filter((trail) => trail.life > 0).slice(-18);

    ui.distance.textContent = `${state.distance}m`;
    ui.score.textContent = Math.floor(state.score).toLocaleString();
    ui.crystals.textContent = state.crystals;
    ui.level.textContent = state.level;
  }

  function transferAtEdge(horizontal) {
    if (player.edgeCooldown > 0 || Math.abs(horizontal) < 0.35 || player.height > 2.8) {
      player.lane = clamp(player.lane, -EDGE - 0.16, EDGE + 0.16);
      return;
    }
    if (player.lane > EDGE) rotateGravity(-1, -EDGE + 0.14, 1);
    else if (player.lane < -EDGE) rotateGravity(1, EDGE - 0.14, -1);
  }

  function rotateGravity(surfaceDelta, newLane, rollDirection) {
    const nextSurface = mod(player.surface + surfaceDelta, SIDES);
    const nextFloor = floorAt(player.z + 0.8, nextSurface, newLane);
    if (!nextFloor) {
      player.lane = clamp(player.lane, -EDGE, EDGE);
      player.laneVelocity *= -0.18;
      return;
    }
    player.surface = nextSurface;
    player.lane = newLane;
    player.height = Math.max(0.05, player.height * 0.42);
    player.verticalVelocity = Math.min(2, player.verticalVelocity * 0.2);
    player.grounded = player.height < 0.5;
    player.edgeCooldown = 0.18;
    player.laneVelocity *= 0.72;
    state.cameraRollTarget += rollDirection * Math.PI / 3;
    sound(310 + player.surface * 28, 0.09, "sine", 0.025, 90);
    burst(player.lane, player.surface, player.z, THEMES[state.currentTheme].glow, 8);
  }

  function manualRotate(direction) {
    if (!player.grounded || player.edgeCooldown > 0) return;
    const newLane = direction > 0 ? EDGE - 0.1 : -EDGE + 0.1;
    rotateGravity(direction, newLane, -direction);
  }

  function doJump() {
    if (!player.grounded && player.coyote <= 0 && player.doubleReady) player.doubleReady = false;
    player.verticalVelocity = player.lowGravity > 0 ? 14.8 : 16.5;
    player.height = Math.max(0.05, player.height);
    player.grounded = false;
    player.coyote = 0;
    player.jumpBuffer = 0;
    player.jumpHold = 0.16;
    player.squash = 0.78;
    burst(player.lane, player.surface, player.z, "#fff5fb", 10);
    sound(480, 0.08, "triangle", 0.04, 190);
  }

  function landOn(floor) {
    const impact = Math.abs(player.verticalVelocity);
    const wasGrounded = player.grounded;
    player.height = floor.height;
    player.verticalVelocity = 0;
    player.grounded = true;
    player.doubleReady = player.doubleJump > 0;
    if (!wasGrounded && impact > 7) {
      player.landing = 0.18;
      player.squash = clamp(1 - impact / 42, 0.68, 0.88);
      state.shake = state.reducedMotion ? 0 : clamp(impact / 45, 0.12, 0.48);
      burst(player.lane, player.surface, player.z, THEMES[floor.segment.themeIndex].glow, 14);
      sound(155, 0.07, "triangle", 0.03);
    }
    if (floor.cell.kind === "boost") {
      player.boost = Math.max(player.boost, 1.2);
      state.score += 35;
    }
  }

  function updateCells(dt) {
    for (const segment of state.segments) {
      for (const surface of segment.surfaces) {
        for (const cell of surface.cells) {
          if (cell.triggered) cell.collapse += dt;
        }
      }
    }
  }

  function updatePowers(dt) {
    ["shield", "doubleJump", "slowMotion", "boost", "magnet", "multiplier", "lowGravity"].forEach((key) => {
      player[key] = Math.max(0, player[key] - dt);
    });
  }

  function updateCollectibles() {
    const segment = segmentAt(player.z);
    if (!segment) return;
    const centerZ = segment.z + segment.length * 0.55;
    if (segment.crystal && !segment.crystal.taken && segment.crystal.surface === player.surface) {
      const crystalLane = laneCenter(segment.crystal.lane);
      const range = player.magnet > 0 ? 1.9 : 0.65;
      if (Math.abs(player.z - centerZ) < (player.magnet > 0 ? 5 : 2.2) && Math.abs(player.lane - crystalLane) < range) {
        segment.crystal.taken = true;
        state.crystals += 1;
        state.score += player.multiplier > 0 ? 120 : 60;
        burst(crystalLane, player.surface, centerZ, "#fff3a8", 18);
        sound(920, 0.07, "sine", 0.035, 180);
      }
    }
    const power = segment.surfaces[player.surface].power;
    if (power && !power.taken && Math.abs(player.z - centerZ) < 2.2 && Math.abs(player.lane - laneCenter(power.lane)) < 0.7) {
      power.taken = true;
      applyPower(power.type);
    }
  }

  function applyPower(type) {
    const map = {
      shield: ["shield", 12, "Bubble Shield"],
      double: ["doubleJump", 14, "Double Jump"],
      slow: ["slowMotion", 7, "Starry Slow Motion"],
      boost: ["boost", 5, "Comet Boost"],
      magnet: ["magnet", 11, "Crystal Magnet"],
      multi: ["multiplier", 12, "Score Sparkle x2"],
      low: ["lowGravity", 9, "Moon Gravity"],
    };
    const [key, duration, label] = map[type];
    player[key] = duration;
    if (key === "doubleJump") player.doubleReady = true;
    showToast(label);
    sound(650, 0.13, "triangle", 0.04, 260);
  }

  function updateObstacles() {
    if (player.invulnerable > 0) return;
    const segment = segmentAt(player.z);
    if (!segment) return;
    const obstacle = segment.surfaces[player.surface].obstacle;
    if (!obstacle || obstacle.hit) return;
    const centerZ = segment.z + segment.length * 0.58;
    if (Math.abs(player.z - centerZ) > 1.45) return;
    const laneDistance = Math.abs(player.lane - laneCenter(obstacle.lane));
    const movingOffset = obstacle.type === "block" ? Math.sin(state.time * 1.6 + obstacle.phase) * 0.55 : 0;
    if (laneDistance < 0.72 + Math.abs(movingOffset) * 0.15 && player.height < (obstacle.type === "laser" ? 1.2 : 1.75)) {
      obstacle.hit = true;
      if (player.shield > 0) {
        player.shield = 0;
        player.invulnerable = 0.8;
        showToast("Shield saved the run");
        burst(player.lane, player.surface, player.z, "#b8f4ff", 28);
        sound(230, 0.12, "square", 0.035, 260);
      } else endRun(`${obstacle.type[0].toUpperCase()}${obstacle.type.slice(1)} collision`);
    }
  }

  function streamWorld() {
    state.segments = state.segments.filter((segment) => segment.z + segment.length > state.cameraZ - 18);
    while (state.segments.length < 34) generateSegment();
  }

  function endRun(reason) {
    if (state.mode !== "playing") return;
    state.mode = "over";
    const finalScore = Math.floor(state.score + state.distance * 0.75 + state.crystals * 70);
    state.score = finalScore;
    const elapsed = Math.max(1, Math.floor((performance.now() - state.startTime) / 1000));
    save.bestDistance = Math.max(save.bestDistance, state.distance);
    save.bestScore = Math.max(save.bestScore, finalScore);
    save.totalCrystals += state.crystals;
    save.gamesPlayed += 1;
    save.runs.push({ name: state.runName, score: finalScore, distance: state.distance, crystals: state.crystals, mode: state.selectedMode, time: elapsed, date: Date.now() });
    save.runs.sort((a, b) => b.score - a.score || b.distance - a.distance);
    save.runs = save.runs.slice(0, 25);
    persist();
    ui.overTitle.textContent = reason;
    ui.summary.innerHTML = `
      <div>Distance<br><strong>${state.distance}m</strong></div>
      <div>Score<br><strong>${finalScore.toLocaleString()}</strong></div>
      <div>Crystals<br><strong>${state.crystals}</strong></div>
      <div>Level<br><strong>${state.level}</strong></div>`;
    hideScreens();
    ui.over.classList.remove("hide");
    state.shake = state.reducedMotion ? 0 : 0.8;
    sound(150, 0.16, "sawtooth", 0.04, -60);
  }

  function burst(lane, surface, z, color, count) {
    for (let i = 0; i < count; i += 1) {
      state.particles.push({
        lane: lane + (random() - 0.5) * 0.7,
        surface,
        z: z + (random() - 0.5) * 1.2,
        height: 0.4 + random() * 1.3,
        velocityLane: (random() - 0.5) * 1.8,
        velocityHeight: 1 + random() * 3,
        color,
        life: 0.42 + random() * 0.45,
        size: 0.05 + random() * 0.1,
      });
    }
    state.particles = state.particles.slice(-300);
  }

  function updateParticles(dt) {
    for (const particle of state.particles) {
      particle.lane += particle.velocityLane * dt;
      particle.height += particle.velocityHeight * dt;
      particle.velocityHeight -= 7 * dt;
      particle.life -= dt;
    }
    state.particles = state.particles.filter((particle) => particle.life > 0);
  }

  function laneCenter(index) {
    return -HALF_SIDE + LANE_WIDTH * (index + 0.5);
  }

  function surfacePoint(surface, lane, height, z) {
    const theta = Math.PI / 2 + surface * TAU / SIDES;
    const normalX = Math.cos(theta);
    const normalY = Math.sin(theta);
    const tangentX = Math.sin(theta);
    const tangentY = -Math.cos(theta);
    return {
      x: normalX * (APOTHEM - height) + tangentX * lane,
      y: normalY * (APOTHEM - height) + tangentY * lane,
      z,
    };
  }

  function projectPoint(point) {
    const cos = Math.cos(state.cameraRoll);
    const sin = Math.sin(state.cameraRoll);
    const rotatedX = point.x * cos - point.y * sin;
    const rotatedY = point.x * sin + point.y * cos;
    const depth = Math.max(5.4, point.z - state.cameraZ);
    const focal = W * (H > W ? 0.72 : 0.51) * state.fov;
    const scale = focal / (depth + 2.6);
    const shakeX = state.shake * Math.sin(state.time * 43) * 5;
    const shakeY = state.shake * Math.cos(state.time * 37) * 4;
    return {
      x: W / 2 + rotatedX * scale + shakeX,
      y: H * 0.43 + rotatedY * scale + state.cameraBob + shakeY,
      scale,
      depth,
    };
  }

  function project(surface, lane, height, z) {
    return projectPoint(surfacePoint(surface, lane, height, z));
  }

  function draw() {
    drawSpace();
    drawTunnel();
    drawTrails();
    drawParticles();
    drawPlayer();
    drawVignette();
    drawTutorial();
  }

  function drawSpace() {
    const theme = THEMES[state.currentTheme];
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, theme.sky1);
    gradient.addColorStop(0.55, "#18254d");
    gradient.addColorStop(1, theme.sky2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 120; i += 1) {
      const x = mod(i * 179.7 - state.cameraZ * (0.7 + i % 4 * 0.1), W + 30) - 15;
      const y = mod(i * 83.3 + Math.sin(i * 2.1) * 80, H);
      const radius = 0.7 + (i % 5) * 0.34;
      ctx.globalAlpha = 0.25 + (i % 7) * 0.065;
      ctx.fillStyle = i % 4 === 0 ? theme.glow : "#fff";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    drawNebula(170, 150, 170, theme.glow);
    drawNebula(790, 410, 205, theme.accent);
    drawPlanet(118, 132, 48, theme.wall2, theme.accent);
    drawPlanet(835, 96, 30, "#b8f4ff", "#b5a4ef");
  }

  function drawNebula(x, y, radius, color) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, colorWithAlpha(color, 0.16));
    gradient.addColorStop(1, colorWithAlpha(color, 0));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.fill();
  }

  function drawPlanet(x, y, radius, colorA, colorB) {
    const gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.35, 2, x, y, radius);
    gradient.addColorStop(0, "#fff");
    gradient.addColorStop(0.34, colorA);
    gradient.addColorStop(1, colorB);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.38)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(x, y, radius * 1.55, radius * 0.3, -0.2, 0, TAU);
    ctx.stroke();
  }

  function drawTunnel() {
    const visible = state.segments
      .filter((segment) => segment.z + segment.length > state.cameraZ + 4 && segment.z < state.cameraZ + DRAW_DISTANCE)
      .sort((a, b) => b.z - a.z);

    drawFarPortal();
    for (const segment of visible) {
      for (let surface = 0; surface < SIDES; surface += 1) drawSurface(segment, surface);
      if (segment.index % 6 === 0) drawRing(segment.z + segment.length - 0.15, segment.themeIndex);
      for (let surface = 0; surface < SIDES; surface += 1) drawSegmentItems(segment, surface);
    }
  }

  function drawFarPortal() {
    const center = projectPoint({ x: 0, y: 0, z: state.cameraZ + DRAW_DISTANCE - 12 });
    const gradient = ctx.createRadialGradient(center.x, center.y, 2, center.x, center.y, 90);
    gradient.addColorStop(0, "rgba(4,6,22,0.98)");
    gradient.addColorStop(0.42, "rgba(20,28,66,0.72)");
    gradient.addColorStop(1, "rgba(184,244,255,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(center.x, center.y, 90, 0, TAU);
    ctx.fill();
  }

  function drawSurface(segment, surfaceIndex) {
    const surface = segment.surfaces[surfaceIndex];
    const allPlain = surface.cells.every((cell) => cell.open && cell.kind === "solid");
    if (allPlain) {
      drawPanel(segment, surfaceIndex, -HALF_SIDE, HALF_SIDE, "solid", surface.cells[0]);
      drawPanelDetail(segment, surfaceIndex);
      return;
    }
    for (let lane = 0; lane < 3; lane += 1) {
      const cell = surface.cells[lane];
      const from = -HALF_SIDE + lane * LANE_WIDTH;
      const to = from + LANE_WIDTH;
      if (cell.open && cell.collapse < 0.92) drawPanel(segment, surfaceIndex, from, to, cell.kind, cell);
      else drawHoleEdge(segment, surfaceIndex, from, to);
    }
  }

  function drawPanel(segment, surface, laneFrom, laneTo, kind, cell) {
    const zNear = Math.max(segment.z + 0.06, state.cameraZ + 5.6);
    const zFar = segment.z + segment.length - 0.06;
    if (zFar <= zNear) return;
    const fall = cell.collapse > 0.18 ? -Math.pow((cell.collapse - 0.18) * 7, 2) * 0.18 : 0;
    const a = project(surface, laneFrom + 0.025, fall, zNear);
    const b = project(surface, laneTo - 0.025, fall, zNear);
    const c = project(surface, laneTo - 0.025, fall, zFar);
    const d = project(surface, laneFrom + 0.025, fall, zFar);
    const theme = THEMES[segment.themeIndex];
    const depthAlpha = clamp(1 - (zNear - state.cameraZ) / DRAW_DISTANCE, 0.2, 1);
    const gradient = ctx.createLinearGradient(a.x, a.y, c.x, c.y);
    if (kind === "glass") {
      gradient.addColorStop(0, colorWithAlpha("#dffaff", 0.68));
      gradient.addColorStop(0.52, colorWithAlpha(theme.wall2, 0.48));
      gradient.addColorStop(1, colorWithAlpha("#a7e7f4", 0.34));
    } else if (kind === "boost") {
      gradient.addColorStop(0, "#fffbd5");
      gradient.addColorStop(0.48, "#ffe889");
      gradient.addColorStop(1, theme.wall2);
    } else {
      gradient.addColorStop(0, theme.wall2);
      gradient.addColorStop(0.38, theme.wall);
      gradient.addColorStop(1, shadeColor(theme.wall, -18));
    }
    ctx.globalAlpha = depthAlpha;
    ctx.fillStyle = gradient;
    polygon([a, b, c, d]);
    ctx.fill();
    ctx.strokeStyle = kind === "crumble" ? colorWithAlpha(theme.accent, 0.8) : colorWithAlpha(theme.trim, 0.42);
    ctx.lineWidth = clamp(a.scale * 0.035, 0.6, 2.6);
    ctx.stroke();

    if (kind === "glass") drawGlassDetail(a, b, c, d, depthAlpha);
    if (kind === "crumble") drawCracks(a, b, c, d, depthAlpha, cell.collapse);
    if (kind === "boost") drawBoostMark(a, b, c, d, depthAlpha);
    ctx.globalAlpha = 1;
  }

  function drawPanelDetail(segment, surface) {
    if (segment.index % 3 !== 0) return;
    const z = segment.z + 0.18;
    if (z <= state.cameraZ + 5.6) return;
    const a = project(surface, -HALF_SIDE + 0.1, 0.015, z);
    const b = project(surface, HALF_SIDE - 0.1, 0.015, z);
    ctx.globalAlpha = clamp(1 - (z - state.cameraZ) / DRAW_DISTANCE, 0.08, 0.32);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = clamp(a.scale * 0.04, 0.7, 2.4);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawHoleEdge(segment, surface, laneFrom, laneTo) {
    const zNear = Math.max(segment.z + 0.1, state.cameraZ + 5.7);
    const zFar = segment.z + segment.length - 0.1;
    if (zFar <= zNear) return;
    const points = [
      project(surface, laneFrom + 0.03, -0.01, zNear),
      project(surface, laneTo - 0.03, -0.01, zNear),
      project(surface, laneTo - 0.03, -0.01, zFar),
      project(surface, laneFrom + 0.03, -0.01, zFar),
    ];
    ctx.globalAlpha = clamp(1 - (zNear - state.cameraZ) / DRAW_DISTANCE, 0.2, 0.82);
    ctx.strokeStyle = "rgba(232,247,255,0.46)";
    ctx.lineWidth = clamp(points[0].scale * 0.04, 0.7, 2.8);
    polygon(points);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawGlassDetail(a, b, c, d, alpha) {
    ctx.globalAlpha = alpha * 0.42;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lerp(a.x, b.x, 0.24), lerp(a.y, b.y, 0.24));
    ctx.lineTo(lerp(d.x, c.x, 0.64), lerp(d.y, c.y, 0.64));
    ctx.moveTo(lerp(a.x, d.x, 0.3), lerp(a.y, d.y, 0.3));
    ctx.lineTo(lerp(b.x, c.x, 0.56), lerp(b.y, c.y, 0.56));
    ctx.stroke();
  }

  function drawCracks(a, b, c, d, alpha, collapse) {
    ctx.globalAlpha = alpha * (0.45 + collapse * 0.4);
    ctx.strokeStyle = "rgba(90,61,83,0.72)";
    ctx.lineWidth = 1.15;
    const centerX = (a.x + b.x + c.x + d.x) / 4;
    const centerY = (a.y + b.y + c.y + d.y) / 4;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(lerp(a.x, d.x, 0.34), lerp(a.y, d.y, 0.34));
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(lerp(b.x, c.x, 0.62), lerp(b.y, c.y, 0.62));
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(lerp(a.x, b.x, 0.28), lerp(a.y, b.y, 0.28));
    ctx.stroke();
  }

  function drawBoostMark(a, b, c, d, alpha) {
    ctx.globalAlpha = alpha * 0.7;
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    for (const amount of [0.35, 0.56]) {
      const x = lerp(lerp(a.x, b.x, 0.5), lerp(d.x, c.x, 0.5), amount);
      const y = lerp(lerp(a.y, b.y, 0.5), lerp(d.y, c.y, 0.5), amount);
      const width = Math.max(2, Math.abs(b.x - a.x) * 0.16);
      const height = Math.max(2, Math.abs(d.y - a.y) * 0.04);
      ctx.beginPath();
      ctx.moveTo(x, y - height);
      ctx.lineTo(x + width, y + height);
      ctx.lineTo(x, y);
      ctx.lineTo(x - width, y + height);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawRing(z, themeIndex) {
    if (z <= state.cameraZ + 5.6) return;
    const points = [];
    for (let side = 0; side < SIDES; side += 1) points.push(project(side, -HALF_SIDE, -0.035, z));
    const alpha = clamp(1 - (z - state.cameraZ) / DRAW_DISTANCE, 0.08, 0.58);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = THEMES[themeIndex].trim;
    ctx.lineWidth = clamp(points[0].scale * 0.07, 0.8, 4);
    polygon(points);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawSegmentItems(segment, surface) {
    const z = segment.z + segment.length * 0.55;
    if (z <= state.cameraZ + 5.6 || z > state.cameraZ + DRAW_DISTANCE) return;
    const alpha = clamp(1 - (z - state.cameraZ) / DRAW_DISTANCE, 0.12, 1);
    if (segment.crystal && !segment.crystal.taken && segment.crystal.surface === surface) {
      const point = project(surface, laneCenter(segment.crystal.lane), 1.15 + Math.sin(state.time * 3 + segment.index) * 0.12, z);
      drawCrystal(point, alpha);
    }
    const surfaceData = segment.surfaces[surface];
    if (surfaceData.power && !surfaceData.power.taken) {
      const point = project(surface, laneCenter(surfaceData.power.lane), 1.25 + Math.sin(state.time * 3.5) * 0.1, z);
      drawPower(point, surfaceData.power.type, alpha);
    }
    if (surfaceData.obstacle && !surfaceData.obstacle.hit) {
      const point = project(surface, laneCenter(surfaceData.obstacle.lane), 0.7, segment.z + segment.length * 0.58);
      drawObstacle(point, surfaceData.obstacle, alpha);
    }
  }

  function drawCrystal(point, alpha) {
    const radius = clamp(point.scale * 0.34, 2, 16);
    ctx.globalAlpha = alpha;
    ctx.shadowColor = "#fff3a8";
    ctx.shadowBlur = radius * 1.2;
    ctx.fillStyle = "#fff3a8";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = Math.max(1, radius * 0.12);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y - radius);
    ctx.lineTo(point.x + radius * 0.58, point.y);
    ctx.lineTo(point.x, point.y + radius);
    ctx.lineTo(point.x - radius * 0.58, point.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  function drawPower(point, type, alpha) {
    const radius = clamp(point.scale * 0.39, 3, 18);
    ctx.globalAlpha = alpha;
    ctx.shadowColor = "#b8f4ff";
    ctx.shadowBlur = radius;
    ctx.fillStyle = "#c9f7ff";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = Math.max(1, radius * 0.12);
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#6451ca";
    ctx.font = `900 ${Math.max(8, radius * 0.82)}px Quicksand`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(type[0].toUpperCase(), point.x, point.y + 1);
    ctx.globalAlpha = 1;
  }

  function drawObstacle(point, obstacle, alpha) {
    const radius = clamp(point.scale * 0.48, 3, 24);
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.globalAlpha = alpha;
    ctx.shadowColor = "#ff6f9d";
    ctx.shadowBlur = radius * 0.7;
    ctx.fillStyle = obstacle.type === "laser" ? "#ff6f9d" : "#8675ec";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = Math.max(1, radius * 0.11);
    if (obstacle.type === "spinner") {
      ctx.rotate(state.time * 4 + obstacle.phase);
      for (let i = 0; i < 4; i += 1) {
        ctx.rotate(Math.PI / 2);
        roundedRect(-radius * 0.12, -radius * 1.1, radius * 0.24, radius, radius * 0.1);
        ctx.fill();
        ctx.stroke();
      }
    } else if (obstacle.type === "laser") {
      roundedRect(-radius * 1.35, -radius * 0.13, radius * 2.7, radius * 0.26, radius * 0.13);
      ctx.fill();
      ctx.stroke();
    } else if (obstacle.type === "mine") {
      ctx.beginPath();
      for (let i = 0; i < 16; i += 1) {
        const angle = i * Math.PI / 8;
        const length = i % 2 ? radius * 0.62 : radius;
        const x = Math.cos(angle) * length;
        const y = Math.sin(angle) * length;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      const sway = Math.sin(state.time * 1.6 + obstacle.phase) * radius * 0.25;
      roundedRect(-radius * 0.62 + sway, -radius * 0.68, radius * 1.24, radius * 1.36, radius * 0.15);
      ctx.fill();
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawTrails() {
    for (const trail of state.trail) {
      const point = project(trail.surface, trail.lane, trail.height, trail.z);
      ctx.globalAlpha = trail.life * 0.5;
      ctx.fillStyle = "#ffd5e6";
      ctx.beginPath();
      ctx.arc(point.x, point.y, clamp(point.scale * 0.12, 1, 7), 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawParticles() {
    for (const particle of state.particles) {
      const point = project(particle.surface, particle.lane, particle.height, particle.z);
      const radius = clamp(point.scale * particle.size, 1, 5);
      ctx.globalAlpha = clamp(particle.life * 1.5, 0, 1);
      ctx.fillStyle = particle.color;
      drawStar(point.x, point.y, radius);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawPlayer() {
    const point = project(player.surface, player.lane, player.height + 0.95, player.z);
    const scale = clamp(point.scale / 30, 0.42, 1.2);
    const run = player.grounded ? Math.sin(player.step * 1.7) : 0;
    const blink = player.blink < 0.12 ? 0.18 : 1;
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.scale(scale * (1.03 + (1 - player.squash) * 0.32), scale * player.squash);

    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#100f2b";
    ctx.beginPath();
    ctx.ellipse(0, 35, 39, 9, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;

    drawFoot(-20, 28 + run * 3, -0.16 + run * 0.05);
    drawFoot(20, 28 - run * 3, 0.16 - run * 0.05);

    ctx.strokeStyle = "#ff8fbd";
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-28, 0);
    ctx.quadraticCurveTo(-46, 6 - run * 3, -49, 22 + run * 4);
    ctx.moveTo(28, 0);
    ctx.quadraticCurveTo(46, 6 + run * 3, 49, 22 - run * 4);
    ctx.stroke();
    drawHand(-50, 23 + run * 4);
    drawHand(50, 23 - run * 4);

    const body = ctx.createRadialGradient(-13, -17, 3, 0, 0, 43);
    body.addColorStop(0, "#fff");
    body.addColorStop(0.27, "#ffd8e8");
    body.addColorStop(1, "#ff88b8");
    ctx.fillStyle = body;
    ctx.strokeStyle = "#fff8fc";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-35, 12);
    ctx.bezierCurveTo(-42, -18, -26, -34, 0, -35);
    ctx.bezierCurveTo(27, -34, 42, -17, 35, 13);
    ctx.bezierCurveTo(31, 32, 16, 36, 0, 34);
    ctx.bezierCurveTo(-17, 37, -31, 31, -35, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#5c4051";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-18, -30);
    ctx.quadraticCurveTo(-22, -46, -30, -41);
    ctx.moveTo(18, -30);
    ctx.quadraticCurveTo(22, -46, 30, -41);
    ctx.stroke();
    ctx.fillStyle = "#ffb5d1";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-31, -41, 4.5, 0, TAU);
    ctx.arc(31, -41, 4.5, 0, TAU);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#54394b";
    ctx.save();
    ctx.translate(-12, -8);
    ctx.scale(1, blink);
    ctx.beginPath();
    ctx.ellipse(0, 0, 4.5, 6.2, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(13, -8);
    ctx.scale(1, blink);
    ctx.beginPath();
    ctx.ellipse(0, 0, 4.5, 6.2, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "rgba(255,101,153,0.42)";
    ctx.beginPath();
    ctx.ellipse(-22, 3, 7, 4, 0, 0, TAU);
    ctx.ellipse(23, 3, 7, 4, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#54394b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0.12, Math.PI - 0.12);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.beginPath();
    ctx.ellipse(-13, -21, 10, 4.5, -0.45, 0, TAU);
    ctx.fill();

    if (player.shield > 0) {
      ctx.strokeStyle = "rgba(184,244,255,0.88)";
      ctx.lineWidth = 4;
      ctx.shadowColor = "#b8f4ff";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(0, 0, 49, 0, TAU);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  function drawFoot(x, y, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = "#ff8fbd";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 8, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawHand(x, y) {
    ctx.fillStyle = "#ffd7e8";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }

  function drawVignette() {
    const gradient = ctx.createRadialGradient(W / 2, H * 0.45, 170, W / 2, H * 0.45, 570);
    gradient.addColorStop(0, "rgba(4,5,18,0)");
    gradient.addColorStop(0.72, "rgba(4,5,18,0.04)");
    gradient.addColorStop(1, "rgba(4,5,18,0.42)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
  }

  function drawTutorial() {
    if (state.mode !== "playing" || state.distance > 150 || H > W) return;
    const text = state.distance < 48 ? "A / W or → move right   •   D / S or ← move left" : state.distance < 100 ? "Hold Space for a higher jump" : "Push into a wall to make it the new floor";
    ctx.font = "800 16px Quicksand";
    const width = Math.min(W - 20, 620, ctx.measureText(text).width + 44);
    ctx.fillStyle = "rgba(255,250,253,0.9)";
    roundedRect(W / 2 - width / 2, H - 55, width, 36, 7);
    ctx.fill();
    ctx.fillStyle = "#654f79";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, W / 2, H - 37);
  }

  function polygon(points) {
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
  }

  function roundedRect(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function drawStar(x, y, radius) {
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const angle = -Math.PI / 2 + i * Math.PI / 5;
      const length = i % 2 ? radius * 0.45 : radius;
      const px = x + Math.cos(angle) * length;
      const py = y + Math.sin(angle) * length;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function colorWithAlpha(hex, alpha) {
    const raw = hex.replace("#", "");
    const value = raw.length === 3 ? raw.split("").map((digit) => digit + digit).join("") : raw;
    const number = Number.parseInt(value, 16);
    return `rgba(${number >> 16},${(number >> 8) & 255},${number & 255},${alpha})`;
  }

  function shadeColor(hex, amount) {
    const number = Number.parseInt(hex.replace("#", ""), 16);
    const red = clamp((number >> 16) + amount, 0, 255);
    const green = clamp(((number >> 8) & 255) + amount, 0, 255);
    const blue = clamp((number & 255) + amount, 0, 255);
    return `rgb(${red},${green},${blue})`;
  }

  function openPanel(title, content) {
    ui.panelTitle.textContent = title;
    ui.panelBody.innerHTML = content;
    ui.panel.classList.remove("hide");
  }

  function leaderboardMarkup() {
    if (!save.runs.length) return `<div class="stat-card"><span>No runs yet</span><strong>Be first!</strong></div>`;
    return save.runs.map((run, index) => `
      <div class="table-row">
        <strong>${index + 1}. ${escapeHtml(run.name)}</strong>
        <span>${run.score.toLocaleString()}</span>
        <span>${run.distance}m</span>
        <span>${run.crystals} crystals</span>
      </div>`).join("");
  }

  function instructionsMarkup() {
    return `
      <div class="stat-card"><span>Move right</span><strong>A / W / Right Arrow</strong></div>
      <div class="stat-card"><span>Move left</span><strong>D / S / Left Arrow</strong></div>
      <div class="stat-card"><span>Jump</span><strong>Space / Up Arrow</strong></div>
      <div class="stat-card"><span>Sprint</span><strong>Shift</strong></div>
      <div class="stat-card"><span>Gravity</span><strong>Run into a side wall or use Q / E</strong></div>
      <div class="stat-card"><span>Restart / Pause</span><strong>R / Escape</strong></div>`;
  }

  function statsMarkup() {
    return `
      <div class="stat-card"><span>Best distance</span><strong>${save.bestDistance}m</strong></div>
      <div class="stat-card"><span>Best score</span><strong>${save.bestScore.toLocaleString()}</strong></div>
      <div class="stat-card"><span>Total crystals</span><strong>${save.totalCrystals}</strong></div>
      <div class="stat-card"><span>Games played</span><strong>${save.gamesPlayed}</strong></div>`;
  }

  function settingsMarkup() {
    return `
      <label class="setting-row"><span>Sound</span><input id="setting-sound" type="checkbox" ${state.muted ? "" : "checked"}></label>
      <label class="setting-row"><span>Reduced motion</span><input id="setting-motion" type="checkbox" ${state.reducedMotion ? "checked" : ""}></label>`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" })[character]);
  }

  function togglePause() {
    if (state.mode === "playing") {
      state.mode = "paused";
      ui.pause.classList.remove("hide");
    } else if (state.mode === "paused") {
      state.mode = "playing";
      ui.pause.classList.add("hide");
      state.lastTime = performance.now();
    }
  }

  function bindControls() {
    document.getElementById("btn-play").addEventListener("click", startGame);
    document.getElementById("btn-run-again").addEventListener("click", startGame);
    document.getElementById("btn-restart").addEventListener("click", startGame);
    document.getElementById("btn-resume").addEventListener("click", togglePause);
    document.getElementById("btn-panel-close").addEventListener("click", () => ui.panel.classList.add("hide"));
    document.getElementById("btn-leaderboard").addEventListener("click", () => openPanel("Top 25 Runners", leaderboardMarkup()));
    document.getElementById("btn-over-board").addEventListener("click", () => openPanel("Top 25 Runners", leaderboardMarkup()));
    document.getElementById("btn-instructions").addEventListener("click", () => openPanel("How to Play", instructionsMarkup()));
    document.getElementById("btn-fullscreen").addEventListener("click", () => {
      const frame = document.querySelector(".game-frame");
      if (document.fullscreenElement) document.exitFullscreen();
      else frame.requestFullscreen?.();
    });

    document.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", () => {
      state.selectedMode = button.dataset.mode;
      document.querySelectorAll("[data-mode]").forEach((item) => item.classList.toggle("is-active", item === button));
      ui.seed.classList.toggle("is-visible", state.selectedMode === "daily");
    }));

    document.querySelectorAll("[data-panel]").forEach((button) => button.addEventListener("click", () => {
      const panel = button.dataset.panel;
      if (panel === "leaderboard") openPanel("Top 25 Runners", leaderboardMarkup());
      else if (panel === "settings") {
        openPanel("Settings", settingsMarkup());
        bindSettings();
      } else if (panel === "stats") openPanel("Statistics", statsMarkup());
      else if (panel === "achievements") openPanel("Achievements", `<div class="stat-card"><span>Moonwalker</span><strong>${save.bestDistance >= 500 ? "Unlocked" : "Reach 500m"}</strong></div><div class="stat-card"><span>Star Collector</span><strong>${save.totalCrystals >= 50 ? "Unlocked" : "Collect 50 crystals"}</strong></div>`);
      else openPanel("Credits", `<div class="stat-card"><span>Created for Gabi's Games</span><strong>Made with care</strong></div><div class="stat-card"><span>Inspired by gravity tunnel runners</span><strong>Original art and code</strong></div>`);
    }));

    window.addEventListener("keydown", (event) => handleKey(event, true));
    window.addEventListener("keyup", (event) => handleKey(event, false));
    window.addEventListener("blur", () => { if (state.mode === "playing") togglePause(); });
    window.addEventListener("resize", fitCanvas);
    canvas.addEventListener("pointerdown", () => { if (state.mode === "playing") setJump(true); });
    canvas.addEventListener("pointerup", () => setJump(false));
    document.getElementById("touch-jump").addEventListener("pointerdown", (event) => { event.preventDefault(); setJump(true); });
    document.getElementById("touch-jump").addEventListener("pointerup", (event) => { event.preventDefault(); setJump(false); });
    document.getElementById("touch-pause").addEventListener("click", togglePause);
    bindStick();

    const mute = document.querySelector(".mute-btn");
    mute.textContent = state.muted ? "🔇" : "🔊";
    mute.addEventListener("click", () => {
      state.muted = !state.muted;
      mute.textContent = state.muted ? "🔇" : "🔊";
      persist();
    });
  }

  function bindSettings() {
    const soundToggle = document.getElementById("setting-sound");
    const motionToggle = document.getElementById("setting-motion");
    if (soundToggle) soundToggle.addEventListener("change", () => { state.muted = !soundToggle.checked; persist(); });
    if (motionToggle) motionToggle.addEventListener("change", () => { state.reducedMotion = motionToggle.checked; persist(); });
  }

  function setJump(down) {
    if (down && !input.jump) input.jumpPressed = true;
    if (!down && input.jump) input.jumpReleased = true;
    input.jump = down;
  }

  function handleKey(event, down) {
    const key = event.key.toLowerCase();
    if (["a", "w", "arrowright"].includes(key)) input.right = down;
    if (["d", "s", "arrowleft"].includes(key)) input.left = down;
    if (key === " " || key === "arrowup") setJump(down);
    if (key === "shift") input.sprint = down;
    if (down && key === "q") input.rotateLeft = true;
    if (down && key === "e") input.rotateRight = true;
    if (down && key === "r") startGame();
    if (down && (key === "escape" || key === "p")) togglePause();
    if (["a", "w", "d", "s", " ", "arrowleft", "arrowright", "arrowup", "shift"].includes(key)) event.preventDefault();
  }

  function bindStick() {
    const stick = document.getElementById("stick");
    const knob = stick.querySelector("span");
    let active = false;
    function updateStick(clientX) {
      const rect = stick.getBoundingClientRect();
      const distance = clamp(clientX - rect.left - rect.width / 2, -30, 30);
      knob.style.transform = `translateX(${distance}px)`;
      input.touchMove = distance / 30;
    }
    stick.addEventListener("pointerdown", (event) => {
      active = true;
      stick.setPointerCapture(event.pointerId);
      updateStick(event.clientX);
    });
    stick.addEventListener("pointermove", (event) => { if (active) updateStick(event.clientX); });
    stick.addEventListener("pointerup", () => {
      active = false;
      input.touchMove = 0;
      knob.style.transform = "translateX(0)";
    });
  }

  function frame(now) {
    const elapsed = Math.min(0.05, (now - state.lastTime) / 1000);
    state.lastTime = now;
    state.time += elapsed;
    state.accumulator += elapsed;
    while (state.accumulator >= 1 / 120) {
      update(1 / 120);
      state.accumulator -= 1 / 120;
    }
    draw();
    requestAnimationFrame(frame);
  }

  ui.name.value = save.name;
  fitCanvas();
  bindControls();
  ui.loading.classList.add("is-gone");
  window.setTimeout(() => ui.loading.classList.add("hide"), 320);
  requestAnimationFrame(frame);
})();
