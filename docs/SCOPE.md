# OceanMail 0.2 Scope

## Purpose

OceanMail is a maritime communications product and service designed for intermittent, low-bandwidth, high-latency, and opportunistic connectivity while remaining useful over ordinary Internet connections.

The 0.2 generation separates the user-facing client from an autonomous OceanMail Station and reuses the HERMES/Mercury ecosystem for communications work that OceanMail should not independently recreate.

## Product components

OceanMail 0.2 has three primary product components plus infrastructure:

- **OceanMail Client** — user-facing email/chat/contact/calendar/account application.
- **OceanMail Station** — persistent onboard/edge communications and synchronization service.
- **OceanMail Server** — hosted Internet-side account, mailbox, gateway, directory, and service functions.
- **OceanMail Infrastructure** — deployment and operations for hosted services.

`OceanMail Full` is a complete deployment/product experience containing Client + Station capabilities. It is not required to be one process or one repository.

`OceanMail Lite` is best treated as a client capability/deployment mode: a client without Station responsibilities, using direct Internet or an available Station. The program should avoid maintaining separate Lite/Standard/Manager applications unless later evidence justifies them.

## This repository owns

`OceanMail/oceanmail-desktop` owns program-level product authority and the OceanMail client/product domain, including:

- product terminology and packaging;
- cross-repository architecture and boundaries;
- OMail/OChat user-facing behavior;
- vessel, station, user, crew, contact, and account concepts;
- client offline/local behavior;
- client connectivity to Stations and OceanMail Server;
- product-level delivery-state semantics and truthful receipt presentation;
- transfer intent, recipient ordering, budgets, selective retrieval, and user policy;
- client-side account/settings workflows;
- user-facing location sharing and contact behavior;
- product-level accessibility and presentation rules;
- product-wide security/privacy requirements;
- Winlink/SailMail and other interoperability requirements at the product boundary;
- overall roadmap, wishlist, open questions, and cross-repository decisions.

## OceanMail Station owns

The Station repository owns the autonomous onboard/edge service implementation, including:

- headless Linux operation;
- local Station API and authentication implementation;
- durable station queues and station-generated job identity;
- background transmit/receive/retry/synchronization behavior;
- HERMES UUCP/uucpd/uuxcomp integration;
- Mercury and supported transport adapters;
- radio/link control integrations where OceanMail-specific code is necessary;
- station-local measurements, transfer evidence, link history, and diagnostics;
- station-local vessel/station observations and future network-awareness data;
- web management implementation;
- user roles/authorization enforcement for Station operations;
- gateway/relay execution if and when those capabilities are accepted for implementation.

The Station should expose product outcomes and capabilities rather than forcing clients to mirror HERMES/Mercury internals.

## OceanMail Server owns

The Server repository owns hosted Internet-side behavior, including:

- authoritative hosted account/mailbox state;
- Internet-facing service APIs;
- account lifecycle and server-side authentication behavior;
- server-side directory/registry functions;
- external Internet mail/provider integration;
- server-authoritative quota, billing, abuse, and contribution accounting;
- gateway-side hosted service behavior;
- synchronization endpoints consumed by Stations and clients.

## Infrastructure owns

The Infrastructure repository owns:

- production/staging deployment;
- DNS and network infrastructure;
- CI/CD and release/deployment automation;
- backups and recovery operations;
- secrets and supply-chain controls;
- monitoring and operational runbooks.

## Upstream projects own

OceanMail should not duplicate mature upstream work without measured justification.

HERMES/Mercury and related upstream projects own or may provide:

- modem DSP/modulation;
- ARQ/FEC and modem-level adaptation;
- generic UUCP transport behavior;
- generic radio-control capabilities;
- broadcast/fountain-code mechanisms;
- modem/channel simulation and qualification tooling.

OceanMail-specific adapters, policy, evidence translation, and management remain downstream OceanMail responsibilities.

## Explicitly not on the initial 0.2 critical path

- BEMPIC integration;
- M4P integration;
- speculative global multi-hop mesh routing;
- a new OceanMail modem/DSP implementation;
- a separate OceanMail Manager application;
- recreating HERMES frontend/backend components without a concrete need;
- broad generic Internet-email client support unless later promoted.

These may remain research or wishlist items without becoming current implementation commitments.

## Change test

Before adding a requirement or implementation, ask:

1. Is it product-wide behavior or client behavior? If yes, it belongs here.
2. Is it autonomous Station communications, transport, measurement, or management implementation? If yes, it belongs in `oceanmail-station`.
3. Is it hosted Internet-side account/mailbox/gateway behavior? If yes, it belongs in `oceanmail-server`.
4. Is it deployment/operations? If yes, it belongs in `oceanmail-infrastructure`.
5. Is an upstream project already responsible for the lower-layer function? If yes, prefer upstream use/contribution and keep OceanMail-specific adaptation thin.