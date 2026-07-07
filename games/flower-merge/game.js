const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const nextEl = document.getElementById("next");
const restartBtn = document.getElementById("restart");
const nameInput = document.getElementById("player-name");
const leaderboardList = document.getElementById("leaderboard-list");

const W = canvas.width;
const H = canvas.height;
const FLOOR = H - 10;
const DANGER_LINE = 95;
const GAME_ID = "flower-merge";

const TYPES = [
  { emoji: "🌼", r: 22, points: 5 },
  { emoji: "🌸", r: 28, points: 15 },
  { emoji: "🌷", r: 35, points: 35 },
  { emoji: "🌺", r: 43, points: 80 },
  { emoji: "🌹", r: 52, points: 170 },
  { emoji: "🌻", r: 63, points: 360 },
  { emoji: "💐", r: 76, points: 800 },
  { emoji: "🌳", r: 88, points: 1700 },
  { emoji: "✨", r: 99, points: 4000 },
  { emoji: "🌙", r: 109, points: 9000 },
  { emoji: "⭐", r: 119, points: 20000 },
  { emoji: "🪐", r: 130, points: 45000 },
  { emoji: "🌌", r: 142, points: 100000 },
  { emoji: "☄️", r: 154, points: 240000 }
];

let flowers = [];
let score = 0;
let best = Number(localStorage.getItem("flowerMergeBest") || 0);
let playerName = localStorage.getItem("gabi_player_name") || "";
let nextType = randType();
let aimX = W / 2;
let canDrop = true;
let gameOver = false;
let dangerFrames = 0;
let submitted = false;
let runStart = performance.now();

bestEl.textContent = best;
nextEl.textContent = TYPES[nextType].emoji;
nameInput.value = playerName;
renderLeaderboard();

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
  submitted = false;
  runStart = performance.now();
  scoreEl.textContent = score;
  nextEl.textContent = TYPES[nextType].emoji;
}

restartBtn.addEventListener("click", restart);
nameInput.addEventListener("input", () => {
  playerName = nameInput.value.trim();
  localStorage.setItem("gabi_player_name", playerName);
});

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
  const tooHigh = flowers.some(f => f.age > 90 && f.y - f.r < DANGER_LINE);
  const settledTooHigh = flowers.some(f => {
    const slow = Math.abs(f.vy) < 0.5 && Math.abs(f.vx) < 0.5;
    return f.age > 45 && slow && f.y - f.r < DANGER_LINE + 12;
  });

  if (tooHigh || settledTooHigh) {
    dangerFrames += settledTooHigh ? 2 : 1;
  } else {
    dangerFrames = Math.max(0, dangerFrames - 2);
  }

  if (dangerFrames > 90) {
    finishGame();
  }
}

function finishGame() {
  if (gameOver) return;
  gameOver = true;
  submitScore();
}

async function submitScore() {
  if (submitted || !window.GabiLeaderboard) return;
  submitted = true;
  const durationMs = Math.max(performance.now() - runStart, score * 8);
  const result = await GabiLeaderboard.submit({
    name: playerName || nameInput.value || "Cutie",
    score,
    game: GAME_ID,
    durationMs
  });
  if (!result.ok) {
    saveLocalFlowerScore();
  }
  renderLeaderboard();
}

function saveLocalFlowerScore() {
  const key = "flower_merge_backup_scores";
  const board = JSON.parse(localStorage.getItem(key) || "[]");
  board.push({ name: playerName || "Cutie", score, date: new Date().toISOString() });
  board.sort((a, b) => b.score - a.score);
  localStorage.setItem(key, JSON.stringify(board.slice(0, 10)));
}

async function renderLeaderboard() {
  if (!leaderboardList) return;
  let board = [];
  if (window.GabiLeaderboard) {
    try {
      board = await GabiLeaderboard.get(GAME_ID);
    } catch {
      board = [];
    }
  }
  if (!board.length) {
    board = JSON.parse(localStorage.getItem("flower_merge_backup_scores") || "[]");
  }
  leaderboardList.innerHTML = board.slice(0, 5).map((row, i) => {
    const medal = ["🥇", "🥈", "🥉"][i] || `${i + 1}.`;
    return `<li><span>${medal} ${escapeHtml(row.name || "Cutie")}</span><span>${Math.floor(row.score)}</span></li>`;
  }).join("") || "<li>No scores yet — grow the first cosmic bloom!</li>";
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[ch]);
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
    ctx.font = "17px Trebuchet MS";
    ctx.fillText(submitted ? "Saved to the leaderboard!" : "Saving score...", W / 2, H / 2 + 38);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
