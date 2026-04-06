import { getSessionUser } from "@/lib/auth";
import { recordUserPresence } from "@/lib/data-store";

export const preferredRegion = "iad1";

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  await recordUserPresence({ userId: user.id });
  return Response.json({ ok: true });
}
