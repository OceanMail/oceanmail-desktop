# Accounts, Identities, and Mailboxes

Available account grants and logical message/component/representation identity follow the [merged Station logical contract](https://github.com/OceanMail/oceanmail-station-archive/blob/7a132b6ea4967c600dc8c673718d00b09c3ad42b/docs/AVAILABLE_MANIFEST_ACCOUNT_CONTRACT.md). Account ID is authorization scope; Thunderbird keys, email addresses, RFC Message-ID and other correlation fields are not credentials. Authenticate and authorize before disclosing private Available metadata, plans or account budgets. Native boat-to-boat holders must not require a central Server for availability; native enrollment/trust remains design work. In Station-less hosted/Lite direct-Internet operation, the hosted Server/service owns the equivalent client-authentication, account-grant and durable-plan responsibilities rather than treating the client itself as a Station.

- **Status:** Accepted 0.2 design direction

## Purpose

OceanMail distinguishes personal users, vessels, Stations, devices, and mailboxes. These concepts may be related but must not collapse into one identity or one credential.

## Identity model

At minimum OceanMail distinguishes:

- **Personal user identity** — belongs to a person and moves with them across devices and vessels.
- **Vessel identity** — stable identity for a vessel independent of current crew and individual hardware.
- **Station identity** — identifies one OceanMail Station installation/communications node.
- **Device identity** — identifies an authorized client device relationship.
- **Mailbox/account identity** — server/service delivery identity associated with a person, vessel, or supported group.

A vessel may replace radios, computers, or Station hardware without becoming a new vessel identity.

A person may use multiple devices and multiple Stations without transferring ownership of their personal identity to those devices or vessels.

## Vessel account

A vessel may have its own OMail address/account so other users can contact the ship even when they do not know which crew member is aboard.

Vessel communication authority is distinct from Station administration.

A Captain/Station Owner does not automatically obtain the right to impersonate every personal user, and a Station administrator does not automatically receive every vessel-account credential.

## Station and crew relationship

One Station may serve multiple onboard personal accounts plus a vessel account.

Users may be:

- active/authenticated;
- locally locked/logged out but still configured for permitted background synchronization; or
- removed from that Station.

Locked personal mailbox contents remain protected from other onboard users and Station administrators. Administrative authority permits management actions, not silent access to private content.

See `station-users-and-roles.md`.

## Device authorization

Each authorized device/Station relationship should use an authenticated device credential/key rather than relying on a display-only numeric ID.

Users must eventually be able to revoke:

- one device;
- a Station authorization; or
- all other devices/sessions as permitted by security policy.

When Internet reaches the Server, revocation becomes authoritative there immediately. Intermittently connected Stations/devices may learn revocation later through synchronized signed state or another suitable secure mechanism.

Exact key formats and enrollment protocols remain security design work.

## Client enrollment

A client with direct Internet access may authenticate to OceanMail services using the account's supported authentication flow.

A client connected only to a local Station may request access to its own account through that Station. Station administrative authority alone must not silently grant access to another user's private mailbox; user authentication or an explicitly authorized delegation is required.

The product should not depend exclusively on SMS as a second factor because offshore users may lack cellular service.

## Deferred account-setting changes

Users may change supported account/server settings while connected to a Station even when the Server is unreachable.

The intended flow is:

1. user authenticates through a client;
2. client submits a permitted account change to the Station;
3. Station durably stores the pending operation;
4. client may disconnect or shut down;
5. Station later obtains Internet/service connectivity;
6. Station submits the pending operation to the Server;
7. Server accepts/rejects it and remains authoritative for resulting global state;
8. Station stores the result and presents it to clients on later connection.

Security-critical operations may require stronger/fresher authorization and may not all be safely deferrable. Password/recovery changes, account deletion, ownership transfer, and similar operations require explicit security design.

## Mailbox authority and local copies

The Server is authoritative for hosted mailbox/account state when server participation exists.

The Station may hold durable local mailbox copies, queues, pending changes, receipts, and synchronization state so the vessel remains useful while disconnected.

Clients may also hold ordinary offline client copies. A client copy does not make that client a Station/relay.

## Deletion and reconciliation

Local delete/trash actions may be recorded while disconnected and synchronized later.

A local delete must not falsely claim that every remote copy was immediately erased.

Expensive/nonurgent mailbox reconciliation should generally wait for ordinary Internet when feasible rather than consuming scarce RF solely to synchronize presentation state.

## Retention and quotas

Hosted mailboxes may have server-side quotas and retention policy.

Accepted principles:

- ordinary messages are not silently expunged merely because they are old unless an explicit service/user retention policy says so;
- users should be able to retain/protect selected messages where supported;
- mailbox-full behavior must be explicit rather than silently discarding arbitrary content;
- attachment retention may differ from message-body retention;
- Sent and received retention may eventually differ; and
- exact sizes, time periods, pricing, and service-tier values remain server/service policy rather than protocol constants.

Emergency retention/quota behavior is governed separately by emergency policy.

## Personal account lifecycle

Personal OceanMail identities are intended to be long-lived and do not require annual renewal merely to remain valid.

Account deletion requires authenticated user/service action and must account for security, abuse, billing, and retention obligations.

## Vessel account lifecycle

Vessel accounts may require periodic renewal and may be associated with proof that the claimant owns, operates, or is responsible for the vessel.

Possible supporting identifiers include MMSI, callsign, IMO number, registration/documentation identifiers, or other appropriate evidence. No single external identifier is mandatory for every vessel.

Exact renewal, dispute, recovery, billing, and hold periods are service policy.

## Service plans

Service plans may bundle a vessel account and multiple personal crew accounts. Exact plan names, account counts, quotas, prices, and redundant-Station allowances must remain configurable service policy.

They must not become protocol constants.

## Multiple Stations for one vessel

The product should preserve the future possibility that one vessel identity authorizes multiple Station installations for redundancy.

This is not part of the first 0.2 proof. Future design must address:

- active/standby or active/active roles;
- state synchronization;
- duplicate suppression;
- radio/channel coordination;
- failover authority; and
- conflict resolution.

The existence of multiple Stations must not create multiple vessel identities unless deliberately configured that way.

## Delivery groups and group mailboxes

OceanMail may later support server-managed OMail delivery groups distinct from OChat groups.

Potential forms include:

- a group address whose messages appear as labeled copies in member mailboxes; and
- a dedicated shared/group mailbox.

Membership, authorized senders, recipient limits, read-state sharing, pricing, and RF-efficient delivery semantics require server/service design before implementation.

These are durable mail addressing objects, not ephemeral OChat rooms.

## Backup and recovery

OceanMail should support secure local backup/restore for appropriate Station/client/account state.

Future server-side backup may be a service feature, but must not be conflated with ordinary mailbox synchronization.

## Ownership

- **Client:** account UI, authentication UX, local offline presentation.
- **Station:** local authorization relationships, durable disconnected copies, pending server operations, local privacy enforcement, background synchronization when a Station is present.
- **Server:** authoritative hosted identities/accounts/mailboxes, direct-Internet hosted client authorization/plan ownership when no Station exists, service plans, billing, global revocation, retention policy, and account reconciliation.
