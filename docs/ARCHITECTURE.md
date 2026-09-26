# OceanMail 0.2 Architecture

Current Available ownership and privacy follow the merged [Station logical contract](https://github.com/OceanMail/oceanmail-station/blob/main/docs/AVAILABLE_MANIFEST_ACCOUNT_CONTRACT.md) . Available is private pre-transfer metadata. A recipient Station owns authenticated account grants, recipient-visible availability and durable intent/local execution when present; in accepted Station-less hosted/Lite direct-Internet operation, the hosted Server/service owns the equivalent client authorization and plan/retrieval responsibilities. Remote holders must bind disclosure to the intended recipient/account and require holder-side authorization or equivalent end-to-end confidentiality before private metadata leaves the holder. Server is authoritative for hosted mailbox/account/policy/balances, while native sender Stations/holders support decentralized boat-to-boat availability without a central Server dependency. This is a logical foundation, not an implemented API. [Decision 0009](decisions/0009-ordinary-mail-scheduling-and-importance.md) supersedes older Priority rules.

## System shape

```text
OceanMail Desktop
      |  \
      |   \ direct Internet when available
      |    -----------------------> OceanMail Server
      |
      | authenticated Station API + standard local mail interfaces
      v
OceanMail Station
      |
      +--> HERMES UUCP/uucpd/uuxcomp baseline
      |        |
      |        +--> Mercury
      |        +--> VARA
      |        +--> ARDOP
      |        +--> PACTOR where supported
      |        `--> other future transports
      |
      +--> ordinary IP / Internet
      |
      `--> future gateway/relay capabilities
                    |
                    v
              OceanMail Server

Future separate iOS/Android clients may connect to OceanMail Server/Station
through the same product/service boundaries after Desktop matures.
```

The Client, Station, and Server are separate architectural components even when packaged together on one machine. Direct-Internet/Lite operation is also a valid client deployment: where no recipient Station exists, Server-side services must own the hosted capabilities that would otherwise belong to the recipient Station rather than making the client impersonate a Station.

## OceanMail client architecture

Decision 0005 establishes Thunderbird as the OceanMail Desktop foundation. Decision 0006 establishes the accepted 0.1 prototype as the Desktop UX reference, makes Windows/macOS/Linux portability a continuous Desktop constraint, and defers mobile implementation until Desktop matures.

### OceanMail Desktop

OceanMail Desktop is an OceanMail-branded desktop application built on a pinned Thunderbird desktop base.

It is not intended, during 0.x, to behave as a user's ordinary general-purpose Thunderbird installation with an optional OceanMail add-on. The intended package contains:

```text
pinned Thunderbird desktop base
    + mandatory OceanMail extension
    + OceanMail-owned Space/views
    + OceanMail theme/branding
    + managed policies/configuration
    + dedicated OceanMail profile
    + OceanMail installer/launcher
```

Thunderbird supplies mature standard mail-client machinery such as SMTP/IMAP, MIME parsing/rendering, compose fundamentals, reply/reply-all/forward, folders/local storage, search, notifications/platform integration, and contacts/calendar foundations where useful.

OceanMail owns the visible product experience and constrained-communications semantics, including:

- Inbox / Available / Saved / Drafts / Sent / Trash presentation;
- remote Available OMail manifests;
- selective constrained-link retrieval and ordering;
- recipient retrieval ordering and conventional Important metadata;
- attachment/image representation selection;
- byte/time/cost estimates where evidence supports them;
- send/receive budget management;
- evidence-based queue/transmission/delivery state;
- Station/Grid/link/gateway/relay status;
- Station dashboard and permitted controls;
- prominent Emergency behavior; and
- OChat when implemented.

There is no OceanMail user-facing Outbox. Transport work may exist in Station/Postfix/Taylor stores, but Desktop must present truthful Sent/status evidence rather than inventing a conventional Outbox surface that is not part of the accepted information architecture.

For 0.x, general-purpose Gmail/Outlook/Mailcow/arbitrary IMAP account setup is intentionally outside the supported OceanMail Desktop user experience. Conventional Internet email remains available through OceanMail Server's Internet-mail boundary; this restriction is about the client account model rather than mail interoperability.

The accepted 0.1 UI decisions and owner refinements are the historical UX reference, translated through `design/desktop-interface-inheritance.md`. Current 0.2 architecture always overrides conflicting old transport/accounting/security behavior.

The preferred implementation uses supported Thunderbird extension/configuration mechanisms. Privileged Experiment APIs may be used narrowly where ordinary MailExtension APIs are insufficient. A narrowly scoped downstream Thunderbird patch set is allowed only when a material OceanMail requirement cannot be met reliably through supported mechanisms.

### Desktop platform independence

Thunderbird is the desktop platform-independence foundation.

The shared OceanMail Desktop extension/application layer is expected to run on compatible Thunderbird desktop builds on:

- Windows;
- macOS; and
- Linux.

Prefer shared MailExtension APIs, Spaces, HTML/CSS/JavaScript, Thunderbird-native mail APIs, and shared assets. Operating-system-specific behavior should remain primarily in packaging, installation, launchers, signing/notarization, updater integration, and other OS-facing adapters.

A feature should not become single-platform merely because the current development host makes that implementation convenient. Material Thunderbird/platform limitations require project-lead review before changing the product goal.

The OceanMail extension should remain installable/testable in compatible stock desktop Thunderbird on Windows/macOS/Linux where Thunderbird permits it. This is a portability and maintainability property, not a reversal of the dedicated OceanMail Desktop product model: released 0.x packaging still uses its own application identity, Thunderbird base, profile root, configuration, updater state, and uninstall ownership so stock Thunderbird remains independent.

### Mobile / future OceanMail clients

Mobile implementation is deferred.

Do not treat Android or iOS as part of the active Desktop architecture/tranches. OceanMail should first make Desktop excellent and validate the product experience across Windows, macOS, and Linux. After Desktop is mature enough to be the reference design, iOS and Android will be separate client projects.

No current architecture decision mandates Thunderbird/K-9/Thunderbird iOS or any other foundation for those future apps. They may share OceanMail service/API contracts, identity semantics, constrained-link behavior, terminology, and product concepts without sharing the Desktop extension architecture or codebase.

A future mobile client remains client-only unless explicitly changed later; local storage/network connectivity alone does not make it a Station, gateway, or relay.

### Full versus Desktop

`OceanMail Full` no longer implies a separate client application or codebase.

The preferred desktop product name is **OceanMail Desktop**. A complete onboard deployment may combine OceanMail Desktop with OceanMail Station on one machine or use one headless Station with multiple Desktop clients across the vessel LAN. Future mobile clients may join that same vessel/client model after they are separately designed.

## Client connectivity modes

The client may operate in two principal connectivity modes:

- **direct Internet** — the client reaches OceanMail Server directly for supported functions;
- **local Station** — the client uses an authenticated nearby Station for communications and synchronization.

These modes may coexist. Path-selection policy must remain understandable and must not make the client a network relay merely because it has local storage.

For ordinary local mail access, the Station may expose standards-based SMTP/IMAP through the accepted Postfix/Dovecot path. OceanMail-specific semantics not represented by standard mail protocols use the authenticated Station API.

`Available OMail` is a Station/Server retrieval manifest and must not be forced into an ordinary IMAP folder merely to fit Thunderbird's conventional folder model. Private manifest metadata must retain account/holder authorization and confidentiality across both direct-Internet and local-Station paths.

## Autonomous headless Station

A Station is a persistent service, normally capable of running headless on Linux.

Example vessel deployment:

```text
Captain laptop ----\
Crew laptop --------+---- vessel LAN/Wi-Fi ---- OceanMail Station ---- radio/Internet
Crew laptop --------/
```

The Station continues background work when all clients are disconnected or powered off.

Expected persistent responsibilities include:

- outbound/inbound queues;
- transport attempts and retries;
- received data staging;
- delivery/receipt evidence;
- opportunistic Internet synchronization;
- supported account/server-setting synchronization;
- link/transfer measurements;
- Station observations and history;
- future gateway/relay work when accepted and enabled.

## Multi-user model

One Station may serve multiple OceanMail users and devices.

Station-level authority is role based. The intended role model includes at least:

- **Station Owner / Captain** — recovery authority, role delegation, and full Station control;
- **Station Admin** — delegated Station administration subject to Owner policy;
- **Operator** — operational controls without full ownership/security authority;
- **User** — own account use and permitted Station status/queue functions.

Exact permissions remain to be specified.

Station administration does not silently provide access to another user's private mailbox or account credentials.

A trusted device and an authorized user are separate concepts. Pairing/known-device state must not by itself grant administrator rights.

## Station API

The Station API is the stable client/management boundary for OceanMail-specific state and controls when a Station is present.

The API should describe product outcomes and capabilities rather than mirror Mercury/HERMES commands.

Expected domains include:

- authentication, devices, users, and roles;
- queue submission/query/cancel/defer;
- Available OMail/retrieval manifests;
- received items;
- transport and delivery evidence;
- Station/link status;
- measurements/statistics;
- known stations/vessels/gateways;
- account/server synchronization state;
- future relay/gateway configuration;
- system/update/diagnostic status.

API access must be permission scoped.

Standard SMTP/IMAP and the Station API are complementary. Standard protocols handle ordinary mail-client behavior; the Station API carries OceanMail semantics that SMTP/IMAP do not represent. Direct-Internet hosted clients use corresponding authenticated Server/service APIs rather than a nonexistent local Station API.

## Web management

The headless Station should expose a local web management interface using the same Station API and authorization model as OceanMail clients.

This avoids maintaining separate management semantics.

OceanMail Desktop may expose frequently used Station functions natively in its Thunderbird-based OceanMail Space and may later reuse/embed/open Station web views for complex management screens. The exact presentation mechanism may vary so long as authorization and business logic remain authoritative in the Station.

## Deferred account/server changes

For operations that are safe to defer when a Station is present:

```text
Client change
    -> authenticated submission to Station
    -> Station persists pending server operation
    -> client may disconnect
    -> Internet later becomes available
    -> Station synchronizes operation with OceanMail Server
    -> Server confirms authoritative result
    -> Station stores result
    -> client receives updated state next time it connects
```

This permits a crew member to make supported account changes while the vessel is offline and lets the Station complete them later when Starlink, Wi-Fi, cellular, or another Internet path appears.

Security-critical operations require an explicit authorization design and may not use the same deferred mechanism. Direct-Internet hosted operation may submit supported operations directly to the Server and does not need to synthesize this Station queueing path.

## Station/network awareness

The Station is the natural home for persistent network-awareness data such as:

- own vessel/Station position where configured/available;
- stations heard/contacted and last-seen evidence;
- vessel identity/capabilities where known;
- gateway observations;
- link types and measured performance;
- transfer/session history;
- bytes/airtime/throughput;
- queue statistics;
- future relay/contribution/reliability observations;
- optional heading/propagation correlation diagnostics.

The web/client dashboard consumes this data through the Station API when a Station is present.

## Location privacy boundary

Station/vessel position used for local navigation/network functions is not equivalent to a person's shared location.

Personal/contact location sharing remains separately consented, scoped, revocable, and expiring.

On maps, a vessel with multiple crew should normally appear as one vessel/Station entity with associated crew rather than separate crew points at the same location.

## Gateway and relay direction

Gateway and relay concepts from OceanMail 0.1 remain product requirements/research candidates but are not on the first 0.2 communications critical path.

The progression remains:

1. direct Station <-> gateway/server email;
2. opportunistic/dynamic gateway selection;
3. only after measured need, vessel-to-vessel forwarding and multi-hop behavior.

Future operator policy may include configurable willingness/capability and resource controls for relay/gateway work. Exact current relay semantics are owned by accepted Station/product decisions and should not be inferred from historical 0.1 mode names.

## Communications foundation

The first real path is HERMES-derived store-forward behavior with Mercury as the preferred open HF modem.

OceanMail does not own generic modem ARQ, FEC, modulation, UUCP behavior, or radio-control internals when upstream components satisfy the requirement.

BEMPIC and M4P remain frozen/tabled research and are not mandatory layers in OceanMail 0.2.
