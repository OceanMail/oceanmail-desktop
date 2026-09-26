# OceanMail 0.2 Open Questions

This register contains unresolved product/architecture questions. Open questions are not implementation defaults and do not override accepted decisions.

Service-policy and tuning values that are intentionally expected to change through testing and operations do **not** belong here merely because their initial numeric values are unknown. See `design/service-policy-and-tuning.md`.

## Client and packaging

Decision 0005 resolves the desktop framework direction: OceanMail Desktop uses a pinned Thunderbird foundation, mandatory OceanMail extension/OceanMail-owned Space, managed configuration, dedicated profile, OceanMail branding, and custom packaging. General-purpose third-party mail accounts are out of scope for 0.x.

Remaining questions:

- Exact Thunderbird desktop release/ESR pinning and update cadence.
- Which native Thunderbird surfaces can be cleanly hidden/disabled through supported extension/policy/configuration mechanisms, and which (if any) justify a narrow downstream patch set?
- Exact custom-installer/update architecture for Windows, macOS, and Linux.
- Exact redistribution, source-compliance, and trademark/branding process for public OceanMail packages.
- Should `OceanMail Lite` remain the public mobile product name or eventually become `OceanMail Mobile` or another name?
- How much of the Station management UI should OceanMail Desktop render directly versus reuse/embed/open from the Station web-management surface?
- Android feasibility/details for using Thunderbird for Android/K-9-derived code as the Lite foundation.
- iOS feasibility/details for using the Thunderbird iOS codebase as the Lite foundation as it matures.
- How much Calendar/Contacts functionality belongs before 1.0 versus after core OMail/Chat maturity?

## Station API and authorization

- What protocol, transport, discovery, and version-negotiation mechanism should the local Station API use?
- What exact permissions distinguish Station Owner/Captain, Admin, Operator, and User?
- What recovery process exists if the Station Owner loses credentials?
- How are device pairing, device revocation, role changes, and stale authorization represented/synchronized?
- Which Station operations require physical/local presence rather than remote authenticated administration?

## Deferred Server operations

- Which account/server-setting changes may be safely queued on a Station for later execution?
- Which security-critical operations require live Server contact or fresh/bounded cryptographic authorization?
- How are conflicts handled when a user makes different changes on multiple clients/Stations before Server synchronization?
- How long may a deferred security-sensitive authorization remain valid while a Station is offline?

## Identity and vessel model

- Exact identifiers/key relationships among Station identity, vessel identity, vessel OMail account, user accounts, device credentials, radio callsigns, MMSI, and replaceable hardware.
- Rules for redundant/multiple Stations aboard one vessel.
- Exact delegation model for vessel-account communication authority versus Station administration.
- Vessel-account renewal/dispute/recovery proof requirements.

## OMail lifecycle and delivery evidence

- Exact mapping from each HERMES/UUCP/Mercury/Internet transport event into OceanMail's product-level evidence states.
- What exact evidence constitutes `Delivered` for native OMail to a Station, native OMail to Server mailbox, and external Internet destinations?
- How long should source Stations retain retry/reconciliation state after delivery remains unconfirmed?
- Which compact receipt/tombstone mechanisms are already available from the selected baseline and which, if any, require OceanMail-specific additions?

## Scheduling and constrained-link accounting

Decision 0004 settles the accounting architecture: sender pays send quota, recipient pays receive quota for ordinary constrained-link OMail they select/approve and successfully receive, relay forwarding consumes no user Grid quota, and verified eager-relay credit is assigned to either the vessel account or captain account according to the Station registration setting.

Quota amounts, credit formulas/caps/expiry, refund/reconciliation thresholds, anti-gaming thresholds, service-tier values, and similar economic/numeric settings are deliberately **service policy/tuning**, not open architecture questions. They are expected to be established empirically and adjusted as the service matures.

Remaining architectural/UX questions include:

- Exact user-reservation model, if any, for intentionally holding constrained-link capacity for later work.
- Authentication/change-control rules for changing a registered Station's eager-credit destination.
- Which Station operational windows (propagation, power, quiet hours, cost, gateway schedules) are useful enough to implement without causing missed opportunities.

## Transfer/retrieval/attachments

