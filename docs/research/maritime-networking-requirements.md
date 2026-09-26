# Future Maritime Networking Requirements

- **Status:** Research / preserved requirements
- **Not current architecture:** this document does not reinstate M4P, BEMPIC, OMGP as a wire protocol, or mandatory multi-hop routing.

## Purpose

OceanMail 0.1 developed a substantial set of requirements for a future open maritime store-carry-forward network. OceanMail 0.2 deliberately proves direct HERMES-derived Station/gateway email first, but the requirements are worth preserving so later field evidence can be evaluated against them.

If multi-hop networking becomes necessary, candidate technologies should be compared against these requirements rather than selected because of prior sunk-cost work.

## Open/interoperable participation

A future maritime grid should ideally permit independent implementations, manufacturers, volunteer gateways, and competing services to strengthen shared connectivity without requiring every participant to run OceanMail's commercial server or exact client software.

Security/admission/abuse controls are still required; `open` does not mean unauthenticated or unlimited resource use.

## Multi-transport paths

A useful future network may traverse different technologies at successive opportunities, for example:

```text
Station A -- one RF mode --> Station B -- another mode --> Gateway -- Internet
```

Immediate peers only need a mutually compatible link. Multi-radio/multi-transport Stations can bridge otherwise separated populations.

OceanMail application semantics should not depend on one modem.

## Dynamic service egress

Internet/service reachability may appear anywhere temporarily.

A future system should support short-lived evidence that a Station can reach services such as:

- OceanMail Server;
- conventional Internet email;
- an authorized Winlink path;
- an authorized SailMail integration; or
- another compatible service.

Reachability is service-specific and freshness-sensitive.

## Gateway/route quality

If dynamic gateway selection or multi-hop routing is promoted, useful inputs may include:

- freshness;
- hop/encounter count where meaningful;
- measured latency;
- observed effective throughput;
- retries/loss;
- SNR/RSSI/decode-confidence where exposed;
- transport type/capability;
- estimated airtime/power/monetary cost;
- service authorization/legal suitability;
- historical success; and
- path diversity.

No single scalar score should be assumed adequate before simulation/field evidence.

## Aggressive staleness handling

HF topology and vessel position change quickly. Previously excellent route/gateway information must lose confidence when expected fresh evidence stops arriving.

Old reachability should never remain effectively permanent merely because it once had a high score.

## Isolation discovery

A Station that has heard no useful current connectivity may need a compact way to ask whether a useful peer/gateway exists.

The old conceptual `PING → response → ACK/suppression` idea is retained as a requirement for efficient isolation discovery, not as a wire-format commitment.

Responses should avoid causing every listener to transmit at once.

## Reluctant and eager participation

Future cooperative policy should preserve the distinction between:

- **Reluctant:** minimize storage/airtime/power but provide fallback help when useful.
- **Eager:** volunteer more storage, retention, listening, gateway/relay work, and other spare resources.

Gateway willingness and relay willingness may require separate controls.

## Passive observation and caching

Shared radio permits Stations to hear traffic not directly addressed to them.

A future design should distinguish:

- inexpensive observation/catalog state; and
- retaining full payload data.

Eager Stations may be able to retain useful data they already decoded without adding transmit airtime, but passive copies should not automatically create epidemic descendants.

## Bounded replication

Normal OMail should not reproduce without bound around the planet merely because HF occasionally creates long-distance propagation.

If store-carry-forward is promoted, evaluate bounded-copy and encounter-aware approaches. Relevant prior art includes PRoPHET, Spray-and-Wait, Bundle Protocol, Reticulum, HERMES/DTN research, M4P, and other contemporary candidates.

The old primary/secondary responsibility and passive-shadow concepts remain useful research ideas, not current protocol requirements.

## Stable identity and repair

Any future network must preserve the current 0.2 product requirements:

- stable logical message identity;
- safe deduplication;
- durable partial/progress state where appropriate;
- receipt/evidence reconciliation;
- query/evidence before wasteful retransmission where feasible; and
- bounded retry/repair.

A networking layer must not force the client to manufacture semantic duplicate emails to restart a failed route.

## Progressive reconciliation

A future synchronization/network layer should be evaluated for compact progressive knowledge exchange.

The old multilevel-manifest idea remains useful research:

- tiny presence/capability summary on weak contacts;
- critical/high-value inventory next;
- richer object/size/priority state when the link allows;
- detailed partial-transfer/repair state only when useful.

A strong link may exchange more detail; a brief contact should still exchange enough information to improve the next decision.

This requirement is not a commitment to the former BEMPIC manifest format.

## Half-duplex efficiency

Maritime HF should generally be assumed half-duplex unless a specific system proves otherwise.

Optimization should consider not only bytes but:

- total airtime;
- number of TX/RX turnarounds;
- listen/deferral windows;
- collision probability;
- power use; and
- acknowledgement value.

Fine-grained ARQ/retransmission remains the modem/link layer's responsibility where it already exists.

## One-way/no-ack opportunities

The system must tolerate situations where:

- substantial data is transmitted but the path disappears before an acknowledgement returns; or
- substantial data is received and persisted but acknowledgement cannot be transmitted.

Future networking/synchronization candidates should be tested for how well they preserve useful progress under asymmetric or lost-return-link conditions.

HERMES Broadcast/RaptorQ and other one-way/broadcast techniques remain relevant candidate tools at the appropriate layer.

## Service-neutral cooperation

Long-term cooperative networking should not be architecturally limited to `@oceanmail.fyi` traffic if a safe interoperable profile can support other compatible maritime applications/services.

This remains an aspiration subject to abuse, resource, identity, and governance design.

## Station/vessel observations

Future networking may use Station-maintained observations such as:

- peer last-seen/contact history;
- gateway capability/freshness;
- transfer success/failure;
- frequency/mode performance;
- coarse geography; and
- encounter patterns.

These should be bounded, privacy-aware, and freshness-sensitive.

## Directionality/heading diagnostic research

Optional vessel heading may be recorded as diagnostic telemetry and correlated with link quality by:

- frequency;
- peer/bearing;
- antenna setup;
- propagation conditions; and
- time/season.

The goal is empirical discovery of Station-specific directional strengths/nulls. The system must not assume that backstay geometry alone predicts directional performance.

Detailed measurement schema/retention belongs in `oceanmail-station` research/diagnostics.

## Required evidence before multi-hop promotion

Before placing a DTN/mesh layer on OceanMail's required path, demonstrate:

1. direct Station → gateway baseline performance;
2. opportunistic direct gateway selection;
3. actual cases where useful messages cannot reasonably succeed without intermediate Stations;
4. measured improvement from a candidate multi-hop approach;
5. acceptable additional airtime/control overhead;
6. bounded replication/storage behavior;
7. security/identity/abuse viability; and
8. compatibility with HERMES/Mercury and other selected transports.

Only then should OceanMail select or build a networking layer.
