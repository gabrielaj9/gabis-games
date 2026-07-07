/* ============================================================
   SLIMERIA 🧪💗 — run your own dreamy slime shop!
   ------------------------------------------------------------
   How it plays:
   - Cute animal customers walk up and show an order bubble:
     a GLUE base (clear or white), a COLOR, and TOPPINGS.
   - Tap the glue bottle to pour it into the bowl, tap a dye to
     swirl in the color, tap topping jars to sprinkle them in,
     then tap "Serve 💝" before the patience bar melts away!
   - Wrong orders and impatient customers cost a heart. 3 hearts.
   - Every 3 happy customers = next level: less patience, bigger
     orders… and from level 4 the order bubble FADES — memorize
     it, or tap the customer to peek again!
   All art is drawn on canvas (no images), all sounds come from
   the shared GabiAudio engine, scores go to GabiLeaderboard.
   ============================================================ */

(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const hud = document.getElementById("hud");
  const GAME_ID = "slimeria";

  // ---- Logical drawing size (scaled to fit any screen) ----
  const W = 360, H = 480;

  function fitCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  fitCanvas();
  window.addEventListener("resize", fitCanvas);

  /* ============================================================
     INGREDIENTS & SHOP DATA (add more dyes/toppings here!)
     ============================================================ */
  const GLUES = [
    { id: "clear", label: "Clear", hex: "#DDF1FF" },
    { id: "white", label: "White", hex: "#FFFFFF" },
  ];
  const DYES = [
    { id: "pink",   label: "Pink",   hex: "#FF9EC8" },
    { id: "purple", label: "Purple", hex: "#C9A6FF" },
    { id: "blue",   label: "Blue",   hex: "#9ED0FF" },
    { id: "mint",   label: "Mint",   hex: "#A8EFC9" },
    { id: "yellow", label: "Yellow", hex: "#FFE48A" },
  ];
  const TOPPINGS = [
    { id: "sparkle", label: "Sparkles" },
    { id: "bow",     label: "Bows" },
    { id: "beads",   label: "Beads" },
    { id: "star",    label: "Stars" },
    { id: "heart",   label: "Hearts" },
  ];
  const CUSTOMERS = [
    { kind: "bunny", body: "#FFF3F6", trim: "#FFC9D8" },
    { kind: "bear",  body: "#F4D8B8", trim: "#E2B387" },
    { kind: "cat",   body: "#EAE4FF", trim: "#C9B8FF" },
    { kind: "mouse", body: "#E2F5EB", trim: "#B6E3CC" },
  ];
  const MEMORY_LEVEL = 4;   // from this level the order bubble fades

  /* ---- Clickable regions ---- */
  const UI = {
    pause:    { x: 316, y: 8,   w: 36,  h: 26 },
    serve:    { x: 234, y: 192, w: 110, h: 38 },
    trash:    { x: 234, y: 238, w: 110, h: 28 },
    customer: { x: 28,  y: 34,  w: 134, h: 122 },
  };
  const glueBtns = GLUES.map((g, i) => ({ ...g, kind: "glue", x: 24 + i * 70, y: 306, w: 56, h: 52, pulse: 0 }));
  const dyeBtns  = DYES.map((d, i)  => ({ ...d, kind: "dye",  x: 20 + i * 66, y: 364, w: 50, h: 48, pulse: 0 }));
  const topBtns  = TOPPINGS.map((t, i) => ({ ...t, kind: "top", x: 20 + i * 66, y: 418, w: 50, h: 54, pulse: 0 }));
  const allBtns = [...glueBtns, ...dyeBtns, ...topBtns];

  const BOWL = { x: 118, y: 214 };   // slime surface center

  /* ============================================================
     LITTLE HELPERS (colors, shapes, math)
     ============================================================ */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp  = (a, b, t) => a + (b - a) * t;
  const easeOut = t => 1 - (1 - t) * (1 - t);
  const inRect = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

  function hexRGB(h) { h = h.replace("#", ""); return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) }; }
  function lerpRGB(a, b, t) { return { r: lerp(a.r, b.r, t), g: lerp(a.g, b.g, t), b: lerp(a.b, b.b, t) }; }
  function css(c, a = 1) { return `rgba(${c.r | 0},${c.g | 0},${c.b | 0},${a})`; }
  function darken(c, f) { return { r: c.r * f, g: c.g * f, b: c.b * f }; }

  function rr(x, y, w, h, r) {   // rounded rect path
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function heartPath(x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.35);
    ctx.bezierCurveTo(x - s, y - s * 0.55, x - s * 0.5, y - s * 1.1, x, y - s * 0.35);
    ctx.bezierCurveTo(x + s * 0.5, y - s * 1.1, x + s, y - s * 0.55, x, y + s * 0.35);
    ctx.closePath();
  }
  function starPath(x, y, r, points, innerF) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const rad = i % 2 === 0 ? r : r * innerF;
      const a = (Math.PI / points) * i - Math.PI / 2;
      const px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  /* ---- Topping mini-icons (used on jars, in bubbles, in slime) ---- */
  function drawTopping(id, x, y, s) {
    ctx.save();
    if (id === "sparkle") {
      starPath(x, y, 7 * s, 4, 0.35);
      ctx.fillStyle = "#FFF3B0"; ctx.fill();
      ctx.strokeStyle = "#F0C94C"; ctx.lineWidth = 1; ctx.stroke();
    } else if (id === "bow") {
      ctx.fillStyle = "#FF7FB0";
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 8 * s, y - 5 * s); ctx.lineTo(x - 8 * s, y + 5 * s); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 8 * s, y - 5 * s); ctx.lineTo(x + 8 * s, y + 5 * s); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#FF5C97";
      ctx.beginPath(); ctx.arc(x, y, 3 * s, 0, Math.PI * 2); ctx.fill();
    } else if (id === "beads") {
      const cols = ["#C9A6FF", "#A8EFC9", "#FFFFFF"];
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = cols[i];
        ctx.strokeStyle = "rgba(155,127,137,.4)"; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.arc(x + (i - 1) * 7 * s, y + (i === 1 ? -3 * s : 2 * s), 3.4 * s, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
      }
    } else if (id === "star") {
      starPath(x, y, 7.5 * s, 5, 0.5);
      ctx.fillStyle = "#FFD75E"; ctx.fill();
      ctx.strokeStyle = "#E9B93B"; ctx.lineWidth = 1; ctx.stroke();
    } else if (id === "heart") {
      heartPath(x, y, 7 * s);
      ctx.fillStyle = "#FF6F91"; ctx.fill();
    }
    ctx.restore();
  }

  /* ---- Mini glue bottle icon (bubble + shelf cards) ---- */
  function drawGlueBottle(x, y, scale, glue) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(scale, scale);
    // cap
    ctx.fillStyle = "#FFB067";
    rr(-4, -22, 8, 7, 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-2, -22); ctx.lineTo(0, -27); ctx.lineTo(2, -22); ctx.closePath(); ctx.fill();
    // body
    if (glue.id === "clear") {
      ctx.fillStyle = "rgba(190,228,255,0.55)";
      ctx.strokeStyle = "#A9CFEA";
    } else {
      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = "#E3CBD6";
    }
    ctx.lineWidth = 1.4;
    rr(-9, -16, 18, 30, 6); ctx.fill(); ctx.stroke();
    // shine + label heart
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    rr(-6, -12, 3, 16, 2); ctx.fill();
    ctx.fillStyle = glue.id === "clear" ? "#8FC3E8" : "#F3A9C4";
    heartPath(3, -1, 4); ctx.fill();
    ctx.restore();
  }

  /* ============================================================
     GAME STATE
     ============================================================ */
  let state = "start";            // start | playing | paused | over
  let playerName = localStorage.getItem("gabi_player_name") || "";
  let time = 0, hearts, score, served, level, best = 0;
  let customer, bowl, pour, serveAnim, pendingT, startTime;
  let particles = [], floaters = [], drops = [];

  function freshBowl() {
    return { glue: null, fill: 0, baseRGB: hexRGB("#FFFFFF"), prevRGB: null, targetRGB: null,
             colorId: null, mixT: 1, toppings: [], jig: 0, shake: 0 };
  }

  function reset() {
    hearts = 3; score = 0; served = 0; level = 1;
    customer = null; pour = null; serveAnim = null;
    bowl = freshBowl(); particles = []; floaters = []; drops = [];
    pendingT = 0.6; time = 0;
    startTime = performance.now();
    hud.textContent = "✨ 0";
  }

  /* ============================================================
     CUSTOMERS & ORDERS
     ============================================================ */
  function makeOrder() {
    const glue = GLUES[(Math.random() * GLUES.length) | 0];
    const dye  = DYES[(Math.random() * DYES.length) | 0];
    // Bigger orders on higher levels
    let count;
    if (level <= 1)      count = Math.random() < 0.4 ? 0 : 1;
    else if (level === 2) count = 1;
    else if (level === 3) count = 1 + (Math.random() < 0.6 ? 1 : 0);
    else                  count = 2 + (Math.random() < 0.5 ? 1 : 0);
    const pool = [...TOPPINGS].sort(() => Math.random() - 0.5);
    return { glueId: glue.id, colorId: dye.id, toppings: pool.slice(0, Math.min(count, 3)).map(t => t.id) };
  }

  function makeCustomer() {
    const patienceMax = clamp(22 - (level - 1) * 2, 8, 22);
    return {
      variant: CUSTOMERS[(Math.random() * CUSTOMERS.length) | 0],
      order: makeOrder(),
      x: -80, state: "in",         // in | waiting | happy | sad
      patience: patienceMax, patienceMax,
      reactT: 0, pts: 0, bob: Math.random() * 6,
      blink: 1 + Math.random() * 2,
      bubbleT: 0, peekT: 0,
    };
  }

  const sameSet = (a, b) => a.length === b.length && b.every(x => a.includes(x));

  function currentRGB() {
    if (!bowl.targetRGB) return bowl.baseRGB;
    return lerpRGB(bowl.prevRGB, bowl.targetRGB, easeOut(clamp(bowl.mixT, 0, 1)));
  }
  const slimeAlpha = () => (bowl.glue === "clear" ? 0.72 : 1);

  /* ============================================================
     PLAYER ACTIONS
     ============================================================ */
  function deny() { bowl.shake = 0.4; GabiAudio.sfx.click(); }

  function onGlue(b) {
    if (bowl.glue) return deny();               // one base per slime — trash first!
    b.pulse = 0.35;
    pour = { kind: "glue", ref: b, t: 0, dur: 1.0 };
    GabiAudio.sfx.click();
  }
  function onDye(b) {
    if (!bowl.glue || bowl.colorId === b.id) return deny();
    b.pulse = 0.35;
    pour = { kind: "dye", ref: b, t: 0, dur: 0.9 };
    GabiAudio.sfx.click();
  }
  function onTop(b) {
    if (!bowl.glue || bowl.toppings.includes(b.id) || bowl.toppings.length >= 4) return deny();
    b.pulse = 0.35;
    bowl.toppings.push(b.id);
    bowl.jig = 1;
    drops.push({ id: b.id, x0: b.x + b.w / 2, y0: b.y + 18, t: 0 });
    GabiAudio.sfx.click();
  }
  function onTrash() {
    if (!bowl.glue) return;
    burst(BOWL.x, BOWL.y, "#E8CFDA", 14, 130, "circle");
    bowl = freshBowl();
    GabiAudio.sfx.click();
  }
  function onServe() {
    if (!customer || customer.state !== "waiting" || !bowl.glue) return deny();
    const o = customer.order;
    const ok = bowl.glue === o.glueId && bowl.colorId === o.colorId && sameSet(bowl.toppings, o.toppings);
    customer.pts = 3 * level + Math.round(4 * (customer.patience / customer.patienceMax));
    serveAnim = { t: 0, dur: 0.6, ok, rgb: currentRGB(), alpha: slimeAlpha(), toppings: [...bowl.toppings] };
    bowl = freshBowl();
    GabiAudio.sfx.click();
  }

  function togglePause() {
    if (state === "playing") { state = "paused"; show("screen-pause"); }
    else if (state === "paused") { state = "playing"; hideAll(); lastT = performance.now(); }
  }

  /* ============================================================
     PARTICLES / FLOATING TEXT
     ============================================================ */
  function burst(x, y, color, n, spread, shape) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = Math.random() * spread;
      particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
                       life: 1, color, size: 3 + Math.random() * 3, shape: shape || "circle" });
    }
  }
  function floatText(x, y, text, color) { floaters.push({ x, y, text, color, t: 1.2 }); }

  /* ============================================================
     UPDATE
     ============================================================ */
  function update(dt) {
    time += dt;
    bowl.shake = Math.max(0, bowl.shake - dt);
    bowl.jig = Math.max(0, bowl.jig - dt * 1.6);
    bowl.mixT = Math.min(1, bowl.mixT + dt * 1.3);
    allBtns.forEach(b => (b.pulse = Math.max(0, b.pulse - dt)));

    /* ---- pouring animation → apply ingredient when done ---- */
    if (pour) {
      pour.t += dt;
      if (pour.kind === "glue") bowl.fill = easeOut(clamp(pour.t / pour.dur, 0, 1));
      if (Math.random() < 0.5) {   // splash droplets at the surface
        particles.push({ x: BOWL.x + (Math.random() - 0.5) * 20, y: BOWL.y - 2,
          vx: (Math.random() - 0.5) * 60, vy: -Math.random() * 50, life: 0.5,
          color: pour.kind === "dye" ? pour.ref.hex : "#EFF8FF", size: 2.5, shape: "circle" });
      }
      if (pour.t >= pour.dur) {
        if (pour.kind === "glue") {
          bowl.glue = pour.ref.id;
          bowl.baseRGB = hexRGB(pour.ref.hex);
          bowl.fill = 1;
        } else {
          bowl.prevRGB = currentRGB();
          bowl.targetRGB = hexRGB(pour.ref.hex);
          bowl.colorId = pour.ref.id;
          bowl.mixT = 0;
        }
        bowl.jig = 1;
        pour = null;
      }
    }

    /* ---- topping drop-in animation ---- */
    for (const d of drops) d.t += dt * 2.6;
    drops = drops.filter(d => d.t < 1);

    /* ---- serve animation → customer reaction ---- */
    if (serveAnim) {
      serveAnim.t += dt;
      if (serveAnim.t >= serveAnim.dur) {
        customer.state = serveAnim.ok ? "happy" : "sad";
        customer.reactT = 1.35;
        if (serveAnim.ok) {
          GabiAudio.sfx.score();
          burst(95, 100, "#FF9EC8", 12, 150, "heart");
          floatText(95, 70, `+${customer.pts} 💕`, "#FF6F91");
        } else {
          GabiAudio.sfx.flap();
          burst(95, 100, "#C9C2C8", 10, 110, "circle");
        }
        serveAnim = null;
      }
    }

    /* ---- customer lifecycle ---- */
    if (customer) {
      customer.blink -= dt;
      if (customer.blink < -0.14) customer.blink = 1.2 + Math.random() * 2.5;
      if (customer.state === "in") {
        customer.x += 190 * dt;
        if (customer.x >= 95) { customer.x = 95; customer.state = "waiting"; }
      } else if (customer.state === "waiting") {
        customer.bubbleT += dt;
        customer.peekT = Math.max(0, customer.peekT - dt);
        if (!serveAnim) customer.patience -= dt;
        if (customer.patience <= 0) {          // stormed off!
          customer.state = "sad"; customer.reactT = 1.35; customer.timedOut = true;
          GabiAudio.sfx.flap();
          burst(95, 100, "#C9C2C8", 10, 110, "circle");
        }
      } else if (customer.reactT > 0) {
        customer.reactT -= dt;
        if (customer.reactT <= 0) {
          if (customer.state === "happy") {
            score += customer.pts; served++;
            hud.textContent = `✨ ${score}`;
            const nl = Math.min(8, 1 + Math.floor(served / 3));
            if (nl > level) { level = nl; floatText(W / 2, 170, `Level ${level}! 💗`, "#B67FD6"); GabiAudio.sfx.score(); }
          } else {
            hearts--;
            if (hearts <= 0) return gameOver();
          }
          customer = null; pendingT = 0.9;
        }
      }
    } else if (!serveAnim) {
      pendingT -= dt;
      if (pendingT <= 0) customer = makeCustomer();
    }

    /* ---- particles & floaters ---- */
    for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; p.life -= dt * 1.6; }
    particles = particles.filter(p => p.life > 0);
    for (const f of floaters) { f.y -= 26 * dt; f.t -= dt; }
    floaters = floaters.filter(f => f.t > 0);
  }

  /* ============================================================
     GAME OVER
     ============================================================ */
  async function gameOver() {
    state = "over";
    GabiAudio.sfx.over();
    best = Math.max(best, score);
    document.getElementById("over-score").textContent = `Score: ${score} 🧪  (Best: ${best})`;
    const durationMs = performance.now() - startTime;
    const res = await GabiLeaderboard.submit({ name: playerName, score, game: GAME_ID, durationMs });
    const board = (res && res.board) ? res.board : await GabiLeaderboard.get(GAME_ID);
    const top5 = board.filter(e => e.game === GAME_ID).slice(0, 5);
    document.getElementById("mini-lb").innerHTML =
      top5.map((e, i) => `<li><span>${["🥇","🥈","🥉"][i] || (i + 1)} ${escapeHtml(e.name)}</span><span>${e.score}</span></li>`).join("")
      || "<li>Be the first! 💕</li>";
    show("screen-over");
  }
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  /* ============================================================
     DRAWING — the whole shop 🌸
     ============================================================ */
  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawRoom();
    drawShelves();
    drawBowlArea();
    if (customer) drawCustomer(customer);
    if (customer && customer.state === "waiting") drawBubble(customer);
    if (pour) drawPour();
    for (const d of drops) drawDrop(d);
    if (serveAnim) drawServeBlob();
    drawParticles();
    drawTopUI();
    for (const f of floaters) {
      ctx.globalAlpha = clamp(f.t / 1.2, 0, 1);
      ctx.font = "700 15px 'Baloo 2', sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }
  }

  /* ---- background: wallpaper, counter, bunting ---- */
  function drawRoom() {
    for (let i = 0; i < 14; i++) {          // pastel striped wallpaper
      ctx.fillStyle = i % 2 ? "#FFEDF4" : "#FFF6FA";
      ctx.fillRect(i * 28, 0, 28, 152);
    }
    ctx.fillStyle = "#FFF1F6";               // lower wall
    ctx.fillRect(0, 152, W, 148);
    // counter
    ctx.fillStyle = "#FBE3D4"; rr(0, 148, W, 28, 0); ctx.fill();
    ctx.fillStyle = "#F6CDB6"; ctx.fillRect(0, 168, W, 8);
    // bunting flags
    ctx.strokeStyle = "#F3BFD3"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, 3); ctx.quadraticCurveTo(W / 2, 10, W, 3); ctx.stroke();
    const flagCols = ["#FFC0CB", "#E7D6FF", "#C9F5E4", "#FFE48A"];
    for (let i = 0; i < 12; i++) {
      const fx = 8 + i * 30, fy = 4 + Math.sin((fx / W) * Math.PI) * 5;
      ctx.fillStyle = flagCols[i % 4];
      ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + 18, fy); ctx.lineTo(fx + 9, fy + 13); ctx.closePath(); ctx.fill();
    }
  }

  /* ---- ingredient shelves ---- */
  function drawShelves() {
    rr(10, 298, 340, 176, 18);
    ctx.fillStyle = "#FFE7F0"; ctx.fill();
    ctx.strokeStyle = "#F8CBDD"; ctx.lineWidth = 2; ctx.stroke();
    [358, 412, 472].forEach(y => { rr(16, y, 328, 4, 2); ctx.fillStyle = "#F3BFD3"; ctx.fill(); });

    for (const b of allBtns) drawCard(b);

    // hanging shop sign + display jars (just for cuteness 💗)
    rr(196, 310, 118, 20, 8); ctx.fillStyle = "#FFF"; ctx.fill();
    ctx.strokeStyle = "#F3BFD3"; ctx.stroke();
    ctx.font = "700 11px 'Baloo 2', sans-serif"; ctx.textAlign = "center";
    ctx.fillStyle = "#FF8FA3"; ctx.fillText("♥ fresh slime daily ♥", 255, 324);
    drawDecoJar(210, 348, "#FF9EC8");
    drawDecoJar(238, 348, "#A8EFC9");
    heartPath(266, 344, 5); ctx.fillStyle = "#FFB3C7"; ctx.fill();
  }

  function drawDecoJar(x, y, hex) {
    rr(x - 8, y - 12, 16, 18, 4);
    ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.fill();
    ctx.strokeStyle = "#E7C2D2"; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = hex;
    ctx.beginPath(); ctx.ellipse(x, y + 1, 6, 4 + Math.sin(time * 3 + x) * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    rr(x - 9, y - 15, 18, 4, 2); ctx.fillStyle = "#F6A8C4"; ctx.fill();
  }

  function drawCard(b) {
    const pulse = 1 + Math.sin(b.pulse * 20) * 0.06 * (b.pulse > 0 ? 1 : 0);
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(pulse, pulse); ctx.translate(-cx, -cy);
    rr(b.x, b.y + 2, b.w, b.h, 10); ctx.fillStyle = "rgba(233,150,180,0.30)"; ctx.fill();  // soft shadow
    rr(b.x, b.y, b.w, b.h, 10); ctx.fillStyle = "#FFFFFF"; ctx.fill();

    if (b.kind === "glue") {
      drawGlueBottle(cx, cy + 2, 0.85, b);
    } else if (b.kind === "dye") {
      rr(cx - 11, cy - 12, 22, 18, 5); ctx.fillStyle = b.hex; ctx.fill();
      ctx.strokeStyle = css(darken(hexRGB(b.hex), 0.8)); ctx.lineWidth = 1.2; ctx.stroke();
      rr(cx - 13, cy - 16, 26, 6, 3); ctx.fillStyle = css(darken(hexRGB(b.hex), 0.85)); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath(); ctx.arc(cx - 5, cy - 7, 2.2, 0, Math.PI * 2); ctx.fill();
    } else {
      drawTopping(b.id, cx, cy - 6, 1);
    }
    ctx.font = "600 8px Quicksand, sans-serif"; ctx.textAlign = "center";
    ctx.fillStyle = "#9B7F89";
    ctx.fillText(b.label, cx, b.y + b.h - 5);
    ctx.restore();
  }

  /* ---- mixing bowl + slime + serve/trash buttons ---- */
  function drawBowlArea() {
    const shakeX = bowl.shake > 0 ? Math.sin(bowl.shake * 45) * 3.5 * bowl.shake : 0;
    ctx.save();
    ctx.translate(BOWL.x + shakeX, BOWL.y);

    // bowl body
    ctx.beginPath();
    ctx.moveTo(-56, 2);
    ctx.bezierCurveTo(-52, 42, 52, 42, 56, 2);
    ctx.closePath();
    ctx.fillStyle = "#FFDFEA"; ctx.fill();
    ctx.strokeStyle = "#F4B8CE"; ctx.lineWidth = 2.5; ctx.stroke();
    heartPath(0, 26, 6); ctx.fillStyle = "#F9A9C6"; ctx.fill();
    // rim
    ctx.beginPath(); ctx.ellipse(0, 0, 56, 15, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#FCEAF1"; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 1, 48, 11, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#F2CBDA"; ctx.fill();

    // slime! (a wobbling blob — this is the fluid part 💧)
    const fill = bowl.glue ? 1 : bowl.fill;
    if (fill > 0.02) {
      const rgb = currentRGB(), amp = 1.6 + 4.5 * bowl.jig;
      ctx.beginPath();
      for (let i = 0; i <= 26; i++) {
        const a = (i / 26) * Math.PI * 2;
        const wob = Math.sin(a * 3 + time * 5) * amp + Math.sin(a * 5 - time * 3.4) * amp * 0.5;
        const px = Math.cos(a) * (46 * fill + wob);
        const py = 1 + Math.sin(a) * (11 * fill + wob * 0.35) - 3 * fill;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = css(rgb, slimeAlpha()); ctx.fill();
      // glossy shine
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.beginPath(); ctx.ellipse(-16, -4, 11, 3.5, -0.3, 0, Math.PI * 2); ctx.fill();
      // toppings resting in the slime (3 sprinkles per topping)
      bowl.toppings.forEach((id, k) => {
        for (let j = 0; j < 3; j++) {
          const seed = k * 3 + j;
          const a = seed * 2.4, r = 10 + ((seed * 37) % 26);
          const tx = Math.cos(a) * r, ty = -1 + Math.sin(a) * r * 0.3 + Math.sin(time * 4 + seed) * 0.8;
          drawTopping(id, tx, ty, 0.5);
        }
      });
    }
    ctx.restore();

    // Serve 💝 button
    const grd = ctx.createLinearGradient(UI.serve.x, UI.serve.y, UI.serve.x, UI.serve.y + UI.serve.h);
    grd.addColorStop(0, "#FFC0CB"); grd.addColorStop(1, "#FF8FA3");
    rr(UI.serve.x, UI.serve.y + 2, UI.serve.w, UI.serve.h, 999); ctx.fillStyle = "rgba(233,120,150,.4)"; ctx.fill();
    rr(UI.serve.x, UI.serve.y, UI.serve.w, UI.serve.h, 999); ctx.fillStyle = grd; ctx.fill();
    ctx.font = "700 16px 'Baloo 2', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#FFF";
    ctx.fillText("Serve 💝", UI.serve.x + UI.serve.w / 2, UI.serve.y + 25);
    // Empty bowl button
    rr(UI.trash.x, UI.trash.y, UI.trash.w, UI.trash.h, 999);
    ctx.fillStyle = "#FFFFFF"; ctx.fill(); ctx.strokeStyle = "#F4B8CE"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.font = "700 12px 'Baloo 2', sans-serif"; ctx.fillStyle = "#C58DA1";
    ctx.fillText("Empty bowl 🗑️", UI.trash.x + UI.trash.w / 2, UI.trash.y + 19);
  }

  /* ---- pouring bottle + stream ---- */
  function drawPour() {
    const isDye = pour.kind === "dye";
    const bx = 152, by = 142 + Math.sin(pour.t * Math.PI) * 3;
    const col = isDye ? pour.ref.hex : (pour.ref.id === "clear" ? "#D6EEFF" : "#FFFFFF");
    // stream (a chain of blobs swaying gently — very slime-y)
    const sx = bx - 16, sy = by + 10, ex = BOWL.x, ey = BOWL.y - 3;
    for (let i = 0; i <= 9; i++) {
      const t = i / 9;
      const px = lerp(sx, ex, t) + Math.sin(time * 9 + t * 6) * 2.5 * t;
      const py = lerp(sy, ey, t * t * 0.4 + t * 0.6);
      ctx.fillStyle = col;
      ctx.globalAlpha = pour.ref.id === "clear" && !isDye ? 0.65 : 0.95;
      ctx.beginPath(); ctx.arc(px, py, 4.5 - t * 1.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // tilted bottle / jar
    ctx.save();
    ctx.translate(bx, by); ctx.rotate(-0.85);
    if (isDye) {
      rr(-11, -10, 22, 20, 5); ctx.fillStyle = pour.ref.hex; ctx.fill();
      ctx.strokeStyle = css(darken(hexRGB(pour.ref.hex), 0.8)); ctx.stroke();
      rr(-13, -15, 26, 6, 3); ctx.fillStyle = css(darken(hexRGB(pour.ref.hex), 0.85)); ctx.fill();
    } else {
      drawGlueBottle(0, 0, 1.05, pour.ref);
    }
    ctx.restore();
  }

  /* ---- topping drop-in arc ---- */
  function drawDrop(d) {
    const t = easeOut(clamp(d.t, 0, 1));
    const x = lerp(d.x0, BOWL.x, t);
    const y = lerp(d.y0, BOWL.y - 2, t) - Math.sin(t * Math.PI) * 46;
    drawTopping(d.id, x, y, 0.9);
  }

  /* ---- slime flying to the customer ---- */
  function drawServeBlob() {
    const t = easeOut(clamp(serveAnim.t / serveAnim.dur, 0, 1));
    const x = lerp(BOWL.x, 95, t);
    const y = lerp(BOWL.y - 6, 118, t) - Math.sin(t * Math.PI) * 34;
    ctx.beginPath();
    for (let i = 0; i <= 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const r = 20 + Math.sin(a * 3 + time * 8) * 2.5;
      i === 0 ? ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.85)
              : ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.85);
    }
    ctx.closePath();
    ctx.fillStyle = css(serveAnim.rgb, serveAnim.alpha); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath(); ctx.ellipse(x - 6, y - 6, 6, 3, -0.4, 0, Math.PI * 2); ctx.fill();
    serveAnim.toppings.forEach((id, k) => drawTopping(id, x + Math.cos(k * 2.4) * 9, y + Math.sin(k * 2.4) * 6, 0.5));
  }

  /* ---- the customers 🐰🐻🐱🐭 ---- */
  function drawCustomer(c) {
    const bobY = Math.sin(time * (c.state === "in" ? 9 : 3) + c.bob) * (c.state === "in" ? 3 : 2);
    let scaleY = 1, shakeX = 0;
    if (c.state === "happy") scaleY = 1 + Math.sin(c.reactT * 12) * 0.09;
    if (c.state === "sad")   shakeX = Math.sin(c.reactT * 20) * 2;
    const v = c.variant;
    ctx.save();
    ctx.translate(c.x + shakeX, 128 + bobY);
    ctx.scale(1, scaleY);

    const dark = css(darken(hexRGB(v.body), 0.82));
    // ears (per animal)
    ctx.fillStyle = v.body; ctx.strokeStyle = dark; ctx.lineWidth = 2;
    if (v.kind === "bunny") {
      [[-14, 1], [14, -1]].forEach(([ex, tilt]) => {
        ctx.save(); ctx.translate(ex, -34); ctx.rotate(tilt * 0.15);
        ctx.beginPath(); ctx.ellipse(0, -12, 8, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = v.trim; ctx.beginPath(); ctx.ellipse(0, -10, 4, 13, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = v.body; ctx.restore();
      });
    } else if (v.kind === "bear" || v.kind === "mouse") {
      const r = v.kind === "mouse" ? 12 : 10, off = v.kind === "mouse" ? 25 : 21;
      [[-off, -26], [off, -26]].forEach(([ex, ey]) => {
        ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = v.trim; ctx.beginPath(); ctx.arc(ex, ey, r * 0.55, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = v.body;
      });
    } else if (v.kind === "cat") {
      [[-18, -1], [18, 1]].forEach(([ex, dir]) => {
        ctx.beginPath(); ctx.moveTo(ex - 9 * dir, -22); ctx.lineTo(ex, -42); ctx.lineTo(ex + 9 * dir, -26); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = v.trim;
        ctx.beginPath(); ctx.moveTo(ex - 4 * dir, -26); ctx.lineTo(ex, -36); ctx.lineTo(ex + 4 * dir, -28); ctx.closePath(); ctx.fill();
        ctx.fillStyle = v.body;
      });
    }
    // body peeking above the counter + head
    ctx.beginPath(); ctx.ellipse(0, 34, 28, 22, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -6, 30, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // face
    const blinking = c.blink < 0;
    ctx.fillStyle = "#6B4B57"; ctx.strokeStyle = "#6B4B57"; ctx.lineWidth = 2;
    if (c.state === "happy") {
      [[-11], [11]].forEach(([ex]) => { ctx.beginPath(); ctx.arc(ex, -8, 4.5, Math.PI, 0, false); ctx.stroke(); });
    } else if (blinking) {
      [[-11], [11]].forEach(([ex]) => { ctx.beginPath(); ctx.moveTo(ex - 4, -8); ctx.lineTo(ex + 4, -8); ctx.stroke(); });
    } else {
      [[-11], [11]].forEach(([ex]) => {
        ctx.beginPath(); ctx.arc(ex, -8, 3.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#FFF"; ctx.beginPath(); ctx.arc(ex + 1.3, -9.3, 1.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#6B4B57";
      });
    }
    // blush
    ctx.fillStyle = "rgba(255,143,163,0.55)";
    ctx.beginPath(); ctx.arc(-18, 1, 4.5, 0, Math.PI * 2); ctx.arc(18, 1, 4.5, 0, Math.PI * 2); ctx.fill();
    // mouth
    ctx.strokeStyle = "#6B4B57"; ctx.lineWidth = 2;
    if (c.state === "happy") {
      ctx.fillStyle = "#B76377";
      ctx.beginPath(); ctx.arc(0, 3, 6, 0, Math.PI); ctx.closePath(); ctx.fill();
    } else if (c.state === "sad") {
      ctx.beginPath(); ctx.arc(0, 9, 5, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      ctx.fillStyle = "#9ED0FF";                       // a lil tear 💧
      ctx.beginPath(); ctx.ellipse(-15, -1 + (1.35 - c.reactT) * 10, 2.5, 4, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(0, 3, 4.5, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    }
    ctx.restore();
  }

  /* ---- the order bubble (with fading memory challenge!) ---- */
  function drawBubble(c) {
    const bx = 152, by = 30, bw = 196, bh = 96;
    const memory = level >= MEMORY_LEVEL;
    const visible = !memory || c.bubbleT < 5 || c.peekT > 0;
    const lowPatience = c.patience / c.patienceMax < 0.3;

    if (!visible) {   // mystery bubble — tap the customer to peek!
      rr(bx, by + 18, 92, 52, 14);
      ctx.fillStyle = "#FFFFFF"; ctx.fill();
      ctx.strokeStyle = "#F3BFD3"; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx + 4, by + 44); ctx.lineTo(bx - 8, by + 52); ctx.lineTo(bx + 4, by + 56); ctx.closePath();
      ctx.fillStyle = "#FFF"; ctx.fill(); ctx.strokeStyle = "#F3BFD3"; ctx.stroke();
      ctx.font = "700 22px 'Baloo 2', sans-serif"; ctx.textAlign = "center";
      ctx.fillStyle = "#D89BB3"; ctx.fillText("?", bx + 46, by + 48);
      ctx.font = "600 8px Quicksand, sans-serif";
      ctx.fillText("tap me to peek!", bx + 46, by + 62);
      drawPatienceBar(bx, by + 78, 92, c, lowPatience);
      return;
    }

    // fade-warning shimmer just before the order hides
    const fading = memory && c.bubbleT > 3.6 && c.peekT <= 0;
    ctx.globalAlpha = fading ? 0.55 + Math.sin(time * 10) * 0.25 : 1;
    rr(bx, by, bw, bh, 16);
    ctx.fillStyle = "#FFFFFF"; ctx.fill();
    ctx.strokeStyle = lowPatience ? "#FF8FA3" : "#F3BFD3"; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + 4, by + 44); ctx.lineTo(bx - 10, by + 56); ctx.lineTo(bx + 4, by + 58); ctx.closePath();
    ctx.fillStyle = "#FFF"; ctx.fill(); ctx.stroke();

    // row 1 — base + color
    const glue = GLUES.find(g => g.id === c.order.glueId);
    const dye  = DYES.find(d => d.id === c.order.colorId);
    drawGlueBottle(bx + 30, by + 30, 0.72, glue);
    ctx.font = "700 13px 'Baloo 2', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#C58DA1";
    ctx.fillText("+", bx + 58, by + 32);
    ctx.fillStyle = dye.hex;
    ctx.beginPath(); ctx.arc(bx + 84, by + 28, 12, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = css(darken(hexRGB(dye.hex), 0.8)); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath(); ctx.arc(bx + 80, by + 24, 3, 0, Math.PI * 2); ctx.fill();
    ctx.font = "600 8px Quicksand, sans-serif"; ctx.fillStyle = "#9B7F89";
    ctx.fillText(glue.label, bx + 30, by + 48);
    ctx.fillText(dye.label, bx + 84, by + 48);

    // row 2 — toppings
    if (c.order.toppings.length === 0) {
      ctx.font = "600 10px Quicksand, sans-serif"; ctx.fillStyle = "#C5A3B2";
      ctx.fillText("no toppings, keep it simple ✿", bx + bw / 2, by + 66);
    } else {
      c.order.toppings.forEach((id, i) => {
        const tx = bx + bw / 2 + (i - (c.order.toppings.length - 1) / 2) * 46;
        drawTopping(id, tx, by + 62, 0.9);
        ctx.font = "600 7.5px Quicksand, sans-serif"; ctx.fillStyle = "#9B7F89";
        ctx.fillText(TOPPINGS.find(t => t.id === id).label, tx, by + 76);
      });
    }
    ctx.globalAlpha = 1;
    drawPatienceBar(bx + 12, by + bh - 12, bw - 24, c, lowPatience);
  }

  function drawPatienceBar(x, y, w, c, low) {
    const frac = clamp(c.patience / c.patienceMax, 0, 1);
    rr(x, y, w, 7, 4); ctx.fillStyle = "#F4E3EA"; ctx.fill();
    const col = lerpRGB(hexRGB("#FF9EB5"), hexRGB("#93E6B8"), frac);
    rr(x, y, Math.max(7, w * frac), 7, 4);
    ctx.fillStyle = css(col); ctx.fill();
    if (low) {   // pulsing "hurry!" glow
      ctx.globalAlpha = 0.4 + Math.sin(time * 10) * 0.3;
      rr(x - 1.5, y - 1.5, w + 3, 10, 5); ctx.strokeStyle = "#FF6F91"; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = clamp(p.life, 0, 1);
      if (p.shape === "heart") { heartPath(p.x, p.y, p.size); ctx.fillStyle = p.color; ctx.fill(); }
      else { ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  }

  /* ---- hearts, level, pause ---- */
  function drawTopUI() {
    for (let i = 0; i < 3; i++) {
      heartPath(20 + i * 20, 20, 8);
      if (i < hearts) { ctx.fillStyle = "#FF6F91"; ctx.fill(); }
      else { ctx.strokeStyle = "#F0B9C8"; ctx.lineWidth = 2; ctx.stroke(); }
    }
    ctx.font = "700 12px 'Baloo 2', sans-serif"; ctx.textAlign = "left";
    ctx.fillStyle = "#C58DA1"; ctx.fillText(`Lv ${level}`, 12, 44);
    // pause pill
    rr(UI.pause.x, UI.pause.y, UI.pause.w, UI.pause.h, 999);
    ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.fill();
    ctx.strokeStyle = "#F3BFD3"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = "#D89BB3";
    ctx.fillRect(UI.pause.x + 12, UI.pause.y + 7, 4, 12);
    ctx.fillRect(UI.pause.x + 20, UI.pause.y + 7, 4, 12);
  }

  /* ============================================================
     GAME LOOP
     ============================================================ */
  let lastT = performance.now();
  function loop(now) {
    let dt = (now - lastT) / 1000;
    lastT = now;
    if (dt > 1 / 30) dt = 1 / 30;
    if (state === "playing") update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  /* ============================================================
     SCREENS & INPUT
     ============================================================ */
  function show(id) {
    ["screen-start", "screen-pause", "screen-over"].forEach(s =>
      document.getElementById(s).classList.toggle("hide", s !== id));
    hud.style.display = id ? "none" : "block";
  }
  function hideAll() {
    ["screen-start", "screen-pause", "screen-over"].forEach(s => document.getElementById(s).classList.add("hide"));
    hud.style.display = "block";
  }

  function startGame() {
    const nameInput = document.getElementById("name-input");
    playerName = GabiLeaderboard.cleanName(nameInput.value || playerName);
    localStorage.setItem("gabi_player_name", playerName);
    GabiAudio.unlock();
    reset();
    state = "playing";
    hideAll();
  }

  document.getElementById("btn-start").addEventListener("click", startGame);
  document.getElementById("btn-resume").addEventListener("click", togglePause);
  document.getElementById("btn-restart").addEventListener("click", () => { reset(); state = "playing"; hideAll(); });
  document.getElementById("name-input").value = playerName;

  function canvasPos(e) {
    const r = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: (t.clientX - r.left) * W / r.width, y: (t.clientY - r.top) * H / r.height };
  }
  function handleTap(p) {
    if (state !== "playing") return;
    if (inRect(p, UI.pause)) return togglePause();
    if (pour || serveAnim) return;                    // let the animation finish 💫
    if (customer && customer.state === "waiting" && level >= MEMORY_LEVEL && inRect(p, UI.customer)) {
      customer.peekT = 2; GabiAudio.sfx.click(); return;
    }
    for (const b of glueBtns) if (inRect(p, b)) return onGlue(b);
    for (const b of dyeBtns)  if (inRect(p, b)) return onDye(b);
    for (const b of topBtns)  if (inRect(p, b)) return onTop(b);
    if (inRect(p, UI.serve)) return onServe();
    if (inRect(p, UI.trash)) return onTrash();
  }
  function tap(e) { e.preventDefault(); handleTap(canvasPos(e)); }
  canvas.addEventListener("mousedown", tap);
  canvas.addEventListener("touchstart", tap, { passive: false });
  document.body.addEventListener("touchmove", (e) => { if (e.target === canvas) e.preventDefault(); }, { passive: false });

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      if (state === "start") startGame();
      else if (state === "over") { reset(); state = "playing"; hideAll(); }
      else if (state === "playing") onServe();
    }
    if (e.key === "t" || e.key === "T") { if (state === "playing") onTrash(); }
    if (e.key === "p" || e.key === "P" || e.key === "Escape") togglePause();
  });

  // Boot
  show("screen-start");
  reset();
  requestAnimationFrame(loop);
})();
