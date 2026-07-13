# Análisis de Flujos de Prácticas Profesionales con N Tipos

> **Fecha**: 2026-07-13  
> **Proyecto**: UNEFA Dashboard  
> **Alcance**: Inscripción, Evaluación y Culminación de prácticas con N tipos por carrera

---

## 1. Resumen Ejecutivo

Este documento analiza los flujos de negocio para prácticas profesionales donde los estudiantes deben completar **N tipos de práctica en secuencia** (ej: Enfermería → Hospitalaria → Comunitaria). Se identifican los casos de uso, reglas de negocio, estados del sistema, y brechas de implementación.

---

## 2. Modelo de Datos Actual

### 2.1 Tablas Principales

```
┌─────────────────────────────────────────────────────────────────────┐
│                    t_internship_type                                │
│  INTERNSHIP_TYPE_ID │ NAME │ PRIORITY │ STATUS                     │
│  (PK)               │      │ (0=standalone, 1=primera, 2=segunda) │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│              t_career_internship_type                               │
│  ID_CAREER_INTERNSHIP_TYPE_ID │ CAREER_ID │ INTERNSHIP_TYPE_ID     │
│  (PK)                          │ (FK)      │ (FK)                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│           t_professional_practices (Tabla Central)                  │
│  PROFESSIONAL_PRACTICE_ID │ STUDENTS_ID │ INTERNSHIP_TYPE_ID       │
│  PERIOD_ID │ CAREER_ID │ PRACTICES_STATUS │ GRADE │ EVALUATION_STATUS│
│  PREVIOUS_PRACTICE_ID │ START_DATE │ END_DATE │ FROZEN_AT          │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│              t_practice_culmination                                 │
│  PRACTICE_CULMINATION_ID │ PROFESSIONAL_PRACTICE_ID                 │
│  STATUS (0=pending, 1=approved, 2=certified)                       │
│  CERTIFICATE_NUMBER │ CERTIFIED_AT │ RESOLUTION_NUMBER              │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Estados de Práctica (PRACTICES_STATUS)

| Código | Estado | Descripción |
|--------|--------|-------------|
| 0 | RETIRADO | Retiro injustificado o sin justificativo |
| 1 | PRE_INSCRITO | Pre-inscrito, pendiente de inscripción formal |
| 2 | INSCRITO | Inscrito activo, en desarrollo |
| 3 | CULMINADO | Culminado con evaluación final |
| 4 | REPROBADO | Reprobado (no alcanzó nota mínima) |
| 5 | RETIRO_JUSTIFICADO | Retiro con justificativo administrativo |

### 2.3 Estados de Período (PERIOD_STATUS)

| Código | Estado | Descripción |
|--------|--------|-------------|
| 1 | PENDIENTE | Período no iniciado |
| 2 | EN_CURSO | Período activo |
| 3 | CULMINADO | Período cerrado |

---

## 3. Casos de Uso Identificados

### 3.1 Flujo Base: Prácticas en Secuencia (N tipos)

```
┌─────────────────────────────────────────────────────────────────────┐
│  FLUJO SECUENCIAL PARA CARRERA CON N TIPOS                        │
│                                                                     │
│  [1] PREINSCRIPCIÓN TIPO 1 (PRIORITY=1)                           │
│      └── Crea registro: PRACTICES_STATUS = PRE_INSCRITO (1)       │
│      └── Valida: No existe inscripción activa para mismo tipo     │
│      └── Valida: Secuencia correcta (no tiene prerrequisitos)     │
│                                                                     │
│  [2] INSCRIPCIÓN TIPO 1                                            │
│      └── Convierte: PRE_INSCRITO(1) → INSCRITO(2)                │
│      └── Asigna: Tutores, Institución, Fechas                     │
│      └── Valida: Período en curso o con días de gracia            │
│                                                                     │
│  [3] EVALUACIÓN TIPO 1                                             │
│      └── Flujo: INSTITUCIONAL → ACADEMICO → COMITE(1,2,3)        │
│      └── Cierra actas: Calcula nota final                         │
│      └── Resultado: CULMINADO(3) o REPROBADO(4)                  │
│                                                                     │
│  [4] CULMINACIÓN TIPO 1                                            │
│      └── Flujo: pending → approved → certified                    │
│      └── Certificación conjunta si hay tipos hermanos             │
│      └── Genera PDF con datos de la práctica                      │
│                                                                     │
│  [5] PREINSCRIPCIÓN TIPO 2 (PRIORITY=2)                           │
│      └── Valida: Tipo 1 está CULMINADO y APROBADO                │
│      └── Asigna PREVIOUS_PRACTICE_ID = ID Tipo 1                 │
│      └── Crea registro: PRACTICES_STATUS = PRE_INSCRITO (1)       │
│                                                                     │
│  [6] Repite pasos [2]-[4] para Tipo 2                             │
│                                                                     │
│  [7] CERTIFICACIÓN FINAL                                           │
│      └── Solo si TODOS los tipos están CULMINADO                  │
│      └── Certificación conjunta para N tipos                      │
│      └── Genera certificado final de la materia                   │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Casos de Uso Detallados

