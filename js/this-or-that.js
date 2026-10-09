/* ==========================================================================
   GAME THREE: THIS OR THAT
   12-question quiz bank, randomized order, back navigation, rich results
   ========================================================================== */

const ThisOrThatGame = {
  // Clear editable JavaScript data array
  QUESTION_BANK: [
    {
      id: 1,
      title: "Fast Food Craving",
      optionA: { text: "Juicy Burger", emoji: "🍔", tag: "Foodie" },
      optionB: { text: "Cheesy Pizza", emoji: "🍕", tag: "Foodie" }
    },
    {
      id: 2,
      title: "Weekend Mood",
      optionA: { text: "Gaming All Day", emoji: "🎮", tag: "Gamer" },
      optionB: { text: "Deep Sleeping", emoji: "😴", tag: "Chiller" }
    },
    {
      id: 3,
      title: "Dream Vacation",
      optionA: { text: "Sun-Kissed Beach", emoji: "🏖️", tag: "Explorer" },
      optionB: { text: "Majestic Mountains", emoji: "🏔️", tag: "Explorer" }
    },
    {
      id: 4,
      title: "Ride of Choice",
      optionA: { text: "Throttle on Bike", emoji: "🏍️", tag: "Rider" },
      optionB: { text: "Cruise in Car", emoji: "🚗", tag: "Driver" }
    },
    {
      id: 5,
      title: "Ultimate Wish",
      optionA: { text: "Unlimited Food", emoji: "🍣", tag: "Foodie" },
      optionB: { text: "Unlimited Money", emoji: "💰", tag: "Hustler" }
    },
    {
      id: 6,
      title: "Superpower Dream",
      optionA: { text: "Time Travel", emoji: "⏳", tag: "Mystic" },
      optionB: { text: "Teleport Anywhere", emoji: "🚀", tag: "Explorer" }
    },
    {
      id: 7,
      title: "Daredevil Vibe",
      optionA: { text: "Sing in Public", emoji: "🎤", tag: "Extrovert" },
      optionB: { text: "Dance in Public", emoji: "💃", tag: "Extrovert" }
    },
    {
      id: 8,
      title: "Birthday Feast",
      optionA: { text: "Birthday Cake", emoji: "🎂", tag: "Sweet" },
      optionB: { text: "Spicy Biryani", emoji: "🍲", tag: "Savory" }
    },
    {
      id: 9,
      title: "Core Pillar",
      optionA: { text: "Eternal Love", emoji: "❤️", tag: "Romantic" },
      optionB: { text: "True Friendship", emoji: "🤝", tag: "Loyal" }
    },
    {
      id: 10,
      title: "Banter Style",
      optionA: { text: "Get Roasted", emoji: "😂", tag: "Sport" },
      optionB: { text: "Roast Your Friends", emoji: "🔥", tag: "Savage" }
    },
    {
      id: 11,
      title: "Adrenaline Surge",
      optionA: { text: "Game All Night", emoji: "🌙", tag: "Night Owl" },
      optionB: { text: "Travel All Month", emoji: "✈️", tag: "Explorer" }
    },
    {
      id: 12,
      title: "Life Ambition",
      optionA: { text: "Become Famous", emoji: "🌟", tag: "Icon" },
      optionB: { text: "Become a Millionaire", emoji: "💎", tag: "Tycoon" }
    }
  ],

  questions: [],
  currentIndex: 0,
  userAnswers: [], // Stores { question, choice: 'A'|'B', option }
  isTransitioning: false,

  init() {
    this.bindEvents();
  },

  bindEvents() {
    const cardA = document.getElementById('thisThatCardA');
    const cardB = document.getElementById('thisThatCardB');
    const prevBtn = document.getElementById('thisThatPrevBtn');
    const restartBtn = document.getElementById('thisThatRestartBtn');

    if (cardA) cardA.addEventListener('click', () => this.selectAnswer('A'));
    if (cardB) cardB.addEventListener('click', () => this.selectAnswer('B'));
    if (prevBtn) prevBtn.addEventListener('click', () => this.previousQuestion());
    if (restartBtn) restartBtn.addEventListener('click', () => this.start());
  },

  start() {
    this.cleanup();
    // Shuffle question bank
    this.questions = [...this.QUESTION_BANK].sort(() => Math.random() - 0.5);
    this.currentIndex = 0;
    this.userAnswers = [];
    this.isTransitioning = false;

    // Switch panels
    const quizStage = document.getElementById('thisThatPlayStage');
    const resultStage = document.getElementById('thisThatResultPanel');
    if (quizStage) quizStage.style.display = 'block';
    if (resultStage) {
      resultStage.style.display = 'none';
      resultStage.classList.remove('active');
    }

    this.renderCurrentQuestion();
  },

  renderCurrentQuestion() {
    if (!this.questions || this.questions.length === 0) {
      this.questions = [...this.QUESTION_BANK];
    }

    if (this.currentIndex >= this.questions.length) {
      this.showFinalResults();
      return;
    }

    this.isTransitioning = false;
    const q = this.questions[this.currentIndex];
    if (!q) {
      this.showFinalResults();
      return;
    }
    const total = this.questions.length;

    // Progress UI
    const progressFill = document.getElementById('thisThatProgressFill');
    const counterText = document.getElementById('thisThatCounterText');
    const titleText = document.getElementById('thisThatQuestionTitle');
    const prevBtn = document.getElementById('thisThatPrevBtn');

    if (progressFill) {
      const pct = Math.round(((this.currentIndex + 1) / total) * 100);
      progressFill.style.width = `${pct}%`;
    }
    if (counterText) {
      counterText.textContent = `Question ${this.currentIndex + 1} of ${total}`;
    }
    if (titleText) {
      titleText.textContent = q.title;
    }
    if (prevBtn) {
      prevBtn.style.visibility = this.currentIndex > 0 ? 'visible' : 'hidden';
    }

    // Card A
    const emojiA = document.getElementById('thisThatEmojiA');
    const textA = document.getElementById('thisThatTextA');
    const cardA = document.getElementById('thisThatCardA');
    if (emojiA) emojiA.textContent = q.optionA.emoji;
    if (textA) textA.textContent = q.optionA.text;

    // Card B
    const emojiB = document.getElementById('thisThatEmojiB');
    const textB = document.getElementById('thisThatTextB');
    const cardB = document.getElementById('thisThatCardB');
    if (emojiB) emojiB.textContent = q.optionB.emoji;
    if (textB) textB.textContent = q.optionB.text;

    // Check if previously selected (back navigation)
    if (cardA) cardA.classList.remove('selected');
    if (cardB) cardB.classList.remove('selected');

    const previousAns = this.userAnswers[this.currentIndex];
    if (previousAns) {
      if (previousAns.choice === 'A' && cardA) cardA.classList.add('selected');
      if (previousAns.choice === 'B' && cardB) cardB.classList.add('selected');
    }
  },

  selectAnswer(choice) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    try {
      if (!this.questions || this.questions.length === 0) {
        this.start();
        return;
      }

      if (this.currentIndex >= this.questions.length) {
        this.showFinalResults();
        this.isTransitioning = false;
        return;
      }

      const q = this.questions[this.currentIndex];
      if (!q) {
        this.showFinalResults();
        this.isTransitioning = false;
        return;
      }

      const selectedOption = choice === 'A' ? q.optionA : q.optionB;

      // Store / overwrite answer
      this.userAnswers[this.currentIndex] = {
        questionId: q.id,
        questionTitle: q.title,
        choice: choice,
        option: selectedOption
      };

      // UI feedback
      const cardA = document.getElementById('thisThatCardA');
      const cardB = document.getElementById('thisThatCardB');
      if (choice === 'A' && cardA) {
        cardA.classList.add('selected');
        if (cardB) cardB.classList.remove('selected');
      } else if (choice === 'B' && cardB) {
        cardB.classList.add('selected');
        if (cardA) cardA.classList.remove('selected');
      }

      ArcadeSound.click();

      // Advance to next question after smooth pause
      setTimeout(() => {
        this.currentIndex++;
        this.isTransitioning = false;
        this.renderCurrentQuestion();
      }, 320);
    } catch (err) {
      console.error('Error selecting answer:', err);
      this.isTransitioning = false;
    }
  },

  previousQuestion() {
    if (this.currentIndex > 0) {
      ArcadeSound.click();
      this.currentIndex--;
      this.isTransitioning = false;
      this.renderCurrentQuestion();
    }
  },

  showFinalResults() {
    const quizStage = document.getElementById('thisThatPlayStage');
    const resultStage = document.getElementById('thisThatResultPanel');
    if (quizStage) quizStage.style.display = 'none';
    if (resultStage) {
      resultStage.style.display = 'block';
      resultStage.classList.add('active');
    }

    // Save in storage
    ArcadeStorage.saveThisThatAnswers(this.userAnswers);
    if (window.ArcadeHub) ArcadeHub.refreshScoresUI();

    ArcadeSound.fanfare();
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 110,
        spread: 85,
        origin: { y: 0.55 },
        colors: ['#FFD166', '#F04491', '#7138D4']
      });
    }

    // Determine personality archetype from choices
    const archetype = this.computeArchetype();

    const titleElem = document.getElementById('thisThatResultTitle');
    const descElem = document.getElementById('thisThatResultDesc');
    const answersContainer = document.getElementById('thisThatAnswersList');

    if (titleElem) titleElem.textContent = archetype.title;
    if (descElem) descElem.textContent = archetype.description;

    if (answersContainer) {
      answersContainer.innerHTML = this.userAnswers.map(ans => `
        <div class="summary-answer-tag">
          <strong>${ans.questionTitle}:</strong> ${ans.option.emoji} ${ans.option.text}
        </div>
      `).join('');
    }
  },

  computeArchetype() {
    const tags = this.userAnswers.map(a => a.option.tag);
    const explorerCount = tags.filter(t => t === 'Explorer' || t === 'Rider').length;
    const foodieCount = tags.filter(t => t === 'Foodie' || t === 'Savory').length;
    const extrovertCount = tags.filter(t => t === 'Extrovert' || t === 'Savage').length;

    if (explorerCount >= 3) {
      return {
        title: "The Fearless Explorer & Highway Legend 🏍️✨",
        description: "You love wide open horizons, spontaneous journeys, and living life full throttle! A true free spirit with a thirst for epic memories."
      };
    } else if (foodieCount >= 2) {
      return {
        title: "The Ultimate Epicurean & Soul of the Feast 🍲🎂",
        description: "Great food, hearty laughs, and rich moments with loved ones are your greatest joys in life. Keep tasting the good life!"
      };
    } else if (extrovertCount >= 2) {
      return {
        title: "The Unstoppable Party Dynamo & Room Light 🌟🎉",
        description: "Wherever you step in, the atmosphere lights up! You bring infectious energy, laughter, and brotherhood to everyone around you."
      };
    } else {
      return {
        title: "The 25th Milestone Golden Maverick 👑💫",
        description: "A balanced powerhouse of ambition, kindness, adventure, and cool confidence. Stepping into 25 at the top of your game!"
      };
    }
  },

  cleanup() {
    this.isTransitioning = false;
  }
};
