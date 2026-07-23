import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { OperationalLedger } from "../../packages/core/src/index.js";
import { ecosystem } from "../../api/_demo-data.js";
import brain from "../../api/brain.js";
import catalog from "../../api/catalog.js";
import integrations from "../../api/integrations.js";
import platform from "../../api/platform.js";
import risk from "../../api/risk.js";
import supply from "../../api/supply.js";
import trace from "../../api/trace.js";

const publicDir = fileURLToPath(new URL("../../public", import.meta.url));
const ledger = new OperationalLedger();
const tenantId = process.env.PILOT_TENANT_ID || "tenant_demo";
const venueId = process.env.PILOT_VENUE_ID || "venue_demo";
const apiRoutes = new Map([
  ["/api/brain", brain], ["/api/catalog", catalog], ["/api/integrations", integrations],
  ["/api/platform", platform], ["/api/risk", risk], ["/api/supply", supply], ["/api/trace", trace]
]);

seed();

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, "http://localhost");
  if (url.pathname === "/api/health") return json(response, 200, { status: "ok", service: "owner-command-center" });
  if (url.pathname === "/api/summary") return json(response, 200, ledger.summary({ tenantId, venueId }));
  if (url.pathname === "/api/events") return json(response, 200, ledger.list({ tenantId, venueId, limit: 20 }).reverse());
  if (url.pathname === "/api/ecosystem") return json(response, 200, ecosystem);
  if (url.pathname === "/api/readiness") return invoke(integrations, request, response, { view: "readiness" });
  if (url.pathname === "/api/profit-ledger") return invoke(integrations, request, response, { view: "profit-ledger" });
  if (url.pathname === "/api/auth/session") return invoke(integrations, request, response, { view: "session" });
  if (apiRoutes.has(url.pathname)) return invoke(apiRoutes.get(url.pathname), request, response, Object.fromEntries(url.searchParams));

  const path = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  if (path.includes("..")) return json(response, 400, { error: "invalid path" });
  try {
    const body = await readFile(join(publicDir, path));
    response.writeHead(200, { "content-type": mime(extname(path)), "cache-control": "no-store" });
    response.end(body);
  } catch {
    json(response, 404, { error: "not found" });
  }
});

if (process.env.NODE_ENV !== "test") {
  const port = Number(process.env.PORT || 3000);
  server.listen(port, () => console.log(`VenueGuard running at http://localhost:${port}`));
}

export { server, ledger };

function seed() {
  const at = new Date().toISOString();
  const rows = [
    ["SALE_COMPLETED", 14820, "pos"], ["TIP_COLLECTED", 2214, "payments"],
    ["INVENTORY_VARIANCE", -84, "inventory"], ["ALERT_OPENED", 0, "risk-engine"]
  ];
  rows.forEach(([type, amount, source], index) => ledger.append({
    tenantId, venueId, type, amount, source, occurredAt: at, idempotencyKey: `demo-${index}`
  }));
}

function json(response, status, payload) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

async function invoke(handler, request, response, query = {}) {
  try {
    await handler({ method: request.method, headers: request.headers, query }, {
      status(code) { this.statusCode = code; return this; },
      json(payload) { json(response, this.statusCode || 200, payload); return this; }
    });
  } catch {
    json(response, 500, { error: "internal service error" });
  }
}

function mime(ext) {
  return ({ ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8" })[ext] || "application/octet-stream";
}
