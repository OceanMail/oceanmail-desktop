#!/usr/bin/env bash
# Downloads the pinned OceanMail Desktop Thunderbird baseline into a
# project-local vendor directory, verified against Mozilla's published
# SHA256SUMS. This is intentionally separate from any system-packaged
# Thunderbird (e.g. the Debian/apt "thunderbird" binary): OceanMail Desktop
# dev/test tooling must never launch or depend on the operator's own
# installed Thunderbird, so it can never affect that install or its profiles
# (docs/decisions/0005-thunderbird-client-foundation.md, "OceanMail Desktop
# must coexist with stock Thunderbird").
#
# See ../docs/THUNDERBIRD_BASELINE.md for why this exact version was chosen.

set -euo pipefail

VERSION="140.14.0esr"
FILENAME="thunderbird-${VERSION}.tar.xz"
URL="https://ftp.mozilla.org/pub/thunderbird/releases/${VERSION}/linux-x86_64/en-US/${FILENAME}"
EXPECTED_SHA256="39ccac67e6ebe762afff412ca30f6087c0a01324a1e1f69d912f4b399f83bb5f"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DESKTOP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
VENDOR_DIR="$DESKTOP_DIR/.vendor"
DEST_DIR="$VENDOR_DIR/thunderbird-${VERSION}"

if [[ -x "$DEST_DIR/thunderbird/thunderbird" ]]; then
    echo "Pinned Thunderbird $VERSION already present at $DEST_DIR/thunderbird"
    exit 0
fi

mkdir -p "$VENDOR_DIR"
TMP_TARBALL="$(mktemp "$VENDOR_DIR/.download.XXXXXX.tar.xz")"
trap 'rm -f "$TMP_TARBALL"' EXIT

echo "Downloading $URL"
curl -fL --progress-bar -o "$TMP_TARBALL" "$URL"

ACTUAL_SHA256="$(sha256sum "$TMP_TARBALL" | awk '{print $1}')"
if [[ "$ACTUAL_SHA256" != "$EXPECTED_SHA256" ]]; then
    echo "ERROR: checksum mismatch for $FILENAME" >&2
    echo "  expected: $EXPECTED_SHA256" >&2
    echo "  actual:   $ACTUAL_SHA256" >&2
    exit 1
fi
echo "Checksum verified: $ACTUAL_SHA256"

mkdir -p "$DEST_DIR"
tar -xJf "$TMP_TARBALL" -C "$DEST_DIR"

echo "Pinned Thunderbird $VERSION extracted to $DEST_DIR/thunderbird"
echo "Binary: $DEST_DIR/thunderbird/thunderbird"
