# Proposal: Agregación de evaluaciones de comité (3 miembros)

## Intent

El comité evaluador tiene 3 miembros que evalúan una práctica. Actualmente el sistema solo permite UNA evaluación COMITE. Necesitamos soportar 3 evaluaciones independientes por práctica y agregar los scores por criterio (promedio) para calcular la nota final del comité.

## Scope

### In Scope
- Columna `COMITE_MEMBER_INDEX` (1-3) en `t_evaluation`
- Actualizar CHECK constraint `chk_score_range` de 1-5 a 1-10
- Backend: crear evaluación con índice de miembro; marcar COMITE como completado solo al llegar a 3
- Backend: `getPracticeEvaluationStatus` debe agregar scores promediando por criterio
- Frontend: `EvaluationModal` — selector de miembro del comité (1/2/3)
- Frontend: `EvaluationsList` — progreso "X/3 completadas" en columna COMITE

### Out of Scope
- CRUD de miembros del comité (quién es cada miembro)
- Permisos por miembro de comité
- Cambios en evaluaciones INSTITUCIONAL, ACADEMICO o TUTOR

## Approach

1. **DB**: Migración para agregar `COMITE_MEMBER_INDEX INT CHECK(1-3)` nullable en `t_evaluation`, actualizar `chk_score_range` a 1-10
2. **Backend**: `createEvaluation` recibe `comiteMemberIndex`, guarda con `EVALUATOR_TYPE = 'COMITE'`. `getPracticeEvaluationStatus` cuenta evaluaciones COMITE, promedia scores por `evaluation_criteria_id` si hay 2-3, suma para total
3. **Frontend**: Modal muestra selector de miembro cuando el tipo es COMITE. Tabla muestra badges de progreso

## Risks

| Risk | Probabilidad | Mitigación |
|------|-------------|------------|
| Scores existentes se pierden al migrar chk_score_range | Baja | ALTER CONSTRAINT, no modifica datos |
| Cálculo de nota final se desvía | Media | Verificar con datos de prueba |

## Success Criteria

- [ ] Se pueden crear 3 evaluaciones COMITE para una misma práctica
- [ ] El status muestra "3/3 completadas" cuando las 3 están listas
- [ ] La nota final del comité es el promedio de scores por criterio
- [ ] Evaluaciones INSTITUCIONAL/ACADEMICO siguen funcionando igual
