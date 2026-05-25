import { Room } from "./room.js";
import { RankedQueue } from "./ranked-queue.js";

export { Room, RankedQueue };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (url.pathname.startsWith("/ranked")) {
      const id = env.RANKED.idFromName("global");
      const stub = env.RANKED.get(id);
      const rankedUrl = new URL(request.url);
      rankedUrl.pathname = rankedUrl.pathname.replace(/^\/ranked/, "") || "/";
      return stub.fetch(new Request(rankedUrl.toString(), request));
    }

    if (url.pathname === "/health" || url.pathname.endsWith("/health")) {
      return new Response(JSON.stringify({ ok: true, service: "signal" }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const code = sanitizeCode(url.searchParams.get("code"));
    if (!code) {
      return new Response(JSON.stringify({ error: "missing code" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const id = env.ROOM.idFromName(code);
    const stub = env.ROOM.get(id);
    return stub.fetch(request);
  },
};

function sanitizeCode(raw) {
  return String(raw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 5);
}
