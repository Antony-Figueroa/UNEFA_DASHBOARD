# Escenarios de Prueba: Procesos de Inscripción de Estudiantes

## Resumen Visual de Comportamiento

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FLUJO DE VALIDACIÓN SECUENCIAL                       │
│                                                                         │
│  Estudiante intenta inscribir práctica con PRIORITY > 1                │
│                           │                                             │
│                           ▼                                             │
│  ┌──────────────────────────────────────────────┐                      │
│  │ ¿Tiene práctica ANTERIOR (P-1) CULMINADA     │                      │
│  │ con nota >= MINIMUM_GRADE?                    │                      │
│  └──────────────────────────────────────────────┘                      │
│           │                        │                                    │
│          SÍ                       NO                                   │
│           │                        │                                    │
│           ▼                        ▼                                    │
│  ┌─────────────────┐   ┌──────────────────────────────────────┐        │
│  │ ✅ PERMITIDO    │   │ ¿Tiene práctica anterior en estado   │        │
│  │ Puede inscribir │   │ RETIRADO/REPROBADO/RETIRO_JUSTIFICADO│        │
│  └─────────────────┘   └──────────────────────────────────────┘        │
│                                 │                  │                    │
│                                SÍ                  NO                   │
│                                 │                  │                    │
│                                 ▼                  ▼                    │
│                    ┌──────────────────┐  ┌─────────────────────┐       │
│                    │ 🚫 BLOQUEADO     │  │ 🚫 BLOQUEADO        │       │
│                    │ Banner ROJO/AZUL │  │ Mensaje genérico    │       │
│                    └──────────────────┘  └─────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Escenario 1: Retiro Justificado

| Campo | Valor |
|-------|-------|
| **PRACTICES_STATUS** | `5` (RETIRO_JUSTIFICADO) |
| **WITHDRAWAL_TYPE** | `justified` |
| **OBSERVATION** | `RETIRO CON JUSTIFICATIVO: [motivo]` |

### Comportamiento esperado en el navegador

| Acción | Resultado |
|--------|-----------|
| Inscribir **misma práctica** (P=1) en siguiente período | ✅ **PERMITIDO** — puede reinscribirse |
| Inscribir **siguiente práctica** (P=2) | 🚫 **BLOQUEADO** — banner **AZUL** |
| Ver en tabla de inscripciones | Estado: "Retiro Justificado" |

### Banner que aparece

```
┌──────────────────────────────────────────────────────────────┐
│  ⚠️  [AZUL] border-blue-300, bg-blue-50                     │
│                                                              │
│  "La práctica Hospitalaria tiene un retiro justificado       │
│   pendiente. Puede reinscribirse en el siguiente período."   │
│                                                              │
│  ℹ️  "El estudiante puede reinscribirse en el siguiente      │
│      período en el mismo tipo de práctica."                  │
│                                                              │
│  [Cerrar]                                                    │
└──────────────────────────────────────────────────────────────┘
```

---

## Escenario 2: Abandono (Retirado)

| Campo | Valor |
|-------|-------|
| **PRACTICES_STATUS** | `0` (RETIRADO) |
| **WITHDRAWAL_TYPE** | `unjustified` |
| **OBSERVATION** | `RETIRO SIN JUSTIFICATIVO: [motivo]` |

### Comportamiento esperado en el navegador

| Acción | Resultado |
|--------|-----------|
| Inscribir **misma práctica** (P=1) en siguiente período | ⚠️ **RESTRINGIDO** |
| Inscribir **siguiente práctica** (P=2) | 🚫 **BLOQUEADO** — banner **ROJO** |
| Ver en tabla de inscripciones | Estado: "Retirado" |

### Banner que aparece

```
┌──────────────────────────────────────────────────────────────┐
│  ❌  [ROJO] border-red-300, bg-red-50                        │
│                                                              │
│  "La práctica Hospitalaria fue retirado en un período        │
│   anterior. Debe esperar hasta el próximo año lectivo        │
│   para reintentar."                                          │
│                                                              │
│  (NO se muestra guía de reinscripción)                       │
│                                                              │
│  [Cerrar]                                                    │
└──────────────────────────────────────────────────────────────┘
```

---

## Escenario 3: Reprobado

| Campo | Valor |
|-------|-------|
| **PRACTICES_STATUS** | `4` (REPROBADO) |
| **GRADE** | `< MINIMUM_GRADE` de la carrera |
| **OBSERVATION** | `Evaluación final: X/20. Calificación inferior al mínimo.` |

### Comportamiento esperado en el navegador

