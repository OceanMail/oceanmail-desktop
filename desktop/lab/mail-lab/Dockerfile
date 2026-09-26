# Self-contained standard SMTP/IMAP lab for OceanMail Desktop account-bootstrap
# testing. Deliberately independent of oceanmail-station: it installs stock
# Debian Postfix + Dovecot rather than reusing anything from that repository,
# so this image build never reads or depends on oceanmail-station's files.
#
# It exists to prove OceanMail Desktop's Thunderbird account can talk to a
# real, standards-based SMTP/IMAP mail server of the same shape the real
# Station exposes (ordinary Postfix + Dovecot). It is a local proxy for
# "a Station is present," not a copy of the Station's own implementation.
FROM debian:trixie-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    postfix \
    dovecot-imapd \
    python3 \
    procps \
    && rm -rf /var/lib/apt/lists/*

# -G mail: mbox dotlocking under /var/mail (root:mail, sticky/setgid) needs
# the mailbox owner to belong to group "mail", or Dovecot IMAP SELECT opens
# INBOX read-only ("is not writable") even though the mbox file itself is
# owned by bob — confirmed by testing against this exact image.
#
# Two users (bob, ship) so OceanMail Desktop's account-scoped Mail work
# (Decision 0008 — Available/Saved/Outbox live per OceanMail account) can be
# proven against a real second mailbox rather than only ever exercising one
# account.
RUN useradd -m -G mail bob && useradd -m -G mail ship

CMD ["sleep", "infinity"]
