## Exploration: Evaluation Freeze/Unfreeze UI

### Current State

The freeze/unfreeze feature exists in the backend (3 endpoints) and has partial frontend wiring. The backend enforces frozen state on create/update/delete, but the frontend has **significant gaps** — no visual indicators for frozen state, no read-only mode in the modal when frozen, and the "Descongelar" action is always visible regardless of freeze status.

### Freeze-Related UI Elements

| Element | File | Line | Description | Has onClick? |
|---------|------|------|-------------|-------------|
| **"Cerrar Actas" button** | `src/features/evaluations-culmination/components/EvaluationActions.tsx` | 45-54 | LockIcon + "Cerrar Actas" button, disabled when `isReadOnly` | ✅ `onFreezeAll` |
| **"Descongelar" dropdown** | `src/pages/EvaluationsAndCulmination/EvaluationsAndCulmination.tsx` | 203 | ActionDropdown item, always visible for all practices | ✅ `hook.handleUnfreeze(practice.practiceId)` |
| **Freeze audit color** | `src/features/evaluations-culmination/components/AuditHistoryModal.tsx` | 22-23 | Colors freeze/unfreeze audit entries (blue/green) | N/A (display) |
| **EvaluationCell** | `src/features/evaluations-culmination/components/EvaluationCell.tsx` | 25-72 | Shows completed/pending state — **NO frozen indicator** | ✅ (but no frozen awareness) |

### Freeze-Related API Calls (Frontend Service)

| Method | File | Line | Endpoint | Request Body |
|--------|------|------|----------|-------------|
| `freezeBatch(practiceIds)` | `src/features/evaluations/services/evaluationService.ts` | 190-201 | `POST /evaluations/freeze` | `{ practiceIds: number[] }` |
| `unfreeze(evaluationId, reason)` | `src/features/evaluations/services/evaluationService.ts` | 203-210 | `POST /evaluations/:id/unfreeze` | `{ reason: string }` |
| `unfreezePractice(practiceId, reason)` | `src/features/evaluations/services/evaluationService.ts` | 212-219 | `POST /evaluations/unfreeze-practice` | `{ practiceId, reason }` |

### Hook Logic (useEvaluationsCulmination)

| Handler | Line | Behavior |
|---------|------|----------|
| `handleFreezeAll` | 607-633 | Filters `evaluationStatus === 'completed'` practices, calls `freezeBatch` with confirm dialog |
| `handleUnfreeze` | 527-544 | Shows confirm dialog, calls `unfreezePractice` with hardcoded reason `'Corrección administrativa'` |

### Backend Freeze/Unfreeze Endpoints

| Endpoint | Controller Line | What It Does |
|----------|----------------|-------------|
| `POST /freeze` | 1419-1490 | Sets `FROZEN_AT` on evaluations where it's null. Batch by practiceIds. Audit logs. |
| `POST /:id/unfreeze` | 1496-1573 | Sets `UNFROZEN_AT` + `UNFREEZE_REASON` + `UNFREEZE_AUTHORIZED_BY`. Validates: must be frozen, must not be already unfrozen, reason min 10 chars. |
| `POST /unfreeze-practice` | 1579-1650 | Unfreeze ALL frozen evaluations for a practice. Same validations. |

### Backend Freeze Guards (Write Protection)

| Operation | Controller Line | Guard Logic |
|-----------|----------------|-------------|
| **Create evaluation** | 410-424 | Blocks if ANY evaluation for the practice has `FROZEN_AT` set |
| **Update evaluation** | 546-558 | Blocks if `FROZEN_AT && !UNFROZEN_AT` |
| **Delete evaluation** | 656-668 | Blocks if `FROZEN_AT && !UNFROZEN_AT` |

### Missing Connections (GAPS)

#### 1. No Frozen Status Indicator in UI
- `PracticeWithEvaluations` type (`types/index.ts` line 49-97) has **no `frozenAt` field**
- `EvaluationSummary` type has **no frozen indicator**
- `EvaluationCell` shows completed evaluations with edit/view buttons but **no lock icon** for frozen ones
- No badge or visual cue distinguishes frozen from unfrozen evaluations

#### 2. EvaluationModal Has NO Read-Only Mode for Frozen State
- `EvaluationModal` props (`EvaluationModal.tsx` line 43-52) have **no `frozen` or `isReadOnly` prop**
- Modal always shows editable form (sliders, inputs, submit button)
- Backend blocks the save with 403, but user sees a fully editable form — **UX is broken**
- Submit button is only disabled for `loading`, empty criteria, or unchecked confirmation (line 674)

#### 3. "Descongelar" Action Always Visible
- `EvaluationsAndCulmination.tsx` line 203: "Descongelar" appears in the dropdown for **every practice**
- No conditional rendering based on freeze status
- Should only show when practice evaluations are actually frozen

#### 4. No Frozen Status Filter
- `EvaluationFilters` (`EvaluationFilters.tsx`) has no "frozen" filter option
- `PracticeFilters` type (`types/index.ts` line 144-153) has no frozen status field

#### 5. `unfreeze` (Single Evaluation) Never Used
- `evaluationService.unfreeze(evaluationId, reason)` exists but is **never called** from any hook or component
- Only `unfreezePractice` (bulk per practice) is wired

#### 6. No Backend Endpoint to Get Frozen Status
- No `GET /evaluations/frozen-status` or similar endpoint
- Frontend has no way to know which evaluations are frozen without inferring from audit history

### Recommendation

**Approach: Minimal-invasive fix** — Add frozen status to the data flow and add read-only mode to the modal.

1. **Backend**: Include `FROZEN_AT` and `UNFROZEN_AT` in the practice list response (the `getPracticeEvaluations` endpoint)
2. **Types**: Add `frozenAt: string | null` to `PracticeWithEvaluations` and `EvaluationSummary`
3. **EvaluationCell**: Show a lock icon when evaluation is frozen
4. **EvaluationModal**: Accept `isFrozen` prop, disable all inputs when true
5. **ActionDropdown**: Conditionally show "Descongelar" only when `frozenAt !== null`
6. **EvaluationFilters**: Add frozen status filter option

### Risks

- Backend practice list query may not currently SELECT `FROZEN_AT` — need to verify the query in `getPracticeEvaluations`
- The `unfreeze` single-evaluation endpoint exists but is orphaned — could clean up or leave as future use
- Hardcoded reason `'Corrección administrativa'` in `handleUnfreeze` should eventually be a user input

### Ready for Proposal

**Yes** — The gaps are clear, the fix is well-scoped, and the backend already supports everything needed. The primary work is threading `frozenAt` through the data layer and adding conditional UI logic.
