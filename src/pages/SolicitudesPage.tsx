import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import type { Paginado, SolicitudItem } from "../types/api";
import { Alerta } from "../components/ui/Alerta";
import { Cargando } from "../components/ui/Cargando";
import { EstadoVacio } from "../components/ui/EstadoVacio";
import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";
import { Paginacion } from "../components/ui/Paginacion";
import { TablaSolicitudes } from "../components/solicitudes/TablaSolicitudes";

const ESTADOS = [
  { valor: "", etiqueta: "Todos los estados" },
  { valor: "PENDIENTE", etiqueta: "Pendiente" },
  { valor: "EN_EVALUACION", etiqueta: "En evaluación" },
  { valor: "OBSERVADA", etiqueta: "Observada" },
  { valor: "APTA", etiqueta: "Apta" },
  { valor: "NO_APTA", etiqueta: "No apta" },
];

export default function SolicitudesPage() {
  const { funcionario } = useAuth();
  const [params, setParams] = useSearchParams();
  const estado = params.get("estado") ?? "";
  const distrito = params.get("distrito") ?? "";
  const q = params.get("q") ?? "";
  const sinAsignar = params.get("sin_asignar") === "1";
  const pagina = Math.max(1, Number(params.get("page") ?? "1") || 1);

  const [borradorQ, setBorradorQ] = useState(q);
  const [borradorDistrito, setBorradorDistrito] = useState(distrito);
  const [borradorEstado, setBorradorEstado] = useState(estado);
  const [borradorSinAsignar, setBorradorSinAsignar] = useState(sinAsignar);

  useEffect(() => {
    setBorradorQ(q);
    setBorradorDistrito(distrito);
    setBorradorEstado(estado);
    setBorradorSinAsignar(sinAsignar);
  }, [q, distrito, estado, sinAsignar]);

  const consulta = new URLSearchParams();
  consulta.set("page", String(pagina));
  consulta.set("per_page", "20");
  if (estado) consulta.set("estado", estado);
  if (distrito) consulta.set("distrito", distrito);
  if (q) consulta.set("q", q);
  if (sinAsignar) consulta.set("sin_asignar", "1");
  const ruta = `/estado/solicitudes?${consulta.toString()}`;
  const lista = useApi<Paginado<SolicitudItem>>(ruta);

  function aplicarFiltros(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const siguiente = new URLSearchParams();
    if (borradorQ.trim()) siguiente.set("q", borradorQ.trim());
    if (borradorDistrito.trim()) siguiente.set("distrito", borradorDistrito.trim());
    if (borradorEstado) siguiente.set("estado", borradorEstado);
    if (borradorSinAsignar) siguiente.set("sin_asignar", "1");
    setParams(siguiente);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function limpiar() {
    setParams(new URLSearchParams());
    setBorradorQ("");
    setBorradorDistrito("");
    setBorradorEstado("");
    setBorradorSinAsignar(false);
  }

  function cambiarPagina(nueva: number) {
    const siguiente = new URLSearchParams(params);
    siguiente.set("page", String(nueva));
    setParams(siguiente);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const hayFiltros = Boolean(estado || distrito || q || sinAsignar);

  return (
    <>
      <PageHeader
        eyebrow="Evaluación"
        titulo="Bandeja de solicitudes"
        descripcion={
          funcionario?.rol === "EVALUADOR"
            ? "Consulta las solicitudes asignadas a ti y las que aún no tienen evaluador. Solo puedes evaluar y decidir las asignadas a tu usuario."
            : "Revisa, asigna y resuelve las postulaciones de ollas comunes registradas por la Plataforma del Solicitante."
        }
        acciones={
          <button
            type="button"
            className="btn-secondary"
            onClick={lista.recargar}
            disabled={lista.cargando}
          >
            <Icon nombre="refrescar" tamano={18} />
            {lista.cargando ? "Actualizando…" : "Actualizar"}
          </button>
        }
      />

      <form
        className="card card-pad mb-5 grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_auto]"
        onSubmit={aplicarFiltros}
        role="search"
        aria-label="Filtros de solicitudes"
      >
        <div>
          <label className="label-field" htmlFor="filtro-q">
            Buscar
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
              <Icon nombre="buscar" tamano={18} />
            </span>
            <input
              id="filtro-q"
              type="search"
              className="input-field pl-10"
              placeholder="Olla, dirigente, DNI o distrito"
              value={borradorQ}
              onChange={(evento) => setBorradorQ(evento.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label-field" htmlFor="filtro-distrito">
            Distrito
          </label>
          <input
            id="filtro-distrito"
            type="text"
            className="input-field"
            placeholder="Todos"
            value={borradorDistrito}
            onChange={(evento) => setBorradorDistrito(evento.target.value)}
          />
        </div>

        <div>
          <label className="label-field" htmlFor="filtro-estado">
            Estado
          </label>
          <select
            id="filtro-estado"
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

        <div className="flex flex-col justify-end">
          <label className="mb-1.5 flex min-h-6 cursor-pointer items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-border accent-primary"
              checked={borradorSinAsignar}
              onChange={(evento) => setBorradorSinAsignar(evento.target.checked)}
            />
            Solo sin asignar
          </label>
          <div className="flex gap-2">
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
        </div>
      </form>

      {lista.error ? (
        <div className="mb-5">
          <Alerta tono="danger" titulo="No pudimos cargar la bandeja">
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

      <section className="card overflow-hidden" aria-labelledby="titulo-bandeja">
        <div className="card-header">
          <div>
            <h2 id="titulo-bandeja" className="font-semibold text-ink">
              {hayFiltros ? "Resultados filtrados" : "Todas las solicitudes"}
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {lista.data
                ? `${lista.data.total} solicitud(es) encontradas`
                : "Consultando la bandeja…"}
            </p>
          </div>
          {funcionario?.rol === "EVALUADOR" ? (
            <span className="badge badge-evaluador">Vista de evaluador</span>
          ) : (
            <span className="badge badge-supervisor">Vista completa</span>
          )}
        </div>

        {lista.cargando && !lista.data ? (
          <Cargando texto="Cargando solicitudes…" />
        ) : lista.data && lista.data.items.length === 0 ? (
          <EstadoVacio
            icono="carpeta"
            titulo="No hay solicitudes con estos filtros"
            descripcion="Prueba con otro estado, distrito o término de búsqueda."
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
            <TablaSolicitudes items={lista.data.items} />
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
