# Decision 0009 — Ordinary-mail scheduling and importance

- **Status:** Accepted; five-band hierarchy superseded 2026-09-21 by Project ADR-008.
- **Date:** 2026-09-06
- **Supersedes:** the 0.1 user-visible `Priority` OMail class and Priority/Normal scheduler bands wherever they conflict with this decision. Emergency semantics remain intact.

## Current scheduling successor

[Project ADR-008](https://github.com/OceanMail/oceanmail-project/blob/main/docs/decisions/ADR-008-four-band-scheduling-and-channel-use.md) now defines Bands 0–3: Emergency and its control; control/manifests/Grid coordination and Server-promoted urgent updates; ordinary local/relay payload; shared background broadcasts. Initial leases are ten minutes with a four-minute normal Band 1 cap, a necessary route-establishment full-lease exception, remaining-time Band 2, and no Band 3 reservation. Ordinary payload is Band 2 under this new hierarchy; the matching number in the historical list below does not make that old hierarchy current.

The original five-band text below is retained as decision history, not current scheduler authority. This supersession does not change Emergency/Ordinary classes, Important-as-metadata, recipient intent, or fairness requirements.

## Context

OceanMail uses shared constrained radio capacity. A sender-selectable transport-priority class creates a predictable failure mode: users naturally mark personally important mail as Priority, credits or large quotas can amplify this behavior, and Priority traffic can crowd out ordinary traffic until the distinction loses meaning. This can happen without malicious abuse.

At the same time, users still need two distinct controls:

- a conventional `Important` marker for message meaning/display; and
- the ability to choose the retrieval/download order of their own messages waiting in `Available`.

Those controls should not grant extra RF precedence.

## Decision

### Emergency is the only user-originated mail class that changes transport precedence

Emergency OMail remains exceptional and retains the accepted Emergency workflow, precedence, safeguards, quota exceptions, accountability, and safety behavior.

Ordinary user mail has no sender-selectable `Priority` transport class.

### Important is metadata only

Ordinary mail may carry an `Important` flag.

`Important` may affect display, sorting/filtering, and later recipient-side notification behavior. It may map to conventional email importance metadata where appropriate.

`Important` must not change:

- RF scheduling precedence;
- Station queue precedence;
- relay precedence;
- user quota or credit treatment merely to obtain earlier airtime; or
- gateway/path selection.

Credits do not buy transport precedence for ordinary mail.

### Available retrieval order remains recipient-controlled

Within an account's `Available` pseudo-folder, the recipient may select which messages to retrieve, hold/defer items, choose permitted representations, and choose the preferred retrieval/download order of selected ordinary mail.

This is a receive-side retrieval preference, not a sender-selected transport-priority class. The Station should honor the requested order where practical within the applicable Station scheduling band, while remaining authoritative for actual link scheduling and preemption.

### Historical base Station scheduling hierarchy (superseded 2026-09-21)

The base Station scheduling hierarchy is:

1. **Emergency traffic**
2. **Station's own vessel/crew traffic**
3. **Required control / receipt / system traffic / Grid coordination**
4. **Relay traffic for other Stations**
5. **Background system / regional / jurisdiction / firmware data**

Band 2 includes ordinary inbound and outbound traffic belonging to accounts served by the Station, including account-specific `Available` retrieval work. The Station favors its own vessel/crew traffic over relay traffic.

Band 3 is for small operational traffic required for correct communications/network behavior, including receipts/acknowledgements and Grid coordination. It must not become a loophole for carrying large ordinary payloads ahead of user traffic.

Band 4 follows the accepted Eager/Reluctant relay model and uses capacity after local vessel/crew and required coordination traffic.

Band 5 includes software updates, regional/jurisdiction/regulatory data, DAT/operational files, configuration updates, firmware micro-updates, and similar background distribution. It is lowest priority, opportunistic, preemptible, and resumable where practical.

### Fairness within ordinary vessel/crew traffic

Within Band 2, do not expose transport-priority controls to ordinary users. The Station should use fair scheduling with age protection and sensible continuation rules so one account, one large message, or repeated fresh work does not indefinitely starve other local traffic. Exact scheduling weights remain Station implementation/policy, not Desktop user controls.

## Consequences

- Remove Normal/Priority selectors from ordinary Compose, Sent-status, and Available views.
- Remove `priority` as an ordinary message transport class from Desktop models/tests/fixtures.
- Preserve Emergency as a distinct transport class.
- Preserve recipient-controlled `Available` retrieval ordering.
- Preserve or add `Important` only as message metadata, visually independent from Station delivery state.
- Current 0.2 docs and Station API contract gaps must not request user reprioritization of already-submitted ordinary mail.
- Historical 0.1 documents remain unchanged as history; current 0.2 documentation records this supersession.
