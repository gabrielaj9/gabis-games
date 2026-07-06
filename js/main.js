/* ============================================================
   GABI'S GAMES — SITE SCRIPT ✨
   Handles: loader hide, mobile nav, mute button, sparkles,
   scroll reveals, and auto-building game cards from config.js.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  /* ---- Hide the cute loader once everything is ready ---- */
  window.addEventListener("load", () => {
    const l = document.getElementById("loader");
    if (l) setTimeout(() => l.classList.add("hidden"), 500);
  });

  /* ---- Mobile nav toggle ---- */
  const toggle = document.querySelector(".nav__toggle");
  const links = document.querySelector(".nav__links");
  if (toggle) toggle.addEventListener("click", () => links.classList.toggle("open"));

  /* ---- Mute button (shared engine, persists via localStorage) ---- */
  const muteBtn = document.querySelector(".mute-btn");
  if (muteBtn) {
    const paint = () => (muteBtn.textContent = GabiAudio.isMuted() ? "🔇" : "🔊");
    paint();
    muteBtn.addEventListener("click", () => { GabiAudio.toggleMute(); paint(); GabiAudio.sfx.click(); });
  }

  /* ---- Resume audio + start gentle music on first interaction ---- */
  const kick = () => {
    GabiAudio.unlock();
    if (!GabiAudio.isMuted()) GabiAudio.startMusic();
    window.removeEventListener("pointerdown", kick);
    window.removeEventListener("keydown", kick);
  };
  window.addEventListener("pointerdown", kick);
  window.addEventListener("keydown", kick);

  /* ---- Play a click sound on every button ---- */
  document.querySelectorAll(".btn, .nav__links a").forEach(b =>
    b.addEventListener("click", () => GabiAudio.sfx.click()));

  /* ---- Sparkles in the hero (created with JS, animated with CSS) ---- */
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

  /* ---- Reveal-on-scroll (IntersectionObserver = performant) ---- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));

  /* ---- Auto-build game cards from config.js ---- */
  buildCards();
});

function buildCards() {
  const { GAMES } = window.GABI;
  // Home page featured grid
  const featWrap = document.getElementById("featured-cards");
  if (featWrap) renderCards(featWrap, GAMES.filter(g => g.featured));
  // Games page — all games
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
  // re-observe the freshly-added reveal elements
  const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add("visible")), { threshold: 0.1 });
  wrap.querySelectorAll(".reveal").forEach(el => io.observe(el));
}
