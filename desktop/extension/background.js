// Mandatory OceanMail extension entry point.
//
// Per Decision 0007 (native Thunderbird shell) and Decision 0008
// (account-scoped Mail views and native iconography): Thunderbird's own
// native Spaces toolbar carries only application-level destinations —
// Mail, Calendar, Address Book, Chat (all native, untouched), Station, and
// Emergency. Available/Saved/Outbox are account-scoped and therefore live
// under each OceanMail account in the native Mail folder pane, not as
// top-level Spaces (see experiment/mail-folders.js for that integration).
// Also provisions the native OceanMail IMAP/SMTP accounts on every startup
// (Tranche 2: no generic Thunderbird account wizard should be necessary for
// normal OceanMail startup) via the oceanmailAccounts Experiment API — two
// accounts (Ship, Bob) so account-scoped Mail work is provable against a
// real second mailbox, not only ever one.
//
// Per the correction: do not rename the native Mail/Chat Spaces buttons.
// Inside a dedicated OceanMail-branded application "Mail" is already
// correct, and renaming Chat to "OChat" before OChat exists would be
// misleading. The oceanmailChrome Experiment API from the previous pass is
// removed entirely, not merely left unused.
//
// Project-lead correction (PR #7 review, "Important is not yet actually
// user-settable"): a compose-time Important toggle is implemented here
// using ONLY the public `compose` API — no Experiment API, no proprietary
// OceanMail header. It reuses Thunderbird's own conventional message
// priority mechanism (`compose.ComposeDetails.priority`,
// `none|lowest|low|normal|high|highest`, confirmed present in the pinned
// 140.14.0esr build) as the wire/storage representation; the OceanMail UI
// exposes only a single Important on/off control, never the underlying
// 5-value scale. See `space/lib/importance.js`'s `normalizeImportance()`
// for the shared native-priority -> Important-state mapping (background.js
// is loaded as an ES module specifically so this file can import that
// adapter instead of duplicating its mapping table).

import { normalizeImportance } from "./space/lib/importance.js";

const OCEANMAIL_SPACES = [
  {
    name: "oceanmail_station",
    title: "Station",
    page: "station",
    icon: { light: "icons/spaces-station-light.svg", dark: "icons/spaces-station-dark.svg" }
  },
  {
    name: "oceanmail_emergency",
    title: "Emergency",
    page: "emergency",
    icon: { light: "icons/spaces-emergency-light.svg", dark: "icons/spaces-emergency-dark.svg" }
  }
];

// Stale top-level spaces from earlier, since-rejected iterations of the
// application shell (a single big "oceanmail" space with its own rail, then
// separate global Available/Outbox spaces) — removed from any profile that
// still has them.
const STALE_SPACE_NAMES = ["oceanmail", "oceanmail_available", "oceanmail_outbox"];

// Lab mail-boundary facts (loopback-only, no SMTP auth, plaintext IMAP,
// station.test domain, oceanmail-lab password) — shared by both the
// self-contained Desktop mail lab (desktop/scripts/start-mail-lab.sh) and
// the real oceanmail-station lab's phase3a-standard-mail-client.sh, which is
// why the same config works against whichever one is currently running.
// These are lab facts only, not a production account/security decision —
// see docs/STATION_API_CONTRACT_GAPS.md. Two accounts (ship, bob) prove
// OceanMail Desktop's account-scoped Mail views against a real second
// mailbox rather than only ever exercising one (Decision 0008).
const OCEANMAIL_ACCOUNTS = [
  {
    displayName: "Ship",
    realName: "Ship",
    emailAddress: "ship@station.test",
    incomingHostname: "127.0.0.1",
    incomingPort: 2143,
    incomingUsername: "ship",
    incomingPassword: "oceanmail-lab",
    outgoingHostname: "127.0.0.1",
    outgoingPort: 2525,
    outgoingRequiresAuth: false,
    makeDefault: true
  },
  {
    displayName: "Bob",
    realName: "Bob",
    emailAddress: "bob@station.test",
    incomingHostname: "127.0.0.1",
    incomingPort: 2143,
    incomingUsername: "bob",
    incomingPassword: "oceanmail-lab",
    outgoingHostname: "127.0.0.1",
    outgoingPort: 2525,
    outgoingRequiresAuth: false,
    makeDefault: false
  }
];

export async function ensureOceanMailAccounts() {
  const results = [];
  for (const config of OCEANMAIL_ACCOUNTS) {
    results.push(await browser.oceanmailAccounts.ensureAccount(config));
  }
  return results;
}

