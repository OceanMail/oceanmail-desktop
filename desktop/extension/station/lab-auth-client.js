// Explicit Phase 4J laboratory adapter. Not production enrollment or a private
// Available API. Credentials stay in this in-memory closure, never browser storage.
const ID = /^[A-Za-z0-9_.:-]{1,128}$/;
// URL parsers normalize dot-only path segments, even when encodeURIComponent
// is used. Never let an account-scoped read target the broader context route.
const validAccountId = (id) => typeof id === "string" && ID.test(id) && id !== "." && id !== "..";
const ROLES = new Set(["owner_captain", "admin", "operator", "user"]);
const STATION_PERMISSIONS = new Set(["auth_context_read", "station_status_read", "station_admin"]);
const ACCOUNT_PERMISSIONS = new Set([
  "context_read", "available_read", "retrieval_plan_read", "retrieval_plan_write", "accounting_read"
]);

function failure(code) {
  const error = new Error(`Laboratory Station authentication: ${code}`);
  error.code = code;
  return error;
}

function permissions(value, allowed) {
  return Array.isArray(value) && new Set(value).size === value.length &&
    value.every((permission) => allowed.has(permission));
}

function parseContext(value, expected, accountId) {
  if (!value || typeof value !== "object" ||
      value.authentication !== "laboratory_runtime_bearer" ||
      value.station_id !== expected.stationId || value.user_id !== expected.userId ||
      value.device_id !== expected.deviceId || !ROLES.has(value.role) ||
      typeof value.device_trusted !== "boolean" ||
      !Number.isSafeInteger(value.expires_at_unix) || value.expires_at_unix <= Date.now() / 1000 ||
      !permissions(value.permissions, STATION_PERMISSIONS) || !Array.isArray(value.account_grants)) {
    throw failure("invalid_context");
  }
  const seen = new Set();
  const grants = value.account_grants.map((grant) => {
    if (!grant || !validAccountId(grant.account_id) ||
        seen.has(grant.account_id) || !permissions(grant.permissions, ACCOUNT_PERMISSIONS)) {
      throw failure("invalid_context");
    }
    seen.add(grant.account_id);
    return Object.freeze({ account_id: grant.account_id, permissions: Object.freeze([...grant.permissions]) });
  });
  if (accountId !== undefined &&
      (grants.length !== 1 || grants[0].account_id !== accountId || !grants[0].permissions.includes("context_read"))) {
    throw failure("invalid_context");
  }
  if (accountId === undefined && !value.permissions.includes("auth_context_read")) {
    throw failure("invalid_context");
  }
  // Allowlisted output: no arbitrary response properties (including a mistakenly
  // echoed credential) escape the adapter. This is validation, not authorization.
  return Object.freeze({
    station_id: value.station_id, user_id: value.user_id, role: value.role,
    permissions: Object.freeze([...value.permissions]), device_id: value.device_id,
    device_trusted: value.device_trusted, account_grants: Object.freeze(grants),
    expires_at_unix: value.expires_at_unix, authentication: value.authentication
  });
}

export function createLabAuthClient({ laboratoryOnly, baseUrl, token, stationId, userId, deviceId } = {}) {
  let url;
  try { url = new URL(baseUrl); } catch { throw failure("invalid_configuration"); }
  if (laboratoryOnly !== true || url.protocol !== "http:" ||
      url.hostname !== "127.0.0.1" || url.username || url.password ||
      url.pathname !== "/" || url.search || url.hash ||
      typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token) ||
      ![stationId, userId, deviceId].every((id) => typeof id === "string" && ID.test(id))) {
    throw failure("invalid_configuration");
  }
  const origin = url.origin;
  const expected = { stationId, userId, deviceId };

  async function read(path, accountId) {
    let response;
    try {
      response = await fetch(`${origin}${path}`, {
        method: "GET", headers: { Authorization: `Bearer ${token}` },
        cache: "no-store", credentials: "omit", redirect: "error",
        referrerPolicy: "no-referrer", signal: AbortSignal.timeout(5000)
      });
    } catch {
      // Raw network errors can embed URLs/headers. Never propagate them.
      throw failure("connection_failed");
    }
    if (response.status === 401) throw failure("unauthorized");
    if (response.status === 403) throw failure("forbidden");
    if (!response.ok) throw failure("unavailable");
    let value;
    try { value = await response.json(); } catch { throw failure("invalid_context"); }
    return parseContext(value, expected, accountId);
  }

  return Object.freeze({
    context: () => read("/api/v1/auth/context"),
    accountContext: (accountId) => {
      if (!validAccountId(accountId)) {
        return Promise.reject(failure("invalid_account_id"));
      }
      return read(`/api/v1/accounts/${encodeURIComponent(accountId)}/auth/context`, accountId);
    }
  });
}
