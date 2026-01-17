# Documentación Técnica: Gestión de Periodos Académicos

Este documento proporciona una descripción detallada de la implementación técnica de la página de gestión de Periodos Académicos en el sistema UNEFA Dashboard.

## 1. Estructura de la Página

### Jerarquía de Componentes
La página está estructurada siguiendo un patrón de contenedor-contenido, donde el componente principal orquesta los estados y los componentes especializados manejan la visualización y entrada de datos.

- **Period** (Página Principal - [period.tsx](file:///c:/xampp/htdocs/workspace/UNEFA_DASHBOARD/src/pages/Period/period.tsx))
    - `ErrorBoundary`: Captura errores en la jerarquía.
    - `PageMeta`: Gestiona metadatos SEO/título.
    - `SkeletonLoader`: Muestra estados de carga para breadcrumbs y títulos.
    - `ComponentCard`: Contenedor visual para la tabla y pestañas.
        - **Tabs**: Alterna entre periodos 'Activos' e 'Inactivos'.
        - `PeriodTable`: Visualización de datos en formato tabla.
    - `PeriodModal`: Formulario de creación/edición.
        - `FlatpickrDatePicker`: Selector de fechas personalizado.
        - `UnifiedDialog`: Confirmación de cambios no guardados.
    - `PeriodViewModal`: Vista de solo lectura de detalles.
    - `UnifiedDialog`: Confirmaciones globales para acciones (Activar, Culminar, Eliminar).
    - `FullScreenLoader`: Overlay de carga para acciones asíncronas.

### Relación entre Archivos
- **Lógica de Estado**: [usePeriods.tsx](file:///c:/xampp/htdocs/workspace/UNEFA_DASHBOARD/src/features/periods/hooks/usePeriods.tsx) encapsula la lógica de negocio y llamadas a API.
- **Servicios**: [periodService.tsx](file:///c:/xampp/htdocs/workspace/UNEFA_DASHBOARD/src/features/periods/services/periodService.tsx) gestiona la comunicación con el backend (Supabase/Postgres).
- **Validaciones**: [periodValidations.ts](file:///c:/xampp/htdocs/workspace/UNEFA_DASHBOARD/src/features/periods/utils/periodValidations.ts) centraliza las reglas de negocio y esquemas Zod.
- **Tipos**: [index.tsx](file:///c:/xampp/htdocs/workspace/UNEFA_DASHBOARD/src/features/periods/types/index.tsx) define las interfaces `Periodo` y `PeriodoRowData`.

### Dependencias
- **Externas**:
    - `react-hook-form` & `@hookform/resolvers/zod`: Gestión de formularios y validación.
    - `zod`: Esquemas de validación de datos.
    - `react-flatpickr`: Selector de fechas interactivo.
    - `lucide-react`: Iconografía.
- **Internas**:
    - Componentes UI reutilizables: `Button`, `Modal`, `UnifiedDialog`, `Alert`, `SkeletonLoader`.

---

## 2. Contenido Funcional

### Descripción de Secciones
1. **Encabezado**: Título dinámico y botón "Nuevo Periodo".
2. **Pestañas de Estado**: Filtra los periodos según su visibilidad (activos/inactivos).
3. **Tabla de Periodos**: Muestra descripción, fechas, estado (Pendiente, En Curso, Culminado) y progreso calculado.
4. **Modales de Gestión**: Formularios emergentes para interactuar con los datos sin salir de la página.

### Flujos de Usuario Principales
- **Registro de Periodo**:
    - El sistema autocompleta el año y tipo basándose en el último periodo registrado.
    - Se sugiere una fecha de inicio (día después del fin del anterior) y una fecha de fin (16 semanas después).
- **Activación de Periodo**:
    - Solo se permite un periodo "En Curso" simultáneamente.
    - La activación habilita el seguimiento de progreso.
- **Culminación de Periodo**:
    - Cambia el estado a "Culminado" (3), volviendo el registro de solo lectura.

### Requisitos de Contenido
- **Dinámico**: El progreso se calcula en tiempo real comparando la fecha actual con el rango `[startDate, endDate]`.
- **Estático**: Catálogo de tipos de periodo ('I', 'II').

---

## 3. Validaciones Implementadas (Sección Crítica)

> **Nota Importante**: Esta sección debe revisarse periódicamente para reflejar el estado actual en [periodValidations.ts](file:///c:/xampp/htdocs/workspace/UNEFA_DASHBOARD/src/features/periods/utils/periodValidations.ts).

### Validación en Tiempo Real
El sistema utiliza `react-hook-form` con el modo `mode: 'onChange'`, lo que permite que todas las validaciones (tanto estructurales como de negocio) se ejecuten y muestren mensajes de error instantáneamente mientras el usuario interactúa con los campos.

### Esquema de Validación Dinámico
Implementado mediante la función `getPeriodSchema(existingPeriods, currentPeriodId, isEditing)`:

| Validación | Regla | Código Fuente | Mensaje de Error |
| :--- | :--- | :--- | :--- |
| **Año** | Obligatorio | `z.string().min(1)` | "El año es obligatorio." |
| **Orden de Fechas** | Fin > Inicio | `data.endDate <= data.startDate` | "La fecha de fin debe ser posterior a la de inicio." |
| **Duración Mínima** | Mínimo 16 semanas | `duration < minDuration` | "El período debe tener una duración mínima de 16 semanas." |
| **Año de Inicio** | Debe coincidir con Año seleccionado | `startYear !== yearNum` | "La fecha de inicio debe corresponder estrictamente al año seleccionado." |
| **Año de Fin (I)** | Periodo I debe terminar en mismo año | `endYear !== yearNum && tipo === 'I'` | "Para el período I, la fecha de fin debe corresponder al año seleccionado." |

### Reglas de Negocio (Integradas en el Esquema)
Todas las reglas de negocio complejas han sido integradas en el `superRefine` de Zod para permitir su validación en tiempo real:

1. **Formato de Lapso Académico**:
    - **Regla**: Debe seguir el formato `Lapso-Año` (ej: `I-2025`).
    - **Implementación**: El modal concatena automáticamente el tipo y el año seleccionado.

2. **Duración Mínima**:
    - **Regla**: Mínimo de 16 semanas entre la fecha de inicio y fin.
    - **Mensaje**: "El período debe tener una duración mínima de 16 semanas."

3. **Fecha de Inicio Futura**:
    - **Regla**: El periodo no puede empezar en una fecha que ya pasó (solo aplica para registros nuevos).
    - **Mensaje**: "La fecha de inicio no puede ser una fecha pasada."

4. **No Superposición (Solapamiento)**:
    - **Regla**: Los periodos no pueden superponer sus fechas con otros existentes.
    - **Mensaje**: "El rango de fechas se solapa con un periodo existente."

5. **Orden Cronológico y Secuencialidad**:
    - **Regla**: Deben seguir el orden `I-AAAA` -> `II-AAAA` -> `I-(AAAA+1)`. No se pueden saltar lapsos.
    - **Mensaje**: "Secuencia incorrecta. El siguiente lapso obligatorio es XXXX-X."

6. **Unicidad Estricta**:
    - **Regla**: No pueden existir dos periodos con el mismo lapso (ej: no puede haber dos `I-2025`).
    - **Mensaje**: "El periodo X-XXXX ya existe en el sistema."

### Reglas de Gestión (Tabla y Edición)
1. **Periodos Culminados**: No se pueden editar ni eliminar.
2. **Periodos en Curso**: 
    - Solo se puede editar la **fecha de cierre**.
    - La fecha de inicio y el lapso quedan bloqueados.
    - Solo puede existir **un periodo en curso** a la vez en todo el sistema.
3. **Periodos Pendientes**: Permiten edición completa de todos sus campos.

3. **Restricciones de Estado** (UI Logic):
    - **En Curso**: Deshabilita la edición de Año, Tipo y Fecha de Inicio.
    - **Culminado**: Deshabilita toda edición (formulario bloqueado).
    - **Ubicación**: `PeriodModal.tsx:L225, L243, L270`.

---

## 4. Gestión de la Documentación

### Ubicación
El archivo de documentación se encuentra en: `src/pages/Period/DOCUMENTACION_TECNICA.md`.

### Proceso de Actualización
Cada vez que se modifique la lógica de validación en el código fuente:
1. Abrir [periodValidations.ts](file:///c:/xampp/htdocs/workspace/UNEFA_DASHBOARD/src/features/periods/utils/periodValidations.ts).
2. Identificar el cambio en el esquema `periodSchema` o funciones `checkOverlap`/`checkSequentiality`.
3. Actualizar la tabla de la **Sección 3** en este documento.

### Mecanismo de Verificación
Para asegurar que esta documentación refleja el código actual:
- Ejecutar los tests unitarios en [periodValidations.spec.ts](file:///c:/xampp/htdocs/workspace/UNEFA_DASHBOARD/src/features/periods/utils/__tests__/periodValidations.spec.ts).
- Si los tests pasan, los mensajes de error y las condiciones deberían coincidir con lo descrito aquí.
- Se recomienda el uso de herramientas de análisis estático para detectar discrepancias entre los esquemas de Zod y la documentación escrita.
