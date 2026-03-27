# Guía de Interfaz: Reportes

## 1. Descripción General

El módulo de **Reportes** permite generar різноманітні relatórios do sistema, incluindo estatísticas, listagens e certificados. É uma ferramenta de análise para administradores e assistentes.

### Propósito

- Visualizar métricas del sistema
- Generar reportes de estudiantes, tutores, instituciones
- Exportar datos a Excel y PDF
- Ver reportes recientes generados

### Ruta

```
/reports
```

### Roles que Acceden

| Rol | Acceso |
|-----|--------|
| Administrador (role: 1) | ✅ Sí |
| Asistente (role: 2) | ✅ Sí |
| Tutor (role: 3) | ✅ Sí (reportes limitados) |
| Estudiante (role: 4) | ❌ No |

---

## 2. Estructura Visual

### Layout de la Página

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  [SIDEBAR]                              [HEADER: Usuario + Notificaciones]       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  REPORTES Y ESTADÍSTICAS                                                        │
│  Visualiza métricas y genera reportes del sistema                               │
│                                                                                 │
│  [Todos los períodos ▼] [Actualizar]                                          │
│                                                                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ Estudiantes  │ │ Inscripciones │ │ Instituciones│ │ Certificados │        │
│  │    1,245    │ │     456      │ │      89     │ │     234      │        │
│  │   +12% ▲    │ │    +8% ▲     │ │   +5% ▲    │ │   +15% ▲    │        │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                                                 │
│  ┌─────────────────────────────┐ ┌─────────────────────────────────────────┐   │
│  │  ESTUDIANTES POR CARRERA    │ │  INSCRIPCIONES POR PERÍODO              │   │
│  │                             │ │                                          │   │
│  │  Ing. Sistemas   35%       │ │           █                             │   │
│  │  Medicina        25%       │ │        ███                              │   │
│  │  Derecho        20%       │ │      █████                             │   │
│  │  Admin. Empresas 20%       │ │    ███████                             │   │
│  │                             │ │  2024-I  2024-II  2025-I  2025-II    │   │
│  └─────────────────────────────┘ └─────────────────────────────────────────┘   │
│                                                                                 │
│  ┌──────────────────────────────────────┐ ┌───────────────────────────────┐   │
│  │  GENERAR REPORTE                     │ │  REPORTES RECIENTES          │   │
│  │                                      │ │                               │   │
│  │  Tipo de Reporte:                   │ │  Reporte de Estudiantes      │   │
│  │  [Seleccionar tipo ▼]               │ │  Juan Pérez - 15/03/2026     │   │
│  │                                      │ │                               │   │
│  │  Período:                           │ │  Anexo 4 Tutores             │   │
│  │  [Todos los períodos ▼]             │ │  María López - 14/03/2026    │   │
│  │                                      │ │                               │   │
│  │  [VER REPORTE]                      │ │                               │   │
│  └──────────────────────────────────────┘ └───────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Componentes del Módulo

### 3.1 Métricas Principales

| Métrica | Descripción |
|---------|-------------|
| Estudiantes | Total de estudiantes activos |
| Inscripciones | Inscripciones del período seleccionado |
| Instituciones | Instituciones activas |
| Certificados | Certificados emitidos |

### 3.2 Gráficos

#### Estudiantes por Carrera
- Barras horizontales con porcentaje
- Colores por carrera
- Click para detalle

#### Inscripciones por Período
- Gráfico de barras verticales
- Períodos disponibles: 2024-I, 2024-II, 2025-I, 2025-II

---

## 4. Tipos de Reporte

### 4.1 Reportes Disponibles

| Tipo | Descripción | Formato |
|------|-------------|---------|
| Estudiantes | Listado de estudiantes activos | PDF |
| Inscripciones | Inscripciones por período | PDF |
| Seguimiento | Seguimientos registrados | - |
| Certificados | Certificados emitidos | - |
| Instituciones | Listado de instituciones | PDF |
| ANEXO 4 - Tutores Académicos | Relación de tutores y estudiantes | Excel |
| Estudiantes Culminados | Prácticas completadas | PDF/Excel |

### 4.2 Flujo de Generación

```
1. Seleccionar tipo de reporte
2. Seleccionar período (opcional)
3. Click en "Ver Reporte"
4. Mostrar modal con datos:
   - Vista en tabla (Excel)
   - Vista en PDF
5. Exportar/Descargar
```

---

## 5. Modal de Reporte

### 5.1 Vista de Tabla

```
┌─────────────────────────────────────────────────────┐
│  REPORTE: Estudiantes Culminados                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  [🔍 Buscar...]                    [📥 Exportar]  │
│                                                     │
│  ┌─────┬────────────┬─────────────┬─────────────┐ │
│  │Cédul│ Estudiante  │   Carrera   │ Institució..│ │
│  ├─────┼────────────┼─────────────┼─────────────┤ │
│  │V1234│ Juan García│ Ing. Sistemas│ Hospital XYZ │ │
│  │V5678│ María López│ Medicina     │ Clínica ABC  │ │
│  └─────┴────────────┴─────────────┴─────────────┘ │
│                                                     │
│                      [Cerrar]                       │
└─────────────────────────────────────────────────────┘
```

