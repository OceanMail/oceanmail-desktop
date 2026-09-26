# Scheduling, Budgets, and Precedence

Available authorization, revision protection and explicit unavailable/unknown accounting follow the [merged Station logical contract](https://github.com/OceanMail/oceanmail-station-archive/blob/7a132b6ea4967c600dc8c673718d00b09c3ad42b/docs/AVAILABLE_MANIFEST_ACCOUNT_CONTRACT.md). No balances are implemented by this document. Station may cache authoritative hosted policy and maintain local reservations/usage when a Station is present; the hosted service owns equivalent direct-Internet authority in Station-less hosted/Lite operation. Missing or stale accounting must not authorize spending beyond known permission. Native availability does not depend on central balances and does not imply unlimited transfer.

- **Status:** Accepted 0.2 design direction

## Purpose

OceanMail must schedule scarce communications resources without making users manually operate every transmission opportunity. The autonomous Station owns execution when a Station is present; the client expresses intent and policy. In Station-less hosted/Lite direct-Internet operation, hosted services own the corresponding hosted plan/accounting execution boundary.

## Opportunistic operation

Ordinary OMail does not depend on the recipient being online and is not modeled as a conventional `send now or fail` operation.

Queued outbound work becomes eligible for the next suitable opportunity according to:

- Emergency precedence and Station scheduling bands;
- local user policy;
- available constrained-link budget;
- link/gateway availability;
- message/attachment selection;
- Station operational state; and
- lower-layer capabilities.

For incoming ordinary OMail over a constrained/Grid link, availability metadata may arrive opportunistically, but the content itself requires recipient selection/approval before retrieval.

The normal compose action should communicate queueing for delivery rather than promising immediate transmission.

## No user delivery-time promise

OceanMail should not present ordinary controls such as `Send at 21:00` as though a useful RF/gateway opportunity can be guaranteed at that time.

This does not prohibit the Station from using future operational policy windows for reasons such as:

- propagation forecasts or learned station-specific performance;
- power/battery state;
- operator quiet hours;
- regulatory/channel restrictions;
- cheaper connectivity;
- scheduled gateway availability; or
- congestion management.

Such windows govern Station operation, not guaranteed message-delivery time.

## Transport classes and Station bands

[Decision 0009](../decisions/0009-ordinary-mail-scheduling-and-importance.md) remains authoritative for mail transport classes; Project ADR-008 supersedes its band hierarchy. OMail has only Emergency and Ordinary transport classes. There is no ordinary sender-selectable Priority class. Important is conventional metadata only and must not affect RF precedence, Station queue precedence, relay precedence, gateway/path selection, credits/quota treatment or automatic Available retrieval order. Credits do not buy ordinary transport precedence.

[Project ADR-008](https://github.com/OceanMail/oceanmail-project/blob/main/docs/decisions/ADR-008-four-band-scheduling-and-channel-use.md) supersedes Decision 0009's old hierarchy and the intermediate six-band/reserved-slot drafts:

- **Band 0:** Emergency, including its own propagation, acknowledgements, stop-flow, and tombstones.
- **Band 1:** Control/manifests/Grid updates/coordination and authenticated Server-designated urgent shared updates.
- **Band 2:** Ordinary local-account and third-party relay payload.
- **Band 3:** Shared background broadcast data.

For initial testing, a ten-minute lease allows necessary Band 1 route establishment to use the whole lease, yielding at expiry. Once a route exists, Band 1 is capped at four minutes; Band 2 uses remaining time. Band 3 has no reserved lease share. Release unused time. The numeric lease/cap values remain tunable.

Band 2 retains local/relay sharing, account fairness, peer airtime fairness, aging, and bounded relay acceptance. Recipient order is a preference within its local-account share, not guaranteed RF precedence. Emergency preempts ordinary work/budgets under existing authorization gates; Important cannot promote traffic.

Use rendezvous announcements, negotiated addressed Band 1 then Band 2 on one working channel, and time/channel/dataset/version/duration-announced shared broadcasts. Broadcasts can occur at an hourly opportunity when needed, not as mandatory reserved lease slices. Single-radio listening/check-in and Emergency discovery require bounded validation.

## User fairness

On a multi-user Station, one user should not monopolize a Station scheduling band merely by queueing many items.

Scheduling should include a per-user fairness mechanism within equivalent scheduling/eligibility bands while preserving Emergency precedence and sensible direction/transfer constraints.

The exact algorithm remains implementation work and should be evaluated empirically.

## Aging and anti-starvation

Eligible ordinary work needs age protection and sensible continuation rules so fresh work, one large message or one account cannot indefinitely starve others.

Opportunity-based aging is preferred to blindly using wall-clock time because intermittent Stations may spend long periods with no viable opportunity at all.

Exact tuning thresholds are not architecture constants and should be established empirically.

## Capacity units

User and ship accounts use byte budgets; Stations use shared-radio airtime budgets with separate local-account, relay, and system accounting. These are capacity controls. Account selection or a band allocation does not create a balance, purchase precedence, or guarantee a contact.

Local-account manifests/metadata are Band 1 and consume Station airtime alongside selected Band 2 content. There is no separate manifest reserve or Band 3 reservation. Exact account budgets, Station allowances, lease/cap tuning, and fairness weights remain policy values. The broader allowance-exhaustion boundary for manifests remains separately unresolved.

## Constrained-link accounting

OceanMail meters scarce Grid/constrained-link use separately from ordinary Internet traffic.

The accepted user accounting model is:

- **sender pays send quota** for ordinary OMail sent over the constrained/Grid path;
- **receiver pays receive quota** for ordinary OMail they select/approve and successfully receive over the constrained/Grid path;
- incomplete/unusable receive attempts are not charged as successful receipt;
- ordinary Internet-only OceanMail synchronization does not consume constrained-link allowance unless future service policy explicitly says otherwise;
- Emergency OMail follows its separate quota-exemption policy.

There is no ordinary size-based automatic-receive threshold on constrained/Grid links. Compact availability metadata may be obtained first; the recipient decides which ordinary messages consume receive allowance.

Retransmission/link overhead should be measured for engineering purposes without automatically multiplying user-facing quota merely because a modem repaired errors.

Exact allowance sizes, service-tier values and similar numeric/economic parameters are Server-controlled service policy/tuning rather than protocol or architecture constants.

See Decision 0004 and `service-policy-and-tuning.md`.

## Meter everything; charge selectively

The Station's budget architecture is broader than end-user quota enforcement.

The Station should meter and log relevant work in separate domains even where user-account charging is zero:

- end-user send/receive usage;
- third-party relay/gateway resource use;
- Station/system/control traffic where measurable; and
- eager-relay contribution evidence.

Third-party relay/gateway traffic consumes no user Grid quota. In user-quota terms it can be treated as unlimited, but it remains subject to separate RF-airtime, byte, storage, retry/chatter, power, metered-Internet, peer-rate, abuse, and operator-policy limits.

This allows the Station to identify overly chatty or inefficient peers and protect scarce vessel/network resources without charging the volunteer vessel for third-party forwarding.

See `station-metering-and-resource-budgets.md`.

## Station working ledger and Server authority

When a Station must enforce allowance while disconnected, it maintains durable local working ledgers for user send/receive accounting and separate relay/system resource observations. These ledgers do not create globally authoritative balances.

The Server remains authoritative for global/account-level service accounting, earned credits, refunds, billing state, policy revisions, and reconciled adjustments. In Station-less hosted/Lite direct-Internet operation, the hosted service is also the active recipient-side accounting/plan owner.

A disconnected Station cannot mint globally spendable service credit for itself.

When Internet later becomes available, the Station synchronizes its working ledgers and applies server-authoritative corrections and updated policy.

If authoritative or sufficiently fresh cached accounting state is unavailable, the system exposes unknown/unavailable and fails closed for spending beyond known authorization rather than inventing a balance.

## Earned eager-relay credit

Verified eligible eager-relay contribution may earn a separate service credit reserve.

The Server is authoritative for whether work qualifies and for balances/corrections under the current service policy.

When the Station is registered, the owner chooses which account receives earned Station contribution credit:

- the associated vessel/ship account; or
- the captain's personal OceanMail account.

The destination is a Station registration/accounting setting. It does not change based on which crew user is logged in when relay work occurs.

Simply enabling eager mode does not by itself establish useful-work credit.

Credit rates, qualification thresholds, caps, expiry, rollover, anti-gaming thresholds, and similar operating values are service policy/tuning expected to change with testing and service maturity.

## Explicit approval for exceptional spend

If a user operation would consume earned credit or exceed ordinary included allowance, the UI should clearly show the estimated additional cost and require explicit approval where policy calls for it.

Approval is scoped to the relevant transfer/batch, not a blanket authorization allowing unrelated queued work to consume credit.

The UI must describe this as **eligibility/cost authorization**, not a promise that RF delivery will occur immediately.

Client-side approval state alone is not a reservation, debit, or authoritative accounting decision; the active plan/accounting owner must validate it before accepting spend.

## User reservation

A user may eventually reserve part of their current constrained-link allowance for later work. Reserved capacity is not reserved airtime and does not guarantee a future contact.

The final expression should remain simple—prefer one understandable reservation model over multiple interacting percentage/byte rules.

## Service policy and tuning

OceanMail deliberately separates the accounting/scheduling architecture from values likely to change as field evidence accumulates.

Examples include quota sizes, credit formulas/caps/expiry, refund thresholds, anti-gaming thresholds, relay/gateway resource ceilings, service-tier values, and other numeric/economic/operational limits.

These should be distributed as versioned Server-controlled policy and should normally be adjustable without an ADR, protocol generation, or client/Station software release solely to change a value supported by the existing policy schema.

## Estimates

The Station should expose estimates based on observed evidence where practical:

- effective throughput;
- queue ahead;
- recent retries/loss;
- link/modem characteristics;
- available gateway/path evidence;
- transfer size; and
- current budget eligibility.

Estimates are advisory, not promises.

## Background behavior

Queue processing, recipient-approved receiving, account synchronization, registry updates, service reconciliation, and telemetry/diagnostic uploads are background Station work and should not steal client focus.

Normal activity is surfaced through status/progress indicators. Emergency policy may intentionally interrupt.

## Ownership

- **Client:** expresses recipient order and user choices, selects incoming ordinary OMail for constrained retrieval, displays estimates/budget, obtains exceptional-spend approval.
- **Station (when present):** owns durable scheduling, local metering/working ledgers, cached-policy enforcement, queue execution, opportunity observations, relay/system resource enforcement, and background work; it does not mint authoritative hosted balances.
- **Hosted Server/service:** owns authoritative service accounting and policy; in Station-less hosted/Lite direct-Internet operation it also owns the durable hosted plan/accounting execution boundary.
- **HERMES/transports:** own link-layer scheduling/adaptation they already provide; OceanMail does not recreate their ARQ or modem schedulers.
