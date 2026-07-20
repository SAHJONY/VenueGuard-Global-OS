import { SubscriptionPlan, VenueType, Portal } from "../packages/core/src/platform.js";

export default function handler(request, response) {
  if (request.method !== "GET") return response.status(405).json({ error: "method not allowed" });
  return response.status(200).json({
    product: "VenueGuard Global OS",
    mode: "DEMO",
    venueTypes: Object.values(VenueType),
    portals: Object.values(Portal),
    plans: SubscriptionPlan,
    readiness: {
      tenantIsolation: "implemented-in-core",
      database: "schema-ready-provider-required",
      authentication: "provider-required",
      payments: "provider-required-live-charges-disabled",
      contracts: "DocuSeal-adapter-planned"
    }
  });
}
