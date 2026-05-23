/**
 * Durable Object: één potcode = één kamer, max host + gast via WebSocket.
 */
export class Room {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    if (url.pathname.endsWith("/health")) {
      return json({ ok: true }, 200);
    }

    if (request.headers.get("Upgrade") !== "websocket") {
      return json({ ok: true, room: true }, 200);
    }

    const role = url.searchParams.get("role") === "host" ? "host" : "guest";
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.state.acceptWebSocket(server);
    server.serializeAttachment({ role, joinedAt: Date.now() });

  const existing = this.state.getWebSockets();
  const sameRole = existing.filter((s) => s.deserializeAttachment()?.role === role);
  if (sameRole.length >= 1) {
    try {
      sameRole[0].close(4000, "replaced");
    } catch (_) {}
  }

    this.broadcast(server, { type: "peer-joined", role });

    const hostSock = this.getRoleSocket("host");
    const guestSock = this.getRoleSocket("guest");
    if (hostSock && guestSock) {
      this.sendJson(hostSock, { type: "connected", role: "host" });
      this.sendJson(guestSock, { type: "connected", role: "guest" });
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, message) {
    const all = this.state.getWebSockets();
    for (const other of all) {
      if (other === ws) continue;
      try {
        other.send(message);
      } catch (_) {}
    }
  }

  async webSocketClose(ws) {
    const att = ws.deserializeAttachment();
    this.broadcast(ws, { type: "disconnected", role: att?.role || "guest" });
  }

  getRoleSocket(role) {
    return (
      this.state
        .getWebSockets()
        .find((s) => s.deserializeAttachment()?.role === role) || null
    );
  }

  broadcast(exclude, obj) {
    const payload = JSON.stringify(obj);
    for (const s of this.state.getWebSockets()) {
      if (s === exclude) continue;
      try {
        s.send(payload);
      } catch (_) {}
    }
  }

  sendJson(ws, obj) {
    try {
      ws.send(JSON.stringify(obj));
    } catch (_) {}
  }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(),
      "Content-Type": "application/json",
    },
  });
}
