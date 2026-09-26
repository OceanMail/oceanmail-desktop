# Station Metering and Resource Budgets

- **Status:** Accepted 0.2 design direction

## Core rule

OceanMail Stations **meter and log communications work even when that work does not consume an end user's Grid quota**.

`Not charged to a user` does not mean `unmetered`, `unlogged`, or `unbounded`.

This distinction is fundamental to relay accounting, abuse control, diagnostics, capacity planning, and future service tuning.

## Byte budgets and airtime policy

[Project ADR-008](https://github.com/OceanMail/oceanmail-project/blob/main/docs/decisions/ADR-008-four-band-scheduling-and-channel-use.md) defines Bands 0–3, account-byte budgets, and Station-airtime budgets with distinct local-account, relay, and system domains. Budget or scheduled time does not grant mailbox access.

Initial ten-minute leases permit full-lease necessary Band 1 route establishment; thereafter its normal cap is four minutes. Band 2 uses remaining time with account/relay-peer fairness and bounded forwarding backlog. Band 3 has no reservation and uses idle or announced shared broadcasts. Emergency is Band 0 and overrides ordinary budgets under existing authorization gates. Urgent Server-promoted shared updates use Band 1's normal cap. Numeric values/weights remain tunable.

## Three accounting/resource domains

The Station should conceptually maintain at least three distinct domains.

### 1. End-user Grid accounting

Tracks constrained-link use attributable to vessel/user communications under Decision 0004.

Examples:

- sender send quota;
- recipient-approved receive quota;
- applicable account/service policy, independent of Important metadata;
- exceptional earned-credit use where authorized.

The Station may enforce these budgets locally while disconnected using cached policy and durable working ledgers, then reconcile with the Server later.

### 2. Relay/gateway resource accounting

Tracks third-party work carried by the Station.

Examples:

- bytes received, stored, forwarded, or gatewayed for others;
- RF airtime attributable to third-party work;
- Internet bytes used for third-party gateway traffic;
- storage occupied by relay data;
- retries/duplicate traffic;
- peers generating excessive control or payload traffic;
- useful completed relay work needed for eager-relay credit evidence.

This traffic consumes **no user send/receive Grid quota** merely because the Station relays it.

From the end-user billing/quota perspective, third-party relay work therefore behaves as though it has an unlimited user budget.

It is still subject to Station resource controls, operator policy, network safety, abuse controls, and available physical capacity.

### 3. Station/system operational accounting

Tracks work needed to operate and diagnose the Station itself.

Examples:

- protocol/control traffic;
- manifests/availability metadata;
- receipts and delivery evidence;
- registry/policy/security updates;
- synchronization/accounting reconciliation;
- modem/link overhead where observable;
- failed attempts and retries;
- diagnostics/telemetry;
- software/configuration distribution where permitted.

System traffic should be measurable even when service policy does not assign it to a user's quota.

## Unlimited user quota is not unlimited resources

A relay Station may be treated as having no end-user quota debit for third-party work while still enforcing local limits such as:

- maximum third-party RF airtime per period;
- maximum third-party bytes per period;
- maximum relay storage;
- maximum retry/control-chatter rate;
- peer-specific or source-specific rate limits;
- battery/power thresholds;
- CPU/storage-pressure limits;
- metered/satellite Internet permissions and ceilings;
- quiet/operational windows; and
- emergency/local-work preemption.

These controls protect the vessel and the network without converting volunteer relay work into a billable user activity.

## Abuse and overly chatty peers

Because every Station observes its own resource consumption, it can identify peers or traffic patterns that consume disproportionate resources.

Candidate evidence includes:

- repeated duplicates;
- excessive failed handshakes/retries;
- repeated advertisements/control messages without useful work;
- abnormal bytes or airtime per useful delivered object;
- repeated requests for unavailable/unauthorized content;
- unusually high relay storage pressure; and
- repeated gateway use inconsistent with applicable policy.

The Station may locally rate-limit, defer, deprioritize, or temporarily refuse abusive/excessive third-party work according to current policy while preserving Emergency and required local behavior.

Exact thresholds are service-policy/tuning values, not architecture constants.

## Eager-relay credit evidence

Eager-relay credit requires measurable evidence of eligible useful work.

The Station therefore needs durable accounting sufficient to report candidate contribution such as:

- bytes/objects successfully accepted for relay;
- bytes/objects successfully forwarded;
- useful gateway completion;
- timestamps and peer/job identities needed for deduplication/verification;
- transport/resource cost where useful; and
- relevant failure/duplicate evidence.

The Server remains authoritative for deciding what qualifies for credit and for preventing double counting or gaming.

The Station's logs provide evidence; they do not mint credit locally.

## End-user budget management

The Station may manage user send/receive budget eligibility on behalf of connected clients.

This is especially important because the Station continues working after a laptop/phone disconnects.

The Station should be able to:

- expose current cached allowance/policy to clients;
- reserve/authorize applicable user budget for queued work;
- prevent unauthorized over-budget work;
- retain user approval for a specific queued/retrieval operation;
- continue that authorized work after the client closes;
- record actual successful usage; and
- reconcile later with Server authority.

A client should not need to remain online merely to enforce an already-authorized user's budget.

## Measurement granularity

Where practical, retain separate measurements for:

- application/user payload bytes;
- OceanMail/Station overhead;
- upstream transport/carrier bytes where exposed;
- retransmissions/repair;
- RF airtime or on-air-equivalent duration;
- Internet/gateway bytes;
- storage/time held; and
- success/failure outcome.

Not every transport exposes every layer accurately. The Station must label measurements according to the evidence actually available rather than inventing precision.

## Retention and privacy

Operational/accounting logs should retain enough information for accounting, diagnostics, abuse control, and field analysis without unnecessarily storing message content.

Where possible, logs should identify jobs, peers, sizes, timings, outcomes, and resource use without duplicating private mailbox bodies or attachments.

Exact retention periods are policy/tuning values.

## Dashboard/API

The Station API/web dashboard should eventually expose appropriate views of:

- user send/receive usage and remaining allowance;
- third-party relay/gateway resource consumption;
- eager-relay contribution evidence and Server-confirmed credit;
- traffic by transport/direction/class;
- unusually chatty/expensive peers or traffic patterns;
- resource limits and current utilization; and
- reconciliation status.

Visibility is role-scoped; ordinary users need not see all relay/abuse diagnostics.

## Ownership

- **Station:** measures, logs, enforces local user eligibility/resource controls, and produces contribution/abuse evidence.
- **Server:** owns authoritative service accounting, current policy/tuning values, credit qualification, and cross-Station abuse/accounting decisions.
- **Client/web UI:** displays authorized budget/resource state and collects user/operator policy choices.
- **Transport layers:** expose lower-layer metrics where available; OceanMail should not fabricate unavailable carrier detail.

## Design summary

> Meter everything useful to operations; charge users only according to service policy; treat third-party relay work as unlimited in user-quota terms but never as unmeasured or physically unlimited.
