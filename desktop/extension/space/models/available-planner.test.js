import { test } from "node:test";
import assert from "node:assert/strict";
import { createAvailablePlanner } from "./available-planner.js";

function baseRows() {
  return [
    {
      id: "m1",
      sender: "Harbor Office",
      subject: "Clearance",
      bodyBytes: 420,
      bodySeconds: 2,
      freshnessUnix: 1000,
      eligible: true,
      blockedReason: null,
      attachment: null
    },
    {
      id: "m2",
      sender: "Example User",
      subject: "Photos",
      bodyBytes: 930,
      bodySeconds: 3,
      freshnessUnix: 1010,
      eligible: true,
      blockedReason: null,
      attachment: {
        id: "m2-att",
        type: "image",
        representations: [
          { id: "preview", label: "Preview", bytes: 2000, seconds: 5 },
          { id: "small", label: "Small", bytes: 7000, seconds: 13 },
          { id: "medium", label: "Medium", bytes: 21000, seconds: 35 }
        ]
      }
    },
    {
      id: "m3",
      sender: "Robert",
      subject: "Engine information",
      bodyBytes: 12000,
      bodySeconds: 31,
      freshnessUnix: 1020,
      eligible: false,
      blockedReason: "Already local",
      attachment: null
    },
    {
      id: "m4",
      sender: "Weather",
      subject: "Forecast",
      bodyBytes: 7000,
      bodySeconds: 18,
      freshnessUnix: 1030,
      eligible: true,
      blockedReason: null,
      attachment: null
    }
  ];
}

function planner(budget = { includedRemainingBytes: 100000, availableCreditBytes: 0 }) {
  return createAvailablePlanner({ rows: baseRows(), budget });
}

test("selecting a body adds it to the aggregate and retrieval order", () => {
  const p = planner();
  const result = p.toggleBodySelect("m1");
  assert.equal(result.ok, true);
  assert.equal(result.selected, true);
  assert.deepEqual(p.getOrderedSelection(), ["m1"]);
  assert.equal(p.aggregate().selectedBytes, 420);
});

test("deselecting is always allowed and updates aggregate immediately", () => {
  const p = planner();
  p.toggleBodySelect("m1");
  const result = p.toggleBodySelect("m1");
  assert.equal(result.ok, true);
  assert.equal(result.selected, false);
  assert.equal(p.aggregate().selectedBytes, 0);
});

test("ineligible rows cannot be selected and surface their blocked reason", () => {
  const p = planner();
  const result = p.toggleBodySelect("m3");
  assert.equal(result.ok, false);
  assert.equal(result.reason, "Already local");
  const row = p.getRowView("m3");
  assert.equal(row.selected, false);
  assert.equal(row.effectiveBlockedReason, "Already local");
});

test("selection fails closed when it would exceed included budget with no approved credit", () => {
  const p = planner({ includedRemainingBytes: 500, availableCreditBytes: 10000 });
  const result = p.toggleBodySelect("m1"); // 420 bytes, fits
  assert.equal(result.ok, true);
  const second = p.toggleBodySelect("m2"); // +930 bytes, would exceed 500 without approval
  assert.equal(second.ok, false);
  assert.equal(second.reason, "exceeds-budget");
  // Prior selection must be untouched.
  assert.deepEqual(p.getOrderedSelection(), ["m1"]);
  assert.equal(p.aggregate().selectedBytes, 420);
});

test("approving credit allows selection up to included + available credit, still fails beyond it", () => {
  const p = planner({ includedRemainingBytes: 500, availableCreditBytes: 900 });
  p.toggleBodySelect("m1"); // 420
  p.approveCredit(true);
  const withinCredit = p.toggleBodySelect("m2"); // +930 => total 1350, overflow 850 <= 900 credit
  assert.equal(withinCredit.ok, true);
  assert.equal(p.aggregate().selectedBytes, 1350);
  assert.equal(p.aggregate().withinHardCapacity, true);

  const beyondCredit = p.toggleBodySelect("m4"); // +7000, total would be 8350, overflow 7850 > 900 credit
  assert.equal(beyondCredit.ok, false);
  assert.equal(beyondCredit.reason, "exceeds-budget");
});

