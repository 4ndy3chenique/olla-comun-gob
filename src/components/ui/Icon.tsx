import type { ReactNode, SVGProps } from "react";

export type NombreIcono =
  | "panel"
  | "carpeta"
  | "edificio"
  | "grafico"
  | "escudo"
  | "usuarios"
  | "ajustes"
  | "salir"
  | "menu"
  | "cerrar"
  | "buscar"
  | "chevron-abajo"
  | "chevron-izquierda"
  | "chevron-derecha"
  | "check"
  | "check-circulo"
  | "alerta"
  | "reloj"
  | "refrescar"
  | "descargar"
  | "candado"
  | "ojo"
  | "flecha-izquierda"
  | "mas"
  | "editar"
  | "llave"
  | "campana"
  | "portapapeles"
  | "mapa"
  | "balanza"
  | "externo"
  | "filtro"
  | "usuario"
  | "x-circulo"
  | "info"
  | "calendario"
  | "documento"
  | "chef"
  | "camion"
  | "hoja";

interface Props extends SVGProps<SVGSVGElement> {
  nombre: NombreIcono;
  tamano?: number;
}

const trazos: Record<NombreIcono, ReactNode> = {
  panel: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  carpeta: (
    <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Z" />
  ),
  edificio: (
    <>
      <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
      <path d="M16 9h2a2 2 0 0 1 2 2v10" />
      <path d="M2 21h20" />
      <path d="M8 7h4M8 11h4M8 15h4M8 21v-2h4v2" />
    </>
  ),
  grafico: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  escudo: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.6 3.1 8 7.5 9.5 4.4-1.5 7.5-4.9 7.5-9.5V6L12 3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  usuarios: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  ajustes: (
    <>
      <path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h10M18 18h2" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="8" cy="12" r="2" />
      <circle cx="16" cy="18" r="2" />
    </>
  ),
  salir: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  cerrar: <path d="M6 6l12 12M18 6 6 18" />,
  buscar: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  "chevron-abajo": <path d="m6 9 6 6 6-6" />,
  "chevron-izquierda": <path d="m15 18-6-6 6-6" />,
  "chevron-derecha": <path d="m9 18 6-6-6-6" />,
  check: <path d="m5 12 4.5 4.5L19 7" />,
  "check-circulo": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </>
  ),
  alerta: (
    <>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  reloj: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  refrescar: (
    <>
      <path d="M20 11a8 8 0 0 0-14.9-4M4 4v5h5M4 13a8 8 0 0 0 14.9 4M20 20v-5h-5" />
    </>
  ),
  descargar: (
    <>
      <path d="M12 3v12M7 10l5 5 5-5" />
      <path d="M4 21h16" />
    </>
  ),
  candado: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  ojo: (
    <>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  "flecha-izquierda": <path d="M19 12H5m6-7-7 7 7 7" />,
  mas: <path d="M12 5v14M5 12h14" />,
  editar: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </>
  ),
  llave: (
    <>
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="m10.5 12.5 8-8M16 7l2 2M13 10l2 2" />
    </>
  ),
  campana: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
  portapapeles: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3h6v1M9 9h6M9 13h6M9 17h4" />
    </>
  ),
  mapa: (
    <>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  balanza: (
    <>
      <path d="M12 3v18M7 21h10M5 7h14M5 7l-3 6h6L5 7ZM19 7l-3 6h6l-3-6Z" />
    </>
  ),
  externo: (
    <>
      <path d="M14 3h7v7M21 3l-9 9" />
      <path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" />
    </>
  ),
  filtro: <path d="M4 5h16l-6.5 8v5l-3 2v-7L4 5Z" />,
  usuario: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  "x-circulo": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  calendario: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 11h18" />
    </>
  ),
  documento: (
    <>
      <path d="M6 2h8l4 4v16H6V2Z" />
      <path d="M14 2v5h5M9 12h6M9 16h6" />
    </>
  ),
  chef: (
    <>
      <path d="M6 13a4 4 0 0 1-1-7.9A4.5 4.5 0 0 1 12 3a4.5 4.5 0 0 1 7 2.1A4 4 0 0 1 18 13" />
      <path d="M6 13h12v6a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-6ZM8 17h8" />
    </>
  ),
  camion: (
    <>
      <path d="M1 4h13v12H1zM14 8h4l3 4v4h-7" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  hoja: (
    <>
      <path d="M20 4c-8 0-14 4-14 10a6 6 0 0 0 6 6c6 0 8-8 8-16Z" />
      <path d="M4 21c2-6 6-9 11-11" />
    </>
  ),
};

export function Icon({ nombre, tamano = 20, ...props }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {trazos[nombre]}
    </svg>
  );
}
