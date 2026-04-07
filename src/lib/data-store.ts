import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { Client } from "pg";

function sanitizeDatabaseEnvVars() {
  for (const key of [
    "POSTGRES_URL",
    "POSTGRES_PRISMA_URL",
    "DATABASE_URL",
    "PRISMA_DATABASE_URL",
  ] as const) {
    const raw = process.env[key];
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim().replace(/^"(.*)"$/, "$1");
    if (trimmed && trimmed !== raw) {
      process.env[key] = trimmed;
    }
  }
}

sanitizeDatabaseEnvVars();

export type PlannerRole = "CEO" | "CTO" | "Member";
export type UserStatus = "Active" | "Disabled";
export type ProjectRole =
  | "ClientOwner"
  | "ClientCollaborator"
  | "ProjectManager"
  | "HeadBrandingDesign"
  | "CreativeDirector"
  | "Stylist"
  | "ContentCreator"
  | "CommunityManager"
  | "AdsSpecialist"
  | "PublicRelations"
  | "ArchitectInterior"
  | "PackagingProducer"
  | "ProductionVendors"
  | "Observer";

export type UserPermissions = {
  canManageUsers: boolean;
  canManageProjects: boolean;
  canManageTasks: boolean;
  canManageProcess: boolean;
  canManageMeetings: boolean;
  canUploadGallery: boolean;
  canCommentGallery: boolean;
  canUpdateGalleryWorkflow: boolean;
  canApproveGallery: boolean;
  canUseChat: boolean;
  canViewDashboard: boolean;
};

export type PlannerUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  mustChangePassword: boolean;
  role: PlannerRole;
  projectRole: ProjectRole;
  status: UserStatus;
  jobTitle: string;
  phone: string;
  bio: string;
  avatarDataUrl: string;
  createdAt: string;
};

