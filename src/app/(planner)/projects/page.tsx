import {
  createProjectAction,
  deleteProjectAction,
  updateProjectProgressAction,
} from "@/app/(planner)/actions";
import { DeleteConfirmForm } from "@/components/delete-confirm-form";
import { PlannerPage, SaveMessage } from "@/components/planner-page";
import { Badge, EmptyState, ProgressBar, SectionCard } from "@/components/ui";
import { requireSessionUser } from "@/lib/auth";
import { canManageUsers, getPlannerSnapshot } from "@/lib/data-store";
import {
  dateFormat,
  projectPriorityLabel,
  projectStatusLabel,
  toneForPriority,
  toneForProjectStatus,
} from "@/lib/planner-view";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function strParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function ProjectsPage({ searchParams }: PageProps) {
  const currentUser = await requireSessionUser();
  const params = await searchParams;
  const saved = strParam(params.saved);
  const error = strParam(params.error);

  const snapshot = await getPlannerSnapshot();

  return (
    <PlannerPage
      title="Proyectos"
      description="Planea, actualiza avance y controla prioridades sin perder contexto del equipo."
    >
      <SaveMessage saved={saved} error={error} />

      <SectionCard title="Crear proyecto" subtitle="Formulario compacto para mantener orden en móvil.">
        <details className="fold-card" open={snapshot.projects.length === 0}>
          <summary>Abrir formulario</summary>
          <form action={createProjectAction} className="form-grid">
            <input type="hidden" name="returnTo" value="/projects" />
            <label>
              Nombre
              <input name="name" required placeholder="Ej: Expansion vertical restaurantes" />
            </label>
            <label>
              Descripcion
              <textarea name="description" rows={3} placeholder="Objetivo y alcance" />
            </label>
            <label>
              Estado
              <select name="status" defaultValue="Planned">
                <option value="Planned">Planeado</option>
                <option value="InProgress">En progreso</option>
                <option value="Blocked">Bloqueado</option>
                <option value="Done">Completado</option>
              </select>
            </label>
            <label>
              Prioridad
              <select name="priority" defaultValue="Medium">
                <option value="High">Alta</option>
                <option value="Medium">Media</option>
                <option value="Low">Baja</option>
              </select>
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
              Inicio
              <input name="startDate" type="date" />
            </label>
            <label>
              Entrega
              <input name="dueDate" type="date" />
            </label>
            <label>
              Tags
              <input name="tags" placeholder="ventas, proceso, vps" />
            </label>
            <label>
              Etapa 1
              <input name="stage1" required placeholder="Ej: Diagnostico" defaultValue="Planificacion" />
            </label>
            <label>
              Etapa 2
              <input name="stage2" required placeholder="Ej: Implementacion" defaultValue="Implementacion" />
            </label>
            <label>
              Etapa 3
              <input name="stage3" required placeholder="Ej: Revision" defaultValue="Revision" />
            </label>
            <label>
              Etapa 4
              <input name="stage4" required placeholder="Ej: Entrega" defaultValue="Entrega" />
            </label>
            <button className="btn btn-primary" type="submit">
              Guardar proyecto
            </button>
          </form>
        </details>
      </SectionCard>

      <SectionCard title="Tablero de proyectos" subtitle="Actualiza progreso rapido sin navegar a otra vista.">
        {snapshot.projects.length === 0 ? (
          <EmptyState title="Sin proyectos" detail="Empieza creando un proyecto." />
        ) : (
          <div className="stack-list">
            {snapshot.projects.map((project) => (
              <article key={project.id} className="list-row">
                <div className="list-row-head">
                  <div>
                    <p className="list-title">{project.name}</p>
                    <p className="list-subtitle">{project.description}</p>
                  </div>
                  <div className="badge-row">
                    <Badge tone={toneForProjectStatus(project.status)}>{projectStatusLabel[project.status]}</Badge>
                    <Badge tone={toneForPriority(project.priority)}>{projectPriorityLabel[project.priority]}</Badge>
                  </div>
                </div>

                <p className="list-subtitle">
                  Responsable: {snapshot.userMap[project.ownerId]?.name || "Sin asignar"} · Inicio {dateFormat(project.startDate)} · Entrega {dateFormat(project.dueDate)}
                </p>
                <p className="list-subtitle">
                  Creado por: {snapshot.userMap[project.createdByUserId]?.name || "Usuario"} ({project.createdByRole})
                </p>
                <p className="list-subtitle">
                  Etapas: {project.stages.map((stage) => stage.name).join(" · ")}
                </p>
                <ProgressBar value={project.progress} />

                <form action={updateProjectProgressAction} className="inline-form">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="returnTo" value="/projects" />
                  <label>
                    Estado
                    <select name="status" defaultValue={project.status}>
                      <option value="Planned">Planeado</option>
                      <option value="InProgress">En progreso</option>
                      <option value="Blocked">Bloqueado</option>
                      <option value="Done">Completado</option>
                    </select>
                  </label>
                  <button type="submit" className="btn btn-ghost">
                    Actualizar
                  </button>
                </form>
                <p className="list-subtitle">Avance calculado automaticamente segun tareas completadas.</p>

                {project.createdByUserId === currentUser.id || canManageUsers(currentUser.role) ? (
                  <DeleteConfirmForm
                    action={deleteProjectAction}
                    hiddenInputs={[
                      { name: "projectId", value: project.id },
                      { name: "returnTo", value: "/projects" },
                    ]}
                    triggerLabel="Eliminar proyecto"
                    title="Confirmar eliminacion"
                    description="Esta accion eliminara este proyecto de forma permanente."
                    impact="Se eliminaran tambien todas sus tareas asociadas."
                  />
                ) : (
                  <p className="list-subtitle">Solo el creador o la cuenta admin puede eliminarlo.</p>
                )}
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </PlannerPage>
  );
}
