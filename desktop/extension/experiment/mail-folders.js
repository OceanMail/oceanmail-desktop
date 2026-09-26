"use strict";

// Narrowly-scoped Thunderbird Experiment API: account-scoped OceanMail Mail
// integration (Decision 0008 — docs/decisions/0008-account-scoped-mail-
// views-and-native-iconography.md; refined by Decision 0009 and the project-
// lead's final mail-model correction — docs/MAIL_MODEL_CORRECTION.md).
//
// Project-lead correction (PR #7 review): this used to treat "every non-
// local, non-IM Thunderbird account" as OceanMail. That would mutate
// unrelated Gmail/other IMAP accounts if this extension were ever installed
// in stock Thunderbird for portability testing. `syncFolders()` now takes
// the EXACT list of OceanMail account ids background.js collected from
// `oceanmailAccounts.ensureAccount()` and touches only those — it never
// infers "OceanMail" from generic IMAP-ness.
//
// What this does, per OceanMail account only:
//   - inserts one OceanMail pseudo-folder row — Available — under the
//     account's row in every open Mail 3-pane document (Thunderbird's
//     public MV3 `mailTabs` API has no supported way to add a custom child
//     row beneath an account, so this is the narrow bridge for it);
//   - repositions the real `Saved` folder's own folder-tree row (created by
//     the public `folders.create()` API in background.js) to sit
//     immediately after Available, matching the accepted hierarchy `Inbox,
//     Available, Saved, Drafts, Sent` — this only moves the existing live
//     DOM row, it never recreates the folder or touches IMAP storage;
//   - registers one global native "OceanMail Status" custom Sent-list
//     column (Thunderbird's own `ThreadPaneColumns.addCustomColumn`,
//     confirmed present in the pinned 140.14.0esr build) that shows
//     Station-derived delivery-status text only inside an OceanMail
//     account's own real Sent folder — everywhere else it renders blank.
//
// What this does NOT do, on purpose:
//   - it never creates a real (fake) nsIMsgFolder — the Available row has
//     no backing folder and no `.uri`, so Thunderbird's own selection
//     handler (about3Pane.js `_onSelect`) safely no-ops on it instead of
//     resolving a folder;
//   - it does NOT add a user-facing Outbox row/folder of any kind;
//   - it never mutates folder contents or the native Sent message list
//     itself — the custom column is a real Thunderbird list column, not a
//     replacement list, and its `textCallback` never invents delivery
//     evidence for a real message (see `sentStatusText` below);
//   - it never touches any account that isn't in the explicit
//     `oceanmailAccountIds` list passed into `syncFolders()`.
//
// Reused across documents/windows/tabs: Thunderbird can have more than one
// Mail 3-pane tab or window open at once, each with its own about:3pane
// document (`tabInfo.chromeBrowser.contentDocument`). `syncFolders()` treats
// every one of them, and is re-run on a timer from background.js as a
// practical (not perfect) defense against Thunderbird rebuilding the folder
// tree — there is no single public "folder tree rebuilt" event to hook
// precisely, and re-running this is cheap/idempotent.

const AVAILABLE_SPEC = { key: "available", label: "Available", icon: "icons/folder-available.svg", page: "available" };
const SAVED_FOLDER_NAME = "Saved";

const PSEUDO_STYLE_ID = "oceanmail-pseudo-style";
const PSEUDO_OVERLAY_ID = "oceanmailOverlay";
const PSEUDO_BROWSER_ID = "oceanmailPseudoBrowser";
const PSEUDO_CLOSE_BUTTON_ID = "oceanmailCloseButton";
const PSEUDO_BODY_CLASS = "oceanmail-pseudo-folder";
const SENT_BANNER_ID = "oceanmailSentBanner";

const STATUS_COLUMN_ID = "oceanmailStatus";

