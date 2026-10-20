import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import { api, ApiError, mensajeError } from "../lib/api";
import { descargarCsv } from "../lib/csv";
import {
  claseEstadoFuncionario,
  claseRol,
  etiquetaEstado,
  etiquetaRol,
  fecha,
  nombreCompleto,
} from "../lib/format";
import type { Funcionario, Paginado, Rol } from "../types/api";
import { Alerta } from "../components/ui/Alerta";
import { Cargando } from "../components/ui/Cargando";
import { EstadoVacio } from "../components/ui/EstadoVacio";
import { Icon } from "../components/ui/Icon";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/PageHeader";
import { Paginacion } from "../components/ui/Paginacion";

const ROLES: Array<{ valor: Rol; etiqueta: string }> = [
  { valor: "EVALUADOR", etiqueta: "Evaluador" },
  { valor: "SUPERVISOR", etiqueta: "Supervisor" },
  { valor: "ADMINISTRADOR", etiqueta: "Administrador" },
];

const ESTADOS = [
  { valor: "ACTIVO", etiqueta: "Activo" },
  { valor: "SUSPENDIDO", etiqueta: "Suspendido" },
];

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function crearEsquema(esCreacion: boolean) {
  return z
    .object({
      dni: esCreacion
        ? z.string().regex(/^\d{8}$/, "El DNI debe tener exactamente 8 dígitos.")
        : z.string(),
      nombres: esCreacion
        ? z
            .string()
            .trim()
            .min(1, "Ingresa los nombres del funcionario.")
            .max(100, "Máximo 100 caracteres.")
        : z.string(),
      apellidos: esCreacion
        ? z
            .string()
            .trim()
            .min(1, "Ingresa los apellidos del funcionario.")
            .max(100, "Máximo 100 caracteres.")
        : z.string(),
      cargo: z
        .string()
        .trim()
        .min(1, "Ingresa el cargo del funcionario.")
        .max(100, "Máximo 100 caracteres."),
      email: z
        .string()
        .trim()
        .regex(CORREO, "Ingresa un correo electrónico válido.")
        .max(150, "Máximo 150 caracteres."),
      rol: z.enum(["EVALUADOR", "SUPERVISOR", "ADMINISTRADOR"]),
      estado: z.enum(["ACTIVO", "SUSPENDIDO"]),
      password: esCreacion
        ? z
            .string()
            .min(8, "La contraseña debe tener al menos 8 caracteres.")
            .max(72, "Máximo 72 caracteres.")
        : z.string(),
      confirmar: esCreacion ? z.string().min(1, "Confirma la contraseña.") : z.string(),
    })
    .refine((datos) => !esCreacion || datos.password === datos.confirmar, {
      message: "Las contraseñas no coinciden.",
      path: ["confirmar"],
    });
}

type DatosFuncionario = z.infer<ReturnType<typeof crearEsquema>>;

function CampoError({ mensaje }: { mensaje: string | undefined }) {
  return mensaje ? <p className="help-text text-danger">{mensaje}</p> : null;
}

