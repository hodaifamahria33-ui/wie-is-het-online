/**
 * Online potje via PeerJS — host maakt room, gast verbindt met potcode.
 */
(function () {
  const PEER_PREFIX = "wieishet-";
  let peer = null;
  let conn = null;
  let role = null;
  let roomCode = null;
  let connected = false;
  const listeners = new Set();

  function sanitizeCode(code) {
    return String(code || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 5);
  }

  function peerId(code) {
    return PEER_PREFIX + sanitizeCode(code);
  }

  function emit(msg) {
    listeners.forEach((fn) => {
      try {
        fn(msg);
      } catch (e) {
        console.warn("online listener", e);
      }
    });
  }

  function send(data) {
    if (!conn || !conn.open) return false;
    try {
      conn.send(data);
      return true;
    } catch (e) {
      console.warn("send failed", e);
      return false;
    }
  }

  function wireConnection(c) {
    conn = c;
    conn.on("open", () => {
      connected = true;
      emit({ type: "connected" });
    });
    conn.on("data", (data) => emit(data));
    conn.on("close", () => {
      connected = false;
      emit({ type: "disconnected" });
    });
    conn.on("error", (err) => emit({ type: "error", message: String(err) }));
  }

  function destroyPeer() {
    connected = false;
    if (conn) {
      try {
        conn.close();
      } catch (_) {}
      conn = null;
    }
    if (peer) {
      try {
        peer.destroy();
      } catch (_) {}
      peer = null;
    }
  }

  function createHost(code) {
    return new Promise((resolve, reject) => {
      destroyPeer();
      role = "host";
      roomCode = sanitizeCode(code);
      if (!roomCode) {
        reject(new Error("empty-code"));
        return;
      }
      peer = new Peer(peerId(roomCode), { debug: 0 });
      const timeout = setTimeout(() => reject(new Error("timeout")), 12000);
      peer.on("open", () => {
        clearTimeout(timeout);
        peer.on("connection", (c) => {
          if (conn && conn.open) return;
          wireConnection(c);
        });
        resolve({ role, roomCode });
      });
      peer.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  function joinAsGuest(code) {
    return new Promise((resolve, reject) => {
      destroyPeer();
      role = "guest";
      roomCode = sanitizeCode(code);
      if (!roomCode) {
        reject(new Error("empty-code"));
        return;
      }
      peer = new Peer({ debug: 0 });
      const timeout = setTimeout(() => reject(new Error("timeout")), 12000);
      peer.on("open", () => {
        clearTimeout(timeout);
        const c = peer.connect(peerId(roomCode), { reliable: true });
        wireConnection(c);
        resolve({ role, roomCode });
      });
      peer.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  window.WieIsHetOnline = {
    sanitizeCode,
    getRole: () => role,
    getRoomCode: () => roomCode,
    isConnected: () => connected,
    isOnline: () => role === "host" || role === "guest",
    isHost: () => role === "host",
    isGuest: () => role === "guest",

    async setupHost(code) {
      return createHost(code);
    },

    async setupGuest(code) {
      return joinAsGuest(code);
    },

    send,
    broadcastGameStart() {
      return send({ type: "gameStart" });
    },
    sendSecretReady() {
      return send({ type: "secretReady" });
    },
    sendFlip(index, isDown) {
      return send({ type: "flip", index, isDown: isDown !== false });
    },
    sendTurnHandoff() {
      return send({ type: "turnHandoff" });
    },

    sendLobbyJoin(name) {
      return send({ type: "lobbyJoin", name: String(name || "").slice(0, 16) });
    },

    sendLobbyChat(text, name) {
      return send({
        type: "lobbyChat",
        text: String(text || "").slice(0, 200),
        name: String(name || "").slice(0, 16),
        fromHost: role === "host",
      });
    },

    onMessage(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    reset() {
      destroyPeer();
      role = null;
      roomCode = null;
    },
  };
})();
