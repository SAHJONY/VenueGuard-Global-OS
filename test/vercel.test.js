import test from "node:test";
import assert from "node:assert/strict";
import health from "../api/health.js";
import summary from "../api/summary.js";
import events from "../api/events.js";
import ecosystem from "../api/ecosystem.js";
import platform from "../api/platform.js";
import catalog from "../api/catalog.js";
import { readFile } from "node:fs/promises";

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
  assert.equal(invoke(platform, "POST").statusCode, 405);
  assert.equal(invoke(catalog, "POST").statusCode, 405);
});

test("global catalog supports multiple venue classes, currencies and locales", () => {
  const payload = invoke(catalog).payload;
  assert.ok(payload.venues.some(venue => venue.type === "ARENA"));
  assert.ok(new Set(payload.venues.map(venue => venue.currency)).size >= 3);
  assert.deepEqual(payload.locales.map(locale => locale.id), ["en-US", "es-US"]);
  assert.equal(payload.onboarding.length, 7);
});

test("commercial UI exposes platform plans and onboarding", async () => {
  const [html, script] = await Promise.all([readFile(new URL("../public/index.html", import.meta.url), "utf8"), readFile(new URL("../public/app.js", import.meta.url), "utf8")]);
  assert.match(html, /data-view="platform"/);
  assert.match(script, /platform\.plans/);
  assert.match(script, /catalog\.onboarding/);
});

test("platform API advertises global venues, portals and safe readiness", () => {
  const payload = invoke(platform).payload;
  assert.ok(payload.venueTypes.includes("STADIUM"));
  assert.deepEqual(payload.portals, ["OWNER", "EMPLOYEE", "CUSTOMER", "ARTIST"]);
  assert.equal(payload.plans.STARTER.monthlyUsd, 299);
  assert.equal(payload.readiness.payments, "provider-required-live-charges-disabled");
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
  assert.deepEqual(Object.keys(payload.portals), ["OWNER", "EMPLOYEE", "CUSTOMER", "ARTIST"]);
  assert.ok(payload.portals.EMPLOYEE.subtitle.includes("Only your own"));
});