function FormularioFuncionario({
  funcionario,
  esPropio,
  onCerrar,
  onGuardado,
}: {
  funcionario: Funcionario | null;
  esPropio: boolean;
  onCerrar: () => void;
  onGuardado: (esEdicion: boolean, guardado: Funcionario) => void;
}) {
  const esEdicion = Boolean(funcionario);
  const esquema = useMemo(() => crearEsquema(!esEdicion), [esEdicion]);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DatosFuncionario>({
    resolver: zodResolver(esquema),
    defaultValues: {
      dni: funcionario?.dni ?? "",
      nombres: funcionario?.nombres ?? "",
      apellidos: funcionario?.apellidos ?? "",
      cargo: funcionario?.cargo ?? "",
      email: funcionario?.email ?? "",
      rol: funcionario?.rol ?? "EVALUADOR",
      estado: funcionario?.estado ?? "ACTIVO",
      password: "",
      confirmar: "",
    },
  });

  useEffect(() => {
    reset({
      dni: funcionario?.dni ?? "",
      nombres: funcionario?.nombres ?? "",
      apellidos: funcionario?.apellidos ?? "",
      cargo: funcionario?.cargo ?? "",
      email: funcionario?.email ?? "",
      rol: funcionario?.rol ?? "EVALUADOR",
      estado: funcionario?.estado ?? "ACTIVO",
      password: "",
      confirmar: "",
    });
  }, [funcionario, reset]);

  async function enviar(datos: DatosFuncionario) {
    try {
      const cuerpo = esEdicion
        ? {
            cargo: datos.cargo.trim(),
            email: datos.email.trim(),
            rol: datos.rol,
            estado: datos.estado,
          }
        : {
            dni: datos.dni,
            nombres: datos.nombres.trim(),
            apellidos: datos.apellidos.trim(),
            cargo: datos.cargo.trim(),
            email: datos.email.trim(),
            rol: datos.rol,
            estado: datos.estado,
            password: datos.password,
          };

      const guardado = await api<Funcionario>(
        esEdicion ? `/estado/funcionarios/${funcionario?.id}` : "/estado/funcionarios",
        { method: esEdicion ? "PUT" : "POST", body: cuerpo },
      );
      onGuardado(esEdicion, guardado);
    } catch (fallo) {
      if (fallo instanceof ApiError) {
        const campos: Array<keyof DatosFuncionario> = [
          "dni",
          "nombres",
          "apellidos",
          "cargo",
          "email",
          "rol",
          "estado",
          "password",
        ];
        for (const campo of campos) {
          if (fallo.errores[campo]) {
            setError(campo, { message: fallo.errores[campo] });
          }
        }
      }
      setError("root", { message: mensajeError(fallo) });
    }
  }

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={esEdicion ? "Editar funcionario" : "Nuevo funcionario"}
      descripcion={
        esEdicion
          ? "La identidad y el DNI no son editables. Los cambios de rol o estado se aplican de inmediato."
          : "La cuenta permitirá el acceso a la Plataforma del Estado con el rol asignado."
      }
      ancho="md"
      pie={
        <>
          <button type="button" className="btn-secondary" onClick={onCerrar} disabled={isSubmitting}>
            Cancelar
          </button>
          <button
            type="submit"
            form="form-funcionario"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando…" : esEdicion ? "Guardar cambios" : "Crear funcionario"}
          </button>
        </>
      }
    >
      {errors.root?.message ? (
        <div className="mb-4">
          <Alerta tono="danger">{errors.root.message}</Alerta>
        </div>
      ) : null}

      <form id="form-funcionario" className="space-y-4" onSubmit={handleSubmit(enviar)} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field" htmlFor="func-dni">
              DNI
            </label>
            <input
              id="func-dni"
              type="text"
              inputMode="numeric"
              maxLength={8}
              autoComplete="off"
              className="input-field tabular"
              disabled={esEdicion}
              aria-invalid={Boolean(errors.dni)}
              {...register("dni")}
            />
            <CampoError mensaje={errors.dni?.message} />
          </div>

          <div>
            <label className="label-field" htmlFor="func-cargo">
              Cargo
            </label>
            <input
              id="func-cargo"
              type="text"
              maxLength={100}
              className="input-field"
              autoFocus={esEdicion}
              aria-invalid={Boolean(errors.cargo)}
              {...register("cargo")}
            />
            <CampoError mensaje={errors.cargo?.message} />
          </div>

          <div>
            <label className="label-field" htmlFor="func-nombres">
              Nombres
            </label>
            <input
              id="func-nombres"
              type="text"
              maxLength={100}
              autoComplete="off"
              className="input-field"
              disabled={esEdicion}
              aria-invalid={Boolean(errors.nombres)}
              {...register("nombres")}
            />
            <CampoError mensaje={errors.nombres?.message} />
          </div>

          <div>
            <label className="label-field" htmlFor="func-apellidos">
              Apellidos
            </label>
            <input
              id="func-apellidos"
              type="text"
              maxLength={100}
              autoComplete="off"
              className="input-field"
              disabled={esEdicion}
              aria-invalid={Boolean(errors.apellidos)}
              {...register("apellidos")}
            />
            <CampoError mensaje={errors.apellidos?.message} />
          </div>
        </div>

        <div>
          <label className="label-field" htmlFor="func-email">
            Correo institucional
          </label>
          <input
            id="func-email"
            type="email"
            maxLength={150}
            autoComplete="off"
            className="input-field"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          <CampoError mensaje={errors.email?.message} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field" htmlFor="func-rol">
              Rol
            </label>
            <select
              id="func-rol"
              className="select-field"
              disabled={esPropio}
              aria-describedby={esPropio ? "func-propio" : undefined}
              {...register("rol")}
            >
              {ROLES.map((rol) => (
                <option key={rol.valor} value={rol.valor}>
                  {rol.etiqueta}
                </option>
              ))}
            </select>
            <CampoError mensaje={errors.rol?.message} />
          </div>

          <div>
            <label className="label-field" htmlFor="func-estado">
              Estado
            </label>
            <select
              id="func-estado"
              className="select-field"
              disabled={esPropio}
              aria-describedby={esPropio ? "func-propio" : undefined}
              {...register("estado")}
            >
              {ESTADOS.map((estado) => (
                <option key={estado.valor} value={estado.valor}>
                  {estado.etiqueta}
                </option>
              ))}
            </select>
            <CampoError mensaje={errors.estado?.message} />
          </div>
        </div>

        {esPropio ? (
          <p id="func-propio" className="rounded border border-border bg-bg p-3 text-xs leading-5 text-muted">
            No puedes suspender tu propia cuenta ni quitarte el rol de administrador.
          </p>
        ) : null}

        {!esEdicion ? (
          <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
            <div>
              <label className="label-field" htmlFor="func-password">
                Contraseña inicial
              </label>
              <input
                id="func-password"
                type="password"
                autoComplete="new-password"
                className="input-field"
                aria-invalid={Boolean(errors.password)}
                {...register("password")}
              />
              <p className="help-text">Entre 8 y 72 caracteres.</p>
              <CampoError mensaje={errors.password?.message} />
            </div>

            <div>
              <label className="label-field" htmlFor="func-confirmar">
                Confirmar contraseña
              </label>
              <input
                id="func-confirmar"
                type="password"
                autoComplete="new-password"
                className="input-field"
                aria-invalid={Boolean(errors.confirmar)}
                {...register("confirmar")}
              />
              <CampoError mensaje={errors.confirmar?.message} />
            </div>
          </div>
        ) : (
          <p className="border-t border-border pt-4 text-xs leading-5 text-muted">
            Para cambiar la contraseña usa la acción «Restablecer contraseña» en la tabla. El
            funcionario deberá iniciar sesión nuevamente.
          </p>
        )}
      </form>
    </Modal>
  );
}

