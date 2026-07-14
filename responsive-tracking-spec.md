# Responsive Review — Módulo de Seguimiento (Tracking)

> **Fecha**: 2026-07-14
> **Módulo priorizado**: Seguimiento (Tracking)
> **Próximos módulos**: Evaluación, Reportes

---

## 1. Objetivo

Revisar y corregir el diseño responsive del módulo de Seguimiento para que se vea correctamente en **todas las resoluciones**: desktop (1920px+), tablet (768-1024px) y mobile (< 768px).

---

## 2. Problemas identificados

| # | Problema | Componentes afectados |
|---|----------|----------------------|
| 1 | Tablas se desbordan en mobile | TrackingTable, VisitRegistration |
| 2 | Modales mal dimensionados en mobile | TrackingDetailModal, VisitRegistration (View Modal) |

---

## 3. Decisiones de diseño

| Decisión | Opción elegida |
|----------|---------------|
| **Tablas en mobile** | Scroll horizontal (`overflow-x-auto`). Mantener columnas, no convertir a cards. |
| **Modales en mobile** | Fullscreen (`max-w-full h-full`) en resoluciones < 768px. Sin bordes redondeados, ocupa toda la pantalla. |
| **Stats cards (VisitRegistration)** | 2 columnas en mobile (actualmente 4-5 columnas). |

---

## 4. Componentes a modificar

### 4.1 TrackingTable (`src/features/tracking/components/TrackingTable.tsx`)

**Estado actual:**
- Filtros en grid 1 columna mobile / 3 columnas desktop (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`)
- Tabla con `overflow-x-auto` y bordes redondeados
- Botones de acción en fila horizontal

**Cambios requeridos:**
- [ ] Verificar que los botones de acción (`ActionButtons`) no se salgan del contenedor en mobile
- [ ] Asegurar que el `Pagination` se vea bien apilado en mobile (actualmente está fuera del overflow container)
- [ ] Revisar que `CustomSelect` en filtros no se rompa en mobile
- [ ] Verificar que el `EmptyState` se centre correctamente

**Reglas responsive:**
```css
/* Filtros: mantener grid actual (1 col móvil, 3 col desktop) */
/* Botones: permitir wrap si es necesario */
/* Tabla: scroll horizontal siempre */
```

### 4.2 TrackingDetailModal (`src/features/tracking/components/TrackingDetailModal.tsx`)

**Estado actual:**
- Modal `size="5xl"` con mucho contenido interno
- Grid de 3 columnas para info del estudiante y seguimiento
- Tabla HTML nativa para visitas (no usa `Table` component)
- Sección `PracticeTimeline` al final

**Cambios requeridos:**
- [ ] En mobile (< 768px), el modal debe ser **fullscreen**:
  ```tsx
  // Modal pasa a ocupar toda la pantalla
  // Sin border-radius, sin padding externo
  // max-w-full, min-h-screen
  ```
- [ ] Grids internos (`grid-cols-1 sm:grid-cols-2 md:grid-cols-3`) — ok, pasar a 1 columna en mobile
- [ ] Sección de visitas: tabla nativa pasar a `overflow-x-auto`
- [ ] Badges de tutor: permitir wrap si el nombre es largo
- [ ] Estado y Fechas (card inferior): grid 1 col en mobile

**Reglas responsive para modales fullscreen:**
```css
/* Mobile (< 768px) */
.modal-fullscreen-mobile {
  max-width: 100% !important;
  width: 100% !important;
  height: 100% !important;
  min-height: 100vh;
  border-radius: 0 !important;
  margin: 0 !important;
}

/* El header debe ser sticky */
.modal-header-sticky {
  position: sticky;
  top: 0;
  z-index: 10;
}

/* El footer debe ser sticky al fondo */
.modal-footer-sticky {
  position: sticky;
  bottom: 0;
  z-index: 10;
}
```

### 4.3 VisitRegistration (`src/pages/Tracking/VisitRegistration.tsx`)

**Estado actual:**
- Stats cards: `grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4` — 5 cards
- Info de práctica: 5 cards con datos del estudiante/institución/tutores/horas
- Tabla de visitas con `overflow-x-auto`
- Modal de detalle de visita (size 5xl)
- Modal de creación/edición (VisitModal)

**Cambios requeridos:**
- [ ] **Stats cards de práctica**: reducir de 5 columnas a **2 columnas en mobile**:
  ```tsx
  // Actual: grid-cols-1 md:grid-cols-2 lg:grid-cols-5
  // Propuesto: grid-cols-2 sm:grid-cols-3 lg:grid-cols-5
  ```
- [ ] Stats de visitas (Total, Horas, Tipos): mantener grid actual `grid-cols-1 md:grid-cols-3`
- [ ] Modal de detalle de visita: **fullscreen en mobile** (misma regla que TrackingDetailModal)
- [ ] Botón "Nueva Visita": verificar que no se desborde en mobile (tiene `startIcon`)
- [ ] Tabs (Activas/Inactivas): asegurar que se vean bien apilados en mobile

**Breadcrumb y header:**
- [ ] El `PageBreadcrumb` + `practiceInfo.studentName` como título debe truncarse si es muy largo en mobile

### 4.4 TrackingStatsChart (`src/features/tracking/components/TrackingStatsChart.tsx`)

**Estado actual:**
- Chart ApexCharts con altura fija 320px
- Filtros 7d/30d/Todo en flex-wrap row
- Quick stats en grid de 3 columnas
- Mobile total indicator (hidden en desktop, visible en mobile)

**Cambios requeridos:**
- [ ] Verificar que el chart no se deforme en mobile (ApexCharts suele adaptarse solo)
- [ ] Asegurar que los filtros hagan wrap correctamente
- [ ] Quick stats: mantener grid 3 columnas pero verificar padding/textos
- [ ] El indicador mobile de total ya está implementado — verificar que funcione

---

## 5. Testing

| Resolución | Dispositivo | Ancho |
|------------|-------------|-------|
| Mobile | iPhone SE | 375px |
| Mobile | iPhone 14 | 390px |
| Mobile | Galaxy S21 | 412px |
| Tablet | iPad Mini | 768px |
| Tablet | iPad Air | 820px |
| Desktop | HD | 1280px |
| Desktop | Full HD | 1920px |

**Checklist de verificación:**
- [ ] Tablas con scroll horizontal no cortan contenido
- [ ] Modales en fullscreen en mobile no tienen bordes
- [ ] Stats cards en 2 columnas en mobile se ven proporcionadas
- [ ] Botones no se salen del contenedor
- [ ] Textos no se cortan ni desbordan
- [ ] Modales tienen sticky header/footer en mobile
- [ ] Paginación se ve bien apilada en mobile
- [ ] Filtros (CustomSelect, inputs) mantienen usabilidad táctil

---

## 6. Notas adicionales

- **No cambiar la estructura de datos ni lógica** — solo cambios visuales/CSS/Tailwind
- **Usar variantes responsive de Tailwind**: `sm:`, `md:`, `lg:`
- **Mantener consistencia**: todos los modales grandes deben compartir la misma clase fullscreen
- **No introducir nuevas dependencias**
- Este spec cubre solo **Tracking**. Después se harán los specs para **Evaluación** y **Reportes**.
