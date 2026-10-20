import { useState, type ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { api, ApiError, mensajeError } from "../lib/api";
import {
  claseAptitud,
  claseEstadoSolicitud,
  decimal,
  duracion,
  etiquetaAccion,
  etiquetaAptitud,
  etiquetaDecision,
  etiquetaEstado,
  etiquetaNotificacion,
  fecha,
  fechaHora,
  nombreCompleto,
  numeroHumano,
} from "../lib/format";
import type {
  Decision,
  Evaluacion,
  EvaluadorOpcion,
  ResultadoDecision,
  ResultadoEvaluacion,
  ResultadoSincronizacion,
  SolicitudDetalle,
} from "../types/api";
import { Alerta } from "../components/ui/Alerta";
import { Cargando } from "../components/ui/Cargando";
import { EstadoVacio } from "../components/ui/EstadoVacio";
import { Icon, type NombreIcono } from "../components/ui/Icon";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/PageHeader";

type Pestana =
  | "resumen"
  | "integrantes"
  | "evaluacion"
  | "decisiones"
  | "bitacora"
  | "notificaciones";

const PESTANAS: Array<{ id: Pestana; etiqueta: string; icono: NombreIcono }> = [
  { id: "resumen", etiqueta: "Resumen", icono: "documento" },
  { id: "integrantes", etiqueta: "Integrantes", icono: "usuarios" },
  { id: "evaluacion", etiqueta: "Evaluación", icono: "balanza" },
  { id: "decisiones", etiqueta: "Decisiones", icono: "portapapeles" },
  { id: "bitacora", etiqueta: "Bitácora", icono: "escudo" },
  { id: "notificaciones", etiqueta: "Notificaciones", icono: "campana" },
];

interface Aviso {
  tono: "success" | "warning" | "info" | "danger";
  titulo: string;
  texto: string;
}

interface ListaEvaluadores {
  items: EvaluadorOpcion[];
  total: number;
}

const CLASE_DECISION: Record<Decision, string> = {
  APROBAR: "badge badge-apta",
  OBSERVAR: "badge badge-observada",
  RECHAZAR: "badge badge-no-apta",
};

function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{etiqueta}</dt>
      <dd className="mt-1 text-sm leading-6 text-ink">{children}</dd>
    </div>
  );
}

function MensajeError({ texto }: { texto: string }) {
  return (
    <div className="mb-4">
      <Alerta tono="danger">{texto}</Alerta>
    </div>
  );
}

