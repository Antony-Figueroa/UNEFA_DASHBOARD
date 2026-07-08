# Tasks: Ver Reprobados (reprobados-view)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~620 (code ~420 + tests ~200) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | Slice A (Part 1 + tests) → Slice B (Part 2 + Part 3 + tests) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| A | Root backend bug fix (list includes REPROBADO + result compute) + backend unit tests | PR 1 | Base: main; standalone, unblocks downstream |
| B | Resultado filter + Reprobados tab + reverse-failed endpoint/hook/service + frontend/integration tests | PR 2 | Base: PR 1 branch; depends on Part 1 result field |

## Part 1 — Backend bug fix (root cause)

- [x] 1.1 `backend/src/controllers/practices-evaluations.controller.ts:66` — replace single-status filter with `.in('PRACTICES_STATUS', [INSCRITO, REPROBADO])`. (spec: practices-evaluations / Unified list includes manual reprobados)
- [x] 1.2 `backend/src/controllers/practices-evaluations.controller.ts:197-201` — force `practiceResult='failed'` when status===REPROBADO before grade logic. (spec: same)
- [x] 1.3 `backend/src/controllers/practices-evaluations.controller.ts` — ensure `result` and `practicesStatus` are returned per practice. (spec: same)

## Part 2 — Resultado filter (frontend)

- [x] 2.1 `src/pages/EvaluationsAndCulmination/EvaluationsAndCulmination.tsx:582` — add `evaluations` branch to `extraFilters` ternary rendering `CustomSelect` from `RESULT_OPTIONS.filter(o=>o.value!=='all')`, wired to `hook.updateFilter('result', v)`. (spec: evaluations-filters / Resultado filter in Evaluaciones tab)
- [x] 2.2 Verify service already sends `result` param (`evaluationsCulminationService` line 66) — no change; document confirmation. (spec: evaluations-filters)

## Part 3 — Reprobados tab + reverse-failed endpoint

- [x] 3.1 `backend/src/controllers/evaluation.controller.ts` — add `reverseFailedPractice` (mirror `reverseCulmination`): guards reason/resolutionNumber (400), userId (401), 404 missing, 400 CULMINADO/RETIRADO, update INSCRITO + `auditCreate(REVERSE_FAILED)`. (spec: reverse-failed / POST reverse-failed)
- [x] 3.2 `backend/src/routes/evaluation.routes.ts:47` — register `router.post('/:practiceId/reverse-failed', requirePermission('evaluations:edit'), reverseFailedPractice)`. (spec: reverse-failed)
- [x] 3.3 `src/features/evaluations-culmination/services/evaluationsCulminationService.ts` — add `reverseFailed(practiceId, reason, resolutionNumber)` calling `POST /evaluations/:id/reverse-failed`. (spec: reverse-failed)
- [x] 3.4 `src/features/evaluations-culmination/hooks/useEvaluationsCulmination.ts` — add `handleReverseFailed(practiceId, studentName)` using `UnifiedDialog` to collect reason+resolutionNumber, then service call + `fetchPractices()`. (spec: reverse-failed)
- [x] 3.5 `src/pages/EvaluationsAndCulmination/EvaluationsAndCulmination.tsx:44` — add `{ id:'reprobados', label:'Reprobados' }` to `EVAL_TABS`. (spec: reprobados-view / Dedicated Reprobados tab)
- [x] 3.6 `src/pages/.../EvaluationsAndCulmination.tsx` — add `case 'reprobados'` to `renderTabContent` + `renderReprobadosTab()` filtering `filteredPractices.filter(p=>p.result==='failed')` with Ver Auditoría (always) + Revertir (only `practicesStatus===REPROBADO`). (spec: reprobados-view)

## Tests (Strict TDD — required)

- [x] T.1 `backend/src/controllers/practices-evaluations.controller.test.ts` — REPROBADO included + result='failed' (1 eval); INSCRITO passing→approved; pre-inscrito excluded. (spec: practices-evaluations) [implemented as tests/modules/practices-evaluations-reprobado.test.ts]
- [x] T.2 `backend/src/.../evaluation.routes.reverse-failed.test.ts` — 200 REPROBADO→INSCRITO; 400 CULMINADO; 400 RETIRADO; 400 missing reason; 401 no auth; 404 missing. (spec: reverse-failed)
- [x] T.3 `src/features/evaluations-culmination/hooks/useEvaluationsCulmination.test.ts` — `handleReverseFailed` calls service; failed-only derivation. (spec: reprobados-view, reverse-failed)
- [x] T.4 `src/.../EvaluationFilters.test.tsx` — Resultado CustomSelect renders when `activeTab==='evaluations'`. (spec: evaluations-filters)
- [x] T.5 `src/pages/.../EvaluationsAndCulmination.test.tsx` — Reprobados tab shows failed; Revertir only on REPROBADO rows. (spec: reprobados-view)

## Implementation Order
Part 1 first (root bug — unblocks `result==='failed'` for all downstream). Then Part 2 (filter reuses result). Then Part 3 (tab + endpoint). Tests T.1/T.2 with their code, T.3-T.5 with Parts 2-3. Split into Slice A (1.1-1.3, T.1) and Slice B (2.1-3.6, T.2-T.5) due to >400-line budget.