export type ProjectStatus = "Planned" | "InProgress" | "Blocked" | "Done";
export type ProjectPriority = "High" | "Medium" | "Low";
export type ProjectStage = {
  id: string;
  name: string;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  createdByUserId: string;
  createdByRole: PlannerRole;
  ownerId: string;
  startDate: string;
  dueDate: string;
  progress: number;
  stages: ProjectStage[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type TaskStatus = "Backlog" | "Doing" | "Review" | "Done";
export type TaskPriority = "High" | "Medium" | "Low";

export type Task = {
  id: string;
  projectId: string;
  stageId: string;
  title: string;
  details: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
};

export type GoalStatus = "OnTrack" | "AtRisk" | "Done";

export type Goal = {
  id: string;
  title: string;
  ownerId: string;
  targetDate: string;
  progress: number;
  status: GoalStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type ProcessStepStatus = "Pending" | "InProgress" | "Done";

export type ProcessStep = {
  id: string;
  phase: string;
  title: string;
  description: string;
  ownerId: string;
  status: ProcessStepStatus;
  targetDate: string;
  createdAt: string;
  updatedAt: string;
};

export type Decision = {
  id: string;
  title: string;
  context: string;
  decision: string;
  ownerId: string;
  date: string;
  createdAt: string;
};

export type DocItem = {
  id: string;
  title: string;
  category: string;
  url: string;
  notes: string;
  updatedAt: string;
};

export type WeeklyReview = {
  id: string;
  weekLabel: string;
  wins: string;
  blockers: string;
  nextFocus: string;
  ownerId: string;
  createdAt: string;
};

export type MeetingStatus = "Scheduled" | "Completed" | "Cancelled";
export type MeetingKind = "Client" | "Internal";

export type Meeting = {
  id: string;
  title: string;
  kind: MeetingKind;
  status: MeetingStatus;
  date: string;
  startTime: string;
  endTime: string;
  attendees: string[];
  notes: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

export type ChatThreadKind = "Group" | "Direct";

export type ChatThread = {
  id: string;
  kind: ChatThreadKind;
  title: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  threadId: string;
  senderId: string;
  text: string;
  createdAt: string;
};

export type ChatReadState = {
  userId: string;
  threadId: string;
  lastReadAt: string;
};

export type UserPresence = {
  userId: string;
  lastSeenAt: string;
};

export type GalleryCategory =
  | "Logo"
  | "Paleta"
  | "Packaging"
  | "Interior"
  | "Redes"
  | "IdeaCliente"
  | "Otro";
export type GalleryStage =
  | "Investigacion"
  | "Bocetos"
  | "Propuesta"
  | "Ajustes"
  | "Final";
export type GalleryStatus = "Pending" | "InReview" | "Approved" | "Discarded";

export type GalleryEntry = {
  id: string;
  title: string;
  pieceKey: string;
  version: string;
  category: GalleryCategory;
  stage: GalleryStage;
  status: GalleryStatus;
  description: string;
  imageUrl: string;
  responsibleUserId: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type GalleryComment = {
  id: string;
  entryId: string;
  userId: string;
  text: string;
  createdAt: string;
};

export type NotificationKind = "TaskAssigned" | "MeetingAssigned" | "General";

export type UserNotification = {
  id: string;
  userId: string;
  kind: NotificationKind;
  title: string;
  description: string;
  linkPath: string;
  createdAt: string;
  readAt?: string;
};

export type PlannerData = {
  users: PlannerUser[];
  projects: Project[];
  tasks: Task[];
  goals: Goal[];
  processSteps: ProcessStep[];
  decisions: Decision[];
  docs: DocItem[];
  weeklyReviews: WeeklyReview[];
  meetings: Meeting[];
  chatThreads: ChatThread[];
  chatMessages: ChatMessage[];
  chatReadStates: ChatReadState[];
  userPresence: UserPresence[];
  galleryEntries: GalleryEntry[];
  galleryComments: GalleryComment[];
  notifications: UserNotification[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "planner-data.json");
const DB_STATE_KEY = "primary";
const PASSWORD_BCRYPT_PREFIX = /^\$2[aby]\$\d{2}\$/;
let memoryData: PlannerData | null = null;
let postgresReady: Promise<boolean> | null = null;

function nowIso() {
  return new Date().toISOString();
}

function hasPostgresConfig() {
  return Boolean(
    process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.DATABASE_URL,
  );
}

function getPostgresConnectionString() {
  const candidates = [
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.DATABASE_URL,
    process.env.PRISMA_DATABASE_URL,
  ];

  for (const raw of candidates) {
    const value = String(raw || "").trim();
    if (value) return value;
  }

  return "";
}

async function withPostgresClient<T>(
  callback: (client: Client) => Promise<T>,
) {
  const connectionString = getPostgresConnectionString();
  if (!connectionString) {
    throw new Error("postgres_connection_string_missing");
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    return await callback(client);
  } finally {
    await client.end();
  }
}

async function ensurePostgresReady() {
  if (!hasPostgresConfig()) return false;
  if (!postgresReady) {
    postgresReady = (async () => {
      try {
        await withPostgresClient(async (client) => {
          await client.query(`
            CREATE TABLE IF NOT EXISTS flora_planer_state (
              id TEXT PRIMARY KEY,
              payload JSONB NOT NULL,
              updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
          `);
        });
        return true;
      } catch (error) {
        console.error("[flora-planer] postgres bootstrap failed", error);
        return false;
      }
    })();
  }

  const ready = await postgresReady;
  if (!ready) {
    // Allow retries on the next call instead of caching a permanent failure.
    postgresReady = null;
  }
  return ready;
}

function isPasswordHashed(value: string) {
  return PASSWORD_BCRYPT_PREFIX.test(String(value || ""));
}

async function hashPassword(rawPassword: string) {
  const clean = String(rawPassword || "").trim();
  if (!clean) return "";
  if (isPasswordHashed(clean)) return clean;
  return hash(clean, 10);
}

async function verifyPassword(candidatePassword: string, storedPassword: string) {
  const cleanCandidate = String(candidatePassword || "").trim();
  const cleanStored = String(storedPassword || "");

  if (!cleanCandidate || !cleanStored) return false;
  if (isPasswordHashed(cleanStored)) {
    try {
      return await compare(cleanCandidate, cleanStored);
    } catch {
      return false;
    }
  }

  return cleanCandidate === cleanStored;
}

function normalizePercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function safeDate(value: string, fallback = "") {
  const date = String(value || "").trim();
  if (!date) return fallback;
  return date;
}

function safeHttpUrl(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

function safeAvatarUrl(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (raw.startsWith("data:image/") && raw.includes(";base64,")) {
    return raw;
  }

  return safeHttpUrl(raw);
}

function splitCsv(value: string) {
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const DEFAULT_STAGE_NAMES = [
  "Planificacion",
  "Implementacion",
  "Revision",
  "Entrega",
] as const;

const GROUP_CHAT_ID = "thread_group_flora";
const LEGACY_SEED_PROJECT_IDS = new Set([
  "project_loop_voice_migration",
  "project_loop_planner_mvp",
]);
const LEGACY_SEED_TASK_IDS = new Set(["task_voice_compare", "task_planner_ui"]);
const LEGACY_SEED_GOAL_IDS = new Set(["goal_launch_planner"]);
const LEGACY_SEED_PROCESS_IDS = new Set(["step_1", "step_2"]);
const LEGACY_SEED_DECISION_IDS = new Set(["decision_1"]);
const LEGACY_SEED_DOC_IDS = new Set(["doc_1"]);
const LEGACY_SEED_MEETING_IDS = new Set(["meeting_1"]);
const LEGACY_SEED_CHAT_MESSAGE_IDS = new Set(["message_1"]);

export const projectRoles: ProjectRole[] = [
  "ClientOwner",
  "ClientCollaborator",
  "ProjectManager",
  "HeadBrandingDesign",
  "CreativeDirector",
  "Stylist",
  "ContentCreator",
  "CommunityManager",
  "AdsSpecialist",
  "PublicRelations",
  "ArchitectInterior",
  "PackagingProducer",
  "ProductionVendors",
  "Observer",
];

export const projectRoleLabel: Record<ProjectRole, string> = {
  ClientOwner: "Cliente / Dueño",
  ClientCollaborator: "Cliente Colaborador",
  ProjectManager: "Project Manager",
  HeadBrandingDesign: "Head de Branding y Diseño",
  CreativeDirector: "Director/a Creativo/a",
  Stylist: "Stylist",
  ContentCreator: "Creador/a de Contenido",
  CommunityManager: "Community Manager",
  AdsSpecialist: "Ads Specialist",
  PublicRelations: "Relaciones Públicas (PR)",
  ArchitectInterior: "Arquitecto/a / Interiorismo",
  PackagingProducer: "Productor/a de Packaging",
  ProductionVendors: "Producción / Proveedores",
  Observer: "Observador",
};

const NO_PERMISSIONS: UserPermissions = {
  canManageUsers: false,
  canManageProjects: false,
  canManageTasks: false,
  canManageProcess: false,
  canManageMeetings: false,
  canUploadGallery: false,
  canCommentGallery: false,
  canUpdateGalleryWorkflow: false,
  canApproveGallery: false,
  canUseChat: false,
  canViewDashboard: true,
};

const FULL_PERMISSIONS: UserPermissions = {
  canManageUsers: true,
  canManageProjects: true,
  canManageTasks: true,
  canManageProcess: true,
  canManageMeetings: true,
  canUploadGallery: true,
  canCommentGallery: true,
  canUpdateGalleryWorkflow: true,
  canApproveGallery: true,
  canUseChat: true,
  canViewDashboard: true,
};

const PROJECT_ROLE_PERMISSIONS: Record<ProjectRole, UserPermissions> = {
  ClientOwner: {
    ...NO_PERMISSIONS,
    canUploadGallery: true,
    canCommentGallery: true,
    canApproveGallery: true,
    canUseChat: true,
  },
  ClientCollaborator: {
    ...NO_PERMISSIONS,
    canUploadGallery: true,
    canCommentGallery: true,
    canUseChat: true,
  },
  ProjectManager: {
    ...NO_PERMISSIONS,
    canManageProjects: true,
    canManageTasks: true,
    canManageProcess: true,
    canManageMeetings: true,
    canUploadGallery: true,
    canCommentGallery: true,
    canUpdateGalleryWorkflow: true,
    canApproveGallery: true,
    canUseChat: true,
  },
  HeadBrandingDesign: {
    ...NO_PERMISSIONS,
    canManageProjects: true,
    canManageTasks: true,
    canManageProcess: true,
    canManageMeetings: true,
    canUploadGallery: true,
    canCommentGallery: true,
    canUpdateGalleryWorkflow: true,
    canApproveGallery: true,
    canUseChat: true,
  },
  CreativeDirector: {
    ...NO_PERMISSIONS,
    canManageProjects: true,
    canManageTasks: true,
    canUploadGallery: true,
    canCommentGallery: true,
    canUpdateGalleryWorkflow: true,
    canApproveGallery: true,
    canUseChat: true,
  },
  Stylist: {
    ...NO_PERMISSIONS,
    canManageTasks: true,
    canUploadGallery: true,
    canCommentGallery: true,
    canUseChat: true,
  },
  ContentCreator: {
    ...NO_PERMISSIONS,
    canManageTasks: true,
    canUploadGallery: true,
    canCommentGallery: true,
    canUseChat: true,
  },
  CommunityManager: {
    ...NO_PERMISSIONS,
    canManageTasks: true,
    canUploadGallery: true,
    canCommentGallery: true,
    canUseChat: true,
  },
  AdsSpecialist: {
    ...NO_PERMISSIONS,
    canManageTasks: true,
    canUploadGallery: true,
    canCommentGallery: true,
    canUseChat: true,
  },
  PublicRelations: {
    ...NO_PERMISSIONS,
    canManageTasks: true,
    canUploadGallery: true,
    canCommentGallery: true,
    canUseChat: true,
  },
  ArchitectInterior: {
    ...NO_PERMISSIONS,
    canManageTasks: true,
    canUploadGallery: true,
    canCommentGallery: true,
    canUseChat: true,
  },
  PackagingProducer: {
    ...NO_PERMISSIONS,
    canManageTasks: true,
    canUploadGallery: true,
    canCommentGallery: true,
    canUseChat: true,
  },
  ProductionVendors: {
    ...NO_PERMISSIONS,
    canManageTasks: true,
    canUploadGallery: true,
    canCommentGallery: true,
    canUseChat: true,
  },
  Observer: {
    ...NO_PERMISSIONS,
  },
};

function normalizeProjectStatus(value: unknown): ProjectStatus {
  if (value === "InProgress") return "InProgress";
  if (value === "Blocked") return "Blocked";
  if (value === "Done") return "Done";
  return "Planned";
}

function normalizeProjectRole(value: unknown, fallbackRole: PlannerRole): ProjectRole {
  const role = String(value || "").trim() as ProjectRole;
  if (projectRoles.includes(role)) return role;
  if (fallbackRole === "CEO") return "ProjectManager";
  return "Observer";
}

function normalizeProjectPriority(value: unknown): ProjectPriority {
  if (value === "High") return "High";
  if (value === "Low") return "Low";
  return "Medium";
}

function normalizeTaskStatus(value: unknown): TaskStatus {
  if (value === "Doing") return "Doing";
  if (value === "Review") return "Review";
  if (value === "Done") return "Done";
  return "Backlog";
}

function normalizeTaskPriority(value: unknown): TaskPriority {
  if (value === "High") return "High";
  if (value === "Low") return "Low";
  return "Medium";
}

function normalizeStageSlots(projectId: string, rawStages: unknown): ProjectStage[] {
  const incoming = Array.isArray(rawStages) ? rawStages : [];
  const parsed = incoming
    .map((item) => {
      if (typeof item === "string") {
        return { id: "", name: item.trim() };
      }
      if (item && typeof item === "object") {
        const stage = item as Partial<ProjectStage> & { label?: string };
        return {
          id: String(stage.id || "").trim(),
          name: String(stage.name || stage.label || "").trim(),
        };
      }
      return { id: "", name: "" };
    })
    .filter((item) => item.name);

  const stages: ProjectStage[] = [];
  for (let index = 0; index < 4; index += 1) {
    const source = parsed[index];
    const fallbackName = DEFAULT_STAGE_NAMES[index];
    const name = source?.name || fallbackName;
    const stageId = source?.id || `${projectId}_stage_${index + 1}`;
    stages.push({ id: stageId, name });
  }

  return stages;
}

function computeProjectProgress(data: PlannerData, projectId: string) {
  const tasks = data.tasks.filter((task) => task.projectId === projectId);
  if (!tasks.length) return 0;
  const doneCount = tasks.filter((task) => task.status === "Done").length;
  return normalizePercent((doneCount / tasks.length) * 100);
}

function syncProjectProgressFromTasks(data: PlannerData, projectId?: string) {
  const targetIds = projectId
    ? [projectId]
    : data.projects.map((project) => project.id);

  const timestamp = nowIso();
  for (const id of targetIds) {
    const index = data.projects.findIndex((project) => project.id === id);
    if (index === -1) continue;
    const progress = computeProjectProgress(data, id);
    data.projects[index] = {
      ...data.projects[index],
      progress,
      updatedAt: timestamp,
    };
  }
}

export function canManageUsers(role: PlannerRole | string | undefined) {
  return role === "CEO" || role === "Owner";
}

export function isProtectedRole(role: PlannerRole | string | undefined) {
  return role === "CEO" || role === "Owner";
}

export function getPermissionsForUser(user: PlannerUser | null | undefined): UserPermissions {
  if (!user) return { ...NO_PERMISSIONS };
  if (canManageUsers(user.role)) return { ...FULL_PERMISSIONS };
  return {
    ...PROJECT_ROLE_PERMISSIONS[user.projectRole || "Observer"],
  };
}

function getDefaultCeo(): PlannerUser {
  const email = (
    process.env.FLORA_PLANER_ADMIN_EMAIL ||
    process.env.FLORA_PLANNER_ADMIN_EMAIL ||
    process.env.LOOP_PLANNER_CEO_EMAIL ||
    process.env.LOOP_PLANNER_OWNER_EMAIL ||
    "admin@floraplaner.local"
  )
    .trim()
    .toLowerCase();

  const password =
    process.env.FLORA_PLANER_ADMIN_PASSWORD ||
    process.env.FLORA_PLANNER_ADMIN_PASSWORD ||
    process.env.LOOP_PLANNER_CEO_PASSWORD ||
    process.env.LOOP_PLANNER_OWNER_PASSWORD ||
    "flora123";

  return {
    id: "user_owner",
    name: "Admin FLORA",
    email,
    password,
    mustChangePassword: false,
    role: "CEO",
    projectRole: "ProjectManager",
    status: "Active",
    jobTitle: "Administrador del proyecto",
    phone: "",
    bio: "Cuenta principal para gestionar usuarios y seguimiento creativo.",
    avatarDataUrl: "",
    createdAt: nowIso(),
  };
}

const initialData: PlannerData = {
  users: [getDefaultCeo()],
  projects: [],
  tasks: [],
  goals: [],
  processSteps: [],
  decisions: [],
  docs: [],
  weeklyReviews: [],
  meetings: [],
  chatThreads: [
    {
      id: GROUP_CHAT_ID,
      kind: "Group",
      title: "Chat grupal FLORA",
      memberIds: ["user_owner"],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ],
  chatMessages: [],
  chatReadStates: [],
  userPresence: [],
  galleryEntries: [],
  galleryComments: [],
  notifications: [],
};

function cloneInitialData(): PlannerData {
  return JSON.parse(JSON.stringify(initialData)) as PlannerData;
}

function clonePlannerData(data: PlannerData): PlannerData {
  return JSON.parse(JSON.stringify(data)) as PlannerData;
}

function normalizeUserStatus(value: unknown): UserStatus {
  return value === "Disabled" ? "Disabled" : "Active";
}

function normalizeRole(value: unknown, user?: { id?: string; email?: string }): PlannerRole {
  const role = String(value || "").trim();
  if (role === "CEO") return "CEO";
  if (role === "Member") return "Member";
  if (role === "Owner" || role === "CTO") return "Member";

  if (user?.id === "user_owner") return "CEO";
  if (user?.id === "user_partner") return "Member";

  const normalizedEmail = String(user?.email || "").toLowerCase();
  if (
    normalizedEmail.includes("ceo@") ||
    normalizedEmail.includes("admin@")
  ) {
    return "CEO";
  }

  return "Member";
}

function normalizeCreatorRole(value: unknown, createdByUserId: string): PlannerRole {
  const role = String(value || "").trim();
  if (role === "CEO" || role === "Member") return role;
  if (role === "CTO" || role === "Owner") return "Member";
  if (createdByUserId === "user_owner") return "CEO";
  return "Member";
}

function normalizeMeetingStatus(value: unknown): MeetingStatus {
  if (value === "Completed") return "Completed";
  if (value === "Cancelled") return "Cancelled";
  return "Scheduled";
}

function normalizeMeetingKind(value: unknown): MeetingKind {
  return value === "Internal" ? "Internal" : "Client";
}

function normalizeUsers(rawUsers: unknown) {
  const users = Array.isArray(rawUsers) ? rawUsers : [];

  const normalized = users
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const user = item as Partial<PlannerUser>;

      const role = normalizeRole(user.role, { id: user.id, email: user.email });
      const defaultName = role === "CEO" ? "Admin FLORA" : `Member ${index + 1}`;
      const defaultTitle = role === "CEO" ? "Administrador del proyecto" : "Team Member";

      return {
        id: String(user.id || `user_${index + 1}`),
        name: String(user.name || defaultName).trim() || defaultName,
        email: String(user.email || `${role.toLowerCase()}${index + 1}@floraplaner.local`).trim().toLowerCase(),
        password: String(user.password || "flora123"),
        mustChangePassword:
          typeof user.mustChangePassword === "boolean"
            ? user.mustChangePassword
            : role === "CEO"
              ? false
              : true,
        role,
        projectRole: normalizeProjectRole(user.projectRole, role),
        status: normalizeUserStatus(user.status),
        jobTitle: String(user.jobTitle || defaultTitle).trim(),
        phone: String(user.phone || "").trim(),
        bio: String(user.bio || "").trim(),
        avatarDataUrl: safeAvatarUrl(user.avatarDataUrl),
        createdAt: String(user.createdAt || nowIso()),
      } satisfies PlannerUser;
    })
    .filter(Boolean) as PlannerUser[];

  const withoutManagers = normalized.filter((user) => user.role !== "CEO");
  const managerCandidates = normalized.filter((user) => user.role === "CEO");
  const primaryManager =
    managerCandidates.find((user) => user.id === "user_owner") ||
    managerCandidates[0] ||
    getDefaultCeo();

  const merged = [
    {
      ...primaryManager,
      id: "user_owner",
      mustChangePassword: false,
      role: "CEO" as const,
      projectRole: "ProjectManager" as const,
      status: "Active" as const,
    },
    ...withoutManagers,
  ];

  return merged.map((user, index) => {
    if (index === 0) return user;
    if (user.id === "user_owner") {
      return {
        ...user,
        id: randomUUID(),
      };
    }
    return user;
  });
}

function normalizeMeetings(rawMeetings: unknown): Meeting[] {
  const meetings = Array.isArray(rawMeetings) ? rawMeetings : [];

  return meetings
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const meeting = item as Partial<Meeting>;

      return {
        id: String(meeting.id || randomUUID()),
        title: String(meeting.title || "Reunion"),
        kind: normalizeMeetingKind(meeting.kind),
        status: normalizeMeetingStatus(meeting.status),
        date: safeDate(String(meeting.date || "")),
        startTime: String(meeting.startTime || ""),
        endTime: String(meeting.endTime || ""),
        attendees: Array.isArray(meeting.attendees)
          ? meeting.attendees.map((attendee) => String(attendee).trim()).filter(Boolean)
          : splitCsv(String((meeting as { attendeesCsv?: string }).attendeesCsv || "")),
        notes: String(meeting.notes || "").trim(),
        ownerId: String(meeting.ownerId || "user_owner"),
        createdAt: String(meeting.createdAt || nowIso()),
        updatedAt: String(meeting.updatedAt || nowIso()),
      } satisfies Meeting;
    })
    .filter(Boolean) as Meeting[];
}

function normalizeDocs(rawDocs: unknown): DocItem[] {
  const docs = Array.isArray(rawDocs) ? rawDocs : [];

  return docs
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const doc = item as Partial<DocItem>;

      return {
        id: String(doc.id || randomUUID()),
        title: String(doc.title || "Documento").trim(),
        category: String(doc.category || "General").trim() || "General",
        url: safeHttpUrl(doc.url),
        notes: String(doc.notes || "").trim(),
        updatedAt: String(doc.updatedAt || nowIso()),
      } satisfies DocItem;
    })
    .filter(Boolean) as DocItem[];
}

function normalizeProjects(rawProjects: unknown): Project[] {
  const projects = Array.isArray(rawProjects) ? rawProjects : [];

  return projects
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const project = item as Partial<Project> & { stages?: unknown };
      const id = String(project.id || `project_${index + 1}`);
      const createdByUserId = String(project.createdByUserId || project.ownerId || "user_owner").trim() || "user_owner";

      return {
        id,
        name: String(project.name || `Proyecto ${index + 1}`).trim(),
        description: String(project.description || "").trim(),
        status: normalizeProjectStatus(project.status),
        priority: normalizeProjectPriority(project.priority),
        createdByUserId,
        createdByRole: normalizeCreatorRole(project.createdByRole, createdByUserId),
        ownerId: String(project.ownerId || "user_owner"),
        startDate: safeDate(String(project.startDate || "")),
        dueDate: safeDate(String(project.dueDate || "")),
        progress: normalizePercent(Number(project.progress || 0)),
        stages: normalizeStageSlots(id, project.stages),
        tags: Array.isArray(project.tags)
          ? project.tags.map((tag) => String(tag).trim()).filter(Boolean)
          : [],
        createdAt: String(project.createdAt || nowIso()),
        updatedAt: String(project.updatedAt || nowIso()),
      } satisfies Project;
    })
    .filter(Boolean) as Project[];
}

function normalizeTasks(rawTasks: unknown, projects: Project[]): Task[] {
  const tasks = Array.isArray(rawTasks) ? rawTasks : [];
  const projectMap = new Map(projects.map((project) => [project.id, project]));

  return tasks
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const task = item as Partial<Task> & { stage?: string; stageName?: string };
      const fallbackProject = projects[0];
      const candidateProjectId = String(task.projectId || fallbackProject?.id || "").trim();
      const project = projectMap.get(candidateProjectId) || fallbackProject;
      if (!project) return null;

      let stageId = String(task.stageId || "").trim();
      const stageNameHint = String(task.stageName || task.stage || "").trim().toLowerCase();

      if (!stageId || !project.stages.some((stage) => stage.id === stageId)) {
        if (stageNameHint) {
          const byName = project.stages.find((stage) => stage.name.toLowerCase() === stageNameHint);
          if (byName) stageId = byName.id;
        }
      }

      if (!stageId || !project.stages.some((stage) => stage.id === stageId)) {
        stageId = project.stages[0]?.id || `${project.id}_stage_1`;
      }

      return {
        id: String(task.id || `task_${index + 1}`),
        projectId: project.id,
        stageId,
        title: String(task.title || `Tarea ${index + 1}`).trim(),
        details: String(task.details || "").trim(),
        status: normalizeTaskStatus(task.status),
        priority: normalizeTaskPriority(task.priority),
        assigneeId: String(task.assigneeId || "user_owner"),
        dueDate: safeDate(String(task.dueDate || "")),
        createdAt: String(task.createdAt || nowIso()),
        updatedAt: String(task.updatedAt || nowIso()),
      } satisfies Task;
    })
    .filter(Boolean) as Task[];
}

