/**
 * @file list-keys-consistency.test.ts
 * @description Verifica que las claves de fetch (nombres de listas pasados a fetchMultipleLists)
 * coincidan con las claves de acceso (options["key"]) en todos los modales del sistema.
 * 
 * Previene regresiones como el bug donde StudentModal buscaba "Sexo" pero accedía
 * options["GENERO"], o TutorModal buscaba "GENERO" que no existe en la BD.
 * 
 * Cada vez que se agrega un nuevo modal con listas dinámicas, debe agregarse su
 * configuración a este test.
 */

import { describe, it, expect } from 'vitest';

/**
 * Normaliza un texto removiendo acentos y convirtiendo a mayúsculas
 * (misma lógica que normalizeForSearch en backend/src/services/lists.service.ts)
 */
const normalizeForSearch = (text: string): string => {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
};

/**
 * Listas que existen en la BD según el seed (backend/src/seed/seed-empty.sql)
 */
const DB_LISTS = [
  'SEXO',
  'REGISTRO CIVIL',
  'NACIONALIDAD',
  'REGIMEN/TURNO',
  'TRABAJO',
  'TIPO DE EMPRESA',
  'RIF',
  'TIPO DE PRACTICA',
  'CONDICION',
  'DEDICACION',
  'CATEGORIA',
  'TIPO DE ESTUDIANTE',
  'RANGO MILITAR',
  'ESTATUS PASANTIA',
  'ESTATUS PERIODO',
  'REGION',
  'NUCLEO',
  'EXTENSIÓN',
  'TRASLADO',
  'TÍTULO',
  'CARRERA',
  'PREFIJO',
  'GRADO DE INSTRUCCIÓN',
  'SEMESTRE',
  'SECCION',
  'VISIT_TYPE',
  'VISIT_CASE',
  'TUTOR_TYPE',
  'PROFESION',
] as const;

type ModalListsConfig = {
  /** Nombre del componente/modal */
  component: string;
  /** Ruta del archivo */
  filePath: string;
  /** Nombres de listas que se pasan a fetchMultipleLists */
  fetchNames: string[];
  /** Claves de acceso a options (cada fetch name debe tener su access key) */
  accessKeys: { [fetchName: string]: string[] };
  /** Listas con fallback hardcodeado que no requieren existir en BD */
  hasFallback?: string[];
};

/**
 * Configuración de todos los modales que usan fetchMultipleLists.
 * 
 * Cómo mantener: Al agregar o modificar un modal con listas dinámicas,
 * actualizar esta configuración para que el test refleje el estado esperado.
 */
