# Emergency OMail Behavior

- **Status:** Accepted 0.2 design direction

## Purpose and safety boundary

Emergency OMail is OceanMail's highest-priority message class for urgent situations on an intermittent communications system.

It is **not** a replacement for DSC, GMDSS, EPIRB, VHF/MF/HF distress procedures, satellite distress systems, or other regulated maritime safety services. The UI and documentation must not imply otherwise.

OceanMail should improve the chance that useful emergency information moves when OceanMail is available; it must not delay or discourage use of official distress systems.

## Priority and quota

Emergency OMail:

- is scheduled ahead of Ordinary mail, background data, OChat, and discretionary relay work;
- is not blocked merely because ordinary constrained-link allowance is exhausted;
- does not consume ordinary OMail send/receive quota; and
- is not rejected merely because an ordinary mailbox is at its normal quota limit.

Emergency traffic remains subject to technical limits required to prevent system failure and to post-event service/AUP accountability.

## No pre-transmission service approval

A disconnected Station must not require live Server approval before allowing an otherwise authorized user to queue emergency traffic.

Abuse enforcement is primarily post-transmission/accountability based. Service-side abuse detection may flag patterns for review but must not become a network dependency that blocks a genuine emergency while offline.

## Templates

The client should provide compact Emergency OMail templates for common situations, including at least:

- medical emergency;
- fire/explosion;
- flooding/taking on water;
- collision;
- grounding;
- disabled/adrift;
- person overboard;
- abandoning vessel;
- severe weather/immediate danger;
- security/piracy/violence; and
- other/free-form emergency.

Templates should favor compact structured fields where that improves clarity and byte efficiency, while always permitting enough free text to describe circumstances not captured by the form.

## Position

Emergency OMail should include the best available Station/vessel position plus source and freshness.

Preferred sources may include trusted onboard GNSS/GPS or other authenticated navigation data available to the Station.

If live position is unavailable, OceanMail must not block emergency transmission. The message should explicitly carry the best available fallback, for example:

- last known position with age;
- manually entered coordinates/description; or
- `POSITION UNKNOWN`.

The system must never silently present stale coordinates as current.

This emergency Station-position behavior is separate from ordinary consensual personal location sharing.

## Time

The Station should attach the best available trustworthy timestamp and source/freshness information where relevant.

GNSS-derived or trustworthy Internet time may improve confidence, but lack of trusted time must not block emergency transmission. Uncertain time must be represented as uncertain rather than fabricated.

## Recipients and routing

Emergency destinations may depend on:

- the selected emergency type;
- vessel/account configuration;
- geographic area and jurisdiction;
- configured personal/emergency contacts;
- currently reachable OceanMail Stations/gateways; and
- explicitly supported/authorized external emergency-service integrations.

OceanMail may maintain compact cached geographic/jurisdiction/emergency-routing metadata so a disconnected Station can make useful routing decisions without live Internet.

Any integration that targets Coast Guard, MRCC, rescue coordination, public-safety, or other official services requires explicit technical and policy validation. OceanMail must not invent unofficial delivery addresses or imply guaranteed monitoring by an authority.

## Emergency contacts

Accounts may support configured emergency contact addresses or identities.

Changes to emergency-contact configuration are security-sensitive and should be protected against account-takeover abuse. Rate limits, confirmation, grace/correction windows, or stronger authentication may be used, but exact policy belongs to the Server/service security design.

Because Stations may be offline, a recently synchronized emergency-contact configuration should remain usable locally according to its validity/security rules.

## Background and preemption behavior

Emergency traffic may preempt ordinary Station work where doing so is technically safe.

Examples of work that should normally yield include:

- Ordinary OMail where Emergency must take precedence;
- OChat;
- software/data updates;
- discretionary gateway/relay contribution; and
- noncritical synchronization.

The Station must still respect hardware/radio safety, regulatory constraints, and lower-layer transaction boundaries where interruption would corrupt state or cause unsafe operation.

## Emergency weather/system notices

OceanMail may permit genuinely emergency-class weather or service notices to interrupt the normal nonintrusive background UI when policy requires it.

Ordinary weather information is not automatically promoted to Emergency simply because it is transmitted over OceanMail.

## Delivery evidence

Emergency OMail uses the same truthful lifecycle/evidence rules as ordinary OMail. High priority does not justify claiming delivery before evidence exists.

The UI must continue distinguishing local transmission from confirmed remote receipt/delivery.

Retry/escalation policy may be more aggressive than Normal OMail, but must remain bounded and must not create uncontrolled network flooding.

## Retention

Emergency messages may have different service retention/quota rules from ordinary mail, but retention remains finite unless explicitly protected by user/service policy.

Exact retention periods are Server/service policy rather than protocol constants.

## Abuse handling

Potential abuse signals include repeated emergency use, anomalous frequency, known false-report patterns, or repeated service-policy violations.

Enforcement may include review, warning, temporary suspension, or termination according to service policy and applicable law. The system should avoid relying on semantic inspection of every structured emergency message merely to decide whether the disconnected Station may transmit it.

## Ownership

- **Client:** emergency compose/templates, clear safety language, user authentication, presentation.
- **Station:** offline authorization evidence, priority execution, best-known position/time, cached routing/policy data, durable queueing, transport evidence.
- **Server:** authoritative account policy, emergency contacts, abuse handling, supported external integrations, retention, and synchronized routing/policy updates.
- **Upstream transports/radios:** actual lawful/technical link operation; OceanMail priority does not override radio/regulatory constraints.

## Band 0 and urgent shared updates

[Project ADR-008](https://github.com/OceanMail/oceanmail-project/blob/main/docs/decisions/ADR-008-four-band-scheduling-and-channel-use.md) places Emergency payload and its own propagation/control, ACKs, stop-flow, and tombstones in Band 0. They do not wait for ordinary Band 1 coordination. All capable, authorized participants follow the Emergency coordination mechanism; collision avoidance and bounded single-radio discovery/preemption require implementation evidence.

A Server-designated urgent shared update or piracy notice may instead be Band 1, subject to its normal cap. That promotion is not automatically Emergency and does not give ordinary senders a priority control. An actual emergency-class piracy/distress message retains the Emergency workflow above.
