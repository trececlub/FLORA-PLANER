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

function useChatUnread(initialHasUnread: boolean) {
  const [hasChatUnread, setHasChatUnread] = useState(initialHasUnread);

  useEffect(() => {
    setHasChatUnread(initialHasUnread);
  }, [initialHasUnread]);

  useEffect(() => {
    let cancelled = false;

    async function refreshUnread() {
      try {
        const response = await fetch("/api/chat/unread", { cache: "no-store" });
        if (!response.ok) return;

        const payload = (await response.json()) as { hasUnread?: unknown };
        if (cancelled || typeof payload.hasUnread !== "boolean") return;
        setHasChatUnread(payload.hasUnread);
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

  return hasChatUnread;
}

function navLabel(item: NavItem, hasChatUnread: boolean) {
  return (
    <span className="planner-nav-label">
      <span>{item.label}</span>
      {item.href === "/chat" && hasChatUnread ? (
        <span className="chat-unread-dot" aria-label="Mensajes sin leer" />
      ) : null}
    </span>
  );
}

export function PlannerSidebarNav({
  role,
  initialHasChatUnread = false,
}: {
  role: string;
  initialHasChatUnread?: boolean;
}) {
  const pathname = usePathname();
  const hasChatUnread = useChatUnread(initialHasChatUnread);

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
            {navLabel(item, hasChatUnread)}
          </Link>
        );
      })}
    </nav>
  );
}

export function PlannerMobileTabs({
  role,
  initialHasChatUnread = false,
}: {
  role: string;
  initialHasChatUnread?: boolean;
}) {
  const pathname = usePathname();
  const hasChatUnread = useChatUnread(initialHasChatUnread);

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
            {navLabel(item, hasChatUnread)}
          </Link>
        );
      })}
    </nav>
  );
}
