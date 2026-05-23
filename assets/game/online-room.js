/**
 * Online potje via PeerJS — host maakt room, gast verbindt met potcode.
 */
(function () {
  const PEER_PREFIX = "wieishet-";
  const PEER_TIMEOUT_MS = 28000;
  const CONN_TIMEOUT_MS = 22000;
  const HOST_PROBE_MS = 4500;
  const PEER_CLOUD = "https://0.peerjs.com";
  const PEER_PATH = "/peerjs";
  const PEER_KEY = "peerjs";

  const ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
    {
      urls: "turn:openrelay.metered.ca:80?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ];

  /** Alleen ICE — PeerJS cloud defaults voor host/path. */
  const PEER_OPTS = {
    debug: 0,
    config: { iceServers: ICE_SERVERS },
  };

  let peer = null;
  let conn = null;
  let role = null;
  let roomCode = null;
  let connected = false;
  let hostReconnectTimer = null;
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

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function ensurePeerJs() {
    if (typeof window.Peer !== "function") {
      throw new Error("peerjs-missing");
    }
  }

  function isPeerLive() {
    return !!(peer && peer.open && !peer.destroyed);
  }

  async function probeHostOnline(code) {
    const id = peerId(code);
    const url =
      PEER_CLOUD +
      PEER_PATH +
      "/" +
      PEER_KEY +
      "/peers/" +
      encodeURIComponent(id);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), HOST_PROBE_MS);
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        cache: "no-store",
        mode: "cors",
      });
      if (res.status === 404) return false;
      if (res.ok) return true;
      return null;
    } catch (_) {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  async function waitForHostProbe(code, maxMs) {
    const deadline = Date.now() + (maxMs || 16000);
    while (Date.now() < deadline) {
      const probe = await probeHostOnline(code);
      if (probe === true) return true;
      await sleep(700);
    }
    return false;
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

  function mapJoinError(err) {
    const type = String(err && err.type ? err.type : "").toLowerCase();
    const msg = String(err && err.message ? err.message : err || "").toLowerCase();
    if (
      type === "peer-unavailable" ||
      type === "network" ||
      type === "disconnected" ||
      msg.includes("lobby-not-found") ||
      msg.includes("unavailable") ||
      msg.includes("could not connect") ||
      msg.includes("not found") ||
      msg.includes("conn-timeout") ||
      msg.includes("conn-closed") ||
      msg.includes("peer-timeout") ||
      msg.includes("peer-error") ||
      msg.includes("no-connection")
    ) {
      return new Error("lobby-not-found");
    }
    return err instanceof Error ? err : new Error(msg || "conn-error");
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
        reject(mapJoinError(err));
      };
      const onClose = () => {
        if (connection.open) return;
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
    if (conn && conn !== c) {
      try {
        conn.close();
      } catch (_) {}
    }
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

  function clearHostReconnect() {
    if (hostReconnectTimer) {
      clearTimeout(hostReconnectTimer);
      hostReconnectTimer = null;
    }
  }

  function scheduleHostReconnect() {
    if (role !== "host" || !roomCode) return;
    clearHostReconnect();
    hostReconnectTimer = window.setTimeout(() => {
      hostReconnectTimer = null;
      if (role !== "host" || !roomCode || isPeerLive()) return;
      createHost(roomCode).catch((e) => {
        console.warn("host reconnect failed", e);
        scheduleHostReconnect();
      });
    }, 1800);
  }

  function destroyPeer() {
    connected = false;
    clearHostReconnect();
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
      const onOpen = () => {
        clearTimeout(timeout);
        cleanup();
        resolve();
      };
      const onError = (err) => {
        clearTimeout(timeout);
        cleanup();
        reject(err || new Error("peer-error"));
      };
      function cleanup() {
        peerInstance.off("open", onOpen);
        peerInstance.off("error", onError);
      }
      peerInstance.on("open", onOpen);
      peerInstance.on("error", onError);
    });
  }

  function acceptIncoming(incoming) {
    if (conn && conn.open) {
      try {
        incoming.close();
      } catch (_) {}
      return;
    }
    wireConnection(incoming);
  }

  function attachHostPeerHandlers() {
    if (!peer) return;
    peer.on("connection", acceptIncoming);
    peer.on("disconnected", () => {
      console.warn("host peer disconnected — reconnecting");
      scheduleHostReconnect();
    });
    peer.on("error", (err) => {
      console.warn("host peer error", err);
      const type = String(err && err.type ? err.type : "").toLowerCase();
      if (type === "network" || type === "disconnected" || type === "server-error") {
        scheduleHostReconnect();
      }
    });
  }

  function createHost(code) {
    return new Promise((resolve, reject) => {
      ensurePeerJs();
      destroyPeer();
      role = "host";
      roomCode = sanitizeCode(code);
      if (!roomCode) {
        reject(new Error("empty-code"));
        return;
      }
      const id = peerId(roomCode);
      peer = new Peer(id, { ...PEER_OPTS });
      attachHostPeerHandlers();

      waitForPeerOpen(peer, PEER_TIMEOUT_MS)
        .then(() => resolve({ role, roomCode }))
        .catch(reject);
    });
  }

  function joinAsGuest(code) {
    return new Promise((resolve, reject) => {
      ensurePeerJs();
      destroyPeer();
      role = "guest";
      roomCode = sanitizeCode(code);
      if (!roomCode) {
        reject(new Error("empty-code"));
        return;
      }

      peer = new Peer({ ...PEER_OPTS });

      peer.on("error", (err) => {
        console.warn("guest peer error", err);
      });

      waitForPeerOpen(peer, PEER_TIMEOUT_MS)
        .then(() => sleep(500))
        .then(() => {
          const targetId = peerId(roomCode);
          return new Promise((res, rej) => {
            const c = peer.connect(targetId, {
              reliable: true,
              serialization: "json",
            });
            if (!c) {
              rej(new Error("no-connection"));
              return;
            }
            let settled = false;
            const finish = (fn, arg) => {
              if (settled) return;
              settled = true;
              peer.off("error", onPeerErr);
              fn(arg);
            };
            const onPeerErr = (err) => finish(rej, mapJoinError(err));
            peer.on("error", onPeerErr);
            waitForConnectionOpen(c, CONN_TIMEOUT_MS)
              .then(() => {
                wireConnection(c);
                if (c.open) {
                  connected = true;
                  flushOutbox();
                  emit({ type: "connected" });
                }
                finish(res, { role, roomCode });
              })
              .catch((err) => finish(rej, mapJoinError(err)));
          });
        })
        .then(resolve)
        .catch((err) => reject(mapJoinError(err)));
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
    isHostPeerLive: () => role === "host" && isPeerLive(),

    async setupHost(code) {
      const sanitized = sanitizeCode(code);
      if (!sanitized) throw new Error("empty-code");
      ensurePeerJs();
      let lastErr = null;
      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          if (attempt > 0) {
            destroyPeer();
            await sleep(900 + attempt * 450);
          }
          await createHost(sanitized);
          if (!isPeerLive()) throw new Error("peer-timeout");
          return { role: "host", roomCode: sanitized };
        } catch (e) {
          lastErr = e;
          console.warn("setupHost attempt", attempt + 1, e);
        }
      }
      throw lastErr || new Error("peer-error");
    },

    async probeHostOnline(code) {
      return probeHostOnline(code);
    },

    async setupGuest(code) {
      const sanitized = sanitizeCode(code);
      if (!sanitized) throw new Error("empty-code");
      ensurePeerJs();
      await waitForHostProbe(sanitized, 18000);
      await joinAsGuest(sanitized);
      if (!connected || !conn || !conn.open) {
        throw new Error("lobby-not-found");
      }
      return { role: "guest", roomCode: sanitized };
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
