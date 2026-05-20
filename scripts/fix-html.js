const fs = require("fs");
const p = require("path").join(__dirname, "..", "preview.html");
let c = fs.readFileSync(p, "utf8");
const d = "div";
const fix =
  "                <" +
  d +
  ' class="player-board" id="player-board" aria-label="Jouw bord"></' +
  d +
  ">\n              </" +
  d +
  ">\n              <" +
  d +
  ' class="board-base board-base--player" aria-hidden="true"></' +
  d +
  ">\n            </" +
  d +
  ">";
const re = /              <[^>]+player-board[^>]*>[\s\S]*?            <\/[^>]+>/;
if (re.test(c)) {
  c = c.replace(re, fix);
  fs.writeFileSync(p, c);
  console.log("fixed board html");
} else {
  console.log("pattern fail");
}
