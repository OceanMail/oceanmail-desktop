# OMail Transfer and Retrieval

Normative logical boundary: [merged Available manifest and account authorization contract](https://github.com/OceanMail/oceanmail-station-archive/blob/7a132b6ea4967c600dc8c673718d00b09c3ad42b/docs/AVAILABLE_MANIFEST_ACCOUNT_CONTRACT.md). [Decision 0009](../decisions/0009-ordinary-mail-scheduling-and-importance.md) governs Emergency/Ordinary scheduling and supersedes older Priority language. This is a logical contract, not a deployed API.

- **Status:** Accepted 0.2 design direction

## Purpose

This document defines user-facing OMail transfer, selective retrieval, attachment, and bandwidth-management behavior without binding the product to the abandoned 0.1 transport stack.

The active recipient-side plan owner executes transfers and persists accepted intent: normally the recipient Station when one is present, or the hosted Server/service in accepted Station-less hosted/Lite direct-Internet operation. Clients express user intent and display authorized state.

## Message body

Native OMail message bodies are plain text.

- No HTML body is required for native OMail.
- Composition/display should favor compact plain text.
- Rich formatting must not silently inflate constrained-link traffic.
- Attachments are separate selectable data with their own policy and transfer state.

## System-wide limits

OceanMail may define system/service policy for an absolute attachment-size limit and other safety/resource ceilings.

There is **no ordinary small-message automatic-delivery threshold on constrained/Grid links**. Message size affects estimates, ordering, and user choice, but does not authorize automatic retrieval.

Exact limits must come from measured real-world performance, service economics, and interoperability constraints rather than arbitrary early constants.

## Internet behavior

When the Station or client has inexpensive ordinary Internet connectivity, permitted OMail content should generally synchronize automatically rather than forcing constrained-link micromanagement.

A headless Station may continue this synchronization while all client laptops are off. In Station-less hosted/Lite direct-Internet operation, the hosted service owns the equivalent durable hosted plan/synchronization responsibility rather than requiring a nonexistent Station.

This includes queued messages, mailbox state, account changes, receipts, and permitted attachment content according to service/user policy.

## Constrained-link discovery

On scarce/intermittent links, OceanMail should obtain compact availability information before content transfer where the underlying path/service permits it.

Useful availability metadata may include:

- stable message identity;
- sender;
- subject;
- body size;
- attachment presence/type;
- available reduced/progressive representations;
- approximate size/cost; and
- freshness/availability time.

A compact OceanMail control/synchronization mechanism must carry recipient-scoped availability metadata ahead of payload where the constrained path permits it. Private metadata must be bound to the intended account and protected by holder-side authorization or equivalent end-to-end confidentiality before leaving the holder. Wire encoding, cryptography, synchronization protocol and transport mapping are separate design work. This does not select RFC email bodies as manifest transport or redesign HERMES/Mercury/UUCP.

Availability metadata is not authorization to retrieve ordinary message content.

## Recipient approval for constrained-link retrieval

Ordinary OMail content requires recipient selection/approval before it is downloaded over a metered/Grid/constrained link.

This applies even to very small text messages. There is no size-based rule that causes ordinary OMail to download automatically merely because it is cheap.

The recipient can therefore decide what consumes their receive allowance and in what order.

Emergency OMail follows its separately accepted emergency policy and is not governed by this ordinary-mail approval rule.

## Available OMail / retrieval planning

Clients should expose an Available OMail or equivalent planner backed by the authorized active plan owner (recipient Station when present, hosted service in Station-less hosted mode).

The interface should support:

- multiple simultaneous selections;
- user-controlled retrieval order where policy allows;
- explicit hold/defer/resume and component choices;
- expected transfer bytes;
- estimated constrained-link accounting cost;
- aggregate selected bytes;
- estimated duration;
- remaining included receive allowance where applicable;
- additional credit/cost authorization where applicable; and
- clear reason an item cannot currently progress.

Selection is planning, not proof of download or billing. The UI must not describe selected content as received until actual evidence exists.

## Transfer planner

Incoming and outgoing work should use a common visual vocabulary where practical.

A planner may show:

- active transfer;
- ordered next items;
- direction;
- Emergency/Ordinary class and recipient preferred order;
- size;
- progress;
- approximate ETA;
- budget eligibility;
- waiting reason; and
- valid next actions.

Actions such as pause, resume, cancel, move earlier/later, or defer appear only where valid for that transfer state.

Manual user ordering never overrides Emergency policy or required Station/system work.

## Progress and lifecycle truthfulness

Transfer progress and message-delivery evidence are separate.

A transfer reaching 100% locally may support a `Transmitted` state while remote durable receipt remains unconfirmed.

The client consumes the lifecycle semantics in `mail-lifecycle-and-receipts.md` and must retain separate transmission and receipt timestamps.

## Estimates

Time estimates should prefer observed effective performance over advertised modem maximums whenever sufficient Station history exists.

Potential inputs include:

- recent effective throughput;
- modem/link characteristics;
- retries/loss;
- current queue;
- transfer size;
- available gateway/path evidence; and
- budget eligibility.

Estimates are approximate and should visibly degrade in confidence when evidence is weak.

## Attachments

A message body and its attachment(s) are independently useful transfer components.

The recipient may select the text body while leaving larger attachments deferred.

Attachment UI should clearly show:

- attachment identity/type;
- total or selected representation size;
- whether it is local, available, partial, or deferred;
- approximate additional transfer time/cost; and
- available representation choices.

When inexpensive Internet appears, permitted attachments should generally synchronize automatically subject to user/service policy.

## Progressive/degradable representations

Where content can be meaningfully represented at multiple sizes, OceanMail should support user-visible choices.

Images are the primary example:

- tiny preview;
- grayscale/low-detail representation;
- reduced dimensions;
- moderate quality;
- best permitted representation.

Where technically practical, later quality should reuse bytes already transferred for earlier quality rather than requiring a completely independent re-download.

The codec/container mechanism remains research and must be evaluated for byte efficiency, incremental reconstruction, interruption tolerance, implementation availability, computational cost, and licensing.

## Duplicate avoidance

If the destination Station/service already possesses a message or attachment representation, a later gateway/server advertisement for the same stable logical item should not cause unnecessary re-download.

Deduplication is based on durable identity/evidence, not merely matching subject/sender strings.

## Automatic Internet synchronization does not erase user intent

If a user deliberately deferred or declined content for policy/privacy reasons, Internet availability should respect that explicit state where applicable. `Automatically synchronize permitted content` does not mean ignore user deletion/retention/privacy choices.

## Background operation

Once the client has submitted retrieval/send intent to the active plan owner, the client need not remain running.

A recipient Station persists the plan/queue and may complete work later over RF or Internet, then report updated state when the client reconnects. In Station-less hosted/Lite direct-Internet operation, the hosted service owns the equivalent durable hosted plan/execution coordination.

## Relationship to OChat

OMail is durable/asynchronous. Initial OChat remains live/ephemeral and lower priority than OMail on shared constrained communications resources except where future explicit policy says otherwise.

## Ownership

- **Client:** selection, ordering intent, presentation, user approval, compose UX.
- **Recipient Station (when present):** client authentication/account grants, recipient-visible Available catalog, revision-protected durable retrieval plan, local execution/progress, link estimates, deduplication evidence, and background synchronization.
- **Hosted Server/service (Station-less hosted/Lite mode):** equivalent client authentication/account grants, durable hosted plan and hosted retrieval/synchronization coordination, plus hosted availability/mailbox authority and service/accounting facts.
- **Source/holder:** authoritative payload/component existence and trustworthy availability metadata; a sender Station/native holder can originate decentralized boat-to-boat availability without a central Server, while enforcing holder-side recipient/account privacy before disclosure.
- **Server generally:** authoritative hosted identities/accounts/mailboxes, hosted service policy and balances/credits.
- **Transport/upstream layers:** actual transport framing, compression/adaptation, retransmission, and link behavior.
