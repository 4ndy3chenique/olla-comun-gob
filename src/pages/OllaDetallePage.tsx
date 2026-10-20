import { Link, useParams } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { descargarCsv } from "../lib/csv";
import {
  claseEstadoSolicitud,
  decimal,
  etiquetaEstado,
  etiquetaGuia,
  fecha,
  fechaHora,
  nombreCompleto,
  numeroHumano,
} from "../lib/format";
import type { OllaDetalle } from "../types/api";
import { Alerta } from "../components/ui/Alerta";
import { Cargando } from "../components/ui/Cargando";
import { EstadoVacio } from "../components/ui/EstadoVacio";
import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";

function clasePadron(estado: string): string {
  if (estado === "ACTIVO") return "badge badge-apta";
  if (estado === "DUPLICADO") return "badge badge-observada";
  return "badge badge-neutral";
}

function nombreDirigente(detalle: OllaDetalle): string {
  const { dirigente_nombres, dirigente_apellidos } = detalle.olla;
  if (!dirigente_nombres && !dirigente_apellidos) return "Sin dirigente vinculado";
  return nombreCompleto(dirigente_nombres ?? "", dirigente_apellidos ?? "");
}

export default function OllaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const idOlla = Number(id);
  const valido = Number.isInteger(idOlla) && idOlla > 0;
  const detalle = useApi<OllaDetalle>(valido ? `/estado/ollas/${idOlla}` : null);

  const datos = detalle.data;
  const activos = datos?.beneficiarios.filter((item) => item.estado_padron === "ACTIVO").length ?? 0;
  const ultimaGuia = datos?.guias[0];

  function exportarPadron() {
    if (!datos) return;
    descargarCsv(
      `padron-olla-${datos.olla.id}`,
      datos.beneficiarios.map((beneficiario) => ({
        dni: beneficiario.dni_masked,
        nombres: beneficiario.nombres,
        apellidos: beneficiario.apellidos,
        nacimiento: beneficiario.fecha_nacimiento,
        integrantes_hogar: beneficiario.integrantes_hogar,
        condicion_nutricional: beneficiario.condicion_nutricional ?? "",
        estado_padron: beneficiario.estado_padron,
      })),
      [
        { clave: "dni", titulo: "DNI" },
        { clave: "nombres", titulo: "Nombres" },
        { clave: "apellidos", titulo: "Apellidos" },
        { clave: "nacimiento", titulo: "Fecha de nacimiento" },
        { clave: "integrantes_hogar", titulo: "Integrantes del hogar" },
        { clave: "condicion_nutricional", titulo: "Condición nutricional" },
        { clave: "estado_padron", titulo: "Estado del padrón" },
      ],
    );
  }

  if (!valido) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <Alerta tono="danger" titulo="Olla no encontrada">
          El identificador de la olla no es válido.{" "}
          <Link to="/ollas" className="font-semibold underline underline-offset-2">
            Volver al directorio
          </Link>
        </Alerta>
      </div>
    );
  }

  if (detalle.cargando && !datos) {
    return (
      <div className="card">
        <Cargando texto="Cargando ficha de la olla común…" />
      </div>
    );
  }

  if (detalle.error || !datos) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <Alerta tono="danger" titulo="No pudimos cargar la olla">
          {detalle.error?.status === 404
            ? "No encontramos la olla indicada en la base operativa."
            : (detalle.error?.message ?? "No encontramos la olla indicada.")}{" "}
          <button
            type="button"
            className="font-semibold underline underline-offset-2"
            onClick={detalle.recargar}
          >
            Reintentar
          </button>
        </Alerta>
        <Link to="/ollas" className="btn-secondary mt-4">
          <Icon nombre="flecha-izquierda" tamano={18} />
          Volver al directorio
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <Link to="/ollas" className="btn-ghost -ml-4 text-sm">
          <Icon nombre="flecha-izquierda" tamano={18} />
          Volver al directorio
        </Link>
      </div>

      <PageHeader
        eyebrow={`Olla común #${datos.olla.id}`}
        titulo={datos.olla.nombre}
        descripcion={`${datos.olla.distrito} · ${datos.olla.direccion}`}
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
            <button
              type="button"
              className="btn-secondary"
              onClick={exportarPadron}
              disabled={datos.beneficiarios.length === 0}
            >
              <Icon nombre="descargar" tamano={18} />
              Exportar padrón
            </button>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className={claseEstadoSolicitud(datos.olla.estado_aprobacion)}>
          {etiquetaEstado(datos.olla.estado_aprobacion)}
        </span>
        <span className="badge badge-neutral">
          <Icon nombre="mapa" tamano={13} />
          {datos.olla.distrito}
        </span>
        {datos.olla.fecha_aprobacion ? (
          <span className="badge badge-neutral">
            Aprobada el {fecha(datos.olla.fecha_aprobacion)}
          </span>
        ) : null}
        <span className="badge badge-neutral">Datos de solo lectura</span>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores de la olla">
        <StatCard
          etiqueta="Beneficiarios activos"
          valor={numeroHumano(activos)}
          detalle={`${numeroHumano(datos.beneficiarios.length)} registrados en total`}
          icono="usuarios"
          tono="success"
        />
        <StatCard
          etiqueta="Personas declaradas"
          valor={numeroHumano(datos.olla.num_personas_declaradas)}
          detalle="Padrón declarado al postular"
          icono="portapapeles"
          tono="primary"
        />
        <StatCard
          etiqueta="Guías de despacho"
          valor={numeroHumano(datos.guias.length)}
          detalle={ultimaGuia ? `Última: ${etiquetaGuia(ultimaGuia.estado_fsm)}` : "Sin guías registradas"}
          icono="camion"
          tono="info"
        />
        <StatCard
          etiqueta="Programaciones de menú"
          valor={numeroHumano(datos.menu.length)}
          detalle="Últimos registros disponibles"
          icono="chef"
          tono="accent"
        />
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <section className="card card-pad lg:col-span-2" aria-labelledby="datos-generales">
          <h2 id="datos-generales" className="text-base font-semibold text-ink">
            Datos generales
          </h2>
          <dl className="mt-4 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">Dirección</dt>
              <dd className="mt-1 text-sm text-ink">{datos.olla.direccion}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">Distrito</dt>
              <dd className="mt-1 text-sm text-ink">{datos.olla.distrito}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                Fecha de fundación
              </dt>
              <dd className="mt-1 text-sm text-ink">{fecha(datos.olla.fecha_fundacion)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                Registro en la base operativa
              </dt>
              <dd className="mt-1 text-sm text-ink">{fechaHora(datos.olla.created_at)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">Dirigente</dt>
              <dd className="mt-1 text-sm text-ink">{nombreDirigente(datos)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                Contacto del dirigente
              </dt>
              <dd className="mt-1 text-sm text-ink">
                {datos.olla.dirigente_dni ? `DNI ${datos.olla.dirigente_dni}` : "Sin DNI"}
                {datos.olla.dirigente_email ? ` · ${datos.olla.dirigente_email}` : ""}
              </dd>
            </div>
          </dl>
          {datos.olla.solicitud_id_estado ? (
            <p className="mt-5 border-t border-border pt-4 text-sm text-muted">
              Origen: solicitud{" "}
              <Link
                to={`/solicitudes/${datos.olla.solicitud_id_estado}`}
                className="font-semibold text-primary-dark underline underline-offset-2"
              >
                #{datos.olla.solicitud_id_estado}
              </Link>{" "}
              de la Plataforma del Solicitante.
            </p>
          ) : (
            <p className="mt-5 border-t border-border pt-4 text-sm text-muted">
              Olla registrada previamente en la base operativa, sin solicitud vinculada.
            </p>
          )}
        </section>

        <section className="card" aria-labelledby="ultima-guia">
          <div className="card-header">
            <div>
              <h2 id="ultima-guia" className="font-semibold text-ink">
                Última guía de despacho
              </h2>
              <p className="mt-0.5 text-xs text-muted">Trazabilidad logística</p>
            </div>
            <Icon nombre="camion" tamano={20} className="text-muted" />
          </div>
          <div className="card-pad">
            {ultimaGuia ? (
              <>
                <span className="badge badge-neutral">{etiquetaGuia(ultimaGuia.estado_fsm)}</span>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Guía</dt>
                    <dd className="tabular font-semibold text-ink">#{ultimaGuia.id}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Generada</dt>
                    <dd className="text-right text-xs text-muted">
                      {fechaHora(ultimaGuia.fecha_generacion)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Ítems</dt>
                    <dd className="tabular text-ink">{numeroHumano(ultimaGuia.items)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Despacho</dt>
                    <dd className="text-right text-xs text-muted">
                      {fechaHora(ultimaGuia.fecha_despacho)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Recepción</dt>
                    <dd className="text-right text-xs text-muted">
                      {fechaHora(ultimaGuia.fecha_recepcion)}
                    </dd>
                  </div>
                </dl>
              </>
            ) : (
              <p className="text-sm leading-6 text-muted">
                Esta olla aún no tiene guías de despacho registradas en la base operativa.
              </p>
            )}
          </div>
        </section>
      </div>

      <section className="card mt-5 overflow-hidden" aria-labelledby="titulo-padron">
        <div className="card-header">
          <div>
            <h2 id="titulo-padron" className="font-semibold text-ink">
              Padrón de beneficiarios
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {numeroHumano(datos.beneficiarios.length)} persona(s) · DNI enmascarado
            </p>
          </div>
          <span className="badge badge-neutral">{datos.beneficiarios.length} registro(s)</span>
        </div>

        {datos.beneficiarios.length === 0 ? (
          <EstadoVacio
            icono="usuarios"
            titulo="Sin beneficiarios registrados"
            descripcion="El padrón se completa cuando la olla es aprobada y la base operativa registra a sus integrantes."
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="table-base min-w-[760px]">
                <caption className="sr-only">Beneficiarios de la olla común</caption>
                <thead>
                  <tr>
                    <th scope="col">Beneficiario</th>
                    <th scope="col">DNI</th>
                    <th scope="col">Nacimiento</th>
                    <th scope="col" className="text-right">Hogar</th>
                    <th scope="col">Condición nutricional</th>
                    <th scope="col">Padrón</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.beneficiarios.map((beneficiario) => (
                    <tr key={beneficiario.id}>
                      <td className="font-medium text-ink">
                        {nombreCompleto(beneficiario.nombres, beneficiario.apellidos)}
                      </td>
                      <td className="tabular text-muted">{beneficiario.dni_masked}</td>
                      <td className="tabular text-muted">{fecha(beneficiario.fecha_nacimiento)}</td>
                      <td className="tabular text-right text-ink">
                        {numeroHumano(beneficiario.integrantes_hogar)}
                      </td>
                      <td className="text-muted">{beneficiario.condicion_nutricional ?? "—"}</td>
                      <td>
                        <span className={clasePadron(beneficiario.estado_padron)}>
                          {etiquetaEstado(beneficiario.estado_padron)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-border md:hidden">
              {datos.beneficiarios.map((beneficiario) => (
                <li key={beneficiario.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">
                        {nombreCompleto(beneficiario.nombres, beneficiario.apellidos)}
                      </p>
                      <p className="tabular mt-0.5 text-xs text-muted">
                        DNI {beneficiario.dni_masked} · Hogar de{" "}
                        {numeroHumano(beneficiario.integrantes_hogar)}
                      </p>
                    </div>
                    <span className={clasePadron(beneficiario.estado_padron)}>
                      {beneficiario.estado_padron}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    Nacimiento: {fecha(beneficiario.fecha_nacimiento)} · Condición:{" "}
                    {beneficiario.condicion_nutricional ?? "—"}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="card overflow-hidden" aria-labelledby="titulo-guias">
          <div className="card-header">
            <div>
              <h2 id="titulo-guias" className="font-semibold text-ink">
                Guías de despacho
              </h2>
              <p className="mt-0.5 text-xs text-muted">Últimas 20 guías</p>
            </div>
            <Icon nombre="camion" tamano={20} className="text-muted" />
          </div>

          {datos.guias.length === 0 ? (
            <EstadoVacio
              icono="camion"
              titulo="Sin guías registradas"
              descripcion="Las guías se generan desde el módulo operativo cuando se programan despachos."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table-base min-w-[520px]">
                <caption className="sr-only">Guías de despacho de la olla</caption>
                <thead>
                  <tr>
                    <th scope="col">Guía</th>
                    <th scope="col">Estado</th>
                    <th scope="col" className="text-right">Ítems</th>
                    <th scope="col">Generada</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.guias.map((guia) => (
                    <tr key={guia.id}>
                      <td className="tabular font-medium text-ink">#{guia.id}</td>
                      <td>
                        <span className="badge badge-neutral">{etiquetaGuia(guia.estado_fsm)}</span>
                      </td>
                      <td className="tabular text-right text-ink">{numeroHumano(guia.items)}</td>
                      <td className="tabular text-xs text-muted">
                        {fechaHora(guia.fecha_generacion)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card overflow-hidden" aria-labelledby="titulo-menu">
          <div className="card-header">
            <div>
              <h2 id="titulo-menu" className="font-semibold text-ink">
                Programación de menús
              </h2>
              <p className="mt-0.5 text-xs text-muted">Últimas 10 programaciones</p>
            </div>
            <Icon nombre="chef" tamano={20} className="text-muted" />
          </div>

          {datos.menu.length === 0 ? (
            <EstadoVacio
              icono="chef"
              titulo="Sin menús programados"
              descripcion="La programación alimentaria se registra desde el módulo operativo."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table-base min-w-[560px]">
                <caption className="sr-only">Programaciones de menú de la olla</caption>
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Ración</th>
                    <th scope="col" className="text-right">Kcal calculadas</th>
                    <th scope="col">Rango óptimo</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.menu.map((menu) => (
                    <tr key={menu.id}>
                      <td className="tabular font-medium text-ink">{fecha(menu.fecha)}</td>
                      <td className="text-muted">{menu.tipo_racion}</td>
                      <td className="tabular text-right text-ink">
                        {decimal(menu.kcal_total_calculada, 0)}
                      </td>
                      <td>
                        <span
                          className={
                            menu.cumple_rango_optimo ? "badge badge-apta" : "badge badge-observada"
                          }
                        >
                          {menu.cumple_rango_optimo ? "Cumple" : "Fuera de rango"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
