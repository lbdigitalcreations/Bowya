/* ==========================================================================
   JIHIN JINO (CHAMATHU) 25TH BIRTHDAY - SHARED CORE LOGIC
   Web Audio Synthesizer, Starfield Canvas, Confetti & Navigation
   ========================================================================== */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.startOffset = 5; // Start playback from 5 seconds as requested
    
    // HTML5 Audio element for the background soundtrack
    this.audio = new Audio('song.mp3');
    this.audio.preload = 'auto';
    this.audio.loop = true;

    // Ensure currentTime starts from 5 seconds on load / canplay
    this.audio.addEventListener('loadedmetadata', () => {
      if (this.audio.currentTime < this.startOffset) {
        this.audio.currentTime = this.startOffset;
      }
    });

    this.audio.addEventListener('canplay', () => {
      if (this.audio.currentTime < this.startOffset) {
        this.audio.currentTime = this.startOffset;
      }
    });

    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.syncUI(true);
      sessionStorage.setItem('bgMusicState', 'playing');
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.syncUI(false);
      sessionStorage.setItem('bgMusicState', 'paused');
    });

    // When looping, loop back to 5 seconds
    this.audio.addEventListener('ended', () => {
      this.audio.currentTime = this.startOffset;
      this.audio.play().catch(e => console.warn('Audio loop error:', e));
    });

    // Save currentTime periodically so user experience stays continuous across navigation
    this.audio.addEventListener('timeupdate', () => {
      if (this.isPlaying && this.audio.currentTime >= this.startOffset) {
        sessionStorage.setItem('bgMusicTime', this.audio.currentTime);
      }
    });
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, duration = 250, type = 'sine') {
    if (!this.ctx) this.init();
    try {
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
    } catch (e) {
      console.warn('Audio tone error:', e);
    }
  }

  playPop() {
    if (!this.ctx) this.init();
    try {
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
    } catch (e) {
      console.warn('Audio pop error:', e);
    }
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
    this.init();
    try {
      const savedTime = parseFloat(sessionStorage.getItem('bgMusicTime'));
      if (!isNaN(savedTime) && savedTime >= this.startOffset) {
        this.audio.currentTime = savedTime;
      } else if (this.audio.currentTime < this.startOffset || this.audio.currentTime === 0) {
        this.audio.currentTime = this.startOffset;
      }
    } catch (e) {
      // If metadata not ready, listeners will position to 5s
    }

    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          if (this.audio.currentTime < this.startOffset) {
            this.audio.currentTime = this.startOffset;
          }
          this.isPlaying = true;
          this.syncUI(true);
        })
        .catch(err => {
          console.warn('Autoplay prevented by browser:', err);
          this.syncUI(false);
        });
    }
  }

  stopSong() {
    if (this.audio) {
      this.audio.pause();
    }
    this.isPlaying = false;
    this.syncUI(false);
  }

  syncUI(playing) {
    const dock = document.getElementById('audioDock');
    const icon = document.getElementById('audioIcon');
    if (dock) {
      if (playing) {
        dock.classList.add('playing');
      } else {
        dock.classList.remove('playing');
      }
    }
    if (icon) {
      icon.className = playing ? 'fa-solid fa-pause' : 'fa-solid fa-play';
    }
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

  // Seamlessly resume playback if music was active before page navigation
  if (sessionStorage.getItem('bgMusicState') === 'playing') {
    const resumeOnInteraction = () => {
      if (sound && !sound.isPlaying && sessionStorage.getItem('bgMusicState') === 'playing') {
        sound.startSong();
      }
      document.removeEventListener('click', resumeOnInteraction);
      document.removeEventListener('touchstart', resumeOnInteraction);
    };
    sound.startSong();
    document.addEventListener('click', resumeOnInteraction, { once: true });
    document.addEventListener('touchstart', resumeOnInteraction, { once: true });
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
    if (href === currentPath || (currentPath === '' && href === 'index.html') || (currentPath === 'letter-part2.html' && href === 'letter.html')) {
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
