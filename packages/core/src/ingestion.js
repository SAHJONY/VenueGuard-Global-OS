import { createHmac, timingSafeEqual } from "node:crypto";

const supportedTypes = new Set(["SALE_COMPLETED", "REFUND_COMPLETED", "TIP_COLLECTED", "SHIFT_LABOR_RECORDED", "INVENTORY_CONSUMED"]);

export function signVenuePayload({ body, timestamp, secret }) {
  if (!secret) throw new Error("INGEST_SECRET_REQUIRED");
  return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

export function verifyVenueSignature({ body, timestamp, signature, secret, now = Date.now(), toleranceSeconds = 300 }) {
  if (!body || !timestamp || !signature || !secret) throw new Error("SIGNED_INGEST_REQUIRED");
  const age = Math.abs(now - Number(timestamp) * 1000);
  if (!Number.isFinite(age) || age > toleranceSeconds * 1000) throw new Error("INGEST_TIMESTAMP_EXPIRED");
  const expected = signVenuePayload({ body, timestamp, secret });
  const supplied = signature.replace(/^sha256=/, "");
  const a = Buffer.from(expected, "hex"), b = Buffer.from(supplied, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("INGEST_SIGNATURE_INVALID");
  return true;
}

export function normalizeVenueEvent(payload, scope) {
  if (!scope?.tenantId || !scope?.venueId) throw new Error("SERVER_SCOPE_REQUIRED");
  if (!payload?.externalId || !supportedTypes.has(payload.type)) throw new Error("UNSUPPORTED_VENUE_EVENT");
  const amountMinor = Number(payload.amountMinor ?? 0);
  if (!Number.isSafeInteger(amountMinor)) throw new Error("INVALID_AMOUNT_MINOR");
  const occurredAt = new Date(payload.occurredAt);
  if (Number.isNaN(occurredAt.valueOf())) throw new Error("INVALID_OCCURRED_AT");
  return Object.freeze({
    tenantId: scope.tenantId,
    venueId: scope.venueId,
    type: payload.type,
    source: scope.connector || "POS",
    amountMinor,
    currency: scope.currency || "USD",
    occurredAt: occurredAt.toISOString(),
    idempotencyKey: `${scope.connector || "pos"}:${payload.externalId}`,
    metadata: Object.freeze({ registerId: payload.registerId || null, employeeRef: payload.employeeRef || null })
  });
}

export function reconcileVenueBatch(events, reported) {
  const total = type => events.filter(event => event.type === type).reduce((sum, event) => sum + event.amountMinor, 0);
  const computed = { grossSalesMinor: total("SALE_COMPLETED"), refundsMinor: total("REFUND_COMPLETED"), tipsMinor: total("TIP_COLLECTED") };
  const breaks = Object.entries(computed).filter(([key, value]) => value !== Number(reported[key] ?? NaN)).map(([key, value]) => ({ key, computed: value, reported: reported[key] }));
  return Object.freeze({ status: breaks.length ? "REVIEW_REQUIRED" : "RECONCILED", computed: Object.freeze(computed), breaks: Object.freeze(breaks), canPublishProfit: breaks.length === 0 });
}
