// Pure formatting helpers for the persistent communications status surface
// and Dashboard. No DOM/browser dependency so these are directly unit
// testable.
//
// docs/design/client-user-experience.md: "Because intermittent connectivity
// is normal, freshness such as `last contacted 7 min ago` is often more
// truthful than a binary `connected` light." This module exists so that
// wording lives in one tested place instead of being duplicated across the
// status bar, Dashboard, and Watch view.

/**
 * @param {number} nowUnix - current time, seconds since epoch
 * @param {number|null|undefined} lastContactUnix - seconds since epoch, or
 *   null/undefined if there has never been contact
 * @returns {string} e.g. "last contact 7m", "just now", "no contact yet"
 */
export function formatFreshness(nowUnix, lastContactUnix) {
  if (lastContactUnix == null) {
    return "no contact yet";
  }
  const deltaSeconds = Math.max(0, Math.round(nowUnix - lastContactUnix));
  if (deltaSeconds < 10) {
    return "just now";
  }
  if (deltaSeconds < 60) {
    return `last contact ${deltaSeconds}s`;
  }
  const minutes = Math.round(deltaSeconds / 60);
  if (minutes < 60) {
    return `last contact ${minutes}m`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 48) {
    return `last contact ${hours}h`;
  }
  const days = Math.round(hours / 24);
  return `last contact ${days}d`;
}

/**
 * @param {number|null|undefined} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (bytes == null || Number.isNaN(bytes)) {
    return "—";
  }
  if (bytes < 1000) {
    return `${bytes} B`;
  }
  if (bytes < 1_000_000) {
    const kb = bytes / 1000;
    return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  }
  const mb = bytes / 1_000_000;
  return `${mb.toFixed(1)} MB`;
}

/**
 * @param {number|null|undefined} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  if (seconds == null || Number.isNaN(seconds)) {
    return "—";
  }
  if (seconds < 1) {
    return "<1 sec";
  }
  if (seconds < 60) {
    return `~${Math.round(seconds)} sec`;
  }
  const totalMinutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  if (totalMinutes < 60) {
    return remainingSeconds > 0
      ? `~${totalMinutes}m ${String(remainingSeconds).padStart(2, "0")}s`
      : `~${totalMinutes} min`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  return `~${hours}h ${remainingMinutes}m`;
}

/**
 * @param {number|null|undefined} unixSeconds
 * @returns {string} short local time-of-day/date label for evidence timestamps
 */
export function formatTimestamp(unixSeconds) {
  if (unixSeconds == null) {
    return "—";
  }
  const date = new Date(unixSeconds * 1000);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}
