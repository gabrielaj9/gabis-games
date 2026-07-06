/* ============================================================
   GABI'S GAMES — AUDIO ENGINE 🎵
   ------------------------------------------------------------
   ALL sound is generated in code with the Web Audio API.
   No audio files, no downloads, no licensing worries!

   - Cute chiptune / music-box background loop (major key)
   - SFX: flap/boing, score chime, game over, button click
   - Mute toggle that remembers your choice (localStorage)
   - Handles browser autoplay rules: the AudioContext starts
     "suspended" and we resume() it on the first user tap/click.
   ============================================================ */

const GabiAudio = (() => {
  let ctx = null;                 // the AudioContext (created lazily)
  let masterGain = null;          // master volume node
  let musicTimer = null;          // interval id for the melody scheduler
  let musicOn = false;
  let muted = localStorage.getItem("gabi_muted") === "true";

  /* Create the context the first time we need it. */
  function ensureCtx() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = muted ? 0 : 0.5;
    masterGain.connect(ctx.destination);
  }

  /* Autoplay policy: must resume on a user gesture. Call this from any
     first click/keypress/touch (main.js and the game both call it). */
  function unlock() {
    ensureCtx();
    if (ctx.state === "suspended") ctx.resume();
  }

  /* Play a single tone with a soft attack/decay envelope. */
  function tone({ freq = 440, type = "triangle", dur = 0.2, vol = 0.3, when = 0, glideTo = null }) {
    if (!ctx) return;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t + dur); // for boing/flap
    // Envelope: quick fade in, smooth fade out (avoids clicks)
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(masterGain);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  /* ---------- SOUND EFFECTS ---------- */
  const sfx = {
    flap()  { unlock(); tone({ freq: 520, glideTo: 300, type: "sine",     dur: 0.14, vol: 0.25 }); }, // cute boing
    score() { unlock(); tone({ freq: 880, type: "triangle", dur: 0.12, vol: 0.3 });
              tone({ freq: 1320, type: "triangle", dur: 0.14, vol: 0.25, when: 0.09 }); },            // chime up
    click() { unlock(); tone({ freq: 660, type: "square", dur: 0.06, vol: 0.18 }); },
    over()  { unlock();                                                                                // sad descending
              [660, 550, 440, 330].forEach((f, i) => tone({ freq: f, type: "triangle", dur: 0.22, vol: 0.28, when: i * 0.16 })); }
  };

  /* ---------- BACKGROUND MUSIC ----------
     A short, cheerful looping melody in C major, played on a soft
     triangle "music box" voice with a gentle bass note underneath. */
  const NOTE = { C4:261.63, D4:293.66, E4:329.63, F4:349.23, G4:392.0, A4:440.0, B4:493.88, C5:523.25, G3:196.0, C3:130.81 };
  const MELODY = [ // [note, beats]
    ["E4",1],["G4",1],["C5",1],["G4",1],["A4",1],["G4",1],["E4",2],
    ["F4",1],["A4",1],["C5",1],["A4",1],["G4",1],["E4",1],["C4",2]
  ];
  const BASS = ["C3","G3","C3","G3","F4","C3","G3","C3"];

  function startMusic() {
    unlock();
    if (musicOn) return;
    musicOn = true;
    const beat = 0.34;                 // seconds per beat (tempo)
    let i = 0, b = 0;
    const loopLen = MELODY.reduce((s, n) => s + n[1], 0) * beat;

    function schedule() {
      let when = 0;
      MELODY.forEach(([n, len]) => {
        tone({ freq: NOTE[n], type: "triangle", dur: beat * len * 0.9, vol: 0.16, when });
        when += beat * len;
      });
      BASS.forEach((n, k) => tone({ freq: NOTE[n], type: "sine", dur: beat * 1.8, vol: 0.1, when: k * beat * 2 }));
    }
    schedule();
    musicTimer = setInterval(() => { if (musicOn) schedule(); }, loopLen * 1000);
  }
  function stopMusic() { musicOn = false; clearInterval(musicTimer); }

  /* ---------- MUTE ---------- */
  function toggleMute() {
    muted = !muted;
    localStorage.setItem("gabi_muted", muted);
    if (masterGain) masterGain.gain.value = muted ? 0 : 0.5;
    return muted;
  }
  function isMuted() { return muted; }

  return { unlock, sfx, startMusic, stopMusic, toggleMute, isMuted };
})();

window.GabiAudio = GabiAudio;
