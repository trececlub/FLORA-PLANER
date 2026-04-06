"use server";

import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { put } from "@vercel/blob";
import { clearSession, createSession, requireSessionUser } from "@/lib/auth";
import {
  addGalleryEntryComment,
  createGalleryEntry,
  deleteGalleryEntry,
  createDecision,
  createDoc,
  createGoal,
  createMeeting,
  createProcessStep,
  createProject,
  createTask,
  createUser,
  markAllNotificationsAsRead,
  getPermissionsForUser,
  sendChatMessage,
  deleteAllWeeklyReviews,
  deleteDecision,
  deleteDoc,
  deleteGoal,
  deleteMeeting,
  deleteProcessStep,
  deleteProject,
  deleteTask,
  deleteUser,
  updateGoalProgress,
  updateMeetingStatus,
  updateOwnProfile,
  updateProcessStepStatus,
  updateProjectProgress,
  updateTaskStatus,
  updateUserByManager,
  updateGalleryEntryWorkflow,
  type GalleryCategory,
  type GalleryStage,
  type GalleryStatus,
  type MeetingKind,
  type MeetingStatus,
  type PlannerRole,
  type ProjectRole,
  type ProcessStepStatus,
  type ProjectPriority,
  type ProjectStatus,
  type TaskPriority,
  type TaskStatus,
  type UserStatus,
} from "@/lib/data-store";

function normalizePath(pathname: FormDataEntryValue | null, fallback: string) {
  const value = String(pathname || "").trim();
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  return value;
}

function parsePercent(value: FormDataEntryValue | null) {
  const parsed = Number.parseInt(String(value || "0"), 10);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, parsed));
}

function parseProjectStage(value: FormDataEntryValue | null) {
  const raw = String(value || "").trim();
  const [projectId = "", stageId = ""] = raw.split("::");
  return {
    projectId: projectId.trim(),
    stageId: stageId.trim(),
  };
}

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_GALLERY_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_AVATAR_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

function fileExtensionFromAvatar(file: File) {
  const mimeType = String(file.type || "").trim().toLowerCase();
  const extensionFromType =
    mimeType === "image/png"
      ? "png"
      : mimeType === "image/jpeg"
        ? "jpg"
        : mimeType === "image/webp"
          ? "webp"
          : mimeType === "image/gif"
            ? "gif"
            : "";
  if (extensionFromType) return extensionFromType;

  const rawName = String(file.name || "");
  const nameExtension = rawName.includes(".") ? rawName.split(".").pop() : "";
  const normalized = String(nameExtension || "").trim().toLowerCase();
  return normalized || "png";
}

async function parseImagePayload(
  formData: FormData,
  options: {
    fieldName: string;
    uploadFolder: string;
    maxBytes: number;
    uploadErrorCode: "avatar_upload_failed" | "image_upload_failed";
    removeField?: string;
  },
) {
  const remove = options?.removeField
    ? String(formData.get(options.removeField) || "").trim() === "on"
    : false;

  if (remove) {
    return { ok: true as const, value: null as string | null | undefined };
  }

  const raw = formData.get(options.fieldName);
  if (!(raw instanceof File) || raw.size === 0) {
    return { ok: true as const, value: undefined as string | null | undefined };
  }

  const mimeType = String(raw.type || "").trim().toLowerCase();
  if (!ALLOWED_AVATAR_MIME_TYPES.has(mimeType)) {
    return { ok: false as const, error: "invalid_image" as const };
  }

  if (raw.size > options.maxBytes) {
    return { ok: false as const, error: "image_too_large" as const };
  }

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const extension = fileExtensionFromAvatar(raw);
      const path = `${options.uploadFolder}/${Date.now()}-${randomUUID()}.${extension}`;
      const uploaded = await put(path, raw, {
        access: "public",
        addRandomSuffix: false,
      });

      return {
        ok: true as const,
        value: uploaded.url,
      };
    } catch {
      return { ok: false as const, error: options.uploadErrorCode };
    }
  }

  const bytes = Buffer.from(await raw.arrayBuffer()).toString("base64");
  return {
    ok: true as const,
    value: `data:${raw.type};base64,${bytes}`,
  };
}

