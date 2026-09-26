# OceanMail 0.2 Design Principles

These principles guide tradeoffs across the OceanMail program. Accepted decisions and current architecture control when wording conflicts.

## 1. Intermittence is normal

OceanMail must assume links appear and disappear unpredictably. Useful work must survive disconnects, reboots, long pauses, and clients going offline.

A lost acknowledgement must not erase useful data already received and durably stored.

## 2. The Station is autonomous

A Station must continue communications, queueing, retries, synchronization, and permitted background work without requiring a user's laptop or phone to remain powered on.

A headless Linux Station is a first-class deployment, not a special case.

## 3. Clients are interfaces, not communications daemons

The client should compose, display, organize, and control user intent. Station communications behavior belongs in the Station.

The same client family should adapt to direct Internet, local Station access, and user permissions rather than requiring separate applications for each capability level.

## 4. One Station API, multiple management surfaces

The Station API is the contract. The Station web interface and the OceanMail client should consume the same capability/authorization model.

Do not create separate management semantics for the web UI and desktop/mobile client.

## 5. User authority and Station authority are separate

Station Owner/Captain/Admin authority controls the Station. It does not silently grant access to another user's private mailbox or credentials.

Vessel identity, Station administration, user identity, and device authorization are distinct concepts.

## 6. Device trust and user authorization are separate

A paired or known device is not automatically an administrator. Authorization is based on authenticated user/account authority and assigned roles, with device credentials providing a separate trust/revocation layer.

## 7. Persist intent before waiting for connectivity

User actions that can safely be deferred should be durably accepted locally and synchronized later.

A user may make supported account/server-setting changes while only connected to the Station; after the client disconnects, the Station may synchronize those changes when Internet becomes available.

Security-critical changes may require stronger or fresh authorization and must not be weakened merely to permit deferred execution.

## 8. Delivery claims require evidence

Do not collapse local acceptance, queued state, transmission attempt, transmitted state, remote durable acceptance, destination receipt, mailbox delivery, and external-system delivery into one `sent` flag.

Every displayed delivery state must correspond to evidence actually available at that layer.

## 9. Background work must remain understandable

OceanMail should perform unattended work aggressively where safe, but users/operators must be able to see what is queued, what happened, what is waiting, and why.

## 10. Transport semantics should not leak into ordinary mail UX

Clients should interact with stable outcomes and capabilities. Mercury, UUCP, VARA, ARDOP, PACTOR, IP, and later transports may differ internally without forcing message composition or mailbox semantics to change.

## 11. Reuse mature lower layers

OceanMail should integrate with and contribute to HERMES/Mercury and other maintained upstream projects rather than rebuilding modem DSP, ARQ, generic UUCP, radio control, or channel simulation without measured justification.

## 12. Measure constrained-link cost

Bytes, airtime, elapsed time, effective throughput, interruptions, retries, and confirmation behavior are product-relevant evidence.

Optimization decisions should be based on measurements rather than assumptions about protocols or antennas.

## 13. Preserve useful 0.1 behavior, not obsolete implementation assumptions

OceanMail 0.1 contains substantial valid product thinking. Carry forward user behavior, constraints, and rationale where they still fit. Do not automatically carry forward BEMPIC/M4P or other superseded implementation mechanisms.

## 14. Offline-first applies beyond email composition

Reading, composing, organizing, queueing supported actions, and inspecting local state should remain useful without Internet access. Connectivity is an opportunity to reconcile and transfer, not a prerequisite for ordinary operation.

## 15. Privacy follows the person, not the Station administrator

A shared vessel Station may know that accounts exist and may perform authorized background synchronization for them without making their private content readable by other users or administrators.

Personal location sharing is consent-driven and distinct from the Station's own navigation/network position.

## 16. Vessel and people are different map entities

A vessel/Station is the normal geographic node on Station/network maps. Crew may be shown as associated with that vessel where permitted; crew members on one vessel should not be rendered as independent vessel-like map points solely because they have accounts.

## 17. Network intelligence belongs in the Station

Known stations, vessel observations, gateways, transfer history, link statistics, relay/gateway policy, and future routing evidence should be maintained by the autonomous Station and exposed through the Station API.

## 18. Advanced behavior should not burden ordinary users

Relay reliability scores, transport mechanics, and detailed diagnostics may inform automatic decisions without becoming required normal-user controls.

Operator and advanced diagnostic views may expose deeper evidence when useful.

## 19. Prefer one product implementation over unnecessary variants

Do not create Lite, Standard, Manager, and Full as separate maintained applications merely because their visible capabilities differ. Prefer one client family plus role/capability-driven interfaces until a separate application has a demonstrated maintenance or security advantage.

## 20. Defer speculative complexity without discarding requirements

Multi-hop relay, eager/reluctant relay behavior, decentralized delivery, richer manifests, new modems, and other ideas may remain documented as research/wishlist items. Deferral means they are not on the current critical path; it does not mean the underlying problem or requirement is forgotten.

## 21. Record uncertainty explicitly

Unresolved questions belong in `OPEN-QUESTIONS.md`. Desirable but uncommitted ideas belong in `WISHLIST.md`. Research does not silently become architecture.

## 22. Git history preserves rationale

Accepted decisions are superseded explicitly, not rewritten to make earlier choices disappear. Historical work reports and prototypes remain evidence but do not override current decisions.