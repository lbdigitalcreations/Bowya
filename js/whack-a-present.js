/* ==========================================================================
   GAME TWO: WHACK-A-PRESENT
   Fast-paced 30s reflex game with combos, golden presents, bombs & mobile touch
   ========================================================================== */

const WhackPresentGame = {
  ITEM_TYPES: {
    NORMAL: { type: 'normal', emoji: '🎁', points: 10, prob: 0.68 },
    GOLDEN: { type: 'golden', emoji: '👑', points: 50, prob: 0.18 },
    BOMB: { type: 'bomb', emoji: '💣', points: -15, prob: 0.14 }
  },

  score: 0,
  timeLeft: 30,
  combo: 0,
  maxCombo: 0,
  isPlaying: false,
  timerInterval: null,
  spawnInterval: null,
  activeHoles: new Set(),
  holeTimeoutIds: new Map(),

  init() {
    this.bindEvents();
  },

  bindEvents() {
    const startBtn = document.getElementById('whackStartBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.start());
    }

    const restartBtn = document.getElementById('whackRestartBtn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => this.start());
    }

    // Attach click/touch to the 9 holes
    const holes = document.querySelectorAll('#whackGrid .whack-hole-box');
    holes.forEach((hole, idx) => {
      hole.dataset.holeIndex = idx;
      hole.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.handleHoleTap(hole, e);
      });
    });
  },

  start() {
    this.cleanup();
    this.isPlaying = true;
    this.score = 0;
    this.timeLeft = 30;
    this.combo = 0;
    this.maxCombo = 0;
    this.activeHoles.clear();

    this.hideOverlay();
    this.updateStatsUI();

    // Clear all holes
    document.querySelectorAll('#whackGrid .whack-target-item').forEach(item => {
      item.className = 'whack-target-item';
      item.innerHTML = '';
    });

    // Start 30s countdown
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      this.updateStatsUI();

      if (this.timeLeft <= 0) {
        this.endGame();
      }
    }, 1000);

    // Dynamic spawner
    this.scheduleNextSpawn();
  },

  scheduleNextSpawn() {
    if (!this.isPlaying) return;

    // Difficulty ramps up as timeLeft drops (from 750ms down to 420ms)
    const delay = Math.max(400, 750 - (30 - this.timeLeft) * 12);

    this.spawnInterval = setTimeout(() => {
      this.spawnRandomItem();
      this.scheduleNextSpawn();
    }, delay);
  },

  spawnRandomItem() {
    if (!this.isPlaying) return;

    const holes = Array.from(document.querySelectorAll('#whackGrid .whack-hole-box'));
    const availableHoles = holes.filter(h => !this.activeHoles.has(h.dataset.holeIndex));

    if (availableHoles.length === 0) return;

    const hole = availableHoles[Math.floor(Math.random() * availableHoles.length)];
    const holeIdx = hole.dataset.holeIndex;
    this.activeHoles.add(holeIdx);

    // Pick item type
    const rand = Math.random();
    let chosenItem = this.ITEM_TYPES.NORMAL;
    if (rand < this.ITEM_TYPES.BOMB.prob) {
      chosenItem = this.ITEM_TYPES.BOMB;
    } else if (rand < this.ITEM_TYPES.BOMB.prob + this.ITEM_TYPES.GOLDEN.prob) {
      chosenItem = this.ITEM_TYPES.GOLDEN;
    }

    const target = hole.querySelector('.whack-target-item');
    if (!target) return;

    target.textContent = chosenItem.emoji;
    target.className = `whack-target-item active item-${chosenItem.type}`;
    target.dataset.type = chosenItem.type;
    target.dataset.points = chosenItem.points;
    target.dataset.hit = 'false';

    // Duration present stays visible before hiding (shorter as time goes on)
    const stayDuration = Math.max(650, 1100 - (30 - this.timeLeft) * 15);

    const tId = setTimeout(() => {
      if (this.activeHoles.has(holeIdx)) {
        target.classList.remove('active');
        this.activeHoles.delete(holeIdx);
      }
    }, stayDuration);

    this.holeTimeoutIds.set(holeIdx, tId);
  },

  handleHoleTap(hole, event) {
    if (!this.isPlaying) return;

    const holeIdx = hole.dataset.holeIndex;
    const target = hole.querySelector('.whack-target-item');
    if (!target || !target.classList.contains('active') || target.dataset.hit === 'true') {
      return;
    }

    target.dataset.hit = 'true';
    const type = target.dataset.type;
    const basePts = parseInt(target.dataset.points, 10);

    // Clear timeout for this hole
    if (this.holeTimeoutIds.has(holeIdx)) {
      clearTimeout(this.holeTimeoutIds.get(holeIdx));
      this.holeTimeoutIds.delete(holeIdx);
    }

    if (type === 'bomb') {
      // Hit a bomb!
      this.combo = 0;
      this.score = Math.max(0, this.score + basePts);
      ArcadeSound.bombExplode();
      this.showScorePopup(hole, `${basePts}`, 'minus', event);
      target.classList.add('bonked');
    } else {
      // Successful tap!
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;

      // Combo multiplier: 1x (combo 1-2), 2x (combo 3-5), 3x (combo 6-8), 4x (combo 9+)
      let multiplier = 1;
      if (this.combo >= 9) multiplier = 4;
      else if (this.combo >= 6) multiplier = 3;
      else if (this.combo >= 3) multiplier = 2;

      const earnedPts = basePts * multiplier;
      this.score += earnedPts;

      if (type === 'golden') {
        ArcadeSound.goldenPop();
      } else {
        ArcadeSound.presentPop();
      }

      if (multiplier > 1 && this.combo % 3 === 0) {
        ArcadeSound.combo(multiplier);
      }

      const label = multiplier > 1 ? `+${earnedPts} (x${multiplier})` : `+${earnedPts}`;
      this.showScorePopup(hole, label, 'plus', event);
      target.classList.add('bonked');
    }

    setTimeout(() => {
      target.className = 'whack-target-item';
      target.innerHTML = '';
      this.activeHoles.delete(holeIdx);
    }, 280);

    this.updateStatsUI();
  },

  showScorePopup(hole, text, type, event) {
    const popup = document.createElement('div');
    popup.className = `floating-score-msg ${type}`;
    popup.textContent = text;
    popup.style.left = '50%';
    popup.style.top = '20%';
    hole.appendChild(popup);

    setTimeout(() => {
      popup.remove();
    }, 800);
  },

  endGame() {
    this.cleanup();
    const isNewRecord = ArcadeStorage.saveWhackBest(this.score, this.maxCombo);

    if (this.score >= 150) {
      ArcadeSound.fanfare();
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFD166', '#F04491', '#7138D4']
        });
      }
    } else {
      ArcadeSound.match();
    }

    if (window.ArcadeHub) {
      ArcadeHub.refreshScoresUI();
    }

    this.showOverlay({
      icon: '🎁',
      title: 'Party Whack Complete!',
      subtitle: 'Lightning fast reflexes for Jihin (Chamathu)\'s 25th celebration!',
      stats: [
        { label: 'Final Score', value: `${this.score} pts` },
        { label: 'Max Combo', value: `x${this.maxCombo}` }
      ],
      isRecord: isNewRecord
    });
  },

  showOverlay({ icon, title, subtitle, stats, isRecord }) {
    const overlay = document.getElementById('whackOverlay');
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
      <p style="color: var(--arcade-lavender); margin-bottom: 0.6rem;">${subtitle}</p>
      ${isRecord ? '<span class="badge-pill" style="border-color: var(--arcade-gold); color: var(--arcade-gold); margin-bottom: 1rem;">★ New High Score! ★</span>' : ''}
      <div class="result-stats-row">${statsHtml}</div>
      <div class="result-btn-row">
        <button class="btn-main btn-primary" onclick="WhackPresentGame.start()">
          <i class="fa-solid fa-rotate-right"></i> Play Again
        </button>
        <button class="btn-main btn-outline" onclick="ArcadeHub.showHub()">
          <i class="fa-solid fa-gamepad"></i> Back to Games
        </button>
      </div>
    `;
    overlay.classList.add('active');
  },

  hideOverlay() {
    const overlay = document.getElementById('whackOverlay');
    if (overlay) overlay.classList.remove('active');
  },

  updateStatsUI() {
    const timerElem = document.getElementById('whackTimerVal');
    const scoreElem = document.getElementById('whackScoreVal');
    const comboElem = document.getElementById('whackComboVal');
    const timerPill = document.getElementById('whackTimerPill');

    if (timerElem) timerElem.textContent = this.timeLeft;
    if (scoreElem) scoreElem.textContent = this.score;
    if (comboElem) comboElem.textContent = `x${this.combo}`;

    if (timerPill) {
      if (this.timeLeft <= 10) timerPill.classList.add('urgent');
      else timerPill.classList.remove('urgent');
    }
  },

  cleanup() {
    this.isPlaying = false;
    clearInterval(this.timerInterval);
    clearTimeout(this.spawnInterval);
    this.timerInterval = null;
    this.spawnInterval = null;

    this.holeTimeoutIds.forEach(tId => clearTimeout(tId));
    this.holeTimeoutIds.clear();
    this.activeHoles.clear();

    // Clear active presents
    document.querySelectorAll('#whackGrid .whack-target-item').forEach(item => {
      item.className = 'whack-target-item';
      item.innerHTML = '';
    });
  }
};
