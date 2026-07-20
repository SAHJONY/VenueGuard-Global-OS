import test from "node:test";
import assert from "node:assert/strict";
import health from "../api/health.js";
import summary from "../api/summary.js";
import events from "../api/events.js";
import ecosystem from "../api/ecosystem.js";

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
  assert.equal(invoke(ecosystem, "POST").statusCode, 405);
});

test("ecosystem API exposes every core operating domain", () => {
  const payload = invoke(ecosystem).payload;
  assert.equal(payload.venue.name, "VELVET TH");
  assert.equal(payload.modules.length, 6);
  assert.ok(payload.cashflow.length >= 6);
  assert.ok(payload.inventory.every(item => "variance" in item));
  assert.ok(payload.workforce.every(employee => "tips" in employee && "due" in employee));
  assert.ok(payload.ticketing.sold <= payload.ticketing.capacity);
  assert.ok(payload.artists.every(artist => artist.contract && artist.settlement));
});
