/**
 * AI spelcoach — corrigeert fout antwoord en legt uit waarom.
 */
(function () {
  let overlay = null;
  let typeTimer = null;
  let onContinueCb = null;

  function t(key) {
    if (typeof window.wieT === "function") return window.wieT(key);
    if (typeof window.wieMainT === "function") return window.wieMainT(key);
    return key;
  }

  function fill(str, vars) {
    return String(str || "").replace(/\{(\w+)\}/g, (_, k) =>
      vars[k] != null ? String(vars[k]) : ""
    );
  }

  function tagLabel(tag) {
    const key = "coachTag_" + tag;
    const label = t(key);
    return label === key ? tag : label;
  }

  function capitalize(s) {
    const id = String(s || "");
    if (!id) return "";
    if (id === "a-m") return "Am";
    if (id === "n-z") return "Nz";
    return id.charAt(0).toUpperCase() + id.slice(1);
  }

  function getReason(questionId, secretName, correctYes) {
    const tags = window.WieCharacterArt
      ? WieCharacterArt.getTraits(secretName).tags || []
      : [];
    const tagText = tags.length ? tags.map(tagLabel).join(", ") : t("coachNoTags");
    const suffix = correctYes ? "Yes" : "No";
    const key = "coachReason" + capitalize(questionId) + suffix;
    const specific = t(key);
    if (specific !== key) {
      return fill(specific, { name: secretName, tags: tagText });
    }
    return fill(t("coachReasonGeneric"), { name: secretName, tags: tagText });
  }

  function buildMessage(opts) {
    const { question, secretName, playerYes, correctYes } = opts;
    const wrongWord = playerYes ? t("answerYes") : t("answerNo");
    const rightWord = correctYes ? t("answerYes") : t("answerNo");
    const qId = question && question.id && question.id !== "custom" ? question.id : "custom";
    const reason =
      qId === "custom"
        ? getReason("custom", secretName, correctYes)
        : getReason(qId, secretName, correctYes);

    return {
      title: t("coachWrongTitle"),
      question: (question && question.text) || "",
      body: fill(t("coachWrongBody"), {
        name: secretName,
        wrong: wrongWord,
        right: rightWord,
        reason,
      }),
      correctYes,
    };
  }

  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "answer-coach-overlay";
    overlay.className = "answer-coach-overlay hidden";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "answer-coach-title");
    overlay.innerHTML =
      '<div class="answer-coach-card">' +
      '  <div class="answer-coach-header">' +
      '    <img class="answer-coach-avatar" id="answer-coach-avatar" alt="" width="52" height="52" />' +
      '    <div class="answer-coach-meta">' +
      '      <p class="answer-coach-name" id="answer-coach-name"></p>' +
      '      <p class="answer-coach-role" id="answer-coach-role"></p>' +
      "    </div>" +
      "  </div>" +
      '  <h2 class="answer-coach-title" id="answer-coach-title"></h2>' +
      '  <p class="answer-coach-question" id="answer-coach-question"></p>' +
      '  <p class="answer-coach-body" id="answer-coach-body"></p>' +
      '  <button type="button" class="answer-coach-btn" id="answer-coach-btn"></button>' +
      "</div>";
    document.body.appendChild(overlay);

    overlay.querySelector("#answer-coach-btn").addEventListener("click", hide);

    return overlay;
  }

  function stopTyping() {
    if (typeTimer) {
      clearInterval(typeTimer);
      typeTimer = null;
    }
  }

  function typeText(el, fullText, onDone) {
    stopTyping();
    el.textContent = "";
    el.classList.add("is-typing");
    let i = 0;
    typeTimer = setInterval(() => {
      i += 1;
      el.textContent = fullText.slice(0, i);
      if (i >= fullText.length) {
        stopTyping();
        el.classList.remove("is-typing");
        if (onDone) onDone();
      }
    }, 18);
  }

  function hide() {
    stopTyping();
    if (overlay) overlay.classList.add("hidden");
    const cb = onContinueCb;
    onContinueCb = null;
    if (cb) cb();
  }

  function show(opts) {
    const el = ensureOverlay();
    onContinueCb = opts.onContinue || null;
    const msg = buildMessage(opts);

    el.querySelector("#answer-coach-avatar").src =
      "https://api.dicebear.com/9.x/bottts/png?seed=Coach-WieIsHet&size=104";
    el.querySelector("#answer-coach-name").textContent = t("coachName");
    el.querySelector("#answer-coach-role").textContent = t("coachRole");
    el.querySelector("#answer-coach-title").textContent = msg.title;
    el.querySelector("#answer-coach-question").textContent = '"' + msg.question + '"';
    el.querySelector("#answer-coach-btn").textContent = t("coachBtnOk");

    const bodyEl = el.querySelector("#answer-coach-body");
    const pillClass = msg.correctYes
      ? "answer-coach-answer-pill--yes"
      : "answer-coach-answer-pill--no";
    const rightWord = msg.correctYes ? t("answerYes") : t("answerNo");

    el.classList.remove("hidden");
    typeText(bodyEl, msg.body, () => {
      bodyEl.insertAdjacentHTML(
        "beforeend",
        ' <span class="answer-coach-answer-pill ' +
          pillClass +
          '">' +
          rightWord +
          "</span>"
      );
    });
  }

  window.WieAnswerCoach = { show, hide, buildMessage };
})();
