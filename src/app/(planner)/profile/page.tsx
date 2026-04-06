import { updateProfileAction } from "@/app/(planner)/actions";
import { PlannerPage, SaveMessage } from "@/components/planner-page";
import { SectionCard } from "@/components/ui";
import { requireSessionUser } from "@/lib/auth";
import { dateFormat, roleLabel } from "@/lib/planner-view";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function strParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function ProfilePage({ searchParams }: PageProps) {
  const user = await requireSessionUser();
  const params = await searchParams;
  const saved = strParam(params.saved);
  const error = strParam(params.error);
  const initials = user.name
    .split(" ")
    .map((part) => part[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <PlannerPage
      title="Perfil"
      description="Ajusta tus datos personales para acceso y notificaciones del equipo."
    >
      <SaveMessage saved={saved} error={error} />

      <SectionCard title="Resumen de cuenta" subtitle="Vista rapida de tus datos actuales.">
        <article className="profile-identity-card">
          {user.avatarDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarDataUrl} alt={`Foto de ${user.name}`} className="profile-avatar" />
          ) : (
            <div className="profile-avatar profile-avatar-fallback">{initials || "FP"}</div>
          )}

          <div className="profile-identity-meta">
            <p className="list-title">{user.name}</p>
            <p className="list-subtitle">{user.jobTitle || "Sin cargo definido"}</p>
            <p className="list-subtitle">{user.email}</p>
            <p className="list-subtitle">Rol: {roleLabel[user.role]}</p>
            <p className="list-subtitle">Telefono: {user.phone || "Sin telefono"}</p>
            <p className="list-subtitle">Creado: {dateFormat(user.createdAt)}</p>
            <p className="list-subtitle">{user.bio || "Sin biografia cargada."}</p>
          </div>
        </article>
      </SectionCard>

      <SectionCard title="Tu cuenta" subtitle="Puedes cambiar nombre, correo y clave.">
        <form action={updateProfileAction} className="form-grid" encType="multipart/form-data">
          <input type="hidden" name="returnTo" value="/profile" />

          <label>
            Rol
            <input value={roleLabel[user.role]} readOnly disabled />
          </label>
          <label>
            Nombre
            <input name="name" defaultValue={user.name} required />
          </label>
          <label>
            Email
            <input name="email" type="email" defaultValue={user.email} required />
          </label>
          <label>
            Cargo
            <input name="jobTitle" defaultValue={user.jobTitle} placeholder="Ej: Lider de operaciones" />
          </label>
          <label>
            Telefono
            <input name="phone" defaultValue={user.phone} placeholder="+57 300 000 0000" />
          </label>
          <label>
            Foto
            <input name="avatar" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
          </label>
          <label className="checkbox-line">
            <input name="removeAvatar" type="checkbox" />
            Quitar foto actual
          </label>
          <label>
            Biografia
            <textarea name="bio" rows={3} defaultValue={user.bio} placeholder="Resumen del rol y responsabilidades." />
          </label>
          <label>
            Nueva clave (opcional)
            <input name="password" type="text" placeholder="Deja vacio para mantener" />
          </label>

          <button className="btn btn-primary" type="submit">
            Guardar perfil
          </button>
        </form>
      </SectionCard>
    </PlannerPage>
  );
}
