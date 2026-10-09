/* ==========================================================================
   GAME ONE: BIRTHDAY MEMORY MATCH
   Clean state management, timer control, hint support & responsive board
   ========================================================================== */

const MemoryMatchGame = {
  SYMBOLS: [
    { icon: '🎂', label: 'Birthday Cake' },
    { icon: '🎁', label: 'Gift Box' },
    { icon: '👑', label: 'King Crown' },
    { icon: '🎈', label: 'Party Balloon' },
    { icon: '⭐', label: 'Golden Star' },
    { icon: '🥳', label: 'Party Hat' },
    { icon: '🕯️', label: 'Birthday Candle' },
    { icon: '🗝️', label: 'Golden Key' }
  ],

  DIFFICULTIES: {
    easy: { pairs: 4, time: 60, cols: 4, name: 'Easy' },
    medium: { pairs: 6, time: 50, cols: 4, name: 'Medium' },
    hard: { pairs: 8, time: 45, cols: 4, name: 'Hard' }
  },

  currentDifficulty: 'medium',
  cards: [],
  flippedCards: [],
  matchedPairs: 0,
  moves: 0,
  timeLeft: 50,
  timerInterval: null,
  isEvaluating: false,
  isPlaying: false,
  hintUsed: false,

  init() {
    this.bindEvents();
  },

  bindEvents() {
    // Difficulty buttons
    document.querySelectorAll('#memDifficultyBar .diff-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const diff = e.currentTarget.dataset.diff;
        if (diff && this.DIFFICULTIES[diff]) {
          this.setDifficulty(diff);
        }
      });
    });

    // Hint button
    const hintBtn = document.getElementById('memHintBtn');
    if (hintBtn) {
      hintBtn.addEventListener('click', () => this.useHint());
    }

    // Restart button
    const restartBtn = document.getElementById('memRestartBtn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => this.start(this.currentDifficulty));
    }
  },

  setDifficulty(diff) {
    this.currentDifficulty = diff;
    document.querySelectorAll('#memDifficultyBar .diff-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.diff === diff);
    });
    this.start(diff);
  },

  start(difficulty = this.currentDifficulty) {
    this.cleanup();
    this.isPlaying = true;
    this.currentDifficulty = difficulty;
    const config = this.DIFFICULTIES[difficulty];

    this.timeLeft = config.time;
    this.moves = 0;
    this.matchedPairs = 0;
    this.flippedCards = [];
    this.isEvaluating = false;
    this.hintUsed = false;

    // Reset UI
    this.updateStatsUI();
    this.hideOverlay();

    const hintBtn = document.getElementById('memHintBtn');
    if (hintBtn) {
      hintBtn.disabled = false;
      hintBtn.style.opacity = '1';
    }

    // Build deck
    const selectedSymbols = this.SYMBOLS.slice(0, config.pairs);
    const deck = [...selectedSymbols, ...selectedSymbols];
    this.shuffle(deck);

    // Render board
    const grid = document.getElementById('memoryGrid');
    if (!grid) return;

    grid.className = `memory-grid ${difficulty}`;
    grid.innerHTML = '';

    deck.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'mem-card';
      card.dataset.index = index;
      card.dataset.symbol = item.icon;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', 'Card ' + (index + 1));
      card.innerHTML = `
        <div class="mem-card-inner">
          <div class="mem-front">✨</div>
          <div class="mem-back">${item.icon}</div>
        </div>
      `;
      card.addEventListener('click', () => this.handleCardTap(card));
      grid.appendChild(card);
    });

    // Start timer
    this.startTimer();
  },

  startTimer() {
    clearInterval(this.timerInterval);
    const timerElem = document.getElementById('memTimerVal');
    const timerPill = document.getElementById('memTimerPill');

    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (timerElem) timerElem.textContent = this.timeLeft;

      if (this.timeLeft <= 10 && timerPill) {
        timerPill.classList.add('urgent');
      }

      if (this.timeLeft <= 0) {
        this.gameOver();
      }
    }, 1000);
  },

  handleCardTap(card) {
    if (!this.isPlaying || this.isEvaluating) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
    if (this.flippedCards.length >= 2) return;

    // Flip card
    card.classList.add('flipped');
    ArcadeSound.cardFlip();
    this.flippedCards.push(card);

    if (this.flippedCards.length === 2) {
      this.moves++;
      this.updateStatsUI();
      this.evaluatePair();
    }
  },

  evaluatePair() {
    this.isEvaluating = true;
    const [c1, c2] = this.flippedCards;
    const isMatch = c1.dataset.symbol === c2.dataset.symbol;

    if (isMatch) {
      setTimeout(() => {
        c1.classList.add('matched');
        c2.classList.add('matched');
        this.matchedPairs++;
        this.flippedCards = [];
        this.isEvaluating = false;
        ArcadeSound.match();
        this.updateStatsUI();

        const totalPairs = this.DIFFICULTIES[this.currentDifficulty].pairs;
        if (this.matchedPairs === totalPairs) {
          this.victory();
        }
      }, 350);
    } else {
      ArcadeSound.wrong();
      setTimeout(() => {
        c1.classList.remove('flipped');
        c2.classList.remove('flipped');
        this.flippedCards = [];
        this.isEvaluating = false;
      }, 850);
    }
  },

  useHint() {
    if (!this.isPlaying || this.hintUsed || this.isEvaluating) return;
    this.hintUsed = true;
    const hintBtn = document.getElementById('memHintBtn');
    if (hintBtn) {
      hintBtn.disabled = true;
      hintBtn.style.opacity = '0.5';
    }

    ArcadeSound.goldenPop();
    const unmatchedCards = document.querySelectorAll('.mem-card:not(.matched)');
    unmatchedCards.forEach(c => c.classList.add('flipped'));

    setTimeout(() => {
      unmatchedCards.forEach(c => {
        if (!this.flippedCards.includes(c)) {
          c.classList.remove('flipped');
        }
      });
    }, 1200);
  },

  calculateScore() {
    const totalPairs = this.DIFFICULTIES[this.currentDifficulty].pairs;
    const baseScore = totalPairs * 120;
    const timeBonus = this.timeLeft * 25;
    const movePenalty = Math.max(0, (this.moves - totalPairs) * 8);
    return Math.max(100, Math.round(baseScore + timeBonus - movePenalty));
  },

  victory() {
    this.cleanup();
    const finalScore = this.calculateScore();
    const isNewBest = ArcadeStorage.saveMemoryBest(this.currentDifficulty, finalScore, this.moves, this.timeLeft);

    ArcadeSound.fanfare();
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FFD166', '#F04491', '#7138D4', '#FFFFFF']
      });
    }

    if (window.ArcadeHub) {
      ArcadeHub.refreshScoresUI();
    }

    this.showOverlay({
      icon: '🏆',
      title: 'Birthday Legend Match!',
      subtitle: `Matched all pairs in ${this.DIFFICULTIES[this.currentDifficulty].name} mode!`,
      stats: [
        { label: 'Score', value: finalScore + ' pts' },
        { label: 'Moves', value: this.moves },
        { label: 'Time Left', value: this.timeLeft + 's' }
      ],
      isRecord: isNewBest
    });
  },

  gameOver() {
    this.cleanup();
    ArcadeSound.wrong();
    this.showOverlay({
      icon: '⏰',
      title: 'Time Expired!',
      subtitle: `Don't give up! Jihin (Chamathu)'s memory skills can conquer this!`,
      stats: [
        { label: 'Pairs Found', value: `${this.matchedPairs}/${this.DIFFICULTIES[this.currentDifficulty].pairs}` },
        { label: 'Moves Made', value: this.moves }
      ],
      isRecord: false
    });
  },

  showOverlay({ icon, title, subtitle, stats, isRecord }) {
    const overlay = document.getElementById('memOverlay');
    if (!overlay) return;

    let statsHtml = stats.map(s => `
      <div class="result-stat-pill">
        <div class="result-stat-lbl">${s.label}</div>
        <div class="result-stat-num">${s.value}</div>
      </div>
    `).join('');

    overlay.innerHTML = `
      <div class="result-badge-icon">${icon}</div>
      <h2 class="result-title">${title}</h2>
      <p class="result-subtitle">${subtitle}</p>
      ${isRecord ? '<div class="result-record-pill"><i class="fa-solid fa-crown"></i> ★ New Personal Best! ★</div>' : ''}
      <div class="result-stats-row">${statsHtml}</div>
      <div class="result-btn-row">
        <button class="btn-main btn-primary" onclick="MemoryMatchGame.start('${this.currentDifficulty}')">
          <i class="fa-solid fa-rotate-right"></i> Play Again
        </button>
        <button class="btn-main btn-outline" onclick="ArcadeHub.showHub()">
          <i class="fa-solid fa-gamepad"></i> Back to Games
        </button>
        <button class="btn-main btn-info-outline" onclick="ArcadeHub.openHowToPlay('memory')">
          <i class="fa-solid fa-circle-question"></i> How to Play
        </button>
      </div>
    `;
    overlay.classList.add('active');
  },

  hideOverlay() {
    const overlay = document.getElementById('memOverlay');
    if (overlay) overlay.classList.remove('active');
  },

  updateStatsUI() {
    const totalPairs = this.DIFFICULTIES[this.currentDifficulty].pairs;
    const timerElem = document.getElementById('memTimerVal');
    const movesElem = document.getElementById('memMovesVal');
    const pairsElem = document.getElementById('memPairsVal');
    const timerPill = document.getElementById('memTimerPill');

    if (timerElem) timerElem.textContent = this.timeLeft;
    if (movesElem) movesElem.textContent = this.moves;
    if (pairsElem) pairsElem.textContent = `${this.matchedPairs}/${totalPairs}`;
    if (timerPill && this.timeLeft > 10) timerPill.classList.remove('urgent');
  },

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  },

  cleanup() {
    this.isPlaying = false;
    clearInterval(this.timerInterval);
    this.timerInterval = null;
  }
};

window.MemoryMatchGame = MemoryMatchGame;
