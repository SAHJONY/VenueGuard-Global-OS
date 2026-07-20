import { summary } from "./_demo-data.js";

export default function handler(request, response) {
  if (request.method !== "GET") return response.status(405).json({ error: "method not allowed" });
  return response.status(200).json(summary);
}
