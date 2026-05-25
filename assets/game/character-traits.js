/**
 * Gekleurde geanimeerde portretten — mega bekende YouTubers wereldwijd.
 * Jongen = blauwe achtergrond, meid = roze achtergrond.
 */
(function () {
  const PORTRAITS = "assets/portraits/";
  const AVATAR_CACHE = "yt-likeness-v10-global";
  const REMOTE_STYLE = "adventurer";
  const AVATAR_SIZE = 256;
  const BOY_BG = "60a5fa,3b82f6,1e3a8a";
  const GIRL_BG = "fbcfe8,f472b6,be185d";

  /* Sync met scripts/download-portraits.mjs */
  const ROSTER = [
    { name: "MrBeast", slug: "mrbeast", seed: "MrBeast-Jimmy", female: false, bg: BOY_BG, hair: "short05", beard: "variant03", skinColor: "f2d3b1", hairColor: "e5d7a3", eyes: "variant10" },
    { name: "PewDiePie", slug: "pewdiepie", seed: "PewDiePie-Felix", female: false, bg: BOY_BG, hair: "short11", beard: "variant08", glasses: "variant03", skinColor: "f2d3b1", hairColor: "e5d7a3" },
    { name: "Markiplier", slug: "markiplier", seed: "Markiplier-Mark", female: false, bg: BOY_BG, hair: "short08", beard: "variant06", skinColor: "ecad80", hairColor: "0e0e0e", eyes: "variant08" },
    { name: "Jacksepticeye", slug: "jacksepticeye", seed: "Jacksepticeye-Sean", female: false, bg: BOY_BG, hair: "short16", beard: "variant02", skinColor: "f2d3b1", hairColor: "3eac2c", eyes: "variant16" },
    { name: "KSI", slug: "ksi", seed: "KSI-JJ", female: false, bg: BOY_BG, hair: "short02", beard: "variant07", skinColor: "9e5622", hairColor: "0e0e0e", eyes: "variant06" },
    { name: "Ninja", slug: "ninja", seed: "Ninja-Tyler", female: false, bg: BOY_BG, hair: "short12", skinColor: "f2d3b1", hairColor: "85c2c6", eyes: "variant22" },
    { name: "Dream", slug: "dream", seed: "Dream-Mask", female: false, bg: BOY_BG, hair: "short06", skinColor: "f2d3b1", hairColor: "afafaf", eyes: "variant24" },
    { name: "DanTDM", slug: "dantdm", seed: "DanTDM-Dan", female: false, bg: BOY_BG, hair: "short10", beard: "variant01", glasses: "variant04", skinColor: "f2d3b1", hairColor: "ac6511", eyes: "variant14" },
    { name: "Ludwig", slug: "ludwig", seed: "Ludwig-Ahgren", female: false, bg: BOY_BG, hair: "short18", beard: "variant05", skinColor: "f2d3b1", hairColor: "e5d7a3", eyes: "variant12" },
    { name: "xQc", slug: "xqc", seed: "xQc-Felix", female: false, bg: BOY_BG, hair: "short01", beard: "variant02", skinColor: "f2d3b1", hairColor: "afafaf", eyes: "variant07" },
    { name: "IShowSpeed", slug: "ishowspeed", seed: "IShowSpeed-Darren", female: false, bg: BOY_BG, hair: "short15", skinColor: "9e5622", hairColor: "0e0e0e", eyes: "variant18" },
    { name: "Logan Paul", slug: "loganpaul", seed: "Logan-Paul-Maverick", female: false, bg: BOY_BG, hair: "short11", skinColor: "f2d3b1", hairColor: "e5d7a3", eyes: "variant12" },
    { name: "MKBHD", slug: "mkbhd", seed: "MKBHD-Marques", female: false, bg: BOY_BG, hair: "short03", beard: "variant02", glasses: "variant05", skinColor: "763900", hairColor: "0e0e0e", eyes: "variant05" },
    { name: "TommyInnit", slug: "tommyinnit", seed: "TommyInnit-Thomas", female: false, bg: BOY_BG, hair: "short09", skinColor: "f2d3b1", hairColor: "cb6820", eyes: "variant11" },
    { name: "CoryxKenshin", slug: "coryxkenshin", seed: "CoryxKenshin-Cory", female: false, bg: BOY_BG, hair: "short07", beard: "variant04", skinColor: "9e5622", hairColor: "0e0e0e", eyes: "variant09" },
    { name: "Rhett", slug: "rhett", seed: "Rhett-Link-McLaughlin", female: false, bg: BOY_BG, hair: "short13", beard: "variant03", glasses: "variant02", skinColor: "f2d3b1", hairColor: "562306", eyes: "variant13" },
    { name: "Pokimane", slug: "pokimane", seed: "Pokimane-Imane", female: true, bg: GIRL_BG, hair: "long20", skinColor: "ecad80", hairColor: "592454", eyes: "variant14" },
    { name: "Valkyrae", slug: "valkyrae", seed: "Valkyrae-Rae", female: true, bg: GIRL_BG, hair: "long14", skinColor: "f2d3b1", hairColor: "0e0e0e", eyes: "variant18" },
    { name: "SSSniperWolf", slug: "sssniperwolf", seed: "SSSniperWolf-Lia", female: true, bg: GIRL_BG, hair: "long18", skinColor: "ecad80", hairColor: "592454", eyes: "variant20" },
    { name: "Emma", slug: "emma", seed: "Emma-Chamberlain", female: true, bg: GIRL_BG, hair: "long06", skinColor: "f2d3b1", hairColor: "592454", eyes: "variant15" },
    { name: "Nikkie", slug: "nikkie", seed: "NikkieTutorials", female: true, bg: GIRL_BG, hair: "long04", glasses: "variant05", skinColor: "f2d3b1", hairColor: "e5d7a3", eyes: "variant16" },
    { name: "Safiya", slug: "safiya", seed: "Safiya-Nygaard", female: true, bg: GIRL_BG, hair: "long26", glasses: "variant02", skinColor: "9e5622", hairColor: "0e0e0e", eyes: "variant15" },
    { name: "Rosanna", slug: "rosanna", seed: "Rosanna-Pansino", female: true, bg: GIRL_BG, hair: "long25", skinColor: "f2d3b1", hairColor: "ab2a18", eyes: "variant18" },
    { name: "Charli", slug: "charli", seed: "Charli-DAmelio", female: true, bg: GIRL_BG, hair: "long10", skinColor: "f2d3b1", hairColor: "0e0e0e", eyes: "variant21" },
    { name: "Addison", slug: "addison", seed: "Addison-Rae", female: true, bg: GIRL_BG, hair: "long22", skinColor: "f2d3b1", hairColor: "592454", eyes: "variant11" },
    { name: "Lilly", slug: "lilly", seed: "Lilly-Singh-Superwoman", female: true, bg: GIRL_BG, hair: "long08", skinColor: "9e5622", hairColor: "0e0e0e", eyes: "variant12" },
    { name: "Liza", slug: "liza", seed: "Liza-Koshy", female: true, bg: GIRL_BG, hair: "long16", skinColor: "9e5622", hairColor: "592454", eyes: "variant17" },
    { name: "Jaiden", slug: "jaiden", seed: "Jaiden-Animations", female: true, bg: GIRL_BG, hair: "long12", skinColor: "f2d3b1", hairColor: "0e0e0e", eyes: "variant13" },
    { name: "Michelle", slug: "michelle", seed: "Michelle-Phan", female: true, bg: GIRL_BG, hair: "long24", skinColor: "ecad80", hairColor: "592454", eyes: "variant19" },
    { name: "Wengie", slug: "wengie", seed: "Wengie-Wendy", female: true, bg: GIRL_BG, hair: "long21", skinColor: "f2d3b1", hairColor: "6a4e35", eyes: "variant14" },
    { name: "Miranda", slug: "miranda", seed: "Miranda-Sings-Colleen", female: true, bg: GIRL_BG, hair: "long26", skinColor: "f2d3b1", hairColor: "e5d7a3", eyes: "variant12" },
    { name: "Bethany", slug: "bethany", seed: "Bethany-Mota", female: true, bg: GIRL_BG, hair: "long18", skinColor: "ecad80", hairColor: "b9a05f", eyes: "variant20" },
  ];

  const CARD_NAMES = ROSTER.map((c) => c.name);

  /** Korte labels op smalle landscape-kaarten (8 kolommen). */
  const SHORT_LABELS = {
    MrBeast: "MRBEAST",
    PewDiePie: "PEWDIEPIE",
    Markiplier: "MARK",
    Jacksepticeye: "JACK",
    KSI: "KSI",
    Ninja: "NINJA",
    Dream: "DREAM",
    DanTDM: "DANTDM",
    Ludwig: "LUDWIG",
    xQc: "XQC",
    IShowSpeed: "SPEED",
    "Logan Paul": "LOGAN",
    MKBHD: "MKBHD",
    TommyInnit: "TOMMY",
    CoryxKenshin: "CORY",
    Rhett: "RHETT",
    Pokimane: "POKI",
    Valkyrae: "RAE",
    SSSniperWolf: "LIA",
    Emma: "EMMA",
    Nikkie: "NIKKIE",
    Safiya: "SAFIYA",
    Rosanna: "ROSANNA",
    Charli: "CHARLI",
    Addison: "ADDISON",
    Lilly: "LILLY",
    Liza: "LIZA",
    Jaiden: "JAIDEN",
    Michelle: "MICHELLE",
    Wengie: "WENGIE",
    Miranda: "MIRANDA",
    Bethany: "BETHANY",
  };

  function isPhoneLandscapeGrid() {
    const shortSide = Math.min(window.innerWidth, window.innerHeight);
    return (
      shortSide <= 520 &&
      window.innerWidth > window.innerHeight &&
      document.documentElement.classList.contains("wie-phone-landscape-game")
    );
  }

  function getCardLabel(name) {
    if (isPhoneLandscapeGrid() && SHORT_LABELS[name]) return SHORT_LABELS[name];
    return name;
  }

  /** Content-tags voor YouTuber-vragen (sync met game-play.js evaluateQuestion). */
  const CREATOR_TAGS = {
    MrBeast: ["vlog", "challenge"],
    PewDiePie: ["gaming"],
    Markiplier: ["gaming"],
    Jacksepticeye: ["gaming"],
    KSI: ["gaming", "music"],
    Ninja: ["gaming", "stream"],
    Dream: ["gaming", "minecraft"],
    DanTDM: ["gaming", "minecraft"],
    Ludwig: ["gaming", "stream"],
    xQc: ["gaming", "stream"],
    IShowSpeed: ["gaming", "stream"],
    "Logan Paul": ["vlog", "boxing"],
    MKBHD: ["tech"],
    TommyInnit: ["gaming", "minecraft"],
    CoryxKenshin: ["gaming"],
    Rhett: ["vlog", "comedy"],
    Pokimane: ["gaming", "stream"],
    Valkyrae: ["gaming", "stream"],
    SSSniperWolf: ["vlog"],
    Emma: ["vlog"],
    Nikkie: ["beauty"],
    Safiya: ["vlog", "beauty"],
    Rosanna: ["beauty"],
    Charli: ["vlog", "dance"],
    Addison: ["vlog", "dance"],
    Lilly: ["comedy", "vlog"],
    Liza: ["comedy", "vlog"],
    Jaiden: ["animation", "vlog"],
    Michelle: ["beauty"],
    Wengie: ["beauty", "vlog"],
    Miranda: ["comedy", "music"],
    Bethany: ["beauty", "fashion"],
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
      avatar: { name, slug, bg: BOY_BG, hair: "short05", skinColor: "f2d3b1", hairColor: "562306" },
      tags: [],
    };
  }

  function isGirl(name) {
    return !!getTraits(name).female;
  }

  function hasCreatorTag(name, tag) {
    return (getTraits(name).tags || []).includes(tag);
  }

  function colorLuminance(hex) {
    const h = String(hex || "")
      .replace(/^#/, "")
      .trim();
    if (h.length !== 6) return 0.5;
    const rgb = [0, 2, 4].map((i) => {
      const v = parseInt(h.slice(i, i + 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }

  const DARK_COLOR_LUM = 0.38;
  const LIGHT_COLOR_LUM = 0.52;

  function avatarCfg(name) {
    return getTraits(name).avatar || {};
  }

  function hasDarkHair(name) {
    const lum = colorLuminance(avatarCfg(name).hairColor);
    return lum < DARK_COLOR_LUM;
  }

  function hasLightHair(name) {
    const lum = colorLuminance(avatarCfg(name).hairColor);
    return lum >= LIGHT_COLOR_LUM;
  }

  function hasDarkSkin(name) {
    const lum = colorLuminance(avatarCfg(name).skinColor);
    return lum < DARK_COLOR_LUM;
  }

  function hasLightSkin(name) {
    const lum = colorLuminance(avatarCfg(name).skinColor);
    return lum >= LIGHT_COLOR_LUM;
  }

  function hasGlasses(name) {
    return Boolean(avatarCfg(name).glasses);
  }

  function hasBeard(name) {
    return Boolean(avatarCfg(name).beard);
  }

  /** Vrije tekst → ja/nee op uiterlijk; null = niet herkend. */
  function answerVisualQuestion(text, name) {
    const q = String(text || "")
      .toLowerCase()
      .trim()
      .replace(/[?!.,;:]+/g, "")
      .replace(/\s+/g, " ");
    if (!q || !name) return null;

    const neg = /\b(niet|geen|no|not|without|zonder)\b/.test(q);
    const pick = (v) => (neg ? !v : v);

    const skinQ =
      /\b(huid|huids|huiskleur|skin|teint)\b/.test(q) ||
      /\b(huid|huids|huiskleur|skin)\s*(kleur|color)\b/.test(q);
    const hairQ = /\b(haar|hair|haarkleur)\b/.test(q);

    if (skinQ && /\b(donker|dark|zwart|black|bruin|brown)\b/.test(q)) {
      return pick(hasDarkSkin(name));
    }
    if (skinQ && /\b(licht|light|blank|wit|white|pale|fair)\b/.test(q)) {
      return pick(hasLightSkin(name));
    }
    if (hairQ && /\b(donker|dark|zwart|black|bruin|brown)\b/.test(q)) {
      return pick(hasDarkHair(name));
    }
    if (hairQ && /\b(blond|blonde|licht|light|grijs|gray|grey|wit|white)\b/.test(q)) {
      return pick(hasLightHair(name));
    }
    if (/\b(bril|glasses|spectacles)\b/.test(q)) {
      return pick(hasGlasses(name));
    }
    if (/\b(baard|beard)\b/.test(q)) {
      return pick(hasBeard(name));
    }
    if (/\b(roze|pink)\b/.test(q) && /\b(achtergrond|background|kaart|card)\b/.test(q)) {
      return pick(isGirl(name));
    }
    if (/\b(blauw|blue)\b/.test(q) && /\b(achtergrond|background|kaart|card)\b/.test(q)) {
      return pick(!isGirl(name));
    }
    return null;
  }

  function buildRemotePortraitUrl(cfg) {
    const p = new URLSearchParams();
    const girl = !!cfg.female;
    p.set("seed", cfg.seed || cfg.name);
    p.set("size", String(AVATAR_SIZE));
    p.set("backgroundType", "gradientLinear");
    p.set("backgroundColor", cfg.bg || (girl ? GIRL_BG : BOY_BG));
    p.set("backgroundRotation", "0,360");
    p.set("skinColor", cfg.skinColor || "f2d3b1");
    p.set("hairColor", cfg.hairColor || "562306");
    p.set("hair", cfg.hair || (girl ? "long14" : "short05"));
    if (cfg.eyes) p.set("eyes", cfg.eyes);
    if (cfg.glasses) {
      p.append("glasses", cfg.glasses);
      p.set("glassesProbability", "100");
    }
    if (cfg.beard) {
      p.append("beard", cfg.beard);
      p.set("beardProbability", "100");
    }
    if (girl) {
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
    photoWrap.classList.remove(
      "card-photo--real",
      "card-photo--avatar",
      "card-photo--creator",
      "card-photo--boy",
      "card-photo--girl"
    );
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

  function decorateCardFace(cardFace, name) {
    if (!cardFace) return;
    const girl = isGirl(name);
    cardFace.classList.remove("card-face--boy", "card-face--girl");
    cardFace.classList.add(girl ? "card-face--girl" : "card-face--boy");
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
    getCardLabel,
    getTraits,
    isGirl,
    hasCreatorTag,
    hasDarkHair,
    hasLightHair,
    hasDarkSkin,
    hasLightSkin,
    hasGlasses,
    hasBeard,
    answerVisualQuestion,
    cardAvatarUrl,
    cardAvatarFallbackUrl,
    buildRemotePortraitUrl,
    decoratePhotoWrap,
    decorateCardFace,
    applyImgFilter,
    createFallbackFace,
    onImageError,
    TRAITS,
  };
})();
