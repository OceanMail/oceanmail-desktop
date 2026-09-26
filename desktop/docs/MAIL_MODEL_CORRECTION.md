# Mail-model correction — account-scoped Mail, no user-facing Outbox

Second correction pass on PR #7, on top of the native-Thunderbird-shell
pivot recorded in `TRANCHE3_CORRECTION_NOTES.md`. This is the current,
authoritative description of the Mail information architecture; keep it
updated in place rather than appending a third parallel notes file.

## local verification workstation live-defect correction pass

The first successful live verification (local verification workstation, Debian/KDE, pinned
Thunderbird 140.14.0esr, real two-account SMTP/IMAP lab) confirmed the
architecture and truthfulness work in this file, but found five live
defects not visible from code review alone. All five are fixed here.

### 1. Startup initialization was event-lazy (blocker)

**Symptom:** on a fresh/cold `dev-launch.sh` launch, Station, Emergency,
Available, and the "OceanMail Status" column were all absent — waiting
10+ minutes did not fix it, but opening New Message did.

**Root cause**, confirmed by reading the pinned build's own extension-
lifecycle manager (`toolkit/content/extensions/parent/ext-backgroundPage.js`):
on `APP_STARTUP`, Thunderbird only starts an MV3 background page
immediately if it is persistent, has no persisted listeners yet, or has a
registered `runtime.onStartup` listener. Once this extension had run once,
its `composeAction.onClicked`/`compose.onComposeStateChanged` listeners
became "persisted listeners"; with no `onStartup` listener, Thunderbird then
only *primed* (never started) the background on the next cold launch,
waking it lazily whenever one of those OTHER listeners fired — exactly what
opening a compose window did.

**Fix:** `background.js` now has one idempotent `initializeOceanMail()`
(spaces -> accounts -> account ids -> Saved folders -> native-folder sync,
in that order, each step already independently idempotent) called both
unconditionally at top-level module evaluation (covers install/reload/
enable, which always starts the background regardless of `onStartup`) and
via a registered `browser.runtime.onStartup` listener — the one signal this
lifecycle manager explicitly treats as startup-blocking. Not a timer, not
more polling: `runtime.onStartup` is a real, documented, purpose-built
WebExtension event for exactly this problem. The existing 10s
`syncMailFolders` interval remains, but only as a defense against
Thunderbird rebuilding the folder tree AFTER initialization — never a
substitute for reliable initialization itself.

### 2. Cards View hides the "OceanMail Status" column (UX blocker)

**Symptom:** the column worked in Table View but appeared to be simply
missing in Cards View, Thunderbird's own default — and the Sent banner
unconditionally claimed the column "shows delivery status inline" even
when it plainly could not.

**Root cause**, confirmed by reading `about3Pane.js`: `mail.threadpane.
listview` (Cards=0, Table=1) is a single GLOBAL int pref with no per-folder
override anywhere in this build, and Cards view's card template
(`ThreadPaneColumns.getDefaultColumnsForCardsView`) is a fixed field list
that doesn't include custom columns — or even the native `priorityCol` —
regardless of what's configured in Table view. There is genuinely no
supported per-folder Cards/Table mechanism to exploit here, and forcing
Table view globally was explicitly ruled out (it would affect any unrelated
account sharing the profile).

