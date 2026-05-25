# Online server (join + ranked)

Eén Cloudflare Worker voor:

- **WebSocket relay** — potje met code (betrouwbaarder dan alleen PeerJS)
- **Ranked matchmaking** — `/ranked/join`, `/ranked/status`, `/ranked/leave`

## Deploy (±2 minuten)

```powershell
cd workers\online-signal
npx wrangler login
npx wrangler deploy
```

Of vanuit de projectmap:

```powershell
powershell -File scripts\deploy-online.ps1
```

Kopieer de URL (bijv. `https://wieishet-online-signal.jouwnaam.workers.dev`). Het deploy-script zet die automatisch in `index.html`.

Daarna push naar GitHub en hard refresh op telefoon.

## Test

- `https://jouw-worker.workers.dev/health` → `{"ok":true}`
- Host: potje maken → vriend joint met code
- Ranked: twee browsers → Zoek ranked match → zelfde code / host+gast
