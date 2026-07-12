/**
 * @file tutorService.test.ts
 * @description Tests para tutorService — getStudents, updateGrade, getDashboard, etc.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '../../../../api/apiClient';

const mockGet = vi.fn();
const mockPut = vi.fn();
const mockPost = vi.fn();

vi.mock('../../../../api/apiClient', () => ({
  default: {
    get: mockGet,
    put: mockPut,
    post: mockPost,
  },
}));

const MOCK_STUDENTS = {
  data: {
    data: [
      {
        enrollmentId: '101',
        tutorType: 'ACADEMICO',
        studentId: '1',
        studentCi: '12345678',
        studentName: 'Juan Pérez',
        studentEmail: 'juan@test.com',
        studentPhone: '04121234567',
        careerName: 'Ing. Enfermería',
        institutionName: 'Hospital Central',
        period: '1-2026',
        practiceType: 'Hospitalaria',
        enrollmentDate: '2026-01-15',
        startDate: '2026-03-01',
        endDate: '2026-07-15',
        status: 'active',
        grade: 0,
        totalHours: 120,
      },
      {
        enrollmentId: '102',
        tutorType: 'EMPRESARIAL',
        studentId: '2',
        studentCi: '87654321',
        studentName: 'María García',
        studentEmail: 'maria@test.com',
        studentPhone: '04129876543',
        careerName: 'Ing. Sistemas',
        institutionName: 'Tech Corp',
        period: '1-2026',
        practiceType: 'Empresarial',
        enrollmentDate: '2026-01-15',
        startDate: '2026-03-01',
        endDate: '2026-07-15',
        status: 'active',
        grade: 15,
        totalHours: 200,
      },
    ],
  },
};

describe('tutorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('getStudents', () => {
    it('debería retornar lista de estudiantes sin filtros', async () => {
      const { tutorService } = await import('../tutorService');
      mockGet.mockResolvedValue(MOCK_STUDENTS);

      const students = await tutorService.getStudents();

      expect(mockGet).toHaveBeenCalledWith('/tutor/students', { params: undefined });
      expect(students).toHaveLength(2);
      expect(students[0].studentName).toBe('Juan Pérez');
      expect(students[1].studentName).toBe('María García');
    });

    it('debería pasar filtro de status a la API', async () => {
      const { tutorService } = await import('../tutorService');
      mockGet.mockResolvedValue(MOCK_STUDENTS);

      await tutorService.getStudents({ status: 'active' });

      expect(mockGet).toHaveBeenCalledWith('/tutor/students', { params: { status: 'active' } });
    });

    it('debería pasar filtro de búsqueda a la API', async () => {
      const { tutorService } = await import('../tutorService');
      mockGet.mockResolvedValue(MOCK_STUDENTS);

      await tutorService.getStudents({ search: 'Juan' });

      expect(mockGet).toHaveBeenCalledWith('/tutor/students', { params: { search: 'Juan' } });
    });

    it('debería retornar arreglo vacío cuando no hay estudiantes', async () => {
      const { tutorService } = await import('../tutorService');
      mockGet.mockResolvedValue({ data: { data: [] } });

      const students = await tutorService.getStudents();
      expect(students).toHaveLength(0);
    });
  });

  describe('updateGrade', () => {
    it('debería llamar PUT con enrollmentId y nota', async () => {
      const { tutorService } = await import('../tutorService');
      mockPut.mockResolvedValue({});

      await tutorService.updateGrade('101', 18);

      expect(mockPut).toHaveBeenCalledWith('/tutor/grades/101', { grade: 18, observations: undefined });
    });

    it('debería incluir observaciones cuando se pasan', async () => {
      const { tutorService } = await import('../tutorService');
      mockPut.mockResolvedValue({});

      await tutorService.updateGrade('101', 16, 'Buen desempeño');

      expect(mockPut).toHaveBeenCalledWith('/tutor/grades/101', { grade: 16, observations: 'Buen desempeño' });
    });

    it('debería lanzar error cuando la API falla', async () => {
      const { tutorService } = await import('../tutorService');
      mockPut.mockRejectedValue(new Error('Network error'));

      await expect(tutorService.updateGrade('999', 18)).rejects.toThrow('Network error');
    });
  });

  describe('getDashboard', () => {
    it('debería retornar estadísticas del dashboard', async () => {
      const { tutorService } = await import('../tutorService');
      const mockDashboard = {
        data: {
          data: {
            totalStudents: 5,
            activeInternships: 3,
            pendingGrades: 2,
            completedInternships: 1,
            unreadNotifications: 0,
          },
        },
      };
      mockGet.mockResolvedValue(mockDashboard);

      const stats = await tutorService.getDashboard();

      expect(mockGet).toHaveBeenCalledWith('/tutor/dashboard');
      expect(stats.totalStudents).toBe(5);
      expect(stats.activeInternships).toBe(3);
      expect(stats.pendingGrades).toBe(2);
    });
  });

  describe('getTracking', () => {
    it('debería retornar tracking sin filtro de enrollment', async () => {
      const { tutorService } = await import('../tutorService');
      const mockTracking = {
        data: {
          data: [
            {
              trackingId: '1',
              enrollmentId: '101',
              studentName: 'Juan Pérez',
              reportTitle: 'Reporte Semanal 1',
              transfer: false,
              route: 'Ruta A',
              observations: 'Todo en orden',
              creationDate: '2026-03-15',
              tutorType: 'ACADEMICO',
            },
          ],
        },
      };
      mockGet.mockResolvedValue(mockTracking);

      const tracking = await tutorService.getTracking();

      expect(mockGet).toHaveBeenCalledWith('/tutor/tracking', { params: undefined });
      expect(tracking).toHaveLength(1);
      expect(tracking[0].studentName).toBe('Juan Pérez');
    });

    it('debería filtrar tracking por enrollmentId', async () => {
      const { tutorService } = await import('../tutorService');
      mockGet.mockResolvedValue({ data: { data: [] } });

      await tutorService.getTracking('101');

      expect(mockGet).toHaveBeenCalledWith('/tutor/tracking', { params: { enrollmentId: '101' } });
    });
  });

  describe('getReports', () => {
    it('debería retornar datos de reportes', async () => {
      const { tutorService } = await import('../tutorService');
      const mockReport = {
        data: {
          data: {
            tutorInfo: { name: 'Dr. García', tutorId: 1 },
            summary: { totalStudents: 5, statusDistribution: { active: 3 }, periodDistribution: {}, averageGrade: '15.2' },
            students: [],
          },
        },
      };
      mockGet.mockResolvedValue(mockReport);

      const report = await tutorService.getReports();

      expect(mockGet).toHaveBeenCalledWith('/tutor/reports');
      expect(report.tutorInfo.name).toBe('Dr. García');
      expect(report.summary.averageGrade).toBe('15.2');
    });
  });

  describe('getProfile', () => {
    it('debería retornar perfil del tutor', async () => {
      const { tutorService } = await import('../tutorService');
      const mockProfile = {
        data: {
          data: {
            tutorId: 1,
            ci: '12345678',
            name: 'Carlos',
            surname: 'García',
            fullName: 'Carlos García',
            phone: '04121234567',
            email: 'carlos@test.com',
            profession: 'Ingeniero',
            condition: 'Contratado',
            status: 1,
          },
        },
      };
      mockGet.mockResolvedValue(mockProfile);

      const profile = await tutorService.getProfile();

      expect(mockGet).toHaveBeenCalledWith('/tutor/profile');
      expect(profile.fullName).toBe('Carlos García');
      expect(profile.email).toBe('carlos@test.com');
    });
  });
});
