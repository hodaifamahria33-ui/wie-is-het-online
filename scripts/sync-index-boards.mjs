import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const preview = fs.readFileSync(path.join(root, "preview.html"), "utf8");
let index = fs.readFileSync(path.join(root, "index.html"), "utf8");

const start = preview.indexOf("    const CARD_NAMES = [");
const end = preview.indexOf("    function runCountdownThenTable()");
if (start < 0 || end < 0) {
  console.error("could not extract from preview");
  process.exit(1);
}
const block = preview.slice(start, end);

index = index.replace(
  /function buildGameBoards\(\) \{[\s\S]*?\n    \}\n\n    function runCountdownThenTable/,
  block + "\n\n    function runCountdownThenTable"
);

fs.writeFileSync(path.join(root, "index.html"), index);
console.log("synced index buildGameBoards");