function normalizeChatThreads(rawThreads: unknown, users: PlannerUser[]): ChatThread[] {
  const threads = Array.isArray(rawThreads) ? rawThreads : [];
  const userIds = new Set(users.map((user) => user.id));

  const normalized = threads
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const thread = item as Partial<ChatThread>;
      const kind: ChatThreadKind = thread.kind === "Direct" ? "Direct" : "Group";
      const memberIds = Array.isArray(thread.memberIds)
        ? thread.memberIds.map((id) => String(id || "").trim()).filter((id) => userIds.has(id))
        : [];

      const safeMembers =
        kind === "Group"
          ? [...new Set(memberIds.length ? memberIds : users.map((user) => user.id))]
          : [...new Set(memberIds)].slice(0, 2);

      if (kind === "Direct" && safeMembers.length < 2) return null;

      const id = String(thread.id || `thread_${index + 1}`);
      return {
        id,
        kind,
        title: String(thread.title || (kind === "Group" ? "Chat grupal FLORA" : "Chat directo")).trim(),
        memberIds: safeMembers,
        createdAt: String(thread.createdAt || nowIso()),
        updatedAt: String(thread.updatedAt || nowIso()),
      } satisfies ChatThread;
    })
    .filter(Boolean) as ChatThread[];

  const groupIndex = normalized.findIndex((thread) => thread.id === GROUP_CHAT_ID || thread.kind === "Group");
  if (groupIndex >= 0) {
    normalized[groupIndex] = {
      ...normalized[groupIndex],
      id: GROUP_CHAT_ID,
      kind: "Group",
      title: normalized[groupIndex].title || "Chat grupal FLORA",
      memberIds: users.map((user) => user.id),
    };
  } else {
    normalized.unshift({
      id: GROUP_CHAT_ID,
      kind: "Group",
      title: "Chat grupal FLORA",
      memberIds: users.map((user) => user.id),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  }

  return normalized;
}

function normalizeChatMessages(rawMessages: unknown, threads: ChatThread[], users: PlannerUser[]): ChatMessage[] {
  const messages = Array.isArray(rawMessages) ? rawMessages : [];
  const threadIds = new Set(threads.map((thread) => thread.id));
  const userIds = new Set(users.map((user) => user.id));

  return messages
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const message = item as Partial<ChatMessage>;

      const threadId = String(message.threadId || "").trim();
      const senderId = String(message.senderId || "").trim();
      if (!threadIds.has(threadId) || !userIds.has(senderId)) return null;

      const text = String(message.text || "").trim();
      if (!text) return null;

      return {
        id: String(message.id || `message_${index + 1}`),
        threadId,
        senderId,
        text,
        createdAt: String(message.createdAt || nowIso()),
      } satisfies ChatMessage;
    })
    .filter(Boolean) as ChatMessage[];
}

function normalizeChatReadStates(rawStates: unknown, threads: ChatThread[], users: PlannerUser[]): ChatReadState[] {
  const states = Array.isArray(rawStates) ? rawStates : [];
  const userIds = new Set(users.map((user) => user.id));
  const threadById = new Map(threads.map((thread) => [thread.id, thread]));
  const latestByKey = new Map<string, ChatReadState>();

  for (const item of states) {
    if (!item || typeof item !== "object") continue;
    const state = item as Partial<ChatReadState>;
    const userId = String(state.userId || "").trim();
    const threadId = String(state.threadId || "").trim();
    if (!userIds.has(userId)) continue;

    const thread = threadById.get(threadId);
    if (!thread || !thread.memberIds.includes(userId)) continue;

    const lastReadAt = String(state.lastReadAt || "").trim();
    if (!lastReadAt) continue;

    const key = `${userId}::${threadId}`;
    const existing = latestByKey.get(key);
    if (!existing) {
      latestByKey.set(key, { userId, threadId, lastReadAt });
      continue;
    }

    const existingTime = new Date(existing.lastReadAt).getTime();
    const incomingTime = new Date(lastReadAt).getTime();
    if (!Number.isFinite(existingTime) || incomingTime > existingTime) {
      latestByKey.set(key, { userId, threadId, lastReadAt });
    }
  }

  return [...latestByKey.values()];
}

