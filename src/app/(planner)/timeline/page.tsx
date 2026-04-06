import { PlannerPage } from "@/components/planner-page";
import { Badge, EmptyState, ProgressBar, SectionCard } from "@/components/ui";
import { getPlannerSnapshot } from "@/lib/data-store";
import {
  dateFormat,
  goalStatusLabel,
  meetingKindLabel,
  meetingStatusLabel,
  toneForMeetingStatus,
  toneForGoalStatus,
  toneForProjectStatus,
  projectStatusLabel,
} from "@/lib/planner-view";

export default async function TimelinePage() {
  const snapshot = await getPlannerSnapshot();

  const timeline = [
    ...snapshot.projects.map((project) => ({
      id: `project-${project.id}`,
      title: project.name,
      date: project.dueDate,
      detail: `Proyecto · ${projectStatusLabel[project.status]}`,
      tone: toneForProjectStatus(project.status),
      progress: project.progress,
    })),
    ...snapshot.goals.map((goal) => ({
      id: `goal-${goal.id}`,
      title: goal.title,
      date: goal.targetDate,
      detail: `Meta · ${goalStatusLabel[goal.status]}`,
      tone: toneForGoalStatus(goal.status),
      progress: goal.progress,
    })),
    ...snapshot.meetings.map((meeting) => ({
      id: `meeting-${meeting.id}`,
      title: meeting.title,
      date: meeting.date,
      detail: `${meetingKindLabel[meeting.kind]} · ${meetingStatusLabel[meeting.status]}`,
      tone: toneForMeetingStatus(meeting.status),
      progress: meeting.status === "Completed" ? 100 : meeting.status === "Cancelled" ? 0 : 60,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <PlannerPage
      title="Timeline"
      description="Vista de fechas clave y tendencia de progreso para planificar capacidad del equipo."
    >
      <section className="two-col-grid">
        <SectionCard title="Linea de tiempo" subtitle="Prioriza entregables segun fecha compromiso.">
          {timeline.length === 0 ? (
            <EmptyState title="Sin fechas" detail="Agrega due dates en proyectos y metas." />
          ) : (
            <div className="timeline-list">
              {timeline.map((item) => (
                <article key={item.id} className="timeline-item">
                  <span className="timeline-dot" />
                  <div className="timeline-content">
                    <div className="list-row-head">
                      <p className="list-title">{item.title}</p>
                      <Badge tone={item.tone}>{item.detail}</Badge>
                    </div>
                    <p className="list-subtitle">Fecha: {dateFormat(item.date)}</p>
                    <ProgressBar value={item.progress} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Grafica de avance" subtitle="Comparativo visual por proyecto activo.">
          {snapshot.projects.length === 0 ? (
            <EmptyState title="Sin proyectos" detail="Crea proyectos para ver grafica." />
          ) : (
            <div className="chart-stack">
              {snapshot.projects.map((project) => (
                <div key={project.id} className="chart-item">
                  <div className="list-row-head">
                    <p className="list-title">{project.name}</p>
                    <p className="list-subtitle">{project.progress}%</p>
                  </div>
                  <ProgressBar value={project.progress} />
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </section>
    </PlannerPage>
  );
}
