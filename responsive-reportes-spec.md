# Responsive Review — Módulo de Reportes

> **Fecha**: 2026-07-14
> **Base**: Decisiones previas del spec de Tracking (scroll horizontal en tablas, fullscreen modales en mobile)

---

## 1. Objetivo

Revisar y corregir el diseño responsive del módulo de Reportes para que se vea correctamente en **todas las resoluciones**: desktop (1920px+), tablet (768-1024px) y mobile (< 768px).

---

## 2. Estado actual

| Componente | ¿Responsive? | Observaciones |
|---|---|---|
| **Reports.tsx** (página principal) | ✅ Parcial | Header con filtros se apila, métricas y charts bien |
| **ReportList.tsx** (grilla de reportes) | ✅ Sí | Grid `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` |
| **ReportCard.tsx** (tarjeta individual) | ✅ Sí | Botones flex-1, badge, icono |
| **CulminatedStudentsTable.tsx** | ⚠️ Tabla 13 columnas | Tiene `overflow-x-auto`, pero muchas columnas en mobile |
| **CulminatedStudentsFilters.tsx** | ✅ Sí | Grid `md:grid-cols-2 lg:grid-cols-4` |
| **CulminatedStudentsReport.tsx** | ✅ Parcial | Stats cards responsive, tabla y filtros bien |
| **DocumentReportModal.tsx** | ⚠️ Modal size "md" | Modal pequeño, contenido denso con sidebar de inputs |
| **SingleReportModal.tsx** | ✅ Sí | Ya es fullscreen con tabs mobile (preview/info) |
| **TablePreviewModal.tsx** | ✅ Sí | Ya es fullscreen con tabs mobile (preview/filtros) |
| **ProyeccionModal.tsx** | ❓ No revisado | Pendiente de revisar |
| **RelacionInstitucionesModal.tsx** | ❓ No revisado | Pendiente de revisar |

---

## 3. Problemas identificados

| # | Problema | Componentes afectados |
|---|----------|----------------------|
| 1 | Header con muchos filtros se desborda en mobile | Reports.tsx |
| 2 | CulminatedStudentsTable con 13 columnas → scroll horizontal muy extenso | CulminatedStudentsTable.tsx |
| 3 | DocumentReportModal tamaño "md" con sidebar de inputs editable → muy denso en mobile | DocumentReportModal.tsx |
| 4 | ProyeccionModal y RelacionInstitucionesModal sin revisar responsive | Ambos modales |

---

## 4. Decisiones de diseño (heredadas del spec de Tracking)

| Decisión | Opción |
|----------|--------|
| **Tablas en mobile** | Scroll horizontal (`overflow-x-auto`). Mantener columnas. |
| **Modales en mobile** | Fullscreen (`max-w-full h-full`) en resoluciones < 768px. |
| **Stats cards** | 2 columnas en mobile. |

---

## 5. Componentes a modificar

### 5.1 Reports.tsx — Header de filtros

**Estado actual:**
```tsx
<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h1>Reportes y Estadísticas</h1>
    <p>Visualiza métricas...</p>
  </div>
  <div className="flex items-center gap-3">
    <SearchInput className="!w-56" />
    <CustomSelect className="w-40" />
    <MultiSelect className="w-56" />
    <Button>Actualizar</Button>
  </div>
</div>
```

**Problema**: En mobile, el `flex items-center gap-3` intenta poner todos los filtros en una fila → se desborda. Además, `SearchInput` tiene `!w-56` fijo.

**Cambios requeridos:**
- [ ] El contenedor de filtros debe apilarse en mobile: `flex-col sm:flex-row`
- [ ] Quitar anchos fijos en mobile (`!w-56`, `w-40`, `w-56`) → `w-full sm:w-40`
- [ ] Cada filtro debe tener `w-full` en mobile con un wrapper que los apile:

```tsx
{/* Header */}
<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <div>...</div>
  {/* Filtros: stack vertical en mobile, row en desktop */}
  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
    <SearchInput className="w-full sm:!w-56" />
    <CustomSelect className="w-full sm:w-40" />
    <MultiSelect className="w-full sm:w-56" label="" />
    <Button variant="outline" className="w-full sm:w-auto">Actualizar</Button>
  </div>
</div>
```

### 5.2 CulminatedStudentsTable.tsx — Tabla 13 columnas

**Estado actual:**
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableCell isHeader>#</TableCell>
      <TableCell isHeader>Cédula</TableCell>
      <TableCell isHeader>Estudiante</TableCell>
      <TableCell isHeader>Carrera</TableCell>
      <TableCell isHeader>Institución</TableCell>
      <TableCell isHeader>Tipo</TableCell>
      <TableCell isHeader>Tutor</TableCell>
      <TableCell isHeader>Período</TableCell>
      <TableCell isHeader>Inicio</TableCell>
      <TableCell isHeader>Fin</TableCell>
      <TableCell isHeader>Horas</TableCell>
      <TableCell isHeader>Nota</TableCell>
      <TableCell isHeader>Estado</TableCell>
    </TableRow>
  </TableHeader>
