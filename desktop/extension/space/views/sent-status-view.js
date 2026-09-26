// Sent delivery-status view: augments the user's own Sent messages with
// Station-derived transport/delivery evidence, using models/sent-status-model.js
// for mapping/ordering.
//
// Supersession note: an earlier pass of this correction had a separate
// user-facing "Outbox" concept. The owner's final mail-model decision
// removed that: once a message is submitted, Station immediately owns
// queueing/transport/evidence, so a user's own `Sent` folder is the single
// place that shows both the submitted copy and its delivery status. This
// view is reached from a small banner injected into the native Sent
// folder by experiment/mail-folders.js — the native Sent message list
// itself is never replaced.
//
// Decision 0008 / correction spec: this is account-scoped like Available.
//
// Project-lead correction (PR #7 review): this view previously fetched
// Station's real, vessel-wide `/api/v1/queues/outbound/history` and merged
// those rows into a single account's Sent-status view alongside a "contract
// gap" warning that they weren't actually filtered to this account. That is
// an account-privacy violation, not a disclosed limitation — it leaked
// every other user's outbound traffic metadata into one user's own mailbox
// view. Fixed: this view now shows ONLY this account's fixture rows and
// states plainly that real per-account delivery evidence is not available
// yet. Vessel-wide real queue evidence belongs only in the Station-wide
// operational surface (views/watch-view.js's Dashboard/Watch tile), never
// here — that surface is not "authorized" in any access-control sense,
// since the current Station API is loopback-only with no authentication or
// account boundary at all (see docs/STATION_API_CONTRACT_GAPS.md); it is
// simply the one place vessel-wide data is honestly presented as such
// rather than inside one account's own mailbox view. A native "OceanMail
// Status" column on the real Sent folder
// (experiment/mail-folders.js) is the primary in-list delivery-status
// surface going forward; this page remains as the fuller per-account demo
// view (with the Important indicator) reached from that folder.
//
// Priority-model correction (docs/MAIL_MODEL_CORRECTION.md): there is no
// user-selectable transport Priority any more. Emergency remains a wholly
// separate submission path (views/emergency-view.js), never a value chosen
// here. Ordinary mail may instead carry an "Important" metadata flag,
// rendered below as a plain ★ via the normalization adapter
// (../lib/importance.js) — it never affects the State column, sort order,
// or anything Station-scheduling-related. There is no toggle control for it
// in this pass: real native-message binding is Stage 3 of the "Important
// interoperability" migration (docs/MAIL_MODEL_CORRECTION.md), deferred
// pending a safe native Thunderbird integration; faking a toggle that
// doesn't persist anywhere would be exactly the kind of untruthful UI this
// project avoids.

import { sortForDisplay, validNextActions } from "../models/sent-status-model.js";
import { getSentStatusFixturesForAccount } from "../fixtures/sent-status-fixtures.js";
import { normalizeImportance } from "../lib/importance.js";
import { formatBytes, formatTimestamp } from "../lib/freshness.js";

const STATE_BADGE = {
  queued: "badge-info",
  transmitting: "badge-info",
  left_local_queue: "badge-warning",
  remote_accepted: "badge-success",
  delivered: "badge-success",
  failed: "badge-danger",
  cancelled: "badge-neutral",
  unknown: "badge-neutral"
};

const STATE_LABEL = {
  queued: "Waiting",
  transmitting: "Transmitting",
  left_local_queue: "Left local queue — downstream unconfirmed",
  remote_accepted: "Remotely accepted — receipt unconfirmed",
  delivered: "Delivered",
  failed: "Failed",
  cancelled: "Cancelled",
  unknown: "Unknown / unconfirmed"
};

const ACTION_LABEL = { cancel: "Cancel", retry: "Retry", restart: "Restart" };

/**
 * @param {HTMLElement} container
 * @param {{email: string, name: string}} account - the OceanMail account
 *   this Sent-status view is scoped to. Only this account's fixture rows are
 *   ever shown — never Station's real vessel-wide queue history, which has
 *   no per-account filter today and would otherwise leak other users'
 *   traffic metadata into this account's own Sent view.
 */
