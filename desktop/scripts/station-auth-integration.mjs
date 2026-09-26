// Opt-in cross-repository integration. Never searches for credentials or clones
// private repositories: the caller supplies an already-built Station binary.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, writeFile, readFile, readdir, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { createLabAuthClient } from "../extension/station/station-client.js";

if (!process.env.OCEANMAIL_STATION_BINARY) {
  throw new Error("Set OCEANMAIL_STATION_BINARY to the built Phase 4J Station binary");
}
const binary = resolve(process.env.OCEANMAIL_STATION_BINARY);
const directory = await mkdtemp(join(tmpdir(), "oceanmail-client-auth-"));
const aliceToken = randomBytes(32).toString("hex");
const adminToken = randomBytes(32).toString("hex");
let child;
let exited;
let logs = "";

async function stop() {
  if (child && child.exitCode === null && child.signalCode === null) {
    child.kill("SIGINT");
    const timeout = setTimeout(() => child.kill("SIGKILL"), 5000);
    try { await exited; } finally { clearTimeout(timeout); }
  }
}

try {
  const authFile = join(directory, "auth.json");
  const expires = Math.floor(Date.now() / 1000) + 300;
  await writeFile(authFile, JSON.stringify({ laboratory_only: true, credentials: [
    { token: aliceToken, user_id: "user-alice", role: "user", permissions: ["auth_context_read"],
      device_id: "device-alice", device_trusted: false,
      account_grants: [{ account_id: "account-alice", permissions: ["context_read", "available_read"] }],
      expires_at_unix: expires },
    { token: adminToken, user_id: "user-admin", role: "admin", permissions: ["auth_context_read", "station_admin"],
      device_id: "device-admin", device_trusted: true, account_grants: [], expires_at_unix: expires }
  ] }), { mode: 0o600 });
  const postqueue = join(directory, "postqueue");
  await writeFile(postqueue, "#!/bin/sh\nexit 0\n", { mode: 0o700 });
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const port = server.address().port;
  await new Promise((done) => server.close(done));
  const baseUrl = `http://127.0.0.1:${port}`;
  const env = { ...process.env, OCEANMAIL_BIND: `127.0.0.1:${port}`,
    OCEANMAIL_STATE_DB: join(directory, "station.db"), OCEANMAIL_POSTQUEUE: postqueue,
    OCEANMAIL_LAB_AUTH_FILE: authFile };
  async function start() {
    child = spawn(binary, [], { env, stdio: ["ignore", "pipe", "pipe"] });
    let spawnFailed = false;
    child.on("error", () => { spawnFailed = true; });
    exited = once(child, "exit");
    exited.catch(() => {});
    child.stdout.on("data", (data) => { logs += data; });
    child.stderr.on("data", (data) => { logs += data; });
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      if (spawnFailed || child.exitCode !== null) throw new Error("Station startup failed");
      try {
        const response = await fetch(`${baseUrl}/api/v1/health`, { signal: AbortSignal.timeout(1000) });
        if (response.ok) return (await response.json()).station_id;
      } catch { /* bounded readiness wait */ }
      await delay(25);
    }
    throw new Error("Station readiness timed out");
  }
  const stationId = await start();
  const alice = createLabAuthClient({ laboratoryOnly: true, baseUrl, token: aliceToken,
    stationId, userId: "user-alice", deviceId: "device-alice" });
  const before = await alice.context();
  assert.equal(before.device_trusted, false);
  assert.equal((await alice.accountContext("account-alice")).account_grants[0].account_id, "account-alice");
  await assert.rejects(alice.accountContext("account-bob"), { code: "forbidden" });
  const admin = createLabAuthClient({ laboratoryOnly: true, baseUrl, token: adminToken,
    stationId, userId: "user-admin", deviceId: "device-admin" });
  assert.equal((await admin.context()).role, "admin");
  await assert.rejects(admin.accountContext("account-alice"), { code: "forbidden" });
  const wrong = createLabAuthClient({ laboratoryOnly: true, baseUrl, token: randomBytes(32).toString("hex"),
    stationId, userId: "user-alice", deviceId: "device-alice" });
  await assert.rejects(wrong.context(), { code: "unauthorized" });
  await stop();
  assert.equal(await start(), stationId);
  assert.deepEqual(await alice.context(), before);
  await stop();
  delete env.OCEANMAIL_LAB_AUTH_FILE;
  await start();
  await assert.rejects(alice.context(), { code: "unauthorized" });
  await stop();
  for (const token of [aliceToken, adminToken]) assert.equal(logs.includes(token), false);
  for (const name of await readdir(directory)) {
    if (name === "auth.json") continue;
    const content = await readFile(join(directory, name));
    for (const token of [aliceToken, adminToken]) assert.equal(content.includes(Buffer.from(token)), false);
  }
  console.log("PASS: actual Desktop adapter / Station HTTP contract, account isolation, bounded admin, restart, fail-closed reprovision and secret checks");
} finally {
  await stop();
  await rm(directory, { recursive: true, force: true });
}