// Project-lead correction (PR #7 review): `ensureSavedFolders()` and
// `oceanmailMailFolders.syncFolders()` used to treat every non-local,
// non-IM Thunderbird account as OceanMail. That would create a `Saved`
// folder / an Available row under an unrelated Gmail or other IMAP account
// if this extension were ever installed in stock Thunderbird for
// portability testing. This is the single source of truth for "which
// accounts are actually OceanMail's" — the exact ids `ensureAccount()`
// itself returned, never a generic IMAP-type guess.
export function oceanMailAccountIds(ensureAccountResults) {
  return ensureAccountResults.map((result) => result.accountId);
}

export async function ensureOceanMailSpaces() {
  const existing = await browser.spaces.query({ isSelfOwned: true });
  const existingByName = new Map(existing.map((space) => [space.name, space]));

  const results = [];
  for (const spec of OCEANMAIL_SPACES) {
    const found = existingByName.get(spec.name);
    if (found) {
      results.push(found);
      continue;
    }
    results.push(
      await browser.spaces.create(
        spec.name,
        { url: `space/index.html?page=${spec.page}`, linkHandler: "balanced" },
        { title: spec.title, themeIcons: [{ ...spec.icon, size: 20 }] }
      )
    );
  }

  for (const staleName of STALE_SPACE_NAMES) {
    const stale = existing.find((space) => space.name === staleName);
    if (stale) {
      await browser.spaces.remove(stale.id);
    }
  }

  return results;
}

// Saved is a real per-account IMAP folder (Decision 0008 / correction
// spec section 5: "Use a real mailbox folder where the current IMAP/mailbox
// architecture supports it cleanly") — created via the public `folders`
// API, no Experiment API involvement needed. Unlike Available, this is
// deliberately NOT a pseudo-folder: it's real storage, so it naturally
// participates in native move/drag, quota, and sync behavior.
//
// Only the explicit OceanMail account ids are ever touched (project-lead
// correction, PR #7 review) — `browser.accounts.list()` returns every
// account in the profile, including any unrelated Gmail/IMAP account a
// user has configured in the same Thunderbird install, and this must never
// create a Saved folder under one of those.
export async function ensureSavedFolders(accountIds) {
  const idSet = new Set(accountIds);
  const accounts = (await browser.accounts.list()).filter((account) => idSet.has(account.id));
  const results = [];
  for (const account of accounts) {
    const existingFolders = await browser.folders.query({ accountId: account.id });
    const hasSaved = existingFolders.some(
      (f) => f.name === "Saved" && f.path === "/Saved"
    );
    if (hasSaved) {
      results.push({ account: account.name, created: false });
      continue;
    }
    await browser.folders.create(account.rootFolder.id, "Saved");
    results.push({ account: account.name, created: true });
  }
  return results;
}

let currentOceanMailAccountIds = [];

// local verification workstation live-defect correction (PR #7): a fresh/cold `dev-launch.sh`
// launch left Station, Emergency, Available, and the Sent column all
// absent for 10+ minutes, until opening New Message caused them to
// suddenly appear. Root cause, confirmed by reading the pinned
// 140.14.0esr build's own extension-lifecycle manager
// (toolkit/content/extensions/parent/ext-backgroundPage.js): on
// APP_STARTUP, an MV3 background page is only started immediately if it
// is persistent, has no persisted listeners yet, OR has a registered
// `runtime.onStartup` listener. Once this extension has run once, its
// `composeAction.onClicked`/`compose.onComposeStateChanged` listeners
// below become "persisted listeners" — with no `onStartup` listener
// registered, Thunderbird then only *primes* (does not start) this
// background on the next cold launch, waking it lazily whenever one of
// those OTHER listeners' events fires. Opening a compose window did
// exactly that. The fix is not a timer or more polling: registering
// `runtime.onStartup` is the one signal this lifecycle manager explicitly
// treats as startup-blocking, which is exactly what "initialize on cold
// launch, not on first incidental event" requires.
let initializeOceanMailPromise = null;

// Single idempotent entry point — safe to call more than once (e.g. once
// eagerly at top-level module evaluation, which is how install/reload/
// enable always starts the background regardless of onStartup, AND once
// via the onStartup listener firing on a genuine cold launch): concurrent
// calls share the same in-flight promise rather than racing, and every
// step it calls (ensureOceanMailSpaces, ensureOceanMailAccounts,
// ensureSavedFolders, syncMailFolders) is independently idempotent too, so
// a legitimate second full run (e.g. after this promise resolves and
// something calls it again) is also harmless.
export function initializeOceanMail() {
  if (initializeOceanMailPromise) {
    return initializeOceanMailPromise;
  }
  initializeOceanMailPromise = (async () => {
    try {
      console.log("[OceanMail] spaces ready:", await ensureOceanMailSpaces());
    } catch (err) {
      console.error("[OceanMail] failed to create spaces:", err);
    }

    let accountResults;
    try {
      accountResults = await ensureOceanMailAccounts();
      console.log("[OceanMail] accounts ready:", accountResults);
    } catch (err) {
      console.error("[OceanMail] failed to provision accounts:", err);
      return;
    }
    currentOceanMailAccountIds = oceanMailAccountIds(accountResults);

    // Saved folders and the Available pseudo-folder/Sent-status column need
    // the accounts to exist first, and both must be scoped to exactly
    // these ids — never inferred from generic IMAP-ness.
    try {
      console.log("[OceanMail] Saved folders:", await ensureSavedFolders(currentOceanMailAccountIds));
    } catch (err) {
      console.error("[OceanMail] failed to ensure Saved folders:", err);
    }

    syncMailFolders();
  })();
  return initializeOceanMailPromise;
}

