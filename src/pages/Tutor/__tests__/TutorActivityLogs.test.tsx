/**
 * @file TutorActivityLogs.test.tsx
 * @description Tests para TutorActivityLogs — filtros, aprobación, detalle dialog
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import TutorActivityLogs from '../TutorActivityLogs';
import type { ActivityLog } from '../../../features/activity-logs/types';

// ── Mock data ──────────────────────────────────────────────

const mockLogs: ActivityLog[] = [
  {
    activityLogId: 1,
    professionalPracticeId: 10,
    studentId: 100,
    studentName: 'María García',
    activityDate: '2025-03-15',
    weekNumber: 1,
    hoursWorked: 4,
    activityType: 'DIARIA',
    activityDescription: 'Revisión de historias clínicas',
    tasksCompleted: 'Completado',
    challenges: 'Ninguno',
    learnings: 'Procedimientos',
    supervisorComments: '',
    supervisorApproved: false,
    supervisorId: null,
    approvedAt: null,
    status: 1,
    createdAt: '2025-03-15T10:00:00Z',
    updatedAt: '2025-03-15T10:00:00Z',
  },
  {
    activityLogId: 2,
    professionalPracticeId: 10,
    studentId: 100,
    studentName: 'María García',
    activityDate: '2025-03-22',
    weekNumber: 2,
    hoursWorked: 8,
    activityType: 'SEMANAL',
    activityDescription: 'Reporte semanal de actividades',
    tasksCompleted: 'Todo ok',
    challenges: 'Poca disponibilidad de equipos',
    learnings: 'Trabajo bajo presión',
    supervisorComments: 'Buen trabajo',
    supervisorApproved: true,
    supervisorId: 5,
    approvedAt: '2025-03-23T08:00:00Z',
    status: 2,
    createdAt: '2025-03-22T15:00:00Z',
    updatedAt: '2025-03-23T08:00:00Z',
  },
  {
    activityLogId: 3,
    professionalPracticeId: 20,
    studentId: 200,
    studentName: 'Carlos López',
    activityDate: '2025-04-01',
    weekNumber: 1,
    hoursWorked: 6,
    activityType: 'DIARIA',
    activityDescription: 'Toma de signos vitales',
    tasksCompleted: 'Completado',
    challenges: 'Paciente difícil',
    learnings: 'Comunicación asertiva',
    supervisorComments: '',
    supervisorApproved: false,
    supervisorId: null,
    approvedAt: null,
    status: 1,
    createdAt: '2025-04-01T09:00:00Z',
    updatedAt: '2025-04-01T09:00:00Z',
  },
];

const mockGetActivityLogs = vi.fn();
const mockApprove = vi.fn();
const mockAddToast = vi.fn();
const mockOnView = vi.fn();
const mockOnApprove = vi.fn();

// ── Mocks ──────────────────────────────────────────────────

vi.mock('../../../features/tutor/services/tutorService', () => ({
  default: {
    getActivityLogs: (...args: any[]) => mockGetActivityLogs(...args),
  },
}));

vi.mock('../../../features/activity-logs/services/activityLogsService', () => ({
  default: {
    approve: (...args: any[]) => mockApprove(...args),
  },
}));

vi.mock('../../../context/toast', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

vi.mock('../../../components/common/PageMeta', () => ({
  default: ({ title }: any) => <title>{title}</title>,
}));

vi.mock('../../../components/common/PageBreadCrumb', () => ({
  default: ({ pageTitle }: any) => <nav data-testid="breadcrumb">{pageTitle}</nav>,
}));

vi.mock('../../../components/common/ComponentCard', () => ({
  default: ({ title, children }: any) => (
    <div data-testid="component-card" data-title={title}>
      {children}
    </div>
  ),
}));

vi.mock('../../../components/form/input/InputField', () => ({
  default: ({ placeholder, value, onChange }: any) => (
    <input
      data-testid="search-input"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  ),
}));

vi.mock('../../../components/form/CustomSelect', () => ({
  default: ({ options, value, onChange, className }: any) => (
    <select
      data-testid="custom-select"
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  ),
}));

vi.mock('../../../features/activity-logs/components/ActivityLogTable', () => ({
  default: ({ data, loading, onView, onApprove }: any) => (
    <div data-testid="activity-log-table">
      {loading ? (
        <div data-testid="table-loading">Cargando...</div>
      ) : (
        <div>
          <span data-testid="table-row-count">{data.length}</span>
          {data.map((log: any) => (
            <div key={log.activityLogId} data-testid="log-row">
              <span>{log.activityDescription}</span>
              <span>{log.studentName}</span>
              <button
                data-testid="view-btn"
                onClick={() => { mockOnView(log); onView(log); }}
              >
                Ver
              </button>
              {!log.supervisorApproved && (
                <button
                  data-testid="approve-btn"
                  onClick={() => { mockOnApprove(log); onApprove(log); }}
                >
                  Aprobar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  ),
}));

vi.mock('../../../components/ui/dialog/UnifiedDialog', () => ({
  default: ({ isOpen, onClose, title, message, confirmLabel, onConfirm }: any) =>
    isOpen ? (
      <div data-testid="detail-dialog" role="dialog">
        <h2>{title}</h2>
        <div>{message}</div>
        <button data-testid="dialog-close" onClick={onClose}>{confirmLabel}</button>
      </div>
    ) : null,
}));

// ── Helpers ────────────────────────────────────────────────

const renderComponent = () =>
  render(
    <HelmetProvider>
      <TutorActivityLogs />
    </HelmetProvider>
  );

describe('TutorActivityLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetActivityLogs.mockResolvedValue({ data: mockLogs });
    mockApprove.mockResolvedValue({ success: true });
  });

  it('debería mostrar loading inicial', () => {
    mockGetActivityLogs.mockImplementation(() => new Promise(() => {}));
    renderComponent();
    expect(screen.getByTestId('table-loading')).toBeInTheDocument();
  });

  it('debería renderizar logs después de cargar', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('table-row-count')).toHaveTextContent('3');
    });
  });

  it('debería mostrar toast error si falla la carga', async () => {
    mockGetActivityLogs.mockRejectedValue(new Error('Fail'));
    renderComponent();

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalled();
    });
  });

  it('debería filtrar por búsqueda de texto', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('table-row-count')).toHaveTextContent('3');
    });

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'signos' } });

    await waitFor(() => {
      expect(screen.getByTestId('table-row-count')).toHaveTextContent('1');
    });
  });

  it('debería filtrar por tipo de actividad', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('table-row-count')).toHaveTextContent('3');
    });

    const selects = screen.getAllByTestId('custom-select');
    fireEvent.change(selects[0], { target: { value: 'SEMANAL' } });

    await waitFor(() => {
      expect(screen.getByTestId('table-row-count')).toHaveTextContent('1');
    });
  });

  it('debería filtrar por estado pendiente', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('table-row-count')).toHaveTextContent('3');
    });

    const selects = screen.getAllByTestId('custom-select');
    fireEvent.change(selects[1], { target: { value: 'pending' } });

    await waitFor(() => {
      expect(screen.getByTestId('table-row-count')).toHaveTextContent('2');
    });
  });

  it('debería filtrar por estado aprobado', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('table-row-count')).toHaveTextContent('3');
    });

    const selects = screen.getAllByTestId('custom-select');
    fireEvent.change(selects[1], { target: { value: 'approved' } });

    await waitFor(() => {
      expect(screen.getByTestId('table-row-count')).toHaveTextContent('1');
    });
  });

  it('debería aprobar un registro correctamente', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByTestId('approve-btn').length).toBe(2);
    });

    fireEvent.click(screen.getAllByTestId('approve-btn')[0]);

    await waitFor(() => {
      expect(mockApprove).toHaveBeenCalledWith(1);
    });
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'success', title: 'Registro aprobado' })
    );
  });

  it('debería mostrar toast error si falla la aprobación', async () => {
    mockApprove.mockRejectedValue(new Error('Fail'));
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByTestId('approve-btn').length).toBe(2);
    });

    fireEvent.click(screen.getAllByTestId('approve-btn')[0]);

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'error' })
      );
    });
  });

  it('debería abrir dialog de detalle al hacer clic en Ver', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByTestId('view-btn').length).toBe(3);
    });

    fireEvent.click(screen.getAllByTestId('view-btn')[0]);

    await waitFor(() => {
      expect(screen.getByTestId('detail-dialog')).toBeInTheDocument();
    });
    expect(screen.getByText('Detalle de Actividad')).toBeInTheDocument();
  });

  it('debería cerrar dialog de detalle', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByTestId('view-btn').length).toBe(3);
    });

    fireEvent.click(screen.getAllByTestId('view-btn')[0]);

    await waitFor(() => {
      expect(screen.getByTestId('detail-dialog')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('dialog-close'));

    await waitFor(() => {
      expect(screen.queryByTestId('detail-dialog')).not.toBeInTheDocument();
    });
  });

  it('no debería mostrar botón de aprobar en registros ya aprobados', async () => {
    renderComponent();

    await waitFor(() => {
      const approveBtns = screen.queryAllByTestId('approve-btn');
      expect(approveBtns.length).toBe(2); // logs 1 y 3 son pending
    });
  });
});
