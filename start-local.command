#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [ ! -f "_site/index.html" ]; then
  npm run build
fi
echo "Open http://127.0.0.1:4173/ and press Control-C here when finished."
python3 -m http.server 4173 --directory _site
