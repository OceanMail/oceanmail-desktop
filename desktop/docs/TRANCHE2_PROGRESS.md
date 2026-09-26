# Tranche 2 save-state

Update this file in place (not append-heavy) as a checkpoint. Keep it short.

Branch: feature/oceanmail-desktop-account-bootstrap, baseline a795cd0.
Station repo (`/home/developer/Projects/oceanmail-station`) is read-only/moving
— never modify it; used an isolated `git worktree` for Stage B rather than
switching the shared checkout's branch (another thread is actively using it).

GUI testing note: this environment has a real X display (DISPLAY=:1, KDE
Plasma/Wayland+XWayland) — it's the user's actual desktop, not a disposable
sandbox. Thunderbird windows are captured with `import -window <id>`
(ImageMagick) after finding the window via `xwininfo -root -tree`; mouse/
keyboard driven via a small python-xlib script (`scratchpad/xclick.py`,
`xkey.py`, `xtype.py`) since xdotool isn't installed and can't be
apt-installed (no passwordless sudo). Launch Thunderbird with
`GDK_BACKEND=x11` to force XWayland (native Wayland windows aren't
capturable this way). NEVER use `pkill -f <pattern>` to stop Thunderbird —
the pattern matches the literal text of the wrapping shell command itself
and kills your own script; use `pgrep`/`ps aux` for numeric PIDs + `kill -9`.

## Done — everything below is committed

1. **Stage A self-contained lab** fixed (`desktop/lab/mail-lab/`,
   `desktop/scripts/{start,stop}-mail-lab.sh`): dovecot_config_version
   line, passwd file perms (root:dovecot 0640), mbox group membership.
   Verified via raw smtplib/imaplib.
2. **Native account provisioning**: Thunderbird Experiment API
   (`extension/experiment/`) calls Thunderbird's own
   `CreateInBackend.createAccountInBackend()` (same as the Account Hub
   wizard) + its existence-check helpers for idempotency. Wired into
   `background.js`, runs on every startup. Gotcha: declaring
   `"experiments.oceanmailAccounts"` under manifest `permissions` disables
   the whole extension on this Thunderbird build — declare `experiment_apis`
   only. Full details in `docs/THUNDERBIRD_BASELINE.md`.
3. **Native reuse from the Space**: Inbox panel buttons call
   `browser.accounts.list()` + `browser.mailTabs.create({displayedFolderId})`
   and `browser.compose.beginNew()` — real Thunderbird tabs/windows, not an
   HTML reimplementation. Needed permissions `compose` + `accountsRead`
   (not plain `"accounts"`).
4. **station-client.js tests** (`node --test`, no new dependency) +
   `scripts/lint.mjs` (tolerates exactly one web-ext false-positive error
   caused by `experiment_apis`, fails on any other error). CI runs both.
5. **Stage A GUI proof** (self-contained lab): account auto-provisions, no
   wizard, survives restart without duplicating, native SMTP send + IMAP
   read, native reply + forward (correct quoting/threading), both Space
   buttons open real native tabs/windows. All via screenshots during
   testing (not re-saved as files — see chat transcript if needed).
6. **Stage B GUI proof** (real Station lab, `oceanmail-station` commit
   `1d9bbf649d29214f5bd0fbeed761ca6b38e651f9`, resolved from a fresh
   `origin/main` fetch and built only from a temporary detached worktree —
   `start-station-integration-lab.sh` never checks out a branch or touches
   a file in the shared checkout, since another thread is actively working
   in it): same account, `scripts/start-station-integration-lab.sh`
   builds/runs Station's own unmodified Phase 1-3 lab images, applies the
   same runtime `docker exec` fixes as #1 (also present in Station's
   images — tracked as `oceanmail-station` issue #21, not fixed there).
   Native IMAP read, native SMTP send, native reply all confirmed. Full record in
   `docs/STATION_COMPATIBILITY_PROOF.md`.
7. Isolation re-checked: vendored binary + `.dev-profile` only, no
   `policies.json`, operator's real Thunderbird (dpkg `1:140.14.0esr-1~deb13u1`)
   untouched. One minor documented (not fixed) gap: Gecko's crash reporter
   writes a per-build timestamp marker (no PII) to shared
   `~/.thunderbird/Crash Reports/` regardless of `-profile`.

## Status: PR open, one review round done

PR #5 (https://github.com/OceanMail/oceanmail-desktop-archive/pull/5) opened against
`main`. Project lead reviewed and accepted the Tranche 2 architecture and
implementation; one correction was requested (and made, this commit):
`start-station-integration-lab.sh` now fetches `origin/main` and builds
only from a temporary detached `git worktree` at the resolved (or
`OCEANMAIL_STATION_SHA`-pinned) commit, rather than building directly from
the shared checkout — never checks out a branch or touches a file there.
Verified via a non-GUI raw SMTP/IMAP smoke test that lab behavior is
unchanged (full GUI proof intentionally not re-run — project lead's
instruction, since this was a build-mechanism fix, not a behavior change).
Dovecot issues remain tracked as `oceanmail-station` issue #21 per project
lead, not touched here.

## State of running things (as of last check)

The Docker integration-lab container was stopped after verifying the
worktree fix (`docker ps` shows nothing). The Thunderbird dev instance
from the earlier session may still be running (`pgrep -x thunderbird`) —
left as-is since it's harmless and the user can see it; not force-killed.

## Next action

Awaiting further review on PR #5.
