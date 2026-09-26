# OceanMail Desktop — Bootstrap Spike

Implementation of Decision 0005 (`docs/decisions/0005-thunderbird-client-foundation.md`):
OceanMail Desktop as a mandatory Thunderbird MailExtension providing an
OceanMail-owned Space, isolated from any other Thunderbird installation on
the machine.

This is a bootstrap/spike, not a packaged product. See
`docs/STATION_API_CONTRACT_GAPS.md` and the Phase 4 desktop handoff for what
is real versus placeholder.

## Layout

```text
desktop/
  extension/            mandatory OceanMail MailExtension (manifest_version 3)
    background.js        creates the OceanMail Space, provisions the OceanMail account
    experiment/            oceanmailAccounts Experiment API (native account provisioning)
    space/                OceanMail Space UI (Inbox/Available/Outbox/Sent/Compose/Manifest/Station/Emergency)
    station/               Station API client boundary (station-client.js + station-client.test.js)
  lab/
    mail-lab/Dockerfile   self-contained stock Postfix+Dovecot lab, independent of oceanmail-station
  scripts/
    fetch-thunderbird.sh  downloads + checksum-verifies the pinned Thunderbird build
    dev-launch.sh          launches an isolated OceanMail dev profile against the vendored build
    start-mail-lab.sh      builds/starts the self-contained mail lab container
    stop-mail-lab.sh       stops/removes it
    lint.mjs               web-ext lint wrapper (see "Test / lint" below)
  docs/
    THUNDERBIRD_BASELINE.md      pinned version, isolation notes, Experiment API findings
    STATION_API_CONTRACT_GAPS.md  Station endpoints this client needs but the Station doesn't expose yet
    TRANCHE2_PROGRESS.md          working save-state log for the account-bootstrap tranche
```

## Setup

```bash
cd desktop
npm ci
./scripts/fetch-thunderbird.sh
```

`npm ci` installs the pinned, exact-versioned `web-ext` from the committed
`package-lock.json` — reproducible, not "whatever npx happens to resolve."

`fetch-thunderbird.sh` downloads `140.14.0esr` into `desktop/.vendor/`
(gitignored), verified against Mozilla's published SHA256 checksum. It needs
network access once; re-running is a no-op if already fetched. It never uses
any system-installed Thunderbird.

## Run

```bash
cd desktop
./scripts/start-mail-lab.sh   # self-contained Postfix+Dovecot lab (127.0.0.1:2525/2143)
./scripts/dev-launch.sh
```

`dev-launch.sh` creates (or reuses) an isolated profile at
`desktop/.dev-profile` (gitignored), loads the OceanMail extension from
`extension/` via a profile-scoped extension-proxy file, and launches the
vendored Thunderbird with `-no-remote -profile desktop/.dev-profile`. This
never touches `~/.thunderbird` or any other profile, and can run at the
same time as a separately installed Thunderbird — both were verified
during this bootstrap (see the handoff).

On every startup the extension provisions a native OceanMail IMAP/SMTP
account (`bob@station.test`, pointed at the mail lab above) via
`extension/experiment/` — no account wizard is shown, and restarting
without wiping the profile does not create a duplicate account. Click the
OceanMail icon in the spaces toolbar (left edge) to open the OceanMail
Space; its Inbox panel has buttons that open Thunderbird's own native mail
tab and compose window against that account. Use
`OCEANMAIL_DEV_PROFILE=/some/other/dir ./scripts/dev-launch.sh` to run a
second, independent instance concurrently. Stop the lab with
`./scripts/stop-mail-lab.sh` when done.

To point the Station panel at a running `oceanmail-station` instance, start
one from the `oceanmail-station` repo (see its `scripts/phase4a-station-service.sh`
or run the daemon directly) and use the "Check Station connection" button —
it calls the real `/api/v1/health` and `/api/v1/station` endpoints.

## Test / lint

```bash
cd desktop
npm run lint
npm test
```

`npm run lint` runs `scripts/lint.mjs`, a thin wrapper around `web-ext lint
--source-dir=extension` (pinned local install from `npm ci`, not whatever
`npx` would resolve). It re-emits every warning/error `web-ext` reports, but
only fails the build on an error other than exactly one tolerated false
positive: `MANIFEST_FIELD_PRIVILEGED` on `/experiment_apis`. `web-ext`'s
linter assumes `experiment_apis` requires AMO privileged-extension signing;
that's true for extensions distributed through addons.mozilla.org, but not
for OceanMail Desktop's mandatory, self-distributed extension on this
pinned Thunderbird build, which allows `experiment_apis` unsigned because
`extensions.experiments.enabled` defaults to `true` (Thunderbird doesn't
require add-on signing the way Firefox does — see
`docs/THUNDERBIRD_BASELINE.md`). Passing `--privileged` to `web-ext`
instead trades this one tolerated error for two different ones about AMO
submission requirements that don't apply here either — confirmed by
testing both paths, not assumed.

At the time of writing, besides that one tolerated error there are 10
warnings, all still false positives from `web-ext` linting against
Firefox's schema set, which does not know about Thunderbird-only APIs:
`spaces`/`compose`/`accountsRead` permissions and
`spaces.create`/`spaces.query`/`accounts.list`/`mailTabs.create`/
`compose.beginNew`/`oceanmailAccounts.ensureAccount` "unsupported" (all
real Thunderbird-only MailExtension APIs, confirmed against this exact
build's `omni.ja` — see `docs/THUNDERBIRD_BASELINE.md`), plus
`MISSING_DATA_COLLECTION_PERMISSIONS` (an AMO-listing requirement,
irrelevant to a mandatory extension bundled with its own installer rather
than published there).

There is no Thunderbird-aware extension linter as of this writing; `web-ext
lint` is still useful for catching real manifest/JS mistakes, just not a
clean pass/fail signal on its own.

`npm test` runs Node's built-in test runner (`node --test`, no extra
dependency) against `extension/station/station-client.test.js`, which
mocks `fetch` to cover every `Implemented` call and every `NotYetAvailable`
rejection in `station-client.js`.
