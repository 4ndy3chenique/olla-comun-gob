import type { ReactNode } from "react";
import { Icon, type NombreIcono } from "./Icon";

type Tono = "info" | "success" | "warning" | "danger";

const estilos: Record<Tono, { caja: string; icono: NombreIcono }> = {
  info: { caja: "border-info/25 bg-info-light text-info", icono: "info" },
  success: { caja: "border-success/25 bg-success-light text-success", icono: "check-circulo" },
  warning: { caja: "border-accent/30 bg-accent-light text-accent-dark", icono: "alerta" },
  danger: { caja: "border-danger/25 bg-danger-light text-danger", icono: "x-circulo" },
};

interface Props {
  tono?: Tono;
  titulo?: string;
  children: ReactNode;
}

export function Alerta({ tono = "info", titulo, children }: Props) {
  const estilo = estilos[tono];
  return (
    <div
      className={`flex gap-3 rounded border p-4 text-sm leading-6 ${estilo.caja}`}
      role={tono === "danger" ? "alert" : "status"}
    >
      <Icon nombre={estilo.icono} tamano={20} className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        {titulo ? <p className="font-semibold">{titulo}</p> : null}
        <div className={titulo ? "mt-0.5" : ""}>{children}</div>
      </div>
    </div>
  );
}
