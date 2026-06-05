# Tasks: Agregación de evaluaciones de comité (3 miembros)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 250-350 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-always |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

## Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | DB migration + backend createEvaluation | PR 1 | Base functionality |
| 2 | Backend status aggregation + updatePracticeGrade | PR 1 | Depends on unit 1 |
| 3 | Frontend types + service + hook | PR 1 | Depends on unit 2 |
| 4 | Frontend EvaluationModal + EvaluationsList | PR 1 | Depends on unit 3 |

All units within a single PR (~300 lines). No chaining needed.

## Phase 1: Base de datos

- [x] 1.1 Agregar migración SQL: columna `COMITE_MEMBER_INDEX` con CHECK constraint, actualizar `chk_score_range` a 1-10
- [ ] 1.2 Actualizar `DB-postgres.sql` con los nuevos constraints como referencia

## Phase 2: Backend — creación

- [x] 2.1 Agregar `comiteMemberIndex` al tipo `CreateEvaluationData` en `evaluation.controller.ts`
- [x] 2.2 Modificar validación de existencia en `createEvaluation`: para COMITE verificar por `(PRACTICE_ID, EVALUATOR_TYPE, COMITE_MEMBER_INDEX)`; para otros como antes
- [x] 2.3 Insertar `COMITE_MEMBER_INDEX` en la query de creación
- [x] 2.4 Devolver `comiteMemberIndex` en `getEvaluations` y `getEvaluationById`

## Phase 3: Backend — agregación y estado

- [x] 3.1 Modificar `getPracticeEvaluationStatus` para COMITE: obtener todas las evaluaciones COMITE, calcular promedio por criteria_id, devolver `completedCount: "X/3"` y array de `members`
- [x] 3.2 Modificar `updatePracticeGrade` para COMITE: contar evaluaciones, si 3 → promediar scores, aplicar weight, calcular GRADE final

## Phase 4: Frontend — tipos y servicio

- [x] 4.1 Agregar `comiteMemberIndex?: number` a `CreateEvaluationPayload` y `Evaluation` en types
- [x] 4.2 Refactor `EvaluationStatus.evaluations.COMITE` para incluir `completedCount` y `members` array
- [x] 4.3 Passthrough de `comiteMemberIndex` en `evaluationService.ts` → `createEvaluation`

## Phase 5: Frontend — modal y tabla

- [x] 5.1 `EvaluationModal`: agregar selector de miembro (tabs/botones "Miembro #1, #2, #3") solo cuando `evaluatorType === 'COMITE'`
- [x] 5.2 `EvaluationModal`: pasar `comiteMemberIndex` en el payload de submit
- [x] 5.3 `EvaluationsList`: columna COMITE muestra `completedCount` ("1/3", "2/3", "3/3") con badges de estado por miembro

## Phase 6: Verificación

- [x] 6.1 Compilar TypeScript frontend (`npx tsc --noEmit`)
- [x] 6.2 Compilar TypeScript backend (`cd backend && npx tsc --noEmit`)
- [x] 6.3 Migración aplicada a Supabase correctamente
