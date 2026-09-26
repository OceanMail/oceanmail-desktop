# Publication dependency review — 2026-09-25

Scope: development tools installed by desktop/package-lock.json; not a completed
Thunderbird binary-distribution or first-party rights audit.

The initial npm audit reported four high-severity affected dependency entries:
web-ext/addons-linter/image-size and adm-zip. These are developer tooling, not
bundled OceanMail application payload. Public contribution still makes safe
handling of contributor-controlled archives/images relevant.

Update the exact web-ext pin from 10.6.0 to 10.7.0, including its supported
addons-linter 10.13.0 / image-size 2.0.4 dependency chain. The lockfile also updates
adm-zip 0.6.0 to 0.6.1. No force upgrade or dependency override is used.

References: [image-size advisory](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq),
[ICNS advisory](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr),
[adm-zip memory advisory](https://github.com/advisories/GHSA-7q85-xj36-vmfc),
[adm-zip symlink advisory](https://github.com/advisories/GHSA-vwc7-r8mq-g2x9).

Static/unit: lockfile diff reviewed; clean install with lifecycle scripts disabled,
existing lint and all 100 tests pass. npm audit after the update reports zero
known vulnerabilities on this date. Hosted Node 22 source/PR validation is recorded
in the associated PR. Existing Thunderbird/privileged-extension lint tolerances
and warnings are unchanged; no new suppression is introduced. No live GUI/RF
validation is claimed. Audit databases change; this is a dated snapshot.

## Remaining provenance limits

All 329 dependency entries have license metadata, but winreg 0.0.12 says only
BSD. Its exact npm tarball was downloaded without executing scripts and its
SHA-512 integrity matched the lockfile. It contains five files, no LICENSE file,
and no complete license text in its README/source. Package gitHead is
36cfe63a8dcb700cf44b0b7317827099d19c26c1. Do not silently interpret the old
package using a newer version's license. Clarify upstream terms before bundling
that dependency in a redistributed product; merely listing its URL is not an
OceanMail relicensing grant. Retain this item in the publication provenance review.

The approved outbound source/documentation licenses are installed. New source
and icon inputs still require provenance review; Thunderbird binary distribution
and branding obligations remain separate release gates.
