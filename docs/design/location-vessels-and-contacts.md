# Location, Vessels, and Contacts

- **Status:** Accepted 0.2 design direction

## Distinct location concepts

OceanMail must distinguish:

- the Station's best-known navigation/network position;
- a vessel identity and its position/history;
- observed positions of other Stations/vessels;
- a user's consensually shared contact location;
- emergency-position policy.

These are not interchangeable permissions or data sets.

Using Station position for local discovery, diagnostics, regulatory selection, emergency behavior, or Grid observations does **not** imply consent to share a person's location with another user.

## Vessel/Station is the normal geographic entity

OceanMail geographic/network maps normally represent vessels or Stations, not every individual crew account as a separate point.

When several crew members are aboard one vessel:

- render one vessel/Station position;
- show currently known/authorized crew association in vessel details, hover, or an equivalent accessible disclosure where useful;
- do not create duplicate colocated person markers merely because those users have accounts on the same Station.

A crew member moving to a different vessel does not move the original vessel identity. Personal user identity, vessel identity, Station identity, and temporary location-sharing permission remain distinct.

## Identity-context actions

Where an OceanMail identity appears in Mail, OChat, Contacts, or a Recently Seen surface, the client should expose context actions appropriate to the state, such as:

- Add to Contacts or Edit Contact;
- Send OMail;
- Start OChat when live chat is appropriate;
- Request Location; and
- Request Contact Card.

Desktop may expose these through a context menu, but essential actions require keyboard/menu-accessible equivalents and must not depend solely on right-click or pointer hover.

## Personal/contact location requests

Personal/contact location sharing is unavailable by default and requires explicit consent.

A location-request flow is conceptually:

1. requester selects `Request Location` for an identity;
2. recipient is shown a conspicuous pending request associated with the requester;
3. recipient may approve or deny it;
4. approval shares the recipient's current best trusted GPS/Station-associated position for this purpose;
5. requester receives temporary location state with source/freshness/age evidence;
6. the shared location later expires, is revoked, or becomes unavailable and is removed.

Approval is a temporary location disclosure, not permission for indefinite background tracking. Any future continuous-sharing mode requires a separate explicit design and authorization model.

The request indicator should remain distinguishable from ordinary chat/mail notifications until answered or expired.

## Presentation of approved location

While consensually shared location is valid, the client may show:

- coordinates or map position;
- source/trust state where useful;
- numerical age/freshness;
- an identity-level `location available` indicator in Mail/Chat/Contacts; and
- the same temporary location in the contact card or vessel detail where applicable.

Freshness must not rely on color alone. The accepted visual vocabulary is:

- **green** — very recent/high-confidence location;
- **amber** — recent location but live source/contact has been lost or confidence is declining;
- **red** — older/stale location that remains useful only with clear age context;
- **dark/black** — no current confidence in the last known location.

A numerical age or equivalent textual freshness state must accompany the color state. Exact thresholds are tuning/policy, not architecture constants.

When the sharing TTL expires or the share is revoked, the coordinates/location marker and location-available indicator disappear rather than silently becoming a permanent historical contact field. The user may request an update again.

The exact expiration interval remains unresolved and must be selected with moving-vessel safety and privacy in mind.

## Contact-card requests

A user may request another user's contact card separately from requesting location.

The recipient should be able to approve, review, or decline the card before disclosure where policy requires. A shareable card may contain user-approved information such as:

- OceanMail identity/address;
- display name;
- vessel association;
- vessel name/type or other useful vessel details;
- callsign, MMSI, or similar identifiers where appropriate; and
- ordinary interoperable contact information the user chooses to disclose.

Exact contact-card fields and defaults remain service/client design work.

A contact-card grant does not implicitly grant live/current location. Location remains separately authorized and expiry-bounded.

## Station observations

Where supported, the Station may retain observations such as:

- peer/vessel identity;
- last-seen/contact time;
- approximate position and freshness where legitimately available;
- transport/link used;
- relevant capabilities/gateway status; and
- measured link quality/session statistics.

These observations are not automatically consensual personal-location shares. Exact retention, synchronization, disclosure, and privacy rules remain open.

## Grid/network map relationship

Geographic and network/topology visualization requirements are defined in [`grid-map-and-network-visualization.md`](grid-map-and-network-visualization.md).

That view must preserve the vessel-centric identity rule above, show freshness/age truthfully, and distinguish consensual contact location from Station/network observations.

## Diagnostics

Optional future diagnostics may correlate vessel heading with link quality by frequency, peer/bearing, antenna setup, and propagation conditions. This is intended to learn station-specific strengths/nulls empirically, not to infer a deterministic radiation pattern from vessel geometry alone.
