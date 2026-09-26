# Decision 0008 — Account-scoped OceanMail Mail views and native iconography

**Current policy supersession (2026-09-11):** [Decision 0009](0009-ordinary-mail-scheduling-and-importance.md) overrides all older ordinary Priority classes, premiums and inbound/outbound reprioritization language retained below as decision history. Only Emergency and Ordinary remain; Important is conventional metadata only. Recipient ordering is a preference within the local-account portion of Band 2 under [Project ADR-008](https://github.com/OceanMail/oceanmail-project/blob/main/docs/decisions/ADR-008-four-band-scheduling-and-channel-use.md), never guaranteed transport precedence. ADR-008's Bands 0–3 supersede Decision 0009's historical five-band hierarchy. The [Mail model correction](../../desktop/docs/MAIL_MODEL_CORRECTION.md) establishes the current account Mail hierarchy and removes user-facing Outbox. Current account-scoped Available ownership/authorization follows the [merged Station logical contract](https://github.com/OceanMail/oceanmail-station/blob/main/docs/AVAILABLE_MANIFEST_ACCOUNT_CONTRACT.md).

- **Status:** Accepted
- **Date:** 2026-09-06
- **Builds on:** Decision 0007 (Thunderbird native chrome is the OceanMail Desktop shell)

## Context

Visual review of the corrected Tranche 3 native-shell prototype exposed two remaining product problems.

First, `Available OMail` was implemented as its own top-level Thunderbird Space. That is the wrong information architecture. Available messages belong to a specific OceanMail account and the decisions around retrieval, representations, receive budget, and recipient-preferred order are account-specific. A vessel may have a ship account and several crew accounts configured in the same OceanMail Desktop profile. Each account must therefore have its own Available state and retrieval plan.

Second, the OceanMail-added Spaces buttons used fixed-color circular SVGs that visibly differed from Thunderbird's built-in Spaces icons. Thunderbird's native Spaces toolbar is a coherent monochrome, theme-aware icon system with a default 20px icon size (16px compact / 24px touch) and current-color fill/stroke behavior. OceanMail additions must look native to that system rather than like unrelated extension shortcuts.

## Decision

### Available is a per-account Mail destination, not a top-level application Space

`Available` belongs inside Thunderbird's native Mail experience under each configured OceanMail account.

The current conceptual hierarchy is:

```text
Ship Account
  Inbox
  Available
  Saved
  Drafts
  Sent
  Trash

Captain
  Inbox
  Available
  Saved
  Drafts
  Sent
  Trash

Crew Member
  Inbox
  Available
  Saved
  Drafts
  Sent
  Trash
```

There is no user-facing OceanMail Outbox. Once Desktop submits ordinary mail, Station owns durable queue/transport work; Sent/status and Station operational surfaces present truthful evidence.

`Available` is visually folder-like because that is the correct user mental model: it is mail addressed to that account which is known to exist remotely but has not yet been retrieved across the constrained link.

However, it is **not** an actual IMAP folder and must not create fake local message bodies or imply that the remote messages have already been synchronized. It is an OceanMail pseudo-folder / account-scoped Mail view backed by authorized Station/Server manifest metadata.

Selecting an account's `Available` row should keep the user in Thunderbird's native Mail space and show that account's Available-message list/retrieval planner in the normal Mail content area. The view may use OceanMail-owned rendering because Thunderbird's native message model cannot represent bodies that are intentionally not local, but it should visually harmonize with the native thread/message view rather than look like a separate web application.

The selected account identity is part of the view state. All of these are scoped to that account:

- Available manifest rows;
- message counts/badges;
- retrieval selections and recipient-preferred ordering;
- hold/defer state;
- conventional Important metadata for display only;
- attachment/image representation choices;
- receive budget and earned-credit availability;
- any explicit credit authorization;
- retrieval-plan intent; and
- later authoritative retrieval/evidence state.

Important must not alter transport precedence, gateway/path selection, credits/quota treatment, or automatic retrieval order.

No account may see or spend another account's budget/credit merely because both accounts are configured in the same Desktop profile.

### Multiple configured accounts are a first-class requirement

OceanMail Desktop must not hard-code one `bob@station.test` identity into product UI logic beyond laboratory bootstrap fixtures.

The Mail integration layer must identify OceanMail accounts dynamically and bind each OceanMail pseudo-folder/view to the corresponding Thunderbird account/identity and, later, OceanMail account identifier.

The same rule applies to account-scoped Sent/evidence and Saved behavior where the underlying state belongs to a user/account rather than to the Station globally. Vessel-wide queue/traffic state remains a Station operational surface and must not leak into an individual account merely because both are visible in one profile.

### Public API first; narrow Mail-chrome Experiment allowed for pseudo-folders

Thunderbird's public MV3 `mailTabs` API currently exposes only built-in folder-pane modes (`all`, `unified`, `tags`, `unread`, `favorite`, `recent`) and does not expose a supported API for inserting an arbitrary custom child row beneath an account in the folder tree.

Thunderbird's internal folder tree is explicitly built from `folder-tree-row` elements beneath server/account rows, and its native 3-pane has a web-content browser capability. Therefore a narrow, pinned-build-aware Experiment API is acceptable to prototype the required integration if public APIs remain insufficient.

The Experiment surface should be limited to the minimum needed to:

1. add/remove/update an `Available` pseudo-folder row under each OceanMail account root;
2. associate the row with the correct Thunderbird/OceanMail account identity;
3. expose/update its account-specific count/badge/state;
4. detect selection of that pseudo-folder; and
5. cause the native Mail 3-pane to present the account-scoped OceanMail Available view without creating a second application shell.

Do not turn this into a general-purpose folder-tree mutation API. Do not create a fake IMAP folder merely to avoid the integration work.

### Available should look like a mailbox view with OceanMail-specific controls

The Available view should inherit as much visual structure as practical from Thunderbird's Mail UI:

- account/folder-pane context remains visible;
- rows resemble a normal mail list rather than a dashboard/table application;
- sender, subject, date/freshness, size, attachment presence, and Important metadata are recognizable mail-list concepts;
- OceanMail-specific retrieval controls are added in the same view where needed;
- no remote body preview is shown;
- selection is retrieval planning, not local message selection/delivery proof;
- budget/time/representation controls should be visually secondary to the mail list, not turn the screen into a separate administrative app.

When retrieval completes and the message becomes genuinely local, normal Thunderbird Inbox/message behavior takes over.

### OceanMail-added icons must match Thunderbird's native visual grammar

OceanMail additions to Thunderbird chrome must use the same visual language as Thunderbird's built-in icons.

For native Spaces/folder/toolbar additions:

- no fixed blue circular icon backgrounds;
- no multicolor badge-like artwork for ordinary navigation icons;
- use simple monochrome line/glyph shapes at the same apparent weight as Thunderbird icons;
- design for Thunderbird's native Spaces dimensions (20px default, 16px compact, 24px touch) with appropriate high-DPI assets;
- use theme-aware/current-color behavior so icons inherit light/dark/active/hover state from Thunderbird chrome;
- provide light/dark theme icon variants only when genuinely needed;
- active-state color/background comes from the OceanMail/Thunderbird theme, not from baked-in SVG fills;
- maintain a coherent family across Available, Station, Emergency and any later OceanMail native-chrome additions.

Emergency may remain visually more prominent through placement, badge/accent state, or native theme styling, but its base icon should still belong to the same icon family.

### Top-level navigation remains application-level only

The native Spaces toolbar is for application-level destinations such as Mail, Calendar, Contacts, Station, and later OChat.

Account-scoped mail concepts such as Available should not occupy a global top-level Spaces button simply because the extension API makes that easier.

## Consequences

- PR #7 removed the top-level `Available` Spaces button and established per-account native-Mail placement; the merged implementation and Mail model correction are the current baseline.
- The Available planner model/tests remain useful, but their data model must remain account-scoped and must not substitute client filtering for backend authorization.
- OceanMail Spaces icons use a Thunderbird-compatible monochrome/theme-aware icon family.
- UI reviews should test at least two OceanMail accounts simultaneously to catch accidental global state, shared budget, or wrong-account retrieval behavior.
- Account-scoped identity/budget separation is a product requirement even while current Station APIs remain incomplete; missing APIs stay explicit gaps rather than being simulated as global state.
