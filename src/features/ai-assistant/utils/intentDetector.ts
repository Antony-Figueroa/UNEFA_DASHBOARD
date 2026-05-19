/**
 * Intent Detector - Detecta la intención del usuario para generar sugerencias contextuales
 *
 * Similar al intent-detection.service.ts del backend pero para uso en el frontend
 */

export interface DetectedIntent {
  entity: string | null;
  action: 'count' | 'list' | 'detail' | 'summary' | 'status' | 'none';
  filters?: Record<string, unknown>;
  limit?: number;
}

const INTENT_PATTERNS: Array<{
  patterns: RegExp[];
  entity: string;
  action: DetectedIntent['action'];
}> = [
  {
    patterns: [/estudiantes?|alumnos?/i, /cu[aá]ntos?\s+estudiantes?/i],
    entity: 'students',
    action: 'list',
  },
  {
    patterns: [/carreras?|ingenier[ií]as?/i, /cu[aá]ntas?\s+carreras?/i],
    entity: 'careers',
    action: 'list',
  },
  {
    patterns: [/per[ií]odos?|lapsos?|semestre/i, /per[ií]odo\s+actual/i],
    entity: 'periods',
    action: 'detail',
  },
  {
    patterns: [/pasant[ií]as?|prácticas?|internships/i],
    entity: 'internships',
    action: 'list',
  },
  {
    patterns: [/tutores?|asesores?/i, /cu[aá]ntos?\s+tutores?/i],
    entity: 'tutors',
    action: 'list',
  },
  {
    patterns: [/instituciones?|empresas?|organizaciones?/i],
    entity: 'institutions',
    action: 'list',
  },
  {
    patterns: [/estad[iú]sticas?|resumen|m[ié]tricas?|diagnóstico|reporte/i],
    entity: 'statistics',
    action: 'summary',
  },
  {
    patterns: [/usuarios?|cuentas?/i],
    entity: 'users',
    action: 'list',
  },
];

/**
 * Detecta la intención del mensaje del usuario
 */
export const detectIntent = (message: string): DetectedIntent => {
  const normalized = message.toLowerCase().trim();

  for (const intent of INTENT_PATTERNS) {
    for (const pattern of intent.patterns) {
      if (pattern.test(normalized)) {
        return {
          entity: intent.entity,
          action: intent.action,
        };
      }
    }
  }

  return { entity: null, action: 'none' };
};

/**
 * Genera sugerencias basadas en el contexto actual
 */
export const generateSuggestions = (lastMessage?: string): string[] => {
  const defaultSuggestions = [
    '¿Cuántos estudiantes hay activos?',
    'Muéstrame las carreras disponibles',
    '¿Cuáles son las estadísticas del sistema?',
    'Dame un resumen de las pasantías',
  ];

  if (!lastMessage) {
    return defaultSuggestions;
  }

  const intent = detectIntent(lastMessage);

  const contextualSuggestions: Record<string, string[]> = {
    students: [
      '¿Cuántos estudiantes hay activos?',
      'Ver lista de estudiantes',
      'Estudiantes por carrera',
      'Último estudiante registrado',
    ],
    careers: [
      '¿Cuántas carreras hay activas?',
      'Ver listado de carreras',
      'Carreras con más estudiantes',
      'Agregar nueva carrera',
    ],
    periods: [
      '¿Qué período está activo?',
      'Ver todos los períodos',
      'Crear nuevo período',
      'Períodos por año',
    ],
    internships: [
      '¿Cuántas pasantías hay activas?',
      'Ver listado de pasantías',
      'Pasantías por período',
      'Resumen de prácticas profesionales',
    ],
    tutors: [
      '¿Cuántos tutores hay registrados?',
      'Ver lista de tutores',
      'Tutores por carrera',
      'Agregar nuevo tutor',
    ],
    institutions: [
      '¿Cuántas empresas colaboradoras?',
      'Ver instituciones',
      'Agregar nueva empresa',
      'Empresas con más pasantías',
    ],
    statistics: [
      'Estadísticas generales del sistema',
      'Resumen de registros',
      'Diagnóstico completo',
      'Reporte de estudiantes',
    ],
    users: [
      '¿Cuántos usuarios hay en el sistema?',
      'Ver lista de usuarios',
      'Usuarios por rol',
      'Agregar nuevo usuario',
    ],
  };

  if (intent.entity && contextualSuggestions[intent.entity]) {
    return contextualSuggestions[intent.entity];
  }

  return defaultSuggestions;
};

export default {
  detectIntent,
  generateSuggestions,
};