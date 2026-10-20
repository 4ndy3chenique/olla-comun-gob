import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { descargarCsv } from "../lib/csv";
import {
  claseEstadoSolicitud,
  etiquetaEstado,
  etiquetaGuia,
  fecha,
  nombreCompleto,
  numeroHumano,
} from "../lib/format";
import type { OllaItem, Paginado } from "../types/api";
import { Alerta } from "../components/ui/Alerta";
import { Cargando } from "../components/ui/Cargando";
import { EstadoVacio } from "../components/ui/EstadoVacio";
import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";
import { Paginacion } from "../components/ui/Paginacion";

const ESTADOS = [
  { valor: "", etiqueta: "Todos los estados" },
  { valor: "APTA", etiqueta: "Apta" },
  { valor: "PENDIENTE", etiqueta: "Pendiente" },
  { valor: "NO_APTA", etiqueta: "No apta" },
];

function nombreDirigente(olla: OllaItem): string {
  if (!olla.dirigente_nombres && !olla.dirigente_apellidos) {
    return "Sin dirigente vinculado";
  }
  return nombreCompleto(olla.dirigente_nombres ?? "", olla.dirigente_apellidos ?? "");
}

export default function OllasPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const distrito = params.get("distrito") ?? "";
  const estado = params.get("estado_aprobacion") ?? "";
  const pagina = Math.max(1, Number(params.get("page") ?? "1") || 1);

  const [borradorQ, setBorradorQ] = useState(q);
  const [borradorDistrito, setBorradorDistrito] = useState(distrito);
  const [borradorEstado, setBorradorEstado] = useState(estado);

  useEffect(() => {
    setBorradorQ(q);
    setBorradorDistrito(distrito);
    setBorradorEstado(estado);
  }, [q, distrito, estado]);

  const consulta = new URLSearchParams();
  consulta.set("page", String(pagina));
  consulta.set("per_page", "20");
  if (q) consulta.set("q", q);
  if (distrito) consulta.set("distrito", distrito);
  if (estado) consulta.set("estado_aprobacion", estado);

  const lista = useApi<Paginado<OllaItem>>(`/estado/ollas?${consulta.toString()}`);
  const hayFiltros = Boolean(q || distrito || estado);

  function aplicarFiltros(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const siguiente = new URLSearchParams();
    if (borradorQ.trim()) siguiente.set("q", borradorQ.trim());
    if (borradorDistrito.trim()) siguiente.set("distrito", borradorDistrito.trim());
    if (borradorEstado) siguiente.set("estado_aprobacion", borradorEstado);
    setParams(siguiente);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function limpiar() {
    setParams(new URLSearchParams());
    setBorradorQ("");
    setBorradorDistrito("");
    setBorradorEstado("");
  }

  function cambiarPagina(nueva: number) {
    const siguiente = new URLSearchParams(params);
    siguiente.set("page", String(nueva));
    setParams(siguiente);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function exportar() {
    if (!lista.data) return;
    descargarCsv(
      "ollas",
      lista.data.items.map((olla) => ({
        olla: olla.nombre,
        distrito: olla.distrito,
        direccion: olla.direccion,
        dirigente: nombreDirigente(olla),
        declaradas: olla.num_personas_declaradas,
        beneficiarios_activos: olla.beneficiarios_activos,
        beneficiarios_total: olla.beneficiarios_total,
        estado: etiquetaEstado(olla.estado_aprobacion),
        fecha_aprobacion: olla.fecha_aprobacion ?? "",
        ultima_guia: olla.ultima_guia_estado ? etiquetaGuia(olla.ultima_guia_estado) : "",
        ultima_guia_fecha: olla.ultima_guia_fecha ?? "",
      })),
      [
        { clave: "olla", titulo: "Olla común" },
        { clave: "distrito", titulo: "Distrito" },
        { clave: "direccion", titulo: "Dirección" },
        { clave: "dirigente", titulo: "Dirigente" },
        { clave: "declaradas", titulo: "Personas declaradas" },
        { clave: "beneficiarios_activos", titulo: "Beneficiarios activos" },
        { clave: "beneficiarios_total", titulo: "Beneficiarios totales" },
        { clave: "estado", titulo: "Estado" },
        { clave: "fecha_aprobacion", titulo: "Fecha de aprobación" },
        { clave: "ultima_guia", titulo: "Última guía" },
        { clave: "ultima_guia_fecha", titulo: "Fecha de última guía" },
      ],
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Monitoreo"
        titulo="Ollas y beneficiarios"
        descripcion="Consulta las ollas registradas en la base operativa, su padrón de beneficiarios y el estado de sus guías de despacho."
        acciones={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={lista.recargar}
              disabled={lista.cargando}
            >
              <Icon nombre="refrescar" tamano={18} />
              {lista.cargando ? "Actualizando…" : "Actualizar"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={exportar}
              disabled={!lista.data || lista.data.items.length === 0}
            >
              <Icon nombre="descargar" tamano={18} />
              Exportar página
            </button>
          </>
        }
      />

      <form
        className="card card-pad mb-5 grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_auto]"
        onSubmit={aplicarFiltros}
        role="search"
        aria-label="Filtros de ollas comunes"
      >
        <div>
          <label className="label-field" htmlFor="olla-q">
            Buscar
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
              <Icon nombre="buscar" tamano={18} />
            </span>
            <input
              id="olla-q"
              type="search"
              className="input-field pl-10"
              placeholder="Olla, distrito o dirigente"
              value={borradorQ}
              onChange={(evento) => setBorradorQ(evento.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label-field" htmlFor="olla-distrito">
            Distrito
          </label>
          <input
            id="olla-distrito"
            type="text"
            className="input-field"
            placeholder="Todos"
            value={borradorDistrito}
            onChange={(evento) => setBorradorDistrito(evento.target.value)}
          />
        </div>

        <div>
          <label className="label-field" htmlFor="olla-estado">
            Estado de aprobación
          </label>
          <select
            id="olla-estado"
            className="select-field"
            value={borradorEstado}
            onChange={(evento) => setBorradorEstado(evento.target.value)}
          >
            {ESTADOS.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.etiqueta}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button type="submit" className="btn-primary flex-1">
            <Icon nombre="buscar" tamano={17} />
            Buscar
          </button>
          {hayFiltros ? (
            <button type="button" className="btn-secondary" onClick={limpiar}>
              Limpiar
            </button>
          ) : null}
        </div>
      </form>

      {lista.error ? (
        <div className="mb-5">
          <Alerta tono="danger" titulo="No pudimos cargar las ollas">
            {lista.error.message}{" "}
            <button
              type="button"
              className="font-semibold underline underline-offset-2"
              onClick={lista.recargar}
            >
              Reintentar
            </button>
          </Alerta>
        </div>
      ) : null}

      <section className="card overflow-hidden" aria-labelledby="titulo-ollas">
        <div className="card-header">
          <div>
            <h2 id="titulo-ollas" className="font-semibold text-ink">
              {hayFiltros ? "Resultados filtrados" : "Directorio de ollas comunes"}
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {lista.data
                ? `${lista.data.total} olla(s) registradas`
                : "Consultando la base operativa…"}
            </p>
          </div>
          <span className="badge badge-neutral">Solo lectura</span>
        </div>

        {lista.cargando && !lista.data ? (
          <Cargando texto="Cargando ollas y beneficiarios…" />
        ) : lista.data && lista.data.items.length === 0 ? (
          <EstadoVacio
            icono="edificio"
            titulo="No hay ollas con estos filtros"
            descripcion="Las ollas aparecen aquí cuando una solicitud es aprobada y sincronizada con la base operativa."
            accion={
              hayFiltros ? (
                <button type="button" className="btn-secondary" onClick={limpiar}>
                  Limpiar filtros
                </button>
              ) : undefined
            }
          />
        ) : lista.data ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="table-base min-w-[900px]">
                <caption className="sr-only">Listado de ollas comunes registradas</caption>
                <thead>
                  <tr>
                    <th scope="col">Olla común</th>
                    <th scope="col">Dirigente</th>
                    <th scope="col">Distrito</th>
                    <th scope="col">Padrón</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Última guía</th>
                    <th scope="col">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lista.data.items.map((olla) => (
                    <tr key={olla.id}>
                      <td>
                        <Link
                          to={`/ollas/${olla.id}`}
                          className="font-semibold text-ink hover:text-primary-dark"
                        >
                          {olla.nombre}
                        </Link>
                        <p className="mt-0.5 max-w-xs truncate text-xs text-muted">
                          {olla.direccion}
                        </p>
                      </td>
                      <td className="text-sm text-ink">{nombreDirigente(olla)}</td>
                      <td className="text-sm text-muted">{olla.distrito}</td>
                      <td>
                        <p className="tabular text-sm font-semibold text-ink">
                          {numeroHumano(olla.beneficiarios_activos)}
                        </p>
                        <p className="text-xs text-muted">
                          activos de {numeroHumano(olla.beneficiarios_total)} ·{" "}
                          {numeroHumano(olla.num_personas_declaradas)} declarados
                        </p>
                      </td>
                      <td>
                        <span className={claseEstadoSolicitud(olla.estado_aprobacion)}>
                          {etiquetaEstado(olla.estado_aprobacion)}
                        </span>
                      </td>
                      <td>
                        {olla.ultima_guia_estado ? (
                          <>
                            <span className="badge badge-neutral">
                              {etiquetaGuia(olla.ultima_guia_estado)}
                            </span>
                            <p className="mt-1 text-xs text-muted">
                              {fecha(olla.ultima_guia_fecha)}
                            </p>
                          </>
                        ) : (
                          <span className="text-xs text-muted">Sin guías</span>
                        )}
                      </td>
                      <td className="text-right">
                        <Link
                          to={`/ollas/${olla.id}`}
                          className="btn-icon"
                          aria-label={`Abrir olla ${olla.nombre}`}
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
              {lista.data.items.map((olla) => (
                <li key={olla.id}>
                  <Link
                    to={`/ollas/${olla.id}`}
                    className="block px-4 py-4 transition-colors hover:bg-primary-light/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{olla.nombre}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                          <Icon nombre="mapa" tamano={13} />
                          {olla.distrito}
                        </p>
                      </div>
                      <span className={claseEstadoSolicitud(olla.estado_aprobacion)}>
                        {etiquetaEstado(olla.estado_aprobacion)}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted">Dirigente</p>
                        <p className="mt-0.5 font-medium text-ink">{nombreDirigente(olla)}</p>
                      </div>
                      <div>
                        <p className="text-muted">Beneficiarios</p>
                        <p className="tabular mt-0.5 font-medium text-ink">
                          {numeroHumano(olla.beneficiarios_activos)} activos de{" "}
                          {numeroHumano(olla.beneficiarios_total)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted">Personas declaradas</p>
                        <p className="tabular mt-0.5 font-medium text-ink">
                          {numeroHumano(olla.num_personas_declaradas)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted">Última guía</p>
                        <p className="mt-0.5 font-medium text-ink">
                          {olla.ultima_guia_estado
                            ? `${etiquetaGuia(olla.ultima_guia_estado)} · ${fecha(olla.ultima_guia_fecha)}`
                            : "Sin guías"}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            <Paginacion
              pagina={lista.data.page}
              porPagina={lista.data.per_page}
              total={lista.data.total}
              onCambiar={cambiarPagina}
            />
          </>
        ) : null}
      </section>
    </>
  );
}
