# Decision 0005 — Thunderbird as the OceanMail Client Foundation

**Current policy supersession (2026-09-11):** [Decision 0009](0009-ordinary-mail-scheduling-and-importance.md) overrides all older ordinary Priority classes, premiums and inbound/outbound reprioritization language retained below as decision history. Only Emergency and Ordinary remain; Important is conventional metadata only. Recipient ordering is a preference within the local-account portion of Band 2 under [Project ADR-008](https://github.com/OceanMail/oceanmail-project/blob/main/docs/decisions/ADR-008-four-band-scheduling-and-channel-use.md), never guaranteed transport precedence. ADR-008's Bands 0–3 supersede Decision 0009's historical five-band hierarchy. The [Mail model correction](../../desktop/docs/MAIL_MODEL_CORRECTION.md) supersedes the historical user-facing Outbox concept. Current account-scoped Available ownership/authorization follows the [merged Station logical contract](https://github.com/OceanMail/oceanmail-station/blob/main/docs/AVAILABLE_MANIFEST_ACCOUNT_CONTRACT.md). Decision 0006 supersedes this decision's former Thunderbird-family mobile-foundation preference; mobile foundation remains deferred.

- **Status:** Accepted
- **Date:** 2026-09-04
- **Supersedes:** the standalone/custom-client implementation assumption in Decision 0002; the Client/Station/Server separation in Decision 0002 remains accepted.

## Context

OceanMail 0.1 and early 0.2 planning assumed that OceanMail would build and maintain its own complete desktop mail client, with separate `Full` and `Lite` concepts. Subsequent Station work proved a standards-based SMTP/IMAP mail boundary around Postfix, Dovecot, HERMES, Taylor UUCP, and Mercury. That makes a large custom mail-client implementation unnecessary.

OceanMail still needs a substantially nonstandard user experience for constrained maritime communications: Available OMail, transfer manifests, selective inbound retrieval, recipient-controlled retrieval order, conventional Important metadata, separate Emergency behavior, attachment/image representation choices, send/receive budgets, truthful queued/transmitted/acknowledged state, Station/Grid/link status, and later OChat.

The requirement is therefore not to replace normal email mechanics. It is to reuse a mature mail client engine while allowing OceanMail to own the product experience.

## Decision

### OceanMail Desktop is built on Thunderbird

OceanMail Desktop will use Thunderbird as its desktop application foundation.

OceanMail is **not** joining a user's general-purpose Thunderbird installation as a conventional optional add-on. For the 0.x development line and at least the first release unless later evidence justifies a change, OceanMail will present itself as its own application built on Thunderbird.

Thunderbird supplies mature underlying capabilities such as:

- SMTP and IMAP;
- MIME/message parsing and rendering;
- message composition fundamentals;
- reply, reply-all, and forward behavior;
- folders and local mail storage;
- search;
- contacts and calendar foundations where useful;
- notifications and platform integration; and
- mature Windows/macOS/Linux application behavior.

OceanMail supplies the user-facing product semantics, constrained-link workflow, Station integration, branding, policy, and presentation.

### OceanMail owns the visible desktop experience

During 0.x, OceanMail Desktop should behave as an OceanMail application rather than a generic email client.

The normal user experience should not expose general Gmail, Outlook, Mailcow, or arbitrary IMAP/SMTP account setup. OceanMail accounts are the supported account type. Conventional Internet mail remains reachable through OceanMail's Server/gateway boundary; this decision concerns the client account model, not whether an OceanMail user may exchange mail with Internet recipients.

The intended primary OceanMail surfaces include:

- Inbox;
- Available OMail;
- Saved;
- Sent with truthful Station-derived evidence where correlation exists;
- Drafts where useful;
- Trash;
- Compose;
- transfer/retrieval Manifest;
- send/receive budgets and estimates;
- Station/Grid/link status and Station queue/traffic surfaces;
- Station dashboard and permitted controls;
- a prominent Emergency action; and
- OChat when promoted onto the implementation roadmap.

There is no user-facing OceanMail Outbox. Once Desktop submits ordinary mail, Station owns queueing, retry, transport attempts and delivery/receipt evidence; account-scoped Sent and Station operational surfaces present that state.

Thunderbird's ordinary mail mechanics may remain underneath these surfaces, but OceanMail controls how OceanMail users see and operate them.

### Extension/Space rather than immediate Thunderbird fork

The preferred implementation is:

```text
pinned Thunderbird desktop base
    + mandatory OceanMail extension
    + OceanMail-owned Space/views
    + OceanMail theme/branding
    + managed policies/configuration
    + dedicated OceanMail profile
    + OceanMail installer/launcher
```

The OceanMail extension should own as much of the visible application as supported extension APIs permit.

Do **not** maintain a Thunderbird source fork merely to make the product feel custom. If supported extension/configuration mechanisms cannot remove or alter a small amount of native Thunderbird chrome that materially harms the OceanMail experience, a narrowly scoped downstream patch set may be introduced later. Any such patch set should remain as small as practical so Thunderbird can continue to provide the maintained mail-engine foundation.

### Custom OceanMail packaging

OceanMail should ship through an OceanMail-controlled installer/package rather than require users to assemble Thunderbird, an add-on, policies, and themes manually.

The target desktop package concept is:

```text
OceanMail Desktop installer
    -> pinned Thunderbird release/ESR base
    -> mandatory OceanMail extension
    -> OceanMail theme and branding
    -> managed policies/configuration
    -> dedicated OceanMail profile
    -> supported OceanMail account bootstrap
```

The user-facing product name is **OceanMail Desktop**. Thunderbird is an implementation dependency, not the primary product identity.

Exact redistribution, update, trademark, and source-compliance mechanics must be handled explicitly before public distribution.

### OceanMail Desktop must coexist with stock Thunderbird

Installing, running, updating, or uninstalling OceanMail Desktop must not interfere with an existing or future ordinary Thunderbird installation on the same workstation or device.

OceanMail Desktop therefore requires an isolated application identity and data boundary. Packaging and bootstrap work must, as applicable to each platform, provide:

- a separate OceanMail application/product identity rather than reusing the stock Thunderbird application identity;
- a separate installation location and launcher/executable identity;
- a dedicated OceanMail profile and profile root that are never treated as the user's normal Thunderbird profile;
- separate OceanMail-managed preferences, extensions, themes, policies, and configuration so OceanMail restrictions do not leak into stock Thunderbird;
- a separate update channel/state so OceanMail's pinned-base/update policy does not alter or replace a user's Thunderbird installation;
- separate application shortcuts, registration, cache/state, and uninstall ownership where the operating system distinguishes them; and
- uninstall behavior that removes only OceanMail-owned files/state and never deletes or modifies a user's Thunderbird installation, profiles, accounts, mail, extensions, or settings.

A user must be able to install Thunderbird before or after OceanMail Desktop and use both independently. OceanMail's decision to hide generic mail accounts applies only inside OceanMail Desktop; it must not disable or constrain ordinary Thunderbird elsewhere on the system.

Implementation must specifically avoid machine-wide Thunderbird policies, profile-selection changes, registry/configuration changes, protocol-handler changes, or other integration techniques that would unintentionally affect stock Thunderbird. If a platform mechanism cannot be safely scoped to OceanMail Desktop, it should not be used merely for packaging convenience.

### Station-specific behavior stays outside ordinary IMAP semantics

Do not force OceanMail's constrained-link concepts into fake conventional mail folders merely because Thunderbird understands folders.

For example, `Available OMail` is a private Station/Server retrieval manifest, not an IMAP mailbox containing already-downloaded messages. The client obtains authorized manifest state through the applicable OceanMail service boundary and lets the user decide what should cross the constrained link.

OceanMail-specific controls include, as applicable:

- choose which advertised inbound messages to retrieve;
- choose recipient-preferred retrieval order within ordinary local-account work;
- hold/defer work;
- display/use conventional Important metadata without changing transport precedence;
- choose image/attachment representations before constrained transfer;
- show estimated bytes/time/cost where evidence supports the estimate;
- manage send and receive budgets;
- expose queued, handed-off, transmitted, acknowledged, delivered, failed, and other evidence-based states through Sent/status and Station operational surfaces;
- expose Station, Grid, gateway, relay, radio/link, and freshness state;
- provide the large Emergency action and its required safeguards; and
- expose the persistent high-level communications/status surface.

Thunderbird handles standard mail behavior; the Station remains authoritative for persistent constrained-link work, scheduling, retries, evidence, budgets, and transport policy when a Station is present. In accepted Station-less hosted/Lite direct-Internet operation, corresponding hosted services own the equivalent hosted responsibilities.

### Compose remains familiar but OceanMail-aware

OceanMail should retain standard mail behaviors such as recipients, subject/body, reply, reply-all, forward, contacts, and ordinary editing mechanics while adding OceanMail controls around compose/submission.

The OceanMail compose experience must be able to expose at least:

- Ordinary mail, conventional Important metadata, and the separate authorized Emergency workflow;
- local queueing versus later delivery semantics;
- attachment/image representation selection;
- transfer-size/time estimates where supportable;
- budget impact and exceptional-budget authorization where applicable; and
- Emergency composition/confirmation behavior.

Important never changes RF/Station/relay precedence, gateway/path choice, credits/quota treatment, or automatic Available retrieval order.

### Full is no longer a separate client implementation

`OceanMail Full` should not drive a separate desktop-client codebase.

The preferred product terminology is:

- **OceanMail Desktop** — Thunderbird-based desktop client;
- **OceanMail Station** — autonomous persistent communications node;
- **OceanMail Server** — hosted Internet/account/Grid services; and
- **OceanMail Lite** — lightweight/mobile client profile/product name for now.

A complete onboard deployment may combine OceanMail Desktop and OceanMail Station, but they remain separate architectural components and processes.

### Mobile foundation — superseded/deferred by Decision 0006

This decision originally preferred Thunderbird-family foundations for Lite/mobile. Decision 0006 explicitly supersedes that preference. Mobile implementation is deferred until Desktop matures, and no current architecture decision mandates Thunderbird/K-9/Thunderbird iOS or any other foundation for future mobile clients.

Future mobile clients should preserve OceanMail service/API contracts, identity semantics, constrained-link behavior and product concepts, but their codebase/foundation will be selected in a later dedicated effort.

OceanMail Lite remains client-only: installing it does not make a phone/tablet a Station, RF gateway, relay, or persistent network node.

## Consequences

- The old plan to build a complete custom OceanMail desktop mail client is discontinued.
- Existing OceanMail client prototype requirements remain valuable as historical UX/product input, interpreted through current decisions rather than restored literally.
- Development should focus on OceanMail-specific surfaces and Station/Server integration instead of rebuilding mail parsing, MIME, IMAP, SMTP, compose, reply/forward, search, contacts, and similar mature features.
- The desktop client can be aggressively simplified for early releases because generic third-party mail accounts are intentionally out of scope.
- OceanMail Desktop must remain installable side-by-side with stock Thunderbird without sharing or modifying its application state, profile data, policies, updater, or installation.
- OceanMail must maintain compatibility with its pinned Thunderbird base and test updates deliberately.
- A small downstream Thunderbird patch set is allowed only when supported extension/configuration approaches cannot satisfy a material product requirement.
- Mobile implementation/foundation is deferred under Decision 0006.

## Historical immediate implementation implications

The original spike checklist below is retained only as decision history; most items are now completed or superseded, and the current roadmap/current-status documents govern next work. Interpreted through current policy, it called for:

1. a dedicated OceanMail Thunderbird development profile isolated from normal Thunderbird profiles;
2. isolated application/install/update identity for side-by-side OceanMail Desktop and stock Thunderbird;
3. a mandatory OceanMail extension and OceanMail application surface;
4. OceanMail-scoped suppression of general-purpose account setup/unnecessary Thunderbird UI;
5. OceanMail account bootstrap against the Station SMTP/IMAP path;
6. Station API access from the extension;
7. Inbox / Available / Saved / Drafts / Sent / Trash Mail integration plus Station queue/traffic status, with no user-facing Outbox;
8. OceanMail-aware compose using Ordinary/Important metadata and separate Emergency behavior;
9. a persistent communications status surface and Emergency action;
10. pinned Thunderbird update/testing and custom installer/coexistence policy; and
11. a later, separate mobile-foundation assessment after Desktop maturity.

Implementation must continue to honor the autonomous Station boundary: closing OceanMail Desktop must not stop work already accepted by the Station.
