# Station Management and Dashboard

- **Status:** Accepted 0.2 design direction

## Management surfaces

OceanMail Station should expose one authenticated management API consumed by multiple interfaces:

- local Station web management;
- Station-management views inside the OceanMail client;
- future automation/administration tools where explicitly authorized.

The API/permission model is authoritative; individual interfaces should not invent incompatible management behavior.

## Dashboard versus Station management

The Dashboard and Station-management surfaces have different jobs.

- **Dashboard** answers `what is happening now`: current Internet/radio/Grid freshness, active work, queues, budgets, location, Grid visibility, warnings, and high-level relay/gateway state.
- **Station management** owns deeper configuration, diagnostics, radio/network setup, policy controls, logs, resource limits, user/role administration, and other operator functions.

The Dashboard may link into detailed Station-management views, but it should not duplicate Station business logic or become the authoritative configuration store.

## Persistent communications status

The client should maintain a compact persistent communications status surface where supported by the native Thunderbird shell.

It may summarize:

- Internet state;
- Station/radio state;
- Grid/contact freshness;
- active transmit/receive progress;
- queued work; and
- important warnings.

Activating the overall status surface should open the richer Dashboard where those states are explained in context rather than expanding many ad-hoc popovers across Mail/Chat.

Individual status elements may deep-link/highlight the corresponding Dashboard card when practical.

## Web management

A headless Station should be manageable from a browser on the vessel/local network without requiring the OceanMail client to be installed on the management device.

The web UI is also the preferred home for complex Station dashboards and diagnostics because it can be reused across desktop platforms without maintaining another standalone Manager application.

The OceanMail client may expose common management functions directly and either reproduce, embed, or open richer web views. Exact presentation remains open.

## Dashboard domains

Expected dashboard areas include:

### Overview

- Station health;
- Grid/server last-contact evidence;
- Internet availability;
- RF/link availability;
- active transfers with truthful progress/ETA;
- incoming/outgoing queue summary;
- send/receive allowance and Server-confirmed credit where authorized;
- pending server synchronization; and
- warnings/attention state.

The Dashboard should favor user-understandable summaries. Deep modem/link details remain available through Station/operator views.

### GPS / Position

Where authorized and available, the Dashboard may show:

- local vessel/Station best-known position;
- source/trust/freshness;
- applicable/nearby geographic group regions; and
- jurisdiction/regulatory data freshness.

The GPS/Position card should open the geographic communications-map mode described in [`grid-map-and-network-visualization.md`](grid-map-and-network-visualization.md).

### Grid visibility

A Grid-visibility card may summarize observed network context such as:

- direct/1-hop observations;
- farther known nodes by hop class;
- known gateways/relay availability;
- recently observed OChat-capable Stations; and
- current path/freshness confidence.

It should open the Grid/topology visualization mode rather than implying that a hop count is geographic distance.

### Map

The map/network visualization may show:

- own vessel/Station;
- known Stations/vessels;
- gateways;
- anonymous relay observations;
- last-seen positions/freshness;
- applicable regional/jurisdiction data; and
- user/contact location only where sharing permissions allow it.

Detailed semantics, filtering, freshness colors/text, vessel-centric markers, anonymous relay presentation, and the alternative hop-ring view are defined in [`grid-map-and-network-visualization.md`](grid-map-and-network-visualization.md).

This is communications/network visualization, not a navigational chart.

### Communications

- supported transports/modems/radios;
- link/session state;
- frequency/channel information where appropriate;
- measured effective throughput and link-quality evidence;
- recent failures/retries; and
- estimate confidence.

User-facing ETA should prefer measured effective throughput over advertised modem maximums when sufficient evidence exists. Prototype constants are not architecture values.

### Queues

- outgoing/incoming jobs;
- retries/deferred work;
- user-owned queue visibility scoped by permissions;
- future relay/gateway queues.

