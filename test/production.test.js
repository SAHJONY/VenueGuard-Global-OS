import test from "node:test";
import assert from "node:assert/strict";
import { normalizeVenueEvent, productionReadiness, reconcileVenueBatch, signVenuePayload, verifyVenueSignature } from "../packages/core/src/index.js";
import readiness from "../api/integrations.js";
import ingest from "../api/ingest.js";
import { readFile } from "node:fs/promises";

function responseRecorder() {
  const result = { statusCode: 200, payload: null };
  return { result, response: { status(code) { result.statusCode = code; return this; }, json(payload) { result.payload = payload; return this; } } };
}

test("signed ingestion verifies source and rejects tampering or replay", () => {
  const body = JSON.stringify({ externalId: "sale-1", type: "SALE_COMPLETED", amountMinor: 2500, occurredAt: "2026-07-22T10:00:00Z" });
  const timestamp = "1784714400", secret = "test-secret";
  const signature = signVenuePayload({ body, timestamp, secret });
  assert.equal(verifyVenueSignature({ body, timestamp, signature, secret, now: 1784714400000 }), true);
  assert.throws(() => verifyVenueSignature({ body: `${body}x`, timestamp, signature, secret, now: 1784714400000 }), /SIGNATURE_INVALID/);
  assert.throws(() => verifyVenueSignature({ body, timestamp, signature, secret, now: 1784715001000 }), /TIMESTAMP_EXPIRED/);
});

test("ingestion ignores client tenant scope and uses verified server scope", () => {
  const event = normalizeVenueEvent({ tenantId: "attacker", venueId: "attacker", externalId: "sale-2", type: "SALE_COMPLETED", amountMinor: 1200, occurredAt: "2026-07-22T10:00:00Z" }, { tenantId: "verified-tenant", venueId: "verified-venue", connector: "SQUARE" });
  assert.equal(event.tenantId, "verified-tenant");
  assert.equal(event.venueId, "verified-venue");
  assert.equal(event.idempotencyKey, "SQUARE:sale-2");
});

test("profit publication is blocked until source totals reconcile", () => {
  const events = [normalizeVenueEvent({ externalId: "1", type: "SALE_COMPLETED", amountMinor: 10000, occurredAt: "2026-07-22" }, { tenantId: "t", venueId: "v" }), normalizeVenueEvent({ externalId: "2", type: "TIP_COLLECTED", amountMinor: 2000, occurredAt: "2026-07-22" }, { tenantId: "t", venueId: "v" })];
  assert.equal(reconcileVenueBatch(events, { grossSalesMinor: 9999, refundsMinor: 0, tipsMinor: 2000 }).canPublishProfit, false);
  assert.equal(reconcileVenueBatch(events, { grossSalesMinor: 10000, refundsMinor: 0, tipsMinor: 2000 }).status, "RECONCILED");
});

test("production readiness is redacted and fails closed", () => {
  const blocked = productionReadiness({});
  assert.equal(blocked.mode, "PILOT_BLOCKED");
  assert.equal(blocked.secretsExposed, false);
  assert.ok(blocked.blockerCount > 0);
  const ready = productionReadiness({ DATABASE_URL: "set", AUTH_ISSUER: "set", AUTH_AUDIENCE: "set", AUTH_JWKS_URL: "set", AUTH_MFA_ENFORCED: "true", POS_WEBHOOK_SECRET: "set", PILOT_TENANT_ID: "set", PILOT_VENUE_ID: "set", DATABASE_INGEST_URL: "set", DATABASE_INGEST_TOKEN: "set", SENTRY_DSN: "set", HEALTHCHECK_TOKEN: "set", DATABASE_BACKUP_POLICY: "daily", DATABASE_RESTORE_TESTED_AT: "2026-07-22" });
  assert.equal(ready.mode, "PILOT_READY");
});

test("readiness API uses service unavailable while critical gates are blocked", () => {
  const { result, response } = responseRecorder();
  readiness({ method: "GET", query: { view: "readiness" } }, response);
  assert.equal(result.statusCode, 503);
  assert.equal(result.payload.secretsExposed, false);
});

test("ingestion API rejects writes while durable configuration is absent", async () => {
  const { result, response } = responseRecorder();
  await ingest({ method: "POST", headers: {}, body: {} }, response);
  assert.equal(result.statusCode, 503);
  assert.match(result.payload.error, /not configured|sink required/);
});

test("database schema enforces tenant policies on operational and profit data", async () => {
  const schema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
  for (const table of ["operational_events", "ingestion_receipts", "daily_profit_snapshots", "approval_requests", "security_audit_log"]) {
    assert.match(schema, new RegExp(`alter table ${table} enable row level security`));
    assert.match(schema, new RegExp(`create policy tenant_isolation on ${table}`));
  }
  assert.match(schema, /current_setting\('app\.tenant_id'/);
});

test("deployment config sets browser security boundaries", async () => {
  const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
  const headers = config.headers.flatMap(rule => rule.headers).map(header => header.key);
  for (const required of ["Content-Security-Policy", "Strict-Transport-Security", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy"]) assert.ok(headers.includes(required));
});
