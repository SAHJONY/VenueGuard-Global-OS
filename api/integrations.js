import { integrationStatus } from "../packages/core/src/integrations.js";

export default function handler(request, response) {
  if (request.method !== "GET") return response.status(405).json({ error: "method not allowed" });
  const status = integrationStatus(process.env);
  return response.status(200).json({
    safeByDefault: true,
    secretsExposed: false,
    integrations: Object.fromEntries(Object.entries(status).map(([name, value]) => [name, { configured: value.configured, state: value.state, missingCount: value.missing.length }]))
  });
}
