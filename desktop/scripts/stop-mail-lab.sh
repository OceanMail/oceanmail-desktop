#!/usr/bin/env bash
# Stops and removes the disposable self-contained mail lab container started
# by scripts/start-mail-lab.sh. Safe to run even if the container is not
# running.

set -euo pipefail

NAME="oceanmail-desktop-mail-lab"

if docker rm -f "$NAME" >/dev/null 2>&1; then
    echo "Stopped and removed $NAME"
else
    echo "$NAME was not running"
fi
