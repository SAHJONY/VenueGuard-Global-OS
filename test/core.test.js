import test from "node:test";
import assert from "node:assert/strict";
import { OperationalLedger, Role, can, requireOwner, provisionTenant, portalFor, SubscriptionPlan } from "../packages/core/src/index.js";

test("tenant isolation blocks cross-tenant access", () => {
  const actor = { verified: true, role: Role.OWNER, tenantId: "one" };
  assert.equal(can(actor, "sales:read", "one"), true);
  assert.equal(can(actor, "sales:read", "two"), false);
});

test("commercial tenants require identity and a valid subscription plan", () => {
  const tenant = provisionTenant({ legalName: " Velvet TH LLC ", ownerId: "owner-1", plan: "GROWTH" });
  assert.equal(tenant.legalName, "Velvet TH LLC");
  assert.equal(tenant.status, "TRIAL");
  assert.equal(SubscriptionPlan.GROWTH.venues, 5);
  assert.throws(() => provisionTenant({ legalName: "Bad", ownerId: "owner-1", plan: "UNKNOWN" }));
});

test("verified identities are routed to isolated portals", () => {
  assert.equal(portalFor({ verified: true, role: Role.OWNER }), "OWNER");
  assert.equal(portalFor({ verified: true, role: Role.EMPLOYEE }), "EMPLOYEE");
  assert.equal(portalFor({ verified: true, role: Role.CUSTOMER }), "CUSTOMER");
  assert.equal(portalFor({ verified: true, role: Role.ARTIST }), "ARTIST");
  assert.throws(() => portalFor({ verified: false, role: Role.OWNER }));
});

test("only a verified tenant owner passes the owner gate", () => {
  assert.equal(requireOwner({ verified: true, role: Role.OWNER, tenantId: "one" }, "one"), true);
  assert.throws(() => requireOwner({ verified: true, role: Role.MANAGER, tenantId: "one" }, "one"));
});

test("ledger is append-only and idempotent", () => {
  const ledger = new OperationalLedger();
  const input = { tenantId: "one", venueId: "v", type: "SALE_COMPLETED", source: "pos", occurredAt: new Date().toISOString(), amount: 25, idempotencyKey: "sale-1" };
  const first = ledger.append(input);
  const duplicate = ledger.append(input);
  assert.equal(first.id, duplicate.id);
  assert.equal(ledger.list({ tenantId: "one" }).length, 1);
  assert.equal(ledger.list({ tenantId: "two" }).length, 0);
});
