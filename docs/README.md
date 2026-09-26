# OceanMail Desktop Documentation

This directory is authoritative for **Desktop/client-specific product and implementation documentation** for OceanMail 0.2.

Organization-level definition, architecture, cross-repository decisions, terminology, repository inventory, workstreams, and AI/contributor workflow are authoritative in [`OceanMail/oceanmail-project`](https://github.com/OceanMail/oceanmail-project).

Git is authoritative. Chat discussions and agent assumptions do not become accepted product policy until recorded in the appropriate authoritative repository.

## Local authority and precedence

For Desktop/client work, use this order:

1. organization-level decisions/architecture in `OceanMail/oceanmail-project`;
2. accepted numbered Desktop decisions in `decisions/`, except where explicitly superseded by project-level ADRs/decisions;
3. current Desktop `ARCHITECTURE.md`, `SCOPE.md`, and accepted documents in `design/`;
4. `DESIGN-PRINCIPLES.md`;
5. `ROADMAP.md`;
6. `OPEN-QUESTIONS.md`;
7. `WISHLIST.md`, research, component-local implementation evidence/work reports, and migration/history material.

The authority portion of Decision 0001 that made this repository the program-wide documentation home is superseded by `oceanmail-project/docs/decisions/ADR-001-project-documentation-authority.md`. The remaining accepted Desktop/product decisions continue to preserve rationale unless separately superseded.

## Repository boundaries

- `OceanMail/oceanmail-project` — organization-level project/architecture authority.
- `OceanMail/oceanmail-desktop` — Desktop/client implementation and client-specific behavior/docs.
- `OceanMail/oceanmail-station` — Station service, HERMES/Mercury integration, Station APIs/state/evidence and Grid/control implementation.
- `OceanMail/oceanmail-server` — hosted service and Internet-mail application boundary.
- `OceanMail/oceanmail-infrastructure` — deployment/operations.

## Normal Desktop reading order

1. central project spine (`PROJECT.md`, `CURRENT_STATE.md`, `DECISIONS.md`, `REPOSITORIES.md`, `workstreams/desktop.md`)
2. root `AGENTS.md`
3. `SCOPE.md`
4. `DESIGN-PRINCIPLES.md`
5. `ARCHITECTURE.md`
6. `decisions/README.md`
7. relevant `design/` documents
8. `ROADMAP.md`, `OPEN-QUESTIONS.md`, `WISHLIST.md` as needed

`research/` and `migration/` are evidence/history unless a current task specifically depends on them. Desktop-local implementation evidence and historical work reports live under `../desktop/docs/`; see `../desktop/docs/README.md` for their status and reading guidance.

## Key current Desktop documents

- `ARCHITECTURE.md` — Desktop/client system shape and relationship to Station/Server.
- `SCOPE.md` — historical/current 0.2 scope source; organization-wide ownership statements defer to the central spine.
- `DESIGN-PRINCIPLES.md` — durable product/client tradeoff rules.
- `decisions/README.md` — accepted Desktop/product decision index.
- `ROADMAP.md` — implementation sequence, not permanent architecture.
- `OPEN-QUESTIONS.md` — unresolved Desktop/product questions.
- `WISHLIST.md` — non-committed ideas.

Important accepted design material remains under `design/`, including client connectivity/UX, Station user/management expectations, mail lifecycle/receipts, transfer/retrieval, scheduling, service policy, Emergency behavior, accounts/identity/privacy, location, contacts/calendar, chat, interoperability, gateway/relay direction, and accessibility/presentation.

## Implementation evidence

Implementation-specific Desktop/Thunderbird evidence is under `../desktop/docs/`, including Thunderbird baseline, Station compatibility/API-gap evidence, mail-model corrections, tranche progress, and UI review material. That directory contains both current implementation references and historical execution records; its `README.md` identifies which is which.

Implementation evidence does not override accepted product/architecture authority above. When an implementation record conflicts with a current decision or design document, preserve the historical evidence but follow and reconcile against the newer authoritative source.

## Migration/history rule

OceanMail 0.1 remains historical source material. Carry useful requirements, UX lessons, behavior, security constraints, and rationale forward only after reconciling them against current 0.2 architecture. Do not reintroduce BEMPIC/M4P transport assumptions from historical documents.

## Decision rule

When a Desktop change alters organization-wide architecture, terminology, a cross-component contract, or settled project semantics, update the central project spine as well as the relevant Desktop documentation.