</Table>
```

**Problema**: 13 columnas en mobile obligan a scroll horizontal muy ancho.

**Cambios requeridos:**
- [ ] El `overflow-x-auto` ya existe ✅
- [ ] Verificar que las columnas no tengan anchos mínimos que impidan el scroll
- [ ] En mobile, se podría ocultar columnas menos críticas con `hidden md:table-cell`:
  - `Institución` → ocultar en mobile
  - `Tutor` → ocultar en mobile
  - `Tipo` → ocultar en mobile
  - `Inicio` / `Fin` → ocultar en mobile (o colapsar en una sola)
- [ ] Columnas prioritarias (siempre visibles): `#`, `Cédula`, `Estudiante`, `Carrera`, `Horas`, `Nota`, `Estado`

```tsx
<TableCell isHeader className="hidden md:table-cell">Institución</TableCell>
<TableCell isHeader className="hidden md:table-cell">Tipo</TableCell>
<TableCell isHeader className="hidden md:table-cell">Tutor</TableCell>
<TableCell isHeader className="hidden lg:table-cell">Período</TableCell>
<TableCell isHeader className="hidden lg:table-cell">Inicio</TableCell>
<TableCell isHeader className="hidden lg:table-cell">Fin</TableCell>
```

Y las celdas de datos correspondientes:
```tsx
<TableCell className="hidden md:table-cell uppercase">{item.institutionName}</TableCell>
```

### 5.3 DocumentReportModal.tsx — Modal de generación de documentos

**Estado actual:**
- Modal `size="md"` con contenido: search input, selection summary, generate button
- Al hacer clic en "Generar Documento" se abre un `SingleReportModal` (fullscreen)
- El `SingleReportModal` ya tiene `extraSidebarContent` con muchos inputs editables

**Problema**: El modal inicial (size "md") es pequeño y tiene search + botones. El SingleReportModal ya es fullscreen.

**Cambios requeridos:**
- [ ] Modal inicial → **fullscreen en mobile** (misma regla que modales de Tracking)

```tsx
<Modal isOpen={isOpen} onClose={onClose} size="md"
  className="max-w-full rounded-none min-h-screen max-h-full sm:max-w-md sm:rounded-2xl sm:min-h-0 sm:max-h-[95vh]">
```

- [ ] El `SingleReportModal` ya está bien (ya es fullscreen) ✅

### 5.4 ProyeccionModal.tsx — Modal de proyección

**Cambios requeridos:**
- [ ] Revisar si tiene tablas → aplicar `overflow-x-auto`
- [ ] Revisar si tiene grids → verificar columnas responsive
- [ ] Modal → fullscreen en mobile

### 5.5 RelacionInstitucionesModal.tsx — Modal de relación de instituciones

**Cambios requeridos:**
- [ ] Revisar si tiene tablas → aplicar `overflow-x-auto`
- [ ] Modal → fullscreen en mobile

---

## 6. Componentes que NO requieren cambios

| Componente | Razón |
|---|---|
| **ReportList.tsx** | Grid ya es responsive |
| **ReportCard.tsx** | Diseño compacto, se adapta bien |
| **SingleReportModal.tsx** | Ya es fullscreen con tabs mobile |
| **TablePreviewModal.tsx** | Ya es fullscreen con tabs mobile |
| **CulminatedStudentsFilters.tsx** | Grid responsive, inputs se adaptan |

---

## 7. Testing

| Resolución | Dispositivo | Ancho |
|------------|-------------|-------|
| Mobile | iPhone SE | 375px |
| Mobile | iPhone 14 | 390px |
| Mobile | Galaxy S21 | 412px |
| Tablet | iPad Mini | 768px |
| Desktop | HD | 1280px |
| Desktop | Full HD | 1920px |

**Checklist de verificación:**
- [ ] Header de Reports.tsx se apila verticalmente en mobile (no se desborda)
- [ ] Filtros ocupan `w-full` en mobile
- [ ] CulminatedStudentsTable tiene scroll horizontal y columnas menos importantes ocultas en mobile
- [ ] DocumentReportModal fullscreen en mobile
- [ ] ProyeccionModal y RelacionInstitucionesModal fullscreen en mobile
- [ ] Paginación en CulminatedStudentsTable se ve bien en mobile
- [ ] Métricas (stats cards) en 2 columnas en mobile
