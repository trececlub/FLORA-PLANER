import { createGoalAction, deleteGoalAction, updateGoalProgressAction } from "@/app/(planner)/actions";
import { DeleteConfirmForm } from "@/components/delete-confirm-form";
import { PlannerPage, SaveMessage } from "@/components/planner-page";
import { Badge, EmptyState, ProgressBar, SectionCard } from "@/components/ui";
import { getPlannerSnapshot } from "@/lib/data-store";
import { dateFormat, goalStatusLabel, toneForGoalStatus } from "@/lib/planner-view";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function strParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function GoalsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const saved = strParam(params.saved);
  const error = strParam(params.error);

  const snapshot = await getPlannerSnapshot();

  return (
    <PlannerPage title="Metas" description="Define objetivos y mide progreso mensual con un porcentaje claro.">
      <SaveMessage saved={saved} error={error} />

      <SectionCard title="Nueva meta" subtitle="Mantiene claridad de resultados esperados y fecha objetivo.">
        <details className="fold-card">
          <summary>Abrir formulario</summary>
          <form action={createGoalAction} className="form-grid">
            <input type="hidden" name="returnTo" value="/goals" />
            <label>
              Meta
              <input name="title" required placeholder="Ej: 10 clientes activos en segmento salud" />
            </label>
            <label>
              Responsable
              <select name="ownerId" defaultValue={snapshot.users[0]?.id}>
                {snapshot.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Fecha objetivo
              <input type="date" name="targetDate" />
            </label>
            <label>
              Notas
              <textarea rows={3} name="notes" placeholder="Indicadores, alcance, dependencias" />
            </label>
            <button className="btn btn-primary" type="submit">
              Guardar meta
            </button>
          </form>
        </details>
      </SectionCard>

      <SectionCard title="Seguimiento" subtitle="Ajusta progreso en segundos para tener visibilidad real.">
        {snapshot.goals.length === 0 ? (
          <EmptyState title="Sin metas" detail="Crea metas para medir avances de negocio." />
        ) : (
          <div className="stack-list">
            {snapshot.goals.map((goal) => (
              <article key={goal.id} className="list-row">
                <div className="list-row-head">
                  <div>
                    <p className="list-title">{goal.title}</p>
                    <p className="list-subtitle">{goal.notes}</p>
                  </div>
                  <Badge tone={toneForGoalStatus(goal.status)}>{goalStatusLabel[goal.status]}</Badge>
                </div>

                <p className="list-subtitle">
                  Responsable: {snapshot.userMap[goal.ownerId]?.name || "Sin asignar"} · Fecha objetivo {dateFormat(goal.targetDate)}
                </p>
                <ProgressBar value={goal.progress} />

                <form action={updateGoalProgressAction} className="inline-form">
                  <input type="hidden" name="goalId" value={goal.id} />
                  <input type="hidden" name="returnTo" value="/goals" />
                  <label>
                    Progreso %
                    <input type="number" name="progress" defaultValue={goal.progress} min={0} max={100} />
                  </label>
                  <button className="btn btn-ghost" type="submit">
                    Actualizar
                  </button>
                </form>
                <DeleteConfirmForm
                  action={deleteGoalAction}
                  hiddenInputs={[
                    { name: "goalId", value: goal.id },
                    { name: "returnTo", value: "/goals" },
                  ]}
                  triggerLabel="Eliminar meta"
                  title="Confirmar eliminacion"
                  description="Esta accion eliminara esta meta de forma permanente."
                />
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </PlannerPage>
  );
}
