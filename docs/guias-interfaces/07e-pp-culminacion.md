# Guía de Interfaz: Prácticas Profesionales > Culminación

## 1. Descripción General

El módulo de **Culminación** es el quinto y último paso del flujo de prácticas profesionales. Permite aprobar las prácticas de estudiantes que han completado todos los requisitos y generar certificados de culminación.

### Propósito

- Aprobar prácticas profesionales completadas
- Generar certificados de culminación
- Gestionar el estado de culminación (pendiente/aprobado/certificado)
- Visualizar estadísticas de culminación
- Descargar PDFs de certificados

### Ruta

```
/culmination
```

### Flujo del Estudiante

```
Pre-Inscripción → Inscripción → Seguimiento → Evaluación → Culminación
    (Paso 1)      (Paso 2)       (Paso 3)      (Paso 4)      (Paso 5)
```

### Roles que Acceden

| Rol | Acceso |
|-----|--------|
| Administrador (role: 1) | ✅ Sí |
| Asistente (role: 2) | ✅ Sí |
| Tutor (role: 3) | ❌ No |
| Estudiante (role: 4) | ❌ No |

---

## 2. Estructura Visual

### Layout de la Página

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  [SIDEBAR]                              [HEADER: Usuario + Notificaciones]     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  CULMINACIÓN DE PRÁCTICAS PROFESIONALES                                    │
│  Gestiona la aprobación y certificación de prácticas profesional           │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ESTADÍSTICAS: Total: 45 | Pendientes: 5 | Aprobados: 30 | Certificados: 10│
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────┐ ┌──────────────────────────────┐   │
│  │ [🔍 Buscar...]                     │ │ [Filtros: Estado | Período] │   │
│  └─────────────────────────────────────┘ └──────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  Estudiante      | Período   | Horas | Estado    | Certificado      │   │
│  │  ─────────────────────────────────────────────────────────────────────│   │
│  │  Juan García    | 1-2026   | 120h  | [Aprobado]| [📥 Descargar]│   │
│  │  María López    | 1-2026   | 120h  | [Pendiente]| [✓ Aprobar]   │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Estados de Culminación

### 3.1 Estados Posibles

| Estado | Label | Color | Descripción |
|--------|-------|-------|-------------|
| pending | Pendiente | Naranja | Esperando aprobación |
| approved | Aprobado | Verde | Práctica aprobada |
| certified | Certificado | Azul | Certificado generado |

### 3.2 Transiciones de Estado

```
Pendiente → Aprobado → Certificado
   ↓          ↓          ↓
  (1)        (2)        (3)
```

---

## 4. Componentes del Módulo

### 4.1 Header

```
CULMINACIÓN DE PRÁCTICAS PROFESIONALES
Gestiona la aprobación y certificación de prácticas profesionales
```

### 4.2 Estadísticas

| Métrica | Descripción |
|---------|-------------|
| Total | Total de prácticas culminadas |
| Pendientes | Prácticas esperando aprobación |
| Aprobados | Prácticas aprobadas |
| Certificados | Certificados generados |

### 4.3 Filtros

| Filtro | Opciones |
|--------|----------|
| Estado | Pendiente / Aprobado / Certificado |
| Período | Todos los períodos |
| Búsqueda | Por nombre, cédula o institución |

---

## 5. Tabla de Culminaciones

### 5.1 Columnas

| Columna | Descripción | Ordenable |
|---------|-------------|-----------|
| Estudiante | Nombre completo | ✅ |
| Período | Período académico | ✅ |
| Horas | Horas completadas | ✅ |
| Estado | Estado actual | ✅ |
| Certificado | Acciones de certificado | ❌ |

### 5.2 Datos Mostrados

| Campo | Descripción |
|-------|-------------|
| Cédula | Identificación del estudiante |
| Carrera | Carrera del estudiante |
| Institución | Empresa donde hizo la práctica |
| Tipo de Práctica | Tipo de práctica realizada |
| Fecha Inicio | Fecha de inicio |
| Fecha Fin | Fecha de culminación |
| Horas Totales | Horas acumuladas |

