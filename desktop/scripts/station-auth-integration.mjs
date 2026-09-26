// Opt-in cross-repository integration. Never searches for credentials or clones
// private repositories: the caller supplies an already-built Station binary.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, writeFile, readFile, readdir, rm, stat } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { createLabAuthClient } from "../extension/station/station-client.js";

if (!process.env.OCEANMAIL_STATION_BINARY) {
  throw new Error("Set OCEANMAIL_STATION_BINARY to the built Phase 4J Station binary");
}
const binary = resolve(process.env.OCEANMAIL_STATION_BINARY);

// Pin exact tested commits in the printed result, not just "it passed" — a
// green run against an unknown Desktop/Station pair is not reproducible
// evidence. OCEANMAIL_STATION_REPO (same variable
// start-station-integration-lab.sh uses) is optional here since this
// script only needs a built binary, not a checkout; when unset, that is
// reported explicitly rather than guessed.
function commitOf(repoDir) {
  try {
    return execFileSync("git", ["-C", repoDir, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}
function isDirty(repoDir) {
  try {
    return execFileSync("git", ["-C", repoDir, "status", "--porcelain"], { encoding: "utf8" }).trim().length > 0;
  } catch {
    return null;
  }
}
function commitTimestamp(repoDir, sha) {
  try {
    return Number(
      execFileSync("git", ["-C", repoDir, "show", "-s", "--format=%ct", sha], { encoding: "utf8" }).trim()
    );
  } catch {
    return null;
  }
}
const desktopRepoDir = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const desktopCommit = commitOf(desktopRepoDir);
const desktopDirty = desktopCommit ? isDirty(desktopRepoDir) : null;
const stationRepoDir = process.env.OCEANMAIL_STATION_REPO
  ? resolve(process.env.OCEANMAIL_STATION_REPO)
  : null;
const stationCommit = stationRepoDir ? commitOf(stationRepoDir) : null;

// OCEANMAIL_STATION_BINARY and OCEANMAIL_STATION_REPO are independent inputs:
// nothing here rebuilds the binary from that checkout, so this cannot prove
// the running binary actually IS that commit, only that the caller asserts
// the pairing (reflected honestly in the printed label below). The one
// contradiction catchable without doing a real build: a binary cannot have
// been built from a commit that did not exist yet.
if (stationCommit) {
  const binaryMtimeSec = (await stat(binary)).mtimeMs / 1000;
  const committedAtSec = commitTimestamp(stationRepoDir, stationCommit);
  if (committedAtSec !== null && binaryMtimeSec < committedAtSec) {
    throw new Error(
      `OCEANMAIL_STATION_BINARY (built ${new Date(binaryMtimeSec * 1000).toISOString()}) predates ` +
        `OCEANMAIL_STATION_REPO's HEAD ${stationCommit} (committed ${new Date(committedAtSec * 1000).toISOString()}); ` +
        "it cannot have been built from that commit — rebuild the binary or point OCEANMAIL_STATION_REPO at the right checkout"
    );
  }
}
console.log(
  `Desktop commit under test: ${
    desktopCommit
      ? desktopCommit +
        (desktopDirty
          ? " [DIRTY WORKING TREE — HEAD does not reflect all code actually running; not reproducible evidence]"
          : "")
      : "unknown (not a git checkout)"
  }`
);
console.log(
  `Station commit under test: ${
    stationCommit
      ? stationCommit + " (as asserted by OCEANMAIL_STATION_REPO; not independently verified against the binary)"
      : stationRepoDir
        ? "unknown (OCEANMAIL_STATION_REPO set but not a git checkout)"
        : "unknown (set OCEANMAIL_STATION_REPO to pin it) — binary path: " + binary
  }`
);

const directory = await mkdtemp(join(tmpdir(), "oceanmail-client-auth-"));
const aliceToken = randomBytes(32).toString("hex");
const adminToken = randomBytes(32).toString("hex");
const expiredToken = randomBytes(32).toString("hex");
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
      device_id: "device-admin", device_trusted: true, account_grants: [], expires_at_unix: expires },
    { token: expiredToken, user_id: "user-alice", role: "user", permissions: ["auth_context_read"],
      device_id: "device-alice", device_trusted: false,
      account_grants: [{ account_id: "account-alice", permissions: ["context_read"] }],
      expires_at_unix: Math.floor(Date.now() / 1000) - 60 }
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
  const expired = createLabAuthClient({ laboratoryOnly: true, baseUrl, token: expiredToken,
    stationId, userId: "user-alice", deviceId: "device-alice" });
  await assert.rejects(expired.context(), { code: "unauthorized" });
  await stop();
  assert.equal(await start(), stationId);
  assert.deepEqual(await alice.context(), before);
  await stop();
  // Laboratory auth left entirely unconfigured (env var absent). Station
  // starts fine with zero credentials, so every request is unauthorized —
  // a different scenario from the credential file actually being missing
  // from disk, tested next.
  delete env.OCEANMAIL_LAB_AUTH_FILE;
  await start();
  await assert.rejects(alice.context(), { code: "unauthorized" });
  await stop();
  // The configured credential file itself missing from disk (reprovision /
  // misconfiguration), not merely unset: Station's from_runtime_file treats
  // these differently — an absent env var starts with zero credentials, but
  // a configured path that does not exist is a hard config error and Station
  // refuses to start at all. Delete the real file and keep the env var
  // pointed at it to exercise that stricter path for real.
  env.OCEANMAIL_LAB_AUTH_FILE = authFile;
  await rm(authFile, { force: true });
  await assert.rejects(start(), { message: "Station startup failed" });
  await stop();
  // Station is now stopped (it never successfully started in either of the
  // two scenarios just above) and nothing else in this run restarts it:
  // exactly the "unavailable service" case the client's own
  // `connection_failed` code exists for, exercised here against a real
  // closed loopback port rather than only asserted at the STATIC/UNIT level.
  await assert.rejects(alice.context(), { code: "connection_failed" });
  for (const token of [aliceToken, adminToken, expiredToken]) assert.equal(logs.includes(token), false);
  for (const name of await readdir(directory)) {
    if (name === "auth.json") continue;
    const content = await readFile(join(directory, name));
    for (const token of [aliceToken, adminToken, expiredToken]) {
      assert.equal(content.includes(Buffer.from(token)), false);
    }
  }
  console.log(
    "PASS: actual Desktop adapter / Station HTTP contract, account isolation, bounded admin, " +
      "expiry, unavailable service, restart, fail-closed reprovision and secret checks"
  );
} finally {
  await stop();
  await rm(directory, { recursive: true, force: true });
}
