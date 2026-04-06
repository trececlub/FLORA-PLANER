import { NextResponse } from "next/server";
import { createSession, loginWithCredentials } from "@/lib/auth";

function safeNext(pathname: FormDataEntryValue | null) {
  const value = String(pathname || "").trim();
  if (!value.startsWith("/")) return "/dashboard";
  if (value.startsWith("//")) return "/dashboard";
  return value;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "").trim();
  const rememberMe = String(formData.get("rememberMe") || "").trim() === "on";
  const nextPath = safeNext(formData.get("next"));

  const user = await loginWithCredentials(email, password);
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "invalid");
    loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl);
  }

  await createSession(user, { rememberMe });
  const target = user.mustChangePassword ? "/profile?forcePassword=1" : nextPath;
  return NextResponse.redirect(new URL(target, request.url));
}
