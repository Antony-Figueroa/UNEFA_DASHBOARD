/**
 * @file TutorEvaluation.test.tsx
 * @description Tests para TutorEvaluation — criterios, notas, submit
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React, { useState, useCallback } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import TutorEvaluation from '../TutorEvaluation';
import { ToastContext } from '../../../../context/toast';

// ── Mocks ──────────────────────────────────────────────────

const mockNavigate = vi.fn();
const mockCreateEvaluation = vi.fn();
const mockUpdateEvaluation = vi.fn();
const mockFetchCriteria = vi.fn();
const mockApiGet = vi.fn();

vi.mock('react-router', () => ({
  useParams: () => ({ enrollmentId: '123' }),
  useNavigate: () => mockNavigate,
}));

vi.mock('../../../../context/RouteParamsContext', () => ({
  useRouteParams: () => ({}),
}));

vi.mock('../../../../context/auth', () => ({
  useAuth: () => ({ user: { name: 'Dr. Juan Pérez' } }),
}));

vi.mock('../../../../features/evaluations/hooks/useEvaluations', () => ({
  useEvaluations: () => ({
    criteria: [
      { criteriaId: 1, itemNumber: 1, description: 'Conocimiento técnico', maxScore: 5 },
      { criteriaId: 2, itemNumber: 2, description: 'Responsabilidad', maxScore: 5 },
      { criteriaId: 3, itemNumber: 3, description: 'Trabajo en equipo', maxScore: 5 },
    ],
    fetchCriteria: mockFetchCriteria,
    createEvaluation: mockCreateEvaluation,
    updateEvaluation: mockUpdateEvaluation,
    loading: false,
  }),
}));

vi.mock('../../../../features/evaluations/hooks/useSystemEvaluationConfig', () => ({
  useSystemEvaluationConfig: () => ({
    config: { score: { min: 1, max: 5 } },
    loading: false,
  }),
}));

vi.mock('../../../../api/apiClient', () => ({
  default: {
    get: (...args: any[]) => mockApiGet(...args),
  },
}));

vi.mock('../../../../components/common/PageMeta', () => ({
  default: ({ title }: any) => <title>{title}</title>,
}));

vi.mock('../../../../components/common/PageBreadCrumb', () => ({
  default: ({ pageTitle }: any) => <nav data-testid="breadcrumb">{pageTitle}</nav>,
}));

vi.mock('../../../../components/common/ComponentCard', () => ({
  default: ({ title, children, headerAction }: any) => (
    <div data-testid="component-card" data-title={title}>
      {headerAction && <div data-testid="header-action">{headerAction}</div>}
      {children}
    </div>
  ),
}));

vi.mock('../../../../components/ui/button/Button', () => ({
  default: ({ children, onClick, disabled, variant }: any) => (
    <button data-testid="mock-button" data-variant={variant} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

vi.mock('../../../../icons', () => ({
  AngleLeftIcon: () => <span data-testid="angle-left-icon">{'←'}</span>,
}));

vi.mock('../../../../components/ui/dialog/DialogConfig', () => ({
  TOAST: {
    loadError: () => ({ variant: 'error', title: 'Error de carga', message: 'No se pudieron cargar los datos' }),
    updateError: (r: string) => ({ variant: 'error', title: 'Error', message: `Error al actualizar ${r}` }),
  },
}));

// ── Test helpers ────────────────────────────────────────────

/** Minimal ToastProvider wrapper — avoids mocking useToast */
const ToastWrapper = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<any[]>([]);
  const addToast = useCallback((toast: any) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev: any[]) => [...prev, { ...toast, id, timestamp: new Date() }]);
    return id;
  }, []);
  const removeToast = useCallback((id: string) => {
    setToasts((prev: any[]) => prev.filter((t: any) => t.id !== id));
  }, []);
  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

const renderComponent = () => {
  return render(
    <HelmetProvider>
      <ToastWrapper>
        <TutorEvaluation />
      </ToastWrapper>
    </HelmetProvider>
  );
};