#### CU-001: Preinscripción de Primera Práctica

**Actor**: Administrador  
**Precondición**: Estudiante activo, carrera con tipos de práctica configurados  
**Flujo**:
1. Admin selecciona estudiante y carrera
2. Sistema auto-selecciona tipo con PRIORITY=1 (primera práctica)
3. Valida que no exista preinscripción o inscripción activa para ese tipo
4. Crea registro en `t_professional_practices` con `PRACTICES_STATUS=1`

**Postcondición**: Registro creado en estado PRE_INSCRITO

#### CU-002: Preinscripción de Práctica Siguiente (N > 1)

**Actor**: Administrador  
**Precondición**: Tipo anterior CULMINADO y APROBADO  
**Flujo**:
1. Admin selecciona estudiante que completó tipo anterior
2. Sistema valida secuencia: tipo anterior CULMINADO + GRADE >= MINIMUM_GRADE
3. Asigna `PREVIOUS_PRACTICE_ID` al registro anterior
4. Crea nuevo registro con `PRACTICES_STATUS=1`

**Postcondición**: Nuevo registro creado, vinculado al anterior

#### CU-003: Conversión Preinscripción → Inscripción

**Actor**: Administrador  
**Precondición**: Registro en estado PRE_INSCRITO  
**Flujo**:
1. Admin completa datos: tutores, institución, fechas
2. Convierte `PRACTICES_STATUS` de 1 a 2
3. Valida que el período esté en curso o con días de gracia

**Postcondición**: Práctica activa en estado INSCRITO

#### CU-004: Evaluación y Cierre de Actas

**Actor**: Evaluador (Institucional/Académico/Comité)  
**Precondición**: Práctica en estado INSCRITO  
**Flujo**:
1. Evaluadores registran puntajes por criterio
2. Admin cierra actas
3. Sistema calcula nota final (ponderada por tipo de evaluador)
4. Si GRADE >= MINIMUM_GRADE → CULMINADO(3)
5. Si GRADE < MINIMUM_GRADE → REPROBADO(4)
6. Crea/actualiza registro en `t_practice_culmination`

**Postcondición**: Evaluación completada, estado actualizado

#### CU-005: Culminación y Certificación

**Actor**: Administrador  
**Precondición**: Práctica CULMINADA  
**Flujo**:
1. Admin aprueba culminación
2. Sistema verifica que todos los tipos requeridos estén CULMINADO
3. Genera certificado (individual o conjunto)
4. Asigna número de certificado y fecha

**Postcondición**: Certificado generado, estado = certified

#### CU-006: Retiro con Justificativo

**Actor**: Administrador/Estudiante  
**Precondición**: Práctica en estado INSCRITO o PRE_INSCRITO  
**Flujo**:
1. Admin registra retiro con justificativo
2. Cambia `PRACTICES_STATUS` a RETIRO_JUSTIFICADO(5)
3. Opcionalmente extiende fecha o reactiva después

