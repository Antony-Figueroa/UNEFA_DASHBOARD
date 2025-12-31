# Cambios de UI y Diseño

## Menú de acciones (Dropdown)
- Nuevo componente `DropdownPortal` que renderiza el menú mediante portal en `document.body`.
- Posicionamiento absoluto respecto al botón disparador para evitar clipping por `overflow`.
- `z-index` elevado (`50`) acorde al sistema de capas existente.
- Accesibilidad: `role="menu"`, cierre con `Escape`, click fuera.

## Formateo de fechas
- Util de fechas `src/utils/date.ts` con `formatDate(value, locale, options)`.
- Maneja `Date`, `string`, `number`, devolviendo `-` ante valores inválidos.
- Usado en `Careers` para evitar "invalid date".

## Filtros de tabla (Carreras)
- Se reemplaza filtro por estado con filtro por Tipo de Práctica: `Hospitalaria`, `Comunitaria`, `Ordinaria`.
- Se elimina la columna de `Estado` en la tabla.

## Navegación
- Se añade entrada de menú "Gestión Carrera" con `TaskIcon` en el sidebar.

## Modal de creación de carrera
- Estructura visual alineada al `PeriodModal` con bloque de "Detalles de la Carrera".
- Validaciones básicas y deshabilitado de botón Guardar cuando no son válidas.
- Reseteo de estado al cerrar para evitar fugas entre aperturas.

## Pruebas
- Prueba unitaria de `formatDate` con `vitest` en `src/utils/__tests__/date.test.ts`.

## Responsividad y Accesibilidad
- Controles mantienen clases responsivas (`grid`, `md:grid-cols-2`, etc.).
- Atributos `aria-label` y `aria-expanded` en controles interactivos.

