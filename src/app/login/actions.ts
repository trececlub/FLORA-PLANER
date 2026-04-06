"use server";

import { redirect } from "next/navigation";
import { createSession, loginWithCredentials } from "@/lib/auth";

function safeNext(pathname: FormDataEntryValue | null) {
  const value = String(pathname || "").trim();
  if (!value.startsWith("/")) return "/dashboard";
  if (value.startsWith("//")) return "/dashboard";
  return value;
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "").trim();
  const rememberMe = String(formData.get("rememberMe") || "").trim() === "on";
  const nextPath = safeNext(formData.get("next"));

  const user = await loginWithCredentials(email, password);
  if (!user) {
    redirect(`/login?error=invalid&next=${encodeURIComponent(nextPath)}`);
  }

  await createSession(user, { rememberMe });
  if (user.mustChangePassword) {
    redirect("/profile?forcePassword=1");
  }
  redirect(nextPath);
}
