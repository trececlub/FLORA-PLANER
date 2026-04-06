import Link from "next/link";
import { markNotificationsReadAction } from "@/app/(planner)/actions";
import { PlannerPage, SaveMessage } from "@/components/planner-page";
import { Badge, EmptyState, SectionCard } from "@/components/ui";
import { requireSessionUser } from "@/lib/auth";
import { getUserNotifications } from "@/lib/data-store";
import { dateFormat } from "@/lib/planner-view";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function strParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function NotificationsPage({ searchParams }: PageProps) {
  const user = await requireSessionUser();
  const params = await searchParams;
  const saved = strParam(params.saved);
  const error = strParam(params.error);
  const notifications = await getUserNotifications(user.id);

  return (
    <PlannerPage
      title="Notificaciones"
      description="Avisos de asignaciones y novedades del proyecto."
    >
      <SaveMessage saved={saved} error={error} />

      <SectionCard
        title="Bandeja"
        subtitle="Cuando una tarea te sea asignada aparecera aqui."
        action={
          <form action={markNotificationsReadAction}>
            <input type="hidden" name="returnTo" value="/notifications" />
            <button className="btn btn-ghost" type="submit">
              Marcar todas como leidas
            </button>
          </form>
        }
      >
        {notifications.length === 0 ? (
          <EmptyState
            title="Sin notificaciones"
            detail="Cuando te asignen tareas o novedades del proyecto las veras aqui."
          />
        ) : (
          <div className="stack-list">
            {notifications.map((notification) => (
              <article key={notification.id} className="list-row compact">
                <div className="list-row-head">
                  <div>
                    <p className="list-title">{notification.title}</p>
                    <p className="list-subtitle">{notification.description}</p>
                  </div>
                  <div className="badge-row">
                    <Badge tone={notification.readAt ? "muted" : "accent"}>
                      {notification.readAt ? "Leida" : "Nueva"}
                    </Badge>
                    <Badge tone="muted">{dateFormat(notification.createdAt)}</Badge>
                  </div>
                </div>
                <Link href={notification.linkPath || "/dashboard"} className="text-link">
                  Ver detalle
                </Link>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </PlannerPage>
  );
}
