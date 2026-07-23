import { verifyTrace } from "../packages/core/src/traceability.js";
const events = [
  { traceId: "VG-2026-000184", type: "SUPPLIER_RECEIPT", actor: "Casa Spirits", detail: "Lot CS-8841 · 48 bottles" },
  { traceId: "VG-2026-000184", type: "ITEM_CONSUMED", actor: "Maya R.", detail: "1.5 oz · House Paloma recipe" },
  { traceId: "VG-2026-000184", type: "SALE_ATTRIBUTED", actor: "Maya R. · BAR-02", detail: "Sale S-01842 · $18 + $3 tip" },
  { traceId: "VG-2026-000184", type: "PAYMENT_RECONCILED", actor: "Payment demo", detail: "Intent PI-DEMO-184 · matched" }
];
export default function handler(request, response) { if (request.method !== "GET") return response.status(405).json({ error: "method not allowed" }); return response.status(200).json({ mode: "DEMO_TRACE", scannerConnected: false, paymentProviderConnected: false, traces: [{ traceId: "VG-2026-000184", sku: "BAR-TEQ-01", item: "Premium tequila", events, verification: verifyTrace(events) }] }); }
