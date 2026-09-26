// Persisted OceanMail page preferences: theme and Watch/Compact mode.
// Backed by browser.storage.local so choices survive restarts, but the
// storage area is injected so this module has no hard dependency on the
// `browser` global and is directly unit testable.
//
// `navCollapsed` was removed with the native-Thunderbird-shell pivot
// (docs/decisions/0007-native-thunderbird-shell.md): there is no longer an
// in-page primary navigation rail to collapse — navigation is exclusively
// Thunderbird's native Spaces toolbar.

export const DEFAULT_PREFERENCES = Object.freeze({
  theme: "system", // "system" | "light" | "dark"
  watchMode: false
});

const VALID_THEMES = new Set(["system", "light", "dark"]);

/**
 * Merge a possibly-partial/legacy stored object with current defaults so a
 * fresh install, an older snapshot, or a corrupted partial write all produce
 * a complete, valid preferences object.
 *
 * @param {object} [stored]
 * @returns {typeof DEFAULT_PREFERENCES}
 */
export function mergeWithDefaults(stored) {
  const merged = { ...DEFAULT_PREFERENCES, ...(stored || {}) };
  // Drop a legacy `navCollapsed` key from an older stored snapshot rather
  // than carrying it forward as dead state.
  delete merged.navCollapsed;
  if (!VALID_THEMES.has(merged.theme)) {
    merged.theme = DEFAULT_PREFERENCES.theme;
  }
  if (typeof merged.watchMode !== "boolean") {
    merged.watchMode = DEFAULT_PREFERENCES.watchMode;
  }
  return merged;
}

/**
 * @param {{get: (keys: string[]) => Promise<object>, set: (values: object) => Promise<void>}} storageArea
 *   Matches the shape of browser.storage.local. Pass a fake in-memory
 *   implementation in tests.
 */
export function createPreferencesStore(storageArea) {
  async function load() {
    const stored = await storageArea.get(Object.keys(DEFAULT_PREFERENCES));
    return mergeWithDefaults(stored);
  }

  async function set(partial) {
    const current = await load();
    const next = mergeWithDefaults({ ...current, ...partial });
    await storageArea.set(next);
    return next;
  }

  return { load, set };
}

/**
 * A minimal in-memory storage area matching browser.storage.local's Promise
 * based get/set contract. Used as the default when no real extension
 * storage is available (e.g. under node:test, or before browser.storage
 * resolves), and directly reusable by tests.
 */
export function createInMemoryStorageArea(initial = {}) {
  let data = { ...initial };
  return {
    async get(keys) {
      if (!keys) {
        return { ...data };
      }
      const result = {};
      for (const key of keys) {
        if (key in data) {
          result[key] = data[key];
        }
      }
      return result;
    },
    async set(values) {
      data = { ...data, ...values };
    }
  };
}
