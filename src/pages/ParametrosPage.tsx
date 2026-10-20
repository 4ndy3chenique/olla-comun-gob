import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { api, mensajeError } from "../lib/api";
import { etiquetaAptitud, fechaHora, numeroHumano } from "../lib/format";
import type { Parametro } from "../types/api";
import { Alerta } from "../components/ui/Alerta";
import { Cargando } from "../components/ui/Cargando";
import { EstadoVacio } from "../components/ui/EstadoVacio";
import { Icon } from "../components/ui/Icon";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/PageHeader";

const ETIQUETAS: Record<string, string> = {
  UMBRAL_SCORE_FOCALIZACION: "Umbral de score de focalización",
  UMBRAL_DISCREPANCIA_INTEGRANTES: "Tolerancia de discrepancia del padrón",
  SISFOH_CLASIFICACIONES_APTA: "Clasificaciones SISFOH aptas",
  KCAL_POR_INTEGRANTE_DIA: "Kilocalorías por integrante/día",
  KG_POR_INTEGRANTE_DIA: "Kilogramos de insumos por integrante/día",
  PORCIONES_POR_INTEGRANTE_DIA: "Porciones por integrante/día",
  DIAS_PLAZO_SUBSANACION: "Plazo de subsanación (días)",
};

const UNIDADES: Record<string, string> = {
  KCAL_POR_INTEGRANTE_DIA: "kcal",
  KG_POR_INTEGRANTE_DIA: "kg",
  PORCIONES_POR_INTEGRANTE_DIA: "porciones",
  DIAS_PLAZO_SUBSANACION: "días",
  UMBRAL_SCORE_FOCALIZACION: "puntos",
  UMBRAL_DISCREPANCIA_INTEGRANTES: "personas",
};

function etiquetaParametro(nombre: string): string {
  return ETIQUETAS[nombre] ?? nombre.replaceAll("_", " ").toLowerCase();
}

function valorLegible(parametro: Parametro): string {
  if (parametro.nombre_parametro === "SISFOH_CLASIFICACIONES_APTA") {
    return parametro.valor
      .split(",")
      .map((valor) => etiquetaAptitud(valor.trim()))
      .join(" · ");
  }
  const unidad = UNIDADES[parametro.nombre_parametro];
  return unidad ? `${parametro.valor} ${unidad}` : parametro.valor;
}

function ModalParametro({
  parametro,
  onCerrar,
  onGuardado,
}: {
  parametro: Parametro;
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const [valor, setValor] = useState(parametro.valor);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!valor.trim()) {
      setError("Ingresa el valor del parámetro.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await api<Parametro>(
        `/estado/parametros/${encodeURIComponent(parametro.nombre_parametro)}`,
        { method: "PUT", body: { valor: valor.trim() } },
      );
      onGuardado();
    } catch (fallo) {
      setError(mensajeError(fallo));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo="Editar parámetro"
      descripcion={etiquetaParametro(parametro.nombre_parametro)}
      ancho="sm"
      pie={
        <>
          <button type="button" className="btn-secondary" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" form="form-parametro" className="btn-primary" disabled={guardando}>
            {guardando ? "Guardando…" : "Guardar valor"}
          </button>
        </>
      }
    >
      {error ? (
        <div className="mb-4">
          <Alerta tono="danger">{error}</Alerta>
        </div>
      ) : null}

      <form id="form-parametro" className="space-y-4" onSubmit={enviar}>
        <div className="rounded border border-border bg-bg p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Nombre técnico
          </p>
          <p className="mt-1 font-mono text-xs text-ink">{parametro.nombre_parametro}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{parametro.descripcion}</p>
        </div>

        <div>
          <label className="label-field" htmlFor="parametro-valor">
            Valor
          </label>
          <input
            id="parametro-valor"
            type="text"
            autoFocus
            className="input-field tabular"
            value={valor}
            onChange={(evento) => setValor(evento.target.value)}
            maxLength={100}
            required
          />
          <p className="help-text">
            {parametro.nombre_parametro === "SISFOH_CLASIFICACIONES_APTA"
              ? "Lista separada por comas: POBRE_EXTREMO, POBRE o NO_POBRE."
              : "Valor vigente para nuevas evaluaciones y decisiones. Máximo 100 caracteres."}
          </p>
        </div>

        <Alerta tono="warning">
          El cambio no modifica asignaciones ya registradas. Solo se aplica a nuevos cálculos y
          evaluaciones.
        </Alerta>
      </form>
    </Modal>
  );
}

interface Aviso {
  tono: "success" | "warning" | "info" | "danger";
  titulo: string;
  texto: string;
}

