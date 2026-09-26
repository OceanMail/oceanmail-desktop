// Dashboard view-model: combines real Station API responses (and one real
// local browser signal, navigator.onLine) into the summary described in
// docs/design/client-user-experience.md ("Dashboard") and
// docs/design/desktop-interface-inheritance.md ("Dashboard").
//
// Hard rule carried from both documents: "Do not fabricate observations...
// Seeded/demo data must remain visibly fixture/demo data." Every section
// here is either derived from a real response passed in, explicitly marked
// unavailable, or (for the handful of concepts Station cannot yet report at
// all, like Grid/link freshness and budgets) returned as `null` with a
// `gap` explanation rather than invented content. Fixture content, where
// used at all, is applied by the caller (space.js), never by this module —
// this module only ever describes what it was actually given.

import { formatFreshness, formatBytes } from "../lib/freshness.js";

/**
 * @param {object} params
 * @param {object|null} params.health - Implemented.health() result, or null if unreachable
 * @param {object|null} params.station - Implemented.station() result, or null if unreachable
 * @param {object|null} params.outboundQueue - Implemented.outboundQueue() result, or null
 * @param {object|null} params.observerStatus - Implemented.outboundQueueObserver() result, or null
 * @param {object|null} params.storageSecurity - Implemented.storageSecurity() result, or null
 * @param {boolean} params.internetOnline - navigator.onLine (this device's own signal, not Station-reported)
 * @param {number} params.nowUnix
 * @returns {object} dashboard view-model
 */
export function buildDashboardModel({
  health,
  station,
  outboundQueue,
  observerStatus,
  storageSecurity,
  internetOnline,
  nowUnix
}) {
  const stationConnectivity = health
    ? {
        reachable: true,
        stationId: health.station_id,
        serviceVersion: health.service_version,
        apiVersion: health.api_version
      }
    : { reachable: false };

  const capabilities = station?.capabilities || null;

  const queue = outboundQueue
    ? {
        entryCount: (outboundQueue.entries || []).length,
        observedAtUnix: outboundQueue.observed_at_unix ?? null,
        freshness: formatFreshness(nowUnix, outboundQueue.observed_at_unix ?? null)
      }
    : null;

  const observer = observerStatus
    ? {
        mode: observerStatus.mode,
        pollIntervalSeconds: observerStatus.poll_interval_seconds,
        lastSuccessFreshness: formatFreshness(nowUnix, observerStatus.last_success_at_unix ?? null),
        consecutiveFailures: observerStatus.consecutive_failures ?? 0,
        lastError: observerStatus.last_error ?? null
      }
    : null;

  const security = storageSecurity
    ? {
        productionStorageReady: Boolean(storageSecurity.production_storage_ready),
        applicationStorageEncryption: Boolean(storageSecurity.application_storage_encryption),
        perUserKeySeparation: Boolean(storageSecurity.per_user_key_separation),
        hostVolumeEncryptionVerified: Boolean(storageSecurity.host_volume_encryption_verified),
        note: storageSecurity.note ?? null
      }
    : null;

  const warnings = computeWarnings({ stationConnectivity, observer, security });

  return {
    stationConnectivity,
    capabilities,
    internet: { online: Boolean(internetOnline) },
    queue,
    observer,
    security,
    // Station does not yet expose Grid/link freshness, send/receive
    // budgets, or regional/operational data versions. Rather than invent
    // plausible-looking numbers, these are explicit gaps the UI must render
    // as "not yet available from Station" (see
    // docs/STATION_API_CONTRACT_GAPS.md).
    gridFreshness: null,
    budgets: null,
    regionalDataVersion: null,
    warnings
  };
}

/**
 * @param {{stationConnectivity: object, observer: object|null, security: object|null}} params
 * @returns {{severity: "warning"|"info", message: string}[]}
 */
export function computeWarnings({ stationConnectivity, observer, security }) {
  const warnings = [];

  if (!stationConnectivity.reachable) {
    warnings.push({
      severity: "warning",
      message: "Station is not reachable. Communications state below is unavailable, not zero."
    });
  }

  if (observer && observer.consecutiveFailures > 0) {
    warnings.push({
      severity: "warning",
      message: `Station's queue observer has failed ${observer.consecutiveFailures} time(s) in a row.`
    });
  }

  if (security && !security.productionStorageReady) {
    warnings.push({
      severity: "info",
      message: "Station storage security is lab-only and not yet production-ready."
    });
  }

  return warnings;
}

/**
 * @param {number|null} bytes
 * @returns {string}
 */
export function formatQueueByteSummary(bytes) {
  return formatBytes(bytes);
}
