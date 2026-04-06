import {
  createUserAction,
  deleteUserAction,
  updateUserAction,
} from "@/app/(planner)/actions";
import { DeleteConfirmForm } from "@/components/delete-confirm-form";
import { PlannerPage, SaveMessage } from "@/components/planner-page";
import { Badge, EmptyState, SectionCard } from "@/components/ui";
import { requireSessionUser } from "@/lib/auth";
import {
  canManageUsers,
  getPlannerSnapshot,
  isProtectedRole,
  projectRoleLabel,
  projectRoles,
} from "@/lib/data-store";
import { dateFormat, roleLabel, toneForRole } from "@/lib/planner-view";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function strParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const currentUser = await requireSessionUser();
  if (!canManageUsers(currentUser.role)) redirect("/dashboard");

  const params = await searchParams;
  const saved = strParam(params.saved);
  const error = strParam(params.error);
  const snapshot = await getPlannerSnapshot();

  return (
    <PlannerPage
      title="Equipo"
      description="Solo la cuenta administradora puede crear, editar y eliminar usuarios de acceso."
    >
      <SaveMessage saved={saved} error={error} />

      <SectionCard title="Nuevo usuario" subtitle="Alta rapida de personas con acceso al proyecto.">
        <details className="fold-card">
          <summary>Abrir formulario</summary>
          <form action={createUserAction} className="form-grid" encType="multipart/form-data">
            <input type="hidden" name="returnTo" value="/users" />
            <input type="hidden" name="role" value="Member" />

            <label>
              Nombre
              <input name="name" required placeholder="Nombre del miembro" />
            </label>
            <label>
              Email
              <input type="email" name="email" required placeholder="miembro@empresa.com" />
            </label>
            <label>
              Clave inicial
              <input type="text" name="password" required defaultValue="flora123" />
            </label>
            <label>
              Rol del proyecto
              <select name="projectRole" defaultValue="Observer">
                {projectRoles.map((projectRole) => (
                  <option key={projectRole} value={projectRole}>
                    {projectRoleLabel[projectRole]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Cargo
              <input name="jobTitle" placeholder="Ej: Ejecutiva comercial" />
            </label>
            <label>
              Telefono
              <input name="phone" placeholder="+57 300 000 0000" />
            </label>
            <label>
              Foto
              <input name="avatar" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
            </label>
            <label>
              Biografia
              <textarea name="bio" rows={3} placeholder="Contexto interno del miembro." />
            </label>
            <button className="btn btn-primary" type="submit">
              Crear usuario
            </button>
          </form>
        </details>
      </SectionCard>

      <SectionCard title="Usuarios activos" subtitle="Gestion de datos y estado por usuario.">
        {snapshot.users.length === 0 ? (
          <EmptyState title="Sin usuarios" detail="Crea el primer usuario." />
        ) : (
          <div className="stack-list users-list-grid">
            {snapshot.users.map((user) => {
              const protectedAccount = isProtectedRole(user.role);
              const initials = user.name
                .split(" ")
                .map((part) => part[0] || "")
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <article key={user.id} className="list-row compact">
                  <div className="list-row-head">
                    <div className="user-card-head">
                      {user.avatarDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.avatarDataUrl} alt={`Foto de ${user.name}`} className="user-avatar" />
                      ) : (
                        <div className="user-avatar user-avatar-fallback">{initials || "FP"}</div>
                      )}
                      <div>
                        <p className="list-title">{user.name}</p>
                        <p className="list-subtitle">{user.jobTitle || "Sin cargo"}</p>
                        <p className="list-subtitle">{user.email}</p>
                      </div>
                    </div>
                    <div className="badge-row">
                      <Badge tone={toneForRole(user.role)}>{roleLabel[user.role]}</Badge>
                      <Badge tone="accent">{projectRoleLabel[user.projectRole]}</Badge>
                      <Badge tone={user.status === "Active" ? "ok" : "critical"}>{user.status}</Badge>
                      {user.mustChangePassword ? <Badge tone="warning">Debe cambiar clave</Badge> : null}
                      {protectedAccount ? <Badge tone="warning">Protegido</Badge> : null}
                    </div>
                  </div>

                  <p className="list-subtitle">Telefono: {user.phone || "Sin telefono"} · Creado: {dateFormat(user.createdAt)}</p>
                  <p className="list-subtitle">{user.bio || "Sin biografia."}</p>

                  {protectedAccount ? (
                    <p className="list-subtitle">Cuenta administradora protegida: no editable desde gestion.</p>
                  ) : (
                    <div className="actions-row">
                      <form action={updateUserAction} className="form-grid" encType="multipart/form-data">
                        <input type="hidden" name="returnTo" value="/users" />
                        <input type="hidden" name="targetUserId" value={user.id} />
                        <label>
                          Nombre
                          <input name="name" defaultValue={user.name} required />
                        </label>
                        <label>
                          Email
                          <input name="email" type="email" defaultValue={user.email} required />
                        </label>
                        <label>
                          Rol del proyecto
                          <select name="projectRole" defaultValue={user.projectRole}>
                            {projectRoles.map((projectRole) => (
                              <option key={projectRole} value={projectRole}>
                                {projectRoleLabel[projectRole]}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Cargo
                          <input name="jobTitle" defaultValue={user.jobTitle} />
                        </label>
                        <label>
                          Telefono
                          <input name="phone" defaultValue={user.phone} />
                        </label>
                        <label>
                          Foto
                          <input name="avatar" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
                        </label>
                        <label className="checkbox-line">
                          <input name="removeAvatar" type="checkbox" />
                          Quitar foto
                        </label>
                        <label>
                          Biografia
                          <textarea name="bio" rows={3} defaultValue={user.bio} />
                        </label>
                        <label>
                          Clave (opcional)
                          <input name="password" placeholder="Deja vacio para mantener" />
                        </label>
                        <label>
                          Estado
                          <select name="status" defaultValue={user.status}>
                            <option value="Active">Activo</option>
                            <option value="Disabled">Deshabilitado</option>
                          </select>
                        </label>
                        <button className="btn btn-ghost" type="submit">
                          Guardar cambios
                        </button>
                      </form>

                      <DeleteConfirmForm
                        action={deleteUserAction}
                        hiddenInputs={[
                          { name: "returnTo", value: "/users" },
                          { name: "targetUserId", value: user.id },
                        ]}
                        triggerLabel="Eliminar usuario"
                        title="Confirmar eliminacion"
                        description="Esta accion eliminara este usuario del equipo de forma permanente."
                        impact="Sus elementos activos se reasignaran al usuario que ejecuta la accion."
                      />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </SectionCard>
    </PlannerPage>
  );
}
