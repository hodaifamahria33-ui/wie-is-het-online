/**
 * Donaties — Stripe testmodus (sandbox) of gesimuleerde checkout.
 * Geen KVK nodig in testmodus. Live + KVK pas als je echt live gaat.
 */
(function () {
  const TEST_CARD = "4242424242424242";

  function cfg() {
    return window.WIE_MONETIZE || {};
  }

  function stripeCfg() {
    return cfg().stripe || {};
  }

  function isTestMode() {
    const m = cfg().mode;
    if (m === "live") return false;
    if (m === "test") return true;
    return true;
  }

  function t(key) {
    if (typeof window.wieT === "function") {
      const v = window.wieT(key);
      if (v && v !== key) return v;
    }
    if (typeof window.wieMsg === "function") {
      const v = window.wieMsg(key);
      if (v && v !== key) return v;
    }
    const lang = window.wieLang ? window.wieLang() : "nl";
    const nl = {
      stripeTestBadge: "Testmodus — geen echt geld",
      stripeTestExplain:
        "Dit werkt als een echte betaling (Stripe sandbox). KVK hoef je pas in te vullen als je live gaat met echt geld.",
      stripeChooseAmount: "Kies een bedrag",
      stripePay: "Betalen",
      stripeCancel: "Annuleren",
      stripeCard: "Kaartnummer",
      stripeExpiry: "MM/JJ",
      stripeCvc: "CVC",
      stripeTestCardHint: "Testkaart: 4242 4242 4242 4242 · elk verloop · elke CVC",
      stripeSuccess: "Testbetaling gelukt! Bedankt ❤️ (geen echt geld)",
      stripeInvalidCard: "Gebruik de testkaart 4242 4242 4242 4242",
      stripeNeedLink:
        "Simulatie: vul testkaart in. Voor echte Stripe-test: zet paymentLinkTest in WIE_MONETIZE.",
      stripeRedirecting: "Doorsturen naar Stripe test-checkout…",
      stripeNoLink: "Stripe testlink nog niet ingesteld — simulatie gebruikt",
    };
    const en = {
      stripeTestBadge: "Test mode — no real money",
      stripeTestExplain:
        "Works like a real payment (Stripe sandbox). You only need business/KVK verification when you go live.",
      stripeChooseAmount: "Choose an amount",
      stripePay: "Pay",
      stripeCancel: "Cancel",
      stripeCard: "Card number",
      stripeExpiry: "MM/YY",
      stripeCvc: "CVC",
      stripeTestCardHint: "Test card: 4242 4242 4242 4242 · any expiry · any CVC",
      stripeSuccess: "Test payment successful! Thanks ❤️ (no real money)",
      stripeInvalidCard: "Use test card 4242 4242 4242 4242",
      stripeNeedLink:
        "Simulation: use test card. For real Stripe test: set paymentLinkTest in WIE_MONETIZE.",
      stripeRedirecting: "Redirecting to Stripe test checkout…",
      stripeNoLink: "Stripe test link not set — using simulation",
    };
    return (lang === "en" ? en : nl)[key] || key;
  }

  function normalizeCard(val) {
    return String(val || "").replace(/\D/g, "");
  }

  function getPaymentLinkForAmount(amount) {
    const s = stripeCfg();
    const links = s.paymentLinks || {};
    const key = String(amount);
    if (isTestMode()) {
      return links[key] || s.paymentLinkTest || s.paymentLink || "";
    }
    return links[key] || s.paymentLinkLive || s.paymentLink || "";
  }

  function getAmounts() {
    const s = stripeCfg();
    const list = s.amounts || [3, 5, 10];
    return list.map(Number).filter((n) => n > 0);
  }

  let modal = null;
  let selectedAmount = 5;

  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "stripe-donate-modal";
    modal.className = "stripe-donate-modal hidden";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "stripe-donate-title");
    modal.innerHTML =
      '<div class="stripe-donate-backdrop" data-close="1"></div>' +
      '<div class="stripe-donate-sheet">' +
      '<button type="button" class="stripe-donate-close" data-close="1" aria-label="Sluiten">×</button>' +
      '<p class="stripe-test-badge" id="stripe-test-badge"></p>' +
      '<h3 id="stripe-donate-title" class="stripe-donate-title"></h3>' +
      '<p class="stripe-donate-explain"></p>' +
      '<p class="stripe-amount-label"></p>' +
      '<div class="stripe-amounts" id="stripe-amount-btns"></div>' +
      '<div class="stripe-card-form">' +
      '<label><span class="stripe-lbl-card"></span>' +
      '<input type="text" inputmode="numeric" autocomplete="cc-number" id="stripe-card-num" placeholder="4242 4242 4242 4242" maxlength="19" /></label>' +
      '<div class="stripe-card-row">' +
      '<label><span class="stripe-lbl-exp"></span><input type="text" id="stripe-card-exp" placeholder="12/34" maxlength="5" /></label>' +
      '<label><span class="stripe-lbl-cvc"></span><input type="text" inputmode="numeric" id="stripe-card-cvc" placeholder="123" maxlength="4" /></label>' +
      "</div></div>" +
      '<p class="stripe-test-hint"></p>' +
      '<p class="stripe-form-error hidden" id="stripe-form-error"></p>' +
      '<div class="stripe-donate-actions">' +
      '<button type="button" class="stripe-btn stripe-btn--pay" id="stripe-btn-pay"></button>' +
      '<button type="button" class="stripe-btn stripe-btn--cancel" id="stripe-btn-cancel"></button>' +
      "</div></div>";
    document.body.appendChild(modal);

    modal.querySelector(".stripe-donate-backdrop").addEventListener("click", close);
    modal.querySelector(".stripe-donate-close").addEventListener("click", close);
    modal.querySelector("#stripe-btn-cancel").addEventListener("click", close);
    modal.querySelector("#stripe-btn-pay").addEventListener("click", onPay);

    const cardInput = modal.querySelector("#stripe-card-num");
    cardInput.addEventListener("input", () => {
      const digits = normalizeCard(cardInput.value);
      cardInput.value = digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
    });

    return modal;
  }

  function fillLabels() {
    if (!modal) return;
    const test = isTestMode();
    const badge = modal.querySelector(".stripe-test-badge");
    if (badge) {
      badge.textContent = test ? t("stripeTestBadge") : "";
      badge.classList.toggle("hidden", !test);
    }
    modal.querySelector(".stripe-donate-title").textContent = t("stripeChooseAmount");
    modal.querySelector(".stripe-donate-explain").textContent = test
      ? t("stripeTestExplain")
      : "";
    modal.querySelector(".stripe-amount-label").textContent = t("stripeChooseAmount");
    modal.querySelector(".stripe-lbl-card").textContent = t("stripeCard");
    modal.querySelector(".stripe-lbl-exp").textContent = t("stripeExpiry");
    modal.querySelector(".stripe-lbl-cvc").textContent = t("stripeCvc");
    modal.querySelector(".stripe-test-hint").textContent = test
      ? t("stripeTestCardHint")
      : "";
    modal.querySelector("#stripe-btn-pay").textContent = t("stripePay");
    modal.querySelector("#stripe-btn-cancel").textContent = t("stripeCancel");

    const form = modal.querySelector(".stripe-card-form");
    const link = getPaymentLinkForAmount(selectedAmount);
    const useSimulate = !link || stripeCfg().forceSimulate === true;
    if (form) form.classList.toggle("hidden", !useSimulate);
    if (modal.querySelector(".stripe-test-hint")) {
      modal.querySelector(".stripe-test-hint").classList.toggle("hidden", !useSimulate);
    }
  }

  function renderAmountButtons() {
    const wrap = modal.querySelector("#stripe-amount-btns");
    if (!wrap) return;
    wrap.innerHTML = "";
    getAmounts().forEach((amt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "stripe-amount-btn" + (amt === selectedAmount ? " is-selected" : "");
      btn.textContent = "€" + amt;
      btn.addEventListener("click", () => {
        selectedAmount = amt;
        renderAmountButtons();
        fillLabels();
      });
      wrap.appendChild(btn);
    });
  }

  function showError(msg) {
    const el = modal.querySelector("#stripe-form-error");
    if (!el) return;
    if (!msg) {
      el.classList.add("hidden");
      el.textContent = "";
      return;
    }
    el.textContent = msg;
    el.classList.remove("hidden");
  }

  function close() {
    if (!modal) return;
    modal.classList.add("hidden");
    showError("");
  }

  function open() {
    ensureModal();
    selectedAmount = getAmounts()[1] || getAmounts()[0] || 5;
    renderAmountButtons();
    fillLabels();
    modal.classList.remove("hidden");
    const card = modal.querySelector("#stripe-card-num");
    if (card && !card.closest(".hidden")) {
      window.setTimeout(() => card.focus(), 120);
    }
  }

  function redirectToStripe(amount) {
    const url = getPaymentLinkForAmount(amount);
    if (!url) return false;
    if (window.wieShowToast) window.wieShowToast(t("stripeRedirecting"));
    close();
    window.setTimeout(() => {
      window.location.href = url;
    }, 400);
    return true;
  }

  function simulatePay(amount) {
    const card = normalizeCard(modal.querySelector("#stripe-card-num").value);
    if (card !== TEST_CARD && isTestMode()) {
      showError(t("stripeInvalidCard"));
      return;
    }
    if (!card) {
      showError(t("stripeInvalidCard"));
      return;
    }
    showError("");
    const btn = modal.querySelector("#stripe-btn-pay");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "…";
    }
    window.setTimeout(() => {
      close();
      if (btn) {
        btn.disabled = false;
        btn.textContent = t("stripePay");
      }
      if (window.wieShowToast) window.wieShowToast(t("stripeSuccess"));
      try {
        sessionStorage.setItem(
          "wie_donate_test_ok",
          JSON.stringify({ amount, at: Date.now() })
        );
      } catch (e) {}
    }, 900);
  }

  function onPay() {
    const amount = selectedAmount;
    if (redirectToStripe(amount)) return;
    simulatePay(amount);
  }

  function handleReturnQuery() {
    const q = new URLSearchParams(window.location.search);
    if (q.get("donate") === "success") {
      if (window.wieShowToast) {
        window.wieShowToast(t("stripeSuccess"));
      }
      const clean = window.location.pathname + window.location.hash;
      window.history.replaceState({}, "", clean);
    }
    if (q.get("donate") === "cancel" && window.wieShowToast) {
      const lang = window.wieLang ? window.wieLang() : "nl";
      window.wieShowToast(
        lang === "en" ? "Payment cancelled" : "Betaling geannuleerd"
      );
      window.history.replaceState({}, "", window.location.pathname + window.location.hash);
    }
  }

  function donate() {
    const legacy = cfg().donateUrl;
    const hasStripe =
      stripeCfg().paymentLinkTest ||
      stripeCfg().paymentLinkLive ||
      stripeCfg().paymentLink ||
      (stripeCfg().paymentLinks && Object.keys(stripeCfg().paymentLinks).length);

    if (!hasStripe && legacy) {
      window.open(legacy, "_blank", "noopener,noreferrer");
      return;
    }
    open();
  }

  handleReturnQuery();

  window.WieStripeDonate = {
    open,
    close,
    donate,
    isTestMode,
  };

  window.wieDonate = function () {
    if (window.WieStripeDonate) return WieStripeDonate.donate();
  };
})();
