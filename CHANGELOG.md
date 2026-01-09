# CHANGELOG - Sistema de Guía de Colores Unificado

## [1.0.0] - 2026-01-09

### Añadido
- Sistema de variables semánticas CSS en `src/index.css`.
- Sistema de variables semánticas SASS en `src/styles/_colors.scss`.
- Definición de paleta de colores jerárquica en `src/styles/palette.json`.
- Estilos de componentes estándar en `src/styles/components.scss`.
- Guía técnica de especificaciones en `technical-specs.md`.
- Guía de estándares UX en `ux-standards.md`.
- Suite de pruebas de contraste y consistencia en `src/styles/ColorPalette.test.ts`.
- Componente de demostración de paleta de colores en `src/components/ColorPaletteDemo.tsx`.

### Modificado
- `src/components/ui/button/Button.tsx`: Actualizado para usar variables semánticas en todas las variantes y estados.
- `src/components/ui/alert/Alert.tsx`: Actualizado para usar el nuevo sistema de alertas de 4 colores con iconos.
- `src/components/form/input/InputField.tsx`: Estandarizado con bordes de 1px, fondo claro y contraste de texto 7:1.
- `src/pages/Students/students.tsx`: Unificado el uso de colores en banners de alerta y pestañas.
- `src/components/ecommerce/EcommerceMetrics.tsx`: Estandarizadas las tarjetas de métricas con variables semánticas.
- `src/components/tables/BasicTables/BasicTableOne.tsx`: Corregidos colores de error y estados de tabla.
- `src/components/auth/SignInForm.tsx`: Unificados colores de fondo, texto y botones sociales.
- `src/components/auth/SignUpForm.tsx`: Unificados colores de fondo, texto y botones sociales.

### Corregido
- Eliminadas transparencias inconsistentes en `PreEnrollmentTable.tsx` y `EnrollmentTable.tsx`.
- Resueltas inconsistencias de contraste en textos secundarios (ahora cumplen WCAG AA/AAA).
- Unificados estados hover/active en todos los componentes interactivos.
