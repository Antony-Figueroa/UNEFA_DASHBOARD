/**
 * @file TutorGrades.test.tsx
 * @description Tests para TutorGrades — tablas de pendientes/calificados, modal de nota
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router';
import TutorGrades from '../TutorGrades';

// ── Mocks ──────────────────────────────────────────────────

const mockGetStudents = vi.fn();
const mockUpdateGrade = vi.fn();

vi.mock('../../../features/tutor/services/tutorService', () => ({
  default: {
    getStudents: (...args: any[]) => mockGetStudents(...args),
    updateGrade: (...args: any[]) => mockUpdateGrade(...args),
  },
}));

vi.mock('../../../context/toast', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

vi.mock('../../../components/common/ComponentCard', () => ({
  default: ({ title, children, className }: any) => (
    <div data-testid="component-card" className={className}>
      {title && <h2>{title}</h2>}
      {children}
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

vi.mock('../../../components/ui/badge/Badge', () => ({
  default: ({ children, color }: any) => (
    <span data-testid="badge" data-color={color}>{children}</span>
  ),
}));

vi.mock('../../../components/form/input/InputField', () => ({
  default: ({ value, onChange, placeholder, ...props }: any) => (
    <input
      data-testid="mock-input"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      {...props}
    />
  ),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <div data-testid="motion-div" {...rest}>{children}</div>;
    },
    span: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <span {...rest}>{children}</span>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// ── Test Data ──────────────────────────────────────────────

const MOCK_STUDENTS = [
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
];

const renderComponent = () => render(<MemoryRouter><HelmetProvider><TutorGrades /></HelmetProvider></MemoryRouter>);

describe('TutorGrades', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('debería mostrar las cards de resumen', async () => {
    mockGetStudents.mockResolvedValue(MOCK_STUDENTS);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Total Activos')).toBeDefined();
      expect(screen.getByText('Sin Calificar')).toBeDefined();
      expect(screen.getByText('Calificados')).toBeDefined();
    });

    // 2 students total, 1 pending, 1 graded
    expect(screen.getByText('2')).toBeDefined();
  });

  it('debería mostrar estudiantes pendientes y calificados', async () => {
    mockGetStudents.mockResolvedValue(MOCK_STUDENTS);
    renderComponent();

    await waitFor(() => {
      // Juan is pending (grade=0)
      expect(screen.getByText('Juan Pérez')).toBeDefined();
      // María is graded (grade=15)
      expect(screen.getByText('María García')).toBeDefined();
    });

    // Juan should have "Calificar" button
    const calificarButtons = screen.getAllByText('Calificar');
    expect(calificarButtons.length).toBeGreaterThan(0);

    // María should show grade badge
    const badges = screen.getAllByTestId('badge');
    const gradeBadge = badges.find(b => b.textContent === '15.0');
    expect(gradeBadge).toBeDefined();
  });

  it('debería mostrar EmptyState cuando no hay pendientes', async () => {
    const allGraded = MOCK_STUDENTS.map(s => ({ ...s, grade: 16 }));
    mockGetStudents.mockResolvedValue(allGraded);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No hay estudiantes pendientes de calificación')).toBeDefined();
    });
  });

  it('debería abrir modal al hacer clic en Calificar', async () => {
    mockGetStudents.mockResolvedValue(MOCK_STUDENTS);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeDefined();
    });

    const calificarBtn = screen.getAllByText('Calificar')[0];
    fireEvent.click(calificarBtn);

    await waitFor(() => {
      expect(screen.getByText('Asignar Nota')).toBeDefined();
      expect(screen.getByText('Nota Final (0-20)')).toBeDefined();
      expect(screen.getByText('Guardar Nota')).toBeDefined();
      expect(screen.getByText('Cancelar')).toBeDefined();
    });
  });

  it('debería validar rango de nota al guardar', async () => {
    mockGetStudents.mockResolvedValue(MOCK_STUDENTS);
    mockUpdateGrade.mockResolvedValue(undefined);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeDefined();
    });

    // Open modal
    fireEvent.click(screen.getAllByText('Calificar')[0]);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Ingrese la nota')).toBeDefined();
    });

    // Enter invalid grade
    const gradeInput = screen.getByPlaceholderText('Ingrese la nota');
    fireEvent.change(gradeInput, { target: { value: '25' } });

    // Try to save
    fireEvent.click(screen.getByText('Guardar Nota'));

    // Should show validation toast (we mock toast, so it just shouldn't call updateGrade)
    expect(mockUpdateGrade).not.toHaveBeenCalled();
  });

  it('debería llamar updateGrade al guardar nota válida', async () => {
    mockGetStudents.mockResolvedValue(MOCK_STUDENTS);
    mockUpdateGrade.mockResolvedValue(undefined);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeDefined();
    });

    // Open modal
    fireEvent.click(screen.getAllByText('Calificar')[0]);

    await waitFor(() => {
      expect(screen.getByText('Asignar Nota')).toBeDefined();
    });

    // Enter valid grade
    const gradeInput = screen.getByPlaceholderText('Ingrese la nota');
    fireEvent.change(gradeInput, { target: { value: '16' } });

    // Save
    fireEvent.click(screen.getByText('Guardar Nota'));

    await waitFor(() => {
      expect(mockUpdateGrade).toHaveBeenCalledWith('101', 16, '');
    });
  });

  it('debería cerrar modal al cancelar', async () => {
    mockGetStudents.mockResolvedValue(MOCK_STUDENTS);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeDefined();
    });

    // Open modal
    fireEvent.click(screen.getAllByText('Calificar')[0]);

    await waitFor(() => {
      expect(screen.getByText('Asignar Nota')).toBeDefined();
    });

    // Cancel
    fireEvent.click(screen.getByText('Cancelar'));

    await waitFor(() => {
      expect(screen.queryByText('Asignar Nota')).toBeNull();
    });
  });
});
