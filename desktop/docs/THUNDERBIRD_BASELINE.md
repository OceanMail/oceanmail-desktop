# OceanMail Desktop — Pinned Thunderbird Baseline

## Pinned version

`140.14.0esr` (Linux x86_64, en-US), fetched from Mozilla's official release
mirror and verified against Mozilla's published `SHA256SUMS`:

```text
39ccac67e6ebe762afff412ca30f6087c0a01324a1e1f69d912f4b399f83bb5f  thunderbird-140.14.0esr.tar.xz
```

Fetched by `scripts/fetch-thunderbird.sh` into `desktop/.vendor/thunderbird-140.14.0esr/`
(gitignored — not committed; the script re-downloads and re-verifies on demand).

## Why this exact version, and why vendored rather than system-installed

The development machine happens to have Debian's packaged Thunderbird
(`140.14.0esr-1~deb13u1`) installed system-wide. OceanMail Desktop tooling
must not depend on or launch that system package, even with an isolated
profile: sharing a binary with the operator's real Thunderbird install means
any mistake in OceanMail-side tooling risks that real install. See Decision
0005, "OceanMail Desktop must coexist with stock Thunderbird" — this is a
hard requirement, not polish.

`desktop/scripts/fetch-thunderbird.sh` downloads the same `140.14.0esr`
version directly from `ftp.mozilla.org` into a project-local vendor
directory, checksum-verified. `desktop/scripts/dev-launch.sh` only launches
that vendored binary and refuses to fall back to any binary found on `PATH`.
This keeps OceanMail Desktop's Thunderbird dependency fully separate from
whatever Thunderbird (if any) is installed on the development machine, and
also matches the eventual production direction: a real OceanMail Desktop
package ships its own pinned Thunderbird base rather than depending on a
system install.

Verified concurrent-operation: two isolated instances (different profile
directories, `-no-remote`, this vendored binary) were run at the same time
during this bootstrap with no lock conflict — see the Phase 4 desktop
handoff for the exact evidence. The same mechanism is why an OceanMail dev
instance can run alongside a separately installed, separately profiled
Thunderbird.

## Preferences verified against this exact build

Rather than assume Thunderbird preference names from memory, the following
were confirmed to exist by extracting and grepping this exact build's
`omni.ja` (`chrome/messenger/content/messenger/schemas/*.json`, `modules/**`)
before being used in `dev-launch.sh`:

- `mail.accounthub.enabled` — controls the "Account Hub" onboarding flow
  shown to a new profile. Set `false` in the dev profile's `user.js`.
- `mail.provider.suppress_dialog_on_startup` — suppresses a first-run
  provider dialog. Set `true`.
- The `spaces` and `spacesToolbar` WebExtension API namespaces exist in this
  build (`chrome/messenger/content/messenger/schemas/spaces.json`), with
  `spaces.create(name, tabProperties, buttonProperties)` matching what
  `extension/background.js` calls.
- The manifest schema (`chrome/toolkit/content/extensions/schemas/manifest.json`)
  confirms `background.scripts` plus `background.preferred_environment` is a
  valid MV3 combination in this build, and that `ExtensionSettings`,
  `Preferences`, `DisableAppUpdate`, `AppAutoUpdate`, `Extensions`,
  `InstallAddonsPermission`, and `DisableMasterPasswordCreation` are real
  enterprise-policy keys (`modules/policies/schema.sys.mjs`) — noted here
  because `policies.json` was deliberately *not* used for account-setup
  suppression, since it applies machine/app-wide and would risk a separately
  installed Thunderbird. See `dev-launch.sh` for the profile-scoped
  `user.js` approach used instead.

This does not mean every OceanMail-desired suppression is solved yet — only
that the mechanisms actually implemented rest on prefs/APIs confirmed to
exist in this exact build, not assumption. Remaining gaps belong in the
Phase 4 desktop handoff, not invented here.

## Isolation gap found in Tranche 2 (minor, not fixed)

