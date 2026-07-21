export const Integration = Object.freeze({
  DATABASE: "DATABASE", AUTH: "AUTH", PAYMENTS: "PAYMENTS", CONTRACTS: "CONTRACTS",
  STORAGE: "STORAGE", EMAIL: "EMAIL", SMS: "SMS", SCANNER: "SCANNER",
  OPENAI: "OPENAI", ANTHROPIC: "ANTHROPIC"
});

const required = Object.freeze({
  DATABASE: ["DATABASE_URL"], AUTH: ["AUTH_ISSUER", "AUTH_AUDIENCE"],
  PAYMENTS: ["PAYMENT_PROVIDER", "PAYMENT_SECRET_KEY", "PAYMENT_WEBHOOK_SECRET"],
  CONTRACTS: ["DOCUSEAL_URL", "DOCUSEAL_API_KEY", "DOCUSEAL_WEBHOOK_SECRET"],
  STORAGE: ["STORAGE_ENDPOINT", "STORAGE_BUCKET", "STORAGE_ACCESS_KEY", "STORAGE_SECRET_KEY"],
  EMAIL: ["EMAIL_PROVIDER", "EMAIL_API_KEY", "EMAIL_FROM"],
  SMS: ["SMS_PROVIDER", "SMS_ACCOUNT_ID", "SMS_AUTH_TOKEN", "SMS_FROM"],
  SCANNER: ["SCANNER_MODE"], OPENAI: ["OPENAI_API_KEY"], ANTHROPIC: ["ANTHROPIC_API_KEY"]
});

export function integrationStatus(environment = {}) {
  return Object.fromEntries(Object.entries(required).map(([name, keys]) => {
    const missing = keys.filter(key => !environment[key]?.trim());
    return [name, Object.freeze({ configured: missing.length === 0, state: missing.length ? "BLOCKED" : "CONFIGURED", missing })];
  }));
}

export function requireIntegration(name, environment = {}) {
  const status = integrationStatus(environment)[name];
  if (!status) throw new Error("UNKNOWN_INTEGRATION");
  if (!status.configured) throw new Error(`${name}_NOT_CONFIGURED`);
  return true;
}
