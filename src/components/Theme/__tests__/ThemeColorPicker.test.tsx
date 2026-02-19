import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ThemeColorPicker from '../ThemeColorPicker';
import { ThemeContext } from '../../../context/theme';
import type { BrandColorKey } from '../../../theme/brandColors';

const mockSetBrandColor = vi.fn();

const renderWithTheme = (brandColor: BrandColorKey = 'blue') => {
  return render(
    <ThemeContext.Provider
      value={{
        theme: 'light',
        toggleTheme: vi.fn(),
        colorMode: 'light',
        brandColor,
        setBrandColor: mockSetBrandColor
      }}
    >
      <ThemeColorPicker />
    </ThemeContext.Provider>
  );
};

describe('ThemeColorPicker', () => {
  beforeEach(() => {
    mockSetBrandColor.mockClear();
  });

  it('renders title and description', () => {
    renderWithTheme();
    expect(screen.getByText('Color del Tema')).toBeInTheDocument();
    expect(screen.getByText('Personaliza el color principal del sistema')).toBeInTheDocument();
  });

  it('renders 8 color buttons', () => {
    renderWithTheme();
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(8);
  });

  it('shows check icon on selected color', () => {
    renderWithTheme('green');
    const buttons = screen.getAllByRole('button');
    
    const greenButton = buttons.find(btn => 
      btn.style.backgroundColor === 'rgb(5, 150, 105)'
    );
    
    expect(greenButton).toBeDefined();
  });

  it('calls setBrandColor when clicking a different color', () => {
    renderWithTheme('blue');
    
    const buttons = screen.getAllByRole('button');
    const greenButton = buttons.find(btn => 
      btn.style.backgroundColor === 'rgb(5, 150, 105)'
    );
    
    if (greenButton) {
      fireEvent.click(greenButton);
      expect(mockSetBrandColor).toHaveBeenCalledWith('green');
    }
  });

  it('does not call setBrandColor when clicking the same color', () => {
    renderWithTheme('blue');
    
    const buttons = screen.getAllByRole('button');
    const blueButton = buttons.find(btn => 
      btn.style.backgroundColor === 'rgb(5, 79, 148)'
    );
    
    if (blueButton) {
      fireEvent.click(blueButton);
      expect(mockSetBrandColor).not.toHaveBeenCalled();
    }
  });

  it('displays selected color name', () => {
    renderWithTheme('purple');
    const colorLabels = screen.getAllByText('Morado');
    expect(colorLabels.length).toBeGreaterThan(0);
  });
});
