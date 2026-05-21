# Interface Design System - UNEFA Dashboard

## Direction & Feel
- **Enfoque**: Admin dashboard académico profesional
- **Tono**: Clean, semántico, orientado a la jerarquía de información
- **Dark mode**: Soportado con inversión apropiada de valores

## Depth Strategy
- **Método**: Bordes sutiles + surface color shifts
- **Borders**: Usar con opacidad reducida para que desaparezcan al no buscarlos
- **Elevación**: Backgrounds progresivamente más claros en dark mode
- **Sombras**: Solo en elementos elevados (modals, dropdowns)

## Spacing Base
- **Unidad**: 4px ( Tailwind default)
- **Micro** (dentro de componentes): 1-2 (4-8px)
- **Component** (dentro de cards): 3-4 (12-16px)
- **Section** (entre grupos): 6-8 (24-32px)

## Notification Patterns

### NotificationDropdown - Bandeja de Notificaciones
- **Ancho**: w-96 (384px)
- **Max-height**: max-h-[480px]
- **Estructura**: Header → Lista(scrollable) → Footer
- **Header**: Icono + título + badge unread + botón "todo leído" + cerrar
- **Footer**: Link a página de todas con icono

### NotificationItem - Item Individual
- **Layout**: Icono(40px,rounded-xl) | Contenido(título+badge+mensaje+timestamp)
- **Badge tipos**: px-2 py-0.5 rounded-md text-[10px] font-medium
- **Unread**: bg-brand-50/50 + punto azul discreto
- **Hover**: bg-bg-secondary/50 + botón eliminar visible
- **Eliminar**: opacity-0 group-hover:opacity-100, position absolute

### Semantic Colors - Tipos de Notificación
```
pre_enrollment: bg-blue-100/30, text-blue-700/400, label: Pre-inscripción
enrollment: bg-green-100/30, text-green-700/400, label: Inscripción
tracking: bg-purple-100/30, text-purple-700/400, label: Pasantía
tracking_visit: bg-violet-100/30, text-violet-700/400, label: Visita
user_management: bg-orange-100/30, text-orange-700/400, label: Usuario
reminder: bg-amber-100/30, text-amber-700/400, label: Recordatorio
system: bg-gray-100/80, text-gray-700/400, label: Sistema
approval: bg-emerald-100/30, text-emerald-700/400, label: Aprobación
```

## Empty States Pattern
- Contenedor centrado con icono
- Mensaje principal (text-sm font-medium)
- Mensaje secundario descriptivo (text-xs text-text-tertiary)

## Loading States Pattern
- Spinner animado: border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin
- Mensaje debajo del spinner

## Component Patterns

### Badge/Unread Count
- px-2 py-0.5 text-xs font-medium rounded-full
-bg-brand-500 text-white (para counts)
- Variante inline para badges de tipo

### Icon Containers
- Tamaño: w-10 h-10 (40px) o w-14 h-14 (56px)
- Border-radius: rounded-xl para moderno, rounded-full para clásicos
--bg-{color}-100 dark:bg-{color}-900/30

### Dividers
- divide-y divide-border-light dark:divide-border-dark en listas
- border-t en secciones separadas

## Modal Patterns

### Modal Base
- **Container**: `rounded-2xl max-h-[95vh] bg-white dark:bg-bg-dark shadow-2xl`
- **Backdrop**: `bg-black/60 backdrop-blur-[2px]`
- **Animation**: `animate-in fade-in zoom-in-95 duration-300`
- **Close button**: `absolute top-4 right-4 p-2 rounded-full text-text-secondary hover:bg-bg-secondary`

### View Modal (read-only details)
Usado en: StudentViewModal, TutorViewModal, EnrollmentViewModal, TrackingDetailModal

- **Header title**: `shrink-0 pt-8 px-6 sm:px-12` con `text-xl font-bold`
- **Body**: `overflow-y-auto custom-scrollbar grow px-6 sm:px-12 py-8`
- **Wrapper interno**: `space-y-10 max-w-5xl mx-auto py-2`
- **Section header**: Usar `<ModalSectionHeader>` con color bullet
- **Content grid**: `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4`
- **Labels**: `text-[10px] font-bold text-text-tertiary uppercase tracking-widest`
- **Values**: `text-sm font-semibold text-text-primary dark:text-white/90`
- **Valor destacado (cédula)**: `text-sm font-bold text-blue-600 dark:text-blue-400`
- **Status box**: `rounded-xl bg-bg-secondary dark:bg-white/3 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4`
- **Footer buttons**: `flex-1 sm:flex-none` (outline + async)

#### Sección de Visitas (tabla interna)
- **Header celdas**: `text-[10px] font-bold text-text-tertiary uppercase tracking-widest`
- **Filas**: `divide-y divide-border-light dark:divide-white/5`
- **Hover fila**: `hover:bg-bg-secondary/50 transition-colors`
- **Datos**: `text-xs font-medium text-text-primary`

### Create/Edit Modal (formularios)
Usado en: TrackingModal, VisitModal, PeriodModal, CareerModal, etc.

- **Header**: Mismo padding que View Modal: `shrink-0 pt-8 px-6 sm:px-12`
- **Título**: "Nuevo [Feature]" o "Editar [Feature]" (nunca "Detalles de...")
- **Form field labels**: `text-sm font-medium text-text-primary dark:text-white/90`
- **Input wrapper**: `flex flex-col gap-1`
- **Error text**: `text-xs text-error-500`
- **Section header (cuando aplica)**: Usar `<ModalSectionHeader>`
- **Footer**: `justify-end gap-3 w-full` con outline Cancelar + AsyncButton acción

### Modal Footer standard
- **Layout**: `flex justify-end gap-3 w-full` (simple) o `flex flex-col sm:flex-row items-center justify-end gap-3 w-full max-w-4xl mx-auto` (centered desktop)
- **Botones**: 
  - Cancelar: `variant="outline"`
  - Acción: AsyncButton `type="submit"`
  - Responsive: `flex-1 sm:flex-none` o `w-full sm:w-auto min-h-12`

### Section Header (ModalSectionHeader)
Componente: `src/components/ui/modal/ModalSectionHeader.tsx`

```tsx
<ModalSectionHeader color="blue-500">Título Sección</ModalSectionHeader>
```

Estructura:
- Bullet colored: `h-2 w-2 rounded-full bg-{color}-500`
- Border bottom: `border-b border-border-light pb-2 dark:border-white/5`
- Title: `font-bold text-text-primary dark:text-white/90 uppercase text-xs tracking-wider`

Colores disponibles: blue-500, brand-500, purple-500, emerald-500, amber-500, rose-500, indigo-500, teal-500