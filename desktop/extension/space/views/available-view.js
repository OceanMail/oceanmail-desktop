// Available OMail view: renders the retrieval-planning UI on top of the
// pure createAvailablePlanner model. This module owns DOM only; all
// selection/aggregate/budget logic lives in models/available-planner.js so
// it stays testable and swappable for a real Station manifest source later.
//
// Decision 0008: Available is account-scoped, not a global application
// view. This module is mounted once per OceanMail account (see
// space.js) and must never let one account's selections, budget, or
// credit leak into another's — each mount creates its own isolated planner
// instance from that account's own fixture set.

import { createAvailablePlanner } from "../models/available-planner.js";
import { getAvailableFixturesForAccount } from "../fixtures/available-fixtures.js";
import { normalizeImportance } from "../lib/importance.js";
import { formatBytes, formatDuration, formatTimestamp } from "../lib/freshness.js";

/**
 * @param {HTMLElement} container
 * @param {{email: string, name: string}} account - the OceanMail account
 *   this Available view/planner instance is scoped to. Never shared with
 *   another account's mount.
 */
export function mountAvailableView(container, account) {
  const { budget, rows: fixtureRows } = getAvailableFixturesForAccount(account.email);
  const planner = createAvailablePlanner({
    rows: fixtureRows,
    budget
  });

  render();

  function render() {
    const rows = planner.getRows();
    const agg = planner.aggregate();

    container.innerHTML = `
      <h1>Available — ${escapeHtml(account.name)}</h1>
      <p class="placeholder-copy">
        Account: <strong>${escapeHtml(account.email)}</strong>. Available is a
        Station retrieval manifest for <em>this account only</em>, not an
        IMAP folder — message bodies are never shown here. Selecting a row
        adds its text body to this account's local retrieval plan (no
        Station queue submission exists yet); attachments are chosen
        separately. Ordinary constrained-link OMail always requires this
        explicit selection, regardless of size.
        <span class="badge badge-fixture">Demo data</span>
        oceanmail-station does not yet expose a real, account-scoped
        Available/manifest endpoint (see
        <code>docs/STATION_API_CONTRACT_GAPS.md</code>) — every row below is
        development fixture data for this account, not a Station observation.
      </p>

      <div class="card">
        <div class="card-title-row"><h2>Retrieval plan</h2></div>
        <div class="field-grid">
          <div class="field">
            <span class="field-label">Selected bytes</span>
            <span class="field-value is-mono" id="agg-selected-bytes"></span>
          </div>
          <div class="field">
            <span class="field-label">Estimated time</span>
            <span class="field-value is-mono" id="agg-time"></span>
          </div>
          <div class="field">
            <span class="field-label">Included budget remaining</span>
            <span class="field-value is-mono" id="agg-remaining"></span>
          </div>
          <div class="field">
            <span class="field-label">Credit needed / available</span>
            <span class="field-value is-mono" id="agg-credit"></span>
          </div>
        </div>
        <div id="agg-approval" style="margin-top:10px;"></div>
        <p class="gap-note" style="margin-top:8px;">
          All values here are estimates for planning only — not proof of
          download, billing, or delivery.
        </p>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th></th>
            <th>Order</th>
            <th>Sender</th>
            <th>Important</th>
            <th>Subject</th>
            <th>Body</th>
            <th>Attachment</th>
            <th>Freshness</th>
            <th>Status / action</th>
          </tr>
        </thead>
        <tbody id="available-tbody"></tbody>
      </table>
    `;

    const tbody = container.querySelector("#available-tbody");
    for (const row of rows) {
      tbody.appendChild(buildRow(row));
    }

    container.querySelector("#agg-selected-bytes").textContent = formatBytes(agg.selectedBytes);
    container.querySelector("#agg-time").textContent = formatDuration(agg.estimatedSeconds);
    container.querySelector("#agg-remaining").textContent =
      `${formatBytes(agg.projectedRemainingIncludedBytes)} of ${formatBytes(agg.includedRemainingBytes)}`;
    container.querySelector("#agg-credit").textContent =
      `${formatBytes(agg.creditNeededBytes)} / ${formatBytes(agg.availableCreditBytes)}`;

    const approvalEl = container.querySelector("#agg-approval");
    if (agg.requiresApproval) {
      approvalEl.innerHTML = `
        <label style="display:flex;align-items:center;gap:8px;font-size:0.86rem;">
          <input type="checkbox" id="agg-approve-checkbox" ${agg.creditApproved ? "checked" : ""} />
          This selection needs ${formatBytes(agg.creditNeededBytes)} of earned credit.
          I approve using it for this batch.
        </label>
      `;
      approvalEl.querySelector("#agg-approve-checkbox").addEventListener("change", (event) => {
        planner.approveCredit(event.target.checked);
        render();
      });
    } else {
      approvalEl.innerHTML = "";
    }
  }

  function buildRow(row) {
    const tr = document.createElement("tr");
    tr.className = row.effectiveBlockedReason ? "is-blocked" : "";

    const selectCell = document.createElement("td");
    if (row.eligible && !row.held) {
      // Wrapped in a label so the whole cell is a click/tap target, not just
      // the checkbox's small intrinsic hit area — both a real accessibility
      // improvement and more robust for automated interaction.
      const label = document.createElement("label");
      label.style.display = "flex";
      label.style.alignItems = "center";
      label.style.justifyContent = "center";
      label.style.cursor = "pointer";
      label.style.padding = "6px";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = row.selected;
      checkbox.setAttribute("aria-label", `Select "${row.subject}" for retrieval`);
      checkbox.addEventListener("change", () => {
        const result = planner.toggleBodySelect(row.id);
        if (!result.ok) {
          checkbox.checked = row.selected;
          window.alert(`Cannot select: ${result.reason}`);
        }
        render();
      });
      label.appendChild(checkbox);
      selectCell.appendChild(label);
    }
    tr.appendChild(selectCell);

    const orderCell = document.createElement("td");
    if (row.order) {
      orderCell.style.display = "flex";
      orderCell.style.alignItems = "center";
      orderCell.style.gap = "4px";
      const badge = document.createElement("span");
      badge.className = "row-order-num";
      badge.textContent = String(row.order);
      orderCell.appendChild(badge);

      const selectedCount = planner.getOrderedSelection().length;
      const upBtn = document.createElement("button");
      upBtn.type = "button";
      upBtn.className = "btn btn-sm";
      upBtn.textContent = "▲";
      upBtn.setAttribute("aria-label", `Move "${row.subject}" earlier in retrieval order`);
      upBtn.disabled = row.order === 1;
      upBtn.addEventListener("click", () => {
        planner.moveSelected(row.id, -1);
        render();
      });
      orderCell.appendChild(upBtn);

      const downBtn = document.createElement("button");
      downBtn.type = "button";
      downBtn.className = "btn btn-sm";
      downBtn.textContent = "▼";
      downBtn.setAttribute("aria-label", `Move "${row.subject}" later in retrieval order`);
      downBtn.disabled = row.order === selectedCount;
      downBtn.addEventListener("click", () => {
        planner.moveSelected(row.id, 1);
        render();
      });
      orderCell.appendChild(downBtn);
    }
    tr.appendChild(orderCell);

    tr.appendChild(textCell(row.sender));

    const importantCell = document.createElement("td");
    importantCell.style.textAlign = "center";
    const importance = normalizeImportance(row);
    if (importance.state === "important") {
      const star = document.createElement("span");
      star.textContent = "★";
      star.title = "Marked Important by the sender — display only, does not change retrieval order";
      importantCell.appendChild(star);
    } else if (importance.state === "unknown") {
      importantCell.title = "Importance evidence unavailable for this row";
    } else {
      importantCell.title = "Not marked Important";
    }
    tr.appendChild(importantCell);

    tr.appendChild(textCell(row.subject));
    tr.appendChild(textCell(`${formatBytes(row.bodyBytes)} · ~${formatDuration(row.bodySeconds)}`));

    const attachmentCell = document.createElement("td");
    if (row.attachment) {
      attachmentCell.appendChild(buildAttachmentControl(row));
    } else {
      attachmentCell.textContent = "—";
    }
    tr.appendChild(attachmentCell);

    tr.appendChild(textCell(formatTimestamp(row.freshnessUnix)));

    const actionCell = document.createElement("td");
    if (row.effectiveBlockedReason) {
      const reason = document.createElement("span");
      reason.className = "badge badge-neutral";
      reason.textContent = row.effectiveBlockedReason;
      actionCell.appendChild(reason);
    }
    if (row.eligible) {
      const holdBtn = document.createElement("button");
      holdBtn.className = "btn btn-sm";
      holdBtn.type = "button";
      holdBtn.textContent = row.held ? "Resume" : "Hold";
      holdBtn.addEventListener("click", () => {
        planner.toggleHold(row.id);
        render();
      });
      actionCell.appendChild(holdBtn);
    }
    tr.appendChild(actionCell);

    return tr;
  }

  function buildAttachmentControl(row) {
    const wrap = document.createElement("div");
    const select = document.createElement("select");
    select.setAttribute("aria-label", `Attachment representation for "${row.subject}"`);
    const deferOption = document.createElement("option");
    deferOption.value = "";
    deferOption.textContent = "Deferred";
    deferOption.selected = row.attachmentRepresentationId == null;
    select.appendChild(deferOption);
    for (const rep of row.attachment.representations) {
      const option = document.createElement("option");
      option.value = rep.id;
      option.textContent = `${rep.label} — ${formatBytes(rep.bytes)} (~${formatDuration(rep.seconds)})`;
      option.selected = row.attachmentRepresentationId === rep.id;
      select.appendChild(option);
    }
    select.disabled = !row.eligible || row.held;
    select.addEventListener("change", () => {
      const value = select.value === "" ? null : select.value;
      const result = planner.setAttachmentRepresentation(row.id, value);
      if (!result.ok) {
        window.alert(`Cannot use that representation: ${result.reason}`);
      }
      render();
    });
    wrap.appendChild(select);
    return wrap;
  }

  function textCell(text) {
    const td = document.createElement("td");
    td.textContent = text;
    return td;
  }

  return { planner };
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML;
}