**Postcondición**: Práctica en estado RETIRO_JUSTIFICADO

#### CU-007: Retiro sin Justificativo / Abandono

**Actor**: Sistema/Administrador  
**Precondición**: Práctica inactiva o con incumplimientos  
**Flujo**:
1. Admin marca retiro injustificado o abandono
2. Cambia `PRACTICES_STATUS` a RETIRADO(0)
3. Opcionalmente marca como REPROBADO(4)

**Postcondición**: Práctica en estado RETIRADO o REPROBADO

---

## 4. Reglas de Negocio

### 4.1 Validación Secuencial

```typescript
// Fuente: backend/src/utils/sequential-validation.ts
// Convención: priority 1 = primera práctica, priority 2 = segunda, etc.
// Ejemplo: COM (PRIORITY=1) debe estar CULMINADA antes de inscribir HOSP (PRIORITY=2)

if (currentType.PRIORITY <= 1) {
  return { valid: true }; // Sin prerrequisitos
}

// Verificar que al menos una práctica con priority MENOR esté CULMINADA + APROBADA
const validCulminations = completedPrerequisite.filter(
  (p) => !p.t_culmination_reversals?.length && p.GRADE >= minimumGrade
);

if (validCulminations.length === 0) {
  return {
    valid: false,
    message: `Debe completar y aprobar ${typeName} antes de continuar con esta práctica.`
  };
}
```

### 4.2 Reglas de Período

| Regla | Descripción |
|-------|-------------|
| R-01 | No se puede preinscribir en mismo tipo + mismo período |
| R-02 | Re-inscripción requiere período siguiente (no el mismo) |
| R-03 | Período debe estar EN_CURSO o con días de gracia activos |
| R-04 | Cierre de período con pendientes requiere decisión del admin |

### 4.3 Reglas de Estado

| Regla | Transición | Condición |
|-------|------------|-----------|
| R-05 | PRE_INSCRITO → INSCRITO | Admin completa inscripción |
| R-06 | INSCRITO → CULMINADO | Evaluación aprobada (GRADE >= mínima) |
| R-07 | INSCRITO → REPROBADO | Evaluación reprobada (GRADE < mínima) |
| R-08 | INSCRITO → RETIRO_JUSTIFICADO | Retiro con justificativo |
| R-09 | INSCRITO → RETIRADO | Retiro injustificado o abandono |
| R-10 | PRE_INSCRITO → RETIRADO | Cancelación de preinscripción |
| R-11 | RETIRO_JUSTIFICADO → INSCRITO | Reactivación (extensión) |
| R-12 | REPROBADO → INSCRITO | Reversión administrativa |

### 4.4 Reglas de Certificación

| Regla | Descripción |
|-------|-------------|
| R-13 | Certificación solo si TODOS los tipos están CULMINADO |
| R-14 | Certificación conjunta para tipos hermanos (mismo estudiante + carrera) |
| R-15 | Certificado requiere: todos los tipos CULMINADO + FROZEN + aprobados |

---

## 5. Diagrama de Estados del Estudiante

```
                                    ┌─────────────────┐
                                    │   SIN PRÁCTICA  │
                                    └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │  PRE_INSCRITO   │
                                    │   (PRIORITY=1)  │
                                    └────────┬────────┘
                                             │
                              ┌──────────────┴──────────────┐
                              │                             │
                              ▼                             ▼
                    ┌─────────────────┐           ┌─────────────────┐
                    │    INSCRITO     │           │    RETIRADO     │
                    │  (en desarrollo)│           │  (sin justif.)  │
                    └────────┬────────┘           └─────────────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
   ┌─────────────────┐ ┌──────────────┐ ┌─────────────────┐
   │   CULMINADO     │ │  REPROBADO   │ │ RETIRO_JUSTIFICADO│
   │  (aprobado)     │ │  (reprobado) │ │  (con justif.)   │
   └────────┬────────┘ └──────────────┘ └────────┬────────┘
            │                                     │
            │                                     ▼
            │                            ┌─────────────────┐
            │                            │  REACTIVACIÓN   │
            │                            │  → INSCRITO     │
            │                            └─────────────────┘
            │
            ▼
   ┌─────────────────┐
   │ PRE_INSCRITO    │
   │  (PRIORITY=2)   │
   │  (siguiente tipo)│
   └────────┬────────┘
            │
            ▼
         ... (repite ciclo)
            │
            ▼
   ┌─────────────────┐
   │  CERTIFICADO    │
   │  (todos los     │
   │   tipos OK)     │
   └─────────────────┘
```

