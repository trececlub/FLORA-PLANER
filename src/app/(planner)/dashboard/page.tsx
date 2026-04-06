import Link from "next/link";
import { getPlannerSnapshot } from "@/lib/data-store";
import {
  dateFormat,
  meetingKindLabel,
  meetingStatusLabel,
  projectStatusLabel,
  taskStatusLabel,
  toneForMeetingStatus,
  toneForProjectStatus,
  toneForTaskStatus,
} from "@/lib/planner-view";
import { Badge, EmptyState, MetricCard, ProgressBar, SectionCard } from "@/components/ui";
import { PlannerPage } from "@/components/planner-page";

type CalendarCell = {
  key: string;
  dateKey: string;
  day: number;
  inMonth: boolean;
};

type CalendarEvent = {
  id: string;
  title: string;
  type: "Tarea" | "Reunion";
  tone: "muted" | "accent" | "ok" | "warning" | "critical";
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function strParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function createCalendarCells(baseDate: Date): { cells: CalendarCell[]; monthLabel: string } {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const firstWeekDay = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells: CalendarCell[] = [];

  for (let i = 0; i < firstWeekDay; i += 1) {
    const day = prevMonthDays - firstWeekDay + i + 1;
    const cellDate = new Date(year, month - 1, day);
    cells.push({
      key: `prev-${day}`,
      dateKey: dateKey(cellDate),
      day,
      inMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const cellDate = new Date(year, month, day);
    cells.push({
      key: `current-${day}`,
      dateKey: dateKey(cellDate),
      day,
      inMonth: true,
    });
  }

  let nextDay = 1;
  while (cells.length < 42) {
    const cellDate = new Date(year, month + 1, nextDay);
    cells.push({
      key: `next-${nextDay}`,
      dateKey: dateKey(cellDate),
      day: nextDay,
      inMonth: false,
    });
    nextDay += 1;
  }

  const monthLabel = baseDate.toLocaleDateString("es-CO", {
    month: "long",
    year: "numeric",
  });

  return { cells, monthLabel };
}

function parseIntSafe(value: string | undefined) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}

function yearFromDateString(value: string) {
  const parsed = new Date(value);
  const year = parsed.getFullYear();
  if (!Number.isFinite(year)) return undefined;
  return year;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const snapshot = await getPlannerSnapshot();
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const requestedMonth = parseIntSafe(strParam(params.month));
  const requestedYear = parseIntSafe(strParam(params.year));

  const selectedMonth =
    requestedMonth && requestedMonth >= 1 && requestedMonth <= 12
      ? requestedMonth
      : currentMonth;

  const dataYears = [
    ...snapshot.tasks.map((task) => yearFromDateString(task.dueDate || "")),
    ...snapshot.meetings.map((meeting) => yearFromDateString(meeting.date || "")),
    ...snapshot.projects.map((project) => yearFromDateString(project.startDate || "")),
    ...snapshot.projects.map((project) => yearFromDateString(project.dueDate || "")),
    ...snapshot.goals.map((goal) => yearFromDateString(goal.targetDate || "")),
  ]
    .filter((year): year is number => Boolean(year))
    .filter((year) => year >= 2000 && year <= 2100);

  const minDataYear = dataYears.length ? Math.min(...dataYears) : currentYear;
  const maxDataYear = dataYears.length ? Math.max(...dataYears) : currentYear;
  const yearStart = Math.min(currentYear - 3, minDataYear);
  const yearEnd = Math.max(currentYear + 3, maxDataYear);

  const selectableYears: number[] = [];
  for (let year = yearStart; year <= yearEnd; year += 1) {
    selectableYears.push(year);
  }

  const selectedYear =
    requestedYear && requestedYear >= yearStart && requestedYear <= yearEnd
      ? requestedYear
      : currentYear;

  const baseDate = new Date(selectedYear, selectedMonth - 1, 1);

  const monthOptions = [
    { value: 1, label: "Enero" },
    { value: 2, label: "Febrero" },
    { value: 3, label: "Marzo" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Mayo" },
    { value: 6, label: "Junio" },
    { value: 7, label: "Julio" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Septiembre" },
    { value: 10, label: "Octubre" },
    { value: 11, label: "Noviembre" },
    { value: 12, label: "Diciembre" },
  ] as const;

  const tasksByDueDate = [...snapshot.tasks]
    .filter((task) => task.status !== "Done")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const upcomingMeetings = [...snapshot.meetings]
    .filter((meeting) => meeting.status === "Scheduled")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const { cells, monthLabel } = createCalendarCells(baseDate);

  const eventMap = new Map<string, CalendarEvent[]>();

  snapshot.tasks.forEach((task) => {
    if (!task.dueDate) return;
    const events = eventMap.get(task.dueDate) || [];
    events.push({
      id: task.id,
      title: task.title,
      type: "Tarea",
      tone: toneForTaskStatus(task.status),
    });
    eventMap.set(task.dueDate, events);
  });

  snapshot.meetings.forEach((meeting) => {
    if (!meeting.date) return;
    const events = eventMap.get(meeting.date) || [];
    events.push({
      id: meeting.id,
      title: meeting.title,
      type: "Reunion",
      tone: toneForMeetingStatus(meeting.status),
    });
    eventMap.set(meeting.date, events);
  });

  return (
    <PlannerPage
      title="Inicio"
      description="Vista rapida del estado de FLORA: proyectos activos, tareas urgentes, calendario y avance visual de branding."
    >
      <section className="metric-grid">
        <MetricCard label="Proyectos abiertos" value={snapshot.metrics.openProjects} />
        <MetricCard label="Tareas activas" value={snapshot.metrics.activeTasks} />
        <MetricCard label="Tareas vencidas" value={snapshot.metrics.overdueTasks} />
        <MetricCard label="Reuniones programadas" value={snapshot.metrics.scheduledMeetings} />
        <MetricCard label="Piezas en revision" value={snapshot.metrics.galleryInReview} />
        <MetricCard label="Progreso promedio" value={`${snapshot.metrics.avgProjectProgress}%`} />
      </section>

      <section className="two-col-grid">
        <SectionCard
          title="Progreso por proyecto"
          subtitle="Control rapido del avance para no perder foco en entregables."
          action={
            <Link href="/projects" className="btn btn-ghost">
              Ver todos
            </Link>
          }
        >
          <div className="dashboard-scroll-area">
            {snapshot.projects.length === 0 ? (
              <EmptyState title="No hay proyectos" detail="Crea el primer proyecto en la seccion Proyectos." />
            ) : (
              <ul className="stack-list">
                {snapshot.projects.map((project) => (
                  <li key={project.id} className="list-row">
                    <div className="list-row-head">
                      <div>
                        <p className="list-title">{project.name}</p>
                        <p className="list-subtitle">Entrega: {dateFormat(project.dueDate)}</p>
                      </div>
                      <Badge tone={toneForProjectStatus(project.status)}>{projectStatusLabel[project.status]}</Badge>
                    </div>
                    <ProgressBar value={project.progress} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Tareas por vencer"
          subtitle="Prioriza lo critico antes de que se convierta en cuello de botella."
          action={
            <Link href="/tasks" className="btn btn-ghost">
              Gestionar
            </Link>
          }
        >
          <div className="dashboard-scroll-area">
            {tasksByDueDate.length === 0 ? (
              <EmptyState title="Todo al dia" detail="No hay tareas urgentes pendientes." />
            ) : (
              <ul className="stack-list">
                {tasksByDueDate.map((task) => (
                  <li key={task.id} className="list-row compact">
                    <div className="list-row-head">
                      <p className="list-title">{task.title}</p>
                      <Badge tone={toneForTaskStatus(task.status)}>{taskStatusLabel[task.status]}</Badge>
                    </div>
                    <p className="list-subtitle">Fecha limite: {dateFormat(task.dueDate)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SectionCard>
      </section>

      <section className="two-col-grid">
        <SectionCard
          title={`Calendario ${monthLabel}`}
          subtitle="Fechas de tareas y reuniones en un solo lugar."
          action={
            <Link href="/timeline" className="btn btn-ghost">
              Ver timeline
            </Link>
          }
        >
          <form method="get" className="calendar-controls" action="/dashboard">
            <label>
              Mes
              <select name="month" defaultValue={String(selectedMonth)}>
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Año
              <select name="year" defaultValue={String(selectedYear)}>
                {selectableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn btn-ghost" type="submit">
              Ver
            </button>
          </form>

          <div className="calendar-month-shell">
            <div className="calendar-grid-head">
              {"Lun,Mar,Mie,Jue,Vie,Sab,Dom".split(",").map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            <div className="calendar-grid">
              {cells.map((cell) => {
                const events = eventMap.get(cell.dateKey) || [];

                return (
                  <article key={cell.key} className={`calendar-cell ${cell.inMonth ? "" : "is-out"}`}>
                    <p className="calendar-day">{cell.day}</p>
                    <div className="calendar-events">
                      {events.slice(0, 2).map((event) => (
                        <span key={`${cell.key}-${event.id}`} className={`calendar-pill tone-${event.tone}`}>
                          {event.type}
                        </span>
                      ))}
                      {events.length > 2 ? <span className="calendar-more">+{events.length - 2}</span> : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Proximas reuniones"
          subtitle="Gestion de reuniones con clientes y equipo interno."
          action={
            <Link href="/meetings" className="btn btn-ghost">
              Gestionar
            </Link>
          }
        >
          <div className="dashboard-scroll-area">
            {upcomingMeetings.length === 0 ? (
              <EmptyState title="Sin reuniones" detail="Programa la primera reunion en la seccion Reuniones." />
            ) : (
              <div className="stack-list">
                {upcomingMeetings.map((meeting) => (
                  <article key={meeting.id} className="list-row compact">
                    <div className="list-row-head">
                      <p className="list-title">{meeting.title}</p>
                      <Badge tone={toneForMeetingStatus(meeting.status)}>{meetingStatusLabel[meeting.status]}</Badge>
                    </div>
                    <p className="list-subtitle">
                      {meetingKindLabel[meeting.kind]} · {dateFormat(meeting.date)} · {meeting.startTime || "--:--"} - {meeting.endTime || "--:--"}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      </section>

      <SectionCard title="Proximos hitos" subtitle="Fechas clave de proyectos, metas y reuniones para planificar la semana.">
        {snapshot.milestones.length === 0 ? (
          <EmptyState title="Sin hitos" detail="Agrega fechas objetivo en proyectos, metas o reuniones." />
        ) : (
          <div className="timeline-list">
            {snapshot.milestones.map((item) => (
              <article key={item.id} className="timeline-item">
                <span className="timeline-dot" />
                <div>
                  <p className="list-title">{item.title}</p>
                  <p className="list-subtitle">
                    {item.type} · {dateFormat(item.date)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </PlannerPage>
  );
}
