import test from "node:test";
import assert from "node:assert/strict";
import { OperationalLedger, Role, can, requireOwner, provisionTenant, portalFor, SubscriptionPlan, evaluateRisk, recommendReplenishment, verifyTrace, integrationStatus, requireIntegration, BrainTask, brainStatus, routeBrainTask, assertModelActionAllowed, runBrain, nightlyCloseControl, verifyProfitLedger } from "../packages/core/src/index.js";

test("tenant isolation blocks cross-tenant access", () => {
  const actor = { verified: true, role: Role.OWNER, tenantId: "one" };
  assert.equal(can(actor, "sales:read", "one"), true);
  assert.equal(can(actor, "sales:read", "two"), false);
});

test("commercial tenants require identity and a valid subscription plan", () => {
  const tenant = provisionTenant({ legalName: " Demo Venue LLC ", ownerId: "owner-1", plan: "GROWTH" });
  assert.equal(tenant.legalName, "Demo Venue LLC");
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

test("verified profit ledger never counts projections as realized profit", () => {
  const ledger = verifyProfitLedger([{ id: "one", title: "Projected recovery", projectedAmount: 5000, evidenceIds: ["pos"], sourceTotalsReconciled: false }]);
  assert.equal(ledger.projectedAmount, 5000);
  assert.equal(ledger.confirmedAmount, 0);
  assert.equal(ledger.claimableAmount, 0);
  assert.equal(ledger.entries[0].status, "PROJECTED");
  assert.equal(ledger.policy.forecastsAreProfit, false);
});

test("profit is confirmed only with reconciliation, evidence, independent verification and owner approval", () => {
  const ledger = verifyProfitLedger([{ id: "verified", title: "Verified recovery", projectedAmount: 500, baselineAmount: 1000, actualAmount: 1500, confirmedAmount: 500, evidenceIds: ["pos-1", "bank-1"], sourceTotalsReconciled: true, independentVerification: { verifiedBy: "controller-1", verifiedAt: "2026-07-23", method: "source-recalculation" }, ownerApproval: { approvedBy: "owner-1", approvedAt: "2026-07-23" } }]);
  assert.equal(ledger.entries[0].status, "CONFIRMED");
  assert.equal(ledger.confirmedAmount, 500);
  assert.equal(ledger.claimableAmount, 500);
});

test("nightly close remains human controlled and blocks missing source evidence", () => {
  const ledger = verifyProfitLedger([]);
  const blocked = nightlyCloseControl({ ledger, requiredSources: ["POS", "BANK"], receivedSources: ["POS"], unresolvedBreaks: 1 });
  assert.equal(blocked.readyForOwnerApproval, false);
  assert.deepEqual(blocked.missingSources, ["BANK"]);
  const ready = nightlyCloseControl({ ledger, requiredSources: ["POS"], receivedSources: ["POS"] });
  assert.equal(ready.status, "READY_FOR_OWNER_APPROVAL");
  assert.equal(ready.automaticCloseAllowed, false);
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

test("integrations are blocked by default and require complete credentials", () => {
  const empty = integrationStatus({});
  assert.equal(empty.PAYMENTS.state, "BLOCKED");
  assert.throws(() => requireIntegration("PAYMENTS", {}), /PAYMENTS_NOT_CONFIGURED/);
  const configured = { PAYMENT_PROVIDER: "test", PAYMENT_SECRET_KEY: "secret", PAYMENT_WEBHOOK_SECRET: "webhook" };
  assert.equal(integrationStatus(configured).PAYMENTS.state, "CONFIGURED");
  assert.equal(requireIntegration("PAYMENTS", configured), true);
});

test("multi-model brain is blocked without keys and exposes safe model defaults", () => {
  const status = brainStatus({});
  assert.equal(status.mode, "BLOCKED");
  assert.equal(status.primary.model, "gpt-5.6-sol");
  assert.equal(status.fallback.model, "claude-fable-5");
  assert.equal(status.policy.financialAuthority, false);
  assert.throws(() => routeBrainTask(BrainTask.OPERATIONS, {}), /AI_BRAIN_NOT_CONFIGURED/);
});

test("brain routes to OpenAI first and fails over to Anthropic", () => {
  const both = routeBrainTask(BrainTask.RISK_REVIEW, { OPENAI_API_KEY: "test", ANTHROPIC_API_KEY: "test" });
  assert.equal(both.provider, "OPENAI");
  assert.equal(both.failover.provider, "ANTHROPIC");
  const fallback = routeBrainTask(BrainTask.CODE, { ANTHROPIC_API_KEY: "test" });
  assert.equal(fallback.provider, "ANTHROPIC");
});

test("no model can perform owner-only financial or contractual actions", () => {
  assert.throws(() => assertModelActionAllowed("MOVE_MONEY"), /OWNER_APPROVAL_REQUIRED/);
  assert.throws(() => assertModelActionAllowed("SIGN_CONTRACT"), /OWNER_APPROVAL_REQUIRED/);
  assert.equal(assertModelActionAllowed("DRAFT_RECOMMENDATION"), true);
});

test("AI engine calls OpenAI Responses API without storing prompts", async () => {
  let request;
  const fetcher = async (url, options) => { request = { url, options }; return { ok: true, json: async () => ({ id: "resp-1", output_text: "recommendation" }) }; };
  const result = await runBrain({ task: BrainTask.OPERATIONS, prompt: "Review operations", environment: { OPENAI_API_KEY: "test" }, fetcher });
  assert.equal(result.provider, "OPENAI");
  assert.equal(result.text, "recommendation");
  assert.match(request.url, /openai\.com\/v1\/responses/);
  assert.equal(JSON.parse(request.options.body).store, false);
});

test("AI engine fails over to Anthropic when the primary provider fails", async () => {
  const fetcher = async (url) => url.includes("openai")
    ? { ok: false, status: 503, json: async () => ({}) }
    : { ok: true, json: async () => ({ id: "msg-1", content: [{ type: "text", text: "fallback" }] }) };
  const result = await runBrain({ task: BrainTask.RISK_REVIEW, prompt: "Review risk", environment: { OPENAI_API_KEY: "test", ANTHROPIC_API_KEY: "test" }, fetcher });
  assert.equal(result.provider, "ANTHROPIC");
  assert.equal(result.failedOver, true);
  assert.equal(result.text, "fallback");
});
