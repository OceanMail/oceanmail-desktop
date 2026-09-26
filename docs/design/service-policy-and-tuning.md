# Service Policy and Tuning

[Decision 0009](../decisions/0009-ordinary-mail-scheduling-and-importance.md) is a policy constraint, not a tunable premium: Important and credits never purchase ordinary transport precedence. Unknown/unavailable policy or balances must fail closed for spending beyond known authorization; exact stale-state and reservation mechanisms remain implementation design work.

- **Status:** Accepted 0.2 design direction

## Purpose

OceanMail separates durable product architecture from operational service policy and tuning values that are expected to change as real capacity, field performance, economics, and abuse patterns become known.

A policy value changing does not, by itself, represent an architecture change.

## Architecture versus service policy

The following are architectural/product rules:

- ordinary constrained-link OMail requires recipient selection/approval before content retrieval;
- sender and receiver constrained-link accounting are distinct;
- sender pays applicable send quota;
- receiver pays applicable receive quota after approved successful receipt;
- relay forwarding does not consume user Grid quota;
- Stations still meter/log relay, gateway, user, and system traffic even when no user charge applies;
- relay/gateway resource controls are separate from end-user send/receive quota;
- verified eager-relay contribution may earn service credit;
- Station registration selects whether earned contribution credit belongs to the vessel/ship account or captain's personal account;
- the Server is authoritative for global service accounting and policy;
- a disconnected Station may use durable cached policy and local working ledgers, then reconcile later.

The following are **service policy/tuning**, not architecture constants:

- daily send/receive allowance amounts;
- service-tier quota values;
- pricing and plan limits;
- ordinary scheduling fairness parameters and service-cost values that do not buy transport precedence;
- earned-credit rates/formulas;
- credit caps, expiry, rollover, and daily-use ceilings;
- refund/reconciliation thresholds and adjustment rules;
- anti-gaming and abuse-detection thresholds;
- contribution qualification thresholds;
- relay/gateway RF-airtime, byte, storage, retry, chatter, peer-rate, power, and metered-Internet ceilings;
- service-tier account counts and related commercial limits; and
- similar numeric/economic/operational values.

These values should be established through testing and operations and may change frequently as the service matures.

## Change-control rule

Changing a service-policy/tuning value should normally require:

- no new ADR;
- no new OceanMail protocol generation;
- no client release solely to change the value; and
- no Station software release solely to change the value where the existing policy schema supports it.

A numbered decision is appropriate only when the underlying conceptual relationship changes—for example, changing who is charged for a class of traffic, whether recipient approval is required, whether relay Stations consume user quota, or whether Stations meter resource use at all.

## Server authority

OceanMail Server owns the authoritative current service-policy values and their version/revision state.

Stations should receive policy through authenticated/versioned service state and retain sufficient validated cached policy to operate during disconnection.

Exact signing, expiry, rollback, stale-policy, and fail-open/fail-closed mechanics belong to the security/Server/Station implementation designs.

## Offline Station behavior

A disconnected Station uses the most recent valid applicable policy available to it together with durable local working ledgers.

Those ledgers may include:

- user send/receive budget usage;
- third-party relay/gateway resource consumption;
- Station/system operational traffic;
- eager-relay contribution evidence; and
- reconciliation state.

Later Server synchronization may:

- confirm local accounting;
- issue adjustments/refunds;
- update balances;
- update policy values; and
- reconcile verified eager-relay contribution.

This reconciliation must not require the client that originally queued or approved work to remain online.

## Unlimited user budget versus resource limits

Third-party relay/gateway traffic may be treated as unlimited for **user-quota charging** because the vessel/captain is not debited for carrying it.

It remains fully measurable and may be constrained by Station/operator/service policy for RF airtime, bytes, storage, retries, chatter, power, expensive Internet use, abuse, or other scarce resources.

This permits OceanMail to encourage cooperative relay operation without allowing a defective or overly chatty peer to monopolize a volunteer Station.

See `station-metering-and-resource-budgets.md`.

## Testing and evolution

Initial values should be treated as experimental operating parameters until supported by field evidence.

Useful evidence includes:

- effective HF/link capacity;
- typical send/receive volumes;
- queue delay;
- user behavior;
- relay contribution;
- relay/control chatter and retry load;
- cost of Internet/gateway operation;
- abuse/fraud patterns;
- service economics; and
- operational support burden.

The service should be able to tune values conservatively without destabilizing the product architecture.

## Documentation rule

Service-policy values may be documented in Server/operations configuration, policy schemas, dashboards, release notes, or service-plan material as appropriate. They should not accumulate in `OPEN-QUESTIONS.md` simply because their current value is not yet known.

If a policy experiment later exposes a genuine architectural problem, that problem returns to the normal design/decision process separately.

## Ownership

- **Program/product docs:** define the durable accounting/resource relationships and policy schema expectations.
- **OceanMail Server:** owns authoritative service-policy values and service-side enforcement/reconciliation.
- **OceanMail Station:** meters all relevant work, caches/enforces applicable policy while disconnected, manages user budget eligibility, enforces relay/system resource controls, and reconciles later.
- **Client:** displays current applicable limits/cost estimates and obtains user approval where required.
- **Infrastructure/operations:** deploys and monitors policy changes according to operational controls.