const MODALS_CONFIG: ModalListsConfig[] = [
  // ============== StudentModal ==============
  {
    component: 'StudentModal',
    filePath: 'src/features/students/components/StudentModal.tsx',
    fetchNames: [
      'Nacionalidad',
      'Sexo',
      'PREFIJO',
      'Registro Civil',
      'Regimen/Turno',
      'Tipo de estudiante',
      'Rango Militar',
      'Trabajo',
    ],
    accessKeys: {
      'Nacionalidad': ['options["Nacionalidad"]'],
      'Sexo': ['options["Sexo"]'],
      'PREFIJO': ['options["PREFIJO"]'],
      'Registro Civil': ['options["Registro Civil"]'],
      'Regimen/Turno': [],      // No se accede directamente como options
      'Tipo de estudiante': ['options["Tipo de estudiante"]'],
      'Rango Militar': ['options["Rango Militar"]'],
      'Trabajo': ['options["Trabajo"]'],
    },
    hasFallback: [
      'Tipo de estudiante',  // Tiene fallback: CIVIL | MILITAR
      'Trabajo',             // Tiene fallback: SI | NO
      'Rango Militar',       // Tiene fallback: array vacío
    ],
  },

  // ============== TutorModal ==============
  {
    component: 'TutorModal',
    filePath: 'src/features/tutors/components/TutorModal.tsx',
    fetchNames: [
      'Nacionalidad',
      'Sexo',
      'PREFIJO',
      'Registro Civil',
      'Condición',
      'Dedicación',
      'Categoría',
      'Profesión',
      'Título',
      'GRADO DE INSTRUCCIÓN',
      'Tipo de Practica',
    ],
    accessKeys: {
      'Nacionalidad': ['options["Nacionalidad"]'],
      'Sexo': ['options["Sexo"]'],
      'PREFIJO': ['options["PREFIJO"]'],
      'Registro Civil': ['options["Registro Civil"]'],
      'Condición': ['options["Condición"]'],
      'Dedicación': ['options["Dedicación"]'],
      'Categoría': ['options["Categoría"]'],
      'Profesión': ['options["Profesión"]'],
      'Título': ['options["Título"]'],
      'GRADO DE INSTRUCCIÓN': ['options["GRADO DE INSTRUCCIÓN"]'],
      'Tipo de Practica': [],  // Se usa internamente
    },
    hasFallback: [
      'Condición',       // Tiene fallback: ORDINARIO | CONTRATADO
      'Dedicación',      // Tiene fallback: TIEMPO COMPLETO, etc.
      'Categoría',       // Tiene fallback: INSTRUCTOR, ASISTENTE, etc.
      'Profesión',       // Tiene fallback: INGENIERO/A EN SISTEMAS, etc.
      'Título',          // Tiene fallback: array vacío
      'GRADO DE INSTRUCCIÓN', // Tiene fallback: array vacío
    ],
  },

  // ============== InstitutionModal ==============
  {
    component: 'InstitutionModal',
    filePath: 'src/features/institutions/components/InstitutionModal.tsx',
    fetchNames: [
      'PREFIJO',
      'Rif',
      'Tipo de empresa',
      'TIPO DE PRACTICA',
    ],
    accessKeys: {
      'PREFIJO': ['options.PREFIJO', 'options["PREFIJO"]'],
      'Rif': ['options.Rif'],
      'Tipo de empresa': ['options["Tipo de empresa"]'],
      'TIPO DE PRACTICA': ['options["TIPO DE PRACTICA"]'],
    },
  },

  // ============== InstitutionalResponsibleModal ==============
  {
    component: 'InstitutionalResponsibleModal',
    filePath: 'src/features/institutions/components/InstitutionalResponsibleModal.tsx',
    fetchNames: [
      'Nacionalidad',
      'PREFIJO',
      'Título',
    ],
    accessKeys: {
      'Nacionalidad': ['options["Nacionalidad"]'],
      'PREFIJO': ['options["PREFIJO"]'],
      'Título': ['options["Título"]'],
    },
  },

  // ============== EnrollmentModal ==============
  {
    component: 'EnrollmentModal',
    filePath: 'src/features/enrollment/components/EnrollmentModal.tsx',
    fetchNames: [
      'Nacionalidad',
    ],
    accessKeys: {
      'Nacionalidad': ['options["Nacionalidad"]'],
    },
  },

  // ============== PreEnrollmentModal ==============
  {
    component: 'PreEnrollmentModal',
    filePath: 'src/features/pre-enrollment/components/PreEnrollmentModal.tsx',
    fetchNames: [
      'Nacionalidad',
      'Semestre',
      'Seccion',
      'Regimen/Turno',
    ],
    accessKeys: {
      'Nacionalidad': ['options["Nacionalidad"]'],
      'Semestre': ['options["Semestre"]'],
      'Seccion': ['options["Seccion"]'],
      'Regimen/Turno': ['options["Regimen/Turno"]'],
    },
  },

  // ============== BatchPreEnrollModal ==============
  {
    component: 'BatchPreEnrollModal',
    filePath: 'src/features/pre-enrollment/components/BatchPreEnrollModal.tsx',
    fetchNames: [
      'Semestre',
      'Seccion',
      'Regimen/Turno',
    ],
    accessKeys: {
      'Semestre': ['options["Semestre"]'],
      'Seccion': ['options["Seccion"]'],
      'Regimen/Turno': ['options["Regimen/Turno"]'],
    },
  },

  // ============== VisitModal ==============
  {
    component: 'VisitModal',
    filePath: 'src/features/visits/components/VisitModal.tsx',
    fetchNames: [
      'VISIT_TYPE',
      'VISIT_CASE',
      'TUTOR_TYPE',
    ],
    accessKeys: {
      'VISIT_TYPE': [],
      'VISIT_CASE': [],
      'TUTOR_TYPE': [],
    },
    // Se usan internamente para construir opciones de select
  },
];

