(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const GAME_ID = "peaceful-pond";
  const COLLECTION_KEY = "peaceful_pond_collection";
  const W = 900;
  const H = 620;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const rand = (a, b) => a + Math.random() * (b - a);

  const fishTypes = [
    { name: "Peach Guppy", color: "#ff9fbd", belly: "#ffe4ef", accent: "#fff3a8", pattern: "freckles", rarity: 1, base: 12, size: [0.55, 0.9] },
    { name: "Minty Minnow", color: "#75dfba", belly: "#d9fff1", accent: "#a5f7dd", pattern: "scales", rarity: 1, base: 14, size: [0.55, 0.95] },
    { name: "Cloud Tetra", color: "#9bd8ff", belly: "#eef9ff", accent: "#ffffff", pattern: "clouds", rarity: 1.1, base: 16, size: [0.58, 0.96] },
    { name: "Lavender Loach", color: "#b99cff", belly: "#eee8ff", accent: "#ffd6f1", pattern: "ribbon", rarity: 1.2, base: 18, size: [0.7, 1.1] },
    { name: "Honey Finlet", color: "#ffc75f", belly: "#fff2bc", accent: "#ff9fbd", pattern: "scales", rarity: 1.28, base: 21, size: [0.72, 1.08] },
    { name: "Pudding Carp", color: "#ffd66e", belly: "#fff3bd", accent: "#ffb86f", pattern: "spots", rarity: 1.35, base: 24, size: [0.95, 1.35] },
    { name: "Cherry Bubblefish", color: "#ff7ba8", belly: "#ffd1e0", accent: "#ffecf4", pattern: "bubbles", rarity: 1.55, base: 34, size: [0.85, 1.35] },
    { name: "Sugar Pearl Fry", color: "#f9f3ff", belly: "#ffe6f2", accent: "#c7b8ff", pattern: "pearls", rarity: 1.72, base: 42, size: [0.72, 1.18] },
    { name: "Matcha Ribbon Eel", color: "#9ce8a8", belly: "#e9ffdc", accent: "#74c69d", pattern: "ribbon", rarity: 1.88, base: 48, size: [1.05, 1.55] },
    { name: "Moon Koi", color: "#f7f1ff", belly: "#ffd9ec", accent: "#d6c5ff", pattern: "spots", rarity: 2.05, base: 55, size: [1.15, 1.65] },
    { name: "Rosy Lantern Koi", color: "#ffb0c8", belly: "#fff0f5", accent: "#ffd36e", pattern: "lantern", rarity: 2.25, base: 68, size: [1.18, 1.72] },
    { name: "Starry Dreamfish", color: "#86c8ff", belly: "#fff6b8", accent: "#b59cff", pattern: "stars", rarity: 2.55, base: 82, size: [1.2, 1.85] },
    { name: "Crystal Wish Koi", color: "#b8f4ff", belly: "#f7fdff", accent: "#ffb7de", pattern: "crystal", rarity: 2.85, base: 105, size: [1.28, 1.92] },
    { name: "Celestial Mochi Whale", color: "#8aa8ff", belly: "#f1f0ff", accent: "#fff3a8", pattern: "stars", rarity: 3.15, base: 135, size: [1.55, 2.15] },
  ];

  const upgrades = {
    rod: { label: "Rod", level: 1, max: 5, base: 70, desc: "steadier reeling" },
    line: { label: "Line", level: 1, max: 5, base: 85, desc: "more tension room" },
    lure: { label: "Lure", level: 1, max: 5, base: 95, desc: "rarer fish faster" },
  };

  let state = "start";
  let playerName = localStorage.getItem("gabi_player_name") || "";
  let score = 0;
  let pearls = 0;
  let best = +localStorage.getItem("peaceful_pond_best") || 0;
  let time = 0;
  let pointer = { x: W * 0.62, y: H * 0.54, down: false, active: false };
  let cast = null;
  let hooked = null;
  let catchGame = null;
  let fish = [];
  let ripples = [];
  let particles = [];
  let floaters = [];
  let buttons = [];
  let collection = loadCollection();
  let stateBeforeDirectory = "start";
  let catchRevealTimer = null;
  let message = "Tap the pond to cast.";
  let startTime = performance.now();

  const bunny = { x: 155, y: 402, blink: 1.4, bob: 0 };

  function fitCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  fitCanvas();
  window.addEventListener("resize", fitCanvas);

  function loadUpgrades() {
    try {
      const saved = JSON.parse(localStorage.getItem("peaceful_pond_upgrades") || "{}");
      Object.keys(upgrades).forEach(k => {
        upgrades[k].level = clamp(saved[k] || 1, 1, upgrades[k].max);
      });
    } catch {}
  }

  function saveUpgrades() {
    localStorage.setItem("peaceful_pond_upgrades", JSON.stringify({
      rod: upgrades.rod.level,
      line: upgrades.line.level,
      lure: upgrades.lure.level,
    }));
  }

  function fishId(type) {
    return type.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function loadCollection() {
    try {
      return JSON.parse(localStorage.getItem(COLLECTION_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function saveCollection() {
    localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection));
  }

  function recordCatch(f, value) {
    const id = fishId(f.type);
    const current = collection[id] || { count: 0, biggest: 0, bestValue: 0 };
    const isNew = !current.count;
    collection[id] = {
      count: current.count + 1,
      biggest: Math.max(current.biggest || 0, +f.size.toFixed(2)),
      bestValue: Math.max(current.bestValue || 0, value),
    };
    saveCollection();
    renderDirectory();
    return isNew;
  }

  function rarityLabel(rarity) {
    if (rarity >= 2.4) return "Legendary";
    if (rarity >= 1.9) return "Rare";
    if (rarity >= 1.45) return "Special";
    if (rarity >= 1.2) return "Uncommon";
    return "Common";
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[ch]));
  }

  function fishGraphic(type, unlocked) {
    const body = unlocked ? type.color : "#d8cbd4";
    const belly = unlocked ? type.belly : "#f3e9ee";
    const accent = unlocked ? (type.accent || type.belly) : "#c7b9c3";
    const cheek = unlocked ? "#ff8fb3" : "#c8b6c2";
    const sparkle = unlocked && type.rarity > 1.8;
    const mark = unlocked ? "★" : "?";
    const id = fishId(type);
    const decorations = {
      freckles: `
        <circle cx="52" cy="39" r="2.4" fill="${accent}" opacity="0.86"/>
        <circle cx="62" cy="34" r="1.9" fill="${accent}" opacity="0.72"/>
        <circle cx="71" cy="42" r="2.1" fill="${accent}" opacity="0.8"/>
      `,
      scales: `
        <path d="M45 43 q7 -8 14 0 q7 -8 14 0 q7 -8 14 0" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round" opacity="0.48"/>
        <path d="M51 54 q7 -8 14 0 q7 -8 14 0" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round" opacity="0.42"/>
      `,
      clouds: `
        <path d="M48 38 q4 -8 11 -2 q5 -7 13 0 q7 -3 10 5 q-12 6 -34 -3z" fill="${accent}" opacity="0.82"/>
      `,
      ribbon: `
        <path d="M41 35 C55 46 67 26 83 39 C71 47 57 60 41 51" fill="none" stroke="${accent}" stroke-width="7" stroke-linecap="round" opacity="0.68"/>
      `,
      spots: `
        <ellipse cx="53" cy="38" rx="7" ry="5" fill="${accent}" opacity="0.72"/>
        <ellipse cx="74" cy="35" rx="6" ry="4.4" fill="${accent}" opacity="0.62"/>
        <ellipse cx="66" cy="56" rx="8" ry="5" fill="${accent}" opacity="0.56"/>
      `,
      bubbles: `
        <circle cx="50" cy="39" r="6" fill="${accent}" opacity="0.7"/>
        <circle cx="70" cy="33" r="4" fill="${accent}" opacity="0.58"/>
        <circle cx="76" cy="55" r="5" fill="${accent}" opacity="0.62"/>
        <circle cx="50" cy="39" r="2.2" fill="#ffffff" opacity="0.9"/>
      `,
      pearls: `
        <circle cx="47" cy="38" r="4.5" fill="${accent}" opacity="0.82"/>
        <circle cx="60" cy="34" r="3.6" fill="${accent}" opacity="0.72"/>
        <circle cx="73" cy="38" r="4.1" fill="${accent}" opacity="0.76"/>
        <circle cx="86" cy="48" r="3.4" fill="${accent}" opacity="0.62"/>
      `,
      lantern: `
        <path d="M54 28 q16 10 34 0 q-5 19 -17 30 q-12 -10 -17 -30z" fill="${accent}" opacity="0.42"/>
        <path d="M61 31 q9 12 19 0 M61 48 q9 -9 19 0" fill="none" stroke="#ffffff" stroke-width="2.5" opacity="0.76"/>
      `,
      stars: `
        <path d="M52 31 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="${accent}" opacity="0.9"/>
        <path d="M75 46 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#ffffff" opacity="0.86"/>
      `,
      crystal: `
        <path d="M52 30 l16 -6 18 12 -7 22 -24 4 -12 -18z" fill="${accent}" opacity="0.5"/>
        <path d="M52 30 l13 15 l21 -9 M65 45 l-10 17" fill="none" stroke="#ffffff" stroke-width="2.4" opacity="0.8"/>
      `,
    }[type.pattern] || "";
    return `
      <svg viewBox="0 0 132 96" role="img" aria-label="${escapeHtml(type.name)}">
        <defs>
          <linearGradient id="${id}-body" x1="26" y1="22" x2="109" y2="77" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#ffffff" stop-opacity="0.7"/>
            <stop offset="0.36" stop-color="${body}"/>
            <stop offset="1" stop-color="${body}" stop-opacity="0.82"/>
          </linearGradient>
          <radialGradient id="${id}-belly" cx="66" cy="66" r="40" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#ffffff" stop-opacity="0.88"/>
            <stop offset="1" stop-color="${belly}"/>
          </radialGradient>
          <filter id="${id}-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#ff8fa3" flood-opacity="0.22"/>
          </filter>
        </defs>
        <g filter="url(#${id}-shadow)">
          <path d="M24 48 C8 31 7 65 24 48 Z" fill="url(#${id}-body)"/>
          <path d="M28 44 q-12 -16 -23 -8 q10 4 19 18" fill="${accent}" opacity="0.72"/>
          <path d="M28 52 q-14 17 -24 8 q10 -4 19 -18" fill="${accent}" opacity="0.72"/>
          <path d="M64 25 q12 -14 29 -8 q-8 10 -20 19" fill="${accent}" opacity="0.64"/>
          <path d="M54 73 q14 14 31 4 q-11 -8 -17 -20" fill="${accent}" opacity="0.58"/>
          <path d="M27 48 C40 21 88 18 111 41 C122 52 115 69 99 75 C72 88 39 74 27 48 Z" fill="url(#${id}-body)"/>
          <path d="M48 61 C64 76 91 72 102 58 C86 65 64 66 48 61 Z" fill="url(#${id}-belly)" opacity="0.98"/>
          <path d="M42 29 C60 20 90 24 106 43" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.36"/>
          ${decorations}
          <circle cx="89" cy="41" r="7" fill="#573f4a"/>
          <circle cx="91" cy="38" r="2.6" fill="#ffffff"/>
          <circle cx="85" cy="39" r="1.5" fill="#ffffff" opacity="0.7"/>
          <circle cx="98" cy="55" r="4.5" fill="${cheek}" opacity="0.72"/>
          <path d="M75 51 Q80 56 86 51" fill="none" stroke="#573f4a" stroke-width="3" stroke-linecap="round"/>
          <path d="M53 31 Q61 22 73 28" fill="none" stroke="${belly}" stroke-width="6" stroke-linecap="round" opacity="0.75"/>
          <path d="M48 75 Q58 87 72 76" fill="${belly}" opacity="0.72"/>
          <text x="30" y="29" text-anchor="middle" font-size="16" font-weight="800" fill="#ffffff">${mark}</text>
          ${sparkle ? `<path d="M112 20 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="${accent}"/>` : ""}
        </g>
      </svg>
    `;
  }

  function renderDirectory() {
    const grid = document.getElementById("fish-directory-grid");
    const summary = document.getElementById("fish-directory-summary");
    if (!grid || !summary) return;
    const caught = fishTypes.filter(type => collection[fishId(type)]?.count).length;
    summary.textContent = `${caught}/${fishTypes.length} pond friends discovered`;
    grid.innerHTML = fishTypes.map(type => {
      const id = fishId(type);
      const entry = collection[id];
      const unlocked = !!entry?.count;
      return `
        <article class="fish-entry${unlocked ? "" : " is-locked"}">
          <div class="fish-art">${fishGraphic(type, unlocked)}</div>
          <div>
            <div class="fish-entry__name">${unlocked ? escapeHtml(type.name) : "Mystery Pond Friend"}</div>
            <div class="fish-entry__rarity">${unlocked ? rarityLabel(type.rarity) : "Undiscovered"}</div>
            <div class="fish-entry__stats">
              <span>Caught: ${unlocked ? entry.count : 0}</span>
              <span>Biggest: ${unlocked ? `${Number(entry.biggest || 0).toFixed(2)}x` : "???"}</span>
              <span>Best catch: ${unlocked ? `${Number(entry.bestValue || 0)} pts` : "???"}</span>
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  function reset() {
    score = 0;
    pearls = +localStorage.getItem("peaceful_pond_pearls") || 0;
    time = 0;
    cast = null;
    hooked = null;
    catchGame = null;
    fish = [];
    ripples = [];
    particles = [];
    floaters = [];
    message = "Tap the pond to cast.";
    startTime = performance.now();
    loadUpgrades();
    for (let i = 0; i < 16; i++) fish.push(makeFish(true));
  }

  function makeFish(anywhere = false) {
    const lure = upgrades.lure.level;
    const roll = Math.pow(Math.random(), 1 + lure * 0.12);
    const type = fishTypes[Math.min(fishTypes.length - 1, Math.floor(roll * fishTypes.length))];
    const size = rand(type.size[0], type.size[1]) * rand(0.92, 1.08);
    const y = anywhere ? rand(190, 520) : rand(220, 520);
    return {
      type,
      size,
      x: anywhere ? rand(240, 880) : W + 80,
      y,
      vx: rand(-16, -38) / size,
      phase: rand(0, Math.PI * 2),
      turn: rand(1.8, 4.5),
      bite: false,
      sparkle: type.rarity > 1.8,
    };
  }

  function startGame() {
    const input = document.getElementById("name-input");
    playerName = GabiLeaderboard.cleanName(input.value || playerName || "Bunny");
    input.blur();
    window.scrollTo({ top: 0, behavior: "auto" });
    localStorage.setItem("gabi_player_name", playerName);
    reset();
    state = "playing";
    hide("screen-start");
    hide("screen-pause");
    hide("screen-directory");
    hide("screen-catch-reveal");
    clearCatchRevealTimer();
    GabiAudio.unlock();
    if (!GabiAudio.isMuted()) GabiAudio.startMusic();
  }

  let last = performance.now();
  function loop(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 1 / 30) dt = 1 / 30;
    if (state === "playing" || state === "catching") update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  function update(dt) {
    time += dt;
    bunny.bob += dt * 2;
    bunny.blink -= dt;
    if (bunny.blink < -0.12) bunny.blink = rand(1.8, 4.2);

    updateFish(dt);
    updateCast(dt);
    updateCatch(dt);
    updateFx(dt);
  }

  function updateFish(dt) {
    for (const f of fish) {
      f.phase += dt * (1.7 + 0.5 / f.size);
      f.turn -= dt;
      f.x += f.vx * dt * 4.2;
      f.y += Math.sin(f.phase) * dt * 12;
      if (f.turn <= 0) {
        f.turn = rand(1.8, 4.5);
        f.vx += rand(-5, 5);
        f.vx = clamp(f.vx, -48, -10);
      }
      if (cast && cast.state === "waiting" && !hooked) {
        const biteReach = 34 + upgrades.lure.level * 4 + f.size * 12;
        if (dist(f, cast) < biteReach && Math.random() < dt * (0.45 + upgrades.lure.level * 0.12)) {
          biteFish(f);
        }
      }
    }
    fish = fish.filter(f => f.x > 190 && !f.bite);
    while (fish.length < 16) fish.push(makeFish(false));
  }

  function updateCast(dt) {
    if (!cast) return;
    cast.t += dt;
    cast.bob += dt * 5;
    if (cast.state === "flying") {
      const t = ease(cast.t / cast.dur);
      cast.x = lerp(cast.sx, cast.tx, t);
      cast.y = lerp(cast.sy, cast.ty, t) - Math.sin(t * Math.PI) * 80;
      if (t >= 1) {
        cast.state = "waiting";
        cast.t = 0;
        splash(cast.x, cast.y, "#ffffff", 18);
        message = "A fish is thinking about it...";
      }
    } else if (cast.state === "waiting" && !hooked) {
      if (cast.t > Math.max(1.8, 5.5 - upgrades.lure.level * 0.55)) {
        const near = fish
          .filter(f => dist(f, cast) < 170)
          .sort((a, b) => dist(a, cast) - dist(b, cast))[0];
        if (near) biteFish(near);
      }
      if (Math.random() < dt * 0.8) ripples.push({ x: cast.x, y: cast.y, r: 3, life: 1 });
    }
  }

  function biteFish(f) {
    f.bite = true;
    hooked = f;
    cast.state = "bite";
    cast.t = 0;
    GabiAudio.sfx.score();
    splash(cast.x, cast.y, f.type.color, 28);
    const difficulty = clamp((f.size * 0.62 + f.type.rarity * 0.38) - upgrades.rod.level * 0.08, 0.55, 2.7);
    catchGame = {
      progress: 12,
      tension: 18,
      marker: 0.45,
      target: 0.52,
      targetV: rand(-0.28, 0.28),
      zone: clamp(0.24 - difficulty * 0.035 + upgrades.line.level * 0.018, 0.09, 0.28),
      difficulty,
      pull: difficulty * 0.65,
    };
    message = `${f.type.name} hooked! Hold to reel in the sweet spot.`;
    state = "catching";
  }

  function updateCatch(dt) {
    if (state !== "catching" || !catchGame || !hooked) return;
    const c = catchGame;
    c.target += c.targetV * dt;
    c.targetV += Math.sin(time * 2.1 + hooked.size) * dt * 0.24 + rand(-0.08, 0.08) * dt;
    if (c.target < 0.14 || c.target > 0.86) c.targetV *= -1;
    c.target = clamp(c.target, 0.12, 0.88);

    c.marker += (pointer.down ? 0.78 + upgrades.rod.level * 0.05 : -0.52) * dt;
    c.marker += Math.sin(time * 7 + hooked.phase) * dt * c.pull * 0.06;
    c.marker = clamp(c.marker, 0, 1);

    const inside = Math.abs(c.marker - c.target) < c.zone * 0.5;
    if (inside) {
      c.progress += dt * (18 + upgrades.rod.level * 3.5);
      c.tension -= dt * (7 + upgrades.line.level * 2);
      if (Math.random() < dt * 9) sparkle(lerp(360, 780, c.marker), 585, "#fff7b8");
    } else {
      c.progress -= dt * 3.5 * c.difficulty;
      c.tension += dt * (12 + c.difficulty * 10 + (pointer.down ? 8 : 0) - upgrades.line.level * 1.6);
    }
    c.progress = clamp(c.progress, 0, 100);
    c.tension = clamp(c.tension, 0, 100);

    hooked.x = lerp(hooked.x, cast.x + Math.sin(time * 12) * 18, dt * 4);
    hooked.y = lerp(hooked.y, cast.y + 38 + Math.cos(time * 10) * 18, dt * 4);

    if (c.progress >= 100) landFish();
    if (c.tension >= 100) loseFish();
  }

  async function landFish() {
    const f = hooked;
    const value = Math.round(f.type.base * f.size * (1 + f.type.rarity * 0.28));
    score += value;
    pearls += value;
    best = Math.max(best, score);
    localStorage.setItem("peaceful_pond_best", best);
    localStorage.setItem("peaceful_pond_pearls", pearls);
    const isNew = recordCatch(f, value);
    floaters.push({ x: cast.x, y: cast.y - 35, text: `+${value} ${f.type.name}`, color: f.type.color, life: 1.5 });
    splash(cast.x, cast.y, f.type.color, 42);
    GabiAudio.sfx.score();
    message = `Caught a ${fishSizeName(f.size)} ${f.type.name}!`;
    cast = null;
    hooked = null;
    catchGame = null;
    state = "reveal";
    showCatchReveal(f, value, isNew);

    const durationMs = performance.now() - startTime;
    await GabiLeaderboard.submit({ name: playerName, score, game: GAME_ID, durationMs });
  }

  function loseFish() {
    floaters.push({ x: cast.x, y: cast.y - 20, text: "The line slipped!", color: "#ff8fa3", life: 1.3 });
    splash(cast.x, cast.y, "#ffb7cf", 24);
    GabiAudio.sfx.over();
    cast = null;
    hooked = null;
    catchGame = null;
    state = "playing";
    message = "Almost! Cast again when you're ready.";
  }

  function fishSizeName(size) {
    if (size < 0.8) return "tiny";
    if (size < 1.15) return "sweet";
    if (size < 1.5) return "big";
    return "giant";
  }

  function updateFx(dt) {
    for (const r of ripples) { r.r += dt * 55; r.life -= dt * 0.75; }
    ripples = ripples.filter(r => r.life > 0);
    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += dt * 80;
      p.life -= dt;
    }
    particles = particles.filter(p => p.life > 0);
    for (const f of floaters) {
      f.y -= dt * 34;
      f.life -= dt;
    }
    floaters = floaters.filter(f => f.life > 0);
  }

  function castLine(x, y) {
    if (state !== "playing" || cast) return;
    if (x < 265 || y < 135 || y > 545) {
      message = "Cast into the open water.";
      return;
    }
    cast = { state: "flying", sx: 228, sy: 292, tx: x, ty: y, x: 228, y: 292, t: 0, dur: 0.62, bob: 0 };
    message = "Casting...";
    GabiAudio.sfx.click();
  }

  function upgradeCost(key) {
    const u = upgrades[key];
    return Math.round(u.base * Math.pow(1.72, u.level - 1));
  }

  function buyUpgrade(key) {
    const u = upgrades[key];
    if (u.level >= u.max) {
      message = `${u.label} is fully upgraded.`;
      return;
    }
    const cost = upgradeCost(key);
    if (pearls < cost) {
      message = `Need ${cost - pearls} more points for ${u.label}.`;
      return;
    }
    pearls -= cost;
    u.level++;
    localStorage.setItem("peaceful_pond_pearls", pearls);
    saveUpgrades();
    sparkle(790, 96 + Object.keys(upgrades).indexOf(key) * 60, "#fff2a8", 18);
    GabiAudio.sfx.score();
    message = `${u.label} upgraded!`;
  }

  function splash(x, y, color, n) {
    ripples.push({ x, y, r: 4, life: 1 });
    sparkle(x, y, color, n);
  }

  function sparkle(x, y, color = "#ffffff", n = 1) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const sp = rand(18, 95);
      particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, color, size: rand(2, 6), life: rand(0.45, 1.15) });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    drawPond();
    drawFishUnderwater();
    drawDock();
    drawBunny();
    drawLine();
    drawEffects();
    drawUi();
    if (state === "catching") drawCatchMeter();
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#fff5fb");
    g.addColorStop(0.52, "#effbff");
    g.addColorStop(1, "#e7f8dc");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    drawHill(0, 150, 360, "#d7f5dd");
    drawHill(225, 134, 390, "#ccefd9");
    drawHill(540, 156, 360, "#dff5ca");

    drawCloud(108 + Math.sin(time * 0.25) * 8, 76, 1.05);
    drawCloud(720 + Math.sin(time * 0.18 + 2) * 10, 88, 0.82);
    drawCloud(460 + Math.sin(time * 0.22 + 4) * 7, 54, 0.68);

    for (let i = 0; i < 7; i++) {
      const x = 55 + i * 132 + Math.sin(time + i) * 3;
      drawFlower(x, 132 + Math.sin(i) * 20, i % 2 ? "#ffb4cf" : "#c9a6ff");
    }

    for (let i = 0; i < 5; i++) {
      const x = 300 + i * 132;
      drawReeds(x, 518 + Math.sin(i) * 10, 0.75 + (i % 2) * 0.18);
    }
  }

  function drawHill(x, y, w, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, H);
    ctx.quadraticCurveTo(x + w * 0.35, y, x + w, H);
    ctx.closePath();
    ctx.fill();
  }

  function drawPond() {
    const pond = ctx.createRadialGradient(610, 320, 60, 560, 350, 470);
    pond.addColorStop(0, "#bff7ff");
    pond.addColorStop(0.52, "#8bdceb");
    pond.addColorStop(1, "#67bdd1");
    ctx.fillStyle = pond;
    ctx.beginPath();
    ctx.ellipse(570, 370, 390, 205, -0.04, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.65)";
    ctx.lineWidth = 7;
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.38)";
    ctx.beginPath();
    ctx.ellipse(666, 271, 118, 20, -0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 209, 220, 0.34)";
    ctx.beginPath();
    ctx.ellipse(440, 505, 165, 28, -0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(570, 370, 380, 196, -0.04, 0, Math.PI * 2);
    ctx.clip();
    for (let i = 0; i < 12; i++) {
      ctx.strokeStyle = `rgba(255,255,255,${0.18 + (i % 3) * 0.04})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      const y = 230 + i * 27 + Math.sin(time * 0.9 + i) * 5;
      ctx.ellipse(570 + Math.sin(i) * 20, y, 260 - i * 8, 16, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    drawLily(715, 238, 1);
    drawLily(812, 407, 0.85);
    drawLily(356, 452, 0.75);
    drawLily(555, 512, 0.62);
    drawPebbles();
    ctx.restore();
  }

  function drawFishUnderwater() {
    for (const f of fish) drawFish(f, 0.45);
    if (hooked) drawFish(hooked, 0.95);
  }

  function drawDock() {
    ctx.save();
    ctx.shadowColor = "rgba(107,75,87,0.14)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = "#d8a56f";
    roundRect(22, 362, 242, 78, 22);
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    for (let i = 0; i < 5; i++) roundRect(36 + i * 44, 372, 30, 52, 12), ctx.fill();
    ctx.strokeStyle = "#b98258";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(30, 404);
    ctx.lineTo(254, 404);
    ctx.stroke();
    ctx.fillStyle = "rgba(112,76,45,0.18)";
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(64 + i * 48, 388 + (i % 2) * 22, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBunny() {
    const bob = Math.sin(bunny.bob) * 3;
    ctx.save();
    ctx.translate(bunny.x, bunny.y + bob);
    ctx.fillStyle = "rgba(107,75,87,0.13)";
    ctx.beginPath();
    ctx.ellipse(0, 42, 62, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff8fb";
    ctx.beginPath();
    ctx.arc(49, 15, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#fff8fb";
    ctx.strokeStyle = "#f3c7d7";
    ctx.lineWidth = 3;
    roundRect(-44, -4, 88, 72, 36);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffd1dc";
    roundRect(-30, 28, 60, 19, 10);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(-18 + i * 18, 37, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    drawEar(-30, -62, -0.22);
    drawEar(25, -62, 0.18);

    ctx.fillStyle = "#fff8fb";
    ctx.beginPath();
    ctx.arc(0, -24, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffc3d5";
    ctx.beginPath();
    ctx.arc(-24, -13, 8, 0, Math.PI * 2);
    ctx.arc(24, -13, 8, 0, Math.PI * 2);
    ctx.fill();

    drawBow(25, -61, 0.78);

    ctx.fillStyle = "#6b4b57";
    if (bunny.blink > 0) {
      ctx.beginPath();
      ctx.ellipse(-15, -29, 5, 6.5, 0, 0, Math.PI * 2);
      ctx.ellipse(15, -29, 5, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(-17, -32, 1.8, 0, Math.PI * 2);
      ctx.arc(13, -32, 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = "#6b4b57";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-20, -28);
      ctx.lineTo(-10, -28);
      ctx.moveTo(10, -28);
      ctx.lineTo(20, -28);
      ctx.stroke();
    }
    ctx.fillStyle = "#ff9fbd";
    ctx.beginPath();
    ctx.ellipse(0, -23, 4.4, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#6b4b57";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -17, 9, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    ctx.strokeStyle = "rgba(107,75,87,0.45)";
    ctx.lineWidth = 1.4;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 7, -19);
      ctx.lineTo(side * 27, -22);
      ctx.moveTo(side * 7, -16);
      ctx.lineTo(side * 28, -15);
      ctx.stroke();
    }

    ctx.fillStyle = "#fff8fb";
    ctx.strokeStyle = "#f3c7d7";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(-37, 20, 13, 20, -0.35, 0, Math.PI * 2);
    ctx.ellipse(37, 20, 13, 20, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#8c6a48";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(42, -4);
    ctx.quadraticCurveTo(86, -98, 218, -92);
    ctx.stroke();
    ctx.strokeStyle = "#f7d66e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(47, -9);
    ctx.quadraticCurveTo(90, -92, 213, -88);
    ctx.stroke();
    ctx.restore();
  }

  function drawEar(x, y, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = "#fff8fb";
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffd3e2";
    ctx.beginPath();
    ctx.ellipse(0, 4, 6, 29, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawLine() {
    if (!cast) return;
    ctx.strokeStyle = "rgba(107,75,87,0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(228, 292);
    ctx.quadraticCurveTo((228 + cast.x) / 2, 188, cast.x, cast.y);
    ctx.stroke();

    ctx.fillStyle = "#ff8fa3";
    ctx.beginPath();
    ctx.ellipse(cast.x, cast.y + Math.sin(cast.bob) * 3, 8, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(cast.x, cast.y - 4 + Math.sin(cast.bob) * 3, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFish(f, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(f.x, f.y);
    const s = 28 * f.size;
    const wiggle = Math.sin(f.phase) * 0.14;
    const accent = f.type.accent || f.type.belly;
    ctx.rotate(wiggle);
    ctx.scale(-1, 1);

    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(s * 0.06, -s * 0.2);
    ctx.quadraticCurveTo(s * 0.22, -s * 0.78, s * 0.48, -s * 0.42);
    ctx.quadraticCurveTo(s * 0.3, -s * 0.28, s * 0.06, -s * 0.2);
    ctx.fill();

    ctx.fillStyle = f.type.color;
    ctx.beginPath();
    ctx.moveTo(-s * 0.95, 0);
    ctx.quadraticCurveTo(-s * 0.3, -s * 0.68, s * 0.62, -s * 0.35);
    ctx.quadraticCurveTo(s * 1.05, 0, s * 0.62, s * 0.35);
    ctx.quadraticCurveTo(-s * 0.3, s * 0.68, -s * 0.95, 0);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = Math.max(1.5, s * 0.055);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-s * 0.56, -s * 0.34);
    ctx.quadraticCurveTo(-s * 0.18, -s * 0.56, s * 0.34, -s * 0.28);
    ctx.stroke();

    ctx.fillStyle = f.type.belly;
    ctx.beginPath();
    ctx.ellipse(-s * 0.18, s * 0.12, s * 0.45, s * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(s * 0.58, 0);
    ctx.lineTo(s * 1.1, -s * 0.44 + Math.sin(f.phase * 2) * 4);
    ctx.lineTo(s * 1.02, 0);
    ctx.lineTo(s * 1.1, s * 0.44 - Math.sin(f.phase * 2) * 4);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha *= 0.72;
    ctx.fillStyle = accent;
    if (f.type.pattern === "spots" || f.type.pattern === "bubbles" || f.type.pattern === "pearls") {
      ctx.beginPath();
      ctx.ellipse(-s * 0.18, -s * 0.18, s * 0.12, s * 0.08, 0, 0, Math.PI * 2);
      ctx.ellipse(s * 0.1, -s * 0.03, s * 0.1, s * 0.07, 0, 0, Math.PI * 2);
      ctx.ellipse(-s * 0.03, s * 0.22, s * 0.12, s * 0.07, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (f.type.pattern === "stars" || f.type.pattern === "crystal") {
      star(-s * 0.15, -s * 0.18, s * 0.12, 5);
      ctx.fill();
      star(s * 0.18, s * 0.08, s * 0.08, 5);
      ctx.fill();
    } else {
      ctx.strokeStyle = accent;
      ctx.lineWidth = Math.max(1.2, s * 0.045);
      ctx.beginPath();
      ctx.arc(-s * 0.28, -s * 0.02, s * 0.16, -0.9, 0.9);
      ctx.arc(-s * 0.02, 0, s * 0.15, -0.9, 0.9);
      ctx.arc(s * 0.22, 0, s * 0.13, -0.9, 0.9);
      ctx.stroke();
    }
    ctx.globalAlpha = alpha;

    ctx.fillStyle = "#6b4b57";
    ctx.beginPath();
    ctx.arc(-s * 0.57, -s * 0.13, Math.max(2.5, s * 0.075), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-s * 0.59, -s * 0.16, Math.max(1, s * 0.026), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,143,179,0.68)";
    ctx.beginPath();
    ctx.ellipse(-s * 0.74, s * 0.02, s * 0.08, s * 0.045, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#6b4b57";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-s * 0.68, s * 0.08, s * 0.14, 0.1 * Math.PI, 0.7 * Math.PI);
    ctx.stroke();

    if (f.sparkle) {
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      star(f.phase % 1 * s - s * 0.2, -s * 0.34, s * 0.13, 5);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawEffects() {
    for (const r of ripples) {
      ctx.globalAlpha = r.life;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, r.r * 1.6, r.r * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (const p of particles) {
      ctx.globalAlpha = clamp(p.life, 0, 1);
      ctx.fillStyle = p.color;
      star(p.x, p.y, p.size, 5);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (const f of floaters) {
      ctx.globalAlpha = clamp(f.life, 0, 1);
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = f.color;
      ctx.lineWidth = 5;
      ctx.font = "700 22px 'Baloo 2', system-ui";
      ctx.textAlign = "center";
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawUi() {
    buttons = [];
    panel(20, 20, 250, 112);
    text("Peaceful Pond", 42, 55, 28, "#ff6f9d", "left");
    text(`Score ${score}   Best ${best}`, 42, 86, 17, "#6b4b57", "left");
    text(`Points to spend ${pearls}`, 42, 112, 17, "#6b4b57", "left");

    panel(636, 20, 244, 232);
    text("Upgrades", 660, 56, 25, "#ff6f9d", "left");
    Object.keys(upgrades).forEach((key, i) => {
      const u = upgrades[key];
      const y = 78 + i * 55;
      const maxed = u.level >= u.max;
      const cost = maxed ? "max" : upgradeCost(key);
      roundRect(660, y, 190, 42, 20);
      ctx.fillStyle = pearls >= cost || maxed ? "#ff9fbd" : "#e8dce2";
      ctx.fill();
      text(`${u.label} ${u.level}/${u.max}`, 675, y + 26, 16, "#ffffff", "left");
      text(String(cost), 835, y + 26, 15, "#ffffff", "right");
      buttons.push({ key, x: 660, y, w: 190, h: 42 });
      text(u.desc, 675, y + 49, 12, "#9b7f89", "left");
    });

    panel(300, 20, 300, 64);
    text(message, 450, 58, 18, "#6b4b57", "center");

    roundRect(352, 94, 196, 38, 19);
    ctx.fillStyle = "#fff8fb";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 143, 163, 0.72)";
    ctx.lineWidth = 2;
    ctx.stroke();
    text("Fish Directory", 450, 119, 17, "#ff6f9d", "center");
    buttons.push({ action: "directory", x: 352, y: 94, w: 196, h: 38 });
  }

  function drawCatchMeter() {
    const c = catchGame;
    panel(305, 535, 515, 70);
    const x = 346;
    const y = 563;
    const w = 390;
    const h = 18;

    roundRect(x, y, w, h, 9);
    ctx.fillStyle = "#f5e8ee";
    ctx.fill();

    const zx = x + (c.target - c.zone / 2) * w;
    roundRect(zx, y - 4, c.zone * w, h + 8, 11);
    ctx.fillStyle = "#b8f4d3";
    ctx.fill();

    ctx.fillStyle = "#ff7fa9";
    ctx.beginPath();
    ctx.arc(x + c.marker * w, y + h / 2, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x + c.marker * w - 4, y + h / 2 - 4, 4, 0, Math.PI * 2);
    ctx.fill();

    bar(346, 589, 180, 9, c.progress / 100, "#8be3c2");
    bar(556, 589, 180, 9, c.tension / 100, "#ff8fa3");
    text("catch", 436, 609, 12, "#6b4b57", "center");
    text("tension", 646, 609, 12, "#6b4b57", "center");
  }

  function panel(x, y, w, h) {
    ctx.save();
    ctx.shadowColor = "rgba(255,143,163,0.22)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 10;
    roundRect(x, y, w, h, 24);
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "rgba(255,192,203,0.8)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function bar(x, y, w, h, pct, color) {
    roundRect(x, y, w, h, h / 2);
    ctx.fillStyle = "#f3e6ec";
    ctx.fill();
    roundRect(x, y, w * clamp(pct, 0, 1), h, h / 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function drawCloud(x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.beginPath();
    ctx.ellipse(-30, 8, 30, 18, 0, 0, Math.PI * 2);
    ctx.ellipse(0, 0, 34, 24, 0, 0, Math.PI * 2);
    ctx.ellipse(34, 10, 32, 18, 0, 0, Math.PI * 2);
    ctx.ellipse(4, 17, 60, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawReeds(x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.strokeStyle = "#6fbd83";
    ctx.lineWidth = 4;
    for (let i = 0; i < 4; i++) {
      const dx = (i - 1.5) * 10;
      ctx.beginPath();
      ctx.moveTo(dx, 32);
      ctx.quadraticCurveTo(dx + Math.sin(time + i) * 8, -8, dx + (i - 1.5) * 5, -38 - i * 5);
      ctx.stroke();
    }
    ctx.fillStyle = "#d49b68";
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.ellipse((i - 0.5) * 18, -37 - i * 8, 5, 15, 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPebbles() {
    const pebbles = [
      [296, 366, 18, 9, "#cfd7dc"], [323, 383, 12, 7, "#e9d0d9"],
      [824, 287, 15, 8, "#d7e7dd"], [854, 303, 20, 10, "#f2d6de"],
      [410, 548, 15, 8, "#d8d5e8"], [436, 555, 11, 6, "#eff0f5"],
    ];
    for (const [x, y, rx, ry, color] of pebbles) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawBow(x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = "#ff7fa9";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-22, -16, -34, -12, -27, 5);
    ctx.bezierCurveTo(-17, 18, -7, 10, 0, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(22, -16, 34, -12, 27, 5);
    ctx.bezierCurveTo(17, 18, 7, 10, 0, 0);
    ctx.fill();
    ctx.fillStyle = "#ff5d94";
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawLily(x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = "#7ed99b";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 32, 0.25, Math.PI * 1.85);
    ctx.closePath();
    ctx.fill();
    drawFlower(8, -8, "#ffd1dc", 0.55);
    ctx.restore();
  }

  function drawFlower(x, y, color, s = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = color;
    for (let i = 0; i < 5; i++) {
      ctx.rotate((Math.PI * 2) / 5);
      ctx.beginPath();
      ctx.ellipse(0, -10, 6, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#fff2a8";
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function text(str, x, y, size, color, align = "center") {
    ctx.fillStyle = color;
    ctx.font = `700 ${size}px 'Baloo 2', system-ui`;
    ctx.textAlign = align;
    ctx.fillText(str, x, y);
  }

  function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function star(x, y, r, points) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const rad = i % 2 ? r * 0.45 : r;
      const a = i * Math.PI / points - Math.PI / 2;
      const px = x + Math.cos(a) * rad;
      const py = y + Math.sin(a) * rad;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
  }

  function eventPoint(e) {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return {
      x: (t.clientX - rect.left) * W / rect.width,
      y: (t.clientY - rect.top) * H / rect.height,
    };
  }

  function press(e) {
    if (state === "start") return;
    e.preventDefault();
    const p = eventPoint(e);
    pointer = { ...p, down: true, active: true };
    const hitBtn = buttons.find(b => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h);
    if (hitBtn && state === "playing" && !cast) {
      if (hitBtn.action === "directory") {
        openDirectory();
        return;
      }
      buyUpgrade(hitBtn.key);
      return;
    }
    if (state === "playing") castLine(p.x, p.y);
  }

  function move(e) {
    if (state === "start") return;
    const p = eventPoint(e);
    pointer.x = p.x;
    pointer.y = p.y;
  }

  function release() {
    pointer.down = false;
  }

  canvas.addEventListener("pointerdown", press);
  canvas.addEventListener("pointermove", move);
  window.addEventListener("pointerup", release);
  canvas.addEventListener("touchstart", press, { passive: false });
  canvas.addEventListener("touchmove", move, { passive: false });
  window.addEventListener("touchend", release);

  window.addEventListener("keydown", e => {
    if (e.key === " " && state === "playing") {
      pointer.down = true;
      e.preventDefault();
    }
    if (e.key === "Escape" && state === "reveal") {
      closeCatchReveal();
      return;
    }
    if (e.key.toLowerCase() === "p" || e.key === "Escape") togglePause();
  });
  window.addEventListener("keyup", e => {
    if (e.key === " ") pointer.down = false;
  });

  function togglePause() {
    if (state === "reveal") {
      closeCatchReveal();
      return;
    }
    if (!document.getElementById("screen-directory").classList.contains("hide")) {
      closeDirectory();
      return;
    }
    if (state === "playing" || state === "catching") {
      state = "paused";
      show("screen-pause");
    } else if (state === "paused") {
      state = catchGame ? "catching" : "playing";
      hide("screen-pause");
    }
  }

  function showCatchReveal(f, value, isNew) {
    const eyebrow = document.getElementById("catch-reveal-eyebrow");
    const art = document.getElementById("catch-reveal-fish");
    const name = document.getElementById("catch-reveal-name");
    const details = document.getElementById("catch-reveal-details");
    eyebrow.textContent = isNew ? "New pond friend!" : "Another sweet catch!";
    art.innerHTML = fishGraphic(f.type, true);
    name.textContent = f.type.name;
    details.textContent = `${fishSizeName(f.size)} • ${rarityLabel(f.type.rarity)} • ${value} points`;
    show("screen-catch-reveal");
    clearCatchRevealTimer();
    catchRevealTimer = window.setTimeout(closeCatchReveal, 2000);
  }

  function closeCatchReveal() {
    clearCatchRevealTimer();
    hide("screen-catch-reveal");
    if (state === "reveal") state = "playing";
  }

  function clearCatchRevealTimer() {
    if (!catchRevealTimer) return;
    window.clearTimeout(catchRevealTimer);
    catchRevealTimer = null;
  }

  function openDirectory() {
    stateBeforeDirectory = state;
    if (state === "playing" || state === "catching") state = "paused";
    renderDirectory();
    hide("screen-pause");
    show("screen-directory");
  }

  function closeDirectory() {
    hide("screen-directory");
    if (stateBeforeDirectory === "playing" || stateBeforeDirectory === "catching") {
      state = catchGame ? "catching" : "playing";
    } else {
      state = stateBeforeDirectory;
    }
  }

  function show(id) {
    document.getElementById(id).classList.remove("hide");
  }

  function hide(id) {
    document.getElementById(id).classList.add("hide");
  }

  document.getElementById("btn-start").addEventListener("click", startGame);
  document.getElementById("btn-resume").addEventListener("click", togglePause);
  document.getElementById("btn-open-directory-start").addEventListener("click", openDirectory);
  document.getElementById("btn-close-directory").addEventListener("click", closeDirectory);
  document.getElementById("btn-close-catch-reveal").addEventListener("click", closeCatchReveal);
  renderDirectory();
})();
