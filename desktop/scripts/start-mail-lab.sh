#!/usr/bin/env bash
# Starts a disposable, self-contained standard SMTP/IMAP lab (stock Postfix +
# Dovecot, built from desktop/lab/mail-lab/Dockerfile) for testing OceanMail
# Desktop's account bootstrap and mail-engine integration.
#
# Independent of oceanmail-station: this does not read, build from, or
# otherwise depend on anything in that repository. It stands in for "a
# Station is reachable over standard SMTP/IMAP" using the real, currently
# documented interface shape (plain Postfix submission trusting the loopback
# test network, plaintext Dovecot IMAP with a passwd-file user) without being
# a copy of the Station's own implementation.
#
# Unlike oceanmail-station's disposable lab scripts, this one does NOT tear
# the container down on exit — it's meant to be left running while a
# Thunderbird dev instance (scripts/dev-launch.sh) is used against it.
# Run scripts/stop-mail-lab.sh when done.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DESKTOP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
IMAGE="oceanmail-desktop-mail-lab:latest"
NAME="oceanmail-desktop-mail-lab"
SMTP_PORT="${OCEANMAIL_LAB_SMTP_PORT:-2525}"
IMAP_PORT="${OCEANMAIL_LAB_IMAP_PORT:-2143}"
LAB_USER="bob"
LAB_PASSWORD="oceanmail-lab"
LAB_DOMAIN="station.test"
# Second account so account-scoped Mail work (Available/Saved/Outbox per
# Decision 0008) can be proven against a real second mailbox, not only bob.
LAB_USER2="ship"
LAB_PASSWORD2="oceanmail-lab"

command -v docker >/dev/null 2>&1 || {
    echo "ERROR: docker is required for the mail lab" >&2
    exit 2
}

echo "Building $IMAGE"
docker build -t "$IMAGE" "$DESKTOP_DIR/lab/mail-lab" >/dev/null

docker rm -f "$NAME" >/dev/null 2>&1 || true

echo "Starting $NAME (SMTP 127.0.0.1:$SMTP_PORT, IMAP 127.0.0.1:$IMAP_PORT)"
docker run -d --name "$NAME" --hostname "$LAB_DOMAIN" \
    -p "127.0.0.1:$SMTP_PORT:25" \
    -p "127.0.0.1:$IMAP_PORT:143" \
    "$IMAGE" >/dev/null

echo "Configuring Postfix (loopback-only submission, no auth, matching the Station's documented lab shape)"
docker exec "$NAME" postconf -e 'compatibility_level = 3.6'
docker exec "$NAME" postconf -e "myhostname = $LAB_DOMAIN"
docker exec "$NAME" postconf -e "mydomain = $LAB_DOMAIN"
docker exec "$NAME" postconf -e 'myorigin = $myhostname'
docker exec "$NAME" postconf -e 'inet_interfaces = all'
docker exec "$NAME" postconf -e 'inet_protocols = ipv4'
docker exec "$NAME" postconf -e "mydestination = $LAB_DOMAIN, localhost"
docker exec "$NAME" postconf -e 'mynetworks = 0.0.0.0/0'
docker exec "$NAME" postconf -e 'smtpd_relay_restrictions = permit_mynetworks, reject_unauth_destination'
docker exec "$NAME" postfix start
sleep 2
docker exec "$NAME" pgrep -x master >/dev/null || {
    echo "ERROR: Postfix did not start" >&2
    exit 1
}

echo "Configuring Dovecot (plaintext lab-only IMAP, user $LAB_USER)"
# dovecot_config_version/dovecot_storage_version are required as the first
# settings by Dovecot 2.4 (shipped in Debian trixie) — omitting them is a
# fatal "must be dovecot_config_version" config error at this package
# version, discovered while validating this lab against the image actually
# produced by this Dockerfile (Debian trixie-slim, dovecot-imapd 2.4.1-4).
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
# SPECIAL-USE (RFC 6154) mailboxes: without these, this lab's accounts only
# ever have Inbox, and Thunderbird falls back to storing Sent/Drafts in
# Local Folders instead of a real per-account server folder. OceanMail
# Desktop's Sent-status augmentation (experiment/mail-folders.js) detects
# an account's real Sent folder via nsMsgFolderFlags.SentMail, which
# Thunderbird sets from exactly this IMAP SPECIAL-USE advertisement — a
# real mail server (including the actual Station) would ordinarily expose
# this already, so this brings the lab in line rather than being an
# OceanMail-specific need.
namespace inbox {
  inbox = yes
  mailbox Drafts {
    special_use = \Drafts
    auto = subscribe
  }
  mailbox Sent {
    special_use = \Sent
    auto = subscribe
  }
  mailbox Trash {
    special_use = \Trash
    auto = subscribe
  }
}
service imap-login {
  inet_listener imap {
    port = 143
  }
  inet_listener imaps {
    port = 0
  }
}
passdb passwd-file {
  passwd_file_path = /etc/dovecot/passwd
}
userdb passwd {
}
EOF"
# root:dovecot 0640 (not root:root 0600): this package's auth worker runs as
# the unprivileged "dovecot" user by default, which cannot read a 0600
# root-owned file — confirmed by testing (denied) before landing on this mode.
docker exec "$NAME" bash -c "printf '%s\n%s\n' '${LAB_USER}:{PLAIN}${LAB_PASSWORD}' '${LAB_USER2}:{PLAIN}${LAB_PASSWORD2}' > /etc/dovecot/passwd && chown root:dovecot /etc/dovecot/passwd && chmod 0640 /etc/dovecot/passwd"
docker exec "$NAME" mkdir -p "/home/$LAB_USER/mail" "/home/$LAB_USER2/mail"
docker exec "$NAME" chown -R "$LAB_USER:$LAB_USER" "/home/$LAB_USER/mail"
docker exec "$NAME" chown -R "$LAB_USER2:$LAB_USER2" "/home/$LAB_USER2/mail"
docker exec "$NAME" dovecot
sleep 2
docker exec "$NAME" pgrep -x dovecot >/dev/null || {
    echo "ERROR: Dovecot did not start" >&2
    exit 1
}

cat <<SUMMARY

Mail lab running as container '$NAME'.
  SMTP (no auth, loopback-trusted): 127.0.0.1:$SMTP_PORT
  IMAP (plaintext, lab-only):       127.0.0.1:$IMAP_PORT
  User 1:                           $LAB_USER@$LAB_DOMAIN / password: $LAB_PASSWORD
  User 2:                           $LAB_USER2@$LAB_DOMAIN / password: $LAB_PASSWORD2

Stop with: scripts/stop-mail-lab.sh
SUMMARY
