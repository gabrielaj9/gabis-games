/* Procedural electronic audio. The game creates soft synth notes, impacts, and
   an adaptive pulse without loading external sound files. */
export class SquishAudio {
  constructor(save) {
    this.save = save;
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.step = 0;
    this.nextBeat = 0;
  }

  unlock() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.master.gain.value = this.save.settings.muted ? 0 : this.save.settings.volume;
    this.musicGain.gain.value = this.save.settings.music;
    this.musicGain.connect(this.master);
    this.master.connect(this.ctx.destination);
  }

  applySettings() {
    if (!this.master) return;
    this.master.gain.value = this.save.settings.muted ? 0 : this.save.settings.volume;
    this.musicGain.gain.value = this.save.settings.music;
  }

  tone(freq, dur = 0.12, type = "sine", gain = 0.16, out = this.master) {
    if (!this.ctx || !out) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(gain, now + 0.015);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(amp);
    amp.connect(out);
    osc.start(now);
    osc.stop(now + dur + 0.03);
  }

  noise(dur = 0.12, gain = 0.1) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = this.ctx.createBufferSource();
    const amp = this.ctx.createGain();
    src.buffer = buffer;
    amp.gain.value = gain;
    src.connect(amp);
    amp.connect(this.master);
    src.start(now);
  }

  jump() {
    this.tone(520, 0.12, "triangle", 0.12);
    this.tone(780, 0.1, "sine", 0.08);
  }

  collect() {
    this.tone(880, 0.08, "sine", 0.11);
    this.tone(1320, 0.1, "triangle", 0.06);
  }

  power() {
    this.tone(360, 0.1, "sawtooth", 0.08);
    this.tone(720, 0.18, "sine", 0.1);
  }

  land() {
    this.noise(0.08, 0.06);
    this.tone(160, 0.08, "triangle", 0.06);
  }

  hit() {
    this.noise(0.16, 0.12);
    this.tone(110, 0.22, "sawtooth", 0.09);
  }

  tickMusic(speed) {
    if (!this.ctx || !this.musicGain || this.save.settings.muted) return;
    const now = this.ctx.currentTime;
    if (now < this.nextBeat) return;
    const tempo = 0.36 - Math.min(0.14, speed * 0.00038);
    const scale = [220, 277, 330, 440, 554, 660];
    const note = scale[this.step % scale.length] * (this.step % 8 === 7 ? 2 : 1);
    this.tone(note, 0.08, this.step % 4 === 0 ? "triangle" : "sine", 0.035, this.musicGain);
    this.tone(note / 2, 0.16, "sine", 0.02, this.musicGain);
    this.step += 1;
    this.nextBeat = now + tempo;
  }
}
