/**
 * Personages — realistische portretfoto's + leuke namen.
 */
(function () {
  const ROSTER = [
    { name: "Bram", female: false, glasses: false, hair: "brown" },
    { name: "Saar", female: true, glasses: true, hair: "blonde" },
    { name: "Mo", female: false, glasses: false, hair: "black" },
    { name: "Faye", female: true, glasses: false, hair: "auburn" },
    { name: "Stijn", female: false, glasses: true, hair: "brown" },
    { name: "Nora", female: true, glasses: false, hair: "black" },
    { name: "Tygo", female: false, glasses: false, hair: "blonde" },
    { name: "Iris", female: true, glasses: true, hair: "brown" },
    { name: "Cas", female: false, glasses: false, hair: "black" },
    { name: "Lieke", female: true, glasses: false, hair: "blonde" },
    { name: "Samir", female: false, glasses: true, hair: "black" },
    { name: "Roos", female: true, glasses: false, hair: "red" },
    { name: "Mees", female: false, glasses: false, hair: "brown" },
    { name: "Yara", female: true, glasses: true, hair: "black" },
    { name: "Gijs", female: false, glasses: false, hair: "blonde" },
    { name: "Tessa", female: true, glasses: false, hair: "brown" },
    { name: "Pim", female: false, glasses: true, hair: "brown" },
    { name: "Esra", female: true, glasses: false, hair: "black" },
    { name: "Bo", female: false, glasses: false, hair: "blonde" },
    { name: "Kim", female: true, glasses: true, hair: "black" },
    { name: "Dex", female: false, glasses: false, hair: "brown" },
    { name: "Noor", female: true, glasses: false, hair: "auburn" },
    { name: "Teun", female: false, glasses: true, hair: "brown" },
    { name: "Zoë", female: true, glasses: false, hair: "blonde" },
    { name: "Quinn", female: false, glasses: false, hair: "black" },
    { name: "Maya", female: true, glasses: true, hair: "brown" },
    { name: "Jip", female: false, glasses: false, hair: "blonde" },
    { name: "Lina", female: true, glasses: false, hair: "black" },
    { name: "Ravi", female: false, glasses: true, hair: "black" },
    { name: "Evi", female: true, glasses: false, hair: "red" },
    { name: "Ollie", female: false, glasses: false, hair: "brown" },
    { name: "Demi", female: true, glasses: true, hair: "blonde" },
  ];

  const CARD_NAMES = ROSTER.map((c) => c.name);

  const TRAITS = {};
  ROSTER.forEach((c) => {
    TRAITS[c.name] = {
      hair: c.hair,
      glasses: c.glasses,
      female: c.female,
    };
  });

  function getTraits(name) {
    return (
      TRAITS[name] || {
        hair: "brown",
        glasses: false,
        female: false,
      }
    );
  }

  function isGirl(name) {
    const t = getTraits(name);
    return !!t.female;
  }

  function portraitIndex(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) {
      h = (h * 31 + name.charCodeAt(i)) >>> 0;
    }
    return h % 99;
  }

  function cardAvatarUrl(name) {
    const idx = portraitIndex(name);
    const folder = isGirl(name) ? "women" : "men";
    return `https://randomuser.me/api/portraits/${folder}/${idx}.jpg`;
  }

  function cardAvatarFallbackUrl(name) {
    const params = new URLSearchParams();
    params.set("seed", name);
    params.set("size", "160");
    params.set("backgroundColor", "1e1b4b,312e81,4c1d95");
    params.set("backgroundType", "gradientLinear");
    return "https://api.dicebear.com/9.x/personas/png?" + params.toString();
  }

  function decoratePhotoWrap(photoWrap, name) {
    if (!photoWrap) return;
    const girl = isGirl(name);
    photoWrap.classList.add("card-photo--portrait", girl ? "card-photo--girl" : "card-photo--boy");
  }

  function applyImgFilter(img) {
    if (!img) return;
    img.style.filter = "contrast(1.06) saturate(1.05)";
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
      '<text x="50" y="105" text-anchor="middle" font-size="14" fill="#1e1b4b" font-family="sans-serif" font-weight="700">' +
      String(name).slice(0, 6) +
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
