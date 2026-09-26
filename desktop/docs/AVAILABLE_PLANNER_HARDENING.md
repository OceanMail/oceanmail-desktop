# Available fixture-planner hardening

This is client planning behavior only. It does not implement Station issue #24,
persist a plan, authorize a holder, reserve/debit credit, or retrieve content.
All rows, budgets and approval state remain visibly development fixtures.

Corrections against the accepted Available logical contract:

- `setOrder` accepts exactly one permutation of selected work. Duplicate IDs,
  missing/foreign IDs and non-arrays are rejected without partial mutation.
- Selected work includes attachment-only messages. Adding a body or attachment
  to an already-selected message retains its order; removing one component keeps
  the slot while another remains selected. Removing the last component removes
  the slot. Body checkbox state remains separate from selected-work ordering.
- Message hold clears body and attachment choices and removes that message from
  active planning totals/order. Held or ineligible messages cannot gain an
  attachment selection. Clearing/defer remains allowed. Resume never silently
  reselects cleared work; the recipient must select it again under current
  eligibility/budget checks.
- Move actions accept only an integer direction of -1 or +1. Invalid direction
  cannot corrupt the ordering.
- The attachment picker is disabled while its message is held, matching the
  model guard and avoiding an enabled control that can only fail.

The existing row order controls consume the same selected-work order, so
attachment-only selections can now be moved with the same controls. No new
transport priority, automatic Important ordering, RF precedence or account
authorization is introduced. The backend must independently validate all future
real requests; this model is not a security boundary.

STATIC / UNIT: regression coverage for malformed permutations, aliasing, hold
after attachment selection, ineligible/held attachment changes, clear/defer,
attachment-only membership/moves, partial-component removal, invalid direction
and per-instance isolation. A minimal-DOM view test executes the real Hold/Resume
handlers and checks picker disabled/deferred state. Full Node suite and existing
lint apply; the test double is not a live Thunderbird UI check.

LIVE / PRODUCT: no new native chrome/DOM structure; actual Thunderbird interaction
has not been verified for these model changes. Existing fixture labels remain.
