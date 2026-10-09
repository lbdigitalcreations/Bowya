/* ==========================================================================
   JIBIN'S 25TH BIRTHDAY MINI-GAMES - SOUND ENGINE
   Web Audio API Synthesizer (Zero asset dependency, zero 404s, instant response)
   ========================================================================== */

class ArcadeSoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = ArcadeStorage.isSoundMuted();
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  isMuted() {
    return this.muted;
  }

  setMuted(muteState) {
    this.muted = !!muteState;
    ArcadeStorage.setSoundMuted(this.muted);
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  playTone(freq, duration = 150, type = 'sine', gainVal = 0.2) {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration / 1000);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration / 1000);
    } catch (e) {
      console.warn('Audio tone error:', e);
    }
  }

  click() {
    this.playTone(600, 40, 'triangle', 0.15);
  }

  cardFlip() {
    this.playTone(320, 80, 'sine', 0.2);
  }

  match() {
    if (this.muted) return;
    this.playTone(523.25, 120, 'triangle', 0.2); // C5
    setTimeout(() => this.playTone(659.25, 200, 'triangle', 0.25), 90); // E5
  }

  wrong() {
    if (this.muted) return;
    this.playTone(200, 150, 'sawtooth', 0.15);
    setTimeout(() => this.playTone(160, 200, 'sawtooth', 0.15), 100);
  }

  presentPop() {
    if (this.muted) return;
    this.playTone(580, 80, 'triangle', 0.3);
  }

  goldenPop() {
    if (this.muted) return;
    const notes = [659.25, 830.61, 987.77, 1318.51];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 160, 'sine', 0.25), i * 50);
    });
  }

  bombExplode() {
    if (this.muted) return;
    this.playTone(120, 250, 'sawtooth', 0.3);
  }

  combo(multiplier = 2) {
    if (this.muted) return;
    const baseFreq = 440 * (1 + multiplier * 0.15);
    this.playTone(baseFreq, 140, 'triangle', 0.25);
    setTimeout(() => this.playTone(baseFreq * 1.25, 180, 'sine', 0.3), 80);
  }

  keypadClick() {
    this.playTone(850, 50, 'sine', 0.2);
  }

  chestUnlock() {
    if (this.muted) return;
    const sequence = [440, 554.37, 659.25, 880];
    sequence.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 250, 'triangle', 0.25), i * 110);
    });
  }

  fanfare() {
    if (this.muted) return;
    const notes = [
      { f: 523.25, d: 150 }, // C5
      { f: 659.25, d: 150 }, // E5
      { f: 783.99, d: 180 }, // G5
      { f: 1046.50, d: 450 } // C6
    ];
    notes.forEach((n, idx) => {
      setTimeout(() => this.playTone(n.f, n.d, 'triangle', 0.3), idx * 140);
    });
  }
}

const ArcadeSound = new ArcadeSoundEngine();
window.ArcadeSound = ArcadeSound;