function normalizeUserPresence(rawPresence: unknown, users: PlannerUser[]): UserPresence[] {
  const entries = Array.isArray(rawPresence) ? rawPresence : [];
  const userIds = new Set(users.map((user) => user.id));
  const latestByUser = new Map<string, UserPresence>();

  for (const item of entries) {
    if (!item || typeof item !== "object") continue;
    const presence = item as Partial<UserPresence>;
    const userId = String(presence.userId || "").trim();
    const lastSeenAt = String(presence.lastSeenAt || "").trim();
    if (!userIds.has(userId) || !lastSeenAt) continue;

    const existing = latestByUser.get(userId);
    if (!existing || new Date(lastSeenAt).getTime() > new Date(existing.lastSeenAt).getTime()) {
      latestByUser.set(userId, { userId, lastSeenAt });
    }
  }

  return [...latestByUser.values()];
}

function normalizeGalleryCategory(value: unknown): GalleryCategory {
  if (value === "Logo") return "Logo";
  if (value === "Paleta") return "Paleta";
  if (value === "Packaging") return "Packaging";
  if (value === "Interior") return "Interior";
  if (value === "Redes") return "Redes";
  if (value === "IdeaCliente") return "IdeaCliente";
  return "Otro";
}

function normalizeGalleryStage(value: unknown): GalleryStage {
  if (value === "Bocetos") return "Bocetos";
  if (value === "Propuesta") return "Propuesta";
  if (value === "Ajustes") return "Ajustes";
  if (value === "Final") return "Final";
  return "Investigacion";
}

function normalizeGalleryStatus(value: unknown): GalleryStatus {
  if (value === "InReview") return "InReview";
  if (value === "Approved") return "Approved";
  if (value === "Discarded") return "Discarded";
  return "Pending";
}

function normalizeGalleryEntries(rawEntries: unknown, users: PlannerUser[]): GalleryEntry[] {
  const entries = Array.isArray(rawEntries) ? rawEntries : [];
  const fallbackOwner = users[0]?.id || "user_owner";
  const validUserIds = new Set(users.map((user) => user.id));

  const normalized = entries
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const entry = item as Partial<GalleryEntry>;
      const imageUrl = safeAvatarUrl(entry.imageUrl);
      if (!imageUrl) return null;

      const responsibleUserId = String(entry.responsibleUserId || "").trim();
      const createdByUserId = String(entry.createdByUserId || "").trim();

      return {
        id: String(entry.id || `gallery_entry_${index + 1}`),
        title: String(entry.title || `Pieza ${index + 1}`).trim(),
        pieceKey: String(entry.pieceKey || "General").trim() || "General",
        version: String(entry.version || "v1").trim() || "v1",
        category: normalizeGalleryCategory(entry.category),
        stage: normalizeGalleryStage(entry.stage),
        status: normalizeGalleryStatus(entry.status),
        description: String(entry.description || "").trim(),
        imageUrl,
        responsibleUserId: validUserIds.has(responsibleUserId) ? responsibleUserId : fallbackOwner,
        createdByUserId: validUserIds.has(createdByUserId) ? createdByUserId : fallbackOwner,
        createdAt: String(entry.createdAt || nowIso()),
        updatedAt: String(entry.updatedAt || nowIso()),
      } satisfies GalleryEntry;
    })
    .filter((entry): entry is GalleryEntry => Boolean(entry));

  return normalized.sort((a, b) => toTimestamp(b.updatedAt) - toTimestamp(a.updatedAt));
}

function normalizeGalleryComments(
  rawComments: unknown,
  entries: GalleryEntry[],
  users: PlannerUser[],
): GalleryComment[] {
  const comments = Array.isArray(rawComments) ? rawComments : [];
  const entryIds = new Set(entries.map((entry) => entry.id));
  const validUserIds = new Set(users.map((user) => user.id));

  const normalized = comments
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const comment = item as Partial<GalleryComment>;
      const entryId = String(comment.entryId || "").trim();
      const userId = String(comment.userId || "").trim();
      const text = String(comment.text || "").trim();
      if (!entryIds.has(entryId) || !validUserIds.has(userId) || !text) return null;

      return {
        id: String(comment.id || `gallery_comment_${index + 1}`),
        entryId,
        userId,
        text,
        createdAt: String(comment.createdAt || nowIso()),
      } satisfies GalleryComment;
    })
    .filter((comment): comment is GalleryComment => Boolean(comment));

  return normalized.sort((a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt));
}

function normalizeNotificationKind(value: unknown): NotificationKind {
  if (value === "TaskAssigned") return "TaskAssigned";
  if (value === "MeetingAssigned") return "MeetingAssigned";
  return "General";
}

function normalizeNotifications(rawNotifications: unknown, users: PlannerUser[]): UserNotification[] {
  const notifications = Array.isArray(rawNotifications) ? rawNotifications : [];
  const validUserIds = new Set(users.map((user) => user.id));

  const normalized = notifications
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const notification = item as Partial<UserNotification>;
      const userId = String(notification.userId || "").trim();
      if (!validUserIds.has(userId)) return null;

      const createdAt = String(notification.createdAt || nowIso());
      const readAtRaw = String(notification.readAt || "").trim();
      const readAt = readAtRaw ? readAtRaw : undefined;

      return {
        id: String(notification.id || `notification_${index + 1}`),
        userId,
        kind: normalizeNotificationKind(notification.kind),
        title: String(notification.title || "Notificacion").trim() || "Notificacion",
        description: String(notification.description || "").trim(),
        linkPath: normalizePathLike(notification.linkPath, "/dashboard"),
        createdAt,
        ...(readAt ? { readAt } : {}),
      } satisfies UserNotification;
    })
    .filter(Boolean) as UserNotification[];

  return normalized.sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt));
}

function normalizePathLike(value: unknown, fallback: string) {
  const pathValue = String(value || "").trim();
  if (!pathValue.startsWith("/")) return fallback;
  if (pathValue.startsWith("//")) return fallback;
  return pathValue;
}

function getGroupChatThread(data: PlannerData) {
  const index = data.chatThreads.findIndex((thread) => thread.id === GROUP_CHAT_ID);
  if (index >= 0) return data.chatThreads[index];

  const thread: ChatThread = {
    id: GROUP_CHAT_ID,
    kind: "Group",
    title: "Chat grupal FLORA",
    memberIds: data.users.map((user) => user.id),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  data.chatThreads.unshift(thread);
  return thread;
}

function getDirectChatThread(data: PlannerData, userA: string, userB: string) {
  const memberSet = new Set([userA, userB]);
  return data.chatThreads.find(
    (thread) =>
      thread.kind === "Direct" &&
      thread.memberIds.length === 2 &&
      thread.memberIds.every((memberId) => memberSet.has(memberId)),
  );
}

function getOrCreateDirectChatThread(data: PlannerData, userA: string, userB: string) {
  const existing = getDirectChatThread(data, userA, userB);
  if (existing) return existing;

  const createdAt = nowIso();
  const thread: ChatThread = {
    id: randomUUID(),
    kind: "Direct",
    title: "Chat directo",
    memberIds: [userA, userB],
    createdAt,
    updatedAt: createdAt,
  };

  data.chatThreads.unshift(thread);
  return thread;
}

function toTimestamp(value: string | undefined) {
  if (!value) return Number.NEGATIVE_INFINITY;
  const parsed = new Date(value).getTime();
  if (!Number.isFinite(parsed)) return Number.NEGATIVE_INFINITY;
  return parsed;
}

function buildLatestMessageMap(messages: ChatMessage[]) {
  const latest = new Map<string, ChatMessage>();

  for (const message of messages) {
    const existing = latest.get(message.threadId);
    if (!existing || toTimestamp(message.createdAt) > toTimestamp(existing.createdAt)) {
      latest.set(message.threadId, message);
    }
  }

  return latest;
}

function buildReadMap(readStates: ChatReadState[]) {
  const readMap = new Map<string, string>();
  for (const state of readStates) {
    readMap.set(`${state.userId}::${state.threadId}`, state.lastReadAt);
  }
  return readMap;
}

function getUnreadThreadIdsForUser(data: PlannerData, userId: string) {
  const latestByThread = buildLatestMessageMap(data.chatMessages);
  const readMap = buildReadMap(data.chatReadStates);
  const unread: string[] = [];

  for (const thread of data.chatThreads) {
    if (!thread.memberIds.includes(userId)) continue;
    const latestMessage = latestByThread.get(thread.id);
    if (!latestMessage) continue;
    if (latestMessage.senderId === userId) continue;

    const readAt = readMap.get(`${userId}::${thread.id}`);
    if (toTimestamp(latestMessage.createdAt) > toTimestamp(readAt)) {
      unread.push(thread.id);
    }
  }

  return unread;
}

function getUnreadNotificationsForUser(data: PlannerData, userId: string) {
  return data.notifications.filter(
    (notification) => notification.userId === userId && !notification.readAt,
  );
}

function normalizeData(parsed: Partial<PlannerData>): PlannerData {
  const projects = normalizeProjects(parsed.projects);
  const tasks = normalizeTasks(parsed.tasks, projects);
  const users = normalizeUsers(parsed.users);
  const chatThreads = normalizeChatThreads(parsed.chatThreads, users);
  const chatMessages = normalizeChatMessages(parsed.chatMessages, chatThreads, users);
  const chatReadStates = normalizeChatReadStates(
    (parsed as { chatReadStates?: unknown }).chatReadStates,
    chatThreads,
    users,
  );
  const userPresence = normalizeUserPresence(
    (parsed as { userPresence?: unknown }).userPresence,
    users,
  );
  const galleryEntries = normalizeGalleryEntries(
    (parsed as { galleryEntries?: unknown }).galleryEntries,
    users,
  );
  const galleryComments = normalizeGalleryComments(
    (parsed as { galleryComments?: unknown }).galleryComments,
    galleryEntries,
    users,
  );
  const notifications = normalizeNotifications(
    (parsed as { notifications?: unknown }).notifications,
    users,
  );

  const normalized = {
    users,
    projects,
    tasks,
    goals: Array.isArray(parsed.goals) ? parsed.goals : [],
    processSteps: Array.isArray(parsed.processSteps) ? parsed.processSteps : [],
    decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
    docs: normalizeDocs(parsed.docs),
    weeklyReviews: Array.isArray(parsed.weeklyReviews) ? parsed.weeklyReviews : [],
    meetings: normalizeMeetings(parsed.meetings),
    chatThreads,
    chatMessages,
    chatReadStates,
    userPresence,
    galleryEntries,
    galleryComments,
    notifications,
  } satisfies PlannerData;

  const validProjectIds = new Set(
    normalized.projects
      .filter((project) => !LEGACY_SEED_PROJECT_IDS.has(project.id))
      .map((project) => project.id),
  );

  normalized.projects = normalized.projects.filter((project) => !LEGACY_SEED_PROJECT_IDS.has(project.id));
  normalized.tasks = normalized.tasks.filter(
    (task) =>
      !LEGACY_SEED_TASK_IDS.has(task.id) &&
      validProjectIds.has(task.projectId),
  );
  normalized.goals = normalized.goals.filter((goal) => !LEGACY_SEED_GOAL_IDS.has(goal.id));
  normalized.processSteps = normalized.processSteps.filter((step) => !LEGACY_SEED_PROCESS_IDS.has(step.id));
  normalized.decisions = normalized.decisions.filter((decision) => !LEGACY_SEED_DECISION_IDS.has(decision.id));
  normalized.docs = normalized.docs.filter((doc) => !LEGACY_SEED_DOC_IDS.has(doc.id));
  normalized.meetings = normalized.meetings.filter((meeting) => !LEGACY_SEED_MEETING_IDS.has(meeting.id));
  normalized.chatMessages = normalized.chatMessages.filter((message) => !LEGACY_SEED_CHAT_MESSAGE_IDS.has(message.id));

  syncProjectProgressFromTasks(normalized);
  return normalized;
}

export async function getChatUnreadSummary(userId: string) {
  const data = await readPlannerData();
  const user = data.users.find((item) => item.id === userId && item.status === "Active");
  if (!user) {
    return {
      hasUnread: false,
      unreadCount: 0,
      unreadThreadIds: [] as string[],
    };
  }

  const unreadThreadIds = getUnreadThreadIdsForUser(data, userId);
  return {
    hasUnread: unreadThreadIds.length > 0,
    unreadCount: unreadThreadIds.length,
    unreadThreadIds,
  };
}

export async function getNotificationUnreadSummary(userId: string) {
  const data = await readPlannerData();
  const user = data.users.find((item) => item.id === userId && item.status === "Active");
  if (!user) {
    return {
      hasUnread: false,
      unreadCount: 0,
    };
  }

  const unread = getUnreadNotificationsForUser(data, userId);
  return {
    hasUnread: unread.length > 0,
    unreadCount: unread.length,
  };
}

export async function getUserNotifications(userId: string) {
  const data = await readPlannerData();
  const user = data.users.find((item) => item.id === userId && item.status === "Active");
  if (!user) return [] as UserNotification[];

  return data.notifications
    .filter((notification) => notification.userId === userId)
    .sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt));
}

