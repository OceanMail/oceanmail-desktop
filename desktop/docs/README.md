# Desktop implementation evidence and work records

This directory contains **Desktop/Thunderbird implementation evidence**, active implementation trackers, compatibility proofs, correction records, tranche progress logs, and UI review material.

It is not a second product-design authority tree. Accepted Desktop product semantics and architecture remain under `../../docs/`, subject to organization-level authority in `OceanMail/oceanmail-project`.

## Current implementation references

Use these when a task depends on implementation-specific state or evidence:

- `MAIL_MODEL_CORRECTION.md` — current implementation-level description of the account-scoped Mail model and the corrections that established it. Accepted decisions and current `../../docs/` design remain higher authority.
- `STATION_API_CONTRACT_GAPS.md` — active implementation tracker for Station API capabilities/gaps encountered by Desktop.
- `THUNDERBIRD_BASELINE.md` — pinned Thunderbird baseline and integration evidence.
- `STATION_COMPATIBILITY_PROOF.md` — compatibility/proof evidence for Desktop↔Station behavior.
- `ui-review/` — UI review evidence and captures; evidence, not product authority by itself.

## Historical work records

These files are retained for provenance and implementation history. They should not be read as current product state without reconciling them against later decisions/designs and the current implementation references above:

- `TRANCHE2_PROGRESS.md` — historical Tranche 2 progress/save-state.
- `TRANCHE3_PROGRESS.md` — historical Tranche 3 save-state; partially superseded by the native-Thunderbird-shell correction and later mail-model work.
- `TRANCHE3_CORRECTION_NOTES.md` — historical running log for the native-Thunderbird-shell correction; superseded for current Mail-model state by `MAIL_MODEL_CORRECTION.md`.

## Maintenance rule

Progress and correction logs are allowed to remain as durable evidence after work lands, but they must be clearly marked historical/superseded when they cease to describe current state. Do not create an accumulating chain of parallel "current" correction notes. When later work replaces a record:

1. preserve the old file when its evidence/provenance remains useful;
2. mark its status explicitly;
3. point to the current successor document;
4. keep accepted product/design decisions in `../../docs/`, not in progress logs.

A historical record may contain statements that were true when written but are now stale. Preserve those statements as history rather than silently rewriting chronology; add status/supersession framing instead.
