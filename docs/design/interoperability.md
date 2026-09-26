# Interoperability and External Messaging Services

- **Status:** Accepted 0.2 product direction; individual integrations require technical/legal validation

## Purpose

OceanMail should be useful alongside existing maritime and Internet messaging systems rather than requiring users to abandon them before OceanMail has broad native coverage.

Interoperability is implemented through explicit service adapters and gateways, not by pretending external networks are native OMail.

## Native OceanMail and conventional Internet email

OceanMail Server/Gateway may bridge native OMail to conventional Internet email destinations where service policy permits.

The external Internet mail system does not need to understand OceanMail's constrained-link transport. OceanMail terminates its own message/service semantics at an authorized gateway/server and uses standard external-mail mechanisms on the Internet side.

Inbound external mail may similarly be accepted by OceanMail service, normalized according to OMail policy, and made available to a user through Internet or Station delivery.

## Winlink

Winlink compatibility remains an early strategic interoperability goal, subject to current Winlink interfaces, rules, and applicable amateur-radio regulations.

Product goals include:

- permit an eligible Winlink user to use OceanMail client workflows without requiring a separate UI for every supported path where technically practical;
- preserve Winlink identity/status semantics rather than falsely labeling Winlink traffic as native OMail;
- use supported/published interfaces rather than recreating the Winlink network;
- support lawful compatible modem/radio paths where available; and
- prevent traffic from being routed through amateur-radio facilities when that traffic is not legally appropriate for amateur carriage.

Exact B2F/client integration details require a fresh implementation review before work begins; frozen BEMPIC B2F research is prior art, not a current dependency.

## SailMail

SailMail integration remains strategically desirable for the offshore cruising market and existing PACTOR users.

OceanMail must not assume that SailMail's coast-station network or transfer interfaces are available for arbitrary third-party use.

Preferred path:

- official partnership/permission or documented third-party client capability;
- preserve SailMail account/membership rules;
- reuse existing compatible user hardware where permitted; and
- present SailMail traffic/status honestly as SailMail service.

No SailMail integration is considered available until authorization and technical interface requirements are confirmed.

## Generic Internet mail accounts inside the client

Whether OceanMail should become a general-purpose Gmail/Outlook/IMAP/SMTP desktop mail client remains unresolved.

This question is separate from:

- OceanMail's own use of Internet connectivity;
- delivery to/from ordinary external email addresses through OceanMail service;
- Winlink interoperability; and
- authorized SailMail integration.

The product should not absorb full generic-mail-client complexity before the OceanMail communications problem is solved unless a later decision finds clear value.

## Service-specific reachability

A Station/gateway may be able to reach some external services and not others.

Conceptually, future capability state may distinguish:

- OceanMail hosted service available;
- conventional Internet email egress available;
- Winlink path available and legally eligible;
- SailMail integration available for an authorized account; and
- no external egress currently available.

Capability/reachability information must carry freshness and must not expose service credentials as public routing metadata.

## Gateway selection

OceanMail may choose among eligible gateways according to product policy and observed capability/cost, but the exact discovery/scoring mechanism is not part of the first 0.2 milestone.

First prove direct Station → gateway delivery. Opportunistic gateway selection follows. Multi-hop Station → Station → gateway forwarding requires field evidence before promotion.

See `gateway-and-relay.md`.

## Credentials and authorization

External-network credentials belong at the authorized account/gateway/adapter boundary.

They must not be broadcast as service advertisements or handed to arbitrary relay Stations.

A Station claiming reachability to an external service does not automatically prove it is authorized to act for a particular user/account.

## Legal and service-policy constraints

Every adapter/path must respect:

- the destination network's terms/rules;
- applicable radio-service restrictions on each constrained hop;
- user/account authorization;
- commercial-content/encryption restrictions where relevant; and
- service-specific membership/licensing requirements.

OceanMail must not be used to hide an otherwise prohibited communication path behind an application abstraction.

## Delivery evidence

External networks provide different levels of delivery evidence.

OceanMail reports the strongest evidence actually available—for example gateway acceptance or upstream server acceptance—without claiming recipient reading or final delivery when the external system does not provide that proof.

See `mail-lifecycle-and-receipts.md`.

## Transport abstraction

Ordinary users should not need to understand which modem or intermediate communications technology was used to reach an authorized external adapter.

Advanced Station diagnostics may expose the actual path for troubleshooting and accounting.

## Ownership

- **Client/product:** account/service presentation and user intent.
- **Station:** communications path to a gateway and local eligibility/policy evidence.
- **Server/Gateway adapters:** external service credentials, normalization, submission/retrieval, service-specific rules.
- **External services:** remain independent systems whose semantics OceanMail must not redefine.
