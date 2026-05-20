/**
 * Personages via DiceBear Avataaars — volledig gezicht (ogen, neus, mond).
 * Geen CSS-overlays meer bovenop de foto.
 */
(function () {
  const HAIR = {
    blonde: "d6b370",
    brown: "724133",
    black: "2c1b18",
    red: "c93305",
    auburn: "a55728",
  };

  const SHIRT = {
    blue: "5199e4",
    red: "ff5c5c",
    green: "a7ffc4",
    yellow: "ffffb1",
    purple: "b1e2ff",
    orange: "ffdeb5",
    teal: "65c9ff",
    pink: "ff488e",
    navy: "25557c",
    coral: "ffafb9",
    lavender: "d1d4f9",
    mint: "a7ffc4",
  };

  /** top = haar of hoed (avataaars), accessories = bril */
  const TRAITS = {
    Anne: { hair: "blonde", shirt: "pink", glasses: true, top: "longHair" },
    Max: { hair: "brown", shirt: "blue", glasses: false, top: "shortFlat" },
    Tom: { hair: "black", shirt: "red", glasses: true, top: "theCaesar" },
    Lisa: { hair: "auburn", shirt: "teal", glasses: false, top: "bob" },
    Ben: { hair: "brown", shirt: "green", glasses: false, top: "hat", hatColor: "1e40af" },
    Sara: { hair: "blonde", shirt: "purple", glasses: true, top: "straight01" },
    Noah: { hair: "black", shirt: "blue", glasses: false, top: "winterHat1", hatColor: "5b21b6" },
    Emma: { hair: "blonde", shirt: "yellow", glasses: true, top: "curly" },
    Jack: { hair: "brown", shirt: "orange", glasses: false, top: "hat", hatColor: "2563eb" },
    Mila: { hair: "black", shirt: "pink", glasses: true, top: "bun" },
    Lucas: { hair: "brown", shirt: "blue", glasses: false, top: "shortWaved" },
    Fleur: { hair: "red", shirt: "green", glasses: true, top: "frida" },
    Daan: { hair: "blonde", shirt: "navy", glasses: false, top: "winterHat02", hatColor: "7c3aed" },
    Evi: { hair: "brown", shirt: "coral", glasses: true, top: "longButNotTooLong" },
    Sam: { hair: "black", shirt: "red", glasses: false, top: "shaggy" },
    Nina: { hair: "auburn", shirt: "lavender", glasses: true, top: "straight02" },
    Finn: { hair: "blonde", shirt: "blue", glasses: false, top: "winterHat03", hatColor: "0d9488" },
    Lynn: { hair: "brown", shirt: "mint", glasses: true, top: "miaWallace" },
    Tim: { hair: "black", shirt: "orange", glasses: false, top: "hat", hatColor: "dc2626" },
    Zoe: { hair: "blonde", shirt: "teal", glasses: true, top: "bigHair" },
    Ole: { hair: "brown", shirt: "yellow", glasses: false, top: "shortRound" },
    Ivy: { hair: "red", shirt: "blue", glasses: true, top: "curvy" },
    Raj: { hair: "black", shirt: "green", glasses: false, top: "shortCurly" },
    Amy: { hair: "blonde", shirt: "red", glasses: true, top: "straightAndStrand" },
    Erik: { hair: "brown", shirt: "navy", glasses: false, top: "hat", hatColor: "1e3a8a" },
    Kim: { hair: "black", shirt: "pink", glasses: true, top: "winterHat04", hatColor: "ec4899" },
    Jay: { hair: "brown", shirt: "purple", glasses: false, top: "theCaesarAndSidePart" },
    Lea: { hair: "auburn", shirt: "blue", glasses: true, top: "dreads01" },
    Fox: { hair: "red", shirt: "orange", glasses: false, top: "hat", hatColor: "ea580c" },
    Joy: { hair: "blonde", shirt: "green", glasses: true, top: "fro" },
    Ian: { hair: "black", shirt: "teal", glasses: false, top: "winterHat1", hatColor: "334155" },
    Rio: { hair: "brown", shirt: "coral", glasses: true, top: "shavedSides" },
  };

  const SKIN = ["ffdbb4", "edb98a", "d08b5b", "ae5d29", "f8d25c"];

  const MALE_NAMES =
    /^(Max|Tom|Ben|Noah|Jack|Lucas|Daan|Sam|Finn|Tim|Ole|Raj|Erik|Jay|Fox|Ian)$/i;
  const FEMALE_NAMES =
    /^(Anne|Lisa|Sara|Emma|Mila|Fleur|Evi|Nina|Lynn|Zoe|Ivy|Amy|Kim|Lea|Joy|Rio)$/i;

  const BG_BOY = "93c5fd,b6e3f4";
  const BG_GIRL = "fbcfe8,f9a8d4";
  const CSS_BOY = "#bfdbfe";
  const CSS_GIRL = "#fbcfe8";

  function isGirl(name) {
    const n = String(name || "").trim();
    if (FEMALE_NAMES.test(n)) return true;
    if (MALE_NAMES.test(n)) return false;
    return true;
  }

  function getTraits(name) {
    return (
      TRAITS[name] || {
        hair: "brown",
        shirt: "blue",
        glasses: false,
        top: "shortFlat",
      }
    );
  }

  function skinForName(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i) * (i + 1)) % SKIN.length;
    return SKIN[h];
  }

  function cardAvatarUrl(name) {
    const t = getTraits(name);
    const params = new URLSearchParams();
    params.set("seed", name);
    params.set("size", "128");
    params.set("backgroundColor", isGirl(name) ? BG_GIRL : BG_BOY);
    params.set("backgroundType", "gradientLinear");
    params.set("eyes", "default");
    params.set("eyebrows", "default");
    params.set("mouth", "smile");
    params.set("nose", "default");
    params.set("hairColor", HAIR[t.hair] || HAIR.brown);
    params.set("clothesColor", SHIRT[t.shirt] || SHIRT.blue);
    params.set("clothing", "shirtCrewNeck");
    params.set("skinColor", skinForName(name));
    params.set("top", t.top || "shortFlat");
    params.set("topProbability", "100");
    params.set("facialHairProbability", "0");
    if (t.hatColor) params.set("hatColor", t.hatColor);
    if (t.glasses) {
      params.set("accessories", "prescription01");
      params.set("accessoriesProbability", "100");
    } else {
      params.set("accessoriesProbability", "0");
    }
    return "https://api.dicebear.com/9.x/avataaars/png?" + params.toString();
  }

  function decoratePhotoWrap(photoWrap, name) {
    if (!photoWrap) return;
    const girl = isGirl(name);
    photoWrap.classList.add("card-photo--gender", girl ? "card-photo--girl" : "card-photo--boy");
    photoWrap.style.backgroundColor = girl ? CSS_GIRL : CSS_BOY;
  }

  function applyImgFilter(img) {
    if (img) img.style.filter = "";
  }

  function createFallbackFace(name) {
    const t = getTraits(name);
    const hair = HAIR[t.hair] || HAIR.brown;
    const shirt = SHIRT[t.shirt] || SHIRT.blue;
    const skin = skinForName(name);
    const bg = isGirl(name) ? CSS_GIRL : CSS_BOY;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 100 120");
    svg.setAttribute("class", "card-face-svg");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML =
      '<rect width="100" height="120" fill="' +
      bg +
      '"/>' +
      '<rect x="0" y="78" width="100" height="42" fill="#' +
      shirt +
      '"/>' +
      '<ellipse cx="50" cy="52" rx="32" ry="36" fill="#' +
      skin +
      '"/>' +
      '<ellipse cx="50" cy="58" rx="26" ry="28" fill="#' +
      skin +
      '"/>' +
      '<path d="M50 62 L50 72" stroke="#c4956a" stroke-width="2.5" stroke-linecap="round"/>' +
      '<path d="M42 78 Q50 84 58 78" fill="none" stroke="#b45309" stroke-width="2" stroke-linecap="round"/>' +
      '<circle cx="38" cy="50" r="4" fill="#1e293b"/>' +
      '<circle cx="62" cy="50" r="4" fill="#1e293b"/>' +
      '<circle cx="39" cy="49" r="1.2" fill="#fff"/>' +
      '<circle cx="63" cy="49" r="1.2" fill="#fff"/>' +
      '<path d="M32 44 Q50 28 68 44" fill="none" stroke="#' +
      hair +
      '" stroke-width="8" stroke-linecap="round"/>' +
      '<path d="M28 40 Q50 18 72 40 L68 48 Q50 32 32 48 Z" fill="#' +
      hair +
      '"/>';
    if (t.glasses) {
      svg.innerHTML +=
        '<rect x="28" y="46" width="18" height="10" rx="3" fill="none" stroke="#1e293b" stroke-width="2"/>' +
        '<rect x="54" y="46" width="18" height="10" rx="3" fill="none" stroke="#1e293b" stroke-width="2"/>' +
        '<path d="M46 51 H54" stroke="#1e293b" stroke-width="2"/>';
    }
    return svg;
  }

  function onImageError(img, name, photoWrap) {
    img.style.display = "none";
    if (photoWrap.querySelector(".card-face-svg")) return;
    photoWrap.appendChild(createFallbackFace(name));
  }

  window.WieCharacterArt = {
    getTraits,
    isGirl,
    cardAvatarUrl,
    decoratePhotoWrap,
    applyImgFilter,
    createFallbackFace,
    onImageError,
    TRAITS,
  };
})();