---

## 6. Acciones

### 6.1 Acciones por Registro

| Acción | Icono | Estado Requerido | Descripción |
|--------|-------|------------------|-------------|
| Aprobar | ✅ | Pendiente | Aprueba la práctica |
| Generar Certificado | 📜 | Aprobado | Genera certificado |
| Descargar PDF | 📥 | Certificado | Descarga PDF del certificado |
| Ver Detalles | 👁️ | Cualquiera | Ver detalles completos |

### 6.2 Aprobar Práctica

```
┌─────────────────────────────────────────────┐
│  ⚠️ Confirmar Aprobación                     │
│                                             │
│  ¿Estás seguro de que deseas aprobar        │
│  la práctica de Juan García?              │
│                                             │
│  Una vez aprobado, no se podrá             │
│  modificar.                                │
│                                             │
│  [Cancelar]        [Aprobar]              │
└─────────────────────────────────────────────┘
```

### 6.3 Generar Certificado

```
┌─────────────────────────────────────────────┐
│  📜 Generar Certificado                     │
│                                             │
│  ¿Estás seguro de que deseas generar     │
│  el certificado de culminación para       │
│  Juan García?                             │
│                                             │
│  El certificado incluirá:                 │
│  • Nombre del estudiante                  │
│  • Carrera                                │
│  • Período académico                      │
│  • Horas completadas                      │
│  • Fecha de emisión                       │
│                                             │
│  [Cancelar]        [Generar]              │
└─────────────────────────────────────────────┘
```

---

## 7. Certificado de Culminación

### 7.1 Contenido del Certificado

El certificado incluye:

| Campo | Descripción |
|-------|-------------|
| Número de Certificado | Identificador único |
| Nombre del Estudiante | Nombre completo |
| Cédula | Identificación |
| Carrera | Carrera cursada |
| Período | Período académico |
| Tipo de Práctica | Tipo realizado |
| Horas Totales | Horas completadas |
| Fecha de Emisión | Fecha de generación |
| Firma | Authorized signature |

### 7.2 UI del Certificado (PDF)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                    UNIVERSIDAD NACIONAL EXPERIMENTAL                  │
│                    DE LA FUERZA ARMADA BOLIVARIANA                   │
│                                                                      │
│                         [ESCUDO UNIVERSITARIO]                       │
│                                                                      │
│  CERTIFICADO DE CULMINACIÓN DE PRÁCTICA PROFESIONAL                │
│                                                                      │
│  ───────────────────────────────────────────────────────────────     │
│                                                                      │
│  El Suscrito Coordinador de Prácticas Profesionales                │
│                                                                      │
│  CERTIFICA QUE:                                                    │
│                                                                      │
│  El ciudadano(a):                                                 │
│                                                                      │
│              JUAN GARCÍA PÉREZ                                     │
│              C.I.: V-12.345.678                                     │
│                                                                      │
│ quien cursó la carrera de:                                        │
│                                                                      │
│              INGENIERÍA DE SISTEMAS                                 │
│                                                                      │
│  Ha culminado satisfactóriamente su práctica profesional          │
│  en la institución:                                               │
│                                                                      │
│              HOSPITAL XYZ, C.A.                                    │
│                                                                      │
│  Durante el período: 1-2026                                        │
│  Con un total de: 120 horas                                      │
│                                                                      │
│  ───────────────────────────────────────────────────────────────     │
│                                                                      │
│  Certificado Nro: CERT-2026-001234                                 │
│  Fecha de Emisión: 15 de Marzo de 2026                           │
│                                                                      │
│                         [FIRMA]                                    │
│                                                                      │
│                         Coordinador de Prácticas                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Tipos de Datos

### 8.1 CulminationRecord

```typescript
interface CulminationRecord {
  id: string;
  studentCi: string;
  studentName: string;
  careerId: number;
  careerName: string;
  institutionId: number;
  institutionName: string;
  period: string;
  practiceType: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  status: 'pending' | 'approved' | 'certified';
  certificateNumber?: string;
  certifiedAt?: string;
}
```

