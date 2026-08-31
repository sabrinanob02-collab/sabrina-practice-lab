$ErrorActionPreference = "Stop"
if (-not (Test-Path -LiteralPath "_site\index.html")) {
  npm run build
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
Write-Host "Open http://127.0.0.1:4173/ and press Ctrl+C here when finished."
python -m http.server 4173 --directory _site
