import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

for (const file of ["preview.html", "index.html"]) {
  const p = path.join(root, file);
  let c = fs.readFileSync(p, "utf8");
  if (!c.includes("COUNTDOWN_SEC")) {
    // patch index if behind
    console.log(file, "needs full sync - skipping");
    continue;
  }
  c = c.replace(/<\/motion>(\s*<div class="countdown-center">)/, "</motion>$1");
  c = c.replace(/countdown-photos" aria-hidden="true"><\/[^>]+>/, 'countdown-photos" aria-hidden="true"></motion>');
  fs.writeFileSync(p, c);
  console.log("fixed", file);
}
