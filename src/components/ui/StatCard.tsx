import type { NombreIcono } from "./Icon";
import { Icon } from "./Icon";

interface Props {
  etiqueta: string;
  valor: string | number;
  detalle?: string;
  icono: NombreIcono;
  tono?: "primary" | "accent" | "success" | "danger" | "info";
  cargando?: boolean;
}

const tonos = {
  primary: "bg-primary-light text-primary-dark",
  accent: "bg-accent-light text-accent-dark",
  success: "bg-success-light text-success",
  danger: "bg-danger-light text-danger",
  info: "bg-info-light text-info",
};

export function StatCard({
  etiqueta,
  valor,
  detalle,
  icono,
  tono = "primary",
  cargando = false,
}: Props) {
  return (
    <article className="card card-pad">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted">{etiqueta}</p>
          {cargando ? (
            <div className="skeleton mt-3 h-9 w-20" aria-hidden="true" />
          ) : (
            <p className="tabular mt-2 text-3xl font-bold text-ink">{valor}</p>
          )}
          {detalle ? <p className="mt-2 text-xs leading-5 text-muted">{detalle}</p> : null}
        </div>
        <span
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${tonos[tono]}`}
          aria-hidden="true"
        >
          <Icon nombre={icono} tamano={22} />
        </span>
      </div>
    </article>
  );
}
