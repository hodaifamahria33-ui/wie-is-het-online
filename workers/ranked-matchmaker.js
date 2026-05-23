/**
 * Optionele ranked matchmaker (Cloudflare Worker).
 * Deploy → zet URL in window.WIE_RANKED.matchmakerUrl
 */
const queue = new Map();

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

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 5; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function matchPayload(playerId, me, them) {
  const code = randomCode();
  const iAmHost = me.rating >= them.rating;
  return {
    status: "matched",
    code,
    role: iAmHost ? "host" : "guest",
    opponentRating: them.rating,
    opponentName: them.name,
  };
}

function tryPair(playerId) {
  const me = queue.get(playerId);
  if (!me) return null;
  for (const [id, them] of queue.entries()) {
    if (id === playerId) continue;
    if (Math.abs(them.rating - me.rating) <= 250) {
      queue.delete(id);
      queue.delete(playerId);
      return matchPayload(playerId, me, them);
    }
  }
  return null;
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") return cors("");

    const url = new URL(request.url);
    const playerId = url.searchParams.get("playerId");

    if (request.method === "POST" && url.pathname.endsWith("/join")) {
      const body = await request.json();
      const id = body.playerId;
      if (!id) return cors(JSON.stringify({ error: "missing id" }), 400);
      queue.set(id, {
        playerId: id,
        name: body.name || "Speler",
        rating: body.rating || 1000,
        ts: Date.now(),
      });
      const matched = tryPair(id);
      if (matched) return cors(JSON.stringify(matched));
      return cors(JSON.stringify({ status: "queued", queueSize: queue.size }));
    }

    if (request.method === "GET" && url.pathname.endsWith("/status")) {
      if (!playerId) return cors(JSON.stringify({ status: "idle" }));
      const matched = tryPair(playerId);
      if (matched) return cors(JSON.stringify(matched));
      return cors(JSON.stringify({ status: "queued", queueSize: queue.size }));
    }

    if (request.method === "POST" && url.pathname.endsWith("/leave")) {
      if (playerId) queue.delete(playerId);
      return cors(JSON.stringify({ ok: true }));
    }

    return cors(JSON.stringify({ ok: true, hint: "POST /join, GET /status, POST /leave" }));
  },
};
