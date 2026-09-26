# OChat

- **Status:** Accepted 0.2 design direction
- **Roadmap position:** after core OMail and essential interoperability

## Purpose

OChat is OceanMail's live, ephemeral conversation facility.

The fundamental distinction remains:

> **OMail is durable asynchronous communication. OChat is live conversation.**

If a message needs to arrive after the recipient becomes unavailable, the user should use OMail.

## No initial store-and-forward

Initial OChat does not provide ordinary delayed delivery, missed-message synchronization, durable backlog recovery, or mailbox semantics.

If a direct recipient is unavailable, the client should explain that live chat is not currently possible and offer `Send OMail Instead` or equivalent.

A future decision may add different behavior, but it must not emerge accidentally from Station queue machinery.

## Pending transmission is not a sent chat message

Typing or locally queueing an OChat message is not proof that the message was transmitted.

When live RF/shared-link airtime is not yet available, the client should show a distinct transient state such as `Transmission pending` or `Waiting for airtime`. The pending text must not be inserted into the normal chronological conversation transcript as though other participants have already received or observed it.

The message enters the normal transcript only after the authoritative Station/transport boundary reports evidence sufficient to say that the live transmission was actually sent/accepted according to the OChat contract.

If the opportunity expires, the recipient becomes unavailable, or the transmission fails before that point, the client shows `not sent`/failure truthfully and may offer `Send OMail Instead`. It must not silently convert the failed live message into durable delayed OChat.

This rule is a UI/evidence requirement and does not require OceanMail to duplicate lower-layer ARQ or modem scheduling.

## Public/observable semantics

OChat has no confidentiality guarantee in the accepted initial design.

`Direct` means addressed to a particular user/Station; it does not mean private or secure.

Clients must not use lock imagery or `private chat`/`secure chat` language unless a later explicit security model changes the product semantics.

Shared-radio OChat may be received/observed by compatible equipment. Internet-assisted OChat must still preserve the product's explicit public/observable semantics unless a later decision introduces a distinct confidential chat mode.

## Initial chat forms

OChat initially supports:

- direct live chat to a reachable OceanMail user/contact;
- user-created groups; and
- registered regional/location groups.

Initial groups are open conversations rather than invitation-gated private rooms.

Registered status identifies a canonical long-lived discovery identity; it does not by itself create moderators, owners of conversation content, or permission-gated membership.

## Local rolling history

A client/Station may retain recently received OChat locally for a short rolling window so live conversation remains readable.

The accepted initial default concept is approximately **10 minutes**, user-configurable locally.

Changing local history duration does not create remote archival, synchronization, forwarding, or missed-message recovery.

## User-created groups

User-created groups have immutable internal identities independent of display name.

They are ephemeral discovery objects and expire after a system-defined period without qualifying activity/advertising. Approximately **16 hours** remains the initial design example, not a frozen protocol/service constant.

A later group with the same visible name may be a different group identity.

## Registered groups

OceanMail Server may maintain a global registry of canonical registered groups, especially geographic/regional groups.

Stations should not need a complete worldwide copy. They obtain relevant slices based on:

- current/best-known Station position;
- nearby regions;
- explicitly searched regions/groups;
- pinned groups; and
- available synchronization opportunities.

Registered-group identity persists independently of current conversation traffic. Message history does not.

## Geographic discovery

Registered geographic groups may use an inner/primary applicability area and a broader nearby area.

Conceptually:

- inside the primary area → eligible for `Regional`;
- inside the nearby area → eligible for `Nearby Regions`.

Exact geometry/radii are registry data, not hard-coded product constants.

Using the Station's private best-known position for local discovery does not imply broadcasting that position or granting personal location-sharing consent.

## User-created scoped groups

A user-created group may optionally advertise a geographic scope. While actively advertised, relevant nearby Stations may discover it before current chat traffic is heard.

Unadvertised ad-hoc group discovery primarily follows current/recent observed activity.

## Join-or-create flow

