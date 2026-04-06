import type { ReactNode } from "react";
import Image from "next/image";
import { requireSessionUser } from "@/lib/auth";
import { PlannerMobileTabs, PlannerSidebarNav } from "@/components/planner-nav";
import { PresenceHeartbeat } from "@/components/presence-heartbeat";
import { logoutAction } from "@/app/(planner)/actions";
import {
  getChatUnreadSummary,
  getNotificationUnreadSummary,
  getPermissionsForUser,
} from "@/lib/data-store";

export default async function PlannerLayout({ children }: { children: ReactNode }) {
  const user = await requireSessionUser();
  const permissions = getPermissionsForUser(user);
  const chatUnread = await getChatUnreadSummary(user.id);
  const notificationsUnread = await getNotificationUnreadSummary(user.id);
  const initials = user.name
    .split(" ")
    .map((part) => part[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="planner-app-shell">
      <PresenceHeartbeat />
      <aside className="planner-sidebar">
        <div>
          <Image
            src="/brand/flora-logo.svg"
            alt="FLORA"
            width={204}
            height={60}
            className="brand-logo sidebar-brand-logo"
            priority
          />
          <p className="sidebar-kicker">FLORA PLANER</p>
          <h1 className="sidebar-title">Panel de marca</h1>
        </div>

        <PlannerSidebarNav
          permissions={permissions}
          initialHasChatUnread={chatUnread.hasUnread}
          initialHasNotificationUnread={notificationsUnread.hasUnread}
        />

        <div className="sidebar-user mt-auto">
          <div className="sidebar-user-head">
            {user.avatarDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarDataUrl} alt={`Foto de ${user.name}`} className="user-avatar" />
            ) : (
              <div className="user-avatar user-avatar-fallback">{initials || "FP"}</div>
            )}
            <div>
              <p>{user.name}</p>
              <span>{user.jobTitle || user.role}</span>
            </div>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="btn btn-ghost w-full">
              Cerrar sesion
            </button>
          </form>
        </div>
      </aside>

      <div className="planner-main-wrap">
        <header className="planner-mobile-header">
          <div className="mobile-brand-wrap">
            <Image
              src="/brand/flora-icon.svg"
              alt="Icono FLORA"
              width={24}
              height={24}
              className="mobile-brand-icon"
              priority
            />
            <div>
              <p className="sidebar-kicker">FLORA PLANER</p>
              <p className="mobile-user">
                {user.name} · {user.jobTitle || user.role}
              </p>
            </div>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="btn btn-ghost">
              Salir
            </button>
          </form>
        </header>

        <PlannerMobileTabs
          permissions={permissions}
          initialHasChatUnread={chatUnread.hasUnread}
          initialHasNotificationUnread={notificationsUnread.hasUnread}
        />

        <main className="planner-content">{children}</main>

      </div>
    </div>
  );
}
