/**
 * @file reportConfig.test.tsx
 * @description Tests para reportConfig — columnas oficiales y configuración de reportes
 */

import { describe, it, expect } from 'vitest';
import { reportConfig } from '../reportConfig';

describe('reportConfig — tutores-academicos (Task 3.1)', () => {
  const config = reportConfig['tutores-academicos'];

  it('debería incluir "CORREO ELECTRÓNICO" entre TELÉFONO y CANTIDAD DE ESTUDIANTES ATENDIDOS', () => {
    const headers = config.columns.map((c) => c.header);
    const telIdx = headers.indexOf('TELÉFONO');
    const correoIdx = headers.indexOf('CORREO ELECTRÓNICO');
    const cantIdx = headers.indexOf('CANTIDAD DE ESTUDIANTES ATENDIDOS');
    expect(correoIdx).toBeGreaterThan(telIdx);
    expect(cantIdx).toBeGreaterThan(correoIdx);
  });

  it('debería tener exactamente 14 columnas oficiales en mayúsculas', () => {
    const headers = config.columns.map((c) => c.header);
    expect(headers).toEqual([
      'N°', 'REGIÓN', 'NÚCLEO', 'EXTENSIÓN', 'CARRERA',
      'NOMBRE DEL TUTOR (A)', 'APELLIDO DEL TUTOR (A)', 'CÉDULA', 'CONDICIÓN', 'DEDICACIÓN',
      'CATEGORÍA', 'TELÉFONO', 'CORREO ELECTRÓNICO', 'CANTIDAD DE ESTUDIANTES ATENDIDOS',
    ]);
  });

  it('debería mostrar cantidadEstudiantes como número en la columna CANTIDAD DE ESTUDIANTES ATENDIDOS', () => {
    const col = config.columns.find((c) => c.header === 'CANTIDAD DE ESTUDIANTES ATENDIDOS');
    expect(col).toBeDefined();
    const accessor = col!.accessor;
    if (typeof accessor === 'function') {
      expect(accessor({ cantidadEstudiantes: 5 })).toBe(5);
    }
  });

  it('debería tener función loadData que retorna { data, meta }', () => {
    expect(typeof config.loadData).toBe('function');
    expect(config.loadData.length).toBeGreaterThanOrEqual(4); // (periodId, careerId, page, limit, careerIds)
  });
});

describe('reportConfig — resumen-pasantias (Task 3.2)', () => {
  const config = reportConfig['resumen-pasantias'];

  it('debería incluir Extensión, Cant. Tutores Inst., Observación en el orden correcto', () => {
    const headers = config.columns.map((c) => c.header);
    expect(headers).toEqual([
      'N°', 'Región', 'Núcleo', 'Extensión', 'Carrera',
      'Estudiantes', 'Tutores Acad.', 'Empresa', 'Tipo',
      'Cant. Tutores Inst.', 'Observación',
    ]);
  });

  it('debería acceder a cantidadTutoresInst como número', () => {
    const col = config.columns.find((c) => c.header === 'Cant. Tutores Inst.');
    expect(col).toBeDefined();
    expect(typeof col!.accessor).toBe('string');
    expect(col!.accessor).toBe('cantidadTutoresInst');
  });

  it('debería acceder a extension como string', () => {
    const col = config.columns.find((c) => c.header === 'Extensión');
    expect(col).toBeDefined();
    expect(typeof col!.accessor).toBe('string');
    expect(col!.accessor).toBe('extension');
  });

  it('debería acceder a observacion como string', () => {
    const col = config.columns.find((c) => c.header === 'Observación');
    expect(col).toBeDefined();
    expect(typeof col!.accessor).toBe('string');
    expect(col!.accessor).toBe('observacion');
  });
});

describe('reportConfig — distribucion-tutores-v2 (Task 3.3)', () => {
  const config = reportConfig['distribucion-tutores-v2'];

  it('debería incluir Cédula Estudiante y Correo TA', () => {
    const headers = config.columns.map((c) => c.header);
    expect(headers).toContain('Cédula Estudiante');
    expect(headers).toContain('Correo TA');
  });

  it('debería tener Cédula Estudiante después de Estudiante', () => {
    const headers = config.columns.map((c) => c.header);
    const estIdx = headers.indexOf('Estudiante');
    const cedIdx = headers.indexOf('Cédula Estudiante');
    expect(cedIdx).toBeGreaterThan(estIdx);
    expect(cedIdx).toBe(estIdx + 1);
  });

  it('debería tener Correo TA después de Contacto TA', () => {
    const headers = config.columns.map((c) => c.header);
    const taIdx = headers.indexOf('Contacto TA');
    const correoIdx = headers.indexOf('Correo TA');
    expect(correoIdx).toBeGreaterThan(taIdx);
    expect(correoIdx).toBe(taIdx + 1);
  });

  it('debería acceder a estudianteCi desde el accessor de Cédula Estudiante', () => {
    const col = config.columns.find((c) => c.header === 'Cédula Estudiante');
    expect(col).toBeDefined();
    if (typeof col!.accessor === 'function') {
      const result = col!.accessor({ estudianteCi: 'V-12345678' });
      expect(result).toBe('V-12345678');
    } else {
      expect(col!.accessor).toBe('estudianteCi');
    }
  });
});

describe('reportConfig — estructura general', () => {
  it('debería tener todas las configuraciones esperadas', () => {
    const types = Object.keys(reportConfig);
    expect(types).toContain('tutores-academicos');
    expect(types).toContain('resumen-pasantias');
    expect(types).toContain('distribucion-tutores-v2');
  });

  it('cada configuración debería tener title, subtitle, type, loadData, columns', () => {
    for (const [key, config] of Object.entries(reportConfig)) {
      expect(config.title).toBeDefined();
      expect(config.subtitle).toBeDefined();
      expect(config.type).toMatch(/^(pdf|excel)$/);
      expect(typeof config.loadData).toBe('function');
      expect(Array.isArray(config.columns)).toBe(true);
      expect(config.columns.length).toBeGreaterThan(0);
    }
  });
});
