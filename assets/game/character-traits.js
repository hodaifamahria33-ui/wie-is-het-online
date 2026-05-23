/**
 * YouTuber-personages — unieke portret-avatars per creator (DiceBear).
 */
(function () {
  const ROSTER = [
    { name: "MrBeast", female: false, seed: "MrBeast", accent: "22c55e,14532d" },
    { name: "Pokimane", female: true, seed: "Pokimane", accent: "a855f7,581c87" },
    { name: "PewDiePie", female: false, seed: "PewDiePie", accent: "ef4444,7f1d1d" },
    { name: "Valkyrae", female: true, seed: "Valkyrae", accent: "f472b6,831843" },
    { name: "Markiplier", female: false, seed: "Markiplier", accent: "dc2626,450a0a" },
    { name: "iJustine", female: true, seed: "iJustine", accent: "ec4899,831843" },
    { name: "Jacksepticeye", female: false, seed: "Jacksepticeye", accent: "22c55e,14532d" },
    { name: "SSSniperWolf", female: true, seed: "SSSniperWolf", accent: "f97316,7c2d12" },
    { name: "KSI", female: false, seed: "KSI", accent: "eab308,713f12" },
    { name: "LaurDIY", female: true, seed: "LaurDIY", accent: "f472b6,9d174d" },
    { name: "Ninja", female: false, seed: "Ninja", accent: "3b82f6,1e3a8a" },
    { name: "Emma", female: true, seed: "EmmaChamberlain", accent: "a78bfa,4c1d95" },
    { name: "Dream", female: false, seed: "Dream", accent: "84cc16,365314" },
    { name: "Aphmau", female: true, seed: "Aphmau", accent: "c084fc,581c87" },
    { name: "Vanoss", female: false, seed: "Vanoss", accent: "ef4444,450a0a" },
    { name: "Jelly", female: true, seed: "JellyYT", accent: "22d3ee,155e75" },
    { name: "DanTDM", female: false, seed: "DanTDM", accent: "6366f1,312e81" },
    { name: "Zoella", female: true, seed: "Zoella", accent: "fbcfe8,9d174d" },
    { name: "Ludwig", female: false, seed: "Ludwig", accent: "fbbf24,78350f" },
    { name: "Tana", female: true, seed: "TanaMongeau", accent: "fb7185,881337" },
    { name: "xQc", female: false, seed: "xQc", accent: "facc15,713f12" },
    { name: "Nikkie", female: true, seed: "NikkieTutorials", accent: "f472b6,831843" },
    { name: "IShowSpeed", female: false, seed: "IShowSpeed", accent: "ef4444,7f1d1d" },
    { name: "Wengie", female: true, seed: "Wengie", accent: "f472b6,9d174d" },
    { name: "Enzo", female: false, seed: "EnzoKnol", accent: "f97316,7c2d12" },
    { name: "Safiya", female: true, seed: "SafiyaNygaard", accent: "eab308,713f12" },
    { name: "Gio", female: false, seed: "Gio", accent: "38bdf8,0c4a6e" },
    { name: "Gibi", female: true, seed: "GibiASMR", accent: "a78bfa,4c1d95" },
    { name: "Kalvijn", female: false, seed: "Kalvijn", accent: "a855f7,581c87" },
    { name: "Rosanna", female: true, seed: "RosannaPansino", accent: "f97316,7c2d12" },
    { name: "MKBHD", female: false, seed: "MKBHD", accent: "ef4444,450a0a" },
    { name: "Jess", female: true, seed: "Jess", accent: "22c55e,14532d" },
  ];

  const CARD_NAMES = ROSTER.map((c) => c.name);

  const TRAITS = {};
  ROSTER.forEach((c) => {
    TRAITS[c.name] = {
      female: c.female,
      seed: c.seed,
      accent: c.accent,
    };
  });

  function getTraits(name) {
    return (
      TRAITS[name] || {
        female: false,
        seed: name,
        accent: "ef4444,1e1b4b",
      }
    );
  }

  function isGirl(name) {
    return !!getTraits(name).female;
  }

  function cardAvatarUrl(name) {
    const t = getTraits(name);
    const params = new URLSearchParams();
    params.set("seed", t.seed || name);
    params.set("size", "160");
    params.set("backgroundColor", t.accent || "ef4444,1e1b4b");
    params.set("backgroundType", "gradientLinear");
    return "https://api.dicebear.com/9.x/personas/png?" + params.toString();
  }

  function cardAvatarFallbackUrl(name) {
    const t = getTraits(name);
    const params = new URLSearchParams();
    params.set("seed", (t.seed || name) + "-alt");
    params.set("size", "160");
    params.set("backgroundColor", "1e1b4b,312e81,4c1d95");
    params.set("backgroundType", "gradientLinear");
    return "https://api.dicebear.com/9.x/avataaars/png?" + params.toString();
  }

  function decoratePhotoWrap(photoWrap, name) {
    if (!photoWrap) return;
    const girl = isGirl(name);
    photoWrap.classList.add(
      "card-photo--portrait",
      "card-photo--creator",
      girl ? "card-photo--girl" : "card-photo--boy"
    );
  }

  function applyImgFilter(img) {
    if (!img) return;
    img.style.filter = "contrast(1.08) saturate(1.12)";
  }

  function onImageError(img, name, photoWrap) {
    if (!img || img.dataset.fallbackTried === "1") {
      if (photoWrap && !photoWrap.querySelector(".card-face-svg")) {
        photoWrap.appendChild(createFallbackFace(name));
      }
      return;
    }
    img.dataset.fallbackTried = "1";
    img.style.display = "";
    img.src = cardAvatarFallbackUrl(name);
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