**Fix:** the Sent banner — which lives outside the thread-pane's Cards/
Table row rendering entirely, so it is visible in both modes regardless —
is now the reliable, always-present, view-mode-independent way to see
delivery status; its "View Sent details" button (renamed from "View
OceanMail Sent details") was already exactly this, just under-promoted.
Its label now reads Thunderbird's real `mail.threadpane.listview` value
(read-only, never mutated) and states plainly whether the inline column is
actually showing in the CURRENT mode, instead of asserting it unconditionally.

### 3 & 4. False "authorized"/"currently-running" wording

- Any text describing a Station-related surface as "authorized" was false:
  the current Station API is loopback-only with no authenticated or
  permission-scoped boundary at all. Fixed in `views/sent-status-view.js`,
  `views/station-view.js`'s neighbor doc, `STATION_API_CONTRACT_GAPS.md`,
  and this file — replaced with "Station-wide operational surface" plus an
  explicit statement that authenticated/permission-scoped Station API
  access is not yet implemented.
- `views/station-view.js` claimed the panel "calls a real, currently-running
  `oceanmail-station` instance", which read as an assumption rather than a
  live check — verification workstation saw this text while Station was unreachable. Fixed to
  "calls a real `oceanmail-station` instance when one is available at the
  configured loopback address", with the honest unreachable-state reporting
  preserved unchanged below it.

### 5. Native Thunderbird "Local Folders" visibly exposed its own Outbox

**Symptom:** a fresh/restarted OceanMail profile showed `Local Folders >
Trash, Outbox` in the folder pane — Thunderbird's own native Local Folders
Outbox, not the removed OceanMail Outbox model, but indistinguishable from
a user-facing Outbox to a user, and the accepted product model has none.

**Fix:** confirmed by reading `about3Pane.js` that Thunderbird already has
a supported, native, per-profile toggle for exactly this —
`folderPane.hideLocalFolders`, backed by the same real, persisted XULStore
mechanism (`folderPaneLocalFolders` `hidden`) already used elsewhere in
this codebase (the column-visibility work above). `experiment/mail-
folders.js`'s new `ensureLocalFoldersHidden(win)` writes that XULStore
value directly (idempotent, checked against the real persisted value) and,
when the window's `folderPane` is already live, also sets the in-memory
property for an immediate effect in the current session — the exact same
pair of writes Thunderbird's own `toggleLocalFolders()` command handler
performs. This never deletes, disables, or corrupts the Local Folders
account/server itself (Thunderbird can still use it internally; a user can
still reach it via Account Settings) — it is only removed from the visible
folder-pane tree, and XULStore is profile-scoped exactly like `prefs.js`,
so a separate stock Thunderbird profile/installation is never touched.

### Observed, not a blocker: one-time IMAP password prompt

verification workstation's fresh profile prompted once for Bob's IMAP password; after storing
it, the prompt did not recur across a restart. Recorded as observed
behavior only — not investigated further, not a merge blocker, and
deliberately not broadened into a credential-management redesign.

## Second final correction pass (native-column truthfulness/scoping, Important Stage 3, native-shell cleanup)

Project-lead review of HEAD `e96394b` accepted every correction below this
section (account scoping, Sent privacy, Available reorder, Saved position,
listener cleanup, Decision 0009's Priority removal) and required four more
narrow fixes, all now applied:

1. **Removed subject-keyed fake delivery state from the native Sent
   column.** `experiment/mail-folders.js` used to special-case a real Sent
   message whose subject exactly matched a small hard-coded demo table
   (with `ship@station.test`/`bob@station.test` baked into product
   integration logic), showing e.g. `Delivered (demo)` for it. Rejected: a
   `(demo)` suffix does not make message-level evidence true, and it let a
   genuine real message display fabricated status merely by sharing a
   subject with a fixture. Deleted outright — `sentStatusText()` now shows
   exactly the same truthful `"Status unavailable — no Station message
   correlation"` for every real message in an OceanMail account's Sent
   folder, with no exceptions and no lab-account addresses hard-coded
   anywhere in this file. Rich demo lifecycle states remain available only
   in the explicitly fixture-owned Sent-details page
   (`views/sent-status-view.js`).
2. **The native "OceanMail Status" column is now hidden by default
   globally.** `ThreadPaneColumns.addCustomColumn()` registers a column
   into Thunderbird's global default column set — `hidden: false` meant an
   unrelated account/folder with no persisted column layout could display
   an empty OceanMail column even though the callback returns blank for it.
   Registered with `hidden: true` instead; `setSentColumnVisibility(account,
   true)` (renamed from `ensureSentColumnVisible`) explicitly grants
   visibility only for the real Sent folders of the exact OceanMail
   accounts `syncFolders()` was given, by merging `visible:true` into that
   folder's own real, persisted `columnStates`. On `onShutdown`,
   `setSentColumnVisibility(account, false)` now removes that
   extension-owned entry from every known OceanMail account's Sent folder
   entirely (not just setting `visible:false`) before unregistering the
   global column, so a stock-Thunderbird uninstall/disable of OceanMail
   leaves no residue in any folder's saved layout.
3. **Important Stage 3 is now implemented**, not deferred. See "Important
   interoperability" below for the full mapping; in short: a new
   `compose_action` toolbar button ("Mark Important") in the compose
   window, backed entirely by the public `compose.getComposeDetails`/
   `setComposeDetails` APIs (`priority: "high"` <-> `"normal"` — the same
   conventional email header a real client would set, no proprietary
   OceanMail field). `space/lib/importance.js`'s `normalizeImportance()`
   gained a `{nativePriority}` input shape mapping Thunderbird's real
   `none|lowest|low|normal|high|highest` priority scale onto the three
   OceanMail states, with real metadata always winning outright over the
   Stage-1 fixture field (never merged). For the Sent/Inbox *list* display
   side, Thunderbird's own native `priorityCol` (already a real column
   driven by the message's real stored priority — no custom code needed to
   compute it) is now made visible for both folders on every OceanMail
   account via the same `columnStates` mechanism as item 2, never reversed
   on cleanup since it is stock Thunderbird state, not OceanMail-owned.
4. **Native-shell cleanup (Decision 0007).** `mail.chat.enabled=false` is
   now set in `scripts/dev-launch.sh`'s profile-scoped `user.js` — a real,
   documented Thunderbird preference (confirmed in `chat/chat-messenger.js`
   and `preferences/preferences.js`) that hides the native Chat
   Spaces-toolbar button and its Preferences pane, not a DOM-mutation
   chrome hack, and not the fragile `oceanmailChrome` bridge pattern this
   project already rejected once. No equivalent preference was found for
   hiding just the native Tasks Space without also hiding Calendar — left
   visible, documented as a gap (see Escalation) rather than building a new
   chrome-mutation bridge to force it. Address Book -> Contacts relabeling
   was not attempted this pass (requires live verification this pass
   couldn't complete — see item 5 of the review and "Live verification"
   below); documented as a non-blocking cosmetic gap per the review's own
   escape hatch.

## Final correction pass (account scoping, Saved position, native Sent column, listener cleanup)

A further project-lead review round found the account-scoping, Saved
placement, Experiment-listener cleanup, and Sent-augmentation approach all
still needed correction after the Priority-model correction below. This
section is the current, authoritative description of those fixes.

### Account scoping

`oceanmailMailFolders.syncFolders()` and `background.js`'s
`ensureSavedFolders()` used to treat "every non-local, non-IM Thunderbird
account" (or, for Saved, literally every account `browser.accounts.list()`
returns) as OceanMail. In a profile with an unrelated Gmail/other IMAP
account — plausible for portability testing in stock Thunderbird — that
would have injected an Available row and created a Saved folder under an
account that has nothing to do with OceanMail. Fixed: `background.js` now
collects the exact account ids `oceanmailAccounts.ensureAccount()` returned
(`oceanMailAccountIds()`) and passes that list into both
`ensureSavedFolders(accountIds)` and `oceanmailMailFolders.syncFolders(
oceanmailAccountIds)`; both now filter to exactly that id set and touch
nothing else. "OceanMail-ness" is never again inferred from generic
IMAP-ness.

