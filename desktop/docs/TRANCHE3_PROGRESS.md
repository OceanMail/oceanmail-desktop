# Tranche 3 save-state

> **Status: Historical implementation evidence; partially superseded.** This
> file was originally maintained in place as a Tranche 3 checkpoint. It is
> retained as a record of what that tranche built, not as current product
> authority. See `TRANCHE3_CORRECTION_NOTES.md` for the subsequent shell
> correction sequence and `MAIL_MODEL_CORRECTION.md` for the current
> implementation-level Mail model.

> **Superseded in part** by the native-Thunderbird-shell correction
> (`../../docs/decisions/0007-native-thunderbird-shell.md`; implemented in
> `feature/oceanmail-desktop-alpha-experience` after this file was written).
> Items **1, 6, and 7** below describe the custom-rail/wrapped-compose design
> that was rejected in review and has since been replaced. The remainder is
> preserved as dated implementation evidence and must be reconciled against
> later implementation records before being treated as current.

Branch: `feature/oceanmail-desktop-alpha-experience`, created fresh from
`origin/main` at `8135b7710e0147a93a65906667b9027a064339c0` (not built on top
of the Tranche 2 branch, per instruction). Tranche 2 (PR #5) is the baseline
this branches from and is not re-touched here except as read-only reference.

Station repo (`oceanmail-station`) remains read-only/authoritative and was
not modified, redesigned, or committed to in this tranche. All new Station
API gaps discovered while building the Available/Outbox/Dashboard views are
recorded in `docs/STATION_API_CONTRACT_GAPS.md` rather than worked around
with invented client-side behavior.

GUI testing note (environment-specific, not a product finding): unrelated overlay windows interfered with input focus during verification.
Synthetic clicks sent to raw screen coordinates without first explicitly
raising/focusing the Thunderbird window (`window.raise_window()` +
`set_input_focus()` via python-xlib, then `XTestFakeInput`) were silently
swallowed by that overlay for elements in the affected screen region, even
though `import -window <id>` screenshots always showed correct OceanMail
content (it reads the window's own pixmap directly, independent of stacking).
Explicitly raising and focusing the target window before every synthetic
click resolved this completely — confirmed by then successfully exercising
the checkbox/select/status-pill/rail-item/emergency-button interactions that
had previously appeared unresponsive. This was a test-tooling artifact of
this specific shared desktop session, not a defect in the extension.

## Done — everything below is committed

1. **Application shell** (`extension/space/index.html`, `space.css`,
   `space.js`): persistent collapsible primary rail (Mail / Calendar
   [future] / Contacts [future] / Chat [future] / Station), a pinned
   Emergency entry point, a Settings footer entry, a Mail-only subnav
   (Inbox/Available/Outbox/Sent/Drafts/Compose), and a persistent topbar
   status pill. Dark/light theme via CSS custom-property tokens
   (`prefers-color-scheme` + explicit override, matching the pattern used
   elsewhere in this project) plus a nav-collapse toggle and a Compact/Watch
   mode toggle, both persisted via `extension/space/lib/preferences.js`
   (backed by `browser.storage.local`, the one new permission this tranche
   adds — see "Experiment APIs" below).
2. **Native Mail reuse, unchanged from Tranche 2's approach**: Inbox opens
   Thunderbird's own native folder via `mailTabs.create`, Compose opens
   native `compose.beginNew` — no reimplemented message list or reader.
3. **Available OMail planner** (`extension/space/models/available-planner.js`,
   12 tests): a pure, DOM-free model — row selection, per-row attachment
   representation choice, priority, hold/resume, drag-free reordering
   restricted to the selected set, and fail-closed budget/credit math (a
   selection that would exceed included budget without approved credit is
   rejected, never silently allowed). No automatic "small messages get
   retrieved for free" threshold — every body requires explicit selection,
   per instruction. Rendered by `views/available-view.js` against
   `fixtures/available-fixtures.js`, clearly marked `DEMO DATA` in the UI
   because `oceanmail-station` has no Available/manifest endpoint yet.
4. **Outbox / transfer view** (`models/outbox-model.js`, 10 tests): maps
   Station's real `/api/v1/queues/outbound/history` evidence to truthful
   lifecycle states — `present_in_postfix` → "queued",
   `left_postfix_at_unix` set → "transmitted" (never "delivered": local
   Postfix handoff is not confirmed remote receipt), otherwise "unknown".
   `confirmedReceiptAtUnix` is always `null` for real rows since Station
   exposes no receipt-confirmation signal. Incoming rows are fixture-only
   (`fixtures/outbox-fixtures.js`, `DEMO` badge) because Station has no
   incoming/receive queue at all. Mutating actions (cancel/hold) are
   disabled on real rows because Station's own reported
   `capabilities.queue_mutation` is `false`.
5. **Dashboard** (`models/dashboard-model.js`, 8 tests), opened from the
   status pill: real Station health/station/observer/storage-security data
   where reachable; Grid freshness, send/receive budgets, and
   regional/operational data version are rendered as explicit gap notices
   (never a fabricated value, never zeroed-out in a way that could be
   misread as "no work / all clear"). All real Station-derived strings are
   passed through `escapeHtml()` before `innerHTML` interpolation
   (`views/dashboard-view.js`) — audited, no unsafe interpolation of
   untrusted data.
6. **Persistent status bar**: real Station reachability (polled every 30s)
   combined with this device's own `navigator.onLine`, rendered as distinct
   dots/labels rather than one collapsed "connected" boolean, with wording
   ("no contact yet" / "queued" / "unreachable") intended to avoid implying
   real-time confirmation the client doesn't have.
7. **Emergency** (`views/emergency-view.js`): a truthful alpha surface. No
   backend Emergency submission exists (`oceanmail-station` has no accepted
   Emergency API — tracked in `STATION_API_CONTRACT_GAPS.md`), so this does
   not fake prioritized delivery. Selecting a situation template opens a
   real native `browser.compose.beginNew()` window pre-filled with an
   EMERGENCY-marked subject, the required safety disclaimers, and an
   explicit "POSITION: UNKNOWN" placeholder (never silently omitted). Does
   not add any generic emergency override to Available OMail retrieval.
8. **Watch/Compact mode** (`views/watch-view.js`): a single-column,
   high-value-only tile layout (Station, Internet, Available count, Outbox
   queue, OChat placeholder) as a first-alpha foundation, not a pixel-final
   design.
9. **Accessibility**: `aria-label`s on select controls tied to their row's
   subject, `aria-pressed` on Emergency template buttons, checkbox targets
   widened via a padded `<label>` wrapper (both a real hit-target
   improvement and incidentally what surfaced the click-routing issue
   above), status/priority conveyed via text and badges, not color alone.
   Keyboard reachability was exercised via Tab/Shift+Tab during this
   session but not exhaustively audited against a screen reader — see
   "Unfinished" below.
10. **Cross-platform**: no OS-specific code added anywhere in
    `extension/space` or `extension/station` (verified: no `node:fs`,
    `node:path`, or `process.platform` references in either directory); the
    one manifest change is the `storage` permission, a standard
    WebExtension permission with no OS-specific behavior.
11. **CI matrix** (`.github/workflows/oceanmail-desktop.yml`): the pure-Node
    unit test suite (`npm test`) now runs across `ubuntu-latest`,
    `windows-latest`, and `macos-latest` without downloading or running
    Thunderbird anywhere in that matrix. `web-ext lint` remains
    Ubuntu-only: it shells out to `npx` without `shell: true`, which is a
    known Windows portability risk (`.cmd` shim resolution) that was not
    verified on an actual Windows runner in this session, so the matrix was
    scoped to what could be verified as portable rather than guessed at.
12. **Tests**: 54/54 passing (`node --test` from `extension/`), 12 new for
    the planner, 10 for the Outbox model, 8 for the Dashboard model, 8 for
    `lib/freshness.js`, 7 for `lib/preferences.js`; all 9 Tranche 2
    `station-client.test.js` tests still pass unchanged. `web-ext lint`:
    17 warnings (all audited — either safe `innerHTML` use with
    `escapeHtml()`-wrapped or non-string interpolation, or expected
    `UNSUPPORTED_API` notices for Thunderbird-only APIs the linter doesn't
    recognize), 1 tolerated error (unchanged `MANIFEST_FIELD_PRIVILEGED` on
    `/experiment_apis`, documented since Tranche 2), 0 untolerated errors.

## Experiment APIs

No new Experiment API surface was added. The Tranche 2
`experiment/implementation.js` (native account bootstrap) is unchanged. This
tranche's one new manifest permission is `storage` (standard WebExtension
`browser.storage.local`, used only for `nav-collapsed` / `watch-mode`
preference persistence) — not a privileged capability and not something that
needed justification beyond "this is what browser.storage.local is for."

## Architecture/design escalation

None. Every place this tranche could not deliver a real backend behavior
(Available/manifest, Emergency submission, budgets, queue mutation, Grid
status, regional data version) is a Station API gap already anticipated by
`docs/design/*.md` and now tracked concretely in
`STATION_API_CONTRACT_GAPS.md`, not a product-semantics question needing a
decision from project lead.

## Unfinished / not verified this tranche

- Screen-reader-specific accessibility testing (e.g. NVDA/VoiceOver/Orca)
  was not performed — only keyboard-Tab reachability and ARIA attribute
  presence were checked.
- Calendar/Contacts/Chat rail entries render a "future" placeholder panel
  only; no functionality behind them, per the Tranche 3 scope.
- `web-ext lint`'s Windows portability for the `npx` shell-out in
  `scripts/lint.mjs` was not fixed or verified; the CI matrix reflects this
  by keeping `lint` Ubuntu-only rather than guessing it would pass elsewhere.
