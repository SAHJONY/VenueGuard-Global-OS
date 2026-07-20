export function verifyTrace(events) {
  if (!Array.isArray(events) || events.length < 4) throw new Error("INCOMPLETE_TRACE");
  const required = ["SUPPLIER_RECEIPT", "ITEM_CONSUMED", "SALE_ATTRIBUTED", "PAYMENT_RECONCILED"];
  const types = new Set(events.map(event => event.type));
  const missing = required.filter(type => !types.has(type));
  if (missing.length) return Object.freeze({ complete: false, missing, status: "HOLD_FOR_REVIEW" });
  const ids = new Set(events.map(event => event.traceId));
  if (ids.size !== 1) throw new Error("MIXED_TRACE_IDS");
  return Object.freeze({ complete: true, missing: [], status: "TRACE_VERIFIED", traceId: events[0].traceId });
}
