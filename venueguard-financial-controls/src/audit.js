export function auditSettlement(statement) {
  const issues = [];
  const required = ["eventId", "partyId", "grossRevenue", "deductions", "netPayable", "evidence"];
  for (const field of required) {
    if (statement[field] === undefined || statement[field] === null) issues.push(`missing ${field}`);
  }
  const deductions = Array.isArray(statement.deductions)
    ? statement.deductions.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    : 0;
  const calculated = money(Number(statement.grossRevenue || 0) - deductions);
  if (statement.netPayable !== undefined && money(statement.netPayable) !== calculated) {
    issues.push(`net payable mismatch: expected ${calculated}`);
  }
  for (const deduction of statement.deductions || []) {
    if (!deduction.evidenceId) issues.push(`deduction without evidence: ${deduction.label || "unlabeled"}`);
  }
  return { passed: issues.length === 0, issues, calculatedNetPayable: calculated, requiresHumanSignoff: true };
}
const money = value => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
