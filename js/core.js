/* ==========================================================================
   JIHIN JINO (CHAMATHU) 25TH BIRTHDAY - SHARED CORE LOGIC
   Web Audio Synthesizer, Mobile-Optimized Soundtrack Engine,
   Starfield Canvas, Confetti & Navigation
   ========================================================================== */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.startOffset = 5; // Start playback from 5 seconds
    this.audioUnlocked = false;

    // Set up or reuse the DOM audio element for rock-solid mobile compatibility
    this.audio = this.setupAudioElement();
    this.bindAudioEvents();
  }

  setupAudioElement() {
    let el = document.getElementById('bgAudioElement');
    if (!el) {
      el = document.createElement('audio');
      el.id = 'bgAudioElement';
      el.src = 'song.mp3';
      el.preload = 'auto';
      el.loop = true;
      el.setAttribute('playsinline', '');
      el.setAttribute('webkit-playsinline', '');
      el.style.display = 'none';
      if (document.body) {
        document.body.appendChild(el);
      } else {
        document.addEventListener('DOMContentLoaded', () => {
          if (!document.getElementById('bgAudioElement')) {
            document.body.appendChild(el);
          }
        });
      }
    }
    el.volume = 1.0;
    return el;
  }

  bindAudioEvents() {
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.syncUI(true);
      sessionStorage.setItem('bgMusicState', 'playing');
      sessionStorage.removeItem('bgMusicUserPaused');
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.syncUI(false);
      if (sessionStorage.getItem('bgMusicUserPaused') === 'true') {
        sessionStorage.setItem('bgMusicState', 'paused');
      }
    });

    // Seamless loop back to startOffset (5 seconds)
    this.audio.addEventListener('ended', () => {
      try {
        this.audio.currentTime = this.startOffset;
      } catch (e) {}
      this.audio.play().catch(e => console.warn('Audio loop play prevented:', e));
    });

    // Track currentTime across navigation
    this.audio.addEventListener('timeupdate', () => {
      if (this.isPlaying && this.audio.currentTime >= this.startOffset) {
        sessionStorage.setItem('bgMusicTime', this.audio.currentTime);
      }
    });
  }

  // Wakes up WebAudio AudioContext and unlocks mobile Safari audio subsystem
  unlock() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    // Play a 1-sample silent buffer to unlock iOS Safari WebAudio hardware
    if (this.ctx && !this.audioUnlocked) {
      try {
        const buffer = this.ctx.createBuffer(1, 1, 22050);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.start(0);
        this.audioUnlocked = true;
      } catch (e) {}
    }
  }

  init() {
    this.unlock();
  }

  playTone(freq, duration = 250, type = 'sine') {
    this.unlock();
    if (!this.ctx) return;
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
    this.unlock();
    if (!this.ctx) return;
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
    this.unlock();
    if (this.isPlaying) {
      sessionStorage.setItem('bgMusicUserPaused', 'true');
      sessionStorage.setItem('bgMusicState', 'paused');
      this.stopSong();
    } else {
      sessionStorage.removeItem('bgMusicUserPaused');
      sessionStorage.setItem('bgMusicState', 'playing');
      this.startSong();
    }
  }

  startSong() {
    this.unlock();

    // Determine target offset safely
    const savedTime = parseFloat(sessionStorage.getItem('bgMusicTime'));
    const targetTime = (!isNaN(savedTime) && savedTime >= this.startOffset) ? savedTime : this.startOffset;

    // Mobile safe seek helper: ONLY seek when readyState >= 1 to prevent mobile abort errors
    const safeSeek = () => {
      try {
        if (this.audio.readyState >= 1 && (this.audio.currentTime < this.startOffset - 0.5 || Math.abs(this.audio.currentTime - targetTime) > 0.5)) {
          this.audio.currentTime = targetTime;
        }
      } catch (e) {
        console.warn('Deferred seek notice:', e);
      }
    };

    if (this.audio.readyState >= 1) {
      safeSeek();
    } else {
      const onReady = () => {
        safeSeek();
        this.audio.removeEventListener('loadedmetadata', onReady);
        this.audio.removeEventListener('canplay', onReady);
      };
      this.audio.addEventListener('loadedmetadata', onReady, { once: true });
      this.audio.addEventListener('canplay', onReady, { once: true });
    }

    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isPlaying = true;
          this.syncUI(true);
          sessionStorage.setItem('bgMusicState', 'playing');
          sessionStorage.removeItem('bgMusicUserPaused');

          // Ensure audio starts from 5s on mobile if started from 0
          if (this.audio.currentTime < this.startOffset - 0.2) {
            safeSeek();
          }
        })
        .catch(err => {
          console.warn('Autoplay waiting for mobile user touch:', err);
          this.isPlaying = false;
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
  // Wire floating audio dock (tapping button, text or waves toggles audio)
  const audioDock = document.getElementById('audioDock');
  if (audioDock) {
    let lastToggle = 0;
    const handleDockToggle = (e) => {
      e.stopPropagation();
      const now = Date.now();
      if (now - lastToggle < 350) return; // Debounce mobile ghost clicks
      lastToggle = now;
      sound.toggleSong();
    };

    audioDock.addEventListener('click', handleDockToggle);
    audioDock.addEventListener('touchend', handleDockToggle, { passive: true });
  }

  // Mobile & Global Autoplay Unlock:
  // If user hasn't explicitly clicked pause, the first interaction starts the song seamlessly
  const unlockAndPlay = () => {
    if (sessionStorage.getItem('bgMusicUserPaused') === 'true') return;
    if (!sound.isPlaying) {
      sound.unlock();
      sound.startSong();
    }
  };

  // Attempt immediate playback (works on desktop or continued browsing)
  if (sessionStorage.getItem('bgMusicUserPaused') !== 'true') {
    sound.startSong();
  }

  // One-time gesture listener to unlock on mobile (touches, taps, scrolls)
  window.addEventListener('click', unlockAndPlay, { once: true });
  window.addEventListener('touchstart', unlockAndPlay, { once: true, passive: true });
  window.addEventListener('touchend', unlockAndPlay, { once: true, passive: true });

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

  // Highlight active navbar link (including letter-part2.html)
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
