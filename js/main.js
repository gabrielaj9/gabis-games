/* ============================================================
   GABI'S GAMES — SITE SCRIPT ✨
   Handles: loader hide, mobile nav, mute button, sparkles,
   scroll reveals, and auto-building game cards from config.js.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  window.addEventListener("load", () => {
    const l = document.getElementById("loader");
    if (l) setTimeout(() => l.classList.add("hidden"), 500);
  });

  const toggle = document.querySelector(".nav__toggle");
  const links = document.querySelector(".nav__links");
  if (toggle && links) toggle.addEventListener("click", () => links.classList.toggle("open"));

  const muteBtn = document.querySelector(".mute-btn");
  if (muteBtn && window.GabiAudio) {
    const paint = () => (muteBtn.textContent = GabiAudio.isMuted() ? "🔇" : "🔊");
    paint();
    muteBtn.addEventListener("click", () => {
      GabiAudio.toggleMute();
      paint();
      GabiAudio.sfx.click();
    });
  }

  const kick = () => {
    if (!window.GabiAudio) return;
    GabiAudio.unlock();
    if (!GabiAudio.isMuted()) GabiAudio.startMusic();
    window.removeEventListener("pointerdown", kick);
    window.removeEventListener("keydown", kick);
  };
  window.addEventListener("pointerdown", kick);
  window.addEventListener("keydown", kick);

  document.querySelectorAll(".btn, .nav__links a").forEach(b =>
    b.addEventListener("click", () => window.GabiAudio && GabiAudio.sfx.click()));

  const hero = document.querySelector(".hero");
  if (hero) {
    for (let i = 0; i < 14; i++) {
      const s = document.createElement("div");
      s.className = "sparkle";
      s.style.left = Math.random() * 100 + "%";
      s.style.top = Math.random() * 100 + "%";
      s.style.animationDelay = Math.random() * 2.4 + "s";
      hero.appendChild(s);
    }
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));

  buildCards();
});

const FALLBACK_GAMES = [
  {
    id: "squishy-butter-escape",
    title: "Squishy Butter Escape",
    emoji: "🧈",
    thumb: null,
    description: "Help a squishy butter cube flap through dripping slime pillars! How far can you go?",
    tags: ["Arcade", "Flappy", "Cute"],
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
    tags: ["Merge", "Relaxing", "Cute"],
    link: "games/flower-merge/index.html",
    featured: true,
    hasLeaderboard: false
  },
  {
    id: "slimeria",
    title: "Slimeria",
    emoji: "🧪",
    thumb: null,
    description: "Run your own dreamy slime shop! Pour glue, mix colors & add cute toppings before patience runs out. 💗",
    tags: ["Shop", "Kawaii"],
    link: "games/slimeria/index.html",
    featured: true,
    hasLeaderboard: true
  },
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

function buildCards() {
  const GAMES = window.GABI?.GAMES || FALLBACK_GAMES;

  const featWrap = document.getElementById("featured-cards");
  if (featWrap) renderCards(featWrap, GAMES.filter(g => g.featured));

  const allWrap = document.getElementById("all-cards");
  if (allWrap) renderCards(allWrap, GAMES);
}

function renderCards(wrap, list) {
  wrap.innerHTML = list.map(g => `
    <a class="card reveal" href="${g.link}">
      <div class="card__thumb">${g.thumb ? `<img src="${g.thumb}" alt="${g.title}" style="width:100%;height:100%;object-fit:cover">` : g.emoji}</div>
      <div class="card__body">
        ${g.tags?.[0] ? `<span class="badge">${g.tags[0]}</span>` : ""}
        <h3>${g.title}</h3>
        <p>${g.description}</p>
        <span class="btn btn--ghost">Play ▸</span>
      </div>
    </a>`).join("");

  const io = new IntersectionObserver(es =>
    es.forEach(e => e.isIntersecting && e.target.classList.add("visible")),
    { threshold: 0.1 }
  );
  wrap.querySelectorAll(".reveal").forEach(el => io.observe(el));
}
