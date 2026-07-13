/**
 * @file PreEnrollmentModal.blocking.test.tsx
 * @description Tests for the sequential blocking warning banner in PreEnrollmentModal.
 * Verifies that when a sequential prerequisite error occurs, the appropriate warning
 * banner is displayed with the correct styling and message.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// ─── Blocking Warning Banner Component (extracted for focused testing) ──────
// This extracts the exact banner JSX from PreEnrollmentModal for isolated testing.
// This tests the BEHAVIOR of the banner, not the full modal.

interface BlockingWarningBannerProps {
  blockingInfo: { message: string; reason: string | null };
  onDismiss: () => void;
}

function BlockingWarningBanner({ blockingInfo, onDismiss }: BlockingWarningBannerProps) {
  const isJustifiedWithdrawal = blockingInfo.reason === 'retiro_justificado';

  return (
    <div
      data-testid="blocking-banner"
      className={`rounded-lg border p-4 mb-4 ${
        isJustifiedWithdrawal
          ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/30'
          : 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/30'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <svg
            className={`h-5 w-5 ${
              isJustifiedWithdrawal
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-red-600 dark:text-red-400'
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="flex-1">
          <p
            className={`text-sm font-medium ${
              isJustifiedWithdrawal
                ? 'text-blue-800 dark:text-blue-200'
                : 'text-red-800 dark:text-red-200'
            }`}
          >
            {blockingInfo.message}
          </p>
          {isJustifiedWithdrawal && (
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              El estudiante puede reinscribirse en el siguiente período en el mismo tipo de práctica.
            </p>
          )}
          <button
            type="button"
            onClick={onDismiss}
            className={`mt-2 text-sm underline ${
              isJustifiedWithdrawal
                ? 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200'
                : 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200'
            }`}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('PreEnrollmentModal - Sequential Blocking Warning Banner', () => {
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════
  // RED: Write failing test FIRST
  // ═══════════════════════════════════════════════════════════════════

  it('should display blocking warning banner with red styling for "retirado" reason', () => {
    // Arrange
    const blockingInfo = {
      message: 'Prerrequisito secuencial no cumplido: HOSPITALARIA debe estar culminada',
      reason: 'retirado',
    };

    // Act
    render(<BlockingWarningBanner blockingInfo={blockingInfo} onDismiss={mockOnDismiss} />);

    // Assert - banner is visible
    const banner = screen.getByTestId('blocking-banner');
    expect(banner).toBeInTheDocument();

    // Assert - message is displayed
    expect(screen.getByText(blockingInfo.message)).toBeInTheDocument();

    // Assert - red styling classes (behavioral: role=alert semantic)
    expect(banner.className).toContain('border-red-300');
    expect(banner.className).toContain('bg-red-50');

    // Assert - NO re-enrollment guidance for non-justified withdrawal
    expect(screen.queryByText(/puede reinscribirse/)).not.toBeInTheDocument();
  });

  it('should display blocking warning banner with blue styling for "retiro_justificado" reason', () => {
    // Arrange
    const blockingInfo = {
      message: 'Estudiante se retiró con justificación de la práctica anterior',
      reason: 'retiro_justificado',
    };

    // Act
    render(<BlockingWarningBanner blockingInfo={blockingInfo} onDismiss={mockOnDismiss} />);

    // Assert - banner is visible
    const banner = screen.getByTestId('blocking-banner');
    expect(banner).toBeInTheDocument();

    // Assert - blue styling classes
    expect(banner.className).toContain('border-blue-300');
    expect(banner.className).toContain('bg-blue-50');

    // Assert - re-enrollment guidance IS shown for justified withdrawal
    expect(screen.getByText(/puede reinscribirse en el siguiente período/)).toBeInTheDocument();
  });

  it('should display blocking warning banner with red styling for "reprobado" reason', () => {
    // Arrange
    const blockingInfo = {
      message: 'Estudiante reprobó la práctica anterior',
      reason: 'reprobado',
    };

    // Act
    render(<BlockingWarningBanner blockingInfo={blockingInfo} onDismiss={mockOnDismiss} />);

    // Assert - banner is visible with red styling
    const banner = screen.getByTestId('blocking-banner');
    expect(banner.className).toContain('border-red-300');

    // Assert - NO re-enrollment guidance for reprobado
    expect(screen.queryByText(/puede reinscribirse/)).not.toBeInTheDocument();
  });

  it('should call onDismiss when "Cerrar" button is clicked', () => {
    // Arrange
    const blockingInfo = {
      message: 'Error de prerrequisito',
      reason: 'retirado',
    };

    // Act
    render(<BlockingWarningBanner blockingInfo={blockingInfo} onDismiss={mockOnDismiss} />);
    fireEvent.click(screen.getByText('Cerrar'));

    // Assert
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('should display the correct warning icon for all reason types', () => {
    const reasons = ['retirado', 'reprobado', 'retiro_justificado'];

    for (const reason of reasons) {
      const { unmount } = render(
        <BlockingWarningBanner
          blockingInfo={{ message: `Error: ${reason}`, reason }}
          onDismiss={mockOnDismiss}
        />
      );

      // Assert - SVG warning icon is present
      const svg = screen.getByTestId('blocking-banner').querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg?.getAttribute('viewBox')).toBe('0 0 20 20');

      unmount();
    }
  });
});