### 5.2 Vista de PDF

```
┌─────────────────────────────────────────────────────┐
│  [🔍 Buscar...]                    [📥 Descargar]  │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │           VISTA PREVIA PDF                   │   │
│  │                                              │   │
│  │  Logo UNefa                                  │   │
│  │  Título del Reporte                          │   │
│  │  Tabla de datos                              │   │
│  │                                              │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│                      [Cerrar]                       │
└─────────────────────────────────────────────────────┘
```

---

## 6. Reportes Recientes

### 6.1 Información Mostrada

| Campo | Descripción |
|-------|-------------|
| Nombre | Nombre del reporte |
| Tipo | Tipo de reporte |
| Usuario | Quién lo generó |
| Fecha | Fecha de generación |

### 6.2 Formato

Lista de los últimos 10 reportes generados en el sistema.

---

## 7. Filtros

### 7.1 Filtro de Período

| Opción | Descripción |
|--------|-------------|
| Todos los períodos | Sin filtro |
| 2025-II | Período específico |
| 2025-I | Período específico |
| 2024-II | Período específico |
| 2024-I | Período específico |

### 7.2 Efecto

- Métricas principales se actualizan
- Gráficos se filtran
- Reportes se generan con filtro aplicado

---

## 8. Exportación

### 8.1 Formatos Soportados

| Formato | Extensión | Uso |
|---------|-----------|-----|
| Excel | .xls | Tablas grandes |
| PDF | .pdf | Documentos formales |

### 8.2 Especial: Anexo 4

El reporte "ANEXO 4 - Tutores Académicos" tiene un formato especial que incluye:
- Región
- Núcleo
- Extensión
- Carrera
- Nombre del tutor
- Apellido del tutor
- Cédula
- Condición
- Dedicación
- Categoría
- Teléfono
- Correo
- Cantidad de estudiantes

---

## 9. Tipos de Datos

### 9.1 ReportMetric

```typescript
interface ReportMetric {
  label: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
}
```

### 9.2 CareerData

```typescript
interface CareerData {
  label: string;
  fullName: string;
  value: number;
  percentage: number;
  color?: string;
}
```

### 9.3 PeriodData

```typescript
interface PeriodData {
  label: string;
  value: number;
}
```

---

## 10. Obtención de Datos

### 10.1 Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/reports/stats` | Métricas principales |
| GET | `/api/reports/students-by-career` | Estudiantes por carrera |
| GET | `/api/reports/enrollments-by-period` | Inscripciones por período |
| GET | `/api/reports/recent` | Reportes recientes |
| GET | `/api/reports/tutors-academic` | Reporte Anexo 4 |
| GET | `/api/reports/culminated-students` | Estudiantes culminados |
| POST | `/api/reports/generate` | Generar reporte |

### 10.2 Parámetros

```typescript
// GET /api/reports/stats?period=2025-II
{
  period?: string;
}
```

---

## 11. Casos Edge

| Caso | Comportamiento |
|------|----------------|
| Sin datos | Muestra "No hay datos disponibles" |
| Error de carga | Muestra toast de error |
| Reporte vacío | Muestra tabla vacía con mensaje |
| Período sin datos | Métricas en 0 |

---

## 12. Módulos Relacionados

| Módulo | Relación |
|--------|----------|
| Estudiantes | Datos para reportes |
| Inscripciones | Datos para reportes |
| Instituciones | Datos para reportes |
| Culminación | Certificados generados |

---

## 13. Archivos Relacionados

### Frontend

| Archivo | Descripción |
|---------|-------------|
| `src/pages/Reports/Reports.tsx` | Página principal |
| `src/features/reports/services/reportsService.ts` | Servicio API |
| `src/components/ui/pdf/templates/*.tsx` | Templates de PDF |

### Backend

| Archivo | Descripción |
|---------|-------------|
| `backend/src/routes/reports.routes.ts` | Rutas |
| `backend/src/controllers/reports.controller.ts` | Controlador |

---

## 14. Siguiente Módulo

El sidebar continúa con **Configuración**:

| # | Módulo | Ruta |
|---|--------|------|
| 10a | Usuarios | `/configure/users` |
| 10b | Listas | `/configure/lists` |
| 10c | Auditoría | `/configure/auditoria` |
| 10d | Roles y Permisos | `/configure/roles` |
| 10e | Mantenimiento | `/configure/maintenance` |
| 10f | Respaldos | `/configure/backups` |
| 10g | Landing Page | `/configure/landing` |
