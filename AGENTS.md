# OceanMail Desktop — Agent Instructions

These repository-local instructions apply to implementation agents working in `OceanMail/oceanmail-desktop`.

## Organization authority

Git/GitHub are durable project memory. Organization-level OceanMail definition, architecture, terminology, repository inventory, cross-repository decisions, current project state, and AI/contributor workflow are authoritative in [`OceanMail/oceanmail-project`](https://github.com/OceanMail/oceanmail-project).

Before substantial Desktop work, read there in order:

1. `PROJECT.md`
2. `CURRENT_STATE.md`
3. `DECISIONS.md`
4. `REPOSITORIES.md`
5. `workstreams/desktop.md`
6. relevant project ADR/interface/terminology documents

Then read this repository's current Desktop documentation and source. Desktop-local implementation truth stays here; do not duplicate the project spine into this repository.

The organization role split and architecture-escalation process are defined by `oceanmail-project/AGENTS.md`. Do not silently change accepted architecture to make implementation easier.

## Desktop architectural invariants

- Thunderbird is the OceanMail Desktop foundation. Do not fork Thunderbird without explicit architecture approval.
- Thunderbird native chrome is the application shell; do not create a second primary navigation rail.
- Native Mail remains the mail foundation; modify/augment native behavior rather than recreating Inbox, message list, reader, compose, Drafts, or Sent.
- SMTP + IMAP remain the Desktop↔Station ordinary-mail boundary where accepted. IMAP does not cross the constrained/HF link.
- OceanMail must coexist with a separate stock Thunderbird installation/profile. Do not make machine-wide Thunderbird policy changes.
- Use the pinned Thunderbird build in `desktop/.vendor/` for development/integration work.

## Mail information architecture

For each OceanMail account, the primary Mail hierarchy is:

```text
Inbox
Available
Saved
Drafts
Sent
Trash
```

- There is no OceanMail user-facing Outbox.
- `Available` is account-scoped and is not an IMAP folder; it represents remote/manifest-only mail awaiting recipient retrieval choice.
- `Saved` is a real mailbox/IMAP folder where the current architecture supports it.
- `Sent` is native Sent augmented only with truthful Station-derived evidence when securely correlated.
- Never show vessel-wide queue evidence inside one user's account-scoped Sent view unless the API securely filters/correlates it for that account.
- Only explicitly provisioned/identified OceanMail accounts receive OceanMail-specific Mail modifications.

## Emergency, Ordinary, and Important

- Emergency is the only user-originated mail class that changes transport precedence.
- There is no user-selectable ordinary transport Priority class.
- `Important` is conventional/interoperable message metadata only and must not change RF/Station/relay precedence, gateway/path choice, credits/quota treatment, or automatic Available order.
- Available ordering is recipient retrieval intent within ordinary work; Station remains authoritative for actual scheduling/preemption.
- Emergency must never fall back to ordinary SMTP while being presented as real Emergency OMail.

## Evidence and Station/API boundaries

Never claim stronger evidence than the underlying source proves.

- Postfix disappearance is not RF transmission, remote acceptance, delivery, or read status.
- Do not derive delivery state from subject, recipient, timing, or demo matching.
- If a Sent message cannot be correlated to Station evidence, say so explicitly.
- `navigator.onLine` is not proof of verified Internet reachability.
- Fixture/demo data must be unmistakably identified.
- Do not invent missing Station APIs in Desktop.
- Current Station auth/permission scoping may be incomplete; do not treat loopback as authorization or expose private state through client-side filtering.

## Experiment API discipline

Prefer public Thunderbird/MailExtension APIs. A narrow pinned-build-aware Experiment API is acceptable only where required by accepted UX/architecture and no supported public API can implement it. Do not grow a narrow Experiment into a general chrome-control framework. Preserve deterministic cleanup where relevant.

## Testing

Separate evidence into:

```text
STATIC / UNIT
INTEGRATION
LIVE / PRODUCT
```

For normal Desktop changes run, as applicable:

```bash
cd desktop
npm test
npm run lint
```

Use the mail lab and pinned Thunderbird integration scripts when the task touches account/mail/GUI behavior. Real UI behavior requires live Thunderbird verification; CI is not a substitute.

### Visual QA workflow

For UI-affecting Desktop work, use this default review loop unless the task explicitly requires otherwise:

1. Codex performs first-pass visual QA by launching the pinned Thunderbird/OceanMail Desktop build and capturing the affected surfaces where practical.
2. Codex fixes obvious visual or interaction regressions before handoff.
3. ChatGPT independently reviews the implementation diff/CI and selected final screenshots or captures.
4. The owner is reserved for final product judgment, consequential UX decisions, and live behavior that cannot be established reliably from automated checks/screenshots.

Do not require the owner to manually review every minor visual change when the above evidence is sufficient. Conversely, screenshots do not replace live verification for interaction, timing, focus, platform, or other behavior that requires a running application.

## Git/handoff

Inspect branch, HEAD, open PRs, and repository state before changing code. Preserve unrelated work. Update component docs when behavior/contracts change, and update `OceanMail/oceanmail-project` when a change alters organization-level architecture, terminology, cross-component contracts, or settled semantics.

Return handoffs with exact branch/HEAD, files changed, STATIC/UNIT evidence, INTEGRATION evidence, LIVE/PRODUCT evidence, blockers, and PR/CI state. Follow the merge authority in the central project instructions.