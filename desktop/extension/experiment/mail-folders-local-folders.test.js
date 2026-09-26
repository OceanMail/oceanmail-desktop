import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

// Execute the actual helper with a profile-local XULStore mock, without
// loading the rest of the privileged Thunderbird Experiment.
const source = readFileSync(new URL("./mail-folders.js", import.meta.url), "utf8");
const helper = source.match(/function ensureLocalFoldersHidden\([^)]*\)\s*{[\s\S]*?\n}/)?.[0];
assert.ok(helper, "ensureLocalFoldersHidden function not found");

function profile(initialValue) {
  let value = initialValue;
  let writes = 0;
  const checkKey = (uri, id, attribute) => {
    assert.equal(uri, "chrome://messenger/content/messenger.xhtml");
    assert.equal(id, "folderPaneLocalFolders");
    assert.equal(attribute, "hidden");
  };
  const xulStore = {
    hasValue(...key) {
      checkKey(...key);
      return value !== undefined;
    },
    getValue(...key) {
      checkKey(...key);
      return value;
    },
    setValue(uri, id, attribute, next) {
      checkKey(uri, id, attribute);
      assert.equal(next, "true");
      value = next;
      writes++;
    }
  };
  return {
    ensure: runInNewContext(`(${helper})`, { Services: { xulStore } }),
    get value() { return value; },
    get writes() { return writes; }
  };
}

test("Local Folders updates the live tree without reading the cache-changing getter", () => {
  for (const initialValue of [undefined, "false", "true", ""]) {
    const current = profile(initialValue);
    const stock = profile("false");
    let cachedHidden = false;
    let getterReads = 0;
    let setterCalls = 0;
    let rebuilds = 0;
    const folderPane = {
      get hideLocalFolders() {
        getterReads++;
        cachedHidden = ["true", ""].includes(current.value);
        return cachedHidden;
      },
      set hideLocalFolders(hidden) {
        assert.ok(["true", ""].includes(current.value), "persist before updating the live pane");
        assert.equal(hidden, true);
        setterCalls++;
        if (cachedHidden !== hidden) {
          cachedHidden = hidden;
          rebuilds++;
        }
      }
    };
    const needsWrite = !["true", ""].includes(initialValue);
    assert.equal(current.ensure({ folderPane }), needsWrite);
    assert.equal(rebuilds, 1, "the currently visible tree must rebuild");
    assert.equal(current.ensure({ folderPane }), false);
    assert.equal(getterReads, 0);
    assert.equal(setterCalls, 2);
    assert.equal(rebuilds, 1, "repeated calls leave the pane hidden");
    assert.equal(current.writes, Number(needsWrite));
    assert.equal(stock.value, "false");
    assert.equal(stock.writes, 0);
  }
});

test("Local Folders persists without a live pane and updates a pane available later", () => {
  const current = profile();
  assert.equal(current.ensure(), true);
  assert.equal(current.ensure({}), false);
  const folderPane = {};
  assert.equal(current.ensure({ folderPane }), false);
  assert.equal(folderPane.hideLocalFolders, true);
  assert.equal(current.value, "true");
  assert.equal(current.writes, 1);
});

test("Local Folders persistence survives a failing live setter", () => {
  const current = profile();
  const folderPane = {
    set hideLocalFolders(_hidden) {
      throw new Error("pane unavailable");
    }
  };
  assert.equal(current.ensure({ folderPane }), true);
  assert.equal(current.value, "true");
  assert.equal(current.writes, 1);
});
