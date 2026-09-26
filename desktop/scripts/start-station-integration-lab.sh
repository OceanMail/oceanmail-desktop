#!/usr/bin/env bash
# Starts a persistent container from oceanmail-station's own Phase 1-3 lab
# images (its real Postfix+Dovecot standard-mail-client compatibility lab,
# scripts/phase3a-standard-mail-client.sh) so OceanMail Desktop's Thunderbird
# account can be pointed at the actual Station lab shape, not just the
# self-contained Desktop mail lab (start-mail-lab.sh).
#
# oceanmail-station is a separate, actively-developed repository. The shared
# checkout pointed to by OCEANMAIL_STATION_REPO is treated strictly
# read-only: this script never checks out a branch there, never modifies a
# file there, and never commits there. It only (1) fetches origin/main into
# that checkout's remote-tracking refs (a metadata-only operation — it does
# not touch the working tree or the currently checked-out branch, so it is
# safe even while another worker has uncommitted changes checked out on a
# different branch there), then (2) creates a separate, temporary, detached
# `git worktree` at the exact resolved commit, and builds every Station lab
# Docker image only from that isolated worktree — never from the shared
# checkout's own working tree, which could otherwise silently pick up
# another branch or uncommitted changes despite this script reporting a
# clean-looking SHA. The temporary worktree is removed once the images are
# built; only the resulting Docker images and the printed SHA persist.
#
# Runtime `docker exec` configuration mirrors
# phase3a-standard-mail-client.sh's own postconf/dovecot steps, plus
# runtime-only fixes for Dovecot/Debian-trixie bugs tracked as
# oceanmail-station issue #21 (NOT fixed in that repository — see
# docs/STATION_COMPATIBILITY_PROOF.md). Unlike
# phase3a-standard-mail-client.sh (which tears its container down on exit),
# this leaves the container running so Thunderbird has something to connect
# to; stop it with stop-station-integration-lab.sh.
#
# Usage:
#   OCEANMAIL_STATION_REPO=/path/to/oceanmail-station ./scripts/start-station-integration-lab.sh
#   OCEANMAIL_STATION_SHA=<commit-ish> ./scripts/start-station-integration-lab.sh   # pin a specific commit instead of origin/main
#
# OCEANMAIL_STATION_REPO defaults to a sibling checkout: ../oceanmail-station
# relative to this repo.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DESKTOP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
STATION_REPO="${OCEANMAIL_STATION_REPO:-$(cd "$DESKTOP_DIR/../../oceanmail-station" 2>/dev/null && pwd)}"

if [[ -z "$STATION_REPO" || ! -e "$STATION_REPO/.git" ]]; then
    echo "ERROR: oceanmail-station checkout not found." >&2
    echo "Set OCEANMAIL_STATION_REPO=/path/to/oceanmail-station" >&2
    exit 2
fi

echo "Station checkout (read-only, untouched): $STATION_REPO"
echo "Fetching origin/main (remote-tracking ref only — does not affect the checkout's current branch or working tree)"
git -C "$STATION_REPO" fetch origin main:refs/remotes/origin/main --no-tags --quiet

if [[ -n "${OCEANMAIL_STATION_SHA:-}" ]]; then
    if ! git -C "$STATION_REPO" cat-file -e "${OCEANMAIL_STATION_SHA}^{commit}" 2>/dev/null; then
        echo "OCEANMAIL_STATION_SHA=$OCEANMAIL_STATION_SHA not found locally; attempting to fetch it directly" >&2
        git -C "$STATION_REPO" fetch origin "$OCEANMAIL_STATION_SHA" --no-tags --quiet || true
    fi
    STATION_SHA="$(git -C "$STATION_REPO" rev-parse --verify "${OCEANMAIL_STATION_SHA}^{commit}")" || {
        echo "ERROR: OCEANMAIL_STATION_SHA=$OCEANMAIL_STATION_SHA does not resolve to a commit in $STATION_REPO" >&2
        exit 2
    }
    echo "Pinned Station commit requested via OCEANMAIL_STATION_SHA: $STATION_SHA"
else
    STATION_SHA="$(git -C "$STATION_REPO" rev-parse refs/remotes/origin/main)"
    echo "Resolved Station commit from freshly-fetched origin/main: $STATION_SHA"
fi

WORKTREE_DIR="$(mktemp -d "${TMPDIR:-/tmp}/oceanmail-station-worktree.XXXXXX")"
cleanup_worktree() {
    git -C "$STATION_REPO" worktree remove --force "$WORKTREE_DIR" >/dev/null 2>&1 || rm -rf "$WORKTREE_DIR"
}
trap cleanup_worktree EXIT

echo "Creating isolated detached worktree at $STATION_SHA (not the shared checkout's working tree)"
git -C "$STATION_REPO" worktree add --detach --quiet "$WORKTREE_DIR" "$STATION_SHA"

HERMES_NET_SHA="5c76adff754de49c0b934c7fd7bddf7619b0c3d6"
LIBCMIME_SHA="dd21eb096d162656e30243f60fc4bc35ad39ae6e"
PHASE1_IMAGE="oceanmail-uucp-lab:phase1"
PHASE2_IMAGE="oceanmail-mail-lab:phase2"
PHASE2B_IMAGE="oceanmail-mail-lab:phase2b"
PHASE3_IMAGE="oceanmail-mail-client-lab:phase3"
NAME="oceanmail-station-integration-lab"
SMTP_PORT="${OCEANMAIL_LAB_SMTP_PORT:-2525}"
IMAP_PORT="${OCEANMAIL_LAB_IMAP_PORT:-2143}"
LAB_PASSWORD="oceanmail-lab"