function ensureStyle(doc) {
  if (doc.getElementById(PSEUDO_STYLE_ID)) {
    return;
  }
  const style = doc.createElement("style");
  style.id = PSEUDO_STYLE_ID;
  // Mirrors Thunderbird's own `.account-central` grid-template swap
  // (about3Pane.css) under a distinct class name, so real Account Central
  // behavior/state is never touched by this — only OUR pseudo-folder view
  // triggers this class.
  style.textContent = `
    body.${PSEUDO_BODY_CLASS} {
      grid-template: "folders folderPaneSplitter account-central" auto
                     / minmax(auto, var(--folderPaneSplitter-width)) min-content minmax(auto, 1fr) !important;
    }
    body.${PSEUDO_BODY_CLASS} :is(#threadPane, #messagePaneSplitter, #messagePane) {
      display: none !important;
    }
    #${PSEUDO_OVERLAY_ID} {
      grid-area: account-central;
      box-sizing: border-box;
      min-width: 400px;
      display: flex;
      flex-direction: column;
    }
    #${PSEUDO_OVERLAY_ID}[hidden] {
      /* The explicit display:flex above has higher specificity than the
         UA stylesheet's [hidden]{display:none}, so without this the
         overlay stayed laid out (and rendered as a stray floating element)
         even after being marked hidden — observed during manual
         verification. */
      display: none !important;
    }
    #${PSEUDO_BROWSER_ID} {
      flex: 1;
      min-height: 0;
    }
    #${PSEUDO_CLOSE_BUTTON_ID} {
      flex: 0 0 auto;
      margin: 6px;
      align-self: flex-start;
    }
    #${SENT_BANNER_ID} {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      background: color-mix(in srgb, AccentColor 12%, transparent);
      border-bottom: 1px solid ThreeDShadow;
      font-size: 0.9em;
    }
    #${SENT_BANNER_ID}[hidden] {
      display: none;
    }
  `;
  doc.head.appendChild(style);
}

function ensureOverlay(doc) {
  let overlay = doc.getElementById(PSEUDO_OVERLAY_ID);
  if (overlay) {
    return {
      overlay,
      browserEl: doc.getElementById(PSEUDO_BROWSER_ID),
      closeButton: doc.getElementById(PSEUDO_CLOSE_BUTTON_ID)
    };
  }

  overlay = doc.createElement("div");
  overlay.id = PSEUDO_OVERLAY_ID;
  overlay.hidden = true;

  // Generic (not Sent-specific) — the same overlay/browser is reused for
  // both Available and the Sent-status demo page, and either can be left by
  // clicking any other folder-tree row; this button is a convenience for
  // leaving without knowing that, e.g. when a Sent-status link opened it.
  const closeButton = doc.createElement("button");
  closeButton.id = PSEUDO_CLOSE_BUTTON_ID;
  closeButton.textContent = "← Close";
  closeButton.addEventListener("click", () => hideOverlay(doc));

  const browserEl = doc.createXULElement("browser");
  browserEl.id = PSEUDO_BROWSER_ID;
  browserEl.setAttribute("type", "content");
  browserEl.setAttribute("maychangeremoteness", "true");
  browserEl.setAttribute("context", "browserContext");

  overlay.appendChild(closeButton);
  overlay.appendChild(browserEl);

  const accountCentralBrowser = doc.getElementById("accountCentralBrowser");
  if (accountCentralBrowser) {
    accountCentralBrowser.after(overlay);
  } else {
    doc.body.appendChild(overlay);
  }

  return { overlay, browserEl, closeButton };
}

function showOverlay(doc, url, MailE10SUtils) {
  const { overlay, browserEl } = ensureOverlay(doc);
  doc.body.classList.add(PSEUDO_BODY_CLASS);
  overlay.hidden = false;
  browserEl.hidden = false;
  if (browserEl.getAttribute("data-oceanmail-loaded") !== url) {
    MailE10SUtils.loadURI(browserEl, url);
    browserEl.setAttribute("data-oceanmail-loaded", url);
  }
}

function ensureSentBanner(doc) {
  let banner = doc.getElementById(SENT_BANNER_ID);
  if (banner) {
    return banner;
  }
  banner = doc.createElement("div");
  banner.id = SENT_BANNER_ID;
  banner.hidden = true;

  const labelSpan = doc.createElement("span");
  labelSpan.id = `${SENT_BANNER_ID}-label`;

  const button = doc.createElement("button");
  button.id = `${SENT_BANNER_ID}-button`;
  button.type = "button";
  button.textContent = "View OceanMail Sent details";

  banner.appendChild(labelSpan);
  banner.appendChild(button);

  const threadPane = doc.getElementById("threadPane");
  threadPane?.prepend(banner);
  return banner;
}

