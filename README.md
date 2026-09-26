# OceanMail Desktop

OceanMail Desktop is the active desktop client for OceanMail 0.2, the maritime communications product built around the HERMES/Mercury ecosystem rather than a clean-sheet HF stack.

## Authority and scope

Organization-level OceanMail definition, architecture, cross-repository decisions, terminology, repository inventory, and current project state are authoritative in [`OceanMail/oceanmail-project`](https://github.com/OceanMail/oceanmail-project).

This repository owns the Desktop/client implementation and client-specific product/implementation documentation. It does **not** own the HF modem, generic radio control, HERMES transport internals, hosted server implementation, deployment infrastructure, or organization-wide documentation authority.

Start with root [`AGENTS.md`](AGENTS.md), then [`docs/README.md`](docs/README.md) and the central [`workstreams/desktop.md`](https://github.com/OceanMail/oceanmail-project/blob/main/workstreams/desktop.md).

## Current direction

```text
OceanMail Desktop
    -> direct OceanMail Server access when appropriate
    -> OceanMail Station when local/constrained communications are needed
    -> HERMES-derived communications
    -> Mercury / VARA / ARDOP / PACTOR / IP as supported
    -> OceanMail Server / authorized Internet-mail boundary
    -> conventional Internet email/services
```

The Station is autonomous and may run headless while multiple clients use it over a vessel/local network.

## Client foundation

OceanMail Desktop is built on Thunderbird as an implementation foundation rather than as a clean-sheet mail client or a conventional optional Thunderbird add-on.

For the 0.x line, the intended product is a dedicated OceanMail application package containing a pinned Thunderbird base, mandatory OceanMail extension, OceanMail-owned behavior/views, branding/theme, managed configuration/policies, and a dedicated OceanMail profile. General-purpose arbitrary Gmail/Outlook/IMAP account setup remains outside the current supported OceanMail Desktop experience.

Thunderbird supplies mature mail mechanics such as SMTP/IMAP, MIME, rendering, compose/reply/forward, folders, search, contacts/calendar foundations, and platform integration. OceanMail owns constrained-link presentation and behavior including Available, selective retrieval, representation choices, truthful delivery evidence, Station/Grid status, budgets/accounting presentation, Emergency behavior, and later OChat.

Current Desktop shell/behavior decisions are indexed in [`docs/decisions/README.md`](docs/decisions/README.md). Cross-repository authority portions of older Desktop decisions are superseded by the project-spine authority ADR; client/product decisions remain valid unless separately superseded.

## Communications foundation

HERMES/Mercury work is upstream-first. OceanMail-specific code should remain separate unless a durable downstream fork is technically necessary and deliberately accepted.

BEMPIC development is frozen and M4P integration is tabled. Neither is on the OceanMail 0.2 critical path.

## Documentation

[`docs/README.md`](docs/README.md) indexes current Desktop/client product documentation and its historical decision sources. Implementation-specific evidence also lives under `desktop/docs/`.

## Current milestone

Connect and refine the real Thunderbird-based OceanMail Desktop against authenticated account-scoped Station capabilities while preserving strict stock-Thunderbird coexistence and truthful representation of unavailable/unimplemented Station evidence.

## Repository family

- `OceanMail/oceanmail-project` — organization-level project memory and architecture
- `OceanMail/oceanmail-desktop` — Desktop/client
- `OceanMail/oceanmail-station` — onboard/edge Station
- `OceanMail/oceanmail-server` — hosted service / Internet-mail application boundary
- `OceanMail/oceanmail-infrastructure` — deployment and operations

All five active components are public with installed licenses. Server and Infrastructure are bootstraps, not deployed production services.

## Source publication and licenses

See [PUBLICATION.md](PUBLICATION.md) for the fresh-history boundary and historical evidence limitations. OceanMail-owned code uses **AGPL-3.0-only**; documentation uses **CC-BY-SA-4.0**. See [LICENSING.md](LICENSING.md), [LICENSE](LICENSE), and [LICENSE-DOCS](LICENSE-DOCS). Third-party terms remain unchanged.