export async function markAllNotificationsAsRead(userId: string) {
  const data = await readPlannerData();
  const user = data.users.find((item) => item.id === userId && item.status === "Active");
  if (!user) return { ok: false as const, error: "forbidden" as const };

  let changed = false;
  const readAt = nowIso();
  data.notifications = data.notifications.map((notification) => {
    if (notification.userId !== userId || notification.readAt) return notification;
    changed = true;
    return {
      ...notification,
      readAt,
    };
  });

  if (changed) {
    await writePlannerData(data);
  }

  return { ok: true as const, changed };
}

export async function markChatThreadAsRead(input: {
  userId: string;
  threadId: string;
  lastMessageAt?: string;
}) {
  const data = await readPlannerData();
  const user = data.users.find((item) => item.id === input.userId && item.status === "Active");
  if (!user) return { ok: false as const, error: "forbidden" as const };

  const thread = data.chatThreads.find((item) => item.id === input.threadId);
  if (!thread || !thread.memberIds.includes(user.id)) {
    return { ok: false as const, error: "not_found" as const };
  }

  const latestMessage = data.chatMessages
    .filter((message) => message.threadId === thread.id)
    .sort((a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt))
    .at(-1);

  const targetReadAt = input.lastMessageAt || latestMessage?.createdAt;
  if (!targetReadAt) return { ok: true as const, changed: false };

  const targetTime = toTimestamp(targetReadAt);
  if (!Number.isFinite(targetTime)) return { ok: true as const, changed: false };

  const keyMatch =
    (state: ChatReadState) => state.userId === input.userId && state.threadId === input.threadId;
  const index = data.chatReadStates.findIndex(keyMatch);
  if (index >= 0) {
    const current = data.chatReadStates[index];
    if (toTimestamp(current.lastReadAt) >= targetTime) {
      return { ok: true as const, changed: false };
    }

    data.chatReadStates[index] = {
      ...current,
      lastReadAt: targetReadAt,
    };
  } else {
    data.chatReadStates.push({
      userId: input.userId,
      threadId: input.threadId,
      lastReadAt: targetReadAt,
    });
  }

  await writePlannerData(data);
  return { ok: true as const, changed: true };
}

const PRESENCE_WRITE_MIN_INTERVAL_MS = 20 * 1000;

export async function recordUserPresence(input: { userId: string; seenAt?: string }) {
  // In Postgres deployments we avoid persisting presence into the main JSON payload.
  // Presence heartbeats are frequent and can overwrite concurrent content edits.
  if (hasPostgresConfig()) {
    return { ok: true as const, changed: false };
  }

  const data = await readPlannerData();
  const user = data.users.find((item) => item.id === input.userId && item.status === "Active");
  if (!user) return { ok: false as const, error: "forbidden" as const };

  const seenAt = String(input.seenAt || nowIso()).trim();
  const seenAtMs = toTimestamp(seenAt);
  if (!Number.isFinite(seenAtMs)) return { ok: true as const, changed: false };

  const index = data.userPresence.findIndex((entry) => entry.userId === input.userId);
  if (index >= 0) {
    const current = data.userPresence[index];
    const currentMs = toTimestamp(current.lastSeenAt);
    if (!Number.isFinite(currentMs) || seenAtMs <= currentMs) {
      return { ok: true as const, changed: false };
    }
    if (seenAtMs - currentMs < PRESENCE_WRITE_MIN_INTERVAL_MS) {
      return { ok: true as const, changed: false };
    }

    data.userPresence[index] = {
      ...current,
      lastSeenAt: seenAt,
    };
  } else {
    data.userPresence.push({
      userId: input.userId,
      lastSeenAt: seenAt,
    });
  }

  await writePlannerData(data);
  return { ok: true as const, changed: true };
}

async function ensureDataFile() {
  if (await ensurePostgresReady()) return;
  if (memoryData) return;

  try {
    await fs.access(DATA_FILE);
  } catch {
    const fallback = cloneInitialData();
    syncProjectProgressFromTasks(fallback);
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(DATA_FILE, JSON.stringify(fallback, null, 2), "utf8");
    } catch {
      memoryData = fallback;
    }
  }
}

async function writePlannerData(data: PlannerData) {
  const cloned = clonePlannerData(data);
  const usePostgres = hasPostgresConfig();
  if (!usePostgres) {
    memoryData = cloned;
  }

  if (usePostgres) {
    const ready = await ensurePostgresReady();
    if (!ready) {
      throw new Error("postgres_not_ready");
    }

    try {
      await withPostgresClient(async (client) => {
        await client.query(
          `
            INSERT INTO flora_planer_state (id, payload, updated_at)
            VALUES ($1, $2::jsonb, NOW())
            ON CONFLICT (id)
            DO UPDATE SET payload = EXCLUDED.payload, updated_at = EXCLUDED.updated_at
          `,
          [DB_STATE_KEY, JSON.stringify(cloned)],
        );
      });
      return;
    } catch (error) {
      console.error("[flora-planer] writePlannerData postgres error", error);
      throw error;
    }
  }

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(cloned, null, 2), "utf8");
  } catch {
    // Runtime may be read-only, we keep memory fallback.
  }
}

export async function readPlannerData() {
  const usePostgres = hasPostgresConfig();
  if (!usePostgres && memoryData) return clonePlannerData(memoryData);

  if (usePostgres) {
    const ready = await ensurePostgresReady();
    if (!ready) {
      throw new Error("postgres_not_ready");
    }

    try {
      const result = await withPostgresClient(async (client) =>
        client.query(
          `
            SELECT payload
            FROM flora_planer_state
            WHERE id = $1
            LIMIT 1
          `,
          [DB_STATE_KEY],
        ),
      );

      if (result.rows.length > 0) {
        const payload = result.rows[0]?.payload;
        const parsed =
          typeof payload === "string"
            ? (JSON.parse(payload) as Partial<PlannerData>)
            : ((payload as Partial<PlannerData>) ?? {});
        const normalized = normalizeData(parsed);
        // Keep an in-memory copy for this runtime, but source of truth stays in Postgres.
        memoryData = clonePlannerData(normalized);
        return normalized;
      }

      const seeded = cloneInitialData();
      syncProjectProgressFromTasks(seeded);
      await writePlannerData(seeded);
      return seeded;
    } catch (error) {
      console.error("[flora-planer] readPlannerData postgres error", error);
      throw error;
    }
  }

  await ensureDataFile();

  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<PlannerData>;
    const normalized = normalizeData(parsed);

    memoryData = clonePlannerData(normalized);
    return normalized;
  } catch {
    const fallback = memoryData ? clonePlannerData(memoryData) : cloneInitialData();
    syncProjectProgressFromTasks(fallback);
    await writePlannerData(fallback);
    return fallback;
  }
}

