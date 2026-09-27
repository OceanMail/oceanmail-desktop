import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { Implemented, NotYetAvailable } from "./station-client.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function mockFetch(status, body) {
  globalThis.fetch = async (url) => ({
    ok: status >= 200 && status < 300,
    status,
    url,
    json: async () => body
  });
}

test("Implemented.health calls GET /api/v1/health and returns parsed JSON", async () => {
  let requestedUrl;
  globalThis.fetch = async (url, options) => {
    requestedUrl = url;
    assert.equal(options.method, "GET");
    return { ok: true, status: 200, json: async () => ({ status: "ok" }) };
  };

  const result = await Implemented.health("http://127.0.0.1:8080");

  assert.equal(requestedUrl, "http://127.0.0.1:8080/api/v1/health");
  assert.deepEqual(result, { status: "ok" });
});

test("Implemented.health uses the default base URL when none is given", async () => {
  let requestedUrl;
  globalThis.fetch = async (url) => {
    requestedUrl = url;
    return { ok: true, status: 200, json: async () => ({}) };
  };

  await Implemented.health();

  assert.equal(requestedUrl, "http://127.0.0.1:8080/api/v1/health");
});

test("Implemented.station calls GET /api/v1/station", async () => {
  let requestedUrl;
  globalThis.fetch = async (url) => {
    requestedUrl = url;
    return { ok: true, status: 200, json: async () => ({ name: "station" }) };
  };

  const result = await Implemented.station("http://127.0.0.1:8080");

  assert.equal(requestedUrl, "http://127.0.0.1:8080/api/v1/station");
  assert.deepEqual(result, { name: "station" });
});

for (const [fn, path] of [
  [Implemented.outboundQueue, "/api/v1/queues/outbound"],
  [Implemented.outboundQueueHistory, "/api/v1/queues/outbound/history"],
  [Implemented.outboundQueueObserver, "/api/v1/queues/outbound/observer"],
  [Implemented.storageSecurity, "/api/v1/security/storage"]
]) {
  test(`Implemented call hits ${path}`, async () => {
    let requestedUrl;
    globalThis.fetch = async (url) => {
      requestedUrl = url;
      return { ok: true, status: 200, json: async () => ({}) };
    };

    await fn("http://127.0.0.1:8080");

    assert.equal(requestedUrl, `http://127.0.0.1:8080${path}`);
  });
}

test("Implemented.health throws with the HTTP status on a non-ok response", async () => {
  mockFetch(503, {});

  await assert.rejects(
    () => Implemented.health("http://127.0.0.1:8080"),
    /HTTP 503/
  );
});

test("Implemented.health bounds its request with an AbortSignal so a hung Station cannot hang the caller forever", async () => {
  let requestedSignal;
  globalThis.fetch = async (url, options) => {
    requestedSignal = options.signal;
    return { ok: true, status: 200, json: async () => ({}) };
  };

  await Implemented.health("http://127.0.0.1:8080");

  assert.ok(requestedSignal instanceof AbortSignal, "getJson must pass an AbortSignal to fetch");
});

test("Implemented.health surfaces a clear timeout message instead of a raw AbortError", async () => {
  globalThis.fetch = async () => {
    const timeoutError = new Error("The operation was aborted due to timeout");
    timeoutError.name = "TimeoutError";
    throw timeoutError;
  };

  await assert.rejects(
    () => Implemented.health("http://127.0.0.1:8080"),
    /did not respond within \d+ms/
  );
});

test("Implemented.health rethrows a non-timeout fetch error unchanged", async () => {
  globalThis.fetch = async () => {
    throw new Error("network unreachable");
  };

  await assert.rejects(
    () => Implemented.health("http://127.0.0.1:8080"),
    /network unreachable/
  );
});

test("NotYetAvailable functions all reject without calling fetch", async () => {
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    throw new Error("fetch should not be called");
  };

  const capabilities = [
    "authenticate",
    "availableManifest",
    "submitOutboundMessage",
    "budgets",
    "emergencySubmit"
  ];

  for (const capability of capabilities) {
    await assert.rejects(
      () => NotYetAvailable[capability](),
      /does not yet expose/
    );
  }
  assert.equal(fetchCalled, false);
});
