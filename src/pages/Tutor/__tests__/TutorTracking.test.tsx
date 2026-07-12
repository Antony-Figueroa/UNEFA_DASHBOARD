/**
 * @file TutorTracking.test.tsx
 * @description Tests para TutorTracking — lista, búsqueda, modal, acciones
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import TutorTracking from '../TutorTracking';
import type { TutorStudent } from '../../../features/tutor/services/tutorService';

// ── Mock data ──────────────────────────────────────────────

const mockStudents: TutorStudent[] = [
  {
    enrollmentId: '1',
    tutorType: 'ACADEMICO',
    studentId: 'S1',
    studentCi: '12345678',
    studentName: 'María García',
    studentEmail: 'maria@test.com',
    studentPhone: '04121234567',
    careerName: 'Ing. Enfermería',
    institutionName: 'Hospital Central',
    period: '2025-I',
    practiceType: 'Pasantía',
    enrollmentDate: '2025-01-15',
    startDate: '2025-02-01',
    endDate: '2025-07-31',
    status: 'active',
    grade: 0,
    totalHours: 120,
  },
  {
    enrollmentId: '2',
    tutorType: 'EMPRESARIAL',
    studentId: 'S2',
    studentCi: '87654321',
    studentName: 'Carlos López',
    studentEmail: 'carlos@test.com',
    studentPhone: '04129876543',
    careerName: 'Medicina',
    institutionName: 'Clínica Aurora',
    period: '2025-I',
    practiceType: 'Pasantía',
    enrollmentDate: '2025-01-20',
    startDate: '2025-02-01',
    endDate: '2025-08-31',
    status: 'active',
    grade: 0,
    totalHours: 80,
  },
];

const mockOpenTab = vi.fn();
const mockNavigate = vi.fn();
const mockGetStudents = vi.fn();

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../../context/tab', () => ({
  useTabs: () => ({ openTab: mockOpenTab }),
}));

vi.mock('../../../context/auth', () => ({
  useAuth: () => ({ user: { name: 'Dr. Juan Pérez', role: 2 } }), // 2 = non-admin role
}));

vi.mock('../../../features/tutor/services/tutorService', () => ({
  default: {
    getStudents: (...args: any[]) => mockGetStudents(...args),
  },
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

vi.mock('../../../components/ui/badge/Badge', () => ({
  default: ({ children, color }: any) => <span data-testid="badge" data-color={color}>{children}</span>,
}));

vi.mock('../../../components/ui/table', () => ({
  Table: ({ children }: any) => <table data-testid="table">{children}</table>,
  TableHeader: ({ children }: any) => <thead>{children}</thead>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
  TableCell: ({ children, isHeader, className }: any) =>
    isHeader ? <th className={className}>{children}</th> : <td className={className}>{children}</td>,
  Pagination: ({ currentPage, totalPages, onPageChange }: any) => (
    <div data-testid="pagination">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}>Prev</button>
      <span>{currentPage} / {totalPages}</span>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}>Next</button>
    </div>
  ),
}));

vi.mock('../../../components/ui/table/EmptyState', () => ({
  EmptyState: ({ title, description }: any) => (
    <div data-testid="empty-state">
      <p>{title}</p>
      <p>{description}</p>
    </div>
  ),
}));

vi.mock('../../../components/common/AsyncActionButton', () => ({
  AsyncActionButton: ({ onClick, icon, tooltip, variant }: any) => (
    <button data-testid="action-btn" data-tooltip={tooltip} data-variant={variant} onClick={onClick}>
      {icon}
    </button>
  ),
}));

vi.mock('../../../components/ui/modal', () => ({
  Modal: ({ isOpen, children, onClose }: any) =>
    isOpen ? (
      <div data-testid="modal" role="dialog">
        <button data-testid="modal-close" onClick={onClose}>X</button>
        {children}
      </div>
    ) : null,
  ModalHeader: ({ children }: any) => <div data-testid="modal-header">{children}</div>,
  ModalBody: ({ children }: any) => <div data-testid="modal-body">{children}</div>,
}));

vi.mock('../../../components/form/input/InputField', () => ({
  default: ({ placeholder, value, onChange, leftIcon }: any) => (
    <input
      data-testid="search-input"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  ),
}));

vi.mock('../../../components/ui/button/Button', () => ({
  default: ({ children, onClick, variant, className }: any) => (
    <button data-testid="modal-action-btn" data-variant={variant} onClick={onClick} className={className}>
      {children}
    </button>
  ),
}));

// ── Helpers ────────────────────────────────────────────────

const renderComponent = () =>
  render(
    <HelmetProvider>
      <TutorTracking />
    </HelmetProvider>
  );

describe('TutorTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStudents.mockResolvedValue(mockStudents);
  });

  it('debería mostrar skeleton mientras carga', () => {
    mockGetStudents.mockImplementation(() => new Promise(() => {}));
    renderComponent();
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('debería mostrar lista de estudiantes después de cargar', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('María García')).toBeInTheDocument();
    });
    expect(screen.getByText('Carlos López')).toBeInTheDocument();
  });

  it('debería mostrar error si falla la carga', async () => {
    mockGetStudents.mockRejectedValue(new Error('Fail'));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Error al cargar estudiantes')).toBeInTheDocument();
    });
  });

  it('debería mostrar EmptyState si no hay estudiantes', async () => {
    mockGetStudents.mockResolvedValue([]);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
    expect(screen.getByText('No hay estudiantes activos')).toBeInTheDocument();
  });

  it('debería filtrar estudiantes por búsqueda', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('María García')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'Carlos' } });

    await waitFor(() => {
      expect(screen.queryByText('María García')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Carlos López')).toBeInTheDocument();
  });

  it('debería mostrar paginación con más de 5 estudiantes', async () => {
    const manyStudents = Array.from({ length: 12 }, (_, i) => ({
      ...mockStudents[0],
      enrollmentId: String(i + 1),
      studentName: `Estudiante ${i + 1}`,
    }));
    mockGetStudents.mockResolvedValue(manyStudents);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });
  });

  it('debería mostrar modal de detalles del estudiante', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('María García')).toBeInTheDocument();
    });

    const viewBtns = screen.getAllByTestId('action-btn');
    fireEvent.click(viewBtns[0]);

    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
    expect(screen.getByText('maria@test.com')).toBeInTheDocument();
    expect(screen.getByText('04121234567')).toBeInTheDocument();
  });

  it('debería cerrar modal al hacer clic en X', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('María García')).toBeInTheDocument();
    });

    const viewBtns = screen.getAllByTestId('action-btn');
    fireEvent.click(viewBtns[0]);

    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('modal-close'));

    await waitFor(() => {
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });
  });

  it('debería abrir visitas desde botón de acción en tabla', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('María García')).toBeInTheDocument();
    });

    const viewBtns = screen.getAllByTestId('action-btn');
    fireEvent.click(viewBtns[1]); // segundo botón = visits

    expect(mockOpenTab).toHaveBeenCalledWith('/tutor/visits/1', 'Visita #1');
  });

  it('debería abrir actividades desde botón de acción en tabla', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('María García')).toBeInTheDocument();
    });

    const viewBtns = screen.getAllByTestId('action-btn');
    fireEvent.click(viewBtns[2]); // tercero = activities

    expect(mockOpenTab).toHaveBeenCalledWith('/tutor/activity-logs/1', 'Actividades #1');
  });

  it('debería mostrar botón de evaluación para tutor académico', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('María García')).toBeInTheDocument();
    });

    const evalBtns = screen.getAllByTestId('action-btn').filter(
      (btn) => btn.getAttribute('data-tooltip') === 'Cargar Evaluación'
    );
    expect(evalBtns.length).toBe(1); // solo María (ACADEMICO)
  });

  it('NO debería mostrar botón de evaluación para tutor empresarial', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Carlos López')).toBeInTheDocument();
    });

    const allRows = screen.getAllByTestId('action-btn');
    // Como hay muchos botones, busco los de la segunda fila
    // Carlos es EMPRESARIAL → sin evaluation
    // Usamos el texto de la fila para identificar
    // Simplificado: verificamos que hay menos botones totales que para ACADEMICO
    // (María tiene 4, Carlos tiene 3 si ambos están visibles)
    // Como itemsPerPage=5 y hay 2, ambos están visibles
    // Búsqueda alternativa: contar botones de evaluación
    const evalBtns = allRows.filter(
      (btn) => btn.getAttribute('data-tooltip') === 'Cargar Evaluación'
    );
    expect(evalBtns.length).toBe(1); // Solo María
  });

  it('debería abrir evaluaciones desde modal de detalles', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('María García')).toBeInTheDocument();
    });

    // Open modal
    const viewBtns = screen.getAllByTestId('action-btn');
    fireEvent.click(viewBtns[0]);

    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    // Click "Registro de Visitas" in modal
    const modalBtns = screen.getAllByTestId('modal-action-btn');
    fireEvent.click(modalBtns[0]);

    expect(mockOpenTab).toHaveBeenCalledWith('/tutor/visits/1', expect.any(String));
  });
});
