import test from "node:test";
import assert from "node:assert/strict";
import { OperationalLedger, Role, can, requireOwner } from "../packages/core/src/index.js";

test("tenant isolation blocks cross-tenant access", () => {
  const actor = { verified: true, role: Role.OWNER, tenantId: "one" };
  assert.equal(can(actor, "sales:read", "one"), true);
  assert.equal(can(actor, "sales:read", "two"), false);
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
