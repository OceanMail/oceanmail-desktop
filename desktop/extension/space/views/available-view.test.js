import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { mountAvailableView } from "./available-view.js";

const originalDocument = globalThis.document;
afterEach(() => { globalThis.document = originalDocument; });

// Minimal DOM test double exercises the real view/event handlers. It verifies
// control state, not Thunderbird layout, focus, screenshots or live product QA.
class Element {
  constructor(tag) {
    this.tag = tag;
    this.children = [];
    this.style = {};
    this.attributes = {};
    this.listeners = {};
    this.textContent = "";
    this.nodes = new Map();
  }
  appendChild(child) { this.children.push(child); }
  setAttribute(key, value) { this.attributes[key] = value; }
  addEventListener(name, fn) { this.listeners[name] = fn; }
  set innerHTML(value) {
    this.html = value;
    this.nodes = new Map([...value.matchAll(/id="([^"]+)"/g)].map((match) => ["#" + match[1], new Element("div")]));
  }
  get innerHTML() { return this.html ?? this.textContent; }
  querySelector(selector) { return this.nodes.get(selector); }
}
function descendants(element) {
  return element.children.flatMap((child) => [child, ...descendants(child)]);
}

test("holding a message disables its attachment picker and resume reenables it without selection", () => {
  globalThis.document = { createElement: (tag) => new Element(tag) };
  const container = new Element("main");
  const { planner } = mountAvailableView(container, { email: "ship@station.test", name: "Ship" });
  const item = planner.getRows().find((row) => row.attachment && row.eligible);
  assert.ok(item, "fixture requires eligible attachment work");
  const row = () => container.querySelector("#available-tbody").children.find((candidate) =>
    descendants(candidate).some((node) => node.tag === "select" &&
      node.attributes["aria-label"] === `Attachment representation for "${item.subject}"`));
  const picker = () => descendants(row()).find((node) => node.tag === "select");
  const holdButton = () => descendants(row()).find((node) => node.tag === "button" && ["Hold", "Resume"].includes(node.textContent));
  assert.equal(picker().disabled, false);
  holdButton().listeners.click();
  assert.equal(planner.getRowView(item.id).held, true);
  assert.equal(picker().disabled, true);
  assert.equal(picker().children[0].selected, true);
  holdButton().listeners.click();
  assert.equal(planner.getRowView(item.id).held, false);
  assert.equal(picker().disabled, false);
  assert.equal(planner.getRowView(item.id).attachmentRepresentationId, null);
});
