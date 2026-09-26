# OceanMail Client User Experience

[Decision 0009](../decisions/0009-ordinary-mail-scheduling-and-importance.md) governs transport class/Important metadata. Available follows the [Station logical contract](https://github.com/OceanMail/oceanmail-station-archive/blob/9bed63fc56cbede78a03bcc7ca3f64123045ca3b/docs/AVAILABLE_MANIFEST_ACCOUNT_CONTRACT.md): native holders can supply boat-to-boat pre-transfer metadata without the Server, holder-side disclosure must be recipient/account-authorized or equivalently confidential, and the active recipient-side plan owner enforces account privacy. The [Mail model correction](../../desktop/docs/MAIL_MODEL_CORRECTION.md) is authoritative for account-scoped Mail: there is no user-facing OceanMail Outbox.

- **Status:** Accepted 0.2 design direction
- **Client implementation authority:** Decisions 0005 and 0006

## Product model

OceanMail should feel like a familiar communications client, not a radio terminal.

OceanMail Desktop is an OceanMail-owned application experience built on a pinned Thunderbird desktop foundation. It is not intended, during 0.x, to feel like a generic Thunderbird installation with an optional OceanMail add-on. Thunderbird provides mature mail mechanics underneath; the mandatory OceanMail extension, views, branding, configuration, and Station/Server integration own the visible product experience.

The accepted 0.1 interactive prototype and its owner-approved refinements are the primary historical UX reference for Desktop. Current 0.2 decisions override obsolete 0.1 transport, Client/Station, security, accounting, and automatic-retrieval assumptions. See `desktop-interface-inheritance.md`.

The client does not contain the Station communications engine. Closing the client does not stop work already accepted by the autonomous Station.

## Primary areas

The intended product areas remain:

- Mail
- Calendar
- Contacts
- Chat
- Station

For early Desktop releases, Mail and Station/constrained-communications workflows take priority. Calendar, Contacts, and Chat may mature later without changing the Thunderbird foundation decision.

Settings remain separate from the primary communications areas.

## OceanMail Desktop navigation and shell

OceanMail Desktop should use an OceanMail-owned top-level Space/application surface rather than rely on Thunderbird's generic Mail UI as the primary navigation model.

The normal 0.x user experience should expose OceanMail concepts such as:

- Inbox;
- Available;
- Saved;
- Sent with truthful delivery/transport evidence;
- Drafts where useful;
- Compose;
- Manifest/retrieval planner;
- budgets/estimates;
- Station/Grid status and queue/traffic surfaces;
- dashboard and permitted Station controls;
- Emergency; and
- OChat when implemented.

There is no user-facing OceanMail Outbox. Once Desktop submits ordinary mail to Station, Station owns queueing, retries, transport attempts, and delivery/receipt evidence; the user's native Sent folder and Station operational surfaces present that state rather than implying Desktop retains ownership of an Outbox queue.

General-purpose Gmail/Outlook/Mailcow/arbitrary IMAP account setup is intentionally outside the normal OceanMail Desktop experience for 0.x. Conventional Internet email remains reachable through the OceanMail service boundary; this UI restriction is about what kind of client OceanMail Desktop is.

Desktop should retain the accepted 0.1 persistent far-left navigation pattern suitable for mouse and keyboard, with an expanded icon+label mode and compact/collapsed icon-only mode. Collapsed navigation must preserve accessible names, keyboard focus, tooltips, and equivalent functionality. Navigation collapse and compact/watch presentation are separate preferences.

## Thunderbird responsibility versus OceanMail responsibility

Thunderbird should supply mature standard mail behavior rather than OceanMail rebuilding it. This includes, where suitable:

- SMTP/IMAP account plumbing;
- MIME parsing/rendering;
- folders/local storage;
- recipients and addressing mechanics;
- reply, reply-all, and forward;
- search;
- basic attachment handling;
- notifications/platform integration; and
- contacts/calendar foundations.

OceanMail owns the parts that make constrained maritime mail different:

- Available OMail and remote manifests;
- selective inbound retrieval;
- recipient-controlled download/retrieval order;
- Ordinary mail and the separate Emergency workflow;
- attachment/image representation selection;
- send/receive budgets and estimates;
- truthful queue/transport/delivery evidence;
- Station/Grid/link/gateway/relay state;
- Emergency behavior;
- OChat; and
- the persistent OceanMail communications status surface.

Do not build an HTML imitation of Thunderbird's message reader, message list, compose editor, reply/forward construction, or other mature mail behavior merely to match the old prototype visually. Preserve the OceanMail workflow and hierarchy while invoking Thunderbird's native capabilities where possible.

## Familiar mail behavior with truthful intermittence

OceanMail should use familiar mail concepts—Inbox, Drafts, Sent, Trash, contacts, compose, reply, forward—while explicitly representing intermittent delivery. `Available` and `Saved` are OceanMail/account concepts layered into the native Mail experience; user-facing Outbox is intentionally absent.

Core rule:

> Never imply remote state from a successful local action.

Submitting OMail to the Station means it has been accepted/queued locally, not necessarily delivered remotely.

The UI consumes the evidence model in `mail-lifecycle-and-receipts.md`.

`Sent` therefore must not erase distinctions such as queued, handed off, transmitted, acknowledged, remotely accepted, delivered, failed, or unknown where the underlying evidence model distinguishes them.

## Compose

OceanMail should reuse Thunderbird's mature composition mechanics while wrapping them in an OceanMail-aware compose experience.

The user normally chooses:

- recipients;
- subject/body;
- attachment representation where relevant;
- conventional Important metadata; and
- any explicit exceptional-budget authorization.

OceanMail compose should be able to show or control:

- Ordinary mail and separate authorized Emergency behavior;
- the fact that the immediate action may be durable local queueing rather than real-time remote delivery;
- attachment/image representation choices such as reduced size/resolution/color depth when implemented;
- estimated encoded/transferred bytes and time where supportable;
- send-budget impact;
- explicit hold/defer behavior where appropriate; and
- Emergency confirmation/guardrail behavior.

The user should not normally choose Mercury, VARA, ARDOP, PACTOR, frequency, gateway path, or other transport internals while composing ordinary mail.

The accepted prototype direction remains a concise, transmission-aware modern telegram/radiogram character without archaic formatting. Where the immediate action is durable local queueing, wording such as `Queue OMail` is preferable to a misleading implication of immediate remote delivery.

## Available OMail and Manifest

Remote/advertised OMail that has not been retrieved must not be presented as though its body is already local.

`Available` is conceptually a Station/Server retrieval manifest, not simply another conventional IMAP folder. It should expose message metadata and enough information for a user to decide whether and when constrained-link transfer is worthwhile.

The Available/Manifest experience should support, as policy permits:

- selecting which messages to retrieve;
- multiple simultaneous selections;
- explicitly holding messages;
- setting retrieval order;
- choosing permitted component/representation retrieval;
- showing size/cost/time estimates;
- choosing attachment/image representations before retrieval when available;
- showing current receive-budget effects; and
- explaining why an item is blocked, deferred, already local, or otherwise ineligible.

Available remains metadata/manifest only: it does not reveal a remote message body or pretend the message is already in Inbox.

Current 0.2 policy intentionally differs from the old prototype in one important respect: ordinary constrained-link OMail requires recipient selection/approval regardless of message size. Do not restore the 0.1 small-message automatic-delivery threshold.

Once content is actually local, normal Thunderbird/Dovecot mailbox behavior may be used where appropriate.

## Persistent communications status

OceanMail Desktop should expose a persistent high-level communications status surface, including within the OceanMail-owned application Space.

Conceptually it may include:

- Internet availability;
- Station connection;
- radio/link availability where exposed by Station;
- last useful Grid/Station contact freshness;
- active/queued work and progress;
- send/receive budget state;
- gateway/relay state where relevant; and
- warnings requiring attention.

Because intermittent connectivity is normal, freshness such as `last contacted 7 min ago` is often more truthful than a binary `connected` light.

A status surface should open a richer dashboard rather than forcing detailed radio state into every Mail/Chat view.

The 0.1 owner refinement that this status surface is keyboard accessible and persistent across the OceanMail application remains a design target. A Thunderbird-wide native bottom-chrome modification is not required if the same persistent experience can be owned reliably inside the OceanMail Space. Stable supported extension mechanisms are preferred over fragile internal patches.

## Emergency action

OceanMail Desktop should provide a prominent, quickly reachable Emergency action consistent with `emergency-behavior.md`.

The 0.1 prototype used a large distinct Emergency action independent of ordinary mailbox navigation/collapse. Preserve that prominence even if the exact placement changes to fit Thunderbird cleanly.

It should be available from the OceanMail application surface and may also be exposed through other persistent application controls where supported. Emergency visibility must not imply that OceanMail replaces regulated distress systems.

## Dashboard

The client dashboard may summarize Station information such as:

- current connection paths;
- queue/progress;
- constrained-link budget/credit;
- trusted-time confidence;
- vessel/location state where authorized;
- account synchronization;
- warnings;
- regional/operational data versions; and
- recent Station health.

Deep diagnostics belong to the Station management UI/API rather than being reimplemented as client business logic.

The Dashboard must not turn seeded/demo data into claimed observations.

## Station management integration

Deep Station management should be implemented once around the Station API and web-management surface.

OceanMail Desktop may render frequently used OceanMail status/controls in its Thunderbird-based UI while opening or embedding appropriate Station web-management views for complex administration. The exact split is an implementation choice so long as business logic and authorization remain authoritative in the Station.

The accepted historical information architecture remains a useful guide: Overview, Connections, Radio, Network/Grid, Gateways, Queue, Traffic, Diagnostics, and Identity. Current Station APIs determine which of those can become real.

Use `Grid`, not `mesh`, in user-facing product copy.

Role-based authorization determines which Station controls appear.

## Desktop platform independence

Thunderbird is OceanMail's desktop platform-independence foundation.

The OceanMail Desktop extension/application layer must be designed to run on compatible desktop Thunderbird builds on Windows, macOS, and Linux. Shared MailExtension APIs, Spaces, HTML/CSS/JavaScript, native Thunderbird APIs, and shared assets are preferred. A narrowly scoped Experiment API may be used only where ordinary MailExtension APIs cannot provide a required capability.

Platform-specific behavior should be isolated primarily to packaging, installation, launching, signing/notarization, updating, and OS integration. Product behavior must not casually become Linux-only, Windows-only, or macOS-only because one platform is the current development host.

The OceanMail extension should remain installable/testable in compatible stock Thunderbird on all three desktop platforms where Thunderbird permits it, even though the released 0.x product remains the separate OceanMail Desktop package with its own binary/profile/application identity and strict coexistence boundary.

## Mobile / OceanMail Lite

Mobile development is deferred until OceanMail Desktop is mature enough to serve as the reference experience.

Do not begin Android or iOS implementation during current Desktop tranches. Future iOS and Android clients will be separate application/development efforts and may use different foundations. No current decision requires Thunderbird/K-9/Thunderbird iOS as their implementation base.

When mobile work is eventually promoted, it should preserve appropriate OceanMail product semantics, API contracts, identity, constrained-link workflows, terminology, and visual direction learned from Desktop. It need not share the Desktop extension architecture or codebase.

A future mobile client remains client-only unless a later explicit decision says otherwise; running on a phone/tablet does not by itself make that device an RF Station, gateway, or relay.

## Multi-user privacy

A shared Station can serve multiple users while each person uses their own client device.

On a shared console or remembered-account view, a locked account may expose minimal operational information without revealing sender, subject, body, calendar, contacts, or other protected content.

Station administrators do not silently acquire private mailbox access merely through their administrative role.

Background Station work continues while user-facing content is locked; local account/UI authentication must not be confused with Thunderbird process/profile locking.

## Local-first/offline behavior

Reading cached mail, composing, searching, sorting, contact/calendar work, and supported account changes should remain useful while disconnected.

Connectivity determines when state can synchronize, not whether ordinary local work is possible.

Once work has been durably handed to the Station, the client may close; the Station continues background work.

## State vocabulary

Durable synchronized domains should be capable of showing meaningful states such as:

- Local
- Pending
- Syncing
- Synced
- Stale / remote update available
- Conflict
- Failed

Not every object needs every state, but the UI must avoid pretending local changes are already authoritative server changes.

## OChat UX

Initial OChat is live/ephemeral rather than store-and-forward. If a direct-chat recipient is unavailable, the client should offer OMail rather than silently converting the chat into delayed chat.

Chat remains chronological/simple; bandwidth-heavy reaction/sticker/GIF systems are not implied by Unicode text/emoji support.

Detailed behavior belongs in `chat.md`. OChat implementation remains behind core OMail/Desktop work.

## Background activity

Normal receiving, sending, synchronization, account updates, registry/policy refresh, and Station maintenance should not steal focus.

Progress/status is visible when useful. Emergency policy may intentionally interrupt.

## Notifications

Notification categories/sounds should be user-configurable where practical, with visual equivalents for audible alerts.

Routine link/background changes should not create disruptive notification noise.

## Night and compact operation

Dark/night mode is required.

Desktop should provide a compact/watch presentation appropriate for leaving visible aboard a vessel, emphasizing high-value status such as Station/Grid freshness, OMail availability, queued/active transfer state, OChat activity when implemented, and radio/Internet state.

Compact/watch mode is not the same feature as collapsing the primary navigation rail.

## Privacy/transport disclosure

The UI must describe confidentiality according to the actual path/security profile.

Shared radio should be treated as observable unless a supported, lawful security profile explicitly provides confidentiality. The client must not use lock/privacy language merely because a message has a named recipient.

The historical 0.1 blanket `all OMail is public radio` notice is therefore not carried forward literally to every OMail path. OChat's accepted initial radio model remains public/observable. OMail may traverse different paths; its displayed security state must be evidence-based rather than globally assumed.

## Visual direction and branding

The accepted direction remains a modern, familiar, light-blue communications-client identity with a required dark/night mode. Information density should support serious maritime use without exposing low-level protocol machinery unnecessarily.

OceanMail Desktop is branded and presented as OceanMail. Thunderbird is an implementation dependency and should not dominate the normal user experience. Public packaging must comply with applicable Thunderbird/Mozilla licensing and trademark requirements.
