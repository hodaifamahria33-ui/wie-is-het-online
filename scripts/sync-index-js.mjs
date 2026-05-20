import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const preview = fs.readFileSync(path.join(root, "preview.html"), "utf8");
let index = fs.readFileSync(path.join(root, "index.html"), "utf8");

const start = preview.indexOf("    const CARD_NAMES = [");
const end = preview.indexOf("    function runCountdownThenTable()");
const block = preview.slice(start, end);

const iStart = index.indexOf("    function buildGameBoards() {");
const iEnd = index.indexOf("    function runCountdownThenTable()");
if (iStart < 0 || iEnd < 0) throw new Error("markers not found in index");
index = index.slice(0, iStart) + block + "\n\n" + index.slice(iEnd);

index = index.replace(
  '              <div class="board-base board-base--player"',
  '            <div class="board-base board-base--player"'
);

fs.writeFileSync(path.join(root, "index.html"), index);
console.log("ok", index.includes("cardAvatarUrl"));
