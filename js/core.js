/* ==========================================================================
   JIHIN JINO (CHAMATHU) 25TH BIRTHDAY - SHARED CORE LOGIC
   Web Audio Synthesizer, Starfield Canvas, Confetti & Navigation
   ========================================================================== */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.songTimer = null;
    this.noteIndex = 0;
    
    this.melody = [
      { f: 261.63, d: 350 }, { f: 261.63, d: 200 }, { f: 293.66, d: 500 }, { f: 261.63, d: 500 }, { f: 349.23, d: 500 }, { f: 329.63, d: 900 },
      { f: 261.63, d: 350 }, { f: 261.63, d: 200 }, { f: 293.66, d: 500 }, { f: 261.63, d: 500 }, { f: 392.00, d: 500 }, { f: 349.23, d: 900 },
      { f: 261.63, d: 350 }, { f: 261.63, d: 200 }, { f: 523.25, d: 500 }, { f: 440.00, d: 500 }, { f: 349.23, d: 500 }, { f: 329.63, d: 500 }, { f: 293.66, d: 700 },
      { f: 466.16, d: 350 }, { f: 466.16, d: 200 }, { f: 440.00, d: 500 }, { f: 349.23, d: 500 }, { f: 392.00, d: 500 }, { f: 349.23, d: 1100 }
    ];
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, duration = 250, type = 'sine') {
    if (!this.ctx) this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration / 1000);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration / 1000);
  }

  playPop() {
    if (!this.ctx) this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playWinFanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((n, i) => {
      setTimeout(() => this.playTone(n, 400, 'triangle'), i * 140);
    });
  }

  toggleSong() {
    this.init();
    if (this.isPlaying) {
      this.stopSong();
    } else {
      this.startSong();
    }
  }

  startSong() {
    this.isPlaying = true;
    const dock = document.getElementById('audioDock');
    const icon = document.getElementById('audioIcon');
    if (dock) dock.classList.add('playing');
    if (icon) icon.className = 'fa-solid fa-pause';
    this.stepMelody();
  }

  stepMelody() {
    if (!this.isPlaying) return;
    const note = this.melody[this.noteIndex];
    this.playTone(note.f, note.d * 0.9, 'sine');

    this.songTimer = setTimeout(() => {
      this.noteIndex = (this.noteIndex + 1) % this.melody.length;
      this.stepMelody();
    }, note.d);
  }

  stopSong() {
    this.isPlaying = false;
    clearTimeout(this.songTimer);
    const dock = document.getElementById('audioDock');
    const icon = document.getElementById('audioIcon');
    if (dock) dock.classList.remove('playing');
    if (icon) icon.className = 'fa-solid fa-play';
  }
}

const sound = new AudioEngine();

// Confetti blast helper
function launchConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 130,
      spread: 85,
      origin: { y: 0.6 },
      colors: ['#a855f7', '#ec4899', '#f43f5e', '#fbbf24', '#38bdf8']
    });
  }
}

// QR Code modal helper
function openQrModal() {
  const qr = document.getElementById('qrModal');
  if (qr) qr.classList.add('open');
}

function closeQrModal() {
  const qr = document.getElementById('qrModal');
  if (qr) qr.classList.remove('open');
}

// Global initialization on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Wire audio toggle button
  const toggleBtn = document.getElementById('toggleAudioBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => sound.toggleSong());
  }

  // Wire QR button
  const openQr = document.getElementById('openQrBtn');
  if (openQr) {
    openQr.addEventListener('click', openQrModal);
  }

  // Wire confetti blast button
  const blastBtn = document.getElementById('blastConfettiBtn');
  if (blastBtn) {
    blastBtn.addEventListener('click', () => {
      sound.playWinFanfare();
      launchConfetti();
    });
  }

  // Highlight active navbar link
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // Setup Space Canvas
  const spaceCanvas = document.getElementById('spaceCanvas');
  if (spaceCanvas) {
    const sCtx = spaceCanvas.getContext('2d');
    let stars = [];

    function resizeSpace() {
      spaceCanvas.width = window.innerWidth;
      spaceCanvas.height = window.innerHeight;
      stars = Array.from({ length: 85 }, () => ({
        x: Math.random() * spaceCanvas.width,
        y: Math.random() * spaceCanvas.height,
        radius: Math.random() * 1.8 + 0.4,
        alpha: Math.random(),
        speed: Math.random() * 0.015 + 0.005
      }));
    }

    window.addEventListener('resize', resizeSpace);
    resizeSpace();

    function drawStars() {
      sCtx.clearRect(0, 0, spaceCanvas.width, spaceCanvas.height);
      stars.forEach(st => {
        st.alpha += st.speed;
        if (st.alpha > 1 || st.alpha < 0.1) st.speed = -st.speed;
        sCtx.beginPath();
        sCtx.arc(st.x, st.y, st.radius, 0, Math.PI * 2);
        sCtx.fillStyle = `rgba(255, 255, 255, ${Math.abs(st.alpha)})`;
        sCtx.fill();
      });
      requestAnimationFrame(drawStars);
    }
    drawStars();
  }
});