---

## 6. Diagrama de Secuencia: Flujo Completo

```
Admin          Sistema         DB              Evaluadores
  │               │             │                  │
  │  1. Preinscribir Tipo 1    │                  │
  │──────────────>│             │                  │
  │               │ 2. Validar  │                  │
  │               │────────────>│                  │
  │               │ 3. OK       │                  │
  │               │<────────────│                  │
  │               │ 4. Crear    │                  │
  │               │────────────>│                  │
  │  5. OK        │             │                  │
  │<──────────────│             │                  │
  │               │             │                  │
  │  6. Inscribir Tipo 1       │                  │
  │──────────────>│             │                  │
  │               │ 7. Actualizar                 │
  │               │────────────>│                  │
  │               │             │                  │
  │               │ 8. Evaluar  │                  │
  │               │             │<─────────────────│
  │               │             │  9. Puntajes     │
  │               │             │─────────────────>│
  │               │             │                  │
  │  10. Cerrar actas          │                  │
  │──────────────>│             │                  │
  │               │ 11. Calcular│                  │
  │               │────────────>│                  │
  │               │ 12. CULMINADO                 │
  │               │<────────────│                  │
  │               │             │                  │
  │  13. Preinscribir Tipo 2   │                  │
  │──────────────>│             │                  │
  │               │ 14. Validar secuencia         │
  │               │────────────>│                  │
  │               │ 15. OK (Tipo 1 CULMINADO)     │
  │               │<────────────│                  │
  │               │ 16. Crear con PREVIOUS_PRACTICE_ID
  │               │────────────>│                  │
  │  17. OK       │             │                  │
  │<──────────────│             │                  │
  │               │             │                  │
  │  18. Inscribir Tipo 2      │                  │
  │──────────────>│             │                  │
  │               │ ... (repite ciclo)             │
  │               │             │                  │
  │  19. Certificar            │                  │
  │──────────────>│             │                  │
  │               │ 20. Verificar todos tipos OK  │
  │               │────────────>│                  │
  │               │ 21. Generar certificado        │
  │               │<────────────│                  │
  │  22. Certificado OK        │                  │
  │<──────────────│             │                  │
```

---

## 7. Análisis de Brechas (Gap Analysis)

### 7.1 Brechas Críticas

| # | Brecha | Impacto | Estado |
|---|--------|---------|--------|
| 1 | **Sin auto-inscripción** — Preinscripción crea PRE_INSCRITO(1) pero no hay conversión automática a INSCRITO(2). El admin debe navegar manualmente a la página de Inscripción. | Sobrecarga administrativa | ❌ No implementado |
| 2 | **Validación cross-period** — `getCompletedPracticeTypes` solo verifica dentro del MISMO período. Un estudiante podría inscribir Tipo 2 mientras Tipo 1 está RETIRADO/REPROBADO en otro período. | Violación de regla de negocio | ⚠️ Parcial |
| 3 | **Re-inscripción post-retiro** — Después de RETIRO_JUSTIFICADO(5), no hay preinscripción automática para el siguiente período. El admin debe crear manualmente. | Sobrecarga administrativa | ❌ No implementado |
| 4 | **Sin notificación de certificación** — El certificado solo se genera cuando TODOS los tipos están CULMINADO, pero no hay alerta cuando todos están listos. | Certificaciones perdidas | ❌ No implementado |
| 5 | **Limbo de cierre de período** — Prácticas INSCRITO(2) sin evaluaciones quedan en limbo después del cierre. No hay política clara. | Integridad de datos | ❌ No implementado |