The client should use a `Join or Create Group` flow.

As the user types a name, suggestions may include:

- applicable registered groups;
- recently heard/advertised user groups;
- pinned groups; and
- explicit search results.

If an applicable exact match is known, the interface should strongly prefer joining it instead of creating a visible duplicate.

Display names are not globally unique identifiers; disconnected regions may legitimately create same-named groups with distinct immutable IDs.

## Registered-name handling

When the client knows a canonical registered group with the requested visible name applies, ordinary UI creation should resolve to that registered identity instead of creating a competing same-named local group.

This is namespace/discovery behavior, not moderation authority.

## Pinning and visibility filters

Users may pin groups so they remain visible when no longer automatically discoverable.

Pinned state must expose freshness such as `active`, `last seen`, `stale`, or `out of region` where useful. Pinning does not retrieve old messages.

Users may independently hide/show discovery classes such as regional, nearby, currently active, or newly heard groups. Hiding a class is presentation state, not an RF/privacy filter.

## Presence

Users may have presence choices such as Online or Invisible.

`Invisible` means the client/Station avoids intentional ordinary presence advertisement. It does not prevent other receivers from observing actual transmissions.

## Recently seen

Chat/Contacts may expose a `Recently Seen` view containing recently observed users/Stations/groups with freshness and an `Add Contact` action where appropriate.

This is observation/discovery state, not proof of current reachability.

Identity-context actions such as `Request Location` and `Request Contact Card` follow [`location-vessels-and-contacts.md`](location-vessels-and-contacts.md) and require their own authorization; being recently seen or participating in OChat does not grant location access.

## Mentions and text

Mentions such as `@Name` may be implemented as ordinary Unicode text plus local matching/notification behavior.

Unicode emoji may be ordinary text. Initial OChat does not imply stickers, GIFs, file attachments, reaction payload systems, threads, or other bandwidth-heavy social features.

The intended interaction model is simple chronological chat.

## Minimize, close, block/mute

- **Minimize:** conversation remains active in the short local history.
- **Close:** stop displaying/logging current conversation locally as configured; discovery may remain.
- **Block/mute:** suppress presentation/notifications locally without claiming the remote transmitter was prevented from transmitting.

## Traffic priority

OMail has priority over ordinary OChat on shared constrained communications resources.

OChat should yield when durable OMail or higher-priority Station/system work requires the relevant link. Emergency policy supersedes both.

The Station/upstream transport owns actual execution and must not be forced into unsafe interruption merely because the UI says OChat is lower priority.

## Rate and size controls

OChat should have strict message-size and rate/bandwidth controls appropriate to live constrained communication. Exact values must come from field measurement and service policy.

Initial OChat has no attachments.

## Registry observation and lifecycle

Gateways/Stations may eventually report lightweight user-group activity metadata to the Server to support registry promotion/retirement without uploading chat contents merely for statistics.

Potential metadata includes group identity, coarse activity region, first/last seen, active days, approximate distinct participants, and number of observing gateways.

Privacy/data-minimization rules must be defined before implementation.

Sustained useful user-created groups may become candidates for canonical registration while preserving identity where practical. Long-unused registered groups may become retirement candidates.

Promotion/retirement should begin conservatively, potentially administrator-reviewed, before any automatic policy is trusted.

## Connectivity boundary

OChat semantics are independent of whether the live path is provided by an RF Station, local Station plus gateway, or supported Internet service. The client does not select low-level transport during ordinary chat.

The first implementation should prioritize proving useful live behavior over designing global mesh forwarding.

## Ownership

- **Client:** conversation UI, pending/sent truthfulness, discovery display, pins, local history, mentions, mute/block presentation.
- **Station:** local live communications opportunities, Station position for geographic discovery, recent observations, RF scheduling interaction, and authoritative transmission evidence exposed to the client.
- **Server:** canonical registered-group registry and any Internet-assisted discovery/service state.
- **Future gateway/relay networking:** does not make OChat store-and-forward without a new explicit decision.
