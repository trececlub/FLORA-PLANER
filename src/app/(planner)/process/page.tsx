import {
  createDecisionAction,
  createDocAction,
  createProcessStepAction,
  deleteDecisionAction,
  deleteDocAction,
  deleteProcessStepAction,
  updateProcessStepStatusAction,
} from "@/app/(planner)/actions";
import { DeleteConfirmForm } from "@/components/delete-confirm-form";
import { PlannerPage, SaveMessage } from "@/components/planner-page";
import { Badge, EmptyState, SectionCard } from "@/components/ui";
import { getPlannerSnapshot } from "@/lib/data-store";
import {
  dateFormat,
  processStepStatusLabel,
  toneForProcessStatus,
  truncate,
} from "@/lib/planner-view";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function strParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function ProcessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const saved = strParam(params.saved);
  const error = strParam(params.error);

  const snapshot = await getPlannerSnapshot();

  return (
    <PlannerPage
      title="Proceso"
      description="Define pasos operativos, decisiones clave y documentos de referencia del equipo."
    >
      <SaveMessage saved={saved} error={error} />

      <section className="three-col-grid">
        <SectionCard title="Nuevo paso" subtitle="Estandariza el proceso operativo.">
          <details className="fold-card">
            <summary>Abrir formulario</summary>
            <form action={createProcessStepAction} className="form-grid">
              <input type="hidden" name="returnTo" value="/process" />
              <label>
                Fase
                <input name="phase" placeholder="Producto, Ventas, Operacion" />
              </label>
              <label>
                Titulo
                <input name="title" required placeholder="Ej: Definir handoff comercial" />
              </label>
              <label>
                Descripcion
                <textarea rows={3} name="description" />
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
              <button className="btn btn-primary" type="submit">
                Guardar paso
              </button>
            </form>
          </details>
        </SectionCard>

        <SectionCard title="Nueva decision" subtitle="Registra acuerdos para evitar friccion futura.">
          <details className="fold-card">
            <summary>Abrir formulario</summary>
            <form action={createDecisionAction} className="form-grid">
              <input type="hidden" name="returnTo" value="/process" />
              <label>
                Titulo
                <input name="title" required />
              </label>
              <label>
                Contexto
                <textarea rows={3} name="context" required />
              </label>
              <label>
                Decision
                <textarea rows={3} name="decision" required />
              </label>
              <label>
                Fecha
                <input type="date" name="date" />
              </label>
              <button className="btn btn-primary" type="submit">
                Guardar decision
              </button>
            </form>
          </details>
        </SectionCard>

        <SectionCard title="Nuevo documento" subtitle="Centraliza referencias del equipo.">
          <details className="fold-card">
            <summary>Abrir formulario</summary>
            <form action={createDocAction} className="form-grid">
              <input type="hidden" name="returnTo" value="/process" />
              <label>
                Titulo
                <input name="title" required />
              </label>
              <label>
                Categoria
                <input name="category" placeholder="Comercial, Infra, Legal" />
              </label>
              <label>
                URL
                <input name="url" type="url" placeholder="https://..." />
              </label>
              <label>
                Notas
                <textarea rows={3} name="notes" />
              </label>
              <button className="btn btn-primary" type="submit">
                Guardar doc
              </button>
            </form>
          </details>
        </SectionCard>
      </section>

      <SectionCard title="Pasos del proceso" subtitle="Actualiza estado por paso para saber donde se traba el flujo.">
        {snapshot.processSteps.length === 0 ? (
          <EmptyState title="Sin pasos" detail="Crea el primer paso del proceso." />
        ) : (
          <div className="stack-list">
            {snapshot.processSteps.map((step) => (
              <article key={step.id} className="list-row compact">
                <div className="list-row-head">
                  <div>
                    <p className="list-title">{step.title}</p>
                    <p className="list-subtitle">{step.phase} · {truncate(step.description, 110)}</p>
                  </div>
                  <Badge tone={toneForProcessStatus(step.status)}>{processStepStatusLabel[step.status]}</Badge>
                </div>
                <p className="list-subtitle">
                  Responsable: {snapshot.userMap[step.ownerId]?.name || "Sin asignar"} · Fecha {dateFormat(step.targetDate)}
                </p>
                <form action={updateProcessStepStatusAction} className="inline-form">
                  <input type="hidden" name="stepId" value={step.id} />
                  <input type="hidden" name="returnTo" value="/process" />
                  <label>
                    Estado
                    <select name="status" defaultValue={step.status}>
                      <option value="Pending">Pendiente</option>
                      <option value="InProgress">En progreso</option>
                      <option value="Done">Hecho</option>
                    </select>
                  </label>
                  <button type="submit" className="btn btn-ghost">
                    Guardar
                  </button>
                </form>
                <DeleteConfirmForm
                  action={deleteProcessStepAction}
                  hiddenInputs={[
                    { name: "stepId", value: step.id },
                    { name: "returnTo", value: "/process" },
                  ]}
                  triggerLabel="Eliminar paso"
                  title="Confirmar eliminacion"
                  description="Esta accion eliminara este paso del proceso de forma permanente."
                />
              </article>
            ))}
          </div>
        )}
      </SectionCard>

      <section className="two-col-grid">
        <SectionCard title="Decisiones recientes" subtitle="Registro historico de decisiones de producto y operacion.">
          {snapshot.decisions.length === 0 ? (
            <EmptyState title="Sin decisiones" detail="Agrega decisiones para dejar trazabilidad." />
          ) : (
            <ul className="stack-list">
              {snapshot.decisions.slice(0, 10).map((decision) => (
                <li key={decision.id} className="list-row compact">
                  <p className="list-title">{decision.title}</p>
                  <p className="list-subtitle">{truncate(decision.context, 120)}</p>
                  <p className="list-subtitle">{truncate(decision.decision, 140)}</p>
                  <p className="list-subtitle">
                    {snapshot.userMap[decision.ownerId]?.name || "Equipo"} · {dateFormat(decision.date)}
                  </p>
                  <form action={deleteDecisionAction}>
                    <input type="hidden" name="decisionId" value={decision.id} />
                    <input type="hidden" name="returnTo" value="/process" />
                    <button type="submit" className="btn btn-danger">
                      Eliminar decision
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Documentos" subtitle="Accesos rapidos a recursos clave del equipo.">
          {snapshot.docs.length === 0 ? (
            <EmptyState title="Sin documentos" detail="Crea documentos para estandarizar trabajo." />
          ) : (
            <ul className="stack-list">
              {snapshot.docs.slice(0, 10).map((doc) => (
                <li key={doc.id} className="list-row compact">
                  <div className="list-row-head">
                    <p className="list-title">{doc.title}</p>
                    <Badge tone="muted">{doc.category}</Badge>
                  </div>
                  <p className="list-subtitle">{truncate(doc.notes, 130)}</p>
                  {doc.url ? (
                    <a className="text-link" href={doc.url} target="_blank" rel="noreferrer">
                      Abrir enlace
                    </a>
                  ) : null}
                  <form action={deleteDocAction}>
                    <input type="hidden" name="docId" value={doc.id} />
                    <input type="hidden" name="returnTo" value="/process" />
                    <button type="submit" className="btn btn-danger">
                      Eliminar doc
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </section>
    </PlannerPage>
  );
}
