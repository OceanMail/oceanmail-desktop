import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_PREFERENCES,
  mergeWithDefaults,
  createPreferencesStore,
  createInMemoryStorageArea
} from "./preferences.js";

test("mergeWithDefaults fills in a completely empty stored object", () => {
  assert.deepEqual(mergeWithDefaults(undefined), DEFAULT_PREFERENCES);
  assert.deepEqual(mergeWithDefaults({}), DEFAULT_PREFERENCES);
});

test("mergeWithDefaults preserves valid stored values", () => {
  const merged = mergeWithDefaults({ theme: "dark", watchMode: true });
  assert.deepEqual(merged, { theme: "dark", watchMode: true });
});

test("mergeWithDefaults falls back to defaults for invalid/corrupt values", () => {
  const merged = mergeWithDefaults({ theme: "purple", watchMode: 1 });
  assert.deepEqual(merged, DEFAULT_PREFERENCES);
});

test("mergeWithDefaults drops a legacy navCollapsed key rather than carrying it forward", () => {
  const merged = mergeWithDefaults({ navCollapsed: true, theme: "dark" });
  assert.deepEqual(merged, { theme: "dark", watchMode: false });
});

test("createPreferencesStore loads defaults from empty storage", async () => {
  const store = createPreferencesStore(createInMemoryStorageArea());
  const loaded = await store.load();
  assert.deepEqual(loaded, DEFAULT_PREFERENCES);
});

test("createPreferencesStore persists partial updates across load calls", async () => {
  const storageArea = createInMemoryStorageArea();
  const store = createPreferencesStore(storageArea);

  await store.set({ watchMode: true });
  let loaded = await store.load();
  assert.equal(loaded.watchMode, true);
  assert.equal(loaded.theme, "system");

  await store.set({ theme: "dark" });
  loaded = await store.load();
  assert.equal(loaded.watchMode, true, "earlier preference must not be lost");
  assert.equal(loaded.theme, "dark");
});

test("createPreferencesStore.set serializes concurrent writers so neither change is lost", async () => {
  // A storage area whose first get() resolves slower than the second
  // set()'s entire read-modify-write reproduces the interleaving an
  // unserialized read-modify-write would lose a write to: the second
  // writer's load() would otherwise run before the first writer's set()
  // lands, so it would merge against stale (empty) state and overwrite it.
  let getCalls = 0;
  const data = {};
  const storageArea = {
    async get(keys) {
      getCalls += 1;
      if (getCalls === 1) {
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      const result = {};
      for (const key of keys) {
        if (key in data) result[key] = data[key];
      }
      return result;
    },
    async set(values) {
      Object.assign(data, values);
    }
  };
  const store = createPreferencesStore(storageArea);

  const first = store.set({ watchMode: true });
  const second = store.set({ theme: "dark" });
  await Promise.all([first, second]);

  const finalState = await store.load();
  assert.equal(finalState.watchMode, true, "first writer's change must survive");
  assert.equal(finalState.theme, "dark", "second writer's change must survive");
});

test("createPreferencesStore.set keeps writing after an earlier write's storage rejects", async () => {
  let calls = 0;
  const data = {};
  const storageArea = {
    async get(keys) {
      const result = {};
      for (const key of keys) {
        if (key in data) result[key] = data[key];
      }
      return result;
    },
    async set(values) {
      calls += 1;
      if (calls === 1) {
        throw new Error("storage unavailable");
      }
      Object.assign(data, values);
    }
  };
  const store = createPreferencesStore(storageArea);

  await assert.rejects(() => store.set({ watchMode: true }), /storage unavailable/);
  await store.set({ theme: "dark" });

  const finalState = await store.load();
  assert.equal(finalState.theme, "dark", "a later write must not be stuck behind an earlier failed one");
});

test("two independent store instances (two windows) don't clobber each other's key", async () => {
  // Each OceanMail window builds its own createPreferencesStore, so each
  // gets its own writeQueue — that queue can't serialize across windows.
  // A shared backing storage area with a slow first get() reproduces two
  // windows racing: window A sets watchMode while window B, reading storage
  // before A's write lands, sets theme. Writing only the changed key back
  // (rather than each window's whole merged snapshot) means B's stale copy
  // of watchMode is never written, so A's change survives.
  let getCalls = 0;
  const data = {};
  const storageArea = {
    async get(keys) {
      getCalls += 1;
      if (getCalls === 1) {
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      const result = {};
      for (const key of keys) {
        if (key in data) result[key] = data[key];
      }
      return result;
    },
    async set(values) {
      Object.assign(data, values);
    }
  };
  const windowA = createPreferencesStore(storageArea);
  const windowB = createPreferencesStore(storageArea);

  const fromA = windowA.set({ watchMode: true });
  const fromB = windowB.set({ theme: "dark" });
  await Promise.all([fromA, fromB]);

  assert.equal(data.watchMode, true, "window A's change must survive window B's concurrent write");
  assert.equal(data.theme, "dark", "window B's change must survive");
});

test("createInMemoryStorageArea.get with no keys returns everything stored", async () => {
  const storageArea = createInMemoryStorageArea({ theme: "dark" });
  const all = await storageArea.get();
  assert.deepEqual(all, { theme: "dark" });
});
