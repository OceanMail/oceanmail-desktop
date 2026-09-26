# Tranche 3 correction — historical running decision log

> **Status: Historical implementation evidence.** This file records the
> native-Thunderbird-shell correction as it happened. The former instruction
> to delete or fold this file after landing is retired; it is retained for
> provenance. For current Mail information architecture and subsequent
> corrections, use `MAIL_MODEL_CORRECTION.md`. For accepted shell/product
> semantics, use `../../docs/decisions/0007-native-thunderbird-shell.md` and
> the current documents under `../../docs/`.

Working notes for the native-Thunderbird-shell pivot (alpha correction).
Recording decisions as they were made, not at the end.

## Decisions made (reversible, proceeding without asking)

- **oceanmailChrome Experiment API**: added, scoped to exactly one function
  (`applyBranding`) that sets tooltip/aria-label only on `mailButton`/
  `chatButton` (ids confirmed in vendored `spacesToolbar.js`). Public
  `spaces.update()` cannot touch built-in spaces (throws — confirmed in
  `spaces.json`). Pure JS/DOM, cross-platform, no icon/behavior change.
- **4 new native Spaces buttons** (public `spaces.create`, no Experiment API
  needed for these — we own them): `oceanmail_available`, `oceanmail_outbox`,
  `oceanmail_station`, `oceanmail_emergency`, each `space/index.html?page=X`.
  New per-feature icons added (`icons/oceanmail-{available,outbox,station,
  emergency}-32.svg`) since 4 identical icons in the toolbar would be
  confusing.
- **Dashboard merged into Station page**, not a separate Spaces button —
  Station's own page now shows the connection check + full dashboard grid
  together. Avoids a 5th/6th button; Dashboard model/tests untouched, only
  the view composition changes.
- **Watch/Compact mode**: folded into the Station page as a density toggle
  (switches that one page between the dashboard grid and the watch-tile
  layout), not its own nav destination — matches original intent (it's a
  density mode, not a place).
- **Old "Mail" custom subnav (Inbox/Sent/Drafts/Compose) removed entirely.**
  Native Mail space already *is* Mail — no wrapping needed. Available/Outbox
  moved to their own native buttons (above) instead of being Mail sub-items.
- **Chat**: left functionally untouched (OChat network behavior stays out of
  scope, per original Tranche 3 exclusions — unchanged by this correction).
  Only its Spaces-button tooltip is relabeled via oceanmailChrome.
- **Per-page local header** (title + status pill + theme toggle, and a watch
  toggle on the Station page only) kept at the top of each of the 4 owned
  pages. This is NOT a second nav rail — it has no way to switch between
  Mail/Calendar/Available/etc, only page-local density/theme/status. Primary
  navigation is exclusively the native Spaces toolbar.

## Status: correction implemented, pushed, CI green

Historical alpha correction commits:
commits `f65c26c` (shell pivot + 4 truthfulness corrections),
`db865bd` (new screenshot set + a watch-view.js wording fix caught while
capturing them). CI (`lint`, `test` × ubuntu/windows/macos) green on both.
Live-GUI-verified in the Thunderbird dev instance: native Mail opens with
zero wrapping, all 4 new native Spaces buttons work, Station+Dashboard
render together, Watch mode and dark mode both work, Emergency no longer
opens a send-capable compose under the Emergency label.