async function parseAvatarPayload(formData: FormData, options?: { removeField?: string }) {
  return parseImagePayload(formData, {
    fieldName: "avatar",
    uploadFolder: "avatars",
    maxBytes: MAX_AVATAR_SIZE_BYTES,
    uploadErrorCode: "avatar_upload_failed",
    removeField: options?.removeField,
  });
}

async function parseGalleryImagePayload(formData: FormData) {
  return parseImagePayload(formData, {
    fieldName: "image",
    uploadFolder: "gallery",
    maxBytes: MAX_GALLERY_IMAGE_SIZE_BYTES,
    uploadErrorCode: "image_upload_failed",
  });
}

function revalidatePlannerViews() {
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath("/tasks");
  revalidatePath("/goals");
  revalidatePath("/process");
  revalidatePath("/timeline");
  revalidatePath("/weekly");
  revalidatePath("/meetings");
  revalidatePath("/chat");
  revalidatePath("/notifications");
  revalidatePath("/gallery");
  revalidatePath("/users");
  revalidatePath("/profile");
}

function redirectWithResult(returnTo: string, saved: string, error?: string) {
  if (error) {
    redirect(`${returnTo}?error=${error}`);
  }
  redirect(`${returnTo}?saved=${saved}`);
}

function hasDeleteConfirmation(formData: FormData) {
  return String(formData.get("confirmDelete") || "").trim() === "on";
}

