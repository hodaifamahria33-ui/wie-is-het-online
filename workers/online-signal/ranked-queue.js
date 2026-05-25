/**
 * Ranked matchmaking — één Durable Object (globale wachtrij).
 */
export class RankedQueue {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    if (request.method === "OPTIONS") {
      return cors("", 204);
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "") || "/";

    if (request.method === "POST" && path.endsWith("/join")) {
      const body = await request.json().catch(() => ({}));
      return cors(JSON.stringify(await this.handleJoin(body)));
    }

    if (request.method === "GET" && path.endsWith("/status")) {
      const playerId = url.searchParams.get("playerId");
      return cors(JSON.stringify(await this.handleStatus(playerId)));
    }

    if (request.method === "POST" && path.endsWith("/leave")) {
      const playerId = url.searchParams.get("playerId");
      await this.removePlayer(playerId);
      return cors(JSON.stringify({ ok: true }));
    }

    return cors(JSON.stringify({ ok: true, service: "ranked" }));
  }

  pendingKey(playerId) {
    return "pending:" + playerId;
  }

  async storePending(playerId, payload) {
    await this.state.storage.put(this.pendingKey(playerId), JSON.stringify(payload));
  }

  async takePending(playerId) {
    if (!playerId) return null;
    const raw = await this.state.storage.get(this.pendingKey(playerId));
    if (!raw) return null;
    await this.state.storage.delete(this.pendingKey(playerId));
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  async getQueue() {
    const raw = await this.state.storage.get("queue");
    if (!raw) return new Map();
    try {
      const obj = JSON.parse(raw);
      return new Map(Object.entries(obj));
    } catch (_) {
      return new Map();
    }
  }

  async saveQueue(queue) {
    const obj = Object.fromEntries(queue.entries());
    await this.state.storage.put("queue", JSON.stringify(obj));
  }

  async removePlayer(playerId) {
    if (!playerId) return;
    const queue = await this.getQueue();
    queue.delete(playerId);
    await this.saveQueue(queue);
    await this.state.storage.delete(this.pendingKey(playerId));
  }

  randomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < 5; i += 1) {
      out += chars[(Math.random() * chars.length) | 0];
    }
    return out;
  }

  ratingOk(me, them, waitMs) {
    const diff = Math.abs((them.rating || 1000) - (me.rating || 1000));
    if (diff <= 500) return true;
    if (waitMs >= 6000 && diff <= 900) return true;
    if (waitMs >= 12000) return true;
    return false;
  }

  async finalizePair(playerId, me, themId, them, queue) {
    const code = this.randomCode();
    const hostIsMe = (me.rating || 1000) >= (them.rating || 1000);
    const payloadMe = {
      status: "matched",
      code,
      role: hostIsMe ? "host" : "guest",
      opponentRating: them.rating || 1000,
      opponentName: them.name || "Speler",
    };
    const payloadThem = {
      status: "matched",
      code,
      role: hostIsMe ? "guest" : "host",
      opponentRating: me.rating || 1000,
      opponentName: me.name || "Speler",
    };
    queue.delete(playerId);
    queue.delete(themId);
    await this.saveQueue(queue);
    await this.storePending(playerId, payloadMe);
    await this.storePending(themId, payloadThem);
    return payloadMe;
  }

  async tryPair(playerId, queue) {
    const me = queue.get(playerId);
    if (!me) return null;
    const now = Date.now();
    const waitMs = now - (me.ts || 0);

    for (const [id, them] of queue.entries()) {
      if (id === playerId) continue;
      if (now - (them.ts || 0) > 120000) {
        queue.delete(id);
        await this.state.storage.delete(this.pendingKey(id));
        continue;
      }
      if (this.ratingOk(me, them, Math.min(waitMs, now - (them.ts || 0)))) {
        return this.finalizePair(playerId, me, id, them, queue);
      }
    }
    return null;
  }

  async handleJoin(body) {
    const id = String(body.playerId || "").trim();
    if (!id) return { error: "missing id" };

    const rawPending = await this.state.storage.get(this.pendingKey(id));
    if (rawPending) {
      try {
        const existing = JSON.parse(rawPending);
        if (existing && existing.status === "matched") return existing;
      } catch (_) {}
    }

    const queue = await this.getQueue();
    const now = Date.now();
    for (const [pid, entry] of queue.entries()) {
      if (now - (entry.ts || 0) > 120000) {
        queue.delete(pid);
        await this.state.storage.delete(this.pendingKey(pid));
      }
    }

    queue.set(id, {
      playerId: id,
      name: String(body.name || "Speler").slice(0, 16),
      rating: Number(body.rating) || 1000,
      ts: now,
    });
    await this.saveQueue(queue);

    const matched = await this.tryPair(id, queue);
    if (matched) return matched;
    return { status: "queued", queueSize: queue.size };
  }

  async handleStatus(playerId) {
    if (!playerId) return { status: "idle" };

    const pending = await this.takePending(playerId);
    if (pending && pending.status === "matched") return pending;

    const queue = await this.getQueue();
    const matched = await this.tryPair(playerId, queue);
    if (matched) return matched;

    if (!queue.has(playerId)) return { status: "idle" };
    return { status: "queued", queueSize: queue.size };
  }
}

function cors(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    },
  });
}
