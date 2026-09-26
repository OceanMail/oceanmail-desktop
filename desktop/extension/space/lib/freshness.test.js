import { test } from "node:test";
import assert from "node:assert/strict";
import { formatFreshness, formatBytes, formatDuration, formatTimestamp } from "./freshness.js";

test("formatFreshness reports no contact yet when there is no prior contact", () => {
  assert.equal(formatFreshness(1000, null), "no contact yet");
  assert.equal(formatFreshness(1000, undefined), "no contact yet");
});

test("formatFreshness reports just now for very recent contact", () => {
  assert.equal(formatFreshness(1000, 995), "just now");
});

test("formatFreshness formats seconds, minutes, hours, and days appropriately", () => {
  assert.equal(formatFreshness(1000, 960), "last contact 40s");
  assert.equal(formatFreshness(1000 + 7 * 60, 1000), "last contact 7m");
  assert.equal(formatFreshness(1000 + 3 * 3600, 1000), "last contact 3h");
  assert.equal(formatFreshness(1000 + 5 * 86400, 1000), "last contact 5d");
});

test("formatFreshness never reports negative time for clock skew", () => {
  assert.equal(formatFreshness(1000, 1005), "just now");
});

test("formatBytes scales units and precision sensibly", () => {
  assert.equal(formatBytes(null), "—");
  assert.equal(formatBytes(420), "420 B");
  assert.equal(formatBytes(1800), "1.8 KB");
  assert.equal(formatBytes(96000), "96 KB");
  assert.equal(formatBytes(1_200_000), "1.2 MB");
});

test("formatDuration produces compact human-readable estimates", () => {
  assert.equal(formatDuration(null), "—");
  assert.equal(formatDuration(0.4), "<1 sec");
  assert.equal(formatDuration(18), "~18 sec");
  assert.equal(formatDuration(63), "~1m 03s");
  assert.equal(formatDuration(120), "~2 min");
  assert.equal(formatDuration(3700), "~1h 1m");
});

test("formatTimestamp returns a placeholder for missing evidence", () => {
  assert.equal(formatTimestamp(null), "—");
  assert.equal(formatTimestamp(undefined), "—");
});

test("formatTimestamp formats a real unix timestamp to a non-empty string", () => {
  const label = formatTimestamp(1_700_000_000);
  assert.ok(typeof label === "string" && label.length > 0 && label !== "—");
});