function ResumenEvaluacion({ evaluacion }: { evaluacion: Evaluacion }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <span className={claseAptitud(evaluacion.resultado_reniec)}>
          RENIEC: {etiquetaAptitud(evaluacion.resultado_reniec)}
        </span>
        <span className={claseAptitud(evaluacion.resultado_sisfoh)}>
          SISFOH: {etiquetaAptitud(evaluacion.resultado_sisfoh)}
        </span>
        <span className={claseAptitud(evaluacion.aptitud_automatica)}>
          {etiquetaAptitud(evaluacion.aptitud_automatica)}
        </span>
      </div>
      <dl className="grid gap-3 sm:grid-cols-3">
        <Dato etiqueta="Integrantes validados">
          <span className="tabular font-semibold">
            {numeroHumano(evaluacion.integrantes_validados)}
          </span>
        </Dato>
        <Dato etiqueta="Duración">
          <span className="tabular">{duracion(evaluacion.tiempo_evaluacion_ms)}</span>
        </Dato>
        <Dato etiqueta="Evaluado por">
          {evaluacion.funcionario_nombres
            ? nombreCompleto(
                evaluacion.funcionario_nombres,
                evaluacion.funcionario_apellidos ?? "",
              )
            : "Sistema"}
        </Dato>
      </dl>
      {evaluacion.motivos.length > 0 ? (
        <div className="rounded border border-accent/30 bg-accent-light p-3 text-sm text-accent-dark">
          <p className="font-semibold">Observaciones automáticas</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {evaluacion.motivos.map((motivo) => (
              <li key={motivo}>{motivo}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded border border-success/25 bg-success-light p-3 text-sm text-success">
          <Icon nombre="check-circulo" tamano={18} />
          La evaluación no registra observaciones automáticas.
        </div>
      )}
    </div>
  );
}

export default function SolicitudDetallePage() {
  const { id } = useParams<{ id: string }>();
  const idSolicitud = Number(id);
  const idValido = Number.isInteger(idSolicitud) && idSolicitud > 0;
  const detalle = useApi<SolicitudDetalle>(
    idValido ? `/estado/solicitudes/${idSolicitud}` : null,
  );
  const [params, setParams] = useSearchParams();
  const parametroPestana = params.get("tab");
  const pestana: Pestana = PESTANAS.some((item) => item.id === parametroPestana)
    ? (parametroPestana as Pestana)
    : "resumen";

  const [aviso, setAviso] = useState<Aviso | null>(null);

  const [modalAsignar, setModalAsignar] = useState(false);
  const [evaluadorId, setEvaluadorId] = useState("");
  const [asignando, setAsignando] = useState(false);
  const [errorAsignar, setErrorAsignar] = useState<string | null>(null);
  const evaluadores = useApi<ListaEvaluadores>(modalAsignar ? "/estado/evaluadores" : null);

  const [modalEvaluar, setModalEvaluar] = useState(false);
  const [evaluando, setEvaluando] = useState(false);
  const [errorEvaluar, setErrorEvaluar] = useState<string | null>(null);
  const [resultadoEvaluacion, setResultadoEvaluacion] =
    useState<ResultadoEvaluacion | null>(null);

  const [modalDecision, setModalDecision] = useState(false);
  const [decision, setDecision] = useState<Decision>("APROBAR");
  const [observaciones, setObservaciones] = useState("");
  const [decidiendo, setDecidiendo] = useState(false);
  const [errorDecision, setErrorDecision] = useState<string | null>(null);

  const [modalSincronizar, setModalSincronizar] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [errorSincronizar, setErrorSincronizar] = useState<string | null>(null);

  const datos = detalle.data;
  const ultimaEvaluacion = datos?.evaluaciones[0];
  const asignacion = datos?.asignaciones[0];
  const puedeAprobar = Boolean(
    ultimaEvaluacion &&
      ultimaEvaluacion.resultado_reniec !== "INVALIDO" &&
      (ultimaEvaluacion.integrantes_validados ?? 0) > 0,
  );

  function cambiarPestana(siguiente: Pestana) {
    const consulta = new URLSearchParams(params);
    consulta.set("tab", siguiente);
    setParams(consulta, { replace: true });
  }

  function abrirAsignacion() {
    setEvaluadorId(datos?.evaluador ? String(datos.evaluador.id) : "");
    setErrorAsignar(null);
    setModalAsignar(true);
  }

  function abrirEvaluacion() {
    setErrorEvaluar(null);
    setResultadoEvaluacion(null);
    setModalEvaluar(true);
  }

  function abrirDecision() {
    setDecision(puedeAprobar ? "APROBAR" : "OBSERVAR");
    setObservaciones("");
    setErrorDecision(null);
    setModalDecision(true);
  }

  function abrirSincronizacion() {
    setErrorSincronizar(null);
    setModalSincronizar(true);
  }

  async function confirmarAsignacion(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!evaluadorId) {
      setErrorAsignar("Selecciona un evaluador activo.");
      return;
    }
    setAsignando(true);
    setErrorAsignar(null);
    try {
      await api(`/estado/solicitudes/${idSolicitud}/asignar`, {
        method: "POST",
        body: { evaluador_id: Number(evaluadorId) },
      });
      setModalAsignar(false);
      detalle.recargar();
      setAviso({
        tono: "success",
        titulo: "Evaluador asignado",
        texto: "La asignación quedó registrada en la bitácora de la solicitud.",
      });
    } catch (fallo) {
      setErrorAsignar(mensajeError(fallo));
    } finally {
      setAsignando(false);
    }
  }

  async function confirmarEvaluacion() {
    setEvaluando(true);
    setErrorEvaluar(null);
    try {
      const resultado = await api<ResultadoEvaluacion>(
        `/estado/solicitudes/${idSolicitud}/evaluar`,
        { method: "POST" },
      );
      setResultadoEvaluacion(resultado);
      detalle.recargar();
      setAviso({
        tono: resultado.evaluacion.aptitud_automatica === "APTA" ? "success" : "warning",
        titulo: "Evaluación registrada",
        texto:
          resultado.evaluacion.aptitud_automatica === "APTA"
            ? "La evaluación automática califica como apta. Revisa el detalle antes de decidir."
            : "La evaluación requiere revisión. Revisa los motivos antes de decidir.",
      });
    } catch (fallo) {
      setErrorEvaluar(mensajeError(fallo));
    } finally {
      setEvaluando(false);
    }
  }

  async function confirmarDecision(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (decision !== "APROBAR" && !observaciones.trim()) {
      setErrorDecision("Indica el motivo de la observación o del rechazo.");
      return;
    }
    setDecidiendo(true);
    setErrorDecision(null);
    try {
      const resultado = await api<ResultadoDecision>(
        `/estado/solicitudes/${idSolicitud}/decision`,
        {
          method: "POST",
          body: { decision, observaciones: observaciones.trim() || null },
        },
      );
      setModalDecision(false);
      detalle.recargar();
      if (resultado.sincronizacion_pendiente) {
        setAviso({
          tono: "warning",
          titulo: "Decisión registrada con sincronización pendiente",
          texto:
            resultado.mensaje ??
            "La olla no se pudo reflejar en la base operativa. Un administrador puede reintentar.",
        });
      } else if (decision === "APROBAR") {
        setAviso({
          tono: "success",
          titulo: "Solicitud aprobada",
          texto: "La asignación y la olla en la base operativa quedaron actualizadas.",
        });
      } else {
        setAviso({
          tono: decision === "OBSERVAR" ? "info" : "danger",
          titulo: decision === "OBSERVAR" ? "Solicitud observada" : "Solicitud rechazada",
          texto: "La decisión quedó registrada y se notificó al solicitante.",
        });
      }
    } catch (fallo) {
      if (fallo instanceof ApiError && fallo.errores.observaciones) {
        setErrorDecision(fallo.errores.observaciones);
      } else {
        setErrorDecision(mensajeError(fallo));
      }
    } finally {
      setDecidiendo(false);
    }
  }

  async function confirmarSincronizacion() {
    setSincronizando(true);
    setErrorSincronizar(null);
    try {
      const resultado = await api<ResultadoSincronizacion>(
        `/estado/solicitudes/${idSolicitud}/sincronizar-olla`,
        { method: "POST" },
      );
      setModalSincronizar(false);
      detalle.recargar();
      setAviso({
        tono: resultado.sincronizacion_pendiente ? "warning" : "success",
        titulo: resultado.sincronizacion_pendiente
          ? "Sincronización pendiente"
          : "Olla sincronizada",
        texto: resultado.mensaje,
      });
    } catch (fallo) {
      setErrorSincronizar(mensajeError(fallo));
    } finally {
      setSincronizando(false);
    }
  }

  if (!idValido) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <Alerta tono="danger" titulo="Solicitud no encontrada">
          El identificador de la solicitud no es válido.{" "}
          <Link to="/solicitudes" className="font-semibold underline underline-offset-2">
            Volver a la bandeja
          </Link>
        </Alerta>
      </div>
    );
  }

  if (detalle.cargando && !datos) {
    return (
      <div className="card">
        <Cargando texto="Cargando expediente de la solicitud…" />
      </div>
    );
  }

  if (detalle.error || !datos) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <Alerta tono="danger" titulo="No pudimos cargar la solicitud">
          {detalle.error?.status === 404
            ? "La solicitud no existe o no está asignada a tu usuario."
            : (detalle.error?.message ?? "No encontramos la solicitud indicada.")}{" "}
          <button
            type="button"
            className="font-semibold underline underline-offset-2"
            onClick={detalle.recargar}
          >
            Reintentar
          </button>
        </Alerta>
        <Link to="/solicitudes" className="btn-secondary mt-4">
          <Icon nombre="flecha-izquierda" tamano={18} />
          Volver a la bandeja
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <Link to="/solicitudes" className="btn-ghost -ml-4 text-sm">
          <Icon nombre="flecha-izquierda" tamano={18} />
          Volver a la bandeja
        </Link>
      </div>

      <PageHeader
        eyebrow={`Solicitud #${datos.id}`}
        titulo={datos.olla_nombre}
        descripcion={`${datos.distrito} · Registrada el ${fecha(datos.fecha_solicitud)} · ${datos.total_integrantes} integrante(s) en el padrón`}
        acciones={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={detalle.recargar}
              disabled={detalle.cargando}
            >
              <Icon nombre="refrescar" tamano={18} />
              {detalle.cargando ? "Actualizando…" : "Actualizar"}
            </button>
            {datos.puede.sincronizar ? (
              <button type="button" className="btn-secondary" onClick={abrirSincronizacion}>
                <Icon nombre="refrescar" tamano={18} />
                Sincronizar olla
              </button>
            ) : null}
            {datos.puede.asignar ? (
              <button type="button" className="btn-secondary" onClick={abrirAsignacion}>
                <Icon nombre="usuarios" tamano={18} />
                Asignar evaluador
              </button>
            ) : null}
            {datos.puede.evaluar ? (
              <button type="button" className="btn-secondary" onClick={abrirEvaluacion}>
                <Icon nombre="balanza" tamano={18} />
                Ejecutar evaluación
              </button>
            ) : null}
            {datos.puede.decidir ? (
              <button type="button" className="btn-primary" onClick={abrirDecision}>
                <Icon nombre="portapapeles" tamano={18} />
                Registrar decisión
              </button>
            ) : null}
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className={claseEstadoSolicitud(datos.estado)}>
          {etiquetaEstado(datos.estado)}
        </span>
        <span className="badge badge-neutral">
          <Icon nombre="mapa" tamano={13} />
          {datos.distrito}
        </span>
        <span className="badge badge-neutral">
          <Icon nombre="usuario" tamano={13} />
          {datos.evaluador
            ? nombreCompleto(datos.evaluador.nombres, datos.evaluador.apellidos)
            : "Sin evaluador asignado"}
        </span>
        {datos.olla_central ? (
          <span className="badge badge-apta">
            <Icon nombre="check" tamano={13} />
            Sincronizada con la base operativa
          </span>
        ) : datos.estado === "APTA" ? (
          <span className="badge badge-observada">
            <Icon nombre="alerta" tamano={13} />
            Sincronización pendiente
          </span>
        ) : null}
      </div>

      {aviso ? (
        <div className="mb-5">
          <Alerta tono={aviso.tono} titulo={aviso.titulo}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <span>{aviso.texto}</span>
              <button
                type="button"
                className="text-xs font-semibold underline underline-offset-2"
                onClick={() => setAviso(null)}
              >
                Cerrar
              </button>
            </div>
          </Alerta>
        </div>
      ) : null}

      <div className="card mb-5 overflow-hidden">
        <div className="overflow-x-auto border-b border-border">
          <div className="flex min-w-max px-3 sm:px-5" role="tablist" aria-label="Secciones de la solicitud">
            {PESTANAS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`tab-${item.id}`}
                aria-selected={pestana === item.id}
                aria-controls={`panel-${item.id}`}
                className={`tab mx-1 gap-2 ${pestana === item.id ? "tab-active" : ""}`}
                onClick={() => cambiarPestana(item.id)}
              >
                <Icon nombre={item.icono} tamano={17} />
                {item.etiqueta}
              </button>
            ))}
          </div>
        </div>

        <div
          className="card-pad"
          role="tabpanel"
          id={`panel-${pestana}`}
          aria-labelledby={`tab-${pestana}`}
        >
          {pestana === "resumen" ? (
            <div className="grid gap-6 lg:grid-cols-3">
              <section className="lg:col-span-2" aria-labelledby="datos-olla">
                <h2 id="datos-olla" className="mb-4 text-base font-semibold text-ink">
                  Datos de la olla común
                </h2>
                <dl className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Dato etiqueta="Dirección">{datos.direccion}</Dato>
                  </div>
                  <Dato etiqueta="Distrito">{datos.distrito}</Dato>
                  <Dato etiqueta="Fecha de fundación">{fecha(datos.fecha_fundacion)}</Dato>
                  <Dato etiqueta="Personas declaradas">
                    <span className="tabular">{numeroHumano(datos.num_personas_declaradas)}</span>
                  </Dato>
                  <Dato etiqueta="Integrantes registrados">
                    <span className="tabular">{numeroHumano(datos.total_integrantes)}</span>
                  </Dato>
                  <Dato etiqueta="Fecha de solicitud">{fechaHora(datos.fecha_solicitud)}</Dato>
                  <Dato etiqueta="Última actualización de evaluación">
                    {datos.ultima_evaluacion ? fechaHora(datos.ultima_evaluacion) : "Sin evaluaciones"}
                  </Dato>
                </dl>

                {asignacion ? (
                  <div className="mt-6 rounded-lg border border-success/25 bg-success-light p-4">
                    <div className="flex items-start gap-3">
                      <Icon nombre="check-circulo" tamano={22} className="mt-0.5 shrink-0 text-success" />
                      <div className="min-w-0">
                        <p className="font-semibold text-success">Asignación vigente</p>
                        <dl className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                          <div>
                            <dt className="text-xs text-success/80">Integrantes</dt>
                            <dd className="tabular mt-0.5 font-bold text-ink">
                              {numeroHumano(asignacion.num_integrantes_aprobados)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-success/80">Kcal totales</dt>
                            <dd className="tabular mt-0.5 font-bold text-ink">
                              {decimal(asignacion.kcal_total_asignado, 0)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-success/80">Kg de insumos</dt>
                            <dd className="tabular mt-0.5 font-bold text-ink">
                              {decimal(asignacion.kg_insumos_asignado, 2)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-success/80">Porciones diarias</dt>
                            <dd className="tabular mt-0.5 font-bold text-ink">
                              {numeroHumano(asignacion.porciones_diarias)}
                            </dd>
                          </div>
                        </dl>
                        <p className="mt-3 text-xs text-success/90">
                          Calculada el {fechaHora(asignacion.fecha_asignacion)} con los parámetros
                          vigentes al momento de la decisión.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </section>

              <aside className="space-y-5">
                <section className="rounded border border-border bg-bg p-4" aria-labelledby="titulo-dirigente">
                  <h2 id="titulo-dirigente" className="text-sm font-semibold text-ink">
                    Dirigente
                  </h2>
                  <p className="mt-2 font-medium text-ink">
                    {nombreCompleto(datos.dirigente_nombres, datos.dirigente_apellidos)}
                  </p>
                  <p className="tabular mt-1 text-sm text-muted">
                    DNI {datos.dirigente_dni_completo}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted">
                    Dato visible solo en el expediente institucional. No se comparte con terceros.
                  </p>
                </section>

                <section className="rounded border border-border bg-bg p-4" aria-labelledby="titulo-asignacion">
                  <h2 id="titulo-asignacion" className="text-sm font-semibold text-ink">
                    Asignación de evaluador
                  </h2>
                  {datos.evaluador ? (
                    <>
                      <p className="mt-2 font-medium text-ink">
                        {nombreCompleto(datos.evaluador.nombres, datos.evaluador.apellidos)}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        Asignada el {fechaHora(datos.fecha_asignacion)}
                      </p>
                      {datos.asignado_por ? (
                        <p className="mt-1 text-xs text-muted">
                          Por {nombreCompleto(datos.asignado_por.nombres, datos.asignado_por.apellidos)}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-muted">
                      La solicitud aún no tiene evaluador asignado.
                    </p>
                  )}
                </section>

                <section className="rounded border border-border bg-bg p-4" aria-labelledby="titulo-central">
                  <h2 id="titulo-central" className="text-sm font-semibold text-ink">
                    Base operativa central
                  </h2>
                  {datos.olla_central ? (
                    <dl className="mt-2 space-y-2 text-sm">
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">ID de olla</dt>
                        <dd className="tabular font-semibold text-ink">{datos.olla_central.id}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">Estado</dt>
                        <dd className="font-semibold text-ink">
                          {etiquetaEstado(datos.olla_central.estado_aprobacion)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">Aprobación</dt>
                        <dd className="text-xs text-muted">{fecha(datos.olla_central.fecha_aprobacion)}</dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {datos.estado === "APTA"
                        ? "La aprobación se registró, pero la olla aún no refleja estado APTA en la base operativa."
                        : "La olla se creará en la base operativa cuando se apruebe la solicitud."}
                    </p>
                  )}
                </section>
              </aside>
            </div>
          ) : null}

          {pestana === "integrantes" ? (
            <div>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-ink">Padrón de integrantes</h2>
                  <p className="mt-1 text-sm text-muted">
                    {datos.total_integrantes} integrante(s) registrado(s) por el solicitante.
                  </p>
                </div>
                <span className="badge badge-neutral">DNI enmascarado</span>
              </div>

              {datos.integrantes.length === 0 ? (
                <EstadoVacio
                  icono="usuarios"
                  titulo="La solicitud no tiene integrantes"
                  descripcion="Sin un padrón registrado no es posible validar RENIEC ni aprobar la solicitud."
                />
              ) : (
                <>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="table-base">
                      <caption className="sr-only">Integrantes de la solicitud</caption>
                      <thead>
                        <tr>
                          <th scope="col">Integrante</th>
                          <th scope="col">DNI</th>
                          <th scope="col">Nacimiento</th>
                          <th scope="col">Parentesco con el dirigente</th>
                        </tr>
                      </thead>
                      <tbody>
                        {datos.integrantes.map((integrante) => (
                          <tr key={integrante.id}>
                            <td className="font-medium text-ink">
                              {nombreCompleto(integrante.nombres, integrante.apellidos)}
                            </td>
                            <td className="tabular text-muted">{integrante.dni_masked}</td>
                            <td className="tabular text-muted">{fecha(integrante.fecha_nacimiento)}</td>
                            <td className="text-muted">{integrante.parentesco_con_dirigente}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <ul className="divide-y divide-border md:hidden">
                    {datos.integrantes.map((integrante) => (
                      <li key={integrante.id} className="py-3">
                        <p className="font-medium text-ink">
                          {nombreCompleto(integrante.nombres, integrante.apellidos)}
                        </p>
                        <p className="tabular mt-1 text-xs text-muted">
                          DNI {integrante.dni_masked} · {integrante.parentesco_con_dirigente}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          Nacimiento: {fecha(integrante.fecha_nacimiento)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ) : null}

          {pestana === "evaluacion" ? (
            <div>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-ink">Evaluaciones RENIEC y SISFOH</h2>
                  <p className="mt-1 text-sm text-muted">
                    Cada ejecución registra una nueva corrida y queda firmada en la bitácora.
                  </p>
                </div>
                {datos.puede.evaluar ? (
                  <button type="button" className="btn-primary" onClick={abrirEvaluacion}>
                    <Icon nombre="balanza" tamano={18} />
                    Ejecutar evaluación
                  </button>
                ) : null}
              </div>

              {datos.evaluaciones.length === 0 ? (
                <EstadoVacio
                  icono="balanza"
                  titulo="Aún no se ejecutó la evaluación"
                  descripcion="La evaluación consulta RENIEC y SISFOH para cada integrante y calcula la aptitud automática."
                  accion={
                    datos.puede.evaluar ? (
                      <button type="button" className="btn-primary" onClick={abrirEvaluacion}>
                        Ejecutar primera evaluación
                      </button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="space-y-5">
                  {datos.evaluaciones.map((evaluacion, indice) => (
                    <article
                      key={evaluacion.id}
                      className="rounded-lg border border-border p-4 sm:p-5"
                      aria-labelledby={`evaluacion-${evaluacion.id}`}
                    >
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 id={`evaluacion-${evaluacion.id}`} className="font-semibold text-ink">
                            Corrida #{datos.evaluaciones.length - indice}
                            {indice === 0 ? (
                              <span className="badge badge-apta ml-2 align-middle">Más reciente</span>
                            ) : null}
                          </h3>
                          <p className="mt-1 text-xs text-muted">
                            {fechaHora(evaluacion.fecha_evaluacion)}
                          </p>
                        </div>
                        <span className="tabular text-xs text-muted">
                          {duracion(evaluacion.tiempo_evaluacion_ms)}
                        </span>
                      </div>
                      <ResumenEvaluacion evaluacion={evaluacion} />
                    </article>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {pestana === "decisiones" ? (
            <div>
              <h2 className="text-base font-semibold text-ink">Historial de decisiones</h2>
              <p className="mt-1 mb-4 text-sm text-muted">
                Las decisiones finales (APTA o NO_APTA) son terminales y no admiten cambios.
              </p>

              {datos.decisiones.length === 0 ? (
                <EstadoVacio
                  icono="portapapeles"
                  titulo="Sin decisiones registradas"
                  descripcion="La solicitud aún está pendiente de una decisión institucional."
                  accion={
                    datos.puede.decidir ? (
                      <button type="button" className="btn-primary" onClick={abrirDecision}>
                        Registrar decisión
                      </button>
                    ) : undefined
                  }
                />
              ) : (
                <ol className="space-y-4">
                  {datos.decisiones.map((item) => (
                    <li key={item.id} className="rounded-lg border border-border p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <span className={CLASE_DECISION[item.decision]}>
                            {etiquetaDecision(item.decision)}
                          </span>
                          <p className="mt-2 text-sm font-medium text-ink">
                            {nombreCompleto(item.funcionario_nombres, item.funcionario_apellidos)}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            {fechaHora(item.fecha_decision)}
                          </p>
                        </div>
                        <span className="badge badge-neutral">{item.funcionario_rol}</span>
                      </div>
                      {item.observaciones ? (
                        <p className="mt-3 rounded border border-border bg-bg p-3 text-sm leading-6 text-ink">
                          {item.observaciones}
                        </p>
                      ) : (
                        <p className="mt-3 text-sm text-muted">Sin observaciones adicionales.</p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ) : null}

          {pestana === "bitacora" ? (
            <div>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-ink">Bitácora de la solicitud</h2>
                  <p className="mt-1 text-sm text-muted">
                    Cada registro incluye una firma HMAC verificable por el Estado.
                  </p>
                </div>
                <span className="badge badge-neutral">{datos.bitacora.length} registro(s)</span>
              </div>

              {datos.bitacora.length === 0 ? (
                <EstadoVacio
                  icono="escudo"
                  titulo="Sin registros de bitácora"
                  descripcion="Las acciones sobre la solicitud aparecerán aquí con su firma de integridad."
                />
              ) : (
                <ol className="space-y-4">
                  {datos.bitacora.map((registro) => (
                    <li key={registro.id} className="rounded-lg border border-border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-ink">
                            {etiquetaAccion(registro.accion)}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            {fechaHora(registro.timestamp)} ·{" "}
                            {registro.funcionario_nombres
                              ? nombreCompleto(
                                  registro.funcionario_nombres,
                                  registro.funcionario_apellidos ?? "",
                                )
                              : "Sistema"}
                            {registro.actor_dni ? ` · DNI ${registro.actor_dni}` : ""}
                          </p>
                        </div>
                        <span
                          className={
                            registro.firma_valida ? "badge badge-apta" : "badge badge-no-apta"
                          }
                        >
                          <Icon
                            nombre={registro.firma_valida ? "check-circulo" : "x-circulo"}
                            tamano={14}
                          />
                          {registro.firma_valida ? "Firma válida" : "Firma no verificada"}
                        </span>
                      </div>
                      {registro.declaracion ? (
                        <p className="mt-2 text-xs font-medium text-accent-dark">
                          Declaración jurada registrada por el funcionario.
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ) : null}

          {pestana === "notificaciones" ? (
            <div>
              <h2 className="text-base font-semibold text-ink">Notificaciones al solicitante</h2>
              <p className="mt-1 mb-4 text-sm text-muted">
                Mensajes generados por las decisiones sobre esta postulación.
              </p>

              {datos.notificaciones.length === 0 ? (
                <EstadoVacio
                  icono="campana"
                  titulo="Sin notificaciones"
                  descripcion="Se enviará una notificación cuando se registre una decisión."
                />
              ) : (
                <ul className="space-y-3">
                  {datos.notificaciones.map((notificacion) => (
                    <li key={notificacion.id} className="rounded-lg border border-border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <span
                          className={
                            notificacion.tipo === "APROBACION"
                              ? "badge badge-apta"
                              : notificacion.tipo === "RECHAZO"
                                ? "badge badge-no-apta"
                                : "badge badge-observada"
                          }
                        >
                          {etiquetaNotificacion(notificacion.tipo)}
                        </span>
                        <span className="text-xs text-muted">
                          {fechaHora(notificacion.created_at)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-ink">{notificacion.mensaje}</p>
                      <p className="mt-2 text-xs text-muted">
                        {notificacion.leida ? "Leída por el solicitante" : "Aún no leída"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <Modal
        abierto={modalAsignar}
        onCerrar={() => setModalAsignar(false)}
        titulo="Asignar evaluador"
        descripcion="El evaluador podrá ejecutar la validación RENIEC/SISFOH y registrar la decisión de esta solicitud."
        ancho="sm"
        pie={
          <>
            <button type="button" className="btn-secondary" onClick={() => setModalAsignar(false)}>
              Cancelar
            </button>
            <button type="submit" form="form-asignar" className="btn-primary" disabled={asignando}>
              {asignando ? "Asignando…" : "Guardar asignación"}
            </button>
          </>
        }
      >
        {errorAsignar ? <MensajeError texto={errorAsignar} /> : null}
        {evaluadores.error ? (
          <div className="mb-4">
            <Alerta tono="danger">
              {evaluadores.error.message}{" "}
              <button
                type="button"
                className="font-semibold underline underline-offset-2"
                onClick={evaluadores.recargar}
              >
                Reintentar
              </button>
            </Alerta>
          </div>
        ) : null}
        <form id="form-asignar" className="space-y-4" onSubmit={confirmarAsignacion}>
          <div>
            <label className="label-field" htmlFor="evaluador">
              Evaluador activo
            </label>
            <select
              id="evaluador"
              className="select-field"
              value={evaluadorId}
              onChange={(evento) => setEvaluadorId(evento.target.value)}
              disabled={evaluadores.cargando}
              required
            >
              <option value="">
                {evaluadores.cargando ? "Cargando evaluadores…" : "Selecciona un evaluador"}
              </option>
              {(evaluadores.data?.items ?? []).map((opcion) => (
                <option key={opcion.id} value={opcion.id}>
                  {nombreCompleto(opcion.nombres, opcion.apellidos)} · {opcion.cargo}
                </option>
              ))}
            </select>
            <p className="help-text">
              Solo se listan funcionarios con rol EVALUADOR y estado ACTIVO.
            </p>
            {evaluadores.data && evaluadores.data.items.length === 0 ? (
              <p className="mt-2 text-sm text-accent-dark">
                No hay evaluadores activos. Un administrador debe crear o activar uno.
              </p>
            ) : null}
          </div>
        </form>
      </Modal>

      <Modal
        abierto={modalEvaluar}
        onCerrar={() => {
          setModalEvaluar(false);
          setResultadoEvaluacion(null);
          setErrorEvaluar(null);
        }}
        titulo={resultadoEvaluacion ? "Resultado de la evaluación" : "Ejecutar evaluación"}
        descripcion={
          resultadoEvaluacion
            ? "La nueva corrida quedó registrada en el expediente y firmada en la bitácora."
            : "Se consultará RENIEC y SISFOH para cada integrante del padrón. La operación puede tardar unos segundos."
        }
        ancho="lg"
        pie={
          resultadoEvaluacion ? (
            <>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setModalEvaluar(false);
                  setResultadoEvaluacion(null);
                  setErrorEvaluar(null);
                }}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setModalEvaluar(false);
                  setResultadoEvaluacion(null);
                  setErrorEvaluar(null);
                  cambiarPestana("evaluacion");
                }}
              >
                Ver historial
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setModalEvaluar(false)}
                disabled={evaluando}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={confirmarEvaluacion}
                disabled={evaluando || datos.integrantes.length === 0}
              >
                {evaluando ? "Consultando RENIEC y SISFOH…" : "Ejecutar evaluación"}
              </button>
            </>
          )
        }
      >
        {errorEvaluar ? <MensajeError texto={errorEvaluar} /> : null}

        {resultadoEvaluacion ? (
          <div>
            <div className="mb-5 flex flex-wrap gap-2">
              <span className={claseAptitud(resultadoEvaluacion.evaluacion.resultado_reniec)}>
                RENIEC: {etiquetaAptitud(resultadoEvaluacion.evaluacion.resultado_reniec)}
              </span>
              <span className={claseAptitud(resultadoEvaluacion.evaluacion.resultado_sisfoh)}>
                SISFOH: {etiquetaAptitud(resultadoEvaluacion.evaluacion.resultado_sisfoh)}
              </span>
              <span className={claseAptitud(resultadoEvaluacion.evaluacion.aptitud_automatica)}>
                {etiquetaAptitud(resultadoEvaluacion.evaluacion.aptitud_automatica)}
              </span>
            </div>
            <dl className="grid gap-4 border-y border-border py-4 sm:grid-cols-3">
              <Dato etiqueta="Integrantes validados">
                <span className="tabular font-semibold">
                  {resultadoEvaluacion.evaluacion.integrantes_validados} de{" "}
                  {resultadoEvaluacion.evaluacion.total_integrantes}
                </span>
              </Dato>
              <Dato etiqueta="Sin clasificación SISFOH">
                <span className="tabular">{resultadoEvaluacion.sin_sisfoh}</span>
              </Dato>
              <Dato etiqueta="Tiempo total">
                <span className="tabular">{duracion(resultadoEvaluacion.tiempo_total_ms)}</span>
              </Dato>
            </dl>
            {resultadoEvaluacion.evaluacion.motivos.length > 0 ? (
              <div className="mt-4 rounded border border-accent/30 bg-accent-light p-4 text-sm text-accent-dark">
                <p className="font-semibold">Motivos que requieren revisión</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {resultadoEvaluacion.evaluacion.motivos.map((motivo) => (
                    <li key={motivo}>{motivo}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mt-4 flex items-start gap-2 rounded border border-success/25 bg-success-light p-4 text-sm text-success">
                <Icon nombre="check-circulo" tamano={19} className="mt-0.5 shrink-0" />
                La evaluación es apta y no registra observaciones automáticas. Puedes proceder
                con la decisión.
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded border border-border bg-bg p-4">
              <p className="text-sm font-semibold text-ink">
                Se evaluarán {datos.integrantes.length} integrante(s)
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                La corrida registra el resultado por integrante y no modifica decisiones
                anteriores. Si la solicitud ya tiene una decisión final, el sistema rechazará la
                operación.
              </p>
            </div>
            {datos.integrantes.length === 0 ? (
              <Alerta tono="danger" titulo="Sin integrantes">
                No se puede evaluar una solicitud sin integrantes registrados.
              </Alerta>
            ) : (
              <Alerta tono="info" titulo="Servicios externos">
                La evaluación consulta los padrones RENIEC y SISFOH. El resultado puede requerir
                revisión cuando no hay clasificación del hogar o el padrón no coincide con lo
                declarado.
              </Alerta>
            )}
          </div>
        )}
      </Modal>

      <Modal
        abierto={modalDecision}
        onCerrar={() => setModalDecision(false)}
        titulo="Registrar decisión"
        descripcion="La decisión queda firmada en la bitácora y notifica al solicitante. APROBAR y RECHAZAR son decisiones sobre el estado de la solicitud."
        ancho="md"
        pie={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setModalDecision(false)}
              disabled={decidiendo}
            >
              Cancelar
            </button>
            <button type="submit" form="form-decision" className="btn-primary" disabled={decidiendo}>
              {decidiendo ? "Registrando…" : "Confirmar decisión"}
            </button>
          </>
        }
      >
        {errorDecision ? <MensajeError texto={errorDecision} /> : null}
        <form id="form-decision" className="space-y-4" onSubmit={confirmarDecision}>
          {!puedeAprobar ? (
            <Alerta tono="warning" titulo="Aprobación no disponible">
              Ejecuta primero una evaluación válida y sin integrantes inválidos en RENIEC para
              poder aprobar la solicitud.
            </Alerta>
          ) : null}

          <fieldset>
            <legend className="label-field">Decisión</legend>
            <div className="space-y-2">
              {(
                [
                  {
                    valor: "APROBAR" as const,
                    titulo: "Aprobar",
                    detalle: "Crea la asignación, notifica y sincroniza la olla en la base operativa.",
                  },
                  {
                    valor: "OBSERVAR" as const,
                    titulo: "Observar",
                    detalle: "La solicitud queda observada para que el solicitante subsane.",
                  },
                  {
                    valor: "RECHAZAR" as const,
                    titulo: "Rechazar",
                    detalle: "La solicitud queda como NO APTA. Es una decisión terminal.",
                  },
                ] as const
              ).map((opcion) => {
                const deshabilitada = opcion.valor === "APROBAR" && !puedeAprobar;
                return (
                  <label
                    key={opcion.valor}
                    className={`flex cursor-pointer items-start gap-3 rounded border p-3 transition-colors ${
                      decision === opcion.valor
                        ? "border-primary bg-primary-light"
                        : "border-border bg-surface hover:bg-bg"
                    } ${deshabilitada ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <input
                      type="radio"
                      name="decision"
                      value={opcion.valor}
                      className="mt-0.5 h-5 w-5 accent-primary"
                      checked={decision === opcion.valor}
                      disabled={deshabilitada || decidiendo}
                      onChange={() => setDecision(opcion.valor)}
                    />
                    <span>
                      <span className="block text-sm font-semibold text-ink">{opcion.titulo}</span>
                      <span className="mt-0.5 block text-xs leading-5 text-muted">
                        {opcion.detalle}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label className="label-field" htmlFor="observaciones">
              {decision === "APROBAR" ? "Observaciones (opcional)" : "Motivo de la decisión"}
            </label>
            <textarea
              id="observaciones"
              className="textarea-field"
              maxLength={500}
              value={observaciones}
              onChange={(evento) => setObservaciones(evento.target.value)}
              disabled={decidiendo}
              placeholder={
                decision === "APROBAR"
                  ? "Notas adicionales para el expediente"
                  : "Explica el motivo para el solicitante"
              }
              required={decision !== "APROBAR"}
              aria-describedby="contador-observaciones"
            />
            <p id="contador-observaciones" className="help-text tabular text-right">
              {observaciones.length}/500 caracteres
            </p>
          </div>

          {decision === "APROBAR" && ultimaEvaluacion ? (
            <div className="rounded border border-primary/20 bg-primary-light p-3 text-sm text-primary-dark">
              Se asignarán <strong>{ultimaEvaluacion.integrantes_validados ?? 0}</strong>{" "}
              integrante(s) validados. Los valores de kcal, kg y porciones se calculan con los
              parámetros vigentes.
            </div>
          ) : null}
        </form>
      </Modal>

      <Modal
        abierto={modalSincronizar}
        onCerrar={() => setModalSincronizar(false)}
        titulo="Sincronizar olla con la base operativa"
        descripcion="La operación es idempotente: actualiza la olla existente o la crea si aún no existe. Solo aplica a solicitudes APTA."
        ancho="sm"
        pie={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setModalSincronizar(false)}
              disabled={sincronizando}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={confirmarSincronizacion}
              disabled={sincronizando}
            >
              {sincronizando ? "Sincronizando…" : "Reintentar sincronización"}
            </button>
          </>
        }
      >
        {errorSincronizar ? <MensajeError texto={errorSincronizar} /> : null}
        {datos.olla_central ? (
          <div className="rounded border border-border bg-bg p-4 text-sm">
            <p className="font-semibold text-ink">Registro actual</p>
            <p className="mt-1 text-muted">
              Olla #{datos.olla_central.id} · {datos.olla_central.nombre} ·{" "}
              {etiquetaEstado(datos.olla_central.estado_aprobacion)}
            </p>
          </div>
        ) : (
          <Alerta tono="warning" titulo="Sin registro central">
            La olla todavía no existe en la base operativa. La sincronización intentará crearla.
          </Alerta>
        )}
      </Modal>
    </>
  );
}
