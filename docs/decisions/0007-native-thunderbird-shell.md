# Decision 0007 — Thunderbird native chrome is the OceanMail Desktop shell

- **Status:** Accepted; Mail details are refined by Decisions 0008/0009 and the current Mail model correction
- **Date:** 2026-09-06
- **Supersedes:** the parts of Decisions 0005/0006 and current UX docs that describe a second OceanMail-owned primary navigation rail or a custom OceanMail Space as the primary application shell. Thunderbird remains the Desktop foundation; Decision 0006 remains authoritative for 0.1 UX inheritance, cross-platform desktop support, dedicated packaging, and deferred mobile work.

**Current Mail clarification:** There is no user-facing OceanMail Outbox and no ordinary sender-selectable transport Priority class. Per-account Mail is `Inbox / Available / Saved / Drafts / Sent / Trash`; `Important` is metadata only. Station owns durable queued/transport work after submission, while Desktop augments native Sent/status only with truthful authorized evidence. These later decisions refine, but do not reverse, this decision's native-shell architecture.

## Context

Tranche 3 implemented a technically functional OceanMail Space with its own far-left primary navigation rail, Mail subnavigation, status bar, Dashboard, Available, Outbox, Emergency, and Watch views. When reviewed visually next to Thunderbird's own built-in Spaces toolbar, the result felt like a web application running inside Thunderbird rather than OceanMail being built from Thunderbird.

That is the wrong product direction.

The value of Thunderbird is not only its SMTP/IMAP/MIME engine. Thunderbird already has a mature desktop application shell with native spaces for Mail, Address Book, Calendar, Tasks, Chat, and Settings, plus platform-native tabs, toolbars, menus, keyboard behavior, accessibility, and theming. OceanMail should transform and extend that shell instead of placing a second application shell beside it.

Thunderbird's current `spaces` API supports built-in-space discovery and extension-owned spaces/buttons. The public API cannot freely rewrite every property or behavior of built-in spaces, so a narrow cross-platform Experiment API may be justified where OceanMail must brand, hide, relabel, reorder, or repurpose native Thunderbird chrome and no supported public API exists.

## Decision

### Thunderbird itself becomes OceanMail Desktop

OceanMail Desktop is not an OceanMail web UI displayed inside Thunderbird.

The released product should feel like Thunderbird has become OceanMail:

- Thunderbird Mail becomes OceanMail Mail;
- Thunderbird Calendar becomes OceanMail Calendar with OceanMail-specific behavior layered on it;
- Thunderbird Address Book becomes OceanMail Contacts with OceanMail-specific behavior layered on it;
- the Chat position is reserved for OChat rather than exposing an unrelated generic chat product; until real OChat exists, generic Thunderbird Chat is hidden in the dedicated OceanMail profile;
- Station is added as a first-class native-style application destination;
- Emergency, Available/retrieval planning, Dashboard/status, constrained-link controls, budgets, and other OceanMail concepts are integrated into Thunderbird's existing chrome at the level where they naturally belong.

The native Thunderbird Spaces toolbar is the **single primary navigation system**. OceanMail must not render a second parallel primary navigation rail inside an extension page.

### Native spaces and native views should be reused first

Use Thunderbird's built-in application areas whenever the underlying function matches the OceanMail product concept:

- **Mail** — native Thunderbird mail space, folder pane, message list, reader, compose, search, Drafts, Sent, reply/forward, MIME, etc.;
- **Calendar** — native Thunderbird Calendar as the future OceanMail Calendar foundation;
- **Contacts** — native Thunderbird Address Book as the future OceanMail Contacts foundation;
- **Chat/OChat** — the native Chat slot is reserved for OChat; hide generic Thunderbird Chat until OChat exists, then integrate OChat through the native shell rather than exposing a second unrelated chat application;
- **Settings** — use native Thunderbird settings/account/configuration surfaces where appropriate, with OceanMail restrictions and OceanMail-specific settings integrated rather than duplicated in a web page.

OceanMail-specific views that have no Thunderbird equivalent may remain extension-owned content, but they must enter through native Thunderbird navigation/chrome rather than creating a second application shell.

Examples include:

- Available OMail / retrieval planner;
- Station management/status;
- Grid Dashboard;
- Watch/compact presentation;
- other future constrained-link planning surfaces.

### Mail should be modified, not wrapped

The native Mail space should become the normal OceanMail Mail experience.

OceanMail should layer its specific concepts into native Mail where feasible:

