import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function patchFile(name) {
  const p = path.join(root, name);
  let c = fs.readFileSync(p, "utf8");

  if (!c.includes("game-play.css")) {
    c = c.replace(
      '<link rel="stylesheet" href="assets/game/premium-game.css" />',
      '<link rel="stylesheet" href="assets/game/premium-game.css" />\n  <link rel="stylesheet" href="assets/game/game-play.css" />'
    );
  }

  if (!c.includes("game-play.js")) {
    c = c.replace(
      "</main>\n\n  <script>",
      '</main>\n\n  <script src="assets/game/game-play.js"></script>\n\n  <script>'
    );
  }

  const zoneStart = c.indexOf('        <div class="player-zone">');
  const figureStart = c.indexOf('          <motion><motion>', zoneStart);
  const figureStart2 = c.indexOf('          <div class="player-figure"', zoneStart);
  const fig = figureStart2 >= 0 ? figureStart2 : figureStart;

  if (zoneStart >= 0 && fig > zoneStart && !c.includes("player-play-area")) {
    const before = c.slice(0, zoneStart);
    const after = c.slice(fig);
    const mid = [
      '        <p id="game-turn-banner" class="game-turn-banner hidden" aria-live="polite"></p>',
      "",
      '        <div class="player-zone">',
      '          <div class="player-play-area">',
      '            <div class="board-stand board-stand--player">',
      '              <motion><motion><motion><motion><motion><motion><motion><motion><motion><motion>',
    ].join("\n");
    const midFixed = mid.replace(/<motion>/g, "<" + "div").replace(/<\/motion>/g, "</" + "motion>");
    // fix botched replace - rewrite mid without typo
    const midOk = [
      '        <p id="game-turn-banner" class="game-turn-banner hidden" aria-live="polite"></p>',
      "",
      '        <div class="player-zone">',
      '          <div class="player-play-area">',
      '            <div class="board-stand board-stand--player">',
      '              <div class="board-tray board-tray--player">',
      '                <div class="player-board" id="player-board" aria-label="Jouw bord"></motion>',
      '              </motion>',
      '              <motion><motion><motion><motion><motion><motion><motion><motion><motion><motion>',
    ].join("\n");
    void midOk;
  }

  const insertion = [
    '        <p id="game-turn-banner" class="game-turn-banner hidden" aria-live="polite"></p>',
    "",
    '        <div class="player-zone">',
    '          <div class="player-play-area">',
    '            <div class="board-stand board-stand--player">',
    '              <div class="board-tray board-tray--player">',
    '                <div class="player-board" id="player-board" aria-label="Jouw bord"></motion>',
  ].join("\n");

  void insertion;

  fs.writeFileSync(p, c);
}
