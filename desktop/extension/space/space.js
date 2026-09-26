// OceanMail page bootstrap.
//
// Per Decision 0007 (native Thunderbird shell): this file does not drive a
// full application shell with its own primary/secondary navigation.
// Station and Emergency are opened by their own native Spaces-toolbar
// buttons (background.js), which set `?page=<name>` on this same
// index.html. Per Decision 0008 (account-scoped Mail views) and the
// owner's final mail-model decision (no user-facing Outbox — Sent carries
// delivery status instead): Available and Sent-status are not Spaces at
// all — they are opened by experiment/mail-folders.js loading this same
// index.html with `?page=available|sent&account=<email>&accountName=<name>`
// into a content region it manages inside Thunderbird's native Mail
// 3-pane, once per OceanMail account (Available from its own pseudo-folder
// row; Sent-status from a banner shown on the account's real, native Sent
// folder). This file reads those query parameters, mounts exactly the
// right page (scoped to the right account where relevant), and wires only
// page-local controls (theme, and — Station page only — the Watch/Compact
// density toggle). It never renders navigation between pages/accounts;
// that is exclusively the native Spaces toolbar's and native folder pane's
// job.

import { Implemented } from "../station/station-client.js";
import { createPreferencesStore, createInMemoryStorageArea } from "./lib/preferences.js";
import { formatFreshness } from "./lib/freshness.js";
import { mountAvailableView } from "./views/available-view.js";
import { mountSentStatusView } from "./views/sent-status-view.js";
import { mountDashboardView } from "./views/dashboard-view.js";
import { mountEmergencyView } from "./views/emergency-view.js";
import { mountWatchView } from "./views/watch-view.js";
import { mountStationView } from "./views/station-view.js";

const PAGE_TITLES = {
  available: "Available",
  sent: "Sent status",
  station: "Station",
  emergency: "Emergency"
};

const storageArea =
  typeof browser !== "undefined" && browser.storage && browser.storage.local
    ? browser.storage.local
    : createInMemoryStorageArea();
const preferences = createPreferencesStore(storageArea);

const queryParams = new URLSearchParams(window.location.search);
const page = queryParams.get("page") || "station";
// Present only for account-scoped pages (Available/Outbox), set by
// experiment/mail-folders.js from the real Thunderbird account it found —
// never invented/defaulted here, so a missing value is a visible bug rather
// than silently falling back to some other account's data.
const account = queryParams.has("account")
  ? { email: queryParams.get("account"), name: queryParams.get("accountName") || queryParams.get("account") }
  : null;

init();

async function init() {
  const prefs = await preferences.load();
  applyTheme(prefs.theme);

  const titleSuffix = account ? `${PAGE_TITLES[page] || page} — ${account.name}` : PAGE_TITLES[page] || "Station";
  document.title = `OceanMail — ${titleSuffix}`;
  document.getElementById("page-title").textContent = titleSuffix;

  wireTopbar();
  const watchToggle = document.getElementById("watch-toggle");
  if (page === "station") {
    watchToggle.hidden = false;
    applyWatchToggleUI(prefs.watchMode);
  } else {
    watchToggle.hidden = true;
  }

  await mountPage();

  wireStatusPill();
  await refreshStatusPill();
  setInterval(refreshStatusPill, 30_000);
}

// ---------------------------------------------------------------------------
// Page mounting
// ---------------------------------------------------------------------------

async function mountPage() {
  const root = document.getElementById("page-root");
  if (page === "available") {
    mountAvailableView(root, requireAccount());
  } else if (page === "sent") {
    await mountSentStatusView(root, requireAccount());
  } else if (page === "emergency") {
    mountEmergencyView(root);
  } else {
    await mountStationPage(root);
  }
}

function requireAccount() {
  if (!account) {
    // Should be unreachable: mail-folders.js always sets `account` for
    // these two pages. Fail loudly rather than silently showing no
    // account's — or worse, an implicitly-shared — data.
    throw new Error(`OceanMail: page=${page} requires an account, but none was provided in the URL`);
  }
  return account;
}

async function mountStationPage(root) {
  root.innerHTML = `
    <div id="station-section"></div>
    <hr class="section-divider" />
    <div id="station-dashboard-section"></div>
  `;
  mountStationView(root.querySelector("#station-section"));
  await renderStationDashboardSection();
}

