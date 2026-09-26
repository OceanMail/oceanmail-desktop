import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDashboardModel, computeWarnings } from "./dashboard-model.js";

const NOW = 2_000_000;

test("buildDashboardModel reports unreachable Station truthfully rather than zeroing state", () => {
  const model = buildDashboardModel({
    health: null,
    station: null,
    outboundQueue: null,
    observerStatus: null,
    storageSecurity: null,
    internetOnline: true,
    nowUnix: NOW
  });
  assert.equal(model.stationConnectivity.reachable, false);
  assert.equal(model.queue, null);
  assert.equal(model.observer, null);
  assert.equal(model.security, null);
  assert.ok(model.warnings.some((w) => /not reachable/.test(w.message)));
});

test("buildDashboardModel surfaces real health/station fields when reachable", () => {
  const model = buildDashboardModel({
    health: { status: "ok", station_id: "abc-123", service_version: "0.1.0", api_version: "v1" },
    station: { capabilities: { api_authentication: false } },
    outboundQueue: null,
    observerStatus: null,
    storageSecurity: null,
    internetOnline: true,
    nowUnix: NOW
  });
  assert.equal(model.stationConnectivity.reachable, true);
  assert.equal(model.stationConnectivity.stationId, "abc-123");
  assert.deepEqual(model.capabilities, { api_authentication: false });
});

test("buildDashboardModel formats real queue observation with freshness", () => {
  const model = buildDashboardModel({
    health: { status: "ok", station_id: "s", service_version: "v", api_version: "v1" },
    station: null,
    outboundQueue: { source: "postfix", observed_at_unix: NOW - 420, entries: [{}, {}] },
    observerStatus: null,
    storageSecurity: null,
    internetOnline: true,
    nowUnix: NOW
  });
  assert.equal(model.queue.entryCount, 2);
  assert.equal(model.queue.freshness, "last contact 7m");
});

test("buildDashboardModel never invents Grid freshness, budgets, or regional data", () => {
  const model = buildDashboardModel({
    health: { status: "ok", station_id: "s", service_version: "v", api_version: "v1" },
    station: {},
    outboundQueue: {},
    observerStatus: {},
    storageSecurity: {},
    internetOnline: true,
    nowUnix: NOW
  });
  assert.equal(model.gridFreshness, null);
  assert.equal(model.budgets, null);
  assert.equal(model.regionalDataVersion, null);
});

test("buildDashboardModel reflects this device's own internet signal distinctly from Station", () => {
  const online = buildDashboardModel({
    health: null,
    station: null,
    outboundQueue: null,
    observerStatus: null,
    storageSecurity: null,
    internetOnline: true,
    nowUnix: NOW
  });
  const offline = buildDashboardModel({
    health: null,
    station: null,
    outboundQueue: null,
    observerStatus: null,
    storageSecurity: null,
    internetOnline: false,
    nowUnix: NOW
  });
  assert.equal(online.internet.online, true);
  assert.equal(offline.internet.online, false);
});

test("computeWarnings flags repeated observer failures", () => {
  const warnings = computeWarnings({
    stationConnectivity: { reachable: true },
    observer: { consecutiveFailures: 3 },
    security: null
  });
  assert.ok(warnings.some((w) => /failed 3 time/.test(w.message)));
});

test("computeWarnings flags non-production storage security as informational, not a warning", () => {
  const warnings = computeWarnings({
    stationConnectivity: { reachable: true },
    observer: null,
    security: { productionStorageReady: false }
  });
  const match = warnings.find((w) => /lab-only/.test(w.message));
  assert.ok(match);
  assert.equal(match.severity, "info");
});

test("computeWarnings produces no warnings when everything is healthy", () => {
  const warnings = computeWarnings({
    stationConnectivity: { reachable: true },
    observer: { consecutiveFailures: 0 },
    security: { productionStorageReady: true }
  });
  assert.deepEqual(warnings, []);
});
