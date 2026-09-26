#!/usr/bin/env bash
# Stops and removes the Station integration lab container started by
# start-station-integration-lab.sh. Safe to run even if not running.

set -euo pipefail

NAME="oceanmail-station-integration-lab"

if docker rm -f "$NAME" >/dev/null 2>&1; then
    echo "Stopped and removed $NAME"
else
    echo "$NAME was not running"
fi
