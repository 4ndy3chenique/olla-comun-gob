import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../context/AuthContext";
import { ApiError, API_BASE } from "../lib/api";
import { Alerta } from "../components/ui/Alerta";
import { Icon } from "../components/ui/Icon";

const esquema = z.object({
  identificador: z
    .string()
    .trim()
    .min(1, "Ingresa tu DNI o correo electrónico.")
    .max(150, "El dato ingresado es demasiado largo."),
  password: z
    .string()
    .min(1, "Ingresa tu contraseña.")
    .max(72, "La contraseña no puede superar los 72 caracteres."),
  recordar: z.boolean(),
});

type Datos = z.infer<typeof esquema>;

export default function LoginPage() {
  const { funcionario, iniciarSesion } = useAuth();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [verClave, setVerClave] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Datos>({
    resolver: zodResolver(esquema),
    defaultValues: { identificador: "", password: "", recordar: false },
  });

  if (funcionario) return <Navigate to="/" replace />;

  async function enviar(datos: Datos) {
    try {
      await iniciarSesion(datos.identificador, datos.password, datos.recordar);
      const destino = (ubicacion.state as { desde?: string } | null)?.desde;
      navegar(destino && destino.startsWith("/") && destino !== "/login" ? destino : "/", {
        replace: true,
      });
    } catch (fallo) {
      if (fallo instanceof ApiError) {
        if (fallo.errores.identificador) {
          setError("identificador", { message: fallo.errores.identificador });
        }
        if (fallo.errores.password) {
          setError("password", { message: fallo.errores.password });
        }
        setError("root", { message: fallo.message });
      } else {
        setError("root", { message: "No pudimos iniciar sesión. Intenta de nuevo." });
      }
    }
  }

  return (
    <div className="grid min-h-screen bg-bg lg:grid-cols-[1.08fr_0.92fr]">
      <section className="login-pattern relative hidden overflow-hidden text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div className="login-grid absolute inset-0" aria-hidden="true" />
        <div className="relative flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded border border-white/20 bg-white/10">
            <Icon nombre="escudo" tamano={26} />
          </span>
          <div>
            <p className="text-sm font-bold tracking-wide">Plataforma del Estado</p>
            <p className="text-xs text-white/70">Ollas Comunes</p>
          </div>
        </div>

        <div className="relative max-w-xl py-12">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
            Gestión pública · Evaluación y monitoreo
          </p>
          <h1 className="text-balance text-4xl font-bold leading-[1.12] xl:text-5xl">
            Decisiones trazables para fortalecer las ollas comunes del país.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/75">
            Evalúa postulaciones con validación RENIEC y SISFOH, registra decisiones
            auditadas y monitorea la operación de las ollas comunes desde un solo lugar.
          </p>

          <ul className="mt-10 space-y-4 text-sm text-white/85">
            {[
              "Validación de integrantes y clasificación del hogar.",
              "Decisiones con bitácora firmada y trazabilidad institucional.",
              "Monitoreo de ollas, beneficiarios, guías y KPIs.",
            ].map((texto) => (
              <li key={texto} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/12">
                  <Icon nombre="check" tamano={15} />
                </span>
                <span>{texto}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/15 pt-6 text-xs text-white/55">
          <span>Uso exclusivo de funcionarios autorizados</span>
          <span aria-hidden="true">·</span>
          <span>Ley N.° 29733 — Protección de datos personales</span>
        </div>
      </section>

      <main className="flex min-h-screen flex-col">
        <div className="flex items-center justify-between border-b border-border bg-surface px-5 py-4 lg:hidden">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded bg-primary text-white">
              <Icon nombre="escudo" tamano={22} />
            </span>
            <div>
              <p className="text-sm font-bold text-ink">Plataforma del Estado</p>
              <p className="text-xs text-muted">Ollas Comunes</p>
            </div>
          </div>
          <span className="badge badge-neutral">Acceso restringido</span>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <span className="badge badge-admin mb-4">
                <Icon nombre="candado" tamano={14} />
                Acceso institucional
              </span>
              <h2 className="text-2xl font-bold text-ink sm:text-3xl">Inicia sesión</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Ingresa con tu DNI o correo institucional para acceder a la Plataforma del
                Estado.
              </p>
            </div>

            {!API_BASE ? (
              <div className="mb-5">
                <Alerta tono="danger" titulo="Configuración incompleta">
                  Falta definir <code className="font-mono">VITE_API_BASE_URL</code> al
                  compilar la aplicación.
                </Alerta>
              </div>
            ) : null}

            {errors.root?.message ? (
              <div className="mb-5">
                <Alerta tono="danger" titulo="No se pudo iniciar sesión">
                  {errors.root.message}
                </Alerta>
              </div>
            ) : null}

            <form className="space-y-5" onSubmit={handleSubmit(enviar)} noValidate>
              <div>
                <label className="label-field" htmlFor="identificador">
                  DNI o correo electrónico
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
                    <Icon nombre="usuario" tamano={19} />
                  </span>
                  <input
                    id="identificador"
                    type="text"
                    inputMode="text"
                    autoComplete="username"
                    autoFocus
                    className="input-field pl-10"
                    placeholder="Ej. 40876543 o nombre@midis.gob.pe"
                    aria-invalid={Boolean(errors.identificador)}
                    aria-describedby={errors.identificador ? "error-identificador" : undefined}
                    {...register("identificador")}
                  />
                </div>
                {errors.identificador ? (
                  <p id="error-identificador" className="help-text text-danger">
                    {errors.identificador.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="label-field" htmlFor="password">
                  Contraseña
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
                    <Icon nombre="candado" tamano={19} />
                  </span>
                  <input
                    id="password"
                    type={verClave ? "text" : "password"}
                    autoComplete="current-password"
                    className="input-field px-10"
                    placeholder="Tu contraseña"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "error-password" : undefined}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-primary-dark"
                    onClick={() => setVerClave((valor) => !valor)}
                    aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"}
                    aria-pressed={verClave}
                  >
                    <Icon nombre="ojo" tamano={19} />
                  </button>
                </div>
                {errors.password ? (
                  <p id="error-password" className="help-text text-danger">
                    {errors.password.message}
                  </p>
                ) : null}
              </div>

              <div className="flex items-start justify-between gap-4">
                <label className="flex cursor-pointer items-start gap-3 text-sm text-muted">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-5 w-5 rounded border-border text-primary accent-primary"
                    {...register("recordar")}
                  />
                  <span>
                    <span className="font-medium text-ink">Recordarme</span>
                    <span className="mt-0.5 block text-xs leading-5">
                      Mantener la sesión en este equipo. No lo uses en equipos compartidos.
                    </span>
                  </span>
                </label>
              </div>

              <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span
                      className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                      aria-hidden="true"
                    />
                    Verificando…
                  </>
                ) : (
                  <>
                    Ingresar a la plataforma
                    <Icon nombre="flecha-izquierda" tamano={18} className="rotate-180" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 rounded border border-border bg-surface p-4">
              <div className="flex gap-3">
                <Icon nombre="info" tamano={19} className="mt-0.5 shrink-0 text-info" />
                <p className="text-xs leading-5 text-muted">
                  Si no recuerdas tu contraseña o tu cuenta está suspendida, comunícate con
                  el administrador del sistema. Los accesos y las acciones quedan
                  registrados en la bitácora institucional.
                </p>
              </div>
            </div>
          </div>
        </div>

        <footer className="border-t border-border px-5 py-4 text-center text-[11px] leading-5 text-muted sm:px-8">
          Plataforma del Estado · Ollas Comunes · Acceso restringido
        </footer>
      </main>
    </div>
  );
}