### Saved's folder-tree position

The accepted hierarchy is `Inbox, Available, Saved, Drafts, Sent`. Saved is
still a real IMAP folder (`browser.folders.create()` — its storage/IMAP
semantics are unchanged), but Thunderbird appends a newly-created folder
wherever its own folder-tree ordering logic puts it, not necessarily right
after Available. `experiment/mail-folders.js`'s `positionAvailableAndSaved()`
now repositions the *existing* Saved folder-tree row (a plain DOM move —
`existingRow.after(existingRow)` — on the row Thunderbird already created
and manages) to sit immediately after Available's row, re-checked on every
sync pass since the real Saved row may not exist yet the first few passes
(IMAP folder creation and folder-tree sync are both asynchronous).

### Experiment listener cleanup

`wireSelectListener()`'s `select` handler was anonymous, so `onShutdown()`
could remove the DOM nodes and the `dataset.oceanmailWired` marker but could
never actually un-register the listener itself — a reloaded extension would
accumulate one duplicate handler per reload. Fixed: the handler is now a
named function stored directly on the `folderTree` element
(`folderTree._oceanmailSelectHandler`), and `unwireSelectListener()` (called
from `onShutdown()`) explicitly calls `removeEventListener` with that same
reference before deleting it. This is a deterministic code-level fix, not
just an assertion — the stored reference is exactly what
`addEventListener`/`removeEventListener` require to match.

### Native "OceanMail Status" Sent-list column

