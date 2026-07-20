export function venueEconomics({ revenue, cogs, labor, artistCost, marketing, processingFees, fixedCosts, attendance }) {
  const grossProfit = money(revenue - cogs);
  const contributionProfit = money(grossProfit - labor - artistCost - marketing - processingFees);
  const operatingProfit = money(contributionProfit - fixedCosts);
  return {
    revenue: money(revenue), grossProfit,
    grossMarginPct: pct(grossProfit, revenue),
    contributionProfit, operatingProfit,
    profitPerAttendee: attendance ? money(operatingProfit / attendance) : null,
    breakEvenAttendanceAtCurrentYield: attendance && revenue
      ? Math.ceil((cogs + labor + artistCost + marketing + processingFees + fixedCosts) / (revenue / attendance))
      : null
  };
}

export function saasEconomics({ mrr, customers, grossMarginPct, monthlyChurnPct, salesAndMarketingSpend, newCustomers }) {
  const arpa = customers ? money(mrr / customers) : null;
  const cac = newCustomers ? money(salesAndMarketingSpend / newCustomers) : null;
  const monthlyGrossProfitPerAccount = arpa === null ? null : money(arpa * grossMarginPct / 100);
  const ltv = monthlyGrossProfitPerAccount !== null && monthlyChurnPct > 0
    ? money(monthlyGrossProfitPerAccount / (monthlyChurnPct / 100))
    : null;
  return { arpa, cac, ltv, ltvToCac: ltv !== null && cac ? Math.round((ltv / cac) * 100) / 100 : null };
}
const money = value => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const pct = (part, whole) => whole ? Math.round((part / whole) * 10000) / 100 : null;
