# Guía de Interfaz: Prácticas Profesionales > Evaluaciones

## 1. Descripción General

El módulo de **Evaluaciones** es el cuarto paso del flujo de prácticas profesionales. Permite evaluar el desempeño del estudiante mediante tres tipos de evaluaciones: Institucional, Académica y Comité.

### Propósito

- Registrar evaluaciones de estudiantes en práctica profesional
- Calcular nota final ponderada
- Gestionar criterios de evaluación
- Visualizar estado de evaluaciones por práctica
- Registrar observaciones y recomendaciones

### Ruta

```
/evaluations
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
| Tutor (role: 3) | ✅ Sí |
| Estudiante (role: 4) | Ver solo (mis evaluaciones) |

---

## 2. Estructura Visual

### Layout de la Página

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  [SIDEBAR]                              [HEADER: Usuario + Notificaciones]     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  EVALUACIONES DE PRÁCTICAS PROFESIONALES                                    │
│  Gestiona las evaluaciones de estudiantes en práctica profesional            │
│                                                                                 │
│  ┌─────────────────────────────────────┐                                     │
│  │ [🔍 Buscar...]                       │                                     │
│  └─────────────────────────────────────┘                                     │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  Estudiante      | Institución   | Institucional | Académica | Comité |   │
│  │  ─────────────────────────────────────────────────────────────────────│   │
│  │  Juan García    | Hospital XYZ | [✓ 16.5]   | [✓ 15.0] | [⏳ -]  |   │
│  │  María López    | Empresa ABC  | [✓ 18.0]   | [⏳ -]   | [⏳ -]  |   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│ Leyenda: [✓ Completada] [⏳ Pendiente]                                     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Tipos de Evaluaciones

El sistema utiliza **3 tipos de evaluaciones** con ponderaciones específicas:

### 3.1 Tipos y Pesos

| Tipo | Evaluador | Peso |
|------|-----------|------|
| **Institucional** | Supervisor de la empresa | 40% |
| **Académica** | Tutor académico | 30% |
| **Comité** | Comité de prácticas | 30% |

### 3.2 Cálculo de Nota Final

```
Nota Final = (Nota Institucional × 0.40) + (Nota Académica × 0.30) + (Nota Comité × 0.30)
```

### 3.3 Rango de Notas

| Rango | Descripción |
|-------|-------------|
| 0 - 9.9 | Reprobado |
| 10 - 20 | Aprobado |

---

## 4. Componentes del Módulo

### 4.1 Header

```
EVALUACIONES DE PRÁCTICAS PROFESIONALES
Gestiona las evaluaciones de estudiantes en práctica profesional
```

### 4.2 Campo de Búsqueda

Busca por:
- Nombre del estudiante
- Cédula
- Nombre de la institución

---

## 5. Tabla de Evaluaciones

### 5.1 Columnas

| Columna | Descripción |
|---------|-------------|
| Estudiante | Nombre completo del estudiante |
| Institución | Nombre de la empresa |
| Institucional | Estado y nota de evaluación institucional |
| Académica | Estado y nota de evaluación académica |
| Comité | Estado y nota de evaluación comité |

### 5.2 Estados de Evaluación

| Estado | Label | Color | Significado |
|--------|-------|-------|-------------|
| Completada | ✅ | Verde | Evaluación registrada |
| Pendiente | ⏳ | Naranja | Por realizar |

### 5.3 Visualización de Notas

```
[✓ 16.5]  → Nota completada
[⏳ -]     → Pendiente
```

---

## 6. Modal de Evaluación

### 6.1 Tipos de Evaluación

El modal varía según el tipo de evaluación:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  EVALUACIÓN [Institucional / Académica / Comité]                      │
│                                                                         │
│  Estudiante: Juan García                                              │
│  Institución: Hospital XYZ                                            │
│  Período: 1-2026                                                     │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ CRITERIOS DE EVALUACIÓN                                       │   │
│  │                                                                 │   │
│  │  1. Dominio técnico del área de trabajo              [____] 16   │   │
│  │  2. Responsabilidad y puntualidad           [____] 18   │   │
│  │  3. Trabajo en equipo                        [____] 15   │   │
│  │  4. Iniciativa y proactividad                [____] 17   │   │
│  │  5. Comunicación efectiva                    [____] 16   │   │
│  │                                                                 │   │
│  │  ... (más criterios según tipo)                               │   │
│  │                                                                 │   │
│  │  ──────────────────────────────────────────────────────────       │   │
│  │  NOTA TOTAL: 16.4                                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ OBSERVACIONES                                                  │   │
│  │                                                                 │   │
│  │  ┌────────────────────────────────────────────────────────┐    │   │
│  │  │ El estudiante mostró un excelente desempeño durante  │    │   │
│  │  │ toda la práctica. Se recomienda para cualquier       │    │   │
│  │  │ oportunidad laboral.                                 │    │   │
│  │  └────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  [Cancelar]                                    [Guardar Evaluación]   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Criterios de Evaluación

### 7.1 Evaluación Institucional

| # | Criterio | Peso típico |
|---|----------|---------------|
| 1 | Dominio técnico del área de trabajo | 20% |
| 2 | Responsabilidad y puntualidad | 15% |
| 3 | Trabajo en equipo | 15% |
| 4 | Iniciativa y proactividad | 15% |
| 5 | Comunicación efectiva | 10% |
| 6 | Cumplimiento de normas | 10% |
| 7 | Calidad del trabajo | 15% |

### 7.2 Evaluación Académica

| # | Criterio | Peso típico |
|---|----------|---------------|
| 1 | Planning y organización | 15% |
| 2 | Asistencia y participación | 15% |
| 3 | Bitácora y documentación | 20% |
| 4 | Cumplimiento de objetivos | 20% |
| 5 | Calidad del informe final | 30% |

### 7.3 Evaluación Comité

| # | Criterio | Peso típico |
|---|----------|---------------|
| 1 | Presentación oral | 40% |
| 2 | Documentación técnica | 30% |
| 3 | Respuestas a preguntas | 30% |

---

## 8. Estados de Evaluación

### 8.1 Status por Práctica

| Estado | Descripción |
|-------|-------------|
| pending | Sin evaluaciones |
| partial | Algunas evaluaciones completadas |
| completed | Todas las evaluaciones completadas |

### 8.2 Visualización del Estado

```
Estado: Parcial
├── Institucional: ✅ 16.5 (40%)
├── Académica: ✅ 15.0 (30%)
└── Comité: ⏳ Pendiente (30%)