**UPDATE — found a real bug in `oceanmailChrome.applyBranding()`, partially
fixed, not yet confirmed working.** Enabled `devtools.chrome.enabled` in the
dev profile and used the Browser Console directly (`Services.wm.getEnumerator`
from the console) to check `mailButton`/`chatButton`'s `tooltiptext`
attribute after a real run — it was `null` on both, i.e. branding never
applied, contradicting the earlier "did not throw" assumption (that was
inferred from `background.js`'s promise chain, not verified directly).

Root cause found: `chrome-branding.js` used `Services.wm...` assuming
`Services` is an ambient global in an `ExtensionAPI` parent-script scope.
Manually running the same DOM manipulation from the Browser Console (which
*does* have `Services` ambiently — it's a different, more privileged scope)
worked instantly. `experiment/implementation.js` (the existing, working
Experiment API) never relies on an ambient `Services` and always does
`ChromeUtils.importESModule("resource://gre/modules/Services.sys.mjs")`
explicitly — `chrome-branding.js` didn't follow that established pattern.
Fixed to match it (commit pending push).

**Not yet confirmed fixed**: after adding the explicit import and a full
Thunderbird restart, `tooltiptext` still read `null` from the console.
Neither `console.log`/`console.error` output containing "chrome" or "brand"
nor any uncaught-error entry appeared anywhere in the Browser Console
(parent-process or multiprocess view, Errors filter included) around
startup, despite `"[OceanMail] spaces ready: Array(4)"` from the very next
line of the same file logging correctly — so the `applyBranding()` call
itself is not erroring loudly, but also isn't visibly succeeding. Ran out of
reliable ways to pin this down further with this X11-screenshot-driven
harness (about:debugging's per-extension Inspect view, which would give a
dedicated background-page console, could not be reached — Thunderbird's
content-tab address bar would not accept typed navigation via synthetic
input in this session). Next session should open `about:debugging#/runtime/
this-thunderbird` normally (real keyboard/mouse) and click "Inspect" next to
the OceanMail extension for a clean, scoped console, or add a temporary
`browser.storage.local.set()` call inside `applyBranding()`'s try/catch to
surface the result somewhere easier to read than the console.

This is a real, currently-open defect (native Mail/Chat tooltips are not
actually relabeled), not merely an unverified cosmetic nicety as previously
stated — correcting that impression from the earlier note in this file.

## Native-shell decision dependency

The native-shell decision was a separate dependency during this correction.
It is now available in the public tree as
[the native Thunderbird shell decision](../../docs/decisions/0007-native-thunderbird-shell.md).

The decision's scope is considerably larger than what this
correction implements — it envisions OceanMail branding across ALL native
chrome (Calendar/Contacts eventually reworked, not just left native;
priority/budget controls inside compose/read/list; a truly persistent
status bar IN native chrome, not just on OceanMail's own pages). The decision's own
"Consequences" section frames the hard, immediate blocker narrowly ("the
second OceanMail primary rail is not accepted") and frames the deeper chrome
integration as future/"to be prototyped against supported APIs first" —
matching my read of the review comment itself. This correction satisfies the
hard blocker and the 4 explicit reusable-work/truthfulness items; it
deliberately does not attempt the decision's fuller aspirational scope (see escalation
notes below, written before I'd read the decision text and still accurate after).

## Escalation candidates for ChatGPT/project-lead (not blocking; noted for later)

- **Deep Mail-space integration** (toolbar button / folder-pane widget for
  Available/Outbox/Emergency reachable *from inside* the Mail space itself,
  per review bullet 4 "investigate the cleanest integration points") is
  NOT built this pass — treated as forward-looking research, not a hard
  requirement, given the 4 native Spaces buttons already give direct,
  always-visible access. If project lead wants Available/Outbox surfaced
  inside the Mail 3-pane UI itself (not just as sibling Spaces), that's a
  bigger chrome-integration design question worth a decision doc before
  building, since it goes beyond "relabel/skin" into real UI insertion.
- **A truly persistent (cross-space) status bar** — visible even while the
  user is in native Mail/Calendar, not just on OceanMail's own 4 pages —
  would require injecting chrome into `messenger.xhtml`'s toolbar area
  globally, a materially bigger Experiment surface than the tooltip-only
  branding above. Not attempted this pass; current status pill only shows
  on OceanMail's own 4 pages. Flagging as a real product question (how much
  chrome injection is acceptable) rather than deciding it unilaterally.

## Historical CI interruption

The `34e7db1` push encountered an infrastructure-level CI startup failure;
the prior `c6c8888` run passed. A job that never starts provides no test result.
This historical interruption does not describe current public CI status.
