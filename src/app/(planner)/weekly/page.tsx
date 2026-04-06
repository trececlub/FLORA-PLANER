import { createWeeklyReviewAction, deleteAllWeeklyReviewsAction } from "@/app/(planner)/actions";
import { DeleteConfirmForm } from "@/components/delete-confirm-form";
import { PlannerPage, SaveMessage } from "@/components/planner-page";
import { EmptyState, SectionCard } from "@/components/ui";
import { requireSessionUser } from "@/lib/auth";
import { canManageUsers, getPlannerSnapshot } from "@/lib/data-store";
import { dateFormat } from "@/lib/planner-view";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function strParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function currentWeekLabel() {
  const now = new Date();
  const start = new Date(now);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.toLocaleDateString("es-CO", { day: "2-digit", month: "short" })} - ${end.toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}`;
}

export default async function WeeklyPage({ searchParams }: PageProps) {
  const currentUser = await requireSessionUser();
  const canDeleteHistory = canManageUsers(currentUser.role);
  const params = await searchParams;
  const saved = strParam(params.saved);
  const error = strParam(params.error);
  const snapshot = await getPlannerSnapshot();

  return (
    <PlannerPage
      title="Revision semanal"
      description="Documenta avances, bloqueos y foco de la siguiente semana para mantener ritmo."
    >
      <SaveMessage saved={saved} error={error} />

      <SectionCard title="Nueva revision" subtitle="Formato simple para alinear al equipo en menos de 5 minutos.">
        <details className="fold-card" open={snapshot.weeklyReviews.length === 0}>
          <summary>Abrir formulario</summary>
          <form action={createWeeklyReviewAction} className="form-grid">
            <input type="hidden" name="returnTo" value="/weekly" />
            <label>
              Semana
              <input name="weekLabel" defaultValue={currentWeekLabel()} required />
            </label>
            <label>
              Que salio bien
              <textarea name="wins" rows={3} required />
            </label>
            <label>
              Bloqueos
              <textarea name="blockers" rows={3} required />
            </label>
            <label>
              Siguiente foco
              <textarea name="nextFocus" rows={3} required />
            </label>
            <button className="btn btn-primary" type="submit">
              Guardar revision
            </button>
          </form>
        </details>
      </SectionCard>

      <SectionCard
        title="Historial"
        subtitle="Bitacora de decisiones y resultados por semana."
        action={
          canDeleteHistory && snapshot.weeklyReviews.length > 0 ? (
            <DeleteConfirmForm
              action={deleteAllWeeklyReviewsAction}
              hiddenInputs={[{ name: "returnTo", value: "/weekly" }]}
              triggerLabel="Eliminar historial"
              title="Confirmar eliminacion"
              description="Esta accion eliminara todo el historial de revisiones semanales."
              impact="Solo la cuenta administradora tiene permiso para esta accion."
            />
          ) : undefined
        }
      >
        {snapshot.weeklyReviews.length === 0 ? (
          <EmptyState title="Sin revisiones" detail="Crea la primera revision semanal." />
        ) : (
          <div className="stack-list">
            {snapshot.weeklyReviews.map((review) => (
              <article key={review.id} className="list-row">
                <div className="list-row-head">
                  <p className="list-title">Semana {review.weekLabel}</p>
                  <p className="list-subtitle">{dateFormat(review.createdAt)}</p>
                </div>
                <p className="list-subtitle">
                  Responsable: {snapshot.userMap[review.ownerId]?.name || "Equipo"}
                </p>
                <div className="note-grid">
                  <div>
                    <p className="note-title">Wins</p>
                    <p className="list-subtitle">{review.wins}</p>
                  </div>
                  <div>
                    <p className="note-title">Bloqueos</p>
                    <p className="list-subtitle">{review.blockers}</p>
                  </div>
                  <div>
                    <p className="note-title">Proximo foco</p>
                    <p className="list-subtitle">{review.nextFocus}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </PlannerPage>
  );
}
