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

test("a render already superseded before it starts writes nothing at all", async () => {
  // Codex review finding on oceanmail-desktop#1 — see dashboard-view.test.js's
  // matching test for the full scenario.
  stubOkFetch();
  const container = { innerHTML: "already showing a completed, current render" };

  await mountWatchView(container, () => false);

  assert.equal(
    container.innerHTML,
    "already showing a completed, current render",
    "a call that is stale before it even starts must not touch the DOM at all"
  );
});

test("a render that becomes stale only after its Station reads resolve still shows its own loading state, never stale final content", async () => {
  stubOkFetch();
  const container = { innerHTML: "" };
  let checks = 0;
  const isCurrent = () => checks++ === 0;

  await mountWatchView(container, isCurrent);

  assert.equal(container.innerHTML, LOADING_HTML);
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
