# OceanMail Wishlist and Deferred Design

This is the durable parking lot for desirable capabilities that should not silently become immediate implementation commitments.

## Status vocabulary

- **ACTIVE DESIGN** — should shape architecture now even if implementation is phased.
- **EARLY PRODUCT** — desired before broad deployment but not on the first proof critical path.
- **WISHLIST** — desirable and explicitly deferred.
- **RESEARCH** — requires experiments/comparison before acceptance.
- **CONFLICT CHECK** — may overlap/conflict with an upstream layer, protocol, license, regulation, or accepted decision.
- **EXTERNAL PROJECT** — likely belongs outside the core OceanMail program.

## Active-design ideas retained from 0.1

These concepts remain architectural requirements even though the old BEMPIC/M4P implementation assumptions do not:

- intermittence/disconnection is normal;
- durable progress and cheap duplicate handling;
- offline-first client behavior;
- explicit delivery evidence rather than one `sent` flag;
- background Station operation independent of client uptime;
- byte/airtime awareness and selective retrieval;
- local representation need not equal constrained-link representation;
- fair sharing between local user/business and third-party relay payload within Band 2 under [Project ADR-008](https://github.com/OceanMail/oceanmail-project/blob/main/docs/decisions/ADR-008-four-band-scheduling-and-channel-use.md), with Emergency preemption and separate account/peer fairness;
- map/dashboard visibility into Station/network state;
- user-controlled personal location sharing distinct from Station position.

## Early-product candidates

### Field feedback queue

Allow users to record feedback while offline and submit it automatically on later Internet connectivity, with separate consent for technical diagnostics.

### Station diagnostics history

Retain useful link/session statistics for troubleshooting and long-term performance analysis without requiring ordinary users to interpret low-level modem internals.

### Vessel-heading / HF link correlation

Optionally record vessel heading and correlate it with link quality by frequency, peer/bearing, antenna configuration, and propagation conditions. The goal is empirical station-specific diagnostics, not an assumption that backstay geometry deterministically predicts directionality.

## Research / future synchronization ideas

### Progressive synchronization depth

Investigate exchanging different amounts of inventory/state depending on link quality, cost, and expected contact duration: minimal presence/capability information on weak contacts, progressively richer reconciliation on stronger contacts.

This is a requirement/research concept, not a commitment to the old BEMPIC manifest format.

### Send useful data without waiting for every higher-level acknowledgement

Preserve the ability to make durable progress when substantial data can move in one direction but contact is lost before acknowledgement returns. Evaluate mechanisms available in HERMES/UUCP/Broadcast and only add higher-layer mechanisms where measurements show value.

### Adaptive historical techniques

Continue evaluating useful ideas from Kermit, ZMODEM, QWK, FidoNet, and similar systems: sliding windows, adaptive logical transfer sizes, batching, restart, event scheduling, compact seen/path evidence, and unattended mailer separation.

Do not duplicate modem-level ARQ/adaptation already owned by Mercury/VARA/ARDOP/PACTOR.

## Future gateway and relay capabilities

### Reluctant and eager relay modes

**Status: RESEARCH / WISHLIST**

Retain the product concept of configurable third-party participation. Exact semantics require evidence from direct gateway operation first.

Potential controls include storage, airtime, daily traffic, satellite/metered Internet use, quiet/power windows, and operator policy.

### Relay reliability and contribution accounting

**Status: RESEARCH**

Retain local reliability observations and server-authoritative useful-work contribution concepts. Avoid turning relay reliability into a social reputation score for ordinary users.

### Fully decentralized OceanMail delivery

**Status: WISHLIST**

Investigate whether OceanMail-to-OceanMail delivery can eventually operate through opportunistic maritime relays without permanent shore infrastructure when identity, abuse, routing, storage, and revocation problems are solved safely.

## Future lower-layer projects

### New open software modem optimized for OceanMail use cases

**Status: WISHLIST / EXTERNAL PROJECT**

Only consider if measured needs are not adequately served by Mercury/other existing modems. Potential goals include open implementation, deterministic test harnesses, strong resume behavior, connected and broadcast modes, and useful link-quality APIs.

### Full replacement networking layer

**Status: RESEARCH / EXTERNAL PROJECT**

If field results later justify multi-hop maritime networking and available DTN approaches are inadequate, a new network layer may be considered. This is not current OceanMail 0.2 scope.

## Later product ideas

- richer/progressive image and attachment representations;
- arbitrary file transfer and route/log/document exchange;
- weather fallback services;
- subscribed bulletins/navigation/port information;
- compact forms/information requests;
- broader propagation/network visualization;
- configuration/policy distribution over constrained links where justified;
- generic Internet mail accounts beyond OceanMail/Winlink/SailMail, subject to later product review.

## Promotion rule

A wishlist item becomes active only when an accepted decision or roadmap update promotes it and reconciles ownership/boundaries. Promotion should preserve a note here or in Git history so the origin/rationale is not lost.