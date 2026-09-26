// Important-metadata normalization adapter.
//
// docs/MAIL_MODEL_CORRECTION.md's "Important interoperability" section is
// the authoritative spec this implements. Two rules matter most:
//
//  1. `Important` is ordinary message metadata only (Decision 0009). It must
//     never influence transport scheduling, Station queue precedence, relay
//     precedence, credits, or Available's automatic retrieval order — this
//     module produces a value that callers can only ever use for display.
//  2. OceanMail must not grow a permanent OceanMail-only importance field.
//     The long-term source of truth is interoperable email
//     importance/priority metadata. Stage 3 of the migration is now real:
//     `messages.MessageHeader.priority` / `compose.ComposeDetails.priority`
//     (confirmed in the pinned 140.14.0esr build,
//     `none|lowest|low|normal|high|highest`) is a recognized source via
//     `{nativePriority: "<value>"}`. Views must consume ONLY this adapter's
//     `{state, source}` output, never a source shape directly, so a further
//     real source (a real Available-manifest field, gateway-normalized
//     metadata) never requires a view change.
//
// Precedence when more than one source could apply (do not reorder): real
// authoritative message/manifest metadata (`nativePriority`) > fixture raw
// metadata shaped like production's real representation > the legacy
// fixture `important` compatibility field > unknown. Real metadata always
// wins outright and is never merged with a fixture value.
//
// `"ordinary"` and `"unknown"` are deliberately distinct and must never be
// collapsed in this layer: `"ordinary"` means the source was evaluated and
// the message is explicitly not marked Important; `"unknown"` means the
// current source cannot tell us either way (e.g. Station's real queue-
// history evidence has no importance field at all). A view may choose to
// render both with no star, but the model must keep the distinction.
//
// Emergency is a wholly separate transport/workflow concept and is never a
// value here — a message's transport class and its importance are
// independent dimensions (docs/decisions/0009-ordinary-mail-scheduling-and-
// importance.md). This module only ever normalizes the importance
// dimension.

/**
 * @typedef {"important"|"ordinary"|"unknown"} ImportanceState
 */

/**
 * @typedef {object} NormalizedImportance
 * @property {ImportanceState} state - the product-semantic value; the only field views should branch on
 * @property {"native-message"|"manifest"|"gateway"|"fixture"|"unknown"} source - provenance/debugging only, never a wire commitment, never used for scheduling
 */

/**
 * Stage 3 (docs/MAIL_MODEL_CORRECTION.md): real native Thunderbird message/
 * compose priority metadata (`messages.MessageHeader.priority` /
 * `compose.ComposeDetails.priority`, confirmed present in the pinned
 * 140.14.0esr build as `none|lowest|low|normal|high|highest`) is now a
 * recognized raw shape, via `{nativePriority: "<value>"}`. It takes
 * precedence outright over the Stage-1 legacy fixture field below — the two
 * are never merged, and a real value always wins even if a fixture value is
 * also present on the same object.
 */
const NATIVE_PRIORITY_IMPORTANT = new Set(["high", "highest"]);
const NATIVE_PRIORITY_ORDINARY = new Set(["none", "normal", "low", "lowest"]);

/**
 * @param {{nativePriority?: string, important?: boolean|null}|null|undefined} rawSource
 * @returns {NormalizedImportance}
 */
export function normalizeImportance(rawSource) {
  if (rawSource && typeof rawSource.nativePriority === "string") {
    const priority = rawSource.nativePriority;
    if (NATIVE_PRIORITY_IMPORTANT.has(priority)) {
      return { state: "important", source: "native-message" };
    }
    if (NATIVE_PRIORITY_ORDINARY.has(priority)) {
      return { state: "ordinary", source: "native-message" };
    }
    // An unrecognized string (e.g. a future Thunderbird value this adapter
    // hasn't been taught) is unknown, never guessed as ordinary.
    return { state: "unknown", source: "native-message" };
  }

  // Stage 1 (legacy, fixture-only): `true` -> "important", `false` ->
  // "ordinary", `null`/missing -> "unknown". Only ever consulted when no
  // real native-message metadata is present on the source.
  if (!rawSource || rawSource.important === null || rawSource.important === undefined) {
    return { state: "unknown", source: "unknown" };
  }
  if (rawSource.important === true) {
    return { state: "important", source: "fixture" };
  }
  return { state: "ordinary", source: "fixture" };
}
