export type Rol = "EVALUADOR" | "SUPERVISOR" | "ADMINISTRADOR";
export type EstadoFuncionario = "ACTIVO" | "SUSPENDIDO";
export type EstadoSolicitud =
  | "PENDIENTE"
  | "EN_EVALUACION"
  | "OBSERVADA"
  | "APTA"
  | "NO_APTA";
export type Decision = "APROBAR" | "OBSERVAR" | "RECHAZAR";

export interface Funcionario {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  cargo: string;
  email: string;
  rol: Rol;
  estado: EstadoFuncionario;
  created_at: string;
}

export interface LoginRespuesta {
  funcionario: Funcionario;
  access_token: string;
  refresh_token: string;
  expira_en: string;
}

export interface Paginado<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
}

export interface SolicitudItem {
  id: number;
  olla_nombre: string;
  num_personas_declaradas: number;
  fecha_fundacion: string;
  dirigente_dni: string;
  dirigente_nombres: string;
  dirigente_apellidos: string;
  direccion: string;
  distrito: string;
  fecha_solicitud: string;
  estado: EstadoSolicitud;
  total_integrantes: number;
  evaluador: { id: number; nombres: string; apellidos: string } | null;
  ultima_evaluacion: string | null;
  ultima_decision: string | null;
}

export interface EvaluadorResumen {
  id: number;
  nombres: string;
  apellidos: string;
  asignadas: number;
  en_cola: number;
  aprobadas: number;
  rechazadas: number;
}

export interface ResumenEstado {
  estado: EstadoSolicitud;
  cantidad: number;
}

export interface Resumen {
  totales: {
    total: number;
    pendiente: number;
    en_evaluacion: number;
    observada: number;
    apta: number;
    no_apta: number;
  };
  estados: ResumenEstado[];
  distritos: Array<{ distrito: string; cantidad: number }>;
  evaluadores: EvaluadorResumen[];
  antiguedad_pendientes: {
    menos_24h: number;
    entre_24_72h: number;
    mas_72h: number;
  };
  promedio_evaluacion_ms: number | null;
  corridas_evaluacion: number;
  cola: { sin_asignar: number; mias: number };
  recientes: SolicitudItem[];
  generado_en: string;
}

export interface Integrante {
  id: number;
  dni: string;
  dni_masked: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  parentesco_con_dirigente: string;
}

export interface Evaluacion {
  id: number;
  solicitud_id: number;
  resultado_reniec: "VALIDO" | "INVALIDO" | "NO_EVALUADO";
  resultado_sisfoh: "POBRE_EXTREMO" | "POBRE" | "NO_POBRE" | "NO_EVALUADO";
  integrantes_validados: number | null;
  aptitud_automatica: "APTA" | "REQUIERE_REVISION" | "NO_APTA";
  motivos: string[];
  fecha_evaluacion: string;
  tiempo_evaluacion_ms: number | null;
  funcionario_id: number | null;
  funcionario_nombres: string | null;
  funcionario_apellidos: string | null;
}

export interface DecisionItem {
  id: number;
  solicitud_id: number;
  decision: Decision;
  observaciones: string | null;
  fecha_decision: string;
  funcionario_id: number;
  funcionario_nombres: string;
  funcionario_apellidos: string;
  funcionario_rol: Rol;
}

export interface Asignacion {
  id: number;
  solicitud_id: number;
  num_integrantes_aprobados: number;
  kcal_total_asignado: number;
  kg_insumos_asignado: number;
  porciones_diarias: number;
  fecha_asignacion: string;
}

export interface Notificacion {
  id: number;
  solicitud_id: number;
  tipo: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
}

export interface BitacoraItem {
  id: number;
  solicitud_id: number;
  funcionario_id: number | null;
  funcionario_nombres: string | null;
  funcionario_apellidos: string | null;
  actor_dni: string | null;
  declaracion: boolean;
  accion: string;
  firma_valida: boolean;
  timestamp: string;
}

export interface OllaCentral {
  id: number;
  nombre: string;
  estado_aprobacion: string;
  fecha_aprobacion: string | null;
  num_personas_declaradas: number | null;
}

export interface SolicitudDetalle extends SolicitudItem {
  dirigente_dni_completo: string;
  fecha_asignacion: string | null;
  asignado_por: { id: number; nombres: string; apellidos: string } | null;
  integrantes: Integrante[];
  evaluaciones: Evaluacion[];
  decisiones: DecisionItem[];
  asignaciones: Asignacion[];
  notificaciones: Notificacion[];
  bitacora: BitacoraItem[];
  olla_central: OllaCentral | null;
  puede: {
    asignar: boolean;
    evaluar: boolean;
    decidir: boolean;
    sincronizar: boolean;
  };
}