function assertPermission(allowed: boolean, returnTo: string) {
  if (!allowed) {
    redirectWithResult(returnTo, "permission", "forbidden");
  }
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function createProjectAction(formData: FormData) {
  const user = await requireSessionUser();
  const returnTo = normalizePath(formData.get("returnTo"), "/projects");
  const permissions = getPermissionsForUser(user);
  assertPermission(permissions.canManageProjects, returnTo);

  await createProject({
    name: String(formData.get("name") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    status: String(formData.get("status") || "Planned") as ProjectStatus,
    priority: String(formData.get("priority") || "Medium") as ProjectPriority,
    createdByUserId: user.id,
    createdByRole: user.role,
    ownerId: String(formData.get("ownerId") || user.id),
    startDate: String(formData.get("startDate") || "").trim(),
    dueDate: String(formData.get("dueDate") || "").trim(),
    tags: String(formData.get("tags") || "").trim(),
    stageNames: [
      String(formData.get("stage1") || "").trim(),
      String(formData.get("stage2") || "").trim(),
      String(formData.get("stage3") || "").trim(),
      String(formData.get("stage4") || "").trim(),
    ],
  });

  revalidatePlannerViews();
  redirectWithResult(returnTo, "project");
}

export async function updateProjectProgressAction(formData: FormData) {
  const user = await requireSessionUser();
  const returnTo = normalizePath(formData.get("returnTo"), "/projects");
  const permissions = getPermissionsForUser(user);
  assertPermission(permissions.canManageProjects, returnTo);

  await updateProjectProgress({
    projectId: String(formData.get("projectId") || "").trim(),
    status: String(formData.get("status") || "InProgress") as ProjectStatus,
  });

  revalidatePlannerViews();
  redirectWithResult(returnTo, "project_update");
}

export async function deleteProjectAction(formData: FormData) {
  const user = await requireSessionUser();
  const returnTo = normalizePath(formData.get("returnTo"), "/projects");
  const permissions = getPermissionsForUser(user);
  assertPermission(permissions.canManageProjects, returnTo);
  if (!hasDeleteConfirmation(formData)) {
    redirectWithResult(returnTo, "project_deleted", "confirm_required");
  }

  const result = await deleteProject({
    projectId: String(formData.get("projectId") || "").trim(),
    actorId: user.id,
  });
  revalidatePlannerViews();

  redirectWithResult(returnTo, "project_deleted", result.ok ? undefined : result.error);
}

export async function createTaskAction(formData: FormData) {
  const user = await requireSessionUser();
  const returnTo = normalizePath(formData.get("returnTo"), "/tasks");
  const permissions = getPermissionsForUser(user);
  assertPermission(permissions.canManageTasks, returnTo);
  const { projectId, stageId } = parseProjectStage(formData.get("projectStage"));

  await createTask({
    projectId,
    stageId,
    title: String(formData.get("title") || "").trim(),
    details: String(formData.get("details") || "").trim(),
    status: String(formData.get("status") || "Backlog") as TaskStatus,
    priority: String(formData.get("priority") || "Medium") as TaskPriority,
    assigneeId: String(formData.get("assigneeId") || user.id),
    createdByUserId: user.id,
    dueDate: String(formData.get("dueDate") || "").trim(),
  });

  revalidatePlannerViews();
  redirectWithResult(returnTo, "task");
}

export async function updateTaskStatusAction(formData: FormData) {
  const user = await requireSessionUser();
  const returnTo = normalizePath(formData.get("returnTo"), "/tasks");
  const permissions = getPermissionsForUser(user);
  assertPermission(permissions.canManageTasks, returnTo);

  await updateTaskStatus({
    taskId: String(formData.get("taskId") || "").trim(),
    status: String(formData.get("status") || "Backlog") as TaskStatus,
  });

  revalidatePlannerViews();
  redirectWithResult(returnTo, "task_update");
}

export async function deleteTaskAction(formData: FormData) {
  const user = await requireSessionUser();
  const returnTo = normalizePath(formData.get("returnTo"), "/tasks");
  const permissions = getPermissionsForUser(user);
  assertPermission(permissions.canManageTasks, returnTo);
  if (!hasDeleteConfirmation(formData)) {
    redirectWithResult(returnTo, "task_deleted", "confirm_required");
  }

  const result = await deleteTask(String(formData.get("taskId") || "").trim());
  revalidatePlannerViews();

  redirectWithResult(returnTo, "task_deleted", result.ok ? undefined : result.error);
}

export async function createGoalAction(formData: FormData) {
  const user = await requireSessionUser();
  const returnTo = normalizePath(formData.get("returnTo"), "/goals");
  const permissions = getPermissionsForUser(user);
  assertPermission(permissions.canManageProjects, returnTo);

  await createGoal({
    title: String(formData.get("title") || "").trim(),
    ownerId: String(formData.get("ownerId") || user.id),
    targetDate: String(formData.get("targetDate") || "").trim(),
    notes: String(formData.get("notes") || "").trim(),
  });

  revalidatePlannerViews();
  redirectWithResult(returnTo, "goal");
}

export async function updateGoalProgressAction(formData: FormData) {
  const user = await requireSessionUser();
  const returnTo = normalizePath(formData.get("returnTo"), "/goals");
  const permissions = getPermissionsForUser(user);
  assertPermission(permissions.canManageProjects, returnTo);

  await updateGoalProgress({
    goalId: String(formData.get("goalId") || "").trim(),
    progress: parsePercent(formData.get("progress")),
  });

  revalidatePlannerViews();
  redirectWithResult(returnTo, "goal_update");
}

export async function createProcessStepAction(formData: FormData) {
  const user = await requireSessionUser();
  const returnTo = normalizePath(formData.get("returnTo"), "/process");
  const permissions = getPermissionsForUser(user);
  assertPermission(permissions.canManageProcess, returnTo);

  await createProcessStep({
    phase: String(formData.get("phase") || "General").trim(),
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    ownerId: String(formData.get("ownerId") || user.id),
    targetDate: String(formData.get("targetDate") || "").trim(),
  });

  revalidatePlannerViews();
  redirectWithResult(returnTo, "step");
}

export async function updateProcessStepStatusAction(formData: FormData) {
  const user = await requireSessionUser();
  const returnTo = normalizePath(formData.get("returnTo"), "/process");
  const permissions = getPermissionsForUser(user);
  assertPermission(permissions.canManageProcess, returnTo);

  await updateProcessStepStatus({
    stepId: String(formData.get("stepId") || "").trim(),
    status: String(formData.get("status") || "Pending") as ProcessStepStatus,
  });

  revalidatePlannerViews();
  redirectWithResult(returnTo, "step_update");
}

export async function createDecisionAction(formData: FormData) {
  const user = await requireSessionUser();
  const returnTo = normalizePath(formData.get("returnTo"), "/process");
  const permissions = getPermissionsForUser(user);
  assertPermission(permissions.canManageProcess, returnTo);

  await createDecision({
    title: String(formData.get("title") || "").trim(),
    context: String(formData.get("context") || "").trim(),
    decision: String(formData.get("decision") || "").trim(),
    ownerId: user.id,
    date: String(formData.get("date") || "").trim(),
  });

  revalidatePlannerViews();
  redirectWithResult(returnTo, "decision");
}

export async function createDocAction(formData: FormData) {
  const user = await requireSessionUser();
  const returnTo = normalizePath(formData.get("returnTo"), "/process");
  const permissions = getPermissionsForUser(user);
  assertPermission(permissions.canManageProcess, returnTo);

  await createDoc({
    title: String(formData.get("title") || "").trim(),
    category: String(formData.get("category") || "General").trim(),
    url: String(formData.get("url") || "").trim(),
    notes: String(formData.get("notes") || "").trim(),
  });

  revalidatePlannerViews();
  redirectWithResult(returnTo, "doc");
}

export async function createWeeklyReviewAction(formData: FormData) {
  const user = await requireSessionUser();
  const returnTo = normalizePath(formData.get("returnTo"), "/weekly");
  const permissions = getPermissionsForUser(user);
  assertPermission(permissions.canManageProcess, returnTo);

  const { createWeeklyReview } = await import("@/lib/data-store");

  await createWeeklyReview({
    weekLabel: String(formData.get("weekLabel") || "").trim(),
    wins: String(formData.get("wins") || "").trim(),
    blockers: String(formData.get("blockers") || "").trim(),
    nextFocus: String(formData.get("nextFocus") || "").trim(),
    ownerId: user.id,
  });

  revalidatePlannerViews();
  redirectWithResult(returnTo, "review");
}

export async function deleteAllWeeklyReviewsAction(formData: FormData) {
  const user = await requireSessionUser();
  const returnTo = normalizePath(formData.get("returnTo"), "/weekly");
  const permissions = getPermissionsForUser(user);
  assertPermission(permissions.canManageProcess, returnTo);
  if (!hasDeleteConfirmation(formData)) {
    redirectWithResult(returnTo, "review_deleted", "confirm_required");
  }

  const result = await deleteAllWeeklyReviews({
    actorRole: user.role,
  });

  revalidatePlannerViews();
  redirectWithResult(returnTo, "review_deleted", result.ok ? undefined : result.error);
}

export async function createMeetingAction(formData: FormData) {
  const user = await requireSessionUser();
  const returnTo = normalizePath(formData.get("returnTo"), "/meetings");
  const permissions = getPermissionsForUser(user);
  assertPermission(permissions.canManageMeetings, returnTo);

  await createMeeting({
    title: String(formData.get("title") || "").trim(),
    kind: String(formData.get("kind") || "Client") as MeetingKind,
    date: String(formData.get("date") || "").trim(),
    startTime: String(formData.get("startTime") || "").trim(),
    endTime: String(formData.get("endTime") || "").trim(),
    attendeesCsv: String(formData.get("attendees") || "").trim(),
    notes: String(formData.get("notes") || "").trim(),
    ownerId: user.id,
  });

  revalidatePlannerViews();
  redirectWithResult(returnTo, "meeting");
}

export async function updateMeetingStatusAction(formData: FormData) {
  const user = await requireSessionUser();
  const returnTo = normalizePath(formData.get("returnTo"), "/meetings");
  const permissions = getPermissionsForUser(user);
  assertPermission(permissions.canManageMeetings, returnTo);

  await updateMeetingStatus({
    meetingId: String(formData.get("meetingId") || "").trim(),
    status: String(formData.get("status") || "Scheduled") as MeetingStatus,
  });

  revalidatePlannerViews();
  redirectWithResult(returnTo, "meeting_update");
}

export async function deleteMeetingAction(formData: FormData) {
  const user = await requireSessionUser();
  const returnTo = normalizePath(formData.get("returnTo"), "/meetings");
  const permissions = getPermissionsForUser(user);
  assertPermission(permissions.canManageMeetings, returnTo);

  const result = await deleteMeeting(String(formData.get("meetingId") || "").trim());
  revalidatePlannerViews();

  redirectWithResult(returnTo, "meeting_deleted", result.ok ? undefined : result.error);
}

export async function createGalleryEntryAction(formData: FormData) {
  const user = await requireSessionUser();
  const returnTo = normalizePath(formData.get("returnTo"), "/gallery");
  const permissions = getPermissionsForUser(user);
  assertPermission(permissions.canUploadGallery, returnTo);
  const image = await parseGalleryImagePayload(formData);
  if (!image.ok) {
    redirectWithResult(returnTo, "gallery_entry", image.error);
  }

  const fallbackImageUrl = String(formData.get("imageUrl") || "").trim();
  const result = await createGalleryEntry({
    title: String(formData.get("title") || "").trim(),
    pieceKey: String(formData.get("pieceKey") || "").trim(),
    version: String(formData.get("version") || "").trim(),
    category: String(formData.get("category") || "Otro") as GalleryCategory,
    stage: String(formData.get("stage") || "Investigacion") as GalleryStage,
    status: String(formData.get("status") || "Pending") as GalleryStatus,
    description: String(formData.get("description") || "").trim(),
    imageUrl: image.value || fallbackImageUrl,
    responsibleUserId: String(formData.get("responsibleUserId") || user.id).trim(),
    createdByUserId: user.id,
  });

  revalidatePlannerViews();
  redirectWithResult(returnTo, "gallery_entry", result.ok ? undefined : result.error);
}

export async function updateGalleryWorkflowAction(formData: FormData) {
  const user = await requireSessionUser();
  const returnTo = normalizePath(formData.get("returnTo"), "/gallery");
  const permissions = getPermissionsForUser(user);
  assertPermission(
    permissions.canUpdateGalleryWorkflow || permissions.canApproveGallery,
    returnTo,
  );

  const result = await updateGalleryEntryWorkflow({
    entryId: String(formData.get("entryId") || "").trim(),
    stage: String(formData.get("stage") || "Investigacion") as GalleryStage,
    status: String(formData.get("status") || "Pending") as GalleryStatus,
  });

  revalidatePlannerViews();
  redirectWithResult(returnTo, "gallery_update", result.ok ? undefined : result.error);
}

export async function addGalleryCommentAction(formData: FormData) {
  const user = await requireSessionUser();
  const returnTo = normalizePath(formData.get("returnTo"), "/gallery");
  const permissions = getPermissionsForUser(user);
  assertPermission(permissions.canCommentGallery, returnTo);

  const result = await addGalleryEntryComment({
    entryId: String(formData.get("entryId") || "").trim(),
    userId: user.id,
    text: String(formData.get("text") || "").trim(),
  });

  revalidatePlannerViews();
  redirectWithResult(returnTo, "gallery_comment", result.ok ? undefined : result.error);
}

export async function deleteGalleryEntryAction(formData: FormData) {
  const user = await requireSessionUser();
  const returnTo = normalizePath(formData.get("returnTo"), "/gallery");
  if (!hasDeleteConfirmation(formData)) {
    redirectWithResult(returnTo, "gallery_deleted", "confirm_required");
  }

  const result = await deleteGalleryEntry({
    entryId: String(formData.get("entryId") || "").trim(),
    actorId: user.id,
    actorRole: user.role,
  });

  revalidatePlannerViews();
  redirectWithResult(returnTo, "gallery_deleted", result.ok ? undefined : result.error);
}

export async function createUserAction(formData: FormData) {
  const user = await requireSessionUser();
  const returnTo = normalizePath(formData.get("returnTo"), "/users");
  const permissions = getPermissionsForUser(user);
  assertPermission(permissions.canManageUsers, returnTo);
  const avatar = await parseAvatarPayload(formData);
  if (!avatar.ok) {
    redirectWithResult(returnTo, "user", avatar.error);
  }

  const result = await createUser({
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    password: String(formData.get("password") || "").trim(),
    jobTitle: String(formData.get("jobTitle") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    bio: String(formData.get("bio") || "").trim(),
    avatarDataUrl: avatar.value || "",
    role: String(formData.get("role") || "Member") as PlannerRole,
    projectRole: String(formData.get("projectRole") || "Observer") as ProjectRole,
    actorRole: user.role,
  });

  revalidatePlannerViews();
  redirectWithResult(returnTo, "user", result.ok ? undefined : result.error);
}

export async function updateUserAction(formData: FormData) {
  const user = await requireSessionUser();
  const returnTo = normalizePath(formData.get("returnTo"), "/users");
  const permissions = getPermissionsForUser(user);
  assertPermission(permissions.canManageUsers, returnTo);
  const avatar = await parseAvatarPayload(formData, { removeField: "removeAvatar" });
  if (!avatar.ok) {
    redirectWithResult(returnTo, "user_update", avatar.error);
  }

  const result = await updateUserByManager({
    actorRole: user.role,
    targetUserId: String(formData.get("targetUserId") || "").trim(),
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    password: String(formData.get("password") || "").trim(),
    projectRole: String(formData.get("projectRole") || "Observer") as ProjectRole,
    jobTitle: String(formData.get("jobTitle") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    bio: String(formData.get("bio") || "").trim(),
    avatarDataUrl: avatar.value,
    status: String(formData.get("status") || "Active") as UserStatus,
  });

  revalidatePlannerViews();
  redirectWithResult(returnTo, "user_update", result.ok ? undefined : result.error);
}

export async function deleteUserAction(formData: FormData) {
  const user = await requireSessionUser();
  const returnTo = normalizePath(formData.get("returnTo"), "/users");
  const permissions = getPermissionsForUser(user);
  assertPermission(permissions.canManageUsers, returnTo);
  if (!hasDeleteConfirmation(formData)) {
    redirectWithResult(returnTo, "user_deleted", "confirm_required");
  }

  const result = await deleteUser({
    actorRole: user.role,
    actorId: user.id,
    targetUserId: String(formData.get("targetUserId") || "").trim(),
  });

  revalidatePlannerViews();
  redirectWithResult(returnTo, "user_deleted", result.ok ? undefined : result.error);
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireSessionUser();
  const returnTo = normalizePath(formData.get("returnTo"), "/profile");
  const avatar = await parseAvatarPayload(formData, { removeField: "removeAvatar" });
  if (!avatar.ok) {
    redirectWithResult(returnTo, "profile", avatar.error);
  }

  const result = await updateOwnProfile({
    userId: user.id,
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    password: String(formData.get("password") || "").trim(),
    requirePasswordChange: user.mustChangePassword,
    jobTitle: String(formData.get("jobTitle") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    bio: String(formData.get("bio") || "").trim(),
    avatarDataUrl: avatar.value,
  });

  revalidatePlannerViews();
  if (result.ok) {
    await createSession(result.user);
  }
  redirectWithResult(returnTo, "profile", result.ok ? undefined : result.error);
}

export async function markNotificationsReadAction(formData: FormData) {
  const user = await requireSessionUser();
  const returnTo = normalizePath(formData.get("returnTo"), "/notifications");
  const permissions = getPermissionsForUser(user);
  assertPermission(permissions.canViewDashboard, returnTo);
  const result = await markAllNotificationsAsRead(user.id);
  revalidatePlannerViews();
  redirectWithResult(returnTo, "notifications", result.ok ? undefined : result.error);
}

export async function deleteGoalAction(formData: FormData) {
  const user = await requireSessionUser();
  const returnTo = normalizePath(formData.get("returnTo"), "/goals");
  const permissions = getPermissionsForUser(user);
  assertPermission(permissions.canManageProjects, returnTo);
  if (!hasDeleteConfirmation(formData)) {
    redirectWithResult(returnTo, "goal_deleted", "confirm_required");
  }

  const result = await deleteGoal(String(formData.get("goalId") || "").trim());
  revalidatePlannerViews();
  redirectWithResult(returnTo, "goal_deleted", result.ok ? undefined : result.error);
}

export async function deleteProcessStepAction(formData: FormData) {
  const user = await requireSessionUser();
  const returnTo = normalizePath(formData.get("returnTo"), "/process");
  const permissions = getPermissionsForUser(user);
  assertPermission(permissions.canManageProcess, returnTo);
  if (!hasDeleteConfirmation(formData)) {
    redirectWithResult(returnTo, "step_deleted", "confirm_required");
  }

  const result = await deleteProcessStep(String(formData.get("stepId") || "").trim());
  revalidatePlannerViews();
  redirectWithResult(returnTo, "step_deleted", result.ok ? undefined : result.error);
}

export async function deleteDecisionAction(formData: FormData) {
  const user = await requireSessionUser();
  const returnTo = normalizePath(formData.get("returnTo"), "/process");
  const permissions = getPermissionsForUser(user);
  assertPermission(permissions.canManageProcess, returnTo);

  const result = await deleteDecision(String(formData.get("decisionId") || "").trim());
  revalidatePlannerViews();
  redirectWithResult(returnTo, "decision_deleted", result.ok ? undefined : result.error);
}

export async function deleteDocAction(formData: FormData) {
  const user = await requireSessionUser();
  const returnTo = normalizePath(formData.get("returnTo"), "/process");
  const permissions = getPermissionsForUser(user);
  assertPermission(permissions.canManageProcess, returnTo);

  const result = await deleteDoc(String(formData.get("docId") || "").trim());
  revalidatePlannerViews();
  redirectWithResult(returnTo, "doc_deleted", result.ok ? undefined : result.error);
}

export async function sendChatMessageAction(formData: FormData) {
  const user = await requireSessionUser();
  const returnTo = normalizePath(formData.get("returnTo"), "/chat");
  const permissions = getPermissionsForUser(user);
  assertPermission(permissions.canUseChat, returnTo);
  const mode = String(formData.get("mode") || "group").trim().toLowerCase();

  const result = await sendChatMessage({
    senderId: user.id,
    text: String(formData.get("text") || "").trim(),
    mode: mode === "direct" ? "direct" : mode === "thread" ? "thread" : "group",
    targetUserId: String(formData.get("targetUserId") || "").trim(),
    threadId: String(formData.get("threadId") || "").trim(),
  });

  revalidatePlannerViews();

  if (!result.ok) {
    redirectWithResult(returnTo, "chat", result.error);
  }

  const chatKey = String(formData.get("chatKey") || "").trim();
  const normalizedChatKey = chatKey || result.threadId || "";
  const suffix = normalizedChatKey ? `?chat=${encodeURIComponent(normalizedChatKey)}&saved=chat` : "?saved=chat";
  redirect(`${returnTo}${suffix}`);
}