echo "Building Station's own lab images from the isolated worktree only"
docker build --build-arg "HERMES_NET_SHA=$HERMES_NET_SHA" \
    -f "$WORKTREE_DIR/lab/phase1/Dockerfile" -t "$PHASE1_IMAGE" "$WORKTREE_DIR" >/dev/null
docker build -f "$WORKTREE_DIR/lab/phase2/Dockerfile" -t "$PHASE2_IMAGE" "$WORKTREE_DIR" >/dev/null
docker build --build-arg "HERMES_NET_SHA=$HERMES_NET_SHA" --build-arg "LIBCMIME_SHA=$LIBCMIME_SHA" \
    -f "$WORKTREE_DIR/lab/phase2b/Dockerfile" -t "$PHASE2B_IMAGE" "$WORKTREE_DIR" >/dev/null
docker build -f "$WORKTREE_DIR/lab/phase3/Dockerfile" -t "$PHASE3_IMAGE" "$WORKTREE_DIR" >/dev/null
echo "PASS: Station phase1-3 lab images built from commit $STATION_SHA"

# The images are now built and tagged; the worktree's job is done. Remove it
# now (rather than waiting for script exit) so it never lingers longer than
# it needs to — the EXIT trap remains as a safety net if anything above fails.
cleanup_worktree
trap - EXIT

docker rm -f "$NAME" >/dev/null 2>&1 || true
echo "Starting $NAME (SMTP 127.0.0.1:$SMTP_PORT, IMAP 127.0.0.1:$IMAP_PORT)"
docker run -d --name "$NAME" --hostname station \
    -p "127.0.0.1:$SMTP_PORT:25" \
    -p "127.0.0.1:$IMAP_PORT:143" \
    "$PHASE3_IMAGE" sleep infinity >/dev/null

echo "Configuring Postfix (matching phase3a-standard-mail-client.sh exactly)"
docker exec "$NAME" /usr/sbin/postconf -e 'compatibility_level = 3.6'
docker exec "$NAME" /usr/sbin/postconf -e 'myhostname = station.test'
docker exec "$NAME" /usr/sbin/postconf -e 'mydomain = station.test'
docker exec "$NAME" /usr/sbin/postconf -e 'myorigin = $myhostname'
docker exec "$NAME" /usr/sbin/postconf -e 'inet_interfaces = all'
docker exec "$NAME" /usr/sbin/postconf -e 'inet_protocols = ipv4'
docker exec "$NAME" /usr/sbin/postconf -e 'mydestination = station.test, localhost'
docker exec "$NAME" /usr/sbin/postconf -e 'mynetworks = 0.0.0.0/0'
docker exec "$NAME" /usr/sbin/postconf -e 'smtpd_relay_restrictions = permit_mynetworks, reject_unauth_destination'
docker exec "$NAME" /usr/sbin/postfix start
sleep 2
docker exec "$NAME" pgrep -x master >/dev/null || {
    echo "ERROR: Postfix did not start" >&2
    exit 1
}
echo "PASS: Postfix running"

echo "Configuring Dovecot (matching phase3a-standard-mail-client.sh, plus runtime fixes for oceanmail-station issue #21)"
docker exec "$NAME" bash -c "cat > /etc/dovecot/dovecot.conf <<'EOF'
dovecot_config_version = 2.4.0
dovecot_storage_version = 2.4.0
protocols = imap
listen = *
ssl = no
auth_allow_cleartext = yes
auth_mechanisms = plain login
mail_driver = mbox
mail_path = ~/mail
mail_inbox_path = /var/mail/%{user}
mail_index_path = ~/mail/.imap
mbox_read_locks = fcntl
mbox_write_locks = fcntl
passdb passwd-file {
  passwd_file_path = /etc/dovecot/passwd
}
userdb passwd {
}
service imap-login {
  inet_listener imap {
    port = 143
  }
  inet_listener imaps {
    port = 0
  }
}
EOF"
docker exec "$NAME" bash -c "echo 'bob:{PLAIN}${LAB_PASSWORD}' > /etc/dovecot/passwd && chown root:dovecot /etc/dovecot/passwd && chmod 0640 /etc/dovecot/passwd"
# Runtime-only fix (not a Station repo change; tracked as oceanmail-station
# issue #21): bob needs group "mail" for mbox dotlocking under /var/mail, or
# Dovecot opens INBOX read-only.
docker exec "$NAME" usermod -aG mail bob
docker exec "$NAME" mkdir -p /home/bob/mail
docker exec "$NAME" chown -R bob:bob /home/bob/mail
docker exec "$NAME" dovecot
sleep 2
docker exec "$NAME" pgrep -x dovecot >/dev/null || {
    echo "ERROR: Dovecot did not start" >&2
    exit 1
}
echo "PASS: Dovecot running"

cat <<SUMMARY

Station integration lab running as container '$NAME'.
  Station commit tested (isolated worktree, now removed): $STATION_SHA
  SMTP (no auth, loopback-trusted): 127.0.0.1:$SMTP_PORT
  IMAP (plaintext, lab-only):       127.0.0.1:$IMAP_PORT
  User:                             bob@station.test / password: $LAB_PASSWORD

Stop with: scripts/stop-station-integration-lab.sh
SUMMARY