test("representation change that would exceed capacity is rejected without changing the prior choice", () => {
  const p = planner({ includedRemainingBytes: 5000, availableCreditBytes: 0 });
  const first = p.setAttachmentRepresentation("m2", "preview"); // 2000 bytes, fits
  assert.equal(first.ok, true);
  assert.equal(p.aggregate().selectedBytes, 2000);

  const tooBig = p.setAttachmentRepresentation("m2", "medium"); // 21000 bytes, would exceed 5000
  assert.equal(tooBig.ok, false);
  assert.equal(tooBig.reason, "exceeds-budget");

  // Prior choice (preview) must remain in effect.
  assert.equal(p.getRowView("m2").attachmentRepresentationId, "preview");
  assert.equal(p.aggregate().selectedBytes, 2000);
});

test("clearing an attachment representation is always allowed and reduces the aggregate", () => {
  const p = planner();
  p.setAttachmentRepresentation("m2", "small");
  assert.equal(p.aggregate().selectedBytes, 7000);
  const cleared = p.setAttachmentRepresentation("m2", null);
  assert.equal(cleared.ok, true);
  assert.equal(p.aggregate().selectedBytes, 0);
});

test("credit approval is consumed when the batch is queued; a later selection needs new approval", () => {
  const p = planner({ includedRemainingBytes: 500, availableCreditBytes: 900 });
  p.toggleBodySelect("m1");
  p.approveCredit(true);
  p.toggleBodySelect("m2");
  assert.equal(p.aggregate().creditApproved, true);

  p.consumeApprovalOnQueue();
  assert.equal(p.aggregate().creditApproved, false);

  // Deselect and reselect m2 without re-approving: should now fail again.
  p.toggleBodySelect("m2");
  const reselect = p.toggleBodySelect("m2");
  assert.equal(reselect.ok, false);
  assert.equal(reselect.reason, "exceeds-budget");
});

test("holding a selected row removes it from the retrieval order and blocks reselection", () => {
  const p = planner();
  p.toggleBodySelect("m1");
  const held = p.toggleHold("m1");
  assert.equal(held.ok, true);
  assert.equal(held.held, true);
  assert.deepEqual(p.getOrderedSelection(), []);

  const reselect = p.toggleBodySelect("m1");
  assert.equal(reselect.ok, false);
  assert.equal(reselect.reason, "held");

  const unheld = p.toggleHold("m1");
  assert.equal(unheld.held, false);
  const canSelectAgain = p.toggleBodySelect("m1");
  assert.equal(canSelectAgain.ok, true);
});

test("setOrder reorders only the currently selected ids and rejects incomplete permutations", () => {
  const p = planner();
  p.toggleBodySelect("m1");
  p.toggleBodySelect("m2");
  assert.deepEqual(p.getOrderedSelection(), ["m1", "m2"]);

  const reordered = p.setOrder(["m2", "m1"]);
  assert.equal(reordered.ok, true);
  assert.deepEqual(p.getOrderedSelection(), ["m2", "m1"]);

  const invalid = p.setOrder(["m2"]);
  assert.equal(invalid.ok, false);
  assert.equal(invalid.reason, "incomplete-order");
  // Unchanged after the rejected call.
  assert.deepEqual(p.getOrderedSelection(), ["m2", "m1"]);
});

test("moveSelected moves a selected id one step earlier or later without touching selection/budget/attachment state", () => {
  const p = planner();
  p.toggleBodySelect("m1");
  p.toggleBodySelect("m2");
  p.toggleBodySelect("m4");
  p.setAttachmentRepresentation("m2", "small");
  assert.deepEqual(p.getOrderedSelection(), ["m1", "m2", "m4"]);

  const moved = p.moveSelected("m4", -1);
  assert.equal(moved.ok, true);
  assert.deepEqual(p.getOrderedSelection(), ["m1", "m4", "m2"]);
  // Selection, budget, and attachment choice are untouched by a pure reorder.
  assert.equal(p.getRowView("m2").attachmentRepresentationId, "small");
  assert.equal(p.getRowView("m4").selected, true);
  assert.equal(p.aggregate().selectedBytes, 420 + 930 + 7000 + 7000);
});

