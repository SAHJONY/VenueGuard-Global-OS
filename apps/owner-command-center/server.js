import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { OperationalLedger } from "../../packages/core/src/index.js";
import { ecosystem } from "../../api/_demo-data.js";

const publicDir = fileURLToPath(new URL("../../public", import.meta.url));
const ledger = new OperationalLedger();
const tenantId = process.env.PILOT_TENANT_ID || "tenant_demo";
const venueId = process.env.PILOT_VENUE_ID || "venue_demo";

seed();

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, "http://localhost");
  if (url.pathname === "/api/health") return json(response, 200, { status: "ok", service: "owner-command-center" });
  if (url.pathname === "/api/summary") return json(response, 200, ledger.summary({ tenantId, venueId }));
  if (url.pathname === "/api/events") return json(response, 200, ledger.list({ tenantId, venueId, limit: 20 }).reverse());
  if (url.pathname === "/api/ecosystem") return json(response, 200, ecosystem);

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
  server.listen(Number(process.env.PORT || 3000), () => console.log("VenueGuard running at http://localhost:3000"));
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

function mime(ext) {
  return ({ ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8" })[ext] || "application/octet-stream";
}
