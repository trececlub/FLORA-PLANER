"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type NavItem = {
  href: string;
  label: string;
};

const items: NavItem[] = [
  { href: "/dashboard", label: "Inicio" },
  { href: "/projects", label: "Proyectos" },
  { href: "/tasks", label: "Tareas" },
  { href: "/goals", label: "Metas" },
  { href: "/notifications", label: "Notificaciones" },
  { href: "/chat", label: "Chat" },
  { href: "/meetings", label: "Reuniones" },
  { href: "/process", label: "Proceso" },
  { href: "/gallery", label: "Galeria" },
  { href: "/timeline", label: "Timeline" },
  { href: "/weekly", label: "Semanal" },
  { href: "/profile", label: "Perfil" },
  { href: "/users", label: "Equipo" },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function visibleItems(role: string) {
  const canManage = role === "CEO" || role === "Owner";
  return items.filter((item) => (item.href === "/users" ? canManage : true));
}

function useUnreadBadges(initialHasChatUnread: boolean, initialHasNotificationUnread: boolean) {
  const [hasChatUnread, setHasChatUnread] = useState(initialHasChatUnread);
  const [hasNotificationUnread, setHasNotificationUnread] = useState(initialHasNotificationUnread);

  useEffect(() => {
    setHasChatUnread(initialHasChatUnread);
  }, [initialHasChatUnread]);

  useEffect(() => {
    setHasNotificationUnread(initialHasNotificationUnread);
  }, [initialHasNotificationUnread]);

  useEffect(() => {
    let cancelled = false;

    async function refreshUnread() {
      try {
        const [chatResponse, notificationsResponse] = await Promise.all([
          fetch("/api/chat/unread", { cache: "no-store" }),
          fetch("/api/notifications/unread", { cache: "no-store" }),
        ]);

        if (chatResponse.ok) {
          const payload = (await chatResponse.json()) as { hasUnread?: unknown };
          if (!cancelled && typeof payload.hasUnread === "boolean") {
            setHasChatUnread(payload.hasUnread);
          }
        }

        if (notificationsResponse.ok) {
          const payload = (await notificationsResponse.json()) as { hasUnread?: unknown };
          if (!cancelled && typeof payload.hasUnread === "boolean") {
            setHasNotificationUnread(payload.hasUnread);
          }
        }
      } catch {
        // Best effort polling for nav badge. Ignore transient network errors.
      }
    }

    refreshUnread();
    const interval = window.setInterval(refreshUnread, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return {
    hasChatUnread,
    hasNotificationUnread,
  };
}

function BellIcon() {
  return (
    <svg
      className="notification-bell-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 4a4 4 0 0 0-4 4v2.6c0 .8-.3 1.6-.9 2.2L5 15h14l-2.1-2.2c-.6-.6-.9-1.4-.9-2.2V8a4 4 0 0 0-4-4Z" />
      <path d="M9.5 17a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}

function navLabel(item: NavItem, hasChatUnread: boolean, hasNotificationUnread: boolean) {
  return (
    <span className="planner-nav-label">
      <span className="planner-nav-text">
        {item.href === "/notifications" ? <BellIcon /> : null}
        <span>{item.label}</span>
      </span>
      {item.href === "/notifications" && hasNotificationUnread ? (
        <span className="chat-unread-dot" aria-label="Notificaciones sin leer" />
      ) : null}
      {item.href === "/chat" && hasChatUnread ? (
        <span className="chat-unread-dot" aria-label="Mensajes sin leer" />
      ) : null}
    </span>
  );
}

export function PlannerSidebarNav({
  role,
  initialHasChatUnread = false,
  initialHasNotificationUnread = false,
}: {
  role: string;
  initialHasChatUnread?: boolean;
  initialHasNotificationUnread?: boolean;
}) {
  const pathname = usePathname();
  const unread = useUnreadBadges(initialHasChatUnread, initialHasNotificationUnread);

  return (
    <nav className="planner-sidebar-nav">
      {visibleItems(role).map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`planner-sidebar-link ${active ? "is-active" : ""}`}
          >
            {navLabel(item, unread.hasChatUnread, unread.hasNotificationUnread)}
          </Link>
        );
      })}
    </nav>
  );
}

export function PlannerMobileTabs({
  role,
  initialHasChatUnread = false,
  initialHasNotificationUnread = false,
}: {
  role: string;
  initialHasChatUnread?: boolean;
  initialHasNotificationUnread?: boolean;
}) {
  const pathname = usePathname();
  const unread = useUnreadBadges(initialHasChatUnread, initialHasNotificationUnread);

  return (
    <nav className="planner-mobile-tabs" aria-label="Secciones">
      {visibleItems(role).map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`planner-mobile-tab ${active ? "is-active" : ""}`}
          >
            {navLabel(item, unread.hasChatUnread, unread.hasNotificationUnread)}
          </Link>
        );
      })}
    </nav>
  );
}
