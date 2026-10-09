/* ==========================================================================
   JIBIN'S 25TH BIRTHDAY MINI-GAMES - ARCADE HUB CONTROLLER
   Single-page game routing, sound toggles, score board sync & modal controls
   ========================================================================== */

const ArcadeHub = {
  activeGameId: null,

  init() {
    this.initAudioControls();
    this.initGameRouting();
    this.refreshScoresUI();

    // Initialize individual games
    if (typeof MemoryMatchGame !== 'undefined') MemoryMatchGame.init();
    if (typeof WhackPresentGame !== 'undefined') WhackPresentGame.init();
    if (typeof ThisOrThatGame !== 'undefined') ThisOrThatGame.init();
    if (typeof MysteryEscapeGame !== 'undefined') MysteryEscapeGame.init();

    // Check hash on load
    this.handleUrlHash();
    window.addEventListener('hashchange', () => this.handleUrlHash());
  },

  handleUrlHash() {
    const hash = window.location.hash;
    if (hash === '#game-memory') {
      this.launchGame('memory');
    } else if (hash === '#game-whack') {
      this.launchGame('whack');
    } else if (hash === '#game-this-that') {
      this.launchGame('this-that');
    } else if (hash === '#game-mystery') {
      this.launchGame('mystery');
    } else if (hash === '#arcade') {
      this.showHub();
    }
  },

  initAudioControls() {
    const soundToggleBtns = document.querySelectorAll('.arcade-sound-toggle-btn');
    soundToggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const isMuted = ArcadeSound.toggleMute();
        this.updateSoundButtonUI(isMuted);
      });
    });

    // Update initial UI state
    this.updateSoundButtonUI(ArcadeSound.isMuted());
  },

  updateSoundButtonUI(isMuted) {
    const soundToggleBtns = document.querySelectorAll('.arcade-sound-toggle-btn');
    soundToggleBtns.forEach(btn => {
      if (isMuted) {
        btn.innerHTML = `<i class="fa-solid fa-volume-xmark"></i> Sound: OFF`;
        btn.classList.add('muted');
      } else {
        btn.innerHTML = `<i class="fa-solid fa-volume-high"></i> Sound: ON`;
        btn.classList.remove('muted');
      }
    });
  },

  initGameRouting() {
    // Play Now buttons on cards
    document.querySelectorAll('[data-launch-game]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const gameId = e.currentTarget.dataset.launchGame;
        this.launchGame(gameId);
      });
    });

    // Back to Arcade Hub buttons
    document.querySelectorAll('.btn-back-hub').forEach(btn => {
      btn.addEventListener('click', () => {
        this.showHub();
      });
    });
  },

  launchGame(gameId) {
    // Clean up currently active game
    this.cleanupActiveGame();

    this.activeGameId = gameId;

    // Hide Arcade Hub selection
    const hubSelection = document.getElementById('arcadeHubSelection');
    if (hubSelection) hubSelection.style.display = 'none';

    // Hide all game stages
    document.querySelectorAll('.arcade-game-stage').forEach(stage => {
      stage.classList.remove('active');
    });

    // Scroll to arcade container smoothly
    const arcadeWrapper = document.getElementById('arcade') || document.querySelector('.arcade-wrapper');
    if (arcadeWrapper) {
      arcadeWrapper.scrollIntoView({ behavior: 'smooth' });
    }

    // Launch targeted game
    if (gameId === 'memory') {
      const stage = document.getElementById('stageMemoryMatch');
      if (stage) {
        stage.classList.add('active');
        stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (typeof MemoryMatchGame !== 'undefined') MemoryMatchGame.start();
    } else if (gameId === 'whack') {
      const stage = document.getElementById('stageWhackPresent');
      if (stage) {
        stage.classList.add('active');
        stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (typeof WhackPresentGame !== 'undefined') WhackPresentGame.start();
    } else if (gameId === 'this-that') {
      const stage = document.getElementById('stageThisThat');
      if (stage) {
        stage.classList.add('active');
        stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (typeof ThisOrThatGame !== 'undefined') ThisOrThatGame.start();
    } else if (gameId === 'mystery') {
      const stage = document.getElementById('stageMysteryEscape');
      if (stage) {
        stage.classList.add('active');
        stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (typeof MysteryEscapeGame !== 'undefined') {
        MysteryEscapeGame.startMission();
      }
    }

    ArcadeSound.click();
  },

  showHub() {
    this.cleanupActiveGame();
    this.activeGameId = null;

    // Show Hub Selection
    const hubSelection = document.getElementById('arcadeHubSelection');
    if (hubSelection) hubSelection.style.display = 'block';

    // Hide all game stages
    document.querySelectorAll('.arcade-game-stage').forEach(stage => {
      stage.classList.remove('active');
    });

    // Scroll smoothly back to top of hub
    const topAnchor = document.getElementById('arcadeHubSelection') || document.querySelector('.arcade-wrapper');
    if (topAnchor) {
      topAnchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    this.refreshScoresUI();
    ArcadeSound.click();
  },

  cleanupActiveGame() {
    if (typeof MemoryMatchGame !== 'undefined') MemoryMatchGame.cleanup();
    if (typeof WhackPresentGame !== 'undefined') WhackPresentGame.cleanup();
    if (typeof ThisOrThatGame !== 'undefined') ThisOrThatGame.cleanup();
    if (typeof MysteryEscapeGame !== 'undefined') MysteryEscapeGame.cleanup();
  },

  refreshScoresUI() {
    // 1. Memory Match Best
    const memBestMed = ArcadeStorage.getMemoryBest('medium');
    const memSummaryVal = document.getElementById('summaryMemoryBest');
    if (memSummaryVal) {
      memSummaryVal.textContent = memBestMed.score > 0 ? `${memBestMed.score} pts (${memBestMed.moves}m)` : '--';
    }

    // 2. Whack-A-Present Best
    const whackBest = ArcadeStorage.getWhackBest();
    const whackSummaryVal = document.getElementById('summaryWhackBest');
    if (whackSummaryVal) {
      whackSummaryVal.textContent = whackBest.score > 0 ? `${whackBest.score} pts (x${whackBest.combo})` : '--';
    }

    // 3. This or That Answers
    const thisThatAns = ArcadeStorage.getThisThatAnswers();
    const thisThatSummaryVal = document.getElementById('summaryThisThatBest');
    if (thisThatSummaryVal) {
      thisThatSummaryVal.textContent = thisThatAns && thisThatAns.length > 0 ? `${thisThatAns.length}/12 Chosen` : '--';
    }

    // 4. Mystery Escape Record
    const escapeBest = ArcadeStorage.getEscapeBest();
    const escapeSummaryVal = document.getElementById('summaryEscapeBest');
    if (escapeSummaryVal) {
      if (escapeBest.completed) {
        const m = Math.floor(escapeBest.timeTaken / 60);
        const s = escapeBest.timeTaken % 60;
        escapeSummaryVal.textContent = `${m}m ${s}s (${'⭐'.repeat(escapeBest.stars)})`;
      } else {
        escapeSummaryVal.textContent = 'Locked 🗝️';
      }
    }
  },

  openInstructionsModal() {
    const modal = document.getElementById('arcadeInstructionsModal');
    if (modal) modal.classList.add('open');
    ArcadeSound.click();
  },

  closeInstructionsModal() {
    const modal = document.getElementById('arcadeInstructionsModal');
    if (modal) modal.classList.remove('open');
  }
};

window.ArcadeHub = ArcadeHub;

// Bootstrap when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  ArcadeHub.init();
});

