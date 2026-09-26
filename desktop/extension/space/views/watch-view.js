// Watch / Compact mode: a dense, high-value-only presentation suitable for
// leaving OceanMail visible aboard a vessel underway
// (docs/design/desktop-interface-inheritance.md, "Compact/watch mode").
// This is deliberately NOT the same feature as collapsing the primary
// navigation rail — it replaces the main content region with a single
// column of the highest-value status tiles.
//
// This first alpha implementation prioritizes, per the Tranche 3 brief:
// Grid/Station freshness, Available/new OMail, Outbox/queued work, active
// transfer/progress, and Radio/Internet state. OChat activity is deferred
// (Chat is not implemented this tranche) and documented as remaining work.

import { Implemented } from "../../station/station-client.js";
import { buildDashboardModel } from "../models/dashboard-model.js";
import { buildRealSentStatusRows } from "../models/sent-status-model.js";
import { getAllFixtureAvailableRows } from "../fixtures/available-fixtures.js";
import { formatBytes } from "../lib/freshness.js";

/**
 * @param {HTMLElement} container
 * @param {() => boolean} [isCurrent] - See `mountDashboardView`'s parameter
 *   of the same name (dashboard-view.js): discards this call's result if a
 *   newer one has superseded it, instead of overwriting a more recent
 *   render with a slower, now-stale one.
 */
export async function mountWatchView(container, isCurrent = () => true) {
  container.innerHTML = `<p class="placeholder-copy">Loading Watch view…</p>`;

  const [health, outboundQueue, history] = await Promise.all([
    Implemented.health().catch(() => null),
    Implemented.outboundQueue().catch(() => null),
    Implemented.outboundQueueHistory().catch(() => null)
  ]);

  if (!isCurrent()) {
    return;
  }

  const dashboard = buildDashboardModel({
    health,
    station: null,
    outboundQueue,
    observerStatus: null,
    storageSecurity: null,
    internetOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    nowUnix: Math.floor(Date.now() / 1000)
  });

  const sentStatusRows = history ? buildRealSentStatusRows(history.entries) : [];
  const queuedCount = sentStatusRows.filter((row) => row.state === "queued").length;
  const transmittingBytes = sentStatusRows
    .filter((row) => row.state === "queued")
    .reduce((sum, row) => sum + (row.bytesTotal || 0), 0);

  container.innerHTML = `
    <div class="watch-view">
      <div class="watch-tile">
        <div class="watch-tile-label">Station</div>
        <div class="watch-tile-value">
          ${dashboard.stationConnectivity.reachable ? "Connected" : "Unreachable"}
        </div>
        <div class="watch-tile-sub">Grid freshness not yet available from Station</div>
      </div>

      <div class="watch-tile">
        <div class="watch-tile-label">Internet (this device, unverified)</div>
        <div class="watch-tile-value">${dashboard.internet.online ? "Unverified" : "Offline"}</div>
      </div>

      <div class="watch-tile">
        <div class="watch-tile-label">Available OMail (all accounts) <span class="badge badge-fixture">Demo</span></div>
        <div class="watch-tile-value">${getAllFixtureAvailableRows().filter((r) => r.eligible).length} waiting</div>
        <div class="watch-tile-sub">Per-account detail: open Available under each account's Mail folder</div>
      </div>

      <div class="watch-tile">
        <div class="watch-tile-label">Sent (vessel-wide, unfiltered)</div>
        <div class="watch-tile-value">${queuedCount} waiting</div>
        <div class="watch-tile-sub">${formatBytes(transmittingBytes)} pending handoff</div>
      </div>

      <div class="watch-tile">
        <div class="watch-tile-label">OChat</div>
        <div class="watch-tile-value">Not implemented</div>
        <div class="watch-tile-sub">Deferred to a later tranche</div>
      </div>
    </div>
  `;
}
