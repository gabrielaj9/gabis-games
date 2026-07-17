/* Local save system for progression, settings, achievements, replay snapshots,
   unlocks, and lifetime statistics. Everything is browser-local and autosaved. */
const SAVE_KEY = "squish_run_save_v2";

const DEFAULT_SAVE = {
  playerName: "",
  xp: 0,
  crystals: 0,
  gamesPlayed: 0,
  bestDistance: 0,
  bestScore: 0,
  longestSurvivalMs: 0,
  mostCrystals: 0,
  fastestTimeTrialMs: 0,
  unlockedColors: ["bubblegum"],
  selectedColor: "bubblegum",
  unlockedTrails: ["sparkle"],
  selectedTrail: "sparkle",
  titles: ["Tunnel Sprout"],
  achievements: {},
  lastReplay: [],
  ghostReplay: [],
  settings: {
    volume: 0.55,
    music: 0.45,
    muted: false,
    reducedMotion: false,
    colorblind: false,
    performance: "balanced",
    screenShake: true,
  },
};

function cloneDefault() {
  return JSON.parse(JSON.stringify(DEFAULT_SAVE));
}

export function loadSave() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
    return mergeSave(cloneDefault(), parsed);
  } catch {
    return cloneDefault();
  }
}

export function saveGame(save) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

export function mergeSave(base, next) {
  for (const [key, value] of Object.entries(next || {})) {
    if (value && typeof value === "object" && !Array.isArray(value) && base[key]) {
      base[key] = mergeSave(base[key], value);
    } else {
      base[key] = value;
    }
  }
  return base;
}

export function addXp(save, amount) {
  save.xp += Math.max(0, Math.floor(amount));
  const unlocks = [
    [150, "mint", "color"],
    [350, "moon", "color"],
    [650, "comet", "trail"],
    [950, "Star Jelly", "title"],
    [1350, "cosmic", "color"],
    [1900, "nebula", "trail"],
    [2600, "Ceiling Runner", "title"],
  ];
  const messages = [];
  for (const [needed, id, kind] of unlocks) {
    if (save.xp < needed) continue;
    if (kind === "color" && !save.unlockedColors.includes(id)) {
      save.unlockedColors.push(id);
      messages.push(`Unlocked slime color: ${id}`);
    }
    if (kind === "trail" && !save.unlockedTrails.includes(id)) {
      save.unlockedTrails.push(id);
      messages.push(`Unlocked trail: ${id}`);
    }
    if (kind === "title" && !save.titles.includes(id)) {
      save.titles.push(id);
      messages.push(`Unlocked title: ${id}`);
    }
  }
  return messages;
}

export function recordAchievement(save, id) {
  if (save.achievements[id]) return false;
  save.achievements[id] = Date.now();
  return true;
}

export function updateStats(save, run) {
  save.gamesPlayed += 1;
  save.bestDistance = Math.max(save.bestDistance, Math.floor(run.distance));
  save.bestScore = Math.max(save.bestScore, Math.floor(run.score));
  save.longestSurvivalMs = Math.max(save.longestSurvivalMs, Math.floor(run.survivalMs));
  save.mostCrystals = Math.max(save.mostCrystals, Math.floor(run.crystals));
  if (run.mode === "timeTrial" && run.finishedTimeTrial) {
    save.fastestTimeTrialMs = save.fastestTimeTrialMs
      ? Math.min(save.fastestTimeTrialMs, run.survivalMs)
      : run.survivalMs;
  }
}

export const ACHIEVEMENTS = [
  { id: "first_run", name: "First Squish", text: "Start your first tunnel run." },
  { id: "distance_500", name: "Orbit Legs", text: "Reach 500 meters." },
  { id: "distance_1500", name: "Hex Voyager", text: "Reach 1500 meters." },
  { id: "crystals_25", name: "Crystal Basket", text: "Collect 25 crystals in one run." },
  { id: "ceiling", name: "Ceiling Friend", text: "Rotate onto the ceiling." },
  { id: "shield", name: "Bubble Brave", text: "Block a hit with a shield." },
  { id: "daily", name: "Daily Dreamer", text: "Play the daily challenge." },
  { id: "time_trial", name: "Clock Comet", text: "Finish a time trial." },
];
