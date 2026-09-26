import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mountDashboardView } from "./dashboard-view.js";

// Reproduces a stale-async-response race: `renderStationDashboardSection`
// (space.js) can call this again (the user re-clicks the Watch/Dashboard
// toggle) before a prior call's Station reads have resolved. Without the
// `isCurrent` guard, a slower, now-superseded call could overwrite a more
// recent render with stale data once its own reads finally resolved.

const originalFetch = globalThis.fetch;
const originalDocument = globalThis.document;
const LOADING_HTML = `<h1>Dashboard</h1><p class="placeholder-copy">Loading Station state…</p>`;

afterEach(() => {
  globalThis.fetch = originalFetch;
  globalThis.document = originalDocument;
});

function stubDom() {
  // `escapeHtml` in dashboard-view.js needs a `document.createElement` that
  // round-trips `textContent` through `innerHTML` well enough for a plain
  // string; this minimal stub does not escape, which is fine — these tests
  // only inspect which branch rendered, not exact HTML-escaping output.
  globalThis.document = {
    createElement: () => {
      const el = { _text: "" };
      Object.defineProperty(el, "textContent", {
        set(value) {
          this._text = value;
        }
      });
      Object.defineProperty(el, "innerHTML", { get() { return this._text; } });
      return el;
    }
  };
}

function stubOkFetch() {
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({}) });
}

test("a superseded dashboard render discards its result instead of overwriting a newer one", async () => {
  stubDom();
  stubOkFetch();
  const container = { innerHTML: "" };

  await mountDashboardView(container, () => false);

  assert.equal(
    container.innerHTML,
    LOADING_HTML,
    "an already-superseded render must not replace whatever the current render left in place"
  );
});

test("a still-current dashboard render replaces the loading placeholder", async () => {
  stubDom();
  stubOkFetch();
  const container = { innerHTML: "" };

  await mountDashboardView(container, () => true);

  assert.notEqual(container.innerHTML, LOADING_HTML);
  assert.ok(container.innerHTML.includes("Station connectivity"));
});

test("mountDashboardView defaults to current when no isCurrent guard is given", async () => {
  stubDom();
  stubOkFetch();
  const container = { innerHTML: "" };

  await mountDashboardView(container);

  assert.notEqual(container.innerHTML, LOADING_HTML);
});
