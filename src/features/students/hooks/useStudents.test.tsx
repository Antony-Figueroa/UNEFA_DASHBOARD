/**
 * @file useStudents.test.tsx
 * @description Tests para el hook useStudents que gestiona la lógica de negocio de estudiantes.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useStudents } from '../hooks/useStudents';

// Mock del contexto de Toast
const mockAddToast = vi.fn();
const mockRemoveToast = vi.fn();

vi.mock('@/context/toast', () => ({
  useToast: () => ({
    addToast: mockAddToast,
    removeToast: mockRemoveToast,
  }),
}));

// Mock del hook useCrud
vi.mock('../../../hooks/useCrud', () => ({
  useCrud: vi.fn(() => ({
    data: [
      {
        studentId: '1',
        firstName: 'Juan',
        lastName: 'Pérez',
        identificationNumber: '12345678',
        careerName: 'Ingeniería de Sistemas',
        status: true,
      },
    ],
    status: 'success',
    loadingAction: false,
    error: null,
    refresh: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    toggleItemStatus: vi.fn(),
  })),
}));

// Mock del servicio
vi.mock('../services/studentsService', () => ({
  studentService: {
    getAll: vi.fn().mockResolvedValue({
      data: [
        {
          studentId: '1',
          firstName: 'Juan',
          lastName: 'Pérez',
          identificationNumber: '12345678',
          careerName: 'Ingeniería de Sistemas',
          status: true,
        },
      ],
      total: 1,
    }),
    create: vi.fn().mockResolvedValue({
      studentId: '2',
      firstName: 'María',
      lastName: 'González',
      identificationNumber: '87654321',
      status: true,
    }),
    update: vi.fn().mockResolvedValue({
      studentId: '1',
      firstName: 'Juan Actualizado',
      lastName: 'Pérez',
      identificationNumber: '12345678',
      status: true,
    }),
    toggleStatus: vi.fn().mockResolvedValue({}),
  },
}));

describe('useStudents Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('debería cargar estudiantes al inicializar', async () => {
    const { result } = renderHook(() => useStudents());

    await waitFor(() => {
      expect(result.current.students).toBeDefined();
      expect(result.current.students.length).toBeGreaterThan(0);
    });
  });

  it('debería tener funciones de gestión definidas', () => {
    const { result } = renderHook(() => useStudents());

    expect(result.current.addStudent).toBeDefined();
    expect(result.current.editStudent).toBeDefined();
    expect(result.current.toggleStatus).toBeDefined();
    expect(result.current.bulkRemoveStudents).toBeDefined();
    expect(result.current.bulkRestoreStudents).toBeDefined();
  });

  it('debería retornar estado correcto', () => {
    const { result } = renderHook(() => useStudents());

    expect(result.current.status).toBeDefined();
    expect(result.current.loadingAction).toBe(false);
  });
});