### 7.2 Brechas Menores

| # | Brecha | Impacto | Estado |
|---|--------|---------|--------|
| 6 | **Flujo manual vs automático** — La conversión preinscripción → inscripción es manual. Los devs discutieron si debería ser automática. | Decisión pendiente | 🔄 En discusión |
| 7 | **Certificación conjunta** — La lógica existe pero no hay UI clara para certificar todos los tipos de una vez. | UX confusa | ⚠️ Parcial |
| 8 | **Reversión de evaluación** — Existe `reverseFailedPractice` pero el flujo completo de reversión y re-inscripción no está documentado. | Falta documentación | ⚠️ Parcial |

---

## 8. Escenarios Problemáticos (de la Conversación de Devs)

### 8.1 "¿Qué pasa cuando cierra el período y hay inscripciones sin evaluar?"

**Situación**: El admin cierra el período pero hay prácticas en estado INSCRITO(2) sin evaluaciones completas.

**Opciones discutidas**:
1. **Advertencia antes de cerrar** — Mostrar lista de prácticas pendientes y preguntar qué hacer
2. **Marcar como abandono automático** — Cambiar a RETIRADO(0) o REPROBADO(4)
3. **Dejar en limbo** — No cambiar estado, pero bloquear ediciones

**Recomendación**: Opción 1 (advertencia) + Opción 2 (marcar como REPROBADO con observación "Cierre de período sin evaluación")

### 8.2 "¿Preinscripción automática al siguiente tipo o manual?"

**Situación**: Después de aprobar Tipo 1, ¿el sistema debería pre-inscribir automáticamente en Tipo 2?

**Argumentos a favor (automático)**:
- Reduce carga administrativa
- Garantiza continuidad del flujo
- Evita que el estudiante se "pierda" entre tipos

**Argumentos en contra (manual)**:
- Permite al admin decidir si el estudiante continúa
- Maneja casos donde el estudiante no desea continuar
- Flexibilidad para retiros o cambios de carrera

**Recomendación**: **Opción configurable** — Un setting por carrera que determine si la preinscripción es automática o manual. Default: manual (como pidió la dev de enfermería).

### 8.3 "¿El estudiante permanece en preinscripción o sale del flujo?"

**Situación**: En Enfermería, el estudiante podría "nunca salir de preinscripción" pero se desactiva la opción de exportar hasta que apruebe el tipo actual.

**Análisis**: Esto sugiere que el estado PRE_INSCRITO debería tener sub-estados o indicadores:
- `PRE_INSCRITO_ACTIVO` — Esperando inscripción
- `PRE_INSCRITO_BLOQUEADO` — No puede inscribirse hasta aprobar tipo anterior

**Recomendación**: Agregar campo `BLOCKED_BY_PRACTICE_ID` a `t_professional_practices` para indicar qué práctica bloqua la inscripción.

### 8.4 "¿Qué pasa si no se inscribe en comunitario después de aprobar hospitalaria?"

**Situación**: El estudiante aprueba Tipo 1 pero nunca se inscribe en Tipo 2.

**Opciones**:
1. **Notificación automática** — Alertar al admin después de X días
2. **Timeout de preinscripción** — Si no se inscribe en Y días, marcar como abandonado
3. **Sin acción** — Dejar que el admin lo maneje manualmente

**Recomendación**: Opción 1 (notificación) con timeout configurable por carrera.

---

## 9. Recomendaciones de Implementación

### 9.1 Cambios en Backend

