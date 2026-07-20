export const Role = Object.freeze({
  OWNER: "OWNER",
  MANAGER: "MANAGER",
  AUDITOR: "AUDITOR",
  EMPLOYEE: "EMPLOYEE",
  ARTIST: "ARTIST",
  SUPPLIER: "SUPPLIER"
});

const permissions = {
  OWNER: ["*"],
  MANAGER: ["sales:read", "inventory:read", "inventory:write", "shift:manage", "event:manage"],
  AUDITOR: ["sales:read", "inventory:read", "ledger:read"],
  EMPLOYEE: ["sale:create", "tips:read:self", "shift:read:self"],
  ARTIST: ["booking:read:self", "earnings:read:self", "contract:sign:self"],
  SUPPLIER: ["purchase-order:read:self", "delivery:update:self"]
};

export function can(actor, permission, tenantId) {
  if (!actor?.verified || actor.tenantId !== tenantId) return false;
  const allowed = permissions[actor.role] || [];
  return allowed.includes("*") || allowed.includes(permission);
}

export function requireOwner(actor, tenantId) {
  if (!actor?.verified || actor.role !== Role.OWNER || actor.tenantId !== tenantId) {
    throw new Error("VERIFIED_VENUE_OWNER_REQUIRED");
  }
  return true;
}
