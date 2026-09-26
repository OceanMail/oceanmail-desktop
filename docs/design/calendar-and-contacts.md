# Calendar and Contacts

- **Status:** Accepted product direction; not on the first OMail proof critical path

## Purpose

Calendar and Contacts remain part of the intended OceanMail client experience. They should follow the same local-first, intermittent-synchronization principles as OMail without consuming scarce RF merely to mimic an always-online cloud application.

## Contacts

Contacts should support durable local use while disconnected.

A contact may include supported OceanMail identities plus ordinary interoperable contact information where appropriate. Display names are user-facing Unicode text and are not security identities.

Potential contact state includes:

- local-only changes;
- pending Server synchronization;
- synchronized state;
- stale/remote update available;
- conflict; and
- failed/retryable synchronization.

The client should not claim a contact change is globally authoritative merely because it was saved locally.

## Recently seen

Where Station observations permit it, Contacts/Chat may offer a `Recently Seen` surface containing recently observed users, vessels, or Stations with freshness information and an `Add Contact` action.

Recently seen is observation history, not proof of current reachability or identity trust.

Unknown-sender OMail handling/filtering should be user-configurable rather than requiring every observed sender to become a saved contact.

## Personal location in contacts

A person's shared contact-card location follows `location-vessels-and-contacts.md`.

It is:

- unavailable by default;
- explicit-consent based;
- freshness/expiry bounded;
- revocable; and
- distinct from the Station's private vessel/navigation position.

Adding someone as a contact does not automatically authorize location sharing.

## Calendar

Calendar should remain useful offline for creating, editing, viewing, and organizing events already available locally.

Supported changes may be handed to a Station for later Server synchronization just like other safe deferred user state.

## Invitations

OceanMail users may invite:

- other OceanMail users; and
- ordinary external email addresses where the selected interoperability path supports conventional calendar invitation behavior.

The organizer should retain per-invitee state such as:

- pending/not yet confirmed;
- accepted;
- declined; and
- failed/undeliverable where evidence exists.

A locally created invitation is not shown as accepted until a valid remote response/evidence is received.

## Compact responses

For native OceanMail users, calendar acceptance/decline responses should be representable compactly so routine invitation state does not require retransmitting the full event body over a constrained link.

The exact wire/service encoding is not prescribed at the product layer.

## Conflicts

A calendar/contact item may be edited on multiple disconnected clients or Stations before Server reconciliation.

When automatic resolution is unsafe:

- preserve both meaningful versions;
- show the conflict to the user; and
- allow explicit resolution.

Field-level merging may be used only where the domain defines unambiguous safe rules.

## Synchronization priority

Calendar/contact synchronization is background durable state, generally below Emergency and pending OMail business but above discretionary relay/gateway contribution when Server connectivity appears.

Large nonurgent historical synchronization should prefer inexpensive Internet when practical rather than consuming scarce RF.

A small invitation/response that is explicitly part of active OMail communication may use an appropriate constrained path according to service policy.

## Station independence from clients

Once supported Calendar/Contacts changes are durably submitted to the Station, the originating laptop/phone need not remain powered on.

The Station may synchronize them when Internet/service connectivity later becomes available and retain the resulting authoritative state for the client to obtain on reconnection.

## Privacy

Station administration does not silently grant access to another user's private contacts or calendar merely because the Station performs background synchronization for that account.

Local account-lock/privacy rules apply as defined in `station-users-and-roles.md` and `accounts-identities-and-mailboxes.md`.

## Scope control

Rich collaborative calendars, shared task systems, server-wide address books, complex groupware, and extensive external-calendar-provider compatibility are not first-proof requirements.

The pre-1.0 priority is to preserve a coherent local-first foundation and useful invitations without delaying core OMail delivery.