| Prioridad | Cambio | Archivos Afectados |
|-----------|--------|-------------------|
| 🔴 Alta | Agregar validación cross-period en `sequential-validation.ts` | `sequential-validation.ts`, `pre-enrollments.controller.ts` |
| 🔴 Alta | Implementar auto-preinscripción opcional después de CULMINADO | `evaluation.controller.ts`, `culmination.controller.ts` |
| 🟡 Media | Agregar advertencia de cierre de período con pendientes | `periods.controller.ts`, `period-validator.middleware.ts` |
| 🟡 Media | Agregar timeout de preinscripción | `pre-enrollments.controller.ts`, scheduler |
| 🟢 Baja | Agregar notificación de certificación lista | `culmination.controller.ts`, `notifications.service.ts` |

### 9.2 Cambios en Frontend

| Prioridad | Cambio | Archivos Afectados |
|-----------|--------|-------------------|
| 🔴 Alta | Agregar flujo de auto-inscripción post-preinscripción | `PreEnrollmentModal.tsx`, `EnrollmentModal.tsx` |
| 🔴 Alta | Mostrar práctica bloqueante en UI de preinscripción | `PreEnrollmentTable.tsx` |
| 🟡 Media | Agregar modal de cierre de período con pendientes | `PeriodModal.tsx` |
| 🟡 Media | Agregar indicador de progreso de tipos | `CulminationPage` |
| 🟢 Baja | Agregar notificación de certificación lista | `NotificationBell.tsx` |

### 9.3 Cambios en Modelo de Datos

```sql
-- Opcional: Agregar campo de bloqueo
ALTER TABLE t_professional_practices 
ADD COLUMN BLOCKED_BY_PRACTICE_ID INT REFERENCES t_professional_practices(PROFESSIONAL_PRACTICE_ID);

-- Opcional: Agregar campo de auto-preinscripción por carrera
ALTER TABLE t_career 
ADD COLUMN AUTO_PRE_ENROLL BOOLEAN DEFAULT FALSE;

-- Opcional: Agregar campo de timeout de preinscripción
ALTER TABLE t_career 
ADD COLUMN PRE_ENROLL_TIMEOUT_DAYS INT DEFAULT 30;
```

---

## 10. Decisiones

| # | Decisión | Decisión | Notas |
|---|----------|----------|-------|
| D-01 | ¿Preinscripción automática o manual? | **Automática** | Para carreras con N tipos donde PRIORITY ≠ 0. Después de CULMINADO Tipo N, auto-preinscribir Tipo N+1 |
| D-02 | ¿Qué pasa con prácticas INSCRITO al cierre de período? | **Advertencia con decisión individual** | El admin decide caso por caso: retiro justificado o abandono |
| D-03 | ¿Timeout de preinscripción? | **Auto-cancelar + notificar** | Después de X días sin convertir a inscripción, marcar RETIRADO y notificar al admin |
| D-04 | ¿Notificación de certificación lista? | **Todas las opciones, no bloqueantes** | Anotadas para futuro: certificación lista, retiro justificado próximo a vencer, evaluación pendiente larga |
| D-05 | ¿Cross-period validation estricta? | **Bloquear con warning** | Ver reglas abajo |

### D-05: Reglas de Validación Cross-Period

#### Retiro Justificado vs Abandono/Reprobado

| Escenario | Progreso | Re-inscripción | Periodo mínimo |
|-----------|----------|----------------|----------------|
| **Retiro Justificado** | Se conserva (sigue en el tipo donde estaba) | En el mismo tipo donde se retiró | Siguiente período (ej: 2026-1 → 2026-2) |
| **Abandono / Reprobado** | Se pierde (debe empezar desde Tipo 1) | Desde Tipo 1 | Siguiente año (ej: 2026-1 → 2027-1) |

**Nota**: La regla de "esperar siguiente año para reprobados" es un **parámetro de configuración** (puede cambiar).

#### Cierre de Período con Pendientes

1. Sistema muestra lista de prácticas INSCRITO sin evaluar
2. Admin decide **por práctica individual**: "¿Retiro justificado o abandono?"
3. Si retiro justificado → se marca RETIRO_JUSTIFICADO(5), estudiante puede retomar
4. Si abandono → se marca REPROBADO(4), estudiante pierde progreso

#### Validación Cross-Period

