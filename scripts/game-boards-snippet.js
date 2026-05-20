    const CARD_NAMES = [
      "Anne", "Max", "Tom", "Lisa", "Ben", "Sara",
      "Noah", "Emma", "Jack", "Mila", "Lucas", "Fleur",
      "Daan", "Evi", "Sam", "Nina", "Finn", "Lynn",
      "Tim", "Zoe", "Ole", "Ivy", "Raj", "Amy"
    ];

    function cardAvatarUrl(name) {
      return (
        "https://api.dicebear.com/7.x/notionists/png?seed=" +
        encodeURIComponent(name) +
        "&size=96&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf"
      );
    }

    function buildGameBoards() {
      const player = document.getElementById("player-board");
      const opponent = document.getElementById("opponent-board");
      if (!player || !opponent) return;
      player.innerHTML = "";
      opponent.innerHTML = "";
      for (let i = 0; i < 24; i++) {
        const down = i % 7 === 3 || i % 11 === 5;
        const name = CARD_NAMES[i];
        const photo = cardAvatarUrl(name);

        const well = document.createElement("div");
        well.className = "card-well";
        const tile = document.createElement("div");
        tile.className = "card-tile" + (down ? " is-down" : "");
        const face = document.createElement("div");
        face.className = "card-face";
        const photoWrap = document.createElement("div");
        photoWrap.className = "card-photo";
        const img = document.createElement("img");
        img.className = "card-img";
        img.src = photo;
        img.alt = name;
        img.loading = "lazy";
        img.onerror = function () {
          this.replaceWith(Object.assign(document.createElement("span"), {
            className: "face-ph",
            ariaHidden: "true",
          }));
        };
        photoWrap.appendChild(img);
        const label = document.createElement("span");
        label.className = "card-name";
        label.textContent = name;
        face.append(photoWrap, label);
        tile.appendChild(face);
        well.appendChild(tile);
        player.appendChild(well);

        const oppWell = document.createElement("div");
        oppWell.className = "card-well";
        const oppTile = document.createElement("div");
        oppTile.className = "card-tile card-tile--opp" + (down ? " is-down" : "");
        const back = document.createElement("div");
        back.className = "card-back-face";
        back.setAttribute("aria-hidden", "true");
        oppTile.appendChild(back);
        oppWell.appendChild(oppTile);
        opponent.appendChild(oppWell);
      }
    }
