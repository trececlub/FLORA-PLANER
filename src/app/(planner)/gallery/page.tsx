import {
  addGalleryCommentAction,
  createGalleryEntryAction,
  updateGalleryWorkflowAction,
} from "@/app/(planner)/actions";
import { PlannerPage, SaveMessage } from "@/components/planner-page";
import { Badge, EmptyState, SectionCard } from "@/components/ui";
import { requireSessionUser } from "@/lib/auth";
import {
  getPlannerSnapshot,
  type GalleryCategory,
  type GalleryStage,
  type GalleryStatus,
} from "@/lib/data-store";
import { dateFormat, toneForRole, type Tone } from "@/lib/planner-view";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function strParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value || "";
}

const categoryOptions: Array<{ value: GalleryCategory; label: string }> = [
  { value: "Logo", label: "Logo" },
  { value: "Paleta", label: "Paleta" },
  { value: "Packaging", label: "Packaging" },
  { value: "Interior", label: "Interior" },
  { value: "Redes", label: "Redes" },
  { value: "IdeaCliente", label: "Ideas del cliente" },
  { value: "Otro", label: "Otro" },
];

const stageOptions: Array<{ value: GalleryStage; label: string }> = [
  { value: "Investigacion", label: "Investigacion" },
  { value: "Bocetos", label: "Bocetos" },
  { value: "Propuesta", label: "Propuesta" },
  { value: "Ajustes", label: "Ajustes" },
  { value: "Final", label: "Final" },
];

const statusOptions: Array<{ value: GalleryStatus; label: string; tone: Tone }> = [
  { value: "Pending", label: "Pendiente", tone: "muted" },
  { value: "InReview", label: "En revision", tone: "warning" },
  { value: "Approved", label: "Aprobado", tone: "ok" },
  { value: "Discarded", label: "Descartado", tone: "critical" },
];

const statusLabel = Object.fromEntries(
  statusOptions.map((option) => [option.value, option.label]),
) as Record<GalleryStatus, string>;

const statusTone = Object.fromEntries(
  statusOptions.map((option) => [option.value, option.tone]),
) as Record<GalleryStatus, Tone>;

const stageLabel = Object.fromEntries(
  stageOptions.map((option) => [option.value, option.label]),
) as Record<GalleryStage, string>;