Confirmed by reading the pinned `thunderbird-140.14.0esr` build's own
`chrome/messenger/content/messenger/ThreadPaneColumns.mjs`: this build
exports `addCustomColumn`/`removeCustomColumn`/`refreshCustomColumn`, a real,
supported mechanism for registering a global custom Thread-pane column with
a `textCallback(msgHdr)`. Per the project-lead correction ("prefer native
Sent status over the banner→overlay compromise... if `ThreadPaneColumns...`
exists there, use a narrow Experiment to add an `OceanMail Status` column"),
`experiment/mail-folders.js` now registers exactly this column once
(`ensureStatusColumn`), scoped by construction to OceanMail accounts' real
Sent folders only — `sentStatusText(msgHdr, accountsByServerKey)` returns
`""` for every other message, so the column renders blank everywhere else in
Thunderbird.

Truthfulness for a REAL Sent message: Station's outbound-queue evidence has
no Message-ID-style key to correlate a specific Sent message with a specific
queue-history entry (unchanged limitation, `STATION_API_CONTRACT_GAPS.md`).
`sentStatusText` therefore never invents per-message status for a real
message — it always returns `"Status unavailable — no Station message
correlation"`. The one exception: a message whose subject exactly matches a
small, hand-maintained demo table
(`DEMO_SENT_STATUS_BY_ACCOUNT_AND_SUBJECT`, mirroring
`fixtures/sent-status-fixtures.js` — an Experiment script cannot `import` a
moz-extension:// ES module, so this is a deliberate, documented, manually-
synced duplication) shows that demo status text suffixed `"(demo)"`. This
lets a genuinely-sent lab test message (composed and sent through the real
lab, never injected by this Experiment) prove the column's UX truthfully,
without ever creating a fake `nsIMsgDBHdr`.

Because `addCustomColumn`'s `textCallback` runs for every message row
Thunderbird renders anywhere `DEFAULT_COLUMNS` is consulted — not just
OceanMail's own folders — the callback is wrapped in its own `try/catch`
that swallows and returns `""` on error, so a bug in this Experiment can
never break message-list rendering elsewhere in Thunderbird.

A newly-registered column only shows up automatically on a folder that has
*never* had a column layout saved (`about3Pane.js`'s
`restoreColumnsState()`); every already-viewed Sent folder (all of the lab
accounts used for prior verification) has one, and would otherwise leave
the column present-but-hidden until the user manually enabled it via the
column picker. `ensureSentColumnVisible(account)` fixes this by merging
`visible: true` for our column id into that folder's real, persisted
`columnStates` property (the same property Thunderbird itself reads/writes)
— never touching any other column's saved state. Known rough edge: if the
Sent folder is already the currently-selected/open folder at the moment
this runs, the change is not visually live until the user re-selects it
(Thunderbird only calls `restoreColumnsState()` on selection) — acceptable
for this alpha, not worth a deeper chrome hook to fix.

The banner + overlay mechanism (`ensureSentBanner`) is kept, but demoted to
a secondary "View OceanMail Sent details" link into the fuller demo page
(`views/sent-status-view.js`, with the Important indicator and evidence
detail) rather than the primary way to see status at all — the native
column is now that. Not deleted outright because a fixed, tested, useful
page with no remaining click-path into it would be dead code; keeping a
minimal secondary entry point avoids that without re-introducing the
banner-as-primary-mechanism the correction moved away from.

## Priority-model correction (supersedes 0.1 Priority/Normal scheduler bands)

A later amendment to this correction removed user-selectable transport
Priority entirely. This section is the current, authoritative description;
it supersedes the 0.1-era `Emergency`/`Priority`/`Normal` OMail classes and
any reference to them elsewhere in this document's history is superseded by
what follows (the 0.1 documents themselves are not rewritten).

**There are now only two user-originated transport concepts:**

- **Emergency** — unchanged: a distinct transport class with its own
  workflow (`views/emergency-view.js`), highest scheduling precedence, and
  the previously accepted quota/accountability/safety behavior. It remains
  the *only* user-originated thing that changes transport precedence.
- **Important** — new: ordinary message *metadata*, not a transport class.
  It may affect display, sorting/filtering, and later notification
  behavior, but it MUST NOT change RF scheduling order, Station transport
  precedence, consume a priority quota, let a sender jump ahead of another
  user's ordinary traffic, affect relay precedence, or be purchasable with
  credits. Rendered as a plain ★ via the normalization adapter
  (`lib/importance.js`) in both the Sent-status view and Available view;
  real Station-derived Sent rows always normalize to `state: "unknown"`
  since Station carries no such evidence and this model never invents one.
  See "Important interoperability" below for the full model.

There is no third "Priority" option anywhere any more. `Available`'s
recipient-selected retrieval order (`models/available-planner.js`'s
`setOrder`/`selectedBodyOrder`) is unaffected and is *not* a renamed Priority
— it was always a distinct concept (a recipient's own retrieval preference)
and remains one; the planner's separate per-message `priority` field
(`normal`/`priority`, with a `setPriority` mutator) has been removed outright
rather than kept alongside it, since that field *was* exactly the
now-removed user-selectable transport Priority, just applied to incoming
retrieval instead of outgoing submission.

**Historical Station scheduling hierarchy (superseded 2026-09-21)** — formerly recorded as
`docs/decisions/0009-ordinary-mail-scheduling-and-importance.md` (Decision
0009, accepted; replaces the 0.1 Priority/Normal bands). Summary:

1. Emergency traffic — always highest, may preempt lower bands.
2. This Station's own vessel/crew traffic — local accounts' outbound OMail
   and Available retrieval work; fair-scheduled with age protection and
   account fairness, no user-selectable Priority within this band.
3. Required control/receipt/system/Grid coordination — kept small and
   operationally necessary, never a loophole for ordinary payloads.
4. Relay traffic for other Stations — existing Eager/Reluctant relay
   semantics, scheduled after bands 1–3.
5. Background system/regional/jurisdiction/firmware data — lowest priority,
   preemptible, resumable, deferred whenever bands 1–4 need the link.

Current scheduling authority is [Project ADR-008](https://github.com/OceanMail/oceanmail-project/blob/main/docs/decisions/ADR-008-four-band-scheduling-and-channel-use.md): Band 0 Emergency and its control; Band 1 control/manifests/Grid coordination and Server-promoted urgent updates; Band 2 local/relay ordinary payload; Band 3 shared background broadcasts. Initial Band 1 policy is four minutes per ten-minute lease after necessary route establishment; Band 2 uses the remainder and Band 3 has no reservation. The numbered hierarchy above and display-to-band comparison below are historical descriptions, not current scheduling requirements.

This is Station-side scheduling policy; OceanMail Desktop implements none of
it. `models/sent-status-model.js`'s `sortForDisplay` reflects only the part
of this hierarchy Desktop can see and display truthfully today: Emergency
rows sort first, everything else (Station's real "unclassified" rows and
fixture "ordinary" rows) shares one band ordered oldest-first — a *display*
approximation of band 1 vs. band 2, not an implementation of bands 3–5,
which Desktop has no visibility into and does not attempt to model.

`sent-status-model.js`'s `SentStatusRow.transportClass` now has exactly three
values: `"emergency"`, `"ordinary"`, and `"unclassified"` (real Station rows,
since Station's `OutboundQueueHistoryJob` evidence exposes no transport-class
field at all yet — never guessed as `"ordinary"`). The old `messageClass`
field and its `"priority"`/`"normal"` values are gone, along with the
Sent-status view's disabled Priority `<select>` and the "user-initiated
reprioritization" contract gap it stood on (`STATION_API_CONTRACT_GAPS.md`)
— there is nothing left to reprioritize once Priority itself is removed.

Old assumptions removed from:
- **UI**: `views/available-view.js`'s Priority column/select (replaced with explicit Move up/down reorder controls plus a read-only Important ★ indicator); `views/sent-status-view.js`'s Priority column/select (replaced with a read-only Important ★ indicator via the normalization adapter).
- **Models**: `models/available-planner.js`'s `priority` field/`setPriority`/`VALID_PRIORITIES` (removed outright; `moveSelected()` added for explicit reordering); `models/sent-status-model.js`'s `messageClass` (renamed `transportClass`, values reduced to emergency/ordinary/unclassified) and `CLASS_BAND` (Priority band removed).
- **Fixtures**: `fixtures/available-fixtures.js`'s per-row `priority` field (removed; a Stage-1 `important` compatibility field added to a couple of rows instead — see "Important interoperability"); `fixtures/sent-status-fixtures.js`'s `messageClass: "priority"` rows (now `transportClass: "ordinary"` with an explicit `important` flag, matching the amendment's own worked example).
- **Tests**: `available-planner.test.js`'s `setPriority` test (replaced with a test asserting the row view carries no `priority` field at all, plus `moveSelected`/Important-non-effect tests); `sent-status-model.test.js`'s Priority-band sort tests (replaced with Emergency-vs-everything-else tests plus tests proving `important` never affects sort order, including against Emergency specifically).
- **Docs**: this file, and `STATION_API_CONTRACT_GAPS.md` (Priority-referencing rows reworded/marked superseded; the Important-persistence row removed per project-lead instruction not to classify Important as a Station gap — see "Important interoperability" below instead).

## Supersession note

This supersedes the 0.1-era decision that `Outbox` was a first-class user
Mail destination (see `docs/decisions/*` at the repo root for the formal
0.2 decisions — 0007 native shell, 0008 account-scoped Available/icons).
Historical 0.1 documents describing Outbox as a user mailbox destination
are **not rewritten** — this file and the 0.2 decision docs are where the
supersession is recorded. The underlying reason: once a user submits a
message, OceanMail Desktop hands it to Station essentially immediately;
Station then owns queueing, scheduling, retries, transport attempts, and
all delivery/receipt evidence. A separate Desktop-owned "Outbox" implies
Desktop still owns that job, which is false after submission. The user's
own `Sent` folder is instead augmented with Station-derived delivery
status — the message copy and its delivery status belong together.

## Final per-account Mail hierarchy

```text
<Account>
  Inbox
  Available   (OceanMail pseudo-folder — see below)
  Saved       (real IMAP folder, positioned immediately after Available)
  Drafts
  Sent        (real IMAP folder, augmented with a native delivery-status column)
```

No user-facing Outbox anywhere. Station retains its own vessel-wide
Queue/Traffic surfaces separately (the existing Station native-Spaces
destination) — that is Station-manager territory, not a per-user mailbox
concept, and Desktop implements none of that business logic.

## What each piece is, concretely

- **Available** (`experiment/mail-folders.js`): one pseudo-folder row per
  OceanMail account, inserted directly under that account's Inbox row in
  the native folder pane. No backing `nsIMsgFolder`, no `.uri` — clicking it
  loads `space/index.html?page=available&account=<email>&accountName=<name>`
  into a content area the Experiment API manages inside the native 3-pane
  (reusing the same grid area Thunderbird's own Account Central uses, under
  a different CSS class so real Account Central is never touched). Backed
  by `models/available-planner.js` (unchanged) and per-account fixtures in
  `fixtures/available-fixtures.js`.
- **Saved** (`background.js` `ensureSavedFolders(accountIds)`): a real IMAP
  subfolder named "Saved" created via the public `browser.folders.create()`
  API for each explicit OceanMail account that doesn't already have one —
  never for any other account in the profile. No Experiment API involvement
  for creation — it's genuine mailbox storage, so native move/drag, quota,
  and sync all work for free; `experiment/mail-folders.js` separately
  repositions its folder-tree row to sit right after Available (a DOM move
  only, never touching IMAP storage — see "Saved's folder-tree position"
  above). The "explicit retention flag" concept from the correction spec has
  no backend representation yet (see `STATION_API_CONTRACT_GAPS.md`); moving
  a message into Saved is this alpha's only implemented retention mechanism.
- **Sent** (native, unmodified message list; `experiment/mail-folders.js`'s
  native "OceanMail Status" column + secondary banner link +
  `views/sent-status-view.js`): the real native Sent folder and its message
  list are never replaced. A registered Thunderbird custom column
  ("OceanMail Status") shows truthful delivery-status text inline for
  OceanMail accounts' own Sent messages (see "Native 'OceanMail Status'
  Sent-list column" above for the full truthfulness rule). A small banner
  (unchanged mechanism, demoted to secondary) still offers "View OceanMail
  Sent details", opening the same kind of content overlay Available uses —
  `space/index.html?page=sent&account=<email>&accountName=<name>` — with a
  generic "← Close" button (shared with Available, not Sent-specific) that
  returns to the native thread pane. Backed by `models/sent-status-model.js`
  (renamed from `outbox-model.js` — same tested evidence semantics, e.g.
  `left_postfix_queue` is still never `transmitted`) and per-account
  fixtures in `fixtures/sent-status-fixtures.js`. That page now shows ONLY
  this account's fixtures — see "Sent account privacy fix" below.

## Sent account privacy fix

`views/sent-status-view.js` used to fetch Station's real, vessel-wide
`/api/v1/queues/outbound/history` and merge those rows into a single
account's Sent-status view, with a "Contract gap" badge noting they weren't
actually filtered to that account. Project-lead review correctly identified
this as an account-privacy violation, not a disclosed limitation — it leaked
every other account's outbound traffic metadata into one account's own
Sent-status view. Fixed: this view now shows *only* this account's fixture
rows and states plainly that real per-account delivery evidence isn't
available yet; the real Station fetch/merge is gone entirely from this file.
Vessel-wide real Station evidence remains available exclusively from the
Station-wide operational surface (`views/watch-view.js`), which legitimately
shows unfiltered vessel-wide data because it isn't scoped to (or presented
as) any one user's own mailbox — not because that surface is "authorized"
in any access-control sense. verification workstation live-verification correction: the current
Station API is loopback-only with no authenticated/permission-scoped
boundary at all, so calling any current surface "authorized" is false;
fixed everywhere this wording appeared (this file, `STATION_API_CONTRACT_
GAPS.md`, `views/sent-status-view.js`). Authenticated Station API access
remains its own tracked, not-yet-implemented gap.

## Multi-account lab

`desktop/lab/mail-lab/Dockerfile` and `scripts/start-mail-lab.sh` now
provision two IMAP/SMTP users — `bob` and `ship` (both `@station.test`,
password `oceanmail-lab`, matching the existing lab-only convention) — and
`background.js` provisions both as native Thunderbird accounts (Ship made
default) via the unchanged `oceanmailAccounts` Experiment API. This is what
makes the multi-account isolation proof (screenshots) real rather than
simulated: two real IMAP accounts in one profile, each with its own real
Inbox/Drafts/Sent and its own Available pseudo-folder/Sent-status fixtures.

## Icons

Replaced the fixed-color blue-circle SVGs with monochrome assets:

- `icons/spaces-station-{light,dark}.svg`, `icons/spaces-emergency-{light,dark}.svg`
  — used via `spaces.create()`'s `themeIcons` (the documented public
  mechanism for Spaces-button light/dark variants; `defaultIcons` alone
  doesn't adapt to theme).
- `icons/folder-available.svg` — set directly as the pseudo-row's `<img
  class="icon">` src. Uses a fixed medium-gray stroke rather than true
  `currentColor`/theme adaptation: Gecko's `context-fill` convention (used
  by Thunderbird's own bundled icons) is not reliably available to
  extension-supplied SVGs loaded this way, and building a
  `mask-image`-based solution would need the icon to be a separate styled
  element rather than the row's own `<img>`. This is a known, documented
  simplification, not a silent gap — native folder icons themselves are
  mostly static-color too (Sent/Junk/Trash glyphs don't invert with theme
  either), so the visual mismatch is minor.
- `icons/folder-sent-status.svg` — same treatment, used on the Sent-status
  banner's button rather than a folder row (Sent itself keeps its own
  native icon; no pseudo-row for it).

## Experiment API surface, current state

- `oceanmailAccounts` (`experiment/schema.json` /
  `experiment/implementation.js`) — unchanged since Tranche 2: one
  operation, idempotent native IMAP/SMTP account provisioning.
- `oceanmailMailFolders` (`experiment/mail-folders-schema.json` /
  `experiment/mail-folders.js`) — one operation, `syncFolders(
  oceanmailAccountIds)`, taking the exact explicit OceanMail account id list
  (never inferred). Scoped, per those accounts only, to: insert/maintain the
  Available pseudo-row, reposition the real Saved row after it, register/
  refresh the native "OceanMail Status" Sent-list column and keep it visible
  on those accounts' real Sent folders, wire folder-tree selection handling
  (Available pseudo-row + the secondary Sent-details banner), and manage the
  one shared content-overlay browser used by both Available and the
  Sent-details page. Full cleanup (`onShutdown`) removes every DOM node it
  added, explicitly un-registers the named `select` listener via the exact
  function reference stored on `folderTree` (fixed — previously anonymous
  and un-removable), and unregisters the custom column.
- `oceanmailChrome` — **removed entirely** (not just unused). It renamed
  the native Mail/Chat Spaces buttons to "OceanMail Mail"/"OChat"; per
  instruction, Mail correctly stays "Mail" inside a dedicated OceanMail
  application, and Chat must not claim to be OChat before OChat exists.
  Its files are deleted, not left dead in the tree.

## Top-level native Spaces toolbar after this pass

Native, untouched: Mail, Address Book, Calendar, Tasks, Chat, Settings.
OceanMail-added: Station, Emergency. No Available, no Outbox, no Sent —
those are account-scoped and live in the folder pane / native Sent folder
as described above.

## Live verification (real Thunderbird, two real IMAP accounts)

**This pass's changes (native-column truthfulness/scoping fixes, the
compose_action Important toggle, native `priorityCol` visibility,
`mail.chat.enabled=false`) have NOT been live-verified.** The Thunderbird
launch hang reported after the previous correction pass was re-tested in a
fresh session/container (lab restarted, a completely clean X session with
no other GPU/desktop load) and reproduced identically — confirming this is
a stable environment limitation of launching this Thunderbird binary in
this sandbox, not transient state left over from an earlier crash. The X
display/window manager itself is healthy (verified live: `xclock` opens and
maps normally in the same session). Per the review's own item 5, this is
recorded accurately as an outstanding pre-merge verification requirement,
not claimed as done.

The section below describes the PRIOR pass's successful verification, which
predates all of this pass's and the immediately preceding pass's changes —
it no longer reflects the current column/scoping/Important implementation
and is kept only as a historical record that live verification has worked
in this environment before.

**Re-checked again post-migration (2026-09-08, repository now
`OceanMail/oceanmail-desktop`, HEAD `2728486` after merging main):** the
same launch attempt (lab container restarted, stale profile locks cleared)
hung identically for a third time, on a different day/session than either
prior attempt. This is now confirmed reproducible across three independent
sessions spanning two days, ruling out both transient per-session state and
anything specific to a particular day's container/X setup. Not
investigated further this pass per the explicit instruction not to hold
interactive GUI debugging open indefinitely; the shared organization CI
runner was not used for this (Linux self-hosted CI ran only lint/test, not
GUI Thunderbird, per the runner-use rules for this repository).

Fully verified end-to-end in a running Thunderbird dev instance against the
self-contained lab with two real accounts (`ship@station.test`,
`bob@station.test`, both real IMAP/SMTP, not simulated) — see
`docs/ui-review/` for screenshots. Confirmed working: both accounts show
the full `Inbox/Available/Drafts/Sent/Trash/Saved` hierarchy; Ship's and
Bob's Available show distinct fixture data/budgets and selecting rows in
one never affects the other; Ship's and Bob's Sent both show the delivery-
status banner and distinct fixture lifecycle states; the "← Back to Sent"
round-trip works cleanly; `Saved` is a real, empty, native folder per
account; native Account Central (clicking an account's own root row) is
completely unaffected by the pseudo-folder/overlay machinery.

Two real Experiment-API bugs were found and fixed during this verification
(both are examples of the general lesson already noted for
`oceanmailAccounts`/`oceanmailChrome`: common globals are **not** ambient in
this privileged `ExtensionAPI` scope the way they are in normal page/
console contexts, and must be explicitly imported or avoided):

1. `experiment/mail-folders-schema.json`'s `syncFolders` function was
   missing a `"parameters": []` array. Its absence made the WebExtension
   schema validator throw internally (`TypeError: can't access property
   "length", this.parameters is null` in `Schemas.sys.mjs`) on every call,
   which crossed the process boundary as an opaque `InvalidStateError: An
   exception was thrown` with no indication of the real cause. Fixed by
   adding the empty `parameters` array — apparently required even for a
   zero-argument function.
2. `experiment/mail-folders.js` used `new URLSearchParams(...)` to build
   the page URL. `URLSearchParams` is not an available global in this
   scope (`ReferenceError: URLSearchParams is not defined`); replaced with
   manual `encodeURIComponent`-based query-string construction.

A third, smaller bug was found and fixed by inspection during the same
pass: `hideOverlay()` only hid the content `<browser>`, not the overlay
container/back-button — with the container's CSS grid-area no longer
matching anything once the body class was removed, the "← Back to Sent"
button rendered as a stray floating element instead of disappearing.
Fixed by hiding the container itself (plus a `[hidden]{display:none
!important}` rule, since the container's own `display:flex` had higher
specificity than the UA stylesheet's `[hidden]` rule).

Diagnosing the schema bug in particular required working around this
session's console-log visibility problems (same class of issue noted in
`TRANCHE3_CORRECTION_NOTES.md`'s GUI-testing section) by temporarily
writing `syncFolders()`'s result/error to `browser.storage.local` and
displaying it on the Station page, since neither `alert()` (a no-op in the
hidden background document) nor the Browser Console reliably surfaced
background-script output in this environment. That temporary diagnostic
code has been removed from the final `background.js`/`space.js`.

## Important interoperability

This section defines the long-term shape of `Important` and the staged
migration toward it, superseding any earlier framing of `important` as a
permanent OceanMail-only field. Two rules anchor everything below:

1. `Important` must use interoperable email importance/priority metadata as
   its underlying representation, not a proprietary OceanMail-only header —
   ordinary email already has this concept (`Importance`/`X-Priority`-style
   headers, and Thunderbird's own native message priority), and OceanMail's
   job is to read/display/preserve it, not reinvent it.
2. `Important` is metadata only; it must never move a message ahead in
   RF/Grid scheduling, change Station queue precedence, consume a priority
   quota, let credits buy airtime precedence, alter relay scheduling, or
   outrank another user's ordinary traffic. Only Emergency changes
   user-originated transport precedence (Decision 0009).

### Normalized state, not a boolean

The product-facing representation is a three-value state, not a boolean —
collapsing "evaluated and not marked" into the same value as "we can't tell"
would silently lose information a future source might actually have:

```js
/**
 * @typedef {"important"|"ordinary"|"unknown"} ImportanceState
 * @typedef {object} NormalizedImportance
 * @property {ImportanceState} state - the only field views branch on
 * @property {"native-message"|"manifest"|"gateway"|"fixture"|"unknown"} source - provenance/debugging only, never a wire commitment, never used for scheduling
 */
```

- `"important"` — available authoritative metadata explicitly says the
  sender/message is marked important. UI: ★. Transport: ordinary OMail, no
  scheduling effect.
- `"ordinary"` — available authoritative metadata was evaluated and
  explicitly says normal/non-important. UI: no star. Transport: ordinary
  OMail, no scheduling effect. **Not** the same as missing metadata.
- `"unknown"` — the current source cannot determine importance (Station
  queue evidence has no importance field; a manifest version doesn't expose
  it yet; correlation to the real message failed; a legacy source lacks the
  field). UI may also show no star, but the model must retain `"unknown"`
  rather than silently coercing it to `"ordinary"`.

Emergency is never a value here — transport class and importance are
independent dimensions (a message conceptually has both `transportClass:
"ordinary"|"emergency"` and an importance state; an ordinary message may be
Important, and Emergency never derives from importance metadata).

Implemented in `extension/space/lib/importance.js`'s `normalizeImportance()`.
Views (`views/sent-status-view.js`, `views/available-view.js`) consume only
its `{state, source}` output — never a source-specific shape (a fixture's
`important` field, a future native message property, a future manifest
field, or a future gateway field) directly.

### Precedence

```text
1. Real authoritative message/manifest metadata
2. Fixture raw metadata shaped like production's real representation
3. Legacy fixture `important: true|false|null` compatibility field
4. Unknown
```

Only source 3 exists today. Lower-precedence fixture state must never
override higher-precedence real data once real sources exist (Stage 3+
below) — real metadata wins outright; a fixture value is never merged with
it.

### Migration stages

- **Stage 1 (current)**: fixtures only. `fixtures/available-fixtures.js` and
  `fixtures/sent-status-fixtures.js` carry a legacy `important: true|false`
  compatibility field on a few rows, each with a comment: *"Fixture-only
  compatibility field for UI proof. Do not promote this boolean to an
  OceanMail wire/backend schema. Real messages must derive Important from
  interoperable message metadata through the normalization adapter."* Never
  persisted to Station; never part of any wire/gateway schema; never treated
  as authoritative for a real native Thunderbird message.
- **Stage 2 (current)**: the normalization adapter boundary
  (`lib/importance.js`) exists and is the only thing views consume. Adding a
  real source later never requires a view change.
- **Stage 3 (write side implemented; list-display side partial)**:
  `messages.MessageHeader.priority` / `compose.ComposeDetails.priority`
  (confirmed present in the pinned 140.14.0esr build,
  `none|lowest|low|normal|high|highest`) is real native message/compose
  priority metadata. Writing: the compose_action "Mark Important" toggle
  (`background.js`) reads/writes it via the public `compose` API only — no
  Experiment, no proprietary header — mapping checked -> native `high`,
  unchecked -> native `normal`. Reading for the adapter:
  `normalizeImportance({nativePriority})` maps `high`/`highest` ->
  `important`, `none`/`normal`/`low`/`lowest` -> `ordinary`, anything else
  -> `unknown`, with real metadata always winning outright over the Stage-1
  fixture field on the same object (never merged) — exercised today by the
  compose toggle reading a message's current real priority before deciding
  what to toggle to. List-display side: Thunderbird's own native
  `priorityCol` (a real column already driven by a message's real priority
  — no custom code needed to compute it) is now made visible for each
  OceanMail account's real Sent AND Inbox folders
  (`makeNativePriorityColumnVisibleForAccount`), reusing the same
  `columnStates` mechanism as the "OceanMail Status" column. Unlike that
  column, `priorityCol` visibility is never reversed on cleanup — it is
  stock Thunderbird state predating this extension, not an OceanMail-owned
  key, so a genuinely useful native column staying visible after uninstall
  is a harmless residual, not OceanMail residue.
- **Stage 4 (deferred)**: when Station/Server's Available manifest gains
  interoperable importance metadata, normalize that through the same
  adapter and stop sourcing Available importance from fixtures for real
  rows. Still never affects automatic retrieval order — an Important
  Available message may show ★, but only the recipient's own
  selection/`moveSelected` order determines when it's actually retrieved.
- **Stage 5 (deferred)**: Internet ↔ OMail gateway conversion preserves
  interoperable importance metadata in both directions — an Internet
  sender's importance metadata survives conversion into OMail and is
  visible in Desktop as ★; an OceanMail user's outgoing ★ message emits the
  corresponding conventional Internet-mail importance metadata if it later
  crosses onto the public Internet. This is a **gateway/conversion
  contract, not Station scheduling policy** — do not classify it as a
  Station API gap. Not implemented in Desktop; the gateway implementation
  itself doesn't exist yet, and Desktop does not fake this. (Recorded here,
  not in `STATION_API_CONTRACT_GAPS.md`, precisely because it isn't a
  Station capability.) Do not conflate this with Gmail-style recipient-side
  automatic importance prediction — OceanMail only ever promises to
  preserve importance metadata that was actually transmitted in the
  message itself, never to reproduce a client's private prediction system.
- **Stage 6 (deferred)**: once real message/manifest sources exist for a
  given surface, migrate that surface's fixtures toward the same raw shape
  production uses, then remove the legacy top-level `important` field there.
  Never keep both indefinitely.

### Naming

Product-facing terminology is `Important` only — never expose `Priority` in
an OceanMail product model or UI label. Transport terminology remains
`Emergency`/`Ordinary`; there is no `Priority` OceanMail transport class
anywhere (Priority-model correction, above).

## Escalation / project-lead attention (not blocking, not decided unilaterally)

- Real per-message evidence chronology (beyond the account-level lifecycle
  states already shown) still needs a Station API change — some way to
  correlate a specific Sent message with a specific queue-history entry —
  that doesn't exist to build against yet regardless of Desktop-side effort
  (`STATION_API_CONTRACT_GAPS.md`).
- The native columns' visibility-forcing (`setSentColumnVisibility`,
  `makeNativePriorityColumnVisibleForAccount`) only takes effect the next
  time the user (re)selects the folder if it was already open when a sync
  pass ran — a minor UX rough edge, not fixed further this pass since it
  would need a deeper chrome hook into `about3Pane.js`'s own column-restore
  call. Flagging in case project lead wants that polished before this alpha
  ships more broadly.
- No preference or public API was found to hide just the native Tasks Space
  without also hiding Calendar in this pinned build (unlike Chat, which has
  a real dedicated `mail.chat.enabled` pref) — left visible, not addressed
  via a new native-chrome DOM-mutation bridge given the project's existing
  aversion to that pattern (`oceanmailChrome`). Left to project lead whether
  this is acceptable for the alpha or needs a different approach.
- Address Book -> Contacts relabeling was not attempted this pass (per the
  review's own escape hatch: implement only if it can be done without
  reopening the fragile branding bridge, otherwise document it) — this pass
  could not live-verify the pinned build's exact mechanism at all (see
  "Live verification" below), so it is left as a non-blocking cosmetic gap
  rather than risking another chrome-mutation bug found only after merge.
