import { Link } from "react-router-dom";
import {
  claseEstadoSolicitud,
  etiquetaEstado,
  fecha,
  nombreCompleto,
} from "../../lib/format";
import type { SolicitudItem } from "../../types/api";
import { Icon } from "../ui/Icon";

function Evaluador({ solicitud }: { solicitud: SolicitudItem }) {
  if (!solicitud.evaluador) {
    return <span className="badge badge-neutral">Sin asignar</span>;
  }
  return (
    <span className="text-sm text-ink">
      {nombreCompleto(solicitud.evaluador.nombres, solicitud.evaluador.apellidos)}
    </span>
  );
}

export function TablaSolicitudes({
  items,
  compacta = false,
}: {
  items: SolicitudItem[];
  compacta?: boolean;
}) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="table-base min-w-[860px]">
          <caption className="sr-only">Listado de solicitudes de ollas comunes</caption>
          <thead>
            <tr>
              <th scope="col">Olla común</th>
              {!compacta ? <th scope="col">Dirigente</th> : null}
              <th scope="col">Padrón</th>
              <th scope="col">Estado</th>
              <th scope="col">Evaluador</th>
              <th scope="col">Registro</th>
              <th scope="col">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((solicitud) => (
              <tr key={solicitud.id}>
                <td>
                  <Link
                    to={`/solicitudes/${solicitud.id}`}
                    className="font-semibold text-ink hover:text-primary-dark"
                  >
                    {solicitud.olla_nombre}
                  </Link>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                    <Icon nombre="mapa" tamano={13} />
                    {solicitud.distrito}
                  </p>
                </td>
                {!compacta ? (
                  <td>
                    <p className="text-sm text-ink">
                      {solicitud.dirigente_nombres} {solicitud.dirigente_apellidos}
                    </p>
                    <p className="tabular mt-0.5 text-xs text-muted">
                      DNI {solicitud.dirigente_dni}
                    </p>
                  </td>
                ) : null}
                <td>
                  <p className="tabular text-sm font-semibold text-ink">
                    {solicitud.total_integrantes}
                  </p>
                  <p className="text-xs text-muted">
                    de {solicitud.num_personas_declaradas} declarados
                  </p>
                </td>
                <td>
                  <span className={claseEstadoSolicitud(solicitud.estado)}>
                    {etiquetaEstado(solicitud.estado)}
                  </span>
                </td>
                <td>
                  <Evaluador solicitud={solicitud} />
                </td>
                <td>
                  <span className="tabular text-sm text-muted">
                    {fecha(solicitud.fecha_solicitud)}
                  </span>
                </td>
                <td className="text-right">
                  <Link
                    to={`/solicitudes/${solicitud.id}`}
                    className="btn-icon"
                    aria-label={`Abrir solicitud de ${solicitud.olla_nombre}`}
                  >
                    <Icon nombre="chevron-derecha" tamano={19} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-border md:hidden">
        {items.map((solicitud) => (
          <li key={solicitud.id}>
            <Link
              to={`/solicitudes/${solicitud.id}`}
              className="block px-4 py-4 transition-colors hover:bg-primary-light/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{solicitud.olla_nombre}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                    <Icon nombre="mapa" tamano={13} />
                    {solicitud.distrito}
                  </p>
                </div>
                <span className={claseEstadoSolicitud(solicitud.estado)}>
                  {etiquetaEstado(solicitud.estado)}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted">Dirigente</p>
                  <p className="mt-0.5 font-medium text-ink">
                    {solicitud.dirigente_nombres} {solicitud.dirigente_apellidos}
                  </p>
                </div>
                <div>
                  <p className="text-muted">Padrón</p>
                  <p className="tabular mt-0.5 font-medium text-ink">
                    {solicitud.total_integrantes} de {solicitud.num_personas_declaradas}
                  </p>
                </div>
                <div>
                  <p className="text-muted">Evaluador</p>
                  <p className="mt-0.5 font-medium text-ink">
                    {solicitud.evaluador
                      ? nombreCompleto(
                          solicitud.evaluador.nombres,
                          solicitud.evaluador.apellidos,
                        )
                      : "Sin asignar"}
                  </p>
                </div>
                <div>
                  <p className="text-muted">Registro</p>
                  <p className="tabular mt-0.5 font-medium text-ink">
                    {fecha(solicitud.fecha_solicitud)}
                  </p>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
