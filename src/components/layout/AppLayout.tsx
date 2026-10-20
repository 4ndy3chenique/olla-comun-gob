import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { iniciales, etiquetaRol, claseRol } from "../../lib/format";
import type { Rol } from "../../types/api";
import { CambiarContrasenaModal } from "../auth/CambiarContrasenaModal";
import { Icon, type NombreIcono } from "../ui/Icon";

interface ItemNav {
  to: string;
  etiqueta: string;
  icono: NombreIcono;
  end?: boolean;
}

interface GrupoNav {
  titulo: string;
  roles?: Rol[];
  items: ItemNav[];
}

const GRUPOS: GrupoNav[] = [
  {
    titulo: "Evaluación",
    items: [
      { to: "/", etiqueta: "Panel", icono: "panel", end: true },
      { to: "/solicitudes", etiqueta: "Solicitudes", icono: "carpeta" },
    ],
  },
  {
    titulo: "Monitoreo",
    roles: ["SUPERVISOR", "ADMINISTRADOR"],
    items: [
      { to: "/ollas", etiqueta: "Ollas y beneficiarios", icono: "edificio" },
      { to: "/reportes", etiqueta: "Reportes y KPIs", icono: "grafico" },
      { to: "/auditoria", etiqueta: "Auditoría", icono: "escudo" },
    ],
  },
  {
    titulo: "Administración",
    roles: ["ADMINISTRADOR"],
    items: [
      { to: "/funcionarios", etiqueta: "Funcionarios", icono: "usuarios" },
      { to: "/parametros", etiqueta: "Parámetros", icono: "ajustes" },
    ],
  },
];

function Marca({ compacta = false }: { compacta?: boolean }) {
  return (
    <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="Ir al panel principal">
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded bg-primary text-white">
        <Icon nombre="escudo" tamano={24} />
      </span>
      <span className="min-w-0">
        <span className={`block truncate font-bold text-ink ${compacta ? "text-sm" : "text-[15px]"}`}>
          Plataforma del Estado
        </span>
        <span className="block truncate text-xs font-medium text-muted">Ollas Comunes</span>
      </span>
    </Link>
  );
}

