# OceanMail 0.1 → 0.2 Documentation Migration

The detailed source classification is in `0.1-DOCUMENT-INVENTORY.md`.

This file records the completed core migration. A source document being listed here means its useful accepted material was reviewed against 0.2; it does **not** mean every old statement was preserved.

## Later supersession

The migration descriptions below preserve what was carried forward at that time. [Decision 0009](../decisions/0009-ordinary-mail-scheduling-and-importance.md) later removed ordinary transport Priority; [Project ADR-008](https://github.com/OceanMail/oceanmail-project/blob/main/docs/decisions/ADR-008-four-band-scheduling-and-channel-use.md) supersedes the old local-before-relay hierarchy with Bands 0–3 and fair local/relay sharing within Band 2. Historical carry-forward wording is not a competing current scheduling requirement.

## Migration result

The active 0.2 documentation is a rewrite around the Client / autonomous Station / Server / HERMES boundary, not a copy of the 0.1 tree.

The core 0.1 product/design migration is now complete. Remaining 0.1 files stay historical/research sources unless a later task identifies a specific overlooked requirement.

## Program structure and architecture

Current 0.2 authority now exists in:

- `../README.md`
- `../SCOPE.md`
- `../DESIGN-PRINCIPLES.md`
- `../ARCHITECTURE.md`
- `../ROADMAP.md`
- `../OPEN-QUESTIONS.md`
- `../WISHLIST.md`
- `../decisions/`

This supersedes the old catch-all architecture/start-here/dated-decision structure for active 0.2 work.

## Product/design reconciliation

### Client / Station / management

Reviewed/reconciled sources include:

- `OCEANMAIL-LITE-AND-CLIENT-CONNECTIVITY.md`
- `STATION-USERS-ACCOUNTS-AND-PRIORITY.md`
- `CONSENSUAL-LOCATION-SHARING.md`
- relevant product decisions from `USER-INTERFACE-DESIGN.md` and the 0.2 discussion record

Current destinations:

- `../design/client-connectivity.md`
- `../design/client-user-experience.md`
- `../design/station-users-and-roles.md`
- `../design/location-vessels-and-contacts.md`
- `../design/station-management-and-dashboard.md`

### OMail lifecycle and delivery evidence

Reviewed/reconciled sources include:

- `OMAIL-DELIVERY-CONFIDENCE-REPAIR-AND-REPLICATION-SCOPE.md`
- receipt/lifecycle portions of `OMAIL-TRANSFER-SCHEDULER-AND-GRID-BUDGET.md`
- receipt/lifecycle portions of `OMAIL-TRANSFER-AND-RETRIEVAL-UX.md`
- transport-independent lessons from ADR 0003 and ADR 0006

Current destination:

- `../design/mail-lifecycle-and-receipts.md`

Carried forward: stable logical identity, distinct transmit/receipt evidence, durable progress, idempotency, receive-before-ack principle, bounded retry, no fabricated delivery claims.

Not promoted: old BEMPIC receipt vocabulary, M4P replication mechanics, application-level routing algorithms, or a fixed multi-hop responsibility scheme.

### Scheduling, budgets, accounting, and service tuning

Reviewed/reconciled sources include:

- `OMAIL-QUOTAS-EMERGENCY-AND-SYNC-PRIORITY.md`
- `OMAIL-TRANSFER-SCHEDULER-AND-GRID-BUDGET.md`
- `OMAIL-PRIORITY-AND-RELAY-SCHEDULING.md`
- scheduling/fairness portions of ADR 0006
- promoted scheduling ideas from the old wishlist
- the settled 0.2 accounting/relay-credit discussion

Current destinations:

- `../design/scheduling-budgets-and-priority.md`
- `../design/service-policy-and-tuning.md`
- `../decisions/0004-grid-accounting-and-relay-credit.md`

Carried forward/settled: autonomous/opportunistic scheduling, Emergency precedence, Priority without monopoly, anti-starvation/fairness, sender-pays send quota, recipient-pays approved successful receive quota, no ordinary automatic constrained-link OMail retrieval, no relay user-quota charge, Server-authoritative accounting, and Station-registration assignment of eager-relay credit to the vessel or captain account.

Reconciled rule: normal users do not schedule guaranteed message transmission times; future Station operational windows may still account for propagation, power, quiet hours, regulation, cost, or known gateway availability.

Quota amounts, Priority multipliers, eager-credit formulas/rates, caps, expiry, refund/reconciliation thresholds, anti-gaming thresholds, service-tier values, and similar numeric/economic parameters are **not architecture questions**. They are intentionally Server-controlled service policy/tuning, expected to be established through testing and adjusted as the service matures without an ADR when the underlying relationships do not change.

### Transfer, retrieval, and attachments

Reviewed/reconciled sources include:

- `OMAIL-TRANSFER-AND-RETRIEVAL-UX.md`
- retrieval/planner portions of `OMAIL-TRANSFER-SCHEDULER-AND-GRID-BUDGET.md`
- `OMAIL-IMAGE-REPRESENTATION-LEVELS.md`
- transport-independent requirements from `MAILBOX-MANIFEST-AND-RF-SYNC.md`

Current destination:

- `../design/mail-transfer-and-retrieval.md`

Carried forward: plain-text OMail, recipient-selected constrained-link retrieval regardless of ordinary message size, attachment limits, byte/time estimates, user ordering, independent text/attachment transfer, progressive/degraded representation goal, duplicate avoidance, and background completion by Station after clients disconnect.

Not promoted: a particular BEMPIC manifest/wire representation or the old transfer-planner crate as required architecture.

### Accounts, identities, and mailboxes

Reviewed/reconciled sources include:

- `IDENTITY-DEVICE-REVOCATION-AND-VESSEL-REGISTRATION.md`
- `MAILBOX-RETENTION-AND-ACCOUNT-LIFECYCLE.md`
- `SERVICE-TIERS-VESSEL-ACCOUNTS-AND-REDUNDANT-STATIONS.md`
- `DELIVERY-GROUPS-AND-GROUP-MAILBOXES.md`
- account portions of `STATION-USERS-ACCOUNTS-AND-PRIORITY.md`
- current 0.2 deferred-Server-setting decisions

Current destination:

- `../design/accounts-identities-and-mailboxes.md`

Carried forward: separation of personal/vessel/Station/device identities, vessel account, device revocation requirement, private locked mailboxes, deferred account-setting operations via Station, Server-authoritative global account state, explicit deletion reconciliation, future redundant Stations, configurable service tiers, and future durable delivery groups.

### Emergency OMail

Reviewed/reconciled source:

- `EMERGENCY-OMAIL-DESIGN.md`
- emergency/budget portions of quota/scheduler documents

Current destination:

- `../design/emergency-behavior.md`

Carried forward: highest priority, ordinary-quota bypass, offline availability without live Server approval, structured templates, best-known position with source/freshness, no blocking when GPS/time is unavailable, cached emergency-routing policy, separate emergency contacts, truthful receipt semantics, and post-event abuse accountability.

Strengthened 0.2 boundary: OceanMail must not present itself as a replacement for regulated distress systems or imply that an official emergency authority monitors an integration that has not been explicitly validated.

### Client UX, Calendar, Contacts

Reviewed/reconciled sources include:

- `USER-INTERFACE-DESIGN.md`
- `UI-DESIGN-DECISION-AUDIT-2026-08-31.md` at the enduring requirement level
- Calendar/contact behavior embedded in the UI/account/location discussions

Current destinations:

- `../design/client-user-experience.md`
- `../design/calendar-and-contacts.md`

Carried forward: familiar Mail/Calendar/Contacts/Chat/Station structure, Outbox/local-first semantics, persistent high-level communications status, compact/watch and dark modes, nonintrusive background work, truthful local-versus-remote state, recently-seen/contact behavior, local-first calendar/contact edits, per-invitee invitation state, compact responses, and later conflict reconciliation.

Updated for 0.2: the client is not the Station Suite. Deep Station management consumes the shared Station API/web interface, and submitted Calendar/Contacts changes can synchronize after the client shuts down.

### Accessibility, text, and presentation

Reviewed/reconciled sources:

- `ACCESSIBILITY-DESIGN.md`
- `TEXT-LANGUAGE-AND-PRESENTATION.md`

Current destination:

- `../design/accessibility-and-presentation.md`

Carried forward: accessible-by-default state, keyboard/screen-reader operation, non-color-only status, scalable text, Unicode/UTF-8 semantic text, localization/RTL, actual encoded byte accounting, and local presentation rather than transmitted typography.

### Security, trusted time, conflicts, and regulatory state

Reviewed/reconciled source:

- `TRUSTED-TIME-CONFLICTS-AND-REGULATORY-UPDATES.md`
- relevant identity/revocation/account material

Current destination:

- `../design/security-trust-and-regulatory-state.md`

Carried forward: GNSS/authenticated-Internet trusted-time preference, explicit freshness/conflict state, identities not dependent on wall clock, offline changes with later conflict reconciliation, signed geographic/regulatory policy, separation of personal-location consent from Station position, and transport-law awareness.

Removed: the requirement that update distribution use M4P specifically.

### OChat and group discovery

Reviewed/reconciled sources:

- `OCHAT-DESIGN.md`
- `OCHAT-GROUP-REGISTRY-AND-DISCOVERY.md`

Current destination:

- `../design/chat.md`

Carried forward: live/ephemeral chat, no initial store-forward, direct/group/regional chat, short local history, immutable group identity distinct from name, geographic registry slices, join-or-create UX, pinning/freshness, public/observable semantics, OMail preemption, and group promotion/retirement concepts.

Updated for 0.2: OChat semantics are transport-independent and do not require a mesh implementation.

### Interoperability

Reviewed/reconciled sources include:

- interoperability sections of `POTENTIAL-FEATURES.md`
- `EXTERNAL-NETWORK-ROUTING.md`
- current 0.2 HERMES transition/product priority

Current destination:

- `../design/interoperability.md`

Carried forward: early Winlink compatibility goal, pursuit of authorized SailMail integration, conventional Internet email bridge behavior, service-specific reachability, external credentials staying at authorized adapters, and strict legal/service-path policy.

Not promoted: BEMPIC/M4P carriage as the required route to external services.

### Gateway and relay

Reviewed/reconciled sources include:

- `EXTERNAL-NETWORK-ROUTING.md`
- `EAGER-RELAY-INCENTIVES-AND-REPUTATION.md`
- relay portions of `OMAIL-DELIVERY-CONFIDENCE-REPAIR-AND-REPLICATION-SCOPE.md`
- `OMGP-DESIGN-GOALS.md`
- current 0.2 Station/gateway decisions

Current destination:

- `../design/gateway-and-relay.md`
- Decision 0004 for relay accounting/credit destination

Carried forward: opportunistic gateways, own-only/reluctant/eager participation concepts, resource limits, local work before discretionary contribution, future reliability/contribution evidence, bounded replication requirements, relay forwarding with no user Grid-quota charge, and Server-authoritative eager-relay contribution credit assigned by Station registration to the vessel or captain account.

Current critical path remains direct Station → gateway first; multi-hop requires measured need.

## Research migration

### Future maritime networking

Transport-independent requirements from `OMGP-DESIGN-GOALS.md`, relay/repair research, and the old wishlist are preserved in:

- `../research/maritime-networking-requirements.md`

This includes open/interoperable participation, multi-transport paths, dynamic egress, freshness-sensitive reachability, eager/reluctant participation, bounded replication, one-way/no-ACK tolerance, progressive reconciliation, half-duplex efficiency, and the optional vessel-heading/link-quality diagnostic desire.

It does not reinstate OMGP as a protocol or M4P/BEMPIC as required layers.

### Historical constrained-network techniques

Kermit, ZMODEM, QWK, FidoNet, and UUCP lessons are preserved in:

- `../research/historical-store-forward-techniques.md`

The emphasis is reusable engineering ideas, not historical packet formats.

### Station RF/rendezvous research

Detailed RF/rendezvous/modem-boundary requirements were moved to their owning component repository:

- `OceanMail/oceanmail-station/docs/research/RADIO_RENDEZVOUS_AND_LINK_REQUIREMENTS.md`

The Station research retains channel-catalog, rendezvous/working-channel, half-duplex, connected-versus-broadcast, passive-listening, Hamlib/radio-control, measurement, propagation, and heading/antenna diagnostic requirements. Historical claims about modem versions/capabilities require fresh upstream verification before implementation.

## Wishlist review

The old wishlist was reviewed as part of the migration. Its enduring material is now split intentionally:

- active requirements → current design/principles;
- implementation priority → `ROADMAP.md`;
- deferred product ideas → `WISHLIST.md`;
- historical techniques → `research/historical-store-forward-techniques.md`;
- future multi-hop/network requirements → `research/maritime-networking-requirements.md`;
- detailed radio/rendezvous work → `oceanmail-station` research.

No separate `POTENTIAL-FEATURES.md` class is carried forward.

## Component documentation boundaries

The documentation-ownership rule is now being reflected in all active repositories:

- `OceanMail/oceanmail-desktop` — program/product authority;
- `OceanMail/oceanmail-station` — Station implementation/research index on the active Station bootstrap branch;
- `OceanMail/oceanmail-server` — component documentation boundary PR;
- `OceanMail/oceanmail-infrastructure` — component documentation boundary PR.

## Historical material

The migration summary is historical context. Current public design documents and decisions contain the requirements contributors should implement.

They are not copied into active 0.2 docs. A later task may extract a specific finding only when it materially informs a current design or decision.

## Completion rule

The core migration is complete when this documentation PR is accepted. Future changes should use the normal 0.2 authority structure rather than continuing to edit the migration inventory as a parallel product specification.
