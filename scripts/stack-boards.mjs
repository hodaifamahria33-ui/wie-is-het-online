import fs from "fs";
import path from "path";

const d = "motion";
const D = "div";
const root = path.join(import.meta.dirname, "..");

const OLD = [
  `          <${D} class="board-stand board-stand--opponent">`,
  `            <${D} class="board-tray board-tray--opponent">`,
  `              <${D} class="opponent-board-back" id="opponent-board" aria-label="Bord tegenstander (achterkant)"></${D}>`,
  `            </${D}>`,
  `            <${D} class="board-base board-base--opponent" aria-hidden="true"></${D}>`,
  `          </${D}>`,
  `          <${D} class="opponent-chair" aria-hidden="true"></${D}>`,
  `        </${D}>`,
  ``,
  `        <${D} class="table-surface" aria-hidden="true"></${D}>`,
  ``,
  `        <p id="game-turn-banner" class="game-turn-banner hidden" aria-live="polite"></p>`,
  ``,
  `        <${D} class="player-zone">`,
  `          <${D} class="player-play-area">`,
  `            <${D} class="board-stand board-stand--player">`,
  `              <${D} class="board-tray board-tray--player">`,
  `                <${D} class="player-board" id="player-board" aria-label="Jouw bord"></${D}>`,
  `              </${D}>`,
  `              <${D} class="board-base board-base--player" aria-hidden="true"></${D}>`,
  `            </${D}>`,
  `            <aside id="secret-card-slot" class="secret-card-slot" aria-label="Jouw geheim personage"></aside>`,
  `          </${D}>`,
  `          <${D} class="player-figure" aria-hidden="true">`,
].join("\n");

const NEW = [
  `          <${D} class="board-stack">`,
  `            <${D} class="board-stand board-stand--opponent board-stand--rear" aria-hidden="true">`,
  `              <${D} class="board-tray board-tray--opponent">`,
  `                <${D} class="opponent-board-back" id="opponent-board" aria-label="Bord tegenstander"></${D}>`,
  `              </${D}>`,
  `              <${D} class="board-base board-base--opponent" aria-hidden="true"></${D}>`,
  `            </${D}>`,
  `            <${D} class="player-play-area">`,
  `              <${D} class="board-stand board-stand--player board-stand--front">`,
  `                <${D} class="board-tray board-tray--player">`,
  `                  <${D} class="player-board" id="player-board" aria-label="Jouw bord"></${D}>`,
  `                </${D}>`,
  `                <${D} class="board-base board-base--player" aria-hidden="true"></${D}>`,
  `              </${D}>`,
  `              <aside id="secret-card-slot" class="secret-card-slot" aria-label="Jouw geheim personage"></aside>`,
  `            </${D}>`,
  `          </${D}>`,
  `          <${D} class="opponent-chair" aria-hidden="true"></${D}>`,
  `        </${D}>`,
  ``,
  `        <${D} class="table-surface table-surface--hidden" aria-hidden="true"></${D}>`,
  ``,
  `        <p id="game-turn-banner" class="game-turn-banner hidden" aria-live="polite"></p>`,
  ``,
  `        <${D} class="player-zone">`,
  `          <${D} class="player-figure" aria-hidden="true">`,
].join("\n");

const norm = (s) => s.replace(/\r\n/g, "\n");

for (const file of ["preview.html", "index.html"]) {
  const p = path.join(root, file);
  let c = norm(fs.readFileSync(p, "utf8"));
  const oldN = norm(OLD);
  const newN = norm(NEW);
  if (!c.includes(oldN)) {
    console.error("OLD block not found in", file);
    continue;
  }
  c = c.replace(oldN, newN);
  fs.writeFileSync(p, c, "utf8");
  console.log("ok", file);
}
