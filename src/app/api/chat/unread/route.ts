import { getSessionUser } from "@/lib/auth";
import { getChatUnreadSummary } from "@/lib/data-store";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const unread = await getChatUnreadSummary(user.id);
  return Response.json({
    hasUnread: unread.hasUnread,
    unreadCount: unread.unreadCount,
  });
}
