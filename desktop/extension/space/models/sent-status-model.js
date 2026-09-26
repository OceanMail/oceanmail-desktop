// Sent delivery-status model.
//
// Supersession note: this module was originally written for a user-facing
// "Outbox" concept (Tranche 3 / first PR #7 pass). The owner's final
// mail-model decision removed any user-facing Outbox — once a message is
// submitted, Station immediately owns queueing/transport/evidence, so the
// user's own `Sent` folder is the one place that shows both the submitted
// copy and its Station-derived delivery status. This model is unchanged in
// substance (same evidence semantics, same tests) and is reused here for
// that purpose — only the name and a few comments changed to match.
//
// Maps real oceanmail-station evidence (OutboundQueueHistoryJob, from
// GET /api/v1/queues/outbound/history) into OceanMail's truthful lifecycle
// vocabulary (docs/design/mail-lifecycle-and-receipts.md), and provides a
// display-ordering helper for the scheduler bands described in
// docs/design/desktop-interface-inheritance.md.
//
// Station's real outbound-queue observation today only covers Postfix
// (SMTP submission), which means:
//   - direction is always "outgoing" — this model only ever describes a
//     user's own sent messages, never other people's incoming mail;
//   - Station does not yet expose an OceanMail transport class
//     (Emergency/ordinary), so real rows are mapped as "unclassified"
//     rather than guessing "ordinary";
//   - "left_postfix_queue" means the message left Postfix's queue, which is
//     evidence of local transmission only — NOT remote/application delivery
//     (see CURRENT_STATUS.md in oceanmail-station and
//     docs/design/mail-lifecycle-and-receipts.md). This module must never
//     upgrade that to "delivered".
//
// Never claim stronger evidence than Station actually proves — see
// docs/design/mail-transfer-and-retrieval.md and
// docs/design/desktop-interface-inheritance.md.
//
// Priority-model correction (docs/MAIL_MODEL_CORRECTION.md): there is no
// user-selectable transport Priority any more. `transportClass` now has
// only two meaningful user-originated values — "emergency" (the one
// transport class that changes scheduling precedence) and "ordinary"
// (everything else, scheduled fairly) — plus "unclassified" for real rows
// Station cannot yet classify at all. `important` is separate, ordinary
// message *metadata* (docs/MAIL_MODEL_CORRECTION.md's "Important" concept):
// it may affect display/sort/notification later, but it MUST NEVER affect
// `sortForDisplay`'s ordering, Station transport precedence, or any
// scheduling band — see the "important must not affect order" test in
// sent-status-model.test.js.

/**
 * @typedef {object} SentStatusRow
 * @property {string} id
 * @property {"outgoing"} direction - always outgoing: this is a user's own Sent-message status, never other people's incoming mail
 * @property {"emergency"|"ordinary"|"unclassified"} transportClass - the only concept that ever changes scheduling precedence; see module comment
 * @property {boolean|null} important - Stage-1 fixture-only compatibility field (docs/MAIL_MODEL_CORRECTION.md's "Important interoperability" migration) — never persisted to Station, never a wire/gateway field. Never read directly by views; consume `../lib/importance.js`'s `normalizeImportance()` instead, which maps this to `state: "important"|"ordinary"|"unknown"`. Always `null` (-> unknown) for real Station-derived rows today, since Station's OutboundQueueHistoryJob evidence carries no importance field and this module never invents one.
 * @property {"queued"|"transmitting"|"left_local_queue"|"remote_accepted"|"delivered"|"failed"|"cancelled"|"unknown"} state
 * @property {string} sender
 * @property {string[]} recipients
 * @property {number|null} bytesTotal
 * @property {number|null} bytesTransferred
 * @property {number|null} firstSeenUnix
 * @property {number|null} lastSeenUnix
 * @property {number|null} transmittedAtUnix - set ONLY when evidence of confirmed transport/remote acceptance exists; leaving the local Postfix queue does NOT qualify (see `left_local_queue` state and `leftLocalQueueAtUnix`)
 * @property {number|null} leftLocalQueueAtUnix - raw evidence: when the message was observed to have left the local Postfix queue. This is disappearance-from-Postfix evidence only, never transport/delivery confirmation.
 * @property {number|null} confirmedReceiptAtUnix - only set when real remote evidence exists
 * @property {boolean} isFixture
 * @property {string|null} waitingReason
 * @property {string|null} nextAction
 */

/**
 * Maps one real Station OutboundQueueHistoryJob entry to a SentStatusRow.
 * @param {object} entry
 * @returns {SentStatusRow}
 */
