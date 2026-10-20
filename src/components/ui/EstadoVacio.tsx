import type { ReactNode } from "react";
import { Icon, type NombreIcono } from "./Icon";

interface Props {
  icono?: NombreIcono;
  titulo: string;
  descripcion: string;
  accion?: ReactNode;
}

export function EstadoVacio({
  icono = "documento",
  titulo,
  descripcion,
  accion,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-primary-light text-primary-dark">
        <Icon nombre={icono} tamano={26} />
      </span>
      <h3 className="text-base font-semibold text-ink">{titulo}</h3>
      <p className="mt-1 max-w-md text-sm leading-6 text-muted">{descripcion}</p>
      {accion ? <div className="mt-5">{accion}</div> : null}
    </div>
  );
}
