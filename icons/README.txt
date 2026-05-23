PWA app-iconen voor wiehasit.com
================================

Bestanden (niet verwijderen):
  icon-192.png  — 192×192 (Android / klein icoon)
  icon-512.png  — 512×512 (installatie / splash)

Opnieuw maken vanaf je logo (og-image.png in de hoofdmap):
  npx sharp-cli resize 192 192 -i ../og-image.png -o icon-192.png
  npx sharp-cli resize 512 512 -i ../og-image.png -o icon-512.png

Worden gebruikt door: manifest.json, index.html, service-worker.js
