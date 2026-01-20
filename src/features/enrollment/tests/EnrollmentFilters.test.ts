import { describe, it, expect } from 'vitest';
import { Enrollment } from '../types';

/**
 * Simulamos la lógica de filtrado que reside en Enrollment.tsx
 */
const filterEnrollments = (
  enrollments: Enrollment[],
  filters: {
    search: string;
    period: string;
    practiceType: string;
  }
) => {
  const search = filters.search.trim().toLowerCase();
  const periodSearch = filters.period.trim().toLowerCase();
  const practiceTypeSearch = filters.practiceType.trim().toLowerCase();

  return enrollments.filter((e) => {
    const matchesSearch = !search || 
        e.identificationNumber.toLowerCase().includes(search) || 
        e.studentName.toLowerCase().includes(search) ||
        (e.careerName && e.careerName.toLowerCase().includes(search));
    const matchesPeriod = !periodSearch || e.period.toLowerCase() === periodSearch;
    const matchesPracticeType = !practiceTypeSearch || e.practiceType.toLowerCase() === practiceTypeSearch;
    const matchesStatus = e.status === true;

    return matchesSearch && matchesPeriod && matchesPracticeType && matchesStatus;
  });
};

describe('Enrollment Filtering Logic', () => {
  const mockEnrollments: Enrollment[] = [
    {
      enrollmentId: '1',
      studentName: 'JUAN PEREZ',
      identificationNumber: '12345678',
      identificationPrefix: 'V',
      period: '2-2025',
      practiceType: 'ORDINARIA',
      status: true,
      enrollmentDate: new Date(),
      academicTutorId: 't1',
      methodologicalTutorId: 't2',
      institutionId: 'i1',
      institutionResponsibleId: 'r1',
      careerName: 'INGENIERÍA CIVIL'
    },
    {
      enrollmentId: '2',
      studentName: 'MARIA LOPEZ',
      identificationNumber: '87654321',
      identificationPrefix: 'V',
      period: '1-2025',
      practiceType: 'ESPECIAL',
      status: true,
      enrollmentDate: new Date(),
      academicTutorId: 't1',
      methodologicalTutorId: 't2',
      institutionId: 'i2',
      institutionResponsibleId: 'r2',
      careerName: 'INGENIERÍA DE SISTEMAS'
    },
    {
      enrollmentId: '3',
      studentName: 'PEDRO GOMEZ',
      identificationNumber: '11223344',
      identificationPrefix: 'V',
      period: '2-2025',
      practiceType: 'ORDINARIA',
      status: false, // Inactivo
      enrollmentDate: new Date(),
      academicTutorId: 't1',
      methodologicalTutorId: 't2',
      institutionId: 'i1',
      institutionResponsibleId: 'r1',
      careerName: 'INGENIERÍA CIVIL'
    }
  ];

  it('should filter by search term (name)', () => {
    const result = filterEnrollments(mockEnrollments, { search: 'JUAN', period: '', practiceType: '' });
    expect(result).toHaveLength(1);
    expect(result[0].studentName).toBe('JUAN PEREZ');
  });

  it('should filter by search term (ID)', () => {
    const result = filterEnrollments(mockEnrollments, { search: '87654321', period: '', practiceType: '' });
    expect(result).toHaveLength(1);
    expect(result[0].studentName).toBe('MARIA LOPEZ');
  });

  it('should filter by period', () => {
    const result = filterEnrollments(mockEnrollments, { search: '', period: '1-2025', practiceType: '' });
    expect(result).toHaveLength(1);
    expect(result[0].studentName).toBe('MARIA LOPEZ');
  });

  it('should filter by practice type', () => {
    const result = filterEnrollments(mockEnrollments, { search: '', period: '', practiceType: 'ESPECIAL' });
    expect(result).toHaveLength(1);
    expect(result[0].studentName).toBe('MARIA LOPEZ');
  });

  it('should only return active enrollments', () => {
    const result = filterEnrollments(mockEnrollments, { search: '', period: '', practiceType: '' });
    expect(result).toHaveLength(2);
    expect(result.every(e => e.status)).toBe(true);
  });

  it('should combine multiple filters', () => {
    const result = filterEnrollments(mockEnrollments, { search: 'CIVIL', period: '2-2025', practiceType: 'ORDINARIA' });
    expect(result).toHaveLength(1);
    expect(result[0].studentName).toBe('JUAN PEREZ');
  });
});
