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
  $url = ([regex]::Match($out, "https://[^\s]+\.workers\.dev")).Value
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

  $cfgJs = Join-Path $root "assets\game\online-config.js"
  if (Test-Path $cfgJs) {
    $cfg = Get-Content $cfgJs -Raw -Encoding UTF8
    if ($cfg -notmatch [regex]::Escape($url)) {
      $cfg = $cfg -replace '(DEFAULT_CANDIDATES\s*=\s*\[\s*\r?\n)', "`$1    `"$url`",`r`n"
    }
    Set-Content -Path $cfgJs -Value $cfg -Encoding UTF8 -NoNewline
    Write-Host "online-config.js bijgewerkt"
  }

  Write-Host ""
  Write-Host "Test: $url/health"
  Write-Host "Volgende stap: git push (index.html + assets/game/online-*.js)"
} finally {
  Pop-Location
}
