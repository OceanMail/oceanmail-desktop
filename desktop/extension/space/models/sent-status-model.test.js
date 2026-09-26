import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mapStationHistoryEntryToRow,
  buildRealSentStatusRows,
  sortForDisplay,
  validNextActions,
  combineSentStatusRows
} from "./sent-status-model.js";

test("mapStationHistoryEntryToRow maps a still-queued Postfix entry to state=queued", () => {
  const row = mapStationHistoryEntryToRow({
    observation_id: "obs-1",
    queue_id: "ABC123",
    arrival_time_unix: 1000,
    first_seen_at_unix: 1000,
    last_seen_at_unix: 1005,
    sender: "alice@station.test",
    message_size: 4096,
    recipients: [{ address: "bob@station.test" }],
    present_in_postfix: true,
    left_postfix_at_unix: null,
    evidence_state: "first_seen"
  });
  assert.equal(row.state, "queued");
  assert.equal(row.direction, "outgoing");
  assert.equal(row.transportClass, "unclassified");
  assert.equal(row.important, null);
  assert.equal(row.bytesTransferred, 0);
  assert.equal(row.transmittedAtUnix, null);
  assert.equal(row.isFixture, false);
  assert.deepEqual(row.recipients, ["bob@station.test"]);
});

test("mapStationHistoryEntryToRow maps a departed Postfix entry to left_local_queue, never transmitted/delivered", () => {
  const row = mapStationHistoryEntryToRow({
    observation_id: "obs-2",
    queue_id: "DEF456",
    arrival_time_unix: 1000,
    first_seen_at_unix: 1000,
    last_seen_at_unix: 1100,
    sender: "alice@station.test",
    message_size: 2048,
    recipients: [{ address: "bob@station.test" }],
    present_in_postfix: false,
    left_postfix_at_unix: 1099,
    evidence_state: "left_postfix_queue"
  });
  assert.equal(row.state, "left_local_queue");
  // Critical truthfulness rule: leaving Postfix is local handoff evidence
  // only — never claim full bytes transferred or a transport-completion
  // timestamp from it. The raw evidence is kept separately.
  assert.equal(row.bytesTransferred, null);
  assert.equal(row.transmittedAtUnix, null);
  assert.equal(row.leftLocalQueueAtUnix, 1099);
  assert.equal(row.confirmedReceiptAtUnix, null);
});

test("mapStationHistoryEntryToRow reports unknown state when evidence is inconclusive", () => {
  const row = mapStationHistoryEntryToRow({
    observation_id: "obs-3",
    sender: "alice@station.test",
    message_size: 10,
    recipients: [],
    present_in_postfix: false,
    left_postfix_at_unix: null
  });
  assert.equal(row.state, "unknown");
  assert.equal(row.bytesTransferred, null);
});

test("buildRealSentStatusRows maps a whole history array and marks all rows non-fixture", () => {
  const rows = buildRealSentStatusRows([
    { observation_id: "a", sender: "x", message_size: 1, recipients: [], present_in_postfix: true },
    { observation_id: "b", sender: "y", message_size: 1, recipients: [], present_in_postfix: false, left_postfix_at_unix: 5 }
  ]);
  assert.equal(rows.length, 2);
  assert.ok(rows.every((row) => row.isFixture === false));
});

test("buildRealSentStatusRows tolerates an empty/missing history array", () => {
  assert.deepEqual(buildRealSentStatusRows([]), []);
  assert.deepEqual(buildRealSentStatusRows(undefined), []);
});

function row(overrides) {
  return {
    id: "r",
    direction: "outgoing",
    transportClass: "ordinary",
    important: null,
    state: "queued",
    sender: "s",
    recipients: [],
    bytesTotal: 0,
    bytesTransferred: 0,
    firstSeenUnix: 0,
    lastSeenUnix: null,
    transmittedAtUnix: null,
    confirmedReceiptAtUnix: null,
    isFixture: false,
    waitingReason: null,
    nextAction: null,
    ...overrides
  };
}

