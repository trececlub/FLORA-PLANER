import type {
  GoalStatus,
  MeetingKind,
  MeetingStatus,
  PlannerRole,
  ProcessStepStatus,
  ProjectPriority,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
} from "@/lib/data-store";

export type Tone = "muted" | "accent" | "ok" | "warning" | "critical";

export const projectStatusLabel: Record<ProjectStatus, string> = {
  Planned: "Planeado",
  InProgress: "En progreso",
  Blocked: "Bloqueado",
  Done: "Completado",
};

export const projectPriorityLabel: Record<ProjectPriority, string> = {
  High: "Alta",
  Medium: "Media",
  Low: "Baja",
};

export const taskStatusLabel: Record<TaskStatus, string> = {
  Backlog: "Backlog",
  Doing: "En curso",
  Review: "En revisión",
  Done: "Listo",
};

export const taskPriorityLabel: Record<TaskPriority, string> = {
  High: "Alta",
  Medium: "Media",
  Low: "Baja",
};

export const goalStatusLabel: Record<GoalStatus, string> = {
  OnTrack: "En ruta",
  AtRisk: "En riesgo",
  Done: "Completada",
};

export const processStepStatusLabel: Record<ProcessStepStatus, string> = {
  Pending: "Pendiente",
  InProgress: "En progreso",
  Done: "Hecho",
};

export const meetingKindLabel: Record<MeetingKind, string> = {
  Client: "Cliente",
  Internal: "Interna",
};

export const meetingStatusLabel: Record<MeetingStatus, string> = {
  Scheduled: "Programada",
  Completed: "Completada",
  Cancelled: "Cancelada",
};

export const roleLabel: Record<PlannerRole, string> = {
  CEO: "Admin",
  CTO: "Miembro",
  Member: "Miembro",
};

export function toneForPriority(priority: ProjectPriority | TaskPriority): Tone {
  if (priority === "High") return "critical";
  if (priority === "Medium") return "warning";
  return "muted";
}

export function toneForProjectStatus(status: ProjectStatus): Tone {
  if (status === "Done") return "ok";
  if (status === "Blocked") return "critical";
  if (status === "InProgress") return "accent";
  return "muted";
}

export function toneForTaskStatus(status: TaskStatus): Tone {
  if (status === "Done") return "ok";
  if (status === "Review") return "warning";
  if (status === "Doing") return "accent";
  return "muted";
}

export function toneForGoalStatus(status: GoalStatus): Tone {
  if (status === "Done") return "ok";
  if (status === "OnTrack") return "accent";
  return "critical";
}

export function toneForProcessStatus(status: ProcessStepStatus): Tone {
  if (status === "Done") return "ok";
  if (status === "InProgress") return "accent";
  return "muted";
}

export function toneForMeetingStatus(status: MeetingStatus): Tone {
  if (status === "Completed") return "ok";
  if (status === "Cancelled") return "critical";
  return "accent";
}

export function toneForRole(role: PlannerRole): Tone {
  if (role === "CEO") return "accent";
  return "muted";
}

export function dateFormat(value?: string) {
  if (!value) return "Sin fecha";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function progressClass(value: number) {
  if (value >= 85) return "is-strong";
  if (value >= 60) return "is-good";
  if (value >= 35) return "is-mid";
  return "is-low";
}

export function truncate(text: string, max = 120) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}...`;
}
