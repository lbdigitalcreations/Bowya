/* ==========================================================================
   JIBIN'S 25TH BIRTHDAY MINI-GAMES - STORAGE MANAGER
   Safe LocalStorage wrapper for personal best scores and settings
   ========================================================================== */

const ArcadeStorage = {
  KEYS: {
    SOUND_MUTED: 'jibin_arcade_sound_muted',
    MEMORY_BEST: 'jibin_memory_best',
    WHACK_BEST: 'jibin_whack_best',
    WHACK_COMBO: 'jibin_whack_combo',
    THIS_THAT_ANSWERS: 'jibin_this_that_answers',
    ESCAPE_BEST: 'jibin_escape_best'
  },

  isAvailable() {
    try {
      const test = '__storage_test__';
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  },

  get(key, defaultValue = null) {
    if (!this.isAvailable()) return defaultValue;
    try {
      const val = window.localStorage.getItem(key);
      return val ? JSON.parse(val) : defaultValue;
    } catch (e) {
      console.warn('ArcadeStorage get error:', e);
      return defaultValue;
    }
  },

  set(key, value) {
    if (!this.isAvailable()) return false;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('ArcadeStorage set error:', e);
      return false;
    }
  },

  // Sound preference
  isSoundMuted() {
    return !!this.get(this.KEYS.SOUND_MUTED, false);
  },

  setSoundMuted(muted) {
    this.set(this.KEYS.SOUND_MUTED, !!muted);
  },

  // Memory Match Best
  getMemoryBest(difficulty = 'medium') {
    const data = this.get(this.KEYS.MEMORY_BEST, {
      easy: { score: 0, moves: 999, time: 0 },
      medium: { score: 0, moves: 999, time: 0 },
      hard: { score: 0, moves: 999, time: 0 }
    });
    return data[difficulty] || { score: 0, moves: 999, time: 0 };
  },

  saveMemoryBest(difficulty, score, moves, time) {
    const all = this.get(this.KEYS.MEMORY_BEST, {
      easy: { score: 0, moves: 999, time: 0 },
      medium: { score: 0, moves: 999, time: 0 },
      hard: { score: 0, moves: 999, time: 0 }
    });
    const current = all[difficulty] || { score: 0, moves: 999, time: 0 };
    if (score > current.score || (score === current.score && moves < current.moves)) {
      all[difficulty] = { score, moves, time };
      this.set(this.KEYS.MEMORY_BEST, all);
      return true; // New record
    }
    return false;
  },

  // Whack-A-Present Best
  getWhackBest() {
    return {
      score: this.get(this.KEYS.WHACK_BEST, 0),
      combo: this.get(this.KEYS.WHACK_COMBO, 0)
    };
  },

  saveWhackBest(score, combo) {
    let isNew = false;
    const currentScore = this.get(this.KEYS.WHACK_BEST, 0);
    const currentCombo = this.get(this.KEYS.WHACK_COMBO, 0);

    if (score > currentScore) {
      this.set(this.KEYS.WHACK_BEST, score);
      isNew = true;
    }
    if (combo > currentCombo) {
      this.set(this.KEYS.WHACK_COMBO, combo);
    }
    return isNew;
  },

  // This or That Results
  getThisThatAnswers() {
    return this.get(this.KEYS.THIS_THAT_ANSWERS, null);
  },

  saveThisThatAnswers(answers) {
    return this.set(this.KEYS.THIS_THAT_ANSWERS, answers);
  },

  // Mystery Escape Best
  getEscapeBest() {
    return this.get(this.KEYS.ESCAPE_BEST, { completed: false, timeTaken: 0, stars: 0 });
  },

  saveEscapeBest(timeTaken, stars) {
    const current = this.getEscapeBest();
    if (!current.completed || timeTaken < current.timeTaken) {
      this.set(this.KEYS.ESCAPE_BEST, { completed: true, timeTaken, stars });
      return true;
    }
    return false;
  }
};

window.ArcadeStorage = ArcadeStorage;
