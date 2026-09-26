# OceanMail Desktop ↔ OceanMail Station compatibility proof

This is the Stage B record required by Tranche 2: proof that the OceanMail
Desktop Thunderbird account works against the actual `oceanmail-station`
lab, not just the self-contained Desktop mail lab (`start-mail-lab.sh`,
whose own proof is recorded as "Thunderbird/OceanMail Desktop standard
SMTP/IMAP integration proof" — see `docs/TRANCHE2_PROGRESS.md`). Stage A
does not substitute for this.

`oceanmail-station` is a separate, actively-developed, read-only
dependency for this branch. Nothing in that repository was modified,
committed to, or redesigned. `scripts/start-station-integration-lab.sh`
treats the shared `OCEANMAIL_STATION_REPO` checkout as strictly read-only:
it only fetches `origin/main` into that checkout's remote-tracking refs (a
metadata-only operation that never touches its working tree or currently
checked-out branch), resolves the exact commit to test (or an explicit
`OCEANMAIL_STATION_SHA` pin), creates a separate temporary **detached git
worktree** at that exact commit, and builds every Station lab Docker image
only from that isolated worktree — never from the shared checkout's own
working tree, which could otherwise silently pick up another branch or
uncommitted changes despite the script reporting a clean-looking SHA. The
temporary worktree is removed as soon as the images are built. Runtime
Postfix/Dovecot configuration is then applied via `docker exec` only,
mirroring `scripts/phase3a-standard-mail-client.sh`'s own steps.

## Station commit tested

```
1d9bbf649d29214f5bd0fbeed761ca6b38e651f9
```

Resolved from a fresh `origin/main` fetch immediately before this proof.
The shared `oceanmail-station` checkout — which another, concurrently-active
thread was using on a different branch with its own uncommitted work — was
never checked out to a different branch or otherwise touched; the build
came only from the isolated worktree described above. Confirmed via
`docs/CURRENT_STATUS.md` at that commit that "Phase 3 — standard SMTP/IMAP
client path — COMPLETE" and that `scripts/phase3a-standard-mail-client.sh`
is still the current documented standard-mail-client proof script, and
confirmed its Dockerfiles/config were byte-identical to what an earlier
session had already inspected.

## What was proven

Using the real `oceanmail-station` Phase 1-3 lab images (SMTP
127.0.0.1:2525 → 25, IMAP 127.0.0.1:2143 → 143, `bob@station.test` /
`oceanmail-lab`, no SMTP auth, plaintext IMAP — the same lab boundary
`scripts/phase3a-standard-mail-client.sh` itself proves), through the
actual Thunderbird OceanMail account (not a raw protocol script):

- Account auto-provisioned against the Station lab, no wizard shown.
- Native IMAP retrieval: a message submitted directly by raw SMTP
  (`station-lab-smoke-1@station.test`) appeared in Thunderbird's Inbox.
- Native SMTP send: composed "Station B Thunderbird send proof" from the
  OceanMail identity (bob→bob) through Thunderbird's own compose window;
  it was accepted and arrived back in the Inbox.
- Native reply: opened the received message and hit Reply; Thunderbird
  produced a correctly quoted/addressed reply window
  ("Re: Station B Thunderbird send proof").

Reply/forward mechanics and the OceanMail Space's native
Inbox-open/compose-invocation buttons were exercised in full against the
self-contained Desktop lab (Stage A) and are Thunderbird-native behavior
independent of which IMAP/SMTP server backs the account; they were not
re-run exhaustively here beyond the reply check above, to keep this proof
focused on the SMTP/IMAP compatibility question itself.

## Runtime fixes applied (not committed to Station)

Two bugs — already found and fixed in our own `start-mail-lab.sh` (see
`docs/TRANCHE2_PROGRESS.md`) — reproduce identically against Station's own
lab images built from this exact commit, and were worked around only via
`docker exec` on our own runner's container (never by editing any file in
the Station checkout):

1. Dovecot 2.4 (Debian trixie) requires `dovecot_config_version` /
   `dovecot_storage_version` as the first settings, which
   `phase3a-standard-mail-client.sh`'s inline `dovecot.conf` omits.
2. The Dovecot passwd-file must be `root:dovecot 0640`, not the script's
   `chmod 0600` (root-owned) — the auth worker runs as the unprivileged
   `dovecot` user on this package version.

A third, only checked here for the first time: Station's own `lab/phase2/
Dockerfile` creates `bob`/`alice` via `useradd --create-home --shell
/usr/sbin/nologin` with no `-G mail`, which — as found while building our
own lab — makes Dovecot open `INBOX` read-only (mbox dotlocking needs
group-mail write access on `/var/mail`). Worked around here the same way,
via `docker exec usermod -aG mail bob` on the running container.

**Historical finding:** these Dovecot/trixie incompatibilities affected the
Station revision tested here. The current Station snapshot includes the
compatibility corrections; see the [current contract gaps](STATION_API_CONTRACT_GAPS.md).

## Reproducing

```bash
cd desktop
OCEANMAIL_STATION_REPO=/path/to/oceanmail-station ./scripts/start-station-integration-lab.sh
# or, to pin an exact commit instead of whatever origin/main currently is:
OCEANMAIL_STATION_REPO=/path/to/oceanmail-station OCEANMAIL_STATION_SHA=<commit> ./scripts/start-station-integration-lab.sh

./scripts/dev-launch.sh
# ... exercise Thunderbird ...
./scripts/stop-station-integration-lab.sh
```

`start-station-integration-lab.sh` fetches `origin/main` in the given
checkout, resolves the exact commit to build (or the `OCEANMAIL_STATION_SHA`
override), builds all Station lab images from a temporary detached
`git worktree` at that exact commit, prints the resolved SHA, and removes
the worktree — it never checks out a branch or modifies a file in the
shared checkout itself, so it's safe to point at a checkout someone else
is actively working in.

Only one of `start-mail-lab.sh` / `start-station-integration-lab.sh` can
run at a time — both bind `127.0.0.1:2525`/`127.0.0.1:2143` by convention
(matching Station's own script defaults), and `background.js`'s account
config points at those same ports either way.
