# Delta for Evaluations

## ADDED Requirements

### Requirement: COMITE_MEMBER_INDEX

Las evaluaciones de tipo COMITE DEBEN incluir un índice de miembro (1, 2, o 3) para permitir múltiples evaluaciones sobre una misma práctica.

#### Scenario: Crear evaluación COMITE #1

- GIVEN una práctica sin evaluaciones COMITE
- WHEN se crea una evaluación con `evaluatorType: 'COMITE'` y `comiteMemberIndex: 1`
- THEN se guarda exitosamente con `COMITE_MEMBER_INDEX = 1`

#### Scenario: Crear evaluación COMITE #2 y #3

- GIVEN ya existe una evaluación COMITE #1 para la práctica
- WHEN se crean evaluaciones COMITE #2 y #3
- THEN ambas se guardan exitosamente

#### Scenario: Crear evaluación duplicada (mismo índice)

- GIVEN ya existe una evaluación COMITE #1 para la práctica
- WHEN se intenta crear otra evaluación COMITE con `comiteMemberIndex: 1`
- THEN el sistema DEBE rechazar con error "Ya existe una evaluación del miembro #1 para esta práctica"

#### Scenario: Crear evaluación COMITE sin índice

- WHEN se crea una evaluación COMITE sin `comiteMemberIndex`
- THEN el sistema DEBE rechazar con error "comiteMemberIndex es requerido para evaluaciones COMITE"

### Requirement: Agregación de scores COMITE

El endpoint `getPracticeEvaluationStatus` DEBE agregar múltiples evaluaciones COMITE promediando scores por criterio.

#### Scenario: Una evaluación COMITE

- GIVEN solo existe evaluación COMITE #1
- WHEN se consulta el estado
- THEN `status.evaluations.COMITE.completed` DEBE ser `false`
- THEN `COMITE` DEBE mostrar `completedCount: "1/3"`

#### Scenario: Dos evaluaciones COMITE

- GIVEN existen evaluaciones COMITE #1 y #2
- WHEN se consulta el estado
- THEN `status.evaluations.COMITE.completed` DEBE ser `false`
- THEN DEBE mostrar "2/3"
- THEN el score mostrado DEBE ser el promedio de ambas evaluaciones

#### Scenario: Tres evaluaciones COMITE

- GIVEN existen evaluaciones COMITE #1, #2 y #3
- WHEN se consulta el estado
- THEN `status.evaluations.COMITE.completed` DEBE ser `true`
- THEN el score DEBE ser la suma de promedios por criterio de las 3 evaluaciones

### Requirement: CHECK constraint chk_score_range

La constraint `chk_score_range` en `t_evaluation_detail` DEBE permitir scores de 1 a 10.

#### Scenario: Score válido 1-10

- GIVEN un detail con `SCORE = 10`
- WHEN se inserta en `t_evaluation_detail`
- THEN se guarda exitosamente

#### Scenario: Score inválido > 10

- GIVEN un detail con `SCORE = 15`
- WHEN se inserta en `t_evaluation_detail`
- THEN el sistema DEBE rechazar con error de constraint

## MODIFIED Requirements

### Requirement: Crear evaluación — verificación de existencia

El sistema DEBE verificar existencia por `(PRACTICE_ID, EVALUATOR_TYPE, COMITE_MEMBER_INDEX)` para COMITE y por `(PRACTICE_ID, EVALUATOR_TYPE)` para los demás tipos.
(Previously: verificaba solo por PRACTICE_ID + EVALUATOR_TYPE para todos los tipos)

#### Scenario: Crear INSTITUCIONAL sin duplicado

- GIVEN ya existe evaluación INSTITUCIONAL para la práctica
- WHEN se intenta crear otra INSTITUCIONAL
- THEN se rechaza con error "Ya existe una evaluación de este tipo"

#### Scenario: Crear COMITE #2 permitido aunque exista COMITE #1

- GIVEN ya existe COMITE #1
- WHEN se crea COMITE #2
- THEN se guarda exitosamente

### Requirement: EvaluatorType y tipos frontend

`CreateEvaluationPayload` DEBE incluir `comiteMemberIndex?: number` opcional. `Evaluation` DEBE incluir `comiteMemberIndex?: number`. `EvaluationStatus.evaluations.COMITE` DEBE cambiar a estructura que incluya `completedCount: string` (e.g., "2/3").
(Previously: no existía comiteMemberIndex en ningún tipo)

## REMOVED Requirements

None.
