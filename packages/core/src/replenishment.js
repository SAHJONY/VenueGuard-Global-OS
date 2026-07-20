export function recommendReplenishment({ onHand, reserved = 0, dailyUsage, leadTimeDays, safetyDays = 2, caseSize = 1 }) {
  for (const value of [onHand, reserved, dailyUsage, leadTimeDays, safetyDays]) if (!Number.isFinite(value) || value < 0) throw new Error("INVALID_REPLENISHMENT_INPUT");
  if (!Number.isInteger(caseSize) || caseSize <= 0) throw new Error("INVALID_CASE_SIZE");
  const available = onHand - reserved;
  const reorderPoint = dailyUsage * (leadTimeDays + safetyDays);
  const shortage = Math.max(0, reorderPoint - available);
  const recommendedQuantity = Math.ceil(shortage / caseSize) * caseSize;
  return Object.freeze({ available, reorderPoint, recommendedQuantity, cases: recommendedQuantity / caseSize, decision: recommendedQuantity ? "OWNER_APPROVAL_REQUIRED" : "NO_ORDER" });
}
