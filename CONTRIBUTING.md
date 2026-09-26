# Contributing

Source and documentation licenses are published in [LICENSING.md](LICENSING.md).
Fork this public repository, create a topic branch and submit a pull request
against `main`. Maintainers review and merge; upstream write access is unnecessary.
No DCO or additional inbound agreement is adopted.

For CI validation, use Node.js 22 and run `npm ci`, `npm run lint`, and `npm test`
from the `desktop/` directory. Read [the documentation index](docs/README.md) for the
Thunderbird foundation, client boundaries and implementation guidance. Hosted CI
validates the current tests; it does not establish a supported production release.
Do not include credentials, private mail, personal profiles or operational data.
