// FIXTURE DATA — Available OMail rows, keyed by OceanMail account.
//
// Decision 0008 (docs/decisions/0008-account-scoped-mail-views-and-native-
// iconography.md): Available is account-scoped — retrieval decisions,
// budget, and credit belong to a specific OceanMail account, not to the
// application globally. This module therefore keys everything by account
// (Thunderbird account key for now — see docs/STATION_API_CONTRACT_GAPS.md
// for the "OceanMail account identifier" gap this stands in for).
//
// oceanmail-station does not yet expose an Available/retrieval-manifest API
// AT ALL, let alone one scoped by account (see
// docs/STATION_API_CONTRACT_GAPS.md). This is fixture data for exactly that
// reason. Every row is marked isFixture: true and the Available view must
// render a visible "DEMO DATA" indicator whenever showing these.
//
// The two example accounts (Ship / Bob) intentionally carry different
// counts and budgets so cross-account leakage would be immediately obvious
// in review — see docs/ui-review/ for the isolation proof this supports.
//
// `important` (where present): Fixture-only compatibility field for UI
// proof. Do not promote this boolean to an OceanMail wire/backend schema.
// Real messages must derive Important from interoperable message metadata
// through the normalization adapter (../lib/importance.js). Marking a row
// Important here must never change its retrieval order — only the
// recipient's own selection/move-up/move-down choices do that (see
// available-planner.test.js's "Important metadata... never affects
// Available retrieval ordering" test).

const SHIP_ROWS = Object.freeze([
  {
    id: "fx-avail-ship-1",
    sender: "Harbor Office",
    subject: "Clearance",
    bodyBytes: 420,
    bodySeconds: 2,
    freshnessUnix: Math.floor(Date.now() / 1000) - 60,
    eligible: true,
    blockedReason: null,
    attachment: null,
    isFixture: true
  },
  {
    id: "fx-avail-ship-2",
    sender: "Northern Star",
    subject: "Arrival",
    bodyBytes: 1800,
    bodySeconds: 5,
    freshnessUnix: Math.floor(Date.now() / 1000) - 300,
    eligible: true,
    blockedReason: null,
    attachment: null,
    isFixture: true
  },
  {
    id: "fx-avail-ship-3",
    sender: "Example User",
    subject: "Photos from the anchorage",
    bodyBytes: 930,
    bodySeconds: 3,
    freshnessUnix: Math.floor(Date.now() / 1000) - 900,
    eligible: true,
    blockedReason: null,
    isFixture: true,
    attachment: {
      id: "fx-avail-ship-3-att",
      type: "image",
      representations: [
        { id: "preview", label: "Preview (grayscale)", bytes: 2000, seconds: 5 },
        { id: "small", label: "Small (color)", bytes: 7000, seconds: 13 },
        { id: "medium", label: "Medium", bytes: 21000, seconds: 35 },
        { id: "large", label: "Best available", bytes: 74000, seconds: 180 }
      ]
    }
  },
  {
    id: "fx-avail-ship-4",
    sender: "Robert",
    subject: "Engine information",
    bodyBytes: 12000,
    bodySeconds: 31,
    freshnessUnix: Math.floor(Date.now() / 1000) - 1800,
    eligible: true,
    blockedReason: null,
    isFixture: true,
    important: true,
    attachment: {
      id: "fx-avail-ship-4-att",
      type: "pdf",
      representations: [{ id: "full", label: "Full document", bytes: 96000, seconds: 240 }]
    }
  }
]);

const BOB_ROWS = Object.freeze([
  {
    id: "fx-avail-bob-1",
    sender: "Weather",
    subject: "Forecast — next 48 hours",
    bodyBytes: 7000,
    bodySeconds: 18,
    freshnessUnix: Math.floor(Date.now() / 1000) - 120,
    eligible: true,
    blockedReason: null,
    isFixture: true,
    important: false,
    attachment: null
  },
  {
    id: "fx-avail-bob-2",
    sender: "Southern Cross",
    subject: "Re: Fuel arrangement",
    bodyBytes: 640,
    bodySeconds: 2,
    freshnessUnix: Math.floor(Date.now() / 1000) - 7200,
    eligible: false,
    blockedReason: "Already local (received directly)",
    isFixture: true,
    attachment: null
  }
]);

const DEFAULT_ROWS = Object.freeze([
  {
    id: "fx-avail-default-1",
    sender: "Station",
    subject: "Welcome to OceanMail",
    bodyBytes: 300,
    bodySeconds: 1,
    freshnessUnix: Math.floor(Date.now() / 1000) - 3600,
    eligible: true,
    blockedReason: null,
    attachment: null,
    isFixture: true
  }
]);

/**
 * Per-account fixture set: { budget, rows }. Keyed by Thunderbird account
 * key/email — see the module comment for why this stands in for a real
 * OceanMail account identifier.
 */
const FIXTURE_AVAILABLE_BY_ACCOUNT = Object.freeze({
  "ship@station.test": Object.freeze({
    budget: Object.freeze({ includedRemainingBytes: 42000, availableCreditBytes: 20000 }),
    rows: SHIP_ROWS
  }),
  "bob@station.test": Object.freeze({
    budget: Object.freeze({ includedRemainingBytes: 11000, availableCreditBytes: 5000 }),
    rows: BOB_ROWS
  })
});

const DEFAULT_BUDGET = Object.freeze({ includedRemainingBytes: 5000, availableCreditBytes: 2000 });

/**
 * Looks up the Available fixture set for one account, falling back to a
 * small generic demo set for any account not explicitly represented above
 * (e.g. a real crew account added later) rather than throwing or silently
 * sharing another account's data.
 *
 * @param {string} accountEmail
 * @returns {{budget: object, rows: object[]}}
 */
export function getAvailableFixturesForAccount(accountEmail) {
  return (
    FIXTURE_AVAILABLE_BY_ACCOUNT[accountEmail] || {
      budget: DEFAULT_BUDGET,
      rows: DEFAULT_ROWS
    }
  );
}

/**
 * All fixture rows across all accounts — used only where a whole-station
 * summary is appropriate (e.g. the Watch/Compact tile), never to show one
 * account's Available list.
 *
 * @returns {object[]}
 */
export function getAllFixtureAvailableRows() {
  return Object.values(FIXTURE_AVAILABLE_BY_ACCOUNT).flatMap((set) => set.rows);
}
