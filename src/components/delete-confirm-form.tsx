"use client";

import { useRef } from "react";

type HiddenInput = {
  name: string;
  value: string;
};

export function DeleteConfirmForm({
  action,
  hiddenInputs,
  triggerLabel,
  title,
  description,
  impact,
  confirmLabel = "Confirmo que deseo eliminar este registro",
  submitLabel = "Si, eliminar",
  triggerClassName = "btn btn-danger",
}: {
  action: (formData: FormData) => void | Promise<void>;
  hiddenInputs: HiddenInput[];
  triggerLabel: string;
  title: string;
  description: string;
  impact?: string;
  confirmLabel?: string;
  submitLabel?: string;
  triggerClassName?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function openDialog() {
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button type="button" className={triggerClassName} onClick={openDialog}>
        {triggerLabel}
      </button>

      <dialog ref={dialogRef} className="confirm-dialog">
        <article className="confirm-dialog-card">
          <div className="confirm-alert-icon" aria-hidden="true">
            !
          </div>

          <h3>{title}</h3>
          <p className="confirm-dialog-text">{description}</p>
          {impact ? <p className="confirm-dialog-text">{impact}</p> : null}
          <p className="confirm-dialog-warning">Esta accion no se puede deshacer.</p>

          <form action={action} className="confirm-form">
            {hiddenInputs.map((item) => (
              <input key={`${item.name}-${item.value}`} type="hidden" name={item.name} value={item.value} />
            ))}

            <label className="checkbox-line">
              <input type="checkbox" name="confirmDelete" required />
              <span>{confirmLabel}</span>
            </label>

            <div className="confirm-actions">
              <button type="button" className="btn btn-ghost" onClick={closeDialog}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-danger">
                {submitLabel}
              </button>
            </div>
          </form>
        </article>
      </dialog>
    </>
  );
}
