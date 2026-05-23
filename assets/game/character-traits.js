/**
 * Gekleurde geanimeerde portretten — lokaal opgeslagen (altijd zichtbaar).
 */
(function () {
  const PORTRAITS = "assets/portraits/";
  const AVATAR_CACHE = "yt-likeness-v7-anas";
  const REMOTE_STYLE = "adventurer";
  const AVATAR_SIZE = 256;

  /* Sync met scripts/download-portraits.mjs */
  const ROSTER = [
    { name: "MrBeast", slug: "mrbeast", seed: "MrBeast-Jimmy", female: false, bg: "f59e0b,ea580c,92400e", hair: "short05", beard: "variant03", skinColor: "f2d3b1", hairColor: "562306", eyes: "variant10" },
    { name: "Pokimane", slug: "pokimane", seed: "Pokimane-Imane", female: true, bg: "ec4899,f472b6,9d174d", hair: "long20", skinColor: "ecad80", hairColor: "592454", eyes: "variant14" },
    { name: "PewDiePie", slug: "pewdiepie", seed: "PewDiePie-Felix", female: false, bg: "3b82f6,2563eb,1e3a8a", hair: "short11", beard: "variant08", glasses: "variant03", skinColor: "f2d3b1", hairColor: "e5d7a3" },
    { name: "Valkyrae", slug: "valkyrae", seed: "Valkyrae-Rae", female: true, bg: "a855f7,7c3aed,4c1d95", hair: "long14", skinColor: "f2d3b1", hairColor: "0e0e0e", eyes: "variant18" },
    { name: "Markiplier", slug: "markiplier", seed: "Markiplier-Mark", female: false, bg: "ef4444,dc2626,7f1d1d", hair: "short08", beard: "variant06", skinColor: "ecad80", hairColor: "0e0e0e", eyes: "variant08" },
    { name: "iJustine", slug: "ijustine", seed: "iJustine-Justine", female: true, bg: "f472b6,ec4899,be185d", hair: "long08", glasses: "variant04", skinColor: "f2d3b1", hairColor: "e5d7a3", eyes: "variant12" },
    { name: "Jacksepticeye", slug: "jacksepticeye", seed: "Jacksepticeye-Sean", female: false, bg: "22c55e,16a34a,14532d", hair: "short16", beard: "variant02", skinColor: "f2d3b1", hairColor: "3eac2c", eyes: "variant16" },
    { name: "SSSniperWolf", slug: "sssniperwolf", seed: "SSSniperWolf-Lia", female: true, bg: "f97316,ea580c,c2410c", hair: "long18", skinColor: "ecad80", hairColor: "592454", eyes: "variant20" },
    { name: "KSI", slug: "ksi", seed: "KSI-JJ", female: false, bg: "eab308,ca8a04,854d0e", hair: "short02", beard: "variant07", skinColor: "9e5622", hairColor: "0e0e0e", eyes: "variant06" },
    { name: "LaurDIY", slug: "laurdiy", seed: "LaurDIY-Lauren", female: true, bg: "fde047,facc15,a16207", hair: "long22", skinColor: "f2d3b1", hairColor: "b9a05f", eyes: "variant11" },
    { name: "Ninja", slug: "ninja", seed: "Ninja-Tyler", female: false, bg: "06b6d4,0284c7,1e3a8a", hair: "short12", skinColor: "f2d3b1", hairColor: "85c2c6", eyes: "variant22" },
    { name: "Emma", slug: "emma", seed: "Emma-Chamberlain", female: true, bg: "fda4af,f43f5e,9f1239", hair: "long06", skinColor: "f2d3b1", hairColor: "592454", eyes: "variant15" },
    { name: "Dream", slug: "dream", seed: "Dream-Mask", female: false, bg: "34d399,10b981,065f46", hair: "short06", skinColor: "f2d3b1", hairColor: "afafaf", eyes: "variant24" },
    { name: "Aphmau", slug: "aphmau", seed: "Aphmau-Jess", female: true, bg: "c084fc,a78bfa,6d28d9", hair: "long12", skinColor: "ecad80", hairColor: "592454", eyes: "variant13" },
    { name: "Vanoss", slug: "vanoss", seed: "VanossGaming", female: false, bg: "64748b,475569,1e293b", hair: "short14", beard: "variant04", glasses: "variant01", skinColor: "f2d3b1", hairColor: "0e0e0e", eyes: "variant09" },
    { name: "Jelly", slug: "jelly", seed: "Jelly-Jelle", female: true, bg: "38bdf8,0ea5e9,0369a1", hair: "long16", skinColor: "f2d3b1", hairColor: "cb6820", eyes: "variant17" },
    { name: "DanTDM", slug: "dantdm", seed: "DanTDM-Dan", female: false, bg: "818cf8,6366f1,4338ca", hair: "short10", beard: "variant01", glasses: "variant04", skinColor: "f2d3b1", hairColor: "ac6511", eyes: "variant14" },
    { name: "Zoella", slug: "zoella", seed: "Zoella-Zoe", female: true, bg: "fb923c,fdba74,c2410c", hair: "long24", skinColor: "ecad80", hairColor: "592454", eyes: "variant19" },
    { name: "Ludwig", slug: "ludwig", seed: "Ludwig-Ahgren", female: false, bg: "fbbf24,f59e0b,b45309", hair: "short18", beard: "variant05", skinColor: "f2d3b1", hairColor: "e5d7a3", eyes: "variant12" },
    { name: "Tana", slug: "tana", seed: "Tana-Mongeau", female: true, bg: "f43f5e,e11d48,9f1239", hair: "long10", glasses: "variant03", skinColor: "f2d3b1", hairColor: "0e0e0e", eyes: "variant21" },
    { name: "xQc", slug: "xqc", seed: "xQc-Felix", female: false, bg: "94a3b8,64748b,334155", hair: "short01", beard: "variant02", skinColor: "f2d3b1", hairColor: "afafaf", eyes: "variant07" },
    { name: "Nikkie", slug: "nikkie", seed: "NikkieTutorials", female: true, bg: "e879f9,d946ef,a21caf", hair: "long04", glasses: "variant05", skinColor: "f2d3b1", hairColor: "e5d7a3", eyes: "variant16" },
    { name: "IShowSpeed", slug: "ishowspeed", seed: "IShowSpeed-Darren", female: false, bg: "ef4444,dc2626,991b1b", hair: "short15", skinColor: "9e5622", hairColor: "0e0e0e", eyes: "variant18" },
    { name: "Anas", slug: "anas", seed: "Anas-Custom", female: false, customPhoto: true, bg: "2dd4bf,14b8a6,0f766e", hair: "short05", skinColor: "ecad80", hairColor: "562306", eyes: "variant10" },
    { name: "Enzo", slug: "enzo", seed: "Enzo-Knol", female: false, bg: "f97316,ea580c,c2410c", hair: "short09", beard: "variant02", skinColor: "f2d3b1", hairColor: "562306", eyes: "variant11" },
    { name: "Safiya", slug: "safiya", seed: "Safiya-Nygaard", female: true, bg: "a78bfa,8b5cf6,6d28d9", hair: "long26", glasses: "variant02", skinColor: "9e5622", hairColor: "0e0e0e", eyes: "variant15" },
    { name: "Gio", slug: "gio", seed: "Gio-Scott", female: false, bg: "60a5fa,3b82f6,1d4ed8", hair: "short07", beard: "variant03", skinColor: "ecad80", hairColor: "562306", eyes: "variant10" },
    { name: "Gibi", slug: "gibi", seed: "Gibi-ASMR", female: true, bg: "fda4af,f9a8d4,db2777", hair: "long26", skinColor: "f2d3b1", hairColor: "592454", eyes: "variant12" },
    { name: "Kalvijn", slug: "kalvijn", seed: "Kalvijn-Dutch", female: false, bg: "fb7185,e11d48,be123c", hair: "short13", beard: "variant04", glasses: "variant03", skinColor: "f2d3b1", hairColor: "cb6820", eyes: "variant13" },
    { name: "Rosanna", slug: "rosanna", seed: "Rosanna-Pansino", female: true, bg: "fcd34d,fbbf24,d97706", hair: "long25", skinColor: "f2d3b1", hairColor: "ab2a18", eyes: "variant18" },
    { name: "MKBHD", slug: "mkbhd", seed: "MKBHD-Marques", female: false, bg: "1e293b,0f172a,020617", hair: "short03", beard: "variant02", glasses: "variant05", skinColor: "763900", hairColor: "0e0e0e", eyes: "variant05" },
    { name: "Jess", slug: "jess", seed: "Jess-Jessica", female: true, bg: "4ade80,22c55e,15803d", hair: "long21", skinColor: "ecad80", hairColor: "6a4e35", eyes: "variant14" },
  ];

  const CARD_NAMES = ROSTER.map((c) => c.name);

  /** Content-tags voor YouTuber-vragen (sync met game-play.js evaluateQuestion). */
  const CREATOR_TAGS = {
    MrBeast: ["vlog"],
    Pokimane: ["gaming", "stream"],
    PewDiePie: ["gaming"],
    Valkyrae: ["gaming", "stream"],
    Markiplier: ["gaming"],
    iJustine: ["tech", "beauty"],
    Jacksepticeye: ["gaming"],
    SSSniperWolf: ["vlog"],
    KSI: ["gaming", "music"],
    LaurDIY: ["beauty"],
    Ninja: ["gaming", "stream"],
    Emma: ["vlog"],
    Dream: ["gaming", "minecraft"],
    Aphmau: ["gaming", "minecraft"],
    Vanoss: ["gaming"],
    Jelly: ["gaming", "dutch"],
    DanTDM: ["gaming", "minecraft"],
    Zoella: ["beauty", "vlog"],
    Ludwig: ["gaming", "stream"],
    Tana: ["vlog"],
    xQc: ["gaming", "stream"],
    Nikkie: ["beauty"],
    IShowSpeed: ["gaming", "stream"],
    Anas: ["gaming", "vlog"],
    Enzo: ["dutch", "vlog"],
    Safiya: ["vlog", "beauty"],
    Gio: ["gaming"],
    Gibi: ["beauty"],
    Kalvijn: ["dutch", "gaming"],
    Rosanna: ["beauty"],
    MKBHD: ["tech"],
    Jess: ["beauty", "vlog"],
  };

  const TRAITS = {};
  ROSTER.forEach((c) => {
    TRAITS[c.name] = {
      female: c.female,
      slug: c.slug,
      portrait: PORTRAITS + c.slug + ".png",
      avatar: c,
      tags: CREATOR_TAGS[c.name] || [],
      customPhoto: Boolean(c.customPhoto),
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
      tags: [],
    };
  }

  function isGirl(name) {
    return !!getTraits(name).female;
  }

  function hasCreatorTag(name, tag) {
    return (getTraits(name).tags || []).includes(tag);
  }

  function buildRemotePortraitUrl(cfg) {
    const p = new URLSearchParams();
    p.set("seed", cfg.seed || cfg.name);
    p.set("size", String(AVATAR_SIZE));
    p.set("backgroundType", "gradientLinear");
    p.set("backgroundColor", cfg.bg || "6366f1,8b5cf6,312e81");
    p.set("backgroundRotation", "0,360");
    p.set("skinColor", cfg.skinColor || "f2d3b1");
    p.set("hairColor", cfg.hairColor || "562306");
    p.set("hair", cfg.hair || "short05");
    if (cfg.eyes) p.set("eyes", cfg.eyes);
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
      p.set("featuresProbability", "85");
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
    if (t.customPhoto) {
      photoWrap.classList.add("card-photo--portrait", "card-photo--real", "card-photo--color");
      photoWrap.classList.add(girl ? "card-photo--girl" : "card-photo--boy");
      return;
    }
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

  function applyImgFilter(img, name) {
    if (!img) return;
    const t = getTraits(name);
    if (t.customPhoto) {
      img.style.filter =
        "saturate(1.05) contrast(1.04) brightness(1.02) drop-shadow(0 2px 8px rgba(0,0,0,0.25))";
      img.style.objectFit = "cover";
      img.style.objectPosition = "center 18%";
      return;
    }
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
    hasCreatorTag,
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
