// Tests for background.js's OceanMail initialization orchestration —
// local verification workstation live-defect correction (PR #7, "OceanMail startup initialization
// is event-lazy"): the root cause was Thunderbird's MV3 lifecycle only
// eagerly starting a background page on cold launch when it has a
// registered `runtime.onStartup` listener; without one, a background with
// other persisted listeners (composeAction.onClicked, etc.) is only
// *primed*, waking lazily whenever one of THOSE fires instead (which is
// exactly what "opening New Message wakes OceanMail" turned out to be).
//
// background.js has no Thunderbird-privileged dependencies (no Ci/Services/
// ChromeUtils/ExtensionAPI — see mail-folders.js for those) — it only calls
// the public `browser.*` WebExtension API, which makes it genuinely
// mockable in plain Node, unlike experiment/mail-folders.js (a privileged
// Experiment script; its own idempotency guards — statusColumnRegistered,
// the `doc.getElementById(rowId)` check in ensureAvailableRow, the named-
// handler-plus-dataset-flag guard in wireSelectListener — are documented
// and code-reviewed here rather than unit-tested, and are exactly what
// verification workstation's live "restart: no duplicate Spaces/pseudo-folders/columns/listener
// behavior" re-verification checks directly).
//
// Each test imports background.js fresh via a uniquely-querystringed
// specifier (a distinct resolved module URL forces Node's ESM loader to
// re-evaluate the module, including its top-level
// `initializeOceanMail()`/`runtime.onStartup.addListener()` calls, against
// that test's own `globalThis.browser` mock) so tests never share module
// state.

import { test } from "node:test";
import assert from "node:assert/strict";

let importCounter = 0;

/**
 * @param {object} [overrides] - per-test overrides merged onto the mock's
 *   `browser.accounts.list()` result, keyed the same way.
 */
function installBrowserMock({ existingAccounts = [] } = {}) {
  const calls = {
    spacesQuery: 0,
    spacesCreate: [],
    spacesRemove: [],
    ensureAccount: [],
    foldersQuery: [],
    foldersCreate: [],
    syncFolders: []
  };
  const existingSpaces = [];
  const startupListeners = [];
  const savedFoldersByAccount = new Set();

  globalThis.browser = {
    runtime: {
      onStartup: {
        addListener(fn) {
          startupListeners.push(fn);
        }
      }
    },
    spaces: {
      async query() {
        calls.spacesQuery++;
        return existingSpaces.slice();
      },
      async create(name) {
        calls.spacesCreate.push(name);
        const space = { id: `space-${name}`, name };
        existingSpaces.push(space);
        return space;
      },
      async remove(id) {
        calls.spacesRemove.push(id);
      }
    },
    oceanmailAccounts: {
      async ensureAccount(config) {
        calls.ensureAccount.push(config.emailAddress);
        return { created: true, accountId: `acct-${config.emailAddress}` };
      }
    },
    accounts: {
      async list() {
        return existingAccounts;
      }
    },
    folders: {
      async query({ accountId }) {
        calls.foldersQuery.push(accountId);
        return savedFoldersByAccount.has(accountId)
          ? [{ name: "Saved", path: "/Saved" }]
          : [];
      },
      async create(rootFolderId, name) {
        calls.foldersCreate.push({ rootFolderId, name });
        // Find which account this root belongs to, to make a second
        // ensureSavedFolders() pass correctly see it as already existing —
        // mirrors real Thunderbird behavior closely enough for this test.
        const account = existingAccounts.find((a) => a.rootFolder.id === rootFolderId);
        if (account) {
          savedFoldersByAccount.add(account.id);
        }
      }
    },
    oceanmailMailFolders: {
      async syncFolders(ids) {
        calls.syncFolders.push(ids);
        return { rowsInserted: 0, docErrors: [] };
      }
    },
    compose: {
      async getComposeDetails() {
        return { priority: "normal" };
      },
      async setComposeDetails() {},
      onComposeStateChanged: { addListener() {} }
    },
    composeAction: {
      onClicked: { addListener() {} },
      async setIcon() {},
      async setTitle() {}
    }
  };

  return { calls, startupListeners };
}

function freshImport() {
  importCounter += 1;
  return import(`./background.js?test-case=${importCounter}`);
}

