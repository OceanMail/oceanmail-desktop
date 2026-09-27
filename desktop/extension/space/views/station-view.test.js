import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mountStationView } from "./station-view.js";

// Same stale-render race class PR #1 fixed in dashboard-view.js/watch-view.js,
// but here it is entirely internal to the check-connection click handler
// (this view is mounted once, not remounted, so there is no external
// isCurrent() guard to reuse — the fix is a local per-click generation
// counter instead).

const originalFetch = globalThis.fetch;
const originalDocument = globalThis.document;

afterEach(() => {
  globalThis.fetch = originalFetch;
  globalThis.document = originalDocument;
});

class Element {
  constructor(tag) {
    this.tag = tag;
    this.listeners = {};
    this.textContent = "";
    this.value = "";
    this.nodes = new Map();
  }
  addEventListener(name, fn) {
    this.listeners[name] = fn;
  }
  setAttribute() {}
  set innerHTML(value) {
    this.html = value;
    this.nodes = new Map(
      [...value.matchAll(/id="([^"]+)"/g)].map((match) => ["#" + match[1], new Element("div")])
    );
  }
  get innerHTML() {
    return this.html ?? this.textContent;
  }
  querySelector(selector) {
    return this.nodes.get(selector);
  }
}

function mount() {
  globalThis.document = { createElement: (tag) => new Element(tag) };
  const container = new Element("main");
  mountStationView(container);
  const checkBtn = container.querySelector("#station-check-btn");
  const resultEl = container.querySelector("#station-result");
  const baseUrlInput = container.querySelector("#station-base-url");
  baseUrlInput.value = "http://127.0.0.1:8080";
  return { checkBtn, resultEl };
}

test("a stale first check does not overwrite a newer second check's result", async () => {
  const { checkBtn, resultEl } = mount();

  let releaseFirst;
  const firstGate = new Promise((resolve) => {
    releaseFirst = resolve;
  });
  let fetchCall = 0;
  globalThis.fetch = async () => {
    fetchCall += 1;
    if (fetchCall <= 2) {
      await firstGate;
      return { ok: true, status: 200, json: async () => ({ call: "first" }) };
    }
    return { ok: true, status: 200, json: async () => ({ call: "second" }) };
  };

  const firstClick = checkBtn.listeners.click();
  const secondClick = checkBtn.listeners.click();
  await secondClick;

  assert.match(resultEl.textContent, /"call": "second"/);

  releaseFirst();
  await firstClick;

  assert.match(
    resultEl.textContent,
    /"call": "second"/,
    "the stale first response must not overwrite the newer result"
  );
});

test("a stale first check's error does not overwrite a newer second check's success", async () => {
  const { checkBtn, resultEl } = mount();

  let rejectFirst;
  const firstGate = new Promise((_resolve, reject) => {
    rejectFirst = reject;
  });
  let fetchCall = 0;
  globalThis.fetch = async () => {
    fetchCall += 1;
    if (fetchCall <= 2) {
      await firstGate;
    }
    return { ok: true, status: 200, json: async () => ({ call: "second" }) };
  };

  const firstClick = checkBtn.listeners.click().catch(() => {});
  const secondClick = checkBtn.listeners.click();
  await secondClick;

  assert.match(resultEl.textContent, /"call": "second"/);

  rejectFirst(new Error("stale connection reset"));
  await firstClick;

  assert.match(
    resultEl.textContent,
    /"call": "second"/,
    "a stale failure must not overwrite the newer successful result"
  );
});

test("a single check renders its result normally", async () => {
  const { checkBtn, resultEl } = mount();
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) });

  await checkBtn.listeners.click();

  assert.match(resultEl.textContent, /"ok": true/);
});
