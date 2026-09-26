// Station API client boundary for OceanMail Desktop.
//
// This module is the single place the extension talks to the OceanMail
// Station (OceanMail/oceanmail-station). Functions in `Implemented` below
// call a real, currently-shipping Station endpoint (loopback-only, no
// authentication yet — see oceanmail-station docs/PHASE4_STORAGE_SECURITY.md
// and docs/CURRENT_HANDOFF). Functions in `NotYetAvailable` correspond to
// OceanMail-specific concepts this program's docs require (see
// docs/design/mail-transfer-and-retrieval.md, scheduling-budgets-and-priority.md,
// emergency-behavior.md) that the Station does not expose yet. They fail loudly
// instead of returning invented data, so the OceanMail Space can show
// "not available from Station yet" rather than fabricate state. See
// ../../docs/STATION_API_CONTRACT_GAPS.md for the tracked list.

const DEFAULT_BASE_URL = "http://127.0.0.1:8080";

// Opt-in development integration with Station Phase 4J. Never wire this lab
// credential mechanism into normal account provisioning or Available fixtures.
export { createLabAuthClient } from "./lab-auth-client.js";

async function getJson(baseUrl, path) {
  const response = await fetch(`${baseUrl}${path}`, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Station API ${path} returned HTTP ${response.status}`);
  }
  return response.json();
}

// Calls a Station endpoint that exists today, against a real running Station.
export const Implemented = {
  health: (baseUrl = DEFAULT_BASE_URL) => getJson(baseUrl, "/api/v1/health"),
  station: (baseUrl = DEFAULT_BASE_URL) => getJson(baseUrl, "/api/v1/station"),
  outboundQueue: (baseUrl = DEFAULT_BASE_URL) => getJson(baseUrl, "/api/v1/queues/outbound"),
  outboundQueueHistory: (baseUrl = DEFAULT_BASE_URL) =>
    getJson(baseUrl, "/api/v1/queues/outbound/history"),
  outboundQueueObserver: (baseUrl = DEFAULT_BASE_URL) =>
    getJson(baseUrl, "/api/v1/queues/outbound/observer"),
  storageSecurity: (baseUrl = DEFAULT_BASE_URL) => getJson(baseUrl, "/api/v1/security/storage")
};

// OceanMail product concepts with no Station endpoint yet. Calling these is a
// deliberate placeholder, not a bug: it documents the boundary instead of
// hiding it behind a fabricated response.
function notYetAvailable(capability) {
  return Promise.reject(
    new Error(
      `Station API does not yet expose "${capability}". ` +
        "See docs/STATION_API_CONTRACT_GAPS.md for the required contract."
    )
  );
}

export const NotYetAvailable = {
  authenticate: () => notYetAvailable("authenticated Station API access"),
  availableManifest: () => notYetAvailable("Available OMail / retrieval manifest"),
  submitOutboundMessage: () => notYetAvailable("OMail compose submission"),
  budgets: () => notYetAvailable("send/receive budget state"),
  emergencySubmit: () => notYetAvailable("Emergency OMail submission")
};