test("sortForDisplay orders Emergency ahead of ordinary/unclassified traffic", () => {
  const rows = [
    row({ id: "ordinary-1", transportClass: "ordinary", firstSeenUnix: 1 }),
    row({ id: "unclassified-1", transportClass: "unclassified", firstSeenUnix: 2 }),
    row({ id: "emergency", transportClass: "emergency", firstSeenUnix: 5 })
  ];
  const sorted = sortForDisplay(rows).map((r) => r.id);
  assert.deepEqual(sorted, ["emergency", "ordinary-1", "unclassified-1"]);
});

test("sortForDisplay treats ordinary and unclassified as the same band, ordered only by age", () => {
  const rows = [
    row({ id: "unclassified", transportClass: "unclassified", firstSeenUnix: 100 }),
    row({ id: "ordinary", transportClass: "ordinary", firstSeenUnix: 50 })
  ];
  const sorted = sortForDisplay(rows).map((r) => r.id);
  assert.deepEqual(sorted, ["ordinary", "unclassified"]);
});

test("sortForDisplay breaks ties within a band by first-seen time", () => {
  const rows = [
    row({ id: "later", transportClass: "ordinary", firstSeenUnix: 200 }),
    row({ id: "earlier", transportClass: "ordinary", firstSeenUnix: 100 })
  ];
  const sorted = sortForDisplay(rows).map((r) => r.id);
  assert.deepEqual(sorted, ["earlier", "later"]);
});

test("important metadata never affects sortForDisplay's order", () => {
  const rows = [
    row({ id: "important-later", transportClass: "ordinary", important: true, firstSeenUnix: 200 }),
    row({ id: "not-important-earlier", transportClass: "ordinary", important: false, firstSeenUnix: 100 })
  ];
  const sorted = sortForDisplay(rows).map((r) => r.id);
  // Order follows age alone — marking a later message Important must not
  // move it ahead of an earlier, non-Important one.
  assert.deepEqual(sorted, ["not-important-earlier", "important-later"]);
});

test("an Important ordinary message never outranks an Emergency message regardless of importance", () => {
  const rows = [
    row({ id: "ordinary-important", transportClass: "ordinary", important: true, firstSeenUnix: 1 }),
    row({ id: "emergency-not-important", transportClass: "emergency", important: false, firstSeenUnix: 999 })
  ];
  const sorted = sortForDisplay(rows).map((r) => r.id);
  assert.deepEqual(sorted, ["emergency-not-important", "ordinary-important"]);
});

test("Important and non-Important ordinary messages remain the same transport class", () => {
  const important = row({ id: "a", transportClass: "ordinary", important: true });
  const notImportant = row({ id: "b", transportClass: "ordinary", important: false });
  assert.equal(important.transportClass, notImportant.transportClass);
});

test("validNextActions exposes only actions valid for the row's current state", () => {
  assert.deepEqual(validNextActions(row({ state: "queued" })), ["cancel"]);
  assert.deepEqual(validNextActions(row({ state: "left_local_queue" })), []);
  assert.deepEqual(validNextActions(row({ state: "failed" })), ["retry"]);
  assert.deepEqual(validNextActions(row({ state: "cancelled" })), ["restart"]);
});

test("combineSentStatusRows marks fixture rows and applies display ordering across both sources", () => {
  const real = [row({ id: "real-ordinary", transportClass: "ordinary", isFixture: false })];
  const fixture = [row({ id: "fixture-emergency", transportClass: "emergency", isFixture: false })];
  const combined = combineSentStatusRows(real, fixture);
  assert.equal(combined.length, 2);
  assert.equal(combined[0].id, "fixture-emergency");
  assert.equal(combined[0].isFixture, true, "fixture rows must always be marked");
  assert.equal(combined[1].isFixture, false);
});
