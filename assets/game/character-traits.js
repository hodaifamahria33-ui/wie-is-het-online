/**
 * Geanimeerde portret-personages — gestileerd (DiceBear), geen echte foto's.
 * Elk personage heeft uniek haar, accessoires, bril, pet, enz.
 */
(function () {
  const DEFAULT_STYLE = "notionists";
  const AVATAR_SIZE = 220;
  /** Bump bij nieuwe portretten — forceert browsers cache te vergeten */
  const AVATAR_CACHE = "animated-v3";

  const ROSTER = [
    { name: "MrBeast", female: false, avatar: { hair: "hat", beard: "variant02", glasses: "variant03" } },
    { name: "Pokimane", female: true, avatar: { hair: "variant48", glasses: "variant02", lips: "variant12" } },
    { name: "PewDiePie", female: false, avatar: { hair: "variant18", beard: "variant08", glasses: "variant05" } },
    { name: "Valkyrae", female: true, avatar: { hair: "variant35", glasses: "variant02", lips: "variant08" } },
    { name: "Markiplier", female: false, avatar: { hair: "variant22", beard: "variant04", glasses: "variant07" } },
    { name: "iJustine", female: true, avatar: { hair: "variant41", glasses: "variant04", lips: "variant18" } },
    { name: "Jacksepticeye", female: false, avatar: { hair: "hat", beard: "variant01", gesture: "waveLongArm" } },
    { name: "SSSniperWolf", female: true, avatar: { hair: "variant29", glasses: "variant01", lips: "variant05" } },
    { name: "KSI", female: false, avatar: { hair: "variant14", beard: "variant06", glasses: "variant02" } },
    { name: "LaurDIY", female: true, avatar: { hair: "variant52", lips: "variant14", brows: "variant03" } },
    { name: "Ninja", female: false, avatar: { hair: "hat", beard: "variant03", glasses: "variant09" } },
    { name: "Emma", female: true, avatar: { hair: "variant44", glasses: "variant03", lips: "variant20" } },
    { name: "Dream", female: false, avatar: { hair: "variant08", beard: "variant05", bodyIcon: "galaxy" } },
    { name: "Aphmau", female: true, avatar: { hair: "variant38", lips: "variant11", brows: "variant07" } },
    { name: "Vanoss", female: false, avatar: { hair: "hat", beard: "variant07", glasses: "variant01" } },
    { name: "Jelly", female: true, avatar: { hair: "variant26", glasses: "variant06", lips: "variant16" } },
    { name: "DanTDM", female: false, avatar: { hair: "variant16", beard: "variant09", glasses: "variant04" } },
    { name: "Zoella", female: true, avatar: { hair: "variant55", lips: "variant09", brows: "variant02" } },
    { name: "Ludwig", female: false, avatar: { hair: "variant11", beard: "variant10", glasses: "variant08" } },
    { name: "Tana", female: true, avatar: { hair: "variant31", glasses: "variant05", lips: "variant22" } },
    { name: "xQc", female: false, avatar: { hair: "variant06", beard: "variant11", gesture: "ok" } },
    { name: "Nikkie", female: true, avatar: { hair: "variant47", glasses: "variant07", lips: "variant07" } },
    { name: "IShowSpeed", female: false, avatar: { hair: "hat", beard: "variant12", gesture: "point" } },
    { name: "Wengie", female: true, avatar: { hair: "variant33", lips: "variant13", brows: "variant05" } },
    { name: "Enzo", female: false, avatar: { hair: "variant19", beard: "variant02", glasses: "variant06" } },
    { name: "Safiya", female: true, avatar: { hair: "variant50", glasses: "variant02", lips: "variant19" } },
    { name: "Gio", female: false, avatar: { hair: "variant24", beard: "variant05", bodyIcon: "electric" } },
    { name: "Gibi", female: true, avatar: { hair: "variant42", lips: "variant15", brows: "variant08" } },
    { name: "Kalvijn", female: false, avatar: { hair: "hat", beard: "variant04", glasses: "variant03" } },
    { name: "Rosanna", female: true, avatar: { hair: "variant39", glasses: "variant04", lips: "variant10" } },
    { name: "MKBHD", female: false, avatar: { hair: "variant03", beard: "variant01", glasses: "variant10" } },
    { name: "Jess", female: true, avatar: { hair: "variant27", lips: "variant17", brows: "variant04" } },
  ];

  const CARD_NAMES = ROSTER.map((c) => c.name);

  const TRAITS = {};
  ROSTER.forEach((c) => {
    TRAITS[c.name] = {
      female: c.female,
      seed: c.seed || c.name,
      style: c.style || DEFAULT_STYLE,
      avatar: c.avatar || {},
    };
  });

  function getTraits(name) {
    return (
      TRAITS[name] || {
        female: false,
        seed: name,
        style: DEFAULT_STYLE,
        avatar: {},
      }
    );
  }

  function isGirl(name) {
    return !!getTraits(name).female;
  }

  function appendAvatarParams(params, avatar, seed) {
    params.set("seed", seed);
    params.set("size", String(AVATAR_SIZE));
    params.set("backgroundType", "gradientLinear");
    params.set("backgroundColor", "312e81,6d28d9,0f172a");
    params.set("backgroundRotation", "0,360");

    const skip = new Set(["seed", "size"]);
    Object.keys(avatar || {}).forEach((key) => {
      if (skip.has(key)) return;
      const val = avatar[key];
      if (val == null || val === "") return;
      if (Array.isArray(val)) {
        val.forEach((v) => params.append(key, v));
      } else {
        params.append(key, String(val));
      }
    });

    /* Vaste accessoires: kans op 100% als expliciet gezet */
    if (avatar.glasses) params.set("glassesProbability", "100");
    if (avatar.beard) params.set("beardProbability", "100");
    if (avatar.hair === "hat") params.set("hair", "hat");
    if (avatar.gesture) params.set("gestureProbability", "100");
    if (avatar.bodyIcon) params.set("bodyIconProbability", "100");
  }

  function buildPortraitUrl(name) {
    const t = getTraits(name);
    const style = t.style || DEFAULT_STYLE;
    const params = new URLSearchParams();
    appendAvatarParams(params, t.avatar, t.seed || name);
    params.set("_v", AVATAR_CACHE);
    return "https://api.dicebear.com/9.x/" + style + "/png?" + params.toString();
  }

  function cardAvatarUrl(name) {
    /* Altijd geanimeerd portret — nooit lokale/Wikimedia-foto's */
    return buildPortraitUrl(name);
  }

  function cardAvatarFallbackUrl(name) {
    const t = getTraits(name);
    const params = new URLSearchParams();
    params.set("seed", t.seed || name);
    params.set("size", String(AVATAR_SIZE));
    params.set("backgroundType", "gradientLinear");
    params.set("backgroundColor", "4338ca,7c3aed,1e1b4b");
    return "https://api.dicebear.com/9.x/lorelei/png?" + params.toString();
  }

  function decoratePhotoWrap(photoWrap, name) {
    if (!photoWrap) return;
    const girl = isGirl(name);
    const t = getTraits(name);
    photoWrap.classList.remove(
      "card-photo--real",
      "card-photo--avatar",
      "card-photo--creator"
    );
    photoWrap.classList.add(
      "card-photo--portrait",
      "card-photo--illustrated",
      "card-photo--animated",
      girl ? "card-photo--girl" : "card-photo--boy"
    );
    if (t.avatar && t.avatar.hair === "hat") {
      photoWrap.classList.add("card-photo--has-hat");
    }
    if (t.avatar && t.avatar.glasses) {
      photoWrap.classList.add("card-photo--has-glasses");
    }
  }

  function applyImgFilter(img, name) {
    if (!img) return;
    img.style.filter =
      "saturate(1.15) contrast(1.06) brightness(1.04) drop-shadow(0 2px 8px rgba(99,102,241,0.35))";
  }

  function onImageError(img, name, photoWrap) {
    if (!img) return;
    if (img.dataset.fallbackTried !== "1") {
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
    buildPortraitUrl,
    decoratePhotoWrap,
    applyImgFilter,
    createFallbackFace,
    onImageError,
    TRAITS,
  };
})();