- Exact attachment maximum size and service-specific limits.
- Which attachment types receive reduced/progressive representation support first?
- Whether progressive image representations can efficiently reuse previously transferred bytes with available cross-platform codecs/libraries.
- How to estimate transfer time/cost consistently across HERMES/Mercury, VARA, ARDOP, PACTOR, Internet, and future transports.

Ordinary OMail has no size-based automatic constrained-link retrieval threshold; recipient approval/selection is required regardless of ordinary message size.

## Emergency OMail

- Exact authorization/UI guardrails for declaring Emergency OMail while preserving offline availability.
- Exact cached emergency-routing data model and update validity/freshness rules.
- Which official emergency-service integrations can actually be supported and monitored, with explicit authorization rather than assumption.
- Exact emergency-contact change security/rate-limit mechanism; numeric rate limits themselves are service policy/tuning.
- Retention semantics and evidence requirements for emergency traffic; exact retention durations and abuse thresholds are service policy/tuning.

## Trusted state, security, and regulatory policy

- Exact trusted-time confidence/drift model after GNSS/Internet time disappears.
- Signing/key-rotation/recovery model for regulatory, revocation, emergency-routing, and service-policy updates.
- Fail-open versus fail-closed rules when a regulatory profile is stale/missing/conflicting for different operations.
- Exact confidentiality/integrity profiles permitted on each radio/service context.
- What user-visible security vocabulary accurately communicates observable radio paths without oversimplifying Internet/security-capable paths.

## Connectivity and path selection

- Exact preference policy when a client can reach both direct Internet and a local Station.
- Exact policy when a Station has multiple simultaneous Internet/RF transports.
- Which local/user traffic may use metered/satellite Internet automatically?
- Which third-party gateway/relay traffic may ever use metered/satellite Internet and under what explicit owner authorization?

## Gateway and relay

- Final current semantics and resource controls for relay/gateway willingness/capability modes as reconciled with Station decisions.
- Discovery/advertisement mechanism for direct opportunistic gateways after the baseline works.
- What field evidence is sufficient to justify multi-hop vessel forwarding.
- Which DTN/network approach should be evaluated if multi-hop is promoted.
- What bounded replication/repair policy best prevents global cache pollution while preserving useful resilience.

Exact eager-relay credit qualification formulas and thresholds are service policy/tuning rather than architectural questions.

## Maps, tracking, and diagnostics

- Exact data retention and sharing rules for Station/vessel observations.
- Which map data is local-only versus Server-synchronized.
- Which link/propagation metrics are useful enough to retain long term.
- Privacy/storage limits for encounter history and known Station positions.
- How to correlate optional vessel heading, frequency, peer bearing, antenna setup, and propagation conditions without overstating causation.

## OChat

- Exact live transport/service model for initial OChat after OMail is stable.
- Product semantics for local history and user-created group expiry/advertisement behavior; exact durations are tuning values once the semantics are fixed.
- Exact geographic geometry/radius representation for registered groups.
- Privacy/data-minimization rules for gateway/Station group-activity statistics.
- Registration/promotion/retirement governance; exact operational thresholds may be tuned later.
- Message/rate-limit semantics; exact numeric limits are service policy/tuning.

## Interoperability

- Exact current Winlink client/interface path and supported authentication/modem combinations when implementation starts.
- Whether SailMail provides/approves a third-party integration path suitable for OceanMail.
- Exact normalization/representation rules when converting external Internet mail to native constrained OMail.
- Whether generic third-party Gmail/Outlook/IMAP/SMTP accounts should ever be promoted into OceanMail Desktop after 1.0; they are explicitly not part of the 0.x client model.

## Accessibility/localization

- Minimum supported WCAG/platform accessibility targets for first public releases.
- Localization framework and first supported locales.
- RTL testing requirements.
- How multilingual corpora affect real constrained-link encoded/compressed cost across the selected baseline.

## Resolution rule

Resolve a significant product/architecture item by an accepted numbered decision where rationale/supersession should be durable, then reconcile affected architecture/design/roadmap documents.

Narrow implementation details may be resolved in the owning design/component documentation when they do not change program architecture.

Numeric/economic service-policy values belong in Server-controlled policy/tuning rather than this register and may change without an ADR when the underlying architecture remains unchanged.

Do not silently resolve open product questions through implementation defaults.
