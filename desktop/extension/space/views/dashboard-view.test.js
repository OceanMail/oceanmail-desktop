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

test("a render already superseded before it starts writes nothing at all", async () => {
  // Codex review finding on oceanmail-desktop#1: checking `isCurrent()` only
  // after `Promise.all` still let an already-stale call (e.g. one still
  // awaiting `preferences.load()` in space.js while a newer call finished
  // first) stomp a correct, already-rendered view with its own "Loading…"
  // placeholder — which then never gets replaced, since that stale call's
  // own post-`Promise.all` check correctly stops it from writing again.
  stubDom();
  stubOkFetch();
  const container = { innerHTML: "already showing a completed, current render" };

  await mountDashboardView(container, () => false);

  assert.equal(
    container.innerHTML,
    "already showing a completed, current render",
    "a call that is stale before it even starts must not touch the DOM at all"
  );
});

test("a render that becomes stale only after its Station reads resolve still shows its own loading state, never stale final content", async () => {
  stubDom();
  stubOkFetch();
  const container = { innerHTML: "" };
  let checks = 0;
  // True on the entry check (so this call proceeds and writes its own
  // loading placeholder), false on every check after — i.e. it is
  // superseded while its Promise.all is in flight, exactly like the
  // original (already-fixed) race this module's docs describe.
  const isCurrent = () => checks++ === 0;

  await mountDashboardView(container, isCurrent);

  assert.equal(
    container.innerHTML,
    LOADING_HTML,
    "this call legitimately owned the container when it wrote the placeholder; " +
      "it must not then overwrite a newer call's real content, but its own " +
      "placeholder write was not stale at the time it happened"
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