function hideOverlay(doc) {
  doc.body.classList.remove(PSEUDO_BODY_CLASS);
  // Hide the whole overlay (not just the browser) — when the body class is
  // removed, the CSS grid area it was assigned to no longer exists, and an
  // unhidden grid item with nowhere to go can render as a stray floating
  // element instead of disappearing (observed during manual verification).
  const overlay = doc.getElementById(PSEUDO_OVERLAY_ID);
  if (overlay) {
    overlay.hidden = true;
  }
  const browserEl = doc.getElementById(PSEUDO_BROWSER_ID);
  if (browserEl) {
    browserEl.hidden = true;
  }
}

function pageURL(extensionBaseURL, spec, email, name) {
  // URLSearchParams is not an available global in this privileged
  // ExtensionAPI scope (confirmed empirically), so the query string is
  // built by hand instead.
  const query = ["page", "account", "accountName"]
    .map((key) => {
      const value = { page: spec.page, account: email, accountName: name }[key];
      return `${key}=${encodeURIComponent(value)}`;
    })
    .join("&");
  return `${extensionBaseURL}space/index.html?${query}`;
}

function accountDisplay(account) {
  const identity = account.defaultIdentity;
  const email = identity ? identity.email : account.incomingServer.prettyName;
  const name = identity?.fullName || account.incomingServer.prettyName || email;
  return { email, name };
}

function resolveRowFolder(li, MailServices) {
  if (!li.uri) {
    return null;
  }
  try {
    return MailServices.folderLookup.getFolderForURL(li.uri);
  } catch {
    return null;
  }
}

function findFolderRowByFlag(childList, MailServices, flag) {
  for (const li of childList.children) {
    if (li.dataset?.oceanmailPseudo) {
      continue;
    }
    const folder = resolveRowFolder(li, MailServices);
    if (folder?.getFlag(flag)) {
      return li;
    }
  }
  return null;
}

function findFolderRowByName(childList, MailServices, name) {
  for (const li of childList.children) {
    if (li.dataset?.oceanmailPseudo) {
      continue;
    }
    const folder = resolveRowFolder(li, MailServices);
    if (folder && !folder.isServer && folder.name === name) {
      return li;
    }
  }
  return null;
}

function availableRowId(account) {
  return `oceanmail-pseudo-${AVAILABLE_SPEC.key}-${account.key}`;
}

function ensureAvailableRow(doc, serverRow, account, extensionBaseURL) {
  const { email, name } = accountDisplay(account);
  const childList = serverRow.childList;
  const rowId = availableRowId(account);
  if (doc.getElementById(rowId)) {
    return { inserted: 0, row: doc.getElementById(rowId) };
  }

  const row = doc.createElement("li", { is: "folder-tree-row" });
  row.id = rowId;
  row.modeName = serverRow.modeName;
  row.dataset.oceanmailPseudo = AVAILABLE_SPEC.key;
  row.dataset.oceanmailAccount = account.key;
  row.dataset.oceanmailUrl = pageURL(extensionBaseURL, AVAILABLE_SPEC, email, name);
  row.name = AVAILABLE_SPEC.label;
  row.fullName = `${AVAILABLE_SPEC.label} - ${name}`;
  row.icon.src = `${extensionBaseURL}${AVAILABLE_SPEC.icon}`;
  row.icon.alt = "";

  childList.appendChild(row);
  return { inserted: 1, row };
}