function ModalResetClave({
  funcionario,
  onCerrar,
  onGuardado,
}: {
  funcionario: Funcionario;
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (nueva.length < 8 || nueva.length > 72) {
      setError("La nueva contraseña debe tener entre 8 y 72 caracteres.");
      return;
    }
    if (nueva !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await api<void>(`/estado/funcionarios/${funcionario.id}/password`, {
        method: "PUT",
        body: { nueva },
      });
      onGuardado();
    } catch (fallo) {
      setError(mensajeError(fallo));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo="Restablecer contraseña"
      descripcion={`Se asignará una nueva contraseña a ${nombreCompleto(funcionario.nombres, funcionario.apellidos)}.`}
      ancho="sm"
      pie={
        <>
          <button type="button" className="btn-secondary" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </button>
          <button type="submit" form="form-reset-clave" className="btn-primary" disabled={enviando}>
            {enviando ? "Guardando…" : "Restablecer contraseña"}
          </button>
        </>
      }
    >
      {error ? (
        <div className="mb-4">
          <Alerta tono="danger">{error}</Alerta>
        </div>
      ) : null}

      <form id="form-reset-clave" className="space-y-4" onSubmit={enviar}>
        <div>
          <label className="label-field" htmlFor="reset-nueva">
            Nueva contraseña
          </label>
          <input
            id="reset-nueva"
            type="password"
            autoComplete="new-password"
            autoFocus
            className="input-field"
            value={nueva}
            onChange={(evento) => setNueva(evento.target.value)}
            minLength={8}
            maxLength={72}
            required
          />
          <p className="help-text">Entre 8 y 72 caracteres.</p>
        </div>

        <div>
          <label className="label-field" htmlFor="reset-confirmar">
            Confirmar nueva contraseña
          </label>
          <input
            id="reset-confirmar"
            type="password"
            autoComplete="new-password"
            className="input-field"
            value={confirmar}
            onChange={(evento) => setConfirmar(evento.target.value)}
            minLength={8}
            maxLength={72}
            required
          />
        </div>

        <Alerta tono="warning">
          Se cerrarán todas las sesiones abiertas de esta cuenta. El funcionario deberá ingresar
          con la nueva contraseña.
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

export default function FuncionariosPage() {
  const { funcionario: actual } = useAuth();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const rol = params.get("rol") ?? "";
  const estado = params.get("estado") ?? "";
  const pagina = Math.max(1, Number(params.get("page") ?? "1") || 1);

  const [borradorQ, setBorradorQ] = useState(q);
  const [borradorRol, setBorradorRol] = useState(rol);
  const [borradorEstado, setBorradorEstado] = useState(estado);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [seleccionado, setSeleccionado] = useState<Funcionario | null>(null);
  const [resetClave, setResetClave] = useState<Funcionario | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  useEffect(() => {
    setBorradorQ(q);
    setBorradorRol(rol);
    setBorradorEstado(estado);
  }, [q, rol, estado]);

  const consulta = new URLSearchParams();
  consulta.set("page", String(pagina));
  consulta.set("per_page", "25");
  if (q) consulta.set("q", q);
  if (rol) consulta.set("rol", rol);
  if (estado) consulta.set("estado", estado);

  const lista = useApi<Paginado<Funcionario>>(`/estado/funcionarios?${consulta.toString()}`);
  const hayFiltros = Boolean(q || rol || estado);

  function aplicarFiltros(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const siguiente = new URLSearchParams();
    if (borradorQ.trim()) siguiente.set("q", borradorQ.trim());
    if (borradorRol) siguiente.set("rol", borradorRol);
    if (borradorEstado) siguiente.set("estado", borradorEstado);
    setParams(siguiente);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function limpiar() {
    setParams(new URLSearchParams());
    setBorradorQ("");
    setBorradorRol("");
    setBorradorEstado("");
  }

  function cambiarPagina(nueva: number) {
    const siguiente = new URLSearchParams(params);
    siguiente.set("page", String(nueva));
    setParams(siguiente);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function abrirCreacion() {
    setSeleccionado(null);
    setFormularioAbierto(true);
  }

  function abrirEdicion(funcionario: Funcionario) {
    setSeleccionado(funcionario);
    setFormularioAbierto(true);
  }

  function alGuardar(esEdicion: boolean, guardado: Funcionario) {
    setFormularioAbierto(false);
    lista.recargar();
    setAviso({
      tono: "success",
      titulo: esEdicion ? "Funcionario actualizado" : "Funcionario creado",
      texto: esEdicion
        ? `Los datos de ${nombreCompleto(guardado.nombres, guardado.apellidos)} quedaron actualizados.`
        : `${nombreCompleto(guardado.nombres, guardado.apellidos)} ya puede iniciar sesión con su contraseña inicial.`,
    });
  }

  function exportar() {
    if (!lista.data) return;
    descargarCsv(
      "funcionarios",
      lista.data.items.map((item) => ({
        dni: item.dni,
        nombres: item.nombres,
        apellidos: item.apellidos,
        cargo: item.cargo,
        email: item.email,
        rol: etiquetaRol(item.rol),
        estado: etiquetaEstado(item.estado),
        creado: item.created_at,
      })),
      [
        { clave: "dni", titulo: "DNI" },
        { clave: "nombres", titulo: "Nombres" },
        { clave: "apellidos", titulo: "Apellidos" },
        { clave: "cargo", titulo: "Cargo" },
        { clave: "email", titulo: "Correo" },
        { clave: "rol", titulo: "Rol" },
        { clave: "estado", titulo: "Estado" },
        { clave: "creado", titulo: "Fecha de creación" },
      ],
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        titulo="Funcionarios"
        descripcion="Administra las cuentas de la Plataforma del Estado, sus roles y su estado de acceso."
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
            <button type="button" className="btn-primary" onClick={abrirCreacion}>
              <Icon nombre="mas" tamano={18} />
              Nuevo funcionario
            </button>
          </>
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

      <form
        className="card card-pad mb-5 grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_auto]"
        onSubmit={aplicarFiltros}
        role="search"
        aria-label="Filtros de funcionarios"
      >
        <div>
          <label className="label-field" htmlFor="func-q">
            Buscar
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
              <Icon nombre="buscar" tamano={18} />
            </span>
            <input
              id="func-q"
              type="search"
              className="input-field pl-10"
              placeholder="DNI, nombres, correo o cargo"
              value={borradorQ}
              onChange={(evento) => setBorradorQ(evento.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label-field" htmlFor="func-filtro-rol">
            Rol
          </label>
          <select
            id="func-filtro-rol"
            className="select-field"
            value={borradorRol}
            onChange={(evento) => setBorradorRol(evento.target.value)}
          >
            <option value="">Todos los roles</option>
            {ROLES.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.etiqueta}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-field" htmlFor="func-filtro-estado">
            Estado
          </label>
          <select
            id="func-filtro-estado"
            className="select-field"
            value={borradorEstado}
            onChange={(evento) => setBorradorEstado(evento.target.value)}
          >
            <option value="">Todos los estados</option>
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
          <Alerta tono="danger" titulo="No pudimos cargar los funcionarios">
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

      <section className="card overflow-hidden" aria-labelledby="titulo-funcionarios">
        <div className="card-header">
          <div>
            <h2 id="titulo-funcionarios" className="font-semibold text-ink">
              Cuentas institucionales
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {lista.data
                ? `${lista.data.total} funcionario(s) registrados`
                : "Consultando funcionarios…"}
            </p>
          </div>
          <span className="badge badge-admin">Acceso administrativo</span>
        </div>

        {lista.cargando && !lista.data ? (
          <Cargando texto="Cargando funcionarios…" />
        ) : lista.data && lista.data.items.length === 0 ? (
          <EstadoVacio
            icono="usuarios"
            titulo="No hay funcionarios con estos filtros"
            descripcion="Crea una cuenta nueva o ajusta los filtros de búsqueda."
            accion={
              hayFiltros ? (
                <button type="button" className="btn-secondary" onClick={limpiar}>
                  Limpiar filtros
                </button>
              ) : (
                <button type="button" className="btn-primary" onClick={abrirCreacion}>
                  Crear funcionario
                </button>
              )
            }
          />
        ) : lista.data ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="table-base min-w-[900px]">
                <caption className="sr-only">Funcionarios de la Plataforma del Estado</caption>
                <thead>
                  <tr>
                    <th scope="col">Funcionario</th>
                    <th scope="col">DNI</th>
                    <th scope="col">Cargo</th>
                    <th scope="col">Rol</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Creado</th>
                    <th scope="col">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lista.data.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <p className="font-semibold text-ink">
                          {nombreCompleto(item.nombres, item.apellidos)}
                          {item.id === actual?.id ? (
                            <span className="badge badge-neutral ml-2 align-middle">Tú</span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">{item.email}</p>
                      </td>
                      <td className="tabular text-sm text-muted">{item.dni}</td>
                      <td className="text-sm text-ink">{item.cargo}</td>
                      <td>
                        <span className={claseRol(item.rol)}>{etiquetaRol(item.rol)}</span>
                      </td>
                      <td>
                        <span className={claseEstadoFuncionario(item.estado)}>
                          {etiquetaEstado(item.estado)}
                        </span>
                      </td>
                      <td className="tabular text-xs text-muted">{fecha(item.created_at)}</td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => abrirEdicion(item)}
                            aria-label={`Editar a ${nombreCompleto(item.nombres, item.apellidos)}`}
                            title="Editar"
                          >
                            <Icon nombre="editar" tamano={18} />
                          </button>
                          {item.id !== actual?.id ? (
                            <button
                              type="button"
                              className="btn-icon"
                              onClick={() => setResetClave(item)}
                              aria-label={`Restablecer contraseña de ${nombreCompleto(item.nombres, item.apellidos)}`}
                              title="Restablecer contraseña"
                            >
                              <Icon nombre="llave" tamano={18} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-border md:hidden">
              {lista.data.items.map((item) => (
                <li key={item.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">
                        {nombreCompleto(item.nombres, item.apellidos)}
                        {item.id === actual?.id ? (
                          <span className="badge badge-neutral ml-2 align-middle">Tú</span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">{item.email}</p>
                    </div>
                    <span className={claseEstadoFuncionario(item.estado)}>
                      {etiquetaEstado(item.estado)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={claseRol(item.rol)}>{etiquetaRol(item.rol)}</span>
                    <span className="tabular text-xs text-muted">DNI {item.dni}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {item.cargo} · Creado el {fecha(item.created_at)}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => abrirEdicion(item)}
                    >
                      <Icon nombre="editar" tamano={17} />
                      Editar
                    </button>
                    {item.id !== actual?.id ? (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setResetClave(item)}
                      >
                        <Icon nombre="llave" tamano={17} />
                        Contraseña
                      </button>
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

      {formularioAbierto ? (
        <FormularioFuncionario
          key={seleccionado ? `editar-${seleccionado.id}` : "crear"}
          funcionario={seleccionado}
          esPropio={seleccionado?.id === actual?.id}
          onCerrar={() => setFormularioAbierto(false)}
          onGuardado={alGuardar}
        />
      ) : null}

      {resetClave ? (
        <ModalResetClave
          key={`clave-${resetClave.id}`}
          funcionario={resetClave}
          onCerrar={() => setResetClave(null)}
          onGuardado={() => {
            const nombre = nombreCompleto(resetClave.nombres, resetClave.apellidos);
            setResetClave(null);
            setAviso({
              tono: "success",
              titulo: "Contraseña restablecida",
              texto: `Se actualizó la contraseña de ${nombre} y se cerraron sus sesiones abiertas.`,
            });
          }}
        />
      ) : null}
    </>
  );
}
