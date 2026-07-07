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
    hasLeaderboard: true
}
,{
    id: "2048",
    title: "2048",
    emoji: "🧋",
    thumb: null,
    description: "Slide and merge kawaii animals, boba treats, and cosmic cuties on 4x4, 5x5, or 6x6 boards.",
    tags: ["Puzzle", "Merge", "Kawaii"],
    link: "games/2048/index.html",
    featured: true,
    hasLeaderboard: true
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
   ,
{
    id: "frog-kingdom",
    title: "Frog Kingdom",
    emoji: "🐸",
    thumb: null,
    description: "Build a cozy frog civilization with ponds, lily pads, restaurants, libraries, festivals, and a royal castle.",
    tags: ["Cozy", "Simulation", "Strategy"],
    link: "games/frog-kingdom/index.html",
    featured: true,
    hasLeaderboard: true
},
{
    id: "peaceful-pond",
    title: "Peaceful Pond",
    emoji: "🐰",
    thumb: null,
    description: "Fish with a sweet bunny in a pastel pond, catch kawaii fish, and upgrade rods, lines, and lures.",
    tags: ["Fishing", "Cozy", "Kawaii"],
    link: "games/peaceful-pond/index.html",
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
    ENABLED: true,
    BIN_ID: "6a4c81d4f5f4af5e296a6bcb",
    MASTER_KEY: "$2a$10$MVzA/PbutT74Y9ZE6uvWqeTysGBit9iFf0srv6SFMl6IEKED6smfm",
    API_BASE: "https://api.jsonbin.io/v3/b",
    MAX_ENTRIES: 100,
    MAX_PLAUSIBLE_SCORE: 100000,
    MIN_MS_PER_POINT: 250
};

// Expose to the other scripts
window.GABI = { GAMES, LEADERBOARD };
