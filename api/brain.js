import { brainStatus } from "../packages/core/src/brain.js";

export default function handler(request, response) {
  if (request.method !== "GET") return response.status(405).json({ error: "method not allowed" });
  const status = brainStatus(process.env);
  return response.status(200).json({
    ...status,
    secretsExposed: false,
    note: "Models advise and orchestrate; verified owners retain all financial and contractual authority."
  });
}