- Available should be reachable as an account-scoped OceanMail-specific Mail destination/control without pretending it is an IMAP folder;
- Saved is a real retained-mail mailbox/folder where supported by the current Mail model;
- native Sent should be augmented with truthful account-scoped Station evidence where secure correlation exists; there is no user-facing OceanMail Outbox;
- conventional Important metadata, budget, and representation controls should appear in compose/read/list contexts where relevant, without creating an ordinary transport Priority class;
- persistent OceanMail communications status should be integrated into native Thunderbird chrome rather than implemented as the top bar of an extension web page;
- Emergency must remain globally prominent and immediately reachable from native chrome;
- OceanMail branding/theme should visually unify native Thunderbird and OceanMail-owned surfaces.

The exact native insertion point for Available, Sent evidence/status, communications status, and Emergency is an implementation question to be prototyped against supported APIs first. Do not create fake IMAP folders merely to gain a place in Thunderbird's folder tree.

### One navigation hierarchy, not two

The accepted application-level information architecture remains:

- Mail
- Calendar
- Contacts
- Chat/OChat
- Station
- Settings separate/secondary

But the far-left rail carrying that structure is now Thunderbird's native Spaces toolbar, skinned/rebranded for OceanMail. Generic Thunderbird Chat remains hidden until OChat exists.

Do not place another OceanMail rail immediately to its right.

Secondary/context navigation is allowed where it is native to the active Thunderbird space or needed for an OceanMail-specific view, but it must not duplicate the entire application hierarchy.

### OceanMail theme applies to native Thunderbird chrome

The OceanMail visual system should skin the Thunderbird application, not only extension HTML pages.

Target:

- OceanMail colors and icons in native chrome;
- coherent light/dark/night behavior across native and extension-owned surfaces;
- OceanMail names/labels where product terminology differs;
- consistent status, badges, and state vocabulary;
- preserve Thunderbird's native accessibility and platform behavior wherever possible.

Use standard theme/MailExtension mechanisms first. A narrowly scoped Experiment bridge may manipulate native chrome only when needed and should remain common across Windows, macOS, and Linux for the pinned Thunderbird base.

Do not fork Thunderbird merely to achieve branding/navigation changes unless a later project-lead decision explicitly authorizes it after extension/Experiment approaches have been exhausted.

### Stock Thunderbird installability remains valuable

The OceanMail extension should remain installable/testable on compatible stock Thunderbird desktop installations on Windows, macOS, and Linux where practical.

In that mode, installing the extension is an explicit user choice to transform that Thunderbird profile into an OceanMail-enabled experience.

This does not weaken the released OceanMail Desktop coexistence requirement: the dedicated OceanMail package still has its own application identity, profile root, configuration, updater state, installation path, and uninstall ownership, and must not interfere with a separate stock Thunderbird installation/profile.

### Tranche 3 reusable work

The Tranche 3 implementation is not discarded wholesale.

Reusable pieces include:

- Available planner model and tests, after later account/privacy/plan validation corrections;
- delivery/evidence model after removing the user-facing Outbox assumption and correcting evidence semantics;
- Dashboard model;
- fixtures and explicit real-vs-demo boundaries;
- Station API client integration;
- preference/state utilities;
- theme tokens/assets where applicable;
- accessibility/test coverage;
- Watch concepts;
- Emergency content/safety wording after removing misleading ordinary-SMTP behavior.

What must be replaced is the nested application-shell/navigation architecture and any status/navigation presentation that belongs in Thunderbird native chrome.

## Consequences

- The alpha correction was required to remove the second OceanMail primary rail before acceptance; the merged alpha now uses native Thunderbird chrome.
- Future screenshots should show one coherent application chrome, not Thunderbird navigation plus an OceanMail web-app navigation rail.
- Mail/Calendar/Contacts should increasingly look like native Thunderbird functionality rebranded and OceanMail-aware, not links out of a custom Space.
- Generic Thunderbird Chat stays hidden until OChat is implemented as the OceanMail chat experience.
- OceanMail-specific pages remain appropriate only for concepts Thunderbird does not natively model.
- A small new Experiment API may be justified specifically for native-shell branding/integration if public APIs cannot achieve the accepted UX; such an API must be narrow, documented, pinned-version-aware, and Windows/macOS/Linux compatible.
- UI reviews should ask whether the user feels they are using OceanMail itself, not whether a custom page inside Thunderbird looks polished.