/**
 * local verification workstation live-defect correction (PR #7): a fresh/restarted OceanMail
 * profile visibly showed native Thunderbird "Local Folders" (with its own
 * Trash and Outbox) in the folder pane — not the removed OceanMail Outbox
 * model, but indistinguishable from a user-facing Outbox to a user, and the
 * accepted product model has none.
 *
 * Confirmed by reading about3Pane.js: Thunderbird already has a supported,
 * native, per-profile folder-pane toggle for exactly this —
 * `folderPane.hideLocalFolders`, backed by the same real, persisted XULStore
 * mechanism used elsewhere in this codebase (`folderPaneLocalFolders`
 * `hidden`), not a DOM-mutation chrome hack and not a new native-chrome
 * bridge. This never deletes, disables, or corrupts the Local Folders
 * account/server itself — Thunderbird can still use it internally (e.g. as
 * a fallback store) and a user can still reach it via Account Settings; it
 * is only removed from the visible folder-pane tree. XULStore is
 * profile-scoped exactly like prefs.js, so this never touches a separate
 * stock Thunderbird profile/installation.
 *
 * Idempotent (checked via the real persisted value, not just the module-
 * level flag, so it stays correct even if something else in the profile
 * changed it) and applied once per document since it is account-independent
 * global folder-pane state, not scoped to any particular OceanMail account.
 *
 * Writes the XULStore value directly (for future sessions/re-renders) AND,
 * when this window's `folderPane` is already live, sets its
 * `hideLocalFolders` property too — the exact same pair of writes
 * Thunderbird's own `toggleLocalFolders()` command handler performs — so an
 * already-open folder pane in the CURRENT session updates immediately
 * rather than only on the next restart.
 *
 * @param {Window} [win] - the about:3pane window, if available, for the
 *   live-update half of this; the XULStore write happens regardless.
 */
function ensureLocalFoldersHidden(win) {
  const alreadyHidden =
    Services.xulStore.hasValue(
      "chrome://messenger/content/messenger.xhtml",
      "folderPaneLocalFolders",
      "hidden"
    ) &&
    ["true", ""].includes(
      Services.xulStore.getValue(
        "chrome://messenger/content/messenger.xhtml",
        "folderPaneLocalFolders",
        "hidden"
      )
    );
  if (!alreadyHidden) {
    Services.xulStore.setValue(
      "chrome://messenger/content/messenger.xhtml",
      "folderPaneLocalFolders",
      "hidden",
      "true"
    );
  }
  try {
    if (win?.folderPane) {
      // The getter rereads XULStore and changes the cached state, which can
      // prevent the setter from rebuilding the live tree. Set directly.
      win.folderPane.hideLocalFolders = true;
    }
  } catch {
    // Live update is a best-effort convenience; the XULStore write above
    // still ensures Local Folders stays hidden from the next restart on.
  }
  return !alreadyHidden;
}

/**
 * Places Available immediately after Inbox, and — if the real Saved folder
 * has synced and shown up as a real folder-tree row — moves that row to sit
 * immediately after Available. Matches the accepted hierarchy `Inbox,
 * Available, Saved, Drafts, Sent` (project-lead correction, PR #7 review).
 * Only repositions the existing live row; Saved's actual IMAP storage is
 * never touched here (that is background.js's `ensureSavedFolders()`).
 *
 * @returns {boolean} whether any row was actually moved this pass
 */
function positionAvailableAndSaved(doc, serverRow, availableRow, MailServices) {
  let moved = false;
  const childList = serverRow.childList;

  const inboxRow = findFolderRowByFlag(childList, MailServices, Ci.nsMsgFolderFlags.Inbox);
  if (inboxRow && inboxRow.nextElementSibling !== availableRow) {
    inboxRow.after(availableRow);
    moved = true;
  } else if (!inboxRow && availableRow.parentElement !== childList) {
    childList.appendChild(availableRow);
    moved = true;
  }

  const savedRow = findFolderRowByName(childList, MailServices, SAVED_FOLDER_NAME);
  if (savedRow && availableRow.nextElementSibling !== savedRow) {
    availableRow.after(savedRow);
    moved = true;
  }

  return moved;
}

