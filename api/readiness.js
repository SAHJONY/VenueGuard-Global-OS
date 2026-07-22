import { productionReadiness } from "../packages/core/src/readiness.js";

export default function handler(request, response) {
  if (request.method !== "GET") return response.status(405).json({ error: "method not allowed" });
  const readiness = productionReadiness(process.env);
  return response.status(readiness.mode === "PILOT_READY" ? 200 : 503).json(readiness);
}
