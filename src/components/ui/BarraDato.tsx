interface Props {
  etiqueta: string;
  valor: number;
  total: number;
  tono?: "primary" | "accent" | "success" | "danger" | "info" | "muted";
  detalle?: string;
}

const colores = {
  primary: "bg-primary",
  accent: "bg-accent",
  success: "bg-success",
  danger: "bg-danger",
  info: "bg-info",
  muted: "bg-muted/50",
};

export function BarraDato({ etiqueta, valor, total, tono = "primary", detalle }: Props) {
  const porcentaje = total > 0 ? Math.round((valor / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-ink">{etiqueta}</span>
        <span className="tabular text-sm text-muted">
          <span className="font-semibold text-ink">{valor}</span>
          {detalle ? <span className="ml-1 text-xs">{detalle}</span> : null}
          <span className="ml-2 text-xs">{porcentaje} %</span>
        </span>
      </div>
      <div
        className="bar-track"
        role="img"
        aria-label={`${etiqueta}: ${valor} de ${total} (${porcentaje} %)`}
      >
        <div
          className={`bar-fill ${colores[tono]}`}
          style={{ width: `${Math.max(valor > 0 ? 3 : 0, porcentaje)}%` }}
        />
      </div>
    </div>
  );
}
