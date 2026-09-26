// FIXTURE DATA — outgoing Sent/delivery-status rows, keyed by OceanMail account.
//
// Superseded design note: earlier passes of this correction had a
// user-facing "Outbox" pseudo-folder with fixture *incoming* rows
// demonstrating the receive side. The owner's final mail-model decision
// removes any user-facing Outbox: `Sent` is the one native destination for
// a user's own submitted messages, augmented with Station-derived
// delivery/transport status. These fixtures are therefore outgoing-only —
// they represent this account's own sent messages, not other people's mail
// arriving.
//
// oceanmail-station's real outbound-queue observation exposes no
// per-account filtering at all (docs/STATION_API_CONTRACT_GAPS.md) — real
// rows are shown vessel-wide with an explicit contract-gap notice (see
// sent-status-view.js). These fixture rows are kept genuinely account-scoped
// so the intended per-account isolation is provable ahead of that Station
// capability existing. Always merged in with isFixture: true
// (sent-status-model.js combineSentStatusRows), and the Sent-status view must
// render a visible fixture indicator on them.
//
// Priority-model correction (docs/MAIL_MODEL_CORRECTION.md): there is no
// user-selectable Priority transport class any more. `transportClass` is
// "ordinary" for all four rows below (none of these demo messages are
// Emergency OMail); `important` is separate display-only metadata and
// matches the amendment's own worked example exactly (Weather report and
// Arrival notice marked Important, Parts request and Engine photo not).
//
// Fixture-only compatibility field for UI proof.
// Do not promote this boolean to an OceanMail wire/backend schema.
// Real messages must derive Important from interoperable message metadata
// through the normalization adapter (../lib/importance.js).
//
// This is Stage 1 of the "Important interoperability" migration
// (docs/MAIL_MODEL_CORRECTION.md): `important: true/false` here is fed
// through `normalizeImportance()` to produce `state: "important"/"ordinary"`
// (never persisted to Station, never a gateway wire field); a row with no
// `important` property (or `null`) normalizes to `state: "unknown"`, which
// is distinct from "ordinary" and must not be shown or treated as false.

const SHIP_SENT_ROWS = Object.freeze([
  {
    id: "fx-sent-ship-1",
    direction: "outgoing",
    transportClass: "ordinary",
    important: true,
    state: "queued",
    sender: "ship@station.test",
    recipients: ["harbor.office@example.test"],
    subject: "Weather report",
    bytesTotal: 4200,
    bytesTransferred: 0,
    firstSeenUnix: Math.floor(Date.now() / 1000) - 400,
    lastSeenUnix: null,
    transmittedAtUnix: null,
    leftLocalQueueAtUnix: null,
    confirmedReceiptAtUnix: null,
    isFixture: true,
    waitingReason: "Waiting for next Grid opportunity",
    nextAction: null
  },
  {
    id: "fx-sent-ship-2",
    direction: "outgoing",
    transportClass: "ordinary",
    important: true,
    state: "delivered",
    sender: "ship@station.test",
    recipients: ["dispatch@example.test"],
    subject: "Arrival notice",
    bytesTotal: 900,
    bytesTransferred: 900,
    firstSeenUnix: Math.floor(Date.now() / 1000) - 86400,
    lastSeenUnix: Math.floor(Date.now() / 1000) - 85000,
    transmittedAtUnix: Math.floor(Date.now() / 1000) - 85200,
    leftLocalQueueAtUnix: Math.floor(Date.now() / 1000) - 86100,
    confirmedReceiptAtUnix: Math.floor(Date.now() / 1000) - 85000,
    isFixture: true,
    waitingReason: null,
    nextAction: null
  }
]);

const BOB_SENT_ROWS = Object.freeze([
  {
    id: "fx-sent-bob-1",
    direction: "outgoing",
    transportClass: "ordinary",
    important: false,
    state: "transmitting",
    sender: "bob@station.test",
    recipients: ["supply@example.test"],
    subject: "Parts request",
    bytesTotal: 6000,
    bytesTransferred: 2520,
    firstSeenUnix: Math.floor(Date.now() / 1000) - 180,
    lastSeenUnix: Math.floor(Date.now() / 1000) - 5,
    transmittedAtUnix: null,
    leftLocalQueueAtUnix: null,
    confirmedReceiptAtUnix: null,
    isFixture: true,
    waitingReason: null,
    nextAction: null
  },
  {
    id: "fx-sent-bob-2",
    direction: "outgoing",
    transportClass: "ordinary",
    important: false,
    state: "remote_accepted",
    sender: "bob@station.test",
    recipients: ["family@example.test"],
    subject: "Engine photo",
    bytesTotal: 15000,
    bytesTransferred: 15000,
    firstSeenUnix: Math.floor(Date.now() / 1000) - 7200,
    lastSeenUnix: Math.floor(Date.now() / 1000) - 6900,
    transmittedAtUnix: Math.floor(Date.now() / 1000) - 7000,
    leftLocalQueueAtUnix: Math.floor(Date.now() / 1000) - 7100,
    // Intentionally null: this row demonstrates "remotely accepted, receipt
    // still unconfirmed" — never invent a receipt timestamp Station hasn't
    // actually reported.
    confirmedReceiptAtUnix: null,
    isFixture: true,
    waitingReason: null,
    nextAction: null
  }
]);

const DEFAULT_SENT_ROWS = Object.freeze([]);

const FIXTURE_SENT_STATUS_BY_ACCOUNT = Object.freeze({
  "ship@station.test": SHIP_SENT_ROWS,
  "bob@station.test": BOB_SENT_ROWS
});

/**
 * Looks up the outgoing Sent/delivery-status fixture rows for one account,
 * falling back to an empty list (never another account's rows) for any
 * account not explicitly represented above.
 *
 * @param {string} accountEmail
 * @returns {object[]}
 */
export function getSentStatusFixturesForAccount(accountEmail) {
  return FIXTURE_SENT_STATUS_BY_ACCOUNT[accountEmail] || DEFAULT_SENT_ROWS;
}