test("moveSelected refuses to move past either boundary", () => {
  const p = planner();
  p.toggleBodySelect("m1");
  p.toggleBodySelect("m2");

  const pastTop = p.moveSelected("m1", -1);
  assert.equal(pastTop.ok, false);
  assert.equal(pastTop.reason, "at-boundary");

  const pastBottom = p.moveSelected("m2", 1);
  assert.equal(pastBottom.ok, false);
  assert.equal(pastBottom.reason, "at-boundary");

  // Order is unchanged after both rejected moves.
  assert.deepEqual(p.getOrderedSelection(), ["m1", "m2"]);
});

test("moveSelected refuses to move an id that is not currently selected", () => {
  const p = planner();
  p.toggleBodySelect("m1");
  const result = p.moveSelected("m4", -1);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "not-selected");
});

test("Important metadata on a row never affects Available retrieval ordering", () => {
  // Decision 0009 / docs/MAIL_MODEL_CORRECTION.md: an Important Available
  // message may visually show a star, but it must never jump ahead in
  // retrieval order automatically — only the recipient's own selection/
  // moveSelected order matters. The planner never reads `important` at all;
  // this proves adding it to a row's data cannot change ordering behavior.
  const p = createAvailablePlanner({
    rows: [
      { id: "a", sender: "s", subject: "Not important", bodyBytes: 10, bodySeconds: 1, freshnessUnix: 1, eligible: true, blockedReason: null, attachment: null, important: false },
      { id: "b", sender: "s", subject: "Important", bodyBytes: 10, bodySeconds: 1, freshnessUnix: 2, eligible: true, blockedReason: null, attachment: null, important: true }
    ],
    budget: { includedRemainingBytes: 1000, availableCreditBytes: 0 }
  });
  p.toggleBodySelect("a");
  p.toggleBodySelect("b");
  // Selected in a, b order — Important ("b") does not jump ahead.
  assert.deepEqual(p.getOrderedSelection(), ["a", "b"]);
  assert.equal(p.getRowView("a").order, 1);
  assert.equal(p.getRowView("b").order, 2);
});

test("row view carries no per-message Priority class — retrieval order is the only ordering control", () => {
  const p = planner();
  const view = p.getRowView("m1");
  assert.equal("priority" in view, false);
});

test("aggregate reports projected remaining included budget and credit need", () => {
  const p = planner({ includedRemainingBytes: 1000, availableCreditBytes: 5000 });
  p.toggleBodySelect("m1"); // 420
  let agg = p.aggregate();
  assert.equal(agg.projectedRemainingIncludedBytes, 580);
  assert.equal(agg.creditNeededBytes, 0);
  assert.equal(agg.requiresApproval, false);

  p.approveCredit(true);
  p.toggleBodySelect("m2"); // +930 => 1350 total, overflow 350
  agg = p.aggregate();
  assert.equal(agg.projectedRemainingIncludedBytes, 0);
  assert.equal(agg.creditNeededBytes, 350);
  assert.equal(agg.requiresApproval, true);
  assert.equal(agg.withinHardCapacity, true);
});

test("setOrder rejects duplicates, foreign extras and invalid input atomically", () => {
  const p = planner();
  p.toggleBodySelect("m1");
  p.toggleBodySelect("m2");
  for (const ids of [["m1", "m1"], ["m1", "m2", "foreign"], ["m1", "foreign"], [], null, "m1,m2"]) {
    assert.equal(p.setOrder(ids).ok, false);
    assert.deepEqual(p.getOrderedSelection(), ["m1", "m2"]);
    assert.equal(p.aggregate().selectedBytes, 1350);
  }
  const requested = ["m2", "m1"];
  assert.equal(p.setOrder(requested).ok, true);
  requested[0] = "foreign";
  assert.deepEqual(p.getOrderedSelection(), ["m2", "m1"]);
});