- **Bloquear** inscripción de Tipo N si Tipo 1..N-1 tiene estado RETIRADO/REPROBADO en cualquier período
- **Mostrar warning** explicando por qué está bloqueado y qué necesita resolver el estudiante

### D-02: Cierre de Período con Pendientes

Al culminar período (por botón o cumplimiento de fecha), el sistema:

1. **Notifica** sobre prácticas con pendientes:
   - Pre-inscripciones que no se convirtieron en inscripción
   - Inscripciones sin evaluación
   - Inscripciones sin culminación

2. **Muestra modal** con opciones **por práctica individual**:

| Opción | Acción | Resultado |
|--------|--------|-----------|
| **Extender período** | Agregar días de gracia | Permite evaluar dentro del período extendido |
| **Inscribir y evaluar** | Convertir PRE_INSCRITO → INSCRITO | Evaluar dentro de "Días Evaluación Post-Cierre" |
| **Marcar estado** | Retiro justificado o Abandono | Según decisión del admin |

### D-03: Timeout de Preinscripción

- **Auto-cancelar** después de X días sin convertir a inscripción
- Marcar como RETIRADO(0)
- Notificar al admin
- Si el estudiante tenía retiro justificado, puede re-inscribir en el siguiente período

### D-04: Notificaciones Adicionales (Futuro, no bloqueantes)

Las siguientes notificaciones están anotadas para implementación futura, pero no son bloqueantes para esta sesión:

| Notificación | Descripción | Prioridad |
|--------------|-------------|-----------|
| **Certificación lista** | Cuando TODOS los tipos de práctica de un estudiante están CULMINADO y listos para certificar | Alta |
| **Retiro justificado próximo a vencer** | Alertar cuando un estudiante con retiro justificado está por perder su derecho a re-inscribir | Media |
| **Evaluación pendiente larga** | Notificar si una práctica lleva X días inscrita sin evaluación | Media |

---

## 11. Diagrama de Flujo Completo (Actual vs Propuesto)

### Estado Actual

```
┌─────────────────────────────────────────────────────────────────────┐
│  FLUJO ACTUAL (Manual)                                             │
│                                                                     │
│  Admin: Preinscribir Tipo 1 → Ir a Inscripción → Inscribir        │
│       → Ir a Evaluación → Evaluar → Cerrar Actas                  │
│       → Ir a Culminación → Certificar                              │
│       → Volver a Preinscripción → Preinscribir Tipo 2             │
│       → ... (repite todo manualmente)                              │
└─────────────────────────────────────────────────────────────────────┘
```

### Estado Propuesto

```
┌─────────────────────────────────────────────────────────────────────┐
│  FLUJO PROPUESTO (Semi-automático)                                 │
│                                                                     │
│  Admin: Preinscribir Tipo 1                                        │
│       → Inscribir (puede ser automático si está configurado)       │
│       → Evaluar → Cerrar Actas                                     │
│       → Si hay Tipo 2: Auto-preinscribir (o preguntar)            │
│       → Si es último tipo: Auto-preparar certificación             │
│       → Certificar (conjunta si hay tipos hermanos)                │
│                                                                     │
│  Sistema: Notifica cuando certificación está lista                 │
│         → Advierte al cerrar período con pendientes                │
│         → Maneja timeouts de preinscripción                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 12. Conclusión

El sistema actual maneja bien el flujo base de prácticas con N tipos, pero tiene brechas importantes en:

1. **Automatización** — Demasiados pasos manuales para el admin
2. **Validación cross-period** — No valida correctamente entre períodos
3. **Manejo de cierre** — No hay política clara para prácticas pendientes
4. **Notificaciones** — Falta alertas para certificaciones listas

Las recomendaciones son priorizadas por impacto y esfuerzo de implementación. Se sugiere começar por las brechas críticas (auto-inscripción, validación cross-period) y luego las menores.

---

**Documento generado por**: Gentle AI SDD Orchestrator  
**Fecha**: 2026-07-13  
**Versión**: 1.0
