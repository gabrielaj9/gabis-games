/* ============================================================
   SQUISHY BUTTER ESCAPE 🧈 — the game
   ------------------------------------------------------------
   A Flappy-Bird-style game in vanilla JS + HTML5 Canvas.
   - 60fps loop with requestAnimationFrame + DELTA-TIME physics
     (so it runs the same speed on every device)
   - Cute particle effects (sparkle/squish/splat)
   - Difficulty ramps up gradually (with caps)
   - Uses the shared GabiAudio + GabiLeaderboard engines
   ============================================================ */

(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const hud = document.getElementById("hud");
  const GAME_ID = "squishy-butter-escape";

  // ---- Logical game size (we draw in these units, then scale) ----
  const W = 360, H = 480;

  /* ---- Responsive canvas with devicePixelRatio for crisp rendering ---- */
  function fitCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2 for perf
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw using logical W/H units
  }
  fitCanvas();
  window.addEventListener("resize", fitCanvas);

  /* ---- Game state ---- */
  let state = "start";           // start | playing | paused | over
  let playerName = localStorage.getItem("gabi_player_name") || "";
  let butter, pipes, particles, score, speed, gap, spawnT, startTime, best = 0;

  const GRAVITY = 1500;          // px/s²   (delta-time based)
  const FLAP = -430;             // px/s    upward impulse
  const PIPE_W = 62;
  const BASE_SPEED = 130;        // px/s    starting scroll speed
  const MAX_SPEED = 260;         // speed cap
  const BASE_GAP = 168;          // starting gap between slime pillars
  const MIN_GAP = 116;           // gap cap (never narrower than this)

  function reset() {
    butter = { x: 90, y: H/2, vy: 0, r: 20, rot: 0, squish: 1 };
    pipes = [];
    particles = [];
    score = 0;
    speed = BASE_SPEED;
    gap = BASE_GAP;
    spawnT = 0;
    startTime = performance.now();
    spawnPipe();
  }

  function spawnPipe() {
    const margin = 50;
    const topH = margin + Math.random() * (H - gap - margin * 2);
    pipes.push({ x: W + 20, top: topH, passed: false,
                 drip: Math.random() * 6 });  // drip animation offset
  }

  /* ---- Particles ---- */
  function burst(x, y, color, n, spread) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = Math.random() * spread;
      particles.push({ x, y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp,
                       life: 1, color, size: 3 + Math.random()*3 });
    }
  }

  /* ============================================================
     GAME LOOP — delta-time (dt in seconds), capped for tab-switches
     ============================================================ */
  let lastT = performance.now();
  function loop(now) {
    let dt = (now - lastT) / 1000;
    lastT = now;
    if (dt > 1/30) dt = 1/30;   // cap: prevents big jumps after tab switch
    if (state === "playing") update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function update(dt) {
    // ---- Butter physics ----
    butter.vy += GRAVITY * dt;
    butter.y  += butter.vy * dt;
    butter.rot = Math.max(-0.5, Math.min(1.2, butter.vy / 500));
    butter.squish += (1 - butter.squish) * 0.2; // ease back to normal shape

    // ---- Difficulty ramp (gradual, capped) ----
    speed = Math.min(MAX_SPEED, BASE_SPEED + score * 4);
    gap   = Math.max(MIN_GAP,  BASE_GAP  - score * 1.5);

    // ---- Pipes ----
    spawnT += dt;
    const interval = (gap + 150) / speed; // spacing scales with speed
    if (spawnT > interval) { spawnT = 0; spawnPipe(); }

    for (const p of pipes) {
      p.x -= speed * dt;
      p.drip += dt * 2;
      // Score when butter passes a pipe
      if (!p.passed && p.x + PIPE_W < butter.x) {
        p.passed = true; score++;
        GabiAudio.sfx.score();
        burst(butter.x, butter.y, "#FFD1DC", 10, 120); // sparkle
      }
      // Collision
      if (hit(p)) return die();
    }
    pipes = pipes.filter(p => p.x > -PIPE_W - 20);

    // ---- Floor / ceiling ----
    if (butter.y + butter.r > H || butter.y - butter.r < 0) return die();

    // ---- Particles ----
    for (const pt of particles) {
      pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 300 * dt; pt.life -= dt * 1.5;
    }
    particles = particles.filter(pt => pt.life > 0);

    hud.textContent = score;
  }

  function hit(p) {
    const bx = butter.x, by = butter.y, r = butter.r * 0.8;
    const inX = bx + r > p.x && bx - r < p.x + PIPE_W;
    if (!inX) return false;
    return (by - r < p.top) || (by + r > p.top + gap);
  }

  function flap() {
    if (state !== "playing") return;
    butter.vy = FLAP;
    butter.squish = 0.7;                    // squish on flap
    GabiAudio.sfx.flap();
    burst(butter.x - 8, butter.y + 12, "#FFF0A0", 6, 70); // squish particles
  }

  async function die() {
    if (state === "over") return;
    state = "over";
    GabiAudio.sfx.over();
    burst(butter.x, butter.y, "#FF8FA3", 24, 220);        // splat
    best = Math.max(best, score);
    document.getElementById("over-score").textContent = `Score: ${score} 🧈  (Best: ${best})`;

    // Submit to leaderboard (with anti-cheat duration check)
    const durationMs = performance.now() - startTime;
    const res = await GabiLeaderboard.submit({ name: playerName, score, game: GAME_ID, durationMs });

    // Mini leaderboard on the game-over screen
    const board = (res && res.board) ? res.board : await GabiLeaderboard.get(GAME_ID);
    const top5 = board.filter(e => e.game === GAME_ID).slice(0, 5);
    document.getElementById("mini-lb").innerHTML =
      top5.map((e,i) => `<li><span>${["🥇","🥈","🥉"][i]||(i+1)} ${escapeHtml(e.name)}</span><span>${e.score}</span></li>`).join("")
      || "<li>Be the first! 💕</li>";
    show("screen-over");
  }
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  /* ============================================================
     DRAWING (all kawaii art drawn with canvas — no images)
     ============================================================ */
  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Soft gradient sky
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#FFF0F5"); sky.addColorStop(1, "#FFE4E9");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

    // Slime pillars
    for (const p of pipes) drawSlime(p);

    // Particles
    for (const pt of particles) {
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.fillStyle = pt.color;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // The butter squishy
    drawButter();
  }

  function drawSlime(p) {
    const grad = ctx.createLinearGradient(p.x, 0, p.x + PIPE_W, 0);
    grad.addColorStop(0, "#FF9EC0"); grad.addColorStop(0.5, "#FFB6D5"); grad.addColorStop(1, "#FF9EC0");
    ctx.fillStyle = grad;
    // top pillar
    roundRect(p.x, 0, PIPE_W, p.top, 0, 0, 14, 14); ctx.fill();
    // bottom pillar
    const by = p.top + gap;
    roundRect(p.x, by, PIPE_W, H - by, 14, 14, 0, 0); ctx.fill();
    // animated drip blobs hanging from the top pillar
    ctx.fillStyle = "#FF8FBF";
    for (let i = 0; i < 3; i++) {
      const dx = p.x + 12 + i * 20;
      const dy = p.top + 6 + Math.sin(p.drip + i) * 5 + i*3;
      ctx.beginPath(); ctx.arc(dx, dy, 5 - i*0.6, 0, Math.PI*2); ctx.fill();
    }
    // glossy highlight
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    roundRect(p.x + 8, 0, 8, p.top, 6,6,6,6); ctx.fill();
  }

  function drawButter() {
    ctx.save();
    ctx.translate(butter.x, butter.y);
    ctx.rotate(butter.rot);
    ctx.scale(butter.squish, 2 - butter.squish); // squishy deform
    const s = butter.r;
    // body (rounded butter cube)
    const g = ctx.createLinearGradient(-s, -s, s, s);
    g.addColorStop(0, "#FFE79A"); g.addColorStop(1, "#FFC93C");
    ctx.fillStyle = g;
    roundRect(-s, -s, s*2, s*2, 8,8,8,8); ctx.fill();
    // little butter "stick" top line
    ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-s+4, -s+7); ctx.lineTo(s-4, -s+7); ctx.stroke();
    // blush cheeks
    ctx.fillStyle = "rgba(255,143,163,0.6)";
    ctx.beginPath(); ctx.arc(-9, 5, 4, 0, Math.PI*2); ctx.arc(9, 5, 4, 0, Math.PI*2); ctx.fill();
    // eyes
    ctx.fillStyle = "#6B4B57";
    ctx.beginPath(); ctx.arc(-7, -2, 3, 0, Math.PI*2); ctx.arc(7, -2, 3, 0, Math.PI*2); ctx.fill();
    // smile
    ctx.strokeStyle = "#6B4B57"; ctx.lineWidth = 2; ctx.beginPath();
    ctx.arc(0, 3, 5, 0.15*Math.PI, 0.85*Math.PI); ctx.stroke();
    ctx.restore();
  }

  // Helper: rounded rectangle with per-corner radii
  function roundRect(x,y,w,h,tl,tr,br,bl){
    ctx.beginPath();
    ctx.moveTo(x+tl,y);
    ctx.lineTo(x+w-tr,y); ctx.quadraticCurveTo(x+w,y,x+w,y+tr);
    ctx.lineTo(x+w,y+h-br); ctx.quadraticCurveTo(x+w,y+h,x+w-br,y+h);
    ctx.lineTo(x+bl,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-bl);
    ctx.lineTo(x,y+tl); ctx.quadraticCurveTo(x,y,x+tl,y);
    ctx.closePath();
  }

  /* ============================================================
     SCREENS + INPUT
     ============================================================ */
  function show(id) {
    ["screen-start","screen-pause","screen-over"].forEach(s =>
      document.getElementById(s).classList.toggle("hide", s !== id));
    hud.style.display = id ? "none" : "block";
  }
  function hideAll(){ ["screen-start","screen-pause","screen-over"].forEach(s=>document.getElementById(s).classList.add("hide")); hud.style.display="block"; }

  function startGame() {
    const nameInput = document.getElementById("name-input");
    playerName = GabiLeaderboard.cleanName(nameInput.value || playerName);
    localStorage.setItem("gabi_player_name", playerName);
    GabiAudio.unlock();
    reset();
    state = "playing";
    hideAll();
  }
  function togglePause() {
    if (state === "playing") { state = "paused"; show("screen-pause"); }
    else if (state === "paused") { state = "playing"; hideAll(); lastT = performance.now(); }
  }

  // Buttons
  document.getElementById("btn-start").addEventListener("click", startGame);
  document.getElementById("btn-resume").addEventListener("click", togglePause);
  document.getElementById("btn-restart").addEventListener("click", () => { reset(); state="playing"; hideAll(); });

  // Pre-fill remembered name
  document.getElementById("name-input").value = playerName;

  // Keyboard
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") { e.preventDefault();
      if (state === "start") startGame(); else if (state === "over"){ reset(); state="playing"; hideAll(); } else flap(); }
    if (e.key === "p" || e.key === "P" || e.key === "Escape") togglePause();
  });

  // Mouse / touch on canvas — flap. { passive:false } lets us stop page scroll.
  function tap(e){ e.preventDefault(); if (state === "playing") flap(); }
  canvas.addEventListener("mousedown", tap);
  canvas.addEventListener("touchstart", tap, { passive: false });
  // Stop the whole page scrolling while a finger is on the canvas
  document.body.addEventListener("touchmove", (e) => { if (e.target === canvas) e.preventDefault(); }, { passive: false });

  // Boot
  show("screen-start");
  reset();
  requestAnimationFrame(loop);
})();
