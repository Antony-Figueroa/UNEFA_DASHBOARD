# Documentación Exhaustiva: Módulo de Tutores

Esta documentación describe la implementación técnica del módulo de Tutores en el sistema TailAdmin. Este módulo ha sido diseñado replicando la arquitectura y patrones del módulo de Estudiantes, asegurando coherencia visual y funcional.

## 1. Estructura de Archivos y Jerarquía de Componentes

El módulo sigue una arquitectura basada en características (feature-based):

- **Types**: `src/features/tutors/types/index.tsx` - Definición de interfaces y tipos de datos.
- **Hooks**: `src/features/tutors/hooks/useTutors.tsx` - Lógica de estado y operaciones CRUD (simuladas).
- **Components**:
    - `TutorTable.tsx`: Tabla de visualización con filtrado, ordenamiento y paginación.
    - `TutorModal.tsx`: Formulario de registro y edición estructurado en 4 filas.
- **Page**: `src/pages/Tutors/tutors.tsx` - Orquestador principal de la vista.

## 2. Vistas, Navegación y Parámetros

### Vistas Principales
- **Listado de Tutores**: Visualización tabular de tutores activos e inactivos mediante pestañas.
- **Detalle de Tutor**: Modal de pantalla completa para visualización de todos los campos.
- **Formulario (Crear/Editar)**: Modal emergente para la gestión de datos.

### Navegación
- Ruta: `/tutors`
- Integrado en `AppSidebar.tsx` bajo la sección "Tutor".
- Definido en `App.tsx` dentro del layout protegido `AppLayout`.

## 3. Funcionalidades y Lógica de Negocio

### Operaciones CRUD (Modo Demo)
El módulo opera actualmente en modo demostración, utilizando un estado local inicializado con datos de prueba:
- **Lectura**: Recuperación de datos desde el estado local gestionado por el hook `useTutors`.
- **Creación**: Adición de nuevos registros con generación automática de IDs y fechas.
- **Actualización**: Modificación de registros existentes manteniendo la integridad del ID.
- **Eliminación Lógica**: Cambio de estado `status` de `true` (activo) a `false` (inactivo/papelera).
- **Acciones Masivas**: Soporte para eliminación y restauración de múltiples registros simultáneamente.

### Filtrado y Ordenamiento
- **Debounce**: Implementado para búsquedas por Cédula, Nombre y Apellido para optimizar el rendimiento.
- **Filtrado por Profesión**: Selector desplegable integrado en la tabla.
- **Ordenamiento Dinámico**: Permite ordenar por múltiples columnas (Cédula, Nombres, Email, Profesión, Fecha).

## 4. Componentes de UI y Reutilización

Se utilizan componentes base del sistema para mantener la consistencia:
- `Table`, `TableHeader`, `TableBody`, `TableCell`: Componentes de bajo nivel para la estructura tabular.
- `Modal`, `ModalHeader`, `ModalBody`, `ModalFooter`: Para diálogos y vistas de detalle.
- `Button`, `Checkbox`, `Input`, `Select`: Elementos de formulario estandarizados.
- `SkeletonLoader`: Para estados de carga inicial.
- `Badge`: Para etiquetas visuales de profesión y estado.

## 5. Estilos y Diseño

- **Framework**: Tailwind CSS.
- **Responsive Design**: 
    - Vista de escritorio: Tabla completa con todas las columnas.
    - Vista móvil: Tarjetas (cards) individuales con funcionalidad de expansión para detalles.
- **Animaciones**: Uso de clases `animate-fadeIn` y transiciones suaves en botones y pestañas.
- **Modo Oscuro**: Soporte completo mediante clases `dark:` de Tailwind.

## 6. Validaciones y Manejo de Errores

### Validación de Formularios
Se utiliza **Zod** para la definición del esquema y validación estricta en `TutorModal.tsx`:
- **Cédula**: Obligatoria, solo números.
- **Nombres/Apellidos**: Obligatorios, solo letras.
- **Email**: Formato de correo válido.
- **Teléfono**: Obligatorio.
- **Campos Profesionales**: Selección obligatoria.

### Manejo de Errores
- Feedback visual instantáneo en campos inválidos mediante `react-hook-form`.
- Estados de error global en la tabla para fallos en la carga de datos.

## 7. Dependencias y Librerías Externas

- **React**: Biblioteca principal de UI.
- **React Hook Form**: Gestión eficiente de formularios.
- **Zod**: Validación de esquemas de datos.
- **Lucide React (Iconos)**: Iconografía consistente.
- **React Router Dom**: Gestión de rutas.

## 8. Flujos de Datos y Comunicación

1. **Página (`tutors.tsx`)**: Mantiene el estado de pestañas y modales activos.
2. **Hook (`useTutors.tsx`)**: Provee los datos y las funciones de mutación.
3. **Componentes (`TutorTable`, `TutorModal`)**: Reciben datos por props y emiten eventos (`onSave`, `onEdit`, etc.) hacia el orquestador.
4. **Utilidades (`date.ts`)**: Formateo de fechas para la capa de presentación.
