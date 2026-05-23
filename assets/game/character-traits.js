/**
 * Gekleurde geanimeerde portretten — lokaal opgeslagen (altijd zichtbaar).
 */
(function () {
  const PORTRAITS = "assets/portraits/";
  const AVATAR_CACHE = "color-v4";
  const REMOTE_STYLE = "adventurer";
  const AVATAR_SIZE = 256;

  const ROSTER = [
    { name: "MrBeast", female: false, slug: "mrbeast", bg: "f59e0b,ea580c,7c2d12", hair: "short04", glasses: "variant02", skinColor: "f2d3b1", hairColor: "562306" },
    { name: "Pokimane", female: true, slug: "pokimane", bg: "ec4899,f472b6,831843", hair: "long20", skinColor: "ecad80", hairColor: "592454" },
    { name: "PewDiePie", female: false, slug: "pewdiepie", bg: "3b82f6,1d4ed8,1e3a8a", hair: "short11", beard: "variant04", glasses: "variant03", skinColor: "f2d3b1", hairColor: "e5d7a3" },
    { name: "Valkyrae", female: true, slug: "valkyrae", bg: "a855f7,c084fc,581c87", hair: "long14", glasses: "variant01", skinColor: "f2d3b1", hairColor: "0e0e0e" },
    { name: "Markiplier", female: false, slug: "markiplier", bg: "ef4444,b91c1c,450a0a", hair: "short08", beard: "variant06", skinColor: "ecad80", hairColor: "562306" },
    { name: "iJustine", female: true, slug: "ijustine", bg: "f472b6,fb7185,9f1239", hair: "long08", glasses: "variant04", skinColor: "f2d3b1", hairColor: "ab2a18" },
    { name: "Jacksepticeye", female: false, slug: "jacksepticeye", bg: "22c55e,16a34a,14532d", hair: "short16", beard: "variant02", skinColor: "f2d3b1", hairColor: "3eac2c" },
    { name: "SSSniperWolf", female: true, slug: "sssniperwolf", bg: "f97316,ea580c,7c2d12", hair: "long18", skinColor: "ecad80", hairColor: "cb6820" },
    { name: "KSI", female: false, slug: "ksi", bg: "eab308,ca8a04,713f12", hair: "short02", beard: "variant08", glasses: "variant02", skinColor: "9e5622", hairColor: "0e0e0e" },
    { name: "LaurDIY", female: true, slug: "laurdiy", bg: "fde047,facc15,a16207", hair: "long22", skinColor: "f2d3b1", hairColor: "b9a05f" },
    { name: "Ninja", female: false, slug: "ninja", bg: "06b6d4,0891b2,164e63", hair: "short12", beard: "variant03", skinColor: "f2d3b1", hairColor: "0e0e0e" },
    { name: "Emma", female: true, slug: "emma", bg: "fda4af,f43f5e,881337", hair: "long06", glasses: "variant02", skinColor: "f2d3b1", hairColor: "592454" },
    { name: "Dream", female: false, slug: "dream", bg: "34d399,10b981,064e3b", hair: "short06", skinColor: "f2d3b1", hairColor: "85c2c6" },
    { name: "Aphmau", female: true, slug: "aphmau", bg: "c084fc,a78bfa,4c1d95", hair: "long12", skinColor: "ecad80", hairColor: "dba3be" },
    { name: "Vanoss", female: false, slug: "vanoss", bg: "64748b,475569,0f172a", hair: "short14", beard: "variant05", glasses: "variant01", skinColor: "f2d3b1", hairColor: "0e0e0e" },
    { name: "Jelly", female: true, slug: "jelly", bg: "38bdf8,0ea5e9,1e3a8a", hair: "long16", skinColor: "f2d3b1", hairColor: "cb6820" },
    { name: "DanTDM", female: false, slug: "dantdm", bg: "818cf8,6366f1,312e81", hair: "short10", beard: "variant01", glasses: "variant04", skinColor: "f2d3b1", hairColor: "ac6511" },
    { name: "Zoella", female: true, slug: "zoella", bg: "fb923c,fdba74,9a3412", hair: "long24", skinColor: "ecad80", hairColor: "592454" },
    { name: "Ludwig", female: false, slug: "ludwig", bg: "fbbf24,f59e0b,78350f", hair: "short18", beard: "variant07", skinColor: "f2d3b1", hairColor: "796a45" },
    { name: "Tana", female: true, slug: "tana", bg: "f43f5e,e11d48,881337", hair: "long10", glasses: "variant03", skinColor: "f2d3b1", hairColor: "0e0e0e" },
    { name: "xQc", female: false, slug: "xqc", bg: "94a3b8,64748b,1e293b", hair: "short01", beard: "variant02", skinColor: "f2d3b1", hairColor: "afafaf" },
    { name: "Nikkie", female: true, slug: "nikkie", bg: "e879f9,d946ef,701a75", hair: "long04", glasses: "variant05", skinColor: "f2d3b1", hairColor: "b9a05f" },
    { name: "IShowSpeed", female: false, slug: "ishowspeed", bg: "ef4444,dc2626,450a0a", hair: "short15", beard: "variant01", skinColor: "9e5622", hairColor: "0e0e0e" },
    { name: "Wengie", female: true, slug: "wengie", bg: "2dd4bf,14b8a6,115e59", hair: "long02", skinColor: "ecad80", hairColor: "592454" },
    { name: "Enzo", female: false, slug: "enzo", bg: "f97316,ea580c,7c2d12", hair: "short09", beard: "variant04", skinColor: "f2d3b1", hairColor: "562306" },
    { name: "Safiya", female: true, slug: "safiya", bg: "a78bfa,8b5cf6,4c1d95", hair: "long26", glasses: "variant02", skinColor: "9e5622", hairColor: "0e0e0e" },
    { name: "Gio", female: false, slug: "gio", bg: "60a5fa,3b82f6,1e3a8a", hair: "short07", beard: "variant03", skinColor: "ecad80", hairColor: "562306" },
    { name: "Gibi", female: true, slug: "gibi", bg: "fda4af,f9a8d4,9d174d", hair: "long26", skinColor: "f2d3b1", hairColor: "592454" },
    { name: "Kalvijn", female: false, slug: "kalvijn", bg: "fb7185,e11d48,881337", hair: "short13", beard: "variant06", glasses: "variant03", skinColor: "f2d3b1", hairColor: "cb6820" },
    { name: "Rosanna", female: true, slug: "rosanna", bg: "fcd34d,fbbf24,a16207", hair: "long25", skinColor: "f2d3b1", hairColor: "ab2a18" },
    { name: "MKBHD", female: false, slug: "mkbhd", bg: "1e293b,0f172a,020617", hair: "short03", beard: "variant02", glasses: "variant05", skinColor: "763900", hairColor: "0e0e0e" },
    { name: "Jess", female: true, slug: "jess", bg: "4ade80,22c55e,14532d", hair: "long21", skinColor: "ecad80", hairColor: "6a4e35" },
  ];

  const CARD_NAMES = ROSTER.map((c) => c.name);

  const TRAITS = {};
  ROSTER.forEach((c) => {
    TRAITS[c.name] = {
      female: c.female,
      slug: c.slug,
      portrait: PORTRAITS + c.slug + ".png",
      avatar: c,
    };
  });

  function getTraits(name) {
    const base = TRAITS[name];
    if (base) return base;
    const slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, "");
    return {
      female: false,
      slug,
      portrait: PORTRAITS + slug + ".png",
      avatar: { name, slug, bg: "6366f1,8b5cf6,312e81", hair: "short05", skinColor: "f2d3b1", hairColor: "562306" },
    };
  }

  function isGirl(name) {
    return !!getTraits(name).female;
  }

  function buildRemotePortraitUrl(cfg) {
    const p = new URLSearchParams();
    p.set("seed", cfg.name);
    p.set("size", String(AVATAR_SIZE));
    p.set("backgroundType", "gradientLinear");
    p.set("backgroundColor", cfg.bg || "6366f1,8b5cf6,312e81");
    p.set("backgroundRotation", "0,360");
    p.set("skinColor", cfg.skinColor || "f2d3b1");
    p.set("hairColor", cfg.hairColor || "562306");
    p.set("hair", cfg.hair || "short05");
    if (cfg.glasses) {
      p.append("glasses", cfg.glasses);
      p.set("glassesProbability", "100");
    }
    if (cfg.beard) {
      p.append("beard", cfg.beard);
      p.set("beardProbability", "100");
    }
    if (cfg.female) {
      p.append("features", "blush");
      p.set("featuresProbability", "80");
    }
    p.set("_v", AVATAR_CACHE);
    return "https://api.dicebear.com/9.x/" + REMOTE_STYLE + "/png?" + p.toString();
  }

  function cardAvatarUrl(name) {
    const t = getTraits(name);
    if (t.portrait) {
      return t.portrait + "?v=" + AVATAR_CACHE;
    }
    return buildRemotePortraitUrl(t.avatar || { name });
  }

  function cardAvatarFallbackUrl(name) {
    const t = getTraits(name);
    return buildRemotePortraitUrl(t.avatar || { name });
  }

  function decoratePhotoWrap(photoWrap, name) {
    if (!photoWrap) return;
    const girl = isGirl(name);
    const t = getTraits(name);
    photoWrap.classList.remove("card-photo--real", "card-photo--avatar", "card-photo--creator");
    photoWrap.classList.add(
      "card-photo--portrait",
      "card-photo--illustrated",
      "card-photo--animated",
      "card-photo--color",
      girl ? "card-photo--girl" : "card-photo--boy"
    );
    if (t.avatar && t.avatar.glasses) {
      photoWrap.classList.add("card-photo--has-glasses");
    }
    if (t.avatar && t.avatar.beard) {
      photoWrap.classList.add("card-photo--has-beard");
    }
  }

  function applyImgFilter(img) {
    if (!img) return;
    img.style.filter =
      "saturate(1.22) contrast(1.05) brightness(1.06) drop-shadow(0 3px 10px rgba(139,92,246,0.4))";
  }

  function onImageError(img, name, photoWrap) {
    if (!img) return;
    if (img.dataset.fallbackTried !== "1") {
      img.dataset.fallbackTried = "1";
      img.src = cardAvatarFallbackUrl(name);
      return;
    }
    if (img.dataset.fallbackTried !== "2") {
      img.dataset.fallbackTried = "2";
      const t = getTraits(name);
      if (t.portrait && img.src.indexOf("dicebear") < 0) {
        img.src = buildRemotePortraitUrl(t.avatar || { name });
        return;
      }
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
    const girl = isGirl(name);
    const bg = girl ? "#fbcfe8" : "#bfdbfe";
    svg.innerHTML =
      '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#a78bfa"/><stop offset="100%" stop-color="#4c1d95"/></linearGradient></defs>' +
      '<rect width="100" height="120" fill="url(#g)"/>' +
      '<circle cx="50" cy="48" r="24" fill="' +
      bg +
      '"/>' +
      '<circle cx="42" cy="44" r="3" fill="#1e1b4b"/><circle cx="58" cy="44" r="3" fill="#1e1b4b"/>' +
      '<path d="M42 58 Q50 66 58 58" stroke="#1e1b4b" stroke-width="2" fill="none"/>' +
      '<text x="50" y="108" text-anchor="middle" font-size="10" fill="#fef9c3" font-family="sans-serif" font-weight="700">' +
      String(name).slice(0, 9) +
      "</text>";
    return svg;
  }

  window.WieCharacterArt = {
    CARD_NAMES,
    getTraits,
    isGirl,
    cardAvatarUrl,
    cardAvatarFallbackUrl,
    buildRemotePortraitUrl,
    decoratePhotoWrap,
    applyImgFilter,
    createFallbackFace,
    onImageError,
    TRAITS,
  };
})();
