#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

node -e 'if (Number(process.versions.node.split(".")[0]) < 22) { console.error("Use Node.js 22 or newer; select Node 22 in the cloud environment."); process.exit(1); }'

# Also used as the maintenance script after a cached checkout changes branches.
npm ci --no-audit --no-fund
if [[ "$(uname -s)" == "Linux" ]]; then
  npx --no-install playwright install --with-deps chromium
else
  npx --no-install playwright install chromium
fi
npx --no-install next typegen