| Acción | Resultado |
|--------|-----------|
| Inscribir **misma práctica** (P=1) en siguiente período | ✅ **PERMITIDO** — puede volver a intentar |
| Inscribir **siguiente práctica** (P=2) | 🚫 **BLOQUEADO** — banner **ROJO** |
| Ver en tabla de inscripciones | Estado: "Reprobado" |

### Banner que aparece

```
┌──────────────────────────────────────────────────────────────┐
│  ❌  [ROJO] border-red-300, bg-red-50                        │
│                                                              │
│  "La práctica Hospitalaria fue reprobado en un período       │
│   anterior. Debe esperar hasta el próximo año lectivo        │
│   para reintentar."                                          │
│                                                              │
│  (NO se muestra guía de reinscripción)                       │
│                                                              │
│  [Cerrar]                                                    │
└──────────────────────────────────────────────────────────────┘
```

### Nota: Prioridad de bloqueo

Si un estudiante tiene **REPROBADO** + **RETIRO_JUSTIFICADO** en la misma práctica, el sistema muestra **REPROBADO** (prioridad más alta de bloqueo).

---

## Escenario 4: Aprobado (Culminado)

| Campo | Valor |
|-------|-------|
| **PRACTICES_STATUS** | `3` (CULMINADO) |
| **GRADE** | `>= MINIMUM_GRADE` de la carrera |
| **OBSERVATION** | `Evaluación final: X/20. Prueba aprobada.` |

### Comportamiento esperado en el navegador

| Acción | Resultado |
|--------|-----------|
| Inscribir **misma práctica** (P=1) en cualquier período | 🚫 **BLOQUEADO** — tipo excluido del dropdown |
| Inscribir **siguiente práctica** (P=2) | ✅ **PERMITIDO** — secuencia cumplida |
| Ver en tabla de inscripciones | Estado: "Culminado" |

### Comportamiento UI

El dropdown de selección de tipo de práctica **filtra automáticamente** los tipos que ya están CULMINADOS:

```typescript
// En pre-enrollments.controller.ts (línea 541-553):
// Tipos YA CULMINADOS en períodos anteriores (para evitar reinscripción)
const completedTypeIds = (completedTypes || []).map(r => r.INTERNSHIP_TYPE_ID);

// Unir: excluir tipos ya registrados en este período O ya culminados
return [...new Set([...currentTypeIds, ...completedTypeIds])];
```

---

## Tabla de Referencia Rápida

| Estado | Código | ¿Puede re-inscribir misma práctica? | ¿Puede inscribir siguiente? | Banner |
|--------|--------|-------------------------------------|------------------------------|--------|
| **Retiro Justificado** | 5 | ✅ Sí (siguiente período) | 🚫 No | 🔵 AZUL |
| **Abandono (Retirado)** | 0 | ⚠️ Restringido | 🚫 No | 🔴 ROJO |
| **Reprobado** | 4 | ✅ Sí (puede reintentar) | 🚫 No | 🔴 ROJO |
| **Aprobado (Culminado)** | 3 | 🚫 No (ya aprobó) | ✅ Sí | — |

---

## Cómo probar en el navegador

### Paso 1: Preparar datos
1. Ejecuta el SQL de `test-scenarios-enrollment-processes.sql` en Supabase
2. Verifica que los registros se crearon con las queries de verificación

### Paso 2: Probar cada escenario
1. Ve a **Pre-inscripción** → Seleccionar estudiante de prueba
2. Seleccionar **carrera** (ej: Ingeniería Informática)
3. Intentar seleccionar **tipo de práctica**:
   - Si el estudiante tiene CULMINADO en HOSP → HOSP no aparece en dropdown
   - Si intenta inscribir COMUNITARIA sin tener HOSP aprobada → aparece banner

### Paso 3: Verificar comportamiento
- **Retiro Justificado**: Banner azul con mensaje de reinscripción
- **Abandono/Reprobado**: Banner rojo sin guía de reinscripción
- **Aprobado**: Tipo de práctica no aparece en selección

---

## Notas técnicas

### Validación secuencial (D-05)
Ubicación: `backend/src/utils/sequential-validation.ts`

### Estados de práctica
Ubicación: `src/constants/practiceStatus.ts`

```typescript
PRACTICES_STATUS = {
  RETIRADO: 0,
  PRE_INSCRITO: 1,
  INSCRITO: 2,
  CULMINADO: 3,
  REPROBADO: 4,
  RETIRO_JUSTIFICADO: 5,
}
```

### Lógica de filtrado en pre-inscripción
Ubicación: `backend/src/controllers/pre-enrollments.controller.ts` (línea 526-553)
