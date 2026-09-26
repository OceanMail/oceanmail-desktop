# Historical Store-and-Forward Techniques Worth Re-evaluating

- **Status:** Research / prior art
- **Purpose:** retain useful engineering ideas without treating historic protocols as OceanMail implementation requirements.

OceanMail's intermittent maritime problem has strong precedent in dial-up, BBS, file-transfer, packet-radio, and offline-reader systems. Some techniques remain relevant even though the original protocols, packet formats, and hardware assumptions do not.

## Kermit

Kermit is worth studying for adaptive behavior such as:

- sliding windows;
- selective retransmission;
- adaptive packet lengths;
- adaptive timeouts;
- long packets on clean links;
- smaller packets on difficult links;
- compression; and
- capability negotiation.

OceanMail must not recreate modem ARQ that Mercury, VARA, ARDOP, PACTOR, or another lower layer already provides.

The reusable higher-level lesson is **adapt the amount/granularity of application work to observed link conditions**. Potential OceanMail/Station applications include:

- reconciliation depth;
- logical resume granularity;
- amount of higher-level data sent before expecting confirmation;
- broadcast/FEC strategy; and
- Station opportunity/scheduling decisions.

Reference retained from 0.1 research: Columbia Kermit protocol documentation.

## ZMODEM

ZMODEM demonstrated the value of streaming useful data continuously when a path permits it instead of stopping for a higher-level acknowledgement after every small block, while preserving restart/recovery behavior.

OceanMail should evaluate the analogous application-level behavior:

- send a useful run of independently recoverable/persistable data;
- allow the receiving side to persist progress;
- tolerate losing the return path before confirmation; and
- reconcile missing state later.

This aligns with OceanMail's explicit one-way/asymmetric-contact requirement.

## QWK/offline readers

QWK-style systems bundled message/control information for transfer and then allowed the user to work completely offline.

Useful lessons include:

- batch many small logical items to amortize overhead;
- keep compact inventory/index data separate from bodies;
- compress a batch when that is more efficient than compressing each tiny item;
- make a received batch self-contained enough to remain useful after immediate disconnect; and
- package later replies/changes for the next opportunity.

Do not reproduce QWK's historical fixed-field/encoding limitations.

## FidoNet mailer separation

FidoNet's separation between human-facing application/BBS and unattended mailer is highly relevant to OceanMail 0.2.

Conceptually:

```text
OceanMail client / user mailbox
        |
OceanMail Station durable state
        |
unattended scheduler / handoff
        |
HERMES / transport / radio
```

This idea has effectively been promoted into active 0.2 architecture: the Station continues communications while user clients are absent.

## FidoNet Crash/Hold/Normal semantics

Historic mailers distinguished urgent traffic from ordinary scheduled/held traffic.

OceanMail should borrow the **policy concept**, not the literal flags:

- Emergency;
- Priority/local business;
- Normal;
- bulk/deferred;
- wait-for-cheaper/better link; and
- discretionary relay/gateway contribution.

## FidoNet event scheduling

Historic mailers used scheduled events/mail hours to optimize scarce telephone/toll resources.

OceanMail should not promise that a user message will transmit at a requested clock time, because the only useful propagation/contact opportunity may occur elsewhere.

However, the Station should continue researching operational policy windows based on:

- propagation;
- battery/power;
- operator quiet periods;
- gateway schedules;
- link monetary cost;
- channel/regulatory restrictions; and
- congestion.

The durable lesson is: **not all queued traffic should necessarily transmit at the first technically possible instant**.

## FidoNet PATH / SEEN-BY

FidoNet accumulated route/seen information to reduce duplicate redistribution.

Future OceanMail networking may need compact bounded equivalents for:

- known holders/custodians;
- recently observed peers;
- probable replication;
- loop suppression;
- delivery evidence; and
- path diversity.

Do not copy ever-growing textual headers; constrained HF demands bounded metadata.

## FidoNet scanner/tosser architecture

Separating local message storage, packet/batch creation, routing/queueing, transfer sessions, and inbound import remains valuable for:

- crash isolation;
- deterministic testing;
- replay/recovery;
- transport independence; and
- avoiding corruption of the user mailbox when a communications component fails.

OceanMail 0.2's Client/Station separation should preserve these benefits without copying historic file formats.

## UUCP

Unlike most items in this document, UUCP is not merely historical inspiration: HERMES already uses UUCP/store-forward components as part of OceanMail 0.2's initial proof baseline.

Lessons especially relevant to OceanMail include:

- unattended queued work;
- persistent spools;
- store-forward operation;
- delayed/retried contacts;
- separation of local application handoff from communications sessions; and
- mature operational semantics under unreliable connectivity.

OceanMail should first measure what HERMES/UUCP already solves before adding a new higher-level synchronization protocol.

## Applicability test

Before adopting an old technique, ask:

1. What concrete OceanMail failure/cost does it address?
2. Does HERMES/Mercury/the modem already solve it at a lower layer?
3. What extra bytes, airtime, turnarounds, storage, and complexity does it add?
4. Does it survive interrupted/asymmetric links better in measurement?
5. Does it improve user-visible delivery, or merely add protocol elegance?

Historic ideas are valuable because they were developed under scarce communications constraints—not because their exact protocols should be recreated.
