const LIMA = "America/Lima";

const fechaMedia = new Intl.DateTimeFormat("es-PE", {
  timeZone: LIMA,
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const fechaHoraMedia = new Intl.DateTimeFormat("es-PE", {
  timeZone: LIMA,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const numero = new Intl.NumberFormat("es-PE");

export function fecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  const valor = new Date(iso);
  return Number.isNaN(valor.getTime()) ? "—" : fechaMedia.format(valor);
}

export function fechaHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  const valor = new Date(iso);
  return Number.isNaN(valor.getTime()) ? "—" : fechaHoraMedia.format(valor);
}

export function numeroHumano(valor: number | null | undefined): string {
  return valor === null || valor === undefined ? "—" : numero.format(valor);
}

export function decimal(valor: number | null | undefined, maximo = 1): string {
  if (valor === null || valor === undefined) return "—";
  return new Intl.NumberFormat("es-PE", {
    maximumFractionDigits: maximo,
    minimumFractionDigits: 0,
  }).format(valor);
}

export function porcentaje(valor: number, total: number): string {
  if (total <= 0) return "0 %";
  return `${Math.round((valor / total) * 100)} %`;
}

export function duracion(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "—";
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  const minutos = Math.floor(ms / 60_000);
  const segundos = Math.round((ms % 60_000) / 1000);
  return `${minutos} min ${segundos} s`;
}

export function iniciales(nombres: string, apellidos: string): string {
  return `${nombres.trim().charAt(0)}${apellidos.trim().charAt(0)}`.toUpperCase() || "?";
}

export function nombreCompleto(nombres: string, apellidos: string): string {
  return `${nombres} ${apellidos}`.trim();
}

export function etiquetaRol(rol: string): string {
  return (
    {
      EVALUADOR: "Evaluador",
      SUPERVISOR: "Supervisor",
      ADMINISTRADOR: "Administrador",
    }[rol] ?? rol
  );
}

export function etiquetaEstado(estado: string): string {
  return (
    {
      PENDIENTE: "Pendiente",
      EN_EVALUACION: "En evaluación",
      OBSERVADA: "Observada",
      APTA: "Apta",
      NO_APTA: "No apta",
      ACTIVO: "Activo",
      SUSPENDIDO: "Suspendido",
      APROBADA: "Aprobada",
    }[estado] ?? estado
  );
}

export function etiquetaAptitud(valor: string): string {
  return (
    {
      APTA: "Apta",
      REQUIERE_REVISION: "Requiere revisión",
      NO_APTA: "No apta",
      VALIDO: "Válido",
      INVALIDO: "Inválido",
      NO_EVALUADO: "No evaluado",
      POBRE_EXTREMO: "Pobre extremo",
      POBRE: "Pobre",
      NO_POBRE: "No pobre",
    }[valor] ?? valor
  );
}

export function etiquetaAccion(accion: string): string {
  return (
    {
      ENVIO_SOLICITUD: "Envío de solicitud",
      ASIGNACION_EVALUADOR: "Asignación de evaluador",
      EVALUACION_REALIZADA: "Evaluación realizada",
      DECISION_APROBAR: "Decisión: aprobar",
      DECISION_OBSERVAR: "Decisión: observar",
      DECISION_RECHAZAR: "Decisión: rechazar",
      APROBACION_SOLICITUD_ESTADO: "Sincronización con central",
    }[accion] ?? accion
  );
}

export function etiquetaDecision(decision: string): string {
  return (
    {
      APROBAR: "Aprobada",
      OBSERVAR: "Observada",
      RECHAZAR: "Rechazada",
    }[decision] ?? decision
  );
}

export function etiquetaNotificacion(tipo: string): string {
  return (
    {
      APROBACION: "Aprobación",
      OBSERVACION: "Observación",
      RECHAZO: "Rechazo",
    }[tipo] ?? tipo
  );
}

export function etiquetaGuia(estado: string): string {
  return (
    {
      GENERADA: "Generada",
      DESPACHADA: "Despachada",
      RECIBIDA: "Recibida",
      LIQUIDADA: "Liquidada",
    }[estado] ?? estado
  );
}

export function claseEstadoSolicitud(estado: string): string {
  return (
    {
      PENDIENTE: "badge badge-pendiente",
      EN_EVALUACION: "badge badge-en-evaluacion",
      OBSERVADA: "badge badge-observada",
      APTA: "badge badge-apta",
      NO_APTA: "badge badge-no-apta",
    }[estado] ?? "badge badge-neutral"
  );
}

export function claseEstadoFuncionario(estado: string): string {
  return estado === "ACTIVO" ? "badge badge-activo" : "badge badge-suspendido";
}

export function claseRol(rol: string): string {
  return (
    {
      ADMINISTRADOR: "badge badge-admin",
      SUPERVISOR: "badge badge-supervisor",
      EVALUADOR: "badge badge-evaluador",
    }[rol] ?? "badge badge-neutral"
  );
}

export function claseAptitud(valor: string): string {
  return (
    {
      APTA: "badge badge-apta",
      REQUIERE_REVISION: "badge badge-en-evaluacion",
      NO_APTA: "badge badge-no-apta",
      VALIDO: "badge badge-apta",
      INVALIDO: "badge badge-no-apta",
      NO_EVALUADO: "badge badge-neutral",
      POBRE_EXTREMO: "badge badge-apta",
      POBRE: "badge badge-apta",
      NO_POBRE: "badge badge-no-apta",
    }[valor] ?? "badge badge-neutral"
  );
}

export function nombreArchivo(prefijo: string): string {
  const ahora = new Date();
  const marca = `${ahora.getFullYear()}${String(ahora.getMonth() + 1).padStart(2, "0")}${String(
    ahora.getDate(),
  ).padStart(2, "0")}-${String(ahora.getHours()).padStart(2, "0")}${String(
    ahora.getMinutes(),
  ).padStart(2, "0")}`;
  return `${prefijo}-${marca}.csv`;
}
