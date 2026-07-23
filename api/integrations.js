import { integrationStatus } from "../packages/core/src/integrations.js";
import { productionReadiness } from "../packages/core/src/readiness.js";
import { verifyJwksConnectivity, verifyOidcRequest } from "../packages/core/src/auth.js";
import { nightlyCloseControl, verifyProfitLedger } from "../packages/core/src/profit-ledger.js";
import { neon } from "@neondatabase/serverless";

export default async function handler(request, response) {
  if (request.method !== "GET") return response.status(405).json({ error: "method not allowed" });
  if (request.query?.view === "session") {
    try {
      const session = await verifyOidcRequest(request);
      return response.status(200).json({ authenticated: true, session, secretsExposed: false });
    } catch {
      return response.status(401).json({ authenticated: false, error: "authentication required", secretsExposed: false });
    }
  }
  if (request.query?.view === "readiness") {
    const readiness = productionReadiness(process.env);
    let databaseVerified = false;
    if (readiness.checks.database.ready) {
      try {
        const sql = neon(process.env.VENUEGUARD_DATABASE_URL);
        const rows = await sql`select current_user as role, rolbypassrls from pg_roles where rolname = current_user`;
        databaseVerified = rows[0]?.role === "venueguard_app" && rows[0]?.rolbypassrls === false;
      } catch {}
    }
    const authenticationVerified = readiness.checks.authentication.ready && await verifyJwksConnectivity(process.env);
    const checks = {
      ...readiness.checks,
      database: { ...readiness.checks.database, ready: databaseVerified, verified: databaseVerified },
      authentication: { ...readiness.checks.authentication, ready: authenticationVerified, verified: authenticationVerified }
    };
    const blockers = Object.entries(checks).filter(([, value]) => !value.ready).map(([name]) => name);
    const verified = { ...readiness, mode: blockers.length ? "PILOT_BLOCKED" : "PILOT_READY", checks, blockers, blockerCount: blockers.length };
    return response.status(verified.mode === "PILOT_READY" ? 200 : 503).json(verified);
  }
  if (request.query?.view === "profit-ledger") {
    const ledger = verifyProfitLedger([
      { id: "vip-no-show", title: "Recover no-show VIP inventory", projectedAmount: 2380, evidenceIds: ["demo-reservations"], sourceTotalsReconciled: false, sourceWindow: "Current event" },
      { id: "ticket-yield", title: "Optimize final-release ticket yield", projectedAmount: 1896, evidenceIds: [], sourceTotalsReconciled: false, sourceWindow: "Current event" },
      { id: "inventory-variance", title: "Resolve premium tequila variance", projectedAmount: 84, evidenceIds: ["demo-pos", "demo-inventory"], sourceTotalsReconciled: false, sourceWindow: "Current event" }
    ]);
    const close = nightlyCloseControl({ ledger, requiredSources: ["POS", "PAYMENTS", "INVENTORY", "LABOR", "TICKETING"], receivedSources: [], unresolvedBreaks: 1, pendingApprovals: 0 });
    return response.status(200).json({ dataMode: "CONTROLLED_DEMO", ledger, close, secretsExposed: false });
  }
  const status = integrationStatus(process.env);
  return response.status(200).json({
    safeByDefault: true,
    secretsExposed: false,
    integrations: Object.fromEntries(Object.entries(status).map(([name, value]) => [name, { configured: value.configured, state: value.state, missingCount: value.missing.length }]))
  });
}
