import { integrationStatus } from "../packages/core/src/integrations.js";
import { productionReadiness } from "../packages/core/src/readiness.js";

export default function handler(request, response) {
  if (request.method !== "GET") return response.status(405).json({ error: "method not allowed" });
  if (request.query?.view === "readiness") {
    const readiness = productionReadiness(process.env);
    return response.status(readiness.mode === "PILOT_READY" ? 200 : 503).json(readiness);
  }
  const status = integrationStatus(process.env);
  return response.status(200).json({
    safeByDefault: true,
    secretsExposed: false,
    integrations: Object.fromEntries(Object.entries(status).map(([name, value]) => [name, { configured: value.configured, state: value.state, missingCount: value.missing.length }]))
  });
}
