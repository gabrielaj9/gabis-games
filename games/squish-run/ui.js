/* UI controller for menus, settings, achievements, touch controls, and HUD.
   The renderer owns the canvas; this file owns every DOM interaction. */
import { ACHIEVEMENTS, saveGame } from "./save.js";
import { getBoards, renderLeaderboard } from "./leaderboard.js";
import { escapeHtml, formatTime } from "./utilities.js";

export class UI {
  constructor(save) {
    this.save = save;
    this.mode = "endless";
    this.elements = {
      home: document.getElementById("screen-home"),
      panel: document.getElementById("screen-panel"),
      pause: document.getElementById("screen-pause"),
      over: document.getElementById("screen-over"),
      loading: document.getElementById("loading-screen"),
      panelTitle: document.getElementById("panel-title"),
      panelBody: document.getElementById("panel-body"),
      name: document.getElementById("name-input"),
      seed: document.getElementById("seed-input"),
      toast: document.getElementById("toast-stack"),
      distance: document.getElementById("hud-distance"),
      score: document.getElementById("hud-score"),
      crystals: document.getElementById("hud-crystals"),
      power: document.getElementById("hud-power"),
    };
    this.elements.name.value = save.playerName || localStorage.getItem("gabi_player_name") || "";
  }

  bind(game) {
    document.getElementById("btn-play").addEventListener("click", () => game.start(this.mode));
    document.getElementById("btn-leaderboard").addEventListener("click", () => this.openPanel("leaderboard"));
    document.getElementById("btn-instructions").addEventListener("click", () => this.openPanel("instructions"));
    document.getElementById("btn-panel-close").addEventListener("click", () => this.closePanel());
    document.getElementById("btn-resume").addEventListener("click", () => game.togglePause());
    document.getElementById("btn-restart").addEventListener("click", () => game.start(this.mode));
    document.getElementById("btn-run-again").addEventListener("click", () => game.start(this.mode));
    document.getElementById("btn-over-board").addEventListener("click", () => this.openPanel("leaderboard"));
    document.getElementById("btn-photo").addEventListener("click", () => game.togglePhotoMode());
    document.getElementById("btn-fullscreen").addEventListener("click", () => game.toggleFullscreen());
    document.querySelectorAll("[data-mode]").forEach(btn => {
      btn.addEventListener("click", () => this.selectMode(btn.dataset.mode));
    });
    document.querySelectorAll("[data-panel]").forEach(btn => {
      btn.addEventListener("click", () => this.openPanel(btn.dataset.panel));
    });
  }

  selectMode(mode) {
    this.mode = mode;
    document.querySelectorAll("[data-mode]").forEach(btn => btn.classList.toggle("is-active", btn.dataset.mode === mode));
    this.elements.seed.classList.toggle("is-visible", mode === "seeded");
  }

  showHome() {
    this.hideAll();
    this.elements.home.classList.remove("hide");
  }

  showPause() {
    this.elements.pause.classList.remove("hide");
  }

  hidePause() {
    this.elements.pause.classList.add("hide");
  }

  hideAll() {
    for (const key of ["home", "panel", "pause", "over"]) this.elements[key].classList.add("hide");
  }

  openPanel(panel) {
    this.elements.panel.classList.remove("hide");
    this.elements.panelTitle.textContent = panel[0].toUpperCase() + panel.slice(1);
    document.querySelectorAll("[data-panel]").forEach(btn => btn.classList.toggle("is-active", btn.dataset.panel === panel));
    if (panel === "leaderboard") this.renderBoard("distance");
    if (panel === "settings") this.renderSettings();
    if (panel === "achievements") this.renderAchievements();
    if (panel === "stats") this.renderStats();
    if (panel === "credits") this.renderCredits();
    if (panel === "instructions") this.renderInstructions();
  }

  closePanel() {
    this.elements.panel.classList.add("hide");
  }

  renderBoard(category) {
    this.elements.panelTitle.textContent = "Leaderboard";
    this.elements.panelBody.innerHTML = renderLeaderboard(category);
    this.elements.panelBody.querySelectorAll("[data-board]").forEach(btn => {
      btn.addEventListener("click", () => this.renderBoard(btn.dataset.board));
    });
  }

  renderSettings() {
    const s = this.save.settings;
    this.elements.panelBody.innerHTML = `
      <label class="setting-row"><span>Volume</span><input id="setting-volume" type="range" min="0" max="1" step="0.01" value="${s.volume}"></label>
      <label class="setting-row"><span>Music</span><input id="setting-music" type="range" min="0" max="1" step="0.01" value="${s.music}"></label>
      <label class="setting-row"><span>Mute</span><input id="setting-muted" type="checkbox" ${s.muted ? "checked" : ""}></label>
      <label class="setting-row"><span>Screen shake</span><input id="setting-shake" type="checkbox" ${s.screenShake ? "checked" : ""}></label>
      <label class="setting-row"><span>Reduced motion</span><input id="setting-motion" type="checkbox" ${s.reducedMotion ? "checked" : ""}></label>
      <label class="setting-row"><span>Colorblind colors</span><input id="setting-colorblind" type="checkbox" ${s.colorblind ? "checked" : ""}></label>
      <label class="setting-row"><span>Performance</span><select id="setting-performance"><option>balanced</option><option>quality</option><option>battery</option></select></label>
    `;
    this.elements.panelBody.querySelector("#setting-performance").value = s.performance;
    this.elements.panelBody.addEventListener("input", event => {
      const id = event.target.id;
      if (id === "setting-volume") s.volume = +event.target.value;
      if (id === "setting-music") s.music = +event.target.value;
      if (id === "setting-muted") s.muted = event.target.checked;
      if (id === "setting-shake") s.screenShake = event.target.checked;
      if (id === "setting-motion") s.reducedMotion = event.target.checked;
      if (id === "setting-colorblind") s.colorblind = event.target.checked;
      if (id === "setting-performance") s.performance = event.target.value;
      saveGame(this.save);
      window.dispatchEvent(new CustomEvent("squish-settings"));
    });
  }

