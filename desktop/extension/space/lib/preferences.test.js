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

test("createInMemoryStorageArea.get with no keys returns everything stored", async () => {
  const storageArea = createInMemoryStorageArea({ theme: "dark" });
  const all = await storageArea.get();
  assert.deepEqual(all, { theme: "dark" });
});
