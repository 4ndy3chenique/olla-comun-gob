import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";

interface EstadoApi<T> {
  data: T | null;
  error: ApiError | null;
  cargando: boolean;
  recargar: () => void;
}

/**
 * Consulta la API sin caché. Cada cambio de ruta o recarga dispara una petición
 * nueva; al desmontar se aborta la petición pendiente.
 */
export function useApi<T>(ruta: string | null): EstadoApi<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [cargando, setCargando] = useState(Boolean(ruta));
  const [version, setVersion] = useState(0);

  const recargar = useCallback(() => {
    setVersion((actual) => actual + 1);
  }, []);

  useEffect(() => {
    if (!ruta) {
      setData(null);
      setError(null);
      setCargando(false);
      return;
    }

    const controlador = new AbortController();
    let activo = true;
    setCargando(true);
    setError(null);

    api<T>(ruta, { signal: controlador.signal })
      .then((respuesta) => {
        if (activo) setData(respuesta);
      })
      .catch((fallo: unknown) => {
        if (!activo) return;
        if (fallo instanceof DOMException && fallo.name === "AbortError") return;
        if (fallo instanceof ApiError) {
          setError(fallo);
        } else {
          setError(new ApiError(0, "Ocurrió un error inesperado."));
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
      controlador.abort();
    };
  }, [ruta, version]);

  return { data, error, cargando, recargar };
}
