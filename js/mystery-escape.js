/* ==========================================================================
   GAME FOUR: BIRTHDAY MYSTERY ESCAPE (MISSION 25)
   Progressive 3-stage escape room, interactive clues, cipher locks & grand finale
   ========================================================================== */

const MysteryEscapeGame = {
  STAGES: {
    STAGE_1_ROOM: 1,
    STAGE_2_RIDDLE: 2,
    STAGE_3_KEYPAD: 3
  },

  CORRECT_RIDDLE_ANSWER: '25',
  CORRECT_FINAL_CODE: '2525',

  totalTime: 240, // 4 minutes
  timeLeft: 240,
  timerInterval: null,
  currentStage: 1,
  isPlaying: false,
  hintsUsed: 0,
  enteredCode: '',

  // Clue discovery tracking
  inspectedObjects: {
    balloon: false,
    frame: false,
    present: false,
    bookshelf: false,
    clock: false
  },

  cluesDiscovered: {
    digitPartA: false, // Discovered 2 from Picture Frame
    digitPartB: false, // Discovered 5 from Birthday Present
    codeFormula: false // Discovered combination pattern from Wall Clock
  },

  init() {
    this.bindEvents();
  },

  bindEvents() {
    // Start mission from intro
    const startMissionBtn = document.getElementById('escapeStartMissionBtn');
    if (startMissionBtn) {
      startMissionBtn.addEventListener('click', () => this.startMission());
    }

    // Room interactive objects
    document.querySelectorAll('.room-interactive-obj').forEach(obj => {
      obj.addEventListener('click', (e) => {
        const itemType = e.currentTarget.dataset.item;
        this.inspectRoomObject(itemType, e.currentTarget);
      });
    });

    // Advance from stage 1 to stage 2
    const advanceToRiddleBtn = document.getElementById('advanceToStage2Btn');
    if (advanceToRiddleBtn) {
      advanceToRiddleBtn.addEventListener('click', () => this.advanceToStage(2));
    }

    // Stage 2 Riddle check
    const riddleSubmitBtn = document.getElementById('riddleSubmitBtn');
    const riddleInput = document.getElementById('riddleInput');
    if (riddleSubmitBtn && riddleInput) {
      riddleSubmitBtn.addEventListener('click', () => this.checkRiddleAnswer());
      riddleInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.checkRiddleAnswer();
      });
    }

    // Stage 2 Hint
    const riddleHintBtn = document.getElementById('riddleHintBtn');
    if (riddleHintBtn) {
      riddleHintBtn.addEventListener('click', () => this.showRiddleHint());
    }

    // Stage 3 Keypad clicks
    document.querySelectorAll('.numeric-keypad-grid .keypad-key').forEach(key => {
      key.onclick = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        const val = key.dataset.val;
        this.handleKeypadPress(val);
      };
    });

    // Keyboard support for keypad
    if (!this._keyboardBound) {
      this._keyboardBound = true;
      window.addEventListener('keydown', (e) => {
        const stage3 = document.getElementById('escapeStage3');
        if (this.isPlaying && this.currentStage === 3 && stage3 && stage3.style.display !== 'none') {
          if (/^[0-9]$/.test(e.key)) {
            this.handleKeypadPress(e.key);
          } else if (e.key === 'Backspace' || e.key === 'Delete') {
            this.handleKeypadPress('clear');
          } else if (e.key === 'Enter') {
            this.handleKeypadPress('enter');
          }
        }
      });
    }
  },

  startMission() {
    this.cleanup();
    this.isPlaying = true;
    this.timeLeft = this.totalTime;
    this.currentStage = 1;
    this.hintsUsed = 0;
    this.enteredCode = '';

    // Reset inspections
    this.inspectedObjects = { balloon: false, frame: false, present: false, bookshelf: false, clock: false };
    this.cluesDiscovered = { digitPartA: false, digitPartB: false, codeFormula: false };

    // Reset UI elements
    document.querySelectorAll('.room-interactive-obj').forEach(obj => obj.classList.remove('inspected'));
    const advBtn = document.getElementById('advanceToStage2Btn');
    if (advBtn) advBtn.style.display = 'none';

    const rInput = document.getElementById('riddleInput');
    if (rInput) { rInput.value = ''; rInput.disabled = false; }
    const rFeedback = document.getElementById('riddleFeedback');
    if (rFeedback) rFeedback.innerHTML = '';

    this.updateKeypadDisplay();

    // Show Stage 1
    this.advanceToStage(1);

    // Start timer
    this.startTimer();
    ArcadeSound.click();
  },

  startTimer() {
    clearInterval(this.timerInterval);
    const timerElem = document.getElementById('escapeTimerVal');
    const timerPill = document.getElementById('escapeTimerPill');

    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (timerElem) {
        const mins = Math.floor(this.timeLeft / 60);
        const secs = this.timeLeft % 60;
        timerElem.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
      }

      if (this.timeLeft <= 30 && timerPill) {
        timerPill.classList.add('urgent');
      }

      if (this.timeLeft <= 0) {
        this.timeExpired();
      }
    }, 1000);
  },

  advanceToStage(stageNum) {
    this.currentStage = stageNum;

    // Tracker UI
    const dot1 = document.getElementById('stageDot1');
    const dot2 = document.getElementById('stageDot2');
    const dot3 = document.getElementById('stageDot3');
    if (dot1) dot1.className = `stage-step-dot ${stageNum === 1 ? 'active' : (stageNum > 1 ? 'completed' : '')}`;
    if (dot2) dot2.className = `stage-step-dot ${stageNum === 2 ? 'active' : (stageNum > 2 ? 'completed' : '')}`;
    if (dot3) dot3.className = `stage-step-dot ${stageNum === 3 ? 'active' : ''}`;

    // Panels visibility
    const intro = document.getElementById('escapeIntro');
    const stage1 = document.getElementById('escapeStage1');
    const stage2 = document.getElementById('escapeStage2');
    const stage3 = document.getElementById('escapeStage3');

    if (intro) intro.style.display = 'none';
    if (stage1) stage1.style.display = stageNum === 1 ? 'block' : 'none';
    if (stage2) {
      stage2.style.display = stageNum === 2 ? 'block' : 'none';
      if (stageNum === 2) {
        setTimeout(() => {
          const rInput = document.getElementById('riddleInput');
          if (rInput) rInput.focus();
        }, 150);
      }
    }
    if (stage3) stage3.style.display = stageNum === 3 ? 'block' : 'none';

    ArcadeSound.click();
  },

  inspectRoomObject(type, element) {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.startTimer();
    }
    if (this.currentStage !== 1) {
      this.advanceToStage(1);
    }

    this.inspectedObjects[type] = true;
    const targetObj = element || document.querySelector(`.room-interactive-obj[data-item="${type}"]`);
    if (targetObj) targetObj.classList.add('inspected');

    const modal = document.getElementById('roomInspectionModal');
    const modalTitle = document.getElementById('inspectionModalTitle');
    const modalContent = document.getElementById('inspectionModalContent');

    ArcadeSound.click();

    let title = '';
    let msg = '';

    switch (type) {
      case 'balloon':
        title = "🎈 Floating Birthday Balloon";
        msg = "You gently tap the purple balloon. Attached to the ribbon is a cheerful note: <br><br><em>'Chamathu is officially turning 25! Born on 10/10/2001, stepping into his silver jubilee prime!'</em>";
        break;

      case 'frame':
        title = "🖼️ Explorer Picture Frame";
        msg = "Looking closely at Jihin's bike adventurer portrait, you spot faint golden handwriting on the back: <br><br><strong style='color: var(--arcade-gold);'>Cipher Clue 1: 'The first digit of the lock code is the first digit of the milestone age (25): [ 2 ]'</strong>";
        this.cluesDiscovered.digitPartA = true;
        break;

      case 'present':
        title = "🎁 Velvet Mystery Gift Box";
        msg = "You untie the golden ribbon. Inside lies a shining silver medal inscribed with: <br><br><strong style='color: var(--arcade-gold);'>Cipher Clue 2: 'The second digit of the lock code is the second digit of the milestone age (25): [ 5 ]'</strong>";
        this.cluesDiscovered.digitPartB = true;
        break;

      case 'bookshelf':
        title = "📚 Adventurer's Bookshelf";
        msg = "A book titled <em>'25 Epic Journeys of Chamathu'</em> catches your eye. A bookmark reads: <br><br><em>'Born 10/10/2001 — Celebrate with boundless courage, the best adventures are waiting for you, Jihin!'</em>";
        break;

      case 'clock':
        title = "⏰ Antique Celebration Clock";
        msg = "The clock hands point exactly to 10:10 (honoring Jihin's 10/10 birthdate!). Engraved beneath the pendulum is the combination formula: <br><br><strong style='color: var(--arcade-gold);'>Lock Formula: 'The 4-digit code is the milestone age repeated: [ 25 + 25 = 2525 ]'</strong>";
        this.cluesDiscovered.codeFormula = true;
        break;
    }

    if (modalTitle) modalTitle.innerHTML = title;
    if (modalContent) modalContent.innerHTML = msg;
    if (modal) modal.classList.add('open');

    // Check if key clues discovered to unlock Stage 2
    if (this.cluesDiscovered.digitPartA && this.cluesDiscovered.digitPartB) {
      const advBtn = document.getElementById('advanceToStage2Btn');
      if (advBtn) {
        advBtn.style.display = 'inline-flex';
        advBtn.classList.add('pulse');
      }
    }
  },

  closeInspectionModal() {
    const modal = document.getElementById('roomInspectionModal');
    if (modal) modal.classList.remove('open');
  },

  checkRiddleAnswer() {
    if (this.currentStage !== 2) return;
    const input = document.getElementById('riddleInput');
    const feedback = document.getElementById('riddleFeedback');
    if (!input) return;

    const val = input.value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    if (val === '25' || val === 'twentyfive' || val === '25th' || val === 'twentyfifth') {
      ArcadeSound.match();
      input.disabled = true;
      if (feedback) {
        feedback.innerHTML = `
          <div style="color: #10B981; font-weight: 800; font-size: 1.15rem; margin-top: 1rem;">
            <i class="fa-solid fa-circle-check"></i> Correct! Exactly 25! Lock 1 Disengaged!
          </div>
        `;
      }

      setTimeout(() => {
        this.advanceToStage(3);
      }, 1000);
    } else {
      ArcadeSound.wrong();
      if (feedback) {
        feedback.innerHTML = `
          <div style="color: #ef4444; font-weight: 700; font-size: 0.95rem; margin-top: 1rem;">
            <i class="fa-solid fa-triangle-exclamation"></i> Incorrect answer. Think about Jihin (Chamathu)'s milestone birthday today!
          </div>
        `;
      }
    }
  },

  showRiddleHint() {
    this.hintsUsed++;
    ArcadeSound.goldenPop();
    const hintText = document.getElementById('riddleHintText');
    if (hintText) {
      hintText.style.display = 'block';
      hintText.innerHTML = `💡 Hint: Born on 10/10/2001, Jihin (Chamathu) is turning 25 today! (Answer: 25)`;
    }
  },

  _lastKeypadTime: 0,

  handleKeypadPress(val) {
    const now = Date.now();
    // Guard against rapid duplicate firing (e.g. mobile tap synthesis or double event listeners)
    if (now - this._lastKeypadTime < 180) {
      return;
    }
    this._lastKeypadTime = now;

    if (!this.isPlaying) {
      this.isPlaying = true;
      this.startTimer();
    }
    if (this.currentStage !== 3) {
      this.advanceToStage(3);
    }

    if (val === 'clear') {
      this.enteredCode = '';
      ArcadeSound.click();
    } else if (val === 'enter') {
      this.submitCode();
    } else {
      if (this.enteredCode.length < 4) {
        this.enteredCode += String(val);
        ArcadeSound.keypadClick();
      }
    }

    this.updateKeypadDisplay();
  },

  updateKeypadDisplay() {
    for (let i = 0; i < 4; i++) {
      const slot = document.getElementById(`digitSlot${i}`);
      if (slot) {
        if (i < this.enteredCode.length) {
          slot.textContent = this.enteredCode[i];
          slot.classList.add('filled');
        } else {
          slot.textContent = '•';
          slot.classList.remove('filled');
        }
      }
    }
  },

  submitCode() {
    if (this.enteredCode.length < 4) return;

    const displayWrap = document.getElementById('passcodeDisplayWrap');

    if (this.enteredCode === this.CORRECT_FINAL_CODE || this.enteredCode === '1010') {
      // Crack the final lock!
      ArcadeSound.chestUnlock();
      if (displayWrap) {
        displayWrap.style.borderColor = '#10B981';
      }

      setTimeout(() => {
        this.victoryFinale();
      }, 600);
    } else {
      ArcadeSound.wrong();
      if (displayWrap) {
        displayWrap.classList.add('shake');
        setTimeout(() => displayWrap.classList.remove('shake'), 500);
      }
      this.enteredCode = '';
      this.updateKeypadDisplay();

      const feedback = document.getElementById('keypadFeedback');
      if (feedback) {
        feedback.innerHTML = `
          <div style="color: #ef4444; font-size: 0.9rem; font-weight: 700; margin-top: 0.8rem;">
            ❌ Invalid Code! Remember the Clock Formula: [Age (25) + Age (25) = 2525] or Birthday [1010]
          </div>
        `;
      }
    }
  },

  victoryFinale() {
    this.cleanup();
    const timeTaken = this.totalTime - this.timeLeft;
    const mins = Math.floor(timeTaken / 60);
    const secs = timeTaken % 60;
    const timeFormatted = `${mins}m ${secs}s`;

    // Stars calculation: 5 stars (< 2min, 0 hints), 4 stars (< 3min), 3 stars
    let stars = 5;
    if (timeTaken > 150 || this.hintsUsed > 0) stars = 4;
    if (timeTaken > 200) stars = 3;

    ArcadeStorage.saveEscapeBest(timeTaken, stars);
    if (window.ArcadeHub) ArcadeHub.refreshScoresUI();

    ArcadeSound.fanfare();
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 180,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#FFD166', '#F04491', '#7138D4', '#10B981', '#FFFFFF']
      });
    }

    // Populate Finale Modal
    const modal = document.getElementById('birthdayFinaleModal');
    const timeElem = document.getElementById('finaleTimeTaken');
    const hintsElem = document.getElementById('finaleHintsUsed');
    const starsElem = document.getElementById('finaleStarsRating');

    if (timeElem) timeElem.textContent = timeFormatted;
    if (hintsElem) hintsElem.textContent = this.hintsUsed;
    if (starsElem) starsElem.textContent = '⭐'.repeat(stars);

    if (modal) modal.classList.add('open');
  },

  closeFinaleModal() {
    const modal = document.getElementById('birthdayFinaleModal');
    if (modal) modal.classList.remove('open');
  },

  timeExpired() {
    this.cleanup();
    ArcadeSound.wrong();
    alert("⏰ Time has expired for Mission 25! Tap 'Start Mission' to try escaping again!");
    this.startMission();
  },

  cleanup() {
    this.isPlaying = false;
    clearInterval(this.timerInterval);
    this.timerInterval = null;
  }
};

window.MysteryEscapeGame = MysteryEscapeGame;
