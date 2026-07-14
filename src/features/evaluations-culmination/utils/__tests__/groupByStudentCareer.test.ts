/**
 * @file groupByStudentCareer.test.ts
 * @description Tests for the practice grouping utility.
 * Groups PracticeWithEvaluations[] by studentCi + careerId.
 * Written FIRST (TDD — PR 3).
 */

import { describe, it, expect } from 'vitest';
import { groupByStudentCareer } from '../groupByStudentCareer';
import type { PracticeWithEvaluations } from '../../types';

// ── Helpers ─────────────────────────────────────────────────

const createPractice = (overrides: Partial<PracticeWithEvaluations> = {}): PracticeWithEvaluations => ({
  practiceId: 1,
  studentCi: '12345678',
  studentName: 'María García',
  careerId: 1,
  careerName: 'Ing. Enfermería',
  minimumGrade: 14,
  institutionId: 1,
  institutionName: 'Hospital Universitario',
  periodId: 1,
  periodName: '2024-2',
  practiceTypeId: 1,
  practiceTypeName: 'Hospitalaria',
  startDate: '2024-05-01',
  endDate: '2024-10-30',
  totalHours: 360,
  evaluationStatus: 'completed',
  evaluations: {
    INSTITUCIONAL: { completed: true, score: 17, evaluatorName: 'Dr. Pérez', evaluationId: 101 },
    ACADEMICO: { completed: true, score: 15, evaluatorName: 'Prof. López', evaluationId: 102 },
    COMITE: { completed: true, score: 16, evaluatorName: 'Comité Evaluador', evaluationId: 103 },
  },
  finalGrade: 16.1,
  culminationStatus: 'pending',
  result: 'approved',
  practicesStatus: 'INSCRITO',
  practicesStatusCode: 'INSCRITO',
  ...overrides,
});

// ── Tests ──────────────────────────────────────────────────

