/* ============================================================
   GABI'S GAMES — CONFIGURATION 🎀
   ============================================================
   This is the ONLY file you normally need to edit.

   1) TO ADD A NEW GAME: copy one { ... } block inside GAMES,
      change the details, and drop your game in a new folder
      under /games/. That's it — the Games page and Home page
      update automatically. No rebuilding!

   2) TO SET UP THE ONLINE LEADERBOARD: follow the steps in the
      LEADERBOARD section below (about 3 minutes).
   ============================================================ */

/* ---------- GAMES REGISTRY ---------- */
const GAMES = [
{
    id: "squishy-butter-escape",
    title: "Squishy Butter Escape",
    emoji: "🧈",
    thumb: null,
    description: "Help a squishy butter cube flap through dripping slime pillars! How far can you go?",
    tags: ["Arcade","Flappy","Cute"],
    link: "games/squishy-butter-escape/index.html",
    featured: true,
    hasLeaderboard: true
},

{
    id: "flower-merge",
    title: "Flower Merge",
    emoji: "🌸",
    thumb: null,
    description: "Merge adorable pastel flowers to grow the ultimate magical bloom!",
    tags: ["Merge","Relaxing","Cute"],
    link: "games/flower-merge/index.html",
    featured: true,
    hasLeaderboard: false
}
,{
       id: "slimeria",
       title: "Slimeria",
       emoji: "🧪",
       thumb: null,
       description: "Run your own dreamy slime shop! Pour glue, mix colors & add cute toppings before patience runs out. 💗",
       tags: ["Shop", "Kawaii"],
       link: "games/slimeria/index.html",
       featured: true,
       hasLeaderboard: true
     }
];

/* ---------- LEADERBOARD CONFIG ---------- */
/*
  We use JSONBin.io — a free JSON storage service. It was chosen because it is
  the only free option that works from a static HTTPS site (it supports HTTPS
  AND CORS AND browser writes). Honest limits: the free tier is a ONE-TIME
  ~10,000 requests and ~1 request/second. If you run out, make a new free bin
  (steps in README) or the game keeps working via the local fallback.

  ⏱ SETUP (about 3 minutes):
  1. Go to https://jsonbin.io and sign in (Google/GitHub — free).
  2. Click "CREATE BIN". Paste exactly this as the content, then save:
        { "scores": [] }
     Copy the BIN ID from the URL (the long code after /b/).
  3. Go to API Keys → copy your MASTER KEY (starts with $2a$...).
  4. Paste both below.
  5. (Recommended) In the bin settings, keep it PRIVATE so only your key
     can write, but note the key is still visible in the page source — see
     the anti-cheat notes in the README. This is a fun leaderboard, not a bank.

  Don't want an online leaderboard yet? Leave ENABLED:false and scores
  save to the player's own browser (localStorage) only.
*/
const LEADERBOARD = {
  ENABLED: true,                    // false = local-only (no online board)
  BIN_ID:  "PASTE_YOUR_BIN_ID_HERE",
  MASTER_KEY: "PASTE_YOUR_MASTER_KEY_HERE",
  API_BASE: "https://api.jsonbin.io/v3/b",
  MAX_ENTRIES: 100,                 // Top 100 shown
  // ---- Anti-cheat sanity thresholds (tune per game) ----
  MAX_PLAUSIBLE_SCORE: 100000,      // reject impossible scores
  MIN_MS_PER_POINT: 250             // must survive >=0.25s per point earned
};

// Expose to the other scripts
window.GABI = { GAMES, LEADERBOARD };
