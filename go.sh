#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="$DIR/.go.pid"
LOG_FILE="$DIR/.go.log"
PORT=8790

# Symlink (never copy) the Arcade SDK from the sibling launcher repo so
# /arcade-sdk.js resolves when serving pi-game in isolation — a link can't go
# stale, and cp onto an existing symlink-to-source errors out under set -e.
# In production both live at the same origin (paulgibeault.github.io); this
# preserves that invariant locally.
SDK_SRC="$DIR/../paulgibeault.github.io/arcade-sdk.js"
SDK_DST="$DIR/arcade-sdk.js"
if [ -f "$SDK_SRC" ]; then
  ln -sfn "$SDK_SRC" "$SDK_DST"
else
  echo "WARNING: $SDK_SRC not found — pi-game will fail to load Arcade SDK." >&2
  echo "         Clone paulgibeault/paulgibeault.github.io as a sibling directory." >&2
fi

# Kill previous run if pid file exists
if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE")
  if kill -0 "$OLD_PID" 2>/dev/null; then
    kill "$OLD_PID" 2>/dev/null || true
    # Wait briefly for clean shutdown
    for i in 1 2 3; do
      kill -0 "$OLD_PID" 2>/dev/null || break
      sleep 0.2
    done
    echo "Stopped previous instance (PID $OLD_PID)"
  fi
  rm -f "$PID_FILE"
fi

# Start new server, capturing stdout and stderr to log file
python3 -m http.server "$PORT" --directory "$DIR" > "$LOG_FILE" 2>&1 &
NEW_PID=$!

# Verify it started
sleep 0.3
if ! kill -0 "$NEW_PID" 2>/dev/null; then
  echo "Failed to start server. Check $LOG_FILE"
  exit 1
fi

echo "$NEW_PID" > "$PID_FILE"

echo "Server running (PID $NEW_PID)"
echo "  URL: http://localhost:$PORT"
echo "  Log: $LOG_FILE"
