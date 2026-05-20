/**
 * Beurten, vragen, schatkist (tegenstander), raad = win
 */
(function () {
  const PHASE = {
    IDLE: "idle",
    PICK_SECRET: "pickSecret",
    OPPONENT_PICK: "opponentPick",
    MY_TURN: "myTurn",
    ASK_QUESTION: "askQuestion",
    WAIT_ANSWER: "waitAnswer",
    THEIR_TURN: "theirTurn",
    ANSWER_QUESTION: "answerQuestion",
    WAIT_OPPONENT_POST: "waitOpponentPost",
    POST_ANSWER_SWITCH: "postAnswerSwitch",
    POST_ANSWER_FLIP_RUSH: "postAnswerFlipRush",
    POST_ANSWER_FLIP_FREE: "postAnswerFlipFree",
    GUESS: "guess",
    WON: "won",
    LOST: "lost",
  };

  const state = {
    phase: PHASE.IDLE,
    secretIndex: null,
    opponentSecretIndex: null,
    localSecretReady: false,
    remoteSecretReady: false,
    playerWells: [],
    opponentWells: [],
    online: false,
    isHost: true,
    pendingQuestion: null,
    pendingQuestionText: "",
    flippedThisTurn: false,
    askedThisTurn: false,
    usedQuestions: [],
    botDifficulty: "medium",
  };

  const POST_ANSWER_SWITCH_SEC = 10;
  const POST_ANSWER_FLIP_SEC = 10;

  let screenGame = null;
  let turnBanner = null;
  let secretSlot = null;
  let opponentZone = null;
  let opponentChest = null;
  let opponentAnswerEl = null;
  let questionPanel = null;
  let questionInput = null;
  let btnSendQuestion = null;
  let btnSwitchTurn = null;
  let btnEndFlipPhase = null;
  let postAnswerTimerEl = null;
  let postAnswerLabelEl = null;
  let postAnswerTimeoutId = null;
  let postAnswerIntervalId = null;
  let winOverlay = null;
  let chestVisualDefaultHtml = null;
  let tFn = (k) => k;
  let cardNames = [];

  const MALE_NAMES =
    /^(Max|Tom|Ben|Noah|Jack|Lucas|Daan|Sam|Finn|Tim|Ole|Raj|Erik|Jay|Fox|Ian)$/i;
  const FEMALE_NAMES =
    /^(Anne|Lisa|Sara|Emma|Mila|Fleur|Evi|Nina|Lynn|Zoe|Ivy|Amy|Kim|Lea|Joy|Rio)$/i;

  function setBanner(text) {
    if (!turnBanner) return;
    turnBanner.textContent = text;
    turnBanner.classList.remove("hidden");
    turnBanner.classList.remove("pop");
    void turnBanner.offsetWidth;
    turnBanner.classList.add("pop");
  }

  function hideBanner() {
    if (turnBanner) turnBanner.classList.add("hidden");
  }

  function setScreenTurn(mode) {
    if (!screenGame) return;
    screenGame.classList.remove(
      "phase-pick-secret",
      "turn-player",
      "turn-opponent",
      "phase-question",
      "phase-guess"
    );
    if (mode === "pick") screenGame.classList.add("phase-pick-secret");
    if (mode === "my") screenGame.classList.add("turn-player");
    if (mode === "their") screenGame.classList.add("turn-opponent");
    if (mode === "question") screenGame.classList.add("phase-question");
    if (mode === "guess") screenGame.classList.add("phase-guess");
  }

  function clearInteractivity() {
    state.playerWells.forEach((w) => {
      w.classList.remove("interactive", "guess-mode");
    });
    state.opponentWells.forEach((w) => w.classList.remove("interactive"));
    if (opponentZone) opponentZone.classList.remove("turn-active");
    if (opponentChest) opponentChest.classList.remove("chest-guess-ready");
  }

  function isCardFaceDown(tile) {
    if (!tile) return false;
    return tile.classList.contains("is-down") || tile.classList.contains("flip-anim-down");
  }

  function flipWell(well, anim) {
    const tile = well.querySelector(".card-tile");
    if (!tile || isCardFaceDown(tile) || tile.classList.contains("revealed-secret")) {
      return false;
    }
    tile.classList.remove("flip-anim-up");
    tile.classList.add("is-down");
    if (anim) {
      tile.classList.add("flip-anim-down");
      tile.addEventListener(
        "animationend",
        () => {
          tile.classList.remove("flip-anim-down");
        },
        { once: true }
      );
    }
    return true;
  }

  function unflipWell(well, anim) {
    const tile = well.querySelector(".card-tile");
    if (!tile || !isCardFaceDown(tile) || tile.classList.contains("revealed-secret")) {
      return false;
    }
    tile.classList.remove("is-down", "flip-anim-down");
    if (anim) {
      tile.classList.add("flip-anim-up");
      tile.addEventListener(
        "animationend",
        () => {
          tile.classList.remove("flip-anim-up");
        },
        { once: true }
      );
    } else {
      tile.classList.remove("flip-anim-up");
    }
    return true;
  }

  /** @returns {"down"|"up"|null} */
  function togglePlayerWell(well, anim) {
    const tile = well.querySelector(".card-tile");
    if (!tile || tile.classList.contains("revealed-secret")) return null;
    if (isCardFaceDown(tile)) {
      return unflipWell(well, anim) ? "up" : null;
    }
    return flipWell(well, anim) ? "down" : null;
  }

  function syncPlayerFlipOnline(index, isDown) {
    if (state.online && window.WieIsHetOnline) {
      window.WieIsHetOnline.sendFlip(index, isDown);
    }
  }

  function flipOpponentAt(index, anim, isDown) {
    const well = state.opponentWells[index];
    if (!well) return;
    if (isDown === false) unflipWell(well, anim);
    else flipWell(well, anim);
  }

  function cloneCardToSecret(well) {
    if (!secretSlot) return;
    secretSlot.innerHTML = "";
    const face = well.querySelector(".card-face");
    if (!face) return;
    secretSlot.appendChild(face.cloneNode(true));
    secretSlot.classList.add("visible");
  }

  function showOpponentAnswer(text, isYes) {
    if (!opponentAnswerEl) return;
    opponentAnswerEl.textContent = text;
    opponentAnswerEl.classList.remove("hidden", "answer-yes", "answer-no");
    opponentAnswerEl.classList.add(isYes ? "answer-yes" : "answer-no", "pop");
    if (opponentChest) opponentChest.classList.add("chest-speaking");
    setTimeout(() => {
      opponentAnswerEl.classList.remove("pop");
    }, 400);
  }

  function hideOpponentAnswer() {
    if (opponentAnswerEl) {
      opponentAnswerEl.classList.add("hidden");
      opponentAnswerEl.classList.remove("answer-yes", "answer-no", "pop");
    }
    if (opponentChest) opponentChest.classList.remove("chest-speaking");
  }

  function getSecretName(index) {
    if (index == null || index < 0) return "";
    return cardNames[index] || "";
  }

  function saveChestDefault() {
    if (!opponentChest || chestVisualDefaultHtml) return;
    const visual = opponentChest.querySelector(".chest-visual");
    if (visual) chestVisualDefaultHtml = visual.innerHTML;
  }

  function clearOpponentReveal() {
    state.playerWells.forEach((w) => {
      w.classList.remove("opponent-secret-revealed");
      const tile = w.querySelector(".card-tile");
      if (tile) tile.classList.remove("revealed-secret");
    });
    if (opponentChest) {
      opponentChest.classList.remove("chest-revealed");
      const visual = opponentChest.querySelector(".chest-visual");
      if (visual && chestVisualDefaultHtml) visual.innerHTML = chestVisualDefaultHtml;
      const hint = opponentChest.querySelector(".chest-hint");
      if (hint) {
        const key = hint.getAttribute("data-i18n");
        if (key) hint.textContent = tFn(key);
      }
    }
    if (winOverlay) {
      const reveal = winOverlay.querySelector(".lose-opponent-reveal");
      const faceSlot = winOverlay.querySelector(".lose-reveal-face");
      if (reveal) {
        reveal.classList.add("hidden");
        reveal.setAttribute("aria-hidden", "true");
      }
      if (faceSlot) faceSlot.innerHTML = "";
      const nameEl = winOverlay.querySelector(".lose-reveal-name");
      if (nameEl) nameEl.textContent = "";
    }
  }

  function revealOpponentSecret(revealIndex) {
    const idx =
      typeof revealIndex === "number" ? revealIndex : state.opponentSecretIndex;
    if (idx == null || idx < 0) return;

    const name = getSecretName(idx);
    const well = state.playerWells[idx];
    const face = well?.querySelector(".card-face");
    if (!face) return;

    if (opponentChest) {
      opponentChest.classList.add("chest-revealed");
      opponentChest.classList.remove("chest-guess-ready");
      const visual = opponentChest.querySelector(".chest-visual");
      if (visual) {
        visual.innerHTML = "";
        const wrap = document.createElement("div");
        wrap.className = "chest-reveal-card";
        wrap.appendChild(face.cloneNode(true));
        visual.appendChild(wrap);
      }
      const hint = opponentChest.querySelector(".chest-hint");
      if (hint) hint.textContent = name;
    }

    if (winOverlay) {
      const faceSlot = winOverlay.querySelector(".lose-reveal-face");
      const nameEl = winOverlay.querySelector(".lose-reveal-name");
      const revealBox = winOverlay.querySelector(".lose-opponent-reveal");
      if (faceSlot) {
        faceSlot.innerHTML = "";
        faceSlot.appendChild(face.cloneNode(true));
      }
      if (nameEl) nameEl.textContent = name;
      if (revealBox) {
        revealBox.classList.remove("hidden");
        revealBox.removeAttribute("aria-hidden");
      }
    }

    if (well) {
      const tile = well.querySelector(".card-tile");
      if (tile) {
        tile.classList.remove("is-down", "flip-anim");
        tile.classList.add("revealed-secret");
      }
      well.classList.add("opponent-secret-revealed");
    }
  }

  function evaluateCustomQuestion(text, secretName) {
    const q = String(text || "").toLowerCase().trim();
    if (!q) return Math.random() > 0.5;
    if (/jongen|man|mannelijk|zijn het een jongen|heeft hij/.test(q)) {
      return evaluateQuestion("boy", secretName);
    }
    if (/meisje|vrouw|vrouwelijk|zij|is het een meisje/.test(q)) {
      return evaluateQuestion("girl", secretName);
    }
    if (/3 letter|drie letter|kort/.test(q)) return evaluateQuestion("short", secretName);
    if (/4 letter|lang|langer/.test(q)) return evaluateQuestion("long", secretName);
    if (/a.?m|begin.*[a-m]/i.test(q)) return evaluateQuestion("a-m", secretName);
    if (/n.?z|begin.*[n-z]/i.test(q)) return evaluateQuestion("n-z", secretName);
    return Math.random() > 0.5;
  }

  function evaluateQuestion(questionId, secretName) {
    const n = secretName.trim();
    switch (questionId) {
      case "boy":
        return MALE_NAMES.test(n);
      case "girl":
        return FEMALE_NAMES.test(n);
      case "short":
        return n.length <= 3;
      case "long":
        return n.length >= 4;
      case "a-m":
        return /^[A-M]/i.test(n);
      case "n-z":
        return /^[N-Z]/i.test(n);
      default:
        return Math.random() > 0.5;
    }
  }

  function answerText(yes) {
    return yes ? tFn("answerYes") : tFn("answerNo");
  }

  function setPostAnswerBoardMode(active) {
    if (screenGame) screenGame.classList.toggle("phase-post-switch", Boolean(active));
    if (questionPanel) questionPanel.classList.toggle("mode-switch-active", Boolean(active));
  }

  function bindWellClickHandlers() {
    refreshWells();
    state.playerWells.forEach((well, index) => {
      if (well.dataset.flipBound === "1") return;
      well.dataset.flipBound = "1";
      well.addEventListener(
        "click",
        (e) => {
          e.stopPropagation();
          refreshWells();
          const idx = state.playerWells.indexOf(well);
          if (idx >= 0) onPlayerWellClick(idx);
        },
        { passive: false }
      );
    });
  }

  function enableCardFlips() {
    refreshWells();
    state.playerWells.forEach((w, i) => {
      const tile = w.querySelector(".card-tile");
      if (tile && i !== state.secretIndex && !tile.classList.contains("revealed-secret")) {
        w.classList.add("interactive");
        w.classList.toggle("is-down-slot", isCardFaceDown(tile));
        w.setAttribute(
          "aria-label",
          isCardFaceDown(tile) ? tFn("cardTapToRestore") : tFn("cardTapToFlip")
        );
      } else {
        w.classList.remove("interactive", "is-down-slot");
        w.removeAttribute("aria-label");
      }
    });
    bindWellClickHandlers();
    if (opponentChest) opponentChest.classList.remove("chest-guess-ready");
  }

  function enableMyFlips() {
    enableCardFlips();
    if (opponentChest && state.phase === PHASE.MY_TURN) {
      opponentChest.classList.add("chest-guess-ready");
    }
  }

  function setQuestionInputEnabled(enabled) {
    if (questionInput) questionInput.disabled = !enabled;
    if (btnSendQuestion) btnSendQuestion.disabled = !enabled;
  }

  function showQuestionPanel(mode) {
    if (!questionPanel) return;
    questionPanel.classList.remove("hidden", "mode-ask", "mode-answer");
    questionPanel.classList.add(mode === "answer" ? "mode-answer" : "mode-ask");
    if (mode === "ask") {
      const canAsk = state.phase === PHASE.MY_TURN && !state.askedThisTurn;
      setQuestionInputEnabled(canAsk);
      if (questionInput && canAsk) {
        questionInput.value = "";
        setTimeout(() => questionInput.focus(), 80);
      }
    }
  }

  function hideQuestionPanel() {
    if (questionPanel) {
      questionPanel.classList.add("hidden");
      questionPanel.classList.remove("mode-post", "mode-answer", "mode-ask");
    }
    setQuestionInputEnabled(false);
    hidePostAnswerPanel();
  }

  function normalizeQuestion(text) {
    return String(text || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");
  }

  function isDuplicateQuestion(text) {
    const key = normalizeQuestion(text);
    return key.length > 0 && state.usedQuestions.includes(key);
  }

  function recordQuestion(text) {
    const key = normalizeQuestion(text);
    if (key && !state.usedQuestions.includes(key)) {
      state.usedQuestions.push(key);
    }
  }

  function clearPostAnswerTimers() {
    if (postAnswerTimeoutId) {
      clearTimeout(postAnswerTimeoutId);
      postAnswerTimeoutId = null;
    }
    if (postAnswerIntervalId) {
      clearInterval(postAnswerIntervalId);
      postAnswerIntervalId = null;
    }
  }

  function setPostAnswerTimerDisplay(seconds) {
    if (postAnswerTimerEl) {
      postAnswerTimerEl.textContent = String(Math.max(0, seconds));
    }
  }

  function runCountdownTimer(seconds, onTick, onDone) {
    clearPostAnswerTimers();
    let left = seconds;
    setPostAnswerTimerDisplay(left);
    onTick(left);
    postAnswerIntervalId = setInterval(() => {
      left -= 1;
      setPostAnswerTimerDisplay(left);
      onTick(left);
      if (left <= 0) {
        clearInterval(postAnswerIntervalId);
        postAnswerIntervalId = null;
      }
    }, 1000);
    postAnswerTimeoutId = setTimeout(() => {
      clearPostAnswerTimers();
      onDone();
    }, seconds * 1000);
  }

  function hidePostAnswerPanel() {
    if (!questionPanel) return;
    const post = questionPanel.querySelector(".question-bar-post");
    if (post) {
      post.classList.add("hidden");
      post.classList.remove("mode-switch", "mode-flip", "mode-free");
    }
    questionPanel.classList.remove("mode-post");
  }

  function showPostAnswerPanel(mode) {
    if (!questionPanel) return;
    const post = questionPanel.querySelector(".question-bar-post");
    if (!post) return;
    questionPanel.classList.remove("hidden", "mode-ask", "mode-answer");
    questionPanel.classList.add("mode-post");
    post.classList.remove("hidden", "mode-switch", "mode-flip", "mode-free");
    post.classList.add(
      mode === "switch" ? "mode-switch" : mode === "flip" ? "mode-flip" : "mode-free"
    );
    if (btnSwitchTurn) btnSwitchTurn.classList.toggle("hidden", mode !== "switch");
    if (btnEndFlipPhase) btnEndFlipPhase.classList.toggle("hidden", mode !== "free");
    if (postAnswerTimerEl) {
      postAnswerTimerEl.classList.toggle("hidden", mode === "free");
    }
    if (postAnswerLabelEl) {
      const key =
        mode === "switch"
          ? "switchPrompt"
          : mode === "flip"
            ? "flipRushPrompt"
            : "flipFreePrompt";
      postAnswerLabelEl.textContent = tFn(key);
    }
  }

  function onSwitchTurnClick() {
    if (state.phase !== PHASE.POST_ANSWER_SWITCH) return;
    finishPostAnswerSwitchPhase();
  }

  function beginPostAnswerFlipRush() {
    if (
      state.phase !== PHASE.POST_ANSWER_SWITCH &&
      state.phase !== PHASE.POST_ANSWER_FLIP_RUSH
    ) {
      return;
    }
    state.phase = PHASE.POST_ANSWER_FLIP_RUSH;
    showPostAnswerPanel("flip");
    enableMyFlips();
    setBanner(tFn("flipRushPrompt"));
    runCountdownTimer(
      POST_ANSWER_FLIP_SEC,
      () => {},
      () => beginPostAnswerFlipFree()
    );
  }

  function beginPostAnswerFlipFree() {
    state.phase = PHASE.POST_ANSWER_FLIP_FREE;
    clearPostAnswerTimers();
    showPostAnswerPanel("free");
    enableMyFlips();
    setBanner(tFn("flipFreePrompt"));
  }

  function endPostAnswerPhase() {
    if (
      state.phase !== PHASE.POST_ANSWER_FLIP_RUSH &&
      state.phase !== PHASE.POST_ANSWER_FLIP_FREE
    ) {
      return;
    }
    clearPostAnswerTimers();
    hidePostAnswerPanel();
    clearInteractivity();
    if (state.online && window.WieIsHetOnline) {
      window.WieIsHetOnline.sendTurnHandoff();
    }
    beginTheirTurn();
  }

  function finishPostAnswerSwitchPhase() {
    if (state.phase !== PHASE.POST_ANSWER_SWITCH) return;
    clearPostAnswerTimers();
    hidePostAnswerPanel();
    setPostAnswerBoardMode(false);
    clearInteractivity();
    if (state.online && window.WieIsHetOnline) {
      window.WieIsHetOnline.send({ type: "switchTurn" });
    }
    beginTheirTurn();
  }

  function beginPostAnswerSwitchPhase() {
    state.phase = PHASE.POST_ANSWER_SWITCH;
    setScreenTurn("my");
    setPostAnswerBoardMode(true);
    enableCardFlips();
    showPostAnswerPanel("switch");
    enableCardFlips();
    setBanner(tFn("switchPrompt"));
    runCountdownTimer(
      POST_ANSWER_SWITCH_SEC,
      () => {},
      () => {
        if (state.phase === PHASE.POST_ANSWER_SWITCH) {
          finishPostAnswerSwitchPhase();
        }
      }
    );
  }

  function beginAnswerQuestion(questionText, questionId) {
    state.phase = PHASE.ANSWER_QUESTION;
    state.pendingQuestion = { text: questionText, id: questionId };
    setScreenTurn("question");
    enableCardFlips();
    setBanner(questionText);
    showQuestionPanel("answer");
    const qDisplay = questionPanel?.querySelector(".opponent-question-text");
    if (qDisplay) qDisplay.textContent = questionText;
  }

  function finishQuestionAsAsker(yes, questionText) {
    setBanner('"' + questionText + '"');
    showOpponentAnswer(answerText(yes), yes);
    setTimeout(() => {
      setBanner(tFn("opponentAnswered") + " " + answerText(yes));
    }, 400);
    setTimeout(() => {
      hideOpponentAnswer();
      beginPostAnswerSwitchPhase();
    }, 1200);
  }

  function submitPlayerQuestion() {
    if (state.phase !== PHASE.MY_TURN || !questionInput || state.askedThisTurn) return;
    const questionText = questionInput.value.trim();
    if (!questionText) {
      questionInput.focus();
      return;
    }
    if (isDuplicateQuestion(questionText)) {
      setBanner(tFn("duplicateQuestion"));
      questionInput.focus();
      return;
    }
    recordQuestion(questionText);
    state.askedThisTurn = true;
    hideQuestionPanel();
    clearInteractivity();
    if (state.online && window.WieIsHetOnline) {
      state.phase = PHASE.WAIT_ANSWER;
      state.pendingQuestionText = questionText;
      window.WieIsHetOnline.send({ type: "question", questionId: "custom", questionText });
      setBanner('"' + questionText + '" — ' + tFn("waitAnswer"));
      questionInput.value = "";
      return;
    }
    const secretName = getSecretName(state.opponentSecretIndex);
    const yes = evaluateCustomQuestion(questionText, secretName);
    questionInput.value = "";
    finishQuestionAsAsker(yes, questionText);
  }

  function onAnswerChipClick(btn) {
    if (state.phase !== PHASE.ANSWER_QUESTION) return;
    const yes = btn.dataset.answer === "yes";
    hideQuestionPanel();
    hideOpponentAnswer();
    if (state.online && window.WieIsHetOnline) {
      window.WieIsHetOnline.send({ type: "answer", yes });
      state.phase = PHASE.WAIT_OPPONENT_POST;
      clearInteractivity();
      setBanner(tFn("waitOpponentTurn"));
      return;
    }
    setTimeout(beginMyTurn, 400);
  }

  function endPlayerTurnAfterFlip() {
    state.flippedThisTurn = true;
    hideQuestionPanel();
    if (state.online && window.WieIsHetOnline) {
      window.WieIsHetOnline.sendTurnHandoff();
    }
    beginTheirTurn();
  }

  const AI_QUESTIONS = [
    { id: "boy", text: "Is het een jongen?" },
    { id: "girl", text: "Is het een meisje?" },
    { id: "short", text: "Heeft de naam 3 letters?" },
    { id: "long", text: "Heeft de naam 4 letters of meer?" },
    { id: "a-m", text: "Begint de naam met A–M?" },
    { id: "n-z", text: "Begint de naam met N–Z?" },
  ];

  const BOT_CONFIG = {
    easy: { flipDelay: 1900, askDelay: 1500, smartQuestion: false, smartFlip: false, mistakeChance: 0.4 },
    medium: { flipDelay: 1100, askDelay: 900, smartQuestion: false, smartFlip: false, mistakeChance: 0 },
    hard: { flipDelay: 850, askDelay: 650, smartQuestion: true, smartFlip: true, mistakeChance: 0 },
  };

  function getBotConfig() {
    return BOT_CONFIG[state.botDifficulty] || BOT_CONFIG.medium;
  }

  function getUprightPlayerIndices() {
    return state.playerWells
      .map((w, i) => ({ w, i }))
      .filter(({ w }) => {
        const tile = w.querySelector(".card-tile");
        return tile && !tile.classList.contains("is-down");
      })
      .map(({ i }) => i);
  }

  function pickSmartQuestion() {
    const upright = getUprightPlayerIndices();
    if (upright.length <= 1) {
      return AI_QUESTIONS[Math.floor(Math.random() * AI_QUESTIONS.length)];
    }
    let bestQ = AI_QUESTIONS[0];
    let bestScore = Infinity;
    for (const q of AI_QUESTIONS) {
      let yes = 0;
      for (const i of upright) {
        if (evaluateQuestion(q.id, getSecretName(i))) yes++;
      }
      const no = upright.length - yes;
      if (yes === 0 || no === 0) continue;
      const score = Math.abs(yes - no);
      if (score < bestScore) {
        bestScore = score;
        bestQ = q;
      }
    }
    return bestQ;
  }

  function aiAskPlayerQuestion() {
    const cfg = getBotConfig();
    let pick;
    if (cfg.smartQuestion && Math.random() > cfg.mistakeChance) {
      pick = pickSmartQuestion();
    } else {
      pick = AI_QUESTIONS[Math.floor(Math.random() * AI_QUESTIONS.length)];
    }
    beginAnswerQuestion(pick.text, pick.id);
  }

  function maybeBothSecretsReady() {
    if (!state.localSecretReady) return;
    if (state.online && !state.remoteSecretReady) {
      setBanner(tFn("phaseWaitOpponent"));
      return;
    }
    if (!state.online) {
      setTimeout(simulateAiSecretPick, 900);
      return;
    }
    setTimeout(() => {
      if (state.isHost) beginMyTurn();
      else beginTheirTurn();
    }, 500);
  }

  function simulateAiSecretPick() {
    const upright = state.opponentWells
      .map((w, i) => ({ w, i }))
      .filter(({ w }) => !w.querySelector(".card-tile.is-down"));
    if (upright.length) {
      const pick = upright[Math.floor(Math.random() * upright.length)];
      state.opponentSecretIndex = pick.i;
    }
    setTimeout(beginMyTurn, 700);
  }

  function beginMyTurn() {
    clearPostAnswerTimers();
    hidePostAnswerPanel();
    hideOpponentAnswer();
    state.phase = PHASE.MY_TURN;
    state.flippedThisTurn = false;
    state.askedThisTurn = false;
    setScreenTurn("my");
    setBanner(tFn("turnPlayer"));
    enableMyFlips();
    showQuestionPanel("ask");
  }

  function beginTheirTurn() {
    clearPostAnswerTimers();
    hideQuestionPanel();
    state.phase = PHASE.THEIR_TURN;
    state.askedThisTurn = false;
    setScreenTurn("their");
    setBanner(tFn("turnOpponent"));
    if (opponentZone) opponentZone.classList.add("turn-active");
    if (!state.online) {
      const cfg = getBotConfig();
      setTimeout(aiOpponentFlip, cfg.flipDelay);
    }
  }

  function aiOpponentFlip() {
    const cfg = getBotConfig();
    let candidates = state.opponentWells
      .map((w, i) => ({ w, i }))
      .filter(({ w }) => !w.querySelector(".card-tile.is-down"));
    if (
      cfg.smartFlip &&
      state.opponentSecretIndex != null &&
      candidates.length > 1 &&
      Math.random() > cfg.mistakeChance
    ) {
      candidates = candidates.filter(({ i }) => i !== state.opponentSecretIndex);
    }
    if (candidates.length) {
      const { w } = candidates[Math.floor(Math.random() * candidates.length)];
      flipWell(w, true);
    }
    if (opponentZone) opponentZone.classList.remove("turn-active");
    setTimeout(aiAskPlayerQuestion, cfg.askDelay);
  }

  function canGuessNow() {
    return state.phase === PHASE.MY_TURN;
  }

  function beginGuessMode() {
    if (!canGuessNow()) return;
    hideQuestionPanel();
    state.phase = PHASE.GUESS;
    setScreenTurn("guess");
    clearInteractivity();
    setBanner(tFn("guessPrompt"));
    state.playerWells.forEach((w, i) => {
      const tile = w.querySelector(".card-tile");
      if (tile && !tile.classList.contains("is-down")) {
        w.classList.add("guess-mode", "interactive");
      }
    });
  }

  function showEndActions() {
    const actions = winOverlay?.querySelector(".win-end-actions");
    if (actions) actions.classList.remove("hidden");
  }

  function hideEndOverlay() {
    if (winOverlay) {
      winOverlay.classList.add("hidden");
      winOverlay.classList.remove("active", "lose");
    }
    const actions = winOverlay?.querySelector(".win-end-actions");
    if (actions) actions.classList.add("hidden");
    if (screenGame) screenGame.classList.remove("game-won");
    clearOpponentReveal();
  }

  function showWin() {
    state.phase = PHASE.WON;
    clearInteractivity();
    hideQuestionPanel();
    hideBanner();
    clearOpponentReveal();
    if (winOverlay) {
      winOverlay.classList.remove("hidden", "lose");
      winOverlay.classList.add("active");
      const title = winOverlay.querySelector(".win-title");
      const sub = winOverlay.querySelector(".win-sub");
      if (title) title.textContent = tFn("youWon");
      if (sub) sub.textContent = tFn("winSub");
    }
    if (screenGame) screenGame.classList.add("game-won");
    showEndActions();
  }

  function showLose(revealIndex) {
    state.phase = PHASE.LOST;
    clearInteractivity();
    hideQuestionPanel();
    hideBanner();
    revealOpponentSecret(revealIndex);
    if (winOverlay) {
      winOverlay.classList.remove("hidden");
      winOverlay.classList.add("active", "lose");
      const title = winOverlay.querySelector(".win-title");
      const sub = winOverlay.querySelector(".win-sub");
      if (title) title.textContent = tFn("youLost");
      if (sub) sub.textContent = tFn("loseRevealSub");
    }
    showEndActions();
  }

  function onGuessCard(index) {
    if (state.phase !== PHASE.GUESS) return;
    clearInteractivity();
    if (index === state.opponentSecretIndex) {
      if (state.online && window.WieIsHetOnline) {
        window.WieIsHetOnline.send({
          type: "win",
          secretIndex: state.opponentSecretIndex,
        });
      }
      showWin();
    } else {
      setBanner(tFn("guessWrong"));
      setTimeout(showLose, 1200);
    }
  }

  function onPlayerWellClick(index) {
    const well = state.playerWells[index];
    if (!well) return;

    if (state.phase === PHASE.GUESS) {
      onGuessCard(index);
      return;
    }

    if (state.phase === PHASE.PICK_SECRET) {
      if (state.secretIndex !== null) return;
      state.secretIndex = index;
      state.localSecretReady = true;
      state.phase = PHASE.OPPONENT_PICK;
      clearInteractivity();
      well.classList.add("picked-secret");
      cloneCardToSecret(well);
      setScreenTurn("their");
      setBanner(tFn("phaseOpponentPick"));
      if (state.online && window.WieIsHetOnline) {
        WieIsHetOnline.sendSecretReady();
      }
      maybeBothSecretsReady();
      return;
    }

    if (index === state.secretIndex) return;

    if (
      state.phase === PHASE.MY_TURN ||
      state.phase === PHASE.ANSWER_QUESTION ||
      state.phase === PHASE.POST_ANSWER_SWITCH ||
      state.phase === PHASE.POST_ANSWER_FLIP_RUSH ||
      state.phase === PHASE.POST_ANSWER_FLIP_FREE
    ) {
      const result = togglePlayerWell(well, true);
      if (!result) return;
      syncPlayerFlipOnline(index, result === "down");
      enableCardFlips();
    }
  }

  function onOnlineMessage(msg) {
    if (!msg || !msg.type) return;
    if (msg.type === "secretReady") {
      state.remoteSecretReady = true;
      maybeBothSecretsReady();
    }
    if (msg.type === "flip" && typeof msg.index === "number") {
      const isDown = msg.isDown !== false;
      flipOpponentAt(msg.index, true, isDown);
      if (opponentZone) opponentZone.classList.remove("turn-active");
    }
    if (msg.type === "question" && msg.questionText) {
      beginAnswerQuestion(msg.questionText, msg.questionId);
    }
    if (msg.type === "answer" && typeof msg.yes === "boolean") {
      if (state.phase === PHASE.WAIT_ANSWER) {
        const qText = state.pendingQuestionText || "";
        finishQuestionAsAsker(msg.yes, qText);
      }
    }
    if (msg.type === "switchTurn") {
      if (state.phase === PHASE.WAIT_OPPONENT_POST) {
        beginMyTurn();
      }
    }
    if (msg.type === "turnHandoff") {
      if (
        state.phase === PHASE.THEIR_TURN ||
        state.phase === PHASE.WAIT_OPPONENT_POST
      ) {
        beginMyTurn();
      }
    }
    if (msg.type === "win") {
      if (typeof msg.secretIndex === "number") {
        state.opponentSecretIndex = msg.secretIndex;
      }
      showLose(msg.secretIndex);
    }
    if (msg.type === "lose") showLose(msg.secretIndex);
    if (msg.type === "playAgain" && state.isHost) {
      document.dispatchEvent(new CustomEvent("wieishet-play-again"));
    }
  }

  function beginPickSecretPhase() {
    refreshWells();
    state.phase = PHASE.PICK_SECRET;
    state.secretIndex = null;
    state.opponentSecretIndex = null;
    state.localSecretReady = false;
    state.remoteSecretReady = false;
    state.usedQuestions = [];
    clearPostAnswerTimers();
    if (secretSlot) {
      secretSlot.innerHTML = "";
      secretSlot.classList.remove("visible");
    }
    if (winOverlay) {
      winOverlay.classList.add("hidden");
      winOverlay.classList.remove("active", "lose");
    }
    if (screenGame) screenGame.classList.remove("game-won");
    state.playerWells.forEach((w) => {
      w.classList.remove("picked-secret", "interactive", "guess-mode");
    });
    hideQuestionPanel();
    hideOpponentAnswer();
    clearOpponentReveal();
    setScreenTurn("pick");
    setBanner(tFn("phasePickSecret"));
    state.playerWells.forEach((w) => w.classList.add("interactive"));
  }

  function refreshWells() {
    state.playerWells = Array.from(
      document.querySelectorAll("#player-board .card-well")
    );
    state.opponentWells = Array.from(
      document.querySelectorAll("#opponent-board .card-well")
    );
    state.playerWells.forEach((well, index) => {
      well.dataset.cardIndex = String(index);
    });
  }

  function handleBoardClick(e) {
    const board = document.getElementById("player-board");
    if (!board) return;
    const well = e.target.closest(".card-well");
    if (!well || !board.contains(well)) return;
    e.preventDefault();
    e.stopPropagation();
    refreshWells();
    const idx = state.playerWells.indexOf(well);
    if (idx >= 0) onPlayerWellClick(idx);
  }

  function wireBoards() {
    refreshWells();
    const board = document.getElementById("player-board");
    const gameTable = document.getElementById("game-table");
    if (board && board.dataset.playWired !== "1") {
      board.dataset.playWired = "1";
      board.addEventListener("click", handleBoardClick);
    }
    if (gameTable && gameTable.dataset.playWired !== "1") {
      gameTable.dataset.playWired = "1";
      gameTable.addEventListener("click", handleBoardClick);
    }
    bindWellClickHandlers();
  }

  function wireQuestionPanel() {
    if (!questionPanel || questionPanel.dataset.wired === "1") return;
    questionPanel.dataset.wired = "1";
    questionPanel.querySelectorAll(".answer-chip").forEach((btn) => {
      btn.addEventListener("click", () => onAnswerChipClick(btn));
    });
    if (btnSendQuestion) {
      btnSendQuestion.addEventListener("click", submitPlayerQuestion);
    }
    if (questionInput) {
      questionInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submitPlayerQuestion();
        }
      });
    }
    btnSwitchTurn = document.getElementById("btn-switch-turn");
    btnEndFlipPhase = document.getElementById("btn-end-flip-phase");
    postAnswerTimerEl = document.getElementById("post-answer-timer");
    postAnswerLabelEl = document.getElementById("post-answer-label");
    if (btnSwitchTurn) {
      btnSwitchTurn.addEventListener("click", onSwitchTurnClick);
    }
    if (btnEndFlipPhase) {
      btnEndFlipPhase.addEventListener("click", endPostAnswerPhase);
    }
  }

  function wireChest() {
    if (!opponentChest || opponentChest.dataset.wired === "1") return;
    opponentChest.dataset.wired = "1";
    opponentChest.addEventListener("click", () => {
      if (canGuessNow()) beginGuessMode();
    });
  }

  function reset() {
    setPostAnswerBoardMode(false);
    state.phase = PHASE.IDLE;
    state.secretIndex = null;
    state.opponentSecretIndex = null;
    state.localSecretReady = false;
    state.remoteSecretReady = false;
    state.askedThisTurn = false;
    state.flippedThisTurn = false;
    state.pendingQuestionText = "";
    state.usedQuestions = [];
    clearPostAnswerTimers();
    clearInteractivity();
    clearOpponentReveal();
    setScreenTurn(null);
    hideBanner();
    hideQuestionPanel();
    hideOpponentAnswer();
    if (secretSlot) {
      secretSlot.innerHTML = "";
      secretSlot.classList.remove("visible");
    }
    hideEndOverlay();
  }

  let unsubOnline = null;

  window.WieIsHetPlay = {
    init(opts) {
      tFn = opts.t || tFn;
      cardNames = opts.cardNames || [];
      screenGame = opts.screenGame;
      turnBanner = opts.turnBanner;
      secretSlot = opts.secretSlot;
      opponentZone = opts.opponentZone;
      opponentChest = opts.opponentChest;
      opponentAnswerEl = opts.opponentAnswerEl;
      questionPanel = opts.questionPanel;
      questionInput = document.getElementById("question-input");
      btnSendQuestion = document.getElementById("btn-send-question");
      winOverlay = opts.winOverlay;
      state.online = Boolean(opts.online);
      state.isHost = opts.isHost !== false;
      state.botDifficulty = opts.botDifficulty || "medium";
      wireBoards();
      wireQuestionPanel();
      wireChest();
      saveChestDefault();
      if (unsubOnline) unsubOnline();
      unsubOnline = null;
      if (state.online && window.WieIsHetOnline) {
        unsubOnline = WieIsHetOnline.onMessage(onOnlineMessage);
      }
    },
    wireBoards,
    beginPickSecretPhase,
    reset,
    hideEndOverlay,
    getPhase: () => state.phase,
    handleOnlineMessage: onOnlineMessage,
  };
})();
