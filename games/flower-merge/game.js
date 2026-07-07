const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const nextEl = document.getElementById("next");
const restartBtn = document.getElementById("restart");

const W = canvas.width;
const H = canvas.height;
const FLOOR = H - 10;
const DANGER_LINE = 95;

const TYPES = [
  { emoji: "🌼", r: 22, points: 5 },
  { emoji: "🌸", r: 28, points: 15 },
  { emoji: "🌷", r: 35, points: 35 },
  { emoji: "🌺", r: 43, points: 80 },
  { emoji: "🌹", r: 52, points: 170 },
  { emoji: "🌻", r: 63, points: 360 },
  { emoji: "💐", r: 76, points: 800 },
  { emoji: "🌳", r: 90, points: 1700 },
  { emoji: "✨", r: 106, points: 4000 }
];

let flowers = [];
let score = 0;
let best = Number(localStorage.getItem("flowerMergeBest") || 0);
let nextType = randType();
let aimX = W / 2;
let canDrop = true;
let gameOver = false;
let dangerFrames = 0;

bestEl.textContent = best;
nextEl.textContent = TYPES[nextType].emoji;

function randType() {
  return Math.floor(Math.random() * 3);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function restart() {
  flowers = [];
  score = 0;
  nextType = randType();
  canDrop = true;
  gameOver = false;
  dangerFrames = 0;
  scoreEl.textContent = score;
  nextEl.textContent = TYPES[nextType].emoji;
}

restartBtn.addEventListener("click", restart);

function updateAim(clientX) {
  const rect = canvas.getBoundingClientRect();
  aimX = (clientX - rect.left) * (canvas.width / rect.width);
  aimX = clamp(aimX, 30, W - 30);
}

function dropFlower() {
  if (!canDrop || gameOver) return;

  const type = nextType;
  const t = TYPES[type];

  flowers.push({
    x: clamp(aimX, t.r, W - t.r),
    y: 45,
    vx: 0,
    vy: 0,
    r: t.r,
    type,
    age: 0,
    cooldown: 15
  });

  nextType = randType();
  nextEl.textContent = TYPES[nextType].emoji;

  canDrop = false;
  setTimeout(() => canDrop = true, 400);
}

canvas.addEventListener("mousemove", e => updateAim(e.clientX));
canvas.addEventListener("click", dropFlower);

canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  updateAim(e.touches[0].clientX);
  dropFlower();
}, { passive: false });

canvas.addEventListener("touchmove", e => {
  e.preventDefault();
  updateAim(e.touches[0].clientX);
}, { passive: false });

function update() {
  if (gameOver) return;

  for (const f of flowers) {
    f.age++;
    if (f.cooldown > 0) f.cooldown--;

    f.vy += 0.24;
    f.x += f.vx;
    f.y += f.vy;

    f.vx *= 0.985;
    f.vy *= 0.985;

    if (f.x - f.r < 0) {
      f.x = f.r;
      f.vx *= -0.4;
    }

    if (f.x + f.r > W) {
      f.x = W - f.r;
      f.vx *= -0.4;
    }

    if (f.y + f.r > FLOOR) {
      f.y = FLOOR - f.r;
      f.vy *= -0.12;
      f.vx *= 0.9;
    }
  }

  for (let pass = 0; pass < 5; pass++) {
    if (collisions()) break;
  }

  checkGameOver();
}

function collisions() {
  for (let i = 0; i < flowers.length; i++) {
    for (let j = i + 1; j < flowers.length; j++) {
      const a = flowers[i];
      const b = flowers[j];

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 0.001;
      const minDist = a.r + b.r;

      if (dist < minDist) {
        if (
          a.type === b.type &&
          a.cooldown <= 0 &&
          b.cooldown <= 0 &&
          a.type < TYPES.length - 1
        ) {
          merge(i, j);
          return true;
        }

        const overlap = minDist - dist;
        const nx = dx / dist;
        const ny = dy / dist;

        a.x -= nx * overlap * 0.5;
        a.y -= ny * overlap * 0.5;
        b.x += nx * overlap * 0.5;
        b.y += ny * overlap * 0.5;

        a.vx -= nx * overlap * 0.025;
        a.vy -= ny * overlap * 0.025;
        b.vx += nx * overlap * 0.025;
        b.vy += ny * overlap * 0.025;
      }
    }
  }

  return false;
}

function merge(i, j) {
  const a = flowers[i];
  const b = flowers[j];
  const newType = a.type + 1;
  const t = TYPES[newType];

  const newFlower = {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    vx: 0,
    vy: -2,
    r: t.r,
    type: newType,
    age: 0,
    cooldown: 20
  };

  flowers.splice(j, 1);
  flowers.splice(i, 1);
  flowers.push(newFlower);

  score += t.points;
  scoreEl.textContent = score;

  if (score > best) {
    best = score;
    localStorage.setItem("flowerMergeBest", best);
    bestEl.textContent = best;
  }
}

function checkGameOver() {
  const tooHigh = flowers.some(f => {
    return f.age > 180 && Math.abs(f.vy) < 0.08 && f.y - f.r < DANGER_LINE;
  });

  if (tooHigh && flowers.length > 20) {
    dangerFrames++;
  } else {
    dangerFrames = Math.max(0, dangerFrames - 3);
  }

  if (dangerFrames > 120) {
    gameOver = true;
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = "rgba(255, 142, 197, .35)";
  ctx.fillRect(0, DANGER_LINE, W, 3);

  ctx.fillStyle = "#d94f9d";
  ctx.font = "14px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText("danger line", W / 2, DANGER_LINE - 8);

  ctx.beginPath();
  ctx.moveTo(aimX, 0);
  ctx.lineTo(aimX, 58);
  ctx.strokeStyle = "rgba(217, 79, 157, .45)";
  ctx.lineWidth = 4;
  ctx.setLineDash([8, 8]);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = "38px serif";
  ctx.fillText(TYPES[nextType].emoji, aimX, 36);

  for (const f of flowers) {
    const t = TYPES[f.type];

    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 225, 242, .94)";
    ctx.fill();
    ctx.strokeStyle = "rgba(219, 72, 148, .45)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = `${f.r * 1.18}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(t.emoji, f.x, f.y + 2);
  }

  if (gameOver) {
    ctx.fillStyle = "rgba(255, 240, 248, .92)";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#d94f9d";
    ctx.font = "bold 42px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText("Garden Full!", W / 2, H / 2 - 40);

    ctx.font = "22px Trebuchet MS";
    ctx.fillText("Final Score: " + score, W / 2, H / 2 + 5);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
