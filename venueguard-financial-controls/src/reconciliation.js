const round = value => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export function reconcile({ sales = [], settlements = [], deposits = [], inventory = [], tips = [] }) {
  const sum = (rows, field) => round(rows.reduce((total, row) => total + Number(row[field] || 0), 0));
  const grossSales = sum(sales, "gross");
  const refunds = sum(sales, "refund");
  const netSales = round(grossSales - refunds);
  const processorSettled = sum(settlements, "net");
  const bankDeposited = sum(deposits, "amount");
  const theoreticalCogs = sum(inventory, "theoreticalCost");
  const actualCogs = sum(inventory, "actualCost");
  const tipsCollected = sum(tips, "collected");
  const tipsAllocated = sum(tips, "allocated");
  const breaks = [
    makeBreak("SALES_TO_PROCESSOR", netSales, processorSettled),
    makeBreak("PROCESSOR_TO_BANK", processorSettled, bankDeposited),
    makeBreak("INVENTORY_USAGE", theoreticalCogs, actualCogs),
    makeBreak("TIPS", tipsCollected, tipsAllocated)
  ].filter(item => item.difference !== 0);
  return {
    totals: { grossSales, refunds, netSales, processorSettled, bankDeposited, theoreticalCogs, actualCogs, tipsCollected, tipsAllocated },
    breaks,
    status: breaks.length === 0 ? "RECONCILED" : "REVIEW_REQUIRED"
  };
}

function makeBreak(type, expected, actual) {
  const difference = round(actual - expected);
  return {
    type, expected, actual, difference,
    severity: Math.abs(difference) >= 100 ? "HIGH" : "NORMAL",
    evidenceRequired: true,
    disposition: "OPEN"
  };
}
