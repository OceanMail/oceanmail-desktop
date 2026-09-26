# Station API Contract Gaps

This is an implementation-tracking note for OceanMail Desktop, not a product decision. It
records which Station API capabilities the desktop client boundary
(`extension/station/station-client.js`) needs but that `oceanmail-station` does not expose
yet. Current baseline: Station main includes accepted Phase 4I, the merged Available/account-authorization foundation from PR #26, and the merged Debian trixie/Dovecot 2.4 writable-IMAP compatibility proof from PR #25 (`51869c31e8f80aa32d0abad1747c32ab07e0fd5d`). The linked foundation contract specifies required behavior, not capabilities already shipped.

## Available logical contract and ownership

The [Available manifest and account authorization boundary](https://github.com/OceanMail/oceanmail-station-archive/blob/7a132b6ea4967c600dc8c673718d00b09c3ad42b/docs/AVAILABLE_MANIFEST_ACCOUNT_CONTRACT.md) is the merged Station contract from PR #26. It defines logical operations/state only; endpoint URLs, authentication, wire encoding, concrete cryptography and synchronization/transport mapping remain separate design work. No Desktop production code changes in this foundation tranche.

Available is recipient-private metadata about content at another authoritative holder **before constrained-link payload transfer**. It is not an IMAP folder, already-downloaded mailbox content, outbound Postfix history, or client-side filtering. Client presents intent/approval. When a recipient Station exists, that Station authenticates principals, enforces account grants and durably owns recipient-visible availability, plans and local execution/progress. In accepted Station-less hosted/Lite direct-Internet operation, the hosted Server/service assumes the equivalent client-authentication, account-grant, durable-plan and hosted retrieval/synchronization responsibilities; Desktop must not invent a Station merely to fit one deployment model.

The remote holder is authoritative for existence/availability evidence **and** has a privacy obligation before disclosure: private sender/subject/component/representation metadata must be bound to the intended recipient/account and protected by holder-side authorization or equivalent end-to-end confidentiality before leaving the holder. Recipient-side authorization alone is insufficient if metadata was already disclosed to the wrong peer. The concrete peer/account cryptographic mechanism remains unselected.

Server remains authoritative for hosted mailbox/account availability, account/service policy and balances/credits; Internet ingress can originate hosted availability. A sender Station/native OMail holder can originate availability for decentralized boat-to-boat OMail without central infrastructure. Native availability must not depend on a central Server lookup and must not imply free/unlimited transfer or invented account grants.

Logical message ID, component ID and representation ID identify source-bound objects. Account ID is authorization scope. RFC Message-ID is correlation/interoperability evidence only; neither it, Thunderbird keys, email, subject, recipient, timing nor Postfix IDs grant access. The active recipient-side plan owner must authorize before returning sender/subject, component/representation sizes, availability, plan or budget metadata. Captain/Admin authority and Desktop filtering confer no personal mailbox access. Existing vessel-wide API reads must not bypass that boundary.

| Minimum logical operation | Missing foundation |
| --- | --- |
| List available manifest | Account-authorized and holder-protected metadata, provenance/freshness, logical identities and catalog revision; distinguish unknown/unavailable from authoritative empty. |
| Read current retrieval plan | Durable account-scoped body/component/representation choices, preferred order, hold/defer/resume, revision, eligibility/block reasons and approval state, owned by Station when present or hosted service in Station-less hosted mode. |
| Update retrieval plan | Account/object authorization, expected revision, current catalog/policy/budget validation, unique selected-work order, atomic durable acceptance and safe retries. Reject stale or unauthorized changes without partial mutation. |
| Read budget/accounting availability state | Known authoritative allowance/credit/policy and eventual local reservations/usage, or explicit unknown/unavailable; fail closed beyond known spend authorization. |

Message-level hold prevents new execution of body and selected components; component defer prevents that component's new execution. Resume revalidates grants/eligibility/spend. Durable accepted plans survive Desktop disconnect and the applicable plan-owner restart/failover model. Selection/order never proves actual retrieval, reservation, receipt or billing. Precise in-flight, reservation, source-trust, revocation and revision interactions remain prerequisites.

[Decision 0009](../../docs/decisions/0009-ordinary-mail-scheduling-and-importance.md) supersedes Station's older normal/Priority semantics: only Emergency and Ordinary exist. Important never affects RF/queue/relay precedence, gateway/path selection, quota/credits or automatic Available order. User payload order is a preference within Band 2's local-account share under [Project ADR-008](https://github.com/OceanMail/oceanmail-project/blob/main/docs/decisions/ADR-008-four-band-scheduling-and-channel-use.md); manifests are Band 1 and Emergency is Band 0. The four-band hierarchy supersedes the previous drafts. Capped control/route establishment, remaining-time ordinary local/relay service, unreserved broadcasts, negotiated channels, and byte/airtime accounting remain Station implementation work. Minimal Gateway keeps its name: ordinary fallback only for stranded/stalled traffic under Grid route/delay policy; Full normally offers ordinary third-party service, Off does not. Emergency remains eligible in all modes when technically, legally and operationally permitted. Reluctant relay uses Emergency, age/stall/failure and route/resource conditions.

A compact OceanMail control/synchronization mechanism must carry recipient-scoped metadata ahead of payload where the constrained path permits it while preserving the holder-side privacy boundary. No RFC-email-body manifest encoding or HERMES/Mercury/UUCP redesign is selected.

### Current Desktop limits remain explicit

All Available rows, representation sizes/times and budget inputs remain fixtures. Per-mount selections/holds/order/approval are in-memory. The planner is not a backend authorization or accounting service. [Planner hardening](AVAILABLE_PLANNER_HARDENING.md) now rejects malformed reorder permutations, includes attachment-only work, and clears all selected components on message hold. Local credit approval still neither reserves nor spends real allowance. Real operations require backend contract-driven implementation/validation, not promotion of fixture state to backend semantics. Do not invent balances or a proprietary Important field to replace fixture inputs.

### Station evidence dependencies

Phase 4I returned-receipt/Message-ID evidence is accepted on Station `main`; its `lab_peer_transport_unverified` receipt trust does not supply account authorization, holder identity, or remote manifest confidentiality. Station PR #25 is also merged and proves the post-transfer Debian trixie/Dovecot 2.4 authenticated writable-IMAP path, including a non-mutating `BODY.PEEK[]` retrieval followed by an explicit `\Seen` state transition. That post-transfer mailbox proof is not pre-transfer Available and does not satisfy the Available authorization model. A nondeterministic Phase 4I attempt-snapshot readiness race observed during final PR #25 reconciliation was corrected by merged Station PR #47, closing issue #42 after current-base Phase 4I run `35559385475` passed. The correction preserves the accepted evidence semantics.

## What the Station exposes today (loopback-only, no authentication)

Pending bounded integration: [Station PR #48](https://github.com/OceanMail/oceanmail-station-archive/pull/48)
adds protected laboratory auth-context endpoints only. Desktop has an explicit
opt-in [Phase 4J adapter](PHASE4J_AUTH_INTEGRATION.md) for that contract, with
runtime credentials and identity/account response validation. It is not normal
UI provisioning, production authentication, or a replacement for Available
fixtures. The legacy observation API and the gaps below remain unchanged.

- `GET /api/v1/health`
- `GET /api/v1/station`
- `GET /api/v1/queues/outbound`
- `GET /api/v1/queues/outbound/history`
- `GET /api/v1/queues/outbound/observer`
- `GET /api/v1/security/storage`

These are real Postfix-queue observation/evidence endpoints. None of them represent
OceanMail-specific product concepts (Available/Manifest, budgets, accounts) yet.

## Required and not yet available

| Capability | Needed by | Notes |
|---|---|---|
| Authenticated Station API access | all Station-backed capabilities below | `oceanmail-station` remains loopback-only and unauthenticated for current laboratory observation APIs; `design/client-connectivity.md` and `ARCHITECTURE.md` require a permission-scoped authenticated API before private/account-scoped Station capabilities can be real. Station-less hosted/Lite client authorization belongs to the hosted Server/service rather than a nonexistent Station. |
| Available OMail / retrieval manifest | `design/mail-transfer-and-retrieval.md` | See the logical contract above: holder-protected pre-transfer metadata with account grants, source-bound identities, components/representations and explicit unknown estimates. |
| Selective retrieval ordering | `design/mail-transfer-and-retrieval.md` | Read/update durable revision-protected account plans; selection, ordering, hold and representation intent are receive-side preferences, not a transport Priority class. |
| OMail compose submission (with transport class) | `design/client-user-experience.md` | Needs a submission endpoint distinct from raw SMTP where OceanMail-specific fields such as Emergency/Ordinary semantics and budget authorization must be preserved. `Important` is ordinary interoperable email metadata, not a proprietary OceanMail transport field. |
| Send/receive budget state | `design/scheduling-budgets-and-priority.md` | Server-authoritative hosted balances/policy, eventual Station reservations/usage where applicable, and explicit unknown/unavailable state; no fixture balances or unapproved spending. |
| Emergency OMail submission | `design/emergency-behavior.md` | Needs offline-authorized submission path independent of ordinary budget/queue rules. |
| Station/Grid/link status beyond queue observer | `design/client-user-experience.md` (persistent status surface) | Current observer endpoint only reports Postfix polling health, not link/Grid state. |
| Outbound queue mutation (cancel/hold/retry) | Sent-status view | `GET /api/v1/station` reports `capabilities.queue_mutation: false` today; the Sent-status view reads this real flag and disables mutating actions on real rows rather than faking them. |
| Per-message Station evidence correlation (Message-ID-style key) | native "OceanMail Status" Sent-list column | Phase 4I proves internal Message-ID/observation/Taylor-job correlation in the Station laboratory evidence chain, but Desktop still has no authenticated account-scoped API operation that safely binds a specific user's Sent message to that evidence. Do not substitute subject matching or expose vessel-wide evidence. |
| Per-account filtering of outbound queue history | Sent-status view | `/api/v1/queues/outbound/history` is vessel-wide (Postfix-wide), with no account/recipient filter. Account-scoped Desktop views must not display those rows as user-private evidence until Station exposes an authenticated account-scoped boundary. |
| Regional/operational dataset version | Dashboard | No registry/version endpoint exists yet; the Dashboard shows this as an explicit placeholder gap rather than a fabricated value. |
| Server/mailbox retention API (explicit "retained" flag, expiry/oldest-first cleanup policy) | Saved folder | OceanMail's product model requires ordinary mail cleanup under storage pressure while explicitly retained mail is exempt. Moving a message into the real `Saved` IMAP folder is the current client mechanism; the retention enforcement/guarantee remains Server/mailbox-infrastructure work. |

**Superseded (see docs/MAIL_MODEL_CORRECTION.md):** the earlier user-initiated Normal/Priority reprioritization gap no longer applies. Emergency is a distinct submission path and ordinary traffic has no sender-selectable transport priority class.

## Why this file exists

`docs/OPEN-QUESTIONS.md` is for product/architecture questions, not implementation-tracking punch lists. This file is deliberately scoped to "what does `station-client.js` call today, and what is it blocked on" so the client bootstrap does not silently invent Station behavior. Update it as Station/Server capabilities become real, and remove entries only when the corresponding authenticated/authorized contract actually ships and the client calls it truthfully.