Current Desktop Mail information architecture remains authoritative: there is no user-facing OceanMail Outbox pseudo-folder. Station-wide queue/transfer detail belongs on Dashboard/Station-management surfaces or in truthful account-scoped evidence where the current Mail model permits it.

### Network observations

- known Stations/vessels;
- capabilities;
- last heard/contacted;
- gateway observations;
- future relay/reliability evidence.

Observations must expose freshness/uncertainty and must not claim current reachability merely because a peer was seen historically.

### Relay / Gateway

Relay willingness and Internet-gateway policy are separate dimensions.

Current project-level semantics are authoritative:

- a running Station's relay behavior is **Eager** or **Reluctant**; there is no relay `Off` mode;
- gateway policy for ordinary third-party service is **Full**, **Minimal**, or **Off**;
- Emergency may remain eligible in all gateway modes when technically, legally, and operationally permitted;
- Reluctant relay is non-advertising/fallback behavior, not disabled relay;
- Minimal Gateway is fallback-oriented ordinary service rather than equivalent to Gateway Off.

The UI should explain these terms near the controls instead of assuming operators already understand them.

Internet availability does not determine whether the configured gateway policy can be edited. If no usable Internet connection currently exists:

- show gateway service as currently inactive/unavailable;
- keep the configured policy visible;
- permit authorized policy changes for the next eligible Internet opportunity; and
- do not imply that merely selecting a gateway policy creates Internet connectivity.

A Station gaining Internet for its **own** pending synchronization is distinct from volunteering third-party gateway service.

Relay/gateway settings and eligibility remain subject to authenticated roles, resource policy, regulatory constraints, and actual Station capability. The client should not invent settings that the Station API does not expose.

During Station registration, the owner selects whether verified eager-relay credit is assigned to the vessel/ship account or the captain's personal OceanMail account. This is an authenticated Station/account setting and is not derived from the currently logged-in crew user.

Relay forwarding itself consumes no user send/receive Grid quota. It remains fully metered and may be resource-limited by Station/operator/service policy.

### Metering and resource budgets

The Station should expose separate views for:

- user send/receive quota usage and remaining allowance;
- third-party relay/gateway bytes, airtime, storage, retries, and Internet use;
- Station/system control and operational traffic where measurable;
- eager-relay contribution evidence and Server-confirmed credit;
- configured relay/gateway resource ceilings;
- unusually chatty/expensive peers or traffic patterns; and
- accounting/policy reconciliation status.

Third-party traffic may behave as unlimited in **user-quota** terms while still being measured and constrained by physical-resource budgets.

The Station may use these observations to rate-limit, defer, deprioritize, or temporarily refuse excessive third-party work according to policy.

See Decision 0004 and `station-metering-and-resource-budgets.md`.

### Statistics

- bytes sent/received;
- airtime or on-air-equivalent cost where measurable;
- throughput;
- connection success/failure;
- traffic by transport;
- transfer/receipt timing;
- relay/gateway resource consumption;
- relay contribution;
- longer-term diagnostic trends.

### Users and roles

- associated users/devices;
- Station role assignments;
- device revocation/pairing status;
- privacy-safe account state.

### Server synchronization

- last successful sync;
- pending operations;
- failed/retryable operations;
- account/service status appropriate to the current user's permissions;
- policy/accounting reconciliation;
- relay-credit reconciliation where applicable.

### System

- hardware/storage;
- software versions/updates;
- logs/diagnostics;
- backup/recovery status where applicable.

## Data ownership

The dashboard should visualize state already owned by the Station or authoritative Server responses. The UI should not become the sole holder of network history, queue truth, resource accounting, configuration, map observations, or service policy.

Fixture/demo data must remain explicitly marked and must never be promoted into a claimed live Grid observation simply because it appears in a polished UI.

## Normal-user simplicity

Advanced reliability scores, modem internals, detailed RF statistics, and relay-abuse diagnostics should not burden ordinary users. They may be exposed in operator/diagnostic views while automatic Station policy consumes them in the background.
