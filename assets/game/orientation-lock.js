/**
 * Mobiel: bij start potje eerst draaien naar landscape, daarna pas countdown/spel.
 */
(function () {
  const LOCK_CLASS = "orientation-locked";
  const PHONE_SHORT_SIDE_PX = 520;

  let screenGame = null;
  let overlay = null;
  let pendingStarts = [];

  function isGameScreenActive() {
    return screenGame && !screenGame.classList.contains("hidden");
  }

  /** Werkt in portrait én landscape (korte zijde van het scherm). */
  function isPhoneLike() {
    const shortSide = Math.min(window.innerWidth, window.innerHeight);
    if (shortSide > PHONE_SHORT_SIDE_PX) return false;
    if (window.matchMedia("(pointer: coarse)").matches) return true;
    return window.matchMedia("(max-width: 600px)").matches;
  }

  function isPortrait() {
    if (window.matchMedia("(orientation: portrait)").matches) return true;
    if (window.matchMedia("(orientation: landscape)").matches) return false;
    return window.innerHeight >= window.innerWidth;
  }

  function needsRotateLock() {
    return isGameScreenActive() && isPhoneLike() && isPortrait();
  }

  function flushPendingStarts() {
    if (needsRotateLock()) return;
    const run = pendingStarts.splice(0);
    run.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.warn("orientation start", err);
      }
    });
  }

  function cancelPendingStarts() {
    pendingStarts = [];
  }

  /** Wacht op landscape op telefoon; anders direct starten. */
  function waitForLandscape(cb) {
    if (typeof cb !== "function") return;
    if (!isPhoneLike() || !isPortrait()) {
      cb();
      return;
    }
    pendingStarts.push(cb);
    update();
  }

  function update() {
    if (!screenGame || !overlay) return;
    const lock = needsRotateLock();
    const landscapeGame =
      isGameScreenActive() && isPhoneLike() && !isPortrait();

    screenGame.classList.toggle(LOCK_CLASS, lock);
    overlay.classList.toggle("hidden", !lock);
    overlay.setAttribute("aria-hidden", lock ? "false" : "true");
    document.documentElement.classList.toggle("wie-game-portrait-lock", lock);
    document.documentElement.classList.toggle("wie-phone-landscape-game", landscapeGame);

    if (!lock) flushPendingStarts();
  }

  function hookShowOnly() {
    const prev = window.wieShowOnly;
    if (!prev || prev.__wieOrientHook) return;
    window.wieShowOnly = function (screenId) {
      prev(screenId);
      window.setTimeout(update, 0);
      window.setTimeout(update, 200);
    };
    window.wieShowOnly.__wieOrientHook = true;
  }

  function init() {
    screenGame = document.getElementById("screen-game");
    overlay = document.getElementById("orientation-lock");
    if (!screenGame || !overlay) return;

    hookShowOnly();

    window.addEventListener("orientationchange", () => {
      window.setTimeout(update, 50);
      window.setTimeout(update, 350);
    });
    window.addEventListener("resize", update);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", update);
    }

    if (window.screen && window.screen.orientation && window.screen.orientation.addEventListener) {
      window.screen.orientation.addEventListener("change", update);
    }

    const obs = new MutationObserver(update);
    obs.observe(screenGame, { attributes: true, attributeFilter: ["class"] });

    update();
    window.setInterval(update, 800);
  }

  window.WieOrientationLock = {
    refresh: update,
    waitForLandscape,
    cancelPendingStarts,
    isPhoneLike,
    needsRotateLock,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
