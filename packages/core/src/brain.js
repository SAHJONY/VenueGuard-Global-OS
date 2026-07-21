export const BrainProvider = Object.freeze({ OPENAI: "OPENAI", ANTHROPIC: "ANTHROPIC" });

export const BrainTask = Object.freeze({
  OPERATIONS: "OPERATIONS", RISK_REVIEW: "RISK_REVIEW", CODE: "CODE", CUSTOMER: "CUSTOMER"
});

const defaults = Object.freeze({
  OPENAI: Object.freeze({ flagship: "gpt-5.6-sol", balanced: "gpt-5.6-terra", fast: "gpt-5.6-luna" }),
  ANTHROPIC: Object.freeze({ flagship: "claude-fable-5", balanced: "claude-sonnet-5", fast: "claude-haiku-4-5" })
});

export function brainStatus(environment = {}) {
  const openai = Boolean(environment.OPENAI_API_KEY?.trim());
  const anthropic = Boolean(environment.ANTHROPIC_API_KEY?.trim());
  return Object.freeze({
    mode: openai || anthropic ? "READY" : "BLOCKED",
    primary: Object.freeze({ provider: BrainProvider.OPENAI, model: environment.OPENAI_MODEL || defaults.OPENAI.flagship, configured: openai }),
    fallback: Object.freeze({ provider: BrainProvider.ANTHROPIC, model: environment.ANTHROPIC_MODEL || defaults.ANTHROPIC.flagship, configured: anthropic }),
    catalog: defaults,
    policy: Object.freeze({ ownerApprovalRequired: true, financialAuthority: false, autonomousMoneyMovement: false, auditRequired: true })
  });
}

export function routeBrainTask(task, environment = {}) {
  if (!Object.values(BrainTask).includes(task)) throw new Error("UNKNOWN_BRAIN_TASK");
  const status = brainStatus(environment);
  const preferred = task === BrainTask.CUSTOMER
    ? { provider: BrainProvider.OPENAI, model: environment.OPENAI_FAST_MODEL || defaults.OPENAI.fast, configured: status.primary.configured }
    : status.primary;
  if (preferred.configured) return Object.freeze({ ...preferred, task, failover: status.fallback.configured ? status.fallback : null });
  if (status.fallback.configured) return Object.freeze({ ...status.fallback, task, failover: null });
  throw new Error("AI_BRAIN_NOT_CONFIGURED");
}

export function assertModelActionAllowed(action) {
  const prohibited = new Set(["RELEASE_FUNDS", "MOVE_MONEY", "APPROVE_PAYMENT", "SIGN_CONTRACT", "ACCUSE_PERSON"]);
  if (prohibited.has(action)) throw new Error("OWNER_APPROVAL_REQUIRED");
  return true;
}
