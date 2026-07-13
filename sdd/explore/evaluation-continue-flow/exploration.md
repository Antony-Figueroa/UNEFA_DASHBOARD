## Exploration: Evaluation Continue Flow

### Current State

The evaluation system manages three evaluation types for each professional practice:
- **INSTITUCIONAL** (40% weight) - Evaluación del tutor institucional
- **ACADEMICO** (30% weight) - Evaluación del tutor académico  
- **COMITE** (30% weight) - Evaluación del comité evaluador (3 miembros)

**Current UX Flow:**
1. User opens Evaluations page (`/evaluations-culmination`)
2. For each practice, 3 evaluation cells are displayed (Institutional, Academic, Committee)
3. User clicks on a cell → opens `EvaluationModal`
4. User fills form, scores criteria, confirms, and saves
5. **After save:**
   - If all 3 evaluation types are completed → shows completion modal ("Finalizar y Congelar" or "Continuar Editando")
   - If not all completed → **just closes modal and refreshes list** (no guidance on what to do next)
6. User must manually navigate back to the list and click the next pending evaluation

**Pain Point:** After saving an evaluation, the user gets no guidance on which evaluation to do next. They must:
- Remember which evaluations are pending
- Navigate back to the list
- Find the correct cell to click
- This is especially confusing for COMITE (3 members) where the flow is less obvious

### Affected Areas

- `src/features/evaluations/components/EvaluationModal.tsx` — Main evaluation form modal; needs "continue to next" logic
- `src/features/evaluations-culmination/components/EvaluationCell.tsx` — Evaluation cell buttons; may need visual updates
- `src/features/evaluations-culmination/hooks/useEvaluationsCulmination.ts` — Hook managing evaluation modal state
- `src/pages/EvaluationsAndCulmination/EvaluationsAndCulmination.tsx` — Page orchestrating the evaluation flow
- `backend/src/controllers/evaluation.controller.ts` — `getPracticeEvaluationStatus` endpoint (already provides completion status)

### Evaluation Types and Their Relationships

**Data Model:**
- `t_evaluation` table: Stores each evaluation with `EVALUATOR_TYPE` (INSTITUCIONAL/ACADEMICO/COMITE)
- `t_evaluation_detail` table: Stores individual criteria scores for each evaluation
- `t_evaluation_criteria` table: Defines criteria per evaluator type (20 criteria per type)
- `COMITE_MEMBER_INDEX` field (1, 2, 3) distinguishes committee members

**Completion Logic (backend):**
- INSTITUCIONAL: Completed when 1 evaluation exists for this type
- ACADEMICO: Completed when 1 evaluation exists for this type
- COMITE: Completed when `committeeMinMembers` (default 3) evaluations exist

**Status Calculation:**
```typescript
// From evaluation.controller.ts getPracticeEvaluationStatus
const completedCount = Object.values(statusMap).filter(s => s.completed).length;
let evaluationStatus = 'pending';
if (completedCount === totalEvaluatorTypes) evaluationStatus = 'completed';
else if (completedCount > 0) evaluationStatus = 'partial';
```

**No Defined Order:** The system has no concept of "evaluation order" or "next evaluation". All three types can be done in any sequence. The weights are:
- INSTITUCIONAL: 0.40
- ACADEMICO: 0.30
- COMITE: 0.30

### Existing "Next Evaluation" Logic

**None exists.** The current flow in `EvaluationModal.tsx` (lines 426-441):
```typescript
// After any save
const status = await evaluationService.getDetailedPracticeStatus(practiceId);
if (status.evaluationStatus === 'completed') {
  // Show completion modal
  setCompletionReason(isComiteMode ? 'committee' : 'all');
  setShowCompletionModal(true);
} else {
  // Just close modal and refresh
  reset();
  setConfirmed(false);
  onClose();
}
```

### Current UX Pain Points

1. **No guidance after save:** User saves evaluation → modal closes → must manually find next pending evaluation
2. **COMITE complexity:** Committee has 3 members; after saving member 1, user must remember to do members 2 and 3
3. **No visual indicator of remaining work:** The list shows status but doesn't highlight "what's next"
4. **Completion modal is too late:** Only shows when ALL evaluations are done, not after each save
5. **No sequential flow:** User might forget to do all evaluations for a practice

### Approaches

1. **Post-Save "Continue" Modal** — After each save, show a modal asking "Continue to next evaluation?"
   - Pros: Clear guidance, minimal UI changes, leverages existing `getDetailedPracticeStatus`
   - Cons: Additional modal layer, may feel repetitive
   - Effort: Low

2. **Inline "Next Evaluation" Panel** — After save, replace modal content with "Next evaluation" options
   - Pros: Seamless flow, no extra modal
   - Cons: More complex state management, harder to implement
   - Effort: Medium

3. **Auto-Open Next Evaluation** — After save, automatically open the next pending evaluation modal
   - Pros: Fastest workflow, no user decision needed
   - Cons: May surprise user, harder to cancel flow
   - Effort: Medium

4. **Progress Tracker in Modal** — Add a step indicator showing "1/3 evaluations complete"
   - Pros: Visual feedback, clear progress
   - Cons: Doesn't solve the "what's next" problem directly
   - Effort: Low

### Recommendation

**Approach 1: Post-Save "Continue" Modal** is recommended because:
- Leverages existing `getDetailedPracticeStatus` endpoint (already called after save)
- Minimal changes to existing `EvaluationModal.tsx`
- Clear user choice: "Continue to next evaluation" or "Close and return to list"
- Can show which evaluations are pending (Institutional, Academic, Committee)
- Follows existing pattern of `UnifiedDialog` (already used for completion modal)

**Implementation Details:**
1. After saving, if `evaluationStatus !== 'completed'`, show a new modal asking:
   - "Evaluación guardada exitosamente"
   - "Evaluaciones pendientes: [list]"
   - Buttons: "Continuar con la siguiente" / "Cerrar"
2. If user clicks "Continue", keep modal open and switch to next evaluation type
3. If user clicks "Close", close modal and refresh list (current behavior)

### Risks

1. **COMITE member switching:** After saving committee member 1, the modal should offer to continue to member 2 (not a different evaluation type)
2. **State complexity:** Need to manage which evaluation type/member is "next" based on current status
3. **User confusion:** If user cancels mid-flow, they might lose context of which evaluations are pending

### Ready for Proposal

**Yes** — The exploration is complete. The orchestrator should:
1. Propose adding a "continue to next evaluation" modal after each save
2. Define the exact flow for INSTITUCIONAL → ACADEMICO → COMITE (or any order)
3. Handle COMITE member sequencing (1 → 2 → 3)
4. Ensure the modal shows which evaluations are pending
5. Allow user to cancel the flow at any point