export function mapStationHistoryEntryToRow(entry) {
  const stillInPostfix = Boolean(entry.present_in_postfix);
  const leftPostfixAtUnix = entry.left_postfix_at_unix ?? null;

  let state = "unknown";
  if (stillInPostfix) {
    state = "queued";
  } else if (leftPostfixAtUnix != null) {
    // oceanmail-station's own CURRENT_STATUS.md (Phase 4C) states this event
    // proves disappearance from Postfix only — never treat it as transport
    // completion, remote acceptance, or delivery (docs/design/mail-lifecycle-
    // and-receipts.md). "left_local_queue" is a deliberately weaker state
    // than "transmitted"/"delivered".
    state = "left_local_queue";
  }

  return {
    id: entry.observation_id,
    direction: "outgoing",
    transportClass: "unclassified",
    // Station's real OutboundQueueHistoryJob evidence carries no Important
    // flag today — never guessed as false, kept explicitly unknown.
    important: null,
    state,
    sender: entry.sender,
    recipients: (entry.recipients || []).map((recipient) => recipient.address),
    bytesTotal: entry.message_size ?? null,
    // Only "queued" has any bytes-transferred evidence (zero: it hasn't left
    // yet). "left_local_queue" leaves this null rather than claiming full
    // bytes/100% — Postfix disappearance is not confirmed transport.
    bytesTransferred: state === "queued" ? 0 : null,
    firstSeenUnix: entry.first_seen_at_unix ?? entry.arrival_time_unix ?? null,
    lastSeenUnix: entry.last_seen_at_unix ?? null,
    // Never set from Postfix-disappearance evidence alone.
    transmittedAtUnix: null,
    leftLocalQueueAtUnix: leftPostfixAtUnix,
    confirmedReceiptAtUnix: null,
    isFixture: false,
    waitingReason: state === "queued" ? "Waiting for Postfix to hand off" : null,
    nextAction: null
  };
}

/**
 * @param {object[]} historyEntries - Station's outbound_queue_history.entries
 * @returns {SentStatusRow[]}
 */
export function buildRealSentStatusRows(historyEntries) {
  return (historyEntries || []).map(mapStationHistoryEntryToRow);
}

// Emergency is the only transport class that changes precedence (Station
// scheduling band 1, docs/MAIL_MODEL_CORRECTION.md's "Accepted Station
// scheduling hierarchy"). "ordinary" and "unclassified" real rows share one
// band and are ordered only by age within it (fairness/aging, matching
// Station scheduling band 2's fair/aged treatment of this Station's own
// vessel/crew traffic) — there is no separate Priority band any more.
const CLASS_BAND = { emergency: 0, ordinary: 1, unclassified: 1 };

/**
 * Display ordering only — Station remains authoritative for actual
 * scheduling. Orders Emergency-class rows first, then all other rows
 * (ordinary/unclassified) oldest-first. `important` is deliberately never
 * read here: it is display/notification metadata and must never influence
 * this order (see the module comment and the corresponding test).
 *
 * @param {SentStatusRow[]} rows
 * @returns {SentStatusRow[]}
 */
export function sortForDisplay(rows) {
  return [...rows].sort((a, b) => {
    const classDelta = (CLASS_BAND[a.transportClass] ?? 9) - (CLASS_BAND[b.transportClass] ?? 9);
    if (classDelta !== 0) {
      return classDelta;
    }
    return (a.firstSeenUnix ?? 0) - (b.firstSeenUnix ?? 0);
  });
}

const VALID_NEXT_ACTIONS_BY_STATE = {
  queued: ["cancel"],
  transmitting: [],
  left_local_queue: [],
  remote_accepted: [],
  delivered: [],
  failed: ["retry"],
  cancelled: ["restart"],
  unknown: []
};

/**
 * Valid next actions for a row's current state. A row with budget/pause
 * blocking is expressed via `waitingReason`, not by inventing a new
 * lifecycle stage (docs/design/desktop-interface-inheritance.md: "Pause/
 * budget-block state is separate from underlying lifecycle stage.").
 *
 * @param {SentStatusRow} row
 * @returns {string[]}
 */
export function validNextActions(row) {
  return VALID_NEXT_ACTIONS_BY_STATE[row.state] || [];
}

/**
 * Combines real Station-derived rows with clearly-marked fixture rows (used
 * only where Station cannot yet be filtered per-account) and applies
 * display ordering. Fixture rows must always carry isFixture: true so the
 * UI can render an unmistakable fixture badge.
 *
 * @param {SentStatusRow[]} realRows
 * @param {SentStatusRow[]} fixtureRows
 * @returns {SentStatusRow[]}
 */
export function combineSentStatusRows(realRows, fixtureRows) {
  const combined = [...realRows, ...fixtureRows.map((row) => ({ ...row, isFixture: true }))];
  return sortForDisplay(combined);
}
