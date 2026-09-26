import { test } from "node:test";
import assert from "node:assert/strict";
import { getSentStatusFixturesForAccount } from "./sent-status-fixtures.js";

test("Sent-status fixture importance is account-scoped and matches the accepted worked example", () => {
  const ship = getSentStatusFixturesForAccount("ship@station.test");
  const bob = getSentStatusFixturesForAccount("bob@station.test");

  const shipBySubject = Object.fromEntries(ship.map((r) => [r.subject, r.important]));
  const bobBySubject = Object.fromEntries(bob.map((r) => [r.subject, r.important]));

  assert.equal(shipBySubject["Weather report"], true);
  assert.equal(shipBySubject["Arrival notice"], true);
  assert.equal(bobBySubject["Parts request"], false);
  assert.equal(bobBySubject["Engine photo"], false);
});

test("an account not represented in fixtures gets no rows, never another account's importance data", () => {
  assert.deepEqual(getSentStatusFixturesForAccount("nobody@station.test"), []);
});
