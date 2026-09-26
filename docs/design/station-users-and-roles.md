# Station Users and Roles

- **Status:** Accepted design direction

## Shared Station model

One OceanMail Station may serve multiple users and multiple client devices on the same vessel or site.

The Station is autonomous and may run headless. User clients connect over an authenticated local network/API and may come and go without stopping Station background work.

## Role model

The intended baseline roles are:

### Station Owner / Captain

- root product-level ownership/recovery authority for the Station;
- assign/revoke Station Admin authority;
- manage critical Station configuration and ownership/recovery settings;
- exercise all normal Station administration functions.

### Station Admin

- delegated Station administration subject to Owner policy;
- manage ordinary Station configuration, users/roles permitted by policy, queues, links, diagnostics, updates, and operational settings;
- does not automatically inherit Owner-only recovery/ownership powers.

### Operator

- perform allowed operational actions such as queue controls, connection/transport operations, and diagnostics;
- cannot change ownership/security-sensitive policy unless explicitly granted.

### User

- use their own OceanMail account/mailbox;
- submit and receive their own communications;
- view Station status and their own queue/synchronization information as permitted.

Exact permissions and delegation constraints remain open and require an explicit permission matrix before implementation.

## Administration is not mailbox ownership

Station authority and personal account authority are separate.

A Station Owner/Admin may remove a user's local Station association or perform authorized operational actions without gaining silent read/unlock access to that user's private mailbox, contacts, calendar, or credentials.

## Device trust is separate

A laptop/phone being paired with or known to the Station does not grant administrator authority.

Authorization requires:

```text
trusted/paired device
        +
authenticated user
        +
assigned role/permission
        =
allowed Station action
```

Device credentials should be individually revocable.

## Locked/offline users

A user may lock/log out of their client while the account remains associated with the Station for permitted background operations.

Background receive/synchronization can continue without exposing private local content to other Station users.

Sending as a user or reading protected private content requires appropriate current authentication.

## Vessel/Station identity

Station administration, vessel identity, vessel OMail identity, and personal user identity are distinct concepts.

A vessel may have an addressable vessel/ship identity while crew retain separate personal accounts. Exact vessel-account delegation rules remain to be finalized.