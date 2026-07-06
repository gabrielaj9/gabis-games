/* ============================================================
   GABI'S GAMES — LEADERBOARD 🏆
   ------------------------------------------------------------
   - Saves scores to JSONBin.io (online) when configured
   - ALWAYS keeps a localStorage copy as a graceful fallback,
     so the game works even if the internet/service is down or
     the free request quota is used up.
   - Basic client-side anti-cheat. IMPORTANT & HONEST: this only
     deters CASUAL cheating. Because this is a static site with
     the key in the page, a determined person CAN submit fake
     scores. That's an accepted trade-off for a free, no-backend,
     zero-cost setup. See README "Anti-cheat limitations".
   ============================================================ */

const GabiLeaderboard = (() => {
  const cfg = window.GABI.LEADERBOARD;
  const LOCAL_KEY = "gabi_scores_local";

  /* ---------- NAME VALIDATION ---------- */
  // Light profanity filter (kept intentionally small/tasteful). Add words as needed.
  const BAD = ["badword1", "badword2"]; // 👈 edit this list to taste
  function cleanName(raw) {
    let n = (raw || "").trim().slice(0, 12);           // max 12 chars
    n = n.replace(/[^\p{L}\p{N} _\-.!♥🎀]/gu, "");      // letters/numbers/friendly symbols only
    if (!n) n = "Cutie";                               // default if empty
    const lower = n.toLowerCase();
    if (BAD.some(w => lower.includes(w))) n = "Cutie";
    return n;
  }

  /* ---------- ANTI-CHEAT SANITY CHECKS ---------- */
  function isPlausible(score, durationMs) {
    if (!Number.isFinite(score) || score < 0) return false;
    if (score > cfg.MAX_PLAUSIBLE_SCORE) return false;
    // Must have survived a minimum time per point (stops instant huge scores)
    if (score > 0 && durationMs < score * cfg.MIN_MS_PER_POINT) return false;
    return true;
  }
  // Light obfuscation of the payload (deters casual tampering only, NOT security)
  function obfuscate(obj) { return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))); }
  function checksum(entry) {  // simple tamper signal sent alongside the score
    const s = entry.name + "|" + entry.score + "|" + entry.game;
    let h = 0; for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
    return h;
  }
  // Client-side rate limit: one submit per 3s per browser
  function rateOk() {
    const last = +localStorage.getItem("gabi_last_submit") || 0;
    if (Date.now() - last < 3000) return false;
    localStorage.setItem("gabi_last_submit", Date.now());
    return true;
  }

  /* ---------- LOCAL STORAGE ---------- */
  function getLocal() { try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || []; } catch { return []; } }
  function saveLocal(entry) {
    const all = getLocal(); all.push(entry);
    all.sort((a, b) => b.score - a.score);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(all.slice(0, cfg.MAX_ENTRIES)));
  }

  /* ---------- ONLINE (JSONBin) ---------- */
  async function fetchOnline() {
    const res = await fetch(`${cfg.API_BASE}/${cfg.BIN_ID}/latest`, {
      headers: { "X-Master-Key": cfg.MASTER_KEY, "X-Bin-Meta": "false" }
    });
    if (!res.ok) throw new Error("read failed " + res.status);
    const data = await res.json();
    return Array.isArray(data.scores) ? data.scores : [];
  }
  async function pushOnline(entry) {
    const current = await fetchOnline();
    current.push(entry);
    current.sort((a, b) => b.score - a.score);
    const trimmed = current.slice(0, cfg.MAX_ENTRIES);
    const res = await fetch(`${cfg.API_BASE}/${cfg.BIN_ID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Master-Key": cfg.MASTER_KEY },
      body: JSON.stringify({ scores: trimmed })
    });
    if (!res.ok) throw new Error("write failed " + res.status);
    return trimmed;
  }

  /* ---------- PUBLIC API ---------- */
  // Submit a score. Returns { ok, online, board }.
  async function submit({ name, score, game, durationMs }) {
    name = cleanName(name);
    if (!isPlausible(score, durationMs)) return { ok: false, reason: "sanity" };
    if (!rateOk()) return { ok: false, reason: "rate" };

    const entry = { name, score: Math.floor(score), game, date: new Date().toISOString() };
    entry.sig = checksum(entry);          // tamper signal (see README)
    saveLocal(entry);                     // always keep local copy

    if (cfg.ENABLED && cfg.BIN_ID && !cfg.BIN_ID.startsWith("PASTE")) {
      try { const board = await pushOnline(entry); return { ok: true, online: true, board }; }
      catch (e) { console.warn("Leaderboard offline, used local:", e.message); }
    }
    return { ok: true, online: false, board: getLocal() };
  }

  // Get the board (online if possible, else local).
  async function get(game = null) {
    let board = [];
    if (cfg.ENABLED && cfg.BIN_ID && !cfg.BIN_ID.startsWith("PASTE")) {
      try { board = await fetchOnline(); } catch { board = getLocal(); }
    } else { board = getLocal(); }
    if (game) board = board.filter(e => e.game === game);
    return board.sort((a, b) => b.score - a.score).slice(0, cfg.MAX_ENTRIES);
  }

  return { submit, get, cleanName };
})();

window.GabiLeaderboard = GabiLeaderboard;
