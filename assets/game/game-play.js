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
    isRanked: false,
    rankedOpponentRating: 1000,
    lastRankResult: null,
    /** Indices op het bord die nog jouw geheim kunnen zijn (solo-bot). */
    botSuspects: null,
    botUsedQuestionIds: [],
    pendingGuessIndex: null,
  };

  const POST_ANSWER_SWITCH_SEC = 10;
  const POST_ANSWER_FLIP_SEC = 10;

  let screenGame = null;
  let turnBanner = null;
  let secretSlot = null;
  let opponentZone = null;
  let opponentChest = null;
  let opponentAnswerEl = null;
  let gameQuickActions = null;
  let gameActionsAnswer = null;
  let gameActionsPost = null;
  let gameActionsQuestionText = null;
  let questionDrawer = null;
  let btnToggleQuestionDrawer = null;
  let answerDrawer = null;
  let answerDrawerQuestion = null;
  let flipPhaseBar = null;
  let flipPhaseTimerEl = null;
  let answerRevealOverlay = null;
  let answerRevealText = null;
  let questionInput = null;
  let btnSendQuestion = null;
  let answerRevealTimeoutId = null;
  let turnBadge = null;
  let turnBadgeText = null;
  let quickQuestionsEl = null;
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
    /^(MrBeast|PewDiePie|Markiplier|Jacksepticeye|KSI|Ninja|Dream|DanTDM|Ludwig|xQc|IShowSpeed|MKBHD|Logan Paul|TommyInnit|CoryxKenshin|Rhett)$/i;
  const FEMALE_NAMES =
    /^(Pokimane|Valkyrae|SSSniperWolf|Emma|Nikkie|Safiya|Rosanna|Charli|Addison|Lilly|Liza|Jaiden|Michelle|Wengie|Miranda|Bethany)$/i;

  function isMaleCharacter(name) {
    if (window.WieCharacterArt && typeof WieCharacterArt.isGirl === "function") {
      return !WieCharacterArt.isGirl(name);
    }
    return MALE_NAMES.test(String(name).trim());
  }

  function isFemaleCharacter(name) {
    if (window.WieCharacterArt && typeof WieCharacterArt.isGirl === "function") {
      return WieCharacterArt.isGirl(name);
    }
    return FEMALE_NAMES.test(String(name).trim());
  }

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

  function setTurnBadge(mode) {
    if (!turnBadge || !turnBadgeText) {
      turnBadge = document.getElementById("game-turn-badge");
      turnBadgeText = document.getElementById("game-turn-badge-text");
    }
    if (!turnBadge || !turnBadgeText) return;
    turnBadge.classList.remove("is-you", "is-opponent", "is-pick", "is-flip");
    if (!mode || mode === "hidden") {
      turnBadge.classList.add("hidden");
      return;
    }
    turnBadge.classList.remove("hidden");
    if (mode === "my") {
      turnBadge.classList.add("is-you");
      turnBadgeText.textContent = tFn("turnBadgeYou");
    } else if (mode === "their") {
      turnBadge.classList.add("is-opponent");
      turnBadgeText.textContent = tFn("turnBadgeOpponent");
    } else if (mode === "pick") {
      turnBadge.classList.add("is-pick");
      turnBadgeText.textContent = tFn("phasePickSecret");
    } else if (mode === "flip") {
      turnBadge.classList.add("is-flip");
      turnBadgeText.textContent = tFn("turnBadgeFlip");
    }
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
    if (mode === "pick") {
      screenGame.classList.add("phase-pick-secret");
      setTurnBadge("pick");
    } else if (mode === "my") {
      screenGame.classList.add("turn-player");
      setTurnBadge("my");
    } else if (mode === "their") {
      screenGame.classList.add("turn-opponent");
      setTurnBadge("their");
    } else if (mode === "question") {
      screenGame.classList.add("phase-question");
      setTurnBadge("their");
    } else if (mode === "guess") {
      screenGame.classList.add("phase-guess");
      setTurnBadge("my");
    } else {
      setTurnBadge("hidden");
    }
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
    if (window.WieSounds) WieSounds.play("flip");
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

  function useCompactSecretReveal() {
    return window.matchMedia(
      "(max-width: 900px), ((hover: none) or (pointer: coarse)) and (max-width: 1180px)"
    ).matches;
  }

  function cloneCardToSecret(well) {
    if (!secretSlot) return;
    Array.from(secretSlot.children).forEach((child) => {
      if (!child.classList.contains("secret-card-pedestal")) {
        child.remove();
      }
    });
    const face = well.querySelector(".card-face");
    if (!face) return;
    secretSlot.appendChild(face.cloneNode(true));
    secretSlot.classList.remove("is-reveal", "is-shrink", "secret-reveal-skip-hero");
    secretSlot.classList.add("visible");
    if (screenGame) {
      screenGame.classList.add("has-secret-visible");
    }

    if (useCompactSecretReveal()) {
      secretSlot.classList.add("is-shrink", "secret-reveal-skip-hero");
      if (screenGame) screenGame.classList.remove("secret-reveal-active");
      hideBanner();
      return;
    }

    void secretSlot.offsetWidth;
    secretSlot.classList.add("is-reveal");
    if (screenGame) {
      screenGame.classList.add("secret-reveal-active");
    }
    const heroMs = document.documentElement.classList.contains("wie-phone-landscape-game")
      ? 1100
      : 900;
    const shrinkMs = 650;
    window.setTimeout(() => secretSlot.classList.add("is-shrink"), heroMs);
    window.setTimeout(() => {
      secretSlot.classList.remove("is-reveal", "is-shrink");
      if (screenGame) screenGame.classList.remove("secret-reveal-active");
    }, heroMs + shrinkMs + 80);
    hideBanner();
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

  function hasCreatorTag(name, tag) {
    return (
      window.WieCharacterArt &&
      typeof WieCharacterArt.hasCreatorTag === "function" &&
      WieCharacterArt.hasCreatorTag(name, tag)
    );
  }

  function normalizeQuestion(text) {
    return String(text || "")
      .toLowerCase()
      .trim()
      .replace(/[?!.,;:]+/g, "")
      .replace(/\s+/g, " ");
  }

  function resolveQuestionIdFromText(text) {
    const q = normalizeQuestion(text);
    if (!q) return null;

    for (const item of getAIQuestions()) {
      if (normalizeQuestion(item.text) === q || normalizeQuestion(item.short) === q) {
        return item.id;
      }
    }

    if (
      /\b(jongen|jongens|man|mannelijk|kerel|gast|hem|hij|boy|male|guy)\b/.test(q) ||
      /is het een jongen|zijn het een jongen|is hij/.test(q)
    ) {
      return "boy";
    }
    if (
      /\b(meisje|meisjes|meid|meiden|vrouw|vrouwelijk|dame|zij|girl|female|woman|gal)\b/.test(q) ||
      /is het een meisje|is het een meid|is ze|is zij|is het een vrouw/.test(q)
    ) {
      return "girl";
    }
    if (
      /\b(donker|dark|zwart|black)\b/.test(q) &&
      /\b(haar|hair|haarkleur)\b/.test(q)
    ) {
      return "dark-hair";
    }
    if (
      /\b(blond|blonde|licht|light|grijs|gray|grey)\b/.test(q) &&
      /\b(haar|hair)\b/.test(q)
    ) {
      return "light-hair";
    }
    if (
      /\b(donker|dark|zwart|black|bruin)\b/.test(q) &&
      /\b(huid|huids|huiskleur|skin|teint)\b/.test(q)
    ) {
      return "dark-skin";
    }
    if (
      /\b(licht|light|blank|wit|white|pale|fair)\b/.test(q) &&
      /\b(huid|huids|huiskleur|skin|teint)\b/.test(q)
    ) {
      return "light-skin";
    }
    if (/\b(bril|glasses|spectacles)\b/.test(q)) return "glasses";
    if (/\b(baard|beard)\b/.test(q)) return "beard";
    if (/gaming|gamer|game.?youtuber|speelt games|plays games|stream/.test(q)) {
      return "gaming";
    }
    if (/nederlands|dutch|nederland|\bdutch\b|nederlandse/.test(q)) {
      return "dutch";
    }
    if (/minecraft|\bmc\b/.test(q)) {
      return "minecraft";
    }
    if (/beauty|make.?up|diy|asmr|nagellak/.test(q)) {
      return "beauty";
    }
    if (/vlog|vlogger|lifestyle/.test(q)) {
      return "vlog";
    }
    if (/tech|gadget|telefoon|smartphone|\btech\b/.test(q)) {
      return "tech";
    }
    if (/3 letter|drie letter|kort/.test(q)) return "short";
    if (/4 letter|lang|langer|lange naam/.test(q)) return "long";
    if (/a.?m|begin.*[a-m]/.test(q)) return "a-m";
    if (/n.?z|begin.*[n-z]/.test(q)) return "n-z";
    return null;
  }

  function evaluateVisualQuestion(text, secretName) {
    if (
      window.WieCharacterArt &&
      typeof WieCharacterArt.answerVisualQuestion === "function"
    ) {
      return WieCharacterArt.answerVisualQuestion(text, secretName);
    }
    return null;
  }

  function evaluateCustomQuestion(text, secretName) {
    const visual = evaluateVisualQuestion(text, secretName);
    if (visual !== null) return visual;
    const questionId = resolveQuestionIdFromText(text);
    if (questionId) {
      return evaluateQuestion(questionId, secretName);
    }
    return false;
  }

  function evaluateQuestion(questionId, secretName) {
    const n = secretName.trim();
    const art = window.WieCharacterArt;
    switch (questionId) {
      case "boy":
        return isMaleCharacter(n);
      case "girl":
        return isFemaleCharacter(n);
      case "gaming":
        return hasCreatorTag(n, "gaming");
      case "dutch":
        return hasCreatorTag(n, "dutch");
      case "minecraft":
        return hasCreatorTag(n, "minecraft");
      case "beauty":
        return hasCreatorTag(n, "beauty");
      case "vlog":
        return hasCreatorTag(n, "vlog");
      case "tech":
        return hasCreatorTag(n, "tech");
      case "dark-hair":
        return art && typeof art.hasDarkHair === "function" ? art.hasDarkHair(n) : false;
      case "light-hair":
        return art && typeof art.hasLightHair === "function" ? art.hasLightHair(n) : false;
      case "dark-skin":
        return art && typeof art.hasDarkSkin === "function" ? art.hasDarkSkin(n) : false;
      case "light-skin":
        return art && typeof art.hasLightSkin === "function" ? art.hasLightSkin(n) : false;
      case "glasses":
        return art && typeof art.hasGlasses === "function" ? art.hasGlasses(n) : false;
      case "beard":
        return art && typeof art.hasBeard === "function" ? art.hasBeard(n) : false;
      case "short":
        return n.length <= 3;
      case "long":
        return n.length >= 4;
      case "a-m":
        return /^[A-M]/i.test(n);
      case "n-z":
        return /^[N-Z]/i.test(n);
      default:
        return false;
    }
  }

  function resolveAnswerForSecret(questionText, secretName, knownQuestionId) {
    const visual = evaluateVisualQuestion(questionText, secretName);
    if (visual !== null) return visual;
    const questionId = knownQuestionId || resolveQuestionIdFromText(questionText);
    if (questionId) {
      return evaluateQuestion(questionId, secretName);
    }
    return evaluateCustomQuestion(questionText, secretName);
  }

  function answerText(yes) {
    return yes ? tFn("answerYes") : tFn("answerNo");
  }

  function setPostAnswerBoardMode(active) {
    if (screenGame) screenGame.classList.toggle("phase-post-switch", Boolean(active));
  }

  function setFlipPhaseUi(active) {
    if (screenGame) screenGame.classList.toggle("phase-flip-active", Boolean(active));
  }

  let lastBoardTouchMs = 0;

  function resolvePlayerWellFromEvent(e) {
    const board = document.getElementById("player-board");
    if (!board || !e.target || !e.target.closest) return null;
    const well = e.target.closest(".card-well");
    if (!well || !board.contains(well)) return null;
    return well;
  }

  function handleBoardTap(e) {
    if (e.type === "touchend") {
      lastBoardTouchMs = Date.now();
      if (e.cancelable) e.preventDefault();
    } else if (e.type === "click" && Date.now() - lastBoardTouchMs < 500) {
      return;
    }
    const well = resolvePlayerWellFromEvent(e);
    if (!well) return;
    e.preventDefault();
    e.stopPropagation();
    refreshWells();
    const idx = state.playerWells.indexOf(well);
    if (idx >= 0) onPlayerWellClick(idx);
  }

  function wirePlayerBoardTap(board) {
    if (!board || board.dataset.playWired === "1") return;
    board.dataset.playWired = "1";
    board.addEventListener("click", handleBoardTap);
    board.addEventListener("touchend", handleBoardTap, { passive: false });
  }

  function bindWellClickHandlers() {
    refreshWells();
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

  function hideGameActions() {
    if (gameQuickActions) gameQuickActions.classList.add("hidden");
    if (gameActionsAnswer) gameActionsAnswer.classList.add("hidden");
    if (gameActionsPost) gameActionsPost.classList.add("hidden");
    if (gameActionsQuestionText) gameActionsQuestionText.classList.add("hidden");
    hidePostAnswerPanel();
  }

  function triggerDrawerPop(el) {
    if (!el) return;
    el.classList.remove("is-popping");
    void el.offsetWidth;
    el.classList.add("is-popping");
    window.setTimeout(() => el.classList.remove("is-popping"), 520);
  }

  function hideQuestionDrawer() {
    if (questionDrawer) {
      questionDrawer.classList.add("hidden");
      questionDrawer.classList.remove("is-collapsed");
      questionDrawer.style.display = "";
    }
    if (screenGame) screenGame.classList.remove("show-question-drawer");
    setQuestionInputEnabled(false);
  }

  function setQuestionDrawerCollapsed(collapsed) {
    resolveDrawerNodes();
    if (!questionDrawer) return;
    questionDrawer.classList.toggle("is-collapsed", collapsed);
    if (btnToggleQuestionDrawer) {
      btnToggleQuestionDrawer.setAttribute("aria-expanded", collapsed ? "false" : "true");
      btnToggleQuestionDrawer.setAttribute(
        "aria-label",
        tFn(collapsed ? "expandQuestionDrawer" : "collapseQuestionDrawer")
      );
    }
    if (collapsed) {
      setQuestionInputEnabled(false);
    } else {
      const canAsk = state.phase === PHASE.MY_TURN && !state.askedThisTurn;
      setQuestionInputEnabled(canAsk);
      if (canAsk && questionInput) {
        window.setTimeout(() => questionInput.focus(), 120);
      }
    }
  }

  function toggleQuestionDrawer() {
    if (!questionDrawer || questionDrawer.classList.contains("hidden")) return;
    setQuestionDrawerCollapsed(!questionDrawer.classList.contains("is-collapsed"));
  }

  function resolveDrawerNodes() {
    if (!questionDrawer) questionDrawer = document.getElementById("question-drawer");
    if (!answerDrawer) answerDrawer = document.getElementById("answer-drawer");
    if (!flipPhaseBar) flipPhaseBar = document.getElementById("flip-phase-bar");
    if (!flipPhaseTimerEl) flipPhaseTimerEl = document.getElementById("flip-phase-timer");
    if (!answerRevealOverlay) answerRevealOverlay = document.getElementById("answer-reveal-overlay");
    if (!answerRevealText) answerRevealText = document.getElementById("answer-reveal-text");
    if (!answerDrawerQuestion) answerDrawerQuestion = document.getElementById("answer-drawer-question");
    if (!questionInput) questionInput = document.getElementById("question-input");
    if (!btnSendQuestion) btnSendQuestion = document.getElementById("btn-send-question");
    if (!quickQuestionsEl) quickQuestionsEl = document.getElementById("quick-questions");
    if (!btnToggleQuestionDrawer) {
      btnToggleQuestionDrawer = document.getElementById("btn-toggle-question-drawer");
    }
    if (!turnBadge) turnBadge = document.getElementById("game-turn-badge");
    if (!turnBadgeText) turnBadgeText = document.getElementById("game-turn-badge-text");
  }

  function renderQuickQuestions() {
    if (!quickQuestionsEl) return;
    quickQuestionsEl.innerHTML = "";
    getAIQuestions().forEach((q) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quick-q-btn";
      btn.textContent = q.short || q.text;
      if (btn.textContent.length > 22) btn.textContent = btn.textContent.slice(0, 20) + "…";
      btn.addEventListener("click", () => {
        if (state.phase !== PHASE.MY_TURN || state.askedThisTurn) return;
        if (questionInput) questionInput.value = q.text;
        submitPlayerQuestion(q.id);
      });
      quickQuestionsEl.appendChild(btn);
    });
  }

  function showQuestionDrawer() {
    resolveDrawerNodes();
    if (!questionDrawer) return;
    hideAnswerDrawer();
    hideFlipPhaseBar();
    hideAnswerReveal();
    hideGameActions();
    hideBanner();
    if (screenGame) screenGame.classList.add("show-question-drawer");
    setTurnBadge("my");
    renderQuickQuestions();
    questionDrawer.classList.remove("hidden");
    questionDrawer.classList.remove("is-collapsed");
    questionDrawer.style.display = "flex";
    if (btnToggleQuestionDrawer) btnToggleQuestionDrawer.setAttribute("aria-expanded", "true");
    triggerDrawerPop(questionDrawer);
    const canAsk = state.phase === PHASE.MY_TURN && !state.askedThisTurn;
    setQuestionInputEnabled(canAsk);
    if (questionInput && canAsk) {
      questionInput.value = "";
      window.setTimeout(() => questionInput.focus(), 180);
    }
  }

  function hideAnswerDrawer() {
    if (answerDrawer) {
      answerDrawer.classList.add("hidden");
      answerDrawer.style.display = "";
    }
  }

  function showAnswerDrawer(questionText) {
    resolveDrawerNodes();
    if (!answerDrawer) return;
    hideQuestionDrawer();
    hideFlipPhaseBar();
    hideGameActions();
    if (answerDrawerQuestion) {
      answerDrawerQuestion.textContent = questionText;
    }
    answerDrawer.classList.remove("hidden");
    answerDrawer.style.display = "flex";
    triggerDrawerPop(answerDrawer);
  }

  function hideFlipPhaseBar() {
    if (flipPhaseBar) flipPhaseBar.classList.add("hidden");
  }

  function showFlipPhaseBar() {
    if (flipPhaseBar) flipPhaseBar.classList.remove("hidden");
  }

  function setFlipPhaseTimerDisplay(seconds) {
    if (flipPhaseTimerEl) {
      flipPhaseTimerEl.textContent = String(Math.max(0, seconds));
    }
  }

  function hideAnswerReveal() {
    if (answerRevealTimeoutId) {
      clearTimeout(answerRevealTimeoutId);
      answerRevealTimeoutId = null;
    }
    if (answerRevealOverlay) {
      answerRevealOverlay.classList.add("hidden");
      answerRevealOverlay.classList.remove("answer-reveal--yes", "answer-reveal--no");
    }
  }

  function showAnswerReveal(yes) {
    if (window.WieSounds) WieSounds.play(yes ? "yes" : "no");
    if (!answerRevealOverlay || !answerRevealText) return;
    hideAnswerReveal();
    answerRevealOverlay.classList.remove("hidden", "answer-reveal--yes", "answer-reveal--no");
    answerRevealOverlay.classList.add(yes ? "answer-reveal--yes" : "answer-reveal--no");
    answerRevealText.textContent = yes ? tFn("answerYes") : tFn("answerNo");
  }

  function setQuestionInputEnabled(enabled) {
    if (questionInput) questionInput.disabled = !enabled;
    if (btnSendQuestion) btnSendQuestion.disabled = !enabled;
  }

  function showQuestionPanel(mode) {
    if (mode === "ask") {
      enableMyFlips();
      if (opponentChest) opponentChest.classList.add("chest-guess-ready");
      showQuestionDrawer();
      return;
    }
    if (mode === "answer") {
      hideQuestionDrawer();
      const qText = state.pendingQuestion?.text || "";
      showAnswerDrawer(qText);
    }
  }

  function hideQuestionPanel() {
    hideQuestionDrawer();
    hideAnswerDrawer();
    hideFlipPhaseBar();
    hideGameActions();
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
    setFlipPhaseTimerDisplay(seconds);
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

  function beginFlipPhaseAfterQuestion() {
    state.phase = PHASE.POST_ANSWER_FLIP_RUSH;
    setScreenTurn("my");
    setFlipPhaseUi(true);
    hideQuestionDrawer();
    hideAnswerDrawer();
    hideAnswerReveal();
    hideGameActions();
    setTurnBadge("flip");
    showFlipPhaseBar();
    enableMyFlips();
    hideBanner();
    runCountdownTimer(
      POST_ANSWER_FLIP_SEC,
      () => {},
      () => {
        if (state.phase === PHASE.POST_ANSWER_FLIP_RUSH) {
          hideFlipPhaseBar();
          setFlipPhaseUi(false);
          setPostAnswerBoardMode(false);
          clearInteractivity();
          if (state.online && window.WieIsHetOnline) {
            window.WieIsHetOnline.sendTurnHandoff();
          }
          beginTheirTurn();
        }
      }
    );
  }

  function hidePostAnswerPanel() {
    if (gameActionsPost) gameActionsPost.classList.add("hidden");
  }

  function showPostAnswerPanel(mode) {
    if (!gameQuickActions || !gameActionsPost) return;
    gameQuickActions.classList.remove("hidden");
    if (gameActionsAnswer) gameActionsAnswer.classList.add("hidden");
    if (gameActionsQuestionText) gameActionsQuestionText.classList.add("hidden");
    gameActionsPost.classList.remove("hidden");
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
    setFlipPhaseUi(false);
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
    setFlipPhaseUi(false);
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
    clearInteractivity();
    hideBanner();
    setTurnBadge("their");
    showQuestionPanel("answer");
  }

  function finishQuestionAsAsker(yes, questionText) {
    hideQuestionDrawer();
    hideOpponentAnswer();
    hideBanner();
    showAnswerReveal(yes);
    answerRevealTimeoutId = window.setTimeout(() => {
      hideAnswerReveal();
      beginFlipPhaseAfterQuestion();
    }, 1600);
  }

  function submitPlayerQuestion(knownQuestionId) {
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
    hideQuestionDrawer();
    clearInteractivity();
    if (state.online && window.WieIsHetOnline) {
      state.phase = PHASE.WAIT_ANSWER;
      state.pendingQuestionText = questionText;
      const qId = knownQuestionId || resolveQuestionIdFromText(questionText) || "custom";
      window.WieIsHetOnline.send({ type: "question", questionId: qId, questionText });
      setBanner('"' + questionText + '" — ' + tFn("waitAnswer"));
      questionInput.value = "";
      return;
    }
    const secretName = getSecretName(state.opponentSecretIndex);
    const yes = resolveAnswerForSecret(questionText, secretName, knownQuestionId);
    questionInput.value = "";
    finishQuestionAsAsker(yes, questionText);
  }

  function getCorrectAnswerForPlayerSecret() {
    if (state.secretIndex == null || !state.pendingQuestion) return null;
    const secretName = getSecretName(state.secretIndex);
    const pq = state.pendingQuestion;
    const knownId = pq.id && pq.id !== "custom" ? pq.id : null;
    return resolveAnswerForSecret(pq.text, secretName, knownId);
  }

  function proceedAfterPlayerAnswer(useYes) {
    hideQuestionPanel();
    hideOpponentAnswer();
    if (!state.online && state.pendingQuestion?.id) {
      narrowBotSuspects(state.pendingQuestion.id, useYes);
    }
    if (state.online && window.WieIsHetOnline) {
      window.WieIsHetOnline.send({ type: "answer", yes: useYes });
      state.phase = PHASE.WAIT_OPPONENT_POST;
      clearInteractivity();
      setBanner(tFn("waitOpponentTurn"));
      return;
    }
    setTimeout(beginMyTurn, 400);
  }

  function onAnswerChipClick(btn) {
    if (state.phase !== PHASE.ANSWER_QUESTION) return;
    const playerYes = btn.dataset.answer === "yes";

    if (!state.online && state.secretIndex != null) {
      const correctYes = getCorrectAnswerForPlayerSecret();
      if (correctYes !== null && playerYes !== correctYes) {
        if (window.WieAnswerCoach && typeof WieAnswerCoach.show === "function") {
          WieAnswerCoach.show({
            question: state.pendingQuestion,
            secretName: getSecretName(state.secretIndex),
            playerYes,
            correctYes,
            onContinue: () => proceedAfterPlayerAnswer(correctYes),
          });
          return;
        }
        proceedAfterPlayerAnswer(correctYes);
        return;
      }
    }

    proceedAfterPlayerAnswer(playerYes);
  }

  function endPlayerTurnAfterFlip() {
    state.flippedThisTurn = true;
    hideQuestionPanel();
    if (state.online && window.WieIsHetOnline) {
      window.WieIsHetOnline.sendTurnHandoff();
    }
    beginTheirTurn();
  }

  function getAIQuestions() {
    return [
      { id: "boy", text: tFn("qBoy"), short: tFn("qBoyShort") },
      { id: "girl", text: tFn("qGirl"), short: tFn("qGirlShort") },
      { id: "gaming", text: tFn("qGaming"), short: tFn("qGamingShort") },
      { id: "dutch", text: tFn("qDutch"), short: tFn("qDutchShort") },
      { id: "minecraft", text: tFn("qMinecraft"), short: tFn("qMinecraftShort") },
      { id: "vlog", text: tFn("qVlog"), short: tFn("qVlogShort") },
    ];
  }

  const BOT_CONFIG = {
    easy: {
      flipDelay: 2200,
      askDelay: 1750,
      smartQuestion: false,
      smartFlip: false,
      flipMistakeChance: 0.55,
      questionMistakeChance: 0,
      guessWhenOneLeft: false,
      guessChance: 0,
      guessMaxCandidates: 1,
      guessMissChance: 1,
    },
    medium: {
      flipDelay: 1250,
      askDelay: 980,
      smartQuestion: true,
      smartFlip: true,
      flipMistakeChance: 0.24,
      questionMistakeChance: 0.22,
      guessWhenOneLeft: true,
      guessChance: 0.14,
      guessMaxCandidates: 5,
      guessMissChance: 0.32,
    },
    hard: {
      flipDelay: 680,
      askDelay: 500,
      smartQuestion: true,
      smartFlip: true,
      flipMistakeChance: 0.04,
      questionMistakeChance: 0.05,
      guessWhenOneLeft: true,
      guessChance: 0.5,
      guessMaxCandidates: 7,
      guessMissChance: 0.06,
    },
  };

  function getBotConfig() {
    return BOT_CONFIG[state.botDifficulty] || BOT_CONFIG.medium;
  }

  function initBotKnowledge() {
    if (state.online) return;
    const n = state.opponentWells.length || cardNames.length || 32;
    state.botSuspects = [];
    for (let i = 0; i < n; i++) state.botSuspects.push(i);
    state.botUsedQuestionIds = [];
  }

  function getBotSuspectIndices() {
    if (!state.botSuspects || !state.botSuspects.length) {
      const n = state.opponentWells.length || cardNames.length || 32;
      return Array.from({ length: n }, (_, i) => i);
    }
    return state.botSuspects.slice();
  }

  function narrowBotSuspects(questionId, yes) {
    if (!state.botSuspects || !questionId) return;
    state.botSuspects = state.botSuspects.filter(
      (i) => evaluateQuestion(questionId, getSecretName(i)) === yes
    );
  }

  function pickCasualQuestion() {
    const pool = getAIQuestions();
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function pickSmartQuestion() {
    const suspects = getBotSuspectIndices();
    if (suspects.length <= 1) {
      return pickCasualQuestion();
    }
    const all = getAIQuestions();
    const fresh = all.filter((q) => !state.botUsedQuestionIds.includes(q.id));
    const pool = fresh.length ? fresh : all;
    let bestQ = pool[0];
    let bestScore = Infinity;
    for (const q of pool) {
      let yes = 0;
      for (const i of suspects) {
        if (evaluateQuestion(q.id, getSecretName(i))) yes++;
      }
      const no = suspects.length - yes;
      if (yes === 0 || no === 0) continue;
      const score = Math.abs(yes - no);
      if (score < bestScore) {
        bestScore = score;
        bestQ = q;
      }
    }
    return bestQ;
  }

  function aiTryBotGuessWin() {
    if (state.online || state.phase === PHASE.WON || state.phase === PHASE.LOST) {
      return false;
    }
    const cfg = getBotConfig();
    const suspects = getBotSuspectIndices();
    if (!suspects.length || state.secretIndex == null) return false;

    let shouldGuess = false;
    let target = null;

    if (suspects.length === 1) {
      shouldGuess = Boolean(cfg.guessWhenOneLeft);
      target = suspects[0];
    } else if (suspects.length <= cfg.guessMaxCandidates && Math.random() < cfg.guessChance) {
      shouldGuess = true;
      target = suspects[Math.floor(Math.random() * suspects.length)];
    }

    if (!shouldGuess || target == null) return false;
    if (Math.random() < cfg.guessMissChance) return false;

    if (target === state.secretIndex) {
      if (opponentZone) opponentZone.classList.remove("turn-active");
      showLose(target);
      return true;
    }
    return false;
  }

  function aiAskPlayerQuestion() {
    const cfg = getBotConfig();
    const useSmart =
      cfg.smartQuestion && Math.random() > cfg.questionMistakeChance;
    const pick = useSmart ? pickSmartQuestion() : pickCasualQuestion();
    if (!state.botUsedQuestionIds.includes(pick.id)) {
      state.botUsedQuestionIds.push(pick.id);
    }
    recordQuestion(pick.text);
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
    initBotKnowledge();
    setTimeout(beginMyTurn, 700);
  }

  function beginMyTurn() {
    clearPostAnswerTimers();
    hidePostAnswerPanel();
    hideOpponentAnswer();
    hideAnswerReveal();
    hideFlipPhaseBar();
    setFlipPhaseUi(false);
    state.phase = PHASE.MY_TURN;
    state.flippedThisTurn = false;
    state.askedThisTurn = false;
    setScreenTurn("my");
    wireQuestionDrawer();
    enableMyFlips();
    window.setTimeout(() => showQuestionPanel("ask"), 80);
    if (!state.online && window.WieGameFeatures) {
      WieGameFeatures.showBotTip("ask");
    }
  }

  function beginTheirTurn() {
    clearPostAnswerTimers();
    hideQuestionPanel();
    hideAnswerReveal();
    hideFlipPhaseBar();
    setFlipPhaseUi(false);
    state.phase = PHASE.THEIR_TURN;
    state.askedThisTurn = false;
    setScreenTurn("their");
    hideBanner();
    if (opponentZone) opponentZone.classList.add("turn-active");
    if (!state.online) {
      const cfg = getBotConfig();
      if (aiTryBotGuessWin()) return;
      setTimeout(aiOpponentFlip, cfg.flipDelay);
    }
  }

  function aiOpponentFlip() {
    const cfg = getBotConfig();
    let candidates = state.opponentWells
      .map((w, i) => ({ w, i }))
      .filter(({ w }) => !w.querySelector(".card-tile.is-down"));
    const suspects = getBotSuspectIndices();

    if (state.opponentSecretIndex != null && candidates.length > 1) {
      const withoutOwn = candidates.filter(
        ({ i }) => i !== state.opponentSecretIndex
      );
      if (withoutOwn.length) candidates = withoutOwn;
    }

    if (cfg.smartFlip && suspects.length > 0 && candidates.length > 1) {
      const eliminable = candidates.filter(({ i }) => !suspects.includes(i));
      if (eliminable.length && Math.random() > cfg.flipMistakeChance) {
        candidates = eliminable;
      } else if (Math.random() < cfg.flipMistakeChance) {
        const wrong = candidates.filter(({ i }) => suspects.includes(i));
        if (wrong.length) candidates = wrong;
      }
    }

    if (candidates.length) {
      const { w } = candidates[Math.floor(Math.random() * candidates.length)];
      flipWell(w, true);
    }
    if (opponentZone) opponentZone.classList.remove("turn-active");
    if (aiTryBotGuessWin()) return;
    setTimeout(aiAskPlayerQuestion, cfg.askDelay);
  }

  function canGuessNow() {
    return state.phase === PHASE.MY_TURN;
  }

  function isGuessIndexCorrect(index) {
    if (typeof index !== "number" || index < 0) return false;
    const guessName = getSecretName(index);
    if (!guessName) return false;
    if (typeof state.opponentSecretIndex !== "number") return false;
    if (index === state.opponentSecretIndex) return true;
    const oppName = getSecretName(state.opponentSecretIndex);
    return Boolean(oppName && oppName === guessName);
  }

  function enableGuessModeWells() {
    state.playerWells.forEach((w) => {
      const tile = w.querySelector(".card-tile");
      if (tile && !tile.classList.contains("is-down")) {
        w.classList.add("guess-mode", "interactive");
      }
    });
    if (!useCompactSecretReveal() && state.secretIndex != null) {
      const secretWell = state.playerWells[state.secretIndex];
      if (secretWell) {
        secretWell.classList.add("guess-mode", "interactive");
      }
    }
  }

  function beginGuessMode() {
    if (!canGuessNow()) return;
    hideQuestionPanel();
    if (!state.online && window.WieGameFeatures) {
      WieGameFeatures.showBotTip("guess");
    }
    state.phase = PHASE.GUESS;
    setScreenTurn("guess");
    if (window.WieDailyMissions && WieDailyMissions.onGuessPhaseStart) {
      WieDailyMissions.onGuessPhaseStart();
    }
    setBanner(tFn("guessPrompt"));
    enableGuessModeWells();
  }

  function showEndActions() {
    const actions = winOverlay?.querySelector(".win-end-actions");
    if (actions) actions.classList.remove("hidden");
  }

  function hideGiveUpActions() {
    const giveUpActions = winOverlay?.querySelector(".win-give-up-actions");
    if (giveUpActions) giveUpActions.classList.add("hidden");
    const confetti = winOverlay?.querySelector(".win-confetti");
    if (confetti) confetti.style.display = "";
  }

  function hideEndOverlay() {
    if (winOverlay) {
      winOverlay.classList.add("hidden");
      winOverlay.classList.remove("active", "lose", "give-up", "opponent-gave-up");
      updateRankDeltaOverlay(null);
    }
    const actions = winOverlay?.querySelector(".win-end-actions");
    if (actions) actions.classList.add("hidden");
    hideGiveUpActions();
    if (screenGame) {
      screenGame.classList.remove("game-won", "give-up-shaking", "game-give-up-pending");
    }
    clearOpponentReveal();
  }

  function showGiveUpConfirm() {
    winOverlay = winOverlay || document.getElementById("win-overlay");
    screenGame = screenGame || document.getElementById("screen-game");
    if (!winOverlay || !screenGame) return;
    if (screenGame.classList.contains("hidden")) return;
    if (state.phase === PHASE.WON || state.phase === PHASE.LOST) return;

    screenGame.classList.remove("game-give-up-pending", "give-up-shaking");
    clearInteractivity();
    screenGame.classList.add("give-up-shaking");

    window.setTimeout(() => {
      if (!winOverlay || !screenGame) return;
      screenGame.classList.remove("give-up-shaking");
      screenGame.classList.add("game-give-up-pending");

      const title = winOverlay.querySelector(".win-title");
      const sub = winOverlay.querySelector(".win-sub");
      const reveal = winOverlay.querySelector(".lose-opponent-reveal");
      const endActions = winOverlay.querySelector(".win-end-actions");
      const giveUpActions = winOverlay.querySelector(".win-give-up-actions");
      const confetti = winOverlay.querySelector(".win-confetti");

      clearOpponentReveal();
      if (reveal) reveal.classList.add("hidden");
      if (endActions) endActions.classList.add("hidden");
      if (confetti) confetti.style.display = "none";
      if (title) title.textContent = tFn("giveUpTitle");
      if (sub) sub.textContent = tFn("giveUpConfirm");
      if (giveUpActions) giveUpActions.classList.remove("hidden");

      winOverlay.classList.remove("hidden", "lose", "active");
      void winOverlay.offsetWidth;
      winOverlay.classList.add("active", "give-up");
    }, 480);
  }

  function restoreAfterGiveUpCancel() {
    if (!screenGame) return;
    screenGame.classList.remove("game-give-up-pending");

    switch (state.phase) {
      case PHASE.PICK_SECRET:
        if (state.secretIndex === null) {
          state.playerWells.forEach((w) => w.classList.add("interactive"));
        }
        break;
      case PHASE.MY_TURN:
        enableMyFlips();
        if (!state.askedThisTurn) showQuestionPanel("ask");
        break;
      case PHASE.POST_ANSWER_SWITCH:
        enableCardFlips();
        showPostAnswerPanel("switch");
        break;
      case PHASE.POST_ANSWER_FLIP_RUSH:
        enableMyFlips();
        showPostAnswerPanel("flip");
        break;
      case PHASE.POST_ANSWER_FLIP_FREE:
        enableMyFlips();
        showPostAnswerPanel("free");
        break;
      case PHASE.GUESS:
        enableGuessModeWells();
        break;
      case PHASE.THEIR_TURN:
        if (opponentZone) opponentZone.classList.add("turn-active");
        break;
      case PHASE.ANSWER_QUESTION:
        showQuestionPanel("answer");
        break;
      default:
        break;
    }
  }

  function hideGiveUpConfirm() {
    if (winOverlay) {
      winOverlay.classList.add("hidden");
      winOverlay.classList.remove("active", "give-up");
    }
    hideGiveUpActions();
    if (screenGame) screenGame.classList.remove("give-up-shaking");
    restoreAfterGiveUpCancel();
  }

  function applyRankResult(won) {
    if (!state.isRanked || !window.WieRank) return null;
    const result = WieRank.applyMatchResult(won, state.rankedOpponentRating, { ranked: true });
    state.lastRankResult = result;
    return result;
  }

  function rankDeltaText(result) {
    if (!result || !window.WieRank) return "";
    const delta = WieRank.formatDelta(result.delta, tFn);
    const tier = WieRank.tierName(result.tier.id, tFn);
    if (result.delta > 0) {
      return tFn("rankWinMsg").replace("{delta}", delta).replace("{tier}", tier);
    }
    if (result.delta < 0) {
      return tFn("rankLoseMsg").replace("{delta}", delta).replace("{tier}", tier);
    }
    return tFn("rankDrawMsg").replace("{tier}", tier);
  }

  function updateRankDeltaOverlay(result) {
    if (!winOverlay) return;
    let el = winOverlay.querySelector(".win-rank-delta");
    if (!el) {
      el = document.createElement("p");
      el.className = "win-rank-delta hidden";
      const sub = winOverlay.querySelector(".win-sub");
      if (sub && sub.parentNode) sub.parentNode.insertBefore(el, sub.nextSibling);
    }
    if (!result) {
      el.classList.add("hidden");
      return;
    }
    el.textContent = rankDeltaText(result);
    el.classList.remove("hidden", "win-rank-delta--up", "win-rank-delta--down", "win-rank-delta--neutral");
    if (result.delta > 0) el.classList.add("win-rank-delta--up");
    else if (result.delta < 0) el.classList.add("win-rank-delta--down");
    else el.classList.add("win-rank-delta--neutral");
  }

  function setRankHudVisible(visible) {
    let hud = document.getElementById("game-rank-hud");
    if (!visible) {
      if (hud) hud.classList.add("hidden");
      return;
    }
    if (!window.WieRank) return;
    if (!hud && screenGame) {
      hud = document.createElement("div");
      hud.id = "game-rank-hud";
      hud.className = "game-rank-hud";
      screenGame.appendChild(hud);
    }
    if (!hud) return;
    const profile = WieRank.loadProfile();
    const tier = WieRank.getTier(profile.rating);
    hud.textContent =
      tier.icon + " " + WieRank.tierName(tier.id, tFn) + " · " + profile.rating;
    hud.classList.remove("hidden");
  }

  function showWin() {
    if (state.phase === PHASE.WON || state.phase === PHASE.LOST) return;
    state.phase = PHASE.WON;
    clearInteractivity();
    hideQuestionPanel();
    hideBanner();
    clearOpponentReveal();
    const rankResult = applyRankResult(true);
    if (winOverlay) {
      winOverlay.classList.remove("hidden", "lose", "give-up", "opponent-gave-up");
      winOverlay.classList.add("active");
      const title = winOverlay.querySelector(".win-title");
      const sub = winOverlay.querySelector(".win-sub");
      if (title) title.textContent = tFn("youWon");
      if (sub) {
        sub.textContent = state.isRanked ? tFn("rankWinSub") : tFn("winSub");
      }
      updateRankDeltaOverlay(rankResult);
    }
    if (screenGame) screenGame.classList.add("game-won");
    if (window.WieSounds) WieSounds.play("win");
    if (window.WieGameFeatures) WieGameFeatures.onGameEnd(true);
    if (window.WieDailyMissions && WieDailyMissions.onGameEnd) {
      WieDailyMissions.onGameEnd(true, { botDifficulty: state.botDifficulty });
    }
    showEndActions();
  }

  function showWinOpponentGiveUp() {
    if (state.phase === PHASE.WON || state.phase === PHASE.LOST) return;
    hideGiveUpConfirm();
    state.phase = PHASE.WON;
    clearInteractivity();
    hideQuestionPanel();
    hideBanner();
    clearOpponentReveal();
    const rankResult = applyRankResult(true);
    if (winOverlay) {
      winOverlay.classList.remove("hidden", "lose", "give-up");
      winOverlay.classList.add("active", "opponent-gave-up");
      const title = winOverlay.querySelector(".win-title");
      const sub = winOverlay.querySelector(".win-sub");
      const confetti = winOverlay.querySelector(".win-confetti");
      const reveal = winOverlay.querySelector(".lose-opponent-reveal");
      if (reveal) reveal.classList.add("hidden");
      if (confetti) confetti.style.display = "";
      hideGiveUpActions();
      if (title) title.textContent = tFn("opponentGaveUpTitle");
      if (sub) sub.textContent = tFn("opponentGaveUpSub");
      updateRankDeltaOverlay(rankResult);
    }
    if (screenGame) {
      screenGame.classList.remove("game-give-up-pending", "give-up-shaking");
      screenGame.classList.add("game-won");
    }
    if (window.WieSounds) WieSounds.play("win");
    if (window.WieGameFeatures) WieGameFeatures.onGameEnd(true);
    if (window.WieDailyMissions && WieDailyMissions.onGameEnd) {
      WieDailyMissions.onGameEnd(true, { botDifficulty: state.botDifficulty });
    }
    showEndActions();
  }

  function notifyOpponentGiveUp() {
    if (!state.online || !window.WieIsHetOnline) return;
    if (state.phase === PHASE.WON || state.phase === PHASE.LOST) return;
    window.WieIsHetOnline.send({ type: "giveUp" });
  }

  function resolveLoseRevealIndex(revealIndex) {
    if (typeof revealIndex === "number" && revealIndex >= 0) return revealIndex;
    if (typeof state.opponentSecretIndex === "number" && state.opponentSecretIndex >= 0) {
      return state.opponentSecretIndex;
    }
    if (typeof state.secretIndex === "number" && state.secretIndex >= 0) {
      return state.secretIndex;
    }
    return null;
  }

  function showLose(revealIndex) {
    if (state.phase === PHASE.LOST || state.phase === PHASE.WON) return;
    state.phase = PHASE.LOST;
    clearInteractivity();
    hideQuestionPanel();
    hideBanner();
    revealOpponentSecret(resolveLoseRevealIndex(revealIndex));
    const rankResult = applyRankResult(false);
    if (winOverlay) {
      winOverlay.classList.remove("hidden");
      winOverlay.classList.add("active", "lose");
      const title = winOverlay.querySelector(".win-title");
      const sub = winOverlay.querySelector(".win-sub");
      if (title) title.textContent = tFn("youLost");
      if (sub) {
        sub.textContent = state.isRanked ? tFn("rankLoseSub") : tFn("loseRevealSub");
      }
      updateRankDeltaOverlay(rankResult);
    }
    if (window.WieSounds) WieSounds.play("lose");
    if (window.WieGameFeatures) WieGameFeatures.onGameEnd(false);
    if (window.WieDailyMissions && WieDailyMissions.onGameEnd) {
      WieDailyMissions.onGameEnd(false, { botDifficulty: state.botDifficulty });
    }
    showEndActions();
  }

  function finishOnlineWrongGuess(revealIndex) {
    state.pendingGuessIndex = null;
    if (window.WieSounds) WieSounds.play("no");
    setBanner(tFn("guessWrong"));
    const idx = resolveLoseRevealIndex(revealIndex);
    window.setTimeout(() => showLose(idx), 1200);
  }

  function finishOnlineCorrectGuess() {
    state.pendingGuessIndex = null;
    showWin();
  }

  function onGuessCard(index) {
    if (state.phase !== PHASE.GUESS) return;
    clearInteractivity();

    if (state.online && window.WieIsHetOnline) {
      state.pendingGuessIndex = index;
      setBanner(tFn("guessChecking"));
      window.WieIsHetOnline.send({ type: "guess", index });
      return;
    }

    if (isGuessIndexCorrect(index)) {
      showWin();
    } else {
      finishOnlineWrongGuess(state.opponentSecretIndex);
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
    if (msg.type === "giveUp") {
      showWinOpponentGiveUp();
      return;
    }
    if (msg.type === "guess" && typeof msg.index === "number") {
      if (state.phase === PHASE.WON || state.phase === PHASE.LOST) return;
      if (state.secretIndex == null) return;
      const correct = msg.index === state.secretIndex;
      const secretIdx = state.secretIndex;
      if (window.WieIsHetOnline) {
        window.WieIsHetOnline.send({
          type: "guessResult",
          correct,
          secretIndex: secretIdx,
        });
      }
      if (correct) {
        showLose(secretIdx);
      } else {
        showWin();
      }
      return;
    }
    if (msg.type === "guessResult") {
      if (state.phase === PHASE.WON || state.phase === PHASE.LOST) return;
      if (typeof msg.secretIndex === "number") {
        state.opponentSecretIndex = msg.secretIndex;
      }
      if (msg.correct) {
        finishOnlineCorrectGuess();
      } else {
        finishOnlineWrongGuess(msg.secretIndex);
      }
      return;
    }
    if (msg.type === "win") {
      if (state.phase === PHASE.WON || state.phase === PHASE.LOST) return;
      if (typeof msg.secretIndex === "number") {
        state.opponentSecretIndex = msg.secretIndex;
      }
      const loseReveal =
        typeof msg.secretIndex === "number" ? msg.secretIndex : state.secretIndex;
      showLose(loseReveal);
      return;
    }
    if (msg.type === "lose") {
      if (state.phase === PHASE.WON || state.phase === PHASE.LOST) return;
      if (typeof msg.secretIndex === "number") {
        state.opponentSecretIndex = msg.secretIndex;
      }
      finishOnlineWrongGuess(msg.secretIndex);
      return;
    }
    if (msg.type === "playAgain" && state.isHost) {
      document.dispatchEvent(new CustomEvent("wieishet-play-again"));
    }
  }

  function beginPickSecretPhase() {
    refreshWells();
    state.phase = PHASE.PICK_SECRET;
    state.secretIndex = null;
    state.opponentSecretIndex = null;
    state.pendingGuessIndex = null;
    state.localSecretReady = false;
    state.remoteSecretReady = false;
    state.usedQuestions = [];
    state.botSuspects = null;
    state.botUsedQuestionIds = [];
    setRankHudVisible(state.isRanked);
    clearPostAnswerTimers();
    if (secretSlot) {
      Array.from(secretSlot.children).forEach((child) => {
        if (!child.classList.contains("secret-card-pedestal")) {
          child.remove();
        }
      });
      secretSlot.classList.remove("visible");
    }
    if (screenGame) screenGame.classList.remove("has-secret-visible", "secret-reveal-active");
    if (winOverlay) {
      winOverlay.classList.add("hidden");
      winOverlay.classList.remove("active", "lose");
    }
    if (screenGame) screenGame.classList.remove("game-won");
    state.playerWells.forEach((w) => {
      w.classList.remove("picked-secret", "interactive", "guess-mode");
    });
    hideQuestionPanel();
    hideAnswerReveal();
    hideFlipPhaseBar();
    hideOpponentAnswer();
    clearOpponentReveal();
    setScreenTurn("pick");
    hideBanner();
    state.playerWells.forEach((w) => w.classList.add("interactive"));
    if (!state.online && window.WieGameFeatures) {
      WieGameFeatures.showBotTip("pick");
    }
    bindWellClickHandlers();
    if (opponentChest && !state.online) {
      opponentChest.classList.remove("chest-guess-ready");
    }
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

  function wireBoards() {
    refreshWells();
    wirePlayerBoardTap(document.getElementById("player-board"));
    bindWellClickHandlers();
  }

  function wireGameQuickActions() {
    if (gameQuickActions && gameQuickActions.dataset.wired !== "1") {
      gameQuickActions.dataset.wired = "1";
      gameQuickActions.querySelectorAll(".answer-chip").forEach((btn) => {
        btn.addEventListener("click", () => onAnswerChipClick(btn));
      });
    }
    btnSwitchTurn = document.getElementById("btn-switch-turn");
    btnEndFlipPhase = document.getElementById("btn-end-flip-phase");
    postAnswerTimerEl = document.getElementById("post-answer-timer");
    postAnswerLabelEl = document.getElementById("post-answer-label");
    if (btnSwitchTurn && btnSwitchTurn.dataset.wired !== "1") {
      btnSwitchTurn.dataset.wired = "1";
      btnSwitchTurn.addEventListener("click", onSwitchTurnClick);
    }
    if (btnEndFlipPhase && btnEndFlipPhase.dataset.wired !== "1") {
      btnEndFlipPhase.dataset.wired = "1";
      btnEndFlipPhase.addEventListener("click", endPostAnswerPhase);
    }
  }

  function wireQuestionDrawer() {
    resolveDrawerNodes();
    if (btnSendQuestion && btnSendQuestion.dataset.wired !== "1") {
      btnSendQuestion.dataset.wired = "1";
      btnSendQuestion.addEventListener("click", submitPlayerQuestion);
    }
    if (questionInput && questionInput.dataset.wired !== "1") {
      questionInput.dataset.wired = "1";
      questionInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submitPlayerQuestion();
        }
      });
    }
    if (answerDrawer && answerDrawer.dataset.wired !== "1") {
      answerDrawer.dataset.wired = "1";
      answerDrawer.querySelectorAll(".answer-chip").forEach((btn) => {
        let chipTouchMs = 0;
        const onChip = (e) => {
          if (e.type === "touchend") {
            chipTouchMs = Date.now();
            if (e.cancelable) e.preventDefault();
            onAnswerChipClick(btn);
            return;
          }
          if (Date.now() - chipTouchMs < 500) return;
          onAnswerChipClick(btn);
        };
        btn.addEventListener("click", onChip);
        btn.addEventListener("touchend", onChip, { passive: false });
      });
    }
    if (btnToggleQuestionDrawer && btnToggleQuestionDrawer.dataset.wired !== "1") {
      btnToggleQuestionDrawer.dataset.wired = "1";
      btnToggleQuestionDrawer.addEventListener("click", toggleQuestionDrawer);
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
    setFlipPhaseUi(false);
    setTurnBadge("hidden");
    state.phase = PHASE.IDLE;
    state.secretIndex = null;
    state.opponentSecretIndex = null;
    state.pendingGuessIndex = null;
    state.localSecretReady = false;
    state.remoteSecretReady = false;
    state.askedThisTurn = false;
    state.flippedThisTurn = false;
    state.pendingQuestionText = "";
    state.usedQuestions = [];
    state.botSuspects = null;
    state.botUsedQuestionIds = [];
    state.isRanked = false;
    state.rankedOpponentRating = 1000;
    state.lastRankResult = null;
    setRankHudVisible(false);
    clearPostAnswerTimers();
    clearInteractivity();
    clearOpponentReveal();
    setScreenTurn(null);
    hideBanner();
    hideQuestionPanel();
    hideAnswerReveal();
    hideFlipPhaseBar();
    hideOpponentAnswer();
    if (secretSlot) {
      Array.from(secretSlot.children).forEach((child) => {
        if (!child.classList.contains("secret-card-pedestal")) {
          child.remove();
        }
      });
      secretSlot.classList.remove("visible");
    }
    if (screenGame) screenGame.classList.remove("has-secret-visible", "secret-reveal-active");
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
      gameQuickActions = document.getElementById("game-quick-actions");
      gameActionsAnswer = document.getElementById("game-actions-answer");
      gameActionsPost = document.getElementById("game-actions-post");
      gameActionsQuestionText = document.getElementById("game-actions-question-text");
      questionDrawer = document.getElementById("question-drawer");
      answerDrawer = document.getElementById("answer-drawer");
      answerDrawerQuestion = document.getElementById("answer-drawer-question");
      flipPhaseBar = document.getElementById("flip-phase-bar");
      flipPhaseTimerEl = document.getElementById("flip-phase-timer");
      answerRevealOverlay = document.getElementById("answer-reveal-overlay");
      answerRevealText = document.getElementById("answer-reveal-text");
      winOverlay = opts.winOverlay;
      state.online = Boolean(opts.online);
      state.isHost = opts.isHost !== false;
      state.botDifficulty = opts.botDifficulty || "medium";
      state.isRanked = Boolean(opts.isRanked);
      state.rankedOpponentRating = opts.rankedOpponentRating || 1000;
      state.lastRankResult = null;
      if (!state.online && state.botDifficulty) {
        state.remoteSecretReady = false;
        state.localSecretReady = false;
      }
      wireBoards();
      wireGameQuickActions();
      wireQuestionDrawer();
      wireChest();
      saveChestDefault();
      if (unsubOnline) unsubOnline();
      unsubOnline = null;
      if (state.online && window.WieIsHetOnline) {
        unsubOnline = WieIsHetOnline.onMessage(onOnlineMessage);
      }
    },
    wireBoards,
    syncCardNames(names) {
      cardNames = Array.isArray(names) ? names.slice() : [];
    },
    beginPickSecretPhase,
    reset,
    hideEndOverlay,
    showGiveUpConfirm,
    hideGiveUpConfirm,
    notifyOpponentGiveUp,
    getPhase: () => state.phase,
    handleOnlineMessage: onOnlineMessage,
  };
})();
