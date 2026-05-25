/**
 * Betrouwbare start voor solo / daily — bord eerst zichtbaar, daarna pas game-logica.
 */
(function () {
  var bootLock = false;

  function pickCardNames() {
    var base =
      window.WieCharacterArt && WieCharacterArt.CARD_NAMES
        ? WieCharacterArt.CARD_NAMES.slice()
        : [
            "MrBeast", "Pokimane", "PewDiePie", "Valkyrae", "Markiplier", "iJustine",
            "Jacksepticeye", "SSSniperWolf", "KSI", "LaurDIY", "Ninja", "Emma",
            "Dream", "Aphmau", "Vanoss", "Jelly", "DanTDM", "Zoella", "Ludwig", "Tana",
            "xQc", "Nikkie", "IShowSpeed", "Logan Paul", "Enzo", "Safiya", "Gio", "Gibi",
            "Kalvijn", "Rosanna", "MKBHD", "Jess",
          ];
    var daily = false;
    try {
      daily = localStorage.getItem("wieCardMode") === "daily";
    } catch (e) {
      /* ignore */
    }
    if (daily && window.WieGameFeatures) {
      try {
        if (typeof WieGameFeatures.setCardMode === "function") {
          WieGameFeatures.setCardMode("daily");
        }
        if (typeof WieGameFeatures.getActiveCardNames === "function") {
          var picked = WieGameFeatures.getActiveCardNames(base);
          if (picked && picked.length) return picked;
        }
      } catch (err) {
        console.warn("daily names", err);
      }
    }
    return base;
  }

  function showGameScreens() {
    document.documentElement.classList.remove("app-booting");
    document.documentElement.classList.add("wie-solo-game");

    document.querySelectorAll("main.screen").forEach(function (el) {
      el.classList.toggle("hidden", el.id !== "screen-game");
    });

    var sg = document.getElementById("screen-game");
    if (sg) {
      sg.classList.remove("hidden");
      sg.style.visibility = "visible";
      sg.style.display = "block";
      sg.classList.add("game-session-active", "phase-pick-secret");
    }

    var gc = document.getElementById("game-countdown");
    if (gc) {
      gc.classList.add("hidden");
      gc.style.display = "none";
      gc.style.visibility = "hidden";
    }
  }

  function buildBoard(names) {
    var table = document.getElementById("game-table");
    var player = document.getElementById("player-board");
    var opponent = document.getElementById("opponent-board");
    if (!table || !player || !opponent) return 0;

    var daily = names.length > 0 && names.length <= 16;
    document.documentElement.classList.toggle("wie-daily-challenge", daily);
    table.classList.toggle("game-table--daily", daily);

    table.classList.remove("hidden");
    table.style.display = "block";
    table.style.visibility = "visible";
    table.style.opacity = "1";
    table.style.pointerEvents = "auto";
    table.style.zIndex = "20";
    table.style.overflow = "visible";

    var scene = table.querySelector(".game-scene");
    if (scene) {
      scene.style.display = "flex";
      scene.style.alignItems = "center";
      scene.style.justifyContent = "center";
      scene.style.perspective = "none";
      scene.style.overflow = "visible";
    }

    table.querySelectorAll(".board-stand--front, .board-stand--player").forEach(function (el) {
      el.style.transform = "none";
      el.style.minWidth = "0";
      el.style.visibility = "visible";
      el.style.opacity = "1";
    });

    var stack = table.querySelector(".board-stack");
    if (stack) {
      stack.style.minWidth = "0";
      stack.style.width = "100%";
      stack.style.maxWidth = "min(96vw, 720px)";
      stack.style.transform = "none";
    }

    player.innerHTML = "";
    opponent.innerHTML = "";

    var cols = names.length <= 16 ? 4 : 8;
    player.style.display = "grid";
    player.style.gridTemplateColumns = "repeat(" + cols + ", minmax(0, 1fr))";
    player.style.gridTemplateRows =
      names.length <= 16 ? "repeat(4, minmax(0, 1fr))" : "repeat(4, auto)";

    names.forEach(function (name) {
      var well = document.createElement("div");
      well.className = "card-well interactive";
      var tile = document.createElement("div");
      tile.className = "card-tile";
      var face = document.createElement("div");
      face.className = "card-face";
      var img = document.createElement("img");
      img.className = "card-img";
      img.alt = name;
      img.loading = "eager";
      if (window.WieCharacterArt && WieCharacterArt.cardAvatarUrl) {
        img.src = WieCharacterArt.cardAvatarUrl(name);
        if (WieCharacterArt.applyImgFilter) WieCharacterArt.applyImgFilter(img, name);
      }
      var label = document.createElement("span");
      label.className = "card-name";
      label.textContent =
        window.WieCharacterArt && WieCharacterArt.getCardLabel
          ? WieCharacterArt.getCardLabel(name)
          : name;
      face.appendChild(img);
      face.appendChild(label);
      tile.appendChild(face);
      well.appendChild(tile);
      player.appendChild(well);

      var oppWell = document.createElement("div");
      oppWell.className = "card-well";
      oppWell.innerHTML =
        '<div class="card-tile card-tile--opp"><div class="card-back-face" aria-hidden="true"></div></div>';
      opponent.appendChild(oppWell);
    });

    return names.length;
  }

  function showPickUi() {
    if (window.WieIsHetPlay) {
      try {
        if (typeof WieIsHetPlay.wireBoards === "function") WieIsHetPlay.wireBoards();
        if (typeof WieIsHetPlay.beginPickSecretPhase === "function") {
          WieIsHetPlay.beginPickSecretPhase();
          return;
        }
      } catch (err) {
        console.warn("pick phase", err);
      }
    }
    var badge = document.getElementById("game-turn-badge");
    var badgeText = document.getElementById("game-turn-badge-text");
    if (badge && badgeText) {
      badge.classList.remove("hidden");
      badge.classList.add("is-pick");
      badgeText.textContent =
        typeof window.wieMsg === "function"
          ? window.wieMsg("phasePickSecret")
          : "Kies je geheim personage";
    }
    document.querySelectorAll("#player-board .card-well").forEach(function (w) {
      w.classList.add("interactive");
    });
  }

  function bootSolo(difficulty) {
    if (bootLock) return false;
    bootLock = true;
    window.setTimeout(function () {
      bootLock = false;
    }, 700);

    var diff = difficulty || "medium";
    console.log("[wie] solo-start", diff);

    showGameScreens();
    var names = pickCardNames();
    var n = buildBoard(names);
    if (n < 1) {
      if (window.wieShowToast) {
        window.wieShowToast("Kaarten laden mislukt — refresh de pagina (F5)");
      }
      bootLock = false;
      return false;
    }

    if (typeof window.__wieApplySoloStart === "function") {
      try {
        window.__wieApplySoloStart(diff, names);
      } catch (err) {
        console.warn("__wieApplySoloStart", err);
        showPickUi();
      }
    } else {
      showPickUi();
    }

    return false;
  }

  window.wieBootSolo = bootSolo;
  window.wieStartBotGame = function (difficulty, ev) {
    if (ev) {
      if (ev.preventDefault) ev.preventDefault();
      if (ev.stopPropagation) ev.stopPropagation();
    }
    return bootSolo(difficulty || "medium");
  };
})();