describe('TutorEvaluation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiGet.mockReset();
    mockCreateEvaluation.mockResolvedValue({ evaluationId: 1, totalScore: 4 });
    mockUpdateEvaluation.mockResolvedValue(true);
    mockFetchCriteria.mockResolvedValue(undefined);
  });

  it('debería mostrar spinner mientras carga', () => {
    mockApiGet.mockImplementation(() => new Promise(() => {}));
    renderComponent();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('debería renderizar info del estudiante después de cargar', async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('/tutor/practice/')) {
        return Promise.resolve({
          data: {
            data: {
              studentName: 'María García',
              studentCi: '12345678',
              institutionName: 'Hospital Central',
              careerName: 'Ing. Enfermería',
            },
          },
        });
      }
      if (url.includes('/evaluations/practice/')) {
        return Promise.resolve({ data: { data: { evaluations: {} } } });
      }
      return Promise.resolve({ data: {} });
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('María García')).toBeInTheDocument();
    });
    expect(screen.getByText('12345678')).toBeInTheDocument();
    expect(screen.getByText('Hospital Central')).toBeInTheDocument();
    expect(screen.getByText('Ing. Enfermería')).toBeInTheDocument();
  });

  it('debería mostrar el nombre del tutor auto-completado', async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('/tutor/practice/')) {
        return Promise.resolve({
          data: { data: { studentName: 'Test', studentCi: '', institutionName: '', careerName: '' } },
        });
      }
      if (url.includes('/evaluations/practice/')) {
        return Promise.resolve({ data: { data: { evaluations: {} } } });
      }
      return Promise.resolve({ data: {} });
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Dr. Juan Pérez')).toBeInTheDocument();
    });
  });

  it('debería renderizar los criterios de evaluación', async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('/tutor/practice/')) {
        return Promise.resolve({
          data: { data: { studentName: 'Test', studentCi: '', institutionName: '', careerName: '' } },
        });
      }
      if (url.includes('/evaluations/practice/')) {
        return Promise.resolve({ data: { data: { evaluations: {} } } });
      }
      return Promise.resolve({ data: {} });
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('1.')).toBeInTheDocument();
    });
    expect(screen.getByText('Conocimiento técnico')).toBeInTheDocument();
    expect(screen.getByText('Responsabilidad')).toBeInTheDocument();
    expect(screen.getByText('Trabajo en equipo')).toBeInTheDocument();
  });

  it('debería calcular y mostrar el promedio', async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('/tutor/practice/')) {
        return Promise.resolve({
          data: { data: { studentName: 'Test', studentCi: '', institutionName: '', careerName: '' } },
        });
      }
      if (url.includes('/evaluations/practice/')) {
        return Promise.resolve({ data: { data: { evaluations: {} } } });
      }
      return Promise.resolve({ data: {} });
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('60%')).toBeInTheDocument();
    });
  });

  it('debería llamar createEvaluation al guardar evaluación nueva', async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('/tutor/practice/')) {
        return Promise.resolve({
          data: { data: { studentName: 'Test', studentCi: '', institutionName: '', careerName: '' } },
        });
      }
      if (url.includes('/evaluations/practice/')) {
        return Promise.resolve({ data: { data: { evaluations: {} } } });
      }
      return Promise.resolve({ data: {} });
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Guardar Evaluación')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Guardar Evaluación'));

    await waitFor(() => {
      expect(mockCreateEvaluation).toHaveBeenCalledWith(
        expect.objectContaining({
          professionalPracticeId: 123,
          evaluatorType: 'ACADEMICO',
          evaluatorName: 'Dr. Juan Pérez',
          items: expect.arrayContaining([
            expect.objectContaining({ criteriaId: 1 }),
            expect.objectContaining({ criteriaId: 2 }),
            expect.objectContaining({ criteriaId: 3 }),
          ]),
        })
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith('/tutor/students');
  });

  it('debería llamar updateEvaluation si ya existe evaluación', async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('/tutor/practice/')) {
        return Promise.resolve({
          data: { data: { studentName: 'Test', studentCi: '', institutionName: '', careerName: '' } },
        });
      }
      if (url.includes('/evaluations/practice/')) {
        return Promise.resolve({
          data: {
            data: {
              evaluations: {
                ACADEMICO: { completed: true, evaluationId: 42 },
              },
            },
          },
        });
      }
      if (url.includes('/evaluations/42')) {
        return Promise.resolve({
          data: {
            data: {
              evaluationId: 42,
              evaluatorName: 'Dr. Juan Pérez',
              observations: 'Buen trabajo',
              totalScore: 4,
              items: [
                { criteriaId: 1, itemNumber: 1, score: 4 },
                { criteriaId: 2, itemNumber: 2, score: 5 },
                { criteriaId: 3, itemNumber: 3, score: 3 },
              ],
            },
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Actualizar Evaluación')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Actualizar Evaluación'));

    await waitFor(() => {
      expect(mockUpdateEvaluation).toHaveBeenCalledWith(42, expect.any(Object));
    });
  });

  it('debería navegar a /tutor/students al cancelar', async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('/tutor/practice/')) {
        return Promise.resolve({
          data: { data: { studentName: 'Test', studentCi: '', institutionName: '', careerName: '' } },
        });
      }
      if (url.includes('/evaluations/practice/')) {
        return Promise.resolve({ data: { data: { evaluations: {} } } });
      }
      return Promise.resolve({ data: {} });
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cancelar'));
    expect(mockNavigate).toHaveBeenCalledWith('/tutor/students');
  });

  it('no debería mostrar error de tutor si el nombre existe', async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('/tutor/practice/')) {
        return Promise.resolve({
          data: { data: { studentName: 'Test', studentCi: '', institutionName: '', careerName: '' } },
        });
      }
      if (url.includes('/evaluations/practice/')) {
        return Promise.resolve({ data: { data: { evaluations: {} } } });
      }
      return Promise.resolve({ data: {} });
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Guardar Evaluación')).toBeInTheDocument();
    });

    expect(screen.queryByText('No se pudo obtener el nombre del tutor')).not.toBeInTheDocument();
  });
});
