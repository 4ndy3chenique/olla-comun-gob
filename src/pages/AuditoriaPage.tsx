import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { descargarCsv } from "../lib/csv";
import {
  etiquetaAccion,
  fechaHora,
  nombreCompleto,
} from "../lib/format";
import type { AuditoriaItem, PaginadoConOrigen } from "../types/api";
import { Alerta } from "../components/ui/Alerta";
import { Cargando } from "../components/ui/Cargando";
import { EstadoVacio } from "../components/ui/EstadoVacio";
import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";
import { Paginacion } from "../components/ui/Paginacion";

const ORIGENES = [
  { valor: "postulaciones", etiqueta: "Postulaciones" },
  { valor: "central", etiqueta: "Base operativa central" },
  { valor: "todos", etiqueta: "Todos los orígenes" },
];

function actorDe(item: AuditoriaItem): string {
  if (item.origen === "postulaciones") {
    if (item.funcionario_nombres) {
      return nombreCompleto(item.funcionario_nombres, item.funcionario_apellidos ?? "");
    }
    return item.actor_dni ? `DNI ${item.actor_dni}` : "Sistema";
  }
  if (item.usuario_nombres) {
    return nombreCompleto(item.usuario_nombres, item.usuario_apellidos ?? "");
  }
  return "Sistema";
}

function accionDe(item: AuditoriaItem): string {
  if (item.origen === "postulaciones") {
    return item.accion ? etiquetaAccion(item.accion) : "—";
  }
  return item.tipo_evento ?? "—";
}

function objetivoDe(item: AuditoriaItem): string {
  if (item.origen === "postulaciones") {
    return item.olla_nombre
      ? `${item.olla_nombre} · solicitud #${item.solicitud_id ?? "—"}`
      : `Solicitud #${item.solicitud_id ?? "—"}`;
  }
  return `${item.entidad_afectada ?? "Entidad"} #${item.entidad_id ?? "—"}`;
}