export interface EvaluadorOpcion {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  cargo: string;
  email: string;
}

export interface ResultadoEvaluacion {
  evaluacion: {
    id: number;
    solicitud_id: number;
    resultado_reniec: Evaluacion["resultado_reniec"];
    resultado_sisfoh: Evaluacion["resultado_sisfoh"];
    integrantes_validados: number;
    total_integrantes: number;
    aptitud_automatica: Evaluacion["aptitud_automatica"];
    motivos: string[];
    fecha_evaluacion: string;
    tiempo_evaluacion_ms: number;
    funcionario_id: number;
  };
  sin_sisfoh: number;
  tiempo_total_ms: number;
}

export interface ResultadoDecision {
  solicitud_id: number;
  decision_id: number;
  decision: Decision;
  estado: EstadoSolicitud;
  asignacion_id: number | null;
  notificacion_id: number | null;
  sincronizacion_pendiente: boolean;
  olla_central_id?: number | null;
  sincronizacion_accion?: string | null;
  mensaje?: string;
}

export interface ResultadoSincronizacion {
  solicitud_id: number;
  sincronizacion_pendiente: boolean;
  olla_central_id: number | null;
  accion: "creada" | "actualizada" | null;
  mensaje: string;
}

export interface OllaItem {
  id: number;
  nombre: string;
  direccion: string;
  distrito: string;
  num_personas_declaradas: number | null;
  fecha_fundacion: string | null;
  dirigente_usuario_id: number | null;
  dirigente_nombres: string | null;
  dirigente_apellidos: string | null;
  solicitud_id_estado: number | null;
  estado_aprobacion: string;
  fecha_aprobacion: string | null;
  beneficiarios_activos: number;
  beneficiarios_total: number;
  ultima_guia_estado: string | null;
  ultima_guia_fecha: string | null;
}

export interface Beneficiario {
  id: number;
  dni: string;
  dni_masked: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  integrantes_hogar: number;
  condicion_nutricional: string | null;
  estado_padron: string;
  created_at: string;
}

export interface GuiaResumen {
  id: number;
  estado_fsm: string;
  fecha_generacion: string;
  fecha_despacho: string | null;
  fecha_recepcion: string | null;
  fecha_liquidacion: string | null;
  items: number;
}

export interface MenuResumen {
  id: number;
  fecha: string;
  tipo_racion: string;
  kcal_total_calculada: number;
  cumple_rango_optimo: boolean;
}

export interface OllaDetalle {
  olla: OllaItem & {
    dirigente_dni: string | null;
    dirigente_email: string | null;
    created_at: string;
  };
  beneficiarios: Beneficiario[];
  guias: GuiaResumen[];
  menu: MenuResumen[];
}

export interface Kpi {
  codigo_kpi: string;
  subsistema: string;
  unidad: string;
  meta_diseno: string;
  valor: number;
  valor_anterior: number | null;
  delta: number | null;
  cumple_meta: boolean;
  fecha_medicion: string;
}

export interface AuditoriaItem {
  origen: "postulaciones" | "central";
  id: number;
  solicitud_id?: number;
  olla_nombre?: string | null;
  accion?: string;
  tipo_evento?: string;
  entidad_afectada?: string;
  entidad_id?: number;
  actor_dni?: string | null;
  funcionario_nombres?: string | null;
  funcionario_apellidos?: string | null;
  usuario_id?: number | null;
  usuario_nombres?: string | null;
  usuario_apellidos?: string | null;
  declaracion?: boolean;
  firma_valida: boolean;
  timestamp: string;
}

export interface Cobertura {
  solicitudes_por_distrito: Array<{
    distrito: string;
    solicitudes: number;
    aptas: number;
    no_aptas: number;
    personas_declaradas: number;
  }>;
  solicitudes_por_estado: Array<{
    estado: EstadoSolicitud;
    cantidad: number;
    personas_declaradas: number;
  }>;
  ollas_por_distrito: Array<{
    distrito: string;
    ollas: number;
    aptas: number;
    beneficiarios_activos: number;
  }>;
  guias_por_estado: Array<{ estado_fsm: string; cantidad: number }>;
}

export interface Parametro {
  id: number;
  nombre_parametro: string;
  valor: string;
  descripcion: string | null;
  updated_at: string | null;
}

export interface SincronizacionPendiente {
  solicitud_id: number;
  olla_nombre: string;
  distrito: string;
  fecha_solicitud: string;
  num_personas_declaradas: number;
  motivo: "SIN_OLLA_CENTRAL" | "OLLA_NO_APROBADA";
  olla_central: {
    id: number;
    estado_aprobacion: string;
    fecha_aprobacion: string | null;
  } | null;
}

export interface PaginadoConOrigen<T> extends Paginado<T> {
  origen?: string;
}
