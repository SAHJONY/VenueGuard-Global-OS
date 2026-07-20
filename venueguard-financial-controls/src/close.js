export function evaluateClose({ reconciliation, requiredAccounts = [], signedAccounts = [], pendingApprovals = 0 }) {
  const unsignedAccounts = requiredAccounts.filter(account => !signedAccounts.includes(account));
  const blockers = [];
  if (reconciliation.status !== "RECONCILED") blockers.push("unresolved reconciliation breaks");
  if (unsignedAccounts.length) blockers.push(`unsigned accounts: ${unsignedAccounts.join(", ")}`);
  if (pendingApprovals > 0) blockers.push(`${pendingApprovals} pending approvals`);
  return {
    ready: blockers.length === 0,
    blockers,
    proposedStatus: blockers.length === 0 ? "READY_FOR_OWNER_APPROVAL" : "OPEN"
  };
}
