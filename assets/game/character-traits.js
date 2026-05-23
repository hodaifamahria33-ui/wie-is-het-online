/**
 * YouTuber-personages — echte foto's (Wikimedia CC) waar beschikbaar.
 */
(function () {
  const CREATOR_PHOTOS = "assets/creators/";

  const ROSTER = [
    { name: "MrBeast", female: false, photo: CREATOR_PHOTOS + "mrbeast.jpg" },
    { name: "Pokimane", female: true, photo: CREATOR_PHOTOS + "pokimane.jpg" },
    { name: "PewDiePie", female: false, photo: CREATOR_PHOTOS + "pewdiepie.jpg" },
    { name: "Valkyrae", female: true, seed: "Valkyrae" },
    { name: "Markiplier", female: false, photo: CREATOR_PHOTOS + "markiplier.jpg" },
    { name: "iJustine", female: true, photo: CREATOR_PHOTOS + "ijustine.jpg" },
    { name: "Jacksepticeye", female: false, photo: CREATOR_PHOTOS + "jacksepticeye.png" },
    { name: "SSSniperWolf", female: true, seed: "SSSniperWolf" },
    { name: "KSI", female: false, photo: CREATOR_PHOTOS + "ksi.jpg" },
    { name: "LaurDIY", female: true, seed: "LaurDIY" },
    { name: "Ninja", female: false, seed: "Ninja" },
    { name: "Emma", female: true, seed: "EmmaChamberlain" },
    { name: "Dream", female: false, seed: "Dream" },
    { name: "Aphmau", female: true, seed: "Aphmau" },
    { name: "Vanoss", female: false, seed: "Vanoss" },
    { name: "Jelly", female: true, seed: "JellyYT" },
    { name: "DanTDM", female: false, photo: CREATOR_PHOTOS + "dantdm.jpg" },
    { name: "Zoella", female: true, seed: "Zoella" },
    { name: "Ludwig", female: false, photo: CREATOR_PHOTOS + "ludwig.jpg" },
    { name: "Tana", female: true, seed: "TanaMongeau" },
    { name: "xQc", female: false, seed: "xQc" },
    { name: "Nikkie", female: true, photo: CREATOR_PHOTOS + "nikkie.jpg" },
    { name: "IShowSpeed", female: false, seed: "IShowSpeed" },
    { name: "Wengie", female: true, seed: "Wengie" },
    { name: "Enzo", female: false, seed: "EnzoKnol" },
    { name: "Safiya", female: true, seed: "SafiyaNygaard" },
    { name: "Gio", female: false, seed: "Gio" },
    { name: "Gibi", female: true, seed: "GibiASMR" },
    { name: "Kalvijn", female: false, seed: "Kalvijn" },
    { name: "Rosanna", female: true, photo: CREATOR_PHOTOS + "rosanna.jpg" },
    { name: "MKBHD", female: false, photo: CREATOR_PHOTOS + "mkbhd.jpg" },
    { name: "Jess", female: true, seed: "Jess" },
  ];

  const CARD_NAMES = ROSTER.map((c) => c.name);

  const TRAITS = {};
  ROSTER.forEach((c) => {
    TRAITS[c.name] = {
      female: c.female,
      seed: c.seed || c.name,
      photo: c.photo || null,
    };
  });

  function getTraits(name) {
    return (
      TRAITS[name] || {
        female: false,
        seed: name,
        photo: null,
      }
    );
  }

  function isGirl(name) {
    return !!getTraits(name).female;
  }

  function cardAvatarUrl(name) {
    const t = getTraits(name);
    if (t.photo) return t.photo;
    return cardAvatarFallbackUrl(name);
  }

  function cardAvatarFallbackUrl(name) {
    const t = getTraits(name);
    const params = new URLSearchParams();
    params.set("seed", t.seed || name);
    params.set("size", "160");
    params.set("backgroundColor", "1e1b4b,312e81,4c1d95");
    params.set("backgroundType", "gradientLinear");
    return "https://api.dicebear.com/9.x/personas/png?" + params.toString();
  }

  function decoratePhotoWrap(photoWrap, name) {
    if (!photoWrap) return;
    const girl = isGirl(name);
    const t = getTraits(name);
    photoWrap.classList.add(
      "card-photo--portrait",
      "card-photo--creator",
      t.photo ? "card-photo--real" : "card-photo--avatar",
      girl ? "card-photo--girl" : "card-photo--boy"
    );
  }

  function applyImgFilter(img, name) {
    if (!img) return;
    const t = getTraits(name);
    if (t.photo) {
      img.style.filter = "contrast(1.05) saturate(1.08)";
    } else {
      img.style.filter = "contrast(1.08) saturate(1.12)";
    }
  }

  function onImageError(img, name, photoWrap) {
    if (!img) return;
    const t = getTraits(name);
    if (t.photo && img.dataset.fallbackTried !== "1") {
      img.dataset.fallbackTried = "1";
      img.src = cardAvatarFallbackUrl(name);
      return;
    }
    if (photoWrap && !photoWrap.querySelector(".card-face-svg")) {
      photoWrap.appendChild(createFallbackFace(name));
    }
  }

  function createFallbackFace(name) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 100 120");
    svg.setAttribute("class", "card-face-svg");
    svg.setAttribute("aria-hidden", "true");
    const bg = isGirl(name) ? "#fbcfe8" : "#bfdbfe";
    svg.innerHTML =
      '<rect width="100" height="120" fill="' +
      bg +
      '"/>' +
      '<circle cx="50" cy="48" r="22" fill="#f5d0b8"/>' +
      '<text x="50" y="105" text-anchor="middle" font-size="11" fill="#1e1b4b" font-family="sans-serif" font-weight="700">' +
      String(name).slice(0, 8) +
      "</text>";
    return svg;
  }

  window.WieCharacterArt = {
    CARD_NAMES,
    getTraits,
    isGirl,
    cardAvatarUrl,
    cardAvatarFallbackUrl,
    decoratePhotoWrap,
    applyImgFilter,
    createFallbackFace,
    onImageError,
    TRAITS,
  };
})();
