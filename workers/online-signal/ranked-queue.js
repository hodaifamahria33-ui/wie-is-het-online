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
  }

  randomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < 5; i += 1) {
      out += chars[(Math.random() * chars.length) | 0];
    }
    return out;
  }

  matchPayload(playerId, me, them) {
    const code = this.randomCode();
    const iAmHost = (me.rating || 1000) >= (them.rating || 1000);
    return {
      status: "matched",
      code,
      role: iAmHost ? "host" : "guest",
      opponentRating: them.rating || 1000,
      opponentName: them.name || "Speler",
    };
  }

  async tryPair(playerId, queue) {
    const me = queue.get(playerId);
    if (!me) return null;
    const now = Date.now();
    for (const [id, them] of queue.entries()) {
      if (id === playerId) continue;
      if (now - (them.ts || 0) > 120000) {
        queue.delete(id);
        continue;
      }
      if (Math.abs((them.rating || 1000) - (me.rating || 1000)) <= 400) {
        queue.delete(id);
        queue.delete(playerId);
        await this.saveQueue(queue);
        return this.matchPayload(playerId, me, them);
      }
    }
    return null;
  }

  async handleJoin(body) {
    const id = String(body.playerId || "").trim();
    if (!id) return { error: "missing id" };

    const queue = await this.getQueue();
    const now = Date.now();
    for (const [pid, entry] of queue.entries()) {
      if (now - (entry.ts || 0) > 120000) queue.delete(pid);
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