Nota Final: 15.25 (calculada)
```

---

## 9. Acciones

### 9.1 Acciones por Evaluación

| Acción | Icono | Descripción |
|--------|-------|-------------|
| Registrar Evaluación | 📝 | Abrir modal de evaluación |
| Ver Detalles | 👁️ | Ver evaluación completa |
| Ver Nota Final | 📊 | Ver resumen de evaluaciones |

---

## 10. Tipos de Datos

### 10.1 Evaluation

```typescript
interface Evaluation {
  evaluationId: number;
  professionalPracticeId: number;
  evaluatorType: EvaluatorType;  // INSTITUCIONAL | ACADEMICO | COMITE
  evaluatorId?: number;
  evaluatorName: string;
  evaluatorCi?: string;
  totalScore: number;
  observations?: string;
  evaluationDate: string;
  registeredBy: number;
  weight: number;
}
```

### 10.2 EvaluatorType

```typescript
type EvaluatorType = 'INSTITUCIONAL' | 'ACADEMICO' | 'COMITE';
```

### 10.3 EVALUATION_WEIGHTS

```typescript
const EVALUATION_WEIGHTS = {
  'INSTITUCIONAL': 0.40,  // 40%
  'ACADEMICO': 0.30,     // 30%
  'COMITE': 0.30        // 30%
};
```

### 10.4 EvaluationStatus

```typescript
interface EvaluationStatus {
  practiceId: string;
  currentGrade: number | null;
  evaluationStatus: 'pending' | 'partial' | 'completed';
  evaluations: {
    [key in EvaluatorType]: {
      completed: boolean;
      score: number;
      evaluatorName: string;
      evaluationId?: number;
    };
  };
  finalGrade: string;
  completedCount: number;
}
```

---

## 11. Obtención de Datos

### 11.1 Hook

```typescript
const {
  criteria,
  fetchCriteria,
  createEvaluation,
  updateEvaluation,
  getPracticeStatus,
  loading
} = useEvaluations();
```

### 11.2 Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/evaluations` | Obtener evaluaciones |
| POST | `/api/evaluations` | Crear evaluación |
| PUT | `/api/evaluations/:id` | Actualizar evaluación |
| GET | `/api/evaluations/practice/:id/status` | Obtener estado de evaluaciones |
| GET | `/api/evaluations/criteria` | Obtener criterios de evaluación |

---

## 12. Casos Edge

| Caso | Comportamiento |
|------|----------------|
| Evaluación ya completada | Permite actualizar |
| Sin criterios definidos | No permite evaluar |
| Práctica no existente | Validación rejecta |
| Nota fuera de rango (0-20) | Validación rejecta |
| Estudiante sin inscripción | No aparece en lista |

---

## 13. Flujo Completo de Práctica Profesional

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
   │              │     │ (Este módulo) │
   └──────────────┘     └──────────────┘
```

---

## 14. Módulos Relacionados

| Módulo | Relación |
|--------|----------|
| Inscripción | Proporciona estudiantes a evaluar |
| Seguimiento | Registro complementario |
| Bitácora de Actividades | Documentación para evaluación |

---

## 15. Archivos Relacionados

### Frontend

| Archivo | Descripción |
|---------|-------------|
| `src/pages/Evaluations/EvaluationsList.tsx` | Página principal |
| `src/features/evaluations/components/EvaluationModal.tsx` | Modal de evaluación |
| `src/features/evaluations/components/EvaluationDetailModal.tsx` | Detalles de evaluación |
| `src/features/evaluations/hooks/useEvaluations.tsx` | Hook de lógica |
| `src/features/evaluations/types/index.ts` | Tipos TypeScript |

### Backend

| Archivo | Descripción |
|---------|-------------|
| `backend/src/routes/evaluations.routes.ts` | Rutas de evaluaciones |
| `backend/src/controllers/evaluations.controller.ts` | Controlador |

---

## 16. Siguiente Módulo

El módulo "Prácticas Profesionales":

| # | Módulo | Ruta |
|---|--------|------|
| 07a | Pre-Inscripción | `/pre-enrollment` |
| 07b | Inscripción | `/enrollment` |
| 07c | Seguimiento | `/tracking` |
| 07d | Evaluaciones | `/evaluations` (actual) |
| 07e | Culminación | `/culmination` |
