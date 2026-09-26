# Grid Map and Network Visualization

- **Status:** Accepted 0.2 design direction; implementation depends on real Station/Grid evidence

## Purpose

OceanMail should provide a visual explanation of the communications environment around the Station without pretending to be a navigation system.

The Grid visualization has two complementary modes:

1. **Geographic Map** — where known vessels/Stations, gateways, regions, and jurisdiction/policy areas are located geographically.
2. **Grid / Topology View** — how observed nodes relate to the local Station by hop/network proximity and path evidence.

Both are operator/user visualizations of evidence. Neither is a routing protocol or a claim that speculative multi-hop networking is already implemented.

## Safety boundary: not a navigation chart

The geographic Grid Map is a **communications visualization only**.

It must not be presented as a replacement for a chartplotter, ECS/ECDIS, nautical chart, depth/bathymetry product, hazard database, or route-planning system. It need not carry soundings, navigation aids, shoals, hazards, or authoritative marine routing information.

A real geographic basemap with coastlines, islands, countries, cities, and recognizable geography is desirable because it makes communications observations understandable. The eventual map engine/provider is an implementation choice subject to licensing, attribution, offline/cache policy, and platform constraints; the prototype use of MapLibre/OpenStreetMap-derived data does not make a particular provider an architectural dependency.

The production view should support ordinary pan/zoom where practical. Fixed-region prototypes do not constrain the final interaction model.

## Geographic Map layers

The Map should support independent show/hide filtering for relevant evidence classes, including where available:

- local vessel / Station;
- known contact vessels with legitimately available position;
- other known/observed Stations or Grid nodes;
- permanent gateways;
- temporary/opportunistic gateways;
- eager relays;
- reluctant/fallback relays when there is useful evidence to surface them;
- registered geographic/regional group areas;
- jurisdiction/regulatory/emergency-routing areas; and
- optional communications influence/observation overlays.

No layer should be assumed complete merely because it is enabled. `Not displayed` and `not known` are different states.

## Vessel-centric markers and crew

Geographic markers normally represent vessels/Stations rather than individual crew accounts.

If several known crew members are aboard a vessel, hover/details or an equivalent accessible interaction may list the currently known crew association. Do not plot those crew as separate colocated person markers solely because their accounts are configured on the Station.

Personal consensual location follows [`location-vessels-and-contacts.md`](location-vessels-and-contacts.md). Expired/revoked personal location must not survive on the map as if it were current.

## Location freshness and confidence

Every displayed last-known position must communicate age/confidence explicitly.

Accepted visual vocabulary:

- **green** — very recent/high-confidence;
- **amber** — recent, but the live source/contact has been lost or confidence is declining;
- **red** — older/stale;
- **dark/black** — no current confidence in the last-known position.

Numerical age or an equivalent textual freshness label must also be shown. Color is supplemental, never the only state cue.

Exact freshness thresholds and the TTL for consensually shared location remain tuning decisions. Stale data must never be silently represented as current GPS.

## Gateway representation

Permanent shore gateways and temporary/opportunistic gateways should be visually distinguishable.

Useful gateway detail may include, where evidence exists:

- gateway identity or operator-safe identifier;
- permanent versus temporary/opportunistic status;
- advertised service capability;
- last heard/last confirmed time;
- current/last-known Internet reachability;
- path/hop evidence; and
- confidence/freshness.

Prototype locations such as Seattle, Los Angeles/Long Beach, Honolulu, Sydney, or an illustrative offshore gateway were UI demonstration data only. They are **not** accepted production topology or deployment commitments.

## Relay privacy and presentation

Ordinary users do not need the vessel identity behind a relay marker.

A relay may therefore appear under an anonymous/opaque Grid identifier such as `Relay 7C31`, with operational data such as:

- Eager/Reluctant behavior where known;
- last heard;
- hop/path evidence;
- useful capability; and
- local path score/quality.

Do not reveal a private vessel identity merely because the Station internally has enough identity material to route, authenticate, account, or deduplicate traffic.

