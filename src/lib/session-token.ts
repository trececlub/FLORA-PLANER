import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { PlannerRole } from "@/lib/data-store";

const SESSION_SECRET_ENV_KEYS = [
  "FLORA_PLANER_SESSION_SECRET",
  "FLORA_PLANNER_SESSION_SECRET",
  "LOOP_PLANNER_SESSION_SECRET",
  "AUTH_SECRET",
  "NEXTAUTH_SECRET",
] as const;

const TOKEN_VERSION = 1;
const SESSION_TTL_SECONDS = 60 * 60 * 12;
const REMEMBER_ME_TTL_SECONDS = 60 * 60 * 24 * 30;
const VALID_ROLES = new Set<PlannerRole>(["CEO", "CTO", "Member"]);

export type SessionClaims = {
  v: number;
  sub: string;
  role: PlannerRole;
  mustChangePassword: boolean;
  iat: number;
  exp: number;
};

export function sessionMaxAgeSeconds(rememberMe: boolean) {
  return rememberMe ? REMEMBER_ME_TTL_SECONDS : SESSION_TTL_SECONDS;
}

function getConfiguredSecret() {
  for (const key of SESSION_SECRET_ENV_KEYS) {
    const value = String(process.env[key] || "").trim();
    if (value) return value;
  }

  const derivedSource =
    String(process.env.POSTGRES_URL || "").trim() ||
    String(process.env.POSTGRES_PRISMA_URL || "").trim() ||
    String(process.env.DATABASE_URL || "").trim();
  if (derivedSource) {
    return createHash("sha256")
      .update(`flora-planer:${derivedSource}`)
      .digest("hex");
  }

  const vercelDerivedSource = [
    String(process.env.VERCEL_PROJECT_ID || "").trim(),
    String(process.env.VERCEL_GIT_REPO_ID || "").trim(),
    String(process.env.VERCEL_URL || "").trim(),
  ]
    .filter(Boolean)
    .join(":");

  if (vercelDerivedSource) {
    return createHash("sha256")
      .update(`flora-planer:${vercelDerivedSource}`)
      .digest("hex");
  }

  // Keep sessions working even if no secret/env is configured in production.
  // This fallback should still be replaced with FLORA_PLANER_SESSION_SECRET.
  if (process.env.NODE_ENV === "production") {
    return "flora-planer-production-fallback-secret-change-me";
  }

  return "flora-planer-dev-insecure-secret";
}

function signPayload(payloadBase64Url: string, secret: string) {
  return createHmac("sha256", secret)
    .update(payloadBase64Url)
    .digest("base64url");
}

function decodeClaims(payloadBase64Url: string) {
  try {
    const payloadJson = Buffer.from(payloadBase64Url, "base64url").toString("utf8");
    const parsed = JSON.parse(payloadJson) as Partial<SessionClaims>;
    const iat = parsed.iat;
    const exp = parsed.exp;

    if (parsed.v !== TOKEN_VERSION) return null;
    if (typeof parsed.sub !== "string" || !parsed.sub.trim()) return null;
    if (!VALID_ROLES.has(parsed.role as PlannerRole)) return null;
    if (typeof parsed.mustChangePassword !== "boolean") return null;
    if (typeof iat !== "number" || !Number.isInteger(iat)) return null;
    if (typeof exp !== "number" || !Number.isInteger(exp)) return null;
    if (exp <= iat) return null;

    return {
      v: parsed.v,
      sub: parsed.sub.trim(),
      role: parsed.role as PlannerRole,
      mustChangePassword: parsed.mustChangePassword,
      iat,
      exp,
    } satisfies SessionClaims;
  } catch {
    return null;
  }
}

export function createSessionToken(input: {
  userId: string;
  role: PlannerRole;
  mustChangePassword: boolean;
  rememberMe?: boolean;
  nowMs?: number;
}) {
  const secret = getConfiguredSecret();
  if (!secret) return "";

  const nowSeconds = Math.floor((input.nowMs || Date.now()) / 1000);
  const ttl = sessionMaxAgeSeconds(input.rememberMe === true);
  const claims: SessionClaims = {
    v: TOKEN_VERSION,
    sub: input.userId,
    role: input.role,
    mustChangePassword: input.mustChangePassword,
    iat: nowSeconds,
    exp: nowSeconds + ttl,
  };

  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = signPayload(payload, secret);
  return `${payload}.${signature}`;
}

export function readSessionClaims(sessionToken: string | undefined) {
  const raw = String(sessionToken || "").trim();
  if (!raw || raw.length > 4096) return null;

  const [payload, signature, extra] = raw.split(".");
  if (!payload || !signature || extra) return null;

  const secret = getConfiguredSecret();
  if (!secret) return null;

  const expected = Buffer.from(signPayload(payload, secret), "utf8");
  const provided = Buffer.from(signature, "utf8");
  if (expected.length !== provided.length) return null;
  if (!timingSafeEqual(expected, provided)) return null;

  const claims = decodeClaims(payload);
  if (!claims) return null;

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (claims.iat > nowSeconds + 60) return null;
  if (claims.exp <= nowSeconds) return null;

  return claims;
}
