export default function handler(request, response) {
  if (request.method !== "GET") return response.status(405).json({ error: "method not allowed" });
  return response.status(200).json({ status: "ok", service: "owner-command-center", environment: process.env.VERCEL_ENV || "unknown", release: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || "local", checkedAt: new Date().toISOString() });
}
