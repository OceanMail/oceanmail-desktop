// Available OMail / retrieval planner model.
//
// This is the testable client-side model/service boundary required by the
// Tranche 3 brief: "Do not bury planner/business state entirely in DOM event
// handlers... That boundary must be replaceable by real Station/Server
// observations later." It knows nothing about the DOM, browser APIs, or
// fixtures — it operates purely on the row/budget shapes described below, so
// the same planner works whether rows come from FIXTURE_AVAILABLE_ROWS
// (../fixtures/available-fixtures.js) or a future real Station manifest
// endpoint (see docs/STATION_API_CONTRACT_GAPS.md — no such endpoint exists
// yet).
//
// Design rules carried forward from docs/design/mail-transfer-and-retrieval.md
// and implemented here behind a testable client-side boundary:
//   - Available is metadata/manifest only; no message body ever appears here.
//   - Selecting a row is planning, not proof of retrieval/billing.
//   - Selection/representation changes recompute aggregates immediately.
//   - A change that would exceed the currently authorized hard capacity
//     (included budget + any explicitly approved credit) is REJECTED without
//     changing the prior choice ("fail closed"), not silently truncated.
//   - Credit approval is scoped to the current batch and is consumed when
//     that batch is queued; a later selection needs new approval.
//   - Ordinary constrained-link retrieval requires explicit recipient
//     selection regardless of size (0.2 supersedes the 0.1 automatic-small-
//     message threshold — see docs/design/mail-transfer-and-retrieval.md).

/**
 * @typedef {object} AvailableAttachment
 * @property {string} id
 * @property {string} type - e.g. "image", "pdf"
 * @property {{id: string, label: string, bytes: number, seconds: number}[]} representations
 *   Ascending by size/quality. representations[0] is the smallest choice.
 */

/**
 * @typedef {object} AvailableRow
 * @property {string} id - stable logical message identity
 * @property {string} sender
 * @property {string} subject
 * @property {number} bodyBytes
 * @property {number} bodySeconds - estimated transfer time for the body alone
 * @property {number} freshnessUnix - when this item became available
 * @property {boolean} eligible - false if blocked/ineligible/already local
 * @property {string|null} blockedReason - required when eligible is false
 * @property {AvailableAttachment|null} attachment
 */

/**
 * @typedef {object} AvailableBudget
 * @property {number} includedRemainingBytes - remaining ordinary receive allowance
 * @property {number} availableCreditBytes - earned credit available if approved
 */

/**
 * @param {{rows: AvailableRow[], budget: AvailableBudget}} config
 */
