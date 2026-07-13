/**
 * @file TutorStudents.test.tsx
 * @description Tests para TutorStudents — tabla, filtros, búsqueda, estado vacío
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router';
import { HelmetProvider } from 'react-helmet-async';
import TutorStudents from '../TutorStudents';
import type { TutorStudent } from '../../../features/tutor/services/tutorService';

// ── Mocks ──────────────────────────────────────────────────

const mockGetStudents = vi.fn();

vi.mock('../../../features/tutor/services/tutorService', () => ({
  default: {
    getStudents: (...args: any[]) => mockGetStudents(...args),
  },
}));

vi.mock('../../../features/students/components/StudentViewModal', () => ({
  default: ({ isOpen, onClose }: any) => isOpen ? <div data-testid="student-view-modal">Student View</div> : null,
}));

vi.mock('../../../context/auth', () => ({
  useAuth: () => ({ user: { role: 2 } }),
}));

vi.mock('../../../context/tab', () => ({
  useTabs: () => ({
    openTab: vi.fn(),
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

vi.mock('lucide-react', () => ({
  Search: (props: any) => <span data-testid="search-icon" {...props}>🔍</span>,
  Eye: (props: any) => <span data-testid="eye-icon" {...props}>👁</span>,
  Calendar: (props: any) => <span data-testid="calendar-icon" {...props}>📅</span>,
  FileText: (props: any) => <span data-testid="filetext-icon" {...props}>📄</span>,
  ClipboardCheck: (props: any) => <span data-testid="clipboard-icon" {...props}>✅</span>,
}));

vi.mock('../../../components/ui/badge/Badge', () => ({
  default: ({ children, color }: any) => (
    <span data-testid="badge" data-color={color}>{children}</span>
  ),
}));

vi.mock('../../../components/form/input/InputField', () => ({
  default: ({ value, onChange, placeholder, leftIcon }: any) => (
    <div data-testid="input-field">
      {leftIcon}
      <input
        data-testid="mock-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  ),
}));

vi.mock('../../../components/form/CustomSelect', () => ({
  default: ({ value, onChange, options, placeholder }: any) => (
    <select
      data-testid="mock-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  ),
}));

vi.mock('../../../components/common/AsyncActionButton', () => ({
  AsyncActionButton: ({ onClick, icon, tooltip, variant }: any) => (
    <button data-testid="mock-action-btn" onClick={onClick} title={tooltip}>
      {icon}
    </button>
  ),
  default: ({ onClick, icon, tooltip, variant }: any) => (
    <button data-testid="mock-action-btn" onClick={onClick} title={tooltip}>
      {icon}
    </button>
  ),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <div data-testid="motion-div" {...rest}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// ── Test Data ──────────────────────────────────────────────

const MOCK_STUDENTS: TutorStudent[] = [
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
  {
    enrollmentId: '103',
    tutorType: 'ACADEMICO',
    studentId: '3',
    studentCi: '11223344',
    studentName: 'Pedro López',
    studentEmail: 'pedro@test.com',
    studentPhone: '04125556677',
    careerName: 'Medicina',
    institutionName: 'Clínica Sur',
    period: '1-2026',
    practiceType: 'Hospitalaria',
    enrollmentDate: '2026-01-15',
    startDate: '2026-03-01',
    endDate: '2026-07-15',
    status: 'completed',
    grade: 18,
    totalHours: 360,
  },
];

const renderComponent = () =>
  render(
    <HelmetProvider>
      <BrowserRouter>
        <TutorStudents />
      </BrowserRouter>
    </HelmetProvider>
  );

// ── Tests ──────────────────────────────────────────────────

describe('TutorStudents', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('debería mostrar loader mientras carga', () => {
    mockGetStudents.mockReturnValue(new Promise(() => {})); // never resolves
    renderComponent();

    expect(screen.getByText('Mis Estudiantes')).toBeDefined();
    // Should show skeleton loaders
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('debería renderizar lista de estudiantes', async () => {
    mockGetStudents.mockResolvedValue(MOCK_STUDENTS);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeDefined();
    });

    expect(screen.getByText('María García')).toBeDefined();
    expect(screen.getByText('Pedro López')).toBeDefined();
    // Check counts
    expect(screen.getByText(/Estudiantes \(3\)/)).toBeDefined();
  });

  it('debería mostrar badge de estado correcto para cada estudiante', async () => {
    mockGetStudents.mockResolvedValue(MOCK_STUDENTS);
    renderComponent();

    await waitFor(() => {
      const badges = screen.getAllByTestId('badge');
      expect(badges).toHaveLength(3);
      expect(badges[0]).toHaveAttribute('data-color', 'success'); // active
      expect(badges[2]).toHaveAttribute('data-color', 'info');    // completed
    });
  });

  it('debería mostrar nota o guión según corresponda', async () => {
    mockGetStudents.mockResolvedValue(MOCK_STUDENTS);
    renderComponent();

    await waitFor(() => {
      // Student 101 has grade 0 -> shows "-"
      expect(screen.getByText('-')).toBeDefined();
      // Student 102 has grade 15
      expect(screen.getByText('15.0')).toBeDefined();
      // Student 103 has grade 18
      expect(screen.getByText('18.0')).toBeDefined();
    });
  });

  it('debería filtrar por búsqueda', async () => {
    mockGetStudents.mockResolvedValue(MOCK_STUDENTS);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeDefined();
    });

    const searchInput = screen.getByTestId('mock-input');
    fireEvent.change(searchInput, { target: { value: 'María' } });

    await waitFor(() => {
      expect(screen.queryByText('Juan Pérez')).toBeNull();
      expect(screen.getByText('María García')).toBeDefined();
      expect(screen.queryByText('Pedro López')).toBeNull();
    });
  });

  it('debería mostrar EmptyState cuando no hay resultados de búsqueda', async () => {
    mockGetStudents.mockResolvedValue(MOCK_STUDENTS);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeDefined();
    });

    const searchInput = screen.getByTestId('mock-input');
    fireEvent.change(searchInput, { target: { value: 'ZZZ' } });

    await waitFor(() => {
      expect(screen.getByText('No se encontraron estudiantes')).toBeDefined();
    });
  });

  it('debería mostrar error en caso de fallo', async () => {
    mockGetStudents.mockRejectedValue(new Error('API Error'));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Error al cargar estudiantes')).toBeDefined();
    });
  });
});
