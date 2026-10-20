import { nombreArchivo } from "./format";

type ValorCsv = string | number | boolean | null | undefined;

function escapar(valor: ValorCsv): string {
  if (valor === null || valor === undefined) return "";
  const texto = String(valor);
  if (/[",\n\r;]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

export function descargarCsv(
  prefijo: string,
  filas: Array<Record<string, ValorCsv>>,
  columnas?: Array<{ clave: string; titulo: string }>,
): void {
  if (filas.length === 0) return;

  const cabeceras =
    columnas ??
    Object.keys(filas[0]).map((clave) => ({ clave, titulo: clave }));

  const lineas = [
    cabeceras.map((columna) => escapar(columna.titulo)).join(";"),
    ...filas.map((fila) =>
      cabeceras.map((columna) => escapar(fila[columna.clave])).join(";"),
    ),
  ];

  // BOM para que Excel reconozca UTF-8 en español.
  const contenido = `\uFEFF${lineas.join("\r\n")}`;
  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(blob);
  enlace.download = nombreArchivo(prefijo);
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
}
