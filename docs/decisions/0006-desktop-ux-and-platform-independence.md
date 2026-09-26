# Decision 0006 — Desktop UX inheritance and platform independence

**Current policy supersession (2026-09-11):** [Decision 0009](0009-ordinary-mail-scheduling-and-importance.md) overrides all older ordinary Priority classes, premiums and inbound/outbound reprioritization language retained below as decision history. Only Emergency and Ordinary remain; Important is conventional metadata only. Recipient ordering is a preference within the local-account portion of Band 2 under [Project ADR-008](https://github.com/OceanMail/oceanmail-project/blob/main/docs/decisions/ADR-008-four-band-scheduling-and-channel-use.md), never guaranteed transport precedence. ADR-008's Bands 0–3 supersede Decision 0009's historical five-band hierarchy. The [Mail model correction](../../desktop/docs/MAIL_MODEL_CORRECTION.md) supersedes the historical user-facing Outbox presentation. Current account-scoped Available ownership/authorization follows the [merged Station logical contract](https://github.com/OceanMail/oceanmail-station-archive/blob/7a132b6ea4967c600dc8c673718d00b09c3ad42b/docs/AVAILABLE_MANIFEST_ACCOUNT_CONTRACT.md).

- **Status:** Accepted
- **Date:** 2026-09-06
- **Supersedes:** the mobile-foundation preference in Decision 0005. Decision 0005 remains authoritative for Thunderbird as the OceanMail Desktop foundation, dedicated OceanMail packaging, coexistence with stock Thunderbird, and the narrow-fork rule.

## Context

OceanMail 0.1 produced a substantial interactive desktop prototype and a detailed owner-approved UI decision set before the communications implementation pivoted to HERMES/Mercury and standards-based SMTP/IMAP. The 0.1 transport architecture is obsolete, but the prototype remains valuable as the product/interaction reference for OceanMail Desktop.

Decision 0005 selected Thunderbird as the Desktop foundation so OceanMail can reuse mature mail mechanics instead of rebuilding an email client. Early Tranche 2 work has further shown that OceanMail can provision a native Thunderbird IMAP/SMTP account, open Thunderbird's native Inbox/mail tabs and compose windows, and preserve an OceanMail-owned top-level Space.

The product goal is therefore not to replace the 0.1 interface with stock Thunderbird. It is to reproduce the accepted OceanMail experience by combining OceanMail-owned navigation/status/planning surfaces with Thunderbird's mature native mail behavior.

Cross-platform desktop support is a primary reason for selecting Thunderbird. OceanMail should not throw that advantage away through unnecessary operating-system-specific client code or a large Thunderbird source fork.

Mobile is no longer part of the near-term client implementation plan. The Desktop experience should be made excellent first; iOS and Android will be separate later efforts and may use different foundations.

## Decision

### The 0.1 prototype is the Desktop UX reference, not an implementation source

OceanMail Desktop development must review and use the accepted 0.1 interface decisions and owner refinements as a design guide.

The primary historical references are:

- `OceanMail/oceanmail-0.1-prototype/docs/UI-DESIGN-DECISION-AUDIT-2026-08-31.md`;
- `OceanMail/oceanmail-0.1-prototype/docs/USER-INTERFACE-DESIGN.md`;
- `OceanMail/oceanmail-0.1-prototype/docs/OMAIL-TRANSFER-AND-RETRIEVAL-UX.md`;
- `OceanMail/oceanmail-0.1-prototype/docs/adr/0005-owner-ui-refinement-boundaries.md`; and
- the final interactive prototype itself when visual/layout details are not captured completely in prose.

Do not copy the old Rust/egui implementation architecture or revive BEMPIC/M4P assumptions. Current accepted 0.2 decisions and design documents always override conflicting 0.1 behavior.

The purpose of consulting 0.1 is to preserve what made OceanMail distinct: its information architecture, visual hierarchy, constrained-mail workflow, truthful transfer state, budget awareness, Station visibility, and operator-focused maritime UX.

### Thunderbird is the mail foundation, not the visual specification

OceanMail should use Thunderbird's native functionality wherever Thunderbird already solves the ordinary email problem well, including:

- message storage and IMAP synchronization;
- MIME parsing/rendering;
- message list/reader behavior where reusable;
- compose editor and addressing;
- reply, reply-all, and forward;
- Drafts/Sent/Trash/local folder machinery where appropriate;
- search;
- notifications and desktop integration; and
- other mature mail-client mechanics that do not conflict with OceanMail semantics.

OceanMail-owned UI should wrap and invoke those native capabilities rather than recreate them in HTML merely to imitate the 0.1 prototype pixel-for-pixel.

Conversely, Thunderbird's default interface must not be allowed to erase OceanMail concepts that ordinary email does not model. OceanMail remains responsible for Available OMail, retrieval manifests, Saved behavior, truthful Sent/evidence augmentation, conventional Important metadata, separate Emergency behavior, budgets, representation choices, persistent communications status, Station/Grid state, and other constrained-maritime behavior.

### Desktop extension must remain portable across Thunderbird desktop platforms

The OceanMail Desktop extension/application layer must be designed to run on supported desktop Thunderbird builds on:

- Windows;
- macOS; and
- Linux.

This is a core architecture goal, not a later cosmetic port.

Prefer cross-platform MailExtension APIs, HTML/CSS/JavaScript, Thunderbird Spaces, native Thunderbird mail APIs, and shared assets. The existing privileged Experiment API mechanism may be used only for narrowly scoped capabilities unavailable through ordinary MailExtension APIs and should remain portable within the pinned Thunderbird desktop baseline.

Operating-system-specific code belongs primarily in packaging, installer, launcher, update, signing/notarization, and desktop-integration layers rather than in OceanMail product behavior.

A feature should not become Windows-only, macOS-only, or Linux-only merely because that implementation is expedient. A genuine Thunderbird/platform limitation that would materially change the product requires project-lead review.

### OceanMail Desktop remains its own product package

Cross-platform extension installability does not reverse Decision 0005.

The intended released product remains OceanMail Desktop: a dedicated OceanMail-branded package with its own Thunderbird base, profile root, configuration, extension/theme state, updater state, application identity, and uninstall ownership.

However, the OceanMail extension should also remain installable/testable on compatible stock desktop Thunderbird installations on Windows, macOS, and Linux where practical. This provides a useful portability test and keeps OceanMail product logic from becoming unnecessarily tied to one custom binary.

Installing the extension in stock Thunderbird for development/testing is not the primary 0.x product experience and must not weaken the requirement that the packaged OceanMail Desktop application coexist independently with ordinary Thunderbird.

### Carry forward the accepted desktop interaction model

The current Desktop implementation should use the 0.1 interface as the reference for these broad behaviors, reconciled with current 0.2 semantics:

- familiar light-blue communications-client identity rather than a radio terminal;
- required dark/night mode;
- persistent far-left collapsible primary navigation with accessible icon-only mode;
- primary product areas Mail, Calendar, Contacts, Chat, and Station, with Settings separate, while Mail/Station are implemented first;
- account-scoped Mail navigation including Inbox, Available, Saved, Drafts, Sent and Trash, with no user-facing OceanMail Outbox;
- a prominent Emergency action independent of ordinary mailbox navigation;
- context-only message actions rather than duplicating mailbox destinations as toolbar buttons;
- a persistent high-level communications/status surface that opens a richer Dashboard;
- `Grid` as the user-facing network term;
- compact/watch presentation suitable for an underway vessel;
- background communications that remain visible without stealing focus;
- strong non-color-only direction/state indicators and keyboard accessibility;
- Available as metadata/manifest only, never pretending the remote body is already local;
- explicit constrained-link selection/order, estimates, budget effects, and representation choices;
- truthful queued/transport/receipt evidence presented with Sent/status and Station operational surfaces;
- familiar native message reading/reply/forward behavior supplied by Thunderbird wherever possible; and
- Station views that answer operator questions before exposing protocol detail.

The detailed mapping is maintained in `docs/design/desktop-interface-inheritance.md`.

### Current 0.2 semantics override historical 0.1 rules

Examples of deliberate 0.2 changes that must not be restored merely because the prototype contained them include:

- ordinary constrained-link OMail requires recipient approval/selection regardless of message size; the old size-based automatic-delivery threshold is superseded;
- ordinary user mail has no sender-selectable Priority class; Important is metadata only and Emergency is the only user-originated class that changes precedence;
- there is no user-facing OceanMail Outbox; Station owns durable queue/transport work after submission and Desktop augments Sent/status truthfully;
- the Client and autonomous Station are separate components; the old combined Station Suite process model is superseded;
- Internet mail crosses through the current OceanMail Internet boundary architecture rather than the old BEMPIC/M4P model;
- confidentiality/security wording must reflect the actual path/security evidence rather than applying a blanket historical `all OMail is public radio` notice to every possible OMail path;
- current relay/gateway semantics and accounting decisions override old prototype mode names and constants; and
- exact quota amounts, credit formulas, thresholds, attachment limits, timeouts, and similar tunable values remain current service policy rather than prototype constants.

### Mobile development is deferred

Do not use Desktop work to begin OceanMail Lite, Android, or iOS implementation.

The near-term sequence is:

1. make OceanMail Desktop a compelling, coherent OceanMail experience;
2. validate it across Windows, macOS, and Linux desktop Thunderbird foundations;
3. learn which product concepts and APIs are genuinely stable from real Desktop use; and
4. only then design/build iOS and Android clients as separate projects.

No current decision requires the future mobile clients to use Thunderbird/K-9/Thunderbird iOS or any other particular foundation. Those choices will be evaluated later on their own merits.

Mobile should ultimately preserve OceanMail product semantics and service contracts where appropriate, but it is not required to share the Desktop extension architecture or codebase.

## Consequences

- ChatGPT/Codex/Desktop workers should consult the 0.1 UX sources before undertaking large interface tranches.
- Review should judge whether implementation preserves OceanMail's intended product experience, not merely whether it is valid Thunderbird extension code.
- Thunderbird-native mail UI should be reused aggressively where doing so preserves OceanMail semantics.
- OceanMail-specific constrained-mail and Station surfaces remain first-class and must not be simplified away because Thunderbird does not provide them natively.
- Cross-platform compatibility becomes a continuous Desktop constraint; Linux-only development scaffolding must not accidentally become product architecture.
- A small Experiment API is acceptable when necessary, but growing privileged Thunderbird-internal dependencies requires justification.
- Mobile work is removed from the active Desktop roadmap until the Desktop product experience is mature enough to serve as the reference design.
