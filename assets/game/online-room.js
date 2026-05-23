/**
 * Online potje — WebSocket relay (als signalUrl gezet) + PeerJS fallback.
 */
(function () {
  const PEER_PREFIX = "wieishet-";
  const PEER_TIMEOUT_MS = 28000;
  const CONN_TIMEOUT_MS = 22000;
  const HOST_PROBE_MS = 3500;
  const WS_OPEN_TIMEOUT_MS = 20000;
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

  const PEER_OPTS = {
    debug: 0,
    host: "0.peerjs.com",
    port: 443,
    path: "/peerjs",
    secure: true,
    key: PEER_KEY,
    config: { iceServers: ICE_SERVERS },
  };

  let backend = null;
  let role = null;
  let roomCode = null;
  let connected = false;
  let ws = null;
  let peer = null;
  let conn = null;
  let hostReconnectTimer = null;
  const listeners = new Set();
  const pendingOutbox = [];

  function signalUrls() {
    const cfg = window.WIE_ONLINE || {};
    const list = [];
    if (cfg.signalUrl) list.push(String(cfg.signalUrl).replace(/\/$/, ""));
    if (cfg.signalUrlFallback) {
      list.push(String(cfg.signalUrlFallback).replace(/\/$/, ""));
    }
    return [...new Set(list.filter(Boolean))];
  }

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

  async function probeHostPeer(code) {
    const id = peerId(code);
    const url =
      PEER_CLOUD + PEER_PATH + "/" + PEER_KEY + "/peers/" + encodeURIComponent(id);
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

  async function waitForHostPeer(code, maxMs) {
    const deadline = Date.now() + (maxMs || 12000);
    while (Date.now() < deadline) {
      const probe = await probeHostPeer(code);
      if (probe === true) return true;
      if (probe === false) throw new Error("lobby-not-found");
      await sleep(650);
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

  function setConnected(val) {
    connected = val;
    if (val) flushOutbox();
  }

  function flushOutbox() {
    if (!connected) return;
    while (pendingOutbox.length) {
      const data = pendingOutbox.shift();
      if (!sendNow(data)) {
        pendingOutbox.unshift(data);
        break;
      }
    }
  }

  function sendNow(data) {
    if (backend === "relay" && ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(data));
        return true;
      } catch (e) {
        return false;
      }
    }
    if (backend === "peerjs" && conn && conn.open) {
      try {
        conn.send(data);
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  function send(data) {
    if (!sendNow(data)) {
      pendingOutbox.push(data);
      return false;
    }
    return true;
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
      msg.includes("no-connection") ||
      msg.includes("ws-timeout") ||
      msg.includes("ws-error") ||
      msg.includes("signal-unavailable")
    ) {
      return new Error("lobby-not-found");
    }
    return err instanceof Error ? err : new Error(msg || "conn-error");
  }

  function destroyAll() {
    connected = false;
    backend = null;
    if (hostReconnectTimer) {
      clearTimeout(hostReconnectTimer);
      hostReconnectTimer = null;
    }
    pendingOutbox.length = 0;
    if (ws) {
      try {
        ws.close();
      } catch (_) {}
      ws = null;
    }
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

  function waitForPeerConnected(ms) {
    return new Promise((resolve, reject) => {
      if (connected) {
        resolve();
        return;
      }
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error("lobby-not-found"));
      }, ms);
      const onMsg = (msg) => {
        if (msg && msg.type === "connected") {
          clearTimeout(timer);
          cleanup();
          resolve();
        }
      };
      function cleanup() {
        listeners.delete(onMsg);
      }
      listeners.add(onMsg);
    });
  }

  async function probeSignalBase(base) {
    try {
      const res = await fetch(base.replace(/\/$/, "") + "/health", {
        cache: "no-store",
        mode: "cors",
      });
      if (!res.ok) return false;
      const data = await res.json().catch(() => ({}));
      return data && data.ok === true;
    } catch (_) {
      return false;
    }
  }

  async function pickSignalBase() {
    for (const base of signalUrls()) {
      if (await probeSignalBase(base)) return base;
    }
    return null;
  }

  function wsUrlFor(base, code, asRole) {
    const u = new URL(base.replace(/\/$/, "") + "/");
    u.searchParams.set("code", code);
    u.searchParams.set("role", asRole);
    const proto = u.protocol === "https:" ? "wss:" : "ws:";
    return proto + "//" + u.host + u.pathname + u.search;
  }

  function waitForWsOpen(socket, ms) {
    return new Promise((resolve, reject) => {
      if (socket.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }
      const timer = setTimeout(() => reject(new Error("ws-timeout")), ms);
      const onOpen = () => {
        clearTimeout(timer);
        cleanup();
        resolve();
      };
      const onErr = () => {
        clearTimeout(timer);
        cleanup();
        reject(new Error("ws-error"));
      };
      function cleanup() {
        socket.removeEventListener("open", onOpen);
        socket.removeEventListener("error", onErr);
      }
      socket.addEventListener("open", onOpen);
      socket.addEventListener("error", onErr);
    });
  }

  function attachWsHandlers(socket) {
    socket.addEventListener("message", (ev) => {
      let data = null;
      try {
        data = JSON.parse(String(ev.data || ""));
      } catch (_) {
        return;
      }
      if (!data || !data.type) return;
      if (data.type === "connected") {
        setConnected(true);
        emit({ type: "connected" });
        return;
      }
      if (data.type === "disconnected") {
        setConnected(false);
        emit({ type: "disconnected" });
        return;
      }
      emit(data);
    });
    socket.addEventListener("close", () => {
      setConnected(false);
      emit({ type: "disconnected" });
      if (role === "host" && roomCode && backend === "relay") {
        hostReconnectTimer = window.setTimeout(() => {
          connectRelayHost(roomCode).catch(() => {});
        }, 2000);
      }
    });
  }

  async function connectRelayHost(code) {
    const base = await pickSignalBase();
    if (!base) throw new Error("signal-unavailable");
    destroyAll();
    backend = "relay";
    role = "host";
    roomCode = sanitizeCode(code);
    const socket = new WebSocket(wsUrlFor(base, roomCode, "host"));
    ws = socket;
    attachWsHandlers(socket);
    await waitForWsOpen(socket, WS_OPEN_TIMEOUT_MS);
    setConnected(true);
    emit({ type: "connected" });
    return { role, roomCode, backend };
  }

  async function connectRelayGuest(code) {
    const base = await pickSignalBase();
    if (!base) throw new Error("signal-unavailable");
    destroyAll();
    backend = "relay";
    role = "guest";
    roomCode = sanitizeCode(code);
    const socket = new WebSocket(wsUrlFor(base, roomCode, "guest"));
    ws = socket;
    attachWsHandlers(socket);
    await waitForWsOpen(socket, WS_OPEN_TIMEOUT_MS);
    await waitForPeerConnected(CONN_TIMEOUT_MS);
    return { role, roomCode, backend };
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
      setConnected(true);
      emit({ type: "connected" });
    });
    conn.on("data", (data) => emit(data));
    conn.on("close", () => {
      setConnected(false);
      emit({ type: "disconnected" });
    });
    conn.on("error", (err) => emit({ type: "error", message: String(err) }));
  }

  function scheduleHostReconnect() {
    if (role !== "host" || !roomCode || backend !== "peerjs") return;
    if (hostReconnectTimer) clearTimeout(hostReconnectTimer);
    hostReconnectTimer = window.setTimeout(() => {
      hostReconnectTimer = null;
      if (role !== "host" || !roomCode || isPeerLive()) return;
      createPeerHost(roomCode).catch(() => scheduleHostReconnect());
    }, 1800);
  }

  function attachHostPeerHandlers() {
    if (!peer) return;
    peer.on("connection", (incoming) => {
      if (conn && conn.open) {
        try {
          incoming.close();
        } catch (_) {}
        return;
      }
      wireConnection(incoming);
    });
    peer.on("disconnected", () => scheduleHostReconnect());
    peer.on("error", (err) => {
      const type = String(err && err.type ? err.type : "").toLowerCase();
      if (type === "network" || type === "disconnected" || type === "server-error") {
        scheduleHostReconnect();
      }
    });
  }

  function createPeerHost(code) {
    return new Promise((resolve, reject) => {
      ensurePeerJs();
      destroyAll();
      backend = "peerjs";
      role = "host";
      roomCode = sanitizeCode(code);
      peer = new Peer(peerId(roomCode), { ...PEER_OPTS });
      attachHostPeerHandlers();
      waitForPeerOpen(peer, PEER_TIMEOUT_MS)
        .then(() => resolve({ role, roomCode, backend }))
        .catch(reject);
    });
  }

  function joinPeerGuest(code) {
    return new Promise((resolve, reject) => {
      ensurePeerJs();
      destroyAll();
      backend = "peerjs";
      role = "guest";
      roomCode = sanitizeCode(code);
      peer = new Peer({ ...PEER_OPTS });
      peer.on("error", (err) => console.warn("guest peer error", err));
      waitForPeerOpen(peer, PEER_TIMEOUT_MS)
        .then(() => sleep(500))
        .then(() => {
          const c = peer.connect(peerId(roomCode), {
            reliable: true,
            serialization: "json",
          });
          if (!c) {
            reject(new Error("no-connection"));
            return;
          }
          return waitForConnectionOpen(c, CONN_TIMEOUT_MS).then(() => {
            wireConnection(c);
            if (c.open) {
              setConnected(true);
              emit({ type: "connected" });
            }
            return { role, roomCode, backend };
          });
        })
        .then(resolve)
        .catch((err) => reject(mapJoinError(err)));
    });
  }

  async function setupHost(code) {
    const sanitized = sanitizeCode(code);
    if (!sanitized) throw new Error("empty-code");

    const bases = signalUrls();
    if (bases.length) {
      for (let i = 0; i < 3; i++) {
        try {
          if (i > 0) {
            destroyAll();
            await sleep(800);
          }
          return await connectRelayHost(sanitized);
        } catch (e) {
          console.warn("relay host", i + 1, e);
        }
      }
    }

    let lastErr = null;
    for (let i = 0; i < 6; i++) {
      try {
        if (i > 0) {
          destroyAll();
          await sleep(900 + i * 400);
        }
        await createPeerHost(sanitized);
        if (!isPeerLive()) throw new Error("peer-timeout");
        return { role: "host", roomCode: sanitized, backend: "peerjs" };
      } catch (e) {
        lastErr = e;
        console.warn("peerjs host", i + 1, e);
      }
    }
    throw lastErr || new Error("peer-error");
  }

  async function setupGuest(code) {
    const sanitized = sanitizeCode(code);
    if (!sanitized) throw new Error("empty-code");

    if (signalUrls().length) {
      for (let i = 0; i < 4; i++) {
        try {
          if (i > 0) {
            destroyAll();
            await sleep(900);
          }
          return await connectRelayGuest(sanitized);
        } catch (e) {
          console.warn("relay guest", i + 1, e);
          if (String(e.message).includes("lobby-not-found")) throw e;
        }
      }
    }

    await waitForHostPeer(sanitized, 14000);
    await joinPeerGuest(sanitized);
    if (!connected || (backend === "peerjs" && (!conn || !conn.open))) {
      throw new Error("lobby-not-found");
    }
    return { role: "guest", roomCode: sanitized, backend };
  }

  window.WieIsHetOnline = {
    sanitizeCode,
    getRole: () => role,
    getRoomCode: () => roomCode,
    getBackend: () => backend,
    isConnected: () => {
      if (backend === "relay") return connected && ws && ws.readyState === WebSocket.OPEN;
      return connected && !!(conn && conn.open);
    },
    isOnline: () => role === "host" || role === "guest",
    isHost: () => role === "host",
    isGuest: () => role === "guest",
    isHostPeerLive: () => {
      if (role !== "host") return false;
      if (backend === "relay") return !!(ws && ws.readyState === WebSocket.OPEN);
      return isPeerLive();
    },

    setupHost,
    probeHostOnline: probeHostPeer,
    setupGuest,

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
      destroyAll();
      role = null;
      roomCode = null;
    },
  };
})();