Gecko's crash reporter writes a tiny per-build marker file
(`~/.thunderbird/Crash Reports/InstallTime<buildid>`, containing only a
Unix timestamp — no crash dump, no PII) to the user's shared
`~/.thunderbird` directory regardless of `-profile`. This is fixed Gecko
behavior, not profile-scoped, and not something `-no-remote -profile`
controls. Confirmed by inspecting `~/.thunderbird/Crash Reports/` after
running `dev-launch.sh`: it gained an `InstallTime20260828005046` entry
matching the vendored build's `parentBuildID`, alongside pre-existing
entries from the operator's own separately-installed Thunderbird
(`1:140.14.0esr-1~deb13u1` via `dpkg`). No profile data, account
credentials, or message content cross this boundary — only that one
marker file. Not fixed here (would mean patching Gecko's crash-reporter
init, which is out of scope); documented so it isn't silently missed
against Decision 0005's isolation bar.

## Thunderbird Experiment APIs (Tranche 2: account bootstrap)

Confirmed by reading this exact build's `omni.ja` and by empirical testing
(not just source-reading — the first attempt below looked correct by
source but failed in practice):

- `extensions.experiments.enabled` defaults to `true` in this build's
  `greprefs.js`, because `AppConstants.MOZ_REQUIRE_SIGNING` is `false` for
  Thunderbird (unlike Firefox release builds). This is what makes
  `manifest.experiment_apis` usable by our unsigned, unpacked, profile-scope
  extension at all — no privileged signing or `about:debugging`-style
  temporary install is needed. See
  `modules/addons/AddonSettings.sys.mjs` (`EXPERIMENTS_ENABLED`) and
  `modules/Extension.sys.mjs` (`canUseAPIExperiment()`).
- Despite `chrome/toolkit/content/extensions/schemas/experiments.json`
  documenting a `permissions` entry pattern
  (`^experiments(\.\w+)+$`) for declaring an experiment API's namespace
  (e.g. `"permissions": ["experiments.oceanmailAccounts"]`), **actually
  including that string in `manifest.json`'s `permissions` array causes
  this build to fail manifest validation and disable the whole extension**
  (`extensions.json` records `appDisabled: true`, `active: false`, and
  `userPermissions.permissions` ends up empty) — confirmed by bisecting on
  a freshly-wiped `.dev-profile` with `dev-launch.sh` and inspecting
  `extensions.json` after each attempt. Declaring `experiment_apis` in the
  manifest is sufficient by itself; `permissions` should list only the
  ordinary permissions actually used (e.g. `spaces`), not the experiment's
  own namespace. `extension/manifest.json` follows this working shape.
- The account-creation backend used by the `oceanmailAccounts` experiment
  (`extension/experiment/`) is
  `resource:///modules/accountcreation/CreateInBackend.sys.mjs`'s
  `createAccountInBackend()` — the same function the built-in Account Hub
  setup wizard calls — plus its `checkIncomingServerAlreadyExists()` /
  `checkOutgoingServerAlreadyExists()` for idempotent detection. Confirmed
  by reading that module rather than re-deriving
  `nsIMsgAccount`/`nsIMsgIncomingServer`/`nsIMsgOutgoingServer` wiring from
  scratch. Constant names `Ci.nsMsgSocketType.plain`,
  `Ci.nsMsgAuthMethod.passwordCleartext`, `Ci.nsMsgAuthMethod.none`
  confirmed via `modules/accountcreation/*.sys.mjs` usage.
- A privileged Experiment `implementation.js` runs in a sandbox where
  `ChromeUtils`, `Services`, `Cc`, `Ci`, `Cu`, `ExtensionAPI`, and
  `ExtensionCommon` are already-injected globals (no import needed) —
  confirmed via `ExtensionCommon.sys.mjs`'s `_createExtGlobal()`. ES
  modules like `MailServices.sys.mjs` still need
  `ChromeUtils.importESModule()` inside the script.

## Not yet solved by this baseline

- Real installer/packaging identity (separate app ID, updater, shortcuts) —
  Decision 0005's full isolation list goes beyond "don't share a binary
  during development." That is future packaging work, not part of this spike.
- Windows/macOS baselines — this pin and the fetch/launch scripts are
  Linux-only so far.
