/**
 * Korte geluidseffecten (Web Audio) — geen externe bestanden nodig.
 */
(function () {
  let ctx = null;
  let enabled = true;

  function readPref() {
    const v = localStorage.getItem("wieSoundOn");
    if (v === "0") enabled = false;
    else if (v === "1") enabled = true;
  }

  function getCtx() {
    if (!enabled) return null;
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    } catch (e) {
      return null;
    }
  }

  function tone(freq, dur, type, gain, when) {
    const ac = getCtx();
    if (!ac) return;
    const t0 = when || ac.currentTime;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.12, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  const SFX = {
    flip() {
      tone(420, 0.06, "triangle", 0.08);
    },
    yes() {
      tone(660, 0.08, "sine", 0.1);
      tone(880, 0.1, "sine", 0.08, getCtx() ? getCtx().currentTime + 0.07 : 0);
    },
    no() {
      tone(220, 0.14, "sawtooth", 0.07);
    },
    tick() {
      tone(520, 0.04, "square", 0.05);
    },
    win() {
      const ac = getCtx();
      if (!ac) return;
      const t = ac.currentTime;
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, "sine", 0.11, t + i * 0.09));
    },
    lose() {
      tone(180, 0.2, "sawtooth", 0.09);
      tone(140, 0.28, "sawtooth", 0.07, getCtx() ? getCtx().currentTime + 0.12 : 0);
    },
    ui() {
      tone(540, 0.05, "sine", 0.06);
    },
  };

  readPref();

  window.WieSounds = {
    play(name) {
      if (!enabled || !SFX[name]) return;
      SFX[name]();
    },
    setEnabled(on) {
      enabled = !!on;
      localStorage.setItem("wieSoundOn", enabled ? "1" : "0");
    },
    isEnabled() {
      return enabled;
    },
    unlock() {
      const ac = getCtx();
      if (ac && ac.state === "suspended") ac.resume();
    },
  };

  document.addEventListener(
    "click",
    function once() {
      window.WieSounds.unlock();
      document.removeEventListener("click", once);
    },
    { once: true, passive: true }
  );
})();
