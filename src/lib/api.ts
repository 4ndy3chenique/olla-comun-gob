import { limpiarSesion, obtenerToken } from "./session";

const BASE_CONFIGURADA = (import.meta.env.VITE_API_BASE_URL ?? "").trim();
export const API_BASE = BASE_CONFIGURADA.replace(/\/+$/, "");

export class ApiError extends Error {
  readonly status: number;
  readonly errores: Record<string, string>;

  constructor(status: number, mensaje: string, errores: Record<string, string> = {}) {
    super(mensaje);
    this.name = "ApiError";
    this.status = status;
    this.errores = errores;
  }
}

interface OpcionesApi {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
}

function esErrorApi(valor: unknown): valor is { mensaje?: string; errores?: Record<string, string> } {
  return typeof valor === "object" && valor !== null;
}

export function mensajeError(fallo: unknown): string {
  if (fallo instanceof ApiError) return fallo.message;
  return "Ocurrió un error inesperado. Intenta de nuevo.";
}

export async function api<T>(ruta: string, opciones: OpcionesApi = {}): Promise<T> {
  if (!API_BASE) {
    throw new ApiError(
      0,
      "La aplicación no tiene configurada la URL de la API (VITE_API_BASE_URL).",
    );
  }

  const token = opciones.auth === false ? null : obtenerToken();
  const cabeceras: Record<string, string> = { Accept: "application/json" };
  if (opciones.body !== undefined) {
    cabeceras["Content-Type"] = "application/json";
  }
  if (token) {
    cabeceras.Authorization = `Bearer ${token}`;
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_BASE}${ruta}`, {
      method: opciones.method ?? "GET",
      headers: cabeceras,
      body: opciones.body === undefined ? undefined : JSON.stringify(opciones.body),
      cache: "no-store",
      credentials: "omit",
      signal: opciones.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new ApiError(
      0,
      "No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.",
    );
  }

  const texto = await respuesta.text();
  let cuerpo: unknown = null;
  if (texto) {
    try {
      cuerpo = JSON.parse(texto);
    } catch {
      cuerpo = null;
    }
  }

  if (!respuesta.ok) {
    const detalle = esErrorApi(cuerpo) ? cuerpo : {};
    const mensaje =
      typeof detalle.mensaje === "string" && detalle.mensaje
        ? detalle.mensaje
        : "No pudimos completar la operación. Intenta de nuevo.";
    const errores =
      typeof detalle.errores === "object" && detalle.errores !== null
        ? detalle.errores
        : {};

    if (respuesta.status === 401 && opciones.auth !== false && !ruta.includes("/auth/login")) {
      limpiarSesion();
      window.dispatchEvent(new Event("estado:sesion-expirada"));
    }

    throw new ApiError(respuesta.status, mensaje, errores);
  }

  return (cuerpo as T) ?? (undefined as T);
}