export function createAvailablePlanner({ rows, budget }) {
  const rowsById = new Map(rows.map((row) => [row.id, row]));
  /** @type {string[]} retrieval order for selected work (body and/or attachment) — the
   *  recipient's own retrieval preference (docs/MAIL_MODEL_CORRECTION.md
   *  §Priority-model correction). This is the only per-item ordering
   *  control Available has; there is no separate per-message "Priority"
   *  class here, on Sent, or anywhere else in OceanMail Desktop. */
  let selectedWorkOrder = [];
  const selectedBodies = new Set();
  /** @type {Map<string, string|null>} attachment-bearing row id -> chosen representation id */
  const attachmentChoice = new Map();
  const held = new Set();
  let creditApproved = false;

  function attachmentBytes(row) {
    const chosen = attachmentChoice.get(row.id);
    if (!chosen || !row.attachment) {
      return 0;
    }
    const rep = row.attachment.representations.find((candidate) => candidate.id === chosen);
    return rep ? rep.bytes : 0;
  }

  function attachmentSeconds(row) {
    const chosen = attachmentChoice.get(row.id);
    if (!chosen || !row.attachment) {
      return 0;
    }
    const rep = row.attachment.representations.find((candidate) => candidate.id === chosen);
    return rep ? rep.seconds : 0;
  }

  function bytesFor(id) {
    const row = rowsById.get(id);
    if (!row) {
      return 0;
    }
    const bodyBytes = selectedBodies.has(id) ? row.bodyBytes : 0;
    return bodyBytes + attachmentBytes(row);
  }

  function secondsFor(id) {
    const row = rowsById.get(id);
    if (!row) {
      return 0;
    }
    const bodySeconds = selectedBodies.has(id) ? row.bodySeconds : 0;
    return bodySeconds + attachmentSeconds(row);
  }

  function totals() {
    let selectedBytes = 0;
    let estimatedSeconds = 0;
    for (const id of rowsById.keys()) {
      selectedBytes += bytesFor(id);
      estimatedSeconds += secondsFor(id);
    }
    return { selectedBytes, estimatedSeconds };
  }

  /**
   * Aggregate reservation state used both for display and for fail-closed
   * checks. Mirrors ADR 0005's required fields: selected bytes, estimated
   * time, included budget remaining/projected, credit needed, available
   * credit, and whether the plan currently fits its authorized capacity.
   */
  function aggregate() {
    const { selectedBytes, estimatedSeconds } = totals();
    const includedRemainingBytes = budget.includedRemainingBytes;
    const overflow = Math.max(0, selectedBytes - includedRemainingBytes);
    const availableCreditBytes = budget.availableCreditBytes;
    const withinHardCapacity =
      overflow === 0 || (creditApproved && overflow <= availableCreditBytes);
    return {
      selectedBytes,
      estimatedSeconds,
      includedRemainingBytes,
      projectedRemainingIncludedBytes: Math.max(0, includedRemainingBytes - selectedBytes),
      creditNeededBytes: overflow,
      availableCreditBytes,
      creditApproved,
      requiresApproval: overflow > 0,
      withinHardCapacity
    };
  }

  /**
   * Would adding `deltaBytes` on top of the CURRENT selection exceed the
   * currently authorized hard capacity (included budget, plus approved
   * credit up to what's available)?
   */
  function wouldExceedCapacity(deltaBytes) {
    if (deltaBytes <= 0) {
      return false;
    }
    const current = aggregate();
    const projected = current.selectedBytes + deltaBytes;
    const overflow = Math.max(0, projected - current.includedRemainingBytes);
    const cap = creditApproved ? current.availableCreditBytes : 0;
    return overflow > cap;
  }

  function toggleBodySelect(id) {
    const row = rowsById.get(id);
    if (!row) {
      return { ok: false, reason: "unknown-id" };
    }
    if (selectedBodies.has(id)) {
      selectedBodies.delete(id);
      if (!attachmentChoice.has(id)) {
        selectedWorkOrder = selectedWorkOrder.filter((existing) => existing !== id);
      }
      return { ok: true, selected: false };
    }
    if (held.has(id)) {
      return { ok: false, reason: "held" };
    }
    if (!row.eligible) {
      return { ok: false, reason: row.blockedReason || "ineligible" };
    }
    if (wouldExceedCapacity(row.bodyBytes)) {
      return { ok: false, reason: "exceeds-budget" };
    }
    selectedBodies.add(id);
    if (!selectedWorkOrder.includes(id)) {
      selectedWorkOrder.push(id);
    }
    return { ok: true, selected: true };
  }

  /**
   * @param {string} id
   * @param {string|null} representationId - null defers/clears the attachment
   */
  function setAttachmentRepresentation(id, representationId) {
    const row = rowsById.get(id);
    if (!row || !row.attachment) {
      return { ok: false, reason: "no-attachment" };
    }
    if (representationId === null) {
      attachmentChoice.delete(id);
      if (!selectedBodies.has(id)) {
        selectedWorkOrder = selectedWorkOrder.filter((existing) => existing !== id);
      }
      return { ok: true, representationId: null };
    }
    if (held.has(id)) {
      return { ok: false, reason: "held" };
    }
    if (!row.eligible) {
      return { ok: false, reason: row.blockedReason || "ineligible" };
    }
    const rep = row.attachment.representations.find(
      (candidate) => candidate.id === representationId
    );
    if (!rep) {
      return { ok: false, reason: "unknown-representation" };
    }
    const previousId = attachmentChoice.get(id) || null;
    const previousBytes = previousId
      ? row.attachment.representations.find((candidate) => candidate.id === previousId)
          ?.bytes || 0
      : 0;
    const delta = rep.bytes - previousBytes;
    if (delta > 0 && wouldExceedCapacity(delta)) {
      // Fail closed: prior choice is left exactly as it was.
      return { ok: false, reason: "exceeds-budget" };
    }
    attachmentChoice.set(id, representationId);
    if (!selectedWorkOrder.includes(id)) {
      selectedWorkOrder.push(id);
    }
    return { ok: true, representationId };
  }

  /**
   * Reorders the current selection. Only accepts an ordering that is a
   * permutation of the currently selected ids — this is a retrieval-order
   * control, not a way to add/remove selections.
   */
  function setOrder(orderedIds) {
    const selectedSet = new Set(selectedWorkOrder);
    if (!Array.isArray(orderedIds) || orderedIds.length !== selectedSet.size ||
        new Set(orderedIds).size !== selectedSet.size ||
        orderedIds.some((id) => !selectedSet.has(id))) {
      return { ok: false, reason: "incomplete-order" };
    }
    selectedWorkOrder = [...orderedIds];
    return { ok: true };
  }

  /**
   * Moves one selected id one step earlier (`direction: -1`) or later
   * (`direction: 1`) in the retrieval order, for an explicit accessible
   * Move up / Move down control (project-lead correction, PR #7 review:
   * "the current Available view exposes no explicit reorder control;
   * selection order merely becomes retrieval order" — this is that
   * control's model-layer counterpart). A thin wrapper around the same
   * `selectedWorkOrder` `setOrder` already reorders — it never touches
   * selection, budget, hold, or attachment-representation state.
   *
   * @param {string} id
   * @param {-1|1} direction
   */
  function moveSelected(id, direction) {
    if (direction !== -1 && direction !== 1) {
      return { ok: false, reason: "invalid-direction" };
    }
    const index = selectedWorkOrder.indexOf(id);
    if (index === -1) {
      return { ok: false, reason: "not-selected" };
    }
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= selectedWorkOrder.length) {
      return { ok: false, reason: "at-boundary" };
    }
    const next = [...selectedWorkOrder];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    selectedWorkOrder = next;
    return { ok: true };
  }

  function toggleHold(id) {
    if (!rowsById.has(id)) {
      return { ok: false, reason: "unknown-id" };
    }
    if (held.has(id)) {
      held.delete(id);
      return { ok: true, held: false };
    }
    held.add(id);
    selectedWorkOrder = selectedWorkOrder.filter((existing) => existing !== id);
    selectedBodies.delete(id);
    attachmentChoice.delete(id);
    return { ok: true, held: true };
  }

  function approveCredit(approved) {
    creditApproved = Boolean(approved);
  }

  /**
   * Call when the current selection is materialized/queued. Per ADR 0005,
   * credit approval is scoped to that batch: it resets here so a later
   * selection cannot silently inherit it.
   */
  function consumeApprovalOnQueue() {
    const snapshot = aggregate();
    creditApproved = false;
    return snapshot;
  }

  function getRowView(id) {
    const row = rowsById.get(id);
    if (!row) {
      return null;
    }
    const isHeld = held.has(id);
    const selected = selectedBodies.has(id);
    const workIndex = selectedWorkOrder.indexOf(id);
    return {
      ...row,
      selected,
      order: workIndex >= 0 ? workIndex + 1 : null,
      held: isHeld,
      attachmentRepresentationId: attachmentChoice.get(id) || null,
      effectiveBlockedReason: !row.eligible
        ? row.blockedReason
        : isHeld
          ? "On hold"
          : null
    };
  }

  function getRows() {
    return rows.map((row) => getRowView(row.id));
  }

  function getOrderedSelection() {
    return [...selectedWorkOrder];
  }

  return {
    getRows,
    getRowView,
    getOrderedSelection,
    toggleBodySelect,
    setAttachmentRepresentation,
    setOrder,
    toggleHold,
    moveSelected,
    approveCredit,
    consumeApprovalOnQueue,
    aggregate
  };
}
