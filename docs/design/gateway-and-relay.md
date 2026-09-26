# Gateway and Relay

- **Status:** Gateway direction accepted; multi-hop relay implementation deliberately deferred

## Purpose

OceanMail must support vessels that encounter Internet-connected gateways intermittently and should preserve the ability to use opportunistic maritime relays later if field evidence shows they materially improve delivery.

The 0.2 design does **not** assume that a global multi-hop mesh is required to ship useful email.

## Implementation order

OceanMail should prove these capabilities in order:

1. **Direct Station → gateway** email.
2. **Opportunistic gateway selection** among directly reachable eligible gateways.
3. **Station → Station → gateway forwarding** only if measurement shows a real need and useful benefit.

Multi-hop is therefore deferred, not prohibited.

## What is a gateway?

A gateway is an authorized OceanMail Station/service endpoint that can carry suitable OceanMail traffic between a constrained/intermittent communications domain and an external service such as:

- OceanMail hosted service;
- conventional Internet email;
- a supported external messaging network; or
- another future authorized service adapter.

A gateway may be:

- permanent shore infrastructure;
- an intermittently Internet-connected vessel;
- a temporary/opportunistic harbor Station; or
- another authorized Station with suitable connectivity.

## Own Station synchronization

A Station that gains Internet connectivity should automatically use it for its own pending permitted work according to policy.

Example:

- crew clients are asleep/offline;
- Captain briefly enables Starlink;
- the headless Station discovers Internet;
- queued mail, receipts, account changes, required synchronization, and service state are processed without requiring the crew laptops to be open.

This is normal Station behavior and does not require the vessel to volunteer as a gateway for other Stations.

## Gateway participation policy

Whether a Station carries third-party traffic is an owner/operator policy separate from using Internet for its own users.

Gateway modes are **Full**, **Minimal**, and **Off**. The Minimal name is retained:

| Mode | Ordinary third-party service | Emergency |
| --- | --- | --- |
| Full | Normally available | Eligible when technically, legally and operationally permitted |
| Minimal | Not normally offered; fallback for stranded/stalled ordinary traffic when Grid policy finds no suitable Full Gateway/route or excessive accumulated delay | Same eligibility |
| Off | No ordinary third-party service | Same eligibility |

Relay willingness is separate: **Eager** advertises/volunteers under resource controls; **Reluctant** listens silently and may intervene based on Emergency, age/stall/failure and route/resource conditions. There is no relay-Off mode while a Station runs. Neither Important nor a removed ordinary Priority class changes relay/gateway choice. These rules reconcile [Decision 0009](../decisions/0009-ordinary-mail-scheduling-and-importance.md) with current Station product decisions.

## Resource controls and metering

Relay/gateway work is not charged against the vessel/captain's user send/receive quota, but the Station must meter and log it.

From the user-quota perspective, third-party work can behave as though it has an unlimited budget. That does not make it physically unlimited.

Future gateway/relay policy should be able to measure and constrain resources such as:

- relay storage;
- daily third-party bytes;
- RF airtime;
- retries and control chatter;
- peer/source traffic rates;
- battery/power use;
- CPU/storage pressure;
- satellite/metered Internet use;
- permitted external services; and
- operating hours/policy windows where appropriate.

A Station should be able to identify and locally rate-limit/defer an overly chatty, inefficient, or abusive relay peer without charging that relay work to an end user's quota.

A Station should be able to forbid third-party use of expensive Starlink/cellular/satellite connectivity while still using that connectivity for its own synchronization.

See Decision 0004 and `station-metering-and-resource-budgets.md`.

## Local and relay service sharing

