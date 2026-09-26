# Client Connectivity

- **Status:** Accepted design direction
- **Client implementation authority:** Decision 0005

## Client family and implementation foundation

OceanMail should avoid unnecessary parallel mail-client implementations.

OceanMail Desktop uses Thunderbird as its application/mail-engine foundation while remaining an OceanMail-branded product with OceanMail-owned UI, policy, packaging, and Station/Server integration.

OceanMail Lite remains the lightweight/mobile client concept. Rather than immediately creating a clean-sheet mobile mail client, OceanMail should prefer Thunderbird-family mobile foundations where practical and validated per platform.

This does not require desktop, Android, and iOS to share one binary or extension. They should share product semantics and API contracts.

## Direct Internet

A client with ordinary Internet connectivity may communicate directly with OceanMail Server for supported user functions without requiring the vessel Station.

This permits users away from the vessel to continue using OceanMail normally.

Direct Internet capability does not make OceanMail Desktop a general-purpose Internet mail client. For 0.x, arbitrary Gmail/Outlook/Mailcow/IMAP accounts are outside the supported OceanMail Desktop account model.

## Local Station

A client aboard or near a Station may use it as an authenticated communications/synchronization service over local Wi-Fi/LAN and future supported local transports.

The Station remains the actual persistent network participant. Client offline storage does not make the client a gateway or relay.

For standard local mail access, the Station may expose SMTP/IMAP through the accepted Postfix/Dovecot path. OceanMail-specific state and controls that are not standard mail semantics use the authenticated Station API.

Examples include:

- Available OMail manifests;
- selective retrieval and ordering;
- budgets/estimates;
- recipient retrieval ordering and holds;
- Station/Grid/link state;
- delivery evidence beyond ordinary mailbox state;
- attachment representation choices; and
- permitted Station controls.

## Desktop and Lite

**OceanMail Desktop** is the primary desktop application product and is built on Thunderbird.

**OceanMail Lite** remains a client-only mobile/lightweight profile/product name for now. It may use direct Internet or an available Station. Installing Lite does not create a Station, gateway, relay, or persistent communications node.

A complete onboard installation may combine OceanMail Desktop and OceanMail Station on one computer or use one headless Station with multiple Desktop/Lite clients across the vessel LAN.

`OceanMail Full` is no longer an instruction to build a separate client application. If retained at all, it describes a complete deployment/capability experience rather than a distinct client codebase.

## Desktop packaging boundary

OceanMail Desktop should normally use a dedicated OceanMail profile and managed configuration. For 0.x, the application should expose OceanMail accounts rather than a generic Thunderbird account-setup experience.

The expected package is conceptually:

```text
OceanMail Desktop
    -> pinned Thunderbird base
    -> mandatory OceanMail extension
    -> OceanMail Space/views
    -> theme/branding/policies
    -> dedicated OceanMail profile
```

A narrowly scoped downstream Thunderbird patch set may be used only if supported extension/configuration mechanisms cannot satisfy a material requirement.

## Multi-client operation

Multiple clients may use the same Station concurrently subject to account authorization, queue policy, and Station resource limits.

The Station must not require one designated client to remain online as its controller.

## Account/server-setting changes through Station

Supported deferrable server/account operations may be submitted to the Station while no Internet path exists.

The Station persists the operation, later synchronizes it when Internet appears, records the authoritative server result, and exposes the result when the client next connects.

This allows background completion even if the original laptop/phone is powered down.

Security-critical account changes require a separately defined authorization policy.

## Path selection

The client may have both direct Internet and local Station connectivity. Exact preference/cost/policy rules remain open.

The user should be able to understand which path is active without being forced to manually operate low-level radio or transport controls.

## Mobile foundation direction

Android should first evaluate the Thunderbird for Android / K-9-derived codebase as its OceanMail Lite foundation.

iOS should first evaluate the Thunderbird iOS codebase as it matures.

Mobile implementations must not assume availability of Thunderbird Desktop MailExtension APIs. The reuse objective is to avoid rebuilding mature mail-client machinery where Thunderbird-family code already provides a suitable base, while preserving OceanMail-specific workflows through supported platform architecture.

## Privacy

A client authenticated for one user's account must not gain access to another user's protected data merely because both accounts are associated with the same Station.
