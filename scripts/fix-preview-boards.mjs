import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

for (const file of ["preview.html", "index.html"]) {
  const p = path.join(root, file);
  let c = fs.readFileSync(p, "utf8");
  c = c.replace(/createElement\("motion"\)/g, 'createElement("div")');
  c = c.replace(/<motion><motion>/g, "");
  c = c.replace(/<motion>/g, "");
  c = c.replace(/<\/motion>/g, "");
  fs.writeFileSync(p, c);
  console.log("cleaned", file);
}
