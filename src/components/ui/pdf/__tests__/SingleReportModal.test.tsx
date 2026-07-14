/**
 * @file SingleReportModal.test.tsx
 * @description Tests for SingleReportModal — verification hash generation and flow.
 * Verifies that createVerification is called correctly when verificationConfig is provided,
 * and that the hash flows through to the template callback.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// ─── Mocks (vi.hoisted avoids TDZ issues with vi.mock hoisting) ─────────

const { mockCreateVerification } = vi.hoisted(() => ({
  mockCreateVerification: vi.fn(),
}));

const { mockTemplate } = vi.hoisted(() => ({
  mockTemplate: vi.fn(),
}));

// Mock verification service
vi.mock('../../../services/verificationService', () => ({
  createVerification: (...args: unknown[]) => mockCreateVerification(...args),
}));

// Mock PDF engine to avoid jsdom issues
vi.mock('@react-pdf/renderer', () => ({
  PDFViewer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pdf-viewer">{children}</div>
  ),
  pdf: () => ({
    toBlob: () => Promise.resolve(new Blob()),
  }),
}));

// Mock useSingleReport
const { mockGeneratePDF } = vi.hoisted(() => ({ mockGeneratePDF: vi.fn() }));
const { mockPreviewPDF } = vi.hoisted(() => ({ mockPreviewPDF: vi.fn() }));

vi.mock('../../../hooks/pdf/useSingleReport', () => ({
  useSingleReport: () => ({
    generatePDF: mockGeneratePDF,
    previewPDF: mockPreviewPDF,
    isGenerating: false,
  }),
}));

// Mock icons
vi.mock('../../../icons', () => ({
  DownloadIcon: () => <span data-testid="icon-download">⬇</span>,
  FileIcon: () => <span data-testid="icon-file">📄</span>,
  EyeIcon: () => <span data-testid="icon-eye">👁</span>,
  UserIcon: () => <span data-testid="icon-user">👤</span>,
}));

vi.mock('../../../icons/actions', () => ({
  XIcon: () => <span data-testid="icon-x">✕</span>,
  ListIcon: () => <span data-testid="icon-list">☰</span>,
}));

// Mock Modal
vi.mock('../modal', () => ({
  Modal: ({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="modal" role="dialog">
        <button data-testid="modal-close" onClick={onClose}>Cerrar</button>
        {children}
      </div>
    );
  },
}));

// ─── Test Data ────────────────────────────────────────────────────────────

const TEST_HASH = 'abc123def456';
const defaultData = { id: 1, name: 'Test' };

// ─── Tests ────────────────────────────────────────────────────────────────

describe('SingleReportModal — verification hash', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTemplate.mockImplementation(
      (data: { id: number; name: string }, verificationHash?: string) =>
        React.createElement('div', {
          'data-testid': 'pdf-template',
          'data-verification-hash': verificationHash || '',
        }, `${data.name} ${verificationHash || 'no-hash'}`)
    );
    mockCreateVerification.mockResolvedValue(TEST_HASH);
  });

  // ── Sin verificationConfig ───────────────────────────────────────────

  it('NO debe llamar createVerification cuando no hay verificationConfig', async () => {
    const { SingleReportModal } = await import('../SingleReportModal');

    render(
      React.createElement(SingleReportModal, {
        isOpen: true,
        onClose: vi.fn(),
        title: 'Test Report',
        data: defaultData,
        template: mockTemplate,
        fileName: 'test-report',
      })
    );

    expect(mockCreateVerification).not.toHaveBeenCalled();
  });

  it('debe renderizar el template sin verificationHash cuando no hay verificationConfig', async () => {
    const { SingleReportModal } = await import('../SingleReportModal');

    render(
      React.createElement(SingleReportModal, {
        isOpen: true,
        onClose: vi.fn(),
        title: 'Test Report',
        data: defaultData,
        template: mockTemplate,
        fileName: 'test-report',
      })
    );

    await waitFor(() => {
      expect(screen.getByTestId('pdf-template')).toBeInTheDocument();
    });

    expect(mockTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1 }),
      undefined
    );
  });

  // ── Con verificationConfig ──────────────────────────────────────────

  it('debe llamar createVerification con docType y title cuando se abre el modal', async () => {
    const { SingleReportModal } = await import('../SingleReportModal');

    render(
      React.createElement(SingleReportModal, {
        isOpen: true,
        onClose: vi.fn(),
        title: 'Test Report',
        data: defaultData,
        template: mockTemplate,
        fileName: 'test-report',
        verificationConfig: { docType: 'ficha-test' },
      })
    );

    await waitFor(() => {
      expect(mockCreateVerification).toHaveBeenCalledWith(
        'ficha-test',
        'Test Report',
        undefined
      );
    });
  });

  it('debe pasar metadata a createVerification cuando se proporciona', async () => {
    const { SingleReportModal } = await import('../SingleReportModal');
    const metadata = { entityId: 42, type: 'test' };

    render(
      React.createElement(SingleReportModal, {
        isOpen: true,
        onClose: vi.fn(),
        title: 'Test Report',
        data: defaultData,
        template: mockTemplate,
        fileName: 'test-report',
        verificationConfig: { docType: 'ficha-test', metadata },
      })
    );

    await waitFor(() => {
      expect(mockCreateVerification).toHaveBeenCalledWith(
        'ficha-test',
        'Test Report',
        metadata
      );
    });
  });

  it('debe pasar el verificationHash al template cuando la verificación se completa', async () => {
    const { SingleReportModal } = await import('../SingleReportModal');

    render(
      React.createElement(SingleReportModal, {
        isOpen: true,
        onClose: vi.fn(),
        title: 'Test Report',
        data: defaultData,
        template: mockTemplate,
        fileName: 'test-report',
        verificationConfig: { docType: 'ficha-test' },
      })
    );

    await waitFor(() => {
      expect(mockTemplate).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1 }),
        TEST_HASH
      );
    });

    const templateEl = screen.getByTestId('pdf-template');
    expect(templateEl.getAttribute('data-verification-hash')).toBe(TEST_HASH);
  });

  it('debe renderizar el hash en el template cuando la verificación se completa', async () => {
    const { SingleReportModal } = await import('../SingleReportModal');

    render(
      React.createElement(SingleReportModal, {
        isOpen: true,
        onClose: vi.fn(),
        title: 'Test Report',
        data: defaultData,
        template: mockTemplate,
        fileName: 'test-report',
        verificationConfig: { docType: 'ficha-test' },
      })
    );

    await waitFor(() => {
      expect(screen.getByText(new RegExp(TEST_HASH))).toBeInTheDocument();
    });
  });

  // ── Manejo de errores ─────────────────────────────────────────────────

  it('debe pasar undefined al template cuando createVerification falla', async () => {
    const { SingleReportModal } = await import('../SingleReportModal');
    mockCreateVerification.mockRejectedValue(new Error('API error'));

    render(
      React.createElement(SingleReportModal, {
        isOpen: true,
        onClose: vi.fn(),
        title: 'Test Report',
        data: defaultData,
        template: mockTemplate,
        fileName: 'test-report',
        verificationConfig: { docType: 'ficha-test' },
      })
    );

    await waitFor(() => {
      expect(mockTemplate).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1 }),
        undefined
      );
    });
  });

  it('debe limpiar el hash al cerrar el modal', async () => {
    const { SingleReportModal } = await import('../SingleReportModal');

    const { rerender } = render(
      React.createElement(SingleReportModal, {
        isOpen: true,
        onClose: vi.fn(),
        title: 'Test Report',
        data: defaultData,
        template: mockTemplate,
        fileName: 'test-report',
        verificationConfig: { docType: 'ficha-test' },
      })
    );

    await waitFor(() => {
      expect(mockTemplate).toHaveBeenLastCalledWith(
        expect.objectContaining({ id: 1 }),
        TEST_HASH
      );
    });

    // Limpiar calls anteriores para evaluar solo el re-render
    mockCreateVerification.mockClear();
    mockTemplate.mockClear();

    rerender(
      React.createElement(SingleReportModal, {
        isOpen: false,
        onClose: vi.fn(),
        title: 'Test Report',
        data: defaultData,
        template: mockTemplate,
        fileName: 'test-report',
        verificationConfig: { docType: 'ficha-test' },
      })
    );

    expect(mockTemplate).not.toHaveBeenCalled();
  });

  it('debe cancelar la promesa pendiente si el modal se cierra antes de resolver', async () => {
    const { SingleReportModal } = await import('../SingleReportModal');

    let resolvePromise: (hash: string) => void = () => {};
    const slowPromise = new Promise<string>((resolve) => {
      resolvePromise = resolve;
    });
    mockCreateVerification.mockReturnValue(slowPromise);

    const { rerender } = render(
      React.createElement(SingleReportModal, {
        isOpen: true,
        onClose: vi.fn(),
        title: 'Test Report',
        data: defaultData,
        template: mockTemplate,
        fileName: 'test-report',
        verificationConfig: { docType: 'ficha-test' },
      })
    );

    // Cerrar modal antes de que se resuelva la promesa
    rerender(
      React.createElement(SingleReportModal, {
        isOpen: false,
        onClose: vi.fn(),
        title: 'Test Report',
        data: defaultData,
        template: mockTemplate,
        fileName: 'test-report',
        verificationConfig: { docType: 'ficha-test' },
      })
    );

    // Limpiar las calls del primer render (que usaban undefined)
    mockTemplate.mockClear();

    // Resolver la promesa después de cerrar — el flag cancelled debería evitar que se aplique
    resolvePromise('should-not-appear');

    // Pequeña espera para que se procese el setState cancelado
    await new Promise((r) => setTimeout(r, 50));

    expect(mockTemplate).not.toHaveBeenCalled();
  });

  // ── Casos específicos de los 5 ViewModals ───────────────────────────

  describe('docTypes específicos de las fichas individuales', () => {
    it('debe aceptar ficha-tutor-academico con metadata tutorId', async () => {
      const { SingleReportModal } = await import('../SingleReportModal');

      render(
        React.createElement(SingleReportModal, {
          isOpen: true,
          onClose: vi.fn(),
          title: 'Ficha de Tutor Académico',
          data: defaultData,
          template: mockTemplate,
          fileName: 'test-report',
          verificationConfig: { docType: 'ficha-tutor-academico', metadata: { tutorId: 1 } },
        })
      );

      await waitFor(() => {
        expect(mockCreateVerification).toHaveBeenCalledWith(
          'ficha-tutor-academico',
          'Ficha de Tutor Académico',
          { tutorId: 1 }
        );
      });
    });

    it('debe aceptar ficha-estudiante con metadata studentId', async () => {
      const { SingleReportModal } = await import('../SingleReportModal');

      render(
        React.createElement(SingleReportModal, {
          isOpen: true,
          onClose: vi.fn(),
          title: 'Ficha de Estudiante',
          data: defaultData,
          template: mockTemplate,
          fileName: 'test-report',
          verificationConfig: { docType: 'ficha-estudiante', metadata: { studentId: 42 } },
        })
      );

      await waitFor(() => {
        expect(mockCreateVerification).toHaveBeenCalledWith(
          'ficha-estudiante',
          'Ficha de Estudiante',
          { studentId: 42 }
        );
      });
    });

    it('debe aceptar ficha-institucion con metadata institutionId', async () => {
      const { SingleReportModal } = await import('../SingleReportModal');

      render(
        React.createElement(SingleReportModal, {
          isOpen: true,
          onClose: vi.fn(),
          title: 'Ficha de Empresa o Institución',
          data: defaultData,
          template: mockTemplate,
          fileName: 'test-report',
          verificationConfig: { docType: 'ficha-institucion', metadata: { institutionId: 7 } },
        })
      );

      await waitFor(() => {
        expect(mockCreateVerification).toHaveBeenCalledWith(
          'ficha-institucion',
          'Ficha de Empresa o Institución',
          { institutionId: 7 }
        );
      });
    });

    it('debe aceptar ficha-responsable-institucional con metadata responsibleId', async () => {
      const { SingleReportModal } = await import('../SingleReportModal');

      render(
        React.createElement(SingleReportModal, {
          isOpen: true,
          onClose: vi.fn(),
          title: 'Ficha de Responsable Institucional',
          data: defaultData,
          template: mockTemplate,
          fileName: 'test-report',
          verificationConfig: { docType: 'ficha-responsable-institucional', metadata: { responsibleId: 15 } },
        })
      );

      await waitFor(() => {
        expect(mockCreateVerification).toHaveBeenCalledWith(
          'ficha-responsable-institucional',
          'Ficha de Responsable Institucional',
          { responsibleId: 15 }
        );
      });
    });

    it('debe aceptar ficha-carrera con metadata careerCode', async () => {
      const { SingleReportModal } = await import('../SingleReportModal');

      render(
        React.createElement(SingleReportModal, {
          isOpen: true,
          onClose: vi.fn(),
          title: 'Ficha de Carrera',
          data: defaultData,
          template: mockTemplate,
          fileName: 'test-report',
          verificationConfig: { docType: 'ficha-carrera', metadata: { careerCode: 'ING-SIS' } },
        })
      );

      await waitFor(() => {
        expect(mockCreateVerification).toHaveBeenCalledWith(
          'ficha-carrera',
          'Ficha de Carrera',
          { careerCode: 'ING-SIS' }
        );
      });
    });
  });
});
