import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mountWatchView } from "./watch-view.js";

// Same stale-async-response race as dashboard-view.test.js: `mountWatchView`
// is the other branch `renderStationDashboardSection` (space.js) can call
// again before a prior call's Station reads resolve.

const originalFetch = globalThis.fetch;
const LOADING_HTML = `<p class="placeholder-copy">Loading Watch view…</p>`;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function stubOkFetch() {
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({}) });
}

test("a superseded watch render discards its result instead of overwriting a newer one", async () => {
  stubOkFetch();
  const container = { innerHTML: "" };

  await mountWatchView(container, () => false);

  assert.equal(
    container.innerHTML,
    LOADING_HTML,
    "an already-superseded render must not replace whatever the current render left in place"
  );
});

test("a still-current watch render replaces the loading placeholder", async () => {
  stubOkFetch();
  const container = { innerHTML: "" };

  await mountWatchView(container, () => true);

  assert.notEqual(container.innerHTML, LOADING_HTML);
  assert.ok(container.innerHTML.includes("watch-view"));
});

test("mountWatchView defaults to current when no isCurrent guard is given", async () => {
  stubOkFetch();
  const container = { innerHTML: "" };

  await mountWatchView(container);

  assert.notEqual(container.innerHTML, LOADING_HTML);
});
