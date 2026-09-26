# OceanMail Desktop Interface Inheritance

Current translation authority: [Decision 0009](../decisions/0009-ordinary-mail-scheduling-and-importance.md) supersedes the historical Priority scheduler described below. [Mail model correction](../../desktop/docs/MAIL_MODEL_CORRECTION.md) supersedes historical Outbox presentation: there is no user-facing OceanMail Outbox. Available is account-scoped metadata before transfer under the [Station logical contract](https://github.com/OceanMail/oceanmail-station-archive/blob/9bed63fc56cbede78a03bcc7ca3f64123045ca3b/docs/AVAILABLE_MANIFEST_ACCOUNT_CONTRACT.md). Prototype descriptions are history, not permission to restore removed controls.

- **Status:** Accepted 0.2 design guide
- **Implementation authority:** Decisions 0005 and 0006 plus current 0.2 domain designs
- **Historical UX source:** `OceanMail/oceanmail-0.1-prototype`

## Purpose

OceanMail 0.1 contains the most complete evaluated expression of the intended Desktop experience. OceanMail 0.2 changed the communications architecture, not the product need for a clear maritime communications client.

This document tells Desktop implementers what to preserve from the 0.1 prototype and how to realize it on Thunderbird without rebuilding mature mail-client functionality.

Current 0.2 decisions always override historical implementation assumptions.

## Design rule

Use three categories when translating the prototype:

1. **Reuse Thunderbird natively** — ordinary email-client behavior Thunderbird already provides well.
2. **Own in OceanMail UI** — constrained-link, Station, Grid, budget, availability, evidence, and Emergency concepts Thunderbird does not model.
3. **Defer** — accepted product areas not yet important enough to distract from making Mail and Station excellent.

Do not reproduce the old egui widget tree merely because a screenshot looked a certain way. Preserve the workflow, hierarchy, information, and operator decisions.

## Application shell

### Carry forward

- Modern light-blue OceanMail identity.
- Required dark/night mode.
- Information-dense desktop UI suitable for serious maritime use without looking like a radio terminal.
- Persistent far-left primary navigation.
- Expanded mode: icon + text.
- Collapsed mode: compact icons while retaining accessible names, keyboard focus, tooltips, and equivalent activation.
- Navigation expansion preference persists.
- Compact/watch presentation is distinct from navigation collapse.
- Settings remains separate from primary communications areas.

### Primary areas

Preserve the information architecture:

- Mail
- Calendar
- Contacts
- Chat
- Station

For current implementation, Mail and Station/status are the active priorities. Calendar, Contacts, and Chat may exist as coherent future destinations/placeholders without consuming major implementation time yet.

### Thunderbird mapping

The OceanMail Space is the primary application shell. Thunderbird's generic Spaces/account-management interface should not dominate the normal packaged product.

Native Thunderbird mail tabs/windows may open from OceanMail navigation when that is the supported way to reuse Thunderbird's message list, reader, search, or compose functionality.

## Mail information architecture

The OceanMail mail experience should visibly preserve these first-class destinations:

- Inbox
- Available
- Saved
- Sent
- Drafts where useful
- Trash
- Compose

There is no user-facing OceanMail Outbox. Once ordinary mail is submitted, Station owns durable queueing, retries, transport attempts and delivery/receipt evidence. User-facing status belongs with the native Sent message and Station operational surfaces rather than in a Desktop-owned Outbox destination.

Avoid adding gratuitous folders, labels, filters, or duplicate navigation simply because Thunderbird supports them. Thunderbird's underlying folder machinery can exist without making the OceanMail UI resemble a generic enterprise mailbox.

### Context actions

Message-reading actions belong with the selected/read message. Preserve the owner refinement that actions such as Reply, Forward, retain/delete/trash, and other object-specific actions appear as context actions rather than duplicating destinations already present in navigation.

Reuse Thunderbird's native Reply/Reply All/Forward behavior and rendering whenever possible.

## Inbox

### Product behavior

Inbox contains content actually local/received for the user. Do not mix remote-only `Available` metadata into Inbox as though the message body had already arrived.

Normal reading, threading, reply, forward, search, attachments already local, and accessibility should come from Thunderbird where possible.

### Thunderbird mapping

Prefer opening or presenting the actual native Thunderbird Inbox/mail tab for the provisioned OceanMail account rather than building an HTML imitation.

OceanMail overlays/adjacent surfaces may add evidence, Important metadata, constrained-transfer, or Station-specific status Thunderbird does not know about.

## Available

`Available` is one of the defining OceanMail concepts and remains OceanMail-owned UI.

### Carry forward

- Manifest/metadata only; no remote message body or body preview.
- Sender, subject, body size, attachment presence/type, representation options, freshness/available time, and relevant cost/time information.
- Multiple simultaneous selections.
- Explicit hold/defer.
- User-controlled ordering where policy allows.
- Recipient-controlled earlier/later ordering of selected items.
- Immediate recalculation when selection, order, or representation changes.
- Aggregate selected bytes.
- Approximate transfer time.
- Receive allowance/budget effect.
- Additional credit/cost authorization where applicable.
- Clear reason an item is blocked/ineligible/already local.
- Text body may be selected independently from deferred attachments.
- Images/other degradable attachments expose useful quality/size choices.

### Current 0.2 correction

Do **not** restore the 0.1 automatic-small-message constrained-link rule. Current 0.2 requires recipient approval/selection for ordinary constrained-link OMail regardless of size.

When inexpensive ordinary Internet is available, permitted synchronization may proceed automatically according to current service/user policy.

### Thunderbird mapping

This is an account-scoped native-Mail view driven by authorized recipient Station state, as required by Decision 0008; it is not a top-level Space. Do not create a fake IMAP `Available` folder merely to make Thunderbird understand it.

When selected content becomes local, normal Thunderbird mailbox behavior can take over.

## Manifest / retrieval planner

Available and Manifest may be separate views or two modes of one coherent workflow, but preserve the prototype's planning function.

A user should be able to understand, before committing constrained resources:

- what will move;
- in what order;
- how many bytes;
- approximate time;
- expected accounting/budget effect;
- what representation will be retrieved; and
- what will remain deferred.

Selection/planning is not proof of billing, receipt, or delivery. Estimates must be visibly estimates.

## Compose

### Carry forward

OMail compose should feel like modern email with a concise telegram/radiogram character rather than a radio configuration form.

The user deals with:

- recipients;
- subject;
- plain-text OMail body;
- Ordinary mail and separate authorized Emergency behavior;
- attachments and representation choices;
- expected bytes/time;
- send-budget effect; and
- queue/submission semantics.

The user should not normally select modem, frequency, RF protocol, gateway path, or routing internals.

A queue-oriented action such as `Queue OMail` is preferable when the actual operation is durable acceptance by the local Station rather than immediate remote delivery.

The composer should make current planning effects visible without pretending estimates are authoritative service accounting.

### Thunderbird mapping

Reuse Thunderbird's native compose editor, addressing, contacts, Drafts, reply/forward construction, spelling/editing, and attachment mechanics where they fit.

OceanMail should add constrained-mail controls around native compose rather than write a second editor.

The implementation may use MailExtension compose APIs, extension-owned panels/actions, or a narrowly scoped Experiment capability when necessary, subject to Decisions 0005/0006.

## Class and scheduler presentation

Distinguish traffic direction, Emergency/Ordinary transport class and conventional Important metadata. Important never changes scheduling or automatic retrieval order.

Useful row information includes:

- OUTGOING / INCOMING / RECEIVING text;
- non-color-only arrow/icon direction;
- Emergency/Ordinary;
- state;
- transferred/total bytes;
- progress;
- approximate ETA; and
- valid next action.

The historical base scheduler presentation ordered Emergency first, then outgoing Priority, incoming Priority, outgoing Normal, incoming Normal. That historical ordering is superseded by Decision 0009. Current Station/service scheduling remains authoritative and Desktop must not reintroduce ordinary user-selectable Priority controls.

## Sent and delivery evidence

Sent remains the user's native message record, augmented with truthful Station-derived transport/delivery evidence where correlation exists.

Never collapse these concepts into a generic `Sent` flag when evidence distinguishes them:

- queued/local accepted;
- waiting/blocked;
- transmitting;
- transmitted;
- remotely/application accepted;
- delivered under the applicable profile;
- rejected/failed;
- cancelled; and
- unknown/unconfirmed.

Pause/budget-block state is separate from underlying lifecycle stage.

A transmitted timestamp does not become a receipt/delivery timestamp. Application delivery is not a human read receipt.

### Thunderbird mapping

Thunderbird's real Sent folder stores/presents the message object. OceanMail augments that native folder/message list with Station/evidence state only when it can do so truthfully. If a message cannot be correlated to Station evidence, the UI says so explicitly rather than inventing a state.

Vessel-wide queue/traffic management remains in Station operational surfaces. It must not leak into one user's account-scoped Sent view merely to replace the removed Outbox concept.

## Emergency

Preserve the owner's intent that Emergency be visually prominent, quickly reachable, and independent of ordinary mailbox navigation/collapse.

The 0.1 prototype used a large distinct Emergency action. The exact chrome may adapt to Thunderbird, but Emergency must not become a buried menu item.

Emergency compose/confirmation follows current `emergency-behavior.md`, including the boundary that OceanMail does not replace regulated maritime distress systems.

Do not add a generic `make this emergency` override to Available OMail retrieval; incoming Emergency behavior is governed by system policy.

## Persistent communications status

This is a defining part of the Desktop experience.

### Carry forward

A persistent high-level surface conceptually includes:

- Internet state;
- Station connectivity;
- radio/link state where known;
- Grid freshness / last useful contact;
- queued/active work;
- progress;
- send/receive budget state;
- relevant gateway/relay state; and
- warnings.

Use freshness such as `last contacted 7m` rather than falsely implying a permanently connected Grid.

The surface is keyboard accessible and opens a richer Dashboard.

### Thunderbird mapping

A stable OceanMail-owned status surface inside the OceanMail Space is sufficient; modifying Thunderbird's global native bottom chrome is not required if it would create fragile internals/platform differences.

Where supported, a small persistent OceanMail toolbar/badge outside the Space may expose urgent/high-value state without duplicating the full Dashboard.

## Dashboard

Preserve the prototype idea that the status surface opens a practical operational Dashboard before exposing diagnostics.

Candidate summary information:

- current paths/connectivity;
- Grid/Station freshness;
- queue/progress;
- budgets/credits;
- trusted-time confidence;
- consensual location state where relevant;
- account synchronization;
- regional/operational data versions;
- warnings; and
- recent Station health.

Do not fabricate observations. Seeded/demo data must remain visibly fixture/demo data.

## Station

Station is the primary location for deeper communications management and network visibility.

Historical candidate sections remain useful as an information-architecture guide:

- Overview
- Connections
- Radio
- Network/Grid
- Gateways
- Queue
- Traffic
- Diagnostics
- Identity

Current Station APIs/web management own the business logic.

### Carry forward owner refinements

- Show current/applied regional data version separately from available version.
- Preserve update/history visibility including reversals/voided records where the current authoritative data model supports it.
- Do not enable a gateway control when the Station is not actually eligible/connected merely to make the UI interactive.
- Use `Grid`, not `mesh`, in user-facing product copy.

## Account lock/privacy on shared installations

Preserve the product semantics, adapted to the current autonomous Station/client model:

- multiple onboard OceanMail identities may be visible within the broader vessel experience;
- a locked/logged-out account may expose minimal identity/locked/new-count state while protecting sender/subject/body/calendar/contact content;
- background Station work continues while the user's client/account is locked;
- sending as the user or reading protected content requires appropriate authentication;
- Station administrative authority does not silently grant mailbox-reading authority.

Do not assume Thunderbird's profile lock or master password is sufficient to implement these OceanMail user/Station semantics; authentication design remains explicit OceanMail work.

## Trash / removal truthfulness

Deletion/trash should remain a local action until synchronization/reconciliation proves the corresponding authoritative state where relevant. Do not claim remote deletion simply because Thunderbird moved a local message to Trash.

The exact IMAP/server behavior will be integrated with current mailbox/account designs, but the UX should preserve the broader rule: local action is not remote proof.

## Background behavior and notifications

Preserve:

- sending/receiving/synchronization should not steal focus;
- progress becomes visible when meaningful;
- routine link churn should not create disruptive notification noise;
- Emergency/emergency-weather behavior may intentionally interrupt;
- notification categories/sounds should be configurable with visual equivalents.

## Compact/watch mode

Desktop should eventually offer a compact underway/watch presentation emphasizing:

- Grid/Station freshness;
- Available/new OMail;
- queued/active Station work;
- active transfer/progress;
- radio/Internet state; and
- OChat activity when Chat is implemented.

This is not the same feature as collapsing the navigation rail.

## Accessibility

Carry forward the 0.1 requirement that information never depend on color alone.

At minimum:

- accessible names;
- keyboard focus;
- keyboard activation;
- useful tooltips for icon-only controls;
- text/icon direction indicators;
- scalable text;
- dark/night support; and
- screen-reader-compatible semantic structure.

Thunderbird-native UI should be preferred where it provides stronger platform accessibility than a custom imitation.

## Path/security disclosure

The historical 0.1 blanket public-radio notice is not carried forward literally for every OMail path.

Current rule: disclose confidentiality/observability according to the actual path/security profile and evidence. RF/shared-radio contexts should not imply confidentiality unless a lawful supported profile provides it; Internet/security-capable paths may legitimately have different status.

OChat's currently accepted initial radio model remains public/observable.

## Calendar, Contacts, Chat, location

These remain part of the product design heritage but are not part of the immediate Desktop implementation tranche.

When promoted later, consult the corresponding current 0.2 design documents plus the 0.1 audit for interaction details.

Do not begin mobile work as a shortcut for these areas.

## Cross-platform implementation rule

Every Desktop interface tranche should be reviewed for Windows/macOS/Linux portability.

Prefer shared extension code. Platform-specific differences should be isolated to packaging/integration adapters and documented explicitly.

The extension should remain installable/testable in compatible stock Thunderbird on all three desktop operating systems where Thunderbird permits it, even though the released OceanMail Desktop product remains a separately packaged/branded application.