function wireSelectListener(doc, extensionBaseURL, MailServices, MailE10SUtils) {
  const folderTree = doc.getElementById("folderTree");
  if (!folderTree || folderTree.dataset.oceanmailWired) {
    return;
  }
  ensureOverlay(doc);
  const banner = ensureSentBanner(doc);

  // Named (not anonymous) so onShutdown() can actually remove it — an
  // anonymous listener registered here could never be un-registered, so a
  // reloaded extension would accumulate a duplicate on every reload
  // (project-lead correction, PR #7 review). Stored directly on the
  // element rather than a module-level WeakMap so cleanup only ever needs
  // the folderTree reference it already has.
  function onSelect() {
    const row = folderTree.selectedRow;
    if (row?.dataset?.oceanmailPseudo) {
      banner.hidden = true;
      showOverlay(doc, row.dataset.oceanmailUrl, MailE10SUtils);
      return;
    }

    hideOverlay(doc);

    // `doc._oceanmailAccountsByServerKey` is refreshed by processDocument
    // on every sync pass, so this always reflects the current explicit
    // OceanMail account list rather than a stale closure snapshot.
    const accountsByServerKey = doc._oceanmailAccountsByServerKey;
    let account = null;
    try {
      const folder = row?.uri ? MailServices.folderLookup.getFolderForURL(row.uri) : null;
      if (folder?.getFlag(Ci.nsMsgFolderFlags.SentMail)) {
        account = accountsByServerKey?.get(folder.server.key) || null;
      }
    } catch {
      // Row didn't resolve to a real folder — leave account null.
    }

    if (account) {
      const { email, name } = accountDisplay(account);
      const label = banner.querySelector(`#${SENT_BANNER_ID}-label`);
      // local verification workstation live-defect correction (PR #7): Thunderbird's thread-pane
      // list mode (Cards vs. Table — `mail.threadpane.listview`, confirmed
      // in about3Pane.js as a single global int pref with NO per-folder
      // override anywhere in this build) determines whether custom columns
      // render at all: Cards view's card template
      // (ThreadPaneColumns.getDefaultColumnsForCardsView) is a fixed field
      // list that does not include custom columns — or even the native
      // priorityCol — so the "OceanMail Status" column is genuinely
      // invisible in Cards view, Thunderbird's own default. The banner
      // used to unconditionally claim the column "shows delivery status
      // inline", which was false whenever Cards view was active — exactly
      // the "misleading, core feature invisible" defect found live. Never
      // force Table view globally to work around this (would affect any
      // unrelated account sharing the profile) — instead read the current
      // mode read-only and never overclaim; the button below (not the
      // column) is this alpha's one reliable, view-mode-independent way to
      // see delivery status, since the banner itself lives outside the
      // thread-pane's Cards/Table row rendering entirely.
      const isTableView = Services.prefs.getIntPref("mail.threadpane.listview", 0) === 1;
      label.textContent = isTableView
        ? `OceanMail: the "OceanMail Status" column is showing delivery status inline in this Table view.`
        : `OceanMail: this Cards view doesn't show the "OceanMail Status" column (Thunderbird only shows custom columns in Table view) — open Sent details below for ${name}'s delivery status.`;
      const button = banner.querySelector(`#${SENT_BANNER_ID}-button`);
      button.textContent = "View Sent details";
      button.onclick = () => {
        const url = pageURL(extensionBaseURL, { page: "sent" }, email, name);
        showOverlay(doc, url, MailE10SUtils);
      };
      banner.hidden = false;
    } else {
      banner.hidden = true;
    }
  }

  folderTree._oceanmailSelectHandler = onSelect;
  folderTree.addEventListener("select", onSelect);
  folderTree.dataset.oceanmailWired = "true";
}

function unwireSelectListener(doc) {
  const folderTree = doc.getElementById("folderTree");
  if (!folderTree) {
    return;
  }
  if (folderTree._oceanmailSelectHandler) {
    folderTree.removeEventListener("select", folderTree._oceanmailSelectHandler);
    delete folderTree._oceanmailSelectHandler;
  }
  delete folderTree.dataset.oceanmailWired;
  delete doc._oceanmailAccountsByServerKey;
}

/**
 * Truthful, per-message Sent delivery-status text for the native
 * "OceanMail Status" column. Station's real outbound-queue evidence has no
 * Message-ID-style key to correlate a specific Sent message with a specific
 * queue-history entry (docs/STATION_API_CONTRACT_GAPS.md), so EVERY real
 * message in an OceanMail account's Sent folder reads exactly the same
 * truthful "Status unavailable" text — never anything derived from the
 * message's own subject or any other content.
 *
 * Project-lead correction (PR #7 review): an earlier version of this
 * function special-cased messages whose subject matched a small demo table,
 * showing a "(demo)" delivery status for them. That was rejected — a
 * `(demo)` suffix does not make message-level evidence true, and it let a
 * genuine real message display fabricated status merely by sharing a
 * subject with a fixture. There is no such special case any more, and no
 * lab-account email address is hard-coded into this integration logic.
 * Rich demo lifecycle states belong only in the explicitly fixture-owned
 * Sent-details page (`views/sent-status-view.js`), never here.
 *
 * @param {nsIMsgDBHdr} msgHdr
 * @param {Map<string, object>} accountsByServerKey
 * @returns {string} "" when the column is not meaningful for this message
 */
