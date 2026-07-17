/* Local top-25 leaderboard. It tracks several rankings because Squish Run has
   distance, score, survival, crystal, and time-trial goals. */
import { escapeHtml, formatTime } from "./utilities.js";

const BOARD_KEY = "squish_run_local_leaderboards_v2";
const CATEGORIES = ["distance", "score", "survival", "crystals", "timeTrial"];

function readBoards() {
  try {
    const boards = JSON.parse(localStorage.getItem(BOARD_KEY) || "{}");
    for (const key of CATEGORIES) boards[key] ||= [];
    return boards;
  } catch {
    return Object.fromEntries(CATEGORIES.map(key => [key, []]));
  }
}

function writeBoards(boards) {
  localStorage.setItem(BOARD_KEY, JSON.stringify(boards));
}

export function submitRun(run) {
  const boards = readBoards();
  const common = {
    name: run.name || "Dumpling",
    score: Math.floor(run.score),
    distance: Math.floor(run.distance),
    crystals: Math.floor(run.crystals),
    survivalMs: Math.floor(run.survivalMs),
    mode: run.mode,
    date: Date.now(),
  };
  boards.distance.push({ ...common, value: common.distance });
  boards.score.push({ ...common, value: common.score });
  boards.survival.push({ ...common, value: common.survivalMs });
  boards.crystals.push({ ...common, value: common.crystals });
  if (run.mode === "timeTrial" && run.finishedTimeTrial) {
    boards.timeTrial.push({ ...common, value: common.survivalMs });
  }
  boards.distance.sort((a, b) => b.value - a.value);
  boards.score.sort((a, b) => b.value - a.value);
  boards.survival.sort((a, b) => b.value - a.value);
  boards.crystals.sort((a, b) => b.value - a.value);
  boards.timeTrial.sort((a, b) => a.value - b.value);
  for (const key of CATEGORIES) boards[key] = boards[key].slice(0, 25);
  writeBoards(boards);
  return boards;
}

export function getBoards() {
  return readBoards();
}

export function renderLeaderboard(category = "distance") {
  const boards = readBoards();
  const rows = boards[category] || [];
  const label = {
    distance: "Distance",
    score: "Score",
    survival: "Survival",
    crystals: "Crystals",
    timeTrial: "Fastest",
  }[category];
  const buttons = CATEGORIES.map(key => `<button class="chip ${key === category ? "is-active" : ""}" data-board="${key}">${key}</button>`).join("");
  const table = rows.map((row, i) => {
    const value = category === "survival" || category === "timeTrial" ? formatTime(row.value) : row.value;
    return `<div class="table-row"><span>${i + 1}. ${escapeHtml(row.name)}</span><span>${value}</span><span>${row.score}</span><span>${row.crystals}</span><span>${row.mode}</span></div>`;
  }).join("") || `<div class="stat-card"><span>No ${label.toLowerCase()} runs yet.</span><strong>Play first</strong></div>`;
  return `<div class="mode-row">${buttons}</div><div class="table-row"><span>Name</span><span>${label}</span><span>Score</span><span>Crystals</span><span>Mode</span></div>${table}`;
}
