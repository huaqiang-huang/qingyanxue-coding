#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOY_ROOT="${OPEN_COWORK_M_DEPLOY_ROOT:-/Volumes/M盘/codex/open-cowork-rework/m-disk-instance}"
APP_PATH="$DEPLOY_ROOT/Open Cowork M.app"
USER_DATA_DIR="$DEPLOY_ROOT/user-data"
DEFAULT_WORKDIR="$DEPLOY_ROOT/workspace"

mkdir -p "$USER_DATA_DIR" "$DEFAULT_WORKDIR"

if [ ! -d "$APP_PATH" ]; then
  echo "App bundle not found: $APP_PATH" >&2
  exit 1
fi

exec /usr/bin/open -n -a "$APP_PATH" --args \
  "--open-cowork-user-data-dir=$USER_DATA_DIR" \
  "--open-cowork-workdir=$DEFAULT_WORKDIR" \
  "$@"