function sentStatusText(msgHdr, accountsByServerKey) {
  let folder;
  try {
    folder = msgHdr.folder;
  } catch {
    return "";
  }
  if (!folder?.getFlag(Ci.nsMsgFolderFlags.SentMail)) {
    return "";
  }
  if (!accountsByServerKey.has(folder.server?.key)) {
    return "";
  }
  return "Status unavailable — no Station message correlation";
}

/**
 * The column is registered globally with `hidden: true` (project-lead
 * correction, PR #7 review: an unrelated account/folder with no persisted
 * column layout could otherwise display an empty OceanMail column even
 * though the callback returns blank for it). Visibility is instead granted
 * explicitly, per real Sent folder, ONLY for the exact OceanMail accounts
 * `syncFolders()` was given — by merging `visible:true` into that folder's
 * own real, persisted `columnStates` property (the same one
 * `about3Pane.js`'s `restoreColumnsState()`/`applyPersistedColumnsState()`
 * reads), never touching any other column's saved state. This is also why
 * a newly-registered column needs this at all: Thunderbird only honors a
 * custom column's own `hidden: false` default on a folder that has NEVER
 * had a column layout saved — every already-viewed folder (all lab
 * accounts used in earlier verification) has one, so without this the
 * column would exist (visible via the column picker) but never actually
 * show up.
 *
 * @returns {boolean} whether this actually changed anything
 */
function folderColumnState(folder) {
  let db;
  try {
    db = folder.msgDatabase;
  } catch {
    return null;
  }
  if (!db) {
    return null;
  }
  const info = db.dBFolderInfo;
  let state = {};
  try {
    const raw = info.getCharProperty("columnStates");
    state = raw ? JSON.parse(raw) : {};
  } catch {
    state = {};
  }
  return { info, state };
}

/**
 * Sets or removes ONE custom (extension-owned) column's visibility entry on
 * one real folder's real, persisted `columnStates`. Full removal (not just
 * `visible:false`) on cleanup, since this key exists in that folder's saved
 * state only because this extension put it there — a stock-Thunderbird
 * uninstall/disable of OceanMail should leave no trace of it.
 *
 * @returns {boolean} whether this actually changed anything
 */
function setCustomColumnVisibility(folder, columnId, visible) {
  const found = folderColumnState(folder);
  if (!found) {
    return false;
  }
  const { info, state } = found;
  if (visible) {
    if (state[columnId]?.visible) {
      return false;
    }
    state[columnId] = { ...(state[columnId] || {}), visible: true, ordinal: state[columnId]?.ordinal ?? 90 };
  } else {
    if (!(columnId in state)) {
      return false;
    }
    delete state[columnId];
  }
  info.setCharProperty("columnStates", JSON.stringify(state));
  return true;
}

/**
 * Makes Thunderbird's own pre-existing NATIVE `priorityCol` (already a real
 * column driven by a message's real stored priority — see
 * `space/lib/importance.js`'s Stage 3) visible on one real folder, for the
 * "Incoming sender-provided conventional priority must be readable as
 * Important" / "a genuine high-priority test email displays as Important"
 * requirements. Unlike `setCustomColumnVisibility`, this is never reversed
 * on cleanup: `priorityCol` is stock Thunderbird state that predates this
 * extension, not an OceanMail-owned key, so forcing it back to hidden on
 * uninstall could just as easily fight a preference the user actually
 * wants to keep — leaving a genuinely useful native column visible is a
 * harmless residual, not "OceanMail column residue".
 *
 * @returns {boolean} whether this actually changed anything
 */
function makeNativePriorityColumnVisible(folder) {
  const found = folderColumnState(folder);
  if (!found) {
    return false;
  }
  const { info, state } = found;
  if (state.priorityCol?.visible) {
    return false;
  }
  state.priorityCol = { ...(state.priorityCol || {}), visible: true };
  info.setCharProperty("columnStates", JSON.stringify(state));
  return true;
}

