/**
 * Mobiel: speel alleen in landscape — overlay + refresh bij schermwissel.
 */
(function () {
  const LOCK_CLASS = "orientation-locked";

  let screenGame = null;
  let overlay = null;

  function isGameScreenActive() {
    return screenGame && !screenGame.classList.contains("hidden");
  }

  function isPhoneLike() {
    return window.matchMedia(
      "(max-width: 900px), (hover: none) and (pointer: coarse) and (max-width: 1200px)"
    ).matches;
  }

  function isPortrait() {
    if (window.matchMedia("(orientation: portrait)").matches) return true;
    if (window.matchMedia("(orientation: landscape)").matches) return false;
    return window.innerHeight >= window.innerWidth;
  }

  function needsRotateLock() {
    return isGameScreenActive() && isPhoneLike() && isPortrait();
  }

  function update() {
    if (!screenGame || !overlay) return;
    const lock = needsRotateLock();
    screenGame.classList.toggle(LOCK_CLASS, lock);
    overlay.classList.toggle("hidden", !lock);
    overlay.setAttribute("aria-hidden", lock ? "false" : "true");
    document.documentElement.classList.toggle("wie-game-portrait-lock", lock);
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
    window.setInterval(update, 1500);
  }

  window.WieOrientationLock = { refresh: update };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
