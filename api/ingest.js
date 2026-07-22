import { normalizeVenueEvent, verifyVenueSignature } from "../packages/core/src/ingestion.js";

export default async function handler(request, response) {
  if (request.method !== "POST") return response.status(405).json({ error: "method not allowed" });
  if (!process.env.POS_WEBHOOK_SECRET || !process.env.PILOT_TENANT_ID || !process.env.PILOT_VENUE_ID) return response.status(503).json({ error: "ingestion not configured" });
  if (!process.env.DATABASE_INGEST_URL || !process.env.DATABASE_INGEST_TOKEN) return response.status(503).json({ error: "durable ingestion sink required" });
  const body = typeof request.body === "string" ? request.body : JSON.stringify(request.body || {});
  try {
    verifyVenueSignature({ body, timestamp: request.headers["x-venueguard-timestamp"], signature: request.headers["x-venueguard-signature"], secret: process.env.POS_WEBHOOK_SECRET });
    const event = normalizeVenueEvent(JSON.parse(body), { tenantId: process.env.PILOT_TENANT_ID, venueId: process.env.PILOT_VENUE_ID, connector: "POS", currency: process.env.PILOT_CURRENCY || "USD" });
    const sink = await fetch(process.env.DATABASE_INGEST_URL, { method: "POST", headers: { "authorization": `Bearer ${process.env.DATABASE_INGEST_TOKEN}`, "content-type": "application/json", "idempotency-key": event.idempotencyKey }, body: JSON.stringify(event), signal: AbortSignal.timeout(8000) });
    if (!sink.ok) throw new Error("DURABLE_SINK_REJECTED");
    return response.status(202).json({ accepted: true, idempotencyKey: event.idempotencyKey, authority: "READ_ONLY" });
  } catch (error) {
    const unauthorized = ["SIGNED_INGEST_REQUIRED", "INGEST_TIMESTAMP_EXPIRED", "INGEST_SIGNATURE_INVALID"].includes(error.message);
    return response.status(unauthorized ? 401 : 422).json({ error: error.message });
  }
}
