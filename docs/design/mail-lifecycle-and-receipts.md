# OMail Lifecycle and Receipt Semantics

- **Status:** Accepted 0.2 design direction

## Purpose

OceanMail must describe message state from evidence, not from optimistic UI assumptions. Intermittent connectivity means a successful local handoff or radio transmission may be separated from confirmed remote receipt by minutes, days, or an entirely different later path.

A single `sent` flag is therefore insufficient.

## Stable logical message identity

An OMail message has a stable logical identity that survives:

- repeated transport attempts;
- interrupted sessions;
- retries through a different link, modem, gateway, or Station;
- later server reconciliation; and
- duplicate observations of the same message.

A retry of the same user message does not silently create a second logical email. A transport attempt may have its own attempt identifier and timestamps while remaining attached to the same logical message.

The exact identifier representation is an implementation/security decision; the product requirement is durable uniqueness and no accidental identity reuse.

## Evidence layers

The Station and Server may know different facts at different times. Product state should be derived from the strongest available evidence rather than forcing all transports into one identical internal state machine.

At minimum OceanMail must be able to distinguish these concepts:

1. **Draft** — user work exists locally but has not been submitted for delivery.
2. **Accepted locally** — the client or Station has durably accepted the message/job.
3. **Queued** — durable Station or service state says the message is waiting for an eligible opportunity.
4. **Transmission attempted** — a transport attempt began.
5. **Transmitted** — the local side completed the applicable send operation. This is not proof of remote durable receipt.
6. **Remote transfer confirmed** — evidence shows a remote peer, Station, gateway, or service accepted/persisted the transfer at the relevant transport/application boundary.
7. **Destination stored** — the intended OceanMail destination Station/mailbox has durably stored a complete valid message where that evidence is available.
8. **Server accepted** — OceanMail hosted service accepted the message where server participation is part of the delivery objective.
9. **Delivered** — available evidence satisfies the defined delivery objective for that destination.
10. **Failed / retryable** — the current attempt failed but the logical message remains eligible for later work.
11. **Delivery unconfirmed / needs attention** — bounded automatic retry/repair policy cannot establish delivery and user/operator attention may be appropriate.
12. **Cancelled locally** — local future work was cancelled. This does not claim remote erasure of copies already transmitted.

Exact internal names may differ. The semantic distinctions may not be collapsed merely to simplify a transport adapter.

## Timestamps

OceanMail retains separate timestamps/evidence for materially different events, including where available:

- local acceptance;
- queueing;
- transmission attempt;
- transmission completion;
- remote confirmation/receipt;
- destination/server acceptance; and
- final delivery evidence.

In particular:

> `transmitted_at` and confirmed receipt/delivery time are separate facts.

The UI must never display a local successful transmission time as though it were a confirmed destination receipt time.

## Read receipts are separate

`Destination stored` or `Delivered` does not mean a human read the message.

Human read receipts, if ever supported, are optional user-level behavior and are not required for reliable OMail delivery.

## Durable compact receipts

Where the transport/service permits it, delivery/receipt evidence should be:

- small;
- durable;
- idempotent;
- keyed to stable logical message identity; and
- safe to reconcile much later than the payload transfer.

A tiny receipt can prevent retransmission of a much larger payload and is therefore high-value control information.

The exact wire representation is not an OceanMail product-layer commitment and may be provided by HERMES, a future synchronization layer, an OceanMail service API, or another supported mechanism.

## Source retention and uncertainty

The originating Station should normally retain enough local state to retry or reconcile a message until:

- confirmed delivery evidence exists;
- retention policy permits cleanup; or
- bounded retry policy ends and the user explicitly resolves the item.

Absence of a receipt is not proof of failure. A peer or gateway may have accepted useful data and lost connectivity before an acknowledgement returned.

OceanMail therefore treats these as distinct:

- positive delivery evidence;
- explicit negative/failure evidence; and
- no evidence yet.

## Receive-before-ack principle

When practical, a receiving layer should durably persist useful validated data before generating higher-layer acknowledgement. If acknowledgement is lost, later duplicate reception must be safe and inexpensive.

This is a product reliability requirement, not permission for OceanMail to duplicate modem ARQ or generic HERMES retransmission mechanisms.

## Retry and repair

Retry policy should prefer inexpensive reconciliation/evidence checks before repeating a large transfer when such checks are available.

Automatic retry must be bounded. Normal OMail should not generate unending retransmission or replication merely because final evidence is absent.

Future multi-hop relay/replication mechanisms may use richer repair, responsibility, tombstone, and replica-confidence models, but those mechanisms remain research until maritime relay work is promoted. The enduring product requirements are stable identity, durable progress, truthful evidence, deduplication, and bounded retry.

## External Internet email

For mail delivered outside OceanMail, the strongest obtainable evidence may differ from native OMail. OceanMail should report what the external provider/protocol actually establishes rather than manufacture stronger semantics.

For example, an SMTP server acceptance may be known while human mailbox presentation or reading is not.

## Ownership

- **Client:** presents lifecycle state and timestamps; never fabricates transport evidence.
- **Station:** owns durable local queue/attempt state and records evidence available from communications layers.
- **Server:** owns authoritative hosted-service acceptance and server-side delivery/reconciliation evidence.
- **HERMES/modems/transports:** own their actual link/session/transport success and failure semantics.

Adapters translate evidence into OceanMail concepts without pretending a lower layer proved more than it did.
