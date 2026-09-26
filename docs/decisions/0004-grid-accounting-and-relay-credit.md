# Decision 0004 — Grid accounting, receive approval, relay credit, and Station metering

**Current policy supersession (2026-09-10):** [Decision 0009](0009-ordinary-mail-scheduling-and-importance.md) overrides all older ordinary Priority classes, premiums and inbound/outbound reprioritization language retained below as decision history. Only Emergency and Ordinary remain; Important is conventional metadata only. Recipient ordering is a preference within the local-account portion of Band 2 under [Project ADR-008](https://github.com/OceanMail/oceanmail-project/blob/main/docs/decisions/ADR-008-four-band-scheduling-and-channel-use.md), never guaranteed transport precedence. ADR-008's Bands 0–3 supersede Decision 0009's historical five-band hierarchy. Current account-scoped Available ownership/authorization follows the [Station logical contract](https://github.com/OceanMail/oceanmail-station/blob/main/docs/AVAILABLE_MANIFEST_ACCOUNT_CONTRACT.md).

- **Status:** Accepted
- **Date:** 2026-09-03

## Context

OceanMail uses scarce constrained-link resources differently for originating users, receiving users, and volunteer relay Stations. Earlier migration text incorrectly carried forward a 0.1 idea that sufficiently small ordinary OMail could be automatically retrieved over a constrained link.

That is not the accepted product model. Ordinary constrained-link OMail is recipient-selected: availability/metadata may be learned cheaply, but the message content does not automatically consume the recipient's receive allowance merely because it is small.

The accounting model must also avoid charging volunteer relay Stations merely for carrying third-party traffic while still allowing useful eager-relay participation to earn service credit.

A separate clarification is required for Station resource management: third-party traffic may consume no **user quota**, but the Station must still meter, log, and if necessary restrict its use of RF airtime, bytes, storage, power, Internet, and other resources.

## Decision

### No automatic ordinary OMail over constrained links

Ordinary OMail content is not automatically downloaded over a metered/Grid/constrained link based on a small-message threshold.

A recipient may learn that OMail is available through compact metadata/manifest information, then explicitly select or approve the message for constrained-link retrieval. Message size may affect estimates, ordering, and user decisions, but it does not create automatic-delivery authorization.

This rule applies to ordinary OMail. Emergency OMail follows its separately accepted emergency policy.

When inexpensive ordinary Internet connectivity is available, permitted mailbox synchronization may still occur automatically according to user/service policy; this decision concerns scarce constrained-link/Grid transfer.

### User send and receive accounting

For ordinary OMail carried over a metered Grid/constrained link:

- the **sender pays send quota** to send the message;
- the **receiver pays receive quota** when the receiver has selected/approved the message and it is successfully received under the applicable service accounting rules.

Send and receive accounting remain distinct.

Incomplete or unusable receive attempts are not charged as successful receipt.

Ordinary Internet-only synchronization remains outside Grid/constrained-link accounting unless a later service policy explicitly defines otherwise.

Emergency OMail follows its separate quota-exemption policy.

### Relay accounting

A Station acting only as a relay for third-party traffic pays **no user Grid quota** for forwarding that traffic.

From the vessel/user accounting perspective, ordinary third-party relay/gateway traffic therefore behaves as though it has an unlimited user-quota budget.

That does **not** mean relay traffic is unmetered, unlogged, or physically unlimited.

The Station must separately measure and account for relay/gateway resource use and may enforce operator/service limits on resources such as:

- RF airtime;
- third-party bytes;
- relay storage;
- retries/control chatter;
- battery/power;
- CPU/storage pressure;
- metered/satellite Internet use; and
- peer/source rate limits or abuse controls.

These resource controls do not convert relay forwarding into personal/vessel send/receive charges.

### Metering and logging

Stations should meter and log communications work across user, relay/gateway, and Station/system traffic even when service policy assigns no user charge.

The Station needs this evidence for:

- local user budget enforcement;
- eager-relay contribution/credit evidence;
- abuse/rate-limit decisions;
- identifying overly chatty or inefficient peers;
- diagnostics and capacity planning;
- reconciliation with Server authority; and
- future policy tuning.

Where practical, the Station should distinguish user/application payload, Station/protocol overhead, relay/gateway work, retransmissions/repair, RF airtime, Internet bytes, and success/failure outcomes.

Measurements must reflect evidence actually available from the transport rather than inventing unavailable precision.

### Eager-relay credit

Verified eligible eager-relay contribution may earn service credit under Server-authoritative accounting.

When a Station is registered, its owner selects where earned Station contribution credit is assigned:

- the associated **vessel/ship account**; or
- the **captain's personal OceanMail account**.

This destination is a Station registration/accounting setting. It is not inferred from which user happens to be logged into a client when relay work occurs.

Changing the credit destination must follow the applicable authenticated Station/account settings workflow and synchronize to the Server when connectivity permits.

The Server remains authoritative for earned-credit validation, balances, corrections, and current service policy. Station logs provide evidence but cannot mint credit locally.

### Architecture versus service policy

This decision fixes the **relationships**, not the numeric/economic values.

The following are deliberately service policy/tuning and are expected to be established through testing and changed as the service matures:

- send/receive allowance amounts;
- service-tier quota values;
- eager-relay credit rates/formulas;
- credit caps, expiry, rollover, and daily-use ceilings;
- reconciliation/refund thresholds and adjustment rules;
- anti-gaming/abuse thresholds;
- relay/gateway resource ceilings and rate limits; and
- similar plan/economic/operational parameters.

Changing those values does not require a new ADR or product/protocol generation when the relationships above remain unchanged. The Server should distribute current versioned policy so Stations can enforce cached policy while disconnected and reconcile later.

See `../design/service-policy-and-tuning.md` and `../design/station-metering-and-resource-budgets.md`.

## Consequences

- ordinary constrained-link mailbox content requires recipient selection/approval rather than a size-based automatic-download rule;
- senders and receivers each account for their own end-user side of successful constrained-link mail transfer;
- relay Stations do not lose personal/vessel user quota merely by volunteering to carry third-party traffic;
- all meaningful Station traffic remains metered/logged for operational evidence even when it is not charged to a user;
- relay/gateway work can be locally limited for abuse, chatter, resource, or operator-policy reasons without becoming user-billable;
- eager-relay incentives can reward the vessel as an operating entity or the captain personally, according to the Station owner's explicit registration choice;
- implementation must preserve separate user, relay-resource, system/operational, and earned-credit ledgers/evidence rather than collapsing them into one byte counter; and
- operational policy can evolve rapidly without redefining OceanMail architecture.
