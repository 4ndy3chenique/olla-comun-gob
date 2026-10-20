import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import {
  duracion,
  etiquetaEstado,
  nombreCompleto,
  porcentaje,
} from "../lib/format";
import type { Resumen, SincronizacionPendiente } from "../types/api";
import { Alerta } from "../components/ui/Alerta";
import { BarraDato } from "../components/ui/BarraDato";
import { Cargando } from "../components/ui/Cargando";
import { EstadoVacio } from "../components/ui/EstadoVacio";
import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { TablaSolicitudes } from "../components/solicitudes/TablaSolicitudes";

interface PendientesSync {
  items: SincronizacionPendiente[];
  total: number;
}

const TONOS_ESTADO = {
  PENDIENTE: "info",
  EN_EVALUACION: "accent",
  OBSERVADA: "accent",
  APTA: "success",
  NO_APTA: "danger",
} as const;

export default function DashboardPage() {
  const { funcionario, tieneRol } = useAuth();
  const resumen = useApi<Resumen>("/estado/solicitudes/resumen");
  const pendientes = useApi<PendientesSync>(
    tieneRol("ADMINISTRADOR") ? "/estado/sincronizacion/pendientes" : null,
  );

  const hora = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Lima",
      hour: "2-digit",
      hour12: false,
    }).format(new Date()),
  );
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
  const datos = resumen.data;
  const enProceso = datos
    ? datos.totales.pendiente + datos.totales.en_evaluacion + datos.totales.observada
    : 0;
  const esSupervisor = tieneRol("SUPERVISOR", "ADMINISTRADOR");

  return (
    <>
      <PageHeader
        eyebrow="Panel de control"
        titulo={`${saludo}, ${funcionario?.nombres ?? ""}`}
        descripcion="Resumen de la carga de postulaciones, cola de trabajo y estado general de la evaluación."
        acciones={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                resumen.recargar();
                pendientes.recargar();
              }}
              disabled={resumen.cargando}
            >
              <Icon nombre="refrescar" tamano={18} />
              {resumen.cargando ? "Actualizando…" : "Actualizar"}
            </button>
            <Link to="/solicitudes" className="btn-primary">
              <Icon nombre="carpeta" tamano={18} />
              Ir a la bandeja
            </Link>
          </>
        }
      />

      {resumen.error ? (
        <div className="mb-5">
          <Alerta tono="danger" titulo="No pudimos cargar el panel">
            {resumen.error.message}{" "}
            <button
              type="button"
              className="font-semibold underline underline-offset-2"
              onClick={resumen.recargar}
            >
              Reintentar
            </button>
          </Alerta>
        </div>
      ) : null}

      {tieneRol("ADMINISTRADOR") && pendientes.data && pendientes.data.total > 0 ? (
        <div className="mb-5">
          <Alerta tono="warning" titulo="Aprobaciones pendientes de sincronizar">
            Hay {pendientes.data.total} solicitud(es) APTA sin reflejo completo en la base
            operativa.{" "}
            <Link
              to="/solicitudes?estado=APTA"
              className="font-semibold underline underline-offset-2"
            >
              Revisar y reintentar
            </Link>
          </Alerta>
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores">
        <StatCard
          etiqueta="Solicitudes recibidas"
          valor={datos?.totales.total ?? 0}
          detalle={
            datos
              ? `${datos.corridas_evaluacion} corrida(s) de evaluación registradas`
              : undefined
          }
          icono="carpeta"
          tono="primary"
          cargando={resumen.cargando && !datos}
        />
        <StatCard
          etiqueta="En proceso"
          valor={enProceso}
          detalle={datos ? `${datos.cola.sin_asignar} sin asignar` : undefined}
          icono="reloj"
          tono="info"
          cargando={resumen.cargando && !datos}
        />
        <StatCard
          etiqueta="Aprobadas"
          valor={datos?.totales.apta ?? 0}
          detalle={datos ? `${porcentaje(datos.totales.apta, datos.totales.total)} del total` : undefined}
          icono="check-circulo"
          tono="success"
          cargando={resumen.cargando && !datos}
        />
        <StatCard
          etiqueta="No aptas"
          valor={datos?.totales.no_apta ?? 0}
          detalle={
            datos ? `${porcentaje(datos.totales.no_apta, datos.totales.total)} del total` : undefined
          }
          icono="x-circulo"
          tono="danger"
          cargando={resumen.cargando && !datos}
        />
      </section>

      {resumen.cargando && !datos ? (
        <div className="card mt-5">
          <Cargando texto="Cargando indicadores y cola de trabajo…" />
        </div>
      ) : null}

      {datos ? (
        <>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <section className="card" aria-labelledby="titulo-estados">
              <div className="card-header">
                <div>
                  <h2 id="titulo-estados" className="font-semibold text-ink">
                    Distribución por estado
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">
                    {datos.totales.total} solicitudes en la bandeja
                  </p>
                </div>
                <span className="badge badge-neutral">Vista general</span>
              </div>
              <div className="card-pad space-y-5">
                {datos.estados.map((estado) => (
                  <BarraDato
                    key={estado.estado}
                    etiqueta={etiquetaEstado(estado.estado)}
                    valor={estado.cantidad}
                    total={datos.totales.total}
                    tono={TONOS_ESTADO[estado.estado]}
                  />
                ))}
              </div>
            </section>

            <section className="card" aria-labelledby="titulo-cola">
              <div className="card-header">
                <div>
                  <h2 id="titulo-cola" className="font-semibold text-ink">
                    Cola de trabajo
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">
                    Prioriza las solicitudes con mayor antigüedad
                  </p>
                </div>
                <Icon nombre="reloj" tamano={20} className="text-muted" />
              </div>
              <div className="card-pad">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded border border-border bg-bg p-3">
                    <p className="text-xs text-muted">Hasta 24 h</p>
                    <p className="tabular mt-1 text-2xl font-bold text-info">
                      {datos.antiguedad_pendientes.menos_24h}
                    </p>
                  </div>
                  <div className="rounded border border-border bg-bg p-3">
                    <p className="text-xs text-muted">24–72 h</p>
                    <p className="tabular mt-1 text-2xl font-bold text-accent-dark">
                      {datos.antiguedad_pendientes.entre_24_72h}
                    </p>
                  </div>
                  <div className="rounded border border-border bg-bg p-3">
                    <p className="text-xs text-muted">Más de 72 h</p>
                    <p className="tabular mt-1 text-2xl font-bold text-danger">
                      {datos.antiguedad_pendientes.mas_72h}
                    </p>
                  </div>
                </div>

                <dl className="mt-5 divide-y divide-border border-y border-border text-sm">
                  <div className="flex items-center justify-between gap-4 py-2.5">
                    <dt className="text-muted">Sin asignar</dt>
                    <dd className="tabular font-semibold text-ink">{datos.cola.sin_asignar}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-2.5">
                    <dt className="text-muted">
                      {funcionario?.rol === "EVALUADOR" ? "Asignadas a ti" : "Tiempo promedio de evaluación"}
                    </dt>
                    <dd className="tabular font-semibold text-ink">
                      {funcionario?.rol === "EVALUADOR"
                        ? datos.cola.mias
                        : duracion(datos.promedio_evaluacion_ms)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-2.5">
                    <dt className="text-muted">Actualizado</dt>
                    <dd className="text-xs font-medium text-muted">
                      {new Intl.DateTimeFormat("es-PE", {
                        timeZone: "America/Lima",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(datos.generado_en))}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to={
                      funcionario?.rol === "EVALUADOR"
                        ? "/solicitudes"
                        : "/solicitudes?sin_asignar=1"
                    }
                    className="btn-secondary"
                  >
                    <Icon nombre="filtro" tamano={17} />
                    {funcionario?.rol === "EVALUADOR"
                      ? "Ver mi bandeja"
                      : "Ver solicitudes sin asignar"}
                  </Link>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <section className="card" aria-labelledby="titulo-distritos">
              <div className="card-header">
                <div>
                  <h2 id="titulo-distritos" className="font-semibold text-ink">
                    Distritos
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">Solicitudes por territorio</p>
                </div>
                <Icon nombre="mapa" tamano={20} className="text-muted" />
              </div>
              <div className="card-pad">
                {datos.distritos.length === 0 ? (
                  <p className="text-sm text-muted">Sin datos de distritos.</p>
                ) : (
                  <div className="space-y-4">
                    {datos.distritos.slice(0, 7).map((distrito) => (
                      <BarraDato
                        key={distrito.distrito}
                        etiqueta={distrito.distrito}
                        valor={distrito.cantidad}
                        total={datos.totales.total}
                        tono="primary"
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="card lg:col-span-2" aria-labelledby="titulo-equipo">
              <div className="card-header">
                <div>
                  <h2 id="titulo-equipo" className="font-semibold text-ink">
                    {esSupervisor ? "Carga del equipo evaluador" : "Orientaciones de tu bandeja"}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">
                    {esSupervisor
                      ? "Asignaciones y resultados por evaluador"
                      : "Tu alcance como evaluador"}
                  </p>
                </div>
                <Icon nombre="usuarios" tamano={20} className="text-muted" />
              </div>

              {esSupervisor ? (
                datos.evaluadores.length === 0 ? (
                  <EstadoVacio
                    icono="usuarios"
                    titulo="Sin evaluadores activos"
                    descripcion="Crea o activa funcionarios con rol EVALUADOR para asignar solicitudes."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table-base min-w-[620px]">
                      <caption className="sr-only">Carga de trabajo por evaluador</caption>
                      <thead>
                        <tr>
                          <th scope="col">Evaluador</th>
                          <th scope="col" className="text-right">Asignadas</th>
                          <th scope="col" className="text-right">En cola</th>
                          <th scope="col" className="text-right">Aprobadas</th>
                          <th scope="col" className="text-right">Rechazadas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {datos.evaluadores.map((evaluador) => (
                          <tr key={evaluador.id}>
                            <td className="font-medium text-ink">
                              {nombreCompleto(evaluador.nombres, evaluador.apellidos)}
                            </td>
                            <td className="tabular text-right">{evaluador.asignadas}</td>
                            <td className="tabular text-right">
                              <span className={evaluador.en_cola > 0 ? "font-semibold text-accent-dark" : ""}>
                                {evaluador.en_cola}
                              </span>
                            </td>
                            <td className="tabular text-right text-success">{evaluador.aprobadas}</td>
                            <td className="tabular text-right text-danger">{evaluador.rechazadas}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                <div className="card-pad">
                  <div className="flex gap-3">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-info-light text-info">
                      <Icon nombre="info" tamano={22} />
                    </span>
                    <div className="text-sm leading-6 text-muted">
                      <p className="font-semibold text-ink">
                        {datos.cola.mias} solicitud(es) asignadas a ti
                      </p>
                      <p className="mt-1">
                        Puedes evaluar y decidir únicamente las solicitudes asignadas a tu
                        usuario. Las solicitudes sin asignar aparecen en la bandeja en modo
                        lectura hasta que un supervisor te las asigne.
                      </p>
                      <Link to="/solicitudes" className="btn-secondary mt-4">
                        Revisar mi bandeja
                        <Icon nombre="chevron-derecha" tamano={17} />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          <section className="card mt-5" aria-labelledby="titulo-recientes">
            <div className="card-header">
              <div>
                <h2 id="titulo-recientes" className="font-semibold text-ink">
                  Solicitudes recientes
                </h2>
                <p className="mt-0.5 text-xs text-muted">Últimos registros recibidos</p>
              </div>
              <Link to="/solicitudes" className="btn-ghost text-xs">
                Ver todas
                <Icon nombre="chevron-derecha" tamano={16} />
              </Link>
            </div>
            {datos.recientes.length === 0 ? (
              <EstadoVacio
                titulo="Aún no hay solicitudes"
                descripcion="Cuando la PWA registre postulaciones aparecerán en esta bandeja."
              />
            ) : (
              <TablaSolicitudes items={datos.recientes} compacta />
            )}
          </section>
        </>
      ) : null}
    </>
  );
}
