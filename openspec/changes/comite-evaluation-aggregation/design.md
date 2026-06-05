# Design: Agregación de evaluaciones de comité (3 miembros)

## Technical Approach

Agregar columna `COMITE_MEMBER_INDEX` (1-3) en `t_evaluation`, cambiar lógica de creación para permitir múltiples evaluaciones COMITE, modificar `getPracticeEvaluationStatus` y `updatePracticeGrade` para agregar scores promediando por criterio. Frontend: selector de miembro en modal, progreso "X/3" en tabla.

## Architecture Decisions

| Decisión | Opción elegida | Alternativas | Razón |
|----------|---------------|--------------|-------|
| Cómo distinguir miembros | Columna nullable `COMITE_MEMBER_INDEX` | Tabla separada `t_evaluation_committee` | Mínimo impacto: 1 columna vs nueva tabla + joins. El score se calcula igual |
| Cuándo marcarlo completado | Al llegar a 3 evaluaciones COMITE | Cuando todos los miembros tengan una | El comité siempre tiene 3 miembros |
| Agregación de scores | Promedio por `evaluation_criteria_id`, luego suma para total | Suma total lisa y llana | Cada miembro evalúa independientemente; el promedio por criterio refleja el consenso |
| Selector en frontend | Tabs/botones "Miembro #1, #2, #3" dentro del modal | 3 modales separados | Mejor UX: mismo flujo sin cerrar/abrir |

## Data Flow

```
EvaluationsList (tabla)
  ↓ click "COMITE Pendiente" o badge de progresa
  ↓ pasa practiceId, evaluatorType='COMITE'
EvaluationModal
  ↓ muestra selector de miembro (1, 2 o 3) + criterios
  ↓ al enviar: POST /api/evaluations { ..., comiteMemberIndex: N }
Backend createEvaluation
  ↓ guarda en t_evaluation con COMITE_MEMBER_INDEX = N
  ↓ ejecuta updatePracticeGrade()
    ├─ cuenta evaluaciones COMITE para la práctica
    ├─ si < 3 → status = partial, no calcula finalGrade
    └─ si = 3 → promedia scores por criteria_id entre las 3 evaluaciones
                → suma promedios = totalScore COMITE
                → calcula GRADE ponderado con weights
                → status = completed
```

## File Changes

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `backend/src/controllers/evaluation.controller.ts` | Modificar | `createEvaluation`: aceptar `comiteMemberIndex`, verificar duplicado por índice. `getPracticeEvaluationStatus`: agregar multi-eval COMITE. `updatePracticeGrade`: agregar lógica de 3 evaluaciones |
| `backend/src/routes/evaluation.routes.ts` | Modificar | Validar `comiteMemberIndex` requerido para COMITE |
| `src/features/evaluations/types/index.ts` | Modificar | Agregar `comiteMemberIndex` a `CreateEvaluationPayload` y `Evaluation`. Cambiar `EvaluationStatus.evaluations.COMITE` para incluir `completedCount` |
| `src/features/evaluations/services/evaluationService.ts` | Modificar | Agregar `comiteMemberIndex` al payload de create |
| `src/features/evaluations/hooks/useEvaluations.ts` | Modificar | Pasar `comiteMemberIndex` desde el modal |
| `src/features/evaluations/components/EvaluationModal.tsx` | Modificar | Agregar selector de miembro (tabs/botones 1,2,3) cuando evaluatorType es COMITE |
| `src/pages/Evaluations/EvaluationsList.tsx` | Modificar | Columna COMITE mostrar progreso "2/3" y badges por miembro |
| `DB-postgres.sql` | Documentar | Actualizar referencia de `chk_score_range` a 1-10 |

## Interfaces / Contracts

### Backend - CreateEvaluationPayload (nuevos campos)

```typescript
interface CreateEvaluationData {
  professionalPracticeId: number;
  evaluatorType: 'INSTITUCIONAL' | 'ACADEMICO' | 'COMITE';
  comiteMemberIndex?: 1 | 2 | 3;  // NUEVO: solo para COMITE
  evaluatorId?: number;
  evaluatorName: string;
  evaluatorCi?: string;
  observations?: string;
  items: EvaluationDetail[];
}
```

### Backend - EvaluationStatus (cambiado COMITE)

```typescript
// Antes:
COMITE: { completed: boolean; score: number; evaluatorName: string; evaluationId?: number }

// Después:
COMITE: {
  completed: boolean;
  score: number;
  completedCount: string;  // "1/3", "2/3" o "3/3"
  members: Array<{
    memberIndex: 1 | 2 | 3;
    score: number;
    evaluatorName: string;
    evaluationId: number;
  }>;
}
```

### DB Migration

```sql
ALTER TABLE t_evaluation
  ADD COLUMN COMITE_MEMBER_INDEX INT DEFAULT NULL;

ALTER TABLE t_evaluation
  ADD CONSTRAINT chk_comite_member_index
  CHECK (
    (EVALUATOR_TYPE = 'COMITE' AND COMITE_MEMBER_INDEX BETWEEN 1 AND 3)
    OR
    (EVALUATOR_TYPE != 'COMITE' AND COMITE_MEMBER_INDEX IS NULL)
  );

ALTER TABLE t_evaluation_detail
  DROP CONSTRAINT chk_score_range;

ALTER TABLE t_evaluation_detail
  ADD CONSTRAINT chk_score_range
  CHECK (SCORE >= 1 AND SCORE <= 10);
```

## Testing Strategy

| Capa | Qué probar | Cómo |
|------|-----------|------|
| Backend | Crear 3 evaluaciones COMITE para misma práctica | Postman/curl, verificar 201 |
| Backend | Status muestra "3/3" y promedios correctos | GET status y verificar scores |
| Backend | Rechazar duplicado del mismo miembro | POST mismo índice → 400 |
| Frontend | Selector de miembro visible solo para COMITE | Abrir modal con cada tipo |
| Frontend | Crear evaluación COMITE #1, #2, #3 | Flujo completo |

## Open Questions

- [ ] ¿Los miembros del comité se autentican individualmente o un admin crea las 3 evaluaciones? (Asumimos admin)
- [ ] ¿Hay límite de tiempo entre evaluaciones? (Asumimos que no)