async function renderStationDashboardSection() {
  const container = document.getElementById("station-dashboard-section");
  if (!container) {
    return;
  }
  const prefs = await preferences.load();
  if (prefs.watchMode) {
    await mountWatchView(container);
  } else {
    await mountDashboardView(container);
  }
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

function applyTheme(theme) {
  if (theme === "system") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
  const isDark = resolveIsDark(theme);
  const toggle = document.getElementById("theme-toggle");
  toggle.setAttribute("aria-pressed", String(isDark));
  toggle.textContent = isDark ? "☀" : "🌙";
  toggle.title = isDark ? "Switch to light mode" : "Switch to night mode";
}

function resolveIsDark(theme) {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : false;
}

// ---------------------------------------------------------------------------
// Watch / Compact mode (Station page only — a density mode, not a nav destination)
// ---------------------------------------------------------------------------

function applyWatchToggleUI(active) {
  const toggle = document.getElementById("watch-toggle");
  toggle.setAttribute("aria-pressed", String(active));
  toggle.title = active ? "Switch to full Dashboard" : "Switch to Watch / compact mode";
}

// ---------------------------------------------------------------------------
// Topbar (page-local only: theme + Station's Watch toggle)
// ---------------------------------------------------------------------------

function wireTopbar() {
  document.getElementById("theme-toggle").addEventListener("click", async () => {
    const prefs = await preferences.load();
    const currentlyDark = resolveIsDark(prefs.theme);
    const next = currentlyDark ? "light" : "dark";
    await preferences.set({ theme: next });
    applyTheme(next);
  });

  if (page === "station") {
    document.getElementById("watch-toggle").addEventListener("click", async () => {
      const prefs = await preferences.load();
      const next = !prefs.watchMode;
      await preferences.set({ watchMode: next });
      applyWatchToggleUI(next);
      await renderStationDashboardSection();
    });
  }

  if (typeof window !== "undefined" && window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", async () => {
      const prefs = await preferences.load();
      if (prefs.theme === "system") {
        applyTheme("system");
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Persistent status pill
//
// Truthfulness corrections (PR #7 review):
//  - navigator.onLine is device/OS network-availability, not verified
//    Internet reachability — labeled "unverified", never a confident "Online".
//  - GRID freshness must never be derived from the Postfix queue-observer's
//    observed_at_unix; Station exposes no Grid/link freshness at all, so
//    this always reads an explicit gap until such an endpoint exists.
//  - The queue-observer count/freshness is shown as its own honestly-labeled
//    segment, never blended into "GRID".
// ---------------------------------------------------------------------------

function wireStatusPill() {
  document.getElementById("status-pill").addEventListener("click", async () => {
    try {
      const spaces = await browser.spaces.query({ name: "oceanmail_station", isSelfOwned: true });
      if (spaces[0]) {
        await browser.spaces.open(spaces[0].id);
      }
    } catch (err) {
      console.error("[OceanMail] failed to open Station space:", err);
    }
  });
}

async function refreshStatusPill() {
  const internetDot = document.getElementById("status-dot-internet");
  const internetLabel = document.getElementById("status-label-internet");
  const online = typeof navigator !== "undefined" ? navigator.onLine : true;
  internetDot.className = `status-dot ${online ? "is-neutral" : "is-down"}`;
  internetLabel.textContent = online ? "INTERNET • unverified" : "INTERNET • offline";

  const stationDot = document.getElementById("status-dot-station");
  const stationLabel = document.getElementById("status-label-station");
  const gridLabel = document.getElementById("status-label-grid");
  const queueLabel = document.getElementById("status-label-queue");

  // GRID/link freshness has no Station API yet — always an explicit gap,
  // regardless of Station reachability or queue-observer freshness.
  gridLabel.textContent = "GRID • unavailable";

  try {
    const [, outboundQueue] = await Promise.all([Implemented.health(), Implemented.outboundQueue()]);
    stationDot.className = "status-dot is-ok";
    stationLabel.textContent = "STATION";
    const now = Math.floor(Date.now() / 1000);
    const entryCount = (outboundQueue.entries || []).length;
    queueLabel.textContent = `${entryCount} in Postfix (${formatFreshness(now, outboundQueue.observed_at_unix)})`;
  } catch {
    stationDot.className = "status-dot is-down";
    stationLabel.textContent = "STATION UNREACHABLE";
    queueLabel.textContent = "— observed";
  }
}
