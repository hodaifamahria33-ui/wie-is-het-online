/**
 * Licht startscherm-deuntje (Web Audio — geen extern bestand).
 */
(function () {
  const MELODY = [
    { f: 523.25, d: 0.28 },
    { f: 659.25, d: 0.28 },
    { f: 783.99, d: 0.32 },
    { f: 880.0, d: 0.28 },
    { f: 783.99, d: 0.28 },
    { f: 659.25, d: 0.28 },
    { f: 523.25, d: 0.36 },
    { f: 392.0, d: 0.4 },
  ];
  const GAP = 0.08;

  let ctx = null;
  let master = null;
  let timer = null;
  let muted = localStorage.getItem("wieMusicMuted") === "1";
  let unlocked = false;
  let playing = false;

  function initCtx() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.14;
    master.connect(ctx.destination);
    return ctx;
  }

  function playNote(freq, start, duration) {
    if (!ctx || muted) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.001, start);
    g.gain.exponentialRampToValueAtTime(0.45, start + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(g);
    g.connect(master);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  function playChord(start) {
    [261.63, 329.63, 392.0].forEach((f, i) => {
      playNote(f, start + i * 0.02, 0.5);
    });
  }

  function scheduleLoop() {
    if (!ctx || muted || !playing) return;
    const t0 = ctx.currentTime + 0.05;
    let t = t0;
    MELODY.forEach((n) => {
      playNote(n.f, t, n.d);
      t += n.d + GAP;
    });
    playChord(t + 0.15);
    const loopLen = t - t0 + 1.2;
    timer = setTimeout(scheduleLoop, loopLen * 1000);
  }

  function unlock() {
    const c = initCtx();
    if (!c) return false;
    if (c.state === "suspended") c.resume();
    unlocked = true;
    return true;
  }

  function play() {
    if (!unlock()) return;
    if (playing) return;
    playing = true;
    if (master) master.gain.value = muted ? 0 : 0.14;
    scheduleLoop();
  }

  function stop() {
    playing = false;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function setMuted(value) {
    muted = !!value;
    localStorage.setItem("wieMusicMuted", muted ? "1" : "0");
    if (master) master.gain.value = muted ? 0 : 0.14;
    if (muted) stop();
    else if (unlocked && document.getElementById("screen-start") && !document.getElementById("screen-start").classList.contains("hidden")) {
      play();
    }
  }

  function toggle() {
    setMuted(!muted);
    return !muted;
  }

  function isMuted() {
    return muted;
  }

  window.WieStartMusic = {
    unlock,
    play,
    stop,
    toggle,
    setMuted,
    isMuted,
  };
})();
