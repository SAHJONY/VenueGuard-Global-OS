export const RestrictedAction = Object.freeze({
  POST_LEDGER_ENTRY: "POST_LEDGER_ENTRY",
  INITIATE_PAYOUT: "INITIATE_PAYOUT",
  CHANGE_BANK_ACCOUNT: "CHANGE_BANK_ACCOUNT",
  APPROVE_KYC: "APPROVE_KYC",
  CLOSE_PERIOD: "CLOSE_PERIOD",
  ALLEGE_FRAUD: "ALLEGE_FRAUD"
});

export function authorize(action, actor, approval) {
  if (!Object.values(RestrictedAction).includes(action)) return { allowed: true, reason: "non-restricted action" };
  if (!actor?.verified || !["OWNER", "DELEGATED_APPROVER"].includes(actor.role)) {
    return { allowed: false, reason: "verified owner or delegated approver required" };
  }
  if (!approval?.mfaVerified || approval?.actorId !== actor.id) {
    return { allowed: false, reason: "fresh strong authentication required" };
  }
  if ([RestrictedAction.INITIATE_PAYOUT, RestrictedAction.CHANGE_BANK_ACCOUNT].includes(action) && !approval.dualApproval) {
    return { allowed: false, reason: "dual approval required" };
  }
  return { allowed: true, reason: "authorized and auditable" };
}
