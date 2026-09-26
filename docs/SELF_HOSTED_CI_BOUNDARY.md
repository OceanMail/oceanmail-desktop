# Public CI trust boundary

The Desktop lint/test job runs on standard GitHub-hosted Ubuntu 24.04 for pushes
and pull requests, including forks. It has contents:read, no repository secrets,
no persistent checkout credentials, no cache sharing and a 15-minute timeout.
Action source is pinned by full commit SHA. All PR paths run the same named
check so documentation-only PRs do not leave a required path-filtered check pending.
Push-head and synthetic-merge runs retain separate concurrency identities.

Administrators must keep this public repository excluded from every
trusted self-hosted runner group's access and verify there are no accessible
repository-scoped trusted runners. Workflow YAML is contributor-controlled;
its current hosted runner selection is not an immutable security boundary.
Do not use pull_request_target to execute PR code. Do not consume untrusted
PR artifacts in privileged release jobs. Check Actions defaults, external-run
approval policy and secret/environment settings whenever configuration changes.

Desktop is public with protected main and the required lint/test check.
External-fork acceptance remains unverified. Source publication and passing CI
do not independently verify administrative runner or secret-access controls.

The existing npm ci, npm run lint and npm test commands remain unchanged.
Hosted Linux checks do not establish real Thunderbird GUI behavior,
other-platform coverage, radio behavior or production security.
