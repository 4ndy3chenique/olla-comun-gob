import { Icon } from "./Icon";

interface Props {
  pagina: number;
  porPagina: number;
  total: number;
  onCambiar: (pagina: number) => void;
}

export function Paginacion({ pagina, porPagina, total, onCambiar }: Props) {
  if (total <= 0) return null;

  const paginas = Math.max(1, Math.ceil(total / porPagina));
  const desde = (pagina - 1) * porPagina + 1;
  const hasta = Math.min(pagina * porPagina, total);

  return (
    <nav
      className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row sm:px-6"
      aria-label="Paginación"
    >
      <p className="tabular text-xs text-muted">
        Mostrando <span className="font-semibold text-ink">{desde}</span>–
        <span className="font-semibold text-ink">{hasta}</span> de{" "}
        <span className="font-semibold text-ink">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="btn-secondary px-3"
          onClick={() => onCambiar(pagina - 1)}
          disabled={pagina <= 1}
          aria-label="Página anterior"
        >
          <Icon nombre="chevron-izquierda" tamano={18} />
          <span className="hidden sm:inline">Anterior</span>
        </button>
        <span className="tabular px-3 text-xs font-medium text-muted">
          Página {pagina} de {paginas}
        </span>
        <button
          type="button"
          className="btn-secondary px-3"
          onClick={() => onCambiar(pagina + 1)}
          disabled={pagina >= paginas}
          aria-label="Página siguiente"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <Icon nombre="chevron-derecha" tamano={18} />
        </button>
      </div>
    </nav>
  );
}