export default async function GalleryPage({ searchParams }: PageProps) {
  const currentUser = await requireSessionUser();
  const params = await searchParams;
  const saved = strParam(params.saved);
  const error = strParam(params.error);
  const selectedCategory = strParam(params.category);
  const selectedStage = strParam(params.stage);
  const selectedStatus = strParam(params.status);
  const onlyClientIdeas = strParam(params.onlyClientIdeas) === "1";
  const snapshot = await getPlannerSnapshot();

  const filteredEntries = snapshot.galleryEntries
    .filter((entry) => !onlyClientIdeas || entry.category === "IdeaCliente")
    .filter((entry) => !selectedCategory || entry.category === selectedCategory)
    .filter((entry) => !selectedStage || entry.stage === selectedStage)
    .filter((entry) => !selectedStatus || entry.status === selectedStatus)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const commentsByEntry = new Map<string, typeof snapshot.galleryComments>();
  for (const comment of snapshot.galleryComments) {
    const bucket = commentsByEntry.get(comment.entryId) || [];
    bucket.push(comment);
    commentsByEntry.set(comment.entryId, bucket);
  }

  return (
    <PlannerPage
      title="Galeria de seguimiento"
      description="Control visual del proceso de branding para el cafe: versiones, estados, etapas y feedback."
    >
      <SaveMessage saved={saved} error={error} />

      <SectionCard
        title="Nueva pieza"
        subtitle="Sube entregables del proceso: logo, paleta, packaging, interior y piezas de redes."
      >
        <details className="fold-card">
          <summary>Registrar pieza</summary>
          <form action={createGalleryEntryAction} className="form-grid" encType="multipart/form-data">
            <input type="hidden" name="returnTo" value="/gallery" />

            <label>
              Titulo
              <input name="title" required placeholder="Ej: Logo principal oscuro" />
            </label>
            <label>
              Pieza base
              <input name="pieceKey" required placeholder="Ej: logo_principal" />
            </label>
            <label>
              Version
              <input name="version" defaultValue="v1" required />
            </label>
            <label>
              Categoria
              <select name="category" defaultValue="Logo">
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Etapa
              <select name="stage" defaultValue="Investigacion">
                {stageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Estado
              <select name="status" defaultValue="Pending">
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Responsable
              <select name="responsibleUserId" defaultValue={currentUser.id}>
                {snapshot.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Imagen
              <input name="image" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
            </label>
            <label>
              URL imagen (opcional)
              <input
                name="imageUrl"
                type="url"
                placeholder="https://..."
              />
            </label>
            <label>
              Contexto
              <textarea
                name="description"
                rows={3}
                placeholder="Que se evaluo, por que se cambio y que sigue."
              />
            </label>
            <button className="btn btn-primary" type="submit">
              Guardar pieza
            </button>
          </form>
        </details>
      </SectionCard>

      <SectionCard title="Filtros" subtitle="Busca por categoria, etapa o estado para revisar avance.">
        <form method="get" action="/gallery" className="gallery-filters">
          <label>
            Categoria
            <select name="category" defaultValue={selectedCategory}>
              <option value="">Todas</option>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="checkbox-line">
            <input name="onlyClientIdeas" type="checkbox" value="1" defaultChecked={onlyClientIdeas} />
            Solo ideas del cliente
          </label>
          <label>
            Etapa
            <select name="stage" defaultValue={selectedStage}>
              <option value="">Todas</option>
              {stageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Estado
            <select name="status" defaultValue={selectedStatus}>
              <option value="">Todos</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button className="btn btn-ghost" type="submit">
            Aplicar
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Tablero visual" subtitle="Seguimiento de versiones y decisiones por pieza.">
        {filteredEntries.length === 0 ? (
          <EmptyState title="No hay piezas para este filtro" detail="Ajusta filtros o crea una nueva pieza." />
        ) : (
          <div className="gallery-grid">
            {filteredEntries.map((entry) => {
              const owner = snapshot.userMap[entry.responsibleUserId];
              const comments = commentsByEntry.get(entry.id) || [];

              return (
                <article key={entry.id} className="gallery-card">
                  <div className="gallery-image-wrap">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={entry.imageUrl} alt={entry.title} className="gallery-image" />
                  </div>
                  <div className="gallery-body">
                    <div className="list-row-head">
                      <div>
                        <p className="list-title">{entry.title}</p>
                        <p className="list-subtitle">
                          {entry.pieceKey} · {entry.version}
                        </p>
                      </div>
                      <div className="badge-row">
                        <Badge tone="muted">{entry.category}</Badge>
                        <Badge tone="accent">{stageLabel[entry.stage]}</Badge>
                        <Badge tone={statusTone[entry.status]}>{statusLabel[entry.status]}</Badge>
                      </div>
                    </div>
                    <p className="list-subtitle">{entry.description || "Sin contexto adicional."}</p>
                    <p className="list-subtitle">
                      Responsable: {owner?.name || "Sin asignar"} · Actualizado: {dateFormat(entry.updatedAt)}
                    </p>

                    <form action={updateGalleryWorkflowAction} className="gallery-workflow-form">
                      <input type="hidden" name="returnTo" value="/gallery" />
                      <input type="hidden" name="entryId" value={entry.id} />
                      <label>
                        Etapa
                        <select name="stage" defaultValue={entry.stage}>
                          {stageOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Estado
                        <select name="status" defaultValue={entry.status}>
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button className="btn btn-ghost" type="submit">
                        Actualizar
                      </button>
                    </form>

                    <div className="gallery-comments">
                      {comments.length === 0 ? (
                        <p className="list-subtitle">Sin comentarios todavia.</p>
                      ) : (
                        <ul className="stack-list">
                          {comments.map((comment) => {
                            const author = snapshot.userMap[comment.userId];
                            return (
                              <li key={comment.id} className="list-row compact">
                                <div className="list-row-head">
                                  <p className="list-title">{author?.name || "Usuario"}</p>
                                  <Badge tone={toneForRole(author?.role || "Member")}>
                                    {author?.jobTitle || "Equipo"}
                                  </Badge>
                                </div>
                                <p className="list-subtitle">{comment.text}</p>
                                <p className="list-subtitle">{dateFormat(comment.createdAt)}</p>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    <form action={addGalleryCommentAction} className="gallery-comment-form">
                      <input type="hidden" name="returnTo" value="/gallery" />
                      <input type="hidden" name="entryId" value={entry.id} />
                      <label>
                        Comentario
                        <textarea
                          name="text"
                          rows={2}
                          required
                          placeholder="Ej: aprobar para prueba en empaque kraft."
                        />
                      </label>
                      <button className="btn btn-primary" type="submit">
                        Comentar
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </SectionCard>
    </PlannerPage>
  );
}
