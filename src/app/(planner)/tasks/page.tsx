import {
  createTaskAction,
  deleteTaskAction,
  updateTaskStatusAction,
} from "@/app/(planner)/actions";
import { DeleteConfirmForm } from "@/components/delete-confirm-form";
import { PlannerPage, SaveMessage } from "@/components/planner-page";
import { Badge, EmptyState, SectionCard } from "@/components/ui";
import { getPlannerSnapshot } from "@/lib/data-store";
import {
  dateFormat,
  taskPriorityLabel,
  taskStatusLabel,
  toneForPriority,
  toneForTaskStatus,
} from "@/lib/planner-view";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function strParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function TasksPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const saved = strParam(params.saved);
  const error = strParam(params.error);

  const snapshot = await getPlannerSnapshot();

  return (
    <PlannerPage
      title="Tareas"
      description="Organiza el trabajo diario por estado, responsable y fecha limite."
    >
      <SaveMessage saved={saved} error={error} />

      <SectionCard title="Crear tarea" subtitle="Entrada rapida para no perder ideas o pendientes.">
        <details className="fold-card">
          <summary>Abrir formulario</summary>
          <form action={createTaskAction} className="form-grid">
            <input type="hidden" name="returnTo" value="/tasks" />
            <label>
              Titulo
              <input name="title" required placeholder="Ej: Definir estructura final de costos" />
            </label>
            <label>
              Etapa del proyecto
              <select
                name="projectStage"
                defaultValue={
                  snapshot.projects[0]?.stages[0]
                    ? `${snapshot.projects[0].id}::${snapshot.projects[0].stages[0].id}`
                    : ""
                }
              >
                {snapshot.projects.map((project) => (
                  <optgroup key={project.id} label={project.name}>
                    {project.stages.map((stage) => (
                      <option key={stage.id} value={`${project.id}::${stage.id}`}>
                        {stage.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label>
              Detalles
              <textarea name="details" rows={3} placeholder="Contexto, criterio de terminado" />
            </label>
            <label>
              Estado
              <select name="status" defaultValue="Backlog">
                <option value="Backlog">Backlog</option>
                <option value="Doing">En curso</option>
                <option value="Review">En revision</option>
                <option value="Done">Listo</option>
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
              Asignado a
              <select name="assigneeId" defaultValue={snapshot.users[0]?.id}>
                {snapshot.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Fecha limite
              <input name="dueDate" type="date" />
            </label>
            <button className="btn btn-primary" type="submit">
              Guardar tarea
            </button>
          </form>
        </details>
      </SectionCard>

      <SectionCard title="Lista de tareas" subtitle="Actualiza estado en un toque para mantener visibilidad del flujo.">
        {snapshot.tasks.length === 0 ? (
          <EmptyState title="Sin tareas" detail="Agrega tareas para iniciar seguimiento." />
        ) : (
          <div className="stack-list">
            {snapshot.tasks.map((task) => (
              <article key={task.id} className="list-row compact">
                <div className="list-row-head">
                  <div>
                    <p className="list-title">{task.title}</p>
                    <p className="list-subtitle">{task.details}</p>
                  </div>
                  <div className="badge-row">
                    <Badge tone={toneForTaskStatus(task.status)}>{taskStatusLabel[task.status]}</Badge>
                    <Badge tone={toneForPriority(task.priority)}>{taskPriorityLabel[task.priority]}</Badge>
                  </div>
                </div>

                <p className="list-subtitle">
                  Proyecto: {snapshot.projects.find((project) => project.id === task.projectId)?.name || "Sin proyecto"} · Etapa: {snapshot.projects
                    .find((project) => project.id === task.projectId)
                    ?.stages.find((stage) => stage.id === task.stageId)?.name || "Sin etapa"} · Responsable: {snapshot.userMap[task.assigneeId]?.name || "Sin asignar"} · Entrega {dateFormat(task.dueDate)}
                </p>

                <form action={updateTaskStatusAction} className="inline-form">
                  <input type="hidden" name="taskId" value={task.id} />
                  <input type="hidden" name="returnTo" value="/tasks" />
                  <label>
                    Estado
                    <select name="status" defaultValue={task.status}>
                      <option value="Backlog">Backlog</option>
                      <option value="Doing">En curso</option>
                      <option value="Review">En revision</option>
                      <option value="Done">Listo</option>
                    </select>
                  </label>
                  <button className="btn btn-ghost" type="submit">
                    Guardar
                  </button>
                </form>

                <DeleteConfirmForm
                  action={deleteTaskAction}
                  hiddenInputs={[
                    { name: "taskId", value: task.id },
                    { name: "returnTo", value: "/tasks" },
                  ]}
                  triggerLabel="Eliminar tarea"
                  title="Confirmar eliminacion"
                  description="Esta accion eliminara esta tarea de forma permanente."
                  impact="La tarea dejara de contar para el progreso del proyecto."
                />
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </PlannerPage>
  );
}
