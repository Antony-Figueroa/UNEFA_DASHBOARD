# Documentación Exhaustiva: Módulo de Estudiantes

Esta documentación describe la implementación técnica del módulo de Estudiantes en el proyecto TailAdmin, detallando su arquitectura, funcionalidades, componentes y flujos de datos.

---

## 1. Estructura de Archivos y Jerarquía de Componentes

El módulo sigue una arquitectura basada en **features**, separando la lógica de negocio de la presentación.

### **Estructura de Directorios**
- `src/features/students/`: Núcleo del módulo.
  - `components/`: Componentes específicos del módulo.
    - `StudentTable.tsx`: Visualización de datos y acciones.
    - `StudentModal.tsx`: Formulario de creación y edición.
  - `hooks/`: Lógica de estado y efectos.
    - `useStudents.tsx`: Hook principal para operaciones CRUD.
  - `types/`: Definiciones de interfaces TypeScript.
    - `index.tsx`: Interfaces `Student` y `StudentRowData`.
- `src/pages/Students/`: Punto de entrada de la vista.
  - `students.tsx`: Orquestador de la página.

### **Jerarquía de Componentes**
```text
StudentsPage (Orquestador)
├── PageBreadcrumb
├── PageMeta
├── ComponentCard
│   └── StudentTable (Presentación de Datos)
│       ├── Checkbox
│       ├── Badge
│       ├── Pagination
│       └── DropdownPortal (Acciones)
├── StudentModal (Formulario)
│   ├── Input
│   ├── Select
│   └── FlatpickrDatePicker
└── Modal (Confirmaciones y Detalles)
```

---

## 2. Vistas, Navegación y Parámetros

### **Vistas Principales**
- **Listado General**: Tabla con pestañas para "Activos" e "Inactivos".
- **Detalle de Estudiante**: Modal de pantalla completa con vista desglosada de información personal y académica.

### **Navegación**
- **Ruta**: `/students` (Definida en `App.tsx`).
- **Acceso**: Sidebar -> Sección "Registro" -> "Estudiante".
- **Breadcrumbs**: Implementados dinámicamente mediante el componente `PageBreadcrumb`.

---

## 3. Funcionalidades y Lógica de Negocio

### **Operaciones CRUD (Simuladas)**
- **Create**: A través de `StudentModal`, genera un ID único y fecha de inscripción automática.
- **Read**: Listado filtrable y ordenable gestionado localmente en `useStudents`.
- **Update**: Edición de campos existentes manteniendo el estado original si no hay cambios.
- **Delete/Restore**: Cambio lógico de estado (`status: true/false`) en lugar de eliminación física.

### **Filtros y Búsqueda**
- **Búsqueda**: Por Cédula, Nombres y Apellidos con **Debouncing** (300ms) para optimizar el rendimiento.
- **Filtrado**: Por Carrera académica.
- **Paginación**: Configurable (defecto 5 items por página).

---

## 4. Componentes de UI y Reutilización

El módulo reutiliza componentes atómicos del sistema:
- **`Table`**: Sistema de tablas responsivas con `TableHeader`, `TableBody`, `TableRow` y `TableCell`.
- **`Button`**: Componente de botón con variantes de estilo y soporte para iconos.
- **`Badge`**: Etiquetas para visualización de Sexo, Carrera y Estados.
- **`SkeletonLoader`**: Marcadores de posición durante la carga inicial.

---

## 5. Estilos y Diseño

### **Tecnología: Tailwind CSS v4**
- **Layout**: Uso intensivo de Flexbox y CSS Grid para responsividad.
- **Tematización**: Soporte nativo para Modo Claro y Oscuro mediante clases `dark:`.
- **Animaciones**: Transiciones suaves y animaciones de entrada (`animate-fadeIn`, `animate-slideDown`).

### **Responsividad**
- **Escritorio**: Tabla completa con múltiples columnas y acciones en dropdown.
- **Móvil**: Conversión automática a vista de tarjetas (Cards) con expansión de detalles al hacer clic.

---

## 6. Validaciones y Manejo de Errores

### **Tecnologías: Zod + React Hook Form**
- **Esquema de Validación (`studentSchema`)**:
  - Campos obligatorios (Cédula, Nombres, Apellidos, etc.).
  - Regex para asegurar que solo se ingresen números en IDs o letras en nombres.
  - Validación de formato de Email.
- **Feedback al Usuario**: Mensajes de error en tiempo real debajo de cada campo y prevención de envío si el formulario es inválido.

---

## 7. Dependencias y Librerías Externas

- **`react-router`**: Gestión de rutas y navegación.
- **`zod`**: Validación de esquemas de datos.
- **`react-hook-form`**: Manejo eficiente de formularios.
- **`@hookform/resolvers`**: Integración entre Hook Form y Zod.
- **`flatpickr`**: Selector de fechas robusto y personalizable.
- **`lucide-react`**: (O similar) Biblioteca de iconos consistente.

---

## 8. Flujos de Datos y Comunicación

### **Flujo de Registro**
1. El usuario abre `StudentModal`.
2. Se ingresan los datos y se validan mediante Zod.
3. Al enviar, se llama a `addStudent` del hook `useStudents`.
4. El hook añade el nuevo registro al estado local `students`.
5. Se muestra un `Toast` de éxito con opción de "Deshacer".

### **Sincronización de Estado**
- El hook `useStudents` actúa como un **Store local** (Modo Demo), manteniendo la persistencia durante la sesión actual de la aplicación.
- No hay llamadas a API externas en la implementación actual, facilitando la demostración y pruebas de UI.
