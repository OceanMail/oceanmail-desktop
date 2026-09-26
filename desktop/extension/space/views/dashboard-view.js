// Dashboard view: opened from the persistent status pill. Renders
// models/dashboard-model.js's view-model, built from real Station responses
// plus this device's own navigator.onLine signal. Never fabricates
// observations — see dashboard-model.js for the exact real/gap boundary.

import { Implemented } from "../../station/station-client.js";
import { buildDashboardModel } from "../models/dashboard-model.js";

/**
 * @param {HTMLElement} container
 * @param {() => boolean} [isCurrent] - Checked both before this call writes
 *   anything and again after the async Station reads resolve, right before
 *   the final render write. Defaults to always-current for direct callers.
 *   A caller that can re-trigger this mount before a prior call's own
 *   preceding async work (e.g. loading preferences) or Station reads
 *   resolve (a toggle a user can click repeatedly) must pass a real check:
 *   the entry check stops an already-superseded call from ever replacing an
 *   up-to-date render with its own "Loading…" placeholder — a call stale
 *   only *after* Promise.all still needs the second check, since it already
 *   passed the entry check and wrote that placeholder itself — see
 *   space.js's `renderStationDashboardSection`.
 */
export async function mountDashboardView(container, isCurrent = () => true) {
  if (!isCurrent()) {
    // Already superseded before doing anything: leave whatever the current
    // render put in the container alone, including its own loading state.
    return;
  }
  container.innerHTML = `<h1>Dashboard</h1><p class="placeholder-copy">Loading Station state…</p>`;

  const [health, station, outboundQueue, observerStatus, storageSecurity] = await Promise.all([
    Implemented.health().catch(() => null),
    Implemented.station().catch(() => null),
    Implemented.outboundQueue().catch(() => null),
    Implemented.outboundQueueObserver().catch(() => null),
    Implemented.storageSecurity().catch(() => null)
  ]);

  if (!isCurrent()) {
    // A newer render (e.g. a fast second toggle click) has already started
    // or finished; applying this now-stale response would overwrite it.
    return;
  }

  const model = buildDashboardModel({
    health,
    station,
    outboundQueue,
    observerStatus,
    storageSecurity,
    internetOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    nowUnix: Math.floor(Date.now() / 1000)
  });

  container.innerHTML = `
    <h1>Dashboard</h1>
    <p class="placeholder-copy">
      Deep diagnostics remain Station's responsibility. This summarizes real
      Station API state where reachable; unavailable concepts are shown as
      gaps, never invented values.
    </p>

    ${
      model.warnings.length > 0
        ? `<ul class="warning-list" style="margin-bottom:16px;">
            ${model.warnings
              .map(
                (w) =>
                  `<li class="warning-item is-${w.severity}"><span aria-hidden="true">${w.severity === "warning" ? "⚠" : "ℹ"}</span> ${escapeHtml(w.message)}</li>`
              )
              .join("")}
          </ul>`
        : ""
    }

    <div class="dashboard-grid">
      <div class="card">
        <div class="card-title-row"><h3>Station connectivity</h3></div>
        ${
          model.stationConnectivity.reachable
            ? `<div class="field-grid">
                <div class="field"><span class="field-label">Station ID</span><span class="field-value is-mono">${escapeHtml(model.stationConnectivity.stationId)}</span></div>
                <div class="field"><span class="field-label">Service version</span><span class="field-value is-mono">${escapeHtml(model.stationConnectivity.serviceVersion)}</span></div>
                <div class="field"><span class="field-label">API version</span><span class="field-value is-mono">${escapeHtml(model.stationConnectivity.apiVersion)}</span></div>
              </div>`
            : `<span class="badge badge-warning">Unreachable</span>`
        }
      </div>

      <div class="card">
        <div class="card-title-row"><h3>Internet (this device, unverified)</h3></div>
        <span class="badge ${model.internet.online ? "badge-neutral" : "badge-warning"}">
          ${model.internet.online ? "Unverified — device reports network available" : "Offline"}
        </span>
        <p class="gap-note" style="margin-top:8px;">
          This is <code>navigator.onLine</code>: this device's own OS/browser
          network-availability signal, not a Station-reported path and not
          confirmed Internet reachability. It can read "available" on a LAN
          with no real upstream connectivity.
        </p>
      </div>

      <div class="card">
        <div class="card-title-row"><h3>Queue / progress</h3></div>
        ${
          model.queue
            ? `<div class="field-grid">
                <div class="field"><span class="field-label">Entries observed</span><span class="field-value">${model.queue.entryCount}</span></div>
                <div class="field"><span class="field-label">Observation freshness</span><span class="field-value">${escapeHtml(model.queue.freshness)}</span></div>
              </div>`
            : `<span class="gap-note">Not available — Station unreachable.</span>`
        }
        ${
          model.observer
            ? `<div class="field-grid" style="margin-top:10px;">
                <div class="field"><span class="field-label">Observer mode</span><span class="field-value">${escapeHtml(model.observer.mode)}</span></div>
                <div class="field"><span class="field-label">Last success</span><span class="field-value">${escapeHtml(model.observer.lastSuccessFreshness)}</span></div>
                <div class="field"><span class="field-label">Consecutive failures</span><span class="field-value">${model.observer.consecutiveFailures}</span></div>
              </div>`
            : ""
        }
      </div>

      <div class="card">
        <div class="card-title-row"><h3>Grid freshness</h3></div>
        <span class="gap-note">Not yet available — oceanmail-station does not expose Grid/link state yet (docs/STATION_API_CONTRACT_GAPS.md).</span>
      </div>

      <div class="card">
        <div class="card-title-row"><h3>Send/receive budgets</h3></div>
        <span class="gap-note">Not yet available — no Station budget API yet (docs/STATION_API_CONTRACT_GAPS.md). See the Available view for a fixture-based preview of the intended UI.</span>
      </div>

      <div class="card">
        <div class="card-title-row"><h3>Storage security</h3></div>
        ${
          model.security
            ? `<div class="field-grid">
                <div class="field"><span class="field-label">Production storage ready</span><span class="field-value">${boolBadge(model.security.productionStorageReady)}</span></div>
                <div class="field"><span class="field-label">Application-layer encryption</span><span class="field-value">${boolBadge(model.security.applicationStorageEncryption)}</span></div>
                <div class="field"><span class="field-label">Per-user key separation</span><span class="field-value">${boolBadge(model.security.perUserKeySeparation)}</span></div>
                <div class="field"><span class="field-label">Host volume encryption verified</span><span class="field-value">${boolBadge(model.security.hostVolumeEncryptionVerified)}</span></div>
              </div>
              ${model.security.note ? `<p class="gap-note" style="margin-top:8px;">${escapeHtml(model.security.note)}</p>` : ""}`
            : `<span class="gap-note">Not available — Station unreachable.</span>`
        }
      </div>

      <div class="card">
        <div class="card-title-row"><h3>Regional/operational data version</h3></div>
        <span class="gap-note">Placeholder only — no Station registry/version API yet.</span>
      </div>
    </div>
  `;
}

function boolBadge(value) {
  return `<span class="badge ${value ? "badge-success" : "badge-neutral"}">${value ? "Yes" : "No"}</span>`;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML;
}
