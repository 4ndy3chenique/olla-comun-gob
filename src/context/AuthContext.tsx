import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError } from "../lib/api";
import { guardarSesion, limpiarSesion, obtenerToken } from "../lib/session";
import type { Funcionario, LoginRespuesta, Rol } from "../types/api";

interface ContextoAuth {
  funcionario: Funcionario | null;
  cargando: boolean;
  iniciarSesion: (
    identificador: string,
    password: string,
    recordar: boolean,
  ) => Promise<Funcionario>;
  cerrarSesion: () => Promise<void>;
  cambiarContrasena: (actual: string, nueva: string) => Promise<void>;
  tieneRol: (...roles: Rol[]) => boolean;
}

const Contexto = createContext<ContextoAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [funcionario, setFuncionario] = useState<Funcionario | null>(null);
  const [cargando, setCargando] = useState(Boolean(obtenerToken()));

  useEffect(() => {
    let activo = true;

    async function recuperarSesion() {
      if (!obtenerToken()) {
        setCargando(false);
        return;
      }
      try {
        const perfil = await api<Funcionario>("/estado/me");
        if (activo) setFuncionario(perfil);
      } catch (fallo) {
        if (fallo instanceof ApiError && fallo.status === 401) {
          limpiarSesion();
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    void recuperarSesion();

    function alExpirar() {
      setFuncionario(null);
    }

    window.addEventListener("estado:sesion-expirada", alExpirar);
    return () => {
      activo = false;
      window.removeEventListener("estado:sesion-expirada", alExpirar);
    };
  }, []);

  const iniciarSesion = useCallback(
    async (identificador: string, password: string, recordar: boolean) => {
      const respuesta = await api<LoginRespuesta>("/estado/auth/login", {
        method: "POST",
        auth: false,
        body: { identificador, password },
      });
      guardarSesion(respuesta.access_token, recordar);
      setFuncionario(respuesta.funcionario);
      return respuesta.funcionario;
    },
    [],
  );

  const cerrarSesion = useCallback(async () => {
    try {
      await api<void>("/estado/auth/logout", { method: "POST" });
    } catch {
      // La sesión local se cierra aunque la revocación remota no responda.
    } finally {
      limpiarSesion();
      setFuncionario(null);
    }
  }, []);

  const cambiarContrasena = useCallback(async (actual: string, nueva: string) => {
    await api<void>("/estado/me/contrasena", {
      method: "PUT",
      body: { actual, nueva },
    });
  }, []);

  const tieneRol = useCallback(
    (...roles: Rol[]) => Boolean(funcionario && roles.includes(funcionario.rol)),
    [funcionario],
  );

  const valor = useMemo<ContextoAuth>(
    () => ({
      funcionario,
      cargando,
      iniciarSesion,
      cerrarSesion,
      cambiarContrasena,
      tieneRol,
    }),
    [funcionario, cargando, iniciarSesion, cerrarSesion, cambiarContrasena, tieneRol],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAuth(): ContextoAuth {
  const contexto = useContext(Contexto);
  if (!contexto) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }
  return contexto;
}