function setSentColumnVisibility(account, visible) {
  let sentFolder;
  try {
    sentFolder = account.incomingServer.rootFolder.getFolderWithFlags(Ci.nsMsgFolderFlags.SentMail);
  } catch {
    return false;
  }
  if (!sentFolder) {
    return false;
  }
  return setCustomColumnVisibility(sentFolder, STATUS_COLUMN_ID, visible);
}

/**
 * @param {object} account
 * @returns {boolean} whether this actually changed anything on either folder
 */
function makeNativePriorityColumnVisibleForAccount(account) {
  let changed = false;
  for (const flag of [Ci.nsMsgFolderFlags.SentMail, Ci.nsMsgFolderFlags.Inbox]) {
    let folder;
    try {
      folder = account.incomingServer.rootFolder.getFolderWithFlags(flag);
    } catch {
      continue;
    }
    if (folder && makeNativePriorityColumnVisible(folder)) {
      changed = true;
    }
  }
  return changed;
}

let statusColumnRegistered = false;
// Registration happens exactly once (ThreadPaneColumns.addCustomColumn
// throws on a duplicate id), so the textCallback closure below cannot
// capture a per-call `accountsByServerKey` — it would freeze on whichever
// call happened to register it (e.g. an empty map before accounts finish
// provisioning). This module-level binding is updated on every syncFolders()
// call instead, so the already-registered callback always reads the
// current explicit OceanMail account list.
let currentAccountsByServerKey = new Map();

function ensureStatusColumn(ThreadPaneColumns) {
  if (statusColumnRegistered) {
    return;
  }
  ThreadPaneColumns.addCustomColumn(STATUS_COLUMN_ID, {
    name: "OceanMail Status",
    resizable: true,
    // Hidden by default globally — visibility is granted explicitly, per
    // real Sent folder, only for the exact OceanMail accounts syncFolders()
    // was given (see setSentColumnVisibility above).
    hidden: true,
    sortable: false,
    textCallback(msgHdr) {
      // Defensive: this callback runs for EVERY message row Thunderbird
      // renders anywhere `DEFAULT_COLUMNS` is consulted, not just our own
      // folders, so a thrown error here has a large blast radius (it would
      // not just break our column — see the column-registration comment in
      // ThreadPaneColumns.mjs). Never let it escape.
      try {
        return sentStatusText(msgHdr, currentAccountsByServerKey);
      } catch {
        return "";
      }
    }
  });
  statusColumnRegistered = true;
}

function processDocument(doc, win, accounts, extensionBaseURL, MailServices, MailE10SUtils) {
  if (!doc || doc.readyState !== "complete" || !doc.getElementById("folderTree")) {
    return 0;
  }
  ensureStyle(doc);
  ensureLocalFoldersHidden(win);
  // NOTE: every row for a given account carries the SAME data-server-key
  // (folder-tree-row.mjs sets it generically, not only on the account
  // root), so this selector alone matches every folder under the account,
  // not just its root row. The `folder.isServer` check below is what
  // actually narrows this down to the one true root row per account — do
  // not remove it.
  const accountsByServerKey = new Map(accounts.map((a) => [a.incomingServer.key, a]));
  // Refreshed every pass so the select listener's Sent-folder detection
  // always reflects the current explicit OceanMail account list, never a
  // stale snapshot from whenever the listener was first wired.
  doc._oceanmailAccountsByServerKey = accountsByServerKey;
  wireSelectListener(doc, extensionBaseURL, MailServices, MailE10SUtils);

  let inserted = 0;
  const serverRows = doc.querySelectorAll('li[is="folder-tree-row"][data-server-key]');
  for (const serverRow of serverRows) {
    const account = accountsByServerKey.get(serverRow.dataset.serverKey);
    if (!account) {
      // Not one of the explicit OceanMail accounts passed into syncFolders
      // — never touched (project-lead correction, PR #7 review).
      continue;
    }
    const folder = resolveRowFolder(serverRow, MailServices);
    if (!folder?.isServer) {
      continue;
    }
    const { inserted: rowInserted, row: availableRow } = ensureAvailableRow(
      doc,
      serverRow,
      account,
      extensionBaseURL
    );
    inserted += rowInserted;
    positionAvailableAndSaved(doc, serverRow, availableRow, MailServices);
  }
  return inserted;
}

