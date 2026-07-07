/* ============================================================
   FROG KINGDOM 🐸👑 — grow a kawaii frog civilization!
   ------------------------------------------------------------
   THE BIG IDEA
   - Every frog is a little individual: a name, a pastel color,
     a MOOD, a FAVORITE FOOD, a PERSONALITY, FRIENDS (friendship
     grows when they chat!) and a HOME lily pad.
   - You build the world: ponds, lily pads, bridges, restaurants,
     libraries, gardens, a festival stage… and finally the Frog
     Castle 👑 to crown your civilization.
   - Frogs live their own lives: they get hungry and visit
     restaurants (extra happy if it serves their favorite food!),
     get lonely and seek friends, study at the library, sleep on
     their lily pads at night, and celebrate at festivals.
   - Day/night cycle with fireflies 🌙, surprise rain showers 🌧
     (frogs LOVE rain), a quest line that guides you, and a
     kingdom that AUTO-SAVES in your browser.
   - Unique generative soundtrack: a pentatonic "pond music box"
     that composes itself live with croak-bass and water-drop
     percussion — never the same song twice, 100% code, no files.
   ------------------------------------------------------------
   HANDY TUNING KNOBS are marked with 🔧 in the comments below.
   ============================================================ */

(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const GAME_ID = "frog-kingdom";
  const SAVE_KEY = "gabi_frogkingdom_save";

  const W = 360, H = 480;
  function fitCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  fitCanvas();
  window.addEventListener("resize", fitCanvas);

  /* ============================================================
     🎵 FROG MUSIC — generative pond soundtrack (unique to this game)
     A note-scheduler picks pentatonic notes by "random walk", lays
     a soft chord pad underneath, adds a croaky bass every couple of
     bars and water-drop plinks (more of them when it rains!).
     Night = sleepier & sparser. Festivals = faster & denser!
     ============================================================ */
  const FrogMusic = (() => {
    let actx = null, master = null, nextNote = 0, beat = 0, started = false;
    let festivalT = 0, mel = 3;
    const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25]; // C pentatonic, 2 octaves

    function ensure() {
      if (actx) return;
      actx = new (window.AudioContext || window.webkitAudioContext)();
      master = actx.createGain(); master.gain.value = 0;
      master.connect(actx.destination);
    }
    function pluck(f, t, d, v, type = "triangle") {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.05);
    }
    function croakAt(t, v = 0.15) {   // a friendly froggy "brrp"
      const o = actx.createOscillator(), g = actx.createGain(), f = actx.createBiquadFilter();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(96, t);
      o.frequency.exponentialRampToValueAtTime(58, t + 0.18);
      f.type = "lowpass"; f.frequency.value = 320;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + 0.3);
    }
    function drip(t) {                // water-drop plink 💧
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(1100, t);
      o.frequency.exponentialRampToValueAtTime(430, t + 0.09);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.11, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.16);
    }
    function start() {
      ensure();
      if (actx.state === "suspended") actx.resume();
      if (!started) { started = true; nextNote = actx.currentTime + 0.1; beat = 0; }
    }
    function update(dt, muted, night, raining) {
      if (!started) return;
      festivalT = Math.max(0, festivalT - dt);
      master.gain.setTargetAtTime(muted ? 0 : 0.42, actx.currentTime, 0.05);
      const spb = festivalT > 0 ? 0.155 : 0.235;      // 🔧 tempo (sec per 8th note)
      while (nextNote < actx.currentTime + 0.35) {
        const t = nextNote;
        const density = (night ? 0.32 : 0.55) + (festivalT > 0 ? 0.25 : 0);
        if (Math.random() < density) {
          mel = Math.max(0, Math.min(SCALE.length - 1, mel + [-2, -1, -1, 0, 1, 1, 2][(Math.random() * 7) | 0]));
          pluck(SCALE[mel], t, 0.55, night ? 0.12 : 0.17);
          if (Math.random() < 0.18) pluck(SCALE[Math.max(0, mel - 2)], t, 0.6, 0.08); // sweet harmony
        }
        if (beat % 16 === 0) { pluck(130.81, t, 1.9, 0.10, "sine"); pluck(196.0, t, 1.9, 0.06, "sine"); } // C+G pad
        if (beat % 32 === 8 && !night) croakAt(t);
        if (beat % 8 === 4 && Math.random() < (raining ? 0.34 : 0.10)) drip(t + Math.random() * 0.1);
        nextNote += spb; beat++;
      }
    }
    return { start, update, croak: () => { if (actx) croakAt(actx.currentTime, 0.2); }, festival: () => { festivalT = 9; } };
  })();
  // This page has its own soundtrack — politely mute the shared site loop.
  GabiAudio.startMusic = () => {};
  const startAudio = () => {
    GabiAudio.unlock(); FrogMusic.start();
    window.removeEventListener("pointerdown", startAudio);
    window.removeEventListener("keydown", startAudio);
  };
  window.addEventListener("pointerdown", startAudio);
  window.addEventListener("keydown", startAudio);

  /* ============================================================
     WORLD DATA
     ============================================================ */
  const GW = 12, GH = 10, TILE = 30, MAPY = 62;   // 12×10 tile map below the top bar

  const FOODS = [
    { id: "boba",  e: "🧋", label: "Boba" },
    { id: "berry", e: "🍓", label: "Berries" },
    { id: "cake",  e: "🍰", label: "Cake" },
    { id: "tea",   e: "🍵", label: "Tea" },
    { id: "pie",   e: "🥧", label: "Fly Pie" },
  ];
  const PERSONALITIES = [
    { id: "shy",    e: "🌸", label: "Shy" },      // happier alone, chats less
    { id: "bubbly", e: "🫧", label: "Bubbly" },   // needs friends often
    { id: "sleepy", e: "😴", label: "Sleepy" },   // extra naps
    { id: "brainy", e: "📚", label: "Brainy" },   // loves the library, has ideas 💡
    { id: "sunny",  e: "☀️", label: "Sunny" },    // mood decays slower
  ];
  const NAMES = ["Mochi","Pip","Toto","Kero","Bubbles","Momo","Lulu","Basil","Peach","Nori",
                 "Tama","Poppy","Sprout","Umi","Beans","Clover","Suki","Pudding","Fern","Dodo"];
  const SKINS = ["#9BE3A8","#A8EFC9","#BFE8A0","#93D9C8","#C4EDA5","#8FD8B0"];
  const RARE  = ["#FFC2DA","#AFD8FF"];            // 10% chance of a rare pink/blue frog!

  /* ---- Buildings (🔧 costs, unlock quest index, descriptions) ---- */
  const BUILDS = [
    { k:"pond",  e:"💧", label:"Pond",       cost:25,  on:"g", unlockQ:0,  desc:"Turns grass into sparkling water." },
    { k:"lily",  e:"🪷", label:"Lily pad",   cost:15,  on:"w", unlockQ:0,  desc:"A frog home! One frog per pad." },
    { k:"bridge",e:"🌉", label:"Bridge",     cost:20,  on:"w", unlockQ:2,  desc:"Cross the water. Frogs chat here!" },
    { k:"rest",  e:"🍓", label:"Restaurant", cost:40,  on:"g", unlockQ:3,  desc:"Serves 2 foods. Fav food = big joy!" },
    { k:"lib",   e:"📚", label:"Library",    cost:60,  on:"g", unlockQ:5,  desc:"Frogs study here → Knowledge 📖" },
    { k:"garden",e:"🌷", label:"Garden",     cost:30,  on:"g", unlockQ:6,  desc:"So pretty! Cheers up frogs nearby." },
    { k:"stage", e:"🎪", label:"Stage",      cost:120, on:"g", unlockQ:8,  desc:"Unlocks the Festival button 🎉" },
    { k:"castle",e:"🏰", label:"Castle",     cost:300, on:"g", unlockQ:11, desc:"Needs 60📖 & 8🐸 → CIVILIZATION!" },
    { k:"erase", e:"🧽", label:"Remove",     cost:0,   on:"*", unlockQ:0,  desc:"Remove a building (half refund)." },
  ];

  /* ---- Quest line (the road to civilization 👑) ---- */
  const QUESTS = [
    { text:"Place a lily pad 🪷",            check:s=>countB("lily")>=3,            reward:20 },
    { text:"Welcome 3 frogs 🐸",             check:s=>frogs.length>=3,              reward:25 },
    { text:"Build a bridge 🌉",              check:s=>countB("bridge")>=1,          reward:30 },
    { text:"Open a restaurant 🍓",           check:s=>countB("rest")>=1,            reward:30 },
    { text:"A frog eats its FAVORITE food 💖",check:s=>flags.ateFav,                reward:35 },
    { text:"Build a library 📚",             check:s=>countB("lib")>=1,             reward:40 },
    { text:"Best friends! (friendship 5 💞)", check:s=>flags.bestFriends,            reward:40 },
    { text:"Reach 30 Knowledge 📖",          check:s=>res.know>=30,                 reward:50 },
    { text:"Build the festival stage 🎪",    check:s=>countB("stage")>=1,           reward:60 },
    { text:"Host a festival 🎉",             check:s=>flags.festival,               reward:60 },
    { text:"Grow to 8 frogs 🐸🐸",           check:s=>frogs.length>=8,              reward:80 },
    { text:"Build the Frog Castle 👑",       check:s=>countB("castle")>=1,          reward:150 },
  ];

  /* ============================================================
     GAME STATE
     ============================================================ */
  let state = "start";                 // start | playing | paused
  let playerName = localStorage.getItem("gabi_player_name") || "";
  let tiles, frogs, res, questIdx, flags, dayT, dayCount, rain, tool = null;
  let frogSel = null, victoryShown = false, frogIdSeq = 1;
  let time = 0, saveT = 0, arriveT = 10, incomeT = 0, lastScoreSave = -99, startTime = performance.now();
  let particles = [], floaters = [], fireflies = [];

  function freshWorld() {
    tiles = [];
    for (let y = 0; y < GH; y++) {
      const row = [];
      for (let x = 0; x < GW; x++) row.push({ t: "g", b: null });
      tiles.push(row);
    }
    // A cozy starter pond with two lily pads 💚
    [[5,3],[6,3],[4,4],[5,4],[6,4],[7,4],[5,5],[6,5]].forEach(([x,y]) => tiles[y][x].t = "w");
    tiles[4][5].b = { k: "lily" };
    tiles[4][6].b = { k: "lily" };
    frogs = []; frogIdSeq = 1;
    res = { flies: 40, know: 0 };
    questIdx = 0;
    flags = { ateFav: false, bestFriends: false, festival: false };
    dayT = 8; dayCount = 1;
    rain = { on: false, t: 0, next: 70 + Math.random() * 60 };
    spawnFrog(5, 4); spawnFrog(6, 4);
    frogs[0].home = { x: 5, y: 4 }; frogs[1].home = { x: 6, y: 4 };
    victoryShown = false; tool = null; frogSel = null;
    particles = []; floaters = []; startTime = performance.now();
  }

  const tileAt = (x, y) => (x >= 0 && y >= 0 && x < GW && y < GH) ? tiles[y][x] : null;
  const walkable = (x, y) => {
    const t = tileAt(x, y);
    if (!t) return false;
    return t.t === "g" || (t.b && (t.b.k === "lily" || t.b.k === "bridge"));
  };
  function countB(k) { let n = 0; for (const row of tiles) for (const t of row) if (t.b && t.b.k === k) n++; return n; }
  function eachTile(fn) { for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) fn(tiles[y][x], x, y); }

  /* ============================================================
     FROGS 🐸 — little individuals
     ============================================================ */
  function spawnFrog(x, y) {
    const rare = Math.random() < 0.1;
    const f = {
      id: frogIdSeq++,
      name: NAMES[(Math.random() * NAMES.length) | 0] + (frogs.some(o => o.name) ? "" : ""),
      skin: rare ? RARE[(Math.random() * RARE.length) | 0] : SKINS[(Math.random() * SKINS.length) | 0],
      pers: (Math.random() * PERSONALITIES.length) | 0,
      food: (Math.random() * FOODS.length) | 0,
      mood: 70, hunger: 20 + Math.random() * 20, social: 20 + Math.random() * 30,
      friends: {},                       // { otherId: friendshipPoints }
      home: null,                        // {x,y} of a lily pad
      x, y, fx: x, fy: y,                // grid pos + smooth draw pos
      state: "idle", stT: 0, path: [], goal: null,
      hopFrom: null, hopT: 0, decideT: 1 + Math.random() * 2,
      blink: 1 + Math.random() * 3, bob: Math.random() * 6,
      bubble: null, bubbleT: 0, petCd: 0, ideaT: 8 + Math.random() * 14,
    };
    // avoid duplicate names when possible
    const used = new Set(frogs.map(o => o.name));
    if (used.has(f.name)) { const free = NAMES.filter(n => !used.has(n)); if (free.length) f.name = free[(Math.random() * free.length) | 0]; }
    frogs.push(f);
    return f;
  }

  const persOf = f => PERSONALITIES[f.pers].id;

  /* ---- BFS pathfinding over walkable tiles ---- */
  function bfsPath(sx, sy, pred) {
    const key = (x, y) => y * GW + x;
    const prev = new Map(); prev.set(key(sx, sy), null);
    const q = [[sx, sy]];
    while (q.length) {
      const [cx, cy] = q.shift();
      if (!(cx === sx && cy === sy) && pred(tileAt(cx, cy), cx, cy)) {
        const path = []; let cur = { x: cx, y: cy };
        while (cur) { path.push({ x: cur.x, y: cur.y }); cur = prev.get(key(cur.x, cur.y)); }
        path.pop();                    // drop the start tile
        return path.reverse();
      }
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= GW || ny >= GH || prev.has(key(nx, ny)) || !walkable(nx, ny)) continue;
        prev.set(key(nx, ny), { x: cx, y: cy });
        q.push([nx, ny]);
      }
    }
    return null;
  }

  function setPath(f, path, goal) { if (path && path.length) { f.path = path; f.goal = goal; startHop(f); } }
  function startHop(f) {
    const next = f.path.shift();
    if (!next) return;
    f.hopFrom = { x: f.x, y: f.y };
    f.x = next.x; f.y = next.y;
    f.hopT = 0; f.state = "hop";
  }

  const isNight = () => dayT > 55;                 // 🔧 70s day: 55 light + 15 night

  /* ---- The big decision: what does this frog want right now? ---- */
  function decide(f) {
    const p = persOf(f);
    if (isNight()) {                               // bedtime! 🌙
      if (f.home && (f.x !== f.home.x || f.y !== f.home.y)) {
        const path = bfsPath(f.x, f.y, (t, x, y) => x === f.home.x && y === f.home.y);
        if (path) return setPath(f, path, "home");
      } else if (f.home) { f.state = "sleep"; return; }
    }
    if (f.hunger > 62 && countB("rest") > 0) {
      const path = bfsPath(f.x, f.y, t => t.b && t.b.k === "rest");
      if (path) return setPath(f, path, "eat");
    }
    if (f.social > (p === "bubbly" ? 55 : 72) && frogs.length > 1 && p !== "shy") {
      const others = frogs.filter(o => o !== f && o.state !== "sleep");
      if (others.length) {
        const buddy = others[(Math.random() * others.length) | 0];
        const path = bfsPath(f.x, f.y, (t, x, y) => Math.abs(x - buddy.x) + Math.abs(y - buddy.y) <= 1);
        if (path) return setPath(f, path, "social");
      }
    }
    if (p === "brainy" && countB("lib") > 0 && Math.random() < 0.5) {
      const path = bfsPath(f.x, f.y, t => t.b && t.b.k === "lib");
      if (path) return setPath(f, path, "read");
    }
    if (p === "sleepy" && Math.random() < 0.25) { f.state = "sleep"; f.stT = 4; return; }
    if (Math.random() < 0.72) {                    // wander somewhere nearby
      const opts = [];
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) if (walkable(f.x + dx, f.y + dy)) opts.push({ x: f.x + dx, y: f.y + dy });
      if (opts.length) return setPath(f, [opts[(Math.random() * opts.length) | 0]], "wander");
    }
    f.decideT = 0.8 + Math.random() * 1.5;         // just vibing 🌿
  }

  function arrive(f) {
    const t = tileAt(f.x, f.y);
    if (f.goal === "eat" && t.b && t.b.k === "rest") {
      const fav = t.b.menu.includes(f.food);
      f.hunger = 0;
      f.mood = Math.min(100, f.mood + (fav ? 18 : 8));
      res.flies += 3;
      f.bubble = FOODS[fav ? f.food : t.b.menu[0]].e; f.bubbleT = 1.6;
      if (fav) { flags.ateFav = true; burst(px(f.x), py(f.y) - 14, "#FF9EC8", 8, 90, "heart"); }
      f.state = "eat"; f.stT = 1.6;
    } else if (f.goal === "read" && t.b && t.b.k === "lib") {
      res.know += 2;
      f.mood = Math.min(100, f.mood + 6);
      f.bubble = "📖"; f.bubbleT = 1.6;
      f.state = "read"; f.stT = 1.8;
      floatText(px(f.x), py(f.y) - 22, "+2 📖", "#8B7CC9");
    } else if (f.goal === "social") {
      const buddy = frogs.find(o => o !== f && Math.abs(o.x - f.x) + Math.abs(o.y - f.y) <= 1 && o.state !== "sleep");
      if (buddy) {
        f.state = "chat"; f.stT = 2; buddy.state = "chat"; buddy.stT = 2;
        f.bubble = "♪"; f.bubbleT = 2; buddy.bubble = "💬"; buddy.bubbleT = 2;
        f.social = 0; buddy.social = Math.max(0, buddy.social - 40);
        f.friends[buddy.id] = (f.friends[buddy.id] || 0) + 1;
        buddy.friends[f.id] = (buddy.friends[f.id] || 0) + 1;
        f.mood = Math.min(100, f.mood + 8); buddy.mood = Math.min(100, buddy.mood + 8);
        const onBridge = t.b && t.b.k === "bridge";
        if (onBridge) { f.friends[buddy.id]++; buddy.friends[f.id]++; }   // bridges = bonding spots!
        if (f.friends[buddy.id] >= 5) flags.bestFriends = true;
        burst((px(f.x) + px(buddy.x)) / 2, py(f.y) - 16, "#FF9EC8", 6, 70, "heart");
      } else { f.state = "idle"; f.decideT = 0.5; }
    } else if (f.goal === "home") {
      f.state = "sleep";
    } else { f.state = "idle"; f.decideT = 0.6 + Math.random() * 1.2; }
    f.goal = null;
  }

  function updateFrog(f, dt) {
    f.blink -= dt; if (f.blink < -0.13) f.blink = 1.2 + Math.random() * 3;
    f.bubbleT = Math.max(0, f.bubbleT - dt);
    f.petCd = Math.max(0, f.petCd - dt);
    // needs tick 🔧
    const p = persOf(f);
    f.hunger = Math.min(100, f.hunger + dt * (100 / 75));
    f.social = Math.min(100, f.social + dt * (100 / (p === "bubbly" ? 60 : 95)));
    let decay = 1.1;
    if (p === "sunny") decay = 0.6;
    if (rain.on) decay = -2.2;                       // frogs LOVE rain 🌧💚
    if (f.hunger > 85 || f.social > 90) decay += 1.6;
    // gardens spread joy to neighbors 🌷
    let nearGarden = false;
    for (const [dx, dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]) { const t = tileAt(f.x + dx, f.y + dy); if (t && t.b && t.b.k === "garden") nearGarden = true; }
    if (nearGarden) decay -= 1.2;
    f.mood = Math.max(5, Math.min(100, f.mood - decay * dt));
    // brainy ideas 💡
    if (p === "brainy") { f.ideaT -= dt; if (f.ideaT <= 0) { f.ideaT = 14 + Math.random() * 16; if (Math.random() < 0.55) { res.know++; f.bubble = "💡"; f.bubbleT = 1.4; } } }

    if (f.state === "hop") {
      f.hopT += dt / 0.32;
      if (f.hopT >= 1) {
        f.fx = f.x; f.fy = f.y;
        if (f.path.length) startHop(f); else arrive(f);
      } else {
        f.fx = lerp(f.hopFrom.x, f.x, f.hopT);
        f.fy = lerp(f.hopFrom.y, f.y, f.hopT);
      }
    } else if (f.state === "sleep") {
      f.mood = Math.min(100, f.mood + dt * 2.5);
      f.hunger = Math.min(100, f.hunger - dt * (100 / 75) * 0.6); // digestion slows at night
      if (f.stT > 0) { f.stT -= dt; if (f.stT <= 0) f.state = "idle"; }
      else if (!isNight()) { f.state = "idle"; f.decideT = 0.5; }
    } else if (f.state === "eat" || f.state === "read" || f.state === "chat") {
      f.stT -= dt;
      if (f.stT <= 0) { f.state = "idle"; f.decideT = 0.8 + Math.random(); }
    } else { // idle
      f.decideT -= dt;
      if (f.decideT <= 0) decide(f);
    }
  }

  /* ============================================================
     ECONOMY, EVENTS, QUESTS
     ============================================================ */
  function avgMood() { return frogs.length ? frogs.reduce((s, f) => s + f.mood, 0) / frogs.length : 0; }
  function totalBuildings() { let n = 0; eachTile(t => { if (t.b) n++; }); return n; }
  function friendshipTotal() { let n = 0; for (const f of frogs) for (const k in f.friends) n += f.friends[k]; return n / 2 | 0; }
  function kingdomScore() {
    return frogs.length * 40 + totalBuildings() * 15 + res.know * 2 + friendshipTotal() * 3
         + questIdx * 25 + Math.round(avgMood()) + (countB("castle") ? 300 : 0);
  }

  function updateWorld(dt) {
    time += dt;
    // day/night
    dayT += dt;
    if (dayT >= 70) { dayT = 0; dayCount++; }
    // rain showers 🌧
    if (rain.on) { rain.t -= dt; if (rain.t <= 0) { rain.on = false; rain.next = 80 + Math.random() * 70; } }
    else { rain.next -= dt; if (rain.next <= 0) { rain.on = true; rain.t = 14; toast("Rain shower! Frogs are delighted 🌧💚"); } }
    // fly income from happy frogs
    incomeT += dt;
    if (incomeT > 4) {                              // 🔧 every 4s
      incomeT = 0;
      for (const f of frogs) if (f.mood > 60) { res.flies++; if (Math.random() < 0.4) floatText(px(f.x), py(f.y) - 24, "+1🪰", "#7FA85C"); }
    }
    // new frogs move in when the kingdom is lovely 💚
    arriveT -= dt;
    if (arriveT <= 0) {
      arriveT = 13 + Math.random() * 8;             // 🔧 arrival check rate
      const freePads = [];
      eachTile((t, x, y) => { if (t.b && t.b.k === "lily" && !frogs.some(f => f.home && f.home.x === x && f.home.y === y)) freePads.push({ x, y }); });
      if (freePads.length && frogs.length < 14 && avgMood() > 52) {
        const pad = freePads[(Math.random() * freePads.length) | 0];
        const f = spawnFrog(pad.x, pad.y);
        f.home = { x: pad.x, y: pad.y };
        burst(px(pad.x), py(pad.y), "#A8EFC9", 12, 110, "circle");
        toast(`${f.name} the ${PERSONALITIES[f.pers].label} frog moved in! 🐸`);
        GabiAudio.sfx.score();
      }
    }
    // quest progress
    if (questIdx < QUESTS.length && QUESTS[questIdx].check()) {
      res.flies += QUESTS[questIdx].reward;
      toast(`Quest done! +${QUESTS[questIdx].reward}🪰  ✔ ${QUESTS[questIdx].text}`);
      GabiAudio.sfx.score();
      questIdx++;
      if (questIdx === QUESTS.length && !victoryShown) victory();
    }
    for (const f of frogs) updateFrog(f, dt);
    // fireflies at night ✨
    if (isNight() && fireflies.length < 14 && Math.random() < 0.2)
      fireflies.push({ x: Math.random() * W, y: MAPY + Math.random() * 300, a: Math.random() * 6 });
    if (!isNight()) fireflies.length = 0;
    for (const ff of fireflies) { ff.a += dt; ff.x += Math.sin(ff.a * 1.7) * 12 * dt; ff.y += Math.cos(ff.a * 1.3) * 10 * dt; }
    // particles & floaters
    for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 180 * dt; p.life -= dt * 1.5; }
    particles = particles.filter(p => p.life > 0);
    for (const fl of floaters) { fl.y -= 22 * dt; fl.t -= dt; }
    floaters = floaters.filter(fl => fl.t > 0);
    // autosave 🌱
    saveT += dt;
    if (saveT > 8) { saveT = 0; save(); }
  }

  async function victory() {
    victoryShown = true;
    for (let i = 0; i < 40; i++) burst(Math.random() * W, MAPY + Math.random() * 280, ["#FFC0CB","#A8EFC9","#E7D6FF","#FFE48A"][i % 4], 1, 150, i % 3 ? "circle" : "heart");
    GabiAudio.sfx.over();   // (it's a fanfare-ish jingle — closest thing we have!)
    document.getElementById("over-title").textContent = "👑 Civilization Achieved!";
    await submitScore(true);
    show("screen-over");
    state = "paused";
  }

  async function submitScore(showBoard) {
    const score = kingdomScore();
    document.getElementById("over-score").textContent = `Kingdom Score: ${score} 🐸`;
    const durationMs = performance.now() - startTime;
    const rEs = await GabiLeaderboard.submit({ name: playerName, score, game: GAME_ID, durationMs });
    const board = (rEs && rEs.board) ? rEs.board : await GabiLeaderboard.get(GAME_ID);
    const top5 = board.filter(e => e.game === GAME_ID).slice(0, 5);
    document.getElementById("mini-lb").innerHTML =
      top5.map((e, i) => `<li><span>${["🥇","🥈","🥉"][i] || (i + 1)} ${escapeHtml(e.name)}</span><span>${e.score}</span></li>`).join("")
      || "<li>Be the first! 💕</li>";
    return rEs;
  }
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  /* ============================================================
     SAVE / LOAD (auto-saves to this browser)
     ============================================================ */
  function save() {
    try {
      const data = {
        v: 1, tiles: tiles.map(r => r.map(t => ({ t: t.t, b: t.b ? { k: t.b.k, menu: t.b.menu } : 0 }))),
        frogs: frogs.map(f => ({ id: f.id, name: f.name, skin: f.skin, pers: f.pers, food: f.food,
          mood: f.mood, hunger: f.hunger, social: f.social, friends: f.friends, home: f.home, x: f.x, y: f.y })),
        res, questIdx, flags, dayT, dayCount, frogIdSeq,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) { /* storage full/blocked — the game just keeps playing */ }
  }
  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!d || d.v !== 1) return false;
      freshWorld();
      tiles = d.tiles.map(r => r.map(c => ({ t: c.t, b: c.b ? { k: c.b.k, menu: c.b.menu } : null })));
      frogs = d.frogs.map(s => {
        const f = { ...s, fx: s.x, fy: s.y, state: "idle", stT: 0, path: [], goal: null,
          hopFrom: null, hopT: 0, decideT: Math.random(), blink: 1, bob: Math.random() * 6,
          bubble: null, bubbleT: 0, petCd: 0, ideaT: 10 };
        return f;
      });
      res = d.res; questIdx = d.questIdx; flags = d.flags;
      dayT = d.dayT; dayCount = d.dayCount; frogIdSeq = d.frogIdSeq || (Math.max(0, ...frogs.map(f => f.id)) + 1);
      return true;
    } catch (e) { return false; }
  }

  /* ============================================================
     INPUT — build, inspect, pet 💕
     ============================================================ */
  const px = gx => gx * TILE + TILE / 2;
  const py = gy => MAPY + gy * TILE + TILE / 2;
  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
  const lerp = (a,b,t)=>a+(b-a)*t;
  const inR = (p,x,y,w,h)=>p.x>=x&&p.x<=x+w&&p.y>=y&&p.y<=y+h;

  const buildBtns = BUILDS.map((b, i) => ({ ...b, x: 4 + i * 39.5, y: 368, w: 36, h: 44 }));
  const BTN_SAVE = { x: 256, y: 422, w: 98, h: 24 };
  const BTN_FEST = { x: 256, y: 450, w: 98, h: 24 };
  const BTN_PAUSE = { x: 330, y: 6, w: 26, h: 22 };

  const unlocked = b => questIdx >= b.unlockQ || countB(b.k) > 0;

  function tryPlace(gx, gy) {
    const t = tileAt(gx, gy);
    const b = BUILDS.find(x => x.k === tool);
    if (!t || !b) return;
    if (b.k === "erase") {
      if (!t.b) return;
      const spec = BUILDS.find(x => x.k === t.b.k);
      res.flies += Math.floor((spec ? spec.cost : 0) / 2);
      if (t.b.k === "lily") for (const f of frogs) if (f.home && f.home.x === gx && f.home.y === gy) f.home = null;
      t.b = null;
      burst(px(gx), py(gy), "#E8CFDA", 10, 100, "circle");
      GabiAudio.sfx.click();
      return;
    }
    if (!unlocked(b)) { toast(`Locked — finish more quests first! 🔒`); return; }
    if (res.flies < b.cost) { toast(`Not enough flies! Need ${b.cost}🪰`); return; }
    if (b.k === "castle" && (res.know < 60 || frogs.length < 8)) { toast("The castle needs 60📖 and 8 frogs! 👑"); return; }
    if (b.k === "pond") {
      if (t.t !== "g" || t.b) return toast("Ponds go on empty grass 💧");
      t.t = "w";
    } else if (b.on === "w") {
      if (t.t !== "w" || t.b) return toast(`${b.label}s go on empty water 🌊`);
      t.b = { k: b.k };
    } else {
      if (t.t !== "g" || t.b) return toast(`${b.label}s go on empty grass 🌿`);
      t.b = { k: b.k };
      if (b.k === "rest") {                    // every restaurant serves 2 random foods
        const a = (Math.random() * FOODS.length) | 0;
        let c = (Math.random() * FOODS.length) | 0; if (c === a) c = (c + 1) % FOODS.length;
        t.b.menu = [a, c];
      }
    }
    res.flies -= b.cost;
    burst(px(gx), py(gy), "#FFE48A", 12, 110, "circle");
    GabiAudio.sfx.score();
    save();
  }

  function handleTap(p) {
    if (state !== "playing") return;
    if (inR(p, BTN_PAUSE.x, BTN_PAUSE.y, BTN_PAUSE.w, BTN_PAUSE.h)) return togglePause();

    if (frogSel) {                                   // frog card is open
      if (inR(p, 292, 100, 26, 26)) { frogSel = null; GabiAudio.sfx.click(); return; }
      if (inR(p, 120, 330, 120, 30)) {               // Pet 💕
        if (frogSel.petCd <= 0) {
          frogSel.petCd = 5;
          frogSel.mood = Math.min(100, frogSel.mood + 6);
          burst(W / 2, 250, "#FF9EC8", 8, 90, "heart");
          FrogMusic.croak();
        }
        return;
      }
      frogSel = null; return;                        // tap anywhere else closes
    }

    for (const b of buildBtns) if (inR(p, b.x, b.y, b.w, b.h)) {
      tool = (tool === b.k) ? null : b.k;
      GabiAudio.sfx.click();
      return;
    }
    if (inR(p, BTN_SAVE.x, BTN_SAVE.y, BTN_SAVE.w, BTN_SAVE.h)) {
      if (time - lastScoreSave < 30) return toast("Score already saved — try again in a bit! 🏆");
      lastScoreSave = time;
      toast("Saving your Kingdom Score… 🏆");
      submitScore().then(r => toast(r && r.online ? "Saved to the leaderboard! 🏆" : "Saved on this device 💾"));
      return;
    }
    if (countB("stage") > 0 && inR(p, BTN_FEST.x, BTN_FEST.y, BTN_FEST.w, BTN_FEST.h)) {
      if (res.flies < 40) return toast("A festival costs 40🪰!");
      res.flies -= 40; flags.festival = true;
      FrogMusic.festival();
      let sx = 6, sy = 5; eachTile((t, x, y) => { if (t.b && t.b.k === "stage") { sx = x; sy = y; } });
      for (const f of frogs) {
        f.mood = Math.min(100, f.mood + 25);
        const path = bfsPath(f.x, f.y, (t, x, y) => Math.abs(x - sx) + Math.abs(y - sy) <= 2);
        if (path) setPath(f, path, "wander");
        f.bubble = "🎉"; f.bubbleT = 3;
      }
      for (let i = 0; i < 30; i++) burst(px(sx), py(sy), ["#FFC0CB","#FFE48A","#A8EFC9"][i % 3], 1, 170, i % 2 ? "heart" : "circle");
      toast("FESTIVAL TIME! Everyone's dancing 🎉");
      GabiAudio.sfx.score();
      return;
    }
    // map taps
    if (p.y >= MAPY && p.y < MAPY + GH * TILE) {
      const gx = Math.floor(p.x / TILE), gy = Math.floor((p.y - MAPY) / TILE);
      if (tool) return tryPlace(gx, gy);
      // tap a frog?
      let bestF = null, bestD = 20;
      for (const f of frogs) {
        const d = Math.hypot(px(f.fx) - p.x, py(f.fy) - 6 - p.y);
        if (d < bestD) { bestD = d; bestF = f; }
      }
      if (bestF) { frogSel = bestF; FrogMusic.croak(); return; }
      const t = tileAt(gx, gy);
      if (t && t.b) {
        const spec = BUILDS.find(x => x.k === t.b.k);
        if (t.b.k === "rest") toast(`${spec.label}: serving ${FOODS[t.b.menu[0]].e} & ${FOODS[t.b.menu[1]].e}`);
        else toast(`${spec.e} ${spec.label} — ${spec.desc}`);
      }
    }
  }

  /* ============================================================
     DRAWING — the kingdom 🎨
     ============================================================ */
  function rr(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function heartPath(x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.35);
    ctx.bezierCurveTo(x - s, y - s * 0.55, x - s * 0.5, y - s * 1.1, x, y - s * 0.35);
    ctx.bezierCurveTo(x + s * 0.5, y - s * 1.1, x + s, y - s * 0.55, x, y + s * 0.35);
    ctx.closePath();
  }
  function burst(x, y, color, n, spread, shape) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = Math.random() * spread;
      particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30, life: 1, color, size: 2.5 + Math.random() * 3, shape: shape || "circle" });
    }
  }
  function floatText(x, y, text, color) { floaters.push({ x: clamp(x, 30, W - 30), y, text, color, t: 1.2 }); }
  let toastQ = [];
  function toast(text) { toastQ.push({ text, t: 3 }); if (toastQ.length > 2) toastQ.shift(); }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawMap();
    // frogs, painter-sorted so southern frogs draw in front
    [...frogs].sort((a, b) => a.fy - b.fy).forEach(drawFrog);
    drawWeatherAndNight();
    drawParticles();
    drawTopBar();
    drawBottomPanel();
    if (frogSel) drawFrogCard(frogSel);
    for (const fl of floaters) {
      ctx.globalAlpha = clamp(fl.t / 1.2, 0, 1);
      ctx.font = "700 13px 'Baloo 2', sans-serif"; ctx.textAlign = "center";
      ctx.fillStyle = fl.color; ctx.fillText(fl.text, fl.x, fl.y);
      ctx.globalAlpha = 1;
    }
    // toasts
    toastQ.forEach((tq, i) => {
      tq.t -= 1 / 60;
      ctx.globalAlpha = clamp(tq.t, 0, 1);
      ctx.font = "600 10.5px Quicksand, sans-serif";
      const w = ctx.measureText(tq.text).width + 20;
      rr(W / 2 - w / 2, 68 + i * 26, w, 20, 10);
      ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.fill();
      ctx.strokeStyle = "#BFE3CC"; ctx.stroke();
      ctx.fillStyle = "#5B7A66"; ctx.textAlign = "center";
      ctx.fillText(tq.text, W / 2, 82 + i * 26);
      ctx.globalAlpha = 1;
    });
    toastQ = toastQ.filter(tq => tq.t > 0);
  }

  function drawMap() {
    eachTile((t, x, y) => {
      const X = x * TILE, Y = MAPY + y * TILE;
      if (t.t === "g") {
        ctx.fillStyle = (x + y) % 2 ? "#CBEFC7" : "#C2EBBE";
        ctx.fillRect(X, Y, TILE, TILE);
        const h = (x * 7 + y * 13) % 11;                     // deterministic deco
        if (h === 3) { ctx.fillStyle = "#FFD3E3"; ctx.beginPath(); ctx.arc(X + 8, Y + 9, 2.4, 0, 7); ctx.fill(); ctx.fillStyle = "#FFE48A"; ctx.beginPath(); ctx.arc(X + 8, Y + 9, 1, 0, 7); ctx.fill(); }
        if (h === 7) { ctx.strokeStyle = "#A8D8A0"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(X + 22, Y + 24); ctx.quadraticCurveTo(X + 24, Y + 18, X + 21, Y + 14); ctx.stroke(); }
      } else {
        ctx.fillStyle = "#A9DCF2";
        ctx.fillRect(X, Y, TILE, TILE);
        ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 1.4;   // living ripples
        const ph = time * 1.6 + x * 1.3 + y * 2.1;
        ctx.beginPath(); ctx.arc(X + 15 + Math.sin(ph) * 4, Y + 15 + Math.cos(ph * 0.7) * 3, 4 + Math.sin(ph * 2) * 1.5, 0.2, 2.2); ctx.stroke();
      }
      if (t.b) drawBuilding(t.b, X + 15, Y + 15);
    });
    // valid-placement glow while a tool is selected
    if (tool) {
      const b = BUILDS.find(x => x.k === tool);
      eachTile((t, x, y) => {
        let ok = false;
        if (b.k === "erase") ok = !!t.b;
        else if (b.k === "pond") ok = t.t === "g" && !t.b;
        else if (b.on === "w") ok = t.t === "w" && !t.b;
        else ok = t.t === "g" && !t.b;
        if (ok) {
          ctx.globalAlpha = 0.25 + Math.sin(time * 5) * 0.1;
          ctx.fillStyle = b.k === "erase" ? "#FF9EB5" : "#FFF7B0";
          ctx.fillRect(x * TILE + 2, MAPY + y * TILE + 2, TILE - 4, TILE - 4);
          ctx.globalAlpha = 1;
        }
      });
    }
  }

  /* ---- building sprites, all hand-drawn ---- */
  function drawBuilding(b, cx, cy) {
    ctx.save(); ctx.translate(cx, cy);
    if (b.k === "lily") {
      const wob = Math.sin(time * 2 + cx) * 1;
      ctx.fillStyle = "#7CC77F";
      ctx.beginPath(); ctx.arc(0, wob * 0.4, 11, 0.35, Math.PI * 2 - 0.35); ctx.lineTo(0, wob * 0.4); ctx.fill();
      ctx.fillStyle = "#9BDB93";
      ctx.beginPath(); ctx.arc(-2, -1 + wob * 0.4, 6.5, 0.5, Math.PI * 2 - 0.2); ctx.lineTo(-2, -1); ctx.fill();
      ctx.fillStyle = "#FFC2DA"; heartPath(6, -6 + wob * 0.4, 3.4); ctx.fill();
    } else if (b.k === "bridge") {
      ctx.strokeStyle = "#C88F5F"; ctx.lineWidth = 3;
      ctx.fillStyle = "#E5B584";
      rr(-13, -6, 26, 12, 4); ctx.fill();
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 8, -6); ctx.lineTo(i * 8, 6); ctx.strokeStyle = "#D3A06F"; ctx.lineWidth = 1.5; ctx.stroke(); }
      ctx.strokeStyle = "#C88F5F"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-13, -8); ctx.quadraticCurveTo(0, -13, 13, -8); ctx.stroke();
    } else if (b.k === "rest") {
      ctx.fillStyle = "#FFF6EE"; rr(-11, -4, 22, 14, 3); ctx.fill();
      ctx.fillStyle = "#FF9EB5";                                  // striped awning
      ctx.beginPath(); ctx.moveTo(-13, -4); ctx.lineTo(13, -4); ctx.lineTo(10, -12); ctx.lineTo(-10, -12); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#FFF"; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-9 + i * 7.5, -12); ctx.lineTo(-6.5 + i * 7.5, -4); ctx.lineTo(-4 + i * 7.5, -4); ctx.lineTo(-6 + i * 7.5, -12); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = "#B98A6B"; rr(-2, 3, 4, 7, 1); ctx.fill();
      ctx.font = "9px sans-serif"; ctx.textAlign = "center";
      if (b.menu) ctx.fillText(FOODS[b.menu[0]].e, 7, 2);
    } else if (b.k === "lib") {
      ctx.fillStyle = "#E3D8FF"; rr(-11, -8, 22, 18, 3); ctx.fill();
      ctx.fillStyle = "#B8A5E8"; ctx.beginPath(); ctx.moveTo(-13, -8); ctx.lineTo(0, -15); ctx.lineTo(13, -8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#FFF"; rr(-7, -4, 5, 6, 1); ctx.fill(); rr(2, -4, 5, 6, 1); ctx.fill();
      ctx.font = "8px sans-serif"; ctx.textAlign = "center"; ctx.fillText("📖", 0, 8);
    } else if (b.k === "garden") {
      const cols = ["#FF9EB5","#FFE48A","#C9A6FF"];
      for (let i = 0; i < 3; i++) {
        const gx = -7 + i * 7, gy = 3 - (i % 2) * 4 + Math.sin(time * 2.4 + i) * 0.8;
        ctx.strokeStyle = "#7FBF72"; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(gx, gy + 7); ctx.lineTo(gx, gy); ctx.stroke();
        ctx.fillStyle = cols[i];
        for (let pAng = 0; pAng < 5; pAng++) { ctx.beginPath(); ctx.arc(gx + Math.cos(pAng * 1.256) * 3, gy + Math.sin(pAng * 1.256) * 3, 2, 0, 7); ctx.fill(); }
        ctx.fillStyle = "#FFF3B0"; ctx.beginPath(); ctx.arc(gx, gy, 1.6, 0, 7); ctx.fill();
      }
    } else if (b.k === "stage") {
      ctx.fillStyle = "#FFE1A8"; rr(-13, -2, 26, 12, 3); ctx.fill();
      ctx.strokeStyle = "#E8B96A"; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.strokeStyle = "#C88F5F"; ctx.beginPath(); ctx.moveTo(-12, -2); ctx.lineTo(-12, -14); ctx.moveTo(12, -2); ctx.lineTo(12, -14); ctx.stroke();
      const cols = ["#FFC0CB","#A8EFC9","#C9A6FF","#FFE48A"];
      for (let i = 0; i < 4; i++) { ctx.fillStyle = cols[i]; ctx.beginPath(); const fx = -10 + i * 6.5; ctx.moveTo(fx, -13 + Math.sin((fx / 24) * 3) * 1.5); ctx.lineTo(fx + 5, -13); ctx.lineTo(fx + 2.5, -9); ctx.closePath(); ctx.fill(); }
    } else if (b.k === "castle") {
      ctx.fillStyle = "#FFD9E6"; rr(-12, -8, 24, 18, 2); ctx.fill();
      ctx.fillStyle = "#F7B9D0"; rr(-14, -14, 8, 24, 2); ctx.fill(); rr(6, -14, 8, 24, 2); ctx.fill();
      ctx.fillStyle = "#E89AB8";
      ctx.beginPath(); ctx.moveTo(-15, -14); ctx.lineTo(-10, -21); ctx.lineTo(-5, -14); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(5, -14); ctx.lineTo(10, -21); ctx.lineTo(15, -14); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#B98AA0"; rr(-2.5, 3, 5, 7, 2); ctx.fill();
      ctx.strokeStyle = "#C9A"; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, -17); ctx.stroke();
      ctx.fillStyle = "#FFE48A"; ctx.beginPath(); ctx.moveTo(0, -17); ctx.lineTo(7, -15); ctx.lineTo(0, -13); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  /* ---- the frogs themselves 🐸 ---- */
  function drawFrog(f) {
    const X = px(f.fx), baseY = py(f.fy) - 4;
    let Y = baseY + Math.sin(time * 3 + f.bob) * 1.2;
    let sx = 1, sy = 1;
    if (f.state === "hop") {
      Y = baseY - Math.sin(f.hopT * Math.PI) * 12;
      sx = 1 - Math.sin(f.hopT * Math.PI) * 0.15; sy = 1 + Math.sin(f.hopT * Math.PI) * 0.2;
    }
    // shadow
    ctx.fillStyle = "rgba(90,120,90,0.25)";
    ctx.beginPath(); ctx.ellipse(X, baseY + 9, 9 * sx, 3, 0, 0, 7); ctx.fill();

    ctx.save();
    ctx.translate(X, Y); ctx.scale(sx, sy);
    if (frogSel === f) { ctx.strokeStyle = "#FFB6D5"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 14, 0, 7); ctx.stroke(); }
    const dark = "rgba(60,90,60,0.5)";
    // body
    ctx.fillStyle = f.skin; ctx.strokeStyle = dark; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(0, 2, 9.5, 7.5, 0, 0, 7); ctx.fill(); ctx.stroke();
    // eye bumps
    ctx.beginPath(); ctx.arc(-5, -6, 4.2, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(5, -6, 4.2, 0, 7); ctx.fill(); ctx.stroke();
    // belly
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.beginPath(); ctx.ellipse(0, 4, 5.5, 4, 0, 0, 7); ctx.fill();
    // eyes
    const sleeping = f.state === "sleep", blinking = f.blink < 0;
    ctx.strokeStyle = "#40573F"; ctx.fillStyle = "#40573F"; ctx.lineWidth = 1.4;
    if (sleeping || blinking) {
      ctx.beginPath(); ctx.moveTo(-7, -6); ctx.quadraticCurveTo(-5, -4.5, -3, -6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(3, -6); ctx.quadraticCurveTo(5, -4.5, 7, -6); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(-5, -6, 1.9, 0, 7); ctx.arc(5, -6, 1.9, 0, 7); ctx.fill();
      ctx.fillStyle = "#FFF"; ctx.beginPath(); ctx.arc(-4.3, -6.7, 0.7, 0, 7); ctx.arc(5.7, -6.7, 0.7, 0, 7); ctx.fill();
    }
    // blush + mouth by mood
    ctx.fillStyle = "rgba(255,150,170,0.5)";
    ctx.beginPath(); ctx.arc(-7, -1, 1.8, 0, 7); ctx.arc(7, -1, 1.8, 0, 7); ctx.fill();
    ctx.strokeStyle = "#40573F"; ctx.lineWidth = 1.3;
    ctx.beginPath();
    if (f.mood > 55) ctx.arc(0, -2, 3, 0.2 * Math.PI, 0.8 * Math.PI);
    else if (f.mood > 30) { ctx.moveTo(-2.5, 0); ctx.lineTo(2.5, 0); }
    else ctx.arc(0, 2.5, 3, 1.2 * Math.PI, 1.8 * Math.PI);
    ctx.stroke();
    ctx.restore();

    // status bits above the head
    if (sleeping) { ctx.font = "700 9px 'Baloo 2', sans-serif"; ctx.fillStyle = "#8AA5C9"; ctx.textAlign = "center"; ctx.fillText("z z", X + 9, Y - 14); }
    if (f.mood <= 30 && !sleeping) {                     // a lil rain cloud of sadness
      ctx.fillStyle = "#C5CBD6";
      ctx.beginPath(); ctx.arc(X - 3, Y - 18, 3.4, 0, 7); ctx.arc(X + 2, Y - 19, 4, 0, 7); ctx.arc(X + 6, Y - 17, 3, 0, 7); ctx.fill();
    }
    if (f.bubbleT > 0 && f.bubble) {
      rr(X + 6, Y - 26, 18, 15, 7); ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.fill();
      ctx.strokeStyle = "#D9E8DC"; ctx.stroke();
      ctx.font = "10px sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#555";
      ctx.fillText(f.bubble, X + 15, Y - 15);
    }
  }

  function drawWeatherAndNight() {
    if (rain.on) {
      ctx.strokeStyle = "rgba(140,180,230,0.55)"; ctx.lineWidth = 1.4;
      for (let i = 0; i < 34; i++) {
        const rx = ((i * 53 + time * 220) % (W + 30)) - 15;
        const ry = MAPY + ((i * 97 + time * 340) % 300);
        ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 2.5, ry + 8); ctx.stroke();
      }
    }
    if (isNight()) {
      const a = Math.min(0.30, (dayT - 55) / 5 * 0.30);
      ctx.fillStyle = `rgba(58,52,110,${a})`;
      ctx.fillRect(0, MAPY, W, GH * TILE);
      for (const ff of fireflies) {
        ctx.globalAlpha = 0.5 + Math.sin(ff.a * 4) * 0.4;
        ctx.fillStyle = "#FFF3A0";
        ctx.beginPath(); ctx.arc(ff.x, ff.y, 1.8, 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = clamp(p.life, 0, 1);
      if (p.shape === "heart") { heartPath(p.x, p.y, p.size); ctx.fillStyle = p.color; ctx.fill(); }
      else { ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 7); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  }

  /* ---- top bar: resources, day, quest ---- */
  function drawTopBar() {
    rr(4, 4, W - 8, 54, 12); ctx.fillStyle = "rgba(255,255,255,0.92)"; ctx.fill();
    ctx.strokeStyle = "#CFE8D6"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.font = "700 12px 'Baloo 2', sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = "#5B7A66";
    ctx.fillText(`🪰 ${res.flies}`, 12, 22);
    ctx.fillText(`📖 ${res.know}`, 72, 22);
    ctx.fillText(`🐸 ${frogs.length}`, 128, 22);
    const m = Math.round(avgMood());
    ctx.fillStyle = m > 60 ? "#5B9E6F" : m > 35 ? "#C9A24B" : "#C96B6B";
    ctx.fillText(`${m > 60 ? "💚" : m > 35 ? "💛" : "💔"} ${m}`, 176, 22);
    ctx.fillStyle = "#5B7A66"; ctx.textAlign = "right";
    ctx.fillText(`${isNight() ? "🌙" : "☀️"} Day ${dayCount}`, 322, 22);
    // quest
    ctx.textAlign = "left"; ctx.font = "600 10.5px Quicksand, sans-serif"; ctx.fillStyle = "#7A6B8F";
    const q = questIdx < QUESTS.length ? `Quest: ${QUESTS[questIdx].text}` : `👑 A true frog civilization! Score: ${kingdomScore()}`;
    ctx.fillText(q, 12, 44);
    // pause pill
    rr(BTN_PAUSE.x, BTN_PAUSE.y, BTN_PAUSE.w, BTN_PAUSE.h, 999);
    ctx.fillStyle = "#EAF7EE"; ctx.fill(); ctx.strokeStyle = "#BFE3CC"; ctx.stroke();
    ctx.fillStyle = "#7FA88C";
    ctx.fillRect(BTN_PAUSE.x + 8, BTN_PAUSE.y + 6, 3.5, 10);
    ctx.fillRect(BTN_PAUSE.x + 15, BTN_PAUSE.y + 6, 3.5, 10);
  }

  /* ---- bottom panel: build bar + info + actions ---- */
  function drawBottomPanel() {
    rr(2, 364, W - 4, 114, 14); ctx.fillStyle = "rgba(255,255,255,0.94)"; ctx.fill();
    ctx.strokeStyle = "#CFE8D6"; ctx.lineWidth = 1.5; ctx.stroke();
    for (const b of buildBtns) {
      const sel = tool === b.k, lock = !unlocked(b) && b.k !== "erase";
      rr(b.x, b.y, b.w, b.h, 9);
      ctx.fillStyle = sel ? "#D6F3E0" : "#F6FBF7"; ctx.fill();
      ctx.strokeStyle = sel ? "#7ED6A7" : "#DCEEE2"; ctx.lineWidth = sel ? 2 : 1.2; ctx.stroke();
      ctx.font = "15px sans-serif"; ctx.textAlign = "center";
      ctx.globalAlpha = lock ? 0.35 : 1;
      ctx.fillText(b.e, b.x + b.w / 2, b.y + 20);
      ctx.globalAlpha = 1;
      ctx.font = "700 8px 'Baloo 2', sans-serif";
      ctx.fillStyle = lock ? "#B9C8BE" : "#7FA88C";
      ctx.fillText(lock ? "🔒" : (b.cost ? b.cost + "🪰" : "free"), b.x + b.w / 2, b.y + 36);
    }
    // info text
    ctx.textAlign = "left"; ctx.font = "600 9.5px Quicksand, sans-serif"; ctx.fillStyle = "#6B8A76";
    const sel = BUILDS.find(b => b.k === tool);
    const line1 = sel ? `${sel.e} ${sel.label} — ${sel.desc}` : "Tip: tap a frog to meet them! 🐸";
    const line2 = sel ? (unlocked(sel) ? `Tap the map to place · cost ${sel.cost}🪰` : "🔒 Locked — keep finishing quests!") : "Happy frogs earn flies 🪰 · rain = joy 🌧";
    ctx.fillText(line1, 10, 434);
    ctx.fillText(line2, 10, 448);
    ctx.fillText(`Kingdom Score: ${kingdomScore()}`, 10, 466);
    // action buttons
    rr(BTN_SAVE.x, BTN_SAVE.y, BTN_SAVE.w, BTN_SAVE.h, 999);
    ctx.fillStyle = "#FFE2EC"; ctx.fill(); ctx.strokeStyle = "#F4B8CE"; ctx.stroke();
    ctx.font = "700 11px 'Baloo 2', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#C97B96";
    ctx.fillText("Save Score 🏆", BTN_SAVE.x + BTN_SAVE.w / 2, BTN_SAVE.y + 16);
    if (countB("stage") > 0) {
      rr(BTN_FEST.x, BTN_FEST.y, BTN_FEST.w, BTN_FEST.h, 999);
      ctx.fillStyle = "#FFF3CE"; ctx.fill(); ctx.strokeStyle = "#EDD189"; ctx.stroke();
      ctx.fillStyle = "#B99745";
      ctx.fillText("Festival 40🪰 🎉", BTN_FEST.x + BTN_FEST.w / 2, BTN_FEST.y + 16);
    }
  }

  /* ---- frog info card 💚 ---- */
  function drawFrogCard(f) {
    ctx.fillStyle = "rgba(90,110,95,0.35)"; ctx.fillRect(0, 0, W, H);
    rr(34, 96, 292, 276, 20); ctx.fillStyle = "#FFFFFF"; ctx.fill();
    ctx.strokeStyle = "#BFE3CC"; ctx.lineWidth = 2; ctx.stroke();
    // close ✕
    rr(292, 100, 26, 26, 999); ctx.fillStyle = "#F2F8F4"; ctx.fill();
    ctx.font = "700 13px 'Baloo 2', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#8AA394";
    ctx.fillText("✕", 305, 118);
    // portrait (a big version of the frog)
    ctx.save(); ctx.translate(80, 150); ctx.scale(2.2, 2.2);
    const tmp = { ...f, fx: 0, fy: 0, state: "idle", blink: 1, bob: 0 };
    ctx.translate(-px(0), -(py(0) - 4));
    drawFrog(tmp);
    ctx.restore();
    const P = PERSONALITIES[f.pers], FD = FOODS[f.food];
    ctx.textAlign = "left"; ctx.fillStyle = "#4E6B58";
    ctx.font = "700 18px 'Baloo 2', sans-serif";
    ctx.fillText(`${f.name} ${P.e}`, 128, 132);
    ctx.font = "600 11px Quicksand, sans-serif"; ctx.fillStyle = "#7B9484";
    ctx.fillText(`${P.label} frog`, 128, 148);
    // mood bar
    ctx.fillText("Mood", 128, 170);
    rr(128, 176, 170, 9, 5); ctx.fillStyle = "#EEF5F0"; ctx.fill();
    rr(128, 176, Math.max(9, 170 * f.mood / 100), 9, 5);
    ctx.fillStyle = f.mood > 60 ? "#8FDCA8" : f.mood > 30 ? "#F2D68A" : "#F2A3A3"; ctx.fill();
    ctx.fillStyle = "#7B9484";
    ctx.fillText(`Favorite food:  ${FD.e} ${FD.label}`, 128, 206);
    ctx.fillText(`Home:  ${f.home ? "🪷 a lily pad" : "🥺 homeless (build pads!)"}`, 128, 224);
    // friends list
    ctx.fillStyle = "#4E6B58"; ctx.font = "700 12px 'Baloo 2', sans-serif";
    ctx.fillText("Friends 💞", 60, 254);
    ctx.font = "600 11px Quicksand, sans-serif"; ctx.fillStyle = "#7B9484";
    const pals = Object.entries(f.friends)
      .map(([id, pts]) => ({ o: frogs.find(x => x.id == id), pts }))
      .filter(p => p.o).sort((a, b) => b.pts - a.pts).slice(0, 3);
    if (!pals.length) ctx.fillText("No friends yet — build bridges! 🌉", 60, 274);
    pals.forEach((pal, i) => {
      const hearts = "💗".repeat(Math.min(5, pal.pts)) + (pal.pts >= 5 ? " BFF!" : "");
      ctx.fillText(`${pal.o.name}  ${hearts}`, 60, 274 + i * 17);
    });
    // Pet button
    rr(120, 330, 120, 30, 999);
    ctx.fillStyle = f.petCd > 0 ? "#F0F0F0" : "#FFE2EC"; ctx.fill();
    ctx.strokeStyle = "#F4B8CE"; ctx.stroke();
    ctx.font = "700 13px 'Baloo 2', sans-serif"; ctx.textAlign = "center";
    ctx.fillStyle = f.petCd > 0 ? "#BBB" : "#C97B96";
    ctx.fillText(f.petCd > 0 ? "so happy! 💕" : "Pet 💕", 180, 350);
  }

  /* ============================================================
     LOOP, SCREENS, INPUT WIRING
     ============================================================ */
  let lastT = performance.now();
  function loop(now) {
    let dt = (now - lastT) / 1000;
    lastT = now;
    if (dt > 1 / 20) dt = 1 / 20;
    if (state === "playing") updateWorld(dt);
    FrogMusic.update(dt, GabiAudio.isMuted(), isNight(), rain && rain.on);
    draw();
    requestAnimationFrame(loop);
  }

  function show(id) {
    ["screen-start", "screen-pause", "screen-over"].forEach(s =>
      document.getElementById(s).classList.toggle("hide", s !== id));
  }
  function hideAll() { ["screen-start", "screen-pause", "screen-over"].forEach(s => document.getElementById(s).classList.add("hide")); }
  function togglePause() {
    if (state === "playing") { state = "paused"; save(); show("screen-pause"); }
    else if (state === "paused") { state = "playing"; hideAll(); lastT = performance.now(); }
  }

  function begin(fresh) {
    const nameInput = document.getElementById("name-input");
    playerName = GabiLeaderboard.cleanName(nameInput.value || playerName);
    localStorage.setItem("gabi_player_name", playerName);
    GabiAudio.unlock(); FrogMusic.start();
    if (fresh || !load()) freshWorld();
    state = "playing"; hideAll();
    toast(fresh ? "Welcome! Complete quests to grow 🌱" : "Welcome back to your kingdom! 🐸");
  }

  document.getElementById("btn-new").addEventListener("click", () => { localStorage.removeItem(SAVE_KEY); begin(true); });
  document.getElementById("btn-continue").addEventListener("click", () => begin(false));
  document.getElementById("btn-resume").addEventListener("click", togglePause);
  document.getElementById("btn-reset").addEventListener("click", () => { localStorage.removeItem(SAVE_KEY); freshWorld(); state = "playing"; hideAll(); toast("A brand new kingdom! 🌱"); });
  document.getElementById("btn-keep").addEventListener("click", () => { state = "playing"; hideAll(); lastT = performance.now(); });
  document.getElementById("name-input").value = playerName;
  if (localStorage.getItem(SAVE_KEY)) document.getElementById("btn-continue").classList.remove("hide");

  function canvasPos(e) {
    const r = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: (t.clientX - r.left) * W / r.width, y: (t.clientY - r.top) * H / r.height };
  }
  function tap(e) { e.preventDefault(); handleTap(canvasPos(e)); }
  canvas.addEventListener("mousedown", tap);
  canvas.addEventListener("touchstart", tap, { passive: false });
  document.body.addEventListener("touchmove", (e) => { if (e.target === canvas) e.preventDefault(); }, { passive: false });

  window.addEventListener("keydown", (e) => {
    if (e.key === "p" || e.key === "P" || e.key === "Escape") { if (state !== "start") togglePause(); }
    const n = parseInt(e.key, 10);
    if (state === "playing" && n >= 1 && n <= BUILDS.length) { const b = BUILDS[n - 1]; tool = (tool === b.k) ? null : b.k; }
    if (e.code === "Space" && state === "playing") { e.preventDefault(); tool = null; frogSel = null; }
  });
  window.addEventListener("beforeunload", () => { if (state === "playing" || state === "paused") save(); });

  // Boot
  show("screen-start");
  freshWorld();      // pretty living background behind the start screen
  requestAnimationFrame(loop);
})();
