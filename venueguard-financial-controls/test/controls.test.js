import test from "node:test";
import assert from "node:assert/strict";
import { reconcile, evaluateClose, auditSettlement, screenKyc, authorize, RestrictedAction } from "../src/index.js";

test("reconciliation passes only when all control totals agree", () => {
  const result = reconcile({
    sales: [{ gross: 100, refund: 0 }], settlements: [{ net: 100 }], deposits: [{ amount: 100 }],
    inventory: [{ theoreticalCost: 20, actualCost: 20 }], tips: [{ collected: 10, allocated: 10 }]
  });
  assert.equal(result.status, "RECONCILED");
  assert.equal(result.breaks.length, 0);
});

test("close is blocked by reconciliation breaks", () => {
  const reconciliation = reconcile({ sales: [{ gross: 100 }], settlements: [{ net: 90 }] });
  assert.equal(evaluateClose({ reconciliation }).ready, false);
});

test("artist settlement rejects undocumented deductions", () => {
  const result = auditSettlement({ eventId: "e", partyId: "a", grossRevenue: 100, deductions: [{ label: "fee", amount: 10 }], netPayable: 90, evidence: [] });
  assert.equal(result.passed, false);
});

test("KYC screening never grants approval", () => {
  assert.equal(screenKyc({ type: "INDIVIDUAL" }).approved, false);
});

test("financial action requires verified authority and MFA", () => {
  const actor = { id: "1", role: "OWNER", verified: true };
  assert.equal(authorize(RestrictedAction.POST_LEDGER_ENTRY, actor, {}).allowed, false);
  assert.equal(authorize(RestrictedAction.POST_LEDGER_ENTRY, actor, { actorId: "1", mfaVerified: true }).allowed, true);
});