### 8.2 CulminationMeta

```typescript
interface CulminationMeta {
  total: number;
  pending: number;
  approved: number;
  certified: number;
}
```

### 8.3 CertificateResponse

```typescript
interface CertificateResponse {
  success: boolean;
  message: string;
  certificate: {
    number: string;
    studentName: string;
    studentCi: string;
    career: string;
    institution: string;
    period: string;
    generatedAt: string;
  };
}
```

---

## 9. Obtención de Datos

### 9.1 Servicio

```typescript
const {
  getRecords,
  approve,
  generateCertificate
} = culminationService;
```

### 9.2 Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/culmination` | Obtener registros de culminación |
| POST | `/api/culmination/:id/approve` | Aprobar práctica |
| POST | `/api/culmination/:id/certificate` | Generar certificado |

### 9.3 Parámetros de Consulta

```typescript
// GET /api/culmination?status=pending&period=1-2026&search=juan
{
  status?: 'pending' | 'approved' | 'certified',
  period?: string,
  search?: string
}
```

---

## 10. Validaciones para Aprobación

### 10.1 Requisitos

Para aprobar una práctica, debe cumplir:

| Requisito | Descripción |
|-----------|-------------|
| Evaluaciones completas | Las 3 evaluaciones deben estar registradas |
| Horas mínimas | Debe cumplir las horas requeridas |
| Período activo | El período debe estar en curso o culminado |

### 10.2 Validaciones para Certificado

| Requisito | Descripción |
|-----------|-------------|
| Práctica aprobada | Debe estar en estado "approved" |
| Sin certificado anterior | No debe tener certificado generado |

---

## 11. Casos Edge

| Caso | Comportamiento |
|------|----------------|
| Evaluaciones incompletas | No permite aprobar |
| Horas insuficientes | Warning, permite aprobar igual |
| Certificado ya generado | No permite generar otro |
| Práctica no existente | Validación rejecta |

---

## 12. Flujo Completo de Práctica Profesional

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUJO DE PRÁCTICA PROFESIONAL                       │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
   │ PRE-         │     │ INSCRIPCIÓN  │     │ SEGUIMIENTO  │
   │ INSCRIPCIÓN  │────▶│              │────▶│              │
   │              │     │              │     │              │
   └──────────────┘     └──────────────┘     └──────────────┘
                                                        │
   ┌──────────────┐     ┌──────────────┐              │
   │ CULMINACIÓN  │◀────│ EVALUACIONES │◀─────────────┘
   │              │     │              │
   │ (Este módulo)│     └──────────────┘
   └──────────────┘
```

---

## 13. Módulos Relacionados

| Módulo | Relación |
|--------|----------|
| Evaluaciones | Debe estar completo para aprobar |
| Inscripción | Proporciona datos del estudiante |
| Seguimiento | Registro complementario |

---

## 14. Archivos Relacionados

### Frontend

| Archivo | Descripción |
|---------|-------------|
| `src/pages/Culmination/Culmination.tsx` | Página principal |
| `src/features/culmination/services/culminationService.ts` | Servicio API |
| `src/components/ui/pdf/templates/CertificatePDF.tsx` | Template de certificado |

### Backend

| Archivo | Descripción |
|---------|-------------|
| `backend/src/routes/culmination.routes.ts` | Rutas de culminación |
| `backend/src/controllers/culmination.controller.ts` | Controlador |

---

## 15. Módulos del Sidebar Completados

Con este módulo completamos la sección "Prácticas Profesionales":

| # | Módulo | Estado |
|---|---------|--------|
| 07a | Pre-Inscripción | ✅ |
| 07b | Inscripción | ✅ |
| 07c | Seguimiento | ✅ |
| 07d | Evaluaciones | ✅ |
| 07e | Culminación | ✅ |

---

## 16. Siguiente Sección

El sidebar tiene más módulos después de Prácticas Profesionales:

| # | Módulo | Ruta |
|---|--------|------|
| 08 | Solicitudes | `/admin/requests` |
| 09 | Reportes | `/reports` |
| 10 | Configuración | `/configure/*` |
