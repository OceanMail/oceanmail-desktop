# Decision 0001 — Documentation and Repository Authority

- **Status:** Superseded in its program-authority assignment by `OceanMail/oceanmail-project/docs/decisions/ADR-001-project-documentation-authority.md`
- **Originally accepted:** 2026-09-03
- **Superseded:** 2026-09-11

## Historical context

OceanMail 0.1 accumulated valuable product decisions but also developed a large flat documentation set with overlapping architecture, roadmap, feature, wishlist, and dated decision files. OceanMail 0.2 also separated Client, Station, Server, and Infrastructure repositories, so cross-repository product policy required a single durable home.

At the start of the 0.2 generation, this Desktop/client repository temporarily served that role.

## Historical decision

The original decision made `OceanMail/oceanmail-desktop` the authoritative home for program-level product documentation and cross-repository architecture while component repositories remained authoritative for implementation-specific work.

That **program-authority assignment is no longer current**.

As of 2026-09-11, organization-level definition, architecture, shared terminology, repository inventory, cross-repository decisions, current project state, workstreams, and AI/contributor governance are authoritative in [`OceanMail/oceanmail-project`](https://github.com/OceanMail/oceanmail-project).

`OceanMail/oceanmail-desktop` remains authoritative for Desktop/client source code and Desktop/client-specific implementation and product documentation.

## What remains valid from this decision

The following principles remain active and were carried into the project spine:

- one organization-level home should own cross-repository truth;
- component repositories own their implementation-specific architecture/operations;
- significant decisions preserve rationale and supersession history;
- research/work reports do not silently become architecture;
- OceanMail 0.1 material is selectively reconciled rather than copied wholesale.

## Supersession

See `OceanMail/oceanmail-project/docs/decisions/ADR-001-project-documentation-authority.md` for the current authority model.