[Project ADR-008](https://github.com/OceanMail/oceanmail-project/blob/main/docs/decisions/ADR-008-four-band-scheduling-and-channel-use.md) supersedes the earlier local-before-relay hierarchy. Emergency and its control are Band 0; ordinary control/manifests are capped Band 1. Ordinary local and third-party relay payload share Band 2 with local/relay fairness, account fairness, and per-requesting-Station airtime fairness. Neither group must drain before the other can run; unused service can be reused by the other group. Exact weights remain tunable.

Third-party contribution must not starve:

- local OMail;
- recipient-approved receive work;
- account synchronization;
- critical policy/regulatory/security updates; or
- essential service reconciliation.

Admitted relay peers also need bounded turns and aging protection; local demand must not indefinitely starve eligible relay work. Admission remains limited by sustainable onward capacity and already-accepted custody.

See `scheduling-budgets-and-priority.md`.

## Gateway discovery

Future Stations may retain short-lived observations indicating which known Stations/gateways appear able to reach particular services.

Useful evidence may include:

- gateway identity;
- service capability;
- freshness/last heard;
- approximate link quality/cost;
- metered/unmetered policy where advertised safely;
- historical success; and
- geographic/encounter relevance.

A capability advertisement is not proof of user authorization for an external service.

Exact discovery/advertisement mechanisms must be selected after the direct-gateway baseline works.

## Relay concepts retained from 0.1

The following requirements remain valuable if multi-hop is later promoted:

- store-carry-forward must tolerate long disappearance of peers;
- accepting a relay copy must not force every other useful copy to be deleted immediately;
- repeated/duplicate reception must be safe;
- delivery receipts/evidence should suppress wasteful retransmission;
- relay willingness is Eager or Reluctant, with no relay-Off mode while running;
- local encounter/reliability history may help automatic decisions;
- replication should be bounded rather than epidemic;
- geography and encounter history may help determine usefulness;
- a far-away HF opportunity must not be rejected solely because it is geographically surprising; and
- ordinary users should not need to manually inspect relay reputation scores.

These are future networking requirements, not an active routing algorithm.

## Relay accounting

A Station forwarding third-party traffic is not charged user send or receive Grid quota for that forwarding.

Relay resource use is controlled through separate Station/operator resource budgets rather than per-hop end-user billing.

The Station still records enough resource and outcome evidence for diagnostics, abuse control, capacity planning, and eager-relay credit verification.

## Eager-relay incentives

Verified eligible eager-relay contribution may earn Server-authoritative service credit.

When the Station is registered, its owner chooses the credit destination:

- the associated vessel/ship account; or
- the captain's personal OceanMail account.

This is a Station registration/accounting setting and does not depend on which crew member happens to be logged in during relay work.

Merely enabling eager mode is not sufficient to establish useful-work credit. Station metering provides candidate evidence; the Server decides what qualifies and prevents double counting/gaming.

Credit formulas, qualification thresholds, caps, expiry, anti-gaming/collusion controls, and related limits are mutable service policy/tuning rather than architecture constants.

Contribution credit must not create a scheduling monopoly.

## Reliability observations

A Station may eventually retain local experience with peers/gateways, such as:

- successful completed transfers;
- disappearing during accepted work;
- stale/inaccurate capability advertisement;
- historical service reachability;
- unusually inefficient/chattery behavior; and
- useful Grid availability.

Such observations should decay/become stale over time.

They are primarily machine-consumed diagnostic/routing evidence, not a public social reputation score.

## No global cache pollution

If maritime relaying returns, the system should avoid uncontrolled global replication simply because HF allows surprising long-distance reception.

Future designs should evaluate bounded-copy/encounter-aware techniques and compact delivery evidence before adopting flooding.

Old PRoPHET, Spray-and-Wait, Bundle Protocol, M4P, Reticulum, HERMES DTN work, and other approaches remain prior art/candidates, not predetermined implementation choices.

## Station maps and observations

Gateway/relay observations feed the Station dashboard/map where appropriate:

- known gateway locations/freshness;
- known Stations;
- last contact;
- capability observations;
- historical transfer performance.

A map is an operator/diagnostic view of evidence, not a claim that every displayed Station is currently reachable.

## Security and credentials

Gateway capability does not authorize disclosure of account credentials.

External-service credentials remain at the authorized adapter/service boundary. Relay Stations carry permitted OceanMail data/requests, not reusable user secrets.

## Ownership

- **Product:** gateway/relay willingness, user/operator policy, accounting expectations, user-visible evidence.
- **Station:** gateway/relay execution, metering/logging, local observations, abuse/resource enforcement, communications integration.
- **Server:** authoritative service eligibility/accounting, hosted gateway behavior, eager-relay credit validation and assignment.
- **Networking/upstream layer:** if multi-hop is promoted, generic routing/forwarding should use a deliberately selected DTN/network approach rather than an accidental OceanMail application router.