describe('groupByStudentCareer', () => {
  // 3.1 Agrupación vacía
  it('retorna array vacío para entrada vacía', () => {
    expect(groupByStudentCareer([])).toEqual([]);
  });

  // 3.2 Una práctica → un grupo con 1 práctica
  it('retorna un grupo con 1 práctica para entrada de 1 práctica', () => {
    const practices = [createPractice()];
    const groups = groupByStudentCareer(practices);

    expect(groups).toHaveLength(1);
    expect(groups[0].studentCi).toBe('12345678');
    expect(groups[0].studentName).toBe('María García');
    expect(groups[0].careerId).toBe(1);
    expect(groups[0].careerName).toBe('Ing. Enfermería');
    expect(groups[0].practices).toHaveLength(1);
    expect(groups[0].practices[0].practiceId).toBe(1);
  });

  // 3.3 Mismo estudiante + misma carrera → un grupo con N prácticas
  it('agrupa prácticas del mismo estudiante y misma carrera en un solo grupo', () => {
    const practices = [
      createPractice({ practiceId: 1, practiceTypeName: 'Hospitalaria' }),
      createPractice({ practiceId: 2, practiceTypeName: 'Comunitaria', institutionName: 'Centro de Salud' }),
      createPractice({ practiceId: 3, practiceTypeName: 'Investigación', institutionName: 'Laboratorio' }),
    ];
    const groups = groupByStudentCareer(practices);

    expect(groups).toHaveLength(1);
    expect(groups[0].practices).toHaveLength(3);
  });

  // 3.4 Diferente estudiante → grupos separados
  it('separa prácticas de diferentes estudiantes en grupos distintos', () => {
    const practices = [
      createPractice({ studentCi: '11111111', studentName: 'Ana López' }),
      createPractice({ practiceId: 2, studentCi: '22222222', studentName: 'Luis Pérez' }),
      createPractice({ practiceId: 3, studentCi: '11111111', studentName: 'Ana López', practiceTypeId: 2, practiceTypeName: 'Comunitaria' }),
    ];
    const groups = groupByStudentCareer(practices);

    expect(groups).toHaveLength(2);
    // Primer grupo: Ana con 2 prácticas
    const anaGroup = groups.find(g => g.studentCi === '11111111');
    expect(anaGroup).toBeDefined();
    expect(anaGroup!.practices).toHaveLength(2);
    // Segundo grupo: Luis con 1 práctica
    const luisGroup = groups.find(g => g.studentCi === '22222222');
    expect(luisGroup).toBeDefined();
    expect(luisGroup!.practices).toHaveLength(1);
  });

  // 3.5 Mismo estudiante, diferente carrera → grupos separados
  it('separa prácticas del mismo estudiante con diferente carrera', () => {
    const practices = [
      createPractice({ careerId: 1, careerName: 'Ing. Enfermería' }),
      createPractice({ practiceId: 2, careerId: 2, careerName: 'Ing. Informática' }),
    ];
    const groups = groupByStudentCareer(practices);

    expect(groups).toHaveLength(2);
    expect(groups[0].careerName).toBe('Ing. Enfermería');
    expect(groups[1].careerName).toBe('Ing. Informática');
  });

  // 3.6 Preserva datos del estudiante del primer elemento
  it('preserva studentName y careerName del primer practice del grupo', () => {
    const practices = [
      createPractice({ studentName: 'María García', careerName: 'Ing. Enfermería' }),
      createPractice({ practiceId: 2, studentName: 'María García' }),
    ];
    const groups = groupByStudentCareer(practices);

    expect(groups[0].studentName).toBe('María García');
    expect(groups[0].careerName).toBe('Ing. Enfermería');
  });

  // 3.7 Orden de grupos: primero por studentCi, luego por careerId
  it('retorna grupos ordenados por studentCi y luego careerId', () => {
    const practices = [
      createPractice({ studentCi: '333', careerId: 2 }),
      createPractice({ practiceId: 2, studentCi: '111', careerId: 1 }),
      createPractice({ practiceId: 3, studentCi: '222', careerId: 1 }),
      createPractice({ practiceId: 4, studentCi: '333', careerId: 1 }),
    ];
    const groups = groupByStudentCareer(practices);

    expect(groups).toHaveLength(4);
    expect(groups[0].studentCi).toBe('111');
    expect(groups[1].studentCi).toBe('222');
    expect(groups[2].studentCi).toBe('333');
    expect(groups[2].careerId).toBe(1);
    expect(groups[3].studentCi).toBe('333');
    expect(groups[3].careerId).toBe(2);
  });

  // 3.8 Caso edge: muchos estudiantes, muchas carreras
  it('maneja múltiples estudiantes con múltiples carreras correctamente', () => {
    const practices = [
      createPractice({ studentCi: 'A', careerId: 1 }),
      createPractice({ practiceId: 2, studentCi: 'A', careerId: 2 }),
      createPractice({ practiceId: 3, studentCi: 'B', careerId: 1 }),
      createPractice({ practiceId: 4, studentCi: 'B', careerId: 1 }),
      createPractice({ practiceId: 5, studentCi: 'B', careerId: 2 }),
      createPractice({ practiceId: 6, studentCi: 'C', careerId: 3 }),
    ];
    const groups = groupByStudentCareer(practices);

    expect(groups).toHaveLength(5); // A-1, A-2, B-1, B-2, C-3
    // A tiene 2 grupos con 1 práctica cada uno
    expect(groups.filter(g => g.studentCi === 'A')).toHaveLength(2);
    // B tiene 2 grupos: B-1 con 2 prácticas, B-2 con 1
    const b1Group = groups.find(g => g.studentCi === 'B' && g.careerId === 1);
    expect(b1Group!.practices).toHaveLength(2);
    // C tiene 1 grupo con 1 práctica
    expect(groups.filter(g => g.studentCi === 'C')).toHaveLength(1);
  });
});
