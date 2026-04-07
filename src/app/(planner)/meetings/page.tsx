import {
  createMeetingAction,
  deleteMeetingAction,
  updateMeetingStatusAction,
} from "@/app/(planner)/actions";
import { PlannerPage, SaveMessage } from "@/components/planner-page";
import { Badge, EmptyState, SectionCard } from "@/components/ui";
import { requireSessionUser } from "@/lib/auth";
import { getPlannerSnapshot } from "@/lib/data-store";
import {
  dateFormat,
  meetingKindLabel,
  meetingStatusLabel,
  toneForMeetingStatus,
  truncate,
} from "@/lib/planner-view";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function strParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function MeetingsPage({ searchParams }: PageProps) {
  const currentUser = await requireSessionUser();
  const params = await searchParams;
  const saved = strParam(params.saved);
  const error = strParam(params.error);
  const snapshot = await getPlannerSnapshot();
  const activeUsers = snapshot.users.filter((user) => user.status === "Active");

  return (
    <PlannerPage
      title="Reuniones"
      description="Agenda y seguimiento de reuniones con clientes o con el equipo interno."
    >
      <SaveMessage saved={saved} error={error} />

      <SectionCard title="Nueva reunion" subtitle="Crea reuniones de clientes o de trabajo interno.">
        <details className="fold-card" open={snapshot.meetings.length === 0}>
          <summary>Abrir formulario</summary>
          <form action={createMeetingAction} className="form-grid">
            <input type="hidden" name="returnTo" value="/meetings" />

            <label>
              Titulo
              <input name="title" required placeholder="Ej: Revision de branding con cliente" />
            </label>
            <label>
              Tipo
              <select name="kind" defaultValue="Client">
                <option value="Client">Cliente</option>
                <option value="Internal">Interna</option>
              </select>
            </label>
            <label>
              Fecha
              <input name="date" type="date" required />
            </label>
            <label>
              Hora inicio
              <input name="startTime" type="time" />
            </label>
            <label>
              Hora fin
              <input name="endTime" type="time" />
            </label>
            <fieldset className="meeting-attendees-picker">
              <legend>Asistentes del equipo</legend>
              <div className="meeting-attendees-grid">
                {activeUsers.map((user) => (
                  <label key={user.id} className="checkbox-line meeting-attendee-option">
                    <input
                      type="checkbox"
                      name="attendeeUserIds"
                      value={user.id}
                      defaultChecked={user.id === currentUser.id}
                    />
                    <span>{user.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label>
              Asistentes externos (opcional)
              <input name="attendeesExtra" placeholder="Cliente X, proveedor, invitado" />
            </label>
            <label>
              Notas
              <textarea name="notes" rows={3} placeholder="Objetivo, agenda, acuerdos esperados" />
            </label>
            <button className="btn btn-primary" type="submit">
              Guardar reunion
            </button>
          </form>
        </details>
      </SectionCard>

      <SectionCard title="Agenda" subtitle="Actualiza estado o elimina reuniones que ya no apliquen.">
        {snapshot.meetings.length === 0 ? (
          <EmptyState title="Sin reuniones" detail="Programa la primera reunion." />
        ) : (
          <div className="stack-list">
            {snapshot.meetings
              .slice()
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((meeting) => (
                <article key={meeting.id} className="list-row compact">
                  <div className="list-row-head">
                    <div>
                      <p className="list-title">{meeting.title}</p>
                      <p className="list-subtitle">
                        {meetingKindLabel[meeting.kind]} · {dateFormat(meeting.date)} · {meeting.startTime || "--:--"} - {meeting.endTime || "--:--"}
                      </p>
                    </div>
                    <Badge tone={toneForMeetingStatus(meeting.status)}>{meetingStatusLabel[meeting.status]}</Badge>
                  </div>

                  <p className="list-subtitle">Asistentes: {meeting.attendees.length ? meeting.attendees.join(", ") : "Sin asistentes"}</p>
                  <p className="list-subtitle">{truncate(meeting.notes || "Sin notas", 160)}</p>

                  <div className="actions-row">
                    <form action={updateMeetingStatusAction} className="inline-form">
                      <input type="hidden" name="returnTo" value="/meetings" />
                      <input type="hidden" name="meetingId" value={meeting.id} />
                      <label>
                        Estado
                        <select name="status" defaultValue={meeting.status}>
                          <option value="Scheduled">Programada</option>
                          <option value="Completed">Completada</option>
                          <option value="Cancelled">Cancelada</option>
                        </select>
                      </label>
                      <button className="btn btn-ghost" type="submit">
                        Guardar estado
                      </button>
                    </form>

                    <form action={deleteMeetingAction}>
                      <input type="hidden" name="returnTo" value="/meetings" />
                      <input type="hidden" name="meetingId" value={meeting.id} />
                      <button className="btn btn-danger" type="submit">
                        Eliminar reunion
                      </button>
                    </form>
                  </div>
                </article>
              ))}
          </div>
        )}
      </SectionCard>
    </PlannerPage>
  );
}
