/**
 * Online potje via PeerJS — host maakt room, gast verbindt met potcode.
 */
(function () {
  const PEER_PREFIX = "wieishet-";
  const PEER_TIMEOUT_MS = 22000;
  const CONN_TIMEOUT_MS = 22000;

  const PEER_OPTS = {
    debug: 0,
    config: {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun.cloudflare.com:3478" },
      ],
    },
  };

  let peer = null;
  let conn = null;
  let role = null;
  let roomCode = null;
  let connected = false;
  const listeners = new Set();
  const pendingOutbox = [];

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

  function flushOutbox() {
    if (!conn || !conn.open) return;
    while (pendingOutbox.length) {
      const data = pendingOutbox.shift();
      try {
        conn.send(data);
      } catch (e) {
        console.warn("flush send failed", e);
        pendingOutbox.unshift(data);
        break;
      }
    }
  }

  function send(data) {
    if (!conn || !conn.open) {
      pendingOutbox.push(data);
      return false;
    }
    try {
      conn.send(data);
      return true;
    } catch (e) {
      console.warn("send failed", e);
      pendingOutbox.push(data);
      return false;
    }
  }

  function waitForConnectionOpen(connection, ms) {
    return new Promise((resolve, reject) => {
      if (!connection) {
        reject(new Error("no-connection"));
        return;
      }
      if (connection.open) {
        resolve();
        return;
      }
      const timeout = setTimeout(() => reject(new Error("conn-timeout")), ms);
      const onOpen = () => {
        clearTimeout(timeout);
        cleanup();
        resolve();
      };
      const onError = (err) => {
        clearTimeout(timeout);
        cleanup();
        reject(err || new Error("conn-error"));
      };
      const onClose = () => {
        clearTimeout(timeout);
        cleanup();
        reject(new Error("conn-closed"));
      };
      function cleanup() {
        connection.off("open", onOpen);
        connection.off("error", onError);
        connection.off("close", onClose);
      }
      connection.on("open", onOpen);
      connection.on("error", onError);
      connection.on("close", onClose);
    });
  }

  function wireConnection(c) {
    conn = c;
    conn.on("open", () => {
      connected = true;
      flushOutbox();
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
    pendingOutbox.length = 0;
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

  function waitForPeerOpen(peerInstance, ms) {
    return new Promise((resolve, reject) => {
      if (!peerInstance) {
        reject(new Error("no-peer"));
        return;
      }
      if (peerInstance.open) {
        resolve();
        return;
      }
      const timeout = setTimeout(() => reject(new Error("peer-timeout")), ms);
      peerInstance.once("open", () => {
        clearTimeout(timeout);
        resolve();
      });
      peerInstance.once("error", (err) => {
        clearTimeout(timeout);
        reject(err || new Error("peer-error"));
      });
    });
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
      const id = peerId(roomCode);
      peer = new Peer(id, { ...PEER_OPTS });

      peer.on("connection", (incoming) => {
        if (conn && conn.open) {
          try {
            incoming.close();
          } catch (_) {}
          return;
        }
        wireConnection(incoming);
      });

      waitForPeerOpen(peer, PEER_TIMEOUT_MS)
        .then(() => resolve({ role, roomCode }))
        .catch(reject);
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

      peer = new Peer({ ...PEER_OPTS });

      waitForPeerOpen(peer, PEER_TIMEOUT_MS)
        .then(() => {
          const targetId = peerId(roomCode);
          const c = peer.connect(targetId, { reliable: true });
          return waitForConnectionOpen(c, CONN_TIMEOUT_MS).then(() => {
            wireConnection(c);
            if (c.open) {
              connected = true;
              flushOutbox();
              emit({ type: "connected" });
            }
            return { role, roomCode };
          });
        })
        .then(resolve)
        .catch(reject);
    });
  }

  window.WieIsHetOnline = {
    sanitizeCode,
    getRole: () => role,
    getRoomCode: () => roomCode,
    isConnected: () => connected && !!(conn && conn.open),
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
