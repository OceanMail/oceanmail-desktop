# Security, Trusted State, Conflicts, and Regulatory Policy

- **Status:** Accepted 0.2 design direction

## Purpose

OceanMail operates while clocks, Internet access, position sources, and Server authority may be unavailable for long periods. The product must preserve useful local operation without pretending uncertain state is authoritative.

## Trusted time

Preferred trusted time sources include:

- GNSS/GPS-derived time; and
- authenticated/reliable Internet time.

An arbitrary local/manual system clock without recent trustworthy comparison is not treated as equally authoritative.

After a trusted source disappears, the Station may continue using its local clock while retaining explicit freshness/confidence based on the most recent trusted comparison.

If trusted sources materially disagree, OceanMail must surface the discrepancy rather than silently selecting one without evidence.

## Time-independent identity/order

Message/object identity and correctness must not depend exclusively on wall-clock timestamps.

Stable identifiers, monotonic/local ordering information, and durable attempt/state records must permit useful operation when absolute time is uncertain.

## Trusted-time presentation

Station/dashboard state should expose where useful:

- current time source;
- last trusted comparison;
- freshness/confidence;
- drift/conflict warning; and
- whether time is locally estimated rather than currently verified.

Simulated/test/local fixture time must never be labeled as observed GNSS or Internet time.

## Position trust and privacy boundary

The Station may maintain a private best-known vessel/navigation position for operations such as:

- emergency OMail;
- applicable geographic/regulatory policy;
- regional service/discovery; and
- Station diagnostics.

This does not grant permission to publish a person's location to contacts.

Personal/contact location remains separately consensual, purpose-limited, freshness-bounded, revocable, and subject to the rules in `location-vessels-and-contacts.md`.

## Offline user changes and conflicts

Contacts, calendar entries, account settings, and other user-originated data may change locally while disconnected.

The Station/client should preserve local changes durably and synchronize them later rather than requiring RF simply to maintain every server-side convenience state.

When multiple independently edited versions conflict during later Server reconciliation:

- do not silently discard meaningful user work;
- surface the local and authoritative/remote versions when automatic resolution is unsafe;
- permit an explicit user choice where appropriate; and
- use field-level automatic merge only for fields/domains with well-defined safe conflict rules.

Exact merge algorithms are domain-specific and should not be invented generically.

## Deferred security-critical operations

Not every Server operation is safe to queue indefinitely.

Operations such as password/recovery changes, account deletion, ownership transfer, high-impact authorization changes, or security-factor changes may require:

- fresh authentication;
- signed deferred authorization with bounded lifetime;
- direct Server contact; or
- another stronger workflow.

Each operation must explicitly define its disconnected authorization semantics before being enabled through deferred Station synchronization.

## Device and role authorization

Device trust and user/Station role authorization are separate.

A previously paired laptop does not become an administrator merely because the device is known to the Station. Administrative actions require an authenticated user whose current role authorizes the operation.

Revocation/role changes may reach disconnected Stations later; their behavior during stale authorization windows requires explicit policy and should fail conservatively for high-impact operations.

## Geographic/regulatory profiles

OceanMail may maintain compact signed policy profiles describing rules relevant to configured communications paths in different locations/jurisdictions.

Potential profile content includes constraints concerning:

- radio service/band usage;
- operator/vessel licensing assumptions;
- amateur versus maritime service applicability;
- modem/mode restrictions;
- unattended operation;
- encryption/confidentiality restrictions;
- power/bandwidth restrictions;
- commercial-content restrictions; and
- emergency-routing/jurisdiction metadata.

The Station may select applicable profiles using its best-known position and configured station/radio context.

These profiles are an operational aid, not a substitute for operator responsibility, official licensing information, or applicable law.

## Policy freshness and failure

Regulatory/policy state should carry version/freshness information.

If a required profile is missing, stale beyond an allowed policy horizon, or conflicts with another trusted source, the Station should expose that state and apply a conservative configured behavior rather than silently assuming permission.

The exact fail-open/fail-closed rule may vary by operation and jurisdiction; high-risk transmit behavior should not be authorized solely from clearly invalid policy data.

## Distribution priority

[Project ADR-008](https://github.com/OceanMail/oceanmail-project/blob/main/docs/decisions/ADR-008-four-band-scheduling-and-channel-use.md) permits authenticated Server designation of urgent shared updates, including security updates or piracy notices, as Band 1 rather than ordinary Band 3 broadcast. Validate authority, scope, and freshness before honoring promotion. It remains subject to the normal Band 1 cap and is neither Band 0 Emergency nor full-lease route establishment. The following distribution examples do not create sender-selectable priority classes.

Possible distribution classes include:

- critical constrained-link micro-update;
- important limited update;
- local/one-hop update where supported; and
- Internet-preferred/Internet-only bulk update.

The exact transport mechanism is owned by the Station/upstream stack. OceanMail does not create a second routing protocol solely for policy distribution.

## Observable transports and confidentiality

Radio and other shared media may be passively observed.

OceanMail must report the security actually provided by the current path/profile and must not imply confidentiality merely because an item is addressed to one recipient.

Where lawful and technically supported, established cryptographic mechanisms should be preferred over custom cryptography. Where a service/radio context prohibits encryption, the product must not silently violate that constraint.

Integrity/authentication and confidentiality are distinct requirements; public/observable traffic may still need strong identity/integrity protection.

## Updates and signatures

Server-distributed security, regulatory, revocation, or emergency-routing policy should be authenticated/signed so disconnected Stations can validate it without trusting an arbitrary local network peer.

Key distribution/rotation/recovery details remain an open security design area.

## Ownership

- **Client:** user authentication UX, conflict presentation, security warnings.
- **Station:** trusted-time/position observations, local authorization enforcement, cached signed policy, conservative disconnected operation, pending changes.
- **Server:** authoritative account/security state, signing/distribution of service policy, revocation, conflict authority where applicable.
- **Operator:** remains responsible for lawful radio operation; OceanMail policy assistance does not replace licensing/regulatory obligations.