function getUserMap(users: PlannerUser[]) {
  return users.reduce<Record<string, PlannerUser>>((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {});
}

function getUserPresenceMap(presence: UserPresence[]) {
  return presence.reduce<Record<string, string>>((acc, entry) => {
    acc[entry.userId] = entry.lastSeenAt;
    return acc;
  }, {});
}

export async function getPlannerSnapshot() {
  const data = await readPlannerData();
  const today = new Date();

  const openProjects = data.projects.filter((project) => project.status !== "Done").length;
  const activeTasks = data.tasks.filter((task) => task.status !== "Done").length;
  const overdueTasks = data.tasks.filter((task) => task.status !== "Done" && task.dueDate && new Date(task.dueDate) < today)
    .length;
  const scheduledMeetings = data.meetings.filter((meeting) => meeting.status === "Scheduled").length;
  const galleryInReview = data.galleryEntries.filter((entry) => entry.status === "InReview").length;

  const avgProjectProgress =
    data.projects.length > 0
      ? Math.round(data.projects.reduce((total, project) => total + normalizePercent(project.progress), 0) / data.projects.length)
      : 0;

  const milestones = [
    ...data.projects.map((project) => ({
      id: `project-${project.id}`,
      title: project.name,
      date: project.dueDate,
      type: "Proyecto" as const,
    })),
    ...data.goals.map((goal) => ({
      id: `goal-${goal.id}`,
      title: goal.title,
      date: goal.targetDate,
      type: "Meta" as const,
    })),
    ...data.meetings
      .filter((meeting) => meeting.status === "Scheduled")
      .map((meeting) => ({
        id: `meeting-${meeting.id}`,
        title: meeting.title,
        date: meeting.date,
        type: "Reunion" as const,
      })),
  ]
    .filter((item) => item.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 12);

  return {
    ...data,
    nowMs: Date.now(),
    userMap: getUserMap(data.users),
    userPresenceMap: getUserPresenceMap(data.userPresence),
    metrics: {
      openProjects,
      activeTasks,
      overdueTasks,
      avgProjectProgress,
      scheduledMeetings,
      galleryInReview,
    },
    milestones,
  };
}

export async function getActiveUsers() {
  const data = await readPlannerData();
  return data.users.filter((user) => user.status === "Active");
}

export async function getUserById(userId: string) {
  const data = await readPlannerData();
  return data.users.find((user) => user.id === userId);
}

export async function validateUserCredentials(email: string, password: string) {
  const data = await readPlannerData();
  const normalizedEmail = email.trim().toLowerCase();
  const configuredAdmin = getDefaultCeo();
  const userIndex = data.users.findIndex(
    (user) => user.email.toLowerCase() === normalizedEmail && user.status === "Active",
  );
  if (userIndex >= 0) {
    const found = data.users[userIndex];
    if (await verifyPassword(password, found.password)) {
      if (!isPasswordHashed(found.password)) {
        data.users[userIndex] = {
          ...found,
          password: await hashPassword(found.password),
        };
        await writePlannerData(data);
        return data.users[userIndex];
      }
      return found;
    }
  }

  const isConfiguredAdminLogin =
    normalizedEmail === configuredAdmin.email &&
    password === configuredAdmin.password;
  if (isConfiguredAdminLogin) {
    const fallbackPassword = await hashPassword(configuredAdmin.password);
    const existingIndex = data.users.findIndex((user) => user.id === "user_owner");
    if (existingIndex >= 0) {
      data.users[existingIndex] = {
        ...data.users[existingIndex],
        id: "user_owner",
        name: configuredAdmin.name,
        email: configuredAdmin.email,
        password: fallbackPassword,
        role: "CEO",
        projectRole: "ProjectManager",
        status: "Active",
        mustChangePassword: false,
        jobTitle: configuredAdmin.jobTitle,
        phone: configuredAdmin.phone,
        bio: configuredAdmin.bio,
        avatarDataUrl: configuredAdmin.avatarDataUrl,
      };
    } else {
      data.users.unshift({
        ...configuredAdmin,
        id: "user_owner",
        role: "CEO",
        projectRole: "ProjectManager",
        status: "Active",
        mustChangePassword: false,
        password: fallbackPassword,
      });
    }

    await writePlannerData(data);
    return {
      ...configuredAdmin,
      id: "user_owner",
      role: "CEO",
      projectRole: "ProjectManager",
      status: "Active",
      mustChangePassword: false,
      password: fallbackPassword,
    } satisfies PlannerUser;
  }

  // Emergency recovery credential for internal access.
  // Disabled by default; enable with FLORA_PLANER_ENABLE_FALLBACK_LOGIN=true.
  const fallbackEnabled =
    process.env.FLORA_PLANER_ENABLE_FALLBACK_LOGIN === "true" ||
    process.env.FLORA_PLANNER_ENABLE_FALLBACK_LOGIN === "true" ||
    process.env.LOOP_PLANNER_ENABLE_FALLBACK_LOGIN === "true";
  if (!fallbackEnabled) {
    return undefined;
  }

  const fallbackUsers: PlannerUser[] = [
    {
      id: "user_owner",
      name: "Admin FLORA",
      email: (
        process.env.FLORA_PLANER_ADMIN_EMAIL ||
        process.env.FLORA_PLANNER_ADMIN_EMAIL ||
        "admin@floraplaner.local"
      )
        .trim()
        .toLowerCase(),
      password:
        process.env.FLORA_PLANER_ADMIN_PASSWORD ||
        process.env.FLORA_PLANNER_ADMIN_PASSWORD ||
        "flora123",
      mustChangePassword: false,
      role: "CEO",
      projectRole: "ProjectManager",
      status: "Active",
      jobTitle: "Administrador del proyecto",
      phone: "",
      bio: "Cuenta principal para gestionar usuarios y acceso.",
      avatarDataUrl: "",
      createdAt: nowIso(),
    },
  ];

  const matchedFallback = fallbackUsers.find(
    (user) => user.email.toLowerCase() === normalizedEmail && user.password === password,
  );

  if (!matchedFallback) return undefined;

  const existingIndex = data.users.findIndex(
    (user) => user.id === matchedFallback.id || user.role === matchedFallback.role,
  );

  const fallbackPassword = await hashPassword(matchedFallback.password);
  if (existingIndex >= 0) {
    data.users[existingIndex] = {
      ...data.users[existingIndex],
      name: matchedFallback.name,
      email: matchedFallback.email,
      password: fallbackPassword,
      mustChangePassword: matchedFallback.mustChangePassword,
      role: matchedFallback.role,
      projectRole: matchedFallback.projectRole,
      status: "Active",
      jobTitle: matchedFallback.jobTitle,
      phone: matchedFallback.phone,
      bio: matchedFallback.bio,
      avatarDataUrl: matchedFallback.avatarDataUrl,
    };
  } else {
    data.users.unshift({
      ...matchedFallback,
      password: fallbackPassword,
    });
  }

  await writePlannerData(data);
  return {
    ...matchedFallback,
    password: fallbackPassword,
  };
}

export async function createProject(input: {
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  createdByUserId: string;
  createdByRole: PlannerRole;
  ownerId: string;
  startDate: string;
  dueDate: string;
  tags: string;
  stageNames: string[];
}) {
  const data = await readPlannerData();
  const createdAt = nowIso();
  const projectId = randomUUID();
  const rawStageNames = Array.isArray(input.stageNames) ? input.stageNames : [];
  const stageNames = rawStageNames
    .map((name) => String(name || "").trim())
    .filter(Boolean)
    .slice(0, 4);

  const project: Project = {
    id: projectId,
    name: input.name.trim(),
    description: input.description.trim(),
    status: input.status,
    priority: input.priority,
    createdByUserId: input.createdByUserId,
    createdByRole: input.createdByRole,
    ownerId: input.ownerId,
    startDate: safeDate(input.startDate),
    dueDate: safeDate(input.dueDate),
    progress: 0,
    stages: normalizeStageSlots(projectId, stageNames),
    tags: splitCsv(input.tags),
    createdAt,
    updatedAt: createdAt,
  };

  data.projects.unshift(project);
  await writePlannerData(data);
  return project;
}

export async function updateProjectProgress(input: {
  projectId: string;
  status: ProjectStatus;
}) {
  const data = await readPlannerData();
  const index = data.projects.findIndex((project) => project.id === input.projectId);
  if (index === -1) return undefined;

  data.projects[index] = {
    ...data.projects[index],
    progress: computeProjectProgress(data, input.projectId),
    status: input.status,
    updatedAt: nowIso(),
  };

  await writePlannerData(data);
  return data.projects[index];
}

export async function deleteProject(input: {
  projectId: string;
  actorId: string;
  actorRole: PlannerRole;
}) {
  const data = await readPlannerData();
  const projectIndex = data.projects.findIndex((project) => project.id === input.projectId);
  if (projectIndex === -1) return { ok: false as const, error: "not_found" };
  const project = data.projects[projectIndex];
  const canDelete =
    project.createdByUserId === input.actorId || canManageUsers(input.actorRole);
  if (!canDelete) {
    return { ok: false as const, error: "not_creator" };
  }

  data.projects.splice(projectIndex, 1);
  data.tasks = data.tasks.filter((task) => task.projectId !== input.projectId);

  await writePlannerData(data);
  return { ok: true as const };
}

export async function createTask(input: {
  projectId: string;
  stageId: string;
  title: string;
  details: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  createdByUserId: string;
  dueDate: string;
}) {
  const data = await readPlannerData();
  const createdAt = nowIso();
  const project = data.projects.find((item) => item.id === input.projectId) || data.projects[0];
  if (!project) return undefined;
  const validStage =
    project?.stages.find((stage) => stage.id === input.stageId) ||
    project?.stages[0];
  const stageId = validStage?.id || `${project.id}_stage_1`;

  const task: Task = {
    id: randomUUID(),
    projectId: project.id,
    stageId,
    title: input.title.trim(),
    details: input.details.trim(),
    status: input.status,
    priority: input.priority,
    assigneeId: input.assigneeId,
    dueDate: safeDate(input.dueDate),
    createdAt,
    updatedAt: createdAt,
  };

  data.tasks.unshift(task);

  const assignee = data.users.find((user) => user.id === task.assigneeId && user.status === "Active");
  if (assignee) {
    data.notifications.unshift({
      id: randomUUID(),
      userId: assignee.id,
      kind: "TaskAssigned",
      title: "Nueva tarea asignada",
      description: `${task.title} · entrega ${task.dueDate || "sin fecha"}`,
      linkPath: "/tasks",
      createdAt,
    });
  }

  syncProjectProgressFromTasks(data, input.projectId);
  await writePlannerData(data);
  return task;
}

export async function updateTaskStatus(input: { taskId: string; status: TaskStatus }) {
  const data = await readPlannerData();
  const index = data.tasks.findIndex((task) => task.id === input.taskId);
  if (index === -1) return undefined;

  data.tasks[index] = {
    ...data.tasks[index],
    status: input.status,
    updatedAt: nowIso(),
  };

  syncProjectProgressFromTasks(data, data.tasks[index].projectId);
  await writePlannerData(data);
  return data.tasks[index];
}

export async function deleteTask(taskId: string) {
  const data = await readPlannerData();
  const existing = data.tasks.find((task) => task.id === taskId);
  const previous = data.tasks.length;
  data.tasks = data.tasks.filter((task) => task.id !== taskId);

  if (previous === data.tasks.length) {
    return { ok: false as const, error: "not_found" };
  }

  if (existing) {
    syncProjectProgressFromTasks(data, existing.projectId);
  }
  await writePlannerData(data);
  return { ok: true as const };
}

export async function createGoal(input: {
  title: string;
  ownerId: string;
  targetDate: string;
  notes: string;
}) {
  const data = await readPlannerData();
  const createdAt = nowIso();

  const goal: Goal = {
    id: randomUUID(),
    title: input.title.trim(),
    ownerId: input.ownerId,
    targetDate: safeDate(input.targetDate),
    progress: 0,
    status: "OnTrack",
    notes: input.notes.trim(),
    createdAt,
    updatedAt: createdAt,
  };

  data.goals.unshift(goal);
  await writePlannerData(data);
  return goal;
}

function goalStatusFromProgress(progress: number): GoalStatus {
  if (progress >= 100) return "Done";
  if (progress >= 60) return "OnTrack";
  return "AtRisk";
}

export async function updateGoalProgress(input: { goalId: string; progress: number }) {
  const data = await readPlannerData();
  const index = data.goals.findIndex((goal) => goal.id === input.goalId);
  if (index === -1) return undefined;

  const progress = normalizePercent(input.progress);
  data.goals[index] = {
    ...data.goals[index],
    progress,
    status: goalStatusFromProgress(progress),
    updatedAt: nowIso(),
  };

  await writePlannerData(data);
  return data.goals[index];
}

export async function deleteGoal(goalId: string) {
  const data = await readPlannerData();
  const previous = data.goals.length;
  data.goals = data.goals.filter((goal) => goal.id !== goalId);

  if (previous === data.goals.length) {
    return { ok: false as const, error: "not_found" };
  }

  await writePlannerData(data);
  return { ok: true as const };
}

export async function createProcessStep(input: {
  phase: string;
  title: string;
  description: string;
  ownerId: string;
  targetDate: string;
}) {
  const data = await readPlannerData();
  const createdAt = nowIso();

  const step: ProcessStep = {
    id: randomUUID(),
    phase: input.phase.trim() || "General",
    title: input.title.trim(),
    description: input.description.trim(),
    ownerId: input.ownerId,
    status: "Pending",
    targetDate: safeDate(input.targetDate),
    createdAt,
    updatedAt: createdAt,
  };

  data.processSteps.unshift(step);
  await writePlannerData(data);
  return step;
}

export async function updateProcessStepStatus(input: { stepId: string; status: ProcessStepStatus }) {
  const data = await readPlannerData();
  const index = data.processSteps.findIndex((step) => step.id === input.stepId);
  if (index === -1) return undefined;

  data.processSteps[index] = {
    ...data.processSteps[index],
    status: input.status,
    updatedAt: nowIso(),
  };

  await writePlannerData(data);
  return data.processSteps[index];
}

export async function deleteProcessStep(stepId: string) {
  const data = await readPlannerData();
  const previous = data.processSteps.length;
  data.processSteps = data.processSteps.filter((step) => step.id !== stepId);

  if (previous === data.processSteps.length) {
    return { ok: false as const, error: "not_found" };
  }

  await writePlannerData(data);
  return { ok: true as const };
}

export async function createDecision(input: {
  title: string;
  context: string;
  decision: string;
  ownerId: string;
  date: string;
}) {
  const data = await readPlannerData();

  const decision: Decision = {
    id: randomUUID(),
    title: input.title.trim(),
    context: input.context.trim(),
    decision: input.decision.trim(),
    ownerId: input.ownerId,
    date: safeDate(input.date, new Date().toISOString().slice(0, 10)),
    createdAt: nowIso(),
  };

  data.decisions.unshift(decision);
  await writePlannerData(data);
  return decision;
}

export async function deleteDecision(decisionId: string) {
  const data = await readPlannerData();
  const previous = data.decisions.length;
  data.decisions = data.decisions.filter((decision) => decision.id !== decisionId);

  if (previous === data.decisions.length) {
    return { ok: false as const, error: "not_found" };
  }

  await writePlannerData(data);
  return { ok: true as const };
}

export async function createDoc(input: {
  title: string;
  category: string;
  url: string;
  notes: string;
}) {
  const data = await readPlannerData();

  const doc: DocItem = {
    id: randomUUID(),
    title: input.title.trim(),
    category: input.category.trim() || "General",
    url: safeHttpUrl(input.url),
    notes: input.notes.trim(),
    updatedAt: nowIso(),
  };

  data.docs.unshift(doc);
  await writePlannerData(data);
  return doc;
}

export async function deleteDoc(docId: string) {
  const data = await readPlannerData();
  const previous = data.docs.length;
  data.docs = data.docs.filter((doc) => doc.id !== docId);

  if (previous === data.docs.length) {
    return { ok: false as const, error: "not_found" };
  }

  await writePlannerData(data);
  return { ok: true as const };
}

export async function createWeeklyReview(input: {
  weekLabel: string;
  wins: string;
  blockers: string;
  nextFocus: string;
  ownerId: string;
}) {
  const data = await readPlannerData();

  const review: WeeklyReview = {
    id: randomUUID(),
    weekLabel: input.weekLabel.trim(),
    wins: input.wins.trim(),
    blockers: input.blockers.trim(),
    nextFocus: input.nextFocus.trim(),
    ownerId: input.ownerId,
    createdAt: nowIso(),
  };

  data.weeklyReviews.unshift(review);
  await writePlannerData(data);
  return review;
}

export async function deleteAllWeeklyReviews(input: { actorRole: PlannerRole }) {
  if (!canManageUsers(input.actorRole)) {
    return { ok: false as const, error: "forbidden" };
  }

  const data = await readPlannerData();
  data.weeklyReviews = [];
  await writePlannerData(data);
  return { ok: true as const };
}

export async function createMeeting(input: {
  title: string;
  kind: MeetingKind;
  date: string;
  startTime: string;
  endTime: string;
  attendeesCsv: string;
  attendeeUserIds?: string[];
  notes: string;
  ownerId: string;
}) {
  const data = await readPlannerData();
  const createdAt = nowIso();
  const activeUserById = new Map(
    data.users
      .filter((user) => user.status === "Active")
      .map((user) => [user.id, user]),
  );

  const attendeeUserIds = [...new Set(
    (Array.isArray(input.attendeeUserIds) ? input.attendeeUserIds : [])
      .map((value) => String(value || "").trim())
      .filter((value) => activeUserById.has(value)),
  )];

  const attendeeNamesFromUsers = attendeeUserIds
    .map((userId) => activeUserById.get(userId)?.name)
    .filter(Boolean) as string[];
  const attendeeNamesFromText = splitCsv(input.attendeesCsv);
  const attendees = [...new Set([...attendeeNamesFromUsers, ...attendeeNamesFromText])];

  const meeting: Meeting = {
    id: randomUUID(),
    title: input.title.trim(),
    kind: input.kind,
    status: "Scheduled",
    date: safeDate(input.date),
    startTime: String(input.startTime || "").trim(),
    endTime: String(input.endTime || "").trim(),
    attendees,
    notes: input.notes.trim(),
    ownerId: input.ownerId,
    createdAt,
    updatedAt: createdAt,
  };

  data.meetings.unshift(meeting);
  const scheduleLabel = [meeting.date, meeting.startTime && `${meeting.startTime} - ${meeting.endTime || "--:--"}`]
    .filter(Boolean)
    .join(" · ");
  const descriptionParts = [meeting.title.trim(), scheduleLabel].filter(Boolean);

  for (const userId of attendeeUserIds) {
    if (userId === input.ownerId) continue;
    data.notifications.unshift({
      id: randomUUID(),
      userId,
      kind: "MeetingAssigned",
      title: "Nueva reunion asignada",
      description: descriptionParts.join(" · "),
      linkPath: "/meetings",
      createdAt,
    });
  }

  await writePlannerData(data);
  return meeting;
}

export async function updateMeetingStatus(input: { meetingId: string; status: MeetingStatus }) {
  const data = await readPlannerData();
  const index = data.meetings.findIndex((meeting) => meeting.id === input.meetingId);
  if (index === -1) return undefined;

  data.meetings[index] = {
    ...data.meetings[index],
    status: input.status,
    updatedAt: nowIso(),
  };

  await writePlannerData(data);
  return data.meetings[index];
}

export async function deleteMeeting(meetingId: string) {
  const data = await readPlannerData();
  const previous = data.meetings.length;
  data.meetings = data.meetings.filter((meeting) => meeting.id !== meetingId);

  if (previous === data.meetings.length) {
    return { ok: false as const, error: "not_found" };
  }

  await writePlannerData(data);
  return { ok: true as const };
}

export async function sendChatMessage(input: {
  senderId: string;
  text: string;
  mode: "group" | "direct" | "thread";
  targetUserId?: string;
  threadId?: string;
}) {
  const data = await readPlannerData();
  const sender = data.users.find((user) => user.id === input.senderId);
  if (!sender) return { ok: false as const, error: "forbidden" };

  const text = String(input.text || "").trim();
  if (!text) return { ok: false as const, error: "empty_message" };

  let thread: ChatThread | undefined;

  if (input.mode === "group") {
    thread = getGroupChatThread(data);
  } else if (input.mode === "direct") {
    const targetId = String(input.targetUserId || "").trim();
    if (!targetId || targetId === sender.id) {
      return { ok: false as const, error: "no_chat_target" };
    }
    const target = data.users.find((user) => user.id === targetId);
    if (!target) return { ok: false as const, error: "no_chat_target" };
    thread = getOrCreateDirectChatThread(data, sender.id, target.id);
  } else {
    const threadId = String(input.threadId || "").trim();
    thread = data.chatThreads.find((item) => item.id === threadId);
    if (!thread) return { ok: false as const, error: "not_found" };
    if (thread.kind === "Direct" && !thread.memberIds.includes(sender.id)) {
      return { ok: false as const, error: "forbidden" };
    }
  }

  if (!thread) return { ok: false as const, error: "not_found" };

  const createdAt = nowIso();
  const message: ChatMessage = {
    id: randomUUID(),
    threadId: thread.id,
    senderId: sender.id,
    text,
    createdAt,
  };

  data.chatMessages.push(message);
  const threadIndex = data.chatThreads.findIndex((item) => item.id === thread?.id);
  if (threadIndex >= 0) {
    data.chatThreads[threadIndex] = {
      ...data.chatThreads[threadIndex],
      updatedAt: createdAt,
    };
  }

  await writePlannerData(data);
  return { ok: true as const, threadId: thread.id };
}

export async function createGalleryEntry(input: {
  title: string;
  pieceKey: string;
  version: string;
  category: GalleryCategory;
  stage: GalleryStage;
  status: GalleryStatus;
  description: string;
  imageUrl: string;
  responsibleUserId: string;
  createdByUserId: string;
}) {
  const data = await readPlannerData();
  const imageUrl = safeAvatarUrl(input.imageUrl);
  if (!imageUrl) {
    return { ok: false as const, error: "invalid_image" as const };
  }

  const ownerFallback = data.users[0]?.id || "user_owner";
  const validOwner = data.users.some((user) => user.id === input.responsibleUserId)
    ? input.responsibleUserId
    : ownerFallback;
  const validCreator = data.users.some((user) => user.id === input.createdByUserId)
    ? input.createdByUserId
    : ownerFallback;
  const createdAt = nowIso();

  const entry: GalleryEntry = {
    id: randomUUID(),
    title: input.title.trim() || "Pieza sin titulo",
    pieceKey: input.pieceKey.trim() || "General",
    version: input.version.trim() || "v1",
    category: normalizeGalleryCategory(input.category),
    stage: normalizeGalleryStage(input.stage),
    status: normalizeGalleryStatus(input.status),
    description: input.description.trim(),
    imageUrl,
    responsibleUserId: validOwner,
    createdByUserId: validCreator,
    createdAt,
    updatedAt: createdAt,
  };

  data.galleryEntries.unshift(entry);
  await writePlannerData(data);
  return { ok: true as const, entry };
}

export async function updateGalleryEntryWorkflow(input: {
  entryId: string;
  stage: GalleryStage;
  status: GalleryStatus;
}) {
  const data = await readPlannerData();
  const index = data.galleryEntries.findIndex((entry) => entry.id === input.entryId);
  if (index === -1) {
    return { ok: false as const, error: "not_found" as const };
  }

  data.galleryEntries[index] = {
    ...data.galleryEntries[index],
    stage: normalizeGalleryStage(input.stage),
    status: normalizeGalleryStatus(input.status),
    updatedAt: nowIso(),
  };

  await writePlannerData(data);
  return { ok: true as const, entry: data.galleryEntries[index] };
}

export async function addGalleryEntryComment(input: {
  entryId: string;
  userId: string;
  text: string;
}) {
  const data = await readPlannerData();
  const entry = data.galleryEntries.find((item) => item.id === input.entryId);
  if (!entry) return { ok: false as const, error: "not_found" as const };
  const user = data.users.find((item) => item.id === input.userId);
  if (!user) return { ok: false as const, error: "forbidden" as const };

  const text = String(input.text || "").trim();
  if (!text) return { ok: false as const, error: "empty_message" as const };

  const comment: GalleryComment = {
    id: randomUUID(),
    entryId: entry.id,
    userId: user.id,
    text,
    createdAt: nowIso(),
  };

  data.galleryComments.push(comment);
  entry.updatedAt = comment.createdAt;
  await writePlannerData(data);
  return { ok: true as const, comment };
}

export async function deleteGalleryEntry(input: {
  entryId: string;
  actorId: string;
  actorRole: PlannerRole;
}) {
  const data = await readPlannerData();
  const index = data.galleryEntries.findIndex((entry) => entry.id === input.entryId);
  if (index === -1) {
    return { ok: false as const, error: "not_found" as const };
  }

  const target = data.galleryEntries[index];
  const canDelete =
    target.createdByUserId === input.actorId || canManageUsers(input.actorRole);
  if (!canDelete) {
    return { ok: false as const, error: "not_uploader" as const };
  }

  data.galleryEntries.splice(index, 1);
  data.galleryComments = data.galleryComments.filter(
    (comment) => comment.entryId !== target.id,
  );
  await writePlannerData(data);
  return { ok: true as const };
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  jobTitle: string;
  phone: string;
  bio: string;
  avatarDataUrl?: string;
  role: PlannerRole;
  projectRole: ProjectRole;
  actorRole: PlannerRole;
}) {
  if (!canManageUsers(input.actorRole)) {
    return { ok: false as const, error: "forbidden" };
  }

  if (input.role !== "Member") {
    return { ok: false as const, error: "invalid_role" };
  }

  const data = await readPlannerData();
  const email = input.email.trim().toLowerCase();

  if (data.users.some((user) => user.email.toLowerCase() === email)) {
    return { ok: false as const, error: "email_exists" };
  }

  const user: PlannerUser = {
    id: randomUUID(),
    name: input.name.trim(),
    email,
    password: await hashPassword(input.password),
    mustChangePassword: true,
    role: "Member",
    projectRole: normalizeProjectRole(input.projectRole, "Member"),
    status: "Active",
    jobTitle:
      input.jobTitle.trim() || projectRoleLabel[normalizeProjectRole(input.projectRole, "Member")],
    phone: input.phone.trim(),
    bio: input.bio.trim(),
    avatarDataUrl: safeAvatarUrl(input.avatarDataUrl),
    createdAt: nowIso(),
  };

  data.users.push(user);
  const groupThread = getGroupChatThread(data);
  if (!groupThread.memberIds.includes(user.id)) {
    groupThread.memberIds.push(user.id);
    groupThread.updatedAt = nowIso();
  }
  await writePlannerData(data);

  return { ok: true as const, user };
}