  renderAchievements() {
    this.elements.panelBody.innerHTML = ACHIEVEMENTS.map(a => {
      const done = !!this.save.achievements[a.id];
      return `<div class="achievement-card"><span>${done ? "✓" : "◇"} <strong>${escapeHtml(a.name)}</strong><br>${escapeHtml(a.text)}</span><strong>${done ? "Done" : "Locked"}</strong></div>`;
    }).join("");
  }

  renderStats() {
    const s = this.save;
    this.elements.panelBody.innerHTML = `
      <div class="stat-card"><span>XP</span><strong>${s.xp}</strong></div>
      <div class="stat-card"><span>Games played</span><strong>${s.gamesPlayed}</strong></div>
      <div class="stat-card"><span>Best distance</span><strong>${s.bestDistance}m</strong></div>
      <div class="stat-card"><span>Best score</span><strong>${s.bestScore}</strong></div>
      <div class="stat-card"><span>Most crystals</span><strong>${s.mostCrystals}</strong></div>
      <div class="stat-card"><span>Longest survival</span><strong>${formatTime(s.longestSurvivalMs)}</strong></div>
      <div class="stat-card"><span>Fastest time trial</span><strong>${s.fastestTimeTrialMs ? formatTime(s.fastestTimeTrialMs) : "None"}</strong></div>
    `;
  }

  renderCredits() {
    this.elements.panelBody.innerHTML = `
      <div class="stat-card"><span>Design</span><strong>Gabi's pastel space style</strong></div>
      <div class="stat-card"><span>Engine</span><strong>Custom canvas physics</strong></div>
      <div class="stat-card"><span>Audio</span><strong>Procedural synths</strong></div>
    `;
  }

  renderInstructions() {
    this.elements.panelTitle.textContent = "Instructions";
    this.elements.panelBody.innerHTML = `
      <div class="stat-card"><span>Move</span><strong>A/D or arrows</strong></div>
      <div class="stat-card"><span>Jump</span><strong>Space</strong></div>
      <div class="stat-card"><span>Sprint</span><strong>Shift</strong></div>
      <div class="stat-card"><span>Rotate</span><strong>Q/E onto walls</strong></div>
      <div class="stat-card"><span>Restart</span><strong>R</strong></div>
      <div class="stat-card"><span>Mobile</span><strong>Joystick + Jump + Pause</strong></div>
    `;
  }

  updateHud(run, powers) {
    this.elements.distance.textContent = `${Math.floor(run.distance)}m`;
    this.elements.score.textContent = Math.floor(run.score);
    this.elements.crystals.textContent = run.crystals;
    const active = Object.entries(powers).find(([, value]) => value > 0);
    this.elements.power.textContent = active ? active[0] : "Ready";
  }

  showGameOver(run) {
    this.hideAll();
    document.getElementById("over-title").textContent = run.reason || "Beautiful try";
    document.getElementById("summary-grid").innerHTML = `
      <div>Distance<br>${Math.floor(run.distance)}m</div>
      <div>Score<br>${Math.floor(run.score)}</div>
      <div>Crystals<br>${run.crystals}</div>
      <div>Survival<br>${formatTime(run.survivalMs)}</div>
    `;
    this.elements.over.classList.remove("hide");
  }

  toast(text) {
    const node = document.createElement("div");
    node.className = "toast";
    node.textContent = text;
    this.elements.toast.appendChild(node);
    window.setTimeout(() => node.remove(), 2400);
  }

  clearLoading() {
    this.elements.loading.classList.add("is-gone");
    window.setTimeout(() => this.elements.loading.classList.add("hide"), 400);
  }

  playerName() {
    const value = this.elements.name.value.trim() || "Dumpling";
    this.save.playerName = value.slice(0, 12);
    localStorage.setItem("gabi_player_name", this.save.playerName);
    saveGame(this.save);
    return this.save.playerName;
  }

  seedValue() {
    return this.elements.seed.value.trim();
  }
}

export function attachTouchControls(input) {
  const stick = document.getElementById("stick");
  const knob = stick.querySelector("span");
  let active = false;
  function setStick(clientX) {
    const rect = stick.getBoundingClientRect();
    const dx = Math.max(-36, Math.min(36, clientX - rect.left - rect.width / 2));
    knob.style.transform = `translateX(${dx}px)`;
    input.touchMove = dx / 36;
  }
  stick.addEventListener("pointerdown", e => {
    active = true;
    stick.setPointerCapture(e.pointerId);
    setStick(e.clientX);
  });
  stick.addEventListener("pointermove", e => {
    if (active) setStick(e.clientX);
  });
  stick.addEventListener("pointerup", () => {
    active = false;
    input.touchMove = 0;
    knob.style.transform = "translateX(0)";
  });
  document.getElementById("touch-jump").addEventListener("pointerdown", () => input.jumpQueued = true);
  document.getElementById("touch-pause").addEventListener("click", () => input.pauseQueued = true);
}