Reluctant relays are intentionally non-advertising/fallback behavior. While usable eager relays are known, reluctant relays should not normally be presented as equivalent advertised relay choices. If diagnostic/fallback evidence makes them useful to show, visually de-emphasize them and state that they are reluctant/fallback observations. Their absence from the normal map is not proof that none exist.

Current project-level Eager/Reluctant semantics remain authoritative; this visualization does not create a new relay mode.

## Regional and jurisdiction overlays

The map may display geographic data that helps explain:

- registered regional OChat/group applicability;
- nearby regions;
- regulatory profiles;
- emergency-routing jurisdictions; and
- other signed/versioned operational geography.

These overlays must carry source/version/freshness where relevant and must not be presented as a substitute for authoritative legal or navigational data.

Where a regulatory or emergency-routing dataset is stale/unknown, the UI should expose that uncertainty rather than drawing a confident boundary from obsolete fixture data.

## Grid / Topology View

The alternative Grid view places the local Station at the center and visualizes network proximity instead of geography.

### Concentric hop rings

Concentric rings represent observed/estimated hop distance such as:

- 1 hop;
- 2 hops;
- 3 hops;
- 4+ hops / farther-known Grid.

Ring position means **network/hop proximity**, not miles, nautical miles, radio range, or geographic distance.

A station on an outer ring may be physically close but network-distant, while a surprising HF path may produce a direct/low-hop observation over a large geographic distance. The UI must not imply otherwise.

### Topology markers

The topology view may show:

- known vessels/Stations;
- anonymous eager relays;
- de-emphasized reluctant/fallback relays where appropriate;
- gateways;
- other known Grid nodes; and
- the current preferred/observed path where evidence supports it.

A marker may show numerical last-heard age and a local path/link score. Placement within a ring may use signal/path score or visual spacing, but must not masquerade as actual geographic position.

### Scores are machine evidence, not social reputation

Path/link/reliability scores are local operational evidence used to explain or assist automatic selection. They are not a public reputation leaderboard and should not encourage users to manually rank vessels socially.

The UI should prefer understandable terms such as `path quality`, `last heard`, `historical success`, or `score` with context rather than exposing a universal reputation number as if it were authoritative everywhere.

## Filtering and accessibility

All map/topology evidence classes should have practical filters so users can reduce clutter and answer a specific question.

Filters and markers must remain understandable without color. Provide text labels, icons/shapes, accessible names, keyboard navigation where practical, and numeric freshness/score values.

## Dashboard integration

The persistent OceanMail communications status surface should open the richer Dashboard rather than expanding detailed network controls inline.

The Dashboard should expose at least two useful entry points when supported:

- **GPS / Position** → open the geographic Map mode;
- **Grid Visibility** → open the Grid / Topology mode.

The Dashboard answers `what is happening now`: Internet/radio/Grid freshness, active work, budgets, location, known Grid visibility, and important warnings.

Deep configuration, diagnostics, logs, radio setup, relay/gateway policy, and other operator controls belong to Station management rather than being duplicated as Dashboard business logic.

## Evidence truthfulness

A displayed marker is an observation or authorized data item, not proof of current reachability.

The visualization must distinguish where practical among:

- current/strong evidence;
- last-known/stale evidence;
- inferred/estimated topology;
- unavailable/unknown state; and
- explicit fixture/demo data.

Do not show seeded prototype gateways, vessels, regions, scores, or jurisdiction boundaries as real observations.

Multi-hop forwarding remains evidence-gated in OceanMail 0.2. The presence of hop rings is a visualization requirement for known/observed topology and future capability, not authorization to implement or claim a global mesh.

## Ownership

- **Client/Desktop:** presentation, filters, accessibility, map/topology interaction, consensual-contact display.
- **Station:** authoritative local observations, best-known vessel position, Grid topology/path evidence, gateway/relay observations, freshness, and diagnostics exposed through authenticated APIs.
- **Server/service:** authoritative hosted registry/policy/geographic datasets where applicable.
- **Map data provider:** basemap geography only; it does not become the authority for OceanMail Grid, account, regulatory, or emergency state.
