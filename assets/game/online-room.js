/**
 * Online potje — WebSocket relay (als signalUrl gezet) + PeerJS fallback.
 */
(function () {
  const PEER_PREFIX = "wieishet-";
  const PEER_TIMEOUT_MS = 28000;
  const CONN_TIMEOUT_MS = 32000;
  const RELAY_PAIR_TIMEOUT_MS = 90000;
  const RELAY_HOST_WAIT_MS = 70000;
  const HOST_PROBE_MS = 3500;
  const WS_OPEN_TIMEOUT_MS = 12000;
  const RELAY_PROBE_MS = 4000;
  const PEER_HOST = "0.peerjs.com";
  const PEER_PORT = 443;
  const PEER_PATH = "/peerjs";
  const PEER_KEY = "peerjs";
  const PEER_SECURE = true;

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
    host: PEER_HOST,
    port: PEER_PORT,
    path: PEER_PATH,
    key: PEER_KEY,
    secure: PEER_SECURE,
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
  let lastRelayBase = null;
  const listeners = new Set();
  const pendingOutbox = [];

  function signalUrls() {
    const cfg = window.WIE_ONLINE || {};
    const list = [];
    if (cfg.signalUrl) list.push(String(cfg.signalUrl).replace(/\/$/, ""));
    if (cfg.signalUrlFallback) {
      list.push(String(cfg.signalUrlFallback).replace(/\/$/, ""));
    }
    if (Array.isArray(cfg.signalUrlCandidates)) {
      cfg.signalUrlCandidates.forEach((u) => {
        if (u) list.push(String(u).replace(/\/$/, ""));
      });
    }
    if (window.WieOnlineConfig && typeof WieOnlineConfig.bases === "function") {
      WieOnlineConfig.bases().forEach((u) => list.push(u));
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
      (PEER_SECURE ? "https" : "http") +
      "://" +
      PEER_HOST +
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

  async function waitForHostPeer(code, maxMs) {
    const deadline = Date.now() + (maxMs || 45000);
    let falseStreak = 0;
    let sawHost = false;
    while (Date.now() < deadline) {
      const probe = await probeHostPeer(code);
      if (probe === true) {
        sawHost = true;
        falseStreak = 0;
        await sleep(500);
        return true;
      }
      if (probe === false) {
        falseStreak += 1;
        if (!sawHost && falseStreak >= 14) throw new Error("lobby-not-found");
      } else {
        falseStreak = 0;
      }
      await sleep(650);
    }
    return sawHost;
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
      msg.includes("ws-error")
    ) {
      return new Error("lobby-not-found");
    }
    if (msg.includes("signal-unavailable") || msg.includes("signal-server-down")) {
      return new Error("signal-server-down");
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
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), RELAY_PROBE_MS);
    try {
      const res = await fetch(base.replace(/\/$/, "") + "/health", {
        cache: "no-store",
        mode: "cors",
        signal: ctrl.signal,
      });
      if (!res.ok) return false;
      const data = await res.json().catch(() => ({}));
      return data && data.ok === true;
    } catch (_) {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  function hasRelayConfig() {
    const cfg = window.WIE_ONLINE || {};
    return !!(cfg.signalUrl || (cfg.signalUrlCandidates && cfg.signalUrlCandidates.length));
  }

  async function pickSignalBase() {
    const cfg = window.WIE_ONLINE || {};
    const preset = cfg.signalUrl ? String(cfg.signalUrl).replace(/\/$/, "") : "";
    if (preset) return preset;
    const urls = signalUrls();
    if (!urls.length) return null;
    const checks = urls.map(async (base) => {
      const ok = await probeSignalBase(base);
      return ok ? base : null;
    });
    const results = await Promise.all(checks);
    return results.find(Boolean) || urls[0] || null;
  }

  async function peekRoom(base, code) {
    try {
      const u = new URL(base.replace(/\/$/, "") + "/");
      u.searchParams.set("code", sanitizeCode(code));
      u.searchParams.set("peek", "1");
      const res = await fetch(u.toString(), { cache: "no-store", mode: "cors" });
      if (!res.ok) return null;
      return await res.json();
    } catch (_) {
      return null;
    }
  }

  async function waitForRelayHostOnline(base, code, maxMs) {
    const deadline = Date.now() + (maxMs || RELAY_HOST_WAIT_MS);
    while (Date.now() < deadline) {
      const info = await peekRoom(base, code);
      if (info && info.host) return true;
      await sleep(800);
    }
    return false;
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
      if (role === "host" && roomCode && backend === "relay" && lastRelayBase) {
        hostReconnectTimer = window.setTimeout(() => {
          connectRelayHostAt(lastRelayBase, roomCode).catch(() => {});
        }, 2000);
      }
    });
  }

  async function connectRelayHostAt(base, code) {
    destroyAll();
    lastRelayBase = base;
    backend = "relay";
    role = "host";
    roomCode = sanitizeCode(code);
    const socket = new WebSocket(wsUrlFor(base, roomCode, "host"));
    ws = socket;
    attachWsHandlers(socket);
    await waitForWsOpen(socket, WS_OPEN_TIMEOUT_MS);
    emit({ type: "host-waiting" });
    return { role, roomCode, backend };
  }

  async function connectRelayHost(code) {
    const base = await pickSignalBase();
    if (!base) throw new Error("signal-unavailable");
    return connectRelayHostAt(base, code);
  }

  async function connectRelayGuestAt(base, code) {
    lastRelayBase = base;
    const sanitized = sanitizeCode(code);
    const hostThere = await waitForRelayHostOnline(base, sanitized, RELAY_HOST_WAIT_MS);
    if (!hostThere) throw new Error("lobby-not-found");

    destroyAll();
    lastRelayBase = base;
    backend = "relay";
    role = "guest";
    roomCode = sanitized;
    const socket = new WebSocket(wsUrlFor(base, roomCode, "guest"));
    ws = socket;
    attachWsHandlers(socket);
    await waitForWsOpen(socket, WS_OPEN_TIMEOUT_MS);
    await waitForPeerConnected(RELAY_PAIR_TIMEOUT_MS);
    return { role, roomCode, backend };
  }

  async function connectRelayGuest(code) {
    const base = await pickSignalBase();
    if (!base) throw new Error("signal-unavailable");
    return connectRelayGuestAt(base, code);
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

  function createPeerHost(code, peerOpts) {
    return new Promise((resolve, reject) => {
      ensurePeerJs();
      destroyAll();
      backend = "peerjs";
      role = "host";
      roomCode = sanitizeCode(code);
      peer = new Peer(peerId(roomCode), { ...(peerOpts || PEER_OPTS) });
      attachHostPeerHandlers();
      waitForPeerOpen(peer, PEER_TIMEOUT_MS)
        .then(() => {
          if (!isPeerLive()) throw new Error("peer-timeout");
          resolve({ role, roomCode, backend });
        })
        .catch(reject);
    });
  }

  const PEER_HOST_ALT = {
    ...PEER_OPTS,
    host: "peerjs.com",
  };

  function joinPeerGuestOnce(code) {
    return new Promise((resolve, reject) => {
      ensurePeerJs();
      if (!peer || peer.destroyed) {
        peer = new Peer({ ...PEER_OPTS });
        peer.on("error", (err) => console.warn("guest peer error", err));
      }
      waitForPeerOpen(peer, PEER_TIMEOUT_MS)
        .then(() => sleep(400))
        .then(() => {
          const c = peer.connect(peerId(code), {
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

  async function joinPeerGuest(code) {
    const sanitized = sanitizeCode(code);
    let lastErr = null;
    for (let i = 0; i < 5; i++) {
      try {
        if (i > 0) {
          destroyAll();
          await sleep(900 + i * 350);
        } else {
          destroyAll();
        }
        backend = "peerjs";
        role = "guest";
        roomCode = sanitized;
        peer = new Peer({ ...PEER_OPTS });
        peer.on("error", (err) => console.warn("guest peer error", err));
        return await joinPeerGuestOnce(sanitized);
      } catch (e) {
        lastErr = e;
        console.warn("peer guest attempt", i + 1, e);
      }
    }
    throw lastErr || new Error("lobby-not-found");
  }

  async function setupHost(code) {
    const sanitized = sanitizeCode(code);
    if (!sanitized) throw new Error("empty-code");

    await ensureSignalReady();

    const relayBase = await pickSignalBase();
    let lastErr = null;
    if (relayBase) {
      for (let i = 0; i < 6; i++) {
        try {
          if (i > 0) {
            destroyAll();
            await sleep(600 + i * 300);
          }
          return await connectRelayHostAt(relayBase, sanitized);
        } catch (e) {
          lastErr = e;
          console.warn("relay host", i + 1, e);
        }
      }
    }

    if (hasRelayConfig()) {
      throw lastErr || new Error("relay-host-failed");
    }

    const peerAttempts = [PEER_OPTS, PEER_HOST_ALT, PEER_OPTS];
    for (let i = 0; i < peerAttempts.length; i++) {
      try {
        if (i > 0) {
          destroyAll();
          await sleep(800 + i * 300);
        }
        return await createPeerHost(sanitized, peerAttempts[i]);
      } catch (e) {
        lastErr = e;
        console.warn("peerjs host", i + 1, e);
      }
    }
    throw lastErr || new Error("peer-error");
  }

  function isHostReady() {
    if (role !== "host") return false;
    if (backend === "relay") {
      return !!(ws && ws.readyState === WebSocket.OPEN);
    }
    return isPeerLive();
  }

  async function setupGuest(code) {
    const sanitized = sanitizeCode(code);
    if (!sanitized) throw new Error("empty-code");

    await ensureSignalReady();
    const relayBase = await pickSignalBase();
    let lastErr = null;

    if (relayBase) {
      for (let i = 0; i < 6; i++) {
        try {
          if (i > 0) {
            destroyAll();
            await sleep(800 + i * 400);
          }
          return await connectRelayGuestAt(relayBase, sanitized);
        } catch (e) {
          lastErr = e;
          console.warn("relay guest", i + 1, e);
          const msg = String(e && e.message ? e.message : e);
          if (msg.includes("lobby-not-found")) throw e;
        }
      }
    }

    if (hasRelayConfig()) {
      throw lastErr || new Error("lobby-not-found");
    }

    try {
      await waitForHostPeer(sanitized, 50000);
    } catch (e) {
      if (String(e.message).includes("lobby-not-found")) throw e;
    }
    await joinPeerGuest(sanitized);
    if (!connected || (backend === "peerjs" && (!conn || !conn.open))) {
      throw new Error("lobby-not-found");
    }
    return { role: "guest", roomCode: sanitized, backend };
  }

  async function ensureSignalReady() {
    if (window.WieOnlineConfig && typeof WieOnlineConfig.discover === "function") {
      await WieOnlineConfig.discover();
    }
  }

  window.WieIsHetOnline = {
    sanitizeCode,
    getRole: () => role,
    getRoomCode: () => roomCode,
    getBackend: () => backend,
    isConnected: () => {
      if (backend === "relay") return connected;
      return connected && !!(conn && conn.open);
    },
    async peekRoomCode(code) {
      const base = lastRelayBase || (await pickSignalBase());
      if (!base) return null;
      return peekRoom(base, code);
    },
    isOnline: () => role === "host" || role === "guest",
    isHost: () => role === "host",
    isGuest: () => role === "guest",
    isHostPeerLive: isHostReady,
    isHostReady,

    ensureSignalReady,
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
