# Online signaling (WebSocket relay)

Betrouwbaarder dan alleen PeerJS op mobiel.

## Deploy (eenmalig)

1. Maak een [Cloudflare API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) (Workers edit).
2. In PowerShell:

```powershell
$env:CLOUDFLARE_API_TOKEN = "jouw-token"
cd workers/online-signal
npx wrangler deploy
```

3. Kopieer de URL (bijv. `https://wieishet-online-signal.jouwnaam.workers.dev`).
4. Zet in `index.html`:

```html
window.WIE_ONLINE = { signalUrl: "https://jouw-worker.workers.dev" };
```

5. Push naar GitHub en hard refresh op telefoon.