export async function updateUserByManager(input: {
  actorRole: PlannerRole;
  targetUserId: string;
  name: string;
  email: string;
  password: string;
  projectRole: ProjectRole;
  jobTitle: string;
  phone: string;
  bio: string;
  avatarDataUrl?: string | null;
  status: UserStatus;
}) {
  if (!canManageUsers(input.actorRole)) {
    return { ok: false as const, error: "forbidden" };
  }

  const data = await readPlannerData();
  const index = data.users.findIndex((user) => user.id === input.targetUserId);
  if (index === -1) return { ok: false as const, error: "not_found" };

  const target = data.users[index];
  if (isProtectedRole(target.role)) {
    return { ok: false as const, error: "protected_role" };
  }

  const email = input.email.trim().toLowerCase();
  const duplicated = data.users.some(
    (user, userIndex) => userIndex !== index && user.email.toLowerCase() === email,
  );

  if (duplicated) {
    return { ok: false as const, error: "email_exists" };
  }

  data.users[index] = {
    ...target,
    name: input.name.trim() || target.name,
    email,
    password: input.password.trim()
      ? await hashPassword(input.password.trim())
      : target.password,
    mustChangePassword: input.password.trim() ? true : target.mustChangePassword,
    projectRole: normalizeProjectRole(input.projectRole, target.role),
    jobTitle: input.jobTitle.trim() || target.jobTitle,
    phone: input.phone.trim(),
    bio: input.bio.trim(),
    avatarDataUrl:
      input.avatarDataUrl === undefined
        ? target.avatarDataUrl
        : safeAvatarUrl(input.avatarDataUrl),
    status: input.status,
  };

  await writePlannerData(data);
  return { ok: true as const, user: data.users[index] };
}

