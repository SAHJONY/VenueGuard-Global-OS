import { createRemoteJWKSet, jwtVerify } from "jose";
import { Role } from "./access.js";

const allowedRoles = new Set(Object.values(Role));
const defaultAlgorithms = Object.freeze(["RS256"]);

function required(environment, name) {
  const value = String(environment[name] || "").trim();
  if (!value) throw new Error(`AUTH_CONFIGURATION_MISSING:${name}`);
  return value;
}

function algorithms(environment) {
  const configured = String(environment.AUTH_JWT_ALGORITHMS || "RS256")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);
  if (!configured.length || configured.some(value => !defaultAlgorithms.includes(value))) {
    throw new Error("AUTH_ALGORITHM_NOT_ALLOWED");
  }
  return configured;
}

function claim(payload, environment, setting, fallback) {
  return payload[String(environment[setting] || fallback)];
}

function hasMfa(payload, environment) {
  const methods = Array.isArray(payload.amr) ? payload.amr.map(value => String(value).toLowerCase()) : [];
  const acceptedAcr = String(environment.AUTH_MFA_ACR_VALUES || "")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);
  return methods.includes("mfa") || (acceptedAcr.length > 0 && acceptedAcr.includes(payload.acr));
}

function httpsUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error("AUTH_HTTPS_REQUIRED");
  return url;
}

export function bearerToken(headers = {}) {
  const authorization = String(headers.authorization || headers.Authorization || "");
  const match = authorization.match(/^Bearer ([^\s]+)$/);
  if (!match) throw new Error("BEARER_TOKEN_REQUIRED");
  return match[1];
}

export async function verifyOidcToken({ token, environment = {}, jwks } = {}) {
  const issuer = required(environment, "AUTH_ISSUER");
  const audience = required(environment, "AUTH_AUDIENCE");
  const jwksUrl = required(environment, "AUTH_JWKS_URL");
  if (environment.AUTH_MFA_ENFORCED !== "true") throw new Error("MFA_ENFORCEMENT_REQUIRED");
  httpsUrl(issuer);

  const keySet = jwks || createRemoteJWKSet(httpsUrl(jwksUrl));
  const { payload, protectedHeader } = await jwtVerify(token, keySet, {
    issuer,
    audience,
    algorithms: algorithms(environment),
    clockTolerance: 5
  });
  if (!hasMfa(payload, environment)) throw new Error("MFA_REQUIRED");

  const tenantId = claim(payload, environment, "AUTH_TENANT_CLAIM", "tenant_id");
  const venueId = claim(payload, environment, "AUTH_VENUE_CLAIM", "venue_id");
  const role = claim(payload, environment, "AUTH_ROLE_CLAIM", "role");
  if (!payload.sub || !tenantId || !venueId || !allowedRoles.has(role)) throw new Error("AUTHORIZATION_CLAIMS_INVALID");

  return Object.freeze({
    subject: payload.sub,
    tenantId,
    venueId,
    role,
    verified: true,
    mfaVerified: true,
    issuer: payload.iss,
    expiresAt: payload.exp,
    algorithm: protectedHeader.alg
  });
}

export async function verifyOidcRequest(request, environment = process.env, options = {}) {
  return verifyOidcToken({ token: bearerToken(request.headers), environment, jwks: options.jwks });
}

export async function verifyJwksConnectivity(environment = {}, options = {}) {
  try {
    required(environment, "AUTH_ISSUER");
    required(environment, "AUTH_AUDIENCE");
    algorithms(environment);
    httpsUrl(required(environment, "AUTH_ISSUER"));
    const url = httpsUrl(required(environment, "AUTH_JWKS_URL"));
    const fetcher = options.fetch || fetch;
    const response = await fetcher(url, {
      headers: { accept: "application/json" },
      redirect: "error",
      signal: AbortSignal.timeout(options.timeoutMs || 3000)
    });
    if (!response.ok) return false;
    const body = await response.json();
    const acceptedAlgorithms = algorithms(environment);
    return Array.isArray(body.keys) && body.keys.some(key => key && key.kid && ["RSA", "EC"].includes(key.kty) && (!key.use || key.use === "sig") && (!key.alg || acceptedAlgorithms.includes(key.alg)));
  } catch {
    return false;
  }
}