export async function mountSentStatusView(container, account) {
  const rows = sortForDisplay(
    getSentStatusFixturesForAccount(account.email).map((row) => ({ ...row, isFixture: true }))
  );

  container.innerHTML = `
    <h1>Sent status — ${escapeHtml(account.name)}</h1>
    <p class="placeholder-copy">
      Account: <strong>${escapeHtml(account.email)}</strong>.
      This augments this account's native Sent folder — it does not replace
      it. Submitting a message hands it to Station essentially immediately;
      local acceptance is not remote delivery.
      <span class="badge badge-warning">Real delivery evidence unavailable</span>
      Station's real outbound-queue history has no per-account filter or
      correlation today — showing it here would leak every other account's
      traffic. Until Station exposes secure per-account evidence, this view
      shows only <span class="badge badge-fixture">demo data</span> scoped to
      this account, standing in for that real per-account view. Vessel-wide
      Station evidence is available only from the Station-wide operational
      surface, never from an individual account's Sent view. Authenticated
      and permission-scoped Station API access is not yet implemented — the
      current Station API is loopback-only with no account boundary at all
      (see <code>docs/STATION_API_CONTRACT_GAPS.md</code>).
    </p>

    <table class="data-table">
      <thead>
        <tr>
          <th>Subject</th>
          <th>Recipients</th>
          <th>Important</th>
          <th>State</th>
          <th>Bytes</th>
          <th>Progress</th>
          <th>Evidence</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody id="sent-status-tbody"></tbody>
    </table>
  `;

  const tbody = container.querySelector("#sent-status-tbody");
  if (rows.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 8;
    td.textContent = "No sent messages tracked yet.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  for (const row of rows) {
    tbody.appendChild(buildRow(row));
  }
}

function buildRow(row) {
  const tr = document.createElement("tr");
  tr.className = row.isFixture ? "is-fixture-row" : "";

  const subjectCell = document.createElement("td");
  subjectCell.textContent = row.subject || "(no subject)";
  if (row.isFixture) {
    subjectCell.appendChild(document.createTextNode(" "));
    const fx = document.createElement("span");
    fx.className = "badge badge-fixture";
    fx.textContent = "Demo";
    subjectCell.appendChild(fx);
  }
  tr.appendChild(subjectCell);

  tr.appendChild(textCell(row.recipients.join(", ") || "—"));

  const importantCell = document.createElement("td");
  importantCell.style.textAlign = "center";
  const importance = normalizeImportance(row);
  if (importance.state === "important") {
    const star = document.createElement("span");
    star.textContent = "★";
    star.title = "Marked Important — display metadata only, does not affect delivery order or scheduling";
    importantCell.appendChild(star);
  } else if (importance.state === "unknown") {
    importantCell.title = "Importance evidence unavailable for this row";
  } else {
    importantCell.title = "Not marked Important";
  }
  tr.appendChild(importantCell);

  const stateCell = document.createElement("td");
  const stateBadge = document.createElement("span");
  stateBadge.className = `badge ${STATE_BADGE[row.state] || "badge-neutral"}`;
  stateBadge.textContent = STATE_LABEL[row.state] || row.state;
  stateCell.appendChild(stateBadge);
  tr.appendChild(stateCell);

  tr.appendChild(textCell(`${formatBytes(row.bytesTransferred)} / ${formatBytes(row.bytesTotal)}`));

  const progressCell = document.createElement("td");
  if (row.bytesTotal && row.bytesTransferred != null) {
    // Only rendered when we have real bytes-transferred evidence (queued: 0,
    // or a fixture mid-transfer value) — never inferred from a lifecycle
    // state, so "left_local_queue" cannot silently imply 100%.
    const pct = Math.min(100, Math.round((row.bytesTransferred / row.bytesTotal) * 100));
    progressCell.innerHTML = `
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div class="gap-note">${pct}%</div>
    `;
  } else if (row.state === "delivered" || row.state === "remote_accepted") {
    progressCell.innerHTML = `
      <div class="progress-track"><div class="progress-fill" style="width:100%"></div></div>
      <div class="gap-note">100%</div>
    `;
  } else {
    progressCell.innerHTML = `<div class="gap-note">Not measured</div>`;
  }
  tr.appendChild(progressCell);

  const evidenceCell = document.createElement("td");
  evidenceCell.innerHTML = `
    <div class="gap-note">Left local queue: ${formatTimestamp(row.leftLocalQueueAtUnix ?? null)}</div>
    <div class="gap-note">Confirmed transport/delivery: ${row.transmittedAtUnix ? formatTimestamp(row.transmittedAtUnix) : "not yet available"}</div>
    <div class="gap-note">Confirmed receipt: ${row.confirmedReceiptAtUnix ? formatTimestamp(row.confirmedReceiptAtUnix) : "not yet available"}</div>
    ${row.waitingReason ? `<div class="gap-note">Waiting: ${escapeHtml(row.waitingReason)}</div>` : ""}
  `;
  tr.appendChild(evidenceCell);

  const actionCell = document.createElement("td");
  const actions = validNextActions(row);
  if (actions.length === 0) {
    actionCell.textContent = "—";
  } else {
    for (const action of actions) {
      const btn = document.createElement("button");
      btn.className = "btn btn-sm";
      btn.type = "button";
      btn.textContent = ACTION_LABEL[action] || action;
      btn.disabled = true;
      btn.title = "Station does not yet expose queue mutation (see docs/STATION_API_CONTRACT_GAPS.md)";
      actionCell.appendChild(btn);
    }
  }
  tr.appendChild(actionCell);

  return tr;
}

function textCell(text) {
  const td = document.createElement("td");
  td.textContent = text;
  return td;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML;
}
