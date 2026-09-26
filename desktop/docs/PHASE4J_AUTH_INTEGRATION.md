# Phase 4J laboratory Station client integration

This is an opt-in development adapter for the actual context endpoints in
[Station PR #48](https://github.com/OceanMail/oceanmail-station-archive/pull/48), not a
production login mechanism. It is not enabled in the normal Thunderbird UI and
does not replace Available fixtures, authorize account provisioning, or expose
private Station evidence.

`createLabAuthClient`, exported from `extension/station/station-client.js`, takes
explicit `laboratoryOnly: true`, a literal `127.0.0.1` HTTP base URL, an in-memory
runtime token, and expected `stationId`, `userId`, and `deviceId` supplied by the
lab provisioner. IPv6/localhost names are intentionally rejected because the
packaged extension grants only the IPv4 loopback host permission. `context()`
reads `/api/v1/auth/context`; `accountContext(id)`
reads `/api/v1/accounts/{id}/auth/context` and requires that exact account scope.
No token is stored in browser preferences/local storage or exposed as a client
object property. Do not pass real mailbox credentials or send these tokens over
radio, a LAN, or a remotely accessible proxy.

The adapter rejects non-loopback/credential-bearing/query/path base URLs, follows
no redirects, sends no cookies/referrers, disables caching and bounds requests
to five seconds. Errors expose only stable codes, not response bodies or raw
network exceptions. Successful responses are checked against the expected
principal/Station/device, expiry, role/permission vocabulary and exact requested
account scope. Unknown response fields are discarded and output is immutable.
These client checks do not replace Station-side authorization.

Legacy `Implemented` observation calls are unchanged. Production
`NotYetAvailable.authenticate`, Available, budget and Emergency methods still
fail explicitly. Station's global `api_authentication: false` remains truthful:
the legacy lab evidence API is not protected by this new context-only slice.

STATIC / UNIT: Node tests exercise request restrictions, identity/scoping,
redacted errors, schema rejection, immutable results and no stale auth fallback.
INTEGRATION: the opt-in process harness in `scripts/station-auth-integration.mjs`
exercises this adapter against a real, built Station binary over a real loopback
HTTP connection — two synthetic users/accounts (`alice`, `admin`) with
freshly-generated ephemeral tokens, covering allowed vs. denied account scope,
an unknown token, an already-expired token, restart with identity preserved,
laboratory auth left entirely unconfigured (env var absent — Station starts
with zero credentials, still unauthorized), the configured credential file
itself missing from disk (reprovision/misconfiguration — Station refuses to
start at all; these are two different Station code paths and the harness
exercises both separately rather than treating "unset" and "missing" as the
same scenario), the service becoming unavailable (Station stopped, a real
closed loopback port), and no token ever appearing in the child process's
logs or any file it wrote. Set `OCEANMAIL_STATION_BINARY` to a built Station
binary and run that script with Node; set `OCEANMAIL_STATION_REPO` to a
Station checkout as well so the run prints the exact Station commit tested
alongside Desktop's own (`git rev-parse HEAD` in this repo, flagged loudly if
that checkout has uncommitted changes). Neither commit line is independently
verified against what actually ran: Desktop's is read from the checkout the
script itself lives in, and Station's is only what `OCEANMAIL_STATION_REPO`
asserts — nothing here rebuilds the binary from that checkout to prove the
pairing, though the script does refuse to proceed when the binary predates
the asserted commit, since it cannot have been built from a commit that did
not exist yet. A passing run is reproducible evidence only to that extent,
not an independently-verified guarantee. "Malformed responses" from Station
are not separately exercised here: Station's real HTTP layer only speaks
well-formed JSON, so client-side schema rejection is a STATIC/UNIT concern
(above) rather than something a real, correctly-behaving Station process can
be made to produce in this integration harness.
LIVE / PRODUCT: no Thunderbird GUI or production enrollment claim.

Real Available integration remains blocked on accepted holder-authorized
metadata, account-bound logical identities, protected durable intent and
revocation/expiry semantics. Unknown accounting is unavailable, not zero or
unlimited credit. The fixture planner remains non-authoritative.