function Navegacion({
  alNavegar,
  alSeguridad,
  alSalir,
  saliendo,
}: {
  alNavegar?: () => void;
  alSeguridad: () => void;
  alSalir: () => void;
  saliendo: boolean;
}) {
  const { funcionario, tieneRol } = useAuth();
  if (!funcionario) return null;

  return (
    <div className="flex h-full flex-col">
      <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Navegación principal">
        {GRUPOS.map((grupo) => {
          if (grupo.roles && !tieneRol(...grupo.roles)) return null;
          return (
            <div key={grupo.titulo} className="mb-6 last:mb-0">
              <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted/80">
                {grupo.titulo}
              </p>
              <ul className="space-y-1">
                {grupo.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={alNavegar}
                      className={({ isActive }) =>
                        `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
                      }
                    >
                      <Icon nombre={item.icono} tamano={19} className="shrink-0" />
                      <span className="truncate">{item.etiqueta}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="rounded border border-border bg-bg p-3">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              {iniciales(funcionario.nombres, funcionario.apellidos)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {funcionario.nombres} {funcionario.apellidos}
              </p>
              <p className="truncate text-xs text-muted">{funcionario.cargo}</p>
              <span className={`mt-1.5 ${claseRol(funcionario.rol)}`}>
                {etiquetaRol(funcionario.rol)}
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 border-t border-border pt-2">
            <button
              type="button"
              className="btn-ghost flex-1 justify-start px-2 text-xs"
              onClick={alSeguridad}
            >
              <Icon nombre="candado" tamano={17} />
              Seguridad
            </button>
            <button
              type="button"
              className="btn-ghost flex-1 justify-start px-2 text-xs text-danger hover:bg-danger-light hover:text-danger"
              onClick={alSalir}
              disabled={saliendo}
            >
              <Icon nombre="salir" tamano={17} />
              {saliendo ? "Saliendo…" : "Salir"}
            </button>
          </div>
        </div>
        <p className="mt-3 px-1 text-[11px] leading-4 text-muted">
          Uso exclusivo de funcionarios autorizados. Las acciones quedan auditadas.
        </p>
      </div>
    </div>
  );
}

export function AppLayout() {
  const { funcionario, cerrarSesion } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [seguridadAbierta, setSeguridadAbierta] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const cerrarMenuRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMenuAbierto(false);
  }, [ubicacion.pathname]);

  useEffect(() => {
    if (!menuAbierto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cerrarMenuRef.current?.focus();

    function alPresionar(evento: KeyboardEvent) {
      if (evento.key === "Escape") setMenuAbierto(false);
    }

    document.addEventListener("keydown", alPresionar);
    return () => {
      document.body.style.overflow = anterior;
      document.removeEventListener("keydown", alPresionar);
    };
  }, [menuAbierto]);

  async function salir() {
    setSaliendo(true);
    try {
      await cerrarSesion();
      navegar("/login", { replace: true });
    } finally {
      setSaliendo(false);
    }
  }

  const fechaActual = new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="min-h-screen bg-bg">
      <a href="#contenido" className="skip-link">
        Saltar al contenido principal
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-20 shrink-0 items-center border-b border-border px-5">
          <Marca />
        </div>
        <Navegacion
          alSeguridad={() => setSeguridadAbierta(true)}
          alSalir={salir}
          saliendo={saliendo}
        />
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 hidden h-16 items-center border-b border-border bg-bg/90 backdrop-blur lg:flex">
          <div className="mx-auto flex w-full max-w-contenido items-center justify-between gap-4 px-8">
            <div className="flex items-center gap-3 text-sm text-muted">
              <Icon nombre="calendario" tamano={17} />
              <span>{fechaActual}</span>
              <span className="text-border">|</span>
              <span className="font-medium text-primary-dark">Sesión institucional</span>
            </div>
            {funcionario ? (
              <div className="flex items-center gap-3">
                <span className={claseRol(funcionario.rol)}>{etiquetaRol(funcionario.rol)}</span>
                <span className="text-sm font-medium text-ink">
                  {funcionario.nombres} {funcionario.apellidos}
                </span>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setSeguridadAbierta(true)}
                  aria-label="Cambiar contraseña"
                  title="Cambiar contraseña"
                >
                  <Icon nombre="candado" tamano={19} />
                </button>
                <button
                  type="button"
                  className="btn-icon hover:bg-danger-light hover:text-danger"
                  onClick={salir}
                  disabled={saliendo}
                  aria-label="Cerrar sesión"
                  title="Cerrar sesión"
                >
                  <Icon nombre="salir" tamano={19} />
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-icon"
              onClick={() => setMenuAbierto(true)}
              aria-label="Abrir menú de navegación"
              aria-expanded={menuAbierto}
            >
              <Icon nombre="menu" tamano={22} />
            </button>
            <Marca compacta />
          </div>
          {funcionario ? (
            <span className={claseRol(funcionario.rol)}>{etiquetaRol(funcionario.rol)}</span>
          ) : null}
        </header>

        {menuAbierto ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 h-full w-full bg-ink/45"
              aria-label="Cerrar menú"
              onClick={() => setMenuAbierto(false)}
            />
            <aside
              className="absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col bg-surface shadow-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Menú de navegación"
            >
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
                <Marca compacta />
                <button
                  ref={cerrarMenuRef}
                  type="button"
                  className="btn-icon"
                  onClick={() => setMenuAbierto(false)}
                  aria-label="Cerrar menú"
                >
                  <Icon nombre="cerrar" tamano={21} />
                </button>
              </div>
              <Navegacion
                alNavegar={() => setMenuAbierto(false)}
                alSeguridad={() => {
                  setMenuAbierto(false);
                  setSeguridadAbierta(true);
                }}
                alSalir={salir}
                saliendo={saliendo}
              />
            </aside>
          </div>
        ) : null}

        <main
          id="contenido"
          className="mx-auto w-full max-w-contenido px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          <Outlet />
        </main>

        <footer className="mx-auto flex w-full max-w-contenido flex-col gap-1 border-t border-border px-4 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Plataforma del Estado · Ollas Comunes</p>
          <p>Acceso restringido · Datos personales protegidos (Ley N.° 29733)</p>
        </footer>
      </div>

      <CambiarContrasenaModal
        abierto={seguridadAbierta}
        onCerrar={() => setSeguridadAbierta(false)}
      />
    </div>
  );
}
