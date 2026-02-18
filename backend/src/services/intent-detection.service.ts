import { aiService, AIQuery } from './ai.service.js';

export interface DetectedIntent {
  entity: string | null;
  action: 'count' | 'list' | 'detail' | 'summary' | 'status' | 'none';
  filters?: Record<string, any>;
  limit?: number;
}

interface IntentPattern {
  patterns: RegExp[];
  entity: string;
  action: DetectedIntent['action'];
  filters?: Record<string, any>;
  limit?: number;
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    patterns: [
      /cu[aá]ntos?\s+estudiantes?\s+(activos?|hay)/i,
      /estudiantes?\s+activos?/i,
      /total\s+de\s+estudiantes/i,
      /n[uú]mero\s+de\s+estudiantes/i,
    ],
    entity: 'students',
    action: 'count',
    filters: { STATUS: 1 },
  },
  {
    patterns: [
      /lista\s+(de\s+)?estudiantes/i,
      /mostrar\s+estudiantes/i,
      /ver\s+estudiantes/i,
      /qu[eé]\s+estudiantes/i,
    ],
    entity: 'students',
    action: 'list',
    limit: 20,
  },
  {
    patterns: [
      /[uú]ltimo\s+estudiante/i,
      /estudiante\s+reciente/i,
      /[uú]ltimo\s+registrado/i,
    ],
    entity: 'students',
    action: 'detail',
    limit: 1,
  },
  {
    patterns: [
      /cu[aá]ntas?\s+carreras/i,
      /total\s+de\s+carreras/i,
      /qu[eé]\s+carreras/i,
      /lista\s+(de\s+)?carreras/i,
      /carreras\s+(disponibles|hay|existen)/i,
    ],
    entity: 'careers',
    action: 'list',
    limit: 50,
  },
  {
    patterns: [
      /per[ií]odo\s+(actual|activo|en\s+curso)/i,
      /qu[eé]\s+per[ií]odo\s+est[aá]/i,
      /per[ií]odo\s+vigente/i,
    ],
    entity: 'periods',
    action: 'detail',
    filters: { PERIOD_STATUS: 2 },
    limit: 1,
  },
  {
    patterns: [
      /per[ií]odos?\s+acad[eé]micos/i,
      /lista\s+(de\s+)?per[ií]odos/i,
      /resumen\s+(de\s+)?per[ií]odos/i,
      /cu[aá]ntos?\s+per[ií]odos/i,
      /ver\s+per[ií]odos/i,
      /historial\s+(de\s+)?per[ií]odos/i,
    ],
    entity: 'periods',
    action: 'list',
    limit: 20,
  },
  {
    patterns: [
      /cu[aá]ntos?\s+tutores/i,
      /lista\s+(de\s+)?tutores/i,
      /tutores\s+(disponibles|hay|activos)/i,
      /ver\s+tutores/i,
    ],
    entity: 'tutors',
    action: 'list',
    limit: 20,
  },
  {
    patterns: [
      /cu[aá]ntas?\s+instituciones/i,
      /lista\s+(de\s+)?instituciones/i,
      /instituciones\s+(disponibles|hay|registradas)/i,
      /empresas\s+(registradas|hay)/i,
    ],
    entity: 'institutions',
    action: 'list',
    limit: 20,
  },
  {
    patterns: [
      /pasant[ií]as?\s+(activas?|en\s+curso)/i,
      /estado\s+(de\s+)?(las\s+)?pasant[ií]as/i,
      /cu[aá]ntas?\s+pasant[ií]as/i,
    ],
    entity: 'internships',
    action: 'list',
    limit: 20,
  },
  {
    patterns: [
      /inscripciones/i,
      /progreso\s+(de\s+)?inscripciones/i,
      /c[oó]mo\s+van?\s+(las\s+)?inscripciones/i,
    ],
    entity: 'students',
    action: 'summary',
    limit: 50,
  },
  {
    patterns: [
      /procesos?\s+(activos?|hoy)/i,
      /qu[eé]\s+procesos/i,
      /actividades?\s+(de\s+)?hoy/i,
    ],
    entity: 'periods',
    action: 'status',
    filters: { PERIOD_STATUS: 2 },
  },
  {
    patterns: [
      /cu[aá]ntos?\s+usuarios/i,
      /lista\s+(de\s+)?usuarios/i,
      /usuarios\s+(del\s+sistema|registrados|hay)/i,
    ],
    entity: 'users',
    action: 'list',
    limit: 20,
  },
];

export const detectIntent = (message: string): DetectedIntent => {
  const normalized = message.toLowerCase().trim();

  for (const intent of INTENT_PATTERNS) {
    for (const pattern of intent.patterns) {
      if (pattern.test(normalized)) {
        return {
          entity: intent.entity,
          action: intent.action,
          filters: intent.filters,
          limit: intent.limit,
        };
      }
    }
  }

  return { entity: null, action: 'none' };
};

export const fetchContextForIntent = async (
  intent: DetectedIntent,
  requesterId: string | number = 'ai-rag'
): Promise<string | null> => {
  if (!intent.entity || intent.action === 'none') {
    return null;
  }

  try {
    const query: AIQuery = {
      entity: intent.entity,
      select: ['*'],
      filters: intent.filters || {},
      limit: intent.limit || 10,
      page: 1,
    };

    const result = await aiService.executeQuery(query, requesterId);

    if (!result.data || result.data.length === 0) {
      return `[CONSULTA: ${intent.entity}] No se encontraron registros con los filtros aplicados.`;
    }

    const contextParts: string[] = [];
    contextParts.push(`[DATOS REALES DE LA BD - ${intent.entity.toUpperCase()}]`);
    contextParts.push(`Total encontrados: ${result.meta.total || result.data.length}`);
    contextParts.push(`Registros devueltos: ${result.data.length}`);
    contextParts.push(`Datos:`);
    contextParts.push(JSON.stringify(result.data, null, 2));

    return contextParts.join('\n');
  } catch (error: any) {
    console.error(`[RAG] Error fetching context for ${intent.entity}:`, error.message);
    return `[ERROR] No se pudieron obtener datos de ${intent.entity}: ${error.message}`;
  }
};