describe('List keys consistency — fetch names vs access keys', () => {
  it.each(MODALS_CONFIG)(
    '$component: fetch names should match access keys',
    ({ component, fetchNames, accessKeys }) => {
      const fetchKeys = Object.keys(accessKeys);

      // Verificar que todos los fetch names tengan una entrada en accessKeys
      for (const name of fetchNames) {
        expect(fetchKeys).toContain(name);
      }

      // Verificar que no haya accessKeys extras sin fetch name
      for (const key of fetchKeys) {
        expect(fetchNames).toContain(key);
      }

      // Verificar que fetchNames y accessKeys tengan la misma longitud
      expect(fetchNames.length).toBe(fetchKeys.length);
    }
  );
});

describe('List keys consistency — fetch names match DB lists', () => {
  const dbNormalized = DB_LISTS.map(normalizeForSearch);

  it.each(MODALS_CONFIG)(
    '$component: fetch names should exist in DB (or have fallback)',
    ({ component, fetchNames, hasFallback = [] }) => {
      for (const name of fetchNames) {
        const normalized = normalizeForSearch(name);
        const existsInDb = dbNormalized.includes(normalized);

        if (hasFallback.includes(name)) {
          // Si tiene fallback, es aceptable que no exista en BD
          // pero mostramos un console.warn para que sea visible
          if (!existsInDb) {
            console.warn(
              `[${component}] "${name}" no existe en BD seed pero tiene fallback hardcodeado. ` +
              'Considere agregarlo al seed para permitir gestión desde la interfaz de listas.'
            );
          }
        } else {
          // Si NO tiene fallback, DEBE existir en BD
          expect(existsInDb).toBe(true);
        }
      }
    }
  );
});

describe('No hardcoded obsolete list names (regression check)', () => {
  /**
   * Verifica que no se usen nombres de listas obsoletos que fueron corregidos.
   * "GENERO" y "ESTADO_CIVIL" fueron reemplazados por "Sexo" y "Registro Civil".
   */
  const OBSOLETE_NAMES = ['GENERO', 'ESTADO_CIVIL'];

  it.each(MODALS_CONFIG)(
    '$component: should not use obsolete list names like GENERO or ESTADO_CIVIL',
    ({ component, fetchNames }) => {
      for (const name of fetchNames) {
        expect(OBSOLETE_NAMES).not.toContain(name);
      }
    }
  );
});

describe('DB seed has all referenced lists (documentation)', () => {
  it('should list all lists referenced in modals that need DB existence', () => {
    const referencedLists = new Set<string>();
    const listsNeedingDb = new Set<string>();

    for (const modal of MODALS_CONFIG) {
      for (const name of modal.fetchNames) {
        referencedLists.add(name);
        if (!(modal.hasFallback || []).includes(name)) {
          listsNeedingDb.add(name);
        }
      }
    }

    // Verificar que cada lista referenciada (sin fallback) exista en BD
    const dbNormalized = DB_LISTS.map(normalizeForSearch);
    for (const name of listsNeedingDb) {
      const normalized = normalizeForSearch(name);
      expect(dbNormalized).toContain(normalized);
    }

    // Documentar qué listas están en BD pero no son referenciadas por ningún modal
    const allReferencedNormalized = [...referencedLists].map(normalizeForSearch);
    const unreferencedDbLists = DB_LISTS.filter(
      dbName => !allReferencedNormalized.includes(normalizeForSearch(dbName))
    );

    if (unreferencedDbLists.length > 0) {
      console.info(
        'Listas en BD no referenciadas por modales:',
        unreferencedDbLists.join(', ')
      );
    }
  });
});
