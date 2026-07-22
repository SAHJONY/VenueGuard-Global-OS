import test from "node:test";
import assert from "node:assert/strict";
import { calculateEventEconomics, prioritizeOpportunities, projectClose } from "../packages/core/src/index.js";

test("event economics expose contribution and unit economics", () => {
  const result = calculateEventEconomics({ revenue: 10000, costOfGoods: 1800, labor: 1200, talent: 2000, processorFees: 300, marketing: 700, attendance: 500 });
  assert.deepEqual(result, { revenue: 10000, variableCosts: 6000, contribution: 4000, marginPct: 40, revenuePerGuest: 20, breakEvenRevenue: 6000, profitable: true });
});

test("opportunities rank by recoverable risk-adjusted impact", () => {
  const ranked = prioritizeOpportunities([
    { id: "certain", recoverable: 100, confidence: 1, urgency: 1 },
    { id: "urgent", recoverable: 80, confidence: 1, urgency: 2 }
  ]);
  assert.equal(ranked[0].id, "urgent");
  assert.equal(ranked[0].score, 160);
});

test("close projection rejects invalid progress", () => {
  assert.equal(projectClose({ currentRevenue: 30000, elapsedPct: .75, historicalLift: 1.05 }), 42000);
  assert.throws(() => projectClose({ currentRevenue: 1, elapsedPct: 0 }));
});
