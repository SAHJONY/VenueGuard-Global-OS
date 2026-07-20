import test from "node:test";
import assert from "node:assert/strict";
import { OperationalLedger, Role, can, requireOwner, provisionTenant, portalFor, SubscriptionPlan, evaluateRisk, recommendReplenishment, verifyTrace } from "../packages/core/src/index.js";

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

test("risk controls hold critical signals for owner with explainable reasons", () => {
  const result = evaluateRisk({ type: "UNATTRIBUTED_SALE", evidence: ["processor-event"] });
  assert.equal(result.decision, "HOLD_FOR_OWNER");
  assert.equal(result.ownerApproval, true);
  assert.deepEqual(result.reasons, ["UNATTRIBUTED_SALE", "EVIDENCE_ATTACHED"]);
  assert.equal(evaluateRisk({ type: "NORMAL_OPERATION" }).decision, "ALLOW");
});

test("replenishment rounds shortages to case sizes and requires owner", () => {
  const result = recommendReplenishment({ onHand: 5, reserved: 1, dailyUsage: 3, leadTimeDays: 2, safetyDays: 2, caseSize: 6 });
  assert.equal(result.recommendedQuantity, 12);
  assert.equal(result.decision, "OWNER_APPROVAL_REQUIRED");
  assert.equal(recommendReplenishment({ onHand: 20, dailyUsage: 2, leadTimeDays: 2, caseSize: 6 }).decision, "NO_ORDER");
});

test("trace requires supplier, consumption, sale and reconciliation", () => {
  const traceId = "trace-1";
  const complete = verifyTrace(["SUPPLIER_RECEIPT", "ITEM_CONSUMED", "SALE_ATTRIBUTED", "PAYMENT_RECONCILED"].map(type => ({ traceId, type })));
  assert.equal(complete.status, "TRACE_VERIFIED");
  const incomplete = verifyTrace(["SUPPLIER_RECEIPT", "ITEM_CONSUMED", "SALE_ATTRIBUTED", "NOTE"].map(type => ({ traceId, type })));
  assert.deepEqual(incomplete.missing, ["PAYMENT_RECONCILED"]);
});
