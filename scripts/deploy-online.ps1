# Deploy online signal + ranked matchmaker (Cloudflare Worker)
# Vereist: npx wrangler login (eenmalig)
param(
  [string]$ApiToken = $env:CLOUDFLARE_API_TOKEN
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$workerDir = Join-Path $root "workers\online-signal"
$indexHtml = Join-Path $root "index.html"

if ($ApiToken) {
  $env:CLOUDFLARE_API_TOKEN = $ApiToken
}

Push-Location $workerDir
try {
  Write-Host "Deploying wieishet-online-signal..."
  $out = npx wrangler deploy 2>&1 | Out-String
  Write-Host $out
  if ($out -notmatch "https://[^\s]+\.workers\.dev") {
    throw "Deploy mislukt of geen workers.dev URL in output. Run: npx wrangler login"
  }
  $url = ([regex]::Match($out, "https://[a-z0-9\-]+\.workers\.dev")).Value
  if (-not $url) { throw "Kon worker URL niet parsen." }
  Write-Host "Worker URL: $url"

  $html = Get-Content $indexHtml -Raw -Encoding UTF8
  $escaped = [regex]::Escape($url)
  $html = $html -replace 'signalUrl:\s*""', "signalUrl: `"$url`""
  $html = $html -replace 'matchmakerUrl:\s*""', "matchmakerUrl: `"$url/ranked`""
  if ($html -notmatch [regex]::Escape($url)) {
    $html = $html -replace '(signalUrlCandidates:\s*\[[^\]]*)\]', "`$1,`n        `"$url`"`n      ]"
  }
  Set-Content -Path $indexHtml -Value $html -Encoding UTF8 -NoNewline
  Write-Host "index.html bijgewerkt met signalUrl + matchmakerUrl"
  Write-Host ""
  Write-Host "Volgende stap: git add index.html && git commit && git push"
} finally {
  Pop-Location
}
