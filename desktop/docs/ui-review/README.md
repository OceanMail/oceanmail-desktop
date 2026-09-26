# PR #7 final verification workstation product verification

Final live verification performed on local verification workstation (Debian/KDE) on 2026-09-10 against the pinned Thunderbird 140.14.0esr build and the real two-account SMTP/IMAP development lab.

Verified implementation HEAD before documentation-only cleanup:

`0812a99a0a7d1cb52647a7b865c9f4e78583840d`

## LIVE / PRODUCT — PASS

A genuine cold launch initializes OceanMail without requiring New Message or another incidental extension wake event:

- Station is present immediately.
- Emergency is present immediately.
- Available is present immediately for Ship and Bob.
- Sent integration is present immediately.
- Chat is hidden in the dedicated OceanMail profile.
- Native Local Folders is hidden, so Thunderbird's Local Folders Outbox is not exposed as a user-facing OceanMail destination.

Per-account mail presentation observed for both Ship and Bob:

```text
Inbox
Available
Saved
Drafts
Sent
Trash
```

`Trash` is the account's normal real IMAP `\Trash` special-use folder. It is expected and does not conflict with the OceanMail rule that there is no user-facing Outbox.

Restart verification also passed:

- no duplicate Station or Emergency Spaces;
- no duplicate Available rows;
- no duplicate OceanMail Status column/listener behavior;
- Local Folders remains hidden;
- Ship and Bob mail folders remain intact;
- Sent status presentation remains truthful.

The Cards/Table compromise is accepted for this alpha: Thunderbird Cards View cannot render the custom OceanMail Status column, so the Sent banner truthfully reports that limitation and provides the view-mode-independent Sent-details path. OceanMail does not force Thunderbird globally into Table View.

## STATIC / UNIT — PASS

- `npm test`: 86/86 passed.
- `npm run lint`: passed; 32 warnings plus the documented tolerated privileged-Experiment manifest error.
- The Local Folders regression test fails against the pre-fix implementation and passes with the direct live setter correction.

## INTEGRATION / CI — PASS

GitHub Actions workflow `OceanMail Desktop` run #51 passed for exact implementation HEAD `0812a99a0a7d1cb52647a7b865c9f4e78583840d` on the OceanMail organization self-hosted Linux runner.

## Screenshot policy

The earlier PNG captures in this directory were from superseded live-review states and have been removed rather than retained as misleading product evidence. Current acceptance is recorded textually here; future screenshots should only be added when they correspond to a clearly identified verified HEAD.