test("initializeOceanMail is idempotent: a second call performs no additional API work", async () => {
  const { calls } = installBrowserMock({
    existingAccounts: [
      { id: "acct-ship@station.test", name: "Ship", rootFolder: { id: "root-ship" } },
      { id: "acct-bob@station.test", name: "Bob", rootFolder: { id: "root-bob" } }
    ]
  });

  const mod = await freshImport();
  // The top-level call at module-evaluation time already started this;
  // awaiting it here waits for that same in-flight work rather than
  // starting a new run.
  await mod.initializeOceanMail();

  const afterFirstRun = JSON.parse(JSON.stringify(calls));
  assert.equal(afterFirstRun.ensureAccount.length, 2, "both accounts provisioned once");
  assert.equal(afterFirstRun.spacesCreate.length, 2, "both Spaces created once");
  assert.equal(afterFirstRun.foldersCreate.length, 2, "Saved created once per account");
  assert.equal(afterFirstRun.syncFolders.length, 1, "folder sync run exactly once");

  // Simulate the exact scenario this correction targets: `runtime.onStartup`
  // firing (or any other caller) invoking initializeOceanMail() again.
  await mod.initializeOceanMail();

  assert.deepEqual(calls, afterFirstRun, "no additional Spaces/accounts/folders/sync calls on a second call");
});

test("runtime.onStartup is registered — the exact signal that makes Thunderbird eagerly start this background on a cold launch", async () => {
  const { startupListeners } = installBrowserMock({ existingAccounts: [] });
  const mod = await freshImport();
  await mod.initializeOceanMail();
  assert.equal(startupListeners.length, 1);
  assert.equal(typeof startupListeners[0], "function");
});

test("ensureOceanMailSpaces does not duplicate-create a Space that already exists", async () => {
  installBrowserMock({ existingAccounts: [] });
  const mod = await freshImport();
  await mod.initializeOceanMail();

  // A later call (e.g. from a second initializeOceanMail-style trigger, or
  // just calling this helper directly) must see the Spaces created by the
  // first pass and skip them.
  const calls2 = [];
  const originalCreate = globalThis.browser.spaces.create;
  globalThis.browser.spaces.create = async (...args) => {
    calls2.push(args[0]);
    return originalCreate(...args);
  };
  await mod.ensureOceanMailSpaces();
  assert.deepEqual(calls2, [], "no Space re-created once it already exists");
});

test("ensureSavedFolders only touches the exact given account ids — unrelated accounts (e.g. a stock Gmail/IMAP account sharing the profile) are never queried or mutated", async () => {
  // Empty at import time so the module's own top-level auto-init doesn't
  // already create Ship's Saved folder before this test gets to observe
  // its own explicit call in isolation (see the similarly-shaped test
  // below for the same reasoning).
  const existingAccounts = [];
  const { calls } = installBrowserMock({ existingAccounts });
  const mod = await freshImport();
  await mod.initializeOceanMail();
  existingAccounts.push(
    { id: "acct-ship@station.test", name: "Ship", rootFolder: { id: "root-ship" } },
    { id: "acct-unrelated-gmail", name: "Someone's Gmail", rootFolder: { id: "root-gmail" } }
  );

  const results = await mod.ensureSavedFolders(["acct-ship@station.test"]);

  assert.deepEqual(calls.foldersQuery, ["acct-ship@station.test"], "only the OceanMail account is queried");
  assert.equal(calls.foldersCreate.length, 1);
  assert.equal(calls.foldersCreate[0].rootFolderId, "root-ship");
  assert.deepEqual(results, [{ account: "Ship", created: true }]);
});

test("ensureSavedFolders does not duplicate-create Saved once it already exists", async () => {
  // Empty at import time so the module's own top-level auto-init (which
  // provisions the hardcoded Ship/Bob accounts and immediately calls
  // ensureSavedFolders for them) has no accounts to act on yet — this test
  // wants to observe two of its OWN explicit calls in isolation.
  const shipAccount = { id: "acct-ship@station.test", name: "Ship", rootFolder: { id: "root-ship" } };
  const existingAccounts = [];
  const { calls } = installBrowserMock({ existingAccounts });
  const mod = await freshImport();
  await mod.initializeOceanMail();
  existingAccounts.push(shipAccount);

  await mod.ensureSavedFolders(["acct-ship@station.test"]);
  assert.equal(calls.foldersCreate.length, 1);

  const second = await mod.ensureSavedFolders(["acct-ship@station.test"]);
  assert.equal(calls.foldersCreate.length, 1, "no second Saved folder created");
  assert.deepEqual(second, [{ account: "Ship", created: false }]);
});

test("oceanMailAccountIds extracts exactly the accountId field ensureAccount() returned, in order", async () => {
  // Pure function — the mock only exists so importing the module (which
  // runs its top-level initializeOceanMail() call) doesn't throw.
  installBrowserMock({ existingAccounts: [] });
  const mod = await freshImport();
  const results = [
    { created: true, accountId: "acct-a" },
    { created: false, accountId: "acct-b" }
  ];
  assert.deepEqual(mod.oceanMailAccountIds(results), ["acct-a", "acct-b"]);
});
