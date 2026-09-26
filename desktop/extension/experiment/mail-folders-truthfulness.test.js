// Regression guard for a real, previously-shipped-then-removed defect in
// experiment/mail-folders.js. That file is a privileged Thunderbird
// Experiment script (depends on Ci/Services/ChromeUtils/ExtensionAPI, none
// of which exist in plain Node), so it cannot be imported/executed by
// node:test the way extension/space/** and extension/background.js can —
// this test instead reads its SOURCE TEXT and asserts the specific banned
// pattern stays gone, which is a real, meaningful regression check even
// though it never executes the function itself.
//
// History: an earlier pass of the native "OceanMail Status" Sent-list
// column special-cased a real Sent message whose subject exactly matched a
// small hard-coded demo table (`DEMO_SENT_STATUS_BY_ACCOUNT_AND_SUBJECT`,
// with `ship@station.test`/`bob@station.test` hard-coded into product
// integration logic), showing e.g. "Delivered (demo)" for it — a `(demo)`
// suffix does not make message-level evidence true, and it let a genuine
// real message display fabricated status merely by sharing a subject with
// a fixture (project-lead correction, PR #7 review; re-confirmed fixed by
// local verification workstation live verification against real "Arrival Notice"/"Arrival Notice
// 2" test messages). This must never come back.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SOURCE_PATH = fileURLToPath(new URL("./mail-folders.js", import.meta.url));
const source = readFileSync(SOURCE_PATH, "utf8");

test("mail-folders.js does not reintroduce subject-keyed demo delivery status", () => {
  assert.doesNotMatch(
    source,
    /DEMO_SENT_STATUS/i,
    "no subject-keyed demo-status table should exist in this privileged integration file"
  );
  assert.doesNotMatch(
    source,
    /mime2DecodedSubject/,
    "sentStatusText must not read a message's subject at all — status must never be derived from message content"
  );
});

test("mail-folders.js does not hard-code lab-account addresses into product integration logic", () => {
  assert.doesNotMatch(
    source,
    /ship@station\.test|bob@station\.test/,
    "account-specific lab addresses belong only in background.js's lab-account config and fixtures, never in this Experiment's folder/column integration logic"
  );
});

test("sentStatusText's real-message branch returns exactly one fixed, honest string — no interpolation, no per-message variation", () => {
  const match = source.match(/function sentStatusText\([^)]*\)\s*{[\s\S]*?\n}/);
  assert.ok(match, "sentStatusText function not found");
  const body = match[0];
  // The only string literal returned for a real message must be this exact
  // text (matched loosely enough to survive comment/whitespace changes,
  // strictly enough to catch a reintroduced subject-based branch).
  assert.match(body, /"Status unavailable — no Station message correlation"/);
  // A template literal or string concatenation in the return path would be
  // the fingerprint of a reintroduced per-message/subject-derived status.
  assert.doesNotMatch(body, /return\s*`/, "no template-literal return — real status text must be a fixed string");
});
