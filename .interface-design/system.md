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