/**
 * Knowledge Base Seed Service — Datos iniciales para la base de conocimiento
 *
 * Se ejecuta al iniciar la app si la tabla está vacía.
 * Los seeds son plantillas que el administrador puede editar posteriormente.
 */

import { supabase } from '../lib/supabase.js';
import * as kbService from './knowledge-base.service.js';

// ============================================
// Seed Data
// ============================================

interface SeedEntry {
  title: string;
  category: 'regulation' | 'curriculum' | 'process' | 'faq' | 'general';
  content: string;
  metadata: Record<string, any>;
  roles: number[] | null;
}

const SEED_DATA: SeedEntry[] = [
  // ============================================
  // PROCESS — Guías paso a paso
  // ============================================
  {
    title: 'Inscripción de Estudiante',
    category: 'process',
    content: `## Inscripción de Estudiante

### Requisitos
- CI del estudiante (original y copia)
- Datos de contacto (teléfono, email, dirección)
- Partida de nacimiento (original y copia)
- Título de bachiller (original y copia)

### Paso a Paso
1. **Navegar al módulo**: Ve a Estudiantes > Nuevo Estudiante
2. **Datos personales**: Completa CI, nombre, apellido, fecha de nacimiento, lugar de nacimiento
3. **Datos académicos**: Selecciona carrera, período, turno (mañana/tarde/noche)
4. **Contacto**: Ingresa teléfono, email, dirección de habitación
5. **Guardar**: Haz clic en Guardar. El sistema crea el usuario automáticamente.
6. **Verificar**: Confirma que el estudiante aparezca en el listado de estudiantes

### Tiempo estimado
10-15 minutos

### Rol requerido
Administrador o Asistente`,
    metadata: {
      tags: ['estudiantes', 'inscripcion', 'nuevo', 'registro'],
      relatedModules: ['students', 'users'],
      screen: '/students',
    },
    roles: [0, 1, 2],
  },
  {
    title: 'Registro de Pasantía',
    category: 'process',
    content: `## Registro de Pasantía / Práctica Profesional

### Requisitos
- Estudiante activo en el sistema
- Institución/empresa registrada
- Tutor académico asignado
- Período académico activo

### Paso a Paso
1. **Ir a Pasantías**: Ve al módulo de Pasantías desde el menú principal
2. **Nuevo registro**: Haz clic en "Nueva Pasantía"
3. **Seleccionar estudiante**: Busca y selecciona el estudiante por CI o nombre
4. **Datos de la pasantía**: Completa institución, tutor, fechas de inicio y fin
5. **Tipo de pasantía**: Selecciona si es académica, metodológica o profesional
6. **Guardar**: Haz clic en Guardar
7. **Asignar tutor**: Si no se asignó antes, ve a la sección de Tutores

### Tiempo estimado
15-20 minutos

### Rol requerido
Administrador o Asistente`,
    metadata: {
      tags: ['pasantias', 'practicas', 'registro', 'tutores'],
      relatedModules: ['tracking', 'tutors', 'institutions'],
      screen: '/tracking',
    },
    roles: [0, 1, 2],
  },
  {
    title: 'Solicitud de Documentos',
    category: 'process',
    content: `## Solicitud de Documentos (Estudiante)

### Requisitos
- Estudiante activo en el sistema
- Haber iniciado sesión como estudiante

### Paso a Paso
1. **Iniciar sesión**: Ingresa con tu usuario de estudiante
2. **Ir a solicitudes**: Ve a Solicitudes o Documentos desde el panel
3. **Nueva solicitud**: Haz clic en "Nueva Solicitud"
4. **Tipo de documento**: Selecciona el tipo (certificado de estudio, constancia, etc.)
5. **Motivo**: Describe brevemente el motivo de la solicitud
6. **Enviar**: Haz clic en Enviar
7. **Seguimiento**: Puedes ver el estado de tu solicitud en Mis Solicitudes

### Tiempo estimado
5 minutos

### Rol requerido
Estudiante`,
    metadata: {
      tags: ['documentos', 'solicitudes', 'estudiante', 'certificados'],
      relatedModules: ['student-requests', 'documents'],
      screen: '/student/requests',
    },
    roles: [3, 4],
  },
  {
    title: 'Configuración de Período Académico',
    category: 'process',
    content: `## Configuración de Período Académico

### Requisitos
- Ser administrador del sistema

### Paso a Paso
1. **Ir a Períodos**: Ve al módulo de Períodos desde el menú principal
2. **Nuevo período**: Haz clic en "Nuevo Período"
3. **Completar datos**: Ingresa nombre del período, fecha de inicio y fecha de fin
4. **Estado**: Actívalo si es el período actual
5. **Guardar**: Haz clic en Guardar
6. **Verificar**: El período debe aparecer en el calendario y en los listados

### Consejos
- No actives más de un período a la vez
- Las fechas deben ser coherentes (inicio anterior a fin)
- Puedes editar un período después de creado

### Tiempo estimado
5 minutos

### Rol requerido
Administrador`,
    metadata: {
      tags: ['periodos', 'configuracion', 'calendario', 'semestre'],
      relatedModules: ['periods'],
      screen: '/periods',
    },
    roles: [0, 1],
  },
  {
    title: '¿Cómo crear un reporte?',
    category: 'process',
    content: `## Creación de Reportes

### Paso a Paso
1. **Ir a Reportes**: Ve al módulo de Reportes desde el menú principal
2. **Seleccionar tipo**: Elige el tipo de reporte (estudiantes, pasantías, evaluaciones, etc.)
3. **Filtros**: Completa los filtros disponibles (período, carrera, fechas, etc.)
4. **Vista previa**: Haz clic en "Vista Previa" para ver el resultado
5. **Exportar**: Puedes exportar a PDF, Excel o imprimir directamente
6. **Guardar**: Si lo deseas, guarda el reporte para consultarlo después

### Formatos disponibles
- PDF (para imprimir o enviar)
- Excel (para análisis de datos)
- Vista en pantalla

### Tiempo estimado
5-10 minutos

### Rol requerido
Administrador, Asistente o Tutor (según el tipo de reporte)`,
    metadata: {
      tags: ['reportes', 'exportar', 'pdf', 'excel', 'estadisticas'],
      relatedModules: ['reports'],
      screen: '/reports',
    },
    roles: null, // Todos los roles
  },

  // ============================================
  // FAQ — Preguntas frecuentes
  // ============================================
  {
    title: 'Preguntas Frecuentes del Sistema',
    category: 'faq',
    content: `## Preguntas Frecuentes

### ¿Cómo recupero mi contraseña?
Haz clic en "¿Olvidaste tu contraseña?" en la pantalla de inicio de sesión. Ingresa tu correo electrónico y sigue las instrucciones.

### ¿Qué hago si no puedo iniciar sesión?
Verifica que tu usuario y contraseña sean correctos. Si el problema persiste, contacta al administrador del sistema.

### ¿Cómo actualizo mis datos personales?
Ve a tu perfil (icono de usuario en la esquina superior derecha) y selecciona "Editar Perfil".

### ¿Cómo cambio mi contraseña?
En tu perfil, selecciona "Cambiar Contraseña". Ingresa tu contraseña actual y la nueva.

### El sistema no carga correctamente
- Verifica tu conexión a internet
- Limpia la caché del navegador
- Intenta con otro navegador (Chrome, Firefox, Edge)
- Si el problema persiste, contacta al administrador`,
    metadata: {
      tags: ['faq', 'preguntas', 'ayuda', 'soporte'],
    },
    roles: null,
  },
  {
    title: '¿Qué carreras ofrece la UNEFA?',
    category: 'faq',
    content: `## Carreras de la UNEFA

La Universidad Nacional Experimental Politécnica de la Fuerza Armada (UNEFA) ofrece diversas carreras en modalidad presencial y a distancia.

Para ver la lista actualizada de carreras disponibles:
1. Ve al módulo de Carreras si eres administrador
2. O consulta con el departamento de registro académico

Las carreras se dividen en:
- **Pregrado**: Ingenierías, licenciaturas y programas nacionales de formación
- **Postgrado**: Especializaciones, maestrías y doctorados

*Nota: Esta información es referencial. Consulta el pensum actualizado en el módulo de Carreras del sistema.*`,
    metadata: {
      tags: ['carreras', 'unefa', 'pregrado', 'postgrado', 'ingenieria'],
    },
    roles: null,
  },

  // ============================================
  // REGULATION — Reglamentos
  // ============================================
  {
    title: 'Reglamento de Pasantías (Resumen)',
    category: 'regulation',
    content: `## Reglamento de Pasantías y Prácticas Profesionales

### Disposiciones Generales
- Las pasantías son obligatorias para la obtención del título
- Deben realizarse en instituciones públicas o privadas legalmente constituidas
- La duración mínima es de 160 horas académicas (o según lo establecido en cada pensum)

### Requisitos del Estudiante
- Haber aprobado el 75% de las unidades curriculares de la carrera
- Estar inscrito en el período académico correspondiente
- No tener sanciones disciplinarias vigentes

### Obligaciones
- Cumplir con el horario establecido por la institución receptora
- Presentar informes periódicos de avance
- Asistir a las reuniones de seguimiento con el tutor académico

### Evaluación
- El tutor académico evalúa el desempeño del estudiante
- La institución receptora emite una constancia de culminación
- La nota final se registra en el sistema de evaluaciones

*Fuente: Reglamento General de la UNEFA. Para el texto completo, contacta a la Dirección de Asuntos Académicos.*`,
    metadata: {
      tags: ['reglamento', 'pasantias', 'practicas', 'normativa'],
      source: 'Reglamento General UNEFA',
    },
    roles: [0, 1, 2],
  },
];

// ============================================
// Seed Function
// ============================================

/**
 * Ejecuta el seed de la base de conocimiento si está vacía.
 * Se llama automáticamente al iniciar la app.
 */
export async function seedIfEmpty(): Promise<void> {
  try {
    // Verificar si ya hay datos
    const { count, error } = await supabase
      .from('t_knowledge_base')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.warn('[KB Seed] Error checking table (maybe not migrated yet):', error.message);
      return;
    }

    if (count && count > 0) {
      console.log(`[KB Seed] Table already has ${count} entries, skipping seed`);
      return;
    }

    console.log(`[KB Seed] Inserting ${SEED_DATA.length} seed entries...`);

    let inserted = 0;
    for (const entry of SEED_DATA) {
      try {
        await kbService.create(entry);
        inserted++;
      } catch (err: any) {
        console.error(`[KB Seed] Error inserting "${entry.title}":`, err.message);
      }
    }

    console.log(`[KB Seed] Done. Inserted ${inserted}/${SEED_DATA.length} entries.`);
  } catch (error: any) {
    console.error('[KB Seed] Fatal error:', error.message);
  }
}

export default {
  seedIfEmpty,
};
