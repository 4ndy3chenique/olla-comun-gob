import { useApi } from "../hooks/useApi";
import { descargarCsv } from "../lib/csv";
import {
  decimal,
  etiquetaEstado,
  etiquetaGuia,
  fecha,
  numeroHumano,
  porcentaje,
} from "../lib/format";
import type { Cobertura, Kpi } from "../types/api";
import { Alerta } from "../components/ui/Alerta";
import { BarraDato } from "../components/ui/BarraDato";
import { Cargando } from "../components/ui/Cargando";
import { EstadoVacio } from "../components/ui/EstadoVacio";
import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";

const TONOS_ESTADO = {
  PENDIENTE: "info",
  EN_EVALUACION: "accent",
  OBSERVADA: "accent",
  APTA: "success",
  NO_APTA: "danger",
} as const;

function suma(valores: number[]): number {
  return valores.reduce((total, valor) => total + valor, 0);
}

export default function ReportesPage() {
  const kpis = useApi<{ items: Kpi[] }>("/estado/kpis");
  const cobertura = useApi<Cobertura>("/estado/reportes/cobertura");

  const datos = cobertura.data;
  const listaKpis = kpis.data?.items ?? [];
  const totalSolicitudes = datos
    ? suma(datos.solicitudes_por_distrito.map((item) => item.solicitudes))
    : 0;
  const totalOllas = datos ? suma(datos.ollas_por_distrito.map((item) => item.ollas)) : 0;
  const totalBeneficiarios = datos
    ? suma(datos.ollas_por_distrito.map((item) => item.beneficiarios_activos))
    : 0;
  const totalGuias = datos ? suma(datos.guias_por_estado.map((item) => item.cantidad)) : 0;
  const totalEstados = datos
    ? suma(datos.solicitudes_por_estado.map((item) => item.cantidad))
    : 0;

  function exportarKpis() {
    descargarCsv(
      "kpis",
      listaKpis.map((kpi) => ({
        codigo: kpi.codigo_kpi,
        subsistema: kpi.subsistema,
        valor: kpi.valor,
        unidad: kpi.unidad,
        meta: kpi.meta_diseno,
        valor_anterior: kpi.valor_anterior ?? "",
        delta: kpi.delta ?? "",
        cumple: kpi.cumple_meta ? "Sí" : "No",
        fecha: kpi.fecha_medicion,
      })),
      [
        { clave: "codigo", titulo: "Código KPI" },
        { clave: "subsistema", titulo: "Subsistema" },
        { clave: "valor", titulo: "Valor" },
        { clave: "unidad", titulo: "Unidad" },
        { clave: "meta", titulo: "Meta de diseño" },
        { clave: "valor_anterior", titulo: "Valor anterior" },
        { clave: "delta", titulo: "Variación" },
        { clave: "cumple", titulo: "Cumple meta" },
        { clave: "fecha", titulo: "Fecha de medición" },
      ],
    );
  }

  function exportarCobertura() {
    if (!datos) return;
    descargarCsv(
      "cobertura-territorial",
      datos.solicitudes_por_distrito.map((fila) => ({
        distrito: fila.distrito,
        solicitudes: fila.solicitudes,
        aptas: fila.aptas,
        no_aptas: fila.no_aptas,
        personas_declaradas: fila.personas_declaradas,
      })),
      [
        { clave: "distrito", titulo: "Distrito" },
        { clave: "solicitudes", titulo: "Solicitudes" },
        { clave: "aptas", titulo: "Aptas" },
        { clave: "no_aptas", titulo: "No aptas" },
        { clave: "personas_declaradas", titulo: "Personas declaradas" },
      ],
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Monitoreo"
        titulo="Reportes y KPIs"
        descripcion="Indicadores de focalización y cobertura territorial de las postulaciones y de la operación de ollas comunes."
        acciones={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                kpis.recargar();
                cobertura.recargar();
              }}
              disabled={kpis.cargando || cobertura.cargando}
            >
              <Icon nombre="refrescar" tamano={18} />
              {kpis.cargando || cobertura.cargando ? "Actualizando…" : "Actualizar"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={exportarKpis}
              disabled={listaKpis.length === 0}
            >
              <Icon nombre="descargar" tamano={18} />
              Exportar KPIs
            </button>
          </>
        }
      />

      {kpis.error ? (
        <div className="mb-5">
          <Alerta tono="danger" titulo="No pudimos cargar los KPIs">
            {kpis.error.message}{" "}
            <button
              type="button"
              className="font-semibold underline underline-offset-2"
              onClick={kpis.recargar}
            >
              Reintentar
            </button>
          </Alerta>
        </div>
      ) : null}

      {cobertura.error ? (
        <div className="mb-5">
          <Alerta tono="danger" titulo="No pudimos cargar la cobertura">
            {cobertura.error.message}{" "}
            <button
              type="button"
              className="font-semibold underline underline-offset-2"
              onClick={cobertura.recargar}
            >
              Reintentar
            </button>
          </Alerta>
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumen de cobertura">
        <StatCard
          etiqueta="Solicitudes registradas"
          valor={numeroHumano(totalSolicitudes)}
          detalle={`${numeroHumano(totalEstados)} con estado registrado`}
          icono="carpeta"
          tono="primary"
          cargando={cobertura.cargando && !datos}
        />
        <StatCard
          etiqueta="Ollas comunes"
          valor={numeroHumano(totalOllas)}
          detalle="En la base operativa central"
          icono="edificio"
          tono="info"
          cargando={cobertura.cargando && !datos}
        />
        <StatCard
          etiqueta="Beneficiarios activos"
          valor={numeroHumano(totalBeneficiarios)}
          detalle="Padrón vigente en la base operativa"
          icono="usuarios"
          tono="success"
          cargando={cobertura.cargando && !datos}
        />
        <StatCard
          etiqueta="Guías de despacho"
          valor={numeroHumano(totalGuias)}
          detalle="Todos los estados logísticos"
          icono="camion"
          tono="accent"
          cargando={cobertura.cargando && !datos}
        />
      </section>

      <section className="card mt-5 overflow-hidden" aria-labelledby="titulo-kpis">
        <div className="card-header">
          <div>
            <h2 id="titulo-kpis" className="font-semibold text-ink">
              Indicadores de desempeño
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Última medición disponible por cada KPI
            </p>
          </div>
          <span className="badge badge-neutral">Solo lectura</span>
        </div>

        {kpis.cargando && !kpis.data ? (
          <Cargando texto="Cargando indicadores…" />
        ) : listaKpis.length === 0 ? (
          <EstadoVacio
            icono="grafico"
            titulo="Sin mediciones de KPI"
            descripcion="Aún no hay mediciones registradas en la base operativa."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base min-w-[900px]">
              <caption className="sr-only">Indicadores clave de desempeño</caption>
              <thead>
                <tr>
                  <th scope="col">KPI</th>
                  <th scope="col">Subsistema</th>
                  <th scope="col" className="text-right">Valor</th>
                  <th scope="col">Meta de diseño</th>
                  <th scope="col" className="text-right">Variación</th>
                  <th scope="col">Cumplimiento</th>
                  <th scope="col">Medición</th>
                </tr>
              </thead>
              <tbody>
                {listaKpis.map((kpi) => (
                  <tr key={kpi.codigo_kpi}>
                    <td className="font-semibold text-ink">{kpi.codigo_kpi}</td>
                    <td className="text-muted">{kpi.subsistema}</td>
                    <td className="tabular text-right font-semibold text-ink">
                      {decimal(kpi.valor, 2)}{" "}
                      <span className="text-xs font-normal text-muted">{kpi.unidad}</span>
                    </td>
                    <td className="text-sm text-muted">{kpi.meta_diseno}</td>
                    <td
                      className={`tabular text-right text-sm font-medium ${
                        kpi.delta === null
                          ? "text-muted"
                          : kpi.delta >= 0
                            ? "text-success"
                            : "text-danger"
                      }`}
                    >
                      {kpi.delta === null
                        ? "—"
                        : `${kpi.delta > 0 ? "+" : ""}${decimal(kpi.delta, 2)}`}
                    </td>
                    <td>
                      <span className={kpi.cumple_meta ? "badge badge-apta" : "badge badge-no-apta"}>
                        {kpi.cumple_meta ? "Cumple" : "No cumple"}
                      </span>
                    </td>
                    <td className="tabular text-xs text-muted">{fecha(kpi.fecha_medicion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="card" aria-labelledby="titulo-por-estado">
          <div className="card-header">
            <div>
              <h2 id="titulo-por-estado" className="font-semibold text-ink">
                Solicitudes por estado
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                Distribución de la bandeja de postulaciones
              </p>
            </div>
            <Icon nombre="filtro" tamano={20} className="text-muted" />
          </div>
          <div className="card-pad">
            {datos && datos.solicitudes_por_estado.length > 0 ? (
              <div className="space-y-5">
                {datos.solicitudes_por_estado.map((fila) => (
                  <BarraDato
                    key={fila.estado}
                    etiqueta={etiquetaEstado(fila.estado)}
                    valor={fila.cantidad}
                    total={totalEstados}
                    tono={TONOS_ESTADO[fila.estado as keyof typeof TONOS_ESTADO] ?? "primary"}
                    detalle={`${numeroHumano(fila.personas_declaradas)} personas`}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Sin datos de solicitudes por estado.</p>
            )}
          </div>
        </section>

        <section className="card" aria-labelledby="titulo-guias-estado">
          <div className="card-header">
            <div>
              <h2 id="titulo-guias-estado" className="font-semibold text-ink">
                Guías por estado logístico
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                Flujo de despacho en la base operativa
              </p>
            </div>
            <Icon nombre="camion" tamano={20} className="text-muted" />
          </div>
          <div className="card-pad">
            {datos && datos.guias_por_estado.length > 0 ? (
              <div className="space-y-5">
                {datos.guias_por_estado.map((fila) => (
                  <BarraDato
                    key={fila.estado_fsm}
                    etiqueta={etiquetaGuia(fila.estado_fsm)}
                    valor={fila.cantidad}
                    total={totalGuias}
                    tono="info"
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Sin guías registradas en la base operativa.</p>
            )}
          </div>
        </section>
      </div>

      <section className="card mt-5 overflow-hidden" aria-labelledby="titulo-distritos-reporte">
        <div className="card-header">
          <div>
            <h2 id="titulo-distritos-reporte" className="font-semibold text-ink">
              Cobertura por distrito
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Postulaciones, resultados y ollas registradas por territorio
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={exportarCobertura}
            disabled={!datos || datos.solicitudes_por_distrito.length === 0}
          >
            <Icon nombre="descargar" tamano={17} />
            Exportar cobertura
          </button>
        </div>

        {cobertura.cargando && !datos ? (
          <Cargando texto="Cargando cobertura territorial…" />
        ) : !datos || datos.solicitudes_por_distrito.length === 0 ? (
          <EstadoVacio
            icono="mapa"
            titulo="Sin datos territoriales"
            descripcion="Las postulaciones con distrito registrado aparecerán en esta tabla."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base min-w-[760px]">
              <caption className="sr-only">Cobertura de postulaciones por distrito</caption>
              <thead>
                <tr>
                  <th scope="col">Distrito</th>
                  <th scope="col" className="text-right">Solicitudes</th>
                  <th scope="col" className="text-right">Aptas</th>
                  <th scope="col" className="text-right">No aptas</th>
                  <th scope="col" className="text-right">Personas declaradas</th>
                  <th scope="col" className="text-right">Tasa de aprobación</th>
                </tr>
              </thead>
              <tbody>
                {datos.solicitudes_por_distrito.map((fila) => (
                  <tr key={fila.distrito}>
                    <td className="font-medium text-ink">{fila.distrito}</td>
                    <td className="tabular text-right text-ink">{numeroHumano(fila.solicitudes)}</td>
                    <td className="tabular text-right text-success">{numeroHumano(fila.aptas)}</td>
                    <td className="tabular text-right text-danger">
                      {numeroHumano(fila.no_aptas)}
                    </td>
                    <td className="tabular text-right text-muted">
                      {numeroHumano(fila.personas_declaradas)}
                    </td>
                    <td className="tabular text-right text-ink">
                      {fila.solicitudes > 0
                        ? porcentaje(fila.aptas, fila.solicitudes)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card mt-5 overflow-hidden" aria-labelledby="titulo-ollas-distrito">
        <div className="card-header">
          <div>
            <h2 id="titulo-ollas-distrito" className="font-semibold text-ink">
              Ollas y beneficiarios por distrito
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Presencia operativa registrada en la base central
            </p>
          </div>
          <span className="badge badge-neutral">{numeroHumano(totalOllas)} ollas</span>
        </div>

        {cobertura.cargando && !datos ? (
          <Cargando texto="Cargando ollas por distrito…" />
        ) : !datos || datos.ollas_por_distrito.length === 0 ? (
          <EstadoVacio
            icono="edificio"
            titulo="Sin ollas registradas"
            descripcion="Las ollas aprobadas y sincronizadas aparecerán en esta sección."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base min-w-[620px]">
              <caption className="sr-only">Ollas y beneficiarios por distrito</caption>
              <thead>
                <tr>
                  <th scope="col">Distrito</th>
                  <th scope="col" className="text-right">Ollas</th>
                  <th scope="col" className="text-right">Ollas aptas</th>
                  <th scope="col" className="text-right">Beneficiarios activos</th>
                </tr>
              </thead>
              <tbody>
                {datos.ollas_por_distrito.map((fila) => (
                  <tr key={fila.distrito}>
                    <td className="font-medium text-ink">{fila.distrito}</td>
                    <td className="tabular text-right text-ink">{numeroHumano(fila.ollas)}</td>
                    <td className="tabular text-right text-success">{numeroHumano(fila.aptas)}</td>
                    <td className="tabular text-right text-ink">
                      {numeroHumano(fila.beneficiarios_activos)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
