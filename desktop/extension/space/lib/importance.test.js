import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeImportance } from "./importance.js";

test("normalizeImportance maps the legacy important:true fixture field to state=important", () => {
  const result = normalizeImportance({ important: true });
  assert.deepEqual(result, { state: "important", source: "fixture" });
});

test("normalizeImportance maps the legacy important:false fixture field to state=ordinary, not unknown", () => {
  const result = normalizeImportance({ important: false });
  assert.deepEqual(result, { state: "ordinary", source: "fixture" });
});

test("normalizeImportance maps important:null to state=unknown, never silently to ordinary", () => {
  const result = normalizeImportance({ important: null });
  assert.equal(result.state, "unknown");
});

test("normalizeImportance treats a missing important field as unknown", () => {
  assert.equal(normalizeImportance({}).state, "unknown");
});

test("normalizeImportance treats a null/undefined source as unknown rather than throwing", () => {
  assert.equal(normalizeImportance(null).state, "unknown");
  assert.equal(normalizeImportance(undefined).state, "unknown");
});

test("unknown and ordinary remain distinct states, never coerced together", () => {
  const unknown = normalizeImportance({ important: null });
  const ordinary = normalizeImportance({ important: false });
  assert.notEqual(unknown.state, ordinary.state);
  assert.equal(unknown.state, "unknown");
  assert.equal(ordinary.state, "ordinary");
});

test("normalizeImportance never returns an emergency state — importance and transport class are independent dimensions", () => {
  for (const input of [{ important: true }, { important: false }, { important: null }, {}]) {
    assert.notEqual(normalizeImportance(input).state, "emergency");
  }
});

// Stage 3: real native Thunderbird message/compose priority metadata.

test("normalizeImportance maps native high/highest priority to state=important, source=native-message", () => {
  assert.deepEqual(normalizeImportance({ nativePriority: "high" }), {
    state: "important",
    source: "native-message"
  });
  assert.deepEqual(normalizeImportance({ nativePriority: "highest" }), {
    state: "important",
    source: "native-message"
  });
});

test("normalizeImportance maps native none/normal/low/lowest priority to state=ordinary, source=native-message", () => {
  for (const priority of ["none", "normal", "low", "lowest"]) {
    assert.deepEqual(normalizeImportance({ nativePriority: priority }), {
      state: "ordinary",
      source: "native-message"
    });
  }
});

test("normalizeImportance never guesses ordinary for an unrecognized native priority value", () => {
  const result = normalizeImportance({ nativePriority: "some-future-value" });
  assert.equal(result.state, "unknown");
  assert.equal(result.source, "native-message");
});

test("real native-message metadata always wins outright over a legacy fixture field on the same object — never merged", () => {
  const result = normalizeImportance({ nativePriority: "high", important: false });
  assert.deepEqual(result, { state: "important", source: "native-message" });
});
