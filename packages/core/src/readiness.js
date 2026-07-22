const gates = Object.freeze({
  database: ["DATABASE_URL"],
  authentication: ["AUTH_ISSUER", "AUTH_AUDIENCE", "AUTH_JWKS_URL"],
  mfa: ["AUTH_MFA_ENFORCED"],
  ingestion: ["POS_WEBHOOK_SECRET", "PILOT_TENANT_ID", "PILOT_VENUE_ID", "DATABASE_INGEST_URL", "DATABASE_INGEST_TOKEN"],
  monitoring: ["SENTRY_DSN", "HEALTHCHECK_TOKEN"],
  backups: ["DATABASE_BACKUP_POLICY", "DATABASE_RESTORE_TESTED_AT"]
});

export function productionReadiness(environment = {}) {
  const checks = Object.fromEntries(Object.entries(gates).map(([name, keys]) => {
    const configured = keys.every(key => String(environment[key] || "").trim());
    const valid = name !== "mfa" || environment.AUTH_MFA_ENFORCED === "true";
    return [name, Object.freeze({ ready: configured && valid, requiredCount: keys.length })];
  }));
  const blockers = Object.entries(checks).filter(([, value]) => !value.ready).map(([name]) => name);
  return Object.freeze({ mode: blockers.length ? "PILOT_BLOCKED" : "PILOT_READY", checks: Object.freeze(checks), blockerCount: blockers.length, blockers: Object.freeze(blockers), secretsExposed: false });
}
