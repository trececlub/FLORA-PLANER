import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserById, validateUserCredentials, type PlannerUser } from "@/lib/data-store";
import {
  createSessionToken,
  readSessionClaims,
  sessionMaxAgeSeconds,
} from "@/lib/session-token";

export const SESSION_COOKIE = "flora_planer_session";

export async function loginWithCredentials(email: string, password: string) {
  return validateUserCredentials(email, password);
}

export async function createSession(
  user: PlannerUser,
  options?: { rememberMe?: boolean },
) {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";
  const rememberMe = options?.rememberMe === true;
  const maxAge = sessionMaxAgeSeconds(rememberMe);
  const sessionToken = createSessionToken({
    userId: user.id,
    role: user.role,
    rememberMe,
  });
  if (!sessionToken) {
    throw new Error("Missing session secret configuration");
  }

  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "strict",
    secure,
    path: "/",
    maxAge,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
  const claims = readSessionClaims(sessionToken);
  if (!claims) return null;

  const user = await getUserById(claims.sub);
  if (!user || user.status !== "Active") return null;
  if (user.role !== claims.role) return null;
  return user;
}

export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