// The reliable startup lifecycle hook (see comment above `initializeOceanMailPromise`).
browser.runtime.onStartup.addListener(initializeOceanMail);

// Also run immediately at top-level evaluation: this is what actually
// initializes OceanMail on install/reload/enable (background pages always
// start immediately for those reasons, regardless of onStartup), and is a
// harmless idempotent no-op on a cold launch where onStartup already
// triggered — or is about to trigger — the same call.
initializeOceanMail();

// Available (pseudo-folder), Saved's folder-tree position, and the native
// Sent delivery-status column are all wired under each OceanMail account's
// native Mail folder-pane row (Decision 0008/0009) via a narrowly scoped
// Experiment API — see experiment/mail-folders.js for exactly what it
// touches and why a public API cannot do this. Re-run on an interval as a
// practical (not perfect) defense against Thunderbird rebuilding the
// folder tree — e.g. on new windows/tabs, account changes, or mode
// switches — since there is no single public "folder tree rebuilt" signal
// to hook precisely. Always passes the current explicit OceanMail account
// id list, never lets the Experiment infer "OceanMail" itself. This timer
// is a defense against folder-tree rebuilds AFTER initialization, not a
// substitute for reliable initialization itself — see initializeOceanMail
// above for that.
function syncMailFolders() {
  browser.oceanmailMailFolders
    .syncFolders(currentOceanMailAccountIds)
    .then((result) => console.log("[OceanMail] mail folders synced:", result))
    .catch((err) => console.error("[OceanMail] failed to sync mail folders:", err));
}

// `.unref()` only exists on Node's Timeout object, never on a browser's
// plain numeric timer id — this guard is a no-op in real Thunderbird (the
// interval behaves exactly as before) and only matters for this file's own
// test suite, where it stops a lingering interval from holding the test
// process open indefinitely.
const syncMailFoldersIntervalId = setInterval(syncMailFolders, 10_000);
if (typeof syncMailFoldersIntervalId?.unref === "function") {
  syncMailFoldersIntervalId.unref();
}

// ---------------------------------------------------------------------------
// Compose-time Important toggle (public compose/composeAction APIs only)
//
// Maps checked -> native priority "high", unchecked -> native priority
// "normal" (project-lead correction: "map checked -> native high and
// unchecked -> native normal through the compose API"). This never touches
// Station, never adds a proprietary header, and by construction cannot
// affect transport scheduling — it is exactly the same header a
// conventional email client would set.
// ---------------------------------------------------------------------------

const IMPORTANT_ICON = {
  on: "icons/important-on.svg",
  off: "icons/important-off.svg"
};

async function refreshComposeImportantIcon(tabId) {
  let details;
  try {
    details = await browser.compose.getComposeDetails(tabId);
  } catch (err) {
    // Tab may have closed/changed between the event firing and this read.
    return;
  }
  const importance = normalizeImportance({ nativePriority: details.priority });
  const isImportant = importance.state === "important";
  await browser.composeAction.setIcon({ tabId, path: IMPORTANT_ICON[isImportant ? "on" : "off"] });
  await browser.composeAction.setTitle({
    tabId,
    title: isImportant ? "Important (click to unmark)" : "Mark Important"
  });
}

browser.composeAction.onClicked.addListener(async (tab) => {
  let details;
  try {
    details = await browser.compose.getComposeDetails(tab.id);
  } catch (err) {
    console.error("[OceanMail] could not read compose details:", err);
    return;
  }
  const importance = normalizeImportance({ nativePriority: details.priority });
  const nextPriority = importance.state === "important" ? "normal" : "high";
  try {
    await browser.compose.setComposeDetails(tab.id, { priority: nextPriority });
  } catch (err) {
    console.error("[OceanMail] could not set compose priority:", err);
    return;
  }
  await refreshComposeImportantIcon(tab.id);
});

// Reflects a resumed draft's or reply's already-set priority in the button
// icon. `onComposeStateChanged` is not specifically an importance-change
// event (Thunderbird has none), but it fires early and on every relevant
// compose-state transition, which is close enough for this alpha's needs;
// the button always reads the true current value at click time regardless.
if (browser.compose.onComposeStateChanged) {
  browser.compose.onComposeStateChanged.addListener((tab) => {
    refreshComposeImportantIcon(tab.id);
  });
}
