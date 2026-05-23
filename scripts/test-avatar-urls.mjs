import { readFileSync } from "fs";

const src = readFileSync("assets/game/character-traits.js", "utf8");
const names = [...src.matchAll(/name: "([^"]+)"/g)].map((m) => m[1]);

function buildUrl(name) {
  const t = { seed: name, style: "notionists", avatar: {} };
  const block = src.split(`name: "${name}"`)[1]?.split("},")[0] || "";
  const avatarMatch = block.match(/avatar: (\{[^}]+\})/);
  if (avatarMatch) {
    try {
      t.avatar = Function("return " + avatarMatch[1])();
    } catch {}
  }
  const params = new URLSearchParams();
  params.set("seed", name);
  params.set("size", "220");
  params.set("backgroundType", "gradientLinear");
  params.set("backgroundColor", "312e81,6d28d9,0f172a");
  Object.entries(t.avatar).forEach(([k, v]) => params.append(k, v));
  if (t.avatar.glasses) params.set("glassesProbability", "100");
  if (t.avatar.beard) params.set("beardProbability", "100");
  if (t.avatar.gesture) params.set("gestureProbability", "100");
  if (t.avatar.bodyIcon) params.set("bodyIconProbability", "100");
  return `https://api.dicebear.com/9.x/notionists/png?${params}`;
}

const bad = [];
for (const name of names) {
  const url = buildUrl(name);
  const res = await fetch(url, { method: "HEAD" });
  if (!res.ok) bad.push({ name, status: res.status, url });
}
console.log("bad:", bad.length, bad);
