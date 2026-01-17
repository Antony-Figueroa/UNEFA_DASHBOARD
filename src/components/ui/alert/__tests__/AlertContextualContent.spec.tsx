import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChangeComparison } from '../AlertContextualContent';

describe('ChangeComparison component', () => {
  it('debe excluir periodStatus de la visualización', () => {
    const oldData = {
      description: '2025-I',
      periodStatus: 1,
      otherField: 'old value'
    };
    
    const newData = {
      description: '2025-I',
      periodStatus: 2,
      otherField: 'new value'
    };

    const labels = {
      description: 'Descripción',
      periodStatus: 'Estado del Período',
      otherField: 'Otro Campo'
    };

    render(
      <ChangeComparison 
        oldData={oldData} 
        newData={newData} 
        labels={labels} 
      />
    );

    // Debe mostrar el cambio en otherField
    expect(screen.getByText(/Otro Campo:/i)).toBeDefined();
    expect(screen.getByText(/old value/i)).toBeDefined();
    expect(screen.getByText(/new value/i)).toBeDefined();

    // NO debe mostrar el cambio en periodStatus
    const statusLabel = screen.queryByText(/Estado del Período:/i);
    expect(statusLabel).toBeNull();
    
    const statusValue1 = screen.queryByText('1');
    const statusValue2 = screen.queryByText('2');
    expect(statusValue1).toBeNull();
    expect(statusValue2).toBeNull();
  });

  it('debe mostrar otros cambios normalmente', () => {
    const oldData = { description: 'Old Desc' };
    const newData = { description: 'New Desc' };
    const labels = { description: 'Descripción' };

    render(<ChangeComparison oldData={oldData} newData={newData} labels={labels} />);

    expect(screen.getByText(/Descripción:/i)).toBeDefined();
    expect(screen.getByText(/Old Desc/i)).toBeDefined();
    expect(screen.getByText(/New Desc/i)).toBeDefined();
  });
});
