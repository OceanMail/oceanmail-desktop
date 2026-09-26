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
can exercise this adapter against a built Station PR #48 binary; it uses only
generated synthetic identities and ephemeral credentials. Set
`OCEANMAIL_STATION_BINARY` to the binary path and run that script with Node.
LIVE / PRODUCT: no Thunderbird GUI or production enrollment claim.

Real Available integration remains blocked on accepted holder-authorized
metadata, account-bound logical identities, protected durable intent and
revocation/expiry semantics. Unknown accounting is unavailable, not zero or
unlimited credit. The fixture planner remains non-authoritative.
