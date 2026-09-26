import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { createLabAuthClient } from "./station-client.js";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const config = {
  laboratoryOnly: true, baseUrl: "http://127.0.0.1:8080", token: "a".repeat(64),
  stationId: "station-a", userId: "user-a", deviceId: "device-a"
};
function context() {
  return {
    station_id: "station-a", user_id: "user-a", device_id: "device-a", role: "user",
    device_trusted: false, permissions: ["auth_context_read"],
    account_grants: [{ account_id: "account-a", permissions: ["context_read"] }],
    expires_at_unix: Math.floor(Date.now() / 1000) + 600,
    authentication: "laboratory_runtime_bearer"
  };
}
function respond(value, status = 200) {
  globalThis.fetch = async () => ({ ok: status === 200, status, json: async () => value });
}

test("lab adapter sends only header credentials, suppresses redirects/cookies/cache and binds identity", async () => {
  const expected = context();
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "http://127.0.0.1:8080/api/v1/auth/context");
    assert.equal(options.headers.Authorization, `Bearer ${config.token}`);
    assert.equal(options.redirect, "error");
    assert.equal(options.cache, "no-store");
    assert.equal(options.credentials, "omit");
    assert.equal(options.referrerPolicy, "no-referrer");
    assert.ok(options.signal instanceof AbortSignal);
    return { ok: true, status: 200, json: async () => expected };
  };
  const client = createLabAuthClient(config);
  assert.deepEqual(await client.context(), expected);
  assert.equal(JSON.stringify(client).includes(config.token), false);
});

test("account scope uses exact path and rejects foreign or mixed-account results", async () => {
  const value = context();
  globalThis.fetch = async (url) => {
    assert.equal(url, "http://127.0.0.1:8080/api/v1/accounts/account-a/auth/context");
    return { ok: true, status: 200, json: async () => value };
  };
  assert.deepEqual(await createLabAuthClient(config).accountContext("account-a"), value);
  for (const grants of [[], [{ account_id: "account-b", permissions: ["context_read"] }],
                        [...value.account_grants, { account_id: "account-b", permissions: ["context_read"] }]]) {
    respond({ ...value, account_grants: grants });
    await assert.rejects(createLabAuthClient(config).accountContext("account-a"), { code: "invalid_context" });
  }
});

test("runtime lab configuration refuses non-loopback, ambiguous base URLs, invalid IDs and tokens before fetch", () => {
  globalThis.fetch = () => { assert.fail("must not fetch"); };
  for (const change of [
    { laboratoryOnly: false }, { baseUrl: "https://example.test" }, { baseUrl: "http://192.168.1.1" },
    { baseUrl: "http://localhost:8080" }, { baseUrl: "http://[::1]:8080" }, { baseUrl: "http://127.0.0.1/private" },
    { baseUrl: "http://user:secret@127.0.0.1" }, { baseUrl: "http://127.0.0.1?token=secret" },
    { baseUrl: "http://127.0.0.1#secret" }, { token: "short" }, { userId: "" }, { deviceId: "../other" }
  ]) {
    assert.throws(() => createLabAuthClient({ ...config, ...change }), { code: "invalid_configuration" });
  }
});

test("invalid account path is rejected without issuing a request", async () => {
  globalThis.fetch = () => { assert.fail("must not fetch"); };
  for (const id of ["", ".", "..", "%2e", "%2E%2e", "../account-b", "a?token=bad", undefined]) {
    await assert.rejects(createLabAuthClient(config).accountContext(id), { code: "invalid_account_id" });
  }
});

test("HTTP denial and network errors never expose response bodies or raw credential-bearing errors", async () => {
  for (const [status, code] of [[401, "unauthorized"], [403, "forbidden"], [503, "unavailable"], [302, "unavailable"]]) {
    respond({ token: config.token }, status);
    await assert.rejects(createLabAuthClient(config).context(), { code });
  }
  globalThis.fetch = async () => { throw new Error(config.token); };
  await assert.rejects(createLabAuthClient(config).context(), (err) =>
    err.code === "connection_failed" && !err.message.includes(config.token) && !err.cause);
});

test("malformed, expired, wrong-principal or widened contexts fail closed", async () => {
  for (const change of [
    { station_id: "other" }, { user_id: "other" }, { device_id: "other" },
    { authentication: "production" }, { role: "superuser" }, { device_trusted: "true" },
    { expires_at_unix: 1 }, { permissions: ["all"] }, { permissions: [] },
    { permissions: ["auth_context_read", "auth_context_read"] },
    { account_grants: [{ account_id: "a", permissions: ["all"] }] },
    { account_grants: [{ account_id: ".", permissions: ["context_read"] }] },
    { account_grants: [{ account_id: "..", permissions: ["context_read"] }] },
    { account_grants: [context().account_grants[0], context().account_grants[0]] }
  ]) {
    respond({ ...context(), ...change });
    await assert.rejects(createLabAuthClient(config).context(), { code: "invalid_context" });
  }
  for (const value of [null, {}, [], "context"]) {
    respond(value);
    await assert.rejects(createLabAuthClient(config).context(), { code: "invalid_context" });
  }
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => { throw new Error(config.token); } });
  await assert.rejects(createLabAuthClient(config).context(), { code: "invalid_context" });
});

test("validated output is immutable, discards extra fields and does not cache a previous principal", async () => {
  respond({ ...context(), token: config.token });
  const client = createLabAuthClient(config);
  const value = await client.context();
  assert.equal("token" in value, false);
  assert.equal(value.device_trusted, false);
  assert.throws(() => value.account_grants[0].permissions.push("available_read"), TypeError);
  respond({}, 401);
  await assert.rejects(client.context(), { code: "unauthorized" });
});