function forEach3PaneDocument(callback) {
  let windowCount = 0;
  let tabCount = 0;
  for (const win of Services.wm.getEnumerator("mail:3pane")) {
    windowCount++;
    const tabmail = win.document.getElementById("tabmail");
    if (!tabmail) {
      continue;
    }
    for (const tabInfo of tabmail.tabInfo) {
      const chromeBrowser = tabInfo.chromeBrowser;
      if (!chromeBrowser || chromeBrowser.currentURI?.spec !== "about:3pane") {
        continue;
      }
      tabCount++;
      callback(chromeBrowser.contentDocument, chromeBrowser.contentWindow);
    }
  }
  return { windowCount, tabCount };
}

var oceanmailMailFolders = class extends ExtensionAPI {
  getAPI(context) {
    const extensionBaseURL = context.extension.baseURI.spec;

    return {
      oceanmailMailFolders: {
        /**
         * @param {string[]} oceanmailAccountIds - exact Thunderbird account
         *   keys returned by `oceanmailAccounts.ensureAccount()`. Only
         *   these accounts are ever touched — never inferred from generic
         *   IMAP-ness (project-lead correction, PR #7 review).
         */
        async syncFolders(oceanmailAccountIds) {
          const { MailServices } = ChromeUtils.importESModule(
            "resource:///modules/MailServices.sys.mjs"
          );
          const { MailE10SUtils } = ChromeUtils.importESModule(
            "resource:///modules/MailE10SUtils.sys.mjs"
          );
          const { ThreadPaneColumns } = ChromeUtils.importESModule(
            "chrome://messenger/content/ThreadPaneColumns.mjs"
          );

          const idSet = new Set(oceanmailAccountIds || []);
          const accounts = MailServices.accounts.accounts.filter((a) => idSet.has(a.key));
          currentAccountsByServerKey = new Map(accounts.map((a) => [a.incomingServer.key, a]));

          try {
            ensureStatusColumn(ThreadPaneColumns);
            for (const account of accounts) {
              setSentColumnVisibility(account, true);
              makeNativePriorityColumnVisibleForAccount(account);
            }
            ThreadPaneColumns.refreshCustomColumn(STATUS_COLUMN_ID);
          } catch (err) {
            console.error("[oceanmailMailFolders] status column registration failed:", err);
          }

          let rowsInserted = 0;
          const docErrors = [];
          const { windowCount, tabCount } = forEach3PaneDocument((doc, win) => {
            try {
              rowsInserted += processDocument(doc, win, accounts, extensionBaseURL, MailServices, MailE10SUtils);
            } catch (err) {
              docErrors.push(String(err) + (err?.stack ? `\n${err.stack}` : ""));
            }
          });

          return { windowCount, tabCount, accountCount: accounts.length, rowsInserted, docErrors };
        }
      }
    };
  }

  onShutdown(isAppShutdown) {
    if (isAppShutdown) {
      return;
    }
    try {
      forEach3PaneDocument((doc) => {
        if (!doc) {
          return;
        }
        for (const row of doc.querySelectorAll("[data-oceanmail-pseudo]")) {
          row.remove();
        }
        doc.getElementById(PSEUDO_OVERLAY_ID)?.remove();
        doc.getElementById(SENT_BANNER_ID)?.remove();
        doc.getElementById(PSEUDO_STYLE_ID)?.remove();
        doc.body?.classList.remove(PSEUDO_BODY_CLASS);
        unwireSelectListener(doc);
      });
      // Remove this extension's own column-state entry from every OceanMail
      // account's Sent folder — a stock-Thunderbird uninstall/disable of
      // OceanMail must leave no residue in that folder's saved layout, not
      // just unregister the global column definition (project-lead
      // correction, PR #7 review).
      for (const account of currentAccountsByServerKey.values()) {
        setSentColumnVisibility(account, false);
      }
      if (statusColumnRegistered) {
        const { ThreadPaneColumns } = ChromeUtils.importESModule(
          "chrome://messenger/content/ThreadPaneColumns.mjs"
        );
        ThreadPaneColumns.removeCustomColumn(STATUS_COLUMN_ID);
        statusColumnRegistered = false;
      }
      currentAccountsByServerKey = new Map();
    } catch (err) {
      console.error("[oceanmailMailFolders] cleanup on shutdown failed:", err);
    }
  }
};
