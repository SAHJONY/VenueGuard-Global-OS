export const VenueType = Object.freeze({
  NIGHTCLUB: "NIGHTCLUB", RESTAURANT: "RESTAURANT", BAR: "BAR", ARENA: "ARENA",
  STADIUM: "STADIUM", THEATER: "THEATER", FESTIVAL: "FESTIVAL", CONVENTION_CENTER: "CONVENTION_CENTER",
  HOTEL: "HOTEL", CASINO: "CASINO", MUSIC_HALL: "MUSIC_HALL", OTHER: "OTHER"
});

export const Portal = Object.freeze({ OWNER: "OWNER", EMPLOYEE: "EMPLOYEE", CUSTOMER: "CUSTOMER", ARTIST: "ARTIST" });

export const SubscriptionPlan = Object.freeze({
  STARTER: { monthlyUsd: 299, venues: 1, includedUsers: 25, features: ["operations", "inventory", "workforce"] },
  GROWTH: { monthlyUsd: 899, venues: 5, includedUsers: 150, features: ["operations", "inventory", "workforce", "ticketing", "artists"] },
  GLOBAL: { monthlyUsd: null, venues: null, includedUsers: null, features: ["*"] }
});

export function provisionTenant({ legalName, ownerId, plan = "STARTER", locale = "en-US", currency = "USD" }) {
  if (!legalName?.trim() || !ownerId) throw new Error("TENANT_IDENTITY_REQUIRED");
  if (!SubscriptionPlan[plan]) throw new Error("INVALID_SUBSCRIPTION_PLAN");
  return Object.freeze({ legalName: legalName.trim(), ownerId, plan, locale, currency, status: "TRIAL", dataRegion: "UNASSIGNED" });
}

export function portalFor(actor) {
  if (!actor?.verified) throw new Error("VERIFIED_IDENTITY_REQUIRED");
  if (actor.role === "OWNER" || actor.role === "MANAGER" || actor.role === "AUDITOR") return Portal.OWNER;
  if (actor.role === "EMPLOYEE") return Portal.EMPLOYEE;
  if (actor.role === "ARTIST") return Portal.ARTIST;
  if (actor.role === "CUSTOMER") return Portal.CUSTOMER;
  throw new Error("PORTAL_NOT_AVAILABLE");
}
