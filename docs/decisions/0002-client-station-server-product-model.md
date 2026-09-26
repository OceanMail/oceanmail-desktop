# Decision 0002 — Client, Station, and Server Product Model

- **Status:** Accepted; client implementation portions partially superseded by Decision 0005
- **Date:** 2026-09-03
- **Supersession note:** Decision 0005 replaces the clean-sheet/abstract client implementation assumption with a Thunderbird-based OceanMail Desktop and Thunderbird-family mobile reuse direction. The Client/Station/Server separation, headless Station model, roles, deferred account operations, shared management API, and Station-owned network-awareness model remain accepted.

## Context

OceanMail 0.1 often treated the full onboard application and communications Station as one product/application. OceanMail 0.2 separates Station communications from the user-facing client.

The separation raised product questions around OceanMail Full, OceanMail Lite, multiple onboard users, headless installations, delegated administration, account-setting synchronization, and Station management.

## Decision

OceanMail 0.2 uses three primary technical components:

- **OceanMail Client** — user-facing application;
- **OceanMail Station** — autonomous persistent onboard/edge service;
- **OceanMail Server** — authoritative hosted Internet-side service.

### Client family

This section is partially superseded by Decision 0005.

The durable intent remains to avoid unnecessary separately maintained client products and to keep client responsibilities separate from Station responsibilities. Decision 0005 now establishes **OceanMail Desktop** on a Thunderbird foundation and directs mobile/Lite work to prefer Thunderbird-family foundations where practical.

`OceanMail Lite` continues to describe client operation without Station responsibilities. The client may use direct Internet or an available Station.

`OceanMail Full` no longer implies a separate client codebase; see Decision 0005.

### Headless Station

A headless Linux Station is a first-class deployment. Multiple laptops/phones may use one Station. The Station continues queueing, transmitting, receiving, retrying, synchronizing, and other permitted background work when clients are offline or powered down.

### Roles

Station administrative authority belongs to authenticated users/roles rather than laptops. The Station Owner/Captain may delegate administrative authority to another user. Device trust/pairing remains separate from user authorization.

Station administration does not silently grant access to another user's private mailbox or credentials.

### Account/server settings

For supported deferrable operations, users may make account/server-setting changes while connected only to the Station. The Station durably stores the pending operation and synchronizes it later when Internet becomes available, even if the originating client is no longer online.

Security-critical operations require a separate authorization design and may be restricted from deferred execution.

### Management UI

The Station exposes a management API used by both:

- the Station's local web-management interface; and
- Station-management features in the OceanMail client.

Do not maintain separate management semantics for the web and app interfaces.

### Network-awareness data

Persistent Station/network observations, maps, node/vessel/gateway tracking, statistics, relay/gateway policy, and future routing evidence belong primarily to the autonomous Station and are exposed through the Station API.

## Consequences

- OceanMail Desktop and Station remain separate architectural components even when installed on one machine.
- Crew clients do not need to remain powered on for Station work to continue.
- A single Station can serve multiple users and delegated administrators.
- Web management becomes a reusable management surface rather than another product.
- The client remains substantially closer to the former Lite responsibility set than to the old monolithic Full application.
- Future separate Manager software is unnecessary unless later requirements justify it.
- Client implementation details and current product terminology are governed by Decision 0005.