export default function AuditoriaPage() {
  const [params, setParams] = useSearchParams();
  const origen = params.get("origen") ?? "postulaciones";
  const q = params.get("q") ?? "";
  const desde = params.get("desde") ?? "";
  const hasta = params.get("hasta") ?? "";
  const pagina = Math.max(1, Number(params.get("page") ?? "1") || 1);

  const [borradorQ, setBorradorQ] = useState(q);
  const [borradorOrigen, setBorradorOrigen] = useState(origen);
  const [borradorDesde, setBorradorDesde] = useState(desde);
  const [borradorHasta, setBorradorHasta] = useState(hasta);
  const [errorFiltros, setErrorFiltros] = useState<string | null>(null);

  useEffect(() => {
    setBorradorQ(q);
    setBorradorOrigen(origen);
    setBorradorDesde(desde);
    setBorradorHasta(hasta);
  }, [q, origen, desde, hasta]);

  const consulta = new URLSearchParams();
  consulta.set("origen", origen);
  consulta.set("page", String(pagina));
  consulta.set("per_page", "25");
  if (q) consulta.set("q", q);
  if (desde) consulta.set("desde", desde);
  if (hasta) consulta.set("hasta", hasta);

  const lista = useApi<PaginadoConOrigen<AuditoriaItem>>(
    `/estado/auditoria?${consulta.toString()}`,
  );
  const hayFiltros = Boolean(q || desde || hasta || origen !== "postulaciones");

  function aplicarFiltros(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (borradorDesde && borradorHasta && borradorDesde > borradorHasta) {
      setErrorFiltros("La fecha de inicio no puede ser posterior a la fecha de fin.");
      return;
    }
    setErrorFiltros(null);
    const siguiente = new URLSearchParams();
    siguiente.set("origen", borradorOrigen);
    if (borradorQ.trim()) siguiente.set("q", borradorQ.trim());
    if (borradorDesde) siguiente.set("desde", borradorDesde);
    if (borradorHasta) siguiente.set("hasta", borradorHasta);
    setParams(siguiente);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function limpiar() {
    setParams(new URLSearchParams());
    setBorradorQ("");
    setBorradorOrigen("postulaciones");
    setBorradorDesde("");
    setBorradorHasta("");
    setErrorFiltros(null);
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
      "auditoria",
      lista.data.items.map((item) => ({
        fecha: item.timestamp,
        origen: item.origen,
        accion: accionDe(item),
        objetivo: objetivoDe(item),
        actor: actorDe(item),
        declaracion: item.declaracion === undefined ? "" : item.declaracion ? "Sí" : "No",
        firma: item.firma_valida ? "Válida" : "No válida",
      })),
      [
        { clave: "fecha", titulo: "Fecha y hora" },
        { clave: "origen", titulo: "Origen" },
        { clave: "accion", titulo: "Acción o evento" },
        { clave: "objetivo", titulo: "Olla o entidad" },
        { clave: "actor", titulo: "Actor" },
        { clave: "declaracion", titulo: "Declaración jurada" },
        { clave: "firma", titulo: "Firma HMAC" },
      ],
    );
  }

  function claseOrigen(valor: string): string {
    return valor === "central" ? "badge badge-supervisor" : "badge badge-admin";
  }

  return (
    <>
      <PageHeader
        eyebrow="Monitoreo"
        titulo="Auditoría institucional"
        descripcion="Consulta los eventos firmados de la plataforma de postulaciones y de la base operativa central. Cada registro permite verificar su integridad."
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
        className="card card-pad mb-5 grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_0.8fr_0.8fr_auto]"
        onSubmit={aplicarFiltros}
        role="search"
        aria-label="Filtros de auditoría"
      >
        <div>
          <label className="label-field" htmlFor="auditoria-origen">
            Origen
          </label>
          <select
            id="auditoria-origen"
            className="select-field"
            value={borradorOrigen}
            onChange={(evento) => setBorradorOrigen(evento.target.value)}
          >
            {ORIGENES.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.etiqueta}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-field" htmlFor="auditoria-q">
            Buscar
          </label>
          <input
            id="auditoria-q"
            type="search"
            className="input-field"
            placeholder="Acción, olla, actor o DNI"
            value={borradorQ}
            onChange={(evento) => setBorradorQ(evento.target.value)}
          />
        </div>

        <div>
          <label className="label-field" htmlFor="auditoria-desde">
            Desde
          </label>
          <input
            id="auditoria-desde"
            type="date"
            className="input-field"
            value={borradorDesde}
            onChange={(evento) => setBorradorDesde(evento.target.value)}
          />
        </div>

        <div>
          <label className="label-field" htmlFor="auditoria-hasta">
            Hasta
          </label>
          <input
            id="auditoria-hasta"
            type="date"
            className="input-field"
            value={borradorHasta}
            onChange={(evento) => setBorradorHasta(evento.target.value)}
          />
        </div>

        <div className="flex items-end gap-2 lg:col-span-2">
          <button type="submit" className="btn-primary flex-1">
            <Icon nombre="buscar" tamano={17} />
            Filtrar
          </button>
          {hayFiltros ? (
            <button type="button" className="btn-secondary" onClick={limpiar}>
              Limpiar
            </button>
          ) : null}
        </div>
      </form>

      {errorFiltros ? (
        <div className="mb-5">
          <Alerta tono="danger">{errorFiltros}</Alerta>
        </div>
      ) : null}

      {lista.error ? (
        <div className="mb-5">
          <Alerta tono="danger" titulo="No pudimos cargar la auditoría">
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

      <section className="card overflow-hidden" aria-labelledby="titulo-auditoria">
        <div className="card-header">
          <div>
            <h2 id="titulo-auditoria" className="font-semibold text-ink">
              Registros de auditoría
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {lista.data
                ? `${lista.data.total} evento(s) encontrados · origen ${lista.data.origen ?? origen}`
                : "Consultando la bitácora institucional…"}
            </p>
          </div>
          <span className="badge badge-neutral">Firma HMAC</span>
        </div>

        {lista.cargando && !lista.data ? (
          <Cargando texto="Cargando registros de auditoría…" />
        ) : lista.data && lista.data.items.length === 0 ? (
          <EstadoVacio
            icono="escudo"
            titulo="No hay registros con estos filtros"
            descripcion="Ajusta el origen, el texto de búsqueda o el rango de fechas."
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
              <table className="table-base min-w-[1040px]">
                <caption className="sr-only">Bitácora de auditoría institucional</caption>
                <thead>
                  <tr>
                    <th scope="col">Fecha y hora</th>
                    <th scope="col">Origen</th>
                    <th scope="col">Acción o evento</th>
                    <th scope="col">Olla o entidad</th>
                    <th scope="col">Actor</th>
                    <th scope="col">Declaración</th>
                    <th scope="col">Firma</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.data.items.map((item) => (
                    <tr key={`${item.origen}-${item.id}`}>
                      <td className="tabular whitespace-nowrap text-xs text-muted">
                        {fechaHora(item.timestamp)}
                      </td>
                      <td>
                        <span className={claseOrigen(item.origen)}>
                          {item.origen === "central" ? "Central" : "Postulaciones"}
                        </span>
                      </td>
                      <td className="font-medium text-ink">{accionDe(item)}</td>
                      <td className="text-sm text-muted">{objetivoDe(item)}</td>
                      <td className="text-sm text-ink">{actorDe(item)}</td>
                      <td>
                        {item.declaracion ? (
                          <span className="badge badge-observada">Sí</span>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={
                            item.firma_valida ? "badge badge-apta" : "badge badge-no-apta"
                          }
                        >
                          <Icon
                            nombre={item.firma_valida ? "check-circulo" : "x-circulo"}
                            tamano={13}
                          />
                          {item.firma_valida ? "Válida" : "No válida"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-border md:hidden">
              {lista.data.items.map((item) => (
                <li key={`${item.origen}-${item.id}`} className="px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{accionDe(item)}</p>
                      <p className="mt-1 text-xs text-muted">{objetivoDe(item)}</p>
                    </div>
                    <span className={claseOrigen(item.origen)}>
                      {item.origen === "central" ? "Central" : "Postulaciones"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <span className="tabular">{fechaHora(item.timestamp)}</span>
                    <span>·</span>
                    <span>{actorDe(item)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={item.firma_valida ? "badge badge-apta" : "badge badge-no-apta"}
                    >
                      {item.firma_valida ? "Firma válida" : "Firma no válida"}
                    </span>
                    {item.declaracion ? (
                      <span className="badge badge-observada">Declaración jurada</span>
                    ) : null}
                  </div>
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
