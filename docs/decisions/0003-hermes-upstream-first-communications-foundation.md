# Decision 0003 — HERMES Upstream-First Communications Foundation

- **Status:** Accepted
- **Date:** 2026-09-03
- **Re-records:** the accepted 0.2 transition preserved in `oceanmail-0.1-prototype/docs/adr/0007-v0.2-hermes-transition.md`

## Context

OceanMail 0.1 used a clean-sheet communications stack centered on OceanMail -> BEMPIC -> M4P -> DataLink adapters. Review of the Rhizomatica HERMES ecosystem showed that substantial difficult communications work already exists upstream, including Mercury, UUCP/uucpd/uuxcomp integration, radio control, broadcast/FEC work, and modem/channel testing.

Rebuilding equivalent lower layers would delay real RF testing and duplicate maintained open-source work.

## Decision

OceanMail 0.2 is a HERMES-derived maritime product/service architecture rather than a clean-sheet HF communications stack.

The initial communications baseline is:

```text
OceanMail Client
    -> OceanMail Station
    -> HERMES UUCP/uucpd/uuxcomp
    -> Mercury preferred open HF modem
    -> HF / constrained link
```

Additional supported transports may include VARA, ARDOP, PACTOR, IP, and future adapters behind the Station boundary.

OceanMail should use and contribute to upstream projects directly where practical. Permanent forks require a concrete OceanMail requirement that cannot reasonably be satisfied upstream.

OceanMail does not independently own modem DSP, generic ARQ/FEC, generic UUCP behavior, radio-control internals, or channel simulation when maintained upstream components satisfy the need.

BEMPIC development remains frozen and M4P integration remains tabled. Neither is on the 0.2 critical path. They may be reconsidered only after direct measurement demonstrates material value or a missing capability.

Multi-hop maritime networking is evidence-gated: prove direct gateway email, then dynamic gateway selection, then evaluate vessel-to-vessel forwarding only if field measurements justify it.

## Consequences

- Product effort concentrates on Client, Station integration/policy/evidence, hosted service, and maritime-specific behavior.
- The first milestone is real store-forward email rather than a new protocol stack.
- 0.1 BEMPIC/M4P documents remain research/history rather than active authority.
- Future synchronization/network layers must justify their complexity against measured HERMES baseline behavior.