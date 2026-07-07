(() => {
  const GAME_ID = "2048";
  const BOARD_KEY = "kawaii_2048_state_v1";
  const BEST_KEY = "kawaii_2048_best_v1";
  const DEFAULT_SIZE = 4;

  const boardEl = document.getElementById("board");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const currentTileEl = document.getElementById("current-tile");
  const movesEl = document.getElementById("moves");
  const largestEl = document.getElementById("largest");
  const modeLabelEl = document.getElementById("mode-label");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayText = document.getElementById("overlay-text");
  const keepGoingBtn = document.getElementById("btn-keep-going");
  const playAgainBtn = document.getElementById("btn-play-again");
  const restartBtn = document.getElementById("btn-restart");
  const undoBtn = document.getElementById("btn-undo");
  const nameInput = document.getElementById("player-name");
  const leaderList = document.getElementById("leader-list");
  const leaderNote = document.getElementById("leader-note");
  const leaderCard = document.getElementById("leader-card");

  const TILE_THEMES = [
    { value: 2, emoji: "🐰", label: "Tiny Bunny", colors: ["#fff0f8", "#ffd2eb"] },
    { value: 4, emoji: "🧋", label: "Strawberry Boba", colors: ["#ffe2f2", "#ffc0df"] },
    { value: 8, emoji: "🐱", label: "Cream Kitten", colors: ["#fff5d6", "#ffe59a"] },
    { value: 16, emoji: "🐼", label: "Panda Puff", colors: ["#f7f7ff", "#dcdcff"] },
    { value: 32, emoji: "🐶", label: "Puppy Cake", colors: ["#ffe9da", "#ffc69d"] },
    { value: 64, emoji: "🦊", label: "Peach Fox", colors: ["#ffd8c7", "#ff9f9f"] },
    { value: 128, emoji: "🐸", label: "Melon Frog", colors: ["#ddffd7", "#9ef0b0"] },
    { value: 256, emoji: "🐻", label: "Honey Bear", colors: ["#fff0bd", "#ffd36e"] },
    { value: 512, emoji: "🐹", label: "Mochi Hamster", colors: ["#ffe8c8", "#ffb8c8"] },
    { value: 1024, emoji: "🐧", label: "Snow Penguin", colors: ["#ddf6ff", "#9edcff"] },
    { value: 2048, emoji: "🦄", label: "Pastel Unicorn", colors: ["#f7d7ff", "#b8f4ff"] },
    { value: 4096, emoji: "🐬", label: "Dream Dolphin", colors: ["#cdf8ff", "#8ab8ff"] },
    { value: 8192, emoji: "🦋", label: "Sugar Butterfly", colors: ["#e8ddff", "#ffb7e7"] },
    { value: 16384, emoji: "🌙", label: "Moon Macaron", colors: ["#fff8c8", "#c9c7ff"] },
    { value: 32768, emoji: "⭐", label: "Star Parfait", colors: ["#fff2a8", "#ffb7d5"] },
    { value: 65536, emoji: "🪐", label: "Boba Planet", colors: ["#d9f7ff", "#c8b7ff"] },
    { value: 131072, emoji: "🌌", label: "Galaxy Sundae", colors: ["#b8b4ff", "#ffaad6"] },
    { value: 262144, emoji: "👑", label: "Cosmic Cutie", colors: ["#ffe487", "#ff8fc9"] }
  ];

  let size = DEFAULT_SIZE;
  let grid = [];
  let score = 0;
  let moves = 0;
  let won = false;
  let over = false;
  let submitted = false;
  let startTime = performance.now();
  let previous = null;
  let playerName = localStorage.getItem("gabi_player_name") || "";

  nameInput.value = playerName;

  function emptyGrid(n = size) {
    return Array.from({ length: n }, () => Array(n).fill(0));
  }

  function cloneGrid(source) {
    return source.map(row => row.slice());
  }

  function saveSnapshot() {
    previous = {
      grid: cloneGrid(grid),
      score,
      moves,
      won,
      over
    };
    undoBtn.disabled = false;
  }

  function restoreSnapshot() {
    if (!previous) return;
    grid = cloneGrid(previous.grid);
    score = previous.score;
    moves = previous.moves;
    won = previous.won;
    over = previous.over;
    previous = null;
    submitted = false;
    undoBtn.disabled = true;
    hideOverlay();
    render();
    saveState();
  }

  function randomEmptyCell() {
    const cells = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!grid[r][c]) cells.push({ r, c });
      }
    }
    return cells[Math.floor(Math.random() * cells.length)];
  }

  function addRandomTile() {
    const cell = randomEmptyCell();
    if (!cell) return;
    grid[cell.r][cell.c] = Math.random() < 0.9 ? 2 : 4;
  }

  function startGame(nextSize = size) {
    size = nextSize;
    grid = emptyGrid(size);
    score = 0;
    moves = 0;
    won = false;
    over = false;
    submitted = false;
    previous = null;
    startTime = performance.now();
    addRandomTile();
    addRandomTile();
    hideOverlay();
    updateSizeButtons();
    render();
    saveState();
    renderLeaderboard();
  }

  function compressLine(line) {
    const compact = line.filter(Boolean);
    const next = [];
    let gained = 0;
    let largestMerge = 0;
    let combo = false;
    for (let i = 0; i < compact.length; i++) {
      if (
        size === 4 &&
        compact[i] &&
        compact[i] === compact[i + 1] &&
        compact[i] === compact[i + 2] &&
        compact[i] === compact[i + 3]
      ) {
        const merged = compact[i] * 4;
        next.push(merged);
        gained += merged * 2;
        largestMerge = Math.max(largestMerge, merged);
        combo = true;
        i += 3;
      } else if (compact[i] === compact[i + 1]) {
        const merged = compact[i] * 2;
        next.push(merged);
        gained += merged;
        largestMerge = Math.max(largestMerge, merged);
        i++;
      } else {
        next.push(compact[i]);
      }
    }
    while (next.length < size) next.push(0);
    return { line: next, gained, largestMerge, combo };
  }

  function move(direction) {
    if (over) return;
    saveSnapshot();
    const oldGrid = cloneGrid(grid);
    const before = JSON.stringify(grid);
    let gained = 0;
    let largestMerge = 0;
    let combo = false;
    const next = emptyGrid(size);

    for (let i = 0; i < size; i++) {
      let line = [];
      for (let j = 0; j < size; j++) {
        if (direction === "left") line.push(grid[i][j]);
        if (direction === "right") line.push(grid[i][size - 1 - j]);
        if (direction === "up") line.push(grid[j][i]);
        if (direction === "down") line.push(grid[size - 1 - j][i]);
      }
      const merged = compressLine(line);
      gained += merged.gained;
      largestMerge = Math.max(largestMerge, merged.largestMerge);
      combo = combo || merged.combo;
      for (let j = 0; j < size; j++) {
        const value = merged.line[j];
        if (direction === "left") next[i][j] = value;
        if (direction === "right") next[i][size - 1 - j] = value;
        if (direction === "up") next[j][i] = value;
        if (direction === "down") next[size - 1 - j][i] = value;
      }
    }

    const changed = before !== JSON.stringify(next);
    if (!changed) {
      previous = null;
      undoBtn.disabled = true;
      return;
    }

    grid = next;
    score += gained;
    moves++;
    addRandomTile();
    if (window.GabiAudio && gained) GabiAudio.sfx.score();
    render(largestMerge, oldGrid, combo);
    updateBest();
    if (!won && largestTile() >= 2048) {
      won = true;
      showOverlay("You made 2048!", "Keep merging into higher kawaii friends.", true);
    } else if (!canMove()) {
      over = true;
      showOverlay("Board Full", "No more matching friends can move.", false);
      submitIfEligible();
    }
    saveState();
  }

  function largestTile() {
    return Math.max(...grid.flat());
  }

  function canMove() {
    if (grid.flat().some(v => !v)) return true;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const v = grid[r][c];
        if (grid[r + 1] && grid[r + 1][c] === v) return true;
        if (grid[r][c + 1] === v) return true;
      }
    }
    return false;
  }

  function tileTheme(value) {
    const exact = TILE_THEMES.find(t => t.value === value);
    if (exact) return exact;
    const last = TILE_THEMES[TILE_THEMES.length - 1];
    return { ...last, value, label: `${last.label}+` };
  }

  function render(mergedValue = 0, oldGrid = null, combo = false) {
    boardEl.style.setProperty("--board-size", size);
    boardEl.dataset.size = String(size);
    boardEl.innerHTML = "";
    for (let i = 0; i < size * size; i++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      boardEl.appendChild(cell);
    }

    const rect = boardEl.getBoundingClientRect();
    const gap = parseFloat(getComputedStyle(boardEl).getPropertyValue("--tile-gap")) || 12;
    const cellSize = (rect.width - gap * (size + 1)) / size;
    const movementSources = oldGrid ? buildMovementSources(oldGrid) : [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const value = grid[r][c];
        if (!value) continue;
        const theme = tileTheme(value);
        const tile = document.createElement("div");
        tile.className = "tile";
        if (value === mergedValue) tile.classList.add("is-merged");
        if (combo && value === mergedValue) tile.classList.add("is-combo");
        tile.style.width = `${cellSize}px`;
        tile.style.height = `${cellSize}px`;
        const finalX = gap + c * (cellSize + gap);
        const finalY = gap + r * (cellSize + gap);
        const source = takeMovementSource(movementSources, value, r, c);
        if (!source && oldGrid) tile.classList.add("is-new");
        const start = source || { r, c };
        const fromX = gap + start.c * (cellSize + gap);
        const fromY = gap + start.r * (cellSize + gap);
        tile.style.setProperty("--x", `${finalX}px`);
        tile.style.setProperty("--y", `${finalY}px`);
        tile.style.setProperty("--from-x", `${fromX}px`);
        tile.style.setProperty("--from-y", `${fromY}px`);
        tile.style.background = `linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]})`;
        if (oldGrid && source) tile.classList.add("is-sliding");
        tile.innerHTML = `
          <div class="tile__face">
            <span class="tile__shine"></span>
            <span class="tile__ears"></span>
            <div class="tile__emoji">${theme.emoji}</div>
            <div class="tile__cute-face"><span></span><span></span></div>
            <span class="tile__sparkles">✦</span>
            <div class="tile__label">${theme.label}</div>
            <div class="tile__value">${value}</div>
          </div>
        `;
        boardEl.appendChild(tile);
        if (oldGrid) {
          requestAnimationFrame(() => tile.classList.remove("is-sliding"));
        }
      }
    }

    scoreEl.textContent = score;
    bestEl.textContent = getBest();
    movesEl.textContent = moves;
    largestEl.textContent = largestTile();
    modeLabelEl.textContent = `${size}x${size}`;
    currentTileEl.textContent = tileTheme(largestTile()).label;
    leaderNote.textContent = size === 4 ? "Leaderboard enabled for 4x4" : "Practice mode - no leaderboard";
    leaderCard.style.display = size === 4 ? "block" : "none";
  }

  function buildMovementSources(sourceGrid) {
    const sources = [];
    for (let r = 0; r < sourceGrid.length; r++) {
      for (let c = 0; c < sourceGrid[r].length; c++) {
        if (sourceGrid[r][c]) sources.push({ value: sourceGrid[r][c], r, c, used: false });
      }
    }
    return sources;
  }

  function takeMovementSource(sources, value, targetR, targetC) {
    const candidates = [
      value,
      value / 2,
      value / 4
    ].filter(v => Number.isInteger(v) && v >= 2);
    let best = null;
    for (const wanted of candidates) {
      for (const source of sources) {
        if (source.used || source.value !== wanted) continue;
        const distance = Math.abs(source.r - targetR) + Math.abs(source.c - targetC);
        if (!best || distance < best.distance) best = { source, distance };
      }
      if (best) break;
    }
    if (!best) return null;
    best.source.used = true;
    return best.source;
  }

  function updateBest() {
    const best = getBest();
    if (score > best) {
      localStorage.setItem(bestKey(), String(score));
    }
  }

  function bestKey() {
    return `${BEST_KEY}_${size}`;
  }

  function getBest() {
    return Number(localStorage.getItem(bestKey()) || 0);
  }

  function showOverlay(title, text, canContinue) {
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    keepGoingBtn.style.display = canContinue ? "inline-flex" : "none";
    overlay.classList.remove("hide");
  }

  function hideOverlay() {
    overlay.classList.add("hide");
  }

  function saveState() {
    localStorage.setItem(BOARD_KEY, JSON.stringify({ size, grid, score, moves, won, over }));
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(BOARD_KEY) || "null");
      if (!saved || ![4, 5, 6].includes(saved.size)) return false;
      size = saved.size;
      grid = saved.grid;
      score = saved.score || 0;
      moves = saved.moves || 0;
      won = !!saved.won;
      over = !!saved.over;
      updateSizeButtons();
      render();
      return true;
    } catch {
      return false;
    }
  }

  function updateSizeButtons() {
    document.querySelectorAll(".size-btn").forEach(btn => {
      btn.classList.toggle("is-active", Number(btn.dataset.size) === size);
    });
  }

  async function submitIfEligible() {
    if (submitted || size !== 4 || !window.GabiLeaderboard) return;
    submitted = true;
    const durationMs = Math.max(performance.now() - startTime, score * 3);
    await GabiLeaderboard.submit({
      name: playerName || nameInput.value || "Cutie",
      score,
      game: GAME_ID,
      durationMs
    });
    renderLeaderboard();
  }

  async function renderLeaderboard() {
    if (!leaderList || !window.GabiLeaderboard) return;
    let board = [];
    try {
      board = await GabiLeaderboard.get(GAME_ID);
    } catch {
      board = [];
    }
    leaderList.innerHTML = board.slice(0, 5).map((row, i) => {
      const medal = ["🥇", "🥈", "🥉"][i] || `${i + 1}.`;
      return `<li><span>${medal} ${escapeHtml(row.name || "Cutie")}</span><span>${Math.floor(row.score)}</span></li>`;
    }).join("") || "<li>No 4x4 scores yet.</li>";
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

  function keyToDirection(key) {
    return {
      ArrowLeft: "left",
      a: "left",
      A: "left",
      ArrowRight: "right",
      d: "right",
      D: "right",
      ArrowUp: "up",
      w: "up",
      W: "up",
      ArrowDown: "down",
      s: "down",
      S: "down"
    }[key];
  }

  document.addEventListener("keydown", event => {
    const direction = keyToDirection(event.key);
    if (!direction) return;
    event.preventDefault();
    move(direction);
  });

  let touchStart = null;
  boardEl.addEventListener("pointerdown", event => {
    touchStart = { x: event.clientX, y: event.clientY };
    boardEl.setPointerCapture(event.pointerId);
  });

  boardEl.addEventListener("pointerup", event => {
    if (!touchStart) return;
    const dx = event.clientX - touchStart.x;
    const dy = event.clientY - touchStart.y;
    touchStart = null;
    if (Math.hypot(dx, dy) < 26) return;
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
  });

  restartBtn.addEventListener("click", () => startGame(size));
  undoBtn.addEventListener("click", restoreSnapshot);
  playAgainBtn.addEventListener("click", () => startGame(size));
  keepGoingBtn.addEventListener("click", () => {
    hideOverlay();
    saveState();
  });

  document.querySelectorAll(".size-btn").forEach(btn => {
    btn.addEventListener("click", () => startGame(Number(btn.dataset.size)));
  });

  nameInput.addEventListener("input", () => {
    playerName = nameInput.value.trim();
    localStorage.setItem("gabi_player_name", playerName);
  });

  window.addEventListener("resize", () => render());

  undoBtn.disabled = true;
  if (!loadState()) startGame(DEFAULT_SIZE);
  renderLeaderboard();
})();