export default function ParametrosPage() {
  const parametros = useApi<{ items: Parametro[] }>("/estado/parametros");
  const [seleccionado, setSeleccionado] = useState<Parametro | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const items = parametros.data?.items ?? [];
  const porNombre = new Map(items.map((item) => [item.nombre_parametro, item]));
  const kcal = porNombre.get("KCAL_POR_INTEGRANTE_DIA")?.valor ?? "2100";
  const kg = porNombre.get("KG_POR_INTEGRANTE_DIA")?.valor ?? "9.5";
  const porciones = porNombre.get("PORCIONES_POR_INTEGRANTE_DIA")?.valor ?? "3";
  const umbral = porNombre.get("UMBRAL_DISCREPANCIA_INTEGRANTES")?.valor ?? "0";
  const sisfoh = porNombre.get("SISFOH_CLASIFICACIONES_APTA")?.valor ?? "POBRE_EXTREMO,POBRE";

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        titulo="Parámetros de evaluación"
        descripcion="Define los valores que usa la Plataforma del Estado para validar el padrón, calcular la aptitud y generar asignaciones."
        acciones={
          <button
            type="button"
            className="btn-secondary"
            onClick={parametros.recargar}
            disabled={parametros.cargando}
          >
            <Icon nombre="refrescar" tamano={18} />
            {parametros.cargando ? "Actualizando…" : "Actualizar"}
          </button>
        }
      />

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

      {parametros.error ? (
        <div className="mb-5">
          <Alerta tono="danger" titulo="No pudimos cargar los parámetros">
            {parametros.error.message}{" "}
            <button
              type="button"
              className="font-semibold underline underline-offset-2"
              onClick={parametros.recargar}
            >
              Reintentar
            </button>
          </Alerta>
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Fórmulas vigentes">
        <article className="card card-pad">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Energía</p>
          <p className="tabular mt-2 text-2xl font-bold text-ink">
            {numeroHumano(Number(kcal))}
            <span className="ml-1 text-sm font-medium text-muted">kcal</span>
          </p>
          <p className="mt-1 text-xs text-muted">por integrante validado / día</p>
        </article>
        <article className="card card-pad">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Insumos</p>
          <p className="tabular mt-2 text-2xl font-bold text-ink">
            {kg}
            <span className="ml-1 text-sm font-medium text-muted">kg</span>
          </p>
          <p className="mt-1 text-xs text-muted">por integrante validado / día</p>
        </article>
        <article className="card card-pad">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Porciones</p>
          <p className="tabular mt-2 text-2xl font-bold text-ink">
            {numeroHumano(Number(porciones))}
            <span className="ml-1 text-sm font-medium text-muted">diarias</span>
          </p>
          <p className="mt-1 text-xs text-muted">por integrante validado</p>
        </article>
        <article className="card card-pad">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">SISFOH apto</p>
          <p className="mt-2 text-sm font-bold leading-6 text-ink">
            {sisfoh
              .split(",")
              .map((valor) => etiquetaAptitud(valor.trim()))
              .join(" · ")}
          </p>
          <p className="mt-1 text-xs text-muted">clasificaciones del hogar admitidas</p>
        </article>
      </section>

      <div className="mt-5">
        <Alerta tono="info" titulo="Tolerancia de discrepancia">
          El padrón validado puede diferir de lo declarado en hasta{" "}
          <strong>{numeroHumano(Number(umbral))}</strong> persona(s). Superar ese umbral marca la
          evaluación como «Requiere revisión».
        </Alerta>
      </div>

      <section className="card mt-5 overflow-hidden" aria-labelledby="titulo-parametros">
        <div className="card-header">
          <div>
            <h2 id="titulo-parametros" className="font-semibold text-ink">
              Parámetros registrados
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {items.length} parámetro(s) · cambios auditados
            </p>
          </div>
          <span className="badge badge-admin">Solo administrador</span>
        </div>

        {parametros.cargando && !parametros.data ? (
          <Cargando texto="Cargando parámetros de evaluación…" />
        ) : items.length === 0 ? (
          <EstadoVacio
            icono="ajustes"
            titulo="No hay parámetros registrados"
            descripcion="La migración de la Plataforma del Estado debe cargar los parámetros base."
          />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((parametro) => (
              <li
                key={parametro.id}
                className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-ink">
                    {etiquetaParametro(parametro.nombre_parametro)}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted">
                    {parametro.nombre_parametro}
                  </p>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
                    {parametro.descripcion ?? "Sin descripción registrada."}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Actualizado: {fechaHora(parametro.updated_at)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
                  <p className="tabular text-lg font-bold text-ink">
                    {valorLegible(parametro)}
                  </p>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setSeleccionado(parametro)}
                  >
                    <Icon nombre="editar" tamano={17} />
                    Editar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {seleccionado ? (
        <ModalParametro
          key={`parametro-${seleccionado.nombre_parametro}`}
          parametro={seleccionado}
          onCerrar={() => setSeleccionado(null)}
          onGuardado={() => {
            const nombre = etiquetaParametro(seleccionado.nombre_parametro);
            setSeleccionado(null);
            parametros.recargar();
            setAviso({
              tono: "success",
              titulo: "Parámetro actualizado",
              texto: `${nombre} se actualizó. El nuevo valor se usará en las próximas evaluaciones y decisiones.`,
            });
          }}
        />
      ) : null}
    </>
  );
}
