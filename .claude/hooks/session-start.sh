#!/bin/bash
# Готує проєкт у хмарній сесії: залежності для npm test / npm run css і для перегляду.
set -e
[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0
cd "$CLAUDE_PROJECT_DIR"
[ -d node_modules ] || npm ci --no-audit --no-fund >/dev/null 2>&1 || npm install --no-audit --no-fund >/dev/null 2>&1
[ -d tools/preview/node_modules ] || (cd tools/preview && npm install --no-audit --no-fund >/dev/null 2>&1)
exit 0
