import type { PropsWithChildren } from "react";

export function PlannerPage({
  title,
  className,
  children,
}: PropsWithChildren<{ title: string; description: string; className?: string }>) {
  return (
    <div className={`planner-page${className ? ` ${className}` : ""}`}>
      <header className="page-head">
        <h1>{title}</h1>
      </header>
      {children}
    </div>
  );
}

export function SaveMessage({
  saved,
  error,
}: {
  saved?: string;
  error?: string;
}) {
  if (!saved && !error) return null;

  if (error) {
    const message =
      error === "forbidden"
        ? "Tu rol no tiene permiso para esta accion."
        : error === "not_creator"
          ? "Solo quien creo el proyecto puede eliminarlo."
        : error === "email_exists"
          ? "Ese email ya existe en el equipo."
          : error === "empty_message"
            ? "El mensaje no puede ir vacio."
            : error === "no_chat_target"
              ? "Selecciona un usuario valido para chat directo."
            : error === "invalid_image"
            ? "La foto debe ser una imagen valida."
            : error === "image_too_large"
              ? "La imagen supera el limite permitido."
          : error === "confirm_required"
            ? "Debes confirmar la eliminacion para continuar."
          : error === "avatar_upload_failed"
            ? "No se pudo subir la foto. Intenta de nuevo."
          : error === "image_upload_failed"
            ? "No se pudo subir la imagen. Intenta de nuevo."
          : error === "protected_role"
            ? "La cuenta administradora esta protegida."
          : error === "cannot_delete_self"
              ? "No puedes eliminar tu propia cuenta."
              : error === "invalid_role"
                ? "Solo se pueden crear usuarios tipo Miembro."
                : error === "password_required"
                  ? "Debes definir una nueva contraseña para continuar."
                : error === "not_found"
                  ? "No se encontro el registro solicitado."
          : "No se pudo completar la accion.";

    return <p className="alert alert-error">{message}</p>;
  }

  return <p className="alert alert-ok">Cambios guardados correctamente.</p>;
}
