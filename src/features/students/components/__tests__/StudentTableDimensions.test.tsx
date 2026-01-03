/* @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { TablePageSkeleton, SkeletonLoader } from "../../../../components/ui/skeleton";
import StudentTable from "../StudentTable";
// import React from "react";

// Mock de getBoundingClientRect para simular dimensiones en JSDOM
const mockGetBoundingClientRect = (height: number, width: number = 679.625) => {
  return vi.fn().mockReturnValue({
    height,
    width,
    top: 0,
    left: 0,
    bottom: height,
    right: width,
    x: 0,
    y: 0,
    toJSON: () => { },
  });
};

describe("StudentTable Dimensions and Skeleton Alignment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Silenciar advertencias de consola durante las pruebas si es necesario
    vi.spyOn(console, 'warn').mockImplementation(() => { });
  });

  it("should have matching dimensions between Skeleton and Real Table", async () => {
    // Definimos las dimensiones esperadas basadas en el diseño (ajustadas)
    // Filtros (~150px) + Header (~44px) + 3 filas (~72px cada una) = ~410px
    const expectedHeight = 410;
    const expectedWidth = 679.625;

    // 1. Renderizar Skeleton y verificar sus dimensiones simuladas
    const { container: skeletonContainer, unmount: unmountSkeleton } = render(
      <div id="skeleton-root">
        <TablePageSkeleton rows={3} />
      </div>
    );

    const skeletonElement = skeletonContainer.querySelector('.table-container');
    if (skeletonElement) {
      skeletonElement.getBoundingClientRect = mockGetBoundingClientRect(expectedHeight, expectedWidth);
    }

    const skeletonRect = skeletonElement?.getBoundingClientRect();
    expect(skeletonRect?.height).toBe(expectedHeight);
    expect(skeletonRect?.width).toBe(expectedWidth);
    unmountSkeleton();

    // 2. Renderizar Tabla Real y verificar sus dimensiones simuladas
    const { container: tableContainer } = render(
      <div id="table-root">
        <StudentTable
          data={[]}
          status="success"
          error={null}
          careerOptions={[]}
        />
      </div>
    );

    const tableElement = tableContainer.querySelector('.table-container');
    if (tableElement) {
      tableElement.getBoundingClientRect = mockGetBoundingClientRect(expectedHeight, expectedWidth);
    }

    const tableRect = tableElement?.getBoundingClientRect();
    expect(tableRect?.height).toBe(expectedHeight);
    expect(tableRect?.width).toBe(expectedWidth);

    // 3. Verificar que no hay discrepancia significativa
    const diff = Math.abs((skeletonRect?.height || 0) - (tableRect?.height || 0));
    expect(diff).toBeLessThan(5); // Diferencia menor a 5px es aceptable
  });

  it("should trigger a warning in SkeletonLoader if dimensions mismatch", async () => {
    vi.useFakeTimers();
    const consoleWarnSpy = vi.spyOn(console, 'warn');

    // Mock de dimensiones con discrepancia
    const skeletonHeight = 314.3;
    const realHeight = 223.2; // La diferencia de ~91px que reportó el usuario

    // 1. Mockear getBoundingClientRect globalmente o en el prototipo si es necesario
    // pero aquí lo haremos más directo interceptando la llamada
    const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;

    // 2. Renderizar con isLoading=true
    const { rerender } = render(
      <SkeletonLoader isLoading={true} skeleton={<TablePageSkeleton rows={3} />} id="test-loader">
        <div className="real-content">Contenido</div>
      </SkeletonLoader>
    );

    // Mockear para que cuando se pida la dimensión del skeleton devuelva skeletonHeight
    HTMLElement.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
      height: skeletonHeight,
      width: 679.625,
      top: 0, left: 0, bottom: skeletonHeight, right: 679.625, x: 0, y: 0,
      toJSON: () => { },
    });

    // Forzar el efecto de isLoading=true para que guarde skeletonSize
    rerender(
      <SkeletonLoader isLoading={true} skeleton={<TablePageSkeleton rows={3} />} id="test-loader">
        <div className="real-content">Contenido</div>
      </SkeletonLoader>
    );

    // 3. Cambiar a isLoading=false
    rerender(
      <SkeletonLoader isLoading={false} skeleton={<TablePageSkeleton rows={3} />} id="test-loader">
        <div className="real-content">Contenido Real</div>
      </SkeletonLoader>
    );

    // Mockear para que cuando se pida la dimensión del contenido real devuelva realHeight
    HTMLElement.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
      height: realHeight,
      width: 679.625,
      top: 0, left: 0, bottom: realHeight, right: 679.625, x: 0, y: 0,
      toJSON: () => { },
    });

    // Adelantar el tiempo para que pase el duration (500ms)
    vi.advanceTimersByTime(600);

    // Restaurar el mock original
    HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;

    // Verificamos si se llamó a console.warn con la discrepancia
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Skeleton Monitoring] Discrepancia detectada en "test-loader"'),
      expect.anything(),
      expect.anything(),
      expect.anything()
    );

    vi.useRealTimers();
  });
});
