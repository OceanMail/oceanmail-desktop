#!/usr/bin/env node
// Wraps `web-ext lint` to tolerate exactly one documented false positive:
// MANIFEST_FIELD_PRIVILEGED on /experiment_apis. web-ext's addons-linter
// treats any `experiment_apis` manifest key as requiring AMO privileged
// signing, which is correct for extensions distributed through
// addons.mozilla.org but not for OceanMail Desktop's mandatory,
// self-distributed extension — this Thunderbird build allows experiment_apis
// unsigned because extensions.experiments.enabled defaults true (see
// docs/THUNDERBIRD_BASELINE.md). All other errors still fail the build.
//
// Passing --privileged to web-ext instead of this wrapper trades this one
// tolerated error for two different ones (PRIVILEGED_FEATURES_REQUIRED,
// MOZILLA_ADDONS_PERMISSION_REQUIRED) that are about AMO submission, which
// doesn't apply here either — confirmed by testing both paths.

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const TOLERATED_ERROR = {
  code: "MANIFEST_FIELD_PRIVILEGED",
  instancePath: "/experiment_apis"
};

let stdout;
try {
  ({ stdout } = await execFileAsync(
    "npx",
    ["web-ext", "lint", "--source-dir=extension", "--output=json"],
    { cwd: new URL("..", import.meta.url), maxBuffer: 10 * 1024 * 1024 }
  ));
} catch (err) {
  // web-ext exits non-zero whenever there are any errors; the JSON report
  // is still on stdout, so recover it before deciding whether to fail.
  stdout = err.stdout;
  if (!stdout) {
    console.error(err.stderr || err.message);
    process.exit(1);
  }
}

const report = JSON.parse(stdout);
const untoleratedErrors = report.errors.filter(
  (e) => !(e.code === TOLERATED_ERROR.code && e.instancePath === TOLERATED_ERROR.instancePath)
);

for (const w of report.warnings) {
  console.log(`WARNING ${w.code}: ${w.message}`);
}
for (const e of report.errors) {
  const tolerated = e.code === TOLERATED_ERROR.code && e.instancePath === TOLERATED_ERROR.instancePath;
  console.log(`${tolerated ? "TOLERATED ERROR" : "ERROR"} ${e.code}: ${e.message}`);
}

console.log(
  `\n${report.errors.length} error(s) (${untoleratedErrors.length} untolerated), ${report.warnings.length} warning(s).`
);

if (untoleratedErrors.length > 0) {
  process.exit(1);
}
