/**
 * Lobby: spelerslijst + chat vóór START GAME (host & gast).
 */
(function () {
  let tFn = (k) => k;
  let role = null;
  let myName = "Speler";
  let guestName = null;
  let guestOnline = false;
  let hostName = "Host";

  const ui = {
    playersHost: null,
    playersGuest: null,
    chatHost: null,
    chatGuest: null,
    inputHost: null,
    inputGuest: null,
    formHost: null,
    formGuest: null,
  };

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getPlayerName() {
    if (typeof window.wieGetPlayerName === "function") {
      const n = window.wieGetPlayerName();
      if (n) return n;
    }
    const saved = localStorage.getItem("wiePlayerName");
    if (saved && saved.trim()) return saved.trim().slice(0, 16);
    return "Speler";
  }

  function renderPlayers(listEl, isHostView) {
    if (!listEl) return;
    listEl.innerHTML = "";
    const hostItem = document.createElement("li");
    hostItem.className = "lobby-player lobby-player--host" + (guestOnline || !isHostView ? " lobby-player--online" : "");
    hostItem.innerHTML =
      '<span class="lobby-player-dot" aria-hidden="true"></span>' +
      "<span class=\"lobby-player-name\">" +
      escapeHtml(isHostView ? myName + " (" + tFn("lobbyYou") + ")" : hostName) +
      "</span>";
    listEl.appendChild(hostItem);

    if (isHostView) {
      const guestItem = document.createElement("li");
      guestItem.className =
        "lobby-player lobby-player--guest" + (guestOnline ? " lobby-player--online" : " lobby-player--waiting");
      const label = guestOnline
        ? escapeHtml(guestName || tFn("lobbyFriend"))
        : tFn("lobbyWaitingFriend");
      guestItem.innerHTML =
        '<span class="lobby-player-dot" aria-hidden="true"></span>' +
        '<span class="lobby-player-name">' +
        label +
        "</span>" +
        (guestOnline ? '<span class="lobby-player-badge">' + tFn("lobbyJoined") + "</span>" : "");
      listEl.appendChild(guestItem);
    } else {
      const meItem = document.createElement("li");
      meItem.className = "lobby-player lobby-player--guest lobby-player--online";
      meItem.innerHTML =
        '<span class="lobby-player-dot" aria-hidden="true"></span>' +
        '<span class="lobby-player-name">' +
        escapeHtml(myName + " (" + tFn("lobbyYou") + ")") +
        "</span>" +
        '<span class="lobby-player-badge">' +
        tFn("lobbyJoined") +
        "</span>";
      listEl.appendChild(meItem);
    }
  }

  function appendChatLine(container, text, who, isMine) {
    if (!container || !text) return;
    const line = document.createElement("div");
    line.className = "lobby-chat-line" + (isMine ? " lobby-chat-line--mine" : "");
    const whoEl = document.createElement("span");
    whoEl.className = "lobby-chat-who";
    whoEl.textContent = who ? who + ": " : "";
    const msgEl = document.createElement("span");
    msgEl.className = "lobby-chat-text";
    msgEl.textContent = text;
    line.append(whoEl, msgEl);
    container.appendChild(line);
    container.scrollTop = container.scrollHeight;
  }

  function refreshAllPlayers() {
    renderPlayers(ui.playersHost, true);
    renderPlayers(ui.playersGuest, false);
  }

  function chatBoxForRole() {
    if (role === "host") return ui.chatHost;
    if (role === "guest") return ui.chatGuest;
    return ui.chatHost || ui.chatGuest;
  }

  function sendChat(text) {
    const trimmed = String(text || "").trim().slice(0, 200);
    if (!trimmed) return;
    const box = chatBoxForRole();
    if (window.WieIsHetOnline && typeof window.WieIsHetOnline.sendLobbyChat === "function") {
      window.WieIsHetOnline.sendLobbyChat(trimmed, myName);
    }
    appendChatLine(box, trimmed, myName, true);
  }

  function bindChatForm(form, input) {
    if (!form || !input) return;
    if (form.dataset.wieChatBound === "1") return;
    form.dataset.wieChatBound = "1";
    input.disabled = false;
    input.readOnly = false;
    input.removeAttribute("disabled");
    input.removeAttribute("readonly");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      sendChat(input.value);
      input.value = "";
      input.focus();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendChat(input.value);
        input.value = "";
      }
    });
  }

  function ensureChatBound() {
    bindChatForm(ui.formHost, ui.inputHost);
    bindChatForm(ui.formGuest, ui.inputGuest);
    if (!ui.formHost || !ui.inputHost) {
      bindChatForm(
        document.getElementById("lobby-chat-form"),
        document.getElementById("lobby-chat-input")
      );
    }
    if (!ui.formGuest || !ui.inputGuest) {
      bindChatForm(
        document.getElementById("joined-chat-form"),
        document.getElementById("joined-chat-input")
      );
    }
  }

  function addSystemLine(text) {
    const hostBox = ui.chatHost;
    const guestBox = ui.chatGuest;
    if (hostBox) {
      const line = document.createElement("div");
      line.className = "lobby-chat-line lobby-chat-line--system";
      line.textContent = text;
      hostBox.appendChild(line);
      hostBox.scrollTop = hostBox.scrollHeight;
    }
    if (guestBox) {
      const line = document.createElement("div");
      line.className = "lobby-chat-line lobby-chat-line--system";
      line.textContent = text;
      guestBox.appendChild(line);
      guestBox.scrollTop = guestBox.scrollHeight;
    }
  }

  window.WieLobby = {
    init(opts) {
      tFn = opts.t || tFn;
      role = opts.role || null;
      myName = getPlayerName();
      ui.playersHost = opts.playersHost || null;
      ui.playersGuest = opts.playersGuest || null;
      ui.chatHost = opts.chatHost || null;
      ui.chatGuest = opts.chatGuest || null;
      ui.inputHost = opts.inputHost || null;
      ui.inputGuest = opts.inputGuest || null;
      ui.formHost = opts.formHost || null;
      ui.formGuest = opts.formGuest || null;
      ensureChatBound();
    },

    sendMessage(text) {
      sendChat(text);
    },

    refresh() {
      refreshAllPlayers();
    },

    reset() {
      guestName = null;
      guestOnline = false;
      hostName = "Host";
      if (ui.chatHost) ui.chatHost.innerHTML = "";
      if (ui.chatGuest) ui.chatGuest.innerHTML = "";
      refreshAllPlayers();
    },

    onOpenAsHost() {
      role = "host";
      guestOnline = false;
      guestName = null;
      if (ui.chatHost) ui.chatHost.innerHTML = "";
      ensureChatBound();
      if (ui.inputHost) {
        ui.inputHost.disabled = false;
        ui.inputHost.readOnly = false;
        setTimeout(() => ui.inputHost.focus(), 100);
      }
      addSystemLine(tFn("lobbyChatHint"));
      refreshAllPlayers();
    },

    onOpenAsGuest() {
      role = "guest";
      if (ui.chatGuest) ui.chatGuest.innerHTML = "";
      ensureChatBound();
      if (ui.inputGuest) {
        ui.inputGuest.disabled = false;
        ui.inputGuest.readOnly = false;
        setTimeout(() => ui.inputGuest.focus(), 100);
      }
      addSystemLine(tFn("lobbyChatHint"));
      refreshAllPlayers();
      if (window.WieIsHetOnline) {
        const sendJoin = () => {
          if (window.WieIsHetOnline.isConnected && window.WieIsHetOnline.isConnected()) {
            window.WieIsHetOnline.sendLobbyJoin(myName);
          }
        };
        sendJoin();
        setTimeout(sendJoin, 400);
        setTimeout(sendJoin, 1200);
      }
    },

    handleMessage(msg) {
      if (!msg || !msg.type) return false;
      if (msg.type === "lobbyJoin" && role === "host") {
        guestOnline = true;
        guestName = msg.name || tFn("lobbyFriend");
        refreshAllPlayers();
        addSystemLine(tFn("lobbyFriendJoined").replace("{name}", guestName));
        const welcome = tFn("lobbyWelcomeChat");
        if (window.WieIsHetOnline) window.WieIsHetOnline.sendLobbyChat(welcome, myName);
        appendChatLine(ui.chatHost, welcome, myName, true);
        return true;
      }
      if (msg.type === "lobbyChat") {
        const box = role === "host" ? ui.chatHost : ui.chatGuest;
        const from = msg.name || (msg.fromHost ? hostName : tFn("lobbyFriend"));
        if (msg.name && role === "guest" && !msg.fromHost) hostName = msg.name;
        if (msg.name && role === "host" && msg.name !== myName) guestName = msg.name;
        appendChatLine(box, msg.text, from, false);
        return true;
      }
      if (msg.type === "connected") {
        if (role === "host") {
          guestOnline = true;
          refreshAllPlayers();
        }
        return true;
      }
      if (msg.type === "disconnected") {
        if (role === "host") {
          guestOnline = false;
          guestName = null;
          refreshAllPlayers();
          addSystemLine(tFn("lobbyFriendLeft"));
        }
        return true;
      }
      return false;
    },
  };
})();
