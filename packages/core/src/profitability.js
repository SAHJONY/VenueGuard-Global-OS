const finite = (value, name) => {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`INVALID_${name.toUpperCase()}`);
  return number;
};

export function calculateEventEconomics(input) {
  const revenue = finite(input.revenue, "revenue");
  const variableCosts = ["costOfGoods", "labor", "talent", "processorFees", "marketing"]
    .reduce((sum, key) => sum + finite(input[key] || 0, key), 0);
  const contribution = revenue - variableCosts;
  const marginPct = revenue ? contribution / revenue * 100 : 0;
  const attendance = finite(input.attendance || 0, "attendance");
  return Object.freeze({
    revenue,
    variableCosts,
    contribution,
    marginPct: Math.round(marginPct * 10) / 10,
    revenuePerGuest: attendance ? Math.round(revenue / attendance * 100) / 100 : 0,
    breakEvenRevenue: variableCosts,
    profitable: contribution > 0
  });
}

export function prioritizeOpportunities(opportunities) {
  return opportunities.map(item => {
    const recoverable = finite(item.recoverable, "recoverable");
    const confidence = finite(item.confidence, "confidence");
    const urgency = finite(item.urgency ?? 1, "urgency");
    return { ...item, score: Math.round(recoverable * confidence * urgency) };
  }).sort((a, b) => b.score - a.score || b.recoverable - a.recoverable);
}

export function projectClose({ currentRevenue, elapsedPct, historicalLift = 1 }) {
  const elapsed = finite(elapsedPct, "elapsedPct");
  if (elapsed <= 0 || elapsed > 1) throw new Error("INVALID_ELAPSED_PCT");
  return Math.round(finite(currentRevenue, "currentRevenue") / elapsed * finite(historicalLift, "historicalLift"));
}
