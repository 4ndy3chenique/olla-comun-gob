const CLAVE_TOKEN = "estado_token";

/**
 * El token vive en sessionStorage. Solo se guarda en localStorage cuando el
 * funcionario marca explícitamente «Recordarme».
 */
export function guardarSesion(token: string, recordar: boolean): void {
  limpiarSesion();
  if (recordar) {
    window.localStorage.setItem(CLAVE_TOKEN, token);
  } else {
    window.sessionStorage.setItem(CLAVE_TOKEN, token);
  }
}

export function obtenerToken(): string | null {
  return (
    window.sessionStorage.getItem(CLAVE_TOKEN) ??
    window.localStorage.getItem(CLAVE_TOKEN)
  );
}

export function limpiarSesion(): void {
  window.sessionStorage.removeItem(CLAVE_TOKEN);
  window.localStorage.removeItem(CLAVE_TOKEN);
}
