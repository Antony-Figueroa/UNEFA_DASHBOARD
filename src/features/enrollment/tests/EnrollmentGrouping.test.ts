import { describe, it, expect } from 'vitest';
import { Enrollment } from '../types';

interface MockEnrollment extends Partial<Enrollment> {
  enrollmentId: string;
}

interface GroupedData {
  region: string;
  nucleus: string;
  extension: string;
  careerName: string;
  institutionName: string;
  institutionType: string;
  students: Set<string>;
  academicTutors: Set<string>;
  institutionalTutors: Set<string>;
  observation: string;
}

// Simulamos la lógica de agrupación que está dentro de EnrollmentPDF.tsx
// para poder probarla de forma aislada.
const groupEnrollmentData = (data: MockEnrollment[]) => {
  const groups: Record<string, GroupedData> = {};

  data.forEach((item) => {
    const key = `${item.region || 'N/A'}-${item.nucleus || 'N/A'}-${item.extension || 'N/A'}-${item.careerName || 'N/A'}-${item.institutionName || 'N/A'}`;
    
    if (!groups[key]) {
      groups[key] = {
        region: item.region || "SIN REGIÓN",
        nucleus: item.nucleus || "SIN NÚCLEO",
        extension: item.extension || "SIN EXTENSIÓN",
        careerName: item.careerName || "SIN CARRERA",
        institutionName: item.institutionName || "SIN INSTITUCIÓN",
        institutionType: (item.institutionType || "").toLowerCase(),
        students: new Set<string>(),
        academicTutors: new Set<string>(),
        institutionalTutors: new Set<string>(),
        observation: item.observation || ""
      };
    }
    
    if (item.enrollmentId) groups[key].students.add(item.enrollmentId);
    if (item.academicTutorName) groups[key].academicTutors.add(item.academicTutorName);
    if (item.institutionResponsibleName) groups[key].institutionalTutors.add(item.institutionResponsibleName);
    
    if (item.observation && !groups[key].observation.includes(item.observation)) {
      groups[key].observation = groups[key].observation 
        ? `${groups[key].observation}; ${item.observation}`
        : item.observation;
    }
  });

  return Object.values(groups);
};

describe('Enrollment Data Grouping Logic', () => {
  it('should group multiple students in the same institution and career', () => {
    const mockData: MockEnrollment[] = [
      {
        enrollmentId: '1',
        region: 'CENTRAL',
        nucleus: 'CARACAS',
        careerName: 'INGENIERÍA CIVIL',
        institutionName: 'METRO DE CARACAS',
        institutionType: 'PÚBLICA',
        academicTutorName: 'JUAN PEREZ'
      },
      {
        enrollmentId: '2',
        region: 'CENTRAL',
        nucleus: 'CARACAS',
        careerName: 'INGENIERÍA CIVIL',
        institutionName: 'METRO DE CARACAS',
        institutionType: 'PÚBLICA',
        academicTutorName: 'JUAN PEREZ'
      }
    ];

    const result = groupEnrollmentData(mockData);
    expect(result).toHaveLength(1);
    expect(result[0].students.size).toBe(2);
    expect(result[0].academicTutors.size).toBe(1);
  });

  it('should separate different careers in the same institution', () => {
    const mockData: MockEnrollment[] = [
      {
        enrollmentId: '1',
        region: 'CENTRAL',
        nucleus: 'CARACAS',
        careerName: 'INGENIERÍA CIVIL',
        institutionName: 'CANTV',
        institutionType: 'PÚBLICA'
      },
      {
        enrollmentId: '2',
        region: 'CENTRAL',
        nucleus: 'CARACAS',
        careerName: 'INGENIERÍA DE SISTEMAS',
        institutionName: 'CANTV',
        institutionType: 'PÚBLICA'
      }
    ];

    const result = groupEnrollmentData(mockData);
    expect(result).toHaveLength(2);
  });

  it('should handle missing fields gracefully', () => {
    const mockData: MockEnrollment[] = [
      {
        enrollmentId: '1',
        institutionName: 'EMPRESA X'
      }
    ];

    const result = groupEnrollmentData(mockData);
    expect(result[0].region).toBe('SIN REGIÓN');
    expect(result[0].careerName).toBe('SIN CARRERA');
  });

  it('should concatenate observations from different items in the same group', () => {
    const mockData: MockEnrollment[] = [
      {
        enrollmentId: '1',
        region: 'CENTRAL',
        careerName: 'C1',
        institutionName: 'I1',
        observation: 'OBS 1'
      },
      {
        enrollmentId: '2',
        region: 'CENTRAL',
        careerName: 'C1',
        institutionName: 'I1',
        observation: 'OBS 2'
      }
    ];

    const result = groupEnrollmentData(mockData);
    expect(result[0].observation).toContain('OBS 1');
    expect(result[0].observation).toContain('OBS 2');
  });

  it('should group by extension correctly and count institutional tutors', () => {
    const mockData: MockEnrollment[] = [
      {
        enrollmentId: '1',
        region: 'R1',
        nucleus: 'N1',
        extension: 'EXT 1',
        careerName: 'C1',
        institutionName: 'I1',
        institutionResponsibleName: 'RESP 1'
      },
      {
        enrollmentId: '2',
        region: 'R1',
        nucleus: 'N1',
        extension: 'EXT 1',
        careerName: 'C1',
        institutionName: 'I1',
        institutionResponsibleName: 'RESP 2'
      }
    ];

    const result = groupEnrollmentData(mockData);
    expect(result).toHaveLength(1);
    expect(result[0].extension).toBe('EXT 1');
    expect(result[0].institutionalTutors.size).toBe(2);
  });
});
