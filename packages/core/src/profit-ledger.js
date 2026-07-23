const money = value => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export function verifyProfitLedger(entries = []) {
  const rows = entries.map(verifyEntry);
  const sum = (status, field) => money(rows.filter(row => row.status === status).reduce((total, row) => total + row[field], 0));
  const projected = money(rows.reduce((total, row) => total + row.projectedAmount, 0));
  const confirmed = sum("CONFIRMED", "confirmedAmount");
  return Object.freeze({
    mode: "EVIDENCE_REQUIRED",
    currency: "USD",
    projectedAmount: projected,
    confirmedAmount: confirmed,
    claimableAmount: confirmed,
    entries: Object.freeze(rows),
    policy: Object.freeze({ forecastsAreProfit: false, ownerApprovalRequired: true, independentVerificationRequired: true })
  });
}

function verifyEntry(entry) {
  const projectedAmount = money(Math.max(0, Number(entry.projectedAmount || 0)));
  const evidenceIds = [...new Set((entry.evidenceIds || []).filter(value => typeof value === "string" && value.trim()))];
  const calculatedAmount = money(Math.max(0, Number(entry.actualAmount || 0) - Number(entry.baselineAmount || 0)));
  const independent = entry.independentVerification || {};
  const requirements = {
    sourceTotalsReconciled: entry.sourceTotalsReconciled === true,
    evidenceAttached: evidenceIds.length >= 2,
    amountRecalculated: calculatedAmount > 0 && calculatedAmount === money(entry.confirmedAmount || 0),
    independentlyVerified: Boolean(independent.verifiedBy && independent.verifiedAt && independent.method),
    ownerApproved: Boolean(entry.ownerApproval?.approvedBy && entry.ownerApproval?.approvedAt)
  };
  const missing = Object.entries(requirements).filter(([, ready]) => !ready).map(([name]) => name);
  const status = missing.length === 0 ? "CONFIRMED" : projectedAmount > 0 ? "PROJECTED" : "BLOCKED";
  return Object.freeze({
    id: String(entry.id || "unidentified"),
    title: String(entry.title || "Untitled opportunity"),
    projectedAmount,
    confirmedAmount: status === "CONFIRMED" ? calculatedAmount : 0,
    status,
    evidenceCount: evidenceIds.length,
    missing: Object.freeze(missing),
    sourceWindow: entry.sourceWindow || null
  });
}

export function nightlyCloseControl({ ledger, requiredSources = [], receivedSources = [], unresolvedBreaks = 0, pendingApprovals = 0 }) {
  const missingSources = requiredSources.filter(source => !receivedSources.includes(source));
  const blockers = [];
  if (missingSources.length) blockers.push(`missing sources: ${missingSources.join(", ")}`);
  if (unresolvedBreaks > 0) blockers.push(`${unresolvedBreaks} unresolved reconciliation breaks`);
  if (pendingApprovals > 0) blockers.push(`${pendingApprovals} pending owner approvals`);
  if (!ledger || ledger.confirmedAmount < 0) blockers.push("verified profit ledger unavailable");
  return Object.freeze({
    readyForOwnerApproval: blockers.length === 0,
    status: blockers.length === 0 ? "READY_FOR_OWNER_APPROVAL" : "OPEN",
    blockers: Object.freeze(blockers),
    missingSources: Object.freeze(missingSources),
    automaticCloseAllowed: false
  });
}