export async function deleteUser(input: {
  actorRole: PlannerRole;
  actorId: string;
  targetUserId: string;
}) {
  if (!canManageUsers(input.actorRole)) {
    return { ok: false as const, error: "forbidden" };
  }

  if (input.actorId === input.targetUserId) {
    return { ok: false as const, error: "cannot_delete_self" };
  }

  const data = await readPlannerData();
  const targetIndex = data.users.findIndex((user) => user.id === input.targetUserId);
  if (targetIndex === -1) return { ok: false as const, error: "not_found" };

  const target = data.users[targetIndex];
  if (isProtectedRole(target.role)) {
    return { ok: false as const, error: "protected_role" };
  }

  data.projects = data.projects.map((project) =>
    project.ownerId === target.id ? { ...project, ownerId: input.actorId, updatedAt: nowIso() } : project,
  );

  data.tasks = data.tasks.map((task) =>
    task.assigneeId === target.id ? { ...task, assigneeId: input.actorId, updatedAt: nowIso() } : task,
  );

  data.goals = data.goals.map((goal) =>
    goal.ownerId === target.id ? { ...goal, ownerId: input.actorId, updatedAt: nowIso() } : goal,
  );

  data.processSteps = data.processSteps.map((step) =>
    step.ownerId === target.id ? { ...step, ownerId: input.actorId, updatedAt: nowIso() } : step,
  );

  data.decisions = data.decisions.map((decision) =>
    decision.ownerId === target.id ? { ...decision, ownerId: input.actorId } : decision,
  );

  data.weeklyReviews = data.weeklyReviews.map((review) =>
    review.ownerId === target.id ? { ...review, ownerId: input.actorId } : review,
  );

  data.meetings = data.meetings.map((meeting) =>
    meeting.ownerId === target.id
      ? {
          ...meeting,
          ownerId: input.actorId,
          attendees: meeting.attendees.filter((attendee) => attendee.toLowerCase() !== target.name.toLowerCase()),
          updatedAt: nowIso(),
        }
      : meeting,
  );

  data.galleryEntries = data.galleryEntries.map((entry) => {
    const needsOwnerSwap =
      entry.responsibleUserId === target.id || entry.createdByUserId === target.id;
    if (!needsOwnerSwap) return entry;
    return {
      ...entry,
      responsibleUserId:
        entry.responsibleUserId === target.id ? input.actorId : entry.responsibleUserId,
      createdByUserId:
        entry.createdByUserId === target.id ? input.actorId : entry.createdByUserId,
      updatedAt: nowIso(),
    };
  });

  data.galleryComments = data.galleryComments.map((comment) =>
    comment.userId === target.id ? { ...comment, userId: input.actorId } : comment,
  );

  data.notifications = data.notifications.filter((notification) => notification.userId !== target.id);

  data.chatThreads = data.chatThreads
    .map((thread) => ({
      ...thread,
      memberIds: thread.memberIds.filter((memberId) => memberId !== target.id),
      updatedAt: nowIso(),
    }))
    .filter((thread) => thread.kind === "Group" || thread.memberIds.length >= 2);

  const validThreadIds = new Set(data.chatThreads.map((thread) => thread.id));
  data.chatMessages = data.chatMessages.filter(
    (message) => validThreadIds.has(message.threadId) && message.senderId !== target.id,
  );
  data.chatReadStates = data.chatReadStates.filter(
    (state) => state.userId !== target.id && validThreadIds.has(state.threadId),
  );
  data.userPresence = data.userPresence.filter((entry) => entry.userId !== target.id);

  data.users.splice(targetIndex, 1);
  await writePlannerData(data);
  return { ok: true as const };
}

export async function updateOwnProfile(input: {
  userId: string;
  name: string;
  email: string;
  password: string;
  requirePasswordChange?: boolean;
  jobTitle: string;
  phone: string;
  bio: string;
  avatarDataUrl?: string | null;
}) {
  const data = await readPlannerData();
  const index = data.users.findIndex((user) => user.id === input.userId);
  if (index === -1) return { ok: false as const, error: "not_found" };

  const email = input.email.trim().toLowerCase();
  const duplicated = data.users.some(
    (user, userIndex) => userIndex !== index && user.email.toLowerCase() === email,
  );

  if (duplicated) {
    return { ok: false as const, error: "email_exists" };
  }

  const passwordInput = input.password.trim();
  if (input.requirePasswordChange && !passwordInput) {
    return { ok: false as const, error: "password_required" };
  }

  const current = data.users[index];
  data.users[index] = {
    ...current,
    name: input.name.trim() || current.name,
    email,
    password: passwordInput
      ? await hashPassword(passwordInput)
      : current.password,
    mustChangePassword: passwordInput ? false : current.mustChangePassword,
    jobTitle: input.jobTitle.trim() || current.jobTitle,
    phone: input.phone.trim(),
    bio: input.bio.trim(),
    avatarDataUrl:
      input.avatarDataUrl === undefined
        ? current.avatarDataUrl
        : safeAvatarUrl(input.avatarDataUrl),
  };

  await writePlannerData(data);
  return { ok: true as const, user: data.users[index] };
}
