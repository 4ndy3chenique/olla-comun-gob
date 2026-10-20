import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

interface Props {
  abierto: boolean;
  titulo: string;
  descripcion?: string;
  onCerrar: () => void;
  children: ReactNode;
  pie?: ReactNode;
  ancho?: "sm" | "md" | "lg";
}

const anchos = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
};

export function Modal({
  abierto,
  titulo,
  descripcion,
  onCerrar,
  children,
  pie,
  ancho = "md",
}: Props) {
  const idTitulo = useId();
  const idDescripcion = useId();
  const cerrarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!abierto) return;

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cerrarRef.current?.focus();

    function alPresionar(evento: KeyboardEvent) {
      if (evento.key === "Escape") onCerrar();
    }

    document.addEventListener("keydown", alPresionar);
    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener("keydown", alPresionar);
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-0 sm:items-center sm:p-6"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onCerrar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={descripcion ? idDescripcion : undefined}
        className={`flex max-h-[92vh] w-full ${anchos[ancho]} flex-col overflow-hidden rounded-t-lg border border-border bg-surface shadow-modal sm:rounded-lg`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id={idTitulo} className="text-lg font-semibold text-ink">
              {titulo}
            </h2>
            {descripcion ? (
              <p id={idDescripcion} className="mt-1 text-sm leading-6 text-muted">
                {descripcion}
              </p>
            ) : null}
          </div>
          <button
            ref={cerrarRef}
            type="button"
            className="btn-icon -mr-2 shrink-0"
            onClick={onCerrar}
            aria-label="Cerrar"
          >
            <Icon nombre="cerrar" tamano={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {pie ? (
          <div className="flex flex-wrap justify-end gap-2 border-t border-border bg-bg/50 px-5 py-4 sm:px-6">
            {pie}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
