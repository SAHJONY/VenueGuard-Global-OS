import test from "node:test";
import assert from "node:assert/strict";
import health from "../api/health.js";
import summary from "../api/summary.js";
import events from "../api/events.js";

function invoke(handler, method = "GET") {
  const result = { statusCode: 200, payload: null };
  const response = {
    status(code) { result.statusCode = code; return this; },
    json(payload) { result.payload = payload; return this; }
  };
  handler({ method }, response);
  return result;
}

test("Vercel health function returns 200", () => {
  const result = invoke(health);
  assert.equal(result.statusCode, 200);
  assert.equal(result.payload.status, "ok");
});

test("Vercel dashboard functions return stable data", () => {
  assert.equal(invoke(summary).payload.grossSales, 14820);
  assert.equal(invoke(events).payload.length, 4);
});

test("Vercel functions reject non-GET methods", () => {
  assert.equal(invoke(summary, "POST").statusCode, 405);
});
