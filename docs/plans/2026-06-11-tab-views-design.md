# Tab Views: Reducir Carga Visual en Formularios y Páginas Densas

> **Fecha:** 2026-06-11
> **Estado:** Diseño aprobado, listo para implementación

---

## 1. Problema

El dashboard tiene:

- **Forms con ~25+ campos** en una sola vista (StudentModal, TutorModal, InstitutionModal). Muchos campos son opcionales, crean ruido visual.
- **Páginas que mezclan features distintos** en una sola vista (EvaluationsAndCulmination).
- **8 páginas con tabs inline duplicados** (patrón "Activas/Inactivas") que deberían usar el componente `<Tabs>` compartido.
- **Componente `<Tabs>` infrautilizado** — solo se usa en Institutions.

---

## 2. Enfoque de Diseño

**Dirección estética:** Academic Precision — jerarquía de información primero, elegancia discreta. Usa colores existentes del brand UNEFA con organización espacial deliberada.

**Anclaje de diferenciación:** Indicador de tab animado (spring motion en underline) + badges contextuales con conteos ("12 estudiantes", "3 pendientes").

**DFII:** 13/15 — Impacto alto, fit contextual perfecto, riesgos mínimos de consistencia.

---

## 3. Plan de Implementación

### Fase 0 — Fundación (Componentes)

| # | Archivo | Cambio |
|---|---------|--------|
| 0.1 | `src/components/ui/tabs/Tabs.tsx` | Mejorar: animación spring en underline, badges opcionales, variante `modal` más compacta |
| 0.2 | `src/hooks/useTabs.ts` | Nuevo hook: estado activo, persistencia opcional, API `{ activeTab, setActiveTab, tabProps, panelProps }` |

### Fase 1 — Forms Sobrecargados (Alto Impacto UX)

| # | Archivo | Tabs propuestos |
|---|---------|-----------------|
| 1.1 | `src/features/persons/components/PersonFormFields.tsx` | Sin tabs. Dividir en `<fieldset>` semánticos: Identidad, Contacto, Dirección, Adicionales |
| 1.2 | `src/features/students/components/StudentModal.tsx` | Datos Personales \| Dirección \| Académico |
| 1.3 | `src/features/tutors/components/TutorModal.tsx` | Datos Personales \| Laboral \| Asignaciones |
| 1.4 | `src/features/institutions/components/InstitutionModal.tsx` | Datos Generales \| Dirección Fiscal \| Configuración |

### Fase 2 — Páginas Densas

| # | Archivo | Tabs propuestos |
|---|---------|-----------------|
| 2.1 | `src/pages/EvaluationsAndCulmination/EvaluationsAndCulmination.tsx` | Evaluaciones \| Culminación |
| 2.2 | `src/pages/Evaluations/EvaluationsList.tsx` | Institucional \| Académica \| Comité |
| 2.3 | `src/pages/Student/StudentProfile.tsx` | General \| Académico \| Contacto |
| 2.4 | `src/pages/Tutor/TutorProfile.tsx` | Personal \| Profesional |

### Fase 3 — Refactor Tabs Inline

Reemplazar patrón manual "Activas/Inactivas" por `<Tabs>` compartido en:

- `src/pages/Period/period.tsx`
- `src/pages/Enrollment/Enrollment.tsx`
- `src/pages/Students/students.tsx`
- `src/pages/Tutors/tutors.tsx`
- `src/pages/Careers/careers.tsx`
- `src/pages/PreEnrollment/PreEnrollment.tsx`
- `src/pages/Tracking/VisitRegistration.tsx`
- `src/pages/Config/UserManagementPage.tsx`

---

## 4. Dudas por Resolver

1. **Orden de fases:** ¿Forms primero (Fase 1 — más impacto UX diario) o páginas densas primero (Fase 2 — más visible)?
   - _Decisión tentativa:_ Fase 1 primero. Los modales de Student/Tutor se usan constantemente.

2. **PersonFormFields:** ¿Dividir en `<fieldset>` sin tabs internos (separación visual suave) o agregar tabs ahí también?
   - _Decisión tentativa:_ Solo `<fieldset>` con bordes/espaciado. PersonFormFields es un sub-componente compartido; tabs ahí agregaría complejidad innecesaria.

3. **Componente Tabs:** ¿Mejorar el `<Tabs>` existente in-place o crear `<TabsInModal>` separado para modales?
   - _Decisión tentativa:_ Mejorar in-place con variante `modal`. Evita duplicación.

4. **Persistencia de tab activo:** ¿Recordar último tab visitado por usuario (localStorage) o siempre resetear al primero?
   - _Decisión tentativa:_ Resetear al primero por simplicidad. Evaluar después si hay quejas.

5. **Animación de transición:** ¿Framer Motion spring en el indicador underline o solo transición CSS simple?
   - _Decisión tentativa:_ CSS transition (`transition-all duration-300`) — suficiente, sin sobrecargar de motion. Framer Motion solo si el diseño lo pide.

---

## 5. Próximos Pasos

1. Resolver dudas pendientes
2. Implementar Fase 0 (mejorar `<Tabs>`, crear `useTabs`)
3. Implementar Fase 1 (forms)
4. Implementar Fase 2 (páginas densas)
5. Implementar Fase 3 (refactor tabs inline)
6. Verificar: `npm run build` sin errores
7. Prueba visual en navegador