test("message hold clears body and attachment work and resume never silently reselects", () => {
  const p = planner();
  p.toggleBodySelect("m2");
  p.setAttachmentRepresentation("m2", "preview");
  assert.equal(p.aggregate().selectedBytes, 2930);
  p.toggleHold("m2");
  assert.equal(p.aggregate().selectedBytes, 0);
  assert.equal(p.aggregate().estimatedSeconds, 0);
  assert.deepEqual(p.getOrderedSelection(), []);
  assert.equal(p.getRowView("m2").attachmentRepresentationId, null);
  assert.deepEqual(p.setAttachmentRepresentation("m2", "preview"), { ok: false, reason: "held" });
  assert.equal(p.setAttachmentRepresentation("m2", null).ok, true);
  p.toggleHold("m2");
  assert.equal(p.aggregate().selectedBytes, 0);
  assert.equal(p.getRowView("m2").selected, false);
  assert.equal(p.setAttachmentRepresentation("m2", "preview").ok, true);
});

test("ineligible attachment selection is denied while protective clearing remains allowed", () => {
  const rows = baseRows();
  const p = createAvailablePlanner({ rows, budget: { includedRemainingBytes: 100000, availableCreditBytes: 0 } });
  p.setAttachmentRepresentation("m2", "preview");
  rows[1].eligible = false;
  rows[1].blockedReason = "already-local";
  assert.deepEqual(p.setAttachmentRepresentation("m2", "small"), { ok: false, reason: "already-local" });
  assert.equal(p.getRowView("m2").attachmentRepresentationId, "preview");
  assert.equal(p.setAttachmentRepresentation("m2", null).ok, true);
  assert.equal(p.aggregate().selectedBytes, 0);
});

test("attachment-only work has an order and survives removal of a selected body", () => {
  const p = planner();
  p.toggleBodySelect("m1");
  p.setAttachmentRepresentation("m2", "preview");
  assert.deepEqual(p.getOrderedSelection(), ["m1", "m2"]);
  assert.equal(p.getRowView("m2").selected, false);
  assert.equal(p.getRowView("m2").order, 2);
  assert.equal(p.setOrder(["m1"]).ok, false);
  assert.equal(p.moveSelected("m2", -1).ok, true);
  assert.deepEqual(p.getOrderedSelection(), ["m2", "m1"]);
  p.toggleBodySelect("m2");
  assert.deepEqual(p.getOrderedSelection(), ["m2", "m1"]);
  p.toggleBodySelect("m2");
  assert.deepEqual(p.getOrderedSelection(), ["m2", "m1"]);
  p.setAttachmentRepresentation("m2", null);
  assert.deepEqual(p.getOrderedSelection(), ["m1"]);
});

test("clearing an attachment retains body work and held choices cannot affect another instance", () => {
  const p = planner();
  const other = planner();
  p.toggleBodySelect("m2");
  p.setAttachmentRepresentation("m2", "preview");
  p.setAttachmentRepresentation("m2", null);
  assert.deepEqual(p.getOrderedSelection(), ["m2"]);
  assert.equal(p.aggregate().selectedBytes, 930);
  p.toggleHold("m2");
  assert.equal(other.getRowView("m2").held, false);
  assert.deepEqual(other.getOrderedSelection(), []);
});

test("invalid move directions cannot corrupt selected work", () => {
  const p = planner();
  p.toggleBodySelect("m1");
  p.toggleBodySelect("m2");
  for (const direction of [0, 2, -2, 0.5, "1", undefined, NaN]) {
    assert.deepEqual(p.moveSelected("m1", direction), { ok: false, reason: "invalid-direction" });
    assert.deepEqual(p.getOrderedSelection(), ["m1", "m2"]);
  }
});
